/**
 * @file clv-calculation.service.ts
 * @description Customer Lifetime Value (CLV) Calculation Service
 *
 * PURPOSE:
 * - Calculates historical and predictive CLV for customers
 * - Segments customers based on value and behavior
 * - Provides insights for customer retention strategies
 * - Enables data-driven marketing investment decisions
 *
 * CLV METHODOLOGY:
 * - Historical CLV: Total revenue from customer to date
 * - Predictive CLV: Forecasted future value based on RFM and cohort data
 * - Formula: CLV = (Average Order Value × Purchase Frequency × Customer Lifespan)
 *
 * CUSTOMER SEGMENTATION:
 * - NEW: < 30 days, single purchase
 * - ACTIVE: Regular purchases within 90 days
 * - HIGH_VALUE: Top 20% by revenue
 * - AT_RISK: No purchase in 90-180 days
 * - CHURNED: No purchase > 180 days
 * - VIP: Top 5% by CLV + frequency
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Entities
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { BusinessEvent, BusinessEventType, CustomerSegment } from '../entities/business-event.entity';
import { BusinessEventPublisher } from './business-event-publisher.service';

/**
 * Customer Lifetime Value Metrics
 */
export interface ICustomerCLVMetrics {
  /** Customer user ID */
  userId: number;
  /** Customer email for reference */
  email: string;
  /** Customer name */
  name: string;
  /** Total historical revenue from this customer */
  historicalCLV: number;
  /** Predicted future value over 24 months */
  predictedCLV: number;
  /** Total CLV (historical + predicted) */
  totalCLV: number;
  /** Recency (days since last order) */
  recency: number;
  /** Purchase frequency (orders per month) */
  frequency: number;
  /** Monetary (average order value) */
  monetary: number;
  /** Total order count */
  orderCount: number;
  /** First order date */
  firstOrderDate: Date;
  /** Last order date */
  lastOrderDate: Date | null;
  /** Customer lifespan in days */
  lifespanDays: number;
  /** RFM Score (1-5 scale, 5 being best) */
  rfmScore: number;
  /** Current customer segment */
  segment: CustomerSegment;
  /** Churn probability (0-1) */
  churnProbability: number;
  /** Recommended retention action */
  retentionAction: string;
  /** Last calculated timestamp */
  calculatedAt: Date;
}

/**
 * CLV Aggregated Analytics
 */
export interface ICLVAnalytics {
  /** Total customers analyzed */
  totalCustomers: number;
  /** Average CLV across all customers */
  averageCLV: number;
  /** Median CLV */
  medianCLV: number;
  /** Total customer lifetime value */
  totalCLV: number;
  /** CLV by segment */
  bySegment: Record<CustomerSegment, {
    count: number;
    averageCLV: number;
    totalCLV: number;
    percentageOfTotal: number;
  }>;
  /** Top 20% customers value contribution */
  top20PercentContribution: number;
  /** Predicted churn risk summary */
  churnRisk: {
    highRisk: number;    // Count of customers
    mediumRisk: number;
    lowRisk: number;
    totalAtRisk: number;
    potentialLostRevenue: number;
  };
  /** Customer acquisition trends */
  acquisitionTrends: Array<{
    cohortMonth: string;
    newCustomers: number;
    averageCLV: number;
    retentionRate: number;
  }>;
}

/**
 * Customer Segment Update
 */
export interface ISegmentUpdate {
  userId: number;
  previousSegment: CustomerSegment;
  newSegment: CustomerSegment;
  clvChange: number;
  reason: string;
}

/**
 * CLV Calculation Service
 *
 * Comprehensive Customer Lifetime Value calculation and segmentation engine.
 * Provides both historical and predictive CLV metrics for business intelligence.
 *
 * @swagger
 * @ApiTags('Business Intelligence - CLV Calculation')
 */
@Injectable()
export class CLVCalculationService {
  private readonly logger = new Logger(CLVCalculationService.name);

  /** CLV prediction horizon in months */
  private readonly PREDICTION_HORIZON_MONTHS = 24;

  /** Segment thresholds (customizable per business) */
  private readonly SEGMENT_THRESHOLDS = {
    NEW_CUSTOMER_DAYS: 30,
    ACTIVE_PURCHASE_DAYS: 90,
    AT_RISK_DAYS: 180,
    CHURNED_DAYS: 365,
    HIGH_VALUE_PERCENTILE: 80,  // Top 20%
    VIP_PERCENTILE: 95,          // Top 5%
    MINIMUM_VIP_ORDERS: 5,
  };

  /** RFM scoring bins (quintiles) */
  private readonly RFM_BINS = {
    RECENCY: [7, 30, 90, 180], // Days
    FREQUENCY: [1, 3, 6, 12],  // Orders
    MONETARY: [50, 150, 500, 1500], // SYP thousands
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(BusinessEvent)
    private readonly businessEventRepository: Repository<BusinessEvent>,

    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('💰 CLV Calculation Service initialized');
  }

  /**
   * Calculate CLV for a specific customer
   *
   * @param userId - Customer user ID
   * @returns Promise<ICustomerCLVMetrics> - Comprehensive CLV metrics
   */
  async calculateCustomerCLV(userId: number): Promise<ICustomerCLVMetrics> {
    this.logger.debug(`Calculating CLV for user ${userId}`);

    try {
      // Fetch user and order data
      const user = await this.userRepository.findOne({ where: { id: userId } })!;
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      const orders = await this.orderRepository.find({
        where: {
          user: { id: userId },
          status: 'completed',
        },
        order: { created_at: 'ASC' },
      });

      // Calculate metrics
      const metrics = await this.computeCLVMetrics(user, orders);

      // Publish CLV calculated event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CLV_CALCULATED,
        userId,
        sessionId: null,
        aggregateId: `user_${userId}`,
        aggregateType: 'user',
        sourceModule: 'business-intelligence',
        eventPayload: {
          historicalCLV: metrics.historicalCLV,
          predictedCLV: metrics.predictedCLV,
          totalCLV: metrics.totalCLV,
          rfmScore: metrics.rfmScore,
          churnProbability: metrics.churnProbability,
          customerSegment: metrics.segment,
        },
        metadata: {
          recency: metrics.recency,
          frequency: metrics.frequency,
          monetary: metrics.monetary,
        },
        revenueAmount: metrics.totalCLV,
        currency: 'SYP',
      });

      return metrics;
    } catch (error: unknown) {
      this.logger.error(`Failed to calculate CLV for user ${userId}: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Calculate CLV for all customers (batch operation)
   *
   * @param minOrders - Minimum orders to include (default: 1)
   * @returns Promise<ICustomerCLVMetrics[]> - Array of customer CLV metrics
   */
  async calculateAllCustomersCLV(minOrders: number = 1): Promise<ICustomerCLVMetrics[]> {
    this.logger.log(`Starting batch CLV calculation for all customers with ${minOrders}+ orders`);
    const startTime = Date.now();

    try {
      // Get all users with orders
      const usersWithOrders = await this.userRepository
        .createQueryBuilder('u')
        .innerJoin('u.orders', 'o')
        .where('o.status = :status', { status: 'completed' })
        .groupBy('u.id')
        .having('COUNT(o.id) >= :minOrders', { minOrders })
        .select('u.id')
        .getRawMany();

      this.logger.log(`Found ${usersWithOrders.length} customers to analyze`);

      // Process in batches to avoid memory issues
      const batchSize = 100;
      const results: ICustomerCLVMetrics[] = [];

      for (let i = 0; i < usersWithOrders.length; i += batchSize) {
        const batch = usersWithOrders.slice(i, i + batchSize);
        const batchPromises = batch.map(u => this.calculateCustomerCLV(u.u_id));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        this.logger.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersWithOrders.length / batchSize)}`);
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✅ Batch CLV calculation completed in ${duration}s for ${results.length} customers`);

      return results;
    } catch (error: unknown) {
      this.logger.error(`Batch CLV calculation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get CLV analytics summary
   *
   * @returns Promise<ICLVAnalytics> - Aggregated CLV analytics
   */
  async getCLVAnalytics(): Promise<ICLVAnalytics> {
    this.logger.log('Generating CLV analytics summary');

    try {
      // Calculate CLV for all customers
      const allCustomers = await this.calculateAllCustomersCLV();

      // Sort by totalCLV for percentile calculations
      const sortedByValue = [...allCustomers].sort((a, b) => b.totalCLV - a.totalCLV);

      // Calculate aggregates
      const totalCLV = allCustomers.reduce((sum, c) => sum + c.totalCLV, 0);
      const averageCLV = totalCLV / allCustomers.length;
      const medianCLV = sortedByValue[Math.floor(sortedByValue.length / 2)]?.totalCLV || 0;

      // Segment analysis
      const bySegment = this.calculateSegmentAnalytics(allCustomers, totalCLV);

      // Top 20% contribution (Pareto principle)
      const top20Count = Math.ceil(allCustomers.length * 0.2);
      const top20Revenue = sortedByValue
        .slice(0, top20Count)
        .reduce((sum, c) => sum + c.totalCLV, 0);
      const top20PercentContribution = (top20Revenue / totalCLV) * 100;

      // Churn risk analysis
      const churnRisk = this.calculateChurnRisk(allCustomers);

      // Acquisition trends (cohort-based)
      const acquisitionTrends = await this.calculateAcquisitionTrends();

      return {
        totalCustomers: allCustomers.length,
        averageCLV: Math.round(averageCLV),
        medianCLV: Math.round(medianCLV),
        totalCLV: Math.round(totalCLV),
        bySegment,
        top20PercentContribution: Math.round(top20PercentContribution * 10) / 10,
        churnRisk,
        acquisitionTrends,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to generate CLV analytics: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get top customers by CLV
   *
   * @param limit - Number of top customers to return
   * @returns Promise<ICustomerCLVMetrics[]> - Top customers by CLV
   */
  async getTopCustomersByCLV(limit: number = 50): Promise<ICustomerCLVMetrics[]> {
    const allCustomers = await this.calculateAllCustomersCLV();
    return allCustomers
      .sort((a, b) => b.totalCLV - a.totalCLV)
      .slice(0, limit);
  }

  /**
   * Get at-risk customers requiring retention efforts
   *
   * @param minCLV - Minimum CLV to include
   * @returns Promise<ICustomerCLVMetrics[]> - At-risk customers
   */
  async getAtRiskCustomers(minCLV: number = 100): Promise<ICustomerCLVMetrics[]> {
    const allCustomers = await this.calculateAllCustomersCLV();
    return allCustomers.filter(c =>
      c.segment === CustomerSegment.AT_RISK &&
      c.historicalCLV >= minCLV &&
      c.churnProbability > 0.5
    );
  }

  /**
   * Scheduled CLV recalculation job
   * Runs daily at 2 AM to update all customer segments
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledCLVRecalculation(): Promise<void> {
    this.logger.log('🔄 Starting scheduled CLV recalculation');

    try {
      const metrics = await this.calculateAllCustomersCLV();

      // Detect segment changes
      const segmentChanges = await this.detectSegmentChanges(metrics);

      this.logger.log(`✅ Scheduled CLV recalculation completed: ${metrics.length} customers analyzed, ${segmentChanges.length} segment changes`);

      // Emit segment change events for marketing automation
      for (const change of segmentChanges) {
        this.eventEmitter.emit('clv.segment.changed', change);
      }
    } catch (error: unknown) {
      this.logger.error(`Scheduled CLV recalculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Compute comprehensive CLV metrics for a customer
   *
   * @param user - User entity
   * @param orders - Completed orders for the user
   * @returns ICustomerCLVMetrics
   */
  private async computeCLVMetrics(user: User, orders: Order[]): Promise<ICustomerCLVMetrics> {
    const now = new Date();

    // Basic order metrics
    const orderCount = orders.length;
    const firstOrderDate = orders[0]?.created_at || user.createdAt;
    const lastOrderDate = orders[orders.length - 1]?.created_at || null;

    // Historical CLV (total revenue to date)
    const historicalCLV = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // RFM metrics
    const recency = lastOrderDate
      ? Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : 9999;

    const lifespanDays = Math.max(
      1,
      Math.floor((now.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const frequency = (orderCount / lifespanDays) * 30; // Orders per month
    const monetary = orderCount > 0 ? historicalCLV / orderCount : 0;

    // RFM Score (1-5 scale)
    const rfmScore = this.calculateRFMScore(recency, frequency, monetary);

    // Predictive CLV using simplified probabilistic model
    const predictedCLV = this.predictFutureCLV(
      monetary,
      frequency,
      recency,
      lifespanDays,
      rfmScore
    );

    const totalCLV = historicalCLV + predictedCLV;

    // Customer segmentation
    const segment = this.determineCustomerSegment(
      recency,
      orderCount,
      historicalCLV,
      lifespanDays,
      totalCLV
    );

    // Churn probability
    const churnProbability = this.calculateChurnProbability(recency, frequency, rfmScore);

    // Retention recommendation
    const retentionAction = this.determineRetentionAction(segment, churnProbability, totalCLV);

    return {
      userId: user.id,
      email: user.email,
      name: user.fullName || user.email || 'Unknown',
      historicalCLV: Math.round(historicalCLV),
      predictedCLV: Math.round(predictedCLV),
      totalCLV: Math.round(totalCLV),
      recency,
      frequency: Math.round(frequency * 100) / 100,
      monetary: Math.round(monetary),
      orderCount,
      firstOrderDate,
      lastOrderDate,
      lifespanDays,
      rfmScore: Math.round(rfmScore * 10) / 10,
      segment,
      churnProbability: Math.round(churnProbability * 100) / 100,
      retentionAction,
      calculatedAt: now,
    };
  }

  /**
   * Calculate RFM score (1-5 scale)
   * Higher score = better customer
   *
   * @param recency - Days since last order
   * @param frequency - Orders per month
   * @param monetary - Average order value
   * @returns number - RFM score (1.0 to 5.0)
   */
  private calculateRFMScore(recency: number, frequency: number, monetary: number): number {
    // Score each dimension (5 being best)
    const rScore = this.scoreByBins(recency, this.RFM_BINS.RECENCY, true); // Lower is better
    const fScore = this.scoreByBins(frequency, this.RFM_BINS.FREQUENCY, false);
    const mScore = this.scoreByBins(monetary / 1000, this.RFM_BINS.MONETARY, false);

    // Weighted average (Recency weighted more heavily)
    return (rScore * 0.4 + fScore * 0.3 + mScore * 0.3);
  }

  /**
   * Score a value based on quintile bins
   *
   * @param value - Value to score
   * @param bins - Quintile boundaries
   * @param inverse - If true, lower values get higher scores
   * @returns number - Score from 1 to 5
   */
  private scoreByBins(value: number, bins: number[], inverse: boolean = false): number {
    let score = 1;
    for (let i = 0; i < bins.length; i++) {
      if (value > bins[i]) {
        score = i + 2;
      } else {
        break;
      }
    }

    return inverse ? 6 - score : score;
  }

  /**
   * Predict future CLV over prediction horizon
   * Uses simplified probabilistic model based on RFM
   *
   * @param monetary - Average order value
   * @param frequency - Orders per month
   * @param recency - Days since last order
   * @param lifespanDays - Customer lifespan in days
   * @param rfmScore - RFM score
   * @returns number - Predicted future CLV
   */
  private predictFutureCLV(
    monetary: number,
    frequency: number,
    recency: number,
    lifespanDays: number,
    rfmScore: number,
  ): number {
    // Retention probability based on RFM score
    const retentionRate = Math.min(0.95, rfmScore / 5);

    // Adjust for recency (recent customers more likely to return)
    const recencyFactor = recency < 30 ? 1.0 : recency < 90 ? 0.8 : recency < 180 ? 0.5 : 0.2;

    // Expected orders over prediction horizon
    const expectedOrders = frequency * this.PREDICTION_HORIZON_MONTHS * retentionRate * recencyFactor;

    // Predicted revenue with 20% decay factor for uncertainty
    const predictedRevenue = expectedOrders * monetary * 0.8;

    return Math.max(0, predictedRevenue);
  }

  /**
   * Determine customer segment based on behavior and value
   *
   * @param recency - Days since last order
   * @param orderCount - Total completed orders
   * @param historicalCLV - Historical revenue
   * @param lifespanDays - Days as customer
   * @param totalCLV - Total CLV (historical + predicted)
   * @returns CustomerSegment
   */
  private determineCustomerSegment(
    recency: number,
    orderCount: number,
    historicalCLV: number,
    lifespanDays: number,
    totalCLV: number,
  ): CustomerSegment {
    // Churned (no purchase > 1 year)
    if (recency > this.SEGMENT_THRESHOLDS.CHURNED_DAYS) {
      return CustomerSegment.CHURNED;
    }

    // New customer (< 30 days, 1 order)
    if (lifespanDays < this.SEGMENT_THRESHOLDS.NEW_CUSTOMER_DAYS && orderCount === 1) {
      return CustomerSegment.NEW;
    }

    // At-risk (no purchase 90-365 days)
    if (recency > this.SEGMENT_THRESHOLDS.AT_RISK_DAYS) {
      return CustomerSegment.AT_RISK;
    }

    // VIP (top 5% CLV + high frequency)
    if (orderCount >= this.SEGMENT_THRESHOLDS.MINIMUM_VIP_ORDERS) {
      // Would need percentile calculation from all customers
      // Simplified: High CLV + frequent orders
      if (totalCLV > 1000000 && orderCount >= 10) {
        return CustomerSegment.VIP;
      }
    }

    // Active (regular purchases within 90 days)
    if (recency <= this.SEGMENT_THRESHOLDS.ACTIVE_PURCHASE_DAYS) {
      return CustomerSegment.ACTIVE;
    }

    // Default to active
    return CustomerSegment.ACTIVE;
  }

  /**
   * Calculate churn probability (0-1)
   *
   * @param recency - Days since last order
   * @param frequency - Orders per month
   * @param rfmScore - RFM score
   * @returns number - Churn probability (0 = no risk, 1 = high risk)
   */
  private calculateChurnProbability(recency: number, frequency: number, rfmScore: number): number {
    // Base probability from recency
    let churnProb = 0;
    if (recency < 30) churnProb = 0.1;
    else if (recency < 90) churnProb = 0.3;
    else if (recency < 180) churnProb = 0.6;
    else if (recency < 365) churnProb = 0.85;
    else churnProb = 0.95;

    // Adjust for frequency (frequent buyers less likely to churn)
    const frequencyAdjustment = Math.min(0.3, frequency * 0.05);
    churnProb -= frequencyAdjustment;

    // Adjust for RFM score
    const rfmAdjustment = (5 - rfmScore) * 0.1;
    churnProb += rfmAdjustment;

    return Math.max(0, Math.min(1, churnProb));
  }

  /**
   * Determine recommended retention action
   *
   * @param segment - Customer segment
   * @param churnProbability - Churn risk
   * @param totalCLV - Total customer value
   * @returns string - Recommended action
   */
  private determineRetentionAction(
    segment: CustomerSegment,
    churnProbability: number,
    totalCLV: number,
  ): string {
    if (segment === CustomerSegment.VIP) {
      return 'Assign dedicated account manager, exclusive offers';
    }

    if (segment === CustomerSegment.AT_RISK && totalCLV > 50000) {
      return 'Send personalized win-back campaign with 15% discount';
    }

    if (segment === CustomerSegment.CHURNED && totalCLV > 100000) {
      return 'Aggressive re-engagement: 25% discount + free shipping';
    }

    if (segment === CustomerSegment.NEW) {
      return 'Send onboarding email series, product recommendations';
    }

    if (churnProbability > 0.7) {
      return 'Send cart abandonment reminder, limited-time offer';
    }

    if (segment === CustomerSegment.ACTIVE && totalCLV > 200000) {
      return 'Upsell premium products, loyalty program invitation';
    }

    return 'Continue regular marketing cadence';
  }

  /**
   * Calculate segment analytics
   *
   * @param customers - All customer CLV metrics
   * @param totalCLV - Total CLV across all customers
   * @returns Record of segment analytics
   */
  private calculateSegmentAnalytics(
    customers: ICustomerCLVMetrics[],
    totalCLV: number,
  ): Record<CustomerSegment, any> {
    const segments = Object.values(CustomerSegment);
    const analytics: any = {};

    for (const segment of segments) {
      const segmentCustomers = customers.filter(c => c.segment === segment);
      const segmentCLV = segmentCustomers.reduce((sum, c) => sum + c.totalCLV, 0);

      analytics[segment] = {
        count: segmentCustomers.length,
        averageCLV: segmentCustomers.length > 0
          ? Math.round(segmentCLV / segmentCustomers.length)
          : 0,
        totalCLV: Math.round(segmentCLV),
        percentageOfTotal: totalCLV > 0
          ? Math.round((segmentCLV / totalCLV) * 1000) / 10
          : 0,
      };
    }

    return analytics;
  }

  /**
   * Calculate churn risk summary
   *
   * @param customers - All customer CLV metrics
   * @returns Churn risk summary
   */
  private calculateChurnRisk(customers: ICustomerCLVMetrics[]): ICLVAnalytics['churnRisk'] {
    const highRisk = customers.filter(c => c.churnProbability > 0.7);
    const mediumRisk = customers.filter(c => c.churnProbability > 0.4 && c.churnProbability <= 0.7);
    const lowRisk = customers.filter(c => c.churnProbability <= 0.4);

    const atRisk = [...highRisk, ...mediumRisk];
    const potentialLostRevenue = atRisk.reduce((sum, c) => sum + c.historicalCLV, 0);

    return {
      highRisk: highRisk.length,
      mediumRisk: mediumRisk.length,
      lowRisk: lowRisk.length,
      totalAtRisk: atRisk.length,
      potentialLostRevenue: Math.round(potentialLostRevenue),
    };
  }

  /**
   * Calculate acquisition trends by cohort
   *
   * @returns Acquisition trend data
   */
  private async calculateAcquisitionTrends(): Promise<ICLVAnalytics['acquisitionTrends']> {
    // Simplified implementation - would need more sophisticated cohort analysis
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await this.userRepository.find({
      where: {
        createdAt: MoreThan(sixMonthsAgo),
      },
      order: { createdAt: 'ASC' },
    });

    const cohortMap = new Map<string, { users: User[], revenue: number }>();

    for (const user of users) {
      const cohortKey = `${user.createdAt.getFullYear()}-${String(user.createdAt.getMonth() + 1).padStart(2, '0')}`;

      if (!cohortMap.has(cohortKey)) {
        cohortMap.set(cohortKey, { users: [], revenue: 0 });
      }

      cohortMap.get(cohortKey)!.users.push(user);
    }

    const trends: ICLVAnalytics['acquisitionTrends'] = [];

    for (const [cohortMonth, data] of cohortMap.entries()) {
      trends.push({
        cohortMonth,
        newCustomers: data.users.length,
        averageCLV: 0, // Would need order data
        retentionRate: 0, // Would need retention calculation
      });
    }

    return trends.sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth));
  }

  /**
   * Detect segment changes since last calculation
   *
   * @param currentMetrics - Current customer metrics
   * @returns Array of segment change events
   */
  private async detectSegmentChanges(currentMetrics: ICustomerCLVMetrics[]): Promise<ISegmentUpdate[]> {
    const changes: ISegmentUpdate[] = [];

    // Fetch previous segment assignments from business events
    for (const metrics of currentMetrics) {
      const previousEvent = await this.businessEventRepository.findOne({
        where: {
          eventType: BusinessEventType.CLV_CALCULATED,
          userId: metrics.userId,
        },
        order: { createdAt: 'DESC' },
      });

      if (previousEvent && previousEvent.customerSegment !== metrics.segment) {
        changes.push({
          userId: metrics.userId,
          previousSegment: previousEvent.customerSegment!,
          newSegment: metrics.segment,
          clvChange: metrics.totalCLV - (previousEvent.revenueAmount || 0),
          reason: this.determineSegmentChangeReason(previousEvent.customerSegment!, metrics.segment),
        });
      }
    }

    return changes;
  }

  /**
   * Determine reason for segment change
   *
   * @param previousSegment - Previous segment
   * @param newSegment - New segment
   * @returns Reason description
   */
  private determineSegmentChangeReason(previousSegment: CustomerSegment, newSegment: CustomerSegment): string {
    if (newSegment === CustomerSegment.CHURNED) {
      return 'No purchase activity > 365 days';
    }
    if (newSegment === CustomerSegment.AT_RISK && previousSegment === CustomerSegment.ACTIVE) {
      return 'No purchase in 90-180 days';
    }
    if (newSegment === CustomerSegment.VIP) {
      return 'Promoted to VIP status based on CLV and frequency';
    }
    if (newSegment === CustomerSegment.ACTIVE && previousSegment === CustomerSegment.AT_RISK) {
      return 'Re-engaged with recent purchase';
    }
    return 'Segment criteria threshold crossed';
  }
}

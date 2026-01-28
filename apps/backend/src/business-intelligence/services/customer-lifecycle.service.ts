/**
 * @file customer-lifecycle.service.ts
 * @description Customer Lifecycle Management and CLV Calculation Service
 *
 * PURPOSE:
 * - Tracks customer lifecycle stages and transitions
 * - Calculates Customer Lifetime Value (CLV) and predictions
 * - Manages customer segmentation and churn prediction
 * - Automates lifecycle-based marketing triggers
 *
 * FEATURES:
 * - Real-time lifecycle stage updates
 * - Predictive CLV modeling
 * - Churn probability scoring
 * - Customer segment management
 * - Cohort analysis and tracking
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { 
  CustomerLifecycle, 
  CustomerLifecycleStage, 
  CustomerValueTier 
} from '../entities/customer-lifecycle.entity';
import { BusinessEvent, BusinessEventType, CustomerSegment } from '../entities/business-event.entity';
import { BusinessEventPublisher } from './business-event-publisher.service';

/**
 * CLV calculation methods
 */
export enum CLVCalculationMethod {
  HISTORICAL = 'historical',
  PREDICTIVE = 'predictive',
  COHORT_BASED = 'cohort_based',
}

/**
 * Customer lifecycle update parameters
 */
export interface ILifecycleUpdate {
  userId: number;
  triggerEvent?: BusinessEventType;
  forceRecalculation?: boolean;
  updateSource?: string;
}

/**
 * CLV calculation result
 */
export interface ICLVCalculationResult {
  currentCLV: number;
  predictedCLV: number;
  confidenceScore: number;
  calculationMethod: CLVCalculationMethod;
  factorsConsidered: {
    totalSpent: number;
    orderFrequency: number;
    averageOrderValue: number;
    customerAge: number;
    churnProbability: number;
  };
}

/**
 * Customer segment analysis
 */
export interface ICustomerSegmentAnalysis {
  currentSegment: CustomerSegment;
  previousSegment?: CustomerSegment;
  segmentConfidence: number;
  recommendedActions: string[];
  nextReviewDate: Date;
}

/**
 * Customer Lifecycle Service
 * 
 * Manages comprehensive customer lifecycle tracking, CLV calculations,
 * and automated segmentation for business intelligence and marketing.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Customer Lifecycle')
 */
@Injectable()
export class CustomerLifecycleService {
  private readonly logger = new Logger(CustomerLifecycleService.name);
  private readonly CLV_RECALCULATION_INTERVAL_HOURS = 24;
  private readonly CHURN_THRESHOLD_DAYS = 90;

  constructor(
    @InjectRepository(CustomerLifecycle)
    private readonly customerLifecycleRepo: Repository<CustomerLifecycle>,
    
    @InjectRepository(BusinessEvent)
    private readonly businessEventRepo: Repository<BusinessEvent>,
    
    private readonly businessEventPublisher: BusinessEventPublisher,
  ) {
    this.logger.log('👥 Customer Lifecycle Service initialized');
  }

  /**
   * Create or update customer lifecycle record
   * 
   * @param userId - User ID to update
   * @param updateData - Lifecycle update parameters
   * @returns Promise<CustomerLifecycle> - Updated lifecycle record
   */
  async updateCustomerLifecycle(
    userId: number,
    updateData: Partial<ILifecycleUpdate> = {},
  ): Promise<CustomerLifecycle> {
    const startTime = Date.now();
    
    this.logger.debug(
      `🔄 Updating customer lifecycle for user ${userId}`,
      { triggerEvent: updateData.triggerEvent }
    );

    try {
      let lifecycle = await this.customerLifecycleRepo.findOne({
        where: { userId },
      });

      const isNewCustomer = !lifecycle;

      if (isNewCustomer) {
        lifecycle = await this.createInitialLifecycleRecord(userId);
      }

      // Update lifecycle metrics
      await this.updateLifecycleMetrics(lifecycle, updateData.forceRecalculation || false);

      // Determine new stage and segment
      const newStage = await this.calculateLifecycleStage(lifecycle);
      const newSegment = await this.calculateCustomerSegment(lifecycle);

      const stageChanged = lifecycle.currentStage !== newStage;
      const segmentChanged = lifecycle.currentSegment !== newSegment;

      if (stageChanged) {
        lifecycle.previousStage = lifecycle.currentStage;
        lifecycle.currentStage = newStage;
        lifecycle.stageUpdatedAt = new Date();
      }

      if (segmentChanged) {
        lifecycle.currentSegment = newSegment;
      }

      // Update value tier
      lifecycle.valueTier = this.calculateValueTier(lifecycle.lifetimeValue);

      // Recalculate CLV if needed
      const shouldRecalculateCLV = 
        updateData.forceRecalculation ||
        this.shouldRecalculateCLV(lifecycle) ||
        stageChanged;

      if (shouldRecalculateCLV) {
        const clvResult = await this.calculateCLV(userId, CLVCalculationMethod.PREDICTIVE);
        lifecycle.lifetimeValue = clvResult.currentCLV;
        lifecycle.predictedLifetimeValue = clvResult.predictedCLV;
        lifecycle.clvLastCalculatedAt = new Date();
      }

      // Update churn probability
      lifecycle.churnProbability = await this.calculateChurnProbability(lifecycle);

      // Update engagement score
      lifecycle.engagementScore = await this.calculateEngagementScore(userId);

      // Save updated lifecycle
      const savedLifecycle = await this.customerLifecycleRepo.save(lifecycle);

      // Publish lifecycle events
      if (isNewCustomer) {
        await this.publishLifecycleEvent(
          BusinessEventType.USER_REGISTERED,
          userId,
          { newStage, newSegment }
        );
      } else if (stageChanged) {
        await this.publishLifecycleEvent(
          BusinessEventType.CUSTOMER_SEGMENT_CHANGED,
          userId,
          { 
            previousStage: lifecycle.previousStage,
            newStage,
            previousSegment: lifecycle.currentSegment,
            newSegment 
          }
        );
      }

      if (shouldRecalculateCLV) {
        await this.publishLifecycleEvent(
          BusinessEventType.CLV_CALCULATED,
          userId,
          { 
            currentCLV: lifecycle.lifetimeValue,
            predictedCLV: lifecycle.predictedLifetimeValue 
          }
        );
      }

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Customer lifecycle updated for user ${userId}`,
        { 
          processingTime,
          stageChanged,
          segmentChanged,
          currentStage: savedLifecycle.currentStage,
          currentSegment: savedLifecycle.currentSegment 
        }
      );

      return savedLifecycle;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to update customer lifecycle for user ${userId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Calculate Customer Lifetime Value with multiple methods
   * 
   * @param userId - User ID for CLV calculation
   * @param method - Calculation method to use
   * @returns Promise<ICLVCalculationResult> - CLV calculation result
   */
  async calculateCLV(
    userId: number,
    method: CLVCalculationMethod = CLVCalculationMethod.PREDICTIVE,
  ): Promise<ICLVCalculationResult> {
    this.logger.debug(`💰 Calculating CLV for user ${userId} using ${method} method`);

    try {
      const lifecycle = await this.customerLifecycleRepo.findOne({
        where: { userId },
      });

      if (!lifecycle) {
        throw new Error(`Customer lifecycle not found for user ${userId}`);
      }

      const factors = {
        totalSpent: lifecycle.totalSpent,
        orderFrequency: lifecycle.purchaseFrequency,
        averageOrderValue: lifecycle.averageOrderValue,
        customerAge: lifecycle.daysSinceRegistration,
        churnProbability: lifecycle.churnProbability,
      };

      let currentCLV: number;
      let predictedCLV: number;
      let confidenceScore: number;

      switch (method) {
        case CLVCalculationMethod.HISTORICAL:
          ({ currentCLV, predictedCLV, confidenceScore } = 
            await this.calculateHistoricalCLV(factors));
          break;

        case CLVCalculationMethod.PREDICTIVE:
          ({ currentCLV, predictedCLV, confidenceScore } = 
            await this.calculatePredictiveCLV(factors));
          break;

        case CLVCalculationMethod.COHORT_BASED:
          ({ currentCLV, predictedCLV, confidenceScore } = 
            await this.calculateCohortBasedCLV(userId, factors));
          break;

        default:
          throw new Error(`Unsupported CLV calculation method: ${method}`);
      }

      return {
        currentCLV,
        predictedCLV,
        confidenceScore,
        calculationMethod: method,
        factorsConsidered: factors,
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to calculate CLV for user ${userId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Analyze customer segment and provide recommendations
   * 
   * @param userId - User ID for segment analysis
   * @returns Promise<ICustomerSegmentAnalysis> - Segment analysis result
   */
  async analyzeCustomerSegment(userId: number): Promise<ICustomerSegmentAnalysis> {
    this.logger.debug(`🎯 Analyzing customer segment for user ${userId}`);

    try {
      const lifecycle = await this.customerLifecycleRepo.findOne({
        where: { userId },
      });

      if (!lifecycle) {
        throw new Error(`Customer lifecycle not found for user ${userId}`);
      }

      const currentSegment = lifecycle.currentSegment;
      const segmentConfidence = this.calculateSegmentConfidence(lifecycle);
      const recommendedActions = this.getSegmentRecommendations(currentSegment, lifecycle);
      const nextReviewDate = this.calculateNextReviewDate(currentSegment);

      return {
        currentSegment,
        previousSegment: undefined, // Could track segment history
        segmentConfidence,
        recommendedActions,
        nextReviewDate,
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to analyze customer segment for user ${userId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Get customers at risk of churning
   * 
   * @param limit - Maximum number of customers to return
   * @returns Promise<CustomerLifecycle[]> - At-risk customers
   */
  async getAtRiskCustomers(limit: number = 100): Promise<CustomerLifecycle[]> {
    return this.customerLifecycleRepo.find({
      where: {
        churnProbability: 0.7, // 70% or higher churn probability
      },
      order: {
        churnProbability: 'DESC',
        lifetimeValue: 'DESC', // Prioritize high-value customers
      },
      take: limit,
    });
  }

  /**
   * Get top customers by lifetime value
   * 
   * @param limit - Maximum number of customers to return
   * @returns Promise<CustomerLifecycle[]> - Top value customers
   */
  async getTopCustomersByValue(limit: number = 100): Promise<CustomerLifecycle[]> {
    return this.customerLifecycleRepo.find({
      order: {
        lifetimeValue: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Event listener for business events that trigger lifecycle updates
   */
  @OnEvent('business.user_registered')
  async handleUserRegistered(payload: any): Promise<void> {
    await this.updateCustomerLifecycle(payload.eventData.userId, {
      triggerEvent: BusinessEventType.USER_REGISTERED,
      updateSource: 'event_listener',
    });
  }

  @OnEvent('business.purchase_completed')
  async handlePurchaseCompleted(payload: any): Promise<void> {
    const eventData = payload.eventData;
    if (eventData.userId) {
      await this.updateCustomerLifecycle(eventData.userId, {
        triggerEvent: BusinessEventType.PURCHASE_COMPLETED,
        forceRecalculation: true,
        updateSource: 'event_listener',
      });
    }
  }

  @OnEvent('lifecycle.update')
  async handleLifecycleUpdate(payload: any): Promise<void> {
    await this.updateCustomerLifecycle(payload.userId, {
      triggerEvent: payload.triggerEvent,
      updateSource: 'manual_trigger',
    });
  }

  @OnEvent('clv.update')
  async handleCLVUpdate(payload: any): Promise<void> {
    await this.updateCustomerLifecycle(payload.userId, {
      forceRecalculation: true,
      updateSource: 'clv_update',
    });
  }

  // Private helper methods

  /**
   * Create initial lifecycle record for new customer
   */
  private async createInitialLifecycleRecord(userId: number): Promise<CustomerLifecycle> {
    this.logger.debug(`🆕 Creating initial lifecycle record for user ${userId}`);

    const now = new Date();
    const cohortId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const lifecycle = this.customerLifecycleRepo.create({
      userId,
      currentStage: CustomerLifecycleStage.NEW,
      previousStage: null,
      currentSegment: CustomerSegment.NEW,
      valueTier: CustomerValueTier.BRONZE,
      registrationDate: now,
      lastActivityDate: now,
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lifetimeValue: 0,
      predictedLifetimeValue: 0,
      churnProbability: 0.1, // Low initial churn probability
      engagementScore: 50, // Neutral initial score
      daysSinceRegistration: 0,
      daysSinceLastActivity: 0,
      purchaseFrequency: 0,
      referralCount: 0,
      acquisitionChannel: null,
      cohortId,
      customerMetrics: {},
      stageUpdatedAt: now,
      clvLastCalculatedAt: now,
    });

    return await this.customerLifecycleRepo.save(lifecycle);
  }

  /**
   * Update lifecycle metrics from business events
   */
  private async updateLifecycleMetrics(
    lifecycle: CustomerLifecycle,
    forceUpdate: boolean = false,
  ): Promise<void> {
    // Get aggregated data from business events
    const eventData = await this.businessEventRepo
      .createQueryBuilder('event')
      .select([
        'COUNT(CASE WHEN event.eventType = :purchaseCompleted THEN 1 END) as totalOrders',
        'SUM(CASE WHEN event.eventType = :purchaseCompleted THEN event.revenueAmount ELSE 0 END) as totalSpent',
        'MAX(event.eventTimestamp) as lastActivityDate',
        'MAX(CASE WHEN event.eventType = :purchaseCompleted THEN event.eventTimestamp END) as lastPurchaseDate',
      ])
      .where('event.userId = :userId', { userId: lifecycle.userId })
      .setParameters({
        purchaseCompleted: BusinessEventType.PURCHASE_COMPLETED,
      })
      .getRawOne();

    // Update basic metrics
    lifecycle.totalOrders = parseInt(eventData.totalOrders || '0');
    lifecycle.totalSpent = parseFloat(eventData.totalSpent || '0');
    lifecycle.averageOrderValue = lifecycle.totalOrders > 0 
      ? lifecycle.totalSpent / lifecycle.totalOrders 
      : 0;

    // Update dates and durations
    if (eventData.lastActivityDate) {
      lifecycle.lastActivityDate = new Date(eventData.lastActivityDate);
    }
    if (eventData.lastPurchaseDate) {
      lifecycle.lastPurchaseDate = new Date(eventData.lastPurchaseDate);
    }

    const now = new Date();
    lifecycle.daysSinceRegistration = Math.floor(
      (now.getTime() - lifecycle.registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    lifecycle.daysSinceLastActivity = Math.floor(
      (now.getTime() - lifecycle.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (lifecycle.lastPurchaseDate) {
      lifecycle.daysSinceLastPurchase = Math.floor(
        (now.getTime() - lifecycle.lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Calculate purchase frequency (orders per month)
    const monthsSinceRegistration = lifecycle.daysSinceRegistration / 30;
    lifecycle.purchaseFrequency = monthsSinceRegistration > 0 
      ? lifecycle.totalOrders / monthsSinceRegistration 
      : 0;
  }

  /**
   * Calculate customer lifecycle stage
   */
  private async calculateLifecycleStage(lifecycle: CustomerLifecycle): Promise<CustomerLifecycleStage> {
    const daysSinceReg = lifecycle.daysSinceRegistration;
    const daysSinceActivity = lifecycle.daysSinceLastActivity;
    const totalOrders = lifecycle.totalOrders;
    const purchaseFreq = lifecycle.purchaseFrequency;

    // New customer (first 30 days)
    if (daysSinceReg <= 30) {
      return totalOrders === 0 ? CustomerLifecycleStage.NEW : CustomerLifecycleStage.ONBOARDING;
    }

    // Churned (no activity > 90 days)
    if (daysSinceActivity > this.CHURN_THRESHOLD_DAYS) {
      return CustomerLifecycleStage.CHURNED;
    }

    // At risk (declining activity)
    if (daysSinceActivity > 30 && purchaseFreq < 0.5) {
      return CustomerLifecycleStage.AT_RISK;
    }

    // Active customer
    if (totalOrders >= 2 && purchaseFreq >= 0.5) {
      return CustomerLifecycleStage.ACTIVE;
    }

    // Engaged customer (high interaction)
    if (purchaseFreq >= 2.0 || lifecycle.engagementScore >= 80) {
      return CustomerLifecycleStage.ENGAGED;
    }

    return CustomerLifecycleStage.ACTIVE;
  }

  /**
   * Calculate customer segment
   */
  private async calculateCustomerSegment(lifecycle: CustomerLifecycle): Promise<CustomerSegment> {
    const stage = lifecycle.currentStage;
    const clv = lifecycle.lifetimeValue;
    const frequency = lifecycle.purchaseFrequency;
    const engagement = lifecycle.engagementScore;

    // High-value segments
    if (clv >= 1000 && frequency >= 2.0) {
      return CustomerSegment.VIP;
    }

    if (clv >= 500 && frequency >= 1.0) {
      return CustomerSegment.LOYALIST;
    }

    if (lifecycle.averageOrderValue >= 200) {
      return CustomerSegment.BIG_SPENDER;
    }

    // Risk-based segments
    if (stage === CustomerLifecycleStage.CHURNED) {
      return CustomerSegment.CHURNED;
    }

    if (stage === CustomerLifecycleStage.AT_RISK) {
      return CustomerSegment.AT_RISK;
    }

    // Standard segments
    if (stage === CustomerLifecycleStage.NEW || stage === CustomerLifecycleStage.ONBOARDING) {
      return CustomerSegment.NEW;
    }

    // Price-conscious customers
    if (lifecycle.averageOrderValue < 50 && frequency < 0.5) {
      return CustomerSegment.BARGAIN_HUNTER;
    }

    return CustomerSegment.ACTIVE;
  }

  /**
   * Calculate value tier based on CLV
   */
  private calculateValueTier(clv: number): CustomerValueTier {
    if (clv >= 2000) return CustomerValueTier.PLATINUM;
    if (clv >= 1000) return CustomerValueTier.GOLD;
    if (clv >= 300) return CustomerValueTier.SILVER;
    return CustomerValueTier.BRONZE;
  }

  /**
   * Calculate churn probability using simple heuristics
   */
  private async calculateChurnProbability(lifecycle: CustomerLifecycle): Promise<number> {
    const daysSinceActivity = lifecycle.daysSinceLastActivity;
    const daysSincePurchase = lifecycle.daysSinceLastPurchase || 999;
    const purchaseFreq = lifecycle.purchaseFrequency;
    const engagement = lifecycle.engagementScore;

    // Base probability on days since last activity
    let churnProb = Math.min(daysSinceActivity / this.CHURN_THRESHOLD_DAYS, 1.0);

    // Adjust based on purchase history
    if (daysSincePurchase > 60) {
      churnProb += 0.3;
    }

    // Adjust based on engagement
    if (engagement < 30) {
      churnProb += 0.2;
    } else if (engagement > 70) {
      churnProb -= 0.1;
    }

    // Adjust based on purchase frequency
    if (purchaseFreq > 1.0) {
      churnProb -= 0.2;
    } else if (purchaseFreq < 0.1) {
      churnProb += 0.3;
    }

    return Math.max(0, Math.min(1, churnProb));
  }

  /**
   * Calculate engagement score
   */
  private async calculateEngagementScore(userId: number): Promise<number> {
    // This would consider various engagement factors:
    // - Login frequency
    // - Page views
    // - Time spent on site
    // - Product interactions
    // - Social shares
    // - Reviews/ratings
    // For now, return a simple score based on activity recency
    const recentActivity = await this.businessEventRepo
      .createQueryBuilder('event')
      .select('COUNT(*)')
      .where('event.userId = :userId', { userId })
      .andWhere('event.eventTimestamp >= :recentDate', {
        recentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      })
      .getRawOne();

    const activityCount = parseInt(recentActivity.count || '0');
    return Math.min(100, activityCount * 10); // Simple scoring
  }

  /**
   * CLV calculation methods
   */
  private async calculateHistoricalCLV(factors: any): Promise<{
    currentCLV: number;
    predictedCLV: number;
    confidenceScore: number;
  }> {
    // Simple historical CLV = total spent
    const currentCLV = factors.totalSpent;
    const predictedCLV = currentCLV * 1.2; // Simple 20% growth prediction
    const confidenceScore = factors.customerAge > 90 ? 0.8 : 0.6;

    return { currentCLV, predictedCLV, confidenceScore };
  }

  private async calculatePredictiveCLV(factors: any): Promise<{
    currentCLV: number;
    predictedCLV: number;
    confidenceScore: number;
  }> {
    // Predictive CLV using frequency and retention
    const currentCLV = factors.totalSpent;
    const monthlyValue = factors.averageOrderValue * factors.orderFrequency;
    const retentionRate = 1 - factors.churnProbability;
    const lifetimeMonths = retentionRate > 0 ? 1 / (1 - retentionRate) : 12;
    
    const predictedCLV = currentCLV + (monthlyValue * lifetimeMonths * 0.8);
    const confidenceScore = factors.customerAge > 60 ? 0.9 : 0.7;

    return { currentCLV, predictedCLV, confidenceScore };
  }

  private async calculateCohortBasedCLV(userId: number, factors: any): Promise<{
    currentCLV: number;
    predictedCLV: number;
    confidenceScore: number;
  }> {
    // This would use cohort analysis for more sophisticated predictions
    // For now, use simplified approach
    return this.calculatePredictiveCLV(factors);
  }

  /**
   * Helper methods for segment analysis
   */
  private calculateSegmentConfidence(lifecycle: CustomerLifecycle): number {
    // Calculate confidence based on data completeness and customer age
    const dataPoints = [
      lifecycle.totalOrders > 0,
      lifecycle.daysSinceRegistration > 30,
      lifecycle.lastPurchaseDate !== null,
      lifecycle.engagementScore > 0,
    ].filter(Boolean).length;

    return (dataPoints / 4) * 100;
  }

  private getSegmentRecommendations(
    segment: CustomerSegment,
    lifecycle: CustomerLifecycle,
  ): string[] {
    const recommendations: string[] = [];

    switch (segment) {
      case CustomerSegment.NEW:
        recommendations.push('Send welcome series emails');
        recommendations.push('Offer first-time buyer discount');
        recommendations.push('Recommend popular products');
        break;

      case CustomerSegment.AT_RISK:
        recommendations.push('Send re-engagement campaign');
        recommendations.push('Offer personalized discounts');
        recommendations.push('Request feedback on experience');
        break;

      case CustomerSegment.VIP:
        recommendations.push('Provide VIP customer support');
        recommendations.push('Offer exclusive products/previews');
        recommendations.push('Request product reviews');
        break;

      case CustomerSegment.CHURNED:
        recommendations.push('Send win-back campaign');
        recommendations.push('Offer significant discount');
        recommendations.push('Survey for churn reasons');
        break;

      default:
        recommendations.push('Continue current engagement strategy');
        recommendations.push('Monitor for segment changes');
    }

    return recommendations;
  }

  private calculateNextReviewDate(segment: CustomerSegment): Date {
    const now = new Date();
    const days = segment === CustomerSegment.AT_RISK ? 7 : 30;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Check if CLV recalculation is needed
   */
  private shouldRecalculateCLV(lifecycle: CustomerLifecycle): boolean {
    const hoursSinceLastCalculation = 
      (Date.now() - lifecycle.clvLastCalculatedAt.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastCalculation >= this.CLV_RECALCULATION_INTERVAL_HOURS;
  }

  /**
   * Publish lifecycle-related business events
   */
  private async publishLifecycleEvent(
    eventType: BusinessEventType,
    userId: number,
    eventData: any,
  ): Promise<void> {
    try {
      await this.businessEventPublisher.publishEvent({
        eventType,
        userId,
        sourceModule: 'customer_lifecycle',
        eventPayload: eventData,
        metadata: {
          service: 'CustomerLifecycleService',
          version: '1.0.0',
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to publish lifecycle event: ${eventType}`,
        { userId, error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }
}
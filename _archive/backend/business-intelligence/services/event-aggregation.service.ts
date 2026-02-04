/**
 * @file event-aggregation.service.ts
 * @description Real-time Business Intelligence Event Aggregation Service
 *
 * PURPOSE:
 * - Aggregates business events for real-time analytics and dashboards
 * - Calculates business metrics from event streams
 * - Provides cached aggregations for performance
 * - Supports time-based windowing and rolling calculations
 *
 * FEATURES:
 * - Real-time conversion funnel tracking
 * - Customer segment aggregations
 * - Revenue and CLV calculations
 * - Cart abandonment analytics
 * - Cohort analysis metrics
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { BusinessEvent, BusinessEventType, CustomerSegment } from '../entities/business-event.entity';
import { CustomerLifecycle, CustomerLifecycleStage } from '../entities/customer-lifecycle.entity';
import { CartAbandonment } from '../entities/cart-abandonment.entity';

/**
 * Time window for aggregations
 */
export enum TimeWindow {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Conversion funnel metrics
 */
export interface IConversionFunnelMetrics {
  totalUsers: number;
  productViews: number;
  cartCreations: number;
  checkoutStarts: number;
  purchases: number;
  conversionRates: {
    viewToCart: number;
    cartToCheckout: number;
    checkoutToPurchase: number;
    overallConversion: number;
  };
}

/**
 * Customer lifecycle metrics
 */
export interface ICustomerLifecycleMetrics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  churnedCustomers: number;
  averageLifetimeValue: number;
  averageOrderValue: number;
}

/**
 * Cart abandonment metrics
 */
export interface ICartAbandonmentMetrics {
  totalAbandonments: number;
  abandonmentRate: number;
  averageAbandonedValue: number;
  recoveryRate: number;
  topAbandonmentReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Real-time business metrics
 */
export interface IRealTimeMetrics {
  activeUsers: number;
  revenueToday: number;
  ordersToday: number;
  conversionRate: number;
  averageOrderValue: number;
  cartAbandonmentRate: number;
}

/**
 * Event Aggregation Service
 * 
 * Provides real-time business intelligence metrics by aggregating
 * business events with efficient caching and time-window support.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Event Aggregation')
 */
@Injectable()
export class EventAggregationService {
  private readonly logger = new Logger(EventAggregationService.name);
  private readonly metricsCache = new Map<string, { data: any; expiry: Date }>();
  private readonly CACHE_TTL_MINUTES = 5; // 5-minute cache for real-time metrics

  constructor(
    @InjectRepository(BusinessEvent)
    private readonly businessEventRepo: Repository<BusinessEvent>,
    
    @InjectRepository(CustomerLifecycle)
    private readonly customerLifecycleRepo: Repository<CustomerLifecycle>,
    
    @InjectRepository(CartAbandonment)
    private readonly cartAbandonmentRepo: Repository<CartAbandonment>,
  ) {
    this.logger.log('📊 Event Aggregation Service initialized');
  }

  /**
   * Get real-time business metrics for dashboard
   * 
   * @returns Promise<IRealTimeMetrics> - Real-time metrics
   */
  async getRealTimeMetrics(): Promise<IRealTimeMetrics> {
    const cacheKey = 'real-time-metrics';
    const cached = this.getCachedValue(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.debug('📈 Calculating real-time business metrics');

    try {
      const [
        activeUsersResult,
        revenueResult,
        ordersResult,
        conversionData,
        abandonmentData,
      ] = await Promise.all([
        // Active users in last 24 hours
        this.businessEventRepo
          .createQueryBuilder('event')
          .select('COUNT(DISTINCT event.userId)')
          .where('event.eventTimestamp >= :yesterday', {
            yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000),
          })
          .andWhere('event.userId IS NOT NULL')
          .getRawOne(),

        // Revenue today
        this.businessEventRepo
          .createQueryBuilder('event')
          .select('SUM(event.revenueAmount)')
          .where('event.eventTimestamp >= :today', { today })
          .andWhere('event.revenueAmount IS NOT NULL')
          .getRawOne(),

        // Orders today
        this.businessEventRepo
          .createQueryBuilder('event')
          .select('COUNT(*)')
          .where('event.eventTimestamp >= :today', { today })
          .andWhere('event.eventType = :eventType', {
            eventType: BusinessEventType.PURCHASE_COMPLETED,
          })
          .getRawOne(),

        // Conversion funnel data
        this.getConversionFunnelMetrics(TimeWindow.DAY),

        // Cart abandonment data
        this.getCartAbandonmentMetrics(TimeWindow.DAY),
      ]);

      const metrics: IRealTimeMetrics = {
        activeUsers: parseInt(activeUsersResult?.count || '0'),
        revenueToday: parseFloat(revenueResult?.sum || '0'),
        ordersToday: parseInt(ordersResult?.count || '0'),
        conversionRate: conversionData.conversionRates.overallConversion,
        averageOrderValue: parseFloat(revenueResult?.sum || '0') / parseInt(ordersResult?.count || '1'),
        cartAbandonmentRate: abandonmentData.abandonmentRate,
      };

      // Cache for 5 minutes
      this.setCachedValue(cacheKey, metrics, this.CACHE_TTL_MINUTES);

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Real-time metrics calculated in ${processingTime}ms`,
        { metrics }
      );

      return metrics;
    } catch (error: unknown) {
      this.logger.error(
        '❌ Failed to calculate real-time metrics',
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Get conversion funnel metrics for specified time window
   * 
   * @param timeWindow - Time window for aggregation
   * @returns Promise<IConversionFunnelMetrics> - Conversion funnel data
   */
  async getConversionFunnelMetrics(timeWindow: TimeWindow): Promise<IConversionFunnelMetrics> {
    const cacheKey = `conversion-funnel-${timeWindow}`;
    const cached = this.getCachedValue(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const timeFilter = this.getTimeFilter(timeWindow);

    this.logger.debug(`📋 Calculating conversion funnel metrics for ${timeWindow}`);

    try {
      const funnelData = await this.businessEventRepo
        .createQueryBuilder('event')
        .select([
          'COUNT(DISTINCT CASE WHEN event.eventType = :productViewed THEN event.userId END) as productViews',
          'COUNT(DISTINCT CASE WHEN event.eventType = :cartCreated THEN event.userId END) as cartCreations',
          'COUNT(DISTINCT CASE WHEN event.eventType = :checkoutStarted THEN event.userId END) as checkoutStarts',
          'COUNT(DISTINCT CASE WHEN event.eventType = :purchaseCompleted THEN event.userId END) as purchases',
          'COUNT(DISTINCT event.userId) as totalUsers',
        ])
        .where('event.eventTimestamp >= :startDate', { startDate: timeFilter })
        .setParameters({
          productViewed: BusinessEventType.PRODUCT_VIEWED,
          cartCreated: BusinessEventType.CART_CREATED,
          checkoutStarted: BusinessEventType.CHECKOUT_STARTED,
          purchaseCompleted: BusinessEventType.PURCHASE_COMPLETED,
        })
        .getRawOne();

      const totalUsers = parseInt(funnelData.totalUsers || '0');
      const productViews = parseInt(funnelData.productViews || '0');
      const cartCreations = parseInt(funnelData.cartCreations || '0');
      const checkoutStarts = parseInt(funnelData.checkoutStarts || '0');
      const purchases = parseInt(funnelData.purchases || '0');

      const metrics: IConversionFunnelMetrics = {
        totalUsers,
        productViews,
        cartCreations,
        checkoutStarts,
        purchases,
        conversionRates: {
          viewToCart: productViews > 0 ? (cartCreations / productViews) * 100 : 0,
          cartToCheckout: cartCreations > 0 ? (checkoutStarts / cartCreations) * 100 : 0,
          checkoutToPurchase: checkoutStarts > 0 ? (purchases / checkoutStarts) * 100 : 0,
          overallConversion: totalUsers > 0 ? (purchases / totalUsers) * 100 : 0,
        },
      };

      // Cache for 10 minutes
      this.setCachedValue(cacheKey, metrics, 10);

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Conversion funnel metrics calculated in ${processingTime}ms`,
        { timeWindow, metrics }
      );

      return metrics;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to calculate conversion funnel metrics for ${timeWindow}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Get customer lifecycle metrics
   * 
   * @returns Promise<ICustomerLifecycleMetrics> - Customer lifecycle data
   */
  async getCustomerLifecycleMetrics(): Promise<ICustomerLifecycleMetrics> {
    const cacheKey = 'customer-lifecycle-metrics';
    const cached = this.getCachedValue(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    this.logger.debug('👥 Calculating customer lifecycle metrics');

    try {
      const [segmentData, clvData] = await Promise.all([
        this.customerLifecycleRepo
          .createQueryBuilder('lifecycle')
          .select([
            'COUNT(*) as totalCustomers',
            'SUM(CASE WHEN lifecycle.currentStage = :newStage THEN 1 ELSE 0 END) as newCustomers',
            'SUM(CASE WHEN lifecycle.currentStage = :activeStage THEN 1 ELSE 0 END) as activeCustomers',
            'SUM(CASE WHEN lifecycle.currentStage = :atRiskStage THEN 1 ELSE 0 END) as atRiskCustomers',
            'SUM(CASE WHEN lifecycle.currentStage = :churnedStage THEN 1 ELSE 0 END) as churnedCustomers',
          ])
          .setParameters({
            newStage: CustomerLifecycleStage.NEW,
            activeStage: CustomerLifecycleStage.ACTIVE,
            atRiskStage: CustomerLifecycleStage.AT_RISK,
            churnedStage: CustomerLifecycleStage.CHURNED,
          })
          .getRawOne(),

        this.customerLifecycleRepo
          .createQueryBuilder('lifecycle')
          .select([
            'AVG(lifecycle.lifetimeValue) as averageLifetimeValue',
            'AVG(lifecycle.averageOrderValue) as averageOrderValue',
          ])
          .where('lifecycle.lifetimeValue > 0')
          .getRawOne(),
      ]);

      const metrics: ICustomerLifecycleMetrics = {
        totalCustomers: parseInt(segmentData.totalCustomers || '0'),
        newCustomers: parseInt(segmentData.newCustomers || '0'),
        activeCustomers: parseInt(segmentData.activeCustomers || '0'),
        atRiskCustomers: parseInt(segmentData.atRiskCustomers || '0'),
        churnedCustomers: parseInt(segmentData.churnedCustomers || '0'),
        averageLifetimeValue: parseFloat(clvData?.averageLifetimeValue || '0'),
        averageOrderValue: parseFloat(clvData?.averageOrderValue || '0'),
      };

      // Cache for 15 minutes
      this.setCachedValue(cacheKey, metrics, 15);

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Customer lifecycle metrics calculated in ${processingTime}ms`,
        { metrics }
      );

      return metrics;
    } catch (error: unknown) {
      this.logger.error(
        '❌ Failed to calculate customer lifecycle metrics',
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Get cart abandonment metrics for specified time window
   * 
   * @param timeWindow - Time window for aggregation
   * @returns Promise<ICartAbandonmentMetrics> - Cart abandonment data
   */
  async getCartAbandonmentMetrics(timeWindow: TimeWindow): Promise<ICartAbandonmentMetrics> {
    const cacheKey = `cart-abandonment-${timeWindow}`;
    const cached = this.getCachedValue(cacheKey);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const timeFilter = this.getTimeFilter(timeWindow);

    this.logger.debug(`🛒 Calculating cart abandonment metrics for ${timeWindow}`);

    try {
      const [abandonmentData, reasonData, recoveryData] = await Promise.all([
        this.cartAbandonmentRepo
          .createQueryBuilder('abandonment')
          .select([
            'COUNT(*) as totalAbandonments',
            'AVG(abandonment.totalValue) as averageAbandonedValue',
          ])
          .where('abandonment.abandonedAt >= :startDate', { startDate: timeFilter })
          .getRawOne(),

        this.cartAbandonmentRepo
          .createQueryBuilder('abandonment')
          .select([
            'abandonment.abandonmentReason as reason',
            'COUNT(*) as count',
          ])
          .where('abandonment.abandonedAt >= :startDate', { startDate: timeFilter })
          .groupBy('abandonment.abandonmentReason')
          .orderBy('count', 'DESC')
          .limit(5)
          .getRawMany(),

        this.cartAbandonmentRepo
          .createQueryBuilder('abandonment')
          .select([
            'COUNT(*) as totalRecovered',
          ])
          .where('abandonment.abandonedAt >= :startDate', { startDate: timeFilter })
          .andWhere('abandonment.recoveryStatus = :recoveredStatus', {
            recoveredStatus: 'recovered',
          })
          .getRawOne(),
      ]);

      const totalAbandonments = parseInt(abandonmentData.totalAbandonments || '0');
      const totalRecovered = parseInt(recoveryData.totalRecovered || '0');

      // Calculate abandonment rate (abandonment / total cart creations)
      const cartCreationsData = await this.businessEventRepo
        .createQueryBuilder('event')
        .select('COUNT(*)')
        .where('event.eventTimestamp >= :startDate', { startDate: timeFilter })
        .andWhere('event.eventType = :eventType', {
          eventType: BusinessEventType.CART_CREATED,
        })
        .getRawOne();

      const totalCartCreations = parseInt(cartCreationsData.count || '0');

      const metrics: ICartAbandonmentMetrics = {
        totalAbandonments,
        abandonmentRate: totalCartCreations > 0 ? (totalAbandonments / totalCartCreations) * 100 : 0,
        averageAbandonedValue: parseFloat(abandonmentData.averageAbandonedValue || '0'),
        recoveryRate: totalAbandonments > 0 ? (totalRecovered / totalAbandonments) * 100 : 0,
        topAbandonmentReasons: reasonData.map(item => ({
          reason: item.reason,
          count: parseInt(item.count),
          percentage: totalAbandonments > 0 ? (parseInt(item.count) / totalAbandonments) * 100 : 0,
        })),
      };

      // Cache for 10 minutes
      this.setCachedValue(cacheKey, metrics, 10);

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Cart abandonment metrics calculated in ${processingTime}ms`,
        { timeWindow, metrics }
      );

      return metrics;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to calculate cart abandonment metrics for ${timeWindow}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Get event counts by type for specified time window
   * 
   * @param timeWindow - Time window for aggregation
   * @returns Promise<Record<string, number>> - Event counts by type
   */
  async getEventCountsByType(timeWindow: TimeWindow): Promise<Record<string, number>> {
    const cacheKey = `event-counts-${timeWindow}`;
    const cached = this.getCachedValue(cacheKey);
    if (cached) {
      return cached;
    }

    const timeFilter = this.getTimeFilter(timeWindow);

    const eventCounts = await this.businessEventRepo
      .createQueryBuilder('event')
      .select([
        'event.eventType as eventType',
        'COUNT(*) as count',
      ])
      .where('event.eventTimestamp >= :startDate', { startDate: timeFilter })
      .groupBy('event.eventType')
      .getRawMany();

    const result: Record<string, number> = {};
    eventCounts.forEach(item => {
      result[item.eventType] = parseInt(item.count);
    });

    // Cache for 5 minutes
    this.setCachedValue(cacheKey, result, 5);

    return result;
  }

  /**
   * Real-time event listener for business events
   * Updates aggregations when new events are received
   */
  @OnEvent('business.*')
  async handleBusinessEvent(payload: any): Promise<void> {
    this.logger.debug(
      `🔄 Processing real-time business event: ${payload.eventType}`,
      { eventId: payload.eventId, correlationId: payload.correlationId }
    );

    // Invalidate relevant caches
    this.invalidateCaches([
      'real-time-metrics',
      `conversion-funnel-${TimeWindow.DAY}`,
      `cart-abandonment-${TimeWindow.DAY}`,
      `event-counts-${TimeWindow.DAY}`,
    ]);

    // Trigger specific aggregation updates based on event type
    switch (payload.eventType) {
      case BusinessEventType.PURCHASE_COMPLETED:
        await this.updateRevenueAggregations(payload.eventData);
        break;
      
      case BusinessEventType.CART_ABANDONED:
        await this.updateAbandonmentAggregations(payload.eventData);
        break;
      
      case BusinessEventType.USER_REGISTERED:
        await this.updateCustomerAggregations(payload.eventData);
        break;
    }
  }

  // Private helper methods

  /**
   * Get time filter for specified window
   */
  private getTimeFilter(timeWindow: TimeWindow): Date {
    const now = new Date();
    
    switch (timeWindow) {
      case TimeWindow.HOUR:
        return new Date(now.getTime() - 60 * 60 * 1000);
      case TimeWindow.DAY:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case TimeWindow.WEEK:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case TimeWindow.MONTH:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case TimeWindow.QUARTER:
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case TimeWindow.YEAR:
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Cache management methods
   */
  private getCachedValue(key: string): any | null {
    const cached = this.metricsCache.get(key);
    if (cached && cached.expiry > new Date()) {
      return cached.data;
    }
    this.metricsCache.delete(key);
    return null;
  }

  private setCachedValue(key: string, data: any, ttlMinutes: number): void {
    this.metricsCache.set(key, {
      data,
      expiry: new Date(Date.now() + ttlMinutes * 60 * 1000),
    });
  }

  private invalidateCaches(keys: string[]): void {
    keys.forEach(key => this.metricsCache.delete(key));
  }

  /**
   * Update specific aggregations based on event types
   */
  private async updateRevenueAggregations(eventData: BusinessEvent): Promise<void> {
    // This could trigger CLV recalculation, revenue milestone checks, etc.
    this.logger.debug('💰 Updating revenue aggregations', { eventId: eventData.id });
  }

  private async updateAbandonmentAggregations(eventData: BusinessEvent): Promise<void> {
    // This could trigger abandonment recovery campaigns
    this.logger.debug('🛒 Updating abandonment aggregations', { eventId: eventData.id });
  }

  private async updateCustomerAggregations(eventData: BusinessEvent): Promise<void> {
    // This could trigger cohort assignment, lifecycle stage updates
    this.logger.debug('👥 Updating customer aggregations', { eventId: eventData.id });
  }
}
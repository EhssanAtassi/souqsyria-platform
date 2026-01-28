/**
 * @file cart-abandonment.service.ts
 * @description Cart Abandonment Detection and Recovery Service
 *
 * PURPOSE:
 * - Detects cart abandonment events in real-time
 * - Triggers automated recovery campaigns
 * - Tracks recovery effectiveness and optimization
 * - Provides cart abandonment analytics and insights
 *
 * FEATURES:
 * - Real-time abandonment detection
 * - Multi-channel recovery campaigns (email, SMS, push)
 * - A/B testing for recovery strategies
 * - Abandonment reason analysis
 * - Recovery ROI tracking
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry, Cron, CronExpression } from '@nestjs/schedule';

import {
  CartAbandonment,
  AbandonmentStage,
  RecoveryCampaignType,
  AbandonmentReason,
} from '../entities/cart-abandonment.entity';
import { BusinessEvent, BusinessEventType } from '../entities/business-event.entity';
import { BusinessEventPublisher } from './business-event-publisher.service';

/**
 * Recovery campaign configuration
 */
export interface IRecoveryCampaignConfig {
  type: RecoveryCampaignType;
  delayMinutes: number;
  template: string;
  discountPercentage?: number;
  priority: number;
  enabled: boolean;
}

/**
 * Abandonment detection criteria
 */
export interface IAbandonmentCriteria {
  inactivityMinutes: number;
  minimumCartValue: number;
  excludeStages: AbandonmentStage[];
  requireEmail: boolean;
}

/**
 * Recovery campaign result
 */
export interface IRecoveryCampaignResult {
  campaignId: string;
  type: RecoveryCampaignType;
  sentAt: Date;
  deliveryStatus: 'sent' | 'failed' | 'pending';
  estimatedDeliveryTime?: Date;
}

/**
 * Abandonment analytics
 */
export interface IAbandonmentAnalytics {
  totalAbandonments: number;
  abandonmentRate: number;
  averageAbandonedValue: number;
  recoveryRate: number;
  recoveryCampaignEffectiveness: Record<RecoveryCampaignType, {
    sent: number;
    recovered: number;
    conversionRate: number;
    revenue: number;
  }>;
  topReasons: Array<{
    reason: AbandonmentReason;
    count: number;
    percentage: number;
    averageValue: number;
  }>;
}

/**
 * Cart Abandonment Service
 * 
 * Comprehensive cart abandonment detection, recovery campaign management,
 * and analytics for e-commerce conversion optimization.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Cart Abandonment')
 */
@Injectable()
export class CartAbandonmentService {
  private readonly logger = new Logger(CartAbandonmentService.name);
  
  private readonly defaultRecoveryConfig: IRecoveryCampaignConfig[] = [
    {
      type: RecoveryCampaignType.EMAIL_IMMEDIATE,
      delayMinutes: 60,
      template: 'cart_abandonment_immediate',
      priority: 1,
      enabled: true,
    },
    {
      type: RecoveryCampaignType.EMAIL_FOLLOWUP,
      delayMinutes: 1440, // 24 hours
      template: 'cart_abandonment_followup',
      discountPercentage: 10,
      priority: 2,
      enabled: true,
    },
    {
      type: RecoveryCampaignType.EMAIL_FINAL,
      delayMinutes: 4320, // 72 hours
      template: 'cart_abandonment_final',
      discountPercentage: 15,
      priority: 3,
      enabled: true,
    },
    {
      type: RecoveryCampaignType.SMS_REMINDER,
      delayMinutes: 360, // 6 hours
      template: 'cart_abandonment_sms',
      priority: 2,
      enabled: false, // Disabled by default
    },
  ];

  private readonly defaultAbandonmentCriteria: IAbandonmentCriteria = {
    inactivityMinutes: 30,
    minimumCartValue: 10,
    excludeStages: [AbandonmentStage.ABANDONED, AbandonmentStage.RECOVERED],
    requireEmail: true,
  };

  constructor(
    @InjectRepository(CartAbandonment)
    private readonly cartAbandonmentRepo: Repository<CartAbandonment>,
    
    @InjectRepository(BusinessEvent)
    private readonly businessEventRepo: Repository<BusinessEvent>,
    
    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger.log('🛒 Cart Abandonment Service initialized');
  }

  /**
   * Detect and create cart abandonment record
   * 
   * @param cartId - Cart identifier
   * @param userId - User ID (null for guest)
   * @param sessionId - Session ID for guest tracking
   * @param cartData - Cart information
   * @returns Promise<CartAbandonment> - Created abandonment record
   */
  async detectAbandonment(
    cartId: string,
    userId: number | null,
    sessionId: string | null,
    cartData: {
      totalValue: number;
      currency: string;
      itemCount: number;
      items: any[];
      cartCreatedAt: Date;
      currentStage: AbandonmentStage;
      abandonmentReason?: AbandonmentReason;
      deviceInfo?: any;
      locationInfo?: any;
      exitBehavior?: any;
    },
  ): Promise<CartAbandonment> {
    const startTime = Date.now();
    
    this.logger.debug(
      `🔍 Detecting cart abandonment for cart ${cartId}`,
      { userId, sessionId, totalValue: cartData.totalValue }
    );

    try {
      // Check if abandonment already exists
      let abandonment = await this.cartAbandonmentRepo.findOne({
        where: { cartId },
      });

      const isNewAbandonment = !abandonment;

      if (isNewAbandonment) {
        // Create new abandonment record
        abandonment = this.cartAbandonmentRepo.create({
          cartId,
          userId,
          sessionId,
          currentStage: cartData.currentStage,
          abandonmentReason: cartData.abandonmentReason || AbandonmentReason.UNKNOWN,
          totalValue: cartData.totalValue,
          currency: cartData.currency,
          itemCount: cartData.itemCount,
          abandonedItems: cartData.items,
          cartCreatedAt: cartData.cartCreatedAt,
          abandonedAt: new Date(),
          deviceInfo: cartData.deviceInfo,
          locationInfo: cartData.locationInfo,
          exitBehavior: cartData.exitBehavior,
          recoveryStatus: 'not_started',
          recoveryCampaigns: [],
        });
      } else {
        // Update existing abandonment
        abandonment.currentStage = cartData.currentStage;
        abandonment.totalValue = cartData.totalValue;
        abandonment.itemCount = cartData.itemCount;
        abandonment.abandonedItems = cartData.items;
        abandonment.exitBehavior = cartData.exitBehavior;
        
        if (cartData.abandonmentReason) {
          abandonment.abandonmentReason = cartData.abandonmentReason;
        }
      }

      // Update checkout progress indicators
      this.updateCheckoutProgress(abandonment, cartData.currentStage);

      const savedAbandonment = await this.cartAbandonmentRepo.save(abandonment);

      // Trigger recovery campaigns for new abandonments
      if (isNewAbandonment && this.shouldTriggerRecovery(savedAbandonment)) {
        await this.scheduleRecoveryCampaigns(savedAbandonment);
      }

      // Publish abandonment event
      await this.publishAbandonmentEvent(savedAbandonment, isNewAbandonment);

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Cart abandonment ${isNewAbandonment ? 'detected' : 'updated'}: ${savedAbandonment.id}`,
        { processingTime, recoveryScheduled: isNewAbandonment }
      );

      return savedAbandonment;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to detect cart abandonment for cart ${cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Manually trigger recovery campaign for abandoned cart
   * 
   * @param abandonmentId - Abandonment record ID
   * @param campaignType - Type of recovery campaign
   * @param options - Campaign options
   * @returns Promise<IRecoveryCampaignResult> - Campaign result
   */
  async triggerRecoveryCampaign(
    abandonmentId: string,
    campaignType: RecoveryCampaignType,
    options: {
      discountPercentage?: number;
      customMessage?: string;
      testVariant?: string;
    } = {},
  ): Promise<IRecoveryCampaignResult> {
    const startTime = Date.now();
    
    this.logger.debug(
      `📧 Triggering recovery campaign: ${campaignType} for abandonment ${abandonmentId}`,
      { options }
    );

    try {
      const abandonment = await this.cartAbandonmentRepo.findOne({
        where: { id: abandonmentId },
      });

      if (!abandonment) {
        throw new Error(`Cart abandonment not found: ${abandonmentId}`);
      }

      if (abandonment.recoveryStatus === 'recovered') {
        throw new Error('Cart has already been recovered');
      }

      // Create campaign record
      const campaign = {
        type: campaignType,
        sentAt: new Date(),
        opened: false,
        clicked: false,
        recovered: false,
      };

      // Execute campaign (would integrate with email/SMS services)
      const campaignResult = await this.executeCampaign(
        abandonment,
        campaignType,
        options
      );

      // Update abandonment record
      const campaigns = abandonment.recoveryCampaigns || [];
      campaigns.push(campaign);
      
      await this.cartAbandonmentRepo.update(abandonmentId, {
        recoveryCampaigns: campaigns,
        recoveryStatus: 'in_progress',
        nextRecoveryScheduled: this.calculateNextCampaignTime(campaignType),
      });

      // Publish campaign event
      await this.publishCampaignEvent(abandonment, campaign);

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Recovery campaign triggered: ${campaignResult.campaignId}`,
        { processingTime, deliveryStatus: campaignResult.deliveryStatus }
      );

      return campaignResult;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to trigger recovery campaign: ${campaignType} for ${abandonmentId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Mark cart as recovered
   * 
   * @param cartId - Cart identifier
   * @param orderId - Completed order ID
   * @param recoveryMethod - Campaign that led to recovery
   * @returns Promise<void>
   */
  async markCartRecovered(
    cartId: string,
    orderId: number,
    recoveryMethod?: RecoveryCampaignType,
  ): Promise<void> {
    this.logger.debug(
      `✅ Marking cart as recovered: ${cartId}`,
      { orderId, recoveryMethod }
    );

    try {
      const abandonment = await this.cartAbandonmentRepo.findOne({
        where: { cartId },
      });

      if (!abandonment) {
        this.logger.warn(`Cart abandonment not found for cart: ${cartId}`);
        return;
      }

      if (abandonment.recoveryStatus === 'recovered') {
        this.logger.warn(`Cart already marked as recovered: ${cartId}`);
        return;
      }

      // Update abandonment record
      await this.cartAbandonmentRepo.update(abandonment.id, {
        recoveryStatus: 'recovered',
        recoveredAt: new Date(),
        recoveryMethod,
        nextRecoveryScheduled: null,
      });

      // Update campaign that led to recovery
      if (recoveryMethod && abandonment.recoveryCampaigns) {
        const campaigns = abandonment.recoveryCampaigns;
        const recoveryCampaign = campaigns
          .filter(c => c.type === recoveryMethod)
          .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

        if (recoveryCampaign) {
          recoveryCampaign.recovered = true;
          await this.cartAbandonmentRepo.update(abandonment.id, {
            recoveryCampaigns: campaigns,
          });
        }
      }

      // Publish recovery event
      await this.publishRecoveryEvent(abandonment, orderId, recoveryMethod);

      this.logger.debug(`✅ Cart recovery recorded: ${cartId}`);
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to mark cart as recovered: ${cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Get abandonment analytics for specified time period
   * 
   * @param startDate - Start date for analysis
   * @param endDate - End date for analysis
   * @returns Promise<IAbandonmentAnalytics> - Analytics data
   */
  async getAbandonmentAnalytics(
    startDate: Date,
    endDate: Date,
  ): Promise<IAbandonmentAnalytics> {
    const startTime = Date.now();
    
    this.logger.debug(
      `📊 Calculating abandonment analytics`,
      { startDate, endDate }
    );

    try {
      const [basicStats, campaignStats, reasonStats, totalCarts] = await Promise.all([
        // Basic abandonment statistics
        this.cartAbandonmentRepo
          .createQueryBuilder('abandonment')
          .select([
            'COUNT(*) as totalAbandonments',
            'AVG(abandonment.totalValue) as averageAbandonedValue',
            'SUM(CASE WHEN abandonment.recoveryStatus = :recovered THEN 1 ELSE 0 END) as totalRecovered',
          ])
          .where('abandonment.abandonedAt >= :startDate', { startDate })
          .andWhere('abandonment.abandonedAt <= :endDate', { endDate })
          .setParameter('recovered', 'recovered')
          .getRawOne(),

        // Campaign effectiveness statistics
        this.getCampaignEffectivenessStats(startDate, endDate),

        // Top abandonment reasons
        this.cartAbandonmentRepo
          .createQueryBuilder('abandonment')
          .select([
            'abandonment.abandonmentReason as reason',
            'COUNT(*) as count',
            'AVG(abandonment.totalValue) as averageValue',
          ])
          .where('abandonment.abandonedAt >= :startDate', { startDate })
          .andWhere('abandonment.abandonedAt <= :endDate', { endDate })
          .groupBy('abandonment.abandonmentReason')
          .orderBy('count', 'DESC')
          .getRawMany(),

        // Total cart creations for abandonment rate calculation
        this.businessEventRepo
          .createQueryBuilder('event')
          .select('COUNT(*)')
          .where('event.eventType = :cartCreated', {
            cartCreated: BusinessEventType.CART_CREATED,
          })
          .andWhere('event.eventTimestamp >= :startDate', { startDate })
          .andWhere('event.eventTimestamp <= :endDate', { endDate })
          .getRawOne(),
      ]);

      const totalAbandonments = parseInt(basicStats.totalAbandonments || '0');
      const totalRecovered = parseInt(basicStats.totalRecovered || '0');
      const totalCartCreations = parseInt(totalCarts.count || '0');

      const analytics: IAbandonmentAnalytics = {
        totalAbandonments,
        abandonmentRate: totalCartCreations > 0 
          ? (totalAbandonments / totalCartCreations) * 100 
          : 0,
        averageAbandonedValue: parseFloat(basicStats.averageAbandonedValue || '0'),
        recoveryRate: totalAbandonments > 0 
          ? (totalRecovered / totalAbandonments) * 100 
          : 0,
        recoveryCampaignEffectiveness: campaignStats,
        topReasons: reasonStats.map(stat => ({
          reason: stat.reason,
          count: parseInt(stat.count),
          percentage: totalAbandonments > 0 
            ? (parseInt(stat.count) / totalAbandonments) * 100 
            : 0,
          averageValue: parseFloat(stat.averageValue || '0'),
        })),
      };

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Abandonment analytics calculated`,
        { processingTime, analytics }
      );

      return analytics;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to calculate abandonment analytics`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Scheduled job to process pending recovery campaigns
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processPendingRecoveryCampaigns(): Promise<void> {
    this.logger.debug('🔄 Processing pending recovery campaigns');

    try {
      const pendingAbandonments = await this.cartAbandonmentRepo
        .createQueryBuilder('abandonment')
        .where('abandonment.recoveryStatus = :status', { status: 'in_progress' })
        .andWhere('abandonment.nextRecoveryScheduled IS NOT NULL')
        .andWhere('abandonment.nextRecoveryScheduled <= :now', { now: new Date() })
        .getMany();

      this.logger.debug(`Found ${pendingAbandonments.length} pending recovery campaigns`);

      for (const abandonment of pendingAbandonments) {
        try {
          await this.processScheduledRecovery(abandonment);
        } catch (error: unknown) {
          this.logger.error(
            `Failed to process recovery for abandonment ${abandonment.id}`,
            { error: error instanceof Error ? (error as Error).message : String(error) }
          );
        }
      }
    } catch (error: unknown) {
      this.logger.error(
        'Failed to process pending recovery campaigns',
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Event listener for cart-related business events
   */
  @OnEvent('business.cart_created')
  async handleCartCreated(payload: any): Promise<void> {
    // Track cart creation for abandonment detection
    this.logger.debug(`Cart created event received`, { eventId: payload.eventId });
  }

  @OnEvent('business.cart_item_added')
  async handleCartItemAdded(payload: any): Promise<void> {
    // Update cart stage for abandonment tracking
    this.logger.debug(`Cart item added event received`, { eventId: payload.eventId });
  }

  @OnEvent('business.checkout_started')
  async handleCheckoutStarted(payload: any): Promise<void> {
    // Update abandonment stage to checkout started
    this.logger.debug(`Checkout started event received`, { eventId: payload.eventId });
  }

  @OnEvent('business.purchase_completed')
  async handlePurchaseCompleted(payload: any): Promise<void> {
    const eventData = payload.eventData;
    if (eventData.aggregateId && eventData.aggregateType === 'cart') {
      await this.markCartRecovered(
        eventData.aggregateId,
        eventData.eventPayload.orderId
      );
    }
  }

  // Private helper methods

  /**
   * Update checkout progress indicators
   */
  private updateCheckoutProgress(
    abandonment: CartAbandonment,
    stage: AbandonmentStage,
  ): void {
    switch (stage) {
      case AbandonmentStage.CHECKOUT_VIEWED:
        abandonment.checkoutStarted = true;
        abandonment.checkoutPageViews = (abandonment.checkoutPageViews || 0) + 1;
        break;
      case AbandonmentStage.SHIPPING_FILLED:
        abandonment.shippingInfoProvided = true;
        break;
      case AbandonmentStage.PAYMENT_VIEWED:
        abandonment.paymentMethodSelected = true;
        break;
    }
  }

  /**
   * Check if recovery campaigns should be triggered
   */
  private shouldTriggerRecovery(abandonment: CartAbandonment): boolean {
    // Don't trigger recovery for low-value carts
    if (abandonment.totalValue < this.defaultAbandonmentCriteria.minimumCartValue) {
      return false;
    }

    // Don't trigger for guest users without contact info (for now)
    if (!abandonment.userId && this.defaultAbandonmentCriteria.requireEmail) {
      return false;
    }

    return true;
  }

  /**
   * Schedule recovery campaigns based on configuration
   */
  private async scheduleRecoveryCampaigns(abandonment: CartAbandonment): Promise<void> {
    const enabledCampaigns = this.defaultRecoveryConfig
      .filter(config => config.enabled)
      .sort((a, b) => a.delayMinutes - b.delayMinutes);

    if (enabledCampaigns.length === 0) {
      return;
    }

    // Schedule the first campaign
    const firstCampaign = enabledCampaigns[0];
    const scheduledTime = new Date(
      Date.now() + firstCampaign.delayMinutes * 60 * 1000
    );

    await this.cartAbandonmentRepo.update(abandonment.id, {
      recoveryStatus: 'in_progress',
      nextRecoveryScheduled: scheduledTime,
    });

    this.logger.debug(
      `Scheduled recovery campaign: ${firstCampaign.type} at ${scheduledTime.toISOString()}`,
      { abandonmentId: abandonment.id }
    );
  }

  /**
   * Execute recovery campaign
   */
  private async executeCampaign(
    abandonment: CartAbandonment,
    campaignType: RecoveryCampaignType,
    options: any,
  ): Promise<IRecoveryCampaignResult> {
    // This would integrate with actual email/SMS services
    // For now, return a mock result
    const campaignId = `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.debug(
      `Executing ${campaignType} campaign for abandonment ${abandonment.id}`,
      { campaignId, options }
    );

    // Simulate campaign execution
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      campaignId,
      type: campaignType,
      sentAt: new Date(),
      deliveryStatus: 'sent',
      estimatedDeliveryTime: new Date(Date.now() + 30000), // 30 seconds
    };
  }

  /**
   * Calculate next campaign time based on current campaign
   */
  private calculateNextCampaignTime(currentCampaign: RecoveryCampaignType): Date | null {
    const currentConfig = this.defaultRecoveryConfig.find(c => c.type === currentCampaign);
    if (!currentConfig) {
      return null;
    }

    const nextConfigs = this.defaultRecoveryConfig
      .filter(c => c.enabled && c.priority > currentConfig.priority)
      .sort((a, b) => a.priority - b.priority);

    if (nextConfigs.length === 0) {
      return null;
    }

    const nextConfig = nextConfigs[0];
    return new Date(Date.now() + nextConfig.delayMinutes * 60 * 1000);
  }

  /**
   * Process scheduled recovery campaign
   */
  private async processScheduledRecovery(abandonment: CartAbandonment): Promise<void> {
    // Determine which campaign to send next
    const sentCampaigns = (abandonment.recoveryCampaigns || []).map(c => c.type);
    const availableCampaigns = this.defaultRecoveryConfig
      .filter(c => c.enabled && !sentCampaigns.includes(c.type))
      .sort((a, b) => a.priority - b.priority);

    if (availableCampaigns.length === 0) {
      await this.cartAbandonmentRepo.update(abandonment.id, {
        recoveryStatus: 'completed',
        nextRecoveryScheduled: null,
      });
      return;
    }

    const nextCampaign = availableCampaigns[0];
    await this.triggerRecoveryCampaign(abandonment.id, nextCampaign.type, {
      discountPercentage: nextCampaign.discountPercentage,
    });
  }

  /**
   * Get campaign effectiveness statistics
   */
  private async getCampaignEffectivenessStats(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<RecoveryCampaignType, any>> {
    // This would analyze campaign performance across all abandonment records
    // For now, return empty stats
    const stats: Record<RecoveryCampaignType, any> = {} as any;
    
    for (const campaignType of Object.values(RecoveryCampaignType)) {
      stats[campaignType] = {
        sent: 0,
        recovered: 0,
        conversionRate: 0,
        revenue: 0,
      };
    }

    return stats;
  }

  /**
   * Publish business events for abandonment tracking
   */
  private async publishAbandonmentEvent(
    abandonment: CartAbandonment,
    isNew: boolean,
  ): Promise<void> {
    try {
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CART_ABANDONED,
        userId: abandonment.userId,
        sessionId: abandonment.sessionId,
        aggregateId: abandonment.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart_abandonment',
        eventPayload: {
          abandonmentId: abandonment.id,
          totalValue: abandonment.totalValue,
          itemCount: abandonment.itemCount,
          stage: abandonment.currentStage,
          reason: abandonment.abandonmentReason,
        },
        revenueAmount: abandonment.totalValue,
        currency: abandonment.currency,
        metadata: {
          isNewAbandonment: isNew,
          deviceInfo: abandonment.deviceInfo,
          locationInfo: abandonment.locationInfo,
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        'Failed to publish abandonment event',
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  private async publishCampaignEvent(
    abandonment: CartAbandonment,
    campaign: any,
  ): Promise<void> {
    try {
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CART_ABANDONED, // Would need a specific campaign event type
        userId: abandonment.userId,
        sessionId: abandonment.sessionId,
        aggregateId: abandonment.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart_abandonment',
        eventPayload: {
          abandonmentId: abandonment.id,
          campaignType: campaign.type,
          sentAt: campaign.sentAt,
        },
        metadata: {
          action: 'recovery_campaign_sent',
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        'Failed to publish campaign event',
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  private async publishRecoveryEvent(
    abandonment: CartAbandonment,
    orderId: number,
    recoveryMethod?: RecoveryCampaignType,
  ): Promise<void> {
    try {
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CART_RECOVERED,
        userId: abandonment.userId,
        sessionId: abandonment.sessionId,
        aggregateId: abandonment.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart_abandonment',
        eventPayload: {
          abandonmentId: abandonment.id,
          orderId,
          recoveryMethod,
          recoveredValue: abandonment.totalValue,
          timeTaken: abandonment.recoveredAt 
            ? abandonment.recoveredAt.getTime() - abandonment.abandonedAt.getTime()
            : null,
        },
        revenueAmount: abandonment.totalValue,
        currency: abandonment.currency,
        metadata: {
          action: 'cart_recovered',
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        'Failed to publish recovery event',
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }
}
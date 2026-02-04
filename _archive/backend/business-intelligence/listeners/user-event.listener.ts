/**
 * @file user-event.listener.ts
 * @description User Event Listener for Business Intelligence
 *
 * PURPOSE:
 * - Listens to user-related domain events
 * - Converts user events to business intelligence events
 * - Tracks user lifecycle and registration events
 * - Manages customer onboarding and engagement tracking
 *
 * INTEGRATION POINTS:
 * - User registration and authentication events
 * - User profile updates and preferences
 * - Login/logout activity tracking
 * - User engagement events
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BusinessEventPublisher } from '../services/business-event-publisher.service';
import { CustomerLifecycleService } from '../services/customer-lifecycle.service';
import { BusinessEventType } from '../entities/business-event.entity';

/**
 * User Event Listener
 * 
 * Processes user-related events and converts them to business intelligence
 * events for customer lifecycle tracking, engagement analytics, and onboarding.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Event Listeners')
 */
@Injectable()
export class UserEventListener {
  private readonly logger = new Logger(UserEventListener.name);

  constructor(
    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly customerLifecycleService: CustomerLifecycleService,
  ) {
    this.logger.log('👤 User Event Listener initialized');
  }

  /**
   * Handle user registration events
   * Creates customer lifecycle record and publishes registration event
   */
  @OnEvent('user.registered')
  async handleUserRegistered(payload: {
    userId: number;
    email: string;
    registrationMethod: 'email' | 'google' | 'facebook' | 'phone';
    referralCode?: string;
    acquisitionChannel?: string;
    registeredAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `👋 User registered event received`,
      { 
        userId: payload.userId,
        email: payload.email,
        registrationMethod: payload.registrationMethod,
      }
    );

    try {
      // Create customer lifecycle record
      await this.customerLifecycleService.updateCustomerLifecycle(payload.userId, {
        triggerEvent: BusinessEventType.USER_REGISTERED,
        updateSource: 'user_registration',
      });

      // Publish business intelligence event
      await this.businessEventPublisher.publishUserJourneyEvent({
        eventType: BusinessEventType.USER_REGISTERED,
        userId: payload.userId,
        aggregateId: `user_${payload.userId}`,
        aggregateType: 'user',
        sourceModule: 'auth',
        eventPayload: {
          userId: payload.userId,
          email: payload.email,
          registrationMethod: payload.registrationMethod,
          referralCode: payload.referralCode,
          acquisitionChannel: payload.acquisitionChannel || 'direct',
          registeredAt: payload.registeredAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'auth_service',
          customerLifecycleCreated: true,
        },
      });

      // Track referral if applicable
      if (payload.referralCode) {
        await this.handleReferralCompleted(payload.userId, payload.referralCode);
      }

      this.logger.debug(
        `✅ User registered business event published and lifecycle created`,
        { userId: payload.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle user registered event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle user login events
   * Tracks user engagement and activity patterns
   */
  @OnEvent('user.login')
  async handleUserLogin(payload: {
    userId: number;
    loginMethod: 'email' | 'google' | 'facebook' | 'phone';
    deviceType: 'desktop' | 'mobile' | 'tablet';
    location?: string;
    loginAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🔑 User login event received`,
      { 
        userId: payload.userId,
        loginMethod: payload.loginMethod,
        deviceType: payload.deviceType,
      }
    );

    try {
      // Update customer lifecycle with activity
      await this.customerLifecycleService.updateCustomerLifecycle(payload.userId, {
        updateSource: 'user_login',
      });

      // For now, we don't publish every login as a business event
      // Could be enabled for detailed engagement tracking if needed
      
      this.logger.debug(
        `✅ User login processed and lifecycle updated`,
        { userId: payload.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle user login event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle user profile update events
   * Tracks user engagement and data completeness
   */
  @OnEvent('user.profile.updated')
  async handleUserProfileUpdated(payload: {
    userId: number;
    updatedFields: string[];
    profileCompleteness: number;
    updatedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `📝 User profile updated event received`,
      { 
        userId: payload.userId,
        updatedFields: payload.updatedFields,
        profileCompleteness: payload.profileCompleteness,
      }
    );

    try {
      // Update customer lifecycle for significant profile updates
      if (this.isSignificantProfileUpdate(payload.updatedFields, payload.profileCompleteness)) {
        await this.customerLifecycleService.updateCustomerLifecycle(payload.userId, {
          updateSource: 'profile_update',
        });

        this.logger.debug(
          `✅ Significant profile update processed`,
          { userId: payload.userId, completeness: payload.profileCompleteness }
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle user profile updated event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle user churn detection events
   * Publishes churn events and updates customer lifecycle
   */
  @OnEvent('user.churn.detected')
  async handleUserChurnDetected(payload: {
    userId: number;
    lastActivityDate: Date;
    daysSinceLastActivity: number;
    churnProbability: number;
    churnReasons: string[];
    detectedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `📉 User churn detected event received`,
      { 
        userId: payload.userId,
        daysSinceLastActivity: payload.daysSinceLastActivity,
        churnProbability: payload.churnProbability,
      }
    );

    try {
      // Publish churn detection event
      await this.businessEventPublisher.publishUserJourneyEvent({
        eventType: BusinessEventType.USER_CHURN_DETECTED,
        userId: payload.userId,
        aggregateId: `user_${payload.userId}`,
        aggregateType: 'user',
        sourceModule: 'customer_lifecycle',
        eventPayload: {
          userId: payload.userId,
          lastActivityDate: payload.lastActivityDate,
          daysSinceLastActivity: payload.daysSinceLastActivity,
          churnProbability: payload.churnProbability,
          churnReasons: payload.churnReasons,
          detectedAt: payload.detectedAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'customer_lifecycle_service',
          churnDetection: true,
        },
      });

      this.logger.debug(
        `✅ User churn detected business event published`,
        { userId: payload.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle user churn detected event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle user reactivation events
   * Tracks successful retention and re-engagement
   */
  @OnEvent('user.reactivated')
  async handleUserReactivated(payload: {
    userId: number;
    previousChurnDate: Date;
    reactivationDate: Date;
    reactivationMethod: string;
    daysSinceChurn: number;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🔄 User reactivated event received`,
      { 
        userId: payload.userId,
        reactivationMethod: payload.reactivationMethod,
        daysSinceChurn: payload.daysSinceChurn,
      }
    );

    try {
      // Update customer lifecycle
      await this.customerLifecycleService.updateCustomerLifecycle(payload.userId, {
        triggerEvent: BusinessEventType.USER_REACTIVATED,
        forceRecalculation: true,
        updateSource: 'user_reactivation',
      });

      // Publish reactivation event
      await this.businessEventPublisher.publishUserJourneyEvent({
        eventType: BusinessEventType.USER_REACTIVATED,
        userId: payload.userId,
        aggregateId: `user_${payload.userId}`,
        aggregateType: 'user',
        sourceModule: 'customer_lifecycle',
        eventPayload: {
          userId: payload.userId,
          previousChurnDate: payload.previousChurnDate,
          reactivationDate: payload.reactivationDate,
          reactivationMethod: payload.reactivationMethod,
          daysSinceChurn: payload.daysSinceChurn,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'customer_lifecycle_service',
          reactivationSuccess: true,
        },
      });

      this.logger.debug(
        `✅ User reactivated business event published`,
        { userId: payload.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle user reactivated event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle user email verification events
   * Tracks onboarding progress and engagement
   */
  @OnEvent('user.email.verified')
  async handleEmailVerified(payload: {
    userId: number;
    email: string;
    verifiedAt: Date;
    verificationMethod: string;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `✅ User email verified event received`,
      { userId: payload.userId, email: payload.email }
    );

    try {
      // Update customer lifecycle for verification milestone
      await this.customerLifecycleService.updateCustomerLifecycle(payload.userId, {
        updateSource: 'email_verification',
      });

      this.logger.debug(
        `✅ Email verification processed`,
        { userId: payload.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle email verified event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle user subscription events (newsletter, notifications)
   * Tracks engagement preferences and communication opt-ins
   */
  @OnEvent('user.subscription.updated')
  async handleSubscriptionUpdated(payload: {
    userId: number;
    subscriptionType: 'newsletter' | 'promotions' | 'order_updates' | 'recommendations';
    subscribed: boolean;
    updatedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `📬 User subscription updated event received`,
      { 
        userId: payload.userId,
        subscriptionType: payload.subscriptionType,
        subscribed: payload.subscribed,
      }
    );

    try {
      // Track subscription changes for engagement scoring
      // This could affect customer engagement scores in the lifecycle service
      
      this.logger.debug(
        `✅ User subscription update processed`,
        { userId: payload.userId, subscriptionType: payload.subscriptionType }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle subscription updated event`,
        { 
          userId: payload.userId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  // Private helper methods

  /**
   * Handle referral completion tracking
   */
  private async handleReferralCompleted(userId: number, referralCode: string): Promise<void> {
    try {
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.REFERRAL_COMPLETED,
        userId,
        aggregateId: `referral_${referralCode}`,
        aggregateType: 'referral',
        sourceModule: 'auth',
        eventPayload: {
          userId,
          referralCode,
          completedAt: new Date(),
        },
        metadata: {
          eventSource: 'user_registration',
          referralTracking: true,
        },
      });

      this.logger.debug(
        `🎁 Referral completion tracked`,
        { userId, referralCode }
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to track referral completion`,
        { 
          userId,
          referralCode,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Check if profile update is significant enough to affect lifecycle
   */
  private isSignificantProfileUpdate(updatedFields: string[], completeness: number): boolean {
    const significantFields = [
      'phone', 'address', 'preferences', 'demographics'
    ];
    
    const hasSignificantField = updatedFields.some(field => 
      significantFields.includes(field)
    );
    
    const isHighCompleteness = completeness >= 80;
    
    return hasSignificantField || isHighCompleteness;
  }
}
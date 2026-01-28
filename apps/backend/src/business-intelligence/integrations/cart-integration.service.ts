/**
 * @file cart-integration.service.ts
 * @description Cart Integration Service for Business Intelligence
 *
 * PURPOSE:
 * - Provides integration hooks for cart service
 * - Emits business events from cart operations
 * - Enables seamless BI tracking without modifying existing cart code
 * - Supports both authenticated and guest user tracking
 *
 * INTEGRATION METHOD:
 * - Inject this service into existing CartService
 * - Call integration methods after cart operations
 * - Automatic event emission and BI tracking
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BusinessEventPublisher } from '../services/business-event-publisher.service';
import { CartAbandonmentService } from '../services/cart-abandonment.service';
import { AbandonmentStage, AbandonmentReason } from '../entities/cart-abandonment.entity';

/**
 * Cart Integration Service
 * 
 * Provides seamless integration between existing cart operations
 * and the business intelligence system for comprehensive tracking.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Integrations')
 */
@Injectable()
export class CartIntegrationService {
  private readonly logger = new Logger(CartIntegrationService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly cartAbandonmentService: CartAbandonmentService,
  ) {
    this.logger.log('🔗 Cart Integration Service initialized');
  }

  /**
   * Track cart creation for BI
   * Call this after creating a new cart
   */
  async trackCartCreated(params: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    currency?: string;
    deviceInfo?: any;
    locationInfo?: any;
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.created', {
        cartId: params.cartId,
        userId: params.userId,
        sessionId: params.sessionId,
        currency: params.currency || 'SYP',
        createdAt: new Date(),
        metadata: {
          deviceInfo: params.deviceInfo,
          locationInfo: params.locationInfo,
        },
      });

      this.logger.debug(
        `🎯 Cart created event emitted for BI tracking`,
        { cartId: params.cartId, userId: params.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track cart creation: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Track item added to cart for BI
   * Call this after adding items to cart
   */
  async trackCartItemAdded(params: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
    totalCartValue: number;
    itemCount: number;
    productName?: string;
    categoryId?: number;
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.item.added', {
        cartId: params.cartId,
        userId: params.userId,
        sessionId: params.sessionId,
        productId: params.productId,
        variantId: params.variantId,
        quantity: params.quantity,
        price: params.price,
        totalCartValue: params.totalCartValue,
        itemCount: params.itemCount,
        metadata: {
          productName: params.productName,
          categoryId: params.categoryId,
        },
      });

      this.logger.debug(
        `🎯 Cart item added event emitted for BI tracking`,
        { cartId: params.cartId, productId: params.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track cart item addition: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Track item removed from cart for BI
   * Call this after removing items from cart
   */
  async trackCartItemRemoved(params: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    productId: number;
    variantId?: number;
    quantity: number;
    removedValue: number;
    totalCartValue: number;
    itemCount: number;
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.item.removed', {
        cartId: params.cartId,
        userId: params.userId,
        sessionId: params.sessionId,
        productId: params.productId,
        variantId: params.variantId,
        quantity: params.quantity,
        removedValue: params.removedValue,
        totalCartValue: params.totalCartValue,
        itemCount: params.itemCount,
      });

      this.logger.debug(
        `🎯 Cart item removed event emitted for BI tracking`,
        { cartId: params.cartId, productId: params.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track cart item removal: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Track checkout started for BI
   * Call this when user starts checkout process
   */
  async trackCheckoutStarted(params: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    totalValue: number;
    itemCount: number;
    items: any[];
    shippingAddress?: any;
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.checkout.started', {
        cartId: params.cartId,
        userId: params.userId,
        sessionId: params.sessionId,
        totalValue: params.totalValue,
        itemCount: params.itemCount,
        items: params.items,
        metadata: {
          shippingAddress: params.shippingAddress,
        },
      });

      this.logger.debug(
        `🎯 Checkout started event emitted for BI tracking`,
        { cartId: params.cartId, totalValue: params.totalValue }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track checkout start: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Track checkout completed for BI
   * Call this after successful order creation
   */
  async trackCheckoutCompleted(params: {
    cartId: string;
    orderId: number;
    userId?: number;
    sessionId?: string;
    totalValue: number;
    paymentMethod: string;
    items: any[];
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.checkout.completed', {
        cartId: params.cartId,
        orderId: params.orderId,
        userId: params.userId,
        sessionId: params.sessionId,
        totalValue: params.totalValue,
        paymentMethod: params.paymentMethod,
        metadata: {
          items: params.items,
        },
      });

      this.logger.debug(
        `🎯 Checkout completed event emitted for BI tracking`,
        { cartId: params.cartId, orderId: params.orderId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track checkout completion: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Track cart abandonment for BI
   * Call this when detecting cart abandonment
   */
  async trackCartAbandoned(params: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    stage: AbandonmentStage;
    reason: AbandonmentReason;
    finalValue: number;
    itemCount: number;
    items: any[];
    cartCreatedAt?: Date;
    deviceInfo?: any;
    locationInfo?: any;
    exitBehavior?: any;
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.abandoned', {
        cartId: params.cartId,
        userId: params.userId,
        sessionId: params.sessionId,
        stage: params.stage,
        reason: params.reason,
        finalValue: params.finalValue,
        itemCount: params.itemCount,
        items: params.items,
        cartCreatedAt: params.cartCreatedAt,
        abandonedAt: new Date(),
        metadata: {
          deviceInfo: params.deviceInfo,
          locationInfo: params.locationInfo,
          exitBehavior: params.exitBehavior,
        },
      });

      this.logger.debug(
        `🎯 Cart abandoned event emitted for BI tracking`,
        { 
          cartId: params.cartId,
          stage: params.stage,
          reason: params.reason,
          finalValue: params.finalValue,
        }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track cart abandonment: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Track cart timeout (inactivity) for BI
   * Call this when detecting cart inactivity
   */
  async trackCartTimeout(params: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    lastActivityAt: Date;
    totalValue: number;
    itemCount: number;
    items: any[];
    inactiveMinutes: number;
  }): Promise<void> {
    try {
      await this.eventEmitter.emitAsync('cart.timeout', {
        cartId: params.cartId,
        userId: params.userId,
        sessionId: params.sessionId,
        lastActivityAt: params.lastActivityAt,
        totalValue: params.totalValue,
        itemCount: params.itemCount,
        items: params.items,
        inactiveMinutes: params.inactiveMinutes,
      });

      this.logger.debug(
        `🎯 Cart timeout event emitted for BI tracking`,
        { 
          cartId: params.cartId,
          inactiveMinutes: params.inactiveMinutes,
          totalValue: params.totalValue,
        }
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to track cart timeout: ${params.cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Get cart abandonment detection status
   * Check if cart is being tracked for abandonment
   */
  async getAbandonmentStatus(cartId: string): Promise<{
    isTracked: boolean;
    stage?: AbandonmentStage;
    recoveryStatus?: string;
  }> {
    try {
      // This would check the abandonment tracking status
      // For now, return a simple response
      return {
        isTracked: false, // Would check actual database
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get abandonment status for cart: ${cartId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      return { isTracked: false };
    }
  }

  /**
   * Utility method to detect abandonment reason based on cart state
   */
  detectAbandonmentReason(params: {
    stage: AbandonmentStage;
    totalValue: number;
    itemCount: number;
    shippingCost?: number;
    paymentFailed?: boolean;
    requiresRegistration?: boolean;
  }): AbandonmentReason {
    if (params.paymentFailed) {
      return AbandonmentReason.PAYMENT_FAILURE;
    }

    if (params.requiresRegistration) {
      return AbandonmentReason.REQUIRED_REGISTRATION;
    }

    if (params.shippingCost && params.shippingCost > params.totalValue * 0.2) {
      return AbandonmentReason.HIGH_SHIPPING_COST;
    }

    if (params.stage === AbandonmentStage.PAYMENT_VIEWED) {
      return AbandonmentReason.SECURITY_CONCERNS;
    }

    if (params.stage === AbandonmentStage.CHECKOUT_VIEWED) {
      return AbandonmentReason.COMPLEX_CHECKOUT;
    }

    return AbandonmentReason.UNKNOWN;
  }

  /**
   * Get abandonment stage based on cart activity
   */
  getAbandonmentStage(params: {
    hasItems: boolean;
    checkoutStarted: boolean;
    shippingProvided: boolean;
    paymentViewed: boolean;
    paymentAttempted: boolean;
  }): AbandonmentStage {
    if (params.paymentAttempted) {
      return AbandonmentStage.PAYMENT_ATTEMPTED;
    }

    if (params.paymentViewed) {
      return AbandonmentStage.PAYMENT_VIEWED;
    }

    if (params.shippingProvided) {
      return AbandonmentStage.SHIPPING_FILLED;
    }

    if (params.checkoutStarted) {
      return AbandonmentStage.CHECKOUT_VIEWED;
    }

    if (params.hasItems) {
      return AbandonmentStage.ITEMS_ADDED;
    }

    return AbandonmentStage.CART_CREATED;
  }
}
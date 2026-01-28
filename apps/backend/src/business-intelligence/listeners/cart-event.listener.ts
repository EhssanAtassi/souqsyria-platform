/**
 * @file cart-event.listener.ts
 * @description Cart Event Listener for Business Intelligence
 *
 * PURPOSE:
 * - Listens to cart-related domain events
 * - Converts cart events to business intelligence events
 * - Triggers cart abandonment detection
 * - Updates customer lifecycle metrics
 *
 * INTEGRATION POINTS:
 * - Cart service events (item added, removed, abandoned)
 * - Checkout workflow events (started, completed, abandoned)
 * - Guest and authenticated user cart events
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BusinessEventPublisher } from '../services/business-event-publisher.service';
import { CartAbandonmentService } from '../services/cart-abandonment.service';
import { BusinessEventType } from '../entities/business-event.entity';
import { AbandonmentStage, AbandonmentReason } from '../entities/cart-abandonment.entity';

/**
 * Cart Event Listener
 * 
 * Processes cart-related events and converts them to business intelligence
 * events for analytics, abandonment tracking, and customer insights.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Event Listeners')
 */
@Injectable()
export class CartEventListener {
  private readonly logger = new Logger(CartEventListener.name);

  constructor(
    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly cartAbandonmentService: CartAbandonmentService,
  ) {
    this.logger.log('🛒 Cart Event Listener initialized');
  }

  /**
   * Handle cart creation events
   * Publishes business event and starts abandonment tracking
   */
  @OnEvent('cart.created')
  async handleCartCreated(payload: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    currency: string;
    createdAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `📦 Cart created event received`,
      { cartId: payload.cartId, userId: payload.userId }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CART_CREATED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: payload.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart',
        eventPayload: {
          cartId: payload.cartId,
          currency: payload.currency,
          createdAt: payload.createdAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'cart_service',
        },
      });

      this.logger.debug(
        `✅ Cart created business event published`,
        { cartId: payload.cartId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle cart created event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle cart item added events
   * Publishes business event and updates cart value tracking
   */
  @OnEvent('cart.item.added')
  async handleCartItemAdded(payload: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    productId: number;
    variantId?: number;
    quantity: number;
    price: number;
    totalCartValue: number;
    itemCount: number;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🛍️ Cart item added event received`,
      { 
        cartId: payload.cartId,
        productId: payload.productId,
        quantity: payload.quantity,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CART_ITEM_ADDED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: payload.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart',
        eventPayload: {
          cartId: payload.cartId,
          productId: payload.productId,
          variantId: payload.variantId,
          quantity: payload.quantity,
          price: payload.price,
          totalCartValue: payload.totalCartValue,
          itemCount: payload.itemCount,
        },
        revenueAmount: payload.price * payload.quantity,
        currency: 'SYP', // Default currency, should be from cart data
        metadata: {
          ...payload.metadata,
          eventSource: 'cart_service',
        },
      });

      this.logger.debug(
        `✅ Cart item added business event published`,
        { cartId: payload.cartId, productId: payload.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle cart item added event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle cart item removed events
   * Publishes business event and updates abandonment tracking
   */
  @OnEvent('cart.item.removed')
  async handleCartItemRemoved(payload: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    productId: number;
    variantId?: number;
    quantity: number;
    removedValue: number;
    totalCartValue: number;
    itemCount: number;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🗑️ Cart item removed event received`,
      { 
        cartId: payload.cartId,
        productId: payload.productId,
        removedValue: payload.removedValue,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CART_ITEM_REMOVED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: payload.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart',
        eventPayload: {
          cartId: payload.cartId,
          productId: payload.productId,
          variantId: payload.variantId,
          quantity: payload.quantity,
          removedValue: payload.removedValue,
          totalCartValue: payload.totalCartValue,
          itemCount: payload.itemCount,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'cart_service',
        },
      });

      // If cart is now empty, consider it abandoned
      if (payload.itemCount === 0) {
        await this.handleCartAbandoned({
          cartId: payload.cartId,
          userId: payload.userId,
          sessionId: payload.sessionId,
          stage: AbandonmentStage.ABANDONED,
          reason: AbandonmentReason.UNKNOWN,
          finalValue: 0,
          itemCount: 0,
          items: [],
          metadata: payload.metadata,
        });
      }

      this.logger.debug(
        `✅ Cart item removed business event published`,
        { cartId: payload.cartId, productId: payload.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle cart item removed event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle cart abandoned events
   * Triggers abandonment detection and recovery workflows
   */
  @OnEvent('cart.abandoned')
  async handleCartAbandoned(payload: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    stage: AbandonmentStage;
    reason: AbandonmentReason;
    finalValue: number;
    itemCount: number;
    items: any[];
    cartCreatedAt?: Date;
    abandonedAt?: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🚫 Cart abandoned event received`,
      { 
        cartId: payload.cartId,
        stage: payload.stage,
        reason: payload.reason,
        finalValue: payload.finalValue,
      }
    );

    try {
      // Detect and create abandonment record
      await this.cartAbandonmentService.detectAbandonment(
        payload.cartId,
        payload.userId || null,
        payload.sessionId || null,
        {
          totalValue: payload.finalValue,
          currency: 'SYP', // Should come from cart data
          itemCount: payload.itemCount,
          items: payload.items,
          cartCreatedAt: payload.cartCreatedAt || new Date(),
          currentStage: payload.stage,
          abandonmentReason: payload.reason,
          deviceInfo: payload.metadata?.deviceInfo,
          locationInfo: payload.metadata?.locationInfo,
          exitBehavior: payload.metadata?.exitBehavior,
        }
      );

      this.logger.debug(
        `✅ Cart abandonment detected and tracked`,
        { cartId: payload.cartId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle cart abandoned event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle checkout started events
   * Updates abandonment stage and publishes business event
   */
  @OnEvent('cart.checkout.started')
  async handleCheckoutStarted(payload: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    totalValue: number;
    itemCount: number;
    items: any[];
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🚀 Checkout started event received`,
      { cartId: payload.cartId, totalValue: payload.totalValue }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CHECKOUT_STARTED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: payload.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart',
        eventPayload: {
          cartId: payload.cartId,
          totalValue: payload.totalValue,
          itemCount: payload.itemCount,
          items: payload.items,
        },
        revenueAmount: payload.totalValue,
        currency: 'SYP',
        metadata: {
          ...payload.metadata,
          eventSource: 'cart_service',
        },
      });

      // Update abandonment stage if tracking exists
      await this.updateAbandonmentStage(
        payload.cartId,
        AbandonmentStage.CHECKOUT_VIEWED,
        payload
      );

      this.logger.debug(
        `✅ Checkout started business event published`,
        { cartId: payload.cartId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle checkout started event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle checkout completed events
   * Marks cart as recovered if it was abandoned
   */
  @OnEvent('cart.checkout.completed')
  async handleCheckoutCompleted(payload: {
    cartId: string;
    orderId: number;
    userId?: number;
    sessionId?: string;
    totalValue: number;
    paymentMethod: string;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `✅ Checkout completed event received`,
      { 
        cartId: payload.cartId,
        orderId: payload.orderId,
        totalValue: payload.totalValue,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CHECKOUT_COMPLETED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: payload.cartId,
        aggregateType: 'cart',
        sourceModule: 'cart',
        eventPayload: {
          cartId: payload.cartId,
          orderId: payload.orderId,
          totalValue: payload.totalValue,
          paymentMethod: payload.paymentMethod,
        },
        revenueAmount: payload.totalValue,
        currency: 'SYP',
        metadata: {
          ...payload.metadata,
          eventSource: 'cart_service',
        },
      });

      // Mark cart as recovered if it was abandoned
      await this.cartAbandonmentService.markCartRecovered(
        payload.cartId,
        payload.orderId
      );

      this.logger.debug(
        `✅ Checkout completed business event published and cart marked as recovered`,
        { cartId: payload.cartId, orderId: payload.orderId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle checkout completed event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle cart timeout events (inactive carts)
   * Triggers abandonment detection based on inactivity
   */
  @OnEvent('cart.timeout')
  async handleCartTimeout(payload: {
    cartId: string;
    userId?: number;
    sessionId?: string;
    lastActivityAt: Date;
    totalValue: number;
    itemCount: number;
    items: any[];
    inactiveMinutes: number;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `⏰ Cart timeout event received`,
      { 
        cartId: payload.cartId,
        inactiveMinutes: payload.inactiveMinutes,
        totalValue: payload.totalValue,
      }
    );

    try {
      // Only consider it abandoned if it has significant value and items
      if (payload.totalValue >= 10 && payload.itemCount > 0) {
        await this.handleCartAbandoned({
          cartId: payload.cartId,
          userId: payload.userId,
          sessionId: payload.sessionId,
          stage: AbandonmentStage.ABANDONED,
          reason: AbandonmentReason.UNKNOWN, // Timeout-based abandonment
          finalValue: payload.totalValue,
          itemCount: payload.itemCount,
          items: payload.items,
          abandonedAt: new Date(),
          metadata: {
            ...payload.metadata,
            abandonmentTrigger: 'timeout',
            inactiveMinutes: payload.inactiveMinutes,
          },
        });
      }

      this.logger.debug(
        `✅ Cart timeout processed`,
        { cartId: payload.cartId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle cart timeout event`,
        { 
          cartId: payload.cartId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  // Private helper methods

  /**
   * Update abandonment stage for existing tracking records
   */
  private async updateAbandonmentStage(
    cartId: string,
    stage: AbandonmentStage,
    eventData: any,
  ): Promise<void> {
    try {
      // This would update existing abandonment records
      // For now, we detect abandonment when needed
      if (stage !== AbandonmentStage.ABANDONED) {
        // Update progression through checkout stages
        await this.cartAbandonmentService.detectAbandonment(
          cartId,
          eventData.userId || null,
          eventData.sessionId || null,
          {
            totalValue: eventData.totalValue || 0,
            currency: 'SYP',
            itemCount: eventData.itemCount || 0,
            items: eventData.items || [],
            cartCreatedAt: new Date(),
            currentStage: stage,
          }
        );
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to update abandonment stage for cart ${cartId}`,
        { 
          stage,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }
}
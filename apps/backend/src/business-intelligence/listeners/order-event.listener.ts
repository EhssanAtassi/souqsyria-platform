/**
 * @file order-event.listener.ts
 * @description Order Event Listener for Business Intelligence
 *
 * PURPOSE:
 * - Listens to order-related domain events
 * - Converts order events to business intelligence events
 * - Tracks purchase completion and revenue events
 * - Updates customer lifecycle with purchase data
 *
 * INTEGRATION POINTS:
 * - Order service events (created, completed, cancelled)
 * - Payment completion events
 * - Order status change events
 * - Return and refund events
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BusinessEventPublisher } from '../services/business-event-publisher.service';
import { CustomerLifecycleService } from '../services/customer-lifecycle.service';
import { CartAbandonmentService } from '../services/cart-abandonment.service';
import { BusinessEventType } from '../entities/business-event.entity';

/**
 * Order Event Listener
 * 
 * Processes order-related events and converts them to business intelligence
 * events for analytics, revenue tracking, and customer lifecycle management.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Event Listeners')
 */
@Injectable()
export class OrderEventListener {
  private readonly logger = new Logger(OrderEventListener.name);

  constructor(
    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly customerLifecycleService: CustomerLifecycleService,
    private readonly cartAbandonmentService: CartAbandonmentService,
  ) {
    this.logger.log('📦 Order Event Listener initialized');
  }

  /**
   * Handle order created events
   * Publishes business event and starts order tracking
   */
  @OnEvent('order.created')
  async handleOrderCreated(payload: {
    orderId: number;
    orderNumber: string;
    userId: number;
    cartId?: string;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    items: Array<{
      productId: number;
      variantId?: number;
      quantity: number;
      price: number;
      productName: string;
      categoryId?: number;
    }>;
    shippingAddress: any;
    createdAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `📦 Order created event received`,
      { 
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        userId: payload.userId,
        totalAmount: payload.totalAmount,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.PURCHASE_COMPLETED,
        userId: payload.userId,
        aggregateId: `order_${payload.orderId}`,
        aggregateType: 'order',
        sourceModule: 'orders',
        eventPayload: {
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          cartId: payload.cartId,
          totalAmount: payload.totalAmount,
          currency: payload.currency,
          paymentMethod: payload.paymentMethod,
          itemCount: payload.items.length,
          items: payload.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            productName: item.productName,
            categoryId: item.categoryId,
            revenue: item.price * item.quantity,
          })),
          categories: [...new Set(payload.items.map(item => item.categoryId).filter(Boolean))],
        },
        revenueAmount: payload.totalAmount,
        currency: payload.currency,
        metadata: {
          ...payload.metadata,
          eventSource: 'order_service',
          paymentMethod: payload.paymentMethod,
          shippingAddress: payload.shippingAddress,
        },
      });

      // Check if this is the user's first purchase
      await this.checkFirstPurchase(payload.userId, payload.orderId);

      // Mark associated cart as recovered if applicable
      if (payload.cartId) {
        await this.cartAbandonmentService.markCartRecovered(
          payload.cartId,
          payload.orderId
        );
      }

      this.logger.debug(
        `✅ Order created business event published`,
        { orderId: payload.orderId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle order created event`,
        { 
          orderId: payload.orderId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle order status changed events
   * Publishes business event and updates order tracking
   */
  @OnEvent('order.status.changed')
  async handleOrderStatusChanged(payload: {
    orderId: number;
    orderNumber: string;
    userId: number;
    previousStatus: string;
    newStatus: string;
    changedAt: Date;
    changedBy?: number;
    reason?: string;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🔄 Order status changed event received`,
      { 
        orderId: payload.orderId,
        previousStatus: payload.previousStatus,
        newStatus: payload.newStatus,
      }
    );

    try {
      // Publish business intelligence event for significant status changes
      if (this.isSignificantStatusChange(payload.previousStatus, payload.newStatus)) {
        await this.businessEventPublisher.publishEvent({
          eventType: this.getEventTypeForStatus(payload.newStatus),
          userId: payload.userId,
          aggregateId: `order_${payload.orderId}`,
          aggregateType: 'order',
          sourceModule: 'orders',
          eventPayload: {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            previousStatus: payload.previousStatus,
            newStatus: payload.newStatus,
            changedBy: payload.changedBy,
            reason: payload.reason,
          },
          metadata: {
            ...payload.metadata,
            eventSource: 'order_service',
            statusChange: true,
          },
        });
      }

      this.logger.debug(
        `✅ Order status change business event published`,
        { orderId: payload.orderId, newStatus: payload.newStatus }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle order status changed event`,
        { 
          orderId: payload.orderId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle order cancelled events
   * Publishes business event and updates customer metrics
   */
  @OnEvent('order.cancelled')
  async handleOrderCancelled(payload: {
    orderId: number;
    orderNumber: string;
    userId: number;
    totalAmount: number;
    currency: string;
    cancelledBy: number;
    reason: string;
    refundRequired: boolean;
    cancelledAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `❌ Order cancelled event received`,
      { 
        orderId: payload.orderId,
        reason: payload.reason,
        refundRequired: payload.refundRequired,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CHECKOUT_ABANDONED, // Using checkout abandoned as closest match
        userId: payload.userId,
        aggregateId: `order_${payload.orderId}`,
        aggregateType: 'order',
        sourceModule: 'orders',
        eventPayload: {
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          totalAmount: payload.totalAmount,
          currency: payload.currency,
          cancelledBy: payload.cancelledBy,
          reason: payload.reason,
          refundRequired: payload.refundRequired,
        },
        revenueAmount: -payload.totalAmount, // Negative revenue for cancellation
        currency: payload.currency,
        metadata: {
          ...payload.metadata,
          eventSource: 'order_service',
          orderCancelled: true,
        },
      });

      this.logger.debug(
        `✅ Order cancelled business event published`,
        { orderId: payload.orderId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle order cancelled event`,
        { 
          orderId: payload.orderId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle payment completed events
   * Updates order revenue tracking and customer CLV
   */
  @OnEvent('payment.completed')
  async handlePaymentCompleted(payload: {
    paymentId: number;
    orderId: number;
    userId: number;
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    completedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `💰 Payment completed event received`,
      { 
        paymentId: payload.paymentId,
        orderId: payload.orderId,
        amount: payload.amount,
      }
    );

    try {
      // Publish revenue event for CLV calculation
      await this.businessEventPublisher.publishRevenueEvent({
        eventType: BusinessEventType.PURCHASE_COMPLETED,
        userId: payload.userId,
        aggregateId: `payment_${payload.paymentId}`,
        aggregateType: 'payment',
        sourceModule: 'payment',
        eventPayload: {
          paymentId: payload.paymentId,
          orderId: payload.orderId,
          amount: payload.amount,
          currency: payload.currency,
          paymentMethod: payload.paymentMethod,
          transactionId: payload.transactionId,
        },
        revenueAmount: payload.amount,
        currency: payload.currency,
        metadata: {
          ...payload.metadata,
          eventSource: 'payment_service',
          paymentCompleted: true,
        },
      });

      this.logger.debug(
        `✅ Payment completed business event published`,
        { paymentId: payload.paymentId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle payment completed event`,
        { 
          paymentId: payload.paymentId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle return request events
   * Tracks return patterns and customer satisfaction
   */
  @OnEvent('order.return.requested')
  async handleReturnRequested(payload: {
    returnId: number;
    orderId: number;
    userId: number;
    items: Array<{
      productId: number;
      quantity: number;
      reason: string;
    }>;
    totalReturnAmount: number;
    reason: string;
    requestedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🔙 Return requested event received`,
      { 
        returnId: payload.returnId,
        orderId: payload.orderId,
        reason: payload.reason,
      }
    );

    try {
      // Publish business intelligence event for return analytics
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CHECKOUT_ABANDONED, // Need a return event type
        userId: payload.userId,
        aggregateId: `return_${payload.returnId}`,
        aggregateType: 'return',
        sourceModule: 'orders',
        eventPayload: {
          returnId: payload.returnId,
          orderId: payload.orderId,
          items: payload.items,
          totalReturnAmount: payload.totalReturnAmount,
          reason: payload.reason,
        },
        revenueAmount: -payload.totalReturnAmount, // Negative revenue impact
        currency: 'SYP', // Should come from order data
        metadata: {
          ...payload.metadata,
          eventSource: 'order_service',
          returnRequested: true,
        },
      });

      this.logger.debug(
        `✅ Return requested business event published`,
        { returnId: payload.returnId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle return requested event`,
        { 
          returnId: payload.returnId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  // Private helper methods

  /**
   * Check if this is the customer's first purchase
   */
  private async checkFirstPurchase(userId: number, orderId: number): Promise<void> {
    try {
      // Get customer lifecycle to check if this is first purchase
      const lifecycle = await this.customerLifecycleService.updateCustomerLifecycle(userId, {
        triggerEvent: BusinessEventType.PURCHASE_COMPLETED,
        forceRecalculation: true,
        updateSource: 'order_created',
      });

      // Publish first purchase event if applicable
      if (lifecycle.totalOrders === 1 && lifecycle.firstPurchaseDate) {
        await this.businessEventPublisher.publishUserJourneyEvent({
          eventType: BusinessEventType.USER_FIRST_PURCHASE,
          userId,
          aggregateId: `order_${orderId}`,
          aggregateType: 'order',
          sourceModule: 'orders',
          eventPayload: {
            orderId,
            firstPurchaseDate: lifecycle.firstPurchaseDate,
            daysSinceRegistration: lifecycle.daysSinceRegistration,
            orderValue: lifecycle.averageOrderValue,
          },
          revenueAmount: lifecycle.averageOrderValue,
          currency: 'SYP',
          metadata: {
            eventSource: 'order_service',
            milestone: 'first_purchase',
          },
        });

        this.logger.debug(
          `🎉 First purchase event published for user ${userId}`,
          { orderId }
        );
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to check first purchase for user ${userId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
    }
  }

  /**
   * Check if status change is significant enough to track
   */
  private isSignificantStatusChange(previousStatus: string, newStatus: string): boolean {
    const significantStatuses = [
      'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'
    ];
    
    return significantStatuses.includes(newStatus) || 
           (previousStatus === 'pending' && newStatus === 'paid');
  }

  /**
   * Get appropriate event type for order status
   */
  private getEventTypeForStatus(status: string): BusinessEventType {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return BusinessEventType.PURCHASE_COMPLETED;
      case 'cancelled':
        return BusinessEventType.CHECKOUT_ABANDONED;
      default:
        return BusinessEventType.PURCHASE_COMPLETED; // Default fallback
    }
  }
}
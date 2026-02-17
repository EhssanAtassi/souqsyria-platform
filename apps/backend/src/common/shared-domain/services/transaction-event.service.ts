/**
 * @file transaction-event.service.ts
 * @description Transaction Event Service for cross-module communication
 *
 * PURPOSE:
 * Provides a typed, centralized way to emit and handle transaction events
 * across Orders, Payment, and Refund modules without circular dependencies.
 *
 * @example
 * // In OrdersService:
 * async createOrder(dto: CreateOrderDto) {
 *   const order = await this.orderRepo.save(orderData);
 *   await this.transactionEvents.emitOrderCreated({
 *     order: { id: order.id, orderNumber: order.orderNumber, ... },
 *     customer: { id: user.id, email: user.email, ... },
 *     items: orderItems,
 *     amounts: { subtotal, discount, tax, shipping, total, currency },
 *   });
 *   return order;
 * }
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import {
  ORDER_EVENTS,
  PAYMENT_EVENTS,
  REFUND_EVENTS,
  STOCK_EVENTS,
  IOrderCreatedEvent,
  IOrderStatusChangedEvent,
  IOrderCancelledEvent,
  IPaymentInitiatedEvent,
  IPaymentCompletedEvent,
  IPaymentFailedEvent,
  IRefundRequestedEvent,
  IRefundCompletedEvent,
  IStockReservedEvent,
  IStockReleasedEvent,
  ILowStockAlertEvent,
  IDomainEventBase,
} from '../events/domain.events';
import {
  IOrderReference,
  IPaymentReference,
  IRefundReference,
  IUserReference,
  IStockReference,
  IAmountBreakdown,
  CurrencyCode,
} from '../interfaces/transaction.interfaces';

/**
 * TransactionEventService
 * @description Centralized service for emitting transaction-related domain events
 *
 * @swagger
 * @ApiTags('Internal - Events')
 */
@Injectable()
export class TransactionEventService {
  private readonly logger = new Logger(TransactionEventService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Creates base event metadata
   * @param source - Source module name
   * @param triggeredBy - User ID who triggered the event
   * @returns Base event metadata
   */
  private createEventBase(
    source: string,
    triggeredBy?: number,
  ): IDomainEventBase {
    return {
      timestamp: new Date(),
      correlationId: uuidv4(),
      source,
      triggeredBy,
    };
  }

  /**
   * Emit event with logging
   * @param eventName - Event name
   * @param payload - Event payload
   */
  private async emit<T extends IDomainEventBase>(
    eventName: string,
    payload: T,
  ): Promise<void> {
    this.logger.debug(`Emitting event: ${eventName}`, {
      correlationId: payload.correlationId,
      source: payload.source,
    });

    try {
      await this.eventEmitter.emitAsync(eventName, payload);
      this.logger.debug(`Event emitted successfully: ${eventName}`);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to emit event: ${eventName}`,
        error instanceof Error ? (error as Error).stack : String(error),
      );
      // Don't throw - event emission failures shouldn't break the main flow
    }
  }

  // ===========================================================================
  // ORDER EVENTS
  // ===========================================================================

  /**
   * Emit order.created event
   * @description Notifies Payment and Stock modules that an order was created
   */
  async emitOrderCreated(data: {
    order: IOrderReference;
    customer: IUserReference;
    items: Array<{
      productId: number;
      variantId?: number;
      quantity: number;
      unitPrice: number;
    }>;
    amounts: IAmountBreakdown;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('orders', data.triggeredBy);
    const event: IOrderCreatedEvent = {
      ...base,
      order: data.order,
      customer: data.customer,
      items: data.items,
      amounts: data.amounts,
    };

    await this.emit(ORDER_EVENTS.CREATED, event);
    return base.correlationId;
  }

  /**
   * Emit order.status.changed event
   * @description Notifies interested modules of order status changes
   */
  async emitOrderStatusChanged(data: {
    orderId: number;
    orderNumber: string;
    previousStatus: string;
    newStatus: string;
    reason?: string;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('orders', data.triggeredBy);
    const event: IOrderStatusChangedEvent = {
      ...base,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      reason: data.reason,
    };

    await this.emit(ORDER_EVENTS.STATUS_CHANGED, event);
    return base.correlationId;
  }

  /**
   * Emit order.cancelled event
   * @description Notifies Payment (for refund) and Stock (to release) modules
   */
  async emitOrderCancelled(data: {
    order: IOrderReference;
    reason: string;
    cancelledBy: number;
    refundRequired: boolean;
  }): Promise<string> {
    const base = this.createEventBase('orders', data.cancelledBy);
    const event: IOrderCancelledEvent = {
      ...base,
      order: data.order,
      reason: data.reason,
      cancelledBy: data.cancelledBy,
      refundRequired: data.refundRequired,
    };

    await this.emit(ORDER_EVENTS.CANCELLED, event);
    return base.correlationId;
  }

  // ===========================================================================
  // PAYMENT EVENTS
  // ===========================================================================

  /**
   * Emit payment.initiated event
   * @description Notifies Orders module that payment process started
   */
  async emitPaymentInitiated(data: {
    payment: IPaymentReference;
    order: IOrderReference;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('payment', data.triggeredBy);
    const event: IPaymentInitiatedEvent = {
      ...base,
      payment: data.payment,
      order: data.order,
    };

    await this.emit(PAYMENT_EVENTS.INITIATED, event);
    return base.correlationId;
  }

  /**
   * Emit payment.completed event
   * @description Notifies Orders module to update status and Stock to confirm reservation
   */
  async emitPaymentCompleted(data: {
    payment: IPaymentReference;
    orderId: number;
    transactionReference: string;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('payment', data.triggeredBy);
    const event: IPaymentCompletedEvent = {
      ...base,
      payment: data.payment,
      orderId: data.orderId,
      transactionReference: data.transactionReference,
    };

    await this.emit(PAYMENT_EVENTS.COMPLETED, event);
    return base.correlationId;
  }

  /**
   * Emit payment.failed event
   * @description Notifies Orders module and Stock module to release reservation
   */
  async emitPaymentFailed(data: {
    payment: IPaymentReference;
    orderId: number;
    errorCode: string;
    errorMessage: string;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('payment', data.triggeredBy);
    const event: IPaymentFailedEvent = {
      ...base,
      payment: data.payment,
      orderId: data.orderId,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage,
    };

    await this.emit(PAYMENT_EVENTS.FAILED, event);
    return base.correlationId;
  }

  // ===========================================================================
  // REFUND EVENTS
  // ===========================================================================

  /**
   * Emit refund.requested event
   * @description Notifies Payment module to process refund
   */
  async emitRefundRequested(data: {
    refund: IRefundReference;
    order: IOrderReference;
    requestedBy: number;
    reason: string;
  }): Promise<string> {
    const base = this.createEventBase('refund', data.requestedBy);
    const event: IRefundRequestedEvent = {
      ...base,
      refund: data.refund,
      order: data.order,
      requestedBy: data.requestedBy,
      reason: data.reason,
    };

    await this.emit(REFUND_EVENTS.REQUESTED, event);
    return base.correlationId;
  }

  /**
   * Emit refund.completed event
   * @description Notifies Orders module to update status
   */
  async emitRefundCompleted(data: {
    refund: IRefundReference;
    orderId: number;
    paymentId: number;
    refundedAmount: number;
    currency: CurrencyCode;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('refund', data.triggeredBy);
    const event: IRefundCompletedEvent = {
      ...base,
      refund: data.refund,
      orderId: data.orderId,
      paymentId: data.paymentId,
      refundedAmount: data.refundedAmount,
      currency: data.currency,
    };

    await this.emit(REFUND_EVENTS.COMPLETED, event);
    return base.correlationId;
  }

  // ===========================================================================
  // STOCK EVENTS
  // ===========================================================================

  /**
   * Emit stock.reserved event
   * @description Notifies interested modules of stock reservation
   */
  async emitStockReserved(data: {
    stock: IStockReference;
    orderId: number;
    reservedQuantity: number;
    expiresAt: Date;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('stock', data.triggeredBy);
    const event: IStockReservedEvent = {
      ...base,
      stock: data.stock,
      orderId: data.orderId,
      reservedQuantity: data.reservedQuantity,
      expiresAt: data.expiresAt,
    };

    await this.emit(STOCK_EVENTS.RESERVED, event);
    return base.correlationId;
  }

  /**
   * Emit stock.released event
   * @description Notifies interested modules of stock release
   */
  async emitStockReleased(data: {
    stock: IStockReference;
    orderId?: number;
    releasedQuantity: number;
    reason: string;
    triggeredBy?: number;
  }): Promise<string> {
    const base = this.createEventBase('stock', data.triggeredBy);
    const event: IStockReleasedEvent = {
      ...base,
      stock: data.stock,
      orderId: data.orderId,
      releasedQuantity: data.releasedQuantity,
      reason: data.reason,
    };

    await this.emit(STOCK_EVENTS.RELEASED, event);
    return base.correlationId;
  }

  /**
   * Emit stock.low.alert event
   * @description Notifies admin/vendor of low stock
   */
  async emitLowStockAlert(data: {
    productId: number;
    productName: string;
    warehouseId: number;
    currentQuantity: number;
    thresholdQuantity: number;
  }): Promise<string> {
    const base = this.createEventBase('stock');
    const event: ILowStockAlertEvent = {
      ...base,
      productId: data.productId,
      productName: data.productName,
      warehouseId: data.warehouseId,
      currentQuantity: data.currentQuantity,
      thresholdQuantity: data.thresholdQuantity,
    };

    await this.emit(STOCK_EVENTS.LOW_STOCK_ALERT, event);
    return base.correlationId;
  }
}

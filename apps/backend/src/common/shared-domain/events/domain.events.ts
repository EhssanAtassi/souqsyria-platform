/**
 * @file domain.events.ts
 * @description Domain Events for cross-module communication
 *
 * EVENT-DRIVEN ARCHITECTURE:
 * These events enable loose coupling between modules:
 * - Orders module emits OrderCreated → Payment listens
 * - Payment module emits PaymentCompleted → Orders listens
 * - Refund module emits RefundProcessed → Payment, Orders listen
 *
 * BENEFITS:
 * 1. No direct module imports needed
 * 2. Modules can react to events asynchronously
 * 3. Easy to add new listeners without modifying emitter
 * 4. Better testability (mock event emitter)
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import {
  IOrderReference,
  IPaymentReference,
  IRefundReference,
  IUserReference,
  IStockReference,
  IAmountBreakdown,
  TransactionStatus,
  CurrencyCode,
} from '../interfaces/transaction.interfaces';

// =============================================================================
// EVENT NAMES (Constants for type safety)
// =============================================================================

/**
 * Order-related event names
 */
export const ORDER_EVENTS = {
  CREATED: 'order.created',
  UPDATED: 'order.updated',
  CANCELLED: 'order.cancelled',
  COMPLETED: 'order.completed',
  STATUS_CHANGED: 'order.status.changed',
  ITEM_ADDED: 'order.item.added',
  ITEM_REMOVED: 'order.item.removed',
} as const;

/**
 * Payment-related event names
 */
export const PAYMENT_EVENTS = {
  INITIATED: 'payment.initiated',
  PROCESSING: 'payment.processing',
  COMPLETED: 'payment.completed',
  FAILED: 'payment.failed',
  REFUND_REQUESTED: 'payment.refund.requested',
} as const;

/**
 * Refund-related event names
 */
export const REFUND_EVENTS = {
  REQUESTED: 'refund.requested',
  APPROVED: 'refund.approved',
  REJECTED: 'refund.rejected',
  PROCESSING: 'refund.processing',
  COMPLETED: 'refund.completed',
  FAILED: 'refund.failed',
} as const;

/**
 * Stock-related event names
 */
export const STOCK_EVENTS = {
  RESERVED: 'stock.reserved',
  RELEASED: 'stock.released',
  DEPLETED: 'stock.depleted',
  LOW_STOCK_ALERT: 'stock.low.alert',
  ADJUSTED: 'stock.adjusted',
} as const;

/**
 * Product-related event names
 */
export const PRODUCT_EVENTS = {
  CREATED: 'product.created',
  UPDATED: 'product.updated',
  DELETED: 'product.deleted',
  PRICE_CHANGED: 'product.price.changed',
  STATUS_CHANGED: 'product.status.changed',
} as const;

// =============================================================================
// EVENT PAYLOAD INTERFACES
// =============================================================================

/**
 * Base event payload with common metadata
 */
export interface IDomainEventBase {
  /** Event timestamp */
  timestamp: Date;
  /** Correlation ID for tracing */
  correlationId: string;
  /** User ID who triggered the event */
  triggeredBy?: number;
  /** Source module */
  source: string;
}

// -----------------------------------------------------------------------------
// Order Events
// -----------------------------------------------------------------------------

/**
 * Event: Order Created
 * @emits order.created
 */
export interface IOrderCreatedEvent extends IDomainEventBase {
  order: IOrderReference;
  customer: IUserReference;
  items: Array<{
    productId: number;
    variantId?: number;
    quantity: number;
    unitPrice: number;
  }>;
  amounts: IAmountBreakdown;
}

/**
 * Event: Order Status Changed
 * @emits order.status.changed
 */
export interface IOrderStatusChangedEvent extends IDomainEventBase {
  orderId: number;
  orderNumber: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
}

/**
 * Event: Order Cancelled
 * @emits order.cancelled
 */
export interface IOrderCancelledEvent extends IDomainEventBase {
  order: IOrderReference;
  reason: string;
  cancelledBy: number;
  refundRequired: boolean;
}

// -----------------------------------------------------------------------------
// Payment Events
// -----------------------------------------------------------------------------

/**
 * Event: Payment Initiated
 * @emits payment.initiated
 */
export interface IPaymentInitiatedEvent extends IDomainEventBase {
  payment: IPaymentReference;
  order: IOrderReference;
}

/**
 * Event: Payment Completed
 * @emits payment.completed
 */
export interface IPaymentCompletedEvent extends IDomainEventBase {
  payment: IPaymentReference;
  orderId: number;
  transactionReference: string;
}

/**
 * Event: Payment Failed
 * @emits payment.failed
 */
export interface IPaymentFailedEvent extends IDomainEventBase {
  payment: IPaymentReference;
  orderId: number;
  errorCode: string;
  errorMessage: string;
}

// -----------------------------------------------------------------------------
// Refund Events
// -----------------------------------------------------------------------------

/**
 * Event: Refund Requested
 * @emits refund.requested
 */
export interface IRefundRequestedEvent extends IDomainEventBase {
  refund: IRefundReference;
  order: IOrderReference;
  requestedBy: number;
  reason: string;
}

/**
 * Event: Refund Completed
 * @emits refund.completed
 */
export interface IRefundCompletedEvent extends IDomainEventBase {
  refund: IRefundReference;
  orderId: number;
  paymentId: number;
  refundedAmount: number;
  currency: CurrencyCode;
}

// -----------------------------------------------------------------------------
// Stock Events
// -----------------------------------------------------------------------------

/**
 * Event: Stock Reserved
 * @emits stock.reserved
 */
export interface IStockReservedEvent extends IDomainEventBase {
  stock: IStockReference;
  orderId: number;
  reservedQuantity: number;
  expiresAt: Date;
}

/**
 * Event: Stock Released
 * @emits stock.released
 */
export interface IStockReleasedEvent extends IDomainEventBase {
  stock: IStockReference;
  orderId?: number;
  releasedQuantity: number;
  reason: string;
}

/**
 * Event: Low Stock Alert
 * @emits stock.low.alert
 */
export interface ILowStockAlertEvent extends IDomainEventBase {
  productId: number;
  productName: string;
  warehouseId: number;
  currentQuantity: number;
  thresholdQuantity: number;
}

// -----------------------------------------------------------------------------
// Product Events
// -----------------------------------------------------------------------------

/**
 * Event: Product Price Changed
 * @emits product.price.changed
 */
export interface IProductPriceChangedEvent extends IDomainEventBase {
  productId: number;
  productName: string;
  previousPrice: number;
  newPrice: number;
  currency: CurrencyCode;
  changedBy: number;
}

// =============================================================================
// TYPE UNION FOR ALL EVENTS
// =============================================================================

/**
 * Union type of all domain events
 */
export type DomainEvent =
  | IOrderCreatedEvent
  | IOrderStatusChangedEvent
  | IOrderCancelledEvent
  | IPaymentInitiatedEvent
  | IPaymentCompletedEvent
  | IPaymentFailedEvent
  | IRefundRequestedEvent
  | IRefundCompletedEvent
  | IStockReservedEvent
  | IStockReleasedEvent
  | ILowStockAlertEvent
  | IProductPriceChangedEvent;

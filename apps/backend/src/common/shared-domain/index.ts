/**
 * @file index.ts
 * @description Barrel export for Shared Domain Module
 *
 * EXPORTS:
 * - Module: SharedDomainModule
 * - Interfaces: Transaction interfaces for cross-module communication
 * - Events: Domain event types and constants
 * - Services: TransactionEventService, DomainEventPublisher
 *
 * @example
 * // Import the module in your feature module:
 * import { SharedDomainModule } from '../common/shared-domain';
 *
 * // Import specific interfaces:
 * import {
 *   IOrderReference,
 *   IPaymentReference,
 *   TransactionStatus,
 * } from '../common/shared-domain';
 *
 * // Import event types:
 * import {
 *   ORDER_EVENTS,
 *   IOrderCreatedEvent,
 * } from '../common/shared-domain';
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

// Module
export { SharedDomainModule } from './shared-domain.module';

// Interfaces
export {
  // Status and Type Enums
  TransactionStatus,
  PaymentMethodType,
  CurrencyCode,

  // Reference Interfaces
  IOrderReference,
  IPaymentReference,
  IRefundReference,
  IUserReference,
  IProductReference,
  IStockReference,

  // Common Structures
  IAmountBreakdown,
  IAuditEntry,
} from './interfaces/transaction.interfaces';

// Events
export {
  // Event Name Constants
  ORDER_EVENTS,
  PAYMENT_EVENTS,
  REFUND_EVENTS,
  STOCK_EVENTS,
  PRODUCT_EVENTS,

  // Base Event Interface
  IDomainEventBase,

  // Order Event Interfaces
  IOrderCreatedEvent,
  IOrderStatusChangedEvent,
  IOrderCancelledEvent,

  // Payment Event Interfaces
  IPaymentInitiatedEvent,
  IPaymentCompletedEvent,
  IPaymentFailedEvent,

  // Refund Event Interfaces
  IRefundRequestedEvent,
  IRefundCompletedEvent,

  // Stock Event Interfaces
  IStockReservedEvent,
  IStockReleasedEvent,
  ILowStockAlertEvent,

  // Product Event Interfaces
  IProductPriceChangedEvent,

  // Union Type
  DomainEvent,
} from './events/domain.events';

// Services
export { TransactionEventService } from './services/transaction-event.service';
export {
  DomainEventPublisher,
  IGenericDomainEvent,
} from './services/domain-event-publisher.service';

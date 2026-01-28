/**
 * @file transaction.interfaces.ts
 * @description Shared transaction interfaces for Orders, Payment, and Refund modules
 *
 * PURPOSE:
 * These interfaces break the circular dependency between transaction-related modules
 * by providing a common contract that all modules can import without coupling.
 *
 * USAGE:
 * Instead of: import { Order } from '../orders/entities/order.entity';
 * Use: import { IOrderReference } from '../common/shared-domain/interfaces/transaction.interfaces';
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

/**
 * Base transaction status types shared across modules
 */
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

/**
 * Payment method types
 */
export enum PaymentMethodType {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_WALLET = 'mobile_wallet',
  CREDIT_CARD = 'credit_card',
  SYRIAN_MOBILE_PAYMENT = 'syrian_mobile_payment',
}

/**
 * Currency codes supported
 */
export enum CurrencyCode {
  SYP = 'SYP', // Syrian Pound
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
}

/**
 * Order reference interface - minimal data needed across modules
 * @description Use this instead of importing the full Order entity
 */
export interface IOrderReference {
  /** Order unique identifier */
  id: number;
  /** Order number for display */
  orderNumber: string;
  /** Customer user ID */
  userId: number;
  /** Vendor ID if applicable */
  vendorId?: number;
  /** Order status */
  status: string;
  /** Total amount */
  totalAmount: number;
  /** Currency code */
  currency: CurrencyCode;
}

/**
 * Payment reference interface - minimal payment data
 * @description Use this instead of importing PaymentTransaction entity
 */
export interface IPaymentReference {
  /** Payment transaction ID */
  id: number;
  /** Associated order ID */
  orderId: number;
  /** Payment amount */
  amount: number;
  /** Currency */
  currency: CurrencyCode;
  /** Payment method used */
  paymentMethod: PaymentMethodType;
  /** Transaction status */
  status: TransactionStatus;
  /** External transaction reference (bank/gateway) */
  externalReference?: string;
}

/**
 * Refund reference interface - minimal refund data
 * @description Use this instead of importing RefundTransaction entity
 */
export interface IRefundReference {
  /** Refund transaction ID */
  id: number;
  /** Associated order ID */
  orderId: number;
  /** Associated payment ID */
  paymentId?: number;
  /** Refund amount */
  amount: number;
  /** Currency */
  currency: CurrencyCode;
  /** Refund reason */
  reason: string;
  /** Refund status */
  status: TransactionStatus;
}

/**
 * User reference interface - minimal user data for transactions
 * @description Use this instead of importing User entity
 */
export interface IUserReference {
  /** User ID */
  id: number;
  /** User email */
  email: string;
  /** User full name */
  fullName?: string;
  /** Phone number */
  phone?: string;
}

/**
 * Product reference interface - minimal product data for orders
 * @description Use this instead of importing Product entity
 */
export interface IProductReference {
  /** Product ID */
  id: number;
  /** Product name */
  name: string;
  /** Product SKU */
  sku: string;
  /** Vendor ID */
  vendorId: number;
  /** Unit price */
  price: number;
  /** Currency */
  currency: CurrencyCode;
}

/**
 * Stock reference interface - minimal stock data
 * @description Use this instead of importing Stock entity
 */
export interface IStockReference {
  /** Stock record ID */
  id: number;
  /** Product ID */
  productId: number;
  /** Variant ID if applicable */
  variantId?: number;
  /** Warehouse ID */
  warehouseId: number;
  /** Available quantity */
  quantity: number;
  /** Reserved quantity */
  reservedQuantity: number;
}

/**
 * Transaction amount breakdown
 * @description Common structure for amount calculations
 */
export interface IAmountBreakdown {
  /** Subtotal before discounts */
  subtotal: number;
  /** Discount amount */
  discount: number;
  /** Tax amount */
  tax: number;
  /** Shipping cost */
  shipping: number;
  /** Final total */
  total: number;
  /** Currency */
  currency: CurrencyCode;
}

/**
 * Audit trail entry
 * @description Common structure for tracking changes
 */
export interface IAuditEntry {
  /** Timestamp of the action */
  timestamp: Date;
  /** User who performed the action */
  userId: number;
  /** Action type */
  action: string;
  /** Previous value */
  previousValue?: string;
  /** New value */
  newValue?: string;
  /** IP address */
  ipAddress?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

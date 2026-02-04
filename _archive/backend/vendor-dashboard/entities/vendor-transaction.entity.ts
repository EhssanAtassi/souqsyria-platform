/**
 * @file vendor-transaction.entity.ts
 * @description Entity for storing individual vendor transaction records
 *
 * Purpose: Track every financial transaction (sales, refunds, adjustments) for transparency
 * Used for: Transaction history, financial reconciliation, audit trails
 *
 * @swagger VendorTransaction
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { VendorFinancial } from './vendor-financial.entity';
import { Order } from '../../orders/entities/order.entity';

/**
 * Transaction type enum
 * Defines the nature of the financial transaction
 */
export enum VendorTransactionType {
  SALE = 'sale', // Regular product sale
  REFUND = 'refund', // Customer refund
  ADJUSTMENT = 'adjustment', // Manual adjustment (admin)
  COMMISSION = 'commission', // Commission charge
  PAYOUT = 'payout', // Payout to vendor
}

/**
 * Transaction status enum
 */
export enum VendorTransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

/**
 * VendorTransaction Entity
 *
 * Records every financial transaction related to a vendor
 * Provides complete audit trail and transparency
 *
 * Key Features:
 * - Immutable transaction records (no updates after completion)
 * - Links to orders for traceability
 * - Dual currency support
 * - Comprehensive status tracking
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_transactions')
@Index(['vendorId', 'processedAt']) // Fast lookup by vendor and date
@Index(['transactionId'], { unique: true }) // Unique transaction identifier
@Index(['orderId']) // Fast lookup by order
export class VendorTransaction {
  /**
   * Primary key - auto-generated UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique transaction identifier
   * Format: TXN-YYYY-NNNNNN
   */
  @Column({ name: 'transaction_id', type: 'varchar', length: 50, unique: true })
  transactionId: string;

  /**
   * Foreign key relationship to Vendor entity
   * ON DELETE CASCADE ensures cleanup when vendor is deleted
   */
  @ManyToOne(() => VendorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  /**
   * Vendor ID for indexed queries
   */
  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  /**
   * Foreign key relationship to VendorFinancial entity
   * Groups transactions into financial periods
   */
  @ManyToOne(() => VendorFinancial, (financial) => financial.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'financial_id' })
  financial: VendorFinancial;

  /**
   * Foreign key relationship to Order entity (if applicable)
   * Null for non-order transactions (adjustments, payouts)
   */
  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  /**
   * Order ID for indexed queries
   */
  @Column({ name: 'order_id', type: 'int', nullable: true })
  orderId: number;

  /**
   * Transaction type (sale, refund, adjustment, commission, payout)
   */
  @Column({
    name: 'type',
    type: 'enum',
    enum: VendorTransactionType,
  })
  type: VendorTransactionType;

  /**
   * Transaction amount in Syrian Pounds
   * Positive for income (sales), negative for expenses (refunds, commissions)
   */
  @Column({
    name: 'amount_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amountSyp: number;

  /**
   * Transaction amount in USD
   */
  @Column({
    name: 'amount_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amountUsd: number;

  /**
   * Commission amount in SYP (if applicable)
   * Only populated for sale transactions
   */
  @Column({
    name: 'commission_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  commissionSyp: number;

  /**
   * Commission amount in USD (if applicable)
   */
  @Column({
    name: 'commission_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  commissionUsd: number;

  /**
   * Net amount after commission in SYP
   */
  @Column({
    name: 'net_amount_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  netAmountSyp: number;

  /**
   * Net amount after commission in USD
   */
  @Column({
    name: 'net_amount_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  netAmountUsd: number;

  /**
   * Transaction status
   */
  @Column({
    name: 'status',
    type: 'enum',
    enum: VendorTransactionStatus,
    default: VendorTransactionStatus.PENDING,
  })
  status: VendorTransactionStatus;

  /**
   * Payment method used for this transaction
   * Examples: "Cash on Delivery", "Bank Transfer", "Mobile Wallet"
   */
  @Column({ name: 'payment_method', type: 'varchar', length: 50, nullable: true })
  paymentMethod: string;

  /**
   * Description or notes about this transaction
   */
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  /**
   * External payment reference (bank transaction ID, mobile wallet reference)
   */
  @Column({ name: 'external_reference', type: 'varchar', length: 255, nullable: true })
  externalReference: string;

  /**
   * Timestamp when this transaction was processed
   * Different from created_at (can be backdated for historical data)
   */
  @Column({ name: 'processed_at', type: 'timestamp' })
  processedAt: Date;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   * Note: Completed transactions should be immutable
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

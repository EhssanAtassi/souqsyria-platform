/**
 * @file commission-payout.entity.ts
 * @description Entity for tracking commission payouts to vendors
 *
 * ENTERPRISE FEATURES:
 * - Automated payout scheduling (daily, weekly, monthly)
 * - Payout status tracking with audit trail
 * - Support for multiple payment methods
 * - Commission aggregation and batch processing
 * - Compliance and tax calculation integration
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Enum for payout status tracking
 */
export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

/**
 * Enum for payout frequency scheduling
 */
export enum PayoutFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  MANUAL = 'manual',
}

/**
 * Enum for payout methods
 */
export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  CRYPTOCURRENCY = 'cryptocurrency',
  CHECK = 'check',
  CASH = 'cash',
}

@Entity('commission_payouts')
@Index(['vendor', 'status'])
@Index(['scheduledDate', 'status'])
@Index(['createdAt'])
export class CommissionPayoutEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Vendor receiving the payout
   */
  @ManyToOne(() => VendorEntity, { nullable: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  /**
   * Payout period start date
   */
  @Column({ name: 'period_start', type: 'datetime' })
  @Index()
  periodStart: Date;

  /**
   * Payout period end date
   */
  @Column({ name: 'period_end', type: 'datetime' })
  @Index()
  periodEnd: Date;

  /**
   * Total commission amount before deductions
   */
  @Column({
    name: 'gross_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  grossAmount: number;

  /**
   * Platform fees and deductions
   */
  @Column({
    name: 'deductions_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  deductionsAmount: number;

  /**
   * Tax amount (if applicable)
   */
  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  taxAmount: number;

  /**
   * Final payout amount (gross - deductions - tax)
   */
  @Column({
    name: 'net_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  netAmount: number;

  /**
   * Currency code (ISO format)
   */
  @Column({ length: 3, default: 'SYP' })
  currency: string;

  /**
   * Number of orders included in this payout
   */
  @Column({ name: 'order_count', type: 'int', default: 0 })
  orderCount: number;

  /**
   * Number of commission transactions included
   */
  @Column({ name: 'transaction_count', type: 'int', default: 0 })
  transactionCount: number;

  /**
   * Current payout status
   */
  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  @Index()
  status: PayoutStatus;

  /**
   * Payout method to be used
   */
  @Column({
    name: 'payout_method',
    type: 'enum',
    enum: PayoutMethod,
    default: PayoutMethod.BANK_TRANSFER,
  })
  payoutMethod: PayoutMethod;

  /**
   * Payout frequency for automated scheduling
   */
  @Column({
    name: 'payout_frequency',
    type: 'enum',
    enum: PayoutFrequency,
    default: PayoutFrequency.MONTHLY,
  })
  payoutFrequency: PayoutFrequency;

  /**
   * Scheduled payout date
   */
  @Column({ name: 'scheduled_date', type: 'datetime' })
  @Index()
  scheduledDate: Date;

  /**
   * Actual payout processing date
   */
  @Column({ name: 'processed_date', type: 'datetime', nullable: true })
  processedDate: Date;

  /**
   * Reference number from payment gateway
   */
  @Column({ name: 'reference_number', length: 255, nullable: true })
  referenceNumber: string;

  /**
   * Payment gateway transaction ID
   */
  @Column({ name: 'gateway_transaction_id', length: 255, nullable: true })
  gatewayTransactionId: string;

  /**
   * Additional payment details (JSON)
   */
  @Column({ name: 'payment_details', type: 'json', nullable: true })
  paymentDetails: Record<string, any>;

  /**
   * Failure reason (if status is FAILED)
   */
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  /**
   * Admin notes for manual interventions
   */
  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  /**
   * Admin who processed/approved the payout
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processed_by' })
  processedBy: User;

  /**
   * Retry count for failed payouts
   */
  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  /**
   * Maximum retry attempts allowed
   */
  @Column({ name: 'max_retries', type: 'int', default: 3 })
  maxRetries: number;

  /**
   * Next retry attempt date (if applicable)
   */
  @Column({ name: 'next_retry_date', type: 'datetime', nullable: true })
  nextRetryDate: Date;

  /**
   * Compliance check status
   */
  @Column({ name: 'compliance_check', type: 'boolean', default: false })
  complianceCheck: boolean;

  /**
   * Tax reporting status
   */
  @Column({ name: 'tax_reported', type: 'boolean', default: false })
  taxReported: boolean;

  /**
   * Audit trail reference
   */
  @Column({ name: 'audit_trail', type: 'json', nullable: true })
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    user: string;
    details?: any;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

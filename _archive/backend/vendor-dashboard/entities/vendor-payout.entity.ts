/**
 * @file vendor-payout.entity.ts
 * @description Entity for tracking vendor payout schedules and payment history
 *
 * Purpose: Manage vendor payment processing and payout tracking
 * Used for: Payment scheduling, payout history, financial reconciliation
 *
 * @swagger VendorPayout
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

/**
 * Payout status enum
 */
export enum PayoutStatus {
  SCHEDULED = 'scheduled', // Payout scheduled but not yet initiated
  PENDING = 'pending', // Payout initiated, awaiting processing
  PROCESSING = 'processing', // Payment in progress
  COMPLETED = 'completed', // Payment successfully completed
  FAILED = 'failed', // Payment failed
  CANCELLED = 'cancelled', // Payout cancelled
}

/**
 * Payout method enum (Syrian marketplace payment methods)
 */
export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer', // Bank transfer (most common)
  CASH = 'cash', // Cash payment (for local vendors)
  SYRIATEL_CASH = 'syriatel_cash', // Syriatel mobile wallet
  MTN_CASH = 'mtn_cash', // MTN mobile wallet
  WESTERN_UNION = 'western_union', // International transfers
  OTHER = 'other', // Other payment methods
}

/**
 * VendorPayout Entity
 *
 * Tracks scheduled and completed payouts to vendors
 * Manages multiple payment methods common in Syrian marketplace
 *
 * Key Features:
 * - Multiple payment method support (bank, cash, mobile wallets)
 * - Dual currency tracking (SYP/USD)
 * - Status tracking for payment lifecycle
 * - Bank account masking for security
 * - Failure reason tracking for troubleshooting
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_payouts')
@Index(['vendorId', 'status', 'payoutDate']) // Fast lookup for scheduled payouts
@Index(['vendorId', 'payoutDate']) // Fast lookup by vendor and date
export class VendorPayout {
  /**
   * Primary key - auto-generated UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
   * Scheduled or actual payout date
   */
  @Column({ name: 'payout_date', type: 'date' })
  payoutDate: Date;

  /**
   * Payout amount in Syrian Pounds
   */
  @Column({
    name: 'amount_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  amountSyp: number;

  /**
   * Payout amount in USD
   */
  @Column({
    name: 'amount_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  amountUsd: number;

  /**
   * Payout status
   */
  @Column({
    name: 'status',
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.SCHEDULED,
  })
  status: PayoutStatus;

  /**
   * Payment method used for this payout
   */
  @Column({
    name: 'method',
    type: 'enum',
    enum: PayoutMethod,
    default: PayoutMethod.BANK_TRANSFER,
  })
  method: PayoutMethod;

  /**
   * Bank account number (last 4 digits) for security
   * Format: "****1234"
   */
  @Column({ name: 'bank_account_last4', type: 'varchar', length: 10, nullable: true })
  bankAccountLast4: string;

  /**
   * Bank name (for bank transfers)
   */
  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName: string;

  /**
   * Mobile wallet number (masked) for security
   * Format: "+963XX****5678"
   */
  @Column({ name: 'mobile_wallet_number', type: 'varchar', length: 20, nullable: true })
  mobileWalletNumber: string;

  /**
   * Transaction reference ID from payment processor
   * Used for reconciliation and tracking
   */
  @Column({ name: 'transaction_id', type: 'varchar', length: 255, nullable: true })
  transactionId: string;

  /**
   * External reference (bank confirmation, mobile wallet receipt)
   */
  @Column({ name: 'external_reference', type: 'varchar', length: 255, nullable: true })
  externalReference: string;

  /**
   * Processing fee charged by payment processor (SYP)
   */
  @Column({
    name: 'processing_fee_syp',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  processingFeeSyp: number;

  /**
   * Processing fee charged by payment processor (USD)
   */
  @Column({
    name: 'processing_fee_usd',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  processingFeeUsd: number;

  /**
   * Net amount received by vendor after fees (SYP)
   */
  @Column({
    name: 'net_amount_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  netAmountSyp: number;

  /**
   * Net amount received by vendor after fees (USD)
   */
  @Column({
    name: 'net_amount_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  netAmountUsd: number;

  /**
   * Notes about this payout (internal use)
   */
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  /**
   * Failure reason (if payout failed)
   */
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  /**
   * Number of retry attempts (if payout failed)
   */
  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  /**
   * Timestamp when payout was initiated
   */
  @Column({ name: 'initiated_at', type: 'timestamp', nullable: true })
  initiatedAt: Date;

  /**
   * Timestamp when payout was completed
   */
  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

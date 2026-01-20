/**
 * @file vendor-financial.entity.ts
 * @description Entity for storing vendor financial summaries and reports
 *
 * Purpose: Pre-calculated financial reports for different time periods
 * Used for: Revenue tracking, commission calculations, financial performance analysis
 *
 * @swagger VendorFinancial
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { VendorTransaction } from './vendor-transaction.entity';

/**
 * Financial period type enum
 */
export enum FinancialPeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * VendorFinancial Entity
 *
 * Stores aggregated financial data for reporting periods
 * Maintains relationship with individual transactions for drill-down capability
 *
 * Key Features:
 * - Dual currency support (SYP/USD)
 * - Commission tracking and calculation
 * - Multiple period types for flexible reporting
 * - Links to individual transactions for transparency
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_financial')
@Index(['vendorId', 'periodType', 'periodStart']) // Fast lookup by vendor and period
export class VendorFinancial {
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
   * Period type (daily, weekly, monthly, quarterly, yearly)
   */
  @Column({
    name: 'period_type',
    type: 'enum',
    enum: FinancialPeriodType,
  })
  periodType: FinancialPeriodType;

  /**
   * Start date of the financial period
   */
  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  /**
   * End date of the financial period
   */
  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  /**
   * Gross revenue (before commission) in Syrian Pounds
   * DECIMAL(15,2) supports large SYP amounts
   */
  @Column({
    name: 'gross_revenue_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  grossRevenueSyp: number;

  /**
   * Gross revenue (before commission) in USD
   */
  @Column({
    name: 'gross_revenue_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  grossRevenueUsd: number;

  /**
   * Platform commission paid in Syrian Pounds
   * Calculated based on vendor tier commission rate
   */
  @Column({
    name: 'commission_paid_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  commissionPaidSyp: number;

  /**
   * Platform commission paid in USD
   */
  @Column({
    name: 'commission_paid_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  commissionPaidUsd: number;

  /**
   * Net revenue (after commission) in Syrian Pounds
   * This is the amount the vendor actually receives
   */
  @Column({
    name: 'net_revenue_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  netRevenueSyp: number;

  /**
   * Net revenue (after commission) in USD
   */
  @Column({
    name: 'net_revenue_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  netRevenueUsd: number;

  /**
   * Average commission rate for this period (percentage)
   * May vary if vendor changes tiers during period
   */
  @Column({
    name: 'average_commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10.0,
  })
  averageCommissionRate: number;

  /**
   * Total number of transactions in this period
   */
  @Column({ name: 'total_transactions', type: 'int', default: 0 })
  totalTransactions: number;

  /**
   * Syrian VAT collected in this period (10% tax)
   */
  @Column({
    name: 'vat_collected_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  vatCollectedSyp: number;

  /**
   * VAT collected in USD
   */
  @Column({
    name: 'vat_collected_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  vatCollectedUsd: number;

  /**
   * Pending balance not yet paid out (SYP)
   */
  @Column({
    name: 'pending_balance_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  pendingBalanceSyp: number;

  /**
   * Pending balance not yet paid out (USD)
   */
  @Column({
    name: 'pending_balance_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  pendingBalanceUsd: number;

  /**
   * Available balance ready for payout (SYP)
   */
  @Column({
    name: 'available_balance_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  availableBalanceSyp: number;

  /**
   * Available balance ready for payout (USD)
   */
  @Column({
    name: 'available_balance_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  availableBalanceUsd: number;

  /**
   * Individual transactions that make up this financial summary
   * One-to-many relationship for drill-down reporting
   */
  @OneToMany(() => VendorTransaction, (transaction) => transaction.financial)
  transactions: VendorTransaction[];

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   * Updated when new transactions are added during the period
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

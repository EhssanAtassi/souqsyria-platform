/**
 * @file vendor-analytics.entity.ts
 * @description Entity for storing pre-computed vendor analytics and business intelligence
 *
 * Purpose: Complex analytics snapshots to avoid expensive real-time calculations
 * Used for: Top products, customer demographics, traffic sources, sales funnel analysis
 *
 * @swagger VendorAnalytics
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
 * Analytics period type enum
 * Defines the time period for which analytics are calculated
 */
export enum AnalyticsPeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * VendorAnalytics Entity
 *
 * Stores pre-computed business intelligence data to avoid expensive real-time queries
 * JSON columns store complex nested data structures for flexibility
 *
 * Key Features:
 * - Pre-calculated analytics reduce API response time
 * - JSON storage for flexible data structures
 * - Period-based snapshots for historical comparison
 * - Regenerated periodically (daily/weekly) by background jobs
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_analytics')
@Index(['vendorId', 'period', 'periodStart']) // Fast lookup by vendor and period
export class VendorAnalytics {
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
    name: 'period',
    type: 'enum',
    enum: AnalyticsPeriodType,
    default: AnalyticsPeriodType.MONTHLY,
  })
  period: AnalyticsPeriodType;

  /**
   * Start date of the analytics period
   */
  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  /**
   * End date of the analytics period
   */
  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  /**
   * Top-selling products analysis
   *
   * JSON Structure:
   * [
   *   {
   *     productId: number,
   *     productNameEn: string,
   *     productNameAr: string,
   *     totalSalesSyp: number,
   *     totalSalesUsd: number,
   *     unitsSold: number,
   *     revenueShare: number (percentage)
   *   }
   * ]
   */
  @Column({ name: 'top_products', type: 'json', nullable: true })
  topProducts: any;

  /**
   * Customer demographics analysis
   *
   * JSON Structure:
   * {
   *   byGovernorate: {
   *     "Damascus": { count: number, revenueSyp: number },
   *     "Aleppo": { count: number, revenueSyp: number },
   *     ...
   *   },
   *   byAgeGroup: {
   *     "18-24": number,
   *     "25-34": number,
   *     ...
   *   },
   *   byGender: {
   *     "male": number,
   *     "female": number,
   *     "other": number
   *   },
   *   newVsReturning: {
   *     "new": number,
   *     "returning": number
   *   }
   * }
   */
  @Column({ name: 'customer_demographics', type: 'json', nullable: true })
  customerDemographics: any;

  /**
   * Traffic sources analysis
   *
   * JSON Structure:
   * {
   *   direct: { visits: number, conversions: number, conversionRate: number },
   *   organic: { visits: number, conversions: number, conversionRate: number },
   *   social: {
   *     facebook: { visits: number, conversions: number },
   *     instagram: { visits: number, conversions: number },
   *     ...
   *   },
   *   referral: { visits: number, conversions: number },
   *   paid: { visits: number, conversions: number }
   * }
   */
  @Column({ name: 'traffic_sources', type: 'json', nullable: true })
  trafficSources: any;

  /**
   * Sales funnel analysis
   *
   * JSON Structure:
   * {
   *   productViews: number,
   *   addToCart: number,
   *   checkout: number,
   *   purchased: number,
   *   conversionRates: {
   *     viewToCart: number (percentage),
   *     cartToCheckout: number (percentage),
   *     checkoutToPurchase: number (percentage),
   *     overall: number (percentage)
   *   },
   *   averageCartValue: { syp: number, usd: number },
   *   cartAbandonmentRate: number (percentage)
   * }
   */
  @Column({ name: 'sales_funnel', type: 'json', nullable: true })
  salesFunnel: any;

  /**
   * Product category performance
   *
   * JSON Structure:
   * [
   *   {
   *     categoryNameEn: string,
   *     categoryNameAr: string,
   *     revenueSyp: number,
   *     revenueUsd: number,
   *     unitsSold: number,
   *     averagePrice: number,
   *     revenueGrowth: number (percentage)
   *   }
   * ]
   */
  @Column({ name: 'category_performance', type: 'json', nullable: true })
  categoryPerformance: any;

  /**
   * Peak sales hours analysis
   *
   * JSON Structure:
   * {
   *   hourly: {
   *     "0": number, "1": number, ..., "23": number
   *   },
   *   daily: {
   *     "monday": number,
   *     "tuesday": number,
   *     ...
   *   },
   *   peakHour: number,
   *   peakDay: string
   * }
   */
  @Column({ name: 'peak_sales_hours', type: 'json', nullable: true })
  peakSalesHours: any;

  /**
   * Timestamp when this analytics snapshot was calculated
   * Used to determine if refresh is needed
   */
  @Column({ name: 'calculated_at', type: 'timestamp' })
  calculatedAt: Date;

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

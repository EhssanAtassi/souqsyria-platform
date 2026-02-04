/**
 * @file vendor-metrics.entity.ts
 * @description Entity for storing time-series vendor performance metrics
 *
 * Purpose: Historical metrics for dashboard charts and trends tracking
 * Used for: Daily/weekly/monthly aggregations, performance analysis, trend visualization
 *
 * @swagger VendorMetrics
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
 * VendorMetrics Entity
 *
 * Stores daily/periodic snapshots of vendor performance metrics
 * Indexed for fast time-range queries (last 30 days, last 90 days, etc.)
 *
 * Key Features:
 * - Time-series data optimized for chart rendering
 * - Dual currency support (SYP/USD)
 * - Daily granularity for accurate trend analysis
 * - Pre-calculated metrics to avoid expensive JOIN queries
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_metrics')
@Index(['vendorId', 'recordDate'], { unique: true }) // Prevent duplicate daily records
@Index(['vendorId', 'recordDate']) // Fast range queries
export class VendorMetrics {
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
   * Duplicated for query optimization (avoids JOIN in many cases)
   */
  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  /**
   * Date of this metric snapshot (daily granularity)
   * Indexed for time-range queries
   */
  @Column({ name: 'record_date', type: 'date' })
  recordDate: Date;

  /**
   * Total revenue for this period in Syrian Pounds
   * DECIMAL(15,2) supports up to 999,999,999,999.99 SYP
   */
  @Column({
    name: 'total_revenue_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalRevenueSyp: number;

  /**
   * Total revenue for this period in USD
   * DECIMAL(12,2) supports up to 9,999,999,999.99 USD
   */
  @Column({
    name: 'total_revenue_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalRevenueUsd: number;

  /**
   * Total number of orders received on this date
   */
  @Column({ name: 'total_orders', type: 'int', default: 0 })
  totalOrders: number;

  /**
   * Order fulfillment rate percentage (0-100)
   * Calculated as: (fulfilled_orders / total_orders) * 100
   */
  @Column({
    name: 'fulfillment_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  fulfillmentRate: number;

  /**
   * Customer satisfaction rating (0-5 stars)
   * Average of all reviews received on this date
   */
  @Column({
    name: 'customer_satisfaction_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  customerSatisfactionRating: number;

  /**
   * Number of active (published) products on this date
   */
  @Column({ name: 'active_products', type: 'int', default: 0 })
  activeProducts: number;

  /**
   * Number of products with low stock on this date
   * Threshold defined in business logic (e.g., < 10 units)
   */
  @Column({ name: 'low_stock_products', type: 'int', default: 0 })
  lowStockProducts: number;

  /**
   * Average delivery time in hours for orders completed on this date
   */
  @Column({
    name: 'average_delivery_time_hours',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  averageDeliveryTimeHours: number;

  /**
   * Total number of customer reviews received on this date
   */
  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  totalReviews: number;

  /**
   * Average response time to customer inquiries in hours
   */
  @Column({
    name: 'average_response_time_hours',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  averageResponseTimeHours: number;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   * Used for incremental metric updates during the day
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

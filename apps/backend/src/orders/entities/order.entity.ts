/**
 * 📦 Order Entity
 *
 * Represents a full order created from one or more cart items.
 * Supports multivendor splits, soft deletes, and status tracking.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { PaymentTransaction } from '../../payment/entities/payment-transaction.entity';

/**
 * PERF-C01: Database indexes for optimized queries
 * - user: JOINs with user table (customer orders lookup)
 * - status + created_at: Admin dashboard queries for order status filtering
 * - payment_status: Payment reconciliation queries
 * - status: General status filtering
 */
@Entity('orders')
@Index(['user'])
@Index(['status', 'created_at'])
@Index(['payment_status'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  payment_method: string;

  @Column({ type: 'varchar', length: 20 })
  payment_status: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'text', nullable: true })
  buyer_note?: string;

  @Column({ type: 'text', nullable: true })
  gift_message?: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order)
  status_logs: OrderStatusLog[];

  @OneToMany(() => PaymentTransaction, (payment) => payment.order)
  paymentTransactions: PaymentTransaction[];

  // --- Shipping Address Snapshot Fields ---
  /**
   * Snapshot of shipping address used for this order.
   * These fields are copied from the user's Address at checkout time.
   */
  @Column() shippingName: string;

  @Column() shippingPhone: string;

  @Column() shippingAddressLine1: string;

  @Column({ nullable: true }) shippingAddressLine2: string;

  @Column() shippingCity: string;

  @Column() shippingRegion: string;

  @Column() shippingCountry: string;

  @Column() shippingPostalCode: string;

  // --- Billing Address Snapshot Fields ---
  /**
   * Snapshot of billing address used for this order.
   * (Optional: set nullable, some checkouts use only shipping)
   */
  @Column({ nullable: true }) billingName: string;

  @Column({ nullable: true }) billingPhone: string;

  @Column({ nullable: true }) billingAddressLine1: string;

  @Column({ nullable: true }) billingAddressLine2: string;

  @Column({ nullable: true }) billingCity: string;

  @Column({ nullable: true }) billingRegion: string;

  @Column({ nullable: true }) billingCountry: string;

  @Column({ nullable: true }) billingPostalCode: string;

  // --- Session Tracking Fields for Business Intelligence ---
  /**
   * Session ID - Links order to user session for conversion funnel analysis
   * Enables attribution of order to marketing source and user journey
   */
  @Column({ name: 'session_id', nullable: true })
  sessionId?: number;

  /**
   * Session Token - Session identifier for cross-system tracking
   * Used for analytics and marketing attribution
   */
  @Column({ name: 'session_token', type: 'varchar', length: 64, nullable: true })
  @Index()
  sessionToken?: string;

  /**
   * First Session ID - User's first-ever session ID
   * Critical for first-touch attribution and customer acquisition cost (CAC)
   */
  @Column({ name: 'first_session_id', nullable: true })
  firstSessionId?: number;

  /**
   * Entry Page - Landing page of the session that led to this order
   * Identifies which pages drive conversions
   */
  @Column({ name: 'entry_page', type: 'varchar', length: 255, nullable: true })
  entryPage?: string;

  /**
   * Referrer Source - Marketing channel that brought user
   * Examples: "google", "facebook", "email_campaign_2024_01", "direct"
   */
  @Column({ name: 'referrer_source', type: 'varchar', length: 255, nullable: true })
  referrerSource?: string;

  /**
   * UTM Parameters - Marketing campaign tracking
   * JSON object containing: utm_source, utm_medium, utm_campaign, utm_term, utm_content
   */
  @Column({ name: 'utm_params', type: 'json', nullable: true })
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };

  /**
   * Time to Purchase (seconds) - Time from first session to order completion
   * Measures customer journey duration
   */
  @Column({ name: 'time_to_purchase_seconds', type: 'int', nullable: true })
  timeToPurchaseSeconds?: number;

  /**
   * Sessions Before Purchase - Number of sessions before conversion
   * Indicates whether customer is impulsive or considered buyer
   */
  @Column({ name: 'sessions_before_purchase', type: 'int', nullable: true })
  sessionsBeforePurchase?: number;

  /**
   * Cart Abandoned - Whether this order recovered an abandoned cart
   * Measures effectiveness of cart recovery campaigns
   */
  @Column({ name: 'cart_abandoned', type: 'boolean', default: false })
  cartAbandoned: boolean;

  /**
   * Cart Abandoned At - When cart was abandoned (if applicable)
   * Used to calculate time to recovery
   */
  @Column({ name: 'cart_abandoned_at', type: 'timestamp', nullable: true })
  cartAbandonedAt?: Date;

  /**
   * Device Type - Device used for purchase
   * Analyzes conversion rates by device
   */
  @Column({ name: 'device_type', type: 'varchar', length: 20, nullable: true })
  deviceType?: 'mobile' | 'tablet' | 'desktop';

  /**
   * Order Attribution - Complete attribution data
   * Comprehensive marketing attribution for ROI calculation
   */
  @Column({ name: 'order_attribution', type: 'json', nullable: true })
  orderAttribution?: {
    firstTouchChannel?: string; // First marketing touchpoint
    lastTouchChannel?: string; // Last marketing touchpoint before conversion
    assistingChannels?: string[]; // All channels in between
    totalTouchpoints?: number; // Total marketing interactions
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}

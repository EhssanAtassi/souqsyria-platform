/**
 * @file user-session.entity.ts
 * @description User Session Entity for Business Intelligence Tracking
 *
 * FEATURES:
 * - Session lifecycle tracking for authenticated and guest users
 * - Cart abandonment detection with session state management
 * - Device and location tracking for user behavior analysis
 * - Conversion funnel tracking integration
 * - Customer lifetime value (CLV) calculation support
 *
 * BUSINESS INTELLIGENCE:
 * - Session duration tracking for engagement metrics
 * - Entry and exit page tracking for funnel analysis
 * - Referrer tracking for marketing attribution
 * - Cart abandonment timing and recovery opportunities
 * - Multi-session user journey reconstruction
 *
 * PERFORMANCE:
 * - Indexed on user_id, session_token, status, created_at for fast queries
 * - Partitioned by date for time-series analytics
 * - Optimized for high-volume read operations
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
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
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserEvent } from './user-event.entity';

/**
 * Session Status Enum
 * Tracks the current state of a user session for analytics
 */
export enum SessionStatus {
  /** Session is currently active */
  ACTIVE = 'active',
  /** Session ended normally (user logout or timeout) */
  ENDED = 'ended',
  /** Session was abandoned (no activity for configured duration) */
  ABANDONED = 'abandoned',
  /** Session resulted in conversion (completed purchase) */
  CONVERTED = 'converted',
}

/**
 * UserSession Entity
 *
 * Represents a complete user browsing session from entry to exit.
 * Critical for conversion funnel analysis and cart abandonment tracking.
 *
 * SESSION LIFECYCLE:
 * 1. ACTIVE - User is browsing, adding to cart, viewing products
 * 2. ABANDONED - No activity for 30+ minutes with items in cart
 * 3. CONVERTED - User completed checkout and created order
 * 4. ENDED - User logged out or session expired normally
 *
 * ANALYTICS USE CASES:
 * - Calculate average session duration by user segment
 * - Identify high-value sessions (multiple products viewed, high cart value)
 * - Track conversion rate by traffic source and landing page
 * - Measure time to conversion from first session
 * - Identify cart abandonment patterns by time of day, device, location
 */
@Entity('user_sessions')
@Index(['userId', 'createdAt']) // User session history queries
@Index(['sessionToken']) // Fast session lookup
@Index(['status', 'createdAt']) // Status-based analytics queries
@Index(['createdAt']) // Time-series partitioning
@Index(['guestSessionId']) // Guest session conversion tracking
export class UserSession {
  /**
   * Primary key - Auto-incrementing session ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User Reference - Foreign key to authenticated user
   * Nullable for guest sessions (linked via guestSessionId)
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: number;

  /**
   * Guest Session Reference - Links to GuestSession for anonymous users
   * Enables conversion tracking when guest becomes authenticated user
   */
  @Column({ name: 'guest_session_id', nullable: true })
  guestSessionId?: string;

  /**
   * Session Token - Unique identifier for this session
   * Used to correlate events and track user journey
   */
  @Column({
    name: 'session_token',
    type: 'varchar',
    length: 64,
    unique: true,
  })
  sessionToken: string;

  /**
   * Session Status - Current state for analytics segmentation
   * Critical for conversion funnel and abandonment analysis
   */
  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  /**
   * Entry Point - First page visited in session
   * Used for landing page optimization and referrer attribution
   *
   * Examples: "/", "/products/123", "/categories/electronics"
   */
  @Column({ name: 'entry_page', type: 'varchar', length: 255, nullable: true })
  entryPage?: string;

  /**
   * Exit Point - Last page visited before session ended
   * Identifies drop-off points in conversion funnel
   */
  @Column({ name: 'exit_page', type: 'varchar', length: 255, nullable: true })
  exitPage?: string;

  /**
   * Referrer Source - Where user came from (marketing attribution)
   *
   * Examples:
   * - "google.com" - Organic search
   * - "facebook.com" - Social media
   * - "newsletter_2024_01" - Email campaign
   * - "direct" - Direct navigation
   */
  @Column({ name: 'referrer_source', type: 'varchar', length: 255, nullable: true })
  referrerSource?: string;

  /**
   * Referrer URL - Full URL of referring page
   * Provides detailed attribution for marketing campaigns
   */
  @Column({ name: 'referrer_url', type: 'text', nullable: true })
  referrerUrl?: string;

  /**
   * UTM Campaign Parameters - Marketing campaign tracking
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
   * IP Address - User's IP for geographic and fraud analysis
   * Supports both IPv4 and IPv6 formats
   */
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  /**
   * User Agent - Browser and device information
   * Parsed for device type, OS, browser analytics
   */
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  /**
   * Device Information - Structured device data for analytics
   * Includes: device type, OS, browser, screen resolution
   */
  @Column({ name: 'device_info', type: 'json', nullable: true })
  deviceInfo?: {
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    osVersion?: string;
    browser?: string;
    browserVersion?: string;
    screenResolution?: string;
    language?: string;
    timezone?: string;
  };

  /**
   * Geographic Location - Derived from IP address
   * Used for regional analytics and personalization
   */
  @Column({ name: 'location', type: 'json', nullable: true })
  location?: {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };

  /**
   * Session Started At - Timestamp of first event in session
   */
  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  /**
   * Session Ended At - Timestamp of last event or explicit logout
   * Null while session is active
   */
  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt?: Date;

  /**
   * Last Activity At - Timestamp of most recent user interaction
   * Used for session timeout and abandonment detection
   */
  @Column({ name: 'last_activity_at', type: 'timestamp' })
  lastActivityAt: Date;

  /**
   * Session Duration (seconds) - Calculated when session ends
   * Pre-computed for faster analytics queries
   */
  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds: number;

  /**
   * Events Count - Total number of tracked events in session
   * Indicates engagement level
   */
  @Column({ name: 'events_count', type: 'int', default: 0 })
  eventsCount: number;

  /**
   * Page Views - Number of unique pages viewed
   * Key engagement metric
   */
  @Column({ name: 'page_views', type: 'int', default: 0 })
  pageViews: number;

  /**
   * Products Viewed - Number of unique products viewed
   * Indicates purchase intent
   */
  @Column({ name: 'products_viewed', type: 'int', default: 0 })
  productsViewed: number;

  /**
   * Cart Additions - Number of items added to cart
   * Critical for conversion funnel analysis
   */
  @Column({ name: 'cart_additions', type: 'int', default: 0 })
  cartAdditions: number;

  /**
   * Cart Value - Total value of items in cart at session end
   * Used for abandonment value calculation
   */
  @Column({
    name: 'cart_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  cartValue: number;

  /**
   * Order ID - Reference to created order if session converted
   * Links session to revenue for attribution
   */
  @Column({ name: 'order_id', nullable: true })
  orderId?: number;

  /**
   * Order Value - Total order value if session converted
   * Pre-computed for revenue attribution queries
   */
  @Column({
    name: 'order_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  orderValue?: number;

  /**
   * Abandoned Cart Notified At - When cart abandonment email was sent
   * Used for cart recovery campaign tracking
   */
  @Column({ name: 'abandoned_cart_notified_at', type: 'timestamp', nullable: true })
  abandonedCartNotifiedAt?: Date;

  /**
   * Abandoned Cart Recovered - Whether user returned and completed purchase
   * Measures effectiveness of cart recovery campaigns
   */
  @Column({ name: 'abandoned_cart_recovered', type: 'boolean', default: false })
  abandonedCartRecovered: boolean;

  /**
   * Session Metadata - Additional custom attributes
   * Flexible storage for A/B tests, experiments, custom tracking
   */
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: Record<string, any>;

  /**
   * User Events - All events that occurred in this session
   * One-to-many relationship for detailed event analysis
   */
  @OneToMany(() => UserEvent, (event) => event.session, { cascade: true })
  events: UserEvent[];

  /**
   * Created At - Record creation timestamp
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Updated At - Record last update timestamp
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ==========================================
  // BUSINESS LOGIC METHODS
  // ==========================================

  /**
   * Check if session is currently active
   * Session is active if status is ACTIVE and last activity within timeout window
   *
   * @param timeoutMinutes - Minutes of inactivity before considering session inactive
   * @returns True if session is active
   */
  isActive(timeoutMinutes: number = 30): boolean {
    if (this.status !== SessionStatus.ACTIVE) {
      return false;
    }

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const inactiveTime = Date.now() - this.lastActivityAt.getTime();
    return inactiveTime < timeoutMs;
  }

  /**
   * Check if session qualifies as abandoned cart
   * Conditions: Has items in cart, inactive for threshold duration, not converted
   *
   * @param thresholdMinutes - Minutes of inactivity to consider abandoned
   * @returns True if session has abandoned cart
   */
  hasAbandonedCart(thresholdMinutes: number = 30): boolean {
    if (this.cartAdditions === 0 || this.cartValue === 0) {
      return false;
    }

    if (this.status === SessionStatus.CONVERTED) {
      return false;
    }

    const thresholdMs = thresholdMinutes * 60 * 1000;
    const inactiveTime = Date.now() - this.lastActivityAt.getTime();
    return inactiveTime >= thresholdMs;
  }

  /**
   * Calculate session duration in seconds
   * Updates the durationSeconds field
   */
  calculateDuration(): void {
    const endTime = this.endedAt || new Date();
    const durationMs = endTime.getTime() - this.startedAt.getTime();
    this.durationSeconds = Math.floor(durationMs / 1000);
  }

  /**
   * End session with specified status
   * Updates status, ended timestamp, exit page, and calculates duration
   *
   * @param status - Final session status
   * @param exitPage - Last page visited
   */
  endSession(status: SessionStatus, exitPage?: string): void {
    this.status = status;
    this.endedAt = new Date();
    if (exitPage) {
      this.exitPage = exitPage;
    }
    this.calculateDuration();
  }

  /**
   * Mark session as converted with order details
   * Updates status, order reference, and revenue attribution
   *
   * @param orderId - Created order ID
   * @param orderValue - Order total value
   * @param wasAbandoned - Whether cart was previously abandoned
   */
  markAsConverted(orderId: number, orderValue: number, wasAbandoned: boolean = false): void {
    this.status = SessionStatus.CONVERTED;
    this.orderId = orderId;
    this.orderValue = orderValue;
    this.endedAt = new Date();
    this.calculateDuration();

    if (wasAbandoned) {
      this.abandonedCartRecovered = true;
    }
  }

  /**
   * Update session activity timestamp and metrics
   * Called on every tracked event to maintain session state
   */
  updateActivity(): void {
    this.lastActivityAt = new Date();
    this.eventsCount += 1;
  }

  /**
   * Mark abandoned cart notification sent
   * Tracks when cart recovery email was sent
   */
  markAbandonedCartNotified(): void {
    this.abandonedCartNotifiedAt = new Date();
  }

  /**
   * Get session summary for analytics dashboard
   *
   * @returns Object with key session metrics
   */
  getSummary() {
    return {
      id: this.id,
      userId: this.userId,
      sessionToken: this.sessionToken,
      status: this.status,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationSeconds: this.durationSeconds,
      eventsCount: this.eventsCount,
      pageViews: this.pageViews,
      productsViewed: this.productsViewed,
      cartAdditions: this.cartAdditions,
      cartValue: this.cartValue,
      orderId: this.orderId,
      orderValue: this.orderValue,
      entryPage: this.entryPage,
      exitPage: this.exitPage,
      referrerSource: this.referrerSource,
      deviceType: this.deviceInfo?.deviceType,
      location: this.location,
    };
  }
}

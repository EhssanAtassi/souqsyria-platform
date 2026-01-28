/**
 * @file user-event.entity.ts
 * @description User Event Entity for Granular Behavior Tracking
 *
 * FEATURES:
 * - Granular event tracking for conversion funnel analysis
 * - Event sequence reconstruction for user journey mapping
 * - Product interaction tracking for recommendation engines
 * - Search and navigation behavior analysis
 * - A/B test and experiment event tracking
 *
 * BUSINESS INTELLIGENCE:
 * - Conversion funnel drop-off identification
 * - Time-to-action metrics (view to cart, cart to checkout)
 * - Product engagement scoring (views, clicks, cart adds)
 * - Search effectiveness and zero-result tracking
 * - User intent analysis from navigation patterns
 *
 * PERFORMANCE:
 * - High-volume insert optimization with batch processing
 * - Time-series partitioning for historical data management
 * - Indexed for fast session event queries
 * - Aggregated metrics cached in Redis for real-time analytics
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
  Index,
} from 'typeorm';
import { UserSession } from './user-session.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Event Type Enum
 * Categorizes user interactions for analytics segmentation
 */
export enum EventType {
  // === PAGE VIEW EVENTS ===
  /** User viewed a page */
  PAGE_VIEW = 'page_view',
  /** User landed on homepage */
  HOMEPAGE_VIEW = 'homepage_view',
  /** User viewed category page */
  CATEGORY_VIEW = 'category_view',
  /** User viewed search results */
  SEARCH_RESULTS_VIEW = 'search_results_view',

  // === PRODUCT INTERACTION EVENTS ===
  /** User viewed product details page */
  PRODUCT_VIEW = 'product_view',
  /** User clicked on product in listing */
  PRODUCT_CLICK = 'product_click',
  /** User zoomed product image */
  PRODUCT_IMAGE_ZOOM = 'product_image_zoom',
  /** User watched product video */
  PRODUCT_VIDEO_PLAY = 'product_video_play',
  /** User clicked product variant (size, color) */
  PRODUCT_VARIANT_SELECT = 'product_variant_select',

  // === CART EVENTS ===
  /** User added product to cart */
  CART_ADD = 'cart_add',
  /** User removed product from cart */
  CART_REMOVE = 'cart_remove',
  /** User updated cart item quantity */
  CART_UPDATE = 'cart_update',
  /** User viewed cart page */
  CART_VIEW = 'cart_view',
  /** User applied coupon to cart */
  CART_COUPON_APPLY = 'cart_coupon_apply',

  // === CHECKOUT EVENTS ===
  /** User started checkout process */
  CHECKOUT_START = 'checkout_start',
  /** User completed shipping info step */
  CHECKOUT_SHIPPING_INFO = 'checkout_shipping_info',
  /** User completed payment info step */
  CHECKOUT_PAYMENT_INFO = 'checkout_payment_info',
  /** User completed order */
  CHECKOUT_COMPLETE = 'checkout_complete',

  // === SEARCH EVENTS ===
  /** User performed search */
  SEARCH = 'search',
  /** Search returned no results */
  SEARCH_NO_RESULTS = 'search_no_results',
  /** User clicked on search suggestion */
  SEARCH_SUGGESTION_CLICK = 'search_suggestion_click',

  // === NAVIGATION EVENTS ===
  /** User clicked on category link */
  CATEGORY_CLICK = 'category_click',
  /** User clicked on brand link */
  BRAND_CLICK = 'brand_click',
  /** User clicked on banner/promotional content */
  BANNER_CLICK = 'banner_click',
  /** User used filter on listing page */
  FILTER_APPLY = 'filter_apply',
  /** User sorted product listing */
  SORT_APPLY = 'sort_apply',

  // === WISHLIST EVENTS ===
  /** User added product to wishlist */
  WISHLIST_ADD = 'wishlist_add',
  /** User removed product from wishlist */
  WISHLIST_REMOVE = 'wishlist_remove',
  /** User moved item from wishlist to cart */
  WISHLIST_TO_CART = 'wishlist_to_cart',

  // === ACCOUNT EVENTS ===
  /** User registered new account */
  ACCOUNT_REGISTER = 'account_register',
  /** User logged in */
  ACCOUNT_LOGIN = 'account_login',
  /** User logged out */
  ACCOUNT_LOGOUT = 'account_logout',
  /** User updated profile */
  ACCOUNT_PROFILE_UPDATE = 'account_profile_update',

  // === SOCIAL EVENTS ===
  /** User shared product on social media */
  PRODUCT_SHARE = 'product_share',
  /** User wrote product review */
  REVIEW_SUBMIT = 'review_submit',
  /** User clicked "Ask Question" on product */
  PRODUCT_INQUIRY = 'product_inquiry',

  // === ERROR EVENTS ===
  /** User encountered error */
  ERROR = 'error',
  /** Payment failed */
  PAYMENT_FAILED = 'payment_failed',
  /** Product out of stock when user tried to add */
  OUT_OF_STOCK = 'out_of_stock',
}

/**
 * UserEvent Entity
 *
 * Captures individual user interactions for behavioral analytics.
 * Critical for understanding user intent and optimizing conversion funnels.
 *
 * EVENT SEQUENCE ANALYSIS:
 * Events are time-ordered within sessions to reconstruct user journeys:
 * 1. PAGE_VIEW (homepage) → SEARCH → SEARCH_RESULTS_VIEW
 * 2. PRODUCT_CLICK → PRODUCT_VIEW → PRODUCT_VARIANT_SELECT
 * 3. CART_ADD → CART_VIEW → CHECKOUT_START → CHECKOUT_COMPLETE
 *
 * ANALYTICS USE CASES:
 * - Identify funnel drop-off points (many PRODUCT_VIEW but few CART_ADD)
 * - Calculate average time between events (PRODUCT_VIEW to CART_ADD)
 * - Track search effectiveness (SEARCH vs SEARCH_NO_RESULTS ratio)
 * - Measure engagement by event diversity (variety of event types)
 * - Detect patterns indicating purchase intent (rapid event sequence)
 */
@Entity('user_events')
@Index(['sessionId', 'createdAt']) // Session event timeline queries
@Index(['userId', 'createdAt']) // User behavior history queries
@Index(['eventType', 'createdAt']) // Event type analytics
@Index(['createdAt']) // Time-series partitioning
@Index(['productId']) // Product-specific event queries
export class UserEvent {
  /**
   * Primary key - Auto-incrementing event ID
   */
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  /**
   * Session Reference - Links event to user session
   * Required for session-based analytics
   */
  @ManyToOne(() => UserSession, (session) => session.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: UserSession;

  @Column({ name: 'session_id' })
  sessionId: number;

  /**
   * User Reference - Direct link to user for cross-session analytics
   * Nullable for guest user events
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  /**
   * Event Type - Categorizes the user interaction
   * Core field for event filtering and analytics
   */
  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType,
  })
  eventType: EventType;

  /**
   * Event Category - High-level grouping for reporting
   * Derived from eventType for simplified analytics
   *
   * Examples: "page_view", "product_interaction", "cart", "checkout"
   */
  @Column({ name: 'event_category', type: 'varchar', length: 50 })
  @Index()
  eventCategory: string;

  /**
   * Page URL - Current page when event occurred
   * Used for page-level analytics and funnel visualization
   */
  @Column({ name: 'page_url', type: 'varchar', length: 500, nullable: true })
  pageUrl?: string;

  /**
   * Page Title - Human-readable page name
   * Easier to read in reports than URLs
   */
  @Column({ name: 'page_title', type: 'varchar', length: 255, nullable: true })
  pageTitle?: string;

  /**
   * Previous Page URL - Referrer within same session
   * Tracks navigation flow and identifies entry/exit pages
   */
  @Column({ name: 'previous_page_url', type: 'varchar', length: 500, nullable: true })
  previousPageUrl?: string;

  /**
   * Product ID - Associated product for product events
   * Required for PRODUCT_VIEW, CART_ADD, etc.
   */
  @Column({ name: 'product_id', nullable: true })
  productId?: number;

  /**
   * Product SKU - Product identifier for inventory tracking
   */
  @Column({ name: 'product_sku', type: 'varchar', length: 100, nullable: true })
  productSku?: string;

  /**
   * Product Name - Snapshot for analytics (denormalized)
   * Prevents broken reports if product is deleted
   */
  @Column({ name: 'product_name', type: 'varchar', length: 255, nullable: true })
  productName?: string;

  /**
   * Product Category - Category at time of event
   * Used for category-level performance analytics
   */
  @Column({ name: 'product_category', type: 'varchar', length: 255, nullable: true })
  productCategory?: string;

  /**
   * Product Price - Price at time of event
   * Tracks price changes and promotion effectiveness
   */
  @Column({
    name: 'product_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  productPrice?: number;

  /**
   * Quantity - Quantity for cart events
   * Used for cart analytics (average items per cart)
   */
  @Column({ name: 'quantity', type: 'int', nullable: true })
  quantity?: number;

  /**
   * Cart Value - Total cart value at time of event
   * Tracks cart value evolution during session
   */
  @Column({
    name: 'cart_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  cartValue?: number;

  /**
   * Search Query - User's search terms
   * Used for search analytics and query optimization
   */
  @Column({ name: 'search_query', type: 'varchar', length: 500, nullable: true })
  @Index()
  searchQuery?: string;

  /**
   * Search Results Count - Number of results returned
   * Identifies zero-result searches for improvement
   */
  @Column({ name: 'search_results_count', type: 'int', nullable: true })
  searchResultsCount?: number;

  /**
   * Category ID - Associated category for navigation events
   */
  @Column({ name: 'category_id', nullable: true })
  categoryId?: number;

  /**
   * Category Name - Category name snapshot
   */
  @Column({ name: 'category_name', type: 'varchar', length: 255, nullable: true })
  categoryName?: string;

  /**
   * Brand ID - Associated brand for brand events
   */
  @Column({ name: 'brand_id', nullable: true })
  brandId?: number;

  /**
   * Brand Name - Brand name snapshot
   */
  @Column({ name: 'brand_name', type: 'varchar', length: 255, nullable: true })
  brandName?: string;

  /**
   * Order ID - Associated order for checkout complete events
   */
  @Column({ name: 'order_id', nullable: true })
  orderId?: number;

  /**
   * Order Value - Total order value for conversion events
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
   * Coupon Code - Applied coupon for cart/checkout events
   */
  @Column({ name: 'coupon_code', type: 'varchar', length: 50, nullable: true })
  couponCode?: string;

  /**
   * Discount Amount - Discount applied from coupon
   */
  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discountAmount?: number;

  /**
   * Event Duration (milliseconds) - Time spent on action
   * Example: video play duration, page view time
   */
  @Column({ name: 'event_duration_ms', type: 'int', nullable: true })
  eventDurationMs?: number;

  /**
   * Scroll Depth - Percentage of page scrolled (0-100)
   * Measures content engagement
   */
  @Column({ name: 'scroll_depth', type: 'int', nullable: true })
  scrollDepth?: number;

  /**
   * Click Position - Position of clicked element in list
   * Example: Product at position 3 in search results
   */
  @Column({ name: 'click_position', type: 'int', nullable: true })
  clickPosition?: number;

  /**
   * Filter Values - Applied filters for listing pages
   * JSON object with filter types and values
   */
  @Column({ name: 'filter_values', type: 'json', nullable: true })
  filterValues?: Record<string, any>;

  /**
   * Sort Order - Applied sort option
   * Example: "price_asc", "popularity", "newest"
   */
  @Column({ name: 'sort_order', type: 'varchar', length: 50, nullable: true })
  sortOrder?: string;

  /**
   * Error Message - Error details for ERROR events
   */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  /**
   * Error Code - Error code for debugging
   */
  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode?: string;

  /**
   * A/B Test Variant - Experiment variant user is assigned to
   * Used for A/B test result analysis
   */
  @Column({ name: 'ab_test_variant', type: 'varchar', length: 50, nullable: true })
  abTestVariant?: string;

  /**
   * Device Information - Device details at time of event
   * Captured for mobile/desktop behavior comparison
   */
  @Column({ name: 'device_info', type: 'json', nullable: true })
  deviceInfo?: {
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
    screenResolution?: string;
  };

  /**
   * Event Metadata - Flexible additional data
   * Custom properties for specific event types
   */
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata?: Record<string, any>;

  /**
   * Client Timestamp - When event occurred on client side
   * Used to calculate network latency and client-server time drift
   */
  @Column({ name: 'client_timestamp', type: 'timestamp', nullable: true })
  clientTimestamp?: Date;

  /**
   * Server Timestamp - When event was received by server
   * Authoritative timestamp for analytics
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Derive event category from event type
   * Simplifies analytics by grouping related events
   */
  static deriveCategory(eventType: EventType): string {
    const categoryMap: Record<string, string> = {
      // Page views
      [EventType.PAGE_VIEW]: 'page_view',
      [EventType.HOMEPAGE_VIEW]: 'page_view',
      [EventType.CATEGORY_VIEW]: 'page_view',
      [EventType.SEARCH_RESULTS_VIEW]: 'page_view',

      // Product interactions
      [EventType.PRODUCT_VIEW]: 'product_interaction',
      [EventType.PRODUCT_CLICK]: 'product_interaction',
      [EventType.PRODUCT_IMAGE_ZOOM]: 'product_interaction',
      [EventType.PRODUCT_VIDEO_PLAY]: 'product_interaction',
      [EventType.PRODUCT_VARIANT_SELECT]: 'product_interaction',

      // Cart events
      [EventType.CART_ADD]: 'cart',
      [EventType.CART_REMOVE]: 'cart',
      [EventType.CART_UPDATE]: 'cart',
      [EventType.CART_VIEW]: 'cart',
      [EventType.CART_COUPON_APPLY]: 'cart',

      // Checkout events
      [EventType.CHECKOUT_START]: 'checkout',
      [EventType.CHECKOUT_SHIPPING_INFO]: 'checkout',
      [EventType.CHECKOUT_PAYMENT_INFO]: 'checkout',
      [EventType.CHECKOUT_COMPLETE]: 'checkout',

      // Search events
      [EventType.SEARCH]: 'search',
      [EventType.SEARCH_NO_RESULTS]: 'search',
      [EventType.SEARCH_SUGGESTION_CLICK]: 'search',

      // Navigation events
      [EventType.CATEGORY_CLICK]: 'navigation',
      [EventType.BRAND_CLICK]: 'navigation',
      [EventType.BANNER_CLICK]: 'navigation',
      [EventType.FILTER_APPLY]: 'navigation',
      [EventType.SORT_APPLY]: 'navigation',

      // Wishlist events
      [EventType.WISHLIST_ADD]: 'wishlist',
      [EventType.WISHLIST_REMOVE]: 'wishlist',
      [EventType.WISHLIST_TO_CART]: 'wishlist',

      // Account events
      [EventType.ACCOUNT_REGISTER]: 'account',
      [EventType.ACCOUNT_LOGIN]: 'account',
      [EventType.ACCOUNT_LOGOUT]: 'account',
      [EventType.ACCOUNT_PROFILE_UPDATE]: 'account',

      // Social events
      [EventType.PRODUCT_SHARE]: 'social',
      [EventType.REVIEW_SUBMIT]: 'social',
      [EventType.PRODUCT_INQUIRY]: 'social',

      // Error events
      [EventType.ERROR]: 'error',
      [EventType.PAYMENT_FAILED]: 'error',
      [EventType.OUT_OF_STOCK]: 'error',
    };

    return categoryMap[eventType] || 'other';
  }

  /**
   * Get event summary for logging and debugging
   */
  getSummary() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      userId: this.userId,
      eventType: this.eventType,
      eventCategory: this.eventCategory,
      pageUrl: this.pageUrl,
      productId: this.productId,
      cartValue: this.cartValue,
      createdAt: this.createdAt,
    };
  }
}

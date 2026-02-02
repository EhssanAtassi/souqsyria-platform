/**
 * Promo Card Interfaces
 * Type definitions for promotional card components in hero banner 70/30 layout
 *
 * Features:
 * - Bilingual support (Arabic/English)
 * - 70/30 content/image split layout
 * - Analytics tracking
 * - Golden Wheat theme integration
 * - Responsive design support
 *
 * @swagger
 * components:
 *   schemas:
 *     PromoCard:
 *       type: object
 *       description: Promotional card for hero banner sidebar (30% width)
 */

/**
 * Bilingual content structure for Arabic/English support
 */
export interface BilingualContent {
  /** English content */
  english: string;
  /** Arabic content */
  arabic: string;
}

/**
 * Promo card types defining visual style and behavior
 */
export type PromoCardType =
  | 'product'       // Promote specific product
  | 'category'      // Promote category
  | 'deal'          // Time-limited deal
  | 'seasonal'      // Seasonal promotion
  | 'brand';        // Brand highlight

/**
 * Promo card status lifecycle
 */
export type PromoCardStatus =
  | 'draft'         // Being created/edited
  | 'scheduled'     // Scheduled for future activation
  | 'active'        // Currently live
  | 'paused'        // Temporarily paused
  | 'completed';    // Campaign finished

/**
 * Badge position options
 */
export type BadgePosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Content alignment options for 70/30 split
 */
export type ContentAlignment =
  | 'left'          // Content on left, image on right
  | 'right';        // Content on right, image on left

/**
 * Theme colors aligned with Golden Wheat design system
 */
export type ThemeColor =
  | 'golden-wheat'   // Primary brand color (#D4A574)
  | 'forest'         // Secondary color (#2C5F2D)
  | 'charcoal'       // Text/UI color (#36454F)
  | 'deep-umber'     // Accent color (#6F4E37)
  | 'syrian-red'     // Syrian flag red (#CE1126)
  | 'syrian-gold';   // Traditional Syrian gold (#C9B037)

/**
 * Promo card image configuration
 */
export interface PromoCardImage {
  /** Image URL (30% width in 70/30 split) */
  url: string;
  /** Alt text for accessibility */
  alt: BilingualContent;
  /** Mobile-optimized image URL */
  mobileUrl?: string;
  /** Image focal point (0-1 scale) */
  focalPoint?: {
    x: number;
    y: number;
  };
}

/**
 * Discount badge configuration
 */
export interface DiscountBadge {
  /** Badge text (e.g., "20% OFF", "NEW") */
  text: BilingualContent;
  /** Background color */
  backgroundColor: string;
  /** Text color */
  textColor: string;
  /** Badge position */
  position: BadgePosition;
  /** Show/hide badge */
  visible: boolean;
}

/**
 * Promo card target route configuration
 */
export interface PromoCardRoute {
  /** Route type */
  type: 'product' | 'category' | 'collection' | 'landing' | 'external';
  /** Target path or URL */
  target: string;
  /** Query parameters */
  queryParams?: { [key: string]: any };
  /** Campaign tracking parameters (UTM) */
  tracking?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
  };
}

/**
 * Promo card scheduling configuration
 */
export interface PromoCardSchedule {
  /** Start date/time */
  startDate: Date;
  /** End date/time */
  endDate: Date;
  /** Timezone (Asia/Damascus) */
  timezone: string;
  /** Active days of week (0=Sunday, 6=Saturday) */
  activeDays?: number[];
  /** Active hours (24-hour format) */
  activeHours?: {
    start: number;  // 0-23
    end: number;    // 0-23
  };
}

/**
 * Promo card analytics and performance metrics
 */
export interface PromoCardAnalytics {
  /** Total impressions (times displayed) */
  impressions: number;
  /** Total clicks */
  clicks: number;
  /** Click-through rate (percentage) */
  clickThroughRate: number;
  /** Conversions (successful actions) */
  conversions: number;
  /** Conversion rate (percentage) */
  conversionRate: number;
  /** Revenue generated from this promo card */
  revenue: number;
  /** Last analytics update timestamp */
  lastUpdated: Date;
}

/**
 * Complete promo card configuration
 */
export interface PromoCard {
  /** Unique promo card identifier (UUID) */
  id: string;

  /** Promo card name for admin reference */
  name: BilingualContent;

  /** Promo card display type */
  type: PromoCardType;

  /** Current promo card status */
  status: PromoCardStatus;

  /** Display priority (higher = shown first) */
  priority: number;

  /** Headline text (70% content area) */
  headline: BilingualContent;

  /** Description text (70% content area) */
  description: BilingualContent;

  /** Promo card image (30% image area) */
  image: PromoCardImage;

  /** Content alignment (left or right) */
  contentAlignment: ContentAlignment;

  /** Discount badge (optional) */
  badge?: DiscountBadge;

  /** Navigation target */
  targetRoute: PromoCardRoute;

  /** Scheduling configuration */
  schedule: PromoCardSchedule;

  /** Analytics data */
  analytics: PromoCardAnalytics;

  /** Theme color */
  themeColor: ThemeColor;

  /** Creator user ID */
  createdBy?: string;

  /** Creation timestamp */
  createdAt: Date;

  /** Last update timestamp */
  updatedAt: Date;

  /** Soft delete flag */
  deleted?: boolean;
}

/**
 * Promo card query filters for API requests
 */
export interface PromoCardQueryFilters {
  /** Filter by status */
  status?: PromoCardStatus | PromoCardStatus[];
  /** Filter by type */
  type?: PromoCardType | PromoCardType[];
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort field */
  sortBy?: 'priority' | 'createdAt' | 'startDate' | 'impressions';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Include analytics data */
  includeAnalytics?: boolean;
}

/**
 * Promo card creation DTO
 */
export interface CreatePromoCardDTO {
  name: BilingualContent;
  type: PromoCardType;
  priority: number;
  headline: BilingualContent;
  description: BilingualContent;
  image: PromoCardImage;
  contentAlignment: ContentAlignment;
  badge?: DiscountBadge;
  targetRoute: PromoCardRoute;
  schedule: PromoCardSchedule;
  themeColor: ThemeColor;
}

/**
 * Promo card update DTO (partial updates)
 */
export interface UpdatePromoCardDTO {
  name?: BilingualContent;
  type?: PromoCardType;
  status?: PromoCardStatus;
  priority?: number;
  headline?: BilingualContent;
  description?: BilingualContent;
  image?: Partial<PromoCardImage>;
  contentAlignment?: ContentAlignment;
  badge?: Partial<DiscountBadge>;
  targetRoute?: Partial<PromoCardRoute>;
  schedule?: Partial<PromoCardSchedule>;
  themeColor?: ThemeColor;
}

/**
 * Analytics tracking event for promo cards
 */
export interface PromoCardTrackingEvent {
  /** Promo card ID */
  promoCardId: string;
  /** Event type */
  eventType: 'impression' | 'click' | 'view';
  /** User session ID */
  sessionId?: string;
  /** User ID (if authenticated) */
  userId?: string;
  /** Device type */
  deviceType: 'desktop' | 'tablet' | 'mobile';
  /** Browser information */
  browser?: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: { [key: string]: any };
}

/**
 * Promo card click event
 */
export interface PromoCardClickEvent {
  /** Promo card ID */
  promoCardId: string;
  /** Target route */
  targetRoute: string;
  /** Position in sidebar (0=top, 1=bottom) */
  position: number;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Hero Banner System Interfaces
 * Enterprise-grade type definitions for SouqSyria hero banner system
 *
 * Features:
 * - Bilingual support (Arabic/English)
 * - Multiple banner types
 * - Analytics tracking
 * - Scheduling and targeting
 * - Syrian Golden Wheat theme integration
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBanner:
 *       type: object
 *       description: Hero banner configuration for homepage display
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
 * Hero banner types defining display behavior
 */
export type HeroBannerType =
  | 'main'           // Primary hero banner (full-width, prominent)
  | 'secondary'      // Secondary banner (reduced prominence)
  | 'promotional'    // Promotional campaign banner
  | 'seasonal';      // Seasonal/holiday banner

/**
 * Banner status lifecycle
 */
export type BannerStatus =
  | 'draft'          // Being created/edited
  | 'scheduled'      // Scheduled for future activation
  | 'active'         // Currently live
  | 'paused'         // Temporarily paused
  | 'completed';     // Campaign finished

/**
 * Banner route types for navigation
 */
export type BannerRouteType =
  | 'product'        // Navigate to specific product
  | 'category'       // Navigate to category page
  | 'collection'     // Navigate to product collection
  | 'landing'        // Navigate to custom landing page
  | 'external';      // External URL

/**
 * CTA button variants
 */
export type CTAVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

/**
 * CTA button sizes
 */
export type CTASize = 'small' | 'medium' | 'large';

/**
 * Theme colors aligned with Golden Wheat design system
 */
export type ThemeColor =
  | 'golden-wheat'   // Primary brand color
  | 'forest'         // Secondary color
  | 'charcoal'       // Text/UI color
  | 'deep-umber'     // Accent color
  | 'syrian-red'     // Syrian flag red
  | 'syrian-gold';   // Traditional Syrian gold

/**
 * Banner image configuration with responsive support
 */
export interface BannerImage {
  /** Main desktop image URL */
  url: string;
  /** Alt text for accessibility */
  alt: BilingualContent;
  /** Mobile-optimized image URL */
  mobileUrl?: string;
  /** Tablet-optimized image URL */
  tabletUrl?: string;
  /** Thumbnail URL for admin preview */
  thumbnailUrl?: string;
  /** Image dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  /** Image format (webp, jpg, png) */
  format: string;
  /** Image size in bytes */
  size: number;
  /** Focal point for responsive cropping (0-1 scale) */
  focalPoint?: {
    x: number;
    y: number;
  };
}

/**
 * Call-to-action button configuration
 */
export interface BannerCTA {
  /** Button text */
  text: BilingualContent;
  /** Button style variant */
  variant: CTAVariant;
  /** Button size */
  size: CTASize;
  /** Button color theme */
  color: ThemeColor;
  /** Material icon name */
  icon?: string;
  /** Icon position relative to text */
  iconPosition?: 'left' | 'right';
  /** Action analytics identifier */
  analyticsId?: string;
  /** Show/hide CTA button */
  visible?: boolean;
}

/**
 * Banner routing configuration
 */
export interface BannerRoute {
  /** Route type */
  type: BannerRouteType;
  /** Target path or URL */
  target: string;
  /** Additional route parameters */
  parameters?: { [key: string]: any };
  /** Query parameters */
  queryParams?: { [key: string]: any };
  /** Open in new window/tab */
  external?: boolean;
  /** Campaign tracking parameters (UTM) */
  tracking?: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  };
}

/**
 * Banner scheduling configuration
 */
export interface BannerSchedule {
  /** Banner start date/time */
  startDate: Date;
  /** Banner end date/time */
  endDate: Date;
  /** Timezone for scheduling (Asia/Damascus) */
  timezone: string;
  /** Days of week when banner is active (0=Sunday, 6=Saturday) */
  activeDays?: number[];
  /** Hours when banner is active (24-hour format) */
  activeHours?: {
    start: number;  // 0-23
    end: number;    // 0-23
  };
}

/**
 * Banner analytics and performance metrics
 */
export interface BannerAnalytics {
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
  /** Revenue generated from this banner */
  revenue: number;
  /** Average time spent viewing banner (seconds) */
  averageViewTime?: number;
  /** Last analytics update timestamp */
  lastUpdated: Date;
}

/**
 * Banner theme configuration for Golden Wheat design system
 */
export interface BannerTheme {
  /** Primary theme color */
  primaryColor: ThemeColor;
  /** Secondary theme color */
  secondaryColor?: ThemeColor;
  /** Text color (light or dark) */
  textColor: 'light' | 'dark';
  /** Background overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Gradient direction */
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal';
  /** Custom CSS classes */
  customClasses?: string[];
}

/**
 * Complete hero banner configuration
 */
export interface HeroBanner {
  /** Unique banner identifier (UUID) */
  id: string;
  /** Banner name for admin reference */
  name: BilingualContent;
  /** Banner display type */
  type: HeroBannerType;
  /** Current banner status */
  status: BannerStatus;
  /** Display priority (higher = shown first) */
  priority: number;
  /** Main banner image */
  image: BannerImage;
  /** Mobile-specific image (optional) */
  mobileImage?: BannerImage;
  /** Primary headline text */
  headline: BilingualContent;
  /** Secondary subheadline text */
  subheadline?: BilingualContent;
  /** Call-to-action button */
  cta: BannerCTA;
  /** Navigation target */
  targetRoute: BannerRoute;
  /** Scheduling configuration */
  schedule: BannerSchedule;
  /** Analytics data */
  analytics: BannerAnalytics;
  /** Visual theme */
  theme: BannerTheme;
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
 * Hero banner query filters for API requests
 */
export interface HeroBannerQueryFilters {
  /** Filter by status */
  status?: BannerStatus | BannerStatus[];
  /** Filter by type */
  type?: HeroBannerType | HeroBannerType[];
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
 * Hero banner creation DTO
 */
export interface CreateHeroBannerDTO {
  name: BilingualContent;
  type: HeroBannerType;
  priority: number;
  image: Omit<BannerImage, 'thumbnailUrl'>;
  mobileImage?: Omit<BannerImage, 'thumbnailUrl'>;
  headline: BilingualContent;
  subheadline?: BilingualContent;
  cta: BannerCTA;
  targetRoute: BannerRoute;
  schedule: BannerSchedule;
  theme: BannerTheme;
}

/**
 * Hero banner update DTO (partial updates)
 */
export interface UpdateHeroBannerDTO {
  name?: BilingualContent;
  type?: HeroBannerType;
  status?: BannerStatus;
  priority?: number;
  image?: Partial<BannerImage>;
  mobileImage?: Partial<BannerImage>;
  headline?: BilingualContent;
  subheadline?: BilingualContent;
  cta?: Partial<BannerCTA>;
  targetRoute?: Partial<BannerRoute>;
  schedule?: Partial<BannerSchedule>;
  theme?: Partial<BannerTheme>;
}

/**
 * Analytics tracking event
 */
export interface BannerTrackingEvent {
  /** Banner ID */
  bannerId: string;
  /** Event type */
  eventType: 'impression' | 'click' | 'cta_click' | 'view';
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
 * Banner slide event for navigation tracking
 */
export interface BannerSlideEvent {
  /** Previous slide index */
  previousIndex: number;
  /** Current slide index */
  currentIndex: number;
  /** Total slides */
  totalSlides: number;
  /** Navigation method */
  method: 'auto' | 'manual' | 'keyboard';
  /** Timestamp */
  timestamp: Date;
}

/**
 * CTA click event
 */
export interface CTAClickEvent {
  /** Banner ID */
  bannerId: string;
  /** CTA text clicked */
  ctaText: string;
  /** Target route */
  targetRoute: string;
  /** Position in carousel */
  position: number;
  /** Timestamp */
  timestamp: Date;
}

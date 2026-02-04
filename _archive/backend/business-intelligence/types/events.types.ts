/**
 * @file events.types.ts
 * @description Event tracking and analytics type definitions
 * @module BusinessIntelligence/Types
 * 
 * This file contains comprehensive type definitions for event tracking,
 * session analytics, user behavior analysis, and event aggregation.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import {
  UserId,
  SessionId,
  ProductId,
  CategoryId,
  OrderId,
  CartId,
  EventId,
  CampaignId,
  MonetaryValue,
  PercentageValue,
  RateValue,
  CountValue,
  ScoreValue,
  BIDateRange,
  BIPeriodType,
  MetricChange,
  TimeSeries,
  DeepReadonly,
  SessionContext,
  UtmParameters,
  DeviceType,
  BrowserInfo,
} from './core.types';

// =============================================================================
// CORE EVENT TYPES
// =============================================================================

/**
 * Business event category enumeration
 */
export enum BusinessEventCategory {
  /** User interaction events */
  USER_INTERACTION = 'user_interaction',
  /** E-commerce transaction events */
  ECOMMERCE = 'ecommerce',
  /** Navigation and page view events */
  NAVIGATION = 'navigation',
  /** Marketing and campaign events */
  MARKETING = 'marketing',
  /** Authentication and account events */
  AUTHENTICATION = 'authentication',
  /** Search and discovery events */
  SEARCH = 'search',
  /** Content engagement events */
  CONTENT_ENGAGEMENT = 'content_engagement',
  /** Customer service events */
  CUSTOMER_SERVICE = 'customer_service',
  /** System and technical events */
  SYSTEM = 'system',
  /** Custom business events */
  CUSTOM = 'custom',
}

/**
 * Event priority level
 */
export enum EventPriority {
  /** Critical events affecting revenue or user experience */
  CRITICAL = 'critical',
  /** Important events for business KPIs */
  HIGH = 'high',
  /** Standard business events */
  NORMAL = 'normal',
  /** Optional tracking events */
  LOW = 'low',
}

/**
 * Event processing status
 */
export enum EventProcessingStatus {
  /** Event captured but not processed */
  PENDING = 'pending',
  /** Event being processed */
  PROCESSING = 'processing',
  /** Event successfully processed */
  PROCESSED = 'processed',
  /** Event processing failed */
  FAILED = 'failed',
  /** Event was duplicate and skipped */
  DUPLICATE = 'duplicate',
  /** Event was invalid and rejected */
  INVALID = 'invalid',
}

/**
 * Core business event structure
 */
export interface BusinessEvent {
  /** Event unique identifier */
  readonly eventId: EventId;
  /** Event name/type */
  readonly eventName: string;
  /** Event category */
  readonly category: BusinessEventCategory;
  /** Event priority */
  readonly priority: EventPriority;
  /** Event timestamp */
  readonly timestamp: Date;
  /** Session context */
  readonly sessionId: SessionId;
  /** User identifier (if authenticated) */
  readonly userId?: UserId;
  /** Event payload/properties */
  readonly properties: Record<string, unknown>;
  /** Event metadata */
  readonly metadata: EventMetadata;
  /** Revenue impact (if applicable) */
  readonly revenueImpact?: MonetaryValue;
  /** Processing status */
  readonly processingStatus: EventProcessingStatus;
  /** Processing timestamp */
  readonly processedAt?: Date;
  /** Error information (if processing failed) */
  readonly error?: string;
}

/**
 * Event metadata for tracking and context
 */
export interface EventMetadata {
  /** Event source/origin */
  readonly source: 'web' | 'mobile_app' | 'api' | 'system' | 'admin' | 'webhook';
  /** Source version */
  readonly sourceVersion?: string;
  /** Environment where event occurred */
  readonly environment: 'production' | 'staging' | 'development' | 'test';
  /** Geographic location */
  readonly location?: {
    readonly countryCode: string;
    readonly region?: string;
    readonly city?: string;
    readonly coordinates?: {
      readonly latitude: number;
      readonly longitude: number;
    };
  };
  /** Device and browser information */
  readonly deviceInfo?: BrowserInfo;
  /** Network information */
  readonly networkInfo?: {
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  };
  /** Attribution data */
  readonly attribution?: {
    readonly utmParams: UtmParameters;
    readonly referrer?: string;
    readonly campaignId?: CampaignId;
  };
  /** A/B test information */
  readonly experiments?: readonly {
    readonly experimentId: string;
    readonly variantId: string;
    readonly variantName: string;
  }[];
  /** Custom tracking tags */
  readonly tags?: readonly string[];
}

// =============================================================================
// SPECIALIZED EVENT TYPES
// =============================================================================

/**
 * User interaction event
 */
export interface UserInteractionEvent extends BusinessEvent {
  readonly category: BusinessEventCategory.USER_INTERACTION;
  readonly interactionType: 'click' | 'hover' | 'scroll' | 'form_submit' | 'button_click' | 'link_click' | 'download';
  readonly targetElement: {
    readonly elementType: string;
    readonly elementId?: string;
    readonly elementClass?: string;
    readonly elementText?: string;
    readonly elementPosition?: {
      readonly x: number;
      readonly y: number;
    };
  };
  readonly pageInfo: {
    readonly url: string;
    readonly title: string;
    readonly path: string;
    readonly referrer?: string;
  };
}

/**
 * E-commerce event
 */
export interface ECommerceEvent extends BusinessEvent {
  readonly category: BusinessEventCategory.ECOMMERCE;
  readonly ecommerceType: 'product_view' | 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'purchase' | 'refund';
  readonly products?: readonly {
    readonly productId: ProductId;
    readonly productName: string;
    readonly categoryId: CategoryId;
    readonly categoryName: string;
    readonly sku: string;
    readonly price: MonetaryValue;
    readonly quantity: CountValue;
    readonly brand?: string;
    readonly variant?: string;
  }[];
  readonly transactionInfo?: {
    readonly orderId?: OrderId;
    readonly cartId?: CartId;
    readonly totalValue: MonetaryValue;
    readonly currency: string;
    readonly tax?: MonetaryValue;
    readonly shipping?: MonetaryValue;
    readonly discounts?: MonetaryValue;
    readonly paymentMethod?: string;
  };
}

/**
 * Marketing event
 */
export interface MarketingEvent extends BusinessEvent {
  readonly category: BusinessEventCategory.MARKETING;
  readonly marketingType: 'email_open' | 'email_click' | 'ad_impression' | 'ad_click' | 'campaign_conversion' | 'promotion_view';
  readonly campaignInfo: {
    readonly campaignId: CampaignId;
    readonly campaignName: string;
    readonly campaignType: string;
    readonly messageId?: string;
    readonly adGroupId?: string;
    readonly keywords?: readonly string[];
  };
  readonly touchpointInfo: {
    readonly channel: string;
    readonly medium: string;
    readonly source: string;
    readonly content?: string;
    readonly term?: string;
  };
}

/**
 * Search event
 */
export interface SearchEvent extends BusinessEvent {
  readonly category: BusinessEventCategory.SEARCH;
  readonly searchType: 'site_search' | 'product_search' | 'category_browse' | 'filter_apply' | 'sort_apply';
  readonly searchDetails: {
    readonly query?: string;
    readonly filters?: Record<string, unknown>;
    readonly sortBy?: string;
    readonly sortOrder?: 'asc' | 'desc';
    readonly resultCount: CountValue;
    readonly page: CountValue;
    readonly selectedResult?: {
      readonly resultPosition: CountValue;
      readonly productId?: ProductId;
      readonly categoryId?: CategoryId;
    };
  };
}

// =============================================================================
// EVENT STREAM AND SESSION TYPES
// =============================================================================

/**
 * Event stream for real-time processing
 */
export interface EventStream {
  /** Stream identifier */
  readonly streamId: string;
  /** Stream name */
  readonly streamName: string;
  /** Events in the stream */
  readonly events: readonly BusinessEvent[];
  /** Stream metadata */
  readonly streamMetadata: {
    readonly startTime: Date;
    readonly endTime?: Date;
    readonly eventCount: CountValue;
    readonly sessionId: SessionId;
    readonly userId?: UserId;
  };
  /** Stream processing status */
  readonly processingStatus: 'active' | 'completed' | 'error' | 'timeout';
}

/**
 * User behavior session analysis
 */
export interface UserBehaviorSession {
  /** Session identifier */
  readonly sessionId: SessionId;
  /** User identifier (if authenticated) */
  readonly userId?: UserId;
  /** Session context */
  readonly sessionContext: SessionContext;
  /** Session duration in seconds */
  readonly duration: CountValue;
  /** Page views in session */
  readonly pageViews: CountValue;
  /** Events in session */
  readonly events: readonly BusinessEvent[];
  /** Session value (revenue attributed) */
  readonly sessionValue: MonetaryValue;
  /** Conversion events in session */
  readonly conversions: readonly ECommerceEvent[];
  /** Session engagement metrics */
  readonly engagement: SessionEngagementMetrics;
  /** Session outcome */
  readonly outcome: SessionOutcome;
}

/**
 * Session engagement metrics
 */
export interface SessionEngagementMetrics {
  /** Bounce rate indicator */
  readonly isBounce: boolean;
  /** Time on site in seconds */
  readonly timeOnSite: CountValue;
  /** Average time per page */
  readonly averageTimePerPage: CountValue;
  /** Scroll depth percentage */
  readonly averageScrollDepth: PercentageValue;
  /** Interaction events count */
  readonly interactionCount: CountValue;
  /** Engagement score (0-100) */
  readonly engagementScore: ScoreValue;
  /** Pages visited count */
  readonly pagesVisited: CountValue;
  /** Unique interactions */
  readonly uniqueInteractions: CountValue;
}

/**
 * Session outcome classification
 */
export interface SessionOutcome {
  /** Primary outcome type */
  readonly outcomeType: 'conversion' | 'engagement' | 'bounce' | 'research' | 'support' | 'unknown';
  /** Outcome value */
  readonly outcomeValue: MonetaryValue;
  /** Goal completions */
  readonly goalCompletions: readonly {
    readonly goalId: string;
    readonly goalName: string;
    readonly goalValue: MonetaryValue;
    readonly completedAt: Date;
  }[];
  /** Exit reason */
  readonly exitReason?: 'natural_end' | 'timeout' | 'error' | 'abandonment' | 'external_link';
  /** Session quality score */
  readonly qualityScore: ScoreValue;
}

// =============================================================================
// EVENT AGGREGATION AND ANALYTICS TYPES
// =============================================================================

/**
 * Event aggregation configuration
 */
export interface EventAggregationConfig {
  /** Aggregation identifier */
  readonly aggregationId: string;
  /** Aggregation name */
  readonly name: string;
  /** Events to aggregate */
  readonly eventFilters: {
    readonly eventNames?: readonly string[];
    readonly categories?: readonly BusinessEventCategory[];
    readonly priorities?: readonly EventPriority[];
    readonly dateRange: BIDateRange;
    readonly userFilters?: Record<string, unknown>;
  };
  /** Aggregation dimensions */
  readonly dimensions: readonly ('time' | 'user' | 'session' | 'device' | 'location' | 'campaign' | 'product' | 'custom')[];
  /** Metrics to calculate */
  readonly metrics: readonly EventAggregationMetric[];
  /** Time granularity */
  readonly timeGranularity: BIPeriodType;
  /** Processing schedule */
  readonly schedule?: {
    readonly frequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
    readonly timezone: string;
  };
}

/**
 * Event aggregation metric definition
 */
export interface EventAggregationMetric {
  /** Metric name */
  readonly name: string;
  /** Metric type */
  readonly type: 'count' | 'sum' | 'average' | 'min' | 'max' | 'distinct_count' | 'percentile';
  /** Field to aggregate */
  readonly field?: string;
  /** Percentile value (if type is percentile) */
  readonly percentile?: number;
  /** Filters specific to this metric */
  readonly filters?: Record<string, unknown>;
}

/**
 * Aggregated event metrics result
 */
export interface EventAggregationResult {
  /** Aggregation configuration */
  readonly config: EventAggregationConfig;
  /** Aggregation period */
  readonly period: BIDateRange;
  /** Aggregated data points */
  readonly data: readonly EventAggregationDataPoint[];
  /** Summary statistics */
  readonly summary: {
    readonly totalEvents: CountValue;
    readonly uniqueUsers: CountValue;
    readonly uniqueSessions: CountValue;
    readonly totalRevenue: MonetaryValue;
  };
  /** Processing metadata */
  readonly metadata: {
    readonly processedAt: Date;
    readonly processingDuration: CountValue; // milliseconds
    readonly dataQuality: ScoreValue;
  };
}

/**
 * Event aggregation data point
 */
export interface EventAggregationDataPoint {
  /** Dimension values */
  readonly dimensions: Record<string, string | number>;
  /** Metric values */
  readonly metrics: Record<string, number>;
  /** Time bucket (if time dimension included) */
  readonly timeBucket?: Date;
  /** Event count for this data point */
  readonly eventCount: CountValue;
}

// =============================================================================
// REAL-TIME ANALYTICS TYPES
// =============================================================================

/**
 * Real-time event analytics dashboard
 */
export interface RealTimeEventAnalytics {
  /** Dashboard metadata */
  readonly dashboardId: string;
  readonly generatedAt: Date;
  readonly refreshInterval: CountValue; // seconds
  /** Live metrics */
  readonly liveMetrics: {
    /** Current active users */
    readonly activeUsers: CountValue;
    /** Events per minute */
    readonly eventsPerMinute: CountValue;
    /** Revenue per hour */
    readonly revenuePerHour: MonetaryValue;
    /** Current conversion rate */
    readonly conversionRate: PercentageValue;
    /** Average session duration */
    readonly avgSessionDuration: CountValue;
  };
  /** Top events in last hour */
  readonly topEvents: readonly {
    readonly eventName: string;
    readonly count: CountValue;
    readonly trend: 'up' | 'down' | 'stable';
  }[];
  /** Geographic activity */
  readonly geoActivity: readonly {
    readonly countryCode: string;
    readonly activeUsers: CountValue;
    readonly events: CountValue;
    readonly revenue: MonetaryValue;
  }[];
  /** Device breakdown */
  readonly deviceBreakdown: readonly {
    readonly deviceType: DeviceType;
    readonly percentage: PercentageValue;
    readonly activeUsers: CountValue;
  }[];
  /** Alert conditions */
  readonly alerts: readonly RealTimeAlert[];
}

/**
 * Real-time alert configuration
 */
export interface RealTimeAlert {
  /** Alert identifier */
  readonly alertId: string;
  /** Alert name */
  readonly name: string;
  /** Alert condition */
  readonly condition: {
    readonly metric: string;
    readonly operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    readonly threshold: number;
    readonly timeWindow: CountValue; // minutes
  };
  /** Alert status */
  readonly status: 'active' | 'triggered' | 'resolved' | 'disabled';
  /** Last triggered time */
  readonly lastTriggered?: Date;
  /** Alert severity */
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  /** Notification channels */
  readonly notificationChannels: readonly ('email' | 'slack' | 'webhook' | 'sms')[];
}

// =============================================================================
// EVENT CORRELATION AND INSIGHTS
// =============================================================================

/**
 * Event correlation analysis
 */
export interface EventCorrelationAnalysis {
  /** Analysis metadata */
  readonly analysisId: string;
  readonly analysisPeriod: BIDateRange;
  readonly generatedAt: Date;
  /** Event correlations */
  readonly correlations: readonly {
    readonly eventA: string;
    readonly eventB: string;
    readonly correlationScore: ScoreValue;
    readonly significanceLevel: PercentageValue;
    readonly sampleSize: CountValue;
    readonly correlationType: 'positive' | 'negative' | 'neutral';
  }[];
  /** Sequence patterns */
  readonly sequencePatterns: readonly {
    readonly pattern: readonly string[];
    readonly frequency: CountValue;
    readonly conversionRate: PercentageValue;
    readonly averageRevenue: MonetaryValue;
    readonly support: PercentageValue;
    readonly confidence: PercentageValue;
  }[];
  /** Anomaly detection */
  readonly anomalies: readonly {
    readonly eventName: string;
    readonly timestamp: Date;
    readonly expectedValue: number;
    readonly actualValue: number;
    readonly anomalyScore: ScoreValue;
    readonly anomalyType: 'spike' | 'drop' | 'trend_change' | 'seasonality_break';
  }[];
}

/**
 * Event-driven insights
 */
export interface EventDrivenInsights {
  /** User journey insights */
  readonly journeyInsights: readonly {
    readonly journeyName: string;
    readonly pathLength: CountValue;
    readonly conversionRate: PercentageValue;
    readonly dropOffPoints: readonly string[];
    readonly optimizationOpportunities: readonly string[];
  }[];
  /** Product performance insights */
  readonly productInsights: readonly {
    readonly productId: ProductId;
    readonly productName: string;
    readonly viewToCartRate: PercentageValue;
    readonly cartToCheckoutRate: PercentageValue;
    readonly checkoutToOrderRate: PercentageValue;
    readonly revenueAttribution: MonetaryValue;
  }[];
  /** Campaign effectiveness */
  readonly campaignInsights: readonly {
    readonly campaignId: CampaignId;
    readonly campaignName: string;
    readonly impressions: CountValue;
    readonly clicks: CountValue;
    readonly conversions: CountValue;
    readonly roas: RateValue; // Return on Ad Spend
    readonly costPerConversion: MonetaryValue;
  }[];
  /** Behavioral segments */
  readonly behavioralSegments: readonly {
    readonly segmentName: string;
    readonly userCount: CountValue;
    readonly characteristics: readonly string[];
    readonly avgSessionValue: MonetaryValue;
    readonly conversionRate: PercentageValue;
  }[];
}

// =============================================================================
// EXPORT TYPES FOR API INTERFACES
// =============================================================================

/**
 * Comprehensive event tracking export for API usage
 */
export type EventTypes = DeepReadonly<{
  BusinessEventCategory;
  EventPriority;
  EventProcessingStatus;
  BusinessEvent;
  UserInteractionEvent;
  ECommerceEvent;
  MarketingEvent;
  SearchEvent;
  EventStream;
  UserBehaviorSession;
  EventAggregationConfig;
  EventAggregationResult;
  RealTimeEventAnalytics;
  EventCorrelationAnalysis;
  EventDrivenInsights;
}>;
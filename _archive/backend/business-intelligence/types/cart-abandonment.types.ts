/**
 * @file cart-abandonment.types.ts
 * @description Cart abandonment detection and recovery type definitions
 * @module BusinessIntelligence/Types
 * 
 * This file contains comprehensive type definitions for cart abandonment
 * tracking, analysis, recovery campaigns, and optimization insights.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import {
  UserId,
  SessionId,
  ProductId,
  CategoryId,
  CartId,
  EventId,
  CampaignId,
  MonetaryValue,
  PercentageValue,
  RateValue,
  CountValue,
  ScoreValue,
  BIDateRange,
  MetricChange,
  TimeSeries,
  DeepReadonly,
  SessionContext,
  UtmParameters,
  CustomerDemographics,
} from './core.types';

// =============================================================================
// CART ABANDONMENT DETECTION TYPES
// =============================================================================

/**
 * Cart abandonment trigger events
 */
export enum AbandonmentTriggerEvent {
  /** User explicitly closed browser/tab */
  BROWSER_CLOSE = 'browser_close',
  /** Session timeout without activity */
  SESSION_TIMEOUT = 'session_timeout',
  /** User navigated away from checkout */
  NAVIGATION_AWAY = 'navigation_away',
  /** User left items in cart without proceeding */
  CHECKOUT_ABANDONMENT = 'checkout_abandonment',
  /** Payment failed or rejected */
  PAYMENT_FAILURE = 'payment_failure',
  /** User manually removed all items */
  CART_CLEARED = 'cart_cleared',
  /** Mobile app backgrounded */
  APP_BACKGROUNDED = 'app_backgrounded',
  /** Unknown/system detected */
  SYSTEM_DETECTED = 'system_detected',
}

/**
 * Cart abandonment stage enumeration
 */
export enum CartAbandonmentStage {
  /** Items added but no checkout initiated */
  CART_LOADED = 'cart_loaded',
  /** Checkout process started */
  CHECKOUT_INITIATED = 'checkout_initiated',
  /** Shipping information entered */
  SHIPPING_INFO = 'shipping_info',
  /** Payment method selected */
  PAYMENT_METHOD = 'payment_method',
  /** Payment processing failed */
  PAYMENT_FAILED = 'payment_failed',
  /** Order review stage */
  ORDER_REVIEW = 'order_review',
}

/**
 * Cart abandonment event tracking
 */
export interface CartAbandonmentEvent {
  /** Event unique identifier */
  readonly eventId: EventId;
  /** Cart identifier */
  readonly cartId: CartId;
  /** Session identifier */
  readonly sessionId: SessionId;
  /** User ID (if authenticated) */
  readonly userId?: UserId;
  /** Abandonment trigger */
  readonly trigger: AbandonmentTriggerEvent;
  /** Stage at which abandonment occurred */
  readonly abandonmentStage: CartAbandonmentStage;
  /** Timestamp when abandonment was detected */
  readonly abandonedAt: Date;
  /** Session context at abandonment */
  readonly sessionContext: SessionContext;
  /** Cart contents at abandonment */
  readonly cartContents: CartAbandonmentContents;
  /** Abandonment reasons (if known) */
  readonly abandonmentReasons: readonly CartAbandonmentReason[];
  /** Recovery status */
  readonly recoveryStatus: CartRecoveryStatus;
  /** Attribution information */
  readonly attribution: {
    readonly source: string;
    readonly medium: string;
    readonly campaign?: string;
    readonly utmParams?: UtmParameters;
  };
}

/**
 * Cart contents at time of abandonment
 */
export interface CartAbandonmentContents {
  /** Total cart value */
  readonly totalValue: MonetaryValue;
  /** Number of items in cart */
  readonly itemCount: CountValue;
  /** Individual cart items */
  readonly items: readonly {
    readonly productId: ProductId;
    readonly productName: string;
    readonly categoryId: CategoryId;
    readonly categoryName: string;
    readonly quantity: CountValue;
    readonly unitPrice: MonetaryValue;
    readonly totalPrice: MonetaryValue;
    readonly sku: string;
    readonly vendorId?: number;
    readonly vendorName?: string;
    readonly productImage?: string;
  }[];
  /** Applied discounts */
  readonly discounts: readonly {
    readonly discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
    readonly discountValue: number;
    readonly discountCode?: string;
    readonly discountName: string;
  }[];
  /** Estimated shipping cost */
  readonly estimatedShipping?: MonetaryValue;
  /** Estimated taxes */
  readonly estimatedTax?: MonetaryValue;
}

/**
 * Cart abandonment reason enumeration
 */
export enum CartAbandonmentReason {
  /** High shipping costs */
  HIGH_SHIPPING_COST = 'high_shipping_cost',
  /** Unexpected total cost */
  UNEXPECTED_COST = 'unexpected_cost',
  /** Long checkout process */
  LONG_CHECKOUT_PROCESS = 'long_checkout_process',
  /** Payment security concerns */
  SECURITY_CONCERNS = 'security_concerns',
  /** Required account creation */
  ACCOUNT_CREATION_REQUIRED = 'account_creation_required',
  /** Payment method not available */
  PAYMENT_METHOD_UNAVAILABLE = 'payment_method_unavailable',
  /** Website errors or crashes */
  TECHNICAL_ISSUES = 'technical_issues',
  /** Slow page loading */
  SLOW_PERFORMANCE = 'slow_performance',
  /** Changed mind about purchase */
  CHANGED_MIND = 'changed_mind',
  /** Comparison shopping */
  COMPARISON_SHOPPING = 'comparison_shopping',
  /** Found better price elsewhere */
  FOUND_BETTER_PRICE = 'found_better_price',
  /** Out of stock items */
  OUT_OF_STOCK = 'out_of_stock',
  /** Distraction or interruption */
  DISTRACTION = 'distraction',
  /** Just browsing */
  JUST_BROWSING = 'just_browsing',
  /** Unknown reason */
  UNKNOWN = 'unknown',
}

/**
 * Cart abandonment reason analysis
 */
export interface CartAbandonmentReasonAnalysis {
  /** Detected reasons with confidence scores */
  readonly reasons: readonly {
    readonly reason: CartAbandonmentReason;
    readonly confidence: ScoreValue;
    readonly indicators: readonly string[];
  }[];
  /** Analysis method used */
  readonly analysisMethod: 'rule_based' | 'machine_learning' | 'hybrid';
  /** Analysis timestamp */
  readonly analyzedAt: Date;
}

// =============================================================================
// CART RECOVERY TYPES
// =============================================================================

/**
 * Cart recovery status enumeration
 */
export enum CartRecoveryStatus {
  /** No recovery attempted */
  NO_ATTEMPT = 'no_attempt',
  /** Recovery campaigns sent */
  RECOVERY_SENT = 'recovery_sent',
  /** Customer engaged with recovery */
  ENGAGED = 'engaged',
  /** Cart recovered (purchase completed) */
  RECOVERED = 'recovered',
  /** Customer opted out of recovery */
  OPTED_OUT = 'opted_out',
  /** Recovery failed */
  FAILED = 'failed',
}

/**
 * Cart recovery campaign configuration
 */
export interface CartRecoveryCampaign {
  /** Campaign unique identifier */
  readonly campaignId: CampaignId;
  /** Campaign name */
  readonly name: string;
  /** Campaign description */
  readonly description: string;
  /** Campaign type */
  readonly type: 'email' | 'sms' | 'push_notification' | 'retargeting_ad' | 'in_app_message';
  /** Trigger conditions */
  readonly triggerConditions: CartRecoveryTrigger;
  /** Campaign content */
  readonly content: CartRecoveryContent;
  /** Timing configuration */
  readonly timing: CartRecoveryTiming;
  /** Target audience filters */
  readonly audienceFilters: CartRecoveryAudienceFilter;
  /** Campaign performance tracking */
  readonly performanceMetrics: CartRecoveryPerformanceMetrics;
  /** A/B test configuration */
  readonly abTestConfig?: CartRecoveryABTest;
  /** Campaign status */
  readonly status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  /** Creation and modification dates */
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Cart recovery trigger conditions
 */
export interface CartRecoveryTrigger {
  /** Minimum time since abandonment (minutes) */
  readonly minAbandonmentTime: CountValue;
  /** Maximum time since abandonment (hours) */
  readonly maxAbandonmentTime: CountValue;
  /** Minimum cart value threshold */
  readonly minCartValue?: MonetaryValue;
  /** Maximum cart value threshold */
  readonly maxCartValue?: MonetaryValue;
  /** Required abandonment stages */
  readonly abandonmentStages: readonly CartAbandonmentStage[];
  /** Excluded abandonment triggers */
  readonly excludedTriggers?: readonly AbandonmentTriggerEvent[];
  /** Required user authentication status */
  readonly requireAuthenticated?: boolean;
  /** Geographic restrictions */
  readonly geoRestrictions?: readonly string[];
}

/**
 * Cart recovery content configuration
 */
export interface CartRecoveryContent {
  /** Content subject line */
  readonly subject: string;
  /** Content body template */
  readonly bodyTemplate: string;
  /** Call-to-action text */
  readonly ctaText: string;
  /** Call-to-action URL */
  readonly ctaUrl: string;
  /** Personalization tokens */
  readonly personalizationTokens: readonly {
    readonly token: string;
    readonly description: string;
    readonly required: boolean;
  }[];
  /** Discount offer */
  readonly discountOffer?: {
    readonly type: 'percentage' | 'fixed_amount' | 'free_shipping';
    readonly value: number;
    readonly expiresIn: CountValue; // hours
    readonly conditions?: string;
  };
  /** Product recommendations */
  readonly includeRecommendations: boolean;
  /** Social proof elements */
  readonly socialProof?: {
    readonly includeReviews: boolean;
    readonly includeUrgency: boolean;
    readonly includeSales: boolean;
  };
}

/**
 * Cart recovery timing configuration
 */
export interface CartRecoveryTiming {
  /** Sequence of recovery messages */
  readonly sequence: readonly {
    readonly sequenceOrder: CountValue;
    readonly delayMinutes: CountValue;
    readonly contentVariation?: string;
    readonly maxRetries: CountValue;
  }[];
  /** Time zone for sending */
  readonly timeZone: string;
  /** Preferred sending hours */
  readonly sendingHours: {
    readonly startHour: CountValue;
    readonly endHour: CountValue;
  };
  /** Days of week to send */
  readonly sendingDays: readonly ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  /** Frequency cap */
  readonly frequencyCap: {
    readonly maxPerDay: CountValue;
    readonly maxPerWeek: CountValue;
  };
}

/**
 * Cart recovery audience filtering
 */
export interface CartRecoveryAudienceFilter {
  /** Customer segments to include */
  readonly includeSegments?: readonly string[];
  /** Customer segments to exclude */
  readonly excludeSegments?: readonly string[];
  /** Demographic filters */
  readonly demographicFilters?: Partial<CustomerDemographics>;
  /** Purchase history filters */
  readonly purchaseHistoryFilters?: {
    readonly minPreviousPurchases?: CountValue;
    readonly maxDaysSinceLastPurchase?: CountValue;
    readonly minLifetimeValue?: MonetaryValue;
  };
  /** Behavioral filters */
  readonly behavioralFilters?: {
    readonly minSiteVisits?: CountValue;
    readonly minPageViews?: CountValue;
    readonly hasEngagedWithPrevious?: boolean;
  };
  /** Exclusion criteria */
  readonly exclusionCriteria?: {
    readonly unsubscribed: boolean;
    readonly recentlyPurchased: boolean;
    readonly complained: boolean;
  };
}

// =============================================================================
// CART RECOVERY ANALYTICS TYPES
// =============================================================================

/**
 * Cart recovery performance metrics
 */
export interface CartRecoveryPerformanceMetrics {
  /** Campaign identifier */
  readonly campaignId: CampaignId;
  /** Analysis period */
  readonly analysisPeriod: BIDateRange;
  /** Email/message metrics */
  readonly messageMetrics: {
    readonly sent: CountValue;
    readonly delivered: CountValue;
    readonly opened: CountValue;
    readonly clicked: CountValue;
    readonly bounced: CountValue;
    readonly unsubscribed: CountValue;
    readonly deliveryRate: PercentageValue;
    readonly openRate: PercentageValue;
    readonly clickRate: PercentageValue;
    readonly unsubscribeRate: PercentageValue;
  };
  /** Conversion metrics */
  readonly conversionMetrics: {
    readonly cartRecoveries: CountValue;
    readonly recoveryRate: PercentageValue;
    readonly revenueRecovered: MonetaryValue;
    readonly averageRecoveredValue: MonetaryValue;
    readonly timeToRecovery: {
      readonly average: CountValue; // hours
      readonly median: CountValue; // hours
    };
  };
  /** ROI metrics */
  readonly roiMetrics: {
    readonly campaignCost: MonetaryValue;
    readonly revenueGenerated: MonetaryValue;
    readonly roi: PercentageValue;
    readonly costPerRecovery: MonetaryValue;
  };
}

/**
 * Cart recovery A/B test configuration
 */
export interface CartRecoveryABTest {
  /** Test identifier */
  readonly testId: string;
  /** Test name */
  readonly testName: string;
  /** Control variant */
  readonly controlVariant: CartRecoveryContent;
  /** Test variants */
  readonly testVariants: readonly {
    readonly variantId: string;
    readonly variantName: string;
    readonly content: CartRecoveryContent;
    readonly trafficPercentage: PercentageValue;
  }[];
  /** Test metrics to track */
  readonly testMetrics: readonly ('open_rate' | 'click_rate' | 'recovery_rate' | 'revenue_per_email')[];
  /** Statistical significance threshold */
  readonly significanceThreshold: PercentageValue;
  /** Test results */
  readonly results?: CartRecoveryABTestResults;
}

/**
 * Cart recovery A/B test results
 */
export interface CartRecoveryABTestResults {
  /** Test duration */
  readonly testDuration: CountValue; // days
  /** Sample sizes */
  readonly sampleSizes: readonly {
    readonly variantId: string;
    readonly sampleSize: CountValue;
  }[];
  /** Performance by variant */
  readonly variantPerformance: readonly {
    readonly variantId: string;
    readonly variantName: string;
    readonly openRate: PercentageValue;
    readonly clickRate: PercentageValue;
    readonly recoveryRate: PercentageValue;
    readonly revenuePerEmail: MonetaryValue;
    readonly confidenceLevel: PercentageValue;
  }[];
  /** Winning variant */
  readonly winningVariant: {
    readonly variantId: string;
    readonly metric: string;
    readonly improvement: PercentageValue;
    readonly isSignificant: boolean;
  };
  /** Recommendations */
  readonly recommendations: readonly string[];
}

// =============================================================================
// CART ABANDONMENT ANALYTICS TYPES
// =============================================================================

/**
 * Cart abandonment rate metrics
 */
export interface CartAbandonmentRateMetrics {
  /** Analysis period */
  readonly analysisPeriod: BIDateRange;
  /** Overall abandonment metrics */
  readonly overallMetrics: {
    readonly totalCartsCreated: CountValue;
    readonly totalCartsAbandoned: CountValue;
    readonly totalCartsCompleted: CountValue;
    readonly abandonmentRate: PercentageValue;
    readonly completionRate: PercentageValue;
    readonly averageAbandonmentValue: MonetaryValue;
    readonly totalAbandonmentValue: MonetaryValue;
  };
  /** Abandonment by stage */
  readonly byStage: readonly {
    readonly stage: CartAbandonmentStage;
    readonly abandonmentCount: CountValue;
    readonly abandonmentRate: PercentageValue;
    readonly averageCartValue: MonetaryValue;
  }[];
  /** Abandonment trends */
  readonly trends: {
    readonly abandonmentRateTrend: TimeSeries;
    readonly averageValueTrend: TimeSeries;
    readonly recoveryRateTrend: TimeSeries;
  };
  /** Comparison with previous period */
  readonly periodComparison: {
    readonly abandonmentRate: MetricChange;
    readonly averageValue: MetricChange;
    readonly recoveryRate: MetricChange;
  };
}

/**
 * Cart abandonment insights and analysis
 */
export interface CartAbandonmentInsights {
  /** Top abandonment reasons */
  readonly topReasons: readonly {
    readonly reason: CartAbandonmentReason;
    readonly frequency: CountValue;
    readonly percentage: PercentageValue;
    readonly averageCartValue: MonetaryValue;
    readonly potentialRevenueLoss: MonetaryValue;
  }[];
  /** High-value abandonments */
  readonly highValueAbandonments: readonly {
    readonly cartValue: MonetaryValue;
    readonly abandonmentCount: CountValue;
    readonly percentageOfTotal: PercentageValue;
    readonly recoveryOpportunity: MonetaryValue;
  }[];
  /** Device and channel analysis */
  readonly deviceChannelAnalysis: readonly {
    readonly dimension: 'device_type' | 'browser' | 'traffic_source';
    readonly value: string;
    readonly abandonmentRate: PercentageValue;
    readonly cartCount: CountValue;
    readonly averageValue: MonetaryValue;
  }[];
  /** Time-based patterns */
  readonly timePatterns: {
    readonly hourlyPattern: readonly {
      readonly hour: CountValue;
      readonly abandonmentRate: PercentageValue;
    }[];
    readonly dailyPattern: readonly {
      readonly dayOfWeek: string;
      readonly abandonmentRate: PercentageValue;
    }[];
    readonly monthlyPattern: readonly {
      readonly month: string;
      readonly abandonmentRate: PercentageValue;
    }[];
  };
  /** Recovery campaign effectiveness */
  readonly recoveryEffectiveness: readonly {
    readonly campaignId: CampaignId;
    readonly campaignName: string;
    readonly recoveryRate: PercentageValue;
    readonly roi: PercentageValue;
    readonly revenueRecovered: MonetaryValue;
  }[];
  /** Optimization recommendations */
  readonly optimizationRecommendations: readonly {
    readonly category: 'checkout_process' | 'pricing' | 'shipping' | 'technical' | 'content' | 'recovery_campaigns';
    readonly recommendation: string;
    readonly priority: 'high' | 'medium' | 'low';
    readonly estimatedImpact: PercentageValue;
    readonly effort: 'low' | 'medium' | 'high';
    readonly timeframe: string;
  }[];
}

// =============================================================================
// EXPORT TYPES FOR API INTERFACES
// =============================================================================

/**
 * Comprehensive cart abandonment export for API usage
 */
export type CartAbandonmentTypes = DeepReadonly<{
  AbandonmentTriggerEvent;
  CartAbandonmentStage;
  CartAbandonmentReason;
  CartRecoveryStatus;
  CartAbandonmentEvent;
  CartRecoveryCampaign;
  CartAbandonmentRateMetrics;
  CartAbandonmentInsights;
  CartRecoveryPerformanceMetrics;
}>;
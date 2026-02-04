/**
 * @file funnel.types.ts
 * @description Conversion funnel tracking and analytics type definitions
 * @module BusinessIntelligence/Types
 * 
 * This file contains comprehensive type definitions for conversion funnel
 * tracking, step analysis, drop-off detection, and funnel optimization.
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
  EventId,
  FunnelId,
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
} from './core.types';

// =============================================================================
// FUNNEL DEFINITION TYPES
// =============================================================================

/**
 * Funnel step type enumeration
 */
export enum FunnelStepType {
  /** Page view event */
  PAGE_VIEW = 'page_view',
  /** Product view event */
  PRODUCT_VIEW = 'product_view',
  /** Category view event */
  CATEGORY_VIEW = 'category_view',
  /** Add to cart event */
  ADD_TO_CART = 'add_to_cart',
  /** Cart view event */
  CART_VIEW = 'cart_view',
  /** Checkout initiation */
  CHECKOUT_START = 'checkout_start',
  /** Payment information entry */
  PAYMENT_INFO = 'payment_info',
  /** Order completion */
  PURCHASE = 'purchase',
  /** Custom event */
  CUSTOM_EVENT = 'custom_event',
}

/**
 * Funnel step definition
 */
export interface FunnelStepDefinition {
  /** Step unique identifier */
  readonly stepId: string;
  /** Step name for display */
  readonly stepName: string;
  /** Step type */
  readonly stepType: FunnelStepType;
  /** Step order in the funnel (1-based) */
  readonly stepOrder: CountValue;
  /** Step description */
  readonly description?: string;
  /** Event matching criteria */
  readonly eventCriteria: FunnelEventCriteria;
  /** Whether this step is required for funnel completion */
  readonly isRequired: boolean;
  /** Time window for completing this step (in minutes) */
  readonly timeWindow?: CountValue;
  /** Goal value for this step */
  readonly goalValue?: MonetaryValue;
  /** Step metadata for tracking */
  readonly metadata: Record<string, unknown>;
}

/**
 * Event criteria for funnel step matching
 */
export interface FunnelEventCriteria {
  /** Event type to match */
  readonly eventType: string;
  /** URL pattern matching (for page views) */
  readonly urlPattern?: string;
  /** Product ID criteria */
  readonly productId?: ProductId | ProductId[];
  /** Category ID criteria */
  readonly categoryId?: CategoryId | CategoryId[];
  /** Custom property filters */
  readonly propertyFilters?: Record<string, unknown>;
  /** Exclusion criteria */
  readonly exclusions?: {
    readonly urls?: string[];
    readonly userAgents?: string[];
    readonly ipAddresses?: string[];
  };
}

/**
 * Complete funnel definition
 */
export interface FunnelDefinition {
  /** Funnel unique identifier */
  readonly funnelId: FunnelId;
  /** Funnel name */
  readonly name: string;
  /** Funnel description */
  readonly description: string;
  /** Funnel category */
  readonly category: 'e-commerce' | 'lead_generation' | 'engagement' | 'retention' | 'custom';
  /** Ordered list of funnel steps */
  readonly steps: readonly FunnelStepDefinition[];
  /** Funnel attribution window in hours */
  readonly attributionWindow: CountValue;
  /** Whether to track partial conversions */
  readonly trackPartialConversions: boolean;
  /** Session timeout for funnel in minutes */
  readonly sessionTimeout: CountValue;
  /** Funnel owner/creator */
  readonly owner: string;
  /** Creation date */
  readonly createdAt: Date;
  /** Last modification date */
  readonly updatedAt: Date;
  /** Whether funnel is active */
  readonly isActive: boolean;
}

// =============================================================================
// FUNNEL TRACKING TYPES
// =============================================================================

/**
 * Funnel session tracking
 */
export interface FunnelSession {
  /** Session unique identifier */
  readonly sessionId: SessionId;
  /** Funnel being tracked */
  readonly funnelId: FunnelId;
  /** User ID (if authenticated) */
  readonly userId?: UserId;
  /** Session context information */
  readonly sessionContext: SessionContext;
  /** Session start time */
  readonly startTime: Date;
  /** Last activity time */
  readonly lastActivity: Date;
  /** Current step in funnel */
  readonly currentStep: CountValue;
  /** Completed steps */
  readonly completedSteps: readonly CountValue[];
  /** Whether funnel was completed */
  readonly isCompleted: boolean;
  /** Completion time (if completed) */
  readonly completionTime?: Date;
  /** Session value (revenue attributed) */
  readonly sessionValue: MonetaryValue;
  /** UTM parameters for attribution */
  readonly utmParams?: UtmParameters;
  /** Device and browser information */
  readonly deviceInfo: {
    readonly userAgent: string;
    readonly deviceType: 'desktop' | 'tablet' | 'mobile';
    readonly browser: string;
    readonly os: string;
  };
}

/**
 * Funnel step event tracking
 */
export interface FunnelStepEvent {
  /** Event unique identifier */
  readonly eventId: EventId;
  /** Session this event belongs to */
  readonly sessionId: SessionId;
  /** Funnel step this event represents */
  readonly stepId: string;
  /** Funnel identifier */
  readonly funnelId: FunnelId;
  /** User ID (if authenticated) */
  readonly userId?: UserId;
  /** Event timestamp */
  readonly timestamp: Date;
  /** Step order that was completed */
  readonly stepOrder: CountValue;
  /** Time since previous step (in seconds) */
  readonly timeSincePrevious?: CountValue;
  /** Time since funnel start (in seconds) */
  readonly timeSinceStart: CountValue;
  /** Event value (monetary) */
  readonly eventValue?: MonetaryValue;
  /** Product associated with step */
  readonly productId?: ProductId;
  /** Category associated with step */
  readonly categoryId?: CategoryId;
  /** Additional event properties */
  readonly properties: Record<string, unknown>;
  /** Event source URL */
  readonly sourceUrl?: string;
  /** Referrer URL */
  readonly referrer?: string;
}

/**
 * Funnel completion tracking
 */
export interface FunnelCompletion {
  /** Completion unique identifier */
  readonly completionId: string;
  /** Session that completed the funnel */
  readonly sessionId: SessionId;
  /** Funnel that was completed */
  readonly funnelId: FunnelId;
  /** User who completed the funnel */
  readonly userId?: UserId;
  /** Completion timestamp */
  readonly completedAt: Date;
  /** Total time to complete (in seconds) */
  readonly completionTime: CountValue;
  /** All step events in order */
  readonly stepEvents: readonly FunnelStepEvent[];
  /** Total conversion value */
  readonly conversionValue: MonetaryValue;
  /** Order ID (if applicable) */
  readonly orderId?: OrderId;
  /** Attribution information */
  readonly attribution: FunnelAttribution;
  /** Completion metadata */
  readonly metadata: Record<string, unknown>;
}

/**
 * Funnel attribution data
 */
export interface FunnelAttribution {
  /** First touch attribution */
  readonly firstTouch: {
    readonly source: string;
    readonly medium: string;
    readonly campaign?: string;
    readonly timestamp: Date;
  };
  /** Last touch attribution */
  readonly lastTouch: {
    readonly source: string;
    readonly medium: string;
    readonly campaign?: string;
    readonly timestamp: Date;
  };
  /** Multi-touch attribution weights */
  readonly multiTouch: readonly {
    readonly source: string;
    readonly medium: string;
    readonly campaign?: string;
    readonly weight: RateValue;
    readonly touchpointOrder: CountValue;
  }[];
  /** Total touchpoints in journey */
  readonly touchpointCount: CountValue;
}

// =============================================================================
// FUNNEL ANALYTICS TYPES
// =============================================================================

/**
 * Funnel step performance metrics
 */
export interface FunnelStepMetrics {
  /** Step definition */
  readonly step: FunnelStepDefinition;
  /** Number of users who reached this step */
  readonly enteredCount: CountValue;
  /** Number of users who completed this step */
  readonly completedCount: CountValue;
  /** Number of users who dropped off at this step */
  readonly droppedOffCount: CountValue;
  /** Conversion rate from previous step */
  readonly conversionRate: PercentageValue;
  /** Drop-off rate at this step */
  readonly dropOffRate: PercentageValue;
  /** Average time spent on this step (seconds) */
  readonly averageTimeOnStep: CountValue;
  /** Median time spent on this step (seconds) */
  readonly medianTimeOnStep: CountValue;
  /** Revenue generated at this step */
  readonly revenueGenerated: MonetaryValue;
  /** Average value per completion */
  readonly averageValue: MonetaryValue;
  /** Bounce rate (immediate exit after this step) */
  readonly bounceRate: PercentageValue;
}

/**
 * Complete funnel analytics data
 */
export interface FunnelAnalytics {
  /** Funnel definition */
  readonly funnel: FunnelDefinition;
  /** Analysis period */
  readonly analysisPeriod: BIDateRange;
  /** Overall funnel metrics */
  readonly overallMetrics: {
    /** Total sessions that entered the funnel */
    readonly totalSessions: CountValue;
    /** Total unique users in funnel */
    readonly uniqueUsers: CountValue;
    /** Total completed conversions */
    readonly conversions: CountValue;
    /** Overall conversion rate */
    readonly conversionRate: PercentageValue;
    /** Total revenue from funnel */
    readonly totalRevenue: MonetaryValue;
    /** Average order value */
    readonly averageOrderValue: MonetaryValue;
    /** Average time to convert (seconds) */
    readonly averageTimeToConvert: CountValue;
  };
  /** Step-by-step metrics */
  readonly stepMetrics: readonly FunnelStepMetrics[];
  /** Time-based conversion trends */
  readonly conversionTrends: TimeSeries;
  /** Drop-off analysis */
  readonly dropOffAnalysis: FunnelDropOffAnalysis;
  /** Segment performance comparison */
  readonly segmentAnalysis: readonly FunnelSegmentAnalysis[];
  /** Device and channel performance */
  readonly channelAnalysis: readonly FunnelChannelAnalysis[];
}

/**
 * Drop-off analysis for funnel optimization
 */
export interface FunnelDropOffAnalysis {
  /** Steps with highest drop-off rates */
  readonly highestDropOffSteps: readonly {
    readonly stepId: string;
    readonly stepName: string;
    readonly dropOffRate: PercentageValue;
    readonly affectedUsers: CountValue;
    readonly potentialRevenueLoss: MonetaryValue;
  }[];
  /** Common drop-off patterns */
  readonly dropOffPatterns: readonly {
    readonly pattern: string;
    readonly frequency: CountValue;
    readonly impactScore: ScoreValue;
    readonly description: string;
  }[];
  /** Optimization recommendations */
  readonly recommendations: readonly {
    readonly stepId: string;
    readonly issue: string;
    readonly recommendation: string;
    readonly priority: 'high' | 'medium' | 'low';
    readonly estimatedImpact: PercentageValue;
    readonly effort: 'low' | 'medium' | 'high';
  }[];
}

/**
 * Funnel performance by customer segment
 */
export interface FunnelSegmentAnalysis {
  /** Segment identifier */
  readonly segmentId: string;
  /** Segment name */
  readonly segmentName: string;
  /** Segment size */
  readonly segmentSize: CountValue;
  /** Conversion rate for this segment */
  readonly conversionRate: PercentageValue;
  /** Average order value for this segment */
  readonly averageOrderValue: MonetaryValue;
  /** Time to convert for this segment */
  readonly averageTimeToConvert: CountValue;
  /** Top drop-off step for this segment */
  readonly topDropOffStep: {
    readonly stepId: string;
    readonly dropOffRate: PercentageValue;
  };
  /** Segment-specific insights */
  readonly insights: readonly string[];
}

/**
 * Funnel performance by channel/device
 */
export interface FunnelChannelAnalysis {
  /** Channel identifier */
  readonly channelId: string;
  /** Channel name */
  readonly channelName: string;
  /** Channel type */
  readonly channelType: 'organic_search' | 'paid_search' | 'email' | 'social' | 'direct' | 'referral' | 'display' | 'other';
  /** Sessions from this channel */
  readonly sessionCount: CountValue;
  /** Conversion rate for this channel */
  readonly conversionRate: PercentageValue;
  /** Cost per acquisition (if available) */
  readonly costPerAcquisition?: MonetaryValue;
  /** Return on ad spend (if applicable) */
  readonly returnOnAdSpend?: RateValue;
  /** Device breakdown */
  readonly deviceBreakdown: readonly {
    readonly deviceType: 'desktop' | 'tablet' | 'mobile';
    readonly sessionCount: CountValue;
    readonly conversionRate: PercentageValue;
  }[];
}

// =============================================================================
// FUNNEL COMPARISON AND TESTING TYPES
// =============================================================================

/**
 * Funnel A/B testing configuration
 */
export interface FunnelABTest {
  /** Test unique identifier */
  readonly testId: string;
  /** Test name */
  readonly testName: string;
  /** Original funnel (control) */
  readonly controlFunnel: FunnelDefinition;
  /** Variant funnels */
  readonly variantFunnels: readonly FunnelDefinition[];
  /** Traffic allocation */
  readonly trafficAllocation: readonly {
    readonly funnelId: FunnelId;
    readonly percentage: PercentageValue;
  }[];
  /** Test start date */
  readonly startDate: Date;
  /** Test end date */
  readonly endDate?: Date;
  /** Statistical significance threshold */
  readonly significanceThreshold: PercentageValue;
  /** Test status */
  readonly status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled';
  /** Test results */
  readonly results?: FunnelABTestResults;
}

/**
 * A/B test results for funnels
 */
export interface FunnelABTestResults {
  /** Test performance summary */
  readonly testSummary: {
    readonly totalSessions: CountValue;
    readonly testDuration: CountValue;
    readonly winningVariant: FunnelId | null;
    readonly confidenceLevel: PercentageValue;
    readonly isSignificant: boolean;
  };
  /** Performance by variant */
  readonly variantPerformance: readonly {
    readonly funnelId: FunnelId;
    readonly funnelName: string;
    readonly sessionCount: CountValue;
    readonly conversionRate: PercentageValue;
    readonly averageOrderValue: MonetaryValue;
    readonly totalRevenue: MonetaryValue;
    readonly statisticalSignificance: PercentageValue;
  }[];
  /** Detailed comparison metrics */
  readonly comparisonMetrics: readonly {
    readonly metric: string;
    readonly controlValue: number;
    readonly variantValues: readonly number[];
    readonly percentageChanges: readonly PercentageValue[];
    readonly isSignificant: readonly boolean[];
  }[];
}

/**
 * Funnel comparison analysis
 */
export interface FunnelComparison {
  /** Funnel being compared */
  readonly funnels: readonly FunnelDefinition[];
  /** Comparison period */
  readonly comparisonPeriod: BIDateRange;
  /** Metric comparisons */
  readonly metricComparisons: readonly {
    readonly metricName: string;
    readonly values: readonly {
      readonly funnelId: FunnelId;
      readonly funnelName: string;
      readonly value: number;
      readonly rank: CountValue;
    }[];
  }[];
  /** Best performing funnel by metric */
  readonly topPerformers: readonly {
    readonly metric: string;
    readonly funnelId: FunnelId;
    readonly funnelName: string;
    readonly value: number;
  }[];
  /** Insights from comparison */
  readonly insights: readonly {
    readonly insight: string;
    readonly affectedFunnels: readonly FunnelId[];
    readonly impact: 'positive' | 'negative' | 'neutral';
    readonly recommendation?: string;
  }[];
}

// =============================================================================
// EXPORT TYPES FOR API INTERFACES
// =============================================================================

/**
 * Comprehensive funnel export for API usage
 */
export type FunnelTypes = DeepReadonly<{
  FunnelStepType;
  FunnelStepDefinition;
  FunnelDefinition;
  FunnelSession;
  FunnelStepEvent;
  FunnelCompletion;
  FunnelAnalytics;
  FunnelDropOffAnalysis;
  FunnelABTest;
  FunnelComparison;
}>;
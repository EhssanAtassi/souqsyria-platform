/**
 * @file funnel.interface.ts
 * @description Conversion funnel analytics data interfaces.
 *              Defines types for multi-stage funnel tracking, drop-off analysis, and A/B testing.
 * @module AdminAnalytics/Interfaces
 */

/**
 * Funnel stage names
 * @description Standard e-commerce conversion funnel stages
 */
export type FunnelStage =
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'CART_VIEW'
  | 'CHECKOUT_INITIATED'
  | 'SHIPPING_INFO'
  | 'PAYMENT_INFO'
  | 'ORDER_PLACED';

/**
 * Device category for funnel tracking
 */
export type DeviceCategory = 'mobile' | 'tablet' | 'desktop';

/**
 * Traffic source/channel
 */
export type TrafficSource = 'organic' | 'social' | 'direct' | 'referral' | 'paid' | 'email';

/**
 * Conversion Funnel Summary
 * @description Overall funnel performance metrics
 *
 * @swagger
 * components:
 *   schemas:
 *     ConversionFunnelSummary:
 *       type: object
 *       required:
 *         - totalSessions
 *         - conversions
 *         - conversionRate
 *         - stages
 */
export interface ConversionFunnelSummary {
  /** Total sessions entered funnel */
  totalSessions: number;

  /** Total successful conversions (orders) */
  conversions: number;

  /** Overall conversion rate (%) */
  conversionRate: number;

  /** Revenue generated from conversions (SYP) */
  totalRevenue: number;

  /** Average order value (SYP) */
  averageOrderValue: number;

  /** Stage-by-stage breakdown */
  stages: FunnelStageMetrics[];

  /** Total drop-offs across all stages */
  totalDropOffs: number;

  /** Average time to conversion (minutes) */
  averageTimeToConversion: number;

  /** Date range for this funnel data */
  dateRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Funnel Stage Metrics
 * @description Performance metrics for a single funnel stage
 *
 * @swagger
 * components:
 *   schemas:
 *     FunnelStageMetrics:
 *       type: object
 *       required:
 *         - stage
 *         - sessions
 *         - dropOffs
 *         - dropOffRate
 */
export interface FunnelStageMetrics {
  /** Funnel stage identifier */
  stage: FunnelStage;

  /** Display name for stage */
  displayName: string;

  /** Sessions reaching this stage */
  sessions: number;

  /** Sessions advancing to next stage */
  completions: number;

  /** Sessions dropping off at this stage */
  dropOffs: number;

  /** Drop-off rate as percentage */
  dropOffRate: number;

  /** Conversion rate from this stage to end */
  conversionRate: number;

  /** Average time spent in this stage (seconds) */
  averageTimeInStage: number;

  /** Percentage of original sessions */
  percentageOfOriginal: number;

  /** Stage order (1-based) */
  order: number;
}

/**
 * Device Performance Comparison
 * @description Funnel performance breakdown by device type
 */
export interface DevicePerformance {
  /** Device category */
  device: DeviceCategory;

  /** Total sessions from this device */
  sessions: number;

  /** Conversions from this device */
  conversions: number;

  /** Device-specific conversion rate (%) */
  conversionRate: number;

  /** Revenue from this device (SYP) */
  revenue: number;

  /** Average time to convert (minutes) */
  averageTimeToConversion: number;

  /** Most problematic stage for this device */
  worstPerformingStage?: FunnelStage;

  /** Drop-off rate at worst stage (%) */
  worstStageDropOffRate?: number;
}

/**
 * Traffic Source Performance
 * @description Funnel performance by traffic source/channel
 */
export interface SourcePerformance {
  /** Traffic source */
  source: TrafficSource;

  /** Sessions from this source */
  sessions: number;

  /** Conversions */
  conversions: number;

  /** Conversion rate (%) */
  conversionRate: number;

  /** Revenue generated (SYP) */
  revenue: number;

  /** Cost per acquisition (if paid) */
  costPerAcquisition?: number;

  /** Return on ad spend (if paid) */
  returnOnAdSpend?: number;
}

/**
 * Funnel Session Detail
 * @description Detailed journey of a single user session through funnel
 */
export interface FunnelSessionDetail {
  /** Unique session ID */
  sessionId: string;

  /** Customer ID (if authenticated) */
  customerId?: number;

  /** Device used */
  device: DeviceCategory;

  /** Traffic source */
  source: TrafficSource;

  /** Session start time */
  startedAt: Date;

  /** Session end/abandon time */
  endedAt?: Date;

  /** Whether session converted */
  converted: boolean;

  /** Final stage reached */
  finalStage: FunnelStage;

  /** Order ID if converted */
  orderId?: number;

  /** Revenue if converted (SYP) */
  revenue?: number;

  /** Stage progression timeline */
  stageProgression: StageProgressionEntry[];

  /** Total time in funnel (seconds) */
  totalDuration: number;

  /** Location (city) */
  location?: string;
}

/**
 * Stage Progression Entry
 * @description Single stage in a session's funnel journey
 */
export interface StageProgressionEntry {
  /** Stage name */
  stage: FunnelStage;

  /** Time entered stage */
  enteredAt: Date;

  /** Time exited stage (null if abandoned) */
  exitedAt?: Date;

  /** Time spent in stage (seconds) */
  duration?: number;

  /** Whether user progressed to next stage */
  completed: boolean;
}

/**
 * Drop-off Analysis
 * @description Detailed analysis of why users drop off
 */
export interface DropOffAnalysis {
  /** Funnel stage */
  stage: FunnelStage;

  /** Total drop-offs at this stage */
  totalDropOffs: number;

  /** Drop-off rate (%) */
  dropOffRate: number;

  /** Common reasons for drop-off */
  reasons: DropOffReason[];

  /** Average time before drop-off (seconds) */
  averageTimeBeforeDropOff: number;

  /** Percentage returning later */
  returnRate?: number;
}

/**
 * Drop-off Reason
 * @description Categorized reason for funnel abandonment
 */
export interface DropOffReason {
  /** Reason category */
  reason: string;

  /** Number of occurrences */
  count: number;

  /** Percentage of total drop-offs */
  percentage: number;

  /** Suggested remediation */
  suggestion?: string;
}

/**
 * A/B Test Variant Performance
 * @description Performance comparison for funnel A/B testing
 */
export interface ABTestVariant {
  /** Variant identifier */
  variantId: string;

  /** Variant name */
  variantName: string;

  /** Is this the control group */
  isControl: boolean;

  /** Sessions in this variant */
  sessions: number;

  /** Conversions */
  conversions: number;

  /** Conversion rate (%) */
  conversionRate: number;

  /** Revenue (SYP) */
  revenue: number;

  /** Statistical significance (p-value) */
  pValue?: number;

  /** Confidence level (%) */
  confidenceLevel?: number;

  /** Improvement vs control (%) */
  improvement?: number;
}

/**
 * Time to Conversion Distribution
 * @description Histogram data for conversion time analysis
 */
export interface TimeToConversionBucket {
  /** Time bucket label (e.g., "0-5 min", "5-15 min") */
  label: string;

  /** Minimum time in bucket (minutes) */
  minTime: number;

  /** Maximum time in bucket (minutes) */
  maxTime: number;

  /** Number of conversions in this bucket */
  count: number;

  /** Percentage of total conversions */
  percentage: number;

  /** Cumulative percentage */
  cumulativePercentage: number;
}

/**
 * Funnel Filter Options
 * @description Query parameters for filtering funnel analytics
 */
export interface FunnelFilterOptions {
  /** Start date for analysis */
  startDate?: Date;

  /** End date for analysis */
  endDate?: Date;

  /** Filter by device types */
  devices?: DeviceCategory[];

  /** Filter by traffic sources */
  sources?: TrafficSource[];

  /** Filter by location */
  location?: string;

  /** Include only converted sessions */
  convertedOnly?: boolean;

  /** A/B test variant ID */
  variantId?: string;

  /** Group results by */
  groupBy?: 'day' | 'week' | 'month' | 'device' | 'source';
}

/**
 * Funnel Optimization Suggestion
 * @description AI-generated recommendation for funnel improvement
 */
export interface FunnelOptimizationSuggestion {
  /** Suggestion ID */
  id: string;

  /** Priority level */
  priority: 'high' | 'medium' | 'low';

  /** Target stage */
  stage: FunnelStage;

  /** Issue description */
  issue: string;

  /** Recommended action */
  recommendation: string;

  /** Estimated impact (% improvement) */
  estimatedImpact: number;

  /** Implementation difficulty */
  difficulty: 'easy' | 'medium' | 'hard';

  /** Potential revenue uplift (SYP) */
  potentialRevenue?: number;
}

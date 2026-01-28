/**
 * @file clv.types.ts
 * @description Customer Lifetime Value (CLV) type definitions
 * @module BusinessIntelligence/Types
 * 
 * This file contains comprehensive type definitions for Customer Lifetime Value
 * calculations, customer segmentation, and CLV prediction models.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import {
  UserId,
  MonetaryValue,
  PercentageValue,
  RateValue,
  CountValue,
  ScoreValue,
  BIDateRange,
  ComparisonPeriod,
  MetricChange,
  TimeSeries,
  CustomerSegmentId,
  DeepReadonly,
  CustomerDemographics,
} from './core.types';

// =============================================================================
// CLV CALCULATION TYPES
// =============================================================================

/**
 * CLV calculation method enumeration
 */
export enum CLVCalculationMethod {
  /** Historical CLV based on past purchase data */
  HISTORICAL = 'historical',
  /** Predictive CLV using machine learning models */
  PREDICTIVE = 'predictive',
  /** Traditional CLV formula (AOV × Purchase Frequency × Gross Margin × Lifespan) */
  TRADITIONAL = 'traditional',
  /** Cohort-based CLV calculation */
  COHORT_BASED = 'cohort_based',
}

/**
 * CLV calculation parameters
 */
export interface CLVCalculationParameters {
  /** Calculation method to use */
  readonly method: CLVCalculationMethod;
  /** Time period for calculation */
  readonly calculationPeriod: BIDateRange;
  /** Discount rate for future cash flows (for predictive CLV) */
  readonly discountRate?: RateValue;
  /** Confidence level for predictions (0.8, 0.9, 0.95, etc.) */
  readonly confidenceLevel?: RateValue;
  /** Whether to include gross margin in calculations */
  readonly includeGrossMargin: boolean;
  /** Custom gross margin override */
  readonly grossMarginOverride?: PercentageValue;
}

/**
 * Individual customer CLV metrics
 */
export interface CustomerCLVMetrics {
  /** Customer unique identifier */
  readonly customerId: UserId;
  /** Calculated CLV value */
  readonly clvValue: MonetaryValue;
  /** Average order value */
  readonly averageOrderValue: MonetaryValue;
  /** Purchase frequency (orders per period) */
  readonly purchaseFrequency: CountValue;
  /** Customer lifespan in days */
  readonly customerLifespan: CountValue;
  /** Gross margin percentage */
  readonly grossMargin: PercentageValue;
  /** Total revenue from customer */
  readonly totalRevenue: MonetaryValue;
  /** Total orders placed */
  readonly totalOrders: CountValue;
  /** First purchase date */
  readonly firstPurchaseDate: Date;
  /** Last purchase date */
  readonly lastPurchaseDate: Date;
  /** Churn probability (0-1) */
  readonly churnProbability: RateValue;
  /** CLV confidence score */
  readonly confidenceScore: ScoreValue;
  /** Calculation metadata */
  readonly calculationMetadata: CLVCalculationMetadata;
}

/**
 * CLV calculation metadata
 */
export interface CLVCalculationMetadata {
  /** Calculation method used */
  readonly method: CLVCalculationMethod;
  /** Calculation date */
  readonly calculatedAt: Date;
  /** Data quality score (0-100) */
  readonly dataQualityScore: ScoreValue;
  /** Number of data points used */
  readonly dataPointsUsed: CountValue;
  /** Model version (for predictive CLV) */
  readonly modelVersion?: string;
  /** Calculation parameters */
  readonly parameters: CLVCalculationParameters;
}

// =============================================================================
// CLV SEGMENTATION TYPES
// =============================================================================

/**
 * Customer value segment enumeration
 */
export enum CustomerValueSegment {
  /** High-value customers (top 10%) */
  CHAMPIONS = 'champions',
  /** High-value, low-frequency customers */
  LOYAL_CUSTOMERS = 'loyal_customers',
  /** High-value, recent customers */
  POTENTIAL_LOYALISTS = 'potential_loyalists',
  /** Recent customers with good CLV potential */
  NEW_CUSTOMERS = 'new_customers',
  /** Promising customers who haven't purchased recently */
  PROMISING = 'promising',
  /** Customers who need attention to prevent churn */
  CUSTOMERS_NEEDING_ATTENTION = 'customers_needing_attention',
  /** Customers about to churn */
  ABOUT_TO_SLEEP = 'about_to_sleep',
  /** At risk of churning customers */
  AT_RISK = 'at_risk',
  /** Customers who can't be reactivated */
  CANNOT_LOSE_THEM = 'cannot_lose_them',
  /** Customers who have been inactive for long periods */
  HIBERNATING = 'hibernating',
  /** Lost customers who were once high-value */
  LOST = 'lost',
}

/**
 * CLV segment definition
 */
export interface CLVSegmentDefinition {
  /** Segment identifier */
  readonly segmentId: CustomerSegmentId;
  /** Segment name */
  readonly name: string;
  /** Segment description */
  readonly description: string;
  /** Segment classification */
  readonly segment: CustomerValueSegment;
  /** Minimum CLV threshold */
  readonly minCLVThreshold?: MonetaryValue;
  /** Maximum CLV threshold */
  readonly maxCLVThreshold?: MonetaryValue;
  /** Recency criteria (days since last purchase) */
  readonly recencyCriteria?: {
    readonly min?: CountValue;
    readonly max?: CountValue;
  };
  /** Frequency criteria (orders per period) */
  readonly frequencyCriteria?: {
    readonly min?: CountValue;
    readonly max?: CountValue;
  };
  /** Monetary criteria (total spent) */
  readonly monetaryCriteria?: {
    readonly min?: MonetaryValue;
    readonly max?: MonetaryValue;
  };
  /** Color for UI display */
  readonly displayColor: string;
  /** Icon for UI display */
  readonly displayIcon?: string;
}

/**
 * Customer segment assignment
 */
export interface CustomerSegmentAssignment {
  /** Customer unique identifier */
  readonly customerId: UserId;
  /** Assigned segment */
  readonly segment: CustomerValueSegment;
  /** Segment definition reference */
  readonly segmentDefinition: CLVSegmentDefinition;
  /** Assignment confidence score */
  readonly confidence: ScoreValue;
  /** Assignment date */
  readonly assignedAt: Date;
  /** Expiry date for segment assignment */
  readonly expiresAt: Date;
  /** Previous segment (if any) */
  readonly previousSegment?: CustomerValueSegment;
  /** Days since segment change */
  readonly daysSinceChange?: CountValue;
}

// =============================================================================
// CLV PREDICTION TYPES
// =============================================================================

/**
 * CLV prediction model type
 */
export enum CLVPredictionModel {
  /** Buy Till You Die (BTYD) model */
  BTYD = 'btyd',
  /** Pareto/NBD model */
  PARETO_NBD = 'pareto_nbd',
  /** BG/NBD model */
  BG_NBD = 'bg_nbd',
  /** Gamma-Gamma model for monetary value */
  GAMMA_GAMMA = 'gamma_gamma',
  /** Machine learning regression model */
  ML_REGRESSION = 'ml_regression',
  /** Neural network model */
  NEURAL_NETWORK = 'neural_network',
  /** Ensemble model combining multiple approaches */
  ENSEMBLE = 'ensemble',
}

/**
 * CLV prediction result
 */
export interface CLVPredictionResult {
  /** Customer unique identifier */
  readonly customerId: UserId;
  /** Predicted CLV value */
  readonly predictedCLV: MonetaryValue;
  /** Prediction confidence interval */
  readonly confidenceInterval: {
    readonly lower: MonetaryValue;
    readonly upper: MonetaryValue;
    readonly level: PercentageValue;
  };
  /** Prediction horizon in days */
  readonly predictionHorizon: CountValue;
  /** Model used for prediction */
  readonly model: CLVPredictionModel;
  /** Feature importance (for ML models) */
  readonly featureImportance?: Record<string, number>;
  /** Prediction date */
  readonly predictedAt: Date;
  /** Model accuracy metrics */
  readonly accuracyMetrics: CLVModelAccuracyMetrics;
}

/**
 * CLV model accuracy metrics
 */
export interface CLVModelAccuracyMetrics {
  /** Mean Absolute Error */
  readonly mae: number;
  /** Root Mean Square Error */
  readonly rmse: number;
  /** R-squared score */
  readonly rSquared: number;
  /** Mean Absolute Percentage Error */
  readonly mape: PercentageValue;
}

/**
 * CLV prediction batch result
 */
export interface CLVPredictionBatch {
  /** Batch identifier */
  readonly batchId: string;
  /** Model configuration */
  readonly modelConfig: CLVPredictionModelConfig;
  /** Prediction results */
  readonly predictions: readonly CLVPredictionResult[];
  /** Batch accuracy metrics */
  readonly batchAccuracy: CLVModelAccuracyMetrics;
  /** Processing date */
  readonly processedAt: Date;
  /** Data period used for training */
  readonly trainingPeriod: BIDateRange;
}

/**
 * CLV prediction model configuration
 */
export interface CLVPredictionModelConfig {
  /** Model type */
  readonly modelType: CLVPredictionModel;
  /** Model parameters */
  readonly parameters: Record<string, unknown>;
  /** Training data filters */
  readonly trainingFilters: {
    readonly minOrderCount?: CountValue;
    readonly minTotalSpent?: MonetaryValue;
    readonly excludeRefunds?: boolean;
  };
  /** Validation settings */
  readonly validation: {
    readonly method: 'holdout' | 'cross_validation' | 'time_series_split';
    readonly testRatio?: PercentageValue;
    readonly folds?: CountValue;
  };
}

// =============================================================================
// CLV ANALYTICS AND INSIGHTS
// =============================================================================

/**
 * CLV distribution analysis
 */
export interface CLVDistributionAnalysis {
  /** Statistical metrics */
  readonly statistics: {
    readonly mean: MonetaryValue;
    readonly median: MonetaryValue;
    readonly mode: MonetaryValue;
    readonly standardDeviation: number;
    readonly skewness: number;
    readonly kurtosis: number;
  };
  /** Percentile breakdown */
  readonly percentiles: {
    readonly p10: MonetaryValue;
    readonly p25: MonetaryValue;
    readonly p50: MonetaryValue;
    readonly p75: MonetaryValue;
    readonly p90: MonetaryValue;
    readonly p95: MonetaryValue;
    readonly p99: MonetaryValue;
  };
  /** Distribution histogram */
  readonly histogram: readonly {
    readonly binStart: MonetaryValue;
    readonly binEnd: MonetaryValue;
    readonly count: CountValue;
    readonly percentage: PercentageValue;
  }[];
}

/**
 * CLV segment performance metrics
 */
export interface CLVSegmentPerformance {
  /** Segment information */
  readonly segment: CustomerValueSegment;
  /** Customer count in segment */
  readonly customerCount: CountValue;
  /** Percentage of total customers */
  readonly customerPercentage: PercentageValue;
  /** Average CLV in segment */
  readonly averageCLV: MonetaryValue;
  /** Total CLV contribution */
  readonly totalCLV: MonetaryValue;
  /** CLV contribution percentage */
  readonly clvContributionPercentage: PercentageValue;
  /** Revenue contribution */
  readonly revenueContribution: MonetaryValue;
  /** Average order frequency */
  readonly averageOrderFrequency: number;
  /** Average order value */
  readonly averageOrderValue: MonetaryValue;
  /** Churn rate in segment */
  readonly churnRate: PercentageValue;
  /** Segment growth rate */
  readonly growthRate: PercentageValue;
  /** Time series data for segment metrics */
  readonly timeSeries: {
    readonly clvTrend: TimeSeries;
    readonly customerCountTrend: TimeSeries;
    readonly churnRateTrend: TimeSeries;
  };
}

/**
 * CLV insights and recommendations
 */
export interface CLVInsights {
  /** Key performance indicators */
  readonly kpis: {
    readonly averageCLV: MetricChange;
    readonly totalCLV: MetricChange;
    readonly highValueCustomerCount: MetricChange;
    readonly churnRate: MetricChange;
  };
  /** Segment performance comparison */
  readonly segmentPerformance: readonly CLVSegmentPerformance[];
  /** Distribution analysis */
  readonly distribution: CLVDistributionAnalysis;
  /** Trending insights */
  readonly trends: readonly {
    readonly insight: string;
    readonly impact: 'positive' | 'negative' | 'neutral';
    readonly confidence: ScoreValue;
    readonly metric: string;
    readonly changeValue: number;
  }[];
  /** Actionable recommendations */
  readonly recommendations: readonly {
    readonly title: string;
    readonly description: string;
    readonly priority: 'high' | 'medium' | 'low';
    readonly estimatedImpact: MonetaryValue;
    readonly effort: 'low' | 'medium' | 'high';
    readonly timeframe: string;
    readonly targetSegments: readonly CustomerValueSegment[];
  }[];
  /** Analysis metadata */
  readonly analysisMetadata: {
    readonly generatedAt: Date;
    readonly dataPeriod: BIDateRange;
    readonly customerCount: CountValue;
    readonly dataQuality: ScoreValue;
  };
}

// =============================================================================
// CUSTOMER JOURNEY AND LIFECYCLE TYPES
// =============================================================================

/**
 * Customer lifecycle stage
 */
export enum CustomerLifecycleStage {
  PROSPECT = 'prospect',
  FIRST_TIME_BUYER = 'first_time_buyer',
  REPEAT_CUSTOMER = 'repeat_customer',
  LOYAL_CUSTOMER = 'loyal_customer',
  VIP_CUSTOMER = 'vip_customer',
  AT_RISK = 'at_risk',
  CHURNED = 'churned',
  REACTIVATED = 'reactivated',
}

/**
 * Customer lifecycle transition
 */
export interface CustomerLifecycleTransition {
  /** Customer unique identifier */
  readonly customerId: UserId;
  /** Previous lifecycle stage */
  readonly fromStage: CustomerLifecycleStage;
  /** New lifecycle stage */
  readonly toStage: CustomerLifecycleStage;
  /** Transition date */
  readonly transitionDate: Date;
  /** Trigger event for transition */
  readonly trigger: string;
  /** CLV impact of transition */
  readonly clvImpact: MonetaryValue;
  /** Transition probability score */
  readonly transitionProbability: RateValue;
}

/**
 * Customer journey touchpoint
 */
export interface CustomerJourneyTouchpoint {
  /** Touchpoint unique identifier */
  readonly touchpointId: string;
  /** Customer unique identifier */
  readonly customerId: UserId;
  /** Touchpoint type */
  readonly type: 'email' | 'website' | 'mobile_app' | 'phone' | 'store' | 'social_media' | 'advertisement';
  /** Touchpoint category */
  readonly category: 'awareness' | 'consideration' | 'purchase' | 'retention' | 'advocacy';
  /** Interaction date */
  readonly interactionDate: Date;
  /** Channel details */
  readonly channel: string;
  /** Campaign information */
  readonly campaign?: string;
  /** CLV influence score */
  readonly clvInfluence: ScoreValue;
  /** Revenue attribution */
  readonly revenueAttribution: MonetaryValue;
}

// =============================================================================
// EXPORT TYPES FOR API INTERFACES
// =============================================================================

/**
 * Comprehensive CLV export for API usage
 */
export type CLVTypes = DeepReadonly<{
  CLVCalculationMethod;
  CustomerValueSegment;
  CLVPredictionModel;
  CustomerLifecycleStage;
  CLVCalculationParameters;
  CustomerCLVMetrics;
  CLVSegmentDefinition;
  CustomerSegmentAssignment;
  CLVPredictionResult;
  CLVInsights;
  CLVSegmentPerformance;
  CustomerLifecycleTransition;
  CustomerJourneyTouchpoint;
}>;
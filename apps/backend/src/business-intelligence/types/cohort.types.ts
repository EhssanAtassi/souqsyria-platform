/**
 * @file cohort.types.ts
 * @description Cohort analysis and customer retention type definitions
 * @module BusinessIntelligence/Types
 * 
 * This file contains comprehensive type definitions for cohort analysis,
 * customer retention tracking, and behavioral cohort insights.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import {
  UserId,
  ProductId,
  CategoryId,
  CohortId,
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
  CustomerDemographics,
  GeographicLocation,
  UtmParameters,
} from './core.types';

// =============================================================================
// COHORT DEFINITION TYPES
// =============================================================================

/**
 * Cohort type enumeration
 */
export enum CohortType {
  /** Time-based cohorts (by registration/first purchase date) */
  TIME_BASED = 'time_based',
  /** Acquisition channel cohorts */
  ACQUISITION_CHANNEL = 'acquisition_channel',
  /** Behavioral cohorts (based on specific actions) */
  BEHAVIORAL = 'behavioral',
  /** Geographic cohorts */
  GEOGRAPHIC = 'geographic',
  /** Product category cohorts (first purchase category) */
  PRODUCT_CATEGORY = 'product_category',
  /** Demographic cohorts */
  DEMOGRAPHIC = 'demographic',
  /** Revenue-based cohorts */
  REVENUE_BASED = 'revenue_based',
  /** Custom cohorts with user-defined criteria */
  CUSTOM = 'custom',
}

/**
 * Cohort metric type for tracking
 */
export enum CohortMetricType {
  /** Customer retention (active users) */
  RETENTION = 'retention',
  /** Revenue retention */
  REVENUE_RETENTION = 'revenue_retention',
  /** Purchase frequency */
  PURCHASE_FREQUENCY = 'purchase_frequency',
  /** Average order value */
  AVERAGE_ORDER_VALUE = 'average_order_value',
  /** Cumulative revenue per customer */
  CUMULATIVE_REVENUE = 'cumulative_revenue',
  /** Churn rate */
  CHURN_RATE = 'churn_rate',
  /** Reactivation rate */
  REACTIVATION_RATE = 'reactivation_rate',
  /** Net Promoter Score */
  NET_PROMOTER_SCORE = 'net_promoter_score',
}

/**
 * Cohort definition and criteria
 */
export interface CohortDefinition {
  /** Cohort unique identifier */
  readonly cohortId: CohortId;
  /** Cohort name for display */
  readonly name: string;
  /** Cohort description */
  readonly description: string;
  /** Type of cohort */
  readonly type: CohortType;
  /** Cohort creation criteria */
  readonly criteria: CohortCriteria;
  /** Date range for cohort formation */
  readonly formationPeriod: BIDateRange;
  /** Analysis period for tracking */
  readonly analysisPeriod: BIDateRange;
  /** Granularity of analysis */
  readonly granularity: BIPeriodType;
  /** Metrics to track for this cohort */
  readonly trackedMetrics: readonly CohortMetricType[];
  /** Minimum cohort size for statistical significance */
  readonly minCohortSize: CountValue;
  /** Created date */
  readonly createdAt: Date;
  /** Created by user */
  readonly createdBy: string;
  /** Whether cohort is active for analysis */
  readonly isActive: boolean;
}

/**
 * Cohort formation criteria
 */
export interface CohortCriteria {
  /** Time-based criteria */
  readonly timeBased?: {
    readonly groupingPeriod: BIPeriodType;
    readonly eventType: 'registration' | 'first_purchase' | 'first_login' | 'custom';
    readonly customEventName?: string;
  };
  /** Acquisition channel criteria */
  readonly acquisitionChannel?: {
    readonly channels: readonly string[];
    readonly includeUtmParams?: UtmParameters;
    readonly excludeChannels?: readonly string[];
  };
  /** Behavioral criteria */
  readonly behavioral?: {
    readonly requiredActions: readonly {
      readonly action: string;
      readonly minOccurrences: CountValue;
      readonly timeFrame: CountValue; // days
    }[];
    readonly excludedActions?: readonly string[];
  };
  /** Geographic criteria */
  readonly geographic?: {
    readonly includedLocations: readonly GeographicLocation[];
    readonly excludedLocations?: readonly GeographicLocation[];
  };
  /** Product category criteria */
  readonly productCategory?: {
    readonly categoryIds: readonly CategoryId[];
    readonly purchaseRequirement: 'any' | 'all' | 'primary';
  };
  /** Demographic criteria */
  readonly demographic?: Partial<CustomerDemographics>;
  /** Revenue criteria */
  readonly revenueBased?: {
    readonly minFirstOrderValue?: MonetaryValue;
    readonly maxFirstOrderValue?: MonetaryValue;
    readonly revenueRanges?: readonly {
      readonly min: MonetaryValue;
      readonly max: MonetaryValue;
      readonly label: string;
    }[];
  };
  /** Custom criteria with flexible filters */
  readonly custom?: {
    readonly filters: Record<string, unknown>;
    readonly sqlQuery?: string;
    readonly description: string;
  };
}

// =============================================================================
// COHORT MEMBERSHIP TYPES
// =============================================================================

/**
 * Individual cohort member information
 */
export interface CohortMember {
  /** Customer unique identifier */
  readonly customerId: UserId;
  /** Cohort this member belongs to */
  readonly cohortId: CohortId;
  /** Date when customer joined the cohort */
  readonly cohortJoinDate: Date;
  /** Initial cohort assignment period */
  readonly cohortPeriod: string; // e.g., "2024-Q1", "2024-01", "2024-01-15"
  /** Customer's first interaction/event date */
  readonly firstEventDate: Date;
  /** Customer demographics at cohort join */
  readonly demographicsAtJoin: CustomerDemographics;
  /** Acquisition information */
  readonly acquisitionInfo: {
    readonly source: string;
    readonly medium: string;
    readonly campaign?: string;
    readonly utmParams?: UtmParameters;
  };
  /** Initial order information (if applicable) */
  readonly firstOrderInfo?: {
    readonly orderId: number;
    readonly orderValue: MonetaryValue;
    readonly productIds: readonly ProductId[];
    readonly categoryIds: readonly CategoryId[];
  };
  /** Current membership status */
  readonly status: 'active' | 'churned' | 'reactivated' | 'excluded';
  /** Status change history */
  readonly statusHistory: readonly {
    readonly status: 'active' | 'churned' | 'reactivated';
    readonly changedAt: Date;
    readonly reason?: string;
  }[];
}

/**
 * Cohort membership summary
 */
export interface CohortMembershipSummary {
  /** Cohort information */
  readonly cohort: CohortDefinition;
  /** Total members in cohort */
  readonly totalMembers: CountValue;
  /** Active members */
  readonly activeMembers: CountValue;
  /** Churned members */
  readonly churnedMembers: CountValue;
  /** Reactivated members */
  readonly reactivatedMembers: CountValue;
  /** Cohort formation date */
  readonly formationDate: Date;
  /** Days since cohort formation */
  readonly daysSinceFormation: CountValue;
  /** Member composition by demographics */
  readonly demographicBreakdown: readonly {
    readonly dimension: 'age_range' | 'gender' | 'location' | 'acquisition_channel';
    readonly values: readonly {
      readonly value: string;
      readonly count: CountValue;
      readonly percentage: PercentageValue;
    }[];
  }[];
}

// =============================================================================
// COHORT ANALYSIS TYPES
// =============================================================================

/**
 * Cohort retention data point
 */
export interface CohortRetentionDataPoint {
  /** Cohort identifier */
  readonly cohortId: CohortId;
  /** Cohort name */
  readonly cohortName: string;
  /** Cohort period (e.g., "2024-01") */
  readonly cohortPeriod: string;
  /** Initial cohort size */
  readonly initialSize: CountValue;
  /** Retention data by period */
  readonly retentionData: readonly {
    /** Period offset from cohort start (0, 1, 2, ...) */
    readonly periodOffset: CountValue;
    /** Period label (e.g., "Month 0", "Month 1") */
    readonly periodLabel: string;
    /** Number of active customers in this period */
    readonly activeCustomers: CountValue;
    /** Retention rate as percentage */
    readonly retentionRate: PercentageValue;
    /** Revenue generated in this period */
    readonly revenue: MonetaryValue;
    /** Average revenue per customer */
    readonly revenuePerCustomer: MonetaryValue;
    /** Cumulative revenue */
    readonly cumulativeRevenue: MonetaryValue;
    /** Cumulative revenue per customer */
    readonly cumulativeRevenuePerCustomer: MonetaryValue;
  }[];
}

/**
 * Comprehensive cohort analysis
 */
export interface CohortAnalysis {
  /** Analysis metadata */
  readonly analysisMetadata: {
    readonly analysisId: string;
    readonly generatedAt: Date;
    readonly analysisPeriod: BIDateRange;
    readonly totalCohorts: CountValue;
    readonly totalCustomers: CountValue;
  };
  /** Cohort retention matrix */
  readonly retentionMatrix: readonly CohortRetentionDataPoint[];
  /** Average retention rates */
  readonly averageRetention: readonly {
    readonly periodOffset: CountValue;
    readonly periodLabel: string;
    readonly averageRetentionRate: PercentageValue;
    readonly medianRetentionRate: PercentageValue;
    readonly minRetentionRate: PercentageValue;
    readonly maxRetentionRate: PercentageValue;
  }[];
  /** Revenue cohort analysis */
  readonly revenueAnalysis: CohortRevenueAnalysis;
  /** Cohort comparison metrics */
  readonly cohortComparison: readonly {
    readonly metric: CohortMetricType;
    readonly bestPerformingCohort: {
      readonly cohortId: CohortId;
      readonly cohortName: string;
      readonly value: number;
    };
    readonly worstPerformingCohort: {
      readonly cohortId: CohortId;
      readonly cohortName: string;
      readonly value: number;
    };
    readonly average: number;
    readonly median: number;
  }[];
  /** Time-based insights */
  readonly insights: CohortInsights;
}

/**
 * Revenue-focused cohort analysis
 */
export interface CohortRevenueAnalysis {
  /** Revenue retention matrix */
  readonly revenueRetention: readonly {
    readonly cohortId: CohortId;
    readonly cohortPeriod: string;
    readonly initialRevenue: MonetaryValue;
    readonly retentionData: readonly {
      readonly periodOffset: CountValue;
      readonly periodRevenue: MonetaryValue;
      readonly revenueRetentionRate: PercentageValue;
      readonly averageOrderValue: MonetaryValue;
      readonly purchaseFrequency: number;
    }[];
  }[];
  /** Customer Lifetime Value by cohort */
  readonly clvByCohort: readonly {
    readonly cohortId: CohortId;
    readonly cohortPeriod: string;
    readonly averageClv: MonetaryValue;
    readonly medianClv: MonetaryValue;
    readonly projectedClv: MonetaryValue;
    readonly clvVariability: number;
  }[];
  /** Revenue concentration analysis */
  readonly revenueConcentration: readonly {
    readonly cohortId: CohortId;
    readonly cohortPeriod: string;
    readonly top10Percent: PercentageValue; // % of revenue from top 10% customers
    readonly top20Percent: PercentageValue;
    readonly giniCoefficient: number; // Revenue inequality measure
  }[];
}

/**
 * Cohort behavioral patterns
 */
export interface CohortBehavioralPatterns {
  /** Purchase patterns by cohort */
  readonly purchasePatterns: readonly {
    readonly cohortId: CohortId;
    readonly patterns: readonly {
      readonly patternName: string;
      readonly description: string;
      readonly customerCount: CountValue;
      readonly percentage: PercentageValue;
      readonly averageValue: MonetaryValue;
    }[];
  }[];
  /** Product affinity by cohort */
  readonly productAffinity: readonly {
    readonly cohortId: CohortId;
    readonly topCategories: readonly {
      readonly categoryId: CategoryId;
      readonly categoryName: string;
      readonly purchaseRate: PercentageValue;
      readonly revenueShare: PercentageValue;
    }[];
    readonly crossSellOpportunities: readonly {
      readonly productId: ProductId;
      readonly productName: string;
      readonly affinityScore: ScoreValue;
    }[];
  }[];
  /** Seasonal behavior patterns */
  readonly seasonalPatterns: readonly {
    readonly cohortId: CohortId;
    readonly seasonality: readonly {
      readonly period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'holiday' | 'summer' | 'winter';
      readonly activityIndex: ScoreValue; // Relative activity compared to baseline
      readonly revenueIndex: ScoreValue;
    }[];
  }[];
}

// =============================================================================
// COHORT INSIGHTS AND PREDICTIONS
// =============================================================================

/**
 * Cohort insights and trends
 */
export interface CohortInsights {
  /** Overall cohort health */
  readonly cohortHealth: {
    readonly averageRetentionRate: PercentageValue;
    readonly retentionTrend: 'improving' | 'stable' | 'declining';
    readonly cohortMaturity: 'early' | 'growing' | 'mature' | 'declining';
    readonly topPerformingCohorts: readonly CohortId[];
    readonly concerningCohorts: readonly CohortId[];
  };
  /** Key insights */
  readonly keyInsights: readonly {
    readonly insightType: 'retention' | 'revenue' | 'behavior' | 'churn' | 'opportunity';
    readonly title: string;
    readonly description: string;
    readonly impact: 'high' | 'medium' | 'low';
    readonly confidence: ScoreValue;
    readonly affectedCohorts: readonly CohortId[];
    readonly metrics: readonly {
      readonly metric: string;
      readonly value: number;
      readonly change: PercentageValue;
    }[];
  }[];
  /** Behavioral insights */
  readonly behavioralInsights: CohortBehavioralPatterns;
  /** Predictive insights */
  readonly predictions: readonly {
    readonly cohortId: CohortId;
    readonly predictionType: 'churn_risk' | 'ltv_forecast' | 'engagement_score';
    readonly prediction: number;
    readonly confidence: ScoreValue;
    readonly timeframe: string;
    readonly factors: readonly string[];
  }[];
  /** Actionable recommendations */
  readonly recommendations: readonly {
    readonly category: 'retention' | 'engagement' | 'monetization' | 'acquisition';
    readonly recommendation: string;
    readonly priority: 'high' | 'medium' | 'low';
    readonly targetCohorts: readonly CohortId[];
    readonly estimatedImpact: {
      readonly retentionImprovement: PercentageValue;
      readonly revenueImpact: MonetaryValue;
    };
    readonly effort: 'low' | 'medium' | 'high';
    readonly timeframe: string;
  }[];
}

// =============================================================================
// COHORT PERFORMANCE TRACKING
// =============================================================================

/**
 * Cohort performance benchmark
 */
export interface CohortPerformanceBenchmark {
  /** Benchmark metadata */
  readonly benchmarkId: string;
  readonly name: string;
  readonly description: string;
  readonly industry: string;
  readonly region: string;
  /** Benchmark values by metric */
  readonly benchmarks: readonly {
    readonly metric: CohortMetricType;
    readonly timeframe: string; // e.g., "30 days", "6 months"
    readonly percentiles: {
      readonly p25: number;
      readonly p50: number;
      readonly p75: number;
      readonly p90: number;
    };
    readonly industryAverage: number;
    readonly topPerformerThreshold: number;
  }[];
  /** Last updated date */
  readonly updatedAt: Date;
}

/**
 * Cohort performance scoring
 */
export interface CohortPerformanceScore {
  /** Cohort information */
  readonly cohortId: CohortId;
  readonly cohortName: string;
  /** Overall performance score (0-100) */
  readonly overallScore: ScoreValue;
  /** Performance by metric */
  readonly metricScores: readonly {
    readonly metric: CohortMetricType;
    readonly score: ScoreValue;
    readonly percentileRank: PercentageValue;
    readonly benchmarkComparison: 'above_average' | 'average' | 'below_average';
    readonly trend: 'improving' | 'stable' | 'declining';
  }[];
  /** Performance grade */
  readonly performanceGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  /** Areas for improvement */
  readonly improvementAreas: readonly {
    readonly metric: CohortMetricType;
    readonly currentValue: number;
    readonly targetValue: number;
    readonly improvementPotential: PercentageValue;
    readonly priority: 'high' | 'medium' | 'low';
  }[];
}

// =============================================================================
// EXPORT TYPES FOR API INTERFACES
// =============================================================================

/**
 * Comprehensive cohort export for API usage
 */
export type CohortTypes = DeepReadonly<{
  CohortType;
  CohortMetricType;
  CohortDefinition;
  CohortMember;
  CohortAnalysis;
  CohortRetentionDataPoint;
  CohortInsights;
  CohortPerformanceBenchmark;
  CohortPerformanceScore;
}>;
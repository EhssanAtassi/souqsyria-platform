/**
 * @file index.ts
 * @description Central export file for all analytics data interfaces.
 * @module AdminAnalytics/Interfaces
 */

// CLV Interfaces
export type { CustomerSegment } from './clv.interface';
export type {
  CLVAnalyticsSummary,
  CustomerCLVDetail,
  CLVTrendDataPoint,
  SegmentPerformance,
  TopCustomer,
  CLVFilterOptions,
  CLVCalculationStatus
} from './clv.interface';

// Funnel Interfaces
export type {
  FunnelStage,
  DeviceCategory,
  TrafficSource
} from './funnel.interface';
export type {
  ConversionFunnelSummary,
  FunnelStageMetrics,
  DevicePerformance,
  SourcePerformance,
  FunnelSessionDetail,
  StageProgressionEntry,
  DropOffAnalysis,
  DropOffReason,
  ABTestVariant,
  TimeToConversionBucket,
  FunnelFilterOptions,
  FunnelOptimizationSuggestion
} from './funnel.interface';

// Abandonment Interfaces
export type {
  AbandonmentReason,
  RecoveryCampaignStatus
} from './abandonment.interface';
export type {
  CartAbandonmentSummary,
  AbandonedCartDetail,
  AbandonedCartItem,
  AbandonmentRateDataPoint,
  RecoveryCampaignPerformance,
  AbandonmentReasonAnalysis,
  AbandonedCartAlert,
  RecoveryEmailTemplate,
  AbandonmentFilterOptions,
  CartRecoveryStatistics
} from './abandonment.interface';

// =========================================================================
// BI DASHBOARD INTERFACES
// =========================================================================

/**
 * BI Dashboard Interfaces
 * @description Re-exports from the dedicated BI Dashboard module for convenience.
 *              For full BI Dashboard imports, use the bi-dashboard module directly.
 * @see {@link module:AdminDashboard/Analytics/BIDashboard}
 */
export type {
  // Hero Metrics
  HeroMetric,
  MetricTrend,

  // Quick Insights
  QuickInsight,

  // Dashboard State
  DashboardTab,
  DatePreset,
  BIDashboardState,
  BIDashboardFilters
} from '../bi-dashboard/interfaces/bi-dashboard.interfaces';

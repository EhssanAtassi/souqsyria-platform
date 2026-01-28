/**
 * @file BI Dashboard Interfaces Barrel Export
 * @description Exports all TypeScript interfaces and types for BI Dashboard.
 * @module AdminDashboard/Analytics/BIDashboard/Interfaces
 */

export type {
  // Customer Segments
  CustomerSegment,
  CustomerSegmentConfig,

  // CLV Analytics
  CustomerCLV,
  CLVSegmentSummary,
  CLVAnalytics,

  // Conversion Funnel
  FunnelStageType,
  DeviceType,
  FunnelStage,
  FunnelComparison,
  ConversionFunnelAnalytics,

  // Cart Abandonment
  AbandonmentReason,
  RecoveryCampaignStatus,
  AbandonedCart,
  RecoveryCampaign,
  CartAbandonmentAnalytics,

  // Cohort Analysis
  CohortDefinition,
  RetentionMetric,
  Cohort,
  BehaviorPattern,
  CohortAnalysis,

  // Quick Insights
  QuickInsight,

  // Dashboard Data
  BIDashboardHeroMetrics,
  BIDashboardData,
  BIDashboardFilters,
  BIExportConfig
} from './bi-dashboard.interfaces';

export {
  // Constants
  CUSTOMER_SEGMENT_CONFIGS,
  ABANDONMENT_REASON_LABELS,
  FUNNEL_STAGE_LABELS
} from './bi-dashboard.interfaces';

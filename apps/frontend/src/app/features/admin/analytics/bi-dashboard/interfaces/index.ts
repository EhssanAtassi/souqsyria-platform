/**
 * @file BI Dashboard Interfaces Barrel Export
 * @description Exports all TypeScript interfaces and types for BI Dashboard.
 * @module AdminDashboard/Analytics/BIDashboard/Interfaces
 */

export {
  // Customer Segments
  CustomerSegmentType,
  CustomerSegmentConfig,
  CUSTOMER_SEGMENT_CONFIGS,

  // Hero Metrics
  HeroMetric,
  MetricTrend,

  // Quick Insights
  QuickInsight,

  // CLV Analytics
  CLVAnalytics,
  CLVTrendPoint,
  CustomerSegment,
  LifecycleStage,

  // Conversion Funnel
  ConversionFunnelAnalytics,
  FunnelStage,
  FunnelDropoff,
  ConversionTrend,

  // Cart Abandonment
  CartAbandonmentAnalytics,
  AbandonmentReason,
  AbandonedCart,
  RecoveryAction,

  // Cohort Analysis
  CohortAnalysis,
  CohortData,
  RetentionRate,
  CohortComparison,

  // Dashboard State
  DashboardTab,
  DatePreset,
  BIDashboardState,
  BIDashboardFilters
} from './bi-dashboard.interfaces';

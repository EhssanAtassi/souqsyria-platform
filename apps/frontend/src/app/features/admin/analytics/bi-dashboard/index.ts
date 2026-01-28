/**
 * @file BI Dashboard Module Barrel Export
 * @description Central export point for Business Intelligence Dashboard components,
 *              services, and interfaces. Provides clean imports for the BI module.
 * @module AdminDashboard/Analytics/BIDashboard
 *
 * @example
 * ```typescript
 * // Import component
 * import { BIDashboardComponent } from './bi-dashboard';
 *
 * // Import service
 * import { BIDashboardService } from './bi-dashboard';
 *
 * // Import interfaces
 * import {
 *   BIDashboardHeroMetrics,
 *   CLVAnalytics,
 *   ConversionFunnelAnalytics
 * } from './bi-dashboard';
 * ```
 */

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Main Business Intelligence Dashboard Component
 * @description Provides comprehensive BI analytics with tabs for CLV,
 *              conversion funnel, cart abandonment, and cohort analysis.
 */
export { BIDashboardComponent } from './bi-dashboard.component';

// ============================================================================
// SERVICES
// ============================================================================

/**
 * BI Dashboard Data Service
 * @description Handles API communication for BI data fetching, caching,
 *              and real-time updates for analytics metrics.
 */
export { BIDashboardService } from './services/bi-dashboard.service';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * BI Dashboard Interfaces
 * @description TypeScript interfaces and types for all BI data structures
 *              including metrics, analytics, and configuration constants.
 */
export type {
  // Customer Segments
  CustomerSegment,
  CustomerSegmentConfig,

  // CLV Analytics
  CustomerCLV,
  CLVSegmentSummary,
  CLVAnalytics,

  // Quick Insights
  QuickInsight,

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

  // Dashboard Data
  BIDashboardHeroMetrics,
  BIDashboardData,
  BIDashboardFilters,
  BIExportConfig
} from './interfaces/bi-dashboard.interfaces';

export {
  // Constants
  CUSTOMER_SEGMENT_CONFIGS,
  ABANDONMENT_REASON_LABELS,
  FUNNEL_STAGE_LABELS
} from './interfaces/bi-dashboard.interfaces';

// ============================================================================
// STYLES (SCSS Token Imports - for reference)
// ============================================================================

/**
 * Design Tokens Location
 * @description SCSS design tokens are located at:
 *              ./styles/_bi-tokens.scss
 *
 * @usage Import in component SCSS files:
 * ```scss
 * @use './styles/bi-tokens' as bi;
 *
 * .my-component {
 *   background: bi.$color-surface;
 *   padding: bi.$spacing-4;
 * }
 * ```
 */

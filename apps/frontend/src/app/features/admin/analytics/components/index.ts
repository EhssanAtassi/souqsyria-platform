/**
 * @file index.ts
 * @description Central export file for all analytics UI components.
 *              Simplifies imports across the application.
 * @module AdminAnalytics/Components
 */

// =========================================================================
// CLV COMPONENTS
// =========================================================================

export { CLVSummaryCardComponent } from './clv/clv-summary-card.component';
export { CustomerCLVTableComponent } from './clv/customer-clv-table.component';

// Additional CLV components (to be implemented)
// export { CLVTrendChartComponent } from './clv/clv-trend-chart.component';
// export { SegmentPerformanceComponent } from './clv/segment-performance.component';
// export { TopCustomersListComponent } from './clv/top-customers-list.component';

// =========================================================================
// FUNNEL COMPONENTS (To be implemented)
// =========================================================================

// export { FunnelSummaryComponent } from './funnel/funnel-summary.component';
// export { FunnelFlowDiagramComponent } from './funnel/funnel-flow-diagram.component';
// export { DeviceComparisonComponent } from './funnel/device-comparison.component';
// export { DropOffAnalysisComponent } from './funnel/drop-off-analysis.component';
// export { FunnelSessionsTableComponent } from './funnel/funnel-sessions-table.component';

// =========================================================================
// ABANDONMENT COMPONENTS (To be implemented)
// =========================================================================

// export { AbandonmentSummaryComponent } from './abandonment/abandonment-summary.component';
// export { AbandonedCartsTableComponent } from './abandonment/abandoned-carts-table.component';
// export { RecoveryCampaignsComponent } from './abandonment/recovery-campaigns.component';
// export { ReasonAnalysisComponent } from './abandonment/reason-analysis.component';
// export { AbandonmentAlertsComponent } from './abandonment/abandonment-alerts.component';

// =========================================================================
// COHORT COMPONENTS (To be implemented)
// =========================================================================

// export { CohortHeatmapComponent } from './cohort/cohort-heatmap.component';
// export { RetentionCurvesComponent } from './cohort/retention-curves.component';
// export { CohortComparisonComponent } from './cohort/cohort-comparison.component';
// export { CohortMembersTableComponent } from './cohort/cohort-members-table.component';

// =========================================================================
// SHARED COMPONENTS (To be implemented)
// =========================================================================

// export { MetricCardComponent } from './shared/metric-card.component';
// export { ChartContainerComponent } from './shared/chart-container.component';
// export { DataTableWrapperComponent } from './shared/data-table-wrapper.component';
// export { DateRangePickerComponent } from './shared/date-range-picker.component';
// export { ExportButtonComponent } from './shared/export-button.component';

// =========================================================================
// BI DASHBOARD COMPONENTS
// =========================================================================

/**
 * Business Intelligence Dashboard
 * @description Complete BI dashboard component with CLV analytics,
 *              conversion funnel, cart abandonment, and cohort analysis.
 * @see {@link module:AdminDashboard/Analytics/BIDashboard}
 */
export { BIDashboardComponent } from '../bi-dashboard/bi-dashboard.component';

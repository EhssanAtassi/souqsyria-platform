/**
 * @file Shared Components Barrel Export
 * @description Re-exports all shared admin dashboard components for convenient importing.
 * @module AdminDashboard/SharedComponents
 */

// Stat Card
export { AdminStatCardComponent } from './admin-stat-card/admin-stat-card.component';
export type { TrendDirection, ValueFormat, ColorTheme } from './admin-stat-card/admin-stat-card.component';

// Status Badge
export { AdminStatusBadgeComponent } from './admin-status-badge/admin-status-badge.component';
export type { StatusVariant, BadgeSize, StatusMapping } from './admin-status-badge/admin-status-badge.component';

// Pagination
export { AdminPaginationComponent } from './admin-pagination/admin-pagination.component';
export type { PageChangeEvent } from './admin-pagination/admin-pagination.component';

// Confirmation Dialog
export { AdminConfirmationDialogComponent } from './admin-confirmation-dialog/admin-confirmation-dialog.component';
export type {
  ConfirmationDialogData,
  ConfirmationDialogResult,
  DialogType
} from './admin-confirmation-dialog/admin-confirmation-dialog.component';

// Filter Panel
export { AdminFilterPanelComponent } from './admin-filter-panel/admin-filter-panel.component';
export type {
  FilterField,
  FilterFieldType,
  FilterOption,
  FilterValues
} from './admin-filter-panel/admin-filter-panel.component';

// Data Table
export { AdminDataTableComponent } from './admin-data-table/admin-data-table.component';
export type {
  TableColumn,
  RowAction,
  SortState,
  SelectionChangeEvent,
  RowActionEvent
} from './admin-data-table/admin-data-table.component';

// BI Dashboard Components
export { BiChartWrapperComponent } from './bi-chart-wrapper/bi-chart-wrapper.component';
export type { ChartExportFormat } from './bi-chart-wrapper/bi-chart-wrapper.component';

export { BiKpiCardComponent } from './bi-kpi-card/bi-kpi-card.component';
export type {
  KPIFormat,
  KPITrend,
  SparklinePoint
} from './bi-kpi-card/bi-kpi-card.component';

export { BiDateRangePickerComponent } from './bi-date-range-picker/bi-date-range-picker.component';
export type {
  DateRange,
  DatePreset
} from './bi-date-range-picker/bi-date-range-picker.component';

export { BiSegmentChartComponent } from './bi-segment-chart/bi-segment-chart.component';
export type {
  SegmentData,
  ChartType
} from './bi-segment-chart/bi-segment-chart.component';

/**
 * @file Shared Components Barrel Export
 * @description Re-exports all shared admin dashboard components for convenient importing.
 * @module AdminDashboard/SharedComponents
 */

// Stat Card
export { AdminStatCardComponent, TrendDirection, ValueFormat, ColorTheme } from './admin-stat-card/admin-stat-card.component';

// Status Badge
export { AdminStatusBadgeComponent, StatusVariant, BadgeSize, StatusMapping } from './admin-status-badge/admin-status-badge.component';

// Pagination
export { AdminPaginationComponent, PageChangeEvent } from './admin-pagination/admin-pagination.component';

// Confirmation Dialog
export {
  AdminConfirmationDialogComponent,
  ConfirmationDialogData,
  ConfirmationDialogResult,
  DialogType
} from './admin-confirmation-dialog/admin-confirmation-dialog.component';

// Filter Panel
export {
  AdminFilterPanelComponent,
  FilterField,
  FilterFieldType,
  FilterOption,
  FilterValues,
  FilterChangeEvent
} from './admin-filter-panel/admin-filter-panel.component';

// Data Table
export {
  AdminDataTableComponent,
  TableColumn,
  RowAction,
  SortState,
  SelectionChangeEvent,
  RowActionEvent
} from './admin-data-table/admin-data-table.component';

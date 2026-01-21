/**
 * @file admin-data-table.component.ts
 * @description Reusable data table component for admin listings.
 *              Supports sorting, selection, custom columns, and row actions.
 * @module AdminDashboard/SharedComponents
 */

import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { NgFor, NgIf, NgClass, NgTemplateOutlet, DatePipe, DecimalPipe } from '@angular/common';

import { AdminPaginationComponent, PageChangeEvent } from '../admin-pagination/admin-pagination.component';
import { AdminStatusBadgeComponent } from '../admin-status-badge/admin-status-badge.component';

/**
 * Column definition for the data table
 */
export interface TableColumn<T = unknown> {
  /** Unique column identifier */
  key: string;
  /** Display header text */
  header: string;
  /** Property path in the data object (supports dot notation) */
  field?: string;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum column width */
  minWidth?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Sort field override (different from display field) */
  sortField?: string;
  /** Cell data type for formatting */
  type?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'status' | 'boolean' | 'custom';
  /** Currency code for currency type */
  currencyCode?: string;
  /** Date format for date type */
  dateFormat?: string;
  /** CSS class for the column */
  className?: string;
  /** Whether column is hidden */
  hidden?: boolean;
  /** Cell alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom cell template name */
  template?: string;
  /** Tooltip for header */
  headerTooltip?: string;
  /** Whether to wrap text */
  nowrap?: boolean;
}

/**
 * Row action definition
 */
export interface RowAction<T = unknown> {
  /** Action identifier */
  key: string;
  /** Display label */
  label: string;
  /** Material icon name */
  icon?: string;
  /** Action color/variant */
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning';
  /** Condition function to show/hide action */
  visible?: (row: T) => boolean;
  /** Condition function to enable/disable action */
  disabled?: (row: T) => boolean;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Sort state
 */
export interface SortState {
  /** Field being sorted */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Selection change event
 */
export interface SelectionChangeEvent<T> {
  /** Selected items */
  selected: T[];
  /** Added items (for multi-selection) */
  added?: T[];
  /** Removed items (for multi-selection) */
  removed?: T[];
}

/**
 * Row action event
 */
export interface RowActionEvent<T> {
  /** Action key */
  action: string;
  /** Row data */
  row: T;
  /** Row index */
  index: number;
}

/**
 * Admin Data Table Component
 * @description A feature-rich data table with sorting, selection, pagination,
 *              and customizable columns for admin interfaces.
 *
 * @example
 * ```html
 * <app-admin-data-table
 *   [columns]="columns"
 *   [data]="users()"
 *   [loading]="isLoading()"
 *   [totalItems]="totalUsers()"
 *   [pageSize]="pageSize()"
 *   [currentPage]="currentPage()"
 *   [selectable]="true"
 *   [actions]="rowActions"
 *   (sortChange)="onSort($event)"
 *   (pageChange)="onPageChange($event)"
 *   (selectionChange)="onSelectionChange($event)"
 *   (rowAction)="onRowAction($event)"
 *   (rowClick)="onRowClick($event)"
 * >
 *   <ng-template #statusCell let-row>
 *     <app-admin-status-badge [status]="row.status" />
 *   </ng-template>
 * </app-admin-data-table>
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-data-table',
  templateUrl: './admin-data-table.component.html',
  styleUrls: ['./admin-data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    NgTemplateOutlet,
    DatePipe,
    DecimalPipe,
    AdminPaginationComponent,
    AdminStatusBadgeComponent
  ]
})
export class AdminDataTableComponent<T extends Record<string, unknown>> {
  /**
   * Column definitions
   * @description Array of column configurations
   */
  readonly columns = input.required<TableColumn<T>[]>();

  /**
   * Table data
   * @description Array of data items to display
   */
  readonly data = input.required<T[]>();

  /**
   * Loading state
   * @description Shows loading skeleton when true
   * @default false
   */
  readonly loading = input<boolean>(false);

  /**
   * Total items count
   * @description Total count for pagination (may differ from data.length)
   */
  readonly totalItems = input<number>(0);

  /**
   * Current page number (1-indexed)
   */
  readonly currentPage = input<number>(1);

  /**
   * Items per page
   */
  readonly pageSize = input<number>(20);

  /**
   * Page size options
   */
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);

  /**
   * Show pagination
   * @default true
   */
  readonly showPagination = input<boolean>(true);

  /**
   * Enable row selection
   * @default false
   */
  readonly selectable = input<boolean>(false);

  /**
   * Allow multiple selection
   * @default true
   */
  readonly multiSelect = input<boolean>(true);

  /**
   * Pre-selected items
   */
  readonly selected = input<T[]>([]);

  /**
   * Unique identifier field for selection tracking
   * @default 'id'
   */
  readonly trackBy = input<string>('id');

  /**
   * Row actions configuration
   */
  readonly actions = input<RowAction<T>[]>([]);

  /**
   * Enable row click
   * @default false
   */
  readonly clickable = input<boolean>(false);

  /**
   * Current sort state
   */
  readonly sortState = input<SortState | null>(null);

  /**
   * Empty state message
   */
  readonly emptyMessage = input<string>('No data available');

  /**
   * Empty state icon
   */
  readonly emptyIcon = input<string>('inbox');

  /**
   * Table striped rows
   * @default true
   */
  readonly striped = input<boolean>(true);

  /**
   * Table hover effect
   * @default true
   */
  readonly hoverable = input<boolean>(true);

  /**
   * Compact mode
   * @default false
   */
  readonly compact = input<boolean>(false);

  /**
   * Sort change event
   */
  readonly sortChange = output<SortState>();

  /**
   * Page change event
   */
  readonly pageChange = output<PageChangeEvent>();

  /**
   * Page size change event
   */
  readonly pageSizeChange = output<number>();

  /**
   * Selection change event
   */
  readonly selectionChange = output<SelectionChangeEvent<T>>();

  /**
   * Row action event
   */
  readonly rowAction = output<RowActionEvent<T>>();

  /**
   * Row click event
   */
  readonly rowClick = output<{ row: T; index: number }>();

  /**
   * Custom cell templates
   */
  @ContentChild('statusCell') statusCellTemplate?: TemplateRef<unknown>;
  @ContentChild('actionsCell') actionsCellTemplate?: TemplateRef<unknown>;
  @ContentChild('customCell') customCellTemplate?: TemplateRef<unknown>;

  /**
   * Internal selected items
   */
  readonly selectedItems = signal<Set<unknown>>(new Set());

  /**
   * Visible columns (non-hidden)
   */
  readonly visibleColumns = computed(() =>
    this.columns().filter(col => !col.hidden)
  );

  /**
   * Whether all rows are selected
   */
  readonly allSelected = computed(() => {
    const data = this.data();
    const selected = this.selectedItems();
    if (data.length === 0) return false;
    return data.every(row => selected.has(this.getRowId(row)));
  });

  /**
   * Whether some (but not all) rows are selected
   */
  readonly someSelected = computed(() => {
    const data = this.data();
    const selected = this.selectedItems();
    const selectedCount = data.filter(row => selected.has(this.getRowId(row))).length;
    return selectedCount > 0 && selectedCount < data.length;
  });

  /**
   * Number of selected items
   */
  readonly selectedCount = computed(() => this.selectedItems().size);

  /**
   * Has row actions
   */
  readonly hasActions = computed(() => this.actions().length > 0);

  /**
   * Initialize component
   */
  ngOnInit(): void {
    // Initialize selection from input
    const initialSelected = this.selected();
    if (initialSelected.length > 0) {
      const ids = new Set(initialSelected.map(item => this.getRowId(item)));
      this.selectedItems.set(ids);
    }
  }

  /**
   * Get unique identifier for a row
   */
  getRowId(row: T): unknown {
    const key = this.trackBy();
    return row[key];
  }

  /**
   * Get cell value from row using field path
   */
  getCellValue(row: T, column: TableColumn<T>): unknown {
    const field = column.field || column.key;
    return this.getNestedValue(row, field);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  /**
   * Check if row is selected
   */
  isSelected(row: T): boolean {
    return this.selectedItems().has(this.getRowId(row));
  }

  /**
   * Toggle row selection
   */
  toggleRowSelection(row: T): void {
    if (!this.selectable()) return;

    const id = this.getRowId(row);
    const selected = new Set(this.selectedItems());

    if (this.multiSelect()) {
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
    } else {
      selected.clear();
      selected.add(id);
    }

    this.selectedItems.set(selected);
    this.emitSelectionChange();
  }

  /**
   * Toggle all rows selection
   */
  toggleAllSelection(): void {
    if (!this.selectable() || !this.multiSelect()) return;

    const data = this.data();
    const selected = new Set(this.selectedItems());

    if (this.allSelected()) {
      // Deselect all
      data.forEach(row => selected.delete(this.getRowId(row)));
    } else {
      // Select all
      data.forEach(row => selected.add(this.getRowId(row)));
    }

    this.selectedItems.set(selected);
    this.emitSelectionChange();
  }

  /**
   * Emit selection change event
   */
  private emitSelectionChange(): void {
    const data = this.data();
    const selected = this.selectedItems();
    const selectedRows = data.filter(row => selected.has(this.getRowId(row)));

    this.selectionChange.emit({ selected: selectedRows });
  }

  /**
   * Handle sort click
   */
  onSortClick(column: TableColumn<T>): void {
    if (!column.sortable) return;

    const field = column.sortField || column.field || column.key;
    const currentSort = this.sortState();

    let direction: 'asc' | 'desc' = 'asc';
    if (currentSort && currentSort.field === field) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }

    this.sortChange.emit({ field, direction });
  }

  /**
   * Get sort icon for column
   */
  getSortIcon(column: TableColumn<T>): string {
    const field = column.sortField || column.field || column.key;
    const currentSort = this.sortState();

    if (!currentSort || currentSort.field !== field) {
      return 'unfold_more';
    }

    return currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  /**
   * Is column currently sorted
   */
  isColumnSorted(column: TableColumn<T>): boolean {
    const field = column.sortField || column.field || column.key;
    const currentSort = this.sortState();
    return currentSort?.field === field;
  }

  /**
   * Handle row click
   */
  onRowClick(row: T, index: number, event: Event): void {
    // Don't trigger row click if clicking on checkbox or action button
    const target = event.target as HTMLElement;
    if (target.closest('.data-table__checkbox, .data-table__action')) {
      return;
    }

    if (this.clickable()) {
      this.rowClick.emit({ row, index });
    }
  }

  /**
   * Handle row action
   */
  onRowAction(action: RowAction<T>, row: T, index: number, event: Event): void {
    event.stopPropagation();
    this.rowAction.emit({ action: action.key, row, index });
  }

  /**
   * Check if action is visible for row
   */
  isActionVisible(action: RowAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  /**
   * Check if action is disabled for row
   */
  isActionDisabled(action: RowAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageChangeEvent): void {
    this.pageChange.emit(event);
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(newSize: number): void {
    this.pageSizeChange.emit(newSize);
  }

  /**
   * Track function for rows
   */
  trackByRow(index: number, row: T): unknown {
    return this.getRowId(row);
  }

  /**
   * Track function for columns
   */
  trackByColumn(index: number, column: TableColumn<T>): string {
    return column.key;
  }

  /**
   * Get skeleton rows for loading state
   */
  get skeletonRows(): number[] {
    return Array.from({ length: Math.min(this.pageSize(), 5) }, (_, i) => i);
  }

  /**
   * Format cell value based on type
   */
  formatCellValue(value: unknown, column: TableColumn<T>): string {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        const formatted = new Intl.NumberFormat('en-US').format(num);
        return `${formatted} ${column.currencyCode || 'SYP'}`;

      case 'boolean':
        return value ? 'Yes' : 'No';

      default:
        return String(value);
    }
  }
}

/**
 * @file optimized-data-table.component.ts
 * @description High-performance data table with virtual scrolling, OnPush change detection,
 *              and optimized rendering for large datasets
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
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgFor, NgIf, NgClass, NgTemplateOutlet } from '@angular/common';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { fromEvent, debounceTime, distinctUntilChanged } from 'rxjs';

import { PerformanceUtils } from '../../../../core/performance/performance-config';
import { TableColumn, RowAction, SortState, SelectionChangeEvent, RowActionEvent } from '../admin-data-table/admin-data-table.component';

/**
 * Virtual scroll configuration
 */
export interface VirtualScrollConfig {
  /** Item height in pixels */
  itemHeight: number;
  /** Buffer size (number of items) */
  bufferSize: number;
  /** Enable virtual scrolling */
  enabled: boolean;
  /** Minimum items to enable virtual scrolling */
  threshold: number;
}

/**
 * Performance optimization configuration
 */
export interface TablePerformanceConfig {
  /** Virtual scroll settings */
  virtualScroll: VirtualScrollConfig;
  /** Maximum items to render without pagination */
  maxItemsWithoutPagination: number;
  /** Debounce time for search/filter */
  debounceTime: number;
  /** Enable row recycling */
  enableRowRecycling: boolean;
  /** Track by function optimization */
  optimizeTrackBy: boolean;
}

/**
 * Default performance configuration
 */
const DEFAULT_PERFORMANCE_CONFIG: TablePerformanceConfig = {
  virtualScroll: {
    itemHeight: 56, // Material Design row height
    bufferSize: 10,
    enabled: true,
    threshold: 100 // Enable virtual scroll for 100+ items
  },
  maxItemsWithoutPagination: 50,
  debounceTime: 300,
  enableRowRecycling: true,
  optimizeTrackBy: true
};

/**
 * Optimized Data Table Component
 * @description High-performance data table with:
 *              - Virtual scrolling for large datasets (1000+ items)
 *              - OnPush change detection strategy
 *              - Optimized sorting and filtering
 *              - Row recycling to minimize DOM operations
 *              - Intelligent rendering based on viewport
 *              - Memory leak prevention
 *
 * @example
 * ```html
 * <app-optimized-data-table
 *   [columns]="columns"
 *   [data]="users()"
 *   [loading]="isLoading()"
 *   [performanceConfig]="tableConfig"
 *   [enableVirtualScroll]="users().length > 100"
 *   (sortChange)="onSort($event)"
 *   (selectionChange)="onSelectionChange($event)"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-optimized-data-table',
  templateUrl: './optimized-data-table.component.html',
  styleUrls: ['./optimized-data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    NgTemplateOutlet,
    ScrollingModule
  ]
})
export class OptimizedDataTableComponent<T extends Record<string, unknown>> implements AfterViewInit {
  /**
   * DestroyRef for automatic subscription cleanup
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Virtual scroll viewport reference
   */
  @ViewChild(CdkVirtualScrollViewport) virtualScrollViewport?: CdkVirtualScrollViewport;

  /**
   * Table container reference
   */
  @ViewChild('tableContainer') tableContainer?: ElementRef<HTMLDivElement>;

  /**
   * Custom cell templates
   */
  @ContentChild('statusCell') statusCellTemplate?: TemplateRef<unknown>;
  @ContentChild('actionsCell') actionsCellTemplate?: TemplateRef<unknown>;
  @ContentChild('customCell') customCellTemplate?: TemplateRef<unknown>;

  // =========================================================================
  // INPUTS
  // =========================================================================

  /**
   * Column definitions
   */
  readonly columns = input.required<TableColumn<T>[]>();

  /**
   * Table data
   */
  readonly data = input.required<T[]>();

  /**
   * Loading state
   */
  readonly loading = input<boolean>(false);

  /**
   * Performance configuration
   */
  readonly performanceConfig = input<Partial<TablePerformanceConfig>>(DEFAULT_PERFORMANCE_CONFIG);

  /**
   * Enable virtual scrolling override
   */
  readonly enableVirtualScroll = input<boolean | undefined>(undefined);

  /**
   * Table height for virtual scrolling
   */
  readonly tableHeight = input<string>('400px');

  /**
   * Enable row selection
   */
  readonly selectable = input<boolean>(false);

  /**
   * Allow multiple selection
   */
  readonly multiSelect = input<boolean>(true);

  /**
   * Pre-selected items
   */
  readonly selected = input<T[]>([]);

  /**
   * Unique identifier field
   */
  readonly trackBy = input<string>('id');

  /**
   * Row actions configuration
   */
  readonly actions = input<RowAction<T>[]>([]);

  /**
   * Current sort state
   */
  readonly sortState = input<SortState | null>(null);

  /**
   * Enable row click
   */
  readonly clickable = input<boolean>(false);

  /**
   * Compact mode
   */
  readonly compact = input<boolean>(false);

  /**
   * Show header
   */
  readonly showHeader = input<boolean>(true);

  // =========================================================================
  // OUTPUTS
  // =========================================================================

  /**
   * Sort change event
   */
  readonly sortChange = output<SortState>();

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

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /**
   * Internal selected items
   */
  readonly selectedItems = signal<Set<unknown>>(new Set());

  /**
   * Current viewport range (for performance optimization)
   */
  readonly viewportRange = signal<{ start: number; end: number }>({ start: 0, end: 50 });

  /**
   * Table dimensions
   */
  readonly tableDimensions = signal<{ width: number; height: number }>({ width: 0, height: 0 });

  /**
   * Scroll position
   */
  readonly scrollPosition = signal<number>(0);

  /**
   * Visible items count
   */
  readonly visibleItemsCount = signal<number>(0);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  /**
   * Effective performance config
   */
  readonly effectiveConfig = computed(() => ({
    ...DEFAULT_PERFORMANCE_CONFIG,
    ...this.performanceConfig()
  }));

  /**
   * Should use virtual scrolling
   */
  readonly shouldUseVirtualScroll = computed(() => {
    const enableOverride = this.enableVirtualScroll();
    if (enableOverride !== undefined) return enableOverride;

    const config = this.effectiveConfig();
    const dataLength = this.data().length;
    
    return config.virtualScroll.enabled && dataLength >= config.virtualScroll.threshold;
  });

  /**
   * Visible columns (non-hidden)
   */
  readonly visibleColumns = computed(() =>
    this.columns().filter(col => !col.hidden)
  );

  /**
   * Rendered data (viewport optimized)
   */
  readonly renderedData = computed(() => {
    const data = this.data();
    
    if (this.shouldUseVirtualScroll()) {
      // Virtual scrolling handles rendering optimization
      return data;
    }

    // For non-virtual scrolling, limit rendered items
    const config = this.effectiveConfig();
    const maxItems = config.maxItemsWithoutPagination;
    
    return data.length > maxItems ? data.slice(0, maxItems) : data;
  });

  /**
   * Virtual scroll item height
   */
  readonly itemHeight = computed(() => {
    const config = this.effectiveConfig();
    const baseHeight = config.virtualScroll.itemHeight;
    
    // Adjust for compact mode
    return this.compact() ? baseHeight * 0.75 : baseHeight;
  });

  /**
   * Whether all visible rows are selected
   */
  readonly allVisibleSelected = computed(() => {
    const data = this.renderedData();
    const selected = this.selectedItems();
    if (data.length === 0) return false;
    
    return data.every(row => selected.has(this.getRowId(row)));
  });

  /**
   * Whether some (but not all) visible rows are selected
   */
  readonly someVisibleSelected = computed(() => {
    const data = this.renderedData();
    const selected = this.selectedItems();
    const selectedCount = data.filter(row => selected.has(this.getRowId(row))).length;
    
    return selectedCount > 0 && selectedCount < data.length;
  });

  /**
   * Performance metrics
   */
  readonly performanceMetrics = computed(() => ({
    totalItems: this.data().length,
    renderedItems: this.renderedData().length,
    virtualScrollEnabled: this.shouldUseVirtualScroll(),
    viewportRange: this.viewportRange(),
    memoryUsage: this.estimateMemoryUsage()
  }));

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * After view init - setup performance optimizations
   */
  ngAfterViewInit(): void {
    this.setupVirtualScrollOptimizations();
    this.setupResizeObserver();
    this.initializeSelection();
  }

  /**
   * Setup virtual scroll optimizations
   */
  private setupVirtualScrollOptimizations(): void {
    if (!this.virtualScrollViewport) return;

    // Monitor viewport changes
    this.virtualScrollViewport.renderedRangeStream
      .pipe(
        debounceTime(50), // Debounce for performance
        distinctUntilChanged((a, b) => a.start === b.start && a.end === b.end),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(range => {
        this.viewportRange.set(range);
        this.visibleItemsCount.set(range.end - range.start);
      });

    // Monitor scroll position
    this.virtualScrollViewport.elementScrolled()
      .pipe(
        debounceTime(10),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const scrollTop = this.virtualScrollViewport?.measureScrollOffset() || 0;
        this.scrollPosition.set(scrollTop);
      });
  }

  /**
   * Setup resize observer for responsive behavior
   */
  private setupResizeObserver(): void {
    if (!this.tableContainer?.nativeElement) return;

    const resizeObserver = new ResizeObserver(
      PerformanceUtils.debounce((entries) => {
        for (const entry of entries) {
          this.tableDimensions.set({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }, 100)
    );

    resizeObserver.observe(this.tableContainer.nativeElement);

    // Cleanup on destroy
    const cleanup = () => resizeObserver.disconnect();
    this.destroyRef.onDestroy(cleanup);
  }

  /**
   * Initialize selection from input
   */
  private initializeSelection(): void {
    const initialSelected = this.selected();
    if (initialSelected.length > 0) {
      const ids = new Set(initialSelected.map(item => this.getRowId(item)));
      this.selectedItems.set(ids);
    }
  }

  // =========================================================================
  // SELECTION MANAGEMENT
  // =========================================================================

  /**
   * Get unique identifier for a row
   */
  getRowId(row: T): unknown {
    const key = this.trackBy();
    return row[key];
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
   * Toggle all visible rows selection
   */
  toggleAllVisibleSelection(): void {
    if (!this.selectable() || !this.multiSelect()) return;

    const data = this.renderedData();
    const selected = new Set(this.selectedItems());

    if (this.allVisibleSelected()) {
      // Deselect all visible
      data.forEach(row => selected.delete(this.getRowId(row)));
    } else {
      // Select all visible
      data.forEach(row => selected.add(this.getRowId(row)));
    }

    this.selectedItems.set(selected);
    this.emitSelectionChange();
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedItems.set(new Set());
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

  // =========================================================================
  // SORTING
  // =========================================================================

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

  // =========================================================================
  // ROW INTERACTIONS
  // =========================================================================

  /**
   * Handle row click
   */
  onRowClick(row: T, index: number, event: Event): void {
    // Don't trigger row click if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('.table-checkbox, .table-action, button, a, input')) {
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

  // =========================================================================
  // CELL VALUE HANDLING
  // =========================================================================

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
      return current && typeof current === 'object' 
        ? (current as Record<string, unknown>)[key] 
        : undefined;
    }, obj);
  }

  /**
   * Format cell value based on type
   */
  formatCellValue(value: unknown, column: TableColumn<T>): string {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'currency':
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(num) + ` ${column.currencyCode || 'SYP'}`;

      case 'number':
        const numVal = typeof value === 'number' ? value : parseFloat(String(value));
        return isNaN(numVal) ? '-' : new Intl.NumberFormat('en-US').format(numVal);

      case 'date':
        const date = new Date(value as string);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString();

      case 'datetime':
        const datetime = new Date(value as string);
        return isNaN(datetime.getTime()) ? '-' : datetime.toLocaleString();

      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'percent':
        const percent = typeof value === 'number' ? value : parseFloat(String(value));
        return isNaN(percent) ? '-' : `${(percent * 100).toFixed(1)}%`;

      default:
        return String(value);
    }
  }

  // =========================================================================
  // ACTION VISIBILITY & STATE
  // =========================================================================

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

  // =========================================================================
  // PERFORMANCE OPTIMIZATIONS
  // =========================================================================

  /**
   * Track function for rows (optimized)
   */
  trackByRow = (index: number, row: T): unknown => {
    // Use optimized tracking if enabled
    if (this.effectiveConfig().optimizeTrackBy) {
      const id = this.getRowId(row);
      return `${id}-${index}`;
    }
    return this.getRowId(row);
  };

  /**
   * Track function for columns
   */
  trackByColumn = (index: number, column: TableColumn<T>): string => {
    return `${column.key}-${index}`;
  };

  /**
   * Get skeleton rows for loading state
   */
  getSkeletonRows(): number[] {
    const visibleRows = Math.min(this.visibleItemsCount() || 10, 20);
    return Array.from({ length: visibleRows }, (_, i) => i);
  }

  /**
   * Estimate memory usage for performance monitoring
   */
  private estimateMemoryUsage(): number {
    const data = this.data();
    const avgRowSize = 200; // Estimated bytes per row
    return (data.length * avgRowSize) / 1024; // KB
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    if (this.virtualScrollViewport) {
      this.virtualScrollViewport.scrollToIndex(0, 'smooth');
    } else if (this.tableContainer?.nativeElement) {
      this.tableContainer.nativeElement.scrollTop = 0;
    }
  }

  /**
   * Scroll to index
   */
  scrollToIndex(index: number): void {
    if (this.virtualScrollViewport) {
      this.virtualScrollViewport.scrollToIndex(index, 'smooth');
    }
  }

  /**
   * Get current performance report
   */
  getPerformanceReport(): string {
    const metrics = this.performanceMetrics();
    const config = this.effectiveConfig();
    
    return `
Performance Report:
- Total Items: ${metrics.totalItems}
- Rendered Items: ${metrics.renderedItems}
- Virtual Scroll: ${metrics.virtualScrollEnabled ? 'Enabled' : 'Disabled'}
- Memory Usage: ${metrics.memoryUsage.toFixed(1)} KB
- Viewport Range: ${metrics.viewportRange.start}-${metrics.viewportRange.end}
- Item Height: ${this.itemHeight()}px
- Configuration: ${JSON.stringify(config, null, 2)}
    `.trim();
  }
}
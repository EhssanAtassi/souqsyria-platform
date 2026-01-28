/**
 * @file customer-clv-table.component.ts
 * @description Advanced Material table for displaying customer CLV data with sorting,
 *              filtering, pagination, virtual scrolling, and export capabilities.
 * @module AdminAnalytics/Components/CLV
 */

import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { ScrollingModule } from '@angular/cdk/scrolling';

import {
  CustomerCLVDetail,
  CustomerSegment,
  CLVFilterOptions
} from '../../interfaces/clv.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes';

/**
 * Customer CLV Table Component
 * @description Comprehensive data table for customer lifetime value analysis featuring:
 *              - Sortable columns (CLV, orders, last order date, name)
 *              - Multi-select with bulk actions
 *              - Advanced filtering (segment, CLV range, location)
 *              - Server-side or client-side pagination
 *              - Virtual scrolling for 10k+ customers
 *              - Export to CSV/Excel
 *              - Row expansion for detailed view
 *              - Responsive mobile layout
 *
 * @example
 * ```html
 * <app-customer-clv-table
 *   [customers]="customerList()"
 *   [totalCount]="totalCustomers()"
 *   [loading]="isLoading()"
 *   [pageSize]="25"
 *   [virtualScroll]="true"
 *   (pageChange)="onPageChange($event)"
 *   (sortChange)="onSortChange($event)"
 *   (filterChange)="onFilterChange($event)"
 *   (viewCustomer)="navigateToCustomer($event)"
 *   (exportData)="handleExport($event)"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-customer-clv-table',
  templateUrl: './customer-clv-table.component.html',
  styleUrls: ['./customer-clv-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    ScrollingModule,
    CurrencyFormatPipe
  ]
})
export class CustomerCLVTableComponent {
  // =========================================================================
  // INPUTS
  // =========================================================================

  /**
   * Customer data array
   * @description List of customers with CLV details
   */
  readonly customers = input.required<CustomerCLVDetail[]>();

  /**
   * Total customer count (for server-side pagination)
   * @description Total count if paginated on server
   */
  readonly totalCount = input<number | null>(null);

  /**
   * Loading state
   * @description Shows loading overlay when true
   */
  readonly loading = input<boolean>(false);

  /**
   * Page size
   * @description Number of rows per page
   * @default 25
   */
  readonly pageSize = input<number>(25);

  /**
   * Enable virtual scrolling
   * @description Use virtual scroll for large datasets (10k+)
   * @default false
   */
  readonly virtualScroll = input<boolean>(false);

  /**
   * Show selection checkboxes
   * @description Enable row selection
   * @default true
   */
  readonly selectable = input<boolean>(true);

  /**
   * Show filters
   * @description Display filter controls
   * @default true
   */
  readonly showFilters = input<boolean>(true);

  /**
   * Export enabled
   * @description Allow data export
   * @default true
   */
  readonly exportEnabled = input<boolean>(true);

  // =========================================================================
  // OUTPUTS
  // =========================================================================

  /**
   * Page change event
   */
  readonly pageChange = output<PageEvent>();

  /**
   * Sort change event
   */
  readonly sortChange = output<Sort>();

  /**
   * Filter change event
   */
  readonly filterChange = output<CLVFilterOptions>();

  /**
   * View customer details
   */
  readonly viewCustomer = output<CustomerCLVDetail>();

  /**
   * Export data request
   */
  readonly exportData = output<{ format: 'csv' | 'excel'; selection?: CustomerCLVDetail[] }>();

  /**
   * Selection change
   */
  readonly selectionChange = output<CustomerCLVDetail[]>();

  // =========================================================================
  // VIEW CHILDREN
  // =========================================================================

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // =========================================================================
  // STATE
  // =========================================================================

  /**
   * Table data source
   */
  readonly dataSource = signal<MatTableDataSource<CustomerCLVDetail>>(
    new MatTableDataSource<CustomerCLVDetail>([])
  );

  /**
   * Selection model
   */
  readonly selection = new SelectionModel<CustomerCLVDetail>(true, []);

  /**
   * Displayed columns
   */
  readonly displayedColumns = computed(() => {
    const baseColumns = [
      'name',
      'email',
      'currentCLV',
      'predictedCLV',
      'segment',
      'totalOrders',
      'totalSpent',
      'lastOrderDate',
      'actions'
    ];

    return this.selectable() ? ['select', ...baseColumns] : baseColumns;
  });

  /**
   * Filter values
   */
  readonly filterSegments = signal<CustomerSegment[]>([]);
  readonly filterMinCLV = signal<number | null>(null);
  readonly filterMaxCLV = signal<number | null>(null);
  readonly filterLocation = signal<string>('');
  readonly filterSearch = signal<string>('');

  /**
   * Available segments for filter
   */
  readonly availableSegments: CustomerSegment[] = [
    'VIP',
    'HIGH_VALUE',
    'ACTIVE',
    'AT_RISK',
    'DORMANT',
    'LOST'
  ];

  /**
   * Page size options
   */
  readonly pageSizeOptions = [10, 25, 50, 100];

  /**
   * Expanded row
   */
  readonly expandedRow = signal<CustomerCLVDetail | null>(null);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  constructor() {
    // Update data source when customers input changes
    effect(() => {
      const customerData = this.customers();
      const ds = this.dataSource();
      ds.data = customerData;
      ds.paginator = this.paginator;
      ds.sort = this.sort;

      // Custom filter predicate
      ds.filterPredicate = (data, filter) => this.customFilter(data, filter);
    });

    // Emit selection changes
    effect(() => {
      this.selectionChange.emit(this.selection.selected);
    });
  }

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  /**
   * Total number of customers (considering pagination)
   */
  readonly total = computed(() => this.totalCount() ?? this.customers().length);

  /**
   * Whether all rows are selected
   */
  readonly isAllSelected = computed(() => {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource().data.length;
    return numSelected === numRows && numRows > 0;
  });

  /**
   * Has any filter active
   */
  readonly hasActiveFilters = computed(() => {
    return (
      this.filterSegments().length > 0 ||
      this.filterMinCLV() !== null ||
      this.filterMaxCLV() !== null ||
      this.filterLocation().trim() !== '' ||
      this.filterSearch().trim() !== ''
    );
  });

  // =========================================================================
  // FILTER METHODS
  // =========================================================================

  /**
   * Custom filter predicate
   */
  private customFilter(data: CustomerCLVDetail, filter: string): boolean {
    // Search filter
    const searchTerm = this.filterSearch().toLowerCase();
    if (searchTerm) {
      const matchesSearch =
        data.customerName.toLowerCase().includes(searchTerm) ||
        data.email.toLowerCase().includes(searchTerm) ||
        (data.location?.toLowerCase().includes(searchTerm) ?? false);

      if (!matchesSearch) return false;
    }

    // Segment filter
    if (this.filterSegments().length > 0) {
      if (!this.filterSegments().includes(data.segment)) {
        return false;
      }
    }

    // CLV range filter
    if (this.filterMinCLV() !== null && data.currentCLV < this.filterMinCLV()!) {
      return false;
    }
    if (this.filterMaxCLV() !== null && data.currentCLV > this.filterMaxCLV()!) {
      return false;
    }

    // Location filter
    const locationFilter = this.filterLocation().toLowerCase();
    if (locationFilter && !data.location?.toLowerCase().includes(locationFilter)) {
      return false;
    }

    return true;
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    const ds = this.dataSource();
    // Trigger filter by updating filter string
    ds.filter = Math.random().toString(); // Force re-filter

    // Emit filter change event
    this.filterChange.emit({
      segments: this.filterSegments(),
      minCLV: this.filterMinCLV() ?? undefined,
      maxCLV: this.filterMaxCLV() ?? undefined,
      location: this.filterLocation() || undefined
    });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterSegments.set([]);
    this.filterMinCLV.set(null);
    this.filterMaxCLV.set(null);
    this.filterLocation.set('');
    this.filterSearch.set('');
    this.applyFilters();
  }

  /**
   * Handle search input
   */
  onSearchChange(value: string): void {
    this.filterSearch.set(value);
    this.applyFilters();
  }

  // =========================================================================
  // SELECTION METHODS
  // =========================================================================

  /**
   * Toggle all rows selection
   */
  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.select(...this.dataSource().data);
    }
  }

  /**
   * Checkbox label for accessibility
   */
  checkboxLabel(row?: CustomerCLVDetail): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.customerId}`;
  }

  // =========================================================================
  // SEGMENT HELPERS
  // =========================================================================

  /**
   * Get segment color
   */
  getSegmentColor(segment: CustomerSegment): 'primary' | 'accent' | 'warn' | undefined {
    switch (segment) {
      case 'VIP':
        return 'accent';
      case 'HIGH_VALUE':
      case 'ACTIVE':
        return 'primary';
      case 'AT_RISK':
      case 'DORMANT':
        return 'warn';
      default:
        return undefined;
    }
  }

  /**
   * Get segment icon
   */
  getSegmentIcon(segment: CustomerSegment): string {
    const icons: Record<CustomerSegment, string> = {
      VIP: 'stars',
      HIGH_VALUE: 'trending_up',
      ACTIVE: 'favorite',
      AT_RISK: 'warning',
      DORMANT: 'snooze',
      LOST: 'block'
    };
    return icons[segment];
  }

  /**
   * Format segment display name
   */
  formatSegmentName(segment: CustomerSegment): string {
    return segment.replace('_', ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }

  /**
   * Handle sort change
   */
  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  /**
   * Handle view customer
   */
  onViewCustomer(customer: CustomerCLVDetail): void {
    this.viewCustomer.emit(customer);
  }

  /**
   * Toggle row expansion
   */
  toggleExpand(row: CustomerCLVDetail): void {
    const current = this.expandedRow();
    this.expandedRow.set(current === row ? null : row);
  }

  /**
   * Export selected or all
   */
  onExport(format: 'csv' | 'excel', selectedOnly: boolean = false): void {
    this.exportData.emit({
      format,
      selection: selectedOnly ? this.selection.selected : undefined
    });
  }

  /**
   * Calculate churn risk color
   */
  getChurnRiskColor(risk: number | undefined): string {
    if (!risk) return 'text-gray-500';
    if (risk >= 0.7) return 'text-red-600';
    if (risk >= 0.4) return 'text-amber-600';
    return 'text-emerald-600';
  }

  /**
   * Track function for table rows
   */
  trackByCustomerId(index: number, item: CustomerCLVDetail): number {
    return item.customerId;
  }
}

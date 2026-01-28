/**
 * @file top-customers.component.ts
 * @description Top Customers component displaying highest-value customers by CLV.
 *              Features sortable table, search, and customer detail drill-down.
 * @module AdminDashboard/Analytics/CLV
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';

import { BiAnalyticsService } from '../../../../services/bi-analytics.service';
import { BiChartWrapperComponent, BiKpiCardComponent } from '../../../../shared/components';
import { HighValueCustomer, CLVAnalyticsQuery, CustomerSegmentTier } from '../../../../interfaces';

/**
 * Sort configuration
 */
interface SortConfig {
  /** Column to sort by */
  column: keyof HighValueCustomer | '';
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Top Customers Component
 * @description High-value customer rankings featuring:
 *              - Sortable customer list by various metrics
 *              - Search and filtering capabilities
 *              - Customer detail view
 *              - Export functionality
 *
 * @example
 * ```html
 * <app-top-customers />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-top-customers',
  templateUrl: './top-customers.component.html',
  styleUrls: ['./top-customers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    BiChartWrapperComponent,
    BiKpiCardComponent
  ]
})
export class TopCustomersComponent implements OnInit {
  // =========================================================================
  // Dependencies
  // =========================================================================

  private readonly biAnalyticsService = inject(BiAnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // State Signals
  // =========================================================================

  /**
   * Loading state
   */
  readonly loading = signal<boolean>(true);

  /**
   * Error state
   */
  readonly error = signal<string | null>(null);

  /**
   * All customers data
   */
  readonly customers = signal<HighValueCustomer[]>([]);

  /**
   * Search query
   */
  readonly searchQuery = signal<string>('');

  /**
   * Selected segment filter
   */
  readonly selectedSegment = signal<CustomerSegmentTier | 'all'>('all');

  /**
   * Sort configuration
   */
  readonly sortConfig = signal<SortConfig>({ column: 'clv', direction: 'desc' });

  /**
   * Items per page
   */
  readonly pageSize = signal<number>(20);

  /**
   * Current page
   */
  readonly currentPage = signal<number>(1);

  /**
   * Selected customer for detail view
   */
  readonly selectedCustomer = signal<HighValueCustomer | null>(null);

  // =========================================================================
  // Computed Properties
  // =========================================================================

  /**
   * Summary statistics
   */
  readonly summary = computed(() => {
    const custs = this.customers();
    if (custs.length === 0) return null;

    const totalCLV = custs.reduce((sum, c) => sum + c.clv, 0);
    const avgCLV = totalCLV / custs.length;
    const totalOrders = custs.reduce((sum, c) => sum + c.orderCount, 0);
    const avgOrderValue = custs.reduce((sum, c) => sum + c.avgOrderValue, 0) / custs.length;

    return {
      totalCLV,
      avgCLV,
      totalOrders,
      avgOrderValue,
      customerCount: custs.length
    };
  });

  /**
   * Filtered customers
   */
  readonly filteredCustomers = computed(() => {
    let result = [...this.customers()];
    const query = this.searchQuery().toLowerCase().trim();
    const segment = this.selectedSegment();

    // Apply search filter
    if (query) {
      result = result.filter(c =>
        c.customerId.toString().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.name && c.name.toLowerCase().includes(query))
      );
    }

    // Apply segment filter
    if (segment !== 'all') {
      result = result.filter(c => c.segment === segment);
    }

    return result;
  });

  /**
   * Sorted customers
   */
  readonly sortedCustomers = computed(() => {
    const filtered = this.filteredCustomers();
    const config = this.sortConfig();

    if (!config.column) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[config.column as keyof HighValueCustomer];
      const bVal = b[config.column as keyof HighValueCustomer];

      if (aVal === undefined || bVal === undefined) return 0;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      }

      return config.direction === 'desc' ? -comparison : comparison;
    });
  });

  /**
   * Paginated customers
   */
  readonly paginatedCustomers = computed(() => {
    const sorted = this.sortedCustomers();
    const page = this.currentPage();
    const size = this.pageSize();

    const start = (page - 1) * size;
    const end = start + size;

    return sorted.slice(start, end);
  });

  /**
   * Total pages
   */
  readonly totalPages = computed(() => {
    return Math.ceil(this.filteredCustomers().length / this.pageSize());
  });

  /**
   * Segment options for filter
   */
  readonly segmentOptions: Array<{ value: CustomerSegmentTier | 'all'; label: string }> = [
    { value: 'all', label: 'All Segments' },
    { value: 'platinum', label: 'Platinum' },
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'bronze', label: 'Bronze' }
  ];

  // =========================================================================
  // Lifecycle Hooks
  // =========================================================================

  ngOnInit(): void {
    this.loadData();
  }

  // =========================================================================
  // Data Loading
  // =========================================================================

  /**
   * Load top customers data
   */
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: CLVAnalyticsQuery = {
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      topCustomersLimit: 100
    };

    this.biAnalyticsService.getTopCLVCustomers(query)
      .pipe(
        catchError(err => {
          console.error('Error loading top customers:', err);
          this.error.set('Failed to load top customers.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.customers.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  /**
   * Refresh data
   */
  onRefresh(): void {
    this.loadData();
  }

  // =========================================================================
  // Event Handlers
  // =========================================================================

  /**
   * Handle search input
   */
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  /**
   * Handle segment filter change
   */
  onSegmentChange(segment: CustomerSegmentTier | 'all'): void {
    this.selectedSegment.set(segment);
    this.currentPage.set(1);
  }

  /**
   * Handle column sort
   */
  onSort(column: keyof HighValueCustomer): void {
    const current = this.sortConfig();
    if (current.column === column) {
      this.sortConfig.set({
        column,
        direction: current.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      this.sortConfig.set({ column, direction: 'desc' });
    }
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  /**
   * View customer details
   */
  onViewCustomer(customer: HighValueCustomer): void {
    this.selectedCustomer.set(customer);
  }

  /**
   * Close customer detail
   */
  closeCustomerDetail(): void {
    this.selectedCustomer.set(null);
  }

  /**
   * Export customers list
   */
  onExport(format: string): void {
    console.log('Export customers as:', format);
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Format currency value
   */
  formatCurrency(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M SYP`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K SYP`;
    }
    return `${value.toLocaleString()} SYP`;
  }

  /**
   * Get segment color
   */
  getSegmentColor(segment: CustomerSegmentTier): string {
    const colors: Record<CustomerSegmentTier, string> = {
      platinum: '#6366f1',
      gold: '#f59e0b',
      silver: '#94a3b8',
      bronze: '#d97706',
      at_risk: '#ef4444',
      churned: '#6b7280'
    };
    return colors[segment] || '#9ca3af';
  }

  /**
   * Get segment label
   */
  getSegmentLabel(segment: CustomerSegmentTier): string {
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace('_', ' ');
  }

  /**
   * Get sort icon
   */
  getSortIcon(column: keyof HighValueCustomer): string {
    const config = this.sortConfig();
    if (config.column !== column) return 'unfold_more';
    return config.direction === 'asc' ? 'expand_less' : 'expand_more';
  }

  /**
   * Check if column is sorted
   */
  isSorted(column: keyof HighValueCustomer): boolean {
    return this.sortConfig().column === column;
  }

  /**
   * Get default start date
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Track customers
   */
  trackByCustomer(index: number, customer: HighValueCustomer): number {
    return customer.customerId;
  }

  /**
   * Generate page numbers
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}

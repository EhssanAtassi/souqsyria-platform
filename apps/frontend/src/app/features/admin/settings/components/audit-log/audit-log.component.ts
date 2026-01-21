/**
 * @file audit-log.component.ts
 * @description Audit log viewer component.
 *              Displays and filters administrative action history.
 * @module AdminDashboard/Settings
 */

import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SettingsService } from '../../services/settings.service';
import {
  AuditLogEntry,
  AuditLogFilter,
  AuditLogResponse,
  AuditAction
} from '../../interfaces/settings.interface';

/**
 * Audit Log Component
 * @description View and filter administrative action history
 *
 * @example
 * ```html
 * <app-audit-log></app-audit-log>
 * ```
 *
 * @features
 * - Paginated log entries
 * - Filter by action type, date, user
 * - Search functionality
 * - Export to CSV/Excel
 * - Entry detail view
 */
@Component({
  standalone: true,
  selector: 'app-audit-log',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditLogComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /** Settings service for API calls */
  private readonly settingsService = inject(SettingsService);

  /** Subject for managing subscription cleanup */
  private readonly destroy$ = new Subject<void>();

  /** Subject for search debouncing */
  private readonly searchSubject = new Subject<string>();

  // ===========================================================================
  // STATE
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Exporting state */
  readonly isExporting = signal<boolean>(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** Audit log entries */
  readonly entries = signal<AuditLogEntry[]>([]);

  /** Total entry count */
  readonly totalEntries = signal<number>(0);

  /** Current page */
  readonly currentPage = signal<number>(1);

  /** Page size */
  readonly pageSize = signal<number>(20);

  /** Total pages */
  readonly totalPages = signal<number>(1);

  /** Search query */
  readonly searchQuery = signal<string>('');

  /** Selected action filter */
  readonly selectedAction = signal<AuditAction | ''>('');

  /** Selected resource type filter */
  readonly selectedResourceType = signal<string>('');

  /** Start date filter */
  readonly startDate = signal<string>('');

  /** End date filter */
  readonly endDate = signal<string>('');

  /** Selected entry for detail view */
  readonly selectedEntry = signal<AuditLogEntry | null>(null);

  // ===========================================================================
  // STATIC DATA
  // ===========================================================================

  /** Available action types for filtering */
  readonly actionTypes: { value: AuditAction | ''; label: string }[] = [
    { value: '', label: 'All Actions' },
    { value: 'user.create', label: 'User Created' },
    { value: 'user.update', label: 'User Updated' },
    { value: 'user.delete', label: 'User Deleted' },
    { value: 'user.status_change', label: 'User Status Changed' },
    { value: 'user.role_change', label: 'User Role Changed' },
    { value: 'product.create', label: 'Product Created' },
    { value: 'product.update', label: 'Product Updated' },
    { value: 'product.approve', label: 'Product Approved' },
    { value: 'product.reject', label: 'Product Rejected' },
    { value: 'order.status_change', label: 'Order Status Changed' },
    { value: 'order.refund', label: 'Order Refunded' },
    { value: 'vendor.verify', label: 'Vendor Verified' },
    { value: 'vendor.suspend', label: 'Vendor Suspended' },
    { value: 'vendor.payout', label: 'Vendor Payout' },
    { value: 'settings.update', label: 'Settings Updated' },
    { value: 'login', label: 'Admin Login' },
    { value: 'logout', label: 'Admin Logout' }
  ];

  /** Resource types for filtering */
  readonly resourceTypes = [
    { value: '', label: 'All Resources' },
    { value: 'User', label: 'Users' },
    { value: 'Product', label: 'Products' },
    { value: 'Order', label: 'Orders' },
    { value: 'Vendor', label: 'Vendors' },
    { value: 'Settings', label: 'Settings' }
  ];

  /** Page size options */
  readonly pageSizeOptions = [10, 20, 50, 100];

  // ===========================================================================
  // COMPUTED
  // ===========================================================================

  /** Check if there are active filters */
  readonly hasActiveFilters = computed(() =>
    this.selectedAction() !== '' ||
    this.selectedResourceType() !== '' ||
    this.startDate() !== '' ||
    this.endDate() !== '' ||
    this.searchQuery() !== ''
  );

  /** Current filter state */
  readonly currentFilters = computed<AuditLogFilter>(() => ({
    action: this.selectedAction() || undefined,
    resourceType: this.selectedResourceType() || undefined,
    startDate: this.startDate() || undefined,
    endDate: this.endDate() || undefined,
    search: this.searchQuery() || undefined
  }));

  /** Pagination info text */
  readonly paginationInfo = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), this.totalEntries());
    return `${start}-${end} of ${this.totalEntries()}`;
  });

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Initialize component and load data
   */
  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadAuditLog();
  }

  /**
   * Cleanup subscriptions on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Setup search debouncing
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        this.searchQuery.set(query);
        this.currentPage.set(1);
        this.loadAuditLog();
      });
  }

  /**
   * Load audit log entries
   */
  loadAuditLog(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.settingsService.getAuditLog(
      this.currentFilters(),
      this.currentPage(),
      this.pageSize()
    )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: AuditLogResponse) => {
          this.entries.set(response.data);
          this.totalEntries.set(response.total);
          this.totalPages.set(response.totalPages);
        },
        error: (err) => {
          console.error('Failed to load audit log:', err);
          this.errorMessage.set('Failed to load audit log. Please try again.');
        }
      });
  }

  // ===========================================================================
  // FILTER ACTIONS
  // ===========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Apply action filter
   * @param action - Selected action
   */
  setActionFilter(action: AuditAction | ''): void {
    this.selectedAction.set(action);
    this.currentPage.set(1);
    this.loadAuditLog();
  }

  /**
   * Apply resource type filter
   * @param resourceType - Selected resource type
   */
  setResourceTypeFilter(resourceType: string): void {
    this.selectedResourceType.set(resourceType);
    this.currentPage.set(1);
    this.loadAuditLog();
  }

  /**
   * Apply date range filter
   */
  applyDateFilter(): void {
    this.currentPage.set(1);
    this.loadAuditLog();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedAction.set('');
    this.selectedResourceType.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.currentPage.set(1);
    this.loadAuditLog();
  }

  // ===========================================================================
  // PAGINATION
  // ===========================================================================

  /**
   * Go to specific page
   * @param page - Page number
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadAuditLog();
  }

  /**
   * Change page size
   * @param size - New page size
   */
  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadAuditLog();
  }

  /**
   * Get visible page numbers
   * @returns Array of page numbers to display
   */
  getVisiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);

      if (current > 3) pages.push(-1); // Ellipsis

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1); // Ellipsis

      pages.push(total);
    }

    return pages;
  }

  // ===========================================================================
  // EXPORT
  // ===========================================================================

  /**
   * Export audit log
   * @param format - Export format
   */
  exportLog(format: 'csv' | 'xlsx' | 'pdf'): void {
    this.isExporting.set(true);

    this.settingsService.exportAuditLog(this.currentFilters(), format)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isExporting.set(false))
      )
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `audit-log-${new Date().toISOString().split('T')[0]}.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: (err) => {
          console.error('Failed to export:', err);
          this.errorMessage.set('Failed to export audit log.');
        }
      });
  }

  // ===========================================================================
  // ENTRY DETAIL
  // ===========================================================================

  /**
   * View entry details
   * @param entry - Audit log entry
   */
  viewEntryDetail(entry: AuditLogEntry): void {
    this.selectedEntry.set(entry);
  }

  /**
   * Close entry detail modal
   */
  closeEntryDetail(): void {
    this.selectedEntry.set(null);
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get icon for action type
   * @param action - Action type
   * @returns Material icon name
   */
  getActionIcon(action: AuditAction): string {
    const icons: Record<string, string> = {
      'user.create': 'person_add',
      'user.update': 'person',
      'user.delete': 'person_remove',
      'user.status_change': 'toggle_on',
      'user.role_change': 'admin_panel_settings',
      'product.create': 'add_box',
      'product.update': 'edit',
      'product.delete': 'delete',
      'product.approve': 'check_circle',
      'product.reject': 'cancel',
      'order.status_change': 'local_shipping',
      'order.refund': 'money_off',
      'vendor.verify': 'verified',
      'vendor.suspend': 'block',
      'vendor.payout': 'payments',
      'settings.update': 'settings',
      'role.create': 'add_moderator',
      'role.update': 'manage_accounts',
      'role.delete': 'remove_moderator',
      'permission.update': 'lock',
      'login': 'login',
      'logout': 'logout'
    };
    return icons[action] || 'history';
  }

  /**
   * Get color class for action type
   * @param action - Action type
   * @returns Color class
   */
  getActionColor(action: AuditAction): string {
    if (action.includes('create') || action.includes('approve') || action.includes('verify')) {
      return 'action--success';
    }
    if (action.includes('delete') || action.includes('reject') || action.includes('suspend')) {
      return 'action--danger';
    }
    if (action.includes('update') || action.includes('change')) {
      return 'action--warning';
    }
    if (action === 'login' || action === 'logout') {
      return 'action--info';
    }
    return 'action--default';
  }

  /**
   * Get display label for action
   * @param action - Action type
   * @returns Human-readable label
   */
  getActionLabel(action: AuditAction): string {
    return this.actionTypes.find(a => a.value === action)?.label || action;
  }

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format full date for detail view
   * @param dateString - ISO date string
   * @returns Full formatted date
   */
  formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Track function for entries
   * @param index - Array index
   * @param entry - Entry item
   * @returns Unique identifier
   */
  trackByEntry(index: number, entry: AuditLogEntry): string {
    return entry.id;
  }

  /**
   * Track function for pages
   * @param index - Array index
   * @param page - Page number
   * @returns Unique identifier
   */
  trackByPage(index: number, page: number): number {
    return page;
  }
}

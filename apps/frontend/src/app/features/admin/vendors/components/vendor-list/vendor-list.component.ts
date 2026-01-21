/**
 * @file vendor-list.component.ts
 * @description Vendor listing component for admin dashboard.
 *              Displays vendors with filtering, search, and statistics.
 * @module AdminDashboard/Vendors/Components
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil, finalize, debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminVendorsService } from '../../../services';
import { CurrencyFormatPipe } from '../../../shared';
import {
  VendorListItem,
  VendorListQuery,
  VendorVerificationStatus,
  VendorAccountStatus
} from '../../../interfaces';

/**
 * Vendor statistics interface
 * @description Summary statistics for vendor listing
 */
interface VendorStats {
  /** Total vendors count */
  total: number;
  /** Active vendors */
  active: number;
  /** Inactive vendors */
  inactive: number;
  /** Suspended vendors */
  suspended: number;
  /** Pending verification */
  pendingVerification: number;
  /** Verified this month */
  verifiedThisMonth: number;
  /** Average rating */
  averageRating: number;
  /** Total sales */
  totalSales: number;
  /** Total commissions collected */
  totalCommissions: number;
}

/**
 * Vendor List Component
 * @description Displays paginated vendor list with filtering and statistics.
 *
 * @features
 * - Statistics dashboard
 * - Search by shop name or owner
 * - Filter by verification status
 * - Filter by account status
 * - Sort by various fields
 * - Quick actions (suspend, activate, view)
 * - Export functionality
 *
 * @example
 * ```html
 * <!-- Routed via /admin/vendors -->
 * <app-vendor-list></app-vendor-list>
 * ```
 */
@Component({
  selector: 'app-vendor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './vendor-list.component.html',
  styleUrl: './vendor-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VendorListComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly vendorsService = inject(AdminVendorsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(true);

  /** Vendors list */
  readonly vendors = signal<VendorListItem[]>([]);

  /** Pagination info */
  readonly pagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  /** Vendor statistics */
  readonly stats = signal<VendorStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pendingVerification: 0,
    verifiedThisMonth: 0,
    averageRating: 0,
    totalSales: 0,
    totalCommissions: 0
  });

  /** Search term */
  readonly searchTerm = signal('');

  /** Verification status filter */
  readonly verificationFilter = signal<VendorVerificationStatus | 'all'>('all');

  /** Account status filter */
  readonly accountFilter = signal<VendorAccountStatus | 'all'>('all');

  /** Sort field */
  readonly sortBy = signal<string>('createdAt');

  /** Sort order */
  readonly sortOrder = signal<'asc' | 'desc'>('desc');

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Total pages array for pagination */
  readonly pagesArray = computed(() => {
    const totalPages = this.pagination().totalPages;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  });

  /** Active filters count */
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.verificationFilter() !== 'all') count++;
    if (this.accountFilter() !== 'all') count++;
    if (this.searchTerm()) count++;
    return count;
  });

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  /** Verification status options */
  readonly verificationStatuses: { value: VendorVerificationStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'documents_requested', label: 'Documents Requested' },
    { value: 'documents_resubmitted', label: 'Documents Resubmitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'expired', label: 'Expired' },
    { value: 'revoked', label: 'Revoked' }
  ];

  /** Account status options */
  readonly accountStatuses: { value: VendorAccountStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Accounts' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' }
  ];

  /** Sort options */
  readonly sortOptions = [
    { value: 'createdAt', label: 'Date Joined' },
    { value: 'shopName', label: 'Shop Name' },
    { value: 'totalSales', label: 'Total Sales' },
    { value: 'rating', label: 'Rating' },
    { value: 'verificationStatus', label: 'Verification Status' }
  ];

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.setupSearch();
    this.loadVendors();
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Setup search with debounce
   */
  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(term => {
        this.searchTerm.set(term);
        this.pagination.update(p => ({ ...p, page: 1 }));
        this.loadVendors();
      });
  }

  /**
   * Load vendors with current filters
   */
  loadVendors(): void {
    this.isLoading.set(true);

    const query: VendorListQuery = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      sortBy: this.sortBy() as any,
      sortOrder: this.sortOrder()
    };

    // Apply filters
    const search = this.searchTerm();
    if (search) query.search = search;

    const verification = this.verificationFilter();
    if (verification !== 'all') query.verificationStatus = verification;

    const account = this.accountFilter();
    if (account !== 'all') query.accountStatus = account;

    this.vendorsService
      .getVendors(query)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.vendors.set(response.data);
          this.pagination.set({
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages
          });
        },
        error: (error) => {
          console.error('Error loading vendors:', error);
          this.snackBar.open('Failed to load vendors', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Load vendor statistics
   */
  loadStatistics(): void {
    this.vendorsService
      .getVendorStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats.set({
            total: data.total,
            active: data.active,
            inactive: data.inactive,
            suspended: data.suspended,
            pendingVerification: data.pendingVerification,
            verifiedThisMonth: data.verifiedThisMonth,
            averageRating: data.averageRating,
            totalSales: data.totalSales,
            totalCommissions: data.totalCommissions
          });
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadVendors();
    this.loadStatistics();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }

  // =========================================================================
  // FILTERING & SEARCH
  // =========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  /**
   * Apply verification status filter
   * @param status - Status to filter by
   */
  applyVerificationFilter(status: VendorVerificationStatus | 'all'): void {
    this.verificationFilter.set(status);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadVendors();
  }

  /**
   * Apply account status filter
   * @param status - Status to filter by
   */
  applyAccountFilter(status: VendorAccountStatus | 'all'): void {
    this.accountFilter.set(status);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadVendors();
  }

  /**
   * Apply sorting
   * @param field - Field to sort by
   */
  applySort(field: string): void {
    if (this.sortBy() === field) {
      // Toggle sort order
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.loadVendors();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.verificationFilter.set('all');
    this.accountFilter.set('all');
    this.sortBy.set('createdAt');
    this.sortOrder.set('desc');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadVendors();
  }

  // =========================================================================
  // PAGINATION
  // =========================================================================

  /**
   * Go to specific page
   * @param page - Page number
   */
  goToPage(page: number): void {
    const totalPages = this.pagination().totalPages;
    if (page < 1 || page > totalPages) return;

    this.pagination.update(p => ({ ...p, page }));
    this.loadVendors();
  }

  /**
   * Change page size
   * @param limit - Items per page
   */
  changePageSize(limit: number): void {
    this.pagination.update(p => ({ ...p, page: 1, limit }));
    this.loadVendors();
  }

  // =========================================================================
  // VENDOR ACTIONS
  // =========================================================================

  /**
   * View vendor details
   * @param vendorId - Vendor ID
   */
  viewVendor(vendorId: number): void {
    this.router.navigate(['/admin/vendors', vendorId]);
  }

  /**
   * Suspend vendor
   * @param vendor - Vendor to suspend
   */
  suspendVendor(vendor: VendorListItem): void {
    const reason = prompt('Enter suspension reason:');
    if (!reason) return;

    this.vendorsService
      .suspendVendor(vendor.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`${vendor.shopName} suspended`, 'Close', { duration: 3000 });
          this.loadVendors();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Suspend failed:', error);
          this.snackBar.open('Failed to suspend vendor', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Activate vendor
   * @param vendor - Vendor to activate
   */
  activateVendor(vendor: VendorListItem): void {
    this.vendorsService
      .activateVendor(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`${vendor.shopName} activated`, 'Close', { duration: 3000 });
          this.loadVendors();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Activation failed:', error);
          this.snackBar.open('Failed to activate vendor', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Ban vendor
   * @param vendor - Vendor to ban
   */
  banVendor(vendor: VendorListItem): void {
    const reason = prompt('Enter ban reason (this action is permanent):');
    if (!reason) return;

    if (!confirm(`Are you sure you want to permanently ban ${vendor.shopName}?`)) {
      return;
    }

    this.vendorsService
      .banVendor(vendor.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`${vendor.shopName} has been banned`, 'Close', { duration: 3000 });
          this.loadVendors();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Ban failed:', error);
          this.snackBar.open('Failed to ban vendor', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Export vendors
   * @param format - Export format
   */
  exportVendors(format: 'csv' | 'xlsx'): void {
    const query: VendorListQuery = {};

    const search = this.searchTerm();
    if (search) query.search = search;

    const verification = this.verificationFilter();
    if (verification !== 'all') query.verificationStatus = verification;

    const account = this.accountFilter();
    if (account !== 'all') query.accountStatus = account;

    this.vendorsService
      .exportVendors(format, query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vendors-export.${format}`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Export completed', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.snackBar.open('Failed to export vendors', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Navigate to verification queue
   */
  goToVerifications(): void {
    this.router.navigate(['/admin/vendors/verifications']);
  }

  /**
   * Navigate to payouts
   */
  goToPayouts(): void {
    this.router.navigate(['/admin/vendors/payouts']);
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get verification status class
   * @param status - Verification status
   * @returns CSS class name
   */
  getVerificationClass(status: VendorVerificationStatus): string {
    const classMap: Record<VendorVerificationStatus, string> = {
      pending: 'warning',
      under_review: 'info',
      documents_requested: 'warning',
      documents_resubmitted: 'info',
      approved: 'success',
      rejected: 'danger',
      suspended: 'danger',
      expired: 'secondary',
      revoked: 'danger'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get verification status label
   * @param status - Verification status
   * @returns Human-readable label
   */
  getVerificationLabel(status: VendorVerificationStatus): string {
    const labelMap: Record<VendorVerificationStatus, string> = {
      pending: 'Pending',
      under_review: 'Under Review',
      documents_requested: 'Docs Requested',
      documents_resubmitted: 'Docs Resubmitted',
      approved: 'Approved',
      rejected: 'Rejected',
      suspended: 'Suspended',
      expired: 'Expired',
      revoked: 'Revoked'
    };
    return labelMap[status] || status;
  }

  /**
   * Get account status class
   * @param status - Account status
   * @returns CSS class name
   */
  getAccountClass(status: VendorAccountStatus): string {
    const classMap: Record<VendorAccountStatus, string> = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'warning',
      banned: 'danger'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get account status label
   * @param status - Account status
   * @returns Human-readable label
   */
  getAccountLabel(status: VendorAccountStatus): string {
    const labelMap: Record<VendorAccountStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      banned: 'Banned'
    };
    return labelMap[status] || status;
  }

  /**
   * Format date
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Track vendors by ID
   * @param index - Index in list
   * @param vendor - Vendor item
   * @returns Vendor ID
   */
  trackByVendorId(index: number, vendor: VendorListItem): number {
    return vendor.id;
  }
}

/**
 * Payout List Component
 * @description Manages vendor payout requests - view, approve, process, reject
 * @module VendorsModule
 */
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { AdminVendorsService } from '../../../services/admin-vendors.service';
import {
  PayoutRequestItem,
  PayoutStatus,
  ProcessPayoutRequest,
  PaginatedResponse
} from '../../../interfaces/api-response.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

/**
 * Statistics interface for payout queue
 * @description Tracks amounts and counts by status
 */
interface PayoutStats {
  /** Total pending payouts */
  pendingCount: number;
  /** Total pending amount */
  pendingAmount: number;
  /** Processing count */
  processingCount: number;
  /** Completed this month */
  completedThisMonth: number;
  /** Completed amount this month */
  completedAmountThisMonth: number;
  /** Failed/On-hold count */
  issuesCount: number;
}

/**
 * Payout List Component
 * @description Handles vendor payout workflow with filtering and batch operations
 */
@Component({
  selector: 'app-payout-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './payout-list.component.html',
  styleUrls: ['./payout-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayoutListComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================
  private readonly vendorsService = inject(AdminVendorsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  // ===========================================================================
  // STATE SIGNALS
  // ===========================================================================

  /** List of payout requests */
  readonly payouts = signal<PayoutRequestItem[]>([]);

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Processing state for actions */
  readonly isProcessing = signal<boolean>(false);

  /** Statistics for payouts */
  readonly stats = signal<PayoutStats>({
    pendingCount: 0,
    pendingAmount: 0,
    processingCount: 0,
    completedThisMonth: 0,
    completedAmountThisMonth: 0,
    issuesCount: 0
  });

  /** Current status filter */
  readonly statusFilter = signal<PayoutStatus | 'all'>('all');

  /** Search term */
  readonly searchTerm = signal<string>('');

  /** Sort option */
  readonly sortBy = signal<string>('newest');

  /** Pagination state */
  readonly pagination = signal<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0
  });

  /** Selected payout for actions */
  readonly selectedPayout = signal<PayoutRequestItem | null>(null);

  /** Show process dialog */
  readonly showProcessDialog = signal<boolean>(false);

  /** Show reject dialog */
  readonly showRejectDialog = signal<boolean>(false);

  /** Process form data */
  readonly processFormData = signal<{
    transactionReference: string;
    notes: string;
    notifyVendor: boolean;
  }>({
    transactionReference: '',
    notes: '',
    notifyVendor: true
  });

  /** Reject form data */
  readonly rejectFormData = signal<{
    reason: string;
    notes: string;
    notifyVendor: boolean;
  }>({
    reason: '',
    notes: '',
    notifyVendor: true
  });

  // ===========================================================================
  // COMPUTED PROPERTIES
  // ===========================================================================

  /** Filtered payouts based on search and status */
  readonly filteredPayouts = computed(() => {
    let items = this.payouts();
    const status = this.statusFilter();
    const search = this.searchTerm().toLowerCase();
    const sort = this.sortBy();

    // Apply status filter
    if (status !== 'all') {
      items = items.filter(p => p.status === status);
    }

    // Apply search filter
    if (search) {
      items = items.filter(p =>
        p.shopName.toLowerCase().includes(search) ||
        p.id.toString().includes(search)
      );
    }

    // Apply sorting
    items = [...items].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
        case 'oldest':
          return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
        case 'amount_high':
          return b.amount - a.amount;
        case 'amount_low':
          return a.amount - b.amount;
        case 'shop':
          return a.shopName.localeCompare(b.shopName);
        default:
          return 0;
      }
    });

    return items;
  });

  /** Pages array for pagination */
  readonly pagesArray = computed(() => {
    const totalPages = this.pagination().totalPages;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  });

  /** Count of active filters */
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.statusFilter() !== 'all') count++;
    if (this.searchTerm()) count++;
    return count;
  });

  // ===========================================================================
  // STATIC DATA
  // ===========================================================================

  /** Status filter options */
  readonly statusOptions: Array<{ value: PayoutStatus | 'all'; label: string }> = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  /** Sort options */
  readonly sortOptions: Array<{ value: string; label: string }> = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'amount_high', label: 'Amount (High to Low)' },
    { value: 'amount_low', label: 'Amount (Low to High)' },
    { value: 'shop', label: 'Shop Name (A-Z)' }
  ];

  /** Rejection reasons */
  readonly rejectionReasons: Array<{ value: string; label: string }> = [
    { value: 'insufficient_balance', label: 'Insufficient Balance' },
    { value: 'invalid_bank_details', label: 'Invalid Bank Details' },
    { value: 'verification_required', label: 'Additional Verification Required' },
    { value: 'suspicious_activity', label: 'Suspicious Activity' },
    { value: 'policy_violation', label: 'Policy Violation' },
    { value: 'vendor_request', label: 'Vendor Request' },
    { value: 'other', label: 'Other' }
  ];

  // ===========================================================================
  // LIFECYCLE HOOKS
  // ===========================================================================

  ngOnInit(): void {
    this.loadPayouts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Load pending payouts from API
   * @description Fetches payout queue with current filters
   */
  loadPayouts(): void {
    this.isLoading.set(true);

    this.vendorsService.getPendingPayouts({
      page: this.pagination().page,
      limit: this.pagination().limit,
      status: this.statusFilter() !== 'all' ? this.statusFilter() as PayoutStatus : undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<PayoutRequestItem>) => {
          this.payouts.set(response.data);
          this.pagination.set({
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages
          });
          this.calculateStats(response.data);
        },
        error: (error) => {
          console.error('Error loading payouts:', error);
          this.snackBar.open('Failed to load payout requests', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  /**
   * Calculate payout statistics
   * @param items - Payout items to analyze
   */
  private calculateStats(items: PayoutRequestItem[]): void {
    const pending = items.filter(p => p.status === 'pending');
    const processing = items.filter(p => p.status === 'processing');
    const completed = items.filter(p => p.status === 'completed');
    const issues = items.filter(p => p.status === 'failed' || p.status === 'on_hold');

    const stats: PayoutStats = {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
      processingCount: processing.length,
      completedThisMonth: completed.length,
      completedAmountThisMonth: completed.reduce((sum, p) => sum + p.amount, 0),
      issuesCount: issues.length
    };
    this.stats.set(stats);
  }

  // ===========================================================================
  // FILTER ACTIONS
  // ===========================================================================

  /**
   * Apply status filter
   * @param status - Status to filter by
   */
  applyStatusFilter(status: PayoutStatus | 'all'): void {
    this.statusFilter.set(status);
    this.pagination.set({ ...this.pagination(), page: 1 });
    this.loadPayouts();
  }

  /**
   * Apply sort option
   * @param sortBy - Sort field
   */
  applySort(sortBy: string): void {
    this.sortBy.set(sortBy);
  }

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.statusFilter.set('all');
    this.searchTerm.set('');
    this.sortBy.set('newest');
    this.pagination.set({ ...this.pagination(), page: 1 });
    this.loadPayouts();
  }

  /**
   * Refresh the queue
   */
  refresh(): void {
    this.loadPayouts();
  }

  // ===========================================================================
  // PAGINATION
  // ===========================================================================

  /**
   * Navigate to specific page
   * @param page - Page number
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination().totalPages) {
      this.pagination.set({ ...this.pagination(), page });
      this.loadPayouts();
    }
  }

  /**
   * Change page size
   * @param size - New page size
   */
  changePageSize(size: number): void {
    this.pagination.set({ ...this.pagination(), limit: size, page: 1 });
    this.loadPayouts();
  }

  // ===========================================================================
  // PROCESS DIALOG
  // ===========================================================================

  /**
   * Open process payout dialog
   * @param payout - Payout to process
   */
  openProcessDialog(payout: PayoutRequestItem): void {
    this.selectedPayout.set(payout);
    this.processFormData.set({
      transactionReference: '',
      notes: '',
      notifyVendor: true
    });
    this.showProcessDialog.set(true);
  }

  /**
   * Close process dialog
   */
  closeProcessDialog(): void {
    this.showProcessDialog.set(false);
    this.selectedPayout.set(null);
  }

  /**
   * Submit payout processing
   */
  submitProcess(): void {
    const payout = this.selectedPayout();
    if (!payout) return;

    const formData = this.processFormData();

    this.isProcessing.set(true);
    this.vendorsService.processPayout(payout.id, {
      amount: payout.amount,
      paymentMethod: payout.paymentMethod,
      transactionReference: formData.transactionReference || undefined,
      notes: formData.notes || undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(`Payout of ${payout.amount.toLocaleString()} SYP processed successfully`, 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.closeProcessDialog();
          this.loadPayouts();
        },
        error: (error) => {
          console.error('Error processing payout:', error);
          this.snackBar.open('Failed to process payout', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  // ===========================================================================
  // REJECT DIALOG
  // ===========================================================================

  /**
   * Open reject payout dialog
   * @param payout - Payout to reject
   */
  openRejectDialog(payout: PayoutRequestItem): void {
    this.selectedPayout.set(payout);
    this.rejectFormData.set({
      reason: '',
      notes: '',
      notifyVendor: true
    });
    this.showRejectDialog.set(true);
  }

  /**
   * Close reject dialog
   */
  closeRejectDialog(): void {
    this.showRejectDialog.set(false);
    this.selectedPayout.set(null);
  }

  /**
   * Submit payout rejection
   */
  submitReject(): void {
    const payout = this.selectedPayout();
    if (!payout) return;

    const formData = this.rejectFormData();

    if (!formData.reason) {
      this.snackBar.open('Please select a rejection reason', 'Close', { duration: 3000 });
      return;
    }

    this.isProcessing.set(true);
    this.vendorsService.rejectPayout(payout.id, {
      reason: formData.reason,
      notes: formData.notes || undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Payout request rejected', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.closeRejectDialog();
          this.loadPayouts();
        },
        error: (error) => {
          console.error('Error rejecting payout:', error);
          this.snackBar.open('Failed to reject payout', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  // ===========================================================================
  // QUICK ACTIONS
  // ===========================================================================

  /**
   * Quick approve and process payout
   * @param payout - Payout to process
   */
  quickProcess(payout: PayoutRequestItem): void {
    if (!confirm(`Process payout of ${payout.amount.toLocaleString()} SYP for ${payout.shopName}?`)) {
      return;
    }

    this.isProcessing.set(true);
    this.vendorsService.processPayout(payout.id, {
      amount: payout.amount,
      paymentMethod: payout.paymentMethod,
      notes: 'Quick processing from payout queue'
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Payout processed successfully', 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          this.loadPayouts();
        },
        error: (error) => {
          console.error('Error processing payout:', error);
          this.snackBar.open('Failed to process payout', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  /**
   * Put payout on hold
   * @param payout - Payout to hold
   */
  putOnHold(payout: PayoutRequestItem): void {
    if (!confirm(`Put payout for ${payout.shopName} on hold?`)) {
      return;
    }

    this.isProcessing.set(true);
    this.vendorsService.rejectPayout(payout.id, {
      reason: 'on_hold',
      notes: 'Put on hold for review'
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Payout put on hold', 'Close', { duration: 3000 });
          this.loadPayouts();
        },
        error: (error) => {
          console.error('Error putting payout on hold:', error);
          this.snackBar.open('Failed to put payout on hold', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  /**
   * Navigate to vendor detail
   * @param vendorId - Vendor ID
   */
  goToVendorDetail(vendorId: number): void {
    this.router.navigate(['/admin/vendors', vendorId]);
  }

  /**
   * Navigate back to vendor list
   */
  goToVendorList(): void {
    this.router.navigate(['/admin/vendors']);
  }

  /**
   * Export payouts
   * @param format - Export format (csv or xlsx)
   */
  exportPayouts(format: 'csv' | 'xlsx'): void {
    this.snackBar.open(`Exporting payouts as ${format.toUpperCase()}...`, 'Close', { duration: 2000 });
    // TODO: Implement actual export functionality
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format date with time
   * @param date - Date to format
   * @returns Formatted datetime string
   */
  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status display label
   * @param status - Payout status
   * @returns Human-readable label
   */
  getStatusLabel(status: PayoutStatus): string {
    const labels: Record<PayoutStatus, string> = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      on_hold: 'On Hold'
    };
    return labels[status] || status;
  }

  /**
   * Get status icon
   * @param status - Payout status
   * @returns Material icon name
   */
  getStatusIcon(status: PayoutStatus): string {
    const icons: Record<PayoutStatus, string> = {
      pending: 'schedule',
      processing: 'sync',
      completed: 'check_circle',
      failed: 'error',
      cancelled: 'cancel',
      on_hold: 'pause_circle'
    };
    return icons[status] || 'help_outline';
  }

  /**
   * Check if payout can be processed
   * @param payout - Payout to check
   * @returns Whether payout can be processed
   */
  canProcess(payout: PayoutRequestItem): boolean {
    return payout.status === 'pending' || payout.status === 'on_hold';
  }

  /**
   * Track by function for payout list
   * @param index - Item index
   * @param item - Payout item
   * @returns Unique identifier
   */
  trackByPayoutId(index: number, item: PayoutRequestItem): number {
    return item.id;
  }
}

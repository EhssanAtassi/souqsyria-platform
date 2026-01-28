/**
 * @file refund-queue.component.ts
 * @description Refund queue management component for admin dashboard.
 *              Displays and processes customer refund requests.
 * @module AdminDashboard/Orders/Components
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
import { Subject, takeUntil, finalize } from 'rxjs';

import { AdminOrdersService } from '../../../services';
import { CurrencyFormatPipe } from '../../../shared';
import {
  RefundRequestItem,
  RefundStatus,
  ProcessRefundRequest
} from '../../../interfaces';

/**
 * Refund statistics interface
 * @description Summary statistics for refund queue
 */
interface RefundStats {
  /** Total pending refunds count */
  pendingCount: number;
  /** Refunds approved today */
  approvedToday: number;
  /** Refunds rejected today */
  rejectedToday: number;
  /** Total pending amount (SYP) */
  pendingAmount: number;
  /** Average processing time (days) */
  avgProcessingDays: number;
}

/**
 * Refund Queue Component
 * @description Manages customer refund requests with approve/reject workflow.
 *
 * @features
 * - Pending refund requests list
 * - Statistics dashboard
 * - Filter by status and urgency
 * - Detailed refund review modal
 * - Approve/reject with reason
 * - Partial refund support
 * - Restock option for physical items
 * - Customer notification control
 *
 * @example
 * ```html
 * <!-- Routed via /admin/orders/refunds -->
 * <app-refund-queue></app-refund-queue>
 * ```
 */
@Component({
  selector: 'app-refund-queue',
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
  templateUrl: './refund-queue.component.html',
  styleUrl: './refund-queue.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RefundQueueComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly ordersService = inject(AdminOrdersService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(true);

  /** Refund requests list */
  readonly refunds = signal<RefundRequestItem[]>([]);

  /** Pagination info */
  readonly pagination = signal({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  /** Refund statistics */
  readonly stats = signal<RefundStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    pendingAmount: 0,
    avgProcessingDays: 0
  });

  /** Status filter */
  readonly statusFilter = signal<RefundStatus | 'all'>('pending');

  /** Urgency filter (days pending threshold) */
  readonly urgencyFilter = signal<'all' | 'urgent' | 'normal'>('all');

  /** Selected refund for review */
  readonly selectedRefund = signal<RefundRequestItem | null>(null);

  /** Show refund detail dialog */
  readonly showDetailDialog = signal(false);

  /** Show process dialog (approve/reject) */
  readonly showProcessDialog = signal(false);

  /** Processing action type */
  processAction: 'approve' | 'reject' = 'approve';

  /** Refund amount (for partial refunds) */
  refundAmount = 0;

  /** Is partial refund */
  isPartialRefund = false;

  /** Process reason/notes */
  processReason = '';

  /** Restock items flag */
  restockItems = true;

  /** Notify customer flag */
  notifyCustomer = true;

  /** Loading state for processing */
  readonly isProcessing = signal(false);

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Filtered refunds based on urgency */
  readonly filteredRefunds = computed(() => {
    const refundsList = this.refunds();
    const urgency = this.urgencyFilter();

    if (urgency === 'all') return refundsList;

    // Urgent = pending more than 3 days
    const urgentThreshold = 3;
    return refundsList.filter(refund =>
      urgency === 'urgent'
        ? refund.daysPending >= urgentThreshold
        : refund.daysPending < urgentThreshold
    );
  });

  /** Urgent refunds count */
  readonly urgentCount = computed(() => {
    return this.refunds().filter(r => r.daysPending >= 3).length;
  });

  /** Has selected refund */
  readonly hasSelectedRefund = computed(() => !!this.selectedRefund());

  /** Can approve selected refund */
  readonly canApprove = computed(() => {
    const refund = this.selectedRefund();
    return refund && refund.status === 'pending';
  });

  /** Total pages array for pagination */
  readonly pagesArray = computed(() => {
    const totalPages = this.pagination().totalPages;
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  });

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  /** Refund status options for filter */
  readonly refundStatuses: { value: RefundStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  /** Urgency filter options */
  readonly urgencyOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'urgent', label: 'Urgent (3+ days)' },
    { value: 'normal', label: 'Normal' }
  ];

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    this.loadRefunds();
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
   * Load refund requests
   * @description Fetches paginated refund requests from API
   */
  loadRefunds(): void {
    this.isLoading.set(true);
    const pag = this.pagination();
    const status = this.statusFilter();

    this.ordersService
      .getPendingRefunds({
        page: pag.page,
        limit: pag.limit,
        status: status === 'all' ? undefined : status
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.refunds.set(response.data);
          this.pagination.set({
            page: response.page,
            limit: response.limit,
            total: response.total,
            totalPages: response.totalPages
          });
        },
        error: (error) => {
          console.error('Error loading refunds:', error);
          this.snackBar.open('Failed to load refund requests', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Load refund statistics
   * @description Fetches refund queue statistics
   */
  loadStatistics(): void {
    // Calculate stats from refunds data
    // In a real app, this might be a separate API call
    this.ordersService
      .getPendingRefunds({ page: 1, limit: 1000, status: 'pending' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const pendingRefunds = response.data;
          const pendingAmount = pendingRefunds.reduce((sum, r) => sum + r.requestedAmount, 0);
          const avgDays = pendingRefunds.length > 0
            ? pendingRefunds.reduce((sum, r) => sum + r.daysPending, 0) / pendingRefunds.length
            : 0;

          this.stats.set({
            pendingCount: response.total,
            approvedToday: 0, // Would come from separate API
            rejectedToday: 0, // Would come from separate API
            pendingAmount,
            avgProcessingDays: Math.round(avgDays * 10) / 10
          });
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  /**
   * Refresh data
   * @description Reloads refunds and statistics
   */
  refresh(): void {
    this.loadRefunds();
    this.loadStatistics();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }

  // =========================================================================
  // FILTERING
  // =========================================================================

  /**
   * Apply status filter
   * @param status - Status to filter by
   */
  applyStatusFilter(status: RefundStatus | 'all'): void {
    this.statusFilter.set(status);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadRefunds();
  }

  /**
   * Apply urgency filter
   * @param urgency - Urgency level
   */
  applyUrgencyFilter(urgency: 'all' | 'urgent' | 'normal'): void {
    this.urgencyFilter.set(urgency);
  }

  // =========================================================================
  // PAGINATION
  // =========================================================================

  /**
   * Change page
   * @param page - Page number
   */
  goToPage(page: number): void {
    const totalPages = this.pagination().totalPages;
    if (page < 1 || page > totalPages) return;

    this.pagination.update(p => ({ ...p, page }));
    this.loadRefunds();
  }

  /**
   * Change page size
   * @param limit - Items per page
   */
  changePageSize(limit: number): void {
    this.pagination.update(p => ({ ...p, page: 1, limit }));
    this.loadRefunds();
  }

  // =========================================================================
  // REFUND REVIEW
  // =========================================================================

  /**
   * Open refund detail dialog
   * @param refund - Refund request to review
   */
  openRefundDetail(refund: RefundRequestItem): void {
    this.selectedRefund.set(refund);
    this.showDetailDialog.set(true);
  }

  /**
   * Close refund detail dialog
   */
  closeDetailDialog(): void {
    this.showDetailDialog.set(false);
  }

  /**
   * View associated order
   * @param orderId - Order ID
   */
  viewOrder(orderId: number): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  // =========================================================================
  // REFUND PROCESSING
  // =========================================================================

  /**
   * Open process dialog for approval
   * @param refund - Refund request to approve
   */
  openApproveDialog(refund: RefundRequestItem): void {
    this.selectedRefund.set(refund);
    this.processAction = 'approve';
    this.refundAmount = refund.requestedAmount;
    this.isPartialRefund = false;
    this.processReason = '';
    this.restockItems = true;
    this.notifyCustomer = true;
    this.showProcessDialog.set(true);
  }

  /**
   * Open process dialog for rejection
   * @param refund - Refund request to reject
   */
  openRejectDialog(refund: RefundRequestItem): void {
    this.selectedRefund.set(refund);
    this.processAction = 'reject';
    this.processReason = '';
    this.notifyCustomer = true;
    this.showProcessDialog.set(true);
  }

  /**
   * Close process dialog
   */
  closeProcessDialog(): void {
    this.showProcessDialog.set(false);
  }

  /**
   * Toggle partial refund
   */
  togglePartialRefund(): void {
    this.isPartialRefund = !this.isPartialRefund;
    if (!this.isPartialRefund) {
      const refund = this.selectedRefund();
      if (refund) {
        this.refundAmount = refund.requestedAmount;
      }
    }
  }

  /**
   * Submit refund processing
   * @description Approves or rejects the refund request
   */
  submitProcess(): void {
    const refund = this.selectedRefund();
    if (!refund || !this.processReason.trim()) return;

    this.isProcessing.set(true);

    const request: ProcessRefundRequest = {
      decision: this.processAction,
      reason: this.processReason,
      notifyCustomer: this.notifyCustomer
    };

    // Add approval-specific options
    if (this.processAction === 'approve') {
      request.restockItems = this.restockItems;
      if (this.isPartialRefund && this.refundAmount < refund.requestedAmount) {
        request.amount = this.refundAmount;
      }
    }

    this.ordersService
      .processRefund(refund.id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing.set(false))
      )
      .subscribe({
        next: (result) => {
          const actionLabel = this.processAction === 'approve' ? 'approved' : 'rejected';
          const amountInfo = result.refundedAmount
            ? ` (${result.refundedAmount.toLocaleString()} SYP)`
            : '';
          this.snackBar.open(
            `Refund ${actionLabel} successfully${amountInfo}`,
            'Close',
            { duration: 3000 }
          );
          this.closeProcessDialog();
          this.closeDetailDialog();
          this.loadRefunds();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Refund processing failed:', error);
          this.snackBar.open('Failed to process refund', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Quick approve refund
   * @param refund - Refund request to approve
   */
  quickApprove(refund: RefundRequestItem): void {
    if (!confirm(`Approve full refund of ${refund.requestedAmount.toLocaleString()} SYP?`)) {
      return;
    }

    this.ordersService
      .approveRefund(refund.id, 'Approved by admin')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Refund approved successfully', 'Close', { duration: 3000 });
          this.loadRefunds();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Quick approve failed:', error);
          this.snackBar.open('Failed to approve refund', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Navigate back to orders list
   */
  goToOrders(): void {
    this.router.navigate(['/admin/orders']);
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get status badge class
   * @param status - Refund status
   * @returns CSS class name
   */
  getStatusClass(status: RefundStatus): string {
    const classMap: Record<RefundStatus, string> = {
      pending: 'warning',
      approved: 'success',
      processing: 'info',
      completed: 'success',
      rejected: 'danger'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get status label
   * @param status - Refund status
   * @returns Human-readable label
   */
  getStatusLabel(status: RefundStatus): string {
    const labelMap: Record<RefundStatus, string> = {
      pending: 'Pending',
      approved: 'Approved',
      processing: 'Processing',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return labelMap[status] || status;
  }

  /**
   * Get urgency class based on days pending
   * @param days - Days pending
   * @returns CSS class name
   */
  getUrgencyClass(days: number): string {
    if (days >= 7) return 'critical';
    if (days >= 3) return 'urgent';
    return 'normal';
  }

  /**
   * Get urgency label
   * @param days - Days pending
   * @returns Urgency label
   */
  getUrgencyLabel(days: number): string {
    if (days >= 7) return 'Critical';
    if (days >= 3) return 'Urgent';
    return 'Normal';
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format short date
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Calculate refund percentage
   * @param requestedAmount - Requested refund amount
   * @param orderTotal - Total order amount
   * @returns Percentage value
   */
  getRefundPercentage(requestedAmount: number, orderTotal: number): number {
    if (orderTotal === 0) return 0;
    return Math.round((requestedAmount / orderTotal) * 100);
  }

  /**
   * Track refunds by ID for ngFor optimization
   * @param index - Index in the list
   * @param refund - Refund request item
   * @returns Refund ID
   */
  trackByRefundId(index: number, refund: RefundRequestItem): number {
    return refund.id;
  }
}

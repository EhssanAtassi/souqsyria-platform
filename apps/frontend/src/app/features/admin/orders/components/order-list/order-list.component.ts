/**
 * @file order-list.component.ts
 * @description Order list component for admin dashboard.
 *              Displays paginated orders with filtering, sorting, and bulk actions.
 * @module AdminDashboard/Orders/Components
 */

import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, finalize, debounceTime, distinctUntilChanged } from 'rxjs';

import { AdminOrdersService } from '../../../services';
import { CurrencyFormatPipe } from '../../../shared';
import {
  OrderListItem,
  OrderStatus,
  PaymentStatus,
  OrderListQuery,
  PaginatedResponse
} from '../../../interfaces';

/**
 * Order statistics interface
 * @description Aggregated order counts by status
 */
interface OrderStats {
  /** Total number of orders */
  total: number;
  /** Pending orders count */
  pending: number;
  /** Processing orders count */
  processing: number;
  /** Shipped orders count */
  shipped: number;
  /** Delivered orders count */
  delivered: number;
  /** Cancelled orders count */
  cancelled: number;
  /** Orders with refund requests */
  refundRequests: number;
  /** Total revenue (SYP) */
  totalRevenue: number;
  /** Today's orders count */
  todayOrders: number;
}

/**
 * Order List Component
 * @description Displays and manages orders with filtering, sorting, and bulk operations.
 *
 * @features
 * - Paginated order listing with search
 * - Multi-filter by status, payment, date range
 * - Statistics cards with quick filters
 * - Bulk status updates
 * - Export to CSV/Excel
 * - Quick actions (view, update status)
 *
 * @example
 * ```html
 * <!-- Routed via /admin/orders -->
 * <app-order-list></app-order-list>
 * ```
 */
@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderListComponent implements OnInit {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly ordersService = inject(AdminOrdersService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject$ = new Subject<string>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(false);

  /** Orders list */
  readonly orders = signal<OrderListItem[]>([]);

  /** Pagination state */
  readonly pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  /** Search term */
  readonly searchTerm = signal('');

  /** Order status filter */
  readonly statusFilter = signal<OrderStatus | 'all'>('all');

  /** Payment status filter */
  readonly paymentFilter = signal<PaymentStatus | 'all'>('all');

  /** Date range filter */
  readonly dateRange = signal<{ from: string; to: string }>({
    from: '',
    to: ''
  });

  /** Refund filter */
  readonly refundFilter = signal(false);

  /** Selected order IDs for bulk actions */
  readonly selectedIds = signal<Set<number>>(new Set());

  /** Sort configuration */
  readonly sortConfig = signal({
    field: 'createdAt' as keyof OrderListItem | 'customerName',
    direction: 'desc' as 'asc' | 'desc'
  });

  /** Order statistics */
  readonly stats = signal<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refundRequests: 0,
    totalRevenue: 0,
    todayOrders: 0
  });

  /** Show status change dialog */
  readonly showStatusDialog = signal(false);

  /** Order being updated */
  readonly updatingOrder = signal<OrderListItem | null>(null);

  /** New status for update */
  newStatus: OrderStatus = 'confirmed';

  /** Status update notes */
  statusNotes = '';

  /** Notify customer checkbox */
  notifyCustomer = true;

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** All items selected */
  readonly allSelected = computed(() => {
    const orderList = this.orders();
    const selected = this.selectedIds();
    return orderList.length > 0 && orderList.every(o => selected.has(o.id));
  });

  /** Selected count */
  readonly selectedCount = computed(() => this.selectedIds().size);

  /** Show bulk actions */
  readonly showBulkActions = computed(() => this.selectedCount() > 0);

  /** Pagination text */
  readonly paginationText = computed(() => {
    const { page, limit, total } = this.pagination();
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}-${end} of ${total}`;
  });

  /** Active filters count */
  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.statusFilter() !== 'all') count++;
    if (this.paymentFilter() !== 'all') count++;
    if (this.dateRange().from || this.dateRange().to) count++;
    if (this.refundFilter()) count++;
    return count;
  });

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  /** Available order statuses */
  readonly orderStatuses: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'partially_refunded', label: 'Partially Refunded' },
    { value: 'failed', label: 'Failed' }
  ];

  /** Available payment statuses */
  readonly paymentStatuses: { value: PaymentStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'partially_refunded', label: 'Partially Refunded' }
  ];

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    // Setup search debounce
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => {
        this.searchTerm.set(term);
        this.pagination.update(p => ({ ...p, page: 1 }));
        this.loadOrders();
      });

    // Load initial data
    this.loadOrders();
    this.loadStatistics();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load orders with current filters
   * @description Fetches paginated orders from API
   */
  loadOrders(): void {
    this.isLoading.set(true);

    const query: OrderListQuery = {
      page: this.pagination().page,
      limit: this.pagination().limit,
      search: this.searchTerm() || undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() as OrderStatus : undefined,
      paymentStatus: this.paymentFilter() !== 'all' ? this.paymentFilter() as PaymentStatus : undefined,
      dateFrom: this.dateRange().from || undefined,
      dateTo: this.dateRange().to || undefined,
      hasRefundRequest: this.refundFilter() || undefined,
      sortBy: this.sortConfig().field as any,
      sortOrder: this.sortConfig().direction
    };

    this.ordersService
      .getOrders(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: PaginatedResponse<OrderListItem>) => {
          this.orders.set(response.items);
          this.pagination.update(p => ({
            ...p,
            total: response.total,
            totalPages: response.totalPages
          }));
          this.clearSelection();
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.snackBar.open('Failed to load orders', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Load order statistics
   * @description Fetches aggregated order statistics
   */
  loadStatistics(): void {
    this.ordersService
      .getOrderStatistics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.stats.set({
            total: data.total,
            pending: data.pending,
            processing: data.processing,
            shipped: data.shipped,
            delivered: data.delivered,
            cancelled: data.cancelled,
            refundRequests: data.refunded,
            totalRevenue: data.totalRevenue,
            todayOrders: data.todayOrders
          });
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      });
  }

  // =========================================================================
  // SEARCH & FILTER
  // =========================================================================

  /**
   * Handle search input
   * @param event - Input event
   */
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(value);
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchTerm.set('');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  /**
   * Apply status filter
   * @param status - Order status or 'all'
   */
  applyStatusFilter(status: OrderStatus | 'all'): void {
    this.statusFilter.set(status);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  /**
   * Apply payment filter
   * @param status - Payment status or 'all'
   */
  applyPaymentFilter(status: PaymentStatus | 'all'): void {
    this.paymentFilter.set(status);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  /**
   * Apply date range filter
   * @param from - Start date
   * @param to - End date
   */
  applyDateFilter(from: string, to: string): void {
    this.dateRange.set({ from, to });
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  /**
   * Toggle refund filter
   */
  toggleRefundFilter(): void {
    this.refundFilter.update(v => !v);
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.statusFilter.set('all');
    this.paymentFilter.set('all');
    this.dateRange.set({ from: '', to: '' });
    this.refundFilter.set(false);
    this.searchTerm.set('');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadOrders();
  }

  // =========================================================================
  // SORTING
  // =========================================================================

  /**
   * Sort by field
   * @param field - Field to sort by
   */
  sortBy(field: keyof OrderListItem | 'customerName'): void {
    this.sortConfig.update(config => ({
      field,
      direction: config.field === field && config.direction === 'asc' ? 'desc' : 'asc'
    }));
    this.loadOrders();
  }

  /**
   * Get sort indicator
   * @param field - Field to check
   * @returns Sort indicator icon
   */
  getSortIndicator(field: keyof OrderListItem | 'customerName'): string {
    const config = this.sortConfig();
    if (config.field !== field) return '';
    return config.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // =========================================================================
  // SELECTION
  // =========================================================================

  /**
   * Toggle all selection
   */
  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const allIds = new Set(this.orders().map(o => o.id));
      this.selectedIds.set(allIds);
    }
  }

  /**
   * Toggle order selection
   * @param orderId - Order ID to toggle
   */
  toggleSelection(orderId: number): void {
    this.selectedIds.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }

  /**
   * Check if order is selected
   * @param orderId - Order ID to check
   * @returns Whether the order is selected
   */
  isSelected(orderId: number): boolean {
    return this.selectedIds().has(orderId);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // =========================================================================
  // ORDER ACTIONS
  // =========================================================================

  /**
   * View order details
   * @param orderId - Order ID
   */
  viewOrder(orderId: number): void {
    this.router.navigate(['/admin/orders', orderId]);
  }

  /**
   * Open status update dialog
   * @param order - Order to update
   */
  openStatusDialog(order: OrderListItem): void {
    this.updatingOrder.set(order);
    this.newStatus = this.getNextStatus(order.status);
    this.statusNotes = '';
    this.notifyCustomer = true;
    this.showStatusDialog.set(true);
  }

  /**
   * Close status dialog
   */
  closeStatusDialog(): void {
    this.showStatusDialog.set(false);
    this.updatingOrder.set(null);
  }

  /**
   * Submit status update
   */
  submitStatusUpdate(): void {
    const order = this.updatingOrder();
    if (!order) return;

    this.ordersService
      .updateOrderStatus(order.id, {
        status: this.newStatus,
        notes: this.statusNotes || undefined,
        notifyCustomer: this.notifyCustomer
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Order status updated', 'Close', { duration: 3000 });
          this.closeStatusDialog();
          this.loadOrders();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Status update failed:', error);
          this.snackBar.open('Failed to update order status', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Get next logical status
   * @param currentStatus - Current order status
   * @returns Suggested next status
   */
  getNextStatus(currentStatus: OrderStatus): OrderStatus {
    const statusFlow: Partial<Record<OrderStatus, OrderStatus>> = {
      pending: 'confirmed',
      confirmed: 'processing',
      processing: 'shipped',
      shipped: 'out_for_delivery',
      out_for_delivery: 'delivered'
    };
    return statusFlow[currentStatus] || 'confirmed';
  }

  // =========================================================================
  // BULK ACTIONS
  // =========================================================================

  /**
   * Bulk update order status
   * @param status - New status to apply
   */
  bulkUpdateStatus(status: OrderStatus): void {
    const orderIds = Array.from(this.selectedIds());

    this.ordersService
      .bulkUpdateStatus(orderIds, status, `Bulk status update to ${status}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.snackBar.open(
            `Updated ${result.successful} of ${result.totalProcessed} orders`,
            'Close',
            { duration: 3000 }
          );
          this.loadOrders();
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Bulk update failed:', error);
          this.snackBar.open('Bulk update failed', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Bulk print shipping labels
   */
  bulkPrintLabels(): void {
    const orderIds = Array.from(this.selectedIds());

    this.ordersService
      .bulkPrintLabels(orderIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          window.open(result.downloadUrl, '_blank');
          this.snackBar.open(`Generated labels for ${result.count} orders`, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Print labels failed:', error);
          this.snackBar.open('Failed to generate labels', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // PAGINATION
  // =========================================================================

  /**
   * Go to previous page
   */
  previousPage(): void {
    const current = this.pagination().page;
    if (current > 1) {
      this.pagination.update(p => ({ ...p, page: p.page - 1 }));
      this.loadOrders();
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    const { page, totalPages } = this.pagination();
    if (page < totalPages) {
      this.pagination.update(p => ({ ...p, page: p.page + 1 }));
      this.loadOrders();
    }
  }

  // =========================================================================
  // EXPORT
  // =========================================================================

  /**
   * Export orders
   * @param format - Export format
   */
  exportOrders(format: 'csv' | 'xlsx'): void {
    const query: OrderListQuery = {
      status: this.statusFilter() !== 'all' ? this.statusFilter() as OrderStatus : undefined,
      paymentStatus: this.paymentFilter() !== 'all' ? this.paymentFilter() as PaymentStatus : undefined,
      dateFrom: this.dateRange().from || undefined,
      dateTo: this.dateRange().to || undefined
    };

    this.ordersService
      .exportOrders(format, query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `orders-${new Date().toISOString().split('T')[0]}.${format}`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.snackBar.open('Export completed', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Export failed:', error);
          this.snackBar.open('Export failed', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadOrders();
    this.loadStatistics();
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get status badge class
   * @param status - Order status
   * @returns CSS class name
   */
  getStatusClass(status: OrderStatus): string {
    const classMap: Record<OrderStatus, string> = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'primary',
      out_for_delivery: 'primary',
      delivered: 'success',
      cancelled: 'danger',
      refunded: 'secondary',
      partially_refunded: 'secondary',
      failed: 'danger'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get status label
   * @param status - Order status
   * @returns Human-readable label
   */
  getStatusLabel(status: OrderStatus): string {
    const labelMap: Record<OrderStatus, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      partially_refunded: 'Partial Refund',
      failed: 'Failed'
    };
    return labelMap[status] || status;
  }

  /**
   * Get payment status class
   * @param status - Payment status
   * @returns CSS class name
   */
  getPaymentStatusClass(status: PaymentStatus): string {
    const classMap: Record<PaymentStatus, string> = {
      pending: 'warning',
      paid: 'success',
      failed: 'danger',
      refunded: 'secondary',
      partially_refunded: 'secondary'
    };
    return classMap[status] || 'secondary';
  }

  /**
   * Get payment status label
   * @param status - Payment status
   * @returns Human-readable label
   */
  getPaymentStatusLabel(status: PaymentStatus): string {
    const labelMap: Record<PaymentStatus, string> = {
      pending: 'Pending',
      paid: 'Paid',
      failed: 'Failed',
      refunded: 'Refunded',
      partially_refunded: 'Partial Refund'
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Track orders by ID for ngFor optimization
   * @param index - Index in the list
   * @param order - Order item
   * @returns Order ID
   */
  trackByOrderId(index: number, order: OrderListItem): number {
    return order.id;
  }
}

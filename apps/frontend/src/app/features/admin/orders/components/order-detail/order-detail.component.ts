/**
 * @file order-detail.component.ts
 * @description Order detail view component for admin dashboard.
 *              Displays complete order information with timeline, items, and actions.
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
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, takeUntil, finalize, switchMap, filter } from 'rxjs';

import { AdminOrdersService } from '../../../services';
import { CurrencyFormatPipe } from '../../../shared';
import {
  OrderDetails,
  OrderStatus,
  PaymentStatus,
  OrderTimelineEvent
} from '../../../interfaces';

/**
 * Order Detail Component
 * @description Displays comprehensive order information including timeline,
 *              items, customer details, shipping, and payment information.
 *
 * @features
 * - Order overview with status badge
 * - Interactive timeline of status changes
 * - Order items list with thumbnails
 * - Customer and shipping information
 * - Payment and pricing breakdown
 * - Status update actions
 * - Add notes functionality
 * - Print invoice option
 *
 * @example
 * ```html
 * <!-- Routed via /admin/orders/:id -->
 * <app-order-detail></app-order-detail>
 * ```
 */
@Component({
  selector: 'app-order-detail',
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
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly ordersService = inject(AdminOrdersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // STATE SIGNALS
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal(true);

  /** Order details */
  readonly order = signal<OrderDetails | null>(null);

  /** Timeline events (separate loading) */
  readonly timeline = signal<OrderTimelineEvent[]>([]);

  /** Active tab */
  readonly activeTab = signal<'items' | 'timeline' | 'notes'>('items');

  /** Show status dialog */
  readonly showStatusDialog = signal(false);

  /** Show cancel dialog */
  readonly showCancelDialog = signal(false);

  /** Show notes dialog */
  readonly showNotesDialog = signal(false);

  /** New status for update */
  newStatus: OrderStatus = 'confirmed';

  /** Status update notes */
  statusNotes = '';

  /** Notify customer flag */
  notifyCustomer = true;

  /** Tracking number (for shipped status) */
  trackingNumber = '';

  /** Cancel reason */
  cancelReason = '';

  /** Restock items on cancel */
  restockOnCancel = true;

  /** Process refund on cancel */
  processRefundOnCancel = true;

  /** New note content */
  newNoteContent = '';

  /** Note is internal flag */
  noteIsInternal = true;

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /** Order ID from route */
  readonly orderId = computed(() => {
    const orderData = this.order();
    return orderData?.id || 0;
  });

  /** Can update status */
  readonly canUpdateStatus = computed(() => {
    const orderData = this.order();
    if (!orderData) return false;
    const terminalStatuses: OrderStatus[] = ['delivered', 'cancelled', 'refunded', 'failed'];
    return !terminalStatuses.includes(orderData.status);
  });

  /** Can cancel order */
  readonly canCancelOrder = computed(() => {
    const orderData = this.order();
    if (!orderData) return false;
    const nonCancellableStatuses: OrderStatus[] = ['delivered', 'cancelled', 'refunded', 'failed'];
    return !nonCancellableStatuses.includes(orderData.status);
  });

  /** Items subtotal */
  readonly itemsSubtotal = computed(() => {
    const orderData = this.order();
    if (!orderData) return 0;
    return orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  });

  // =========================================================================
  // CONSTANTS
  // =========================================================================

  /** Available order statuses for update */
  readonly orderStatuses: { value: OrderStatus; label: string }[] = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // =========================================================================
  // LIFECYCLE HOOKS
  // =========================================================================

  ngOnInit(): void {
    // Load order when route param changes
    this.route.params
      .pipe(
        filter(params => !!params['id']),
        switchMap(params => {
          this.isLoading.set(true);
          return this.ordersService.getOrderById(+params['id']);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (orderData) => {
          this.order.set(orderData);
          this.timeline.set(orderData.timeline || []);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading order:', error);
          this.snackBar.open('Failed to load order details', 'Close', { duration: 3000 });
          this.isLoading.set(false);
          this.router.navigate(['/admin/orders']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================

  /**
   * Go back to orders list
   */
  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  /**
   * View customer profile
   * @param customerId - Customer ID
   */
  viewCustomer(customerId: number): void {
    this.router.navigate(['/admin/users', customerId]);
  }

  /**
   * View product details
   * @param productId - Product ID
   */
  viewProduct(productId: number): void {
    this.router.navigate(['/admin/products', productId]);
  }

  /**
   * Set active tab
   * @param tab - Tab to activate
   */
  setActiveTab(tab: 'items' | 'timeline' | 'notes'): void {
    this.activeTab.set(tab);
  }

  // =========================================================================
  // STATUS UPDATE
  // =========================================================================

  /**
   * Open status update dialog
   */
  openStatusDialog(): void {
    const orderData = this.order();
    if (!orderData) return;

    this.newStatus = this.getNextStatus(orderData.status);
    this.statusNotes = '';
    this.trackingNumber = '';
    this.notifyCustomer = true;
    this.showStatusDialog.set(true);
  }

  /**
   * Close status dialog
   */
  closeStatusDialog(): void {
    this.showStatusDialog.set(false);
  }

  /**
   * Submit status update
   */
  submitStatusUpdate(): void {
    const orderData = this.order();
    if (!orderData) return;

    this.ordersService
      .updateOrderStatus(orderData.id, {
        status: this.newStatus,
        notes: this.statusNotes || undefined,
        notifyCustomer: this.notifyCustomer,
        trackingNumber: this.newStatus === 'shipped' ? this.trackingNumber : undefined
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.timeline.set(updatedOrder.timeline || []);
          this.snackBar.open('Order status updated successfully', 'Close', { duration: 3000 });
          this.closeStatusDialog();
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
  // CANCEL ORDER
  // =========================================================================

  /**
   * Open cancel order dialog
   */
  openCancelDialog(): void {
    this.cancelReason = '';
    this.restockOnCancel = true;
    this.processRefundOnCancel = true;
    this.showCancelDialog.set(true);
  }

  /**
   * Close cancel dialog
   */
  closeCancelDialog(): void {
    this.showCancelDialog.set(false);
  }

  /**
   * Submit order cancellation
   */
  submitCancel(): void {
    const orderData = this.order();
    if (!orderData || !this.cancelReason) return;

    this.ordersService
      .cancelOrder(orderData.id, {
        reason: this.cancelReason,
        processRefund: this.processRefundOnCancel,
        restockItems: this.restockOnCancel,
        notifyCustomer: true
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.timeline.set(updatedOrder.timeline || []);
          this.snackBar.open('Order cancelled successfully', 'Close', { duration: 3000 });
          this.closeCancelDialog();
        },
        error: (error) => {
          console.error('Order cancellation failed:', error);
          this.snackBar.open('Failed to cancel order', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // ADD NOTES
  // =========================================================================

  /**
   * Open add notes dialog
   */
  openNotesDialog(): void {
    this.newNoteContent = '';
    this.noteIsInternal = true;
    this.showNotesDialog.set(true);
  }

  /**
   * Close notes dialog
   */
  closeNotesDialog(): void {
    this.showNotesDialog.set(false);
  }

  /**
   * Submit new note
   */
  submitNote(): void {
    const orderData = this.order();
    if (!orderData || !this.newNoteContent.trim()) return;

    this.ordersService
      .addOrderNote(orderData.id, this.newNoteContent, this.noteIsInternal)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.snackBar.open('Note added successfully', 'Close', { duration: 3000 });
          this.closeNotesDialog();
        },
        error: (error) => {
          console.error('Add note failed:', error);
          this.snackBar.open('Failed to add note', 'Close', { duration: 3000 });
        }
      });
  }

  // =========================================================================
  // PRINT & EXPORT
  // =========================================================================

  /**
   * Print invoice
   */
  printInvoice(): void {
    // Open print dialog with invoice view
    window.print();
    this.snackBar.open('Print dialog opened', 'Close', { duration: 2000 });
  }

  /**
   * Refresh order data
   */
  refresh(): void {
    const orderData = this.order();
    if (!orderData) return;

    this.isLoading.set(true);
    this.ordersService
      .getOrderById(orderData.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (refreshedOrder) => {
          this.order.set(refreshedOrder);
          this.timeline.set(refreshedOrder.timeline || []);
          this.snackBar.open('Order data refreshed', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Refresh failed:', error);
          this.snackBar.open('Failed to refresh order', 'Close', { duration: 3000 });
        }
      });
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
   * Get timeline icon
   * @param status - Order status
   * @returns Material icon name
   */
  getTimelineIcon(status: OrderStatus): string {
    const iconMap: Record<OrderStatus, string> = {
      pending: 'schedule',
      confirmed: 'check_circle',
      processing: 'autorenew',
      shipped: 'local_shipping',
      out_for_delivery: 'delivery_dining',
      delivered: 'done_all',
      cancelled: 'cancel',
      refunded: 'money_off',
      partially_refunded: 'money_off',
      failed: 'error'
    };
    return iconMap[status] || 'info';
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
   * Format short date (for timeline)
   * @param date - Date to format
   * @returns Formatted date string
   */
  formatShortDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Track items by ID for ngFor optimization
   * @param index - Index in the list
   * @param item - Order item
   * @returns Item ID
   */
  trackByItemId(index: number, item: { id: number }): number {
    return item.id;
  }
}

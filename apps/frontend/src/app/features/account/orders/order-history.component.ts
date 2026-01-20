import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../../../shared';
import {
  Order,
  OrderHistoryConfig,
  OrderHistoryFilters,
  OrderStatus,
  OrderItem,
  OrderTrackingEvent,
  DateRange
} from '../../../shared/interfaces/user.interface';

/**
 * Order History & Tracking Component for Syrian Marketplace
 *
 * Comprehensive order management system with international shipping tracking
 * Features Syrian marketplace cultural styling, bilingual support,
 * enterprise-scale filtering, and B2C order workflow management
 *
 * @swagger
 * components:
 *   schemas:
 *     OrderHistoryComponent:
 *       type: object
 *       description: Order history and tracking management system
 *       properties:
 *         orderConfig:
 *           $ref: '#/components/schemas/OrderHistoryConfig'
 *         filteredOrders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         filters:
 *           $ref: '#/components/schemas/OrderHistoryFilters'
 *         currentLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         isLoading:
 *           type: boolean
 *           description: Loading state indicator
 */
@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderHistoryComponent implements OnInit {
  // Component state using signals
  private readonly orderConfigSignal = signal<OrderHistoryConfig | null>(null);
  private readonly filteredOrdersSignal = signal<Order[]>([]);
  private readonly isLoadingSignal = signal<boolean>(true);
  private readonly currentLanguageSignal = signal<'en' | 'ar'>('ar');
  private readonly selectedOrderSignal = signal<Order | null>(null);

  // Filter state
  private readonly filtersSignal = signal<OrderHistoryFilters>({
    status: undefined,
    dateRange: undefined,
    searchQuery: '',
    sortBy: 'recent',
    pageSize: 10,
    currentPage: 1
  });

  // Public readonly signals for template
  readonly orderConfig = this.orderConfigSignal.asReadonly();
  readonly filteredOrders = this.filteredOrdersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();
  readonly selectedOrder = this.selectedOrderSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();

  // Computed properties
  readonly totalFilteredOrders = computed(() => {
    const config = this.orderConfig();
    return config ? config.totalOrders : 0;
  });

  readonly orderStatusSummary = computed(() => {
    const config = this.orderConfig();
    if (!config) return {};

    return {
      pending: config.pendingOrders,
      delivered: config.recentDeliveries,
      total: config.totalOrders
    };
  });

  readonly totalSpentDisplay = computed(() => {
    const config = this.orderConfig();
    if (!config) return '';

    const lang = this.currentLanguageSignal();
    const primary = this.formatCurrency(config.totalSpent);
    const secondary = `$${config.totalSpentUSD.toLocaleString()}`;

    return lang === 'ar' ? `${primary} (${secondary})` : `${secondary} (${primary})`;
  });

  // Available order statuses for filtering
  readonly availableStatuses: { value: OrderStatus; labelEn: string; labelAr: string; color: string }[] = [
    { value: 'pending', labelEn: 'Pending', labelAr: 'قيد الانتظار', color: 'orange' },
    { value: 'confirmed', labelEn: 'Confirmed', labelAr: 'مؤكد', color: 'blue' },
    { value: 'preparing', labelEn: 'Preparing', labelAr: 'قيد التحضير', color: 'amber' },
    { value: 'in_transit_domestic', labelEn: 'Domestic Transit', labelAr: 'في الطريق محلياً', color: 'cyan' },
    { value: 'in_transit_international', labelEn: 'International Transit', labelAr: 'في الطريق دولياً', color: 'indigo' },
    { value: 'out_for_delivery', labelEn: 'Out for Delivery', labelAr: 'خرج للتوصيل', color: 'purple' },
    { value: 'delivered', labelEn: 'Delivered', labelAr: 'تم التوصيل', color: 'green' },
    { value: 'cancelled', labelEn: 'Cancelled', labelAr: 'ملغي', color: 'red' }
  ];

  // Sort options
  readonly sortOptions = [
    { value: 'recent', labelEn: 'Most Recent', labelAr: 'الأحدث' },
    { value: 'oldest', labelEn: 'Oldest First', labelAr: 'الأقدم أولاً' },
    { value: 'amount_high', labelEn: 'Highest Amount', labelAr: 'أعلى مبلغ' },
    { value: 'amount_low', labelEn: 'Lowest Amount', labelAr: 'أقل مبلغ' },
    { value: 'status', labelEn: 'By Status', labelAr: 'حسب الحالة' }
  ];

  // Quick date filters
  readonly quickDateFilters = [
    {
      key: 'last30',
      labelEn: 'Last 30 Days',
      labelAr: 'آخر 30 يوم',
      getDates: () => ({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    },
    {
      key: 'last3months',
      labelEn: 'Last 3 Months',
      labelAr: 'آخر 3 أشهر',
      getDates: () => ({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    },
    {
      key: 'lastYear',
      labelEn: 'Last Year',
      labelAr: 'السنة الماضية',
      getDates: () => ({
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      })
    }
  ];

  // Injected services
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  /**
   * Component initialization
   * Loads order history data and sets up reactive state
   */
  ngOnInit(): void {
    this.loadOrderHistory();
    this.initializeLanguage();
  }

  /**
   * Load order history configuration from user service
   * Handles loading state and error scenarios
   */
  private loadOrderHistory(): void {
    this.isLoadingSignal.set(true);

    this.userService.getOrderHistoryConfig().subscribe({
      next: (config) => {
        this.orderConfigSignal.set(config);
        this.applyFilters();
        this.isLoadingSignal.set(false);
      },
      error: (error) => {
        console.error('Failed to load order history:', error);
        this.isLoadingSignal.set(false);
        this.showMessage('خطأ في تحميل تاريخ الطلبات', 'Error loading order history');
      }
    });
  }

  /**
   * Initialize language based on user preference
   */
  private initializeLanguage(): void {
    const userLang = this.userService.preferredLanguage();
    this.currentLanguageSignal.set(userLang);
  }

  /**
   * Toggle between Arabic and English languages
   */
  toggleLanguage(): void {
    const currentLang = this.currentLanguageSignal();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';

    this.currentLanguageSignal.set(newLang);
    this.userService.updatePreferredLanguage(newLang).subscribe();
  }

  /**
   * Apply current filters to order list
   */
  applyFilters(): void {
    const currentFilters = this.filtersSignal();

    this.userService.getFilteredOrders(currentFilters).subscribe({
      next: (orders) => {
        this.filteredOrdersSignal.set(orders);
      },
      error: (error) => {
        console.error('Failed to filter orders:', error);
        this.showMessage('خطأ في تصفية الطلبات', 'Error filtering orders');
      }
    });
  }

  /**
   * Handle input event for search query
   */
  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onSearchChange(target?.value || '');
  }

  /**
   * Update search query filter
   */
  onSearchChange(query: string): void {
    this.updateFilters({ searchQuery: query, currentPage: 1 });
  }

  /**
   * Update status filter
   */
  onStatusFilterChange(statuses: OrderStatus[]): void {
    this.updateFilters({
      status: statuses.length > 0 ? statuses : undefined,
      currentPage: 1
    });
  }

  /**
   * Update sort order
   */
  onSortChange(sortBy: OrderHistoryFilters['sortBy']): void {
    this.updateFilters({ sortBy, currentPage: 1 });
  }

  /**
   * Apply quick date filter
   */
  applyQuickDateFilter(filterKey: string): void {
    const filter = this.quickDateFilters.find(f => f.key === filterKey);
    if (filter) {
      const dateRange = filter.getDates();
      this.updateFilters({ dateRange, currentPage: 1 });
    }
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filtersSignal.set({
      status: undefined,
      dateRange: undefined,
      searchQuery: '',
      sortBy: 'recent',
      pageSize: 10,
      currentPage: 1
    });
    this.applyFilters();
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.updateFilters({
      currentPage: event.pageIndex + 1,
      pageSize: event.pageSize
    });
  }

  /**
   * View detailed order information
   */
  viewOrderDetails(orderId: string): void {
    this.userService.getOrderDetails(orderId).subscribe({
      next: (order) => {
        if (order) {
          this.selectedOrderSignal.set(order);
        }
      },
      error: (error) => {
        console.error('Failed to load order details:', error);
        this.showMessage('خطأ في تحميل تفاصيل الطلب', 'Error loading order details');
      }
    });
  }

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string): void {
    // Show confirmation dialog
    const message = this.currentLanguageSignal() === 'ar'
      ? 'هل أنت متأكد من إلغاء هذا الطلب؟'
      : 'Are you sure you want to cancel this order?';

    if (confirm(message)) {
      this.userService.cancelOrder(orderId, 'Customer cancellation').subscribe({
        next: (success) => {
          if (success) {
            this.showMessage('تم إلغاء الطلب بنجاح', 'Order cancelled successfully');
            this.loadOrderHistory(); // Refresh list
          }
        },
        error: (error) => {
          console.error('Failed to cancel order:', error);
          this.showMessage('خطأ في إلغاء الطلب', 'Error cancelling order');
        }
      });
    }
  }

  /**
   * Reorder items from previous order
   */
  reorderItems(orderId: string): void {
    this.userService.reorderItems(orderId).subscribe({
      next: (success) => {
        if (success) {
          this.showMessage('تم إضافة المنتجات إلى السلة', 'Items added to cart');
        }
      },
      error: (error) => {
        console.error('Failed to reorder items:', error);
        this.showMessage('خطأ في إعادة الطلب', 'Error reordering items');
      }
    });
  }

  /**
   * Download order invoice
   */
  downloadInvoice(orderId: string): void {
    const language = this.currentLanguageSignal();

    this.userService.downloadInvoice(orderId, language).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${orderId}-${language}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showMessage('تم تحميل الفاتورة', 'Invoice downloaded');
      },
      error: (error) => {
        console.error('Failed to download invoice:', error);
        this.showMessage('خطأ في تحميل الفاتورة', 'Error downloading invoice');
      }
    });
  }

  /**
   * Request return/exchange
   */
  requestReturn(orderId: string, type: 'return' | 'exchange'): void {
    // In a real app, this would open a detailed return form
    const reason = 'Customer return request';
    const order = this.filteredOrders().find(o => o.id === orderId);
    const itemIds = order?.items.map(item => item.id) || [];

    this.userService.requestReturn(orderId, itemIds, reason, type).subscribe({
      next: (success) => {
        if (success) {
          const message = type === 'return'
            ? 'تم تقديم طلب الاسترداد'
            : 'تم تقديم طلب الاستبدال';
          const messageEn = type === 'return'
            ? 'Return request submitted'
            : 'Exchange request submitted';

          this.showMessage(message, messageEn);
        }
      },
      error: (error) => {
        console.error(`Failed to request ${type}:`, error);
        this.showMessage('خطأ في تقديم الطلب', `Error requesting ${type}`);
      }
    });
  }

  /**
   * Export order history
   */
  exportHistory(format: 'pdf' | 'csv' | 'json'): void {
    const filters = this.filtersSignal();

    this.userService.exportOrderHistory(format, filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-history.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.showMessage('تم تصدير السجل', 'History exported');
      },
      error: (error) => {
        console.error('Failed to export history:', error);
        this.showMessage('خطأ في التصدير', 'Export error');
      }
    });
  }

  /**
   * Get order status display information
   */
  getOrderStatusInfo(status: OrderStatus): { label: string; color: string; icon: string } {
    const lang = this.currentLanguageSignal();
    const statusInfo = this.availableStatuses.find(s => s.value === status);

    const icons = {
      pending: 'schedule',
      confirmed: 'check_circle',
      preparing: 'build',
      in_transit_domestic: 'local_shipping',
      in_transit_international: 'flight',
      out_for_delivery: 'delivery_dining',
      delivered: 'done_all',
      cancelled: 'cancel'
    };

    return {
      label: statusInfo ? (lang === 'ar' ? statusInfo.labelAr : statusInfo.labelEn) : status,
      color: statusInfo?.color || 'gray',
      icon: icons[status as keyof typeof icons] || 'info'
    };
  }

  /**
   * Format currency in Syrian Pounds with USD equivalent
   */
  formatCurrency(amount: number, showUSD: boolean = false): string {
    const syp = new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0
    }).format(amount);

    if (showUSD) {
      const usd = `$${(amount / 2500).toFixed(0)}`; // Approximate conversion
      return `${syp} (${usd})`;
    }

    return syp;
  }

  /**
   * Format date based on current language locale
   */
  formatDate(date: Date): string {
    const lang = this.currentLanguageSignal();
    const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Get CSS class for order status chip
   */
  getStatusChipClass(status: OrderStatus): string {
    const statusInfo = this.getOrderStatusInfo(status);
    return `status-chip-${statusInfo.color}`;
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order: Order): boolean {
    return order.canCancel && ['pending', 'confirmed', 'preparing'].includes(order.status);
  }

  /**
   * Check if order can be returned
   */
  canReturnOrder(order: Order): boolean {
    return order.canReturn && order.status === 'delivered';
  }

  /**
   * Get tracking progress percentage
   */
  getTrackingProgress(order: Order): number {
    const completedEvents = order.tracking.filter(event => event.isCompleted).length;
    const totalEvents = order.tracking.length;
    return totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;
  }

  /**
   * Track by function for orders
   */
  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  /**
   * Track by function for order items
   */
  trackByItemId(index: number, item: OrderItem): string {
    return item.id;
  }

  /**
   * Track by function for tracking events
   */
  trackByEventId(index: number, event: OrderTrackingEvent): string {
    return event.id;
  }

  /**
   * Update filters and apply them
   */
  private updateFilters(updates: Partial<OrderHistoryFilters>): void {
    const currentFilters = this.filtersSignal();
    const newFilters = { ...currentFilters, ...updates };
    this.filtersSignal.set(newFilters);
    this.applyFilters();
  }

  /**
   * Show localized message to user
   */
  private showMessage(arabicMessage: string, englishMessage: string): void {
    const message = this.currentLanguageSignal() === 'ar' ? arabicMessage : englishMessage;
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}

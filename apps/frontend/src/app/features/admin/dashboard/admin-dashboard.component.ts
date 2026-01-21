/**
 * @file admin-dashboard.component.ts
 * @description Main admin dashboard component with real-time metrics, revenue charts,
 *              and operational overview. Integrates with backend analytics APIs.
 * @module AdminDashboard
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, interval, startWith, switchMap, catchError, of } from 'rxjs';

import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { AdminAnalyticsService } from '../services';
import {
  DashboardMetrics,
  RevenueChartData,
  TopSellingProduct,
  RecentOrder,
  PendingActions,
  PeriodType,
  OrderStatus
} from '../interfaces';
import {
  AdminStatCardComponent,
  AdminStatusBadgeComponent
} from '../shared/components';
import { CurrencyFormatPipe } from '../shared/pipes';

/**
 * Dashboard stat card configuration
 * @description Configuration for a single metric card
 */
interface StatCardConfig {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Icon name (Material Icons) */
  icon: string;
  /** Value format type */
  format: 'number' | 'currency' | 'percent';
  /** Card color theme */
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Route to navigate on click */
  route?: string;
}

/**
 * Quick action card configuration
 * @description Configuration for actionable highlight cards
 */
interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Description text */
  description: string;
  /** Action button label */
  actionLabel: string;
  /** Navigation route */
  route: string;
  /** Material icon name */
  icon: string;
  /** Badge count (optional) */
  badgeCount?: number;
}

/**
 * Activity log item
 * @description Structured activity feed item
 */
interface ActivityItem {
  /** Unique identifier */
  id: string;
  /** Activity description */
  description: string;
  /** Relative timestamp */
  timestamp: string;
  /** Activity category */
  category: 'order' | 'vendor' | 'product' | 'user' | 'system';
  /** Associated entity ID */
  entityId?: number;
  /** Route to related entity */
  route?: string;
}

/**
 * Chart data series format for ngx-charts
 * @description Format required by ngx-charts line/bar charts
 */
interface ChartSeries {
  /** Series name */
  name: string;
  /** Data series */
  series: { name: string; value: number }[];
}

/**
 * Admin Dashboard Component
 * @description Main dashboard providing operational overview with:
 *              - Key performance metrics (revenue, orders, users, vendors)
 *              - Revenue trends chart (ngx-charts)
 *              - Pending actions summary
 *              - Top selling products
 *              - Recent orders list
 *              - Real-time activity feed
 *
 * @example
 * ```html
 * <app-admin-dashboard />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    NgIf,
    RouterLink,
    DatePipe,
    DecimalPipe,
    NgxChartsModule,
    AdminStatCardComponent,
    AdminStatusBadgeComponent,
    CurrencyFormatPipe
  ]
})
export class AdminDashboardComponent implements OnInit {
  /**
   * Analytics service for API calls
   */
  private readonly analyticsService = inject(AdminAnalyticsService);

  /**
   * DestroyRef for automatic subscription cleanup
   */
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // LOADING & ERROR STATES
  // =========================================================================

  /**
   * Loading state for metrics
   */
  readonly isLoadingMetrics = signal<boolean>(true);

  /**
   * Loading state for chart
   */
  readonly isLoadingChart = signal<boolean>(true);

  /**
   * Loading state for recent data
   */
  readonly isLoadingRecent = signal<boolean>(true);

  /**
   * Error message if data fetch fails
   */
  readonly errorMessage = signal<string | null>(null);

  /**
   * Last refresh timestamp
   */
  readonly lastRefresh = signal<Date>(new Date());

  // =========================================================================
  // DATA SIGNALS
  // =========================================================================

  /**
   * Dashboard metrics data
   */
  readonly metrics = signal<DashboardMetrics | null>(null);

  /**
   * Pending actions counts
   */
  readonly pendingActions = signal<PendingActions | null>(null);

  /**
   * Revenue chart raw data
   */
  readonly revenueChartData = signal<RevenueChartData | null>(null);

  /**
   * Top selling products
   */
  readonly topProducts = signal<TopSellingProduct[]>([]);

  /**
   * Recent orders
   */
  readonly recentOrders = signal<RecentOrder[]>([]);

  /**
   * Current chart period selection
   */
  readonly chartPeriod = signal<PeriodType>('monthly');

  /**
   * Activity feed items
   */
  readonly activities = signal<ActivityItem[]>([]);

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  /**
   * Overall loading state
   */
  readonly isLoading = computed(() =>
    this.isLoadingMetrics() || this.isLoadingChart() || this.isLoadingRecent()
  );

  /**
   * Total live orders (in-flight)
   */
  readonly totalOrdersInFlight = computed(() => {
    const pending = this.pendingActions();
    if (!pending) return 0;
    return pending.pendingOrders;
  });

  /**
   * Total pending actions requiring attention
   */
  readonly totalPendingActions = computed(() => {
    const pending = this.pendingActions();
    if (!pending) return 0;
    return (
      pending.pendingOrders +
      pending.pendingProducts +
      pending.pendingVendors +
      pending.pendingRefunds +
      pending.pendingKyc +
      pending.pendingWithdrawals
    );
  });

  /**
   * Chart data formatted for ngx-charts
   */
  readonly chartData = computed((): ChartSeries[] => {
    const data = this.revenueChartData();
    if (!data) return [];

    return [
      {
        name: 'Revenue',
        series: data.labels.map((label, index) => ({
          name: label,
          value: data.revenues[index] || 0
        }))
      },
      {
        name: 'Commission',
        series: data.labels.map((label, index) => ({
          name: label,
          value: data.commissions[index] || 0
        }))
      },
      {
        name: 'Net Revenue',
        series: data.labels.map((label, index) => ({
          name: label,
          value: data.netRevenue[index] || 0
        }))
      }
    ];
  });

  /**
   * Quick action cards based on pending actions
   */
  readonly quickActions = computed((): QuickAction[] => {
    const pending = this.pendingActions();
    const actions: QuickAction[] = [];

    if (pending?.pendingOrders && pending.pendingOrders > 0) {
      actions.push({
        id: 'orders',
        title: 'Pending Orders',
        description: `${pending.pendingOrders} orders awaiting confirmation or processing`,
        actionLabel: 'Review orders',
        route: '/admin/orders',
        icon: 'shopping_cart',
        badgeCount: pending.pendingOrders
      });
    }

    if (pending?.pendingProducts && pending.pendingProducts > 0) {
      actions.push({
        id: 'products',
        title: 'Product Approvals',
        description: `${pending.pendingProducts} products awaiting approval`,
        actionLabel: 'Review products',
        route: '/admin/products/approval',
        icon: 'inventory_2',
        badgeCount: pending.pendingProducts
      });
    }

    if (pending?.pendingVendors && pending.pendingVendors > 0) {
      actions.push({
        id: 'vendors',
        title: 'Vendor Verifications',
        description: `${pending.pendingVendors} vendors pending verification`,
        actionLabel: 'Review vendors',
        route: '/admin/vendors/verification',
        icon: 'store',
        badgeCount: pending.pendingVendors
      });
    }

    if (pending?.pendingRefunds && pending.pendingRefunds > 0) {
      actions.push({
        id: 'refunds',
        title: 'Refund Requests',
        description: `${pending.pendingRefunds} refund requests pending review`,
        actionLabel: 'Process refunds',
        route: '/admin/orders/refunds',
        icon: 'money_off',
        badgeCount: pending.pendingRefunds
      });
    }

    return actions;
  });

  // =========================================================================
  // STAT CARD CONFIGURATIONS
  // =========================================================================

  /**
   * Metric card configurations
   */
  readonly statCardConfigs: StatCardConfig[] = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      icon: 'payments',
      format: 'currency',
      color: 'primary',
      route: '/admin/analytics/sales'
    },
    {
      id: 'orders',
      title: 'Total Orders',
      icon: 'shopping_cart',
      format: 'number',
      color: 'success',
      route: '/admin/orders'
    },
    {
      id: 'users',
      title: 'Total Users',
      icon: 'people',
      format: 'number',
      color: 'info',
      route: '/admin/users'
    },
    {
      id: 'vendors',
      title: 'Active Vendors',
      icon: 'store',
      format: 'number',
      color: 'warning',
      route: '/admin/vendors'
    }
  ];

  // =========================================================================
  // CHART CONFIGURATION
  // =========================================================================

  /**
   * Chart color scheme
   */
  readonly chartColorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#1e3a8a', '#c41e3a', '#047857']
  };

  /**
   * Chart dimensions
   */
  readonly chartView: [number, number] = [700, 300];

  /**
   * Chart legend position
   */
  readonly legendPosition = 'below' as const;

  /**
   * Period options for chart
   */
  readonly periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Initialize dashboard and load data
   */
  ngOnInit(): void {
    this.loadDashboardData();
    this.loadRevenueChart();
    this.loadRecentData();
    this.generateActivityFeed();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load main dashboard metrics
   */
  loadDashboardData(): void {
    this.isLoadingMetrics.set(true);
    this.errorMessage.set(null);

    forkJoin({
      metrics: this.analyticsService.getDashboardMetrics(),
      pending: this.analyticsService.getPendingActions()
    })
      .pipe(
        catchError(error => {
          console.error('Failed to load dashboard metrics:', error);
          this.errorMessage.set('Failed to load dashboard data. Please try again.');
          return of({ metrics: null, pending: null });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ metrics, pending }) => {
        this.metrics.set(metrics);
        this.pendingActions.set(pending);
        this.isLoadingMetrics.set(false);
        this.lastRefresh.set(new Date());
      });
  }

  /**
   * Load revenue chart data
   */
  loadRevenueChart(): void {
    this.isLoadingChart.set(true);

    this.analyticsService
      .getRevenueChart(this.chartPeriod())
      .pipe(
        catchError(error => {
          console.error('Failed to load chart data:', error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(chartData => {
        this.revenueChartData.set(chartData);
        this.isLoadingChart.set(false);
      });
  }

  /**
   * Load recent orders and top products
   */
  loadRecentData(): void {
    this.isLoadingRecent.set(true);

    forkJoin({
      topProducts: this.analyticsService.getTopSellingProducts(5),
      recentOrders: this.analyticsService.getRecentOrders(5)
    })
      .pipe(
        catchError(error => {
          console.error('Failed to load recent data:', error);
          return of({ topProducts: [], recentOrders: [] });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ topProducts, recentOrders }) => {
        this.topProducts.set(topProducts);
        this.recentOrders.set(recentOrders);
        this.isLoadingRecent.set(false);
      });
  }

  /**
   * Generate mock activity feed (replace with real API when available)
   * @description This creates sample activity items for the dashboard
   */
  private generateActivityFeed(): void {
    const now = new Date();
    const activities: ActivityItem[] = [
      {
        id: '1',
        description: 'New order #SS-10452 placed from Damascus',
        timestamp: this.getRelativeTime(new Date(now.getTime() - 12 * 60 * 1000)),
        category: 'order',
        entityId: 10452,
        route: '/admin/orders/10452'
      },
      {
        id: '2',
        description: 'Vendor "Aleppo Sweets" submitted new products for approval',
        timestamp: this.getRelativeTime(new Date(now.getTime() - 32 * 60 * 1000)),
        category: 'vendor',
        entityId: 145,
        route: '/admin/vendors/145'
      },
      {
        id: '3',
        description: 'Product "Damascus Steel Knife Set" approved and listed',
        timestamp: this.getRelativeTime(new Date(now.getTime() - 60 * 60 * 1000)),
        category: 'product',
        entityId: 2847,
        route: '/admin/products/2847'
      },
      {
        id: '4',
        description: 'New user registration from Lattakia',
        timestamp: this.getRelativeTime(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
        category: 'user'
      },
      {
        id: '5',
        description: 'System health check passed – all services operational',
        timestamp: this.getRelativeTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
        category: 'system'
      }
    ];

    this.activities.set(activities);
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle chart period change
   * @param period - New period selection
   */
  onPeriodChange(period: PeriodType): void {
    this.chartPeriod.set(period);
    this.loadRevenueChart();
  }

  /**
   * Refresh dashboard data
   */
  refreshData(): void {
    this.loadDashboardData();
    this.loadRevenueChart();
    this.loadRecentData();
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get metric value for a stat card
   * @param cardId - Stat card identifier
   * @returns Metric value
   */
  getMetricValue(cardId: string): number {
    const m = this.metrics();
    if (!m) return 0;

    switch (cardId) {
      case 'revenue':
        return m.totalRevenue;
      case 'orders':
        return m.totalOrders;
      case 'users':
        return m.totalUsers;
      case 'vendors':
        return m.totalVendors;
      default:
        return 0;
    }
  }

  /**
   * Get metric trend/growth percentage
   * @param cardId - Stat card identifier
   * @returns Growth percentage
   */
  getMetricTrend(cardId: string): number {
    const m = this.metrics();
    if (!m) return 0;

    switch (cardId) {
      case 'revenue':
        return m.revenueGrowth;
      case 'orders':
        return m.ordersGrowth;
      case 'users':
        return m.usersGrowth;
      case 'vendors':
        return m.vendorsGrowth;
      default:
        return 0;
    }
  }

  /**
   * Get trend direction for a metric
   * @param cardId - Stat card identifier
   * @returns Trend direction
   */
  getTrendDirection(cardId: string): 'up' | 'down' | 'neutral' {
    const trend = this.getMetricTrend(cardId);
    if (trend > 0) return 'up';
    if (trend < 0) return 'down';
    return 'neutral';
  }

  /**
   * Format number for display
   * @param value - Number to format
   * @returns Formatted number string
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Get relative time string
   * @param date - Date to convert
   * @returns Relative time string (e.g., "12 min ago")
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} h ago`;
    return `${days} days ago`;
  }

  /**
   * Get activity icon based on category
   * @param category - Activity category
   * @returns Material icon name
   */
  getActivityIcon(category: string): string {
    const icons: Record<string, string> = {
      order: 'shopping_cart',
      vendor: 'store',
      product: 'inventory_2',
      user: 'person',
      system: 'settings'
    };
    return icons[category] || 'info';
  }

  /**
   * Get activity color based on category
   * @param category - Activity category
   * @returns CSS color class
   */
  getActivityColor(category: string): string {
    const colors: Record<string, string> = {
      order: 'text-blue-600',
      vendor: 'text-amber-600',
      product: 'text-emerald-600',
      user: 'text-purple-600',
      system: 'text-gray-600'
    };
    return colors[category] || 'text-gray-600';
  }

  /**
   * Track function for ngFor
   */
  trackById(index: number, item: { id: string | number }): string | number {
    return item.id;
  }
}

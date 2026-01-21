/**
 * Sales Dashboard Component
 * @description Comprehensive sales analytics with revenue charts, KPIs, and breakdowns
 * @module AnalyticsModule
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
import { RouterLink } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { AdminAnalyticsService } from '../../../services/admin-analytics.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

/**
 * Date range preset options
 */
interface DatePreset {
  label: string;
  value: string;
  getRange: () => { startDate: string; endDate: string };
}

/**
 * KPI Metric card data
 */
interface KPIMetric {
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  format: 'currency' | 'number' | 'percent';
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

/**
 * Sales Dashboard Component
 * @description Main analytics dashboard showing sales performance, revenue trends,
 *              and breakdowns by category, vendor, and region.
 */
@Component({
  selector: 'app-sales-dashboard',
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
  templateUrl: './sales-dashboard.component.html',
  styleUrls: ['./sales-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesDashboardComponent implements OnInit, OnDestroy {
  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================
  private readonly analyticsService = inject(AdminAnalyticsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroy$ = new Subject<void>();

  // ===========================================================================
  // STATE SIGNALS
  // ===========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(true);

  /** Selected date preset */
  readonly selectedPreset = signal<string>('last_30_days');

  /** Custom date range */
  readonly dateRange = signal<{ startDate: string; endDate: string }>({
    startDate: this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: this.formatDate(new Date())
  });

  /** Compare with previous period */
  readonly compareEnabled = signal<boolean>(true);

  /** Chart period type */
  readonly chartPeriod = signal<'daily' | 'weekly' | 'monthly'>('daily');

  /** KPI Metrics */
  readonly kpiMetrics = signal<KPIMetric[]>([]);

  /** Revenue chart data */
  readonly revenueChartData = signal<{ date: string; revenue: number; orders: number }[]>([]);

  /** Sales by category */
  readonly salesByCategory = signal<{
    categoryName: string;
    revenue: number;
    orders: number;
    percentageOfTotal: number;
  }[]>([]);

  /** Sales by vendor (top 10) */
  readonly salesByVendor = signal<{
    vendorName: string;
    revenue: number;
    orders: number;
    commissions: number;
    percentageOfTotal: number;
  }[]>([]);

  /** Sales by region */
  readonly salesByRegion = signal<{
    region: string;
    city: string;
    revenue: number;
    orders: number;
    percentageOfTotal: number;
  }[]>([]);

  /** Order analytics */
  readonly orderAnalytics = signal<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    averageFulfillmentTime: number;
    returnRate: number;
    ordersByPaymentMethod: { method: string; count: number; revenue: number }[];
  } | null>(null);

  // ===========================================================================
  // COMPUTED PROPERTIES
  // ===========================================================================

  /** Maximum revenue value for chart scaling */
  readonly maxRevenue = computed(() => {
    const data = this.revenueChartData();
    if (data.length === 0) return 1000;
    return Math.max(...data.map(d => d.revenue)) * 1.1;
  });

  /** Total revenue from chart data */
  readonly totalRevenue = computed(() => {
    return this.revenueChartData().reduce((sum, d) => sum + d.revenue, 0);
  });

  /** Total orders from chart data */
  readonly totalOrders = computed(() => {
    return this.revenueChartData().reduce((sum, d) => sum + d.orders, 0);
  });

  // ===========================================================================
  // STATIC DATA
  // ===========================================================================

  /** Date preset options */
  readonly datePresets: DatePreset[] = [
    {
      label: 'Today',
      value: 'today',
      getRange: () => ({
        startDate: this.formatDate(new Date()),
        endDate: this.formatDate(new Date())
      })
    },
    {
      label: 'Yesterday',
      value: 'yesterday',
      getRange: () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return { startDate: this.formatDate(yesterday), endDate: this.formatDate(yesterday) };
      }
    },
    {
      label: 'Last 7 Days',
      value: 'last_7_days',
      getRange: () => ({
        startDate: this.formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        endDate: this.formatDate(new Date())
      })
    },
    {
      label: 'Last 30 Days',
      value: 'last_30_days',
      getRange: () => ({
        startDate: this.formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        endDate: this.formatDate(new Date())
      })
    },
    {
      label: 'This Month',
      value: 'this_month',
      getRange: () => {
        const now = new Date();
        return {
          startDate: this.formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
          endDate: this.formatDate(new Date())
        };
      }
    },
    {
      label: 'Last Month',
      value: 'last_month',
      getRange: () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: this.formatDate(lastMonth), endDate: this.formatDate(lastDay) };
      }
    },
    {
      label: 'This Year',
      value: 'this_year',
      getRange: () => ({
        startDate: this.formatDate(new Date(new Date().getFullYear(), 0, 1)),
        endDate: this.formatDate(new Date())
      })
    },
    {
      label: 'Custom',
      value: 'custom',
      getRange: () => this.dateRange()
    }
  ];

  // ===========================================================================
  // LIFECYCLE HOOKS
  // ===========================================================================

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Load all analytics data
   */
  loadAnalytics(): void {
    this.isLoading.set(true);
    const range = this.getSelectedDateRange();

    // Load all data in parallel
    forkJoin({
      sales: this.analyticsService.getSalesAnalytics({
        startDate: range.startDate,
        endDate: range.endDate,
        compareWith: this.compareEnabled() ? 'previous_period' : undefined
      }),
      byCategory: this.analyticsService.getSalesByCategory(range),
      byVendor: this.analyticsService.getSalesByVendor({ ...range, limit: 10 }),
      byRegion: this.analyticsService.getSalesByRegion(range),
      orders: this.analyticsService.getOrderAnalytics(range)
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: ({ sales, byCategory, byVendor, byRegion, orders }) => {
          // Build KPI metrics
          this.buildKPIMetrics(sales, orders);

          // Build revenue chart (simulate daily data from sales)
          this.buildRevenueChart(range);

          // Set breakdown data
          this.salesByCategory.set(byCategory.categories);
          this.salesByVendor.set(byVendor.vendors);
          this.salesByRegion.set(byRegion.regions);
          this.orderAnalytics.set(orders);
        },
        error: (error) => {
          console.error('Error loading analytics:', error);
          this.snackBar.open('Failed to load analytics data', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
          // Set mock data for demo
          this.setMockData();
        }
      });
  }

  /**
   * Build KPI metrics from sales and order data
   */
  private buildKPIMetrics(sales: any, orders: any): void {
    const metrics: KPIMetric[] = [
      {
        label: 'Total Revenue',
        value: sales.totalRevenue || 0,
        previousValue: sales.comparison?.totalRevenue,
        change: sales.growth?.revenue,
        format: 'currency',
        icon: 'payments',
        color: 'primary'
      },
      {
        label: 'Total Orders',
        value: sales.totalOrders || orders.totalOrders || 0,
        previousValue: sales.comparison?.totalOrders,
        change: sales.growth?.orders,
        format: 'number',
        icon: 'shopping_cart',
        color: 'success'
      },
      {
        label: 'Avg. Order Value',
        value: sales.averageOrderValue || orders.averageOrderValue || 0,
        previousValue: sales.comparison?.averageOrderValue,
        change: sales.growth?.averageOrderValue,
        format: 'currency',
        icon: 'trending_up',
        color: 'info'
      },
      {
        label: 'Conversion Rate',
        value: sales.conversionRate || 3.2,
        format: 'percent',
        icon: 'bolt',
        color: 'warning'
      },
      {
        label: 'Return Rate',
        value: orders.returnRate || 0,
        format: 'percent',
        icon: 'replay',
        color: orders.returnRate > 5 ? 'danger' : 'success'
      },
      {
        label: 'Fulfillment Time',
        value: orders.averageFulfillmentTime || 0,
        format: 'number',
        icon: 'local_shipping',
        color: 'info'
      }
    ];
    this.kpiMetrics.set(metrics);
  }

  /**
   * Build revenue chart data
   */
  private buildRevenueChart(range: { startDate: string; endDate: string }): void {
    // Generate chart data based on date range
    const start = new Date(range.startDate);
    const end = new Date(range.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const chartData: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      chartData.push({
        date: this.formatDate(date),
        revenue: Math.floor(Math.random() * 500000) + 100000,
        orders: Math.floor(Math.random() * 50) + 10
      });
    }
    this.revenueChartData.set(chartData);
  }

  /**
   * Set mock data for demo purposes
   */
  private setMockData(): void {
    this.kpiMetrics.set([
      { label: 'Total Revenue', value: 12500000, change: 12.5, format: 'currency', icon: 'payments', color: 'primary' },
      { label: 'Total Orders', value: 1248, change: 8.2, format: 'number', icon: 'shopping_cart', color: 'success' },
      { label: 'Avg. Order Value', value: 10016, change: 3.8, format: 'currency', icon: 'trending_up', color: 'info' },
      { label: 'Conversion Rate', value: 3.2, format: 'percent', icon: 'bolt', color: 'warning' },
      { label: 'Return Rate', value: 2.1, format: 'percent', icon: 'replay', color: 'success' },
      { label: 'Fulfillment Time', value: 2.4, format: 'number', icon: 'local_shipping', color: 'info' }
    ]);

    this.salesByCategory.set([
      { categoryName: 'Electronics', revenue: 4500000, orders: 320, percentageOfTotal: 36 },
      { categoryName: 'Fashion', revenue: 3200000, orders: 480, percentageOfTotal: 25.6 },
      { categoryName: 'Home & Garden', revenue: 2100000, orders: 210, percentageOfTotal: 16.8 },
      { categoryName: 'Sports', revenue: 1500000, orders: 150, percentageOfTotal: 12 },
      { categoryName: 'Books', revenue: 1200000, orders: 88, percentageOfTotal: 9.6 }
    ]);

    this.salesByVendor.set([
      { vendorName: 'TechHub Syria', revenue: 2800000, orders: 180, commissions: 280000, percentageOfTotal: 22.4 },
      { vendorName: 'Fashion Forward', revenue: 1900000, orders: 240, commissions: 190000, percentageOfTotal: 15.2 },
      { vendorName: 'Home Essentials', revenue: 1600000, orders: 140, commissions: 160000, percentageOfTotal: 12.8 },
      { vendorName: 'Sports Zone', revenue: 1200000, orders: 95, commissions: 120000, percentageOfTotal: 9.6 },
      { vendorName: 'Book Corner', revenue: 800000, orders: 65, commissions: 80000, percentageOfTotal: 6.4 }
    ]);

    this.salesByRegion.set([
      { region: 'Damascus', city: 'Damascus', revenue: 5200000, orders: 520, percentageOfTotal: 41.6 },
      { region: 'Aleppo', city: 'Aleppo', revenue: 3100000, orders: 310, percentageOfTotal: 24.8 },
      { region: 'Homs', city: 'Homs', revenue: 1800000, orders: 180, percentageOfTotal: 14.4 },
      { region: 'Latakia', city: 'Latakia', revenue: 1400000, orders: 140, percentageOfTotal: 11.2 },
      { region: 'Tartus', city: 'Tartus', revenue: 1000000, orders: 98, percentageOfTotal: 8 }
    ]);

    this.orderAnalytics.set({
      totalOrders: 1248,
      completedOrders: 1180,
      cancelledOrders: 45,
      averageOrderValue: 10016,
      averageFulfillmentTime: 2.4,
      returnRate: 2.1,
      ordersByPaymentMethod: [
        { method: 'Credit Card', count: 620, revenue: 6200000 },
        { method: 'Cash on Delivery', count: 380, revenue: 3800000 },
        { method: 'Bank Transfer', count: 248, revenue: 2500000 }
      ]
    });

    this.buildRevenueChart(this.dateRange());
  }

  // ===========================================================================
  // FILTER ACTIONS
  // ===========================================================================

  /**
   * Apply date preset
   */
  applyDatePreset(presetValue: string): void {
    this.selectedPreset.set(presetValue);
    const preset = this.datePresets.find(p => p.value === presetValue);
    if (preset && presetValue !== 'custom') {
      this.dateRange.set(preset.getRange());
      this.loadAnalytics();
    }
  }

  /**
   * Apply custom date range
   */
  applyCustomRange(): void {
    this.selectedPreset.set('custom');
    this.loadAnalytics();
  }

  /**
   * Toggle comparison
   */
  toggleComparison(): void {
    this.compareEnabled.set(!this.compareEnabled());
    this.loadAnalytics();
  }

  /**
   * Change chart period
   */
  changeChartPeriod(period: 'daily' | 'weekly' | 'monthly'): void {
    this.chartPeriod.set(period);
    // Reload chart data with new aggregation
    this.buildRevenueChart(this.dateRange());
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadAnalytics();
  }

  // ===========================================================================
  // EXPORT
  // ===========================================================================

  /**
   * Export sales report
   */
  exportReport(format: 'csv' | 'xlsx' | 'pdf'): void {
    const range = this.getSelectedDateRange();
    this.analyticsService.exportSalesReport(format, {
      startDate: range.startDate,
      endDate: range.endDate
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open(`Export started. Download will begin shortly.`, 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
          });
          // Download the file
          if (response.downloadUrl) {
            window.open(response.downloadUrl, '_blank');
          }
        },
        error: (error) => {
          console.error('Export error:', error);
          this.snackBar.open('Failed to generate export', 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      });
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get selected date range
   */
  private getSelectedDateRange(): { startDate: string; endDate: string } {
    const preset = this.datePresets.find(p => p.value === this.selectedPreset());
    return preset ? preset.getRange() : this.dateRange();
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format KPI value based on format type
   */
  formatKPIValue(metric: KPIMetric): string {
    switch (metric.format) {
      case 'currency':
        return `${(metric.value / 1000).toFixed(0)}K SYP`;
      case 'percent':
        return `${metric.value.toFixed(1)}%`;
      case 'number':
        return metric.label.includes('Time') ? `${metric.value.toFixed(1)} days` : metric.value.toLocaleString();
      default:
        return metric.value.toString();
    }
  }

  /**
   * Get chart bar height as percentage
   */
  getBarHeight(value: number): string {
    const max = this.maxRevenue();
    return `${(value / max) * 100}%`;
  }

  /**
   * Format chart label (short date)
   */
  formatChartLabel(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Track by for KPI list
   */
  trackByKPI(index: number, metric: KPIMetric): string {
    return metric.label;
  }

  /**
   * Track by for category list
   */
  trackByCategory(index: number, item: { categoryName: string }): string {
    return item.categoryName;
  }

  /**
   * Track by for vendor list
   */
  trackByVendor(index: number, item: { vendorName: string }): string {
    return item.vendorName;
  }

  /**
   * Track by for region list
   */
  trackByRegion(index: number, item: { region: string; city: string }): string {
    return `${item.region}-${item.city}`;
  }

  /**
   * Track by for chart data
   */
  trackByChartDate(index: number, item: { date: string }): string {
    return item.date;
  }
}

/**
 * @file commission-reports.component.ts
 * @description Commission Reports Dashboard Component
 *              Displays commission analytics, vendor breakdowns, and trends
 * @module AdminDashboard/Analytics
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Angular Material
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { AdminAnalyticsService } from '../../../services/admin-analytics.service';

// Interfaces
import {
  CommissionReport,
  ExportFormat,
  PeriodType
} from '../../../interfaces/api-response.interface';

// Pipes
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';

/**
 * Commission trends data structure
 * @description Commission trend analytics from API
 */
interface CommissionTrends {
  trends: {
    period: string;
    totalCommissions: number;
    averageRate: number;
    vendorCount: number;
  }[];
  summary: {
    totalCommissions: number;
    averageCommissionRate: number;
    highestCommissionVendor: { vendorId: number; vendorName: string; amount: number };
  };
}

/**
 * KPI metric display structure
 * @description Formatted KPI for display
 */
interface KPIMetric {
  label: string;
  value: number;
  format: 'currency' | 'percent' | 'number';
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  change?: number;
}

/**
 * Date preset option
 * @description Predefined date range selection
 */
interface DatePreset {
  label: string;
  value: string;
  days: number;
}

/**
 * Commission Reports Component
 * @description Comprehensive commission analytics dashboard with
 *              vendor breakdowns, category analysis, and trends
 *
 * @example
 * ```html
 * <app-commission-reports></app-commission-reports>
 * ```
 */
@Component({
  selector: 'app-commission-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './commission-reports.component.html',
  styleUrl: './commission-reports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionReportsComponent implements OnInit, OnDestroy {
  // =========================================================================
  // DEPENDENCY INJECTION
  // =========================================================================

  /** Analytics service */
  private readonly analyticsService = inject(AdminAnalyticsService);

  /** Destroy subject for cleanup */
  private readonly destroy$ = new Subject<void>();

  // =========================================================================
  // SIGNALS - STATE
  // =========================================================================

  /** Loading state */
  readonly isLoading = signal<boolean>(false);

  /** Commission report data */
  readonly commissionReport = signal<CommissionReport | null>(null);

  /** Commission trends data */
  readonly commissionTrends = signal<CommissionTrends | null>(null);

  /** Selected date preset */
  readonly selectedPreset = signal<string>('last30');

  /** Date range */
  readonly dateRange = signal<{ startDate: string; endDate: string }>({
    startDate: this.getDateDaysAgo(30),
    endDate: this.getToday()
  });

  /** Chart period type */
  readonly chartPeriod = signal<PeriodType>('daily');

  /** View mode for vendor list */
  readonly vendorViewMode = signal<'all' | 'top10'>('top10');

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  // =========================================================================
  // COMPUTED SIGNALS
  // =========================================================================

  /**
   * KPI metrics for display
   * @description Formats commission data into displayable metrics
   */
  readonly kpiMetrics = computed<KPIMetric[]>(() => {
    const report = this.commissionReport();
    const trends = this.commissionTrends();

    if (!report) return [];

    return [
      {
        label: 'Total Commissions',
        value: report.totalCommissions,
        format: 'currency',
        icon: 'monetization_on',
        color: 'green',
        change: report.growthRate
      },
      {
        label: 'Growth Rate',
        value: report.growthRate,
        format: 'percent',
        icon: 'trending_up',
        color: 'blue'
      },
      {
        label: 'Avg. Commission Rate',
        value: trends?.summary.averageCommissionRate ?? 8.5,
        format: 'percent',
        icon: 'percent',
        color: 'purple'
      },
      {
        label: 'Active Vendors',
        value: report.byVendor.length,
        format: 'number',
        icon: 'store',
        color: 'orange'
      }
    ];
  });

  /**
   * Commission chart data
   * @description Daily commission data for chart
   */
  readonly chartData = computed(() => {
    const report = this.commissionReport();
    if (!report) return [];

    return report.byDay.map(d => ({
      date: d.date,
      amount: d.amount
    }));
  });

  /**
   * Maximum chart value for scaling
   */
  readonly maxChartValue = computed(() => {
    const data = this.chartData();
    if (data.length === 0) return 1000;
    return Math.max(...data.map(d => d.amount)) * 1.1;
  });

  /**
   * Vendors sorted by commission amount
   * @description Top vendors by commission
   */
  readonly vendorsByCommission = computed(() => {
    const report = this.commissionReport();
    if (!report) return [];

    const sorted = [...report.byVendor].sort((a, b) => b.amount - a.amount);
    return this.vendorViewMode() === 'top10' ? sorted.slice(0, 10) : sorted;
  });

  /**
   * Total vendor commission for percentage calculation
   */
  readonly totalVendorCommission = computed(() => {
    const report = this.commissionReport();
    if (!report) return 1;
    return report.byVendor.reduce((sum, v) => sum + v.amount, 0);
  });

  /**
   * Categories sorted by commission amount
   * @description Categories by commission
   */
  readonly categoriesByCommission = computed(() => {
    const report = this.commissionReport();
    if (!report) return [];

    return [...report.byCategory].sort((a, b) => b.amount - a.amount);
  });

  /**
   * Total category commission for percentage calculation
   */
  readonly totalCategoryCommission = computed(() => {
    const report = this.commissionReport();
    if (!report) return 1;
    return report.byCategory.reduce((sum, c) => sum + c.amount, 0);
  });

  /**
   * Trend data for chart
   */
  readonly trendChartData = computed(() => {
    const trends = this.commissionTrends();
    if (!trends) return [];

    return trends.trends.map(t => ({
      period: t.period,
      commissions: t.totalCommissions,
      rate: t.averageRate,
      vendors: t.vendorCount
    }));
  });

  // =========================================================================
  // CONFIGURATION
  // =========================================================================

  /**
   * Date presets for quick selection
   */
  readonly datePresets: DatePreset[] = [
    { label: 'Last 7 Days', value: 'last7', days: 7 },
    { label: 'Last 30 Days', value: 'last30', days: 30 },
    { label: 'This Month', value: 'thisMonth', days: 0 },
    { label: 'Last Month', value: 'lastMonth', days: 0 },
    { label: 'Last Quarter', value: 'lastQuarter', days: 90 },
    { label: 'This Year', value: 'thisYear', days: 365 },
    { label: 'Custom', value: 'custom', days: 0 }
  ];

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Initialize component
   * @description Loads initial commission data
   */
  ngOnInit(): void {
    this.loadCommissionData();
  }

  /**
   * Cleanup on destroy
   * @description Completes subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load all commission data
   * @description Fetches commission report and trends in parallel
   */
  loadCommissionData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const range = this.dateRange();

    forkJoin({
      report: this.analyticsService.getCommissionReport(range),
      trends: this.analyticsService.getCommissionTrends({
        ...range,
        periodType: this.chartPeriod()
      })
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.commissionReport.set(data.report);
        this.commissionTrends.set(data.trends);
      },
      error: (error) => {
        console.error('Failed to load commission data:', error);
        this.errorMessage.set('Failed to load commission data. Please try again.');
        // Load mock data for demo
        this.loadMockData();
      }
    });
  }

  /**
   * Load mock data for demo/error fallback
   * @description Provides sample data when API fails
   */
  private loadMockData(): void {
    const mockReport: CommissionReport = {
      totalCommissions: 2456780,
      growthRate: 15.3,
      byVendor: [
        { vendorId: 1, vendorName: 'Damascus Electronics', amount: 456000 },
        { vendorId: 2, vendorName: 'Aleppo Fashion House', amount: 389000 },
        { vendorId: 3, vendorName: 'Syrian Crafts Co.', amount: 312000 },
        { vendorId: 4, vendorName: 'Levant Home Goods', amount: 278000 },
        { vendorId: 5, vendorName: 'Palmyra Jewelry', amount: 245000 },
        { vendorId: 6, vendorName: 'Mediterranean Foods', amount: 198000 },
        { vendorId: 7, vendorName: 'Desert Rose Cosmetics', amount: 167000 },
        { vendorId: 8, vendorName: 'Ancient City Books', amount: 145000 },
        { vendorId: 9, vendorName: 'Euphrates Sports', amount: 134000 },
        { vendorId: 10, vendorName: 'Coastal Pharmacy', amount: 132780 }
      ],
      byCategory: [
        { categoryId: 1, categoryName: 'Electronics', amount: 567000 },
        { categoryId: 2, categoryName: 'Fashion & Apparel', amount: 456000 },
        { categoryId: 3, categoryName: 'Home & Living', amount: 389000 },
        { categoryId: 4, categoryName: 'Health & Beauty', amount: 312000 },
        { categoryId: 5, categoryName: 'Sports & Outdoors', amount: 267000 },
        { categoryId: 6, categoryName: 'Books & Media', amount: 234000 },
        { categoryId: 7, categoryName: 'Food & Beverages', amount: 231780 }
      ],
      byDay: this.generateMockDailyData()
    };

    const mockTrends: CommissionTrends = {
      trends: this.generateMockTrendData(),
      summary: {
        totalCommissions: 2456780,
        averageCommissionRate: 8.5,
        highestCommissionVendor: {
          vendorId: 1,
          vendorName: 'Damascus Electronics',
          amount: 456000
        }
      }
    };

    this.commissionReport.set(mockReport);
    this.commissionTrends.set(mockTrends);
  }

  /**
   * Generate mock daily data
   * @returns Mock daily commission data
   */
  private generateMockDailyData(): { date: string; amount: number }[] {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 100000) + 50000
      });
    }

    return data;
  }

  /**
   * Generate mock trend data
   * @returns Mock trend data
   */
  private generateMockTrendData(): any[] {
    const periods = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i * 7);
      periods.push({
        period: `W${12 - i}`,
        totalCommissions: Math.floor(Math.random() * 500000) + 200000,
        averageRate: 7 + Math.random() * 3,
        vendorCount: Math.floor(Math.random() * 20) + 40
      });
    }

    return periods;
  }

  // =========================================================================
  // DATE HANDLING
  // =========================================================================

  /**
   * Apply date preset
   * @param preset - Selected preset value
   */
  applyDatePreset(preset: string): void {
    this.selectedPreset.set(preset);

    if (preset === 'custom') return;

    const now = new Date();

    switch (preset) {
      case 'thisMonth':
        this.dateRange.set({
          startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
          endDate: this.getToday()
        });
        break;

      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        this.dateRange.set({
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: lastMonthEnd.toISOString().split('T')[0]
        });
        break;
      }

      case 'lastQuarter':
        this.dateRange.set({
          startDate: this.getDateDaysAgo(90),
          endDate: this.getToday()
        });
        break;

      case 'thisYear':
        this.dateRange.set({
          startDate: `${now.getFullYear()}-01-01`,
          endDate: this.getToday()
        });
        break;

      default:
        const presetConfig = this.datePresets.find(p => p.value === preset);
        if (presetConfig && presetConfig.days > 0) {
          this.dateRange.set({
            startDate: this.getDateDaysAgo(presetConfig.days),
            endDate: this.getToday()
          });
        }
    }

    this.loadCommissionData();
  }

  /**
   * Apply custom date range
   */
  applyCustomRange(): void {
    this.loadCommissionData();
  }

  /**
   * Update start date from input event
   * @param event - Input change event
   */
  updateStartDate(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateRange.update(range => ({ ...range, startDate: target.value }));
  }

  /**
   * Update end date from input event
   * @param event - Input change event
   */
  updateEndDate(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateRange.update(range => ({ ...range, endDate: target.value }));
  }

  /**
   * Change chart period type
   * @param period - Period type
   */
  changeChartPeriod(period: PeriodType): void {
    this.chartPeriod.set(period);
    this.loadCommissionData();
  }

  /**
   * Get today's date
   * @returns Today's date in YYYY-MM-DD format
   */
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get date N days ago
   * @param days - Number of days ago
   * @returns Date in YYYY-MM-DD format
   */
  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // =========================================================================
  // VIEW CONTROLS
  // =========================================================================

  /**
   * Toggle vendor view mode
   * @param mode - View mode
   */
  setVendorViewMode(mode: 'all' | 'top10'): void {
    this.vendorViewMode.set(mode);
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadCommissionData();
  }

  // =========================================================================
  // EXPORT
  // =========================================================================

  /**
   * Export commission report
   * @param format - Export format
   */
  exportReport(format: ExportFormat): void {
    const range = this.dateRange();

    this.analyticsService.exportCommissionReport({
      format,
      dateRange: range,
      includeHeaders: true
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        window.open(response.downloadUrl, '_blank');
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.generateClientExport(format);
      }
    });
  }

  /**
   * Generate client-side export
   * @param format - Export format
   */
  private generateClientExport(format: ExportFormat): void {
    const report = this.commissionReport();
    if (!report) return;

    if (format === 'csv') {
      let csv = 'Commission Report\n';
      csv += `Total Commissions,${report.totalCommissions}\n`;
      csv += `Growth Rate,${report.growthRate}%\n\n`;
      csv += 'Commissions by Vendor\nVendor,Amount\n';
      report.byVendor.forEach(v => {
        csv += `${v.vendorName},${v.amount}\n`;
      });
      csv += '\nCommissions by Category\nCategory,Amount\n';
      report.byCategory.forEach(c => {
        csv += `${c.categoryName},${c.amount}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commission-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  // =========================================================================
  // FORMATTING
  // =========================================================================

  /**
   * Format KPI value for display
   * @param metric - KPI metric
   * @returns Formatted value string
   */
  formatKPIValue(metric: KPIMetric): string {
    switch (metric.format) {
      case 'currency':
        return this.formatCurrency(metric.value);
      case 'percent':
        return `${metric.value.toFixed(1)}%`;
      case 'number':
        return metric.value.toLocaleString();
      default:
        return metric.value.toString();
    }
  }

  /**
   * Format currency value
   * @param value - Value in SYP
   * @returns Formatted currency string
   */
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M SYP`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K SYP`;
    }
    return `${value.toLocaleString()} SYP`;
  }

  /**
   * Format date for display
   * @param dateStr - Date string
   * @param format - Display format
   * @returns Formatted date string
   */
  formatDate(dateStr: string, format: 'short' | 'full' = 'full'): string {
    const date = new Date(dateStr);
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Get bar height percentage
   * @param value - Current value
   * @param max - Maximum value
   * @returns Height percentage string
   */
  getBarHeight(value: number, max: number): string {
    if (max === 0) return '0%';
    return `${(value / max) * 100}%`;
  }

  /**
   * Get bar width percentage
   * @param value - Current value
   * @param total - Total value
   * @returns Width percentage
   */
  getBarWidth(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  }

  // =========================================================================
  // TRACKING
  // =========================================================================

  /**
   * Track KPI by label
   */
  trackByKPI(index: number, item: KPIMetric): string {
    return item.label;
  }

  /**
   * Track vendor by ID
   */
  trackByVendor(index: number, item: { vendorId: number; vendorName: string; amount: number }): number {
    return item.vendorId;
  }

  /**
   * Track category by ID
   */
  trackByCategory(index: number, item: { categoryId: number; categoryName: string; amount: number }): number {
    return item.categoryId;
  }

  /**
   * Track chart data by date
   */
  trackByDate(index: number, item: { date: string; amount: number }): string {
    return item.date;
  }

  /**
   * Math reference for template
   */
  readonly Math = Math;
}

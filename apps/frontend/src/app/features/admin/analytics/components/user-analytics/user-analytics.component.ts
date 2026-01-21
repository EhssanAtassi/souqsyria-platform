/**
 * @file user-analytics.component.ts
 * @description User Analytics Dashboard Component
 *              Displays user acquisition, engagement, retention, and demographics
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
import { UserAnalytics, ExportFormat } from '../../../interfaces/api-response.interface';

// Pipes
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

/**
 * User engagement data structure
 * @description Engagement metrics from API
 */
interface UserEngagement {
  dailyActiveUsers: { date: string; count: number }[];
  weeklyActiveUsers: { week: string; count: number }[];
  monthlyActiveUsers: { month: string; count: number }[];
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
}

/**
 * User retention data structure
 * @description Retention cohort data from API
 */
interface UserRetention {
  cohorts: {
    cohortDate: string;
    initialUsers: number;
    retentionByWeek: number[];
  }[];
  overallRetention: {
    week1: number;
    week4: number;
    week8: number;
    week12: number;
  };
}

/**
 * KPI metric display structure
 * @description Formatted KPI for display
 */
interface KPIMetric {
  label: string;
  value: number;
  format: 'number' | 'percent' | 'duration';
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
  change?: number;
  description?: string;
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
 * User Analytics Component
 * @description Comprehensive user analytics dashboard with acquisition,
 *              engagement, and retention metrics
 *
 * @example
 * ```html
 * <app-user-analytics></app-user-analytics>
 * ```
 */
@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatTooltipModule,
    MatMenuModule,
    CurrencyFormatPipe
  ],
  templateUrl: './user-analytics.component.html',
  styleUrl: './user-analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAnalyticsComponent implements OnInit, OnDestroy {
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

  /** User analytics data */
  readonly userAnalytics = signal<UserAnalytics | null>(null);

  /** User engagement data */
  readonly userEngagement = signal<UserEngagement | null>(null);

  /** User retention data */
  readonly userRetention = signal<UserRetention | null>(null);

  /** Selected date preset */
  readonly selectedPreset = signal<string>('last30');

  /** Date range */
  readonly dateRange = signal<{ startDate: string; endDate: string }>({
    startDate: this.getDateDaysAgo(30),
    endDate: this.getToday()
  });

  /** Active engagement view */
  readonly engagementView = signal<'daily' | 'weekly' | 'monthly'>('daily');

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  // =========================================================================
  // COMPUTED SIGNALS
  // =========================================================================

  /**
   * KPI metrics for display
   * @description Formats user analytics data into displayable metrics
   */
  readonly kpiMetrics = computed<KPIMetric[]>(() => {
    const analytics = this.userAnalytics();
    const engagement = this.userEngagement();

    if (!analytics) return [];

    return [
      {
        label: 'Total Users',
        value: analytics.totalUsers,
        format: 'number',
        icon: 'people',
        color: 'blue',
        change: analytics.growthRate,
        description: 'All registered users'
      },
      {
        label: 'New Users',
        value: analytics.newUsers,
        format: 'number',
        icon: 'person_add',
        color: 'green',
        description: 'Users registered in selected period'
      },
      {
        label: 'Active Users',
        value: analytics.activeUsers,
        format: 'number',
        icon: 'trending_up',
        color: 'purple',
        description: 'Users active in selected period'
      },
      {
        label: 'Growth Rate',
        value: analytics.growthRate,
        format: 'percent',
        icon: 'show_chart',
        color: 'orange',
        description: 'User growth compared to previous period'
      },
      {
        label: 'Avg. Session Duration',
        value: engagement?.averageSessionDuration ?? 0,
        format: 'duration',
        icon: 'timer',
        color: 'cyan',
        description: 'Average time spent per session'
      },
      {
        label: 'Bounce Rate',
        value: engagement?.bounceRate ?? 0,
        format: 'percent',
        icon: 'exit_to_app',
        color: 'red',
        description: 'Single page visit percentage'
      }
    ];
  });

  /**
   * Engagement chart data based on selected view
   * @description Returns appropriate engagement data for charts
   */
  readonly engagementChartData = computed(() => {
    const engagement = this.userEngagement();
    if (!engagement) return [];

    const view = this.engagementView();

    switch (view) {
      case 'daily':
        return engagement.dailyActiveUsers.map(d => ({
          label: this.formatDate(d.date, 'short'),
          value: d.count,
          fullLabel: d.date
        }));
      case 'weekly':
        return engagement.weeklyActiveUsers.map(w => ({
          label: w.week,
          value: w.count,
          fullLabel: `Week ${w.week}`
        }));
      case 'monthly':
        return engagement.monthlyActiveUsers.map(m => ({
          label: this.formatMonth(m.month),
          value: m.count,
          fullLabel: m.month
        }));
      default:
        return [];
    }
  });

  /**
   * Maximum value for engagement chart scaling
   */
  readonly maxEngagementValue = computed(() => {
    const data = this.engagementChartData();
    if (data.length === 0) return 100;
    return Math.max(...data.map(d => d.value)) * 1.1;
  });

  /**
   * User acquisition chart data
   * @description Daily new vs active users
   */
  readonly acquisitionChartData = computed(() => {
    const analytics = this.userAnalytics();
    if (!analytics) return [];

    return analytics.usersByDay.map(d => ({
      date: d.date,
      newUsers: d.newUsers,
      activeUsers: d.activeUsers
    }));
  });

  /**
   * Maximum value for acquisition chart scaling
   */
  readonly maxAcquisitionValue = computed(() => {
    const data = this.acquisitionChartData();
    if (data.length === 0) return 100;
    const maxNew = Math.max(...data.map(d => d.newUsers));
    const maxActive = Math.max(...data.map(d => d.activeUsers));
    return Math.max(maxNew, maxActive) * 1.1;
  });

  // =========================================================================
  // CONFIGURATION
  // =========================================================================

  /**
   * Date presets for quick selection
   */
  readonly datePresets: DatePreset[] = [
    { label: 'Last 7 Days', value: 'last7', days: 7 },
    { label: 'Last 14 Days', value: 'last14', days: 14 },
    { label: 'Last 30 Days', value: 'last30', days: 30 },
    { label: 'Last 60 Days', value: 'last60', days: 60 },
    { label: 'Last 90 Days', value: 'last90', days: 90 },
    { label: 'This Year', value: 'thisYear', days: 365 },
    { label: 'Custom', value: 'custom', days: 0 }
  ];

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Initialize component
   * @description Loads initial analytics data
   */
  ngOnInit(): void {
    this.loadAnalytics();
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
   * Load all analytics data
   * @description Fetches user analytics, engagement, and retention in parallel
   */
  loadAnalytics(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const range = this.dateRange();

    forkJoin({
      analytics: this.analyticsService.getUserAnalytics(range),
      engagement: this.analyticsService.getUserEngagement(range),
      retention: this.analyticsService.getUserRetention(range)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (data) => {
        this.userAnalytics.set(data.analytics);
        this.userEngagement.set(data.engagement);
        this.userRetention.set(data.retention);
      },
      error: (error) => {
        console.error('Failed to load user analytics:', error);
        this.errorMessage.set('Failed to load analytics data. Please try again.');
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
    const mockAnalytics: UserAnalytics = {
      totalUsers: 15420,
      newUsers: 1234,
      activeUsers: 8567,
      growthRate: 12.5,
      usersByDay: this.generateMockDailyData(),
      usersBySource: [
        { source: 'Organic Search', count: 4520 },
        { source: 'Direct', count: 3890 },
        { source: 'Social Media', count: 2456 },
        { source: 'Referral', count: 1876 },
        { source: 'Email', count: 1245 },
        { source: 'Paid Ads', count: 1433 }
      ],
      usersByLocation: [
        { location: 'Damascus', count: 5670 },
        { location: 'Aleppo', count: 3450 },
        { location: 'Homs', count: 2340 },
        { location: 'Latakia', count: 1890 },
        { location: 'Tartus', count: 1120 },
        { location: 'Other', count: 950 }
      ]
    };

    const mockEngagement: UserEngagement = {
      dailyActiveUsers: this.generateMockEngagementData('daily'),
      weeklyActiveUsers: this.generateMockEngagementData('weekly'),
      monthlyActiveUsers: this.generateMockEngagementData('monthly'),
      averageSessionDuration: 456,
      pagesPerSession: 4.8,
      bounceRate: 32.5
    };

    const mockRetention: UserRetention = {
      cohorts: this.generateMockCohortData(),
      overallRetention: {
        week1: 72,
        week4: 45,
        week8: 32,
        week12: 24
      }
    };

    this.userAnalytics.set(mockAnalytics);
    this.userEngagement.set(mockEngagement);
    this.userRetention.set(mockRetention);
  }

  /**
   * Generate mock daily data
   * @returns Mock daily user data
   */
  private generateMockDailyData(): { date: string; newUsers: number; activeUsers: number }[] {
    const data = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 80) + 20,
        activeUsers: Math.floor(Math.random() * 400) + 200
      });
    }

    return data;
  }

  /**
   * Generate mock engagement data
   * @param type - Type of engagement data
   * @returns Mock engagement data
   */
  private generateMockEngagementData(type: string): any[] {
    if (type === 'daily') {
      const data = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 500) + 200
        });
      }
      return data;
    }

    if (type === 'weekly') {
      return Array.from({ length: 12 }, (_, i) => ({
        week: `W${i + 1}`,
        count: Math.floor(Math.random() * 2000) + 1000
      }));
    }

    if (type === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(month => ({
        month,
        count: Math.floor(Math.random() * 5000) + 3000
      }));
    }

    return [];
  }

  /**
   * Generate mock cohort data
   * @returns Mock cohort retention data
   */
  private generateMockCohortData(): any[] {
    const cohorts = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i * 7);

      const retention = [100];
      let current = 100;

      for (let w = 1; w <= Math.min(i, 8); w++) {
        current = Math.max(10, current - Math.floor(Math.random() * 15 + 5));
        retention.push(current);
      }

      cohorts.push({
        cohortDate: date.toISOString().split('T')[0],
        initialUsers: Math.floor(Math.random() * 200) + 50,
        retentionByWeek: retention
      });
    }

    return cohorts;
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

    const presetConfig = this.datePresets.find(p => p.value === preset);
    if (!presetConfig) return;

    if (preset === 'thisYear') {
      const now = new Date();
      this.dateRange.set({
        startDate: `${now.getFullYear()}-01-01`,
        endDate: this.getToday()
      });
    } else {
      this.dateRange.set({
        startDate: this.getDateDaysAgo(presetConfig.days),
        endDate: this.getToday()
      });
    }

    this.loadAnalytics();
  }

  /**
   * Apply custom date range
   */
  applyCustomRange(): void {
    this.loadAnalytics();
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
   * Change engagement view type
   * @param view - View type (daily, weekly, monthly)
   */
  changeEngagementView(view: 'daily' | 'weekly' | 'monthly'): void {
    this.engagementView.set(view);
  }

  /**
   * Refresh analytics data
   */
  refresh(): void {
    this.loadAnalytics();
  }

  // =========================================================================
  // EXPORT
  // =========================================================================

  /**
   * Export user analytics report
   * @param format - Export format (csv, xlsx, pdf)
   */
  exportReport(format: ExportFormat): void {
    const range = this.dateRange();

    this.analyticsService.exportUserAnalytics({
      format,
      dateRange: range,
      includeHeaders: true
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Trigger download
        window.open(response.downloadUrl, '_blank');
      },
      error: (error) => {
        console.error('Export failed:', error);
        // Fallback: generate client-side export
        this.generateClientExport(format);
      }
    });
  }

  /**
   * Generate client-side export
   * @param format - Export format
   */
  private generateClientExport(format: ExportFormat): void {
    const analytics = this.userAnalytics();
    if (!analytics) return;

    if (format === 'csv') {
      let csv = 'Metric,Value\n';
      csv += `Total Users,${analytics.totalUsers}\n`;
      csv += `New Users,${analytics.newUsers}\n`;
      csv += `Active Users,${analytics.activeUsers}\n`;
      csv += `Growth Rate,${analytics.growthRate}%\n`;
      csv += '\nUsers by Source\nSource,Count\n';
      analytics.usersBySource.forEach(s => {
        csv += `${s.source},${s.count}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-analytics-${new Date().toISOString().split('T')[0]}.csv`;
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
      case 'number':
        return metric.value.toLocaleString();
      case 'percent':
        return `${metric.value.toFixed(1)}%`;
      case 'duration':
        return this.formatDuration(metric.value);
      default:
        return metric.value.toString();
    }
  }

  /**
   * Format duration in seconds to human-readable
   * @param seconds - Duration in seconds
   * @returns Formatted duration string
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
   * Format month for display
   * @param month - Month string
   * @returns Formatted month
   */
  formatMonth(month: string): string {
    return month.substring(0, 3);
  }

  /**
   * Calculate percentage for bar width
   * @param value - Current value
   * @param max - Maximum value
   * @returns Percentage string
   */
  getBarHeight(value: number, max: number): string {
    if (max === 0) return '0%';
    return `${(value / max) * 100}%`;
  }

  /**
   * Get retention cell color based on value
   * @param value - Retention percentage
   * @returns CSS class name
   */
  getRetentionColor(value: number): string {
    if (value >= 70) return 'retention-high';
    if (value >= 40) return 'retention-medium';
    if (value >= 20) return 'retention-low';
    return 'retention-very-low';
  }

  // =========================================================================
  // TRACKING
  // =========================================================================

  /**
   * Track KPI by index
   * @param index - Item index
   * @param item - KPI metric
   * @returns Tracking key
   */
  trackByKPI(index: number, item: KPIMetric): string {
    return item.label;
  }

  /**
   * Track source by index
   * @param index - Item index
   * @param item - Source item
   * @returns Tracking key
   */
  trackBySource(index: number, item: { source: string; count: number }): string {
    return item.source;
  }

  /**
   * Track location by index
   * @param index - Item index
   * @param item - Location item
   * @returns Tracking key
   */
  trackByLocation(index: number, item: { location: string; count: number }): string {
    return item.location;
  }

  /**
   * Track cohort by index
   * @param index - Item index
   * @param item - Cohort item
   * @returns Tracking key
   */
  trackByCohort(index: number, item: any): string {
    return item.cohortDate;
  }

  /**
   * Math reference for template
   */
  readonly Math = Math;
}

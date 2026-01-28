/**
 * @file enhanced-dashboard.component.ts
 * @description Enhanced BI Dashboard with CLV, Funnel, Abandonment, and Cohort metrics overview.
 *              Provides actionable insights and quick navigation to detailed analytics.
 * @module BIIntelligence/Components
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
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { BiAnalyticsService } from '../../services/bi-analytics.service';
import {
  EnhancedDashboardSummary,
  CLVSummary,
  FunnelOverview,
  CartAbandonmentOverview,
  CohortRetention,
  BIDateRangeQuery
} from '../../interfaces';
import { CurrencyFormatPipe } from '../../../shared/pipes';
import { AdminStatCardComponent } from '../../../shared/components';

/**
 * Metric card configuration for BI dashboard
 */
interface BiMetricCard {
  /** Card identifier */
  id: string;
  /** Card title */
  title: string;
  /** Card title in Arabic */
  titleAr: string;
  /** Icon name (Material Icons) */
  icon: string;
  /** Value type for formatting */
  valueType: 'number' | 'currency' | 'percent';
  /** Card color theme */
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Route to detailed view */
  route: string;
  /** Badge text (optional) */
  badge?: string;
}

/**
 * Alert configuration for dashboard
 */
interface BiAlert {
  /** Alert identifier */
  id: string;
  /** Alert message */
  message: string;
  /** Alert type */
  type: 'info' | 'warning' | 'success' | 'danger';
  /** Icon name */
  icon: string;
  /** Action route */
  actionRoute: string;
  /** Action label */
  actionLabel: string;
}

/**
 * Enhanced BI Dashboard Component
 * @description Main BI intelligence dashboard providing overview of:
 *              - Customer Lifetime Value (CLV) metrics
 *              - Conversion Funnel performance
 *              - Cart Abandonment rates and recovery
 *              - Cohort Retention analysis
 *
 * @example
 * ```html
 * <app-enhanced-dashboard />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-enhanced-dashboard',
  templateUrl: './enhanced-dashboard.component.html',
  styleUrls: ['./enhanced-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    DecimalPipe,
    PercentPipe,
    CurrencyFormatPipe,
    AdminStatCardComponent
  ]
})
export class EnhancedDashboardComponent implements OnInit {
  /**
   * BI Analytics service for API calls
   */
  private readonly biAnalyticsService = inject(BiAnalyticsService);

  /**
   * DestroyRef for automatic subscription cleanup
   */
  private readonly destroyRef = inject(DestroyRef);

  // =========================================================================
  // LOADING & ERROR STATES
  // =========================================================================

  /**
   * Loading state for dashboard data
   */
  readonly isLoading = signal<boolean>(true);

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
   * Enhanced dashboard summary data
   */
  readonly dashboardSummary = signal<EnhancedDashboardSummary | null>(null);

  /**
   * CLV summary metrics
   */
  readonly clvSummary = signal<CLVSummary | null>(null);

  /**
   * Funnel overview metrics
   */
  readonly funnelOverview = signal<FunnelOverview | null>(null);

  /**
   * Cart abandonment overview
   */
  readonly abandonmentOverview = signal<CartAbandonmentOverview | null>(null);

  /**
   * Cohort retention data
   */
  readonly cohortRetention = signal<CohortRetention[]>([]);

  /**
   * Selected date range
   */
  readonly dateRange = signal<{ startDate: string; endDate: string }>({
    startDate: this.getDefaultStartDate(),
    endDate: this.getDefaultEndDate()
  });

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  /**
   * CLV metric cards
   */
  readonly clvMetricCards = computed((): BiMetricCard[] => {
    const summary = this.clvSummary();
    if (!summary) return [];

    return [
      {
        id: 'avg-clv',
        title: 'Average CLV',
        titleAr: 'متوسط القيمة الدائمة للعميل',
        icon: 'account_balance_wallet',
        valueType: 'currency',
        color: 'primary',
        route: '/admin/bi/clv'
      },
      {
        id: 'total-customers',
        title: 'Total Customers',
        titleAr: 'إجمال العملاء',
        icon: 'people',
        valueType: 'number',
        color: 'info',
        route: '/admin/bi/clv/segments'
      },
      {
        id: 'clv-growth',
        title: 'CLV Growth',
        titleAr: 'نمو القيمة الدائمة',
        icon: 'trending_up',
        valueType: 'percent',
        color: summary.clvGrowth > 0 ? 'success' : 'warning',
        route: '/admin/bi/clv'
      }
    ];
  });

  /**
   * Funnel metric cards
   */
  readonly funnelMetricCards = computed((): BiMetricCard[] => {
    const overview = this.funnelOverview();
    if (!overview) return [];

    return [
      {
        id: 'conversion-rate',
        title: 'Conversion Rate',
        titleAr: 'معدل التحويل',
        icon: 'conversion_path',
        valueType: 'percent',
        color: 'success',
        route: '/admin/bi/funnel'
      },
      {
        id: 'total-conversions',
        title: 'Total Conversions',
        titleAr: 'إجمالي التحويلات',
        icon: 'shopping_bag',
        valueType: 'number',
        color: 'primary',
        route: '/admin/bi/funnel'
      },
      {
        id: 'funnel-revenue',
        title: 'Funnel Revenue',
        titleAr: 'عائدات القمع',
        icon: 'attach_money',
        valueType: 'currency',
        color: 'info',
        route: '/admin/bi/funnel'
      }
    ];
  });

  /**
   * Abandonment metric cards
   */
  readonly abandonmentMetricCards = computed((): BiMetricCard[] => {
    const overview = this.abandonmentOverview();
    if (!overview) return [];

    return [
      {
        id: 'abandonment-rate',
        title: 'Abandonment Rate',
        titleAr: 'معدل التخلي عن السلة',
        icon: 'remove_shopping_cart',
        valueType: 'percent',
        color: 'warning',
        route: '/admin/bi/abandonment'
      },
      {
        id: 'recovery-rate',
        title: 'Recovery Rate',
        titleAr: 'معدل الاسترداد',
        icon: 'restore',
        valueType: 'percent',
        color: 'success',
        route: '/admin/bi/abandonment/campaigns'
      },
      {
        id: 'potential-revenue',
        title: 'Potential Revenue',
        titleAr: 'الإيرادات المحتملة',
        icon: 'money_off',
        valueType: 'currency',
        color: 'danger',
        route: '/admin/bi/abandonment',
        badge: 'At Risk'
      }
    ];
  });

  /**
   * Active alerts based on metrics
   */
  readonly activeAlerts = computed((): BiAlert[] => {
    const alerts: BiAlert[] = [];
    const summary = this.dashboardSummary();
    const abandonment = this.abandonmentOverview();
    const funnel = this.funnelOverview();

    // High abandonment rate alert
    if (abandonment && abandonment.abandonmentRate > 70) {
      alerts.push({
        id: 'high-abandonment',
        message: `Cart abandonment rate is ${abandonment.abandonmentRate.toFixed(1)}% - ${abandonment.potentialRecoveryValue.toLocaleString()} SYP at risk`,
        type: 'danger',
        icon: 'warning',
        actionRoute: '/admin/bi/abandonment',
        actionLabel: 'View Details'
      });
    }

    // Low conversion rate alert
    if (funnel && funnel.overallConversionRate < 2) {
      alerts.push({
        id: 'low-conversion',
        message: `Conversion rate is ${funnel.overallConversionRate.toFixed(2)}% - optimization needed`,
        type: 'warning',
        icon: 'trending_down',
        actionRoute: '/admin/bi/funnel',
        actionLabel: 'Analyze Funnel'
      });
    }

    // CLV decline alert
    if (summary?.clv.clvGrowth && summary.clv.clvGrowth < -5) {
      alerts.push({
        id: 'clv-decline',
        message: `CLV decreased by ${Math.abs(summary.clv.clvGrowth).toFixed(1)}% - customer value declining`,
        type: 'warning',
        icon: 'trending_down',
        actionRoute: '/admin/bi/clv/segments',
        actionLabel: 'Review Segments'
      });
    }

    // High at-risk customers
    if (summary?.clv.atRiskCount && summary.clv.atRiskCount > 50) {
      alerts.push({
        id: 'at-risk-customers',
        message: `${summary.clv.atRiskCount} customers at risk of churning`,
        type: 'warning',
        icon: 'person_remove',
        actionRoute: '/admin/bi/clv/segments',
        actionLabel: 'Take Action'
      });
    }

    return alerts;
  });

  // =========================================================================
  // METRIC CARD CONFIGURATIONS
  // =========================================================================

  /**
   * Quick action cards for BI features
   */
  readonly quickActions = computed(() => [
    {
      id: 'clv-analysis',
      title: 'CLV Analysis',
      titleAr: 'تحليل القيمة الدائمة',
      description: 'Analyze customer lifetime value and segmentation',
      descriptionAr: 'تحليل القيمة الدائمة للعميل والتقسيم',
      icon: 'account_balance_wallet',
      route: '/admin/bi/clv',
      color: 'primary'
    },
    {
      id: 'funnel-optimization',
      title: 'Funnel Optimization',
      titleAr: 'تحسين قمع المبيعات',
      description: 'Optimize conversion funnel and reduce drop-offs',
      descriptionAr: 'تحسين قمع التحويل وتقليل التسرب',
      icon: 'filter_list',
      route: '/admin/bi/funnel',
      color: 'success'
    },
    {
      id: 'cart-recovery',
      title: 'Cart Recovery',
      titleAr: 'استرداد السلة',
      description: 'Recover abandoned carts and boost revenue',
      descriptionAr: 'استرداد السلال المتروكة وزيادة الإيرادات',
      icon: 'shopping_cart_checkout',
      route: '/admin/bi/abandonment',
      color: 'warning'
    },
    {
      id: 'cohort-retention',
      title: 'Cohort Retention',
      titleAr: 'الاحتفاظ بالعملاء',
      description: 'Track customer retention and behavior patterns',
      descriptionAr: 'تتبع الاحتفاظ بالعملاء وأنماط السلوك',
      icon: 'groups',
      route: '/admin/bi/cohort',
      color: 'info'
    }
  ]);

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Initialize dashboard and load data
   */
  ngOnInit(): void {
    this.loadDashboardData();
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load all dashboard BI metrics
   */
  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const query: BIDateRangeQuery = {
      startDate: this.dateRange().startDate,
      endDate: this.dateRange().endDate,
      includeComparison: true
    };

    forkJoin({
      summary: this.biAnalyticsService.getEnhancedDashboard(query),
      clv: this.biAnalyticsService.getCLVSummary(query),
      funnel: this.biAnalyticsService.getFunnelOverview(query),
      abandonment: this.biAnalyticsService.getCartAbandonmentOverview(query),
      cohort: this.biAnalyticsService.getCohortRetention({
        ...query,
        periodType: 'week',
        periods: 4
      })
    })
      .pipe(
        catchError(error => {
          console.error('Failed to load BI dashboard data:', error);
          this.errorMessage.set('Failed to load dashboard data. Please try again.');
          return of({
            summary: null,
            clv: null,
            funnel: null,
            abandonment: null,
            cohort: []
          });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ summary, clv, funnel, abandonment, cohort }) => {
        this.dashboardSummary.set(summary);
        this.clvSummary.set(clv);
        this.funnelOverview.set(funnel);
        this.abandonmentOverview.set(abandonment);
        this.cohortRetention.set(cohort);
        this.isLoading.set(false);
        this.lastRefresh.set(new Date());
      });
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle date range change
   * @param startDate - New start date
   * @param endDate - New end date
   */
  onDateRangeChange(startDate: string, endDate: string): void {
    this.dateRange.set({ startDate, endDate });
    this.loadDashboardData();
  }

  /**
   * Refresh dashboard data
   */
  refreshData(): void {
    this.loadDashboardData();
  }

  /**
   * Dismiss an alert
   * @param alertId - Alert identifier
   */
  dismissAlert(alertId: string): void {
    // Implementation for dismissing alerts (could store in localStorage)
    console.log('Dismissing alert:', alertId);
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get metric value for a card
   * @param cardId - Metric card identifier
   * @param category - Metric category (clv, funnel, abandonment)
   * @returns Metric value
   */
  getMetricValue(cardId: string, category: 'clv' | 'funnel' | 'abandonment'): number {
    switch (category) {
      case 'clv': {
        const summary = this.clvSummary();
        if (!summary) return 0;

        switch (cardId) {
          case 'avg-clv': return summary.averageCLV;
          case 'total-customers': return summary.totalCustomers;
          case 'clv-growth': return summary.clvGrowth;
          default: return 0;
        }
      }
      case 'funnel': {
        const overview = this.funnelOverview();
        if (!overview) return 0;

        switch (cardId) {
          case 'conversion-rate': return overview.overallConversionRate;
          case 'total-conversions': return overview.totalConversions;
          case 'funnel-revenue': return overview.revenueFromConversions;
          default: return 0;
        }
      }
      case 'abandonment': {
        const overview = this.abandonmentOverview();
        if (!overview) return 0;

        switch (cardId) {
          case 'abandonment-rate': return overview.abandonmentRate;
          case 'recovery-rate': return overview.recoveryRate;
          case 'potential-revenue': return overview.potentialRecoveryValue;
          default: return 0;
        }
      }
      default:
        return 0;
    }
  }

  /**
   * Get metric trend percentage
   * @param cardId - Metric card identifier
   * @param category - Metric category
   * @returns Trend percentage
   */
  getMetricTrend(cardId: string, category: 'clv' | 'funnel' | 'abandonment'): number {
    switch (category) {
      case 'clv':
        return this.clvSummary()?.clvGrowth || 0;
      case 'funnel':
        return this.funnelOverview()?.conversionRateChange || 0;
      case 'abandonment':
        return this.abandonmentOverview()?.abandonmentRateChange || 0;
      default:
        return 0;
    }
  }

  /**
   * Get default start date (30 days ago)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get default end date (today)
   */
  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Format large numbers with K/M suffixes
   * @param value - Number to format
   * @returns Formatted string
   */
  formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  }

  /**
   * Track function for ngFor
   */
  trackById(index: number, item: { id: string }): string {
    return item.id;
  }
}

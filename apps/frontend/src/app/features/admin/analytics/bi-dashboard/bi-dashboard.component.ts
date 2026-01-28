/**
 * @file bi-dashboard.component.ts
 * @description Main Business Intelligence Dashboard component.
 *              Provides comprehensive analytics including CLV, conversion funnels,
 *              cart abandonment, and cohort analysis with mobile-first design
 *              and RTL/Arabic support.
 * @module AdminDashboard/Analytics/BI
 *
 * @example
 * ```html
 * <app-bi-dashboard />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     BIDashboardView:
 *       type: string
 *       enum: [overview, clv, funnel, abandonment, cohort]
 *       description: Active view/tab in the BI dashboard
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgFor, NgIf, NgClass, AsyncPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, interval, startWith, switchMap, timer, Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { BIDashboardService } from './services/bi-dashboard.service';
import {
  BIDashboardData,
  BIDashboardHeroMetrics,
  BIDashboardFilters,
  CLVAnalytics,
  ConversionFunnelAnalytics,
  CartAbandonmentAnalytics,
  CohortAnalysis,
  QuickInsight,
  CustomerSegment,
  DeviceType,
  CUSTOMER_SEGMENT_CONFIGS,
  FUNNEL_STAGE_LABELS,
  ABANDONMENT_REASON_LABELS
} from './interfaces/bi-dashboard.interfaces';

// Import shared components
import { AdminStatCardComponent } from '../../shared/components';
import { CurrencyFormatPipe } from '../../shared/pipes';

/**
 * Dashboard view/tab types
 * @description Available sections in the BI dashboard
 */
export type BIDashboardView = 'overview' | 'clv' | 'funnel' | 'abandonment' | 'cohort';

/**
 * Tab configuration interface
 * @description Configuration for dashboard navigation tabs
 */
interface TabConfig {
  /** Tab identifier */
  id: BIDashboardView;
  /** Display label in English */
  labelEn: string;
  /** Display label in Arabic */
  labelAr: string;
  /** Material icon name */
  icon: string;
  /** Tab description */
  description: string;
}

/**
 * Date range preset configuration
 * @description Predefined date range options
 */
interface DatePreset {
  /** Preset identifier */
  id: string;
  /** Display label */
  label: string;
  /** Arabic label */
  labelAr: string;
  /** Start date calculator */
  getStartDate: () => Date;
  /** End date calculator */
  getEndDate: () => Date;
}

/**
 * Business Intelligence Dashboard Component
 * @description Main BI dashboard providing comprehensive analytics:
 *              - Hero metrics section with key KPIs
 *              - Quick insights carousel
 *              - CLV analytics with customer segmentation
 *              - Conversion funnel visualization
 *              - Cart abandonment tracking and recovery
 *              - Cohort analysis with retention heatmaps
 *
 * @features
 * - Mobile-first responsive design (70%+ mobile admin access)
 * - RTL/Arabic language support
 * - Real-time data updates
 * - Interactive data visualizations
 * - Accessibility (WCAG 2.1 AA compliant)
 * - Progressive disclosure pattern
 *
 * @example
 * ```html
 * <app-bi-dashboard />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-bi-dashboard',
  templateUrl: './bi-dashboard.component.html',
  styleUrls: ['./bi-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    NgIf,
    NgClass,
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    PercentPipe,
    RouterLink,
    ReactiveFormsModule,
    NgxChartsModule,
    AdminStatCardComponent,
    CurrencyFormatPipe
  ]
})
export class BIDashboardComponent implements OnInit, OnDestroy {
  /**
   * BI Dashboard service for data operations
   */
  private readonly biService = inject(BIDashboardService);

  /**
   * Router for navigation
   */
  private readonly router = inject(Router);

  /**
   * Activated route for query params
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * DestroyRef for automatic subscription cleanup
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Subject for stopping real-time updates
   */
  private readonly destroy$ = new Subject<void>();

  /**
   * Reference to insights carousel container
   */
  @ViewChild('insightsCarousel') insightsCarousel!: ElementRef<HTMLDivElement>;

  // ===========================================================================
  // CONFIGURATION CONSTANTS
  // ===========================================================================

  /**
   * Tab configuration for dashboard navigation
   */
  readonly tabs: TabConfig[] = [
    {
      id: 'overview',
      labelEn: 'Overview',
      labelAr: 'نظرة عامة',
      icon: 'dashboard',
      description: 'Key metrics and insights'
    },
    {
      id: 'clv',
      labelEn: 'Customer Value',
      labelAr: 'قيمة العميل',
      icon: 'people',
      description: 'CLV and segmentation'
    },
    {
      id: 'funnel',
      labelEn: 'Conversion',
      labelAr: 'التحويل',
      icon: 'filter_alt',
      description: 'Funnel analysis'
    },
    {
      id: 'abandonment',
      labelEn: 'Abandonment',
      labelAr: 'التخلي',
      icon: 'remove_shopping_cart',
      description: 'Cart recovery'
    },
    {
      id: 'cohort',
      labelEn: 'Cohorts',
      labelAr: 'المجموعات',
      icon: 'groups',
      description: 'Retention analysis'
    }
  ];

  /**
   * Date range presets
   */
  readonly datePresets: DatePreset[] = [
    {
      id: 'today',
      label: 'Today',
      labelAr: 'اليوم',
      getStartDate: () => new Date(new Date().setHours(0, 0, 0, 0)),
      getEndDate: () => new Date()
    },
    {
      id: 'last_7_days',
      label: 'Last 7 Days',
      labelAr: 'آخر 7 أيام',
      getStartDate: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      getEndDate: () => new Date()
    },
    {
      id: 'last_30_days',
      label: 'Last 30 Days',
      labelAr: 'آخر 30 يوم',
      getStartDate: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      getEndDate: () => new Date()
    },
    {
      id: 'this_month',
      label: 'This Month',
      labelAr: 'هذا الشهر',
      getStartDate: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      getEndDate: () => new Date()
    },
    {
      id: 'last_month',
      label: 'Last Month',
      labelAr: 'الشهر الماضي',
      getStartDate: () => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      getEndDate: () => new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    },
    {
      id: 'this_quarter',
      label: 'This Quarter',
      labelAr: 'هذا الربع',
      getStartDate: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      },
      getEndDate: () => new Date()
    }
  ];

  /**
   * Segment configurations for display
   */
  readonly segmentConfigs = CUSTOMER_SEGMENT_CONFIGS;

  /**
   * Funnel stage labels
   */
  readonly funnelLabels = FUNNEL_STAGE_LABELS;

  /**
   * Abandonment reason labels
   */
  readonly abandonmentLabels = ABANDONMENT_REASON_LABELS;

  // ===========================================================================
  // STATE SIGNALS
  // ===========================================================================

  /**
   * Current active view/tab
   */
  readonly activeView = signal<BIDashboardView>('overview');

  /**
   * Current language (for RTL support)
   */
  readonly currentLanguage = signal<'en' | 'ar'>('en');

  /**
   * Is RTL mode active
   */
  readonly isRTL = computed(() => this.currentLanguage() === 'ar');

  /**
   * Selected date preset
   */
  readonly selectedDatePreset = signal<string>('last_30_days');

  /**
   * Mobile menu open state
   */
  readonly isMobileMenuOpen = signal<boolean>(false);

  /**
   * Filter panel open state
   */
  readonly isFilterPanelOpen = signal<boolean>(false);

  /**
   * Current insights carousel index
   */
  readonly currentInsightIndex = signal<number>(0);

  /**
   * Auto-rotate insights carousel
   */
  readonly autoRotateInsights = signal<boolean>(true);

  /**
   * Is window in mobile viewport
   */
  readonly isMobileViewport = signal<boolean>(false);

  /**
   * Is window in tablet viewport
   */
  readonly isTabletViewport = signal<boolean>(false);

  // ===========================================================================
  // DATA SIGNALS
  // ===========================================================================

  /**
   * Hero metrics data
   */
  readonly heroMetrics = signal<BIDashboardHeroMetrics | null>(null);

  /**
   * Quick insights data
   */
  readonly quickInsights = signal<QuickInsight[]>([]);

  /**
   * CLV analytics data
   */
  readonly clvAnalytics = signal<CLVAnalytics | null>(null);

  /**
   * Conversion funnel data
   */
  readonly conversionFunnel = signal<ConversionFunnelAnalytics | null>(null);

  /**
   * Cart abandonment data
   */
  readonly cartAbandonment = signal<CartAbandonmentAnalytics | null>(null);

  /**
   * Cohort analysis data
   */
  readonly cohortAnalysis = signal<CohortAnalysis | null>(null);

  /**
   * Current filters
   */
  readonly currentFilters = signal<BIDashboardFilters>({
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      preset: 'last_30_days'
    }
  });

  /**
   * Last refresh timestamp
   */
  readonly lastRefresh = signal<Date>(new Date());

  /**
   * Error message
   */
  readonly errorMessage = signal<string | null>(null);

  // ===========================================================================
  // LOADING STATES (from service)
  // ===========================================================================

  /**
   * Overall loading state
   */
  readonly isLoading = this.biService.isLoading;

  /**
   * Hero metrics loading state
   */
  readonly isLoadingHeroMetrics = this.biService.isLoadingHeroMetrics;

  /**
   * CLV analytics loading state
   */
  readonly isLoadingCLV = this.biService.isLoadingCLV;

  /**
   * Funnel loading state
   */
  readonly isLoadingFunnel = this.biService.isLoadingFunnel;

  /**
   * Abandonment loading state
   */
  readonly isLoadingAbandonment = this.biService.isLoadingAbandonment;

  /**
   * Cohort loading state
   */
  readonly isLoadingCohort = this.biService.isLoadingCohort;

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  /**
   * Current tab configuration
   */
  readonly currentTab = computed(() =>
    this.tabs.find(tab => tab.id === this.activeView()) || this.tabs[0]
  );

  /**
   * Active insights for carousel
   */
  readonly activeInsight = computed(() => {
    const insights = this.quickInsights();
    const index = this.currentInsightIndex();
    return insights[index] || null;
  });

  /**
   * Total insights count
   */
  readonly totalInsights = computed(() => this.quickInsights().length);

  /**
   * CLV chart data formatted for ngx-charts
   */
  readonly clvDistributionChartData = computed(() => {
    const clv = this.clvAnalytics();
    if (!clv) return [];

    return clv.clvDistribution.map(bucket => ({
      name: bucket.bucket,
      value: bucket.count
    }));
  });

  /**
   * Segment distribution chart data
   */
  readonly segmentChartData = computed(() => {
    const clv = this.clvAnalytics();
    if (!clv) return [];

    return clv.segments.map(seg => {
      const config = this.segmentConfigs.find(c => c.segment === seg.segment);
      return {
        name: config?.labelEn || seg.segment,
        value: seg.customerCount
      };
    });
  });

  /**
   * Funnel chart data formatted for visualization
   */
  readonly funnelChartData = computed(() => {
    const funnel = this.conversionFunnel();
    if (!funnel) return [];

    return funnel.currentFunnel.stages.map((stage, index) => ({
      stage: stage.stageId,
      label: stage.labelEn,
      count: stage.count,
      conversionRate: stage.conversionRate,
      dropOffRate: stage.dropOffRate,
      width: this.calculateFunnelWidth(index, funnel.currentFunnel.stages.length)
    }));
  });

  /**
   * Abandonment reasons chart data
   */
  readonly abandonmentReasonsChartData = computed(() => {
    const abandonment = this.cartAbandonment();
    if (!abandonment) return [];

    return abandonment.reasonBreakdown.map(reason => ({
      name: reason.labelEn,
      value: reason.count
    }));
  });

  /**
   * Cohort heatmap data
   */
  readonly cohortHeatmapData = computed(() => {
    const cohort = this.cohortAnalysis();
    if (!cohort) return [];

    return cohort.heatmapData;
  });

  // ===========================================================================
  // CHART CONFIGURATION
  // ===========================================================================

  /**
   * CLV distribution chart colors
   */
  readonly clvColorScheme: Color = {
    name: 'clv',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#047857', '#10b981', '#3b82f6', '#f59e0b', '#ef4444']
  };

  /**
   * Segment chart colors
   */
  readonly segmentColorScheme: Color = {
    name: 'segments',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: this.segmentConfigs.map(c => c.color)
  };

  /**
   * Funnel chart colors
   */
  readonly funnelColorScheme: Color = {
    name: 'funnel',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#10b981']
  };

  /**
   * Abandonment chart colors
   */
  readonly abandonmentColorScheme: Color = {
    name: 'abandonment',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#6b7280']
  };

  /**
   * Cohort heatmap colors
   */
  readonly cohortHeatmapColors = [
    '#f3f4f6', // Empty/0%
    '#d1fae5', // Low
    '#6ee7b7', // Medium-low
    '#34d399', // Medium
    '#10b981', // Medium-high
    '#047857'  // High
  ];

  // ===========================================================================
  // FORM CONTROLS
  // ===========================================================================

  /**
   * Filter form group
   */
  readonly filterForm = new FormGroup({
    datePreset: new FormControl('last_30_days'),
    startDate: new FormControl<string>(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ),
    endDate: new FormControl<string>(new Date().toISOString().split('T')[0]),
    segments: new FormControl<CustomerSegment[]>([]),
    devices: new FormControl<DeviceType[]>([]),
    compareWithPrevious: new FormControl<boolean>(true)
  });

  // ===========================================================================
  // LIFECYCLE HOOKS
  // ===========================================================================

  /**
   * Initialize component
   */
  ngOnInit(): void {
    // Check viewport size
    this.checkViewport();

    // Load initial data
    this.loadDashboardData();

    // Start real-time updates
    this.biService.startRealTimeUpdates();

    // Start insights auto-rotation
    this.startInsightsRotation();

    // Subscribe to route query params for deep linking
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['view']) {
          this.activeView.set(params['view'] as BIDashboardView);
        }
      });

    // Subscribe to filter form changes
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(values => {
        this.applyFilters(values);
      });

    // Listen for language changes (would come from a language service)
    this.detectLanguage();
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.biService.stopRealTimeUpdates();
  }

  // ===========================================================================
  // WINDOW EVENT HANDLERS
  // ===========================================================================

  /**
   * Handle window resize for responsive behavior
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    this.checkViewport();
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Tab navigation with arrow keys
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeView());
      let newIndex: number;

      if (event.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabs.length - 1;
      } else {
        newIndex = currentIndex < this.tabs.length - 1 ? currentIndex + 1 : 0;
      }

      // Only change tab if focus is on tab navigation
      if (document.activeElement?.closest('.bi-nav-tabs')) {
        this.setActiveView(this.tabs[newIndex].id);
        event.preventDefault();
      }
    }

    // Insights carousel navigation
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (document.activeElement?.closest('.bi-insights-carousel')) {
        if (event.key === 'ArrowUp') {
          this.previousInsight();
        } else {
          this.nextInsight();
        }
        event.preventDefault();
      }
    }
  }

  // ===========================================================================
  // DATA LOADING
  // ===========================================================================

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.errorMessage.set(null);
    const filters = this.currentFilters();

    // Load data in parallel
    forkJoin({
      heroMetrics: this.biService.getHeroMetrics(),
      quickInsights: this.biService.getQuickInsights(),
      clvAnalytics: this.biService.getCLVAnalytics(filters),
      conversionFunnel: this.biService.getConversionFunnel(filters),
      cartAbandonment: this.biService.getCartAbandonment(filters),
      cohortAnalysis: this.biService.getCohortAnalysis(filters)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.heroMetrics.set(data.heroMetrics);
          this.quickInsights.set(data.quickInsights);
          this.clvAnalytics.set(data.clvAnalytics);
          this.conversionFunnel.set(data.conversionFunnel);
          this.cartAbandonment.set(data.cartAbandonment);
          this.cohortAnalysis.set(data.cohortAnalysis);
          this.lastRefresh.set(new Date());
        },
        error: (error) => {
          console.error('Dashboard data error:', error);
          this.errorMessage.set('Failed to load dashboard data. Please try again.');
        }
      });
  }

  /**
   * Refresh all data
   */
  refreshData(): void {
    this.biService.clearCache();
    this.loadDashboardData();
  }

  // ===========================================================================
  // VIEW/TAB MANAGEMENT
  // ===========================================================================

  /**
   * Set active view/tab
   * @param view - View to activate
   */
  setActiveView(view: BIDashboardView): void {
    this.activeView.set(view);

    // Update URL query params for deep linking
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  /**
   * Toggle filter panel
   */
  toggleFilterPanel(): void {
    this.isFilterPanelOpen.update(open => !open);
  }

  // ===========================================================================
  // INSIGHTS CAROUSEL
  // ===========================================================================

  /**
   * Go to next insight
   */
  nextInsight(): void {
    const total = this.totalInsights();
    if (total === 0) return;

    this.currentInsightIndex.update(index =>
      index < total - 1 ? index + 1 : 0
    );
  }

  /**
   * Go to previous insight
   */
  previousInsight(): void {
    const total = this.totalInsights();
    if (total === 0) return;

    this.currentInsightIndex.update(index =>
      index > 0 ? index - 1 : total - 1
    );
  }

  /**
   * Go to specific insight
   * @param index - Insight index
   */
  goToInsight(index: number): void {
    if (index >= 0 && index < this.totalInsights()) {
      this.currentInsightIndex.set(index);
    }
  }

  /**
   * Toggle insights auto-rotation
   */
  toggleAutoRotate(): void {
    this.autoRotateInsights.update(enabled => !enabled);
  }

  /**
   * Start insights rotation timer
   */
  private startInsightsRotation(): void {
    interval(5000)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.autoRotateInsights()) {
          this.nextInsight();
        }
      });
  }

  // ===========================================================================
  // FILTER MANAGEMENT
  // ===========================================================================

  /**
   * Apply filters from form
   * @param values - Form values
   */
  private applyFilters(values: Partial<{
    datePreset: string | null;
    startDate: string | null;
    endDate: string | null;
    segments: CustomerSegment[] | null;
    devices: DeviceType[] | null;
    compareWithPrevious: boolean | null;
  }>): void {
    const filters: BIDashboardFilters = {
      dateRange: {
        startDate: values.startDate || this.currentFilters().dateRange.startDate,
        endDate: values.endDate || this.currentFilters().dateRange.endDate,
        preset: values.datePreset as BIDashboardFilters['dateRange']['preset']
      },
      segments: values.segments || undefined,
      devices: values.devices || undefined,
      compareWithPrevious: values.compareWithPrevious || false
    };

    this.currentFilters.set(filters);
    this.loadDashboardData();
  }

  /**
   * Select date preset
   * @param presetId - Preset identifier
   */
  selectDatePreset(presetId: string): void {
    const preset = this.datePresets.find(p => p.id === presetId);
    if (!preset) return;

    this.selectedDatePreset.set(presetId);

    const startDate = preset.getStartDate().toISOString().split('T')[0];
    const endDate = preset.getEndDate().toISOString().split('T')[0];

    this.filterForm.patchValue({
      datePreset: presetId,
      startDate,
      endDate
    });
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.filterForm.reset({
      datePreset: 'last_30_days',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      segments: [],
      devices: [],
      compareWithPrevious: true
    });
    this.selectedDatePreset.set('last_30_days');
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Check viewport size
   */
  private checkViewport(): void {
    const width = window.innerWidth;
    this.isMobileViewport.set(width < 768);
    this.isTabletViewport.set(width >= 768 && width < 1024);
  }

  /**
   * Detect language preference
   */
  private detectLanguage(): void {
    // Check document direction or language attribute
    const htmlDir = document.documentElement.dir;
    const htmlLang = document.documentElement.lang;

    if (htmlDir === 'rtl' || htmlLang?.startsWith('ar')) {
      this.currentLanguage.set('ar');
    }
  }

  /**
   * Calculate funnel stage width
   * @param index - Stage index
   * @param total - Total stages
   * @returns Width percentage string
   */
  private calculateFunnelWidth(index: number, total: number): string {
    const startWidth = 100;
    const endWidth = 25;
    const step = (startWidth - endWidth) / (total - 1);
    const width = startWidth - (step * index);
    return `${width}%`;
  }

  /**
   * Format number for display
   * @param value - Number to format
   * @returns Formatted string
   */
  formatNumber(value: number): string {
    if (this.currentLanguage() === 'ar') {
      // Convert to Arabic numerals
      return value.toLocaleString('ar-SY');
    }
    return value.toLocaleString('en-US');
  }

  /**
   * Format currency for display
   * @param value - Amount to format
   * @returns Formatted currency string
   */
  formatCurrency(value: number): string {
    const formatted = this.formatNumber(value);
    if (this.currentLanguage() === 'ar') {
      return `${formatted} ل.س`;
    }
    return `${formatted} SYP`;
  }

  /**
   * Format percentage for display
   * @param value - Decimal value (0-1)
   * @returns Formatted percentage string
   */
  formatPercent(value: number): string {
    const percent = (value * 100).toFixed(1);
    return `${percent}%`;
  }

  /**
   * Get trend icon
   * @param trend - Trend direction
   * @returns Material icon name
   */
  getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
    switch (trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }

  /**
   * Get trend CSS class
   * @param trend - Trend direction
   * @param invertColors - Invert colors (for metrics where down is good)
   * @returns CSS class name
   */
  getTrendClass(trend: 'up' | 'down' | 'neutral', invertColors = false): string {
    if (trend === 'neutral') return 'bi-trend--neutral';

    if (invertColors) {
      return trend === 'up' ? 'bi-trend--negative' : 'bi-trend--positive';
    }
    return trend === 'up' ? 'bi-trend--positive' : 'bi-trend--negative';
  }

  /**
   * Get segment config by segment type
   * @param segment - Segment type
   * @returns Segment configuration
   */
  getSegmentConfig(segment: CustomerSegment) {
    return this.segmentConfigs.find(c => c.segment === segment);
  }

  /**
   * Get heatmap cell color
   * @param retentionRate - Retention rate (0-1)
   * @returns Color hex code
   */
  getHeatmapColor(retentionRate: number): string {
    const index = Math.min(
      Math.floor(retentionRate * (this.cohortHeatmapColors.length - 1)),
      this.cohortHeatmapColors.length - 1
    );
    return this.cohortHeatmapColors[index];
  }

  /**
   * Get relative time string
   * @param date - Date to format
   * @returns Relative time string
   */
  getRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (this.currentLanguage() === 'ar') {
      if (minutes < 1) return 'الآن';
      if (minutes < 60) return `منذ ${minutes} دقيقة`;
      if (hours < 24) return `منذ ${hours} ساعة`;
      return `منذ ${days} أيام`;
    }

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} h ago`;
    return `${days} days ago`;
  }

  /**
   * Track function for ngFor
   */
  trackById(index: number, item: { id: string | number }): string | number {
    return item.id;
  }

  /**
   * Track function for tabs
   */
  trackByTabId(index: number, tab: TabConfig): string {
    return tab.id;
  }

  /**
   * Navigate to insight action
   * @param insight - Quick insight to navigate
   */
  navigateToInsightAction(insight: QuickInsight): void {
    if (insight.actionRoute) {
      this.router.navigate([insight.actionRoute]);
    }
  }

  /**
   * Export dashboard data
   */
  exportData(): void {
    const config = {
      sections: ['all'] as const,
      format: 'xlsx' as const,
      dateRange: this.currentFilters().dateRange,
      includeCharts: true,
      includeRecommendations: true
    };

    this.biService.exportData(config)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Trigger download
          window.open(response.downloadUrl, '_blank');
        },
        error: (error) => {
          console.error('Export error:', error);
          this.errorMessage.set('Failed to export data. Please try again.');
        }
      });
  }
}

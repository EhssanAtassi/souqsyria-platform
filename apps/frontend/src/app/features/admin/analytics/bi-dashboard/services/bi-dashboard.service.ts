/**
 * @file bi-dashboard.service.ts
 * @description Service for Business Intelligence Dashboard API operations.
 *              Handles CLV analytics, conversion funnels, cart abandonment,
 *              and cohort analysis data retrieval and caching.
 * @module AdminDashboard/Analytics/BI/Services
 *
 * @swagger
 * tags:
 *   - name: BI Dashboard
 *     description: Business Intelligence analytics endpoints
 *
 * paths:
 *   /api/admin/bi/hero-metrics:
 *     get:
 *       summary: Get BI dashboard hero metrics
 *       tags: [BI Dashboard]
 *       responses:
 *         200:
 *           description: Hero metrics retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/BIDashboardHeroMetrics'
 *
 *   /api/admin/bi/clv-analytics:
 *     get:
 *       summary: Get CLV analytics data
 *       tags: [BI Dashboard]
 *       parameters:
 *         - name: startDate
 *           in: query
 *           schema:
 *             type: string
 *             format: date
 *         - name: endDate
 *           in: query
 *           schema:
 *             type: string
 *             format: date
 *       responses:
 *         200:
 *           description: CLV analytics retrieved successfully
 *
 *   /api/admin/bi/conversion-funnel:
 *     get:
 *       summary: Get conversion funnel analytics
 *       tags: [BI Dashboard]
 *       responses:
 *         200:
 *           description: Conversion funnel data retrieved successfully
 *
 *   /api/admin/bi/cart-abandonment:
 *     get:
 *       summary: Get cart abandonment analytics
 *       tags: [BI Dashboard]
 *       responses:
 *         200:
 *           description: Cart abandonment data retrieved successfully
 *
 *   /api/admin/bi/cohort-analysis:
 *     get:
 *       summary: Get cohort analysis data
 *       tags: [BI Dashboard]
 *       responses:
 *         200:
 *           description: Cohort analysis retrieved successfully
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin, timer, Subject, BehaviorSubject } from 'rxjs';
import {
  map,
  catchError,
  shareReplay,
  takeUntil,
  switchMap,
  tap,
  retry
} from 'rxjs/operators';

import {
  BIDashboardData,
  BIDashboardHeroMetrics,
  BIDashboardFilters,
  CLVAnalytics,
  ConversionFunnelAnalytics,
  CartAbandonmentAnalytics,
  CohortAnalysis,
  QuickInsight,
  CustomerCLV,
  CustomerSegment,
  AbandonedCart,
  RecoveryCampaign,
  BIExportConfig
} from '../interfaces/bi-dashboard.interfaces';

/**
 * Cache entry interface for data caching
 * @description Stores cached data with expiration timestamp
 */
interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Expiration timestamp */
  expiresAt: number;
}

/**
 * BI Dashboard Service
 * @description Provides comprehensive API operations for the Business Intelligence Dashboard.
 *              Implements data caching, real-time updates, and error handling.
 *
 * @example
 * ```typescript
 * // Inject and use the service
 * private readonly biService = inject(BIDashboardService);
 *
 * // Get hero metrics
 * this.biService.getHeroMetrics().subscribe(metrics => {
 *   console.log('Revenue Impact:', metrics.totalRevenueImpact.value);
 * });
 *
 * // Get CLV analytics with filters
 * this.biService.getCLVAnalytics({
 *   dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' },
 *   segments: ['champion', 'loyal']
 * }).subscribe(clv => console.log('Top customers:', clv.topCustomers));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BIDashboardService {
  /**
   * HTTP client for API calls
   */
  private readonly http = inject(HttpClient);

  /**
   * Base URL for BI API endpoints
   */
  private readonly baseUrl = '/api/admin/bi';

  /**
   * Cache duration in milliseconds (5 minutes)
   */
  private readonly cacheDuration = 5 * 60 * 1000;

  /**
   * Real-time update interval (30 seconds)
   */
  private readonly realTimeInterval = 30 * 1000;

  /**
   * Data cache storage
   */
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Subject for canceling real-time updates
   */
  private readonly stopRealTime$ = new Subject<void>();

  /**
   * Loading state signals
   */
  readonly isLoadingHeroMetrics = signal<boolean>(false);
  readonly isLoadingCLV = signal<boolean>(false);
  readonly isLoadingFunnel = signal<boolean>(false);
  readonly isLoadingAbandonment = signal<boolean>(false);
  readonly isLoadingCohort = signal<boolean>(false);
  readonly isLoadingInsights = signal<boolean>(false);

  /**
   * Overall loading computed signal
   */
  readonly isLoading = computed(() =>
    this.isLoadingHeroMetrics() ||
    this.isLoadingCLV() ||
    this.isLoadingFunnel() ||
    this.isLoadingAbandonment() ||
    this.isLoadingCohort() ||
    this.isLoadingInsights()
  );

  /**
   * Error state signal
   */
  readonly error = signal<string | null>(null);

  /**
   * Last refresh timestamp signal
   */
  readonly lastRefresh = signal<Date>(new Date());

  /**
   * Real-time data subject for abandoned carts alerts
   */
  private readonly abandonedCartAlerts$ = new BehaviorSubject<AbandonedCart[]>([]);

  /**
   * Observable for abandoned cart alerts
   */
  readonly abandonedCartAlerts = this.abandonedCartAlerts$.asObservable();

  // ===========================================================================
  // HERO METRICS
  // ===========================================================================

  /**
   * Get BI Dashboard hero metrics
   * @description Retrieves key metrics for the hero section
   * @param forceRefresh - Skip cache and fetch fresh data
   * @returns Observable of hero metrics
   *
   * @example
   * ```typescript
   * this.biService.getHeroMetrics().subscribe(metrics => {
   *   console.log('Conversion Rate:', metrics.conversionRate.value);
   * });
   * ```
   */
  getHeroMetrics(forceRefresh = false): Observable<BIDashboardHeroMetrics> {
    const cacheKey = 'hero-metrics';

    if (!forceRefresh) {
      const cached = this.getCached<BIDashboardHeroMetrics>(cacheKey);
      if (cached) return of(cached);
    }

    this.isLoadingHeroMetrics.set(true);
    this.error.set(null);

    return this.http.get<BIDashboardHeroMetrics>(`${this.baseUrl}/hero-metrics`).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        this.isLoadingHeroMetrics.set(false);
        this.lastRefresh.set(new Date());
      }),
      catchError(error => {
        this.isLoadingHeroMetrics.set(false);
        this.error.set('Failed to load hero metrics');
        console.error('Hero metrics error:', error);
        return of(this.getMockHeroMetrics());
      }),
      shareReplay(1)
    );
  }

  // ===========================================================================
  // CLV ANALYTICS
  // ===========================================================================

  /**
   * Get CLV Analytics data
   * @description Retrieves comprehensive Customer Lifetime Value analytics
   * @param filters - Optional filters for the data
   * @returns Observable of CLV analytics
   *
   * @example
   * ```typescript
   * this.biService.getCLVAnalytics({
   *   dateRange: { startDate: '2024-01-01', endDate: '2024-01-31' }
   * }).subscribe(clv => console.log('Average CLV:', clv.summary.averageCLV));
   * ```
   */
  getCLVAnalytics(filters?: BIDashboardFilters): Observable<CLVAnalytics> {
    const cacheKey = `clv-analytics-${JSON.stringify(filters || {})}`;

    const cached = this.getCached<CLVAnalytics>(cacheKey);
    if (cached) return of(cached);

    this.isLoadingCLV.set(true);
    this.error.set(null);

    const params = this.buildFilterParams(filters);

    return this.http.get<CLVAnalytics>(`${this.baseUrl}/clv-analytics`, { params }).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        this.isLoadingCLV.set(false);
      }),
      catchError(error => {
        this.isLoadingCLV.set(false);
        this.error.set('Failed to load CLV analytics');
        console.error('CLV analytics error:', error);
        return of(this.getMockCLVAnalytics());
      }),
      shareReplay(1)
    );
  }

  /**
   * Get top customers by CLV
   * @description Retrieves top customers sorted by lifetime value
   * @param limit - Number of customers to retrieve
   * @param segment - Optional segment filter
   * @returns Observable of customer CLV array
   */
  getTopCustomers(limit = 10, segment?: CustomerSegment): Observable<CustomerCLV[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (segment) {
      params = params.set('segment', segment);
    }

    return this.http.get<CustomerCLV[]>(`${this.baseUrl}/clv/top-customers`, { params }).pipe(
      retry(2),
      catchError(error => {
        console.error('Top customers error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get at-risk customers
   * @description Retrieves customers with high churn risk
   * @param limit - Number of customers to retrieve
   * @param minChurnRisk - Minimum churn risk score (0-100)
   * @returns Observable of customer CLV array
   */
  getAtRiskCustomers(limit = 10, minChurnRisk = 70): Observable<CustomerCLV[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('minChurnRisk', minChurnRisk.toString());

    return this.http.get<CustomerCLV[]>(`${this.baseUrl}/clv/at-risk`, { params }).pipe(
      retry(2),
      catchError(error => {
        console.error('At-risk customers error:', error);
        return of([]);
      })
    );
  }

  // ===========================================================================
  // CONVERSION FUNNEL
  // ===========================================================================

  /**
   * Get Conversion Funnel analytics
   * @description Retrieves conversion funnel data with stage breakdown
   * @param filters - Optional filters for the data
   * @returns Observable of conversion funnel analytics
   */
  getConversionFunnel(filters?: BIDashboardFilters): Observable<ConversionFunnelAnalytics> {
    const cacheKey = `funnel-analytics-${JSON.stringify(filters || {})}`;

    const cached = this.getCached<ConversionFunnelAnalytics>(cacheKey);
    if (cached) return of(cached);

    this.isLoadingFunnel.set(true);
    this.error.set(null);

    const params = this.buildFilterParams(filters);

    return this.http.get<ConversionFunnelAnalytics>(
      `${this.baseUrl}/conversion-funnel`,
      { params }
    ).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        this.isLoadingFunnel.set(false);
      }),
      catchError(error => {
        this.isLoadingFunnel.set(false);
        this.error.set('Failed to load conversion funnel');
        console.error('Conversion funnel error:', error);
        return of(this.getMockConversionFunnel());
      }),
      shareReplay(1)
    );
  }

  // ===========================================================================
  // CART ABANDONMENT
  // ===========================================================================

  /**
   * Get Cart Abandonment analytics
   * @description Retrieves cart abandonment data with recovery metrics
   * @param filters - Optional filters for the data
   * @returns Observable of cart abandonment analytics
   */
  getCartAbandonment(filters?: BIDashboardFilters): Observable<CartAbandonmentAnalytics> {
    const cacheKey = `abandonment-analytics-${JSON.stringify(filters || {})}`;

    const cached = this.getCached<CartAbandonmentAnalytics>(cacheKey);
    if (cached) return of(cached);

    this.isLoadingAbandonment.set(true);
    this.error.set(null);

    const params = this.buildFilterParams(filters);

    return this.http.get<CartAbandonmentAnalytics>(
      `${this.baseUrl}/cart-abandonment`,
      { params }
    ).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        this.isLoadingAbandonment.set(false);
      }),
      catchError(error => {
        this.isLoadingAbandonment.set(false);
        this.error.set('Failed to load cart abandonment data');
        console.error('Cart abandonment error:', error);
        return of(this.getMockCartAbandonment());
      }),
      shareReplay(1)
    );
  }

  /**
   * Get recent abandoned carts (real-time)
   * @description Retrieves recently abandoned carts for alerts
   * @param limit - Number of carts to retrieve
   * @returns Observable of abandoned carts
   */
  getRecentAbandonedCarts(limit = 10): Observable<AbandonedCart[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<AbandonedCart[]>(
      `${this.baseUrl}/cart-abandonment/recent`,
      { params }
    ).pipe(
      tap(carts => this.abandonedCartAlerts$.next(carts)),
      catchError(error => {
        console.error('Recent abandoned carts error:', error);
        return of([]);
      })
    );
  }

  /**
   * Get recovery campaigns
   * @description Retrieves active recovery campaigns
   * @returns Observable of recovery campaigns
   */
  getRecoveryCampaigns(): Observable<RecoveryCampaign[]> {
    return this.http.get<RecoveryCampaign[]>(
      `${this.baseUrl}/cart-abandonment/campaigns`
    ).pipe(
      catchError(error => {
        console.error('Recovery campaigns error:', error);
        return of([]);
      })
    );
  }

  /**
   * Trigger recovery campaign for cart
   * @description Initiates a recovery action for an abandoned cart
   * @param cartId - Abandoned cart identifier
   * @param campaignId - Recovery campaign to use
   * @returns Observable of success status
   */
  triggerRecovery(cartId: string, campaignId: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/cart-abandonment/recover`,
      { cartId, campaignId }
    ).pipe(
      catchError(error => {
        console.error('Recovery trigger error:', error);
        return of({ success: false, message: 'Failed to trigger recovery' });
      })
    );
  }

  // ===========================================================================
  // COHORT ANALYSIS
  // ===========================================================================

  /**
   * Get Cohort Analysis data
   * @description Retrieves cohort retention analysis data
   * @param filters - Optional filters for the data
   * @returns Observable of cohort analysis
   */
  getCohortAnalysis(filters?: BIDashboardFilters): Observable<CohortAnalysis> {
    const cacheKey = `cohort-analysis-${JSON.stringify(filters || {})}`;

    const cached = this.getCached<CohortAnalysis>(cacheKey);
    if (cached) return of(cached);

    this.isLoadingCohort.set(true);
    this.error.set(null);

    const params = this.buildFilterParams(filters);

    return this.http.get<CohortAnalysis>(`${this.baseUrl}/cohort-analysis`, { params }).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        this.isLoadingCohort.set(false);
      }),
      catchError(error => {
        this.isLoadingCohort.set(false);
        this.error.set('Failed to load cohort analysis');
        console.error('Cohort analysis error:', error);
        return of(this.getMockCohortAnalysis());
      }),
      shareReplay(1)
    );
  }

  // ===========================================================================
  // QUICK INSIGHTS
  // ===========================================================================

  /**
   * Get Quick Insights for carousel
   * @description Retrieves actionable insights for the dashboard
   * @returns Observable of quick insights
   */
  getQuickInsights(): Observable<QuickInsight[]> {
    const cacheKey = 'quick-insights';

    const cached = this.getCached<QuickInsight[]>(cacheKey);
    if (cached) return of(cached);

    this.isLoadingInsights.set(true);

    return this.http.get<QuickInsight[]>(`${this.baseUrl}/quick-insights`).pipe(
      tap(data => {
        this.setCache(cacheKey, data);
        this.isLoadingInsights.set(false);
      }),
      catchError(error => {
        this.isLoadingInsights.set(false);
        console.error('Quick insights error:', error);
        return of(this.getMockQuickInsights());
      }),
      shareReplay(1)
    );
  }

  // ===========================================================================
  // COMPLETE DASHBOARD DATA
  // ===========================================================================

  /**
   * Get complete BI Dashboard data
   * @description Retrieves all dashboard data in parallel
   * @param filters - Optional filters for the data
   * @returns Observable of complete dashboard data
   */
  getDashboardData(filters?: BIDashboardFilters): Observable<BIDashboardData> {
    return forkJoin({
      heroMetrics: this.getHeroMetrics(),
      quickInsights: this.getQuickInsights(),
      clvAnalytics: this.getCLVAnalytics(filters),
      conversionFunnel: this.getConversionFunnel(filters),
      cartAbandonment: this.getCartAbandonment(filters),
      cohortAnalysis: this.getCohortAnalysis(filters)
    }).pipe(
      map(data => ({
        ...data,
        loadingStates: {
          heroMetrics: false,
          quickInsights: false,
          clvAnalytics: false,
          conversionFunnel: false,
          cartAbandonment: false,
          cohortAnalysis: false
        },
        lastFullRefresh: new Date().toISOString()
      }))
    );
  }

  // ===========================================================================
  // REAL-TIME UPDATES
  // ===========================================================================

  /**
   * Start real-time updates
   * @description Begins polling for real-time data updates
   */
  startRealTimeUpdates(): void {
    timer(0, this.realTimeInterval)
      .pipe(
        takeUntil(this.stopRealTime$),
        switchMap(() => this.getRecentAbandonedCarts(5))
      )
      .subscribe();
  }

  /**
   * Stop real-time updates
   * @description Stops polling for real-time data
   */
  stopRealTimeUpdates(): void {
    this.stopRealTime$.next();
  }

  // ===========================================================================
  // EXPORT FUNCTIONALITY
  // ===========================================================================

  /**
   * Export BI Dashboard data
   * @description Generates an export of selected BI data
   * @param config - Export configuration
   * @returns Observable of export response
   */
  exportData(config: BIExportConfig): Observable<{ downloadUrl: string; fileName: string }> {
    return this.http.post<{ downloadUrl: string; fileName: string }>(
      `${this.baseUrl}/export`,
      config
    ).pipe(
      catchError(error => {
        console.error('Export error:', error);
        throw new Error('Failed to generate export');
      })
    );
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Get cached data
   * @param key - Cache key
   * @returns Cached data if valid, null otherwise
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cached data
   * @param key - Cache key
   * @param data - Data to cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheDuration
    });
  }

  /**
   * Clear all cached data
   * @description Clears the cache and forces fresh data fetch
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Refresh all data
   * @description Clears cache and refetches all dashboard data
   * @param filters - Optional filters
   * @returns Observable of complete dashboard data
   */
  refreshAll(filters?: BIDashboardFilters): Observable<BIDashboardData> {
    this.clearCache();
    return this.getDashboardData(filters);
  }

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Build HTTP params from filters
   * @param filters - Dashboard filters
   * @returns HttpParams object
   */
  private buildFilterParams(filters?: BIDashboardFilters): HttpParams {
    let params = new HttpParams();

    if (!filters) return params;

    if (filters.dateRange) {
      params = params
        .set('startDate', filters.dateRange.startDate)
        .set('endDate', filters.dateRange.endDate);
    }

    if (filters.segments?.length) {
      params = params.set('segments', filters.segments.join(','));
    }

    if (filters.devices?.length) {
      params = params.set('devices', filters.devices.join(','));
    }

    if (filters.minCLV !== undefined) {
      params = params.set('minCLV', filters.minCLV.toString());
    }

    if (filters.maxCLV !== undefined) {
      params = params.set('maxCLV', filters.maxCLV.toString());
    }

    if (filters.compareWithPrevious) {
      params = params.set('compare', 'true');
    }

    return params;
  }

  // ===========================================================================
  // MOCK DATA METHODS (For development/fallback)
  // ===========================================================================

  /**
   * Generate mock hero metrics
   * @returns Mock hero metrics data
   */
  private getMockHeroMetrics(): BIDashboardHeroMetrics {
    return {
      totalRevenueImpact: {
        value: 875420000, // 875,420,000 SYP
        change: 12.5,
        trend: 'up'
      },
      conversionRate: {
        value: 0.0342, // 3.42%
        change: 0.45,
        trend: 'up'
      },
      abandonmentRate: {
        value: 0.684, // 68.4%
        change: -2.3,
        trend: 'down' // Lower is better
      },
      activeSegments: {
        value: 8,
        highValueCount: 1247,
        atRiskCount: 389
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate mock CLV analytics
   * @returns Mock CLV analytics data
   */
  private getMockCLVAnalytics(): CLVAnalytics {
    return {
      summary: {
        totalCustomers: 12458,
        averageCLV: 425000,
        medianCLV: 285000,
        totalProjectedRevenue: 5297550000,
        clvGrowth: 8.7,
        averageTenure: 14.2,
        overallChurnRisk: 23.5
      },
      segments: [
        {
          segment: 'champion',
          customerCount: 847,
          percentageOfTotal: 6.8,
          totalCLV: 1694000000,
          averageCLV: 2000000,
          averageOrderValue: 185000,
          averagePurchaseFrequency: 4.2,
          averageChurnRisk: 5.2
        },
        {
          segment: 'loyal',
          customerCount: 1456,
          percentageOfTotal: 11.7,
          totalCLV: 1310400000,
          averageCLV: 900000,
          averageOrderValue: 120000,
          averagePurchaseFrequency: 2.8,
          averageChurnRisk: 12.4
        },
        {
          segment: 'at_risk',
          customerCount: 892,
          percentageOfTotal: 7.2,
          totalCLV: 535200000,
          averageCLV: 600000,
          averageOrderValue: 95000,
          averagePurchaseFrequency: 1.2,
          averageChurnRisk: 78.5
        }
      ],
      topCustomers: [],
      atRiskCustomers: [],
      clvDistribution: [
        { bucket: '0-100K', minValue: 0, maxValue: 100000, count: 2458, percentage: 19.7 },
        { bucket: '100K-250K', minValue: 100000, maxValue: 250000, count: 3847, percentage: 30.9 },
        { bucket: '250K-500K', minValue: 250000, maxValue: 500000, count: 2956, percentage: 23.7 },
        { bucket: '500K-1M', minValue: 500000, maxValue: 1000000, count: 1847, percentage: 14.8 },
        { bucket: '1M+', minValue: 1000000, maxValue: 999999999, count: 1350, percentage: 10.8 }
      ],
      clvTrend: [
        { period: 'Oct 2023', averageCLV: 385000, totalCLV: 4200000000, customerCount: 10909 },
        { period: 'Nov 2023', averageCLV: 395000, totalCLV: 4500000000, customerCount: 11392 },
        { period: 'Dec 2023', averageCLV: 410000, totalCLV: 4850000000, customerCount: 11829 },
        { period: 'Jan 2024', averageCLV: 425000, totalCLV: 5297550000, customerCount: 12458 }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate mock conversion funnel
   * @returns Mock conversion funnel data
   */
  private getMockConversionFunnel(): ConversionFunnelAnalytics {
    return {
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      currentFunnel: {
        stages: [
          {
            stageId: 'page_view',
            labelEn: 'Page Views',
            labelAr: 'مشاهدات الصفحة',
            count: 125000,
            conversionRate: 1,
            dropOffRate: 0,
            value: 0,
            averageTimeSeconds: 45,
            deviceBreakdown: [
              { device: 'mobile', count: 87500, percentage: 70 },
              { device: 'desktop', count: 31250, percentage: 25 },
              { device: 'tablet', count: 6250, percentage: 5 }
            ]
          },
          {
            stageId: 'product_view',
            labelEn: 'Product Views',
            labelAr: 'مشاهدات المنتج',
            count: 45000,
            conversionRate: 0.36,
            dropOffRate: 0.64,
            value: 0,
            averageTimeSeconds: 120,
            deviceBreakdown: [
              { device: 'mobile', count: 31500, percentage: 70 },
              { device: 'desktop', count: 11250, percentage: 25 },
              { device: 'tablet', count: 2250, percentage: 5 }
            ]
          },
          {
            stageId: 'add_to_cart',
            labelEn: 'Add to Cart',
            labelAr: 'إضافة للسلة',
            count: 12500,
            conversionRate: 0.278,
            dropOffRate: 0.722,
            value: 1875000000,
            averageTimeSeconds: 180,
            deviceBreakdown: [
              { device: 'mobile', count: 8750, percentage: 70 },
              { device: 'desktop', count: 3125, percentage: 25 },
              { device: 'tablet', count: 625, percentage: 5 }
            ]
          },
          {
            stageId: 'begin_checkout',
            labelEn: 'Begin Checkout',
            labelAr: 'بدء الدفع',
            count: 6200,
            conversionRate: 0.496,
            dropOffRate: 0.504,
            value: 930000000,
            averageTimeSeconds: 240,
            deviceBreakdown: [
              { device: 'mobile', count: 4340, percentage: 70 },
              { device: 'desktop', count: 1550, percentage: 25 },
              { device: 'tablet', count: 310, percentage: 5 }
            ]
          },
          {
            stageId: 'purchase',
            labelEn: 'Purchase',
            labelAr: 'شراء',
            count: 4275,
            conversionRate: 0.69,
            dropOffRate: 0.31,
            value: 641250000,
            averageTimeSeconds: 60,
            deviceBreakdown: [
              { device: 'mobile', count: 2993, percentage: 70 },
              { device: 'desktop', count: 1069, percentage: 25 },
              { device: 'tablet', count: 213, percentage: 5 }
            ]
          }
        ],
        overallConversionRate: 0.0342,
        totalVisitors: 125000,
        totalConversions: 4275,
        totalRevenue: 641250000,
        averageTimeToConversion: 645
      },
      previousPeriodComparison: {
        overallConversionRateChange: 0.45,
        visitorChange: 8.2,
        conversionChange: 12.5,
        revenueChange: 15.3
      },
      deviceFunnels: [],
      biggestDropOff: {
        fromStage: 'page_view',
        toStage: 'product_view',
        dropOffRate: 0.64,
        estimatedLostRevenue: 850000000,
        recommendedActions: [
          'Improve homepage product discovery',
          'Add personalized product recommendations',
          'Optimize search functionality'
        ]
      },
      trends: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate mock cart abandonment data
   * @returns Mock cart abandonment data
   */
  private getMockCartAbandonment(): CartAbandonmentAnalytics {
    return {
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      summary: {
        abandonmentRate: 0.684,
        totalAbandonedCarts: 8225,
        totalAbandonedValue: 1233750000,
        averageAbandonedCartValue: 150000,
        abandonmentRateChange: -2.3,
        recoveryRate: 0.156,
        totalRecoveredValue: 192465000,
        revenueRecovered: 192465000
      },
      reasonBreakdown: [
        {
          reason: 'high_shipping_cost',
          labelEn: 'High Shipping Cost',
          labelAr: 'تكلفة شحن مرتفعة',
          count: 2467,
          percentage: 30,
          averageCartValue: 145000
        },
        {
          reason: 'unexpected_costs',
          labelEn: 'Unexpected Costs',
          labelAr: 'تكاليف غير متوقعة',
          count: 1645,
          percentage: 20,
          averageCartValue: 162000
        },
        {
          reason: 'just_browsing',
          labelEn: 'Just Browsing',
          labelAr: 'تصفح فقط',
          count: 1398,
          percentage: 17,
          averageCartValue: 125000
        },
        {
          reason: 'complex_checkout',
          labelEn: 'Complex Checkout',
          labelAr: 'عملية دفع معقدة',
          count: 1069,
          percentage: 13,
          averageCartValue: 178000
        },
        {
          reason: 'payment_issues',
          labelEn: 'Payment Issues',
          labelAr: 'مشاكل في الدفع',
          count: 822,
          percentage: 10,
          averageCartValue: 195000
        },
        {
          reason: 'other',
          labelEn: 'Other',
          labelAr: 'أخرى',
          count: 824,
          percentage: 10,
          averageCartValue: 138000
        }
      ],
      stageBreakdown: [],
      deviceBreakdown: [
        { device: 'mobile', abandonmentRate: 0.72, count: 5758, totalValue: 863700000 },
        { device: 'desktop', abandonmentRate: 0.58, count: 2056, totalValue: 308400000 },
        { device: 'tablet', abandonmentRate: 0.65, count: 411, totalValue: 61650000 }
      ],
      recentAbandonedCarts: [],
      activeCampaigns: [],
      trends: [],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate mock cohort analysis
   * @returns Mock cohort analysis data
   */
  private getMockCohortAnalysis(): CohortAnalysis {
    return {
      dateRange: {
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      cohortDefinition: 'first_purchase',
      retentionMetric: 'purchase',
      periodType: 'week',
      summary: {
        totalCohorts: 6,
        totalCustomers: 12458,
        averageWeek1Retention: 0.42,
        averageWeek4Retention: 0.28,
        averageWeek8Retention: 0.21,
        averageWeek12Retention: 0.17,
        bestCohort: {
          cohortId: '2023-12',
          label: 'Dec 2023',
          week12Retention: 0.24
        },
        worstCohort: {
          cohortId: '2023-08',
          label: 'Aug 2023',
          week12Retention: 0.12
        },
        retentionTrend: 'improving',
        totalRevenue: 5297550000
      },
      cohorts: [
        {
          cohortId: '2024-01',
          label: 'Jan 2024',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          initialSize: 1847,
          retention: [1, 0.45, 0.35, 0.28],
          revenueByPeriod: [185700000, 83565000, 64995000, 51996000],
          aovByPeriod: [100500, 110200, 108500, 115000],
          cumulativeRevenue: 386256000,
          averageCustomerValue: 209000
        },
        {
          cohortId: '2023-12',
          label: 'Dec 2023',
          startDate: '2023-12-01',
          endDate: '2023-12-31',
          initialSize: 2156,
          retention: [1, 0.48, 0.38, 0.32, 0.28, 0.24],
          revenueByPeriod: [258720000, 124185600, 98313600, 82790400, 72441600, 62092800],
          aovByPeriod: [120000, 118500, 122000, 125000, 128000, 126000],
          cumulativeRevenue: 698544000,
          averageCustomerValue: 324000
        }
      ],
      heatmapData: [
        {
          cohortId: '2024-01',
          cohortLabel: 'Jan 2024',
          periods: [
            { periodIndex: 0, periodLabel: 'Week 0', retentionRate: 1, customerCount: 1847, revenue: 185700000 },
            { periodIndex: 1, periodLabel: 'Week 1', retentionRate: 0.45, customerCount: 831, revenue: 83565000 },
            { periodIndex: 2, periodLabel: 'Week 2', retentionRate: 0.35, customerCount: 646, revenue: 64995000 },
            { periodIndex: 3, periodLabel: 'Week 3', retentionRate: 0.28, customerCount: 517, revenue: 51996000 }
          ]
        }
      ],
      behaviorPatterns: [
        {
          patternId: 'weekend-shoppers',
          name: 'Weekend Shoppers',
          description: 'Customers who primarily shop on weekends',
          customerPercentage: 35,
          revenueImpact: 1854000000,
          recommendedAction: 'Target with Friday SMS campaigns',
          metrics: {
            averageOrderFrequency: 1.8,
            averageOrderValue: 145000,
            preferredCategories: ['Electronics', 'Fashion'],
            preferredPaymentMethod: 'cash_on_delivery',
            peakPurchaseTime: 'Saturday 14:00-18:00'
          }
        }
      ],
      lifecycleStages: [
        { stage: 'new', labelEn: 'New', labelAr: 'جديد', count: 2458, percentage: 19.7, averageValue: 85000 },
        { stage: 'active', labelEn: 'Active', labelAr: 'نشط', count: 5847, percentage: 46.9, averageValue: 425000 },
        { stage: 'at_risk', labelEn: 'At Risk', labelAr: 'معرض للخطر', count: 1956, percentage: 15.7, averageValue: 285000 },
        { stage: 'dormant', labelEn: 'Dormant', labelAr: 'خامل', count: 1450, percentage: 11.6, averageValue: 180000 },
        { stage: 'churned', labelEn: 'Churned', labelAr: 'مفقود', count: 747, percentage: 6.0, averageValue: 120000 }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate mock quick insights
   * @returns Mock quick insights data
   */
  private getMockQuickInsights(): QuickInsight[] {
    return [
      {
        id: '1',
        type: 'clv',
        priority: 1,
        titleEn: 'High-Value Customers Alert',
        titleAr: 'تنبيه العملاء ذوي القيمة العالية',
        descriptionEn: '47 champion customers haven\'t purchased in 30+ days',
        descriptionAr: '47 عميل مميز لم يشتروا منذ أكثر من 30 يوماً',
        metricValue: 47,
        metricLabel: 'At Risk Champions',
        trend: 'up',
        trendPercentage: 12,
        actionLabelEn: 'View Customers',
        actionLabelAr: 'عرض العملاء',
        actionRoute: '/admin/analytics/bi/clv?segment=at_risk',
        icon: 'warning',
        color: 'danger',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'funnel',
        priority: 2,
        titleEn: 'Checkout Drop-off Spike',
        titleAr: 'ارتفاع في التخلي عن الدفع',
        descriptionEn: 'Cart to checkout conversion dropped 8% this week',
        descriptionAr: 'انخفض تحويل السلة إلى الدفع بنسبة 8% هذا الأسبوع',
        metricValue: '-8%',
        metricLabel: 'Conversion Change',
        trend: 'down',
        trendPercentage: -8,
        actionLabelEn: 'Analyze Funnel',
        actionLabelAr: 'تحليل المسار',
        actionRoute: '/admin/analytics/bi/funnel',
        icon: 'trending_down',
        color: 'warning',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        type: 'abandonment',
        priority: 1,
        titleEn: 'Recovery Success',
        titleAr: 'نجاح الاسترداد',
        descriptionEn: 'WhatsApp campaign recovered 1.2M SYP today',
        descriptionAr: 'حملة واتساب استردت 1.2 مليون ل.س اليوم',
        metricValue: '1.2M',
        metricLabel: 'SYP Recovered',
        trend: 'up',
        trendPercentage: 25,
        actionLabelEn: 'View Campaign',
        actionLabelAr: 'عرض الحملة',
        actionRoute: '/admin/analytics/bi/abandonment/campaigns',
        icon: 'celebration',
        color: 'success',
        timestamp: new Date().toISOString()
      },
      {
        id: '4',
        type: 'cohort',
        priority: 3,
        titleEn: 'Retention Improving',
        titleAr: 'تحسن الاحتفاظ',
        descriptionEn: 'December cohort shows 24% week-12 retention',
        descriptionAr: 'مجموعة ديسمبر تظهر احتفاظ 24% في الأسبوع 12',
        metricValue: '24%',
        metricLabel: 'Week 12 Retention',
        trend: 'up',
        trendPercentage: 5,
        actionLabelEn: 'View Cohorts',
        actionLabelAr: 'عرض المجموعات',
        actionRoute: '/admin/analytics/bi/cohort',
        icon: 'groups',
        color: 'info',
        timestamp: new Date().toISOString()
      },
      {
        id: '5',
        type: 'recommendation',
        priority: 2,
        titleEn: 'Segment Opportunity',
        titleAr: 'فرصة شريحة',
        descriptionEn: '892 "promising" customers ready for upsell',
        descriptionAr: '892 عميل "واعد" جاهزون للترقية',
        metricValue: 892,
        metricLabel: 'Customers',
        actionLabelEn: 'Create Campaign',
        actionLabelAr: 'إنشاء حملة',
        actionRoute: '/admin/analytics/bi/clv?segment=promising',
        icon: 'lightbulb',
        color: 'primary',
        timestamp: new Date().toISOString()
      }
    ];
  }
}

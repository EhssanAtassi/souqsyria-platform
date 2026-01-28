/**
 * @file bi-analytics.service.ts
 * @description Service for Business Intelligence (BI) analytics API operations.
 *              Handles CLV analytics, conversion funnels, cohort analysis, and cart abandonment.
 *              Integrates with backend BI analytics endpoints.
 * @module AdminDashboard/Services/BIAnalytics
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminApiService } from './admin-api.service';
import {
  // CLV Interfaces
  CLVAnalyticsData,
  CLVAnalyticsQuery,
  CLVSummary,
  CustomerSegment,
  HighValueCustomer,
  CLVPrediction,
  // Funnel Interfaces
  FunnelAnalyticsData,
  FunnelAnalyticsQuery,
  FunnelOverview,
  FunnelByDevice,
  FunnelDropoffPoint,
  // Cohort Interfaces
  CohortAnalyticsData,
  CohortAnalyticsQuery,
  CohortRetention,
  CohortRevenue,
  CohortBehavior,
  // Cart Abandonment Interfaces
  CartAbandonmentData,
  CartAbandonmentQuery,
  CartAbandonmentOverview,
  AbandonedCart,
  AbandonedProduct,
  CartAbandonmentSummary,
  AbandonmentByReason,
  AbandonmentTrend,
  RecoveryCampaignMetrics,
  RecoveryMetrics,
  // Enhanced Dashboard
  EnhancedDashboardSummary,
  BIDateRangeQuery
} from '../interfaces';

/**
 * Business Intelligence Analytics Service
 * @description Provides API operations for advanced BI analytics in the admin dashboard.
 *              Supports CLV analytics, conversion funnels, cohort analysis, and cart abandonment tracking.
 *
 * @example
 * ```typescript
 * // Get CLV analytics
 * this.biAnalyticsService.getCLVAnalytics({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   includePredictions: true
 * }).subscribe(data => console.log('CLV Data:', data));
 *
 * // Get funnel analytics
 * this.biAnalyticsService.getFunnelAnalytics({
 *   startDate: '2024-01-01',
 *   endDate: '2024-01-31',
 *   device: 'mobile'
 * }).subscribe(funnel => console.log('Funnel:', funnel));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class BiAnalyticsService {
  /**
   * Base API service for HTTP operations
   */
  private readonly api = inject(AdminApiService);

  /**
   * Base path for BI analytics endpoints
   */
  private readonly basePath = 'bi-analytics';

  // =============================================================================
  // ENHANCED DASHBOARD OVERVIEW
  // =============================================================================

  /**
   * Get enhanced dashboard summary
   * @description Retrieves combined BI metrics for dashboard overview
   * @param query - Date range query parameters
   * @returns Observable of enhanced dashboard summary
   *
   * @example
   * ```typescript
   * this.biAnalyticsService.getEnhancedDashboard({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getEnhancedDashboard(query: BIDateRangeQuery): Observable<EnhancedDashboardSummary> {
    return this.api.get<EnhancedDashboardSummary>(`${this.basePath}/dashboard`, query);
  }

  // =============================================================================
  // CUSTOMER LIFETIME VALUE (CLV) ANALYTICS
  // =============================================================================

  /**
   * Get complete CLV analytics data
   * @description Retrieves comprehensive CLV analytics including segments, trends, and predictions
   * @param query - CLV analytics query parameters
   * @returns Observable of CLV analytics data
   *
   * @example
   * ```typescript
   * // Get CLV analytics with predictions
   * this.biAnalyticsService.getCLVAnalytics({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   includePredictions: true,
   *   topCustomersLimit: 20
   * });
   * ```
   */
  getCLVAnalytics(query: CLVAnalyticsQuery): Observable<CLVAnalyticsData> {
    return this.api.get<CLVAnalyticsData>(`${this.basePath}/clv`, query);
  }

  /**
   * Get CLV summary metrics
   * @description Retrieves high-level CLV metrics overview
   * @param query - Date range query
   * @returns Observable of CLV summary
   */
  getCLVSummary(query: BIDateRangeQuery): Observable<CLVSummary> {
    return this.api.get<CLVSummary>(`${this.basePath}/clv/summary`, query);
  }

  /**
   * Get customer segments breakdown
   * @description Retrieves customer segments based on CLV tiers
   * @param query - Date range query
   * @returns Observable of customer segments array
   *
   * @example
   * ```typescript
   * // Get customer segments
   * this.biAnalyticsService.getCustomerSegments({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * });
   * ```
   */
  getCustomerSegments(query: BIDateRangeQuery): Observable<CustomerSegment[]> {
    return this.api.get<CustomerSegment[]>(`${this.basePath}/clv/segments`, query);
  }

  /**
   * Get top customers by CLV
   * @description Retrieves highest value customers ranked by CLV
   * @param query - Query with limit parameter
   * @returns Observable of high-value customers array
   *
   * @example
   * ```typescript
   * // Get top 50 customers by CLV
   * this.biAnalyticsService.getTopCLVCustomers({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   topCustomersLimit: 50
   * });
   * ```
   */
  getTopCLVCustomers(query: CLVAnalyticsQuery): Observable<HighValueCustomer[]> {
    return this.api.get<HighValueCustomer[]>(`${this.basePath}/clv/top-customers`, query);
  }

  /**
   * Get CLV predictions
   * @description Retrieves predicted CLV for future timeframes
   * @param query - Date range query
   * @returns Observable of CLV predictions array
   *
   * @example
   * ```typescript
   * // Get CLV predictions for next 12 months
   * this.biAnalyticsService.getCLVPredictions({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * });
   * ```
   */
  getCLVPredictions(query: BIDateRangeQuery): Observable<CLVPrediction[]> {
    return this.api.get<CLVPrediction[]>(`${this.basePath}/clv/predictions`, query);
  }

  /**
   * Get CLV prediction for a specific customer
   * @description Retrieves detailed CLV prediction for an individual customer
   * @param customerId - Customer ID
   * @param timeframe - Prediction timeframe (e.g., "30_days", "1_year")
   * @returns Observable of CLV prediction
   *
   * @example
   * ```typescript
   * // Get 1-year CLV prediction for customer
   * this.biAnalyticsService.getCustomerCLVPrediction(12345, '1_year');
   * ```
   */
  getCustomerCLVPrediction(customerId: number, timeframe: string): Observable<CLVPrediction> {
    return this.api.get<CLVPrediction>(`${this.basePath}/clv/customer/${customerId}/prediction`, {
      timeframe
    });
  }

  // =============================================================================
  // CONVERSION FUNNEL ANALYTICS
  // =============================================================================

  /**
   * Get complete conversion funnel analytics
   * @description Retrieves comprehensive funnel analytics with device breakdown and drop-off analysis
   * @param query - Funnel analytics query parameters
   * @returns Observable of funnel analytics data
   *
   * @example
   * ```typescript
   * // Get funnel analytics for mobile devices
   * this.biAnalyticsService.getFunnelAnalytics({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   device: 'mobile',
   *   includeExitPages: true
   * });
   * ```
   */
  getFunnelAnalytics(query: FunnelAnalyticsQuery): Observable<FunnelAnalyticsData> {
    return this.api.get<FunnelAnalyticsData>(`${this.basePath}/funnel`, query);
  }

  /**
   * Get funnel overview metrics
   * @description Retrieves high-level funnel performance metrics
   * @param query - Funnel analytics query
   * @returns Observable of funnel overview
   */
  getFunnelOverview(query: FunnelAnalyticsQuery): Observable<FunnelOverview> {
    return this.api.get<FunnelOverview>(`${this.basePath}/funnel/overview`, query);
  }

  /**
   * Get funnel breakdown by device
   * @description Retrieves funnel metrics segmented by device type
   * @param query - Funnel analytics query
   * @returns Observable of funnel by device array
   *
   * @example
   * ```typescript
   * // Get device-specific funnel data
   * this.biAnalyticsService.getFunnelByDevice({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getFunnelByDevice(query: FunnelAnalyticsQuery): Observable<FunnelByDevice[]> {
    return this.api.get<FunnelByDevice[]>(`${this.basePath}/funnel/by-device`, query);
  }

  /**
   * Get funnel drop-off analysis
   * @description Retrieves detailed analysis of where users drop off in the funnel
   * @param query - Funnel analytics query
   * @returns Observable of drop-off points array
   *
   * @example
   * ```typescript
   * // Analyze funnel drop-off points
   * this.biAnalyticsService.getFunnelDropoffs({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getFunnelDropoffs(query: FunnelAnalyticsQuery): Observable<FunnelDropoffPoint[]> {
    return this.api.get<FunnelDropoffPoint[]>(`${this.basePath}/funnel/dropoffs`, query);
  }

  /**
   * Get funnel step details
   * @description Retrieves detailed metrics for a specific funnel stage
   * @param stageId - Funnel stage identifier
   * @param query - Funnel analytics query
   * @returns Observable of funnel stage data
   *
   * @example
   * ```typescript
   * // Get details for checkout stage
   * this.biAnalyticsService.getFunnelStepDetails('checkout_initiated', {
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getFunnelStepDetails(stageId: string, query: FunnelAnalyticsQuery): Observable<any> {
    return this.api.get(`${this.basePath}/funnel/stage/${stageId}`, query);
  }

  // =============================================================================
  // COHORT ANALYSIS
  // =============================================================================

  /**
   * Get complete cohort analytics data
   * @description Retrieves comprehensive cohort analysis including retention, revenue, and behavior
   * @param query - Cohort analytics query parameters
   * @returns Observable of cohort analytics data
   *
   * @example
   * ```typescript
   * // Get monthly cohort analysis for last 6 months
   * this.biAnalyticsService.getCohortAnalytics({
   *   startDate: '2023-07-01',
   *   endDate: '2024-01-31',
   *   cohortType: 'first_purchase',
   *   periodType: 'month',
   *   periods: 6
   * });
   * ```
   */
  getCohortAnalytics(query: CohortAnalyticsQuery): Observable<CohortAnalyticsData> {
    return this.api.get<CohortAnalyticsData>(`${this.basePath}/cohort`, query);
  }

  /**
   * Get cohort retention data
   * @description Retrieves retention metrics for cohorts over time
   * @param query - Cohort analytics query
   * @returns Observable of cohort retention array
   *
   * @example
   * ```typescript
   * // Get weekly cohort retention
   * this.biAnalyticsService.getCohortRetention({
   *   startDate: '2024-01-01',
   *   endDate: '2024-03-31',
   *   periodType: 'week',
   *   periods: 12
   * });
   * ```
   */
  getCohortRetention(query: CohortAnalyticsQuery): Observable<CohortRetention[]> {
    return this.api.get<CohortRetention[]>(`${this.basePath}/cohort/retention`, query);
  }

  /**
   * Get cohort revenue data
   * @description Retrieves revenue metrics for cohorts over time
   * @param query - Cohort analytics query
   * @returns Observable of cohort revenue array
   *
   * @example
   * ```typescript
   * // Get cohort revenue trends
   * this.biAnalyticsService.getCohortRevenue({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   periodType: 'month'
   * });
   * ```
   */
  getCohortRevenue(query: CohortAnalyticsQuery): Observable<CohortRevenue[]> {
    return this.api.get<CohortRevenue[]>(`${this.basePath}/cohort/revenue`, query);
  }

  /**
   * Get cohort behavior patterns
   * @description Retrieves behavioral patterns and preferences for cohorts
   * @param query - Cohort analytics query
   * @returns Observable of cohort behavior array
   *
   * @example
   * ```typescript
   * // Get cohort behavior analysis
   * this.biAnalyticsService.getCohortBehavior({
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31',
   *   cohortType: 'acquisition_date'
   * });
   * ```
   */
  getCohortBehavior(query: CohortAnalyticsQuery): Observable<CohortBehavior[]> {
    return this.api.get<CohortBehavior[]>(`${this.basePath}/cohort/behavior`, query);
  }

  /**
   * Get specific cohort details
   * @description Retrieves detailed analytics for a specific cohort
   * @param cohortId - Cohort identifier
   * @param query - Date range query
   * @returns Observable of cohort data
   *
   * @example
   * ```typescript
   * // Get details for January 2024 cohort
   * this.biAnalyticsService.getCohortDetails('2024-01', {
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * });
   * ```
   */
  getCohortDetails(cohortId: string, query: BIDateRangeQuery): Observable<any> {
    return this.api.get(`${this.basePath}/cohort/${cohortId}`, query);
  }

  // =============================================================================
  // CART ABANDONMENT ANALYTICS
  // =============================================================================

  /**
   * Get complete cart abandonment analytics
   * @description Retrieves comprehensive cart abandonment analysis with recovery metrics
   * @param query - Cart abandonment query parameters
   * @returns Observable of cart abandonment data
   *
   * @example
   * ```typescript
   * // Get cart abandonment analytics
   * this.biAnalyticsService.getCartAbandonmentAnalytics({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   includeItems: true,
   *   minCartValue: 50000
   * });
   * ```
   */
  getCartAbandonmentAnalytics(query: CartAbandonmentQuery): Observable<CartAbandonmentData> {
    return this.api.get<CartAbandonmentData>(`${this.basePath}/cart-abandonment`, query);
  }

  /**
   * Get cart abandonment overview
   * @description Retrieves high-level cart abandonment metrics
   * @param query - Cart abandonment query
   * @returns Observable of cart abandonment overview
   */
  getCartAbandonmentOverview(query: CartAbandonmentQuery): Observable<CartAbandonmentOverview> {
    return this.api.get<CartAbandonmentOverview>(`${this.basePath}/cart-abandonment/overview`, query);
  }

  /**
   * Get abandoned carts list
   * @description Retrieves list of abandoned carts with details
   * @param query - Cart abandonment query with filters
   * @returns Observable of abandoned carts array
   *
   * @example
   * ```typescript
   * // Get high-value abandoned carts
   * this.biAnalyticsService.getAbandonedCarts({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   minCartValue: 100000,
   *   recoveryStatus: 'pending'
   * });
   * ```
   */
  getAbandonedCarts(query: CartAbandonmentQuery): Observable<AbandonedCart[]> {
    return this.api.get<AbandonedCart[]>(`${this.basePath}/cart-abandonment/carts`, query);
  }

  /**
   * Get abandoned products
   * @description Retrieves products most frequently abandoned in carts
   * @param query - Date range query
   * @returns Observable of abandoned product statistics
   *
   * @example
   * ```typescript
   * this.biAnalyticsService.getAbandonedProducts({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getAbandonedProducts(query: BIDateRangeQuery): Observable<AbandonedProduct[]> {
    return this.api.get<AbandonedProduct[]>(`${this.basePath}/cart-abandonment/products`, query);
  }

  /**
   * Get cart abandonment summary
   * @description Retrieves high-level summary of cart abandonment metrics
   * @param query - Date range query
   * @returns Observable of cart abandonment summary
   *
   * @example
   * ```typescript
   * this.biAnalyticsService.getCartAbandonmentSummary({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getCartAbandonmentSummary(query: BIDateRangeQuery): Observable<CartAbandonmentSummary> {
    return this.api.get<CartAbandonmentSummary>(`${this.basePath}/cart-abandonment/summary`, query);
  }

  /**
   * Get abandonment by reason
   * @description Retrieves abandonment statistics grouped by reason
   * @param query - Date range query
   * @returns Observable of abandonment by reason data
   *
   * @example
   * ```typescript
   * this.biAnalyticsService.getAbandonmentByReason({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getAbandonmentByReason(query: BIDateRangeQuery): Observable<AbandonmentByReason[]> {
    return this.api.get<AbandonmentByReason[]>(`${this.basePath}/cart-abandonment/by-reason`, query);
  }

  /**
   * Get abandonment trends
   * @description Retrieves cart abandonment trends over time
   * @param query - Date range query
   * @returns Observable of abandonment trend data
   *
   * @example
   * ```typescript
   * this.biAnalyticsService.getAbandonmentTrends({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   granularity: 'daily'
   * });
   * ```
   */
  getAbandonmentTrends(query: BIDateRangeQuery): Observable<AbandonmentTrend[]> {
    return this.api.get<AbandonmentTrend[]>(`${this.basePath}/cart-abandonment/trends`, query);
  }

  /**
   * Get recovery campaign metrics
   * @description Retrieves performance metrics for cart recovery campaigns
   * @param query - Date range query
   * @returns Observable of recovery campaign metrics array
   *
   * @example
   * ```typescript
   * // Get recovery campaign performance
   * this.biAnalyticsService.getRecoveryCampaigns({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getRecoveryCampaigns(query: BIDateRangeQuery): Observable<RecoveryCampaignMetrics[]> {
    return this.api.get<RecoveryCampaignMetrics[]>(`${this.basePath}/cart-abandonment/campaigns`, query);
  }

  /**
   * Get recovery metrics summary
   * @description Retrieves overall cart recovery performance metrics
   * @param query - Date range query
   * @returns Observable of recovery metrics
   *
   * @example
   * ```typescript
   * // Get recovery metrics
   * this.biAnalyticsService.getRecoveryMetrics({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31'
   * });
   * ```
   */
  getRecoveryMetrics(query: BIDateRangeQuery): Observable<RecoveryMetrics> {
    return this.api.get<RecoveryMetrics>(`${this.basePath}/cart-abandonment/recovery-metrics`, query);
  }

  /**
   * Get abandoned cart details
   * @description Retrieves detailed information for a specific abandoned cart
   * @param cartId - Cart/session identifier
   * @returns Observable of abandoned cart details
   *
   * @example
   * ```typescript
   * // Get details for specific abandoned cart
   * this.biAnalyticsService.getAbandonedCartDetails('cart_abc123');
   * ```
   */
  getAbandonedCartDetails(cartId: string): Observable<AbandonedCart> {
    return this.api.get<AbandonedCart>(`${this.basePath}/cart-abandonment/cart/${cartId}`);
  }

  /**
   * Trigger recovery campaign for cart
   * @description Manually trigger a recovery email for an abandoned cart
   * @param cartId - Cart/session identifier
   * @param campaignType - Type of recovery campaign to send
   * @returns Observable of trigger response
   *
   * @example
   * ```typescript
   * // Send recovery email for abandoned cart
   * this.biAnalyticsService.triggerRecoveryCampaign('cart_abc123', 'discount_offer');
   * ```
   */
  triggerRecoveryCampaign(cartId: string, campaignType: string): Observable<{ success: boolean; message: string }> {
    return this.api.post(`${this.basePath}/cart-abandonment/cart/${cartId}/recover`, {
      campaignType
    });
  }

  // =============================================================================
  // EXPORT & REPORTING
  // =============================================================================

  /**
   * Export CLV analytics report
   * @description Generates downloadable CLV analytics report
   * @param format - Export format (csv, xlsx, pdf)
   * @param query - CLV analytics query
   * @returns Observable of download URL
   *
   * @example
   * ```typescript
   * // Export CLV report as Excel
   * this.biAnalyticsService.exportCLVReport('xlsx', {
   *   startDate: '2024-01-01',
   *   endDate: '2024-12-31'
   * }).subscribe(response => {
   *   window.open(response.downloadUrl, '_blank');
   * });
   * ```
   */
  exportCLVReport(format: 'csv' | 'xlsx' | 'pdf', query: CLVAnalyticsQuery): Observable<{ downloadUrl: string }> {
    return this.api.post(`${this.basePath}/clv/export`, {
      format,
      ...query
    });
  }

  /**
   * Export funnel analytics report
   * @description Generates downloadable funnel analytics report
   * @param format - Export format
   * @param query - Funnel analytics query
   * @returns Observable of download URL
   */
  exportFunnelReport(format: 'csv' | 'xlsx' | 'pdf', query: FunnelAnalyticsQuery): Observable<{ downloadUrl: string }> {
    return this.api.post(`${this.basePath}/funnel/export`, {
      format,
      ...query
    });
  }

  /**
   * Export cohort analysis report
   * @description Generates downloadable cohort analysis report
   * @param format - Export format
   * @param query - Cohort analytics query
   * @returns Observable of download URL
   */
  exportCohortReport(format: 'csv' | 'xlsx' | 'pdf', query: CohortAnalyticsQuery): Observable<{ downloadUrl: string }> {
    return this.api.post(`${this.basePath}/cohort/export`, {
      format,
      ...query
    });
  }

  /**
   * Export cart abandonment report
   * @description Generates downloadable cart abandonment report
   * @param format - Export format
   * @param query - Cart abandonment query
   * @returns Observable of download URL
   */
  exportAbandonmentReport(format: 'csv' | 'xlsx' | 'pdf', query: CartAbandonmentQuery): Observable<{ downloadUrl: string }> {
    return this.api.post(`${this.basePath}/cart-abandonment/export`, {
      format,
      ...query
    });
  }
}

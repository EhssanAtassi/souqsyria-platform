/**
 * @file admin-analytics.service.ts
 * @description Service for analytics and reporting API operations.
 *              Handles dashboard metrics, revenue charts, sales analytics,
 *              and data exports.
 * @module AdminDashboard/Services
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminApiService } from './admin-api.service';
import {
  DashboardMetrics,
  DashboardOverview,
  RevenueChartData,
  TopSellingProduct,
  RecentOrder,
  PendingActions,
  PeriodType,
  SalesAnalytics,
  UserAnalytics,
  CommissionReport,
  AnalyticsDateRangeQuery,
  ExportFormat,
  ExportResponse
} from '../interfaces';

/**
 * Admin Analytics Service
 * @description Provides API operations for analytics and reporting in the admin dashboard.
 *              Supports dashboard metrics, revenue charts, sales analytics,
 *              user analytics, and data exports.
 *
 * @example
 * ```typescript
 * // Get dashboard overview
 * this.analyticsService.getDashboardOverview()
 *   .subscribe(overview => console.log('Metrics:', overview.metrics));
 *
 * // Get revenue chart for monthly period
 * this.analyticsService.getRevenueChart('monthly')
 *   .subscribe(chartData => console.log('Chart:', chartData));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminAnalyticsService {
  /**
   * Base API service for HTTP operations
   */
  private readonly api = inject(AdminApiService);

  // =========================================================================
  // DASHBOARD METRICS
  // =========================================================================

  /**
   * Get dashboard metrics
   * @description Retrieves key performance metrics for the dashboard
   * @returns Observable of dashboard metrics
   */
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.api.get<DashboardMetrics>('metrics');
  }

  /**
   * Get pending actions count
   * @description Retrieves counts of items requiring admin attention
   * @returns Observable of pending actions
   */
  getPendingActions(): Observable<PendingActions> {
    return this.api.get<PendingActions>('pending-actions');
  }

  /**
   * Get complete dashboard overview
   * @description Retrieves all dashboard data in a single call
   * @returns Observable of dashboard overview
   */
  getDashboardOverview(): Observable<DashboardOverview> {
    return this.api.get<DashboardOverview>('overview');
  }

  // =========================================================================
  // REVENUE CHARTS
  // =========================================================================

  /**
   * Get revenue chart data
   * @description Retrieves revenue data for chart visualization
   * @param periodType - Aggregation period (daily, weekly, monthly, yearly)
   * @returns Observable of chart data
   *
   * @example
   * ```typescript
   * // Get monthly revenue chart
   * this.analyticsService.getRevenueChart('monthly');
   *
   * // Get daily revenue chart
   * this.analyticsService.getRevenueChart('daily');
   * ```
   */
  getRevenueChart(periodType: PeriodType = 'monthly'): Observable<RevenueChartData> {
    return this.api.get<RevenueChartData>('revenue-chart', { periodType });
  }

  /**
   * Get revenue comparison
   * @description Compares revenue between two periods
   * @param currentPeriod - Current period dates
   * @param comparisonPeriod - Comparison period dates
   * @returns Observable of comparison data
   */
  getRevenueComparison(
    currentPeriod: { startDate: string; endDate: string },
    comparisonPeriod: { startDate: string; endDate: string }
  ): Observable<{
    current: {
      period: { startDate: string; endDate: string };
      revenue: number;
      orders: number;
      averageOrderValue: number;
    };
    comparison: {
      period: { startDate: string; endDate: string };
      revenue: number;
      orders: number;
      averageOrderValue: number;
    };
    growth: {
      revenue: number;
      orders: number;
      averageOrderValue: number;
    };
  }> {
    return this.api.get('revenue-comparison', {
      currentStart: currentPeriod.startDate,
      currentEnd: currentPeriod.endDate,
      comparisonStart: comparisonPeriod.startDate,
      comparisonEnd: comparisonPeriod.endDate
    });
  }

  // =========================================================================
  // TOP PRODUCTS & RECENT ORDERS
  // =========================================================================

  /**
   * Get top selling products
   * @description Retrieves list of best-selling products
   * @param limit - Number of products to retrieve (default: 5)
   * @returns Observable of top selling products
   */
  getTopSellingProducts(limit = 5): Observable<TopSellingProduct[]> {
    return this.api.get<TopSellingProduct[]>('top-products', { limit });
  }

  /**
   * Get recent orders
   * @description Retrieves list of most recent orders
   * @param limit - Number of orders to retrieve (default: 10)
   * @returns Observable of recent orders
   */
  getRecentOrders(limit = 10): Observable<RecentOrder[]> {
    return this.api.get<RecentOrder[]>('recent-orders', { limit });
  }

  // =========================================================================
  // SALES ANALYTICS
  // =========================================================================

  /**
   * Get sales analytics
   * @description Retrieves comprehensive sales performance data
   * @param query - Date range and optional comparison period
   * @returns Observable of sales analytics
   *
   * @example
   * ```typescript
   * this.analyticsService.getSalesAnalytics({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   *   compareWith: 'previous_period'
   * });
   * ```
   */
  getSalesAnalytics(query: AnalyticsDateRangeQuery): Observable<SalesAnalytics> {
    return this.api.get<SalesAnalytics>('analytics/sales', query);
  }

  /**
   * Get sales by category
   * @description Retrieves sales breakdown by product category
   * @param query - Date range parameters
   * @returns Observable of category sales data
   */
  getSalesByCategory(query: { startDate: string; endDate: string }): Observable<{
    categories: {
      categoryId: number;
      categoryName: string;
      revenue: number;
      orders: number;
      itemsSold: number;
      percentageOfTotal: number;
    }[];
    totalRevenue: number;
    totalOrders: number;
  }> {
    return this.api.get('analytics/sales/by-category', query);
  }

  /**
   * Get sales by vendor
   * @description Retrieves sales breakdown by vendor
   * @param query - Date range and limit parameters
   * @returns Observable of vendor sales data
   */
  getSalesByVendor(query: {
    startDate: string;
    endDate: string;
    limit?: number;
  }): Observable<{
    vendors: {
      vendorId: number;
      vendorName: string;
      revenue: number;
      orders: number;
      commissions: number;
      percentageOfTotal: number;
    }[];
    totalRevenue: number;
    totalCommissions: number;
  }> {
    return this.api.get('analytics/sales/by-vendor', query);
  }

  /**
   * Get sales by region
   * @description Retrieves sales breakdown by geographic region
   * @param query - Date range parameters
   * @returns Observable of regional sales data
   */
  getSalesByRegion(query: { startDate: string; endDate: string }): Observable<{
    regions: {
      region: string;
      city: string;
      revenue: number;
      orders: number;
      percentageOfTotal: number;
    }[];
    totalRevenue: number;
  }> {
    return this.api.get('analytics/sales/by-region', query);
  }

  // =========================================================================
  // USER ANALYTICS
  // =========================================================================

  /**
   * Get user analytics
   * @description Retrieves user acquisition and engagement data
   * @param query - Date range parameters
   * @returns Observable of user analytics
   */
  getUserAnalytics(query: AnalyticsDateRangeQuery): Observable<UserAnalytics> {
    return this.api.get<UserAnalytics>('analytics/users', query);
  }

  /**
   * Get user retention data
   * @description Retrieves user retention metrics
   * @param query - Date range parameters
   * @returns Observable of retention data
   */
  getUserRetention(query: { startDate: string; endDate: string }): Observable<{
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
  }> {
    return this.api.get('analytics/users/retention', query);
  }

  /**
   * Get user engagement metrics
   * @description Retrieves user engagement data
   * @param query - Date range parameters
   * @returns Observable of engagement metrics
   */
  getUserEngagement(query: { startDate: string; endDate: string }): Observable<{
    dailyActiveUsers: { date: string; count: number }[];
    weeklyActiveUsers: { week: string; count: number }[];
    monthlyActiveUsers: { month: string; count: number }[];
    averageSessionDuration: number;
    pagesPerSession: number;
    bounceRate: number;
  }> {
    return this.api.get('analytics/users/engagement', query);
  }

  // =========================================================================
  // COMMISSION ANALYTICS
  // =========================================================================

  /**
   * Get commission report
   * @description Retrieves commission analytics
   * @param query - Date range parameters
   * @returns Observable of commission report
   */
  getCommissionReport(query: AnalyticsDateRangeQuery): Observable<CommissionReport> {
    return this.api.get<CommissionReport>('analytics/commissions', query);
  }

  /**
   * Get commission trends
   * @description Retrieves commission trend data over time
   * @param query - Date range and period type parameters
   * @returns Observable of commission trends
   */
  getCommissionTrends(query: {
    startDate: string;
    endDate: string;
    periodType?: PeriodType;
  }): Observable<{
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
  }> {
    return this.api.get('analytics/commissions/trends', query);
  }

  // =========================================================================
  // ORDER ANALYTICS
  // =========================================================================

  /**
   * Get order analytics
   * @description Retrieves order performance data
   * @param query - Date range parameters
   * @returns Observable of order analytics
   */
  getOrderAnalytics(query: { startDate: string; endDate: string }): Observable<{
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    refundedOrders: number;
    averageOrderValue: number;
    ordersByStatus: { status: string; count: number; percentage: number }[];
    ordersByPaymentMethod: { method: string; count: number; revenue: number }[];
    ordersByDay: { date: string; orders: number; revenue: number }[];
    averageFulfillmentTime: number;
    returnRate: number;
  }> {
    return this.api.get('analytics/orders', query);
  }

  /**
   * Get order funnel
   * @description Retrieves conversion funnel data
   * @param query - Date range parameters
   * @returns Observable of funnel data
   */
  getOrderFunnel(query: { startDate: string; endDate: string }): Observable<{
    stages: {
      stage: string;
      count: number;
      conversionRate: number;
      dropoffRate: number;
    }[];
    overallConversionRate: number;
  }> {
    return this.api.get('analytics/orders/funnel', query);
  }

  // =========================================================================
  // PRODUCT ANALYTICS
  // =========================================================================

  /**
   * Get product analytics
   * @description Retrieves product performance data
   * @param query - Date range parameters
   * @returns Observable of product analytics
   */
  getProductAnalytics(query: { startDate: string; endDate: string }): Observable<{
    totalProducts: number;
    activeProducts: number;
    topViewed: { productId: number; name: string; views: number; conversionRate: number }[];
    topConverting: { productId: number; name: string; conversionRate: number; views: number }[];
    lowPerforming: { productId: number; name: string; views: number; sales: number }[];
    inventoryStatus: {
      inStock: number;
      lowStock: number;
      outOfStock: number;
    };
  }> {
    return this.api.get('analytics/products', query);
  }

  // =========================================================================
  // EXPORT FUNCTIONALITY
  // =========================================================================

  /**
   * Export sales report
   * @description Generates downloadable sales report
   * @param format - Export format (csv, xlsx, pdf)
   * @param query - Date range parameters
   * @returns Observable of export response
   */
  exportSalesReport(
    format: ExportFormat,
    query: AnalyticsDateRangeQuery
  ): Observable<ExportResponse> {
    return this.api.post<ExportResponse>('analytics/export/sales', {
      format,
      ...query
    });
  }

  /**
   * Export commission report
   * @description Generates downloadable commission report
   * @param options - Export options including format, date range, and headers
   * @returns Observable of export response
   */
  exportCommissionReport(options: {
    format: ExportFormat;
    dateRange: { startDate: string; endDate: string };
    includeHeaders?: boolean;
  }): Observable<ExportResponse> {
    return this.api.post<ExportResponse>('analytics/export/commissions', options);
  }

  /**
   * Export user analytics
   * @description Generates downloadable user analytics report
   * @param options - Export options including format, date range, and headers
   * @returns Observable of export response
   */
  exportUserAnalytics(options: {
    format: ExportFormat;
    dateRange: { startDate: string; endDate: string };
    includeHeaders?: boolean;
  }): Observable<ExportResponse> {
    return this.api.post<ExportResponse>('analytics/export/users', options);
  }

  /**
   * Download export file
   * @description Downloads a previously generated export file
   * @param downloadUrl - URL provided in export response
   * @returns Observable of file blob
   */
  downloadExport(downloadUrl: string): Observable<Blob> {
    return this.api.downloadFile(downloadUrl);
  }

  // =========================================================================
  // REAL-TIME METRICS (POLLING)
  // =========================================================================

  /**
   * Get real-time metrics
   * @description Retrieves current real-time statistics
   * @returns Observable of real-time metrics
   *
   * @note This can be polled periodically for near real-time updates
   */
  getRealTimeMetrics(): Observable<{
    activeUsers: number;
    pendingOrders: number;
    todayRevenue: number;
    todayOrders: number;
    recentActivity: {
      type: 'order' | 'user' | 'vendor' | 'product';
      description: string;
      timestamp: Date;
    }[];
  }> {
    return this.api.get('metrics/realtime');
  }

  /**
   * Get today's summary
   * @description Retrieves today's performance summary
   * @returns Observable of today's summary
   */
  getTodaySummary(): Observable<{
    date: string;
    revenue: number;
    revenueVsYesterday: number;
    orders: number;
    ordersVsYesterday: number;
    newUsers: number;
    newUsersVsYesterday: number;
    pendingActions: PendingActions;
    hourlyRevenue: { hour: number; revenue: number; orders: number }[];
  }> {
    return this.api.get('metrics/today');
  }
}

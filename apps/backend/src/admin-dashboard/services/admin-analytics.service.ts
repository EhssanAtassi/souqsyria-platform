/**
 * @file admin-analytics.service.ts
 * @description Analytics service providing sales, user, and commission reports.
 *              Generates detailed analytics with comparisons and trends.
 * @module AdminDashboard/Services
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';

// Entities
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { Category } from '../../categories/entities/category.entity';
import { VendorCommissionEntity } from '../../commissions/entites/vendor-commission.entity';
import { CommissionPayoutEntity, PayoutStatus } from '../../commissions/entites/commission-payout.entity';

// DTOs
import {
  SalesAnalyticsQueryDto,
  UserAnalyticsQueryDto,
  CommissionReportQueryDto,
  SalesAnalyticsDto,
  SalesSummaryDto,
  UserAnalyticsDto,
  UserAnalyticsSummaryDto,
  CommissionReportDto,
  CommissionReportItemDto,
  DateRangeType,
  PeriodType,
} from '../dto';

/**
 * Admin Analytics Service
 * @description Provides detailed analytics and reporting functionality
 *              for sales, users, and commissions.
 */
@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(VendorCommissionEntity)
    private readonly vendorCommissionRepository: Repository<VendorCommissionEntity>,

    @InjectRepository(CommissionPayoutEntity)
    private readonly commissionPayoutRepository: Repository<CommissionPayoutEntity>,
  ) {}

  // ===========================================================================
  // SALES ANALYTICS
  // ===========================================================================

  /**
   * Get sales analytics
   * @description Generates comprehensive sales analytics with trends and breakdowns
   * @param query - Analytics query parameters
   * @returns Sales analytics including summary, charts, and breakdowns
   */
  async getSalesAnalytics(query: SalesAnalyticsQueryDto): Promise<SalesAnalyticsDto> {
    this.logger.log('Generating sales analytics');

    const { startDate, endDate, previousStart, previousEnd } = this.getDateRange(query);

    // Fetch summary metrics in parallel
    const [
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      currentUnitsSold,
      previousUnitsSold,
    ] = await Promise.all([
      this.calculateRevenue(startDate, endDate, query.vendorIds, query.categoryIds),
      this.calculateRevenue(previousStart, previousEnd, query.vendorIds, query.categoryIds),
      this.countOrdersInRange(startDate, endDate, query.vendorIds),
      this.countOrdersInRange(previousStart, previousEnd, query.vendorIds),
      this.countUnitsSold(startDate, endDate, query.vendorIds, query.categoryIds),
      this.countUnitsSold(previousStart, previousEnd, query.vendorIds, query.categoryIds),
    ]);

    const aov = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const previousAov = previousOrders > 0 ? previousRevenue / previousOrders : 0;

    const summary: SalesSummaryDto = {
      totalRevenue: currentRevenue,
      revenueChange: this.calculateChange(previousRevenue, currentRevenue),
      totalOrders: currentOrders,
      ordersChange: this.calculateChange(previousOrders, currentOrders),
      averageOrderValue: Math.round(aov),
      aovChange: this.calculateChange(previousAov, aov),
      totalUnitsSold: currentUnitsSold,
      unitsSoldChange: this.calculateChange(previousUnitsSold, currentUnitsSold),
      conversionRate: 0, // Would need visitor tracking
      conversionRateChange: 0,
    };

    // Generate chart data
    const chartData = await this.generateSalesChartData(
      startDate,
      endDate,
      query.periodType || PeriodType.DAILY,
      query.vendorIds,
      query.categoryIds,
    );

    // Get top products
    const topProducts = await this.getTopProductsBySales(startDate, endDate, 10, query.vendorIds, query.categoryIds);

    // Get sales by category
    const salesByCategory = await this.getSalesByCategory(startDate, endDate, query.vendorIds);

    // Get top vendors
    const topVendors = await this.getTopVendorsBySales(startDate, endDate, 10);

    return {
      summary,
      chartData,
      topProducts,
      salesByCategory,
      topVendors,
    };
  }

  // ===========================================================================
  // USER ANALYTICS
  // ===========================================================================

  /**
   * Get user analytics
   * @description Generates user registration, activity, and demographic analytics
   * @param query - Analytics query parameters
   * @returns User analytics including summary, charts, and demographics
   */
  async getUserAnalytics(query: UserAnalyticsQueryDto): Promise<UserAnalyticsDto> {
    this.logger.log('Generating user analytics');

    const { startDate, endDate, previousStart, previousEnd } = this.getDateRange(query);

    // Fetch user metrics
    const [
      totalUsers,
      newUsers,
      previousNewUsers,
      activeUsers,
      previousActiveUsers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.countUsersRegistered(startDate, endDate),
      this.countUsersRegistered(previousStart, previousEnd),
      this.countActiveUsers(startDate, endDate),
      this.countActiveUsers(previousStart, previousEnd),
    ]);

    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const previousRetention = totalUsers > 0 ? (previousActiveUsers / totalUsers) * 100 : 0;

    const summary: UserAnalyticsSummaryDto = {
      totalUsers,
      usersChange: this.calculateChange(totalUsers - newUsers, totalUsers),
      newUsers,
      newUsersChange: this.calculateChange(previousNewUsers, newUsers),
      activeUsers,
      activeUsersChange: this.calculateChange(previousActiveUsers, activeUsers),
      retentionRate: Math.round(retentionRate * 10) / 10,
      retentionRateChange: Math.round((retentionRate - previousRetention) * 10) / 10,
    };

    // Generate registration chart
    const registrationChart = await this.generateRegistrationChart(
      startDate,
      endDate,
      query.periodType || PeriodType.DAILY,
    );

    // Get users by role
    const usersByRole = await this.getUsersByRole();

    // Get demographics (placeholder - would need more user data)
    const demographics = await this.getUserDemographics();

    return {
      summary,
      registrationChart,
      usersByRole,
      demographics,
    };
  }

  // ===========================================================================
  // COMMISSION REPORTS
  // ===========================================================================

  /**
   * Get commission report
   * @description Generates commission report with vendor breakdown and trends
   * @param query - Report query parameters
   * @returns Commission report with summary and vendor breakdown
   */
  async getCommissionReport(query: CommissionReportQueryDto): Promise<CommissionReportDto> {
    this.logger.log('Generating commission report');

    const { startDate, endDate } = this.getDateRange(query);

    // Get commission summary from payouts using CommissionPayoutEntity fields
    const summaryData = await this.commissionPayoutRepository
      .createQueryBuilder('c')
      .select([
        'COALESCE(SUM(c.netAmount), 0) as totalCommissions',
        'COALESCE(SUM(CASE WHEN c.status = :completed THEN c.netAmount ELSE 0 END), 0) as paidCommissions',
        'COALESCE(SUM(CASE WHEN c.status = :pending THEN c.netAmount ELSE 0 END), 0) as pendingCommissions',
      ])
      .where('c.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .setParameter('completed', PayoutStatus.COMPLETED)
      .setParameter('pending', PayoutStatus.PENDING)
      .getRawOne();

    // Get total sales for the period
    const salesData = await this.orderRepository
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_amount), 0)', 'totalSales')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .getRawOne();

    const totalSales = parseFloat(salesData?.totalSales) || 0;
    const totalCommissions = parseFloat(summaryData?.totalCommissions) || 0;
    const paidCommissions = parseFloat(summaryData?.paidCommissions) || 0;
    const pendingCommissions = parseFloat(summaryData?.pendingCommissions) || 0;
    const averageRate = totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0;

    // Get commission by vendor
    const byVendor = await this.getCommissionsByVendor(startDate, endDate, query.vendorIds);

    // Get commission trend
    const trend = await this.generateCommissionTrend(startDate, endDate);

    return {
      summary: {
        totalSales,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        averageCommissionRate: Math.round(averageRate * 10) / 10,
      },
      byVendor,
      trend,
    };
  }

  // ===========================================================================
  // PUBLIC ANALYTICS ENDPOINTS FOR CONTROLLER
  // ===========================================================================

  /**
   * Get sales by category (public wrapper)
   * @description Returns sales breakdown by product category
   * @param query - Query parameters with date range
   * @returns Category sales data with orders count
   */
  async getSalesByCategoryPublic(query: SalesAnalyticsQueryDto): Promise<{
    categories: Array<{
      categoryId: number;
      categoryName: string;
      revenue: number;
      orders: number;
      percentage: number;
    }>;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const categories = await this.getSalesByCategory(startDate, endDate, query.vendorIds);
    return {
      categories: categories.map(c => ({
        categoryId: c.id,
        categoryName: c.name,
        revenue: c.revenue,
        orders: 0, // Would need additional query
        percentage: c.percentage,
      })),
    };
  }

  /**
   * Get sales by vendor
   * @description Returns sales breakdown by vendor
   * @param query - Query parameters with date range
   * @returns Vendor sales data
   */
  async getSalesByVendor(query: SalesAnalyticsQueryDto): Promise<{
    vendors: Array<{
      vendorId: number;
      vendorName: string;
      revenue: number;
      orders: number;
      commission: number;
      percentage: number;
    }>;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const vendors = await this.getTopVendorsBySales(startDate, endDate, 100);
    return {
      vendors: vendors.map(v => ({
        vendorId: v.id,
        vendorName: v.name,
        revenue: v.revenue,
        orders: v.orders,
        commission: v.revenue * 0.1, // Assume 10% commission
        percentage: v.percentage,
      })),
    };
  }

  /**
   * Get sales trends
   * @description Returns time-series sales data for charting
   * @param query - Query parameters with date range and granularity
   * @returns Time-series data points
   */
  async getSalesTrends(query: SalesAnalyticsQueryDto & { granularity?: string }): Promise<{
    dataPoints: Array<{
      date: string;
      revenue: number;
      orders: number;
      averageOrderValue: number;
    }>;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const periodType = this.mapGranularityToPeriodType(query.granularity);
    const chartData = await this.generateSalesChartData(startDate, endDate, periodType);
    return {
      dataPoints: chartData.map(d => ({
        date: d.label,
        revenue: d.revenue,
        orders: d.orders,
        averageOrderValue: d.orders > 0 ? d.revenue / d.orders : 0,
      })),
    };
  }

  /**
   * Get registration trends
   * @description Returns user registration trend data
   * @param query - Query parameters with date range
   * @returns Registration time-series data
   */
  async getRegistrationTrends(query: UserAnalyticsQueryDto): Promise<{
    dataPoints: Array<{ date: string; newUsers: number; activeUsers: number }>;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const chartData = await this.generateRegistrationChart(startDate, endDate, PeriodType.DAILY);
    return {
      dataPoints: chartData.map(d => ({
        date: d.label,
        newUsers: d.newUsers,
        activeUsers: d.activeUsers,
      })),
    };
  }

  /**
   * Get user engagement metrics
   * @description Returns user engagement analytics
   * @param query - Query parameters with date range
   * @returns User engagement data
   */
  async getUserEngagement(query: UserAnalyticsQueryDto): Promise<{
    averageSessionDuration: number;
    pageViewsPerSession: number;
    bounceRate: number;
    retentionRate: number;
  }> {
    // Stub implementation - would need session tracking
    return {
      averageSessionDuration: 0,
      pageViewsPerSession: 0,
      bounceRate: 0,
      retentionRate: 0,
    };
  }

  /**
   * Get commission trends
   * @description Returns commission trend data for charting
   * @param query - Query parameters with date range
   * @returns Commission time-series data
   */
  async getCommissionTrendsPublic(query: CommissionReportQueryDto): Promise<{
    dataPoints: Array<{ date: string; amount: number; count: number }>;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const trendData = await this.generateCommissionTrend(startDate, endDate);
    return {
      dataPoints: trendData.map(d => ({
        date: d.label,
        amount: d.commissions,
        count: Math.round(d.sales / 10000) || 0, // Approximate count from sales volume
      })),
    };
  }

  /**
   * Get product analytics
   * @description Returns product performance analytics
   * @param query - Query parameters with date range
   * @returns Product analytics data
   */
  async getProductAnalytics(query: SalesAnalyticsQueryDto): Promise<{
    topProducts: Array<{ productId: number; name: string; sales: number; revenue: number }>;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const topProducts = await this.getTopProductsBySales(startDate, endDate, 10);
    const totalProducts = await this.productRepository.count();
    const activeProducts = await this.productRepository.count({ where: { status: 'published' } });

    return {
      topProducts: topProducts.map(p => ({
        productId: p.id,
        name: p.name,
        sales: p.unitsSold,
        revenue: p.revenue,
      })),
      totalProducts,
      activeProducts,
      lowStockProducts: 0, // Would need stock check
    };
  }

  /**
   * Get vendor analytics
   * @description Returns vendor performance analytics
   * @param query - Query parameters with date range
   * @returns Vendor analytics data
   */
  async getVendorAnalytics(query: SalesAnalyticsQueryDto): Promise<{
    topVendors: Array<{ vendorId: number; name: string; orders: number; revenue: number }>;
    totalVendors: number;
    activeVendors: number;
    newVendors: number;
  }> {
    const { startDate, endDate } = this.getDateRange(query);
    const topVendors = await this.getTopVendorsBySales(startDate, endDate, 10);
    const totalVendors = await this.vendorRepository.count();
    const activeVendors = await this.vendorRepository.count({ where: { isVerified: true } });
    const newVendors = await this.vendorRepository
      .createQueryBuilder('v')
      .where('v.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getCount();

    return {
      topVendors: topVendors.map(v => ({
        vendorId: v.id,
        name: v.name,
        orders: v.orders,
        revenue: v.revenue,
      })),
      totalVendors,
      activeVendors,
      newVendors,
    };
  }

  // ===========================================================================
  // SALES ANALYTICS WIDGET ENDPOINTS (Frontend Sales Dashboard)
  // ===========================================================================

  /**
   * Get revenue chart data for sales dashboard
   * @description Returns time-series revenue data with orders and commission
   * @param query - Query parameters with date range and interval
   * @returns Array of daily/weekly revenue data points
   */
  async getRevenueChartData(query: SalesAnalyticsQueryDto & { interval?: string }): Promise<Array<{
    date: string;
    revenue: number;
    orders: number;
    commission: number;
  }>> {
    this.logger.log('Generating revenue chart data');
    const { startDate, endDate } = this.getDateRange(query);

    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'DATE(o.created_at) as date',
        'COALESCE(SUM(o.total_amount), 0) as revenue',
        'COUNT(*) as orders',
      ])
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('DATE(o.created_at)')
      .orderBy('DATE(o.created_at)', 'ASC')
      .getRawMany();

    return result.map(r => ({
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
      revenue: parseFloat(r.revenue) || 0,
      orders: parseInt(r.orders) || 0,
      commission: (parseFloat(r.revenue) || 0) * 0.10, // 10% commission rate
    }));
  }

  /**
   * Get top products data for sales dashboard
   * @description Returns top selling products with sales metrics and trends
   *              Optimized: Uses batch query for trends instead of N+1 pattern
   * @param query - Query parameters with date range and limit
   * @returns Array of top product data with bilingual names
   */
  async getTopProductsData(query: SalesAnalyticsQueryDto & { limit?: number }): Promise<Array<{
    id: number;
    name: string;
    nameAr: string;
    category: string;
    sales: number;
    revenue: number;
    image: string;
    trend: number;
  }>> {
    this.logger.log('Generating top products data');
    const { startDate, endDate, previousStart, previousEnd } = this.getDateRange(query);
    const limit = query.limit || 10;

    // Get current period top products
    const currentPeriodProducts = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select([
        'p.id as id',
        'p.nameEn as name',
        'p.nameAr as nameAr',
        'c.nameEn as category',
        'SUM(oi.quantity) as sales',
        'SUM(oi.totalPrice) as revenue',
        'p.mainImage as image',
      ])
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .leftJoin('p.category', 'c')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('p.id')
      .addGroupBy('p.nameEn')
      .addGroupBy('p.nameAr')
      .addGroupBy('c.nameEn')
      .addGroupBy('p.mainImage')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    // Early return if no products found
    if (currentPeriodProducts.length === 0) {
      return [];
    }

    // Batch query: Get previous period revenue for all top products at once
    const productIds = currentPeriodProducts.map(p => p.id);
    const previousPeriodData = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select([
        'oi.productId as productId',
        'SUM(oi.totalPrice) as prevRevenue',
      ])
      .innerJoin('oi.order', 'o')
      .where('o.created_at BETWEEN :start AND :end', { start: previousStart, end: previousEnd })
      .andWhere('oi.productId IN (:...productIds)', { productIds })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('oi.productId')
      .getRawMany();

    // Create lookup map for previous revenue
    const prevRevenueMap = new Map<number, number>(
      previousPeriodData.map(p => [p.productId, parseFloat(p.prevRevenue) || 0])
    );

    // Map results with trends calculated from batch data
    return currentPeriodProducts.map(r => {
      const currentRevenue = parseFloat(r.revenue) || 0;
      const prevRevenue = prevRevenueMap.get(r.id) || 0;
      const trend = prevRevenue > 0 ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100) : 0;

      return {
        id: r.id,
        name: r.name || 'Unknown Product',
        nameAr: r.nameAr || 'منتج غير معروف',
        category: r.category || 'General',
        sales: parseInt(r.sales) || 0,
        revenue: currentRevenue,
        image: r.image || '/assets/images/placeholder-product.jpg',
        trend,
      };
    });
  }

  /**
   * Get sales by category data for sales dashboard
   * @description Returns sales breakdown by category with percentages
   * @param query - Query parameters with date range
   * @returns Array of category sales data with colors
   */
  async getSalesCategoriesData(query: SalesAnalyticsQueryDto): Promise<Array<{
    name: string;
    nameAr: string;
    value: number;
    percentage: number;
    color: string;
  }>> {
    this.logger.log('Generating sales categories data');
    const { startDate, endDate } = this.getDateRange(query);

    // Syrian marketplace category colors (Golden Wheat theme)
    const categoryColors = [
      '#d4af37', // Primary gold
      '#708238', // Olive green
      '#c67c4e', // Terracotta
      '#2196f3', // Info blue
      '#4caf50', // Success green
      '#9c27b0', // Purple
      '#ff9800', // Warning orange
      '#00bcd4', // Cyan
    ];

    const result = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select([
        'c.id as id',
        'c.nameEn as name',
        'c.nameAr as nameAr',
        'SUM(oi.totalPrice) as value',
      ])
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .leftJoin('p.category', 'c')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('c.id')
      .addGroupBy('c.nameEn')
      .addGroupBy('c.nameAr')
      .orderBy('value', 'DESC')
      .limit(8)
      .getRawMany();

    const total = result.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);

    return result.map((r, index) => ({
      name: r.name || 'Other',
      nameAr: r.nameAr || 'أخرى',
      value: parseFloat(r.value) || 0,
      percentage: total > 0 ? Math.round((parseFloat(r.value) / total) * 1000) / 10 : 0,
      color: categoryColors[index % categoryColors.length],
    }));
  }

  /**
   * Get payment methods data for sales dashboard
   * @description Returns payment method breakdown with icons
   * @param query - Query parameters with date range
   * @returns Array of payment method statistics
   */
  async getPaymentMethodsData(query: SalesAnalyticsQueryDto): Promise<Array<{
    method: string;
    methodAr: string;
    count: number;
    amount: number;
    percentage: number;
    icon: string;
  }>> {
    this.logger.log('Generating payment methods data');
    const { startDate, endDate } = this.getDateRange(query);

    // Payment method mapping for icons and Arabic names
    const methodMapping: Record<string, { ar: string; icon: string }> = {
      'cash_on_delivery': { ar: 'الدفع عند الاستلام', icon: 'local_shipping' },
      'cod': { ar: 'الدفع عند الاستلام', icon: 'local_shipping' },
      'credit_card': { ar: 'بطاقة ائتمان', icon: 'credit_card' },
      'card': { ar: 'بطاقة ائتمان', icon: 'credit_card' },
      'bank_transfer': { ar: 'تحويل بنكي', icon: 'account_balance' },
      'paypal': { ar: 'باي بال', icon: 'payment' },
      'wallet': { ar: 'المحفظة', icon: 'account_balance_wallet' },
      'syriatel_cash': { ar: 'سيريتل كاش', icon: 'phone_android' },
      'mtn_cash': { ar: 'MTN كاش', icon: 'phone_android' },
    };

    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'COALESCE(o.payment_method, \'cash_on_delivery\') as method',
        'COUNT(*) as count',
        'SUM(o.total_amount) as amount',
      ])
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('o.payment_method')
      .orderBy('amount', 'DESC')
      .getRawMany();

    const total = result.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    return result.map(r => {
      const methodKey = (r.method || 'cash_on_delivery').toLowerCase().replace(/\s+/g, '_');
      const mapping = methodMapping[methodKey] || { ar: r.method, icon: 'payment' };

      return {
        method: r.method || 'Cash on Delivery',
        methodAr: mapping.ar,
        count: parseInt(r.count) || 0,
        amount: parseFloat(r.amount) || 0,
        percentage: total > 0 ? Math.round((parseFloat(r.amount) / total) * 1000) / 10 : 0,
        icon: mapping.icon,
      };
    });
  }

  /**
   * Get geography sales data for sales dashboard
   * @description Returns sales breakdown by Syrian regions/governorates
   * @param query - Query parameters with date range and limit
   * @returns Array of regional sales data
   */
  async getGeographySalesData(query: SalesAnalyticsQueryDto & { limit?: number }): Promise<Array<{
    region: string;
    regionAr: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>> {
    this.logger.log('Generating geography sales data');
    const { startDate, endDate } = this.getDateRange(query);
    const limit = query.limit || 10;

    // Syrian governorates mapping
    const regionMapping: Record<string, string> = {
      'damascus': 'دمشق',
      'aleppo': 'حلب',
      'homs': 'حمص',
      'hama': 'حماة',
      'latakia': 'اللاذقية',
      'tartus': 'طرطوس',
      'deir ez-zor': 'دير الزور',
      'raqqa': 'الرقة',
      'hasaka': 'الحسكة',
      'idlib': 'إدلب',
      'daraa': 'درعا',
      'sweida': 'السويداء',
      'quneitra': 'القنيطرة',
      'rural damascus': 'ريف دمشق',
    };

    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'COALESCE(o.shippingCity, \'Damascus\') as region',
        'COUNT(*) as orders',
        'SUM(o.total_amount) as revenue',
      ])
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('o.shippingCity')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    const total = result.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);

    return result.map(r => {
      const regionKey = (r.region || 'Damascus').toLowerCase();
      return {
        region: r.region || 'Damascus',
        regionAr: regionMapping[regionKey] || 'دمشق',
        orders: parseInt(r.orders) || 0,
        revenue: parseFloat(r.revenue) || 0,
        percentage: total > 0 ? Math.round((parseFloat(r.revenue) / total) * 1000) / 10 : 0,
      };
    });
  }

  /**
   * Get analytics summary
   * @description Returns a quick overview of key metrics
   * @returns Summary analytics
   */
  async getAnalyticsSummary(): Promise<{
    revenue: { today: number; week: number; month: number };
    orders: { today: number; week: number; month: number };
    users: { total: number; newToday: number; active: number };
  }> {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRevenue, weekRevenue, monthRevenue] = await Promise.all([
      this.calculateRevenue(todayStart, new Date()),
      this.calculateRevenue(weekStart, new Date()),
      this.calculateRevenue(monthStart, new Date()),
    ]);

    const [todayOrders, weekOrders, monthOrders] = await Promise.all([
      this.countOrdersInRange(todayStart, new Date()),
      this.countOrdersInRange(weekStart, new Date()),
      this.countOrdersInRange(monthStart, new Date()),
    ]);

    const totalUsers = await this.userRepository.count();
    const newUsersToday = await this.countUsersRegistered(todayStart, new Date());
    const activeUsers = await this.countActiveUsers(weekStart, new Date());

    return {
      revenue: { today: todayRevenue, week: weekRevenue, month: monthRevenue },
      orders: { today: todayOrders, week: weekOrders, month: monthOrders },
      users: { total: totalUsers, newToday: newUsersToday, active: activeUsers },
    };
  }

  /**
   * Map granularity string to PeriodType enum
   */
  private mapGranularityToPeriodType(granularity?: string): PeriodType {
    switch (granularity) {
      case 'hourly': return PeriodType.DAILY; // No hourly, fallback to daily
      case 'daily': return PeriodType.DAILY;
      case 'weekly': return PeriodType.WEEKLY;
      case 'monthly': return PeriodType.MONTHLY;
      default: return PeriodType.DAILY;
    }
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Get date range from query parameters
   * @description Calculates current and previous period date ranges for analytics comparison
   *              NOTE: Creates new Date instances to avoid mutating the original dates
   * @param query - Query with date range parameters
   * @returns Start and end dates for current and previous periods
   */
  private getDateRange(query: { dateRange?: DateRangeType; startDate?: string; endDate?: string }) {
    const now = new Date();
    const nowTimestamp = now.getTime();
    let startDate: Date;
    let endDate: Date;

    switch (query.dateRange) {
      case DateRangeType.TODAY: {
        // Create new date to avoid mutating 'now'
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        startDate = todayStart;
        endDate = new Date();
        break;
      }
      case DateRangeType.YESTERDAY: {
        // Create separate date instances for yesterday calculations
        const yesterdayStart = new Date(now);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        yesterdayStart.setHours(0, 0, 0, 0);

        const yesterdayEnd = new Date(now);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);

        startDate = yesterdayStart;
        endDate = yesterdayEnd;
        break;
      }
      case DateRangeType.LAST_7_DAYS:
        startDate = new Date(nowTimestamp - 7 * 24 * 60 * 60 * 1000);
        endDate = new Date();
        break;
      case DateRangeType.LAST_30_DAYS:
        startDate = new Date(nowTimestamp - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date();
        break;
      case DateRangeType.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date();
        break;
      case DateRangeType.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case DateRangeType.CUSTOM:
        startDate = query.startDate ? new Date(query.startDate) : new Date(nowTimestamp - 30 * 24 * 60 * 60 * 1000);
        endDate = query.endDate ? new Date(query.endDate) : new Date();
        break;
      default:
        startDate = new Date(nowTimestamp - 30 * 24 * 60 * 60 * 1000);
        endDate = new Date();
    }

    // Calculate previous period (same duration before start date)
    const duration = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return { startDate, endDate, previousStart, previousEnd };
  }

  /**
   * Calculate percentage change
   */
  private calculateChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  /**
   * Calculate revenue for a date range
   */
  /**
   * Calculate revenue for a date range
   * @description Note: Vendor/Category filtering requires joining through OrderItem → Product
   *              since Order entity doesn't have direct vendor relationship (multi-vendor orders)
   */
  private async calculateRevenue(
    startDate: Date,
    endDate: Date,
    vendorIds?: number[],
    categoryIds?: number[],
  ): Promise<number> {
    // For vendor/category filtering, we need to go through order items
    if (vendorIds?.length || categoryIds?.length) {
      let query = this.orderItemRepository
        .createQueryBuilder('oi')
        .select('COALESCE(SUM(oi.totalPrice), 0)', 'total')
        .innerJoin('oi.order', 'o')
        .innerJoin('oi.product', 'p')
        .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
        .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] });

      if (vendorIds?.length) {
        query = query.andWhere('p.vendorId IN (:...vendorIds)', { vendorIds });
      }
      if (categoryIds?.length) {
        query = query.andWhere('p.categoryId IN (:...categoryIds)', { categoryIds });
      }

      const result = await query.getRawOne();
      return parseFloat(result?.total) || 0;
    }

    // No filters - use direct order query for better performance
    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.total_amount), 0)', 'total')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  /**
   * Count orders in date range
   * @description Vendor filtering requires subquery through OrderItem → Product
   */
  private async countOrdersInRange(startDate: Date, endDate: Date, vendorIds?: number[]): Promise<number> {
    if (vendorIds?.length) {
      // Filter orders that contain items from specified vendors
      const result = await this.orderRepository
        .createQueryBuilder('o')
        .select('COUNT(DISTINCT o.id)', 'count')
        .innerJoin('o.items', 'oi')
        .innerJoin('oi.product', 'p')
        .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
        .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed'] })
        .andWhere('p.vendorId IN (:...vendorIds)', { vendorIds })
        .getRawOne();

      return parseInt(result?.count) || 0;
    }

    // No vendor filter - simple count
    return this.orderRepository
      .createQueryBuilder('o')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed'] })
      .getCount();
  }

  /**
   * Count units sold
   */
  private async countUnitsSold(
    startDate: Date,
    endDate: Date,
    vendorIds?: number[],
    categoryIds?: number[],
  ): Promise<number> {
    let query = this.orderItemRepository
      .createQueryBuilder('oi')
      .select('COALESCE(SUM(oi.quantity), 0)', 'total')
      .innerJoin('oi.order', 'o')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] });

    const result = await query.getRawOne();
    return parseInt(result?.total) || 0;
  }

  /**
   * Count users registered in range
   */
  private async countUsersRegistered(startDate: Date, endDate: Date): Promise<number> {
    return this.userRepository.count({
      where: { createdAt: Between(startDate, endDate) },
    });
  }

  /**
   * Count active users (users who placed orders)
   */
  private async countActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select('COUNT(DISTINCT o.userId)', 'count')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    return parseInt(result?.count) || 0;
  }

  /**
   * Generate sales chart data
   */
  private async generateSalesChartData(
    startDate: Date,
    endDate: Date,
    periodType: PeriodType,
    vendorIds?: number[],
    categoryIds?: number[],
  ) {
    // Simplified chart generation - group by date
    const result = await this.orderRepository
      .createQueryBuilder('o')
      .select([
        'DATE(o.created_at) as label',
        'COALESCE(SUM(o.total_amount), 0) as revenue',
        'COUNT(*) as orders',
      ])
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('DATE(o.created_at)')
      .orderBy('DATE(o.created_at)', 'ASC')
      .getRawMany();

    return result.map(r => ({
      label: r.label,
      revenue: parseFloat(r.revenue) || 0,
      orders: parseInt(r.orders) || 0,
      unitsSold: 0, // Would need join with order items
    }));
  }

  /**
   * Get top products by sales
   */
  private async getTopProductsBySales(
    startDate: Date,
    endDate: Date,
    limit: number,
    vendorIds?: number[],
    categoryIds?: number[],
  ) {
    const result = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select([
        'oi.productId as id',
        'p.nameEn as name',
        'SUM(oi.totalPrice) as revenue',
        'SUM(oi.quantity) as unitsSold',
      ])
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('oi.productId')
      .addGroupBy('p.nameEn')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    const totalRevenue = result.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    return result.map(r => ({
      id: r.id,
      name: r.name,
      revenue: parseFloat(r.revenue) || 0,
      unitsSold: parseInt(r.unitsSold) || 0,
      percentage: totalRevenue > 0 ? Math.round((parseFloat(r.revenue) / totalRevenue) * 1000) / 10 : 0,
    }));
  }

  /**
   * Get sales by category
   */
  private async getSalesByCategory(startDate: Date, endDate: Date, vendorIds?: number[]) {
    const result = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select([
        'c.id as id',
        'c.nameEn as name',
        'SUM(oi.totalPrice) as revenue',
      ])
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .innerJoin('p.category', 'c')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('c.id')
      .addGroupBy('c.nameEn')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    const totalRevenue = result.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    return result.map(r => ({
      id: r.id,
      name: r.name,
      revenue: parseFloat(r.revenue) || 0,
      percentage: totalRevenue > 0 ? Math.round((parseFloat(r.revenue) / totalRevenue) * 1000) / 10 : 0,
    }));
  }

  /**
   * Get top vendors by sales
   * @description Vendors are linked via OrderItem → Product → Vendor (multi-vendor orders)
   */
  private async getTopVendorsBySales(startDate: Date, endDate: Date, limit: number) {
    const result = await this.orderItemRepository
      .createQueryBuilder('oi')
      .select([
        'v.id as id',
        'v.storeName as name',
        'SUM(oi.totalPrice) as revenue',
        'COUNT(DISTINCT oi.orderId) as orders',
      ])
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .innerJoin('p.vendor', 'v')
      .where('o.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('o.status NOT IN (:...excluded)', { excluded: ['cancelled', 'failed', 'refunded'] })
      .groupBy('v.id')
      .addGroupBy('v.storeName')
      .orderBy('revenue', 'DESC')
      .limit(limit)
      .getRawMany();

    const totalRevenue = result.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    return result.map(r => ({
      id: r.id,
      name: r.name,
      revenue: parseFloat(r.revenue) || 0,
      orders: parseInt(r.orders) || 0,
      percentage: totalRevenue > 0 ? Math.round((parseFloat(r.revenue) / totalRevenue) * 1000) / 10 : 0,
    }));
  }

  /**
   * Generate user registration chart data
   */
  private async generateRegistrationChart(startDate: Date, endDate: Date, periodType: PeriodType) {
    const result = await this.userRepository
      .createQueryBuilder('u')
      .select([
        'DATE(u.createdAt) as label',
        'COUNT(*) as newUsers',
      ])
      .where('u.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('DATE(u.createdAt)')
      .orderBy('DATE(u.createdAt)', 'ASC')
      .getRawMany();

    return result.map(r => ({
      label: r.label,
      newUsers: parseInt(r.newUsers) || 0,
      activeUsers: 0, // Would need activity tracking
    }));
  }

  /**
   * Get users grouped by role
   */
  private async getUsersByRole() {
    const result = await this.userRepository
      .createQueryBuilder('u')
      .select([
        'r.name as role',
        'COUNT(*) as count',
      ])
      .leftJoin('u.roles', 'r')
      .groupBy('r.name')
      .getRawMany();

    const total = result.reduce((sum, r) => sum + parseInt(r.count), 0);

    return result.map(r => ({
      role: r.role || 'No Role',
      count: parseInt(r.count) || 0,
      percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 1000) / 10 : 0,
    }));
  }

  /**
   * Get user demographics (placeholder)
   */
  private async getUserDemographics() {
    // This would require additional user profile data
    return [
      { metric: 'region', value: 'Damascus', count: 0, percentage: 0 },
      { metric: 'region', value: 'Aleppo', count: 0, percentage: 0 },
    ];
  }

  /**
   * Get commissions by vendor
   * @description Uses CommissionPayoutEntity which tracks actual commission payments
   */
  private async getCommissionsByVendor(
    startDate: Date,
    endDate: Date,
    vendorIds?: number[],
  ): Promise<CommissionReportItemDto[]> {
    let query = this.commissionPayoutRepository
      .createQueryBuilder('c')
      .select([
        'v.id as vendorId',
        'v.storeName as vendorName',
        'SUM(c.grossAmount) as totalSales',
        'CASE WHEN SUM(c.grossAmount) > 0 THEN (SUM(c.netAmount) / SUM(c.grossAmount)) * 100 ELSE 0 END as commissionRate',
        'SUM(c.netAmount) as commissionAmount',
        'SUM(c.orderCount) as orderCount',
        'SUM(CASE WHEN c.status = :completed THEN c.netAmount ELSE 0 END) as paidAmount',
        'SUM(CASE WHEN c.status = :pending THEN c.netAmount ELSE 0 END) as pendingAmount',
      ])
      .innerJoin('c.vendor', 'v')
      .where('c.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .setParameter('completed', PayoutStatus.COMPLETED)
      .setParameter('pending', PayoutStatus.PENDING)
      .groupBy('v.id')
      .addGroupBy('v.storeName')
      .orderBy('commissionAmount', 'DESC');

    if (vendorIds?.length) {
      query = query.andWhere('v.id IN (:...vendorIds)', { vendorIds });
    }

    const result = await query.getRawMany();

    return result.map(r => ({
      vendorId: r.vendorId,
      vendorName: r.vendorName,
      totalSales: parseFloat(r.totalSales) || 0,
      commissionRate: Math.round(parseFloat(r.commissionRate) * 10) / 10 || 0,
      commissionAmount: parseFloat(r.commissionAmount) || 0,
      orderCount: parseInt(r.orderCount) || 0,
      paidAmount: parseFloat(r.paidAmount) || 0,
      pendingAmount: parseFloat(r.pendingAmount) || 0,
    }));
  }

  /**
   * Generate commission trend data
   * @description Uses CommissionPayoutEntity for payout trend tracking
   */
  private async generateCommissionTrend(startDate: Date, endDate: Date) {
    const result = await this.commissionPayoutRepository
      .createQueryBuilder('c')
      .select([
        'DATE(c.createdAt) as label',
        'SUM(c.netAmount) as commissions',
        'SUM(c.grossAmount) as sales',
      ])
      .where('c.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('DATE(c.createdAt)')
      .orderBy('DATE(c.createdAt)', 'ASC')
      .getRawMany();

    return result.map(r => ({
      label: r.label,
      commissions: parseFloat(r.commissions) || 0,
      sales: parseFloat(r.sales) || 0,
    }));
  }
}

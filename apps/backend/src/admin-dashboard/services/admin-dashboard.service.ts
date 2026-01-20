/**
 * @file admin-dashboard.service.ts
 * @description Core admin dashboard service providing metrics, charts, and overview data.
 *              Aggregates data from multiple entities for dashboard widgets.
 * @module AdminDashboard/Services
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';

// Entities
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { RefundStatus } from '../../refund/enums/refund-status.enum';
import { CommissionPayoutEntity, PayoutStatus } from '../../commissions/entites/commission-payout.entity';
import { KycDocument } from '../../kyc/entites/kyc-document.entity';

// DTOs
import {
  DashboardMetricsDto,
  PendingActionsDto,
  RevenueChartDataDto,
  RevenueChartQueryDto,
  TopSellingProductDto,
  TopProductsQueryDto,
  RecentOrderDto,
  RecentOrdersQueryDto,
  PeriodType,
} from '../dto';

/**
 * Admin Dashboard Service
 * @description Provides core dashboard functionality including metrics calculation,
 *              revenue chart data, top products, and recent orders.
 */
@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

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

    @InjectRepository(RefundTransaction)
    private readonly refundRepository: Repository<RefundTransaction>,

    @InjectRepository(CommissionPayoutEntity)
    private readonly commissionPayoutRepository: Repository<CommissionPayoutEntity>,

    @InjectRepository(KycDocument)
    private readonly kycDocumentRepository: Repository<KycDocument>,
  ) {}

  // ===========================================================================
  // DASHBOARD METRICS
  // ===========================================================================

  /**
   * Get dashboard metrics
   * @description Retrieves all key metrics for the dashboard overview
   * @returns Dashboard metrics including counts, growth rates, and pending actions
   */
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    this.logger.log('Fetching dashboard metrics');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all metrics in parallel for performance
    const [
      totalRevenue,
      previousRevenue,
      totalOrders,
      previousOrders,
      totalUsers,
      previousUsers,
      totalProducts,
      previousProducts,
      totalVendors,
      previousVendors,
      totalCommissions,
      previousCommissions,
      pendingActions,
    ] = await Promise.all([
      this.calculateTotalRevenue(thirtyDaysAgo, now),
      this.calculateTotalRevenue(sixtyDaysAgo, thirtyDaysAgo),
      this.countOrders(thirtyDaysAgo, now),
      this.countOrders(sixtyDaysAgo, thirtyDaysAgo),
      this.countUsers(thirtyDaysAgo, now),
      this.countUsers(sixtyDaysAgo, thirtyDaysAgo),
      this.countProducts(thirtyDaysAgo, now),
      this.countProducts(sixtyDaysAgo, thirtyDaysAgo),
      this.countVendors(thirtyDaysAgo, now),
      this.countVendors(sixtyDaysAgo, thirtyDaysAgo),
      this.calculateTotalCommissions(thirtyDaysAgo, now),
      this.calculateTotalCommissions(sixtyDaysAgo, thirtyDaysAgo),
      this.getPendingActions(),
    ]);

    return {
      totalRevenue: totalRevenue,
      revenueGrowth: this.calculateGrowthRate(previousRevenue, totalRevenue),
      totalOrders: totalOrders,
      ordersGrowth: this.calculateGrowthRate(previousOrders, totalOrders),
      totalUsers: totalUsers,
      usersGrowth: this.calculateGrowthRate(previousUsers, totalUsers),
      totalProducts: totalProducts,
      productsGrowth: this.calculateGrowthRate(previousProducts, totalProducts),
      totalVendors: totalVendors,
      vendorsGrowth: this.calculateGrowthRate(previousVendors, totalVendors),
      totalCommissions: totalCommissions,
      commissionsGrowth: this.calculateGrowthRate(previousCommissions, totalCommissions),
      pendingActions: pendingActions,
    };
  }

  /**
   * Get pending actions counts
   * @description Counts all items requiring admin attention
   * @returns Pending actions object with counts for each category
   */
  async getPendingActions(): Promise<PendingActionsDto> {
    const [
      pendingOrders,
      pendingProducts,
      pendingVendors,
      pendingRefunds,
      pendingKyc,
      pendingWithdrawals,
    ] = await Promise.all([
      this.orderRepository.count({ where: { status: 'pending' } }),
      this.productRepository.count({ where: { approvalStatus: 'pending' } }),
      // VendorEntity uses isVerified boolean, not verificationStatus string
      this.vendorRepository.count({ where: { isVerified: false } }),
      // RefundTransaction uses RefundStatus enum
      this.refundRepository.count({ where: { status: RefundStatus.PENDING } }),
      // KycDocument uses status string enum
      this.kycDocumentRepository.count({ where: { status: 'pending' } }),
      // Assuming withdrawal requests are tracked in commission payouts with PENDING status
      this.commissionPayoutRepository.count({ where: { status: PayoutStatus.PENDING } }),
    ]);

    return {
      pendingOrders,
      pendingProducts,
      pendingVendors,
      pendingRefunds,
      pendingKyc,
      pendingWithdrawals,
    };
  }

  // ===========================================================================
  // REVENUE CHART
  // ===========================================================================

  /**
   * Get revenue chart data
   * @description Generates chart data for revenue, commissions, and net revenue
   * @param query - Chart query parameters (period type)
   * @returns Revenue chart data with labels and series
   */
  async getRevenueChartData(query: RevenueChartQueryDto): Promise<RevenueChartDataDto> {
    this.logger.log(`Fetching revenue chart data for period: ${query.periodType}`);

    const { labels, dateRanges } = this.generateDateRanges(query.periodType || PeriodType.MONTHLY);

    const revenues: number[] = [];
    const commissions: number[] = [];
    const netRevenue: number[] = [];

    // Calculate metrics for each period
    for (const { start, end } of dateRanges) {
      const [periodRevenue, periodCommission] = await Promise.all([
        this.calculateTotalRevenue(start, end),
        this.calculateTotalCommissions(start, end),
      ]);

      revenues.push(periodRevenue);
      commissions.push(periodCommission);
      netRevenue.push(periodRevenue - periodCommission);
    }

    return {
      labels,
      revenues,
      commissions,
      netRevenue,
      periodType: query.periodType || PeriodType.MONTHLY,
    };
  }

  // ===========================================================================
  // TOP PRODUCTS
  // ===========================================================================

  /**
   * Get top selling products
   * @description Retrieves products with highest sales volume
   * @param query - Query parameters (limit)
   * @returns Array of top selling products with sales metrics
   */
  async getTopSellingProducts(query: TopProductsQueryDto): Promise<TopSellingProductDto[]> {
    const limit = query.limit || 5;
    this.logger.log(`Fetching top ${limit} selling products`);

    // Query order items aggregated by product
    const topProducts = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('orderItem.productId', 'productId')
      .addSelect('SUM(orderItem.quantity)', 'totalSold')
      .addSelect('SUM(orderItem.totalPrice)', 'totalRevenue')
      .innerJoin('orderItem.order', 'order')
      .where('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed', 'refunded'],
      })
      .groupBy('orderItem.productId')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();

    // Fetch product details
    const productIds = topProducts.map(p => p.productId);

    if (productIds.length === 0) {
      return [];
    }

    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['category', 'vendor', 'images'],
    });

    // Map results
    return topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      // Get first image from images relation as thumbnail (sortOrder 0 = main image)
      const firstImage = product?.images?.find(img => img.sortOrder === 0) || product?.images?.[0];
      return {
        id: tp.productId,
        nameEn: product?.nameEn || 'Unknown',
        nameAr: product?.nameAr || 'غير معروف',
        thumbnail: firstImage?.imageUrl || null,
        categoryName: product?.category?.nameEn || 'Uncategorized',
        vendorName: product?.vendor?.storeName || 'Unknown Vendor',
        totalSold: parseInt(tp.totalSold) || 0,
        totalRevenue: parseFloat(tp.totalRevenue) || 0,
      };
    });
  }

  // ===========================================================================
  // RECENT ORDERS
  // ===========================================================================

  /**
   * Get recent orders
   * @description Retrieves most recent orders for dashboard display
   * @param query - Query parameters (limit)
   * @returns Array of recent orders with customer info
   */
  async getRecentOrders(query: RecentOrdersQueryDto): Promise<RecentOrderDto[]> {
    const limit = query.limit || 10;
    this.logger.log(`Fetching ${limit} recent orders`);

    const orders = await this.orderRepository.find({
      take: limit,
      order: { created_at: 'DESC' },
      relations: ['user', 'items'],
    });

    return orders.map(order => ({
      id: order.id,
      orderNumber: `ORD-${order.id}`,
      // User entity uses fullName, not firstName/lastName
      customerName: order.user?.fullName || 'Guest',
      customerEmail: order.user?.email || 'N/A',
      // Order entity uses total_amount (snake_case)
      totalAmount: Number(order.total_amount) || 0,
      status: order.status,
      // Order entity uses items, not orderItems
      itemsCount: order.items?.length || 0,
      createdAt: order.created_at,
    }));
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Calculate total revenue for a date range
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Total revenue in SYP
   */
  private async calculateTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'total')
      .where('order.created_at BETWEEN :start AND :end', { start: startDate, end: endDate })
      .andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed', 'refunded'],
      })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  /**
   * Calculate total commissions for a date range
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Total commissions in SYP
   */
  private async calculateTotalCommissions(startDate: Date, endDate: Date): Promise<number> {
    // Using CommissionPayoutEntity which has netAmount for actual commission earnings
    const result = await this.commissionPayoutRepository
      .createQueryBuilder('payout')
      .select('COALESCE(SUM(payout.netAmount), 0)', 'total')
      .where('payout.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  /**
   * Count orders in date range
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Order count
   */
  private async countOrders(startDate: Date, endDate: Date): Promise<number> {
    // Order entity uses created_at as property name
    return this.orderRepository.count({
      where: {
        created_at: Between(startDate, endDate),
      },
    });
  }

  /**
   * Count users registered in date range (or total if no dates)
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns User count
   */
  private async countUsers(startDate: Date, endDate: Date): Promise<number> {
    return this.userRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
  }

  /**
   * Count products created in date range (or total active)
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Product count
   */
  private async countProducts(startDate: Date, endDate: Date): Promise<number> {
    // ProductEntity uses createdAt (camelCase) and approvalStatus
    return this.productRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
        approvalStatus: 'approved',
      },
    });
  }

  /**
   * Count vendors registered in date range
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Vendor count
   */
  private async countVendors(startDate: Date, endDate: Date): Promise<number> {
    // VendorEntity uses createdAt (camelCase) and isVerified (boolean)
    return this.vendorRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
        isVerified: true,
      },
    });
  }

  /**
   * Calculate growth rate percentage
   * @param previous - Previous period value
   * @param current - Current period value
   * @returns Growth rate as percentage (rounded to 1 decimal)
   */
  private calculateGrowthRate(previous: number, current: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    const rate = ((current - previous) / previous) * 100;
    return Math.round(rate * 10) / 10;
  }

  /**
   * Generate date ranges for chart periods
   * @param periodType - Period aggregation type
   * @returns Object with labels and date ranges
   */
  private generateDateRanges(periodType: PeriodType): {
    labels: string[];
    dateRanges: { start: Date; end: Date }[];
  } {
    const now = new Date();
    const labels: string[] = [];
    const dateRanges: { start: Date; end: Date }[] = [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    switch (periodType) {
      case PeriodType.DAILY:
        // Last 14 days
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          labels.push(`${date.getDate()} ${monthNames[date.getMonth()]}`);

          const start = new Date(date.setHours(0, 0, 0, 0));
          const end = new Date(date.setHours(23, 59, 59, 999));
          dateRanges.push({ start, end });
        }
        break;

      case PeriodType.WEEKLY:
        // Last 8 weeks
        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
          weekStart.setHours(0, 0, 0, 0);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          labels.push(`Week ${8 - i}`);
          dateRanges.push({ start: weekStart, end: weekEnd });
        }
        break;

      case PeriodType.MONTHLY:
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(monthNames[date.getMonth()]);

          const start = new Date(date.getFullYear(), date.getMonth(), 1);
          const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
          dateRanges.push({ start, end });
        }
        break;

      case PeriodType.YEARLY:
        // Last 5 years
        for (let i = 4; i >= 0; i--) {
          const year = now.getFullYear() - i;
          labels.push(year.toString());

          const start = new Date(year, 0, 1);
          const end = new Date(year, 11, 31, 23, 59, 59, 999);
          dateRanges.push({ start, end });
        }
        break;
    }

    return { labels, dateRanges };
  }
}

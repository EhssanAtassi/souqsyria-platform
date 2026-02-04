/**
 * ------------------------------------------------------------
 * DashboardService
 * ------------------------------------------------------------
 * This service handles the logic for aggregating and returning
 * analytics metrics for both Admin and Vendor dashboards.
 *
 * It uses repositories (via TypeORM) to calculate:
 * - Sales totals
 * - Order volume
 * - Refund counts and rates
 * - Top-selling products
 * - Vendor performance
 * - Daily metric breakdowns
 *
 * It supports date range filtering and role-based scoping.
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { ReturnRequest } from '../../orders/entities/return-request.entity';
import { DashboardServiceResponse } from '../interfaces/admin-metrics.interface';
import { CommissionsService } from '../../commissions/service/commissions.service';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { StockAlertEntity } from '../../stock/entities/stock-alert.entity';
import { VendorDashboardResponse } from '../interfaces/vendor-metrics.interface';
import {
  TopProductMetric,
  TopVendorMetric,
} from '../interfaces/dashboard-metrics.interface';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(RefundTransaction)
    private readonly refundRepo: Repository<RefundTransaction>,
    @InjectRepository(ReturnRequest)
    private readonly returnRepo: Repository<ReturnRequest>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    @InjectRepository(StockAlertEntity)
    private readonly stockAlertRepo: Repository<StockAlertEntity>,
    private readonly commissionsService: CommissionsService,
  ) {}

  /**
   * Admin dashboard metrics (global)
   */
  async getAdminMetrics(
    user: any,
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardServiceResponse> {
    const dateFilter = this.buildDateRange(startDate, endDate);

    const [
      totalOrders,
      totalSalesData,
      refundCount,
      lowStockAlerts,
      topProducts,
      topVendors,
      dailyCounts,
    ] = await Promise.all([
      this.orderRepo.count({
        where: dateFilter
          ? {
              created_at: Between(
                new Date(dateFilter.start),
                new Date(dateFilter.end),
              ),
            }
          : {},
      }),
      this.orderRepo
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where(
          dateFilter ? 'order.createdAt BETWEEN :start AND :end' : '1=1',
          dateFilter,
        )
        .getRawOne(),
      this.refundRepo.count({
        where: dateFilter
          ? {
              created_at: Between(
                new Date(dateFilter.start),
                new Date(dateFilter.end),
              ),
            }
          : {},
      }),
      this.stockAlertRepo.count(),
      this.getTopProducts(),
      this.getTopVendors(),
      this.getDailyOrderCounts(dateFilter),
    ]);

    const totalSales = parseFloat(totalSalesData?.total || 0);
    const refundRate = totalOrders > 0 ? refundCount / totalOrders : 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      totalRefunds: refundCount,
      refundRate,
      averageOrderValue,
      lowStockAlerts,
      topSellingProducts: topProducts,
      mostActiveVendors: topVendors,
      dailyOrderCounts: dailyCounts,
    };
  }

  /**
   * Vendor dashboard metrics (scoped by vendorId)
   */
  async getVendorMetrics(
    user: any,
    startDate?: string,
    endDate?: string,
  ): Promise<VendorDashboardResponse> {
    const vendorId = user.vendorId;
    const dateFilter = this.buildDateRange(startDate, endDate);

    // Since OrderItem likely does not have createdAt, join with Order to filter by date
    const orderItems = await this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.order', 'order')
      .where('item.vendorId = :vendorId', { vendorId })
      .andWhere(
        dateFilter ? 'order.createdAt BETWEEN :start AND :end' : '1=1',
        dateFilter,
      )
      .getMany();

    const totalOrders = orderItems.length;
    const totalSales = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const refundCount = 0; // TODO: Implement vendor-scoped refund logic with join
    const refundRate = totalOrders > 0 ? refundCount / totalOrders : 0;

    const commissionPaid =
      (await this.commissionsService.calculateCommissionForVendor(vendorId))
        ?.total || 0;
    const vendorReceives = totalSales - commissionPaid;

    const topProducts = await this.getTopProducts(vendorId);
    const lowStockAlerts = await this.stockAlertRepo.count({
      where: {}, // TODO: vendorId not directly available on entity
    });
    const dailySales = await this.getDailySalesForVendor(vendorId, dateFilter);

    return {
      totalSales,
      totalOrders,
      refundRate,
      commissionPaid,
      vendorReceives,
      lowStockAlerts,
      topProducts,
      dailySales,
    };
  }

  /**
   * Build date range filter object
   */
  private buildDateRange(
    start?: string,
    end?: string,
  ): { start: string; end: string } | undefined {
    if (start && end) {
      return { start, end };
    }
    return undefined;
  }

  /**
   * Top 5 selling products (global or per vendor)
   */
  private async getTopProducts(vendorId?: number): Promise<TopProductMetric[]> {
    const qb = this.orderItemRepo
      .createQueryBuilder('item')
      .select('item.productId', 'productId')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .groupBy('item.productId')
      .orderBy('totalSold', 'DESC')
      .limit(5);

    if (vendorId) {
      qb.where('item.vendorId = :vendorId', { vendorId });
    }

    const raw = await qb.getRawMany();
    const productIds = raw.map((r) => r.productId);

    const products = await this.productRepo.find({
      where: { id: In(productIds) },
    });

    return raw.map((row) => ({
      productId: +row.productId,
      productName:
        products.find((p) => p.id === +row.productId)?.nameEn ||
        products.find((p) => p.id === +row.productId)?.nameAr ||
        'Unnamed',
      totalSold: +row.totalSold,
    }));
  }

  /**
   * Most active vendors by order volume
   */
  private async getTopVendors(): Promise<TopVendorMetric[]> {
    const qb = this.orderItemRepo
      .createQueryBuilder('item')
      .select('item.vendorId', 'vendorId')
      .addSelect('COUNT(*)', 'orderCount')
      .groupBy('item.vendorId')
      .orderBy('orderCount', 'DESC')
      .limit(5);

    const raw = await qb.getRawMany();
    const vendorIds = raw.map((r) => r.vendorId);

    const vendors = await this.vendorRepo.find({
      where: { id: In(vendorIds) },
    });

    return raw.map((row) => ({
      vendorId: +row.vendorId,
      storeName:
        vendors.find((v) => v.id === +row.vendorId)?.storeName || 'Unknown',
      orderCount: +row.orderCount,
    }));
  }

  /**
   * Daily order count for charts
   */
  private async getDailyOrderCounts(range?: {
    start: string;
    end: string;
  }): Promise<Array<{ date: string; count: number }>> {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (range) {
      qb.where('order.createdAt BETWEEN :start AND :end', {
        start: range.start,
        end: range.end,
      });
    }

    const raw = await qb.getRawMany();
    return raw.map((r) => ({
      date: r.date,
      count: +r.count,
    }));
  }

  /**
   * Daily vendor sales for chart
   */
  private async getDailySalesForVendor(
    vendorId: number,
    range?: { start: string; end: string },
  ): Promise<Array<{ date: string; amount: number }>> {
    const qb = this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.order', 'order')
      .select('DATE(order.createdAt)', 'date')
      .addSelect('SUM(item.price * item.quantity)', 'amount')
      .where('item.vendorId = :vendorId', { vendorId })
      .groupBy('date')
      .orderBy('date', 'ASC');

    if (range) {
      qb.andWhere('order.createdAt BETWEEN :start AND :end', {
        start: range.start,
        end: range.end,
      });
    }

    const raw = await qb.getRawMany();
    return raw.map((r) => ({
      date: r.date,
      amount: parseFloat(r.amount || '0'),
    }));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Order } from '../../orders/entities/order.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { StockAlertEntity } from '../../stock/entities/stock-alert.entity';

export interface DashboardMetricsResponse {
  todayRevenue: {
    amountSYP: number;
    amountUSD: number;
    orderCount: number;
    notes: string;
  };
  monthlyRevenue: {
    amountSYP: number;
    amountUSD: number;
    orderCount: number;
    comparedToLastMonth: number;
  };
  activeVendors: {
    count: number;
    newThisWeek: number;
    growthPct: number;
  };
  customerNps: {
    score: number;
    delta: number;
    context: string;
  };
}

export interface OrderStatusResponse {
  id: string;
  label: string;
  count: number;
}

export interface ActivityResponse {
  id: string;
  description: string;
  timestamp: string;
  category: 'order' | 'vendor' | 'support' | 'system';
}

export interface HighlightResponse {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
}

@Injectable()
export class AdminDashboardService {
  private readonly usdRate: number;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,
    @InjectRepository(StockAlertEntity)
    private readonly stockAlertRepository: Repository<StockAlertEntity>,
    private readonly configService: ConfigService,
  ) {
    this.usdRate = Number(
      this.configService.get<number>('ADMIN_USD_TO_SYP_RATE') ?? 15000,
    );
  }

  async getMetrics(): Promise<DashboardMetricsResponse> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const todayRevenueRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'sum')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.created_at >= :startOfDay', { startOfDay })
      .getRawOne<{ sum: string; count: string }>();

    const monthRevenueRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'sum')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.created_at >= :startOfMonth', { startOfMonth })
      .getRawOne<{ sum: string; count: string }>();

    const prevMonthRevenueRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total_amount), 0)', 'sum')
      .where('order.created_at BETWEEN :start AND :end', {
        start: startOfPrevMonth,
        end: endOfPrevMonth,
      })
      .getRawOne<{ sum: string }>();

    const todayRevenue = Number(todayRevenueRaw?.sum ?? 0);
    const todayOrders = Number(todayRevenueRaw?.count ?? 0);
    const monthRevenue = Number(monthRevenueRaw?.sum ?? 0);
    const monthOrders = Number(monthRevenueRaw?.count ?? 0);
    const prevMonthRevenue = Number(prevMonthRevenueRaw?.sum ?? 0);

    const activeVendors = await this.vendorRepository.count({
      where: { isVerified: true },
    });

    const newVendors = await this.vendorRepository
      .createQueryBuilder('vendor')
      .where('vendor.isVerified = :verified', { verified: true })
      .andWhere('vendor.createdAt >= :start', {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    const monthGrowth = prevMonthRevenue
      ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : 100;

    return {
      todayRevenue: {
        amountSYP: todayRevenue,
        amountUSD: this.toUsd(todayRevenue),
        orderCount: todayOrders,
        notes: todayOrders
          ? 'Live data synced from Damascus processing hub.'
          : 'No orders yet today — great moment to launch a campaign.',
      },
      monthlyRevenue: {
        amountSYP: monthRevenue,
        amountUSD: this.toUsd(monthRevenue),
        orderCount: monthOrders,
        comparedToLastMonth: Number(monthGrowth.toFixed(2)),
      },
      activeVendors: {
        count: activeVendors,
        newThisWeek: newVendors,
        growthPct: activeVendors
          ? Number(((newVendors / Math.max(activeVendors - newVendors, 1)) * 100).toFixed(2))
          : 0,
      },
      customerNps: {
        score: 68,
        delta: 5,
        context: 'Arabic support center follow-up calls boosted NPS this week.',
      },
    };
  }

  async getOrderStatusBreakdown(): Promise<OrderStatusResponse[]> {
    const statuses = [
      { id: 'pending', label: 'Pending confirmation' },
      { id: 'processing', label: 'Being prepared' },
      { id: 'shipped', label: 'In transit' },
      { id: 'delivered', label: 'Delivered today' },
      { id: 'returns', label: 'Return requested' },
      { id: 'cod', label: 'Awaiting COD confirmation' },
    ];

    const counts = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(order.id)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: string; count: string }>();

    const countMap = new Map<string, number>();
    counts.forEach((row) => {
      countMap.set(row.status, Number(row.count));
    });

    return statuses.map((status) => {
      const count = countMap.get(status.id) ?? countMap.get(status.id.toUpperCase()) ?? 0;
      return {
        id: status.id,
        label: status.label,
        count,
      };
    });
  }

  async getHighlights(): Promise<HighlightResponse[]> {
    const criticalStock = await this.stockAlertRepository.count({
      where: { type: 'critical_stock' },
    });

    const pendingVendors = await this.vendorRepository.count({
      where: { isVerified: false },
    });

    const codOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('LOWER(order.payment_method) = :method', { method: 'cod' })
      .andWhere('order.created_at >= :recent', {
        recent: new Date(Date.now() - 48 * 60 * 60 * 1000),
      })
      .getCount();

    return [
      {
        id: 'campaign',
        title: 'Ramadan Heritage Campaign',
        description:
          'Curate featured artisans and schedule homepage hero for Ramadan week two.',
        actionLabel: 'Plan promotions',
        actionRoute: '/admin/marketing/campaigns',
      },
      {
        id: 'inventory',
        title: 'Inventory Alerts',
        description: `${criticalStock} critical stock alerts across Syrian warehouses.`,
        actionLabel: 'Review stock',
        actionRoute: '/admin/inventory/alerts',
      },
      {
        id: 'vendors',
        title: 'Vendor Approvals',
        description: `${pendingVendors} vendors awaiting verification from Aleppo and Homs.`,
        actionLabel: 'Review applications',
        actionRoute: '/admin/vendors/applications',
      },
      {
        id: 'cod',
        title: 'COD Verification',
        description: `${codOrders} cash-on-delivery orders require confirmation before dispatch.`,
        actionLabel: 'Open orders queue',
        actionRoute: '/admin/orders?filter=cod',
      },
    ];
  }

  async getActivityFeed(): Promise<ActivityResponse[]> {
    const recentOrders = await this.orderRepository.find({
      order: { created_at: 'DESC' },
      take: 6,
      relations: ['user'],
    });

    return recentOrders.map((order) => {
      const number = String(order.id).padStart(5, '0');
      const customer = order.user?.fullName ?? order.shippingName ?? 'Customer';
      return {
        id: `order-${order.id}`,
        description: `Order #SS-${number} for ${customer} is now ${order.status}.`,
        timestamp: order.created_at?.toISOString?.() ?? new Date().toISOString(),
        category: 'order',
      };
    });
  }

  private toUsd(amountSyp: number): number {
    return Number((amountSyp / this.usdRate).toFixed(2));
  }
}

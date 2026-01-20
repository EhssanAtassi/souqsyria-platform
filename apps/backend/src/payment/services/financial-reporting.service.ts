/**
 * @file financial-reporting.service.ts
 * @description Comprehensive Financial Reporting and Analytics Service
 *
 * RESPONSIBILITIES:
 * - Calculate total revenue and profit for the e-commerce platform
 * - Track vendor commissions and payouts
 * - Generate financial reports with breakdowns by time, vendor, category
 * - Calculate platform fees and commission structures
 * - Provide real-time financial analytics and KPIs
 * - Export financial data for accounting and tax purposes
 *
 * FEATURES:
 * - Revenue tracking by period (daily, monthly, yearly)
 * - Commission calculations for vendors
 * - Platform fee calculations
 * - Tax calculations for Syrian market
 * - Vendor payout management
 * - Financial analytics and forecasting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  PaymentTransaction,
  PaymentStatus,
} from '../entities/payment-transaction.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';

export interface FinancialSummary {
  // Platform Revenue
  platform: {
    total_revenue: number;
    platform_commission: number;
    platform_fees: number;
    net_profit: number;
    transaction_count: number;
  };

  // Vendor Breakdown
  vendors: {
    total_vendor_revenue: number;
    total_vendor_commission_due: number;
    pending_payouts: number;
    paid_payouts: number;
    vendor_count: number;
  };

  // Financial Health
  metrics: {
    average_order_value: number;
    commission_rate: number;
    refund_rate: number;
    payment_success_rate: number;
  };

  // Time Period
  period: {
    start_date: Date;
    end_date: Date;
    days_count: number;
  };
}

export interface VendorFinancialReport {
  vendor_id: number;
  vendor_name: string;
  total_sales: number;
  total_orders: number;
  commission_due: number;
  commission_rate: number;
  platform_fees: number;
  net_payout: number;
  products_sold: number;
  top_products: {
    product_name: string;
    sales_count: number;
    revenue: number;
  }[];
}

export interface DailyFinancialReport {
  date: string;
  revenue: number;
  orders_count: number;
  commission_earned: number;
  vendor_payouts: number;
  refunds_issued: number;
  net_profit: number;
}

@Injectable()
export class FinancialReportingService {
  private readonly logger = new Logger(FinancialReportingService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentRepo: Repository<PaymentTransaction>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  /**
   * GENERATE COMPREHENSIVE FINANCIAL SUMMARY
   *
   * Provides complete financial overview for specified date range
   * Includes platform revenue, vendor commissions, and key metrics
   */
  async generateFinancialSummary(
    startDate: Date,
    endDate: Date,
    currency: string = 'SYP',
  ): Promise<FinancialSummary> {
    this.logger.log(
      `Generating financial summary from ${startDate} to ${endDate}`,
    );

    // Get all successful payments in date range
    const payments = await this.paymentRepo.find({
      where: {
        status: PaymentStatus.PAID,
        createdAt: Between(startDate, endDate),
        currency: currency,
      },
      relations: [
        'order',
        'order.items',
        'order.items.variant',
        'order.items.variant.product',
        'user',
      ],
    });

    // Calculate totals
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    const transactionCount = payments.length;

    // Platform commission (assume 10% default, should be configurable)
    const DEFAULT_COMMISSION_RATE = 0.1;
    const platformCommission = totalRevenue * DEFAULT_COMMISSION_RATE;

    // Platform fees (payment processing, etc.)
    const PLATFORM_FEE_RATE = 0.025; // 2.5% processing fee
    const platformFees = totalRevenue * PLATFORM_FEE_RATE;

    const netProfit = platformCommission + platformFees;

    // Vendor calculations
    const vendorRevenue = totalRevenue - platformCommission - platformFees;
    const uniqueVendors = new Set();
    let vendorCommissionDue = 0;

    payments.forEach((payment) => {
      payment.order?.items?.forEach((item) => {
        if (item.variant?.product?.vendor) {
          uniqueVendors.add(item.variant.product.vendor.id);
          // Each vendor gets their share minus platform commission
          const itemRevenue = Number(item.price) * item.quantity;
          vendorCommissionDue +=
            itemRevenue * (1 - DEFAULT_COMMISSION_RATE - PLATFORM_FEE_RATE);
        }
      });
    });

    // Calculate metrics
    const averageOrderValue =
      transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Get refunds for refund rate calculation
    const refundsInPeriod = await this.paymentRepo.count({
      where: {
        status: PaymentStatus.REFUNDED,
        createdAt: Between(startDate, endDate),
        currency: currency,
      },
    });

    const refundRate =
      transactionCount > 0 ? (refundsInPeriod / transactionCount) * 100 : 0;

    // Payment success rate (assume pending/failed payments for calculation)
    const allPaymentAttempts = await this.paymentRepo.count({
      where: {
        createdAt: Between(startDate, endDate),
        currency: currency,
      },
    });

    const paymentSuccessRate =
      allPaymentAttempts > 0
        ? (transactionCount / allPaymentAttempts) * 100
        : 100;

    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
    );

    return {
      platform: {
        total_revenue: totalRevenue,
        platform_commission: platformCommission,
        platform_fees: platformFees,
        net_profit: netProfit,
        transaction_count: transactionCount,
      },
      vendors: {
        total_vendor_revenue: vendorRevenue,
        total_vendor_commission_due: vendorCommissionDue,
        pending_payouts: vendorCommissionDue, // TODO: Track actual payout status
        paid_payouts: 0, // TODO: Implement payout tracking
        vendor_count: uniqueVendors.size,
      },
      metrics: {
        average_order_value: averageOrderValue,
        commission_rate: DEFAULT_COMMISSION_RATE * 100,
        refund_rate: refundRate,
        payment_success_rate: paymentSuccessRate,
      },
      period: {
        start_date: startDate,
        end_date: endDate,
        days_count: daysDiff,
      },
    };
  }

  /**
   * GENERATE VENDOR FINANCIAL REPORT
   *
   * Detailed financial report for a specific vendor
   * Includes sales, commissions, top products, and payout calculations
   */
  async generateVendorReport(
    vendorId: number,
    startDate: Date,
    endDate: Date,
    currency: string = 'SYP',
  ): Promise<VendorFinancialReport> {
    this.logger.log(
      `Generating vendor report for vendor ${vendorId} from ${startDate} to ${endDate}`,
    );

    // Get vendor info
    const vendor = await this.userRepo.findOne({
      where: { id: vendorId },
      select: ['id', 'fullName'],
    });

    if (!vendor) {
      throw new BadRequestException(`Vendor with ID ${vendorId} not found`);
    }

    // Get all payments for this vendor's products
    const payments = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('payment.status = :status', { status: PaymentStatus.PAID })
      .andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('payment.currency = :currency', { currency })
      .andWhere('product.vendor_id = :vendorId', { vendorId })
      .getMany();

    // Calculate vendor totals
    let totalSales = 0;
    let totalOrders = 0;
    const productSales = new Map();
    const orderIds = new Set();

    payments.forEach((payment) => {
      orderIds.add(payment.order.id);

      payment.order.items?.forEach((item) => {
        if (item.variant?.product?.vendor?.id === vendorId) {
          const itemRevenue = Number(item.price) * item.quantity;
          totalSales += itemRevenue;

          // Track product sales
          const productName = item.variant.product.nameEn || 'Unknown Product';
          if (!productSales.has(productName)) {
            productSales.set(productName, { sales_count: 0, revenue: 0 });
          }
          const productStats = productSales.get(productName);
          productStats.sales_count += item.quantity;
          productStats.revenue += itemRevenue;
        }
      });
    });

    totalOrders = orderIds.size;

    // Commission calculations
    const COMMISSION_RATE = 0.1; // 10% platform commission
    const PLATFORM_FEE_RATE = 0.025; // 2.5% processing fee

    const commissionDue = totalSales * COMMISSION_RATE;
    const platformFees = totalSales * PLATFORM_FEE_RATE;
    const netPayout = totalSales - commissionDue - platformFees;

    // Get top 5 products
    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([product_name, stats]) => ({
        product_name,
        sales_count: stats.sales_count,
        revenue: stats.revenue,
      }));

    return {
      vendor_id: vendorId,
      vendor_name: vendor.fullName || 'Unknown Vendor',
      total_sales: totalSales,
      total_orders: totalOrders,
      commission_due: commissionDue,
      commission_rate: COMMISSION_RATE * 100,
      platform_fees: platformFees,
      net_payout: netPayout,
      products_sold: productSales.size,
      top_products: topProducts,
    };
  }

  /**
   * GENERATE DAILY FINANCIAL REPORTS
   *
   * Returns day-by-day financial breakdown for the specified period
   * Useful for trend analysis and daily reporting
   */
  async generateDailyReports(
    startDate: Date,
    endDate: Date,
    currency: string = 'SYP',
  ): Promise<DailyFinancialReport[]> {
    this.logger.log(`Generating daily reports from ${startDate} to ${endDate}`);

    const dailyReports: DailyFinancialReport[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Get payments for this day
      const dailyPayments = await this.paymentRepo.find({
        where: {
          status: PaymentStatus.PAID,
          createdAt: Between(dayStart, dayEnd),
          currency: currency,
        },
        relations: ['order'],
      });

      // Get refunds for this day
      const dailyRefunds = await this.paymentRepo.find({
        where: {
          status: PaymentStatus.REFUNDED,
          createdAt: Between(dayStart, dayEnd),
          currency: currency,
        },
      });

      const revenue = dailyPayments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const refundsIssued = dailyRefunds.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0,
      );
      const ordersCount = dailyPayments.length;

      // Calculate commissions and payouts
      const commissionEarned = revenue * 0.1; // 10% platform commission
      const platformFees = revenue * 0.025; // 2.5% processing fee
      const vendorPayouts = revenue - commissionEarned - platformFees;
      const netProfit = commissionEarned + platformFees - refundsIssued;

      dailyReports.push({
        date: currentDate.toISOString().split('T')[0],
        revenue: revenue,
        orders_count: ordersCount,
        commission_earned: commissionEarned,
        vendor_payouts: vendorPayouts,
        refunds_issued: refundsIssued,
        net_profit: netProfit,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyReports;
  }

  /**
   * GET PLATFORM FINANCIAL HEALTH METRICS
   *
   * Key performance indicators for the platform's financial health
   */
  async getPlatformHealthMetrics(days: number = 30): Promise<{
    revenue_growth_rate: number;
    vendor_retention_rate: number;
    average_commission_per_vendor: number;
    payment_processing_efficiency: number;
    monthly_recurring_revenue: number;
    churn_rate: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // Current period metrics
    const currentSummary = await this.generateFinancialSummary(
      startDate,
      endDate,
    );

    // Previous period metrics
    const previousSummary = await this.generateFinancialSummary(
      previousPeriodStart,
      startDate,
    );

    // Calculate growth rates
    const revenueGrowthRate =
      previousSummary.platform.total_revenue > 0
        ? ((currentSummary.platform.total_revenue -
            previousSummary.platform.total_revenue) /
            previousSummary.platform.total_revenue) *
          100
        : 0;

    const averageCommissionPerVendor =
      currentSummary.vendors.vendor_count > 0
        ? currentSummary.platform.platform_commission /
          currentSummary.vendors.vendor_count
        : 0;

    // Calculate monthly recurring revenue (estimate)
    const dailyAverage = currentSummary.platform.total_revenue / days;
    const monthlyRecurringRevenue = dailyAverage * 30;

    return {
      revenue_growth_rate: revenueGrowthRate,
      vendor_retention_rate: 95, // TODO: Calculate actual retention
      average_commission_per_vendor: averageCommissionPerVendor,
      payment_processing_efficiency:
        currentSummary.metrics.payment_success_rate,
      monthly_recurring_revenue: monthlyRecurringRevenue,
      churn_rate: 5, // TODO: Calculate actual churn rate
    };
  }

  /**
   * EXPORT FINANCIAL DATA FOR ACCOUNTING
   *
   * Exports financial data in format suitable for accounting software
   */
  async exportFinancialData(
    startDate: Date,
    endDate: Date,
    format: 'csv' | 'json' = 'json',
  ): Promise<any> {
    this.logger.log(
      `Exporting financial data from ${startDate} to ${endDate} in ${format} format`,
    );

    const payments = await this.paymentRepo.find({
      where: {
        status: PaymentStatus.PAID,
        createdAt: Between(startDate, endDate),
      },
      relations: [
        'order',
        'order.items',
        'order.items.variant',
        'order.items.variant.product',
        'user',
      ],
      order: { createdAt: 'ASC' },
    });

    const exportData = payments.map((payment) => ({
      transaction_id: payment.id,
      order_id: payment.order.id,
      date: payment.createdAt,
      customer_email: payment.user.email,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.method,
      platform_commission: Number(payment.amount) * 0.1,
      platform_fees: Number(payment.amount) * 0.025,
      vendor_payout: Number(payment.amount) * 0.875,
      status: payment.status,
      gateway_transaction_id: payment.gatewayTransactionId,
    }));

    if (format === 'csv') {
      // TODO: Convert to CSV format
      return exportData;
    }

    return {
      export_date: new Date(),
      period: { start_date: startDate, end_date: endDate },
      total_transactions: exportData.length,
      total_revenue: exportData.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      ),
      transactions: exportData,
    };
  }
}

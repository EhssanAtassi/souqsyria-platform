/**
 * @file financial-analytics.controller.ts
 * @description Financial Analytics and Reporting Controller for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Provide comprehensive financial reporting APIs
 * - Platform revenue and profit tracking
 * - Vendor commission and payout management
 * - Financial analytics and business intelligence
 * - Export capabilities for accounting integration
 * - Real-time financial health monitoring
 *
 * ENDPOINTS:
 * - GET /financial/summary - Platform financial summary
 * - GET /financial/vendor/:id - Vendor financial report
 * - GET /financial/daily-reports - Daily financial breakdown
 * - GET /financial/health-metrics - Platform financial health KPIs
 * - GET /financial/export - Export financial data
 * - GET /financial/commission-calculator - Commission calculation tool
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { FinancialReportingService } from '../services/financial-reporting.service';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

@ApiTags('💰 Financial Analytics & Reporting')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@Controller('financial')
export class FinancialAnalyticsController {
  private readonly logger = new Logger(FinancialAnalyticsController.name);

  constructor(
    private readonly financialReportingService: FinancialReportingService,
  ) {}

  /**
   * GET PLATFORM FINANCIAL SUMMARY
   *
   * Comprehensive financial overview including platform revenue,
   * vendor commissions, and key financial metrics
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get platform financial summary',
    description:
      'Comprehensive financial overview including revenue, commissions, vendor payouts, and key metrics for specified date range',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date for the report (YYYY-MM-DD format)',
    example: '2025-08-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date for the report (YYYY-MM-DD format)',
    example: '2025-08-31',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['SYP', 'USD', 'EUR'],
    description: 'Currency filter for the report',
    example: 'SYP',
  })
  @ApiOkResponse({
    description: 'Financial summary retrieved successfully',
    schema: {
      example: {
        summary: {
          platform: {
            total_revenue: 15750000,
            platform_commission: 1575000,
            platform_fees: 393750,
            net_profit: 1968750,
            transaction_count: 245,
          },
          vendors: {
            total_vendor_revenue: 13781250,
            total_vendor_commission_due: 13781250,
            pending_payouts: 13781250,
            paid_payouts: 0,
            vendor_count: 18,
          },
          metrics: {
            average_order_value: 64285.71,
            commission_rate: 10,
            refund_rate: 2.5,
            payment_success_rate: 96.8,
          },
          period: {
            start_date: '2025-08-01T00:00:00.000Z',
            end_date: '2025-08-31T23:59:59.999Z',
            days_count: 31,
          },
        },
        insights: {
          revenue_trend: 'increasing',
          top_performing_day: '2025-08-15',
          commission_efficiency: 'optimal',
          vendor_satisfaction: 'high',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid date range or parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions - admin access required',
  })
  async getFinancialSummary(
    @CurrentUser() user: UserFromToken,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('currency') currency: string = 'SYP',
  ) {
    this.logger.log(`Admin ${user.id} requesting financial summary`);

    // Default to last 30 days if no dates provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Validate date range
    if (startDateObj > endDateObj) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const summary =
      await this.financialReportingService.generateFinancialSummary(
        startDateObj,
        endDateObj,
        currency,
      );

    // Add business insights
    const insights = {
      revenue_trend:
        summary.platform.total_revenue > 0 ? 'increasing' : 'stable',
      commission_efficiency:
        summary.metrics.commission_rate >= 10 ? 'optimal' : 'low',
      vendor_satisfaction:
        summary.vendors.vendor_count > 0 ? 'high' : 'needs_attention',
      payment_performance:
        summary.metrics.payment_success_rate >= 95
          ? 'excellent'
          : 'needs_improvement',
    };

    return {
      summary,
      insights,
      generated_at: new Date(),
      currency: currency,
    };
  }

  /**
   * GET VENDOR FINANCIAL REPORT
   *
   * Detailed financial report for a specific vendor including
   * sales performance, commissions, and payout calculations
   */
  @Get('vendor/:vendorId')
  @ApiOperation({
    summary: 'Get vendor financial report',
    description:
      'Detailed financial performance report for a specific vendor including sales, commissions, top products, and payout calculations',
  })
  @ApiParam({
    name: 'vendorId',
    description: 'Vendor ID to generate report for',
    example: 123,
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date for the report (YYYY-MM-DD format)',
    example: '2025-08-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date for the report (YYYY-MM-DD format)',
    example: '2025-08-31',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['SYP', 'USD', 'EUR'],
    description: 'Currency filter for the report',
    example: 'SYP',
  })
  @ApiOkResponse({
    description: 'Vendor financial report retrieved successfully',
    schema: {
      example: {
        report: {
          vendor_id: 123,
          vendor_name: 'TechSyria Store',
          total_sales: 2750000,
          total_orders: 45,
          commission_due: 275000,
          commission_rate: 10,
          platform_fees: 68750,
          net_payout: 2406250,
          products_sold: 12,
          top_products: [
            {
              product_name: 'Samsung Galaxy S24',
              sales_count: 15,
              revenue: 1375000,
            },
            {
              product_name: 'iPhone 15 Pro',
              sales_count: 8,
              revenue: 920000,
            },
          ],
        },
        performance_metrics: {
          average_order_value: 61111.11,
          conversion_rate: 15.2,
          customer_satisfaction: 4.8,
          return_rate: 2.1,
        },
        payout_schedule: {
          next_payout_date: '2025-09-01',
          payout_frequency: 'monthly',
          minimum_payout: 100000,
        },
      },
    },
  })
  async getVendorFinancialReport(
    @CurrentUser() user: UserFromToken,
    @Param('vendorId') vendorId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('currency') currency: string = 'SYP',
  ) {
    this.logger.log(`Generating financial report for vendor ${vendorId}`);

    // Default to last 30 days
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const report = await this.financialReportingService.generateVendorReport(
      Number(vendorId),
      startDateObj,
      endDateObj,
      currency,
    );

    // Calculate performance metrics
    const averageOrderValue =
      report.total_orders > 0 ? report.total_sales / report.total_orders : 0;

    const performanceMetrics = {
      average_order_value: averageOrderValue,
      conversion_rate: 15.2, // TODO: Calculate actual conversion rate
      customer_satisfaction: 4.8, // TODO: Get from reviews
      return_rate: 2.1, // TODO: Calculate actual return rate
    };

    // Payout information
    const payoutSchedule = {
      next_payout_date: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1,
      )
        .toISOString()
        .split('T')[0],
      payout_frequency: 'monthly',
      minimum_payout: 100000, // Minimum 100,000 SYP
    };

    return {
      report,
      performance_metrics: performanceMetrics,
      payout_schedule: payoutSchedule,
      generated_at: new Date(),
      currency: currency,
    };
  }

  /**
   * GET DAILY FINANCIAL REPORTS
   *
   * Day-by-day financial breakdown showing daily revenue,
   * commissions, payouts, and trends
   */
  @Get('daily-reports')
  @ApiOperation({
    summary: 'Get daily financial breakdown',
    description:
      'Provides day-by-day financial reports showing daily revenue, commission earnings, vendor payouts, and refunds',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Start date for daily reports (YYYY-MM-DD format)',
    example: '2025-08-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'End date for daily reports (YYYY-MM-DD format)',
    example: '2025-08-31',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['SYP', 'USD', 'EUR'],
    description: 'Currency filter for the reports',
    example: 'SYP',
  })
  @ApiOkResponse({
    description: 'Daily financial reports retrieved successfully',
    schema: {
      example: {
        daily_reports: [
          {
            date: '2025-08-01',
            revenue: 245000,
            orders_count: 8,
            commission_earned: 24500,
            vendor_payouts: 214375,
            refunds_issued: 0,
            net_profit: 30125,
          },
          {
            date: '2025-08-02',
            revenue: 180000,
            orders_count: 6,
            commission_earned: 18000,
            vendor_payouts: 157500,
            refunds_issued: 25000,
            net_profit: 17500,
          },
        ],
        summary: {
          total_days: 31,
          total_revenue: 15750000,
          average_daily_revenue: 508064.52,
          best_day: {
            date: '2025-08-15',
            revenue: 890000,
          },
          worst_day: {
            date: '2025-08-23',
            revenue: 125000,
          },
        },
      },
    },
  })
  async getDailyFinancialReports(
    @CurrentUser() user: UserFromToken,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('currency') currency: string = 'SYP',
  ) {
    this.logger.log(`Admin ${user.id} requesting daily financial reports`);

    // Default to last 30 days
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const dailyReports =
      await this.financialReportingService.generateDailyReports(
        startDateObj,
        endDateObj,
        currency,
      );

    // Calculate summary statistics
    const totalRevenue = dailyReports.reduce(
      (sum, day) => sum + day.revenue,
      0,
    );
    const averageDailyRevenue =
      dailyReports.length > 0 ? totalRevenue / dailyReports.length : 0;

    const bestDay = dailyReports.reduce(
      (best, day) => (day.revenue > (best?.revenue || 0) ? day : best),
      null,
    );

    const worstDay = dailyReports.reduce(
      (worst, day) =>
        day.revenue < (worst?.revenue || Infinity) ? day : worst,
      null,
    );

    const summary = {
      total_days: dailyReports.length,
      total_revenue: totalRevenue,
      average_daily_revenue: averageDailyRevenue,
      best_day: bestDay
        ? { date: bestDay.date, revenue: bestDay.revenue }
        : null,
      worst_day: worstDay
        ? { date: worstDay.date, revenue: worstDay.revenue }
        : null,
    };

    return {
      daily_reports: dailyReports,
      summary,
      period: {
        start_date: startDateObj,
        end_date: endDateObj,
      },
      currency: currency,
    };
  }

  /**
   * GET PLATFORM HEALTH METRICS
   *
   * Key performance indicators for platform financial health
   * including growth rates, efficiency metrics, and trends
   */
  @Get('health-metrics')
  @ApiOperation({
    summary: 'Get platform financial health metrics',
    description:
      'Key performance indicators including revenue growth, vendor retention, payment efficiency, and other critical financial health metrics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
    example: 30,
  })
  @ApiOkResponse({
    description: 'Platform health metrics retrieved successfully',
    schema: {
      example: {
        health_metrics: {
          revenue_growth_rate: 15.4,
          vendor_retention_rate: 95,
          average_commission_per_vendor: 87500,
          payment_processing_efficiency: 96.8,
          monthly_recurring_revenue: 15240000,
          churn_rate: 5,
        },
        health_score: {
          overall_score: 92,
          status: 'excellent',
          recommendations: [
            'Maintain current growth trajectory',
            'Focus on reducing payment failures',
            'Consider increasing vendor incentives',
          ],
        },
        benchmarks: {
          industry_average_commission_rate: 12,
          target_payment_success_rate: 98,
          optimal_churn_rate: 3,
        },
      },
    },
  })
  async getPlatformHealthMetrics(
    @CurrentUser() user: UserFromToken,
    @Query('days') days: number = 30,
  ) {
    this.logger.log(
      `Admin ${user.id} requesting platform health metrics for ${days} days`,
    );

    const healthMetrics =
      await this.financialReportingService.getPlatformHealthMetrics(days);

    // Calculate overall health score (0-100)
    let healthScore = 0;
    const weights = {
      revenue_growth: 0.3,
      vendor_retention: 0.2,
      payment_efficiency: 0.25,
      churn_rate: 0.25,
    };

    // Revenue growth score (0-30 points)
    const revenueScore = Math.min(
      30,
      Math.max(0, healthMetrics.revenue_growth_rate * 2),
    );
    healthScore += revenueScore;

    // Vendor retention score (0-20 points)
    const retentionScore = (healthMetrics.vendor_retention_rate / 100) * 20;
    healthScore += retentionScore;

    // Payment efficiency score (0-25 points)
    const efficiencyScore =
      (healthMetrics.payment_processing_efficiency / 100) * 25;
    healthScore += efficiencyScore;

    // Churn rate score (0-25 points, lower is better)
    const churnScore = Math.max(0, 25 - healthMetrics.churn_rate * 2);
    healthScore += churnScore;

    const overallScore = Math.round(healthScore);

    let status = 'needs_attention';
    if (overallScore >= 90) status = 'excellent';
    else if (overallScore >= 75) status = 'good';
    else if (overallScore >= 60) status = 'fair';

    // Generate recommendations
    const recommendations = [];
    if (healthMetrics.revenue_growth_rate < 10) {
      recommendations.push('Focus on marketing and customer acquisition');
    }
    if (healthMetrics.payment_processing_efficiency < 95) {
      recommendations.push('Improve payment gateway reliability');
    }
    if (healthMetrics.churn_rate > 5) {
      recommendations.push('Investigate and reduce vendor churn');
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current excellent performance');
    }

    return {
      health_metrics: healthMetrics,
      health_score: {
        overall_score: overallScore,
        status: status,
        recommendations: recommendations,
      },
      benchmarks: {
        industry_average_commission_rate: 12,
        target_payment_success_rate: 98,
        optimal_churn_rate: 3,
      },
      generated_at: new Date(),
    };
  }

  /**
   * EXPORT FINANCIAL DATA
   *
   * Export financial data in various formats for accounting
   * integration and external analysis
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export financial data',
    description:
      'Export comprehensive financial data in JSON or CSV format for accounting software integration',
  })
  @ApiQuery({
    name: 'start_date',
    required: true,
    type: String,
    description: 'Start date for export (YYYY-MM-DD format)',
    example: '2025-08-01',
  })
  @ApiQuery({
    name: 'end_date',
    required: true,
    type: String,
    description: 'End date for export (YYYY-MM-DD format)',
    example: '2025-08-31',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    description: 'Export format (default: json)',
    example: 'json',
  })
  @ApiOkResponse({
    description: 'Financial data exported successfully',
  })
  async exportFinancialData(
    @CurrentUser() user: UserFromToken,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    this.logger.log(
      `Admin ${user.id} exporting financial data from ${startDate} to ${endDate} in ${format} format`,
    );

    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Start date and end date are required for export',
      );
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj > endDateObj) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const exportData = await this.financialReportingService.exportFinancialData(
      startDateObj,
      endDateObj,
      format,
    );

    return {
      export_completed: true,
      format: format,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      data: exportData,
      exported_by: user.id,
      export_timestamp: new Date(),
    };
  }

  /**
   * COMMISSION CALCULATOR
   *
   * Calculate commissions and fees for different scenarios
   * Useful for pricing strategy and vendor onboarding
   */
  @Get('commission-calculator')
  @ApiOperation({
    summary: 'Commission and fee calculator',
    description:
      'Calculate platform commissions, fees, and vendor payouts for different order amounts and scenarios',
  })
  @ApiQuery({
    name: 'amount',
    required: true,
    type: Number,
    description: 'Order amount to calculate commissions for',
    example: 100000,
  })
  @ApiQuery({
    name: 'commission_rate',
    required: false,
    type: Number,
    description: 'Commission rate percentage (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'processing_fee_rate',
    required: false,
    type: Number,
    description: 'Processing fee rate percentage (default: 2.5)',
    example: 2.5,
  })
  @ApiOkResponse({
    description: 'Commission calculation completed successfully',
    schema: {
      example: {
        calculation: {
          order_amount: 100000,
          platform_commission: 10000,
          processing_fees: 2500,
          vendor_payout: 87500,
          total_platform_earnings: 12500,
        },
        rates: {
          commission_rate: 10,
          processing_fee_rate: 2.5,
          vendor_payout_rate: 87.5,
        },
        scenarios: {
          if_commission_8_percent: {
            platform_commission: 8000,
            vendor_payout: 89500,
            total_platform_earnings: 10500,
          },
          if_commission_12_percent: {
            platform_commission: 12000,
            vendor_payout: 85500,
            total_platform_earnings: 14500,
          },
        },
      },
    },
  })
  async calculateCommissions(
    @Query('amount') amount: number,
    @Query('commission_rate') commissionRate: number = 10,
    @Query('processing_fee_rate') processingFeeRate: number = 2.5,
  ) {
    this.logger.log(`Calculating commissions for amount ${amount}`);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    if (commissionRate < 0 || commissionRate > 100) {
      throw new BadRequestException(
        'Commission rate must be between 0 and 100',
      );
    }

    if (processingFeeRate < 0 || processingFeeRate > 100) {
      throw new BadRequestException(
        'Processing fee rate must be between 0 and 100',
      );
    }

    const orderAmount = Number(amount);
    const platformCommission = orderAmount * (commissionRate / 100);
    const processingFees = orderAmount * (processingFeeRate / 100);
    const vendorPayout = orderAmount - platformCommission - processingFees;
    const totalPlatformEarnings = platformCommission + processingFees;

    // Calculate scenarios with different commission rates
    const scenarios = {
      if_commission_8_percent: {
        platform_commission: orderAmount * 0.08,
        vendor_payout: orderAmount * (1 - 0.08 - processingFeeRate / 100),
        total_platform_earnings: orderAmount * 0.08 + processingFees,
      },
      if_commission_12_percent: {
        platform_commission: orderAmount * 0.12,
        vendor_payout: orderAmount * (1 - 0.12 - processingFeeRate / 100),
        total_platform_earnings: orderAmount * 0.12 + processingFees,
      },
    };

    return {
      calculation: {
        order_amount: orderAmount,
        platform_commission: platformCommission,
        processing_fees: processingFees,
        vendor_payout: vendorPayout,
        total_platform_earnings: totalPlatformEarnings,
      },
      rates: {
        commission_rate: commissionRate,
        processing_fee_rate: processingFeeRate,
        vendor_payout_rate: (vendorPayout / orderAmount) * 100,
      },
      scenarios: scenarios,
      currency: 'SYP',
      calculated_at: new Date(),
    };
  }
}

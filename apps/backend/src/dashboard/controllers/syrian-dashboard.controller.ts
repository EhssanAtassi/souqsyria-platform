/**
 * @file syrian-dashboard.controller.ts
 * @description Enterprise Syrian Dashboard Controller with Comprehensive Analytics
 *
 * ENDPOINTS:
 * - Syrian market overview with SYP currency and governorate analytics
 * - Real-time performance monitoring with Arabic localization
 * - Business intelligence metrics with KYC and manufacturer integration
 * - Advanced reporting and export capabilities
 * - Performance monitoring and KPI tracking
 * - Market trends analysis with Syrian economic indicators
 * - Comprehensive Swagger documentation with Arabic examples
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { SyrianAnalyticsService } from '../services/syrian-analytics.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

import {
  SyrianAnalyticsQueryDto,
  RealTimeMetricsQueryDto,
  GenerateReportDto,
  KpiDashboardQueryDto,
  MarketTrendsQueryDto,
  PerformanceMonitoringQueryDto,
} from '../dto/syrian-dashboard.dto';

@ApiTags('📊 Syrian Dashboard & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('syrian-dashboard')
export class SyrianDashboardController {
  private readonly logger = new Logger(SyrianDashboardController.name);

  constructor(private readonly analyticsService: SyrianAnalyticsService) {}

  /**
   * SYRIAN MARKET OVERVIEW
   *
   * Comprehensive overview of the Syrian market with localized metrics
   */
  @Get('market-overview')
  @ApiOperation({
    summary: 'Get Syrian market overview',
    description:
      'Comprehensive Syrian market analytics including SYP revenue, governorate distribution, and business ecosystem metrics with Arabic localization',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analysis period',
    example: '2025-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analysis period',
    example: '2025-08-09T23:59:59.000Z',
  })
  @ApiQuery({
    name: 'governorateIds',
    required: false,
    type: [Number],
    description: 'Filter by specific governorates',
    example: [1, 2, 3],
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar', 'both'],
    description: 'Response language preference',
    example: 'both',
  })
  @ApiOkResponse({
    description: 'Syrian market overview retrieved successfully',
    schema: {
      example: {
        marketOverview: {
          totalRevenueSyp: 2500000000,
          totalRevenueUsd: 166666.67,
          totalOrders: 15420,
          activeUsers: 8750,
          verifiedVendors: 245,
          verifiedManufacturers: 87,
          completedKycDocuments: 195,
          averageOrderValueSyp: 162162.16,
          monthlyGrowthRate: 12.5,
          marketPenetrationByGovernorate: [
            {
              governorateId: 1,
              nameEn: 'Damascus',
              nameAr: 'دمشق',
              orderCount: 5420,
              revenueSyp: 890000000,
              userCount: 3200,
              penetrationRate: 15.2,
            },
            {
              governorateId: 2,
              nameEn: 'Aleppo',
              nameAr: 'حلب',
              orderCount: 3890,
              revenueSyp: 650000000,
              userCount: 2100,
              penetrationRate: 8.9,
            },
          ],
        },
        exchangeRate: {
          usdToSyp: 15000,
          lastUpdated: '2025-08-09T14:30:00.000Z',
          trend: 'stable',
        },
        metadata: {
          generatedAt: '2025-08-09T15:00:00.000Z',
          period: {
            startDate: '2025-07-01T00:00:00.000Z',
            endDate: '2025-08-09T23:59:59.000Z',
            days: 39,
          },
          language: 'both',
          currency: 'SYP',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permissions to view market overview',
  })
  async getSyrianMarketOverview(
    @CurrentUser() user: UserFromToken,
    @Query() query: SyrianAnalyticsQueryDto,
  ) {
    this.logger.log(`User ${user.id} requesting Syrian market overview`);

    const startDate = query.dateRange?.startDate
      ? new Date(query.dateRange.startDate)
      : undefined;
    const endDate = query.dateRange?.endDate
      ? new Date(query.dateRange.endDate)
      : undefined;

    const marketOverview = await this.analyticsService.getSyrianMarketOverview(
      startDate,
      endDate,
    );

    return {
      marketOverview,
      exchangeRate: {
        usdToSyp: 15000, // Would be fetched from analytics service
        lastUpdated: new Date().toISOString(),
        trend: 'stable' as const,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        period: {
          startDate:
            startDate?.toISOString() ||
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1,
            ).toISOString(),
          endDate: endDate?.toISOString() || new Date().toISOString(),
          days:
            Math.ceil(
              (endDate?.getTime() || Date.now()) -
                (startDate?.getTime() ||
                  new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1,
                  ).getTime()),
            ) /
            (1000 * 60 * 60 * 24),
        },
        language: query.localization?.language || 'both',
        currency: query.currency?.primaryCurrency || 'SYP',
      },
    };
  }

  /**
   * REAL-TIME PERFORMANCE METRICS
   *
   * Real-time performance monitoring with alerts and system health
   */
  @Get('real-time-metrics')
  @ApiOperation({
    summary: 'Get real-time performance metrics',
    description:
      'Real-time Syrian market performance metrics including current activity, system health, alerts, and comparison with previous periods',
  })
  @ApiQuery({
    name: 'refreshInterval',
    required: false,
    type: Number,
    description: 'Refresh interval in seconds',
    example: 30,
  })
  @ApiQuery({
    name: 'includeSystemHealth',
    required: false,
    type: Boolean,
    description: 'Include system performance metrics',
    example: true,
  })
  @ApiQuery({
    name: 'minAlertSeverity',
    required: false,
    enum: ['low', 'medium', 'high', 'critical'],
    description: 'Minimum alert severity to include',
    example: 'medium',
  })
  @ApiQuery({
    name: 'alertLanguage',
    required: false,
    enum: ['en', 'ar', 'both'],
    description: 'Language for alert messages',
    example: 'ar',
  })
  @ApiOkResponse({
    description: 'Real-time metrics retrieved successfully',
    schema: {
      example: {
        currentHourMetrics: {
          orderCount: 25,
          revenueSyp: 375000,
          revenueUsd: 25,
          activeUsers: 150,
          conversionRate: 3.2,
        },
        todayVsYesterday: {
          orderChange: 8.5,
          revenueChange: 12.3,
          userChange: -2.1,
          performanceIndicator: 'up',
        },
        systemHealth: {
          apiResponseTime: 145,
          databasePerformance: 98.5,
          cacheHitRate: 89.2,
          errorRate: 0.3,
          systemStatus: 'excellent',
        },
        alerts: [
          {
            type: 'revenue',
            severity: 'medium',
            messageEn: 'Revenue growth slowing in Homs governorate',
            messageAr: 'تباطؤ نمو الإيرادات في محافظة حمص',
            timestamp: '2025-08-09T14:45:00.000Z',
            actionRequired: false,
          },
        ],
        lastUpdated: '2025-08-09T15:00:00.000Z',
        nextUpdate: '2025-08-09T15:00:30.000Z',
      },
    },
  })
  async getRealTimeMetrics(
    @CurrentUser() user: UserFromToken,
    @Query() query: RealTimeMetricsQueryDto,
  ) {
    this.logger.log(`User ${user.id} requesting real-time metrics`);

    const metrics = await this.analyticsService.getRealTimePerformanceMetrics();

    return {
      ...metrics,
      lastUpdated: new Date().toISOString(),
      nextUpdate: new Date(
        Date.now() + (query.refreshInterval || 30) * 1000,
      ).toISOString(),
      settings: {
        refreshInterval: query.refreshInterval || 30,
        includeSystemHealth: query.includeSystemHealth !== false,
        minAlertSeverity: query.minAlertSeverity || 'medium',
        alertLanguage: query.alertLanguage || 'ar',
      },
    };
  }

  /**
   * BUSINESS INTELLIGENCE DASHBOARD
   *
   * Comprehensive business intelligence with KYC, manufacturers, and shipping data
   */
  @Get('business-intelligence')
  @ApiOperation({
    summary: 'Get business intelligence metrics',
    description:
      'Comprehensive business intelligence dashboard including KYC compliance, manufacturer ecosystem, shipping insights, and regional performance analytics',
  })
  @ApiQuery({
    name: 'includeKycMetrics',
    required: false,
    type: Boolean,
    description: 'Include KYC compliance analytics',
    example: true,
  })
  @ApiQuery({
    name: 'includeManufacturerMetrics',
    required: false,
    type: Boolean,
    description: 'Include manufacturer ecosystem data',
    example: true,
  })
  @ApiQuery({
    name: 'includeShippingMetrics',
    required: false,
    type: Boolean,
    description: 'Include shipping performance metrics',
    example: true,
  })
  @ApiOkResponse({
    description: 'Business intelligence metrics retrieved successfully',
    schema: {
      example: {
        kycCompliance: {
          totalDocuments: 1245,
          approvedDocuments: 890,
          pendingDocuments: 215,
          rejectedDocuments: 140,
          complianceRate: 71.5,
          averageProcessingTime: 28.5,
          documentTypeDistribution: {
            syrian_id: 456,
            business_license: 321,
            tax_certificate: 234,
            industrial_license: 234,
          },
        },
        manufacturerEcosystem: {
          totalManufacturers: 187,
          verifiedManufacturers: 145,
          localManufacturers: 98,
          internationalBrands: 89,
          averageQualityScore: 87.3,
          topPerformingManufacturers: [
            {
              id: 1,
              nameEn: 'Syrian Electronics Co.',
              nameAr: 'شركة الإلكترونيات السورية',
              qualityScore: 95,
              totalProducts: 234,
              averageRating: 4.7,
            },
          ],
        },
        shippingInsights: {
          totalShipments: 12450,
          deliveredShipments: 11205,
          deliverySuccessRate: 90.0,
          averageDeliveryTime: 2.3,
          shippingCompanyPerformance: [
            {
              companyId: 1,
              nameEn: 'Damascus Express',
              nameAr: 'دمشق السريع',
              deliveryRate: 92.5,
              averageTime: 2.1,
              orderCount: 5420,
            },
          ],
        },
        regionalPerformance: {
          topPerformingGovernorates: [
            {
              governorateId: 1,
              nameEn: 'Damascus',
              nameAr: 'دمشق',
              revenueSyp: 890000000,
              orderCount: 5420,
              growthRate: 15.2,
              userEngagement: 78.5,
            },
          ],
          emergingMarkets: [
            {
              governorateId: 10,
              nameEn: 'As-Suwayda',
              nameAr: 'السويداء',
              potentialScore: 73.2,
              currentPenetration: 12.1,
              recommendedInvestment: 250000,
            },
          ],
        },
      },
    },
  })
  async getBusinessIntelligence(
    @CurrentUser() user: UserFromToken,
    @Query() query: SyrianAnalyticsQueryDto,
  ) {
    this.logger.log(`User ${user.id} requesting business intelligence metrics`);

    const businessIntelligence =
      await this.analyticsService.getSyrianBusinessIntelligence();

    return {
      ...businessIntelligence,
      metadata: {
        generatedAt: new Date().toISOString(),
        includeKyc: query.includeKycMetrics !== false,
        includeManufacturers: query.includeManufacturerMetrics !== false,
        includeShipping: query.includeShippingMetrics !== false,
        language: query.localization?.language || 'both',
      },
    };
  }

  /**
   * KPI DASHBOARD
   *
   * Key Performance Indicators with Syrian market focus
   */
  @Get('kpi-dashboard')
  @ApiOperation({
    summary: 'Get KPI dashboard',
    description:
      'Key Performance Indicators dashboard with Syrian market metrics, growth rates, and benchmarking data',
  })
  @ApiQuery({
    name: 'timePeriod',
    required: false,
    enum: ['today', 'week', 'month', 'quarter', 'year', 'custom'],
    description: 'Time period for KPI calculation',
    example: 'month',
  })
  @ApiQuery({
    name: 'kpiCategories',
    required: false,
    type: [String],
    description: 'KPI categories to include',
    example: ['revenue', 'orders', 'users', 'vendors'],
  })
  @ApiQuery({
    name: 'includeGrowthRates',
    required: false,
    type: Boolean,
    description: 'Include growth rate comparisons',
    example: true,
  })
  @ApiOkResponse({
    description: 'KPI dashboard data retrieved successfully',
    schema: {
      example: {
        kpis: {
          revenue: {
            current: 2500000000,
            previousPeriod: 2200000000,
            growthRate: 13.6,
            trend: 'up',
            target: 2800000000,
            targetAchievement: 89.3,
            nameEn: 'Total Revenue',
            nameAr: 'إجمالي الإيرادات',
            unit: 'SYP',
            formatAr: '٢٬٥٠٠٬٠٠٠٬٠٠٠ ل.س',
          },
          orders: {
            current: 15420,
            previousPeriod: 13890,
            growthRate: 11.0,
            trend: 'up',
            target: 18000,
            targetAchievement: 85.7,
            nameEn: 'Total Orders',
            nameAr: 'إجمالي الطلبات',
            unit: 'orders',
            formatAr: '١٥٬٤٢٠ طلب',
          },
          users: {
            current: 8750,
            previousPeriod: 8200,
            growthRate: 6.7,
            trend: 'up',
            target: 10000,
            targetAchievement: 87.5,
            nameEn: 'Active Users',
            nameAr: 'المستخدمون النشطون',
            unit: 'users',
            formatAr: '٨٬٧٥٠ مستخدم',
          },
        },
        summaryCards: [
          {
            titleEn: 'Market Growth',
            titleAr: 'نمو السوق',
            value: '12.5%',
            valueAr: '١٢٫٥٪',
            status: 'positive',
            icon: 'trending-up',
            color: 'green',
          },
          {
            titleEn: 'KYC Compliance',
            titleAr: 'الامتثال للتحقق',
            value: '71.5%',
            valueAr: '٧١٫٥٪',
            status: 'warning',
            icon: 'shield-check',
            color: 'orange',
          },
        ],
        period: {
          start: '2025-07-01T00:00:00.000Z',
          end: '2025-08-09T23:59:59.000Z',
          type: 'month',
          nameEn: 'This Month',
          nameAr: 'هذا الشهر',
        },
      },
    },
  })
  async getKpiDashboard(
    @CurrentUser() user: UserFromToken,
    @Query() query: KpiDashboardQueryDto,
  ) {
    this.logger.log(`User ${user.id} requesting KPI dashboard`);

    // In a real implementation, this would use the analytics service
    // to calculate actual KPIs based on the query parameters

    return {
      kpis: {
        revenue: {
          current: 2500000000,
          previousPeriod: 2200000000,
          growthRate: 13.6,
          trend: 'up' as const,
          target: 2800000000,
          targetAchievement: 89.3,
          nameEn: 'Total Revenue',
          nameAr: 'إجمالي الإيرادات',
          unit: 'SYP',
          formatAr: '٢٬٥٠٠٬٠٠٠٬٠٠٠ ل.س',
        },
        orders: {
          current: 15420,
          previousPeriod: 13890,
          growthRate: 11.0,
          trend: 'up' as const,
          target: 18000,
          targetAchievement: 85.7,
          nameEn: 'Total Orders',
          nameAr: 'إجمالي الطلبات',
          unit: 'orders',
          formatAr: '١٥٬٤٢٠ طلب',
        },
        users: {
          current: 8750,
          previousPeriod: 8200,
          growthRate: 6.7,
          trend: 'up' as const,
          target: 10000,
          targetAchievement: 87.5,
          nameEn: 'Active Users',
          nameAr: 'المستخدمون النشطون',
          unit: 'users',
          formatAr: '٨٬٧٥٠ مستخدم',
        },
      },
      summaryCards: [
        {
          titleEn: 'Market Growth',
          titleAr: 'نمو السوق',
          value: '12.5%',
          valueAr: '١٢٫٥٪',
          status: 'positive' as const,
          icon: 'trending-up',
          color: 'green',
        },
        {
          titleEn: 'KYC Compliance',
          titleAr: 'الامتثال للتحقق',
          value: '71.5%',
          valueAr: '٧١٫٥٪',
          status: 'warning' as const,
          icon: 'shield-check',
          color: 'orange',
        },
      ],
      period: {
        start: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ).toISOString(),
        end: new Date().toISOString(),
        type: query.timePeriod || 'month',
        nameEn: 'This Month',
        nameAr: 'هذا الشهر',
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        categories: query.kpiCategories || [
          'revenue',
          'orders',
          'users',
          'vendors',
        ],
        includeGrowthRates: query.includeGrowthRates !== false,
        language: query.language || 'both',
      },
    };
  }

  /**
   * MARKET TRENDS ANALYSIS
   *
   * Syrian market trends with seasonal analysis and forecasting
   */
  @Get('market-trends')
  @ApiOperation({
    summary: 'Get market trends analysis',
    description:
      'Comprehensive Syrian market trends analysis including seasonal patterns, product trends, user behavior, and economic indicators',
  })
  @ApiQuery({
    name: 'analysisPeriodinMonths',
    required: false,
    type: Number,
    description: 'Analysis period in months',
    example: 6,
  })
  @ApiQuery({
    name: 'includeSeasonalTrends',
    required: false,
    type: Boolean,
    description: 'Include seasonal trend analysis',
    example: true,
  })
  @ApiQuery({
    name: 'includeForecast',
    required: false,
    type: Boolean,
    description: 'Include forecasting predictions',
    example: false,
  })
  @ApiOkResponse({
    description: 'Market trends analysis retrieved successfully',
    schema: {
      example: {
        seasonalTrends: {
          currentSeason: 'summer',
          seasonalImpact: 15.2,
          topSeasonalCategories: ['Electronics', 'Home & Garden'],
          expectedGrowth: 12.8,
        },
        productTrends: {
          trendingCategories: [
            {
              categoryId: 1,
              nameEn: 'Electronics',
              nameAr: 'الإلكترونيات',
              growthRate: 25.3,
              orderVolume: 5420,
            },
          ],
          decliningCategories: [
            {
              categoryId: 15,
              nameEn: 'Books',
              nameAr: 'الكتب',
              declineRate: -8.2,
              actionRecommended: 'Consider promotional campaigns',
            },
          ],
        },
        userBehaviorAnalytics: {
          averageSessionTime: 285,
          bounceRate: 35.2,
          conversionFunnel: {
            visitors: 10000,
            productViews: 7500,
            cartAdditions: 2100,
            checkouts: 850,
            completedOrders: 650,
          },
        },
        economicIndicators: {
          sypExchangeRate: 15000,
          inflationImpact: 8.5,
          purchasingPowerIndex: 72,
          economicSentiment: 'neutral',
          recommendedPricing: {
            adjustmentPercentage: 5,
            reasoning: 'Consider slight price increase due to inflation',
            reasoningAr: 'النظر في زيادة طفيفة في الأسعار بسبب التضخم',
          },
        },
      },
    },
  })
  async getMarketTrends(
    @CurrentUser() user: UserFromToken,
    @Query() query: MarketTrendsQueryDto,
  ) {
    this.logger.log(`User ${user.id} requesting market trends analysis`);

    const trends = await this.analyticsService.getSyrianMarketTrends();

    return {
      ...trends,
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisPeriodinMonths: query.analysisPeriodinMonths || 6,
        includeSeasonalTrends: query.includeSeasonalTrends !== false,
        includeForecast: query.includeForecast === true,
        focusGovernorates: query.focusGovernorates || [],
      },
    };
  }

  /**
   * EXPORT ANALYTICS REPORT
   *
   * Generate and export comprehensive analytics reports
   */
  @Post('export-report')
  @ApiOperation({
    summary: 'Export analytics report',
    description:
      'Generate comprehensive analytics report in PDF, Excel, or JSON format with Arabic/English localization',
  })
  @ApiBody({
    type: GenerateReportDto,
    description: 'Report generation parameters',
    examples: {
      pdfReport: {
        summary: 'Generate PDF Report',
        value: {
          format: 'pdf',
          language: 'both',
          sections: ['market_overview', 'business_intelligence', 'trends'],
          includeCharts: true,
          titleEn: 'SouqSyria Monthly Market Report',
          titleAr: 'تقرير السوق الشهري - سوق سوريا',
          emailRecipients: ['admin@souqsyria.com'],
          priority: 'normal',
        },
      },
      excelReport: {
        summary: 'Generate Excel Report',
        value: {
          format: 'excel',
          language: 'en',
          sections: ['market_overview', 'kyc_analytics'],
          includeCharts: false,
          recurringSchedule: 'weekly',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Report generation initiated successfully',
    schema: {
      example: {
        reportId: 'RPT-2025-08-09-001',
        status: 'generating',
        estimatedCompletion: '2025-08-09T15:15:00.000Z',
        downloadUrl:
          'https://storage.souqsyria.com/reports/analytics-1691592000.pdf',
        reportDetails: {
          format: 'pdf',
          language: 'both',
          sections: ['market_overview', 'business_intelligence', 'trends'],
          estimatedSize: '2.5 MB',
          expiresAt: '2025-08-16T15:00:00.000Z',
        },
        notification: {
          messageEn:
            'Report generation started. You will be notified when ready.',
          messageAr: 'بدأ إنشاء التقرير. سيتم إشعارك عند الانتهاء.',
          emailSent: true,
          recipients: ['admin@souqsyria.com'],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid report parameters',
  })
  async exportAnalyticsReport(
    @CurrentUser() user: UserFromToken,
    @Body() reportDto: GenerateReportDto,
  ) {
    this.logger.log(
      `User ${user.id} generating analytics report: ${reportDto.format} (${reportDto.language})`,
    );

    const report = await this.analyticsService.exportAnalyticsReport(
      reportDto.format,
      reportDto.language,
    );

    const reportId = `RPT-${new Date().toISOString().split('T')[0]}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    return {
      reportId,
      status: 'generating' as const,
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      downloadUrl: report.reportUrl,
      reportDetails: {
        format: reportDto.format,
        language: reportDto.language,
        sections: reportDto.sections || [
          'market_overview',
          'business_intelligence',
        ],
        estimatedSize: `${Math.round((report.reportSize / 1024 / 1024) * 10) / 10} MB`,
        expiresAt: report.expiresAt.toISOString(),
      },
      notification: {
        messageEn:
          'Report generation started. You will be notified when ready.',
        messageAr: 'بدأ إنشاء التقرير. سيتم إشعارك عند الانتهاء.',
        emailSent: !!(
          reportDto.emailRecipients && reportDto.emailRecipients.length > 0
        ),
        recipients: reportDto.emailRecipients || [],
      },
    };
  }

  /**
   * PERFORMANCE MONITORING
   *
   * System and business performance monitoring with alerts
   */
  @Get('performance-monitoring')
  @ApiOperation({
    summary: 'Get performance monitoring data',
    description:
      'System and business performance monitoring with real-time metrics, alerts, and historical comparisons',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['system', 'business', 'user_experience', 'all'],
    description: 'Monitoring scope',
    example: 'all',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['minute', 'hour', 'day'],
    description: 'Metric granularity',
    example: 'hour',
  })
  @ApiOkResponse({
    description: 'Performance monitoring data retrieved successfully',
    schema: {
      example: {
        systemMetrics: {
          apiResponseTime: 145,
          databaseConnections: 85,
          memoryUsage: 72.5,
          cpuUsage: 45.2,
          diskUsage: 58.9,
          cacheHitRate: 89.2,
          errorRate: 0.3,
          uptime: 99.98,
        },
        businessMetrics: {
          ordersPerMinute: 12.5,
          revenuePerHour: 125000,
          activeUserSessions: 450,
          conversionRate: 3.2,
          averageOrderValue: 162162.16,
          cartAbandonmentRate: 68.5,
        },
        alerts: [
          {
            id: 'ALT-001',
            type: 'system',
            severity: 'warning',
            messageEn: 'Database response time increased',
            messageAr: 'زاد وقت استجابة قاعدة البيانات',
            timestamp: '2025-08-09T14:55:00.000Z',
            resolved: false,
            actionRequired: true,
          },
        ],
        trends: {
          last24Hours: {
            averageResponseTime: 142,
            errorCount: 12,
            successfulRequests: 45680,
          },
          weekOverWeek: {
            responseTimeChange: -3.2,
            errorRateChange: 0.1,
            trafficChange: 15.8,
          },
        },
      },
    },
  })
  async getPerformanceMonitoring(
    @CurrentUser() user: UserFromToken,
    @Query() query: PerformanceMonitoringQueryDto,
  ) {
    this.logger.log(`User ${user.id} requesting performance monitoring data`);

    // In a real implementation, this would fetch actual performance data
    return {
      systemMetrics: {
        apiResponseTime: 145,
        databaseConnections: 85,
        memoryUsage: 72.5,
        cpuUsage: 45.2,
        diskUsage: 58.9,
        cacheHitRate: 89.2,
        errorRate: 0.3,
        uptime: 99.98,
      },
      businessMetrics: {
        ordersPerMinute: 12.5,
        revenuePerHour: 125000,
        activeUserSessions: 450,
        conversionRate: 3.2,
        averageOrderValue: 162162.16,
        cartAbandonmentRate: 68.5,
      },
      alerts: [
        {
          id: 'ALT-001',
          type: 'system' as const,
          severity: 'warning' as const,
          messageEn: 'Database response time increased',
          messageAr: 'زاد وقت استجابة قاعدة البيانات',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          resolved: false,
          actionRequired: true,
        },
      ],
      trends: {
        last24Hours: {
          averageResponseTime: 142,
          errorCount: 12,
          successfulRequests: 45680,
        },
        weekOverWeek: {
          responseTimeChange: -3.2,
          errorRateChange: 0.1,
          trafficChange: 15.8,
        },
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        scope: query.scope || 'all',
        granularity: query.granularity || 'hour',
        alertThreshold: query.alertThreshold || 'warning',
      },
    };
  }
}

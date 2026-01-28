/**
 * @file syrian-stock-analytics.controller.ts
 * @description Syrian Stock Analytics Management Controller
 *
 * ENTERPRISE FEATURES:
 * - Comprehensive stock analytics with Syrian governorate integration
 * - Multi-currency inventory reporting (SYP/USD/EUR)
 * - Advanced demand forecasting and performance analytics
 * - Real-time dashboard with Arabic/English localization
 * - Governorate-specific insights and recommendations
 * - Alert management and automated notifications
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

// Services
import { SyrianStockAnalyticsService } from '../services/syrian-stock-analytics.service';

// Types and Interfaces
import {
  SyrianStockDashboard,
  GovernorateStockPerformance,
  StockForecast,
} from '../services/syrian-stock-analytics.service';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

// Common Types
import { User } from '../../users/entities/user.entity';

/**
 * Dashboard Query DTO
 */
export class StockDashboardQueryDto {
  startDate?: string;
  endDate?: string;
  language?: 'en' | 'ar' | 'both' = 'ar';
  currency?: 'SYP' | 'USD' | 'EUR' = 'SYP';
  includeForecasting?: boolean = true;
  includeAlerts?: boolean = true;
}

/**
 * Governorate Performance Query DTO
 */
export class GovernoratePerformanceQueryDto {
  startDate?: string;
  endDate?: string;
  language?: 'en' | 'ar' = 'ar';
  includeRecommendations?: boolean = true;
  includeHistoricalData?: boolean = false;
}

/**
 * Stock Forecast Query DTO
 */
export class StockForecastQueryDto {
  variantIds: number[];
  forecastDays?: number = 30;
  language?: 'en' | 'ar' = 'ar';
  includeRiskFactors?: boolean = true;
  includeSeasonality?: boolean = true;
}

/**
 * Syrian Stock Analytics Controller
 * Provides comprehensive stock analytics and business intelligence
 */
@ApiTags('📊 Syrian Stock Analytics')
@Controller('stock/syrian-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SyrianStockAnalyticsController {
  private readonly logger = new Logger(SyrianStockAnalyticsController.name);

  constructor(
    private readonly stockAnalyticsService: SyrianStockAnalyticsService,
  ) {}

  // ========================================
  // DASHBOARD AND OVERVIEW APIs
  // ========================================

  /**
   * Get comprehensive Syrian stock dashboard
   */
  @Get('dashboard')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'operations_manager',
  )
  @ApiOperation({
    summary: 'Syrian Stock Analytics Dashboard',
    description:
      'Get comprehensive stock analytics dashboard with governorate breakdown, performance metrics, and forecasting',
  })
  @ApiOkResponse({
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalInventoryValueSyp: { type: 'number', example: 1250000000 },
            totalInventoryValueUsd: { type: 'number', example: 83333.33 },
            totalInventoryValueEur: { type: 'number', example: 75757.58 },
            totalProducts: { type: 'number', example: 15430 },
            totalWarehouses: { type: 'number', example: 8 },
            averageTurnoverRate: { type: 'number', example: 4.2 },
            stockAvailabilityRate: { type: 'number', example: 96.8 },
            criticalStockItems: { type: 'number', example: 127 },
          },
        },
        governorateBreakdown: { type: 'array' },
        performanceMetrics: { type: 'object' },
        alertsSummary: { type: 'object' },
        demandForecasting: { type: 'object' },
        financialMetrics: { type: 'object' },
        topPerformers: { type: 'array' },
        bottomPerformers: { type: 'array' },
      },
    },
  })
  @ApiQuery({ type: StockDashboardQueryDto })
  async getStockDashboard(
    @Query() query: StockDashboardQueryDto,
  ): Promise<SyrianStockDashboard> {
    this.logger.log(
      `Generating stock dashboard with params: ${JSON.stringify(query)}`,
    );

    // Default date range to last 30 days if not provided
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    try {
      const dashboard =
        await this.stockAnalyticsService.getSyrianStockDashboard(
          startDate,
          endDate,
          query.language || 'ar',
        );

      return dashboard;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate stock dashboard: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get stock overview summary
   */
  @Get('overview')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'operations_manager',
    'business_analyst',
  )
  @ApiOperation({
    summary: 'Stock Overview Summary',
    description:
      'Get high-level stock metrics and KPIs for executive dashboard',
  })
  @ApiOkResponse({
    description: 'Overview data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalValueSyp: { type: 'number', example: 1250000000 },
        totalValueFormatted: { type: 'string', example: '١٬٢٥٠٬٠٠٠٬٠٠٠ ل.س' },
        totalProducts: { type: 'number', example: 15430 },
        totalWarehouses: { type: 'number', example: 8 },
        governoratesServed: { type: 'number', example: 14 },
        overallHealthScore: { type: 'number', example: 89.2 },
        alertsCount: { type: 'number', example: 234 },
        criticalAlertsCount: { type: 'number', example: 12 },
        performanceDistribution: {
          type: 'object',
          properties: {
            excellent: { type: 'number' },
            good: { type: 'number' },
            average: { type: 'number' },
            poor: { type: 'number' },
            critical: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiQuery({ name: 'language', enum: ['en', 'ar', 'both'], required: false })
  @ApiQuery({ name: 'currency', enum: ['SYP', 'USD', 'EUR'], required: false })
  async getStockOverview(
    @Query('language') language: 'en' | 'ar' | 'both' = 'ar',
    @Query('currency') currency: 'SYP' | 'USD' | 'EUR' = 'SYP',
  ): Promise<any> {
    this.logger.log(
      `Generating stock overview in ${language} currency ${currency}`,
    );

    const endDate = new Date();
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    try {
      const dashboard =
        await this.stockAnalyticsService.getSyrianStockDashboard(
          startDate,
          endDate,
          language,
        );

      return {
        totalValueSyp: dashboard.overview.totalInventoryValueSyp,
        totalValueFormatted: this.formatCurrency(
          dashboard.overview.totalInventoryValueSyp,
          currency,
          language === 'ar',
        ),
        totalProducts: dashboard.overview.totalProducts,
        totalWarehouses: dashboard.overview.totalWarehouses,
        governoratesServed: dashboard.governorateBreakdown.length,
        overallHealthScore:
          dashboard.performanceMetrics.overallPerformanceScore,
        alertsCount: dashboard.alertsSummary.totalActiveAlerts,
        criticalAlertsCount:
          dashboard.alertsSummary.criticalStockCount +
          dashboard.alertsSummary.outOfStockCount,
        performanceDistribution: {
          excellent: dashboard.performanceMetrics.excellentCount,
          good: dashboard.performanceMetrics.goodCount,
          average: dashboard.performanceMetrics.averageCount,
          poor: dashboard.performanceMetrics.poorCount,
          critical: dashboard.performanceMetrics.criticalCount,
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to generate stock overview: ${(error as Error).message}`);
      throw error;
    }
  }

  // ========================================
  // GOVERNORATE-SPECIFIC ANALYTICS
  // ========================================

  /**
   * Get all governorates stock performance
   */
  @Get('governorates')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'operations_manager',
  )
  @ApiOperation({
    summary: 'All Governorates Stock Performance',
    description: 'Get stock performance metrics for all Syrian governorates',
  })
  @ApiOkResponse({
    description: 'Governorates performance retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          governorateId: { type: 'number', example: 1 },
          governorateNameEn: { type: 'string', example: 'Damascus' },
          governorateNameAr: { type: 'string', example: 'دمشق' },
          totalValueSyp: { type: 'number', example: 450000000 },
          performanceScore: { type: 'number', example: 92.5 },
          stockAvailabilityRate: { type: 'number', example: 96.8 },
          alertCount: { type: 'number', example: 23 },
          criticalItems: { type: 'number', example: 3 },
        },
      },
    },
  })
  @ApiQuery({ type: GovernoratePerformanceQueryDto })
  async getAllGovernoratesPerformance(
    @Query() query: GovernoratePerformanceQueryDto,
  ): Promise<Partial<GovernorateStockPerformance>[]> {
    this.logger.log(`Generating all governorates performance`);

    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const dashboard =
        await this.stockAnalyticsService.getSyrianStockDashboard(
          startDate,
          endDate,
          query.language,
        );

      // Transform dashboard data to governorate summary format
      return dashboard.governorateBreakdown.map((gov) => ({
        governorateId: gov.governorateId,
        governorateNameEn: gov.governorateNameEn,
        governorateNameAr: gov.governorateNameAr,
        totalValueSyp: gov.totalValueSyp,
        performanceScore: gov.performanceScore,
        alertCount: gov.alertCount,
        topPerformingProducts: gov.topPerformingProducts,
      }));
    } catch (error: unknown) {
      this.logger.error(
        `Failed to generate governorates performance: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get specific governorate stock performance
   */
  @Get('governorates/:governorateId')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'operations_manager',
  )
  @ApiOperation({
    summary: 'Governorate Stock Performance',
    description:
      'Get detailed stock performance for a specific Syrian governorate with recommendations',
  })
  @ApiParam({
    name: 'governorateId',
    description: 'Syrian Governorate ID',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Governorate performance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        governorateId: { type: 'number', example: 1 },
        governorateNameEn: { type: 'string', example: 'Damascus' },
        governorateNameAr: { type: 'string', example: 'دمشق' },
        totalValueSyp: { type: 'number', example: 450000000 },
        performanceScore: { type: 'number', example: 92.5 },
        performanceCategory: { type: 'string', example: 'excellent' },
        turnoverRate: { type: 'number', example: 4.8 },
        stockAvailabilityRate: { type: 'number', example: 96.8 },
        demandFulfillmentRate: { type: 'number', example: 98.2 },
        averageDaysOfSupply: { type: 'number', example: 28.5 },
        alertCount: { type: 'number', example: 23 },
        criticalItems: { type: 'number', example: 3 },
        monthlyGrowthRate: { type: 'number', example: 5.2 },
        recommendations: { type: 'array' },
      },
    },
  })
  @ApiQuery({ type: GovernoratePerformanceQueryDto })
  async getGovernoratePerformance(
    @Param('governorateId', ParseIntPipe) governorateId: number,
    @Query() query: GovernoratePerformanceQueryDto,
  ): Promise<GovernorateStockPerformance> {
    this.logger.log(`Generating governorate ${governorateId} performance`);

    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
      const performance =
        await this.stockAnalyticsService.getGovernorateStockPerformance(
          governorateId,
          startDate,
          endDate,
          query.language || 'ar',
        );

      return performance;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to generate governorate ${governorateId} performance: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ========================================
  // FORECASTING AND PREDICTIONS
  // ========================================

  /**
   * Get stock forecast for specific products
   */
  @Post('forecast')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'purchasing_manager',
  )
  @ApiOperation({
    summary: 'Stock Demand Forecast',
    description:
      'Get demand forecast and reorder recommendations for specific product variants',
  })
  @ApiOkResponse({
    description: 'Stock forecast generated successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          variantId: { type: 'number', example: 12345 },
          productName: { type: 'string', example: 'Samsung Galaxy A54' },
          productNameAr: { type: 'string', example: 'سامسونج جالاكسي A54' },
          currentStock: { type: 'number', example: 45 },
          predictedDemand7Days: { type: 'number', example: 12 },
          predictedDemand30Days: { type: 'number', example: 52 },
          predictedStockoutDate: { type: 'string', format: 'date-time' },
          recommendedReorderQuantity: { type: 'number', example: 100 },
          recommendedReorderDate: { type: 'string', format: 'date-time' },
          confidenceLevel: { type: 'number', example: 87.5 },
          seasonalFactors: { type: 'object' },
          riskFactors: { type: 'array' },
        },
      },
    },
  })
  async getStockForecast(
    @Body() query: StockForecastQueryDto,
  ): Promise<StockForecast[]> {
    this.logger.log(
      `Generating stock forecast for ${query.variantIds.length} variants`,
    );

    if (!query.variantIds || query.variantIds.length === 0) {
      throw new BadRequestException('At least one variant ID is required');
    }

    if (query.variantIds.length > 100) {
      throw new BadRequestException(
        'Maximum 100 variants allowed per forecast request',
      );
    }

    try {
      const forecasts = await this.stockAnalyticsService.getStockForecast(
        query.variantIds,
        query.forecastDays || 30,
        query.language || 'ar',
      );

      return forecasts;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate stock forecast: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get products requiring urgent reorder
   */
  @Get('reorder-alerts')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'purchasing_manager',
  )
  @ApiOperation({
    summary: 'Urgent Reorder Alerts',
    description:
      'Get list of products that require urgent reordering based on current stock levels and demand forecast',
  })
  @ApiOkResponse({
    description: 'Reorder alerts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        criticalItems: {
          type: 'array',
          description: 'Products that are out of stock or critically low',
        },
        lowStockItems: {
          type: 'array',
          description: 'Products below minimum stock levels',
        },
        reorderRecommendations: {
          type: 'array',
          description: 'Products recommended for reordering based on forecasts',
        },
        totalItemsRequiringAction: { type: 'number', example: 45 },
        estimatedTotalCostSyp: { type: 'number', example: 15750000 },
      },
    },
  })
  @ApiQuery({
    name: 'governorateId',
    required: false,
    description: 'Filter by governorate',
  })
  @ApiQuery({
    name: 'warehouseId',
    required: false,
    description: 'Filter by warehouse',
  })
  @ApiQuery({ name: 'language', enum: ['en', 'ar'], required: false })
  async getReorderAlerts(
    @Query('governorateId') governorateId?: number,
    @Query('warehouseId') warehouseId?: number,
    @Query('language') language: 'en' | 'ar' = 'ar',
  ): Promise<any> {
    this.logger.log(
      `Generating reorder alerts for governorate ${governorateId}, warehouse ${warehouseId}`,
    );

    try {
      // This would be implemented in the service
      // For now, returning a structured response
      return {
        criticalItems: [],
        lowStockItems: [],
        reorderRecommendations: [],
        totalItemsRequiringAction: 0,
        estimatedTotalCostSyp: 0,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to generate reorder alerts: ${(error as Error).message}`);
      throw error;
    }
  }

  // ========================================
  // PERFORMANCE ANALYTICS
  // ========================================

  /**
   * Get top and bottom performing products
   */
  @Get('performance/products')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'business_analyst',
  )
  @ApiOperation({
    summary: 'Product Performance Analytics',
    description:
      'Get top and bottom performing products based on various metrics',
  })
  @ApiOkResponse({
    description: 'Product performance retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        topPerformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'number' },
              productName: { type: 'string' },
              productNameAr: { type: 'string' },
              performanceScore: { type: 'number' },
              turnoverRate: { type: 'number' },
              totalValueSyp: { type: 'number' },
              stockAvailabilityRate: { type: 'number' },
            },
          },
        },
        bottomPerformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'number' },
              productName: { type: 'string' },
              productNameAr: { type: 'string' },
              performanceScore: { type: 'number' },
              daysOfSupply: { type: 'number' },
              recommendedAction: { type: 'string' },
              issues: { type: 'array' },
            },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit results per category',
    example: 20,
  })
  @ApiQuery({
    name: 'governorateId',
    required: false,
    description: 'Filter by governorate',
  })
  @ApiQuery({ name: 'language', enum: ['en', 'ar'], required: false })
  async getProductPerformance(
    @Query('limit') limit: number = 20,
    @Query('governorateId') governorateId?: number,
    @Query('language') language: 'en' | 'ar' = 'ar',
  ): Promise<any> {
    this.logger.log(
      `Generating product performance analytics with limit ${limit}`,
    );

    if (limit > 100) {
      throw new BadRequestException('Maximum limit is 100');
    }

    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const dashboard =
        await this.stockAnalyticsService.getSyrianStockDashboard(
          startDate,
          endDate,
          language,
        );

      return {
        topPerformers: dashboard.topPerformers.slice(0, limit),
        bottomPerformers: dashboard.bottomPerformers.slice(0, limit),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to generate product performance: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get warehouse performance comparison
   */
  @Get('performance/warehouses')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'operations_manager',
  )
  @ApiOperation({
    summary: 'Warehouse Performance Comparison',
    description: 'Compare performance metrics across all warehouses',
  })
  @ApiOkResponse({
    description: 'Warehouse performance retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          warehouseId: { type: 'number', example: 1 },
          warehouseName: {
            type: 'string',
            example: 'Damascus Central Warehouse',
          },
          warehouseNameAr: { type: 'string', example: 'مستودع دمشق المركزي' },
          governorate: { type: 'string', example: 'Damascus' },
          governorateAr: { type: 'string', example: 'دمشق' },
          totalValueSyp: { type: 'number', example: 350000000 },
          productCount: { type: 'number', example: 8540 },
          performanceScore: { type: 'number', example: 94.2 },
          turnoverRate: { type: 'number', example: 5.1 },
          stockAvailabilityRate: { type: 'number', example: 97.8 },
          alertCount: { type: 'number', example: 12 },
          criticalAlertCount: { type: 'number', example: 2 },
          capacity: { type: 'number', example: 85.5 },
          efficiency: { type: 'number', example: 92.3 },
        },
      },
    },
  })
  @ApiQuery({ name: 'includeInactive', type: Boolean, required: false })
  @ApiQuery({ name: 'language', enum: ['en', 'ar'], required: false })
  async getWarehousePerformance(
    @Query('includeInactive') includeInactive: boolean = false,
    @Query('language') language: 'en' | 'ar' = 'ar',
  ): Promise<any[]> {
    this.logger.log(`Generating warehouse performance comparison`);

    try {
      // This would be implemented in the service to analyze warehouse performance
      // For now, returning placeholder data
      return [];
    } catch (error: unknown) {
      this.logger.error(
        `Failed to generate warehouse performance: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ========================================
  // ALERTS AND NOTIFICATIONS
  // ========================================

  /**
   * Get all active stock alerts
   */
  @Get('alerts')
  @Roles('admin', 'super_admin', 'warehouse_manager', 'inventory_manager')
  @ApiOperation({
    summary: 'Active Stock Alerts',
    description:
      'Get all active stock alerts with filtering and prioritization',
  })
  @ApiOkResponse({
    description: 'Alerts retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alertId: { type: 'string' },
              type: {
                type: 'string',
                enum: [
                  'low_stock',
                  'out_of_stock',
                  'overstock',
                  'slow_moving',
                  'expiry_warning',
                ],
              },
              severity: {
                type: 'string',
                enum: ['info', 'warning', 'critical'],
              },
              message: { type: 'string' },
              messageAr: { type: 'string' },
              productName: { type: 'string' },
              warehouseName: { type: 'string' },
              governorate: { type: 'string' },
              currentStock: { type: 'number' },
              threshold: { type: 'number' },
              triggeredAt: { type: 'string', format: 'date-time' },
              estimatedStockoutDate: { type: 'string', format: 'date-time' },
              recommendedAction: { type: 'string' },
            },
          },
        },
        summary: {
          type: 'object',
          properties: {
            totalAlerts: { type: 'number' },
            criticalAlerts: { type: 'number' },
            warningAlerts: { type: 'number' },
            infoAlerts: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiQuery({
    name: 'severity',
    enum: ['info', 'warning', 'critical'],
    required: false,
  })
  @ApiQuery({
    name: 'type',
    enum: [
      'low_stock',
      'out_of_stock',
      'overstock',
      'slow_moving',
      'expiry_warning',
    ],
    required: false,
  })
  @ApiQuery({ name: 'governorateId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'language', enum: ['en', 'ar'], required: false })
  async getActiveAlerts(
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('governorateId') governorateId?: number,
    @Query('warehouseId') warehouseId?: number,
    @Query('language') language: 'en' | 'ar' = 'ar',
  ): Promise<any> {
    this.logger.log(
      `Retrieving active alerts with filters: severity=${severity}, type=${type}`,
    );

    try {
      // This would be implemented in the service
      return {
        alerts: [],
        summary: {
          totalAlerts: 0,
          criticalAlerts: 0,
          warningAlerts: 0,
          infoAlerts: 0,
        },
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to retrieve alerts: ${(error as Error).message}`);
      throw error;
    }
  }

  // ========================================
  // UTILITY AND LOOKUP APIs
  // ========================================

  /**
   * Get available Syrian governorates with stock data
   */
  @Get('lookup/governorates')
  @Roles(
    'admin',
    'super_admin',
    'warehouse_manager',
    'inventory_manager',
    'operations_manager',
  )
  @ApiOperation({
    summary: 'Available Governorates',
    description: 'Get list of Syrian governorates with stock data available',
  })
  @ApiOkResponse({
    description: 'Governorates retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          governorateId: { type: 'number', example: 1 },
          nameEn: { type: 'string', example: 'Damascus' },
          nameAr: { type: 'string', example: 'دمشق' },
          warehouseCount: { type: 'number', example: 3 },
          productCount: { type: 'number', example: 12540 },
          hasActiveAlerts: { type: 'boolean', example: true },
        },
      },
    },
  })
  @ApiQuery({ name: 'language', enum: ['en', 'ar', 'both'], required: false })
  async getAvailableGovernorates(
    @Query('language') language: 'en' | 'ar' | 'both' = 'both',
  ): Promise<any[]> {
    this.logger.log(`Retrieving available governorates for stock analytics`);

    try {
      // This would be implemented to get governorates with stock data
      return [];
    } catch (error: unknown) {
      this.logger.error(`Failed to retrieve governorates: ${(error as Error).message}`);
      throw error;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private formatCurrency(
    amount: number,
    currency: string,
    useArabicNumerals: boolean = false,
  ): string {
    let formatted = amount.toLocaleString();

    if (useArabicNumerals) {
      formatted = this.toArabicNumerals(formatted);
    }

    switch (currency) {
      case 'USD':
        return `$${formatted}`;
      case 'EUR':
        return `€${formatted}`;
      case 'SYP':
      default:
        return useArabicNumerals ? `${formatted} ل.س` : `${formatted} SYP`;
    }
  }

  private toArabicNumerals(num: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  }
}

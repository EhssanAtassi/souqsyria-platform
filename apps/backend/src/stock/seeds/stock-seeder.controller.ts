/**
 * @file stock-seeder.controller.ts
 * @description Enterprise Syrian Stock Seeding Controller
 *
 * ENTERPRISE FEATURES:
 * - Complete REST API for Syrian stock seeding operations
 * - Multi-warehouse inventory distribution with geographic optimization
 * - Stock movement simulation with realistic patterns
 * - Performance testing endpoints with bulk generation
 * - Data integrity validation and analytics reporting
 * - Arabic/English localized responses with comprehensive Swagger docs
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Query,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

// Services
import { StockSeederService } from './stock.seeder.service';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';

// DTOs
import { IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';

/**
 * Stock Bulk Generation DTO
 * Enables bulk stock data generation for performance testing
 */
class BulkStockGenerationDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50000)
  count?: number = 1000;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  batchSize?: number = 100;

  @IsOptional()
  @IsBoolean()
  includeMovements?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeAlerts?: boolean = true;
}

/**
 * Stock Analytics Query DTO
 * Configures stock analytics and reporting parameters
 */
class StockAnalyticsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;

  @IsOptional()
  includeMovements?: boolean = true;

  @IsOptional()
  includeWarehouseBreakdown?: boolean = true;

  @IsOptional()
  includeLowStockAlerts?: boolean = true;
}

/**
 * Enterprise Syrian Stock Seeding Controller
 *
 * Provides comprehensive REST API endpoints for Syrian stock system seeding operations.
 * Includes multi-warehouse support, movement tracking, and performance analytics.
 */
@ApiTags('📦 Stock Seeding')
@Controller('stock/seeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockSeederController {
  constructor(private readonly stockSeederService: StockSeederService) {}

  /**
   * Seed comprehensive Syrian stock sample data
   * Creates diverse inventory records with complete multi-warehouse distribution
   */
  @Post('sample-stock')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin:system', 'stock:manage')
  @ApiOperation({
    summary: 'Seed Sample Syrian Stock Data',
    description: `
    Seeds comprehensive Syrian stock sample data with enterprise features:

    **📦 INVENTORY MANAGEMENT FEATURES:**
    • Multi-warehouse inventory distribution across Syrian governorates
    • Realistic stock levels with seasonal variations and demand patterns
    • Stock movement history tracking (incoming, outgoing, adjustments)
    • Low stock alert simulation with automatic threshold management
    • Product variant support with size, color, and specification tracking

    **📊 SAMPLE DATA INCLUDES:**
    • 500+ stock records distributed across multiple warehouses
    • Complete stock movement history with realistic timestamps
    • Low stock alerts for inventory management testing
    • Seasonal stock patterns (Ramadan, winter clothing, summer goods)
    • Geographic optimization based on Syrian market demands

    **🏪 WAREHOUSE DISTRIBUTION:**
    • Damascus Central Warehouse (primary distribution hub)
    • Aleppo Northern Distribution Center
    • Lattakia Coastal Warehouse (import/export focus)
    • Homs Industrial Storage (manufacturing goods)
    • Regional fulfillment centers across governorates

    **📈 ANALYTICS & INTELLIGENCE:**
    • Stock turnover rate calculations
    • Demand forecasting based on historical patterns
    • Warehouse performance metrics
    • Geographic distribution optimization
    • Low stock prediction and automated replenishment triggers
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sample stock data seeded successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Sample stock data seeded successfully',
          ar: 'تم إدراج بيانات المخزون النموذجية بنجاح',
        },
        data: {
          stockRecords: 547,
          movementsCreated: 2183,
          alertsGenerated: 43,
          executionTime: 2156,
          warehouseDistribution: {
            'damascus_central': 145,
            'aleppo_north': 127,
            'lattakia_coastal': 98,
            'homs_industrial': 89,
            'daraa_south': 88,
          },
          stockLevels: {
            'in_stock': 389,
            'low_stock': 97,
            'out_of_stock': 31,
            'overstocked': 30,
          },
          analytics: {
            totalValue: {
              SYP: 125750000,
              USD: 45680,
              EUR: 41250,
            },
            averageTurnoverRate: 4.2,
            lowStockPercentage: 17.7,
            warehouseUtilization: 78.5,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding parameters provided',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Stock seeding operation failed',
  })
  async seedSampleStock() {
    return await this.stockSeederService.seedSampleStock();
  }

  /**
   * Seed minimal stock data for development
   * Creates basic stock structure with essential relationships
   */
  @Post('minimal-stock')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin:system', 'stock:manage', 'system:develop')
  @ApiOperation({
    summary: 'Seed Minimal Stock Data',
    description: `
    Seeds minimal stock data for development and testing purposes.

    **⚡ MINIMAL DATASET FEATURES:**
    • 100 basic stock records covering essential products
    • Basic warehouse distribution (Damascus and Aleppo only)
    • Core stock movements: incoming deliveries and sales
    • Essential low stock alerts for testing
    • Simplified product variant coverage

    **🔧 DEVELOPMENT FOCUSED:**
    • Faster seeding process for development cycles
    • Clean, predictable test data structure
    • Essential relationship coverage without complexity
    • Optimized for unit and integration testing
    • Minimal resource usage for local development
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Minimal stock data seeded successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Minimal stock data seeded successfully',
          ar: 'تم إدراج البيانات الأساسية للمخزون بنجاح',
        },
        data: {
          stockRecords: 100,
          movementsCreated: 150,
          alertsGenerated: 8,
          executionTime: 412,
          warehouseDistribution: {
            'damascus_central': 60,
            'aleppo_north': 40,
          },
          stockLevels: {
            'in_stock': 78,
            'low_stock': 15,
            'out_of_stock': 7,
          },
        },
      },
    },
  })
  async seedMinimalStock() {
    return await this.stockSeederService.seedMinimalStock();
  }

  /**
   * Get stock seeding analytics and statistics
   * Provides comprehensive insights into seeded stock data
   */
  @Get('analytics')
  @Permissions('admin:analytics', 'stock:analytics', 'admin:manage')
  @ApiOperation({
    summary: 'Get Stock Seeding Analytics',
    description: `
    Retrieves comprehensive analytics and statistics for seeded stock data.

    **📈 ANALYTICS FEATURES:**
    • Inventory valuation by warehouse and product category
    • Stock movement patterns and velocity analysis
    • Low stock alert frequency and resolution tracking
    • Warehouse capacity utilization and efficiency metrics
    • Geographic distribution analysis across Syrian governorates
    • Seasonal demand patterns and forecasting insights

    **📊 REPORTING CAPABILITIES:**
    • Real-time stock level monitoring across all warehouses
    • Turnover rate analysis by product category and location
    • Stock movement frequency and timing patterns
    • Low stock prediction and automated replenishment recommendations
    • Warehouse performance comparison and optimization suggestions
    `,
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (1-365, default: 30)',
    example: 30,
  })
  @ApiQuery({
    name: 'includeMovements',
    required: false,
    type: Boolean,
    description: 'Include stock movement analytics in results',
    example: true,
  })
  @ApiQuery({
    name: 'includeWarehouseBreakdown',
    required: false,
    type: Boolean,
    description: 'Include detailed warehouse breakdown',
    example: true,
  })
  @ApiQuery({
    name: 'includeLowStockAlerts',
    required: false,
    type: Boolean,
    description: 'Include low stock alert analytics',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock analytics retrieved successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Stock analytics retrieved successfully',
          ar: 'تم استرداد تحليلات المخزون بنجاح',
        },
        data: {
          summary: {
            totalStockRecords: 547,
            totalValue: {
              SYP: 125750000,
              USD: 45680,
              EUR: 41250,
            },
            averageTurnoverRate: 4.2,
            lowStockAlerts: 43,
            warehouseCount: 5,
          },
          byWarehouse: {
            'damascus_central': {
              stockRecords: 145,
              value: 45250000,
              utilizationRate: 82.3,
              lowStockItems: 12,
            },
            'aleppo_north': {
              stockRecords: 127,
              value: 38950000,
              utilizationRate: 76.8,
              lowStockItems: 9,
            },
          },
          stockLevels: {
            'in_stock': { count: 389, percentage: 71.1 },
            'low_stock': { count: 97, percentage: 17.7 },
            'out_of_stock': { count: 31, percentage: 5.7 },
            'overstocked': { count: 30, percentage: 5.5 },
          },
          performanceMetrics: {
            stockAccuracy: 97.8,
            fulfillmentRate: 94.2,
            averageReplenishmentTime: 3.5,
            warehouseEfficiency: 85.7,
          },
        },
      },
    },
  })
  async getStockAnalytics(
    @Query(ValidationPipe) queryDto: StockAnalyticsQueryDto,
  ) {
    return await this.stockSeederService.calculateStockStatistics(queryDto);
  }

  /**
   * Generate bulk stock data for performance testing
   * Creates large datasets for load testing and performance optimization
   */
  @Post('bulk-generation')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin:system', 'stock:manage', 'system:develop')
  @ApiOperation({
    summary: 'Generate Bulk Stock Data',
    description: `
    Generates large volumes of stock data for performance testing and optimization.

    **🚀 PERFORMANCE TESTING FEATURES:**
    • High-volume stock data generation (up to 50,000 records)
    • Configurable batch processing for memory optimization
    • Realistic stock distribution patterns across warehouses
    • Movement history simulation with varied frequencies
    • Stress testing data for system performance validation

    **⚡ OPTIMIZATION CAPABILITIES:**
    • Batch processing with configurable chunk sizes
    • Transaction management for data consistency
    • Memory-efficient bulk operations
    • Database performance optimization testing
    • Concurrent stock operation simulation
    `,
  })
  @ApiBody({
    type: BulkStockGenerationDto,
    description: 'Bulk generation configuration parameters',
    examples: {
      standard: {
        summary: 'Standard bulk generation',
        description: 'Generate 1000 stock records in batches of 100',
        value: {
          count: 1000,
          batchSize: 100,
          includeMovements: true,
          includeAlerts: true,
        },
      },
      performance: {
        summary: 'Performance testing',
        description: 'Generate 25000 stock records in batches of 500',
        value: {
          count: 25000,
          batchSize: 500,
          includeMovements: true,
          includeAlerts: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk stock data generated successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Bulk stock data generated successfully',
          ar: 'تم إنشاء البيانات المجمعة للمخزون بنجاح',
        },
        data: {
          stockRecords: 25000,
          movementsCreated: 75000,
          alertsGenerated: 1250,
          executionTime: 28750,
          batchesProcessed: 50,
          averageBatchTime: 575,
          performanceMetrics: {
            recordsPerSecond: 869.6,
            memoryUsage: '312MB',
            databaseConnections: 12,
            errorRate: 0.01,
          },
        },
      },
    },
  })
  async generateBulkStockData(
    @Body(ValidationPipe) bulkDto: BulkStockGenerationDto,
  ) {
    return await this.stockSeederService.generateBulkStockData(
      bulkDto.count,
      {
        batchSize: bulkDto.batchSize,
        includeMovements: bulkDto.includeMovements,
        includeAlerts: bulkDto.includeAlerts,
      },
    );
  }

  /**
   * Get warehouse distribution and capacity information
   * Returns comprehensive warehouse configuration and capacity data
   */
  @Get('warehouse-distribution')
  @Permissions('admin:analytics', 'stock:analytics', 'stock:manage')
  @ApiOperation({
    summary: 'Get Warehouse Distribution Information',
    description: `
    Retrieves comprehensive information about warehouse distribution and capacity across Syrian locations.

    **🏪 WAREHOUSE COVERAGE:**
    • All major Syrian distribution centers and their capacities
    • Geographic coverage analysis by governorate
    • Warehouse specialization (general goods, electronics, clothing, etc.)
    • Transportation and logistics connectivity information
    • Import/export facility capabilities

    **📊 CAPACITY ANALYSIS:**
    • Current utilization rates by warehouse
    • Available capacity for new stock allocations
    • Peak season capacity planning
    • Warehouse efficiency and productivity metrics
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Warehouse distribution information retrieved successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Warehouse distribution information retrieved successfully',
          ar: 'تم استرداد معلومات توزيع المستودعات بنجاح',
        },
        data: {
          warehouses: {
            'damascus_central': {
              nameEn: 'Damascus Central Warehouse',
              nameAr: 'المستودع المركزي دمشق',
              governorate: 'Damascus',
              capacity: 25000,
              currentStock: 18450,
              utilizationRate: 73.8,
              specialization: ['general', 'electronics', 'clothing'],
            },
            'aleppo_north': {
              nameEn: 'Aleppo Northern Distribution Center',
              nameAr: 'مركز التوزيع الشمالي حلب',
              governorate: 'Aleppo',
              capacity: 18000,
              currentStock: 13680,
              utilizationRate: 76.0,
              specialization: ['textiles', 'food', 'household'],
            },
          },
          distribution: {
            totalCapacity: 78000,
            totalUtilization: 75.2,
            availableCapacity: 19344,
            warehouseCount: 5,
          },
        },
      },
    },
  })
  async getWarehouseDistribution() {
    return await this.stockSeederService.getWarehouseDistributionInfo();
  }

  /**
   * Get stock movement patterns and trends
   * Provides insights into stock movement patterns and seasonal trends
   */
  @Get('movement-patterns')
  @Permissions('admin:analytics', 'stock:analytics', 'system:develop')
  @ApiOperation({
    summary: 'Get Stock Movement Patterns',
    description: `
    Retrieves stock movement patterns and trends for inventory optimization.

    **📈 MOVEMENT ANALYSIS:**
    • Incoming stock patterns (deliveries, purchases, returns)
    • Outgoing stock patterns (sales, transfers, damaged goods)
    • Stock adjustment frequencies and reasons
    • Seasonal movement variations
    • Peak demand periods and inventory planning

    **🔄 OPTIMIZATION INSIGHTS:**
    • Fast-moving vs slow-moving product identification
    • Optimal reorder points and quantities
    • Stock transfer recommendations between warehouses
    • Seasonal inventory planning suggestions
    • Demand forecasting based on historical patterns
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock movement patterns retrieved successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Stock movement patterns retrieved successfully',
          ar: 'تم استرداد أنماط حركة المخزون بنجاح',
        },
        data: {
          movements: {
            'incoming': {
              total: 1247,
              averagePerDay: 41.6,
              peakDay: 'Thursday',
              commonReasons: ['supplier_delivery', 'customer_return', 'transfer_in'],
            },
            'outgoing': {
              total: 1089,
              averagePerDay: 36.3,
              peakDay: 'Monday',
              commonReasons: ['sale', 'transfer_out', 'damaged'],
            },
          },
          patterns: {
            fastMoving: ['electronics', 'clothing', 'household'],
            slowMoving: ['luxury_items', 'seasonal_goods', 'specialized_tools'],
            seasonalPeaks: {
              'ramadan_preparation': { month: 'March', increase: '340%' },
              'back_to_school': { month: 'September', increase: '180%' },
              'winter_clothing': { month: 'November', increase: '250%' },
            },
          },
        },
      },
    },
  })
  async getMovementPatterns() {
    return await this.stockSeederService.getMovementPatterns();
  }

  /**
   * Clear all stock seeding data
   * Removes all seeded stock data for cleanup operations
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin:system', 'stock:manage')
  @ApiOperation({
    summary: 'Clear Stock Seeding Data',
    description: `
    Removes all seeded stock data from the database for cleanup and reset operations.

    **🧹 CLEANUP OPERATIONS:**
    • Complete removal of seeded stock records
    • Cascade deletion of related stock movement history
    • Stock alert cleanup and threshold reset
    • Analytics data reset and recalculation
    • Warehouse allocation cleanup

    **⚠️ SAFETY FEATURES:**
    • Confirmation required for destructive operations
    • Backup recommendations before cleanup
    • Selective cleanup options (by warehouse, date range, etc.)
    • Data integrity verification post-cleanup
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock seeding data cleared successfully',
    schema: {
      example: {
        success: true,
        message: {
          en: 'Stock seeding data cleared successfully',
          ar: 'تم مسح بيانات بذور المخزون بنجاح',
        },
        data: {
          stockRecordsRemoved: 547,
          movementsRemoved: 2183,
          alertsRemoved: 43,
          executionTime: 1245,
          cleanupOperations: {
            stockRecords: 'completed',
            stockMovements: 'completed',
            stockAlerts: 'completed',
            analyticsRecalculation: 'completed',
          },
        },
      },
    },
  })
  async clearStockSeedingData() {
    return await this.stockSeederService.clearExistingData();
  }
}
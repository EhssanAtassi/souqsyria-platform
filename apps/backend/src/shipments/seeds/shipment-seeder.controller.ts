/**
 * @file shipment-seeder.controller.ts
 * @description REST API controller for Syrian shipment system seeding operations
 *
 * FEATURES:
 * - Comprehensive seeding endpoints for all shipment entities
 * - Bulk seeding operations for performance testing
 * - Data integrity verification and statistics
 * - Syrian localization support
 * - Complete Swagger documentation
 * - Enterprise-grade error handling and logging
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiHeader,
  ApiProperty,
} from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

import {
  ShipmentSeederService,
  ShipmentSeedingConfig,
  SeedingStats,
} from './shipment-seeder.service';

/**
 * DTO for seeding configuration
 */
export class SeedingConfigDto implements Partial<ShipmentSeedingConfig> {
  @ApiProperty({
    description: 'Seed Syrian shipping companies with full localization',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  syrianCompanies?: boolean;

  @ApiProperty({
    description: 'Seed legacy shipping companies for backward compatibility',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  legacyCompanies?: boolean;

  @ApiProperty({
    description: 'Seed sample shipments with realistic workflow data',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  sampleShipments?: boolean;

  @ApiProperty({
    description: 'Seed shipment status logs for workflow tracking',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  statusLogs?: boolean;

  @ApiProperty({
    description: 'Number of bulk shipments to create for performance testing',
    minimum: 0,
    maximum: 10000,
    default: 0,
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  bulkShipments?: number;

  @ApiProperty({
    description:
      'Enable performance testing mode with optimized bulk operations',
    default: false,
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  performanceTest?: boolean;
}

/**
 * Response DTO for seeding statistics
 */
export class SeedingStatsResponseDto implements SeedingStats {
  @ApiProperty({
    description: 'Number of Syrian shipping companies created',
    example: 2,
  })
  syrianCompaniesCreated: number;

  @ApiProperty({
    description: 'Number of legacy shipping companies created',
    example: 3,
  })
  legacyCompaniesCreated: number;

  @ApiProperty({
    description: 'Number of shipments created',
    example: 1502,
  })
  shipmentsCreated: number;

  @ApiProperty({
    description: 'Number of status logs created',
    example: 3,
  })
  statusLogsCreated: number;

  @ApiProperty({
    description: 'Total execution time in milliseconds',
    example: 2341,
  })
  totalExecutionTime: number;

  @ApiProperty({
    description: 'List of errors encountered during seeding',
    type: [String],
    example: [],
  })
  errors: string[];

  @ApiProperty({
    description: 'List of warnings encountered during seeding',
    type: [String],
    example: ['Some existing data was skipped'],
  })
  warnings: string[];
}

/**
 * Response DTO for data integrity verification
 */
export class DataIntegrityResponseDto {
  @ApiProperty({
    description: 'Whether data integrity check passed',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'List of integrity issues found',
    type: [String],
    example: [],
  })
  issues: string[];

  @ApiProperty({
    description: 'Summary of current data statistics',
    example: {
      overview: {
        syrianShippingCompanies: 2,
        legacyShippingCompanies: 3,
        totalShipments: 1500,
        statusLogs: 4500,
      },
      shipmentsByStatus: {
        created: 150,
        assigned_company: 200,
        picked_up: 300,
        out_for_delivery: 400,
        delivered: 450,
      },
    },
  })
  summary: any;
}

@ApiTags('🚚 Shipment Seeding')
@Controller('seed/shipments')
@ApiBearerAuth()
@ApiHeader({
  name: 'Accept-Language',
  description: 'Language preference (ar for Arabic, en for English)',
  required: false,
  schema: { type: 'string', default: 'en' },
})
export class ShipmentSeederController {
  private readonly logger = new Logger(ShipmentSeederController.name);

  constructor(private readonly shipmentSeederService: ShipmentSeederService) {}

  /**
   * Seed all shipment-related data with comprehensive configuration
   */
  @Post('all')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed all shipment system data',
    description: `
    🚀 **Comprehensive Shipment System Seeding**
    
    Seeds the complete Syrian shipment ecosystem with:
    - **Syrian shipping companies** with Arabic/English localization
    - **Legacy shipping companies** for backward compatibility  
    - **Sample shipments** with realistic 15-state workflow data
    - **Status logs** for complete audit trails
    - **Bulk shipments** for performance testing (optional)
    
    **Syrian Features:**
    - Full Arabic localization (company names, descriptions, status messages)
    - SYP currency integration with real pricing
    - Coverage areas for all 14 Syrian governorates
    - Local delivery services and working hours
    - Performance metrics and SLA tracking
    
    **Enterprise Capabilities:**
    - 15-state workflow management
    - Real-time tracking integration
    - Proof of delivery (signature, photo, OTP)
    - Multi-currency cost calculations
    - Advanced analytics and reporting
    `,
  })
  @ApiBody({
    type: SeedingConfigDto,
    description: 'Seeding configuration options',
    examples: {
      basic: {
        summary: 'Basic seeding (recommended)',
        value: {
          syrianCompanies: true,
          legacyCompanies: true,
          sampleShipments: true,
          statusLogs: true,
        },
      },
      performance: {
        summary: 'Performance testing setup',
        value: {
          syrianCompanies: true,
          legacyCompanies: true,
          sampleShipments: true,
          statusLogs: true,
          bulkShipments: 1000,
          performanceTest: true,
        },
      },
      minimal: {
        summary: 'Minimal seeding (companies only)',
        value: {
          syrianCompanies: true,
          legacyCompanies: true,
          sampleShipments: false,
          statusLogs: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Seeding completed successfully',
    type: SeedingStatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding configuration',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Seeding failed due to system error',
  })
  async seedAll(
    @Body() config: SeedingConfigDto = {},
  ): Promise<SeedingStatsResponseDto> {
    this.logger.log('🚀 Starting comprehensive shipment system seeding...');

    try {
      const startTime = Date.now();
      const stats = await this.shipmentSeederService.seedAll(config);

      this.logger.log(
        `✅ Shipment seeding completed in ${stats.totalExecutionTime}ms: ` +
          `${stats.syrianCompaniesCreated} Syrian companies, ` +
          `${stats.legacyCompaniesCreated} legacy companies, ` +
          `${stats.shipmentsCreated} shipments, ` +
          `${stats.statusLogsCreated} status logs`,
      );

      return stats;
    } catch (error: unknown) {
      this.logger.error('❌ Shipment seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed only Syrian shipping companies
   */
  @Post('syrian-companies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed Syrian shipping companies only',
    description: `
    🏢 **Syrian Shipping Companies Seeding**
    
    Creates comprehensive Syrian shipping companies with:
    - **Bilingual support** (Arabic/English names and descriptions)
    - **Local coverage areas** (all 14 Syrian governorates)
    - **SYP pricing structures** with realistic costs
    - **Performance metrics** and reliability scores
    - **Service types** (express, standard, motorcycle, etc.)
    - **Working schedules** adapted for Syrian business hours
    
    **Included Companies:**
    - Damascus Express Delivery (دمشق للتوصيل السريع)
    - Aleppo Speed Couriers (سرعة حلب للتوصيل)
    - Additional regional providers as needed
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Syrian shipping companies created successfully',
    schema: {
      example: {
        message: 'Syrian shipping companies seeded successfully',
        count: 2,
        companies: ['Damascus Express Delivery', 'Aleppo Speed Couriers'],
      },
    },
  })
  async seedSyrianCompanies() {
    const stats = await this.shipmentSeederService.seedAll({
      syrianCompanies: true,
      legacyCompanies: false,
      sampleShipments: false,
      statusLogs: false,
    });

    return {
      message: 'Syrian shipping companies seeded successfully',
      count: stats.syrianCompaniesCreated,
      executionTime: stats.totalExecutionTime,
    };
  }

  /**
   * Seed only legacy shipping companies
   */
  @Post('legacy-companies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed legacy shipping companies for backward compatibility',
    description: `
    🏬 **Legacy Shipping Companies Seeding**
    
    Creates backward-compatible shipping companies:
    - **DHL Express Syria** - International express delivery
    - **Aramex Syria** - Regional courier services
    - **Internal Delivery Team** - Platform's own delivery service
    
    These are maintained for existing integrations and gradual migration to Syrian providers.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Legacy shipping companies created successfully',
  })
  async seedLegacyCompanies() {
    const stats = await this.shipmentSeederService.seedAll({
      syrianCompanies: false,
      legacyCompanies: true,
      sampleShipments: false,
      statusLogs: false,
    });

    return {
      message: 'Legacy shipping companies seeded successfully',
      count: stats.legacyCompaniesCreated,
      executionTime: stats.totalExecutionTime,
    };
  }

  /**
   * Seed bulk shipments for performance testing
   */
  @Post('bulk-shipments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed bulk shipments for performance testing',
    description: `
    📈 **Bulk Shipments for Performance Testing**
    
    Creates large volumes of test shipments for:
    - **Load testing** database queries and APIs
    - **Performance benchmarking** of search and filtering
    - **Workflow testing** across different shipment states
    - **Analytics validation** with realistic data volumes
    
    **Features:**
    - Randomized shipment data (status, costs, packages)
    - Distributed across all workflow states
    - Realistic Syrian addresses and company assignments
    - Optimized bulk insert operations
    `,
  })
  @ApiQuery({
    name: 'count',
    description: 'Number of bulk shipments to create',
    type: Number,
    required: false,
    example: 1000,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk shipments created successfully',
  })
  async seedBulkShipments(@Query('count') count: string = '1000') {
    const shipmentCount = Math.min(parseInt(count, 10) || 1000, 10000); // Max 10k for safety

    const stats = await this.shipmentSeederService.seedAll({
      syrianCompanies: false,
      legacyCompanies: false,
      sampleShipments: false,
      statusLogs: false,
      bulkShipments: shipmentCount,
      performanceTest: true,
    });

    return {
      message: 'Bulk shipments seeded successfully',
      count: stats.shipmentsCreated,
      requestedCount: shipmentCount,
      executionTime: stats.totalExecutionTime,
    };
  }

  /**
   * Get current seeding statistics and data overview
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get shipment seeding statistics and data overview',
    description: `
    📊 **Comprehensive Seeding Statistics**
    
    Provides detailed overview of:
    - **Entity counts** (companies, shipments, status logs)
    - **Shipments by status** breakdown
    - **Data distribution** across workflow states
    - **System health** indicators
    
    Useful for monitoring seeded data and verifying completeness.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        overview: {
          syrianShippingCompanies: 2,
          legacyShippingCompanies: 3,
          totalShipments: 1502,
          statusLogs: 4506,
        },
        shipmentsByStatus: {
          created: 150,
          assigned_company: 200,
          picked_up: 300,
          out_for_delivery: 400,
          delivered: 452,
        },
        lastUpdated: '2025-08-20T10:30:00.000Z',
      },
    },
  })
  async getStats() {
    return await this.shipmentSeederService.getSeedingStats();
  }

  /**
   * Verify data integrity after seeding
   */
  @Get('verify')
  @ApiOperation({
    summary: 'Verify shipment data integrity',
    description: `
    🔍 **Data Integrity Verification**
    
    Performs comprehensive checks for:
    - **Orphaned shipments** without assigned companies
    - **Invalid tracking codes** or missing references
    - **Cost data completeness** for billing accuracy
    - **Workflow consistency** across status transitions
    
    **Health Checks:**
    - Referential integrity validation
    - Data completeness verification
    - Performance metrics analysis
    - System consistency checks
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Integrity verification completed',
    type: DataIntegrityResponseDto,
  })
  async verifyIntegrity(): Promise<DataIntegrityResponseDto> {
    this.logger.log('🔍 Verifying shipment data integrity...');

    const result = await this.shipmentSeederService.verifyDataIntegrity();

    if (result.isValid) {
      this.logger.log('✅ Data integrity verification passed');
    } else {
      this.logger.warn(
        `⚠️ Data integrity issues found: ${result.issues.length} problems`,
      );
    }

    return result;
  }

  /**
   * Clear all shipment data (DANGER: Use with extreme caution)
   */
  @Delete('clear-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '🚨 DANGER: Clear all shipment data',
    description: `
    ⚠️ **DESTRUCTIVE OPERATION - USE WITH EXTREME CAUTION**
    
    **This endpoint will permanently delete ALL shipment-related data:**
    - All Syrian shipping companies
    - All legacy shipping companies  
    - All shipments (including production data!)
    - All shipment status logs
    - All shipment items
    
    **⚠️ WARNING:** This action is irreversible and will cause data loss!
    
    **Recommended usage:**
    - Development environments only
    - Before major data migration
    - Clean slate testing scenarios
    
    **NOT recommended for:**
    - Production environments
    - Environments with real customer data
    - Regular maintenance operations
    `,
  })
  @ApiQuery({
    name: 'confirm',
    description: 'Confirmation flag (must be "YES_DELETE_ALL_DATA")',
    required: true,
    example: 'YES_DELETE_ALL_DATA',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'All shipment data cleared successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid confirmation or operation denied',
  })
  async clearAllData(@Query('confirm') confirm: string) {
    if (confirm !== 'YES_DELETE_ALL_DATA') {
      this.logger.warn('❌ Data clear attempt without proper confirmation');
      throw new Error(
        'Invalid confirmation. Use "YES_DELETE_ALL_DATA" to confirm.',
      );
    }

    this.logger.warn('🚨 CLEARING ALL SHIPMENT DATA - This is irreversible!');
    await this.shipmentSeederService.clearAllData();

    return {
      message: 'All shipment data cleared successfully',
      timestamp: new Date().toISOString(),
      warning: 'This action was irreversible',
    };
  }
}

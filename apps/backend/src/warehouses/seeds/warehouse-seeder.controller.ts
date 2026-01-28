/**
 * @file warehouse-seeder.controller.ts
 * @description Enterprise warehouse seeding REST API controller
 * Provides comprehensive warehouse initialization endpoints with Syrian geographic optimization
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
  ApiProperty,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  WarehouseSeederService,
  WarehouseSeedOptions,
  WarehouseSeedResult,
} from './warehouse-seeder.service';

/**
 * DTO for warehouse seeding configuration
 */
export class WarehouseSeedOptionsDto implements WarehouseSeedOptions {
  @ApiProperty({
    description: 'Include Damascus region warehouses',
    example: true,
    required: false,
  })
  includeDamascus?: boolean;

  @ApiProperty({
    description: 'Include Aleppo region warehouses',
    example: true,
    required: false,
  })
  includeAleppo?: boolean;

  @ApiProperty({
    description: 'Include Latakia region warehouses',
    example: true,
    required: false,
  })
  includeLatakia?: boolean;

  @ApiProperty({
    description: 'Include Homs region warehouses',
    example: true,
    required: false,
  })
  includeHoms?: boolean;

  @ApiProperty({
    description: 'Include Daraa region warehouses',
    example: true,
    required: false,
  })
  includeDaraa?: boolean;

  @ApiProperty({
    description: 'Include local depot warehouses',
    example: true,
    required: false,
  })
  includeLocalDepots?: boolean;

  @ApiProperty({
    description: 'Skip warehouses that already exist in database',
    example: true,
    required: false,
  })
  skipDuplicates?: boolean;

  @ApiProperty({
    description: 'Update existing warehouses with new data',
    example: false,
    required: false,
  })
  updateExisting?: boolean;

  @ApiProperty({
    description: 'Perform dry run without making database changes',
    example: false,
    required: false,
  })
  dryRun?: boolean;

  @ApiProperty({
    description: 'Number of warehouses to process in each batch',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  batchSize?: number;

  @ApiProperty({
    description: 'Filter by specific warehouse types',
    example: ['main_hub', 'regional_center'],
    enum: ['main_hub', 'regional_center', 'local_depot', 'specialized'],
    isArray: true,
    required: false,
  })
  specificTypes?: (
    | 'main_hub'
    | 'regional_center'
    | 'local_depot'
    | 'specialized'
  )[];

  @ApiProperty({
    description: 'Filter by specific Syrian governorates',
    example: ['Damascus', 'Aleppo'],
    isArray: true,
    required: false,
  })
  specificGovernorates?: string[];

  @ApiProperty({
    description: 'Minimum warehouse capacity in cubic meters',
    example: 1000,
    minimum: 0,
    required: false,
  })
  capacityRangeMin?: number;

  @ApiProperty({
    description: 'Maximum warehouse capacity in cubic meters',
    example: 50000,
    minimum: 0,
    required: false,
  })
  capacityRangeMax?: number;

  @ApiProperty({
    description: 'Only seed high priority warehouses',
    example: false,
    required: false,
  })
  onlyHighPriority?: boolean;

  @ApiProperty({
    description: 'Only seed warehouses established after this year',
    example: 2018,
    minimum: 2000,
    maximum: 2030,
    required: false,
  })
  establishedAfter?: number;

  @ApiProperty({
    description: 'Validate geographic coordinates and business rules',
    example: true,
    required: false,
  })
  validateGeography?: boolean;
}

/**
 * DTO for warehouse preview filters
 */
export class WarehousePreviewFiltersDto {
  @ApiProperty({
    description: 'Filter by Syrian region',
    example: 'damascus',
    enum: ['damascus', 'aleppo', 'latakia', 'homs', 'daraa', 'local'],
    required: false,
  })
  region?: string;

  @ApiProperty({
    description: 'Filter by warehouse type',
    example: 'main_hub',
    enum: ['main_hub', 'regional_center', 'local_depot', 'specialized'],
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'Minimum warehouse capacity',
    example: 1000,
    minimum: 0,
    required: false,
  })
  minCapacity?: number;

  @ApiProperty({
    description: 'Maximum warehouse capacity',
    example: 50000,
    minimum: 0,
    required: false,
  })
  maxCapacity?: number;

  @ApiProperty({
    description: 'Limit number of results',
    example: 10,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  limit?: number;
}

/**
 * DTO for warehouse cleanup options
 */
export class WarehouseCleanupOptionsDto {
  @ApiProperty({
    description: 'Only delete warehouses from seed data',
    example: true,
    required: false,
  })
  onlySeedData?: boolean;

  @ApiProperty({
    description:
      'Confirmation code for complete deletion (required if onlySeedData=false)',
    example: 'DELETE_ALL_WAREHOUSES',
    required: false,
  })
  confirmationCode?: string;

  @ApiProperty({
    description: 'Perform dry run to preview deletion',
    example: false,
    required: false,
  })
  dryRun?: boolean;

  @ApiProperty({
    description: 'Exclude active warehouses from deletion',
    example: true,
    required: false,
  })
  excludeActive?: boolean;
}

@ApiTags('🏢 Warehouse Seeding')
@Controller('warehouses/seeding')
@ApiBearerAuth()
export class WarehouseSeederController {
  private readonly logger = new Logger(WarehouseSeederController.name);

  constructor(
    private readonly warehouseSeederService: WarehouseSeederService,
  ) {}

  /**
   * Main warehouse seeding endpoint
   * Seed warehouses with comprehensive filtering and configuration options
   */
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed warehouses with comprehensive filtering',
    description:
      'Initialize Syrian warehouses with strategic locations, capacity management, and geographic optimization. Supports filtering by region, type, capacity, and priority level.',
  })
  @ApiBody({
    type: WarehouseSeedOptionsDto,
    description: 'Warehouse seeding configuration options',
    examples: {
      basic: {
        summary: 'Basic seeding - all regions',
        value: {
          includeDamascus: true,
          includeAleppo: true,
          includeLatakia: true,
          includeHoms: true,
          includeDaraa: true,
          includeLocalDepots: true,
          skipDuplicates: true,
          validateGeography: true,
        },
      },
      highPriorityOnly: {
        summary: 'High priority warehouses only',
        value: {
          includeDamascus: true,
          includeAleppo: true,
          includeLatakia: true,
          onlyHighPriority: true,
          specificTypes: ['main_hub', 'regional_center'],
          capacityRangeMin: 5000,
        },
      },
      dryRun: {
        summary: 'Dry run - preview changes',
        value: {
          includeDamascus: true,
          includeAleppo: true,
          dryRun: true,
          validateGeography: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse seeding completed successfully',
    schema: {
      example: {
        success: true,
        result: {
          success: true,
          totalProcessed: 8,
          created: 8,
          updated: 0,
          skipped: 0,
          errors: 0,
          processingTimeMs: 3200,
          statistics: {
            total: 8,
            damascus: 2,
            aleppo: 1,
            latakia: 1,
            homs: 1,
            daraa: 1,
            localDepots: 2,
          },
          performance: {
            averageTimePerWarehouse: 400,
            batchProcessingTime: 3200,
            dbOperationTime: 2800,
            validationTime: 400,
          },
          geography: {
            governoratesCovered: 6,
            totalCapacity: 65500,
            averageCapacity: 8187,
            coordinateValidation: '8/8 valid',
          },
        },
        message:
          'Seeding completed: 8 warehouses created, 0 updated, 0 skipped',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid seeding parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding',
  })
  async seedWarehouses(@Body() options: WarehouseSeedOptionsDto) {
    try {
      this.logger.log('Starting warehouse seeding with options', options);
      const result = await this.warehouseSeederService.seedWarehouses(options);

      return {
        success: true,
        result,
        message: `Seeding completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      };
    } catch (error: unknown) {
      this.logger.error('Warehouse seeding failed', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Validate warehouse data without creating records
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate warehouse data without creating records',
    description:
      'Validate warehouse seed data for geographic accuracy, business rules compliance, and data integrity without making any database changes.',
  })
  @ApiBody({
    type: WarehouseSeedOptionsDto,
    description: 'Validation configuration options',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed successfully',
    schema: {
      example: {
        success: true,
        result: {
          success: true,
          totalProcessed: 5,
          errors: 0,
          validationResults: {
            geographyCheck: 'passed',
            coordinateValidation: 'valid',
            businessRules: 'compliant',
          },
          statistics: {
            total: 5,
            damascus: 2,
            aleppo: 1,
            latakia: 1,
            homs: 1,
          },
        },
        message: 'Validation completed: 5 warehouses processed, 0 errors found',
      },
    },
  })
  async validateWarehouses(@Body() options: WarehouseSeedOptionsDto) {
    const result = await this.warehouseSeederService.seedWarehouses({
      ...options,
      dryRun: true,
      validateGeography: true,
    });

    return {
      success: true,
      result,
      message: `Validation completed: ${result.totalProcessed} warehouses processed, ${result.errors} errors found`,
    };
  }

  /**
   * Seed Damascus region warehouses only
   */
  @Post('seed/damascus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed Damascus region warehouses',
    description:
      'Initialize warehouses specifically in Damascus and Rif Dimashq governorates, including the main distribution hub and regional centers.',
  })
  @ApiResponse({
    status: 200,
    description: 'Damascus warehouses seeded successfully',
  })
  async seedDamascusWarehouses() {
    const result = await this.warehouseSeederService.seedDamascusWarehouses();
    return {
      success: true,
      result,
      message: `Damascus seeding completed: ${result.created} warehouses created`,
    };
  }

  /**
   * Seed Aleppo region warehouses only
   */
  @Post('seed/aleppo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed Aleppo region warehouses',
    description:
      'Initialize warehouses in Aleppo governorate, focusing on northern Syria distribution and textile storage facilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Aleppo warehouses seeded successfully',
  })
  async seedAleppowWarehouses() {
    const result = await this.warehouseSeederService.seedAleppowWarehouses();
    return {
      success: true,
      result,
      message: `Aleppo seeding completed: ${result.created} warehouses created`,
    };
  }

  /**
   * Seed Latakia region warehouses only
   */
  @Post('seed/latakia')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed Latakia region warehouses',
    description:
      'Initialize coastal warehouses in Latakia governorate with port connectivity and import/export processing capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Latakia warehouses seeded successfully',
  })
  async seedLatakiaWarehouses() {
    const result = await this.warehouseSeederService.seedLatakiaWarehouses();
    return {
      success: true,
      result,
      message: `Latakia seeding completed: ${result.created} warehouses created`,
    };
  }

  /**
   * Seed Homs region warehouses only
   */
  @Post('seed/homs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed Homs region warehouses',
    description:
      'Initialize central Syria warehouses in Homs governorate for cross-country distribution and agricultural product storage.',
  })
  @ApiResponse({
    status: 200,
    description: 'Homs warehouses seeded successfully',
  })
  async seedHomsWarehouses() {
    const result = await this.warehouseSeederService.seedHomsWarehouses();
    return {
      success: true,
      result,
      message: `Homs seeding completed: ${result.created} warehouses created`,
    };
  }

  /**
   * Seed Daraa region warehouses only
   */
  @Post('seed/daraa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed Daraa region warehouses',
    description:
      'Initialize southern border warehouses in Daraa governorate for cross-border trade and regional distribution.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daraa warehouses seeded successfully',
  })
  async seedDaraaWarehouses() {
    const result = await this.warehouseSeederService.seedDaraaWarehouses();
    return {
      success: true,
      result,
      message: `Daraa seeding completed: ${result.created} warehouses created`,
    };
  }

  /**
   * Seed local depot warehouses only
   */
  @Post('seed/local-depots')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed local depot warehouses',
    description:
      'Initialize smaller local depot warehouses for specialized regional distribution and local market supply.',
  })
  @ApiResponse({
    status: 200,
    description: 'Local depot warehouses seeded successfully',
  })
  async seedLocalDepots() {
    const result = await this.warehouseSeederService.seedLocalDepots();
    return {
      success: true,
      result,
      message: `Local depots seeding completed: ${result.created} warehouses created`,
    };
  }

  /**
   * Get comprehensive warehouse seeding statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get warehouse seeding statistics',
    description:
      'Retrieve comprehensive statistics comparing seed data with current database state, including capacity analysis and geographic coverage.',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          seedData: {
            total: 8,
            damascus: 2,
            aleppo: 1,
            latakia: 1,
            homs: 1,
            daraa: 1,
            localDepots: 2,
            totalCapacity: 65500,
            averageCapacity: 8187,
            governoratesCovered: 6,
          },
          database: {
            totalWarehouses: 5,
          },
          comparison: {
            seedingProgress: 62.5,
            missingFromDb: 3,
            completionRate: 62.5,
          },
        },
        message:
          'Database contains 5 warehouses out of 8 available in seed data',
      },
    },
  })
  async getWarehouseStatistics() {
    const data = await this.warehouseSeederService.getWarehouseStatistics();
    return {
      success: true,
      data,
      message: `Database contains ${data.database.totalWarehouses} warehouses out of ${data.seedData.total} available in seed data`,
    };
  }

  /**
   * Get warehouse seed data information
   */
  @Get('data/info')
  @ApiOperation({
    summary: 'Get warehouse seed data information',
    description:
      'Retrieve detailed information about available warehouse seed data including regional breakdown, capacity analysis, and facility types.',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse data information retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          total: 8,
          damascus: 2,
          aleppo: 1,
          latakia: 1,
          homs: 1,
          daraa: 1,
          localDepots: 2,
          totalCapacity: 65500,
          averageCapacity: 8187,
          governoratesCovered: 6,
          regions: {
            damascus: [
              { name: 'Damascus Central Distribution Hub', capacity: 15000 },
              { name: 'Rif Dimashq Regional Center', capacity: 8000 },
            ],
            aleppo: [
              { name: 'Aleppo Northern Distribution Center', capacity: 12000 },
            ],
          },
        },
        message: '8 warehouses available for seeding across 6 governorates',
      },
    },
  })
  async getWarehouseDataInfo() {
    const data = await this.warehouseSeederService.getWarehouseDataInfo();
    return {
      success: true,
      data,
      message: `${data.total} warehouses available for seeding across ${data.governoratesCovered} governorates`,
    };
  }

  /**
   * Preview warehouses that would be seeded
   */
  @Get('warehouses/preview')
  @ApiOperation({
    summary: 'Preview warehouses for seeding',
    description:
      'Preview warehouse data that would be seeded based on specified filters without making any database changes.',
  })
  @ApiQuery({
    name: 'region',
    required: false,
    description: 'Filter by Syrian region',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by warehouse type',
  })
  @ApiQuery({
    name: 'minCapacity',
    required: false,
    description: 'Minimum capacity filter',
  })
  @ApiQuery({
    name: 'maxCapacity',
    required: false,
    description: 'Maximum capacity filter',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of results',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse preview retrieved successfully',
    schema: {
      example: {
        success: true,
        warehouses: [
          {
            name: 'Damascus Central Distribution Hub',
            nameAr: 'مركز دمشق المركزي للتوزيع',
            city: 'Damascus',
            cityAr: 'دمشق',
            governorate: 'Damascus',
            governorateAr: 'دمشق',
            warehouseType: 'main_hub',
            capacity: 15000,
            latitude: 33.5138,
            longitude: 36.2765,
            priorityLevel: 'high',
            establishedYear: 2018,
          },
        ],
        statistics: {
          total: 1,
          regionDistribution: { Damascus: 1 },
          typeDistribution: { main_hub: 1 },
        },
        message: 'Found 1 warehouses matching the specified criteria',
      },
    },
  })
  async getWarehousePreview(@Query() filters: WarehousePreviewFiltersDto) {
    const result =
      await this.warehouseSeederService.getWarehousePreview(filters);
    return {
      success: true,
      ...result,
      message: `Found ${result.warehouses.length} warehouses matching the specified criteria`,
    };
  }

  /**
   * Health check for warehouse seeding service
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for warehouse seeding service',
    description:
      'Check the health and operational status of the warehouse seeding service including database connectivity and data integrity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed successfully',
    schema: {
      example: {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: 'valid',
        geographyValidation: 'valid',
        statistics: {
          totalWarehousesInDb: 5,
          seedDataAvailable: 8,
          processingTime: 1658847000000,
        },
        lastCheck: '2025-08-15T14:30:00.000Z',
        message: 'Warehouse seeding service is healthy and operational',
      },
    },
  })
  async healthCheck() {
    const health = await this.warehouseSeederService.healthCheck();
    return {
      ...health,
      message:
        health.status === 'healthy'
          ? 'Warehouse seeding service is healthy and operational'
          : 'Warehouse seeding service has issues',
    };
  }

  /**
   * Clean up seeded warehouses
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clean up seeded warehouses',
    description:
      'Remove seeded warehouses from the database with safety controls. By default, only removes warehouses created from seed data.',
  })
  @ApiQuery({
    name: 'onlySeedData',
    required: false,
    description: 'Only delete warehouses from seed data',
  })
  @ApiQuery({
    name: 'confirmationCode',
    required: false,
    description: 'Confirmation code for complete deletion',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    description: 'Preview deletion without making changes',
  })
  @ApiQuery({
    name: 'excludeActive',
    required: false,
    description: 'Exclude active warehouses from deletion',
  })
  @ApiResponse({
    status: 200,
    description: 'Warehouse cleanup completed successfully',
    schema: {
      example: {
        success: true,
        deletedCount: 8,
        processingTimeMs: 500,
        deletedWarehouses: [
          {
            id: 1,
            name: 'Damascus Central Distribution Hub',
            city: 'Damascus',
          },
        ],
        message: 'Successfully deleted 8 warehouses',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid cleanup parameters or missing confirmation',
  })
  async cleanupWarehouses(@Query() options: WarehouseCleanupOptionsDto) {
    const result = await this.warehouseSeederService.cleanupWarehouses(options);
    return {
      success: true,
      ...result,
      message: result.deletedCount
        ? `Successfully deleted ${result.deletedCount} warehouses`
        : 'No warehouses were deleted',
    };
  }
}

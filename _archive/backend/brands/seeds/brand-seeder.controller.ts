/**
 * @file brand-seeder.controller.ts
 * @description Enterprise Brand Seeding Controller for SouqSyria Platform
 *
 * SEEDING ENDPOINTS:
 * - Comprehensive brand seeding with advanced options
 * - Category-specific seeding (Syrian, Regional, International)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Performance monitoring and analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  BrandSeederService,
  BrandSeedOptions,
  BrandSeedResult,
} from './brand-seeder.service';
import { BRAND_STATISTICS } from './brand-seeds.data';

/**
 * DTO Classes for API Documentation and Validation
 */

/**
 * Brand Seeding Options DTO
 */
export class BrandSeedOptionsDto implements BrandSeedOptions {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeSyrian?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeRegional?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeInternational?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  clearExisting?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  batchSize?: number = 50;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  validateOnly?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  skipDuplicates?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  updateExisting?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((country) => country.trim());
    }
    return value;
  })
  specificCountries?: string[] = [];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minPopularityScore?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxPopularityScore?: number = 100;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlyVerified?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  dryRun?: boolean = false;
}

/**
 * Cleanup Options DTO
 */
export class BrandCleanupOptionsDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlySeedData?: boolean = true;

  @IsOptional()
  @IsString()
  confirmationCode?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  dryRun?: boolean = false;
}

/**
 * ✅ BRAND SEEDER CONTROLLER: Comprehensive API endpoints for brand seeding
 */
@ApiTags('🌱 Brand Seeding')
@Controller('brands/seeding')
@UseGuards() // Add your authentication guards here
@ApiBearerAuth()
export class BrandSeederController {
  private readonly logger = new Logger(BrandSeederController.name);

  constructor(private readonly brandSeederService: BrandSeederService) {}

  /**
   * ✅ SEED ALL BRANDS: Main seeding endpoint with comprehensive options
   */
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed brands with comprehensive options',
    description: `
      Comprehensive brand seeding with advanced filtering and processing options.
      
      **Features:**
      - Support for Syrian, Regional, and International brands
      - Batch processing for optimal performance  
      - Duplicate detection and conflict resolution
      - Transaction safety with rollback on errors
      - Dry run capability for testing
      - Performance monitoring and analytics
      
      **Brand Categories:**
      - Syrian: ${BRAND_STATISTICS.syrian} local brands
      - Regional: ${BRAND_STATISTICS.regional} Middle Eastern brands  
      - International: ${BRAND_STATISTICS.international} global brands
      - Total Available: ${BRAND_STATISTICS.total} brands
    `,
  })
  @ApiBody({
    description: 'Seeding options and filters',
    type: BrandSeedOptionsDto,
    examples: {
      'Default Seeding': {
        summary: 'Seed all brand types with default options',
        value: {
          includeSyrian: true,
          includeRegional: true,
          includeInternational: true,
          batchSize: 50,
          skipDuplicates: true,
        },
      },
      'Syrian Only': {
        summary: 'Seed only Syrian brands',
        value: {
          includeSyrian: true,
          includeRegional: false,
          includeInternational: false,
          clearExisting: false,
        },
      },
      'High-Quality Brands': {
        summary: 'Seed only highly popular verified brands',
        value: {
          minPopularityScore: 85,
          onlyVerified: true,
          batchSize: 25,
        },
      },
      'Dry Run': {
        summary: 'Test seeding without making changes',
        value: {
          dryRun: true,
          validateOnly: false,
          batchSize: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Brand seeding completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Brand seeding completed successfully',
        },
        result: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            totalProcessed: { type: 'number', example: 45 },
            created: { type: 'number', example: 32 },
            updated: { type: 'number', example: 8 },
            skipped: { type: 'number', example: 5 },
            errors: { type: 'number', example: 0 },
            processingTimeMs: { type: 'number', example: 2150 },
            statistics: {
              type: 'object',
              example: BRAND_STATISTICS,
            },
            performance: {
              type: 'object',
              properties: {
                averageTimePerBrand: { type: 'number', example: 47.8 },
                batchProcessingTime: { type: 'number', example: 2150 },
                dbOperationTime: { type: 'number', example: 1840 },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid seeding options or validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding',
  })
  async seedBrands(
    @Body(ValidationPipe) options: BrandSeedOptionsDto,
  ): Promise<{
    success: boolean;
    message: string;
    result: BrandSeedResult;
    timestamp: string;
  }> {
    const startTime = Date.now();

    this.logger.log(
      `🌱 Starting brand seeding with options: ${JSON.stringify(options)}`,
    );

    try {
      const result = await this.brandSeederService.seedBrands(options);
      const totalTime = Date.now() - startTime;

      this.logger.log(
        `✅ Brand seeding completed successfully in ${totalTime}ms`,
      );
      this.logger.log(
        `📊 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`,
      );

      return {
        success: true,
        message: options.dryRun
          ? 'Dry run completed successfully'
          : 'Brand seeding completed successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const totalTime = Date.now() - startTime;

      this.logger.error(
        `❌ Brand seeding failed after ${totalTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw error;
    }
  }

  /**
   * ✅ SEED SYRIAN BRANDS: Seed only Syrian brands
   */
  @Post('seed/syrian')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed Syrian brands only',
    description: `
      Seed only Syrian brands with local market focus.
      
      **Syrian Brands Available:** ${BRAND_STATISTICS.syrian}
      **Categories:** Food & Beverage, Textiles, Crafts, Electronics, Agriculture
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Syrian brands seeded successfully',
  })
  async seedSyrianBrands(): Promise<{
    success: boolean;
    message: string;
    result: BrandSeedResult;
  }> {
    this.logger.log('🇸🇾 Seeding Syrian brands...');

    const result = await this.brandSeederService.seedSyrianBrands();

    return {
      success: true,
      message: 'Syrian brands seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED REGIONAL BRANDS: Seed Middle Eastern brands
   */
  @Post('seed/regional')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed regional Middle Eastern brands',
    description: `
      Seed brands from the Middle East region (Turkey, Lebanon, Egypt, Jordan).
      
      **Regional Brands Available:** ${BRAND_STATISTICS.regional}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Regional brands seeded successfully',
  })
  async seedRegionalBrands(): Promise<{
    success: boolean;
    message: string;
    result: BrandSeedResult;
  }> {
    this.logger.log('🌍 Seeding regional brands...');

    const result = await this.brandSeederService.seedRegionalBrands();

    return {
      success: true,
      message: 'Regional brands seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED INTERNATIONAL BRANDS: Seed global brands
   */
  @Post('seed/international')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed international global brands',
    description: `
      Seed major international brands popular worldwide.
      
      **International Brands Available:** ${BRAND_STATISTICS.international}
      **Categories:** Technology, Automotive, Fashion, Consumer Goods, Food & Beverage
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'International brands seeded successfully',
  })
  async seedInternationalBrands(): Promise<{
    success: boolean;
    message: string;
    result: BrandSeedResult;
  }> {
    this.logger.log('🌎 Seeding international brands...');

    const result = await this.brandSeederService.seedInternationalBrands();

    return {
      success: true,
      message: 'International brands seeded successfully',
      result,
    };
  }

  /**
   * ✅ GET SEEDING STATISTICS: Comprehensive statistics about seed data and database
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get comprehensive seeding statistics',
    description: `
      Get detailed statistics about available seed data and current database state.
      
      **Includes:**
      - Seed data availability by category
      - Current database statistics  
      - Seeding progress and missing data analysis
      - Performance metrics and recommendations
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        seedData: {
          type: 'object',
          example: BRAND_STATISTICS,
        },
        database: {
          type: 'object',
          properties: {
            totalBrands: { type: 'number', example: 28 },
            syrianBrands: { type: 'number', example: 4 },
            verifiedBrands: { type: 'number', example: 22 },
            approvedBrands: { type: 'number', example: 25 },
            activeBrands: { type: 'number', example: 27 },
          },
        },
        comparison: {
          type: 'object',
          properties: {
            seedingProgress: { type: 'number', example: 62 },
            missingFromDb: { type: 'number', example: 17 },
            duplicatesInDb: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  async getSeedingStatistics(): Promise<{
    success: boolean;
    message: string;
    data: any;
    timestamp: string;
  }> {
    this.logger.log('📊 Retrieving seeding statistics...');

    const statistics = await this.brandSeederService.getSeedingStatistics();

    return {
      success: true,
      message: 'Statistics retrieved successfully',
      data: statistics,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ✅ VALIDATE SEED DATA: Validate seed data without making changes
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate seed data integrity',
    description: `
      Validate the integrity and quality of seed data without making any database changes.
      
      **Validation Checks:**
      - Required field validation
      - Data format validation
      - Duplicate detection
      - Business rule compliance
    `,
  })
  @ApiBody({
    description: 'Validation options',
    type: BrandSeedOptionsDto,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed successfully',
  })
  async validateSeedData(
    @Body(ValidationPipe) options: BrandSeedOptionsDto = {},
  ): Promise<{
    success: boolean;
    message: string;
    result: BrandSeedResult;
  }> {
    this.logger.log('🔍 Validating seed data...');

    const validationOptions = { ...options, validateOnly: true };
    const result = await this.brandSeederService.seedBrands(validationOptions);

    return {
      success: result.success,
      message: result.success
        ? 'Seed data validation passed'
        : 'Seed data validation failed',
      result,
    };
  }

  /**
   * ✅ CLEANUP BRANDS: Remove seeded brands
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cleanup seeded brands',
    description: `
      Remove brands that were created from seed data.
      
      **Safety Features:**
      - Only removes seed data brands by default
      - Requires confirmation code for complete deletion
      - Supports dry run for safe testing
      
      **Confirmation Code for Complete Deletion:** DELETE_ALL_BRANDS_CONFIRMED
    `,
  })
  @ApiQuery({
    name: 'onlySeedData',
    description: 'Only delete brands from seed data (safer)',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'confirmationCode',
    description: 'Required for complete deletion: DELETE_ALL_BRANDS_CONFIRMED',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'dryRun',
    description: 'Test deletion without making changes',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        deletedCount: { type: 'number' },
        processingTimeMs: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid cleanup options or missing confirmation code',
  })
  async cleanupBrands(
    @Query('onlySeedData') onlySeedData: boolean = true,
    @Query('confirmationCode') confirmationCode?: string,
    @Query('dryRun') dryRun: boolean = false,
  ): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    processingTimeMs: number;
    warning?: string;
  }> {
    this.logger.log(
      `🧹 Starting brand cleanup (onlySeedData: ${onlySeedData}, dryRun: ${dryRun})`,
    );

    const result = await this.brandSeederService.cleanupBrands({
      onlySeedData,
      confirmationCode,
      dryRun,
    });

    const message = dryRun
      ? `Dry run: Would delete ${result.deletedCount} brands`
      : `Successfully deleted ${result.deletedCount} brands`;

    const warning = !onlySeedData
      ? 'WARNING: Complete brand deletion performed'
      : undefined;

    return {
      success: result.success,
      message,
      deletedCount: result.deletedCount,
      processingTimeMs: result.processingTimeMs,
      warning,
    };
  }

  /**
   * ✅ HEALTH CHECK: Verify seeding service health
   */
  @Get('health')
  @ApiOperation({
    summary: 'Check seeding service health',
    description:
      'Verify database connectivity, seed data integrity, and service health.',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check completed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'unhealthy'] },
        database: { type: 'string', enum: ['connected', 'disconnected'] },
        seedDataIntegrity: { type: 'string', enum: ['valid', 'invalid'] },
        statistics: { type: 'object' },
        lastCheck: { type: 'string', format: 'date-time' },
      },
    },
  })
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    seedDataIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
    message: string;
  }> {
    this.logger.log('💚 Performing health check...');

    const health = await this.brandSeederService.healthCheck();

    return {
      ...health,
      message:
        health.status === 'healthy'
          ? 'Brand seeding service is healthy'
          : 'Brand seeding service has issues',
    };
  }

  /**
   * ✅ GET SEED DATA INFO: Get information about available seed data
   */
  @Get('data/info')
  @ApiOperation({
    summary: 'Get seed data information',
    description: `
      Get detailed information about available seed data without database operations.
      
      **Available Data:**
      - ${BRAND_STATISTICS.total} total brands
      - ${BRAND_STATISTICS.syrian} Syrian brands  
      - ${BRAND_STATISTICS.regional} Regional brands
      - ${BRAND_STATISTICS.international} International brands
      - ${BRAND_STATISTICS.verified} Verified brands
      - Average popularity score: ${BRAND_STATISTICS.averagePopularityScore}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seed data information retrieved successfully',
  })
  getSeedDataInfo(): {
    success: boolean;
    message: string;
    data: typeof BRAND_STATISTICS;
    categories: {
      syrian: { count: number; description: string };
      regional: { count: number; description: string };
      international: { count: number; description: string };
    };
  } {
    return {
      success: true,
      message: 'Seed data information retrieved successfully',
      data: BRAND_STATISTICS,
      categories: {
        syrian: {
          count: BRAND_STATISTICS.syrian,
          description: 'Local Syrian brands with Arabic localization',
        },
        regional: {
          count: BRAND_STATISTICS.regional,
          description: 'Middle Eastern brands (Turkey, Lebanon, Egypt, Jordan)',
        },
        international: {
          count: BRAND_STATISTICS.international,
          description: 'Major global brands popular worldwide',
        },
      },
    };
  }
}

/**
 * @file membership-seeder.controller.ts
 * @description Enterprise Membership Seeding Controller for SouqSyria Platform
 *
 * SEEDING ENDPOINTS:
 * - Comprehensive membership seeding with tier-based creation
 * - Type-specific seeding (Basic, Premium, VIP, Enterprise, Special)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Performance monitoring and analytics
 * - Feature validation and business type filtering
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
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
  MembershipSeederService,
  MembershipSeedOptions,
  MembershipSeedResult,
} from './membership-seeder.service';
import {
  MEMBERSHIP_STATISTICS,
  ALL_MEMBERSHIP_SEEDS,
} from './membership-seeds.data';

/**
 * DTO Classes for API Documentation and Validation
 */

/**
 * Membership Seeding Options DTO
 */
export class MembershipSeedOptionsDto implements MembershipSeedOptions {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeBasic?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includePremium?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeVip?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeEnterprise?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeSpecial?: boolean = false;

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
  @Max(50)
  @Type(() => Number)
  batchSize?: number = 10;

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
      return value.split(',').map((type) => type.trim());
    }
    return value;
  })
  specificBusinessTypes?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((duration) => parseInt(duration.trim(), 10));
    }
    return value;
  })
  specificDurations?: number[] = [];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlyActive?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlyPopular?: boolean = false;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceRangeMin?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceRangeMax?: number = Number.MAX_SAFE_INTEGER;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((feature) => feature.trim());
    }
    return value;
  })
  specificFeatures?: string[] = [];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  dryRun?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  validateFeatures?: boolean = true;
}

/**
 * Cleanup Options DTO
 */
export class MembershipCleanupOptionsDto {
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

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  excludeActive?: boolean = true;
}

/**
 * ✅ MEMBERSHIP SEEDER CONTROLLER: Comprehensive API endpoints for membership seeding
 */
@ApiTags('🌱 Membership Seeding')
@Controller('memberships/seeding')
@UseGuards() // Add your authentication guards here
@ApiBearerAuth()
export class MembershipSeederController {
  private readonly logger = new Logger(MembershipSeederController.name);

  constructor(
    private readonly membershipSeederService: MembershipSeederService,
  ) {}

  /**
   * ✅ SEED ALL MEMBERSHIPS: Main seeding endpoint with comprehensive options
   */
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed memberships with comprehensive tier-based options',
    description: `
      Comprehensive membership seeding with advanced filtering and tier-based processing options.
      
      **Features:**
      - Tier-based membership creation (Basic, Premium, VIP, Enterprise, Special)
      - Syrian business model integration
      - Batch processing with transaction safety
      - Duplicate detection and conflict resolution
      - Dry run capability for testing
      - Performance monitoring and analytics
      - Feature validation and business type filtering
      
      **Membership Tiers:**
      - Basic: ${MEMBERSHIP_STATISTICS.basic} entry-level plans
      - Premium: ${MEMBERSHIP_STATISTICS.premium} growing business plans
      - VIP: ${MEMBERSHIP_STATISTICS.vip} high-volume seller plans
      - Enterprise: ${MEMBERSHIP_STATISTICS.enterprise} custom enterprise solutions
      - Special: ${MEMBERSHIP_STATISTICS.special} trial and promotional plans
      - Total Available: ${MEMBERSHIP_STATISTICS.total} memberships
    `,
  })
  @ApiBody({
    description: 'Seeding options and filters',
    type: MembershipSeedOptionsDto,
    examples: {
      'Default Seeding': {
        summary: 'Seed all membership types with default options',
        value: {
          includeBasic: true,
          includePremium: true,
          includeVip: true,
          includeEnterprise: true,
          includeSpecial: false,
          batchSize: 10,
          skipDuplicates: true,
          validateFeatures: true,
        },
      },
      'Basic Only': {
        summary: 'Seed only basic membership plans',
        value: {
          includeBasic: true,
          includePremium: false,
          includeVip: false,
          includeEnterprise: false,
          includeSpecial: false,
          specificBusinessTypes: ['individual'],
        },
      },
      'Business Focused': {
        summary: 'Seed premium and VIP for established businesses',
        value: {
          includeBasic: false,
          includePremium: true,
          includeVip: true,
          includeEnterprise: false,
          specificBusinessTypes: ['small_business', 'medium_business'],
          onlyActive: true,
        },
      },
      'Dry Run Test': {
        summary: 'Test membership seeding without making changes',
        value: {
          dryRun: true,
          validateFeatures: true,
          validateOnly: false,
          batchSize: 20,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Membership seeding completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Membership seeding completed successfully',
        },
        result: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            totalProcessed: { type: 'number', example: 12 },
            created: { type: 'number', example: 10 },
            updated: { type: 'number', example: 1 },
            skipped: { type: 'number', example: 1 },
            errors: { type: 'number', example: 0 },
            processingTimeMs: { type: 'number', example: 2150 },
            statistics: {
              type: 'object',
              example: MEMBERSHIP_STATISTICS,
            },
            performance: {
              type: 'object',
              properties: {
                averageTimePerMembership: { type: 'number', example: 85.5 },
                batchProcessingTime: { type: 'number', example: 2150 },
                dbOperationTime: { type: 'number', example: 1890 },
                validationTime: { type: 'number', example: 260 },
              },
            },
            features: {
              type: 'object',
              properties: {
                featuresProcessed: { type: 'number', example: 10 },
                featuresValidated: { type: 'number', example: 10 },
                featureValidationTime: { type: 'number', example: 150 },
                missingFeatures: { type: 'array', example: [] },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid seeding options or feature validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding',
  })
  async seedMemberships(
    @Body(ValidationPipe) options: MembershipSeedOptionsDto,
  ): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
    timestamp: string;
  }> {
    const startTime = Date.now();

    this.logger.log(
      `🌱 Starting membership seeding with options: ${JSON.stringify(options)}`,
    );

    try {
      const result =
        await this.membershipSeederService.seedMemberships(options);
      const totalTime = Date.now() - startTime;

      this.logger.log(
        `✅ Membership seeding completed successfully in ${totalTime}ms`,
      );
      this.logger.log(
        `📊 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`,
      );
      this.logger.log(
        `🔧 Features: ${result.features.featuresProcessed} processed, ${result.features.featuresValidated} validated`,
      );

      return {
        success: true,
        message: options.dryRun
          ? 'Dry run completed successfully'
          : 'Membership seeding completed successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;

      this.logger.error(
        `❌ Membership seeding failed after ${totalTime}ms: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  /**
   * ✅ SEED BASIC MEMBERSHIPS: Seed only basic membership plans
   */
  @Post('seed/basic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed basic membership plans only',
    description: `
      Seed only basic membership plans for individual sellers and small businesses.
      
      **Basic Plans:** Entry-level memberships with essential features
      **Target Audience:** Individual sellers, home-based businesses, craftspeople
      **Total Basic Plans:** ${MEMBERSHIP_STATISTICS.basic}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Basic memberships seeded successfully',
  })
  async seedBasicMemberships(): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
  }> {
    this.logger.log('💡 Seeding basic membership plans...');

    const result = await this.membershipSeederService.seedBasicMemberships();

    return {
      success: true,
      message: 'Basic membership plans seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED PREMIUM MEMBERSHIPS: Seed premium membership plans
   */
  @Post('seed/premium')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed premium membership plans',
    description: `
      Seed premium membership plans for growing businesses with enhanced features.
      
      **Premium Plans:** Enhanced features for growing businesses
      **Target Audience:** Small to medium businesses, established online sellers
      **Total Premium Plans:** ${MEMBERSHIP_STATISTICS.premium}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Premium memberships seeded successfully',
  })
  async seedPremiumMemberships(): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
  }> {
    this.logger.log('⭐ Seeding premium membership plans...');

    const result = await this.membershipSeederService.seedPremiumMemberships();

    return {
      success: true,
      message: 'Premium membership plans seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED VIP MEMBERSHIPS: Seed VIP membership plans
   */
  @Post('seed/vip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed VIP membership plans',
    description: `
      Seed VIP membership plans for high-volume sellers and established brands.
      
      **VIP Plans:** Premium tier for high-volume sellers and established brands
      **Target Audience:** Large businesses, established brands, high-volume sellers
      **Total VIP Plans:** ${MEMBERSHIP_STATISTICS.vip}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'VIP memberships seeded successfully',
  })
  async seedVipMemberships(): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
  }> {
    this.logger.log('💎 Seeding VIP membership plans...');

    const result = await this.membershipSeederService.seedVipMemberships();

    return {
      success: true,
      message: 'VIP membership plans seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED ENTERPRISE MEMBERSHIPS: Seed enterprise membership plans
   */
  @Post('seed/enterprise')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed enterprise membership plans',
    description: `
      Seed enterprise membership plans for large-scale operations and custom solutions.
      
      **Enterprise Plans:** Custom enterprise solutions with unlimited features
      **Target Audience:** Large enterprises, government entities, major marketplace operators
      **Total Enterprise Plans:** ${MEMBERSHIP_STATISTICS.enterprise}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Enterprise memberships seeded successfully',
  })
  async seedEnterpriseMemberships(): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
  }> {
    this.logger.log('🏢 Seeding enterprise membership plans...');

    const result =
      await this.membershipSeederService.seedEnterpriseMemberships();

    return {
      success: true,
      message: 'Enterprise membership plans seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED SPECIAL MEMBERSHIPS: Seed special membership plans
   */
  @Post('seed/special')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed special membership plans',
    description: `
      Seed special membership plans including trial and promotional offers.
      
      **Special Plans:** Trial, student, and promotional membership plans
      **Target Audience:** New sellers, students, promotional campaigns
      **Total Special Plans:** ${MEMBERSHIP_STATISTICS.special}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Special memberships seeded successfully',
  })
  async seedSpecialMemberships(): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
  }> {
    this.logger.log('🎁 Seeding special membership plans...');

    const result = await this.membershipSeederService.seedSpecialMemberships();

    return {
      success: true,
      message: 'Special membership plans seeded successfully',
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
      - Seed data availability by tier and business type
      - Current database statistics with membership analysis
      - Seeding progress and missing data analysis
      - Performance metrics and recommendations
      - Feature integrity validation
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
          example: MEMBERSHIP_STATISTICS,
        },
        database: {
          type: 'object',
          properties: {
            totalMemberships: { type: 'number', example: 8 },
            activeMemberships: { type: 'number', example: 7 },
            popularMemberships: { type: 'number', example: 2 },
            monthlyMemberships: { type: 'number', example: 4 },
            yearlyMemberships: { type: 'number', example: 3 },
            basicMemberships: { type: 'number', example: 2 },
            premiumMemberships: { type: 'number', example: 2 },
            vipMemberships: { type: 'number', example: 2 },
            enterpriseMemberships: { type: 'number', example: 1 },
          },
        },
        comparison: {
          type: 'object',
          properties: {
            seedingProgress: { type: 'number', example: 67 },
            missingFromDb: { type: 'number', example: 4 },
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

    const statistics =
      await this.membershipSeederService.getSeedingStatistics();

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
    summary: 'Validate seed data and feature integrity',
    description: `
      Validate the integrity and quality of seed data without making any database changes.
      
      **Validation Checks:**
      - Required field validation
      - Data format validation (prices, durations, etc.)
      - Duplicate detection (names, business types)
      - Feature existence validation
      - Business rule compliance
      - Syrian business feature compatibility
    `,
  })
  @ApiBody({
    description: 'Validation options',
    type: MembershipSeedOptionsDto,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed successfully',
  })
  async validateSeedData(
    @Body(ValidationPipe) options: MembershipSeedOptionsDto = {},
  ): Promise<{
    success: boolean;
    message: string;
    result: MembershipSeedResult;
  }> {
    this.logger.log('🔍 Validating seed data...');

    const validationOptions = { ...options, validateOnly: true };
    const result =
      await this.membershipSeederService.seedMemberships(validationOptions);

    return {
      success: result.success,
      message: result.success
        ? 'Seed data validation passed'
        : 'Seed data validation failed',
      result,
    };
  }

  /**
   * ✅ CLEANUP MEMBERSHIPS: Remove seeded memberships
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cleanup seeded memberships with safety controls',
    description: `
      Remove memberships that were created from seed data with proper safety measures.
      
      **Safety Features:**
      - Only removes seed data memberships by default
      - Requires confirmation code for complete deletion
      - Supports dry run for safe testing
      - Excludes active memberships by default for safety
      - Comprehensive logging and audit trails
      
      **Confirmation Code for Complete Deletion:** DELETE_ALL_MEMBERSHIPS_CONFIRMED
    `,
  })
  @ApiQuery({
    name: 'onlySeedData',
    description: 'Only delete memberships from seed data (safer)',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'confirmationCode',
    description:
      'Required for complete deletion: DELETE_ALL_MEMBERSHIPS_CONFIRMED',
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
  @ApiQuery({
    name: 'excludeActive',
    description: 'Exclude active memberships from deletion (recommended)',
    required: false,
    type: Boolean,
    example: true,
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
  async cleanupMemberships(
    @Query('onlySeedData') onlySeedData: boolean = true,
    @Query('confirmationCode') confirmationCode?: string,
    @Query('dryRun') dryRun: boolean = false,
    @Query('excludeActive') excludeActive: boolean = true,
  ): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    processingTimeMs: number;
    warning?: string;
  }> {
    this.logger.log(
      `🧹 Starting membership cleanup (onlySeedData: ${onlySeedData}, dryRun: ${dryRun}, excludeActive: ${excludeActive})`,
    );

    const result = await this.membershipSeederService.cleanupMemberships({
      onlySeedData,
      confirmationCode,
      dryRun,
      excludeActive,
    });

    const message = dryRun
      ? `Dry run: Would delete ${result.deletedCount} memberships`
      : `Successfully deleted ${result.deletedCount} memberships`;

    const warning = !onlySeedData
      ? 'WARNING: Complete membership deletion performed'
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
    summary: 'Check seeding service health and feature integrity',
    description:
      'Verify database connectivity, seed data integrity, feature structure, and service health.',
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
        featureIntegrity: { type: 'string', enum: ['valid', 'invalid'] },
        statistics: { type: 'object' },
        lastCheck: { type: 'string', format: 'date-time' },
      },
    },
  })
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    seedDataIntegrity: 'valid' | 'invalid';
    featureIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
    message: string;
  }> {
    this.logger.log('💚 Performing health check...');

    const health = await this.membershipSeederService.healthCheck();

    return {
      ...health,
      message:
        health.status === 'healthy'
          ? 'Membership seeding service is healthy'
          : 'Membership seeding service has issues',
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
      - ${MEMBERSHIP_STATISTICS.total} total memberships
      - ${MEMBERSHIP_STATISTICS.basic} basic membership plans
      - ${MEMBERSHIP_STATISTICS.premium} premium membership plans
      - ${MEMBERSHIP_STATISTICS.vip} VIP membership plans
      - ${MEMBERSHIP_STATISTICS.enterprise} enterprise membership plans
      - ${MEMBERSHIP_STATISTICS.special} special membership plans
      - ${MEMBERSHIP_STATISTICS.active} active membership plans
      - ${MEMBERSHIP_STATISTICS.popular} popular membership plans
      - ${MEMBERSHIP_STATISTICS.monthly} monthly membership plans
      - ${MEMBERSHIP_STATISTICS.yearly} yearly membership plans
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seed data information retrieved successfully',
  })
  getSeedDataInfo(): {
    success: boolean;
    message: string;
    data: typeof MEMBERSHIP_STATISTICS;
    membershipTiers: {
      basic: { count: number; description: string };
      premium: { count: number; description: string };
      vip: { count: number; description: string };
      enterprise: { count: number; description: string };
      special: { count: number; description: string };
    };
    businessTypes: {
      individual: { count: number; description: string };
      smallBusiness: { count: number; description: string };
      mediumBusiness: { count: number; description: string };
      enterpriseBusiness: { count: number; description: string };
    };
    features: {
      withTaxReporting: number;
      withGovernorateAnalytics: number;
      withMultiCurrency: number;
      withDiasporaTools: number;
      withApiAccess: number;
      withWhiteLabel: number;
    };
  } {
    return {
      success: true,
      message: 'Seed data information retrieved successfully',
      data: MEMBERSHIP_STATISTICS,
      membershipTiers: {
        basic: {
          count: MEMBERSHIP_STATISTICS.basic,
          description:
            'Entry-level memberships for individual sellers and small businesses',
        },
        premium: {
          count: MEMBERSHIP_STATISTICS.premium,
          description:
            'Enhanced features for growing businesses with moderate product catalogs',
        },
        vip: {
          count: MEMBERSHIP_STATISTICS.vip,
          description:
            'Premium tier for high-volume sellers and established brands',
        },
        enterprise: {
          count: MEMBERSHIP_STATISTICS.enterprise,
          description:
            'Custom enterprise solutions with unlimited features and dedicated support',
        },
        special: {
          count: MEMBERSHIP_STATISTICS.special,
          description: 'Trial, student, and promotional membership plans',
        },
      },
      businessTypes: {
        individual: {
          count: MEMBERSHIP_STATISTICS.individual,
          description:
            'Individual sellers, home-based businesses, craftspeople',
        },
        smallBusiness: {
          count: MEMBERSHIP_STATISTICS.smallBusiness,
          description: 'Small businesses with growing product catalogs',
        },
        mediumBusiness: {
          count: MEMBERSHIP_STATISTICS.mediumBusiness,
          description: 'Medium businesses with established online presence',
        },
        enterpriseBusiness: {
          count: MEMBERSHIP_STATISTICS.enterpriseBusiness,
          description:
            'Large enterprises, government entities, major marketplace operators',
        },
      },
      features: {
        withTaxReporting: MEMBERSHIP_STATISTICS.withTaxReporting,
        withGovernorateAnalytics:
          MEMBERSHIP_STATISTICS.withGovernorateAnalytics,
        withMultiCurrency: MEMBERSHIP_STATISTICS.withMultiCurrency,
        withDiasporaTools: MEMBERSHIP_STATISTICS.withDiasporaTools,
        withApiAccess: MEMBERSHIP_STATISTICS.withApiAccess,
        withWhiteLabel: MEMBERSHIP_STATISTICS.withWhiteLabel,
      },
    };
  }

  /**
   * ✅ GET MEMBERSHIP PREVIEW: Preview membership structure by tier
   */
  @Get('memberships/preview')
  @ApiOperation({
    summary: 'Get membership structure preview by tier',
    description:
      'Preview the structure and distribution of memberships that would be seeded.',
  })
  @ApiQuery({
    name: 'tier',
    description: 'Filter by specific membership tier',
    required: false,
    type: String,
    example: 'premium',
  })
  @ApiQuery({
    name: 'businessType',
    description: 'Filter by specific business type',
    required: false,
    type: String,
    example: 'small_business',
  })
  @ApiQuery({
    name: 'duration',
    description: 'Filter by specific duration in days',
    required: false,
    type: Number,
    example: 365,
  })
  @ApiResponse({
    status: 200,
    description: 'Membership preview retrieved successfully',
  })
  getMembershipPreview(
    @Query('tier') tier?: string,
    @Query('businessType') businessType?: string,
    @Query('duration') duration?: number,
  ): {
    success: boolean;
    message: string;
    memberships: any[];
    statistics: {
      totalMemberships: number;
      tierDistribution: { [key: string]: number };
      businessTypeDistribution: { [key: string]: number };
      durationDistribution: { [key: string]: number };
      priceRange: { min: number; max: number; average: number };
    };
  } {
    let filteredMemberships = ALL_MEMBERSHIP_SEEDS;

    // Filter by tier (based on name)
    if (tier) {
      filteredMemberships = filteredMemberships.filter((membership) =>
        membership.name.toLowerCase().includes(tier.toLowerCase()),
      );
    }

    // Filter by business type
    if (businessType) {
      filteredMemberships = filteredMemberships.filter(
        (membership) => membership.businessType === businessType,
      );
    }

    // Filter by duration
    if (duration) {
      filteredMemberships = filteredMemberships.filter(
        (membership) => membership.durationInDays === duration,
      );
    }

    // Create preview (sanitized membership data)
    const membershipPreview = filteredMemberships.map((membership) => ({
      name: membership.name,
      nameAr: membership.nameAr,
      price: membership.price,
      priceUSD: membership.priceUSD,
      durationInDays: membership.durationInDays,
      businessType: membership.businessType,
      maxProducts: membership.maxProducts,
      maxImagesPerProduct: membership.maxImagesPerProduct,
      prioritySupport: membership.prioritySupport,
      commissionDiscount: membership.commissionDiscount,
      isPopular: membership.isPopular,
      isActive: membership.isActive,
      targetAudience: membership.targetAudience,
      targetAudienceAr: membership.targetAudienceAr,
      features: membership.features.slice(0, 5), // Show first 5 features
      syrianBusinessFeatures: membership.syrianBusinessFeatures,
    }));

    // Calculate statistics
    const tierDistribution: { [key: string]: number } = {};
    const businessTypeDistribution: { [key: string]: number } = {};
    const durationDistribution: { [key: string]: number } = {};

    let totalPrice = 0;
    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = 0;

    filteredMemberships.forEach((membership) => {
      // Tier distribution (based on name)
      const tierName = membership.name.toLowerCase().includes('basic')
        ? 'basic'
        : membership.name.toLowerCase().includes('premium')
          ? 'premium'
          : membership.name.toLowerCase().includes('vip')
            ? 'vip'
            : membership.name.toLowerCase().includes('enterprise')
              ? 'enterprise'
              : 'special';
      tierDistribution[tierName] = (tierDistribution[tierName] || 0) + 1;

      // Business type distribution
      businessTypeDistribution[membership.businessType] =
        (businessTypeDistribution[membership.businessType] || 0) + 1;

      // Duration distribution
      const durationKey = `${membership.durationInDays} days`;
      durationDistribution[durationKey] =
        (durationDistribution[durationKey] || 0) + 1;

      // Price calculations
      totalPrice += membership.price;
      minPrice = Math.min(minPrice, membership.price);
      maxPrice = Math.max(maxPrice, membership.price);
    });

    const averagePrice =
      filteredMemberships.length > 0
        ? totalPrice / filteredMemberships.length
        : 0;

    return {
      success: true,
      message: 'Membership preview retrieved successfully',
      memberships: membershipPreview,
      statistics: {
        totalMemberships: filteredMemberships.length,
        tierDistribution,
        businessTypeDistribution,
        durationDistribution,
        priceRange: {
          min: minPrice === Number.MAX_SAFE_INTEGER ? 0 : minPrice,
          max: maxPrice,
          average: Math.round(averagePrice),
        },
      },
    };
  }
}

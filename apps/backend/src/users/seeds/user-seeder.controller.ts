/**
 * @file user-seeder.controller.ts
 * @description Enterprise User Seeding Controller for SouqSyria Platform
 *
 * SEEDING ENDPOINTS:
 * - Comprehensive user seeding with role-based creation
 * - Type-specific seeding (Admin, Staff, Vendor, Customer, System)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Performance monitoring and analytics
 * - Role validation and creation
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
  UserSeederService,
  UserSeedOptions,
  UserSeedResult,
} from './user-seeder.service';
import { USER_STATISTICS, ALL_USER_SEEDS } from './user-seeds.data';

/**
 * DTO Classes for API Documentation and Validation
 */

/**
 * User Seeding Options DTO
 */
export class UserSeedOptionsDto implements UserSeedOptions {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeAdmins?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeStaff?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeVendors?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeCustomers?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeSystem?: boolean = true;

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
  @Max(100)
  @Type(() => Number)
  batchSize?: number = 20;

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
  specificUserTypes?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((location) => location.trim());
    }
    return value;
  })
  specificLocations?: string[] = [];

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
  onlyActive?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tier) => tier.trim());
    }
    return value;
  })
  specificTiers?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((lang) => lang.trim());
    }
    return value;
  })
  specificLanguages?: string[] = [];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hashPasswords?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  createMissingRoles?: boolean = true;

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
  validateRoles?: boolean = true;
}

/**
 * Cleanup Options DTO
 */
export class UserCleanupOptionsDto {
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
  excludeAdmins?: boolean = true;
}

/**
 * ✅ USER SEEDER CONTROLLER: Comprehensive API endpoints for user seeding
 */
@ApiTags('🌱 User Seeding')
@Controller('users/seeding')
@UseGuards() // Add your authentication guards here
@ApiBearerAuth()
export class UserSeederController {
  private readonly logger = new Logger(UserSeederController.name);

  constructor(private readonly userSeederService: UserSeederService) {}

  /**
   * ✅ SEED ALL USERS: Main seeding endpoint with comprehensive options
   */
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed users with comprehensive role-based options',
    description: `
      Comprehensive user seeding with advanced filtering and role-based processing options.
      
      **Features:**
      - Role-based user creation (Admin, Staff, Vendor, Customer, System)
      - Password hashing and security implementation
      - Batch processing with transaction safety
      - Duplicate detection and conflict resolution
      - Dry run capability for testing
      - Performance monitoring and analytics
      - Role validation and creation
      
      **User Types:**
      - Admins: ${USER_STATISTICS.admins} administrator accounts
      - Staff: ${USER_STATISTICS.staff} staff members
      - Vendors: ${USER_STATISTICS.vendors} business sellers
      - Customers: ${USER_STATISTICS.customers} regular buyers
      - System: ${USER_STATISTICS.system} system accounts
      - Total Available: ${USER_STATISTICS.total} users
    `,
  })
  @ApiBody({
    description: 'Seeding options and filters',
    type: UserSeedOptionsDto,
    examples: {
      'Default Seeding': {
        summary: 'Seed all user types with default options',
        value: {
          includeAdmins: true,
          includeStaff: true,
          includeVendors: true,
          includeCustomers: true,
          includeSystem: true,
          batchSize: 20,
          skipDuplicates: true,
          hashPasswords: true,
          createMissingRoles: true,
          validateRoles: true,
        },
      },
      'Customers Only': {
        summary: 'Seed only customer users',
        value: {
          includeAdmins: false,
          includeStaff: false,
          includeVendors: false,
          includeCustomers: true,
          includeSystem: false,
          specificUserTypes: ['customer'],
        },
      },
      'Verified Users Only': {
        summary: 'Seed only verified users',
        value: {
          onlyVerified: true,
          onlyActive: true,
          batchSize: 15,
        },
      },
      'Dry Run Test': {
        summary: 'Test user seeding without making changes',
        value: {
          dryRun: true,
          validateRoles: true,
          validateOnly: false,
          batchSize: 50,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User seeding completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'User seeding completed successfully',
        },
        result: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            totalProcessed: { type: 'number', example: 25 },
            created: { type: 'number', example: 20 },
            updated: { type: 'number', example: 3 },
            skipped: { type: 'number', example: 2 },
            errors: { type: 'number', example: 0 },
            processingTimeMs: { type: 'number', example: 4250 },
            statistics: {
              type: 'object',
              example: USER_STATISTICS,
            },
            performance: {
              type: 'object',
              properties: {
                averageTimePerUser: { type: 'number', example: 170.0 },
                batchProcessingTime: { type: 'number', example: 4250 },
                dbOperationTime: { type: 'number', example: 3890 },
                passwordHashingTime: { type: 'number', example: 1200 },
              },
            },
            roles: {
              type: 'object',
              properties: {
                rolesProcessed: { type: 'number', example: 8 },
                rolesCreated: { type: 'number', example: 2 },
                roleResolutionTime: { type: 'number', example: 450 },
                missingRoles: { type: 'array', example: [] },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid seeding options or role validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding',
  })
  async seedUsers(@Body(ValidationPipe) options: UserSeedOptionsDto): Promise<{
    success: boolean;
    message: string;
    result: UserSeedResult;
    timestamp: string;
  }> {
    const startTime = Date.now();

    this.logger.log(
      `🌱 Starting user seeding with options: ${JSON.stringify(options)}`,
    );

    try {
      const result = await this.userSeederService.seedUsers(options);
      const totalTime = Date.now() - startTime;

      this.logger.log(
        `✅ User seeding completed successfully in ${totalTime}ms`,
      );
      this.logger.log(
        `📊 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`,
      );
      this.logger.log(
        `👥 Roles: ${result.roles.rolesProcessed} processed, ${result.roles.rolesCreated} created`,
      );

      return {
        success: true,
        message: options.dryRun
          ? 'Dry run completed successfully'
          : 'User seeding completed successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;

      this.logger.error(
        `❌ User seeding failed after ${totalTime}ms: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  /**
   * ✅ SEED ADMIN USERS: Seed only administrator and staff users
   */
  @Post('seed/admins')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed administrator and staff users only',
    description: `
      Seed only admin and staff users for the Syrian e-commerce platform.
      
      **Admin Users:** Super admins, marketing managers, customer support
      **Total Admin Users:** ${USER_STATISTICS.admins + USER_STATISTICS.staff}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Admin users seeded successfully',
  })
  async seedAdminUsers(): Promise<{
    success: boolean;
    message: string;
    result: UserSeedResult;
  }> {
    this.logger.log('👑 Seeding admin and staff users...');

    const result = await this.userSeederService.seedAdminUsers();

    return {
      success: true,
      message: 'Admin and staff users seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED VENDOR USERS: Seed vendor/seller users
   */
  @Post('seed/vendors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed vendor and seller users',
    description: `
      Seed vendor users including electronics, fashion, food, and crafts vendors.
      
      **Vendor Categories:** Electronics, Fashion, Food, Traditional Crafts
      **Total Vendor Users:** ${USER_STATISTICS.vendors}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor users seeded successfully',
  })
  async seedVendorUsers(): Promise<{
    success: boolean;
    message: string;
    result: UserSeedResult;
  }> {
    this.logger.log('🏪 Seeding vendor users...');

    const result = await this.userSeederService.seedVendorUsers();

    return {
      success: true,
      message: 'Vendor users seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED CUSTOMER USERS: Seed customer/buyer users
   */
  @Post('seed/customers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed customer and buyer users',
    description: `
      Seed customer users including Syrian locals and diaspora customers.
      
      **Customer Types:** Local Syrian customers, diaspora customers (Germany, USA)
      **Total Customer Users:** ${USER_STATISTICS.customers}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer users seeded successfully',
  })
  async seedCustomerUsers(): Promise<{
    success: boolean;
    message: string;
    result: UserSeedResult;
  }> {
    this.logger.log('🛒 Seeding customer users...');

    const result = await this.userSeederService.seedCustomerUsers();

    return {
      success: true,
      message: 'Customer users seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED SYSTEM USERS: Seed system and bot users
   */
  @Post('seed/system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed system and bot users',
    description: `
      Seed system users including automation bots and system processes.
      
      **System Users:** System bot, analytics bot, automation processes
      **Total System Users:** ${USER_STATISTICS.system}
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'System users seeded successfully',
  })
  async seedSystemUsers(): Promise<{
    success: boolean;
    message: string;
    result: UserSeedResult;
  }> {
    this.logger.log('🤖 Seeding system users...');

    const result = await this.userSeederService.seedSystemUsers();

    return {
      success: true,
      message: 'System users seeded successfully',
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
      - Seed data availability by user type and location
      - Current database statistics with role analysis
      - Seeding progress and missing data analysis
      - Performance metrics and recommendations
      - Role integrity validation
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
          example: USER_STATISTICS,
        },
        database: {
          type: 'object',
          properties: {
            totalUsers: { type: 'number', example: 15 },
            verifiedUsers: { type: 'number', example: 12 },
            activeUsers: { type: 'number', example: 14 },
            bannedUsers: { type: 'number', example: 1 },
            suspendedUsers: { type: 'number', example: 1 },
            adminUsers: { type: 'number', example: 3 },
            vendorUsers: { type: 'number', example: 4 },
            customerUsers: { type: 'number', example: 7 },
          },
        },
        comparison: {
          type: 'object',
          properties: {
            seedingProgress: { type: 'number', example: 60 },
            missingFromDb: { type: 'number', example: 10 },
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

    const statistics = await this.userSeederService.getSeedingStatistics();

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
    summary: 'Validate seed data and role integrity',
    description: `
      Validate the integrity and quality of seed data without making any database changes.
      
      **Validation Checks:**
      - Required field validation
      - Data format validation (email, phone, etc.)
      - Duplicate detection (email, Firebase UID)
      - Role existence validation
      - Business rule compliance
      - Security requirements check
    `,
  })
  @ApiBody({
    description: 'Validation options',
    type: UserSeedOptionsDto,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed successfully',
  })
  async validateSeedData(
    @Body(ValidationPipe) options: UserSeedOptionsDto = {},
  ): Promise<{
    success: boolean;
    message: string;
    result: UserSeedResult;
  }> {
    this.logger.log('🔍 Validating seed data...');

    const validationOptions = { ...options, validateOnly: true };
    const result = await this.userSeederService.seedUsers(validationOptions);

    return {
      success: result.success,
      message: result.success
        ? 'Seed data validation passed'
        : 'Seed data validation failed',
      result,
    };
  }

  /**
   * ✅ CLEANUP USERS: Remove seeded users
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cleanup seeded users with safety controls',
    description: `
      Remove users that were created from seed data with proper safety measures.
      
      **Safety Features:**
      - Only removes seed data users by default
      - Requires confirmation code for complete deletion
      - Supports dry run for safe testing
      - Excludes admin users by default for safety
      - Comprehensive logging and audit trails
      
      **Confirmation Code for Complete Deletion:** DELETE_ALL_USERS_CONFIRMED
    `,
  })
  @ApiQuery({
    name: 'onlySeedData',
    description: 'Only delete users from seed data (safer)',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'confirmationCode',
    description: 'Required for complete deletion: DELETE_ALL_USERS_CONFIRMED',
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
    name: 'excludeAdmins',
    description: 'Exclude admin users from deletion (recommended)',
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
  async cleanupUsers(
    @Query('onlySeedData') onlySeedData: boolean = true,
    @Query('confirmationCode') confirmationCode?: string,
    @Query('dryRun') dryRun: boolean = false,
    @Query('excludeAdmins') excludeAdmins: boolean = true,
  ): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
    processingTimeMs: number;
    warning?: string;
  }> {
    this.logger.log(
      `🧹 Starting user cleanup (onlySeedData: ${onlySeedData}, dryRun: ${dryRun}, excludeAdmins: ${excludeAdmins})`,
    );

    const result = await this.userSeederService.cleanupUsers({
      onlySeedData,
      confirmationCode,
      dryRun,
      excludeAdmins,
    });

    const message = dryRun
      ? `Dry run: Would delete ${result.deletedCount} users`
      : `Successfully deleted ${result.deletedCount} users`;

    const warning = !onlySeedData
      ? 'WARNING: Complete user deletion performed'
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
    summary: 'Check seeding service health and role integrity',
    description:
      'Verify database connectivity, seed data integrity, role structure, and service health.',
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
        roleIntegrity: { type: 'string', enum: ['valid', 'invalid'] },
        statistics: { type: 'object' },
        lastCheck: { type: 'string', format: 'date-time' },
      },
    },
  })
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    seedDataIntegrity: 'valid' | 'invalid';
    roleIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
    message: string;
  }> {
    this.logger.log('💚 Performing health check...');

    const health = await this.userSeederService.healthCheck();

    return {
      ...health,
      message:
        health.status === 'healthy'
          ? 'User seeding service is healthy'
          : 'User seeding service has issues',
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
      - ${USER_STATISTICS.total} total users
      - ${USER_STATISTICS.admins} administrator users
      - ${USER_STATISTICS.staff} staff members
      - ${USER_STATISTICS.vendors} vendor users
      - ${USER_STATISTICS.customers} customer users
      - ${USER_STATISTICS.system} system users
      - ${USER_STATISTICS.verified} verified accounts
      - ${USER_STATISTICS.diaspora} diaspora users
      - ${USER_STATISTICS.syrian} Syrian local users
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seed data information retrieved successfully',
  })
  getSeedDataInfo(): {
    success: boolean;
    message: string;
    data: typeof USER_STATISTICS;
    userTypes: {
      admins: { count: number; description: string };
      staff: { count: number; description: string };
      vendors: { count: number; description: string };
      customers: { count: number; description: string };
      system: { count: number; description: string };
    };
    demographics: {
      syrian: { count: number; description: string };
      diaspora: { count: number; description: string };
      verified: { count: number; description: string };
      languages: {
        arabic: number;
        english: number;
        both: number;
      };
    };
  } {
    return {
      success: true,
      message: 'Seed data information retrieved successfully',
      data: USER_STATISTICS,
      userTypes: {
        admins: {
          count: USER_STATISTICS.admins,
          description: 'Super administrators and system managers',
        },
        staff: {
          count: USER_STATISTICS.staff,
          description:
            'Marketing managers, customer support, and operational staff',
        },
        vendors: {
          count: USER_STATISTICS.vendors,
          description:
            'Business sellers: Electronics, Fashion, Food, Crafts vendors',
        },
        customers: {
          count: USER_STATISTICS.customers,
          description: 'Regular buyers: Syrian locals and diaspora customers',
        },
        system: {
          count: USER_STATISTICS.system,
          description: 'Automated system accounts and processing bots',
        },
      },
      demographics: {
        syrian: {
          count: USER_STATISTICS.syrian,
          description: 'Users located in Syrian governorates',
        },
        diaspora: {
          count: USER_STATISTICS.diaspora,
          description:
            'Syrian diaspora users in Germany, USA, and other countries',
        },
        verified: {
          count: USER_STATISTICS.verified,
          description: 'Email/phone verified user accounts',
        },
        languages: {
          arabic: USER_STATISTICS.preferArabic,
          english: USER_STATISTICS.preferEnglish,
          both: USER_STATISTICS.preferBoth,
        },
      },
    };
  }

  /**
   * ✅ GET USER PREVIEW: Preview user structure by type
   */
  @Get('users/preview')
  @ApiOperation({
    summary: 'Get user structure preview by type',
    description:
      'Preview the structure and distribution of users that would be seeded.',
  })
  @ApiQuery({
    name: 'userType',
    description: 'Filter by specific user type',
    required: false,
    type: String,
    example: 'customer',
  })
  @ApiQuery({
    name: 'location',
    description: 'Filter by specific location',
    required: false,
    type: String,
    example: 'Damascus',
  })
  @ApiResponse({
    status: 200,
    description: 'User preview retrieved successfully',
  })
  getUserPreview(
    @Query('userType') userType?: string,
    @Query('location') location?: string,
  ): {
    success: boolean;
    message: string;
    users: any[];
    statistics: {
      totalUsers: number;
      userTypeDistribution: { [key: string]: number };
      locationDistribution: { [key: string]: number };
    };
  } {
    let filteredUsers = ALL_USER_SEEDS;

    // Filter by user type
    if (userType) {
      filteredUsers = filteredUsers.filter(
        (user) => user.userType === userType,
      );
    }

    // Filter by location
    if (location) {
      filteredUsers = filteredUsers.filter(
        (user) => user.location === location,
      );
    }

    // Create preview (sanitized user data)
    const userPreview = filteredUsers.map((user) => ({
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      location: user.location,
      preferredLanguage: user.preferredLanguage,
      accountTier: user.accountTier,
      isVerified: user.isVerified,
      isActive: !user.isBanned && !user.isSuspended,
      roleName: user.roleName,
      assignedRoleName: user.assignedRoleName,
    }));

    // Calculate statistics
    const userTypeDistribution: { [key: string]: number } = {};
    const locationDistribution: { [key: string]: number } = {};

    filteredUsers.forEach((user) => {
      userTypeDistribution[user.userType] =
        (userTypeDistribution[user.userType] || 0) + 1;
      locationDistribution[user.location] =
        (locationDistribution[user.location] || 0) + 1;
    });

    return {
      success: true,
      message: 'User preview retrieved successfully',
      users: userPreview,
      statistics: {
        totalUsers: filteredUsers.length,
        userTypeDistribution,
        locationDistribution,
      },
    };
  }
}

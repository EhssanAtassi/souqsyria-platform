/**
 * @file access-control.seeder.controller.ts
 * @description Access Control Seeder Controller for SouqSyria Platform
 * Provides API endpoints for seeding and managing access control data
 *
 * @swagger
 * @tags Access Control Seeding
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  AccessControlSeederService,
  AccessControlSeedingOptions,
  SeedingStats,
} from './access-control.seeder.service';

/**
 * DTO for seeding options
 */
export class SeedingOptionsDto implements AccessControlSeedingOptions {
  /**
   * Whether to seed permissions
   * @example true
   */
  seedPermissions?: boolean;

  /**
   * Whether to seed roles
   * @example true
   */
  seedRoles?: boolean;

  /**
   * Whether to seed role-permission relationships
   * @example true
   */
  seedRolePermissions?: boolean;

  /**
   * Whether to overwrite existing data
   * @example false
   */
  overwriteExisting?: boolean;

  /**
   * Logging level for the seeding process
   * @example "info"
   */
  logLevel?: 'debug' | 'info' | 'warn';
}

/**
 * Response DTO for seeding statistics
 */
export class SeedingStatsResponseDto implements SeedingStats {
  /**
   * Number of permissions created
   * @example 125
   */
  permissionsCreated: number;

  /**
   * Number of permissions updated
   * @example 5
   */
  permissionsUpdated: number;

  /**
   * Number of roles created
   * @example 13
   */
  rolesCreated: number;

  /**
   * Number of roles updated
   * @example 2
   */
  rolesUpdated: number;

  /**
   * Number of role-permission relationships created
   * @example 287
   */
  rolePermissionsCreated: number;

  /**
   * Number of routes created
   * @example 45
   */
  routesCreated: number;

  /**
   * Number of routes updated
   * @example 3
   */
  routesUpdated: number;

  /**
   * Number of routes mapped to permissions
   * @example 42
   */
  routesMapped: number;

  /**
   * Number of routes without permission mapping
   * @example 3
   */
  routesUnmapped: number;

  /**
   * Total processing time in milliseconds
   * @example 1250
   */
  totalProcessingTime: number;
}

/**
 * Response DTO for validation results
 */
export class ValidationResponseDto {
  /**
   * Whether the access control system is valid
   * @example true
   */
  valid: boolean;

  /**
   * List of validation issues found
   * @example ["Found 2 roles without any permissions: role1, role2"]
   */
  issues: string[];
}

/**
 * Response DTO for access control statistics
 */
export class AccessControlStatsDto {
  /**
   * Permission statistics
   */
  permissions: {
    total: number;
    byCategory: Array<{ category: string; count: number }>;
  };

  /**
   * Role statistics
   */
  roles: {
    total: number;
    business: number;
    admin: number;
    default: number;
  };

  /**
   * Role-permission relationship statistics
   */
  rolePermissions: {
    total: number;
  };

  /**
   * Statistics timestamp
   * @example "2025-08-14T10:30:00.000Z"
   */
  timestamp: string;
}

@ApiTags('Access Control Seeding')
@Controller('access-control/seeding')
@ApiBearerAuth()
@ApiSecurity('firebase-auth')
export class AccessControlSeederController {
  private readonly logger = new Logger(AccessControlSeederController.name);

  constructor(private readonly seederService: AccessControlSeederService) {}

  /**
   * Seeds the complete access control system with roles, permissions, and their relationships
   *
   * This endpoint initializes the access control system by:
   * 1. Creating all system permissions organized by category
   * 2. Creating business and admin roles with proper hierarchy
   * 3. Establishing role-permission relationships for granular access control
   *
   * @param options - Configuration options for the seeding process
   * @returns Comprehensive statistics about the seeding operation
   */
  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed Complete Access Control System',
    description: `
    Initializes the complete access control system for SouqSyria platform.
    
    **Features:**
    - Seeds 125+ permissions across 15 categories (products, orders, users, etc.)
    - Creates 13 roles (5 business + 8 admin roles)
    - Establishes 250+ role-permission relationships
    - Supports Syrian localization features
    - Includes comprehensive B2B and marketplace permissions
    
    **Categories Covered:**
    - Products & Inventory Management
    - Order Processing & Fulfillment  
    - User & Vendor Management
    - Payment & Financial Operations
    - Shipping & Logistics
    - Analytics & Reporting
    - Content Moderation
    - System Administration
    - Syrian Localization Features
    
    **Use Cases:**
    - Initial platform setup
    - Development environment setup
    - Testing access control scenarios
    - Production deployment preparation
    `,
    operationId: 'seedAccessControlSystem',
  })
  @ApiBody({
    type: SeedingOptionsDto,
    description: 'Seeding configuration options',
    required: false,
    examples: {
      default: {
        summary: 'Default seeding (recommended)',
        value: {
          seedPermissions: true,
          seedRoles: true,
          seedRolePermissions: true,
          overwriteExisting: false,
          logLevel: 'info',
        },
      },
      development: {
        summary: 'Development environment with debug logging',
        value: {
          seedPermissions: true,
          seedRoles: true,
          seedRolePermissions: true,
          overwriteExisting: true,
          logLevel: 'debug',
        },
      },
      permissionsOnly: {
        summary: 'Seed only permissions',
        value: {
          seedPermissions: true,
          seedRoles: false,
          seedRolePermissions: false,
          logLevel: 'info',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Access control system seeded successfully',
    type: SeedingStatsResponseDto,
    example: {
      permissionsCreated: 125,
      permissionsUpdated: 0,
      rolesCreated: 13,
      rolesUpdated: 0,
      rolePermissionsCreated: 287,
      totalProcessingTime: 1250,
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding options provided',
    example: {
      statusCode: 400,
      message: 'Invalid seeding configuration',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Seeding process failed',
    example: {
      statusCode: 500,
      message: 'Access Control Seeding failed: Database connection error',
      error: 'Internal Server Error',
    },
  })
  async seedAccessControlSystem(
    @Body() options?: SeedingOptionsDto,
  ): Promise<SeedingStatsResponseDto> {
    this.logger.log('🌱 Starting access control seeding via API...');

    const stats = await this.seederService.seedAccessControlSystem(options);

    this.logger.log(
      `✅ Access control seeding completed via API: ${stats.permissionsCreated + stats.rolesCreated + stats.rolePermissionsCreated} items processed`,
    );

    return stats;
  }

  /**
   * Retrieves comprehensive statistics about the current access control system
   *
   * @returns Detailed statistics including counts and breakdowns by category/type
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get Access Control Statistics',
    description: `
    Retrieves comprehensive statistics about the current state of the access control system.
    
    **Information Included:**
    - Total permission count and breakdown by category
    - Role counts by type (business/admin) and default status
    - Role-permission relationship counts
    - Category-wise permission distribution
    - System health indicators
    
    **Use Cases:**
    - Monitoring system setup completeness
    - Debugging access control issues
    - Generating system reports
    - Validating seeding results
    `,
    operationId: 'getAccessControlStats',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access control statistics retrieved successfully',
    type: AccessControlStatsDto,
    example: {
      permissions: {
        total: 125,
        byCategory: [
          { category: 'products', count: 15 },
          { category: 'orders', count: 12 },
          { category: 'users', count: 12 },
          { category: 'vendors', count: 7 },
          { category: 'admin', count: 10 },
        ],
      },
      roles: {
        total: 13,
        business: 5,
        admin: 8,
        default: 1,
      },
      rolePermissions: {
        total: 287,
      },
      timestamp: '2025-08-14T10:30:00.000Z',
    },
  })
  async getAccessControlStats(): Promise<AccessControlStatsDto> {
    this.logger.log('📊 Retrieving access control statistics...');

    const stats = await this.seederService.getSeedingStats();

    this.logger.log(
      `📈 Retrieved statistics: ${stats.permissions.total} permissions, ${stats.roles.total} roles`,
    );

    return stats;
  }

  /**
   * Validates the integrity and consistency of the access control system
   *
   * @returns Validation results with any issues found
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate Access Control System Integrity',
    description: `
    Performs comprehensive validation of the access control system to identify potential issues.
    
    **Validation Checks:**
    - Roles without any assigned permissions
    - Orphaned role-permission relationships
    - Duplicate role-permission assignments
    - Data consistency across entities
    - Foreign key integrity
    
    **Use Cases:**
    - Pre-deployment validation
    - Troubleshooting access control issues
    - Regular system health checks
    - Data integrity monitoring
    `,
    operationId: 'validateAccessControlIntegrity',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed successfully',
    type: ValidationResponseDto,
    examples: {
      valid: {
        summary: 'System is valid',
        value: {
          valid: true,
          issues: [],
        },
      },
      invalid: {
        summary: 'Issues found',
        value: {
          valid: false,
          issues: [
            'Found 2 roles without any permissions: test_role1, test_role2',
            'Found 3 orphaned role-permission relationships',
          ],
        },
      },
    },
  })
  async validateAccessControlIntegrity(): Promise<ValidationResponseDto> {
    this.logger.log('🔍 Starting access control integrity validation...');

    const result = await this.seederService.validateAccessControlIntegrity();

    if (result.valid) {
      this.logger.log('✅ Access control system validation passed');
    } else {
      this.logger.warn(
        `⚠️ Access control system validation found ${result.issues.length} issues`,
      );
    }

    return result;
  }

  /**
   * ⚠️ DESTRUCTIVE: Removes all access control data from the system
   *
   * WARNING: This endpoint permanently deletes all permissions, roles, and their relationships.
   * Use with extreme caution and only in development/testing environments.
   *
   * @returns Success confirmation
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '⚠️ DESTRUCTIVE: Cleanup Access Control Data',
    description: `
    **🚨 DANGER: This operation is DESTRUCTIVE and IRREVERSIBLE! 🚨**
    
    Completely removes all access control data from the system:
    - All permissions will be deleted
    - All roles will be deleted  
    - All role-permission relationships will be deleted
    
    **⚠️ Use Cases (Testing/Development ONLY):**
    - Cleaning up test environments
    - Preparing for fresh seeding
    - Resetting development databases
    - Testing disaster recovery procedures
    
    **🛑 NEVER use in production environments!**
    
    **Prerequisites:**
    - Ensure you have database backups
    - Verify this is not a production environment
    - Confirm you understand the implications
    `,
    operationId: 'cleanupAccessControlData',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Access control data cleaned up successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Cleanup operation failed',
    example: {
      statusCode: 500,
      message:
        'Access control cleanup failed: Foreign key constraint violation',
      error: 'Internal Server Error',
    },
  })
  async cleanupAccessControlData(): Promise<void> {
    this.logger.warn(
      '🧹 Starting DESTRUCTIVE access control cleanup via API...',
    );

    await this.seederService.cleanupAccessControlData();

    this.logger.warn('💥 Access control cleanup completed - all data removed');
  }

  /**
   * Quick health check for the access control seeding system
   *
   * @returns Basic system information
   */
  @Get('health')
  @ApiOperation({
    summary: 'Access Control Seeding Health Check',
    description:
      'Quick health check to verify the seeding system is operational',
    operationId: 'accessControlSeedingHealthCheck',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed successfully',
    example: {
      status: 'healthy',
      service: 'access-control-seeding',
      timestamp: '2025-08-14T10:30:00.000Z',
      version: '1.0.0',
    },
  })
  async healthCheck(): Promise<any> {
    return {
      status: 'healthy',
      service: 'access-control-seeding',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

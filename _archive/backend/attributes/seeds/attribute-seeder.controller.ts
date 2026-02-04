/**
 * @file attribute-seeder.controller.ts
 * @description Professional attribute seeding controller with comprehensive APIs
 *
 * Provides REST endpoints for:
 * - Seeding attributes and values
 * - Cleanup and testing operations
 * - Statistics and validation
 * - Health monitoring
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AttributeSeederService } from './attribute-seeder.service';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';

@ApiTags('🌱 Attribute Seeding')
@Controller('api/attributes/seeding')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AttributeSeederController {
  private readonly logger = new Logger(AttributeSeederController.name);

  constructor(
    private readonly attributeSeederService: AttributeSeederService,
  ) {}

  /**
   * Seed attributes with comprehensive data
   */
  @Post('seed')
  @ApiOperation({
    summary: 'Seed attributes with comprehensive e-commerce data',
    description: `
    Seeds the database with comprehensive attribute data including:
    - Color, Size, Brand, Material attributes
    - Storage capacity, Features, Weight
    - Warranty, Condition, Age Group
    - Multi-language support (Arabic/English)
    - Proper validation rules and display ordering
    
    Creates approximately 10 attributes with 50+ attribute values total.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Attributes seeded successfully',
    schema: {
      example: {
        success: true,
        message: 'Attributes seeded successfully',
        data: {
          attributesCreated: 8,
          valuesCreated: 45,
          errors: [],
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Seeding failed with errors',
  })
  @Permissions('admin:attributes:seed')
  async seedAttributes() {
    this.logger.log('🌱 Starting attribute seeding via API...');

    try {
      const startTime = Date.now();
      const result = await this.attributeSeederService.seedAttributes();
      const duration = Date.now() - startTime;

      this.logger.log(`✅ Seeding completed in ${duration}ms`);

      return {
        success: result.success,
        message: result.success
          ? 'Attributes seeded successfully'
          : 'Seeding completed with errors',
        data: {
          attributesCreated: result.attributesCreated,
          valuesCreated: result.valuesCreated,
          errors: result.errors,
          duration: `${duration}ms`,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Seeding failed:', error);
      return {
        success: false,
        message: 'Seeding failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get seeding statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get attribute seeding statistics',
    description: `
    Returns comprehensive statistics about seeded attributes:
    - Total attributes and values count
    - Breakdown by attribute type
    - Active vs inactive attributes
    - Data quality metrics
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          totalAttributes: 10,
          totalValues: 52,
          attributesByType: {
            select: 6,
            color: 1,
            multiselect: 1,
            number: 1,
            boolean: 1,
          },
          activeAttributes: 10,
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  @Permissions('admin:attributes:read')
  async getStatistics() {
    try {
      const stats = await this.attributeSeederService.getStatistics();

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to get statistics:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate seeded data integrity
   */
  @Post('validate')
  @ApiOperation({
    summary: 'Validate seeded attribute data integrity',
    description: `
    Performs comprehensive validation of seeded attribute data:
    - Checks for attributes without required values
    - Identifies duplicate attribute names
    - Validates translation completeness
    - Provides recommendations for improvements
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed',
    schema: {
      example: {
        success: true,
        data: {
          isValid: true,
          issues: [],
          recommendations: [
            'Consider adding more color options',
            'Add size chart documentation',
          ],
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  @Permissions('admin:attributes:validate')
  async validateData() {
    try {
      const validation = await this.attributeSeederService.validateSeededData();

      return {
        success: true,
        data: validation,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Validation failed:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleanup attributes (for testing)
   */
  @Delete('cleanup')
  @ApiOperation({
    summary: 'Clean up all seeded attributes',
    description: `
    ⚠️  DANGEROUS OPERATION ⚠️
    
    Removes ALL attributes and attribute values from the database.
    This operation is intended for testing and development environments only.
    
    Use with extreme caution in production environments.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cleanup completed successfully',
    schema: {
      example: {
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          deleted: 10,
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        confirm: {
          type: 'boolean',
          description: 'Must be true to confirm the cleanup operation',
          example: true,
        },
      },
      required: ['confirm'],
    },
  })
  @Permissions('admin:attributes:delete')
  async cleanup(@Body() body: { confirm: boolean }) {
    if (!body.confirm) {
      return {
        success: false,
        message: 'Cleanup cancelled: confirmation required',
        timestamp: new Date().toISOString(),
      };
    }

    this.logger.warn('🧹 Starting attribute cleanup...');

    try {
      const result = await this.attributeSeederService.cleanupAttributes();

      this.logger.log(
        `✅ Cleanup completed: ${result.deleted} attributes deleted`,
      );

      return {
        success: result.success,
        message: result.success
          ? 'Cleanup completed successfully'
          : 'Cleanup failed',
        data: {
          deleted: result.deleted,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Cleanup failed:', error);
      return {
        success: false,
        message: 'Cleanup failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Health check for attribute seeding
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for attribute seeding system',
    description: `
    Performs a quick health check of the attribute seeding system:
    - Database connectivity
    - Repository accessibility
    - Basic functionality test
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed',
    schema: {
      example: {
        success: true,
        status: 'healthy',
        checks: {
          database: 'connected',
          repositories: 'accessible',
          functionality: 'operational',
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  async healthCheck() {
    try {
      const checks = {
        database: 'connected',
        repositories: 'accessible',
        functionality: 'operational',
      };

      // Test database connectivity
      try {
        await this.attributeSeederService.getStatistics();
        checks.database = 'connected';
        checks.repositories = 'accessible';
        checks.functionality = 'operational';
      } catch (error: unknown) {
        checks.database = 'error';
        checks.repositories = 'error';
        checks.functionality = 'error';
      }

      const isHealthy = Object.values(checks).every(
        (status) => status !== 'error',
      );

      return {
        success: isHealthy,
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Health check failed:', error);
      return {
        success: false,
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get detailed information about seeded data
   */
  @Get('data/info')
  @ApiOperation({
    summary: 'Get detailed information about seeded attribute data',
    description: `
    Returns detailed information about the seeded attribute data:
    - List of all attributes with their properties
    - Attribute values breakdown
    - Configuration details
    - Usage recommendations
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data information retrieved successfully',
  })
  @Permissions('admin:attributes:read')
  async getDataInfo() {
    try {
      const stats = await this.attributeSeederService.getStatistics();
      const validation = await this.attributeSeederService.validateSeededData();

      const dataInfo = {
        overview: {
          totalAttributes: stats.totalAttributes,
          totalValues: stats.totalValues,
          activeAttributes: stats.activeAttributes,
          dataQuality: validation.isValid ? 'good' : 'needs_attention',
        },
        attributeTypes: stats.attributesByType,
        dataIntegrity: {
          isValid: validation.isValid,
          issuesCount: validation.issues.length,
          recommendationsCount: validation.recommendations.length,
        },
        usage: {
          filtering: 'Use isFilterable attributes for product filtering',
          searching: 'Use isSearchable attributes for product search',
          required: 'isRequired attributes must be set for all products',
          localization: 'All attributes support Arabic/English localization',
        },
        recommendations: validation.recommendations,
      };

      return {
        success: true,
        data: dataInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to get data info:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

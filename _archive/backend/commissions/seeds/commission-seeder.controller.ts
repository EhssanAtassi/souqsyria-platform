/**
 * @file commission-seeder.controller.ts
 * @description Professional commission seeding controller with comprehensive APIs
 *
 * Provides REST endpoints for:
 * - Seeding commission rules and discount tiers
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
import { CommissionSeederService } from './commission-seeder.service';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';

@ApiTags('🌱 Commission Seeding')
@Controller('api/commissions/seeding')
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CommissionSeederController {
  private readonly logger = new Logger(CommissionSeederController.name);

  constructor(
    private readonly commissionSeederService: CommissionSeederService,
  ) {}

  /**
   * Seed commission system with comprehensive data
   */
  @Post('seed')
  @ApiOperation({
    summary: 'Seed commission system with comprehensive e-commerce data',
    description: `
    Seeds the database with comprehensive commission system data including:
    - Global commission rules and fallbacks (7% default rate)
    - Category-specific rates (Electronics: 8.5%, Fashion: 12%, etc.)
    - Vendor tier-based rates (Platinum: 5%, Gold: 6%, Silver: 7.5%, etc.)
    - Membership discount tiers (VIP Diamond: 25%, Gold: 20%, etc.)
    - Product-specific commission overrides
    - Proper validation rules and business logic
    
    Creates a complete 4-tier commission hierarchy system ready for production.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission system seeded successfully',
    schema: {
      example: {
        success: true,
        message: 'Commission system seeded successfully',
        data: {
          globalCommissionsCreated: 2,
          categoryCommissionsCreated: 8,
          vendorCommissionsCreated: 5,
          membershipDiscountsCreated: 5,
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
  @Permissions('admin:commissions:seed')
  async seedCommissions() {
    this.logger.log('🌱 Starting commission system seeding via API...');

    try {
      const startTime = Date.now();
      const result = await this.commissionSeederService.seedCommissions();
      const duration = Date.now() - startTime;

      this.logger.log(`✅ Commission seeding completed in ${duration}ms`);

      return {
        success: result.success,
        message: result.success
          ? 'Commission system seeded successfully'
          : 'Seeding completed with errors',
        data: {
          globalCommissionsCreated: result.globalCommissionsCreated,
          categoryCommissionsCreated: result.categoryCommissionsCreated,
          vendorCommissionsCreated: result.vendorCommissionsCreated,
          membershipDiscountsCreated: result.membershipDiscountsCreated,
          errors: result.errors,
          duration: `${duration}ms`,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Commission seeding failed:', error);
      return {
        success: false,
        message: 'Commission seeding failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get commission seeding statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get commission system seeding statistics',
    description: `
    Returns comprehensive statistics about seeded commission data:
    - Total commission rules count by type
    - Active vs inactive commission rules
    - Average commission rates
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
          totalGlobalCommissions: 2,
          totalCategoryCommissions: 8,
          totalVendorCommissions: 5,
          totalMembershipDiscounts: 5,
          totalProductCommissions: 0,
          activeCommissions: 1,
          averageCommissionRate: 7.0,
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  @Permissions('admin:commissions:read')
  async getStatistics() {
    try {
      const stats = await this.commissionSeederService.getStatistics();

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to get commission statistics:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Validate seeded commission data integrity
   */
  @Post('validate')
  @ApiOperation({
    summary: 'Validate seeded commission data integrity',
    description: `
    Performs comprehensive validation of seeded commission data:
    - Checks for active global commission rules
    - Identifies overlapping or conflicting rates
    - Validates commission rate reasonableness
    - Checks membership discount validity
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
            'Consider adding product-specific commission overrides',
            'Review high commission rates for business impact',
          ],
        },
        timestamp: '2025-08-16T17:30:00.000Z',
      },
    },
  })
  @Permissions('admin:commissions:validate')
  async validateData() {
    try {
      const validation =
        await this.commissionSeederService.validateSeededData();

      return {
        success: true,
        data: validation,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Commission validation failed:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Cleanup commission data (for testing)
   */
  @Delete('cleanup')
  @ApiOperation({
    summary: 'Clean up all seeded commission data',
    description: `
    ⚠️  DANGEROUS OPERATION ⚠️
    
    Removes ALL commission rules and discount data from the database.
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
        message: 'Commission cleanup completed successfully',
        data: {
          deleted: 20,
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
  @Permissions('admin:commissions:delete')
  async cleanup(@Body() body: { confirm: boolean }) {
    if (!body.confirm) {
      return {
        success: false,
        message: 'Commission cleanup cancelled: confirmation required',
        timestamp: new Date().toISOString(),
      };
    }

    this.logger.warn('🧹 Starting commission data cleanup...');

    try {
      const result = await this.commissionSeederService.cleanupCommissions();

      this.logger.log(
        `✅ Cleanup completed: ${result.deleted} commission records deleted`,
      );

      return {
        success: result.success,
        message: result.success
          ? 'Commission cleanup completed successfully'
          : 'Cleanup failed',
        data: {
          deleted: result.deleted,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Commission cleanup failed:', error);
      return {
        success: false,
        message: 'Cleanup failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Health check for commission seeding system
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for commission seeding system',
    description: `
    Performs a quick health check of the commission seeding system:
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
        await this.commissionSeederService.getStatistics();
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
   * Get detailed information about seeded commission data
   */
  @Get('data/info')
  @ApiOperation({
    summary: 'Get detailed information about seeded commission data',
    description: `
    Returns detailed information about the seeded commission data:
    - List of all commission rules with their properties
    - Commission tier breakdown
    - Configuration details
    - Usage recommendations
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data information retrieved successfully',
  })
  @Permissions('admin:commissions:read')
  async getDataInfo() {
    try {
      const stats = await this.commissionSeederService.getStatistics();
      const validation =
        await this.commissionSeederService.validateSeededData();

      const dataInfo = {
        overview: {
          totalCommissionRules:
            stats.totalGlobalCommissions +
            stats.totalCategoryCommissions +
            stats.totalVendorCommissions +
            stats.totalProductCommissions,
          totalMembershipDiscounts: stats.totalMembershipDiscounts,
          activeCommissions: stats.activeCommissions,
          averageCommissionRate: stats.averageCommissionRate,
          dataQuality: validation.isValid ? 'good' : 'needs_attention',
        },
        commissionBreakdown: {
          global: stats.totalGlobalCommissions,
          category: stats.totalCategoryCommissions,
          vendor: stats.totalVendorCommissions,
          product: stats.totalProductCommissions,
          membership: stats.totalMembershipDiscounts,
        },
        dataIntegrity: {
          isValid: validation.isValid,
          issuesCount: validation.issues.length,
          recommendationsCount: validation.recommendations.length,
        },
        usage: {
          hierarchy:
            '4-tier commission system: Product → Vendor → Category → Global',
          calculation:
            'Most specific rule takes precedence (product overrides vendor, etc.)',
          membership:
            'Membership discounts apply as percentage reduction of commission',
          validation:
            'All commission rates include minimum and maximum amount limits',
        },
        recommendations: validation.recommendations,
      };

      return {
        success: true,
        data: dataInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to get commission data info:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Preview commission calculation for sample scenarios
   */
  @Get('preview/calculation')
  @ApiOperation({
    summary: 'Preview commission calculations for sample scenarios',
    description: `
    Returns sample commission calculations to demonstrate how the seeded 
    commission system works across different scenarios:
    - Different product categories
    - Various vendor tiers
    - Membership discount applications
    - Edge cases and fallbacks
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission calculation preview generated successfully',
  })
  @Permissions('admin:commissions:read')
  async getCalculationPreview() {
    try {
      // Sample scenarios for demonstration
      const scenarios = [
        {
          scenario: 'Electronics - Platinum Vendor - VIP Diamond Member',
          productCategory: 'Electronics',
          vendorTier: 'Platinum',
          membershipTier: 'VIP Diamond',
          orderAmount: 500000, // 500,000 SYP
          calculatedCommission: {
            baseRate: 8.5, // Electronics category rate
            vendorDiscount: -3.5, // Platinum vendor gets 5% instead of 8.5%
            membershipDiscount: -1.25, // 25% discount on commission
            finalRate: 3.75,
            commissionAmount: 18750, // 500,000 * 3.75%
          },
        },
        {
          scenario: 'Fashion - Standard Vendor - Premium Member',
          productCategory: 'Fashion & Clothing',
          vendorTier: 'Standard',
          membershipTier: 'Premium',
          orderAmount: 150000, // 150,000 SYP
          calculatedCommission: {
            baseRate: 12.0, // Fashion category rate
            vendorDiscount: 0, // Standard vendor, no tier discount
            membershipDiscount: -1.2, // 10% discount on commission
            finalRate: 10.8,
            commissionAmount: 16200, // 150,000 * 10.8%
          },
        },
        {
          scenario: 'Books - Gold Vendor - No Membership',
          productCategory: 'Books & Media',
          vendorTier: 'Gold',
          membershipTier: 'None',
          orderAmount: 25000, // 25,000 SYP
          calculatedCommission: {
            baseRate: 5.5, // Books category rate
            vendorDiscount: 0.5, // Gold vendor gets 6% instead of 5.5%
            membershipDiscount: 0, // No membership discount
            finalRate: 6.0,
            commissionAmount: 1500, // 25,000 * 6%
          },
        },
        {
          scenario: 'Uncategorized Product - Bronze Vendor - Standard Member',
          productCategory: 'Uncategorized',
          vendorTier: 'Bronze',
          membershipTier: 'Standard',
          orderAmount: 75000, // 75,000 SYP
          calculatedCommission: {
            baseRate: 7.0, // Global fallback rate
            vendorDiscount: 1.5, // Bronze vendor gets 8.5% instead of 7%
            membershipDiscount: -0.425, // 5% discount on commission
            finalRate: 8.075,
            commissionAmount: 6056, // 75,000 * 8.075%
          },
        },
      ];

      return {
        success: true,
        data: {
          title: 'Commission Calculation Preview',
          description:
            'Sample scenarios demonstrating the 4-tier commission hierarchy',
          scenarios,
          notes: [
            'Commission rates are calculated in order: Product → Vendor → Category → Global',
            'Membership discounts are applied as percentage reduction of final commission',
            'All rates include minimum and maximum amount validation',
            'Actual calculations may vary based on specific business rules',
          ],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to generate calculation preview:', error);
      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

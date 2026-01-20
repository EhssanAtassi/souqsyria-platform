/**
 * @file manufacturers-seeder.controller.ts
 * @description Enterprise Manufacturers Seeding REST API Controller
 *
 * COMPREHENSIVE API FEATURES:
 * - Complete manufacturers seeding with Syrian business profiles
 * - 7-state verification workflow seeding operations
 * - Manufacturing categories and geographic distribution
 * - Performance benchmarks and business analytics
 * - Bulk generation capabilities for performance testing
 * - Data integrity verification and validation
 * - Comprehensive statistics and monitoring
 * - Real-time seeding progress tracking
 * - Error handling and transaction management
 * - Full Swagger API documentation with examples
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 * @version 1.0.0 - Enterprise Edition
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import {
  ManufacturersSeederService,
  ManufacturersSeedingConfig,
  ManufacturersSeedingStats,
  ManufacturersDataIntegrity,
} from './manufacturers-seeder.service';

/**
 * DTOs for API requests and responses
 */
class SeedAllManufacturersDto {
  sampleManufacturers?: boolean = true;
  workflowAnalytics?: boolean = true;
  categoriesData?: boolean = true;
  geographicDistribution?: boolean = true;
  performanceBenchmarks?: boolean = true;
  verificationWorkflow?: boolean = true;
  bulkGeneration?: number = 0;
  performanceTest?: boolean = false;
}

class BulkGenerationDto {
  count: number;
  performanceTest?: boolean = false;
}

class SeedingStatsResponseDto {
  overview: {
    totalManufacturers: number;
    verifiedManufacturers: number;
    pendingManufacturers: number;
    rejectedManufacturers: number;
    verificationRate: number;
  };
  businessTypeDistribution: Record<string, number>;
  performance: {
    averageQualityScore: number;
    averageDeliveryPerformance: number;
    averageCustomerSatisfaction: number;
    averageRating: number;
    dataFreshness: string;
    cacheHitRate: number;
  };
  usage: {
    dailyQueries: number;
    manufacturerViews: number;
  };
  lastUpdated: string;
}

class DataIntegrityResponseDto {
  isValid: boolean;
  issues: string[];
  summary: {
    totalManufacturers: number;
    verificationStatusDistribution: Record<string, number>;
    businessTypeDistribution: Record<string, number>;
    qualityMetrics: {
      averageQualityScore: number;
      averageCustomerSatisfaction: number;
      averageDeliveryPerformance: number;
    };
  } | null;
  timestamp: string;
}

@ApiTags('🏭 Manufacturers Seeding System')
@Controller('api/v1/seed/manufacturers')
export class ManufacturersSeederController {
  private readonly logger = new Logger(ManufacturersSeederController.name);

  constructor(
    private readonly manufacturersSeederService: ManufacturersSeederService,
  ) {
    this.logger.log('🚀 ManufacturersSeederController initialized successfully');
  }

  /**
   * Seed all manufacturers and analytics data
   */
  @Post('all')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed all manufacturers system data',
    description: `
    **Comprehensive manufacturers seeding operation including:**
    
    🏭 **Sample Manufacturers**: Syrian manufacturers with Arabic/English localization
    📊 **Workflow Analytics**: 7-state verification workflow data and metrics  
    🏭 **Categories Data**: Manufacturing categories and industrial specializations
    🗺️ **Geographic Distribution**: Distribution across Syrian governorates
    📈 **Performance Benchmarks**: Industry standards and KPI targets
    ✅ **Verification Workflow**: Business verification processes and compliance
    🚀 **Bulk Generation**: Optional bulk manufacturer generation for testing
    
    **Syrian Market Features:**
    - Complete business registration data (tax ID, commercial registry, licenses)
    - Arabic/English bilingual support with proper RTL text handling
    - Syrian governorate integration and geographic optimization
    - Quality scoring, delivery performance, and customer satisfaction metrics
    - Business type categorization and size classification
    - Export capabilities and certification tracking
    
    **Performance Optimization:**
    - Transaction-based operations for data integrity
    - Bulk operations for large-scale testing
    - Performance monitoring and execution time tracking
    - Error handling and rollback capabilities
    `,
  })
  @ApiBody({
    type: SeedAllManufacturersDto,
    description: 'Seeding configuration options',
    examples: {
      'Full Seeding': {
        summary: 'Complete manufacturers seeding',
        description: 'Seed all manufacturers data including samples, analytics, and workflows',
        value: {
          sampleManufacturers: true,
          workflowAnalytics: true,
          categoriesData: true,
          geographicDistribution: true,
          performanceBenchmarks: true,
          verificationWorkflow: true,
          bulkGeneration: 0,
          performanceTest: false,
        },
      },
      'Selective Seeding': {
        summary: 'Selective manufacturers seeding',
        description: 'Seed only specific components of the manufacturers system',
        value: {
          sampleManufacturers: true,
          workflowAnalytics: true,
          categoriesData: false,
          geographicDistribution: true,
          performanceBenchmarks: false,
          verificationWorkflow: true,
          bulkGeneration: 0,
          performanceTest: false,
        },
      },
      'Performance Testing': {
        summary: 'Bulk generation for performance testing',
        description: 'Generate large datasets for performance and load testing',
        value: {
          sampleManufacturers: true,
          workflowAnalytics: true,
          categoriesData: true,
          geographicDistribution: true,
          performanceBenchmarks: true,
          verificationWorkflow: true,
          bulkGeneration: 1000,
          performanceTest: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Manufacturers system seeded successfully with comprehensive statistics',
    content: {
      'application/json': {
        examples: {
          'Success Response': {
            summary: 'Successful seeding operation',
            value: {
              message: '✅ Manufacturers system seeded successfully with comprehensive Syrian business data',
              stats: {
                manufacturersCreated: 5,
                workflowDataCreated: 12,
                categoriesCreated: 25,
                geographicDataCreated: 20,
                benchmarksCreated: 8,
                verificationDataCreated: 15,
                bulkGeneratedCount: 0,
                totalExecutionTime: 2847,
                errors: [],
                warnings: [],
              },
              timestamp: '2025-08-20T19:30:00.000Z',
              executionTimeMs: 2847,
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding configuration provided',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Seeding operation failed due to system error',
  })
  async seedAll(@Body() config: SeedAllManufacturersDto) {
    const startTime = Date.now();
    this.logger.log('🌱 Starting comprehensive Manufacturers seeding...');

    try {
      // Validate configuration
      if (config.bulkGeneration && (config.bulkGeneration < 0 || config.bulkGeneration > 10000)) {
        throw new BadRequestException('Bulk generation count must be between 0 and 10000');
      }

      const stats = await this.manufacturersSeederService.seedAll(config);
      const executionTime = Date.now() - startTime;

      this.logger.log(`✅ Manufacturers seeding completed in ${executionTime}ms`);

      return {
        message: '✅ Manufacturers system seeded successfully with comprehensive Syrian business data',
        stats,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Manufacturers seeding failed after ${executionTime}ms:`, error);
      
      throw new BadRequestException({
        message: '❌ Manufacturers seeding operation failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      });
    }
  }

  /**
   * Seed sample Syrian manufacturers
   */
  @Post('sample-manufacturers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed sample Syrian manufacturers',
    description: `
    **Seed comprehensive Syrian manufacturer profiles including:**
    
    🏭 **Business Profiles**: Complete company information with Arabic/English names
    📊 **Performance Metrics**: Quality scores, delivery performance, customer satisfaction  
    🗺️ **Geographic Data**: Syrian governorate integration and location data
    ✅ **Verification Status**: 7-state verification workflow status and documents
    📈 **Business Analytics**: Revenue, product counts, ratings, and reviews
    🏗️ **Registration Data**: Syrian tax ID, commercial registry, industrial licenses
    
    **Sample manufacturers include:**
    - Damascus Steel Industries (Large manufacturer, verified)
    - Aleppo Textile Manufacturing (Medium manufacturer, heritage craft)
    - Syrian Tech Solutions (Modern technology manufacturer)
    - Homs Olive Oil Processing (Premium food producer, organic certified)
    - Lattakia Furniture Industries (Luxury furniture, artisan quality)
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sample Syrian manufacturers seeded successfully',
    content: {
      'application/json': {
        examples: {
          'Success Response': {
            summary: 'Successful sample manufacturers seeding',
            value: {
              message: '✅ Syrian manufacturer profiles seeded successfully',
              count: 5,
              manufacturers: [
                'Damascus Steel Industries Co.',
                'Aleppo Textile Manufacturing',
                'Syrian Tech Solutions',
                'Homs Olive Oil Processing',
                'Lattakia Furniture Industries',
              ],
              timestamp: '2025-08-20T19:30:00.000Z',
              executionTimeMs: 1234,
            },
          },
        },
      },
    },
  })
  async seedSampleManufacturers() {
    const startTime = Date.now();
    this.logger.log('🏭 Seeding sample Syrian manufacturers...');

    try {
      const stats = await this.manufacturersSeederService.seedAll({
        sampleManufacturers: true,
        workflowAnalytics: false,
        categoriesData: false,
        geographicDistribution: false,
        performanceBenchmarks: false,
        verificationWorkflow: false,
      });

      const executionTime = Date.now() - startTime;

      return {
        message: '✅ Syrian manufacturer profiles seeded successfully',
        count: stats.manufacturersCreated,
        manufacturers: [
          'Damascus Steel Industries Co.',
          'Aleppo Textile Manufacturing',
          'Syrian Tech Solutions',
          'Homs Olive Oil Processing',
          'Lattakia Furniture Industries',
        ],
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Sample manufacturers seeding failed:`, error);
      
      throw new BadRequestException({
        message: '❌ Failed to seed sample manufacturers',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      });
    }
  }

  /**
   * Seed workflow analytics data
   */
  @Post('workflow-analytics')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed verification workflow analytics',
    description: `
    **Seed comprehensive workflow analytics including:**
    
    📊 **Status Distribution**: Distribution across 7 verification states
    🏭 **Business Type Analytics**: Manufacturer type categorization data
    📏 **Size Distribution**: Company size category analytics
    ⏱️ **Processing Times**: Average times for each workflow stage
    📈 **SLA Compliance**: Service level agreement tracking data
    ❌ **Rejection Analysis**: Common rejection reasons and statistics
    
    **Workflow States:**
    - Draft → Submitted → Under Review → Verified
    - Rejected, Suspended, Expired states with analytics
    
    **Performance Metrics:**
    - Average verification processing time: 144 hours (6 days)
    - SLA compliance rate: 85.6%
    - Quality score distribution and benchmarks
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow analytics data seeded successfully',
  })
  async seedWorkflowAnalytics() {
    const startTime = Date.now();
    this.logger.log('📊 Seeding workflow analytics data...');

    try {
      const stats = await this.manufacturersSeederService.seedAll({
        sampleManufacturers: false,
        workflowAnalytics: true,
        categoriesData: false,
        geographicDistribution: false,
        performanceBenchmarks: false,
        verificationWorkflow: false,
      });

      const executionTime = Date.now() - startTime;

      return {
        message: '✅ Verification workflow analytics seeded successfully',
        count: stats.workflowDataCreated,
        analytics: {
          statusDistribution: '7 verification states',
          businessTypes: '6 manufacturer types',
          sizeCategories: '4 company sizes',
          averageMetrics: 'Quality, performance, satisfaction',
        },
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Workflow analytics seeding failed:`, error);
      
      throw new BadRequestException({
        message: '❌ Failed to seed workflow analytics',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      });
    }
  }

  /**
   * Seed manufacturing categories
   */
  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed manufacturing categories and specializations',
    description: `
    **Seed comprehensive manufacturing categories:**
    
    🍯 **Food & Beverages**: Olive oil, dairy, processed foods, traditional sweets
    🧵 **Textiles & Clothing**: Traditional fabrics, modern fashion, home textiles
    💻 **Electronics & Technology**: Consumer electronics, IoT devices, smart home
    🏗️ **Construction Materials**: Steel products, cement, building hardware
    🪑 **Furniture & Woodwork**: Luxury furniture, custom woodwork, traditional crafts
    
    **Each category includes:**
    - Arabic/English bilingual names and descriptions
    - Detailed specialization subcategories
    - Manufacturer count and distribution
    - Industry-specific characteristics
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Manufacturing categories seeded successfully',
  })
  async seedManufacturingCategories() {
    const startTime = Date.now();
    this.logger.log('🏭 Seeding manufacturing categories...');

    try {
      const stats = await this.manufacturersSeederService.seedAll({
        sampleManufacturers: false,
        workflowAnalytics: false,
        categoriesData: true,
        geographicDistribution: false,
        performanceBenchmarks: false,
        verificationWorkflow: false,
      });

      const executionTime = Date.now() - startTime;

      return {
        message: '✅ Manufacturing categories and specializations seeded successfully',
        count: stats.categoriesCreated,
        categories: [
          'Food & Beverages',
          'Textiles & Clothing',
          'Electronics & Technology',
          'Construction Materials',
          'Furniture & Woodwork',
        ],
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Categories seeding failed:`, error);
      
      throw new BadRequestException({
        message: '❌ Failed to seed manufacturing categories',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      });
    }
  }

  /**
   * Generate bulk manufacturers for testing
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate bulk manufacturers for performance testing',
    description: `
    **Generate large numbers of manufacturers for testing:**
    
    🚀 **Performance Testing**: Test system performance with large datasets
    📊 **Load Testing**: Verify database and API performance under load
    🎯 **Realistic Data**: Generated data follows real business patterns
    ⚡ **Optimized Generation**: Bulk operations for fast creation
    
    **Generated manufacturer characteristics:**
    - Realistic business names and details
    - Proper Syrian governorate distribution  
    - Valid business type and size classifications
    - Performance metrics within realistic ranges
    - Verification status distribution
    - Revenue and employee counts based on size
    
    **Recommended limits:**
    - Development: 100-500 manufacturers
    - Testing: 1000-5000 manufacturers  
    - Load testing: 5000-10000 manufacturers
    `,
  })
  @ApiBody({
    type: BulkGenerationDto,
    description: 'Bulk generation configuration',
    examples: {
      'Small Test': {
        summary: 'Small dataset for development',
        value: { count: 100, performanceTest: false },
      },
      'Medium Test': {
        summary: 'Medium dataset for testing',
        value: { count: 1000, performanceTest: true },
      },
      'Large Test': {
        summary: 'Large dataset for load testing',
        value: { count: 5000, performanceTest: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk manufacturers generated successfully',
  })
  async generateBulkManufacturers(@Body() bulkConfig: BulkGenerationDto) {
    const startTime = Date.now();
    this.logger.log(`🚀 Generating ${bulkConfig.count} bulk manufacturers...`);

    try {
      if (bulkConfig.count <= 0 || bulkConfig.count > 10000) {
        throw new BadRequestException('Count must be between 1 and 10000');
      }

      const stats = await this.manufacturersSeederService.seedAll({
        sampleManufacturers: false,
        workflowAnalytics: false,
        categoriesData: false,
        geographicDistribution: false,
        performanceBenchmarks: false,
        verificationWorkflow: false,
        bulkGeneration: bulkConfig.count,
        performanceTest: bulkConfig.performanceTest,
      });

      const executionTime = Date.now() - startTime;
      const manufacturersPerSecond = Math.round((stats.bulkGeneratedCount / executionTime) * 1000);

      return {
        message: `✅ Successfully generated ${stats.bulkGeneratedCount} bulk manufacturers`,
        analyticsCreated: stats.bulkGeneratedCount,
        performance: {
          executionTimeMs: executionTime,
          manufacturersPerSecond,
          averageTimePerManufacturer: Math.round(executionTime / stats.bulkGeneratedCount),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Bulk generation failed:`, error);
      
      throw new BadRequestException({
        message: '❌ Bulk manufacturers generation failed',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      });
    }
  }

  /**
   * Get comprehensive seeding statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get comprehensive manufacturers seeding statistics',
    description: `
    **Retrieve detailed statistics about the manufacturers system:**
    
    📊 **Overview Statistics**: Total, verified, pending, rejected manufacturers
    🏭 **Business Distribution**: Breakdown by manufacturer type and size
    📈 **Performance Metrics**: Quality scores, delivery performance, ratings
    📊 **Usage Analytics**: Daily queries, manufacturer views, system usage
    
    **Real-time Data Includes:**
    - Verification rate and approval statistics
    - Average quality and performance metrics
    - Business type and geographic distribution
    - System performance and cache statistics
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: SeedingStatsResponseDto,
  })
  async getSeedingStats(): Promise<SeedingStatsResponseDto> {
    this.logger.log('📊 Retrieving manufacturers seeding statistics...');

    try {
      const stats = await this.manufacturersSeederService.getSeedingStats();
      
      this.logger.log('✅ Statistics retrieved successfully');
      return stats;
    } catch (error) {
      this.logger.error('❌ Failed to retrieve statistics:', error);
      throw new BadRequestException({
        message: '❌ Failed to retrieve seeding statistics',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Verify data integrity
   */
  @Get('verify')
  @ApiOperation({
    summary: 'Verify manufacturers data integrity',
    description: `
    **Comprehensive data integrity verification:**
    
    ✅ **Data Validation**: Check for missing or corrupted manufacturer data
    📊 **Quality Metrics**: Verify performance metrics are within expected ranges
    🔍 **Business Logic**: Validate business rules and constraints
    📈 **Distribution Analysis**: Check verification status and type distributions
    
    **Integrity Checks Include:**
    - Minimum data presence requirements
    - Performance metric thresholds
    - Verification rate compliance
    - Data consistency validation
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data integrity verification completed',
    type: DataIntegrityResponseDto,
  })
  async verifyDataIntegrity(): Promise<DataIntegrityResponseDto> {
    this.logger.log('🔍 Verifying manufacturers data integrity...');

    try {
      const result = await this.manufacturersSeederService.verifyDataIntegrity();
      
      const response: DataIntegrityResponseDto = {
        ...result,
        timestamp: new Date().toISOString(),
      };

      if (result.isValid) {
        this.logger.log('✅ Data integrity verification passed');
      } else {
        this.logger.warn(`⚠️ Data integrity issues found: ${result.issues.join(', ')}`);
      }

      return response;
    } catch (error) {
      this.logger.error('❌ Data integrity verification failed:', error);
      throw new BadRequestException({
        message: '❌ Data integrity verification failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Clear all manufacturers data
   */
  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear all manufacturers data',
    description: `
    **⚠️ DESTRUCTIVE OPERATION - Clear all manufacturers data**
    
    **This operation will permanently delete:**
    - All Syrian manufacturer profiles and business data
    - Verification workflow states and history
    - Performance metrics and analytics data
    - Business registration and compliance information
    - Geographic distribution and category data
    
    **⚠️ WARNING: This operation cannot be undone!**
    
    Use this endpoint carefully and only when:
    - Resetting development/testing environments
    - Cleaning up after bulk testing operations
    - Preparing for fresh data import
    
    **Data Backup Recommended**: Ensure you have proper backups before clearing data.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All manufacturers data cleared successfully',
    content: {
      'application/json': {
        examples: {
          'Success Response': {
            summary: 'Successful data clearing',
            value: {
              message: '✅ All Manufacturers data has been permanently cleared',
              warning: '⚠️ This operation cannot be undone',
              timestamp: '2025-08-20T19:30:00.000Z',
              clearedComponents: [
                'Syrian manufacturer profiles',
                'Verification workflow data',
                'Performance metrics',
                'Business analytics',
                'Geographic distribution',
                'Category assignments',
              ],
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to clear manufacturers data',
  })
  async clearAllData() {
    const startTime = Date.now();
    this.logger.warn('🧹 DESTRUCTIVE: Clearing all manufacturers data...');

    try {
      await this.manufacturersSeederService.clearAllData();
      const executionTime = Date.now() - startTime;

      this.logger.warn(`✅ All manufacturers data cleared in ${executionTime}ms`);

      return {
        message: '✅ All Manufacturers data has been permanently cleared',
        warning: '⚠️ This operation cannot be undone',
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
        clearedComponents: [
          'Syrian manufacturer profiles',
          'Verification workflow data',
          'Performance metrics',
          'Business analytics',
          'Geographic distribution',
          'Category assignments',
        ],
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Failed to clear manufacturers data:`, error);
      
      throw new BadRequestException({
        message: '❌ Failed to clear manufacturers data',
        error: error.message,
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
      });
    }
  }
}
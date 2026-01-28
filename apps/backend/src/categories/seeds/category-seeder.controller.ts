/**
 * @file category-seeder.controller.ts
 * @description Enterprise Category Seeding Controller for SouqSyria Platform
 *
 * SEEDING ENDPOINTS:
 * - Comprehensive category seeding with hierarchical structure
 * - Type-specific seeding (Root, Electronics, Fashion, Food)
 * - Statistics and health monitoring
 * - Cleanup and maintenance operations
 * - Validation and dry-run capabilities
 * - Performance monitoring and analytics
 * - Hierarchical integrity validation
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
  CategorySeederService,
  CategorySeedOptions,
  CategorySeedResult,
} from './category-seeder.service';
import { CATEGORY_STATISTICS, ALL_CATEGORY_SEEDS } from './category-seeds.data';

/**
 * DTO Classes for API Documentation and Validation
 */

/**
 * Category Seeding Options DTO
 */
export class CategorySeedOptionsDto implements CategorySeedOptions {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeRoot?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeElectronics?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeFashion?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeFood?: boolean = true;

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
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((level) => parseInt(level.trim()));
    }
    return value;
  })
  specificDepthLevels?: number[] = [];

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
  onlyFeatured?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  onlyApproved?: boolean = false;

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
  validateHierarchy?: boolean = true;
}

/**
 * Cleanup Options DTO
 */
export class CategoryCleanupOptionsDto {
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
 * ✅ CATEGORY SEEDER CONTROLLER: Comprehensive API endpoints for category seeding
 */
@ApiTags('🌱 Category Seeding')
@Controller('categories/seeding')
@UseGuards() // Add your authentication guards here
@ApiBearerAuth()
export class CategorySeederController {
  private readonly logger = new Logger(CategorySeederController.name);

  constructor(private readonly categorySeederService: CategorySeederService) {}

  /**
   * ✅ SEED ALL CATEGORIES: Main seeding endpoint with comprehensive options
   */
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed categories with comprehensive hierarchical options',
    description: `
      Comprehensive category seeding with advanced filtering and hierarchical processing options.
      
      **Features:**
      - Hierarchical category structure with parent-child relationships
      - Support for Root, Electronics, Fashion, and Food categories
      - Batch processing with transaction safety
      - Duplicate detection and conflict resolution
      - Dry run capability for testing
      - Performance monitoring and analytics
      - Hierarchical integrity validation
      
      **Category Types:**
      - Root: ${CATEGORY_STATISTICS.root} top-level categories
      - Electronics: Smartphones, Laptops, TVs, Appliances
      - Fashion: Men's, Women's, Traditional Wear, Shoes
      - Food: Syrian Specialties, Fresh Produce, Pantry Essentials
      - Total Available: ${CATEGORY_STATISTICS.total} categories
    `,
  })
  @ApiBody({
    description: 'Seeding options and filters',
    type: CategorySeedOptionsDto,
    examples: {
      'Default Seeding': {
        summary: 'Seed all category types with default options',
        value: {
          includeRoot: true,
          includeElectronics: true,
          includeFashion: true,
          includeFood: true,
          batchSize: 50,
          skipDuplicates: true,
          validateHierarchy: true,
        },
      },
      'Root Categories Only': {
        summary: 'Seed only root-level categories',
        value: {
          includeRoot: true,
          includeElectronics: false,
          includeFashion: false,
          includeFood: false,
          specificDepthLevels: [0],
        },
      },
      'Featured Categories': {
        summary: 'Seed only featured categories',
        value: {
          onlyFeatured: true,
          minPopularityScore: 85,
          batchSize: 25,
        },
      },
      'Hierarchical Dry Run': {
        summary: 'Test hierarchical seeding without making changes',
        value: {
          dryRun: true,
          validateHierarchy: true,
          validateOnly: false,
          batchSize: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category seeding completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Category seeding completed successfully',
        },
        result: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            totalProcessed: { type: 'number', example: 28 },
            created: { type: 'number', example: 22 },
            updated: { type: 'number', example: 4 },
            skipped: { type: 'number', example: 2 },
            errors: { type: 'number', example: 0 },
            processingTimeMs: { type: 'number', example: 3250 },
            statistics: {
              type: 'object',
              example: CATEGORY_STATISTICS,
            },
            hierarchy: {
              type: 'object',
              properties: {
                levelsProcessed: { type: 'number', example: 2 },
                rootCategoriesCreated: { type: 'number', example: 10 },
                childCategoriesCreated: { type: 'number', example: 12 },
                hierarchyValidation: { type: 'boolean', example: true },
              },
            },
            performance: {
              type: 'object',
              properties: {
                averageTimePerCategory: { type: 'number', example: 116.1 },
                batchProcessingTime: { type: 'number', example: 3250 },
                dbOperationTime: { type: 'number', example: 2890 },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid seeding options or hierarchy validation failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding',
  })
  async seedCategories(
    @Body(ValidationPipe) options: CategorySeedOptionsDto,
  ): Promise<{
    success: boolean;
    message: string;
    result: CategorySeedResult;
    timestamp: string;
  }> {
    const startTime = Date.now();

    this.logger.log(
      `🌱 Starting category seeding with options: ${JSON.stringify(options)}`,
    );

    try {
      const result = await this.categorySeederService.seedCategories(options);
      const totalTime = Date.now() - startTime;

      this.logger.log(
        `✅ Category seeding completed successfully in ${totalTime}ms`,
      );
      this.logger.log(
        `📊 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`,
      );
      this.logger.log(
        `🏗️ Hierarchy: ${result.hierarchy.levelsProcessed} levels, ${result.hierarchy.rootCategoriesCreated} root, ${result.hierarchy.childCategoriesCreated} children`,
      );

      return {
        success: true,
        message: options.dryRun
          ? 'Dry run completed successfully'
          : 'Category seeding completed successfully',
        result,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const totalTime = Date.now() - startTime;

      this.logger.error(
        `❌ Category seeding failed after ${totalTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw error;
    }
  }

  /**
   * ✅ SEED ROOT CATEGORIES: Seed only root-level categories
   */
  @Post('seed/root')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed root categories only',
    description: `
      Seed only top-level root categories for the Syrian e-commerce platform.
      
      **Root Categories Available:** ${CATEGORY_STATISTICS.root}
      **Categories:** Electronics, Fashion, Home & Living, Food & Groceries, Health & Beauty, Sports & Fitness, Automotive, Books & Education, Traditional Crafts, Baby & Kids
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Root categories seeded successfully',
  })
  async seedRootCategories(): Promise<{
    success: boolean;
    message: string;
    result: CategorySeedResult;
  }> {
    this.logger.log('🌳 Seeding root categories...');

    const result = await this.categorySeederService.seedRootCategories();

    return {
      success: true,
      message: 'Root categories seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED ELECTRONICS CATEGORIES: Seed electronics subcategories
   */
  @Post('seed/electronics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed electronics categories and subcategories',
    description: `
      Seed electronics categories including smartphones, laptops, TVs, and home appliances.
      
      **Electronics Categories:** Smartphones, Laptops & Computers, TVs & Audio, Home Appliances
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Electronics categories seeded successfully',
  })
  async seedElectronicsCategories(): Promise<{
    success: boolean;
    message: string;
    result: CategorySeedResult;
  }> {
    this.logger.log('📱 Seeding electronics categories...');

    const result = await this.categorySeederService.seedElectronicsCategories();

    return {
      success: true,
      message: 'Electronics categories seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED FASHION CATEGORIES: Seed fashion subcategories
   */
  @Post('seed/fashion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed fashion categories and subcategories',
    description: `
      Seed fashion categories including men's, women's, traditional wear, and footwear.
      
      **Fashion Categories:** Men's Fashion, Women's Fashion, Traditional Wear, Shoes & Footwear
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Fashion categories seeded successfully',
  })
  async seedFashionCategories(): Promise<{
    success: boolean;
    message: string;
    result: CategorySeedResult;
  }> {
    this.logger.log('👗 Seeding fashion categories...');

    const result = await this.categorySeederService.seedFashionCategories();

    return {
      success: true,
      message: 'Fashion categories seeded successfully',
      result,
    };
  }

  /**
   * ✅ SEED FOOD CATEGORIES: Seed food subcategories
   */
  @Post('seed/food')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed food categories and subcategories',
    description: `
      Seed food categories including Syrian specialties, fresh produce, and pantry essentials.
      
      **Food Categories:** Syrian Specialties, Fresh Produce, Pantry Essentials
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Food categories seeded successfully',
  })
  async seedFoodCategories(): Promise<{
    success: boolean;
    message: string;
    result: CategorySeedResult;
  }> {
    this.logger.log('🍽️ Seeding food categories...');

    const result = await this.categorySeederService.seedFoodCategories();

    return {
      success: true,
      message: 'Food categories seeded successfully',
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
      - Seed data availability by category type and hierarchy level
      - Current database statistics with hierarchical analysis
      - Seeding progress and missing data analysis
      - Performance metrics and recommendations
      - Hierarchical integrity validation
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
          example: CATEGORY_STATISTICS,
        },
        database: {
          type: 'object',
          properties: {
            totalCategories: { type: 'number', example: 18 },
            rootCategories: { type: 'number', example: 10 },
            featuredCategories: { type: 'number', example: 8 },
            approvedCategories: { type: 'number', example: 16 },
            activeCategories: { type: 'number', example: 17 },
            maxDepthLevel: { type: 'number', example: 1 },
          },
        },
        comparison: {
          type: 'object',
          properties: {
            seedingProgress: { type: 'number', example: 64 },
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

    const statistics = await this.categorySeederService.getSeedingStatistics();

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
    summary: 'Validate seed data and hierarchical integrity',
    description: `
      Validate the integrity and quality of seed data without making any database changes.
      
      **Validation Checks:**
      - Required field validation
      - Data format validation  
      - Duplicate detection
      - Hierarchical structure validation
      - Parent-child relationship validation
      - Business rule compliance
    `,
  })
  @ApiBody({
    description: 'Validation options',
    type: CategorySeedOptionsDto,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed successfully',
  })
  async validateSeedData(
    @Body(ValidationPipe) options: CategorySeedOptionsDto = {},
  ): Promise<{
    success: boolean;
    message: string;
    result: CategorySeedResult;
  }> {
    this.logger.log('🔍 Validating seed data...');

    const validationOptions = { ...options, validateOnly: true };
    const result =
      await this.categorySeederService.seedCategories(validationOptions);

    return {
      success: result.success,
      message: result.success
        ? 'Seed data validation passed'
        : 'Seed data validation failed',
      result,
    };
  }

  /**
   * ✅ CLEANUP CATEGORIES: Remove seeded categories
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cleanup seeded categories with hierarchical safety',
    description: `
      Remove categories that were created from seed data with proper hierarchical deletion order.
      
      **Safety Features:**
      - Only removes seed data categories by default
      - Requires confirmation code for complete deletion
      - Supports dry run for safe testing
      - Hierarchical deletion (children first, then parents)
      
      **Confirmation Code for Complete Deletion:** DELETE_ALL_CATEGORIES_CONFIRMED
    `,
  })
  @ApiQuery({
    name: 'onlySeedData',
    description: 'Only delete categories from seed data (safer)',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'confirmationCode',
    description:
      'Required for complete deletion: DELETE_ALL_CATEGORIES_CONFIRMED',
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
  async cleanupCategories(
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
      `🧹 Starting category cleanup (onlySeedData: ${onlySeedData}, dryRun: ${dryRun})`,
    );

    const result = await this.categorySeederService.cleanupCategories({
      onlySeedData,
      confirmationCode,
      dryRun,
    });

    const message = dryRun
      ? `Dry run: Would delete ${result.deletedCount} categories`
      : `Successfully deleted ${result.deletedCount} categories`;

    const warning = !onlySeedData
      ? 'WARNING: Complete category deletion performed'
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
    summary: 'Check seeding service health and hierarchical integrity',
    description:
      'Verify database connectivity, seed data integrity, hierarchical structure, and service health.',
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
        hierarchyIntegrity: { type: 'string', enum: ['valid', 'invalid'] },
        statistics: { type: 'object' },
        lastCheck: { type: 'string', format: 'date-time' },
      },
    },
  })
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    seedDataIntegrity: 'valid' | 'invalid';
    hierarchyIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
    message: string;
  }> {
    this.logger.log('💚 Performing health check...');

    const health = await this.categorySeederService.healthCheck();

    return {
      ...health,
      message:
        health.status === 'healthy'
          ? 'Category seeding service is healthy'
          : 'Category seeding service has issues',
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
      - ${CATEGORY_STATISTICS.total} total categories
      - ${CATEGORY_STATISTICS.root} root categories  
      - ${CATEGORY_STATISTICS.subcategories} subcategories
      - ${CATEGORY_STATISTICS.featured} featured categories
      - ${CATEGORY_STATISTICS.approved} approved categories
      - ${CATEGORY_STATISTICS.hierarchyLevels} hierarchy levels
      - Average popularity score: ${CATEGORY_STATISTICS.averagePopularityScore}
      - Average commission rate: ${CATEGORY_STATISTICS.averageCommissionRate}%
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seed data information retrieved successfully',
  })
  getSeedDataInfo(): {
    success: boolean;
    message: string;
    data: typeof CATEGORY_STATISTICS;
    categoryTypes: {
      root: { count: number; description: string };
      electronics: { count: number; description: string };
      fashion: { count: number; description: string };
      food: { count: number; description: string };
    };
    hierarchy: {
      levels: number;
      description: string;
    };
  } {
    return {
      success: true,
      message: 'Seed data information retrieved successfully',
      data: CATEGORY_STATISTICS,
      categoryTypes: {
        root: {
          count: CATEGORY_STATISTICS.root,
          description: 'Top-level categories with Syrian market focus',
        },
        electronics: {
          count: 4,
          description:
            'Electronics subcategories: Smartphones, Laptops, TVs, Appliances',
        },
        fashion: {
          count: 4,
          description:
            "Fashion subcategories: Men's, Women's, Traditional, Shoes",
        },
        food: {
          count: 3,
          description:
            'Food subcategories: Syrian Specialties, Fresh Produce, Pantry',
        },
      },
      hierarchy: {
        levels: CATEGORY_STATISTICS.hierarchyLevels,
        description:
          'Multi-level hierarchical structure with parent-child relationships',
      },
    };
  }

  /**
   * ✅ GET HIERARCHY PREVIEW: Preview hierarchical structure
   */
  @Get('hierarchy/preview')
  @ApiOperation({
    summary: 'Get hierarchical category structure preview',
    description:
      'Preview the hierarchical structure of categories that would be seeded.',
  })
  @ApiQuery({
    name: 'maxDepth',
    description: 'Maximum depth level to show',
    required: false,
    type: Number,
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Hierarchy preview retrieved successfully',
  })
  getHierarchyPreview(@Query('maxDepth') maxDepth: number = 2): {
    success: boolean;
    message: string;
    hierarchy: any[];
    statistics: {
      totalCategories: number;
      levelCounts: { [key: number]: number };
    };
  } {
    // Build hierarchical structure for preview
    const hierarchy: any[] = [];
    const levelCounts: { [key: number]: number } = {};

    // Group categories by level
    for (let level = 0; level <= maxDepth; level++) {
      const categoriesAtLevel = ALL_CATEGORY_SEEDS.filter(
        (cat) => cat.depthLevel === level,
      );
      levelCounts[level] = categoriesAtLevel.length;

      if (level === 0) {
        // Root categories
        hierarchy.push(
          ...categoriesAtLevel.map((cat) => ({
            nameEn: cat.nameEn,
            nameAr: cat.nameAr,
            slug: cat.slug,
            level: cat.depthLevel,
            children: [],
          })),
        );
      } else {
        // Add children to their parents
        for (const category of categoriesAtLevel) {
          if (category.parentSlug) {
            const parent = this.findInHierarchy(hierarchy, category.parentSlug);
            if (parent) {
              parent.children.push({
                nameEn: category.nameEn,
                nameAr: category.nameAr,
                slug: category.slug,
                level: category.depthLevel,
                children: [],
              });
            }
          }
        }
      }
    }

    return {
      success: true,
      message: 'Hierarchy preview retrieved successfully',
      hierarchy,
      statistics: {
        totalCategories: Object.values(levelCounts).reduce(
          (sum, count) => sum + count,
          0,
        ),
        levelCounts,
      },
    };
  }

  // Helper method for hierarchy preview
  private findInHierarchy(hierarchy: any[], slug: string): any {
    for (const item of hierarchy) {
      if (item.slug === slug) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = this.findInHierarchy(item.children, slug);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}

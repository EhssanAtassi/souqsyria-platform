/**
 * @file product-seeder.controller.ts
 * @description Enterprise Product Seeding REST API Controller
 *
 * CONTROLLER FEATURES:
 * - Comprehensive product seeding endpoints with Syrian business focus
 * - Category-specific seeding (Electronics, Fashion, Food, etc.)
 * - Advanced filtering and validation capabilities
 * - Statistics and health monitoring endpoints
 * - Cleanup and maintenance operations
 * - Bulk operations with transaction safety
 * - Performance monitoring and analytics
 * - Full Swagger documentation
 * - Syrian market localization support
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
  HttpStatus,
  HttpCode,
  UseGuards,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiProperty,
  ApiBearerAuth,
  ApiParam,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import {
  ProductSeederService,
  ProductSeedOptions,
  ProductSeedResult,
} from './product-seeder.service';
import { PRODUCT_STATISTICS } from './product-seeds.data';

/**
 * DTO Classes for API Documentation and Validation
 */

class ProductSeedOptionsDto implements ProductSeedOptions {
  @ApiProperty({
    description: 'Include electronics products in seeding',
    required: false,
    type: Boolean,
    example: true,
  })
  includeElectronics?: boolean;

  @ApiProperty({
    description: 'Include fashion products in seeding',
    required: false,
    type: Boolean,
    example: true,
  })
  includeFashion?: boolean;

  @ApiProperty({
    description: 'Include food & beverage products in seeding',
    required: false,
    type: Boolean,
    example: true,
  })
  includeFood?: boolean;

  @ApiProperty({
    description: 'Include home & garden products in seeding',
    required: false,
    type: Boolean,
    example: true,
  })
  includeHomeGarden?: boolean;

  @ApiProperty({
    description: 'Include books & education products in seeding',
    required: false,
    type: Boolean,
    example: true,
  })
  includeBooksEducation?: boolean;

  @ApiProperty({
    description: 'Clear existing products before seeding (DANGEROUS)',
    required: false,
    type: Boolean,
    example: false,
  })
  clearExisting?: boolean;

  @ApiProperty({
    description: 'Batch size for processing (1-100)',
    required: false,
    type: Number,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  batchSize?: number;

  @ApiProperty({
    description: 'Only validate data without creating products',
    required: false,
    type: Boolean,
    example: false,
  })
  validateOnly?: boolean;

  @ApiProperty({
    description: 'Skip duplicate products during seeding',
    required: false,
    type: Boolean,
    example: true,
  })
  skipDuplicates?: boolean;

  @ApiProperty({
    description: 'Update existing products if found',
    required: false,
    type: Boolean,
    example: false,
  })
  updateExisting?: boolean;

  @ApiProperty({
    description: 'Specific category slugs to include',
    required: false,
    type: [String],
    example: ['electronics', 'fashion'],
  })
  specificCategories?: string[];

  @ApiProperty({
    description: 'Specific vendor types to include',
    required: false,
    type: [String],
    example: ['small_business', 'medium_business'],
  })
  specificVendorTypes?: string[];

  @ApiProperty({
    description: 'Specific brand slugs to include',
    required: false,
    type: [String],
    example: ['samsung', 'al-ghouta'],
  })
  specificBrands?: string[];

  @ApiProperty({
    description: 'Only include products made in Syria',
    required: false,
    type: Boolean,
    example: false,
  })
  onlyMadeInSyria?: boolean;

  @ApiProperty({
    description: 'Only include traditional Syrian products',
    required: false,
    type: Boolean,
    example: false,
  })
  onlyTraditional?: boolean;

  @ApiProperty({
    description: 'Only include handmade products',
    required: false,
    type: Boolean,
    example: false,
  })
  onlyHandmade?: boolean;

  @ApiProperty({
    description: 'Only include featured products',
    required: false,
    type: Boolean,
    example: false,
  })
  onlyFeatured?: boolean;

  @ApiProperty({
    description: 'Only include products with diaspora shipping',
    required: false,
    type: Boolean,
    example: false,
  })
  onlyWithDiasporaShipping?: boolean;

  @ApiProperty({
    description: 'Minimum price in SYP',
    required: false,
    type: Number,
    minimum: 0,
    example: 100000,
  })
  priceRangeMin?: number;

  @ApiProperty({
    description: 'Maximum price in SYP',
    required: false,
    type: Number,
    minimum: 0,
    example: 50000000,
  })
  priceRangeMax?: number;

  @ApiProperty({
    description: 'Specific approval statuses to include',
    required: false,
    type: [String],
    example: ['approved', 'pending'],
  })
  specificApprovalStatus?: string[];

  @ApiProperty({
    description: 'Specific seasonality to include',
    required: false,
    type: [String],
    example: ['winter', 'year-round'],
  })
  specificSeasonality?: string[];

  @ApiProperty({
    description: 'Perform dry run without actual database changes',
    required: false,
    type: Boolean,
    example: false,
  })
  dryRun?: boolean;

  @ApiProperty({
    description:
      'Validate all product relationships (categories, brands, etc.)',
    required: false,
    type: Boolean,
    example: true,
  })
  validateRelationships?: boolean;

  @ApiProperty({
    description: 'Create missing relationships automatically',
    required: false,
    type: Boolean,
    example: false,
  })
  createMissingRelationships?: boolean;
}

@ApiTags('🌱 Product Seeding')
@Controller('products/seeding')
@ApiBearerAuth()
export class ProductSeederController {
  constructor(private readonly productSeederService: ProductSeederService) {}

  /**
   * ✅ GET SEED DATA INFORMATION: Return available seed data information
   */
  @Get('data/info')
  @ApiOperation({
    summary: 'Get product seed data information',
    description: `
      Returns comprehensive information about available product seed data.
      
      **Features:**
      - Total products available for seeding
      - Breakdown by categories (Electronics, Fashion, Food, etc.)
      - Distribution by vendor types and business features
      - Statistical overview of seed data
      - Syrian market specific metrics
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product seed data information retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          total: 8,
          electronics: 3,
          fashion: 2,
          food: 2,
          homeGarden: 1,
          booksEducation: 1,
          approved: 8,
          madeInSyria: 6,
          traditional: 4,
          handmade: 3,
        },
        categories: {
          electronics: ['smartphones', 'laptops', 'tv'],
          fashion: ['traditional', 'modern'],
          food: ['spices', 'oils'],
          homeGarden: ['tools'],
          booksEducation: ['cookbooks'],
        },
        businessFeatures: {
          madeInSyria: 6,
          traditional: 4,
          handmade: 3,
          organic: 4,
          diasporaShipping: 7,
        },
        vendorTypes: {
          individual: 0,
          smallBusiness: 4,
          mediumBusiness: 4,
          enterprise: 0,
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve seed data information',
  })
  async getSeedDataInfo() {
    try {
      return {
        success: true,
        data: PRODUCT_STATISTICS,
        categories: {
          electronics: ['smartphones', 'laptops', 'smart-tv'],
          fashion: ['traditional-clothing', 'modern-apparel'],
          food: ['spices', 'olive-oil'],
          homeGarden: ['garden-tools'],
          booksEducation: ['cookbooks'],
        },
        businessFeatures: {
          madeInSyria: PRODUCT_STATISTICS.madeInSyria,
          traditional: PRODUCT_STATISTICS.traditional,
          handmade: PRODUCT_STATISTICS.handmade,
          organic: PRODUCT_STATISTICS.organic,
          cultural: PRODUCT_STATISTICS.cultural,
        },
        vendorTypes: {
          individual: PRODUCT_STATISTICS.individual,
          smallBusiness: PRODUCT_STATISTICS.smallBusiness,
          mediumBusiness: PRODUCT_STATISTICS.mediumBusiness,
          enterprise: PRODUCT_STATISTICS.enterprise,
        },
        productTypes: {
          simple: PRODUCT_STATISTICS.simple,
          variable: PRODUCT_STATISTICS.variable,
        },
        message: `${PRODUCT_STATISTICS.total} products available for seeding across ${Object.keys(PRODUCT_STATISTICS).filter((k) => !['total', 'approved', 'pending', 'draft'].includes(k)).length} categories`,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve seed data information',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ GET COMPREHENSIVE STATISTICS: Return detailed statistics about seeding status
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get comprehensive product seeding statistics',
    description: `
      Returns detailed statistics comparing available seed data with database state.
      
      **Includes:**
      - Seed data metrics
      - Database state analysis
      - Seeding progress tracking
      - Performance insights
      - Relationship validation status
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comprehensive statistics retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          seedData: { total: 8, electronics: 3 },
          database: { totalProducts: 5, activeProducts: 4 },
          comparison: { seedingProgress: 62, missingFromDb: 3 },
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to generate statistics',
  })
  async getComprehensiveStatistics() {
    try {
      const statistics = await this.productSeederService.getSeedingStatistics();
      return {
        success: true,
        data: statistics,
        message: `Database contains ${statistics.database.totalProducts} products out of ${statistics.seedData.total} available in seed data`,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ GET PRODUCTS PREVIEW: Return preview of products that would be seeded
   */
  @Get('products/preview')
  @ApiOperation({
    summary: 'Preview products that would be seeded',
    description: `
      Returns a preview of products that would be created based on filters.
      Useful for validating seeding parameters before execution.
    `,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug',
  })
  @ApiQuery({
    name: 'vendorType',
    required: false,
    description: 'Filter by vendor type',
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    description: 'Filter by brand slug',
  })
  @ApiQuery({
    name: 'madeInSyria',
    required: false,
    type: Boolean,
    description: 'Filter made in Syria products',
  })
  @ApiQuery({
    name: 'traditional',
    required: false,
    type: Boolean,
    description: 'Filter traditional products',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit number of results',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products preview retrieved successfully',
    schema: {
      example: {
        success: true,
        products: [
          {
            nameEn: 'Samsung Galaxy A54 128GB',
            nameAr: 'سامسونغ غالاكسي A54 بسعة 128 جيجا',
            sku: 'SAMSUNG-A54-128-BLK',
            categorySlug: 'electronics',
            basePriceSYP: 12500000,
            vendorType: 'medium_business',
          },
        ],
        statistics: {
          total: 1,
          categories: { electronics: 1 },
          vendorTypes: { mediumBusiness: 1 },
        },
      },
    },
  })
  async getProductsPreview(
    @Query('category') category?: string,
    @Query('vendorType') vendorType?: string,
    @Query('brand') brand?: string,
    @Query('madeInSyria') madeInSyria?: boolean,
    @Query('traditional') traditional?: boolean,
    @Query('limit') limit?: number,
  ) {
    try {
      // Import the helper functions from seed data
      const {
        getProductsByCategory,
        getProductsByVendorType,
        getProductsByBrand,
        getMadeInSyriaProducts,
        getTraditionalProducts,
      } = require('./product-seeds.data');

      let products = [...require('./product-seeds.data').ALL_PRODUCT_SEEDS];

      // Apply filters
      if (category) {
        products = getProductsByCategory(category);
      }
      if (vendorType) {
        products = products.filter((p) => p.vendorType === vendorType);
      }
      if (brand) {
        products = products.filter((p) => p.brandSlug === brand);
      }
      if (madeInSyria) {
        products = products.filter((p) => p.syrianBusinessFeatures.madeInSyria);
      }
      if (traditional) {
        products = products.filter(
          (p) => p.syrianBusinessFeatures.traditionalProduct,
        );
      }

      // Apply limit
      if (limit && limit > 0) {
        products = products.slice(0, limit);
      }

      // Calculate statistics
      const categoryStats = {};
      const vendorTypeStats = {};

      products.forEach((product) => {
        categoryStats[product.categorySlug] =
          (categoryStats[product.categorySlug] || 0) + 1;
        vendorTypeStats[product.vendorType] =
          (vendorTypeStats[product.vendorType] || 0) + 1;
      });

      return {
        success: true,
        products: products.map((p) => ({
          nameEn: p.nameEn,
          nameAr: p.nameAr,
          sku: p.sku,
          categorySlug: p.categorySlug,
          brandSlug: p.brandSlug,
          basePriceSYP: p.basePriceSYP,
          vendorType: p.vendorType,
          isFeatured: p.isFeatured,
          syrianBusinessFeatures: p.syrianBusinessFeatures,
        })),
        statistics: {
          total: products.length,
          categoryDistribution: categoryStats,
          vendorTypeDistribution: vendorTypeStats,
        },
        message: `Found ${products.length} products matching the specified criteria`,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to generate products preview',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ VALIDATE SEED DATA: Validate product data without creating anything
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate product seed data',
    description: `
      Validates product seed data without creating any database records.
      Checks for data integrity, relationship consistency, and business rule compliance.
    `,
  })
  @ApiBody({
    type: ProductSeedOptionsDto,
    description: 'Validation options and filters',
    examples: {
      basic: {
        summary: 'Basic validation',
        value: {
          includeElectronics: true,
          includeFashion: true,
          validateRelationships: true,
        },
      },
      advanced: {
        summary: 'Advanced validation with filters',
        value: {
          includeElectronics: true,
          specificVendorTypes: ['small_business', 'medium_business'],
          onlyMadeInSyria: true,
          validateRelationships: true,
          priceRangeMin: 100000,
          priceRangeMax: 10000000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation completed successfully',
    schema: {
      example: {
        success: true,
        result: {
          success: true,
          totalProcessed: 8,
          errors: 0,
          statistics: { total: 8, electronics: 3 },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid validation parameters' })
  @ApiInternalServerErrorResponse({
    description: 'Validation failed due to server error',
  })
  async validateProductData(@Body() options: ProductSeedOptionsDto) {
    try {
      // Validate batch size
      if (
        options.batchSize &&
        (options.batchSize < 1 || options.batchSize > 100)
      ) {
        throw new BadRequestException('Batch size must be between 1 and 100');
      }

      // Validate price range
      if (options.priceRangeMin && options.priceRangeMin < 0) {
        throw new BadRequestException('Minimum price cannot be negative');
      }

      if (options.priceRangeMax && options.priceRangeMax < 0) {
        throw new BadRequestException('Maximum price cannot be negative');
      }

      if (
        options.priceRangeMin &&
        options.priceRangeMax &&
        options.priceRangeMin > options.priceRangeMax
      ) {
        throw new BadRequestException(
          'Minimum price cannot be greater than maximum price',
        );
      }

      const result = await this.productSeederService.seedProducts({
        ...options,
        validateOnly: true,
      });

      return {
        success: true,
        result,
        message: `Validation completed: ${result.totalProcessed} products processed, ${result.errors} errors found`,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        'Validation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ SEED ALL PRODUCTS: Main seeding endpoint with comprehensive options
   */
  @Post('seed')
  @ApiOperation({
    summary: 'Seed products with comprehensive options',
    description: `
      Creates products in the database based on the specified options and filters.
      
      **Features:**
      - Category-based filtering
      - Vendor type filtering
      - Syrian business features filtering
      - Price range filtering
      - Batch processing for performance
      - Transaction safety with rollback
      - Duplicate handling options
      - Dry run capability
      
      **Safety Features:**
      - Transaction rollback on errors
      - Duplicate detection and skipping
      - Comprehensive validation
      - Performance monitoring
    `,
  })
  @ApiBody({
    type: ProductSeedOptionsDto,
    description: 'Seeding options and filters',
    examples: {
      basic: {
        summary: 'Basic seeding (all categories)',
        value: {
          includeElectronics: true,
          includeFashion: true,
          includeFood: true,
          includeHomeGarden: true,
          includeBooksEducation: true,
          skipDuplicates: true,
        },
      },
      electronics: {
        summary: 'Electronics only',
        value: {
          includeElectronics: true,
          includeFashion: false,
          includeFood: false,
          includeHomeGarden: false,
          includeBooksEducation: false,
          skipDuplicates: true,
        },
      },
      syrianProducts: {
        summary: 'Syrian products only',
        value: {
          onlyMadeInSyria: true,
          skipDuplicates: true,
          validateRelationships: true,
        },
      },
      dryRun: {
        summary: 'Dry run (no actual changes)',
        value: {
          includeElectronics: true,
          dryRun: true,
          validateRelationships: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products seeded successfully',
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
          processingTimeMs: 2500,
          statistics: { total: 8, electronics: 3 },
          performance: {
            averageTimePerProduct: 312,
            batchProcessingTime: 2500,
            dbOperationTime: 2000,
            validationTime: 300,
          },
          relationships: {
            categoriesProcessed: 5,
            brandsProcessed: 3,
            descriptionsCreated: 8,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid seeding parameters' })
  @ApiInternalServerErrorResponse({
    description: 'Seeding failed due to server error',
  })
  async seedProducts(@Body() options: ProductSeedOptionsDto): Promise<{
    success: boolean;
    result: ProductSeedResult;
    message: string;
  }> {
    try {
      // Validate batch size
      if (
        options.batchSize &&
        (options.batchSize < 1 || options.batchSize > 100)
      ) {
        throw new BadRequestException('Batch size must be between 1 and 100');
      }

      const result = await this.productSeederService.seedProducts(options);

      return {
        success: true,
        result,
        message: options.dryRun
          ? `Dry run completed: ${result.totalProcessed} products would be processed`
          : `Seeding completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Seeding failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ SEED ELECTRONICS PRODUCTS: Seed only electronics products
   */
  @Post('seed/electronics')
  @ApiOperation({
    summary: 'Seed electronics products only',
    description:
      'Creates only electronics products (smartphones, laptops, TVs, etc.) in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Electronics products seeded successfully',
  })
  async seedElectronicsProducts() {
    try {
      const result = await this.productSeederService.seedElectronicsProducts();
      return {
        success: true,
        result,
        message: `Electronics seeding completed: ${result.created} products created`,
      };
    } catch (error) {
      throw new HttpException(
        `Electronics seeding failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ SEED FASHION PRODUCTS: Seed only fashion products
   */
  @Post('seed/fashion')
  @ApiOperation({
    summary: 'Seed fashion products only',
    description:
      'Creates only fashion products (traditional clothing, modern apparel, etc.) in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Fashion products seeded successfully',
  })
  async seedFashionProducts() {
    try {
      const result = await this.productSeederService.seedFashionProducts();
      return {
        success: true,
        result,
        message: `Fashion seeding completed: ${result.created} products created`,
      };
    } catch (error) {
      throw new HttpException(
        `Fashion seeding failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ SEED FOOD PRODUCTS: Seed only food & beverage products
   */
  @Post('seed/food')
  @ApiOperation({
    summary: 'Seed food & beverage products only',
    description:
      'Creates only food & beverage products (spices, olive oil, traditional foods, etc.) in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Food products seeded successfully',
  })
  async seedFoodProducts() {
    try {
      const result = await this.productSeederService.seedFoodProducts();
      return {
        success: true,
        result,
        message: `Food products seeding completed: ${result.created} products created`,
      };
    } catch (error) {
      throw new HttpException(
        `Food products seeding failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ SEED HOME & GARDEN PRODUCTS: Seed only home & garden products
   */
  @Post('seed/home-garden')
  @ApiOperation({
    summary: 'Seed home & garden products only',
    description:
      'Creates only home & garden products (tools, furniture, decor, etc.) in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Home & garden products seeded successfully',
  })
  async seedHomeGardenProducts() {
    try {
      const result = await this.productSeederService.seedHomeGardenProducts();
      return {
        success: true,
        result,
        message: `Home & garden products seeding completed: ${result.created} products created`,
      };
    } catch (error) {
      throw new HttpException(
        `Home & garden products seeding failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ SEED BOOKS & EDUCATION PRODUCTS: Seed only books & education products
   */
  @Post('seed/books-education')
  @ApiOperation({
    summary: 'Seed books & education products only',
    description:
      'Creates only books & education products (cookbooks, textbooks, educational materials, etc.) in the database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Books & education products seeded successfully',
  })
  async seedBooksEducationProducts() {
    try {
      const result =
        await this.productSeederService.seedBooksEducationProducts();
      return {
        success: true,
        result,
        message: `Books & education products seeding completed: ${result.created} products created`,
      };
    } catch (error) {
      throw new HttpException(
        `Books & education products seeding failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ CLEANUP PRODUCTS: Remove seeded products
   */
  @Delete('cleanup')
  @ApiOperation({
    summary: 'Cleanup seeded products',
    description: `
      Removes products from the database. Can remove only seed data or all products.
      
      **DANGER:** This operation permanently deletes data. Use with caution.
    `,
  })
  @ApiQuery({
    name: 'onlySeedData',
    required: false,
    type: Boolean,
    description: 'Delete only seed data products',
  })
  @ApiQuery({
    name: 'confirmationCode',
    required: false,
    type: String,
    description: 'Required for complete deletion',
  })
  @ApiQuery({
    name: 'dryRun',
    required: false,
    type: Boolean,
    description: 'Preview what would be deleted',
  })
  @ApiQuery({
    name: 'excludeActive',
    required: false,
    type: Boolean,
    description: 'Exclude active products from deletion',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cleanup completed successfully',
    schema: {
      example: {
        success: true,
        deletedCount: 8,
        processingTimeMs: 500,
        message: 'Successfully deleted 8 products',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid cleanup parameters or missing confirmation',
  })
  @ApiInternalServerErrorResponse({
    description: 'Cleanup failed due to server error',
  })
  async cleanupProducts(
    @Query('onlySeedData') onlySeedData?: boolean,
    @Query('confirmationCode') confirmationCode?: string,
    @Query('dryRun') dryRun?: boolean,
    @Query('excludeActive') excludeActive?: boolean,
  ) {
    try {
      const result = await this.productSeederService.cleanupProducts({
        onlySeedData: onlySeedData ?? true,
        confirmationCode,
        dryRun: dryRun ?? false,
        excludeActive: excludeActive ?? true,
      });

      return {
        success: true,
        ...result,
        message: dryRun
          ? `Would delete ${result.deletedCount} products`
          : `Successfully deleted ${result.deletedCount} products`,
        warning: !onlySeedData
          ? 'Complete deletion performed - all products removed'
          : undefined,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        `Cleanup failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * ✅ HEALTH CHECK: Check seeding service health
   */
  @Get('health')
  @ApiOperation({
    summary: 'Check product seeding service health',
    description: `
      Performs comprehensive health check of the product seeding service.
      
      **Checks:**
      - Database connectivity
      - Seed data integrity
      - Relationship validation
      - Service status
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Health check completed successfully',
    schema: {
      example: {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: 'valid',
        relationshipIntegrity: 'valid',
        statistics: {
          totalProductsInDb: 8,
          seedDataAvailable: 8,
          processingTime: 150,
        },
        lastCheck: '2025-08-15T14:30:00.000Z',
        message: 'Product seeding service is healthy and operational',
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Health check failed' })
  async healthCheck() {
    try {
      const health = await this.productSeederService.healthCheck();
      return {
        ...health,
        message:
          health.status === 'healthy'
            ? 'Product seeding service is healthy and operational'
            : 'Product seeding service has issues - check logs for details',
      };
    } catch (error) {
      throw new HttpException(
        'Health check failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

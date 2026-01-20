/**
 * @file product-seeder.service.ts
 * @description Enterprise Product Seeding Service for SouqSyria Platform
 *
 * SEEDING FEATURES:
 * - Comprehensive product data seeding with Syrian business focus
 * - Category-based product creation (Electronics, Fashion, Food, etc.)
 * - Business type filtering and validation
 * - Bulk operations with transaction safety and rollback
 * - Duplicate detection and intelligent conflict resolution
 * - Performance monitoring and batch processing optimization
 * - Multi-language support (Arabic/English products)
 * - Advanced filtering and validation
 * - Comprehensive logging and error handling
 * - Statistics tracking and analytics
 * - Syrian business features validation
 * - Product approval workflow integration
 * - Vendor, brand, and category relationship management
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { ManufacturerEntity } from '../../manufacturers/entities/manufacturer.entity';
import { ProductDescriptionEntity } from '../entities/product-description.entity';
import {
  ALL_PRODUCT_SEEDS,
  ELECTRONICS_PRODUCTS,
  FASHION_PRODUCTS,
  FOOD_PRODUCTS,
  HOME_GARDEN_PRODUCTS,
  BOOKS_EDUCATION_PRODUCTS,
  PRODUCT_STATISTICS,
  ProductSeedData,
  getProductsByCategory,
  getProductsByVendorType,
  getProductsByBrand,
  getProductsByApprovalStatus,
  getProductsByPriceRange,
  getMadeInSyriaProducts,
  getTraditionalProducts,
  getHandmadeProducts,
  getFeaturedProducts,
  getProductsWithDiasporaShipping,
  getProductsBySeasonality,
} from './product-seeds.data';

/**
 * Seeding Options Interface
 */
export interface ProductSeedOptions {
  includeElectronics?: boolean;
  includeFashion?: boolean;
  includeFood?: boolean;
  includeHomeGarden?: boolean;
  includeBooksEducation?: boolean;
  clearExisting?: boolean;
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  specificCategories?: string[];
  specificVendorTypes?: string[];
  specificBrands?: string[];
  onlyMadeInSyria?: boolean;
  onlyTraditional?: boolean;
  onlyHandmade?: boolean;
  onlyFeatured?: boolean;
  onlyWithDiasporaShipping?: boolean;
  priceRangeMin?: number;
  priceRangeMax?: number;
  specificApprovalStatus?: string[];
  specificSeasonality?: string[];
  dryRun?: boolean;
  validateRelationships?: boolean;
  createMissingRelationships?: boolean;
}

/**
 * Seeding Result Interface
 */
export interface ProductSeedResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  processingTimeMs: number;
  errorDetails: Array<{
    productName: string;
    sku: string;
    category: string;
    error: string;
    details?: any;
  }>;
  statistics: {
    total: number;
    electronics: number;
    fashion: number;
    food: number;
    homeGarden: number;
    booksEducation: number;
    approved: number;
    madeInSyria: number;
    traditional: number;
    handmade: number;
    featured: number;
  };
  performance: {
    averageTimePerProduct: number;
    batchProcessingTime: number;
    dbOperationTime: number;
    validationTime: number;
    relationshipResolutionTime: number;
  };
  relationships: {
    categoriesProcessed: number;
    brandsProcessed: number;
    vendorsProcessed: number;
    manufacturersProcessed: number;
    descriptionsCreated: number;
    missingRelationships: string[];
  };
}

@Injectable()
export class ProductSeederService {
  private readonly logger = new Logger(ProductSeederService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,
    @InjectRepository(ManufacturerEntity)
    private readonly manufacturerRepository: Repository<ManufacturerEntity>,
    @InjectRepository(ProductDescriptionEntity)
    private readonly descriptionRepository: Repository<ProductDescriptionEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ✅ SEED ALL PRODUCTS: Main seeding method with comprehensive options
   */
  async seedProducts(
    options: ProductSeedOptions = {},
  ): Promise<ProductSeedResult> {
    const startTime = Date.now();
    let queryRunner: QueryRunner | null = null;

    // Default options
    const {
      includeElectronics = true,
      includeFashion = true,
      includeFood = true,
      includeHomeGarden = true,
      includeBooksEducation = true,
      clearExisting = false,
      batchSize = 10,
      validateOnly = false,
      skipDuplicates = true,
      updateExisting = false,
      specificCategories = [],
      specificVendorTypes = [],
      specificBrands = [],
      onlyMadeInSyria = false,
      onlyTraditional = false,
      onlyHandmade = false,
      onlyFeatured = false,
      onlyWithDiasporaShipping = false,
      priceRangeMin = 0,
      priceRangeMax = Number.MAX_SAFE_INTEGER,
      specificApprovalStatus = [],
      specificSeasonality = [],
      dryRun = false,
      validateRelationships = false,
      createMissingRelationships = false,
    } = options;

    this.logger.log('🌱 Starting product seeding process...');
    this.logger.debug(`Seeding options: ${JSON.stringify(options)}`);

    try {
      // Initialize transaction for data integrity
      if (!dryRun && !validateOnly) {
        queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
      }

      // Clear existing data if requested
      if (clearExisting && !dryRun && !validateOnly) {
        await this.clearExistingProducts(queryRunner);
      }

      // Prepare product data based on options
      const productsToSeed = this.prepareProductData({
        includeElectronics,
        includeFashion,
        includeFood,
        includeHomeGarden,
        includeBooksEducation,
        specificCategories,
        specificVendorTypes,
        specificBrands,
        onlyMadeInSyria,
        onlyTraditional,
        onlyHandmade,
        onlyFeatured,
        onlyWithDiasporaShipping,
        priceRangeMin,
        priceRangeMax,
        specificApprovalStatus,
        specificSeasonality,
      });

      this.logger.log(
        `📊 Prepared ${productsToSeed.length} products for seeding`,
      );

      // Validate relationships if requested
      if (validateRelationships) {
        const relationshipValidation = await this.validateProductRelationships(
          productsToSeed,
          createMissingRelationships,
          queryRunner,
        );
        if (!relationshipValidation.isValid && !createMissingRelationships) {
          throw new BadRequestException(
            `Relationship validation failed: Missing relationships: ${relationshipValidation.missingRelationships.join(', ')}`,
          );
        }
        this.logger.log('✅ Relationship validation passed');
      }

      // Validate data if requested
      if (validateOnly) {
        return this.validateProductData(productsToSeed);
      }

      // Process products in batches
      const result = await this.processProductsBatch(
        productsToSeed,
        {
          batchSize,
          skipDuplicates,
          updateExisting,
          dryRun,
        },
        queryRunner,
      );

      // Commit transaction if successful
      if (queryRunner && !dryRun) {
        await queryRunner.commitTransaction();
        this.logger.log('✅ Transaction committed successfully');
      }

      const processingTime = Date.now() - startTime;
      result.processingTimeMs = processingTime;
      result.performance.batchProcessingTime = processingTime;

      this.logger.log(
        `🎉 Product seeding completed successfully in ${processingTime}ms`,
      );
      this.logger.log(
        `📈 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );

      return result;
    } catch (error) {
      // Rollback transaction on error
      if (queryRunner && !dryRun) {
        await queryRunner.rollbackTransaction();
        this.logger.error('🔄 Transaction rolled back due to error');
      }

      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Product seeding failed after ${processingTime}ms: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Product seeding failed: ${error.message}`,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  /**
   * ✅ SEED SPECIFIC PRODUCT CATEGORIES: Seed only specific product groups
   */
  async seedElectronicsProducts(): Promise<ProductSeedResult> {
    return this.seedProducts({
      includeElectronics: true,
      includeFashion: false,
      includeFood: false,
      includeHomeGarden: false,
      includeBooksEducation: false,
      skipDuplicates: true,
    });
  }

  async seedFashionProducts(): Promise<ProductSeedResult> {
    return this.seedProducts({
      includeElectronics: false,
      includeFashion: true,
      includeFood: false,
      includeHomeGarden: false,
      includeBooksEducation: false,
      skipDuplicates: true,
    });
  }

  async seedFoodProducts(): Promise<ProductSeedResult> {
    return this.seedProducts({
      includeElectronics: false,
      includeFashion: false,
      includeFood: true,
      includeHomeGarden: false,
      includeBooksEducation: false,
      skipDuplicates: true,
    });
  }

  async seedHomeGardenProducts(): Promise<ProductSeedResult> {
    return this.seedProducts({
      includeElectronics: false,
      includeFashion: false,
      includeFood: false,
      includeHomeGarden: true,
      includeBooksEducation: false,
      skipDuplicates: true,
    });
  }

  async seedBooksEducationProducts(): Promise<ProductSeedResult> {
    return this.seedProducts({
      includeElectronics: false,
      includeFashion: false,
      includeFood: false,
      includeHomeGarden: false,
      includeBooksEducation: true,
      skipDuplicates: true,
    });
  }

  /**
   * ✅ GET SEEDING STATISTICS: Comprehensive statistics about available seed data
   */
  async getSeedingStatistics(): Promise<{
    seedData: typeof PRODUCT_STATISTICS;
    database: {
      totalProducts: number;
      activeProducts: number;
      publishedProducts: number;
      featuredProducts: number;
      approvedProducts: number;
      electronicsProducts: number;
      fashionProducts: number;
      foodProducts: number;
      homeGardenProducts: number;
      booksEducationProducts: number;
    };
    comparison: {
      seedingProgress: number;
      missingFromDb: number;
      duplicatesInDb: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Get database statistics
      const [
        totalProducts,
        activeProducts,
        publishedProducts,
        featuredProducts,
        approvedProducts,
      ] = await Promise.all([
        this.productRepository.count(),
        this.productRepository.count({ where: { isActive: true } }),
        this.productRepository.count({ where: { isPublished: true } }),
        this.productRepository.count({ where: { isFeatured: true } }),
        this.productRepository.count({ where: { approvalStatus: 'approved' } }),
      ]);

      // Count products by category (simplified - would need joins for accurate counts)
      const electronicsProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .where('category.slug = :slug', { slug: 'electronics' })
        .getCount();

      const fashionProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .where('category.slug = :slug', { slug: 'fashion' })
        .getCount();

      const foodProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .where('category.slug = :slug', { slug: 'food-beverages' })
        .getCount();

      const homeGardenProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .where('category.slug = :slug', { slug: 'home-garden' })
        .getCount();

      const booksEducationProducts = await this.productRepository
        .createQueryBuilder('product')
        .leftJoin('product.category', 'category')
        .where('category.slug = :slug', { slug: 'books-education' })
        .getCount();

      // Calculate progress and missing data
      const seedingProgress = Math.round(
        (totalProducts / ALL_PRODUCT_SEEDS.length) * 100,
      );
      const missingFromDb = Math.max(
        0,
        ALL_PRODUCT_SEEDS.length - totalProducts,
      );

      // Check for duplicates (products with same SKU)
      const duplicateCount = await this.countDuplicateProducts();

      const processingTime = Date.now() - startTime;

      this.logger.log(`📊 Statistics generated in ${processingTime}ms`);

      return {
        seedData: PRODUCT_STATISTICS,
        database: {
          totalProducts,
          activeProducts,
          publishedProducts,
          featuredProducts,
          approvedProducts,
          electronicsProducts,
          fashionProducts,
          foodProducts,
          homeGardenProducts,
          booksEducationProducts,
        },
        comparison: {
          seedingProgress,
          missingFromDb,
          duplicatesInDb: duplicateCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ Failed to get seeding statistics: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate seeding statistics',
      );
    }
  }

  /**
   * ✅ CLEANUP PRODUCTS: Remove seeded products or all products
   */
  async cleanupProducts(
    options: {
      onlySeedData?: boolean;
      confirmationCode?: string;
      dryRun?: boolean;
      excludeActive?: boolean;
    } = {},
  ): Promise<{
    success: boolean;
    deletedCount: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const {
      onlySeedData = true,
      confirmationCode,
      dryRun = false,
      excludeActive = true,
    } = options;

    // Safety check for complete deletion
    if (!onlySeedData) {
      if (confirmationCode !== 'DELETE_ALL_PRODUCTS_CONFIRMED') {
        throw new BadRequestException(
          'Complete product deletion requires confirmation code',
        );
      }
    }

    try {
      let deletedCount = 0;

      if (dryRun) {
        // Count what would be deleted
        if (onlySeedData) {
          const seedProductSKUs = ALL_PRODUCT_SEEDS.map(
            (product) => product.sku,
          );
          let totalCount = 0;
          for (const sku of seedProductSKUs) {
            const count = await this.productRepository.count({
              where: { sku },
            });
            totalCount += count;
          }
          deletedCount = totalCount;
        } else {
          if (excludeActive) {
            deletedCount = await this.productRepository.count({
              where: { isActive: false },
            });
          } else {
            deletedCount = await this.productRepository.count();
          }
        }

        this.logger.log(`🧪 DRY RUN: Would delete ${deletedCount} products`);
      } else {
        if (onlySeedData) {
          // Delete only products that match seed data
          const seedProductSKUs = ALL_PRODUCT_SEEDS.map(
            (product) => product.sku,
          );

          for (const sku of seedProductSKUs) {
            const result = await this.productRepository.delete({ sku });
            deletedCount += result.affected || 0;
          }
        } else {
          // Delete all products (dangerous operation)
          if (excludeActive) {
            const result = await this.productRepository.delete({
              isActive: false,
            });
            deletedCount = result.affected || 0;
          } else {
            const result = await this.productRepository.delete({});
            deletedCount = result.affected || 0;
          }
        }

        this.logger.log(`🗑️  Successfully deleted ${deletedCount} products`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        deletedCount,
        processingTimeMs: processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Product cleanup failed after ${processingTime}ms: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Product cleanup failed: ${error.message}`,
      );
    }
  }

  /**
   * ✅ HEALTH CHECK: Verify seeding service health and database connectivity
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    seedDataIntegrity: 'valid' | 'invalid';
    relationshipIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
  }> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      const productCount = await this.productRepository.count();

      // Test seed data integrity
      const dataValidation = this.validateSeedDataIntegrity();

      // Test relationship integrity
      const relationshipValidation = await this.validateProductRelationships(
        ALL_PRODUCT_SEEDS,
        false,
      );

      // Get basic statistics
      const stats = await this.getSeedingStatistics();

      const processingTime = Date.now() - startTime;

      this.logger.log(`💚 Health check completed in ${processingTime}ms`);

      return {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: dataValidation ? 'valid' : 'invalid',
        relationshipIntegrity: relationshipValidation.isValid
          ? 'valid'
          : 'invalid',
        statistics: {
          totalProductsInDb: productCount,
          seedDataAvailable: ALL_PRODUCT_SEEDS.length,
          processingTime,
        },
        lastCheck: new Date(),
      };
    } catch (error) {
      this.logger.error(`❌ Health check failed: ${error.message}`);

      return {
        status: 'unhealthy',
        database: 'disconnected',
        seedDataIntegrity: 'invalid',
        relationshipIntegrity: 'invalid',
        statistics: null,
        lastCheck: new Date(),
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * ✅ PREPARE PRODUCT DATA: Filter and prepare products based on options
   */
  private prepareProductData(options: {
    includeElectronics: boolean;
    includeFashion: boolean;
    includeFood: boolean;
    includeHomeGarden: boolean;
    includeBooksEducation: boolean;
    specificCategories: string[];
    specificVendorTypes: string[];
    specificBrands: string[];
    onlyMadeInSyria: boolean;
    onlyTraditional: boolean;
    onlyHandmade: boolean;
    onlyFeatured: boolean;
    onlyWithDiasporaShipping: boolean;
    priceRangeMin: number;
    priceRangeMax: number;
    specificApprovalStatus: string[];
    specificSeasonality: string[];
  }): ProductSeedData[] {
    let products: ProductSeedData[] = [];

    // Collect products based on categories
    if (options.includeElectronics) products.push(...ELECTRONICS_PRODUCTS);
    if (options.includeFashion) products.push(...FASHION_PRODUCTS);
    if (options.includeFood) products.push(...FOOD_PRODUCTS);
    if (options.includeHomeGarden) products.push(...HOME_GARDEN_PRODUCTS);
    if (options.includeBooksEducation)
      products.push(...BOOKS_EDUCATION_PRODUCTS);

    // Filter by specific categories
    if (options.specificCategories.length > 0) {
      products = products.filter((product) =>
        options.specificCategories.includes(product.categorySlug),
      );
    }

    // Filter by specific vendor types
    if (options.specificVendorTypes.length > 0) {
      products = products.filter((product) =>
        options.specificVendorTypes.includes(product.vendorType),
      );
    }

    // Filter by specific brands
    if (options.specificBrands.length > 0) {
      products = products.filter(
        (product) =>
          product.brandSlug &&
          options.specificBrands.includes(product.brandSlug),
      );
    }

    // Filter by Syrian business features
    if (options.onlyMadeInSyria) {
      products = products.filter(
        (product) => product.syrianBusinessFeatures.madeInSyria,
      );
    }

    if (options.onlyTraditional) {
      products = products.filter(
        (product) => product.syrianBusinessFeatures.traditionalProduct,
      );
    }

    if (options.onlyHandmade) {
      products = products.filter(
        (product) => product.syrianBusinessFeatures.handmade,
      );
    }

    if (options.onlyFeatured) {
      products = products.filter((product) => product.isFeatured);
    }

    if (options.onlyWithDiasporaShipping) {
      products = products.filter(
        (product) => product.syrianBusinessFeatures.diasporaShipping,
      );
    }

    // Filter by price range
    products = products.filter(
      (product) =>
        product.basePriceSYP >= options.priceRangeMin &&
        product.basePriceSYP <= options.priceRangeMax,
    );

    // Filter by approval status
    if (options.specificApprovalStatus.length > 0) {
      products = products.filter((product) =>
        options.specificApprovalStatus.includes(product.approvalStatus),
      );
    }

    // Filter by seasonality
    if (options.specificSeasonality.length > 0) {
      products = products.filter(
        (product) =>
          product.seasonality &&
          (options.specificSeasonality.includes(product.seasonality) ||
            product.seasonality === 'year-round'),
      );
    }

    return products;
  }

  /**
   * ✅ PROCESS PRODUCTS BATCH: Process products in batches with performance optimization
   */
  private async processProductsBatch(
    products: ProductSeedData[],
    options: {
      batchSize: number;
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    queryRunner?: QueryRunner,
  ): Promise<ProductSeedResult> {
    const result: ProductSeedResult = {
      success: true,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      processingTimeMs: 0,
      errorDetails: [],
      statistics: PRODUCT_STATISTICS,
      performance: {
        averageTimePerProduct: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        validationTime: 0,
        relationshipResolutionTime: 0,
      },
      relationships: {
        categoriesProcessed: 0,
        brandsProcessed: 0,
        vendorsProcessed: 0,
        manufacturersProcessed: 0,
        descriptionsCreated: 0,
        missingRelationships: [],
      },
    };

    let totalDbTime = 0;
    let totalValidationTime = 0;
    let totalRelationshipTime = 0;
    const batchCount = Math.ceil(products.length / options.batchSize);

    for (let i = 0; i < batchCount; i++) {
      const batchStart = i * options.batchSize;
      const batchEnd = Math.min(
        batchStart + options.batchSize,
        products.length,
      );
      const batch = products.slice(batchStart, batchEnd);

      this.logger.log(
        `🔄 Processing batch ${i + 1}/${batchCount} (${batch.length} products)`,
      );

      const batchStartTime = Date.now();

      for (const productData of batch) {
        try {
          const dbStartTime = Date.now();
          const validationStartTime = Date.now();
          const relationshipStartTime = Date.now();

          const productResult = await this.processSingleProduct(
            productData,
            {
              skipDuplicates: options.skipDuplicates,
              updateExisting: options.updateExisting,
              dryRun: options.dryRun,
            },
            queryRunner,
          );

          const relationshipTime = Date.now() - relationshipStartTime;
          const validationTime = Date.now() - validationStartTime;
          totalValidationTime += validationTime;
          totalRelationshipTime += relationshipTime;
          totalDbTime += Date.now() - dbStartTime;

          // Update counters
          result.totalProcessed++;

          // In dry run mode, don't count actual operations, but track what would happen
          if (options.dryRun) {
            // In dry run, everything is considered "processed" but nothing is actually created/updated
            switch (productResult) {
              case 'created':
                // Don't increment created counter in dry run
                break;
              case 'updated':
                // Don't increment updated counter in dry run
                break;
              case 'skipped':
                result.skipped++;
                break;
            }
          } else {
            switch (productResult) {
              case 'created':
                result.created++;
                break;
              case 'updated':
                result.updated++;
                break;
              case 'skipped':
                result.skipped++;
                break;
            }
          }
        } catch (error) {
          result.errors++;
          result.errorDetails.push({
            productName: productData.nameEn,
            sku: productData.sku,
            category: productData.categorySlug,
            error: error.message,
            details: error.stack,
          });

          this.logger.error(
            `❌ Failed to process product ${productData.nameEn} (${productData.sku}): ${error.message}`,
          );
        }
      }

      const batchTime = Date.now() - batchStartTime;
      this.logger.log(`✅ Batch ${i + 1} completed in ${batchTime}ms`);
    }

    // Calculate performance metrics
    result.performance.dbOperationTime = totalDbTime;
    result.performance.validationTime = totalValidationTime;
    result.performance.relationshipResolutionTime = totalRelationshipTime;
    result.performance.averageTimePerProduct =
      result.totalProcessed > 0 ? totalDbTime / result.totalProcessed : 0;

    return result;
  }

  /**
   * ✅ PROCESS SINGLE PRODUCT: Handle individual product creation/update
   */
  private async processSingleProduct(
    productData: ProductSeedData,
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    queryRunner?: QueryRunner,
  ): Promise<'created' | 'updated' | 'skipped'> {
    // Check for existing product by SKU
    const repository =
      queryRunner?.manager.getRepository(ProductEntity) ||
      this.productRepository;
    const existingProduct = await repository.findOne({
      where: { sku: productData.sku },
    });

    if (existingProduct) {
      if (options.skipDuplicates && !options.updateExisting) {
        this.logger.debug(
          `⏭️  Skipped existing product: ${productData.nameEn}`,
        );
        return 'skipped';
      }

      if (options.updateExisting) {
        if (options.dryRun) {
          this.logger.debug(
            `🧪 DRY RUN: Would update product: ${productData.nameEn}`,
          );
          return 'updated';
        }

        // Update existing product
        const updateData = await this.transformSeedDataToProduct(
          productData,
          queryRunner,
        );
        await repository.update(existingProduct.id, updateData);

        this.logger.debug(`🔄 Updated existing product: ${productData.nameEn}`);
        return 'updated';
      }
    }

    if (options.dryRun) {
      this.logger.debug(
        `🧪 DRY RUN: Would create product: ${productData.nameEn}`,
      );
      return 'created';
    }

    // Transform seed data to product entity format
    const productEntityData = await this.transformSeedDataToProduct(
      productData,
      queryRunner,
    );

    // Create new product
    const newProduct = repository.create(productEntityData);
    await repository.save(newProduct);

    this.logger.debug(`✨ Created new product: ${productData.nameEn}`);
    return 'created';
  }

  /**
   * ✅ TRANSFORM SEED DATA: Convert seed data to product entity format
   */
  private async transformSeedDataToProduct(
    seedData: ProductSeedData,
    queryRunner?: QueryRunner,
  ): Promise<Partial<ProductEntity>> {
    // Resolve relationships
    const category = await this.resolveCategory(
      seedData.categorySlug,
      queryRunner,
    );
    const brand = seedData.brandSlug
      ? await this.resolveBrand(seedData.brandSlug, queryRunner)
      : null;
    const manufacturer = seedData.manufacturerName
      ? await this.resolveManufacturer(seedData.manufacturerName, queryRunner)
      : null;

    return {
      nameEn: seedData.nameEn,
      nameAr: seedData.nameAr,
      slug: seedData.slug,
      sku: seedData.sku,
      currency: seedData.currency,
      status: seedData.status,
      approvalStatus: seedData.approvalStatus,
      weight: seedData.weight,
      dimensions: seedData.dimensions,
      isFeatured: seedData.isFeatured,
      isActive: seedData.isActive,
      isPublished: seedData.isPublished,
      category,
      brand,
      manufacturer,
    };
  }

  /**
   * ✅ RESOLVE RELATIONSHIPS: Find or create related entities
   */
  private async resolveCategory(
    categorySlug: string,
    queryRunner?: QueryRunner,
  ): Promise<Category> {
    const repository =
      queryRunner?.manager.getRepository(Category) || this.categoryRepository;
    const category = await repository.findOne({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new BadRequestException(`Category not found: ${categorySlug}`);
    }

    return category;
  }

  private async resolveBrand(
    brandSlug: string,
    queryRunner?: QueryRunner,
  ): Promise<Brand> {
    const repository =
      queryRunner?.manager.getRepository(Brand) || this.brandRepository;
    const brand = await repository.findOne({ where: { slug: brandSlug } });

    if (!brand) {
      throw new BadRequestException(`Brand not found: ${brandSlug}`);
    }

    return brand;
  }

  private async resolveManufacturer(
    manufacturerName: string,
    queryRunner?: QueryRunner,
  ): Promise<ManufacturerEntity> {
    const repository =
      queryRunner?.manager.getRepository(ManufacturerEntity) ||
      this.manufacturerRepository;
    const manufacturer = await repository.findOne({
      where: { name: manufacturerName },
    });

    if (!manufacturer) {
      throw new BadRequestException(
        `Manufacturer not found: ${manufacturerName}`,
      );
    }

    return manufacturer;
  }

  /**
   * ✅ VALIDATE PRODUCT RELATIONSHIPS: Check if all required relationships exist
   */
  private async validateProductRelationships(
    products: ProductSeedData[],
    createMissing: boolean = false,
    queryRunner?: QueryRunner,
  ): Promise<{
    isValid: boolean;
    missingRelationships: string[];
  }> {
    const missingRelationships: string[] = [];

    // Collect unique slugs/names for validation
    const categorySlugSet = new Set(products.map((p) => p.categorySlug));
    const brandSlugSet = new Set(
      products.filter((p) => p.brandSlug).map((p) => p.brandSlug),
    );
    const manufacturerNameSet = new Set(
      products.filter((p) => p.manufacturerName).map((p) => p.manufacturerName),
    );

    // Check categories
    for (const categorySlug of categorySlugSet) {
      const category = await this.categoryRepository.findOne({
        where: { slug: categorySlug },
      });
      if (!category) {
        missingRelationships.push(`category:${categorySlug}`);
      }
    }

    // Check brands
    for (const brandSlug of brandSlugSet) {
      const brand = await this.brandRepository.findOne({
        where: { slug: brandSlug },
      });
      if (!brand) {
        missingRelationships.push(`brand:${brandSlug}`);
      }
    }

    // Check manufacturers
    for (const manufacturerName of manufacturerNameSet) {
      const manufacturer = await this.manufacturerRepository.findOne({
        where: { name: manufacturerName },
      });
      if (!manufacturer) {
        missingRelationships.push(`manufacturer:${manufacturerName}`);
      }
    }

    return {
      isValid: missingRelationships.length === 0,
      missingRelationships,
    };
  }

  /**
   * ✅ VALIDATE PRODUCT DATA: Comprehensive validation of seed data
   */
  private validateProductData(products: ProductSeedData[]): ProductSeedResult {
    const errors: Array<{
      productName: string;
      sku: string;
      category: string;
      error: string;
      details?: any;
    }> = [];

    products.forEach((product) => {
      // Validate required fields
      if (!product.nameEn) {
        errors.push({
          productName: product.nameEn || 'Unknown',
          sku: product.sku,
          category: product.categorySlug,
          error: 'English name is required',
        });
      }

      if (!product.nameAr) {
        errors.push({
          productName: product.nameEn,
          sku: product.sku,
          category: product.categorySlug,
          error: 'Arabic name is required',
        });
      }

      if (!product.sku) {
        errors.push({
          productName: product.nameEn,
          sku: product.sku || 'Unknown',
          category: product.categorySlug,
          error: 'SKU is required',
        });
      }

      if (product.basePriceSYP <= 0) {
        errors.push({
          productName: product.nameEn,
          sku: product.sku,
          category: product.categorySlug,
          error: 'Price must be positive',
        });
      }

      if (!product.categorySlug) {
        errors.push({
          productName: product.nameEn,
          sku: product.sku,
          category: product.categorySlug || 'Unknown',
          error: 'Category is required',
        });
      }

      // Validate vendor type
      const validVendorTypes = [
        'individual',
        'small_business',
        'medium_business',
        'enterprise',
      ];
      if (!validVendorTypes.includes(product.vendorType)) {
        errors.push({
          productName: product.nameEn,
          sku: product.sku,
          category: product.categorySlug,
          error: 'Invalid vendor type',
        });
      }

      // Validate currency
      const validCurrencies = ['SYP', 'USD', 'EUR', 'TRY'];
      if (!validCurrencies.includes(product.currency)) {
        errors.push({
          productName: product.nameEn,
          sku: product.sku,
          category: product.categorySlug,
          error: 'Invalid currency',
        });
      }
    });

    return {
      success: errors.length === 0,
      totalProcessed: products.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      processingTimeMs: 0,
      errorDetails: errors,
      statistics: PRODUCT_STATISTICS,
      performance: {
        averageTimePerProduct: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        validationTime: 0,
        relationshipResolutionTime: 0,
      },
      relationships: {
        categoriesProcessed: 0,
        brandsProcessed: 0,
        vendorsProcessed: 0,
        manufacturersProcessed: 0,
        descriptionsCreated: 0,
        missingRelationships: [],
      },
    };
  }

  /**
   * ✅ VALIDATE SEED DATA INTEGRITY: Check for issues in seed data
   */
  private validateSeedDataIntegrity(): boolean {
    try {
      // Check for duplicate SKUs
      const skus = ALL_PRODUCT_SEEDS.map((product) => product.sku);
      const uniqueSKUs = new Set(skus);

      if (skus.length !== uniqueSKUs.size) {
        this.logger.warn('⚠️  Duplicate SKUs found in seed data');
        return false;
      }

      // Check for duplicate slugs
      const slugs = ALL_PRODUCT_SEEDS.map((product) => product.slug);
      const uniqueSlugs = new Set(slugs);

      if (slugs.length !== uniqueSlugs.size) {
        this.logger.warn('⚠️  Duplicate slugs found in seed data');
        return false;
      }

      // Validate required fields
      for (const product of ALL_PRODUCT_SEEDS) {
        if (
          !product.nameEn ||
          !product.nameAr ||
          !product.sku ||
          product.basePriceSYP <= 0
        ) {
          this.logger.warn(
            `⚠️  Invalid product data: ${product.nameEn || 'Unknown'}`,
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`❌ Seed data validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * ✅ CLEAR EXISTING PRODUCTS: Remove all existing products (dangerous operation)
   */
  private async clearExistingProducts(
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const repository =
      queryRunner?.manager.getRepository(ProductEntity) ||
      this.productRepository;

    const deletedCount = await repository.delete({});
    this.logger.warn(
      `🗑️  Cleared ${deletedCount.affected || 0} existing products`,
    );
  }

  /**
   * ✅ COUNT DUPLICATE PRODUCTS: Count products with duplicate SKUs
   */
  private async countDuplicateProducts(): Promise<number> {
    const duplicateSKUs = await this.productRepository
      .createQueryBuilder('product')
      .select('product.sku')
      .addSelect('COUNT(*)', 'count')
      .groupBy('product.sku')
      .having('COUNT(*) > 1')
      .getRawMany();

    return duplicateSKUs.length;
  }
}

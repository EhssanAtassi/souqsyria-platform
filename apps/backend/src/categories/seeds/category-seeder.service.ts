/**
 * @file category-seeder.service.ts
 * @description Enterprise Category Seeding Service for SouqSyria Platform
 *
 * SEEDING FEATURES:
 * - Comprehensive category data seeding with Syrian market focus
 * - Hierarchical category structure with parent-child relationships
 * - Bulk operations with transaction safety and rollback
 * - Duplicate detection and intelligent conflict resolution
 * - Performance monitoring and batch processing optimization
 * - Multi-language support (Arabic/English)
 * - Advanced filtering and validation
 * - Comprehensive logging and error handling
 * - Statistics tracking and analytics
 * - Hierarchical integrity validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
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
import { Category } from '../entities/category.entity';
import { User } from '../../users/entities/user.entity';
import {
  ALL_CATEGORY_SEEDS,
  ROOT_CATEGORIES,
  ELECTRONICS_SUBCATEGORIES,
  FASHION_SUBCATEGORIES,
  FOOD_SUBCATEGORIES,
  CATEGORY_STATISTICS,
  CategorySeedData,
  getCategoriesByDepth,
  getRootCategories,
  getFeaturedCategories,
  getMostPopularCategories,
} from './category-seeds.data';

/**
 * Seeding Options Interface
 */
export interface CategorySeedOptions {
  includeRoot?: boolean;
  includeElectronics?: boolean;
  includeFashion?: boolean;
  includeFood?: boolean;
  clearExisting?: boolean;
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  specificDepthLevels?: number[];
  minPopularityScore?: number;
  maxPopularityScore?: number;
  onlyFeatured?: boolean;
  onlyApproved?: boolean;
  dryRun?: boolean;
  validateHierarchy?: boolean;
}

/**
 * Seeding Result Interface
 */
export interface CategorySeedResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  processingTimeMs: number;
  errorDetails: Array<{
    categoryName: string;
    error: string;
    details?: any;
  }>;
  statistics: {
    total: number;
    root: number;
    subcategories: number;
    featured: number;
    approved: number;
    mostPopular: number;
    averagePopularityScore: number;
  };
  performance: {
    averageTimePerCategory: number;
    batchProcessingTime: number;
    dbOperationTime: number;
  };
  hierarchy: {
    levelsProcessed: number;
    rootCategoriesCreated: number;
    childCategoriesCreated: number;
    hierarchyValidation: boolean;
  };
}

@Injectable()
export class CategorySeederService {
  private readonly logger = new Logger(CategorySeederService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ✅ SEED ALL CATEGORIES: Main seeding method with comprehensive options
   */
  async seedCategories(
    options: CategorySeedOptions = {},
    adminUser?: User,
  ): Promise<CategorySeedResult> {
    const startTime = Date.now();
    let queryRunner: QueryRunner | null = null;

    // Default options
    const {
      includeRoot = true,
      includeElectronics = true,
      includeFashion = true,
      includeFood = true,
      clearExisting = false,
      batchSize = 50,
      validateOnly = false,
      skipDuplicates = true,
      updateExisting = false,
      specificDepthLevels = [],
      minPopularityScore = 0,
      maxPopularityScore = 100,
      onlyFeatured = false,
      onlyApproved = false,
      dryRun = false,
      validateHierarchy = true,
    } = options;

    this.logger.log('🌱 Starting category seeding process...');
    this.logger.debug(`Seeding options: ${JSON.stringify(options)}`);

    try {
      // Initialize transaction for data integrity
      if (!dryRun && !validateOnly) {
        queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
      }

      // Get admin user for audit trail
      const seedingUser = adminUser || (await this.getSystemUser());

      // Clear existing data if requested
      if (clearExisting && !dryRun && !validateOnly) {
        await this.clearExistingCategories(queryRunner);
      }

      // Prepare category data based on options
      const categoriesToSeed = this.prepareCategoryData({
        includeRoot,
        includeElectronics,
        includeFashion,
        includeFood,
        specificDepthLevels,
        minPopularityScore,
        maxPopularityScore,
        onlyFeatured,
        onlyApproved,
      });

      this.logger.log(
        `📊 Prepared ${categoriesToSeed.length} categories for seeding`,
      );

      // Validate hierarchical structure
      if (validateHierarchy) {
        const hierarchyValidation =
          this.validateHierarchicalStructure(categoriesToSeed);
        if (!hierarchyValidation.isValid) {
          throw new BadRequestException(
            `Hierarchy validation failed: ${hierarchyValidation.errors.join(', ')}`,
          );
        }
        this.logger.log('✅ Hierarchical structure validation passed');
      }

      // Validate data if requested
      if (validateOnly) {
        return this.validateCategoryData(categoriesToSeed);
      }

      // Process categories in hierarchical order (parents first)
      const result = await this.processCategoriesHierarchically(
        categoriesToSeed,
        {
          batchSize,
          skipDuplicates,
          updateExisting,
          dryRun,
        },
        seedingUser,
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
        `🎉 Category seeding completed successfully in ${processingTime}ms`,
      );
      this.logger.log(
        `📈 Results: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
      );

      return result;
    } catch (error: unknown) {
      // Rollback transaction on error
      if (queryRunner && !dryRun) {
        await queryRunner.rollbackTransaction();
        this.logger.error('🔄 Transaction rolled back due to error');
      }

      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Category seeding failed after ${processingTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `Category seeding failed: ${(error as Error).message}`,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  /**
   * ✅ SEED SPECIFIC CATEGORY TYPES: Seed only specific category groups
   */
  async seedRootCategories(adminUser?: User): Promise<CategorySeedResult> {
    return this.seedCategories(
      {
        includeRoot: true,
        includeElectronics: false,
        includeFashion: false,
        includeFood: false,
        clearExisting: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedElectronicsCategories(
    adminUser?: User,
  ): Promise<CategorySeedResult> {
    return this.seedCategories(
      {
        includeRoot: false,
        includeElectronics: true,
        includeFashion: false,
        includeFood: false,
        clearExisting: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedFashionCategories(adminUser?: User): Promise<CategorySeedResult> {
    return this.seedCategories(
      {
        includeRoot: false,
        includeElectronics: false,
        includeFashion: true,
        includeFood: false,
        clearExisting: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedFoodCategories(adminUser?: User): Promise<CategorySeedResult> {
    return this.seedCategories(
      {
        includeRoot: false,
        includeElectronics: false,
        includeFashion: false,
        includeFood: true,
        clearExisting: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  /**
   * ✅ GET SEEDING STATISTICS: Comprehensive statistics about available seed data
   */
  async getSeedingStatistics(): Promise<{
    seedData: typeof CATEGORY_STATISTICS;
    database: {
      totalCategories: number;
      rootCategories: number;
      featuredCategories: number;
      approvedCategories: number;
      activeCategories: number;
      maxDepthLevel: number;
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
        totalCategories,
        rootCategories,
        featuredCategories,
        approvedCategories,
        activeCategories,
      ] = await Promise.all([
        this.categoryRepository.count(),
        this.categoryRepository.count({
          where: { depthLevel: 0 },
        }),
        this.categoryRepository.count({ where: { isFeatured: true } }),
        this.categoryRepository.count({
          where: { approvalStatus: 'approved' },
        }),
        this.categoryRepository.count({ where: { isActive: true } }),
      ]);

      // Get maximum depth level
      const maxDepthResult = await this.categoryRepository
        .createQueryBuilder('category')
        .select('MAX(category.depthLevel)', 'maxDepth')
        .getRawOne();
      const maxDepthLevel = maxDepthResult?.maxDepth || 0;

      // Calculate progress and missing data
      const seedingProgress = Math.round(
        (totalCategories / ALL_CATEGORY_SEEDS.length) * 100,
      );
      const missingFromDb = Math.max(
        0,
        ALL_CATEGORY_SEEDS.length - totalCategories,
      );

      // Check for duplicates (categories with same slug)
      const duplicateCount = await this.countDuplicateCategories();

      const processingTime = Date.now() - startTime;

      this.logger.log(`📊 Statistics generated in ${processingTime}ms`);

      return {
        seedData: CATEGORY_STATISTICS,
        database: {
          totalCategories,
          rootCategories,
          featuredCategories,
          approvedCategories,
          activeCategories,
          maxDepthLevel,
        },
        comparison: {
          seedingProgress,
          missingFromDb,
          duplicatesInDb: duplicateCount,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to get seeding statistics: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate seeding statistics',
      );
    }
  }

  /**
   * ✅ CLEANUP CATEGORIES: Remove seeded categories or all categories
   */
  async cleanupCategories(
    options: {
      onlySeedData?: boolean;
      confirmationCode?: string;
      dryRun?: boolean;
    } = {},
  ): Promise<{
    success: boolean;
    deletedCount: number;
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    const { onlySeedData = true, confirmationCode, dryRun = false } = options;

    // Safety check for complete deletion
    if (!onlySeedData) {
      if (confirmationCode !== 'DELETE_ALL_CATEGORIES_CONFIRMED') {
        throw new BadRequestException(
          'Complete category deletion requires confirmation code',
        );
      }
    }

    try {
      let deletedCount = 0;

      if (dryRun) {
        // Count what would be deleted
        if (onlySeedData) {
          const seedCategorySlugs = ALL_CATEGORY_SEEDS.map(
            (category) => category.slug,
          );
          let totalCount = 0;
          for (const slug of seedCategorySlugs) {
            const count = await this.categoryRepository.count({
              where: { slug },
            });
            totalCount += count;
          }
          deletedCount = totalCount;
        } else {
          deletedCount = await this.categoryRepository.count();
        }

        this.logger.log(`🧪 DRY RUN: Would delete ${deletedCount} categories`);
      } else {
        if (onlySeedData) {
          // Delete only categories that match seed data (in reverse hierarchical order)
          const seedCategorySlugs = ALL_CATEGORY_SEEDS.map(
            (category) => category.slug,
          );

          // Delete children first, then parents (to maintain referential integrity)
          const maxDepth = Math.max(
            ...ALL_CATEGORY_SEEDS.map((cat) => cat.depthLevel),
          );

          for (let depth = maxDepth; depth >= 0; depth--) {
            const categoriesAtDepth = ALL_CATEGORY_SEEDS.filter(
              (cat) => cat.depthLevel === depth,
            ).map((cat) => cat.slug);

            for (const slug of categoriesAtDepth) {
              const result = await this.categoryRepository.delete({ slug });
              deletedCount += result.affected || 0;
            }
          }
        } else {
          // Delete all categories (dangerous operation)
          const result = await this.categoryRepository.delete({});
          deletedCount = result.affected || 0;
        }

        this.logger.log(`🗑️  Successfully deleted ${deletedCount} categories`);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        deletedCount,
        processingTimeMs: processingTime,
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Category cleanup failed after ${processingTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `Category cleanup failed: ${(error as Error).message}`,
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
    hierarchyIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
  }> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      const categoryCount = await this.categoryRepository.count();

      // Test seed data integrity
      const dataValidation = this.validateSeedDataIntegrity();

      // Test hierarchy integrity
      const hierarchyValidation =
        this.validateHierarchicalStructure(ALL_CATEGORY_SEEDS);

      // Get basic statistics
      const stats = await this.getSeedingStatistics();

      const processingTime = Date.now() - startTime;

      this.logger.log(`💚 Health check completed in ${processingTime}ms`);

      return {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: dataValidation ? 'valid' : 'invalid',
        hierarchyIntegrity: hierarchyValidation.isValid ? 'valid' : 'invalid',
        statistics: {
          totalCategoriesInDb: categoryCount,
          seedDataAvailable: ALL_CATEGORY_SEEDS.length,
          processingTime,
        },
        lastCheck: new Date(),
      };
    } catch (error: unknown) {
      this.logger.error(`❌ Health check failed: ${(error as Error).message}`);

      return {
        status: 'unhealthy',
        database: 'disconnected',
        seedDataIntegrity: 'invalid',
        hierarchyIntegrity: 'invalid',
        statistics: null,
        lastCheck: new Date(),
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * ✅ PREPARE CATEGORY DATA: Filter and prepare categories based on options
   */
  private prepareCategoryData(options: {
    includeRoot: boolean;
    includeElectronics: boolean;
    includeFashion: boolean;
    includeFood: boolean;
    specificDepthLevels: number[];
    minPopularityScore: number;
    maxPopularityScore: number;
    onlyFeatured: boolean;
    onlyApproved: boolean;
  }): CategorySeedData[] {
    let categories: CategorySeedData[] = [];

    // Collect categories based on types
    if (options.includeRoot) categories.push(...ROOT_CATEGORIES);
    if (options.includeElectronics)
      categories.push(...ELECTRONICS_SUBCATEGORIES);
    if (options.includeFashion) categories.push(...FASHION_SUBCATEGORIES);
    if (options.includeFood) categories.push(...FOOD_SUBCATEGORIES);

    // Filter by specific depth levels
    if (options.specificDepthLevels.length > 0) {
      categories = categories.filter((category) =>
        options.specificDepthLevels.includes(category.depthLevel),
      );
    }

    // Filter by popularity score range
    categories = categories.filter(
      (category) =>
        category.popularityScore >= options.minPopularityScore &&
        category.popularityScore <= options.maxPopularityScore,
    );

    // Filter by featured status
    if (options.onlyFeatured) {
      categories = categories.filter((category) => category.isFeatured);
    }

    // Filter by approval status
    if (options.onlyApproved) {
      categories = categories.filter(
        (category) => category.approvalStatus === 'approved',
      );
    }

    return categories;
  }

  /**
   * ✅ PROCESS CATEGORIES HIERARCHICALLY: Process categories in correct hierarchical order
   */
  private async processCategoriesHierarchically(
    categories: CategorySeedData[],
    options: {
      batchSize: number;
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    adminUser: User,
    queryRunner?: QueryRunner,
  ): Promise<CategorySeedResult> {
    const result: CategorySeedResult = {
      success: true,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      processingTimeMs: 0,
      errorDetails: [],
      statistics: CATEGORY_STATISTICS,
      performance: {
        averageTimePerCategory: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
      },
      hierarchy: {
        levelsProcessed: 0,
        rootCategoriesCreated: 0,
        childCategoriesCreated: 0,
        hierarchyValidation: true,
      },
    };

    // Sort categories by depth level to ensure parents are created before children
    const sortedCategories = [...categories].sort(
      (a, b) => a.depthLevel - b.depthLevel,
    );

    // Group by depth level
    const categoriesByLevel = new Map<number, CategorySeedData[]>();
    for (const category of sortedCategories) {
      if (!categoriesByLevel.has(category.depthLevel)) {
        categoriesByLevel.set(category.depthLevel, []);
      }
      categoriesByLevel.get(category.depthLevel)!.push(category);
    }

    let totalDbTime = 0;

    // Process each level in order
    for (const [level, levelCategories] of categoriesByLevel) {
      this.logger.log(
        `🔄 Processing level ${level} with ${levelCategories.length} categories`,
      );

      const batchCount = Math.ceil(levelCategories.length / options.batchSize);

      for (let i = 0; i < batchCount; i++) {
        const batchStart = i * options.batchSize;
        const batchEnd = Math.min(
          batchStart + options.batchSize,
          levelCategories.length,
        );
        const batch = levelCategories.slice(batchStart, batchEnd);

        this.logger.log(
          `🔄 Processing batch ${i + 1}/${batchCount} for level ${level} (${batch.length} categories)`,
        );

        const batchStartTime = Date.now();

        for (const categoryData of batch) {
          try {
            const dbStartTime = Date.now();
            const categoryResult = await this.processSingleCategory(
              categoryData,
              {
                skipDuplicates: options.skipDuplicates,
                updateExisting: options.updateExisting,
                dryRun: options.dryRun,
              },
              adminUser,
              queryRunner,
            );

            totalDbTime += Date.now() - dbStartTime;

            // Update counters
            result.totalProcessed++;
            switch (categoryResult) {
              case 'created':
                result.created++;
                if (level === 0) {
                  result.hierarchy.rootCategoriesCreated++;
                } else {
                  result.hierarchy.childCategoriesCreated++;
                }
                break;
              case 'updated':
                result.updated++;
                break;
              case 'skipped':
                result.skipped++;
                break;
            }
          } catch (error: unknown) {
            result.errors++;
            result.errorDetails.push({
              categoryName: categoryData.nameEn,
              error: (error as Error).message,
              details: (error as Error).stack,
            });

            this.logger.error(
              `❌ Failed to process category ${categoryData.nameEn}: ${(error as Error).message}`,
            );
          }
        }

        const batchTime = Date.now() - batchStartTime;
        this.logger.log(
          `✅ Batch ${i + 1} for level ${level} completed in ${batchTime}ms`,
        );
      }

      result.hierarchy.levelsProcessed++;
    }

    // Calculate performance metrics
    result.performance.dbOperationTime = totalDbTime;
    result.performance.averageTimePerCategory =
      result.totalProcessed > 0 ? totalDbTime / result.totalProcessed : 0;

    return result;
  }

  /**
   * ✅ PROCESS SINGLE CATEGORY: Handle individual category creation/update with hierarchy resolution
   */
  private async processSingleCategory(
    categoryData: CategorySeedData,
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    adminUser: User,
    queryRunner?: QueryRunner,
  ): Promise<'created' | 'updated' | 'skipped'> {
    // Check for existing category by slug
    const repository =
      queryRunner?.manager.getRepository(Category) || this.categoryRepository;
    const existingCategory = await repository.findOne({
      where: { slug: categoryData.slug },
    });

    if (existingCategory) {
      if (options.skipDuplicates && !options.updateExisting) {
        this.logger.debug(
          `⏭️  Skipped existing category: ${categoryData.nameEn}`,
        );
        return 'skipped';
      }

      if (options.updateExisting) {
        if (options.dryRun) {
          this.logger.debug(
            `🧪 DRY RUN: Would update category: ${categoryData.nameEn}`,
          );
          return 'updated';
        }

        // Update existing category
        const updateData = await this.transformSeedDataToCategory(
          categoryData,
          repository,
        );
        await repository.update(existingCategory.id, {
          ...updateData,
          updatedBy: adminUser.id,
        });

        this.logger.debug(
          `🔄 Updated existing category: ${categoryData.nameEn}`,
        );
        return 'updated';
      }
    }

    if (options.dryRun) {
      this.logger.debug(
        `🧪 DRY RUN: Would create category: ${categoryData.nameEn}`,
      );
      return 'created';
    }

    // Transform seed data to category entity format
    const categoryEntityData = await this.transformSeedDataToCategory(
      categoryData,
      repository,
    );

    // Create new category
    const newCategory = repository.create({
      ...categoryEntityData,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    });

    await repository.save(newCategory);
    this.logger.debug(`✨ Created new category: ${categoryData.nameEn}`);
    return 'created';
  }

  /**
   * ✅ TRANSFORM SEED DATA: Convert seed data to category entity format with parent resolution
   */
  private async transformSeedDataToCategory(
    seedData: CategorySeedData,
    repository: Repository<Category>,
  ): Promise<Partial<Category>> {
    let parentCategory: Category | null = null;

    // Resolve parent category if specified
    if (seedData.parentSlug) {
      parentCategory = await repository.findOne({
        where: { slug: seedData.parentSlug },
      });

      if (!parentCategory) {
        throw new BadRequestException(
          `Parent category with slug '${seedData.parentSlug}' not found for category '${seedData.nameEn}'`,
        );
      }
    }

    // Generate category path
    const categoryPath = parentCategory
      ? `${parentCategory.categoryPath || parentCategory.nameEn}/${seedData.nameEn}`
      : seedData.nameEn;

    return {
      nameEn: seedData.nameEn,
      nameAr: seedData.nameAr,
      slug: seedData.slug,
      descriptionEn: seedData.descriptionEn,
      descriptionAr: seedData.descriptionAr,
      iconUrl: seedData.iconUrl,
      bannerUrl: seedData.bannerUrl,
      themeColor: seedData.themeColor,
      seoTitle: seedData.seoTitle,
      seoDescription: seedData.seoDescription,
      seoSlug: seedData.seoSlug,
      approvalStatus: seedData.approvalStatus,
      isActive: seedData.isActive,
      isFeatured: seedData.isFeatured,
      sortOrder: seedData.sortOrder,
      showInNav: seedData.showInNav,
      popularityScore: seedData.popularityScore,
      commissionRate: seedData.commissionRate,
      minPrice: seedData.minPrice,
      maxPrice: seedData.maxPrice,
      depthLevel: seedData.depthLevel,
      categoryPath,
      parent: parentCategory,
      productCount: 0,
      viewCount: 0,
    };
  }

  /**
   * ✅ VALIDATE HIERARCHICAL STRUCTURE: Check parent-child relationships
   */
  private validateHierarchicalStructure(categories: CategorySeedData[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const categoryMap = new Map<string, CategorySeedData>();

    // Build category map
    for (const category of categories) {
      categoryMap.set(category.slug, category);
    }

    // Validate each category's parent relationship
    for (const category of categories) {
      if (category.parentSlug) {
        const parent = categoryMap.get(category.parentSlug);

        if (!parent) {
          errors.push(
            `Category '${category.nameEn}' references non-existent parent '${category.parentSlug}'`,
          );
        } else {
          // Validate depth level consistency
          if (category.depthLevel !== parent.depthLevel + 1) {
            errors.push(
              `Category '${category.nameEn}' has incorrect depth level ${category.depthLevel}, expected ${parent.depthLevel + 1}`,
            );
          }
        }
      } else {
        // Root category should have depth level 0
        if (category.depthLevel !== 0) {
          errors.push(
            `Root category '${category.nameEn}' should have depth level 0, found ${category.depthLevel}`,
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * ✅ VALIDATE CATEGORY DATA: Comprehensive validation of seed data
   */
  private validateCategoryData(
    categories: CategorySeedData[],
  ): CategorySeedResult {
    const errors: Array<{
      categoryName: string;
      error: string;
      details?: any;
    }> = [];

    categories.forEach((category) => {
      // Validate required fields
      if (!category.nameEn) {
        errors.push({
          categoryName: category.nameEn || 'Unknown',
          error: 'English name is required',
        });
      }

      if (!category.nameAr) {
        errors.push({
          categoryName: category.nameEn,
          error: 'Arabic name is required',
        });
      }

      if (!category.slug) {
        errors.push({
          categoryName: category.nameEn,
          error: 'Slug is required',
        });
      }

      // Validate slug format
      if (category.slug && !/^[a-z0-9-]+$/.test(category.slug)) {
        errors.push({
          categoryName: category.nameEn,
          error:
            'Slug must contain only lowercase letters, numbers, and hyphens',
        });
      }

      // Validate popularity score range
      if (category.popularityScore < 0 || category.popularityScore > 100) {
        errors.push({
          categoryName: category.nameEn,
          error: 'Popularity score must be between 0 and 100',
        });
      }

      // Validate commission rate
      if (
        category.commissionRate &&
        (category.commissionRate < 0 || category.commissionRate > 50)
      ) {
        errors.push({
          categoryName: category.nameEn,
          error: 'Commission rate must be between 0 and 50',
        });
      }
    });

    return {
      success: errors.length === 0,
      totalProcessed: categories.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      processingTimeMs: 0,
      errorDetails: errors,
      statistics: CATEGORY_STATISTICS,
      performance: {
        averageTimePerCategory: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
      },
      hierarchy: {
        levelsProcessed: 0,
        rootCategoriesCreated: 0,
        childCategoriesCreated: 0,
        hierarchyValidation: errors.length === 0,
      },
    };
  }

  /**
   * ✅ VALIDATE SEED DATA INTEGRITY: Check for issues in seed data
   */
  private validateSeedDataIntegrity(): boolean {
    try {
      // Check for duplicate slugs
      const slugs = ALL_CATEGORY_SEEDS.map((category) => category.slug);
      const uniqueSlugs = new Set(slugs);

      if (slugs.length !== uniqueSlugs.size) {
        this.logger.warn('⚠️  Duplicate slugs found in seed data');
        return false;
      }

      // Check for duplicate names
      const names = ALL_CATEGORY_SEEDS.map((category) => category.nameEn);
      const uniqueNames = new Set(names);

      if (names.length !== uniqueNames.size) {
        this.logger.warn('⚠️  Duplicate English names found in seed data');
        return false;
      }

      // Validate required fields
      for (const category of ALL_CATEGORY_SEEDS) {
        if (!category.nameEn || !category.nameAr || !category.slug) {
          this.logger.warn(
            `⚠️  Invalid category data: ${category.nameEn || 'Unknown'}`,
          );
          return false;
        }
      }

      return true;
    } catch (error: unknown) {
      this.logger.error(`❌ Seed data validation failed: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * ✅ GET SYSTEM USER: Get or create system user for audit trail
   */
  private async getSystemUser(): Promise<User> {
    let systemUser = await this.userRepository.findOne({
      where: { email: 'system@souqsyria.com' },
    });

    if (!systemUser) {
      // Create system user if it doesn't exist
      systemUser = this.userRepository.create({
        email: 'system@souqsyria.com',
        fullName: 'System User',
        firebaseUid: 'system-uid',
        isVerified: true,
        // Add other required fields based on your User entity
      });
      systemUser = await this.userRepository.save(systemUser);
    }

    return systemUser;
  }

  /**
   * ✅ CLEAR EXISTING CATEGORIES: Remove all existing categories (dangerous operation)
   */
  private async clearExistingCategories(
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const repository =
      queryRunner?.manager.getRepository(Category) || this.categoryRepository;

    const deletedCount = await repository.delete({});
    this.logger.warn(
      `🗑️  Cleared ${deletedCount.affected || 0} existing categories`,
    );
  }

  /**
   * ✅ COUNT DUPLICATE CATEGORIES: Count categories with duplicate slugs
   */
  private async countDuplicateCategories(): Promise<number> {
    const duplicateSlugs = await this.categoryRepository
      .createQueryBuilder('category')
      .select('category.slug')
      .addSelect('COUNT(*)', 'count')
      .groupBy('category.slug')
      .having('COUNT(*) > 1')
      .getRawMany();

    const duplicateNames = await this.categoryRepository
      .createQueryBuilder('category')
      .select('category.nameEn')
      .addSelect('COUNT(*)', 'count')
      .groupBy('category.nameEn')
      .having('COUNT(*) > 1')
      .getRawMany();

    return duplicateSlugs.length + duplicateNames.length;
  }
}

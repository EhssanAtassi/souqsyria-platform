/**
 * @file brand-seeder.service.ts
 * @description Enterprise Brand Seeding Service for SouqSyria Platform
 *
 * SEEDING FEATURES:
 * - Comprehensive brand data seeding with Syrian market focus
 * - Bulk operations with transaction safety and rollback
 * - Duplicate detection and intelligent conflict resolution
 * - Performance monitoring and batch processing optimization
 * - Multi-language support (Arabic/English)
 * - Advanced filtering and validation
 * - Comprehensive logging and error handling
 * - Statistics tracking and analytics
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
import { Brand } from '../entities/brand.entity';
import { User } from '../../users/entities/user.entity';
import {
  ALL_BRAND_SEEDS,
  SYRIAN_BRANDS,
  REGIONAL_BRANDS,
  INTERNATIONAL_BRANDS,
  BRAND_STATISTICS,
  BrandSeedData,
  getBrandsByCountry,
  getVerifiedBrands,
  getMostPopularBrands,
} from './brand-seeds.data';

/**
 * Seeding Options Interface
 */
export interface BrandSeedOptions {
  includeSyrian?: boolean;
  includeRegional?: boolean;
  includeInternational?: boolean;
  clearExisting?: boolean;
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  specificCountries?: string[];
  minPopularityScore?: number;
  maxPopularityScore?: number;
  onlyVerified?: boolean;
  dryRun?: boolean;
}

/**
 * Seeding Result Interface
 */
export interface BrandSeedResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  processingTimeMs: number;
  errorDetails: Array<{
    brandName: string;
    error: string;
    details?: any;
  }>;
  statistics: {
    total: number;
    syrian: number;
    regional: number;
    international: number;
    verified: number;
    mostPopular: number;
    averagePopularityScore: number;
  };
  performance: {
    averageTimePerBrand: number;
    batchProcessingTime: number;
    dbOperationTime: number;
  };
}

@Injectable()
export class BrandSeederService {
  private readonly logger = new Logger(BrandSeederService.name);

  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ✅ SEED ALL BRANDS: Main seeding method with comprehensive options
   */
  async seedBrands(
    options: BrandSeedOptions = {},
    adminUser?: User,
  ): Promise<BrandSeedResult> {
    const startTime = Date.now();
    let queryRunner: QueryRunner | null = null;

    // Default options
    const {
      includeSyrian = true,
      includeRegional = true,
      includeInternational = true,
      clearExisting = false,
      batchSize = 50,
      validateOnly = false,
      skipDuplicates = true,
      updateExisting = false,
      specificCountries = [],
      minPopularityScore = 0,
      maxPopularityScore = 100,
      onlyVerified = false,
      dryRun = false,
    } = options;

    this.logger.log('🌱 Starting brand seeding process...');
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
        await this.clearExistingBrands(queryRunner);
      }

      // Prepare brand data based on options
      const brandsToSeed = this.prepareBrandData({
        includeSyrian,
        includeRegional,
        includeInternational,
        specificCountries,
        minPopularityScore,
        maxPopularityScore,
        onlyVerified,
      });

      this.logger.log(`📊 Prepared ${brandsToSeed.length} brands for seeding`);

      // Validate data if requested
      if (validateOnly) {
        return this.validateBrandData(brandsToSeed);
      }

      // Process brands in batches for optimal performance
      const result = await this.processBrandsInBatches(
        brandsToSeed,
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
        `🎉 Brand seeding completed successfully in ${processingTime}ms`,
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
        `❌ Brand seeding failed after ${processingTime}ms: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Brand seeding failed: ${error.message}`,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  /**
   * ✅ SEED SPECIFIC BRAND TYPES: Seed only specific brand categories
   */
  async seedSyrianBrands(adminUser?: User): Promise<BrandSeedResult> {
    return this.seedBrands(
      {
        includeSyrian: true,
        includeRegional: false,
        includeInternational: false,
        clearExisting: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedRegionalBrands(adminUser?: User): Promise<BrandSeedResult> {
    return this.seedBrands(
      {
        includeSyrian: false,
        includeRegional: true,
        includeInternational: false,
        clearExisting: false,
        skipDuplicates: true,
      },
      adminUser,
    );
  }

  async seedInternationalBrands(adminUser?: User): Promise<BrandSeedResult> {
    return this.seedBrands(
      {
        includeSyrian: false,
        includeRegional: false,
        includeInternational: true,
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
    seedData: typeof BRAND_STATISTICS;
    database: {
      totalBrands: number;
      syrianBrands: number;
      verifiedBrands: number;
      approvedBrands: number;
      activeBrands: number;
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
        totalBrands,
        syrianBrands,
        verifiedBrands,
        approvedBrands,
        activeBrands,
      ] = await Promise.all([
        this.brandRepository.count(),
        this.brandRepository.count({
          where: { countryOfOrigin: 'Syria' },
        }),
        this.brandRepository.count({ where: { isVerified: true } }),
        this.brandRepository.count({
          where: { approvalStatus: 'approved' },
        }),
        this.brandRepository.count({ where: { isActive: true } }),
      ]);

      // Calculate progress and missing data
      const seedingProgress = Math.round(
        (totalBrands / ALL_BRAND_SEEDS.length) * 100,
      );
      const missingFromDb = Math.max(0, ALL_BRAND_SEEDS.length - totalBrands);

      // Check for duplicates (brands with same name or slug)
      const duplicateCount = await this.countDuplicateBrands();

      const processingTime = Date.now() - startTime;

      this.logger.log(`📊 Statistics generated in ${processingTime}ms`);

      return {
        seedData: BRAND_STATISTICS,
        database: {
          totalBrands,
          syrianBrands,
          verifiedBrands,
          approvedBrands,
          activeBrands,
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
   * ✅ CLEANUP BRANDS: Remove seeded brands or all brands
   */
  async cleanupBrands(
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
      if (confirmationCode !== 'DELETE_ALL_BRANDS_CONFIRMED') {
        throw new BadRequestException(
          'Complete brand deletion requires confirmation code',
        );
      }
    }

    try {
      let deletedCount = 0;

      if (dryRun) {
        // Count what would be deleted
        if (onlySeedData) {
          const seedBrandSlugs = ALL_BRAND_SEEDS.map((brand) => brand.slug);
          // Count brands matching seed data slugs
          let totalCount = 0;
          for (const slug of seedBrandSlugs) {
            const count = await this.brandRepository.count({ where: { slug } });
            totalCount += count;
          }
          deletedCount = totalCount;
        } else {
          deletedCount = await this.brandRepository.count();
        }

        this.logger.log(`🧪 DRY RUN: Would delete ${deletedCount} brands`);
      } else {
        if (onlySeedData) {
          // Delete only brands that match seed data
          const seedBrandSlugs = ALL_BRAND_SEEDS.map((brand) => brand.slug);
          // Delete brands one by one to avoid TypeScript issues
          let totalDeleted = 0;
          for (const slug of seedBrandSlugs) {
            const result = await this.brandRepository.delete({ slug });
            totalDeleted += result.affected || 0;
          }
          deletedCount = totalDeleted;
        } else {
          // Delete all brands (dangerous operation)
          const result = await this.brandRepository.delete({});
          deletedCount = result.affected || 0;
        }

        this.logger.log(`🗑️  Successfully deleted ${deletedCount} brands`);
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
        `❌ Brand cleanup failed after ${processingTime}ms: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Brand cleanup failed: ${error.message}`,
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
    statistics: any;
    lastCheck: Date;
  }> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      const brandCount = await this.brandRepository.count();

      // Test seed data integrity
      const dataValidation = this.validateSeedDataIntegrity();

      // Get basic statistics
      const stats = await this.getSeedingStatistics();

      const processingTime = Date.now() - startTime;

      this.logger.log(`💚 Health check completed in ${processingTime}ms`);

      return {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: dataValidation ? 'valid' : 'invalid',
        statistics: {
          totalBrandsInDb: brandCount,
          seedDataAvailable: ALL_BRAND_SEEDS.length,
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
        statistics: null,
        lastCheck: new Date(),
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * ✅ PREPARE BRAND DATA: Filter and prepare brands based on options
   */
  private prepareBrandData(options: {
    includeSyrian: boolean;
    includeRegional: boolean;
    includeInternational: boolean;
    specificCountries: string[];
    minPopularityScore: number;
    maxPopularityScore: number;
    onlyVerified: boolean;
  }): BrandSeedData[] {
    let brands: BrandSeedData[] = [];

    // Collect brands based on categories
    if (options.includeSyrian) brands.push(...SYRIAN_BRANDS);
    if (options.includeRegional) brands.push(...REGIONAL_BRANDS);
    if (options.includeInternational) brands.push(...INTERNATIONAL_BRANDS);

    // Filter by specific countries
    if (options.specificCountries.length > 0) {
      brands = brands.filter((brand) =>
        options.specificCountries.includes(brand.countryOfOrigin || ''),
      );
    }

    // Filter by popularity score range
    brands = brands.filter(
      (brand) =>
        brand.popularityScore >= options.minPopularityScore &&
        brand.popularityScore <= options.maxPopularityScore,
    );

    // Filter by verification status
    if (options.onlyVerified) {
      brands = brands.filter((brand) => brand.isVerified);
    }

    return brands;
  }

  /**
   * ✅ PROCESS BRANDS IN BATCHES: Efficient batch processing with performance monitoring
   */
  private async processBrandsInBatches(
    brands: BrandSeedData[],
    options: {
      batchSize: number;
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    adminUser: User,
    queryRunner?: QueryRunner,
  ): Promise<BrandSeedResult> {
    const result: BrandSeedResult = {
      success: true,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      processingTimeMs: 0,
      errorDetails: [],
      statistics: BRAND_STATISTICS,
      performance: {
        averageTimePerBrand: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
      },
    };

    const batchCount = Math.ceil(brands.length / options.batchSize);
    let totalDbTime = 0;

    for (let i = 0; i < batchCount; i++) {
      const batchStart = i * options.batchSize;
      const batchEnd = Math.min(batchStart + options.batchSize, brands.length);
      const batch = brands.slice(batchStart, batchEnd);

      this.logger.log(
        `🔄 Processing batch ${i + 1}/${batchCount} (${batch.length} brands)`,
      );

      const batchStartTime = Date.now();

      for (const brandData of batch) {
        try {
          const dbStartTime = Date.now();
          const brandResult = await this.processSingleBrand(
            brandData,
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
          switch (brandResult) {
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
        } catch (error) {
          result.errors++;
          result.errorDetails.push({
            brandName: brandData.name,
            error: error.message,
            details: error.stack,
          });

          this.logger.error(
            `❌ Failed to process brand ${brandData.name}: ${error.message}`,
          );
        }
      }

      const batchTime = Date.now() - batchStartTime;
      this.logger.log(`✅ Batch ${i + 1} completed in ${batchTime}ms`);
    }

    // Calculate performance metrics
    result.performance.dbOperationTime = totalDbTime;
    result.performance.averageTimePerBrand =
      result.totalProcessed > 0 ? totalDbTime / result.totalProcessed : 0;

    return result;
  }

  /**
   * ✅ PROCESS SINGLE BRAND: Handle individual brand creation/update with conflict resolution
   */
  private async processSingleBrand(
    brandData: BrandSeedData,
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    adminUser: User,
    queryRunner?: QueryRunner,
  ): Promise<'created' | 'updated' | 'skipped'> {
    // Check for existing brand by slug (unique identifier)
    const repository =
      queryRunner?.manager.getRepository(Brand) || this.brandRepository;
    const existingBrand = await repository.findOne({
      where: { slug: brandData.slug },
    });

    if (existingBrand) {
      if (options.skipDuplicates && !options.updateExisting) {
        this.logger.debug(`⏭️  Skipped existing brand: ${brandData.name}`);
        return 'skipped';
      }

      if (options.updateExisting) {
        if (options.dryRun) {
          this.logger.debug(
            `🧪 DRY RUN: Would update brand: ${brandData.name}`,
          );
          return 'updated';
        }

        // Update existing brand
        await repository.update(existingBrand.id, {
          ...this.transformSeedDataToBrand(brandData),
          updatedBy: adminUser.id,
        });

        this.logger.debug(`🔄 Updated existing brand: ${brandData.name}`);
        return 'updated';
      }
    }

    if (options.dryRun) {
      this.logger.debug(`🧪 DRY RUN: Would create brand: ${brandData.name}`);
      return 'created';
    }

    // Create new brand
    const newBrand = repository.create({
      ...this.transformSeedDataToBrand(brandData),
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    });

    await repository.save(newBrand);
    this.logger.debug(`✨ Created new brand: ${brandData.name}`);
    return 'created';
  }

  /**
   * ✅ TRANSFORM SEED DATA: Convert seed data to brand entity format
   */
  private transformSeedDataToBrand(seedData: BrandSeedData): Partial<Brand> {
    return {
      name: seedData.name,
      nameAr: seedData.nameAr,
      slug: seedData.slug,
      descriptionEn: seedData.descriptionEn,
      descriptionAr: seedData.descriptionAr,
      logoUrl: seedData.logoUrl,
      countryOfOrigin: seedData.countryOfOrigin,
      isActive: seedData.isActive,
      verificationStatus: seedData.verificationStatus,
      verificationType: seedData.verificationType,
      approvalStatus: seedData.approvalStatus,
      isVerified: seedData.isVerified,
      trademarkNumber: seedData.trademarkNumber,
      popularityScore: seedData.popularityScore,
      productCount: 0,
      totalSalesSyp: 0,
      viewCount: 0,
    };
  }

  /**
   * ✅ VALIDATE BRAND DATA: Comprehensive validation of seed data
   */
  private validateBrandData(brands: BrandSeedData[]): BrandSeedResult {
    const errors: Array<{
      brandName: string;
      error: string;
      details?: any;
    }> = [];

    brands.forEach((brand) => {
      // Validate required fields
      if (!brand.name) {
        errors.push({
          brandName: brand.name || 'Unknown',
          error: 'Name is required',
        });
      }

      if (!brand.slug) {
        errors.push({
          brandName: brand.name,
          error: 'Slug is required',
        });
      }

      // Validate slug format
      if (brand.slug && !/^[a-z0-9-]+$/.test(brand.slug)) {
        errors.push({
          brandName: brand.name,
          error:
            'Slug must contain only lowercase letters, numbers, and hyphens',
        });
      }

      // Validate popularity score range
      if (brand.popularityScore < 0 || brand.popularityScore > 100) {
        errors.push({
          brandName: brand.name,
          error: 'Popularity score must be between 0 and 100',
        });
      }
    });

    return {
      success: errors.length === 0,
      totalProcessed: brands.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      processingTimeMs: 0,
      errorDetails: errors,
      statistics: BRAND_STATISTICS,
      performance: {
        averageTimePerBrand: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
      },
    };
  }

  /**
   * ✅ VALIDATE SEED DATA INTEGRITY: Check for issues in seed data
   */
  private validateSeedDataIntegrity(): boolean {
    try {
      // Check for duplicate slugs
      const slugs = ALL_BRAND_SEEDS.map((brand) => brand.slug);
      const uniqueSlugs = new Set(slugs);

      if (slugs.length !== uniqueSlugs.size) {
        this.logger.warn('⚠️  Duplicate slugs found in seed data');
        return false;
      }

      // Check for duplicate names
      const names = ALL_BRAND_SEEDS.map((brand) => brand.name);
      const uniqueNames = new Set(names);

      if (names.length !== uniqueNames.size) {
        this.logger.warn('⚠️  Duplicate names found in seed data');
        return false;
      }

      // Validate required fields
      for (const brand of ALL_BRAND_SEEDS) {
        if (!brand.name || !brand.slug) {
          this.logger.warn(
            `⚠️  Invalid brand data: ${brand.name || 'Unknown'}`,
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
   * ✅ CLEAR EXISTING BRANDS: Remove all existing brands (dangerous operation)
   */
  private async clearExistingBrands(queryRunner?: QueryRunner): Promise<void> {
    const repository =
      queryRunner?.manager.getRepository(Brand) || this.brandRepository;

    const deletedCount = await repository.delete({});
    this.logger.warn(
      `🗑️  Cleared ${deletedCount.affected || 0} existing brands`,
    );
  }

  /**
   * ✅ COUNT DUPLICATE BRANDS: Count brands with duplicate names or slugs
   */
  private async countDuplicateBrands(): Promise<number> {
    const duplicateSlugs = await this.brandRepository
      .createQueryBuilder('brand')
      .select('brand.slug')
      .addSelect('COUNT(*)', 'count')
      .groupBy('brand.slug')
      .having('COUNT(*) > 1')
      .getRawMany();

    const duplicateNames = await this.brandRepository
      .createQueryBuilder('brand')
      .select('brand.name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('brand.name')
      .having('COUNT(*) > 1')
      .getRawMany();

    return duplicateSlugs.length + duplicateNames.length;
  }
}

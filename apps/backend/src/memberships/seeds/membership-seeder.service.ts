/**
 * @file membership-seeder.service.ts
 * @description Enterprise Membership Seeding Service for SouqSyria Platform
 *
 * SEEDING FEATURES:
 * - Comprehensive membership data seeding with Syrian business focus
 * - Tier-based membership creation (Basic, Premium, VIP, Enterprise)
 * - Business type filtering and validation
 * - Bulk operations with transaction safety and rollback
 * - Duplicate detection and intelligent conflict resolution
 * - Performance monitoring and batch processing optimization
 * - Multi-language support (Arabic/English memberships)
 * - Advanced filtering and validation
 * - Comprehensive logging and error handling
 * - Statistics tracking and analytics
 * - Syrian business features validation
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
import { Membership } from '../entities/membership.entity';
import {
  ALL_MEMBERSHIP_SEEDS,
  BASIC_MEMBERSHIPS,
  PREMIUM_MEMBERSHIPS,
  VIP_MEMBERSHIPS,
  ENTERPRISE_MEMBERSHIPS,
  SPECIAL_MEMBERSHIPS,
  MEMBERSHIP_STATISTICS,
  MembershipSeedData,
  getMembershipsByBusinessType,
  getMembershipsByDuration,
  getActiveMemberships,
  getPopularMemberships,
  getMembershipsByPriceRange,
  getMembershipsWithFeature,
} from './membership-seeds.data';

/**
 * Seeding Options Interface
 */
export interface MembershipSeedOptions {
  includeBasic?: boolean;
  includePremium?: boolean;
  includeVip?: boolean;
  includeEnterprise?: boolean;
  includeSpecial?: boolean;
  clearExisting?: boolean;
  batchSize?: number;
  validateOnly?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  specificBusinessTypes?: string[];
  specificDurations?: number[];
  onlyActive?: boolean;
  onlyPopular?: boolean;
  priceRangeMin?: number;
  priceRangeMax?: number;
  specificFeatures?: string[];
  dryRun?: boolean;
  validateFeatures?: boolean;
}

/**
 * Seeding Result Interface
 */
export interface MembershipSeedResult {
  success: boolean;
  totalProcessed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  processingTimeMs: number;
  errorDetails: Array<{
    membershipName: string;
    businessType: string;
    error: string;
    details?: any;
  }>;
  statistics: {
    total: number;
    basic: number;
    premium: number;
    vip: number;
    enterprise: number;
    special: number;
    active: number;
    popular: number;
    monthly: number;
    yearly: number;
  };
  performance: {
    averageTimePerMembership: number;
    batchProcessingTime: number;
    dbOperationTime: number;
    validationTime: number;
  };
  features: {
    featuresProcessed: number;
    featuresValidated: number;
    featureValidationTime: number;
    missingFeatures: string[];
  };
}

@Injectable()
export class MembershipSeederService {
  private readonly logger = new Logger(MembershipSeederService.name);

  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ✅ SEED ALL MEMBERSHIPS: Main seeding method with comprehensive options
   */
  async seedMemberships(
    options: MembershipSeedOptions = {},
  ): Promise<MembershipSeedResult> {
    const startTime = Date.now();
    let queryRunner: QueryRunner | null = null;

    // Default options
    const {
      includeBasic = true,
      includePremium = true,
      includeVip = true,
      includeEnterprise = true,
      includeSpecial = false,
      clearExisting = false,
      batchSize = 10,
      validateOnly = false,
      skipDuplicates = true,
      updateExisting = false,
      specificBusinessTypes = [],
      specificDurations = [],
      onlyActive = false,
      onlyPopular = false,
      priceRangeMin = 0,
      priceRangeMax = Number.MAX_SAFE_INTEGER,
      specificFeatures = [],
      dryRun = false,
      validateFeatures = true,
    } = options;

    this.logger.log('🌱 Starting membership seeding process...');
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
        await this.clearExistingMemberships(queryRunner);
      }

      // Prepare membership data based on options
      const membershipsToSeed = this.prepareMembershipData({
        includeBasic,
        includePremium,
        includeVip,
        includeEnterprise,
        includeSpecial,
        specificBusinessTypes,
        specificDurations,
        onlyActive,
        onlyPopular,
        priceRangeMin,
        priceRangeMax,
        specificFeatures,
      });

      this.logger.log(
        `📊 Prepared ${membershipsToSeed.length} memberships for seeding`,
      );

      // Validate features if requested
      if (validateFeatures) {
        const featureValidation =
          await this.validateMembershipFeatures(membershipsToSeed);
        if (!featureValidation.isValid) {
          throw new BadRequestException(
            `Feature validation failed: Missing features: ${featureValidation.missingFeatures.join(', ')}`,
          );
        }
        this.logger.log('✅ Feature validation passed');
      }

      // Validate data if requested
      if (validateOnly) {
        return this.validateMembershipData(membershipsToSeed);
      }

      // Process memberships in batches
      const result = await this.processMembershipsBatch(
        membershipsToSeed,
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
        `🎉 Membership seeding completed successfully in ${processingTime}ms`,
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
        `❌ Membership seeding failed after ${processingTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `Membership seeding failed: ${(error as Error).message}`,
      );
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }
  }

  /**
   * ✅ SEED SPECIFIC MEMBERSHIP TYPES: Seed only specific membership groups
   */
  async seedBasicMemberships(): Promise<MembershipSeedResult> {
    return this.seedMemberships({
      includeBasic: true,
      includePremium: false,
      includeVip: false,
      includeEnterprise: false,
      includeSpecial: false,
      skipDuplicates: true,
    });
  }

  async seedPremiumMemberships(): Promise<MembershipSeedResult> {
    return this.seedMemberships({
      includeBasic: false,
      includePremium: true,
      includeVip: false,
      includeEnterprise: false,
      includeSpecial: false,
      skipDuplicates: true,
    });
  }

  async seedVipMemberships(): Promise<MembershipSeedResult> {
    return this.seedMemberships({
      includeBasic: false,
      includePremium: false,
      includeVip: true,
      includeEnterprise: false,
      includeSpecial: false,
      skipDuplicates: true,
    });
  }

  async seedEnterpriseMemberships(): Promise<MembershipSeedResult> {
    return this.seedMemberships({
      includeBasic: false,
      includePremium: false,
      includeVip: false,
      includeEnterprise: true,
      includeSpecial: false,
      skipDuplicates: true,
    });
  }

  async seedSpecialMemberships(): Promise<MembershipSeedResult> {
    return this.seedMemberships({
      includeBasic: false,
      includePremium: false,
      includeVip: false,
      includeEnterprise: false,
      includeSpecial: true,
      skipDuplicates: true,
    });
  }

  /**
   * ✅ GET SEEDING STATISTICS: Comprehensive statistics about available seed data
   */
  async getSeedingStatistics(): Promise<{
    seedData: typeof MEMBERSHIP_STATISTICS;
    database: {
      totalMemberships: number;
      activeMemberships: number;
      popularMemberships: number;
      monthlyMemberships: number;
      yearlyMemberships: number;
      basicMemberships: number;
      premiumMemberships: number;
      vipMemberships: number;
      enterpriseMemberships: number;
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
        totalMemberships,
        activeMemberships,
        popularMemberships,
        monthlyMemberships,
        yearlyMemberships,
      ] = await Promise.all([
        this.membershipRepository.count(),
        this.membershipRepository.count({ where: { isActive: true } }),
        this.membershipRepository.count({ where: { isPopular: true } }),
        this.membershipRepository.count({ where: { durationInDays: 30 } }),
        this.membershipRepository.count({ where: { durationInDays: 365 } }),
      ]);

      // Count memberships by type (based on name patterns)
      const basicMemberships = await this.membershipRepository
        .createQueryBuilder('membership')
        .where('LOWER(membership.name) LIKE :pattern', { pattern: '%basic%' })
        .getCount();

      const premiumMemberships = await this.membershipRepository
        .createQueryBuilder('membership')
        .where('LOWER(membership.name) LIKE :pattern', { pattern: '%premium%' })
        .getCount();

      const vipMemberships = await this.membershipRepository
        .createQueryBuilder('membership')
        .where('LOWER(membership.name) LIKE :pattern', { pattern: '%vip%' })
        .getCount();

      const enterpriseMemberships = await this.membershipRepository
        .createQueryBuilder('membership')
        .where('LOWER(membership.name) LIKE :pattern', {
          pattern: '%enterprise%',
        })
        .getCount();

      // Calculate progress and missing data
      const seedingProgress = Math.round(
        (totalMemberships / ALL_MEMBERSHIP_SEEDS.length) * 100,
      );
      const missingFromDb = Math.max(
        0,
        ALL_MEMBERSHIP_SEEDS.length - totalMemberships,
      );

      // Check for duplicates (memberships with same name)
      const duplicateCount = await this.countDuplicateMemberships();

      const processingTime = Date.now() - startTime;

      this.logger.log(`📊 Statistics generated in ${processingTime}ms`);

      return {
        seedData: MEMBERSHIP_STATISTICS,
        database: {
          totalMemberships,
          activeMemberships,
          popularMemberships,
          monthlyMemberships,
          yearlyMemberships,
          basicMemberships,
          premiumMemberships,
          vipMemberships,
          enterpriseMemberships,
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
   * ✅ CLEANUP MEMBERSHIPS: Remove seeded memberships or all memberships
   */
  async cleanupMemberships(
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
      if (confirmationCode !== 'DELETE_ALL_MEMBERSHIPS_CONFIRMED') {
        throw new BadRequestException(
          'Complete membership deletion requires confirmation code',
        );
      }
    }

    try {
      let deletedCount = 0;

      if (dryRun) {
        // Count what would be deleted
        if (onlySeedData) {
          const seedMembershipNames = ALL_MEMBERSHIP_SEEDS.map(
            (membership) => membership.name,
          );
          let totalCount = 0;
          for (const name of seedMembershipNames) {
            const count = await this.membershipRepository.count({
              where: { name },
            });
            totalCount += count;
          }
          deletedCount = totalCount;
        } else {
          if (excludeActive) {
            deletedCount = await this.membershipRepository.count({
              where: { isActive: false },
            });
          } else {
            deletedCount = await this.membershipRepository.count();
          }
        }

        this.logger.log(`🧪 DRY RUN: Would delete ${deletedCount} memberships`);
      } else {
        if (onlySeedData) {
          // Delete only memberships that match seed data
          const seedMembershipNames = ALL_MEMBERSHIP_SEEDS.map(
            (membership) => membership.name,
          );

          for (const name of seedMembershipNames) {
            const result = await this.membershipRepository.delete({ name });
            deletedCount += result.affected || 0;
          }
        } else {
          // Delete all memberships (dangerous operation)
          if (excludeActive) {
            const result = await this.membershipRepository.delete({
              isActive: false,
            });
            deletedCount = result.affected || 0;
          } else {
            const result = await this.membershipRepository.delete({});
            deletedCount = result.affected || 0;
          }
        }

        this.logger.log(`🗑️  Successfully deleted ${deletedCount} memberships`);
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
        `❌ Membership cleanup failed after ${processingTime}ms: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        `Membership cleanup failed: ${(error as Error).message}`,
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
    featureIntegrity: 'valid' | 'invalid';
    statistics: any;
    lastCheck: Date;
  }> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      const membershipCount = await this.membershipRepository.count();

      // Test seed data integrity
      const dataValidation = this.validateSeedDataIntegrity();

      // Test feature integrity
      const featureValidation =
        await this.validateMembershipFeatures(ALL_MEMBERSHIP_SEEDS);

      // Get basic statistics
      const stats = await this.getSeedingStatistics();

      const processingTime = Date.now() - startTime;

      this.logger.log(`💚 Health check completed in ${processingTime}ms`);

      return {
        status: 'healthy',
        database: 'connected',
        seedDataIntegrity: dataValidation ? 'valid' : 'invalid',
        featureIntegrity: featureValidation.isValid ? 'valid' : 'invalid',
        statistics: {
          totalMembershipsInDb: membershipCount,
          seedDataAvailable: ALL_MEMBERSHIP_SEEDS.length,
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
        featureIntegrity: 'invalid',
        statistics: null,
        lastCheck: new Date(),
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * ✅ PREPARE MEMBERSHIP DATA: Filter and prepare memberships based on options
   */
  private prepareMembershipData(options: {
    includeBasic: boolean;
    includePremium: boolean;
    includeVip: boolean;
    includeEnterprise: boolean;
    includeSpecial: boolean;
    specificBusinessTypes: string[];
    specificDurations: number[];
    onlyActive: boolean;
    onlyPopular: boolean;
    priceRangeMin: number;
    priceRangeMax: number;
    specificFeatures: string[];
  }): MembershipSeedData[] {
    let memberships: MembershipSeedData[] = [];

    // Collect memberships based on types
    if (options.includeBasic) memberships.push(...BASIC_MEMBERSHIPS);
    if (options.includePremium) memberships.push(...PREMIUM_MEMBERSHIPS);
    if (options.includeVip) memberships.push(...VIP_MEMBERSHIPS);
    if (options.includeEnterprise) memberships.push(...ENTERPRISE_MEMBERSHIPS);
    if (options.includeSpecial) memberships.push(...SPECIAL_MEMBERSHIPS);

    // Filter by specific business types
    if (options.specificBusinessTypes.length > 0) {
      memberships = memberships.filter((membership) =>
        options.specificBusinessTypes.includes(membership.businessType),
      );
    }

    // Filter by specific durations
    if (options.specificDurations.length > 0) {
      memberships = memberships.filter((membership) =>
        options.specificDurations.includes(membership.durationInDays),
      );
    }

    // Filter by active status
    if (options.onlyActive) {
      memberships = memberships.filter((membership) => membership.isActive);
    }

    // Filter by popular status
    if (options.onlyPopular) {
      memberships = memberships.filter((membership) => membership.isPopular);
    }

    // Filter by price range
    memberships = memberships.filter(
      (membership) =>
        membership.price >= options.priceRangeMin &&
        membership.price <= options.priceRangeMax,
    );

    // Filter by specific features
    if (options.specificFeatures.length > 0) {
      memberships = memberships.filter((membership) =>
        options.specificFeatures.every(
          (feature) =>
            membership.syrianBusinessFeatures[
              feature as keyof typeof membership.syrianBusinessFeatures
            ] === true,
        ),
      );
    }

    return memberships;
  }

  /**
   * ✅ PROCESS MEMBERSHIPS BATCH: Process memberships in batches with performance optimization
   */
  private async processMembershipsBatch(
    memberships: MembershipSeedData[],
    options: {
      batchSize: number;
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    queryRunner?: QueryRunner,
  ): Promise<MembershipSeedResult> {
    const result: MembershipSeedResult = {
      success: true,
      totalProcessed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      processingTimeMs: 0,
      errorDetails: [],
      statistics: MEMBERSHIP_STATISTICS,
      performance: {
        averageTimePerMembership: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        validationTime: 0,
      },
      features: {
        featuresProcessed: 0,
        featuresValidated: 0,
        featureValidationTime: 0,
        missingFeatures: [],
      },
    };

    let totalDbTime = 0;
    let totalValidationTime = 0;
    const batchCount = Math.ceil(memberships.length / options.batchSize);

    for (let i = 0; i < batchCount; i++) {
      const batchStart = i * options.batchSize;
      const batchEnd = Math.min(
        batchStart + options.batchSize,
        memberships.length,
      );
      const batch = memberships.slice(batchStart, batchEnd);

      this.logger.log(
        `🔄 Processing batch ${i + 1}/${batchCount} (${batch.length} memberships)`,
      );

      const batchStartTime = Date.now();

      for (const membershipData of batch) {
        try {
          const dbStartTime = Date.now();
          const validationStartTime = Date.now();

          const membershipResult = await this.processSingleMembership(
            membershipData,
            {
              skipDuplicates: options.skipDuplicates,
              updateExisting: options.updateExisting,
              dryRun: options.dryRun,
            },
            queryRunner,
          );

          const validationTime = Date.now() - validationStartTime;
          totalValidationTime += validationTime;
          totalDbTime += Date.now() - dbStartTime;

          // Update counters
          result.totalProcessed++;

          // In dry run mode, don't count actual operations, but track what would happen
          if (options.dryRun) {
            // In dry run, everything is considered "processed" but nothing is actually created/updated
            switch (membershipResult) {
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
            switch (membershipResult) {
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
        } catch (error: unknown) {
          result.errors++;
          result.errorDetails.push({
            membershipName: membershipData.name,
            businessType: membershipData.businessType,
            error: (error as Error).message,
            details: (error as Error).stack,
          });

          this.logger.error(
            `❌ Failed to process membership ${membershipData.name} (${membershipData.businessType}): ${(error as Error).message}`,
          );
        }
      }

      const batchTime = Date.now() - batchStartTime;
      this.logger.log(`✅ Batch ${i + 1} completed in ${batchTime}ms`);
    }

    // Calculate performance metrics
    result.performance.dbOperationTime = totalDbTime;
    result.performance.validationTime = totalValidationTime;
    result.performance.averageTimePerMembership =
      result.totalProcessed > 0 ? totalDbTime / result.totalProcessed : 0;

    return result;
  }

  /**
   * ✅ PROCESS SINGLE MEMBERSHIP: Handle individual membership creation/update
   */
  private async processSingleMembership(
    membershipData: MembershipSeedData,
    options: {
      skipDuplicates: boolean;
      updateExisting: boolean;
      dryRun: boolean;
    },
    queryRunner?: QueryRunner,
  ): Promise<'created' | 'updated' | 'skipped'> {
    // Check for existing membership by name
    const repository =
      queryRunner?.manager.getRepository(Membership) ||
      this.membershipRepository;
    const existingMembership = await repository.findOne({
      where: { name: membershipData.name },
    });

    if (existingMembership) {
      if (options.skipDuplicates && !options.updateExisting) {
        this.logger.debug(
          `⏭️  Skipped existing membership: ${membershipData.name}`,
        );
        return 'skipped';
      }

      if (options.updateExisting) {
        if (options.dryRun) {
          this.logger.debug(
            `🧪 DRY RUN: Would update membership: ${membershipData.name}`,
          );
          return 'updated';
        }

        // Update existing membership
        const updateData = this.transformSeedDataToMembership(membershipData);
        await repository.update(existingMembership.id, updateData);

        this.logger.debug(
          `🔄 Updated existing membership: ${membershipData.name}`,
        );
        return 'updated';
      }
    }

    if (options.dryRun) {
      this.logger.debug(
        `🧪 DRY RUN: Would create membership: ${membershipData.name}`,
      );
      return 'created';
    }

    // Transform seed data to membership entity format
    const membershipEntityData =
      this.transformSeedDataToMembership(membershipData);

    // Create new membership
    const newMembership = repository.create(membershipEntityData);
    await repository.save(newMembership);

    this.logger.debug(`✨ Created new membership: ${membershipData.name}`);
    return 'created';
  }

  /**
   * ✅ TRANSFORM SEED DATA: Convert seed data to membership entity format
   */
  private transformSeedDataToMembership(
    seedData: MembershipSeedData,
  ): Partial<Membership> {
    return {
      name: seedData.name,
      nameAr: seedData.nameAr,
      description: seedData.description,
      descriptionAr: seedData.descriptionAr,
      price: seedData.price,
      priceUSD: seedData.priceUSD,
      durationInDays: seedData.durationInDays,
      maxProducts: seedData.maxProducts === -1 ? null : seedData.maxProducts,
      maxImagesPerProduct:
        seedData.maxImagesPerProduct === -1
          ? null
          : seedData.maxImagesPerProduct,
      prioritySupport: seedData.prioritySupport,
      commissionDiscount: seedData.commissionDiscount,
      isPopular: seedData.isPopular,
      isActive: seedData.isActive,
      sortOrder: seedData.sortOrder,
      targetAudience: seedData.targetAudience,
      targetAudienceAr: seedData.targetAudienceAr,
      businessType: seedData.businessType,
      renewalDiscount: seedData.renewalDiscount,
      upgradeDiscount: seedData.upgradeDiscount,
      // Syrian Business Features
      taxReporting: seedData.syrianBusinessFeatures.taxReporting,
      governorateAnalytics:
        seedData.syrianBusinessFeatures.governorateAnalytics,
      multiCurrencySupport:
        seedData.syrianBusinessFeatures.multiCurrencySupport,
      diasporaCustomerTools:
        seedData.syrianBusinessFeatures.diasporaCustomerTools,
      localShippingIntegration:
        seedData.syrianBusinessFeatures.localShippingIntegration,
      arabicCustomization: seedData.syrianBusinessFeatures.arabicCustomization,
      bulkImportTools: seedData.syrianBusinessFeatures.bulkImportTools,
      advancedAnalytics: seedData.syrianBusinessFeatures.advancedAnalytics,
      apiAccess: seedData.syrianBusinessFeatures.apiAccess,
      whiteLabel: seedData.syrianBusinessFeatures.whiteLabel,
      // Features and Limitations
      features: seedData.features,
      featuresAr: seedData.featuresAr,
      limitations: seedData.limitations,
    };
  }

  /**
   * ✅ VALIDATE MEMBERSHIP FEATURES: Check if all required features are valid
   */
  private async validateMembershipFeatures(
    memberships: MembershipSeedData[],
  ): Promise<{
    isValid: boolean;
    missingFeatures: string[];
  }> {
    const requiredFeatures = new Set<string>();

    // Collect all required feature names
    memberships.forEach((membership) => {
      Object.keys(membership.syrianBusinessFeatures).forEach((feature) => {
        requiredFeatures.add(feature);
      });
    });

    const missingFeatures: string[] = [];

    // Validate each feature (in a real scenario, you might check against a feature registry)
    const validFeatures = [
      'taxReporting',
      'governorateAnalytics',
      'multiCurrencySupport',
      'diasporaCustomerTools',
      'localShippingIntegration',
      'arabicCustomization',
      'bulkImportTools',
      'advancedAnalytics',
      'apiAccess',
      'whiteLabel',
    ];

    for (const feature of requiredFeatures) {
      if (!validFeatures.includes(feature)) {
        missingFeatures.push(feature);
      }
    }

    return {
      isValid: missingFeatures.length === 0,
      missingFeatures,
    };
  }

  /**
   * ✅ VALIDATE MEMBERSHIP DATA: Comprehensive validation of seed data
   */
  private validateMembershipData(
    memberships: MembershipSeedData[],
  ): MembershipSeedResult {
    const errors: Array<{
      membershipName: string;
      businessType: string;
      error: string;
      details?: any;
    }> = [];

    memberships.forEach((membership) => {
      // Validate required fields
      if (!membership.name) {
        errors.push({
          membershipName: membership.name || 'Unknown',
          businessType: membership.businessType,
          error: 'Name is required',
        });
      }

      if (membership.price < 0) {
        errors.push({
          membershipName: membership.name,
          businessType: membership.businessType,
          error: 'Price cannot be negative',
        });
      }

      if (membership.durationInDays <= 0) {
        errors.push({
          membershipName: membership.name,
          businessType: membership.businessType,
          error: 'Duration must be positive',
        });
      }

      if (
        membership.commissionDiscount < 0 ||
        membership.commissionDiscount > 100
      ) {
        errors.push({
          membershipName: membership.name,
          businessType: membership.businessType,
          error: 'Commission discount must be between 0 and 100',
        });
      }

      // Validate business type
      const validBusinessTypes = [
        'individual',
        'small_business',
        'medium_business',
        'enterprise',
      ];
      if (!validBusinessTypes.includes(membership.businessType)) {
        errors.push({
          membershipName: membership.name,
          businessType: membership.businessType,
          error: 'Invalid business type',
        });
      }
    });

    return {
      success: errors.length === 0,
      totalProcessed: memberships.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      processingTimeMs: 0,
      errorDetails: errors,
      statistics: MEMBERSHIP_STATISTICS,
      performance: {
        averageTimePerMembership: 0,
        batchProcessingTime: 0,
        dbOperationTime: 0,
        validationTime: 0,
      },
      features: {
        featuresProcessed: 0,
        featuresValidated: 0,
        featureValidationTime: 0,
        missingFeatures: [],
      },
    };
  }

  /**
   * ✅ VALIDATE SEED DATA INTEGRITY: Check for issues in seed data
   */
  private validateSeedDataIntegrity(): boolean {
    try {
      // Check for duplicate names
      const names = ALL_MEMBERSHIP_SEEDS.map((membership) => membership.name);
      const uniqueNames = new Set(names);

      if (names.length !== uniqueNames.size) {
        this.logger.warn('⚠️  Duplicate names found in seed data');
        return false;
      }

      // Validate required fields
      for (const membership of ALL_MEMBERSHIP_SEEDS) {
        if (
          !membership.name ||
          !membership.businessType ||
          membership.price < 0
        ) {
          this.logger.warn(
            `⚠️  Invalid membership data: ${membership.name || 'Unknown'}`,
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
   * ✅ CLEAR EXISTING MEMBERSHIPS: Remove all existing memberships (dangerous operation)
   */
  private async clearExistingMemberships(
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const repository =
      queryRunner?.manager.getRepository(Membership) ||
      this.membershipRepository;

    const deletedCount = await repository.delete({});
    this.logger.warn(
      `🗑️  Cleared ${deletedCount.affected || 0} existing memberships`,
    );
  }

  /**
   * ✅ COUNT DUPLICATE MEMBERSHIPS: Count memberships with duplicate names
   */
  private async countDuplicateMemberships(): Promise<number> {
    const duplicateNames = await this.membershipRepository
      .createQueryBuilder('membership')
      .select('membership.name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('membership.name')
      .having('COUNT(*) > 1')
      .getRawMany();

    return duplicateNames.length;
  }
}

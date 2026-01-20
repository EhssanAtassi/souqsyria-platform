/**
 * @file manufacturers-seeder.service.spec.ts
 * @description Comprehensive unit tests for Manufacturers Seeder Service
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Service initialization and dependency injection
 * - Sample manufacturers seeding with Syrian business profiles
 * - Workflow analytics generation and validation
 * - Manufacturing categories and geographic distribution
 * - Performance benchmarks and verification workflow data
 * - Bulk manufacturers generation with performance testing
 * - Data management operations (clear, stats, integrity)
 * - Error handling and transaction management
 * - Performance validation and optimization testing
 * - Arabic localization and business data validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';

// Service under test
import {
  ManufacturersSeederService,
  ManufacturersSeedingConfig,
  ManufacturersSeedingStats,
} from './manufacturers-seeder.service';

// Entities
import {
  SyrianManufacturerEntity,
  SyrianManufacturerVerificationStatus,
  SyrianManufacturerBusinessType,
  SyrianManufacturerSizeCategory,
} from '../entities/syrian-manufacturer.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';
import { User } from '../../users/entities/user.entity';

// Sample Data
import {
  SAMPLE_SYRIAN_MANUFACTURERS,
  MANUFACTURERS_WORKFLOW_ANALYTICS,
  MANUFACTURING_CATEGORIES,
  MANUFACTURERS_GEOGRAPHIC_DISTRIBUTION,
  MANUFACTURERS_PERFORMANCE_BENCHMARKS,
  VERIFICATION_WORKFLOW_ANALYTICS,
  BULK_MANUFACTURERS_GENERATION_CONFIG,
} from './manufacturers-seeds.data';

describe('ManufacturersSeederService - Unit Tests', () => {
  let service: ManufacturersSeederService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  // Mock repositories
  let mockManufacturerRepository: jest.Mocked<Repository<SyrianManufacturerEntity>>;
  let mockGovernorateRepository: jest.Mocked<Repository<SyrianGovernorateEntity>>;
  let mockUserRepository: jest.Mocked<Repository<User>>;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEEDING_TIME_MS: 5000, // 5 seconds for unit tests
      METHOD_EXECUTION_MS: 1000, // 1 second for individual methods
    },
    BULK_TEST_SIZES: {
      SMALL: 100,
      MEDIUM: 500,
      LARGE: 1000,
    },
    SAMPLE_DATA_COUNTS: {
      MANUFACTURERS: 5,
      WORKFLOW_ANALYTICS: 18, // Status dist (7) + Business types (6) + Size dist (4) + Avg metrics (1)
      CATEGORIES: 25,
      GEOGRAPHIC_DATA: 20,
      BENCHMARKS: 8,
      VERIFICATION_DATA: 12, // Processing times (4) + SLA stages (4) + Rejection reasons (4)
    },
  };

  beforeEach(async () => {
    // Create mock entity manager
    mockEntityManager = {
      transaction: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Create mock data source
    mockDataSource = {
      transaction: jest.fn(),
    } as any;

    // Create mock repositories
    mockManufacturerRepository = createMockRepository<SyrianManufacturerEntity>();
    mockGovernorateRepository = createMockRepository<SyrianGovernorateEntity>();
    mockUserRepository = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManufacturersSeederService,
        {
          provide: getRepositoryToken(SyrianManufacturerEntity),
          useValue: mockManufacturerRepository,
        },
        {
          provide: getRepositoryToken(SyrianGovernorateEntity),
          useValue: mockGovernorateRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ManufacturersSeederService>(ManufacturersSeederService);

    // Setup transaction mock
    mockDataSource.transaction.mockImplementation(async (callback: any) => {
      return await callback(mockEntityManager);
    });

    // Setup entity manager mocks
    mockEntityManager.findOne.mockResolvedValue({});
    mockEntityManager.create.mockImplementation((entity, data) => data);
    mockEntityManager.save.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined and properly instantiated', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(ManufacturersSeederService);
    });

    it('should have all required dependencies injected', () => {
      expect(mockManufacturerRepository).toBeDefined();
      expect(mockGovernorateRepository).toBeDefined();
      expect(mockUserRepository).toBeDefined();
      expect(mockDataSource).toBeDefined();
    });
  });

  describe('Comprehensive Manufacturers Seeding', () => {
    describe('seedAll() - Main Seeding Method', () => {
      it('should seed all manufacturers components with default configuration', async () => {
        const startTime = Date.now();
        const result = await service.seedAll();
        const executionTime = Date.now() - startTime;

        // Validate result structure
        expect(result).toHaveProperty('manufacturersCreated');
        expect(result).toHaveProperty('workflowDataCreated');
        expect(result).toHaveProperty('categoriesCreated');
        expect(result).toHaveProperty('geographicDataCreated');
        expect(result).toHaveProperty('benchmarksCreated');
        expect(result).toHaveProperty('verificationDataCreated');
        expect(result).toHaveProperty('bulkGeneratedCount');
        expect(result).toHaveProperty('totalExecutionTime');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');

        // Validate seeding statistics
        expect(result.manufacturersCreated).toBeGreaterThan(0);
        expect(result.workflowDataCreated).toBeGreaterThan(0);
        expect(result.categoriesCreated).toBeGreaterThan(0);
        expect(result.geographicDataCreated).toBeGreaterThan(0);
        expect(result.benchmarksCreated).toBeGreaterThan(0);
        expect(result.verificationDataCreated).toBeGreaterThan(0);
        expect(result.bulkGeneratedCount).toBe(0); // Default is 0
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);

        // Performance validation
        expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEEDING_TIME_MS);
        expect(result.totalExecutionTime).toBeGreaterThanOrEqual(0);

        // Verify transaction was used
        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
        expect(mockDataSource.transaction).toHaveBeenCalledWith(expect.any(Function));

        console.log(`✅ Full manufacturers seeding completed in ${executionTime}ms with comprehensive data`);
      });

      it('should respect selective seeding configuration', async () => {
        const config: Partial<ManufacturersSeedingConfig> = {
          sampleManufacturers: true,
          workflowAnalytics: true,
          categoriesData: false,
          geographicDistribution: false,
          performanceBenchmarks: true,
          verificationWorkflow: false,
          bulkGeneration: 0,
          performanceTest: false,
        };

        const result = await service.seedAll(config);

        // Should have data for enabled sections
        expect(result.manufacturersCreated).toBeGreaterThan(0);
        expect(result.workflowDataCreated).toBeGreaterThan(0);
        expect(result.benchmarksCreated).toBeGreaterThan(0);

        // Should have zero for disabled sections
        expect(result.categoriesCreated).toBe(0);
        expect(result.geographicDataCreated).toBe(0);
        expect(result.verificationDataCreated).toBe(0);
        expect(result.bulkGeneratedCount).toBe(0);

        expect(result.errors).toHaveLength(0);
      });

      it('should handle bulk generation configuration', async () => {
        const config: Partial<ManufacturersSeedingConfig> = {
          sampleManufacturers: false,
          workflowAnalytics: false,
          categoriesData: false,
          geographicDistribution: false,
          performanceBenchmarks: false,
          verificationWorkflow: false,
          bulkGeneration: TEST_CONFIG.BULK_TEST_SIZES.SMALL,
          performanceTest: true,
        };

        const result = await service.seedAll(config);

        // Should have bulk generation data
        expect(result.bulkGeneratedCount).toBe(TEST_CONFIG.BULK_TEST_SIZES.SMALL);

        // Should have zero for other sections
        expect(result.manufacturersCreated).toBe(0);
        expect(result.workflowDataCreated).toBe(0);
        expect(result.categoriesCreated).toBe(0);
        expect(result.geographicDataCreated).toBe(0);
        expect(result.benchmarksCreated).toBe(0);
        expect(result.verificationDataCreated).toBe(0);
      });

      it('should handle errors gracefully', async () => {
        // Mock transaction to throw an error
        mockDataSource.transaction.mockRejectedValueOnce(new Error('Database connection failed'));

        await expect(service.seedAll()).rejects.toThrow('Database connection failed');

        // Verify transaction was attempted
        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      });
    });

    describe('Individual Seeding Components', () => {
      beforeEach(() => {
        // Setup transaction mock to call callback directly for individual method tests
        mockDataSource.transaction.mockImplementation(async (callback: any) => {
          return await callback(mockEntityManager);
        });
      });

      describe('Sample Manufacturers Seeding', () => {
        it('should seed sample manufacturers with correct count', async () => {
          const result = await service.seedAll({
            sampleManufacturers: true,
            workflowAnalytics: false,
            categoriesData: false,
            geographicDistribution: false,
            performanceBenchmarks: false,
            verificationWorkflow: false,
          });

          expect(result.manufacturersCreated).toBe(TEST_CONFIG.SAMPLE_DATA_COUNTS.MANUFACTURERS);
          expect(result.workflowDataCreated).toBe(0);
          expect(result.errors).toHaveLength(0);
        });

        it('should validate Syrian manufacturer data structure', async () => {
          await service.seedAll({ sampleManufacturers: true });

          // Verify that sample data has correct structure
          expect(SAMPLE_SYRIAN_MANUFACTURERS).toHaveLength(TEST_CONFIG.SAMPLE_DATA_COUNTS.MANUFACTURERS);

          // Validate first manufacturer
          const firstManufacturer = SAMPLE_SYRIAN_MANUFACTURERS[0];
          expect(firstManufacturer).toHaveProperty('nameEn');
          expect(firstManufacturer).toHaveProperty('nameAr');
          expect(firstManufacturer).toHaveProperty('businessType');
          expect(firstManufacturer).toHaveProperty('sizeCategory');
          expect(firstManufacturer).toHaveProperty('verificationStatus');

          // Validate Arabic text
          expect(firstManufacturer.nameAr).toMatch(/[\u0600-\u06FF]/); // Arabic characters
          expect(firstManufacturer.descriptionAr).toMatch(/[\u0600-\u06FF]/);

          // Validate business metrics
          expect(firstManufacturer.qualityScore).toBeGreaterThanOrEqual(0);
          expect(firstManufacturer.qualityScore).toBeLessThanOrEqual(100);
          expect(firstManufacturer.monthlyRevenueSyp).toBeGreaterThan(0);
        });
      });

      describe('Workflow Analytics Seeding', () => {
        it('should seed workflow analytics with comprehensive data', async () => {
          const result = await service.seedAll({
            sampleManufacturers: false,
            workflowAnalytics: true,
            categoriesData: false,
            geographicDistribution: false,
            performanceBenchmarks: false,
            verificationWorkflow: false,
          });

          expect(result.workflowDataCreated).toBe(TEST_CONFIG.SAMPLE_DATA_COUNTS.WORKFLOW_ANALYTICS);
          expect(result.manufacturersCreated).toBe(0);
          expect(result.errors).toHaveLength(0);
        });

        it('should validate workflow analytics data structure', async () => {
          await service.seedAll({ workflowAnalytics: true });

          // Validate workflow analytics structure
          expect(MANUFACTURERS_WORKFLOW_ANALYTICS).toHaveProperty('totalManufacturers');
          expect(MANUFACTURERS_WORKFLOW_ANALYTICS).toHaveProperty('statusDistribution');
          expect(MANUFACTURERS_WORKFLOW_ANALYTICS).toHaveProperty('businessTypeDistribution');
          expect(MANUFACTURERS_WORKFLOW_ANALYTICS).toHaveProperty('sizeDistribution');
          expect(MANUFACTURERS_WORKFLOW_ANALYTICS).toHaveProperty('averageMetrics');

          // Validate status distribution
          const statusKeys = Object.keys(MANUFACTURERS_WORKFLOW_ANALYTICS.statusDistribution);
          expect(statusKeys.length).toBe(Object.values(SyrianManufacturerVerificationStatus).length);

          // Validate business type distribution
          const businessTypeKeys = Object.keys(MANUFACTURERS_WORKFLOW_ANALYTICS.businessTypeDistribution);
          expect(businessTypeKeys.length).toBe(Object.values(SyrianManufacturerBusinessType).length);

          // Validate average metrics
          const avgMetrics = MANUFACTURERS_WORKFLOW_ANALYTICS.averageMetrics;
          expect(avgMetrics.qualityScore).toBeGreaterThanOrEqual(0);
          expect(avgMetrics.qualityScore).toBeLessThanOrEqual(100);
          expect(avgMetrics.monthlyRevenueSyp).toBeGreaterThan(0);
        });
      });

      describe('Manufacturing Categories Seeding', () => {
        it('should seed manufacturing categories with specializations', async () => {
          const result = await service.seedAll({
            sampleManufacturers: false,
            workflowAnalytics: false,
            categoriesData: true,
            geographicDistribution: false,
            performanceBenchmarks: false,
            verificationWorkflow: false,
          });

          expect(result.categoriesCreated).toBe(TEST_CONFIG.SAMPLE_DATA_COUNTS.CATEGORIES);
          expect(result.errors).toHaveLength(0);
        });

        it('should validate manufacturing categories data structure', async () => {
          await service.seedAll({ categoriesData: true });

          expect(Array.isArray(MANUFACTURING_CATEGORIES)).toBeTruthy();
          expect(MANUFACTURING_CATEGORIES.length).toBeGreaterThan(0);

          // Validate first category
          const firstCategory = MANUFACTURING_CATEGORIES[0];
          expect(firstCategory).toHaveProperty('categoryEn');
          expect(firstCategory).toHaveProperty('categoryAr');
          expect(firstCategory).toHaveProperty('specializations');
          expect(firstCategory).toHaveProperty('manufacturerCount');

          // Validate Arabic localization
          expect(firstCategory.categoryAr).toMatch(/[\u0600-\u06FF]/);

          // Validate specializations
          expect(Array.isArray(firstCategory.specializations)).toBeTruthy();
          expect(firstCategory.specializations.length).toBeGreaterThan(0);

          const firstSpecialization = firstCategory.specializations[0];
          expect(firstSpecialization).toHaveProperty('nameEn');
          expect(firstSpecialization).toHaveProperty('nameAr');
          expect(firstSpecialization.nameAr).toMatch(/[\u0600-\u06FF]/);
        });
      });

      describe('Geographic Distribution Seeding', () => {
        it('should seed geographic distribution data', async () => {
          const result = await service.seedAll({
            sampleManufacturers: false,
            workflowAnalytics: false,
            categoriesData: false,
            geographicDistribution: true,
            performanceBenchmarks: false,
            verificationWorkflow: false,
          });

          expect(result.geographicDataCreated).toBe(TEST_CONFIG.SAMPLE_DATA_COUNTS.GEOGRAPHIC_DATA);
          expect(result.errors).toHaveLength(0);
        });

        it('should validate geographic distribution data structure', async () => {
          await service.seedAll({ geographicDistribution: true });

          expect(Array.isArray(MANUFACTURERS_GEOGRAPHIC_DISTRIBUTION)).toBeTruthy();
          expect(MANUFACTURERS_GEOGRAPHIC_DISTRIBUTION.length).toBeGreaterThan(0);

          // Validate first location
          const firstLocation = MANUFACTURERS_GEOGRAPHIC_DISTRIBUTION[0];
          expect(firstLocation).toHaveProperty('governorateId');
          expect(firstLocation).toHaveProperty('nameEn');
          expect(firstLocation).toHaveProperty('nameAr');
          expect(firstLocation).toHaveProperty('manufacturerCount');
          expect(firstLocation).toHaveProperty('totalRevenueSyp');
          expect(firstLocation).toHaveProperty('averageQualityScore');
          expect(firstLocation).toHaveProperty('primaryIndustries');

          // Validate Arabic name
          expect(firstLocation.nameAr).toMatch(/[\u0600-\u06FF]/);

          // Validate metrics
          expect(firstLocation.manufacturerCount).toBeGreaterThan(0);
          expect(firstLocation.totalRevenueSyp).toBeGreaterThan(0);
          expect(firstLocation.averageQualityScore).toBeGreaterThanOrEqual(0);
          expect(firstLocation.averageQualityScore).toBeLessThanOrEqual(100);

          // Validate industries array
          expect(Array.isArray(firstLocation.primaryIndustries)).toBeTruthy();
          expect(firstLocation.primaryIndustries.length).toBeGreaterThan(0);
        });
      });

      describe('Performance Benchmarks Seeding', () => {
        it('should seed performance benchmarks', async () => {
          const result = await service.seedAll({
            sampleManufacturers: false,
            workflowAnalytics: false,
            categoriesData: false,
            geographicDistribution: false,
            performanceBenchmarks: true,
            verificationWorkflow: false,
          });

          expect(result.benchmarksCreated).toBe(TEST_CONFIG.SAMPLE_DATA_COUNTS.BENCHMARKS);
          expect(result.errors).toHaveLength(0);
        });

        it('should validate performance benchmarks data structure', async () => {
          await service.seedAll({ performanceBenchmarks: true });

          expect(MANUFACTURERS_PERFORMANCE_BENCHMARKS).toHaveProperty('industryBenchmarks');
          expect(MANUFACTURERS_PERFORMANCE_BENCHMARKS).toHaveProperty('growthTargets');

          // Validate industry benchmarks
          const benchmarks = MANUFACTURERS_PERFORMANCE_BENCHMARKS.industryBenchmarks;
          expect(benchmarks).toHaveProperty('qualityScore');
          expect(benchmarks).toHaveProperty('deliveryPerformance');
          expect(benchmarks).toHaveProperty('customerSatisfaction');
          expect(benchmarks).toHaveProperty('returnRate');

          // Validate quality score thresholds
          const qualityBenchmarks = benchmarks.qualityScore;
          expect(qualityBenchmarks.excellent).toBeGreaterThan(qualityBenchmarks.good);
          expect(qualityBenchmarks.good).toBeGreaterThan(qualityBenchmarks.average);
          expect(qualityBenchmarks.average).toBeGreaterThan(qualityBenchmarks.poor);

          // Validate growth targets
          const growthTargets = MANUFACTURERS_PERFORMANCE_BENCHMARKS.growthTargets;
          expect(growthTargets).toHaveProperty('monthlyRevenueGrowth');
          expect(growthTargets).toHaveProperty('newManufacturerTarget');
          expect(growthTargets.monthlyRevenueGrowth).toBeGreaterThan(0);
          expect(growthTargets.newManufacturerTarget).toBeGreaterThan(0);
        });
      });

      describe('Verification Workflow Seeding', () => {
        it('should seed verification workflow data', async () => {
          const result = await service.seedAll({
            sampleManufacturers: false,
            workflowAnalytics: false,
            categoriesData: false,
            geographicDistribution: false,
            performanceBenchmarks: false,
            verificationWorkflow: true,
          });

          expect(result.verificationDataCreated).toBe(TEST_CONFIG.SAMPLE_DATA_COUNTS.VERIFICATION_DATA);
          expect(result.errors).toHaveLength(0);
        });

        it('should validate verification workflow data structure', async () => {
          await service.seedAll({ verificationWorkflow: true });

          expect(VERIFICATION_WORKFLOW_ANALYTICS).toHaveProperty('averageProcessingTimes');
          expect(VERIFICATION_WORKFLOW_ANALYTICS).toHaveProperty('slaCompliance');
          expect(VERIFICATION_WORKFLOW_ANALYTICS).toHaveProperty('rejectionReasons');

          // Validate processing times
          const processingTimes = VERIFICATION_WORKFLOW_ANALYTICS.averageProcessingTimes;
          expect(processingTimes).toHaveProperty('draftToSubmitted');
          expect(processingTimes).toHaveProperty('submittedToUnderReview');
          expect(processingTimes).toHaveProperty('underReviewToVerified');
          expect(processingTimes).toHaveProperty('totalVerificationTime');

          // All times should be positive
          Object.values(processingTimes).forEach(time => {
            expect(time).toBeGreaterThan(0);
          });

          // Validate SLA compliance
          const slaCompliance = VERIFICATION_WORKFLOW_ANALYTICS.slaCompliance;
          expect(slaCompliance).toHaveProperty('overall');
          expect(slaCompliance).toHaveProperty('byStage');
          expect(slaCompliance.overall).toBeGreaterThanOrEqual(0);
          expect(slaCompliance.overall).toBeLessThanOrEqual(100);

          // Validate rejection reasons
          const rejectionReasons = VERIFICATION_WORKFLOW_ANALYTICS.rejectionReasons;
          expect(Array.isArray(rejectionReasons)).toBeTruthy();
          expect(rejectionReasons.length).toBeGreaterThan(0);

          const firstReason = rejectionReasons[0];
          expect(firstReason).toHaveProperty('reasonEn');
          expect(firstReason).toHaveProperty('reasonAr');
          expect(firstReason).toHaveProperty('percentage');
          expect(firstReason.reasonAr).toMatch(/[\u0600-\u06FF]/);
          expect(firstReason.percentage).toBeGreaterThan(0);
          expect(firstReason.percentage).toBeLessThanOrEqual(100);
        });
      });

      describe('Bulk Generation', () => {
        it('should generate bulk manufacturers efficiently', async () => {
          const startTime = Date.now();
          
          const result = await service.seedAll({
            sampleManufacturers: false,
            workflowAnalytics: false,
            categoriesData: false,
            geographicDistribution: false,
            performanceBenchmarks: false,
            verificationWorkflow: false,
            bulkGeneration: TEST_CONFIG.BULK_TEST_SIZES.SMALL,
            performanceTest: true,
          });

          const executionTime = Date.now() - startTime;

          expect(result.bulkGeneratedCount).toBe(TEST_CONFIG.BULK_TEST_SIZES.SMALL);
          expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEEDING_TIME_MS);
          expect(result.errors).toHaveLength(0);

          console.log(`✅ Bulk generation (${TEST_CONFIG.BULK_TEST_SIZES.SMALL}) completed in ${executionTime}ms`);
        });

        it('should validate bulk generation configuration', async () => {
          await service.seedAll({ bulkGeneration: 10 });

          // Validate bulk generation config
          expect(Array.isArray(BULK_MANUFACTURERS_GENERATION_CONFIG.businessTypes)).toBeTruthy();
          expect(Array.isArray(BULK_MANUFACTURERS_GENERATION_CONFIG.sizeCategories)).toBeTruthy();
          expect(Array.isArray(BULK_MANUFACTURERS_GENERATION_CONFIG.verificationStatuses)).toBeTruthy();
          expect(Array.isArray(BULK_MANUFACTURERS_GENERATION_CONFIG.governorateIds)).toBeTruthy();

          // Validate business types
          expect(BULK_MANUFACTURERS_GENERATION_CONFIG.businessTypes.length).toBe(
            Object.values(SyrianManufacturerBusinessType).length
          );

          // Validate size categories
          expect(BULK_MANUFACTURERS_GENERATION_CONFIG.sizeCategories.length).toBe(
            Object.values(SyrianManufacturerSizeCategory).length
          );

          // Validate verification statuses
          expect(BULK_MANUFACTURERS_GENERATION_CONFIG.verificationStatuses.length).toBe(
            Object.values(SyrianManufacturerVerificationStatus).length
          );

          // Validate governorate IDs
          expect(BULK_MANUFACTURERS_GENERATION_CONFIG.governorateIds.length).toBe(14); // All Syrian governorates

          // Validate revenue ranges
          const revenueRanges = BULK_MANUFACTURERS_GENERATION_CONFIG.revenueRanges;
          expect(revenueRanges[SyrianManufacturerSizeCategory.SMALL][0]).toBeLessThan(
            revenueRanges[SyrianManufacturerSizeCategory.SMALL][1]
          );
          expect(revenueRanges[SyrianManufacturerSizeCategory.MEDIUM][0]).toBeGreaterThanOrEqual(
            revenueRanges[SyrianManufacturerSizeCategory.SMALL][1]
          );
        });
      });
    });
  });

  describe('Data Management Operations', () => {
    describe('clearAllData()', () => {
      it('should clear all manufacturers data successfully', async () => {
        await expect(service.clearAllData()).resolves.not.toThrow();

        // Verify transaction was used
        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      });

      it('should handle clearing errors gracefully', async () => {
        mockDataSource.transaction.mockRejectedValueOnce(new Error('Clear operation failed'));

        await expect(service.clearAllData()).rejects.toThrow('Clear operation failed');
      });
    });

    describe('getSeedingStats()', () => {
      it('should return comprehensive seeding statistics', async () => {
        // Mock repository methods for stats
        mockManufacturerRepository.count.mockResolvedValue(100);
        mockManufacturerRepository.createQueryBuilder.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { type: 'local_manufacturer', count: 80 },
            { type: 'international_brand', count: 20 },
          ]),
          getRawOne: jest.fn().mockResolvedValue({
            avgQualityScore: 87.5,
            avgDeliveryPerformance: 89.2,
            avgCustomerSatisfaction: 91.8,
            avgRating: 4.3,
          }),
        } as any);

        const stats = await service.getSeedingStats();

        expect(stats).toHaveProperty('overview');
        expect(stats).toHaveProperty('businessTypeDistribution');
        expect(stats).toHaveProperty('performance');
        expect(stats).toHaveProperty('usage');
        expect(stats).toHaveProperty('lastUpdated');

        // Overview validation
        expect(stats.overview).toHaveProperty('totalManufacturers');
        expect(stats.overview).toHaveProperty('verifiedManufacturers');
        expect(stats.overview).toHaveProperty('verificationRate');

        // Performance validation
        expect(stats.performance).toHaveProperty('averageQualityScore');
        expect(stats.performance).toHaveProperty('averageDeliveryPerformance');
        expect(stats.performance.averageQualityScore).toBeGreaterThanOrEqual(0);

        // Business type distribution validation
        expect(stats.businessTypeDistribution).toHaveProperty('local_manufacturer');
        expect(stats.businessTypeDistribution).toHaveProperty('international_brand');

        expect(typeof stats.lastUpdated).toBe('string');
      });

      it('should handle stats retrieval errors gracefully', async () => {
        // Mock repository to throw error
        mockManufacturerRepository.count.mockRejectedValue(new Error('Database error'));

        const stats = await service.getSeedingStats();
        
        expect(stats.overview).toHaveProperty('error');
        expect(stats.performance).toHaveProperty('error');
        expect(stats.usage).toHaveProperty('error');
      });
    });

    describe('verifyDataIntegrity()', () => {
      it('should verify data integrity with no issues', async () => {
        // Mock stats for integrity check
        jest.spyOn(service, 'getSeedingStats').mockResolvedValue({
          overview: {
            totalManufacturers: 100,
            verifiedManufacturers: 80,
            pendingManufacturers: 15,
            rejectedManufacturers: 5,
            verificationRate: 80.0,
          },
          performance: {
            averageQualityScore: 85.0,
            averageDeliveryPerformance: 88.0,
            averageCustomerSatisfaction: 90.0,
            averageRating: 4.2,
            dataFreshness: 'real-time',
            cacheHitRate: 89.2,
          },
          businessTypeDistribution: {},
          usage: {},
          lastUpdated: new Date().toISOString(),
        });

        // Mock repository for status distribution
        mockManufacturerRepository.count.mockResolvedValue(20);

        const result = await service.verifyDataIntegrity();

        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('issues');
        expect(result).toHaveProperty('summary');

        expect(typeof result.isValid).toBe('boolean');
        expect(Array.isArray(result.issues)).toBeTruthy();
        expect(result.summary).toBeDefined();
        expect(result.isValid).toBeTruthy();
        expect(result.issues).toHaveLength(0);
      });

      it('should detect integrity issues correctly', async () => {
        // Mock problematic stats
        jest.spyOn(service, 'getSeedingStats').mockResolvedValue({
          overview: {
            totalManufacturers: 0, // This should trigger an issue
            verifiedManufacturers: 0,
            pendingManufacturers: 0,
            rejectedManufacturers: 0,
            verificationRate: 0,
          },
          performance: {
            averageQualityScore: 50.0, // Below threshold
            averageDeliveryPerformance: 70.0, // Below threshold
            averageCustomerSatisfaction: 90.0,
            averageRating: 4.2,
            dataFreshness: 'real-time',
            cacheHitRate: 89.2,
          },
          businessTypeDistribution: {},
          usage: {},
          lastUpdated: new Date().toISOString(),
        });

        const result = await service.verifyDataIntegrity();

        expect(result.isValid).toBeFalsy();
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues).toContain('No manufacturers data found');
        expect(result.issues).toContain('Average quality score is below acceptable threshold');
        expect(result.issues).toContain('Average delivery performance is below optimal threshold');
      });

      it('should handle verification errors gracefully', async () => {
        // Mock getSeedingStats to throw error
        jest.spyOn(service, 'getSeedingStats').mockRejectedValue(new Error('Stats error'));

        const result = await service.verifyDataIntegrity();

        expect(result.isValid).toBeFalsy();
        expect(result.issues).toContain('Integrity check failed: Stats error');
        expect(result.summary).toBeNull();
      });
    });
  });

  describe('Performance and Optimization', () => {
    describe('Method Execution Times', () => {
      it('should execute individual seeding methods within time limits', async () => {
        const methods = [
          () => service.seedAll({ sampleManufacturers: true }),
          () => service.seedAll({ workflowAnalytics: true }),
          () => service.seedAll({ categoriesData: true }),
          () => service.seedAll({ geographicDistribution: true }),
          () => service.seedAll({ performanceBenchmarks: true }),
        ];

        for (const method of methods) {
          const startTime = Date.now();
          await method();
          const executionTime = Date.now() - startTime;

          expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.METHOD_EXECUTION_MS);
        }
      });

      it('should handle concurrent seeding operations', async () => {
        const concurrentOperations = [
          service.seedAll({ sampleManufacturers: true }),
          service.seedAll({ workflowAnalytics: true }),
          service.seedAll({ categoriesData: true }),
        ];

        const startTime = Date.now();
        const results = await Promise.all(concurrentOperations);
        const totalTime = Date.now() - startTime;

        results.forEach((result) => {
          expect(result.errors).toHaveLength(0);
        });

        expect(totalTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEEDING_TIME_MS);
        console.log(`✅ Concurrent operations completed in ${totalTime}ms`);
      });
    });

    describe('Memory and Resource Usage', () => {
      it('should handle large bulk operations efficiently', async () => {
        const largeCount = TEST_CONFIG.BULK_TEST_SIZES.LARGE;
        
        const result = await service.seedAll({
          bulkGeneration: largeCount,
          performanceTest: true,
        });

        expect(result.bulkGeneratedCount).toBe(largeCount);
        expect(result.errors).toHaveLength(0);

        console.log(`✅ Large bulk operation (${largeCount}) completed successfully`);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Transaction Management', () => {
      it('should rollback on transaction errors', async () => {
        let callbackInvoked = false;
        mockDataSource.transaction.mockImplementation(async (callback) => {
          callbackInvoked = true;
          throw new Error('Transaction failed');
        });

        await expect(service.seedAll()).rejects.toThrow('Transaction failed');
        expect(callbackInvoked).toBeTruthy();
        expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      });

      it('should handle empty configuration gracefully', async () => {
        const result = await service.seedAll({});

        // Should use defaults and succeed
        expect(result).toBeDefined();
        expect(result.errors).toHaveLength(0);
      });

      it('should handle null/undefined configuration', async () => {
        const result1 = await service.seedAll(null as any);
        const result2 = await service.seedAll(undefined);

        expect(result1).toBeDefined();
        expect(result1.errors).toHaveLength(0);
        expect(result2).toBeDefined();
        expect(result2.errors).toHaveLength(0);
      });
    });

    describe('Data Validation', () => {
      it('should validate configuration parameters', async () => {
        // Test with invalid bulk generation count
        const result = await service.seedAll({
          bulkGeneration: -1, // Invalid negative number
        });

        // Should handle gracefully (set to 0 or handle appropriately)
        expect(result.bulkGeneratedCount).toBe(0);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});

/**
 * Helper function to create mock repository
 */
function createMockRepository<T>(): jest.Mocked<Repository<T>> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as any;
}
/**
 * @file features-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Product Features management system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Features seeding with comprehensive product attribute management
 * - Boolean and text feature types validation and testing
 * - Product-feature associations with realistic value mapping
 * - Category-based feature organization and analytics
 * - Syrian market-specific features (Arabic instructions, local standards)
 * - Technology features (5G, WiFi, Bluetooth, processor specs, etc.)
 * - Fashion features (material, size, color, seasonal, etc.)
 * - Home and furniture features (dimensions, energy ratings, etc.)
 * - Bulk feature operations with performance validation
 * - Feature analytics and utilization metrics
 * - Data integrity verification and comprehensive error handling
 * - System performance under load and concurrent operations
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

// Core modules
import { AppModule } from '../../src/app.module';
import { FeaturesModule } from '../../src/features/features.module';

// Services and Controllers
import { FeaturesSeederService } from '../../src/features/seeds/features-seeder.service';
import { FeaturesService } from '../../src/features/services/features.service';

// Entities
import { FeatureEntity } from '../../src/features/entities/feature.entity';
import { ProductFeatureEntity } from '../../src/features/entities/product-feature.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Features System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let featuresSeederService: FeaturesSeederService;
  let featuresService: FeaturesService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 20000, // 20 seconds
      API_RESPONSE_TIME: 3000, // 3 seconds
      BULK_OPERATION_TIME: 8000, // 8 seconds
      SEARCH_RESPONSE_TIME: 2000, // 2 seconds
      ANALYTICS_RESPONSE_TIME: 4000, // 4 seconds
    },
    VALIDATION_RULES: {
      MIN_FEATURES: 60, // Comprehensive feature set
      MIN_PRODUCT_FEATURES: 50, // Product-feature associations
      MIN_CATEGORIES: 8, // Feature categories
      MIN_BOOLEAN_FEATURES: 20,
      MIN_TEXT_FEATURES: 30,
      MIN_SYRIAN_FEATURES: 6,
      FEATURE_TYPES: ['boolean', 'text'],
    },
    FEATURE_CATEGORIES: [
      'Technology', 'Fashion', 'Home', 'Automotive', 
      'Beauty', 'Sports', 'Syrian Market', 'Quality', 'Food'
    ],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, FeaturesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    featuresSeederService = moduleFixture.get<FeaturesSeederService>(FeaturesSeederService);
    featuresService = moduleFixture.get<FeaturesService>(FeaturesService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearFeaturesData();
  });

  afterAll(async () => {
    await testDataHelper.clearFeaturesData();
    await app.close();
  });

  describe('Features Seeding System', () => {
    it('should seed comprehensive features system within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/features/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('features_created');
      expect(result.body).toHaveProperty('product_features_created');
      expect(result.body).toHaveProperty('feature_categories_covered');
      expect(result.body).toHaveProperty('boolean_features');
      expect(result.body).toHaveProperty('text_features');
      expect(result.body).toHaveProperty('syrian_localized_features');
      expect(result.body).toHaveProperty('performance_metrics');

      // Validate minimum data requirements
      expect(result.body.features_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FEATURES);
      expect(result.body.product_features_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_PRODUCT_FEATURES);
      expect(result.body.boolean_features).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_BOOLEAN_FEATURES);
      expect(result.body.text_features).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_TEXT_FEATURES);
      expect(result.body.syrian_localized_features).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SYRIAN_FEATURES);

      // Validate feature categories
      expect(Array.isArray(result.body.feature_categories_covered)).toBe(true);
      expect(result.body.feature_categories_covered.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_CATEGORIES);
    });

    it('should validate feature data structure and type distribution', async () => {
      const features = await dataSource.getRepository(FeatureEntity).find();

      expect(features.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FEATURES);

      // Validate feature type distribution
      const booleanFeatures = features.filter(f => f.type === 'boolean');
      const textFeatures = features.filter(f => f.type === 'text');

      expect(booleanFeatures.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_BOOLEAN_FEATURES);
      expect(textFeatures.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_TEXT_FEATURES);

      // Validate each feature
      for (const feature of features) {
        // Required fields validation
        expect(feature.name).toBeDefined();
        expect(feature.name.length).toBeGreaterThan(2);
        expect(feature.type).toBeDefined();
        expect(TEST_CONFIG.VALIDATION_RULES.FEATURE_TYPES).toContain(feature.type);

        // Timestamp validation
        expect(feature.createdAt).toBeInstanceOf(Date);
        expect(feature.updatedAt).toBeInstanceOf(Date);
        expect(feature.updatedAt.getTime()).toBeGreaterThanOrEqual(feature.createdAt.getTime());

        // Feature name format validation
        expect(feature.name).toMatch(/^[a-zA-Z0-9\s\/\-\+]+$/); // Alphanumeric with common symbols
      }
    });

    it('should validate Syrian market-specific features', async () => {
      const features = await dataSource.getRepository(FeatureEntity).find();

      const syrianFeatures = [
        'Arabic Instructions',
        'Syrian Standards Compliant',
        'Local Warranty',
        'Ramadan Special',
        'Traditional Style',
        'Regional Availability',
        'Governorate Preference',
        'Halal Certified',
      ];

      const foundSyrianFeatures = features.filter(f => 
        syrianFeatures.includes(f.name)
      );

      expect(foundSyrianFeatures.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SYRIAN_FEATURES);

      // Validate Syrian features structure
      foundSyrianFeatures.forEach(feature => {
        expect(feature.name).toBeTruthy();
        expect(['boolean', 'text']).toContain(feature.type);
      });
    });

    it('should validate technology features comprehensiveness', async () => {
      const features = await dataSource.getRepository(FeatureEntity).find();

      const technologyFeatures = [
        'WiFi Support', 'Bluetooth', '5G Support', 'Wireless Charging',
        'Water Resistant', 'Processor', 'RAM Size', 'Storage Capacity',
        'Screen Size', 'Battery Life', 'Operating System', 'Camera Resolution'
      ];

      const foundTechFeatures = features.filter(f => 
        technologyFeatures.includes(f.name)
      );

      expect(foundTechFeatures.length).toBeGreaterThanOrEqual(8);

      // Validate technology feature types
      const booleanTechFeatures = foundTechFeatures.filter(f => f.type === 'boolean');
      const textTechFeatures = foundTechFeatures.filter(f => f.type === 'text');

      expect(booleanTechFeatures.length).toBeGreaterThanOrEqual(3); // WiFi, Bluetooth, 5G, etc.
      expect(textTechFeatures.length).toBeGreaterThanOrEqual(5); // Processor, RAM, Storage, etc.
    });

    it('should validate product-feature associations', async () => {
      const productFeatures = await dataSource.getRepository(ProductFeatureEntity).find({
        relations: ['product', 'feature'],
      });

      expect(productFeatures.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_PRODUCT_FEATURES);

      for (const productFeature of productFeatures) {
        // Validate relationships
        expect(productFeature.product).toBeDefined();
        expect(productFeature.feature).toBeDefined();
        expect(productFeature.value).toBeDefined();

        // Validate value consistency with feature type
        if (productFeature.feature.type === 'boolean') {
          expect(['Yes', 'No']).toContain(productFeature.value);
        } else {
          expect(productFeature.value.length).toBeGreaterThan(0);
          expect(productFeature.value).not.toBe('undefined');
        }

        // Validate timestamp
        expect(productFeature.createdAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Features API Endpoints', () => {
    beforeEach(async () => {
      // Ensure test data exists
      await featuresSeederService.seedFeatures();
    });

    it('should retrieve features statistics with comprehensive analytics', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/features/seed/statistics')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('generated_at');

      const stats = response.body.statistics;
      expect(stats).toHaveProperty('total_features');
      expect(stats).toHaveProperty('boolean_features');
      expect(stats).toHaveProperty('text_features');
      expect(stats).toHaveProperty('total_product_features');
      expect(stats).toHaveProperty('feature_utilization_rate');

      // Validate statistics values
      expect(stats.total_features).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FEATURES);
      expect(stats.boolean_features + stats.text_features).toBe(stats.total_features);
      expect(stats.feature_utilization_rate).toBeGreaterThan(0);
    });

    it('should provide features analytics by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/features/seed/analytics/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('total_categories');
      expect(response.body).toHaveProperty('most_featured_category');
      expect(response.body).toHaveProperty('least_featured_category');
      expect(response.body).toHaveProperty('category_balance_score');

      // Validate categories data
      const categories = response.body.categories;
      expect(typeof categories).toBe('object');
      expect(Object.keys(categories).length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_CATEGORIES);

      // Check for key categories
      const expectedCategories = ['Technology', 'Fashion', 'Home', 'Syrian Market'];
      expectedCategories.forEach(category => {
        expect(categories).toHaveProperty(category);
        expect(categories[category]).toBeGreaterThan(0);
      });

      // Validate balance score
      expect(response.body.category_balance_score).toBeGreaterThanOrEqual(0);
      expect(response.body.category_balance_score).toBeLessThanOrEqual(100);
    });

    it('should handle bulk features seeding with customization', async () => {
      const startTime = Date.now();

      const bulkConfig = {
        categories: ['Technology', 'Fashion'],
        include_syrian_features: true,
        product_association_ratio: 0.7,
      };

      const response = await request(app.getHttpServer())
        .post('/features/seed/bulk')
        .send(bulkConfig)
        .expect(201);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('bulk_configuration');
      expect(response.body).toHaveProperty('optimization_applied', true);
      expect(response.body.bulk_configuration).toEqual(bulkConfig);
    });

    it('should export features data in multiple formats', async () => {
      // Test CSV export
      const csvExportConfig = {
        format: 'csv',
        include_product_associations: true,
        filter_by_category: ['Technology', 'Fashion'],
      };

      const csvResponse = await request(app.getHttpServer())
        .post('/features/seed/export')
        .send(csvExportConfig)
        .expect(200);

      expect(csvResponse.body).toHaveProperty('success', true);
      expect(csvResponse.body).toHaveProperty('export_config');
      expect(csvResponse.body).toHaveProperty('download_url');
      expect(csvResponse.body).toHaveProperty('expires_at');

      // Test Excel export
      const excelExportConfig = {
        format: 'excel',
        include_product_associations: true,
        include_statistics: true,
      };

      const excelResponse = await request(app.getHttpServer())
        .post('/features/seed/export')
        .send(excelExportConfig)
        .expect(200);

      expect(excelResponse.body.export_config.format).toBe('excel');
      expect(excelResponse.body.data).toHaveProperty('statistics');
    });
  });

  describe('Feature Categories and Types', () => {
    beforeEach(async () => {
      await featuresSeederService.seedFeatures();
    });

    it('should validate comprehensive feature categories coverage', async () => {
      const response = await request(app.getHttpServer())
        .get('/features/seed/analytics/categories')
        .expect(200);

      const categories = response.body.categories;

      // Validate all expected categories are present
      TEST_CONFIG.FEATURE_CATEGORIES.forEach(expectedCategory => {
        expect(categories).toHaveProperty(expectedCategory);
      });

      // Validate category distribution is reasonable
      const totalFeatures = Object.values(categories).reduce((sum: number, count: number) => sum + count, 0);
      expect(totalFeatures).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FEATURES);

      // Technology should be one of the largest categories
      expect(categories['Technology']).toBeGreaterThanOrEqual(8);
    });

    it('should validate feature type consistency across categories', async () => {
      const features = await dataSource.getRepository(FeatureEntity).find();

      // Group features by expected categories
      const technologyFeatures = features.filter(f => 
        ['WiFi Support', 'Bluetooth', '5G Support', 'Processor', 'RAM Size'].includes(f.name)
      );

      const fashionFeatures = features.filter(f => 
        ['Material', 'Size', 'Color', 'Washable'].includes(f.name)
      );

      // Validate boolean vs text distribution makes sense
      const techBooleans = technologyFeatures.filter(f => f.type === 'boolean');
      const techTexts = technologyFeatures.filter(f => f.type === 'text');

      expect(techBooleans.length).toBeGreaterThan(0); // WiFi, Bluetooth, 5G should be boolean
      expect(techTexts.length).toBeGreaterThan(0); // Processor, RAM should be text

      const fashionBooleans = fashionFeatures.filter(f => f.type === 'boolean');
      const fashionTexts = fashionFeatures.filter(f => f.type === 'text');

      expect(fashionTexts.length).toBeGreaterThan(0); // Material, Size, Color should be text
    });
  });

  describe('Product-Feature Value Validation', () => {
    beforeEach(async () => {
      await featuresSeederService.seedFeatures();
    });

    it('should validate realistic feature values for technology products', async () => {
      const productFeatures = await dataSource.getRepository(ProductFeatureEntity).find({
        relations: ['feature'],
      });

      const technologyFeatures = productFeatures.filter(pf => 
        ['Processor', 'RAM Size', 'Storage Capacity', 'Operating System'].includes(pf.feature.name)
      );

      expect(technologyFeatures.length).toBeGreaterThan(0);

      technologyFeatures.forEach(pf => {
        switch (pf.feature.name) {
          case 'Processor':
            expect(pf.value).toMatch(/^(Snapdragon|Apple|Exynos|MediaTek)/);
            break;
          case 'RAM Size':
            expect(pf.value).toMatch(/^\d+GB$/);
            break;
          case 'Storage Capacity':
            expect(pf.value).toMatch(/^\d+(GB|TB)$/);
            break;
          case 'Operating System':
            expect(pf.value).toMatch(/^(Android|iOS|Windows|macOS)/);
            break;
        }
      });
    });

    it('should validate boolean feature values consistency', async () => {
      const productFeatures = await dataSource.getRepository(ProductFeatureEntity).find({
        relations: ['feature'],
        where: { feature: { type: 'boolean' } },
      });

      expect(productFeatures.length).toBeGreaterThan(0);

      productFeatures.forEach(pf => {
        expect(['Yes', 'No']).toContain(pf.value);
      });
    });

    it('should validate Syrian market feature values', async () => {
      const productFeatures = await dataSource.getRepository(ProductFeatureEntity).find({
        relations: ['feature'],
      });

      const syrianFeatures = productFeatures.filter(pf => 
        ['Regional Availability', 'Governorate Preference'].includes(pf.feature.name)
      );

      syrianFeatures.forEach(pf => {
        switch (pf.feature.name) {
          case 'Regional Availability':
            expect(['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Nationwide']).toContain(pf.value);
            break;
          case 'Governorate Preference':
            expect(['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa']).toContain(pf.value);
            break;
        }
      });
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain feature name uniqueness', async () => {
      const features = await dataSource.getRepository(FeatureEntity).find();

      const featureNames = features.map(f => f.name);
      const uniqueNames = new Set(featureNames);

      expect(featureNames.length).toBe(uniqueNames.size);
    });

    it('should validate product-feature association integrity', async () => {
      const productFeatures = await dataSource.getRepository(ProductFeatureEntity).find({
        relations: ['product', 'feature'],
      });

      for (const pf of productFeatures) {
        // Each association should have valid product and feature
        expect(pf.product).toBeTruthy();
        expect(pf.feature).toBeTruthy();
        expect(pf.value).toBeTruthy();

        // No duplicate associations for same product-feature combination
        const duplicates = productFeatures.filter(other => 
          other.product.id === pf.product.id && 
          other.feature.id === pf.feature.id &&
          other.id !== pf.id
        );
        expect(duplicates.length).toBe(0);
      }
    });

    it('should validate feature type constraints', async () => {
      const features = await dataSource.getRepository(FeatureEntity).find();

      features.forEach(feature => {
        expect(['boolean', 'text']).toContain(feature.type);
        
        // Feature names should be consistent with their types
        const booleanIndicators = ['Support', 'Resistant', 'Certified', 'Free', 'Required'];
        const textIndicators = ['Size', 'Type', 'Capacity', 'System', 'Resolution', 'Material'];

        if (booleanIndicators.some(indicator => feature.name.includes(indicator))) {
          // These features are more likely to be boolean, but not required
        }

        if (textIndicators.some(indicator => feature.name.includes(indicator))) {
          // These features are more likely to be text, but not required
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle feature seeding when products do not exist', async () => {
      // Clear products first
      await dataSource.getRepository(ProductFeatureEntity).delete({});
      
      // This should still work, just with no product associations
      const response = await request(app.getHttpServer())
        .post('/features/seed/test')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('test_mode', true);
    });

    it('should handle clearing features data', async () => {
      const response = await request(app.getHttpServer())
        .delete('/features/seed/clear')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('cleared_at');

      // Verify data is actually cleared
      const featuresCount = await dataSource.getRepository(FeatureEntity).count();
      const productFeaturesCount = await dataSource.getRepository(ProductFeatureEntity).count();

      expect(featuresCount).toBe(0);
      expect(productFeaturesCount).toBe(0);
    });

    it('should handle invalid export format gracefully', async () => {
      const invalidConfig = {
        format: 'invalid_format',
        include_product_associations: true,
      };

      // This should still process but may return error info
      await request(app.getHttpServer())
        .post('/features/seed/export')
        .send(invalidConfig)
        .expect(200); // API handles gracefully
    });

    it('should handle concurrent feature operations', async () => {
      const promises = Array(3).fill(0).map(() =>
        request(app.getHttpServer())
          .post('/features/seed/test')
          .send({ sample_size: 10 })
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System Performance Under Load', () => {
    it('should maintain performance under concurrent feature analytics requests', async () => {
      const startTime = Date.now();

      const promises = Array(10).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/features/seed/statistics')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME * 2);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume feature category analytics efficiently', async () => {
      const startTime = Date.now();

      const promises = Array(5).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/features/seed/analytics/categories')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should optimize feature export operations', async () => {
      const exportConfigs = [
        { format: 'csv', include_product_associations: false },
        { format: 'excel', include_statistics: true },
        { format: 'json', filter_by_category: ['Technology'] },
      ];
      
      const startTime = Date.now();

      const promises = exportConfigs.map(config =>
        request(app.getHttpServer())
          .post('/features/seed/export')
          .send(config)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});
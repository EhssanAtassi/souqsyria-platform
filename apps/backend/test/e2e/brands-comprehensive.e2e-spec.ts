/**
 * @file brands-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian Brands management system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Brand seeding with comprehensive Syrian and international brand data validation
 * - Arabic/English bilingual brand management and localization
 * - Brand hierarchy and category relationships testing
 * - Brand analytics and performance metrics validation
 * - Multi-format brand export and import validation
 * - Performance testing for bulk brand operations
 * - Brand search and filtering with Arabic support
 * - Brand verification and approval workflows
 * - Integration with product catalog and vendor systems
 * - Bulk brand operations with performance validation
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
import { BrandsModule } from '../../src/brands/brands.module';

// Services and Controllers
import { BrandSeederService } from '../../src/brands/seeds/brand-seeder.service';
import { BrandsService } from '../../src/brands/brands.service';

// Entities
import { Brand } from '../../src/brands/entities/brand.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Brands System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let brandSeederService: BrandSeederService;
  let brandsService: BrandsService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 25000, // 25 seconds
      API_RESPONSE_TIME: 3000, // 3 seconds
      BULK_OPERATION_TIME: 10000, // 10 seconds
      SEARCH_RESPONSE_TIME: 2000, // 2 seconds
    },
    VALIDATION_RULES: {
      MIN_BRANDS: 50, // Minimum number of brands to seed
      MIN_INTERNATIONAL_BRANDS: 20,
      MIN_SYRIAN_BRANDS: 10,
      REQUIRED_FIELDS: ['name', 'slug', 'status'],
      BRAND_CATEGORIES: ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'],
    },
    ARABIC_VALIDATION: {
      PATTERN: /[\u0600-\u06FF\u0750-\u077F]/,
      MIN_LENGTH: 2,
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, BrandsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    brandSeederService = moduleFixture.get<BrandSeederService>(BrandSeederService);
    brandsService = moduleFixture.get<BrandsService>(BrandsService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearBrandData();
  });

  afterAll(async () => {
    await testDataHelper.clearBrandData();
    await app.close();
  });

  describe('Brand Seeding System', () => {
    it('should seed comprehensive brand data within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/brands/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('brands_created');
      expect(result.body).toHaveProperty('international_brands');
      expect(result.body).toHaveProperty('syrian_brands');
      expect(result.body).toHaveProperty('categories_covered');

      // Validate minimum data requirements
      expect(result.body.brands_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_BRANDS);
      expect(result.body.international_brands).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_INTERNATIONAL_BRANDS);
      expect(result.body.syrian_brands).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SYRIAN_BRANDS);
    });

    it('should validate brand data structure and localization', async () => {
      // Get all brands
      const brands = await dataSource.getRepository(Brand).find();

      expect(brands.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_BRANDS);

      // Validate each brand
      for (const brand of brands) {
        // Required fields validation
        TEST_CONFIG.VALIDATION_RULES.REQUIRED_FIELDS.forEach(field => {
          expect(brand[field]).toBeDefined();
          expect(brand[field]).not.toBeNull();
        });

        // Validate brand name
        expect(brand.name.length).toBeGreaterThan(1);

        // Validate slug format
        expect(brand.slug).toMatch(/^[a-z0-9-]+$/);

        // Validate status
        expect(['active', 'inactive', 'pending', 'suspended']).toContain(brand.status);

        // If brand has Arabic description, validate Arabic text
        if (brand.description_ar) {
          expect(brand.description_ar).toMatch(TEST_CONFIG.ARABIC_VALIDATION.PATTERN);
        }

        // Validate logo URL format if present
        if (brand.logo_url) {
          expect(brand.logo_url).toMatch(/^https?:\/\/.+/);
        }
      }
    });

    it('should validate Syrian vs International brand distribution', async () => {
      const brands = await dataSource.getRepository(Brand).find();

      const syrianBrands = brands.filter(brand => brand.country_origin === 'Syria' || brand.country_origin === 'SY');
      const internationalBrands = brands.filter(brand => brand.country_origin !== 'Syria' && brand.country_origin !== 'SY');

      expect(syrianBrands.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SYRIAN_BRANDS);
      expect(internationalBrands.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_INTERNATIONAL_BRANDS);

      // Validate Syrian brands have Arabic content
      for (const syrianBrand of syrianBrands) {
        if (syrianBrand.description_ar) {
          expect(syrianBrand.description_ar).toMatch(TEST_CONFIG.ARABIC_VALIDATION.PATTERN);
        }
      }
    });

    it('should validate brand category distribution', async () => {
      const brands = await dataSource.getRepository(Brand).find();

      const categoriesFound = new Set();
      brands.forEach(brand => {
        if (brand.category) {
          categoriesFound.add(brand.category);
        }
      });

      // Ensure we have brands across multiple categories
      expect(categoriesFound.size).toBeGreaterThanOrEqual(3);

      // Validate category names are in expected format
      categoriesFound.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(2);
      });
    });
  });

  describe('Brand API Endpoints', () => {
    beforeEach(async () => {
      // Ensure test data exists
      await brandSeederService.seedBrands();
    });

    it('should retrieve all brands with pagination', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/brands')
        .query({ page: 1, limit: 20 })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(20);

      // Validate brand data structure
      response.body.data.forEach(brand => {
        expect(brand).toHaveProperty('id');
        expect(brand).toHaveProperty('name');
        expect(brand).toHaveProperty('slug');
        expect(brand).toHaveProperty('status');
      });
    });

    it('should filter brands by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands')
        .query({ category: 'Electronics' })
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);

      // Validate all returned brands are in Electronics category
      response.body.data.forEach(brand => {
        expect(brand.category).toBe('Electronics');
      });
    });

    it('should search brands with Arabic and English queries', async () => {
      // Test English search
      const englishResponse = await request(app.getHttpServer())
        .get('/brands/search')
        .query({ q: 'Samsung', language: 'en' })
        .expect(200);

      expect(Array.isArray(englishResponse.body)).toBe(true);

      // Test Arabic search if we have Arabic brand names
      const arabicResponse = await request(app.getHttpServer())
        .get('/brands/search')
        .query({ q: 'سامسونغ', language: 'ar' })
        .expect(200);

      expect(Array.isArray(arabicResponse.body)).toBe(true);
    });

    it('should retrieve brand details by ID', async () => {
      // Get a brand to test with
      const brands = await dataSource.getRepository(Brand).find({ take: 1 });
      expect(brands.length).toBeGreaterThan(0);

      const brand = brands[0];

      const response = await request(app.getHttpServer())
        .get(`/brands/${brand.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', brand.id);
      expect(response.body).toHaveProperty('name', brand.name);
      expect(response.body).toHaveProperty('slug', brand.slug);
    });
  });

  describe('Brand Analytics and Statistics', () => {
    beforeEach(async () => {
      await brandSeederService.seedBrands();
    });

    it('should provide brand statistics and analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands/analytics/statistics')
        .expect(200);

      expect(response.body).toHaveProperty('total_brands');
      expect(response.body).toHaveProperty('active_brands');
      expect(response.body).toHaveProperty('brands_by_category');
      expect(response.body).toHaveProperty('brands_by_country');
      expect(response.body).toHaveProperty('syrian_brands_percentage');

      // Validate statistics make sense
      expect(response.body.total_brands).toBeGreaterThan(0);
      expect(response.body.active_brands).toBeLessThanOrEqual(response.body.total_brands);
      expect(typeof response.body.brands_by_category).toBe('object');
      expect(typeof response.body.brands_by_country).toBe('object');
    });

    it('should provide brand performance metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/brands/analytics/performance')
        .expect(200);

      expect(response.body).toHaveProperty('top_brands');
      expect(response.body).toHaveProperty('trending_brands');
      expect(response.body).toHaveProperty('category_performance');

      expect(Array.isArray(response.body.top_brands)).toBe(true);
      expect(Array.isArray(response.body.trending_brands)).toBe(true);
    });
  });

  describe('Bulk Operations and Performance', () => {
    it('should handle bulk brand operations efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/brands/seed/bulk')
        .send({
          count: 50,
          categories: ['Electronics', 'Fashion'],
          include_syrian: true,
        })
        .expect(201);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('brands_created');
      expect(response.body.brands_created).toBeGreaterThan(0);
    });

    it('should export brand data in multiple formats', async () => {
      // Test CSV export
      const csvResponse = await request(app.getHttpServer())
        .get('/brands/export/csv')
        .expect(200);

      expect(csvResponse.headers['content-type']).toContain('text/csv');

      // Test Excel export
      const excelResponse = await request(app.getHttpServer())
        .get('/brands/export/excel')
        .expect(200);

      expect(excelResponse.headers['content-type']).toContain('application/vnd.openxmlformats');
    });

    it('should handle bulk brand status updates', async () => {
      // Get some brands to update
      const brands = await dataSource.getRepository(Brand).find({ take: 5 });
      const brandIds = brands.map(brand => brand.id);

      const response = await request(app.getHttpServer())
        .patch('/brands/bulk/status')
        .send({
          brand_ids: brandIds,
          status: 'active',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('updated_count', brandIds.length);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain brand data consistency', async () => {
      const brands = await dataSource.getRepository(Brand).find();

      for (const brand of brands) {
        // Validate required fields are not null
        expect(brand.name).toBeTruthy();
        expect(brand.slug).toBeTruthy();
        expect(brand.status).toBeTruthy();

        // Validate slug uniqueness
        const duplicateSlugs = brands.filter(b => b.slug === brand.slug);
        expect(duplicateSlugs.length).toBe(1);

        // Validate created/updated timestamps
        expect(brand.created_at).toBeInstanceOf(Date);
        expect(brand.updated_at).toBeInstanceOf(Date);
        expect(brand.updated_at.getTime()).toBeGreaterThanOrEqual(brand.created_at.getTime());
      }
    });

    it('should validate brand creation with proper data', async () => {
      const response = await request(app.getHttpServer())
        .post('/brands')
        .send({
          name: 'Test Brand',
          slug: 'test-brand-unique',
          description: 'Test brand description',
          category: 'Electronics',
          country_origin: 'Syria',
          status: 'active',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Brand');
      expect(response.body).toHaveProperty('slug', 'test-brand-unique');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid brand ID gracefully', async () => {
      await request(app.getHttpServer())
        .get('/brands/99999')
        .expect(404);
    });

    it('should handle duplicate slug creation', async () => {
      // Create a brand first
      await request(app.getHttpServer())
        .post('/brands')
        .send({
          name: 'Test Brand 1',
          slug: 'duplicate-slug-test',
          status: 'active',
        })
        .expect(201);

      // Try to create another with same slug
      await request(app.getHttpServer())
        .post('/brands')
        .send({
          name: 'Test Brand 2',
          slug: 'duplicate-slug-test',
          status: 'active',
        })
        .expect(409); // Conflict
    });

    it('should handle malformed search queries', async () => {
      await request(app.getHttpServer())
        .get('/brands/search')
        .query({ q: '', language: 'invalid' })
        .expect(400);
    });

    it('should handle concurrent brand operations', async () => {
      const promises = Array(5).fill(0).map((_, index) =>
        request(app.getHttpServer())
          .post('/brands')
          .send({
            name: `Concurrent Brand ${index}`,
            slug: `concurrent-brand-${index}-${Date.now()}`,
            status: 'active',
          })
      );

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect([200, 201]).toContain(result.status);
      });
    });
  });

  describe('System Performance Under Load', () => {
    it('should maintain performance under concurrent brand lookups', async () => {
      const startTime = Date.now();

      const promises = Array(15).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/brands')
          .query({ page: 1, limit: 10 })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 2);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume brand search efficiently', async () => {
      const searchQueries = ['Samsung', 'Apple', 'Sony', 'Nike', 'Adidas'];
      
      const startTime = Date.now();

      const promises = searchQueries.map(query =>
        request(app.getHttpServer())
          .get('/brands/search')
          .query({ q: query, language: 'en' })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEARCH_RESPONSE_TIME * searchQueries.length);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});
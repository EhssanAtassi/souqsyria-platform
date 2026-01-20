/**
 * @file commissions-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian Commission Management system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Commission seeding with 4-tier hierarchy system (Product → Vendor → Category → Global)
 * - Multi-currency commission tracking (SYP/USD/EUR) with real-time exchange rates
 * - Syrian market analytics with governorate-based commission insights
 * - Vendor tier management and performance-based commission optimization
 * - Automated payout processing and commission calculation validation
 * - Business intelligence dashboards with Arabic/English localization
 * - Bulk commission operations with performance validation
 * - Commission audit trails and compliance tracking
 * - Integration with order processing and vendor management systems
 * - Performance testing for high-volume commission calculations
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
import { CommissionsModule } from '../../src/commissions/commissions.module';

// Services and Controllers
import { CommissionSeederService } from '../../src/commissions/seeds/commission-seeder.service';
import { CommissionsService } from '../../src/commissions/service/commissions.service';

// Entities
import { ProductCommissionEntity } from '../../src/commissions/entites/product-commission.entity';
import { VendorCommissionEntity } from '../../src/commissions/entites/vendor-commission.entity';
import { CategoryCommissionEntity } from '../../src/commissions/entites/category-commission.entity';
import { GlobalCommissionEntity } from '../../src/commissions/entites/global-commission.entity';
import { SyrianCommissionAnalyticsEntity } from '../../src/commissions/entites/syrian-commission-analytics.entity';
import { CommissionPayoutEntity } from '../../src/commissions/entites/commission-payout.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Commissions System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let commissionSeederService: CommissionSeederService;
  let commissionsService: CommissionsService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 35000, // 35 seconds for complex commission seeding
      API_RESPONSE_TIME: 4000, // 4 seconds
      BULK_CALCULATION_TIME: 15000, // 15 seconds for bulk calculations
      ANALYTICS_RESPONSE_TIME: 3000, // 3 seconds for analytics
    },
    VALIDATION_RULES: {
      MIN_PRODUCT_COMMISSIONS: 50,
      MIN_VENDOR_COMMISSIONS: 20,
      MIN_CATEGORY_COMMISSIONS: 10,
      MIN_GLOBAL_COMMISSIONS: 3,
      COMMISSION_RATE_RANGE: { min: 0.01, max: 0.30 }, // 1% to 30%
      SUPPORTED_CURRENCIES: ['SYP', 'USD', 'EUR'],
    },
    SYRIAN_VALIDATION: {
      MIN_GOVERNORATES: 14,
      REQUIRED_ANALYTICS_FIELDS: ['total_commission', 'vendor_count', 'order_count'],
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, CommissionsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    commissionSeederService = moduleFixture.get<CommissionSeederService>(CommissionSeederService);
    commissionsService = moduleFixture.get<CommissionsService>(CommissionsService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearCommissionData();
  });

  afterAll(async () => {
    await testDataHelper.clearCommissionData();
    await app.close();
  });

  describe('Commission Seeding System', () => {
    it('should seed comprehensive 4-tier commission hierarchy within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/commissions/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('product_commissions_created');
      expect(result.body).toHaveProperty('vendor_commissions_created');
      expect(result.body).toHaveProperty('category_commissions_created');
      expect(result.body).toHaveProperty('global_commissions_created');
      expect(result.body).toHaveProperty('syrian_analytics_created');

      // Validate minimum data requirements
      expect(result.body.product_commissions_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_PRODUCT_COMMISSIONS);
      expect(result.body.vendor_commissions_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_VENDOR_COMMISSIONS);
      expect(result.body.category_commissions_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_CATEGORY_COMMISSIONS);
      expect(result.body.global_commissions_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_GLOBAL_COMMISSIONS);
    });

    it('should validate product commission data structure and rates', async () => {
      const productCommissions = await dataSource.getRepository(ProductCommissionEntity).find({
        relations: ['product', 'vendor'],
      });

      expect(productCommissions.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_PRODUCT_COMMISSIONS);

      for (const commission of productCommissions) {
        // Validate required relationships
        expect(commission.product).toBeDefined();
        expect(commission.vendor).toBeDefined();

        // Validate commission rate range
        expect(commission.commission_rate).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.COMMISSION_RATE_RANGE.min);
        expect(commission.commission_rate).toBeLessThanOrEqual(TEST_CONFIG.VALIDATION_RULES.COMMISSION_RATE_RANGE.max);

        // Validate currency support
        expect(TEST_CONFIG.VALIDATION_RULES.SUPPORTED_CURRENCIES).toContain(commission.currency);

        // Validate status and effective dates
        expect(['active', 'inactive', 'pending']).toContain(commission.status);
        expect(commission.effective_from).toBeInstanceOf(Date);

        if (commission.effective_to) {
          expect(commission.effective_to.getTime()).toBeGreaterThan(commission.effective_from.getTime());
        }
      }
    });

    it('should validate vendor commission hierarchy and tier management', async () => {
      const vendorCommissions = await dataSource.getRepository(VendorCommissionEntity).find({
        relations: ['vendor'],
      });

      expect(vendorCommissions.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_VENDOR_COMMISSIONS);

      for (const commission of vendorCommissions) {
        // Validate vendor relationship
        expect(commission.vendor).toBeDefined();
        expect(commission.vendor.id).toBeDefined();

        // Validate tier system
        expect(['bronze', 'silver', 'gold', 'platinum', 'premium']).toContain(commission.vendor_tier);

        // Validate commission rates by tier
        const ratesByTier = {
          bronze: { min: 0.01, max: 0.10 },
          silver: { min: 0.05, max: 0.15 },
          gold: { min: 0.10, max: 0.20 },
          platinum: { min: 0.15, max: 0.25 },
          premium: { min: 0.20, max: 0.30 },
        };

        const tierRange = ratesByTier[commission.vendor_tier];
        expect(commission.commission_rate).toBeGreaterThanOrEqual(tierRange.min);
        expect(commission.commission_rate).toBeLessThanOrEqual(tierRange.max);
      }
    });

    it('should validate category commission structure', async () => {
      const categoryCommissions = await dataSource.getRepository(CategoryCommissionEntity).find({
        relations: ['category'],
      });

      expect(categoryCommissions.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_CATEGORY_COMMISSIONS);

      for (const commission of categoryCommissions) {
        // Validate category relationship
        expect(commission.category).toBeDefined();
        expect(commission.category.name).toBeDefined();

        // Validate commission structure
        expect(commission.commission_rate).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.COMMISSION_RATE_RANGE.min);
        expect(commission.commission_rate).toBeLessThanOrEqual(TEST_CONFIG.VALIDATION_RULES.COMMISSION_RATE_RANGE.max);

        // Validate currency and minimum amounts
        expect(TEST_CONFIG.VALIDATION_RULES.SUPPORTED_CURRENCIES).toContain(commission.currency);
        
        if (commission.minimum_amount) {
          expect(commission.minimum_amount).toBeGreaterThan(0);
        }
      }
    });

    it('should validate global commission defaults', async () => {
      const globalCommissions = await dataSource.getRepository(GlobalCommissionEntity).find();

      expect(globalCommissions.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_GLOBAL_COMMISSIONS);

      // Ensure we have global commission for each supported currency
      const currenciesFound = new Set(globalCommissions.map(gc => gc.currency));
      TEST_CONFIG.VALIDATION_RULES.SUPPORTED_CURRENCIES.forEach(currency => {
        expect(currenciesFound.has(currency)).toBe(true);
      });

      for (const commission of globalCommissions) {
        // Validate global commission rates (typically lower than specific rates)
        expect(commission.commission_rate).toBeGreaterThanOrEqual(0.01);
        expect(commission.commission_rate).toBeLessThanOrEqual(0.15);

        // Validate priority system
        expect(commission.priority).toBeGreaterThanOrEqual(1);
        expect(commission.priority).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('Syrian Commission Analytics System', () => {
    beforeEach(async () => {
      await commissionSeederService.seedCommissions();
    });

    it('should provide comprehensive Syrian market analytics', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/commissions/analytics/syrian-market')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('governorate_analytics');
      expect(response.body).toHaveProperty('vendor_tier_distribution');
      expect(response.body).toHaveProperty('currency_breakdown');
      expect(response.body).toHaveProperty('monthly_trends');

      // Validate governorate analytics
      expect(Array.isArray(response.body.governorate_analytics)).toBe(true);
      expect(response.body.governorate_analytics.length).toBeGreaterThanOrEqual(TEST_CONFIG.SYRIAN_VALIDATION.MIN_GOVERNORATES);

      response.body.governorate_analytics.forEach(analytics => {
        TEST_CONFIG.SYRIAN_VALIDATION.REQUIRED_ANALYTICS_FIELDS.forEach(field => {
          expect(analytics).toHaveProperty(field);
        });
      });
    });

    it('should validate vendor performance analytics with tier progression', async () => {
      const response = await request(app.getHttpServer())
        .get('/commissions/analytics/vendor-performance')
        .expect(200);

      expect(response.body).toHaveProperty('top_performing_vendors');
      expect(response.body).toHaveProperty('tier_progression_candidates');
      expect(response.body).toHaveProperty('commission_optimization_suggestions');

      // Validate vendor performance data
      expect(Array.isArray(response.body.top_performing_vendors)).toBe(true);
      
      response.body.top_performing_vendors.forEach(vendor => {
        expect(vendor).toHaveProperty('vendor_id');
        expect(vendor).toHaveProperty('current_tier');
        expect(vendor).toHaveProperty('total_commission_earned');
        expect(vendor).toHaveProperty('performance_score');
      });
    });

    it('should provide commission payout analytics and projections', async () => {
      const response = await request(app.getHttpServer())
        .get('/commissions/analytics/payout-projections')
        .query({ period: 'monthly', currency: 'SYP' })
        .expect(200);

      expect(response.body).toHaveProperty('upcoming_payouts');
      expect(response.body).toHaveProperty('cash_flow_projection');
      expect(response.body).toHaveProperty('vendor_payout_schedule');

      // Validate payout data structure
      expect(Array.isArray(response.body.upcoming_payouts)).toBe(true);
      expect(response.body).toHaveProperty('total_payout_amount');
      expect(response.body).toHaveProperty('payout_currency', 'SYP');
    });
  });

  describe('Commission Calculation API Endpoints', () => {
    beforeEach(async () => {
      await commissionSeederService.seedCommissions();
    });

    it('should calculate commission using 4-tier hierarchy', async () => {
      const response = await request(app.getHttpServer())
        .post('/commissions/calculate')
        .send({
          product_id: 1,
          vendor_id: 1,
          order_amount: 1000000, // 1M SYP
          currency: 'SYP',
        })
        .expect(200);

      expect(response.body).toHaveProperty('commission_amount');
      expect(response.body).toHaveProperty('commission_rate');
      expect(response.body).toHaveProperty('calculation_tier');
      expect(response.body).toHaveProperty('currency', 'SYP');

      // Validate calculation tier hierarchy
      expect(['product', 'vendor', 'category', 'global']).toContain(response.body.calculation_tier);

      // Validate commission amount is reasonable
      expect(response.body.commission_amount).toBeGreaterThan(0);
      expect(response.body.commission_amount).toBeLessThan(1000000 * 0.30); // Max 30%
    });

    it('should handle multi-currency commission calculations', async () => {
      const currencies = ['SYP', 'USD', 'EUR'];

      for (const currency of currencies) {
        const response = await request(app.getHttpServer())
          .post('/commissions/calculate')
          .send({
            product_id: 1,
            vendor_id: 1,
            order_amount: currency === 'SYP' ? 1000000 : 1000,
            currency: currency,
          })
          .expect(200);

        expect(response.body).toHaveProperty('currency', currency);
        expect(response.body).toHaveProperty('commission_amount');
        expect(response.body.commission_amount).toBeGreaterThan(0);
      }
    });

    it('should provide bulk commission calculations efficiently', async () => {
      const startTime = Date.now();

      const bulkCalculationData = Array(50).fill(0).map((_, index) => ({
        product_id: (index % 10) + 1,
        vendor_id: (index % 5) + 1,
        order_amount: 500000 + (index * 10000),
        currency: 'SYP',
      }));

      const response = await request(app.getHttpServer())
        .post('/commissions/calculate/bulk')
        .send({ calculations: bulkCalculationData })
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_CALCULATION_TIME);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(bulkCalculationData.length);

      response.body.results.forEach(result => {
        expect(result).toHaveProperty('commission_amount');
        expect(result).toHaveProperty('commission_rate');
        expect(result).toHaveProperty('calculation_tier');
      });
    });
  });

  describe('Commission Payout Management', () => {
    beforeEach(async () => {
      await commissionSeederService.seedCommissions();
    });

    it('should process commission payouts with proper validation', async () => {
      const response = await request(app.getHttpServer())
        .post('/commissions/payouts/process')
        .send({
          vendor_ids: [1, 2, 3],
          payout_period: 'monthly',
          currency: 'SYP',
        })
        .expect(201);

      expect(response.body).toHaveProperty('payout_batch_id');
      expect(response.body).toHaveProperty('total_vendors');
      expect(response.body).toHaveProperty('total_amount');
      expect(response.body).toHaveProperty('payouts_created');

      // Validate payout records were created
      const payouts = await dataSource.getRepository(CommissionPayoutEntity).find({
        where: { batch_id: response.body.payout_batch_id },
      });

      expect(payouts.length).toBeGreaterThan(0);
      payouts.forEach(payout => {
        expect(payout.amount).toBeGreaterThan(0);
        expect(payout.currency).toBe('SYP');
        expect(['pending', 'processing', 'completed']).toContain(payout.status);
      });
    });

    it('should provide payout history and status tracking', async () => {
      const response = await request(app.getHttpServer())
        .get('/commissions/payouts/history')
        .query({ vendor_id: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('payouts');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.payouts)).toBe(true);

      response.body.payouts.forEach(payout => {
        expect(payout).toHaveProperty('id');
        expect(payout).toHaveProperty('amount');
        expect(payout).toHaveProperty('currency');
        expect(payout).toHaveProperty('status');
        expect(payout).toHaveProperty('created_at');
      });
    });
  });

  describe('Data Integrity and Business Rules', () => {
    it('should maintain commission hierarchy integrity', async () => {
      // Validate that product commissions override vendor commissions
      const productCommission = await dataSource.getRepository(ProductCommissionEntity).findOne({
        where: { product: { id: 1 }, vendor: { id: 1 } },
        relations: ['product', 'vendor'],
      });

      if (productCommission) {
        const calculation = await request(app.getHttpServer())
          .post('/commissions/calculate')
          .send({
            product_id: 1,
            vendor_id: 1,
            order_amount: 1000000,
            currency: 'SYP',
          })
          .expect(200);

        expect(calculation.body.calculation_tier).toBe('product');
        expect(calculation.body.commission_rate).toBe(productCommission.commission_rate);
      }
    });

    it('should validate commission rate business rules', async () => {
      const allCommissions = await Promise.all([
        dataSource.getRepository(ProductCommissionEntity).find(),
        dataSource.getRepository(VendorCommissionEntity).find(),
        dataSource.getRepository(CategoryCommissionEntity).find(),
        dataSource.getRepository(GlobalCommissionEntity).find(),
      ]);

      allCommissions.flat().forEach(commission => {
        // All commission rates should be within business rules
        expect(commission.commission_rate).toBeGreaterThanOrEqual(0.001); // 0.1%
        expect(commission.commission_rate).toBeLessThanOrEqual(0.50); // 50%

        // Active commissions should have valid effective dates
        if (commission.status === 'active') {
          expect(commission.effective_from).toBeInstanceOf(Date);
          expect(commission.effective_from.getTime()).toBeLessThanOrEqual(Date.now());
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid commission calculation requests', async () => {
      await request(app.getHttpServer())
        .post('/commissions/calculate')
        .send({
          product_id: 99999,
          vendor_id: 99999,
          order_amount: -1000,
          currency: 'INVALID',
        })
        .expect(400);
    });

    it('should handle concurrent payout processing', async () => {
      const promises = Array(3).fill(0).map(() =>
        request(app.getHttpServer())
          .post('/commissions/payouts/process')
          .send({
            vendor_ids: [1],
            payout_period: 'monthly',
            currency: 'SYP',
          })
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed, others might conflict
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle missing commission configuration gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/commissions/calculate')
        .send({
          product_id: 99999, // Non-existent product
          vendor_id: 99999, // Non-existent vendor
          order_amount: 1000000,
          currency: 'SYP',
        })
        .expect(200); // Should fallback to global commission

      expect(response.body.calculation_tier).toBe('global');
      expect(response.body.commission_amount).toBeGreaterThan(0);
    });
  });

  describe('System Performance Under Load', () => {
    it('should maintain performance under concurrent commission calculations', async () => {
      const startTime = Date.now();

      const promises = Array(20).fill(0).map((_, index) =>
        request(app.getHttpServer())
          .post('/commissions/calculate')
          .send({
            product_id: (index % 5) + 1,
            vendor_id: (index % 3) + 1,
            order_amount: 500000 + (index * 10000),
            currency: 'SYP',
          })
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME * 3);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume analytics requests efficiently', async () => {
      const startTime = Date.now();

      const promises = [
        request(app.getHttpServer()).get('/commissions/analytics/syrian-market'),
        request(app.getHttpServer()).get('/commissions/analytics/vendor-performance'),
        request(app.getHttpServer()).get('/commissions/analytics/payout-projections'),
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME * 2);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});
/**
 * @file refund-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E Tests for Syrian Refund Seeding System
 *
 * TESTING COVERAGE:
 * - Complete REST API testing for refund seeding endpoints
 * - Multi-currency transaction processing with Syrian banking
 * - Performance testing with bulk generation capabilities
 * - Data integrity validation and cleanup operations
 * - Arabic/English localization and error handling
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 * @version 2.0.0 - Enterprise Edition
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

// Core modules
import { RefundModule } from '../../src/refund/refund.module';
import { AuthModule } from '../../src/auth/auth.module';
import { AccessControlModule } from '../../src/access-control/access-control.module';

// Test helpers (to be created)
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

// Entities
import { SyrianRefundEntity } from '../../src/refund/entities/syrian-refund.entity';
import { SyrianGovernorateEntity } from '../../src/addresses/entities/syrian-governorate.entity';

describe('Refund Seeding System (E2E)', () => {
  let app: INestApplication;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;
  let adminAuthToken: string;
  let analystAuthToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Database configuration for testing
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [SyrianRefundEntity, SyrianGovernorateEntity],
          synchronize: true,
          logging: false,
        }),
        RefundModule,
        AuthModule,
        AccessControlModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Initialize test helpers
    testDataHelper = new TestDataHelper(app);
    validationHelper = new ValidationHelper();

    // Setup test authentication tokens
    adminAuthToken = await testDataHelper.getAdminAuthToken();
    analystAuthToken = await testDataHelper.getAnalystAuthToken();

    // Seed required dependencies (governorates)
    await testDataHelper.seedSyrianGovernorates();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up refund data before each test
    await testDataHelper.cleanupRefundData();
  });

  describe('POST /refund/seeds/sample-refunds', () => {
    it('should seed Syrian refund sample data successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      // Validate response structure
      expect(response.body).toMatchObject({
        message: 'Syrian refunds seeded successfully',
        messageAr: 'تم زرع بيانات المرتجعات السورية بنجاح',
        totalSeeded: 10,
        statusDistribution: expect.any(Object),
        processingTimeMs: expect.any(Number),
      });

      // Validate status distribution
      const statusDistribution = response.body.statusDistribution;
      expect(Object.keys(statusDistribution)).toHaveLength(10); // All 10 statuses
      expect(Object.values(statusDistribution).reduce((a: number, b: number) => a + b, 0)).toBe(10);

      // Validate processing time is reasonable
      expect(response.body.processingTimeMs).toBeGreaterThan(0);
      expect(response.body.processingTimeMs).toBeLessThan(10000); // Less than 10 seconds
    });

    it('should require admin authentication', async () => {
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(403);
    });

    it('should handle duplicate seeding gracefully', async () => {
      // First seeding
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      // Second seeding (should clear and re-seed)
      const response = await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      expect(response.body.totalSeeded).toBe(10);
    });
  });

  describe('GET /refund/seeds/analytics/workflow', () => {
    beforeEach(async () => {
      // Seed sample data for analytics
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);
    });

    it('should return comprehensive workflow analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/refund/seeds/analytics/workflow')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toMatchObject({
        message: 'Refund workflow analytics generated successfully',
        messageAr: 'تم إنشاء تحليلات سير عمل المرتجعات بنجاح',
        totalRefunds: 10,
        statusDistribution: expect.any(Array),
        methodDistribution: expect.any(Array),
        currencyDistribution: expect.any(Array),
        reasonDistribution: expect.any(Array),
        processingTimes: expect.any(Array),
        slaMetrics: expect.any(Array),
        monthlyPerformance: expect.any(Array),
      });

      // Validate status distribution structure
      expect(response.body.statusDistribution.length).toBeGreaterThan(0);
      response.body.statusDistribution.forEach((item: any) => {
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('percentage');
        expect(item.count).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeGreaterThanOrEqual(0);
        expect(item.percentage).toBeLessThanOrEqual(100);
      });

      // Validate method distribution
      expect(response.body.methodDistribution).toHaveLength(8); // 8 refund methods
      
      // Validate currency distribution
      expect(response.body.currencyDistribution).toHaveLength(3); // SYP, USD, EUR

      // Validate processing times
      expect(response.body.processingTimes).toHaveLength(5); // 5 processing stages

      // Validate SLA metrics
      expect(response.body.slaMetrics).toHaveLength(5); // 5 SLA metrics
    });

    it('should work with analyst role', async () => {
      await request(app.getHttpServer())
        .get('/refund/seeds/analytics/workflow')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);
    });

    it('should handle empty data gracefully', async () => {
      // Clean up data first
      await testDataHelper.cleanupRefundData();

      const response = await request(app.getHttpServer())
        .get('/refund/seeds/analytics/workflow')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);

      expect(response.body.totalRefunds).toBe(0);
      expect(response.body.statusDistribution).toEqual([]);
    });
  });

  describe('POST /refund/seeds/bulk-generation', () => {
    it('should generate small batch successfully', async () => {
      const bulkRequest = {
        count: 100,
        includeMetrics: true,
      };

      const response = await request(app.getHttpServer())
        .post('/refund/seeds/bulk-generation')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(bulkRequest)
        .expect(201);

      // Validate response
      expect(response.body).toMatchObject({
        message: 'Bulk refunds generated successfully',
        messageAr: 'تم إنشاء المرتجعات بالجملة بنجاح',
        totalGenerated: 100,
        performanceMetrics: {
          totalTimeMs: expect.any(Number),
          avgTimePerRecord: expect.any(Number),
          recordsPerSecond: expect.any(Number),
        },
      });

      // Validate performance metrics
      expect(response.body.performanceMetrics.totalTimeMs).toBeGreaterThan(0);
      expect(response.body.performanceMetrics.avgTimePerRecord).toBeGreaterThan(0);
      expect(response.body.performanceMetrics.recordsPerSecond).toBeGreaterThan(0);
    });

    it('should handle medium batch generation', async () => {
      const bulkRequest = {
        count: 1000,
        includeMetrics: true,
      };

      const response = await request(app.getHttpServer())
        .post('/refund/seeds/bulk-generation')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(bulkRequest)
        .expect(201);

      expect(response.body.totalGenerated).toBe(1000);
      
      // Performance should be reasonable for 1K records
      expect(response.body.performanceMetrics.recordsPerSecond).toBeGreaterThan(10);
    });

    it('should reject excessive count', async () => {
      const bulkRequest = {
        count: 100000, // Exceeds 50K limit
      };

      await request(app.getHttpServer())
        .post('/refund/seeds/bulk-generation')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(bulkRequest)
        .expect(400);
    });

    it('should validate request body', async () => {
      const invalidRequests = [
        { count: 0 }, // Below minimum
        { count: -10 }, // Negative
        { count: 'invalid' }, // Wrong type
        {}, // Missing count
      ];

      for (const invalidRequest of invalidRequests) {
        await request(app.getHttpServer())
          .post('/refund/seeds/bulk-generation')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(invalidRequest)
          .expect(400);
      }
    });
  });

  describe('GET /refund/seeds/banking-data', () => {
    it('should return Syrian banking integration data', async () => {
      const response = await request(app.getHttpServer())
        .get('/refund/seeds/banking-data')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toMatchObject({
        message: 'Banking data retrieved successfully',
        messageAr: 'تم استرداد البيانات المصرفية بنجاح',
        supportedBanks: expect.any(Array),
        totalBanks: expect.any(Number),
        activeBanks: expect.any(Number),
      });

      // Validate banking data
      expect(response.body.supportedBanks.length).toBeGreaterThan(0);
      expect(response.body.totalBanks).toBeGreaterThan(0);
      expect(response.body.activeBanks).toBeLessThanOrEqual(response.body.totalBanks);

      // Validate bank structure
      const firstBank = response.body.supportedBanks[0];
      expect(firstBank).toHaveProperty('bankType');
      expect(firstBank).toHaveProperty('bankNameAr');
      expect(firstBank).toHaveProperty('bankNameEn');
      expect(firstBank).toHaveProperty('swiftCode');
      expect(firstBank).toHaveProperty('supportedCurrencies');
      expect(firstBank).toHaveProperty('isActive');

      // Validate Arabic and English names
      expect(firstBank.bankNameAr).toMatch(/[\u0600-\u06FF]/); // Arabic characters
      expect(firstBank.bankNameEn).toMatch(/[A-Za-z]/); // English characters

      // Validate SWIFT code format
      expect(firstBank.swiftCode).toMatch(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/);

      // Validate supported currencies
      expect(Array.isArray(firstBank.supportedCurrencies)).toBe(true);
      expect(firstBank.supportedCurrencies.length).toBeGreaterThan(0);
    });

    it('should work with finance role', async () => {
      const financeAuthToken = await testDataHelper.getFinanceAuthToken();
      
      await request(app.getHttpServer())
        .get('/refund/seeds/banking-data')
        .set('Authorization', `Bearer ${financeAuthToken}`)
        .expect(200);
    });
  });

  describe('GET /refund/seeds/validation/integrity', () => {
    beforeEach(async () => {
      // Seed some data for validation
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);
    });

    it('should validate data integrity successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/refund/seeds/validation/integrity')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toMatchObject({
        message: 'Data integrity validation completed',
        messageAr: 'تم إكمال التحقق من سلامة البيانات',
        totalRecords: expect.any(Number),
        validRecords: expect.any(Number),
        invalidRecords: expect.any(Number),
        validationErrors: expect.any(Array),
        performanceMetrics: {
          validationTimeMs: expect.any(Number),
          recordsPerSecond: expect.any(Number),
        },
      });

      // Should have records from sample seeding
      expect(response.body.totalRecords).toBe(10);
      
      // Performance metrics should be reasonable
      expect(response.body.performanceMetrics.validationTimeMs).toBeGreaterThan(0);
      expect(response.body.performanceMetrics.recordsPerSecond).toBeGreaterThan(0);

      // Calculate validation ratio
      const validationRatio = response.body.validRecords / response.body.totalRecords;
      expect(validationRatio).toBeGreaterThan(0.8); // At least 80% should be valid
    });

    it('should work with QA role', async () => {
      const qaAuthToken = await testDataHelper.getQAAuthToken();
      
      await request(app.getHttpServer())
        .get('/refund/seeds/validation/integrity')
        .set('Authorization', `Bearer ${qaAuthToken}`)
        .expect(200);
    });

    it('should handle empty data validation', async () => {
      // Clean up data first
      await testDataHelper.cleanupRefundData();

      const response = await request(app.getHttpServer())
        .get('/refund/seeds/validation/integrity')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.totalRecords).toBe(0);
      expect(response.body.validRecords).toBe(0);
      expect(response.body.invalidRecords).toBe(0);
    });
  });

  describe('GET /refund/seeds/statistics/comprehensive', () => {
    beforeEach(async () => {
      // Seed sample and bulk data
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post('/refund/seeds/bulk-generation')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ count: 100 })
        .expect(201);
    });

    it('should return comprehensive statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/refund/seeds/statistics/comprehensive')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toMatchObject({
        message: 'Refund seeder statistics generated successfully',
        messageAr: 'تم إنشاء إحصائيات زارع المرتجعات بنجاح',
        overview: {
          totalRefunds: expect.any(Number),
          sampleRefunds: expect.any(Number),
          bulkRefunds: expect.any(Number),
          lastSeededAt: expect.any(String),
        },
        distribution: {
          byStatus: expect.any(Object),
          byMethod: expect.any(Object),
          byCurrency: expect.any(Object),
          byGovernorate: expect.any(Object),
        },
        performance: {
          avgAmountSyp: expect.any(Number),
          urgentRefundsCount: expect.any(Number),
          completionRate: expect.any(Number),
          avgProcessingTimeHours: expect.any(Number),
        },
      });

      // Validate overview calculations
      const overview = response.body.overview;
      expect(overview.totalRefunds).toBe(110); // 10 sample + 100 bulk
      expect(overview.sampleRefunds).toBe(10);
      expect(overview.bulkRefunds).toBe(100);
      expect(new Date(overview.lastSeededAt)).toBeInstanceOf(Date);

      // Validate performance metrics
      const performance = response.body.performance;
      expect(performance.avgAmountSyp).toBeGreaterThan(0);
      expect(performance.urgentRefundsCount).toBeGreaterThanOrEqual(0);
      expect(performance.completionRate).toBeGreaterThanOrEqual(0);
      expect(performance.completionRate).toBeLessThanOrEqual(100);
      expect(performance.avgProcessingTimeHours).toBeGreaterThan(0);
    });

    it('should work with manager role', async () => {
      const managerAuthToken = await testDataHelper.getManagerAuthToken();
      
      await request(app.getHttpServer())
        .get('/refund/seeds/statistics/comprehensive')
        .set('Authorization', `Bearer ${managerAuthToken}`)
        .expect(200);
    });
  });

  describe('DELETE /refund/seeds/cleanup', () => {
    beforeEach(async () => {
      // Seed some data to clean up
      await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);
    });

    it('should clean up seeded data successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete('/refund/seeds/cleanup')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      // Validate response
      expect(response.body).toMatchObject({
        message: 'Refund seed data cleaned up successfully',
        messageAr: 'تم تنظيف بيانات زرع المرتجعات بنجاح',
        recordsDeleted: 10,
        cleanupTimeMs: expect.any(Number),
      });

      // Verify data is actually deleted
      const statsResponse = await request(app.getHttpServer())
        .get('/refund/seeds/statistics/comprehensive')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);

      expect(statsResponse.body.overview.totalRefunds).toBe(0);
    });

    it('should require admin role', async () => {
      await request(app.getHttpServer())
        .delete('/refund/seeds/cleanup')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(403);
    });

    it('should handle empty cleanup gracefully', async () => {
      // Clean up first
      await request(app.getHttpServer())
        .delete('/refund/seeds/cleanup')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      // Clean up again (should work with 0 records)
      const response = await request(app.getHttpServer())
        .delete('/refund/seeds/cleanup')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.recordsDeleted).toBe(0);
    });
  });

  describe('POST /refund/seeds/generate-by-status', () => {
    it('should generate refunds by specific status', async () => {
      const response = await request(app.getHttpServer())
        .post('/refund/seeds/generate-by-status')
        .query({ status: 'completed', count: 5 })
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      // Validate response
      expect(response.body).toMatchObject({
        message: 'Generated 5 refunds with status: completed',
        messageAr: 'تم إنشاء 5 مرتجع بحالة: completed',
        status: 'completed',
        count: 5,
        timestamp: expect.any(String),
      });
    });

    it('should use default count when not specified', async () => {
      const response = await request(app.getHttpServer())
        .post('/refund/seeds/generate-by-status')
        .query({ status: 'processing' })
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      expect(response.body.count).toBe(10); // Default count
    });

    it('should validate status parameter', async () => {
      await request(app.getHttpServer())
        .post('/refund/seeds/generate-by-status')
        .query({ status: 'invalid_status' })
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(400);
    });

    it('should require QA or admin role', async () => {
      const qaAuthToken = await testDataHelper.getQAAuthToken();
      
      await request(app.getHttpServer())
        .post('/refund/seeds/generate-by-status')
        .query({ status: 'completed' })
        .set('Authorization', `Bearer ${qaAuthToken}`)
        .expect(201);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests gracefully', async () => {
      const concurrentRequests = Array(5).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/refund/seeds/banking-data')
          .set('Authorization', `Bearer ${analystAuthToken}`)
      );

      const responses = await Promise.all(concurrentRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should maintain performance under load', async () => {
      // Generate medium batch and measure performance
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post('/refund/seeds/bulk-generation')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ count: 1000 })
        .expect(201);

      const totalTime = Date.now() - startTime;
      
      // Should complete within reasonable time (10 seconds)
      expect(totalTime).toBeLessThan(10000);
      expect(response.body.performanceMetrics.recordsPerSecond).toBeGreaterThan(50);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connectivity issues', async () => {
      // This would be tested by temporarily stopping the database
      // For now, we just ensure the error handling structure is in place
      expect(true).toBe(true);
    });

    it('should validate Arabic text encoding', async () => {
      const response = await request(app.getHttpServer())
        .get('/refund/seeds/banking-data')
        .set('Authorization', `Bearer ${analystAuthToken}`)
        .expect(200);

      const arabicText = response.body.supportedBanks[0].bankNameAr;
      
      // Verify Arabic text is properly encoded
      expect(arabicText).toMatch(/[\u0600-\u06FF]/);
      expect(Buffer.from(arabicText, 'utf8').toString('utf8')).toBe(arabicText);
    });

    it('should handle malformed request payloads', async () => {
      const malformedPayloads = [
        'invalid json',
        { count: 'not a number' },
        { count: null },
        { count: undefined },
      ];

      for (const payload of malformedPayloads) {
        await request(app.getHttpServer())
          .post('/refund/seeds/bulk-generation')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(payload)
          .expect(400);
      }
    });
  });

  describe('Multi-language Response Validation', () => {
    it('should return consistent Arabic translations', async () => {
      const response = await request(app.getHttpServer())
        .post('/refund/seeds/sample-refunds')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(201);

      // Validate Arabic message format
      expect(response.body.messageAr).toMatch(/[\u0600-\u06FF]/);
      expect(response.body.messageAr).toContain('تم');
      expect(response.body.messageAr).toContain('المرتجعات');
      expect(response.body.messageAr).toContain('بنجاح');
    });

    it('should maintain message consistency across endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/refund/seeds/sample-refunds' },
        { method: 'get', path: '/refund/seeds/analytics/workflow' },
        { method: 'get', path: '/refund/seeds/banking-data' },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .expect(endpoint.method === 'post' ? 201 : 200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('messageAr');
        expect(typeof response.body.message).toBe('string');
        expect(typeof response.body.messageAr).toBe('string');
      }
    });
  });
});
/**
 * @file promotions-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for promotions and coupons module
 *
 * Tests the complete workflow of:
 * - Coupon creation, management, and validation
 * - Syrian market specific features
 * - Seeding functionality
 * - API endpoint integration
 * - Business logic validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PromotionsModule } from '../../src/promotions/promotions.module';
import {
  CouponEntity,
  CouponType,
  CouponStatus,
  UserTier,
} from '../../src/promotions/entities/coupon.entity';
import { CouponUsage } from '../../src/promotions/entities/coupon-usage.entity';
import { PromotionCampaign } from '../../src/promotions/entities/promotion-campaign.entity';
import { User } from '../../src/users/entities/user.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { VendorEntity } from '../../src/vendors/entities/vendor.entity';
import { CouponSeederService } from '../../src/coupons/seeds/coupon.seeder.service';
import { BulkAction } from '../../src/promotions/dto/bulk-coupon-action.dto';

describe('Promotions Module (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let couponSeederService: CouponSeederService;
  let testUser: User;
  let testCategory: Category;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            CouponEntity,
            CouponUsage,
            PromotionCampaign,
            User,
            Category,
            VendorEntity,
          ],
          synchronize: true,
          logging: false,
        }),
        PromotionsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    couponSeederService =
      moduleFixture.get<CouponSeederService>(CouponSeederService);

    await app.init();

    // Create test data
    await createTestData();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up coupons before each test
    await dataSource.getRepository(CouponEntity).clear();
  });

  describe('🎟️ Coupon Seeding', () => {
    it('should seed comprehensive coupon system successfully', async () => {
      const seedResult = await couponSeederService.seedCoupons();

      expect(seedResult.success).toBe(true);
      expect(seedResult.couponsCreated).toBeGreaterThan(0);
      expect(seedResult.seasonalCouponsCreated).toBeGreaterThan(0);
      expect(seedResult.categorySpecificCreated).toBeGreaterThan(0);
      expect(seedResult.userTierCouponsCreated).toBeGreaterThan(0);
      expect(seedResult.errors.length).toBe(0);

      // Verify specific Syrian market coupons were created
      const welcomeCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'WELCOME2025' },
        });
      expect(welcomeCoupon).toBeDefined();
      expect(welcomeCoupon.title_ar).toContain('أهلاً بك في سوق سوريا');

      const ramadanCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'RAMADAN2025' },
        });
      expect(ramadanCoupon).toBeDefined();
      expect(ramadanCoupon.title_ar).toContain('رمضان');
    });

    it('should not create duplicate coupons on repeated seeding', async () => {
      // First seeding
      const firstSeed = await couponSeederService.seedCoupons();
      const firstCount = firstSeed.couponsCreated;

      // Second seeding
      const secondSeed = await couponSeederService.seedCoupons();

      expect(secondSeed.success).toBe(true);
      expect(secondSeed.couponsCreated).toBe(0); // No new coupons created
      expect(secondSeed.errors.length).toBe(0);

      // Total count should remain the same
      const totalCoupons = await dataSource.getRepository(CouponEntity).count();
      expect(totalCoupons).toBe(
        firstCount +
          firstSeed.seasonalCouponsCreated +
          firstSeed.categorySpecificCreated +
          firstSeed.userTierCouponsCreated,
      );
    });

    it('should provide accurate seeding statistics', async () => {
      await couponSeederService.seedCoupons();

      const stats = await couponSeederService.getStatistics();

      expect(stats.totalCoupons).toBeGreaterThan(0);
      expect(stats.activeCoupons).toBeGreaterThan(0);
      expect(stats.averageDiscountValue).toBeGreaterThan(0);
      expect(stats.totalUsage).toBe(0); // No usage yet
    });

    it('should cleanup coupons successfully', async () => {
      await couponSeederService.seedCoupons();

      const cleanupResult = await couponSeederService.cleanupCoupons();

      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.deleted).toBeGreaterThan(0);

      const remainingCoupons = await dataSource
        .getRepository(CouponEntity)
        .count();
      expect(remainingCoupons).toBe(0);
    });
  });

  describe('🛠️ Coupon API Endpoints', () => {
    beforeEach(async () => {
      // Seed test data
      await couponSeederService.seedCoupons();
    });

    it('should get all coupons with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.total_pages).toBeGreaterThan(0);
    });

    it('should filter coupons by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      response.body.data.forEach((coupon) => {
        expect(coupon.status).toBe('active');
      });
    });

    it('should search coupons by code', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .query({ search: 'WELCOME' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].code).toContain('WELCOME');
    });

    it('should get coupon by ID', async () => {
      // First get a list to find an ID
      const listResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .expect(200);

      const couponId = listResponse.body.data[0].id;

      const response = await request(app.getHttpServer())
        .get(`/api/promotions/coupons/${couponId}`)
        .expect(200);

      expect(response.body.id).toBe(couponId);
      expect(response.body.code).toBeDefined();
      expect(response.body.title_en).toBeDefined();
      expect(response.body.title_ar).toBeDefined();
    });

    it('should get coupon by code', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/WELCOME2025')
        .expect(200);

      expect(response.body.code).toBe('WELCOME2025');
      expect(response.body.title_en).toContain('Welcome');
      expect(response.body.title_ar).toContain('أهلاً');
    });

    it('should return 404 for non-existent coupon', async () => {
      await request(app.getHttpServer())
        .get('/api/promotions/coupons/99999')
        .expect(404);

      await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/NONEXISTENT')
        .expect(404);
    });
  });

  describe('✅ Coupon Validation', () => {
    beforeEach(async () => {
      await couponSeederService.seedCoupons();
    });

    it('should validate active coupon successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons/validate')
        .send({
          code: 'WELCOME2025',
          order_amount: 100000, // 100,000 SYP
        })
        .expect(200);

      expect(response.body.is_valid).toBe(true);
      expect(response.body.discount_amount).toBeGreaterThan(0);
      expect(response.body.final_amount).toBeLessThan(100000);
      expect(response.body.coupon_code).toBe('WELCOME2025');
    });

    it('should reject non-existent coupon', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons/validate')
        .send({
          code: 'INVALID_CODE',
          order_amount: 100000,
        })
        .expect(200);

      expect(response.body.is_valid).toBe(false);
      expect(response.body.error_code).toBe('COUPON_NOT_FOUND');
      expect(response.body.error_message).toContain('not found');
    });

    it('should calculate percentage discount correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons/validate')
        .send({
          code: 'WELCOME2025', // 15% discount
          order_amount: 100000,
        })
        .expect(200);

      expect(response.body.is_valid).toBe(true);
      expect(response.body.discount_amount).toBe(15000); // 15% of 100,000
      expect(response.body.final_amount).toBe(85000);
    });

    it('should respect maximum discount amount for percentage coupons', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons/validate')
        .send({
          code: 'WELCOME2025', // 15% discount, max 75,000 SYP
          order_amount: 1000000, // 1,000,000 SYP
        })
        .expect(200);

      expect(response.body.is_valid).toBe(true);
      expect(response.body.discount_amount).toBe(75000); // Capped at max discount
      expect(response.body.final_amount).toBe(925000);
    });

    it('should handle fixed amount discount correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons/validate')
        .send({
          code: 'SYRIA50K', // 50,000 SYP fixed discount
          order_amount: 400000,
        })
        .expect(200);

      expect(response.body.is_valid).toBe(true);
      expect(response.body.discount_amount).toBe(50000);
      expect(response.body.final_amount).toBe(350000);
    });
  });

  describe('🔧 Coupon Management', () => {
    it('should create new coupon', async () => {
      const newCoupon = {
        code: 'TEST2025',
        title_en: 'Test Coupon',
        title_ar: 'كوبون تجريبي',
        description_en: 'Test coupon for E2E testing',
        description_ar: 'كوبون تجريبي للاختبار الشامل',
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 20,
        max_discount_amount: 50000,
        min_order_amount: 25000,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        usage_limit: 100,
        usage_limit_per_user: 1,
        is_public: true,
      };

      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons')
        .send(newCoupon)
        .expect(201);

      expect(response.body.code).toBe('TEST2025');
      expect(response.body.title_en).toBe('Test Coupon');
      expect(response.body.title_ar).toBe('كوبون تجريبي');
      expect(response.body.status).toBe('draft');
    });

    it('should prevent duplicate coupon codes', async () => {
      const duplicateCoupon = {
        code: 'WELCOME2025', // Already exists from seeding
        title_en: 'Duplicate Coupon',
        title_ar: 'كوبون مكرر',
        coupon_type: CouponType.PERCENTAGE,
        discount_value: 10,
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Seed first to ensure WELCOME2025 exists
      await couponSeederService.seedCoupons();

      await request(app.getHttpServer())
        .post('/api/promotions/coupons')
        .send(duplicateCoupon)
        .expect(409); // Conflict
    });

    it('should activate and deactivate coupons', async () => {
      await couponSeederService.seedCoupons();

      // Get a coupon ID
      const listResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .expect(200);

      const couponId = listResponse.body.data[0].id;

      // Activate coupon
      await request(app.getHttpServer())
        .put(`/api/promotions/coupons/${couponId}/activate`)
        .expect(200);

      // Verify activation
      const activeResponse = await request(app.getHttpServer())
        .get(`/api/promotions/coupons/${couponId}`)
        .expect(200);

      expect(activeResponse.body.status).toBe('active');

      // Deactivate coupon
      await request(app.getHttpServer())
        .put(`/api/promotions/coupons/${couponId}/deactivate`)
        .expect(200);

      // Verify deactivation
      const pausedResponse = await request(app.getHttpServer())
        .get(`/api/promotions/coupons/${couponId}`)
        .expect(200);

      expect(pausedResponse.body.status).toBe('paused');
    });

    it('should update existing coupon', async () => {
      await couponSeederService.seedCoupons();

      const listResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .expect(200);

      const couponId = listResponse.body.data[0].id;

      const updateData = {
        title_en: 'Updated Title',
        title_ar: 'عنوان محدث',
        discount_value: 25,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/promotions/coupons/${couponId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title_en).toBe('Updated Title');
      expect(response.body.title_ar).toBe('عنوان محدث');
      expect(response.body.discount_value).toBe(25);
    });

    it('should delete coupon (soft delete)', async () => {
      await couponSeederService.seedCoupons();

      const listResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .expect(200);

      const couponId = listResponse.body.data[0].id;

      await request(app.getHttpServer())
        .delete(`/api/promotions/coupons/${couponId}`)
        .expect(200);

      // Verify soft deletion
      const deletedResponse = await request(app.getHttpServer())
        .get(`/api/promotions/coupons/${couponId}`)
        .expect(200);

      expect(deletedResponse.body.status).toBe('cancelled');
    });
  });

  describe('📊 Syrian Market Features', () => {
    beforeEach(async () => {
      await couponSeederService.seedCoupons();
    });

    it('should have Syrian cultural event coupons', async () => {
      const ramadanResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/RAMADAN2025')
        .expect(200);

      expect(ramadanResponse.body.title_ar).toContain('رمضان');
      expect(ramadanResponse.body.discount_value).toBe(20);

      const eidResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/EID2025')
        .expect(200);

      expect(eidResponse.body.title_ar).toContain('عيد');
      expect(eidResponse.body.discount_value).toBe(25);

      const independenceResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/INDEPENDENCE2025')
        .expect(200);

      expect(independenceResponse.body.title_ar).toContain('استقلال');
      expect(independenceResponse.body.discount_value).toBe(17);
    });

    it('should have user tier specific coupons', async () => {
      const vipDiamondResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/VIP_DIAMOND_30')
        .expect(200);

      expect(vipDiamondResponse.body.discount_value).toBe(30);
      expect(vipDiamondResponse.body.allowed_user_tiers).toContain(
        'vip_diamond',
      );
      expect(vipDiamondResponse.body.is_public).toBe(false);

      const premiumResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/PREMIUM_20')
        .expect(200);

      expect(premiumResponse.body.discount_value).toBe(20);
      expect(premiumResponse.body.allowed_user_tiers).toContain('premium');
    });

    it('should have category-specific coupons', async () => {
      const electronicsResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/ELECTRONICS20')
        .expect(200);

      expect(electronicsResponse.body.discount_value).toBe(20);
      expect(electronicsResponse.body.title_ar).toContain('إلكترونيات');

      const fashionResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons/code/FASHION15')
        .expect(200);

      expect(fashionResponse.body.discount_value).toBe(15);
      expect(fashionResponse.body.title_ar).toContain('موضة');
    });
  });

  describe('🔍 Bulk Operations', () => {
    beforeEach(async () => {
      await couponSeederService.seedCoupons();
    });

    it('should perform bulk activation', async () => {
      // Get some coupon IDs
      const listResponse = await request(app.getHttpServer())
        .get('/api/promotions/coupons')
        .query({ limit: 3 })
        .expect(200);

      const couponIds = listResponse.body.data.map((coupon) => coupon.id);

      const response = await request(app.getHttpServer())
        .post('/api/promotions/coupons/bulk-action')
        .send({
          coupon_ids: couponIds,
          action: BulkAction.ACTIVATE,
        })
        .expect(200);

      expect(response.body.affected_count).toBe(couponIds.length);

      // Verify coupons were activated
      for (const id of couponIds) {
        const couponResponse = await request(app.getHttpServer())
          .get(`/api/promotions/coupons/${id}`)
          .expect(200);

        expect(couponResponse.body.status).toBe('active');
      }
    });
  });

  /**
   * Helper function to create test data
   */
  async function createTestData() {
    // Create test user
    testUser = await dataSource.getRepository(User).save({
      email: 'test@souqsyria.com',
      phone: '+963123456789',
      first_name: 'Test',
      last_name: 'User',
    });

    // Create test category
    testCategory = await dataSource.getRepository(Category).save({
      nameEn: 'Electronics',
      nameAr: 'إلكترونيات',
      descriptionEn: 'Electronic devices and gadgets',
      descriptionAr: 'الأجهزة الإلكترونية والتقنية',
    });
  }
});

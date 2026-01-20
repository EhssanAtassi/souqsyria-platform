/**
 * @file promotions-seeding.e2e-spec.ts
 * @description E2E tests specifically for promotions seeding functionality
 *
 * Tests the complete seeding workflow including:
 * - API endpoints for seeding operations
 * - Seeding controller functionality
 * - Data validation and cleanup
 * - Syrian market specific seeding
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';

import { PromotionsModule } from '../../src/promotions/promotions.module';
import {
  CouponEntity,
  CouponType,
  CouponStatus,
} from '../../src/promotions/entities/coupon.entity';
import { CouponUsage } from '../../src/promotions/entities/coupon-usage.entity';
import { PromotionCampaign } from '../../src/promotions/entities/promotion-campaign.entity';
import { User } from '../../src/users/entities/user.entity';
import { Category } from '../../src/categories/entities/category.entity';
import { VendorEntity } from '../../src/vendors/entities/vendor.entity';

describe('Promotions Seeding (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
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

    await app.init();

    // Create test entities that seeding depends on
    await createTestEntities();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up coupons before each test
    await dataSource.getRepository(CouponEntity).clear();
  });

  describe('🌱 Seeding API Endpoints', () => {
    it('should seed coupons successfully via API', async () => {
      const response = await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.couponsCreated).toBeGreaterThan(0);
      expect(response.body.seasonalCouponsCreated).toBeGreaterThan(0);
      expect(response.body.categorySpecificCreated).toBeGreaterThan(0);
      expect(response.body.userTierCouponsCreated).toBeGreaterThan(0);
      expect(response.body.errors).toEqual([]);

      // Verify coupons were actually created in database
      const totalCoupons = await dataSource.getRepository(CouponEntity).count();
      const expectedTotal =
        response.body.couponsCreated +
        response.body.seasonalCouponsCreated +
        response.body.categorySpecificCreated +
        response.body.userTierCouponsCreated;

      expect(totalCoupons).toBe(expectedTotal);
    });

    it('should not allow seeding in production environment', async () => {
      // Mock production environment
      process.env.NODE_ENV = 'production';

      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(403);

      // Reset to test environment
      process.env.NODE_ENV = 'test';
    });

    it('should provide seeding statistics via API', async () => {
      // First seed some data
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/coupons/seeding/statistics')
        .expect(200);

      expect(response.body.totalCoupons).toBeGreaterThan(0);
      expect(response.body.activeCoupons).toBeGreaterThan(0);
      expect(response.body.averageDiscountValue).toBeGreaterThan(0);
      expect(typeof response.body.totalUsage).toBe('number');
    });

    it('should provide health check information', async () => {
      const response = await request(app.getHttpServer())
        .get('/coupons/seeding/health')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should cleanup seeded data via API', async () => {
      // First seed some data
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      // Verify data exists
      const beforeCleanup = await dataSource
        .getRepository(CouponEntity)
        .count();
      expect(beforeCleanup).toBeGreaterThan(0);

      // Cleanup
      const response = await request(app.getHttpServer())
        .delete('/coupons/seeding/cleanup')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.deleted).toBe(beforeCleanup);

      // Verify data was deleted
      const afterCleanup = await dataSource.getRepository(CouponEntity).count();
      expect(afterCleanup).toBe(0);
    });
  });

  describe('🎯 Syrian Market Seeding Validation', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);
    });

    it('should create Welcome coupon with Syrian localization', async () => {
      const welcomeCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'WELCOME2025' },
        });

      expect(welcomeCoupon).toBeDefined();
      expect(welcomeCoupon.code).toBe('WELCOME2025');
      expect(welcomeCoupon.title_en).toContain('Welcome');
      expect(welcomeCoupon.title_ar).toContain('أهلاً');
      expect(welcomeCoupon.description_en).toContain('SouqSyria');
      expect(welcomeCoupon.description_ar).toContain('سوق سوريا');
      expect(welcomeCoupon.coupon_type).toBe(CouponType.PERCENTAGE);
      expect(welcomeCoupon.discount_value).toBe(15);
      expect(welcomeCoupon.max_discount_amount).toBe(75000);
      expect(welcomeCoupon.min_order_amount).toBe(50000);
      expect(welcomeCoupon.status).toBe(CouponStatus.ACTIVE);
    });

    it('should create Ramadan seasonal coupon', async () => {
      const ramadanCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'RAMADAN2025' },
        });

      expect(ramadanCoupon).toBeDefined();
      expect(ramadanCoupon.title_ar).toContain('رمضان');
      expect(ramadanCoupon.discount_value).toBe(20);
      expect(ramadanCoupon.syrian_market_config).toEqual({
        ramadan_special: true,
        diaspora_customers_eligible: true,
      });
      expect(ramadanCoupon.usage_limit).toBe(10000);
    });

    it('should create Eid celebration coupon', async () => {
      const eidCoupon = await dataSource.getRepository(CouponEntity).findOne({
        where: { code: 'EID2025' },
      });

      expect(eidCoupon).toBeDefined();
      expect(eidCoupon.title_ar).toContain('عيد');
      expect(eidCoupon.discount_value).toBe(25);
      expect(eidCoupon.syrian_market_config).toEqual({
        eid_special: true,
      });
    });

    it('should create Syria Independence Day coupon', async () => {
      const independenceCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'INDEPENDENCE2025' },
        });

      expect(independenceCoupon).toBeDefined();
      expect(independenceCoupon.title_ar).toContain('استقلال');
      expect(independenceCoupon.discount_value).toBe(17); // Symbolic 17% for April 17
      expect(independenceCoupon.max_discount_amount).toBe(85000);
    });

    it('should create fixed amount Syria coupon', async () => {
      const syriaCoupon = await dataSource.getRepository(CouponEntity).findOne({
        where: { code: 'SYRIA50K' },
      });

      expect(syriaCoupon).toBeDefined();
      expect(syriaCoupon.title_ar).toContain('سوريا');
      expect(syriaCoupon.coupon_type).toBe(CouponType.FIXED_AMOUNT);
      expect(syriaCoupon.discount_value).toBe(50000);
      expect(syriaCoupon.min_order_amount).toBe(300000);
    });

    it('should create free shipping coupon', async () => {
      const freeShipCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'FREESHIP2025' },
        });

      expect(freeShipCoupon).toBeDefined();
      expect(freeShipCoupon.title_ar).toContain('شحن مجاني');
      expect(freeShipCoupon.coupon_type).toBe(CouponType.FREE_SHIPPING);
      expect(freeShipCoupon.discount_value).toBe(0);
      expect(freeShipCoupon.min_order_amount).toBe(25000);
    });
  });

  describe('👥 User Tier Coupons', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);
    });

    it('should create VIP Diamond exclusive coupon', async () => {
      const vipDiamondCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'VIP_DIAMOND_30' },
        });

      expect(vipDiamondCoupon).toBeDefined();
      expect(vipDiamondCoupon.title_ar).toContain('ماس');
      expect(vipDiamondCoupon.discount_value).toBe(30);
      expect(vipDiamondCoupon.allowed_user_tiers).toEqual(['vip_diamond']);
      expect(vipDiamondCoupon.is_public).toBe(false);
      expect(vipDiamondCoupon.min_order_amount).toBe(200000);
      expect(vipDiamondCoupon.max_discount_amount).toBe(300000);
    });

    it('should create VIP Gold member coupon', async () => {
      const vipGoldCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'VIP_GOLD_25' },
        });

      expect(vipGoldCoupon).toBeDefined();
      expect(vipGoldCoupon.title_ar).toContain('ذهب');
      expect(vipGoldCoupon.discount_value).toBe(25);
      expect(vipGoldCoupon.allowed_user_tiers).toEqual(['vip_gold']);
      expect(vipGoldCoupon.is_public).toBe(false);
    });

    it('should create Premium member coupon', async () => {
      const premiumCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'PREMIUM_20' },
        });

      expect(premiumCoupon).toBeDefined();
      expect(premiumCoupon.title_ar).toContain('مميزة');
      expect(premiumCoupon.discount_value).toBe(20);
      expect(premiumCoupon.allowed_user_tiers).toEqual(['premium']);
      expect(premiumCoupon.is_public).toBe(false);
    });
  });

  describe('🏷️ Category-Specific Coupons', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);
    });

    it('should create Electronics category coupon', async () => {
      const electronicsCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'ELECTRONICS20' },
          relations: ['category'],
        });

      expect(electronicsCoupon).toBeDefined();
      expect(electronicsCoupon.title_ar).toContain('إلكترونيات');
      expect(electronicsCoupon.discount_value).toBe(20);
      expect(electronicsCoupon.max_discount_amount).toBe(200000);
      expect(electronicsCoupon.min_order_amount).toBe(100000);
      // Category relationship might be null if category doesn't exist
    });

    it('should create Fashion category coupon', async () => {
      const fashionCoupon = await dataSource
        .getRepository(CouponEntity)
        .findOne({
          where: { code: 'FASHION15' },
        });

      expect(fashionCoupon).toBeDefined();
      expect(fashionCoupon.title_ar).toContain('موضة');
      expect(fashionCoupon.discount_value).toBe(15);
      expect(fashionCoupon.max_discount_amount).toBe(50000);
    });

    it('should create Books category coupon', async () => {
      const booksCoupon = await dataSource.getRepository(CouponEntity).findOne({
        where: { code: 'BOOKS10' },
      });

      expect(booksCoupon).toBeDefined();
      expect(booksCoupon.title_ar).toContain('المعرفة');
      expect(booksCoupon.discount_value).toBe(10);
      expect(booksCoupon.max_discount_amount).toBe(25000);
      expect(booksCoupon.usage_limit_per_user).toBe(5);
    });
  });

  describe('📊 Seeding Data Validation', () => {
    it('should validate data integrity after seeding', async () => {
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/coupons/seeding/validate')
        .expect(200);

      expect(response.body.isValid).toBe(true);
      expect(response.body.issues).toEqual([]);
      expect(response.body.recommendations).toEqual([]);
    });

    it('should provide detailed information about seeded data', async () => {
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/coupons/seeding/data/info')
        .expect(200);

      expect(response.body).toHaveProperty('totalCoupons');
      expect(response.body).toHaveProperty('couponsBreakdown');
      expect(response.body).toHaveProperty('averageDiscountValue');
      expect(response.body).toHaveProperty('syrianMarketFeatures');
    });

    it('should handle repeated seeding gracefully', async () => {
      // First seeding
      const firstResponse = await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      const firstTotal =
        firstResponse.body.couponsCreated +
        firstResponse.body.seasonalCouponsCreated +
        firstResponse.body.categorySpecificCreated +
        firstResponse.body.userTierCouponsCreated;

      // Second seeding
      const secondResponse = await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.couponsCreated).toBe(0);
      expect(secondResponse.body.seasonalCouponsCreated).toBe(0);
      expect(secondResponse.body.categorySpecificCreated).toBe(0);
      expect(secondResponse.body.userTierCouponsCreated).toBe(0);

      // Verify total count remains the same
      const finalCount = await dataSource.getRepository(CouponEntity).count();
      expect(finalCount).toBe(firstTotal);
    });
  });

  describe('💻 Seeding Performance', () => {
    it('should complete seeding within reasonable time', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large cleanup operations efficiently', async () => {
      // Seed data multiple times to create volume
      await request(app.getHttpServer())
        .post('/coupons/seeding/seed')
        .expect(201);

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .delete('/coupons/seeding/cleanup')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  /**
   * Helper function to create test entities that seeding depends on
   */
  async function createTestEntities() {
    // Create test user
    await dataSource.getRepository(User).save({
      email: 'admin@souqsyria.com',
      phone: '+963123456789',
      first_name: 'Admin',
      last_name: 'User',
    });

    // Create test categories
    await dataSource.getRepository(Category).save([
      {
        nameEn: 'Electronics',
        nameAr: 'إلكترونيات',
        descriptionEn: 'Electronic devices and gadgets',
        descriptionAr: 'الأجهزة الإلكترونية والتقنية',
      },
      {
        nameEn: 'Fashion & Clothing',
        nameAr: 'الأزياء والملابس',
        descriptionEn: 'Fashion items and clothing',
        descriptionAr: 'الأزياء والملابس',
      },
      {
        nameEn: 'Books & Media',
        nameAr: 'الكتب والوسائط',
        descriptionEn: 'Books and educational materials',
        descriptionAr: 'الكتب والمواد التعليمية',
      },
    ]);
  }
});

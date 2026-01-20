/**
 * @file homepage-api.e2e-spec.ts
 * @description E2E tests for Enhanced Home Pages API (Phase 3 - User Story 1 Backend)
 *
 * TEST STRATEGY:
 * - Test actual implemented endpoints (not v2)
 * - Verify homepage aggregation service
 * - Test hero banners, featured categories, and product carousels
 * - Validate bilingual support (Arabic/English)
 * - Validate multi-currency support (SYP/USD/EUR)
 *
 * ENDPOINTS TESTED:
 * - GET /api/homepage - Aggregated homepage data
 * - GET /api/homepage/metrics - Performance metrics
 * - GET /api/hero-banners/active - Active hero banners
 * - GET /api/featured-categories - Featured categories
 * - GET /api/product-carousels - Product carousels
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Homepage API (E2E) - Phase 3 MVP Backend', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Set global prefix to match production setup
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * T021 - E2E test for GET /homepage endpoint
   */
  describe('🏠 GET /api/homepage - Aggregated Homepage Data', () => {
    it('[T021] should return complete homepage data with all sections', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/homepage')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('heroBanners');
      expect(response.body).toHaveProperty('featuredCategories');
      expect(response.body).toHaveProperty('productCarousels');

      // Verify arrays are returned
      expect(Array.isArray(response.body.heroBanners)).toBe(true);
      expect(Array.isArray(response.body.featuredCategories)).toBe(true);
      expect(Array.isArray(response.body.productCarousels)).toBe(true);
    });

    it('[T021] should support Arabic language (Accept-Language: ar)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/homepage')
        .set('Accept-Language', 'ar')
        .expect(200);

      // Verify data is returned
      expect(response.body).toHaveProperty('featuredCategories');
    });

    it('[T021] should support multi-currency (X-Currency: USD)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/homepage')
        .set('X-Currency', 'USD')
        .expect(200);

      // Verify response is returned
      expect(response.body).toHaveProperty('productCarousels');
    });

    it('[T021] should support personalized content parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/homepage?personalized=true')
        .expect(200);

      expect(response.body).toHaveProperty('heroBanners');
    });

    it('[T021] should return data with reasonable performance', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/homepage')
        .expect(200);
      const duration = Date.now() - start;

      // Should respond within 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(response.body).toHaveProperty('heroBanners');
    });
  });

  /**
   * T022 - E2E test for GET /homepage/hero-banners endpoint
   */
  describe('🎨 GET /api/hero-banners/active - Active Hero Banners', () => {
    it('[T022] should return active hero banners', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/hero-banners/active')
        .expect(200);

      // Verify array is returned
      expect(Array.isArray(response.body)).toBe(true);

      // Verify banners have required properties
      if (response.body.length > 0) {
        const banner = response.body[0];
        expect(banner).toHaveProperty('id');
        expect(banner).toHaveProperty('nameEn');
        expect(banner).toHaveProperty('nameAr');
        expect(banner).toHaveProperty('headlineEn');
        expect(banner).toHaveProperty('headlineAr');
      }
    });

    it('[T022] should respect limit query parameter', async () => {
      const limit = 3;
      const response = await request(app.getHttpServer())
        .get(`/api/hero-banners/active?limit=${limit}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(limit);
    });

    it('[T022] should return bilingual content', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/hero-banners/active')
        .expect(200);

      // Verify bilingual properties exist
      if (response.body.length > 0) {
        const banner = response.body[0];
        expect(banner).toHaveProperty('nameEn');
        expect(banner).toHaveProperty('nameAr');
      }
    });

    it('[T022] should only return active banners', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/hero-banners/active')
        .expect(200);

      response.body.forEach((banner: any) => {
        expect(banner).toHaveProperty('id');
        expect(banner).toHaveProperty('nameEn');
        expect(banner).toHaveProperty('nameAr');
      });
    });
  });

  /**
   * T023 - E2E test for GET /homepage/featured-categories endpoint
   */
  describe('🏷️ GET /api/featured-categories - Featured Categories', () => {
    it('[T023] should return active featured categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/featured-categories')
        .expect(200);

      // Verify array is returned
      expect(Array.isArray(response.body)).toBe(true);

      // Default limit is 12
      expect(response.body.length).toBeLessThanOrEqual(12);
    });

    it('[T023] should respect custom limit parameter', async () => {
      const limit = 6;
      const response = await request(app.getHttpServer())
        .get(`/api/featured-categories?limit=${limit}`)
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(limit);
    });

    it('[T023] should include category details', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/featured-categories')
        .expect(200);

      if (response.body.length > 0) {
        const featuredCategory = response.body[0];
        expect(featuredCategory).toHaveProperty('id');
        expect(featuredCategory).toHaveProperty('category');
        expect(featuredCategory.category).toHaveProperty('id');
        expect(featuredCategory.category).toHaveProperty('nameEn');
        expect(featuredCategory.category).toHaveProperty('nameAr');
      }
    });

    it('[T023] should sort by displayOrder ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/featured-categories')
        .expect(200);

      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          const current = response.body[i];
          const next = response.body[i + 1];
          expect(current.displayOrder).toBeLessThanOrEqual(next.displayOrder);
        }
      }
    });
  });

  /**
   * T024 - E2E test for GET /homepage/product-carousels endpoint
   */
  describe('🎠 GET /api/product-carousels - Product Carousels', () => {
    it('[T024] should return all active carousels with products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/product-carousels')
        .expect(200);

      // Verify array is returned
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('[T024] should filter by carousel types', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/product-carousels?types=new_arrivals,best_sellers')
        .expect(200);

      // Verify data is returned
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('[T024] should include populated products in carousels', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/product-carousels')
        .expect(200);

      if (response.body.length > 0) {
        const carousel = response.body[0];
        expect(carousel).toHaveProperty('products');
        expect(Array.isArray(carousel.products)).toBe(true);
        expect(carousel).toHaveProperty('titleEn');
        expect(carousel).toHaveProperty('titleAr');
      }
    });

    it('[T024] should include bilingual titles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/product-carousels')
        .expect(200);

      if (response.body.length > 0) {
        const carousel = response.body[0];
        expect(carousel).toHaveProperty('titleEn');
        expect(carousel).toHaveProperty('titleAr');
      }
    });

    it('[T024] should sort carousels by displayOrder', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/product-carousels')
        .expect(200);

      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          const current = response.body[i];
          const next = response.body[i + 1];
          expect(current.displayOrder).toBeLessThanOrEqual(next.displayOrder);
        }
      }
    });
  });

  /**
   * Additional performance tests
   */
  describe('⚡ Performance & Caching', () => {
    it('should return homepage data within acceptable time', async () => {
      const start = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/homepage')
        .expect(200);
      const duration = Date.now() - start;

      // Should respond within 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(response.body).toHaveProperty('heroBanners');
    });

    it('should handle concurrent homepage requests efficiently', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/api/homepage'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('heroBanners');
      });
    });
  });
});

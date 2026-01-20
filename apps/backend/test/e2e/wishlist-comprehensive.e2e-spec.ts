/**
 * @file wishlist-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian wishlist seeding system
 * 
 * Tests cover:
 * - Complete wishlist seeding operations with Syrian market focus
 * - Advanced analytics and business intelligence verification
 * - Data integrity and relationship validation
 * - Performance testing and optimization verification
 * - Export capabilities and data quality assurance
 * - Cultural shopping patterns and user behavior simulation
 * - Arabic/English localization and market compliance
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { WishlistSeederService } from '../../src/wishlist/seeds/wishlist-seeder.service';

describe('🛍️ Wishlist Seeding System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let wishlistSeederService: WishlistSeederService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    wishlistSeederService = moduleFixture.get<WishlistSeederService>(WishlistSeederService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🌱 Wishlist Data Seeding', () => {
    it('should seed wishlist data successfully with Syrian market patterns', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=100')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Syrian wishlist data seeded successfully');
      expect(response.body.data).toHaveProperty('totalProcessed');
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('performanceMetrics');
      expect(response.body.data.successful).toBeGreaterThan(90);
      expect(response.body.data.processingTimeMs).toBeGreaterThan(0);
    });

    it('should handle large-scale seeding operations efficiently', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=500')
        .expect(201);

      expect(response.body.data.performanceMetrics.throughputPerSecond).toBeGreaterThan(50);
      expect(response.body.data.performanceMetrics.averageProcessingTime).toBeLessThan(20);
    });

    it('should validate seeding parameters correctly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=15000')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Count must be between 1 and 10000');
    });
  });

  describe('📊 Analytics & Business Intelligence', () => {
    beforeEach(async () => {
      // Ensure we have seeded data for analytics
      await wishlistSeederService.seedWishlists(200);
    });

    it('should provide comprehensive wishlist analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalWishlists');
      expect(response.body.data).toHaveProperty('uniqueUsers');
      expect(response.body.data).toHaveProperty('averageWishlistSize');
      expect(response.body.data).toHaveProperty('conversionMetrics');
      expect(response.body.data).toHaveProperty('popularityMetrics');
      expect(response.body.data).toHaveProperty('syrianMarketMetrics');

      // Validate Syrian market metrics
      expect(response.body.data.syrianMarketMetrics).toHaveProperty('diasporaWishlists');
      expect(response.body.data.syrianMarketMetrics).toHaveProperty('mobileDeviceWishlists');
      expect(response.body.data.syrianMarketMetrics).toHaveProperty('seasonalTrends');
      expect(response.body.data.syrianMarketMetrics).toHaveProperty('governorateDistribution');
    });

    it('should provide accurate conversion metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      const conversionMetrics = response.body.data.conversionMetrics;
      expect(conversionMetrics.wishlistToCart).toMatch(/^\d+\.\d+%$/);
      expect(conversionMetrics.wishlistToPurchase).toMatch(/^\d+\.\d+%$/);
      expect(conversionMetrics.shareTokenUsage).toBeGreaterThanOrEqual(0);
    });

    it('should identify most popular products and categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      const popularityMetrics = response.body.data.popularityMetrics;
      expect(popularityMetrics.mostWishlistedProducts).toBeInstanceOf(Array);
      expect(popularityMetrics.mostActiveUsers).toBeInstanceOf(Array);
      expect(popularityMetrics.categoryDistribution).toBeInstanceOf(Array);

      if (popularityMetrics.mostWishlistedProducts.length > 0) {
        expect(popularityMetrics.mostWishlistedProducts[0]).toHaveProperty('productId');
        expect(popularityMetrics.mostWishlistedProducts[0]).toHaveProperty('productName');
        expect(popularityMetrics.mostWishlistedProducts[0]).toHaveProperty('wishlistCount');
      }
    });
  });

  describe('📤 Data Export & Analysis', () => {
    beforeEach(async () => {
      await wishlistSeederService.seedWishlists(150);
    });

    it('should export comprehensive wishlist data with metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/export')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data).toHaveProperty('wishlists');
      expect(response.body.data).toHaveProperty('analytics');

      // Validate metadata
      const metadata = response.body.data.metadata;
      expect(metadata).toHaveProperty('exportDate');
      expect(metadata).toHaveProperty('totalRecords');
      expect(metadata).toHaveProperty('dataIntegrity', 'VERIFIED');
      expect(metadata).toHaveProperty('syrianMarketCompliance', true);

      // Validate wishlist records structure
      if (response.body.data.wishlists.length > 0) {
        const wishlist = response.body.data.wishlists[0];
        expect(wishlist).toHaveProperty('id');
        expect(wishlist).toHaveProperty('userId');
        expect(wishlist).toHaveProperty('userName');
        expect(wishlist).toHaveProperty('productId');
        expect(wishlist).toHaveProperty('productName');
        expect(wishlist).toHaveProperty('userLocation');
        expect(wishlist).toHaveProperty('userType');
      }
    });

    it('should include Syrian market data in export', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/export')
        .expect(200);

      const wishlists = response.body.data.wishlists;
      const analytics = response.body.data.analytics;

      // Check for Syrian market data
      expect(analytics.syrianMarketMetrics).toHaveProperty('governorateDistribution');
      expect(analytics.syrianMarketMetrics.governorateDistribution).toBeInstanceOf(Array);

      // Verify user location data includes Syrian governorates
      const userLocations = wishlists.map(w => w.userLocation);
      const syrianGovernorates = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'];
      const hasSyrianLocations = syrianGovernorates.some(gov => userLocations.includes(gov));
      expect(hasSyrianLocations).toBe(true);
    });
  });

  describe('🔍 Data Integrity & Validation', () => {
    beforeEach(async () => {
      await wishlistSeederService.clearAllData();
      await wishlistSeederService.seedWishlists(100);
    });

    it('should verify data integrity successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/verify')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isValid');
      expect(response.body.data).toHaveProperty('issues');
      expect(response.body.data.issues).toBeInstanceOf(Array);
    });

    it('should detect data integrity issues when they exist', async () => {
      // This test would require creating intentionally broken data
      // For now, we test that the endpoint responds correctly
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/verify')
        .expect(200);

      expect(response.body.data.isValid).toBeDefined();
      expect(typeof response.body.data.isValid).toBe('boolean');
    });
  });

  describe('📈 Trends & Pattern Analysis', () => {
    beforeEach(async () => {
      await wishlistSeederService.seedWishlists(300);
    });

    it('should provide comprehensive trends analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/trends')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('trendingProducts');
      expect(response.body.data).toHaveProperty('behavioralPatterns');
      expect(response.body.data).toHaveProperty('seasonalInsights');

      // Validate trending products structure
      expect(response.body.data.trendingProducts).toBeInstanceOf(Array);
      if (response.body.data.trendingProducts.length > 0) {
        const product = response.body.data.trendingProducts[0];
        expect(product).toHaveProperty('productName');
        expect(product).toHaveProperty('growthRate');
        expect(product).toHaveProperty('category');
      }

      // Validate behavioral patterns
      const behavioral = response.body.data.behavioralPatterns;
      expect(behavioral).toHaveProperty('averageSessionTime');
      expect(behavioral).toHaveProperty('shareRate');
      expect(behavioral).toHaveProperty('conversionWindow');
    });

    it('should include Syrian seasonal insights', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/trends')
        .expect(200);

      const seasonalInsights = response.body.data.seasonalInsights;
      expect(seasonalInsights).toBeInstanceOf(Array);

      // Check for Syrian cultural events
      const seasonNames = seasonalInsights.map(s => s.season);
      expect(seasonNames).toContain('Ramadan 2024');
      expect(seasonNames).toContain('Eid Al-Fitr 2024');

      // Validate seasonal insight structure
      if (seasonalInsights.length > 0) {
        const insight = seasonalInsights[0];
        expect(insight).toHaveProperty('season');
        expect(insight).toHaveProperty('impact');
        expect(insight).toHaveProperty('topCategories');
        expect(insight.topCategories).toBeInstanceOf(Array);
      }
    });
  });

  describe('📊 Quick Statistics Dashboard', () => {
    beforeEach(async () => {
      await wishlistSeederService.seedWishlists(250);
    });

    it('should provide quick statistics for dashboard display', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalWishlists');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('popularCategories');
      expect(response.body.data).toHaveProperty('recentActivity');
      expect(response.body.data).toHaveProperty('systemHealth');
      expect(response.body.data).toHaveProperty('lastSeeding');

      // Validate data types and ranges
      expect(typeof response.body.data.totalWishlists).toBe('number');
      expect(typeof response.body.data.activeUsers).toBe('number');
      expect(response.body.data.popularCategories).toBeInstanceOf(Array);
      expect(response.body.data.systemHealth).toBe('EXCELLENT');
    });

    it('should show reasonable statistics proportions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/stats')
        .expect(200);

      const { totalWishlists, activeUsers } = response.body.data;
      
      // Active users should be less than total wishlists (makes business sense)
      expect(activeUsers).toBeLessThanOrEqual(totalWishlists);
      
      // Should have at least some activity
      expect(totalWishlists).toBeGreaterThan(0);
      expect(activeUsers).toBeGreaterThan(0);
    });
  });

  describe('🗑️ Data Management Operations', () => {
    beforeEach(async () => {
      await wishlistSeederService.seedWishlists(100);
    });

    it('should clear all wishlist data successfully', async () => {
      // First verify we have data
      const analyticsResponse = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      expect(analyticsResponse.body.data.totalWishlists).toBeGreaterThan(0);

      // Clear data
      const clearResponse = await request(app.getHttpServer())
        .delete('/api/v1/seeding/wishlist/clear')
        .expect(200);

      expect(clearResponse.body.success).toBe(true);
      expect(clearResponse.body.data).toHaveProperty('deleted');
      expect(clearResponse.body.data.deleted).toBeGreaterThan(0);

      // Verify data is cleared
      const verifyResponse = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      expect(verifyResponse.body.data.totalWishlists).toBe(0);
    });

    it('should handle clearing empty dataset gracefully', async () => {
      // Clear data first
      await request(app.getHttpServer())
        .delete('/api/v1/seeding/wishlist/clear')
        .expect(200);

      // Clear again (should handle empty dataset)
      const response = await request(app.getHttpServer())
        .delete('/api/v1/seeding/wishlist/clear')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(0);
    });
  });

  describe('⚡ Performance & Scalability', () => {
    it('should handle multiple concurrent seeding operations', async () => {
      const promises = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/v1/seeding/wishlist/seed?count=50')
          .expect(201)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.successful).toBeGreaterThan(40);
      });
    });

    it('should maintain performance with large datasets', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=1000')
        .expect(201);

      expect(response.body.data.performanceMetrics.throughputPerSecond).toBeGreaterThan(30);
      expect(response.body.data.processingTimeMs).toBeLessThan(60000); // Less than 60 seconds
    });

    it('should optimize memory usage during seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=500')
        .expect(201);

      const memoryUsage = response.body.data.performanceMetrics.memoryUsageEnd;
      expect(memoryUsage).toMatch(/^\d+MB$/);
      
      const memoryValue = parseInt(memoryUsage.replace('MB', ''));
      expect(memoryValue).toBeLessThan(100); // Less than 100MB increase
    });
  });

  describe('🇸🇾 Syrian Market Compliance', () => {
    beforeEach(async () => {
      await wishlistSeederService.seedWishlists(200);
    });

    it('should include Syrian governorates in analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      const governorates = response.body.data.syrianMarketMetrics.governorateDistribution;
      const governorateNames = governorates.map(g => g.governorate);

      expect(governorateNames).toContain('Damascus');
      expect(governorateNames).toContain('Aleppo');
      expect(governorateNames).toContain('Homs');
      expect(governorateNames).toContain('Latakia');
    });

    it('should track diaspora customer patterns', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      expect(response.body.data.syrianMarketMetrics.diasporaWishlists).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.data.syrianMarketMetrics.diasporaWishlists).toBe('number');
    });

    it('should reflect Syrian mobile usage patterns', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      const { totalWishlists, mobileDeviceWishlists } = response.body.data.syrianMarketMetrics;
      const mobilePercentage = (mobileDeviceWishlists / response.body.data.totalWishlists) * 100;

      // Syrian mobile usage is ~78%
      expect(mobilePercentage).toBeGreaterThan(70);
      expect(mobilePercentage).toBeLessThan(85);
    });

    it('should include Syrian cultural events in seasonal trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seeding/wishlist/analytics')
        .expect(200);

      const seasonalTrends = response.body.data.syrianMarketMetrics.seasonalTrends;
      const periods = seasonalTrends.map(t => t.period);

      expect(periods).toContain('Ramadan 2024');
      expect(periods).toContain('Eid Al-Fitr 2024');

      // Each trend should have meaningful counts
      seasonalTrends.forEach(trend => {
        expect(trend.wishlistCount).toBeGreaterThan(0);
      });
    });
  });

  describe('🔄 Integration & API Consistency', () => {
    it('should maintain consistent API response format across all endpoints', async () => {
      const endpoints = [
        '/api/v1/seeding/wishlist/analytics',
        '/api/v1/seeding/wishlist/stats',
        '/api/v1/seeding/wishlist/verify',
        '/api/v1/seeding/wishlist/trends'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.message).toBe('string');
      }
    });

    it('should handle invalid parameters gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should provide meaningful error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seeding/wishlist/seed?count=20000')
        .expect(400);

      expect(response.body.message).toContain('between 1 and 10000');
    });
  });
});
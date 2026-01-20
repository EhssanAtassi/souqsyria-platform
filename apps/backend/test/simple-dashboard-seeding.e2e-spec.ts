/**
 * @file simple-dashboard-seeding.e2e-spec.ts
 * @description Simple E2E test for Dashboard seeding functionality
 * 
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

// Dashboard Module
import { DashboardModule } from '../src/dashboard/dashboard.module';
import { DashboardSeederService } from '../src/dashboard/seeds/dashboard-seeder.service';

describe('Dashboard Seeding - Simple E2E Tests', () => {
  let app: INestApplication;
  let dashboardSeederService: DashboardSeederService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [DashboardModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dashboardSeederService = moduleRef.get<DashboardSeederService>(DashboardSeederService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🌱 Dashboard Seeding API', () => {
    it('should have dashboard seeding endpoints available', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/all')
        .send({
          marketOverview: true,
          businessIntelligence: true,
          realtimeMetrics: true,
          marketTrends: true,
          historicalData: true,
          kpiTargets: true,
          dashboardWidgets: true,
          exportTemplates: true,
        })
        .expect(201);

      // Validate response structure
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.message).toContain('✅ Dashboard and Analytics system seeded successfully');

      console.log('✅ Dashboard seeding API responded successfully');
      console.log('📊 Response:', response.body);
    });

    it('should handle market overview seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/market-overview')
        .expect(201);

      expect(response.body.message).toContain('✅ Syrian market overview data seeded successfully');
      expect(response.body.count).toBeGreaterThan(0);

      console.log('✅ Market overview seeding completed');
    });

    it('should handle business intelligence seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/business-intelligence')
        .expect(201);

      expect(response.body.message).toContain('✅ Business intelligence metrics seeded successfully');
      expect(response.body.count).toBeGreaterThan(0);

      console.log('✅ Business intelligence seeding completed');
    });

    it('should handle real-time metrics seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/realtime-metrics')
        .expect(201);

      expect(response.body.message).toContain('✅ Real-time metrics and alerts seeded successfully');
      expect(response.body.count).toBeGreaterThan(0);

      console.log('✅ Real-time metrics seeding completed');
    });

    it('should handle market trends seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/market-trends')
        .expect(201);

      expect(response.body.message).toContain('✅ Market trends analysis seeded successfully');
      expect(response.body.count).toBeGreaterThan(0);

      console.log('✅ Market trends seeding completed');
    });

    it('should handle historical data seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/historical-data')
        .expect(201);

      expect(response.body.message).toContain('✅ Historical analytics data seeded successfully');
      expect(response.body.count).toBeGreaterThan(0);

      console.log('✅ Historical data seeding completed');
    });

    it('should handle bulk seeding', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/seed/dashboard/bulk')
        .send({ count: 100 })
        .expect(201);

      expect(response.body.message).toContain('Successfully seeded');
      expect(response.body.analyticsCreated).toBe(100);

      console.log('✅ Bulk seeding completed');
    });

    it('should retrieve seeding statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seed/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('overview');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('usage');
      expect(response.body).toHaveProperty('lastUpdated');

      console.log('✅ Seeding statistics retrieved');
    });

    it('should verify data integrity', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/seed/dashboard/verify')
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('timestamp');

      console.log('✅ Data integrity verification completed');
    });

    it('should clear all dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/seed/dashboard/clear')
        .expect(200);

      expect(response.body.message).toContain('✅ All Dashboard analytics data has been permanently cleared');
      expect(response.body.warning).toContain('⚠️ This operation cannot be undone');

      console.log('✅ Dashboard data clearing completed');
    });
  });

  describe('🧪 Service Unit Tests', () => {
    it('should have dashboard seeder service available', () => {
      expect(dashboardSeederService).toBeDefined();
      expect(dashboardSeederService).toBeInstanceOf(DashboardSeederService);
    });

    it('should execute seeding operations', async () => {
      const result = await dashboardSeederService.seedAll({
        marketOverview: true,
        businessIntelligence: false,
        realtimeMetrics: false,
        marketTrends: false,
        historicalData: false,
        kpiTargets: false,
        dashboardWidgets: false,
        exportTemplates: false,
      });

      expect(result).toHaveProperty('marketDataCreated');
      expect(result).toHaveProperty('intelligenceMetricsCreated');
      expect(result).toHaveProperty('totalExecutionTime');
      expect(result).toHaveProperty('errors');

      expect(result.marketDataCreated).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      console.log('✅ Service seeding operation completed');
      console.log('📊 Result:', result);
    });

    it('should retrieve seeding statistics', async () => {
      const stats = await dashboardSeederService.getSeedingStats();

      expect(stats).toHaveProperty('overview');
      expect(stats).toHaveProperty('performance');
      expect(stats).toHaveProperty('usage');
      expect(stats).toHaveProperty('lastUpdated');

      console.log('✅ Service statistics retrieved');
    });

    it('should verify data integrity', async () => {
      const result = await dashboardSeederService.verifyDataIntegrity();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('summary');

      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.issues)).toBeTruthy();

      console.log('✅ Service data integrity verification completed');
    });
  });
});
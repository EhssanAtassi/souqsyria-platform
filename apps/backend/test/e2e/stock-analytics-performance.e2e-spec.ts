/**
 * @file stock-analytics-performance.e2e-spec.ts
 * @description Stock Analytics and Performance E2E Tests
 *
 * Tests comprehensive stock analytics and performance including:
 * - Syrian stock analytics across governorates
 * - Multi-warehouse performance metrics
 * - Stock optimization algorithms
 * - Real-time analytics dashboard
 * - Performance monitoring and reporting
 * - Scalability under load
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { ProductStockEntity } from '../../src/stock/entities/product-stock.entity';
import { StockMovementEntity } from '../../src/stock/entities/stock-movement.entity';
import { StockAlertEntity } from '../../src/stock/entities/stock-alert.entity';
import { SyrianStockAnalyticsEntity } from '../../src/stock/entities/syrian-stock-analytics.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';
import { Warehouse } from '../../src/warehouses/entities/warehouse.entity';

describe('Stock Analytics & Performance (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let testAdmin: any;
  let testProduct: any;
  let testVariant: any;
  let secondVariant: any;
  let damascusWarehouse: any;
  let aleppoWarehouse: any;
  let latakiaWarehouse: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            ProductStockEntity,
            StockMovementEntity,
            StockAlertEntity,
            SyrianStockAnalyticsEntity,
            ProductVariant,
            ProductEntity,
            User,
            Warehouse,
          ],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test data
    await createTestData();
    await seedAnalyticsData();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Creates test users, products, warehouses, and authentication tokens
   */
  async function createTestData() {
    // Create test admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'analytics@souqsyria.com',
        password: 'AdminPassword123!',
        first_name: 'محلل',
        last_name: 'المخزون',
        phone: '+963987654321',
        role_id: 1, // Admin role
      });

    testAdmin = adminResponse.body.user;
    adminToken = adminResponse.body.access_token;

    // Create Damascus warehouse
    const damascusResponse = await request(app.getHttpServer())
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Damascus Analytics Hub',
        name_ar: 'مركز تحليل دمشق',
        address: 'Damascus Technology Park, Syria',
        city: 'Damascus',
        governorate: 'Damascus',
        latitude: 33.5138,
        longitude: 36.2765,
        capacity: 15000,
        manager_name: 'أحمد المحلل',
        contact_phone: '+963987654321',
      });

    damascusWarehouse = damascusResponse.body.warehouse;

    // Create Aleppo warehouse
    const aleppoResponse = await request(app.getHttpServer())
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Aleppo Performance Center',
        name_ar: 'مركز الأداء - حلب',
        address: 'Aleppo Innovation District, Syria',
        city: 'Aleppo',
        governorate: 'Aleppo',
        latitude: 36.2021,
        longitude: 37.1343,
        capacity: 10000,
        manager_name: 'فاطمة الأداء',
        contact_phone: '+963988123456',
      });

    aleppoWarehouse = aleppoResponse.body.warehouse;

    // Create Latakia warehouse
    const latakiaResponse = await request(app.getHttpServer())
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Latakia Coastal Analytics',
        name_ar: 'تحليلات اللاذقية الساحلية',
        address: 'Latakia Port Analytics Zone, Syria',
        city: 'Latakia',
        governorate: 'Latakia',
        latitude: 35.5197,
        longitude: 35.7919,
        capacity: 8000,
        manager_name: 'محمد التحليل',
        contact_phone: '+963985432109',
      });

    latakiaWarehouse = latakiaResponse.body.warehouse;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name_en: 'Analytics Test Device',
        name_ar: 'جهاز اختبار التحليلات',
        description_en: 'Device for testing stock analytics and performance',
        description_ar: 'جهاز لاختبار تحليلات وأداء المخزون',
        category_id: 1,
        vendor_id: 1,
        price: 2500000, // 2,500,000 SYP
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create first test variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'ANALYTICS-V1-2024',
        price: 2500000,
        stock_quantity: 0,
        attributes: {
          type: 'Standard',
          color: 'Blue',
          model: 'Analytics-Pro',
        },
      });

    testVariant = variantResponse.body.variant;

    // Create second test variant
    const secondVariantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'ANALYTICS-V2-2024',
        price: 3000000, // 3,000,000 SYP
        stock_quantity: 0,
        attributes: {
          type: 'Premium',
          color: 'Gold',
          model: 'Analytics-Elite',
        },
      });

    secondVariant = secondVariantResponse.body.variant;
  }

  /**
   * Seeds analytics data across warehouses
   */
  async function seedAnalyticsData() {
    // Add stock to Damascus warehouse
    await request(app.getHttpServer())
      .post('/admin/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 100,
        type: 'in',
        note: 'Initial analytics stock - Damascus مخزون تحليلي أولي',
      });

    // Add stock to Aleppo warehouse
    await request(app.getHttpServer())
      .post('/admin/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variant_id: testVariant.id,
        warehouse_id: aleppoWarehouse.id,
        quantity: 75,
        type: 'in',
        note: 'Initial analytics stock - Aleppo مخزون تحليلي أولي',
      });

    // Add stock to Latakia warehouse
    await request(app.getHttpServer())
      .post('/admin/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variant_id: testVariant.id,
        warehouse_id: latakiaWarehouse.id,
        quantity: 50,
        type: 'in',
        note: 'Initial analytics stock - Latakia مخزون تحليلي أولي',
      });

    // Add second variant stock
    await request(app.getHttpServer())
      .post('/admin/stock/adjust')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variant_id: secondVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 60,
        type: 'in',
        note: 'Premium variant stock - Damascus مخزون متميز',
      });

    // Create some movements for analytics
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: testVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 5,
          type: 'out',
          note: `Customer order ${i + 1} طلب عميل`,
        });
    }

    // Transfer some stock for movement analytics
    await request(app.getHttpServer())
      .post('/admin/stock/transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        variant_id: testVariant.id,
        from_warehouse_id: damascusWarehouse.id,
        to_warehouse_id: latakiaWarehouse.id,
        quantity: 10,
        note: 'Analytics transfer test نقل تحليلي تجريبي',
      });
  }

  describe('📊 Syrian Stock Analytics Dashboard', () => {
    it('should get comprehensive stock analytics across Syrian governorates', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/syrian-overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalStockValue');
      expect(response.body).toHaveProperty('governorateBreakdown');
      expect(response.body).toHaveProperty('warehousePerformance');
      expect(response.body).toHaveProperty('inventoryTurnover');
      expect(response.body).toHaveProperty('stockDistribution');

      // Verify governorate breakdown includes major Syrian cities
      expect(response.body.governorateBreakdown).toBeInstanceOf(Array);
      const governorates = response.body.governorateBreakdown.map(
        (g: any) => g.governorate,
      );
      expect(governorates).toContain('Damascus');
      expect(governorates).toContain('Aleppo');
      expect(governorates).toContain('Latakia');

      // Verify stock values are in SYP
      expect(response.body.totalStockValue).toBeGreaterThan(100000); // At least 100k SYP
    });

    it('should get stock analytics filtered by governorate', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/syrian-overview?governorate=Damascus')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.governorateBreakdown).toBeInstanceOf(Array);
      const damascusData = response.body.governorateBreakdown.find(
        (g: any) => g.governorate === 'Damascus',
      );
      expect(damascusData).toBeDefined();
      expect(damascusData.totalQuantity).toBeGreaterThan(0);
      expect(damascusData.totalValue).toBeGreaterThan(0);
    });

    it('should get warehouse performance metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/warehouse-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('warehouses');
      expect(response.body.warehouses).toBeInstanceOf(Array);

      response.body.warehouses.forEach((warehouse: any) => {
        expect(warehouse).toHaveProperty('warehouseId');
        expect(warehouse).toHaveProperty('warehouseName');
        expect(warehouse).toHaveProperty('governorate');
        expect(warehouse).toHaveProperty('stockUtilization');
        expect(warehouse).toHaveProperty('averageProcessingTime');
        expect(warehouse).toHaveProperty('accuracyScore');
        expect(warehouse).toHaveProperty('totalValue');

        // Verify metrics are realistic
        expect(warehouse.stockUtilization).toBeGreaterThanOrEqual(0);
        expect(warehouse.stockUtilization).toBeLessThanOrEqual(100);
        expect(warehouse.accuracyScore).toBeGreaterThanOrEqual(0);
        expect(warehouse.accuracyScore).toBeLessThanOrEqual(100);
      });
    });

    it('should provide stock turnover analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/turnover-analysis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('averageTurnoverRate');
      expect(response.body).toHaveProperty('topPerformingVariants');
      expect(response.body).toHaveProperty('slowMovingStock');
      expect(response.body).toHaveProperty('recommendedActions');

      expect(response.body.topPerformingVariants).toBeInstanceOf(Array);
      expect(response.body.slowMovingStock).toBeInstanceOf(Array);
      expect(response.body.recommendedActions).toBeInstanceOf(Array);
    });

    it('should generate demand forecasting analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/demand-forecast')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('forecastPeriod');
      expect(response.body).toHaveProperty('demandPredictions');
      expect(response.body).toHaveProperty('seasonalFactors');
      expect(response.body).toHaveProperty('confidenceLevel');

      expect(response.body.demandPredictions).toBeInstanceOf(Array);
      expect(response.body.seasonalFactors).toHaveProperty('ramadanBoost');
      expect(response.body.seasonalFactors).toHaveProperty('warImpact');
      expect(response.body.seasonalFactors).toHaveProperty('diasporaInfluence');
    });

    it('should provide stock optimization recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/optimization-recommendations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('redistributionSuggestions');
      expect(response.body).toHaveProperty('reorderRecommendations');
      expect(response.body).toHaveProperty('overstockAlerts');
      expect(response.body).toHaveProperty('potentialSavings');

      expect(response.body.redistributionSuggestions).toBeInstanceOf(Array);
      expect(response.body.reorderRecommendations).toBeInstanceOf(Array);

      // Verify monetary amounts are in SYP
      if (response.body.potentialSavings > 0) {
        expect(response.body.potentialSavings).toBeGreaterThan(1000); // At least 1k SYP
      }
    });
  });

  describe('📈 Real-time Performance Metrics', () => {
    it('should provide real-time stock movements tracking', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/real-time-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('activeMovements');
      expect(response.body).toHaveProperty('hourlyActivity');
      expect(response.body).toHaveProperty('peakActivityPeriods');
      expect(response.body).toHaveProperty('movementsByType');

      expect(response.body.hourlyActivity).toBeInstanceOf(Array);
      expect(response.body.movementsByType).toHaveProperty('in');
      expect(response.body.movementsByType).toHaveProperty('out');
      expect(response.body.movementsByType).toHaveProperty('transfer');
    });

    it('should track inventory accuracy metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/inventory-accuracy')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('overallAccuracy');
      expect(response.body).toHaveProperty('warehouseAccuracy');
      expect(response.body).toHaveProperty('discrepancyAnalysis');
      expect(response.body).toHaveProperty('improvementSuggestions');

      expect(response.body.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(response.body.overallAccuracy).toBeLessThanOrEqual(100);
      expect(response.body.warehouseAccuracy).toBeInstanceOf(Array);
    });

    it('should monitor stock alert trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/alert-trends')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('alertFrequency');
      expect(response.body).toHaveProperty('alertTypes');
      expect(response.body).toHaveProperty('resolutionTimes');
      expect(response.body).toHaveProperty('preventiveMeasures');

      expect(response.body.alertTypes).toHaveProperty('low_stock');
      expect(response.body.alertTypes).toHaveProperty('critical_stock');
      expect(response.body.alertTypes).toHaveProperty('out_of_stock');
    });

    it('should provide cost analysis metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/cost-analysis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalInventoryValue');
      expect(response.body).toHaveProperty('carryingCosts');
      expect(response.body).toHaveProperty('warehouseCosts');
      expect(response.body).toHaveProperty('costPerUnit');
      expect(response.body).toHaveProperty('profitabilityMetrics');

      // Verify costs are in SYP
      expect(response.body.totalInventoryValue).toBeGreaterThan(0);
      expect(response.body.carryingCosts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('⚡ Performance Load Testing', () => {
    it('should handle concurrent analytics requests efficiently', async () => {
      const startTime = Date.now();

      const concurrentRequests = [
        request(app.getHttpServer())
          .get('/admin/stock/analytics/syrian-overview')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app.getHttpServer())
          .get('/admin/stock/analytics/warehouse-performance')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app.getHttpServer())
          .get('/admin/stock/analytics/turnover-analysis')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app.getHttpServer())
          .get('/admin/stock/analytics/demand-forecast')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app.getHttpServer())
          .get('/admin/stock/analytics/real-time-movements')
          .set('Authorization', `Bearer ${adminToken}`),
      ];

      const results = await Promise.all(concurrentRequests);
      const processingTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body).toBeDefined();
      });

      // Should complete within reasonable time (5 seconds for 5 concurrent requests)
      expect(processingTime).toBeLessThan(5000);
    });

    it('should handle rapid stock operations with real-time updates', async () => {
      const startTime = Date.now();

      // Perform rapid stock operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(
          request(app.getHttpServer())
            .post('/admin/stock/adjust')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              variant_id: testVariant.id,
              warehouse_id: damascusWarehouse.id,
              quantity: 1,
              type: i % 2 === 0 ? 'in' : 'out',
              note: `Rapid operation ${i + 1}`,
            }),
        );
      }

      const operationResults = await Promise.all(operations);
      const operationTime = Date.now() - startTime;

      // All operations should succeed
      operationResults.forEach((result) => {
        expect([200, 201]).toContain(result.status);
      });

      // Get analytics to verify updates
      const analyticsResponse = await request(app.getHttpServer())
        .get('/admin/stock/analytics/real-time-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(analyticsResponse.body.activeMovements).toBeGreaterThan(0);

      // Total time should be reasonable
      expect(operationTime).toBeLessThan(10000); // 10 seconds
    });

    it('should maintain performance with large datasets', async () => {
      // Create additional test data
      for (let i = 0; i < 20; i++) {
        await request(app.getHttpServer())
          .post('/admin/stock/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            variant_id: testVariant.id,
            warehouse_id: damascusWarehouse.id,
            quantity: Math.floor(Math.random() * 10) + 1,
            type: i % 3 === 0 ? 'transfer' : i % 2 === 0 ? 'in' : 'out',
            note: `Bulk operation ${i + 1} عملية مجمعة`,
          });
      }

      const startTime = Date.now();

      // Test analytics performance with larger dataset
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/syrian-overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const processingTime = Date.now() - startTime;

      expect(response.body).toBeDefined();
      expect(processingTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should optimize database queries for analytics', async () => {
      const startTime = Date.now();

      // Request complex analytics that would require multiple queries
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/warehouse-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const processingTime = Date.now() - startTime;

      expect(response.body.warehouses.length).toBeGreaterThan(0);

      // Should be optimized to complete quickly
      expect(processingTime).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('🌍 Syrian Market Specific Analytics', () => {
    it('should provide governorate-specific performance insights', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/governorate-insights')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('governoratePerformance');
      expect(response.body).toHaveProperty('regionalTrends');
      expect(response.body).toHaveProperty('logisticsOptimization');

      response.body.governoratePerformance.forEach((gov: any) => {
        expect(gov).toHaveProperty('governorate');
        expect(gov).toHaveProperty('totalValue');
        expect(gov).toHaveProperty('averageMovementTime');
        expect(gov).toHaveProperty('customerSatisfaction');
        expect(gov).toHaveProperty('logisticsCost');

        // Verify Syrian governorates
        expect([
          'Damascus',
          'Aleppo',
          'Latakia',
          'Homs',
          'Daraa',
          'Hasakah',
        ]).toContain(gov.governorate);
      });
    });

    it('should analyze Syrian seasonal patterns', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/seasonal-patterns?market=syrian')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ramadanImpact');
      expect(response.body).toHaveProperty('warRecoveryTrends');
      expect(response.body).toHaveProperty('diasporaInfluence');
      expect(response.body).toHaveProperty('economicIndicators');

      // Ramadan impact analysis
      expect(response.body.ramadanImpact).toHaveProperty('demandIncrease');
      expect(response.body.ramadanImpact).toHaveProperty('categoryPreferences');
      expect(response.body.ramadanImpact).toHaveProperty('timingOptimization');

      // Diaspora influence
      expect(response.body.diasporaInfluence).toHaveProperty(
        'remittanceImpact',
      );
      expect(response.body.diasporaInfluence).toHaveProperty(
        'preferredCategories',
      );
      expect(response.body.diasporaInfluence).toHaveProperty(
        'deliveryPatterns',
      );
    });

    it('should provide multi-currency analytics for diaspora market', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/multi-currency-analysis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('currencyBreakdown');
      expect(response.body).toHaveProperty('exchangeRateImpact');
      expect(response.body).toHaveProperty('diasporaPreferences');

      expect(response.body.currencyBreakdown).toHaveProperty('SYP');
      expect(response.body.currencyBreakdown).toHaveProperty('USD');
      expect(response.body.currencyBreakdown).toHaveProperty('EUR');

      // Verify SYP is the primary currency
      expect(response.body.currencyBreakdown.SYP.percentage).toBeGreaterThan(
        50,
      );
    });

    it('should analyze Syrian supply chain resilience', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/supply-chain-resilience')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('riskAssessment');
      expect(response.body).toHaveProperty('alternativeSuppliers');
      expect(response.body).toHaveProperty('stockBuffer');
      expect(response.body).toHaveProperty('contingencyPlans');

      expect(response.body.riskAssessment).toHaveProperty('overallScore');
      expect(response.body.riskAssessment).toHaveProperty('vulnerabilities');
      expect(response.body.riskAssessment).toHaveProperty(
        'mitigationStrategies',
      );
    });
  });

  describe('📊 Advanced Analytics Features', () => {
    it('should provide predictive analytics for stock planning', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/predictive-insights')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('demandPrediction');
      expect(response.body).toHaveProperty('optimalStockLevels');
      expect(response.body).toHaveProperty('reorderTimingOptimization');
      expect(response.body).toHaveProperty('riskProbabilities');

      expect(response.body.demandPrediction).toHaveProperty('nextMonth');
      expect(response.body.demandPrediction).toHaveProperty('nextQuarter');
      expect(response.body.demandPrediction).toHaveProperty(
        'confidenceInterval',
      );
    });

    it('should generate customizable analytics reports', async () => {
      const reportConfig = {
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
        warehouses: [damascusWarehouse.id, aleppoWarehouse.id],
        metrics: ['stock_value', 'turnover_rate', 'accuracy_score'],
        format: 'detailed',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/analytics/custom-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(reportConfig)
        .expect(201);

      expect(response.body).toHaveProperty('reportId');
      expect(response.body).toHaveProperty('generatedAt');
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('detailedMetrics');
      expect(response.body).toHaveProperty('recommendations');

      // Verify requested metrics are included
      reportConfig.metrics.forEach((metric) => {
        expect(response.body.detailedMetrics).toHaveProperty(metric);
      });
    });

    it('should provide benchmarking analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/benchmarking')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('industryBenchmarks');
      expect(response.body).toHaveProperty('performanceGaps');
      expect(response.body).toHaveProperty('improvementOpportunities');
      expect(response.body).toHaveProperty('bestPractices');

      expect(response.body.industryBenchmarks).toHaveProperty(
        'averageTurnover',
      );
      expect(response.body.industryBenchmarks).toHaveProperty(
        'standardAccuracy',
      );
      expect(response.body.industryBenchmarks).toHaveProperty(
        'optimalUtilization',
      );
    });

    it('should export analytics data in multiple formats', async () => {
      // Test CSV export
      const csvResponse = await request(app.getHttpServer())
        .get(
          '/admin/stock/analytics/export?format=csv&type=warehouse-performance',
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(csvResponse.headers['content-type']).toContain('text/csv');
      expect(csvResponse.text).toContain('warehouseId,warehouseName');

      // Test JSON export
      const jsonResponse = await request(app.getHttpServer())
        .get('/admin/stock/analytics/export?format=json&type=syrian-overview')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(jsonResponse.headers['content-type']).toContain(
        'application/json',
      );
      expect(jsonResponse.body).toHaveProperty('data');
      expect(jsonResponse.body).toHaveProperty('metadata');
    });
  });

  describe('🔒 Analytics Security and Access Control', () => {
    it('should require authentication for all analytics endpoints', async () => {
      const protectedEndpoints = [
        '/admin/stock/analytics/syrian-overview',
        '/admin/stock/analytics/warehouse-performance',
        '/admin/stock/analytics/turnover-analysis',
        '/admin/stock/analytics/demand-forecast',
        '/admin/stock/analytics/real-time-movements',
      ];

      for (const endpoint of protectedEndpoints) {
        await request(app.getHttpServer()).get(endpoint).expect(401);
      }
    });

    it('should validate analytics parameters', async () => {
      const invalidRequests = [
        {
          endpoint:
            '/admin/stock/analytics/syrian-overview?governorate=Invalid',
          expectedStatus: 400,
        },
        {
          endpoint: '/admin/stock/analytics/custom-report',
          method: 'post',
          data: { invalidConfig: true },
          expectedStatus: 400,
        },
      ];

      for (const req of invalidRequests) {
        if (req.method === 'post') {
          await request(app.getHttpServer())
            .post(req.endpoint)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(req.data)
            .expect(req.expectedStatus);
        } else {
          await request(app.getHttpServer())
            .get(req.endpoint)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(req.expectedStatus);
        }
      }
    });

    it('should handle rate limiting for analytics requests', async () => {
      // Simulate rapid requests
      const rapidRequests = [];
      for (let i = 0; i < 20; i++) {
        rapidRequests.push(
          request(app.getHttpServer())
            .get('/admin/stock/analytics/syrian-overview')
            .set('Authorization', `Bearer ${adminToken}`),
        );
      }

      const results = await Promise.all(rapidRequests);

      // Most requests should succeed, but rate limiting might kick in
      const successfulRequests = results.filter((r) => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(10); // At least half should succeed
    });

    it('should protect sensitive analytics data', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/cost-analysis')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify that cost data doesn't expose internal pricing details inappropriately
      expect(response.body.totalInventoryValue).toBeDefined();
      expect(response.body.carryingCosts).toBeDefined();

      // Should not expose individual supplier costs or margins
      expect(response.body).not.toHaveProperty('supplierCosts');
      expect(response.body).not.toHaveProperty('profitMargins');
    });
  });

  describe('🎯 Analytics Integration and Automation', () => {
    it('should integrate with stock operations for real-time updates', async () => {
      // Get initial analytics
      const initialAnalytics = await request(app.getHttpServer())
        .get('/admin/stock/analytics/real-time-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const initialMovements = initialAnalytics.body.activeMovements;

      // Perform stock operation
      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: testVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 5,
          type: 'in',
          note: 'Analytics integration test',
        })
        .expect(201);

      // Wait a moment for processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get updated analytics
      const updatedAnalytics = await request(app.getHttpServer())
        .get('/admin/stock/analytics/real-time-movements')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Analytics should reflect the new movement
      expect(updatedAnalytics.body.activeMovements).toBeGreaterThan(
        initialMovements,
      );
    });

    it('should provide automated alert recommendations', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/analytics/automated-recommendations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('reorderAlerts');
      expect(response.body).toHaveProperty('redistributionSuggestions');
      expect(response.body).toHaveProperty('overstockWarnings');
      expect(response.body).toHaveProperty('costOptimizations');

      expect(response.body.reorderAlerts).toBeInstanceOf(Array);
      expect(response.body.redistributionSuggestions).toBeInstanceOf(Array);
    });

    it('should support scheduled analytics reports', async () => {
      const scheduleConfig = {
        reportType: 'syrian-overview',
        frequency: 'daily',
        recipients: ['admin@souqsyria.com'],
        format: 'json',
        filters: {
          governorate: 'Damascus',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/analytics/schedule-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scheduleConfig)
        .expect(201);

      expect(response.body).toHaveProperty('scheduleId');
      expect(response.body).toHaveProperty('nextExecution');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('active');
    });
  });
});

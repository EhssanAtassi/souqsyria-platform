/**
 * @file shipments-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Syrian shipments system
 *
 * COVERAGE:
 * - Syrian shipping companies CRUD operations
 * - Shipment lifecycle (15-state workflow)
 * - Seeding operations and data integrity
 * - Multi-currency support (SYP/USD/EUR)
 * - Arabic/English localization
 * - Enterprise workflow features
 * - Performance and bulk operations
 * - Integration with address system
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { ShipmentsModule } from '../../src/shipments/shipments.module';

// Entities
import {
  SyrianShippingCompanyEntity,
  SyrianShippingType,
} from '../../src/shipments/entities/syrian-shipping-company.entity';
import {
  Shipment,
  ShipmentStatus,
} from '../../src/shipments/entities/shipment.entity';
import { ShippingCompany } from '../../src/shipments/entities/shipping-company.entity';
import { ShipmentStatusLog } from '../../src/shipments/entities/shipment-status-log.entity';
import { User } from '../../src/users/entities/user.entity';
import { Order } from '../../src/orders/entities/order.entity';

describe('🚚 Shipments System E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: User;
  let testOrder: Order;
  let testSyrianCompany: SyrianShippingCompanyEntity;
  let testLegacyCompany: ShippingCompany;

  // Test data
  const syrianCompanyData = {
    nameEn: 'Test Damascus Express',
    nameAr: 'تجريبي دمشق للتوصيل السريع',
    descriptionEn: 'Test shipping company for E2E testing',
    descriptionAr: 'شركة توصيل تجريبية للاختبار الشامل',
    companyType: SyrianShippingType.EXPRESS_DELIVERY,
    contactInfo: {
      phone: '+963-11-1234567',
      mobile: '+963-987-654321',
      whatsapp: '+963-987-654321',
      email: 'test@damascusexpress.sy',
    },
    coverageAreas: [
      {
        governorateId: 1,
        governorateName: 'Damascus',
        governorateNameAr: 'دمشق',
        cities: [
          {
            cityId: 1,
            cityName: 'Damascus City',
            cityNameAr: 'مدينة دمشق',
            deliveryFee: 2000,
            estimatedHours: 2,
            isActive: true,
          },
        ],
        baseFee: 1500,
        isActive: true,
      },
    ],
    services: [
      {
        id: 'express_test',
        nameEn: 'Express Test Service',
        nameAr: 'خدمة السرعة التجريبية',
        description: 'Test express delivery service',
        descriptionAr: 'خدمة توصيل سريع تجريبية',
        baseCostSYP: 3000,
        costPerKmSYP: 500,
        estimatedDeliveryHours: 3,
        maxWeightKg: 10,
        isActive: true,
        workingHours: {
          start: '09:00',
          end: '18:00',
          days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        },
      },
    ],
    pricing: {
      baseFee: 1500,
      perKmRate: 300,
      weightRates: [
        { maxKg: 5, rateSYP: 0 },
        { maxKg: 10, rateSYP: 500 },
      ],
      expressFee: 2000,
      weekendFee: 1000,
      codFee: 500,
    },
    schedule: {
      workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: { start: '09:00', end: '18:00' },
      weekendService: false,
      holidayService: false,
      emergencyService: false,
      timeZone: 'Asia/Damascus',
    },
    performanceMetrics: {
      deliverySuccessRate: 95.0,
      averageDeliveryTime: 4.5,
      customerRating: 4.5,
      totalDeliveries: 1000,
      onTimeDeliveries: 950,
      lastUpdated: new Date(),
      monthlyStats: [],
    },
    capabilities: {
      codSupported: true,
      signatureRequired: true,
      photoProofAvailable: true,
      trackingAvailable: true,
      smsNotifications: true,
      whatsappNotifications: false,
      specialHandling: ['fragile', 'electronics'],
      vehicleTypes: ['motorcycle', 'car'],
      maxWeight: 25,
      maxDimensions: { length: 80, width: 60, height: 50 },
    },
    companyStatus: {
      isVerified: true,
      insuranceValid: true,
      contractStatus: 'active',
      paymentTerms: 'monthly',
      commission: 10.0,
    },
    isActive: true,
    displayPriority: 10,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Clean up existing test data
    await cleanupTestData();

    // Create test dependencies
    await createTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  // Helper functions
  async function cleanupTestData() {
    if (dataSource?.isInitialized) {
      await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

      // Clean in dependency order
      await dataSource.getRepository(ShipmentStatusLog).delete({});
      await dataSource.getRepository(Shipment).delete({});
      await dataSource.getRepository(SyrianShippingCompanyEntity).delete({});
      await dataSource.getRepository(ShippingCompany).delete({});

      await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  async function createTestData() {
    // Create test user (minimal setup)
    const userRepo = dataSource.getRepository(User);
    testUser = await userRepo.save({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+963987654321',
    });

    // Create test order (minimal setup)
    const orderRepo = dataSource.getRepository(Order);
    testOrder = await orderRepo.save({
      user: testUser,
      totalAmount: 150000,
      currency: 'SYP',
      status: 'confirmed',
    });
  }

  describe('🏢 Syrian Shipping Companies Management', () => {
    describe('POST /api/v1/shipments/syrian/companies', () => {
      it('should create a new Syrian shipping company with full localization', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/shipments/syrian/companies')
          .send(syrianCompanyData)
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          nameEn: syrianCompanyData.nameEn,
          nameAr: syrianCompanyData.nameAr,
          companyType: SyrianShippingType.EXPRESS_DELIVERY,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });

        // Verify Arabic localization
        expect(response.body.descriptionAr).toContain('تجريبية');
        expect(response.body.contactInfo.phone).toBe('+963-11-1234567');
        expect(response.body.pricing.baseFee).toBe(1500);

        testSyrianCompany = response.body;
      });

      it('should validate required fields for Syrian company creation', async () => {
        const invalidData = {
          nameEn: '', // Invalid - empty
          nameAr: 'اسم عربي',
          // Missing required fields
        };

        await request(app.getHttpServer())
          .post('/api/v1/shipments/syrian/companies')
          .send(invalidData)
          .expect(400);
      });

      it('should handle Arabic text properly in company data', async () => {
        const arabicCompanyData = {
          ...syrianCompanyData,
          nameEn: 'Aleppo Speed Test',
          nameAr: 'حلب للسرعة التجريبية',
          descriptionAr:
            'شركة توصيل متخصصة في شمال سوريا مع خدمات عالية الجودة',
          coverageAreas: [
            {
              governorateId: 2,
              governorateName: 'Aleppo',
              governorateNameAr: 'حلب',
              cities: [
                {
                  cityId: 10,
                  cityName: 'Aleppo City',
                  cityNameAr: 'مدينة حلب',
                  deliveryFee: 1800,
                  estimatedHours: 3,
                  isActive: true,
                  specialInstructionsAr: 'التوصيل متاح في جميع أنحاء المدينة',
                },
              ],
              baseFee: 1200,
              isActive: true,
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/shipments/syrian/companies')
          .send(arabicCompanyData)
          .expect(201);

        expect(response.body.nameAr).toBe('حلب للسرعة التجريبية');
        expect(response.body.descriptionAr).toContain('شمال سوريا');
        expect(
          response.body.coverageAreas[0].cities[0].specialInstructionsAr,
        ).toContain('التوصيل متاح');
      });
    });

    describe('GET /api/v1/shipments/syrian/companies', () => {
      it('should retrieve all Syrian shipping companies with localization', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/shipments/syrian/companies')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        const company = response.body.find(
          (c) => c.id === testSyrianCompany.id,
        );
        expect(company).toBeDefined();
        expect(company.nameEn).toBe(testSyrianCompany.nameEn);
        expect(company.nameAr).toBe(testSyrianCompany.nameAr);
      });

      it('should filter companies by type', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/shipments/syrian/companies')
          .query({ companyType: SyrianShippingType.EXPRESS_DELIVERY })
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((company) => {
          expect(company.companyType).toBe(SyrianShippingType.EXPRESS_DELIVERY);
        });
      });

      it('should return companies with Arabic localization headers', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/shipments/syrian/companies')
          .set('Accept-Language', 'ar')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('nameAr');
          expect(response.body[0]).toHaveProperty('descriptionAr');
        }
      });
    });

    describe('GET /api/v1/shipments/syrian/companies/:id', () => {
      it('should retrieve a specific Syrian company with complete details', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shipments/syrian/companies/${testSyrianCompany.id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: testSyrianCompany.id,
          nameEn: testSyrianCompany.nameEn,
          nameAr: testSyrianCompany.nameAr,
          companyType: SyrianShippingType.EXPRESS_DELIVERY,
          contactInfo: expect.any(Object),
          coverageAreas: expect.any(Array),
          services: expect.any(Array),
          pricing: expect.any(Object),
          performanceMetrics: expect.any(Object),
          capabilities: expect.any(Object),
        });

        // Verify nested structures
        expect(response.body.contactInfo.phone).toBe('+963-11-1234567');
        expect(response.body.pricing.baseFee).toBe(1500);
        expect(response.body.capabilities.codSupported).toBe(true);
      });

      it('should return 404 for non-existent Syrian company', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/shipments/syrian/companies/99999')
          .expect(404);
      });
    });

    describe('PUT /api/v1/shipments/syrian/companies/:id', () => {
      it('should update Syrian company with preserved localization', async () => {
        const updateData = {
          nameEn: 'Updated Damascus Express',
          nameAr: 'دمشق المحدث للتوصيل السريع',
          descriptionEn: 'Updated description for testing',
          descriptionAr: 'وصف محدث للاختبار',
          pricing: {
            ...testSyrianCompany.pricing,
            baseFee: 1800, // Updated fee
          },
        };

        const response = await request(app.getHttpServer())
          .put(`/api/v1/shipments/syrian/companies/${testSyrianCompany.id}`)
          .send(updateData)
          .expect(200);

        expect(response.body.nameEn).toBe('Updated Damascus Express');
        expect(response.body.nameAr).toBe('دمشق المحدث للتوصيل السريع');
        expect(response.body.pricing.baseFee).toBe(1800);
        expect(response.body.updatedAt).not.toBe(testSyrianCompany.updatedAt);
      });
    });
  });

  describe('📦 Shipment Lifecycle Management', () => {
    let testShipment: Shipment;

    const shipmentData = {
      orderId: null, // Will be set in test
      syrianShippingCompanyId: null, // Will be set in test
      tracking_code: 'TEST-SHIP-2025-001',
      status: ShipmentStatus.CREATED,
      package_details: {
        weightKg: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declaredValue: 150000,
        isFragile: true,
        requiresColdStorage: false,
        specialInstructions: 'Handle with care - electronics',
        specialInstructionsAr: 'تعامل بحذر - إلكترونيات',
        contents: [
          {
            item: 'Test Product',
            itemAr: 'منتج تجريبي',
            quantity: 1,
            value: 150000,
          },
        ],
      },
      service_options: {
        serviceType: 'express',
        serviceName: 'Express Delivery',
        serviceNameAr: 'التوصيل السريع',
        isExpress: true,
        requiresSignature: true,
        cashOnDelivery: true,
        codAmount: 150000,
        insuranceRequired: true,
        callBeforeDelivery: true,
        smsNotifications: true,
        whatsappNotifications: false,
        deliveryInstructions: 'Call 30 minutes before arrival',
        deliveryInstructionsAr: 'اتصل قبل الوصول بـ 30 دقيقة',
      },
      cost_breakdown: {
        baseFee: 1500,
        distanceFee: 1200,
        weightFee: 500,
        expressFee: 2000,
        codFee: 500,
        totalCost: 5700,
        currency: 'SYP',
        calculatedAt: new Date(),
      },
      total_cost_syp: 5700.0,
      internal_notes: 'Test shipment for E2E testing',
      internal_notes_ar: 'شحنة تجريبية للاختبار الشامل',
    };

    describe('POST /api/v1/shipments', () => {
      it('should create a new shipment with Syrian company assignment', async () => {
        const testShipmentData = {
          ...shipmentData,
          orderId: testOrder.id,
          syrianShippingCompanyId: testSyrianCompany.id,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/shipments')
          .send(testShipmentData)
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(Number),
          tracking_code: 'TEST-SHIP-2025-001',
          status: ShipmentStatus.CREATED,
          total_cost_syp: 5700.0,
          createdAt: expect.any(String),
        });

        // Verify nested structures
        expect(response.body.package_details.weightKg).toBe(2.5);
        expect(response.body.service_options.isExpress).toBe(true);
        expect(response.body.cost_breakdown.currency).toBe('SYP');

        // Verify Arabic localization
        expect(response.body.package_details.specialInstructionsAr).toContain(
          'إلكترونيات',
        );
        expect(response.body.service_options.serviceNameAr).toBe(
          'التوصيل السريع',
        );

        testShipment = response.body;
      });

      it('should validate shipment data and Syrian company assignment', async () => {
        const invalidData = {
          orderId: 99999, // Non-existent order
          syrianShippingCompanyId: 99999, // Non-existent company
          tracking_code: '', // Invalid tracking code
        };

        await request(app.getHttpServer())
          .post('/api/v1/shipments')
          .send(invalidData)
          .expect(400);
      });
    });

    describe('GET /api/v1/shipments', () => {
      it('should retrieve shipments with filtering and sorting', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/shipments')
          .query({ status: ShipmentStatus.CREATED, limit: 10 })
          .expect(200);

        expect(response.body).toMatchObject({
          data: expect.any(Array),
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
        });

        if (response.body.data.length > 0) {
          const shipment = response.body.data[0];
          expect(shipment.status).toBe(ShipmentStatus.CREATED);
          expect(shipment).toHaveProperty('tracking_code');
          expect(shipment).toHaveProperty('syrianShippingCompany');
        }
      });

      it('should support Arabic language headers', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/shipments')
          .set('Accept-Language', 'ar')
          .expect(200);

        expect(response.body.data).toBeDefined();
        // Verify Arabic localized fields are included
        if (response.body.data.length > 0) {
          expect(response.body.data[0]).toHaveProperty('internal_notes_ar');
        }
      });
    });

    describe('PUT /api/v1/shipments/:id/status', () => {
      it('should update shipment status through workflow states', async () => {
        // Update to ASSIGNED_COMPANY
        const response1 = await request(app.getHttpServer())
          .put(`/api/v1/shipments/${testShipment.id}/status`)
          .send({
            status: ShipmentStatus.ASSIGNED_COMPANY,
            notes: 'Assigned to Damascus Express',
            notes_ar: 'تم التعيين لدمشق للتوصيل السريع',
          })
          .expect(200);

        expect(response1.body.status).toBe(ShipmentStatus.ASSIGNED_COMPANY);

        // Update to PICKED_UP
        const response2 = await request(app.getHttpServer())
          .put(`/api/v1/shipments/${testShipment.id}/status`)
          .send({
            status: ShipmentStatus.PICKED_UP,
            notes: 'Package picked up by delivery agent',
            notes_ar: 'تم استلام الطرد بواسطة عامل التوصيل',
            metadata: {
              agentName: 'Ahmad Al-Delivery',
              pickupTime: new Date().toISOString(),
            },
          })
          .expect(200);

        expect(response2.body.status).toBe(ShipmentStatus.PICKED_UP);
        expect(response2.body.picked_up_at).toBeDefined();
      });

      it('should prevent invalid status transitions', async () => {
        // Try to jump from PICKED_UP directly to DELIVERED (skipping intermediate states)
        await request(app.getHttpServer())
          .put(`/api/v1/shipments/${testShipment.id}/status`)
          .send({
            status: ShipmentStatus.DELIVERED,
            notes: 'Invalid direct transition to delivered',
          })
          .expect(400);
      });
    });

    describe('GET /api/v1/shipments/:trackingCode/track', () => {
      it('should track shipment by tracking code with full history', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shipments/${testShipment.tracking_code}/track`)
          .expect(200);

        expect(response.body).toMatchObject({
          shipment: expect.objectContaining({
            id: testShipment.id,
            tracking_code: testShipment.tracking_code,
            status: expect.any(String),
          }),
          statusHistory: expect.any(Array),
          estimatedDelivery: expect.any(String),
          currentLocation: expect.any(String),
        });

        // Verify status history includes Arabic notes
        expect(response.body.statusHistory.length).toBeGreaterThan(0);
        const historyEntry = response.body.statusHistory.find(
          (h) => h.notes_ar,
        );
        if (historyEntry) {
          expect(historyEntry.notes_ar).toBeDefined();
        }
      });

      it('should handle non-existent tracking codes', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/shipments/NONEXISTENT-CODE/track')
          .expect(404);
      });
    });
  });

  describe('🌱 Seeding Operations', () => {
    describe('POST /api/v1/seed/shipments/all', () => {
      it('should seed complete shipment system with Syrian companies', async () => {
        const seedingConfig = {
          syrianCompanies: true,
          legacyCompanies: true,
          sampleShipments: true,
          statusLogs: true,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/shipments/all')
          .send(seedingConfig)
          .expect(201);

        expect(response.body).toMatchObject({
          syrianCompaniesCreated: expect.any(Number),
          legacyCompaniesCreated: expect.any(Number),
          shipmentsCreated: expect.any(Number),
          statusLogsCreated: expect.any(Number),
          totalExecutionTime: expect.any(Number),
          errors: [],
        });

        // Verify seeded data exists
        expect(response.body.syrianCompaniesCreated).toBeGreaterThan(0);
        expect(response.body.legacyCompaniesCreated).toBeGreaterThan(0);
      });

      it('should handle bulk shipment seeding for performance testing', async () => {
        const bulkConfig = {
          syrianCompanies: false,
          legacyCompanies: false,
          sampleShipments: false,
          statusLogs: false,
          bulkShipments: 100,
          performanceTest: true,
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/shipments/all')
          .send(bulkConfig)
          .expect(201);

        expect(response.body.shipmentsCreated).toBe(100);
        expect(response.body.totalExecutionTime).toBeGreaterThan(0);
      });
    });

    describe('POST /api/v1/seed/shipments/syrian-companies', () => {
      it('should seed only Syrian shipping companies with Arabic localization', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/seed/shipments/syrian-companies')
          .expect(201);

        expect(response.body).toMatchObject({
          message: expect.stringContaining('Syrian shipping companies'),
          count: expect.any(Number),
          executionTime: expect.any(Number),
        });

        // Verify companies were created
        const companiesResponse = await request(app.getHttpServer())
          .get('/api/v1/shipments/syrian/companies')
          .expect(200);

        const damascusCompany = companiesResponse.body.find(
          (c) => c.nameEn.includes('Damascus') && c.nameAr.includes('دمشق'),
        );
        expect(damascusCompany).toBeDefined();
        expect(damascusCompany.nameAr).toContain('دمشق');
      });
    });

    describe('GET /api/v1/seed/shipments/stats', () => {
      it('should return comprehensive seeding statistics', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/seed/shipments/stats')
          .expect(200);

        expect(response.body).toMatchObject({
          overview: {
            syrianShippingCompanies: expect.any(Number),
            legacyShippingCompanies: expect.any(Number),
            totalShipments: expect.any(Number),
            statusLogs: expect.any(Number),
          },
          shipmentsByStatus: expect.any(Object),
          lastUpdated: expect.any(String),
        });

        // Verify shipments by status breakdown
        const statusBreakdown = response.body.shipmentsByStatus;
        const totalFromBreakdown = Object.values(statusBreakdown).reduce(
          (sum: number, count: number) => sum + count,
          0,
        );
        expect(totalFromBreakdown).toBe(response.body.overview.totalShipments);
      });
    });

    describe('GET /api/v1/seed/shipments/verify', () => {
      it('should verify data integrity after seeding', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/seed/shipments/verify')
          .expect(200);

        expect(response.body).toMatchObject({
          isValid: expect.any(Boolean),
          issues: expect.any(Array),
          summary: expect.any(Object),
        });

        // If valid, should have no issues
        if (response.body.isValid) {
          expect(response.body.issues).toHaveLength(0);
        }

        expect(response.body.summary.overview).toBeDefined();
      });
    });
  });

  describe('💰 Multi-Currency Support', () => {
    it('should handle SYP currency calculations correctly', async () => {
      const shipmentData = {
        orderId: testOrder.id,
        syrianShippingCompanyId: testSyrianCompany.id,
        tracking_code: 'TEST-SYP-2025-001',
        cost_breakdown: {
          baseFee: 1500,
          distanceFee: 1000,
          weightFee: 500,
          expressFee: 2000,
          totalCost: 5000,
          currency: 'SYP',
          calculatedAt: new Date(),
        },
        total_cost_syp: 5000.0,
        package_details: {
          weightKg: 3.0,
          dimensions: { length: 35, width: 25, height: 20 },
          declaredValue: 200000, // 200k SYP
          isFragile: false,
          contents: [
            {
              item: 'Sample Product',
              itemAr: 'منتج عينة',
              quantity: 1,
              value: 200000,
            },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/shipments')
        .send(shipmentData)
        .expect(201);

      expect(response.body.cost_breakdown.currency).toBe('SYP');
      expect(response.body.total_cost_syp).toBe(5000.0);
      expect(response.body.package_details.declaredValue).toBe(200000);
    });
  });

  describe('🔍 Advanced Search and Filtering', () => {
    it('should filter shipments by Syrian company', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/shipments')
        .query({
          syrianShippingCompanyId: testSyrianCompany.id,
          limit: 5,
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        response.body.data.forEach((shipment) => {
          expect(shipment.syrianShippingCompany.id).toBe(testSyrianCompany.id);
        });
      }
    });

    it('should search shipments by tracking code pattern', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/shipments')
        .query({ search: 'TEST-' })
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        response.body.data.forEach((shipment) => {
          expect(shipment.tracking_code).toMatch(/TEST-/);
        });
      }
    });

    it('should filter by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shipments')
        .query({
          fromDate: yesterday.toISOString(),
          toDate: today.toISOString(),
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      if (response.body.data.length > 0) {
        response.body.data.forEach((shipment) => {
          const createdAt = new Date(shipment.createdAt);
          expect(createdAt.getTime()).toBeGreaterThanOrEqual(
            yesterday.getTime(),
          );
          expect(createdAt.getTime()).toBeLessThanOrEqual(today.getTime());
        });
      }
    });
  });

  describe('📊 Performance and Analytics', () => {
    it('should handle large dataset queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/v1/shipments')
        .query({ limit: 100 })
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should complete within 2 seconds
      expect(queryTime).toBeLessThan(2000);
      expect(response.body.data).toBeDefined();
    });

    it('should provide company performance metrics', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/shipments/syrian/companies/${testSyrianCompany.id}/performance`,
        )
        .expect(200);

      expect(response.body).toMatchObject({
        deliverySuccessRate: expect.any(Number),
        averageDeliveryTime: expect.any(Number),
        customerRating: expect.any(Number),
        totalDeliveries: expect.any(Number),
        onTimeDeliveries: expect.any(Number),
      });
    });
  });

  describe('🔧 Error Handling and Edge Cases', () => {
    it('should handle malformed request data gracefully', async () => {
      const malformedData = {
        invalidField: 'invalid',
        cost_breakdown: 'not an object',
      };

      await request(app.getHttpServer())
        .post('/api/v1/shipments')
        .send(malformedData)
        .expect(400);
    });

    it('should return proper error messages for Arabic content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/shipments')
        .send({})
        .set('Accept-Language', 'ar')
        .expect(400);

      // Should still return valid error structure
      expect(response.body).toHaveProperty('message');
    });

    it('should handle concurrent shipment updates safely', async () => {
      if (testShipment) {
        // Create multiple concurrent update requests
        const updatePromises = Array.from({ length: 5 }, (_, i) =>
          request(app.getHttpServer())
            .put(`/api/v1/shipments/${testShipment.id}/status`)
            .send({
              status: ShipmentStatus.OUT_FOR_DELIVERY,
              notes: `Concurrent update ${i}`,
            }),
        );

        const results = await Promise.allSettled(updatePromises);

        // At least one should succeed, others might fail with conflict
        const successful = results.filter((r) => r.status === 'fulfilled');
        expect(successful.length).toBeGreaterThan(0);
      }
    });
  });
});

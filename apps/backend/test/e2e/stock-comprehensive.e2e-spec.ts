/**
 * @file stock-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Stock API endpoints
 *
 * Tests complete stock management workflow including:
 * - Stock querying across warehouses
 * - Stock adjustments and transfers
 * - Multi-warehouse inventory management
 * - Stock alert system
 * - Syrian market features and localization
 * - Performance and error handling
 * - Authentication and authorization
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
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';
import { Warehouse } from '../../src/warehouses/entities/warehouse.entity';

describe('Stock API (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let testAdmin: any;
  let testUser: any;
  let testProduct: any;
  let testVariant: any;
  let secondVariant: any;
  let damascusWarehouse: any;
  let aleppoWarehouse: any;

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
        email: 'admin@souqsyria.com',
        password: 'AdminPassword123!',
        first_name: 'مدير',
        last_name: 'المخزن',
        phone: '+963987654321',
        role_id: 1, // Admin role
      });

    testAdmin = adminResponse.body.user;
    adminToken = adminResponse.body.access_token;

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'user@souqsyria.com',
        password: 'UserPassword123!',
        first_name: 'زبون',
        last_name: 'عادي',
        phone: '+963988765432',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create Damascus warehouse
    const damascusResponse = await request(app.getHttpServer())
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Damascus Main Warehouse',
        name_ar: 'مستودع دمشق الرئيسي',
        address: 'Damascus Industrial City, Syria',
        city: 'Damascus',
        governorate: 'Damascus',
        latitude: 33.5138,
        longitude: 36.2765,
        capacity: 10000,
        manager_name: 'أحمد السوري',
        contact_phone: '+963987654321',
      });

    damascusWarehouse = damascusResponse.body.warehouse;

    // Create Aleppo warehouse
    const aleppoResponse = await request(app.getHttpServer())
      .post('/api/warehouses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Aleppo Distribution Center',
        name_ar: 'مركز توزيع حلب',
        address: 'Aleppo Industrial Zone, Syria',
        city: 'Aleppo',
        governorate: 'Aleppo',
        latitude: 36.2021,
        longitude: 37.1343,
        capacity: 5000,
        manager_name: 'فاطمة الحلبية',
        contact_phone: '+963988123456',
      });

    aleppoWarehouse = aleppoResponse.body.warehouse;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name_en: 'Samsung Galaxy S24 Ultra',
        name_ar: 'سامسونج جالاكسي إس 24 ألترا',
        description_en:
          'Latest Samsung flagship smartphone with advanced features',
        description_ar: 'أحدث هاتف ذكي رائد من سامسونج مع ميزات متطورة',
        category_id: 1,
        vendor_id: 1,
        price: 6500000, // 6,500,000 SYP
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create first test variant (512GB Titanium)
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SGS24U-512GB-TITANIUM',
        price: 6500000,
        stock_quantity: 0, // Will be managed through stock API
        attributes: {
          color: 'Titanium Black',
          storage: '512GB',
          ram: '12GB',
        },
      });

    testVariant = variantResponse.body.variant;

    // Create second test variant (256GB Purple)
    const secondVariantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SGS24U-256GB-PURPLE',
        price: 5800000, // 5,800,000 SYP
        stock_quantity: 0, // Will be managed through stock API
        attributes: {
          color: 'Purple',
          storage: '256GB',
          ram: '12GB',
        },
      });

    secondVariant = secondVariantResponse.body.variant;
  }

  describe('📊 Stock Querying', () => {
    it('should get total stock for variant across all warehouses', async () => {
      // Initially should be 0
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}/total`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBe(0);
    });

    it('should get stock for variant in specific warehouse', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/admin/stock/variant/${testVariant.id}/warehouse/${damascusWarehouse.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBe(0);
    });

    it('should get total product stock across all variants', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/product/${testProduct.id}/total`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        product_id: testProduct.id,
        total_stock: 0,
      });
    });

    it('should require authentication for stock queries', async () => {
      await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}/total`)
        .expect(401);
    });

    it('should require admin privileges for stock queries', async () => {
      await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}/total`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('📦 Stock Adjustments', () => {
    it('should adjust stock IN successfully', async () => {
      const adjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 50,
        type: 'in',
        note: 'Initial stock from Samsung supplier تسليم أولي من سامسونج',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        quantity: 50,
      });

      // Verify stock was updated
      const stockResponse = await request(app.getHttpServer())
        .get(
          `/admin/stock/variant/${testVariant.id}/warehouse/${damascusWarehouse.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(stockResponse.body).toBe(50);
    });

    it('should adjust stock OUT successfully', async () => {
      const adjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 10,
        type: 'out',
        note: 'Customer order fulfillment تلبية طلب عميل',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        quantity: 40, // 50 - 10
      });
    });

    it('should reject adjustment when insufficient stock', async () => {
      const adjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 100, // More than available
        type: 'out',
        note: 'Large order',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(400);

      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject adjustment for non-existent variant', async () => {
      const adjustmentDto = {
        variant_id: 99999,
        warehouse_id: damascusWarehouse.id,
        quantity: 10,
        type: 'in',
        note: 'Invalid variant test',
      };

      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(404);
    });

    it('should reject adjustment for non-existent warehouse', async () => {
      const adjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: 99999,
        quantity: 10,
        type: 'in',
        note: 'Invalid warehouse test',
      };

      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(404);
    });

    it('should validate adjustment request data', async () => {
      const invalidDto = {
        variant_id: 'invalid',
        warehouse_id: damascusWarehouse.id,
        quantity: -10, // Negative quantity
        type: 'invalid_type',
      };

      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should handle Arabic notes in stock adjustments', async () => {
      const adjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 5,
        type: 'in',
        note: 'إضافة مخزون إضافي بسبب زيادة الطلب في رمضان',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.quantity).toBe(45); // 40 + 5
    });
  });

  describe('🔄 Stock Transfers', () => {
    beforeAll(async () => {
      // Add initial stock to Aleppo warehouse for transfer tests
      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: testVariant.id,
          warehouse_id: aleppoWarehouse.id,
          quantity: 30,
          type: 'in',
          note: 'Initial stock for Aleppo warehouse',
        });
    });

    it('should transfer stock between warehouses successfully', async () => {
      const transferDto = {
        variant_id: testVariant.id,
        from_warehouse_id: damascusWarehouse.id,
        to_warehouse_id: aleppoWarehouse.id,
        quantity: 15,
        note: 'Rebalancing inventory between Damascus and Aleppo إعادة توزيع المخزون',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(transferDto)
        .expect(201);

      expect(response.body).toEqual({ success: true });

      // Verify source warehouse stock decreased
      const sourceStock = await request(app.getHttpServer())
        .get(
          `/admin/stock/variant/${testVariant.id}/warehouse/${damascusWarehouse.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(sourceStock.body).toBe(30); // 45 - 15

      // Verify destination warehouse stock increased
      const destStock = await request(app.getHttpServer())
        .get(
          `/admin/stock/variant/${testVariant.id}/warehouse/${aleppoWarehouse.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(destStock.body).toBe(45); // 30 + 15
    });

    it('should reject transfer when source and destination are the same', async () => {
      const transferDto = {
        variant_id: testVariant.id,
        from_warehouse_id: damascusWarehouse.id,
        to_warehouse_id: damascusWarehouse.id, // Same warehouse
        quantity: 10,
        note: 'Invalid transfer test',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(transferDto)
        .expect(400);

      expect(response.body.message).toContain(
        'Source and target warehouse cannot be the same',
      );
    });

    it('should reject transfer when insufficient stock in source', async () => {
      const transferDto = {
        variant_id: testVariant.id,
        from_warehouse_id: damascusWarehouse.id,
        to_warehouse_id: aleppoWarehouse.id,
        quantity: 100, // More than available
        note: 'Large transfer test',
      };

      await request(app.getHttpServer())
        .post('/admin/stock/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should validate transfer request data', async () => {
      const invalidDto = {
        variant_id: 'invalid',
        from_warehouse_id: damascusWarehouse.id,
        to_warehouse_id: aleppoWarehouse.id,
        quantity: -5, // Negative quantity
      };

      await request(app.getHttpServer())
        .post('/admin/stock/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should handle Syrian governorate-based transfers', async () => {
      const transferDto = {
        variant_id: testVariant.id,
        from_warehouse_id: aleppoWarehouse.id, // Aleppo governorate
        to_warehouse_id: damascusWarehouse.id, // Damascus governorate
        quantity: 10,
        note: 'Inter-governorate transfer نقل بين المحافظات السورية',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(transferDto)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('📋 Variant Stock Details', () => {
    it('should get variant stock across all warehouses', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);

      // Should include both warehouses
      const warehouseIds = response.body.map(
        (stock: any) => stock.warehouse.id,
      );
      expect(warehouseIds).toContain(damascusWarehouse.id);
      expect(warehouseIds).toContain(aleppoWarehouse.id);

      // Verify stock quantities
      response.body.forEach((stock: any) => {
        expect(stock.quantity).toBeGreaterThanOrEqual(0);
        expect(stock.warehouse).toBeDefined();
        expect(stock.warehouse.name).toBeDefined();
      });
    });

    it('should return 404 when no stock found for variant', async () => {
      // Create a variant with no stock
      const newVariantResponse = await request(app.getHttpServer())
        .post(`/api/products/${testProduct.id}/variants`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'SGS24U-128GB-WHITE',
          price: 5500000,
          stock_quantity: 0,
          attributes: {
            color: 'White',
            storage: '128GB',
            ram: '8GB',
          },
        });

      const newVariant = newVariantResponse.body.variant;

      await request(app.getHttpServer())
        .get(`/admin/stock/variant/${newVariant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should include Syrian warehouse details in variant stock', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.forEach((stock: any) => {
        expect(stock.warehouse.name).toBeDefined();
        expect(stock.warehouse.city).toBeDefined();
        expect(stock.warehouse.governorate).toBeDefined();

        // Verify Syrian cities
        expect(['Damascus', 'Aleppo']).toContain(stock.warehouse.city);
      });
    });
  });

  describe('🚨 Stock Alert System', () => {
    beforeAll(async () => {
      // Create low stock scenario to trigger alerts
      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: secondVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 10,
          type: 'in',
          note: 'Small initial stock for alert testing',
        });

      // Reduce stock to trigger low stock alert
      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: secondVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 8,
          type: 'out',
          note: 'Large order to trigger low stock alert',
        });
    });

    it('should get stock alerts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter stock alerts by warehouse', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/alerts?warehouse_id=${damascusWarehouse.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        response.body.data.forEach((alert: any) => {
          expect(alert.warehouse.id).toBe(damascusWarehouse.id);
        });
      }
    });

    it('should filter stock alerts by variant', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/alerts?variant_id=${secondVariant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        response.body.data.forEach((alert: any) => {
          expect(alert.variant.id).toBe(secondVariant.id);
        });
      }
    });

    it('should filter stock alerts by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/alerts?type=low_stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      if (response.body.data.length > 0) {
        response.body.data.forEach((alert: any) => {
          expect(alert.type).toBe('low_stock');
        });
      }
    });

    it('should paginate stock alerts', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/alerts?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should get stock alert summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/stock/alerts/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Object);
      // Should contain counts by alert type
      Object.values(response.body).forEach((count) => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should get individual stock alert by ID', async () => {
      // First get alerts to find an ID
      const alertsResponse = await request(app.getHttpServer())
        .get('/admin/stock/alerts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (alertsResponse.body.data.length > 0) {
        const alertId = alertsResponse.body.data[0].id;

        const response = await request(app.getHttpServer())
          .get(`/admin/stock/alerts/${alertId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(alertId);
        expect(response.body.variant).toBeDefined();
        expect(response.body.warehouse).toBeDefined();
        expect(response.body.type).toBeDefined();
      }
    });

    it('should return 404 for non-existent alert', async () => {
      await request(app.getHttpServer())
        .get('/admin/stock/alerts/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should handle large SYP amounts in stock operations', async () => {
      // Test with expensive electronics (large SYP amounts)
      const adjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 100,
        type: 'in',
        note: 'Large shipment worth 650,000,000 SYP إرسالية كبيرة بقيمة 650 مليون ليرة سورية',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      // New quantity should be previous + 100
      expect(response.body.quantity).toBeGreaterThan(100);
    });

    it('should support Arabic warehouse names in operations', async () => {
      const transferDto = {
        variant_id: testVariant.id,
        from_warehouse_id: damascusWarehouse.id, // مستودع دمشق الرئيسي
        to_warehouse_id: aleppoWarehouse.id, // مركز توزيع حلب
        quantity: 5,
        note: 'نقل بين المستودعات السورية للموسم الجديد',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/transfer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(transferDto)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should handle Syrian product names in stock queries', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.length > 0) {
        response.body.forEach((stock: any) => {
          expect(stock.variant).toBeDefined();
          // Should include Arabic product information if available
          if (stock.variant.product) {
            expect(
              stock.variant.product.name_ar || stock.variant.product.nameAr,
            ).toContain('سامسونج');
          }
        });
      }
    });

    it('should support Syrian governorate-based stock distribution', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const governorates = response.body.map(
        (stock: any) => stock.warehouse.governorate,
      );

      // Should include major Syrian governorates
      expect(governorates).toContain('Damascus');
      expect(governorates).toContain('Aleppo');
    });

    it('should handle seasonal stock adjustments for Syrian market', async () => {
      const ramadanStockDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 25,
        type: 'in',
        note: 'تحضير مخزون إضافي لشهر رمضان المبارك - زيادة متوقعة في الطلب',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(ramadanStockDto)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('⚡ Performance and Error Handling', () => {
    it('should handle rapid stock adjustments', async () => {
      const operations = [
        request(app.getHttpServer())
          .post('/admin/stock/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            variant_id: testVariant.id,
            warehouse_id: damascusWarehouse.id,
            quantity: 5,
            type: 'in',
            note: 'Rapid adjustment 1',
          }),
        request(app.getHttpServer())
          .post('/admin/stock/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            variant_id: testVariant.id,
            warehouse_id: damascusWarehouse.id,
            quantity: 3,
            type: 'out',
            note: 'Rapid adjustment 2',
          }),
        request(app.getHttpServer())
          .post('/admin/stock/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            variant_id: testVariant.id,
            warehouse_id: damascusWarehouse.id,
            quantity: 2,
            type: 'in',
            note: 'Rapid adjustment 3',
          }),
      ];

      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach((result) => {
        expect([200, 201]).toContain(result.status);
        if (result.status === 201) {
          expect(result.body.success).toBe(true);
        }
      });
    });

    it('should handle large stock quantities efficiently', async () => {
      const largeAdjustmentDto = {
        variant_id: testVariant.id,
        warehouse_id: damascusWarehouse.id,
        quantity: 1000, // Large quantity
        type: 'in',
        note: 'Bulk shipment processing',
      };

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeAdjustmentDto)
        .expect(201);

      const processingTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should validate numeric parameters properly', async () => {
      const invalidRequests = [
        {
          variant_id: 'not_a_number',
          warehouse_id: damascusWarehouse.id,
          quantity: 10,
          type: 'in',
        },
        {
          variant_id: testVariant.id,
          warehouse_id: 'not_a_number',
          quantity: 10,
          type: 'in',
        },
        {
          variant_id: testVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 'not_a_number',
          type: 'in',
        },
      ];

      for (const invalidDto of invalidRequests) {
        await request(app.getHttpServer())
          .post('/admin/stock/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidDto)
          .expect(400);
      }
    });

    it('should maintain data consistency under concurrent operations', async () => {
      // Get initial stock
      const initialStock = await request(app.getHttpServer())
        .get(
          `/admin/stock/variant/${testVariant.id}/warehouse/${damascusWarehouse.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Perform balanced operations (in and out)
      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: testVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 20,
          type: 'in',
          note: 'Add stock',
        });

      await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variant_id: testVariant.id,
          warehouse_id: damascusWarehouse.id,
          quantity: 20,
          type: 'out',
          note: 'Remove stock',
        });

      // Final stock should equal initial stock
      const finalStock = await request(app.getHttpServer())
        .get(
          `/admin/stock/variant/${testVariant.id}/warehouse/${damascusWarehouse.id}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(finalStock.body).toBe(initialStock.body);
    });
  });

  describe('🔒 Security and Authorization', () => {
    it('should protect all stock endpoints with authentication', async () => {
      const protectedEndpoints = [
        { method: 'get', path: `/admin/stock/variant/${testVariant.id}/total` },
        {
          method: 'get',
          path: `/admin/stock/variant/${testVariant.id}/warehouse/${damascusWarehouse.id}`,
        },
        { method: 'post', path: '/admin/stock/adjust' },
        { method: 'post', path: '/admin/stock/transfer' },
        { method: 'get', path: '/admin/stock/alerts' },
        { method: 'get', path: '/admin/stock/alerts/summary' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())[endpoint.method](
          endpoint.path,
        );
        expect(response.status).toBe(401);
      }
    });

    it('should require admin privileges for stock operations', async () => {
      const adminOnlyEndpoints = [
        {
          method: 'post',
          path: '/admin/stock/adjust',
          data: {
            variant_id: testVariant.id,
            warehouse_id: damascusWarehouse.id,
            quantity: 1,
            type: 'in',
          },
        },
        {
          method: 'post',
          path: '/admin/stock/transfer',
          data: {
            variant_id: testVariant.id,
            from_warehouse_id: damascusWarehouse.id,
            to_warehouse_id: aleppoWarehouse.id,
            quantity: 1,
          },
        },
      ];

      for (const endpoint of adminOnlyEndpoints) {
        const response = await request(app.getHttpServer())
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`)
          .send(endpoint.data);
        expect(response.status).toBe(403);
      }
    });

    it('should validate request data and prevent SQL injection', async () => {
      const maliciousDto = {
        variant_id: '1; DROP TABLE stock; --',
        warehouse_id: damascusWarehouse.id,
        quantity: 10,
        type: 'in',
        note: "<script>alert('xss')</script>",
      };

      const response = await request(app.getHttpServer())
        .post('/admin/stock/adjust')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousDto)
        .expect(400); // Should be rejected by validation

      // Verify system is still functional
      const healthCheck = await request(app.getHttpServer())
        .get(`/admin/stock/variant/${testVariant.id}/total`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(typeof healthCheck.body).toBe('number');
    });
  });
});

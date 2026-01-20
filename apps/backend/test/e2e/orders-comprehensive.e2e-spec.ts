/**
 * @file orders-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Orders API endpoints
 *
 * Tests complete order management workflow including:
 * - Order creation and validation
 * - Order retrieval and filtering
 * - Status management and transitions
 * - Return and refund processing
 * - Syrian market specific features
 * - Multi-vendor order handling
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
import { Order } from '../../src/orders/entities/order.entity';
import { OrderItem } from '../../src/orders/entities/order-item.entity';
import { OrderStatusLog } from '../../src/orders/entities/order-status-log.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';
import { ReturnRequest } from '../../src/orders/entities/return-request.entity';

describe('Orders API (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testAdmin: any;
  let testProduct: any;
  let testVariant: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Order,
            OrderItem,
            OrderStatusLog,
            ProductVariant,
            Product,
            User,
            ReturnRequest,
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
   * Creates test users, products, and authentication tokens
   */
  async function createTestData() {
    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'testuser@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'Ahmed',
        last_name: 'Al-Syrian',
        phone: '+963987654321',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create test admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'admin@souqsyria.com',
        password: 'AdminPassword123!',
        first_name: 'Admin',
        last_name: 'User',
        role_id: 1, // Admin role
      });

    testAdmin = adminResponse.body.user;
    adminToken = adminResponse.body.access_token;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name_en: 'Samsung Galaxy S24',
        name_ar: 'سامسونج جالاكسي إس 24',
        description_en: 'Latest Samsung smartphone',
        description_ar: 'أحدث هاتف ذكي من سامسونج',
        category_id: 1,
        vendor_id: 1,
        price: 2750000, // 2,750,000 SYP
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create test variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SGS24-128GB-BLACK',
        price: 2750000,
        stock_quantity: 100,
        attributes: {
          color: 'Black',
          storage: '128GB',
        },
      });

    testVariant = variantResponse.body.variant;
  }

  describe('📦 Order Creation', () => {
    it('should create order successfully with Syrian market features', async () => {
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 2,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
        buyer_note: 'يرجى الاتصال قبل التسليم', // Arabic note
        shipping_address: {
          name: 'أحمد محمد السوري',
          phone: '+963987654321',
          address_line1: 'شارع الثورة، حي المزة',
          address_line2: 'بناء رقم 15، الطابق الثالث',
          city: 'Damascus',
          region: 'Damascus',
          country: 'Syria',
          postal_code: '12345',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      expect(response.body.message).toBe('Order placed successfully');
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBeDefined();
      expect(response.body.order.status).toBe('pending');
      expect(response.body.order.payment_method).toBe('cash_on_delivery');
      expect(response.body.order.total_amount).toBe(5500000); // 2 * 2,750,000
      expect(response.body.order.currency).toBe('SYP');
      expect(response.body.order.buyer_note).toBe('يرجى الاتصال قبل التسليم');
      expect(response.body.tracking).toBeDefined();
      expect(response.body.nextSteps).toBeDefined();
    });

    it('should handle multiple product order correctly', async () => {
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 2750000,
          },
          {
            variant_id: testVariant.id,
            quantity: 2,
            unit_price: 2750000,
          },
        ],
        payment_method: 'bank_transfer',
        buyer_note: 'Urgent order for wedding gift',
        gift_message: 'Happy Wedding! من أصدقائكم',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      expect(response.body.order.total_amount).toBe(8250000); // 3 * 2,750,000
      expect(response.body.order.payment_method).toBe('bank_transfer');
      expect(response.body.order.gift_message).toBe(
        'Happy Wedding! من أصدقائكم',
      );
    });

    it('should reject order with insufficient stock', async () => {
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 200, // Exceeds available stock
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(400);

      expect(response.body.message).toContain('does not have enough stock');
    });

    it('should reject order with invalid variant ID', async () => {
      const createOrderDto = {
        items: [
          {
            variant_id: 99999, // Non-existent variant
            quantity: 1,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(404);

      expect(response.body.message).toContain('variants not found');
    });

    it('should require authentication for order creation', async () => {
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(createOrderDto)
        .expect(401);
    });
  });

  describe('📋 Order Retrieval', () => {
    let testOrderId: number;

    beforeAll(async () => {
      // Create a test order for retrieval tests
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
        buyer_note: 'Test order for retrieval',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto);

      testOrderId = response.body.order.id;
    });

    it('should get user order history successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders/my')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders.length).toBeGreaterThan(0);
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.total_orders).toBeGreaterThan(0);
      expect(response.body.summary.total_spent).toBeGreaterThan(0);
      expect(response.body.summary.currency).toBe('SYP');
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders/my?status=pending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(response.body.filters_applied.status).toBe('pending');

      // All returned orders should have pending status
      response.body.orders.forEach((order: any) => {
        expect(order.status).toBe('pending');
      });
    });

    it('should limit number of orders returned', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders/my?limit=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.orders.length).toBeLessThanOrEqual(1);
      expect(response.body.filters_applied.limit).toBe('1');
    });

    it('should get specific order details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(testOrderId);
      expect(response.body.order.orderNumber).toBeDefined();
      expect(response.body.order.customer).toBeDefined();
      expect(response.body.order.items).toBeDefined();
      expect(response.body.order.status_history).toBeDefined();
      expect(response.body.order.tracking).toBeDefined();
      expect(response.body.order.actions).toBeDefined();
    });

    it('should reject access to other user orders', async () => {
      // Create another user and try to access the first user's order
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser@souqsyria.com',
          password: 'Password123!',
          first_name: 'Other',
          last_name: 'User',
        });

      const otherUserToken = otherUserResponse.body.access_token;

      await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/api/orders/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('🔄 Order Status Management', () => {
    let testOrderId: number;

    beforeAll(async () => {
      // Create a test order for status management tests
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto);

      testOrderId = response.body.order.id;
    });

    it('should update order status successfully', async () => {
      const updateDto = {
        order_id: testOrderId,
        new_status: 'confirmed',
        admin_note: 'Order confirmed by admin',
      };

      const response = await request(app.getHttpServer())
        .put('/api/orders/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toBeDefined();

      // Verify status was updated
      const orderResponse = await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orderResponse.body.order.status).toBe('confirmed');
      expect(orderResponse.body.order.status_history.length).toBeGreaterThan(1);
    });

    it('should create status log when updating status', async () => {
      const updateDto = {
        order_id: testOrderId,
        new_status: 'processing',
      };

      await request(app.getHttpServer())
        .put('/api/orders/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      // Check that status history includes the new status
      const orderResponse = await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const statusHistory = orderResponse.body.order.status_history;
      const latestStatus = statusHistory[statusHistory.length - 1];
      expect(latestStatus.status).toBe('processing');
    });

    it('should validate status transitions', async () => {
      // Try to update to an invalid status transition
      const updateDto = {
        order_id: testOrderId,
        new_status: 'invalid_status',
      };

      await request(app.getHttpServer())
        .put('/api/orders/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(400);
    });

    it('should require authorization for status updates', async () => {
      const updateDto = {
        order_id: testOrderId,
        new_status: 'shipped',
      };

      await request(app.getHttpServer())
        .put('/api/orders/status')
        .send(updateDto)
        .expect(401);
    });
  });

  describe('↩️ Return Processing', () => {
    let deliveredOrderId: number;

    beforeAll(async () => {
      // Create and complete an order for return testing
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto);

      deliveredOrderId = response.body.order.id;

      // Update order to delivered status
      await request(app.getHttpServer())
        .put('/api/orders/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          order_id: deliveredOrderId,
          new_status: 'delivered',
        });
    });

    it('should create return request successfully', async () => {
      const returnDto = {
        order_id: deliveredOrderId,
        items: [
          {
            order_item_id: 1,
            quantity: 1,
          },
        ],
        reason: 'Product damaged',
        description: 'Item arrived damaged during shipping',
        evidence_images: ['https://example.com/damage1.jpg'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders/return')
        .set('Authorization', `Bearer ${userToken}`)
        .send(returnDto)
        .expect(201);

      expect(response.body).toContain('Return request submitted');
    });

    it('should validate return eligibility', async () => {
      // Try to return a pending order (not eligible)
      const pendingOrderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [
            {
              variant_id: testVariant.id,
              quantity: 1,
              unit_price: 2750000,
            },
          ],
          payment_method: 'cash_on_delivery',
        });

      const pendingOrderId = pendingOrderResponse.body.order.id;

      const returnDto = {
        order_id: pendingOrderId,
        items: [{ order_item_id: 1, quantity: 1 }],
        reason: 'Changed mind',
      };

      await request(app.getHttpServer())
        .post('/api/orders/return')
        .set('Authorization', `Bearer ${userToken}`)
        .send(returnDto)
        .expect(400);
    });

    it('should require authentication for return requests', async () => {
      const returnDto = {
        order_id: deliveredOrderId,
        items: [{ order_item_id: 1, quantity: 1 }],
        reason: 'Product damaged',
      };

      await request(app.getHttpServer())
        .post('/api/orders/return')
        .send(returnDto)
        .expect(401);
    });
  });

  describe('💰 Refund Processing', () => {
    let refundOrderId: number;

    beforeAll(async () => {
      // Create an order for refund testing
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 1,
            unit_price: 2750000,
          },
        ],
        payment_method: 'credit_card',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto);

      refundOrderId = response.body.order.id;
    });

    it('should process refund successfully (admin only)', async () => {
      const refundDto = {
        order_id: refundOrderId,
        amount: 1375000, // Partial refund: half of 2,750,000
        reason: 'Partial return approved',
        reason_code: 'PARTIAL_RETURN',
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundDto)
        .expect(201);

      expect(response.body).toContain('Refund recorded and processed');
    });

    it('should reject refund request from non-admin', async () => {
      const refundDto = {
        order_id: refundOrderId,
        amount: 1375000,
        reason: 'User trying to refund',
      };

      await request(app.getHttpServer())
        .post('/api/orders/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundDto)
        .expect(403);
    });

    it('should validate refund amount', async () => {
      const refundDto = {
        order_id: refundOrderId,
        amount: 5000000, // Exceeds order amount
        reason: 'Invalid refund amount',
      };

      await request(app.getHttpServer())
        .post('/api/orders/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundDto)
        .expect(400);
    });
  });

  describe('🌍 Syrian Market Features', () => {
    it('should handle Syrian governorate-based shipping', async () => {
      const syrianGovernorates = [
        'Damascus',
        'Aleppo',
        'Homs',
        'Latakia',
        'Hama',
        'Idlib',
        'Daraa',
        'Deir ez-Zor',
        'Raqqa',
        'As-Suwayda',
        'Quneitra',
        'Tartus',
        'Al-Hasakah',
        'Damascus Countryside',
      ];

      for (const governorate of syrianGovernorates.slice(0, 3)) {
        const createOrderDto = {
          items: [
            {
              variant_id: testVariant.id,
              quantity: 1,
              unit_price: 2750000,
            },
          ],
          payment_method: 'cash_on_delivery',
          shipping_address: {
            name: 'Test Customer',
            phone: '+963987654321',
            address_line1: 'Test Address',
            city: governorate,
            region: governorate,
            country: 'Syria',
            postal_code: '12345',
          },
        };

        const response = await request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createOrderDto)
          .expect(201);

        expect(response.body.order).toBeDefined();
        expect(response.body.order.status).toBe('pending');
      }
    });

    it('should support SYP currency calculations', async () => {
      const createOrderDto = {
        items: [
          {
            variant_id: testVariant.id,
            quantity: 5,
            unit_price: 2750000,
          },
        ],
        payment_method: 'cash_on_delivery',
        shipping_fee: 50000, // 50,000 SYP shipping
        tax_amount: 137500, // 10% VAT on items
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(createOrderDto)
        .expect(201);

      const expectedTotal = 5 * 2750000; // 13,750,000 SYP
      expect(response.body.order.total_amount).toBe(expectedTotal);
      expect(response.body.order.currency).toBe('SYP');
    });

    it('should handle Arabic order notes and messages', async () => {
      const arabicTexts = [
        'يرجى الاتصال قبل التسليم',
        'تسليم سريع مطلوب',
        'هدية عيد ميلاد سعيد',
        'بضائع حساسة - يرجى التعامل بحذر',
      ];

      for (const arabicText of arabicTexts) {
        const createOrderDto = {
          items: [
            {
              variant_id: testVariant.id,
              quantity: 1,
              unit_price: 2750000,
            },
          ],
          payment_method: 'cash_on_delivery',
          buyer_note: arabicText,
          gift_message: `${arabicText} - هدية من الأصدقاء`,
        };

        const response = await request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createOrderDto)
          .expect(201);

        expect(response.body.order.buyer_note).toBe(arabicText);
        expect(response.body.order.gift_message).toBe(
          `${arabicText} - هدية من الأصدقاء`,
        );
      }
    });
  });

  describe('🔍 Order Filtering and Search', () => {
    beforeAll(async () => {
      // Create orders with different statuses for filtering tests
      const statuses = ['pending', 'confirmed', 'shipped'];

      for (const status of statuses) {
        const createOrderDto = {
          items: [
            {
              variant_id: testVariant.id,
              quantity: 1,
              unit_price: 2750000,
            },
          ],
          payment_method: 'cash_on_delivery',
          buyer_note: `Order for ${status} status test`,
        };

        const response = await request(app.getHttpServer())
          .post('/api/orders')
          .set('Authorization', `Bearer ${userToken}`)
          .send(createOrderDto);

        // Update order to the desired status
        if (status !== 'pending') {
          await request(app.getHttpServer())
            .put('/api/orders/status')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              order_id: response.body.order.id,
              new_status: status,
            });
        }
      }
    });

    it('should filter orders by status in admin endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned orders should have pending status
      response.body.forEach((order: any) => {
        expect(order.status).toBe('pending');
      });
    });

    it('should filter orders by user ID in admin endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/orders?user_id=${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned orders should belong to the test user
      response.body.forEach((order: any) => {
        expect(order.user.id).toBe(testUser.id);
      });
    });

    it('should filter orders by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const response = await request(app.getHttpServer())
        .get(
          `/api/orders?from=${yesterday.toISOString()}&to=${tomorrow.toISOString()}`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // All returned orders should be within the date range
      response.body.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        expect(orderDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(orderDate.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      });
    });

    it('should require admin access for order filtering endpoint', async () => {
      await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('🏪 Vendor Order Management', () => {
    it('should get vendor orders (requires vendor role)', async () => {
      // This test assumes vendor functionality is properly set up
      // For now, we'll test the endpoint structure

      const response = await request(app.getHttpServer())
        .get('/api/orders/vendor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require vendor authentication for vendor orders', async () => {
      await request(app.getHttpServer()).get('/api/orders/vendor').expect(401);
    });
  });

  describe('🔒 Security and Authorization', () => {
    it('should protect all endpoints with authentication', async () => {
      const protectedEndpoints = [
        { method: 'post', path: '/api/orders' },
        { method: 'get', path: '/api/orders/my' },
        { method: 'get', path: '/api/orders/1' },
        { method: 'put', path: '/api/orders/status' },
        { method: 'post', path: '/api/orders/return' },
        { method: 'post', path: '/api/orders/refund' },
        { method: 'get', path: '/api/orders/vendor' },
        { method: 'get', path: '/api/orders' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())[endpoint.method](
          endpoint.path,
        );

        expect([401, 403]).toContain(response.status);
      }
    });

    it('should validate request data properly', async () => {
      const invalidOrderDto = {
        items: [], // Empty items array
        payment_method: 'invalid_method',
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidOrderDto)
        .expect(400);
    });

    it('should handle malformed request data', async () => {
      const malformedData = {
        items: 'not_an_array',
        payment_method: null,
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(malformedData)
        .expect(400);
    });
  });
});

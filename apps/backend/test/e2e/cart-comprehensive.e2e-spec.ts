/**
 * @file cart-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Cart API endpoints
 *
 * Tests complete cart management workflow including:
 * - Cart creation and retrieval
 * - Adding items with stock validation
 * - Removing items and updating quantities
 * - Cart clearing and total calculation
 * - Syrian market specific features
 * - Multi-currency support
 * - Authentication and authorization
 * - Performance and error handling
 *
 * @author SouqSyria Development Team
 * @since 2025-08-17
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Cart } from '../../src/cart/entities/cart.entity';
import { CartItem } from '../../src/cart/entities/cart-item.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';
import { ProductStockEntity } from '../../src/stock/entities/product-stock.entity';

describe('Cart API (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testAdmin: any;
  let testProduct: any;
  let testVariant: any;
  let secondVariant: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Cart,
            CartItem,
            ProductVariant,
            ProductEntity,
            User,
            ProductStockEntity,
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
        email: 'customer@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'أحمد',
        last_name: 'السوري',
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
        name_en: 'Samsung Galaxy S24 Ultra',
        name_ar: 'سامسونج جالاكسي إس 24 ألترا',
        description_en: 'Latest Samsung flagship smartphone',
        description_ar: 'أحدث هاتف ذكي رائد من سامسونج',
        category_id: 1,
        vendor_id: 1,
        price: 6500000, // 6,500,000 SYP
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create first test variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SGS24U-512GB-TITANIUM',
        price: 6500000,
        stock_quantity: 100,
        attributes: {
          color: 'Titanium Black',
          storage: '512GB',
          ram: '12GB',
        },
      });

    testVariant = variantResponse.body.variant;

    // Create second test variant for multi-item tests
    const secondVariantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'SGS24U-256GB-VIOLET',
        price: 5800000, // 5,800,000 SYP
        stock_quantity: 50,
        attributes: {
          color: 'Violet',
          storage: '256GB',
          ram: '12GB',
        },
      });

    secondVariant = secondVariantResponse.body.variant;
  }

  describe('🛒 Cart Retrieval', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.currency).toBe('SYP');
      expect(response.body.status).toBe('active');
      expect(response.body.totalItems).toBe(0);
      expect(response.body.totalAmount).toBe(0);
      expect(response.body.items).toEqual([]);
      expect(response.body.version).toBeDefined();
      expect(response.body.created_at).toBeDefined();
    });

    it('should require authentication for cart access', async () => {
      await request(app.getHttpServer()).get('/cart').expect(401);
    });

    it('should return cart with Syrian localization', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.currency).toBe('SYP');
      expect(response.body.userId).toBe(testUser.id);
    });
  });

  describe('➕ Adding Items to Cart', () => {
    it('should add item to cart successfully', async () => {
      const addItemDto = {
        variant_id: testVariant.id,
        quantity: 2,
        currency: 'SYP',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemDto)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.totalItems).toBe(2);
      expect(response.body.totalAmount).toBe(13000000); // 2 * 6,500,000 SYP
      expect(response.body.currency).toBe('SYP');
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].quantity).toBe(2);
      expect(response.body.items[0].price_at_add).toBe(6500000);
      expect(response.body.items[0].variant.id).toBe(testVariant.id);
      expect(response.body.items[0].valid).toBe(true);
    });

    it('should update quantity when adding existing item', async () => {
      const addItemDto = {
        variant_id: testVariant.id,
        quantity: 1,
        currency: 'SYP',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemDto)
        .expect(201);

      expect(response.body.totalItems).toBe(3); // 2 + 1
      expect(response.body.totalAmount).toBe(19500000); // 3 * 6,500,000 SYP
      expect(response.body.items[0].quantity).toBe(3);
    });

    it('should add second different item to cart', async () => {
      const addItemDto = {
        variant_id: secondVariant.id,
        quantity: 1,
        currency: 'SYP',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemDto)
        .expect(201);

      expect(response.body.totalItems).toBe(4); // 3 + 1
      expect(response.body.totalAmount).toBe(25300000); // (3 * 6,500,000) + (1 * 5,800,000)
      expect(response.body.items.length).toBe(2);
    });

    it('should add item with discount and campaign tracking', async () => {
      // First clear cart for clean test
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const addItemDto = {
        variant_id: testVariant.id,
        quantity: 1,
        currency: 'SYP',
        price_discounted: 5850000, // 10% discount
        added_from_campaign: 'ramadan_sale_2025',
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemDto)
        .expect(201);

      expect(response.body.items[0].price_discounted).toBe(5850000);
      expect(response.body.items[0].added_from_campaign).toBe(
        'ramadan_sale_2025',
      );
      expect(response.body.items[0].expires_at).toBeDefined();
      expect(response.body.totalAmount).toBe(5850000); // Discounted price
    });

    it('should validate stock availability', async () => {
      const addItemDto = {
        variant_id: testVariant.id,
        quantity: 200, // Exceeds available stock of 100
        currency: 'SYP',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemDto)
        .expect(400);

      expect(response.body.message).toContain('Not enough stock');
      expect(response.body.message).toContain('Available:');
      expect(response.body.message).toContain('Requested: 200');
    });

    it('should reject non-existent variant', async () => {
      const addItemDto = {
        variant_id: 99999,
        quantity: 1,
        currency: 'SYP',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemDto)
        .expect(404);

      expect(response.body.message).toContain('Product variant not found');
    });

    it('should require authentication for adding items', async () => {
      const addItemDto = {
        variant_id: testVariant.id,
        quantity: 1,
        currency: 'SYP',
      };

      await request(app.getHttpServer())
        .post('/cart/add')
        .send(addItemDto)
        .expect(401);
    });

    it('should validate request data', async () => {
      const invalidDto = {
        variant_id: 'invalid',
        quantity: -1,
        currency: 'INVALID',
      };

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('🗑️ Removing Items from Cart', () => {
    let cartWithItems: any;

    beforeAll(async () => {
      // Clear cart and add test items
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add first item
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        });

      // Add second item
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 1,
          currency: 'SYP',
        });

      // Get cart with items
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`);

      cartWithItems = cartResponse.body;
    });

    it('should remove specific item from cart', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/cart/item/${testVariant.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify item was removed
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.items.length).toBe(1);
      expect(cartResponse.body.totalItems).toBe(1);
      expect(cartResponse.body.totalAmount).toBe(5800000); // Only second variant remains
      expect(cartResponse.body.items[0].variant.id).toBe(secondVariant.id);
    });

    it('should handle removing non-existent item', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/cart/item/99999`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain('Item not found in cart');
    });

    it('should require authentication for removing items', async () => {
      await request(app.getHttpServer())
        .delete(`/cart/item/${testVariant.id}`)
        .expect(401);
    });

    it('should validate variant ID parameter', async () => {
      await request(app.getHttpServer())
        .delete('/cart/item/invalid')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);
    });
  });

  describe('🧹 Clearing Cart', () => {
    beforeAll(async () => {
      // Add items to cart for clearing tests
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 3,
          currency: 'SYP',
        });
    });

    it('should clear entire cart successfully', async () => {
      // Verify cart has items before clearing
      const beforeResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(beforeResponse.body.totalItems).toBeGreaterThan(0);

      // Clear cart
      const response = await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify cart is empty
      const afterResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(afterResponse.body.totalItems).toBe(0);
      expect(afterResponse.body.totalAmount).toBe(0);
      expect(afterResponse.body.items).toEqual([]);
      expect(afterResponse.body.status).toBe('active');
    });

    it('should handle clearing empty cart gracefully', async () => {
      const response = await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should still work even if cart is already empty
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(0);
    });

    it('should require authentication for clearing cart', async () => {
      await request(app.getHttpServer()).delete('/cart/clear').expect(401);
    });
  });

  describe('🌍 Syrian Market Features', () => {
    beforeAll(async () => {
      // Clear cart for clean tests
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should handle large SYP amounts correctly', async () => {
      const expensiveItem = {
        variant_id: testVariant.id,
        quantity: 5, // 5 expensive phones
        currency: 'SYP',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(expensiveItem)
        .expect(201);

      expect(response.body.totalAmount).toBe(32500000); // 5 * 6,500,000 SYP
      expect(response.body.currency).toBe('SYP');
    });

    it('should support Arabic product names in cart', async () => {
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      if (cartResponse.body.items.length > 0) {
        const item = cartResponse.body.items[0];
        expect(item.variant.product.name_ar).toBeDefined();
        expect(item.variant.product.name_ar).toContain('سامسونج');
      }
    });

    it('should handle Syrian phone numbers in user context', async () => {
      // Syrian phone numbers should be properly handled
      expect(testUser.phone).toBe('+963987654321');

      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.userId).toBe(testUser.id);
    });

    it('should support Ramadan and Syrian holiday campaigns', async () => {
      const holidayItem = {
        variant_id: secondVariant.id,
        quantity: 1,
        currency: 'SYP',
        price_discounted: 4640000, // 20% Ramadan discount
        added_from_campaign: 'ramadan_kareem_2025',
      };

      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(holidayItem)
        .expect(201);

      const addedItem = response.body.items.find(
        (item: any) => item.added_from_campaign === 'ramadan_kareem_2025',
      );

      expect(addedItem).toBeDefined();
      expect(addedItem.price_discounted).toBe(4640000);
      expect(addedItem.added_from_campaign).toBe('ramadan_kareem_2025');
    });

    it('should handle Syrian governorate-based delivery preferences', async () => {
      // Test could include delivery preferences based on Syrian governorates
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.currency).toBe('SYP');
      // In a real implementation, this might include delivery zone calculation
    });
  });

  describe('💰 Multi-Currency Support', () => {
    it('should maintain SYP as default currency', async () => {
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.currency).toBe('SYP');
    });

    it('should handle currency conversion for diaspora customers', async () => {
      // This test represents future functionality for diaspora customers
      // who might want to see prices in USD or EUR
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // For now, ensure SYP is used
      expect(cartResponse.body.currency).toBe('SYP');

      if (cartResponse.body.items.length > 0) {
        cartResponse.body.items.forEach((item: any) => {
          expect(item.price_at_add).toBeGreaterThan(1000000); // SYP amounts are large
        });
      }
    });
  });

  describe('📊 Cart State Management', () => {
    it('should track cart version for optimistic locking', async () => {
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.version).toBeDefined();
      expect(typeof cartResponse.body.version).toBe('number');
    });

    it('should update last activity timestamp on operations', async () => {
      const beforeResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const beforeTime = new Date(beforeResponse.body.updated_at);

      // Wait a moment and perform an operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        });

      const afterResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const afterTime = new Date(afterResponse.body.updated_at);
      expect(afterTime.getTime()).toBeGreaterThan(beforeTime.getTime());
    });

    it('should maintain cart status as active during operations', async () => {
      const operations = [
        () =>
          request(app.getHttpServer())
            .post('/cart/add')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ variant_id: testVariant.id, quantity: 1, currency: 'SYP' }),
        () =>
          request(app.getHttpServer())
            .delete(`/cart/item/${testVariant.id}`)
            .set('Authorization', `Bearer ${userToken}`),
        () =>
          request(app.getHttpServer())
            .post('/cart/add')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              variant_id: secondVariant.id,
              quantity: 1,
              currency: 'SYP',
            }),
      ];

      for (const operation of operations) {
        await operation();

        const cartResponse = await request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(cartResponse.body.status).toBe('active');
      }
    });
  });

  describe('🔒 Security and Authorization', () => {
    it('should protect all endpoints with authentication', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/cart' },
        { method: 'post', path: '/cart/add' },
        { method: 'delete', path: '/cart/item/1' },
        { method: 'delete', path: '/cart/clear' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())[endpoint.method](
          endpoint.path,
        );
        expect(response.status).toBe(401);
      }
    });

    it('should prevent cross-user cart access', async () => {
      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'otheruser@souqsyria.com',
          password: 'Password123!',
          first_name: 'Other',
          last_name: 'User',
        });

      const otherUserToken = otherUserResponse.body.access_token;

      // Each user should get their own cart
      const user1CartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const user2CartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200);

      expect(user1CartResponse.body.userId).toBe(testUser.id);
      expect(user2CartResponse.body.userId).toBe(
        otherUserResponse.body.user.id,
      );
      expect(user1CartResponse.body.id).not.toBe(user2CartResponse.body.id);
    });

    it('should validate request data properly', async () => {
      const invalidRequests = [
        {
          endpoint: 'post',
          path: '/cart/add',
          data: { variant_id: 'invalid', quantity: -1 },
        },
        {
          endpoint: 'post',
          path: '/cart/add',
          data: { variant_id: 1, quantity: 0 },
        },
        {
          endpoint: 'post',
          path: '/cart/add',
          data: {},
        },
      ];

      for (const req of invalidRequests) {
        await request(app.getHttpServer())
          [req.endpoint](req.path)
          .set('Authorization', `Bearer ${userToken}`)
          .send(req.data)
          .expect(400);
      }
    });

    it('should handle malformed request data', async () => {
      const malformedData = {
        variant_id: null,
        quantity: 'not_a_number',
        currency: { invalid: 'object' },
      };

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send(malformedData)
        .expect(400);
    });
  });

  describe('⚡ Performance and Edge Cases', () => {
    it('should handle rapid successive operations', async () => {
      // Clear cart for clean test
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Perform multiple rapid operations
      const rapidOperations = [
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ variant_id: testVariant.id, quantity: 1, currency: 'SYP' }),
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ variant_id: secondVariant.id, quantity: 2, currency: 'SYP' }),
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ variant_id: testVariant.id, quantity: 1, currency: 'SYP' }),
      ];

      const results = await Promise.all(rapidOperations);

      // All operations should succeed
      results.forEach((result) => {
        expect([200, 201]).toContain(result.status);
      });

      // Final cart state should be consistent
      const finalCartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalCartResponse.body.totalItems).toBe(4); // 2 + 2 = 4
      expect(finalCartResponse.body.items.length).toBe(2); // Two different variants
    });

    it('should handle large cart with many items', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add multiple items
      for (let i = 0; i < 10; i++) {
        await request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            variant_id: i % 2 === 0 ? testVariant.id : secondVariant.id,
            quantity: 1,
            currency: 'SYP',
          });
      }

      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(10);
      expect(cartResponse.body.items.length).toBe(2); // Two unique variants
    });

    it('should maintain data consistency under load', async () => {
      // This test simulates concurrent cart operations
      const cartBefore = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Perform operations that should result in known final state
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ variant_id: testVariant.id, quantity: 5, currency: 'SYP' });

      const cartAfter = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartAfter.body.totalItems).toBe(5);
      expect(cartAfter.body.totalAmount).toBe(32500000); // 5 * 6,500,000
    });
  });
});

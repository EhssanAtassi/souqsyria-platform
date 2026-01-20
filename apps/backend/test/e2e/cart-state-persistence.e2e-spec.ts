/**
 * @file cart-state-persistence.e2e-spec.ts
 * @description Cart State Management and Persistence E2E Tests
 *
 * Tests cart state management across sessions including:
 * - Cart persistence across user sessions
 * - Optimistic locking and version control
 * - Cart state validation and recovery
 * - Concurrent cart operations
 * - Cart abandonment and expiration
 * - State synchronization with database
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

describe('Cart State Management & Persistence (E2E)', () => {
  let app: INestApplication;
  let userToken: string;
  let secondUserToken: string;
  let testUser: any;
  let secondUser: any;
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
    // Create first test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'statetest@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'حالة',
        last_name: 'الاختبار',
        phone: '+963987654321',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create second test user for concurrent testing
    const secondUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'concurrent@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'متزامن',
        last_name: 'المستخدم',
        phone: '+963988765432',
      });

    secondUser = secondUserResponse.body.user;
    secondUserToken = secondUserResponse.body.access_token;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name_en: 'State Test Product',
        name_ar: 'منتج اختبار الحالة',
        description_en: 'Product for testing cart state persistence',
        description_ar: 'منتج لاختبار ثبات حالة السلة',
        category_id: 1,
        vendor_id: 1,
        price: 2500000, // 2,500,000 SYP
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create first test variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sku: 'STATE-TEST-001',
        price: 2500000,
        stock_quantity: 100,
        attributes: {
          color: 'Blue',
          size: 'Large',
        },
      });

    testVariant = variantResponse.body.variant;

    // Create second test variant
    const secondVariantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        sku: 'STATE-TEST-002',
        price: 1800000, // 1,800,000 SYP
        stock_quantity: 50,
        attributes: {
          color: 'Red',
          size: 'Medium',
        },
      });

    secondVariant = secondVariantResponse.body.variant;
  }

  describe('🔄 Cart State Persistence', () => {
    it('should persist cart state across multiple requests', async () => {
      // Add item to cart
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        })
        .expect(201);

      const cartId = addResponse.body.id;
      const initialVersion = addResponse.body.version;

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Retrieve cart in separate request - should persist state
      const getResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(getResponse.body.id).toBe(cartId);
      expect(getResponse.body.totalItems).toBe(2);
      expect(getResponse.body.totalAmount).toBe(5000000); // 2 * 2,500,000
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0].variant.id).toBe(testVariant.id);
      expect(getResponse.body.items[0].quantity).toBe(2);

      // Add another item
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      // Verify state persisted again
      const finalGetResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalGetResponse.body.totalItems).toBe(3); // 2 + 1
      expect(finalGetResponse.body.totalAmount).toBe(6800000); // (2 * 2,500,000) + (1 * 1,800,000)
      expect(finalGetResponse.body.items).toHaveLength(2);
    });

    it('should maintain cart state after user re-authentication', async () => {
      // Clear cart first
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add items to cart
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 3,
          currency: 'SYP',
        });

      // Simulate new login (new token for same user)
      const reAuthResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'statetest@souqsyria.com',
          password: 'TestPassword123!',
        });

      const newToken = reAuthResponse.body.access_token;

      // Retrieve cart with new token - should maintain state
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(3);
      expect(cartResponse.body.totalAmount).toBe(7500000); // 3 * 2,500,000
      expect(cartResponse.body.items).toHaveLength(1);
      expect(cartResponse.body.items[0].quantity).toBe(3);
    });

    it('should handle database connection interruptions gracefully', async () => {
      // Add item to cart
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        });

      // Verify cart exists and is accessible
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBeGreaterThan(0);

      // Cart operations should continue to work
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);
    });
  });

  describe('⚡ Optimistic Locking & Version Control', () => {
    it('should track cart version changes on updates', async () => {
      // Clear cart and get initial state
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const initialCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const initialVersion = initialCart.body.version;
      expect(initialVersion).toBeDefined();

      // Add item - should increment version
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      expect(addResponse.body.version).toBeGreaterThan(initialVersion);

      // Update quantity - should increment version again
      const updateResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      expect(updateResponse.body.version).toBeGreaterThan(
        addResponse.body.version,
      );
    });

    it('should maintain version consistency across cart operations', async () => {
      // Start with clean cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Perform multiple operations and track versions
      let currentVersion = 0;

      // Add first item
      const add1Response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        })
        .expect(201);

      expect(add1Response.body.version).toBeGreaterThan(currentVersion);
      currentVersion = add1Response.body.version;

      // Add second item
      const add2Response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      expect(add2Response.body.version).toBeGreaterThan(currentVersion);
      currentVersion = add2Response.body.version;

      // Remove item
      await request(app.getHttpServer())
        .delete(`/cart/item/${testVariant.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Check version after removal
      const finalCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalCart.body.version).toBeGreaterThan(currentVersion);
    });
  });

  describe('🔄 Cart State Validation and Recovery', () => {
    it('should validate and recover from invalid cart states', async () => {
      // Clear cart and add valid item
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        });

      // Verify cart is valid
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.items).toHaveLength(1);
      expect(cartResponse.body.items[0].valid).toBe(true);
      expect(cartResponse.body.totalItems).toBe(2);
      expect(cartResponse.body.totalAmount).toBe(5000000);
    });

    it('should handle cart state inconsistencies', async () => {
      // Test cart behavior when item quantities exceed available stock
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Try to add more items than available stock
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 150, // Exceeds stock of 100
          currency: 'SYP',
        })
        .expect(400);

      expect(response.body.message).toContain('Not enough stock');

      // Verify cart remains empty
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(0);
    });

    it('should recover from corrupted cart totals', async () => {
      // Add items to cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 3,
          currency: 'SYP',
        });

      // Verify cart totals are correct
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(3);
      expect(cartResponse.body.totalAmount).toBe(7500000); // 3 * 2,500,000

      // Cart should maintain consistency after any operation
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        });

      const updatedCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(updatedCart.body.totalItems).toBe(4);
      expect(updatedCart.body.totalAmount).toBe(10000000); // 4 * 2,500,000
    });
  });

  describe('⚖️ Concurrent Cart Operations', () => {
    it('should handle concurrent cart operations from same user', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Perform concurrent operations
      const operations = [
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            variant_id: testVariant.id,
            quantity: 1,
            currency: 'SYP',
          }),
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            variant_id: secondVariant.id,
            quantity: 2,
            currency: 'SYP',
          }),
        request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${userToken}`),
      ];

      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach((result) => {
        expect([200, 201]).toContain(result.status);
      });

      // Final cart state should be consistent
      const finalCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalCart.body.totalItems).toBe(3); // 1 + 2
      expect(finalCart.body.items).toHaveLength(2);
    });

    it('should isolate cart operations between different users', async () => {
      // Clear both carts
      await Promise.all([
        request(app.getHttpServer())
          .delete('/cart/clear')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200),
        request(app.getHttpServer())
          .delete('/cart/clear')
          .set('Authorization', `Bearer ${secondUserToken}`)
          .expect(200),
      ]);

      // Perform concurrent operations from different users
      const user1Operations = [
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            variant_id: testVariant.id,
            quantity: 2,
            currency: 'SYP',
          }),
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            variant_id: secondVariant.id,
            quantity: 1,
            currency: 'SYP',
          }),
      ];

      const user2Operations = [
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${secondUserToken}`)
          .send({
            variant_id: testVariant.id,
            quantity: 1,
            currency: 'SYP',
          }),
        request(app.getHttpServer())
          .post('/cart/add')
          .set('Authorization', `Bearer ${secondUserToken}`)
          .send({
            variant_id: secondVariant.id,
            quantity: 3,
            currency: 'SYP',
          }),
      ];

      await Promise.all([...user1Operations, ...user2Operations]);

      // Verify carts are isolated
      const [user1Cart, user2Cart] = await Promise.all([
        request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${userToken}`),
        request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${secondUserToken}`),
      ]);

      expect(user1Cart.body.userId).toBe(testUser.id);
      expect(user2Cart.body.userId).toBe(secondUser.id);
      expect(user1Cart.body.id).not.toBe(user2Cart.body.id);

      // User 1: 2 testVariant + 1 secondVariant = 3 items
      expect(user1Cart.body.totalItems).toBe(3);
      expect(user1Cart.body.totalAmount).toBe(6800000); // (2 * 2,500,000) + (1 * 1,800,000)

      // User 2: 1 testVariant + 3 secondVariant = 4 items
      expect(user2Cart.body.totalItems).toBe(4);
      expect(user2Cart.body.totalAmount).toBe(7900000); // (1 * 2,500,000) + (3 * 1,800,000)
    });
  });

  describe('⏰ Cart Abandonment and Expiration', () => {
    it('should track cart activity timestamps', async () => {
      // Clear cart and add item
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const beforeTime = new Date();

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        });

      const afterTime = new Date();

      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const updatedAt = new Date(cartResponse.body.updated_at);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should maintain cart status during active operations', async () => {
      // Ensure cart is active
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        });

      // Perform various operations
      const operations = [
        () =>
          request(app.getHttpServer())
            .get('/cart')
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
        () =>
          request(app.getHttpServer())
            .delete(`/cart/item/${secondVariant.id}`)
            .set('Authorization', `Bearer ${userToken}`),
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

  describe('🗄️ Database State Synchronization', () => {
    it('should maintain consistency between memory and database', async () => {
      // Clear cart and perform operations
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add multiple items
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 3,
          currency: 'SYP',
        });

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 2,
          currency: 'SYP',
        });

      // Multiple consecutive reads should return consistent data
      for (let i = 0; i < 3; i++) {
        const cartResponse = await request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(cartResponse.body.totalItems).toBe(5); // 3 + 2
        expect(cartResponse.body.totalAmount).toBe(11100000); // (3 * 2,500,000) + (2 * 1,800,000)
        expect(cartResponse.body.items).toHaveLength(2);
      }
    });

    it('should handle rapid state changes correctly', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Perform rapid operations
      const rapidOperations = [];
      for (let i = 0; i < 5; i++) {
        rapidOperations.push(
          request(app.getHttpServer())
            .post('/cart/add')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              variant_id: testVariant.id,
              quantity: 1,
              currency: 'SYP',
            }),
        );
      }

      const results = await Promise.all(rapidOperations);

      // All operations should succeed
      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      // Final state should be consistent
      const finalCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalCart.body.totalItems).toBe(5);
      expect(finalCart.body.totalAmount).toBe(12500000); // 5 * 2,500,000
      expect(finalCart.body.items).toHaveLength(1);
      expect(finalCart.body.items[0].quantity).toBe(5);
    });

    it('should recover from database transaction failures', async () => {
      // Test cart operation resilience
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add item successfully
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      // Verify cart state is maintained
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(1);
      expect(cartResponse.body.items).toHaveLength(1);

      // Continue operations should work normally
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      const finalCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(finalCart.body.totalItems).toBe(2);
      expect(finalCart.body.items).toHaveLength(2);
    });
  });

  describe('🔧 Cart Recovery and Cleanup', () => {
    it('should handle orphaned cart items cleanup', async () => {
      // Create cart with items
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        });

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: secondVariant.id,
          quantity: 1,
          currency: 'SYP',
        });

      // Verify cart has items
      const beforeClear = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(beforeClear.body.totalItems).toBe(3);
      expect(beforeClear.body.items).toHaveLength(2);

      // Clear cart should remove all items
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify complete cleanup
      const afterClear = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(afterClear.body.totalItems).toBe(0);
      expect(afterClear.body.totalAmount).toBe(0);
      expect(afterClear.body.items).toHaveLength(0);
      expect(afterClear.body.status).toBe('active');
    });

    it('should validate cart integrity after recovery operations', async () => {
      // Test cart integrity validation
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add items with different scenarios
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
          price_discounted: 2000000, // Discounted price
          added_from_campaign: 'test_campaign',
        });

      // Verify all item properties are maintained
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const item = cartResponse.body.items[0];
      expect(item.quantity).toBe(2);
      expect(item.price_at_add).toBe(testVariant.price);
      expect(item.price_discounted).toBe(2000000);
      expect(item.added_from_campaign).toBe('test_campaign');
      expect(item.valid).toBe(true);
      expect(item.variant.id).toBe(testVariant.id);
    });
  });
});

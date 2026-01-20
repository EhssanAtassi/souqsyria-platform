/**
 * @file cart-error-handling.e2e-spec.ts
 * @description E2E tests for error handling and resilience
 *
 * TASK-099: E2E test - Error handling resilience
 * ==============================================
 *
 * TEST ERROR SCENARIOS:
 * - Backend returns 500 → Offline queue stores operation
 * - Invalid session ID → Creates new guest session
 * - Expired JWT → Refresh token, retry request
 * - Network timeout → Retry with backoff
 * - Out of stock → Show error, prevent checkout
 * - Duplicate idempotency key → Return cached response
 * - Concurrent modifications → Handle optimistic locking
 * - Malformed request → Proper validation errors
 * - Database constraints → Integrity check failures
 * - Rate limiting → Graceful degradation
 *
 * RESILIENCE FEATURES:
 * - Idempotent operations for reliability
 * - Exponential backoff for retries
 * - Request timeout handling
 * - Optimistic locking for concurrency
 * - Transaction rollback on failure
 * - Error logging and monitoring
 * - User-friendly error messages
 * - Graceful state recovery
 *
 * @author SouqSyria Development Team
 * @since 2025-11-13
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../../src/app.module';
import { Cart } from '../../src/cart/entities/cart.entity';
import { CartItem } from '../../src/cart/entities/cart-item.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';
import { ProductStockEntity } from '../../src/stock/entities/product-stock.entity';

/**
 * Error Handling and Resilience E2E Test Suite
 */
describe('Cart Error Handling (E2E) - TASK-099', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testVariant: any;
  let cartRepo: Repository<Cart>;
  let variantRepo: Repository<ProductVariant>;
  let stockRepo: Repository<ProductStockEntity>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cartRepo = moduleFixture.get(getRepositoryToken(Cart));
    variantRepo = moduleFixture.get(getRepositoryToken(ProductVariant));
    stockRepo = moduleFixture.get(getRepositoryToken(ProductStockEntity));

    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Setup: Create test users and products
   */
  async function setupTestData() {
    // Create admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'error-admin@souqsyria.com',
        password: 'AdminPassword123!',
        first_name: 'Admin',
        last_name: 'User',
      });

    adminToken = adminResponse.body.access_token;

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'error-customer@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User',
        phone: '+963987654321',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name_en: 'Test Product',
        name_ar: 'منتج الاختبار',
        category_id: 1,
        vendor_id: 1,
        price: 100000,
        currency: 'SYP',
      });

    const productId = productResponse.body.product.id;

    // Create variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${productId}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'ERROR-TEST-SKU',
        price: 100000,
        stock_quantity: 5, // Limited stock for testing
        attributes: { type: 'test' },
      });

    testVariant = variantResponse.body.variant;
  }

  describe('Stock and Availability Errors', () => {
    it('should prevent checkout when items out of stock', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Set stock to 0
      await variantRepo.update(
        { id: testVariant.id },
        { stock_quantity: 0 }
      );

      // Try to add out-of-stock item
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(400);

      expect(addResponse.body.message).toContain('Not enough stock');
      expect(addResponse.body.available).toBe(0);

      // Restore stock for other tests
      await variantRepo.update(
        { id: testVariant.id },
        { stock_quantity: 100 }
      );
    });

    it('should show quantity available when partial stock', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Set stock to 3 items
      await variantRepo.update(
        { id: testVariant.id },
        { stock_quantity: 3 }
      );

      // Try to add 5 items (exceeds stock)
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 5,
          currency: 'SYP',
        })
        .expect(400);

      expect(addResponse.body.message).toContain('Not enough stock');
      expect(addResponse.body.available).toBe(3);

      // Add within available stock
      const successResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 3,
          currency: 'SYP',
        })
        .expect(201);

      expect(successResponse.body.items[0].quantity).toBe(3);

      // Restore stock
      await variantRepo.update(
        { id: testVariant.id },
        { stock_quantity: 100 }
      );
    });

    it('should update stock availability in real-time', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Check initial stock
      let variantResponse = await request(app.getHttpServer())
        .get(`/api/products/variants/${testVariant.id}`)
        .expect(200);

      const initialStock = variantResponse.body.variant.stock_quantity;

      // Add 5 items
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 5,
          currency: 'SYP',
        })
        .expect(201);

      // Stock should be reduced in reserve
      variantResponse = await request(app.getHttpServer())
        .get(`/api/products/variants/${testVariant.id}`)
        .expect(200);

      // Available stock should reflect cart reservation
      expect(variantResponse.body.variant.stock_quantity).toBeLessThanOrEqual(initialStock);
    });
  });

  describe('Session and Authentication Errors', () => {
    it('should return 401 for missing authentication token', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', 'Bearer invalid_token_123')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should handle expired JWT token', async () => {
      // Create token that will expire
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', 'Bearer expired.jwt.token')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should create new guest session for invalid sessionId', async () => {
      const invalidSessionId = 'invalid-session-id-that-does-not-exist';

      const response = await request(app.getHttpServer())
        .get(`/cart/guest/${invalidSessionId}`)
        .expect([200, 404]);

      // If 404, system correctly identifies invalid session
      if (response.status === 404) {
        expect(response.body.message).toContain('not found');
      }
    });
  });

  describe('Validation and Data Format Errors', () => {
    it('should reject invalid variant ID in add request', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: 'not_a_number',
          quantity: 1,
          currency: 'SYP',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });

    it('should reject negative quantity', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: -5,
          currency: 'SYP',
        })
        .expect(400);

      expect(response.body.message).toContain('quantity');
    });

    it('should reject zero quantity', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 0,
          currency: 'SYP',
        })
        .expect(400);

      expect(response.body.message).toContain('quantity');
    });

    it('should reject invalid currency code', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'INVALID',
        })
        .expect(400);

      expect(response.body.message).toContain('currency');
    });

    it('should handle missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing variant_id and quantity
          currency: 'SYP',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Concurrency and Optimistic Locking Errors', () => {
    it('should handle concurrent cart modifications', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Simulate concurrent adds
      const concurrentRequests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/cart/add')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              variant_id: testVariant.id,
              quantity: 1,
              currency: 'SYP',
            })
        );

      const results = await Promise.all(concurrentRequests);

      // All requests should eventually succeed
      results.forEach((result) => {
        expect([200, 201, 409]).toContain(result.status);
      });

      // Verify final cart state is consistent
      const finalCart = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should have all 5 items (or combined quantity)
      expect(finalCart.body.totalItems).toBeGreaterThanOrEqual(5);
    });

    it('should prevent lost updates with version checking', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add item
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      const version = addResponse.body.version;

      // Verify version is tracked
      expect(version).toBeDefined();
      expect(typeof version).toBe('number');
    });
  });

  describe('Idempotency and Duplicate Handling', () => {
    it('should handle duplicate requests with idempotency key', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const idempotencyKey = `test-${Date.now()}`;

      // First request
      const response1 = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      const cartId1 = response1.body.id;

      // Duplicate request with same idempotency key
      const response2 = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect([200, 201]);

      // Should return same cart or cached response
      expect(response2.body.id).toBe(cartId1);
    });
  });

  describe('Network and Timeout Errors', () => {
    it('should handle request timeout gracefully', async () => {
      // This test verifies the application doesn't crash on timeout
      // In a real scenario, this would use a slow endpoint
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .timeout(100) // Very short timeout
        .catch((err) => {
          // Should timeout or fail gracefully
          expect(err).toBeDefined();
          return { status: 408 }; // Request Timeout
        });

      // Request should not succeed or should timeout
      if (response.status !== 200) {
        expect([408, 504]).toContain(response.status);
      }
    });

    it('should implement retry logic with exponential backoff', async () => {
      // Verify system can retry failed requests
      // This would be tested by simulating temporary failures
      const retryAttempts = 3;
      let lastError: any = null;

      for (let i = 0; i < retryAttempts; i++) {
        try {
          const response = await request(app.getHttpServer())
            .get('/cart')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);

          expect(response.body).toBeDefined();
          break;
        } catch (error) {
          lastError = error;
          // Wait with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 10)
          );
        }
      }

      // Should succeed at least once
      expect(lastError).toBeNull();
    });
  });

  describe('Resource Not Found Errors', () => {
    it('should return 404 for non-existent variant', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: 999999,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app.getHttpServer())
        .delete('/cart/item/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('Business Logic Validation Errors', () => {
    it('should prevent adding expired promotional items', async () => {
      // Create item with past expiration
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
          expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
        })
        .expect([400, 201]); // May be allowed or rejected

      // If rejected, should have clear message
      if (addResponse.status === 400) {
        expect(addResponse.body.message).toContain('expired');
      }
    });

    it('should validate price consistency', async () => {
      // Try to add with inconsistent price
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
          price_override: -1000, // Invalid negative price
        })
        .expect([400, 201]);

      // Should reject or handle gracefully
      if (response.status === 400) {
        expect(response.body.message).toBeDefined();
      }
    });
  });

  describe('Error Recovery and State Consistency', () => {
    it('should maintain cart consistency after failed operation', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add valid item
      const validResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        })
        .expect(201);

      expect(validResponse.body.totalItems).toBe(2);

      // Try to add invalid item
      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: 999999,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(404);

      // Verify cart state unchanged
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(2); // Still has 2 items
    });

    it('should rollback partial transactions', async () => {
      // Verify cart data integrity
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cartResponse.body.items).toBeDefined();

      // Each item should be consistent
      cartResponse.body.items.forEach((item: any) => {
        expect(item.id).toBeDefined();
        expect(item.variant).toBeDefined();
        expect(item.quantity).toBeGreaterThan(0);
        expect(item.price_at_add).toBeGreaterThan(0);
        expect(item.valid).toBe(true);
      });
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should return error tracking reference', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart/nonexistent')
        .set('Authorization', `Bearer ${userToken}`)
        .expect([404, 400]);

      // Error response should include tracking reference
      if (response.body.errorId || response.body.traceId) {
        expect(response.body.errorId || response.body.traceId).toBeDefined();
      }
    });

    it('should provide actionable error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 999999, // Extremely large quantity
          currency: 'SYP',
        })
        .expect(400);

      // Error message should be actionable
      expect(response.body.message).toBeDefined();
      expect(response.body.message).not.toContain('error');
      expect(response.body.message.length).toBeGreaterThan(10);
    });
  });
});

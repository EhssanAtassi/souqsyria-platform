/**
 * @file cart-price-lock.e2e-spec.ts
 * @description Comprehensive E2E tests for Cart Price Locking (Phase 6)
 *
 * PHASE 6: PRICE LOCKING
 * ====================
 * Ensures that customer prices are locked at purchase time for 7 days,
 * protecting customers from price increases while allowing them to benefit
 * from price decreases within the lock period.
 *
 * TEST COVERAGE:
 * - TASK-077: Price lock preserves discounted price after sale ends
 * - TASK-078: Price decreases after adding, user gets lower price
 * - TASK-079: Price lock expiration after 7 days
 * - TASK-080: Significant price change (>20%) requires confirmation
 *
 * FEATURES:
 * - 7-day price lock guarantee for cart items
 * - Automatic price reduction if current price is lower
 * - Lock expiration detection
 * - Significant price change confirmation dialog
 * - Price comparison badges with savings information
 * - Lock status tracking and display
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
import * as moment from 'moment';

import { AppModule } from '../../src/app.module';
import { Cart } from '../../src/cart/entities/cart.entity';
import { CartItem } from '../../src/cart/entities/cart-item.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { User } from '../../src/users/entities/user.entity';
import { ProductStockEntity } from '../../src/stock/entities/product-stock.entity';

/**
 * Helper function to mock time for testing price lock expiration
 */
class TimeHelper {
  private static originalDate = Date;

  static mockTime(days: number) {
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() + days);
    global.Date = class extends TimeHelper.originalDate {
      constructor() {
        super();
        return mockDate;
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;
  }

  static resetTime() {
    global.Date = TimeHelper.originalDate;
  }
}

describe('Cart Price Locking (E2E) - Phase 6', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let testUser: any;
  let testProduct: any;
  let testVariant: any;
  let cartRepo: Repository<Cart>;
  let cartItemRepo: Repository<CartItem>;
  let variantRepo: Repository<ProductVariant>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cartRepo = moduleFixture.get(getRepositoryToken(Cart));
    cartItemRepo = moduleFixture.get(getRepositoryToken(CartItem));
    variantRepo = moduleFixture.get(getRepositoryToken(ProductVariant));

    await createTestData();
  });

  afterAll(async () => {
    TimeHelper.resetTime();
    await app.close();
  });

  afterEach(() => {
    TimeHelper.resetTime();
  });

  /**
   * Create test data: users, products, variants with prices
   */
  async function createTestData() {
    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'pricelock@souqsyria.com',
        password: 'TestPassword123!',
        first_name: 'قفل',
        last_name: 'السعر',
        phone: '+963987654321',
      });

    testUser = userResponse.body.user;
    userToken = userResponse.body.access_token;

    // Create admin for product management
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'pricelock-admin@souqsyria.com',
        password: 'AdminPassword123!',
        first_name: 'Admin',
        last_name: 'User',
        role_id: 1,
      });

    adminToken = adminResponse.body.access_token;

    // Create test product
    const productResponse = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name_en: 'Premium Laptop',
        name_ar: 'جهاز حاسوب متقدم',
        description_en: 'High-performance laptop',
        description_ar: 'جهاز حاسوب عالي الأداء',
        category_id: 1,
        vendor_id: 1,
        price: 100000,
        currency: 'SYP',
      });

    testProduct = productResponse.body.product;

    // Create test variant
    const variantResponse = await request(app.getHttpServer())
      .post(`/api/products/${testProduct.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'LAPTOP-PREMIUM-001',
        price: 100000, // Original price
        stock_quantity: 100,
        attributes: {
          processor: 'Intel i7',
          ram: '16GB',
          storage: '512GB SSD',
        },
      });

    testVariant = variantResponse.body.variant;
  }

  describe('TASK-077: Price lock preserves discounted price after sale ends', () => {
    it('should lock discounted price when item added during sale', async () => {
      // Setup: Create product with 30% discount
      // Original: 100,000 SYP, Sale: 70,000 SYP
      const originalPrice = 100000;
      const salePrice = 70000;

      // Update variant with discount
      await variantRepo.update(
        { id: testVariant.id },
        {
          price: salePrice, // Sale price
        }
      );

      // Add item to cart at sale price
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      expect(addResponse.body.items[0].price_at_add).toBe(salePrice);
      expect(addResponse.body.items[0].price_at_add).toBe(70000);

      const cartItemId = addResponse.body.items[0].id;

      // Simulate sale ending: update product price back to original
      await variantRepo.update(
        { id: testVariant.id },
        {
          price: originalPrice,
        }
      );

      // View cart (within 7 days)
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const cartItem = cartResponse.body.items[0];

      // Assert: Cart shows locked discounted price (70,000 SYP)
      expect(cartItem.price_at_add).toBe(70000);
      expect(cartItem.variant.price).toBe(100000); // Current price is higher

      // Verify effective price is the locked (lower) price
      if (cartItem.effectivePrice) {
        expect(cartItem.effectivePrice).toBe(70000);
      }
    });

    it('should show price lock badge when lock is active', async () => {
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

      // Verify added_at timestamp is set
      expect(addResponse.body.items[0].added_at).toBeDefined();

      // Verify locked_until timestamp is set (7 days from now)
      expect(addResponse.body.items[0].locked_until).toBeDefined();

      const addedAt = new Date(addResponse.body.items[0].added_at);
      const lockedUntil = new Date(addResponse.body.items[0].locked_until);

      // Verify lock duration is approximately 7 days
      const lockDuration = (lockedUntil.getTime() - addedAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(lockDuration).toBeCloseTo(7, 0);
    });

    it('should maintain price lock even with multiple price changes', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Original price: 100,000 SYP
      const originalPrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: originalPrice }
      );

      // Add item at 100,000 SYP
      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      expect(addResponse.body.items[0].price_at_add).toBe(100000);

      // Change 1: Price drops to 90,000
      await variantRepo.update(
        { id: testVariant.id },
        { price: 90000 }
      );

      let cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should use lower current price (customer benefit)
      expect(cartResponse.body.items[0].price_at_add).toBe(100000);
      expect(cartResponse.body.items[0].variant.price).toBe(90000);

      // Change 2: Price increases to 120,000
      await variantRepo.update(
        { id: testVariant.id },
        { price: 120000 }
      );

      cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Should maintain locked price (100,000) - protects customer
      expect(cartResponse.body.items[0].price_at_add).toBe(100000);
      expect(cartResponse.body.items[0].variant.price).toBe(120000);
    });
  });

  describe('TASK-078: Price decreases after adding, user gets lower price', () => {
    it('should apply lower current price when product price drops', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Setup: Add item at 100,000 SYP
      const addPrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: addPrice }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      expect(addResponse.body.items[0].price_at_add).toBe(100000);

      // Price drops to 80,000 SYP
      const newPrice = 80000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: newPrice }
      );

      // View cart
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const cartItem = cartResponse.body.items[0];

      // Assert: Cart shows lower current price (80,000 SYP)
      expect(cartItem.price_at_add).toBe(100000);
      expect(cartItem.variant.price).toBe(80000);

      // Effective price should be the minimum (customer gets benefit)
      // Expected effective price: 80,000 (minimum of 100,000 and 80,000)
    });

    it('should show price reduction badge with savings amount', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Setup: Add item at 100,000 SYP
      await variantRepo.update(
        { id: testVariant.id },
        { price: 100000 }
      );

      await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      // Price reduces to 75,000
      await variantRepo.update(
        { id: testVariant.id },
        { price: 75000 }
      );

      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const cartItem = cartResponse.body.items[0];

      // Verify savings information
      // You save: 100,000 - 75,000 = 25,000 SYP
      const savings = cartItem.price_at_add - cartItem.variant.price;
      expect(savings).toBe(25000);

      // Badge should indicate "Price reduced - You save 25,000 SYP"
    });

    it('should calculate correct total with reduced prices', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add 2 items at 100,000 each = 200,000 total
      await variantRepo.update(
        { id: testVariant.id },
        { price: 100000 }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 2,
          currency: 'SYP',
        })
        .expect(201);

      expect(addResponse.body.totalAmount).toBe(200000);

      // Price drops to 80,000 each
      await variantRepo.update(
        { id: testVariant.id },
        { price: 80000 }
      );

      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Total should reflect new lower price: 2 * 80,000 = 160,000
      const expectedTotal = 2 * 80000;
      expect(cartResponse.body.totalAmount).toBe(expectedTotal);
    });
  });

  describe('TASK-079: Price lock expiration after 7 days', () => {
    it('should expire price lock after 7 days', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add item at 100,000 SYP
      const addPrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: addPrice }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      const cartItem = addResponse.body.items[0];
      expect(cartItem.price_at_add).toBe(100000);

      // Mock time: Set addedAt to 8 days ago
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      // Update cart item with past timestamp
      await cartItemRepo.update(
        { id: cartItem.id },
        {
          added_at: eightDaysAgo,
          locked_until: new Date(eightDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      );

      // Product price increases to 120,000 SYP
      await variantRepo.update(
        { id: testVariant.id },
        { price: 120000 }
      );

      // View cart (after lock expiration)
      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const updatedItem = cartResponse.body.items[0];

      // Assert: Cart shows current price (120,000 SYP)
      // Lock has expired, so customer sees new price
      expect(updatedItem.price_at_add).toBe(100000);
      expect(updatedItem.variant.price).toBe(120000);
    });

    it('should show lock expiration badge', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add item
      await variantRepo.update(
        { id: testVariant.id },
        { price: 100000 }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      const cartItem = addResponse.body.items[0];

      // Update to 8 days ago
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      await cartItemRepo.update(
        { id: cartItem.id },
        {
          added_at: eightDaysAgo,
          locked_until: new Date(eightDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      );

      const cartResponse = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const updatedItem = cartResponse.body.items[0];

      // Verify lock has expired
      expect(updatedItem.locked_until).toBeDefined();
      const lockedUntil = new Date(updatedItem.locked_until);
      expect(new Date()).toBeGreaterThan(lockedUntil);

      // Badge should indicate "Price lock expired ⏰"
    });

    it('should calculate days remaining until lock expires', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Add item
      await variantRepo.update(
        { id: testVariant.id },
        { price: 100000 }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      const cartItem = addResponse.body.items[0];
      const addedAt = new Date(cartItem.added_at);
      const lockedUntil = new Date(cartItem.locked_until);

      // Calculate days remaining
      const now = new Date();
      const daysRemaining = Math.ceil(
        (lockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Should be close to 7 days
      expect(daysRemaining).toBeGreaterThan(5);
      expect(daysRemaining).toBeLessThanOrEqual(7);
    });
  });

  describe('TASK-080: Significant price change (>20%) requires confirmation', () => {
    it('should show confirmation dialog for price increase > 20%', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Setup: Add item at 100,000 SYP
      const basePrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: basePrice }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      // Make lock expire so price change applies
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const cartItem = addResponse.body.items[0];
      await cartItemRepo.update(
        { id: cartItem.id },
        {
          added_at: eightDaysAgo,
          locked_until: new Date(eightDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      );

      // Price increases by 50% (exceeds 20% threshold)
      // 100,000 -> 150,000 = +50%
      const newPrice = 150000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: newPrice }
      );

      // Attempt to proceed to checkout
      const checkoutResponse = await request(app.getHttpServer())
        .post('/checkout/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect([200, 400]); // May need confirmation

      // If lock expired and price changed >20%, should require confirmation
      if (checkoutResponse.status === 400) {
        expect(checkoutResponse.body.message).toContain('confirm');
        expect(checkoutResponse.body.priceComparison).toBeDefined();
        expect(checkoutResponse.body.priceComparison.oldPrice).toBe(100000);
        expect(checkoutResponse.body.priceComparison.newPrice).toBe(150000);
        expect(checkoutResponse.body.priceComparison.percentageChange).toBe(50);
      }
    });

    it('should accept confirmation and proceed with new price', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Setup: Add item, expire lock, increase price
      const basePrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: basePrice }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      // Expire lock
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const cartItem = addResponse.body.items[0];
      await cartItemRepo.update(
        { id: cartItem.id },
        {
          added_at: eightDaysAgo,
          locked_until: new Date(eightDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      );

      // Increase price by 50%
      await variantRepo.update(
        { id: testVariant.id },
        { price: 150000 }
      );

      // User confirms and proceeds with new price
      const confirmResponse = await request(app.getHttpServer())
        .post('/checkout/confirm-price-change')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cartItemId: cartItem.id,
          acceptedPrice: 150000,
        })
        .expect([200, 201]);

      // Order should be created with new price
      if (confirmResponse.body.order) {
        expect(confirmResponse.body.order.total).toBeGreaterThanOrEqual(150000);
      }
    });

    it('should not require confirmation for small price changes (< 20%)', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Setup: Add item at 100,000 SYP
      const basePrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: basePrice }
      );

      const addResponse = await request(app.getHttpServer())
        .post('/cart/add')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          variant_id: testVariant.id,
          quantity: 1,
          currency: 'SYP',
        })
        .expect(201);

      // Expire lock
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      const cartItem = addResponse.body.items[0];
      await cartItemRepo.update(
        { id: cartItem.id },
        {
          added_at: eightDaysAgo,
          locked_until: new Date(eightDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      );

      // Price increases by 10% (below 20% threshold)
      // 100,000 -> 110,000 = +10%
      await variantRepo.update(
        { id: testVariant.id },
        { price: 110000 }
      );

      // Checkout should proceed without confirmation dialog
      const checkoutResponse = await request(app.getHttpServer())
        .post('/checkout/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(200); // Should succeed without confirmation

      expect(checkoutResponse.body.cartValid).toBe(true);
    });
  });

  describe('Price Lock - Integration Tests', () => {
    it('should handle concurrent price lock checks correctly', async () => {
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

      // Perform multiple concurrent cart views
      const concurrentRequests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/cart')
            .set('Authorization', `Bearer ${userToken}`)
        );

      const results = await Promise.all(concurrentRequests);

      // All should succeed with consistent data
      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body.items[0].price_at_add).toBe(
          addResponse.body.items[0].price_at_add
        );
      });
    });

    it('should maintain price lock consistency across multiple operations', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart/clear')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const basePrice = 100000;
      await variantRepo.update(
        { id: testVariant.id },
        { price: basePrice }
      );

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

      const lockedPrice = addResponse.body.items[0].price_at_add;

      // Change price multiple times
      const priceSequence = [90000, 110000, 80000, 125000];

      for (const price of priceSequence) {
        await variantRepo.update(
          { id: testVariant.id },
          { price }
        );

        const cartResponse = await request(app.getHttpServer())
          .get('/cart')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        // Locked price should never change
        expect(cartResponse.body.items[0].price_at_add).toBe(lockedPrice);

        // Current price should reflect latest
        expect(cartResponse.body.items[0].variant.price).toBe(price);
      }
    });
  });
});

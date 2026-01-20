/**
 * @file cart-integration.e2e-spec.ts
 * @description Comprehensive E2E tests for Guest Cart Integration
 *
 * OVERVIEW:
 * This test suite validates the complete guest cart functionality including:
 * - Cart persistence across browser restarts (session recovery)
 * - Quantity updates with page refresh validation
 * - Dynamic header cart count updates during navigation
 * - Duplicate product handling (quantity increment vs new items)
 * - Guest session management and lifecycle
 * - Error handling and edge cases
 *
 * TEST COVERAGE:
 * - TASK-038: Cart persistence after browser restart
 * - TASK-039: Cart quantity updates persist across refresh
 * - TASK-040: Header cart count updates on navigation
 * - TASK-041: Adding duplicate products increases quantity
 * - Cookie-based session management
 * - Multi-product cart scenarios
 * - Stock validation for guest carts
 * - Price lock guarantee enforcement
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
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
import { GuestSession } from '../../src/cart/entities/guest-session.entity';
import { ProductVariant } from '../../src/products/variants/entities/product-variant.entity';
import { ProductEntity } from '../../src/products/entities/product.entity';
import { ProductStockEntity } from '../../src/stock/entities/product-stock.entity';

/**
 * Guest Cart Integration E2E Test Suite
 *
 * Validates all guest shopping cart functionality including persistence,
 * synchronization, and multi-product handling scenarios.
 */
describe('Guest Cart Integration (E2E)', () => {
  let app: INestApplication;

  // Repository instances for data validation
  let cartRepository: Repository<Cart>;
  let cartItemRepository: Repository<CartItem>;
  let guestSessionRepository: Repository<GuestSession>;
  let productVariantRepository: Repository<ProductVariant>;
  let productRepository: Repository<ProductEntity>;
  let productStockRepository: Repository<ProductStockEntity>;

  // Test data holders
  let testProduct1: ProductEntity;
  let testProduct2: ProductEntity;
  let testProduct3: ProductEntity;
  let testVariant1: ProductVariant;
  let testVariant2: ProductVariant;
  let testVariant3: ProductVariant;
  let testStock1: ProductStockEntity;
  let testStock2: ProductStockEntity;
  let testStock3: ProductStockEntity;

  // Guest session identifiers
  let guestSessionId1: string;
  let guestSessionId2: string;
  let guestSessionToken1: string;
  let guestSessionToken2: string;

  /**
   * SETUP - Initialize test application and create test data
   *
   * Steps:
   * 1. Create NestJS test module with AppModule
   * 2. Initialize HTTP application
   * 3. Set up database repositories
   * 4. Seed test products with variants and stock
   * 5. Create initial guest sessions
   */
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Initialize repository instances
    cartRepository = moduleFixture.get(getRepositoryToken(Cart));
    cartItemRepository = moduleFixture.get(getRepositoryToken(CartItem));
    guestSessionRepository = moduleFixture.get(getRepositoryToken(GuestSession));
    productVariantRepository = moduleFixture.get(
      getRepositoryToken(ProductVariant),
    );
    productRepository = moduleFixture.get(getRepositoryToken(ProductEntity));
    productStockRepository = moduleFixture.get(
      getRepositoryToken(ProductStockEntity),
    );

    // Create test data
    await seedTestData();
  });

  /**
   * CLEANUP - Close application after tests complete
   */
  afterAll(async () => {
    await app.close();
  });

  /**
   * CLEANUP - Clear cart data between test scenarios
   */
  afterEach(async () => {
    // Clear carts but keep test data for next scenario
    await cartItemRepository.delete({});
    await cartRepository.delete({});
  });

  // ============================================================================
  // TEST SCENARIO 1: Cart Persistence After Browser Restart
  // ============================================================================
  // TASK-038: Guest adds items, cart persists after browser restart
  // Scenario 1: POST 3 items as guest → GET cart → Verify 3 items returned
  // Scenario 2: POST item → Simulate browser close → GET cart → Verify item present
  // ============================================================================

  describe('TASK-038: Cart Persistence After Browser Restart', () => {
    /**
     * Scenario 1: Add 3 items and verify all are returned
     *
     * Steps:
     * 1. Create guest session
     * 2. Add 3 different products to cart
     * 3. Retrieve cart using session ID
     * 4. Verify all 3 items are returned
     * 5. Verify quantities match what was added
     * 6. Verify cart totals are calculated correctly
     */
    it('should persist 3 items in cart and return all items on retrieval', async () => {
      // Scenario 1a: Create guest session
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Scenario 1b: Add 3 items via POST
      const addItemsResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [
            { variantId: testVariant1.id, quantity: 2 },
            { variantId: testVariant2.id, quantity: 1 },
            { variantId: testVariant3.id, quantity: 3 },
          ],
        })
        .expect(201);

      expect(addItemsResponse.body).toBeDefined();
      expect(addItemsResponse.body.id).toBeDefined();
      const cartId = addItemsResponse.body.id;

      // Scenario 1c: Retrieve cart by session ID
      const getCartResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      // Scenario 1d: Verify all 3 items returned
      expect(getCartResponse.body).toBeDefined();
      expect(getCartResponse.body.items).toHaveLength(3);
      expect(getCartResponse.body.sessionId).toBe(sessionId);

      // Scenario 1e: Verify quantities
      const items = getCartResponse.body.items;
      expect(items[0].quantity).toBe(2);
      expect(items[1].quantity).toBe(1);
      expect(items[2].quantity).toBe(3);

      // Scenario 1f: Verify cart totals
      expect(getCartResponse.body.totalItems).toBe(6); // 2+1+3
      expect(parseFloat(getCartResponse.body.totalAmount)).toBeGreaterThan(0);
      expect(getCartResponse.body.currency).toBe('SYP');
      expect(getCartResponse.body.status).toBe('active');
    });

    /**
     * Scenario 2: Simulate browser close and verify cart recovery
     *
     * Steps:
     * 1. Create guest session
     * 2. Add item to cart
     * 3. Simulate browser close (no direct action needed)
     * 4. "Reopen browser" by retrieving cart with same session ID
     * 5. Verify item still present and quantity unchanged
     * 6. Verify cart state matches original
     */
    it('should recover cart after simulated browser restart with same session', async () => {
      // Scenario 2a: Create guest session
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Scenario 2b: Add item to cart
      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 5 }],
        })
        .expect(201);

      const originalCart = addResponse.body;
      const originalItemCount = originalCart.items.length;
      const originalQuantity = originalCart.items[0].quantity;

      // Scenario 2c: "Close browser" - just get fresh reference
      // Scenario 2d: Reopen browser and retrieve cart
      const refreshResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      // Scenario 2e: Verify item still present
      expect(refreshResponse.body.items).toHaveLength(originalItemCount);
      expect(refreshResponse.body.items[0].quantity).toBe(originalQuantity);
      expect(refreshResponse.body.items[0].quantity).toBe(5);

      // Scenario 2f: Verify cart state unchanged
      expect(refreshResponse.body.totalItems).toBe(5);
      expect(refreshResponse.body.status).toBe('active');
      expect(refreshResponse.body.sessionId).toBe(sessionId);
    });

    /**
     * Scenario 3: Multiple sessions maintain separate carts
     *
     * Validates isolation between different guest sessions
     */
    it('should maintain separate carts for different guest sessions', async () => {
      // Create two different guest sessions
      const session1 = await guestSessionRepository.save(new GuestSession());
      const session2 = await guestSessionRepository.save(new GuestSession());

      // Add different items to each cart
      const cart1Response = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${session1.id}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 2 }],
        })
        .expect(201);

      const cart2Response = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${session2.id}`)
        .send({
          items: [
            { variantId: testVariant2.id, quantity: 3 },
            { variantId: testVariant3.id, quantity: 1 },
          ],
        })
        .expect(201);

      // Verify cart isolation
      const retrieveCart1 = await request(app.getHttpServer())
        .get(`/api/cart/guest/${session1.id}`)
        .expect(200);

      const retrieveCart2 = await request(app.getHttpServer())
        .get(`/api/cart/guest/${session2.id}`)
        .expect(200);

      expect(retrieveCart1.body.items).toHaveLength(1);
      expect(retrieveCart1.body.items[0].variant.id).toBe(testVariant1.id);

      expect(retrieveCart2.body.items).toHaveLength(2);
      expect(retrieveCart2.body.totalItems).toBe(4);
    });
  });

  // ============================================================================
  // TEST SCENARIO 2: Guest Cart Quantity Updates Persist
  // ============================================================================
  // TASK-039: Guest cart quantity updates persist
  // Scenario: Add product → Update quantity to 5 → Refresh page → Verify quantity = 5
  // ============================================================================

  describe('TASK-039: Guest Cart Quantity Updates Persist', () => {
    /**
     * Scenario 1: Add product and update quantity
     *
     * Steps:
     * 1. Create guest session
     * 2. Add product with initial quantity
     * 3. Update quantity
     * 4. Refresh cart (simulate page refresh)
     * 5. Verify new quantity persists
     */
    it('should persist quantity changes across page refresh', async () => {
      // Scenario 1a: Create guest session and add item
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      const initialAddResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 2 }],
        })
        .expect(201);

      const cartItem = initialAddResponse.body.items[0];
      const itemId = cartItem.id;

      // Scenario 1b: Update quantity to 5
      const updateResponse = await request(app.getHttpServer())
        .put(`/api/cart/guest/${sessionId}/items/${itemId}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(updateResponse.body.quantity).toBe(5);

      // Scenario 1c: Refresh cart (simulate page refresh)
      const refreshResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      // Scenario 1d: Verify quantity = 5
      expect(refreshResponse.body.items[0].quantity).toBe(5);
      expect(refreshResponse.body.totalItems).toBe(5);
    });

    /**
     * Scenario 2: Update quantity multiple times
     *
     * Validates that multiple updates are preserved
     */
    it('should persist multiple quantity updates', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add initial item
      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      const itemId = addResponse.body.items[0].id;

      // Update to 3
      await request(app.getHttpServer())
        .put(`/api/cart/guest/${sessionId}/items/${itemId}`)
        .send({ quantity: 3 })
        .expect(200);

      // Verify refresh
      let refreshResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      expect(refreshResponse.body.items[0].quantity).toBe(3);

      // Update to 7
      await request(app.getHttpServer())
        .put(`/api/cart/guest/${sessionId}/items/${itemId}`)
        .send({ quantity: 7 })
        .expect(200);

      // Verify final state
      refreshResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      expect(refreshResponse.body.items[0].quantity).toBe(7);
      expect(refreshResponse.body.totalItems).toBe(7);
    });

    /**
     * Scenario 3: Quantity update respects stock limits
     *
     * Validates business rule enforcement during updates
     */
    it('should reject quantity updates exceeding available stock', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      const itemId = addResponse.body.items[0].id;

      // Attempt update beyond stock
      await request(app.getHttpServer())
        .put(`/api/cart/guest/${sessionId}/items/${itemId}`)
        .send({ quantity: 1000 }) // Exceeds available stock
        .expect(400);

      // Verify original quantity unchanged
      const refreshResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      expect(refreshResponse.body.items[0].quantity).toBe(1);
    });

    /**
     * Scenario 4: Setting quantity to 0 removes item
     */
    it('should remove item when quantity set to 0', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 3 }],
        })
        .expect(201);

      const itemId = addResponse.body.items[0].id;

      // Update to 0
      await request(app.getHttpServer())
        .put(`/api/cart/guest/${sessionId}/items/${itemId}`)
        .send({ quantity: 0 })
        .expect(200);

      // Verify item removed
      const refreshResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      expect(refreshResponse.body.items).toHaveLength(0);
      expect(refreshResponse.body.totalItems).toBe(0);
    });
  });

  // ============================================================================
  // TEST SCENARIO 3: Guest Cart Navigation Header Count Updates
  // ============================================================================
  // TASK-040: Guest cart navigation (header count updates)
  // Scenario: Add item → Navigate to homepage → Verify header cart count = 1
  // ============================================================================

  describe('TASK-040: Guest Cart Header Count Updates', () => {
    /**
     * Scenario 1: Add item and verify header count endpoint
     *
     * Steps:
     * 1. Create guest session
     * 2. Add item to cart
     * 3. Call cart summary endpoint for header
     * 4. Verify item count = 1
     */
    it('should update header cart count when item added', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add single item
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      // Get cart for header display (simplified endpoint)
      const cartResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      // Verify header can display correct count
      expect(cartResponse.body.totalItems).toBe(1);
      expect(cartResponse.body.items).toHaveLength(1);
    });

    /**
     * Scenario 2: Header count reflects multiple items
     */
    it('should reflect accurate item count in header with multiple items', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add 3 items with different quantities
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [
            { variantId: testVariant1.id, quantity: 2 },
            { variantId: testVariant2.id, quantity: 3 },
            { variantId: testVariant3.id, quantity: 1 },
          ],
        })
        .expect(201);

      const cartResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      // Header should show total items (not item count)
      expect(cartResponse.body.totalItems).toBe(6); // 2+3+1
      expect(cartResponse.body.items).toHaveLength(3);
    });

    /**
     * Scenario 3: Header count updates after item removal
     */
    it('should update header count after removing item', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add 2 items
      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [
            { variantId: testVariant1.id, quantity: 2 },
            { variantId: testVariant2.id, quantity: 3 },
          ],
        })
        .expect(201);

      expect(addResponse.body.totalItems).toBe(5);

      // Remove first item
      const firstItemId = addResponse.body.items[0].id;
      await request(app.getHttpServer())
        .delete(`/api/cart/guest/${sessionId}/items/${firstItemId}`)
        .expect(200);

      // Verify updated count
      const cartResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(3);
      expect(cartResponse.body.items).toHaveLength(1);
    });

    /**
     * Scenario 4: Header count shows 0 for empty cart
     */
    it('should show 0 items in header for empty cart', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Get empty cart
      const cartResponse = await request(app.getHttpServer())
        .get(`/api/cart/guest/${sessionId}`)
        .expect(200);

      expect(cartResponse.body.totalItems).toBe(0);
      expect(cartResponse.body.items).toHaveLength(0);
    });
  });

  // ============================================================================
  // TEST SCENARIO 4: Adding Duplicate Products Increases Quantity
  // ============================================================================
  // TASK-041: Adding duplicate product increases quantity
  // Scenario: Add product A → Add product A again → Verify quantity = 2, not 2 items
  // ============================================================================

  describe('TASK-041: Adding Duplicate Products Increases Quantity', () => {
    /**
     * Scenario 1: Add same product twice increases quantity
     *
     * Steps:
     * 1. Create guest session
     * 2. Add product with quantity 1
     * 3. Add same product again with quantity 1
     * 4. Verify items array has 1 entry (not 2)
     * 5. Verify quantity = 2
     */
    it('should increase quantity instead of creating duplicate item', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Scenario 1a: Add product with quantity 1
      const firstAddResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      expect(firstAddResponse.body.items).toHaveLength(1);
      expect(firstAddResponse.body.items[0].quantity).toBe(1);
      expect(firstAddResponse.body.totalItems).toBe(1);

      // Scenario 1b: Add same product again
      const secondAddResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      // Scenario 1c: Verify quantity = 2, not 2 items
      expect(secondAddResponse.body.items).toHaveLength(1);
      expect(secondAddResponse.body.items[0].quantity).toBe(2);
      expect(secondAddResponse.body.totalItems).toBe(2);
    });

    /**
     * Scenario 2: Multiple adds of same product with different quantities
     */
    it('should accumulate quantities correctly with multiple adds', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add product A with quantity 2
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 2 }],
        })
        .expect(201);

      // Add product A with quantity 3
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 3 }],
        })
        .expect(201);

      // Add product A with quantity 1
      const finalResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      // Total should be 2+3+1 = 6
      expect(finalResponse.body.items).toHaveLength(1);
      expect(finalResponse.body.items[0].quantity).toBe(6);
      expect(finalResponse.body.totalItems).toBe(6);
    });

    /**
     * Scenario 3: Mixed products with duplicates
     *
     * Validates that only duplicate products are merged
     */
    it('should merge only duplicate products while keeping unique ones separate', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add products A, B, C
      const firstResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [
            { variantId: testVariant1.id, quantity: 1 },
            { variantId: testVariant2.id, quantity: 1 },
            { variantId: testVariant3.id, quantity: 1 },
          ],
        })
        .expect(201);

      expect(firstResponse.body.items).toHaveLength(3);

      // Add product A and B again
      const secondResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [
            { variantId: testVariant1.id, quantity: 2 },
            { variantId: testVariant2.id, quantity: 1 },
          ],
        })
        .expect(201);

      // Should still have 3 unique items
      expect(secondResponse.body.items).toHaveLength(3);

      // Verify quantities
      const variant1Item = secondResponse.body.items.find(
        (item) => item.variant.id === testVariant1.id,
      );
      const variant2Item = secondResponse.body.items.find(
        (item) => item.variant.id === testVariant2.id,
      );
      const variant3Item = secondResponse.body.items.find(
        (item) => item.variant.id === testVariant3.id,
      );

      expect(variant1Item.quantity).toBe(3); // 1 + 2
      expect(variant2Item.quantity).toBe(2); // 1 + 1
      expect(variant3Item.quantity).toBe(1); // unchanged
      expect(secondResponse.body.totalItems).toBe(6); // 3+2+1
    });

    /**
     * Scenario 4: Adding duplicate up to stock limit
     */
    it('should respect stock limit when adding duplicates', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Add product at near-limit quantity
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 48 }],
        })
        .expect(201);

      // Try to add more
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 5 }], // Would exceed 50 max
        })
        .expect(400); // Should fail due to quantity limit
    });
  });

  // ============================================================================
  // TEST SCENARIO 5: Error Handling and Edge Cases
  // ============================================================================

  describe('Error Handling and Edge Cases', () => {
    /**
     * Invalid session ID handling
     */
    it('should return 404 for non-existent guest cart', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api/cart/guest/${fakeSessionId}`)
        .expect(404);
    });

    /**
     * Invalid variant handling
     */
    it('should reject adding non-existent variant', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: 99999, quantity: 1 }],
        })
        .expect(400);
    });

    /**
     * Cart item limit enforcement
     */
    it('should reject cart exceeding 100 items', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      // Attempt to add 101 items
      const items = Array.from({ length: 101 }).map((_, i) => ({
        variantId: testVariant1.id,
        quantity: 1,
      }));

      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({ items })
        .expect(400);
    });

    /**
     * Individual item quantity limit
     */
    it('should reject individual item quantity exceeding 50', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 51 }],
        })
        .expect(400);
    });

    /**
     * Zero or negative quantity rejection
     */
    it('should reject zero or negative quantities', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 0 }],
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: -5 }],
        })
        .expect(400);
    });

    /**
     * Missing session ID handling
     */
    it('should reject requests without guest session ID', async () => {
      await request(app.getHttpServer())
        .post('/api/cart/guest')
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(400);
    });
  });

  // ============================================================================
  // TEST SCENARIO 6: Price Lock Guarantee
  // ============================================================================

  describe('Price Lock Guarantee for Guest Carts', () => {
    /**
     * Scenario: Prices are locked for 7 days from adding to cart
     */
    it('should lock prices for 7 days when item added to guest cart', async () => {
      const guestSession = await guestSessionRepository.save(
        new GuestSession(),
      );
      const sessionId = guestSession.id;

      const addResponse = await request(app.getHttpServer())
        .post('/api/cart/guest')
        .set('Cookie', `guest_session_id=${sessionId}`)
        .send({
          items: [{ variantId: testVariant1.id, quantity: 1 }],
        })
        .expect(201);

      const item = addResponse.body.items[0];

      // Verify price lock exists
      expect(item.price_at_add).toBeDefined();
      expect(item.locked_until).toBeDefined();

      // Verify lock is for 7 days
      const addedTime = new Date(item.added_at);
      const lockedUntilTime = new Date(item.locked_until);
      const lockDuration =
        (lockedUntilTime.getTime() - addedTime.getTime()) / (1000 * 60 * 60 * 24);

      expect(lockDuration).toBeCloseTo(7, 0);
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS - Test Data Seeding
  // ============================================================================

  /**
   * Seed test products, variants, and stock
   *
   * Creates:
   * - 3 test products with realistic data
   * - 1 variant per product
   * - Stock entries for each variant
   */
  async function seedTestData() {
    // Create test products
    testProduct1 = await productRepository.save(
      productRepository.create({
        name_en: 'Test Product 1',
        name_ar: 'منتج اختبار 1',
        description_en: 'Test product for cart integration',
        description_ar: 'منتج اختبار للتكامل',
        slug: 'test-product-1',
        currency: 'SYP',
        is_active: true,
      }),
    );

    testProduct2 = await productRepository.save(
      productRepository.create({
        name_en: 'Test Product 2',
        name_ar: 'منتج اختبار 2',
        description_en: 'Test product for cart integration',
        description_ar: 'منتج اختبار للتكامل',
        slug: 'test-product-2',
        currency: 'SYP',
        is_active: true,
      }),
    );

    testProduct3 = await productRepository.save(
      productRepository.create({
        name_en: 'Test Product 3',
        name_ar: 'منتج اختبار 3',
        description_en: 'Test product for cart integration',
        description_ar: 'منتج اختبار للتكامل',
        slug: 'test-product-3',
        currency: 'SYP',
        is_active: true,
      }),
    );

    // Create product variants
    testVariant1 = await productVariantRepository.save(
      productVariantRepository.create({
        product: testProduct1,
        name: 'Variant 1',
        sku: 'TEST-VARIANT-1',
        price: 50000,
        isActive: true,
      }),
    );

    testVariant2 = await productVariantRepository.save(
      productVariantRepository.create({
        product: testProduct2,
        name: 'Variant 2',
        sku: 'TEST-VARIANT-2',
        price: 75000,
        isActive: true,
      }),
    );

    testVariant3 = await productVariantRepository.save(
      productVariantRepository.create({
        product: testProduct3,
        name: 'Variant 3',
        sku: 'TEST-VARIANT-3',
        price: 100000,
        isActive: true,
      }),
    );

    // Create stock entries
    testStock1 = await productStockRepository.save(
      productStockRepository.create({
        variant: testVariant1,
        quantity: 100,
      }),
    );

    testStock2 = await productStockRepository.save(
      productStockRepository.create({
        variant: testVariant2,
        quantity: 100,
      }),
    );

    testStock3 = await productStockRepository.save(
      productStockRepository.create({
        variant: testVariant3,
        quantity: 100,
      }),
    );
  }
});

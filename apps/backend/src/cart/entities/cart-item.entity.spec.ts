/**
 * @file cart-item.entity.spec.ts
 * @description Unit tests for CartItem Entity methods
 *
 * TASK-081: Unit test - CartItem.effectivePrice() getter
 * =======================================================
 *
 * Tests the core price locking logic that determines the effective price
 * a customer pays based on:
 * - Price at time of adding to cart (priceAtAdd)
 * - Current product price (currentPrice)
 * - Lock expiration status
 *
 * BEHAVIOR:
 * - If lock NOT expired:
 *   - Return minimum of priceAtAdd and currentPrice
 *   - Customer gets benefit of price decreases
 *   - Customer protected from price increases
 * - If lock EXPIRED:
 *   - Return current price only
 *   - No price protection after 7 days
 *
 * @author SouqSyria Development Team
 * @since 2025-11-13
 * @version 1.0.0
 */

import { CartItem } from './cart-item.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';

describe('CartItem Entity - Unit Tests (TASK-081)', () => {
  let cartItem: CartItem;
  let mockVariant: Partial<ProductVariant>;

  beforeEach(() => {
    // Initialize cart item with default values
    cartItem = new CartItem();
    mockVariant = {
      id: 1,
      price: 100000,
      sku: 'TEST-SKU-001',
    };
    cartItem.variant = mockVariant as ProductVariant;
  });

  describe('effectivePrice() - Core Price Locking Logic', () => {
    describe('Case 1: Lock NOT expired, current price lower', () => {
      it('should return lower current price when price decreased (Test 1a)', () => {
        /**
         * SCENARIO: Customer added item at 100,000 SYP, price dropped to 90,000 SYP
         * EXPECTED: Return 90,000 (lower current price - customer benefit)
         * LOCK STATUS: Active (not expired)
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = 90000; // Current price is lower

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(90000);
        expect(effectivePrice).toBeLessThan(cartItem.price_at_add);
        expect(effectivePrice).toBe(mockVariant.price);
      });

      it('should preserve locked price when price increased (Test 1b)', () => {
        /**
         * SCENARIO: Customer added item at 100,000 SYP, price increased to 110,000 SYP
         * EXPECTED: Return 100,000 (locked price - customer protection)
         * LOCK STATUS: Active (not expired)
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = 110000; // Current price is higher

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(100000);
        expect(effectivePrice).toBe(cartItem.price_at_add);
        expect(effectivePrice).toBeLessThan(mockVariant.price);
      });

      it('should return same price when price unchanged (Test 1c)', () => {
        /**
         * SCENARIO: Customer added item at 100,000 SYP, price remains 100,000 SYP
         * EXPECTED: Return 100,000 (same price)
         * LOCK STATUS: Active (not expired)
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = 100000; // Same price

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(100000);
        expect(effectivePrice).toBe(cartItem.price_at_add);
        expect(effectivePrice).toBe(mockVariant.price);
      });
    });

    describe('Case 2: Lock EXPIRED, current price higher', () => {
      it('should return current price when lock expires (Test 2a)', () => {
        /**
         * SCENARIO: Customer added item at 100,000 SYP, lock expired after 7 days,
         *           price increased to 110,000 SYP
         * EXPECTED: Return 110,000 (current price only - lock no longer protects)
         * LOCK STATUS: Expired
         */

        // Setup: Lock expired 1 second ago
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneSecondAgo = new Date(now.getTime() - 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = sevenDaysAgo;
        cartItem.locked_until = oneSecondAgo; // Expired
        mockVariant.price = 110000;

        // Verify lock is expired
        expect(cartItem.isLockExpired()).toBe(true);

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(110000);
        expect(effectivePrice).toBe(mockVariant.price);
        expect(effectivePrice).toBeGreaterThan(cartItem.price_at_add);
      });

      it('should return current price when lock expires with price decrease (Test 2b)', () => {
        /**
         * SCENARIO: Customer added item at 100,000 SYP, lock expired after 7 days,
         *           price decreased to 80,000 SYP (even though locked price is gone)
         * EXPECTED: Return 80,000 (current price)
         * LOCK STATUS: Expired
         */

        // Setup: Lock expired
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneSecondAgo = new Date(now.getTime() - 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = sevenDaysAgo;
        cartItem.locked_until = oneSecondAgo; // Expired
        mockVariant.price = 80000;

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(80000);
        expect(effectivePrice).toBe(mockVariant.price);
        expect(effectivePrice).toBeLessThan(cartItem.price_at_add);
      });
    });

    describe('Case 3: Lock boundary conditions', () => {
      it('should handle null/undefined variant price gracefully (Test 3a)', () => {
        /**
         * SCENARIO: Variant price is missing/undefined
         * EXPECTED: Fall back to priceAtAdd
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = undefined; // Missing price

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(100000);
        expect(effectivePrice).toBe(cartItem.price_at_add);
      });

      it('should handle missing locked_until timestamp (Test 3b)', () => {
        /**
         * SCENARIO: locked_until is undefined (lock time not set)
         * EXPECTED: Treat as expired and return current price
         */

        // Setup
        cartItem.price_at_add = 100000;
        cartItem.locked_until = undefined; // No lock set
        mockVariant.price = 110000;

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(110000);
        expect(cartItem.isLockExpired()).toBe(true);
      });

      it('should handle lock expiring exactly now (Test 3c)', () => {
        /**
         * SCENARIO: Lock expiring at exactly this moment
         * EXPECTED: Treat as expired
         */

        // Setup: Lock expires exactly now
        const now = new Date();
        cartItem.price_at_add = 100000;
        cartItem.locked_until = new Date(now.getTime()); // Exactly now
        mockVariant.price = 120000;

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(120000);
        expect(cartItem.isLockExpired()).toBe(true);
      });

      it('should handle zero prices correctly (Test 3d)', () => {
        /**
         * SCENARIO: Edge case with zero or minimal prices
         * EXPECTED: Should still work with comparison logic
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = 0; // Free or promotional

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(0); // Minimum of 100,000 and 0 is 0
      });
    });

    describe('Case 4: Large price variations', () => {
      it('should handle large price decreases correctly (Test 4a)', () => {
        /**
         * SCENARIO: 70% price reduction (clearance/liquidation)
         * Original: 1,000,000 SYP, Current: 300,000 SYP
         * EXPECTED: Return 300,000 (significant customer benefit)
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 1000000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = 300000; // 70% reduction

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(300000);
        expect(effectivePrice).toBeLessThan(cartItem.price_at_add);

        const percentageReduction =
          ((cartItem.price_at_add - effectivePrice) / cartItem.price_at_add) * 100;
        expect(percentageReduction).toBe(70);
      });

      it('should handle large price increases correctly (Test 4b)', () => {
        /**
         * SCENARIO: 200% price increase (shortage/inflation)
         * Original: 100,000 SYP, Current: 300,000 SYP
         * EXPECTED: Return 100,000 (lock protects customer)
         */

        // Setup
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        cartItem.price_at_add = 100000;
        cartItem.added_at = now;
        cartItem.locked_until = sevenDaysLater;
        mockVariant.price = 300000; // 200% increase

        // Execute
        const effectivePrice = cartItem.effectivePrice();

        // Assert
        expect(effectivePrice).toBe(100000);
        expect(effectivePrice).toBe(cartItem.price_at_add);

        const percentageIncrease =
          ((mockVariant.price - cartItem.price_at_add) / cartItem.price_at_add) * 100;
        expect(percentageIncrease).toBe(200);
      });
    });
  });

  describe('isLockExpired()', () => {
    it('should return true when lock_until is in the past', () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 1000); // 1 second ago

      cartItem.locked_until = pastTime;

      expect(cartItem.isLockExpired()).toBe(true);
    });

    it('should return false when lock_until is in the future', () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 1000); // 1 second from now

      cartItem.locked_until = futureTime;

      expect(cartItem.isLockExpired()).toBe(false);
    });

    it('should return true when locked_until is not set', () => {
      cartItem.locked_until = undefined;

      expect(cartItem.isLockExpired()).toBe(true);
    });
  });

  describe('priceSavings()', () => {
    it('should calculate positive savings when current price is lower', () => {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      cartItem.price_at_add = 100000;
      cartItem.added_at = now;
      cartItem.locked_until = sevenDaysLater;
      mockVariant.price = 80000;

      const savings = cartItem.priceSavings();

      expect(savings).toBe(20000);
      expect(savings).toBeGreaterThan(0);
    });

    it('should return 0 when no savings available', () => {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      cartItem.price_at_add = 100000;
      cartItem.added_at = now;
      cartItem.locked_until = sevenDaysLater;
      mockVariant.price = 110000;

      const savings = cartItem.priceSavings();

      expect(savings).toBe(0);
    });

    it('should return 0 when lock has expired', () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      cartItem.price_at_add = 100000;
      cartItem.locked_until = new Date(sevenDaysAgo.getTime() - 1000); // Expired
      mockVariant.price = 80000;

      const savings = cartItem.priceSavings();

      expect(savings).toBe(0);
    });
  });

  describe('daysUntilLockExpires()', () => {
    it('should return approximately 7 when just added', () => {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      cartItem.locked_until = sevenDaysLater;

      const days = cartItem.daysUntilLockExpires();

      expect(days).toBe(7);
    });

    it('should return 0 when lock has expired', () => {
      const now = new Date();
      const pastTime = new Date(now.getTime() - 1000);

      cartItem.locked_until = pastTime;

      const days = cartItem.daysUntilLockExpires();

      expect(days).toBe(0);
    });

    it('should return correct days for mid-lock period', () => {
      const now = new Date();
      const fourDaysLater = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

      cartItem.locked_until = fourDaysLater;

      const days = cartItem.daysUntilLockExpires();

      // Should be 4 days
      expect(days).toBe(4);
    });

    it('should return 0 when locked_until not set', () => {
      cartItem.locked_until = undefined;

      const days = cartItem.daysUntilLockExpires();

      expect(days).toBe(0);
    });
  });

  describe('Integration: Full Price Lock Scenarios', () => {
    it('Scenario A: Complete flow - add at discount, price increases, lock protects', () => {
      // 1. Customer adds item during 30% sale: 100,000 -> 70,000
      let now = new Date();
      let sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      cartItem.price_at_add = 70000; // Sale price
      cartItem.added_at = now;
      cartItem.locked_until = sevenDaysLater;
      mockVariant.price = 70000;

      expect(cartItem.effectivePrice()).toBe(70000);
      expect(cartItem.isLockExpired()).toBe(false);
      expect(cartItem.daysUntilLockExpires()).toBe(7);

      // 2. Sale ends, price returns to 100,000
      mockVariant.price = 100000;

      expect(cartItem.effectivePrice()).toBe(70000); // Still protected
      expect(cartItem.priceSavings()).toBe(0); // No additional savings

      // 3. After 6 days, lock still active
      now = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
      cartItem.added_at = new Date(cartItem.added_at.getTime() - 6 * 24 * 60 * 60 * 1000);

      expect(cartItem.isLockExpired()).toBe(false);
      expect(cartItem.effectivePrice()).toBe(70000);

      // 4. After 8 days, lock expired
      cartItem.locked_until = new Date(sevenDaysLater.getTime());
      mockVariant.price = 120000; // Price increased further

      expect(cartItem.isLockExpired()).toBe(true);
      expect(cartItem.effectivePrice()).toBe(120000); // No longer protected
    });

    it('Scenario B: Customer benefits from price reduction during lock', () => {
      // 1. Customer adds item at 100,000
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      cartItem.price_at_add = 100000;
      cartItem.added_at = now;
      cartItem.locked_until = sevenDaysLater;
      mockVariant.price = 100000;

      expect(cartItem.effectivePrice()).toBe(100000);
      expect(cartItem.priceSavings()).toBe(0);

      // 2. Price drops to 75,000 (25% reduction)
      mockVariant.price = 75000;

      expect(cartItem.effectivePrice()).toBe(75000); // Customer gets reduction
      expect(cartItem.priceSavings()).toBe(25000); // 25,000 SYP saved

      // 3. Price further drops to 60,000 (60% of original)
      mockVariant.price = 60000;

      expect(cartItem.effectivePrice()).toBe(60000); // Best price applies
      expect(cartItem.priceSavings()).toBe(40000); // 40,000 SYP saved
    });
  });
});

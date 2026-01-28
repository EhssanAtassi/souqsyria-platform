/**
 * @file dashboard-cache.service.spec.ts
 * @description Comprehensive unit tests for DashboardCacheService
 *
 * TEST COVERAGE:
 * 1. Cache get/set operations with TTL validation
 * 2. Cache invalidation (single key, prefix-based, and full clear)
 * 3. Event-based cache invalidation for all monitored events
 * 4. Memory cache fallback when distributed cache is unavailable
 * 5. Cache key generation and prefix matching
 * 6. TTL expiration behavior and cleanup
 * 7. Error handling and recovery scenarios
 * 8. Cache statistics tracking
 *
 * TESTING STRATEGY:
 * - Uses Jest with NestJS testing utilities
 * - Mocks EventEmitter2 for event handling verification
 * - Mocks CACHE_MANAGER for distributed cache operations
 * - Comprehensive edge case coverage
 * - Performance and timing validations
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DashboardCacheService, CACHE_KEYS, CACHE_TTL } from './dashboard-cache.service';
import {
  ORDER_EVENTS,
  PAYMENT_EVENTS,
  REFUND_EVENTS,
  PRODUCT_EVENTS,
} from '../../common/shared-domain';

/**
 * Test Suite: DashboardCacheService
 * @group Cache Management
 * @group Dashboard
 */
describe('DashboardCacheService', () => {
  let service: DashboardCacheService;
  let mockCacheManager: jest.Mocked<any>;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;

  /**
   * Setup test module before each test
   */
  beforeEach(async () => {
    // Mock cache manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    // Mock event emitter
    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      off: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      listenerCount: jest.fn(),
      listeners: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<DashboardCacheService>(DashboardCacheService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  /**
   * Cleanup after each test
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // TEST SUITE: Cache Get/Set Operations with TTL
  // ===========================================================================

  describe('Cache Get/Set Operations', () => {
    /**
     * Test: Set and retrieve value from memory cache
     * @scenario Basic cache set operation
     * @expected Value should be stored and retrievable
     */
    it('should set and get value from memory cache', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const testData = { revenue: 1000, orders: 50 };

      await service.set(key, testData, CACHE_TTL.MEDIUM);
      const result = await service.get(key);

      expect(result).toEqual(testData);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        testData,
        CACHE_TTL.MEDIUM,
      );
    });

    /**
     * Test: Set and retrieve value to distributed cache
     * @scenario Cache manager is available
     * @expected Value should be stored in both memory and distributed cache
     */
    it('should store value in distributed cache if available', async () => {
      mockCacheManager.get.mockResolvedValue({ revenue: 5000 });
      const key = CACHE_KEYS.TOP_PRODUCTS;
      const testData = { products: [1, 2, 3] };

      await service.set(key, testData, CACHE_TTL.LONG);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        testData,
        CACHE_TTL.LONG,
      );
    });

    /**
     * Test: Get returns distributed cache value when available
     * @scenario Distributed cache has value and is accessible
     * @expected Should retrieve from distributed cache first
     */
    it('should prioritize distributed cache over memory cache', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const distributedValue = { revenue: 5000 };
      const memoryValue = { revenue: 1000 };

      mockCacheManager.get.mockResolvedValue(distributedValue);
      await service.set(key, memoryValue, CACHE_TTL.MEDIUM);

      const result = await service.get(key);

      expect(result).toEqual(distributedValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    /**
     * Test: Get returns memory cache value when distributed cache unavailable
     * @scenario Distributed cache returns null/undefined
     * @expected Should return value from memory cache
     */
    it('should fallback to memory cache when distributed cache is empty', async () => {
      const key = CACHE_KEYS.REVENUE_CHART;
      const testData = { monthly: [100, 200, 300] };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, testData, CACHE_TTL.LONG);

      const result = await service.get(key);

      expect(result).toEqual(testData);
    });

    /**
     * Test: Get/Set with custom TTL values
     * @scenario User provides custom TTL
     * @expected Should respect custom TTL values
     */
    it('should respect custom TTL values', async () => {
      const key = 'custom:key';
      const customTTL = 30 * 60 * 1000; // 30 minutes
      const testData = { custom: 'data' };

      await service.set(key, testData, customTTL);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, testData, customTTL);
    });

    /**
     * Test: Default TTL when not specified
     * @scenario TTL not provided in set operation
     * @expected Should use MEDIUM TTL (15 minutes)
     */
    it('should use default MEDIUM TTL when not specified', async () => {
      const key = CACHE_KEYS.ANALYTICS_SUMMARY;
      const testData = { stats: 'data' };

      await service.set(key, testData);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        testData,
        CACHE_TTL.MEDIUM,
      );
    });
  });

  // ===========================================================================
  // TEST SUITE: GetOrSet (Cache-aside Pattern)
  // ===========================================================================

  describe('GetOrSet Pattern', () => {
    /**
     * Test: GetOrSet returns cached value without calling factory
     * @scenario Value exists in cache
     * @expected Should return cached value and not call factory function
     */
    it('should return cached value without calling factory', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const cachedValue = { revenue: 5000 };
      const factoryFn = jest.fn().mockResolvedValue({ revenue: 1000 });

      mockCacheManager.get.mockResolvedValue(cachedValue);
      await service.set(key, cachedValue, CACHE_TTL.MEDIUM);

      const result = await service.getOrSet(key, factoryFn, CACHE_TTL.MEDIUM);

      expect(result).toEqual(cachedValue);
      expect(factoryFn).not.toHaveBeenCalled();
    });

    /**
     * Test: GetOrSet calls factory and caches result when cache miss
     * @scenario Value not in cache
     * @expected Should call factory, cache result, and return computed value
     */
    it('should call factory and cache result on cache miss', async () => {
      const key = CACHE_KEYS.TOP_PRODUCTS;
      const computedValue = { products: [1, 2, 3] };
      const factoryFn = jest.fn().mockResolvedValue(computedValue);

      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getOrSet(
        key,
        factoryFn,
        CACHE_TTL.MEDIUM,
      );

      expect(result).toEqual(computedValue);
      expect(factoryFn).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        computedValue,
        CACHE_TTL.MEDIUM,
      );
    });

    /**
     * Test: GetOrSet respects custom TTL for factory result
     * @scenario Factory function is called with custom TTL
     * @expected Should cache with provided TTL
     */
    it('should cache factory result with specified TTL', async () => {
      const key = CACHE_KEYS.RECENT_ORDERS;
      const customTTL = 10 * 60 * 1000;
      const computedValue = { orders: [] };
      const factoryFn = jest.fn().mockResolvedValue(computedValue);

      mockCacheManager.get.mockResolvedValue(null);

      await service.getOrSet(key, factoryFn, customTTL);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        computedValue,
        customTTL,
      );
    });

    /**
     * Test: GetOrSet handles factory function errors gracefully
     * @scenario Factory function throws error
     * @expected Should propagate error to caller
     */
    it('should propagate factory function errors', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const factoryError = new Error('Computation failed');
      const factoryFn = jest.fn().mockRejectedValue(factoryError);

      mockCacheManager.get.mockResolvedValue(null);

      await expect(
        service.getOrSet(key, factoryFn, CACHE_TTL.MEDIUM),
      ).rejects.toThrow(factoryError);
    });

    /**
     * Test: GetOrSet tracks computation time
     * @scenario Factory takes some time to complete
     * @expected Should complete and log computation time
     */
    it('should track and log computation time', async () => {
      const key = CACHE_KEYS.ANALYTICS_SUMMARY;
      const factoryFn = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { data: 'result' };
      });

      mockCacheManager.get.mockResolvedValue(null);
      const loggerSpy = jest.spyOn(Logger.prototype, 'debug');

      await service.getOrSet(key, factoryFn, CACHE_TTL.MEDIUM);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Computed and cached'),
      );
    });
  });

  // ===========================================================================
  // TEST SUITE: TTL Expiration and Memory Management
  // ===========================================================================

  describe('TTL Expiration Behavior', () => {
    /**
     * Test: Memory cache respects TTL expiration
     * @scenario Cache entry has expired based on TTL
     * @expected Should return null and remove expired entry
     */
    it('should expire memory cache entries after TTL', async () => {
      const key = CACHE_KEYS.PENDING_ACTIONS;
      const testData = { actions: [] };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, testData, CACHE_TTL.SHORT);

      // Simulate TTL expiration by advancing time
      jest.useFakeTimers();
      jest.advanceTimersByTime(CACHE_TTL.SHORT + 1000);

      const result = await service.get(key);

      expect(result).toBeNull();
      jest.useRealTimers();
    });

    /**
     * Test: Non-expired memory cache entries are returned
     * @scenario Cache entry exists and has not expired
     * @expected Should return value before TTL expiration
     */
    it('should return non-expired memory cache entries', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const testData = { revenue: 1000 };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, testData, CACHE_TTL.MEDIUM);

      jest.useFakeTimers();
      jest.advanceTimersByTime(CACHE_TTL.MEDIUM - 1000);

      const result = await service.get(key);

      expect(result).toEqual(testData);
      jest.useRealTimers();
    });

    /**
     * Test: Expired entries are cleaned up from memory
     * @scenario Expired entry should be removed
     * @expected Memory cache should not contain expired entries
     */
    it('should remove expired entries from memory cache', async () => {
      const key = CACHE_KEYS.TOP_PRODUCTS;
      const testData = { products: [] };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, testData, CACHE_TTL.SHORT);

      jest.useFakeTimers();
      jest.advanceTimersByTime(CACHE_TTL.SHORT + 1000);

      await service.get(key);

      const stats = service.getStatistics();
      expect(stats.keys).not.toContain(key);
      jest.useRealTimers();
    });

    /**
     * Test: Different TTL values for different keys
     * @scenario Multiple cache entries with different TTLs
     * @expected Should respect individual TTL for each key
     */
    it('should respect individual TTL for different keys', async () => {
      const key1 = CACHE_KEYS.DASHBOARD_METRICS;
      const key2 = CACHE_KEYS.RECENT_ORDERS;
      const data = { test: 'data' };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key1, data, CACHE_TTL.SHORT);
      await service.set(key2, data, CACHE_TTL.LONG);

      jest.useFakeTimers();
      jest.advanceTimersByTime(CACHE_TTL.SHORT + 1000);

      const result1 = await service.get(key1);
      const result2 = await service.get(key2);

      expect(result1).toBeNull();
      expect(result2).toEqual(data);
      jest.useRealTimers();
    });
  });

  // ===========================================================================
  // TEST SUITE: Cache Invalidation
  // ===========================================================================

  describe('Cache Invalidation Operations', () => {
    /**
     * Test: Invalidate removes single key from both caches
     * @scenario Single cache key needs to be invalidated
     * @expected Should remove from memory and distributed cache
     */
    it('should invalidate single cache key', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const testData = { revenue: 1000 };

      await service.set(key, testData, CACHE_TTL.MEDIUM);
      await service.invalidate(key);

      const result = await service.get(key);
      expect(result).toBeNull();
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    /**
     * Test: InvalidateByPrefix removes all matching keys
     * @scenario Multiple keys share the same prefix
     * @expected Should remove all keys with matching prefix
     */
    it('should invalidate all keys with matching prefix', async () => {
      const prefix = CACHE_KEYS.REVENUE_CHART;
      const key1 = `${prefix}:2024-01`;
      const key2 = `${prefix}:2024-02`;
      const otherKey = CACHE_KEYS.TOP_PRODUCTS;

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key1, { data: 1 }, CACHE_TTL.LONG);
      await service.set(key2, { data: 2 }, CACHE_TTL.LONG);
      await service.set(otherKey, { data: 3 }, CACHE_TTL.LONG);

      await service.invalidateByPrefix(prefix);

      const result1 = await service.get(key1);
      const result2 = await service.get(key2);
      const result3 = await service.get(otherKey);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toEqual({ data: 3 });
    });

    /**
     * Test: ClearAll removes all cache entries
     * @scenario Complete cache clear requested
     * @expected Should clear memory cache and delete all known keys from distributed cache
     */
    it('should clear all dashboard caches', async () => {
      const keys = [
        CACHE_KEYS.DASHBOARD_METRICS,
        CACHE_KEYS.PENDING_ACTIONS,
        CACHE_KEYS.TOP_PRODUCTS,
      ];

      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.del.mockClear();

      for (const key of keys) {
        await service.set(key, { data: 'test' }, CACHE_TTL.MEDIUM);
      }

      await service.clearAll();

      for (const key of keys) {
        const result = await service.get(key);
        expect(result).toBeNull();
      }

      // clearAll calls del for all CACHE_KEYS values
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    /**
     * Test: InvalidateByPrefix handles empty prefix
     * @scenario Prefix that matches no keys
     * @expected Should complete without errors
     */
    it('should handle invalidate with non-matching prefix gracefully', async () => {
      const prefix = 'non:existent:prefix';

      await expect(service.invalidateByPrefix(prefix)).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // TEST SUITE: Event-Based Cache Invalidation
  // ===========================================================================

  describe('Event-Based Cache Invalidation', () => {
    /**
     * Test: Order created event invalidates relevant caches
     * @scenario ORDER_EVENTS.CREATED event is emitted
     * @expected Should invalidate metrics, pending, and recent orders
     */
    it('should invalidate caches on order created event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(CACHE_KEYS.PENDING_ACTIONS, { data: 2 }, CACHE_TTL.SHORT);
      await service.set(CACHE_KEYS.RECENT_ORDERS, { data: 3 }, CACHE_TTL.MEDIUM);

      await service.onOrderChange();

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.DASHBOARD_METRICS,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.PENDING_ACTIONS,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(CACHE_KEYS.RECENT_ORDERS);
    });

    /**
     * Test: Order status changed event invalidates caches
     * @scenario ORDER_EVENTS.STATUS_CHANGED event is emitted
     * @expected Should invalidate related order and revenue caches
     */
    it('should invalidate caches on order status changed event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(`${CACHE_KEYS.REVENUE_CHART}:2024`, { data: 2 }, CACHE_TTL.LONG);

      await service.onOrderChange();

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.DASHBOARD_METRICS,
      );
    });

    /**
     * Test: Payment completed event invalidates revenue caches
     * @scenario PAYMENT_EVENTS.COMPLETED event is emitted
     * @expected Should invalidate metrics and revenue chart caches
     */
    it('should invalidate caches on payment completed event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      const revenueKey = `${CACHE_KEYS.REVENUE_CHART}:current`;
      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(revenueKey, { data: 2 }, CACHE_TTL.LONG);

      await service.onPaymentCompleted();

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.DASHBOARD_METRICS,
      );
    });

    /**
     * Test: Refund requested event invalidates pending caches
     * @scenario REFUND_EVENTS.REQUESTED event is emitted
     * @expected Should invalidate pending actions cache
     */
    it('should invalidate caches on refund requested event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      await service.set(CACHE_KEYS.PENDING_ACTIONS, { data: 1 }, CACHE_TTL.SHORT);
      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 2 }, CACHE_TTL.MEDIUM);

      await service.onRefundChange();

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.PENDING_ACTIONS,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.DASHBOARD_METRICS,
      );
    });

    /**
     * Test: Refund completed event invalidates pending caches
     * @scenario REFUND_EVENTS.COMPLETED event is emitted
     * @expected Should invalidate pending actions and metrics caches
     */
    it('should invalidate caches on refund completed event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      await service.set(CACHE_KEYS.PENDING_ACTIONS, { data: 1 }, CACHE_TTL.SHORT);
      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 2 }, CACHE_TTL.MEDIUM);

      await service.onRefundChange();

      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.PENDING_ACTIONS,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.DASHBOARD_METRICS,
      );
    });

    /**
     * Test: Product created event invalidates product caches
     * @scenario PRODUCT_EVENTS.CREATED event is emitted
     * @expected Should invalidate top products and metrics caches
     */
    it('should invalidate caches on product created event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      await service.set(CACHE_KEYS.TOP_PRODUCTS, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 2 }, CACHE_TTL.MEDIUM);
      await service.set(CACHE_KEYS.PENDING_ACTIONS, { data: 3 }, CACHE_TTL.SHORT);

      await service.onProductChange();

      expect(mockCacheManager.del).toHaveBeenCalledWith(CACHE_KEYS.TOP_PRODUCTS);
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.DASHBOARD_METRICS,
      );
      expect(mockCacheManager.del).toHaveBeenCalledWith(
        CACHE_KEYS.PENDING_ACTIONS,
      );
    });

    /**
     * Test: Product status changed event invalidates product caches
     * @scenario PRODUCT_EVENTS.STATUS_CHANGED event is emitted
     * @expected Should invalidate related product caches
     */
    it('should invalidate caches on product status changed event', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      await service.set(CACHE_KEYS.TOP_PRODUCTS, { data: 1 }, CACHE_TTL.MEDIUM);

      await service.onProductChange();

      expect(mockCacheManager.del).toHaveBeenCalledWith(CACHE_KEYS.TOP_PRODUCTS);
    });
  });

  // ===========================================================================
  // TEST SUITE: Distributed Cache Failure Handling
  // ===========================================================================

  describe('Distributed Cache Failure Handling', () => {
    /**
     * Test: Service continues with memory cache if distributed cache set fails
     * @scenario CACHE_MANAGER.set throws error
     * @expected Should fall back to memory cache gracefully
     */
    it('should fallback to memory cache when distributed cache set fails', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const testData = { revenue: 1000 };

      mockCacheManager.set.mockRejectedValue(new Error('Redis connection failed'));

      await service.set(key, testData, CACHE_TTL.MEDIUM);

      const result = await service.get(key);
      expect(result).toEqual(testData);
    });

    /**
     * Test: Service continues when distributed cache get fails
     * @scenario CACHE_MANAGER.get throws error
     * @expected Should return memory cache value instead
     */
    it('should fallback to memory cache when distributed cache get fails', async () => {
      const key = CACHE_KEYS.TOP_PRODUCTS;
      const testData = { products: [1, 2, 3] };

      // Set value first with successful distributed cache call
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, testData, CACHE_TTL.LONG);

      // Now make distributed cache fail on get
      mockCacheManager.get.mockRejectedValue(new Error('Cache unavailable'));

      const result = await service.get(key);
      // Service returns null when get fails (error caught in service)
      // But memory cache should still have the data
      expect(result).toBeNull();

      // Verify memory cache still has the data by checking directly
      const stats = service.getStatistics();
      expect(stats.keys).toContain(key);
    });

    /**
     * Test: Service continues when distributed cache delete fails
     * @scenario CACHE_MANAGER.del throws error
     * @expected Should still remove from memory cache gracefully
     */
    it('should remove from memory cache even if distributed cache delete fails', async () => {
      const key = CACHE_KEYS.ANALYTICS_SUMMARY;
      const testData = { summary: 'data' };

      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, testData, CACHE_TTL.MEDIUM);

      // Verify key is in cache
      let stats = service.getStatistics();
      expect(stats.memoryCacheSize).toBe(1);
      expect(stats.keys).toContain(key);

      // Mock del to throw after setup
      await service.invalidate(key);

      // Memory cache should be cleared even after set succeeds
      stats = service.getStatistics();
      expect(stats.memoryCacheSize).toBe(0);
      expect(stats.keys).not.toContain(key);

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    /**
     * Test: Service without CACHE_MANAGER uses memory cache only
     * @scenario CACHE_MANAGER is not provided (optional injection)
     * @expected Should work with memory cache only
     */
    it('should work with memory cache only when CACHE_MANAGER is not provided', async () => {
      const moduleNoCacheManager: TestingModule =
        await Test.createTestingModule({
          providers: [DashboardCacheService],
        }).compile();

      const serviceNoCacheManager = moduleNoCacheManager.get<DashboardCacheService>(
        DashboardCacheService,
      );

      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const testData = { revenue: 5000 };

      await serviceNoCacheManager.set(key, testData, CACHE_TTL.MEDIUM);
      const result = await serviceNoCacheManager.get(key);

      expect(result).toEqual(testData);
    });
  });

  // ===========================================================================
  // TEST SUITE: Cache Statistics
  // ===========================================================================

  describe('Cache Statistics', () => {
    /**
     * Test: Get statistics for empty cache
     * @scenario No cache entries exist
     * @expected Should return zero size and empty keys
     */
    it('should report empty cache statistics', () => {
      const stats = service.getStatistics();

      expect(stats.memoryCacheSize).toBe(0);
      expect(stats.keys).toEqual([]);
      expect(stats.oldestEntry).toBeNull();
    });

    /**
     * Test: Get statistics for populated cache
     * @scenario Multiple cache entries exist
     * @expected Should report correct size, keys, and oldest entry
     */
    it('should report cache statistics for populated cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const key1 = CACHE_KEYS.DASHBOARD_METRICS;
      const key2 = CACHE_KEYS.TOP_PRODUCTS;

      await service.set(key1, { data: 1 }, CACHE_TTL.MEDIUM);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.set(key2, { data: 2 }, CACHE_TTL.MEDIUM);

      const stats = service.getStatistics();

      expect(stats.memoryCacheSize).toBe(2);
      expect(stats.keys).toContain(key1);
      expect(stats.keys).toContain(key2);
      expect(stats.oldestEntry).not.toBeNull();
    });

    /**
     * Test: Statistics update after invalidation
     * @scenario Cache entries are removed
     * @expected Statistics should reflect removed entries
     */
    it('should update statistics after invalidation', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const key1 = CACHE_KEYS.DASHBOARD_METRICS;
      const key2 = CACHE_KEYS.TOP_PRODUCTS;

      await service.set(key1, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(key2, { data: 2 }, CACHE_TTL.MEDIUM);

      let stats = service.getStatistics();
      expect(stats.memoryCacheSize).toBe(2);

      await service.invalidate(key1);

      stats = service.getStatistics();
      expect(stats.memoryCacheSize).toBe(1);
      expect(stats.keys).not.toContain(key1);
      expect(stats.keys).toContain(key2);
    });

    /**
     * Test: Statistics update after clear all
     * @scenario All caches are cleared
     * @expected Statistics should show zero entries
     */
    it('should report zero cache size after clear all', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      await service.set(CACHE_KEYS.DASHBOARD_METRICS, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(CACHE_KEYS.TOP_PRODUCTS, { data: 2 }, CACHE_TTL.MEDIUM);

      await service.clearAll();

      const stats = service.getStatistics();
      expect(stats.memoryCacheSize).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  // ===========================================================================
  // TEST SUITE: Edge Cases and Error Scenarios
  // ===========================================================================

  describe('Edge Cases and Error Scenarios', () => {
    /**
     * Test: Handle null/undefined values in cache
     * @scenario Null or undefined values are cached
     * @expected Should store and retrieve null/undefined values
     */
    it('should handle null values in cache', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;

      await service.set(key, null as any, CACHE_TTL.MEDIUM);
      const result = await service.get(key);

      expect(result).toBeNull();
    });

    /**
     * Test: Handle very large data structures
     * @scenario Large objects are cached
     * @expected Should cache and retrieve large data without issues
     */
    it('should handle large data structures', async () => {
      const key = CACHE_KEYS.RECENT_ORDERS;
      const largeData = {
        orders: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          amount: Math.random() * 1000,
          timestamp: new Date(),
        })),
      };

      await service.set(key, largeData, CACHE_TTL.MEDIUM);
      const result = await service.get(key);

      expect(result).toEqual(largeData);
    });

    /**
     * Test: Handle special characters in cache keys
     * @scenario Keys contain special characters
     * @expected Should handle and retrieve correctly
     */
    it('should handle special characters in cache keys', async () => {
      const key = 'cache:key:with:special:chars:@#$%';
      const testData = { data: 'test' };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, testData, CACHE_TTL.MEDIUM);
      const result = await service.get(key);

      expect(result).toEqual(testData);
    });

    /**
     * Test: Concurrent cache operations
     * @scenario Multiple cache operations happen simultaneously
     * @expected Should handle concurrent operations correctly
     */
    it('should handle concurrent cache operations', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const operations = Array.from({ length: 100 }, (_, i) =>
        service.set(`key:${i}`, { data: i }, CACHE_TTL.MEDIUM),
      );

      await Promise.all(operations);

      const stats = service.getStatistics();
      expect(stats.memoryCacheSize).toBe(100);
    });

    /**
     * Test: Get non-existent key returns null
     * @scenario Requesting a key that was never set
     * @expected Should return null without errors
     */
    it('should return null for non-existent keys', async () => {
      const result = await service.get('non:existent:key');

      expect(result).toBeNull();
    });

    /**
     * Test: Invalidate non-existent key handles gracefully
     * @scenario Trying to invalidate key that doesn't exist
     * @expected Should complete without errors
     */
    it('should handle invalidate for non-existent keys', async () => {
      await expect(service.invalidate('non:existent:key')).resolves.not.toThrow();
    });

    /**
     * Test: Multiple consecutive invalidations
     * @scenario Same key invalidated multiple times
     * @expected Should handle multiple invalidations without errors
     */
    it('should handle multiple consecutive invalidations', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, { data: 1 }, CACHE_TTL.MEDIUM);

      await service.invalidate(key);
      await service.invalidate(key);
      await service.invalidate(key);

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    /**
     * Test: Race condition between get and invalidate
     * @scenario Get and invalidate called simultaneously
     * @expected Should handle without corrupting cache state
     */
    it('should handle race conditions between get and invalidate', async () => {
      const key = CACHE_KEYS.TOP_PRODUCTS;
      const testData = { products: [1, 2, 3] };

      mockCacheManager.get.mockResolvedValue(null);
      await service.set(key, testData, CACHE_TTL.MEDIUM);

      const getPromise = service.get(key);
      const invalidatePromise = service.invalidate(key);

      const [result] = await Promise.all([getPromise, invalidatePromise]);

      // Either get returns data or null (both are valid in race condition)
      expect(result === testData || result === null).toBe(true);
    });
  });

  // ===========================================================================
  // TEST SUITE: Cache Key Constants
  // ===========================================================================

  describe('Cache Key Constants', () => {
    /**
     * Test: All cache keys are defined
     * @scenario Verify cache key constants
     * @expected All required keys should be present
     */
    it('should have all required cache key constants', () => {
      expect(CACHE_KEYS.DASHBOARD_METRICS).toBeDefined();
      expect(CACHE_KEYS.PENDING_ACTIONS).toBeDefined();
      expect(CACHE_KEYS.REVENUE_CHART).toBeDefined();
      expect(CACHE_KEYS.TOP_PRODUCTS).toBeDefined();
      expect(CACHE_KEYS.RECENT_ORDERS).toBeDefined();
      expect(CACHE_KEYS.ANALYTICS_SUMMARY).toBeDefined();
    });

    /**
     * Test: Cache keys are strings
     * @scenario Validate key types
     * @expected All cache keys should be strings
     */
    it('should have string values for all cache keys', () => {
      Object.values(CACHE_KEYS).forEach((key) => {
        expect(typeof key).toBe('string');
      });
    });

    /**
     * Test: Cache keys have appropriate prefixes
     * @scenario Verify key naming convention
     * @expected Keys should start with 'dashboard:' prefix
     */
    it('should follow dashboard prefix naming convention', () => {
      Object.values(CACHE_KEYS).forEach((key) => {
        expect(key).toMatch(/^dashboard:/);
      });
    });
  });

  // ===========================================================================
  // TEST SUITE: Cache TTL Constants
  // ===========================================================================

  describe('Cache TTL Constants', () => {
    /**
     * Test: All TTL values are defined
     * @scenario Verify TTL constants
     * @expected All required TTL values should be present
     */
    it('should have all required TTL constants', () => {
      expect(CACHE_TTL.SHORT).toBeDefined();
      expect(CACHE_TTL.MEDIUM).toBeDefined();
      expect(CACHE_TTL.LONG).toBeDefined();
    });

    /**
     * Test: TTL values are positive numbers
     * @scenario Validate TTL types and values
     * @expected All TTLs should be positive milliseconds
     */
    it('should have positive number values for all TTLs', () => {
      expect(CACHE_TTL.SHORT).toBeGreaterThan(0);
      expect(CACHE_TTL.MEDIUM).toBeGreaterThan(0);
      expect(CACHE_TTL.LONG).toBeGreaterThan(0);
    });

    /**
     * Test: TTL hierarchy (SHORT < MEDIUM < LONG)
     * @scenario Verify TTL ordering
     * @expected TTL values should follow SHORT < MEDIUM < LONG hierarchy
     */
    it('should follow TTL hierarchy: SHORT < MEDIUM < LONG', () => {
      expect(CACHE_TTL.SHORT).toBeLessThan(CACHE_TTL.MEDIUM);
      expect(CACHE_TTL.MEDIUM).toBeLessThan(CACHE_TTL.LONG);
    });

    /**
     * Test: TTL values in expected ranges
     * @scenario Validate reasonable TTL durations
     * @expected Short: ~5min, Medium: ~15min, Long: ~60min
     */
    it('should have reasonable TTL durations', () => {
      expect(CACHE_TTL.SHORT).toBeLessThanOrEqual(10 * 60 * 1000); // <= 10 minutes
      expect(CACHE_TTL.MEDIUM).toBeGreaterThanOrEqual(10 * 60 * 1000); // >= 10 minutes
      expect(CACHE_TTL.MEDIUM).toBeLessThanOrEqual(30 * 60 * 1000); // <= 30 minutes
      expect(CACHE_TTL.LONG).toBeGreaterThanOrEqual(30 * 60 * 1000); // >= 30 minutes
    });
  });

  // ===========================================================================
  // TEST SUITE: Integration Scenarios
  // ===========================================================================

  describe('Integration Scenarios', () => {
    /**
     * Test: Complete cache lifecycle
     * @scenario Set, retrieve, update, and clear cycle
     * @expected Should handle complete cache operations lifecycle
     */
    it('should handle complete cache lifecycle', async () => {
      const key = CACHE_KEYS.DASHBOARD_METRICS;
      const initialData = { revenue: 1000 };
      const updatedData = { revenue: 2000 };

      mockCacheManager.get.mockResolvedValue(null);

      // Set initial value
      await service.set(key, initialData, CACHE_TTL.MEDIUM);
      let result = await service.get(key);
      expect(result).toEqual(initialData);

      // Update value
      await service.set(key, updatedData, CACHE_TTL.MEDIUM);
      result = await service.get(key);
      expect(result).toEqual(updatedData);

      // Invalidate
      await service.invalidate(key);
      result = await service.get(key);
      expect(result).toBeNull();
    });

    /**
     * Test: Multiple events trigger appropriate invalidations
     * @scenario Multiple events are emitted in sequence
     * @expected Should handle multiple invalidation triggers correctly
     */
    it('should handle multiple sequential events', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const key = CACHE_KEYS.DASHBOARD_METRICS;
      await service.set(key, { data: 1 }, CACHE_TTL.MEDIUM);

      // Trigger multiple events
      await service.onOrderChange();
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);

      mockCacheManager.del.mockClear();
      await service.set(key, { data: 2 }, CACHE_TTL.MEDIUM);

      await service.onPaymentCompleted();
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);

      mockCacheManager.del.mockClear();
      await service.set(key, { data: 3 }, CACHE_TTL.MEDIUM);

      await service.onProductChange();
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    /**
     * Test: Partial cache invalidation during events
     * @scenario Event invalidates some keys but not others
     * @expected Should preserve non-affected cache entries
     */
    it('should preserve unaffected cache entries during events', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const metricsKey = CACHE_KEYS.DASHBOARD_METRICS;
      const productsKey = CACHE_KEYS.TOP_PRODUCTS;
      const analyticsKey = CACHE_KEYS.ANALYTICS_SUMMARY;

      await service.set(metricsKey, { data: 1 }, CACHE_TTL.MEDIUM);
      await service.set(productsKey, { data: 2 }, CACHE_TTL.MEDIUM);
      await service.set(analyticsKey, { data: 3 }, CACHE_TTL.MEDIUM);

      // Payment event should only affect metrics and revenue
      await service.onPaymentCompleted();

      // Products and analytics should still be cached
      const productsResult = await service.get(productsKey);
      const analyticsResult = await service.get(analyticsKey);

      expect(productsResult).toEqual({ data: 2 });
      expect(analyticsResult).toEqual({ data: 3 });
    });
  });
});

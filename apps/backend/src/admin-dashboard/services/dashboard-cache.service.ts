/**
 * @file dashboard-cache.service.ts
 * @description Dashboard Caching Service for optimized metric retrieval
 *
 * PURPOSE:
 * Reduces database load by caching frequently accessed dashboard metrics.
 * Uses a time-based cache with automatic invalidation on relevant data changes.
 *
 * CACHING STRATEGY:
 * - Short TTL (5 minutes) for real-time metrics
 * - Medium TTL (15 minutes) for aggregated data
 * - Long TTL (1 hour) for historical charts
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ORDER_EVENTS,
  PRODUCT_EVENTS,
  PAYMENT_EVENTS,
  REFUND_EVENTS,
} from '../../common/shared-domain';

/**
 * Cache key prefixes for different metric types
 */
export const CACHE_KEYS = {
  DASHBOARD_METRICS: 'dashboard:metrics',
  PENDING_ACTIONS: 'dashboard:pending',
  REVENUE_CHART: 'dashboard:revenue:chart',
  TOP_PRODUCTS: 'dashboard:top:products',
  RECENT_ORDERS: 'dashboard:recent:orders',
  ANALYTICS_SUMMARY: 'dashboard:analytics:summary',
} as const;

/**
 * Cache TTL values in milliseconds
 */
export const CACHE_TTL = {
  SHORT: 5 * 60 * 1000,     // 5 minutes - for pending actions
  MEDIUM: 15 * 60 * 1000,   // 15 minutes - for metrics
  LONG: 60 * 60 * 1000,     // 1 hour - for historical data
} as const;

/**
 * Cached metric interface
 */
interface CachedMetric<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

/**
 * DashboardCacheService
 * @description Provides caching layer for dashboard metrics with event-based invalidation
 *
 * @example
 * // Get cached metrics or compute them
 * const metrics = await this.cacheService.getOrSet(
 *   CACHE_KEYS.DASHBOARD_METRICS,
 *   async () => await this.computeMetrics(),
 *   CACHE_TTL.MEDIUM
 * );
 */
@Injectable()
export class DashboardCacheService {
  private readonly logger = new Logger(DashboardCacheService.name);
  private readonly memoryCache = new Map<string, CachedMetric<unknown>>();

  constructor(
    @Optional()
    @Inject(CACHE_MANAGER)
    private readonly cacheManager?: Cache,
  ) {}

  /**
   * Get cached value or compute and cache it
   * @param key - Cache key
   * @param factory - Function to compute value if not cached
   * @param ttl - Time to live in milliseconds
   * @returns Cached or computed value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    // Compute value
    this.logger.debug(`Cache miss for key: ${key}, computing...`);
    const startTime = Date.now();
    const value = await factory();
    const computeTime = Date.now() - startTime;

    // Cache the result
    await this.set(key, value, ttl);

    this.logger.debug(`Computed and cached key: ${key} in ${computeTime}ms`);
    return value;
  }

  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try distributed cache first (if available)
      if (this.cacheManager) {
        const distributed = await this.cacheManager.get<T>(key);
        if (distributed !== undefined && distributed !== null) {
          return distributed;
        }
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key) as CachedMetric<T> | undefined;
      if (cached) {
        const age = Date.now() - cached.timestamp.getTime();
        if (age < cached.ttl) {
          return cached.data;
        }
        // Expired, remove from memory cache
        this.memoryCache.delete(key);
      }

      return null;
    } catch (error: unknown) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds
   */
  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      // Store in memory cache
      this.memoryCache.set(key, {
        data: value,
        timestamp: new Date(),
        ttl,
      });

      // Store in distributed cache if available
      if (this.cacheManager) {
        await this.cacheManager.set(key, value, ttl);
      }
    } catch (error: unknown) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Invalidate specific cache key
   * @param key - Cache key to invalidate
   */
  async invalidate(key: string): Promise<void> {
    this.logger.debug(`Invalidating cache key: ${key}`);

    this.memoryCache.delete(key);

    if (this.cacheManager) {
      await this.cacheManager.del(key);
    }
  }

  /**
   * Invalidate all keys matching a prefix
   * @param prefix - Key prefix to match
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    this.logger.debug(`Invalidating cache keys with prefix: ${prefix}`);

    // Clear matching keys from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    // Note: Distributed cache invalidation by prefix requires Redis SCAN
    // For now, we rely on TTL expiration for distributed cache
  }

  /**
   * Clear all dashboard caches
   */
  async clearAll(): Promise<void> {
    this.logger.log('Clearing all dashboard caches');
    this.memoryCache.clear();

    if (this.cacheManager) {
      // Clear known dashboard keys
      const keys = Object.values(CACHE_KEYS);
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    }
  }

  // ===========================================================================
  // EVENT-BASED CACHE INVALIDATION
  // ===========================================================================

  /**
   * Invalidate caches when order is created/updated
   */
  @OnEvent(ORDER_EVENTS.CREATED)
  @OnEvent(ORDER_EVENTS.STATUS_CHANGED)
  @OnEvent(ORDER_EVENTS.CANCELLED)
  async onOrderChange(): Promise<void> {
    this.logger.debug('Order change detected, invalidating related caches');
    await Promise.all([
      this.invalidate(CACHE_KEYS.DASHBOARD_METRICS),
      this.invalidate(CACHE_KEYS.PENDING_ACTIONS),
      this.invalidate(CACHE_KEYS.RECENT_ORDERS),
      this.invalidateByPrefix(CACHE_KEYS.REVENUE_CHART),
    ]);
  }

  /**
   * Invalidate caches when payment is completed
   */
  @OnEvent(PAYMENT_EVENTS.COMPLETED)
  async onPaymentCompleted(): Promise<void> {
    this.logger.debug('Payment completed, invalidating revenue caches');
    await Promise.all([
      this.invalidate(CACHE_KEYS.DASHBOARD_METRICS),
      this.invalidateByPrefix(CACHE_KEYS.REVENUE_CHART),
    ]);
  }

  /**
   * Invalidate caches when refund status changes
   */
  @OnEvent(REFUND_EVENTS.REQUESTED)
  @OnEvent(REFUND_EVENTS.COMPLETED)
  async onRefundChange(): Promise<void> {
    this.logger.debug('Refund change detected, invalidating pending caches');
    await Promise.all([
      this.invalidate(CACHE_KEYS.PENDING_ACTIONS),
      this.invalidate(CACHE_KEYS.DASHBOARD_METRICS),
    ]);
  }

  /**
   * Invalidate product-related caches
   */
  @OnEvent(PRODUCT_EVENTS.CREATED)
  @OnEvent(PRODUCT_EVENTS.STATUS_CHANGED)
  async onProductChange(): Promise<void> {
    this.logger.debug('Product change detected, invalidating product caches');
    await Promise.all([
      this.invalidate(CACHE_KEYS.PENDING_ACTIONS),
      this.invalidate(CACHE_KEYS.TOP_PRODUCTS),
      this.invalidate(CACHE_KEYS.DASHBOARD_METRICS),
    ]);
  }

  // ===========================================================================
  // BI METRICS CACHE INVALIDATION
  // ===========================================================================

  /**
   * Invalidate BI caches when CLV calculations complete
   */
  @OnEvent('clv.recalculated')
  async onCLVRecalculated(): Promise<void> {
    this.logger.debug('CLV recalculation detected, invalidating BI caches');
    await Promise.all([
      this.invalidateByPrefix('bi:clv'),
      this.invalidateByPrefix('bi:enhanced:summary'),
      this.invalidateByPrefix('bi:overview'),
    ]);
  }

  /**
   * Invalidate funnel caches when user sessions are updated
   */
  @OnEvent('session.created')
  @OnEvent('session.ended')
  async onSessionChange(): Promise<void> {
    this.logger.debug('Session change detected, invalidating funnel caches');
    await Promise.all([
      this.invalidateByPrefix('bi:funnel'),
      this.invalidateByPrefix('bi:enhanced:summary'),
    ]);
  }

  /**
   * Invalidate abandonment caches when cart is abandoned or recovered
   */
  @OnEvent('cart.abandoned')
  @OnEvent('cart.recovered')
  async onCartAbandonmentChange(): Promise<void> {
    this.logger.debug('Cart abandonment change detected, invalidating caches');
    await Promise.all([
      this.invalidateByPrefix('bi:abandonment'),
      this.invalidateByPrefix('bi:enhanced:summary'),
    ]);
  }

  /**
   * Invalidate cohort caches when new cohorts are created or updated
   */
  @OnEvent('cohort.created')
  @OnEvent('cohort.updated')
  async onCohortChange(): Promise<void> {
    this.logger.debug('Cohort change detected, invalidating cohort caches');
    await Promise.all([
      this.invalidateByPrefix('bi:cohort'),
      this.invalidateByPrefix('bi:overview'),
    ]);
  }

  /**
   * Clear all BI caches (for manual cache management)
   */
  async clearBICaches(): Promise<void> {
    this.logger.log('Clearing all BI caches');
    await Promise.all([
      this.invalidateByPrefix('bi:'),
    ]);
  }

  // ===========================================================================
  // CACHE STATISTICS
  // ===========================================================================

  /**
   * Get cache statistics
   * @returns Cache statistics object
   */
  getStatistics(): {
    memoryCacheSize: number;
    keys: string[];
    oldestEntry: Date | null;
  } {
    let oldestTimestamp: Date | null = null;

    for (const cached of this.memoryCache.values()) {
      if (!oldestTimestamp || cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
      }
    }

    return {
      memoryCacheSize: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
      oldestEntry: oldestTimestamp,
    };
  }
}

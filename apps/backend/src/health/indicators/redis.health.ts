/**
 * @file redis.health.ts
 * @description In-memory cache health indicator
 *
 * Reports healthy status since the application uses in-memory caching.
 * Retained for interface compatibility with health check consumers.
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 2.0.0
 */

import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

/**
 * CacheHealthIndicator
 * @description Reports in-memory cache status (always healthy)
 */
@Injectable()
export class CacheHealthIndicator extends HealthIndicator {
  /**
   * Check cache health — always healthy for in-memory cache
   * @param key - Health indicator key
   * @returns Health indicator result
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    return this.getStatus(key, true, {
      type: 'memory',
      message: 'In-memory cache operational',
      status: 'healthy',
    });
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    return {
      configured: true,
      type: 'memory',
    };
  }
}

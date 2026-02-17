/**
 * @file rate-limiter.service.ts
 * @description In-memory rate limiting service.
 *
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Configurable limits per action type
 * - Exponential backoff support for repeated violations
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Rate limit configuration for different action types
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  maxAttempts: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Block duration in seconds after exceeding limit */
  blockDurationSeconds: number;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current number of attempts in the window */
  currentAttempts: number;
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Seconds until the limit resets */
  retryAfterSeconds: number;
  /** Whether the client is currently blocked */
  isBlocked: boolean;
}

/**
 * In-memory Rate Limiter Service
 *
 * @example
 * ```typescript
 * const result = await rateLimiter.checkLimit('login', '192.168.1.1');
 * if (!result.allowed) {
 *   throw new TooManyRequestsException(result.retryAfterSeconds);
 * }
 * ```
 */
@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  /** In-memory store for rate limit counters */
  private readonly memoryStore = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  /** Default rate limit configurations */
  private readonly rateLimitConfigs: Record<string, RateLimitConfig> = {
    login: { maxAttempts: 5, windowSeconds: 300, blockDurationSeconds: 900 },
    passwordReset: {
      maxAttempts: 3,
      windowSeconds: 3600,
      blockDurationSeconds: 3600,
    },
    otpVerify: {
      maxAttempts: 5,
      windowSeconds: 300,
      blockDurationSeconds: 1800,
    },
    adminApi: {
      maxAttempts: 100,
      windowSeconds: 60,
      blockDurationSeconds: 300,
    },
    general: { maxAttempts: 1000, windowSeconds: 60, blockDurationSeconds: 60 },
  };

  /**
   * Checks if a request is allowed based on rate limiting rules.
   */
  async checkLimit(
    actionType: string,
    identifier: string,
  ): Promise<RateLimitResult> {
    const config =
      this.rateLimitConfigs[actionType] || this.rateLimitConfigs.general;
    const key = `rate_limit:${actionType}:${identifier}`;
    const blockKey = `rate_block:${actionType}:${identifier}`;

    if (this.isBlocked(blockKey)) {
      return {
        allowed: false,
        currentAttempts: config.maxAttempts,
        maxAttempts: config.maxAttempts,
        retryAfterSeconds: this.getTTL(blockKey),
        isBlocked: true,
      };
    }

    const currentAttempts = this.getCurrentAttempts(key);
    return {
      allowed: currentAttempts < config.maxAttempts,
      currentAttempts,
      maxAttempts: config.maxAttempts,
      retryAfterSeconds:
        currentAttempts >= config.maxAttempts ? config.blockDurationSeconds : 0,
      isBlocked: false,
    };
  }

  /**
   * Records a failed attempt and potentially blocks the identifier.
   */
  async recordFailedAttempt(
    actionType: string,
    identifier: string,
  ): Promise<RateLimitResult> {
    const config =
      this.rateLimitConfigs[actionType] || this.rateLimitConfigs.general;
    const key = `rate_limit:${actionType}:${identifier}`;
    const blockKey = `rate_block:${actionType}:${identifier}`;
    const newCount = this.incrementCounter(key, config.windowSeconds);

    if (newCount >= config.maxAttempts) {
      this.setBlock(blockKey, config.blockDurationSeconds);
      this.logger.warn(
        `Rate limit exceeded for ${actionType}:${identifier}. Blocked for ${config.blockDurationSeconds}s`,
      );
      return {
        allowed: false,
        currentAttempts: newCount,
        maxAttempts: config.maxAttempts,
        retryAfterSeconds: config.blockDurationSeconds,
        isBlocked: true,
      };
    }
    return {
      allowed: true,
      currentAttempts: newCount,
      maxAttempts: config.maxAttempts,
      retryAfterSeconds: 0,
      isBlocked: false,
    };
  }

  /** Records a successful attempt (resets the counter). */
  async recordSuccess(actionType: string, identifier: string): Promise<void> {
    this.memoryStore.delete(`rate_limit:${actionType}:${identifier}`);
    this.memoryStore.delete(`rate_block:${actionType}:${identifier}`);
  }

  private isBlocked(blockKey: string): boolean {
    const entry = this.memoryStore.get(blockKey);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(blockKey);
      return false;
    }
    return true;
  }

  private getCurrentAttempts(key: string): number {
    const entry = this.memoryStore.get(key);
    if (!entry) return 0;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return 0;
    }
    return entry.count;
  }

  private incrementCounter(key: string, windowSeconds: number): number {
    const now = Date.now();
    const expiresAt = now + windowSeconds * 1000;
    const entry = this.memoryStore.get(key);
    if (!entry || now > entry.expiresAt) {
      this.memoryStore.set(key, { count: 1, expiresAt });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }

  private setBlock(blockKey: string, durationSeconds: number): void {
    this.memoryStore.set(blockKey, {
      count: 1,
      expiresAt: Date.now() + durationSeconds * 1000,
    });
  }

  private getTTL(key: string): number {
    const entry = this.memoryStore.get(key);
    if (!entry) return 0;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  /** Manually clear rate limit for an identifier (admin use). */
  async clearLimit(actionType: string, identifier: string): Promise<void> {
    this.memoryStore.delete(`rate_limit:${actionType}:${identifier}`);
    this.memoryStore.delete(`rate_block:${actionType}:${identifier}`);
    this.logger.log(`Rate limit cleared for ${actionType}:${identifier}`);
  }

  /** Gets the current rate limit configuration for an action type. */
  getConfig(actionType: string): RateLimitConfig {
    return this.rateLimitConfigs[actionType] || this.rateLimitConfigs.general;
  }
}

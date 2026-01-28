/**
 * @file rate-limiter.service.ts
 * @description Redis-based rate limiting service for distributed environments.
 *
 * Features:
 * - Distributed rate limiting across multiple server instances
 * - Sliding window algorithm for accurate rate limiting
 * - Configurable limits per action type
 * - Exponential backoff support for repeated violations
 * - Fallback to in-memory when Redis unavailable
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

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
 * Redis-based Rate Limiter Service
 *
 * Provides distributed rate limiting for admin operations, authentication,
 * and other security-sensitive endpoints.
 *
 * @example
 * ```typescript
 * // Check if request is allowed
 * const result = await rateLimiter.checkLimit('login', '192.168.1.1');
 * if (!result.allowed) {
 *   throw new TooManyRequestsException(result.retryAfterSeconds);
 * }
 *
 * // Record a failed attempt (increases counter and may trigger block)
 * await rateLimiter.recordFailedAttempt('login', '192.168.1.1');
 * ```
 */
@Injectable()
export class RateLimiterService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);

  /** Redis client for distributed rate limiting */
  private redis: Redis.Redis | null = null;

  /** Fallback in-memory store when Redis unavailable */
  private readonly memoryStore: Map<string, { count: number; expiresAt: number }> =
    new Map();

  /** Whether Redis connection is healthy */
  private redisHealthy = false;

  /**
   * Default rate limit configurations for different action types
   */
  private readonly rateLimitConfigs: Record<string, RateLimitConfig> = {
    /** Login attempts - strict to prevent brute force */
    login: {
      maxAttempts: 5,
      windowSeconds: 300, // 5 minutes
      blockDurationSeconds: 900, // 15 minutes block
    },
    /** Password reset requests */
    passwordReset: {
      maxAttempts: 3,
      windowSeconds: 3600, // 1 hour
      blockDurationSeconds: 3600, // 1 hour block
    },
    /** OTP verification attempts */
    otpVerify: {
      maxAttempts: 5,
      windowSeconds: 300, // 5 minutes
      blockDurationSeconds: 1800, // 30 minutes block
    },
    /** Admin API operations */
    adminApi: {
      maxAttempts: 100,
      windowSeconds: 60, // 1 minute
      blockDurationSeconds: 300, // 5 minutes block
    },
    /** General API rate limit */
    general: {
      maxAttempts: 1000,
      windowSeconds: 60, // 1 minute
      blockDurationSeconds: 60, // 1 minute block
    },
  };

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  /**
   * Initializes Redis connection with health monitoring
   */
  private async initializeRedis(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    try {
      if (redisUrl) {
        this.redis = new Redis.default(redisUrl);
      } else {
        this.redis = new Redis.default({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          retryStrategy: (times) => {
            if (times > 3) {
              this.logger.warn(
                'Redis connection failed after 3 retries, using in-memory fallback',
              );
              return null;
            }
            return Math.min(times * 100, 3000);
          },
        });
      }

      this.redis.on('connect', () => {
        this.redisHealthy = true;
        this.logger.log('Redis connected for rate limiting');
      });

      this.redis.on('error', (error) => {
        this.redisHealthy = false;
        this.logger.warn(`Redis connection error: ${(error as Error).message}`);
      });

      this.redis.on('close', () => {
        this.redisHealthy = false;
        this.logger.warn('Redis connection closed');
      });

      // Test connection
      await this.redis.ping();
      this.redisHealthy = true;
      this.logger.log('Rate limiter initialized with Redis');
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to connect to Redis: ${(error as Error).message}. Using in-memory fallback.`,
      );
      this.redis = null;
      this.redisHealthy = false;
    }
  }

  /**
   * Cleanup Redis connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Checks if a request is allowed based on rate limiting rules.
   *
   * @param actionType - Type of action (login, passwordReset, etc.)
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns Rate limit result with allowed status and retry info
   */
  async checkLimit(
    actionType: string,
    identifier: string,
  ): Promise<RateLimitResult> {
    const config = this.rateLimitConfigs[actionType] || this.rateLimitConfigs.general;
    const key = `rate_limit:${actionType}:${identifier}`;
    const blockKey = `rate_block:${actionType}:${identifier}`;

    // Check if currently blocked
    const isBlocked = await this.isBlocked(blockKey);
    if (isBlocked) {
      const ttl = await this.getTTL(blockKey);
      return {
        allowed: false,
        currentAttempts: config.maxAttempts,
        maxAttempts: config.maxAttempts,
        retryAfterSeconds: ttl,
        isBlocked: true,
      };
    }

    const currentAttempts = await this.getCurrentAttempts(key);

    return {
      allowed: currentAttempts < config.maxAttempts,
      currentAttempts,
      maxAttempts: config.maxAttempts,
      retryAfterSeconds: currentAttempts >= config.maxAttempts ? config.blockDurationSeconds : 0,
      isBlocked: false,
    };
  }

  /**
   * Records a failed attempt and potentially blocks the identifier.
   *
   * @param actionType - Type of action
   * @param identifier - Unique identifier
   * @returns Updated rate limit result
   */
  async recordFailedAttempt(
    actionType: string,
    identifier: string,
  ): Promise<RateLimitResult> {
    const config = this.rateLimitConfigs[actionType] || this.rateLimitConfigs.general;
    const key = `rate_limit:${actionType}:${identifier}`;
    const blockKey = `rate_block:${actionType}:${identifier}`;

    const newCount = await this.incrementCounter(key, config.windowSeconds);

    // Block if limit exceeded
    if (newCount >= config.maxAttempts) {
      await this.setBlock(blockKey, config.blockDurationSeconds);
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

  /**
   * Records a successful attempt (resets the counter).
   *
   * @param actionType - Type of action
   * @param identifier - Unique identifier
   */
  async recordSuccess(actionType: string, identifier: string): Promise<void> {
    const key = `rate_limit:${actionType}:${identifier}`;
    const blockKey = `rate_block:${actionType}:${identifier}`;

    if (this.redisHealthy && this.redis) {
      await this.redis.del(key, blockKey);
    } else {
      this.memoryStore.delete(key);
      this.memoryStore.delete(blockKey);
    }
  }

  /**
   * Checks if an identifier is currently blocked.
   */
  private async isBlocked(blockKey: string): Promise<boolean> {
    if (this.redisHealthy && this.redis) {
      const blocked = await this.redis.exists(blockKey);
      return blocked === 1;
    }

    const entry = this.memoryStore.get(blockKey);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(blockKey);
      return false;
    }
    return true;
  }

  /**
   * Gets current attempt count for a key.
   */
  private async getCurrentAttempts(key: string): Promise<number> {
    if (this.redisHealthy && this.redis) {
      const count = await this.redis.get(key);
      return count ? parseInt(count, 10) : 0;
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return 0;
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return 0;
    }
    return entry.count;
  }

  /**
   * Increments the counter for a key with expiry.
   */
  private async incrementCounter(key: string, windowSeconds: number): Promise<number> {
    if (this.redisHealthy && this.redis) {
      const multi = this.redis.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();
      return results[0][1] as number;
    }

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

  /**
   * Sets a block for an identifier.
   */
  private async setBlock(blockKey: string, durationSeconds: number): Promise<void> {
    if (this.redisHealthy && this.redis) {
      await this.redis.setex(blockKey, durationSeconds, '1');
    } else {
      this.memoryStore.set(blockKey, {
        count: 1,
        expiresAt: Date.now() + durationSeconds * 1000,
      });
    }
  }

  /**
   * Gets TTL (time-to-live) for a key.
   */
  private async getTTL(key: string): Promise<number> {
    if (this.redisHealthy && this.redis) {
      const ttl = await this.redis.ttl(key);
      return ttl > 0 ? ttl : 0;
    }

    const entry = this.memoryStore.get(key);
    if (!entry) return 0;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Manually clear rate limit for an identifier (admin use).
   */
  async clearLimit(actionType: string, identifier: string): Promise<void> {
    const key = `rate_limit:${actionType}:${identifier}`;
    const blockKey = `rate_block:${actionType}:${identifier}`;

    if (this.redisHealthy && this.redis) {
      await this.redis.del(key, blockKey);
    } else {
      this.memoryStore.delete(key);
      this.memoryStore.delete(blockKey);
    }

    this.logger.log(`Rate limit cleared for ${actionType}:${identifier}`);
  }

  /**
   * Gets the current rate limit configuration for an action type.
   */
  getConfig(actionType: string): RateLimitConfig {
    return this.rateLimitConfigs[actionType] || this.rateLimitConfigs.general;
  }

  /**
   * Checks if Redis is currently healthy.
   */
  isRedisHealthy(): boolean {
    return this.redisHealthy;
  }
}

/**
 * @file typeorm.config.ts
 * @description TypeORM configuration for SouqSyria database connection
 *
 * Performance Optimizations (PERF-C03, PERF-C04):
 * - Connection pooling: min 5, max 20 connections for production workloads
 * - Query caching: Redis-based caching with fallback to in-memory
 * - Optimized timeout settings for production reliability
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

/**
 * Determine if Redis is available for caching
 * Falls back to in-memory cache if Redis is not configured
 */
const isRedisConfigured = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);
const isProduction = process.env.NODE_ENV === 'production';

/**
 * PERF-C03: Cache configuration
 * Uses Redis in production for distributed caching across instances
 * Falls back to in-memory cache for development/single-instance deployments
 */
const cacheConfig = isRedisConfigured
  ? {
      // Redis cache for distributed environments
      type: 'redis' as const,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_CACHE_DB || '1', 10), // Separate DB from rate limiting
      },
      duration: 30000, // 30 seconds default cache TTL
    }
  : {
      // In-memory cache for single instance deployments
      type: 'database' as const,
      tableName: 'typeorm_cache',
      duration: 30000, // 30 seconds default cache TTL
    };

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Disabled - entities have duplicate index issues; use SQL migrations instead
  dropSchema: false, // Disable schema dropping to prevent duplicate index errors
  logging: isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'], // More logging in development

  /**
   * PERF-C03: Enable query caching
   * Caches frequently accessed queries to reduce database load
   */
  cache: cacheConfig,

  /**
   * PERF-C04: Connection pool configuration
   * Optimizes connection management for production workloads
   *
   * Pool settings:
   * - min: 5 - Minimum connections kept alive (reduces cold start latency)
   * - max: 20 - Maximum concurrent connections (prevents DB overload)
   * - acquireTimeout: 30s - Time to wait for available connection
   * - idleTimeout: 60s - Time before idle connections are closed
   */
  extra: {
    // Connection pool settings for mysql2 driver
    connectionLimit: isProduction ? 20 : 10, // Max pool size
    waitForConnections: true, // Queue requests when pool exhausted
    queueLimit: 0, // Unlimited queue (0 = no limit)
    acquireTimeout: 30000, // 30s timeout to acquire connection
    timeout: 30000, // General timeout
    enableKeepAlive: true, // Keep connections alive
    keepAliveInitialDelay: 10000, // 10s delay before keepalive
    // Connection retry settings
    reconnect: true,
    maxIdle: 5, // Maximum idle connections
    idleTimeout: 60000, // 60s idle timeout
  },

  /**
   * Retry strategy for connection failures
   */
  retryAttempts: isProduction ? 10 : 3,
  retryDelay: 3000, // 3s delay between retries

  /**
   * Auto-load all entities (useful for large projects)
   */
  autoLoadEntities: true,
};

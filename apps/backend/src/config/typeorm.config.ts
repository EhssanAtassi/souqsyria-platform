/**
 * @file typeorm.config.ts
 * @description TypeORM configuration for SouqSyria database connection
 *
 * Performance Optimizations (PERF-C03, PERF-C04):
 * - Connection pooling: min 5, max 20 connections for production workloads
 * - Query caching: database-based caching
 * - Optimized timeout settings for production reliability
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config({
  path: [
    join(__dirname, '..', '..', '..', '..', '.env.development'),
    join(__dirname, '..', '..', '..', '..', '.env'),
    '.env.development',
    '.env',
  ],
});

const isProduction = process.env.NODE_ENV === 'production';

/**
 * PERF-C03: Cache configuration
 * Uses database-based cache table for query caching
 */
const cacheConfig = {
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
  database: process.env.DB_NAME || process.env.DB_DATABASE,
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
   * - connectionLimit: 10 dev / 20 prod - Maximum concurrent connections
   * - connectTimeout: 30s - Time to establish a connection
   * - idleTimeout: 60s - Time before idle connections are closed
   */
  extra: {
    // Connection pool settings for mysql2 driver
    connectionLimit: isProduction ? 20 : 10, // Max pool size
    waitForConnections: true, // Queue requests when pool exhausted
    queueLimit: 0, // Unlimited queue (0 = no limit)
    connectTimeout: 30000, // 30s timeout to establish connection
    enableKeepAlive: true, // Keep connections alive
    keepAliveInitialDelay: 10000, // 10s delay before keepalive
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

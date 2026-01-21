/**
 * @file database.health.ts
 * @description Database Health Indicator for TypeORM connectivity
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * DatabaseHealthIndicator
 * @description Checks database connectivity and query execution
 *
 * @example
 * // In health controller:
 * () => this.database.isHealthy('database_query')
 */
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  /**
   * Check database health by executing a simple query
   * @param key - Health indicator key
   * @returns Health indicator result
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Test database connectivity with a simple query
      await this.dataSource.query('SELECT 1 as health_check');

      const responseTime = Date.now() - startTime;

      // Check if response time is acceptable (< 1000ms)
      const isHealthy = responseTime < 1000;

      const result = this.getStatus(key, isHealthy, {
        responseTime: `${responseTime}ms`,
        connected: true,
        database: this.dataSource.options.database,
        type: this.dataSource.options.type,
      });

      if (!isHealthy) {
        throw new HealthCheckError(
          'Database response time too slow',
          result,
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';

      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, {
          message: errorMessage,
          connected: false,
        }),
      );
    }
  }

  /**
   * Check if database connection pool is healthy
   * @param key - Health indicator key
   * @returns Health indicator result
   */
  async checkConnectionPool(key: string): Promise<HealthIndicatorResult> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();

      // Check if we can acquire a connection
      await queryRunner.connect();
      await queryRunner.release();

      return this.getStatus(key, true, {
        poolStatus: 'healthy',
        maxConnections: this.dataSource.options.extra?.max || 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection pool error';

      throw new HealthCheckError(
        'Connection pool check failed',
        this.getStatus(key, false, {
          message: errorMessage,
          poolStatus: 'unhealthy',
        }),
      );
    }
  }

  /**
   * Get database statistics
   * @returns Database statistics
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    try {
      // Get connection statistics
      return {
        isConnected: this.dataSource.isInitialized,
        database: this.dataSource.options.database,
        type: this.dataSource.options.type,
        entities: this.dataSource.entityMetadatas.length,
        migrations: (await this.dataSource.showMigrations()) ? 'pending' : 'up-to-date',
      };
    } catch {
      return {
        isConnected: false,
        error: 'Failed to get database statistics',
      };
    }
  }
}

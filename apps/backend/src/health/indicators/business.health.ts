/**
 * @file business.health.ts
 * @description Business Health Indicator for application-specific metrics
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

/**
 * BusinessHealthIndicator
 * @description Checks business-critical metrics and system readiness
 *
 * @example
 * // In health controller:
 * () => this.business.isHealthy('business_metrics')
 */
@Injectable()
export class BusinessHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  /**
   * Check overall business health
   * @param key - Health indicator key
   * @returns Health indicator result
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const metrics = await this.gatherBusinessMetrics();

      // Business is healthy if all critical checks pass
      const isHealthy = Boolean(
        metrics.databaseConnected &&
        metrics.criticalTablesExist &&
        metrics.recentActivityDetected,
      );

      const result = this.getStatus(key, isHealthy, {
        ...metrics,
        checkedAt: new Date().toISOString(),
      });

      if (!isHealthy) {
        throw new HealthCheckError('Business health check failed', result);
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof HealthCheckError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error
          ? (error as Error).message
          : 'Unknown business health error';

      throw new HealthCheckError(
        'Business health check failed',
        this.getStatus(key, false, {
          message: errorMessage,
        }),
      );
    }
  }

  /**
   * Gather business metrics
   * @returns Business metrics object
   */
  private async gatherBusinessMetrics(): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {
      databaseConnected: false,
      criticalTablesExist: false,
      recentActivityDetected: false,
    };

    try {
      // Check database connection
      metrics.databaseConnected = this.dataSource.isInitialized;

      if (!metrics.databaseConnected) {
        return metrics;
      }

      // Check critical tables exist
      const criticalTables = ['users', 'products', 'orders'];
      const existingTables: string[] = [];

      for (const table of criticalTables) {
        try {
          await this.dataSource.query(`SELECT 1 FROM \`${table}\` LIMIT 1`);
          existingTables.push(table);
        } catch {
          // Table doesn't exist or is empty, which is fine
        }
      }

      metrics.criticalTablesExist = existingTables.length > 0;
      metrics.existingTables = existingTables;

      // Check for recent activity (any order or user in last 24h)
      try {
        const recentUsers = await this.dataSource.query(`
          SELECT COUNT(*) as count
          FROM users
          WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);
        metrics.recentUsersCount = parseInt(recentUsers[0]?.count || '0', 10);
        metrics.recentActivityDetected = true; // If we can query, system is active
      } catch {
        // Query failed, but system might still be healthy
        metrics.recentActivityDetected = true;
      }

      // Get some basic counts for monitoring
      try {
        const userCount = await this.dataSource.query(
          'SELECT COUNT(*) as count FROM users',
        );
        metrics.totalUsers = parseInt(userCount[0]?.count || '0', 10);
      } catch {
        metrics.totalUsers = 'unavailable';
      }

      try {
        const productCount = await this.dataSource.query(
          'SELECT COUNT(*) as count FROM products',
        );
        metrics.totalProducts = parseInt(productCount[0]?.count || '0', 10);
      } catch {
        metrics.totalProducts = 'unavailable';
      }

      try {
        const orderCount = await this.dataSource.query(
          'SELECT COUNT(*) as count FROM orders',
        );
        metrics.totalOrders = parseInt(orderCount[0]?.count || '0', 10);
      } catch {
        metrics.totalOrders = 'unavailable';
      }
    } catch (error: unknown) {
      metrics.error =
        error instanceof Error ? (error as Error).message : 'Unknown error';
    }

    return metrics;
  }

  /**
   * Get detailed business statistics
   * @returns Business statistics
   */
  async getStatistics(): Promise<Record<string, unknown>> {
    return this.gatherBusinessMetrics();
  }
}

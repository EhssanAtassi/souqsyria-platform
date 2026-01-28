/**
 * @file business.health.spec.ts
 * @description Unit tests for Business Health Indicator
 *
 * Tests business metrics collection, critical table verification,
 * and system readiness validation.
 *
 * @author Test Suite
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BusinessHealthIndicator } from './business.health';
import { DataSource } from 'typeorm';
import { HealthCheckError } from '@nestjs/terminus';

describe('BusinessHealthIndicator', () => {
  let indicator: BusinessHealthIndicator;
  let mockDataSource: jest.Mocked<DataSource>;
  let isInitializedValue = true;

  // Helper to set isInitialized (readonly property)
  const setIsInitialized = (value: boolean) => {
    isInitializedValue = value;
  };

  beforeEach(async () => {
    isInitializedValue = true;

    // Mock DataSource with getter for readonly property
    mockDataSource = {
      query: jest.fn(),
      get isInitialized() {
        return isInitializedValue;
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessHealthIndicator,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    indicator = module.get<BusinessHealthIndicator>(BusinessHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isHealthy()', () => {
    /**
     * Test: Should return healthy status when all checks pass
     * Description: Business health should be OK when DB is connected and has data
     */
    it('should return healthy status when all checks pass', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }]) // users table check
        .mockResolvedValueOnce([{ count: '5' }]) // recent users count
        .mockResolvedValueOnce([{ count: '100' }]) // total users
        .mockResolvedValueOnce([{ count: '500' }]) // total products
        .mockResolvedValueOnce([{ count: '50' }]); // total orders

      const result = await indicator.isHealthy('business_metrics');

      expect(result).toBeDefined();
      expect(result['business_metrics'].status).toBe('up');
    });

    /**
     * Test: Should include database connected status
     * Description: Result should indicate database connection status
     */
    it('should include database connected status', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics']).toHaveProperty('databaseConnected');
      expect(result['business_metrics'].databaseConnected).toBe(true);
    });

    /**
     * Test: Should verify critical tables exist
     * Description: Business health should check users, products, orders tables
     */
    it('should verify critical tables exist', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics']).toHaveProperty('criticalTablesExist');
      expect(result['business_metrics'].criticalTablesExist).toBe(true);
    });

    /**
     * Test: Should detect recent activity
     * Description: Business health should show if system has recent activity
     */
    it('should detect recent activity', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics']).toHaveProperty('recentActivityDetected');
      expect(result['business_metrics'].recentActivityDetected).toBe(true);
    });

    /**
     * Test: Should include entity counts
     * Description: Result should show total users, products, and orders
     */
    it('should include entity counts', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics']).toHaveProperty('totalUsers');
      expect(result['business_metrics']).toHaveProperty('totalProducts');
      expect(result['business_metrics']).toHaveProperty('totalOrders');
      expect(result['business_metrics'].totalUsers).toBe(100);
      expect(result['business_metrics'].totalProducts).toBe(500);
      expect(result['business_metrics'].totalOrders).toBe(50);
    });

    /**
     * Test: Should fail when database is not connected
     * Description: Unhealthy when DataSource is not initialized
     */
    it('should fail when database is not connected', async () => {
      setIsInitialized(false);

      await expect(indicator.isHealthy('business_metrics')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should fail when critical tables don't exist
     * Description: Unhealthy if no critical tables are accessible
     */
    it('should fail when critical tables do not exist', async () => {
      setIsInitialized(true);

      // All table checks fail
      (mockDataSource.query as jest.Mock).mockRejectedValue(
        new Error('Table not found'),
      );

      await expect(indicator.isHealthy('business_metrics')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should handle partial table availability
     * Description: Should list which tables are available
     */
    it('should handle partial table availability', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }]) // users exists
        .mockRejectedValueOnce(new Error('Table not found')) // products doesn't exist
        .mockResolvedValueOnce([{ '1': 1 }]) // orders exists
        .mockResolvedValueOnce([{ count: '5' }]) // recent activity check still succeeds
        .mockResolvedValueOnce([{ count: '100' }])
        .mockRejectedValueOnce(new Error('Table not found'))
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics']).toHaveProperty('existingTables');
    });

    /**
     * Test: Should throw HealthCheckError on failure
     * Description: Should throw proper error type on health check failure
     */
    it('should throw HealthCheckError on failure', async () => {
      setIsInitialized(false);

      await expect(indicator.isHealthy('business_metrics')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should not re-throw HealthCheckError
     * Description: Should wrap errors in HealthCheckError properly
     */
    it('should handle HealthCheckError appropriately', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockRejectedValueOnce(new Error('Query failed'));

      await expect(indicator.isHealthy('business_metrics')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should include timestamp in result
     * Description: Result should show when health check was performed
     */
    it('should include timestamp in result', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics']).toHaveProperty('checkedAt');
      expect(typeof result['business_metrics'].checkedAt).toBe('string');
    });
  });

  describe('gatherBusinessMetrics() - Private Method Tests', () => {
    /**
     * Test: Should check database connection first
     * Description: Should exit early if database is not initialized
     */
    it('should return early when database not connected', async () => {
      setIsInitialized(false);

      const metrics = await indicator.isHealthy('business_metrics');

      // Will fail due to unhealthy status
      expect(mockDataSource.query).not.toHaveBeenCalled();
    });

    /**
     * Test: Should check each critical table
     * Description: Should attempt to query users, products, and orders tables
     */
    it('should check each critical table', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }]) // users
        .mockResolvedValueOnce([{ '1': 1 }]) // products
        .mockResolvedValueOnce([{ '1': 1 }]) // orders
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      await indicator.isHealthy('business_metrics');

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM `users`'),
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM `products`'),
      );
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM `orders`'),
      );
    });

    /**
     * Test: Should check for recent users
     * Description: Should query for users created in last 24 hours
     */
    it('should check for recent users', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      await indicator.isHealthy('business_metrics');

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('DATE_SUB(NOW(), INTERVAL 24 HOUR)'),
      );
    });

    /**
     * Test: Should count total users
     * Description: Should include total user count in metrics
     */
    it('should count total users', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '42' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].totalUsers).toBe(42);
    });

    /**
     * Test: Should count total products
     * Description: Should include total product count in metrics
     */
    it('should count total products', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '234' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].totalProducts).toBe(234);
    });

    /**
     * Test: Should count total orders
     * Description: Should include total order count in metrics
     */
    it('should count total orders', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '67' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].totalOrders).toBe(67);
    });

    /**
     * Test: Should handle missing count data
     * Description: Should default to 0 when count query returns empty or null
     */
    it('should handle missing count data', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([]) // Empty result
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      // Should still be healthy
      expect(result['business_metrics'].status).toBe('up');
    });

    /**
     * Test: Should mark tables as unavailable when query fails
     * Description: Should handle errors gracefully
     */
    it('should mark unavailable tables', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }]) // users
        .mockRejectedValueOnce(new Error('Table not found')) // products
        .mockResolvedValueOnce([{ '1': 1 }]) // orders
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }]) // fallback for products count
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].existingTables).toContain('users');
      expect(result['business_metrics'].existingTables).toContain('orders');
    });
  });

  describe('getStatistics()', () => {
    /**
     * Test: Should return business statistics
     * Description: getStatistics should gather same metrics as isHealthy
     */
    it('should return business statistics', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const stats = await indicator.getStatistics();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('databaseConnected');
      expect(stats).toHaveProperty('criticalTablesExist');
    });

    /**
     * Test: Statistics should include entity counts
     * Description: getStatistics should provide same counts as health check
     */
    it('statistics should include entity counts', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const stats = await indicator.getStatistics();

      expect(stats.totalUsers).toBe(100);
      expect(stats.totalProducts).toBe(500);
      expect(stats.totalOrders).toBe(50);
    });

    /**
     * Test: Should handle database errors in statistics
     * Description: getStatistics should not throw on database errors
     */
    it('should handle database errors gracefully', async () => {
      setIsInitialized(false);

      const stats = await indicator.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.databaseConnected).toBe(false);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: Should handle query errors gracefully
     * Description: Individual query failures should not crash health check
     */
    it('should handle individual query errors', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockRejectedValueOnce(new Error('Query error'))
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result).toBeDefined();
    });

    /**
     * Test: Should handle non-Error exceptions
     * Description: Should handle string or object exceptions
     */
    it('should handle non-Error exceptions', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock).mockRejectedValue('String error');

      await expect(indicator.isHealthy('business_metrics')).rejects.toThrow();
    });

    /**
     * Test: Should include error message in metrics
     * Description: When error occurs, should include error field in metrics
     */
    it('should include error message when exception occurs', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock).mockRejectedValue(
        new Error('Connection failed'),
      );

      try {
        await indicator.isHealthy('business_metrics');
      } catch (err: any) {
        expect(err.cause['business_metrics']).toHaveProperty('message');
      }
    });
  });

  describe('Response Format', () => {
    /**
     * Test: Should return valid HealthIndicatorResult
     * Description: Response should follow NestJS health indicator format
     */
    it('should return valid HealthIndicatorResult format', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result).toHaveProperty('business_metrics');
      expect(result['business_metrics']).toHaveProperty('status');
      expect(['up', 'down']).toContain(result['business_metrics'].status);
    });

    /**
     * Test: Status should be 'up' or 'down'
     * Description: Valid health indicator status values
     */
    it('status should be valid', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].status).toBe('up');
    });
  });

  describe('Critical Metrics Validation', () => {
    /**
     * Test: All three conditions must be true for healthy status
     * Description: databaseConnected AND criticalTablesExist AND recentActivityDetected
     */
    it('all three conditions required for healthy status', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].databaseConnected).toBe(true);
      expect(result['business_metrics'].criticalTablesExist).toBe(true);
      expect(result['business_metrics'].recentActivityDetected).toBe(true);
    });

    /**
     * Test: Should fail if database not connected
     * Description: Database connection is critical
     */
    it('should fail if database not connected', async () => {
      setIsInitialized(false);

      await expect(indicator.isHealthy('business_metrics')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should handle no critical tables gracefully
     * Description: System should still function if some tables are missing
     */
    it('should work with available critical tables', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockRejectedValueOnce(new Error('users not found'))
        .mockResolvedValueOnce([{ '1': 1 }]) // products exists
        .mockResolvedValueOnce([{ '1': 1 }]) // orders exists
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '0' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const result = await indicator.isHealthy('business_metrics');

      expect(result['business_metrics'].criticalTablesExist).toBe(true);
    });
  });

  describe('Performance', () => {
    /**
     * Test: Should complete business health check in reasonable time
     * Description: Health check should complete in < 2 seconds
     */
    it('should complete in reasonable time', async () => {
      setIsInitialized(true);

      (mockDataSource.query as jest.Mock)
        .mockResolvedValueOnce([{ '1': 1 }])
        .mockResolvedValueOnce([{ count: '5' }])
        .mockResolvedValueOnce([{ count: '100' }])
        .mockResolvedValueOnce([{ count: '500' }])
        .mockResolvedValueOnce([{ count: '50' }]);

      const start = performance.now();
      await indicator.isHealthy('business_metrics');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(2000);
    });
  });
});

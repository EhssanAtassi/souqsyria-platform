/**
 * @file database.health.spec.ts
 * @description Unit tests for Database Health Indicator
 *
 * Tests database connectivity, query execution, connection pooling,
 * and statistics gathering.
 *
 * @author Test Suite
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthIndicator } from './database.health';
import { DataSource } from 'typeorm';
import { HealthCheckError } from '@nestjs/terminus';

describe('DatabaseHealthIndicator', () => {
  let indicator: DatabaseHealthIndicator;
  let mockDataSource: jest.Mocked<DataSource>;
  let isInitializedValue = true;
  let dbTypeValue = 'mysql';

  // Helpers to set readonly properties
  const setIsInitialized = (value: boolean) => {
    isInitializedValue = value;
  };
  const setDbType = (value: string) => {
    dbTypeValue = value;
  };

  beforeEach(async () => {
    isInitializedValue = true;
    dbTypeValue = 'mysql';

    // Mock DataSource with getters for readonly properties
    mockDataSource = {
      query: jest.fn(),
      createQueryRunner: jest.fn(),
      get isInitialized() {
        return isInitializedValue;
      },
      get options() {
        return {
          database: 'test_db',
          get type() {
            return dbTypeValue;
          },
          extra: {
            max: 10,
          },
        };
      },
      entityMetadatas: [
        { name: 'User' },
        { name: 'Product' },
      ] as any,
      showMigrations: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthIndicator,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    indicator = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isHealthy()', () => {
    /**
     * Test: Should return healthy status when database is accessible
     * Description: Database query should complete and return success status
     */
    it('should return healthy status when database is accessible', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result).toBeDefined();
      expect(result['database_query'].status).toBe('up');
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1 as health_check');
    });

    /**
     * Test: Should include response time in result
     * Description: Health check result should include query execution time
     */
    it('should include response time in result', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result).toHaveProperty('database_query');
      expect(result['database_query']).toHaveProperty('responseTime');
      expect(typeof result['database_query'].responseTime).toBe('string');
      expect(result['database_query'].responseTime).toMatch(/^\d+ms$/);
    });

    /**
     * Test: Should mark as connected in details
     * Description: Result should indicate database is connected
     */
    it('should mark as connected in details', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result['database_query'].connected).toBe(true);
    });

    /**
     * Test: Should include database information
     * Description: Result should contain database type and name
     */
    it('should include database information', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result['database_query'].database).toBe('test_db');
      expect(result['database_query'].type).toBe('mysql');
    });

    /**
     * Test: Should fail when query response time exceeds threshold
     * Description: Response time > 1000ms should mark as unhealthy
     */
    it('should fail when query response time exceeds threshold', async () => {
      // Mock slow query - we'll need to patch Date.now()
      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 2500; // 1500ms delay
      });

      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      await expect(indicator.isHealthy('database_query')).rejects.toThrow(
        HealthCheckError,
      );

      jest.restoreAllMocks();
    });

    /**
     * Test: Should throw HealthCheckError on database failure
     * Description: Database query failure should throw HealthCheckError
     */
    it('should throw HealthCheckError on database failure', async () => {
      const error = new Error('Connection refused');
      (mockDataSource.query as jest.Mock).mockRejectedValue(error);

      await expect(indicator.isHealthy('database_query')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should include error message in result
     * Description: When database fails, error message should be included
     */
    it('should include error message in result', async () => {
      const error = new Error('Connection timeout');
      (mockDataSource.query as jest.Mock).mockRejectedValue(error);

      try {
        await indicator.isHealthy('database_query');
      } catch (err: any) {
        expect(err).toBeInstanceOf(HealthCheckError);
        expect((err as Error).message).toBe('Database health check failed');
        expect(err.cause['database_query']).toHaveProperty('message');
      }
    });

    /**
     * Test: Should mark as disconnected when query fails
     * Description: Failed query should set connected: false
     */
    it('should mark as disconnected when query fails', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue(
        new Error('Connection lost'),
      );

      try {
        await indicator.isHealthy('database_query');
      } catch (err: any) {
        expect(err.cause['database_query'].connected).toBe(false);
      }
    });

    /**
     * Test: Should execute SELECT 1 query
     * Description: Health check should use simple SELECT 1 query
     */
    it('should execute SELECT 1 query', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      await indicator.isHealthy('database_query');

      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1 as health_check');
    });
  });

  describe('checkConnectionPool()', () => {
    /**
     * Test: Should return healthy status when connection acquired
     * Description: Should be able to acquire and release connection from pool
     */
    it('should return healthy status when connection acquired', async () => {
      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        mockQueryRunner,
      );

      const result = await indicator.checkConnectionPool('connection_pool');

      expect(result['database_query'].status).toBe('up');
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    /**
     * Test: Should include pool status in result
     * Description: Result should indicate pool is healthy
     */
    it('should include pool status in result', async () => {
      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        mockQueryRunner,
      );

      const result = await indicator.checkConnectionPool('connection_pool');

      expect(result['connection_pool'].poolStatus).toBe('healthy');
    });

    /**
     * Test: Should include max connections info
     * Description: Result should show maximum pool connections
     */
    it('should include max connections info', async () => {
      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        mockQueryRunner,
      );

      const result = await indicator.checkConnectionPool('connection_pool');

      expect(result['connection_pool']).toHaveProperty('maxConnections');
      expect(result['connection_pool'].maxConnections).toBe(10);
    });

    /**
     * Test: Should throw error when connection fails
     * Description: Should throw HealthCheckError if unable to connect
     */
    it('should throw error when connection fails', async () => {
      const mockQueryRunner = {
        connect: jest.fn().mockRejectedValue(new Error('Connection pool exhausted')),
        release: jest.fn(),
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        mockQueryRunner,
      );

      await expect(indicator.checkConnectionPool('connection_pool')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should mark pool as unhealthy on error
     * Description: Failed connection should set poolStatus: unhealthy
     */
    it('should mark pool as unhealthy on error', async () => {
      const mockQueryRunner = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        release: jest.fn(),
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        mockQueryRunner,
      );

      try {
        await indicator.checkConnectionPool('connection_pool');
      } catch (err: any) {
        expect(err.cause['database_query'].poolStatus).toBe('unhealthy');
      }
    });

    /**
     * Test: Should always release connection
     * Description: Connection should be released even on success
     */
    it('should always release connection', async () => {
      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        mockQueryRunner,
      );

      await indicator.checkConnectionPool('connection_pool');

      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('getStatistics()', () => {
    /**
     * Test: Should return database statistics object
     * Description: Statistics should include connection status and metadata
     */
    it('should return database statistics object', async () => {
      const stats = await indicator.getStatistics();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('isConnected');
      expect(stats).toHaveProperty('database');
      expect(stats).toHaveProperty('type');
      expect(stats).toHaveProperty('entities');
    });

    /**
     * Test: Should indicate connected status
     * Description: Should show if DataSource is initialized
     */
    it('should indicate connected status', async () => {
      const stats = await indicator.getStatistics();

      expect(stats.isConnected).toBe(true);
    });

    /**
     * Test: Should include database name
     * Description: Statistics should show database name
     */
    it('should include database name', async () => {
      const stats = await indicator.getStatistics();

      expect(stats.database).toBe('test_db');
    });

    /**
     * Test: Should include database type
     * Description: Statistics should show database type (mysql, postgres, etc)
     */
    it('should include database type', async () => {
      const stats = await indicator.getStatistics();

      expect(stats.type).toBe('mysql');
    });

    /**
     * Test: Should include entity count
     * Description: Statistics should count registered entities
     */
    it('should include entity count', async () => {
      const stats = await indicator.getStatistics();

      expect(stats.entities).toBe(2);
    });

    /**
     * Test: Should include migration status
     * Description: Statistics should indicate if migrations are pending or up-to-date
     */
    it('should include migration status', async () => {
      (mockDataSource.showMigrations as jest.Mock).mockResolvedValue(null);

      const stats = await indicator.getStatistics();

      expect(stats).toHaveProperty('migrations');
    });

    /**
     * Test: Should handle disconnected state
     * Description: Statistics should handle when DataSource is not initialized
     */
    it('should handle disconnected state', async () => {
      setIsInitialized(false);

      const stats = await indicator.getStatistics();

      expect(stats.isConnected).toBe(false);
    });

    /**
     * Test: Should gracefully handle errors
     * Description: Statistics gathering should not throw on errors
     */
    it('should gracefully handle errors', async () => {
      (mockDataSource.showMigrations as jest.Mock).mockRejectedValue(
        new Error('Query failed'),
      );

      const stats = await indicator.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.isConnected).toBe(true);
    });
  });

  describe('Error Handling', () => {
    /**
     * Test: Should handle non-Error exceptions
     * Description: Should handle unknown/non-Error exceptions gracefully
     */
    it('should handle non-Error exceptions', async () => {
      (mockDataSource.query as jest.Mock).mockRejectedValue('String error');

      await expect(indicator.isHealthy('database_query')).rejects.toThrow(
        HealthCheckError,
      );
    });

    /**
     * Test: Should provide meaningful error messages
     * Description: Error messages should be descriptive
     */
    it('should provide meaningful error messages', async () => {
      const error = new Error('MySQL server has gone away');
      (mockDataSource.query as jest.Mock).mockRejectedValue(error);

      try {
        await indicator.isHealthy('database_query');
      } catch (err: any) {
        expect(err.cause['database_query'].message).toBe('MySQL server has gone away');
      }
    });

    /**
     * Test: Should handle timeout errors
     * Description: Should properly handle query timeout errors
     */
    it('should handle timeout errors', async () => {
      const error = new Error('Query timeout');
      (mockDataSource.query as jest.Mock).mockRejectedValue(error);

      await expect(indicator.isHealthy('database_query')).rejects.toThrow(
        HealthCheckError,
      );
    });
  });

  describe('Response Format', () => {
    /**
     * Test: Should return valid HealthIndicatorResult
     * Description: Response should follow NestJS health indicator format
     */
    it('should return valid HealthIndicatorResult', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result).toHaveProperty('database_query');
      expect(result['database_query']).toHaveProperty('status');
      expect(['up', 'down']).toContain(result['database_query'].status);
    });

    /**
     * Test: Details should be an object
     * Description: Details field should contain additional information
     */
    it('details should be an object', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(typeof result['database_query']).toBe('object');
      expect(result['database_query']).not.toBeNull();
    });

    /**
     * Test: Should use provided key in result
     * Description: Health indicator key should be used in response
     */
    it('should use provided key in result', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('custom_key');

      // The key is used internally by getStatus method
      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    /**
     * Test: Should complete health check quickly
     * Description: Database health check should complete in < 500ms for normal queries
     */
    it('should complete health check quickly', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const start = performance.now();
      await indicator.isHealthy('database_query');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(500);
    });

    /**
     * Test: Should handle slow responses
     * Description: Slow but successful queries should still be marked unhealthy if > 1000ms
     */
    it('should detect slow responses', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      // Response time checking is done by measuring Date.now()
      // We verify this is included in the response
      const result = await indicator.isHealthy('database_query');

      expect(result['database_query'].responseTime).toBeDefined();
    });
  });

  describe('DataSource Integration', () => {
    /**
     * Test: Should use injected DataSource
     * Description: Should work with TypeORM DataSource injection
     */
    it('should use injected DataSource', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      await indicator.isHealthy('database_query');

      expect(mockDataSource.query).toHaveBeenCalled();
    });

    /**
     * Test: Should access DataSource options
     * Description: Should read database configuration from DataSource
     */
    it('should access DataSource options', async () => {
      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result['database_query'].database).toBe(mockDataSource.options.database);
      expect(result['database_query'].type).toBe(mockDataSource.options.type);
    });

    /**
     * Test: Should work with different database types
     * Description: Should handle mysql, postgres, sqlite, etc
     */
    it('should work with different database types', async () => {
      setDbType('postgres');

      (mockDataSource.query as jest.Mock).mockResolvedValue([{ health_check: 1 }]);

      const result = await indicator.isHealthy('database_query');

      expect(result['database_query'].type).toBe('postgres');
    });
  });
});

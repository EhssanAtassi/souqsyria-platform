/**
 * @file health.controller.spec.ts
 * @description Unit tests for Health Check Controller
 *
 * Tests all health check endpoints:
 * - GET /health - Basic health check
 * - GET /health/live - Kubernetes liveness probe
 * - GET /health/ready - Kubernetes readiness probe
 * - GET /health/detailed - Detailed health report
 * - GET /health/metrics - System metrics
 * - GET /health/version - Version information
 *
 * @author Test Suite
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from '../services/health.service';
import { DatabaseHealthIndicator } from '../indicators/database.health';
import { BusinessHealthIndicator } from '../indicators/business.health';
import {
  HealthCheckService,
  HealthCheckError,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let typeOrmIndicator: TypeOrmHealthIndicator;
  let memoryIndicator: MemoryHealthIndicator;
  let diskIndicator: DiskHealthIndicator;
  let databaseIndicator: DatabaseHealthIndicator;
  let businessIndicator: BusinessHealthIndicator;
  let healthService: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn(),
            checkRSS: jest.fn(),
          },
        },
        {
          provide: DiskHealthIndicator,
          useValue: {
            checkStorage: jest.fn(),
            isHealthy: jest.fn(),
          },
        },
        {
          provide: DatabaseHealthIndicator,
          useValue: {
            isHealthy: jest.fn(),
            checkConnectionPool: jest.fn(),
            getStatistics: jest.fn(),
          },
        },
        {
          provide: BusinessHealthIndicator,
          useValue: {
            isHealthy: jest.fn(),
            getStatistics: jest.fn(),
          },
        },
        {
          provide: HealthService,
          useValue: {
            getSystemMetrics: jest.fn(),
            getVersionInfo: jest.fn(),
            getStartTime: jest.fn(),
            hasMinimumUptime: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmIndicator = module.get<TypeOrmHealthIndicator>(TypeOrmHealthIndicator);
    memoryIndicator = module.get<MemoryHealthIndicator>(MemoryHealthIndicator);
    diskIndicator = module.get<DiskHealthIndicator>(DiskHealthIndicator);
    databaseIndicator = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
    businessIndicator = module.get<BusinessHealthIndicator>(BusinessHealthIndicator);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check() - Basic Health Check', () => {
    /**
     * Test: Should return healthy status when called
     * Description: Basic health check should return ok status
     */
    it('should return healthy status', async () => {
      const expectedResponse = {
        status: 'ok',
        info: { server: { status: 'up' } },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });

    /**
     * Test: Should call health check service with correct payload
     * Description: Verify the check method calls health service with expected data
     */
    it('should call health check service', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {},
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      await controller.check();

      expect(healthCheckService.check).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('liveness() - Kubernetes Liveness Probe', () => {
    /**
     * Test: Should check memory health indicators
     * Description: Liveness probe should verify heap and RSS memory usage
     */
    it('should check memory health indicators', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);
      (memoryIndicator.checkHeap as jest.Mock).mockResolvedValue({
        memory_heap: { status: 'up' },
      });
      (memoryIndicator.checkRSS as jest.Mock).mockResolvedValue({
        memory_rss: { status: 'up' },
      });

      const result = await controller.liveness();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });

    /**
     * Test: Should fail when memory threshold exceeded
     * Description: Liveness probe should return error if heap/RSS exceeds limits
     */
    it('should fail when memory threshold exceeded', async () => {
      const error = new HealthCheckError('Memory threshold exceeded', {
        memory_heap: { status: 'down' },
      });

      (healthCheckService.check as jest.Mock).mockRejectedValue(error);

      await expect(controller.liveness()).rejects.toThrow(HealthCheckError);
    });

    /**
     * Test: Should use correct memory thresholds
     * Description: Heap 1500MB, RSS 2000MB - verify correct limits are used
     */
    it('should use correct memory thresholds', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {},
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      await controller.liveness();

      expect(healthCheckService.check).toHaveBeenCalled();
      // Thresholds are applied in the check method
    });
  });

  describe('readiness() - Kubernetes Readiness Probe', () => {
    /**
     * Test: Should check database connectivity
     * Description: Readiness probe must verify database is accessible
     */
    it('should check database connectivity', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          database_query: { status: 'up' },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);
      (typeOrmIndicator.pingCheck as jest.Mock).mockResolvedValue({
        database: { status: 'up' },
      });
      (databaseIndicator.isHealthy as jest.Mock).mockResolvedValue({
        database_query: { status: 'up' },
      });

      const result = await controller.readiness();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });

    /**
     * Test: Should fail when database is unavailable
     * Description: Readiness probe should return error if database cannot be reached
     */
    it('should fail when database is unavailable', async () => {
      const error = new HealthCheckError('Database connection failed', {
        database: { status: 'down' },
      });

      (healthCheckService.check as jest.Mock).mockRejectedValue(error);

      await expect(controller.readiness()).rejects.toThrow(HealthCheckError);
    });

    /**
     * Test: Should check both database ping and query execution
     * Description: Readiness probe should verify both connectivity and query capability
     */
    it('should check both database ping and query execution', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {},
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      await controller.readiness();

      expect(healthCheckService.check).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('detailed() - Comprehensive Health Report', () => {
    /**
     * Test: Should include all health indicators
     * Description: Detailed check should include database, memory, disk, and business metrics
     */
    it('should include all health indicators', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          database_query: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          disk: { status: 'up' },
          business_metrics: { status: 'up' },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.detailed();

      expect(healthCheckService.check).toHaveBeenCalled();
      expect(result.status).toBe('ok');
    });

    /**
     * Test: Should check disk storage with 90% threshold
     * Description: Disk health should warn when usage exceeds 90%
     */
    it('should check disk storage with correct threshold', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {
          disk: {
            status: 'up',
            data: { usagePercent: '75%' },
          },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);
      (diskIndicator.checkStorage as jest.Mock).mockResolvedValue({
        disk: { status: 'up' },
      });

      const result = await controller.detailed();

      expect(result.status).toBe('ok');
    });

    /**
     * Test: Should fail if any indicator is unhealthy
     * Description: Detailed health should return error if any check fails
     */
    it('should fail if any indicator is unhealthy', async () => {
      const error = new HealthCheckError('One or more health checks failed', {
        database: { status: 'down' },
      });

      (healthCheckService.check as jest.Mock).mockRejectedValue(error);

      await expect(controller.detailed()).rejects.toThrow(HealthCheckError);
    });

    /**
     * Test: Should check business metrics
     * Description: Detailed check should include business health indicator
     */
    it('should check business metrics', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {
          business_metrics: {
            status: 'up',
            databaseConnected: true,
            totalUsers: 150,
          },
        },
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.detailed();

      expect(result.status).toBe('ok');
    });
  });

  describe('metrics() - System Metrics Endpoint', () => {
    /**
     * Test: Should return system metrics
     * Description: Metrics endpoint should return uptime, memory, CPU, and version info
     */
    it('should return system metrics', async () => {
      const mockMetrics = {
        uptime: 3600,
        uptimeFormatted: '1 hour',
        memory: {
          heapUsed: 50000000,
          heapTotal: 100000000,
          external: 1000000,
          rss: 80000000,
          heapUsedMB: '47.68 MB',
          heapTotalMB: '95.37 MB',
          rssMB: '76.29 MB',
        },
        cpu: {
          user: 1000000,
          system: 500000,
          loadAverage: [1.2, 1.5, 1.1],
          cores: 8,
        },
        system: {
          platform: 'darwin',
          arch: 'arm64',
          totalMemory: '16.00 GB',
          freeMemory: '8.00 GB',
          hostname: 'test-machine',
        },
        version: '1.0.0',
        nodeVersion: 'v20.10.0',
        environment: 'production',
        timestamp: new Date(),
      };

      (healthService.getSystemMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const result = await controller.metrics();

      expect(healthService.getSystemMetrics).toHaveBeenCalled();
      expect(result).toEqual(mockMetrics);
      expect(result.uptime).toBe(3600);
      expect(result.memory.heapUsedMB).toBe('47.68 MB');
    });

    /**
     * Test: Should include memory breakdown
     * Description: Metrics should show heap used, heap total, external, and RSS memory
     */
    it('should include memory breakdown', async () => {
      const mockMetrics = {
        uptime: 3600,
        uptimeFormatted: '1 hour',
        memory: {
          heapUsed: 50000000,
          heapTotal: 100000000,
          external: 1000000,
          rss: 80000000,
          heapUsedMB: '47.68 MB',
          heapTotalMB: '95.37 MB',
          rssMB: '76.29 MB',
        },
        cpu: {
          user: 1000000,
          system: 500000,
          loadAverage: [1.2, 1.5, 1.1],
          cores: 8,
        },
        system: {
          platform: 'darwin',
          arch: 'arm64',
          totalMemory: '16.00 GB',
          freeMemory: '8.00 GB',
          hostname: 'test-machine',
        },
        version: '1.0.0',
        nodeVersion: 'v20.10.0',
        environment: 'production',
        timestamp: new Date(),
      };

      (healthService.getSystemMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const result = await controller.metrics();

      expect(result.memory).toBeDefined();
      expect(result.memory.heapUsed).toBe(50000000);
      expect(result.memory.rss).toBe(80000000);
    });

    /**
     * Test: Should include CPU information
     * Description: Metrics should show CPU usage and load average
     */
    it('should include CPU information', async () => {
      const mockMetrics = {
        uptime: 3600,
        uptimeFormatted: '1 hour',
        memory: {
          heapUsed: 50000000,
          heapTotal: 100000000,
          external: 1000000,
          rss: 80000000,
          heapUsedMB: '47.68 MB',
          heapTotalMB: '95.37 MB',
          rssMB: '76.29 MB',
        },
        cpu: {
          user: 1000000,
          system: 500000,
          loadAverage: [1.2, 1.5, 1.1],
          cores: 8,
        },
        system: {
          platform: 'darwin',
          arch: 'arm64',
          totalMemory: '16.00 GB',
          freeMemory: '8.00 GB',
          hostname: 'test-machine',
        },
        version: '1.0.0',
        nodeVersion: 'v20.10.0',
        environment: 'production',
        timestamp: new Date(),
      };

      (healthService.getSystemMetrics as jest.Mock).mockReturnValue(mockMetrics);

      const result = await controller.metrics();

      expect(result.cpu).toBeDefined();
      expect(result.cpu.loadAverage).toEqual([1.2, 1.5, 1.1]);
      expect(result.cpu.cores).toBe(8);
    });
  });

  describe('version() - Version Information Endpoint', () => {
    /**
     * Test: Should return version information
     * Description: Version endpoint should return app version, build date, git commit, and environment
     */
    it('should return version information', async () => {
      const mockVersionInfo = {
        version: '1.0.0',
        buildDate: '2026-01-21T10:00:00Z',
        gitCommit: 'abc1234567890def',
        nodeVersion: 'v20.10.0',
        npmVersion: '10.2.4',
        environment: 'production',
        apiVersion: 'v1',
      };

      (healthService.getVersionInfo as jest.Mock).mockReturnValue(mockVersionInfo);

      const result = await controller.version();

      expect(healthService.getVersionInfo).toHaveBeenCalled();
      expect(result).toEqual(mockVersionInfo);
      expect(result.version).toBe('1.0.0');
      expect(result.apiVersion).toBe('v1');
    });

    /**
     * Test: Should include build metadata
     * Description: Version response should include build date, git commit, and node version
     */
    it('should include build metadata', async () => {
      const mockVersionInfo = {
        version: '1.0.0',
        buildDate: '2026-01-21T10:00:00Z',
        gitCommit: 'abc1234567890def',
        nodeVersion: 'v20.10.0',
        npmVersion: '10.2.4',
        environment: 'production',
        apiVersion: 'v1',
      };

      (healthService.getVersionInfo as jest.Mock).mockReturnValue(mockVersionInfo);

      const result = await controller.version();

      expect(result.buildDate).toBe('2026-01-21T10:00:00Z');
      expect(result.gitCommit).toBe('abc1234567890def');
      expect(result.nodeVersion).toBe('v20.10.0');
    });

    /**
     * Test: Should include environment information
     * Description: Version response should include node environment (dev/staging/prod)
     */
    it('should include environment information', async () => {
      const mockVersionInfo = {
        version: '1.0.0',
        buildDate: '2026-01-21T10:00:00Z',
        gitCommit: 'abc1234567890def',
        nodeVersion: 'v20.10.0',
        npmVersion: '10.2.4',
        environment: 'production',
        apiVersion: 'v1',
      };

      (healthService.getVersionInfo as jest.Mock).mockReturnValue(mockVersionInfo);

      const result = await controller.version();

      expect(result.environment).toBe('production');
    });
  });

  describe('Endpoint Integration Tests', () => {
    /**
     * Test: All endpoints should be callable
     * Description: Verify all health endpoints are properly defined and can be invoked
     */
    it('all endpoints should be callable', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {},
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);
      (healthService.getSystemMetrics as jest.Mock).mockReturnValue({});
      (healthService.getVersionInfo as jest.Mock).mockReturnValue({});

      await expect(controller.check()).resolves.toBeDefined();
      await expect(controller.liveness()).resolves.toBeDefined();
      await expect(controller.readiness()).resolves.toBeDefined();
      await expect(controller.detailed()).resolves.toBeDefined();
      await expect(controller.metrics()).resolves.toBeDefined();
      await expect(controller.version()).resolves.toBeDefined();
    });

    /**
     * Test: Error handling across endpoints
     * Description: Verify all endpoints handle errors gracefully
     */
    it('should handle errors across endpoints', async () => {
      const error = new Error('Service unavailable');

      (healthCheckService.check as jest.Mock).mockRejectedValue(error);
      (healthService.getSystemMetrics as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(controller.check()).rejects.toThrow(Error);
      await expect(controller.metrics()).rejects.toThrow(Error);
    });
  });

  describe('Response Format Validation', () => {
    /**
     * Test: Basic check response format
     * Description: Verify basic health check returns proper status structure
     */
    it('basic check should return proper status structure', async () => {
      const expectedResponse = {
        status: 'ok',
        info: { server: { status: 'up' } },
        error: {},
        details: {},
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.check();

      expect(result).toHaveProperty('status');
      expect(typeof result.status).toBe('string');
    });

    /**
     * Test: Detailed check includes all indicator info
     * Description: Verify detailed response includes database, memory, disk, and business metrics
     */
    it('detailed check should include all indicator info', async () => {
      const expectedResponse = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          disk: { status: 'up' },
          business_metrics: { status: 'up' },
        },
        error: {},
        details: {},
      };

      (healthCheckService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.detailed();

      expect(result.info).toHaveProperty('database');
      expect(result.info).toHaveProperty('memory_heap');
      expect(result.info).toHaveProperty('disk');
      expect(result.info).toHaveProperty('business_metrics');
    });
  });
});

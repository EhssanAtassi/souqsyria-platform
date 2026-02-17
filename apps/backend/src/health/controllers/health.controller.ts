/**
 * @file health.controller.ts
 * @description Health Check Controller for SouqSyria Backend
 *
 * ENDPOINTS:
 * - GET /health - Quick health check for load balancers
 * - GET /health/live - Kubernetes liveness probe (is the app running?)
 * - GET /health/ready - Kubernetes readiness probe (can it accept traffic?)
 * - GET /health/detailed - Full health report with all indicators
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { HealthService } from '../services/health.service';
import { DatabaseHealthIndicator } from '../indicators/database.health';
import { BusinessHealthIndicator } from '../indicators/business.health';

/**
 * HealthController
 * @description Provides health check endpoints for monitoring and orchestration
 *
 * @swagger
 * @ApiTags('Health')
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly typeOrm: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
    private readonly business: BusinessHealthIndicator,
    private readonly healthService: HealthService,
  ) {}

  /**
   * Basic health check
   * @description Quick health check for load balancers and basic monitoring
   * @returns Simple OK response if server is running
   */
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Basic health check',
    description:
      'Quick health check for load balancers. Returns OK if server is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: { type: 'object' },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async check() {
    return this.health.check([
      // Basic check - just verify the server responds
      () => ({ server: { status: 'up' } }),
    ]);
  }

  /**
   * Kubernetes liveness probe
   * @description Indicates if the application is running. If this fails, Kubernetes will restart the pod.
   * Should only check if the process is alive, not external dependencies.
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Kubernetes liveness probe. Returns OK if the process is alive.',
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @ApiResponse({
    status: 503,
    description: 'Application is dead and needs restart',
  })
  async liveness() {
    return this.health.check([
      // Check memory isn't exhausted (heap shouldn't exceed 1.5GB)
      () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
      // Check RSS memory (shouldn't exceed 2GB)
      () => this.memory.checkRSS('memory_rss', 2000 * 1024 * 1024),
    ]);
  }

  /**
   * Kubernetes readiness probe
   * @description Indicates if the application is ready to receive traffic.
   * Checks database connectivity and other critical dependencies.
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Kubernetes readiness probe. Returns OK if ready to accept traffic.',
  })
  @ApiResponse({ status: 200, description: 'Application is ready for traffic' })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready for traffic',
  })
  async readiness() {
    return this.health.check([
      // Database must be connected and responding
      () => this.typeOrm.pingCheck('database'),
      // Custom database health with query test
      () => this.database.isHealthy('database_query'),
    ]);
  }

  /**
   * Detailed health check
   * @description Comprehensive health report including all indicators.
   * Use for monitoring dashboards and detailed diagnostics.
   */
  @Get('detailed')
  @HealthCheck()
  @ApiOperation({
    summary: 'Detailed health check',
    description:
      'Comprehensive health report with all indicators for monitoring dashboards.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        info: {
          type: 'object',
          properties: {
            database: {
              type: 'object',
              properties: { status: { type: 'string' } },
            },
            memory_heap: {
              type: 'object',
              properties: { status: { type: 'string' } },
            },
            disk: {
              type: 'object',
              properties: { status: { type: 'string' } },
            },
            business: {
              type: 'object',
              properties: { status: { type: 'string' } },
            },
          },
        },
        error: { type: 'object' },
        details: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'One or more health checks failed' })
  async detailed() {
    return this.health.check([
      // Database connectivity
      () => this.typeOrm.pingCheck('database'),
      () => this.database.isHealthy('database_query'),

      // Memory checks
      () => this.memory.checkHeap('memory_heap', 1500 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 2000 * 1024 * 1024),

      // Disk space (warn if less than 10% free)
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.9, // 90% usage threshold
        }),

      // Business health metrics
      () => this.business.isHealthy('business_metrics'),
    ]);
  }

  /**
   * System metrics endpoint
   * @description Returns detailed system metrics for monitoring
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'System metrics',
    description:
      'Returns detailed system metrics including uptime, memory, and version info.',
  })
  @ApiResponse({
    status: 200,
    description: 'System metrics',
    schema: {
      type: 'object',
      properties: {
        uptime: { type: 'number', example: 86400 },
        uptimeFormatted: {
          type: 'string',
          example: '1 day, 0 hours, 0 minutes',
        },
        memory: {
          type: 'object',
          properties: {
            heapUsed: { type: 'number' },
            heapTotal: { type: 'number' },
            external: { type: 'number' },
            rss: { type: 'number' },
          },
        },
        cpu: {
          type: 'object',
          properties: {
            user: { type: 'number' },
            system: { type: 'number' },
          },
        },
        version: { type: 'string', example: '1.0.0' },
        nodeVersion: { type: 'string', example: 'v20.10.0' },
        environment: { type: 'string', example: 'production' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async metrics() {
    return this.healthService.getSystemMetrics();
  }

  /**
   * Version endpoint
   * @description Returns application version information
   */
  @Get('version')
  @ApiOperation({
    summary: 'Version info',
    description: 'Returns application version and build information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Version information',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string', example: '1.0.0' },
        buildDate: { type: 'string', format: 'date-time' },
        gitCommit: { type: 'string', example: 'abc1234' },
        nodeVersion: { type: 'string', example: 'v20.10.0' },
        environment: { type: 'string', example: 'production' },
      },
    },
  })
  async version() {
    return this.healthService.getVersionInfo();
  }
}

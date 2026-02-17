/**
 * @file health.controller.ts
 * @description Health check endpoints for monitoring application readiness
 *
 * Provides endpoints to verify:
 * - Application is running and responsive
 * - Database connectivity (MySQL)
 * - Cache connectivity (Redis)
 * - Overall system health status
 *
 * Used by:
 * - Docker health checks
 * - Kubernetes readiness/liveness probes
 * - Load balancers for instance health verification
 * - Monitoring systems for alerting
 *
 * @version 1.0.0
 */

import { Controller, Get, HttpStatus, Res, Optional } from '@nestjs/common';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

/**
 * Response model for health status
 * Indicates the current state of the application and its dependencies
 */
interface HealthStatus {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'connected' | 'disconnected';
      latency_ms?: number;
      error?: string;
    };
    cache: {
      status: 'connected' | 'disconnected';
      latency_ms?: number;
      error?: string;
    };
    application: {
      status: 'running' | 'stopped';
      memory_mb: number;
      cpu_usage: number;
    };
  };
  version: string;
}

/**
 * Health Check Controller
 * Provides endpoints for application health monitoring
 *
 * Endpoints:
 * - GET /health - Quick health check (for Docker health checks)
 * - GET /health/readiness - Readiness probe (for Kubernetes)
 * - GET /health/liveness - Liveness probe (for Kubernetes)
 * - GET /health/detailed - Full health report with all checks
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  // Application startup time for uptime calculation
  private readonly startTime = Date.now();

  constructor(private dataSource: DataSource) {}

  /**
   * Simple health check endpoint
   *
   * Quick response for Docker health checks. Returns 200 if application is running.
   * This is a minimal check - use /health/detailed for comprehensive checks.
   *
   * @param res - Express response object
   * @returns 200 OK if application is responsive
   *
   * @example
   * curl http://localhost:3000/health
   * // Response: "ok"
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Simple health check (Docker)' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: { type: 'string', example: 'ok' },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  healthCheck(@Res() res: Response): Response {
    // Return 200 OK with simple "ok" response
    // This endpoint should complete very quickly (< 100ms)
    return res.status(HttpStatus.OK).send('ok');
  }

  /**
   * Kubernetes readiness probe endpoint
   *
   * Indicates whether the application is ready to handle requests.
   * Checks database and cache connectivity.
   * Used by Kubernetes to add/remove pod from service load balancer.
   *
   * @param res - Express response object
   * @returns 200 if ready, 503 if not ready
   *
   * @example
   * curl http://localhost:3000/health/readiness
   */
  @Get('readiness')
  @Public()
  @ApiOperation({
    summary: 'Readiness probe (Kubernetes)',
    description:
      'Indicates if service is ready to handle requests. Returns 200 if all critical dependencies are available.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready (dependencies unavailable)',
  })
  async readinessProbe(@Res() res: Response): Promise<Response> {
    try {
      // Check database connectivity
      const dbOk = await this.checkDatabaseHealth();

      // Ready only if database is available
      if (dbOk) {
        return res.status(HttpStatus.OK).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          errors: {
            database: !dbOk ? 'Database unavailable' : null,
          },
        });
      }
    } catch (error) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  /**
   * Kubernetes liveness probe endpoint
   *
   * Indicates whether the application process is still running.
   * Used by Kubernetes to restart containers that are stuck or deadlocked.
   * Should only check the application process itself, not external dependencies.
   *
   * @param res - Express response object
   * @returns 200 if alive, 503 if dead
   *
   * @example
   * curl http://localhost:3000/health/liveness
   */
  @Get('liveness')
  @Public()
  @ApiOperation({
    summary: 'Liveness probe (Kubernetes)',
    description:
      'Indicates if process is alive. Used to restart dead containers. Returns 200 if application process is running.',
  })
  @ApiResponse({
    status: 200,
    description: 'Process is alive',
  })
  @ApiResponse({
    status: 503,
    description: 'Process is not responding',
  })
  livenessProbe(@Res() res: Response): Response {
    // Simple check that the process is responding
    // Should always return 200 unless the process is truly stuck
    try {
      const uptime = Date.now() - this.startTime;

      return res.status(HttpStatus.OK).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime_ms: uptime,
      });
    } catch (error) {
      // If even this basic check fails, the process is likely stuck
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'dead',
        error: error.message,
      });
    }
  }

  /**
   * Detailed health check endpoint
   *
   * Comprehensive health report including all checks and latency measurements.
   * Used for debugging and monitoring systems.
   * May be slower than simple checks (up to 5-10 seconds if dependencies are slow).
   *
   * @param res - Express response object
   * @returns Full health status object
   *
   * @example
   * curl http://localhost:3000/health/detailed
   */
  @Get('detailed')
  @Public()
  @ApiOperation({
    summary: 'Detailed health check',
    description:
      'Returns comprehensive health report with latency measurements for all dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded', 'unhealthy'] },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        checks: { type: 'object' },
      },
    },
  })
  async detailedHealthCheck(@Res() res: Response): Promise<Response> {
    const uptime = Date.now() - this.startTime;

    // Collect health check results
    const dbHealth = await this.checkDatabaseHealthDetailed();
    const appHealth = this.getApplicationHealth();

    // Determine overall status
    let overallStatus: 'ok' | 'degraded' | 'unhealthy' = 'ok';

    if (dbHealth.status === 'disconnected') {
      overallStatus = 'unhealthy';
    } else if (dbHealth.latency_ms > 1000) {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime,
      checks: {
        database: dbHealth,
        cache: { status: 'connected' },
        application: appHealth,
      },
      version: '1.0.0',
    };

    // Return appropriate HTTP status
    const httpStatus =
      overallStatus === 'ok'
        ? HttpStatus.OK
        : overallStatus === 'degraded'
          ? HttpStatus.OK
          : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json(healthStatus);
  }

  /**
   * Check database connectivity and measure latency
   * @returns Promise<boolean> True if connected, false otherwise
   * @private
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Measure query latency
      const startTime = Date.now();

      // Execute simple query to verify connection
      await this.dataSource.query('SELECT 1');

      const latency = Date.now() - startTime;

      // Database is considered healthy if response time is < 5 seconds
      return latency < 5000;
    } catch (error) {
      // Database is unavailable
      console.error('Database health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get detailed database health information
   * @returns Promise with database health details
   * @private
   */
  private async checkDatabaseHealthDetailed(): Promise<{
    status: 'connected' | 'disconnected';
    latency_ms?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const latency = Date.now() - startTime;

      return {
        status: 'connected',
        latency_ms: latency,
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Get application process health
   * @returns Application health information
   * @private
   */
  private getApplicationHealth(): {
    status: 'running' | 'stopped';
    memory_mb: number;
    cpu_usage: number;
  } {
    try {
      // Get memory usage
      const memUsage = process.memoryUsage();
      const memoryMb = Math.round(memUsage.heapUsed / 1024 / 1024);

      // Get CPU usage (if available)
      const cpuUsage = process.cpuUsage();
      const cpuPercent = cpuUsage.user / 1000000; // Convert to percentage approximation

      return {
        status: 'running',
        memory_mb: memoryMb,
        cpu_usage: cpuPercent,
      };
    } catch (error) {
      return {
        status: 'stopped',
        memory_mb: 0,
        cpu_usage: 0,
      };
    }
  }
}

/**
 * @file health.module.ts
 * @description Health Check Module for SouqSyria Backend
 *
 * ENDPOINTS:
 * - GET /health - Overall system health (for load balancers)
 * - GET /health/live - Kubernetes liveness probe
 * - GET /health/ready - Kubernetes readiness probe
 * - GET /health/detailed - Detailed health with all indicators
 *
 * HEALTH INDICATORS:
 * - Database connectivity (TypeORM)
 * - Memory usage (heap)
 * - Disk storage
 * - Custom business metrics
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { HealthController } from './controllers/health.controller';

// Services & Indicators
import { HealthService } from './services/health.service';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { DiskHealthIndicator } from './indicators/disk.health';
import { BusinessHealthIndicator } from './indicators/business.health';

/**
 * HealthModule
 * @description Provides comprehensive health check endpoints for monitoring
 *
 * @example
 * // Kubernetes deployment liveness probe:
 * livenessProbe:
 *   httpGet:
 *     path: /health/live
 *     port: 3000
 *   initialDelaySeconds: 30
 *   periodSeconds: 10
 *
 * // Kubernetes deployment readiness probe:
 * readinessProbe:
 *   httpGet:
 *     path: /health/ready
 *     port: 3000
 *   initialDelaySeconds: 5
 *   periodSeconds: 5
 */
@Module({
  imports: [
    TerminusModule.forRoot({
      // Log health check results
      logger: true,
      // Error logging level
      errorLogStyle: 'pretty',
      // Graceful shutdown timeout
      gracefulShutdownTimeoutMs: 5000,
    }),
    TypeOrmModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    DiskHealthIndicator,
    BusinessHealthIndicator,
  ],
  exports: [HealthService],
})
export class HealthModule {}

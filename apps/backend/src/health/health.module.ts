/**
 * @file health.module.ts
 * @description Health check module for application monitoring
 *
 * Provides health check endpoints used by:
 * - Docker health checks
 * - Kubernetes readiness/liveness probes
 * - Load balancers for instance verification
 * - Monitoring and alerting systems
 *
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health Module
 *
 * Provides health check endpoints with no dependencies on business logic.
 * These endpoints are public and require no authentication.
 *
 * Features:
 * - Simple health check for Docker (GET /health)
 * - Kubernetes readiness probe (GET /health/readiness)
 * - Kubernetes liveness probe (GET /health/liveness)
 * - Detailed health check (GET /health/detailed)
 */
@Module({
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}

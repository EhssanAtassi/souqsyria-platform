/**
 * @file index.ts
 * @description Barrel export for Health Module
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

// Module
export { HealthModule } from './health.module';

// Controller
export { HealthController } from './controllers/health.controller';

// Services
export { HealthService, SystemMetrics, VersionInfo } from './services/health.service';

// Health Indicators
export { DatabaseHealthIndicator } from './indicators/database.health';
export { CacheHealthIndicator } from './indicators/redis.health';
export { DiskHealthIndicator } from './indicators/disk.health';
export { BusinessHealthIndicator } from './indicators/business.health';

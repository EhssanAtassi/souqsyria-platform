/**
 * @file system-settings.module.ts
 * @description NestJS module for system-wide settings and feature flags management.
 *              Provides APIs for platform configuration and feature toggles.
 * @module SystemSettings
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { SystemSetting } from './entities/system-setting.entity';
import { FeatureFlag } from './entities/feature-flag.entity';

// Services
import { SettingsService } from './services/settings.service';
import { FeatureFlagsService } from './services/feature-flags.service';

// Controllers
import { SettingsController } from './controllers/settings.controller';
import { FeatureFlagsController } from './controllers/feature-flags.controller';

/**
 * System Settings Module
 *
 * @description Manages platform-wide configuration settings and feature toggles.
 *              Provides caching for performance and supports gradual feature rollouts.
 *
 * Features:
 * - System settings CRUD with categories
 * - Feature flags with rollout percentages
 * - Environment-specific flags
 * - User-level feature targeting
 * - In-memory caching with TTL
 * - Seed defaults for initialization
 *
 * @example
 * // Import in AppModule
 * @Module({
 *   imports: [SystemSettingsModule],
 * })
 * export class AppModule {}
 *
 * // Use SettingsService in other modules
 * const siteName = await settingsService.getValue('site_name');
 *
 * // Check feature flags
 * const isDarkModeEnabled = await featureFlagsService.isEnabled('enable_dark_mode', userId);
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SystemSetting,
      FeatureFlag,
    ]),
  ],
  controllers: [
    SettingsController,
    FeatureFlagsController,
  ],
  providers: [
    SettingsService,
    FeatureFlagsService,
  ],
  exports: [
    SettingsService,
    FeatureFlagsService,
  ],
})
export class SystemSettingsModule {}

/**
 * @file index.ts
 * @description Public API exports for the SystemSettings module.
 * @module SystemSettings
 */

// Module
export { SystemSettingsModule } from './system-settings.module';

// Entities
export { SystemSetting, SettingCategory, SettingType } from './entities/system-setting.entity';
export {
  FeatureFlag,
  FeatureFlagCategory,
  FeatureFlagEnvironment,
} from './entities/feature-flag.entity';

// Services
export { SettingsService } from './services/settings.service';
export { FeatureFlagsService } from './services/feature-flags.service';

// DTOs
export {
  CreateSettingDto,
  UpdateSettingDto,
  BulkUpdateSettingsDto,
  SettingsFilterDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  CheckFeatureFlagDto,
  FeatureFlagsFilterDto,
  SettingsResponseDto,
  FeatureFlagCheckResponseDto,
} from './dto/settings.dto';

/**
 * @file settings.dto.ts
 * @description Data Transfer Objects for system settings management.
 *              Includes validation rules and Swagger documentation.
 * @module SystemSettings/DTO
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  IsJSON,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SettingCategory, SettingType } from '../entities/system-setting.entity';
import { FeatureFlagCategory, FeatureFlagEnvironment } from '../entities/feature-flag.entity';

// =============================================================================
// SYSTEM SETTINGS DTOs
// =============================================================================

/**
 * DTO for creating a new system setting
 */
export class CreateSettingDto {
  @ApiProperty({
    description: 'Unique key for the setting',
    example: 'site_name',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  key: string;

  @ApiProperty({
    description: 'JSON-encoded value of the setting',
    example: '"SouqSyria"',
  })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({
    description: 'Human-readable label',
    example: 'Site Name',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;

  @ApiPropertyOptional({
    description: 'Setting description',
    example: 'The public name of the platform',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Setting category',
    enum: SettingCategory,
    example: SettingCategory.PLATFORM,
  })
  @IsEnum(SettingCategory)
  category: SettingCategory;

  @ApiProperty({
    description: 'Value data type',
    enum: SettingType,
    example: SettingType.STRING,
  })
  @IsEnum(SettingType)
  type: SettingType;

  @ApiPropertyOptional({
    description: 'JSON validation schema',
    example: '{"type": "string"}',
  })
  @IsString()
  @IsOptional()
  @IsJSON()
  validationSchema?: string;
}

/**
 * DTO for updating an existing system setting
 */
export class UpdateSettingDto extends PartialType(CreateSettingDto) {
  @ApiPropertyOptional({
    description: 'Whether the setting is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * DTO for bulk updating settings
 */
export class BulkUpdateSettingsDto {
  @ApiProperty({
    description: 'Array of settings to update',
    type: [UpdateSettingDto],
  })
  @IsArray()
  settings: { key: string; value: string }[];
}

/**
 * DTO for filtering settings
 */
export class SettingsFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: SettingCategory,
  })
  @IsEnum(SettingCategory)
  @IsOptional()
  category?: SettingCategory;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by key or label',
    example: 'site',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

// =============================================================================
// FEATURE FLAGS DTOs
// =============================================================================

/**
 * DTO for creating a new feature flag
 */
export class CreateFeatureFlagDto {
  @ApiProperty({
    description: 'Unique key for the feature',
    example: 'enable_dark_mode',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  key: string;

  @ApiProperty({
    description: 'Human-readable name',
    example: 'Dark Mode',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Feature description',
    example: 'Allow users to switch to dark theme',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    description: 'Initial enabled state',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Feature category',
    enum: FeatureFlagCategory,
    example: FeatureFlagCategory.USER_EXPERIENCE,
  })
  @IsEnum(FeatureFlagCategory)
  category: FeatureFlagCategory;

  @ApiPropertyOptional({
    description: 'Active environments',
    example: ['development'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  environments?: string[];

  @ApiPropertyOptional({
    description: 'Rollout percentage (0-100)',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;
}

/**
 * DTO for updating a feature flag
 */
export class UpdateFeatureFlagDto extends PartialType(CreateFeatureFlagDto) {
  @ApiPropertyOptional({
    description: 'JSON metadata',
    example: '{"variant": "A"}',
  })
  @IsString()
  @IsOptional()
  @IsJSON()
  metadata?: string;

  @ApiPropertyOptional({
    description: 'Allowlisted user IDs',
    example: ['user-1', 'user-2'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  allowlistUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Denylisted user IDs',
    example: ['user-3'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  denylistUserIds?: string[];

  @ApiPropertyOptional({
    description: 'Feature start date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Feature end date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  endDate?: Date;
}

/**
 * DTO for checking feature flag status
 */
export class CheckFeatureFlagDto {
  @ApiProperty({
    description: 'Feature key to check',
    example: 'enable_dark_mode',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({
    description: 'User ID to check against',
    example: 'user-123',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Environment to check',
    enum: FeatureFlagEnvironment,
    example: FeatureFlagEnvironment.PRODUCTION,
  })
  @IsEnum(FeatureFlagEnvironment)
  @IsOptional()
  environment?: FeatureFlagEnvironment;
}

/**
 * DTO for filtering feature flags
 */
export class FeatureFlagsFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: FeatureFlagCategory,
  })
  @IsEnum(FeatureFlagCategory)
  @IsOptional()
  category?: FeatureFlagCategory;

  @ApiPropertyOptional({
    description: 'Filter by enabled status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by environment',
    enum: FeatureFlagEnvironment,
  })
  @IsEnum(FeatureFlagEnvironment)
  @IsOptional()
  environment?: FeatureFlagEnvironment;

  @ApiPropertyOptional({
    description: 'Search by key or name',
    example: 'dark',
  })
  @IsString()
  @IsOptional()
  search?: string;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Response DTO for settings list
 */
export class SettingsResponseDto {
  @ApiProperty({ description: 'List of settings' })
  data: any[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

/**
 * Response DTO for feature flag check
 */
export class FeatureFlagCheckResponseDto {
  @ApiProperty({ description: 'Feature key', example: 'enable_dark_mode' })
  key: string;

  @ApiProperty({ description: 'Whether enabled for this context', example: true })
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

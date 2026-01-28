/**
 * @file system-setting.entity.ts
 * @description Entity for storing system-wide configuration settings.
 *              Supports various setting types with JSON value storage.
 * @module SystemSettings
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Setting categories for organization
 */
export enum SettingCategory {
  PLATFORM = 'platform',
  LOCALIZATION = 'localization',
  COMMISSION = 'commission',
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  NOTIFICATION = 'notification',
  SECURITY = 'security',
}

/**
 * Setting value types
 */
export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
}

/**
 * System Setting Entity
 *
 * @description Stores configurable platform settings with typed values.
 *              Settings are organized by category for easy management.
 *
 * @example
 * ```typescript
 * const setting = new SystemSetting();
 * setting.key = 'site_name';
 * setting.value = 'SouqSyria';
 * setting.category = SettingCategory.PLATFORM;
 * setting.type = SettingType.STRING;
 * ```
 */
@Entity('system_settings')
@Index(['key'], { unique: true })
@Index(['category'])
export class SystemSetting {
  @ApiProperty({
    description: 'Unique identifier for the setting',
    example: 'uuid-string',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Unique key identifier for the setting',
    example: 'site_name',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @ApiProperty({
    description: 'JSON-encoded value of the setting',
    example: '"SouqSyria"',
  })
  @Column({ type: 'text' })
  value: string;

  @ApiProperty({
    description: 'Human-readable label for the setting',
    example: 'Site Name',
  })
  @Column({ type: 'varchar', length: 255 })
  label: string;

  @ApiPropertyOptional({
    description: 'Description of what the setting controls',
    example: 'The display name of the platform',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Category the setting belongs to',
    enum: SettingCategory,
    example: SettingCategory.PLATFORM,
  })
  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.PLATFORM,
  })
  category: SettingCategory;

  @ApiProperty({
    description: 'Data type of the setting value',
    enum: SettingType,
    example: SettingType.STRING,
  })
  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.STRING,
  })
  type: SettingType;

  @ApiProperty({
    description: 'Whether the setting is active',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether this is a system-protected setting',
    example: false,
  })
  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @ApiPropertyOptional({
    description: 'JSON schema for validation (if applicable)',
    example: '{"type": "string", "minLength": 1}',
  })
  @Column({ type: 'text', nullable: true })
  validationSchema: string;

  @ApiProperty({
    description: 'Timestamp when the setting was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the setting was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Get the typed value of the setting
   * @returns Parsed value based on setting type
   */
  getTypedValue(): any {
    try {
      switch (this.type) {
        case SettingType.STRING:
          return JSON.parse(this.value);
        case SettingType.NUMBER:
          return Number(JSON.parse(this.value));
        case SettingType.BOOLEAN:
          return JSON.parse(this.value) === true;
        case SettingType.JSON:
        case SettingType.ARRAY:
          return JSON.parse(this.value);
        default:
          return this.value;
      }
    } catch {
      return this.value;
    }
  }

  /**
   * Set the value with proper JSON encoding
   * @param val - Value to set
   */
  setTypedValue(val: any): void {
    this.value = JSON.stringify(val);
  }
}

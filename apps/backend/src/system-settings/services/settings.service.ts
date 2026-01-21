/**
 * @file settings.service.ts
 * @description Service for managing system-wide configuration settings.
 *              Handles CRUD operations and caching for settings.
 * @module SystemSettings/Services
 */

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';

import { SystemSetting, SettingCategory, SettingType } from '../entities/system-setting.entity';
import {
  CreateSettingDto,
  UpdateSettingDto,
  BulkUpdateSettingsDto,
  SettingsFilterDto,
} from '../dto/settings.dto';

/**
 * Settings Service
 *
 * @description Manages system configuration settings with caching support.
 *              Provides methods for CRUD operations and bulk updates.
 *
 * @example
 * ```typescript
 * const siteName = await settingsService.getSetting('site_name');
 * await settingsService.updateSetting('site_name', { value: '"New Name"' });
 * ```
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  /** In-memory cache for frequently accessed settings */
  private settingsCache: Map<string, SystemSetting> = new Map();

  /** Cache TTL in milliseconds (5 minutes) */
  private readonly cacheTTL = 5 * 60 * 1000;

  /** Last cache refresh timestamp */
  private cacheRefreshedAt: number = 0;

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
  ) {}

  // ===========================================================================
  // READ OPERATIONS
  // ===========================================================================

  /**
   * Get all settings with optional filtering
   * @param filter - Filter criteria
   * @returns List of settings matching criteria
   */
  async findAll(filter?: SettingsFilterDto): Promise<SystemSetting[]> {
    const where: FindOptionsWhere<SystemSetting> = {};

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const settings = await this.settingRepository.find({
      where,
      order: { category: 'ASC', key: 'ASC' },
    });

    // Apply search filter if provided
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      return settings.filter(
        s =>
          s.key.toLowerCase().includes(searchLower) ||
          s.label.toLowerCase().includes(searchLower),
      );
    }

    return settings;
  }

  /**
   * Get settings grouped by category
   * @returns Settings organized by category
   */
  async findAllByCategory(): Promise<Record<SettingCategory, SystemSetting[]>> {
    const settings = await this.findAll({ isActive: true });
    const grouped: Record<string, SystemSetting[]> = {};

    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    }

    return grouped as Record<SettingCategory, SystemSetting[]>;
  }

  /**
   * Get a single setting by key
   * @param key - Setting key
   * @returns Setting entity or throws NotFoundException
   */
  async findByKey(key: string): Promise<SystemSetting> {
    // Check cache first
    if (this.isCacheValid() && this.settingsCache.has(key)) {
      return this.settingsCache.get(key)!;
    }

    const setting = await this.settingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    // Update cache
    this.settingsCache.set(key, setting);
    return setting;
  }

  /**
   * Get a setting's typed value by key
   * @param key - Setting key
   * @param defaultValue - Default value if not found
   * @returns Typed value of the setting
   */
  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const setting = await this.findByKey(key);
      return setting.getTypedValue() as T;
    } catch (error) {
      if (error instanceof NotFoundException && defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    }
  }

  /**
   * Get multiple settings by keys
   * @param keys - Array of setting keys
   * @returns Map of key to value
   */
  async getMultipleValues(keys: string[]): Promise<Record<string, any>> {
    const settings = await this.settingRepository.find({
      where: keys.map(key => ({ key })),
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.getTypedValue();
    }

    return result;
  }

  // ===========================================================================
  // WRITE OPERATIONS
  // ===========================================================================

  /**
   * Create a new setting
   * @param dto - Setting data
   * @returns Created setting
   */
  async create(dto: CreateSettingDto): Promise<SystemSetting> {
    // Check for duplicate key
    const existing = await this.settingRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Setting with key "${dto.key}" already exists`);
    }

    const setting = this.settingRepository.create({
      ...dto,
      isActive: true,
      isSystem: false,
    });

    const saved = await this.settingRepository.save(setting);
    this.invalidateCache(dto.key);

    this.logger.log(`Created setting: ${dto.key}`);
    return saved;
  }

  /**
   * Update an existing setting
   * @param key - Setting key
   * @param dto - Update data
   * @returns Updated setting
   */
  async update(key: string, dto: UpdateSettingDto): Promise<SystemSetting> {
    const setting = await this.findByKey(key);

    // Don't allow changing the key
    if (dto.key && dto.key !== key) {
      throw new ConflictException('Cannot change setting key');
    }

    // Don't allow modifying system settings' core properties
    if (setting.isSystem && (dto.type || dto.category)) {
      throw new ConflictException('Cannot modify system setting type or category');
    }

    Object.assign(setting, dto);
    const saved = await this.settingRepository.save(setting);
    this.invalidateCache(key);

    this.logger.log(`Updated setting: ${key}`);
    return saved;
  }

  /**
   * Bulk update multiple settings
   * @param dto - Bulk update data
   * @returns Number of updated settings
   */
  async bulkUpdate(dto: BulkUpdateSettingsDto): Promise<number> {
    let updated = 0;

    for (const item of dto.settings) {
      try {
        const setting = await this.settingRepository.findOne({
          where: { key: item.key },
        });

        if (setting) {
          setting.value = item.value;
          await this.settingRepository.save(setting);
          this.invalidateCache(item.key);
          updated++;
        }
      } catch (error) {
        this.logger.warn(`Failed to update setting ${item.key}: ${error.message}`);
      }
    }

    this.logger.log(`Bulk updated ${updated} settings`);
    return updated;
  }

  /**
   * Delete a setting
   * @param key - Setting key
   */
  async delete(key: string): Promise<void> {
    const setting = await this.findByKey(key);

    if (setting.isSystem) {
      throw new ConflictException('Cannot delete system setting');
    }

    await this.settingRepository.remove(setting);
    this.invalidateCache(key);

    this.logger.log(`Deleted setting: ${key}`);
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Invalidate cache for a specific key or all
   * @param key - Optional specific key to invalidate
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.settingsCache.delete(key);
    } else {
      this.settingsCache.clear();
      this.cacheRefreshedAt = 0;
    }
  }

  /**
   * Refresh the entire cache
   */
  async refreshCache(): Promise<void> {
    const settings = await this.settingRepository.find({
      where: { isActive: true },
    });

    this.settingsCache.clear();
    for (const setting of settings) {
      this.settingsCache.set(setting.key, setting);
    }
    this.cacheRefreshedAt = Date.now();

    this.logger.log(`Refreshed settings cache: ${settings.length} entries`);
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheRefreshedAt < this.cacheTTL;
  }

  // ===========================================================================
  // SEED DATA
  // ===========================================================================

  /**
   * Initialize default settings (for seeding)
   */
  async seedDefaults(): Promise<void> {
    const defaults: Partial<SystemSetting>[] = [
      // Platform Settings
      {
        key: 'site_name',
        value: '"SouqSyria"',
        label: 'Site Name',
        description: 'The public name of the platform',
        category: SettingCategory.PLATFORM,
        type: SettingType.STRING,
        isSystem: true,
      },
      {
        key: 'site_tagline',
        value: '"Your Trusted Marketplace"',
        label: 'Site Tagline',
        description: 'Short description shown in header',
        category: SettingCategory.PLATFORM,
        type: SettingType.STRING,
        isSystem: true,
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        label: 'Maintenance Mode',
        description: 'Enable to show maintenance page',
        category: SettingCategory.PLATFORM,
        type: SettingType.BOOLEAN,
        isSystem: true,
      },
      // Localization Settings
      {
        key: 'default_currency',
        value: '"SYP"',
        label: 'Default Currency',
        description: 'Primary currency for the platform',
        category: SettingCategory.LOCALIZATION,
        type: SettingType.STRING,
        isSystem: true,
      },
      {
        key: 'default_language',
        value: '"ar"',
        label: 'Default Language',
        description: 'Primary language for the platform',
        category: SettingCategory.LOCALIZATION,
        type: SettingType.STRING,
        isSystem: true,
      },
      // Commission Settings
      {
        key: 'default_commission_rate',
        value: '10',
        label: 'Default Commission Rate',
        description: 'Platform commission percentage for sales',
        category: SettingCategory.COMMISSION,
        type: SettingType.NUMBER,
        isSystem: true,
      },
    ];

    for (const setting of defaults) {
      const exists = await this.settingRepository.findOne({
        where: { key: setting.key },
      });

      if (!exists) {
        await this.settingRepository.save(
          this.settingRepository.create({ ...setting, isActive: true }),
        );
        this.logger.log(`Seeded setting: ${setting.key}`);
      }
    }
  }
}

/**
 * @file feature-flags.service.ts
 * @description Service for managing feature flags and toggles.
 *              Supports percentage-based rollouts and environment targeting.
 * @module SystemSettings/Services
 */

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import {
  FeatureFlag,
  FeatureFlagCategory,
  FeatureFlagEnvironment,
} from '../entities/feature-flag.entity';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagsFilterDto,
  CheckFeatureFlagDto,
} from '../dto/settings.dto';

/**
 * Feature Flags Service
 *
 * @description Manages feature toggles with support for gradual rollouts,
 *              user targeting, and environment-specific flags.
 *
 * @example
 * ```typescript
 * const isEnabled = await featureFlagsService.isEnabled('dark_mode', 'user-123');
 * await featureFlagsService.toggle('dark_mode', true);
 * ```
 */
@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  /** In-memory cache for feature flags */
  private flagsCache: Map<string, FeatureFlag> = new Map();

  /** Cache TTL in milliseconds (1 minute for flags) */
  private readonly cacheTTL = 60 * 1000;

  /** Last cache refresh timestamp */
  private cacheRefreshedAt: number = 0;

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly flagRepository: Repository<FeatureFlag>,
  ) {}

  // ===========================================================================
  // READ OPERATIONS
  // ===========================================================================

  /**
   * Get all feature flags with optional filtering
   * @param filter - Filter criteria
   * @returns List of feature flags
   */
  async findAll(filter?: FeatureFlagsFilterDto): Promise<FeatureFlag[]> {
    const where: FindOptionsWhere<FeatureFlag> = {};

    if (filter?.category) {
      where.category = filter.category;
    }

    if (filter?.enabled !== undefined) {
      where.enabled = filter.enabled;
    }

    let flags = await this.flagRepository.find({
      where,
      order: { category: 'ASC', name: 'ASC' },
    });

    // Apply environment filter (needs special handling due to array column)
    if (filter?.environment) {
      flags = flags.filter(f => f.environments.includes(filter.environment!));
    }

    // Apply search filter
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      flags = flags.filter(
        f =>
          f.key.toLowerCase().includes(searchLower) ||
          f.name.toLowerCase().includes(searchLower),
      );
    }

    return flags;
  }

  /**
   * Get flags grouped by category
   * @returns Flags organized by category
   */
  async findAllByCategory(): Promise<Record<FeatureFlagCategory, FeatureFlag[]>> {
    const flags = await this.findAll();
    const grouped: Record<string, FeatureFlag[]> = {};

    for (const flag of flags) {
      if (!grouped[flag.category]) {
        grouped[flag.category] = [];
      }
      grouped[flag.category].push(flag);
    }

    return grouped as Record<FeatureFlagCategory, FeatureFlag[]>;
  }

  /**
   * Get a single feature flag by key
   * @param key - Feature key
   * @returns Feature flag entity
   */
  async findByKey(key: string): Promise<FeatureFlag> {
    // Check cache first
    if (this.isCacheValid() && this.flagsCache.has(key)) {
      return this.flagsCache.get(key)!;
    }

    const flag = await this.flagRepository.findOne({
      where: { key },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with key "${key}" not found`);
    }

    // Update cache
    this.flagsCache.set(key, flag);
    return flag;
  }

  /**
   * Get a feature flag by ID
   * @param id - Feature flag ID
   * @returns Feature flag entity
   */
  async findById(id: string): Promise<FeatureFlag> {
    const flag = await this.flagRepository.findOne({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException(`Feature flag with ID "${id}" not found`);
    }

    return flag;
  }

  // ===========================================================================
  // FEATURE CHECK OPERATIONS
  // ===========================================================================

  /**
   * Check if a feature is enabled for a specific context
   * @param dto - Check parameters
   * @returns Whether the feature is enabled
   */
  async checkFeature(dto: CheckFeatureFlagDto): Promise<{
    key: string;
    enabled: boolean;
    metadata?: Record<string, any>;
  }> {
    try {
      const flag = await this.findByKey(dto.key);
      const environment = dto.environment || FeatureFlagEnvironment.PRODUCTION;

      let enabled: boolean;
      if (dto.userId) {
        enabled = flag.isEnabledForUser(dto.userId, environment);
      } else {
        enabled = flag.enabled && flag.environments.includes(environment);
      }

      return {
        key: flag.key,
        enabled,
        metadata: enabled ? flag.getMetadata() : undefined,
      };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        return { key: dto.key, enabled: false };
      }
      throw error;
    }
  }

  /**
   * Simple check if feature is enabled
   * @param key - Feature key
   * @param userId - Optional user ID
   * @param environment - Optional environment
   * @returns Whether enabled
   */
  async isEnabled(
    key: string,
    userId?: string,
    environment: FeatureFlagEnvironment = FeatureFlagEnvironment.PRODUCTION,
  ): Promise<boolean> {
    const result = await this.checkFeature({ key, userId, environment });
    return result.enabled;
  }

  /**
   * Check multiple features at once
   * @param keys - Array of feature keys
   * @param userId - Optional user ID
   * @param environment - Optional environment
   * @returns Map of key to enabled status
   */
  async checkMultiple(
    keys: string[],
    userId?: string,
    environment: FeatureFlagEnvironment = FeatureFlagEnvironment.PRODUCTION,
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const key of keys) {
      results[key] = await this.isEnabled(key, userId, environment);
    }

    return results;
  }

  // ===========================================================================
  // WRITE OPERATIONS
  // ===========================================================================

  /**
   * Create a new feature flag
   * @param dto - Feature flag data
   * @returns Created feature flag
   */
  async create(dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    // Check for duplicate key
    const existing = await this.flagRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      throw new ConflictException(`Feature flag with key "${dto.key}" already exists`);
    }

    const flag = this.flagRepository.create({
      ...dto,
      enabled: dto.enabled ?? false,
      environments: dto.environments ?? ['development'],
      rolloutPercentage: dto.rolloutPercentage ?? 100,
    });

    const saved = await this.flagRepository.save(flag);
    this.invalidateCache(dto.key);

    this.logger.log(`Created feature flag: ${dto.key}`);
    return saved;
  }

  /**
   * Update a feature flag
   * @param id - Feature flag ID
   * @param dto - Update data
   * @returns Updated feature flag
   */
  async update(id: string, dto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
    const flag = await this.findById(id);

    // Don't allow changing the key
    if (dto.key && dto.key !== flag.key) {
      throw new ConflictException('Cannot change feature flag key');
    }

    Object.assign(flag, dto);
    const saved = await this.flagRepository.save(flag);
    this.invalidateCache(flag.key);

    this.logger.log(`Updated feature flag: ${flag.key}`);
    return saved;
  }

  /**
   * Toggle a feature flag on/off
   * @param key - Feature key
   * @param enabled - New enabled state
   * @returns Updated feature flag
   */
  async toggle(key: string, enabled: boolean): Promise<FeatureFlag> {
    const flag = await this.findByKey(key);
    flag.enabled = enabled;

    const saved = await this.flagRepository.save(flag);
    this.invalidateCache(key);

    this.logger.log(`Toggled feature flag ${key}: ${enabled}`);
    return saved;
  }

  /**
   * Update rollout percentage
   * @param key - Feature key
   * @param percentage - New rollout percentage (0-100)
   * @returns Updated feature flag
   */
  async updateRollout(key: string, percentage: number): Promise<FeatureFlag> {
    if (percentage < 0 || percentage > 100) {
      throw new ConflictException('Rollout percentage must be between 0 and 100');
    }

    const flag = await this.findByKey(key);
    flag.rolloutPercentage = percentage;

    const saved = await this.flagRepository.save(flag);
    this.invalidateCache(key);

    this.logger.log(`Updated rollout for ${key}: ${percentage}%`);
    return saved;
  }

  /**
   * Delete a feature flag
   * @param id - Feature flag ID
   */
  async delete(id: string): Promise<void> {
    const flag = await this.findById(id);

    await this.flagRepository.remove(flag);
    this.invalidateCache(flag.key);

    this.logger.log(`Deleted feature flag: ${flag.key}`);
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
      this.flagsCache.delete(key);
    } else {
      this.flagsCache.clear();
      this.cacheRefreshedAt = 0;
    }
  }

  /**
   * Refresh the entire cache
   */
  async refreshCache(): Promise<void> {
    const flags = await this.flagRepository.find();

    this.flagsCache.clear();
    for (const flag of flags) {
      this.flagsCache.set(flag.key, flag);
    }
    this.cacheRefreshedAt = Date.now();

    this.logger.log(`Refreshed feature flags cache: ${flags.length} entries`);
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
   * Initialize default feature flags (for seeding)
   */
  async seedDefaults(): Promise<void> {
    const defaults: Partial<FeatureFlag>[] = [
      {
        key: 'enable_dark_mode',
        name: 'Dark Mode',
        description: 'Allow users to switch to dark theme',
        enabled: true,
        category: FeatureFlagCategory.USER_EXPERIENCE,
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
      },
      {
        key: 'enable_guest_checkout',
        name: 'Guest Checkout',
        description: 'Allow purchases without account registration',
        enabled: true,
        category: FeatureFlagCategory.COMMERCE,
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
      },
      {
        key: 'enable_social_login',
        name: 'Social Login',
        description: 'Sign in with Google, Facebook, or Apple',
        enabled: true,
        category: FeatureFlagCategory.USER_EXPERIENCE,
        environments: ['development', 'staging', 'production'],
        rolloutPercentage: 100,
      },
      {
        key: 'enable_two_factor_auth',
        name: 'Two-Factor Authentication',
        description: 'Require 2FA for admin accounts',
        enabled: true,
        category: FeatureFlagCategory.SECURITY,
        environments: ['production'],
        rolloutPercentage: 100,
      },
      {
        key: 'ai_product_recommendations',
        name: 'AI Product Recommendations',
        description: 'ML-powered personalized product suggestions',
        enabled: false,
        category: FeatureFlagCategory.EXPERIMENTAL,
        environments: ['development'],
        rolloutPercentage: 10,
      },
    ];

    for (const flag of defaults) {
      const exists = await this.flagRepository.findOne({
        where: { key: flag.key },
      });

      if (!exists) {
        await this.flagRepository.save(this.flagRepository.create(flag));
        this.logger.log(`Seeded feature flag: ${flag.key}`);
      }
    }
  }
}

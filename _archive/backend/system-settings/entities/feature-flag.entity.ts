/**
 * @file feature-flag.entity.ts
 * @description Entity for managing feature toggles across the platform.
 *              Supports environment-specific flags and gradual rollouts.
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
 * Feature flag categories
 */
export enum FeatureFlagCategory {
  COMMERCE = 'commerce',
  PAYMENT = 'payment',
  SHIPPING = 'shipping',
  USER_EXPERIENCE = 'user_experience',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  EXPERIMENTAL = 'experimental',
}

/**
 * Deployment environments
 */
export enum FeatureFlagEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

/**
 * Feature Flag Entity
 *
 * @description Controls feature availability across the platform.
 *              Supports percentage-based rollouts and environment targeting.
 *
 * @example
 * ```typescript
 * const flag = new FeatureFlag();
 * flag.key = 'enable_dark_mode';
 * flag.name = 'Dark Mode';
 * flag.enabled = true;
 * flag.category = FeatureFlagCategory.USER_EXPERIENCE;
 * flag.environments = ['development', 'staging', 'production'];
 * flag.rolloutPercentage = 100;
 * ```
 */
@Entity('feature_flags')
@Index(['key'], { unique: true })
@Index(['category'])
@Index(['enabled'])
export class FeatureFlag {
  @ApiProperty({
    description: 'Unique identifier for the feature flag',
    example: 'uuid-string',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Unique key identifier for the feature',
    example: 'enable_dark_mode',
  })
  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @ApiProperty({
    description: 'Human-readable name for the feature',
    example: 'Dark Mode',
  })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty({
    description: 'Description of what the feature does',
    example: 'Allow users to switch to dark theme',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'Whether the feature is currently enabled',
    example: true,
  })
  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @ApiProperty({
    description: 'Category the feature belongs to',
    enum: FeatureFlagCategory,
    example: FeatureFlagCategory.USER_EXPERIENCE,
  })
  @Column({
    type: 'enum',
    enum: FeatureFlagCategory,
    default: FeatureFlagCategory.EXPERIMENTAL,
  })
  category: FeatureFlagCategory;

  @ApiProperty({
    description: 'Environments where this flag is active',
    example: ['development', 'staging', 'production'],
    type: [String],
  })
  @Column({
    type: 'simple-array',
    default: 'development',
  })
  environments: string[];

  @ApiProperty({
    description: 'Percentage of users who will see this feature (0-100)',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @Column({ type: 'int', default: 100 })
  rolloutPercentage: number;

  @ApiPropertyOptional({
    description: 'JSON metadata for additional configuration',
    example: '{"variant": "A"}',
  })
  @Column({ type: 'text', nullable: true })
  metadata: string;

  @ApiPropertyOptional({
    description: 'User IDs that are always included (beta testers)',
    example: ['user-1', 'user-2'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  allowlistUserIds: string[];

  @ApiPropertyOptional({
    description: 'User IDs that are always excluded',
    example: ['user-3'],
    type: [String],
  })
  @Column({ type: 'simple-array', nullable: true })
  denylistUserIds: string[];

  @ApiPropertyOptional({
    description: 'Start date for time-based flags',
    example: '2024-01-01T00:00:00Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @ApiPropertyOptional({
    description: 'End date for time-based flags',
    example: '2024-12-31T23:59:59Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @ApiProperty({
    description: 'Timestamp when the flag was created',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the flag was last updated',
    example: '2024-01-20T14:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================

  /**
   * Check if the feature is enabled for a specific user in an environment
   * @param userId - User ID to check
   * @param environment - Current environment
   * @returns Whether the feature should be enabled for this user
   */
  isEnabledForUser(userId: string, environment: FeatureFlagEnvironment): boolean {
    // Check if flag is globally enabled
    if (!this.enabled) return false;

    // Check environment
    if (!this.environments.includes(environment)) return false;

    // Check time-based constraints
    const now = new Date();
    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;

    // Check denylist first (takes precedence)
    if (this.denylistUserIds?.includes(userId)) return false;

    // Check allowlist (always included)
    if (this.allowlistUserIds?.includes(userId)) return true;

    // Check rollout percentage
    if (this.rolloutPercentage >= 100) return true;
    if (this.rolloutPercentage <= 0) return false;

    // Use consistent hashing for rollout
    const hash = this.hashUserId(userId);
    return hash < this.rolloutPercentage;
  }

  /**
   * Generate consistent hash for user ID (0-100)
   * @param userId - User ID to hash
   * @returns Number between 0 and 99
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    const combined = `${this.key}:${userId}`;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  /**
   * Get parsed metadata
   * @returns Parsed metadata object
   */
  getMetadata(): Record<string, any> {
    if (!this.metadata) return {};
    try {
      return JSON.parse(this.metadata);
    } catch {
      return {};
    }
  }

  /**
   * Set metadata from object
   * @param data - Metadata object
   */
  setMetadata(data: Record<string, any>): void {
    this.metadata = JSON.stringify(data);
  }
}

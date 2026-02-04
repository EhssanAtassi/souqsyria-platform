/**
 * @file customer-lifecycle.entity.ts
 * @description Customer Lifecycle Tracking Entity for Business Intelligence
 *
 * PURPOSE:
 * - Tracks customer journey stages and transitions
 * - Enables customer lifetime value (CLV) calculations
 * - Supports churn prediction and retention analysis
 * - Provides foundation for personalized marketing campaigns
 *
 * BUSINESS VALUE:
 * - Customer segmentation for targeted marketing
 * - Churn prediction and prevention strategies
 * - CLV optimization and revenue forecasting
 * - Personalized customer experience delivery
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BusinessEvent, CustomerSegment } from './business-event.entity';

/**
 * Customer lifecycle stages for journey tracking
 */
export enum CustomerLifecycleStage {
  PROSPECT = 'prospect',           // Pre-registration interest
  NEW = 'new',                    // Recently registered
  ONBOARDING = 'onboarding',      // First 30 days
  ACTIVE = 'active',              // Regular purchaser
  ENGAGED = 'engaged',            // High interaction
  AT_RISK = 'at_risk',           // Declining activity
  CHURNING = 'churning',          // Low recent activity
  CHURNED = 'churned',            // No activity > 90 days
  WINBACK = 'winback',            // Re-engaged churned customer
  ADVOCATE = 'advocate',          // High referral activity
}

/**
 * Customer value tiers for business segmentation
 */
export enum CustomerValueTier {
  BRONZE = 'bronze',              // Low value (0-25th percentile)
  SILVER = 'silver',              // Medium value (25-75th percentile)
  GOLD = 'gold',                 // High value (75-95th percentile)
  PLATINUM = 'platinum',          // VIP value (95-100th percentile)
}

/**
 * Customer Lifecycle Entity
 * 
 * Comprehensive customer journey tracking with business intelligence
 * for segmentation, CLV calculation, and personalization.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Customer Lifecycle')
 */
@Entity('customer_lifecycles')
@Index(['userId'])
@Index(['currentStage'])
@Index(['currentSegment'])
@Index(['valueTier'])
@Index(['lastActivityDate'])
@Index(['churnProbability'])
export class CustomerLifecycle {
  @ApiProperty({
    description: 'Customer lifecycle record unique identifier',
    example: 'cl_550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User ID for the customer',
    example: 12345,
  })
  @Column({
    type: 'int',
    unique: true,
    nullable: false,
  })
  userId: number;

  @ApiProperty({
    description: 'Current lifecycle stage of the customer',
    enum: CustomerLifecycleStage,
    example: CustomerLifecycleStage.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: CustomerLifecycleStage,
    nullable: false,
  })
  currentStage: CustomerLifecycleStage;

  @ApiProperty({
    description: 'Previous lifecycle stage',
    enum: CustomerLifecycleStage,
    example: CustomerLifecycleStage.NEW,
    nullable: true,
  })
  @Column({
    type: 'enum',
    enum: CustomerLifecycleStage,
    nullable: true,
  })
  previousStage: CustomerLifecycleStage | null;

  @ApiProperty({
    description: 'Current customer segment',
    enum: CustomerSegment,
    example: CustomerSegment.ACTIVE,
  })
  @Column({
    type: 'enum',
    enum: CustomerSegment,
    nullable: false,
  })
  currentSegment: CustomerSegment;

  @ApiProperty({
    description: 'Customer value tier classification',
    enum: CustomerValueTier,
    example: CustomerValueTier.SILVER,
  })
  @Column({
    type: 'enum',
    enum: CustomerValueTier,
    default: CustomerValueTier.BRONZE,
  })
  valueTier: CustomerValueTier;

  @ApiProperty({
    description: 'Customer registration date',
    example: '2026-01-01T00:00:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: false,
  })
  registrationDate: Date;

  @ApiProperty({
    description: 'First purchase date',
    example: '2026-01-03T10:30:00.000Z',
    nullable: true,
  })
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  firstPurchaseDate: Date | null;

  @ApiProperty({
    description: 'Most recent activity date',
    example: '2026-01-20T15:45:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: false,
  })
  lastActivityDate: Date;

  @ApiProperty({
    description: 'Most recent purchase date',
    example: '2026-01-18T14:20:00.000Z',
    nullable: true,
  })
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastPurchaseDate: Date | null;

  @ApiProperty({
    description: 'Total number of orders placed',
    example: 5,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Total amount spent by customer',
    example: 450.75,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  totalSpent: number;

  @ApiProperty({
    description: 'Average order value',
    example: 90.15,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Customer lifetime value (CLV)',
    example: 1250.00,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  lifetimeValue: number;

  @ApiProperty({
    description: 'Predicted future CLV',
    example: 2100.00,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  predictedLifetimeValue: number;

  @ApiProperty({
    description: 'Churn probability score (0-1)',
    example: 0.25,
  })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    default: 0,
  })
  churnProbability: number;

  @ApiProperty({
    description: 'Customer engagement score (0-100)',
    example: 78,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  engagementScore: number;

  @ApiProperty({
    description: 'Days since customer registration',
    example: 45,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  daysSinceRegistration: number;

  @ApiProperty({
    description: 'Days since last activity',
    example: 2,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  daysSinceLastActivity: number;

  @ApiProperty({
    description: 'Days since last purchase',
    example: 4,
    nullable: true,
  })
  @Column({
    type: 'int',
    nullable: true,
  })
  daysSinceLastPurchase: number | null;

  @ApiProperty({
    description: 'Purchase frequency (orders per month)',
    example: 1.2,
  })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  purchaseFrequency: number;

  @ApiProperty({
    description: 'Referral count from this customer',
    example: 3,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  referralCount: number;

  @ApiProperty({
    description: 'Customer acquisition channel',
    example: 'organic_search',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  acquisitionChannel: string | null;

  @ApiProperty({
    description: 'Cohort identifier for analytics',
    example: '2026-01',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  cohortId: string | null;

  @ApiProperty({
    description: 'Additional customer metrics and preferences',
    example: {
      preferredCategories: ['electronics', 'books'],
      averageSessionDuration: 1200,
      devicePreference: 'mobile',
      communicationPreference: 'email',
    },
    nullable: true,
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  customerMetrics: Record<string, any> | null;

  @ApiProperty({
    description: 'When stage was last updated',
    example: '2026-01-20T15:45:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  stageUpdatedAt: Date;

  @ApiProperty({
    description: 'When CLV was last calculated',
    example: '2026-01-21T09:00:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  clvLastCalculatedAt: Date;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2026-01-22T10:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => BusinessEvent, event => event.userId)
  events: BusinessEvent[];
}
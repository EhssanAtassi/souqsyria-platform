/**
 * @file promotion-campaign.entity.ts
 * @description Advanced promotion campaign entity for enterprise marketing
 *
 * Supports sophisticated marketing campaigns including:
 * - Multi-coupon campaigns (Black Friday, Ramadan sales)
 * - A/B testing and performance tracking
 * - Syrian market seasonal campaigns
 * - Vendor co-marketing campaigns
 * - Budget management and ROI tracking
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { User } from '../../users/entities/user.entity';
import { CouponEntity } from './coupon.entity';

export enum CampaignType {
  SEASONAL = 'seasonal',
  FLASH_SALE = 'flash_sale',
  LOYALTY_PROGRAM = 'loyalty_program',
  NEW_USER_ACQUISITION = 'new_user_acquisition',
  VENDOR_PROMOTION = 'vendor_promotion',
  CATEGORY_BOOST = 'category_boost',
  RAMADAN_SPECIAL = 'ramadan_special',
  EID_CELEBRATION = 'eid_celebration',
  SYRIA_INDEPENDENCE_DAY = 'syria_independence_day',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('promotion_campaigns')
@Index(['status', 'start_date', 'end_date'])
@Index(['campaign_type', 'status'])
export class PromotionCampaign {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Primary key' })
  id: number;

  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ description: 'Campaign name in English' })
  name_en: string;

  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ description: 'Campaign name in Arabic' })
  name_ar: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Campaign description in English' })
  description_en: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Campaign description in Arabic' })
  description_ar: string;

  @Column({
    type: 'enum',
    enum: CampaignType,
    default: CampaignType.SEASONAL,
  })
  @ApiProperty({
    description: 'Type of promotion campaign',
    enum: CampaignType,
  })
  campaign_type: CampaignType;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  @ApiProperty({ description: 'Current campaign status', enum: CampaignStatus })
  status: CampaignStatus;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'Campaign start date and time' })
  start_date: Date;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'Campaign end date and time' })
  end_date: Date;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  @ApiProperty({ description: 'Total campaign budget in SYP' })
  budget_syp: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  @ApiProperty({ description: 'Amount spent so far in SYP' })
  spent_amount_syp: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Target number of redemptions' })
  target_redemptions: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Actual number of redemptions achieved' })
  actual_redemptions: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @ApiProperty({ description: 'Expected conversion rate percentage' })
  expected_conversion_rate: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  @ApiProperty({ description: 'Actual conversion rate achieved' })
  actual_conversion_rate: number;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'Syrian market targeting configuration' })
  syrian_targeting: {
    target_governorates?: string[];
    include_diaspora?: boolean;
    rural_areas_focus?: boolean;
    urban_areas_focus?: boolean;
    target_age_groups?: string[];
  };

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'A/B testing configuration' })
  ab_testing_config: {
    is_ab_test?: boolean;
    variant_a_percentage?: number;
    variant_b_percentage?: number;
    test_hypothesis?: string;
    success_metric?: string;
  };

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ description: 'Whether campaign is featured on homepage' })
  is_featured: boolean;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: 'Whether campaign is visible to customers' })
  is_public: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: 'Campaign banner image URL' })
  banner_image_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: 'Campaign promotional video URL' })
  promo_video_url: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  @ApiProperty({ description: 'Admin user who created this campaign' })
  created_by: User;

  @OneToMany(() => CouponEntity, (coupon) => coupon.promotion_campaign)
  @ApiProperty({ description: 'Coupons associated with this campaign' })
  coupons: CouponEntity[];

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'When campaign was launched' })
  launched_at: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'When campaign was completed' })
  completed_at: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Campaign performance summary' })
  performance_summary: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Admin notes about campaign' })
  admin_notes: string;
}

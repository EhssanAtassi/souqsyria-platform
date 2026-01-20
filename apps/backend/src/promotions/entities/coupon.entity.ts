/**
 * @file coupon.entity.ts
 * @description Comprehensive coupon entity for SouqSyria platform
 *
 * Supports advanced coupon functionality including:
 * - Multiple discount types (percentage, fixed amount, free shipping)
 * - Usage limits and restrictions
 * - Syrian market localization (SYP currency, Arabic support)
 * - Advanced targeting (user tiers, categories, vendors)
 * - Comprehensive audit trail and analytics
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
import { Category } from '../../categories/entities/category.entity';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { CouponUsage } from './coupon-usage.entity';
import { PromotionCampaign } from './promotion-campaign.entity';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
  BUY_ONE_GET_ONE = 'bogo',
  CATEGORY_DISCOUNT = 'category_discount',
}

export enum CouponStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  EXHAUSTED = 'exhausted',
  CANCELLED = 'cancelled',
}

export enum UserTier {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  VIP_SILVER = 'vip_silver',
  VIP_GOLD = 'vip_gold',
  VIP_DIAMOND = 'vip_diamond',
}

@Entity('coupons')
@Index(['code'], { unique: true })
@Index(['status', 'valid_from', 'valid_to'])
@Index(['coupon_type', 'status'])
export class CouponEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Primary key' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  @ApiProperty({
    description: 'Unique coupon code (e.g., SYRIA2025, WELCOME10)',
  })
  code: string;

  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ description: 'Coupon title in English' })
  title_en: string;

  @Column({ type: 'varchar', length: 200 })
  @ApiProperty({ description: 'Coupon title in Arabic' })
  title_ar: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Detailed description in English' })
  description_en: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Detailed description in Arabic' })
  description_ar: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.PERCENTAGE,
  })
  @ApiProperty({ description: 'Type of coupon discount', enum: CouponType })
  coupon_type: CouponType;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Discount value (percentage or SYP amount)' })
  discount_value: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  @ApiProperty({
    description: 'Maximum discount amount in SYP (for percentage coupons)',
  })
  max_discount_amount: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  @ApiProperty({ description: 'Minimum order amount in SYP to use coupon' })
  min_order_amount: number;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'Coupon becomes valid from this date' })
  valid_from: Date;

  @Column({ type: 'datetime' })
  @ApiProperty({ description: 'Coupon expires on this date' })
  valid_to: Date;

  @Column({ type: 'int', default: 1 })
  @ApiProperty({ description: 'Maximum number of uses (0 = unlimited)' })
  usage_limit: number;

  @Column({ type: 'int', default: 1 })
  @ApiProperty({ description: 'Maximum uses per user (0 = unlimited)' })
  usage_limit_per_user: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Current number of times used' })
  usage_count: number;

  @Column({
    type: 'enum',
    enum: CouponStatus,
    default: CouponStatus.DRAFT,
  })
  @ApiProperty({ description: 'Current coupon status', enum: CouponStatus })
  status: CouponStatus;

  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({ description: 'Allowed user tiers (empty = all tiers)' })
  allowed_user_tiers: UserTier[];

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Whether coupon can be combined with other offers',
  })
  is_stackable: boolean;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: 'Whether coupon is visible to customers' })
  is_public: boolean;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({ description: 'Whether this is a first-time user coupon' })
  is_first_time_user_only: boolean;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Additional metadata for Syrian market (governorates, etc.)',
  })
  syrian_market_config: {
    allowed_governorates?: string[];
    diaspora_customers_eligible?: boolean;
    ramadan_special?: boolean;
    eid_special?: boolean;
  };

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by' })
  @ApiProperty({ description: 'Admin user who created this coupon' })
  created_by: User;

  @ManyToOne(() => Category, { eager: false, nullable: true })
  @JoinColumn({ name: 'category_id' })
  @ApiProperty({
    description: 'Restrict coupon to specific category (optional)',
  })
  category: Category;

  @ManyToOne(() => VendorEntity, { eager: false, nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  @ApiProperty({ description: 'Restrict coupon to specific vendor (optional)' })
  vendor: VendorEntity;

  @OneToMany(() => CouponUsage, (couponUsage) => couponUsage.coupon)
  @ApiProperty({ description: 'Usage history of this coupon' })
  usage_history: CouponUsage[];

  @ManyToOne(() => PromotionCampaign, (campaign) => campaign.coupons, {
    nullable: true,
  })
  @JoinColumn({ name: 'promotion_campaign_id' })
  @ApiProperty({ description: 'Associated promotion campaign (optional)' })
  promotion_campaign: PromotionCampaign;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'When coupon was last activated' })
  activated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'When coupon was deactivated/expired' })
  deactivated_at: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Admin notes about this coupon' })
  admin_notes: string;
}

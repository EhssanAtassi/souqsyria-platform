/**
 * @file coupon-response.dto.ts
 * @description Response DTO for coupon data
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType, CouponStatus, UserTier } from '../entities/coupon.entity';

export class CouponResponseDto {
  @ApiProperty({ description: 'Coupon ID' })
  id: number;

  @ApiProperty({ description: 'Unique coupon code' })
  code: string;

  @ApiProperty({ description: 'Coupon title in English' })
  title_en: string;

  @ApiProperty({ description: 'Coupon title in Arabic' })
  title_ar: string;

  @ApiPropertyOptional({ description: 'Description in English' })
  description_en?: string;

  @ApiPropertyOptional({ description: 'Description in Arabic' })
  description_ar?: string;

  @ApiProperty({ enum: CouponType, description: 'Coupon type' })
  coupon_type: CouponType;

  @ApiProperty({ description: 'Discount value' })
  discount_value: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount in SYP' })
  max_discount_amount?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount in SYP' })
  min_order_amount?: number;

  @ApiProperty({ description: 'Valid from date' })
  valid_from: Date;

  @ApiProperty({ description: 'Valid to date' })
  valid_to: Date;

  @ApiProperty({ description: 'Usage limit' })
  usage_limit: number;

  @ApiProperty({ description: 'Usage limit per user' })
  usage_limit_per_user: number;

  @ApiProperty({ description: 'Current usage count' })
  usage_count: number;

  @ApiProperty({ enum: CouponStatus, description: 'Coupon status' })
  status: CouponStatus;

  @ApiPropertyOptional({
    enum: UserTier,
    isArray: true,
    description: 'Allowed user tiers',
  })
  allowed_user_tiers?: UserTier[];

  @ApiProperty({ description: 'Is stackable' })
  is_stackable: boolean;

  @ApiProperty({ description: 'Is public' })
  is_public: boolean;

  @ApiProperty({ description: 'Is first time user only' })
  is_first_time_user_only: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;
}

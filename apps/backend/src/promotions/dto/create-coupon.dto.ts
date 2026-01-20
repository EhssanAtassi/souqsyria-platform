/**
 * @file create-coupon.dto.ts
 * @description Data Transfer Object for creating new coupons
 *
 * Comprehensive validation for coupon creation including:
 * - Multi-language support (Arabic/English)
 * - Syrian market specific validations
 * - Advanced targeting and restrictions
 * - Comprehensive business logic validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  Length,
  IsPositive,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CouponType, UserTier } from '../entities/coupon.entity';

class SyrianMarketConfigDto {
  @ApiPropertyOptional({
    description: 'Allowed Syrian governorates',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_governorates?: string[];

  @ApiPropertyOptional({
    description: 'Whether diaspora customers can use this coupon',
  })
  @IsOptional()
  @IsBoolean()
  diaspora_customers_eligible?: boolean;

  @ApiPropertyOptional({ description: 'Special Ramadan promotion' })
  @IsOptional()
  @IsBoolean()
  ramadan_special?: boolean;

  @ApiPropertyOptional({ description: 'Special Eid promotion' })
  @IsOptional()
  @IsBoolean()
  eid_special?: boolean;
}

export class CreateCouponDto {
  @ApiProperty({
    description: 'Unique coupon code (3-50 characters, alphanumeric)',
    example: 'SYRIA2025',
    minLength: 3,
    maxLength: 50,
  })
  @IsNotEmpty()
  @IsString()
  @Length(3, 50)
  code: string;

  @ApiProperty({
    description: 'Coupon title in English',
    example: 'Welcome to SouqSyria',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 200)
  title_en: string;

  @ApiProperty({
    description: 'Coupon title in Arabic',
    example: 'أهلاً بك في سوق سوريا',
    maxLength: 200,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 200)
  title_ar: string;

  @ApiPropertyOptional({
    description: 'Detailed description in English',
    example: 'Get 10% off your first order on SouqSyria',
  })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiPropertyOptional({
    description: 'Detailed description in Arabic',
    example: 'احصل على خصم 10% على طلبك الأول في سوق سوريا',
  })
  @IsOptional()
  @IsString()
  description_ar?: string;

  @ApiProperty({
    description: 'Type of coupon discount',
    enum: CouponType,
    example: CouponType.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsEnum(CouponType)
  coupon_type: CouponType;

  @ApiProperty({
    description: 'Discount value (percentage: 0-100, fixed amount: in SYP)',
    example: 10,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Min(0)
  discount_value: number;

  @ApiPropertyOptional({
    description: 'Maximum discount amount in SYP (for percentage coupons)',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_discount_amount?: number;

  @ApiPropertyOptional({
    description: 'Minimum order amount in SYP to use coupon',
    example: 25000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_amount?: number;

  @ApiProperty({
    description: 'Coupon becomes valid from this date (ISO 8601)',
    example: '2025-08-16T00:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  valid_from: string;

  @ApiProperty({
    description: 'Coupon expires on this date (ISO 8601)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsNotEmpty()
  @IsDateString()
  valid_to: string;

  @ApiPropertyOptional({
    description: 'Maximum number of uses (0 = unlimited)',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usage_limit?: number;

  @ApiPropertyOptional({
    description: 'Maximum uses per user (0 = unlimited)',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usage_limit_per_user?: number;

  @ApiPropertyOptional({
    description: 'Allowed user tiers (empty array = all tiers)',
    enum: UserTier,
    isArray: true,
    example: [UserTier.PREMIUM, UserTier.VIP_GOLD],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserTier, { each: true })
  allowed_user_tiers?: UserTier[];

  @ApiPropertyOptional({
    description: 'Whether coupon can be combined with other offers',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_stackable?: boolean;

  @ApiPropertyOptional({
    description: 'Whether coupon is visible to customers',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a first-time user coupon',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_first_time_user_only?: boolean;

  @ApiPropertyOptional({
    description: 'Restrict coupon to specific category ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  category_id?: number;

  @ApiPropertyOptional({
    description: 'Restrict coupon to specific vendor ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  vendor_id?: number;

  @ApiPropertyOptional({
    description: 'Associate coupon with promotion campaign ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  promotion_campaign_id?: number;

  @ApiPropertyOptional({
    description: 'Syrian market specific configuration',
    type: SyrianMarketConfigDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SyrianMarketConfigDto)
  syrian_market_config?: SyrianMarketConfigDto;

  @ApiPropertyOptional({
    description: 'Admin notes about this coupon',
    example: 'Created for Black Friday campaign',
  })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}

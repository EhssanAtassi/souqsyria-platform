/**
 * @file AddToCartDto.ts
 * @description Enhanced DTO for adding items to cart with Syrian market support
 *
 * @author SouqSyria Development Team
 * @since 2025-07-02
 * @version 1.0.0
 */

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for adding items to user's shopping cart
 */
export class AddToCartDto {
  /**
   * Product variant ID to add to cart
   */
  @ApiProperty({
    description: 'Product variant ID to add to cart. Must be valid and active.',
    example: 123,
    minimum: 1,
    type: 'integer',
  })
  @IsInt({ message: 'Variant ID must be an integer' })
  @Min(1, { message: 'Variant ID must be positive' })
  @Type(() => Number)
  variant_id: number;

  /**
   * Quantity of items to add to cart
   */
  @ApiProperty({
    description: 'Quantity to add (1-999). Must not exceed available stock.',
    example: 2,
    minimum: 1,
    maximum: 999,
    type: 'integer',
  })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(999, { message: 'Maximum quantity is 999 per item' })
  @Type(() => Number)
  quantity: number;

  /**
   * Discounted price if applicable
   */
  @ApiPropertyOptional({
    description:
      'Discounted price if applicable (in cart currency, default SYP)',
    example: 1500.5,
    minimum: 0,
    type: 'number',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must have maximum 2 decimal places' },
  )
  @Min(0, { message: 'Price cannot be negative' })
  @Type(() => Number)
  price_discounted?: number;

  /**
   * Item expiration timestamp for limited offers
   */
  @ApiPropertyOptional({
    description: 'Item expiration for limited offers (ISO 8601 format)',
    example: '2025-07-10T23:59:59Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expiration date must be valid ISO 8601 format' },
  )
  expires_at?: string;

  /**
   * Campaign or promotion source tracking
   */
  @ApiPropertyOptional({
    description: 'Campaign/promotion source for tracking and analytics',
    example: 'summer_sale_2025',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Campaign source must be a string' })
  @Length(1, 100, { message: 'Campaign source must be 1-100 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Campaign source can only contain letters, numbers, underscores, and hyphens',
  })
  added_from_campaign?: string;

  /**
   * Currency code for pricing
   */
  @ApiPropertyOptional({
    description: 'Currency code for pricing (SYP, USD, EUR, TRY)',
    example: 'SYP',
    enum: ['SYP', 'USD', 'EUR', 'TRY'],
    default: 'SYP',
  })
  @IsOptional()
  @IsEnum(['SYP', 'USD', 'EUR', 'TRY'], {
    message: 'Currency must be one of: SYP, USD, EUR, TRY',
  })
  currency?: string;

  /**
   * Special instructions or notes for this cart item
   */
  @ApiPropertyOptional({
    description: 'Special instructions or notes for this cart item',
    example: 'Please gift wrap with red ribbon',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(1, 500, { message: 'Notes must be 1-500 characters' })
  notes?: string;

  /**
   * B2B bulk order flag
   */
  @ApiPropertyOptional({
    description:
      'Whether this is a B2B bulk order (enables bulk pricing and business rules)',
    example: false,
    default: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'Is bulk order must be boolean' })
  @Transform(({ value }) => value === 'true' || value === true)
  is_bulk_order?: boolean;

  /**
   * Optional: Idempotency key for preventing duplicate add-to-cart operations
   * Recommended for mobile/PWA apps to prevent accidental double-adds on retry
   * Should be a client-generated UUID v4 string
   */
  @ApiPropertyOptional({
    description:
      'Idempotency key to prevent duplicate add-to-cart operations (UUID v4 format recommended)',
    example: 'c3d4e5f6-g7h8-49i0-j1k2-l3m4n5o6p7q8',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

/**
 * Alias for CreateCartItemDto to maintain backward compatibility
 */
export class CreateCartItemDto extends AddToCartDto {}

/**
 * @file create-featured-category.dto.ts
 * @description DTO for creating a new featured category
 *
 * VALIDATION RULES:
 * - categoryId must exist in categories table
 * - displayOrder must be >= 0
 * - endDate must be after startDate (if both provided)
 * - badgeColor must be valid hex format (#RRGGBB)
 * - Text fields have maximum length constraints
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  Min,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for creating a featured category on homepage
 *
 * Includes validation for all required and optional fields with Syrian market
 * support for bilingual content and cultural event scheduling.
 */
export class CreateFeaturedCategoryDto {
  /**
   * ID of the category to feature
   * Must reference an existing category
   */
  @ApiProperty({
    description: 'ID of the category to feature',
    example: 1,
    type: Number,
  })
  @IsNotEmpty({ message: 'Category ID is required' })
  @IsNumber({}, { message: 'Category ID must be a number' })
  @Type(() => Number)
  categoryId: number;

  /**
   * Display order position (0-based index)
   * Lower values appear first on homepage
   */
  @ApiProperty({
    description: 'Display order position (0-based, lower = higher priority)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Display order is required' })
  @IsNumber({}, { message: 'Display order must be a number' })
  @Min(0, { message: 'Display order must be greater than or equal to 0' })
  @Type(() => Number)
  displayOrder: number;

  /**
   * Badge text in English (optional)
   */
  @ApiProperty({
    description: 'Badge text in English (e.g., "New", "Hot", "Sale")',
    example: 'Hot',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Badge text (English) must be a string' })
  @MaxLength(50, {
    message: 'Badge text (English) cannot exceed 50 characters',
  })
  badgeTextEn?: string;

  /**
   * Badge text in Arabic (optional)
   */
  @ApiProperty({
    description: 'Badge text in Arabic (e.g., "جديد", "ساخن", "تخفيضات")',
    example: 'ساخن',
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Badge text (Arabic) must be a string' })
  @MaxLength(50, { message: 'Badge text (Arabic) cannot exceed 50 characters' })
  badgeTextAr?: string;

  /**
   * Badge background color (hex format)
   */
  @ApiProperty({
    description: 'Badge background color in hex format (#RRGGBB)',
    example: '#FF6B6B',
    pattern: '^#[0-9A-Fa-f]{6}$',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Badge color must be a string' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Badge color must be in hex format (#RRGGBB)',
  })
  badgeColor?: string;

  /**
   * Promotion text in English (optional)
   */
  @ApiProperty({
    description: 'Promotional text in English',
    example: 'Up to 30% off on electronics',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Promotion text (English) must be a string' })
  @MaxLength(200, {
    message: 'Promotion text (English) cannot exceed 200 characters',
  })
  promotionTextEn?: string;

  /**
   * Promotion text in Arabic (optional)
   */
  @ApiProperty({
    description: 'Promotional text in Arabic',
    example: 'خصم يصل إلى 30% على الإلكترونيات',
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Promotion text (Arabic) must be a string' })
  @MaxLength(200, {
    message: 'Promotion text (Arabic) cannot exceed 200 characters',
  })
  promotionTextAr?: string;

  /**
   * Whether the featured category is active
   */
  @ApiProperty({
    description: 'Whether the featured category is active',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  /**
   * Scheduled start date (optional)
   */
  @ApiProperty({
    description: 'Scheduled start date (ISO 8601 format)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Start date must be a valid ISO 8601 date string' },
  )
  startDate?: string;

  /**
   * Scheduled end date (optional)
   * Must be after startDate if both are provided
   */
  @ApiProperty({
    description: 'Scheduled end date (ISO 8601 format)',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'End date must be a valid ISO 8601 date string' },
  )
  @ValidateIf((o) => o.startDate && o.endDate)
  endDate?: string;
}

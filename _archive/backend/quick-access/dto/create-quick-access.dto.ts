/**
 * @file create-quick-access.dto.ts
 * @description DTO for creating promotional cards in Quick Access
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsIn,
  MaxLength,
} from 'class-validator';

/**
 * CreateQuickAccessDto
 *
 * @description Data Transfer Object for creating a new promotional card.
 * Used by admin endpoints to add new promotional content.
 *
 * @swagger
 * components:
 *   schemas:
 *     CreateQuickAccessDto:
 *       type: object
 *       required:
 *         - categoryEn
 *         - categoryAr
 *         - titleEn
 *         - titleAr
 *         - badgeClass
 *         - image
 *         - url
 */
export class CreateQuickAccessDto {
  /**
   * Category label in English
   * @example "Premium Deals"
   */
  @ApiProperty({
    description: 'Category label in English',
    example: 'Premium Deals',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryEn: string;

  /**
   * Category label in Arabic
   * @example "عروض مميزة"
   */
  @ApiProperty({
    description: 'Category label in Arabic',
    example: 'عروض مميزة',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryAr: string;

  /**
   * Main promotional title in English
   * @example "Damascene Delights"
   */
  @ApiProperty({
    description: 'Main promotional title in English',
    example: 'Damascene Delights',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titleEn: string;

  /**
   * Main promotional title in Arabic
   * @example "المأكولات الدمشقية"
   */
  @ApiProperty({
    description: 'Main promotional title in Arabic',
    example: 'المأكولات الدمشقية',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  titleAr: string;

  /**
   * Secondary subtitle in English (optional)
   * @example "Save 30% on traditional sweets"
   */
  @ApiProperty({
    description: 'Secondary subtitle in English',
    example: 'Save 30% on traditional sweets',
    maxLength: 300,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  subtitleEn?: string;

  /**
   * Secondary subtitle in Arabic (optional)
   * @example "وفر 30% على الحلويات التقليدية"
   */
  @ApiProperty({
    description: 'Secondary subtitle in Arabic',
    example: 'وفر 30% على الحلويات التقليدية',
    maxLength: 300,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  subtitleAr?: string;

  /**
   * CSS class for badge gradient styling
   * @example "badge-gold"
   */
  @ApiProperty({
    description: 'CSS class for badge gradient styling',
    example: 'badge-gold',
    enum: ['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-orange', 'badge-red', 'badge-teal', 'badge-pink'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-orange', 'badge-red', 'badge-teal', 'badge-pink'])
  badgeClass: string;

  /**
   * URL to promotional image
   * @example "https://cdn.souqsyria.com/promos/damascene-sweets.jpg"
   */
  @ApiProperty({
    description: 'URL to promotional image',
    example: 'https://cdn.souqsyria.com/promos/damascene-sweets.jpg',
    maxLength: 500,
  })
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(500)
  image: string;

  /**
   * Destination URL when card is clicked
   * @example "/category/damascene-sweets"
   */
  @ApiProperty({
    description: 'Destination URL when card is clicked',
    example: '/category/damascene-sweets',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  url: string;

  /**
   * Display order (lower numbers appear first)
   * @example 1
   */
  @ApiProperty({
    description: 'Display order (lower numbers appear first)',
    example: 1,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  /**
   * Whether the promotional card is active and visible
   * @example true
   */
  @ApiProperty({
    description: 'Whether the promotional card is active and visible',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
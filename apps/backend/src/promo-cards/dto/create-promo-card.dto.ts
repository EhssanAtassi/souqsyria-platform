/**
 * @file create-promo-card.dto.ts
 * @description Data Transfer Object for creating promotional cards
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsIn,
} from 'class-validator';

/**
 * DTO for creating a new promotional card
 *
 * Validates all required fields for promo card creation including:
 * - Bilingual content (English and Arabic)
 * - Image and link URLs
 * - Position constraint (1 or 2)
 * - Optional badge configuration
 * - Optional scheduling dates
 */
export class CreatePromoCardDto {
  // ================================
  // MULTILINGUAL CONTENT
  // ================================

  @ApiProperty({
    description: 'Card title in English',
    example: 'Summer Sale Collection',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titleEn: string;

  @ApiProperty({
    description: 'Card title in Arabic',
    example: 'مجموعة تخفيضات الصيف',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titleAr: string;

  @ApiProperty({
    description: 'Card description in English',
    example: 'Get up to 50% off on all summer products',
    required: false,
  })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({
    description: 'Card description in Arabic',
    example: 'احصل على خصم يصل إلى 50٪ على جميع منتجات الصيف',
    required: false,
  })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  // ================================
  // VISUAL ASSETS
  // ================================

  @ApiProperty({
    description: 'Card image URL (CDN link)',
    example: 'https://cdn.souqsyria.com/promo/summer-sale.jpg',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'Target URL when card is clicked',
    example: '/category/summer-collection',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  linkUrl?: string;

  // ================================
  // POSITIONING
  // ================================

  @ApiProperty({
    description: 'Card position: 1 = left 70%, 2 = right 30% (stacked)',
    enum: [1, 2],
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(2)
  @IsIn([1, 2])
  position: 1 | 2;

  // ================================
  // BADGE SYSTEM
  // ================================

  @ApiProperty({
    description: 'Badge text in English (NEW, SALE, HOT, etc.)',
    example: 'NEW',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  badgeTextEn?: string;

  @ApiProperty({
    description: 'Badge text in Arabic',
    example: 'جديد',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  badgeTextAr?: string;

  @ApiProperty({
    description: 'Badge CSS class - must be one of the predefined badge styles',
    example: 'badge-new',
    maxLength: 50,
    required: false,
    enum: [
      'badge-new',
      'badge-sale',
      'badge-hot',
      'badge-limited',
      'badge-free-shipping',
      'badge-bestseller',
    ],
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @IsIn([
    'badge-new',
    'badge-sale',
    'badge-hot',
    'badge-limited',
    'badge-free-shipping',
    'badge-bestseller',
  ])
  badgeClass?: string;

  // ================================
  // SCHEDULING
  // ================================

  @ApiProperty({
    description: 'Campaign start date (ISO 8601 format)',
    example: '2024-06-01T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({
    description: 'Campaign end date (ISO 8601 format)',
    example: '2024-08-31T23:59:59.999Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: Date;
}

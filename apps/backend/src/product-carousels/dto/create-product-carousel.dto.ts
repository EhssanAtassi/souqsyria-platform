/**
 * @file create-product-carousel.dto.ts
 * @description DTO for creating a new product carousel
 *
 * VALIDATION RULES:
 * - type: Must be valid CarouselType enum
 * - titleEn/titleAr: Required, max 100 characters
 * - maxProducts: Range 10-50
 * - refreshInterval: ≥ 5 minutes if provided
 * - displayOrder: ≥ 0
 *
 * SYRIAN MARKET FEATURES:
 * - Bilingual support (Arabic/English)
 * - Flexible carousel types for cultural preferences
 * - Mobile-first optimization
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CarouselType } from '../entities/product-carousel.entity';

/**
 * Create Product Carousel DTO
 *
 * Used for creating new product carousels on the homepage.
 * Supports both dynamic (auto-populated) and custom (manual) carousel types.
 */
export class CreateProductCarouselDto {
  /**
   * Carousel type - determines population strategy
   *
   * - new_arrivals: Recently added products (auto-populated)
   * - best_sellers: Top selling products (auto-populated)
   * - trending: High engagement products (auto-populated)
   * - recommended: Personalized recommendations (auto-populated)
   * - custom: Manually curated products (manual)
   */
  @ApiProperty({
    description: 'Carousel type (determines how products are populated)',
    enum: CarouselType,
    example: CarouselType.NEW_ARRIVALS,
    enumName: 'CarouselType',
  })
  @IsEnum(CarouselType, {
    message:
      'Type must be one of: new_arrivals, best_sellers, trending, recommended, custom',
  })
  type: CarouselType;

  /**
   * Carousel title in English
   *
   * Display text shown to English-speaking users.
   */
  @ApiProperty({
    description: 'Carousel section title in English',
    example: 'New Arrivals',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Title (English) must be a string' })
  @MinLength(3, { message: 'Title (English) must be at least 3 characters' })
  @MaxLength(100, { message: 'Title (English) must not exceed 100 characters' })
  titleEn: string;

  /**
   * Carousel title in Arabic
   *
   * Display text shown to Arabic-speaking users (Syrian market primary).
   */
  @ApiProperty({
    description: 'Carousel section title in Arabic',
    example: 'الوافدون الجدد',
    minLength: 3,
    maxLength: 100,
  })
  @IsString({ message: 'Title (Arabic) must be a string' })
  @MinLength(3, { message: 'Title (Arabic) must be at least 3 characters' })
  @MaxLength(100, { message: 'Title (Arabic) must not exceed 100 characters' })
  titleAr: string;

  /**
   * Carousel description in English (optional)
   *
   * Additional context for the carousel section.
   */
  @ApiPropertyOptional({
    description: 'Optional description in English',
    example: 'Discover the latest products added to our marketplace',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Description (English) must be a string' })
  @MaxLength(500, {
    message: 'Description (English) must not exceed 500 characters',
  })
  descriptionEn?: string;

  /**
   * Carousel description in Arabic (optional)
   *
   * Additional context for the carousel section.
   */
  @ApiPropertyOptional({
    description: 'Optional description in Arabic',
    example: 'اكتشف أحدث المنتجات المضافة إلى سوقنا',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Description (Arabic) must be a string' })
  @MaxLength(500, {
    message: 'Description (Arabic) must not exceed 500 characters',
  })
  descriptionAr?: string;

  /**
   * Maximum number of products to display
   *
   * Range: 10-50 products
   * - Desktop: Can show 4-6 products per row
   * - Mobile: Shows 2-3 products per row
   * - Syrian users: 78% mobile traffic
   */
  @ApiPropertyOptional({
    description: 'Maximum number of products to display (10-50)',
    example: 20,
    default: 20,
    minimum: 10,
    maximum: 50,
  })
  @IsOptional()
  @IsInt({ message: 'Max products must be an integer' })
  @Min(10, { message: 'Max products must be at least 10' })
  @Max(50, { message: 'Max products must not exceed 50' })
  maxProducts?: number = 20;

  /**
   * Refresh interval in minutes (for dynamic carousels)
   *
   * Minimum: 5 minutes to avoid excessive database load
   * Only applicable for dynamic types (new_arrivals, best_sellers, trending, recommended)
   * Custom carousels ignore this field.
   */
  @ApiPropertyOptional({
    description:
      'How often to refresh dynamic carousel data (minutes, minimum 5)',
    example: 30,
    minimum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Refresh interval must be an integer' })
  @Min(5, { message: 'Refresh interval must be at least 5 minutes' })
  refreshInterval?: number;

  /**
   * Display order position (0-based)
   *
   * Lower values appear higher on the homepage.
   * Example: 0 = top, 1 = second, etc.
   */
  @ApiPropertyOptional({
    description:
      'Display order position on homepage (0-based, lower = higher priority)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'Display order must be an integer' })
  @Min(0, { message: 'Display order must be greater than or equal to 0' })
  displayOrder?: number = 0;

  /**
   * Whether carousel is active
   *
   * Inactive carousels are not shown on homepage.
   */
  @ApiPropertyOptional({
    description: 'Whether carousel is active and visible',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean = true;
}

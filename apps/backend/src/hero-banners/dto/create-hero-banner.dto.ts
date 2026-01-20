/**
 * @file create-hero-banner.dto.ts
 * @description DTO for creating new hero banners with complete validation
 *
 * @swagger
 * components:
 *   schemas:
 *     CreateHeroBannerDto:
 *       type: object
 *       required:
 *         - nameEn
 *         - nameAr
 *         - headlineEn
 *         - headlineAr
 *         - imageUrlDesktop
 *         - imageAltEn
 *         - imageAltAr
 *         - ctaTextEn
 *         - ctaTextAr
 *         - targetType
 *         - targetUrl
 *         - type
 *         - scheduleStart
 *         - scheduleEnd
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUrl,
  IsDateString,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHeroBannerDto {
  // ================================
  // MULTILINGUAL CONTENT
  // ================================

  @ApiProperty({
    description: 'Banner name in English (internal identifier)',
    example: 'Damascus Steel Heritage Collection',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({
    description: 'Banner name in Arabic (internal identifier)',
    example: 'مجموعة تراث الفولاذ الدمشقي',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nameAr: string;

  @ApiProperty({
    description: 'Main headline displayed on banner (English)',
    example: 'Authentic Damascus Steel Collection',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  headlineEn: string;

  @ApiProperty({
    description: 'Main headline displayed on banner (Arabic)',
    example: 'مجموعة الفولاذ الدمشقي الأصيل',
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  headlineAr: string;

  @ApiPropertyOptional({
    description: 'Subheadline text (English)',
    example: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  subheadlineEn?: string;

  @ApiPropertyOptional({
    description: 'Subheadline text (Arabic)',
    example: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام',
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  subheadlineAr?: string;

  // ================================
  // VISUAL ASSETS
  // ================================

  @ApiProperty({
    description: 'Desktop hero image URL (1920x800 recommended)',
    example: 'https://cdn.souqsyria.com/hero/damascus-steel-desktop.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrlDesktop: string;

  @ApiPropertyOptional({
    description: 'Tablet hero image URL (1024x600 recommended)',
    example: 'https://cdn.souqsyria.com/hero/damascus-steel-tablet.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrlTablet?: string;

  @ApiPropertyOptional({
    description: 'Mobile hero image URL (768x400 recommended)',
    example: 'https://cdn.souqsyria.com/hero/damascus-steel-mobile.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrlMobile?: string;

  @ApiProperty({
    description: 'Image alt text for SEO and accessibility (English)',
    example: 'Damascus Steel Heritage Collection',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  imageAltEn: string;

  @ApiProperty({
    description: 'Image alt text for SEO and accessibility (Arabic)',
    example: 'مجموعة تراث الفولاذ الدمشقي',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  imageAltAr: string;

  // ================================
  // CTA CONFIGURATION
  // ================================

  @ApiProperty({
    description: 'CTA button text (English)',
    example: 'Shop Damascus Steel',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaTextEn: string;

  @ApiProperty({
    description: 'CTA button text (Arabic)',
    example: 'تسوق الفولاذ الدمشقي',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ctaTextAr: string;

  @ApiPropertyOptional({
    description: 'CTA button visual variant',
    enum: ['primary', 'secondary', 'outline', 'ghost'],
    default: 'primary',
  })
  @IsEnum(['primary', 'secondary', 'outline', 'ghost'])
  @IsOptional()
  ctaVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';

  @ApiPropertyOptional({
    description: 'CTA button size',
    enum: ['small', 'medium', 'large'],
    default: 'large',
  })
  @IsEnum(['small', 'medium', 'large'])
  @IsOptional()
  ctaSize?: 'small' | 'medium' | 'large';

  @ApiPropertyOptional({
    description: 'CTA button color theme',
    example: 'golden-wheat',
    default: 'golden-wheat',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ctaColor?: string;

  @ApiPropertyOptional({
    description: 'Material icon name for CTA button',
    example: 'arrow_forward',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ctaIcon?: string;

  @ApiPropertyOptional({
    description: 'Icon position relative to text',
    enum: ['left', 'right'],
    default: 'right',
  })
  @IsEnum(['left', 'right'])
  @IsOptional()
  ctaIconPosition?: 'left' | 'right';

  @ApiPropertyOptional({
    description: 'Whether to show CTA button',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  ctaVisible?: boolean;

  // ================================
  // NAVIGATION & ROUTING
  // ================================

  @ApiProperty({
    description: 'Type of route for banner click',
    enum: ['category', 'product', 'campaign', 'external', 'page'],
    example: 'category',
  })
  @IsEnum(['category', 'product', 'campaign', 'external', 'page'])
  @IsNotEmpty()
  targetType: 'category' | 'product' | 'campaign' | 'external' | 'page';

  @ApiProperty({
    description: 'Target URL or route path',
    example: '/category/damascus-steel',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  targetUrl: string;

  @ApiPropertyOptional({
    description: 'UTM source for analytics',
    example: 'hero-slider',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingSource?: string;

  @ApiPropertyOptional({
    description: 'UTM medium for analytics',
    example: 'campaign',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  trackingMedium?: string;

  @ApiPropertyOptional({
    description: 'UTM campaign name',
    example: 'damascus-steel-heritage-campaign',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  trackingCampaign?: string;

  // ================================
  // THEME & STYLING
  // ================================

  @ApiPropertyOptional({
    description: 'Headline text color (light or dark)',
    enum: ['light', 'dark'],
    default: 'light',
  })
  @IsEnum(['light', 'dark'])
  @IsOptional()
  textColor?: 'light' | 'dark';

  @ApiPropertyOptional({
    description: 'Overlay color in hex format',
    example: '#000000',
  })
  @IsString()
  @IsOptional()
  @MaxLength(7)
  overlayColor?: string;

  @ApiPropertyOptional({
    description: 'Overlay opacity from 0 to 1',
    example: 0.4,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  overlayOpacity?: number;

  @ApiPropertyOptional({
    description: 'Content alignment on banner',
    enum: ['left', 'center', 'right'],
    default: 'left',
  })
  @IsEnum(['left', 'center', 'right'])
  @IsOptional()
  contentAlignment?: 'left' | 'center' | 'right';

  @ApiPropertyOptional({
    description: 'Content vertical alignment',
    enum: ['top', 'center', 'bottom'],
    default: 'center',
  })
  @IsEnum(['top', 'center', 'bottom'])
  @IsOptional()
  contentVerticalAlignment?: 'top' | 'center' | 'bottom';

  // ================================
  // BANNER TYPE & CONFIGURATION
  // ================================

  @ApiProperty({
    description: 'Banner type for categorization',
    enum: ['product_spotlight', 'seasonal', 'flash_sale', 'brand_story', 'cultural'],
    example: 'product_spotlight',
  })
  @IsEnum(['product_spotlight', 'seasonal', 'flash_sale', 'brand_story', 'cultural'])
  @IsNotEmpty()
  type: 'product_spotlight' | 'seasonal' | 'flash_sale' | 'brand_story' | 'cultural';

  @ApiPropertyOptional({
    description: 'Display priority for banner ordering (higher = shown first)',
    example: 10,
    default: 5,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  priority?: number;

  // ================================
  // SCHEDULING
  // ================================

  @ApiProperty({
    description: 'When the banner should start showing (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduleStart: Date;

  @ApiProperty({
    description: 'When the banner should stop showing (ISO 8601 format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduleEnd: Date;

  @ApiPropertyOptional({
    description: 'Timezone for schedule dates',
    example: 'Asia/Damascus',
    default: 'Asia/Damascus',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  // ================================
  // SYRIAN CULTURAL DATA (Optional)
  // ================================

  @ApiPropertyOptional({
    description: 'Syrian region for cultural banners',
    example: 'damascus',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  syrianRegion?: string;

  @ApiPropertyOptional({
    description: 'Syrian specialties featured in banner',
    example: ['Damascus Steel', 'Traditional Forging'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  syrianSpecialties?: string[];

  @ApiPropertyOptional({
    description: 'Cultural context description (English)',
  })
  @IsString()
  @IsOptional()
  culturalContextEn?: string;

  @ApiPropertyOptional({
    description: 'Cultural context description (Arabic)',
  })
  @IsString()
  @IsOptional()
  culturalContextAr?: string;

  @ApiPropertyOptional({
    description: 'Whether featured product has UNESCO recognition',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  unescoRecognition?: boolean;

  @ApiPropertyOptional({
    description: 'Featured artisan name (English)',
    example: 'Master Ahmad Al-Dimashqi',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  artisanNameEn?: string;

  @ApiPropertyOptional({
    description: 'Featured artisan name (Arabic)',
    example: 'الأستاذ أحمد الدمشقي',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  artisanNameAr?: string;

  @ApiPropertyOptional({
    description: 'Featured artisan biography (English)',
  })
  @IsString()
  @IsOptional()
  artisanBioEn?: string;

  @ApiPropertyOptional({
    description: 'Featured artisan biography (Arabic)',
  })
  @IsString()
  @IsOptional()
  artisanBioAr?: string;

  @ApiPropertyOptional({
    description: 'Artisan workshop location',
    example: 'Damascus Old City',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  artisanLocation?: string;

  @ApiPropertyOptional({
    description: 'Years of artisan experience',
    example: 25,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  artisanExperience?: number;

  // ================================
  // STATUS
  // ================================

  @ApiPropertyOptional({
    description: 'Whether banner is active and visible',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for banner categorization',
    example: ['damascus-steel', 'heritage', 'artisan'],
    type: [String],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

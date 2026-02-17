/**
 * @file create-category.dto.ts
 * @description Enhanced DTO for creating categories with enterprise features
 */
import {
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * Valid mega menu layout types
 * @description Centralized enum values for type-safe mega menu layout selection
 * @audit-fix W-8: Extracted to const for shared reference between entity and DTO
 */
export const MEGA_MENU_TYPES = ['sidebar', 'fullwidth', 'deep-browse', 'none'] as const;
export type MegaMenuType = (typeof MEGA_MENU_TYPES)[number];

/**
 * Brand chip DTO for megaMenuConfig validation
 * @description Validates individual brand chip entries within megaMenuConfig.brandChips
 * @audit-fix C-5: Added nested DTO validation for megaMenuConfig
 */
export class BrandChipDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Brand slug must be lowercase alphanumeric with hyphens' })
  slug: string;
}

/**
 * Promo banner DTO for megaMenuConfig validation
 * @description Validates promo banner entries within megaMenuConfig.promoBanner
 */
export class PromoBannerDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  textAr?: string;

  @IsOptional()
  @IsString()
  link?: string;
}

/**
 * Mega menu configuration DTO
 * @description Validates JSON structure for megaMenuConfig column
 * @audit-fix C-5: Added structured validation instead of raw Record<string, any>
 */
export class MegaMenuConfigDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PromoBannerDto)
  promoBanner?: PromoBannerDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BrandChipDto)
  brandChips?: BrandChipDto[];

  @IsOptional()
  @IsNumber({}, { each: true })
  featuredProductIds?: number[];

  /** Index signature for TypeORM compatibility with Record<string, any> column type */
  [key: string]: any;
}

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'Category name in English',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nameEn: string;

  @ApiProperty({
    example: 'إلكترونيات',
    description: 'Category name in Arabic',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nameAr: string;

  @ApiProperty({
    example: 'electronics',
    description: 'SEO-friendly URL slug (lowercase, no spaces)',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  slug: string;

  @ApiPropertyOptional({
    example: 'Electronic devices, gadgets, and home electronics',
    description: 'Category description in English',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descriptionEn?: string;

  @ApiPropertyOptional({
    example: 'أجهزة إلكترونية ومنزلية وأدوات ذكية',
    description: 'Category description in Arabic',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  descriptionAr?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/categories/electronics-icon.svg',
    description: 'Category icon URL for navigation menus',
  })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/categories/electronics-banner.jpg',
    description: 'Category banner image URL for category pages',
  })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional({
    example: '#2196F3',
    description: 'Category theme color in hex format',
  })
  @IsOptional()
  @IsHexColor()
  themeColor?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Parent category ID for hierarchical structure',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Sort order for category display (lower = higher priority)',
    minimum: 0,
    maximum: 9999,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  sortOrder?: number = 100;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the category is active and visible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the category is featured on homepage',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean = false;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to show category in navigation menus',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showInNav?: boolean = true;

  // Mega Menu Configuration
  /** @audit-fix W-8: Uses MEGA_MENU_TYPES const for type-safe enum validation */
  @ApiPropertyOptional({
    example: 'sidebar',
    enum: MEGA_MENU_TYPES,
    description: 'Mega menu layout type for navigation dropdown',
    default: 'none',
  })
  @IsOptional()
  @IsEnum(MEGA_MENU_TYPES, {
    message: `megaMenuType must be one of: ${MEGA_MENU_TYPES.join(', ')}`,
  })
  megaMenuType?: MegaMenuType;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether category is pinned in navigation bar',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPinnedInNav?: boolean = false;

  /**
   * @audit-fix C-5: Structured DTO validation with nested brand chips + promo banner
   * @description Validates JSON structure to prevent XSS via unvalidated text fields
   */
  @ApiPropertyOptional({
    description: 'JSON configuration for mega menu content (promo banners, brand chips, etc.)',
    example: {
      promoBanner: { text: 'Sale', textAr: 'تخفيضات', link: '/sale' },
      brandChips: [{ name: 'Samsung', nameAr: 'سامسونج', slug: 'samsung' }],
    },
    type: MegaMenuConfigDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MegaMenuConfigDto)
  megaMenuConfig?: MegaMenuConfigDto;

  // SEO Fields
  @ApiPropertyOptional({
    example: 'Electronics - Buy Online in Syria | SouqSyria',
    description: 'SEO meta title for search engines',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  seoTitle?: string;

  @ApiPropertyOptional({
    example:
      'Shop electronics, smartphones, TVs & more with fast delivery across Syria',
    description: 'SEO meta description for search engines',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  seoDescription?: string;

  @ApiPropertyOptional({
    example: 'الكترونيات',
    description: 'Arabic SEO slug for RTL URLs',
  })
  @IsOptional()
  @IsString()
  seoSlug?: string;

  // Business Fields
  @ApiPropertyOptional({
    example: 5.5,
    description: 'Commission rate percentage for products in this category',
    minimum: 0.5,
    maximum: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(15)
  commissionRate?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Minimum allowed product price in SYP',
    minimum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  minPrice?: number;

  @ApiPropertyOptional({
    example: 10000000,
    description: 'Maximum allowed product price in SYP',
    maximum: 100000000,
  })
  @IsOptional()
  @IsNumber()
  @Max(100000000)
  maxPrice?: number;

  // Enterprise Fields
  @ApiPropertyOptional({
    example: 1,
    description: 'Tenant ID for multi-tenancy support',
  })
  @IsOptional()
  @IsNumber()
  tenantId?: number;

  @ApiPropertyOptional({
    example: 'syria-main',
    description: 'Organization ID for enterprise grouping',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

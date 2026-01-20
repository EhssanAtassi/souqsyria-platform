/**
 * @file create-category.dto.ts
 * @description Enhanced DTO for creating categories with enterprise features
 */
import {
  IsBoolean,
  IsHexColor,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

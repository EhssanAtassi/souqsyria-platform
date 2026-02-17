/**
 * @file get-categories-tree.dto.ts
 * @description Response DTO for GET /categories/tree endpoint (mega menu structure)
 *
 * PURPOSE:
 * - Optimized for frontend mega menu rendering (3 levels: Parent > Child > Grandchild)
 * - Lightweight response with only essential fields
 * - Arabic/English bilingual support
 * - Designed for Syrian market e-commerce navigation
 *
 * USAGE:
 * - Main navigation mega menus
 * - Mobile app category browsers
 * - Category selection dropdowns
 * - SEO sitemap generation
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Grandchild category (3rd level - leaf nodes in mega menu)
 * Only essential fields for navigation performance
 */
export class CategoryTreeGrandchildDto {
  @ApiProperty({
    example: 100,
    description: 'Category unique identifier',
  })
  id: number;

  @ApiProperty({
    example: 'iPhone',
    description: 'Category name in English',
  })
  name: string;

  @ApiProperty({
    example: 'آيفون',
    description: 'Category name in Arabic',
  })
  nameAr: string;

  @ApiProperty({
    example: 'iphone',
    description: 'URL-friendly slug',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'smartphone',
    description: 'Icon identifier (Material Icons or custom)',
  })
  icon?: string;

  @ApiPropertyOptional({
    example: 'iphone-banner.jpg',
    description: 'Banner image URL or filename',
  })
  image?: string;

  @ApiPropertyOptional({
    example: 42,
    description: 'Number of products in this category',
  })
  productCount?: number;
}

/**
 * Child category (2nd level in mega menu)
 * Contains grandchildren for full 3-level hierarchy
 */
export class CategoryTreeChildDto {
  @ApiProperty({
    example: 10,
    description: 'Category unique identifier',
  })
  id: number;

  @ApiProperty({
    example: 'Mobile Phones',
    description: 'Category name in English',
  })
  name: string;

  @ApiProperty({
    example: 'هواتف محمولة',
    description: 'Category name in Arabic',
  })
  nameAr: string;

  @ApiProperty({
    example: 'mobile-phones',
    description: 'URL-friendly slug',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'smartphone',
    description: 'Icon identifier (Material Icons or custom)',
  })
  icon?: string;

  @ApiPropertyOptional({
    example: 'mobile-phones-banner.jpg',
    description: 'Banner image URL or filename',
  })
  image?: string;

  @ApiPropertyOptional({
    example: 156,
    description: 'Number of products in this category',
  })
  productCount?: number;

  @ApiProperty({
    type: [CategoryTreeGrandchildDto],
    description: 'Third-level categories (grandchildren)',
    isArray: true,
    default: [],
  })
  children: CategoryTreeGrandchildDto[];
}

/**
 * Root category (1st level in mega menu)
 * Parent of all child categories in the hierarchy
 */
export class CategoryTreeRootDto {
  @ApiProperty({
    example: 1,
    description: 'Category unique identifier',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Category name in English',
  })
  name: string;

  @ApiProperty({
    example: 'إلكترونيات',
    description: 'Category name in Arabic',
  })
  nameAr: string;

  @ApiProperty({
    example: 'electronics',
    description: 'URL-friendly slug',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'devices',
    description: 'Icon identifier (Material Icons or custom)',
  })
  icon?: string;

  @ApiPropertyOptional({
    example: 'electronics.jpg',
    description: 'Banner image URL or filename',
  })
  image?: string;

  @ApiPropertyOptional({
    example: 458,
    description:
      'Total number of products in this category and all descendants',
  })
  productCount?: number;

  @ApiPropertyOptional({
    enum: ['sidebar', 'fullwidth', 'deep-browse', 'none'],
    description: 'Mega menu layout type for this category',
    example: 'sidebar',
  })
  megaMenuType?: string;

  @ApiPropertyOptional({
    description: 'Whether category is pinned in navigation bar',
    example: false,
  })
  isPinnedInNav?: boolean;

  @ApiPropertyOptional({
    description: 'JSON mega menu configuration (promo banners, brand chips, etc.)',
  })
  megaMenuConfig?: Record<string, any>;

  @ApiProperty({
    type: [CategoryTreeChildDto],
    description: 'Second-level categories (children)',
    isArray: true,
    default: [],
  })
  children: CategoryTreeChildDto[];
}

/**
 * Main response DTO for GET /categories/tree endpoint
 * Returns the complete 3-level category hierarchy for mega menus
 */
export class GetCategoriesTreeResponseDto {
  @ApiProperty({
    type: [CategoryTreeRootDto],
    description: 'Array of root categories with full 3-level hierarchy',
    isArray: true,
    example: [
      {
        id: 1,
        name: 'Electronics',
        nameAr: 'إلكترونيات',
        slug: 'electronics',
        icon: 'devices',
        image: 'electronics.jpg',
        productCount: 458,
        children: [
          {
            id: 10,
            name: 'Mobile Phones',
            nameAr: 'هواتف محمولة',
            slug: 'mobile-phones',
            icon: 'smartphone',
            image: 'mobile-phones.jpg',
            productCount: 156,
            children: [
              {
                id: 100,
                name: 'iPhone',
                nameAr: 'آيفون',
                slug: 'iphone',
                icon: 'phone_iphone',
                productCount: 42,
              },
            ],
          },
        ],
      },
    ],
  })
  data: CategoryTreeRootDto[];
}

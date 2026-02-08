/**
 * @file get-featured-categories.dto.ts
 * @description Response DTO for GET /categories/featured endpoint
 *
 * PURPOSE:
 * - Returns featured categories optimized for homepage display
 * - Includes product counts and promotional imagery
 * - Bilingual support (Arabic/English)
 * - Optimized for Syrian market e-commerce
 *
 * USAGE:
 * - Homepage featured category carousels
 * - Landing page category highlights
 * - Mobile app featured sections
 * - Promotional category displays
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Single featured category item
 * Optimized response format matching frontend requirements
 */
export class FeaturedCategoryDto {
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
    description: 'URL-friendly slug for routing',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'electronics-banner.jpg',
    description: 'Featured banner image URL or filename',
  })
  image?: string;

  @ApiPropertyOptional({
    example: 'devices',
    description: 'Icon identifier (Material Icons or custom icon name)',
  })
  icon?: string;

  @ApiProperty({
    example: 458,
    description: 'Total number of active products in this category',
    default: 0,
  })
  productCount: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Sort order for featured display (higher = more prominent)',
  })
  sortOrder?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Featured priority (for sorting featured categories)',
  })
  featuredPriority?: number;

  @ApiPropertyOptional({
    example: '#2196F3',
    description: 'Theme color for category styling (hex format)',
  })
  themeColor?: string;

  @ApiPropertyOptional({
    example: '15%',
    description: 'Featured discount label (e.g., "15% OFF", "Sale")',
  })
  featuredDiscount?: string;

  @ApiPropertyOptional({
    example: 'Authentic Damascus steel products',
    description: 'Short description in English',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'منتجات الفولاذ الدمشقي الأصيلة',
    description: 'Short description in Arabic',
  })
  descriptionAr?: string;
}

/**
 * Main response DTO for GET /categories/featured endpoint
 * Returns featured categories for homepage and promotional displays
 */
export class GetFeaturedCategoriesResponseDto {
  @ApiProperty({
    type: [FeaturedCategoryDto],
    description: 'Array of featured categories sorted by priority',
    isArray: true,
    example: [
      {
        id: 1,
        name: 'Electronics',
        nameAr: 'إلكترونيات',
        slug: 'electronics',
        image: 'electronics-banner.jpg',
        icon: 'devices',
        productCount: 458,
        sortOrder: 10,
        featuredPriority: 10,
        themeColor: '#2196F3',
        featuredDiscount: '15%',
      },
      {
        id: 2,
        name: 'Fashion',
        nameAr: 'أزياء',
        slug: 'fashion',
        image: 'fashion-banner.jpg',
        icon: 'checkroom',
        productCount: 342,
        sortOrder: 20,
        featuredPriority: 9,
        themeColor: '#E91E63',
      },
    ],
  })
  data: FeaturedCategoryDto[];
}

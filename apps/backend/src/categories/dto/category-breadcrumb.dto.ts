/**
 * @file category-breadcrumb.dto.ts
 * @description DTO for category navigation breadcrumbs
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryBreadcrumbDto {
  @ApiProperty({
    example: 1,
    description: 'Category ID in the breadcrumb path',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Category display name (localized)',
  })
  name: string;

  @ApiProperty({
    example: 'electronics',
    description: 'Category URL slug',
  })
  slug: string;

  @ApiProperty({
    example: '/en/categories/electronics',
    description: 'Full URL path to this category',
  })
  url: string;

  @ApiProperty({
    example: true,
    description: 'Whether this category is currently active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 0,
    description: 'Hierarchy depth level (0 = root)',
  })
  depthLevel: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is the current/active breadcrumb item',
  })
  isCurrent?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/icons/electronics.svg',
    description: 'Category icon URL for enhanced breadcrumbs',
  })
  iconUrl?: string;

  @ApiPropertyOptional({
    example: 156,
    description: 'Number of products in this category',
  })
  productCount?: number;
}

/**
 * Breadcrumb collection with metadata
 */
export class CategoryBreadcrumbCollectionDto {
  @ApiProperty({
    type: [CategoryBreadcrumbDto],
    description: 'Array of breadcrumb items from root to current',
    isArray: true,
  })
  breadcrumbs: CategoryBreadcrumbDto[];

  @ApiProperty({
    example: 3,
    description: 'Number of levels in the breadcrumb path',
  })
  depth: number;

  @ApiProperty({
    example: 'Electronics → Smartphones → iPhone',
    description: 'Human-readable breadcrumb path',
  })
  textPath: string;

  @ApiProperty({
    example: 'Electronics / Smartphones / iPhone',
    description: 'SEO-friendly breadcrumb path for structured data',
  })
  seoPath: string;

  @ApiPropertyOptional({
    example: '/en/categories/electronics/smartphones/iphone',
    description: 'Canonical URL for the current breadcrumb path',
  })
  canonicalUrl?: string;
}

/**
 * @file category-tree-response.dto.ts
 * @description DTO for hierarchical category tree structures used in navigation menus and admin interfaces
 *
 * FEATURES:
 * - Nested parent-child relationships
 * - Tree metadata (depth, leaf status, children count)
 * - Performance optimized for large hierarchies
 * - Support for lazy loading and infinite scroll
 * - Arabic/English localization support
 * - Navigation-specific fields (URLs, icons, status)
 *
 * USED BY:
 * - Frontend navigation menus
 * - Admin category management trees
 * - Mobile app category browsers
 * - Product filtering interfaces
 * - SEO sitemap generation
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Lightweight parent reference for tree nodes
 * Prevents circular JSON serialization issues
 */
export class CategoryTreeParentDto {
  @ApiProperty({
    example: 1,
    description: 'Parent category ID',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Parent category display name (localized)',
  })
  name: string;

  @ApiProperty({
    example: 'electronics',
    description: 'Parent category URL slug',
  })
  slug: string;

  @ApiProperty({
    example: 0,
    description: 'Parent category depth level',
  })
  depthLevel: number;

  @ApiPropertyOptional({
    example: '/en/categories/electronics',
    description: 'Parent category URL',
  })
  url?: string;
}

/**
 * Tree metadata for performance and UI optimization
 */
export class CategoryTreeMetadataDto {
  @ApiProperty({
    example: 5,
    description: 'Total number of descendants (all levels)',
  })
  totalDescendants: number;

  @ApiProperty({
    example: 3,
    description: 'Number of direct children',
  })
  directChildrenCount: number;

  @ApiProperty({
    example: 2,
    description: 'Maximum depth of this subtree',
  })
  maxSubtreeDepth: number;

  @ApiProperty({
    example: 156,
    description: 'Total products in this category and all descendants',
  })
  totalProductCount: number;

  @ApiProperty({
    example: true,
    description: 'Whether this branch has been fully loaded',
  })
  isFullyLoaded: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this node supports lazy loading',
  })
  supportsLazyLoading: boolean;

  @ApiPropertyOptional({
    example: '2025-01-15T10:30:00Z',
    description: 'When this tree data was last cached',
  })
  lastCachedAt?: Date;
}

/**
 * Navigation-specific properties for tree nodes
 */
export class CategoryNavigationDto {
  @ApiProperty({
    example: '/en/categories/electronics',
    description: 'Full URL path for this category',
  })
  url: string;

  @ApiProperty({
    example: '/ar/categories/الكترونيات',
    description: 'Arabic URL path for RTL navigation',
  })
  urlAr: string;

  @ApiProperty({
    example: true,
    description: 'Whether to show in main navigation menu',
  })
  showInNav: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether to show in mobile menu',
  })
  showInMobile: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether to show in footer menu',
  })
  showInFooter: boolean;

  @ApiProperty({
    example: 'new',
    enum: ['new', 'hot', 'sale', 'featured', null],
    description: 'Navigation badge type',
  })
  badge?: 'new' | 'hot' | 'sale' | 'featured' | null;

  @ApiPropertyOptional({
    example: 'Latest electronics with warranty',
    description: 'Tooltip text for navigation item',
  })
  tooltip?: string;
}

/**
 * Main category tree response DTO
 * Represents a single node in the hierarchical category tree
 */
export class CategoryTreeResponseDto {
  // ================================
  // CORE IDENTIFICATION
  // ================================

  @ApiProperty({
    example: 1,
    description: 'Unique category identifier',
  })
  id: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Category display name (localized based on request language)',
  })
  name: string;

  @ApiProperty({
    example: 'electronics',
    description: 'URL-friendly slug for this category',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'Electronic devices, gadgets, and home electronics',
    description: 'Category description (localized)',
  })
  description?: string;

  // ================================
  // HIERARCHY STRUCTURE
  // ================================

  @ApiProperty({
    example: 0,
    description: 'Hierarchy depth level (0 = root, 1 = first level, etc.)',
  })
  depthLevel: number;

  @ApiPropertyOptional({
    type: CategoryTreeParentDto,
    description: 'Parent category reference (null for root categories)',
  })
  parent?: CategoryTreeParentDto;

  @ApiProperty({
    type: [CategoryTreeResponseDto],
    description: 'Array of direct child categories in this tree branch',
    isArray: true,
  })
  children: CategoryTreeResponseDto[];

  @ApiProperty({
    example: true,
    description: 'Whether this category has child categories',
  })
  hasChildren: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this is a leaf node (no children)',
  })
  isLeaf: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether this is a root category (no parent)',
  })
  isRoot: boolean;

  // ================================
  // STATUS AND VISIBILITY
  // ================================

  @ApiProperty({
    example: true,
    description: 'Whether category is active and visible to customers',
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether category is featured prominently',
  })
  isFeatured: boolean;

  @ApiProperty({
    example: 'approved',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    description: 'Current approval status',
  })
  approvalStatus: string;

  @ApiProperty({
    example: true,
    description: 'Whether category is publicly accessible (active + approved)',
  })
  isPublic: boolean;

  // ================================
  // VISUAL ELEMENTS
  // ================================

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/icons/electronics.svg',
    description: 'Category icon URL for menus and navigation',
  })
  iconUrl?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.souqsyria.com/banners/electronics.jpg',
    description: 'Category banner image URL',
  })
  bannerUrl?: string;

  @ApiPropertyOptional({
    example: '#2196F3',
    description: 'Theme color for category styling',
  })
  themeColor?: string;

  // ================================
  // PERFORMANCE METRICS
  // ================================

  @ApiProperty({
    example: 156,
    description: 'Number of products directly in this category',
  })
  productCount: number;

  @ApiProperty({
    example: 2341,
    description: 'Number of times this category was viewed',
  })
  viewCount: number;

  @ApiProperty({
    example: 87.5,
    description: 'Calculated popularity score (0-100)',
  })
  popularityScore: number;

  @ApiPropertyOptional({
    example: '2025-01-15T14:30:00Z',
    description: 'Last time this category had activity',
  })
  lastActivityAt?: Date;

  // ================================
  // SORTING AND ORDERING
  // ================================

  @ApiProperty({
    example: 100,
    description:
      'Sort order for displaying categories (lower = higher priority)',
  })
  sortOrder: number;

  @ApiProperty({
    example: 1,
    description: 'Position within parent category (1-based index)',
  })
  position: number;

  // ================================
  // NAVIGATION PROPERTIES
  // ================================

  @ApiProperty({
    type: CategoryNavigationDto,
    description: 'Navigation-specific properties and URLs',
  })
  navigation: CategoryNavigationDto;

  // ================================
  // TREE METADATA
  // ================================

  @ApiProperty({
    type: CategoryTreeMetadataDto,
    description: 'Tree structure metadata for performance optimization',
  })
  metadata: CategoryTreeMetadataDto;

  // ================================
  // BUSINESS RULES
  // ================================

  @ApiPropertyOptional({
    example: 5.5,
    description: 'Commission rate percentage for products in this category',
  })
  commissionRate?: number;

  @ApiProperty({
    example: true,
    description: 'Whether vendors can add products to this category',
  })
  allowsProducts: boolean;

  @ApiProperty({
    example: false,
    description:
      'Whether this category requires admin approval for new products',
  })
  requiresApproval: boolean;

  // ================================
  // TIMESTAMPS
  // ================================

  @ApiProperty({
    example: '2025-01-10T08:00:00Z',
    description: 'When this category was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-15T10:30:00Z',
    description: 'When this category was last updated',
  })
  updatedAt: Date;

  // ================================
  // LOCALIZATION SUPPORT
  // ================================

  @ApiPropertyOptional({
    example: 'Electronics',
    description: 'English name for this category',
  })
  nameEn?: string;

  @ApiPropertyOptional({
    example: 'إلكترونيات',
    description: 'Arabic name for this category',
  })
  nameAr?: string;

  @ApiPropertyOptional({
    example: 'en',
    enum: ['en', 'ar'],
    description: 'Language used for this response',
  })
  responseLanguage?: 'en' | 'ar';

  // ================================
  // COMPUTED HELPER PROPERTIES
  // ================================

  @ApiProperty({
    example: false,
    description: 'Whether this category needs admin attention',
  })
  needsAttention: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether this category can be edited by current user',
  })
  canEdit: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this category can be deleted by current user',
  })
  canDelete: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether child categories can be added under this category',
  })
  canAddChildren: boolean;

  @ApiProperty({
    example: '→ Electronics → Smartphones',
    description: 'Human-readable path from root to this category',
  })
  breadcrumbPath: string;

  // ================================
  // OPTIONAL EXTENDED DATA
  // ================================
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Additional custom data for this category tree node',
    example: {
      promotions: ['summer-sale'],
      featuredBrands: ['apple', 'samsung'],
      customAttributes: { isPopular: true },
    },
  })
  customData?: Record<string, any>;
}

/**
 * Response wrapper for category tree operations
 * Used when returning multiple tree structures or tree operation results
 */
export class CategoryTreeCollectionResponseDto {
  @ApiProperty({
    type: [CategoryTreeResponseDto],
    description: 'Array of category tree roots',
    isArray: true,
  })
  trees: CategoryTreeResponseDto[];

  @ApiProperty({
    example: 5,
    description: 'Total number of root categories',
  })
  rootCount: number;

  @ApiProperty({
    example: 47,
    description: 'Total number of categories across all trees',
  })
  totalCategories: number;

  @ApiProperty({
    example: 4,
    description: 'Maximum depth across all trees',
  })
  maxDepth: number;

  @ApiProperty({
    example: '2025-01-15T14:30:00Z',
    description: 'When this tree collection was generated',
  })
  generatedAt: Date;

  @ApiProperty({
    example: 245,
    description: 'Time taken to generate trees in milliseconds',
  })
  processingTimeMs: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this data was served from cache',
  })
  fromCache?: boolean;
}

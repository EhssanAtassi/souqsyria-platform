/**
 * @file index-dto.ts
 * @description Main export file for all category DTOs
 *
 * This file provides a centralized export point for all category-related
 * DTOs to simplify imports throughout the application.
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

// ============================================================================
// CORE CATEGORY DTOs
// ============================================================================
import {
  BulkCategoryMoveResult,
  CategoryMoveResult,
} from './category-move-result.dto';
import { HierarchyValidationResult } from './hierarchy-validation.dto';
import {
  CategoryStatsCollectionDto,
  CategoryStatsDto,
} from './category-stats.dto';
import { CategoryTreeResponseDto } from './category-tree-response.dto';
import { CategoryResponseDto } from './category-response.dto';
import { PaginatedCategoriesResponseDto } from './paginated-categories.dto';

export { CreateCategoryDto } from './create-category.dto';
export { UpdateCategoryDto } from './update-category.dto';
export {
  CategoryResponseDto,
  CategoryParentDto,
  CategoryChildDto,
} from './category-response.dto';

// ============================================================================
// DELETION AND RESTORATION DTOs (Comment out until files are created)
// ============================================================================
// export {
//   DeleteCategoryDto,
//   CategoryDeleteResult,
//   CategoryRestoreResult,
// } from './category-delete.dto';

// ============================================================================
// QUERY AND FILTERING DTOs
// ============================================================================
export {
  CategoryQueryDto,
  CategorySortBy,
  SortOrder,
  ApprovalStatus,
} from './category-query.dto';

// ============================================================================
// TREE AND HIERARCHY DTOs
// ============================================================================
export {
  CategoryTreeResponseDto,
  CategoryTreeParentDto,
  CategoryTreeMetadataDto,
  CategoryNavigationDto,
  CategoryTreeCollectionResponseDto,
} from './category-tree-response.dto';

export {
  GetCategoriesTreeResponseDto,
  CategoryTreeRootDto,
  CategoryTreeChildDto,
  CategoryTreeGrandchildDto,
} from './get-categories-tree.dto';

export {
  GetFeaturedCategoriesResponseDto,
  FeaturedCategoryDto,
} from './get-featured-categories.dto';

export {
  CategoryBreadcrumbDto,
  CategoryBreadcrumbCollectionDto,
} from './category-breadcrumb.dto';

export {
  HierarchyValidationResult,
  HierarchyMoveValidationDto,
} from './hierarchy-validation.dto';

export {
  CategoryMoveResult,
  BulkCategoryMoveResult,
} from './category-move-result.dto';

// ============================================================================
// PAGINATION DTOs
// ============================================================================
export {
  PaginatedCategoriesResponseDto,
  CategoryQueryMetadataDto,
  SearchMetadataDto,
  PaginationMetricsDto,
  DataQualityDto,
  CategoryAggregationsDto,
  HierarchyMetadataDto,
  SearchSummaryDto,
} from './paginated-categories.dto';

// ============================================================================
// ANALYTICS AND STATISTICS DTOs
// ============================================================================
export {
  CategoryStatsDto,
  CategoryProductMetricsDto,
  CategorySalesMetricsDto,
  CategoryCustomerMetricsDto,
  CategorySearchMetricsDto,
  SyrianMarketMetricsDto,
  CategoryTrendsDto,
  TimeSeriesDataPointDto,
  CategoryStatsCollectionDto,
  CategoryPerformanceComparisonDto,
} from './category-stats.dto';

// ============================================================================
// TYPE ALIASES FOR CONVENIENCE
// ============================================================================

/**
 * Union type for all category response types
 */
export type CategoryResponse = CategoryResponseDto | CategoryTreeResponseDto;

/**
 * Union type for all category statistics
 */
export type CategoryStatistics = CategoryStatsDto | CategoryStatsCollectionDto;

/**
 * Union type for hierarchy operation results
 */
export type HierarchyOperationResult =
  | CategoryMoveResult
  | BulkCategoryMoveResult
  | HierarchyValidationResult;

/**
 * Pagination wrapper type for any category data
 */
export type PaginatedResponse<T> = Omit<
  PaginatedCategoriesResponseDto,
  'data'
> & {
  data: T[];
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Base category identification fields
 */
export interface CategoryIdentifier {
  id: number;
  name: string;
  slug: string;
}

/**
 * Category status information
 */
export interface CategoryStatus {
  isActive: boolean;
  approvalStatus: string;
  isPublic: boolean;
}

/**
 * Category hierarchy position
 */
export interface CategoryHierarchyPosition {
  depthLevel: number;
  categoryPath: string;
  parent?: CategoryIdentifier;
  children?: CategoryIdentifier[];
}

/**
 * Category performance metrics summary
 */
export interface CategoryPerformanceSummary {
  productCount: number;
  viewCount: number;
  popularityScore: number;
  totalSales: number;
}

/**
 * Category operation options
 */
export interface CategoryOperationOptions {
  forceUpdate?: boolean;
  cascade?: boolean;
  moveChildrenToParent?: boolean;
  validateHierarchy?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum pagination limits
 */
export const PAGINATION_LIMITS = {
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20,
  MIN_PAGE_SIZE: 1,
} as const;

/**
 * Category hierarchy constraints
 */
export const HIERARCHY_CONSTRAINTS = {
  MAX_DEPTH: 4, // 0-4 = 5 levels
  MAX_CHILDREN_PER_PARENT: 50,
  MAX_BREADCRUMB_LENGTH: 200,
} as const;

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 1000,
  OPTIMAL_QUERY_MS: 200,
  CACHE_TTL_SECONDS: 300,
} as const;

/**
 * Data quality thresholds
 */
export const DATA_QUALITY_THRESHOLDS = {
  MIN_COMPLETENESS_SCORE: 0.8,
  MAX_MISSING_FIELDS_PERCENT: 0.2,
  MIN_INTEGRITY_SCORE: 0.95,
} as const;

/**
 * Category validation rules
 */
export const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  SLUG_PATTERN: /^[a-z0-9-]+$/,
  MIN_COMMISSION_RATE: 0.5,
  MAX_COMMISSION_RATE: 15,
  MIN_PRICE_SYP: 100,
  MAX_PRICE_SYP: 100000000,
} as const;

/**
 * @file paginated-categories.dto.ts
 * @description DTO for paginated category responses with metadata
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';
import { CategoryTreeResponseDto } from './category-tree-response.dto';

/**
 * Query metadata for search and filtering operations
 */
export class CategoryQueryMetadataDto {
  @ApiPropertyOptional({
    example: 'electronics',
    description: 'Search term used in the query',
  })
  search?: string;

  @ApiPropertyOptional({
    example: 'approved',
    description: 'Approval status filter applied',
  })
  approvalStatus?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Active status filter applied',
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Parent ID filter applied',
  })
  parentId?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Depth level filter applied',
  })
  depthLevel?: number;

  @ApiProperty({
    example: 'sortOrder',
    description: 'Field used for sorting',
  })
  sortBy: string;

  @ApiProperty({
    example: 'ASC',
    description: 'Sort order direction',
  })
  sortOrder: string;

  @ApiProperty({
    example: 'en',
    description: 'Language used for the response',
  })
  language: string;
}

/**
 * Search performance and execution metadata
 */
export class SearchMetadataDto {
  @ApiProperty({
    example: 245,
    description: 'Query execution time in milliseconds',
  })
  queryTimeMs: number;

  @ApiProperty({
    example: 1,
    description: 'Number of database queries executed',
  })
  databaseHits: number;

  @ApiProperty({
    example: false,
    description: 'Whether results were served from cache',
  })
  cacheUsed: boolean;

  @ApiProperty({
    example: ['IDX_categories_active_status', 'IDX_categories_sort_order'],
    description: 'Database indexes used for optimization',
  })
  indexesUsed: string[];

  @ApiProperty({
    example: '245ms',
    description: 'Estimated total scan time for the query',
  })
  estimatedTotalScanTime: string;
}

/**
 * Pagination performance and optimization metadata
 */
export class PaginationMetricsDto {
  @ApiProperty({
    example: true,
    description: 'Whether the page size is optimal for performance',
  })
  isOptimalPageSize: boolean;

  @ApiProperty({
    example: 50,
    description: 'Recommended page size for best performance',
  })
  recommendedPageSize: number;

  @ApiProperty({
    example: '245ms',
    description: 'Estimated time to load this page',
  })
  estimatedPageLoadTime: string;

  @ApiProperty({
    example: 'real-time',
    description: 'How fresh the data is',
  })
  dataFreshness: string;
}

/**
 * Data quality and integrity metrics
 */
export class DataQualityDto {
  @ApiProperty({
    example: 0.98,
    description: 'Data completeness score (0-1)',
  })
  completenessScore: number;

  @ApiProperty({
    example: {
      iconUrl: 2,
      seoDescription: 1,
      themeColor: 0,
    },
    description: 'Count of missing optional fields',
  })
  missingFields: Record<string, number>;

  @ApiProperty({
    example: [],
    description: 'Data quality issues found',
  })
  dataQualityIssues: string[];

  @ApiProperty({
    example: {
      checksumVerified: 50,
      checksumFailed: 0,
      checksumMissing: 2,
    },
    description: 'Data integrity check results',
  })
  integrityChecks: {
    checksumVerified: number;
    checksumFailed: number;
    checksumMissing: number;
  };
}

/**
 * Category aggregations and statistics
 */
export class CategoryAggregationsDto {
  @ApiProperty({
    example: 45,
    description: 'Total number of active categories',
  })
  totalActiveCategories: number;

  @ApiProperty({
    example: 8,
    description: 'Total number of featured categories',
  })
  totalFeaturedCategories: number;

  @ApiProperty({
    example: {
      approved: 42,
      pending: 3,
      draft: 5,
    },
    description: 'Breakdown by approval status',
  })
  approvalStatusBreakdown: Record<string, number>;

  @ApiProperty({
    example: {
      0: 12,
      1: 25,
      2: 13,
    },
    description: 'Breakdown by depth level',
  })
  depthLevelBreakdown: Record<string, number>;

  @ApiProperty({
    example: 1247,
    description: 'Total products across all categories',
  })
  totalProducts: number;

  @ApiProperty({
    example: 45672,
    description: 'Total views across all categories',
  })
  totalViews: number;

  @ApiProperty({
    example: 67.8,
    description: 'Average popularity score',
  })
  avgPopularityScore: number;
}

/**
 * Hierarchy information for tree-structured results
 */
export class HierarchyMetadataDto {
  @ApiProperty({
    example: 4,
    description: 'Maximum depth level in the result set',
  })
  maxDepth: number;

  @ApiProperty({
    example: 12,
    description: 'Number of root categories in the result set',
  })
  rootCategories: number;

  @ApiProperty({
    example: 23,
    description: 'Number of leaf categories (no children)',
  })
  totalLeafCategories: number;

  @ApiProperty({
    example: 3.2,
    description: 'Average number of children per parent category',
  })
  avgChildrenPerParent: number;

  @ApiProperty({
    example: false,
    description: 'Whether the complete hierarchy tree is included',
  })
  isCompleteTree: boolean;
}

/**
 * Search result summary
 */
export class SearchSummaryDto {
  @ApiProperty({
    example: 'Search for "electronics" with status filter',
    description: 'Human-readable description of the search query',
  })
  searchQuery: string;

  @ApiProperty({
    example: '50 of 156 categories found matching criteria',
    description: 'Summary of search results',
  })
  resultSummary: string;

  @ApiProperty({
    example: 'CREATE_CATEGORY',
    description: 'Most common action in the result set',
  })
  topAction: string;

  @ApiProperty({
    example: 'SYP',
    description: 'Primary currency used in the results',
  })
  primaryCurrency: string;

  @ApiProperty({
    example: '30 days',
    description: 'Date range covered by the results',
  })
  dateRangeCovered: string;

  @ApiProperty({
    example: 'optimal',
    enum: ['optimal', 'good', 'slow'],
    description: 'Search performance rating',
  })
  searchEfficiency: 'optimal' | 'good' | 'slow';
}

/**
 * Main paginated categories response DTO
 */
export class PaginatedCategoriesResponseDto {
  @ApiProperty({
    type: [CategoryResponseDto],
    description: 'Array of category data for the current page',
    isArray: true,
  })
  data: CategoryResponseDto[] | CategoryTreeResponseDto[];

  @ApiProperty({
    example: 156,
    description: 'Total number of categories matching the query',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 20,
    description: 'Number of items per page',
  })
  limit: number;

  @ApiProperty({
    example: 8,
    description: 'Total number of pages',
  })
  totalPages: number;

  @ApiProperty({
    example: true,
    description: 'Whether there is a next page',
  })
  hasNext: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPrev: boolean;

  @ApiProperty({
    example: 20,
    description: 'Number of items in the current page',
  })
  count: number;

  @ApiProperty({
    type: CategoryQueryMetadataDto,
    description: 'Metadata about the query that was executed',
  })
  meta: {
    query: CategoryQueryMetadataDto;
    executionTime: number;
    cacheHit: boolean;
  };

  @ApiPropertyOptional({
    type: CategoryAggregationsDto,
    description: 'Aggregated statistics for the result set',
  })
  aggregations?: CategoryAggregationsDto;

  @ApiPropertyOptional({
    type: HierarchyMetadataDto,
    description: 'Hierarchy information for tree-structured results',
  })
  hierarchy?: HierarchyMetadataDto;

  @ApiPropertyOptional({
    type: SearchMetadataDto,
    description: 'Search performance and execution metadata',
  })
  searchMetadata?: SearchMetadataDto;

  @ApiPropertyOptional({
    type: PaginationMetricsDto,
    description: 'Pagination performance metrics',
  })
  paginationMetrics?: PaginationMetricsDto;

  @ApiPropertyOptional({
    type: DataQualityDto,
    description: 'Data quality and integrity information',
  })
  dataQuality?: DataQualityDto;

  @ApiPropertyOptional({
    type: SearchSummaryDto,
    description: 'Human-readable search summary',
  })
  searchSummary?: SearchSummaryDto;
}

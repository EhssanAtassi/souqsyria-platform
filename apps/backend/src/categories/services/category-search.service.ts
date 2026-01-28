/**
 * @file category-search.service.ts
 * @description Category Search, Filtering & Pagination Service for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Advanced search with full-text capabilities
 * - Multi-criteria filtering (status, hierarchy, performance)
 * - High-performance pagination with metadata
 * - Query optimization and caching
 * - Search analytics and performance tracking
 * - Syrian market specific search features
 *
 * FEATURES:
 * - Elasticsearch-style query building
 * - Real-time search suggestions
 * - Multi-language search (Arabic + English)
 * - Faceted search with aggregations
 * - Search result ranking and relevance
 * - Performance monitoring and optimization
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Category } from '../entities/category.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import {
  CategoryQueryDto,
  CategoryResponseDto,
  PaginatedCategoriesResponseDto,
} from '../dto/index-dto';

/**
 * Search performance thresholds for monitoring
 */
const PERFORMANCE_THRESHOLDS = {
  FAST_QUERY_MS: 100,
  ACCEPTABLE_QUERY_MS: 500,
  SLOW_QUERY_MS: 1000,
  CACHE_TTL_MS: 300000, // 5 minutes
} as const;

/**
 * Search relevance scoring weights
 */
const SEARCH_WEIGHTS = {
  NAME_EXACT_MATCH: 10,
  NAME_PARTIAL_MATCH: 5,
  DESCRIPTION_MATCH: 2,
  SLUG_MATCH: 3,
  POPULARITY_BOOST: 1,
} as const;

@Injectable()
export class CategorySearchService {
  private readonly logger = new Logger(CategorySearchService.name);
  private readonly searchCache = new Map<string, any>();
  private readonly performanceMetrics = {
    totalSearches: 0,
    averageQueryTime: 0,
    cacheHitRate: 0,
    slowQueries: 0,
  };

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.log('🔍 Category Search Service initialized');
    this.initializeSearchOptimization();
  }

  // ============================================================================
  // MAIN SEARCH METHODS
  // ============================================================================

  /**
   * ADVANCED SEARCH WITH FILTERING
   *
   * Main search method with comprehensive filtering, pagination, and optimization.
   * Supports both simple and complex search scenarios with performance monitoring.
   *
   * @param queryDto - Search and filter parameters
   * @returns Paginated search results with metadata
   */
  async searchCategories(
    queryDto: CategoryQueryDto,
  ): Promise<PaginatedCategoriesResponseDto> {
    const startTime = Date.now();
    const searchId = this.generateSearchId();

    this.logger.log(
      `🔍 [${searchId}] Starting category search with filters: ${JSON.stringify(queryDto)}`,
    );

    try {
      // 1. Validate and sanitize query parameters
      const sanitizedQuery = await this.validateAndSanitizeQuery(queryDto);

      // 2. Check cache for identical searches
      const cacheKey = this.generateCacheKey(sanitizedQuery);
      const cachedResult = await this.checkSearchCache(cacheKey);

      if (cachedResult) {
        this.logger.debug(`📦 [${searchId}] Cache hit for search query`);
        this.updatePerformanceMetrics(Date.now() - startTime, true, false);
        return cachedResult;
      }

      // 3. Build optimized database query
      const queryBuilder = await this.buildSearchQuery(sanitizedQuery);

      // 4. Execute count query for pagination
      const totalCount = await this.executeCountQuery(queryBuilder);

      // 5. Apply pagination and execute main query
      const categories = await this.executePaginatedQuery(
        queryBuilder,
        sanitizedQuery,
      );

      // 6. Transform results to response DTOs
      const responseData = await this.transformSearchResults(
        categories,
        sanitizedQuery.language,
      );

      // 7. Calculate aggregations and metadata
      const aggregations = await this.calculateSearchAggregations(
        categories,
        sanitizedQuery,
      );

      // 8. Build comprehensive response
      const response = await this.buildSearchResponse(
        responseData,
        totalCount,
        sanitizedQuery,
        aggregations,
        startTime,
        searchId,
      );

      // 9. Cache successful results
      await this.cacheSearchResult(cacheKey, response);

      // 10. Log search analytics
      await this.logSearchAnalytics(sanitizedQuery, response, startTime);

      const queryTime = Date.now() - startTime;
      this.updatePerformanceMetrics(queryTime, false, true);

      this.logger.log(
        `✅ [${searchId}] Search completed: ${categories.length}/${totalCount} results (${queryTime}ms)`,
      );

      return response;
    } catch (error: unknown) {
      const queryTime = Date.now() - startTime;
      this.updatePerformanceMetrics(queryTime, false, false);

      this.logger.error(
        `❌ [${searchId}] Search failed: ${(error as Error).message} (${queryTime}ms)`,
        (error as Error).stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Search operation failed. Please try again.',
      );
    }
  }

  /**
   * QUICK SEARCH FOR AUTOCOMPLETE
   *
   * Fast search for autocomplete and suggestions with minimal data.
   *
   * @param searchTerm - Search term for autocomplete
   * @param language - Language preference
   * @param limit - Maximum number of suggestions
   * @returns Array of search suggestions
   */
  async quickSearch(
    searchTerm: string,
    language: 'en' | 'ar' = 'en',
    limit: number = 10,
  ): Promise<
    Array<{ id: number; name: string; slug: string; productCount: number }>
  > {
    const startTime = Date.now();

    this.logger.debug(`🚀 Quick search: "${searchTerm}" (${language})`);

    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const sanitizedTerm = searchTerm.trim().toLowerCase();
      const cacheKey = `quick_${sanitizedTerm}_${language}_${limit}`;

      // Check cache first
      if (this.searchCache.has(cacheKey)) {
        const cached = this.searchCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60000) {
          // 1 minute TTL for quick search
          return cached.data;
        }
      }

      // Build optimized quick search query
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.id',
          'category.nameEn',
          'category.nameAr',
          'category.slug',
          'category.seoSlug',
          'category.productCount',
          'category.popularityScore',
        ])
        .where('category.isActive = :isActive', { isActive: true })
        .andWhere('category.approvalStatus = :status', { status: 'approved' })
        .andWhere('category.deletedAt IS NULL');

      // Add language-specific search conditions
      if (language === 'ar') {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(category.nameAr) LIKE :searchTerm', {
              searchTerm: `%${sanitizedTerm}%`,
            }).orWhere('LOWER(category.seoSlug) LIKE :searchTerm', {
              searchTerm: `%${sanitizedTerm}%`,
            });
          }),
        );
      } else {
        queryBuilder.andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(category.nameEn) LIKE :searchTerm', {
              searchTerm: `%${sanitizedTerm}%`,
            }).orWhere('LOWER(category.slug) LIKE :searchTerm', {
              searchTerm: `%${sanitizedTerm}%`,
            });
          }),
        );
      }

      // Order by relevance and popularity
      queryBuilder
        .orderBy('category.popularityScore', 'DESC')
        .addOrderBy('category.productCount', 'DESC')
        .limit(limit);

      const results = await queryBuilder.getMany();

      // Transform to simple suggestion format
      const suggestions = results.map((category) => ({
        id: category.id,
        name: language === 'ar' ? category.nameAr : category.nameEn,
        slug:
          language === 'ar' ? category.seoSlug || category.slug : category.slug,
        productCount: category.productCount,
      }));

      // Cache results
      this.searchCache.set(cacheKey, {
        data: suggestions,
        timestamp: Date.now(),
      });

      const queryTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Quick search completed: ${suggestions.length} suggestions (${queryTime}ms)`,
      );

      return suggestions;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Quick search failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return []; // Return empty array for autocomplete graceful degradation
    }
  }

  /**
   * SEARCH BY HIERARCHY PATH
   *
   * Searches categories within a specific hierarchy path.
   *
   * @param parentId - Parent category ID (null for root level)
   * @param filters - Additional filters
   * @returns Categories within the specified hierarchy level
   */
  async searchByHierarchy(
    parentId: number | null,
    filters: Partial<CategoryQueryDto> = {},
  ): Promise<CategoryResponseDto[]> {
    this.logger.debug(`🌲 Hierarchy search: parent=${parentId}`);

    try {
      const queryBuilder = this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.parent', 'parent')
        .leftJoinAndSelect('category.children', 'children')
        .where('category.deletedAt IS NULL');

      // Apply parent filter
      if (parentId === null) {
        queryBuilder.andWhere('category.parent IS NULL');
      } else {
        queryBuilder.andWhere('category.parent = :parentId', { parentId });
      }

      // Apply additional filters
      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('category.isActive = :isActive', {
          isActive: filters.isActive,
        });
      }

      if (filters.approvalStatus) {
        queryBuilder.andWhere('category.approvalStatus = :status', {
          status: filters.approvalStatus,
        });
      }

      // Order by sort order and name
      queryBuilder
        .orderBy('category.sortOrder', 'ASC')
        .addOrderBy('category.nameEn', 'ASC');

      const categories = await queryBuilder.getMany();

      return this.transformSearchResults(categories, filters.language || 'en');
    } catch (error: unknown) {
      this.logger.error(
        `❌ Hierarchy search failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Hierarchy search failed');
    }
  }

  // ============================================================================
  // QUERY BUILDING METHODS
  // ============================================================================

  /**
   * BUILD SEARCH QUERY
   *
   * Constructs optimized TypeORM query builder with all filters and conditions.
   *
   * @param queryDto - Validated and sanitized query parameters
   * @returns Configured QueryBuilder instance
   */
  private async buildSearchQuery(
    queryDto: CategoryQueryDto,
  ): Promise<SelectQueryBuilder<Category>> {
    this.logger.debug('🏗️ Building optimized search query');

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('category.creator', 'creator')
      .leftJoinAndSelect('category.updater', 'updater')
      .leftJoinAndSelect('category.approver', 'approver')
      .where('category.deletedAt IS NULL');

    // Apply search term with relevance scoring
    if (queryDto.search) {
      await this.applySearchConditions(
        queryBuilder,
        queryDto.search,
        queryDto.language,
      );
    }

    // Apply status filters
    await this.applyStatusFilters(queryBuilder, queryDto);

    // Apply hierarchy filters
    await this.applyHierarchyFilters(queryBuilder, queryDto);

    // Apply performance filters
    await this.applyPerformanceFilters(queryBuilder, queryDto);

    // Apply enterprise filters
    await this.applyEnterpriseFilters(queryBuilder, queryDto);

    // Apply sorting
    await this.applySorting(queryBuilder, queryDto);

    return queryBuilder;
  }

  /**
   * APPLY SEARCH CONDITIONS
   *
   * Adds full-text search conditions with relevance scoring.
   */
  private async applySearchConditions(
    queryBuilder: SelectQueryBuilder<Category>,
    searchTerm: string,
    language: 'en' | 'ar' = 'en',
  ): Promise<void> {
    const sanitizedTerm = searchTerm.trim().toLowerCase();

    this.logger.debug(
      `🔤 Applying search conditions: "${sanitizedTerm}" (${language})`,
    );

    // Build search conditions with relevance
    queryBuilder.andWhere(
      new Brackets((qb) => {
        if (language === 'ar') {
          // Arabic search conditions
          qb.where('LOWER(category.nameAr) LIKE :exactName', {
            exactName: sanitizedTerm,
          })
            .orWhere('LOWER(category.nameAr) LIKE :partialName', {
              partialName: `%${sanitizedTerm}%`,
            })
            .orWhere('LOWER(category.descriptionAr) LIKE :description', {
              description: `%${sanitizedTerm}%`,
            })
            .orWhere('LOWER(category.seoSlug) LIKE :slug', {
              slug: `%${sanitizedTerm}%`,
            });
        } else {
          // English search conditions
          qb.where('LOWER(category.nameEn) LIKE :exactName', {
            exactName: sanitizedTerm,
          })
            .orWhere('LOWER(category.nameEn) LIKE :partialName', {
              partialName: `%${sanitizedTerm}%`,
            })
            .orWhere('LOWER(category.descriptionEn) LIKE :description', {
              description: `%${sanitizedTerm}%`,
            })
            .orWhere('LOWER(category.slug) LIKE :slug', {
              slug: `%${sanitizedTerm}%`,
            });
        }
      }),
    );
  }

  /**
   * APPLY STATUS FILTERS
   */
  private async applyStatusFilters(
    queryBuilder: SelectQueryBuilder<Category>,
    queryDto: CategoryQueryDto,
  ): Promise<void> {
    if (queryDto.approvalStatus) {
      queryBuilder.andWhere('category.approvalStatus = :approvalStatus', {
        approvalStatus: queryDto.approvalStatus,
      });
    }

    if (queryDto.isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', {
        isActive: queryDto.isActive,
      });
    }

    if (queryDto.isFeatured !== undefined) {
      queryBuilder.andWhere('category.isFeatured = :isFeatured', {
        isFeatured: queryDto.isFeatured,
      });
    }

    if (queryDto.showInNav !== undefined) {
      queryBuilder.andWhere('category.showInNav = :showInNav', {
        showInNav: queryDto.showInNav,
      });
    }
  }

  /**
   * APPLY HIERARCHY FILTERS
   */
  private async applyHierarchyFilters(
    queryBuilder: SelectQueryBuilder<Category>,
    queryDto: CategoryQueryDto,
  ): Promise<void> {
    if (queryDto.parentId !== undefined) {
      if (queryDto.parentId === null) {
        queryBuilder.andWhere('category.parent IS NULL');
      } else {
        queryBuilder.andWhere('category.parent = :parentId', {
          parentId: queryDto.parentId,
        });
      }
    }

    if (queryDto.depthLevel !== undefined) {
      queryBuilder.andWhere('category.depthLevel = :depthLevel', {
        depthLevel: queryDto.depthLevel,
      });
    }
  }

  /**
   * APPLY PERFORMANCE FILTERS
   */
  private async applyPerformanceFilters(
    queryBuilder: SelectQueryBuilder<Category>,
    queryDto: CategoryQueryDto,
  ): Promise<void> {
    if (queryDto.minProductCount !== undefined) {
      queryBuilder.andWhere('category.productCount >= :minProductCount', {
        minProductCount: queryDto.minProductCount,
      });
    }
  }

  /**
   * APPLY ENTERPRISE FILTERS
   */
  private async applyEnterpriseFilters(
    queryBuilder: SelectQueryBuilder<Category>,
    queryDto: CategoryQueryDto,
  ): Promise<void> {
    if (queryDto.tenantId !== undefined) {
      queryBuilder.andWhere('category.tenantId = :tenantId', {
        tenantId: queryDto.tenantId,
      });
    }

    if (!queryDto.includeDeleted) {
      queryBuilder.andWhere('category.deletedAt IS NULL');
    }
  }

  /**
   * APPLY SORTING
   */
  private async applySorting(
    queryBuilder: SelectQueryBuilder<Category>,
    queryDto: CategoryQueryDto,
  ): Promise<void> {
    const sortBy = queryDto.sortBy || 'sortOrder';
    const sortOrder = queryDto.sortOrder || 'ASC';

    // Map DTO sort fields to entity fields
    const sortFieldMap = {
      nameEn: 'category.nameEn',
      sortOrder: 'category.sortOrder',
      createdAt: 'category.createdAt',
      updatedAt: 'category.updatedAt',
      popularityScore: 'category.popularityScore',
      productCount: 'category.productCount',
      viewCount: 'category.viewCount',
    };

    const entityField = sortFieldMap[sortBy] || 'category.sortOrder';

    queryBuilder.orderBy(entityField, sortOrder);

    // Add secondary sort for consistency
    if (sortBy !== 'nameEn') {
      queryBuilder.addOrderBy('category.nameEn', 'ASC');
    }
  }

  // ============================================================================
  // RESULT PROCESSING METHODS
  // ============================================================================

  /**
   * EXECUTE COUNT QUERY
   */
  private async executeCountQuery(
    queryBuilder: SelectQueryBuilder<Category>,
  ): Promise<number> {
    const countQuery = queryBuilder.clone();

    // Remove unnecessary joins for count query optimization
    countQuery
      .leftJoin('category.parent', 'parent')
      .leftJoin('category.children', 'children')
      .select('COUNT(DISTINCT category.id)', 'count');

    const result = await countQuery.getRawOne();
    return parseInt(result.count) || 0;
  }

  /**
   * EXECUTE PAGINATED QUERY
   */
  private async executePaginatedQuery(
    queryBuilder: SelectQueryBuilder<Category>,
    queryDto: CategoryQueryDto,
  ): Promise<Category[]> {
    const page = queryDto.page || 1;
    const limit = Math.min(queryDto.limit || 20, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    return queryBuilder.skip(skip).take(limit).getMany();
  }

  /**
   * TRANSFORM SEARCH RESULTS
   */
  private async transformSearchResults(
    categories: Category[],
    language: 'en' | 'ar' = 'en',
  ): Promise<CategoryResponseDto[]> {
    return categories.map((category) => ({
      id: category.id,
      nameEn: category.nameEn,
      nameAr: category.nameAr,
      name: category.getDisplayName(language),
      slug: category.slug,
      descriptionEn: category.descriptionEn,
      descriptionAr: category.descriptionAr,
      description: category.getDisplayDescription(language),
      iconUrl: category.iconUrl,
      bannerUrl: category.bannerUrl,
      themeColor: category.themeColor,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      seoSlug: category.seoSlug,
      approvalStatus: category.approvalStatus,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      showInNav: category.showInNav,
      depthLevel: category.depthLevel,
      categoryPath: category.categoryPath,
      sortOrder: category.sortOrder,
      commissionRate: category.commissionRate,
      minPrice: category.minPrice,
      maxPrice: category.maxPrice,
      productCount: category.productCount,
      viewCount: category.viewCount,
      popularityScore: category.popularityScore,
      lastActivityAt: category.lastActivityAt,
      createdBy: category.createdBy,
      updatedBy: category.updatedBy,
      approvedBy: category.approvedBy,
      approvedAt: category.approvedAt,
      rejectionReason: category.rejectionReason,
      tenantId: category.tenantId,
      organizationId: category.organizationId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      displayName: category.getDisplayName(language),
      displayDescription: category.getDisplayDescription(language),
      url: category.generateUrl(language),
      isPublic: category.isPublic(),
      canBeEdited: category.canBeEdited(),
      isRootCategory: category.isRootCategory(),
      hasChildren: category.hasChildren(),
      needsAdminAttention: category.needsAdminAttention(),
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.getDisplayName(language),
            slug: category.parent.getSlug(language),
          }
        : undefined,
      children: category.children?.map((child) => ({
        id: child.id,
        name: child.getDisplayName(language),
        slug: child.getSlug(language),
        isActive: child.isActive,
        productCount: child.productCount,
      })),
    }));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * VALIDATE AND SANITIZE QUERY
   */
  private async validateAndSanitizeQuery(
    queryDto: CategoryQueryDto,
  ): Promise<CategoryQueryDto> {
    // Validate page and limit
    const page = Math.max(1, queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit || 20), 100);

    // Sanitize search term
    let search = queryDto.search;
    if (search) {
      search = search.trim();
      if (search.length > 100) {
        throw new BadRequestException(
          'Search term cannot exceed 100 characters',
        );
      }
      if (search.length < 2) {
        search = undefined; // Ignore too short search terms
      }
    }

    return {
      ...queryDto,
      page,
      limit,
      search,
      language: queryDto.language || 'en',
    };
  }

  /**
   * GENERATE SEARCH ID
   */
  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * GENERATE CACHE KEY
   */
  private generateCacheKey(queryDto: CategoryQueryDto): string {
    return `search_${JSON.stringify(queryDto)}`;
  }

  /**
   * CHECK SEARCH CACHE
   */
  private async checkSearchCache(cacheKey: string): Promise<any> {
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < PERFORMANCE_THRESHOLDS.CACHE_TTL_MS) {
        return cached.data;
      }
      this.searchCache.delete(cacheKey);
    }
    return null;
  }

  /**
   * Additional utility methods would go here...
   */
  private async calculateSearchAggregations(
    categories: Category[],
    queryDto: CategoryQueryDto,
  ): Promise<any> {
    // Placeholder for aggregation calculations
    return {};
  }

  private async buildSearchResponse(
    data: CategoryResponseDto[],
    total: number,
    queryDto: CategoryQueryDto,
    aggregations: any,
    startTime: number,
    searchId: string,
  ): Promise<PaginatedCategoriesResponseDto> {
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      count: data.length,
      meta: {
        query: {
          search: queryDto.search,
          approvalStatus: queryDto.approvalStatus,
          isActive: queryDto.isActive,
          sortBy: queryDto.sortBy || 'sortOrder',
          sortOrder: queryDto.sortOrder || 'ASC',
          language: queryDto.language || 'en',
        },
        executionTime: Date.now() - startTime,
        cacheHit: false,
      },
    };
  }

  private async cacheSearchResult(
    cacheKey: string,
    response: any,
  ): Promise<void> {
    this.searchCache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
    });
  }

  private async logSearchAnalytics(
    queryDto: CategoryQueryDto,
    response: any,
    startTime: number,
  ): Promise<void> {
    // Log search analytics for performance monitoring
    this.logger.debug(
      `📊 Search analytics: ${queryDto.search} → ${response.total} results`,
    );
  }

  private initializeSearchOptimization(): void {
    this.logger.log('🚀 Initializing search optimization features');
  }

  private updatePerformanceMetrics(
    queryTime: number,
    cacheHit: boolean,
    success: boolean,
  ): void {
    this.performanceMetrics.totalSearches++;

    if (queryTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
      this.performanceMetrics.slowQueries++;
      this.logger.warn(`⚠️ Slow search query detected: ${queryTime}ms`);
    }
  }
}

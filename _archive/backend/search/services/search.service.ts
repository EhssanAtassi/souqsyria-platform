import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { RecentSearch } from '../entities/recent-search.entity';
import {
  SearchSuggestionsQueryDto,
  SearchSuggestionsResponseDto,
  ProductSuggestionDto,
  CategorySuggestionDto,
  CreateRecentSearchDto,
  RecentSearchQueryDto,
} from '../dto/index';

/**
 * SearchService
 *
 * @description Handles all search-related operations for the SouqSyria marketplace.
 * Provides intelligent search suggestions combining products, categories, and popular searches.
 * Manages user search history with deduplication and automatic cleanup.
 *
 * Key Features:
 * - Bilingual search (Arabic + English) with fuzzy matching
 * - Real-time search suggestions with performance tracking
 * - User search history management with configurable limits
 * - Popular search aggregation from user behavior
 * - Product and category suggestions with relevant metadata
 *
 * @export
 * @class SearchService
 */
@Injectable()
export class SearchService {
  /**
   * Logger instance for SearchService
   * Uses emoji prefixes for better log readability
   */
  private readonly logger = new Logger(SearchService.name);

  /**
   * Maximum number of recent searches stored per user
   * Oldest entries are automatically pruned when exceeded
   */
  private readonly MAX_RECENT_SEARCHES_PER_USER = 20;

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(RecentSearch)
    private readonly recentSearchRepository: Repository<RecentSearch>,
  ) {}

  /**
   * Get intelligent search suggestions
   *
   * @description Provides real-time search suggestions by querying products, categories,
   * and popular searches. Results are returned with performance metrics for optimization.
   *
   * Search Strategy:
   * 1. Product Search: Searches nameEn/nameAr using LIKE '%query%', returns active published products
   * 2. Category Search: Searches nameEn/nameAr, includes product count for relevance
   * 3. Popular Searches: Aggregates most frequent queries from recent search history
   *
   * Performance Optimizations:
   * - Parallel query execution using Promise.all
   * - Selective column selection to minimize data transfer
   * - Configurable result limits to control response size
   * - Query performance timing for monitoring
   *
   * @param {SearchSuggestionsQueryDto} dto - Search query parameters with limits
   * @returns {Promise<SearchSuggestionsResponseDto>} Combined suggestions with metadata
   * @throws {BadRequestException} If query is invalid or empty
   *
   * @example
   * const suggestions = await searchService.getSuggestions({
   *   query: 'damascus',
   *   productLimit: 5,
   *   categoryLimit: 3,
   *   popularLimit: 5
   * });
   */
  async getSuggestions(
    dto: SearchSuggestionsQueryDto,
  ): Promise<SearchSuggestionsResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🔍 Getting search suggestions for query: "${dto.q}"`);

    try {
      // Normalize search query for consistent matching
      const normalizedQuery = dto.q.trim();

      if (!normalizedQuery) {
        throw new BadRequestException('Search query cannot be empty');
      }

      // Execute all search queries in parallel for optimal performance
      // Distribute the overall limit across product (5), category (3), and popular (5) results
      const productLimit = Math.min(dto.limit || 8, 5);
      const categoryLimit = Math.min(Math.ceil((dto.limit || 8) / 3), 3);
      const popularLimit = 5;

      const [products, categories, popularSearches] = await Promise.all([
        this.searchProducts(normalizedQuery, productLimit),
        this.searchCategories(normalizedQuery, categoryLimit),
        this.getPopularSearches(popularLimit),
      ]);

      const searchTime = Date.now() - startTime;

      this.logger.log(
        `✅ Search completed in ${searchTime}ms - Products: ${products.length}, Categories: ${categories.length}, Popular: ${popularSearches.length}`,
      );

      return {
        products,
        categories,
        popular: popularSearches,
        searchTime,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error getting search suggestions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Search products by name (bilingual)
   *
   * @description Searches active, published products by English or Arabic name.
   * Uses LIKE operator with wildcards for flexible matching. Returns minimal
   * product data optimized for suggestion display.
   *
   * Query Optimization:
   * - Only selects required columns to minimize data transfer
   * - Filters by isActive and isPublished for public-only results
   * - Joins category for additional context
   * - Limits results to prevent overwhelming UI
   *
   * @private
   * @param {string} query - Normalized search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<ProductSuggestionDto[]>} Array of product suggestions
   */
  private async searchProducts(
    query: string,
    limit: number,
  ): Promise<ProductSuggestionDto[]> {
    this.logger.debug(`🔎 Searching products with query: "${query}"`);

    try {
      const products = await this.productRepository
        .createQueryBuilder('product')
        .select([
          'product.id',
          'product.nameEn',
          'product.nameAr',
          'product.slug',
          'product.currency',
        ])
        .leftJoin('product.category', 'category')
        .addSelect(['category.id', 'category.nameEn', 'category.nameAr'])
        .leftJoin('product.pricing', 'pricing')
        .addSelect(['pricing.basePrice', 'pricing.discountPrice'])
        .leftJoin('product.images', 'image', 'image.sortOrder = 0 AND image.isDeleted = false')
        .addSelect(['image.imageUrl'])
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.isPublished = :isPublished', { isPublished: true })
        .andWhere(
          '(product.nameEn LIKE :query OR product.nameAr LIKE :query)',
          { query: `%${query}%` },
        )
        .orderBy('product.nameEn', 'ASC')
        .limit(limit)
        .getMany();

      // Transform to ProductSuggestionDto format
      return products.map((product) => {
        const displayPrice = product.pricing?.discountPrice || product.pricing?.basePrice;
        return {
          id: product.id,
          name: product.nameEn, // Default to English; frontend handles localization
          slug: product.slug,
          image: product.images?.[0]?.imageUrl || null,
          price: displayPrice
            ? `${Number(displayPrice).toLocaleString()} ${product.currency || 'SYP'}`
            : '',
          category: product.category?.nameEn,
        };
      });
    } catch (error) {
      this.logger.error(`❌ Error searching products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search categories by name (bilingual)
   *
   * @description Searches categories by English or Arabic name with product count.
   * Includes product count to help users understand category relevance and size.
   *
   * Query Features:
   * - Bilingual name search (Arabic + English)
   * - Aggregates product count per category
   * - Includes Material icon for UI rendering
   * - Orders by name for alphabetical consistency
   *
   * @private
   * @param {string} query - Normalized search query
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<CategorySuggestionDto[]>} Array of category suggestions
   */
  private async searchCategories(
    query: string,
    limit: number,
  ): Promise<CategorySuggestionDto[]> {
    this.logger.debug(`🔎 Searching categories with query: "${query}"`);

    try {
      const categories = await this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.id',
          'category.nameEn',
          'category.nameAr',
          'category.seoSlug',
          'category.iconUrl',
        ])
        .loadRelationCountAndMap(
          'category.productCount',
          'category.products',
          'product',
          (qb) =>
            qb
              .where('product.isActive = :isActive', { isActive: true })
              .andWhere('product.isPublished = :isPublished', {
                isPublished: true,
              }),
        )
        .where('(category.nameEn LIKE :query OR category.nameAr LIKE :query)', {
          query: `%${query}%`,
        })
        .orderBy('category.nameEn', 'ASC')
        .limit(limit)
        .getMany();

      // Transform to CategorySuggestionDto format
      return categories.map((category) => ({
        id: category.id,
        name: category.nameEn, // Default to English; frontend handles localization
        slug: category.seoSlug,
        icon: category.iconUrl,
        productCount: (category as any).productCount || 0,
      }));
    } catch (error) {
      this.logger.error(`❌ Error searching categories: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get popular search queries
   *
   * @description Aggregates most frequent search queries from user search history.
   * Provides social proof and helps users discover trending products/categories.
   *
   * Aggregation Logic:
   * - Groups by normalized query text
   * - Sums search counts across all users
   * - Orders by total searches (most popular first)
   * - Limits to top N results
   *
   * Use Cases:
   * - Homepage search suggestions
   * - Trending searches display
   * - Search query recommendations
   *
   * @private
   * @param {number} limit - Maximum number of popular searches to return
   * @returns {Promise<string[]>} Array of popular search queries
   */
  private async getPopularSearches(limit: number): Promise<string[]> {
    this.logger.debug(`🔥 Getting top ${limit} popular searches`);

    try {
      const popularSearches = await this.recentSearchRepository
        .createQueryBuilder('search')
        .select('search.query', 'query')
        .addSelect('SUM(search.searchCount)', 'totalSearches')
        .groupBy('search.query')
        .orderBy('totalSearches', 'DESC')
        .limit(limit)
        .getRawMany();

      return popularSearches.map((result) => result.query);
    } catch (error) {
      this.logger.error(
        `❌ Error getting popular searches: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user's recent search history
   *
   * @description Retrieves a user's recent searches ordered by most recent first.
   * Used for personalized search suggestions and user convenience.
   *
   * Features:
   * - Filtered by user ID for privacy
   * - Ordered by searchedAt DESC for recency
   * - Configurable limit via DTO
   * - Includes search metadata (count, results, timestamp)
   *
   * @param {number} userId - ID of the user requesting search history
   * @param {RecentSearchQueryDto} dto - Query parameters with limit
   * @returns {Promise<RecentSearch[]>} Array of recent search records
   *
   * @example
   * const recent = await searchService.getRecentSearches(123, { limit: 10 });
   */
  async getRecentSearches(
    userId: number,
    dto: RecentSearchQueryDto,
  ): Promise<RecentSearch[]> {
    this.logger.log(`📜 Getting recent searches for user ${userId}`);

    try {
      const searches = await this.recentSearchRepository.find({
        where: { userId },
        order: { searchedAt: 'DESC' },
        take: dto.limit || 10,
      });

      this.logger.log(
        `✅ Retrieved ${searches.length} recent searches for user ${userId}`,
      );

      return searches;
    } catch (error) {
      this.logger.error(
        `❌ Error getting recent searches for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Save or update a recent search entry
   *
   * @description Records a user's search query with automatic deduplication and cleanup.
   * If the same query exists, increments the search count instead of creating duplicates.
   * Enforces maximum history limit per user to prevent unbounded growth.
   *
   * Deduplication Strategy:
   * - Normalizes query (trim + lowercase) for consistent matching
   * - Checks for existing entry with same user + normalized query
   * - Updates existing: increments searchCount, updates timestamp and resultCount
   * - Creates new: if no match found
   *
   * Automatic Cleanup:
   * - Enforces MAX_RECENT_SEARCHES_PER_USER limit (default: 20)
   * - Deletes oldest entries when limit exceeded
   * - Maintains ordered history by searchedAt
   *
   * @param {number} userId - ID of the user performing the search
   * @param {CreateRecentSearchDto} dto - Search query and result metadata
   * @returns {Promise<RecentSearch>} Created or updated search record
   * @throws {BadRequestException} If query is invalid
   *
   * @example
   * const search = await searchService.saveRecentSearch(123, {
   *   query: 'Damascus Steel',
   *   resultCount: 15
   * });
   */
  async saveRecentSearch(
    userId: number,
    dto: CreateRecentSearchDto,
  ): Promise<RecentSearch> {
    this.logger.log(
      `💾 Saving recent search for user ${userId}: "${dto.query}"`,
    );

    try {
      // Normalize query for consistent deduplication
      const normalizedQuery = dto.query.trim().toLowerCase();

      if (!normalizedQuery) {
        throw new BadRequestException('Search query cannot be empty');
      }

      // Check for existing search entry to avoid duplicates
      const existingSearch = await this.recentSearchRepository.findOne({
        where: {
          userId,
          query: normalizedQuery,
        },
      });

      let savedSearch: RecentSearch;

      if (existingSearch) {
        // Update existing entry: increment count and update timestamp
        this.logger.debug(
          `🔄 Updating existing search entry ${existingSearch.id}`,
        );

        existingSearch.searchCount += 1;
        existingSearch.searchedAt = new Date();
        existingSearch.resultCount = dto.resultCount;

        savedSearch = await this.recentSearchRepository.save(existingSearch);

        this.logger.log(
          `✅ Updated search entry - new count: ${savedSearch.searchCount}`,
        );
      } else {
        // Create new search entry
        this.logger.debug(`➕ Creating new search entry`);

        const newSearch = this.recentSearchRepository.create({
          userId,
          query: normalizedQuery,
          resultCount: dto.resultCount,
          searchCount: 1,
          searchedAt: new Date(),
        });

        savedSearch = await this.recentSearchRepository.save(newSearch);

        this.logger.log(`✅ Created new search entry ${savedSearch.id}`);

        // Enforce maximum recent searches limit per user
        await this.enforceSearchHistoryLimit(userId);
      }

      return savedSearch;
    } catch (error) {
      this.logger.error(
        `❌ Error saving recent search for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a specific recent search entry
   *
   * @description Removes a single search entry from user's history.
   * Verifies ownership before deletion to prevent unauthorized access.
   *
   * Security:
   * - Validates userId matches search entry owner
   * - Returns NotFoundException if not found or unauthorized
   *
   * @param {number} userId - ID of the user requesting deletion
   * @param {number} searchId - ID of the search entry to delete
   * @returns {Promise<void>}
   * @throws {NotFoundException} If search entry not found or user doesn't own it
   *
   * @example
   * await searchService.deleteRecentSearch(123, 456);
   */
  async deleteRecentSearch(userId: number, searchId: number): Promise<void> {
    this.logger.log(
      `🗑️ Deleting search entry ${searchId} for user ${userId}`,
    );

    try {
      // Verify ownership before deletion
      const search = await this.recentSearchRepository.findOne({
        where: { id: searchId, userId },
      });

      if (!search) {
        throw new NotFoundException(
          `Search entry ${searchId} not found or does not belong to user ${userId}`,
        );
      }

      await this.recentSearchRepository.remove(search);

      this.logger.log(`✅ Deleted search entry ${searchId}`);
    } catch (error) {
      this.logger.error(
        `❌ Error deleting search entry ${searchId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Clear all recent searches for a user
   *
   * @description Removes entire search history for a user. Useful for privacy
   * management and user preference controls.
   *
   * Use Cases:
   * - User-initiated history clearing
   * - Privacy compliance (GDPR right to erasure)
   * - Account cleanup operations
   *
   * @param {number} userId - ID of the user whose history to clear
   * @returns {Promise<void>}
   *
   * @example
   * await searchService.clearRecentSearches(123);
   */
  async clearRecentSearches(userId: number): Promise<void> {
    this.logger.log(`🧹 Clearing all recent searches for user ${userId}`);

    try {
      const result = await this.recentSearchRepository.delete({ userId });

      this.logger.log(
        `✅ Cleared ${result.affected || 0} search entries for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error clearing recent searches for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Enforce maximum search history limit per user
   *
   * @description Automatically prunes oldest search entries when user exceeds
   * the configured maximum. Maintains performance and prevents unbounded growth.
   *
   * Pruning Strategy:
   * - Counts total entries for user
   * - If exceeds MAX_RECENT_SEARCHES_PER_USER:
   *   - Orders by searchedAt ASC (oldest first)
   *   - Deletes excess entries beyond limit
   *
   * Performance Considerations:
   * - Only runs when new search is created (not on updates)
   * - Uses efficient query with ORDER BY + LIMIT
   * - Deletes in single operation
   *
   * @private
   * @param {number} userId - ID of the user to check
   * @returns {Promise<void>}
   */
  private async enforceSearchHistoryLimit(userId: number): Promise<void> {
    try {
      // Count total search entries for user
      const totalSearches = await this.recentSearchRepository.count({
        where: { userId },
      });

      if (totalSearches > this.MAX_RECENT_SEARCHES_PER_USER) {
        const excessCount = totalSearches - this.MAX_RECENT_SEARCHES_PER_USER;

        this.logger.debug(
          `🔧 User ${userId} has ${totalSearches} searches, removing ${excessCount} oldest entries`,
        );

        // Get oldest entries to delete
        const oldestSearches = await this.recentSearchRepository.find({
          where: { userId },
          order: { searchedAt: 'ASC' },
          take: excessCount,
        });

        // Delete oldest entries
        await this.recentSearchRepository.remove(oldestSearches);

        this.logger.log(
          `✅ Pruned ${excessCount} old search entries for user ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Error enforcing search history limit for user ${userId}: ${error.message}`,
      );
      // Don't throw - this is a background cleanup operation
    }
  }

}

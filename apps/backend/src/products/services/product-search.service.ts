/**
 * @file product-search.service.ts
 * @description Advanced Product Search and Analytics Service for SouqSyria
 *
 * RESPONSIBILITIES:
 * - Advanced product search with filters and facets
 * - Product analytics and performance metrics
 * - Search optimization for Syrian market
 * - Product recommendations and suggestions
 * - Performance tracking and monitoring
 *
 * FEATURES:
 * - Multi-language search (English/Arabic)
 * - Category-based filtering
 * - Price range filtering
 * - Vendor and brand filtering
 * - Approval status filtering
 * - Performance analytics
 * - Search result optimization
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductEntity } from '../entities/product.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

/**
 * Interface for product search filters
 */
export interface ProductSearchFilters {
  search?: string;
  categoryId?: number;
  vendorId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  approvalStatus?: string[];
  isActive?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  language?: 'en' | 'ar';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Interface for product analytics data
 */
export interface ProductAnalytics {
  totalProducts: number;
  publishedProducts: number;
  pendingApproval: number;
  rejectedProducts: number;
  averagePrice: number;
  topCategories: Array<{
    categoryId: number;
    categoryName: string;
    productCount: number;
  }>;
  topVendors: Array<{
    vendorId: number;
    storeName: string;
    productCount: number;
  }>;
  currencyDistribution: Array<{
    currency: string;
    count: number;
    percentage: number;
  }>;
  approvalTrends: {
    thisWeek: { approved: number; rejected: number; pending: number };
    lastWeek: { approved: number; rejected: number; pending: number };
  };
}

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    private readonly auditLogService: AuditLogService,
  ) {
    this.logger.log('🔍 Product Search Service initialized');
    this.logger.log('🚀 Initializing search optimization features');
  }

  // ============================================================================
  // ADVANCED SEARCH METHODS
  // ============================================================================

  /**
   * ADVANCED PRODUCT SEARCH
   *
   * Performs comprehensive product search with multiple filters and facets.
   * Optimized for Syrian market with bilingual support.
   *
   * @param filters - Search filters and parameters
   * @returns Promise<SearchResult> - Paginated search results with facets
   */
  async searchProducts(filters: ProductSearchFilters) {
    const startTime = Date.now();
    this.logger.log(
      `🔍 Performing product search with filters: ${JSON.stringify(filters)}`,
    );

    try {
      // Build the query with filters
      const queryBuilder = this.buildSearchQuery(filters);

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Apply pagination
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const skip = (page - 1) * limit;

      // Get paginated results
      const products = await queryBuilder.skip(skip).take(limit).getMany();

      // Build facets for filtering
      const facets = await this.buildSearchFacets(filters);

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Search completed: ${products.length} results in ${processingTime}ms`,
      );

      // Log search for analytics
      await this.logSearchEvent(filters, products.length, processingTime);

      return {
        data: products,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        facets,
        meta: {
          searchTime: processingTime,
          totalResults: total,
          query: filters.search || '',
        },
      };
    } catch (error) {
      this.logger.error(`❌ Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * QUICK SEARCH
   *
   * Performs fast product search for autocomplete and quick results.
   *
   * @param query - Search query string
   * @param language - Language preference
   * @param limit - Maximum results to return
   * @returns Promise<ProductEntity[]> - Quick search results
   */
  async quickSearch(
    query: string,
    language: 'en' | 'ar' = 'en',
    limit: number = 10,
  ): Promise<ProductEntity[]> {
    this.logger.log(`⚡ Quick search: "${query}" (${language})`);

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.approvalStatus = :approvalStatus', {
        approvalStatus: 'approved',
      });

    // Add search conditions based on language
    if (language === 'ar') {
      queryBuilder.andWhere(
        '(product.nameAr LIKE :query OR product.nameEn LIKE :query)',
        { query: `%${query}%` },
      );
    } else {
      queryBuilder.andWhere(
        '(product.nameEn LIKE :query OR product.nameAr LIKE :query)',
        { query: `%${query}%` },
      );
    }

    return queryBuilder
      .orderBy('product.isFeatured', 'DESC')
      .addOrderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * GET FEATURED PRODUCTS
   *
   * Retrieves featured products for homepage and promotional displays.
   *
   * @param categoryId - Optional category filter
   * @param limit - Maximum products to return
   * @returns Promise<ProductEntity[]> - Featured products
   */
  async getFeaturedProducts(
    categoryId?: number,
    limit: number = 12,
  ): Promise<ProductEntity[]> {
    this.logger.log(`⭐ Fetching featured products (category: ${categoryId})`);

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.isPublished = :isPublished', { isPublished: true })
      .andWhere('product.approvalStatus = :approvalStatus', {
        approvalStatus: 'approved',
      });

    if (categoryId) {
      queryBuilder.andWhere('product.category.id = :categoryId', {
        categoryId,
      });
    }

    return queryBuilder
      .orderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  // ============================================================================
  // ANALYTICS METHODS
  // ============================================================================

  /**
   * GET PRODUCT ANALYTICS
   *
   * Returns comprehensive product analytics for admin dashboard.
   *
   * @returns Promise<ProductAnalytics> - Detailed analytics data
   */
  async getProductAnalytics(): Promise<ProductAnalytics> {
    this.logger.log('📊 Generating product analytics');

    try {
      const [
        totalProducts,
        publishedProducts,
        pendingApproval,
        rejectedProducts,
        averagePrice,
        topCategories,
        topVendors,
        currencyDistribution,
      ] = await Promise.all([
        this.productRepository.count(),
        this.productRepository.count({
          where: { isPublished: true, approvalStatus: 'approved' },
        }),
        this.productRepository.count({ where: { approvalStatus: 'pending' } }),
        this.productRepository.count({ where: { approvalStatus: 'rejected' } }),
        this.getAveragePrice(),
        this.getTopCategories(),
        this.getTopVendors(),
        this.getCurrencyDistribution(),
      ]);

      // Get approval trends (placeholder - would need date-based queries)
      const approvalTrends = {
        thisWeek: { approved: 0, rejected: 0, pending: 0 },
        lastWeek: { approved: 0, rejected: 0, pending: 0 },
      };

      return {
        totalProducts,
        publishedProducts,
        pendingApproval,
        rejectedProducts,
        averagePrice,
        topCategories,
        topVendors,
        currencyDistribution,
        approvalTrends,
      };
    } catch (error) {
      this.logger.error(`❌ Analytics generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET PRODUCT PERFORMANCE METRICS
   *
   * Returns performance metrics for specific products or categories.
   *
   * @param productIds - Optional array of product IDs
   * @param categoryId - Optional category filter
   * @returns Promise<any> - Performance metrics
   */
  async getProductPerformanceMetrics(
    productIds?: number[],
    categoryId?: number,
  ) {
    this.logger.log('📈 Generating performance metrics');

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor');

    if (productIds && productIds.length > 0) {
      queryBuilder.where('product.id IN (:...productIds)', { productIds });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.category.id = :categoryId', {
        categoryId,
      });
    }

    const products = await queryBuilder.getMany();

    // Calculate performance metrics
    const metrics = {
      totalProducts: products.length,
      averagePrice:
        products.reduce((sum, p) => sum + (p.pricing?.basePrice || 0), 0) /
        products.length,
      publishedRate:
        (products.filter((p) => p.isPublished).length / products.length) * 100,
      approvalRate:
        (products.filter((p) => p.approvalStatus === 'approved').length /
          products.length) *
        100,
      categoryBreakdown: this.groupBy(products, 'category.nameEn'),
      vendorBreakdown: this.groupBy(products, 'vendor.storeName'),
    };

    return metrics;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Build search query with filters
   */
  private buildSearchQuery(
    filters: ProductSearchFilters,
  ): SelectQueryBuilder<ProductEntity> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.pricing', 'pricing')
      .leftJoinAndSelect('product.images', 'images');

    // Search query
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      queryBuilder.andWhere(
        '(product.nameEn LIKE :search OR product.nameAr LIKE :search OR product.sku LIKE :search)',
        { search: searchTerm },
      );
    }

    // Category filter
    if (filters.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    // Vendor filter
    if (filters.vendorId) {
      queryBuilder.andWhere('vendor.id = :vendorId', {
        vendorId: filters.vendorId,
      });
    }

    // Brand filter
    if (filters.brandId) {
      queryBuilder.andWhere('brand.id = :brandId', {
        brandId: filters.brandId,
      });
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      queryBuilder.andWhere('pricing.basePrice >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }
    if (filters.maxPrice !== undefined) {
      queryBuilder.andWhere('pricing.basePrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    // Currency filter
    if (filters.currency) {
      queryBuilder.andWhere('product.currency = :currency', {
        currency: filters.currency,
      });
    }

    // Approval status filter
    if (filters.approvalStatus && filters.approvalStatus.length > 0) {
      queryBuilder.andWhere(
        'product.approvalStatus IN (:...approvalStatuses)',
        {
          approvalStatuses: filters.approvalStatus,
        },
      );
    }

    // Active filter
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    // Published filter
    if (filters.isPublished !== undefined) {
      queryBuilder.andWhere('product.isPublished = :isPublished', {
        isPublished: filters.isPublished,
      });
    }

    // Featured filter
    if (filters.isFeatured !== undefined) {
      queryBuilder.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: filters.isFeatured,
      });
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'name':
        const nameField =
          filters.language === 'ar' ? 'product.nameAr' : 'product.nameEn';
        queryBuilder.orderBy(nameField, sortOrder);
        break;
      case 'price':
        queryBuilder.orderBy('pricing.basePrice', sortOrder);
        break;
      case 'createdAt':
      default:
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
    }

    return queryBuilder;
  }

  /**
   * Build search facets for filtering
   */
  private async buildSearchFacets(filters: ProductSearchFilters) {
    // This would build faceted search results
    // For now, returning empty structure
    return {
      categories: [],
      vendors: [],
      brands: [],
      priceRanges: [],
      currencies: [],
    };
  }

  /**
   * Log search event for analytics
   */
  private async logSearchEvent(
    filters: ProductSearchFilters,
    resultCount: number,
    processingTime: number,
  ) {
    try {
      await this.auditLogService.logSimple({
        action: 'PRODUCT_SEARCH',
        module: 'products',
        actorId: null,
        actorType: 'user',
        entityType: 'product',
        entityId: null,
        description: `Product search: "${filters.search || ''}" returned ${resultCount} results in ${processingTime}ms`,
      });
    } catch (error) {
      this.logger.warn(`Failed to log search event: ${error.message}`);
    }
  }

  /**
   * Get average product price
   */
  private async getAveragePrice(): Promise<number> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.pricing', 'pricing')
      .select('AVG(pricing.basePrice)', 'avgPrice')
      .getRawOne();

    return parseFloat(result?.avgPrice || '0');
  }

  /**
   * Get top categories by product count
   */
  private async getTopCategories() {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.nameEn', 'categoryName')
      .addSelect('COUNT(product.id)', 'productCount')
      .groupBy('category.id')
      .orderBy('productCount', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      categoryId: parseInt(r.categoryId),
      categoryName: r.categoryName,
      productCount: parseInt(r.productCount),
    }));
  }

  /**
   * Get top vendors by product count
   */
  private async getTopVendors() {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.vendor', 'vendor')
      .select('vendor.id', 'vendorId')
      .addSelect('vendor.storeName', 'storeName')
      .addSelect('COUNT(product.id)', 'productCount')
      .where('vendor.id IS NOT NULL')
      .groupBy('vendor.id')
      .orderBy('productCount', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      vendorId: parseInt(r.vendorId),
      storeName: r.storeName,
      productCount: parseInt(r.productCount),
    }));
  }

  /**
   * Get currency distribution
   */
  private async getCurrencyDistribution() {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .select('product.currency', 'currency')
      .addSelect('COUNT(product.id)', 'count')
      .groupBy('product.currency')
      .getRawMany();

    const total = result.reduce((sum, r) => sum + parseInt(r.count), 0);

    return result.map((r) => ({
      currency: r.currency,
      count: parseInt(r.count),
      percentage: (parseInt(r.count) / total) * 100,
    }));
  }

  /**
   * Utility method to group array by property
   */
  private groupBy(array: any[], property: string) {
    return array.reduce((groups, item) => {
      const key = this.getNestedProperty(item, property) || 'Unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  /**
   * Get nested property value
   */
  private getNestedProperty(obj: any, path: string) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * @file products-admin-search.controller.ts
 * @description Admin Controller for Product Search and Analytics
 *
 * RESPONSIBILITIES:
 * - Advanced product search with admin filters
 * - Product analytics and reporting
 * - Performance metrics and insights
 * - Search optimization and monitoring
 * - Syrian market analytics
 *
 * ENDPOINTS:
 * - GET /admin/products/search - Advanced product search
 * - GET /admin/products/quick-search - Quick search for autocomplete
 * - GET /admin/products/analytics - Product analytics dashboard
 * - GET /admin/products/performance - Performance metrics
 * - GET /admin/products/featured - Manage featured products
 *
 * @author SouqSyria Development Team
 * @since 2025-08-08
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import {
  ProductSearchService,
  ProductSearchFilters,
} from '../services/product-search.service';

@ApiTags('🔍 Admin Products - Search & Analytics')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('admin/products')
export class ProductsAdminSearchController {
  private readonly logger = new Logger(ProductsAdminSearchController.name);

  constructor(private readonly productSearchService: ProductSearchService) {}

  /**
   * ADVANCED PRODUCT SEARCH
   *
   * Comprehensive product search with multiple filters, facets, and sorting options.
   * Optimized for admin interface with full access to all product statuses.
   */
  @Get('search')
  @ApiOperation({
    summary: 'Advanced product search with filters',
    description:
      'Comprehensive product search with multiple filters, facets, and Syrian market optimization',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for product name or SKU',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: 'number',
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    type: 'number',
    description: 'Filter by vendor ID',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    type: 'number',
    description: 'Filter by brand ID',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: 'number',
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: 'number',
    description: 'Maximum price filter',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['SYP', 'USD', 'EUR', 'TRY'],
    description: 'Currency filter',
  })
  @ApiQuery({
    name: 'approvalStatus',
    required: false,
    description: 'Approval status filter (comma-separated)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: 'boolean',
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'isPublished',
    required: false,
    type: 'boolean',
    description: 'Filter by published status',
  })
  @ApiQuery({
    name: 'isFeatured',
    required: false,
    type: 'boolean',
    description: 'Filter by featured status',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Language preference for sorting',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Items per page (max: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'price', 'createdAt'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with pagination and facets',
    schema: {
      example: {
        data: [
          {
            id: 123,
            nameEn: 'iPhone 14 Pro',
            nameAr: 'آيفون 14 برو',
            sku: 'IPH14PRO001',
            approvalStatus: 'approved',
            isActive: true,
            isPublished: true,
            isFeatured: false,
            currency: 'SYP',
            category: {
              id: 1,
              nameEn: 'Smartphones',
              nameAr: 'الهواتف الذكية',
            },
            vendor: {
              id: 1,
              storeName: 'TechStore Syria',
            },
            pricing: {
              basePrice: 2500000,
              salePrice: 2300000,
            },
          },
        ],
        pagination: {
          total: 150,
          page: 1,
          limit: 20,
          totalPages: 8,
          hasNext: true,
          hasPrev: false,
        },
        facets: {
          categories: [
            { id: 1, name: 'Smartphones', count: 45 },
            { id: 2, name: 'Laptops', count: 32 },
          ],
          vendors: [
            { id: 1, name: 'TechStore Syria', count: 23 },
            { id: 2, name: 'Electronics Hub', count: 18 },
          ],
          currencies: [
            { currency: 'SYP', count: 120 },
            { currency: 'USD', count: 30 },
          ],
        },
        meta: {
          searchTime: 45,
          totalResults: 150,
          query: 'iPhone',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to search products',
  })
  async searchProducts(
    @Query() query: any,
    @CurrentUser() user: UserFromToken,
  ) {
    this.logger.log(`🔍 Admin ${user.id} performing advanced product search`);

    // Transform query parameters to filters
    const filters: ProductSearchFilters = {
      search: query.search,
      categoryId: query.categoryId ? parseInt(query.categoryId) : undefined,
      vendorId: query.vendorId ? parseInt(query.vendorId) : undefined,
      brandId: query.brandId ? parseInt(query.brandId) : undefined,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      currency: query.currency,
      approvalStatus: query.approvalStatus
        ? query.approvalStatus.split(',')
        : undefined,
      isActive:
        query.isActive === 'true'
          ? true
          : query.isActive === 'false'
            ? false
            : undefined,
      isPublished:
        query.isPublished === 'true'
          ? true
          : query.isPublished === 'false'
            ? false
            : undefined,
      isFeatured:
        query.isFeatured === 'true'
          ? true
          : query.isFeatured === 'false'
            ? false
            : undefined,
      language: query.language === 'ar' ? 'ar' : 'en',
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder === 'ASC' ? 'ASC' : 'DESC',
    };

    return await this.productSearchService.searchProducts(filters);
  }

  /**
   * QUICK PRODUCT SEARCH
   *
   * Fast product search for autocomplete and quick admin lookups.
   * Optimized for real-time suggestions and instant results.
   */
  @Get('quick-search')
  @ApiOperation({
    summary: 'Quick product search for autocomplete',
    description:
      'Fast product search optimized for autocomplete and instant admin lookups',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Language preference',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum results (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Quick search results',
    schema: {
      example: {
        results: [
          {
            id: 123,
            nameEn: 'iPhone 14 Pro',
            nameAr: 'آيفون 14 برو',
            sku: 'IPH14PRO001',
            approvalStatus: 'approved',
            category: { nameEn: 'Smartphones' },
            vendor: { storeName: 'TechStore Syria' },
          },
        ],
        query: 'iPhone',
        resultCount: 1,
        searchTime: 15,
      },
    },
  })
  async quickSearch(
    @Query('q') searchQuery: string,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('limit', ParseIntPipe) limit: number = 10,
    @CurrentUser() user: UserFromToken,
  ) {
    this.logger.log(
      `⚡ Admin ${user.id} quick search: "${searchQuery}" (${language})`,
    );

    const startTime = Date.now();
    const results = await this.productSearchService.quickSearch(
      searchQuery,
      language,
      Math.min(limit, 50), // Cap at 50 for quick search
    );
    const searchTime = Date.now() - startTime;

    return {
      results,
      query: searchQuery,
      resultCount: results.length,
      searchTime,
    };
  }

  /**
   * PRODUCT ANALYTICS
   *
   * Comprehensive product analytics and insights for admin dashboard.
   * Includes Syrian market specific metrics and trends.
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get comprehensive product analytics',
    description:
      'Detailed product analytics with Syrian market insights and performance metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Product analytics data',
    schema: {
      example: {
        overview: {
          totalProducts: 1250,
          publishedProducts: 980,
          pendingApproval: 45,
          rejectedProducts: 12,
          averagePrice: 125000,
        },
        categories: {
          topCategories: [
            { categoryId: 1, categoryName: 'Smartphones', productCount: 245 },
            { categoryId: 2, categoryName: 'Laptops', productCount: 189 },
            { categoryId: 3, categoryName: 'Tablets', productCount: 156 },
          ],
        },
        vendors: {
          topVendors: [
            { vendorId: 1, storeName: 'TechStore Syria', productCount: 123 },
            { vendorId: 2, storeName: 'Electronics Hub', productCount: 98 },
            { vendorId: 3, storeName: 'Digital World', productCount: 87 },
          ],
        },
        market: {
          currencyDistribution: [
            { currency: 'SYP', count: 1000, percentage: 80 },
            { currency: 'USD', count: 200, percentage: 16 },
            { currency: 'EUR', count: 50, percentage: 4 },
          ],
        },
        trends: {
          approvalTrends: {
            thisWeek: { approved: 25, rejected: 2, pending: 8 },
            lastWeek: { approved: 32, rejected: 1, pending: 6 },
          },
        },
        timestamp: '2025-08-08T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions to view analytics',
  })
  async getProductAnalytics(@CurrentUser() user: UserFromToken) {
    this.logger.log(`📊 Admin ${user.id} requesting product analytics`);

    const analytics = await this.productSearchService.getProductAnalytics();

    return {
      overview: {
        totalProducts: analytics.totalProducts,
        publishedProducts: analytics.publishedProducts,
        pendingApproval: analytics.pendingApproval,
        rejectedProducts: analytics.rejectedProducts,
        averagePrice: analytics.averagePrice,
      },
      categories: {
        topCategories: analytics.topCategories,
      },
      vendors: {
        topVendors: analytics.topVendors,
      },
      market: {
        currencyDistribution: analytics.currencyDistribution,
      },
      trends: {
        approvalTrends: analytics.approvalTrends,
      },
      timestamp: new Date(),
    };
  }

  /**
   * PRODUCT PERFORMANCE METRICS
   *
   * Detailed performance metrics for specific products or categories.
   * Useful for optimization and business intelligence.
   */
  @Get('performance')
  @ApiOperation({
    summary: 'Get product performance metrics',
    description:
      'Detailed performance metrics for products and categories with business insights',
  })
  @ApiQuery({
    name: 'productIds',
    required: false,
    description: 'Comma-separated product IDs',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: 'number',
    description: 'Category ID for metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Product performance metrics',
    schema: {
      example: {
        metrics: {
          totalProducts: 50,
          averagePrice: 150000,
          publishedRate: 85.5,
          approvalRate: 92.3,
          categoryBreakdown: {
            Smartphones: 25,
            Accessories: 15,
            Cases: 10,
          },
          vendorBreakdown: {
            'TechStore Syria': 20,
            'Electronics Hub': 15,
            'Digital World': 15,
          },
        },
        insights: [
          'High approval rate indicates good product quality',
          'Smartphone category dominates the selection',
          'Price distribution is healthy for Syrian market',
        ],
        recommendations: [
          'Consider featuring more products in low-performing categories',
          'Monitor pricing strategy for competitive advantage',
        ],
      },
    },
  })
  async getPerformanceMetrics(
    @CurrentUser() user: UserFromToken,
    @Query('productIds') productIdsStr?: string,
    @Query('categoryId') categoryId?: number,
  ) {
    this.logger.log(`📈 Admin ${user.id} requesting performance metrics`);

    const productIds = productIdsStr
      ? productIdsStr
          .split(',')
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id))
      : undefined;

    const parsedCategoryId = categoryId
      ? parseInt(categoryId.toString())
      : undefined;

    const metrics =
      await this.productSearchService.getProductPerformanceMetrics(
        productIds,
        parsedCategoryId,
      );

    // Generate insights and recommendations
    const insights = this.generateInsights(metrics);
    const recommendations = this.generateRecommendations(metrics);

    return {
      metrics,
      insights,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * GET FEATURED PRODUCTS
   *
   * Retrieves and manages featured products for promotional displays.
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Get featured products management',
    description:
      'Retrieve featured products with management capabilities for admin interface',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: 'number',
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum products to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured products with management data',
    schema: {
      example: {
        featured: [
          {
            id: 123,
            nameEn: 'iPhone 14 Pro',
            nameAr: 'آيفون 14 برو',
            isFeatured: true,
            featuredSince: '2025-08-01T00:00:00.000Z',
            category: { nameEn: 'Smartphones' },
            vendor: { storeName: 'TechStore Syria' },
            metrics: {
              views: 1250,
              clicks: 89,
              conversions: 12,
            },
          },
        ],
        summary: {
          totalFeatured: 12,
          maxFeatured: 20,
          performance: {
            averageViews: 850,
            averageClicks: 65,
            averageConversions: 8,
          },
        },
      },
    },
  })
  async getFeaturedProducts(
    @CurrentUser() user: UserFromToken,
    @Query('categoryId') categoryId?: number,
    @Query('limit') limit: number = 20,
  ) {
    this.logger.log(`⭐ Admin ${user.id} managing featured products`);

    const parsedCategoryId = categoryId
      ? parseInt(categoryId.toString())
      : undefined;
    const parsedLimit = limit ? parseInt(limit.toString()) : 20;

    const featuredProducts =
      await this.productSearchService.getFeaturedProducts(
        parsedCategoryId,
        Math.min(parsedLimit, 50),
      );

    return {
      featured: featuredProducts,
      summary: {
        totalFeatured: featuredProducts.length,
        maxFeatured: 20, // Business rule: max 20 featured products
        performance: {
          // TODO: Implement actual metrics from analytics
          averageViews: 0,
          averageClicks: 0,
          averageConversions: 0,
        },
      },
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate business insights from metrics
   */
  private generateInsights(metrics: any): string[] {
    const insights: string[] = [];

    if (metrics.approvalRate > 90) {
      insights.push('High approval rate indicates excellent product quality');
    } else if (metrics.approvalRate < 70) {
      insights.push('Low approval rate suggests quality issues need attention');
    }

    if (metrics.publishedRate > 80) {
      insights.push('Most products are successfully published');
    } else if (metrics.publishedRate < 60) {
      insights.push(
        'Many products remain unpublished - investigate bottlenecks',
      );
    }

    if (metrics.averagePrice > 200000) {
      insights.push('Premium pricing strategy for Syrian market');
    } else if (metrics.averagePrice < 50000) {
      insights.push('Budget-friendly pricing approach');
    }

    return insights;
  }

  /**
   * Generate business recommendations from metrics
   */
  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.approvalRate < 80) {
      recommendations.push(
        'Implement quality guidelines for vendors to improve approval rates',
      );
    }

    if (metrics.publishedRate < 70) {
      recommendations.push('Review publishing workflow to reduce bottlenecks');
    }

    const topCategory = Object.keys(metrics.categoryBreakdown)[0];
    if (topCategory) {
      recommendations.push(
        `Consider expanding ${topCategory} category based on strong performance`,
      );
    }

    recommendations.push('Monitor competitor pricing for market positioning');
    recommendations.push(
      'Implement featured product rotation for better exposure',
    );

    return recommendations;
  }
}

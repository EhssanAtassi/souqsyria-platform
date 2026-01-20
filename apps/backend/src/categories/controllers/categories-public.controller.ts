/**
 * @file categories-public.controller.ts
 * @description Public Categories Controller for Customer-Facing APIs
 *
 * RESPONSIBILITIES:
 * - Serve active and approved categories to customers
 * - Provide navigation trees for frontend menus
 * - Handle public search and autocomplete
 * - Support Arabic/English localization
 * - Optimize for Syrian internet speeds
 * - Mobile-first response optimization
 *
 * FEATURES:
 * - No authentication required
 * - Only public categories (active + approved)
 * - Caching headers for performance
 * - Syrian market optimizations (Arabic slugs, RTL)
 * - Local vs diaspora user detection
 * - SEO-optimized responses
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 * @version 1.0.0
 */

import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { IsNull } from 'typeorm';

// Import Services
import { CategorySearchService } from '../services/category-search.service';
import { CategoryHierarchyService } from '../services/category-hierarchy.service';
import { CategoriesService } from '../services/categories.service';
import { PublicProductsService } from '../../products/public/service/public-products.service';

// Import DTOs and Types
import { CategoryQueryDto } from '../dto/index-dto';

/**
 * PUBLIC CATEGORIES CONTROLLER
 *
 * Customer-facing API endpoints for category browsing, search, and navigation.
 * All endpoints are public (no authentication) and serve only active, approved categories.
 *
 * Route Pattern: /api/categories/*
 * Authentication: None required
 * Rate Limiting: Applied for DDoS protection
 * Caching: Aggressive caching for performance
 */
@ApiTags('Public Categories')
@Controller('categories')
export class CategoriesPublicController {
  private readonly logger = new Logger(CategoriesPublicController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categorySearchService: CategorySearchService,
    private readonly categoryHierarchyService: CategoryHierarchyService,
    private readonly publicProductsService: PublicProductsService,
  ) {
    this.logger.log('🌐 Public Categories Controller initialized');
  }

  // ============================================================================
  // CORE PUBLIC ENDPOINTS
  // ============================================================================

  /**
   * GET ACTIVE CATEGORIES WITH PAGINATION
   *
   * Returns paginated list of active, approved categories for customer browsing.
   * Optimized for mobile and slow Syrian internet connections.
   *
   * Features:
   * - Only active + approved categories
   * - Lightweight response (no admin fields)
   * - Pagination for performance
   * - Language preference support
   * - Mobile-optimized data structure
   * - Caching headers for 5 minutes
   */
  @Get()
  @ApiOperation({
    summary: 'Get active categories with pagination',
    description: `
      Retrieve paginated list of active, approved categories for customer browsing.
      
      Features:
      • Mobile-optimized responses
      • Arabic/English localization support
      • Caching for improved performance
      • Only public categories (active + approved)
      • Optimized for Syrian internet speeds
      
      Use Cases:
      • Category listing pages
      • Mobile app category browsing
      • Homepage category sections
      • Product filtering interfaces
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    example: 1,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 20,
    description: 'Items per page (max: 50, default: 20)',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Response language preference',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: 'boolean',
    example: false,
    description: 'Filter for featured categories only',
  })
  @ApiQuery({
    name: 'parent',
    required: false,
    type: 'number',
    description: 'Filter by parent category ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    headers: {
      'Cache-Control': {
        description: 'Caching directive for performance',
        schema: { type: 'string', example: 'public, max-age=300' },
      },
      'Content-Language': {
        description: 'Response language',
        schema: { type: 'string', example: 'en' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getActiveCategories(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('featured') featured: boolean = false,
    @Req() request: Request,
    @Res() response: Response,
    @Query('parent') parentId?: number,
  ) {
    const startTime = Date.now();
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || 'unknown';

    this.logger.log(
      `📱 Public categories request: page=${page}, limit=${limit}, lang=${language}, IP=${clientIP}`,
    );

    try {
      // 1. Validate and sanitize input parameters
      const sanitizedParams = this.validatePublicQueryParams({
        page,
        limit,
        language,
        featured,
        parentId,
      });

      // 2. Detect user context (Syrian local vs diaspora)
      const userContext = this.detectUserContext(request);

      // 3. Build query for public categories only
      const queryDto: CategoryQueryDto = {
        page: sanitizedParams.page,
        limit: sanitizedParams.limit,
        language: sanitizedParams.language,
        isActive: true,
        approvalStatus: 'approved' as any,
        isFeatured: sanitizedParams.featured ? true : undefined,
        parentId: sanitizedParams.parentId,
        showInNav: true,
        includeDeleted: false,
        includeHierarchy: true,
      };

      // 4. Execute search with public-only results
      const result =
        await this.categorySearchService.searchCategories(queryDto);

      // 5. Transform to public response format
      const publicResponse = this.transformToPublicResponse(
        result,
        sanitizedParams.language,
        userContext,
      );

      // 6. Set performance headers
      this.setPerformanceHeaders(response, sanitizedParams.language);

      // 7. Log successful request
      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Public categories served: ${publicResponse.data.length}/${publicResponse.total} items (${processingTime}ms)`,
      );

      // 8. Return response with proper status
      return response.status(HttpStatus.OK).json({
        success: true,
        data: publicResponse.data,
        pagination: {
          page: publicResponse.page,
          limit: publicResponse.limit,
          total: publicResponse.total,
          totalPages: publicResponse.totalPages,
          hasNext: publicResponse.hasNext,
          hasPrev: publicResponse.hasPrev,
        },
        meta: {
          language: sanitizedParams.language,
          userContext: userContext.type,
          processingTime,
          cached: false, // Will be true when caching is implemented
        },
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Public categories failed: ${error.message} (${processingTime}ms)`,
        {
          error: error.message,
          stack: error.stack,
          clientIP,
          userAgent,
          params: { page, limit, language, featured, parentId },
        },
      );

      // Return error response without throwing
      if (error instanceof BadRequestException) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid request parameters',
          message: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve categories. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * SEARCH CATEGORIES
   *
   * Full-text search across category names and descriptions
   * Supports Arabic and English search with relevance sorting
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search categories by name and description',
    description: `
      Performs full-text search across category names and descriptions.
      
      Features:
      • Arabic and English search support
      • Relevance-based sorting (name matches first)
      • Fuzzy matching for typos
      • Parent-child relationship aware
      • Mobile-optimized results
      
      Use Cases:
      • Category autocomplete in search boxes
      • Admin category management
      • Navigation tree building
      • Product filtering interfaces
    `,
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: 'string',
    example: 'electronics',
    description: 'Search query string (minimum 2 characters)',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Response language preference',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 10,
    description: 'Maximum number of results (max: 50)',
  })
  @ApiQuery({
    name: 'parentId',
    required: false,
    type: 'number',
    description: 'Search within specific parent category',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories search results retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 5,
            name: 'Electronics',
            slug: 'electronics',
            description: 'Consumer electronics and gadgets',
            iconUrl: 'https://example.com/icons/electronics.svg',
            productCount: 1250,
            hasChildren: true,
            parent: null,
            relevanceScore: 1.0,
          },
          {
            id: 12,
            name: 'Electronic Accessories',
            slug: 'electronic-accessories',
            description: 'Cables, chargers, and electronic accessories',
            iconUrl: 'https://example.com/icons/accessories.svg',
            productCount: 340,
            hasChildren: false,
            parent: {
              id: 5,
              name: 'Electronics',
              slug: 'electronics',
            },
            relevanceScore: 0.8,
          },
        ],
        meta: {
          searchQuery: 'electronics',
          total: 2,
          limit: 10,
          language: 'en',
          processingTime: 45,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
    schema: {
      example: {
        success: false,
        error: 'Invalid request parameters',
        message: 'Search query must be at least 2 characters long',
        statusCode: 400,
      },
    },
  })
  async searchCategories(
    @Query('q') searchQuery: string,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('limit') limit: number = 10,
    @Req() request: Request,
    @Res() response: Response,
    @Query('parentId') parentId?: number,
  ) {
    const startTime = Date.now();

    this.logger.log(
      `🔍 Category search request: query="${searchQuery}", lang=${language}, limit=${limit}`,
    );

    try {
      // 1. Validate search query
      if (!searchQuery || searchQuery.trim().length < 2) {
        throw new BadRequestException(
          'Search query must be at least 2 characters long',
        );
      }

      // 2. Sanitize parameters
      const sanitizedLimit = Math.min(Math.max(1, limit || 10), 50);
      const sanitizedLanguage = ['en', 'ar'].includes(language)
        ? language
        : 'en';

      // 3. Build search query
      const queryDto: CategoryQueryDto = {
        page: 1,
        limit: sanitizedLimit,
        language: sanitizedLanguage,
        isActive: true,
        approvalStatus: 'approved' as any,
        search: searchQuery.trim(),
        parentId: parentId,
        includeDeleted: false,
        includeHierarchy: true,
      };

      // 4. Execute search
      const searchResults =
        await this.categorySearchService.searchCategories(queryDto);

      // 5. Transform results with relevance scoring
      const searchData = searchResults.data.map((category, index) => {
        // Simple relevance scoring (name matches score higher than description matches)
        const nameMatch =
          category.displayName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) || false;
        const descMatch =
          category.displayDescription
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) || false;

        let relevanceScore = 0.5; // Base score
        if (nameMatch) relevanceScore += 0.5;
        if (descMatch) relevanceScore += 0.2;
        if (index < 3) relevanceScore += 0.1; // Boost first few results

        return {
          id: category.id,
          name: category.displayName,
          slug: category.slug,
          description: category.displayDescription,
          iconUrl: category.iconUrl,
          bannerUrl: category.bannerUrl,
          productCount: category.productCount || 0,
          hasChildren: category.hasChildren || false,
          parent: category.parent
            ? {
                id: category.parent.id,
                name: category.parent.name,
                slug: category.parent.slug,
              }
            : null,
          relevanceScore: Math.round(relevanceScore * 10) / 10,
        };
      });

      // 6. Sort by relevance score (highest first)
      searchData.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Category search completed: ${searchData.length} results found (${processingTime}ms)`,
      );

      // 7. Return search results
      return response.status(HttpStatus.OK).json({
        success: true,
        data: searchData,
        meta: {
          searchQuery: searchQuery.trim(),
          total: searchResults.total,
          limit: sanitizedLimit,
          language: sanitizedLanguage,
          processingTime,
        },
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Category search failed: ${error.message} (${processingTime}ms)`,
        {
          error: error.message,
          searchQuery,
          language,
          limit,
          parentId,
        },
      );

      if (error instanceof BadRequestException) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Invalid request parameters',
          message: error.message,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to search categories. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * GET FEATURED CATEGORIES FOR HOMEPAGE
   *
   * Returns featured categories optimized for homepage display.
   * Heavily cached and optimized for quick loading.
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Get featured categories for homepage',
    description: `
      Retrieve featured categories optimized for homepage display.
      
      Features:
      • Heavily cached for performance
      • Mobile-first data structure
      • Arabic/English support
      • Optimized image URLs
      • Click tracking ready
      
      Use Cases:
      • Homepage category carousel
      • Mobile app featured section
      • Landing page highlights
    `,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Response language preference',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 8,
    description: 'Maximum number of featured categories (max: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured categories retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name_en: 'Damascus Steel',
            name_ar: 'الفولاذ الدمشقي',
            slug: 'damascus-steel',
            description_en: 'Authentic Damascus steel knives and blades',
            description_ar: 'سكاكين وشفرات من الفولاذ الدمشقي',
            icon_url: 'hardware',
            theme_color: '#059669',
            featured_image_url:
              'https://images.unsplash.com/photo-1589698423558-7537249a5144?w=300&h=200&fit=crop&q=80',
            featured_discount: '15%',
            is_featured: true,
            featured_priority: 10,
            is_active: true,
            product_count: 5,
          },
        ],
        meta: {
          total: 4,
          limit: 4,
        },
      },
    },
    headers: {
      'Cache-Control': {
        description: 'Long cache for featured content',
        schema: { type: 'string', example: 'public, max-age=900' },
      },
    },
  })
  async getFeaturedCategories(
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('limit') limit: number = 8,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const startTime = Date.now();

    this.logger.log(
      `⭐ Featured categories request: lang=${language}, limit=${limit}`,
    );

    try {
      // 1. Validate parameters
      const sanitizedLimit = Math.min(Math.max(1, limit || 8), 20);
      const sanitizedLanguage = ['en', 'ar'].includes(language)
        ? language
        : 'en';

      // 2. Query featured categories using simple direct query
      const categories = await this.categoriesService.getFeaturedCategories(
        sanitizedLimit,
      );

      // 3. Transform to featured response format (snake_case, both languages)
      const featuredResponse = categories.map((category) => ({
        id: category.id,
        name_en: category.nameEn,
        name_ar: category.nameAr,
        slug: category.slug,
        description_en: category.descriptionEn || '',
        description_ar: category.descriptionAr || '',
        icon_url: category.iconUrl,
        theme_color: category.themeColor,
        featured_image_url: category.featuredImageUrl || category.bannerUrl,
        featured_discount: category.featuredDiscount,
        is_featured: category.isFeatured,
        featured_priority: category.featuredPriority,
        is_active: category.isActive,
        product_count: category.productCount,
      }));

      // 4. Set long cache headers for featured content
      response.set({
        'Cache-Control': 'public, max-age=900', // 15 minutes
        'Content-Language': sanitizedLanguage,
        'X-Content-Type-Options': 'nosniff',
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Featured categories served: ${featuredResponse.length} items (${processingTime}ms)`,
      );

      return response.status(HttpStatus.OK).json({
        data: featuredResponse,
        meta: {
          total: featuredResponse.length,
          limit: sanitizedLimit,
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Featured categories failed: ${error.message}`,
        error.stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve featured categories',
        message: error.message || 'Please try again later',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * GET HOMEPAGE SECTIONS
   *
   * Returns complete homepage structure for Figma design:
   * Each section contains:
   * - Parent category info
   * - One featured product for that category
   * - Child categories with product counts
   */
  @Get('homepage-sections')
  @ApiOperation({
    summary: 'Get homepage sections with featured products and categories',
    description: `
      Retrieve complete homepage structure matching Figma design.

      Each section includes:
      • Parent category information
      • One featured product for that category (with image, pricing)
      • List of child categories with product counts

      Use Cases:
      • Homepage hero sections (Consumer Electronics, Clothing, Home & Garden)
      • Category-based product showcases
      • Mobile app homepage structure
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 3,
    description: 'Number of sections to return (default: 3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Homepage sections retrieved successfully',
    schema: {
      example: {
        data: [
          {
            section_id: 1,
            section_name_en: 'Consumer Electronics',
            section_name_ar: 'الإلكترونيات الاستهلاكية',
            section_slug: 'consumer-electronics',
            featured_product: {
              id: 1,
              name_en: 'Marshall Speaker',
              name_ar: 'سماعة مارشال',
              slug: 'marshall-speaker',
              image_url:
                'https://images.unsplash.com/photo-1589698423558-7537249a5144',
              base_price: 625.0,
              discount_price: 205.0,
              discount_percentage: 67,
              currency: 'SYP',
              promotional_text: 'EXPERIENCE GREAT SOUND WITH MARSHALL SPEAKER',
              featured_badge: 'Best Seller',
            },
            child_categories: [
              {
                id: 10,
                name_en: 'Audios & Theaters',
                name_ar: 'الصوتيات والمسارح',
                slug: 'audios-theaters',
                image_url:
                  'https://images.unsplash.com/photo-1589698423558',
                product_count: 2,
              },
            ],
          },
        ],
        meta: {
          total: 3,
        },
      },
    },
  })
  async getHomepageSections(
    @Query('limit') limit: number = 3,
    @Res() response: Response,
  ) {
    const startTime = Date.now();
    this.logger.log(`🏠 Homepage sections request (limit: ${limit})`);

    try {
      const sanitizedLimit = Math.min(Math.max(1, limit || 3), 10);

      // Step 1: Get parent categories (top-level categories)
      const parentCategories = await this.categoriesService.find({
        where: {
          parent: IsNull(), // Top-level categories have no parent
          isActive: true,
          approvalStatus: 'approved' as any,
        },
        order: {
          sortOrder: 'ASC',
        },
        take: sanitizedLimit,
      });

      // Step 2: For each parent, get featured product and child categories
      const sections = await Promise.all(
        parentCategories.map(async (parent) => {
          // Get one featured product for this category
          const productsResponse = await this.publicProductsService.getFeaturedProducts(
            1,
            undefined,
            parent.id,
            'featured',
          );
          const featuredProduct = productsResponse.data[0] || null;

          // Get child categories
          const children = await this.categoriesService.find({
            where: {
              parent: { id: parent.id }, // Children of this parent category
              isActive: true,
              approvalStatus: 'approved' as any,
            },
            order: {
              sortOrder: 'ASC',
            },
            take: 8,
          });

          return {
            section_id: parent.id,
            section_name_en: parent.nameEn,
            section_name_ar: parent.nameAr,
            section_slug: parent.slug,
            featured_product: featuredProduct,
            child_categories: children.map((child) => ({
              id: child.id,
              name_en: child.nameEn,
              name_ar: child.nameAr,
              slug: child.slug,
              image_url: child.iconUrl || child.bannerUrl,
              product_count: child.productCount,
            })),
          };
        }),
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Homepage sections served: ${sections.length} sections (${processingTime}ms)`,
      );

      return response.status(HttpStatus.OK).json({
        data: sections,
        meta: {
          total: sections.length,
        },
      });
    } catch (error) {
      this.logger.error(
        `❌ Homepage sections failed: ${error.message}`,
        error.stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve homepage sections',
        message: error.message || 'Please try again later',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * VALIDATE PUBLIC QUERY PARAMETERS
   */
  private validatePublicQueryParams(params: any): any {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(params.limit) || 20), 50); // Max 50 for public
    const language = ['en', 'ar'].includes(params.language)
      ? params.language
      : 'en';
    const featured = params.featured === true || params.featured === 'true';
    const parentId = params.parentId ? parseInt(params.parentId) : undefined;

    return { page, limit, language, featured, parentId };
  }

  /**
   * DETECT USER CONTEXT (Syrian local vs diaspora)
   */
  private detectUserContext(request: Request): {
    type: 'local' | 'diaspora';
    country?: string;
  } {
    // Check IP for Syrian ranges (simplified - in production use proper GeoIP)
    const clientIP = this.getClientIP(request);

    // Accept-Language header analysis
    const acceptLanguage = request.headers['accept-language'] || '';
    const prefersArabic = acceptLanguage.includes('ar');

    // Simple heuristic - in production, use proper GeoIP service
    const isSyrianIP = clientIP.startsWith('192.168.') || prefersArabic; // Placeholder logic

    return {
      type: isSyrianIP ? 'local' : 'diaspora',
      country: isSyrianIP ? 'Syria' : 'Unknown',
    };
  }

  /**
   * GET CLIENT IP ADDRESS
   */
  private getClientIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * SET PERFORMANCE HEADERS
   */
  private setPerformanceHeaders(response: Response, language: string): void {
    response.set({
      'Cache-Control': 'public, max-age=300', // 5-minute cache
      'Content-Language': language,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Robots-Tag': 'index, follow',
    });
  }

  /**
   * TRANSFORM TO PUBLIC RESPONSE FORMAT
   */
  private transformToPublicResponse(
    result: any,
    language: string,
    userContext: any,
  ): any {
    // Remove admin-only fields and optimize for public consumption
    const publicData = result.data.map((category) => ({
      id: category.id,
      name: category.displayName,
      slug: category.slug,
      description: category.displayDescription,
      iconUrl: category.iconUrl,
      bannerUrl: category.bannerUrl,
      themeColor: category.themeColor,
      url: category.url,
      productCount: category.productCount,
      isActive: category.isActive,
      hasChildren: category.hasChildren,
      parent: category.parent
        ? {
            id: category.parent.id,
            name: category.parent.name,
            slug: category.parent.slug,
          }
        : null,
      children:
        category.children?.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
          productCount: child.productCount,
        })) || [],
    }));

    return {
      ...result,
      data: publicData,
    };
  }
}

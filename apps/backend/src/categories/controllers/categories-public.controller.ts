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
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { IsNull, Repository } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

// Import Services
import { CategorySearchService } from '../services/category-search.service';
import { CategoryHierarchyService } from '../services/category-hierarchy.service';
import { CategoriesService } from '../services/categories.service';
import { PublicProductsService } from '../../products/public/service/public-products.service';

// Import DTOs and Types
import {
  CategoryQueryDto,
  ApprovalStatus,
  GetCategoriesTreeResponseDto,
  CategoryTreeRootDto,
  CategoryTreeChildDto,
  CategoryTreeGrandchildDto,
  PaginatedCategoriesResponseDto,
  SearchWithinCategoryDto,
} from '../dto/index-dto';

// Import Entities
import { Category } from '../entities/category.entity';

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
@Public()
@Controller('categories')
export class CategoriesPublicController {
  private readonly logger = new Logger(CategoriesPublicController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categorySearchService: CategorySearchService,
    private readonly categoryHierarchyService: CategoryHierarchyService,
    private readonly publicProductsService: PublicProductsService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
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
        approvalStatus: ApprovalStatus.APPROVED,
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
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Public categories failed: ${(error as Error).message} (${processingTime}ms)`,
        {
          error: (error as Error).message,
          stack: (error as Error).stack,
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
          message: (error as Error).message,
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
   * GET CATEGORY TREE FOR MEGA MENU
   *
   * Returns complete 3-level category hierarchy optimized for frontend mega menus.
   * Structure: Root > Children > Grandchildren
   *
   * Features:
   * - Only active and approved categories
   * - 3 levels deep (Parent > Child > Grandchild)
   * - Sorted by sortOrder ASC
   * - Lightweight response for fast navigation
   * - Cached for optimal performance
   */
  @Get('tree')
  @ApiOperation({
    summary: 'Get complete category tree for mega menu (3 levels)',
    description: `
      Retrieve the full category hierarchy optimized for mega menu navigation.

      Features:
      • 3-level hierarchy: Parent > Child > Grandchild
      • Only active and approved categories
      • Sorted by sort order
      • Bilingual support (Arabic/English)
      • Heavily cached for performance

      Use Cases:
      • Main navigation mega menus
      • Mobile app category browsers
      • Category selection dropdowns
      • Sitemap generation
    `,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Response language preference (default: en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
    type: GetCategoriesTreeResponseDto,
    headers: {
      'Cache-Control': {
        description: 'Long cache for tree structure',
        schema: { type: 'string', example: 'public, max-age=1800' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCategoryTree(
    @Query('language') language: 'en' | 'ar' = 'en',
    @Res() response: Response,
  ) {
    const startTime = Date.now();

    this.logger.log(`🌳 Category tree request: lang=${language}`);

    try {
      // Validate language parameter
      const sanitizedLanguage = ['en', 'ar'].includes(language)
        ? language
        : 'en';

      // Get complete tree from service
      const tree = await this.categoriesService.getTree();

      // Transform to tree response format
      const treeResponse: CategoryTreeRootDto[] = tree.map((root) => ({
        id: root.id,
        name: sanitizedLanguage === 'ar' ? root.nameAr : root.nameEn,
        nameAr: root.nameAr,
        slug: root.slug,
        icon: root.iconUrl,
        image: root.bannerUrl,
        productCount: root.productCount,
        megaMenuType: root.megaMenuType || 'none',
        isPinnedInNav: root.isPinnedInNav || false,
        megaMenuConfig: root.megaMenuConfig || null,
        children: (root.children || []).map((child) => ({
          id: child.id,
          name: sanitizedLanguage === 'ar' ? child.nameAr : child.nameEn,
          nameAr: child.nameAr,
          slug: child.slug,
          icon: child.iconUrl,
          image: child.bannerUrl,
          productCount: child.productCount,
          children: (child.children || []).map((grandchild) => ({
            id: grandchild.id,
            name:
              sanitizedLanguage === 'ar'
                ? grandchild.nameAr
                : grandchild.nameEn,
            nameAr: grandchild.nameAr,
            slug: grandchild.slug,
            icon: grandchild.iconUrl,
            image: grandchild.bannerUrl,
            productCount: grandchild.productCount,
          })),
        })),
      }));

      // Set aggressive cache headers for tree (30 minutes)
      response.set({
        'Cache-Control': 'public, max-age=1800',
        'Content-Language': sanitizedLanguage,
        'X-Content-Type-Options': 'nosniff',
      });

      const processingTime = Date.now() - startTime;
      const totalCategories = treeResponse.reduce(
        (sum, root) =>
          sum +
          1 +
          (root.children?.length || 0) +
          (root.children?.reduce(
            (childSum, child) => childSum + (child.children?.length || 0),
            0,
          ) || 0),
        0,
      );

      this.logger.log(
        `✅ Category tree served: ${treeResponse.length} roots, ${totalCategories} total (${processingTime}ms)`,
      );

      return response.status(HttpStatus.OK).json({
        data: treeResponse,
      });
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Category tree failed: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve category tree',
        message: (error as Error).message || 'Please try again later',
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
        approvalStatus: ApprovalStatus.APPROVED,
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
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Category search failed: ${(error as Error).message} (${processingTime}ms)`,
        {
          error: (error as Error).message,
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
          message: (error as Error).message,
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
      const categories =
        await this.categoriesService.getFeaturedCategories(sanitizedLimit);

      // 3. Transform to featured response format (camelCase, matching FE interface)
      const featuredResponse = categories.map((category) => ({
        id: category.id,
        name: category.nameEn,
        nameAr: category.nameAr,
        slug: category.slug,
        image: category.featuredImageUrl || category.bannerUrl || '',
        icon: category.iconUrl || '',
        productCount: category.productCount,
        sortOrder: category.featuredPriority || category.sortOrder,
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
    } catch (error: unknown) {
      this.logger.error(
        `❌ Featured categories failed: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve featured categories',
        message: (error as Error).message || 'Please try again later',
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
                image_url: 'https://images.unsplash.com/photo-1589698423558',
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
          approvalStatus: ApprovalStatus.APPROVED,
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
          const productsResponse =
            await this.publicProductsService.getFeaturedProducts(
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
              approvalStatus: ApprovalStatus.APPROVED,
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
    } catch (error: unknown) {
      this.logger.error(
        `❌ Homepage sections failed: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve homepage sections',
        message: (error as Error).message || 'Please try again later',
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
  private validatePublicQueryParams(params: {
    page?: number | string;
    limit?: number | string;
    language?: string;
    featured?: boolean | string;
    parentId?: number | string;
  }): {
    page: number;
    limit: number;
    language: 'en' | 'ar';
    featured: boolean;
    parentId: number | undefined;
  } {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(Math.max(1, Number(params.limit) || 20), 50); // Max 50 for public
    const language: 'en' | 'ar' = params.language === 'ar' ? 'ar' : 'en';
    const featured = params.featured === true || params.featured === 'true';
    const parentId = params.parentId ? Number(params.parentId) : undefined;

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
    result: PaginatedCategoriesResponseDto,
    language: string,
    userContext: { type: 'local' | 'diaspora'; country?: string },
  ): Omit<PaginatedCategoriesResponseDto, 'data'> & {
    data: Record<string, unknown>[];
  } {
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

  // ============================================================================
  // S2 ENDPOINTS (Place BEFORE :id/products due to route order)
  // ============================================================================

  /**
   * GET CATEGORY BY SLUG
   *
   * Retrieves a single category by its slug identifier.
   * Returns category details with parent, children, and product count.
   * Only returns categories that are active and approved.
   *
   * Features:
   * - Lookup by slug instead of numeric ID
   * - Includes parent and children relationships
   * - Product count for the category
   * - Cached for 5 minutes
   * - Mobile-optimized response
   *
   * Use Cases:
   * - Frontend category page routing (e.g., /categories/damascus-steel)
   * - SEO-friendly category URLs
   * - Category navigation breadcrumbs
   * - Category metadata for product listings
   *
   * @sprint S2 Categories Backend Gaps
   */
  @Get('by-slug/:slug')
  @ApiParam({
    name: 'slug',
    type: String,
    description:
      'Category slug identifier (e.g., "damascus-steel", "electronics")',
    example: 'damascus-steel',
  })
  @ApiOperation({
    summary: 'Get category by slug',
    description: `
      Retrieve a single category by its slug identifier.

      Features:
      • SEO-friendly slug-based lookup
      • Includes parent and children relationships
      • Product count for the category
      • Only returns active and approved categories
      • Cached for 5 minutes for optimal performance

      Use Cases:
      • Frontend category page routing
      • SEO-friendly category URLs
      • Category navigation breadcrumbs
      • Category metadata for product listings
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          id: 1,
          nameEn: 'Damascus Steel',
          nameAr: 'الفولاذ الدمشقي',
          slug: 'damascus-steel',
          descriptionEn: 'Authentic Damascus steel knives and blades',
          descriptionAr: 'سكاكين وشفرات أصلية من الفولاذ الدمشقي',
          bannerUrl: 'https://images.unsplash.com/photo-1589698423558',
          iconUrl: 'hardware',
          parent: null,
          children: [
            {
              id: 10,
              nameEn: 'Kitchen Knives',
              nameAr: 'سكاكين المطبخ',
              slug: 'kitchen-knives',
              productCount: 15,
            },
          ],
          productCount: 25,
        },
      },
    },
    headers: {
      'Cache-Control': {
        description: 'Caching directive for performance',
        schema: { type: 'string', example: 'public, max-age=300' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or not publicly available',
    schema: {
      example: {
        success: false,
        error: 'Not Found',
        message: 'Category with slug "invalid-slug" not found',
        statusCode: 404,
      },
    },
  })
  async getCategoryBySlug(
    @Param('slug') slug: string,
    @Res() response: Response,
  ) {
    const startTime = Date.now();

    this.logger.log(`🔍 Get category by slug request: slug="${slug}"`);

    try {
      // 1. Find category by slug
      const category = await this.categoriesService.findBySlug(slug);

      if (!category) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: `Category with slug "${slug}" not found`,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      // 2. Set cache headers (5 minutes)
      response.set({
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Category by slug retrieved: ${category.nameEn} (ID: ${category.id}) (${processingTime}ms)`,
      );

      // 3. Return category data
      return response.status(HttpStatus.OK).json({
        success: true,
        data: {
          id: category.id,
          nameEn: category.nameEn,
          nameAr: category.nameAr,
          slug: category.slug,
          descriptionEn: category.descriptionEn,
          descriptionAr: category.descriptionAr,
          bannerUrl: category.bannerUrl,
          iconUrl: category.iconUrl,
          parent: category.parent
            ? {
                id: category.parent.id,
                nameEn: category.parent.nameEn,
                nameAr: category.parent.nameAr,
                slug: category.parent.slug,
              }
            : null,
          children: (category.children || []).map((child) => ({
            id: child.id,
            nameEn: child.nameEn,
            nameAr: child.nameAr,
            slug: child.slug,
            productCount: child.productCount,
          })),
          productCount: category.productCount,
        },
      });
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Get category by slug failed: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve category. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * GET CATEGORY HIERARCHY WITH BREADCRUMBS
   *
   * Retrieves category hierarchy information including breadcrumb path and children.
   * Useful for navigation breadcrumbs and category exploration.
   *
   * Features:
   * - Breadcrumb path from root to current category
   * - List of child categories with product counts
   * - Localized category names (English/Arabic)
   * - Cached for 5 minutes
   * - Mobile-optimized response
   *
   * Use Cases:
   * - Category page breadcrumb navigation
   * - Category tree exploration
   * - Subcategory navigation menus
   * - SEO breadcrumb markup
   *
   * @sprint S2 Categories Backend Gaps
   */
  @Get(':id/hierarchy')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get category hierarchy with breadcrumbs and children',
    description: `
      Retrieve category hierarchy information including breadcrumb path and children.

      Features:
      • Breadcrumb path from root to current category
      • List of child categories with product counts
      • Localized category names (English/Arabic)
      • Only returns active and approved categories
      • Cached for 5 minutes for optimal performance

      Use Cases:
      • Category page breadcrumb navigation
      • Category tree exploration
      • Subcategory navigation menus
      • SEO breadcrumb markup
    `,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Response language preference (default: en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Category hierarchy retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          path: [
            {
              id: 1,
              nameEn: 'Home & Garden',
              nameAr: 'المنزل والحديقة',
              slug: 'home-garden',
            },
            {
              id: 5,
              nameEn: 'Kitchen',
              nameAr: 'المطبخ',
              slug: 'kitchen',
            },
          ],
          currentName: 'Kitchen',
          children: [
            {
              id: 10,
              nameEn: 'Cookware',
              nameAr: 'أدوات الطبخ',
              slug: 'cookware',
              productCount: 45,
            },
          ],
        },
      },
    },
    headers: {
      'Cache-Control': {
        description: 'Caching directive for performance',
        schema: { type: 'string', example: 'public, max-age=300' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or not publicly available',
  })
  async getCategoryHierarchy(
    @Param('id') id: number,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Res() response: Response,
  ) {
    const startTime = Date.now();

    this.logger.log(
      `🌳 Get category hierarchy request: id=${id}, language=${language}`,
    );

    try {
      // 1. Validate category ID
      const sanitizedId = Number(id);
      if (isNaN(sanitizedId) || sanitizedId < 1) {
        throw new BadRequestException('Invalid category ID');
      }

      // 2. Validate language
      const sanitizedLanguage: 'en' | 'ar' = ['en', 'ar'].includes(language)
        ? language
        : 'en';

      // 3. Find category (must be active + approved)
      const category = await this.categoryRepository.findOne({
        where: {
          id: sanitizedId,
          isActive: true,
          approvalStatus: 'approved' as
            | 'draft'
            | 'pending'
            | 'approved'
            | 'rejected'
            | 'suspended'
            | 'archived',
        },
        relations: ['parent', 'children'],
      });

      if (!category) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: `Category with ID ${sanitizedId} not found`,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      // 4. Generate breadcrumbs using existing hierarchy service
      const breadcrumbs =
        await this.categoryHierarchyService.generateBreadcrumbs(
          category,
          sanitizedLanguage,
        );

      // 5. Build path from breadcrumbs (need to fetch full category data for each breadcrumb)
      const pathPromises = breadcrumbs.map(async (crumb) => {
        const fullCategory = await this.categoryRepository.findOne({
          where: { id: crumb.id },
        });
        return {
          id: crumb.id,
          nameEn: fullCategory?.nameEn || crumb.name,
          nameAr: fullCategory?.nameAr || crumb.name,
          slug: crumb.slug,
        };
      });
      const path = await Promise.all(pathPromises);

      // 6. Get children with product counts (only active + approved)
      const children = (category.children || [])
        .filter(
          (child) => child.isActive && child.approvalStatus === 'approved',
        )
        .map((child) => ({
          id: child.id,
          nameEn: child.nameEn,
          nameAr: child.nameAr,
          slug: child.slug,
          productCount: child.productCount,
        }));

      // 7. Set cache headers (5 minutes)
      response.set({
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Category hierarchy retrieved: ${category.nameEn} with ${breadcrumbs.length} breadcrumbs, ${children.length} children (${processingTime}ms)`,
      );

      // 8. Return hierarchy data
      return response.status(HttpStatus.OK).json({
        success: true,
        data: {
          path,
          currentName:
            sanitizedLanguage === 'ar' ? category.nameAr : category.nameEn,
          children,
        },
      });
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Get category hierarchy failed: ${(error as Error).message} (${processingTime}ms)`,
        (error as Error).stack,
      );

      if (error instanceof BadRequestException) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Bad Request',
          message: (error as Error).message,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve category hierarchy. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // ============================================================================
  // SEARCH WITHIN CATEGORY (SS-CAT-006, Enhanced S2)
  // ============================================================================

  /**
   * SEARCH PRODUCTS WITHIN CATEGORY
   *
   * Search for products within a specific category with advanced filtering.
   * Only returns products that are active, published, and approved.
   * Only searches within active and approved categories.
   *
   * Features:
   * - Full-text search on product names (English/Arabic) and descriptions
   * - Sort by: newest, price (asc/desc), popularity, rating
   * - Price range filtering (minPrice, maxPrice)
   * - Pagination with page and limit parameters
   * - Returns product images and pricing
   * - Caching headers for 5 minutes
   * - Mobile-optimized response format
   * - Accepts category ID (number) OR slug (string)
   *
   * Use Cases:
   * - Category page product listings
   * - Category-specific product search
   * - Mobile app category browsing
   * - Product filtering within categories
   *
   * @sprint S3 Categories, S2 Enhanced
   * @ticket SS-CAT-006
   */
  @Get(':id/products')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Category ID (number) or slug (string) to search within',
    example: 'damascus-steel',
  })
  @ApiOperation({
    summary:
      'Search products within a specific category with advanced filtering',
    description: `
      Search for products within a specific category with optional keyword search, sorting, price filtering, and pagination.

      Features:
      • Full-text search on product names (English/Arabic) and descriptions
      • Sort by: newest, price (asc/desc), popularity, rating
      • Price range filtering (minPrice, maxPrice)
      • Only returns active, published, and approved products
      • Category must be active and approved
      • Accepts category ID (number) OR slug (string)
      • Pagination support with page and limit
      • Returns product images and pricing information
      • Cached for 5 minutes for optimal performance
      • Mobile-optimized response format

      Search Behavior:
      • Empty search returns all products in category
      • Search is case-insensitive
      • Searches across product nameEn, nameAr, and descriptions
      • Uses MySQL LIKE for flexible matching

      Sorting Options:
      • newest: Recently added products first (default)
      • price_asc: Lowest price first
      • price_desc: Highest price first
      • popularity: Most viewed products first
      • rating: Highest rated products first

      Use Cases:
      • Category page product listings
      • Category-specific product search
      • Mobile app category browsing
      • Product filtering within categories
    `,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search keyword for filtering products (optional, min 2 chars)',
    example: 'damascus steel',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    minimum: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max: 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['newest', 'price_asc', 'price_desc', 'popularity', 'rating'],
    description: 'Sort order for products (default: newest)',
    example: 'price_asc',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter in SYP (inclusive)',
    example: 10000,
    minimum: 0,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter in SYP (inclusive)',
    example: 50000,
    minimum: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 1,
            nameEn: 'Damascus Steel Knife',
            nameAr: 'سكين من الفولاذ الدمشقي',
            slug: 'damascus-steel-knife',
            mainImage: 'https://cdn.souqsyria.com/products/damascus-knife.jpg',
            basePrice: 15000,
            discountPrice: 12000,
            currency: 'SYP',
            approvalStatus: 'approved',
            isActive: true,
            isPublished: true,
          },
        ],
        meta: {
          page: 1,
          limit: 20,
          total: 5,
          totalPages: 1,
        },
      },
    },
    headers: {
      'Cache-Control': {
        description: 'Caching directive for performance',
        schema: { type: 'string', example: 'public, max-age=300' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or not publicly available',
    schema: {
      example: {
        success: false,
        error: 'Not Found',
        message: 'Category with ID 999 not found',
        statusCode: 404,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
    schema: {
      example: {
        success: false,
        error: 'Bad Request',
        message: 'Invalid pagination parameters',
        statusCode: 400,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async searchProductsWithinCategory(
    @Param('id') categoryIdOrSlug: string | number,
    @Query() query: SearchWithinCategoryDto,
    @Res() response: Response,
  ) {
    const startTime = Date.now();
    const {
      search,
      page = 1,
      limit = 20,
      sortBy = 'newest',
      minPrice,
      maxPrice,
    } = query;

    this.logger.log(
      `🔍 Search within category request: categoryIdOrSlug=${categoryIdOrSlug}, search="${search || 'all'}", page=${page}, limit=${limit}, sortBy=${sortBy}, minPrice=${minPrice}, maxPrice=${maxPrice}`,
    );

    try {
      // 1. Parse category ID or slug
      let categoryIdentifier: number | string = categoryIdOrSlug;
      const numericId = Number(categoryIdOrSlug);

      // If it's a valid number, use it as numeric ID
      if (!isNaN(numericId) && numericId > 0) {
        categoryIdentifier = numericId;
      }
      // Otherwise treat as slug (string)

      // 2. Execute search via service (service handles both ID and slug)
      const result = await this.categoriesService.searchWithinCategory(
        categoryIdentifier,
        search,
        page,
        limit,
        sortBy,
        minPrice,
        maxPrice,
      );

      // 3. Set cache headers (5 minutes)
      response.set({
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Search within category ${categoryIdOrSlug} completed: ${result.data.length}/${result.meta.total} products found (${processingTime}ms)`,
      );

      // 4. Return response
      return response.status(HttpStatus.OK).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Search within category ${categoryIdOrSlug} failed: ${(error as Error).message} (${processingTime}ms)`,
        {
          error: (error as Error).message,
          stack: (error as Error).stack,
          categoryIdOrSlug,
          search,
          page,
          limit,
          sortBy,
          minPrice,
          maxPrice,
        },
      );

      // Return appropriate error response
      if (error instanceof BadRequestException) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Bad Request',
          message: (error as Error).message,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if ((error as { status?: number }).status === HttpStatus.NOT_FOUND) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: (error as Error).message,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to search products. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // ============================================================================
  // CATEGORY DETAIL (SS-CAT-002) — MUST BE LAST (catch-all :id)
  // ============================================================================

  /**
   * GET SINGLE CATEGORY BY ID
   *
   * Returns full category details for the category detail page.
   * Only returns active and approved categories (public visibility).
   *
   * IMPORTANT: This route MUST be the last parameterized route in the controller
   * because `:id` is a catch-all pattern that would match other sub-paths.
   *
   * @param categoryId - Category ID
   * @param language - Language preference for display names
   * @returns Category detail with full DTO transformation
   *
   * @sprint S2 Categories
   * @ticket SS-CAT-002
   */
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Category ID to retrieve',
    example: 1,
  })
  @ApiOperation({
    summary: 'Get single category by ID',
    description: `
      Retrieve full category details for category detail pages.

      Features:
      • Only returns active and approved categories
      • Bilingual support (Arabic/English)
      • Includes breadcrumbs for navigation
      • Cached for 5 minutes
      • SEO-optimized response with meta fields

      Use Cases:
      • Category detail pages
      • Category header banners
      • Mobile app category screens
      • SEO landing pages
    `,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Response language preference (default: en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    headers: {
      'Cache-Control': {
        description: 'Caching directive for performance',
        schema: { type: 'string', example: 'public, max-age=300' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found or not publicly available',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category ID',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getCategoryById(
    @Param('id') categoryId: number,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Res() response: Response,
  ) {
    const startTime = Date.now();

    this.logger.log(
      `📋 Category detail request: id=${categoryId}, lang=${language}`,
    );

    try {
      // 1. Validate category ID
      const sanitizedId = Number(categoryId);
      if (isNaN(sanitizedId) || sanitizedId < 1) {
        throw new BadRequestException('Invalid category ID');
      }

      // 2. Fetch category via service (includes breadcrumbs)
      const sanitizedLanguage = ['en', 'ar'].includes(language)
        ? language
        : 'en';
      const categoryDto = await this.categoriesService.findById(
        sanitizedId,
        sanitizedLanguage,
      );

      // 3. Verify category is publicly visible
      if (!categoryDto.isActive) {
        throw new NotFoundException(
          `Category with ID ${sanitizedId} is not publicly available`,
        );
      }
      if (categoryDto.approvalStatus !== 'approved') {
        throw new NotFoundException(
          `Category with ID ${sanitizedId} is not publicly available`,
        );
      }

      // 4. Set cache headers (5 minutes)
      response.set({
        'Cache-Control': 'public, max-age=300',
        'Content-Language': sanitizedLanguage,
        'X-Content-Type-Options': 'nosniff',
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Category detail served: id=${sanitizedId}, name="${categoryDto.displayName}" (${processingTime}ms)`,
      );

      return response.status(HttpStatus.OK).json({
        success: true,
        data: categoryDto,
      });
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;

      this.logger.error(
        `❌ Category detail failed: ${(error as Error).message} (${processingTime}ms)`,
        {
          error: (error as Error).message,
          stack: (error as Error).stack,
          categoryId,
          language,
        },
      );

      if (error instanceof BadRequestException) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Bad Request',
          message: (error as Error).message,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      }

      if (error instanceof NotFoundException) {
        return response.status(HttpStatus.NOT_FOUND).json({
          success: false,
          error: 'Not Found',
          message: (error as Error).message,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }

      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve category. Please try again.',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

import {
  Controller,
  Get,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { GetPublicProductsDto } from '../dto/get-public-products.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PublicProductsService } from '../service/public-products.service';

@ApiTags('🛒 Public Products')
@Controller('products')
export class PublicProductsController {
  constructor(private readonly service: PublicProductsService) {}

  /**
   * GET /products
   * Public catalog listing endpoint for customers
   * Supports pagination, search, price range, category/vendor filters, and sorting
   */
  @Get()
  @ApiOperation({
    summary: 'Browse public product catalog with filters and sorting',
    description: `
      Retrieves paginated product listings with comprehensive filtering and sorting options.

      Features:
      • Pagination with page and limit controls
      • Full-text search across English and Arabic names
      • Category and manufacturer filtering
      • Price range filtering (min/max)
      • Multiple sort options (price, date, rating)
      • Stock status computation (in_stock, low_stock, out_of_stock)
      • Category information included in response

      Stock Status:
      • in_stock: More than 5 units available
      • low_stock: 1-5 units available
      • out_of_stock: No units available

      Use Cases:
      • Main product catalog page
      • Category browsing pages
      • Search results display
      • Price comparison tools
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (1-indexed, minimum: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Items per page (minimum: 1, maximum: 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'Damascus Steel',
    description: 'Search query for product names (English or Arabic)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    example: 1,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'manufacturerId',
    required: false,
    type: Number,
    example: 2,
    description: 'Filter by manufacturer ID',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    example: 50000,
    description: 'Minimum price in SYP (inclusive)',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    example: 500000,
    description: 'Maximum price in SYP (inclusive)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price_asc', 'price_desc', 'newest', 'rating'],
    example: 'price_asc',
    description: 'Sort order: price_asc, price_desc, newest (default), or rating',
  })
  @ApiResponse({
    status: 200,
    description: 'Product catalog retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            slug: 'damascus-steel-chef-knife',
            nameEn: 'Damascus Steel Chef Knife',
            nameAr: 'سكين الطهاة من الفولاذ الدمشقي',
            mainImage: 'https://placehold.co/600x400?text=Damascus+Steel+Chef+Knife',
            basePrice: 500000,
            discountPrice: 450000,
            currency: 'SYP',
            categoryId: 1,
            categoryNameEn: 'Damascus Steel',
            categoryNameAr: 'الفولاذ الدمشقي',
            stockStatus: 'in_stock',
            rating: 0,
            reviewCount: 0,
          },
          {
            id: 2,
            slug: 'olive-oil-soap-bar',
            nameEn: 'Olive Oil Soap Bar',
            nameAr: 'صابون زيت الزيتون',
            mainImage: 'https://placehold.co/600x400?text=Olive+Oil+Soap+Bar',
            basePrice: 75000,
            discountPrice: null,
            currency: 'SYP',
            categoryId: 2,
            categoryNameEn: 'Beauty & Wellness',
            categoryNameAr: 'الجمال والعافية',
            stockStatus: 'low_stock',
            rating: 0,
            reviewCount: 0,
          },
        ],
        meta: {
          total: 156,
          page: 1,
          limit: 20,
          totalPages: 8,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Requested page exceeds available pages',
    schema: {
      example: {
        message: 'Requested page 15 exceeds available pages (8). Total products: 156.',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  getPublicProducts(@Query() filters: GetPublicProductsDto) {
    return this.service.getPublicFeed(filters);
  }

  /**
   * GET /products/featured
   * Featured products endpoint for homepage hero section
   * Returns products marked as featured with priority sorting
   *
   * NOTE: This MUST be defined BEFORE the :slug route to avoid route conflicts
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Get featured products for homepage',
    description: `
      Retrieves featured products for homepage hero section and promotional displays.

      Features:
      • Only active, published, and approved products
      • Sorted by featured priority (highest first)
      • Optimized for homepage performance
      • Supports date-based featured campaigns

      Use Cases:
      • Homepage hero section
      • Featured products carousel
      • Promotional banners
      • Mobile app featured section
    `,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 3,
    description: 'Maximum number of featured products to return (default: 3)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: 'number',
    example: 1,
    description: 'Filter by specific category ID',
  })
  @ApiQuery({
    name: 'parentCategoryId',
    required: false,
    type: 'number',
    example: 1,
    description: 'Filter by parent category ID (e.g., Consumer Electronics)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['featured', 'new_arrivals', 'best_seller'],
    example: 'featured',
    description: 'Sort order: featured (default), new_arrivals, or best_seller',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name_en: 'Damascus Steel Chef Knife',
            name_ar: 'سكين الطهاة الدمشقي',
            slug: 'damascus-steel-chef-knife',
            sku: 'DAM-001',
            currency: 'SYP',
            base_price: 500000,
            discount_price: 450000,
            discount_percentage: 10,
            image_url:
              'https://images.unsplash.com/photo-1594534475553-8b8e0f7c3c08',
            is_featured: true,
            featured_priority: 100,
            featured_badge: 'Best Seller',
            featured_start_date: '2025-10-08T00:00:00.000Z',
            featured_end_date: '2025-11-07T00:00:00.000Z',
            category: {
              id: 1,
              name_en: 'Damascus Steel',
              name_ar: 'الفولاذ الدمشقي',
              slug: 'damascus-steel',
              parent_id: null,
            },
            status: 'published',
            approval_status: 'approved',
            is_active: true,
            is_published: true,
            created_at: '2025-10-08T15:00:00.000Z',
            promotional_text: 'EXPERIENCE GREAT CRAFTSMANSHIP',
          },
        ],
        meta: {
          total: 3,
          limit: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async getFeaturedProducts(
    @Query('limit') limit: number = 3,
    @Query('categoryId') categoryId?: number,
    @Query('parentCategoryId') parentCategoryId?: number,
    @Query('sort') sort: 'featured' | 'new_arrivals' | 'best_seller' = 'featured',
  ) {
    return await this.service.getFeaturedProducts(
      limit,
      categoryId,
      parentCategoryId,
      sort,
    );
  }

  /**
   * GET /products/:slug
   * Individual product details endpoint for product detail page
   * Retrieves complete product information including variants, pricing, descriptions
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Get product details by slug',
    description:
      'Retrieves complete product information including variants, pricing, images, and descriptions',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug identifier',
    example: 'samsung-galaxy-s24',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
    schema: {
      example: {
        id: 123,
        slug: 'samsung-galaxy-s24',
        nameEn: 'Samsung Galaxy S24',
        nameAr: 'سامسونج جالاكسي إس 24',
        category: {
          id: 5,
          nameEn: 'Smartphones',
          nameAr: 'الهواتف الذكية',
        },
        manufacturer: {
          id: 2,
          name: 'Samsung',
        },
        vendor: {
          id: 10,
          businessName: 'TechSyria Store',
        },
        pricing: {
          basePrice: 3000000,
          discountPrice: 2750000,
          currency: 'SYP',
        },
        images: [
          {
            id: 1,
            imageUrl: 'https://example.com/images/galaxy-s24-1.jpg',
            altText: 'Samsung Galaxy S24 Front View',
          },
        ],
        descriptions: [
          {
            language: 'en',
            shortDescription: 'Latest Samsung flagship smartphone',
            fullDescription: 'Detailed product description...',
          },
        ],
        variants: [
          {
            id: 201,
            sku: 'SGS24-128GB-BLACK',
            attributeValues: {
              color: 'Black',
              storage: '128GB',
            },
            pricing: {
              basePrice: 3000000,
              discountPrice: 2750000,
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not available',
    schema: {
      example: {
        message: 'Product with slug "invalid-slug" not found or not available',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async getProductBySlug(@Param('slug') slug: string) {
    return await this.service.getProductBySlug(slug);
  }

  /**
   * GET /products/search
   * Advanced product search endpoint with full-text search
   * Searches across product names, descriptions, categories, and manufacturers
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search products with advanced filters',
    description:
      'Performs full-text search across products with relevance sorting and comprehensive filters',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query string',
    example: 'Samsung Galaxy',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 20,
    description: 'Items per page (max: 100)',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: 'number',
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'manufacturerId',
    required: false,
    type: 'number',
    description: 'Filter by manufacturer ID',
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
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 123,
            slug: 'samsung-galaxy-s24',
            nameEn: 'Samsung Galaxy S24',
            nameAr: 'سامسونج جالاكسي إس 24',
            shortDescription: 'Latest Samsung flagship smartphone',
            mainImage: 'https://example.com/images/galaxy-s24.jpg',
            finalPrice: 2750000,
            currency: 'SYP',
            category: {
              id: 5,
              nameEn: 'Smartphones',
              nameAr: 'الهواتف الذكية',
              slug: 'smartphones',
            },
            manufacturer: {
              id: 2,
              name: 'Samsung',
            },
          },
        ],
        meta: {
          total: 15,
          page: 1,
          limit: 20,
          searchQuery: 'Samsung Galaxy',
          hasResults: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search parameters',
    schema: {
      example: {
        message: 'Search query is required',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  async searchProducts(
    @Query('q') searchQuery: string,
    @Query() filters: GetPublicProductsDto,
  ) {
    if (!searchQuery || !searchQuery.trim()) {
      throw new BadRequestException('Search query is required');
    }

    return await this.service.searchProducts(searchQuery, filters);
  }
}

import {
  Controller,
  Get,
  Query,
  Param,
  Header,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import {
  MobileProductsService,
  MobileProductFilters,
} from '../services/mobile-products.service';

/**
 * Mobile Products Controller
 *
 * Provides optimized product endpoints specifically designed for mobile applications.
 * Features lightweight responses, optimized images, and mobile-specific data structures.
 *
 * All endpoints return compressed, mobile-optimized data to reduce bandwidth usage
 * and improve loading times on mobile networks.
 */
@ApiTags('📱 Mobile Products API v1')
@Controller('api/mobile/v1/products')
export class MobileProductsController {
  constructor(private readonly mobileProductsService: MobileProductsService) {}

  /**
   * GET /api/mobile/v1/products
   * Mobile-optimized product feed with lightweight responses
   * Perfect for product listing screens with optimized images and essential data only
   */
  @Get()
  @ApiOperation({
    summary: 'Get mobile-optimized product feed',
    description:
      'Retrieves paginated product listings optimized for mobile apps with compressed images and essential data only. Supports filters and sorting optimized for mobile UI patterns.',
  })
  @ApiHeader({
    name: 'X-Mobile-Device',
    description: 'Mobile device type (ios/android) for optimization',
    required: false,
  })
  @ApiHeader({
    name: 'X-App-Version',
    description: 'Mobile app version for compatibility',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    example: 1,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 20,
    description: 'Items per page (default: 20, max: 50)',
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
    name: 'manufacturerId',
    required: false,
    type: 'number',
    description: 'Filter by manufacturer ID',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: 'number',
    description: 'Minimum price filter (SYP)',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: 'number',
    description: 'Maximum price filter (SYP)',
  })
  @ApiQuery({
    name: 'inStockOnly',
    required: false,
    type: 'boolean',
    description: 'Show only in-stock products',
  })
  @ApiQuery({
    name: 'featured',
    required: false,
    type: 'boolean',
    description: 'Show only featured products',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price', 'rating', 'newest', 'popular'],
    description: 'Sort products by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Response language (default: en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile product feed retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 123,
            slug: 'samsung-galaxy-s24',
            nameEn: 'Samsung Galaxy S24',
            nameAr: 'سامسونج جالاكسي إس 24',
            shortDescription: 'Latest Samsung flagship smartphone',
            images: {
              original:
                'https://cdn.souqsyria.com/products/galaxy-s24-original.jpg',
              thumbnail:
                'https://cdn.souqsyria.com/optimized/galaxy-s24_thumbnail_150x150.webp',
              medium:
                'https://cdn.souqsyria.com/optimized/galaxy-s24_medium_400x400.webp',
              large:
                'https://cdn.souqsyria.com/optimized/galaxy-s24_large_800x800.webp',
              webp: 'https://cdn.souqsyria.com/optimized/galaxy-s24_original.webp',
            },
            pricing: {
              basePrice: 3000000,
              discountPrice: 2750000,
              currency: 'SYP',
              discountPercentage: 8,
            },
            availability: {
              inStock: true,
              estimatedDelivery: 'Thu, Mar 21',
            },
            vendor: {
              id: 10,
              businessName: 'TechSyria Store',
              rating: 4.8,
            },
            category: {
              id: 5,
              nameEn: 'Smartphones',
              nameAr: 'الهواتف الذكية',
              slug: 'smartphones',
            },
            ratings: {
              average: 4.6,
              count: 127,
            },
            badges: ['featured', 'on-sale', 'top-rated'],
          },
        ],
        meta: {
          total: 1567,
          page: 1,
          limit: 20,
          totalPages: 79,
          hasNext: true,
          hasPrevious: false,
        },
        performance: {
          loadTime: 45,
          cached: false,
          optimizedForMobile: true,
        },
      },
    },
  })
  @Header('Cache-Control', 'public, max-age=300') // 5 minute cache for mobile
  async getMobileProductFeed(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('categoryId') categoryId?: number,
    @Query('vendorId') vendorId?: number,
    @Query('manufacturerId') manufacturerId?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStockOnly') inStockOnly?: boolean,
    @Query('featured') featured?: boolean,
    @Query('sortBy') sortBy?: 'price' | 'rating' | 'newest' | 'popular',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('language') language?: 'en' | 'ar',
  ) {
    // Limit max items per page for mobile optimization
    const mobileLimit = Math.min(limit, 50);

    const filters: MobileProductFilters = {
      page,
      limit: mobileLimit,
      categoryId: categoryId ? Number(categoryId) : undefined,
      vendorId: vendorId ? Number(vendorId) : undefined,
      manufacturerId: manufacturerId ? Number(manufacturerId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStockOnly: inStockOnly === true,
      featured: featured !== undefined ? featured === true : undefined,
      sortBy: sortBy || 'newest',
      sortOrder: sortOrder || 'desc',
      language: language || 'en',
    };

    return await this.mobileProductsService.getMobileProductFeed(filters);
  }

  /**
   * GET /api/mobile/v1/products/:slug
   * Mobile-optimized product details with full information
   * Optimized for product detail screens with all necessary data
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Get mobile-optimized product details',
    description:
      'Retrieves complete product information optimized for mobile apps including variants, pricing, images, and specifications. All images are optimized for mobile bandwidth.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug identifier',
    example: 'samsung-galaxy-s24',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Response language (default: en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Mobile product details retrieved successfully',
    schema: {
      example: {
        id: 123,
        slug: 'samsung-galaxy-s24',
        nameEn: 'Samsung Galaxy S24',
        nameAr: 'سامسونج جالاكسي إس 24',
        shortDescription: 'Latest Samsung flagship smartphone',
        fullDescription: {
          en: 'The Samsung Galaxy S24 represents the pinnacle of mobile technology...',
          ar: 'يمثل سامسونج جالاكسي إس 24 قمة التكنولوجيا المحمولة...',
        },
        images: {
          original:
            'https://cdn.souqsyria.com/products/galaxy-s24-original.jpg',
          thumbnail:
            'https://cdn.souqsyria.com/optimized/galaxy-s24_thumbnail_150x150.webp',
          medium:
            'https://cdn.souqsyria.com/optimized/galaxy-s24_medium_400x400.webp',
          large:
            'https://cdn.souqsyria.com/optimized/galaxy-s24_large_800x800.webp',
        },
        imageGallery: [
          {
            original: 'https://cdn.souqsyria.com/products/galaxy-s24-front.jpg',
            thumbnail:
              'https://cdn.souqsyria.com/optimized/galaxy-s24-front_thumbnail_150x150.webp',
            medium:
              'https://cdn.souqsyria.com/optimized/galaxy-s24-front_medium_400x400.webp',
            large:
              'https://cdn.souqsyria.com/optimized/galaxy-s24-front_large_800x800.webp',
          },
        ],
        pricing: {
          basePrice: 3000000,
          discountPrice: 2750000,
          currency: 'SYP',
          discountPercentage: 8,
        },
        availability: {
          inStock: true,
          stockCount: 5,
          estimatedDelivery: 'Thu, Mar 21',
        },
        variants: [
          {
            id: 201,
            sku: 'SGS24-128GB-BLACK',
            attributes: {
              color: 'Black',
              storage: '128GB',
            },
            pricing: {
              basePrice: 3000000,
              discountPrice: 2750000,
              currency: 'SYP',
            },
            availability: {
              inStock: true,
              stockCount: 5,
            },
          },
        ],
        vendor: {
          id: 10,
          businessName: 'TechSyria Store',
          rating: 4.8,
        },
        category: {
          id: 5,
          nameEn: 'Smartphones',
          nameAr: 'الهواتف الذكية',
          slug: 'smartphones',
        },
        manufacturer: {
          id: 2,
          name: 'Samsung',
          country: 'South Korea',
        },
        shipping: {
          freeShipping: false,
          estimatedDays: 3,
          cost: 75000,
        },
        warranty: {
          duration: 12,
          type: 'manufacturer',
          coverage: 'parts and labor',
        },
        ratings: {
          average: 4.6,
          count: 127,
        },
        badges: ['featured', 'on-sale', 'top-rated'],
        tags: ['smartphone', 'samsung', 'flagship', 'android'],
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
  @Header('Cache-Control', 'public, max-age=600') // 10 minute cache for product details
  async getMobileProductDetails(
    @Param('slug') slug: string,
    @Query('language') language?: 'en' | 'ar',
  ) {
    return await this.mobileProductsService.getMobileProductDetails(
      slug,
      language || 'en',
    );
  }

  /**
   * GET /api/mobile/v1/products/search/quick
   * Quick search with autocomplete for mobile keyboards
   * Lightweight responses perfect for search-as-you-type functionality
   */
  @Get('search/quick')
  @ApiOperation({
    summary: 'Quick product search with autocomplete',
    description:
      'Performs quick product search optimized for mobile keyboards with autocomplete suggestions. Returns minimal data for fast search-as-you-type functionality.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query string',
    example: 'samsung',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 10,
    description: 'Maximum number of suggestions (default: 10, max: 20)',
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Search language (default: en)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions retrieved successfully',
    schema: {
      example: {
        suggestions: [
          {
            id: 123,
            slug: 'samsung-galaxy-s24',
            name: 'Samsung Galaxy S24',
            image:
              'https://cdn.souqsyria.com/optimized/galaxy-s24_thumbnail_150x150.webp',
            price: 2750000,
            currency: 'SYP',
          },
          {
            id: 124,
            slug: 'samsung-galaxy-s23',
            name: 'Samsung Galaxy S23',
            image:
              'https://cdn.souqsyria.com/optimized/galaxy-s23_thumbnail_150x150.webp',
            price: 2250000,
            currency: 'SYP',
          },
        ],
        query: 'samsung',
        count: 2,
      },
    },
  })
  @Header('Cache-Control', 'public, max-age=180') // 3 minute cache for search
  async quickSearch(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('language') language?: 'en' | 'ar',
  ) {
    // Limit max suggestions for mobile optimization
    const mobileLimit = Math.min(limit, 20);

    return await this.mobileProductsService.quickSearch(
      query,
      mobileLimit,
      language || 'en',
    );
  }

  /**
   * GET /api/mobile/v1/products/categories/:categoryId
   * Get products by category optimized for mobile
   */
  @Get('categories/:categoryId')
  @ApiOperation({
    summary: 'Get products by category for mobile',
    description:
      'Retrieves products filtered by category with mobile optimizations',
  })
  @ApiParam({
    name: 'categoryId',
    type: 'number',
    description: 'Category ID',
    example: 5,
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['price', 'rating', 'newest', 'popular'],
  })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'] })
  @Header('Cache-Control', 'public, max-age=300')
  async getProductsByCategory(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sortBy') sortBy?: 'price' | 'rating' | 'newest' | 'popular',
    @Query('language') language?: 'en' | 'ar',
  ) {
    const filters: MobileProductFilters = {
      page,
      limit: Math.min(limit, 50),
      categoryId,
      sortBy: sortBy || 'newest',
      language: language || 'en',
    };

    return await this.mobileProductsService.getMobileProductFeed(filters);
  }

  /**
   * GET /api/mobile/v1/products/featured
   * Get featured products for mobile homepage
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Get featured products for mobile',
    description:
      'Retrieves featured products optimized for mobile homepage display',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 10,
    description: 'Number of featured products (max: 20)',
  })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar'] })
  @ApiResponse({
    status: 200,
    description: 'Featured products retrieved successfully',
  })
  @Header('Cache-Control', 'public, max-age=900') // 15 minute cache for featured products
  async getFeaturedProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('language') language?: 'en' | 'ar',
  ) {
    const filters: MobileProductFilters = {
      page: 1,
      limit: Math.min(limit, 20),
      featured: true,
      sortBy: 'popular',
      language: language || 'en',
    };

    return await this.mobileProductsService.getMobileProductFeed(filters);
  }
}

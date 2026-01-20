/**
 * @file homepage.controller.ts
 * @description REST API controller for homepage data aggregation
 *
 * PUBLIC ENDPOINTS:
 * - GET /homepage - Get complete homepage data (hero banners, categories, carousels)
 * - GET /homepage/metrics - Get homepage performance metrics
 *
 * FEATURES:
 * - Single API call for all homepage data
 * - Language and currency support via headers
 * - Personalization support (future enhancement)
 * - Optimized for mobile-first Syrian market
 * - Comprehensive Swagger documentation
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Controller, Get, Query, Headers, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import {
  HomepageAggregationService,
  HomepageQueryDto,
  HomepageDataDto,
} from '../services/homepage-aggregation.service';

/**
 * Homepage Controller
 *
 * Provides aggregated homepage data endpoints for the SouqSyria marketplace.
 * Optimized for performance with parallel data fetching and caching.
 */
@ApiTags('Homepage')
@Controller('homepage')
export class HomepageController {
  private readonly logger = new Logger(HomepageController.name);

  constructor(
    private readonly homepageService: HomepageAggregationService,
  ) {}

  /**
   * Get complete homepage data
   *
   * Returns all data needed for homepage in a single optimized API call:
   * - Hero banners for main carousel
   * - Featured categories for category grid
   * - Product carousels (new arrivals, best sellers, trending)
   *
   * @param personalized - Enable personalized recommendations
   * @param lang - Language preference from Accept-Language header
   * @param currency - Currency preference from X-Currency header
   * @returns Complete homepage data with metadata
   */
  @Get()
  @ApiOperation({
    summary: 'Get complete homepage data',
    description:
      'Retrieve all homepage components in a single optimized API call. ' +
      'Includes hero banners, featured categories, and product carousels with ' +
      'support for bilingual content (Arabic/English) and multi-currency (SYP/USD/EUR).',
  })
  @ApiQuery({
    name: 'personalized',
    required: false,
    type: Boolean,
    description: 'Enable personalized product recommendations',
    example: false,
  })
  @ApiHeader({
    name: 'Accept-Language',
    required: false,
    description: 'Preferred language (en or ar, default: ar for Syrian market)',
    example: 'ar',
  })
  @ApiHeader({
    name: 'X-Currency',
    required: false,
    description: 'Preferred currency (SYP, USD, or EUR, default: SYP)',
    example: 'SYP',
  })
  @ApiResponse({
    status: 200,
    description: 'Homepage data returned successfully',
    schema: {
      type: 'object',
      properties: {
        heroBanners: {
          type: 'array',
          description: 'Active hero banners for main carousel (max 5)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              nameEn: { type: 'string', example: 'Summer Sale 2025' },
              nameAr: { type: 'string', example: 'تخفيضات الصيف 2025' },
              imageUrl: { type: 'string', example: 'https://cdn.souqsyria.com/banners/summer-sale.jpg' },
              linkUrl: { type: 'string', example: '/promotions/summer-sale' },
              displayOrder: { type: 'number', example: 0 },
            },
          },
        },
        featuredCategories: {
          type: 'array',
          description: 'Featured categories for homepage grid (max 12)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              categoryId: { type: 'number', example: 1 },
              category: {
                type: 'object',
                properties: {
                  nameEn: { type: 'string', example: 'Damascus Crafts' },
                  nameAr: { type: 'string', example: 'حرف دمشقية' },
                },
              },
              displayOrder: { type: 'number', example: 0 },
            },
          },
        },
        productCarousels: {
          type: 'array',
          description: 'Product carousels with populated products',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              type: { type: 'string', example: 'new_arrivals' },
              titleEn: { type: 'string', example: 'New Arrivals' },
              titleAr: { type: 'string', example: 'الوافدون الجدد' },
              products: {
                type: 'array',
                description: 'Dynamically populated products',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 123 },
                    nameEn: { type: 'string', example: 'Handmade Mosaic Lamp' },
                    nameAr: { type: 'string', example: 'مصباح فسيفساء يدوي' },
                  },
                },
              },
            },
          },
        },
        metadata: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time', example: '2025-11-10T14:30:00Z' },
            language: { type: 'string', example: 'ar' },
            currency: { type: 'string', example: 'SYP' },
            personalized: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getHomepage(
    @Query('personalized') personalized?: boolean,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('x-currency') currency?: string,
  ): Promise<HomepageDataDto> {
    // Parse language from Accept-Language header
    const lang = acceptLanguage?.split(',')[0]?.split('-')[0] || 'ar';

    // Log request for analytics
    this.logger.log(`Homepage request - lang: ${lang}, currency: ${currency || 'SYP'}, personalized: ${personalized || false}`);

    // Fetch and return homepage data
    return this.homepageService.getHomepageData({
      lang,
      currency: currency || 'SYP',
      personalized: personalized || false,
    });
  }

  /**
   * Get homepage performance metrics
   *
   * Returns aggregated metrics for monitoring homepage data health.
   *
   * @returns Performance metrics
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get homepage performance metrics',
    description:
      'Retrieve aggregated performance metrics for homepage monitoring. ' +
      'Useful for admin dashboards and system health checks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics returned successfully',
    schema: {
      type: 'object',
      properties: {
        heroBannersCount: {
          type: 'number',
          description: 'Number of active hero banners',
          example: 5,
        },
        featuredCategoriesCount: {
          type: 'number',
          description: 'Number of active featured categories',
          example: 12,
        },
        productCarouselsCount: {
          type: 'number',
          description: 'Number of active product carousels',
          example: 4,
        },
        totalProducts: {
          type: 'number',
          description: 'Total products across all carousels',
          example: 80,
        },
      },
    },
  })
  async getMetrics() {
    return this.homepageService.getPerformanceMetrics();
  }
}

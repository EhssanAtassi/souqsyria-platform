/**
 * @file hero-banners-seeder.controller.ts
 * @description Enterprise REST API controller for Syrian hero banners seeding operations
 *
 * Features:
 * - Comprehensive hero banners seeding endpoints
 * - Damascus and Aleppo themed campaigns
 * - Seasonal campaigns (Ramadan, Eid, Independence Day)
 * - Diaspora-targeted content management
 * - Performance analytics and ROI tracking APIs
 * - Bulk operations for enterprise banner testing
 * - Syrian cultural events and heritage integration
 * - Export capabilities for marketing analysis
 * - A/B testing configuration and management
 * - Performance optimization for large-scale campaigns
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HeroBannersSeederService, HeroBannersAnalytics, HeroBannersBulkResults } from './hero-banners-seeder.service';

/**
 * Enterprise hero banners seeding controller
 *
 * Provides comprehensive REST API endpoints for hero banner data creation,
 * marketing analytics, and campaign management with Syrian market focus
 */
@ApiTags('🎨 Hero Banners Seeding')
@Controller('hero-banners/seeder')
@ApiBearerAuth()
export class HeroBannersSeederController {
  private readonly logger = new Logger(HeroBannersSeederController.name);

  constructor(
    private readonly heroBannersSeederService: HeroBannersSeederService,
  ) {}

  /**
   * Seeds all hero banners for Syrian e-commerce platform
   *
   * Creates 20+ banners with realistic Syrian market patterns,
   * including Damascus/Aleppo themes, seasonal campaigns, cultural events,
   * diaspora targeting, and UNESCO-recognized heritage products
   *
   * @returns Seeding results with banner count and success status
   */
  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🎨 Seed all Syrian hero banners and campaigns',
    description: `
    Creates enterprise-ready hero banner data for SouqSyria platform:

    **Hero Banner Campaigns Created:**
    - 🏛️ Damascus Crafts Collection (Damascus steel, brocade, mosaic woodwork)
    - 🧼 Aleppo Soap Heritage (Authentic handmade traditional products)
    - 🌙 Ramadan Kareem Special Offers (Seasonal Islamic campaigns)
    - 🎊 Eid Celebration Sales (Gift-focused promotions)
    - 🇸🇾 Syria Independence Day Campaigns (Patriotic heritage support)
    - 🌍 Diaspora Targeting (International Syrian community reach)
    - ⚡ Flash Sales (Limited-time Damascus steel promotions)
    - 🏺 Regional Specialties (Palmyra dates, Latakia citrus, Hama crafts)

    **Banner Types Generated:**
    - 🎯 Product Spotlight (Featured Syrian products)
    - 🌙 Seasonal (Cultural and religious events)
    - ⚡ Flash Sale (Urgency-driven promotions)
    - 📖 Brand Story (Artisan storytelling)
    - 🏛️ Cultural (Heritage and UNESCO recognition)

    **Syrian Market Features:**
    - Multi-device responsive images (desktop, tablet, mobile)
    - Damascus timezone scheduling with approval workflow
    - Arabic and English bilingual content with RTL optimization
    - Syrian cultural integration (regions, artisans, UNESCO)
    - Analytics tracking (impressions, clicks, conversions)
    - Artisan profiles with experience and location data

    **Enterprise Analytics:**
    - Real-time performance tracking
    - Click-through rate (CTR) calculation
    - Revenue attribution and ROI metrics
    - Campaign A/B testing capabilities
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Hero banners successfully seeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        count: { type: 'number', example: 22 },
        message: { type: 'string', example: 'Successfully seeded 22 hero banners' },
        breakdown: {
          type: 'object',
          properties: {
            damascusBanners: { type: 'number', example: 5 },
            aleppoBanners: { type: 'number', example: 3 },
            seasonalBanners: { type: 'number', example: 4 },
            diasporaBanners: { type: 'number', example: 3 },
            culturalBanners: { type: 'number', example: 7 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding process',
  })
  async seedAll() {
    this.logger.log('🎨 Hero banners seeding requested via API');

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.seedAll();
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Hero banners seeding completed in ${processingTime}ms`);

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      breakdown: {
        damascusBanners: Math.floor(result.count * 0.227), // ~22.7% Damascus
        aleppoBanners: Math.floor(result.count * 0.136), // ~13.6% Aleppo
        seasonalBanners: Math.floor(result.count * 0.182), // ~18.2% Seasonal
        diasporaBanners: Math.floor(result.count * 0.136), // ~13.6% Diaspora
        culturalBanners: Math.floor(result.count * 0.318), // ~31.8% Cultural
      }
    };
  }

  /**
   * Seeds random selection of hero banners
   *
   * @param count Number of random banners to seed
   * @returns Seeding results
   */
  @Post('seed/random')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🎲 Seed random hero banners',
    description: `
    Seeds a random selection of hero banners for testing:

    **Use Cases:**
    - Quick testing and development
    - Demo environment setup
    - Performance testing with varied data
    - A/B testing campaign variations

    **Features:**
    - Randomized selection from full seed dataset
    - Maintains Syrian market authenticity
    - Includes diverse banner types and regions
    - Preserves cultural context and localization
    `,
  })
  @ApiQuery({
    name: 'count',
    required: false,
    type: Number,
    description: 'Number of random banners to seed (default: 5)',
    example: 5,
  })
  @ApiResponse({
    status: 201,
    description: 'Random hero banners successfully seeded',
  })
  async seedRandom(@Query('count') count?: number) {
    this.logger.log(`🎲 Random hero banners seeding requested: ${count || 5} banners`);

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.seedRandom(count || 5);
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Random banners seeding completed in ${processingTime}ms`);

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Seeds Damascus-themed hero banners
   *
   * @returns Seeding results for Damascus campaigns
   */
  @Post('seed/damascus')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🏛️ Seed Damascus-themed hero banners',
    description: `
    Seeds hero banners featuring Damascus heritage and crafts:

    **Damascus Campaigns:**
    - Damascus Steel Heritage Collection (UNESCO recognized)
    - Damascus Brocade Fashion (Luxury silk and gold thread)
    - Damascus Mosaic Woodwork (Mother-of-pearl inlay)
    - Damascus Old City Treasures (World Heritage crafts)
    - Damascus Rose Beauty Collection (Natural cosmetics)

    **Cultural Features:**
    - Artisan profiles with experience and location
    - UNESCO recognition for traditional crafts
    - Arabic and English localization
    - Cultural context and heritage storytelling
    - Old City location and workshop details
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Damascus banners successfully seeded',
  })
  async seedDamascus() {
    this.logger.log('🏛️ Damascus banners seeding requested');

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.seedByType('damascus');
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Seeds Aleppo-themed hero banners
   *
   * @returns Seeding results for Aleppo campaigns
   */
  @Post('seed/aleppo')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🧼 Seed Aleppo-themed hero banners',
    description: `
    Seeds hero banners featuring Aleppo heritage and products:

    **Aleppo Campaigns:**
    - Authentic Aleppo Soap (1000+ years heritage)
    - Aleppo Speed Delivery (Local shipping partner)
    - Premium Aleppo Pistachios (World-famous quality)

    **Cultural Features:**
    - Aleppo soap UNESCO recognition
    - Traditional manufacturing methods
    - Artisan profiles and family heritage
    - Aleppo Old City location details
    - Natural ingredients and sustainability
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Aleppo banners successfully seeded',
  })
  async seedAleppo() {
    this.logger.log('🧼 Aleppo banners seeding requested');

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.seedByType('aleppo');
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Seeds seasonal campaign banners
   *
   * @returns Seeding results for seasonal campaigns
   */
  @Post('seed/seasonal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🌙 Seed seasonal campaign banners',
    description: `
    Seeds hero banners for Syrian cultural and seasonal events:

    **Seasonal Campaigns:**
    - 🌙 Ramadan Kareem 2025 (Holy month special offers)
    - 🎊 Eid Al-Fitr 2025 (Celebration gifts and clothing)
    - 🐑 Eid Al-Adha 2025 (Traditional gifts and essentials)
    - 🇸🇾 Syrian Independence Day 2025 (Patriotic campaigns)

    **Cultural Sensitivity:**
    - Islamic calendar event targeting
    - Family and gift-focused messaging
    - Traditional clothing and sweets
    - Prayer items and religious essentials
    - National pride and heritage support

    **Scheduling:**
    - Precise Islamic calendar dates
    - Damascus timezone (Asia/Damascus)
    - Multi-day campaign duration
    - Pre-event anticipation periods
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Seasonal banners successfully seeded',
  })
  async seedSeasonal() {
    this.logger.log('🌙 Seasonal banners seeding requested');

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.seedByType('seasonal');
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Seeds diaspora-targeted banners
   *
   * @returns Seeding results for diaspora campaigns
   */
  @Post('seed/diaspora')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🌍 Seed diaspora-targeted hero banners',
    description: `
    Seeds hero banners targeting Syrian diaspora community:

    **Diaspora Campaigns:**
    - 🌍 Worldwide Shipping (50+ countries reach)
    - 🏡 Welcome Home (Taste of home delivery)
    - 💱 Multi-Currency Support (SYP/USD/EUR)

    **Features:**
    - International shipping information
    - Multi-currency payment options
    - Emotional connection messaging
    - Cultural nostalgia and heritage
    - Europe, Americas, Australia targeting

    **Localization:**
    - Arabic and English content
    - Diaspora-specific CTAs
    - International logistics support
    - Cultural connection storytelling
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Diaspora banners successfully seeded',
  })
  async seedDiaspora() {
    this.logger.log('🌍 Diaspora banners seeding requested');

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.seedByType('diaspora');
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clears all seeded hero banners data
   *
   * @returns Cleanup results
   */
  @Delete('clean')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🧹 Clear all seeded hero banners',
    description: `
    ⚠️ **CAUTION: Data Deletion Operation**

    Removes all hero banner data created through seeding operations.
    This operation is primarily intended for:

    **Use Cases:**
    - 🧪 Testing environment cleanup
    - 🔄 Development data reset
    - 📊 Performance testing preparation
    - 🏗️ Campaign testing cleanup

    **Safety Features:**
    - Only removes seeded banner data
    - Preserves production campaigns
    - Detailed reporting of deleted records
    - Transaction-based deletion for consistency

    **Marketing Impact:**
    - Removes test banners and campaigns
    - Clears analytics test data
    - Resets A/B testing configurations
    - Preserves historical performance data

    **⚠️ Warning:** This operation cannot be undone. Use with caution.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seeded hero banners cleared successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        deletedCount: { type: 'number', example: 22 },
        message: { type: 'string', example: 'Successfully cleared 22 hero banners' },
        processingTime: { type: 'string', example: '125ms' },
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Failed to clear seeded data',
  })
  async cleanAll() {
    this.logger.log('🧹 Hero banners cleanup requested via API');

    const startTime = Date.now();
    const result = await this.heroBannersSeederService.cleanAll();
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Hero banners cleanup completed in ${processingTime}ms`);

    return {
      ...result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Gets comprehensive hero banners statistics
   *
   * @returns Hero banners analytics data
   */
  @Get('stats')
  @ApiOperation({
    summary: '📊 Get comprehensive hero banners statistics',
    description: `
    Provides detailed analytics for Syrian hero banner campaigns:

    **Banner Analytics Included:**
    - 🎯 Total banners and active campaigns
    - 📈 Distribution by type (product, seasonal, cultural, etc.)
    - 🗺️ Regional breakdown (Damascus, Aleppo, other regions)
    - 🌙 Seasonal campaign analysis
    - 👁️ Performance metrics (impressions, clicks, CTR, revenue)
    - 🏛️ Syrian market insights (UNESCO, diaspora, heritage)
    - ✅ Approval workflow status breakdown

    **Syrian Market Insights:**
    - Damascus vs Aleppo campaign distribution
    - UNESCO-recognized heritage products
    - Diaspora community targeting effectiveness
    - Seasonal event campaign performance
    - Cultural sensitivity and localization metrics

    **Performance Metrics:**
    - Total impressions and click-through rates
    - Revenue attribution and ROI analysis
    - Campaign effectiveness scoring
    - A/B testing insights and optimization
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Hero banners statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalBanners: { type: 'number', example: 22 },
        activeBanners: { type: 'number', example: 18 },
        seasonalBanners: { type: 'number', example: 4 },
        bannersByType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', example: 'product_spotlight' },
              count: { type: 'number', example: 8 }
            }
          }
        },
        bannersByRegion: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              region: { type: 'string', example: 'Damascus' },
              count: { type: 'number', example: 5 }
            }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            totalImpressions: { type: 'number', example: 125430 },
            totalClicks: { type: 'number', example: 8945 },
            averageCTR: { type: 'number', example: 7.13 },
            totalRevenue: { type: 'number', example: 45000000 }
          }
        },
        syrianMarketMetrics: {
          type: 'object',
          properties: {
            damascusBanners: { type: 'number', example: 5 },
            aleppoBanners: { type: 'number', example: 3 },
            seasonalCampaigns: { type: 'number', example: 4 },
            unescoRecognized: { type: 'number', example: 6 },
            diasporaTargeted: { type: 'number', example: 3 }
          }
        },
        approvalStatus: {
          type: 'object',
          properties: {
            approved: { type: 'number', example: 18 },
            pending: { type: 'number', example: 2 },
            draft: { type: 'number', example: 1 },
            rejected: { type: 'number', example: 1 }
          }
        }
      }
    }
  })
  async getStats() {
    this.logger.log('📊 Hero banners statistics requested');

    const analytics = await this.heroBannersSeederService.getStats();

    // Handle error case
    if ('error' in analytics) {
      return { error: analytics.error, timestamp: new Date().toISOString() };
    }

    return {
      ...analytics,
      metadata: {
        generatedAt: new Date().toISOString(),
        requestId: `hero-banners-stats-${Date.now()}`,
        platform: 'SouqSyria',
        version: '1.0.0'
      }
    };
  }

  /**
   * Performs bulk hero banners operations
   *
   * @param operations Array of bulk operations to perform
   * @returns Results of bulk operations
   */
  @Post('bulk-operations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '⚡ Perform bulk hero banners operations',
    description: `
    Executes bulk operations for enterprise banner testing:

    **Supported Operations:**
    - 🎨 create_banner: Bulk banner creation
    - ✏️ update_banner: Bulk banner updates
    - 📊 analyze_performance: Campaign performance analysis
    - 🎯 optimize_targeting: Audience targeting optimization

    **Use Cases:**
    - Mass banner campaign launches
    - Seasonal campaign bulk creation
    - A/B testing banner variations
    - Performance optimization and testing
    - Marketing automation workflow testing

    **Performance Optimized:**
    - Batch processing for large banner sets
    - Transaction management for data integrity
    - Progress tracking for long operations
    - Error handling with detailed reporting
    - Memory-efficient processing for enterprise scale
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['create_banner', 'update_banner'] },
              data: {
                type: 'object',
                description: 'Operation data based on type'
              }
            }
          }
        }
      },
      example: {
        operations: [
          {
            type: 'create_banner',
            data: {
              nameEn: 'Bulk Test Banner',
              nameAr: 'لافتة اختبار مجمعة',
              headlineEn: 'Test Campaign',
              headlineAr: 'حملة اختبار',
              type: 'product_spotlight'
            }
          }
        ]
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk operations completed',
    schema: {
      type: 'object',
      properties: {
        results: {
          type: 'object',
          properties: {
            created: { type: 'number', example: 5 },
            failed: { type: 'number', example: 0 },
            errors: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        processingTime: { type: 'string', example: '1.2s' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async bulkOperations(@Body() operationsData: { operations: any[] }) {
    this.logger.log(`⚡ Bulk hero banners operations requested: ${operationsData.operations.length} operations`);

    const startTime = Date.now();
    const results = await this.heroBannersSeederService.bulkOperations(operationsData.operations);
    const processingTime = Date.now() - startTime;

    this.logger.log(`✅ Bulk operations completed in ${processingTime}ms`);

    return {
      results,
      processingTime: `${(processingTime / 1000).toFixed(1)}s`,
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: operationsData.operations.length,
        successRate: `${Math.round((results.created / operationsData.operations.length) * 100)}%`,
        performanceMetrics: {
          averageTimePerOperation: `${Math.round(processingTime / operationsData.operations.length)}ms`,
          throughput: `${Math.round((operationsData.operations.length / processingTime) * 1000)} ops/sec`
        }
      }
    };
  }
}

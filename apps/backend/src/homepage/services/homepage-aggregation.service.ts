/**
 * @file homepage-aggregation.service.ts
 * @description Service for aggregating all homepage data in a single API call
 *
 * FEATURES:
 * - Fetches hero banners, featured categories, and product carousels in parallel
 * - Optimized for performance with Promise.all
 * - Language and currency support
 * - Personalization support (future enhancement)
 * - Syrian market optimization
 *
 * AGGREGATED DATA:
 * - Hero Banners: Active promotional banners for carousel
 * - Featured Categories: Curated category highlights
 * - Product Carousels: Dynamic product sections (new arrivals, best sellers, etc.)
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Injectable, Logger } from '@nestjs/common';
import { HeroBannersService } from '../../hero-banners/services/hero-banners.service';
import { FeaturedCategoriesService } from '../../featured-categories/services/featured-categories.service';
import { ProductCarouselsService } from '../../product-carousels/services/product-carousels.service';
import { CarouselType } from '../../product-carousels/entities/product-carousel.entity';

/**
 * Query parameters for homepage data
 */
export interface HomepageQueryDto {
  /** Language preference (en | ar) */
  lang?: string;
  /** Currency preference (SYP | USD | EUR) */
  currency?: string;
  /** Enable personalized recommendations (future enhancement) */
  personalized?: boolean;
  /** User ID for personalization (future enhancement) */
  userId?: number;
}

/**
 * Homepage aggregation response
 */
export interface HomepageDataDto {
  /** Active hero banners for carousel */
  heroBanners: any[];
  /** Featured categories for homepage grid */
  featuredCategories: any[];
  /** Product carousels with populated products */
  productCarousels: any[];
  /** Response metadata */
  metadata: {
    timestamp: string;
    language: string;
    currency: string;
    personalized: boolean;
  };
}

/**
 * Homepage Aggregation Service
 *
 * Provides a single aggregated API endpoint for all homepage data.
 * Optimized for performance with parallel data fetching.
 */
@Injectable()
export class HomepageAggregationService {
  private readonly logger = new Logger(HomepageAggregationService.name);

  constructor(
    private readonly heroBannersService: HeroBannersService,
    private readonly featuredCategoriesService: FeaturedCategoriesService,
    private readonly productCarouselsService: ProductCarouselsService,
  ) {}

  /**
   * Get complete homepage data
   *
   * Fetches all required data for homepage in a single optimized call.
   * Uses Promise.all for parallel execution to minimize response time.
   *
   * @param query - Query parameters for customization
   * @returns Complete homepage data with metadata
   */
  async getHomepageData(
    query: HomepageQueryDto = {},
  ): Promise<HomepageDataDto> {
    this.logger.log('Fetching homepage data...');
    const startTime = Date.now();

    // Set defaults
    const lang = query.lang || 'ar'; // Arabic is primary for Syrian market
    const currency = query.currency || 'SYP'; // Syrian Pound is default
    const personalized = query.personalized || false;

    try {
      // Fetch all data in parallel for optimal performance
      const [heroBanners, featuredCategories, productCarousels] =
        await Promise.all([
          this.fetchHeroBanners(lang),
          this.fetchFeaturedCategories(lang),
          this.fetchProductCarousels(query),
        ]);

      const duration = Date.now() - startTime;
      this.logger.log(`Homepage data fetched in ${duration}ms`);

      return {
        heroBanners,
        featuredCategories,
        productCarousels,
        metadata: {
          timestamp: new Date().toISOString(),
          language: lang,
          currency,
          personalized,
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch homepage data: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  /**
   * Fetch active hero banners
   *
   * Gets currently scheduled and active hero banners.
   * Limits to 5 banners for optimal carousel performance.
   *
   * @param lang - Language preference
   * @returns Array of active hero banners
   */
  private async fetchHeroBanners(lang: string): Promise<any[]> {
    try {
      // Fetch active banners using the hero-banners service
      const result = await this.heroBannersService.findAll({
        isActive: true,
        approvalStatus: 'approved',
        activeAt: new Date(),
        page: 1,
        limit: 5,
        sortBy: 'priority',
        sortOrder: 'ASC',
      });

      this.logger.log(`Fetched ${result.data.length} hero banners`);
      return result.data;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch hero banners: ${(error as Error).message}`,
      );
      return []; // Return empty array on error to prevent homepage failure
    }
  }

  /**
   * Fetch featured categories
   *
   * Gets active featured categories for homepage display.
   * Limits to 12 categories for optimal grid layout.
   *
   * @param lang - Language preference
   * @returns Array of featured categories
   */
  private async fetchFeaturedCategories(lang: string): Promise<any[]> {
    try {
      const categories = await this.featuredCategoriesService.findActive(12);
      this.logger.log(`Fetched ${categories.length} featured categories`);
      return categories;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch featured categories: ${(error as Error).message}`,
      );
      return []; // Return empty array on error
    }
  }

  /**
   * Fetch product carousels with populated products
   *
   * Gets active carousels with dynamically populated products.
   * Includes multiple carousel types for varied content.
   *
   * @param query - Query parameters
   * @returns Array of carousels with products
   */
  private async fetchProductCarousels(query: HomepageQueryDto): Promise<any[]> {
    try {
      // Define carousel types to fetch
      const carouselTypes: CarouselType[] = [
        CarouselType.NEW_ARRIVALS,
        CarouselType.BEST_SELLERS,
        CarouselType.TRENDING,
      ];

      // Add recommended carousel if personalized
      if (query.personalized && query.userId) {
        carouselTypes.push(CarouselType.RECOMMENDED);
      }

      const carousels =
        await this.productCarouselsService.findActiveWithProducts({
          types: carouselTypes,
          limit: 10,
        });

      this.logger.log(`Fetched ${carousels.length} product carousels`);
      return carousels;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch product carousels: ${(error as Error).message}`,
      );
      return []; // Return empty array on error
    }
  }

  /**
   * Get homepage performance metrics
   *
   * Returns aggregated performance metrics for monitoring.
   *
   * @returns Performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    heroBannersCount: number;
    featuredCategoriesCount: number;
    productCarouselsCount: number;
    totalProducts: number;
  }> {
    try {
      const [heroBannersCount, featuredCategoriesCount, carousels] =
        await Promise.all([
          this.heroBannersService
            .findAll({
              isActive: true,
              approvalStatus: 'approved',
              page: 1,
              limit: 1,
            })
            .then((result) => result.meta.totalItems),
          this.featuredCategoriesService.getActiveCount(),
          this.productCarouselsService.findActiveWithProducts({ limit: 50 }),
        ]);

      const totalProducts = carousels.reduce(
        (sum, carousel) => sum + carousel.products.length,
        0,
      );

      return {
        heroBannersCount,
        featuredCategoriesCount,
        productCarouselsCount: carousels.length,
        totalProducts,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch performance metrics: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}

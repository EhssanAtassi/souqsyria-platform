/**
 * @file homepage.module.ts
 * @description Module for Homepage data aggregation
 *
 * AGGREGATES:
 * - HeroBannersModule - Hero banner carousel
 * - FeaturedCategoriesModule - Category highlights
 * - ProductCarouselsModule - Dynamic product sections
 *
 * EXPORTS:
 * - HomepageAggregationService - For use in other modules
 *
 * FEATURES:
 * - Single API endpoint for all homepage data
 * - Optimized parallel data fetching
 * - Bilingual support (Arabic/English)
 * - Multi-currency support (SYP/USD/EUR)
 * - Performance metrics and monitoring
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Module } from '@nestjs/common';
import { HomepageAggregationService } from './services/homepage-aggregation.service';
import { HomepageController } from './controllers/homepage.controller';
import { HeroBannersModule } from '../hero-banners/hero-banners.module';
import { FeaturedCategoriesModule } from '../featured-categories/featured-categories.module';
import { ProductCarouselsModule } from '../product-carousels/product-carousels.module';

/**
 * Homepage Module
 *
 * Provides a unified API endpoint for fetching all homepage data
 * in a single optimized request. Aggregates data from:
 * - Hero banners for main carousel
 * - Featured categories for category grid
 * - Product carousels for dynamic product sections
 *
 * Optimized for Syrian market with:
 * - Arabic-first language support
 * - Syrian Pound (SYP) as default currency
 * - Mobile-first optimization (78% mobile users)
 * - Parallel data fetching for performance
 */
@Module({
  imports: [
    HeroBannersModule,
    FeaturedCategoriesModule,
    ProductCarouselsModule,
  ],
  controllers: [HomepageController],
  providers: [HomepageAggregationService],
  exports: [HomepageAggregationService], // Export for use in other modules if needed
})
export class HomepageModule {}

/**
 * @file product-carousels.module.ts
 * @description Module for Product Carousels management
 *
 * EXPORTS:
 * - ProductCarouselsService - For use in HomepageModule
 *
 * IMPORTS:
 * - TypeOrmModule (ProductCarousel, ProductCarouselItem, ProductEntity)
 *
 * FEATURES:
 * - Dynamic product carousel management
 * - Multiple carousel types (new_arrivals, best_sellers, trending, etc.)
 * - Bilingual support (Arabic/English)
 * - Admin CRUD operations
 * - Public homepage API
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductCarousel } from './entities/product-carousel.entity';
import { ProductCarouselItem } from './entities/product-carousel-item.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { ProductCarouselsService } from './services/product-carousels.service';
import { ProductCarouselsController } from './controllers/product-carousels.controller';

/**
 * Product Carousels Module
 *
 * Provides functionality for managing dynamic product carousels on homepage
 * with intelligent product population based on carousel type.
 *
 * Carousel Types:
 * - new_arrivals: Recently added products
 * - best_sellers: Top selling products
 * - trending: High engagement products
 * - recommended: Personalized recommendations
 * - custom: Manually curated products
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCarousel,
      ProductCarouselItem,
      ProductEntity,
    ]),
  ],
  controllers: [
    ProductCarouselsController,
  ],
  providers: [
    ProductCarouselsService,
  ],
  exports: [ProductCarouselsService], // Export for use in HomepageModule
})
export class ProductCarouselsModule {}

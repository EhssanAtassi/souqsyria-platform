/**
 * @file featured-categories.module.ts
 * @description Module for Featured Categories management
 *
 * EXPORTS:
 * - FeaturedCategoriesService - For use in other modules
 *
 * IMPORTS:
 * - TypeOrmModule (FeaturedCategory, Category entities)
 * - CategoriesModule (for category validation)
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturedCategory } from './entities/featured-category.entity';
import { Category } from '../categories/entities/category.entity';
import { FeaturedCategoriesService } from './services/featured-categories.service';
import { FeaturedCategoriesController } from './controllers/featured-categories.controller';

/**
 * Featured Categories Module
 *
 * Provides functionality for managing featured categories on homepage
 * with bilingual support, scheduling, and Syrian market features.
 */
@Module({
  imports: [TypeOrmModule.forFeature([FeaturedCategory, Category])],
  controllers: [FeaturedCategoriesController],
  providers: [FeaturedCategoriesService],
  exports: [FeaturedCategoriesService], // Export for use in HomepageModule
})
export class FeaturedCategoriesModule {}

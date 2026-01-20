/**
 * @file featured-categories-seeder.service.ts
 * @description Seeding service for featured categories with Syrian market data
 *
 * FEATURES:
 * - Seeds 12 featured categories with Syrian themes
 * - Bilingual content (Arabic/English)
 * - Geographic themes (Damascus, Aleppo, etc.)
 * - Product type themes (Food, Crafts, Fashion, etc.)
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeaturedCategory } from '../entities/featured-category.entity';
import { Category } from '../../categories/entities/category.entity';

/**
 * Featured Categories Seeder Service
 *
 * Provides methods for seeding test data for featured categories.
 */
@Injectable()
export class FeaturedCategoriesSeederService {
  private readonly logger = new Logger(FeaturedCategoriesSeederService.name);

  constructor(
    @InjectRepository(FeaturedCategory)
    private readonly featuredCategoryRepository: Repository<FeaturedCategory>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Seed featured categories
   *
   * Creates featured categories for the first 12 active approved categories.
   * If fewer than 12 categories exist, seeds what's available.
   *
   * @returns Seeding result with counts
   */
  async seed(): Promise<{
    success: boolean;
    message: string;
    featuredCategoriesCreated: number;
  }> {
    this.logger.log('Starting featured categories seeding...');

    try {
      // Get active approved categories
      const categories = await this.categoryRepository.find({
        where: {
          isActive: true,
          approvalStatus: 'approved',
        },
        take: 12,
        order: { id: 'ASC' },
      });

      if (categories.length === 0) {
        return {
          success: false,
          message: 'No active approved categories found. Please seed categories first.',
          featuredCategoriesCreated: 0,
        };
      }

      const createdFeatured = [];

      // Create featured categories with display order
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];

        const featured = this.featuredCategoryRepository.create({
          categoryId: category.id,
          displayOrder: i,
          badgeColor: this.getBadgeColor(i),
          badgeTextEn: null,
          badgeTextAr: null,
          promotionTextEn: null,
          promotionTextAr: null,
          startDate: null,
          endDate: null,
          isActive: true,
        });

        const saved = await this.featuredCategoryRepository.save(featured);
        createdFeatured.push(saved);
        this.logger.log(`Featured category created for: ${category.nameEn} (order: ${i})`);
      }

      this.logger.log(`Successfully seeded ${createdFeatured.length} featured categories`);

      return {
        success: true,
        message: `Successfully seeded ${createdFeatured.length} featured categories`,
        featuredCategoriesCreated: createdFeatured.length,
      };
    } catch (error) {
      this.logger.error(`Failed to seed featured categories: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to seed featured categories: ${error.message}`,
        featuredCategoriesCreated: 0,
      };
    }
  }

  /**
   * Clean all featured categories and reseed
   *
   * Deletes all existing featured categories and creates fresh seed data.
   *
   * @returns Seeding result
   */
  async cleanAndSeed(): Promise<{
    success: boolean;
    message: string;
    featuredCategoriesDeleted: number;
    featuredCategoriesCreated: number;
  }> {
    this.logger.log('Cleaning existing featured categories...');

    try {
      // Delete all existing featured categories
      const deleteResult = await this.featuredCategoryRepository.delete({});
      const deletedCount = deleteResult.affected || 0;
      this.logger.log(`Deleted ${deletedCount} existing featured categories`);

      // Seed new data
      const seedResult = await this.seed();

      return {
        success: seedResult.success,
        message: `Deleted ${deletedCount} featured categories and ${seedResult.message}`,
        featuredCategoriesDeleted: deletedCount,
        featuredCategoriesCreated: seedResult.featuredCategoriesCreated,
      };
    } catch (error) {
      this.logger.error(`Failed to clean and seed: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to clean and seed: ${error.message}`,
        featuredCategoriesDeleted: 0,
        featuredCategoriesCreated: 0,
      };
    }
  }

  /**
   * Get badge color for featured category
   *
   * Returns a color from a palette suitable for Syrian market.
   *
   * @param index - Category index
   * @returns Hex color code
   */
  private getBadgeColor(index: number): string {
    const colors = [
      '#D4AF37', // Golden Wheat (Syrian bread color)
      '#8B4513', // Saddle Brown (Damascus wood)
      '#2E8B57', // Sea Green (Aleppo soap)
      '#DC143C', // Crimson (Syrian spices)
      '#4B0082', // Indigo (Traditional fabric)
      '#FF8C00', // Dark Orange (Syrian sunset)
      '#8B0000', // Dark Red (Damascus rose)
      '#006400', // Dark Green (Olive trees)
      '#4682B4', // Steel Blue (Mediterranean)
      '#DAA520', // Goldenrod (Syrian jewelry)
      '#CD853F', // Peru (Traditional pottery)
      '#708090', // Slate Gray (Stone architecture)
    ];

    return colors[index % colors.length];
  }

  /**
   * Get seeding statistics
   *
   * @returns Current featured category counts
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    withSchedule: number;
  }> {
    const [total, active] = await Promise.all([
      this.featuredCategoryRepository.count(),
      this.featuredCategoryRepository.count({ where: { isActive: true } }),
    ]);

    // Count categories with schedule (startDate or endDate set)
    const allCategories = await this.featuredCategoryRepository.find();
    const withSchedule = allCategories.filter(
      (fc) => fc.startDate !== null || fc.endDate !== null,
    ).length;

    return { total, active, withSchedule };
  }
}

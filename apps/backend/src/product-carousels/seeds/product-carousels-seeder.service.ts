/**
 * @file product-carousels-seeder.service.ts
 * @description Seeding service for product carousels with Syrian market data
 *
 * FEATURES:
 * - Seeds 4 product carousels (new_arrivals, best_sellers, trending, custom)
 * - Bilingual content (Arabic/English)
 * - Syrian market themes
 * - Clean database and reseed capability
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCarousel, CarouselType } from '../entities/product-carousel.entity';

/**
 * Product Carousels Seeder Service
 *
 * Provides methods for seeding test data for product carousels.
 */
@Injectable()
export class ProductCarouselsSeederService {
  private readonly logger = new Logger(ProductCarouselsSeederService.name);

  constructor(
    @InjectRepository(ProductCarousel)
    private readonly carouselRepository: Repository<ProductCarousel>,
  ) {}

  /**
   * Seed product carousels
   *
   * Creates 4 carousels with Syrian market themes:
   * 1. New Arrivals (new_arrivals)
   * 2. Best Sellers (best_sellers)
   * 3. Trending Now (trending)
   * 4. Artisan Picks (custom)
   *
   * @returns Seeding result with counts
   */
  async seed(): Promise<{
    success: boolean;
    message: string;
    carouselsCreated: number;
  }> {
    this.logger.log('Starting product carousels seeding...');

    try {
      const carouselsData = this.getCarouselsData();
      const createdCarousels = [];

      for (const carouselData of carouselsData) {
        const carousel = this.carouselRepository.create(carouselData);
        const saved = await this.carouselRepository.save(carousel);
        createdCarousels.push(saved);
        this.logger.log(`Created carousel: ${saved.titleEn}`);
      }

      this.logger.log(`Successfully seeded ${createdCarousels.length} product carousels`);

      return {
        success: true,
        message: `Successfully seeded ${createdCarousels.length} product carousels`,
        carouselsCreated: createdCarousels.length,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to seed product carousels: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        message: `Failed to seed product carousels: ${(error as Error).message}`,
        carouselsCreated: 0,
      };
    }
  }

  /**
   * Clean all carousels and reseed
   *
   * Deletes all existing carousels and creates fresh seed data.
   *
   * @returns Seeding result
   */
  async cleanAndSeed(): Promise<{
    success: boolean;
    message: string;
    carouselsDeleted: number;
    carouselsCreated: number;
  }> {
    this.logger.log('Cleaning existing carousels...');

    try {
      // Delete all existing carousels
      const deleteResult = await this.carouselRepository.delete({});
      const deletedCount = deleteResult.affected || 0;
      this.logger.log(`Deleted ${deletedCount} existing carousels`);

      // Seed new data
      const seedResult = await this.seed();

      return {
        success: seedResult.success,
        message: `Deleted ${deletedCount} carousels and ${seedResult.message}`,
        carouselsDeleted: deletedCount,
        carouselsCreated: seedResult.carouselsCreated,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to clean and seed: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        message: `Failed to clean and seed: ${(error as Error).message}`,
        carouselsDeleted: 0,
        carouselsCreated: 0,
      };
    }
  }

  /**
   * Get carousels seed data
   *
   * Returns array of carousel configurations with Syrian market themes.
   *
   * @returns Array of carousel data
   */
  private getCarouselsData(): Array<Partial<ProductCarousel>> {
    return [
      {
        type: CarouselType.NEW_ARRIVALS,
        titleEn: 'New Arrivals',
        titleAr: 'الوافدون الجدد',
        descriptionEn: 'Discover the latest products added to our Syrian marketplace',
        descriptionAr: 'اكتشف أحدث المنتجات المضافة إلى سوقنا السوري',
        maxProducts: 20,
        refreshInterval: 30,
        displayOrder: 0,
        isActive: true,
      },
      {
        type: CarouselType.BEST_SELLERS,
        titleEn: 'Best Sellers',
        titleAr: 'الأكثر مبيعاً',
        descriptionEn: 'Most popular products loved by Syrian customers',
        descriptionAr: 'المنتجات الأكثر شعبية التي يحبها العملاء السوريون',
        maxProducts: 20,
        refreshInterval: 60,
        displayOrder: 1,
        isActive: true,
      },
      {
        type: CarouselType.TRENDING,
        titleEn: 'Trending Now',
        titleAr: 'رائج الآن',
        descriptionEn: 'Products trending among Syrian shoppers this week',
        descriptionAr: 'المنتجات الرائجة بين المتسوقين السوريين هذا الأسبوع',
        maxProducts: 20,
        refreshInterval: 30,
        displayOrder: 2,
        isActive: true,
      },
      {
        type: CarouselType.CUSTOM,
        titleEn: 'Artisan Picks',
        titleAr: 'اختيارات الحرفيين',
        descriptionEn: 'Handpicked Syrian artisan products and traditional crafts',
        descriptionAr: 'منتجات حرفية سورية مختارة يدوياً وحرف تقليدية',
        maxProducts: 15,
        refreshInterval: null, // Custom carousels don't auto-refresh
        displayOrder: 3,
        isActive: true,
      },
    ];
  }

  /**
   * Get seeding statistics
   *
   * @returns Current carousel counts by type
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const [total, active] = await Promise.all([
      this.carouselRepository.count(),
      this.carouselRepository.count({ where: { isActive: true } }),
    ]);

    const byType: Record<string, number> = {};
    for (const type of Object.values(CarouselType)) {
      byType[type] = await this.carouselRepository.count({ where: { type } });
    }

    return { total, active, byType };
  }
}

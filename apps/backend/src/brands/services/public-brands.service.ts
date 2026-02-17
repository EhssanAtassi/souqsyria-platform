/**
 * @file public-brands.service.ts
 * @description Public Brands Service - Provides read-only access to active, approved brands
 *
 * RESPONSIBILITIES:
 * - Retrieve active and approved brands for public display
 * - Order brands by popularity and product count
 * - Provide brand metadata for frontend consumption
 * - Support bilingual brand names (English/Arabic)
 *
 * FEATURES:
 * - Public access only (no authentication required)
 * - Only returns active and approved brands
 * - Optimized query selection
 * - Sorted by product count and name
 *
 * @author SouqSyria Development Team
 * @since 2025-02-16
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';

/**
 * PUBLIC BRANDS SERVICE
 *
 * Service for retrieving brands for public display.
 * Only returns brands that are both active and approved.
 */
@Injectable()
export class PublicBrandsService {
  private readonly logger = new Logger(PublicBrandsService.name);

  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {
    this.logger.log('🎨 Public Brands Service initialized');
  }

  /**
   * FIND ALL ACTIVE BRANDS
   *
   * Retrieves all brands that are active and approved for public display.
   * Returns a lightweight response with essential fields only.
   *
   * Features:
   * - Only active brands (isActive = true)
   * - Only approved brands (approvalStatus = 'approved')
   * - Ordered by productCount DESC, then by name ASC
   * - Returns bilingual names (English/Arabic)
   * - Includes brand logo URLs
   *
   * @returns Array of active and approved brands
   *
   * @example
   * const brands = await service.findAllActive();
   * // Returns: [
   * //   { id: 1, name: 'Apple', nameAr: 'أبل', slug: 'apple', logoUrl: '...', productCount: 150 },
   * //   { id: 2, name: 'Samsung', nameAr: 'سامسونج', slug: 'samsung', logoUrl: '...', productCount: 120 }
   * // ]
   */
  async findAllActive(): Promise<Brand[]> {
    this.logger.log('📋 Fetching all active brands');

    try {
      const brands = await this.brandRepository.find({
        where: {
          isActive: true,
          approvalStatus: 'approved',
        },
        select: ['id', 'name', 'nameAr', 'slug', 'logoUrl', 'productCount'],
        order: {
          productCount: 'DESC', // Popular brands first
          name: 'ASC', // Alphabetical for equal product counts
        },
      });

      this.logger.log(`✅ Retrieved ${brands.length} active brands`);

      return brands;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to retrieve active brands: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}

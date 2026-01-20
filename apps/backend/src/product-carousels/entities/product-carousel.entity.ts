/**
 * @file product-carousel.entity.ts
 * @description Product Carousel entity for dynamic homepage product sections
 *
 * FEATURES:
 * - Multiple carousel types (new_arrivals, best_sellers, trending, recommended, custom)
 * - Bilingual titles and descriptions (Arabic/English)
 * - Dynamic population based on type
 * - Configurable max products and refresh interval
 * - Display order management
 * - Soft delete with restore functionality
 *
 * SYRIAN MARKET FEATURES:
 * - Arabic text support for titles and descriptions
 * - Flexible types for cultural preferences
 * - Optimized for mobile-first Syrian users
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductCarousel:
 *       type: object
 *       description: Dynamic product carousel for homepage
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCarouselItem } from './product-carousel-item.entity';

/**
 * Carousel type enumeration
 *
 * - new_arrivals: Recently added products (ORDER BY createdAt DESC)
 * - best_sellers: Top selling products (ORDER BY totalSales DESC)
 * - trending: Products with high recent engagement (ORDER BY recentEngagement DESC)
 * - recommended: Personalized recommendations (user-specific)
 * - deals_of_day: Daily deals and promotions
 * - clearance: Clearance/sale items with discounts
 * - limited_stock: Products with limited stock (creates urgency)
 * - featured: Highlighted/featured products
 * - custom: Manually curated products (via junction table)
 */
export enum CarouselType {
  NEW_ARRIVALS = 'new_arrivals',
  BEST_SELLERS = 'best_sellers',
  TRENDING = 'trending',
  RECOMMENDED = 'recommended',
  DEALS_OF_DAY = 'deals_of_day',
  CLEARANCE = 'clearance',
  LIMITED_STOCK = 'limited_stock',
  FEATURED = 'featured',
  CUSTOM = 'custom',
}

/**
 * Product Carousel Entity
 *
 * Defines dynamic product sections on homepage with automatic or manual population.
 * Supports Syrian market with bilingual content and mobile-first optimization.
 */
@Entity('product_carousels')
@Index(['isActive', 'displayOrder']) // Performance for active carousel queries
@Index(['type']) // Filter by carousel type
export class ProductCarousel {
  @ApiProperty({
    description: 'Unique identifier for the product carousel',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  // ================================
  // CAROUSEL CONFIGURATION
  // ================================

  /**
   * Carousel type determines population strategy
   */
  @ApiProperty({
    description: 'Carousel type (determines population strategy)',
    enum: CarouselType,
    example: CarouselType.NEW_ARRIVALS,
  })
  @Column({
    name: 'type',
    type: 'enum',
    enum: CarouselType,
  })
  type: CarouselType;

  /**
   * Maximum number of products to display
   * Range: 10-50
   */
  @ApiProperty({
    description: 'Maximum number of products to display',
    example: 20,
    default: 20,
    minimum: 10,
    maximum: 50,
  })
  @Column({ name: 'max_products', type: 'int', default: 20 })
  maxProducts: number;

  /**
   * Refresh interval in minutes (for dynamic types)
   * Minimum 5 minutes to avoid excessive database queries
   */
  @ApiProperty({
    description: 'Refresh interval in minutes (for dynamic carousels)',
    example: 30,
    minimum: 5,
    nullable: true,
  })
  @Column({ name: 'refresh_interval', type: 'int', nullable: true })
  refreshInterval: number;

  // ================================
  // MULTILINGUAL CONTENT
  // ================================

  /**
   * Carousel title in English
   */
  @ApiProperty({
    description: 'Carousel section title in English',
    example: 'New Arrivals',
    maxLength: 100,
  })
  @Column({ name: 'title_en', length: 100 })
  titleEn: string;

  /**
   * Carousel title in Arabic
   */
  @ApiProperty({
    description: 'Carousel section title in Arabic',
    example: 'الوافدون الجدد',
    maxLength: 100,
  })
  @Column({ name: 'title_ar', length: 100 })
  titleAr: string;

  /**
   * Carousel description in English (optional)
   */
  @ApiProperty({
    description: 'Carousel description in English',
    example: 'Discover the latest products added to our store',
    nullable: true,
  })
  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  /**
   * Carousel description in Arabic (optional)
   */
  @ApiProperty({
    description: 'Carousel description in Arabic',
    example: 'اكتشف أحدث المنتجات المضافة إلى متجرنا',
    nullable: true,
  })
  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string;

  // ================================
  // DISPLAY CONFIGURATION
  // ================================

  /**
   * Display order position (0-based)
   * Lower values appear higher on homepage
   */
  @ApiProperty({
    description: 'Display order position (0-based, lower = higher priority)',
    example: 0,
    default: 0,
  })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  /**
   * Whether carousel is active and visible
   */
  @ApiProperty({
    description: 'Whether carousel is active and visible on homepage',
    example: true,
    default: true,
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // ================================
  // RELATIONSHIPS
  // ================================

  /**
   * Products in custom carousels (via junction table)
   * Only used for type = 'custom'
   */
  @ApiProperty({
    description: 'Manually curated products (for custom carousels)',
    type: () => [ProductCarouselItem],
    isArray: true,
  })
  @OneToMany(() => ProductCarouselItem, (item) => item.carousel, {
    cascade: true,
  })
  items: ProductCarouselItem[];

  // ================================
  // TIMESTAMPS
  // ================================

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Soft delete timestamp
   */
  @ApiProperty({
    description: 'Soft delete timestamp',
    nullable: true,
  })
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // ================================
  // BUSINESS LOGIC METHODS
  // ================================

  /**
   * Get title based on language preference
   * @param language Language preference ('en' | 'ar')
   * @returns Localized title
   */
  getTitle(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' && this.titleAr ? this.titleAr : this.titleEn;
  }

  /**
   * Get description based on language preference
   * @param language Language preference ('en' | 'ar')
   * @returns Localized description or null
   */
  getDescription(language: 'en' | 'ar' = 'en'): string | null {
    if (language === 'ar' && this.descriptionAr) {
      return this.descriptionAr;
    }
    return this.descriptionEn || null;
  }

  /**
   * Check if carousel is dynamically populated
   * @returns true if carousel type requires dynamic population
   */
  isDynamic(): boolean {
    return [
      CarouselType.NEW_ARRIVALS,
      CarouselType.BEST_SELLERS,
      CarouselType.TRENDING,
      CarouselType.RECOMMENDED,
    ].includes(this.type);
  }

  /**
   * Check if carousel is manually curated
   * @returns true if carousel type is custom
   */
  isManual(): boolean {
    return this.type === CarouselType.CUSTOM;
  }

  /**
   * Validate business rules
   * @returns Array of validation errors (empty if valid)
   */
  validate(): string[] {
    const errors: string[] = [];

    // Max products validation
    if (this.maxProducts < 10 || this.maxProducts > 50) {
      errors.push('Max products must be between 10 and 50');
    }

    // Refresh interval validation
    if (this.refreshInterval !== null && this.refreshInterval < 5) {
      errors.push('Refresh interval must be at least 5 minutes');
    }

    // Display order validation
    if (this.displayOrder < 0) {
      errors.push('Display order must be greater than or equal to 0');
    }

    // Refresh interval only for dynamic types
    if (this.refreshInterval && !this.isDynamic()) {
      errors.push('Refresh interval only applies to dynamic carousel types');
    }

    return errors;
  }

  /**
   * Get query strategy based on carousel type
   * @returns Query strategy description
   */
  getQueryStrategy(): string {
    switch (this.type) {
      case CarouselType.NEW_ARRIVALS:
        return 'ORDER BY createdAt DESC';
      case CarouselType.BEST_SELLERS:
        return 'ORDER BY totalSales DESC';
      case CarouselType.TRENDING:
        return 'ORDER BY recentEngagement DESC';
      case CarouselType.RECOMMENDED:
        return 'User-specific recommendation algorithm';
      case CarouselType.CUSTOM:
        return 'Manual product selection via junction table';
      default:
        return 'Unknown strategy';
    }
  }
}

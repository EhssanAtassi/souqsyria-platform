/**
 * @file product-carousel-item.entity.ts
 * @description Junction table for many-to-many relationship between carousels and products
 *
 * FEATURES:
 * - Links products to custom carousels
 * - Display order for product positioning
 * - Prevents duplicate product assignments
 * - Cascade delete when carousel or product is removed
 *
 * PURPOSE:
 * Only used for 'custom' carousel type where products are manually curated.
 * Dynamic carousels (new_arrivals, best_sellers, etc.) populate automatically.
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCarousel } from './product-carousel.entity';
import { ProductEntity } from '../../products/entities/product.entity';

/**
 * Product Carousel Item Entity
 *
 * Junction table for N:M relationship between carousels and products.
 * Only used for custom (manually curated) carousels.
 */
@Entity('product_carousel_items')
@Index(['carouselId', 'displayOrder']) // Performance for carousel product lists
@Index(['carouselId', 'productId'], { unique: true }) // Prevent duplicate assignments
export class ProductCarouselItem {
  @ApiProperty({
    description: 'Unique identifier for the carousel item',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  // ================================
  // RELATIONSHIPS
  // ================================

  /**
   * Reference to the product carousel
   */
  @ApiProperty({
    description: 'Product carousel this item belongs to',
    type: () => ProductCarousel,
  })
  @ManyToOne(() => ProductCarousel, (carousel) => carousel.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carousel_id' })
  carousel: ProductCarousel;

  @Column({ name: 'carousel_id', type: 'int', nullable: false })
  carouselId: number;

  /**
   * Reference to the product
   */
  @ApiProperty({
    description: 'Product in this carousel',
    type: () => ProductEntity,
  })
  @ManyToOne(() => ProductEntity, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'product_id', type: 'int', nullable: false })
  productId: number;

  // ================================
  // DISPLAY CONFIGURATION
  // ================================

  /**
   * Display order within the carousel (0-based)
   * Lower values appear first
   */
  @ApiProperty({
    description: 'Display order within carousel (0-based)',
    example: 0,
    default: 0,
  })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  // ================================
  // TIMESTAMPS
  // ================================

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

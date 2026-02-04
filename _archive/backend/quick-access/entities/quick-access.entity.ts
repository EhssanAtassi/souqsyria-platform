/**
 * @file quick-access.entity.ts
 * @description Quick Access Entity for SouqSyria Promotional Cards
 *
 * Stores promotional cards displayed in the header's quick access row.
 * Supports bilingual content (Arabic + English) with customizable badges.
 *
 * FEATURES:
 * - Bilingual fields for category, title, and subtitle
 * - Badge styling with gradient classes
 * - Display ordering for custom arrangement
 * - Soft delete for archiving old promotions
 * - Active/inactive status for visibility control
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * QuickAccess Entity
 *
 * @description Represents a promotional card in the header quick access row.
 * Maps to the `quick_access` table in the database.
 *
 * @swagger
 * components:
 *   schemas:
 *     QuickAccess:
 *       type: object
 *       required:
 *         - categoryEn
 *         - categoryAr
 *         - titleEn
 *         - titleAr
 *         - badgeClass
 *         - image
 *         - url
 */
@Entity('quick_access')
@Index(['isActive', 'displayOrder']) // Optimize queries for active items sorted by order
export class QuickAccess {
  /**
   * Unique identifier
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Unique identifier for the promotional card',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Category label in English
   * @example "Premium Deals"
   */
  @ApiProperty({
    description: 'Category label in English',
    example: 'Premium Deals',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  categoryEn: string;

  /**
   * Category label in Arabic
   * @example "عروض مميزة"
   */
  @ApiProperty({
    description: 'Category label in Arabic',
    example: 'عروض مميزة',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100 })
  categoryAr: string;

  /**
   * Main promotional title in English
   * @example "Damascene Delights"
   */
  @ApiProperty({
    description: 'Main promotional title in English',
    example: 'Damascene Delights',
    maxLength: 200,
  })
  @Column({ type: 'varchar', length: 200 })
  titleEn: string;

  /**
   * Main promotional title in Arabic
   * @example "المأكولات الدمشقية"
   */
  @ApiProperty({
    description: 'Main promotional title in Arabic',
    example: 'المأكولات الدمشقية',
    maxLength: 200,
  })
  @Column({ type: 'varchar', length: 200 })
  titleAr: string;

  /**
   * Secondary subtitle in English (optional)
   * @example "Save 30% on traditional sweets"
   */
  @ApiProperty({
    description: 'Secondary subtitle in English',
    example: 'Save 30% on traditional sweets',
    maxLength: 300,
    required: false,
  })
  @Column({ type: 'varchar', length: 300, nullable: true })
  subtitleEn?: string;

  /**
   * Secondary subtitle in Arabic (optional)
   * @example "وفر 30% على الحلويات التقليدية"
   */
  @ApiProperty({
    description: 'Secondary subtitle in Arabic',
    example: 'وفر 30% على الحلويات التقليدية',
    maxLength: 300,
    required: false,
  })
  @Column({ type: 'varchar', length: 300, nullable: true })
  subtitleAr?: string;

  /**
   * CSS class for badge gradient styling
   * @example "badge-gold"
   * @enum {string} badge-gold | badge-blue | badge-green | badge-purple | badge-orange | badge-red | badge-teal | badge-pink
   */
  @ApiProperty({
    description: 'CSS class for badge gradient styling',
    example: 'badge-gold',
    enum: ['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-orange', 'badge-red', 'badge-teal', 'badge-pink'],
  })
  @Column({ type: 'varchar', length: 50 })
  badgeClass: string;

  /**
   * URL to promotional image
   * @example "https://cdn.souqsyria.com/promos/damascene-sweets.jpg"
   */
  @ApiProperty({
    description: 'URL to promotional image',
    example: 'https://cdn.souqsyria.com/promos/damascene-sweets.jpg',
    maxLength: 500,
  })
  @Column({ type: 'varchar', length: 500 })
  image: string;

  /**
   * Destination URL when card is clicked
   * @example "/category/damascene-sweets"
   */
  @ApiProperty({
    description: 'Destination URL when card is clicked',
    example: '/category/damascene-sweets',
    maxLength: 300,
  })
  @Column({ type: 'varchar', length: 300 })
  url: string;

  /**
   * Display order (lower numbers appear first)
   * @example 1
   */
  @ApiProperty({
    description: 'Display order (lower numbers appear first)',
    example: 1,
    minimum: 0,
  })
  @Column({ type: 'int', default: 0 })
  @Index()
  displayOrder: number;

  /**
   * Whether the promotional card is active and visible
   * @example true
   */
  @ApiProperty({
    description: 'Whether the promotional card is active and visible',
    example: true,
    default: true,
  })
  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  /**
   * Record creation timestamp
   * @example "2026-02-01T10:00:00Z"
   */
  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2026-02-01T10:00:00Z',
    readOnly: true,
  })
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Record last update timestamp
   * @example "2026-02-01T12:00:00Z"
   */
  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2026-02-01T12:00:00Z',
    readOnly: true,
  })
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft deletion timestamp (null if not deleted)
   * @example null
   */
  @ApiProperty({
    description: 'Soft deletion timestamp',
    example: null,
    nullable: true,
    readOnly: true,
  })
  @DeleteDateColumn()
  deletedAt?: Date;
}
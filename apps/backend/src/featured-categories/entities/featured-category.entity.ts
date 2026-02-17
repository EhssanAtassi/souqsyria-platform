/**
 * @file featured-category.entity.ts
 * @description Featured Category entity for homepage featured category showcases
 *
 * FEATURES:
 * - Bilingual badge and promotion text (Arabic/English)
 * - Campaign scheduling with start/end dates
 * - Display order management for positioning
 * - Optional promotional badges with colors
 * - Category relationship with product count
 * - Soft delete with restore functionality
 * - Enterprise audit fields
 *
 * SYRIAN MARKET FEATURES:
 * - Arabic text support for badges and promotions
 * - Flexible scheduling for cultural events (Ramadan, Eid, etc.)
 * - Priority-based display ordering
 *
 * @swagger
 * components:
 *   schemas:
 *     FeaturedCategory:
 *       type: object
 *       description: Featured category showcase on homepage
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
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';

/**
 * Featured Category Entity
 *
 * Manages which categories appear prominently on the homepage with optional
 * promotional badges and scheduling capabilities. Supports Syrian cultural events
 * and seasonal campaigns with bilingual content.
 */
@Entity('featured_categories')
@Index(['isActive', 'startDate', 'endDate', 'displayOrder']) // Performance for active queries
@Index(['categoryId']) // Foreign key lookups
export class FeaturedCategory {
  @ApiProperty({
    description: 'Unique identifier for the featured category',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  // ================================
  // CATEGORY RELATIONSHIP
  // ================================

  /**
   * Reference to the category being featured
   * One category can be featured multiple times with different badges/dates
   */
  @ApiProperty({
    description: 'Category being featured',
    type: () => Category,
  })
  @ManyToOne(() => Category, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: false })
  categoryId: number;

  // ================================
  // DISPLAY CONFIGURATION
  // ================================

  /**
   * Position on homepage (0-based index)
   * Lower values appear first
   */
  @ApiProperty({
    description:
      'Display order position on homepage (0-based, lower = higher priority)',
    example: 0,
    default: 0,
    minimum: 0,
  })
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  // ================================
  // PROMOTIONAL BADGE (OPTIONAL)
  // ================================

  /**
   * Badge text in English (e.g., "New", "Hot", "Sale")
   */
  @ApiProperty({
    description: 'Badge text in English',
    example: 'Hot',
    maxLength: 50,
    nullable: true,
  })
  @Column({ name: 'badge_text_en', length: 50, nullable: true })
  badgeTextEn: string;

  /**
   * Badge text in Arabic (e.g., "جديد", "عرض", "تخفيضات")
   */
  @ApiProperty({
    description: 'Badge text in Arabic',
    example: 'ساخن',
    maxLength: 50,
    nullable: true,
  })
  @Column({ name: 'badge_text_ar', length: 50, nullable: true })
  badgeTextAr: string;

  /**
   * Badge background color in hex format
   */
  @ApiProperty({
    description: 'Badge background color (hex format)',
    example: '#FF6B6B',
    pattern: '^#[0-9A-Fa-f]{6}$',
    nullable: true,
  })
  @Column({ name: 'badge_color', length: 20, nullable: true })
  badgeColor: string;

  // ================================
  // PROMOTIONAL TEXT (OPTIONAL)
  // ================================

  /**
   * Promotion text in English
   */
  @ApiProperty({
    description: 'Promotional text in English',
    example: 'Up to 30% off on electronics',
    maxLength: 200,
    nullable: true,
  })
  @Column({ name: 'promotion_text_en', length: 200, nullable: true })
  promotionTextEn: string;

  /**
   * Promotion text in Arabic
   */
  @ApiProperty({
    description: 'Promotional text in Arabic',
    example: 'خصم يصل إلى 30% على الإلكترونيات',
    maxLength: 200,
    nullable: true,
  })
  @Column({ name: 'promotion_text_ar', length: 200, nullable: true })
  promotionTextAr: string;

  // ================================
  // SCHEDULING & VISIBILITY
  // ================================

  /**
   * Whether the featured category is currently active
   */
  @ApiProperty({
    description: 'Whether the featured category is active and visible',
    example: true,
    default: true,
  })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Optional scheduled start date
   * Featured category becomes visible at this date
   */
  @ApiProperty({
    description: 'Scheduled start date (optional)',
    example: '2025-01-01T00:00:00.000Z',
    nullable: true,
  })
  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  /**
   * Optional scheduled end date
   * Featured category becomes hidden after this date
   */
  @ApiProperty({
    description: 'Scheduled end date (optional)',
    example: '2025-12-31T23:59:59.999Z',
    nullable: true,
  })
  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

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
   * Get badge text based on language preference
   * @param language Language preference ('en' | 'ar')
   * @returns Localized badge text or null
   */
  getBadgeText(language: 'en' | 'ar' = 'en'): string | null {
    if (language === 'ar' && this.badgeTextAr) {
      return this.badgeTextAr;
    }
    return this.badgeTextEn || null;
  }

  /**
   * Get promotion text based on language preference
   * @param language Language preference ('en' | 'ar')
   * @returns Localized promotion text or null
   */
  getPromotionText(language: 'en' | 'ar' = 'en'): string | null {
    if (language === 'ar' && this.promotionTextAr) {
      return this.promotionTextAr;
    }
    return this.promotionTextEn || null;
  }

  /**
   * Check if the featured category is currently active and within schedule
   * @returns true if category should be displayed on homepage
   */
  isCurrentlyActive(): boolean {
    if (!this.isActive) {
      return false;
    }

    const now = new Date();

    // Check start date if set
    if (this.startDate && now < this.startDate) {
      return false;
    }

    // Check end date if set
    if (this.endDate && now > this.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Check if the featured category is scheduled for future
   * @returns true if start date is in the future
   */
  isScheduledForFuture(): boolean {
    if (!this.startDate) {
      return false;
    }
    return new Date() < this.startDate;
  }

  /**
   * Check if the featured category has expired
   * @returns true if end date has passed
   */
  hasExpired(): boolean {
    if (!this.endDate) {
      return false;
    }
    return new Date() > this.endDate;
  }

  /**
   * Get number of days remaining until expiration
   * @returns Days remaining or null if no end date
   */
  getDaysRemaining(): number | null {
    if (!this.endDate) {
      return null;
    }

    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Validate business rules
   * @returns Array of validation errors (empty if valid)
   */
  validate(): string[] {
    const errors: string[] = [];

    // Display order must be non-negative
    if (this.displayOrder < 0) {
      errors.push('Display order must be greater than or equal to 0');
    }

    // End date must be after start date
    if (this.startDate && this.endDate && this.endDate <= this.startDate) {
      errors.push('End date must be after start date');
    }

    // At least one badge text must be provided if badge color is set
    if (this.badgeColor && !this.badgeTextEn && !this.badgeTextAr) {
      errors.push(
        'Badge text (English or Arabic) is required when badge color is set',
      );
    }

    // Badge color must be valid hex format
    if (this.badgeColor && !/^#[0-9A-Fa-f]{6}$/.test(this.badgeColor)) {
      errors.push('Badge color must be in hex format (#RRGGBB)');
    }

    return errors;
  }

  /**
   * Check if category needs admin attention
   * @returns true if needs review or action
   */
  needsAdminAttention(): boolean {
    // Expiring soon (within 3 days)
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3) {
      return true;
    }

    // Has expired but still active
    if (this.hasExpired() && this.isActive) {
      return true;
    }

    return false;
  }
}

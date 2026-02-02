/**
 * @file promo-card.entity.ts
 * @description Promotional Card entity for hero banner 70/30 layout display
 *
 * FEATURES:
 * - Bilingual support (Arabic/English) for Syrian market
 * - Position-based placement (1 = left 70%, 2 = right top/bottom 30%)
 * - Campaign scheduling with start/end dates
 * - Analytics tracking (impressions, clicks, CTR)
 * - Approval workflow (draft → pending → approved → rejected)
 * - Badge system for promotional labels
 * - Soft delete with restore functionality
 * - Enterprise audit fields
 *
 * @swagger
 * components:
 *   schemas:
 *     PromoCard:
 *       type: object
 *       description: Promotional card with scheduling and analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
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
import { User } from '../../users/entities/user.entity';

/**
 * Promo Card Entity
 *
 * Represents promotional cards displayed in the hero banner area with 70/30 layout:
 * - Position 1: Large card occupying 70% width on left side
 * - Position 2: Small cards occupying 30% width on right side (stacked)
 *
 * Features:
 * - Complete Arabic/English localization
 * - Campaign scheduling with timezone support
 * - Real-time analytics (impressions, clicks, CTR)
 * - Approval workflow for content moderation
 * - Badge system for promotional labels (NEW, SALE, HOT, etc.)
 * - Performance tracking
 */
@Entity('promo_cards')
@Index(['isActive', 'approvalStatus', 'position']) // Performance for active card queries
@Index(['startDate', 'endDate']) // Scheduling queries
@Index('UNQ_promo_cards_position_active_approved', ['position', 'isActive', 'approvalStatus'], {
  unique: true,
  where: 'deleted_at IS NULL AND is_active = true AND approval_status = \'approved\'',
}) // P1-3: Prevent position race conditions
export class PromoCard {
  @ApiProperty({ description: 'Unique identifier for the promotional card' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ================================
  // MULTILINGUAL CONTENT
  // ================================

  /**
   * Card title in English
   */
  @ApiProperty({
    description: 'Card title in English',
    example: 'Summer Sale Collection',
    maxLength: 150,
  })
  @Column({ name: 'title_en', length: 150 })
  titleEn: string;

  /**
   * Card title in Arabic
   */
  @ApiProperty({
    description: 'Card title in Arabic',
    example: 'مجموعة تخفيضات الصيف',
    maxLength: 150,
  })
  @Column({ name: 'title_ar', length: 150 })
  titleAr: string;

  /**
   * Card description in English (optional)
   */
  @ApiProperty({
    description: 'Card description in English',
    example: 'Get up to 50% off on all summer products',
    nullable: true,
  })
  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  /**
   * Card description in Arabic (optional)
   */
  @ApiProperty({
    description: 'Card description in Arabic',
    example: 'احصل على خصم يصل إلى 50٪ على جميع منتجات الصيف',
    nullable: true,
  })
  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string;

  // ================================
  // VISUAL ASSETS
  // ================================

  /**
   * Card image URL
   */
  @ApiProperty({
    description: 'Card image URL (CDN link)',
    example: 'https://cdn.souqsyria.com/promo/summer-sale.jpg',
    maxLength: 500,
  })
  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  /**
   * Target link URL
   */
  @ApiProperty({
    description: 'Target URL when card is clicked',
    example: '/category/summer-collection',
    maxLength: 500,
    nullable: true,
  })
  @Column({ name: 'link_url', length: 500, nullable: true })
  linkUrl: string;

  // ================================
  // POSITIONING
  // ================================

  /**
   * Card position (1 = left large, 2 = right small)
   */
  @ApiProperty({
    description: 'Card position: 1 = left 70%, 2 = right 30% (stacked)',
    enum: [1, 2],
    example: 1,
  })
  @Column({
    name: 'position',
    type: 'smallint',
  })
  position: 1 | 2;

  // ================================
  // BADGE SYSTEM
  // ================================

  /**
   * Badge text in English (optional)
   */
  @ApiProperty({
    description: 'Badge text in English (NEW, SALE, HOT, etc.)',
    example: 'NEW',
    maxLength: 50,
    nullable: true,
  })
  @Column({ name: 'badge_text_en', length: 50, nullable: true })
  badgeTextEn: string;

  /**
   * Badge text in Arabic (optional)
   */
  @ApiProperty({
    description: 'Badge text in Arabic',
    example: 'جديد',
    maxLength: 50,
    nullable: true,
  })
  @Column({ name: 'badge_text_ar', length: 50, nullable: true })
  badgeTextAr: string;

  /**
   * Badge CSS class for styling
   */
  @ApiProperty({
    description: 'Badge CSS class (badge-new, badge-sale, badge-hot, badge-limited)',
    example: 'badge-new',
    maxLength: 50,
    nullable: true,
  })
  @Column({ name: 'badge_class', length: 50, nullable: true })
  badgeClass: string;

  // ================================
  // STATUS & VISIBILITY
  // ================================

  /**
   * Whether card is active
   */
  @ApiProperty({
    description: 'Whether card is active and visible',
    example: true,
    default: false,
  })
  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  /**
   * Approval status
   */
  @ApiProperty({
    description: 'Current approval status',
    enum: ['draft', 'pending', 'approved', 'rejected'],
    example: 'draft',
    default: 'draft',
  })
  @Column({
    name: 'approval_status',
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';

  // ================================
  // SCHEDULING
  // ================================

  /**
   * Campaign start date
   */
  @ApiProperty({
    description: 'When the card should start showing',
    example: '2024-06-01T00:00:00.000Z',
    nullable: true,
  })
  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date;

  /**
   * Campaign end date
   */
  @ApiProperty({
    description: 'When the card should stop showing',
    example: '2024-08-31T23:59:59.999Z',
    nullable: true,
  })
  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date;

  // ================================
  // ANALYTICS & TRACKING
  // ================================

  /**
   * Impression count
   */
  @ApiProperty({
    description: 'Total number of times card was viewed',
    example: 5420,
    default: 0,
  })
  @Column({ name: 'impressions', type: 'int', default: 0 })
  impressions: number;

  /**
   * Click count
   */
  @ApiProperty({
    description: 'Total number of card clicks',
    example: 342,
    default: 0,
  })
  @Column({ name: 'clicks', type: 'int', default: 0 })
  clicks: number;

  // ================================
  // AUDIT & ENTERPRISE FIELDS
  // ================================

  /**
   * User who created this card
   */
  @ApiProperty({
    description: 'User who created this card',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string;

  /**
   * User who last updated this card
   */
  @ApiProperty({
    description: 'User who last updated this card',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy: string;

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
  @ApiProperty({ description: 'Soft delete timestamp', nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  // ================================
  // COMPUTED METHODS & BUSINESS LOGIC
  // ================================

  /**
   * Check if card is currently active and within schedule
   */
  isCurrentlyActive(): boolean {
    const now = new Date();
    const withinSchedule =
      (!this.startDate || now >= this.startDate) &&
      (!this.endDate || now <= this.endDate);

    return (
      this.isActive &&
      this.approvalStatus === 'approved' &&
      withinSchedule
    );
  }

  /**
   * Check if card is scheduled for future
   */
  isScheduledForFuture(): boolean {
    if (!this.startDate) return false;
    const now = new Date();
    return now < this.startDate;
  }

  /**
   * Check if card has expired
   */
  hasExpired(): boolean {
    if (!this.endDate) return false;
    const now = new Date();
    return now > this.endDate;
  }

  /**
   * Get title based on language
   */
  getTitle(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.titleAr : this.titleEn;
  }

  /**
   * Get description based on language
   */
  getDescription(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.descriptionAr) {
      return this.descriptionAr;
    }
    return this.descriptionEn || '';
  }

  /**
   * Get badge text based on language
   */
  getBadgeText(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.badgeTextAr) {
      return this.badgeTextAr;
    }
    return this.badgeTextEn || '';
  }

  /**
   * Calculate and return click-through rate
   */
  calculateClickThroughRate(): number {
    if (this.impressions === 0) return 0;
    return (this.clicks / this.impressions) * 100;
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    // Simple scoring based on CTR
    const ctr = this.calculateClickThroughRate();
    // 5% CTR = 100 points, linear scale
    return Math.min(Math.round(ctr * 20), 100);
  }

  /**
   * Check if card needs admin attention
   */
  needsAdminAttention(): boolean {
    return (
      this.approvalStatus === 'pending' ||
      this.approvalStatus === 'rejected' ||
      (this.isCurrentlyActive() && this.impressions === 0 && this.getDaysActive() > 3)
    );
  }

  /**
   * Get number of days card has been active
   */
  getDaysActive(): number {
    if (!this.startDate) return 0;
    const now = new Date();
    const start = new Date(this.startDate);
    if (now < start) return 0;
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

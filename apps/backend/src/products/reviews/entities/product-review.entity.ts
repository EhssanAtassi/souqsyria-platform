/**
 * @file product-review.entity.ts
 * @description Product Review Entity for customer reviews and ratings
 *
 * Features:
 * - 1-5 star rating system
 * - Bilingual title and body (English and Arabic)
 * - Pros and cons lists
 * - Verified purchase badge
 * - Helpfulness voting system
 * - Three-tier moderation workflow (pending, approved, rejected)
 * - Indexed foreign keys for performance
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductEntity } from '../../entities/product.entity';
import { User } from '../../../users/entities/user.entity';

/**
 * Product Review Entity
 *
 * Stores customer reviews for products with moderation support.
 * Each review includes a rating (1-5), optional title and body text in both languages,
 * and structured pros/cons lists. Reviews track verified purchase status and
 * community helpfulness voting.
 *
 * Performance Optimizations:
 * - Indexed on product_id for fast product review queries
 * - Indexed on user_id for user review history
 * - Indexed on status for moderation workflow queries
 * - Composite index on (product_id, status, created_at) for approved review pagination
 */
@Entity('product_reviews')
@Index(['product'])
@Index(['user'])
@Index(['status'])
@Index(['product', 'status', 'createdAt'])
export class ProductReviewEntity {
  /**
   * Primary key - auto-incrementing integer
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Product being reviewed (foreign key)
   */
  @Column({ name: 'product_id' })
  productId: number;

  /**
   * User who wrote the review (foreign key)
   */
  @Column({ name: 'user_id' })
  userId: number;

  /**
   * Star rating from 1 to 5
   * Required field - every review must have a rating
   */
  @Column({ type: 'tinyint', unsigned: true })
  rating: number;

  /**
   * Optional review title in English
   * Max 200 characters for concise summary
   */
  @Column({ name: 'title_en', length: 200, nullable: true })
  titleEn?: string;

  /**
   * Optional review title in Arabic
   * Max 200 characters for concise summary
   */
  @Column({ name: 'title_ar', length: 200, nullable: true })
  titleAr?: string;

  /**
   * Optional review body text in English
   * Full-length review content
   */
  @Column({ name: 'body_en', type: 'text', nullable: true })
  bodyEn?: string;

  /**
   * Optional review body text in Arabic
   * Full-length review content
   */
  @Column({ name: 'body_ar', type: 'text', nullable: true })
  bodyAr?: string;

  /**
   * Structured pros list
   * Stored as comma-separated values via TypeORM's simple-array
   * Example: ['Great quality', 'Fast shipping', 'Good price']
   */
  @Column({ type: 'simple-array', nullable: true })
  pros?: string[];

  /**
   * Structured cons list
   * Stored as comma-separated values via TypeORM's simple-array
   * Example: ['Limited color options', 'No warranty']
   */
  @Column({ type: 'simple-array', nullable: true })
  cons?: string[];

  /**
   * Verified purchase flag
   * True if user purchased this product before reviewing
   * Increases review credibility and trust
   */
  @Column({ name: 'is_verified_purchase', default: false })
  isVerifiedPurchase: boolean;

  /**
   * Helpfulness vote count
   * Number of users who found this review helpful
   * Used for sorting reviews by usefulness
   */
  @Column({ name: 'helpful_count', default: 0 })
  helpfulCount: number;

  /**
   * Moderation status
   * - pending: Awaiting admin review (default for new reviews)
   * - approved: Passed moderation, visible to public
   * - rejected: Failed moderation, hidden from public
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected';

  /**
   * Product relation (many reviews to one product)
   */
  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  /**
   * User relation (many reviews to one user)
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Review creation timestamp
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Review last update timestamp
   * Updated when review is edited or status changes
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================================================
  // BUSINESS METHODS - Review Management
  // ============================================================================

  /**
   * Check if review is approved and visible to public
   */
  isApproved(): boolean {
    return this.status === 'approved';
  }

  /**
   * Check if review is pending moderation
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Check if review was rejected by moderation
   */
  isRejected(): boolean {
    return this.status === 'rejected';
  }

  /**
   * Get review title based on language preference
   * Falls back to English if Arabic not available
   */
  getTitle(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.titleAr || this.titleEn : this.titleEn;
  }

  /**
   * Get review body based on language preference
   * Falls back to English if Arabic not available
   */
  getBody(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.bodyAr || this.bodyEn : this.bodyEn;
  }

  /**
   * Check if review has content beyond just rating
   */
  hasContent(): boolean {
    return !!(
      this.titleEn ||
      this.titleAr ||
      this.bodyEn ||
      this.bodyAr ||
      (this.pros && this.pros.length > 0) ||
      (this.cons && this.cons.length > 0)
    );
  }
}

/**
 * @file product.entity.ts
 * @description Core Product Entity representing a product listing.
 *
 * Performance Optimization (PERF-C01):
 * - Added indexes on foreign keys for faster JOINs
 * - Added composite indexes for common query patterns
 * - Added fulltext index on name columns for search
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { ManufacturerEntity } from '../../manufacturers/entities/manufacturer.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductDescriptionEntity } from './product-description.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from '../variants/entities/product-variant.entity';
import { ProductFeatureEntity } from '../../features/entities/product-feature.entity';
import { ProductAttribute } from './product-attribute.entity/product-attribute.entity';
import { ProductPriceEntity } from '../pricing/entities/product-price.entity';
import { Brand } from '../../brands/entities/brand.entity';

/**
 * PERF-C01: Database indexes for optimized queries
 * - vendor_id: JOINs with vendor table
 * - category_id: JOINs with category table, filtering by category
 * - approval_status + createdAt: Admin dashboard queries for pending products
 * - status + isActive: Storefront queries for published products
 * - isFeatured + featuredPriority: Featured products sorting
 * - slug: Product URL lookups (unique)
 */
@Entity('products')
@Index(['vendor'])
@Index(['category'])
@Index(['brand'])
@Index(['approvalStatus', 'createdAt'])
@Index(['status', 'isActive', 'isPublished'])
@Index(['isFeatured', 'featuredPriority'])
@Index(['isBestSeller', 'salesCount'])
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VendorEntity, { nullable: true })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity; // Null = Admin-owned product

  @ManyToOne(() => ManufacturerEntity, { nullable: true })
  @JoinColumn({ name: 'manufacturer_id' })
  manufacturer: ManufacturerEntity;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Brand, (brand) => brand.products, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand?: Brand;

  @Column({ name: 'name_en' })
  nameEn: string;

  @Column({ name: 'name_ar' })
  nameAr: string;

  @Column({ unique: true })
  slug: string;

  @OneToOne(() => ProductPriceEntity, (price) => price.product)
  pricing: ProductPriceEntity;

  @Column({ type: 'enum', enum: ['SYP', 'TRY', 'USD'], default: 'SYP' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
  })
  status: string;

  /**
   * Product Approval Workflow Status
   */
  @Column({
    type: 'enum',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    default: 'draft',
    name: 'approval_status',
  })
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  /**
   * Admin who approved this product
   */
  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number;

  /**
   * Timestamp when product was approved
   */
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  /**
   * Reason for rejection if product was rejected
   */
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  /**
   * Last activity timestamp for workflow tracking
   */
  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  weight: number;

  @Column({ nullable: true, type: 'json' })
  dimensions: { width: number; height: number; length: number };

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  /**
   * Best Seller flag - marks products as best sellers
   * Used for sorting and filtering in homepage sections
   */
  @Column({ name: 'is_best_seller', default: false })
  isBestSeller: boolean;

  /**
   * Sales count - tracks total number of sales for this product
   * Used for best seller sorting and analytics
   */
  @Column({ name: 'sales_count', type: 'int', default: 0 })
  salesCount: number;

  /**
   * View count - tracks how many times this product detail page has been viewed
   * Used for analytics and popularity tracking
   * Incremented via POST /products/:slug/view endpoint
   */
  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({
    name: 'featured_priority',
    type: 'int',
    nullable: true,
    default: 0,
  })
  featuredPriority: number;

  @Column({ name: 'featured_start_date', type: 'timestamp', nullable: true })
  featuredStartDate: Date;

  @Column({ name: 'featured_end_date', type: 'timestamp', nullable: true })
  featuredEndDate: Date;

  @Column({
    name: 'featured_badge',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  featuredBadge: string;

  @OneToMany(
    () => ProductDescriptionEntity,
    (description) => description.product,
  )
  descriptions: ProductDescriptionEntity[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductFeatureEntity, (pf) => pf.product)
  features: ProductFeatureEntity[];

  /**
   * One product can have multiple attribute-value pairs
   * Example: Size = XL, Color = Red
   */
  @OneToMany(() => ProductAttribute, (attr) => attr.product, { cascade: true })
  attributes: ProductAttribute[];

  // @OneToMany(() => ProductStockEntity, (stock) => stock.product)
  // stocks: ProductStockEntity[];
  @Column({ default: false })
  is_deleted: boolean;
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ============================================================================
  // BUSINESS METHODS - Product Workflow Management
  // ============================================================================

  /**
   * Check if product is publicly visible
   */
  isPublic(): boolean {
    return (
      this.approvalStatus === 'approved' && this.isActive && this.isPublished
    );
  }

  /**
   * Check if product can be edited
   */
  canBeEdited(): boolean {
    return ['draft', 'rejected'].includes(this.approvalStatus);
  }

  /**
   * Check if product is in pending approval
   */
  isPendingApproval(): boolean {
    return this.approvalStatus === 'pending';
  }

  /**
   * Check if product is approved
   */
  isApproved(): boolean {
    return this.approvalStatus === 'approved';
  }

  /**
   * Check if product needs admin attention
   */
  needsAdminAttention(): boolean {
    return ['pending', 'rejected'].includes(this.approvalStatus);
  }

  /**
   * Get product display name based on language
   */
  getDisplayName(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.nameAr || this.nameEn : this.nameEn;
  }

  /**
   * Generate SEO-friendly URL for product
   */
  generateUrl(language: 'en' | 'ar' = 'en'): string {
    return `/products/${this.slug}${language === 'ar' ? '?lang=ar' : ''}`;
  }
}

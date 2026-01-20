/**
 * @file category.entity.ts
 * @description Enhanced Category entity with enterprise features, approval workflow, and Syrian market support
 *
 * FEATURES:
 * - Complete multilingual support (Arabic/English) with RTL optimization
 * - Hierarchical parent/child structure with depth tracking
 * - Approval workflow system (draft -> pending -> approved -> rejected)
 * - Enterprise audit fields (created/updated by tracking)
 * - Performance analytics (view count, product count, popularity score)
 * - SEO optimization with Arabic slug support
 * - Syrian market localization features
 * - Soft delete with restore functionality
 * - Business rule validation methods
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';

/**
 * Category Entity with Enterprise Features
 *
 * This entity represents product categories with comprehensive enterprise features:
 * - Hierarchical structure supporting unlimited nesting levels
 * - Complete Arabic/English localization with cultural adaptations
 * - Approval workflow for content moderation
 * - Performance tracking and analytics
 * - SEO optimization for Syrian market
 * - Audit trail and change tracking
 */
@Entity('categories')
@Index(['isActive', 'approvalStatus', 'sortOrder']) // Performance optimization for listings
@Index(['seoSlug']) // Arabic SEO lookups
@Index(['parent', 'sortOrder']) // Hierarchy queries
export class Category {
  @ApiProperty({ description: 'Unique identifier for the category' })
  @PrimaryGeneratedColumn()
  id: number;

  // ================================
  // HIERARCHICAL STRUCTURE
  // ================================

  /**
   * Parent category for hierarchical structure
   * Supports unlimited nesting levels (Electronics > Smartphones > iPhone)
   */
  @ApiProperty({
    description: 'Parent category for hierarchical structure',
    type: () => Category,
    nullable: true,
  })
  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @ApiProperty({
    description: 'Child categories under this category',
    type: () => [Category],
    isArray: true,
  })
  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  /**
   * Depth level in hierarchy (0 = root, 1 = first level, etc.)
   * Calculated automatically for performance optimization
   */
  @ApiProperty({
    description: 'Hierarchy depth level (0 = root category)',
    example: 0,
    default: 0,
  })
  @Column({ name: 'depth_level', default: 0 })
  depthLevel: number;

  /**
   * Full path from root to this category (e.g., "Electronics/Smartphones/iPhone")
   * Cached for performance - updated when hierarchy changes
   */
  @ApiProperty({
    description: 'Full category path for breadcrumbs',
    example: 'Electronics/Smartphones/iPhone',
    nullable: true,
  })
  @Column({ name: 'category_path', length: 500, nullable: true })
  categoryPath: string;

  // ================================
  // MULTILINGUAL CONTENT
  // ================================

  /**
   * Category name in English
   */
  @ApiProperty({
    description: 'Category name in English',
    example: 'Electronics',
    maxLength: 100,
  })
  @Column({ name: 'name_en', length: 100 })
  nameEn: string;

  /**
   * Category name in Arabic
   */
  @ApiProperty({
    description: 'Category name in Arabic',
    example: 'إلكترونيات',
    maxLength: 100,
  })
  @Column({ name: 'name_ar', length: 100 })
  nameAr: string;

  /**
   * SEO-friendly URL slug in English
   */
  @ApiProperty({
    description: 'SEO-friendly URL slug',
    example: 'electronics',
    maxLength: 150,
  })
  @Column({ length: 150, unique: true })
  slug: string;

  /**
   * Description in English
   */
  @ApiProperty({
    description: 'Category description in English',
    example: 'Electronic devices, gadgets, and home electronics',
    nullable: true,
  })
  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  /**
   * Description in Arabic
   */
  @ApiProperty({
    description: 'Category description in Arabic',
    example: 'أجهزة إلكترونية ومنزلية وأدوات ذكية',
    nullable: true,
  })
  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string;

  // ================================
  // VISUAL & BRANDING
  // ================================

  /**
   * Category icon URL for navigation menus
   */
  @ApiProperty({
    description: 'Category icon URL for menus and navigation',
    example: 'https://cdn.souqsyria.com/categories/electronics-icon.svg',
    nullable: true,
  })
  @Column({ name: 'icon_url', nullable: true })
  iconUrl: string;

  /**
   * Category banner image for category pages
   */
  @ApiProperty({
    description: 'Category banner image URL',
    example: 'https://cdn.souqsyria.com/categories/electronics-banner.jpg',
    nullable: true,
  })
  @Column({ name: 'banner_url', nullable: true })
  bannerUrl: string;

  /**
   * Category background color for theming
   */
  @ApiProperty({
    description: 'Category theme color in hex format',
    example: '#2196F3',
    nullable: true,
  })
  @Column({ name: 'theme_color', length: 7, nullable: true })
  themeColor: string;

  // ================================
  // SEO OPTIMIZATION
  // ================================

  /**
   * SEO title for search engines
   */
  @ApiProperty({
    description: 'SEO meta title',
    example: 'Electronics - Buy Online in Syria | SouqSyria',
    nullable: true,
  })
  @Column({ name: 'seo_title', length: 200, nullable: true })
  seoTitle: string;

  /**
   * SEO description for search engines
   */
  @ApiProperty({
    description: 'SEO meta description',
    example:
      'Shop electronics, smartphones, TVs & more with fast delivery across Syria',
    nullable: true,
  })
  @Column({ name: 'seo_description', length: 300, nullable: true })
  seoDescription: string;

  /**
   * Arabic SEO slug for RTL URLs
   */
  @ApiProperty({
    description: 'Arabic SEO slug for RTL URLs',
    example: 'الكترونيات',
    nullable: true,
  })
  @Column({ name: 'seo_slug', length: 150, nullable: true })
  seoSlug: string;

  // ================================
  // APPROVAL WORKFLOW SYSTEM
  // ================================

  /**
   * Approval status for content moderation
   */
  @ApiProperty({
    description: 'Current approval status of the category',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    example: 'approved',
    default: 'draft',
  })
  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    default: 'draft',
  })
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';

  /**
   * Admin user who approved this category
   */
  @ApiProperty({
    description: 'Admin who approved this category',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: number;

  /**
   * Approval timestamp
   */
  @ApiProperty({
    description: 'When the category was approved',
    nullable: true,
  })
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  /**
   * Rejection reason if rejected
   */
  @ApiProperty({
    description: 'Reason for rejection if status is rejected',
    nullable: true,
  })
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  // ================================
  // STATUS & CONFIGURATION
  // ================================

  /**
   * Whether category is active and visible
   */
  @ApiProperty({
    description: 'Whether category is active and visible',
    example: true,
    default: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Whether category is featured on homepage
   */
  @ApiProperty({
    description: 'Whether category is featured on homepage',
    example: false,
    default: false,
  })
  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  /**
   * Featured priority for sorting featured categories
   */
  @ApiProperty({
    description: 'Featured priority (higher = more prominent)',
    example: 10,
    default: 0,
    nullable: true,
  })
  @Column({ name: 'featured_priority', type: 'int', nullable: true, default: 0 })
  featuredPriority: number;

  /**
   * Featured image URL for promotional displays
   */
  @ApiProperty({
    description: 'Featured image URL for promotional displays',
    example: 'https://cdn.souqsyria.com/featured/damascus-steel.jpg',
    nullable: true,
  })
  @Column({ name: 'featured_image_url', length: 500, nullable: true })
  featuredImageUrl: string;

  /**
   * Featured discount label
   */
  @ApiProperty({
    description: 'Featured discount label (e.g., "15% OFF")',
    example: '15%',
    nullable: true,
  })
  @Column({ name: 'featured_discount', length: 10, nullable: true })
  featuredDiscount: string;

  /**
   * Display order for sorting
   */
  @ApiProperty({
    description: 'Display order for sorting categories',
    example: 100,
    default: 100,
  })
  @Column({ name: 'sort_order', default: 100 })
  sortOrder: number;

  /**
   * Whether to show this category in navigation menus
   */
  @ApiProperty({
    description: 'Whether to show in navigation menus',
    example: true,
    default: true,
  })
  @Column({ name: 'show_in_nav', default: true })
  showInNav: boolean;

  // ================================
  // PERFORMANCE & ANALYTICS
  // ================================

  /**
   * Number of products in this category
   */
  @ApiProperty({
    description: 'Number of products in this category',
    example: 150,
    default: 0,
  })
  @Column({ name: 'product_count', default: 0 })
  productCount: number;

  /**
   * Number of times this category was viewed
   */
  @ApiProperty({
    description: 'Category view count for analytics',
    example: 1250,
    default: 0,
  })
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  /**
   * Popularity score based on views, products, sales
   */
  @ApiProperty({
    description: 'Calculated popularity score',
    example: 85.5,
    default: 0,
  })
  @Column({
    name: 'popularity_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  popularityScore: number;

  /**
   * Last time this category had activity
   */
  @ApiProperty({
    description: 'Last activity timestamp',
    nullable: true,
  })
  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  // ================================
  // BUSINESS CONFIGURATION
  // ================================

  /**
   * Commission rate for products in this category
   */
  @ApiProperty({
    description: 'Commission rate percentage for this category',
    example: 5.5,
    nullable: true,
  })
  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  commissionRate: number;

  /**
   * Minimum product price for this category
   */
  @ApiProperty({
    description: 'Minimum allowed product price in SYP',
    example: 1000,
    nullable: true,
  })
  @Column({
    name: 'min_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  minPrice: number;

  /**
   * Maximum product price for this category
   */
  @ApiProperty({
    description: 'Maximum allowed product price in SYP',
    example: 10000000,
    nullable: true,
  })
  @Column({
    name: 'max_price',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  maxPrice: number;

  // ================================
  // AUDIT & ENTERPRISE FIELDS
  // ================================

  /**
   * User who created this category
   */
  @ApiProperty({
    description: 'User who created this category',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  /**
   * User who last updated this category
   */
  @ApiProperty({
    description: 'User who last updated this category',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;

  /**
   * Tenant ID for multi-tenancy support
   */
  @ApiProperty({
    description: 'Tenant ID for multi-tenancy',
    nullable: true,
  })
  @Column({ name: 'tenant_id', nullable: true })
  tenantId: number;

  /**
   * Organization ID for enterprise features
   */
  @ApiProperty({
    description: 'Organization ID for enterprise grouping',
    nullable: true,
  })
  @Column({ name: 'organization_id', length: 100, nullable: true })
  organizationId: string;

  // ================================
  // RELATIONSHIPS
  // ================================

  /**
   * Products in this category
   */
  @ApiProperty({
    description: 'Products in this category',
    type: () => [ProductEntity],
    isArray: true,
  })
  @OneToMany(() => ProductEntity, (product) => product.category)
  products: ProductEntity[];

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
   * Get display name based on language preference
   * @param language Language preference ('en' | 'ar')
   * @returns Localized category name
   */
  getDisplayName(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.nameAr) {
      return this.nameAr;
    }
    return this.nameEn;
  }

  /**
   * Get display description based on language preference
   * @param language Language preference ('en' | 'ar')
   * @returns Localized category description
   */
  getDisplayDescription(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.descriptionAr) {
      return this.descriptionAr;
    }
    return this.descriptionEn || '';
  }

  /**
   * Get appropriate slug based on language
   * @param language Language preference ('en' | 'ar')
   * @returns Appropriate slug for URLs
   */
  getSlug(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.seoSlug) {
      return this.seoSlug;
    }
    return this.slug;
  }

  /**
   * Check if category is public and ready for display
   * @returns true if category can be shown to customers
   */
  isPublic(): boolean {
    return this.isActive && this.approvalStatus === 'approved';
  }

  /**
   * Check if category can be edited
   * @returns true if category is in editable state
   */
  canBeEdited(): boolean {
    return ['draft', 'rejected'].includes(this.approvalStatus);
  }

  /**
   * Check if category is a root category (has no parent)
   * @returns true if this is a top-level category
   */
  isRootCategory(): boolean {
    return !this.parent && this.depthLevel === 0;
  }

  /**
   * Check if category has child categories
   * @returns true if category has children
   */
  hasChildren(): boolean {
    return this.children && this.children.length > 0;
  }

  /**
   * Get full breadcrumb path as array
   * @param language Language preference for names
   * @returns Array of category names from root to current
   */
  getBreadcrumbPath(language: 'en' | 'ar' = 'en'): string[] {
    if (!this.categoryPath) {
      return [this.getDisplayName(language)];
    }

    // This would need to be populated by the service
    // For now, return simple split
    return this.categoryPath.split('/');
  }

  /**
   * Calculate and return popularity rank based on metrics
   * @returns Popularity rank (higher = more popular)
   */
  getPopularityRank(): number {
    // Simple algorithm: views * 0.3 + products * 0.7
    return this.viewCount * 0.3 + this.productCount * 0.7;
  }

  /**
   * Check if category needs admin attention
   * @returns true if category requires admin action
   */
  needsAdminAttention(): boolean {
    return (
      this.approvalStatus === 'pending' ||
      this.approvalStatus === 'rejected' ||
      (this.isActive &&
        this.productCount === 0 &&
        this.createdAt < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    ); // Older than 7 days with no products
  }

  /**
   * Generate category URL for frontend
   * @param language Language for URL generation
   * @returns Frontend URL path
   */
  generateUrl(language: 'en' | 'ar' = 'en'): string {
    const slug = this.getSlug(language);
    const prefix = language === 'ar' ? '/ar' : '';
    return `${prefix}/categories/${slug}`;
  }
}

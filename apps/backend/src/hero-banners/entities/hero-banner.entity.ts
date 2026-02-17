/**
 * @file hero-banner.entity.ts
 * @description Enterprise Hero Banner entity for homepage carousel with Syrian market features
 *
 * FEATURES:
 * - Complete multilingual support (Arabic/English) with RTL optimization
 * - Campaign scheduling with timezone support (Asia/Damascus)
 * - Analytics tracking (impressions, clicks, conversions)
 * - Approval workflow system (draft → pending → approved → rejected)
 * - Enterprise audit fields (created/updated by tracking)
 * - Syrian cultural data integration (regions, artisans, UNESCO recognition)
 * - Flexible theme system (colors, overlays, typography)
 * - CTA button configuration with variants
 * - Responsive image support (mobile, tablet, desktop)
 * - Soft delete with restore functionality
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBanner:
 *       type: object
 *       description: Enterprise hero banner with scheduling and analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
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
 * Hero Banner Entity with Enterprise Features
 *
 * This entity represents homepage hero banners/carousels with:
 * - Campaign scheduling with start/end dates
 * - Complete Arabic/English localization
 * - Real-time analytics tracking
 * - Approval workflow for content moderation
 * - Syrian cultural integration (regions, artisans, UNESCO)
 * - Flexible theming and CTA configuration
 * - Performance tracking (impressions, clicks, CTR, conversions)
 */
@Entity('hero_banners')
@Index(['isActive', 'approvalStatus', 'priority']) // Performance for active banner queries
@Index(['scheduleStart', 'scheduleEnd']) // Scheduling queries
@Index(['type', 'isActive']) // Filter by banner type
export class HeroBanner {
  @ApiProperty({ description: 'Unique identifier for the hero banner' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ================================
  // MULTILINGUAL CONTENT
  // ================================

  /**
   * Banner name in English (internal identifier)
   */
  @ApiProperty({
    description: 'Banner name in English',
    example: 'Damascus Steel Heritage Collection',
    maxLength: 200,
  })
  @Column({ name: 'name_en', length: 200 })
  nameEn: string;

  /**
   * Banner name in Arabic (internal identifier)
   */
  @ApiProperty({
    description: 'Banner name in Arabic',
    example: 'مجموعة تراث الفولاذ الدمشقي',
    maxLength: 200,
  })
  @Column({ name: 'name_ar', length: 200 })
  nameAr: string;

  /**
   * Main headline in English
   */
  @ApiProperty({
    description: 'Main headline displayed on banner (English)',
    example: 'Authentic Damascus Steel Collection',
    maxLength: 300,
  })
  @Column({ name: 'headline_en', length: 300 })
  headlineEn: string;

  /**
   * Main headline in Arabic
   */
  @ApiProperty({
    description: 'Main headline displayed on banner (Arabic)',
    example: 'مجموعة الفولاذ الدمشقي الأصيل',
    maxLength: 300,
  })
  @Column({ name: 'headline_ar', length: 300 })
  headlineAr: string;

  /**
   * Subheadline in English (optional)
   */
  @ApiProperty({
    description: 'Subheadline text (English)',
    example: 'Handcrafted by Syrian artisans using 1000-year-old techniques',
    maxLength: 500,
    nullable: true,
  })
  @Column({ name: 'subheadline_en', length: 500, nullable: true })
  subheadlineEn: string;

  /**
   * Subheadline in Arabic (optional)
   */
  @ApiProperty({
    description: 'Subheadline text (Arabic)',
    example: 'صُنع يدوياً من قبل الحرفيين السوريين بتقنيات عمرها ألف عام',
    maxLength: 500,
    nullable: true,
  })
  @Column({ name: 'subheadline_ar', length: 500, nullable: true })
  subheadlineAr: string;

  // ================================
  // VISUAL ASSETS
  // ================================

  /**
   * Desktop hero image URL (high resolution)
   */
  @ApiProperty({
    description: 'Desktop hero image URL (1920x800 recommended)',
    example: 'https://cdn.souqsyria.com/hero/damascus-steel-desktop.jpg',
  })
  @Column({ name: 'image_url_desktop' })
  imageUrlDesktop: string;

  /**
   * Tablet hero image URL (optimized)
   */
  @ApiProperty({
    description: 'Tablet hero image URL (1024x600 recommended)',
    example: 'https://cdn.souqsyria.com/hero/damascus-steel-tablet.jpg',
    nullable: true,
  })
  @Column({ name: 'image_url_tablet', nullable: true })
  imageUrlTablet: string;

  /**
   * Mobile hero image URL (optimized)
   */
  @ApiProperty({
    description: 'Mobile hero image URL (768x400 recommended)',
    example: 'https://cdn.souqsyria.com/hero/damascus-steel-mobile.jpg',
    nullable: true,
  })
  @Column({ name: 'image_url_mobile', nullable: true })
  imageUrlMobile: string;

  /**
   * Image alt text for accessibility (English)
   */
  @ApiProperty({
    description: 'Image alt text for SEO and accessibility (English)',
    example: 'Damascus Steel Heritage Collection',
    maxLength: 200,
  })
  @Column({ name: 'image_alt_en', length: 200 })
  imageAltEn: string;

  /**
   * Image alt text for accessibility (Arabic)
   */
  @ApiProperty({
    description: 'Image alt text for SEO and accessibility (Arabic)',
    example: 'مجموعة تراث الفولاذ الدمشقي',
    maxLength: 200,
  })
  @Column({ name: 'image_alt_ar', length: 200 })
  imageAltAr: string;

  // ================================
  // CTA (CALL TO ACTION) CONFIGURATION
  // ================================

  /**
   * CTA button text (English)
   */
  @ApiProperty({
    description: 'CTA button text (English)',
    example: 'Shop Damascus Steel',
    maxLength: 100,
  })
  @Column({ name: 'cta_text_en', length: 100 })
  ctaTextEn: string;

  /**
   * CTA button text (Arabic)
   */
  @ApiProperty({
    description: 'CTA button text (Arabic)',
    example: 'تسوق الفولاذ الدمشقي',
    maxLength: 100,
  })
  @Column({ name: 'cta_text_ar', length: 100 })
  ctaTextAr: string;

  /**
   * CTA button variant
   */
  @ApiProperty({
    description: 'CTA button visual variant',
    enum: ['primary', 'secondary', 'outline', 'ghost'],
    example: 'primary',
    default: 'primary',
  })
  @Column({
    name: 'cta_variant',
    type: 'enum',
    enum: ['primary', 'secondary', 'outline', 'ghost'],
    default: 'primary',
  })
  ctaVariant: 'primary' | 'secondary' | 'outline' | 'ghost';

  /**
   * CTA button size
   */
  @ApiProperty({
    description: 'CTA button size',
    enum: ['small', 'medium', 'large'],
    example: 'large',
    default: 'large',
  })
  @Column({
    name: 'cta_size',
    type: 'enum',
    enum: ['small', 'medium', 'large'],
    default: 'large',
  })
  ctaSize: 'small' | 'medium' | 'large';

  /**
   * CTA button color theme
   */
  @ApiProperty({
    description: 'CTA button color theme',
    example: 'syrian-red',
    default: 'golden-wheat',
  })
  @Column({ name: 'cta_color', length: 50, default: 'golden-wheat' })
  ctaColor: string;

  /**
   * CTA icon (Material icon name)
   */
  @ApiProperty({
    description: 'Material icon name for CTA button',
    example: 'arrow_forward',
    nullable: true,
  })
  @Column({ name: 'cta_icon', length: 50, nullable: true })
  ctaIcon: string;

  /**
   * CTA icon position
   */
  @ApiProperty({
    description: 'Icon position relative to text',
    enum: ['left', 'right'],
    example: 'right',
    default: 'right',
  })
  @Column({
    name: 'cta_icon_position',
    type: 'enum',
    enum: ['left', 'right'],
    default: 'right',
  })
  ctaIconPosition: 'left' | 'right';

  /**
   * Whether CTA button is visible
   */
  @ApiProperty({
    description: 'Whether to show CTA button',
    example: true,
    default: true,
  })
  @Column({ name: 'cta_visible', default: true })
  ctaVisible: boolean;

  // ================================
  // NAVIGATION & ROUTING
  // ================================

  /**
   * Target route type
   */
  @ApiProperty({
    description: 'Type of route for banner click',
    enum: ['category', 'product', 'campaign', 'external', 'page'],
    example: 'category',
  })
  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ['category', 'product', 'campaign', 'external', 'page'],
  })
  targetType: 'category' | 'product' | 'campaign' | 'external' | 'page';

  /**
   * Target route URL
   */
  @ApiProperty({
    description: 'Target URL or route path',
    example: '/category/damascus-steel',
    maxLength: 500,
  })
  @Column({ name: 'target_url', length: 500 })
  targetUrl: string;

  /**
   * Tracking campaign source
   */
  @ApiProperty({
    description: 'UTM source for analytics',
    example: 'hero-slider',
    nullable: true,
  })
  @Column({ name: 'tracking_source', length: 100, nullable: true })
  trackingSource: string;

  /**
   * Tracking campaign medium
   */
  @ApiProperty({
    description: 'UTM medium for analytics',
    example: 'campaign',
    nullable: true,
  })
  @Column({ name: 'tracking_medium', length: 100, nullable: true })
  trackingMedium: string;

  /**
   * Tracking campaign name
   */
  @ApiProperty({
    description: 'UTM campaign name',
    example: 'damascus-steel-heritage-campaign',
    nullable: true,
  })
  @Column({ name: 'tracking_campaign', length: 200, nullable: true })
  trackingCampaign: string;

  // ================================
  // THEME & STYLING
  // ================================

  /**
   * Text color for headline
   */
  @ApiProperty({
    description: 'Headline text color (light or dark)',
    enum: ['light', 'dark'],
    example: 'light',
    default: 'light',
  })
  @Column({
    name: 'text_color',
    type: 'enum',
    enum: ['light', 'dark'],
    default: 'light',
  })
  textColor: 'light' | 'dark';

  /**
   * Overlay color (hex)
   */
  @ApiProperty({
    description: 'Overlay color in hex format',
    example: '#000000',
    nullable: true,
  })
  @Column({ name: 'overlay_color', length: 7, nullable: true })
  overlayColor: string;

  /**
   * Overlay opacity (0-1)
   */
  @ApiProperty({
    description: 'Overlay opacity from 0 to 1',
    example: 0.4,
    default: 0.4,
  })
  @Column({
    name: 'overlay_opacity',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.4,
  })
  overlayOpacity: number;

  /**
   * Content alignment
   */
  @ApiProperty({
    description: 'Content alignment on banner',
    enum: ['left', 'center', 'right'],
    example: 'left',
    default: 'left',
  })
  @Column({
    name: 'content_alignment',
    type: 'enum',
    enum: ['left', 'center', 'right'],
    default: 'left',
  })
  contentAlignment: 'left' | 'center' | 'right';

  /**
   * Content vertical alignment
   */
  @ApiProperty({
    description: 'Content vertical alignment',
    enum: ['top', 'center', 'bottom'],
    example: 'center',
    default: 'center',
  })
  @Column({
    name: 'content_vertical_alignment',
    type: 'enum',
    enum: ['top', 'center', 'bottom'],
    default: 'center',
  })
  contentVerticalAlignment: 'top' | 'center' | 'bottom';

  // ================================
  // BANNER TYPE & CONFIGURATION
  // ================================

  /**
   * Banner type/category
   */
  @ApiProperty({
    description: 'Banner type for categorization',
    enum: [
      'product_spotlight',
      'seasonal',
      'flash_sale',
      'brand_story',
      'cultural',
    ],
    example: 'product_spotlight',
  })
  @Column({
    name: 'type',
    type: 'enum',
    enum: [
      'product_spotlight',
      'seasonal',
      'flash_sale',
      'brand_story',
      'cultural',
    ],
  })
  type:
    | 'product_spotlight'
    | 'seasonal'
    | 'flash_sale'
    | 'brand_story'
    | 'cultural';

  /**
   * Display priority (higher = shown first)
   */
  @ApiProperty({
    description: 'Display priority for banner ordering',
    example: 10,
    default: 5,
  })
  @Column({ name: 'priority', default: 5 })
  priority: number;

  // ================================
  // SCHEDULING
  // ================================

  /**
   * Campaign start date
   */
  @ApiProperty({
    description: 'When the banner should start showing',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Column({ name: 'schedule_start', type: 'timestamp' })
  scheduleStart: Date;

  /**
   * Campaign end date
   */
  @ApiProperty({
    description: 'When the banner should stop showing',
    example: '2024-12-31T23:59:59.999Z',
  })
  @Column({ name: 'schedule_end', type: 'timestamp' })
  scheduleEnd: Date;

  /**
   * Timezone for scheduling
   */
  @ApiProperty({
    description: 'Timezone for schedule dates',
    example: 'Asia/Damascus',
    default: 'Asia/Damascus',
  })
  @Column({ name: 'timezone', length: 50, default: 'Asia/Damascus' })
  timezone: string;

  // ================================
  // ANALYTICS & TRACKING
  // ================================

  /**
   * Impression count
   */
  @ApiProperty({
    description: 'Total number of times banner was viewed',
    example: 15420,
    default: 0,
  })
  @Column({ name: 'impressions', default: 0 })
  impressions: number;

  /**
   * Click count
   */
  @ApiProperty({
    description: 'Total number of banner clicks',
    example: 892,
    default: 0,
  })
  @Column({ name: 'clicks', default: 0 })
  clicks: number;

  /**
   * Click-through rate (calculated)
   */
  @ApiProperty({
    description: 'Click-through rate percentage',
    example: 5.78,
    default: 0,
  })
  @Column({
    name: 'click_through_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  clickThroughRate: number;

  /**
   * Conversion count
   */
  @ApiProperty({
    description: 'Number of conversions attributed to this banner',
    example: 127,
    default: 0,
  })
  @Column({ name: 'conversions', default: 0 })
  conversions: number;

  /**
   * Conversion rate (calculated)
   */
  @ApiProperty({
    description: 'Conversion rate percentage',
    example: 14.24,
    default: 0,
  })
  @Column({
    name: 'conversion_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  conversionRate: number;

  /**
   * Revenue generated (SYP)
   */
  @ApiProperty({
    description: 'Total revenue attributed to this banner in SYP',
    example: 19050000,
    default: 0,
  })
  @Column({
    name: 'revenue',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  revenue: number;

  /**
   * Last analytics update
   */
  @ApiProperty({
    description: 'Last time analytics were updated',
    nullable: true,
  })
  @Column({ name: 'analytics_updated_at', type: 'timestamp', nullable: true })
  analyticsUpdatedAt: Date;

  // ================================
  // SYRIAN CULTURAL DATA (Optional)
  // ================================

  /**
   * Syrian region
   */
  @ApiProperty({
    description: 'Syrian region for cultural banners',
    example: 'damascus',
    nullable: true,
  })
  @Column({ name: 'syrian_region', length: 100, nullable: true })
  syrianRegion: string;

  /**
   * Syrian specialties (JSON array)
   */
  @ApiProperty({
    description: 'Syrian specialties featured in banner',
    example: ['Damascus Steel', 'Traditional Forging'],
    nullable: true,
  })
  @Column({ name: 'syrian_specialties', type: 'simple-json', nullable: true })
  syrianSpecialties: string[];

  /**
   * Cultural context (English)
   */
  @ApiProperty({
    description: 'Cultural context description (English)',
    nullable: true,
  })
  @Column({ name: 'cultural_context_en', type: 'text', nullable: true })
  culturalContextEn: string;

  /**
   * Cultural context (Arabic)
   */
  @ApiProperty({
    description: 'Cultural context description (Arabic)',
    nullable: true,
  })
  @Column({ name: 'cultural_context_ar', type: 'text', nullable: true })
  culturalContextAr: string;

  /**
   * UNESCO recognition
   */
  @ApiProperty({
    description: 'Whether featured product has UNESCO recognition',
    example: true,
    default: false,
  })
  @Column({ name: 'unesco_recognition', default: false })
  unescoRecognition: boolean;

  /**
   * Artisan name (English)
   */
  @ApiProperty({
    description: 'Featured artisan name (English)',
    example: 'Master Ahmad Al-Dimashqi',
    nullable: true,
  })
  @Column({ name: 'artisan_name_en', length: 200, nullable: true })
  artisanNameEn: string;

  /**
   * Artisan name (Arabic)
   */
  @ApiProperty({
    description: 'Featured artisan name (Arabic)',
    example: 'الأستاذ أحمد الدمشقي',
    nullable: true,
  })
  @Column({ name: 'artisan_name_ar', length: 200, nullable: true })
  artisanNameAr: string;

  /**
   * Artisan bio (English)
   */
  @ApiProperty({
    description: 'Featured artisan biography (English)',
    nullable: true,
  })
  @Column({ name: 'artisan_bio_en', type: 'text', nullable: true })
  artisanBioEn: string;

  /**
   * Artisan bio (Arabic)
   */
  @ApiProperty({
    description: 'Featured artisan biography (Arabic)',
    nullable: true,
  })
  @Column({ name: 'artisan_bio_ar', type: 'text', nullable: true })
  artisanBioAr: string;

  /**
   * Artisan location
   */
  @ApiProperty({
    description: 'Artisan workshop location',
    example: 'Damascus Old City',
    nullable: true,
  })
  @Column({ name: 'artisan_location', length: 200, nullable: true })
  artisanLocation: string;

  /**
   * Artisan years of experience
   */
  @ApiProperty({
    description: 'Years of artisan experience',
    example: 25,
    nullable: true,
  })
  @Column({ name: 'artisan_experience', nullable: true })
  artisanExperience: number;

  // ================================
  // APPROVAL WORKFLOW
  // ================================

  /**
   * Approval status
   */
  @ApiProperty({
    description: 'Current approval status',
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
   * Admin who approved this banner
   */
  @ApiProperty({
    description: 'Admin who approved this banner',
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
    description: 'When the banner was approved',
    nullable: true,
  })
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  /**
   * Rejection reason
   */
  @ApiProperty({
    description: 'Reason for rejection if status is rejected',
    nullable: true,
  })
  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  // ================================
  // STATUS & VISIBILITY
  // ================================

  /**
   * Whether banner is active
   */
  @ApiProperty({
    description: 'Whether banner is active and visible',
    example: true,
    default: true,
  })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // ================================
  // AUDIT & ENTERPRISE FIELDS
  // ================================

  /**
   * User who created this banner
   */
  @ApiProperty({
    description: 'User who created this banner',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'created_by', nullable: true })
  createdBy: number;

  /**
   * User who last updated this banner
   */
  @ApiProperty({
    description: 'User who last updated this banner',
    type: () => User,
    nullable: true,
  })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater: User;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: number;

  /**
   * Version number for optimistic locking
   */
  @ApiProperty({
    description: 'Version number for conflict detection',
    example: 1,
    default: 1,
  })
  @Column({ name: 'version', default: 1 })
  version: number;

  /**
   * Tags for categorization (JSON array)
   */
  @ApiProperty({
    description: 'Tags for banner categorization',
    example: ['damascus-steel', 'heritage', 'artisan'],
    nullable: true,
  })
  @Column({ name: 'tags', type: 'simple-json', nullable: true })
  tags: string[];

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
   * Check if banner is currently active and within schedule
   */
  isCurrentlyActive(): boolean {
    const now = new Date();
    return (
      this.isActive &&
      this.approvalStatus === 'approved' &&
      now >= this.scheduleStart &&
      now <= this.scheduleEnd
    );
  }

  /**
   * Check if banner is scheduled for future
   */
  isScheduledForFuture(): boolean {
    const now = new Date();
    return now < this.scheduleStart;
  }

  /**
   * Check if banner has expired
   */
  hasExpired(): boolean {
    const now = new Date();
    return now > this.scheduleEnd;
  }

  /**
   * Get display name based on language
   */
  getDisplayName(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.nameAr : this.nameEn;
  }

  /**
   * Get headline based on language
   */
  getHeadline(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.headlineAr : this.headlineEn;
  }

  /**
   * Get subheadline based on language
   */
  getSubheadline(language: 'en' | 'ar' = 'en'): string {
    if (language === 'ar' && this.subheadlineAr) {
      return this.subheadlineAr;
    }
    return this.subheadlineEn || '';
  }

  /**
   * Get CTA text based on language
   */
  getCtaText(language: 'en' | 'ar' = 'en'): string {
    return language === 'ar' ? this.ctaTextAr : this.ctaTextEn;
  }

  /**
   * Calculate and update CTR
   */
  calculateClickThroughRate(): number {
    if (this.impressions === 0) return 0;
    return (this.clicks / this.impressions) * 100;
  }

  /**
   * Calculate and update conversion rate
   */
  calculateConversionRate(): number {
    if (this.clicks === 0) return 0;
    return (this.conversions / this.clicks) * 100;
  }

  /**
   * Get appropriate image URL based on device
   */
  getImageUrl(device: 'desktop' | 'tablet' | 'mobile' = 'desktop'): string {
    switch (device) {
      case 'mobile':
        return (
          this.imageUrlMobile || this.imageUrlTablet || this.imageUrlDesktop
        );
      case 'tablet':
        return this.imageUrlTablet || this.imageUrlDesktop;
      default:
        return this.imageUrlDesktop;
    }
  }

  /**
   * Check if banner needs admin attention
   */
  needsAdminAttention(): boolean {
    return (
      this.approvalStatus === 'pending' ||
      this.approvalStatus === 'rejected' ||
      (this.isCurrentlyActive() &&
        this.impressions === 0 &&
        this.getDaysActive() > 3)
    );
  }

  /**
   * Get number of days banner has been active
   */
  getDaysActive(): number {
    const now = new Date();
    const start = new Date(this.scheduleStart);
    if (now < start) return 0;
    const diffTime = Math.abs(now.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get performance score (0-100)
   */
  getPerformanceScore(): number {
    // Weighted scoring: CTR (40%) + Conversion Rate (40%) + Revenue/Impression (20%)
    const ctrScore = Math.min(this.clickThroughRate * 8, 40); // 5% CTR = 40 points
    const conversionScore = Math.min(this.conversionRate * 4, 40); // 10% conversion = 40 points
    const revenuePerImpression =
      this.impressions > 0 ? this.revenue / this.impressions : 0;
    const revenueScore = Math.min((revenuePerImpression / 1000) * 20, 20); // 1000 SYP/impression = 20 points

    return Math.round(ctrScore + conversionScore + revenueScore);
  }
}

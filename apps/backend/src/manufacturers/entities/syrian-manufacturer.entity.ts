/**
 * @file syrian-manufacturer.entity.ts
 * @description Enterprise Syrian Manufacturer Entity with Comprehensive Features
 *
 * ENTERPRISE FEATURES:
 * - Arabic/English dual language support with RTL text handling
 * - Syrian business registration and tax ID integration
 * - Multi-level verification system with approval workflow
 * - Comprehensive business information and contact details
 * - Integration with Syrian governorates and address system
 * - Performance analytics and business metrics tracking
 * - Advanced search and filtering capabilities
 * - Enterprise audit trails and compliance tracking
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';
import { User } from '../../users/entities/user.entity';
import { ProductEntity } from '../../products/entities/product.entity';

/**
 * Manufacturer verification status enum
 */
export enum SyrianManufacturerVerificationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

/**
 * Manufacturer business type enum
 */
export enum SyrianManufacturerBusinessType {
  LOCAL_MANUFACTURER = 'local_manufacturer',
  INTERNATIONAL_BRAND = 'international_brand',
  DISTRIBUTOR = 'distributor',
  AUTHORIZED_DEALER = 'authorized_dealer',
  PRIVATE_LABEL = 'private_label',
  WHOLESALER = 'wholesaler',
}

/**
 * Manufacturer size category enum
 */
export enum SyrianManufacturerSizeCategory {
  SMALL = 'small', // < 10 employees
  MEDIUM = 'medium', // 10-100 employees
  LARGE = 'large', // 100+ employees
  ENTERPRISE = 'enterprise', // 500+ employees
}

@Entity('syrian_manufacturers')
export class SyrianManufacturerEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique manufacturer identifier' })
  id: number;

  /**
   * Basic Information - Bilingual Support
   */
  @Column({ name: 'name_en', length: 200 })
  @Index()
  @ApiProperty({
    description: 'Manufacturer name in English',
    example: 'Syrian Electronics Manufacturing Co.',
  })
  nameEn: string;

  @Column({ name: 'name_ar', length: 200 })
  @Index()
  @ApiProperty({
    description: 'Manufacturer name in Arabic',
    example: 'شركة الصناعات الإلكترونية السورية',
  })
  nameAr: string;

  @Column({ name: 'brand_name_en', length: 150, nullable: true })
  @ApiProperty({
    description: 'Brand/trademark name in English',
    example: 'SyrTech',
    required: false,
  })
  brandNameEn?: string;

  @Column({ name: 'brand_name_ar', length: 150, nullable: true })
  @ApiProperty({
    description: 'Brand/trademark name in Arabic',
    example: 'سيرتك',
    required: false,
  })
  brandNameAr?: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Detailed description in English',
    example:
      'Leading Syrian manufacturer of consumer electronics and industrial equipment since 1995.',
  })
  descriptionEn?: string;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Detailed description in Arabic',
    example:
      'شركة رائدة في تصنيع الإلكترونيات الاستهلاكية والمعدات الصناعية منذ عام 1995.',
  })
  descriptionAr?: string;

  /**
   * Business Classification
   */
  @Column({
    name: 'business_type',
    type: 'enum',
    enum: SyrianManufacturerBusinessType,
    default: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
  })
  @Index()
  @ApiProperty({
    description: 'Type of manufacturing business',
    enum: SyrianManufacturerBusinessType,
    example: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
  })
  businessType: SyrianManufacturerBusinessType;

  @Column({
    name: 'size_category',
    type: 'enum',
    enum: SyrianManufacturerSizeCategory,
    default: SyrianManufacturerSizeCategory.SMALL,
  })
  @ApiProperty({
    description: 'Company size category',
    enum: SyrianManufacturerSizeCategory,
    example: SyrianManufacturerSizeCategory.MEDIUM,
  })
  sizeCategory: SyrianManufacturerSizeCategory;

  @Column({ name: 'employee_count', type: 'int', nullable: true })
  @ApiProperty({
    description: 'Approximate number of employees',
    example: 75,
    required: false,
  })
  employeeCount?: number;

  @Column({ name: 'founded_year', type: 'int', nullable: true })
  @ApiProperty({
    description: 'Year the company was founded',
    example: 1995,
    required: false,
  })
  foundedYear?: number;

  /**
   * Syrian Business Registration
   */
  @Column({ name: 'syrian_tax_id', length: 50, unique: true, nullable: true })
  @ApiProperty({
    description: 'Syrian tax identification number',
    example: 'TAX-SYR-123456789',
    required: false,
  })
  syrianTaxId?: string;

  @Column({ name: 'commercial_registry', length: 50, nullable: true })
  @ApiProperty({
    description: 'Syrian commercial registry number',
    example: 'REG-DAM-2023-001234',
    required: false,
  })
  commercialRegistry?: string;

  @Column({ name: 'industrial_license', length: 50, nullable: true })
  @ApiProperty({
    description: 'Industrial license number',
    example: 'IND-LIC-DM-456789',
    required: false,
  })
  industrialLicense?: string;

  @Column({ name: 'export_license', length: 50, nullable: true })
  @ApiProperty({
    description: 'Export/import license number',
    example: 'EXP-IMP-789123',
    required: false,
  })
  exportLicense?: string;

  /**
   * Location and Contact Information
   */
  @ManyToOne(() => SyrianGovernorateEntity, { nullable: true })
  @JoinColumn({ name: 'governorate_id' })
  @ApiProperty({
    description: 'Primary Syrian governorate where manufacturer is located',
    type: () => SyrianGovernorateEntity,
  })
  governorate?: SyrianGovernorateEntity;

  @Column({ name: 'address_en', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Full address in English',
    example: 'Industrial Zone, Damascus, Building 15',
    required: false,
  })
  addressEn?: string;

  @Column({ name: 'address_ar', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Full address in Arabic',
    example: 'المنطقة الصناعية، دمشق، المبنى رقم 15',
    required: false,
  })
  addressAr?: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  @ApiProperty({
    description: 'Primary phone number',
    example: '+963-11-1234567',
    required: false,
  })
  phone?: string;

  @Column({ name: 'mobile', length: 20, nullable: true })
  @ApiProperty({
    description: 'Mobile phone number',
    example: '+963-987-654321',
    required: false,
  })
  mobile?: string;

  @Column({ name: 'email', length: 150, nullable: true })
  @Index()
  @ApiProperty({
    description: 'Primary email address',
    example: 'info@syrtech.sy',
    required: false,
  })
  email?: string;

  @Column({ name: 'website', length: 200, nullable: true })
  @ApiProperty({
    description: 'Official website URL',
    example: 'https://www.syrtech.sy',
    required: false,
  })
  website?: string;

  /**
   * Media and Branding
   */
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Logo image URL',
    example: 'https://storage.souqsyria.com/manufacturers/syrtech-logo.png',
    required: false,
  })
  logoUrl?: string;

  @Column({ name: 'banner_url', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Banner/cover image URL',
    example: 'https://storage.souqsyria.com/manufacturers/syrtech-banner.jpg',
    required: false,
  })
  bannerUrl?: string;

  @Column({ name: 'gallery_images', type: 'json', nullable: true })
  @ApiProperty({
    description: 'Gallery images of facilities, products, certificates',
    example: [
      'https://storage.souqsyria.com/manufacturers/syrtech-factory-1.jpg',
      'https://storage.souqsyria.com/manufacturers/syrtech-products.jpg',
    ],
    required: false,
  })
  galleryImages?: string[];

  /**
   * Verification and Compliance
   */
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: SyrianManufacturerVerificationStatus,
    default: SyrianManufacturerVerificationStatus.DRAFT,
  })
  @Index()
  @ApiProperty({
    description: 'Current verification status',
    enum: SyrianManufacturerVerificationStatus,
    example: SyrianManufacturerVerificationStatus.VERIFIED,
  })
  verificationStatus: SyrianManufacturerVerificationStatus;

  @Column({ name: 'verification_documents', type: 'json', nullable: true })
  @ApiProperty({
    description: 'Uploaded verification documents',
    example: {
      commercialRegistry: 'https://storage.souqsyria.com/docs/registry.pdf',
      taxCertificate: 'https://storage.souqsyria.com/docs/tax-cert.pdf',
      qualityCertificates: ['https://storage.souqsyria.com/docs/iso-cert.pdf'],
    },
    required: false,
  })
  verificationDocuments?: {
    commercialRegistry?: string;
    taxCertificate?: string;
    industrialLicense?: string;
    qualityCertificates?: string[];
    exportDocuments?: string[];
  };

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  @ApiProperty({
    description: 'Admin user who verified this manufacturer',
    type: () => User,
  })
  verifiedBy?: User;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  @ApiProperty({
    description: 'When verification was completed',
    example: '2025-08-09T14:30:00.000Z',
    required: false,
  })
  verifiedAt?: Date;

  @Column({ name: 'verification_notes_en', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Verification notes in English',
    example:
      'All documents verified successfully. Quality certificates up to date.',
    required: false,
  })
  verificationNotesEn?: string;

  @Column({ name: 'verification_notes_ar', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Verification notes in Arabic',
    example: 'تم التحقق من جميع الوثائق بنجاح. شهادات الجودة محدثة.',
    required: false,
  })
  verificationNotesAr?: string;

  /**
   * Business Metrics and Analytics
   */
  @Column({ name: 'total_products', type: 'int', default: 0 })
  @ApiProperty({
    description: 'Total number of products from this manufacturer',
    example: 245,
  })
  totalProducts: number;

  @Column({ name: 'active_products', type: 'int', default: 0 })
  @ApiProperty({
    description: 'Number of active products currently listed',
    example: 198,
  })
  activeProducts: number;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Average rating across all products',
    example: 4.25,
  })
  averageRating: number;

  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  @ApiProperty({
    description: 'Total number of reviews across all products',
    example: 1024,
  })
  totalReviews: number;

  @Column({
    name: 'monthly_revenue_syp',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Monthly revenue in Syrian Pounds',
    example: 2500000.0,
  })
  monthlyRevenueSyp: number;

  /**
   * Performance and Quality Tracking
   */
  @Column({ name: 'quality_score', type: 'int', default: 0 })
  @ApiProperty({
    description: 'Overall quality score (0-100)',
    example: 87,
  })
  qualityScore: number;

  @Column({
    name: 'delivery_performance',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'On-time delivery percentage',
    example: 94.5,
  })
  deliveryPerformance: number;

  @Column({
    name: 'customer_satisfaction',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Customer satisfaction percentage',
    example: 92.3,
  })
  customerSatisfaction: number;

  @Column({
    name: 'return_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  @ApiProperty({
    description: 'Product return rate percentage',
    example: 2.1,
  })
  returnRate: number;

  /**
   * Social Media and Marketing
   */
  @Column({ name: 'social_media_links', type: 'json', nullable: true })
  @ApiProperty({
    description: 'Social media platform links',
    example: {
      facebook: 'https://facebook.com/syrtech.official',
      instagram: 'https://instagram.com/syrtech_sy',
      linkedin: 'https://linkedin.com/company/syrtech',
      twitter: 'https://twitter.com/syrtech_sy',
    },
    required: false,
  })
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };

  @Column({ name: 'marketing_preferences', type: 'json', nullable: true })
  @ApiProperty({
    description: 'Marketing and communication preferences',
    example: {
      allowEmailMarketing: true,
      allowSmsMarketing: false,
      preferredLanguage: 'ar',
      contactFrequency: 'weekly',
    },
    required: false,
  })
  marketingPreferences?: {
    allowEmailMarketing?: boolean;
    allowSmsMarketing?: boolean;
    preferredLanguage?: 'en' | 'ar' | 'both';
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  };

  /**
   * System Fields
   */
  @Column({ name: 'is_active', default: true })
  @Index()
  @ApiProperty({
    description: 'Whether manufacturer is active',
    example: true,
  })
  isActive: boolean;

  @Column({ name: 'is_featured', default: false })
  @Index()
  @ApiProperty({
    description: 'Whether manufacturer is featured',
    example: false,
  })
  isFeatured: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  @ApiProperty({
    description: 'Display sort order',
    example: 100,
  })
  sortOrder: number;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  @ApiProperty({
    description: 'Additional metadata for custom fields',
    example: {
      specializations: ['electronics', 'automotive_parts'],
      certifications: ['ISO_9001', 'ISO_14001'],
      exportMarkets: ['UAE', 'Jordan', 'Lebanon'],
    },
    required: false,
  })
  metadata?: {
    specializations?: string[];
    certifications?: string[];
    exportMarkets?: string[];
    customFields?: Record<string, any>;
  };

  /**
   * Relationships
   */
  @OneToMany(() => ProductEntity, (product) => product.manufacturer)
  @ApiProperty({
    description: 'Products manufactured by this company',
    type: () => [ProductEntity],
  })
  products?: ProductEntity[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  @ApiProperty({
    description: 'User who created this manufacturer record',
    type: () => User,
  })
  createdBy?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  @ApiProperty({
    description: 'User who last updated this manufacturer record',
    type: () => User,
  })
  updatedBy?: User;

  /**
   * Soft Delete Support
   */
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  @Index()
  @ApiProperty({
    description: 'Soft delete timestamp',
    required: false,
  })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', type: 'int', nullable: true })
  @ApiProperty({
    description: 'User ID who deleted this record',
    required: false,
  })
  deletedBy?: number;

  /**
   * Timestamps
   */
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  @ApiProperty({ description: 'Record creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'Record last update timestamp' })
  updatedAt: Date;

  /**
   * Virtual Properties for API Responses
   */
  get displayName(): string {
    return this.nameEn || this.nameAr || 'Unknown Manufacturer';
  }

  get displayNameAr(): string {
    return this.nameAr || this.nameEn || 'مُصنع غير معروف';
  }

  get isVerified(): boolean {
    return (
      this.verificationStatus === SyrianManufacturerVerificationStatus.VERIFIED
    );
  }

  get hasDocuments(): boolean {
    return !!(
      this.verificationDocuments &&
      Object.keys(this.verificationDocuments).length > 0
    );
  }
}

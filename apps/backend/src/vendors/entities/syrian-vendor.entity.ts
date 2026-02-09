/**
 * @file syrian-vendor.entity.ts
 * @description Enterprise Syrian Vendor Entity with Comprehensive Business Management
 *
 * ENTERPRISE FEATURES:
 * - Complete Syrian business registration and compliance
 * - Multi-language support (Arabic/English)
 * - 9-state vendor verification workflow
 * - Performance metrics and quality scoring
 * - Financial management with SYP currency support
 * - Geographic optimization for Syrian market
 * - Integration with Syrian business regulations
 * - Automated business verification and monitoring
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';

// Core Entities
import { User } from '../../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

/**
 * Syrian Vendor Verification Status Enum
 */
export enum SyrianVendorVerificationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
  PENDING_DOCUMENTS = 'pending_documents',
  REQUIRES_CLARIFICATION = 'requires_clarification',
  EXPIRED = 'expired',
}

/**
 * Syrian Business Type Enum
 */
export enum SyrianBusinessType {
  SOLE_PROPRIETORSHIP = 'sole_proprietorship', // مؤسسة فردية
  LIMITED_LIABILITY = 'limited_liability', // شركة ذات مسؤولية محدودة
  JOINT_STOCK = 'joint_stock', // شركة مساهمة
  PARTNERSHIP = 'partnership', // شركة تضامن
  COOPERATIVE = 'cooperative', // تعاونية
  BRANCH_OFFICE = 'branch_office', // فرع شركة أجنبية
}

/**
 * Syrian Vendor Category Enum
 */
export enum SyrianVendorCategory {
  MANUFACTURER = 'manufacturer', // مصنع
  DISTRIBUTOR = 'distributor', // موزع
  RETAILER = 'retailer', // تاجر تجزئة
  WHOLESALER = 'wholesaler', // تاجر جملة
  IMPORTER = 'importer', // مستورد
  EXPORTER = 'exporter', // مصدر
  SERVICE_PROVIDER = 'service_provider', // مقدم خدمات
}

@Entity('syrian_vendors')
export class SyrianVendorEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ========================================
  // USER RELATIONSHIP
  // ========================================
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: false })
  @Index()
  userId: number;

  // ========================================
  // BASIC VENDOR INFORMATION (BILINGUAL)
  // ========================================
  @Column({ name: 'store_name_en', length: 255, nullable: false })
  storeNameEn: string;

  @Column({ name: 'store_name_ar', length: 255, nullable: false })
  storeNameAr: string;

  @Column({ name: 'store_description_en', type: 'text', nullable: true })
  storeDescriptionEn: string;

  @Column({ name: 'store_description_ar', type: 'text', nullable: true })
  storeDescriptionAr: string;

  @Column({ name: 'store_logo_url', length: 500, nullable: true })
  storeLogoUrl: string;

  @Column({ name: 'store_banner_url', length: 500, nullable: true })
  storeBannerUrl: string;

  @Column({ name: 'store_gallery_urls', type: 'json', nullable: true })
  storeGalleryUrls: string[];

  // ========================================
  // SYRIAN BUSINESS REGISTRATION
  // ========================================
  @Column({
    name: 'business_type',
    type: 'enum',
    enum: SyrianBusinessType,
    nullable: false,
  })
  businessType: SyrianBusinessType;

  @Column({
    name: 'vendor_category',
    type: 'enum',
    enum: SyrianVendorCategory,
    nullable: false,
  })
  vendorCategory: SyrianVendorCategory;

  @Column({
    name: 'commercial_register_number',
    length: 50,
    nullable: true,
    unique: true,
  })
  commercialRegisterNumber: string;

  @Column({ name: 'tax_id_number', length: 50, nullable: true, unique: true })
  taxIdNumber: string;

  @Column({ name: 'industrial_license_number', length: 50, nullable: true })
  industrialLicenseNumber: string;

  @Column({ name: 'trade_union_membership_number', length: 50, nullable: true })
  tradeUnionMembershipNumber: string;

  @Column({ name: 'chamber_of_commerce_number', length: 50, nullable: true })
  chamberOfCommerceNumber: string;

  // ========================================
  // SYRIAN GEOGRAPHIC INFORMATION
  // ========================================
  @ManyToOne(() => SyrianGovernorateEntity, { eager: false })
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  @Column({ name: 'governorate_id', nullable: false })
  @Index()
  governorateId: number;

  @Column({ name: 'city_name_en', length: 100, nullable: false })
  cityNameEn: string;

  @Column({ name: 'city_name_ar', length: 100, nullable: false })
  cityNameAr: string;

  @Column({ name: 'district_name_en', length: 100, nullable: true })
  districtNameEn: string;

  @Column({ name: 'district_name_ar', length: 100, nullable: true })
  districtNameAr: string;

  @Column({ name: 'street_address_en', type: 'text', nullable: false })
  streetAddressEn: string;

  @Column({ name: 'street_address_ar', type: 'text', nullable: false })
  streetAddressAr: string;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string;

  @Column({ name: 'geographic_coordinates', type: 'json', nullable: true })
  geographicCoordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  // ========================================
  // CONTACT INFORMATION
  // ========================================
  @Column({ name: 'primary_phone', length: 20, nullable: false })
  primaryPhone: string;

  @Column({ name: 'secondary_phone', length: 20, nullable: true })
  secondaryPhone: string;

  @Column({ name: 'whatsapp_number', length: 20, nullable: true })
  whatsappNumber: string;

  @Column({ name: 'business_email', length: 255, nullable: false })
  @Index()
  businessEmail: string;

  @Column({ name: 'website_url', length: 255, nullable: true })
  websiteUrl: string;

  @Column({ name: 'social_media_links', type: 'json', nullable: true })
  socialMediaLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    telegram?: string;
  };

  // ========================================
  // VERIFICATION AND STATUS MANAGEMENT
  // ========================================
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: SyrianVendorVerificationStatus,
    default: SyrianVendorVerificationStatus.DRAFT,
  })
  @Index()
  verificationStatus: SyrianVendorVerificationStatus;

  @Column({
    name: 'verification_submitted_at',
    type: 'datetime',
    nullable: true,
  })
  verificationSubmittedAt: Date;

  @Column({
    name: 'verification_reviewed_at',
    type: 'datetime',
    nullable: true,
  })
  verificationReviewedAt: Date;

  @Column({
    name: 'verification_completed_at',
    type: 'datetime',
    nullable: true,
  })
  verificationCompletedAt: Date;

  @Column({ name: 'verification_expires_at', type: 'datetime', nullable: true })
  verificationExpiresAt: Date;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'verified_by_user_id' })
  verifiedBy: User;

  @Column({ name: 'verified_by_user_id', nullable: true })
  verifiedByUserId: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_premium', type: 'boolean', default: false })
  isPremium: boolean;

  // ========================================
  // PERFORMANCE METRICS
  // ========================================
  @Column({
    name: 'quality_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  @Index()
  qualityScore: number;

  @Column({ name: 'total_orders', type: 'bigint', default: 0 })
  totalOrders: number;

  @Column({ name: 'total_revenue_syp', type: 'bigint', default: 0 })
  @Index()
  totalRevenueSyp: number;

  @Column({
    name: 'total_revenue_usd',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  totalRevenueUsd: number;

  @Column({
    name: 'average_order_value_syp',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  averageOrderValueSyp: number;

  @Column({
    name: 'customer_satisfaction_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  customerSatisfactionRating: number;

  @Column({ name: 'total_reviews', type: 'bigint', default: 0 })
  totalReviews: number;

  @Column({
    name: 'response_time_hours',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  responseTimeHours: number;

  @Column({
    name: 'fulfillment_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  fulfillmentRate: number;

  @Column({
    name: 'return_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  returnRate: number;

  // ========================================
  // FINANCIAL INFORMATION (SYP FOCUSED)
  // ========================================
  @Column({ name: 'bank_account_name', length: 255, nullable: true })
  bankAccountName: string;

  @Column({ name: 'bank_name', length: 100, nullable: true })
  bankName: string;

  @Column({ name: 'bank_account_number', length: 50, nullable: true })
  bankAccountNumber: string;

  @Column({ name: 'bank_branch_name', length: 100, nullable: true })
  bankBranchName: string;

  @Column({ name: 'bank_routing_code', length: 20, nullable: true })
  bankRoutingCode: string;

  @Column({
    name: 'preferred_payout_currency',
    type: 'enum',
    enum: ['SYP', 'USD', 'EUR'],
    default: 'SYP',
  })
  preferredPayoutCurrency: 'SYP' | 'USD' | 'EUR';

  @Column({
    name: 'minimum_payout_amount_syp',
    type: 'bigint',
    default: 100000,
  }) // 100,000 SYP minimum
  minimumPayoutAmountSyp: number;

  @Column({
    name: 'commission_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  commissionRate: number;

  // ========================================
  // BUSINESS HOURS AND OPERATIONS
  // ========================================
  @Column({ name: 'business_hours', type: 'json', nullable: true })
  businessHours: {
    sunday?: { open: string; close: string; closed?: boolean };
    monday?: { open: string; close: string; closed?: boolean };
    tuesday?: { open: string; close: string; closed?: boolean };
    wednesday?: { open: string; close: string; closed?: boolean };
    thursday?: { open: string; close: string; closed?: boolean };
    friday?: { open: string; close: string; closed?: boolean };
    saturday?: { open: string; close: string; closed?: boolean };
    timezone?: string;
  };

  @Column({ name: 'processing_time_days', type: 'int', default: 3 })
  processingTimeDays: number;

  @Column({ name: 'shipping_methods', type: 'json', nullable: true })
  shippingMethods: Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    estimatedDays: number;
    costSyp: number;
  }>;

  @Column({ name: 'return_policy_en', type: 'text', nullable: true })
  returnPolicyEn: string;

  @Column({ name: 'return_policy_ar', type: 'text', nullable: true })
  returnPolicyAr: string;

  @Column({ name: 'terms_of_service_en', type: 'text', nullable: true })
  termsOfServiceEn: string;

  @Column({ name: 'terms_of_service_ar', type: 'text', nullable: true })
  termsOfServiceAr: string;

  // ========================================
  // WORKFLOW AND SLA MANAGEMENT
  // ========================================
  @Column({ name: 'sla_response_time_hours', type: 'int', default: 24 })
  slaResponseTimeHours: number;

  @Column({ name: 'sla_processing_time_days', type: 'int', default: 3 })
  slaProcessingTimeDays: number;

  @Column({
    name: 'sla_fulfillment_rate_target',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 95.0,
  })
  slaFulfillmentRateTarget: number;

  @Column({
    name: 'workflow_priority',
    type: 'enum',
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  workflowPriority: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ name: 'escalation_level', type: 'int', default: 0 })
  escalationLevel: number;

  @Column({ name: 'next_review_date', type: 'datetime', nullable: true })
  nextReviewDate: Date;

  @Column({
    name: 'last_performance_review_at',
    type: 'datetime',
    nullable: true,
  })
  lastPerformanceReviewAt: Date;

  // ========================================
  // CULTURAL AND LOCALIZATION PREFERENCES
  // ========================================
  @Column({
    name: 'preferred_language',
    type: 'enum',
    enum: ['en', 'ar', 'both'],
    default: 'both',
  })
  preferredLanguage: 'en' | 'ar' | 'both';

  @Column({ name: 'use_arabic_numerals', type: 'boolean', default: true })
  useArabicNumerals: boolean;

  @Column({ name: 'use_hijri_calendar', type: 'boolean', default: false })
  useHijriCalendar: boolean;

  @Column({ name: 'currency_display_format', type: 'json', nullable: true })
  currencyDisplayFormat: {
    sypFormat?: string; // e.g., "### ### ل.س"
    usdFormat?: string; // e.g., "$###.##"
    eurFormat?: string; // e.g., "€###.##"
  };

  // ========================================
  // DOCUMENT MANAGEMENT
  // ========================================
  @Column({ name: 'uploaded_documents', type: 'json', nullable: true })
  uploadedDocuments: Array<{
    id: string;
    type:
      | 'commercial_register'
      | 'tax_certificate'
      | 'id_copy'
      | 'bank_statement'
      | 'other';
    filename: string;
    url: string;
    uploadedAt: Date;
    verificationStatus: 'pending' | 'approved' | 'rejected';
  }>;

  @Column({
    name: 'required_documents_completed',
    type: 'boolean',
    default: false,
  })
  requiredDocumentsCompleted: boolean;

  // ========================================
  // COMPLIANCE AND REGULATORY
  // ========================================
  @Column({ name: 'compliance_status', type: 'json', nullable: true })
  complianceStatus: {
    taxCompliant: boolean;
    commercialRegisterValid: boolean;
    industrialLicenseValid: boolean;
    lastComplianceCheck: Date;
  };

  @Column({ name: 'regulatory_notes', type: 'text', nullable: true })
  regulatoryNotes: string;

  @Column({ name: 'special_permissions', type: 'json', nullable: true })
  specialPermissions: string[];

  // ========================================
  // METADATA AND TRACKING
  // ========================================
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'tags', type: 'json', nullable: true })
  tags: string[];

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date;

  // ========================================
  // COMPUTED PROPERTIES FOR API RESPONSES
  // ========================================

  /**
   * Get formatted store name based on language preference
   */
  getStoreName(
    language: 'en' | 'ar' | 'both' = 'both',
  ): string | { en: string; ar: string } {
    switch (language) {
      case 'en':
        return this.storeNameEn;
      case 'ar':
        return this.storeNameAr;
      default:
        return { en: this.storeNameEn, ar: this.storeNameAr };
    }
  }

  /**
   * Get formatted description based on language preference
   */
  getStoreDescription(
    language: 'en' | 'ar' | 'both' = 'both',
  ): string | { en: string; ar: string } {
    switch (language) {
      case 'en':
        return this.storeDescriptionEn;
      case 'ar':
        return this.storeDescriptionAr;
      default:
        return { en: this.storeDescriptionEn, ar: this.storeDescriptionAr };
    }
  }

  /**
   * Get formatted revenue in SYP with Arabic numerals if preferred
   */
  getFormattedRevenue(): { syp: string; usd: string; formatted: string } {
    const sypFormatted = this.useArabicNumerals
      ? this.toArabicNumerals(this.totalRevenueSyp.toLocaleString()) + ' ل.س'
      : this.totalRevenueSyp.toLocaleString() + ' SYP';

    const usdFormatted = '$' + this.totalRevenueUsd.toFixed(2);

    return {
      syp: this.totalRevenueSyp.toLocaleString() + ' SYP',
      usd: usdFormatted,
      formatted: sypFormatted,
    };
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  private toArabicNumerals(num: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  }

  /**
   * Calculate verification progress percentage
   */
  getVerificationProgress(): number {
    const steps = [
      this.storeNameEn && this.storeNameAr,
      this.businessType,
      this.vendorCategory,
      this.governorateId,
      this.primaryPhone,
      this.businessEmail,
      this.requiredDocumentsCompleted,
    ];

    const completedSteps = steps.filter(Boolean).length;
    return Math.round((completedSteps / steps.length) * 100);
  }

  /**
   * Check if vendor is eligible for verification
   */
  isEligibleForVerification(): boolean {
    return (
      this.getVerificationProgress() >= 90 &&
      this.requiredDocumentsCompleted &&
      this.verificationStatus === SyrianVendorVerificationStatus.DRAFT
    );
  }

  /**
   * Get localized verification status
   */
  getVerificationStatusLocalized(language: 'en' | 'ar' = 'en'): string {
    const statusMap = {
      en: {
        [SyrianVendorVerificationStatus.DRAFT]: 'Draft',
        [SyrianVendorVerificationStatus.SUBMITTED]: 'Submitted',
        [SyrianVendorVerificationStatus.UNDER_REVIEW]: 'Under Review',
        [SyrianVendorVerificationStatus.VERIFIED]: 'Verified',
        [SyrianVendorVerificationStatus.REJECTED]: 'Rejected',
        [SyrianVendorVerificationStatus.SUSPENDED]: 'Suspended',
        [SyrianVendorVerificationStatus.PENDING_DOCUMENTS]: 'Pending Documents',
        [SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION]:
          'Requires Clarification',
        [SyrianVendorVerificationStatus.EXPIRED]: 'Expired',
      },
      ar: {
        [SyrianVendorVerificationStatus.DRAFT]: 'مسودة',
        [SyrianVendorVerificationStatus.SUBMITTED]: 'مقدم للمراجعة',
        [SyrianVendorVerificationStatus.UNDER_REVIEW]: 'قيد المراجعة',
        [SyrianVendorVerificationStatus.VERIFIED]: 'موثق',
        [SyrianVendorVerificationStatus.REJECTED]: 'مرفوض',
        [SyrianVendorVerificationStatus.SUSPENDED]: 'معلق',
        [SyrianVendorVerificationStatus.PENDING_DOCUMENTS]:
          'في انتظار المستندات',
        [SyrianVendorVerificationStatus.REQUIRES_CLARIFICATION]:
          'يتطلب توضيحاً',
        [SyrianVendorVerificationStatus.EXPIRED]: 'منتهي الصلاحية',
      },
    };

    return statusMap[language][this.verificationStatus];
  }
}

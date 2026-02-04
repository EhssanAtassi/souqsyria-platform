/**
 * @file syrian-refund.entity.ts
 * @description Enterprise Syrian Refund Entity with Banking Integration
 *
 * ENTERPRISE FEATURES:
 * - Complete Syrian banking system integration
 * - Multi-currency support (SYP/USD/EUR) with real-time exchange rates
 * - 10-state refund workflow with automated processing
 * - Performance metrics and SLA monitoring
 * - Regulatory compliance with Syrian financial regulations
 * - Integration with Syrian banks and payment systems
 * - Automated dispute resolution and escalation
 * - Arabic/English localization with cultural formatting
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
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { PaymentTransaction } from '../../payment/entities/payment-transaction.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

/**
 * Syrian Refund Status Enum (10-state workflow)
 */
export enum SyrianRefundStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

/**
 * Syrian Refund Method Enum
 */
export enum SyrianRefundMethod {
  BANK_TRANSFER = 'bank_transfer', // حوالة بنكية
  CASH_ON_DELIVERY = 'cash_on_delivery', // دفع عند التسليم
  MOBILE_WALLET = 'mobile_wallet', // محفظة إلكترونية
  STORE_CREDIT = 'store_credit', // رصيد المتجر
  ORIGINAL_PAYMENT = 'original_payment', // الطريقة الأصلية
  CHECK = 'check', // شيك
  WESTERN_UNION = 'western_union', // ويسترن يونيون
  MANUAL_PROCESS = 'manual_process', // معالجة يدوية
}

/**
 * Syrian Bank Type Enum
 */
export enum SyrianBankType {
  COMMERCIAL_BANK_OF_SYRIA = 'commercial_bank_of_syria', // المصرف التجاري السوري
  INDUSTRIAL_BANK = 'industrial_bank', // المصرف الصناعي
  POPULAR_CREDIT_BANK = 'popular_credit_bank', // مصرف الائتمان الشعبي
  AGRICULTURAL_COOPERATIVE_BANK = 'agricultural_cooperative_bank', // المصرف الزراعي التعاوني
  REAL_ESTATE_BANK = 'real_estate_bank', // المصرف العقاري
  SAVINGS_BANK = 'savings_bank', // مصرف التوفير
  CENTRAL_BANK = 'central_bank', // المصرف المركزي
  INTERNATIONAL_BANK = 'international_bank', // البنوك الدولية
  ISLAMIC_BANK = 'islamic_bank', // البنوك الإسلامية
}

/**
 * Refund Reason Category Enum
 */
export enum RefundReasonCategory {
  PRODUCT_DEFECT = 'product_defect', // عيب في المنتج
  WRONG_ITEM = 'wrong_item', // منتج خطأ
  DAMAGED_SHIPPING = 'damaged_shipping', // تضرر أثناء الشحن
  NOT_AS_DESCRIBED = 'not_as_described', // غير مطابق للوصف
  CUSTOMER_CHANGE_MIND = 'customer_change_mind', // تغيير رأي العميل
  LATE_DELIVERY = 'late_delivery', // تأخير في التسليم
  VENDOR_CANCELLATION = 'vendor_cancellation', // إلغاء البائع
  DUPLICATE_ORDER = 'duplicate_order', // طلب مكرر
  FRAUD_SUSPECTED = 'fraud_suspected', // اشتباه احتيال
  SYSTEM_ERROR = 'system_error', // خطأ في النظام
  REGULATORY_REQUIREMENT = 'regulatory_requirement', // متطلب تنظيمي
}

@Entity('syrian_refunds')
@Index(['refundStatus'])
@Index(['refundMethod'])
@Index(['currency'])
@Index(['bankType'])
@Index(['governorate'])
@Index(['reasonCategory'])
@Index(['isUrgent'])
@Index(['amountSyp'])
@Index(['submittedAt'])
@Index(['completedAt'])
export class SyrianRefundEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ========================================
  // CORE RELATIONSHIPS
  // ========================================
  @ManyToOne(() => Order, { eager: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', nullable: false })
  @Index()
  orderId: number;

  @ManyToOne(() => PaymentTransaction, { eager: false })
  @JoinColumn({ name: 'payment_transaction_id' })
  paymentTransaction: PaymentTransaction;

  @Column({ name: 'payment_transaction_id', nullable: false })
  @Index()
  paymentTransactionId: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'customer_id', nullable: false })
  @Index()
  customerId: number;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'processed_by_id' })
  processedBy: User;

  @Column({ name: 'processed_by_id', nullable: true })
  processedById: number;

  @ManyToOne(() => SyrianGovernorateEntity, { eager: false })
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  @Column({ name: 'governorate_id', nullable: true })
  governorateId: number;

  // ========================================
  // REFUND BASIC INFORMATION
  // ========================================
  @Column({ name: 'refund_reference', length: 50, unique: true })
  @Index()
  refundReference: string; // REF-SY-2025-001234

  @Column({
    name: 'refund_status',
    type: 'enum',
    enum: SyrianRefundStatus,
    default: SyrianRefundStatus.DRAFT,
  })
  @Index()
  refundStatus: SyrianRefundStatus;

  @Column({
    name: 'refund_method',
    type: 'enum',
    enum: SyrianRefundMethod,
    nullable: false,
  })
  refundMethod: SyrianRefundMethod;

  @Column({
    name: 'reason_category',
    type: 'enum',
    enum: RefundReasonCategory,
    nullable: false,
  })
  reasonCategory: RefundReasonCategory;

  @Column({ name: 'reason_description_en', type: 'text', nullable: false })
  reasonDescriptionEn: string;

  @Column({ name: 'reason_description_ar', type: 'text', nullable: false })
  reasonDescriptionAr: string;

  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  // ========================================
  // MULTI-CURRENCY AMOUNTS
  // ========================================
  @Column({ name: 'amount_syp', type: 'bigint', nullable: false })
  @Index()
  amountSyp: number;

  @Column({
    name: 'amount_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  amountUsd: number;

  @Column({
    name: 'amount_eur',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  amountEur: number;

  @Column({
    name: 'currency',
    type: 'enum',
    enum: ['SYP', 'USD', 'EUR'],
    default: 'SYP',
  })
  @Index()
  currency: 'SYP' | 'USD' | 'EUR';

  @Column({
    name: 'exchange_rate_usd_to_syp',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  exchangeRateUsdToSyp: number;

  @Column({
    name: 'exchange_rate_eur_to_syp',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  exchangeRateEurToSyp: number;

  @Column({
    name: 'exchange_rates_locked_at',
    type: 'datetime',
    nullable: true,
  })
  exchangeRatesLockedAt: Date;

  // ========================================
  // SYRIAN BANKING INFORMATION
  // ========================================
  @Column({
    name: 'bank_type',
    type: 'enum',
    enum: SyrianBankType,
    nullable: true,
  })
  bankType: SyrianBankType;

  @Column({ name: 'bank_name_en', length: 255, nullable: true })
  bankNameEn: string;

  @Column({ name: 'bank_name_ar', length: 255, nullable: true })
  bankNameAr: string;

  @Column({ name: 'bank_branch_code', length: 20, nullable: true })
  bankBranchCode: string;

  @Column({ name: 'bank_branch_name_en', length: 255, nullable: true })
  bankBranchNameEn: string;

  @Column({ name: 'bank_branch_name_ar', length: 255, nullable: true })
  bankBranchNameAr: string;

  @Column({ name: 'account_holder_name', length: 255, nullable: true })
  accountHolderName: string;

  @Column({ name: 'account_number', length: 50, nullable: true })
  accountNumber: string;

  @Column({ name: 'iban_number', length: 34, nullable: true })
  ibanNumber: string;

  @Column({ name: 'swift_code', length: 11, nullable: true })
  swiftCode: string;

  @Column({
    name: 'bank_verification_status',
    type: 'enum',
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  })
  bankVerificationStatus: 'pending' | 'verified' | 'failed';

  @Column({ name: 'bank_verification_notes', type: 'text', nullable: true })
  bankVerificationNotes: string;

  // ========================================
  // PROCESSING INFORMATION
  // ========================================
  @Column({
    name: 'processing_fee_syp',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  processingFeeSyp: number;

  @Column({ name: 'net_refund_amount_syp', type: 'bigint', nullable: true })
  netRefundAmountSyp: number;

  @Column({
    name: 'transaction_reference',
    length: 100,
    nullable: true,
    unique: true,
  })
  transactionReference: string;

  @Column({ name: 'external_reference_id', length: 100, nullable: true })
  externalReferenceId: string;

  @Column({ name: 'processing_batch_id', length: 50, nullable: true })
  processingBatchId: string;

  @Column({ name: 'is_automated_processing', type: 'boolean', default: false })
  isAutomatedProcessing: boolean;

  @Column({ name: 'automation_rules_applied', type: 'json', nullable: true })
  automationRulesApplied: string[];

  // ========================================
  // WORKFLOW AND SLA MANAGEMENT
  // ========================================
  @Column({ name: 'is_urgent', type: 'boolean', default: false })
  @Index()
  isUrgent: boolean;

  @Column({
    name: 'priority_level',
    type: 'enum',
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  })
  priorityLevel: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ name: 'sla_deadline', type: 'datetime', nullable: true })
  slaDeadline: Date;

  @Column({ name: 'escalation_level', type: 'int', default: 0 })
  escalationLevel: number;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason: string;

  @Column({ name: 'requires_manual_review', type: 'boolean', default: false })
  requiresManualReview: boolean;

  @Column({ name: 'manual_review_reason', type: 'text', nullable: true })
  manualReviewReason: string;

  // ========================================
  // DOCUMENT AND EVIDENCE MANAGEMENT
  // ========================================
  @Column({ name: 'evidence_documents', type: 'json', nullable: true })
  evidenceDocuments: Array<{
    id: string;
    type: 'photo' | 'video' | 'receipt' | 'bank_statement' | 'other';
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

  @Column({
    name: 'documents_verification_notes',
    type: 'text',
    nullable: true,
  })
  documentsVerificationNotes: string;

  // ========================================
  // COMPLIANCE AND REGULATORY
  // ========================================
  @Column({
    name: 'regulatory_compliance_checked',
    type: 'boolean',
    default: false,
  })
  regulatoryComplianceChecked: boolean;

  @Column({
    name: 'anti_money_laundering_status',
    type: 'enum',
    enum: ['pending', 'cleared', 'flagged'],
    default: 'pending',
  })
  antiMoneyLaunderingStatus: 'pending' | 'cleared' | 'flagged';

  @Column({
    name: 'fraud_risk_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  fraudRiskScore: number;

  @Column({ name: 'compliance_notes', type: 'text', nullable: true })
  complianceNotes: string;

  @Column({
    name: 'regulatory_approval_required',
    type: 'boolean',
    default: false,
  })
  regulatoryApprovalRequired: boolean;

  @Column({
    name: 'regulatory_approval_status',
    type: 'enum',
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required',
  })
  regulatoryApprovalStatus:
    | 'not_required'
    | 'pending'
    | 'approved'
    | 'rejected';

  // ========================================
  // TIMING AND WORKFLOW TRACKING
  // ========================================
  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  @Index()
  submittedAt: Date;

  @Column({ name: 'review_started_at', type: 'datetime', nullable: true })
  reviewStartedAt: Date;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ name: 'processing_started_at', type: 'datetime', nullable: true })
  processingStartedAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  @Index()
  completedAt: Date;

  @Column({ name: 'failed_at', type: 'datetime', nullable: true })
  failedAt: Date;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'dispute_raised_at', type: 'datetime', nullable: true })
  disputeRaisedAt: Date;

  // ========================================
  // CUSTOMER COMMUNICATION
  // ========================================
  @Column({
    name: 'customer_notification_sent',
    type: 'boolean',
    default: false,
  })
  customerNotificationSent: boolean;

  @Column({ name: 'sms_notifications_enabled', type: 'boolean', default: true })
  smsNotificationsEnabled: boolean;

  @Column({
    name: 'email_notifications_enabled',
    type: 'boolean',
    default: true,
  })
  emailNotificationsEnabled: boolean;

  @Column({
    name: 'preferred_language',
    type: 'enum',
    enum: ['en', 'ar', 'both'],
    default: 'ar',
  })
  preferredLanguage: 'en' | 'ar' | 'both';

  @Column({ name: 'customer_phone_number', length: 20, nullable: true })
  customerPhoneNumber: string;

  @Column({ name: 'customer_email', length: 255, nullable: true })
  customerEmail: string;

  // ========================================
  // PERFORMANCE AND ANALYTICS
  // ========================================
  @Column({
    name: 'processing_time_hours',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  processingTimeHours: number;

  @Column({
    name: 'customer_satisfaction_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  customerSatisfactionRating: number;

  @Column({
    name: 'resolution_category',
    type: 'enum',
    enum: ['automatic', 'manual', 'escalated', 'disputed'],
    nullable: true,
  })
  resolutionCategory: 'automatic' | 'manual' | 'escalated' | 'disputed';

  @Column({ name: 'resolution_complexity_score', type: 'int', default: 1 })
  resolutionComplexityScore: number;

  // ========================================
  // LOCALIZATION PREFERENCES
  // ========================================
  @Column({ name: 'use_arabic_numerals', type: 'boolean', default: true })
  useArabicNumerals: boolean;

  @Column({ name: 'currency_display_format', type: 'json', nullable: true })
  currencyDisplayFormat: {
    sypFormat?: string; // e.g., "### ### ل.س"
    usdFormat?: string; // e.g., "$###.##"
    eurFormat?: string; // e.g., "€###.##"
  };

  // ========================================
  // METADATA AND TRACKING
  // ========================================
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'workflow_history', type: 'json', nullable: true })
  workflowHistory: Array<{
    fromStatus: string;
    toStatus: string;
    timestamp: Date;
    userId?: number;
    reason?: string;
    automatedTransition: boolean;
  }>;

  @Column({ name: 'system_flags', type: 'json', nullable: true })
  systemFlags: string[];

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
   * Get formatted refund amount based on language preference
   */
  getFormattedAmount(language: 'en' | 'ar' | 'both' = 'both'): {
    syp: string;
    formatted: string;
    usd?: string;
    eur?: string;
  } {
    const sypFormatted = this.useArabicNumerals
      ? this.toArabicNumerals(this.amountSyp.toLocaleString()) + ' ل.س'
      : this.amountSyp.toLocaleString() + ' SYP';

    const result: any = {
      syp: this.amountSyp.toLocaleString() + ' SYP',
      formatted: sypFormatted,
    };

    if (this.amountUsd) {
      result.usd = '$' + this.amountUsd.toFixed(2);
    }

    if (this.amountEur) {
      result.eur = '€' + this.amountEur.toFixed(2);
    }

    return result;
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  private toArabicNumerals(num: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  }

  /**
   * Get localized status text
   */
  getStatusLocalized(language: 'en' | 'ar' = 'en'): string {
    const statusMap = {
      en: {
        [SyrianRefundStatus.DRAFT]: 'Draft',
        [SyrianRefundStatus.SUBMITTED]: 'Submitted',
        [SyrianRefundStatus.UNDER_REVIEW]: 'Under Review',
        [SyrianRefundStatus.APPROVED]: 'Approved',
        [SyrianRefundStatus.REJECTED]: 'Rejected',
        [SyrianRefundStatus.PROCESSING]: 'Processing',
        [SyrianRefundStatus.COMPLETED]: 'Completed',
        [SyrianRefundStatus.FAILED]: 'Failed',
        [SyrianRefundStatus.DISPUTED]: 'Disputed',
        [SyrianRefundStatus.CANCELLED]: 'Cancelled',
      },
      ar: {
        [SyrianRefundStatus.DRAFT]: 'مسودة',
        [SyrianRefundStatus.SUBMITTED]: 'مقدم',
        [SyrianRefundStatus.UNDER_REVIEW]: 'قيد المراجعة',
        [SyrianRefundStatus.APPROVED]: 'موافق عليه',
        [SyrianRefundStatus.REJECTED]: 'مرفوض',
        [SyrianRefundStatus.PROCESSING]: 'قيد المعالجة',
        [SyrianRefundStatus.COMPLETED]: 'مكتمل',
        [SyrianRefundStatus.FAILED]: 'فشل',
        [SyrianRefundStatus.DISPUTED]: 'متنازع عليه',
        [SyrianRefundStatus.CANCELLED]: 'ملغي',
      },
    };

    return statusMap[language][this.refundStatus];
  }

  /**
   * Get refund method localized text
   */
  getRefundMethodLocalized(language: 'en' | 'ar' = 'en'): string {
    const methodMap = {
      en: {
        [SyrianRefundMethod.BANK_TRANSFER]: 'Bank Transfer',
        [SyrianRefundMethod.CASH_ON_DELIVERY]: 'Cash on Delivery',
        [SyrianRefundMethod.MOBILE_WALLET]: 'Mobile Wallet',
        [SyrianRefundMethod.STORE_CREDIT]: 'Store Credit',
        [SyrianRefundMethod.ORIGINAL_PAYMENT]: 'Original Payment Method',
        [SyrianRefundMethod.CHECK]: 'Check',
        [SyrianRefundMethod.WESTERN_UNION]: 'Western Union',
        [SyrianRefundMethod.MANUAL_PROCESS]: 'Manual Process',
      },
      ar: {
        [SyrianRefundMethod.BANK_TRANSFER]: 'حوالة بنكية',
        [SyrianRefundMethod.CASH_ON_DELIVERY]: 'دفع عند التسليم',
        [SyrianRefundMethod.MOBILE_WALLET]: 'محفظة إلكترونية',
        [SyrianRefundMethod.STORE_CREDIT]: 'رصيد المتجر',
        [SyrianRefundMethod.ORIGINAL_PAYMENT]: 'طريقة الدفع الأصلية',
        [SyrianRefundMethod.CHECK]: 'شيك',
        [SyrianRefundMethod.WESTERN_UNION]: 'ويسترن يونيون',
        [SyrianRefundMethod.MANUAL_PROCESS]: 'معالجة يدوية',
      },
    };

    return methodMap[language][this.refundMethod];
  }

  /**
   * Calculate processing time in hours
   */
  calculateProcessingTime(): number {
    if (this.completedAt && this.submittedAt) {
      return (
        (this.completedAt.getTime() - this.submittedAt.getTime()) /
        (1000 * 60 * 60)
      );
    }
    return 0;
  }

  /**
   * Check if refund is overdue based on SLA
   */
  isOverdue(): boolean {
    if (!this.slaDeadline) return false;
    return (
      new Date() > this.slaDeadline &&
      ![
        SyrianRefundStatus.COMPLETED,
        SyrianRefundStatus.CANCELLED,
        SyrianRefundStatus.REJECTED,
      ].includes(this.refundStatus)
    );
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    const statusProgress = {
      [SyrianRefundStatus.DRAFT]: 10,
      [SyrianRefundStatus.SUBMITTED]: 20,
      [SyrianRefundStatus.UNDER_REVIEW]: 40,
      [SyrianRefundStatus.APPROVED]: 60,
      [SyrianRefundStatus.PROCESSING]: 80,
      [SyrianRefundStatus.COMPLETED]: 100,
      [SyrianRefundStatus.REJECTED]: 100,
      [SyrianRefundStatus.FAILED]: 100,
      [SyrianRefundStatus.DISPUTED]: 50,
      [SyrianRefundStatus.CANCELLED]: 100,
    };

    return statusProgress[this.refundStatus] || 0;
  }
}

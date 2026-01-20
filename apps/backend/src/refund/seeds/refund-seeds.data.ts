/**
 * @file refund-seeds.data.ts
 * @description Comprehensive Syrian Refund Seeding Data
 *
 * ENTERPRISE FEATURES:
 * - Complete Syrian refund test data with 10-state workflow distribution
 * - Multi-currency support (SYP/USD/EUR) with realistic exchange rates
 * - Syrian banking integration with all major banks
 * - Performance testing data with bulk generation capabilities
 * - Arabic/English localization with cultural formatting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 * @version 2.0.0 - Enterprise Edition
 */

import {
  SyrianRefundStatus,
  SyrianRefundMethod,
  SyrianBankType,
  RefundReasonCategory,
} from '../entities/syrian-refund.entity';

/**
 * Sample Syrian Refunds with comprehensive 10-state workflow distribution
 */
export const SAMPLE_SYRIAN_REFUNDS = [
  {
    // DRAFT Status - Customer started refund but hasn't submitted
    refundNumber: 'REF-2025-000001',
    refundStatus: SyrianRefundStatus.DRAFT,
    refundMethod: SyrianRefundMethod.BANK_TRANSFER,
    currency: 'SYP',
    amountSyp: 125000, // ~$50 USD
    amountOriginal: 125000,
    exchangeRate: 1.0,
    reasonCategory: RefundReasonCategory.PRODUCT_DEFECT,
    reasonArabic: 'عيب في التصنيع - شاشة الهاتف لا تعمل',
    reasonEnglish: 'Manufacturing defect - Phone screen not working',
    bankType: SyrianBankType.COMMERCIAL_BANK_OF_SYRIA,
    bankAccountNumber: '1234567890123456',
    bankSwiftCode: 'CBSYSYDA',
    bankAccountHolder: 'محمد أحمد الخوري',
    bankAccountHolderEn: 'Mohammad Ahmad Al-Khoury',
    isUrgent: false,
    governorateId: 1, // Damascus
    description: 'هاتف ذكي وصل معطل',
    descriptionEn: 'Smartphone arrived defective',
  },
  {
    // SUBMITTED Status - Recently submitted for review
    refundNumber: 'REF-2025-000002',
    refundStatus: SyrianRefundStatus.SUBMITTED,
    refundMethod: SyrianRefundMethod.ORIGINAL_PAYMENT,
    currency: 'USD',
    amountSyp: 375000, // ~$150 USD
    amountOriginal: 150,
    exchangeRate: 2500,
    reasonCategory: RefundReasonCategory.WRONG_ITEM,
    reasonArabic: 'وصل منتج مختلف عن المطلوب - لون خطأ',
    reasonEnglish: 'Wrong item received - incorrect color',
    bankType: SyrianBankType.INDUSTRIAL_BANK,
    bankAccountNumber: '2345678901234567',
    bankSwiftCode: 'IDBKSYDA',
    bankAccountHolder: 'فاطمة محمود العلي',
    bankAccountHolderEn: 'Fatima Mahmoud Al-Ali',
    isUrgent: true,
    governorateId: 2, // Aleppo
    submittedAt: new Date('2025-08-19T10:30:00Z'),
    description: 'طلبت أحمر ووصل أزرق',
    descriptionEn: 'Ordered red but received blue',
  },
  {
    // UNDER_REVIEW Status - Being reviewed by support team
    refundNumber: 'REF-2025-000003',
    refundStatus: SyrianRefundStatus.UNDER_REVIEW,
    refundMethod: SyrianRefundMethod.MOBILE_WALLET,
    currency: 'EUR',
    amountSyp: 300000, // ~€100 EUR
    amountOriginal: 100,
    exchangeRate: 3000,
    reasonCategory: RefundReasonCategory.DAMAGED_SHIPPING,
    reasonArabic: 'تضرر المنتج أثناء الشحن - كسر في العبوة',
    reasonEnglish: 'Product damaged during shipping - broken packaging',
    bankType: SyrianBankType.POPULAR_CREDIT_BANK,
    bankAccountNumber: '3456789012345678',
    bankSwiftCode: 'PCBSYDA',
    bankAccountHolder: 'عبد الرحمن سليم حداد',
    bankAccountHolderEn: 'Abdul Rahman Saleem Haddad',
    isUrgent: false,
    governorateId: 3, // Homs
    submittedAt: new Date('2025-08-18T14:15:00Z'),
    reviewStartedAt: new Date('2025-08-19T09:00:00Z'),
    description: 'وصل المنتج مكسور',
    descriptionEn: 'Product arrived broken',
  },
  {
    // APPROVED Status - Approved and ready for processing
    refundNumber: 'REF-2025-000004',
    refundStatus: SyrianRefundStatus.APPROVED,
    refundMethod: SyrianRefundMethod.BANK_TRANSFER,
    currency: 'SYP',
    amountSyp: 200000,
    amountOriginal: 200000,
    exchangeRate: 1.0,
    reasonCategory: RefundReasonCategory.NOT_AS_DESCRIBED,
    reasonArabic: 'المنتج لا يطابق الوصف - مقاس مختلف',
    reasonEnglish: 'Product not as described - different size',
    bankType: SyrianBankType.AGRICULTURAL_COOPERATIVE_BANK,
    bankAccountNumber: '4567890123456789',
    bankSwiftCode: 'ACBSYDA',
    bankAccountHolder: 'رنا خالد الشامي',
    bankAccountHolderEn: 'Rana Khaled Al-Shami',
    isUrgent: true,
    governorateId: 4, // Latakia
    submittedAt: new Date('2025-08-17T16:20:00Z'),
    reviewStartedAt: new Date('2025-08-18T08:30:00Z'),
    approvedAt: new Date('2025-08-19T11:45:00Z'),
    processedById: 1, // Admin user
    description: 'مقاس XL بدلاً من M',
    descriptionEn: 'Size XL instead of M',
  },
  {
    // REJECTED Status - Rejected with reason
    refundNumber: 'REF-2025-000005',
    refundStatus: SyrianRefundStatus.REJECTED,
    refundMethod: SyrianRefundMethod.STORE_CREDIT,
    currency: 'SYP',
    amountSyp: 75000,
    amountOriginal: 75000,
    exchangeRate: 1.0,
    reasonCategory: RefundReasonCategory.CUSTOMER_CHANGE_MIND,
    reasonArabic: 'غير راضي عن المنتج - تغيير رأي',
    reasonEnglish: 'Not satisfied with product - change of mind',
    rejectionReason: 'لا يمكن إرجاع المنتجات المخصصة',
    rejectionReasonEn: 'Customized products cannot be returned',
    isUrgent: false,
    governorateId: 5, // Tartus
    submittedAt: new Date('2025-08-16T12:10:00Z'),
    reviewStartedAt: new Date('2025-08-17T09:15:00Z'),
    rejectedAt: new Date('2025-08-18T15:30:00Z'),
    processedById: 2, // Support admin
    description: 'منتج مخصص حسب الطلب',
    descriptionEn: 'Custom-made product',
  },
  {
    // PROCESSING Status - Currently being processed
    refundNumber: 'REF-2025-000006',
    refundStatus: SyrianRefundStatus.PROCESSING,
    refundMethod: SyrianRefundMethod.BANK_TRANSFER,
    currency: 'USD',
    amountSyp: 500000, // ~$200 USD
    amountOriginal: 200,
    exchangeRate: 2500,
    reasonCategory: RefundReasonCategory.LATE_DELIVERY,
    reasonArabic: 'تأخير في التسليم أكثر من المتفق عليه',
    reasonEnglish: 'Delivery delay beyond agreed timeframe',
    bankType: SyrianBankType.REAL_ESTATE_BANK,
    bankAccountNumber: '5678901234567890',
    bankSwiftCode: 'REBSYDA',
    bankAccountHolder: 'أحمد محمد الطويل',
    bankAccountHolderEn: 'Ahmad Mohammad Al-Taweel',
    isUrgent: true,
    governorateId: 6, // Daraa
    submittedAt: new Date('2025-08-15T08:45:00Z'),
    reviewStartedAt: new Date('2025-08-16T10:20:00Z'),
    approvedAt: new Date('2025-08-17T14:15:00Z'),
    processingStartedAt: new Date('2025-08-19T08:00:00Z'),
    processedById: 1,
    description: 'تأخر أسبوعين عن الموعد',
    descriptionEn: 'Two weeks late from scheduled date',
  },
  {
    // COMPLETED Status - Successfully completed refund
    refundNumber: 'REF-2025-000007',
    refundStatus: SyrianRefundStatus.COMPLETED,
    refundMethod: SyrianRefundMethod.BANK_TRANSFER,
    currency: 'EUR',
    amountSyp: 450000, // ~€150 EUR
    amountOriginal: 150,
    exchangeRate: 3000,
    reasonCategory: RefundReasonCategory.VENDOR_CANCELLATION,
    reasonArabic: 'إلغاء البائع للطلب - عدم توفر المخزون',
    reasonEnglish: 'Vendor cancelled order - out of stock',
    bankType: SyrianBankType.SAVINGS_BANK,
    bankAccountNumber: '6789012345678901',
    bankSwiftCode: 'SBSYDA',
    bankAccountHolder: 'سارة عبد الله الحلبي',
    bankAccountHolderEn: 'Sara Abdullah Al-Halabi',
    isUrgent: false,
    governorateId: 7, // As-Suwayda
    submittedAt: new Date('2025-08-10T13:25:00Z'),
    reviewStartedAt: new Date('2025-08-11T09:40:00Z'),
    approvedAt: new Date('2025-08-12T11:20:00Z'),
    processingStartedAt: new Date('2025-08-13T08:30:00Z'),
    completedAt: new Date('2025-08-15T16:45:00Z'),
    processedById: 3,
    description: 'البائع ألغى الطلب',
    descriptionEn: 'Vendor cancelled the order',
  },
  {
    // FAILED Status - Processing failed
    refundNumber: 'REF-2025-000008',
    refundStatus: SyrianRefundStatus.FAILED,
    refundMethod: SyrianRefundMethod.BANK_TRANSFER,
    currency: 'SYP',
    amountSyp: 180000,
    amountOriginal: 180000,
    exchangeRate: 1.0,
    reasonCategory: RefundReasonCategory.DUPLICATE_ORDER,
    reasonArabic: 'طلب مكرر بالخطأ',
    reasonEnglish: 'Duplicate order by mistake',
    bankType: SyrianBankType.CENTRAL_BANK,
    bankAccountNumber: '7890123456789012',
    bankSwiftCode: 'CBSYDAM',
    bankAccountHolder: 'خالد سامي النجار',
    bankAccountHolderEn: 'Khaled Sami Al-Najjar',
    failureReason: 'رقم الحساب البنكي غير صحيح',
    failureReasonEn: 'Invalid bank account number',
    isUrgent: true,
    governorateId: 8, // Quneitra
    submittedAt: new Date('2025-08-12T15:30:00Z'),
    reviewStartedAt: new Date('2025-08-13T10:15:00Z'),
    approvedAt: new Date('2025-08-14T13:45:00Z'),
    processingStartedAt: new Date('2025-08-15T09:20:00Z'),
    failedAt: new Date('2025-08-16T11:30:00Z'),
    processedById: 2,
    description: 'خطأ في رقم الحساب',
    descriptionEn: 'Error in account number',
  },
  {
    // DISPUTED Status - Customer disputed the decision
    refundNumber: 'REF-2025-000009',
    refundStatus: SyrianRefundStatus.DISPUTED,
    refundMethod: SyrianRefundMethod.WESTERN_UNION,
    currency: 'USD',
    amountSyp: 312500, // ~$125 USD
    amountOriginal: 125,
    exchangeRate: 2500,
    reasonCategory: RefundReasonCategory.FRAUD_SUSPECTED,
    reasonArabic: 'اشتباه في عملية احتيال',
    reasonEnglish: 'Suspected fraudulent transaction',
    disputeReason: 'العميل لا يوافق على القرار',
    disputeReasonEn: 'Customer disagrees with decision',
    isUrgent: true,
    governorateId: 9, // Hama
    submittedAt: new Date('2025-08-08T11:20:00Z'),
    reviewStartedAt: new Date('2025-08-09T08:45:00Z'),
    rejectedAt: new Date('2025-08-10T14:30:00Z'),
    disputedAt: new Date('2025-08-11T16:15:00Z'),
    processedById: 1,
    description: 'مشتبه به كاحتيال',
    descriptionEn: 'Suspected as fraud',
  },
  {
    // CANCELLED Status - Refund was cancelled
    refundNumber: 'REF-2025-000010',
    refundStatus: SyrianRefundStatus.CANCELLED,
    refundMethod: SyrianRefundMethod.CASH_ON_DELIVERY,
    currency: 'SYP',
    amountSyp: 95000,
    amountOriginal: 95000,
    exchangeRate: 1.0,
    reasonCategory: RefundReasonCategory.SYSTEM_ERROR,
    reasonArabic: 'خطأ في النظام أثناء المعالجة',
    reasonEnglish: 'System error during processing',
    cancellationReason: 'العميل طلب الإلغاء',
    cancellationReasonEn: 'Customer requested cancellation',
    isUrgent: false,
    governorateId: 10, // Al-Hasakah
    submittedAt: new Date('2025-08-14T09:10:00Z'),
    reviewStartedAt: new Date('2025-08-15T11:25:00Z'),
    cancelledAt: new Date('2025-08-16T13:40:00Z'),
    processedById: 3,
    description: 'العميل ألغى الطلب',
    descriptionEn: 'Customer cancelled request',
  },
];

/**
 * Syrian Refund Analytics Data for Performance Testing
 */
export const REFUND_ANALYTICS_DATA = {
  // Status Distribution (10 states)
  statusDistribution: [
    { status: SyrianRefundStatus.DRAFT, count: 12, percentage: 8.5 },
    { status: SyrianRefundStatus.SUBMITTED, count: 18, percentage: 12.8 },
    { status: SyrianRefundStatus.UNDER_REVIEW, count: 25, percentage: 17.7 },
    { status: SyrianRefundStatus.APPROVED, count: 35, percentage: 24.8 },
    { status: SyrianRefundStatus.REJECTED, count: 15, percentage: 10.6 },
    { status: SyrianRefundStatus.PROCESSING, count: 20, percentage: 14.2 },
    { status: SyrianRefundStatus.COMPLETED, count: 45, percentage: 31.9 },
    { status: SyrianRefundStatus.FAILED, count: 8, percentage: 5.7 },
    { status: SyrianRefundStatus.DISPUTED, count: 5, percentage: 3.5 },
    { status: SyrianRefundStatus.CANCELLED, count: 7, percentage: 5.0 },
  ],

  // Refund Method Distribution
  methodDistribution: [
    { method: SyrianRefundMethod.BANK_TRANSFER, count: 85, percentage: 47.2 },
    { method: SyrianRefundMethod.ORIGINAL_PAYMENT, count: 45, percentage: 25.0 },
    { method: SyrianRefundMethod.MOBILE_WALLET, count: 20, percentage: 11.1 },
    { method: SyrianRefundMethod.STORE_CREDIT, count: 15, percentage: 8.3 },
    { method: SyrianRefundMethod.CASH_ON_DELIVERY, count: 10, percentage: 5.6 },
    { method: SyrianRefundMethod.WESTERN_UNION, count: 3, percentage: 1.7 },
    { method: SyrianRefundMethod.CHECK, count: 1, percentage: 0.6 },
    { method: SyrianRefundMethod.MANUAL_PROCESS, count: 1, percentage: 0.6 },
  ],

  // Currency Distribution
  currencyDistribution: [
    { currency: 'SYP', count: 120, percentage: 66.7, avgAmount: 187500 },
    { currency: 'USD', count: 45, percentage: 25.0, avgAmount: 125 },
    { currency: 'EUR', count: 15, percentage: 8.3, avgAmount: 100 },
  ],

  // Reason Category Distribution
  reasonDistribution: [
    { category: RefundReasonCategory.PRODUCT_DEFECT, count: 35, percentage: 19.4 },
    { category: RefundReasonCategory.WRONG_ITEM, count: 28, percentage: 15.6 },
    { category: RefundReasonCategory.DAMAGED_SHIPPING, count: 25, percentage: 13.9 },
    { category: RefundReasonCategory.NOT_AS_DESCRIBED, count: 22, percentage: 12.2 },
    { category: RefundReasonCategory.CUSTOMER_CHANGE_MIND, count: 20, percentage: 11.1 },
    { category: RefundReasonCategory.LATE_DELIVERY, count: 18, percentage: 10.0 },
    { category: RefundReasonCategory.VENDOR_CANCELLATION, count: 15, percentage: 8.3 },
    { category: RefundReasonCategory.DUPLICATE_ORDER, count: 8, percentage: 4.4 },
    { category: RefundReasonCategory.SYSTEM_ERROR, count: 5, percentage: 2.8 },
    { category: RefundReasonCategory.FRAUD_SUSPECTED, count: 3, percentage: 1.7 },
    { category: RefundReasonCategory.REGULATORY_REQUIREMENT, count: 1, percentage: 0.6 },
  ],

  // Processing Time Analytics (in hours)
  processingTimes: [
    { stage: 'submission_to_review', avgHours: 8.5, minHours: 2, maxHours: 24 },
    { stage: 'review_to_decision', avgHours: 18.2, minHours: 4, maxHours: 72 },
    { stage: 'approval_to_processing', avgHours: 12.7, minHours: 6, maxHours: 48 },
    { stage: 'processing_to_completion', avgHours: 24.8, minHours: 12, maxHours: 120 },
    { stage: 'total_processing_time', avgHours: 64.2, minHours: 24, maxHours: 264 },
  ],

  // SLA Performance Metrics
  slaMetrics: [
    { metric: 'urgent_requests_processed_on_time', percentage: 85.2, target: 90.0 },
    { metric: 'standard_requests_processed_on_time', percentage: 92.1, target: 85.0 },
    { metric: 'customer_satisfaction_score', percentage: 88.5, target: 85.0 },
    { metric: 'first_contact_resolution', percentage: 76.3, target: 75.0 },
    { metric: 'escalation_rate', percentage: 12.8, target: 15.0 },
  ],

  // Monthly Performance Data
  monthlyPerformance: [
    { month: '2025-01', totalRefunds: 145, completedRefunds: 132, avgProcessingTime: 58.2 },
    { month: '2025-02', totalRefunds: 163, completedRefunds: 149, avgProcessingTime: 61.7 },
    { month: '2025-03', totalRefunds: 178, completedRefunds: 165, avgProcessingTime: 59.3 },
    { month: '2025-04', totalRefunds: 192, completedRefunds: 178, avgProcessingTime: 62.8 },
    { month: '2025-05', totalRefunds: 201, completedRefunds: 187, avgProcessingTime: 65.1 },
    { month: '2025-06', totalRefunds: 215, completedRefunds: 198, avgProcessingTime: 63.4 },
    { month: '2025-07', totalRefunds: 224, completedRefunds: 208, avgProcessingTime: 66.7 },
    { month: '2025-08', totalRefunds: 180, completedRefunds: 142, avgProcessingTime: 64.2 },
  ],
};

/**
 * Syrian Bank Integration Data
 */
export const SYRIAN_BANKS_DATA = [
  {
    bankType: SyrianBankType.COMMERCIAL_BANK_OF_SYRIA,
    bankNameAr: 'المصرف التجاري السوري',
    bankNameEn: 'Commercial Bank of Syria',
    swiftCode: 'CBSYSYDA',
    processingTimeHours: 24,
    supportedCurrencies: ['SYP', 'USD', 'EUR'],
    isActive: true,
  },
  {
    bankType: SyrianBankType.INDUSTRIAL_BANK,
    bankNameAr: 'المصرف الصناعي',
    bankNameEn: 'Industrial Bank',
    swiftCode: 'IDBKSYDA',
    processingTimeHours: 48,
    supportedCurrencies: ['SYP', 'USD'],
    isActive: true,
  },
  {
    bankType: SyrianBankType.POPULAR_CREDIT_BANK,
    bankNameAr: 'مصرف الائتمان الشعبي',
    bankNameEn: 'Popular Credit Bank',
    swiftCode: 'PCBSYDA',
    processingTimeHours: 36,
    supportedCurrencies: ['SYP', 'USD', 'EUR'],
    isActive: true,
  },
  {
    bankType: SyrianBankType.AGRICULTURAL_COOPERATIVE_BANK,
    bankNameAr: 'المصرف الزراعي التعاوني',
    bankNameEn: 'Agricultural Cooperative Bank',
    swiftCode: 'ACBSYDA',
    processingTimeHours: 72,
    supportedCurrencies: ['SYP'],
    isActive: true,
  },
  {
    bankType: SyrianBankType.REAL_ESTATE_BANK,
    bankNameAr: 'المصرف العقاري',
    bankNameEn: 'Real Estate Bank',
    swiftCode: 'REBSYDA',
    processingTimeHours: 48,
    supportedCurrencies: ['SYP', 'USD'],
    isActive: true,
  },
];

/**
 * Performance Test Configuration
 */
export const PERFORMANCE_TEST_CONFIG = {
  // Bulk generation settings
  bulkGeneration: {
    smallBatch: 100,
    mediumBatch: 1000,
    largeBatch: 10000,
    stressBatch: 50000,
  },

  // Load testing scenarios
  loadTestScenarios: [
    { name: 'peak_traffic', concurrentRefunds: 500, duration: '5m' },
    { name: 'normal_traffic', concurrentRefunds: 100, duration: '10m' },
    { name: 'stress_test', concurrentRefunds: 1000, duration: '2m' },
  ],

  // Data validation rules
  validationRules: {
    maxRefundAmount: 10000000, // 10M SYP
    minRefundAmount: 1000, // 1K SYP
    maxProcessingDays: 30,
    requiredFields: ['refundNumber', 'refundStatus', 'currency', 'amountSyp'],
  },
};
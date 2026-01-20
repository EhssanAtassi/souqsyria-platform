/**
 * @file syrian-kyc.enums.ts
 * @description Syrian KYC Enums and Status Definitions
 *
 * Separated to prevent circular dependencies between entities
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

/**
 * KYC Document Processing Status Enum
 * Tracks the workflow state of KYC documents through the approval process
 */
export enum SyrianKycStatus {
  DRAFT = 'draft', // مسودة
  SUBMITTED = 'submitted', // مُقدم للمراجعة
  UNDER_REVIEW = 'under_review', // قيد المراجعة
  REQUIRES_CLARIFICATION = 'requires_clarification', // يحتاج توضيح
  APPROVED = 'approved', // موافق عليه
  REJECTED = 'rejected', // مرفوض
  EXPIRED = 'expired', // منتهي الصلاحية
  SUSPENDED = 'suspended', // معلق
}

/**
 * KYC verification level for different business types
 */
export enum SyrianKycVerificationLevel {
  BASIC = 'basic', // تحقق أساسي - للأفراد
  BUSINESS = 'business', // تحقق تجاري - للشركات الصغيرة
  CORPORATE = 'corporate', // تحقق مؤسسي - للشركات الكبيرة
  PREMIUM = 'premium', // تحقق مميز - للشركاء المميزين
}

/**
 * Syrian KYC document types with proper localization
 */
export enum SyrianKycDocumentType {
  SYRIAN_ID = 'syrian_id', // البطاقة الشخصية السورية
  SYRIAN_PASSPORT = 'syrian_passport', // جواز السفر السوري
  BUSINESS_LICENSE = 'business_license', // رخصة العمل التجاري
  TAX_CERTIFICATE = 'tax_certificate', // شهادة تسجيل ضريبي
  CHAMBER_OF_COMMERCE = 'chamber_of_commerce', // شهادة غرفة التجارة
  BANK_STATEMENT = 'bank_statement', // كشف حساب مصرفي
  UTILITY_BILL = 'utility_bill', // فاتورة خدمات
  RENTAL_CONTRACT = 'rental_contract', // عقد إيجار
  PROPERTY_DEED = 'property_deed', // سند ملكية
  POWER_OF_ATTORNEY = 'power_of_attorney', // وكالة قانونية
}

/**
 * Syrian KYC Priority Levels
 */
export enum SyrianKycPriority {
  LOW = 'low', // أولوية منخفضة
  NORMAL = 'normal', // أولوية عادية
  HIGH = 'high', // أولوية عالية
  URGENT = 'urgent', // عاجل
  CRITICAL = 'critical', // حرج
}

/**
 * Syrian KYC Rejection Reasons
 */
export enum SyrianKycRejectionReason {
  INCOMPLETE_INFORMATION = 'incomplete_information', // معلومات ناقصة
  INVALID_DOCUMENT = 'invalid_document', // وثيقة غير صالحة
  EXPIRED_DOCUMENT = 'expired_document', // وثيقة منتهية الصلاحية
  POOR_QUALITY_IMAGE = 'poor_quality_image', // جودة صورة رديئة
  DOCUMENT_MISMATCH = 'document_mismatch', // عدم تطابق الوثائق
  SUSPICIOUS_ACTIVITY = 'suspicious_activity', // نشاط مشبوه
  REGULATORY_VIOLATION = 'regulatory_violation', // مخالفة تنظيمية
  DUPLICATE_APPLICATION = 'duplicate_application', // طلب مكرر
  SANCTIONED_ENTITY = 'sanctioned_entity', // جهة محظورة
  OTHER = 'other', // أخرى
}

/**
 * Syrian Governorates for KYC Geographic Validation
 */
export enum SyrianGovernorateCode {
  DAMASCUS = 'damascus', // دمشق
  DAMASCUS_COUNTRYSIDE = 'rif_dimashq', // ريف دمشق
  ALEPPO = 'aleppo', // حلب
  HOMS = 'homs', // حمص
  HAMA = 'hama', // حماة
  LATTAKIA = 'lattakia', // اللاذقية
  IDLIB = 'idlib', // إدلب
  DEIR_EZ_ZOR = 'deir_ez_zor', // دير الزور
  AL_RAQQA = 'al_raqqa', // الرقة
  AL_HASAKAH = 'al_hasakah', // الحسكة
  DARAA = 'daraa', // درعا
  AS_SUWAYDA = 'as_suwayda', // السويداء
  QUNEITRA = 'quneitra', // القنيطرة
  TARTUS = 'tartus', // طرطوس
}

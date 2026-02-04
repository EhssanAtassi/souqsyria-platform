/**
 * @file manufacturers-seeds.data.ts
 * @description Comprehensive seed data for Syrian Manufacturers system
 * 
 * FEATURES:
 * - Syrian manufacturers with Arabic/English localization
 * - Complete business profiles with Syrian registration data
 * - 7-state verification workflow test data  
 * - Performance metrics and quality scoring data
 * - Geographic distribution across Syrian governorates
 * - Business intelligence and analytics data
 * - Industrial categories and specializations
 * - Export/import capabilities and certifications
 * 
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import {
  SyrianManufacturerVerificationStatus,
  SyrianManufacturerBusinessType,
  SyrianManufacturerSizeCategory,
} from '../entities/syrian-manufacturer.entity';

/**
 * Sample Syrian manufacturers with comprehensive business profiles
 */
export const SAMPLE_SYRIAN_MANUFACTURERS = [
  {
    nameEn: 'Damascus Steel Industries Co.',
    nameAr: 'شركة دمشق للصناعات الفولاذية',
    brandNameEn: 'DSI Steel',
    brandNameAr: 'فولاذ دمشق',
    descriptionEn: 'Leading Syrian manufacturer of steel products and construction materials since 1985. Specializing in high-quality rebar, structural steel, and industrial components.',
    descriptionAr: 'شركة رائدة في تصنيع منتجات الفولاذ ومواد البناء منذ عام 1985. متخصصة في حديد التسليح عالي الجودة والفولاذ الهيكلي والمكونات الصناعية.',
    businessType: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
    sizeCategory: SyrianManufacturerSizeCategory.LARGE,
    employeeCount: 245,
    foundedYear: 1985,
    syrianTaxId: 'TAX-SYR-DSI-001985',
    commercialRegistry: 'REG-DAM-1985-001234',
    industrialLicense: 'IND-LIC-DM-ST-001',
    exportLicense: 'EXP-IMP-DSI-789123',
    governorateId: 1, // Damascus
    addressEn: 'Industrial Zone East, Damascus, Building Complex A',
    addressAr: 'المنطقة الصناعية الشرقية، دمشق، المجمع أ',
    phone: '+963-11-2234567',
    mobile: '+963-987-654321',
    email: 'info@dsi-steel.sy',
    website: 'https://www.dsi-steel.sy',
    verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
    totalProducts: 156,
    activeProducts: 142,
    averageRating: 4.7,
    totalReviews: 892,
    monthlyRevenueSyp: 85000000,
    qualityScore: 95,
    deliveryPerformance: 94.5,
    customerSatisfaction: 92.8,
    returnRate: 1.2,
    metadata: {
      specializations: ['steel_products', 'construction_materials', 'industrial_components'],
      certifications: ['ISO_9001', 'ISO_14001', 'Syrian_Standards_Steel'],
      exportMarkets: ['UAE', 'Jordan', 'Lebanon', 'Iraq'],
      productionCapacity: '50000_tons_monthly',
    },
  },
  {
    nameEn: 'Aleppo Textile Manufacturing',
    nameAr: 'شركة حلب للصناعات النسيجية',
    brandNameEn: 'AleSilk',
    brandNameAr: 'حرير حلب',
    descriptionEn: 'Traditional Syrian textile manufacturer specializing in premium fabrics, traditional garments, and modern fashion items. Heritage dating back to 1920.',
    descriptionAr: 'مصنع نسيج سوري تقليدي متخصص في الأقمشة الفاخرة والملابس التراثية والأزياء العصرية. تراث يعود إلى عام 1920.',
    businessType: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
    sizeCategory: SyrianManufacturerSizeCategory.MEDIUM,
    employeeCount: 89,
    foundedYear: 1920,
    syrianTaxId: 'TAX-SYR-ATM-001920',
    commercialRegistry: 'REG-ALE-1920-005678',
    industrialLicense: 'IND-LIC-AL-TX-002',
    governorateId: 2, // Aleppo
    addressEn: 'Traditional Textile Quarter, Old City, Aleppo',
    addressAr: 'حي النسيج التقليدي، المدينة القديمة، حلب',
    phone: '+963-21-3345678',
    mobile: '+963-988-765432',
    email: 'contact@alesilk.sy',
    website: 'https://www.alesilk.sy',
    verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
    totalProducts: 234,
    activeProducts: 198,
    averageRating: 4.5,
    totalReviews: 654,
    monthlyRevenueSyp: 45000000,
    qualityScore: 92,
    deliveryPerformance: 91.2,
    customerSatisfaction: 94.1,
    returnRate: 2.3,
    metadata: {
      specializations: ['traditional_fabrics', 'fashion_garments', 'home_textiles'],
      certifications: ['OEKO_TEX', 'Syrian_Heritage_Craft'],
      exportMarkets: ['UAE', 'Qatar', 'Kuwait'],
      heritageStatus: 'Traditional_Craft_Protected',
    },
  },
  {
    nameEn: 'Syrian Tech Solutions',
    nameAr: 'الحلول التقنية السورية',
    brandNameEn: 'SyrTech',
    brandNameAr: 'سيرتك',
    descriptionEn: 'Modern technology manufacturer focusing on electronics, IoT devices, and smart home solutions for the Middle Eastern market.',
    descriptionAr: 'مصنع تكنولوجيا حديث يركز على الإلكترونيات وأجهزة إنترنت الأشياء وحلول المنزل الذكي لسوق الشرق الأوسط.',
    businessType: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
    sizeCategory: SyrianManufacturerSizeCategory.MEDIUM,
    employeeCount: 67,
    foundedYear: 2018,
    syrianTaxId: 'TAX-SYR-STS-002018',
    commercialRegistry: 'REG-DAM-2018-009876',
    industrialLicense: 'IND-LIC-DM-TC-003',
    exportLicense: 'EXP-IMP-STS-456789',
    governorateId: 1, // Damascus
    addressEn: 'Technology Park, Damascus, Innovation Hub Building 3',
    addressAr: 'المدينة التقنية، دمشق، مبنى مركز الابتكار 3',
    phone: '+963-11-4456789',
    mobile: '+963-989-876543',
    email: 'hello@syrtech.sy',
    website: 'https://www.syrtech.sy',
    verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
    totalProducts: 89,
    activeProducts: 76,
    averageRating: 4.6,
    totalReviews: 312,
    monthlyRevenueSyp: 32000000,
    qualityScore: 91,
    deliveryPerformance: 96.3,
    customerSatisfaction: 93.7,
    returnRate: 1.8,
    metadata: {
      specializations: ['electronics', 'iot_devices', 'smart_home', 'mobile_accessories'],
      certifications: ['CE_Marking', 'RoHS_Compliance', 'ISO_9001'],
      exportMarkets: ['UAE', 'Jordan', 'Lebanon', 'Saudi_Arabia'],
      techLevel: 'Advanced_Manufacturing',
    },
  },
  {
    nameEn: 'Homs Olive Oil Processing',
    nameAr: 'شركة حمص لمعالجة زيت الزيتون',
    brandNameEn: 'Golden Olive',
    brandNameAr: 'الزيتون الذهبي',
    descriptionEn: 'Premium olive oil producer using traditional Syrian methods combined with modern processing technology. Family-owned business since 1955.',
    descriptionAr: 'منتج زيت زيتون ممتاز يستخدم الطرق السورية التقليدية مع تكنولوجيا المعالجة الحديثة. شركة عائلية منذ عام 1955.',
    businessType: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
    sizeCategory: SyrianManufacturerSizeCategory.SMALL,
    employeeCount: 28,
    foundedYear: 1955,
    syrianTaxId: 'TAX-SYR-HOP-001955',
    commercialRegistry: 'REG-HOM-1955-003456',
    industrialLicense: 'IND-LIC-HM-FD-004',
    exportLicense: 'EXP-IMP-HOP-123456',
    governorateId: 3, // Homs
    addressEn: 'Agricultural Processing Zone, Homs, Facility 12',
    addressAr: 'منطقة المعالجة الزراعية، حمص، المنشأة 12',
    phone: '+963-31-5567890',
    mobile: '+963-990-987654',
    email: 'orders@goldenolive.sy',
    website: 'https://www.goldenolive.sy',
    verificationStatus: SyrianManufacturerVerificationStatus.VERIFIED,
    totalProducts: 45,
    activeProducts: 38,
    averageRating: 4.8,
    totalReviews: 567,
    monthlyRevenueSyp: 18500000,
    qualityScore: 96,
    deliveryPerformance: 88.9,
    customerSatisfaction: 96.2,
    returnRate: 0.5,
    metadata: {
      specializations: ['olive_oil', 'organic_products', 'traditional_foods'],
      certifications: ['Organic_EU', 'HACCP', 'Syrian_Premium_Food'],
      exportMarkets: ['Germany', 'France', 'UAE', 'USA'],
      organicCertified: true,
    },
  },
  {
    nameEn: 'Lattakia Furniture Industries',
    nameAr: 'شركة اللاذقية للصناعات الخشبية',
    brandNameEn: 'Mediterranean Wood',
    brandNameAr: 'خشب المتوسط',
    descriptionEn: 'Luxury furniture manufacturer specializing in handcrafted wooden furniture using sustainable Mediterranean wood sources.',
    descriptionAr: 'مصنع أثاث فاخر متخصص في الأثاث الخشبي المصنوع يدوياً باستخدام مصادر الخشب المستدامة من البحر المتوسط.',
    businessType: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
    sizeCategory: SyrianManufacturerSizeCategory.SMALL,
    employeeCount: 42,
    foundedYear: 1970,
    syrianTaxId: 'TAX-SYR-LFI-001970',
    commercialRegistry: 'REG-LAT-1970-007890',
    industrialLicense: 'IND-LIC-LT-WD-005',
    governorateId: 4, // Lattakia
    addressEn: 'Coastal Industrial Zone, Lattakia, Workshop Complex B',
    addressAr: 'المنطقة الصناعية الساحلية، اللاذقية، مجمع الورش ب',
    phone: '+963-41-6678901',
    mobile: '+963-991-098765',
    email: 'info@medwood.sy',
    website: 'https://www.medwood.sy',
    verificationStatus: SyrianManufacturerVerificationStatus.UNDER_REVIEW,
    totalProducts: 67,
    activeProducts: 52,
    averageRating: 4.4,
    totalReviews: 234,
    monthlyRevenueSyp: 25000000,
    qualityScore: 89,
    deliveryPerformance: 85.6,
    customerSatisfaction: 91.3,
    returnRate: 3.1,
    metadata: {
      specializations: ['luxury_furniture', 'custom_woodwork', 'interior_design'],
      certifications: ['FSC_Certified', 'Sustainable_Wood'],
      exportMarkets: ['Cyprus', 'Greece', 'UAE'],
      craftmanshipLevel: 'Artisan_Quality',
    },
  },
];

/**
 * Manufacturers workflow state distribution data
 */
export const MANUFACTURERS_WORKFLOW_ANALYTICS = {
  totalManufacturers: 45,
  statusDistribution: {
    [SyrianManufacturerVerificationStatus.DRAFT]: 3,
    [SyrianManufacturerVerificationStatus.SUBMITTED]: 5,
    [SyrianManufacturerVerificationStatus.UNDER_REVIEW]: 8,
    [SyrianManufacturerVerificationStatus.VERIFIED]: 25,
    [SyrianManufacturerVerificationStatus.REJECTED]: 2,
    [SyrianManufacturerVerificationStatus.SUSPENDED]: 1,
    [SyrianManufacturerVerificationStatus.EXPIRED]: 1,
  },
  businessTypeDistribution: {
    [SyrianManufacturerBusinessType.LOCAL_MANUFACTURER]: 30,
    [SyrianManufacturerBusinessType.INTERNATIONAL_BRAND]: 5,
    [SyrianManufacturerBusinessType.DISTRIBUTOR]: 4,
    [SyrianManufacturerBusinessType.AUTHORIZED_DEALER]: 3,
    [SyrianManufacturerBusinessType.PRIVATE_LABEL]: 2,
    [SyrianManufacturerBusinessType.WHOLESALER]: 1,
  },
  sizeDistribution: {
    [SyrianManufacturerSizeCategory.SMALL]: 20,
    [SyrianManufacturerSizeCategory.MEDIUM]: 15,
    [SyrianManufacturerSizeCategory.LARGE]: 8,
    [SyrianManufacturerSizeCategory.ENTERPRISE]: 2,
  },
  averageMetrics: {
    qualityScore: 87.3,
    deliveryPerformance: 89.6,
    customerSatisfaction: 92.1,
    returnRate: 2.4,
    averageRating: 4.4,
    monthlyRevenueSyp: 35000000,
  },
};

/**
 * Manufacturing categories and specializations
 */
export const MANUFACTURING_CATEGORIES = [
  {
    categoryEn: 'Food & Beverages',
    categoryAr: 'الأغذية والمشروبات',
    specializations: [
      { nameEn: 'Olive Oil', nameAr: 'زيت الزيتون' },
      { nameEn: 'Dairy Products', nameAr: 'منتجات الألبان' },
      { nameEn: 'Processed Foods', nameAr: 'الأطعمة المصنعة' },
      { nameEn: 'Traditional Sweets', nameAr: 'الحلويات التراثية' },
    ],
    manufacturerCount: 12,
  },
  {
    categoryEn: 'Textiles & Clothing',
    categoryAr: 'النسيج والملابس',
    specializations: [
      { nameEn: 'Traditional Fabrics', nameAr: 'الأقمشة التراثية' },
      { nameEn: 'Modern Fashion', nameAr: 'الأزياء العصرية' },
      { nameEn: 'Home Textiles', nameAr: 'المنسوجات المنزلية' },
      { nameEn: 'Industrial Textiles', nameAr: 'المنسوجات الصناعية' },
    ],
    manufacturerCount: 8,
  },
  {
    categoryEn: 'Electronics & Technology',
    categoryAr: 'الإلكترونيات والتكنولوجيا',
    specializations: [
      { nameEn: 'Consumer Electronics', nameAr: 'الإلكترونيات الاستهلاكية' },
      { nameEn: 'IoT Devices', nameAr: 'أجهزة إنترنت الأشياء' },
      { nameEn: 'Mobile Accessories', nameAr: 'إكسسوارات الهاتف المحمول' },
      { nameEn: 'Smart Home Solutions', nameAr: 'حلول المنزل الذكي' },
    ],
    manufacturerCount: 6,
  },
  {
    categoryEn: 'Construction Materials',
    categoryAr: 'مواد البناء',
    specializations: [
      { nameEn: 'Steel Products', nameAr: 'منتجات الفولاذ' },
      { nameEn: 'Cement & Concrete', nameAr: 'الأسمنت والخرسانة' },
      { nameEn: 'Building Hardware', nameAr: 'مستلزمات البناء' },
      { nameEn: 'Insulation Materials', nameAr: 'مواد العزل' },
    ],
    manufacturerCount: 9,
  },
  {
    categoryEn: 'Furniture & Woodwork',
    categoryAr: 'الأثاث والأعمال الخشبية',
    specializations: [
      { nameEn: 'Luxury Furniture', nameAr: 'الأثاث الفاخر' },
      { nameEn: 'Custom Woodwork', nameAr: 'الأعمال الخشبية المخصصة' },
      { nameEn: 'Office Furniture', nameAr: 'أثاث المكاتب' },
      { nameEn: 'Traditional Crafts', nameAr: 'الحرف التراثية' },
    ],
    manufacturerCount: 7,
  },
];

/**
 * Geographic distribution by Syrian governorates
 */
export const MANUFACTURERS_GEOGRAPHIC_DISTRIBUTION = [
  {
    governorateId: 1,
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    manufacturerCount: 15,
    totalRevenueSyp: 425000000,
    averageQualityScore: 91.2,
    primaryIndustries: ['Technology', 'Construction Materials', 'Food Processing'],
  },
  {
    governorateId: 2,
    nameEn: 'Aleppo',
    nameAr: 'حلب',
    manufacturerCount: 12,
    totalRevenueSyp: 320000000,
    averageQualityScore: 89.8,
    primaryIndustries: ['Textiles', 'Traditional Crafts', 'Machinery'],
  },
  {
    governorateId: 3,
    nameEn: 'Homs',
    nameAr: 'حمص',
    manufacturerCount: 8,
    totalRevenueSyp: 185000000,
    averageQualityScore: 88.5,
    primaryIndustries: ['Food & Beverages', 'Petrochemicals', 'Agriculture'],
  },
  {
    governorateId: 4,
    nameEn: 'Lattakia',
    nameAr: 'اللاذقية',
    manufacturerCount: 6,
    totalRevenueSyp: 145000000,
    averageQualityScore: 86.9,
    primaryIndustries: ['Furniture', 'Maritime Equipment', 'Tourism Products'],
  },
  {
    governorateId: 5,
    nameEn: 'Hama',
    nameAr: 'حماة',
    manufacturerCount: 4,
    totalRevenueSyp: 95000000,
    averageQualityScore: 85.3,
    primaryIndustries: ['Agriculture Equipment', 'Textiles', 'Handicrafts'],
  },
];

/**
 * Performance benchmarks and KPIs
 */
export const MANUFACTURERS_PERFORMANCE_BENCHMARKS = {
  industryBenchmarks: {
    qualityScore: {
      excellent: 90,
      good: 80,
      average: 70,
      poor: 60,
    },
    deliveryPerformance: {
      excellent: 95.0,
      good: 85.0,
      average: 75.0,
      poor: 65.0,
    },
    customerSatisfaction: {
      excellent: 95.0,
      good: 85.0,
      average: 75.0,
      poor: 65.0,
    },
    returnRate: {
      excellent: 2.0,
      good: 5.0,
      average: 8.0,
      poor: 12.0,
    },
  },
  growthTargets: {
    monthlyRevenueGrowth: 8.5, // %
    newManufacturerTarget: 5, // per month
    verificationEfficiency: 72, // hours average
    qualityImprovementTarget: 2.5, // points per quarter
  },
};

/**
 * Verification workflow analytics
 */
export const VERIFICATION_WORKFLOW_ANALYTICS = {
  averageProcessingTimes: {
    draftToSubmitted: 24, // hours
    submittedToUnderReview: 48, // hours
    underReviewToVerified: 72, // hours
    totalVerificationTime: 144, // hours (6 days)
  },
  slaCompliance: {
    overall: 85.6, // %
    byStage: {
      initialReview: 92.3,
      documentVerification: 81.4,
      businessValidation: 79.8,
      finalApproval: 88.9,
    },
  },
  rejectionReasons: [
    {
      reasonEn: 'Incomplete documentation',
      reasonAr: 'وثائق غير مكتملة',
      percentage: 35.2,
    },
    {
      reasonEn: 'Invalid business registration',
      reasonAr: 'تسجيل تجاري غير صالح',
      percentage: 28.7,
    },
    {
      reasonEn: 'Quality standards not met',
      reasonAr: 'معايير الجودة غير مستوفاة',
      percentage: 18.9,
    },
    {
      reasonEn: 'Compliance issues',
      reasonAr: 'مشاكل في الامتثال',
      percentage: 17.2,
    },
  ],
};

/**
 * Configuration for bulk manufacturers generation
 */
export const BULK_MANUFACTURERS_GENERATION_CONFIG = {
  businessTypes: Object.values(SyrianManufacturerBusinessType),
  sizeCategories: Object.values(SyrianManufacturerSizeCategory),
  verificationStatuses: Object.values(SyrianManufacturerVerificationStatus),
  governorateIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  
  nameTemplates: {
    en: [
      '{city} {industry} Manufacturing',
      'Syrian {industry} Co.',
      '{region} {product} Industries',
      'Premium {industry} Syria',
      '{city} {product} Factory',
    ],
    ar: [
      'شركة {city} للصناعات {industry}',
      'مصنع {region} لـ{product}',
      'الصناعات {industry} السورية',
      '{product} {city} المتطورة',
      'شركة {industry} الممتازة',
    ],
  },
  
  industries: [
    'Electronics', 'Textiles', 'Food', 'Construction', 'Furniture',
    'Automotive', 'Pharmaceuticals', 'Chemicals', 'Machinery', 'Agriculture',
  ],
  
  foundedYearRange: [1950, 2023],
  employeeCountRanges: {
    [SyrianManufacturerSizeCategory.SMALL]: [5, 50],
    [SyrianManufacturerSizeCategory.MEDIUM]: [50, 200],
    [SyrianManufacturerSizeCategory.LARGE]: [200, 1000],
    [SyrianManufacturerSizeCategory.ENTERPRISE]: [1000, 5000],
  },
  
  revenueRanges: {
    [SyrianManufacturerSizeCategory.SMALL]: [5000000, 25000000], // 5-25M SYP
    [SyrianManufacturerSizeCategory.MEDIUM]: [25000000, 100000000], // 25-100M SYP
    [SyrianManufacturerSizeCategory.LARGE]: [100000000, 500000000], // 100-500M SYP
    [SyrianManufacturerSizeCategory.ENTERPRISE]: [500000000, 2000000000], // 500M-2B SYP
  },
};
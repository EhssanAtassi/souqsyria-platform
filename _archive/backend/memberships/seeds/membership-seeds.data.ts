/**
 * @file membership-seeds.data.ts
 * @description Comprehensive seed data for Syrian e-commerce vendor memberships
 * Includes diverse membership tiers optimized for Syrian market conditions
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

export interface MembershipSeedData {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: number; // SYP
  priceUSD?: number; // USD equivalent for diaspora
  durationInDays: number;
  maxProducts: number;
  maxImagesPerProduct: number;
  prioritySupport: boolean;
  commissionDiscount: number; // Percentage discount on commission
  features: string[];
  featuresAr: string[];
  targetAudience: string;
  targetAudienceAr: string;
  isPopular: boolean;
  sortOrder: number;
  isActive: boolean;
  syrianBusinessFeatures: {
    taxReporting: boolean;
    governorateAnalytics: boolean;
    multiCurrencySupport: boolean;
    diasporaCustomerTools: boolean;
    localShippingIntegration: boolean;
    arabicCustomization: boolean;
    bulkImportTools: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
  limitations: {
    categoryLimit?: number;
    monthlyOrderLimit?: number;
    storageGB?: number;
    apiCallsPerMonth?: number;
    customBrandingElements?: number;
  };
  businessType:
    | 'individual'
    | 'small_business'
    | 'medium_business'
    | 'enterprise';
  renewalDiscount: number; // Percentage discount for renewal
  upgradeDiscount: number; // Percentage discount when upgrading
}

/**
 * BASIC MEMBERSHIP: Entry-level for individual sellers
 */
export const BASIC_MEMBERSHIPS: MembershipSeedData[] = [
  {
    name: 'Basic Monthly',
    nameAr: 'العضوية الأساسية الشهرية',
    description:
      'Perfect for individual sellers starting their journey on SouqSyria',
    descriptionAr: 'مثالية للبائعين الأفراد الذين يبدؤون رحلتهم في سوق سوريا',
    price: 50000, // 50,000 SYP (~$20 USD)
    priceUSD: 20,
    durationInDays: 30,
    maxProducts: 50,
    maxImagesPerProduct: 5,
    prioritySupport: false,
    commissionDiscount: 0,
    features: [
      'Up to 50 products',
      '5 images per product',
      'Basic product listings',
      'Standard customer support',
      'Basic analytics',
      'Mobile app access',
      'Payment processing',
      'Order management',
    ],
    featuresAr: [
      'حتى 50 منتج',
      '5 صور لكل منتج',
      'قوائم المنتجات الأساسية',
      'دعم العملاء الموحد',
      'التحليلات الأساسية',
      'الوصول لتطبيق الموبايل',
      'معالجة المدفوعات',
      'إدارة الطلبات',
    ],
    targetAudience: 'Individual sellers, home-based businesses, craftspeople',
    targetAudienceAr: 'البائعون الأفراد، الأعمال المنزلية، الحرفيون',
    isPopular: false,
    sortOrder: 1,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: false,
      governorateAnalytics: false,
      multiCurrencySupport: false,
      diasporaCustomerTools: false,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: false,
      advancedAnalytics: false,
      apiAccess: false,
      whiteLabel: false,
    },
    limitations: {
      categoryLimit: 3,
      monthlyOrderLimit: 200,
      storageGB: 1,
      apiCallsPerMonth: 0,
      customBrandingElements: 0,
    },
    businessType: 'individual',
    renewalDiscount: 5,
    upgradeDiscount: 10,
  },
  {
    name: 'Basic Yearly',
    nameAr: 'العضوية الأساسية السنوية',
    description: 'Basic plan with 2 months free - best value for new sellers',
    descriptionAr: 'الخطة الأساسية مع شهرين مجاناً - أفضل قيمة للبائعين الجدد',
    price: 500000, // 500,000 SYP (~$200 USD, 2 months free)
    priceUSD: 200,
    durationInDays: 365,
    maxProducts: 50,
    maxImagesPerProduct: 5,
    prioritySupport: false,
    commissionDiscount: 2, // 2% commission discount for yearly
    features: [
      'All Basic Monthly features',
      '2 months free',
      '2% commission discount',
      'Priority product approval',
      'Enhanced mobile features',
      'Email marketing tools',
      'Basic SEO optimization',
      'Customer review management',
    ],
    featuresAr: [
      'جميع ميزات الأساسية الشهرية',
      'شهران مجاناً',
      '2% خصم على العمولة',
      'الموافقة المُسرعة على المنتجات',
      'ميزات محسنة للموبايل',
      'أدوات التسويق عبر البريد',
      'تحسين محركات البحث الأساسي',
      'إدارة تقييمات العملاء',
    ],
    targetAudience: 'Cost-conscious sellers planning long-term presence',
    targetAudienceAr: 'البائعون المهتمون بالتكلفة والتخطيط طويل المدى',
    isPopular: true,
    sortOrder: 2,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: true,
      governorateAnalytics: true,
      multiCurrencySupport: false,
      diasporaCustomerTools: false,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: false,
      advancedAnalytics: false,
      apiAccess: false,
      whiteLabel: false,
    },
    limitations: {
      categoryLimit: 5,
      monthlyOrderLimit: 250,
      storageGB: 2,
      apiCallsPerMonth: 0,
      customBrandingElements: 1,
    },
    businessType: 'individual',
    renewalDiscount: 10,
    upgradeDiscount: 15,
  },
];

/**
 * PREMIUM MEMBERSHIP: Growing businesses and established sellers
 */
export const PREMIUM_MEMBERSHIPS: MembershipSeedData[] = [
  {
    name: 'Premium Monthly',
    nameAr: 'العضوية المميزة الشهرية',
    description:
      'Enhanced features for growing businesses with moderate product catalogs',
    descriptionAr: 'ميزات محسنة للأعمال النامية مع كتالوجات منتجات متوسطة',
    price: 150000, // 150,000 SYP (~$60 USD)
    priceUSD: 60,
    durationInDays: 30,
    maxProducts: 200,
    maxImagesPerProduct: 10,
    prioritySupport: true,
    commissionDiscount: 5,
    features: [
      'Up to 200 products',
      '10 images per product',
      'Priority customer support',
      '5% commission discount',
      'Advanced analytics',
      'Bulk product upload',
      'Custom store branding',
      'Social media integration',
      'Multi-governorate shipping',
      'Customer segmentation',
      'Inventory alerts',
      'Sales reporting',
    ],
    featuresAr: [
      'حتى 200 منتج',
      '10 صور لكل منتج',
      'دعم العملاء المُسرع',
      '5% خصم على العمولة',
      'التحليلات المتقدمة',
      'رفع المنتجات بالجملة',
      'علامة تجارية مخصصة للمتجر',
      'التكامل مع وسائل التواصل',
      'الشحن متعدد المحافظات',
      'تجميع العملاء',
      'تنبيهات المخزون',
      'تقارير المبيعات',
    ],
    targetAudience: 'Small to medium businesses, established online sellers',
    targetAudienceAr: 'الأعمال الصغيرة والمتوسطة، البائعون المؤسسون',
    isPopular: true,
    sortOrder: 3,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: true,
      governorateAnalytics: true,
      multiCurrencySupport: true,
      diasporaCustomerTools: true,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: true,
      advancedAnalytics: true,
      apiAccess: false,
      whiteLabel: false,
    },
    limitations: {
      categoryLimit: 8,
      monthlyOrderLimit: 800,
      storageGB: 5,
      apiCallsPerMonth: 1000,
      customBrandingElements: 3,
    },
    businessType: 'small_business',
    renewalDiscount: 8,
    upgradeDiscount: 12,
  },
  {
    name: 'Premium Yearly',
    nameAr: 'العضوية المميزة السنوية',
    description: 'Premium features with significant savings and bonus features',
    descriptionAr: 'ميزات مميزة مع توفير كبير وميزات إضافية',
    price: 1500000, // 1,500,000 SYP (~$600 USD, 2.5 months free)
    priceUSD: 600,
    durationInDays: 365,
    maxProducts: 250,
    maxImagesPerProduct: 12,
    prioritySupport: true,
    commissionDiscount: 8,
    features: [
      'All Premium Monthly features',
      '2.5 months free',
      '8% commission discount',
      'Enhanced product limits',
      'Advanced Syrian market analytics',
      'Diaspora customer insights',
      'Multi-currency pricing',
      'Advanced SEO tools',
      'Marketing automation',
      'Customer loyalty programs',
      'A/B testing tools',
      'Advanced reporting dashboard',
    ],
    featuresAr: [
      'جميع ميزات المميزة الشهرية',
      'شهرين ونصف مجاناً',
      '8% خصم على العمولة',
      'حدود منتجات محسنة',
      'تحليلات السوق السوري المتقدمة',
      'رؤى عملاء المهجر',
      'التسعير متعدد العملات',
      'أدوات تحسين محركات البحث',
      'أتمتة التسويق',
      'برامج ولاء العملاء',
      'أدوات اختبار A/B',
      'لوحة تقارير متقدمة',
    ],
    targetAudience:
      'Serious businesses focusing on Syrian and diaspora markets',
    targetAudienceAr: 'الأعمال الجدية المركزة على السوق السوري والمهجر',
    isPopular: false,
    sortOrder: 4,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: true,
      governorateAnalytics: true,
      multiCurrencySupport: true,
      diasporaCustomerTools: true,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: true,
      advancedAnalytics: true,
      apiAccess: true,
      whiteLabel: false,
    },
    limitations: {
      categoryLimit: 12,
      monthlyOrderLimit: 1000,
      storageGB: 10,
      apiCallsPerMonth: 5000,
      customBrandingElements: 5,
    },
    businessType: 'medium_business',
    renewalDiscount: 12,
    upgradeDiscount: 15,
  },
];

/**
 * VIP MEMBERSHIP: Large businesses and high-volume sellers
 */
export const VIP_MEMBERSHIPS: MembershipSeedData[] = [
  {
    name: 'VIP Monthly',
    nameAr: 'العضوية الذهبية الشهرية',
    description: 'Premium tier for high-volume sellers and established brands',
    descriptionAr:
      'المستوى المميز للبائعين عالي الحجم والعلامات التجارية المؤسسة',
    price: 400000, // 400,000 SYP (~$160 USD)
    priceUSD: 160,
    durationInDays: 30,
    maxProducts: 1000,
    maxImagesPerProduct: 20,
    prioritySupport: true,
    commissionDiscount: 12,
    features: [
      'Up to 1,000 products',
      '20 images per product',
      'VIP customer support',
      '12% commission discount',
      'Advanced Syrian business tools',
      'Dedicated account manager',
      'Custom API integrations',
      'White-label customization',
      'Advanced inventory management',
      'Multi-warehouse support',
      'International shipping tools',
      'Custom analytics dashboards',
      'Priority product placement',
      'Advanced marketing tools',
    ],
    featuresAr: [
      'حتى 1000 منتج',
      '20 صورة لكل منتج',
      'دعم عملاء VIP',
      '12% خصم على العمولة',
      'أدوات الأعمال السورية المتقدمة',
      'مدير حساب مخصص',
      'تكاملات API مخصصة',
      'تخصيص العلامة البيضاء',
      'إدارة المخزون المتقدمة',
      'دعم المستودعات المتعددة',
      'أدوات الشحن الدولي',
      'لوحات تحليلات مخصصة',
      'أولوية عرض المنتجات',
      'أدوات التسويق المتقدمة',
    ],
    targetAudience: 'Large businesses, established brands, high-volume sellers',
    targetAudienceAr:
      'الأعمال الكبيرة، العلامات التجارية المؤسسة، البائعون عالي الحجم',
    isPopular: false,
    sortOrder: 5,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: true,
      governorateAnalytics: true,
      multiCurrencySupport: true,
      diasporaCustomerTools: true,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: true,
      advancedAnalytics: true,
      apiAccess: true,
      whiteLabel: true,
    },
    limitations: {
      categoryLimit: 20,
      monthlyOrderLimit: 5000,
      storageGB: 50,
      apiCallsPerMonth: 25000,
      customBrandingElements: 10,
    },
    businessType: 'medium_business',
    renewalDiscount: 10,
    upgradeDiscount: 8,
  },
  {
    name: 'VIP Yearly',
    nameAr: 'العضوية الذهبية السنوية',
    description:
      'Maximum features with substantial savings for serious businesses',
    descriptionAr: 'أقصى الميزات مع توفير كبير للأعمال الجدية',
    price: 4000000, // 4,000,000 SYP (~$1,600 USD, 3 months free)
    priceUSD: 1600,
    durationInDays: 365,
    maxProducts: 1500,
    maxImagesPerProduct: 25,
    prioritySupport: true,
    commissionDiscount: 15,
    features: [
      'All VIP Monthly features',
      '3 months free',
      '15% commission discount',
      'Enhanced product limits',
      'Custom feature development',
      'Priority technical support',
      'Advanced Syrian market research',
      'Competitor analysis tools',
      'Custom integration development',
      'Advanced reporting suite',
      'Marketing automation platform',
      'Customer journey analytics',
      'Revenue optimization tools',
      'Business intelligence dashboard',
    ],
    featuresAr: [
      'جميع ميزات الذهبية الشهرية',
      '3 أشهر مجانية',
      '15% خصم على العمولة',
      'حدود منتجات محسنة',
      'تطوير ميزات مخصصة',
      'دعم تقني مُسرع',
      'بحوث السوق السوري المتقدمة',
      'أدوات تحليل المنافسين',
      'تطوير التكاملات المخصصة',
      'مجموعة التقارير المتقدمة',
      'منصة أتمتة التسويق',
      'تحليلات رحلة العميل',
      'أدوات تحسين الإيرادات',
      'لوحة ذكاء الأعمال',
    ],
    targetAudience: 'Enterprise-level businesses, major Syrian brands',
    targetAudienceAr: 'أعمال مستوى المؤسسات، العلامات التجارية السورية الكبرى',
    isPopular: false,
    sortOrder: 6,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: true,
      governorateAnalytics: true,
      multiCurrencySupport: true,
      diasporaCustomerTools: true,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: true,
      advancedAnalytics: true,
      apiAccess: true,
      whiteLabel: true,
    },
    limitations: {
      categoryLimit: -1, // Unlimited
      monthlyOrderLimit: -1, // Unlimited
      storageGB: 200,
      apiCallsPerMonth: 100000,
      customBrandingElements: -1, // Unlimited
    },
    businessType: 'enterprise',
    renewalDiscount: 15,
    upgradeDiscount: 10,
  },
];

/**
 * ENTERPRISE MEMBERSHIP: Custom solutions for large-scale operations
 */
export const ENTERPRISE_MEMBERSHIPS: MembershipSeedData[] = [
  {
    name: 'Enterprise',
    nameAr: 'عضوية المؤسسات',
    description:
      'Custom enterprise solution with unlimited features and dedicated support',
    descriptionAr: 'حل مؤسسي مخصص مع ميزات غير محدودة ودعم مخصص',
    price: 10000000, // 10,000,000 SYP (~$4,000 USD) - starting price
    priceUSD: 4000,
    durationInDays: 365,
    maxProducts: -1, // Unlimited
    maxImagesPerProduct: -1, // Unlimited
    prioritySupport: true,
    commissionDiscount: 20,
    features: [
      'Unlimited products and images',
      '20% commission discount',
      'Dedicated enterprise support',
      'Custom feature development',
      'White-label marketplace solution',
      'Advanced Syrian market analytics',
      'Custom API development',
      'Enterprise security features',
      'Multi-tenant architecture',
      'Custom workflow automation',
      'Advanced integration capabilities',
      'Dedicated infrastructure',
      'Custom Syrian business compliance',
      'Enterprise-grade reporting',
      'Custom mobile app development',
      'Advanced Syrian tax integration',
    ],
    featuresAr: [
      'منتجات وصور غير محدودة',
      '20% خصم على العمولة',
      'دعم مؤسسي مخصص',
      'تطوير ميزات مخصصة',
      'حل السوق بالعلامة البيضاء',
      'تحليلات السوق السوري المتقدمة',
      'تطوير API مخصص',
      'ميزات الأمان المؤسسي',
      'بنية متعددة المستأجرين',
      'أتمتة سير العمل المخصص',
      'قدرات التكامل المتقدمة',
      'بنية تحتية مخصصة',
      'امتثال الأعمال السورية المخصص',
      'تقارير مستوى المؤسسات',
      'تطوير تطبيق موبايل مخصص',
      'تكامل ضرائب سوري متقدم',
    ],
    targetAudience:
      'Large enterprises, government entities, major marketplace operators',
    targetAudienceAr:
      'المؤسسات الكبيرة، الكيانات الحكومية، مشغلو الأسواق الرئيسيون',
    isPopular: false,
    sortOrder: 7,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: true,
      governorateAnalytics: true,
      multiCurrencySupport: true,
      diasporaCustomerTools: true,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: true,
      advancedAnalytics: true,
      apiAccess: true,
      whiteLabel: true,
    },
    limitations: {
      categoryLimit: -1, // Unlimited
      monthlyOrderLimit: -1, // Unlimited
      storageGB: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      customBrandingElements: -1, // Unlimited
    },
    businessType: 'enterprise',
    renewalDiscount: 20,
    upgradeDiscount: 0, // Already top tier
  },
];

/**
 * SPECIAL MEMBERSHIPS: Promotional and testing scenarios
 */
export const SPECIAL_MEMBERSHIPS: MembershipSeedData[] = [
  {
    name: 'Trial',
    nameAr: 'النسخة التجريبية',
    description: '14-day free trial to explore SouqSyria platform features',
    descriptionAr: 'تجربة مجانية 14 يوم لاستكشاف ميزات منصة سوق سوريا',
    price: 0,
    priceUSD: 0,
    durationInDays: 14,
    maxProducts: 10,
    maxImagesPerProduct: 3,
    prioritySupport: false,
    commissionDiscount: 0,
    features: [
      'Up to 10 products',
      '3 images per product',
      '14-day free trial',
      'Basic features access',
      'Standard support',
      'Getting started guidance',
      'Platform tutorials',
      'Basic analytics',
    ],
    featuresAr: [
      'حتى 10 منتجات',
      '3 صور لكل منتج',
      'تجربة مجانية 14 يوم',
      'الوصول للميزات الأساسية',
      'الدعم الموحد',
      'إرشاد البداية',
      'دروس المنصة',
      'التحليلات الأساسية',
    ],
    targetAudience: 'New sellers exploring the platform',
    targetAudienceAr: 'البائعون الجدد المستكشفون للمنصة',
    isPopular: false,
    sortOrder: 0,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: false,
      governorateAnalytics: false,
      multiCurrencySupport: false,
      diasporaCustomerTools: false,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: false,
      advancedAnalytics: false,
      apiAccess: false,
      whiteLabel: false,
    },
    limitations: {
      categoryLimit: 1,
      monthlyOrderLimit: 50,
      storageGB: 0.5,
      apiCallsPerMonth: 0,
      customBrandingElements: 0,
    },
    businessType: 'individual',
    renewalDiscount: 0,
    upgradeDiscount: 20, // 20% discount when upgrading from trial
  },
  {
    name: 'Student',
    nameAr: 'عضوية الطلاب',
    description:
      'Special discounted membership for Syrian students and young entrepreneurs',
    descriptionAr: 'عضوية مخفضة خاصة للطلاب السوريين ورواد الأعمال الشباب',
    price: 25000, // 25,000 SYP (~$10 USD) - 50% off basic
    priceUSD: 10,
    durationInDays: 30,
    maxProducts: 30,
    maxImagesPerProduct: 4,
    prioritySupport: false,
    commissionDiscount: 1,
    features: [
      'Student discount pricing',
      'Up to 30 products',
      '4 images per product',
      '1% commission discount',
      'Educational resources',
      'Entrepreneurship guidance',
      'Student community access',
      'Mentorship program eligibility',
    ],
    featuresAr: [
      'تسعير مخفض للطلاب',
      'حتى 30 منتج',
      '4 صور لكل منتج',
      '1% خصم على العمولة',
      'موارد تعليمية',
      'إرشاد ريادة الأعمال',
      'الوصول لمجتمع الطلاب',
      'أهلية برنامج الإرشاد',
    ],
    targetAudience: 'Syrian students, young entrepreneurs under 25',
    targetAudienceAr: 'الطلاب السوريون، رواد الأعمال الشباب تحت 25',
    isPopular: false,
    sortOrder: 8,
    isActive: true,
    syrianBusinessFeatures: {
      taxReporting: false,
      governorateAnalytics: true,
      multiCurrencySupport: false,
      diasporaCustomerTools: false,
      localShippingIntegration: true,
      arabicCustomization: true,
      bulkImportTools: false,
      advancedAnalytics: false,
      apiAccess: false,
      whiteLabel: false,
    },
    limitations: {
      categoryLimit: 2,
      monthlyOrderLimit: 100,
      storageGB: 1,
      apiCallsPerMonth: 0,
      customBrandingElements: 0,
    },
    businessType: 'individual',
    renewalDiscount: 10,
    upgradeDiscount: 25,
  },
];

/**
 * ALL MEMBERSHIPS: Combined array of all membership seed data
 */
export const ALL_MEMBERSHIP_SEEDS: MembershipSeedData[] = [
  ...SPECIAL_MEMBERSHIPS, // Trial and Student first for sorting
  ...BASIC_MEMBERSHIPS,
  ...PREMIUM_MEMBERSHIPS,
  ...VIP_MEMBERSHIPS,
  ...ENTERPRISE_MEMBERSHIPS,
];

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get memberships by business type
 */
export const getMembershipsByBusinessType = (
  businessType: string,
): MembershipSeedData[] => {
  return ALL_MEMBERSHIP_SEEDS.filter(
    (membership) => membership.businessType === businessType,
  );
};

/**
 * Get memberships by duration
 */
export const getMembershipsByDuration = (
  durationInDays: number,
): MembershipSeedData[] => {
  return ALL_MEMBERSHIP_SEEDS.filter(
    (membership) => membership.durationInDays === durationInDays,
  );
};

/**
 * Get active memberships only
 */
export const getActiveMemberships = (): MembershipSeedData[] => {
  return ALL_MEMBERSHIP_SEEDS.filter((membership) => membership.isActive);
};

/**
 * Get popular memberships
 */
export const getPopularMemberships = (): MembershipSeedData[] => {
  return ALL_MEMBERSHIP_SEEDS.filter((membership) => membership.isPopular);
};

/**
 * Get memberships by price range (SYP)
 */
export const getMembershipsByPriceRange = (
  minPrice: number,
  maxPrice: number,
): MembershipSeedData[] => {
  return ALL_MEMBERSHIP_SEEDS.filter(
    (membership) =>
      membership.price >= minPrice && membership.price <= maxPrice,
  );
};

/**
 * Get memberships with specific features
 */
export const getMembershipsWithFeature = (
  feature: keyof MembershipSeedData['syrianBusinessFeatures'],
): MembershipSeedData[] => {
  return ALL_MEMBERSHIP_SEEDS.filter(
    (membership) => membership.syrianBusinessFeatures[feature] === true,
  );
};

/**
 * STATISTICS
 */
export const MEMBERSHIP_STATISTICS = {
  total: ALL_MEMBERSHIP_SEEDS.length,
  basic: BASIC_MEMBERSHIPS.length,
  premium: PREMIUM_MEMBERSHIPS.length,
  vip: VIP_MEMBERSHIPS.length,
  enterprise: ENTERPRISE_MEMBERSHIPS.length,
  special: SPECIAL_MEMBERSHIPS.length,
  active: getActiveMemberships().length,
  popular: getPopularMemberships().length,
  monthly: getMembershipsByDuration(30).length,
  yearly: getMembershipsByDuration(365).length,
  free: ALL_MEMBERSHIP_SEEDS.filter((m) => m.price === 0).length,
  individual: getMembershipsByBusinessType('individual').length,
  smallBusiness: getMembershipsByBusinessType('small_business').length,
  mediumBusiness: getMembershipsByBusinessType('medium_business').length,
  enterpriseBusiness: getMembershipsByBusinessType('enterprise').length,
  withTaxReporting: getMembershipsWithFeature('taxReporting').length,
  withGovernorateAnalytics: getMembershipsWithFeature('governorateAnalytics')
    .length,
  withMultiCurrency: getMembershipsWithFeature('multiCurrencySupport').length,
  withDiasporaTools: getMembershipsWithFeature('diasporaCustomerTools').length,
  withApiAccess: getMembershipsWithFeature('apiAccess').length,
  withWhiteLabel: getMembershipsWithFeature('whiteLabel').length,
};

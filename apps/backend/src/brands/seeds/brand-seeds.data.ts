/**
 * @file brand-seeds.data.ts
 * @description Comprehensive seed data for popular Syrian and international brands
 * Includes brands across various categories with Arabic localization for the Syrian market
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

export interface BrandSeedData {
  name: string;
  nameAr?: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  logoUrl?: string;
  countryOfOrigin?: string;
  isActive: boolean;
  verificationStatus:
    | 'unverified'
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'revoked';
  verificationType: 'official' | 'authorized' | 'unverified';
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';
  isVerified: boolean;
  trademarkNumber?: string;
  popularityScore: number;
}

/**
 * SYRIAN BRANDS: Local brands popular in the Syrian market
 */
export const SYRIAN_BRANDS: BrandSeedData[] = [
  // Food & Beverage Syrian Brands
  {
    name: 'Al-Ghouta',
    nameAr: 'الغوطة',
    slug: 'al-ghouta',
    descriptionEn:
      'Premium Syrian agricultural products from the fertile Damascus countryside',
    descriptionAr: 'منتجات زراعية سورية فاخرة من ريف دمشق الخصيب',
    countryOfOrigin: 'Syria',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'SY-AGH-001',
    popularityScore: 85.5,
  },
  {
    name: 'Damascus Steel',
    nameAr: 'فولاذ دمشق',
    slug: 'damascus-steel',
    descriptionEn:
      'Authentic Damascus steel products and traditional craftsmanship',
    descriptionAr: 'منتجات فولاذ دمشق الأصيلة والحرف التقليدية',
    countryOfOrigin: 'Syria',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'SY-DS-002',
    popularityScore: 78.2,
  },
  {
    name: 'Aleppo Soap Co',
    nameAr: 'شركة صابون حلب',
    slug: 'aleppo-soap-co',
    descriptionEn: 'Traditional Aleppo soap made with olive oil and laurel oil',
    descriptionAr: 'صابون حلب التقليدي المصنوع من زيت الزيتون وزيت الغار',
    countryOfOrigin: 'Syria',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'SY-ASC-003',
    popularityScore: 92.1,
  },
  {
    name: 'Syrian Rose',
    nameAr: 'الورد السوري',
    slug: 'syrian-rose',
    descriptionEn: 'Premium rose water and cosmetics from Damascene roses',
    descriptionAr: 'ماء ورد فاخر ومستحضرات تجميل من الورد الدمشقي',
    countryOfOrigin: 'Syria',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'SY-SR-004',
    popularityScore: 89.7,
  },
  {
    name: 'Palmyra Textiles',
    nameAr: 'منسوجات تدمر',
    slug: 'palmyra-textiles',
    descriptionEn: 'High-quality Syrian textiles and traditional fabrics',
    descriptionAr: 'منسوجات سورية عالية الجودة وأقمشة تقليدية',
    countryOfOrigin: 'Syria',
    isActive: true,
    verificationStatus: 'pending',
    verificationType: 'authorized',
    approvalStatus: 'approved',
    isVerified: false,
    popularityScore: 72.4,
  },

  // Syrian Electronics & Tech
  {
    name: 'Damascus Tech',
    nameAr: 'دمشق تك',
    slug: 'damascus-tech',
    descriptionEn: 'Syrian technology solutions and electronics assembly',
    descriptionAr: 'حلول التكنولوجيا السورية وتجميع الإلكترونيات',
    countryOfOrigin: 'Syria',
    isActive: true,
    verificationStatus: 'unverified',
    verificationType: 'unverified',
    approvalStatus: 'pending',
    isVerified: false,
    popularityScore: 45.8,
  },
];

/**
 * REGIONAL MIDDLE EASTERN BRANDS: Popular brands in the Middle East region
 */
export const REGIONAL_BRANDS: BrandSeedData[] = [
  // Turkish Brands
  {
    name: 'Arçelik',
    nameAr: 'أرتشليك',
    slug: 'arcelik',
    descriptionEn: 'Turkish home appliances and consumer electronics',
    descriptionAr: 'الأجهزة المنزلية التركية والإلكترونيات الاستهلاكية',
    countryOfOrigin: 'Turkey',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'TR-ARC-101',
    popularityScore: 88.3,
  },
  {
    name: 'Vestel',
    nameAr: 'فيستل',
    slug: 'vestel',
    descriptionEn: 'Turkish electronics and home appliances manufacturer',
    descriptionAr: 'شركة تركية لتصنيع الإلكترونيات والأجهزة المنزلية',
    countryOfOrigin: 'Turkey',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'authorized',
    approvalStatus: 'approved',
    isVerified: true,
    popularityScore: 82.1,
  },

  // Lebanese Brands
  {
    name: 'Al-Rifai',
    nameAr: 'الرفاعي',
    slug: 'al-rifai',
    descriptionEn: 'Premium Lebanese nuts, sweets, and delicacies',
    descriptionAr: 'المكسرات والحلويات اللبنانية الفاخرة',
    countryOfOrigin: 'Lebanon',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'LB-RF-201',
    popularityScore: 91.5,
  },

  // Egyptian Brands
  {
    name: 'Juhayna',
    nameAr: 'جهينة',
    slug: 'juhayna',
    descriptionEn: 'Egyptian dairy products and beverages',
    descriptionAr: 'منتجات الألبان والمشروبات المصرية',
    countryOfOrigin: 'Egypt',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'EG-JUH-301',
    popularityScore: 87.9,
  },

  // Jordanian Brands
  {
    name: 'Hikma Pharmaceuticals',
    nameAr: 'حكمة للأدوية',
    slug: 'hikma-pharmaceuticals',
    descriptionEn: 'Leading Middle Eastern pharmaceutical company',
    descriptionAr: 'شركة أدوية رائدة في الشرق الأوسط',
    countryOfOrigin: 'Jordan',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'JO-HIK-401',
    popularityScore: 76.3,
  },
];

/**
 * INTERNATIONAL BRANDS: Major global brands popular in Syria
 */
export const INTERNATIONAL_BRANDS: BrandSeedData[] = [
  // Technology Giants
  {
    name: 'Apple',
    nameAr: 'آبل',
    slug: 'apple',
    descriptionEn: 'Premium consumer electronics, software, and services',
    descriptionAr: 'الإلكترونيات الاستهلاكية والبرمجيات والخدمات المتميزة',
    countryOfOrigin: 'United States',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'US-APL-501',
    popularityScore: 98.5,
  },
  {
    name: 'Samsung',
    nameAr: 'سامسونغ',
    slug: 'samsung',
    descriptionEn: 'South Korean electronics and technology conglomerate',
    descriptionAr: 'مجموعة إلكترونيات وتكنولوجيا كورية جنوبية',
    countryOfOrigin: 'South Korea',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'KR-SAM-502',
    popularityScore: 96.2,
  },
  {
    name: 'Huawei',
    nameAr: 'هواوي',
    slug: 'huawei',
    descriptionEn:
      'Chinese telecommunications equipment and smartphone manufacturer',
    descriptionAr: 'شركة صينية لمعدات الاتصالات وتصنيع الهواتف الذكية',
    countryOfOrigin: 'China',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'CN-HUA-503',
    popularityScore: 89.7,
  },
  {
    name: 'Xiaomi',
    nameAr: 'شياومي',
    slug: 'xiaomi',
    descriptionEn: 'Chinese electronics and smart device manufacturer',
    descriptionAr: 'شركة صينية لتصنيع الإلكترونيات والأجهزة الذكية',
    countryOfOrigin: 'China',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'CN-XIA-504',
    popularityScore: 91.3,
  },

  // Automotive
  {
    name: 'Toyota',
    nameAr: 'تويوتا',
    slug: 'toyota',
    descriptionEn: 'Japanese automotive manufacturer known for reliability',
    descriptionAr: 'شركة يابانية لتصنيع السيارات معروفة بالموثوقية',
    countryOfOrigin: 'Japan',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'JP-TOY-601',
    popularityScore: 94.8,
  },
  {
    name: 'Hyundai',
    nameAr: 'هيونداي',
    slug: 'hyundai',
    descriptionEn: 'South Korean automotive and heavy industry manufacturer',
    descriptionAr: 'شركة كورية جنوبية لتصنيع السيارات والصناعات الثقيلة',
    countryOfOrigin: 'South Korea',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'KR-HYU-602',
    popularityScore: 88.5,
  },

  // Fashion & Lifestyle
  {
    name: 'Nike',
    nameAr: 'نايكي',
    slug: 'nike',
    descriptionEn: 'American sports apparel and equipment manufacturer',
    descriptionAr: 'شركة أمريكية لتصنيع الملابس والمعدات الرياضية',
    countryOfOrigin: 'United States',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'US-NIK-701',
    popularityScore: 95.2,
  },
  {
    name: 'Adidas',
    nameAr: 'أديداس',
    slug: 'adidas',
    descriptionEn: 'German sports apparel and equipment manufacturer',
    descriptionAr: 'شركة ألمانية لتصنيع الملابس والمعدات الرياضية',
    countryOfOrigin: 'Germany',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'DE-ADI-702',
    popularityScore: 92.7,
  },

  // Consumer Goods
  {
    name: 'Unilever',
    nameAr: 'يونيليفر',
    slug: 'unilever',
    descriptionEn: 'British-Dutch consumer goods company',
    descriptionAr: 'شركة بريطانية هولندية للسلع الاستهلاكية',
    countryOfOrigin: 'United Kingdom',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'UK-UNI-801',
    popularityScore: 87.4,
  },
  {
    name: 'Procter & Gamble',
    nameAr: 'بروكتر آند غامبل',
    slug: 'procter-gamble',
    descriptionEn: 'American consumer goods corporation',
    descriptionAr: 'شركة أمريكية للسلع الاستهلاكية',
    countryOfOrigin: 'United States',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'US-PG-802',
    popularityScore: 85.9,
  },

  // Food & Beverage
  {
    name: 'Coca-Cola',
    nameAr: 'كوكا كولا',
    slug: 'coca-cola',
    descriptionEn: 'American soft drink manufacturer and beverage corporation',
    descriptionAr: 'شركة أمريكية لتصنيع المشروبات الغازية',
    countryOfOrigin: 'United States',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'US-COC-901',
    popularityScore: 97.1,
  },
  {
    name: 'Nestlé',
    nameAr: 'نستله',
    slug: 'nestle',
    descriptionEn: 'Swiss multinational food and drink processing corporation',
    descriptionAr: 'شركة سويسرية متعددة الجنسيات لتصنيع الأغذية والمشروبات',
    countryOfOrigin: 'Switzerland',
    isActive: true,
    verificationStatus: 'verified',
    verificationType: 'official',
    approvalStatus: 'approved',
    isVerified: true,
    trademarkNumber: 'CH-NES-902',
    popularityScore: 93.6,
  },
];

/**
 * ALL BRANDS: Combined array of all brand seed data
 */
export const ALL_BRAND_SEEDS: BrandSeedData[] = [
  ...SYRIAN_BRANDS,
  ...REGIONAL_BRANDS,
  ...INTERNATIONAL_BRANDS,
];

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get brands by country of origin
 */
export const getBrandsByCountry = (country: string): BrandSeedData[] => {
  return ALL_BRAND_SEEDS.filter((brand) => brand.countryOfOrigin === country);
};

/**
 * Get Syrian brands specifically
 */
export const getSyrianBrands = (): BrandSeedData[] => {
  return SYRIAN_BRANDS;
};

/**
 * Get verified brands only
 */
export const getVerifiedBrands = (): BrandSeedData[] => {
  return ALL_BRAND_SEEDS.filter((brand) => brand.isVerified);
};

/**
 * Get brands by popularity score range
 */
export const getBrandsByPopularityRange = (
  minScore: number,
  maxScore: number,
): BrandSeedData[] => {
  return ALL_BRAND_SEEDS.filter(
    (brand) =>
      brand.popularityScore >= minScore && brand.popularityScore <= maxScore,
  );
};

/**
 * Get most popular brands (score > 90)
 */
export const getMostPopularBrands = (): BrandSeedData[] => {
  return getBrandsByPopularityRange(90, 100);
};

/**
 * STATISTICS
 */
export const BRAND_STATISTICS = {
  total: ALL_BRAND_SEEDS.length,
  syrian: SYRIAN_BRANDS.length,
  regional: REGIONAL_BRANDS.length,
  international: INTERNATIONAL_BRANDS.length,
  verified: getVerifiedBrands().length,
  mostPopular: getMostPopularBrands().length,
  averagePopularityScore: Number(
    (
      ALL_BRAND_SEEDS.reduce((sum, brand) => sum + brand.popularityScore, 0) /
      ALL_BRAND_SEEDS.length
    ).toFixed(2),
  ),
};

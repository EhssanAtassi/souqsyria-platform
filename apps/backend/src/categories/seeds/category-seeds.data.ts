/**
 * @file category-seeds.data.ts
 * @description Comprehensive seed data for Syrian e-commerce categories
 * Includes hierarchical categories with Syrian market focus and Arabic localization
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

export interface CategorySeedData {
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  iconUrl?: string;
  bannerUrl?: string;
  themeColor?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  showInNav: boolean;
  popularityScore: number;
  commissionRate?: number;
  minPrice?: number;
  maxPrice?: number;
  parentSlug?: string; // Reference to parent category by slug
  depthLevel: number;
}

/**
 * ROOT CATEGORIES: Top-level categories for Syrian market
 */
export const ROOT_CATEGORIES: CategorySeedData[] = [
  // Electronics & Technology
  {
    nameEn: 'Electronics',
    nameAr: 'إلكترونيات',
    slug: 'electronics',
    descriptionEn:
      'Consumer electronics, smartphones, TVs, laptops, and smart devices',
    descriptionAr:
      'الإلكترونيات الاستهلاكية والهواتف الذكية والتلفزيونات واللابتوب والأجهزة الذكية',
    iconUrl: 'https://cdn.souqsyria.com/categories/electronics-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/electronics-banner.jpg',
    themeColor: '#2196F3',
    seoTitle: 'Electronics - Buy Online in Syria | SouqSyria',
    seoDescription:
      'Shop electronics, smartphones, TVs & more with fast delivery across Syria',
    seoSlug: 'الكترونيات',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 10,
    showInNav: true,
    popularityScore: 95.5,
    commissionRate: 8.5,
    minPrice: 5000,
    maxPrice: 50000000,
    depthLevel: 0,
  },

  // Fashion & Clothing
  {
    nameEn: 'Fashion',
    nameAr: 'أزياء',
    slug: 'fashion',
    descriptionEn:
      "Men's and women's clothing, shoes, accessories, and traditional wear",
    descriptionAr: 'ملابس رجالية ونسائية وأحذية وإكسسوارات وملابس تقليدية',
    iconUrl: 'https://cdn.souqsyria.com/categories/fashion-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/fashion-banner.jpg',
    themeColor: '#E91E63',
    seoTitle: 'Fashion & Clothing - Syrian Style | SouqSyria',
    seoDescription:
      'Discover Syrian fashion, traditional wear, and modern clothing styles',
    seoSlug: 'ازياء',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 20,
    showInNav: true,
    popularityScore: 88.2,
    commissionRate: 12.0,
    minPrice: 2000,
    maxPrice: 5000000,
    depthLevel: 0,
  },

  // Home & Living
  {
    nameEn: 'Home & Living',
    nameAr: 'منزل ومعيشة',
    slug: 'home-living',
    descriptionEn:
      'Furniture, home decor, kitchen appliances, and household essentials',
    descriptionAr: 'أثاث وديكور منزلي وأجهزة مطبخ ومستلزمات منزلية',
    iconUrl: 'https://cdn.souqsyria.com/categories/home-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/home-banner.jpg',
    themeColor: '#FF9800',
    seoTitle: 'Home & Living - Furniture & Decor | SouqSyria',
    seoDescription:
      'Transform your home with Syrian furniture, decor, and living essentials',
    seoSlug: 'منزل-ومعيشة',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 30,
    showInNav: true,
    popularityScore: 82.7,
    commissionRate: 10.5,
    minPrice: 1000,
    maxPrice: 20000000,
    depthLevel: 0,
  },

  // Food & Groceries
  {
    nameEn: 'Food & Groceries',
    nameAr: 'طعام وبقالة',
    slug: 'food-groceries',
    descriptionEn:
      'Fresh food, groceries, Syrian specialties, and international cuisine',
    descriptionAr: 'أطعمة طازجة وبقالة وأطعمة سورية متخصصة ومأكولات عالمية',
    iconUrl: 'https://cdn.souqsyria.com/categories/food-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/food-banner.jpg',
    themeColor: '#4CAF50',
    seoTitle: 'Food & Groceries - Syrian Specialties | SouqSyria',
    seoDescription:
      'Fresh groceries, Syrian food specialties, and international cuisine delivered',
    seoSlug: 'طعام-وبقالة',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 40,
    showInNav: true,
    popularityScore: 91.3,
    commissionRate: 6.0,
    minPrice: 100,
    maxPrice: 1000000,
    depthLevel: 0,
  },

  // Health & Beauty
  {
    nameEn: 'Health & Beauty',
    nameAr: 'صحة وجمال',
    slug: 'health-beauty',
    descriptionEn:
      'Cosmetics, skincare, healthcare products, and wellness items',
    descriptionAr: 'مستحضرات تجميل وعناية بالبشرة ومنتجات صحية وعناصر العافية',
    iconUrl: 'https://cdn.souqsyria.com/categories/beauty-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/beauty-banner.jpg',
    themeColor: '#9C27B0',
    seoTitle: 'Health & Beauty - Syrian Rose Products | SouqSyria',
    seoDescription:
      'Natural beauty products featuring Syrian rose water and traditional remedies',
    seoSlug: 'صحة-وجمال',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 50,
    showInNav: true,
    popularityScore: 85.9,
    commissionRate: 15.0,
    minPrice: 500,
    maxPrice: 2000000,
    depthLevel: 0,
  },

  // Sports & Fitness
  {
    nameEn: 'Sports & Fitness',
    nameAr: 'رياضة ولياقة',
    slug: 'sports-fitness',
    descriptionEn:
      'Sporting goods, fitness equipment, outdoor activities, and athletic wear',
    descriptionAr: 'سلع رياضية ومعدات لياقة وأنشطة خارجية وملابس رياضية',
    iconUrl: 'https://cdn.souqsyria.com/categories/sports-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/sports-banner.jpg',
    themeColor: '#FF5722',
    seoTitle: 'Sports & Fitness Equipment | SouqSyria',
    seoDescription:
      'Sports equipment, fitness gear, and athletic wear for active lifestyles',
    seoSlug: 'رياضة-ولياقة',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 60,
    showInNav: true,
    popularityScore: 73.4,
    commissionRate: 11.0,
    minPrice: 1000,
    maxPrice: 10000000,
    depthLevel: 0,
  },

  // Automotive
  {
    nameEn: 'Automotive',
    nameAr: 'سيارات',
    slug: 'automotive',
    descriptionEn:
      'Car parts, accessories, maintenance products, and automotive tools',
    descriptionAr:
      'قطع غيار السيارات وإكسسوارات ومنتجات الصيانة وأدوات السيارات',
    iconUrl: 'https://cdn.souqsyria.com/categories/automotive-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/automotive-banner.jpg',
    themeColor: '#607D8B',
    seoTitle: 'Automotive Parts & Accessories | SouqSyria',
    seoDescription:
      'Car parts, accessories, and automotive maintenance products in Syria',
    seoSlug: 'سيارات',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 70,
    showInNav: true,
    popularityScore: 76.1,
    commissionRate: 9.5,
    minPrice: 2000,
    maxPrice: 15000000,
    depthLevel: 0,
  },

  // Books & Education
  {
    nameEn: 'Books & Education',
    nameAr: 'كتب وتعليم',
    slug: 'books-education',
    descriptionEn:
      'Books, educational materials, stationery, and learning resources',
    descriptionAr: 'كتب ومواد تعليمية وقرطاسية وموارد التعلم',
    iconUrl: 'https://cdn.souqsyria.com/categories/books-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/books-banner.jpg',
    themeColor: '#795548',
    seoTitle: 'Books & Education - Learning Resources | SouqSyria',
    seoDescription:
      'Arabic and international books, educational materials, and stationery',
    seoSlug: 'كتب-وتعليم',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 80,
    showInNav: true,
    popularityScore: 68.3,
    commissionRate: 7.5,
    minPrice: 500,
    maxPrice: 500000,
    depthLevel: 0,
  },

  // Traditional Crafts & Heritage
  {
    nameEn: 'Traditional Crafts',
    nameAr: 'حرف تقليدية',
    slug: 'traditional-crafts',
    descriptionEn:
      'Syrian handicrafts, traditional items, artisan products, and heritage goods',
    descriptionAr:
      'الحرف اليدوية السورية والعناصر التقليدية ومنتجات الحرفيين والسلع التراثية',
    iconUrl: 'https://cdn.souqsyria.com/categories/crafts-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/crafts-banner.jpg',
    themeColor: '#8BC34A',
    seoTitle: 'Syrian Traditional Crafts & Heritage | SouqSyria',
    seoDescription:
      'Authentic Syrian handicrafts, traditional items, and artisan products',
    seoSlug: 'حرف-تقليدية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 90,
    showInNav: true,
    popularityScore: 89.7,
    commissionRate: 20.0,
    minPrice: 5000,
    maxPrice: 10000000,
    depthLevel: 0,
  },

  // Baby & Kids
  {
    nameEn: 'Baby & Kids',
    nameAr: 'أطفال ورضع',
    slug: 'baby-kids',
    descriptionEn:
      "Baby products, kids clothing, toys, and children's essentials",
    descriptionAr: 'منتجات الأطفال وملابس الأطفال والألعاب ومستلزمات الأطفال',
    iconUrl: 'https://cdn.souqsyria.com/categories/baby-icon.svg',
    bannerUrl: 'https://cdn.souqsyria.com/categories/baby-banner.jpg',
    themeColor: '#FFEB3B',
    seoTitle: 'Baby & Kids Products | SouqSyria',
    seoDescription:
      "Quality baby products, children's clothing, and educational toys",
    seoSlug: 'اطفال-ورضع',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 100,
    showInNav: true,
    popularityScore: 81.5,
    commissionRate: 13.5,
    minPrice: 1000,
    maxPrice: 3000000,
    depthLevel: 0,
  },
];

/**
 * ELECTRONICS SUBCATEGORIES: Level 1 electronics categories
 */
export const ELECTRONICS_SUBCATEGORIES: CategorySeedData[] = [
  {
    nameEn: 'Smartphones',
    nameAr: 'هواتف ذكية',
    slug: 'smartphones',
    parentSlug: 'electronics',
    descriptionEn: 'Latest smartphones, mobile phones, and accessories',
    descriptionAr: 'أحدث الهواتف الذكية والهواتف المحمولة والإكسسوارات',
    seoTitle: 'Smartphones - Latest Models | SouqSyria',
    seoDescription:
      'Buy latest smartphones and mobile phones with warranty in Syria',
    seoSlug: 'هواتف-ذكية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 10,
    showInNav: true,
    popularityScore: 98.2,
    commissionRate: 7.5,
    minPrice: 50000,
    maxPrice: 5000000,
    depthLevel: 1,
  },
  {
    nameEn: 'Laptops & Computers',
    nameAr: 'لابتوب وحاسوب',
    slug: 'laptops-computers',
    parentSlug: 'electronics',
    descriptionEn: 'Laptops, desktop computers, gaming PCs, and accessories',
    descriptionAr: 'لابتوب وحاسوب مكتبي وحاسوب ألعاب وإكسسوارات',
    seoTitle: 'Laptops & Computers | SouqSyria',
    seoDescription:
      'High-performance laptops and computers for work and gaming',
    seoSlug: 'لابتوب-وحاسوب',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 20,
    showInNav: true,
    popularityScore: 92.8,
    commissionRate: 8.0,
    minPrice: 200000,
    maxPrice: 20000000,
    depthLevel: 1,
  },
  {
    nameEn: 'TVs & Audio',
    nameAr: 'تلفزيونات وصوتيات',
    slug: 'tvs-audio',
    parentSlug: 'electronics',
    descriptionEn: 'Smart TVs, speakers, headphones, and home audio systems',
    descriptionAr: 'تلفزيونات ذكية ومكبرات صوت وسماعات وأنظمة صوتية منزلية',
    seoTitle: 'TVs & Audio Systems | SouqSyria',
    seoDescription: 'Smart TVs, sound systems, and audio equipment',
    seoSlug: 'تلفزيونات-وصوتيات',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 30,
    showInNav: true,
    popularityScore: 85.4,
    commissionRate: 9.0,
    minPrice: 100000,
    maxPrice: 15000000,
    depthLevel: 1,
  },
  {
    nameEn: 'Home Appliances',
    nameAr: 'أجهزة منزلية',
    slug: 'home-appliances',
    parentSlug: 'electronics',
    descriptionEn:
      'Kitchen appliances, washing machines, refrigerators, and air conditioners',
    descriptionAr: 'أجهزة مطبخ وغسالات وثلاجات ومكيفات هواء',
    seoTitle: 'Home Appliances | SouqSyria',
    seoDescription: 'Quality home appliances for modern Syrian households',
    seoSlug: 'اجهزة-منزلية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 40,
    showInNav: true,
    popularityScore: 88.9,
    commissionRate: 10.5,
    minPrice: 50000,
    maxPrice: 25000000,
    depthLevel: 1,
  },
];

/**
 * FASHION SUBCATEGORIES: Level 1 fashion categories
 */
export const FASHION_SUBCATEGORIES: CategorySeedData[] = [
  {
    nameEn: "Men's Fashion",
    nameAr: 'أزياء رجالية',
    slug: 'mens-fashion',
    parentSlug: 'fashion',
    descriptionEn: "Men's clothing, suits, shirts, pants, and accessories",
    descriptionAr: 'ملابس رجالية وبدلات وقمصان وسراويل وإكسسوارات',
    seoTitle: "Men's Fashion & Clothing | SouqSyria",
    seoDescription: "Stylish men's clothing and fashion accessories",
    seoSlug: 'ازياء-رجالية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 10,
    showInNav: true,
    popularityScore: 84.6,
    commissionRate: 12.5,
    minPrice: 5000,
    maxPrice: 2000000,
    depthLevel: 1,
  },
  {
    nameEn: "Women's Fashion",
    nameAr: 'أزياء نسائية',
    slug: 'womens-fashion',
    parentSlug: 'fashion',
    descriptionEn: "Women's clothing, dresses, hijabs, and fashion accessories",
    descriptionAr: 'ملابس نسائية وفساتين وحجاب وإكسسوارات أزياء',
    seoTitle: "Women's Fashion & Clothing | SouqSyria",
    seoDescription: "Elegant women's fashion and traditional Syrian styles",
    seoSlug: 'ازياء-نسائية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 20,
    showInNav: true,
    popularityScore: 91.3,
    commissionRate: 14.0,
    minPrice: 3000,
    maxPrice: 3000000,
    depthLevel: 1,
  },
  {
    nameEn: 'Traditional Wear',
    nameAr: 'ملابس تقليدية',
    slug: 'traditional-wear',
    parentSlug: 'fashion',
    descriptionEn:
      'Syrian traditional clothing, thobes, abayas, and cultural attire',
    descriptionAr:
      'الملابس التقليدية السورية والثياب والعباءات والملابس الثقافية',
    seoTitle: 'Syrian Traditional Clothing | SouqSyria',
    seoDescription: 'Authentic Syrian traditional wear and cultural clothing',
    seoSlug: 'ملابس-تقليدية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 30,
    showInNav: true,
    popularityScore: 87.1,
    commissionRate: 18.0,
    minPrice: 10000,
    maxPrice: 5000000,
    depthLevel: 1,
  },
  {
    nameEn: 'Shoes & Footwear',
    nameAr: 'أحذية',
    slug: 'shoes-footwear',
    parentSlug: 'fashion',
    descriptionEn:
      "Men's and women's shoes, sandals, boots, and athletic footwear",
    descriptionAr: 'أحذية رجالية ونسائية وصنادل وأحذية وأحذية رياضية',
    seoTitle: 'Shoes & Footwear | SouqSyria',
    seoDescription: 'Quality shoes and footwear for men, women, and children',
    seoSlug: 'احذية',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 40,
    showInNav: true,
    popularityScore: 78.9,
    commissionRate: 11.5,
    minPrice: 8000,
    maxPrice: 1500000,
    depthLevel: 1,
  },
];

/**
 * FOOD SUBCATEGORIES: Level 1 food categories
 */
export const FOOD_SUBCATEGORIES: CategorySeedData[] = [
  {
    nameEn: 'Syrian Specialties',
    nameAr: 'أطعمة سورية متخصصة',
    slug: 'syrian-specialties',
    parentSlug: 'food-groceries',
    descriptionEn:
      'Traditional Syrian foods, spices, sweets, and regional specialties',
    descriptionAr: 'أطعمة سورية تقليدية وتوابل وحلويات وتخصصات إقليمية',
    seoTitle: 'Syrian Food Specialties | SouqSyria',
    seoDescription:
      'Authentic Syrian cuisine, traditional sweets, and regional specialties',
    seoSlug: 'اطعمة-سورية-متخصصة',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: true,
    sortOrder: 10,
    showInNav: true,
    popularityScore: 94.7,
    commissionRate: 8.0,
    minPrice: 500,
    maxPrice: 200000,
    depthLevel: 1,
  },
  {
    nameEn: 'Fresh Produce',
    nameAr: 'منتجات طازجة',
    slug: 'fresh-produce',
    parentSlug: 'food-groceries',
    descriptionEn: 'Fresh fruits, vegetables, herbs, and organic produce',
    descriptionAr: 'فواكه طازجة وخضروات وأعشاب ومنتجات عضوية',
    seoTitle: 'Fresh Produce & Vegetables | SouqSyria',
    seoDescription:
      'Farm-fresh fruits, vegetables, and organic produce delivery',
    seoSlug: 'منتجات-طازجة',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 20,
    showInNav: true,
    popularityScore: 86.2,
    commissionRate: 5.0,
    minPrice: 200,
    maxPrice: 50000,
    depthLevel: 1,
  },
  {
    nameEn: 'Pantry Essentials',
    nameAr: 'أساسيات المطبخ',
    slug: 'pantry-essentials',
    parentSlug: 'food-groceries',
    descriptionEn: 'Rice, flour, oil, canned goods, and kitchen staples',
    descriptionAr: 'أرز ودقيق وزيت ومعلبات وأساسيات المطبخ',
    seoTitle: 'Pantry Essentials & Staples | SouqSyria',
    seoDescription:
      'Kitchen staples, pantry essentials, and cooking ingredients',
    seoSlug: 'اساسيات-المطبخ',
    approvalStatus: 'approved',
    isActive: true,
    isFeatured: false,
    sortOrder: 30,
    showInNav: true,
    popularityScore: 89.4,
    commissionRate: 4.5,
    minPrice: 500,
    maxPrice: 100000,
    depthLevel: 1,
  },
];

/**
 * ALL CATEGORIES: Combined array of all category seed data
 */
export const ALL_CATEGORY_SEEDS: CategorySeedData[] = [
  ...ROOT_CATEGORIES,
  ...ELECTRONICS_SUBCATEGORIES,
  ...FASHION_SUBCATEGORIES,
  ...FOOD_SUBCATEGORIES,
];

/**
 * UTILITY FUNCTIONS
 */

/**
 * Get categories by depth level
 */
export const getCategoriesByDepth = (depth: number): CategorySeedData[] => {
  return ALL_CATEGORY_SEEDS.filter((category) => category.depthLevel === depth);
};

/**
 * Get root categories (depth 0)
 */
export const getRootCategories = (): CategorySeedData[] => {
  return getCategoriesByDepth(0);
};

/**
 * Get featured categories only
 */
export const getFeaturedCategories = (): CategorySeedData[] => {
  return ALL_CATEGORY_SEEDS.filter((category) => category.isFeatured);
};

/**
 * Get categories by parent slug
 */
export const getCategoriesByParent = (
  parentSlug: string,
): CategorySeedData[] => {
  return ALL_CATEGORY_SEEDS.filter(
    (category) => category.parentSlug === parentSlug,
  );
};

/**
 * Get categories by approval status
 */
export const getCategoriesByStatus = (status: string): CategorySeedData[] => {
  return ALL_CATEGORY_SEEDS.filter(
    (category) => category.approvalStatus === status,
  );
};

/**
 * Get categories by popularity range
 */
export const getCategoriesByPopularityRange = (
  minScore: number,
  maxScore: number,
): CategorySeedData[] => {
  return ALL_CATEGORY_SEEDS.filter(
    (category) =>
      category.popularityScore >= minScore &&
      category.popularityScore <= maxScore,
  );
};

/**
 * Get most popular categories (score > 90)
 */
export const getMostPopularCategories = (): CategorySeedData[] => {
  return getCategoriesByPopularityRange(90, 100);
};

/**
 * STATISTICS
 */
export const CATEGORY_STATISTICS = {
  total: ALL_CATEGORY_SEEDS.length,
  root: getRootCategories().length,
  subcategories: ALL_CATEGORY_SEEDS.length - getRootCategories().length,
  featured: getFeaturedCategories().length,
  approved: getCategoriesByStatus('approved').length,
  active: ALL_CATEGORY_SEEDS.filter((cat) => cat.isActive).length,
  mostPopular: getMostPopularCategories().length,
  averagePopularityScore: Number(
    (
      ALL_CATEGORY_SEEDS.reduce(
        (sum, category) => sum + category.popularityScore,
        0,
      ) / ALL_CATEGORY_SEEDS.length
    ).toFixed(2),
  ),
  averageCommissionRate: Number(
    (
      ALL_CATEGORY_SEEDS.filter((cat) => cat.commissionRate).reduce(
        (sum, category) => sum + category.commissionRate,
        0,
      ) / ALL_CATEGORY_SEEDS.filter((cat) => cat.commissionRate).length
    ).toFixed(2),
  ),
  hierarchyLevels:
    Math.max(...ALL_CATEGORY_SEEDS.map((cat) => cat.depthLevel)) + 1,
};

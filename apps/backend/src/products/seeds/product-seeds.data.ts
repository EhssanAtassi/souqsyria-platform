/**
 * @file product-seeds.data.ts
 * @description Comprehensive Product Seed Data for SouqSyria Platform
 *
 * PRODUCT FEATURES:
 * - Comprehensive Syrian e-commerce product catalog
 * - Multi-category product coverage (Electronics, Fashion, Food, etc.)
 * - Arabic/English bilingual product information
 * - Syrian market pricing in SYP with USD conversion
 * - Product variants (sizes, colors, specifications)
 * - Syrian vendor integration and localization
 * - Business type filtering (individual, small_business, etc.)
 * - Advanced filtering and validation capabilities
 * - Approval workflow integration (draft → pending → approved)
 * - SEO optimization and slug generation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

export interface ProductSeedData {
  // Basic Product Information
  nameEn: string;
  nameAr: string;
  slug: string;
  sku: string;

  // Descriptions and Content
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  detailedDescriptionEn: string;
  detailedDescriptionAr: string;

  // Pricing and Currency
  basePriceSYP: number;
  basePriceUSD?: number;
  currency: 'SYP' | 'USD' | 'EUR' | 'TRY';
  salePrice?: number;
  compareAtPrice?: number;
  costPrice?: number;

  // Categories and Classification
  categorySlug: string;
  brandSlug?: string;
  manufacturerName?: string;

  // Product Properties
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };

  // Status and Workflow
  status: 'draft' | 'published' | 'archived';
  approvalStatus:
    | 'draft'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'suspended'
    | 'archived';
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;

  // Syrian Business Features
  syrianBusinessFeatures: {
    localManufacturing: boolean;
    madeInSyria: boolean;
    diasporaShipping: boolean;
    traditionalProduct: boolean;
    halaalCertified: boolean;
    organicCertified: boolean;
    handmade: boolean;
    culturalSignificance: boolean;
  };

  // Product Attributes (for variations)
  attributes: Array<{
    attributeName: string;
    attributeValue: string;
  }>;

  // Product Features/Highlights
  features: string[];
  featuresAr: string[];

  // SEO and Marketing
  seoTitle?: string;
  seoDescription?: string;
  metaKeywords?: string[];

  // Vendor and Business Information
  vendorType:
    | 'individual'
    | 'small_business'
    | 'medium_business'
    | 'enterprise';
  targetAudience: string;
  targetAudienceAr: string;

  // Stock and Inventory
  stockQuantity: number;
  trackInventory: boolean;
  allowBackorder: boolean;

  // Images (placeholder URLs)
  imageUrls: string[];

  // Tags and Keywords
  tags: string[];
  tagsAr: string[];

  // Additional Properties
  productType: 'simple' | 'variable' | 'grouped' | 'external';
  shippingWeight?: number;
  shippingClass?: string;

  // Syrian Market Specific
  popularityScore: number;
  regionalAvailability: string[]; // Syrian governorates
  seasonality?: 'winter' | 'summer' | 'spring' | 'autumn' | 'year-round';
}

/**
 * ELECTRONICS PRODUCTS: Tech and electronic items popular in Syria
 */
export const ELECTRONICS_PRODUCTS: ProductSeedData[] = [
  // Smartphones
  {
    nameEn: 'Samsung Galaxy A54 128GB',
    nameAr: 'سامسونغ غالاكسي A54 بسعة 128 جيجا',
    slug: 'samsung-galaxy-a54-128gb',
    sku: 'SAMSUNG-A54-128-BLK',
    shortDescriptionEn:
      'Latest Samsung Galaxy A54 with 128GB storage, 50MP camera, and 5G connectivity',
    shortDescriptionAr:
      'أحدث سامسونغ غالاكسي A54 بسعة 128 جيجا، كاميرا 50 ميجابكسل، واتصال 5G',
    detailedDescriptionEn:
      'Experience the power of Samsung Galaxy A54 with its stunning 6.4-inch Super AMOLED display, advanced 50MP triple camera system, and lightning-fast 5G connectivity. Perfect for photography enthusiasts and multitaskers.',
    detailedDescriptionAr:
      'اختبر قوة سامسونغ غالاكسي A54 مع شاشة Super AMOLED الرائعة بحجم 6.4 بوصة، ونظام الكاميرا الثلاثي المتقدم 50 ميجابكسل، واتصال 5G فائق السرعة. مثالي لمحبي التصوير ومتعددي المهام.',
    basePriceSYP: 12500000, // ~500 USD
    basePriceUSD: 500,
    currency: 'SYP',
    salePrice: 11875000, // 5% discount
    compareAtPrice: 13000000,
    categorySlug: 'electronics',
    brandSlug: 'samsung',
    manufacturerName: 'Samsung Electronics',
    weight: 0.2,
    dimensions: { width: 76.7, height: 158.2, length: 8.2 },
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: false,
      madeInSyria: false,
      diasporaShipping: true,
      traditionalProduct: false,
      halaalCertified: false,
      organicCertified: false,
      handmade: false,
      culturalSignificance: false,
    },
    attributes: [
      { attributeName: 'Color', attributeValue: 'Awesome Black' },
      { attributeName: 'Storage', attributeValue: '128GB' },
      { attributeName: 'RAM', attributeValue: '6GB' },
    ],
    features: [
      '50MP Triple Camera System',
      '6.4" Super AMOLED Display',
      '5G Connectivity',
      'Fast Charging 25W',
      'Water Resistant IP67',
    ],
    featuresAr: [
      'نظام كاميرا ثلاثي 50 ميجابكسل',
      'شاشة Super AMOLED بحجم 6.4 بوصة',
      'اتصال 5G',
      'شحن سريع 25 واط',
      'مقاوم للماء IP67',
    ],
    seoTitle: 'Samsung Galaxy A54 128GB - Best Price in Syria | SouqSyria',
    seoDescription:
      'Buy Samsung Galaxy A54 128GB at the best price in Syria. 50MP camera, 5G connectivity, fast shipping to all Syrian governorates.',
    metaKeywords: ['samsung', 'galaxy', 'smartphone', 'syria', '5g', 'camera'],
    vendorType: 'medium_business',
    targetAudience: 'Tech enthusiasts, young professionals, photography lovers',
    targetAudienceAr: 'محبو التكنولوجيا، المهنيون الشباب، محبو التصوير',
    stockQuantity: 50,
    trackInventory: true,
    allowBackorder: false,
    imageUrls: [
      '/products/samsung-galaxy-a54/main.jpg',
      '/products/samsung-galaxy-a54/back.jpg',
      '/products/samsung-galaxy-a54/side.jpg',
    ],
    tags: ['smartphone', 'samsung', 'android', '5g', 'camera'],
    tagsAr: ['هاتف ذكي', 'سامسونغ', 'أندرويد', '5g', 'كاميرا'],
    productType: 'variable',
    shippingWeight: 0.3,
    shippingClass: 'electronics',
    popularityScore: 95,
    regionalAvailability: ['Damascus', 'Aleppo', 'Homs', 'Lattakia', 'Hama'],
    seasonality: 'year-round',
  },

  // Laptops
  {
    nameEn: 'Lenovo ThinkPad E14 Business Laptop',
    nameAr: 'لابتوب لينوفو ثينك باد E14 للأعمال',
    slug: 'lenovo-thinkpad-e14-business',
    sku: 'LENOVO-E14-I5-8GB',
    shortDescriptionEn:
      'Professional business laptop with Intel i5, 8GB RAM, 256GB SSD',
    shortDescriptionAr:
      'لابتوب احترافي للأعمال بمعالج إنتل i5، ذاكرة 8 جيجا، قرص SSD بسعة 256 جيجا',
    detailedDescriptionEn:
      'Lenovo ThinkPad E14 is designed for business professionals who demand reliability and performance. Features military-grade durability, all-day battery life, and enterprise-level security.',
    detailedDescriptionAr:
      'لينوفو ثينك باد E14 مصمم للمهنيين في الأعمال الذين يتطلبون الموثوقية والأداء. يتميز بالمتانة العسكرية وبطارية تدوم طوال اليوم وأمان على مستوى المؤسسات.',
    basePriceSYP: 22500000, // ~900 USD
    basePriceUSD: 900,
    currency: 'SYP',
    categorySlug: 'electronics',
    brandSlug: 'lenovo',
    manufacturerName: 'Lenovo Group',
    weight: 1.6,
    dimensions: { width: 324, height: 220, length: 17.9 },
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: false,
      madeInSyria: false,
      diasporaShipping: true,
      traditionalProduct: false,
      halaalCertified: false,
      organicCertified: false,
      handmade: false,
      culturalSignificance: false,
    },
    attributes: [
      { attributeName: 'Processor', attributeValue: 'Intel Core i5-1135G7' },
      { attributeName: 'RAM', attributeValue: '8GB DDR4' },
      { attributeName: 'Storage', attributeValue: '256GB SSD' },
      { attributeName: 'Screen Size', attributeValue: '14 inch' },
    ],
    features: [
      'Intel Core i5 11th Gen Processor',
      '14" Full HD Anti-Glare Display',
      '8GB DDR4 RAM',
      '256GB NVMe SSD',
      'Fingerprint Reader',
      'Military-Grade Durability',
    ],
    featuresAr: [
      'معالج إنتل كور i5 الجيل الحادي عشر',
      'شاشة 14 بوصة عالية الوضوح مضادة للوهج',
      'ذاكرة عشوائية 8 جيجا DDR4',
      'قرص SSD بسعة 256 جيجا',
      'قارئ بصمة الإصبع',
      'متانة عسكرية',
    ],
    vendorType: 'medium_business',
    targetAudience: 'Business professionals, students, freelancers',
    targetAudienceAr: 'المهنيون في الأعمال، الطلاب، المستقلون',
    stockQuantity: 25,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/lenovo-e14/main.jpg',
      '/products/lenovo-e14/keyboard.jpg',
      '/products/lenovo-e14/ports.jpg',
    ],
    tags: ['laptop', 'business', 'lenovo', 'thinkpad', 'professional'],
    tagsAr: ['لابتوب', 'أعمال', 'لينوفو', 'ثينك باد', 'احترافي'],
    productType: 'simple',
    shippingWeight: 2.0,
    popularityScore: 88,
    regionalAvailability: ['Damascus', 'Aleppo', 'Homs'],
    seasonality: 'year-round',
  },

  // Home Appliances
  {
    nameEn: 'LG 65" 4K Smart TV NanoCell',
    nameAr: 'تلفزيون ذكي إل جي 65 بوصة 4K نانو سيل',
    slug: 'lg-65-4k-smart-tv-nanocell',
    sku: 'LG-65NANO75-4K',
    shortDescriptionEn:
      'Premium 65-inch 4K Smart TV with NanoCell technology and webOS',
    shortDescriptionAr:
      'تلفزيون ذكي فاخر 65 بوصة 4K بتقنية نانو سيل ونظام webOS',
    detailedDescriptionEn:
      "Experience stunning 4K visuals with LG's advanced NanoCell technology. Features AI-powered picture and sound optimization, built-in streaming apps, and voice control compatibility.",
    detailedDescriptionAr:
      'اختبر صور 4K المذهلة بتقنية نانو سيل المتقدمة من إل جي. يتميز بتحسين الصورة والصوت بالذكاء الاصطناعي وتطبيقات البث المدمجة والتوافق مع التحكم الصوتي.',
    basePriceSYP: 37500000, // ~1500 USD
    basePriceUSD: 1500,
    currency: 'SYP',
    salePrice: 35625000, // 5% discount
    categorySlug: 'electronics',
    brandSlug: 'lg',
    manufacturerName: 'LG Electronics',
    weight: 23.9,
    dimensions: { width: 1456, height: 835, length: 86 },
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: false,
      madeInSyria: false,
      diasporaShipping: false, // Too heavy for diaspora shipping
      traditionalProduct: false,
      halaalCertified: false,
      organicCertified: false,
      handmade: false,
      culturalSignificance: false,
    },
    attributes: [
      { attributeName: 'Screen Size', attributeValue: '65 inch' },
      { attributeName: 'Resolution', attributeValue: '4K UHD (3840x2160)' },
      { attributeName: 'Technology', attributeValue: 'NanoCell' },
      { attributeName: 'Smart OS', attributeValue: 'webOS' },
    ],
    features: [
      '65" 4K UHD NanoCell Display',
      'AI Picture & Sound Pro',
      'webOS Smart Platform',
      'HDR10 & Dolby Vision',
      'Built-in WiFi & Bluetooth',
      'Voice Remote Control',
    ],
    featuresAr: [
      'شاشة نانو سيل 65 بوصة 4K فائقة الوضوح',
      'صورة وصوت ذكي احترافي',
      'منصة webOS الذكية',
      'HDR10 ودولبي فيجن',
      'واي فاي وبلوتوث مدمج',
      'تحكم صوتي عن بعد',
    ],
    vendorType: 'medium_business',
    targetAudience: 'Families, entertainment enthusiasts, tech lovers',
    targetAudienceAr: 'العائلات، محبو الترفيه، محبو التكنولوجيا',
    stockQuantity: 15,
    trackInventory: true,
    allowBackorder: false,
    imageUrls: [
      '/products/lg-65-nanocell/main.jpg',
      '/products/lg-65-nanocell/side.jpg',
      '/products/lg-65-nanocell/remote.jpg',
    ],
    tags: ['tv', 'smart-tv', '4k', 'lg', 'nanocell', 'entertainment'],
    tagsAr: ['تلفزيون', 'تلفزيون ذكي', '4k', 'إل جي', 'نانو سيل', 'ترفيه'],
    productType: 'simple',
    shippingWeight: 30.0,
    popularityScore: 85,
    regionalAvailability: ['Damascus', 'Aleppo'],
    seasonality: 'year-round',
  },
];

/**
 * FASHION & APPAREL PRODUCTS: Clothing and accessories for the Syrian market
 */
export const FASHION_PRODUCTS: ProductSeedData[] = [
  // Traditional Syrian Clothing
  {
    nameEn: 'Traditional Syrian Thobe for Men',
    nameAr: 'ثوب سوري تقليدي للرجال',
    slug: 'traditional-syrian-thobe-men',
    sku: 'STHOBE-MEN-WHT-L',
    shortDescriptionEn:
      'Authentic handwoven Syrian thobe made from premium cotton',
    shortDescriptionAr: 'ثوب سوري أصيل منسوج يدوياً من القطن الفاخر',
    detailedDescriptionEn:
      'Handcrafted traditional Syrian thobe featuring intricate embroidery and premium cotton fabric. Perfect for special occasions, religious ceremonies, and cultural events. Made by skilled Syrian artisans.',
    detailedDescriptionAr:
      'ثوب سوري تقليدي مصنوع يدوياً يتميز بالتطريز المعقد وقماش القطن الفاخر. مثالي للمناسبات الخاصة والمراسم الدينية والفعاليات الثقافية. صنع بأيدي حرفيين سوريين مهرة.',
    basePriceSYP: 2500000, // ~100 USD
    basePriceUSD: 100,
    currency: 'SYP',
    categorySlug: 'fashion',
    brandSlug: 'damascus-heritage',
    manufacturerName: 'Damascus Heritage Crafts',
    weight: 0.5,
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: true,
      madeInSyria: true,
      diasporaShipping: true,
      traditionalProduct: true,
      halaalCertified: true,
      organicCertified: true,
      handmade: true,
      culturalSignificance: true,
    },
    attributes: [
      { attributeName: 'Size', attributeValue: 'Large' },
      { attributeName: 'Color', attributeValue: 'White' },
      { attributeName: 'Material', attributeValue: '100% Cotton' },
      { attributeName: 'Style', attributeValue: 'Traditional' },
    ],
    features: [
      'Handwoven Premium Cotton',
      'Traditional Syrian Embroidery',
      'Made in Damascus',
      'Cultural Heritage Design',
      'Breathable Fabric',
      'Machine Washable',
    ],
    featuresAr: [
      'قطن فاخر منسوج يدوياً',
      'تطريز سوري تقليدي',
      'صنع في دمشق',
      'تصميم تراث ثقافي',
      'قماش قابل للتنفس',
      'قابل للغسيل في الغسالة',
    ],
    vendorType: 'small_business',
    targetAudience:
      'Men seeking traditional Syrian clothing, cultural enthusiasts',
    targetAudienceAr:
      'الرجال الذين يبحثون عن الملابس السورية التقليدية، محبو الثقافة',
    stockQuantity: 30,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/syrian-thobe/white-front.jpg',
      '/products/syrian-thobe/embroidery-detail.jpg',
      '/products/syrian-thobe/model-wearing.jpg',
    ],
    tags: ['thobe', 'traditional', 'syrian', 'handmade', 'cultural', 'men'],
    tagsAr: ['ثوب', 'تقليدي', 'سوري', 'يدوي', 'ثقافي', 'رجال'],
    productType: 'variable',
    popularityScore: 92,
    regionalAvailability: [
      'Damascus',
      'Aleppo',
      'Homs',
      'Lattakia',
      'Hama',
      'Daraa',
    ],
    seasonality: 'year-round',
  },

  // Modern Fashion
  {
    nameEn: 'Premium Cotton T-Shirt Unisex',
    nameAr: 'تيشيرت قطني فاخر للجنسين',
    slug: 'premium-cotton-tshirt-unisex',
    sku: 'COTTON-TEE-BLK-M',
    shortDescriptionEn:
      'Soft premium cotton t-shirt with modern cut and sustainable fabric',
    shortDescriptionAr: 'تيشيرت قطني فاخر ناعم بقصة عصرية وقماش مستدام',
    detailedDescriptionEn:
      'High-quality cotton t-shirt perfect for everyday wear. Features a comfortable fit, durable construction, and eco-friendly manufacturing process.',
    detailedDescriptionAr:
      'تيشيرت قطني عالي الجودة مثالي للارتداء اليومي. يتميز بملاءمة مريحة وبناء متين وعملية تصنيع صديقة للبيئة.',
    basePriceSYP: 625000, // ~25 USD
    basePriceUSD: 25,
    currency: 'SYP',
    categorySlug: 'fashion',
    brandSlug: 'levant-style',
    manufacturerName: 'Levant Style Co.',
    weight: 0.2,
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    syrianBusinessFeatures: {
      localManufacturing: true,
      madeInSyria: true,
      diasporaShipping: true,
      traditionalProduct: false,
      halaalCertified: false,
      organicCertified: true,
      handmade: false,
      culturalSignificance: false,
    },
    attributes: [
      { attributeName: 'Size', attributeValue: 'Medium' },
      { attributeName: 'Color', attributeValue: 'Black' },
      { attributeName: 'Material', attributeValue: '100% Organic Cotton' },
      { attributeName: 'Fit', attributeValue: 'Regular' },
    ],
    features: [
      '100% Organic Cotton',
      'Pre-shrunk Fabric',
      'Reinforced Seams',
      'Eco-friendly Dyes',
      'Unisex Design',
      'Machine Washable',
    ],
    featuresAr: [
      'قطن عضوي 100%',
      'قماش مُعالج مسبقاً',
      'خياطة معززة',
      'أصباغ صديقة للبيئة',
      'تصميم للجنسين',
      'قابل للغسيل في الغسالة',
    ],
    vendorType: 'small_business',
    targetAudience:
      'Young adults, fashion-conscious consumers, eco-friendly shoppers',
    targetAudienceAr:
      'الشباب، المستهلكون المهتمون بالموضة، المتسوقون المهتمون بالبيئة',
    stockQuantity: 100,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/cotton-tshirt/black-front.jpg',
      '/products/cotton-tshirt/black-back.jpg',
      '/products/cotton-tshirt/fabric-detail.jpg',
    ],
    tags: ['tshirt', 'cotton', 'unisex', 'organic', 'casual', 'fashion'],
    tagsAr: ['تيشيرت', 'قطن', 'للجنسين', 'عضوي', 'كاجوال', 'موضة'],
    productType: 'variable',
    popularityScore: 78,
    regionalAvailability: ['Damascus', 'Aleppo', 'Homs', 'Lattakia'],
    seasonality: 'year-round',
  },
];

/**
 * FOOD & BEVERAGES: Syrian and Middle Eastern food products
 */
export const FOOD_PRODUCTS: ProductSeedData[] = [
  // Traditional Syrian Foods
  {
    nameEn: 'Authentic Aleppo Pepper - Premium Grade',
    nameAr: 'فلفل حلبي أصيل - درجة فاخرة',
    slug: 'authentic-aleppo-pepper-premium',
    sku: 'ALEP-PEPPER-500G',
    shortDescriptionEn:
      'Premium Aleppo pepper with rich flavor and mild heat, perfect for Middle Eastern cuisine',
    shortDescriptionAr:
      'فلفل حلبي فاخر بطعم غني وحرارة معتدلة، مثالي للمطبخ الشرق أوسطي',
    detailedDescriptionEn:
      'Authentic Aleppo pepper from the fertile lands of northern Syria. This premium spice offers a unique fruity flavor with mild heat, perfect for enhancing meat dishes, vegetables, and traditional Syrian recipes.',
    detailedDescriptionAr:
      'فلفل حلبي أصيل من الأراضي الخصبة في شمال سوريا. تقدم هذه التوابل الفاخرة نكهة فاكهية فريدة مع حرارة معتدلة، مثالية لتعزيز أطباق اللحوم والخضار والوصفات السورية التقليدية.',
    basePriceSYP: 750000, // ~30 USD
    basePriceUSD: 30,
    currency: 'SYP',
    categorySlug: 'food-beverages',
    brandSlug: 'al-ghouta',
    manufacturerName: 'Al-Ghouta Agricultural Co.',
    weight: 0.5,
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: true,
      madeInSyria: true,
      diasporaShipping: true,
      traditionalProduct: true,
      halaalCertified: true,
      organicCertified: true,
      handmade: true,
      culturalSignificance: true,
    },
    attributes: [
      { attributeName: 'Weight', attributeValue: '500g' },
      { attributeName: 'Origin', attributeValue: 'Aleppo, Syria' },
      { attributeName: 'Heat Level', attributeValue: 'Mild (2-3/10)' },
      { attributeName: 'Grade', attributeValue: 'Premium' },
    ],
    features: [
      'Authentic Aleppo Origin',
      'Premium Grade Quality',
      'Organic Certified',
      'Traditional Processing',
      'Rich Fruity Flavor',
      'Mild Heat Level',
    ],
    featuresAr: [
      'أصل حلبي أصيل',
      'جودة درجة فاخرة',
      'معتمد عضوي',
      'معالجة تقليدية',
      'طعم فاكهي غني',
      'مستوى حرارة معتدل',
    ],
    vendorType: 'small_business',
    targetAudience:
      'Cooking enthusiasts, Syrian diaspora, Middle Eastern cuisine lovers',
    targetAudienceAr: 'محبو الطبخ، الجالية السورية، محبو المطبخ الشرق أوسطي',
    stockQuantity: 200,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/aleppo-pepper/package.jpg',
      '/products/aleppo-pepper/spice-close.jpg',
      '/products/aleppo-pepper/dish-example.jpg',
    ],
    tags: ['spice', 'aleppo', 'pepper', 'syrian', 'organic', 'cooking'],
    tagsAr: ['توابل', 'حلب', 'فلفل', 'سوري', 'عضوي', 'طبخ'],
    productType: 'simple',
    popularityScore: 96,
    regionalAvailability: [
      'Damascus',
      'Aleppo',
      'Homs',
      'Lattakia',
      'Hama',
      'Daraa',
      'Deir ez-Zor',
    ],
    seasonality: 'year-round',
  },

  // Modern Food Products
  {
    nameEn: 'Premium Syrian Olive Oil - Extra Virgin',
    nameAr: 'زيت زيتون سوري فاخر - بكر ممتاز',
    slug: 'premium-syrian-olive-oil-extra-virgin',
    sku: 'OLIVE-OIL-EV-1L',
    shortDescriptionEn:
      'Cold-pressed extra virgin olive oil from ancient Syrian olive groves',
    shortDescriptionAr:
      'زيت زيتون بكر ممتاز معصور على البارد من بساتين الزيتون السورية العريقة',
    detailedDescriptionEn:
      'Premium extra virgin olive oil from centuries-old olive trees in the Syrian countryside. Cold-pressed within hours of harvest to preserve maximum flavor and nutritional value.',
    detailedDescriptionAr:
      'زيت زيتون بكر ممتاز فاخر من أشجار الزيتون العريقة في الريف السوري. معصور على البارد خلال ساعات من القطف للحفاظ على أقصى نكهة وقيمة غذائية.',
    basePriceSYP: 1250000, // ~50 USD
    basePriceUSD: 50,
    currency: 'SYP',
    categorySlug: 'food-beverages',
    brandSlug: 'al-ghouta',
    manufacturerName: 'Al-Ghouta Agricultural Co.',
    weight: 1.0,
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: true,
      madeInSyria: true,
      diasporaShipping: true,
      traditionalProduct: true,
      halaalCertified: true,
      organicCertified: true,
      handmade: false,
      culturalSignificance: true,
    },
    attributes: [
      { attributeName: 'Volume', attributeValue: '1 Liter' },
      { attributeName: 'Grade', attributeValue: 'Extra Virgin' },
      { attributeName: 'Processing', attributeValue: 'Cold Pressed' },
      { attributeName: 'Origin', attributeValue: 'Syrian Countryside' },
    ],
    features: [
      'Extra Virgin Quality',
      'Cold Pressed Method',
      'Ancient Tree Origin',
      'High Antioxidants',
      'Rich Mediterranean Flavor',
      'Premium Glass Bottle',
    ],
    featuresAr: [
      'جودة بكر ممتاز',
      'طريقة العصر على البارد',
      'من أشجار عريقة',
      'غني بمضادات الأكسدة',
      'نكهة متوسطية غنية',
      'زجاجة فاخرة',
    ],
    vendorType: 'medium_business',
    targetAudience:
      'Health-conscious consumers, cooking enthusiasts, gourmet food lovers',
    targetAudienceAr:
      'المستهلكون المهتمون بالصحة، محبو الطبخ، محبو الطعام الفاخر',
    stockQuantity: 150,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/olive-oil/bottle-main.jpg',
      '/products/olive-oil/pouring.jpg',
      '/products/olive-oil/olives-tree.jpg',
    ],
    tags: [
      'olive-oil',
      'extra-virgin',
      'syrian',
      'organic',
      'gourmet',
      'healthy',
    ],
    tagsAr: ['زيت زيتون', 'بكر ممتاز', 'سوري', 'عضوي', 'فاخر', 'صحي'],
    productType: 'simple',
    popularityScore: 89,
    regionalAvailability: ['Damascus', 'Aleppo', 'Homs', 'Lattakia', 'Hama'],
    seasonality: 'year-round',
  },
];

/**
 * HOME & GARDEN: Home improvement and garden products
 */
export const HOME_GARDEN_PRODUCTS: ProductSeedData[] = [
  {
    nameEn: 'Handcrafted Damascus Steel Garden Tool Set',
    nameAr: 'طقم أدوات حديقة من الفولاذ الدمشقي المصنوع يدوياً',
    slug: 'handcrafted-damascus-steel-garden-tools',
    sku: 'DAMASCUS-GARDEN-SET-3PC',
    shortDescriptionEn:
      'Professional 3-piece garden tool set made from authentic Damascus steel',
    shortDescriptionAr:
      'طقم أدوات حديقة احترافي من 3 قطع مصنوع من الفولاذ الدمشقي الأصيل',
    detailedDescriptionEn:
      'Handforged garden tools using traditional Damascus steel techniques. Includes pruning shears, hand trowel, and cultivator. Each tool features exceptional durability and beautiful steel patterns.',
    detailedDescriptionAr:
      'أدوات حديقة مطروقة يدوياً باستخدام تقنيات الفولاذ الدمشقي التقليدية. يشمل مقص تقليم ومجرفة يد ومذراة. كل أداة تتميز بالمتانة الاستثنائية وأنماط فولاذية جميلة.',
    basePriceSYP: 3750000, // ~150 USD
    basePriceUSD: 150,
    currency: 'SYP',
    categorySlug: 'home-garden',
    brandSlug: 'damascus-heritage',
    manufacturerName: 'Damascus Heritage Crafts',
    weight: 1.2,
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: true,
      madeInSyria: true,
      diasporaShipping: true,
      traditionalProduct: true,
      halaalCertified: false,
      organicCertified: false,
      handmade: true,
      culturalSignificance: true,
    },
    attributes: [
      { attributeName: 'Material', attributeValue: 'Damascus Steel' },
      { attributeName: 'Set Size', attributeValue: '3 Pieces' },
      { attributeName: 'Handle', attributeValue: 'Walnut Wood' },
      { attributeName: 'Finish', attributeValue: 'Hand Polished' },
    ],
    features: [
      'Authentic Damascus Steel',
      'Hand Forged Quality',
      'Walnut Wood Handles',
      'Traditional Craftsmanship',
      'Lifetime Durability',
      'Gift Box Included',
    ],
    featuresAr: [
      'فولاذ دمشقي أصيل',
      'جودة طرق يدوي',
      'مقابض خشب الجوز',
      'حرفية تقليدية',
      'متانة مدى الحياة',
      'علبة هدايا مشمولة',
    ],
    vendorType: 'small_business',
    targetAudience: 'Garden enthusiasts, collectors, tool professionals',
    targetAudienceAr: 'محبو البستنة، جامعو التحف، المهنيون في الأدوات',
    stockQuantity: 20,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/damascus-garden-tools/set-main.jpg',
      '/products/damascus-garden-tools/steel-pattern.jpg',
      '/products/damascus-garden-tools/in-use.jpg',
    ],
    tags: [
      'garden-tools',
      'damascus-steel',
      'handmade',
      'traditional',
      'professional',
    ],
    tagsAr: ['أدوات حديقة', 'فولاذ دمشقي', 'يدوي', 'تقليدي', 'احترافي'],
    productType: 'simple',
    popularityScore: 84,
    regionalAvailability: ['Damascus', 'Aleppo', 'Homs'],
    seasonality: 'spring',
  },
];

/**
 * BOOKS & EDUCATION: Educational materials and Syrian literature
 */
export const BOOKS_EDUCATION_PRODUCTS: ProductSeedData[] = [
  {
    nameEn: 'Complete Guide to Syrian Cuisine - Bilingual Edition',
    nameAr: 'الدليل الشامل للمطبخ السوري - إصدار ثنائي اللغة',
    slug: 'complete-guide-syrian-cuisine-bilingual',
    sku: 'BOOK-SYRIAN-CUISINE-BIL',
    shortDescriptionEn:
      'Comprehensive cookbook featuring 200+ traditional Syrian recipes with Arabic and English instructions',
    shortDescriptionAr:
      'كتاب طبخ شامل يضم أكثر من 200 وصفة سورية تقليدية مع تعليمات باللغتين العربية والإنجليزية',
    detailedDescriptionEn:
      'A beautifully illustrated cookbook celebrating Syrian culinary heritage. Features traditional recipes from all regions of Syria, cooking techniques, ingredient guides, and cultural stories behind each dish.',
    detailedDescriptionAr:
      'كتاب طبخ مصور بشكل جميل يحتفي بالتراث الطهوي السوري. يتضمن وصفات تقليدية من جميع مناطق سوريا وتقنيات الطبخ وأدلة المكونات والقصص الثقافية وراء كل طبق.',
    basePriceSYP: 1250000, // ~50 USD
    basePriceUSD: 50,
    currency: 'SYP',
    categorySlug: 'books-education',
    brandSlug: 'levant-publications',
    manufacturerName: 'Levant Publications',
    weight: 1.5,
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    syrianBusinessFeatures: {
      localManufacturing: true,
      madeInSyria: true,
      diasporaShipping: true,
      traditionalProduct: true,
      halaalCertified: false,
      organicCertified: false,
      handmade: false,
      culturalSignificance: true,
    },
    attributes: [
      { attributeName: 'Format', attributeValue: 'Hardcover' },
      { attributeName: 'Pages', attributeValue: '350 pages' },
      { attributeName: 'Language', attributeValue: 'Arabic & English' },
      { attributeName: 'Recipes', attributeValue: '200+' },
    ],
    features: [
      '200+ Traditional Recipes',
      'Bilingual Instructions',
      'Cultural Stories',
      'Ingredient Glossary',
      'Step-by-Step Photos',
      'Premium Paper Quality',
    ],
    featuresAr: [
      'أكثر من 200 وصفة تقليدية',
      'تعليمات ثنائية اللغة',
      'قصص ثقافية',
      'مسرد المكونات',
      'صور خطوة بخطوة',
      'جودة ورق فاخرة',
    ],
    vendorType: 'small_business',
    targetAudience:
      'Cooking enthusiasts, Syrian culture lovers, cookbook collectors',
    targetAudienceAr: 'محبو الطبخ، محبو الثقافة السورية، جامعو كتب الطبخ',
    stockQuantity: 75,
    trackInventory: true,
    allowBackorder: true,
    imageUrls: [
      '/products/syrian-cookbook/cover.jpg',
      '/products/syrian-cookbook/inside-pages.jpg',
      '/products/syrian-cookbook/recipe-example.jpg',
    ],
    tags: ['cookbook', 'syrian-cuisine', 'bilingual', 'traditional', 'culture'],
    tagsAr: ['كتاب طبخ', 'مطبخ سوري', 'ثنائي اللغة', 'تقليدي', 'ثقافة'],
    productType: 'simple',
    popularityScore: 87,
    regionalAvailability: [
      'Damascus',
      'Aleppo',
      'Homs',
      'Lattakia',
      'Hama',
      'Daraa',
    ],
    seasonality: 'year-round',
  },
];

/**
 * ALL PRODUCTS: Combined array of all product categories
 */
export const ALL_PRODUCT_SEEDS: ProductSeedData[] = [
  ...ELECTRONICS_PRODUCTS,
  ...FASHION_PRODUCTS,
  ...FOOD_PRODUCTS,
  ...HOME_GARDEN_PRODUCTS,
  ...BOOKS_EDUCATION_PRODUCTS,
];

/**
 * PRODUCT STATISTICS: Summary of seed data for analytics
 */
export const PRODUCT_STATISTICS = {
  total: ALL_PRODUCT_SEEDS.length,
  electronics: ALL_PRODUCT_SEEDS.filter((p) => p.categorySlug === 'electronics')
    .length,
  fashion: ALL_PRODUCT_SEEDS.filter((p) => p.categorySlug === 'fashion').length,
  food: ALL_PRODUCT_SEEDS.filter((p) => p.categorySlug === 'food-beverages')
    .length,
  homeGarden: ALL_PRODUCT_SEEDS.filter((p) => p.categorySlug === 'home-garden')
    .length,
  booksEducation: ALL_PRODUCT_SEEDS.filter(
    (p) => p.categorySlug === 'books-education',
  ).length,

  // Approval Status Distribution
  approved: ALL_PRODUCT_SEEDS.filter((p) => p.approvalStatus === 'approved')
    .length,
  pending: ALL_PRODUCT_SEEDS.filter((p) => p.approvalStatus === 'pending')
    .length,
  draft: ALL_PRODUCT_SEEDS.filter((p) => p.approvalStatus === 'draft').length,

  // Business Features
  madeInSyria: ALL_PRODUCT_SEEDS.filter(
    (p) => p.syrianBusinessFeatures.madeInSyria,
  ).length,
  traditional: ALL_PRODUCT_SEEDS.filter(
    (p) => p.syrianBusinessFeatures.traditionalProduct,
  ).length,
  handmade: ALL_PRODUCT_SEEDS.filter((p) => p.syrianBusinessFeatures.handmade)
    .length,
  organic: ALL_PRODUCT_SEEDS.filter(
    (p) => p.syrianBusinessFeatures.organicCertified,
  ).length,
  cultural: ALL_PRODUCT_SEEDS.filter(
    (p) => p.syrianBusinessFeatures.culturalSignificance,
  ).length,

  // Vendor Types
  individual: ALL_PRODUCT_SEEDS.filter((p) => p.vendorType === 'individual')
    .length,
  smallBusiness: ALL_PRODUCT_SEEDS.filter(
    (p) => p.vendorType === 'small_business',
  ).length,
  mediumBusiness: ALL_PRODUCT_SEEDS.filter(
    (p) => p.vendorType === 'medium_business',
  ).length,
  enterprise: ALL_PRODUCT_SEEDS.filter((p) => p.vendorType === 'enterprise')
    .length,

  // Product Types
  simple: ALL_PRODUCT_SEEDS.filter((p) => p.productType === 'simple').length,
  variable: ALL_PRODUCT_SEEDS.filter((p) => p.productType === 'variable')
    .length,

  // Status Flags
  active: ALL_PRODUCT_SEEDS.filter((p) => p.isActive).length,
  published: ALL_PRODUCT_SEEDS.filter((p) => p.isPublished).length,
  featured: ALL_PRODUCT_SEEDS.filter((p) => p.isFeatured).length,
};

/**
 * HELPER FUNCTIONS: For filtering and retrieving specific product sets
 */

export const getProductsByCategory = (
  categorySlug: string,
): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter((product) => product.categorySlug === categorySlug);

export const getProductsByVendorType = (
  vendorType: string,
): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter((product) => product.vendorType === vendorType);

export const getMadeInSyriaProducts = (): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter(
    (product) => product.syrianBusinessFeatures.madeInSyria,
  );

export const getTraditionalProducts = (): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter(
    (product) => product.syrianBusinessFeatures.traditionalProduct,
  );

export const getHandmadeProducts = (): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter(
    (product) => product.syrianBusinessFeatures.handmade,
  );

export const getFeaturedProducts = (): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter((product) => product.isFeatured);

export const getProductsByApprovalStatus = (
  status: string,
): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter((product) => product.approvalStatus === status);

export const getProductsByPriceRange = (
  minPrice: number,
  maxPrice: number,
): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter(
    (product) =>
      product.basePriceSYP >= minPrice && product.basePriceSYP <= maxPrice,
  );

export const getProductsByBrand = (brandSlug: string): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter((product) => product.brandSlug === brandSlug);

export const getProductsWithDiasporaShipping = (): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter(
    (product) => product.syrianBusinessFeatures.diasporaShipping,
  );

export const getProductsBySeasonality = (season: string): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter(
    (product) =>
      product.seasonality === season || product.seasonality === 'year-round',
  );

export const getProductsByRegion = (governorate: string): ProductSeedData[] =>
  ALL_PRODUCT_SEEDS.filter((product) =>
    product.regionalAvailability.includes(governorate),
  );

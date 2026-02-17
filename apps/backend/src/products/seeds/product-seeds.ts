/**
 * @file product-seeds.ts
 * @description Seed data for Syrian marketplace products across multiple categories.
 *
 * This file provides 50+ realistic Syrian product data for development and testing.
 * Products span 6 major categories with authentic Syrian crafts, foods, and goods.
 *
 * Categories:
 * 1. Damascus Steel (ID: 1) - Traditional weapons and cutlery
 * 2. Beauty & Wellness (ID: 2) - Natural Syrian beauty products
 * 3. Textiles (ID: 3) - Traditional fabrics and garments
 * 4. Food & Spices (ID: 4) - Syrian culinary products
 * 5. Traditional Crafts (ID: 5) - Handmade artisan goods
 * 6. Jewelry (ID: 6) - Traditional Syrian jewelry
 *
 * @author SouqSyria Development Team
 * @since 2026-02-07
 */

/**
 * Product seed data interface matching the ProductEntity structure
 */
export interface ProductSeedData {
  nameEn: string;
  nameAr: string;
  slug: string;
  sku: string;
  categoryId: number;
  manufacturerId: number | null;
  currency: 'SYP';
  status: 'published';
  approvalStatus: 'approved';
  isActive: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  featuredPriority?: number;
  pricing: {
    basePrice: number;
    discountPrice?: number;
    isActive: boolean;
  };
  images: Array<{
    imageUrl: string;
    altText: string;
    sortOrder: number;
  }>;
  descriptions: Array<{
    language: 'en' | 'ar';
    description: string;
  }>;
  variants: Array<{
    sku: string;
    variantData: Record<string, string>;
    price: number;
    stocks: Array<{
      warehouseId: number;
      quantity: number;
    }>;
  }>;
}

/**
 * Category seed data - must be created before products
 */
export const getCategorySeedData = () => [
  {
    id: 1,
    nameEn: 'Damascus Steel',
    nameAr: 'الفولاذ الدمشقي',
    slug: 'damascus-steel',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    id: 2,
    nameEn: 'Beauty & Wellness',
    nameAr: 'الجمال والعافية',
    slug: 'beauty-wellness',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    id: 3,
    nameEn: 'Textiles',
    nameAr: 'المنسوجات',
    slug: 'textiles',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    id: 4,
    nameEn: 'Food & Spices',
    nameAr: 'الطعام والتوابل',
    slug: 'food-spices',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    id: 5,
    nameEn: 'Traditional Crafts',
    nameAr: 'الحرف التقليدية',
    slug: 'traditional-crafts',
    approvalStatus: 'approved',
    isActive: true,
  },
  {
    id: 6,
    nameEn: 'Jewelry',
    nameAr: 'المجوهرات',
    slug: 'jewelry',
    approvalStatus: 'approved',
    isActive: true,
  },
];

/**
 * Main seed data generator
 * Returns 50+ Syrian marketplace products with realistic data
 */
export const getSeedProducts = (): ProductSeedData[] => [
  // ============================================================================
  // CATEGORY 1: DAMASCUS STEEL (10 products)
  // ============================================================================
  {
    nameEn: 'Damascus Steel Chef Knife 8 Inch',
    nameAr: 'سكين الطهاة من الفولاذ الدمشقي 8 بوصة',
    slug: 'damascus-steel-chef-knife-8-inch',
    sku: 'DAM-KNIFE-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 100,
    pricing: { basePrice: 500000, discountPrice: 450000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Steel+Chef+Knife',
        altText: 'Damascus Steel Chef Knife',
        sortOrder: 1,
      },
      {
        imageUrl: 'https://placehold.co/600x400?text=Knife+Detail',
        altText: 'Knife blade detail',
        sortOrder: 2,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Authentic 8-inch Damascus steel chef knife handcrafted by Syrian artisans. Features 67 layers of folded steel with beautiful wave patterns.',
      },
      {
        language: 'ar',
        description:
          'سكين طهاة أصلي من الفولاذ الدمشقي مقاس 8 بوصات مصنوع يدويًا من قبل الحرفيين السوريين. يتميز بـ 67 طبقة من الفولاذ المطوي بأنماط موجية جميلة.',
      },
    ],
    variants: [
      {
        sku: 'DAM-KNIFE-001-ROSE',
        variantData: { Handle: 'Rosewood' },
        price: 450000,
        stocks: [{ warehouseId: 1, quantity: 15 }],
      },
      {
        sku: 'DAM-KNIFE-001-WALNUT',
        variantData: { Handle: 'Walnut' },
        price: 450000,
        stocks: [{ warehouseId: 1, quantity: 8 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Hunting Dagger',
    nameAr: 'خنجر صيد من الفولاذ الدمشقي',
    slug: 'damascus-steel-hunting-dagger',
    sku: 'DAM-DAGGER-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 750000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Hunting+Dagger',
        altText: 'Damascus Hunting Dagger',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Traditional Syrian hunting dagger with Damascus steel blade and ornate handle. Perfect for collectors and outdoor enthusiasts.',
      },
      {
        language: 'ar',
        description:
          'خنجر صيد سوري تقليدي بنصل من الفولاذ الدمشقي ومقبض مزخرف. مثالي للمقتنين وعشاق الهواء الطلق.',
      },
    ],
    variants: [
      {
        sku: 'DAM-DAGGER-001-STD',
        variantData: { Size: 'Standard' },
        price: 750000,
        stocks: [{ warehouseId: 1, quantity: 5 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Pocket Knife',
    nameAr: 'سكين جيب من الفولاذ الدمشقي',
    slug: 'damascus-steel-pocket-knife',
    sku: 'DAM-POCKET-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 320000, discountPrice: 280000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Pocket+Knife',
        altText: 'Damascus Pocket Knife',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Compact folding pocket knife with authentic Damascus steel blade. Ideal for everyday carry and camping.',
      },
      {
        language: 'ar',
        description:
          'سكين جيب قابل للطي مدمج بنصل من الفولاذ الدمشقي الأصلي. مثالي للحمل اليومي والتخييم.',
      },
    ],
    variants: [
      {
        sku: 'DAM-POCKET-001-BLK',
        variantData: { Handle: 'Black Horn' },
        price: 280000,
        stocks: [{ warehouseId: 1, quantity: 12 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Bread Knife',
    nameAr: 'سكين خبز من الفولاذ الدمشقي',
    slug: 'damascus-steel-bread-knife',
    sku: 'DAM-BREAD-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 420000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Bread+Knife',
        altText: 'Damascus Bread Knife',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Serrated Damascus steel bread knife perfect for slicing bread, pastries, and cakes without crushing them.',
      },
      {
        language: 'ar',
        description:
          'سكين خبز مسنن من الفولاذ الدمشقي مثالي لتقطيع الخبز والمعجنات والكعك دون سحقها.',
      },
    ],
    variants: [
      {
        sku: 'DAM-BREAD-001-STD',
        variantData: { Size: '10 Inch' },
        price: 420000,
        stocks: [{ warehouseId: 1, quantity: 6 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Cleaver',
    nameAr: 'ساطور من الفولاذ الدمشقي',
    slug: 'damascus-steel-cleaver',
    sku: 'DAM-CLEAVER-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 650000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Cleaver',
        altText: 'Damascus Steel Cleaver',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Heavy-duty Damascus steel cleaver for chopping meat and bones. Perfectly balanced for professional use.',
      },
      {
        language: 'ar',
        description:
          'ساطور فولاذ دمشقي للخدمة الشاقة لتقطيع اللحوم والعظام. متوازن تمامًا للاستخدام الاحترافي.',
      },
    ],
    variants: [
      {
        sku: 'DAM-CLEAVER-001-STD',
        variantData: { Weight: 'Heavy' },
        price: 650000,
        stocks: [{ warehouseId: 1, quantity: 4 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Paring Knife',
    nameAr: 'سكين تقشير من الفولاذ الدمشقي',
    slug: 'damascus-steel-paring-knife',
    sku: 'DAM-PARING-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 280000, discountPrice: 250000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Paring+Knife',
        altText: 'Damascus Paring Knife',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Small Damascus steel paring knife perfect for peeling fruits and vegetables with precision.',
      },
      {
        language: 'ar',
        description:
          'سكين تقشير صغير من الفولاذ الدمشقي مثالي لتقشير الفواكه والخضروات بدقة.',
      },
    ],
    variants: [
      {
        sku: 'DAM-PARING-001-STD',
        variantData: { Size: '3.5 Inch' },
        price: 250000,
        stocks: [{ warehouseId: 1, quantity: 20 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Santoku Knife',
    nameAr: 'سكين سانتوكو من الفولاذ الدمشقي',
    slug: 'damascus-steel-santoku-knife',
    sku: 'DAM-SANTOKU-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 90,
    pricing: { basePrice: 580000, discountPrice: 520000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Santoku+Knife',
        altText: 'Damascus Santoku Knife',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Versatile Damascus steel Santoku knife combining Japanese design with Syrian craftsmanship.',
      },
      {
        language: 'ar',
        description:
          'سكين سانتوكو متعدد الاستخدامات من الفولاذ الدمشقي يجمع بين التصميم الياباني والحرفية السورية.',
      },
    ],
    variants: [
      {
        sku: 'DAM-SANTOKU-001-7IN',
        variantData: { Size: '7 Inch' },
        price: 520000,
        stocks: [{ warehouseId: 1, quantity: 10 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Boning Knife',
    nameAr: 'سكين تفكيك من الفولاذ الدمشقي',
    slug: 'damascus-steel-boning-knife',
    sku: 'DAM-BONING-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 380000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Boning+Knife',
        altText: 'Damascus Boning Knife',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Flexible Damascus steel boning knife designed for separating meat from bones with ease.',
      },
      {
        language: 'ar',
        description:
          'سكين تفكيك مرن من الفولاذ الدمشقي مصمم لفصل اللحم عن العظام بسهولة.',
      },
    ],
    variants: [
      {
        sku: 'DAM-BONING-001-FLEX',
        variantData: { Flexibility: 'Flexible' },
        price: 380000,
        stocks: [{ warehouseId: 1, quantity: 7 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Carving Fork',
    nameAr: 'شوكة تقطيع من الفولاذ الدمشقي',
    slug: 'damascus-steel-carving-fork',
    sku: 'DAM-FORK-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 220000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Carving+Fork',
        altText: 'Damascus Carving Fork',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Two-prong Damascus steel carving fork for holding meat while slicing. Matches our carving knives.',
      },
      {
        language: 'ar',
        description:
          'شوكة تقطيع ذات شقين من الفولاذ الدمشقي لتثبيت اللحم أثناء التقطيع. تتناسب مع سكاكين التقطيع لدينا.',
      },
    ],
    variants: [
      {
        sku: 'DAM-FORK-001-STD',
        variantData: { Prongs: '2-Prong' },
        price: 220000,
        stocks: [{ warehouseId: 1, quantity: 14 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Steel Steak Knife Set (4 pcs)',
    nameAr: 'طقم سكاكين ستيك من الفولاذ الدمشقي (4 قطع)',
    slug: 'damascus-steel-steak-knife-set',
    sku: 'DAM-STEAK-SET-001',
    categoryId: 1,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 85,
    pricing: { basePrice: 950000, discountPrice: 850000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Steak+Knife+Set',
        altText: 'Damascus Steak Knife Set',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Premium set of 4 Damascus steel steak knives with matching wooden handles. Perfect for dinner parties.',
      },
      {
        language: 'ar',
        description:
          'طقم فاخر من 4 سكاكين ستيك من الفولاذ الدمشقي بمقابض خشبية متطابقة. مثالي لحفلات العشاء.',
      },
    ],
    variants: [
      {
        sku: 'DAM-STEAK-SET-001-4PC',
        variantData: { Pieces: '4 Pieces' },
        price: 850000,
        stocks: [{ warehouseId: 1, quantity: 3 }],
      },
    ],
  },

  // ============================================================================
  // CATEGORY 2: BEAUTY & WELLNESS (10 products)
  // ============================================================================
  {
    nameEn: 'Aleppo Laurel Soap Bar 200g',
    nameAr: 'صابون حلب بزيت الغار 200 جرام',
    slug: 'aleppo-laurel-soap-bar-200g',
    sku: 'SOAP-ALEPPO-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 95,
    pricing: { basePrice: 120000, discountPrice: 100000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Aleppo+Laurel+Soap',
        altText: 'Aleppo Laurel Soap',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Traditional Aleppo soap made with olive oil and 40% laurel oil. Perfect for sensitive skin and hair.',
      },
      {
        language: 'ar',
        description:
          'صابون حلب التقليدي المصنوع من زيت الزيتون و 40٪ زيت غار. مثالي للبشرة الحساسة والشعر.',
      },
    ],
    variants: [
      {
        sku: 'SOAP-ALEPPO-001-200G',
        variantData: { Weight: '200g' },
        price: 100000,
        stocks: [{ warehouseId: 1, quantity: 50 }],
      },
    ],
  },
  {
    nameEn: 'Olive Oil Soap Bar Natural 150g',
    nameAr: 'صابون زيت الزيتون الطبيعي 150 جرام',
    slug: 'olive-oil-soap-bar-150g',
    sku: 'SOAP-OLIVE-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 75000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Olive+Oil+Soap',
        altText: 'Olive Oil Soap',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Pure olive oil soap bar handcrafted in Syria. Moisturizing and gentle for daily use.',
      },
      {
        language: 'ar',
        description:
          'صابون زيت زيتون نقي مصنوع يدويًا في سوريا. مرطب ولطيف للاستخدام اليومي.',
      },
    ],
    variants: [
      {
        sku: 'SOAP-OLIVE-001-150G',
        variantData: { Weight: '150g' },
        price: 75000,
        stocks: [{ warehouseId: 1, quantity: 80 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Rose Water 250ml',
    nameAr: 'ماء الورد الدمشقي 250 مل',
    slug: 'damascus-rose-water-250ml',
    sku: 'ROSE-WATER-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 88,
    pricing: { basePrice: 180000, discountPrice: 160000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Rose+Water',
        altText: 'Damascus Rose Water',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Premium Damascus rose water distilled from Damascene roses. Perfect for skincare and cooking.',
      },
      {
        language: 'ar',
        description:
          'ماء ورد دمشقي فاخر مقطر من الورد الدمشقي. مثالي للعناية بالبشرة والطبخ.',
      },
    ],
    variants: [
      {
        sku: 'ROSE-WATER-001-250ML',
        variantData: { Volume: '250ml' },
        price: 160000,
        stocks: [{ warehouseId: 1, quantity: 35 }],
      },
    ],
  },
  {
    nameEn: 'Black Seed Oil 100ml',
    nameAr: 'زيت الحبة السوداء 100 مل',
    slug: 'black-seed-oil-100ml',
    sku: 'OIL-BLACKSEED-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 250000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Black+Seed+Oil',
        altText: 'Black Seed Oil',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Cold-pressed black seed oil (Nigella sativa) from Syrian farms. Rich in antioxidants.',
      },
      {
        language: 'ar',
        description:
          'زيت الحبة السوداء معصور على البارد من المزارع السورية. غني بمضادات الأكسدة.',
      },
    ],
    variants: [
      {
        sku: 'OIL-BLACKSEED-001-100ML',
        variantData: { Volume: '100ml' },
        price: 250000,
        stocks: [{ warehouseId: 1, quantity: 25 }],
      },
    ],
  },
  {
    nameEn: 'Argan Oil Hair Treatment 50ml',
    nameAr: 'علاج الشعر بزيت الأرغان 50 مل',
    slug: 'argan-oil-hair-treatment-50ml',
    sku: 'HAIR-ARGAN-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 320000, discountPrice: 280000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Argan+Oil+Treatment',
        altText: 'Argan Oil Hair Treatment',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Pure argan oil hair treatment serum for damaged and dry hair. Adds shine and strength.',
      },
      {
        language: 'ar',
        description:
          'سيروم علاج الشعر بزيت الأرغان النقي للشعر التالف والجاف. يضيف اللمعان والقوة.',
      },
    ],
    variants: [
      {
        sku: 'HAIR-ARGAN-001-50ML',
        variantData: { Volume: '50ml' },
        price: 280000,
        stocks: [{ warehouseId: 1, quantity: 18 }],
      },
    ],
  },
  {
    nameEn: 'Natural Henna Powder 100g',
    nameAr: 'مسحوق الحناء الطبيعي 100 جرام',
    slug: 'natural-henna-powder-100g',
    sku: 'HENNA-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 95000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Natural+Henna+Powder',
        altText: 'Natural Henna Powder',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Pure natural henna powder for hair coloring and body art. No chemical additives.',
      },
      {
        language: 'ar',
        description:
          'مسحوق الحناء الطبيعي النقي لتلوين الشعر وفن الجسم. بدون إضافات كيميائية.',
      },
    ],
    variants: [
      {
        sku: 'HENNA-001-100G',
        variantData: { Weight: '100g' },
        price: 95000,
        stocks: [{ warehouseId: 1, quantity: 60 }],
      },
    ],
  },
  {
    nameEn: 'Dead Sea Salt Scrub 300g',
    nameAr: 'مقشر ملح البحر الميت 300 جرام',
    slug: 'dead-sea-salt-scrub-300g',
    sku: 'SCRUB-DEADSEA-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 220000, discountPrice: 195000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Dead+Sea+Salt+Scrub',
        altText: 'Dead Sea Salt Scrub',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Exfoliating body scrub with Dead Sea salt and essential oils. Removes dead skin cells.',
      },
      {
        language: 'ar',
        description:
          'مقشر الجسم بملح البحر الميت والزيوت الأساسية. يزيل خلايا الجلد الميتة.',
      },
    ],
    variants: [
      {
        sku: 'SCRUB-DEADSEA-001-300G',
        variantData: { Weight: '300g' },
        price: 195000,
        stocks: [{ warehouseId: 1, quantity: 22 }],
      },
    ],
  },
  {
    nameEn: 'Jasmine Essential Oil 10ml',
    nameAr: 'زيت الياسمين العطري 10 مل',
    slug: 'jasmine-essential-oil-10ml',
    sku: 'OIL-JASMINE-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 380000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Jasmine+Essential+Oil',
        altText: 'Jasmine Essential Oil',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Pure jasmine essential oil extracted from Damascus jasmine flowers. Perfect for aromatherapy.',
      },
      {
        language: 'ar',
        description:
          'زيت الياسمين العطري النقي المستخرج من زهور الياسمين الدمشقي. مثالي للعلاج بالروائح.',
      },
    ],
    variants: [
      {
        sku: 'OIL-JASMINE-001-10ML',
        variantData: { Volume: '10ml' },
        price: 380000,
        stocks: [{ warehouseId: 1, quantity: 12 }],
      },
    ],
  },
  {
    nameEn: 'Aloe Vera Gel 200ml',
    nameAr: 'جل الصبار 200 مل',
    slug: 'aloe-vera-gel-200ml',
    sku: 'GEL-ALOE-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 150000, discountPrice: 130000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Aloe+Vera+Gel',
        altText: 'Aloe Vera Gel',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Pure aloe vera gel for skin hydration and healing. Soothes sunburn and irritation.',
      },
      {
        language: 'ar',
        description:
          'جل الصبار النقي لترطيب البشرة والشفاء. يهدئ حروق الشمس والتهيج.',
      },
    ],
    variants: [
      {
        sku: 'GEL-ALOE-001-200ML',
        variantData: { Volume: '200ml' },
        price: 130000,
        stocks: [{ warehouseId: 1, quantity: 40 }],
      },
    ],
  },
  {
    nameEn: 'Lavender Soap Bar 120g',
    nameAr: 'صابون اللافندر 120 جرام',
    slug: 'lavender-soap-bar-120g',
    sku: 'SOAP-LAVENDER-001',
    categoryId: 2,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 85000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Lavender+Soap',
        altText: 'Lavender Soap Bar',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Handmade lavender soap with calming essential oils. Perfect for relaxation and sleep.',
      },
      {
        language: 'ar',
        description:
          'صابون اللافندر المصنوع يدويًا بالزيوت الأساسية المهدئة. مثالي للاسترخاء والنوم.',
      },
    ],
    variants: [
      {
        sku: 'SOAP-LAVENDER-001-120G',
        variantData: { Weight: '120g' },
        price: 85000,
        stocks: [{ warehouseId: 1, quantity: 55 }],
      },
    ],
  },

  // ============================================================================
  // CATEGORY 3: TEXTILES (10 products)
  // ============================================================================
  {
    nameEn: 'Damascene Brocade Fabric 1 Meter',
    nameAr: 'قماش البروكار الدمشقي متر واحد',
    slug: 'damascene-brocade-fabric-1m',
    sku: 'FABRIC-BROCADE-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 80,
    pricing: { basePrice: 450000, discountPrice: 400000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascene+Brocade+Fabric',
        altText: 'Damascene Brocade Fabric',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Luxurious Damascus brocade fabric with traditional Syrian patterns. Perfect for upholstery and garments.',
      },
      {
        language: 'ar',
        description:
          'قماش البروكار الدمشقي الفاخر بالأنماط السورية التقليدية. مثالي للتنجيد والملابس.',
      },
    ],
    variants: [
      {
        sku: 'FABRIC-BROCADE-001-RED',
        variantData: { Color: 'Red Gold' },
        price: 400000,
        stocks: [{ warehouseId: 1, quantity: 15 }],
      },
      {
        sku: 'FABRIC-BROCADE-001-GREEN',
        variantData: { Color: 'Green Gold' },
        price: 400000,
        stocks: [{ warehouseId: 1, quantity: 12 }],
      },
    ],
  },
  {
    nameEn: 'Traditional Keffiyeh Scarf',
    nameAr: 'كوفية تقليدية',
    slug: 'traditional-keffiyeh-scarf',
    sku: 'SCARF-KEFFIYEH-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 180000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Traditional+Keffiyeh',
        altText: 'Traditional Keffiyeh Scarf',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Authentic Syrian keffiyeh scarf in traditional black and white pattern. 100% cotton.',
      },
      {
        language: 'ar',
        description: 'كوفية سورية أصلية بنمط أبيض وأسود تقليدي. 100٪ قطن.',
      },
    ],
    variants: [
      {
        sku: 'SCARF-KEFFIYEH-001-BW',
        variantData: { Color: 'Black White' },
        price: 180000,
        stocks: [{ warehouseId: 1, quantity: 30 }],
      },
      {
        sku: 'SCARF-KEFFIYEH-001-RW',
        variantData: { Color: 'Red White' },
        price: 180000,
        stocks: [{ warehouseId: 1, quantity: 25 }],
      },
    ],
  },
  {
    nameEn: 'Embroidered Table Runner 150cm',
    nameAr: 'مفرش طاولة مطرز 150 سم',
    slug: 'embroidered-table-runner-150cm',
    sku: 'TABLE-RUNNER-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 250000, discountPrice: 220000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Embroidered+Table+Runner',
        altText: 'Embroidered Table Runner',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Hand-embroidered table runner with traditional Syrian motifs. Perfect for dining rooms.',
      },
      {
        language: 'ar',
        description:
          'مفرش طاولة مطرز يدويًا بزخارف سورية تقليدية. مثالي لغرف الطعام.',
      },
    ],
    variants: [
      {
        sku: 'TABLE-RUNNER-001-GOLD',
        variantData: { Color: 'Gold Thread' },
        price: 220000,
        stocks: [{ warehouseId: 1, quantity: 8 }],
      },
    ],
  },
  {
    nameEn: 'Syrian Cotton Pillowcase Set (2 pcs)',
    nameAr: 'طقم أكياس وسائد قطنية سورية (قطعتان)',
    slug: 'syrian-cotton-pillowcase-set',
    sku: 'PILLOW-COTTON-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 320000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Cotton+Pillowcase+Set',
        altText: 'Syrian Cotton Pillowcase Set',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Premium Egyptian cotton pillowcase set with Syrian embroidery. Soft and breathable.',
      },
      {
        language: 'ar',
        description:
          'طقم أكياس وسائد من القطن المصري الفاخر بتطريز سوري. ناعم وقابل للتنفس.',
      },
    ],
    variants: [
      {
        sku: 'PILLOW-COTTON-001-WHITE',
        variantData: { Color: 'White' },
        price: 320000,
        stocks: [{ warehouseId: 1, quantity: 20 }],
      },
    ],
  },
  {
    nameEn: 'Aleppo Silk Scarf',
    nameAr: 'وشاح حرير حلبي',
    slug: 'aleppo-silk-scarf',
    sku: 'SCARF-SILK-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 75,
    pricing: { basePrice: 550000, discountPrice: 490000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Aleppo+Silk+Scarf',
        altText: 'Aleppo Silk Scarf',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Luxurious pure silk scarf from Aleppo with hand-painted Damascus rose design.',
      },
      {
        language: 'ar',
        description:
          'وشاح حريري فاخر من حلب مع تصميم الورد الدمشقي المرسوم يدويًا.',
      },
    ],
    variants: [
      {
        sku: 'SCARF-SILK-001-PINK',
        variantData: { Color: 'Pink' },
        price: 490000,
        stocks: [{ warehouseId: 1, quantity: 6 }],
      },
      {
        sku: 'SCARF-SILK-001-BLUE',
        variantData: { Color: 'Blue' },
        price: 490000,
        stocks: [{ warehouseId: 1, quantity: 4 }],
      },
    ],
  },
  {
    nameEn: 'Traditional Abaya Dress',
    nameAr: 'عباية تقليدية',
    slug: 'traditional-abaya-dress',
    sku: 'DRESS-ABAYA-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 850000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Traditional+Abaya',
        altText: 'Traditional Abaya Dress',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Elegant black abaya with delicate gold embroidery. Made from premium crepe fabric.',
      },
      {
        language: 'ar',
        description:
          'عباية سوداء أنيقة بتطريز ذهبي رقيق. مصنوعة من قماش الكريب الفاخر.',
      },
    ],
    variants: [
      {
        sku: 'DRESS-ABAYA-001-S',
        variantData: { Size: 'Small' },
        price: 850000,
        stocks: [{ warehouseId: 1, quantity: 3 }],
      },
      {
        sku: 'DRESS-ABAYA-001-M',
        variantData: { Size: 'Medium' },
        price: 850000,
        stocks: [{ warehouseId: 1, quantity: 5 }],
      },
      {
        sku: 'DRESS-ABAYA-001-L',
        variantData: { Size: 'Large' },
        price: 850000,
        stocks: [{ warehouseId: 1, quantity: 2 }],
      },
    ],
  },
  {
    nameEn: 'Handwoven Cotton Rug 120x180cm',
    nameAr: 'سجادة قطنية منسوجة يدويًا 120×180 سم',
    slug: 'handwoven-cotton-rug-120x180',
    sku: 'RUG-COTTON-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 680000, discountPrice: 620000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Handwoven+Cotton+Rug',
        altText: 'Handwoven Cotton Rug',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Traditional Syrian cotton rug handwoven on wooden looms. Durable and colorfast.',
      },
      {
        language: 'ar',
        description:
          'سجادة قطنية سورية تقليدية منسوجة يدويًا على نول خشبي. متينة وثابتة اللون.',
      },
    ],
    variants: [
      {
        sku: 'RUG-COTTON-001-MULTI',
        variantData: { Pattern: 'Multicolor' },
        price: 620000,
        stocks: [{ warehouseId: 1, quantity: 5 }],
      },
    ],
  },
  {
    nameEn: 'Embroidered Cushion Cover 45x45cm',
    nameAr: 'غطاء وسادة مطرز 45×45 سم',
    slug: 'embroidered-cushion-cover-45x45',
    sku: 'CUSHION-EMB-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 120000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Embroidered+Cushion+Cover',
        altText: 'Embroidered Cushion Cover',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Decorative cushion cover with traditional Syrian cross-stitch embroidery.',
      },
      {
        language: 'ar',
        description: 'غطاء وسادة زخرفي بتطريز سوري تقليدي بالغرزة المتقاطعة.',
      },
    ],
    variants: [
      {
        sku: 'CUSHION-EMB-001-RED',
        variantData: { Color: 'Red' },
        price: 120000,
        stocks: [{ warehouseId: 1, quantity: 25 }],
      },
      {
        sku: 'CUSHION-EMB-001-BLUE',
        variantData: { Color: 'Blue' },
        price: 120000,
        stocks: [{ warehouseId: 1, quantity: 18 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Brocade Tablecloth 200x150cm',
    nameAr: 'مفرش طاولة بروكار دمشقي 200×150 سم',
    slug: 'damascus-brocade-tablecloth-200x150',
    sku: 'TABLE-BROCADE-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 950000, discountPrice: 850000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Brocade+Tablecloth',
        altText: 'Damascus Brocade Tablecloth',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Luxurious Damascus brocade tablecloth for special occasions. Features intricate floral patterns.',
      },
      {
        language: 'ar',
        description:
          'مفرش طاولة بروكار دمشقي فاخر للمناسبات الخاصة. يتميز بأنماط زهرية معقدة.',
      },
    ],
    variants: [
      {
        sku: 'TABLE-BROCADE-001-GOLD',
        variantData: { Color: 'Gold' },
        price: 850000,
        stocks: [{ warehouseId: 1, quantity: 4 }],
      },
    ],
  },
  {
    nameEn: 'Cotton Prayer Rug',
    nameAr: 'سجادة صلاة قطنية',
    slug: 'cotton-prayer-rug',
    sku: 'RUG-PRAYER-001',
    categoryId: 3,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 280000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Cotton+Prayer+Rug',
        altText: 'Cotton Prayer Rug',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Comfortable cotton prayer rug with traditional Islamic geometric patterns.',
      },
      {
        language: 'ar',
        description: 'سجادة صلاة قطنية مريحة بأنماط هندسية إسلامية تقليدية.',
      },
    ],
    variants: [
      {
        sku: 'RUG-PRAYER-001-GREEN',
        variantData: { Color: 'Green' },
        price: 280000,
        stocks: [{ warehouseId: 1, quantity: 35 }],
      },
    ],
  },

  // ============================================================================
  // CATEGORY 4: FOOD & SPICES (10 products)
  // ============================================================================
  {
    nameEn: 'Syrian Zaatar Mix 250g',
    nameAr: 'خلطة الزعتر السوري 250 جرام',
    slug: 'syrian-zaatar-mix-250g',
    sku: 'SPICE-ZAATAR-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 92,
    pricing: { basePrice: 150000, discountPrice: 130000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Syrian+Zaatar+Mix',
        altText: 'Syrian Zaatar Mix',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Premium Syrian zaatar blend with thyme, sumac, sesame seeds, and salt. Perfect for manakish.',
      },
      {
        language: 'ar',
        description:
          'خلطة زعتر سوري فاخر بالزعتر والسماق وبذور السمسم والملح. مثالي للمناقيش.',
      },
    ],
    variants: [
      {
        sku: 'SPICE-ZAATAR-001-250G',
        variantData: { Weight: '250g' },
        price: 130000,
        stocks: [{ warehouseId: 1, quantity: 100 }],
      },
    ],
  },
  {
    nameEn: 'Aleppo Pepper Flakes 100g',
    nameAr: 'رقائق فلفل حلب 100 جرام',
    slug: 'aleppo-pepper-flakes-100g',
    sku: 'SPICE-PEPPER-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 180000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Aleppo+Pepper+Flakes',
        altText: 'Aleppo Pepper Flakes',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Authentic Aleppo pepper with moderate heat and fruity undertones. Essential Syrian spice.',
      },
      {
        language: 'ar',
        description:
          'فلفل حلب أصلي بحرارة معتدلة ونكهة فواكه. توابل سورية أساسية.',
      },
    ],
    variants: [
      {
        sku: 'SPICE-PEPPER-001-100G',
        variantData: { Weight: '100g' },
        price: 180000,
        stocks: [{ warehouseId: 1, quantity: 75 }],
      },
    ],
  },
  {
    nameEn: 'Seven Spices Blend 150g',
    nameAr: 'خلطة السبع بهارات 150 جرام',
    slug: 'seven-spices-blend-150g',
    sku: 'SPICE-SEVEN-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 120000, discountPrice: 105000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Seven+Spices+Blend',
        altText: 'Seven Spices Blend',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Traditional Syrian seven spice blend with black pepper, allspice, cinnamon, and more.',
      },
      {
        language: 'ar',
        description:
          'خلطة البهارات السبع السورية التقليدية بالفلفل الأسود والبهار والقرفة وغيرها.',
      },
    ],
    variants: [
      {
        sku: 'SPICE-SEVEN-001-150G',
        variantData: { Weight: '150g' },
        price: 105000,
        stocks: [{ warehouseId: 1, quantity: 90 }],
      },
    ],
  },
  {
    nameEn: 'Sumac Powder 200g',
    nameAr: 'مسحوق السماق 200 جرام',
    slug: 'sumac-powder-200g',
    sku: 'SPICE-SUMAC-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 95000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Sumac+Powder',
        altText: 'Sumac Powder',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Ground sumac with tangy lemony flavor. Perfect for fattoush salad and grilled meats.',
      },
      {
        language: 'ar',
        description:
          'سماق مطحون بنكهة حامضة ليمونية. مثالي لسلطة الفتوش واللحوم المشوية.',
      },
    ],
    variants: [
      {
        sku: 'SPICE-SUMAC-001-200G',
        variantData: { Weight: '200g' },
        price: 95000,
        stocks: [{ warehouseId: 1, quantity: 110 }],
      },
    ],
  },
  {
    nameEn: 'Dried Mint Leaves 100g',
    nameAr: 'أوراق النعناع المجففة 100 جرام',
    slug: 'dried-mint-leaves-100g',
    sku: 'HERB-MINT-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 70000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Dried+Mint+Leaves',
        altText: 'Dried Mint Leaves',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Dried Syrian mint leaves for tea and cooking. Aromatic and refreshing.',
      },
      {
        language: 'ar',
        description: 'أوراق النعناع السوري المجففة للشاي والطبخ. عطرية ومنعشة.',
      },
    ],
    variants: [
      {
        sku: 'HERB-MINT-001-100G',
        variantData: { Weight: '100g' },
        price: 70000,
        stocks: [{ warehouseId: 1, quantity: 85 }],
      },
    ],
  },
  {
    nameEn: 'Damascus Rose Jam 350g',
    nameAr: 'مربى الورد الدمشقي 350 جرام',
    slug: 'damascus-rose-jam-350g',
    sku: 'JAM-ROSE-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 87,
    pricing: { basePrice: 220000, discountPrice: 195000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Damascus+Rose+Jam',
        altText: 'Damascus Rose Jam',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Delicate Damascus rose petal jam. A Syrian delicacy perfect for breakfast or desserts.',
      },
      {
        language: 'ar',
        description:
          'مربى بتلات الورد الدمشقي الرقيق. حلوى سورية مثالية للإفطار أو الحلويات.',
      },
    ],
    variants: [
      {
        sku: 'JAM-ROSE-001-350G',
        variantData: { Weight: '350g' },
        price: 195000,
        stocks: [{ warehouseId: 1, quantity: 45 }],
      },
    ],
  },
  {
    nameEn: 'Fig Molasses 500ml',
    nameAr: 'دبس التين 500 مل',
    slug: 'fig-molasses-500ml',
    sku: 'MOLASSES-FIG-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 280000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Fig+Molasses',
        altText: 'Fig Molasses',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Natural fig molasses with no added sugar. Rich source of iron and nutrients.',
      },
      {
        language: 'ar',
        description:
          'دبس التين الطبيعي بدون سكر مضاف. مصدر غني بالحديد والمغذيات.',
      },
    ],
    variants: [
      {
        sku: 'MOLASSES-FIG-001-500ML',
        variantData: { Volume: '500ml' },
        price: 280000,
        stocks: [{ warehouseId: 1, quantity: 32 }],
      },
    ],
  },
  {
    nameEn: 'Pomegranate Molasses 400ml',
    nameAr: 'دبس الرمان 400 مل',
    slug: 'pomegranate-molasses-400ml',
    sku: 'MOLASSES-POM-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 250000, discountPrice: 225000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Pomegranate+Molasses',
        altText: 'Pomegranate Molasses',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Tangy pomegranate molasses essential for Syrian cuisine. Perfect for salads and marinades.',
      },
      {
        language: 'ar',
        description:
          'دبس الرمان الحامض الأساسي للمطبخ السوري. مثالي للسلطات والتتبيلات.',
      },
    ],
    variants: [
      {
        sku: 'MOLASSES-POM-001-400ML',
        variantData: { Volume: '400ml' },
        price: 225000,
        stocks: [{ warehouseId: 1, quantity: 55 }],
      },
    ],
  },
  {
    nameEn: 'Pistachios Roasted & Salted 500g',
    nameAr: 'فستق حلبي محمص ومملح 500 جرام',
    slug: 'pistachios-roasted-salted-500g',
    sku: 'NUT-PISTACHIO-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 83,
    pricing: { basePrice: 1200000, discountPrice: 1100000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Roasted+Pistachios',
        altText: 'Roasted & Salted Pistachios',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Premium Aleppo pistachios roasted and lightly salted. Perfect snack or dessert ingredient.',
      },
      {
        language: 'ar',
        description:
          'فستق حلبي فاخر محمص ومملح قليلاً. وجبة خفيفة مثالية أو مكون للحلويات.',
      },
    ],
    variants: [
      {
        sku: 'NUT-PISTACHIO-001-500G',
        variantData: { Weight: '500g' },
        price: 1100000,
        stocks: [{ warehouseId: 1, quantity: 15 }],
      },
    ],
  },
  {
    nameEn: 'Pine Nuts 250g',
    nameAr: 'صنوبر 250 جرام',
    slug: 'pine-nuts-250g',
    sku: 'NUT-PINE-001',
    categoryId: 4,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 1500000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Pine+Nuts',
        altText: 'Pine Nuts',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Premium Syrian pine nuts essential for traditional dishes like kibbeh and rice pilaf.',
      },
      {
        language: 'ar',
        description:
          'صنوبر سوري فاخر أساسي للأطباق التقليدية مثل الكبة والأرز بالشعيرية.',
      },
    ],
    variants: [
      {
        sku: 'NUT-PINE-001-250G',
        variantData: { Weight: '250g' },
        price: 1500000,
        stocks: [{ warehouseId: 1, quantity: 8 }],
      },
    ],
  },

  // ============================================================================
  // CATEGORY 5: TRADITIONAL CRAFTS (10 products)
  // ============================================================================
  {
    nameEn: 'Mosaic Decorative Box Medium',
    nameAr: 'صندوق زخرفي فسيفساء متوسط',
    slug: 'mosaic-decorative-box-medium',
    sku: 'CRAFT-BOX-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 78,
    pricing: { basePrice: 450000, discountPrice: 400000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Mosaic+Decorative+Box',
        altText: 'Mosaic Decorative Box',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Handcrafted wooden box with traditional Syrian mother-of-pearl mosaic inlay.',
      },
      {
        language: 'ar',
        description: 'صندوق خشبي مصنوع يدويًا بطعم صدف تقليدي سوري.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-BOX-001-MED',
        variantData: { Size: 'Medium' },
        price: 400000,
        stocks: [{ warehouseId: 1, quantity: 12 }],
      },
    ],
  },
  {
    nameEn: 'Copper Coffee Pot Dallah 1L',
    nameAr: 'دلة قهوة نحاسية 1 لتر',
    slug: 'copper-coffee-pot-dallah-1l',
    sku: 'CRAFT-DALLAH-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 380000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Copper+Coffee+Pot',
        altText: 'Copper Coffee Pot Dallah',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Traditional hand-hammered copper dallah for Arabic coffee. Decorative and functional.',
      },
      {
        language: 'ar',
        description: 'دلة نحاسية مطروقة يدويًا للقهوة العربية. زخرفية وعملية.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-DALLAH-001-1L',
        variantData: { Capacity: '1 Liter' },
        price: 380000,
        stocks: [{ warehouseId: 1, quantity: 18 }],
      },
    ],
  },
  {
    nameEn: 'Brass Incense Burner Mabkhara',
    nameAr: 'مبخرة نحاسية',
    slug: 'brass-incense-burner-mabkhara',
    sku: 'CRAFT-MABKHARA-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 280000, discountPrice: 250000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Brass+Incense+Burner',
        altText: 'Brass Incense Burner',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Ornate brass mabkhara for burning bakhoor incense. Traditional Syrian design.',
      },
      {
        language: 'ar',
        description: 'مبخرة نحاسية مزخرفة لحرق البخور. تصميم سوري تقليدي.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-MABKHARA-001-STD',
        variantData: { Size: 'Standard' },
        price: 250000,
        stocks: [{ warehouseId: 1, quantity: 22 }],
      },
    ],
  },
  {
    nameEn: 'Hand-painted Ceramic Bowl 25cm',
    nameAr: 'طبق سيراميك مرسوم يدويًا 25 سم',
    slug: 'hand-painted-ceramic-bowl-25cm',
    sku: 'CRAFT-BOWL-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 320000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Ceramic+Bowl',
        altText: 'Hand-painted Ceramic Bowl',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Hand-painted ceramic bowl with traditional Damascus patterns. Food-safe glaze.',
      },
      {
        language: 'ar',
        description:
          'طبق سيراميك مرسوم يدويًا بأنماط دمشقية تقليدية. طلاء آمن للطعام.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-BOWL-001-25CM',
        variantData: { Size: '25cm' },
        price: 320000,
        stocks: [{ warehouseId: 1, quantity: 15 }],
      },
    ],
  },
  {
    nameEn: 'Olive Wood Salad Servers Set',
    nameAr: 'طقم ملاعق سلطة خشب الزيتون',
    slug: 'olive-wood-salad-servers-set',
    sku: 'CRAFT-SALAD-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 180000, discountPrice: 160000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Olive+Wood+Salad+Servers',
        altText: 'Olive Wood Salad Servers',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Handcrafted salad servers from Syrian olive wood. Beautiful grain patterns.',
      },
      {
        language: 'ar',
        description:
          'ملاعق سلطة مصنوعة يدويًا من خشب الزيتون السوري. أنماط حبيبات جميلة.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-SALAD-001-SET',
        variantData: { Pieces: '2 Pieces' },
        price: 160000,
        stocks: [{ warehouseId: 1, quantity: 28 }],
      },
    ],
  },
  {
    nameEn: 'Carved Wooden Mirror Frame 60cm',
    nameAr: 'إطار مرآة خشبي منحوت 60 سم',
    slug: 'carved-wooden-mirror-frame-60cm',
    sku: 'CRAFT-MIRROR-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 72,
    pricing: { basePrice: 850000, discountPrice: 780000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Carved+Mirror+Frame',
        altText: 'Carved Wooden Mirror Frame',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Ornate hand-carved walnut wood mirror frame with Islamic geometric patterns.',
      },
      {
        language: 'ar',
        description:
          'إطار مرآة خشب الجوز المنحوت يدويًا بأنماط هندسية إسلامية.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-MIRROR-001-60CM',
        variantData: { Size: '60cm' },
        price: 780000,
        stocks: [{ warehouseId: 1, quantity: 5 }],
      },
    ],
  },
  {
    nameEn: 'Inlaid Backgammon Board Large',
    nameAr: 'لوح الطاولة المطعم كبير',
    slug: 'inlaid-backgammon-board-large',
    sku: 'CRAFT-BACKGAMMON-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 1200000, discountPrice: 1050000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Inlaid+Backgammon+Board',
        altText: 'Inlaid Backgammon Board',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Luxury backgammon board with mother-of-pearl and wood inlay. Includes pieces and dice.',
      },
      {
        language: 'ar',
        description: 'لوح طاولة فاخر مطعم بالصدف والخشب. يشمل القطع والنرد.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-BACKGAMMON-001-L',
        variantData: { Size: 'Large' },
        price: 1050000,
        stocks: [{ warehouseId: 1, quantity: 3 }],
      },
    ],
  },
  {
    nameEn: 'Brass Mortar and Pestle Set',
    nameAr: 'مدق وهاون نحاسي',
    slug: 'brass-mortar-pestle-set',
    sku: 'CRAFT-MORTAR-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 420000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Brass+Mortar+Pestle',
        altText: 'Brass Mortar and Pestle',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Heavy-duty brass mortar and pestle for grinding spices. Traditional Syrian kitchen tool.',
      },
      {
        language: 'ar',
        description:
          'مدق وهاون نحاسي للخدمة الشاقة لطحن التوابل. أداة مطبخ سورية تقليدية.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-MORTAR-001-MED',
        variantData: { Size: 'Medium' },
        price: 420000,
        stocks: [{ warehouseId: 1, quantity: 14 }],
      },
    ],
  },
  {
    nameEn: 'Hand-woven Palm Basket',
    nameAr: 'سلة خوص منسوجة يدويًا',
    slug: 'hand-woven-palm-basket',
    sku: 'CRAFT-BASKET-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 150000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Hand-woven+Palm+Basket',
        altText: 'Hand-woven Palm Basket',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Traditional Syrian palm leaf basket handwoven by local artisans. Eco-friendly storage.',
      },
      {
        language: 'ar',
        description:
          'سلة خوص سورية تقليدية منسوجة يدويًا من قبل الحرفيين المحليين. تخزين صديق للبيئة.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-BASKET-001-MED',
        variantData: { Size: 'Medium' },
        price: 150000,
        stocks: [{ warehouseId: 1, quantity: 35 }],
      },
    ],
  },
  {
    nameEn: 'Ceramic Olive Oil Dispenser',
    nameAr: 'موزع زيت زيتون سيراميك',
    slug: 'ceramic-olive-oil-dispenser',
    sku: 'CRAFT-DISPENSER-001',
    categoryId: 5,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 220000, discountPrice: 195000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Ceramic+Oil+Dispenser',
        altText: 'Ceramic Olive Oil Dispenser',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Hand-painted ceramic olive oil dispenser with traditional Damascus rose motif.',
      },
      {
        language: 'ar',
        description:
          'موزع زيت زيتون سيراميك مرسوم يدويًا بزخرفة الورد الدمشقي التقليدية.',
      },
    ],
    variants: [
      {
        sku: 'CRAFT-DISPENSER-001-500ML',
        variantData: { Capacity: '500ml' },
        price: 195000,
        stocks: [{ warehouseId: 1, quantity: 20 }],
      },
    ],
  },

  // ============================================================================
  // CATEGORY 6: JEWELRY (8 products)
  // ============================================================================
  {
    nameEn: 'Sterling Silver Filigree Bracelet',
    nameAr: 'سوار فضة استرليني مشغول',
    slug: 'sterling-silver-filigree-bracelet',
    sku: 'JEWELRY-BRACELET-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: true,
    featuredPriority: 82,
    pricing: { basePrice: 850000, discountPrice: 780000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Silver+Filigree+Bracelet',
        altText: 'Sterling Silver Filigree Bracelet',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Handcrafted sterling silver bracelet with traditional Syrian filigree work.',
      },
      {
        language: 'ar',
        description:
          'سوار فضة استرليني مصنوع يدويًا بالأشغال السورية التقليدية.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-BRACELET-001-S',
        variantData: { Size: 'Small' },
        price: 780000,
        stocks: [{ warehouseId: 1, quantity: 8 }],
      },
      {
        sku: 'JEWELRY-BRACELET-001-M',
        variantData: { Size: 'Medium' },
        price: 780000,
        stocks: [{ warehouseId: 1, quantity: 12 }],
      },
    ],
  },
  {
    nameEn: 'Gold Plated Necklace with Pendant',
    nameAr: 'قلادة مطلية بالذهب مع دلاية',
    slug: 'gold-plated-necklace-pendant',
    sku: 'JEWELRY-NECKLACE-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 950000, discountPrice: 850000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Gold+Plated+Necklace',
        altText: 'Gold Plated Necklace',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Elegant gold-plated necklace with Damascus rose pendant. Perfect gift for special occasions.',
      },
      {
        language: 'ar',
        description:
          'قلادة أنيقة مطلية بالذهب مع دلاية الورد الدمشقي. هدية مثالية للمناسبات الخاصة.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-NECKLACE-001-45CM',
        variantData: { Length: '45cm' },
        price: 850000,
        stocks: [{ warehouseId: 1, quantity: 10 }],
      },
    ],
  },
  {
    nameEn: 'Silver Ring with Blue Stone',
    nameAr: 'خاتم فضة مع حجر أزرق',
    slug: 'silver-ring-blue-stone',
    sku: 'JEWELRY-RING-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 420000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Silver+Ring+Blue+Stone',
        altText: 'Silver Ring with Blue Stone',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Sterling silver ring with natural turquoise stone. Traditional Syrian design.',
      },
      {
        language: 'ar',
        description:
          'خاتم فضة استرليني مع حجر الفيروز الطبيعي. تصميم سوري تقليدي.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-RING-001-7',
        variantData: { Size: '7' },
        price: 420000,
        stocks: [{ warehouseId: 1, quantity: 5 }],
      },
      {
        sku: 'JEWELRY-RING-001-8',
        variantData: { Size: '8' },
        price: 420000,
        stocks: [{ warehouseId: 1, quantity: 7 }],
      },
      {
        sku: 'JEWELRY-RING-001-9',
        variantData: { Size: '9' },
        price: 420000,
        stocks: [{ warehouseId: 1, quantity: 4 }],
      },
    ],
  },
  {
    nameEn: 'Pearl Drop Earrings',
    nameAr: 'أقراط لؤلؤ متدلية',
    slug: 'pearl-drop-earrings',
    sku: 'JEWELRY-EARRINGS-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 520000, discountPrice: 470000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Pearl+Drop+Earrings',
        altText: 'Pearl Drop Earrings',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Elegant pearl drop earrings with sterling silver hooks. Perfect for formal events.',
      },
      {
        language: 'ar',
        description:
          'أقراط لؤلؤ متدلية أنيقة مع خطافات فضة استرليني. مثالية للمناسبات الرسمية.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-EARRINGS-001-WHITE',
        variantData: { Color: 'White Pearl' },
        price: 470000,
        stocks: [{ warehouseId: 1, quantity: 14 }],
      },
    ],
  },
  {
    nameEn: 'Engraved Silver Cufflinks',
    nameAr: 'أزرار أكمام فضية منقوشة',
    slug: 'engraved-silver-cufflinks',
    sku: 'JEWELRY-CUFFLINKS-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 680000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Engraved+Silver+Cufflinks',
        altText: 'Engraved Silver Cufflinks',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Sterling silver cufflinks with traditional Arabic calligraphy engraving.',
      },
      {
        language: 'ar',
        description:
          'أزرار أكمام من الفضة الاسترلينية منقوشة بالخط العربي التقليدي.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-CUFFLINKS-001-ROUND',
        variantData: { Shape: 'Round' },
        price: 680000,
        stocks: [{ warehouseId: 1, quantity: 9 }],
      },
    ],
  },
  {
    nameEn: 'Amber Bead Necklace',
    nameAr: 'قلادة خرز العنبر',
    slug: 'amber-bead-necklace',
    sku: 'JEWELRY-AMBER-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 1200000, discountPrice: 1080000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Amber+Bead+Necklace',
        altText: 'Amber Bead Necklace',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Natural amber bead necklace. Traditional Syrian jewelry with warm golden tones.',
      },
      {
        language: 'ar',
        description:
          'قلادة خرز العنبر الطبيعي. مجوهرات سورية تقليدية بنغمات ذهبية دافئة.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-AMBER-001-60CM',
        variantData: { Length: '60cm' },
        price: 1080000,
        stocks: [{ warehouseId: 1, quantity: 3 }],
      },
    ],
  },
  {
    nameEn: 'Silver Anklet Chain',
    nameAr: 'سلسلة خلخال فضية',
    slug: 'silver-anklet-chain',
    sku: 'JEWELRY-ANKLET-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 350000, discountPrice: 315000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Silver+Anklet+Chain',
        altText: 'Silver Anklet Chain',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Delicate sterling silver anklet with small bell charms. Traditional Syrian style.',
      },
      {
        language: 'ar',
        description:
          'خلخال فضة استرليني رقيق مع دلايات جرس صغيرة. أسلوب سوري تقليدي.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-ANKLET-001-23CM',
        variantData: { Length: '23cm' },
        price: 315000,
        stocks: [{ warehouseId: 1, quantity: 16 }],
      },
    ],
  },
  {
    nameEn: 'Turquoise Stone Brooch',
    nameAr: 'بروش حجر الفيروز',
    slug: 'turquoise-stone-brooch',
    sku: 'JEWELRY-BROOCH-001',
    categoryId: 6,
    manufacturerId: null,
    currency: 'SYP',
    status: 'published',
    approvalStatus: 'approved',
    isActive: true,
    isPublished: true,
    isFeatured: false,
    pricing: { basePrice: 580000, isActive: true },
    images: [
      {
        imageUrl: 'https://placehold.co/600x400?text=Turquoise+Stone+Brooch',
        altText: 'Turquoise Stone Brooch',
        sortOrder: 1,
      },
    ],
    descriptions: [
      {
        language: 'en',
        description:
          'Vintage-style silver brooch with natural turquoise stone. Perfect for shawls and scarves.',
      },
      {
        language: 'ar',
        description:
          'بروش فضي بأسلوب عتيق مع حجر الفيروز الطبيعي. مثالي للشالات والأوشحة.',
      },
    ],
    variants: [
      {
        sku: 'JEWELRY-BROOCH-001-FLOWER',
        variantData: { Design: 'Flower' },
        price: 580000,
        stocks: [{ warehouseId: 1, quantity: 7 }],
      },
    ],
  },
];

/**
 * Category Themes Configuration
 *
 * Defines visual themes for 12 Syrian marketplace product categories
 * Each category has unique color palette, icons, and cultural context
 *
 * @fileoverview Category-specific design themes for Syrian marketplace
 * @description Visual themes and cultural data for all product categories
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryTheme:
 *       type: object
 *       description: Visual theme and metadata for a product category
 *       required: [id, nameEn, nameAr, slug, colors, icons]
 *       properties:
 *         id:
 *           type: string
 *           description: Unique category identifier
 *         nameEn:
 *           type: string
 *           description: Category name in English
 *         nameAr:
 *           type: string
 *           description: Category name in Arabic
 *         slug:
 *           type: string
 *           description: URL-friendly category slug
 *         colors:
 *           $ref: '#/components/schemas/CategoryColors'
 *         icons:
 *           $ref: '#/components/schemas/CategoryIcons'
 */

import { syrianColors } from './syrian-colors.config';

/**
 * Category theme interface
 * Defines complete visual and contextual theme for a category
 */
export interface CategoryTheme {
  /** Unique category identifier */
  id: string;

  /** Category name in English */
  nameEn: string;

  /** Category name in Arabic */
  nameAr: string;

  /** URL-friendly slug */
  slug: string;

  /** Color palette for this category */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    cardBorder: string;
  };

  /** Icons for category representation */
  icons: {
    main: string;
    badge?: string;
    feature?: string;
  };

  /** Cultural and heritage information */
  heritage: {
    isTraditional: boolean;
    unescoRecognized: boolean;
    historicalSignificance: string;
    culturalContext: string;
  };

  /** Popular regions for this category */
  popularRegions: string[];

  /** Typical price range */
  priceRange: {
    min: number;
    max: number;
    currency: 'USD';
  };

  /** Common badges for this category */
  commonBadges: string[];

  /** SEO keywords */
  keywords: string[];
}

/**
 * Damascus Steel Category Theme
 * Traditional weaponry and cutlery with historical significance
 */
export const damascusSteelTheme: CategoryTheme = {
  id: 'damascus-steel',
  nameEn: 'Damascus Steel',
  nameAr: 'الفولاذ الدمشقي',
  slug: 'damascus-steel',
  colors: {
    primary: syrianColors.palettes.neutral[700],
    secondary: syrianColors.navy.DEFAULT,
    accent: syrianColors.palettes.gold[500],
    background: syrianColors.palettes.neutral[50],
    cardBorder: syrianColors.palettes.neutral[300]
  },
  icons: {
    main: 'cut',
    badge: 'verified',
    feature: 'star'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: true,
    historicalSignificance: 'Ancient metalworking technique dating back to 300 BC',
    culturalContext: 'Damascus steel is renowned worldwide for its distinctive watered pattern and legendary sharpness'
  },
  popularRegions: ['Damascus', 'Aleppo'],
  priceRange: {
    min: 50,
    max: 500,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'unesco', 'artisan', 'verified'],
  keywords: ['damascus', 'steel', 'knife', 'sword', 'blade', 'artisan', 'traditional']
};

/**
 * Aleppo Soap Category Theme
 * Traditional laurel and olive oil soap with therapeutic properties
 */
export const aleppoSoapTheme: CategoryTheme = {
  id: 'aleppo-soap',
  nameEn: 'Aleppo Soap & Beauty',
  nameAr: 'صابون حلب والجمال',
  slug: 'beauty-wellness',
  colors: {
    primary: syrianColors.palettes.forest[500],
    secondary: syrianColors.palettes.cream[400],
    accent: syrianColors.palettes.goldenWheat[500],
    background: syrianColors.palettes.cream[50],
    cardBorder: syrianColors.palettes.forest[200]
  },
  icons: {
    main: 'soap',
    badge: 'eco',
    feature: 'spa'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Traditional soap-making dating back over 3,000 years',
    culturalContext: 'Aleppo soap is one of the oldest soap varieties, made with laurel oil and olive oil'
  },
  popularRegions: ['Aleppo', 'Idlib'],
  priceRange: {
    min: 5,
    max: 50,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'artisan', 'organic', 'handmade'],
  keywords: ['aleppo', 'soap', 'laurel', 'olive', 'natural', 'beauty', 'traditional']
};

/**
 * Textiles & Fabrics Category Theme
 * Syrian brocade, damask, and traditional weavings
 */
export const textilesTheme: CategoryTheme = {
  id: 'textiles-fabrics',
  nameEn: 'Textiles & Fabrics',
  nameAr: 'المنسوجات والأقمشة',
  slug: 'textiles-fabrics',
  colors: {
    primary: syrianColors.palettes.accent[600],
    secondary: syrianColors.palettes.gold[400],
    accent: syrianColors.palettes.cream[500],
    background: syrianColors.palettes.cream[50],
    cardBorder: syrianColors.palettes.accent[200]
  },
  icons: {
    main: 'texture',
    badge: 'auto_awesome',
    feature: 'checkroom'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: true,
    historicalSignificance: 'Syrian silk and brocade weaving tradition spanning centuries',
    culturalContext: 'Damascus brocade and silk textiles were highly prized on the ancient Silk Road'
  },
  popularRegions: ['Damascus', 'Aleppo', 'Hama'],
  priceRange: {
    min: 20,
    max: 300,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'unesco', 'artisan', 'handwoven'],
  keywords: ['textile', 'fabric', 'brocade', 'damask', 'silk', 'weaving', 'traditional']
};

/**
 * Food & Spices Category Theme
 * Traditional Syrian spices, herbs, and food products
 */
export const foodSpicesTheme: CategoryTheme = {
  id: 'food-spices',
  nameEn: 'Food & Spices',
  nameAr: 'الأطعمة والتوابل',
  slug: 'food-spices',
  colors: {
    primary: syrianColors.palettes.accent[500],
    secondary: syrianColors.palettes.goldenWheat[600],
    accent: syrianColors.palettes.warmGray[700],
    background: syrianColors.palettes.warmGray[50],
    cardBorder: syrianColors.palettes.goldenWheat[300]
  },
  icons: {
    main: 'restaurant',
    badge: 'local_dining',
    feature: 'coffee'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Syrian cuisine and spice blends perfected over millennia',
    culturalContext: 'Syrian spices and za\'atar are essential to Middle Eastern cooking traditions'
  },
  popularRegions: ['Damascus', 'Aleppo', 'Homs', 'Latakia'],
  priceRange: {
    min: 5,
    max: 100,
    currency: 'USD'
  },
  commonBadges: ['organic', 'artisan', 'bestseller', 'traditional'],
  keywords: ['spice', 'zaatar', 'sumac', 'food', 'herbs', 'traditional', 'syrian']
};

/**
 * Jewelry & Accessories Category Theme
 * Traditional Syrian gold and silver jewelry
 */
export const jewelryTheme: CategoryTheme = {
  id: 'jewelry-accessories',
  nameEn: 'Jewelry & Accessories',
  nameAr: 'المجوهرات والإكسسوارات',
  slug: 'jewelry-accessories',
  colors: {
    primary: syrianColors.palettes.gold[500],
    secondary: syrianColors.flag.red.DEFAULT,
    accent: syrianColors.palettes.neutral[900],
    background: syrianColors.palettes.neutral[50],
    cardBorder: syrianColors.palettes.gold[200]
  },
  icons: {
    main: 'diamond',
    badge: 'workspace_premium',
    feature: 'stars'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Syrian goldsmithing and jewelry-making heritage',
    culturalContext: 'Syrian jewelry features intricate filigree work and traditional designs'
  },
  popularRegions: ['Damascus', 'Aleppo'],
  priceRange: {
    min: 30,
    max: 1000,
    currency: 'USD'
  },
  commonBadges: ['artisan', 'verified', 'premium', 'handcrafted'],
  keywords: ['jewelry', 'gold', 'silver', 'necklace', 'bracelet', 'filigree', 'traditional']
};

/**
 * Traditional Crafts Category Theme
 * Woodwork, mosaic, and various handicrafts
 */
export const traditionalCraftsTheme: CategoryTheme = {
  id: 'traditional-crafts',
  nameEn: 'Traditional Crafts',
  nameAr: 'الحرف التقليدية',
  slug: 'traditional-crafts',
  colors: {
    primary: syrianColors.palettes.goldenWheat[500],
    secondary: syrianColors.palettes.cream[600],
    accent: syrianColors.palettes.forest[700],
    background: syrianColors.palettes.cream[50],
    cardBorder: syrianColors.palettes.goldenWheat[300]
  },
  icons: {
    main: 'handyman',
    badge: 'verified',
    feature: 'palette'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: true,
    historicalSignificance: 'Centuries-old Syrian handicraft traditions',
    culturalContext: 'Syrian crafts include mosaic work, inlay, and traditional carpentry'
  },
  popularRegions: ['Damascus', 'Aleppo', 'Hama'],
  priceRange: {
    min: 25,
    max: 500,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'artisan', 'handmade', 'unesco'],
  keywords: ['craft', 'handmade', 'woodwork', 'mosaic', 'inlay', 'traditional', 'artisan']
};

/**
 * Ceramics & Pottery Category Theme
 * Traditional Syrian pottery and ceramics
 */
export const ceramicsTheme: CategoryTheme = {
  id: 'ceramics-pottery',
  nameEn: 'Ceramics & Pottery',
  nameAr: 'الخزف والفخار',
  slug: 'ceramics-pottery',
  colors: {
    primary: syrianColors.palettes.cream[500],
    secondary: syrianColors.palettes.goldenWheat[600],
    accent: syrianColors.palettes.accent[600],
    background: syrianColors.palettes.warmGray[50],
    cardBorder: syrianColors.palettes.cream[300]
  },
  icons: {
    main: 'potter_wheel',
    badge: 'handshake',
    feature: 'cleaning_services'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Ancient pottery-making techniques preserved through generations',
    culturalContext: 'Syrian ceramics feature distinctive glazes and traditional patterns'
  },
  popularRegions: ['Damascus', 'Aleppo', 'Homs'],
  priceRange: {
    min: 15,
    max: 200,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'artisan', 'handmade', 'traditional'],
  keywords: ['ceramic', 'pottery', 'clay', 'handmade', 'traditional', 'artisan', 'glaze']
};

/**
 * Oud & Perfumes Category Theme
 * Traditional Syrian perfumes and incense
 */
export const oudPerfumesTheme: CategoryTheme = {
  id: 'oud-perfumes',
  nameEn: 'Oud & Perfumes',
  nameAr: 'العود والعطور',
  slug: 'oud-perfumes',
  colors: {
    primary: syrianColors.palettes.neutral[800],
    secondary: syrianColors.palettes.gold[600],
    accent: syrianColors.palettes.accent[700],
    background: syrianColors.palettes.neutral[50],
    cardBorder: syrianColors.palettes.neutral[300]
  },
  icons: {
    main: 'local_florist',
    badge: 'autograph',
    feature: 'fragrance'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Traditional Syrian perfumery and incense-making',
    culturalContext: 'Syrian oud and perfumes are renowned for their quality and distinctive scents'
  },
  popularRegions: ['Damascus', 'Aleppo'],
  priceRange: {
    min: 20,
    max: 300,
    currency: 'USD'
  },
  commonBadges: ['premium', 'artisan', 'traditional', 'verified'],
  keywords: ['oud', 'perfume', 'incense', 'fragrance', 'traditional', 'luxury', 'scent']
};

/**
 * Nuts & Snacks Category Theme
 * Syrian pistachios, almonds, and traditional snacks
 */
export const nutsSnacksTheme: CategoryTheme = {
  id: 'nuts-snacks',
  nameEn: 'Nuts & Snacks',
  nameAr: 'المكسرات والوجبات الخفيفة',
  slug: 'nuts-snacks',
  colors: {
    primary: syrianColors.palettes.goldenWheat[600],
    secondary: syrianColors.palettes.cream[700],
    accent: syrianColors.palettes.forest[500],
    background: syrianColors.palettes.cream[50],
    cardBorder: syrianColors.palettes.goldenWheat[300]
  },
  icons: {
    main: 'grocery',
    badge: 'nutrition',
    feature: 'local_cafe'
  },
  heritage: {
    isTraditional: false,
    unescoRecognized: false,
    historicalSignificance: 'Syrian region renowned for premium nuts and dried fruits',
    culturalContext: 'Aleppo pistachios and Syrian almonds are prized for their superior quality'
  },
  popularRegions: ['Aleppo', 'Idlib', 'Latakia'],
  priceRange: {
    min: 10,
    max: 80,
    currency: 'USD'
  },
  commonBadges: ['organic', 'bestseller', 'premium', 'fresh'],
  keywords: ['nuts', 'pistachio', 'almond', 'snacks', 'dried fruit', 'organic', 'aleppo']
};

/**
 * Sweets & Desserts Category Theme
 * Traditional Syrian baklava, ma'amoul, and sweets
 */
export const sweetsDessertsTheme: CategoryTheme = {
  id: 'sweets-desserts',
  nameEn: 'Sweets & Desserts',
  nameAr: 'الحلويات',
  slug: 'sweets-desserts',
  colors: {
    primary: syrianColors.palettes.accent[400],
    secondary: syrianColors.palettes.gold[300],
    accent: syrianColors.palettes.cream[500],
    background: syrianColors.palettes.accent[50],
    cardBorder: syrianColors.palettes.accent[200]
  },
  icons: {
    main: 'cake',
    badge: 'favorite',
    feature: 'celebration'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Syrian sweet-making tradition passed down through generations',
    culturalContext: 'Syrian sweets like baklava and ma\'amoul are celebrated throughout the Middle East'
  },
  popularRegions: ['Damascus', 'Aleppo', 'Hama'],
  priceRange: {
    min: 15,
    max: 100,
    currency: 'USD'
  },
  commonBadges: ['artisan', 'traditional', 'bestseller', 'gift'],
  keywords: ['sweets', 'baklava', 'maamoul', 'dessert', 'traditional', 'syrian', 'gift']
};

/**
 * Musical Instruments Category Theme
 * Traditional Syrian oud, qanun, and percussion
 */
export const musicalInstrumentsTheme: CategoryTheme = {
  id: 'musical-instruments',
  nameEn: 'Musical Instruments',
  nameAr: 'الآلات الموسيقية',
  slug: 'musical-instruments',
  colors: {
    primary: syrianColors.palettes.goldenWheat[700],
    secondary: syrianColors.palettes.neutral[700],
    accent: syrianColors.palettes.gold[600],
    background: syrianColors.palettes.warmGray[50],
    cardBorder: syrianColors.palettes.goldenWheat[300]
  },
  icons: {
    main: 'music_note',
    badge: 'piano',
    feature: 'library_music'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: false,
    historicalSignificance: 'Traditional Syrian instrument-making craftsmanship',
    culturalContext: 'Syrian ouds and qanuns are prized by musicians worldwide'
  },
  popularRegions: ['Damascus', 'Aleppo'],
  priceRange: {
    min: 200,
    max: 2000,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'artisan', 'premium', 'handcrafted'],
  keywords: ['music', 'oud', 'qanun', 'darbuka', 'instrument', 'traditional', 'handmade']
};

/**
 * Calligraphy & Art Category Theme
 * Traditional Arabic calligraphy and Syrian art
 */
export const calligraphyArtTheme: CategoryTheme = {
  id: 'calligraphy-art',
  nameEn: 'Calligraphy & Art',
  nameAr: 'الخط والفن',
  slug: 'calligraphy-art',
  colors: {
    primary: syrianColors.palettes.neutral[900],
    secondary: syrianColors.palettes.gold[500],
    accent: syrianColors.palettes.cream[300],
    background: syrianColors.palettes.neutral[50],
    cardBorder: syrianColors.palettes.neutral[200]
  },
  icons: {
    main: 'brush',
    badge: 'draw',
    feature: 'color_lens'
  },
  heritage: {
    isTraditional: true,
    unescoRecognized: true,
    historicalSignificance: 'Arabic calligraphy tradition spanning over 1,400 years',
    culturalContext: 'Syrian calligraphers are masters of traditional Arabic scripts'
  },
  popularRegions: ['Damascus', 'Aleppo'],
  priceRange: {
    min: 30,
    max: 500,
    currency: 'USD'
  },
  commonBadges: ['heritage', 'artisan', 'unesco', 'handmade'],
  keywords: ['calligraphy', 'art', 'arabic', 'script', 'painting', 'traditional', 'handmade']
};

/**
 * Category themes collection
 * Aggregates all category themes for easy access
 */
export const categoryThemes: Record<string, CategoryTheme> = {
  'damascus-steel': damascusSteelTheme,
  'beauty-wellness': aleppoSoapTheme,
  'textiles-fabrics': textilesTheme,
  'food-spices': foodSpicesTheme,
  'jewelry-accessories': jewelryTheme,
  'traditional-crafts': traditionalCraftsTheme,
  'ceramics-pottery': ceramicsTheme,
  'oud-perfumes': oudPerfumesTheme,
  'nuts-snacks': nutsSnacksTheme,
  'sweets-desserts': sweetsDessertsTheme,
  'musical-instruments': musicalInstrumentsTheme,
  'calligraphy-art': calligraphyArtTheme
};

/**
 * Category slugs array for iteration
 */
export const categorySlugs = Object.keys(categoryThemes);

/**
 * Get category theme by slug
 * @param slug - Category slug
 * @returns Category theme or undefined if not found
 */
export function getCategoryTheme(slug: string): CategoryTheme | undefined {
  return categoryThemes[slug];
}

/**
 * Get all category themes as array
 * @returns Array of all category themes
 */
export function getAllCategoryThemes(): CategoryTheme[] {
  return Object.values(categoryThemes);
}

/**
 * Export default configuration
 */
export default categoryThemes;

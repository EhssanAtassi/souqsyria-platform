/**
 * Hero Banners Configuration
 *
 * @description Configuration for hero slider banners and promotional offers on homepage
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting all
 * configurations from components into dedicated config files.
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroSliderImage:
 *       type: object
 *       properties:
 *         src:
 *           type: string
 *           description: Image source path
 *         alt:
 *           type: string
 *           description: Image alt text for accessibility
 *         link:
 *           type: string
 *           description: Navigation link when banner is clicked
 *     HeroOfferBanner:
 *       type: object
 *       properties:
 *         src:
 *           type: string
 *           description: Banner image source
 *         alt:
 *           type: string
 *           description: Banner alt text
 *         link:
 *           type: string
 *           description: Target URL for banner click
 *         titleAr:
 *           type: string
 *           description: Banner title in Arabic
 *         titleEn:
 *           type: string
 *           description: Banner title in English
 */

/**
 * Hero slider image configuration interface
 * @description Type-safe configuration for hero slider images
 */
export interface HeroSliderImageConfig {
  /** Image source path */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Navigation link on click */
  link: string;
}

/**
 * Hero offer banner configuration interface
 * @description Type-safe configuration for dual panel offer banners with bilingual support
 */
export interface HeroOfferBannerConfig {
  /** Banner image source path */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Target URL for navigation */
  link: string;
  /** Banner title in Arabic */
  titleAr: string;
  /** Banner title in English */
  titleEn: string;
}

/**
 * Hero slider images configuration
 *
 * @description Legacy hero slider images for Syrian marketplace homepage
 * @deprecated Use HERO_OFFER_BANNERS_CONFIG with hero dual panel component instead
 *
 * @remarks
 * - Maintained for backward compatibility
 * - Will be removed in future versions
 * - New implementations should use hero dual panel with offer banners
 */
export const HERO_SLIDER_IMAGES_CONFIG: readonly HeroSliderImageConfig[] = [
  {
    src: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
    alt: 'Damascus Steel Heritage Collection',
    link: '/category/damascus-steel'
  },
  {
    src: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
    alt: 'Premium Aleppo Soap Collection',
    link: '/category/beauty-wellness'
  },
  {
    src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
    alt: 'Syrian Textiles and Fabrics',
    link: '/category/textiles-fabrics'
  },
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
    alt: 'Syrian Spices and Traditional Blends',
    link: '/category/food-spices'
  },
  {
    src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&q=80',
    alt: 'Syrian Traditional Crafts',
    link: '/category/traditional-crafts'
  }
] as const;

/**
 * Hero dual panel offer banners configuration
 *
 * @description Promotional banners for hero dual panel component with bilingual support
 * These banners showcase Syrian marketplace promotions and cultural offerings with
 * authentic Syrian heritage design and Golden Wheat theme integration.
 *
 * @remarks
 * - Displayed in hero dual panel rotating carousel
 * - Bilingual titles (Arabic/English) for accessibility
 * - Images optimized for 1200x600px display
 * - Links to key marketplace sections and campaigns
 *
 * @example
 * ```typescript
 * // In component:
 * import { HERO_OFFER_BANNERS_CONFIG } from './config/hero-banners.config';
 *
 * getHeroDualPanelOfferBanners(): HeroOfferBannerConfig[] {
 *   return [...HERO_OFFER_BANNERS_CONFIG];
 * }
 * ```
 */
export const HERO_OFFER_BANNERS_CONFIG: readonly HeroOfferBannerConfig[] = [
  {
    src: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&h=400&fit=crop&q=80',
    alt: 'Damascus Steel Heritage Collection',
    link: '/category/damascus-steel',
    titleAr: 'خصم 30% على الصناعات الدمشقية',
    titleEn: '30% OFF Damascus Crafts'
  },
  {
    src: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=400&fit=crop&q=80',
    alt: 'Ramadan Special Offers',
    link: '/campaigns/ramadan-offers',
    titleAr: 'عروض رمضان المباركة',
    titleEn: 'Blessed Ramadan Offers'
  },
  {
    src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop&q=80',
    alt: 'Authentic Aleppo Products',
    link: '/category/aleppo-specialties',
    titleAr: 'منتجات حلب الأصيلة',
    titleEn: 'Authentic Aleppo Products'
  },
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop&q=80',
    alt: 'Free Delivery Over $100',
    link: '/shipping-info',
    titleAr: 'توصيل مجاني للطلبات فوق 100$',
    titleEn: 'Free Delivery Over $100'
  },
  {
    src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop&q=80',
    alt: 'Discover Syrian Heritage',
    link: '/heritage-collection',
    titleAr: 'اكتشف التراث السوري',
    titleEn: 'Discover Syrian Heritage'
  }
] as const;

/**
 * Helper function to get a hero banner by link
 * @param link - Target link to search for
 * @returns Hero offer banner configuration or undefined if not found
 */
export function getHeroBannerByLink(link: string): HeroOfferBannerConfig | undefined {
  return HERO_OFFER_BANNERS_CONFIG.find(banner => banner.link === link);
}

/**
 * Helper function to get hero banners by category
 * @param categorySlug - Category slug to filter by (extracted from link)
 * @returns Array of hero banners related to the category
 */
export function getHeroBannersByCategory(categorySlug: string): readonly HeroOfferBannerConfig[] {
  return HERO_OFFER_BANNERS_CONFIG.filter(banner =>
    banner.link.includes(`/category/${categorySlug}`)
  );
}

/**
 * Helper function to get campaign banners
 * @returns Array of hero banners that link to campaigns
 */
export function getCampaignBanners(): readonly HeroOfferBannerConfig[] {
  return HERO_OFFER_BANNERS_CONFIG.filter(banner =>
    banner.link.includes('/campaigns/')
  );
}

/**
 * Helper function to shuffle banners for randomized display
 * @param banners - Array of banners to shuffle
 * @returns Shuffled array of banners
 */
export function shuffleHeroBanners(
  banners: readonly HeroOfferBannerConfig[]
): HeroOfferBannerConfig[] {
  const shuffled = [...banners];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

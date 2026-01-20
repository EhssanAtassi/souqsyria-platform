/**
 * Category Showcase Component Interfaces
 *
 * Data models for the homepage category showcase sections inspired by Figma design.
 * These components display promotional banners alongside subcategory grids.
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryShowcaseSection:
 *       type: object
 *       description: A homepage section displaying a category with featured banner and subcategories
 *       required:
 *         - id
 *         - title
 *         - visible
 *         - order
 *         - featuredBanner
 *         - subcategories
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the section
 *           example: "consumer-electronics-showcase"
 *         title:
 *           type: object
 *           description: Section title in multiple languages
 *           properties:
 *             en:
 *               type: string
 *               example: "Consumer Electronics"
 *             ar:
 *               type: string
 *               example: "الإلكترونيات الاستهلاكية"
 *         titleIcon:
 *           type: string
 *           description: Optional Material icon for section title
 *           example: "devices"
 *         visible:
 *           type: boolean
 *           description: Whether section should be displayed on homepage (admin controlled)
 *           example: true
 *         order:
 *           type: number
 *           description: Display order on homepage (lower numbers appear first)
 *           example: 1
 *         featuredBanner:
 *           $ref: '#/components/schemas/FeaturedBanner'
 *         subcategories:
 *           type: array
 *           description: Array of subcategory cards (typically 7 items per Figma design)
 *           items:
 *             $ref: '#/components/schemas/SubcategoryCard'
 *         navigationLinks:
 *           type: object
 *           description: Quick navigation links for the section
 *           properties:
 *             newArrivals:
 *               type: string
 *               example: "/category/electronics/new-arrivals"
 *             bestSeller:
 *               type: string
 *               example: "/category/electronics/best-sellers"
 */

/**
 * CategoryShowcaseSection Interface
 *
 * Represents a complete homepage section with featured banner and subcategory grid.
 * Admin can control visibility and order of sections on the homepage.
 */
export interface CategoryShowcaseSection {
  /** Unique section identifier */
  id: string;

  /** Section title in English and Arabic */
  title: {
    en: string;
    ar: string;
  };

  /** Optional Material icon for section header */
  titleIcon?: string;

  /** Admin-controlled visibility flag */
  visible: boolean;

  /** Display order (lower numbers appear first) */
  order: number;

  /** Featured promotional banner (left side in Figma design) */
  featuredBanner: FeaturedBanner;

  /** Subcategory grid cards (right side, typically 7 items) */
  subcategories: SubcategoryCard[];

  /** Quick navigation links */
  navigationLinks: {
    newArrivals: string;
    bestSeller: string;
  };

  /** Optional background styling */
  backgroundColor?: string;

  /** Created/updated timestamps for admin tracking */
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     FeaturedBanner:
 *       type: object
 *       description: Promotional banner with product image, pricing, and CTA
 *       required:
 *         - id
 *         - title
 *         - imageUrl
 *         - originalPrice
 *         - discountedPrice
 *         - ctaText
 *         - ctaLink
 *       properties:
 *         id:
 *           type: string
 *           example: "marshall-speaker-promo"
 *         title:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               example: "EXPERIENCE GREAT SOUND WITH MARSHALL SPEAKER"
 *             ar:
 *               type: string
 *               example: "استمتع بصوت رائع مع مكبر صوت مارشال"
 *         subtitle:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               example: "Premium portable speaker with classic design"
 *             ar:
 *               type: string
 *               example: "مكبر صوت محمول فاخر بتصميم كلاسيكي"
 *         imageUrl:
 *           type: string
 *           example: "/assets/images/banners/marshall-speaker.jpg"
 *         originalPrice:
 *           type: number
 *           example: 625.00
 *         discountedPrice:
 *           type: number
 *           example: 205.00
 *         currency:
 *           type: string
 *           example: "USD"
 *         ctaText:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               example: "Shop Now"
 *             ar:
 *               type: string
 *               example: "تسوق الآن"
 *         ctaLink:
 *           type: string
 *           example: "/product/marshall-portable-speaker"
 */

/**
 * FeaturedBanner Interface
 *
 * Promotional banner component displaying product with pricing and call-to-action.
 * Left side of the category showcase section in Figma design.
 */
export interface FeaturedBanner {
  /** Banner unique identifier */
  id: string;

  /** Banner title/headline */
  title: {
    en: string;
    ar: string;
  };

  /** Optional subtitle/description */
  subtitle?: {
    en: string;
    ar: string;
  };

  /** Product/banner image URL */
  imageUrl: string;

  /** Original price (before discount) */
  originalPrice: number;

  /** Discounted/sale price */
  discountedPrice: number;

  /** Currency code (USD, SYP, EUR, etc.) */
  currency: string;

  /** Call-to-action button text */
  ctaText: {
    en: string;
    ar: string;
  };

  /** Target link when banner is clicked */
  ctaLink: string;

  /** Optional background color (Golden Wheat default) */
  backgroundColor?: string;

  /** Optional badge/label (e.g., "BEST SELLER", "NEW") */
  badge?: {
    text: { en: string; ar: string };
    color: string;
  };

  /** Display start/end dates for scheduling */
  schedule?: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     SubcategoryCard:
 *       type: object
 *       description: Small category card with icon/image and item count
 *       required:
 *         - id
 *         - name
 *         - itemCount
 *         - route
 *       properties:
 *         id:
 *           type: string
 *           example: "audios-theaters"
 *         name:
 *           type: object
 *           properties:
 *             en:
 *               type: string
 *               example: "Audios & Theaters"
 *             ar:
 *               type: string
 *               example: "الصوتيات والمسارح"
 *         imageUrl:
 *           type: string
 *           example: "/assets/images/categories/audio-systems.jpg"
 *         iconClass:
 *           type: string
 *           example: "speaker"
 *         itemCount:
 *           type: number
 *           example: 2
 *         route:
 *           type: string
 *           example: "/category/electronics/audio"
 */

/**
 * SubcategoryCard Interface
 *
 * Small category card displayed in grid (7 items in Figma design).
 * Shows category icon/image, name, and item count.
 */
export interface SubcategoryCard {
  /** Category unique identifier */
  id: string;

  /** Category name in multiple languages */
  name: {
    en: string;
    ar: string;
  };

  /** Category image/thumbnail URL */
  imageUrl?: string;

  /** Material icon class (alternative to image) */
  iconClass?: string;

  /** Custom icon color (defaults to Golden Wheat) */
  iconColor?: string;

  /** Number of products in this category */
  itemCount: number;

  /** Navigation route when clicked */
  route: string;

  /** Optional discount/badge */
  badge?: {
    text: { en: string; ar: string };
    color: string;
  };

  /** Whether this category is featured */
  featured?: boolean;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     HomepageSectionConfig:
 *       type: object
 *       description: Admin configuration for homepage sections
 *       properties:
 *         sections:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryShowcaseSection'
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *         updatedBy:
 *           type: string
 */

/**
 * HomepageSectionConfig Interface
 *
 * Admin configuration for managing which sections appear on homepage.
 * Loaded from backend API and cached locally.
 */
export interface HomepageSectionConfig {
  /** Array of all configured sections */
  sections: CategoryShowcaseSection[];

  /** Last configuration update timestamp */
  lastUpdated: Date;

  /** Admin user who made last update */
  updatedBy: string;

  /** Optional A/B testing variant identifier */
  variant?: string;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     BannerClickEvent:
 *       type: object
 *       description: Event emitted when featured banner is clicked
 *       properties:
 *         bannerId:
 *           type: string
 *         sectionId:
 *           type: string
 *         targetUrl:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * BannerClickEvent Interface
 *
 * Event data emitted when user clicks on featured banner.
 * Used for analytics tracking and navigation.
 */
export interface BannerClickEvent {
  bannerId: string;
  sectionId: string;
  targetUrl: string;
  timestamp: Date;

  /** Optional analytics metadata */
  analytics?: {
    source: string;
    medium: string;
    campaign?: string;
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     SubcategoryClickEvent:
 *       type: object
 *       description: Event emitted when subcategory card is clicked
 *       properties:
 *         subcategoryId:
 *           type: string
 *         sectionId:
 *           type: string
 *         categoryName:
 *           type: string
 *         targetUrl:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 */

/**
 * SubcategoryClickEvent Interface
 *
 * Event data emitted when user clicks on subcategory card.
 * Used for analytics tracking and navigation.
 */
export interface SubcategoryClickEvent {
  subcategoryId: string;
  sectionId: string;
  categoryName: string;
  targetUrl: string;
  timestamp: Date;

  /** Optional analytics metadata */
  analytics?: {
    source: string;
    position: number;
  };
}

/**
 * @fileoverview Dynamic Mega Menu interfaces for SouqSyria e-commerce platform
 * @description Defines TypeScript interfaces for dynamic category-specific mega menu content
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @swagger
 * components:
 *   schemas:
 *     MegaMenuCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the category
 *         name:
 *           type: string
 *           description: Display name in English
 *         nameAr:
 *           type: string
 *           description: Display name in Arabic
 *         columns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MegaMenuColumn'
 *           description: Array of columns with subcategories
 *         specialOffers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpecialOffer'
 *           description: Category-specific special offers
 *         featuredImage:
 *           type: string
 *           format: uri
 *           description: Optional featured image for the category
 *     MegaMenuColumn:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Column title in English
 *         titleAr:
 *           type: string
 *           description: Column title in Arabic
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubcategoryItem'
 *           description: Subcategory items in this column
 *     SubcategoryItem:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Subcategory name in English
 *         nameAr:
 *           type: string
 *           description: Subcategory name in Arabic
 *         url:
 *           type: string
 *           description: Navigation URL
 *         isNew:
 *           type: boolean
 *           description: Whether this is a new subcategory
 *         isPopular:
 *           type: boolean
 *           description: Whether this is a popular subcategory
 *         icon:
 *           type: string
 *           description: Optional Material Design icon
 *     SpecialOffer:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Offer title in English
 *         titleAr:
 *           type: string
 *           description: Offer title in Arabic
 *         description:
 *           type: string
 *           description: Offer description in English
 *         descriptionAr:
 *           type: string
 *           description: Offer description in Arabic
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: Offer banner image URL
 *         link:
 *           type: string
 *           description: Offer destination URL
 *         backgroundColor:
 *           type: string
 *           description: Tailwind CSS background gradient class
 *         discount:
 *           type: string
 *           description: Discount percentage or amount
 */

/**
 * Interface for dynamic mega menu category structure
 * @description Represents a category with its specific mega menu content
 */
export interface MegaMenuCategory {
  /** Unique identifier for the category */
  id: string;
  
  /** Display name in English */
  name: string;
  
  /** Display name in Arabic */
  nameAr: string;
  
  /** Array of columns containing subcategories */
  columns: MegaMenuColumn[];
  
  /** Category-specific special offers */
  specialOffers: SpecialOffer[];
  
  /** Optional featured image URL */
  featuredImage?: string;
  
  /** Material Design icon for the category */
  icon?: string;
}

/**
 * Interface for mega menu column structure
 * @description Represents a column within the mega menu with grouped subcategories
 */
export interface MegaMenuColumn {
  /** Column title in English */
  title: string;
  
  /** Column title in Arabic */
  titleAr: string;
  
  /** Subcategory items in this column */
  items: SubcategoryItem[];
}

/**
 * Interface for subcategory items within mega menu columns
 * @description Individual subcategory with metadata and navigation
 */
export interface SubcategoryItem {
  /** Subcategory name in English */
  name: string;
  
  /** Subcategory name in Arabic */
  nameAr: string;
  
  /** Navigation URL for the subcategory */
  url: string;
  
  /** Whether this is a new subcategory (shows "New" badge) */
  isNew?: boolean;
  
  /** Whether this is a popular subcategory (shows "Popular" badge) */
  isPopular?: boolean;
  
  /** Optional Material Design icon */
  icon?: string;
}

/**
 * Interface for category-specific special offers
 * @description Promotional content displayed in mega menu sidebar
 */
export interface SpecialOffer {
  /** Offer title in English */
  title: string;
  
  /** Offer title in Arabic */
  titleAr: string;
  
  /** Offer description in English */
  description: string;
  
  /** Offer description in Arabic */
  descriptionAr: string;
  
  /** Offer banner image URL */
  imageUrl: string;
  
  /** Offer destination URL */
  link: string;
  
  /** Tailwind CSS background gradient class */
  backgroundColor: string;
  
  /** Discount percentage or amount display */
  discount?: string;
}

/**
 * Interface for mega menu data service
 * @description Service interface for managing dynamic mega menu data
 */
export interface MegaMenuDataServiceInterface {
  /** Get mega menu data for specific category */
  getMegaMenuData(categoryId: string): MegaMenuCategory | null;
  
  /** Get all available mega menu categories */
  getAllMegaMenuCategories(): MegaMenuCategory[];
  
  /** Check if category has mega menu data */
  hasMegaMenuData(categoryId: string): boolean;
  
  /** Get default fallback mega menu data */
  getDefaultMegaMenuData(): MegaMenuCategory;
}

/**
 * Interface for mega menu configuration
 * @description Configuration options for dynamic mega menu behavior
 */
export interface MegaMenuConfig {
  /** Default number of columns to display */
  defaultColumns: number;
  
  /** Maximum number of items per column */
  maxItemsPerColumn: number;
  
  /** Whether to show special offers sidebar */
  showSpecialOffers: boolean;
  
  /** Animation duration in milliseconds */
  animationDuration: number;
  
  /** Delay before hiding mega menu on mouse leave */
  hideDelay: number;
}

/**
 * Type for mega menu interaction events
 * @description Union type for different mega menu events
 */
export type MegaMenuEvent = 
  | { type: 'category-hover'; categoryId: string }
  | { type: 'category-click'; categoryId: string; item: SubcategoryItem }
  | { type: 'offer-click'; offerId: string; offer: SpecialOffer }
  | { type: 'menu-open'; categoryId: string }
  | { type: 'menu-close' };
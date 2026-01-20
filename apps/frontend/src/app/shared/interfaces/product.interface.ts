/**
 * Product interfaces for Syrian marketplace
 * Designed for B2C e-commerce with international shipping capabilities
 * 
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - slug
 *         - price
 *         - category
 *         - inStock
 *         - images
 *       properties:
 *         id:
 *           type: string
 *           description: Unique product identifier
 *         name:
 *           type: string
 *           description: Product name in English
 *         nameArabic:
 *           type: string
 *           description: Product name in Arabic
 *         slug:
 *           type: string
 *           description: URL-friendly product identifier
 *         description:
 *           type: string
 *           description: Product description in English
 *         descriptionArabic:
 *           type: string
 *           description: Product description in Arabic
 *         price:
 *           $ref: '#/components/schemas/ProductPrice'
 *         category:
 *           $ref: '#/components/schemas/ProductCategory'
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductImage'
 *         specifications:
 *           $ref: '#/components/schemas/ProductSpecifications'
 *         seller:
 *           $ref: '#/components/schemas/ProductSeller'
 *         shipping:
 *           $ref: '#/components/schemas/ProductShipping'
 *         authenticity:
 *           $ref: '#/components/schemas/ProductAuthenticity'
 *         inventory:
 *           $ref: '#/components/schemas/ProductInventory'
 *         reviews:
 *           $ref: '#/components/schemas/ProductReviews'
 */

/**
 * Main product interface representing Syrian marketplace products
 */
export interface Product {
  /** Unique product identifier */
  id: string;
  
  /** Product name in English */
  name: string;
  
  /** Product name in Arabic */
  nameArabic?: string;
  
  /** URL-friendly product identifier */
  slug: string;
  
  /** Product description in English */
  description: string;
  
  /** Product description in Arabic */
  descriptionArabic?: string;
  
  /** Product pricing information */
  price: ProductPrice;
  
  /** Product category information */
  category: ProductCategory;
  
  /** Product images */
  images: ProductImage[];
  
  /** Product specifications and details */
  specifications: ProductSpecifications;
  
  /** Seller information */
  seller: ProductSeller;
  
  /** Shipping information for international buyers */
  shipping: ProductShipping;
  
  /** Syrian authenticity and origin information */
  authenticity: ProductAuthenticity;
  
  /** Inventory and availability */
  inventory: ProductInventory;
  
  /** Customer reviews and ratings */
  reviews: ProductReviews;
  
  /** SEO meta information */
  seo?: ProductSEO;
  
  /** Product creation and update timestamps */
  timestamps: {
    created: Date;
    updated: Date;
  };

  /** Product tags for categorization and filtering */
  tags?: string[];

  /** Featured product flag */
  featured?: boolean;
}

/**
 * Product pricing structure supporting multiple currencies
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProductPrice:
 *       type: object
 *       required:
 *         - amount
 *         - currency
 *       properties:
 *         amount:
 *           type: number
 *           description: Base price amount
 *         currency:
 *           type: string
 *           enum: [USD, EUR, SYP]
 *           description: Currency code
 *         originalPrice:
 *           type: number
 *           description: Original price before discount
 *         discount:
 *           $ref: '#/components/schemas/ProductDiscount'
 *         internationalPricing:
 *           type: object
 *           description: Pricing in different currencies for international buyers
 */
export interface ProductPrice {
  /** Base price amount */
  amount: number;
  
  /** Currency code (USD, EUR, SYP) */
  currency: 'USD' | 'EUR' | 'SYP';
  
  /** Original price before any discounts */
  originalPrice?: number;
  
  /** Discount information if applicable */
  discount?: ProductDiscount;
  
  /** Pricing in different currencies for international buyers */
  internationalPricing?: {
    [currency: string]: number;
  };
}

/**
 * Product discount information
 */
export interface ProductDiscount {
  /** Discount percentage (0-100) */
  percentage: number;
  
  /** Discount type */
  type: 'percentage' | 'fixed' | 'seasonal' | 'bulk';
  
  /** Discount start date */
  startDate?: Date;
  
  /** Discount end date */
  endDate?: Date;
  
  /** Minimum quantity for bulk discounts */
  minQuantity?: number;
}

/**
 * Product category information
 */
export interface ProductCategory {
  /** Category ID */
  id: string;
  
  /** Category name in English */
  name: string;
  
  /** Category name in Arabic */
  nameArabic?: string;
  
  /** Category slug */
  slug: string;
  
  /** Parent category if subcategory */
  parent?: string;
  
  /** Category breadcrumb path */
  breadcrumb: string[];
}

/**
 * Product image information
 */
export interface ProductImage {
  /** Image ID */
  id: string;
  
  /** Image URL */
  url: string;
  
  /** Alternative text for accessibility */
  alt: string;
  
  /** Image title */
  title?: string;
  
  /** Whether this is the primary image */
  isPrimary: boolean;
  
  /** Image order in gallery */
  order: number;
  
  /** Image dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Product specifications and technical details
 */
export interface ProductSpecifications {
  /** Product dimensions */
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  
  /** Product weight */
  weight?: {
    value: number;
    unit: 'kg' | 'g' | 'lb';
  };
  
  /** Material composition */
  materials?: string[];
  
  /** Color options */
  colors?: string[];
  
  /** Size options */
  sizes?: string[];
  
  /** Manufacturing details */
  manufacturing?: {
    method: string;
    origin: string;
    craftsman?: string;
  };
  
  /** Care instructions */
  careInstructions?: string[];
  
  /** Custom specifications for different product types */
  custom?: { [key: string]: string | number | boolean };
}

/**
 * Seller information for Syrian marketplace
 */
export interface ProductSeller {
  /** Seller ID */
  id: string;
  
  /** Seller name */
  name: string;
  
  /** Seller name in Arabic */
  nameArabic?: string;
  
  /** Seller location in Syria */
  location: {
    city: string;
    governorate: string;
  };
  
  /** Seller rating (1-5) */
  rating: number;
  
  /** Number of reviews for seller */
  reviewCount: number;
  
  /** Years in business */
  yearsInBusiness?: number;
  
  /** Seller verification status */
  verified: boolean;
  
  /** Seller specializations */
  specializations?: string[];
}

/**
 * Shipping information for international delivery
 */
export interface ProductShipping {
  /** Available shipping methods */
  methods: ShippingMethod[];
  
  /** Estimated delivery times by region */
  deliveryTimes: {
    [region: string]: {
      min: number;
      max: number;
      unit: 'days' | 'weeks';
    };
  };
  
  /** Shipping restrictions */
  restrictions?: string[];
  
  /** Free shipping threshold */
  freeShippingThreshold?: {
    amount: number;
    currency: string;
  };
  
  /** International shipping notes */
  internationalNotes?: string;
}

/**
 * Shipping method details
 */
export interface ShippingMethod {
  /** Method ID */
  id: string;
  
  /** Method name */
  name: string;
  
  /** Shipping cost */
  cost: {
    amount: number;
    currency: string;
  };
  
  /** Estimated delivery time */
  deliveryTime: {
    min: number;
    max: number;
    unit: 'days' | 'weeks';
  };
  
  /** Whether tracking is available */
  trackingAvailable: boolean;
  
  /** Insurance coverage */
  insured: boolean;
}

/**
 * Syrian authenticity and heritage information
 */
export interface ProductAuthenticity {
  /** Certificate of authenticity available */
  certified: boolean;

  /** Heritage classification */
  heritage: 'traditional' | 'modern' | 'contemporary' | string;

  /** Cultural significance */
  culturalSignificance?: string;

  /** Traditional techniques used */
  traditionalTechniques?: string[];

  /** UNESCO recognition if applicable */
  unescoRecognition?: boolean;

  /** UNESCO heritage status (alias for filtering) */
  isUNESCO?: boolean;

  /** Authenticity badges */
  badges: string[];
}

/**
 * Product inventory and availability
 */
export interface ProductInventory {
  /** Whether product is in stock */
  inStock: boolean;
  
  /** Available quantity */
  quantity: number;
  
  /** Minimum order quantity */
  minOrderQuantity: number;
  
  /** Maximum order quantity */
  maxOrderQuantity?: number;
  
  /** Stock status */
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';
  
  /** Restock date if out of stock */
  restockDate?: Date;
  
  /** Low stock threshold */
  lowStockThreshold: number;
}

/**
 * Product reviews and ratings
 */
export interface ProductReviews {
  /** Average rating (1-5) */
  averageRating: number;
  
  /** Total number of reviews */
  totalReviews: number;
  
  /** Rating distribution */
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  
  /** Recent reviews */
  recentReviews?: ProductReview[];
}

/**
 * Individual product review
 */
export interface ProductReview {
  /** Review ID */
  id: string;
  
  /** Customer name */
  customerName: string;
  
  /** Review rating (1-5) */
  rating: number;
  
  /** Review title */
  title: string;
  
  /** Review content */
  content: string;
  
  /** Review date */
  date: Date;
  
  /** Whether review is verified purchase */
  verifiedPurchase: boolean;
  
  /** Helpful votes count */
  helpfulVotes: number;
}

/**
 * SEO meta information
 */
export interface ProductSEO {
  /** Meta title */
  title: string;
  
  /** Meta description */
  description?: string;
  
  /** Meta description (alternative name) */
  metaDescription?: string;
  
  /** SEO keywords */
  keywords: string[];
  
  /** Canonical URL */
  canonical?: string;
}

/**
 * Product variant for products with multiple options
 */
export interface ProductVariant {
  /** Variant ID */
  id: string;
  
  /** Variant name */
  name: string;
  
  /** Variant options (color, size, etc.) */
  options: { [key: string]: string };
  
  /** Variant price if different from base */
  price?: ProductPrice;
  
  /** Variant images if different */
  images?: ProductImage[];
  
  /** Variant inventory */
  inventory: ProductInventory;
  
  /** Variant SKU */
  sku?: string;
}
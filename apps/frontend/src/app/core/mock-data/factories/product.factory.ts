/**
 * Product Factory
 *
 * Factory for generating Product objects with full interface compliance
 * Automatically applies category themes, heritage badges, and Syrian authenticity data
 *
 * @fileoverview Product factory for generating mock Syrian marketplace products
 * @description Creates type-safe Product objects with authentic Syrian data
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductFactory:
 *       type: object
 *       description: Factory for generating mock Product objects
 */

import {
  Product,
  ProductPrice,
  ProductCategory,
  ProductImage,
  ProductSpecifications,
  ProductSeller,
  ProductShipping,
  ProductAuthenticity,
  ProductInventory,
  ProductReviews,
  ProductSEO,
  ProductDiscount,
  ShippingMethod
} from '../../../shared/interfaces/product.interface';
import { BaseFactory } from './base.factory';
import { CategoryTheme, getCategoryTheme } from '../config/category-themes.config';

/**
 * Product generation options interface
 */
export interface ProductFactoryOptions {
  /** Product name in English */
  name: string;

  /** Product name in Arabic (optional, will be generated if not provided) */
  nameArabic?: string;

  /** Category slug */
  categorySlug: string;

  /** Base price in USD */
  price: number;

  /** Apply discount (optional) */
  discount?: {
    percentage: number;
    type?: 'percentage' | 'fixed' | 'seasonal' | 'bulk';
  };

  /** Product description */
  description: string;

  /** Product description in Arabic (optional) */
  descriptionArabic?: string;

  /** Number of images to generate */
  imageCount?: number;

  /** Heritage product flag */
  isHeritage?: boolean;

  /** UNESCO recognized flag */
  isUNESCO?: boolean;

  /** Artisan made flag */
  isArtisan?: boolean;

  /** New product flag */
  isNew?: boolean;

  /** Bestseller flag */
  isBestseller?: boolean;

  /** Stock quantity */
  stockQuantity?: number;

  /** Average rating (1-5) */
  averageRating?: number;

  /** Total reviews */
  totalReviews?: number;

  /** Seller information */
  seller?: Partial<ProductSeller>;

  /** Product specifications */
  specifications?: Partial<ProductSpecifications>;

  /** Additional tags */
  tags?: string[];

  /** Cultural significance */
  culturalSignificance?: string;

  /** Traditional techniques used */
  traditionalTechniques?: string[];
}

/**
 * Product Factory Class
 * Generates complete Product objects with all required fields
 */
export class ProductFactory {
  /**
   * Creates a complete Product object
   *
   * @param options - Product generation options
   * @returns Fully populated Product object
   *
   * @example
   * const product = ProductFactory.create({
   *   name: 'Damascus Steel Chef Knife',
   *   categorySlug: 'damascus-steel',
   *   price: 149.99,
   *   description: 'Handcrafted Damascus steel chef knife...',
   *   isHeritage: true,
   *   isArtisan: true
   * });
   */
  static create(options: ProductFactoryOptions): Product {
    const categoryTheme = getCategoryTheme(options.categorySlug);
    if (!categoryTheme) {
      throw new Error(`Category theme not found for slug: ${options.categorySlug}`);
    }

    const id = BaseFactory.generateId('prod');
    const slug = BaseFactory.slugify(options.name);
    const now = new Date();

    // Generate pricing
    const price = this.generatePrice(options.price, options.discount);

    // Generate category
    const category = this.generateCategory(categoryTheme);

    // Generate images
    const images = this.generateImages(
      options.name,
      options.categorySlug,
      options.imageCount || 4
    );

    // Generate specifications
    const specifications = this.generateSpecifications(
      categoryTheme,
      options.specifications
    );

    // Generate seller
    const seller = this.generateSeller(categoryTheme, options.seller);

    // Generate shipping
    const shipping = this.generateShipping();

    // Generate authenticity
    const authenticity = this.generateAuthenticity(
      options.isHeritage || categoryTheme.heritage.isTraditional,
      options.isUNESCO || categoryTheme.heritage.unescoRecognized,
      options.isArtisan || false,
      categoryTheme,
      options.culturalSignificance,
      options.traditionalTechniques
    );

    // Generate inventory
    const inventory = this.generateInventory(options.stockQuantity);

    // Generate reviews
    const reviews = this.generateReviews(
      options.averageRating || BaseFactory.randomFloat(3.5, 5.0, 1),
      options.totalReviews || BaseFactory.randomInt(10, 500)
    );

    // Generate SEO
    const seo = this.generateSEO(options.name, options.description, categoryTheme);

    // Generate badges from options
    const badges = BaseFactory.generateBadges({
      heritage: options.isHeritage || categoryTheme.heritage.isTraditional,
      unesco: options.isUNESCO || categoryTheme.heritage.unescoRecognized,
      artisan: options.isArtisan || false,
      new: options.isNew || false,
      bestseller: options.isBestseller || false,
      sale: !!options.discount,
      verified: true
    });

    // Combine tags
    const tags = [
      ...(options.tags || []),
      ...categoryTheme.keywords.slice(0, 5),
      ...badges
    ];

    return {
      id,
      name: options.name,
      nameArabic: options.nameArabic,
      slug,
      description: options.description,
      descriptionArabic: options.descriptionArabic,
      price,
      category,
      images,
      specifications,
      seller,
      shipping,
      authenticity,
      inventory,
      reviews,
      seo,
      timestamps: {
        created: BaseFactory.pastDate(180), // Created within last 6 months
        updated: BaseFactory.pastDate(30) // Updated within last month
      },
      tags
    };
  }

  /**
   * Generates product pricing information
   */
  private static generatePrice(
    amount: number,
    discount?: { percentage: number; type?: 'percentage' | 'fixed' | 'seasonal' | 'bulk' }
  ): ProductPrice {
    const price: ProductPrice = {
      amount,
      currency: 'USD',
      internationalPricing: {
        EUR: parseFloat((amount * 0.92).toFixed(2)),
        SYP: parseFloat((amount * 12500).toFixed(0))
      }
    };

    if (discount) {
      const discountedAmount = amount * (1 - discount.percentage / 100);
      price.amount = parseFloat(discountedAmount.toFixed(2));
      price.originalPrice = amount;
      price.discount = {
        percentage: discount.percentage,
        type: discount.type || 'percentage',
        startDate: BaseFactory.pastDate(30),
        endDate: BaseFactory.futureDate(30)
      };
    }

    return price;
  }

  /**
   * Generates product category information
   */
  private static generateCategory(categoryTheme: CategoryTheme): ProductCategory {
    return {
      id: categoryTheme.id,
      name: categoryTheme.nameEn,
      nameArabic: categoryTheme.nameAr,
      slug: categoryTheme.slug,
      breadcrumb: ['Home', categoryTheme.nameEn]
    };
  }

  /**
   * Generates product images
   */
  private static generateImages(
    productName: string,
    categorySlug: string,
    count: number
  ): ProductImage[] {
    const images: ProductImage[] = [];
    const slug = BaseFactory.slugify(productName);

    for (let i = 0; i < count; i++) {
      images.push({
        id: BaseFactory.generateId('img'),
        url: BaseFactory.generateProductImagePath(categorySlug, productName, i),
        alt: `${productName} - Image ${i + 1}`,
        title: productName,
        isPrimary: i === 0,
        order: i,
        dimensions: {
          width: 800,
          height: 800
        }
      });
    }

    return images;
  }

  /**
   * Generates product specifications
   */
  private static generateSpecifications(
    categoryTheme: CategoryTheme,
    customSpecs?: Partial<ProductSpecifications>
  ): ProductSpecifications {
    const baseSpecs: ProductSpecifications = {
      weight: {
        value: BaseFactory.randomFloat(0.1, 5.0, 2),
        unit: 'kg'
      },
      dimensions: {
        length: BaseFactory.randomInt(10, 50),
        width: BaseFactory.randomInt(5, 30),
        height: BaseFactory.randomInt(5, 20),
        unit: 'cm'
      },
      materials: this.getCategoryMaterials(categoryTheme.slug),
      colors: this.getCategoryColors(categoryTheme.slug),
      manufacturing: {
        method: 'Handcrafted',
        origin: BaseFactory.randomItem(categoryTheme.popularRegions),
        craftsman: 'Syrian Artisan'
      },
      careInstructions: this.getCareInstructions(categoryTheme.slug)
    };

    return { ...baseSpecs, ...customSpecs };
  }

  /**
   * Gets typical materials for category
   */
  private static getCategoryMaterials(categorySlug: string): string[] {
    const materialMap: Record<string, string[]> = {
      'damascus-steel': ['Damascus Steel', 'Wood', 'Brass'],
      'beauty-wellness': ['Laurel Oil', 'Olive Oil', 'Natural Ingredients'],
      'textiles-fabrics': ['Silk', 'Cotton', 'Gold Thread'],
      'food-spices': ['Natural Spices', 'Herbs', 'Seeds'],
      'jewelry-accessories': ['Gold', 'Silver', 'Precious Stones'],
      'traditional-crafts': ['Wood', 'Mother of Pearl', 'Brass'],
      'ceramics-pottery': ['Clay', 'Ceramic Glaze', 'Natural Pigments'],
      'oud-perfumes': ['Oud Wood', 'Essential Oils', 'Natural Extracts'],
      'nuts-snacks': ['Natural Ingredients', 'No Preservatives'],
      'sweets-desserts': ['Pistachios', 'Almonds', 'Rose Water', 'Sugar'],
      'musical-instruments': ['Wood', 'Skin', 'String'],
      'calligraphy-art': ['Paper', 'Ink', 'Gold Leaf']
    };

    return materialMap[categorySlug] || ['Natural Materials', 'Traditional Components'];
  }

  /**
   * Gets typical colors for category
   */
  private static getCategoryColors(categorySlug: string): string[] {
    const colorMap: Record<string, string[]> = {
      'damascus-steel': ['Silver', 'Black', 'Dark Gray'],
      'beauty-wellness': ['Green', 'Brown', 'Natural'],
      'textiles-fabrics': ['Gold', 'Red', 'Blue', 'Green', 'Purple'],
      'food-spices': ['Red', 'Brown', 'Green', 'Yellow'],
      'jewelry-accessories': ['Gold', 'Silver', 'Rose Gold'],
      'traditional-crafts': ['Brown', 'Natural Wood', 'Gold Inlay'],
      'ceramics-pottery': ['White', 'Blue', 'Green', 'Brown'],
      'oud-perfumes': ['Amber', 'Dark Brown', 'Black'],
      'nuts-snacks': ['Natural', 'Brown', 'Beige'],
      'sweets-desserts': ['Golden', 'Brown', 'White'],
      'musical-instruments': ['Natural Wood', 'Brown', 'Black'],
      'calligraphy-art': ['Black', 'Gold', 'White']
    };

    return colorMap[categorySlug] || ['Natural'];
  }

  /**
   * Gets care instructions for category
   */
  private static getCareInstructions(categorySlug: string): string[] {
    const careMap: Record<string, string[]> = {
      'damascus-steel': ['Hand wash only', 'Dry immediately', 'Oil blade regularly'],
      'beauty-wellness': ['Store in cool, dry place', 'Keep away from sunlight'],
      'textiles-fabrics': ['Dry clean only', 'Do not bleach', 'Iron on low heat'],
      'food-spices': ['Store in airtight container', 'Keep away from moisture'],
      'jewelry-accessories': ['Clean with soft cloth', 'Store separately'],
      'traditional-crafts': ['Dust with soft cloth', 'Avoid direct sunlight'],
      'ceramics-pottery': ['Hand wash recommended', 'Avoid thermal shock'],
      'oud-perfumes': ['Store in cool place', 'Keep tightly sealed'],
      'nuts-snacks': ['Store in airtight container', 'Consume within 6 months'],
      'sweets-desserts': ['Store at room temperature', 'Consume within 2 weeks'],
      'musical-instruments': ['Keep away from humidity', 'Store in case'],
      'calligraphy-art': ['Frame behind glass', 'Avoid direct sunlight']
    };

    return careMap[categorySlug] || ['Handle with care'];
  }

  /**
   * Generates seller information
   */
  private static generateSeller(
    categoryTheme: CategoryTheme,
    customSeller?: Partial<ProductSeller>
  ): ProductSeller {
    const region = BaseFactory.randomItem(categoryTheme.popularRegions);
    const sellerNames = this.getSellerNames(categoryTheme.slug);
    const sellerName = BaseFactory.randomItem(sellerNames);

    const baseSeller: ProductSeller = {
      id: BaseFactory.generateId('seller'),
      name: sellerName.en,
      nameArabic: sellerName.ar,
      location: {
        city: region,
        governorate: region
      },
      rating: BaseFactory.randomFloat(4.0, 5.0, 1),
      reviewCount: BaseFactory.randomInt(50, 1000),
      yearsInBusiness: BaseFactory.randomInt(5, 50),
      verified: true,
      specializations: categoryTheme.keywords.slice(0, 3)
    };

    return { ...baseSeller, ...customSeller };
  }

  /**
   * Gets typical seller names for category
   */
  private static getSellerNames(
    categorySlug: string
  ): Array<{ en: string; ar: string }> {
    // Placeholder - would be replaced with actual data in syrian-sellers.data.ts
    return [
      { en: 'Al-Sham Artisans', ar: 'حرفيو الشام' },
      { en: 'Damascus Heritage Workshop', ar: 'ورشة تراث دمشق' },
      { en: 'Aleppo Traditional Crafts', ar: 'حرف حلب التقليدية' },
      { en: 'Syrian Master Craftsmen', ar: 'الحرفيون السوريون المهرة' }
    ];
  }

  /**
   * Generates shipping information
   */
  private static generateShipping(): ProductShipping {
    const methods: ShippingMethod[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        cost: { amount: 15, currency: 'USD' },
        deliveryTime: { min: 7, max: 14, unit: 'days' },
        trackingAvailable: true,
        insured: false
      },
      {
        id: 'express',
        name: 'Express Shipping',
        cost: { amount: 35, currency: 'USD' },
        deliveryTime: { min: 3, max: 5, unit: 'days' },
        trackingAvailable: true,
        insured: true
      }
    ];

    return {
      methods,
      deliveryTimes: {
        'North America': { min: 7, max: 14, unit: 'days' },
        Europe: { min: 5, max: 10, unit: 'days' },
        'Middle East': { min: 3, max: 7, unit: 'days' },
        Asia: { min: 7, max: 14, unit: 'days' }
      },
      freeShippingThreshold: {
        amount: 100,
        currency: 'USD'
      },
      internationalNotes: 'Customs duties may apply depending on destination country'
    };
  }

  /**
   * Generates authenticity information
   */
  private static generateAuthenticity(
    isHeritage: boolean,
    isUNESCO: boolean,
    isArtisan: boolean,
    categoryTheme: CategoryTheme,
    culturalSignificance?: string,
    traditionalTechniques?: string[]
  ): ProductAuthenticity {
    const badges = BaseFactory.generateBadges({
      heritage: isHeritage,
      unesco: isUNESCO,
      artisan: isArtisan,
      verified: true
    });

    return {
      certified: isArtisan || isHeritage,
      heritage: isHeritage ? 'traditional' : 'contemporary',
      culturalSignificance:
        culturalSignificance || categoryTheme.heritage.culturalContext,
      traditionalTechniques: traditionalTechniques || [
        'Traditional Syrian methods',
        'Handcrafted techniques'
      ],
      unescoRecognition: isUNESCO,
      badges
    };
  }

  /**
   * Generates inventory information
   */
  private static generateInventory(stockQuantity?: number): ProductInventory {
    const quantity = stockQuantity ?? BaseFactory.randomInt(0, 100);
    let status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'pre_order';

    if (quantity === 0) {
      status = 'out_of_stock';
    } else if (quantity < 10) {
      status = 'low_stock';
    } else {
      status = 'in_stock';
    }

    return {
      inStock: quantity > 0,
      quantity,
      minOrderQuantity: 1,
      maxOrderQuantity: Math.min(quantity, 10),
      status,
      restockDate: quantity === 0 ? BaseFactory.futureDate(14) : undefined,
      lowStockThreshold: 10
    };
  }

  /**
   * Generates reviews information
   */
  private static generateReviews(
    averageRating: number,
    totalReviews: number
  ): ProductReviews {
    return {
      averageRating,
      totalReviews,
      ratingDistribution: BaseFactory.generateRatingDistribution(
        totalReviews,
        averageRating
      )
    };
  }

  /**
   * Generates SEO information
   */
  private static generateSEO(
    name: string,
    description: string,
    categoryTheme: CategoryTheme
  ): ProductSEO {
    return {
      title: `${name} | Syrian Marketplace`,
      metaDescription: BaseFactory.truncate(description, 155),
      keywords: [name, ...categoryTheme.keywords.slice(0, 8)]
    };
  }

  /**
   * Creates multiple products at once
   *
   * @param optionsArray - Array of product options
   * @returns Array of Product objects
   */
  static createBulk(optionsArray: ProductFactoryOptions[]): Product[] {
    return optionsArray.map((options) => this.create(options));
  }
}

/**
 * Export default product factory
 */
export default ProductFactory;

/**
 * Seller Factory
 *
 * Factory for generating ProductSeller objects with Syrian governorates and regions
 * Creates authentic artisan seller profiles with cultural context
 *
 * @fileoverview Seller factory for generating mock Syrian artisan sellers
 * @description Creates type-safe ProductSeller objects with Syrian geographical data
 *
 * @swagger
 * components:
 *   schemas:
 *     SellerFactory:
 *       type: object
 *       description: Factory for generating mock ProductSeller objects
 */

import { ProductSeller } from '../../../shared/interfaces/product.interface';
import { BaseFactory } from './base.factory';

/**
 * Syrian governorate data
 */
export interface SyrianGovernorate {
  nameEn: string;
  nameAr: string;
  cities: string[];
}

/**
 * Seller generation options
 */
export interface SellerFactoryOptions {
  /** Seller name in English */
  name?: string;

  /** Seller name in Arabic */
  nameArabic?: string;

  /** Governorate location */
  governorate?: string;

  /** City location */
  city?: string;

  /** Seller rating (1-5) */
  rating?: number;

  /** Number of reviews */
  reviewCount?: number;

  /** Years in business */
  yearsInBusiness?: number;

  /** Verification status */
  verified?: boolean;

  /** Seller specializations */
  specializations?: string[];
}

/**
 * Syrian Governorates Data
 * 14 Syrian governorates with major cities
 */
export const SYRIAN_GOVERNORATES: SyrianGovernorate[] = [
  {
    nameEn: 'Damascus',
    nameAr: 'دمشق',
    cities: ['Damascus', 'Jaramana', 'Sayyidah Zaynab', 'Qudsaya']
  },
  {
    nameEn: 'Aleppo',
    nameAr: 'حلب',
    cities: ['Aleppo', 'Afrin', 'Azaz', 'Manbij', 'Al-Bab']
  },
  {
    nameEn: 'Homs',
    nameAr: 'حمص',
    cities: ['Homs', 'Palmyra', 'Talkalakh', 'Al-Qusayr']
  },
  {
    nameEn: 'Latakia',
    nameAr: 'اللاذقية',
    cities: ['Latakia', 'Jableh', 'Qardaha', 'Al-Haffah']
  },
  {
    nameEn: 'Hama',
    nameAr: 'حماة',
    cities: ['Hama', 'Salamiyah', 'Masyaf', 'Suqaylabiyah']
  },
  {
    nameEn: 'Tartus',
    nameAr: 'طرطوس',
    cities: ['Tartus', 'Baniyas', 'Safita', 'Arwad']
  },
  {
    nameEn: 'Idlib',
    nameAr: 'إدلب',
    cities: ['Idlib', 'Ariha', 'Jisr al-Shughur', 'Maarrat al-Numan']
  },
  {
    nameEn: 'Daraa',
    nameAr: 'درعا',
    cities: ['Daraa', 'Izra', 'Nawa', 'Al-Sanamayn']
  },
  {
    nameEn: 'As-Suwayda',
    nameAr: 'السويداء',
    cities: ['As-Suwayda', 'Salkhad', 'Shahba', 'Qanawat']
  },
  {
    nameEn: 'Deir ez-Zor',
    nameAr: 'دير الزور',
    cities: ['Deir ez-Zor', 'Albukamal', 'Mayadin', 'Al-Quriyah']
  },
  {
    nameEn: 'Raqqa',
    nameAr: 'الرقة',
    cities: ['Raqqa', 'Tell Abyad', 'Thawrah', 'Suluk']
  },
  {
    nameEn: 'Al-Hasakah',
    nameAr: 'الحسكة',
    cities: ['Al-Hasakah', 'Qamishli', 'Ras al-Ayn', 'Al-Malikiyah']
  },
  {
    nameEn: 'Quneitra',
    nameAr: 'القنيطرة',
    cities: ['Quneitra', 'Khan Arnabah', 'Fiq']
  },
  {
    nameEn: 'Rif Dimashq',
    nameAr: 'ريف دمشق',
    cities: ['Douma', 'Zabadani', 'Yabroud', 'Harasta', 'Darayya']
  }
];

/**
 * Traditional Syrian seller names (artisan workshops)
 */
export const SYRIAN_SELLER_NAMES = [
  { en: 'Al-Sham Heritage Crafts', ar: 'حرف تراث الشام' },
  { en: 'Damascus Artisan Workshop', ar: 'ورشة حرفيي دمشق' },
  { en: 'Aleppo Traditional Guild', ar: 'نقابة حرفيي حلب التقليدية' },
  { en: 'Old City Craftsmen', ar: 'حرفيو المدينة القديمة' },
  { en: 'Syrian Heritage Masters', ar: 'أساتذة التراث السوري' },
  { en: 'Umayyad Artisans', ar: 'الحرفيون الأمويون' },
  { en: 'Souq al-Hamidiyeh Workshop', ar: 'ورشة سوق الحميدية' },
  { en: 'Aleppo Citadel Crafts', ar: 'حرف قلعة حلب' },
  { en: 'Damascus Steel Masters', ar: 'أساتذة الفولاذ الدمشقي' },
  { en: 'Syrian Silk Road Traders', ar: 'تجار طريق الحرير السوري' },
  { en: 'Ancient City Artisans', ar: 'حرفيو المدينة العتيقة' },
  { en: 'Traditional Syrian Makers', ar: 'صناع سوريا التقليديون' },
  { en: 'Levantine Heritage Guild', ar: 'نقابة تراث بلاد الشام' },
  { en: 'Authentic Syrian Crafts', ar: 'الحرف السورية الأصيلة' },
  { en: 'Master Craftsmen of Syria', ar: 'الحرفيون المهرة في سوريا' },
  { en: 'Syrian Cultural Workshop', ar: 'ورشة الثقافة السورية' },
  { en: 'Heritage Preservation Society', ar: 'جمعية الحفاظ على التراث' },
  { en: 'Damascus Old Souq Merchants', ar: 'تجار السوق القديم بدمشق' },
  { en: 'Aleppo Soap Makers Guild', ar: 'نقابة صانعي صابون حلب' },
  { en: 'Syrian Textile Weavers', ar: 'نساجو المنسوجات السورية' }
];

/**
 * Category-specific specializations
 */
export const CATEGORY_SPECIALIZATIONS: Record<string, string[]> = {
  'damascus-steel': [
    'Damascus Steel Forging',
    'Blade Smithing',
    'Traditional Weaponry',
    'Metalwork Artistry'
  ],
  'beauty-wellness': [
    'Laurel Soap Making',
    'Natural Cosmetics',
    'Traditional Beauty Products',
    'Herbal Remedies'
  ],
  'textiles-fabrics': [
    'Silk Weaving',
    'Brocade Production',
    'Traditional Embroidery',
    'Fabric Dyeing'
  ],
  'food-spices': [
    'Spice Blending',
    'Traditional Foods',
    'Herb Processing',
    'Syrian Cuisine'
  ],
  'jewelry-accessories': [
    'Gold Smithing',
    'Silver Filigree',
    'Precious Stones',
    'Traditional Jewelry'
  ],
  'traditional-crafts': [
    'Wood Inlay',
    'Mosaic Work',
    'Mother of Pearl Inlay',
    'Traditional Carpentry'
  ],
  'ceramics-pottery': [
    'Pottery Making',
    'Ceramic Glazing',
    'Traditional Pottery',
    'Clay Craftsmanship'
  ],
  'oud-perfumes': [
    'Perfume Blending',
    'Oud Extraction',
    'Incense Making',
    'Traditional Fragrances'
  ],
  'nuts-snacks': ['Nut Processing', 'Quality Selection', 'Food Packaging', 'Dried Fruits'],
  'sweets-desserts': [
    'Baklava Making',
    'Ma\'amoul Crafting',
    'Syrian Sweets',
    'Traditional Pastries'
  ],
  'musical-instruments': [
    'Oud Making',
    'Qanun Crafting',
    'Percussion Instruments',
    'String Instruments'
  ],
  'calligraphy-art': [
    'Arabic Calligraphy',
    'Islamic Art',
    'Traditional Scripts',
    'Illumination'
  ]
};

/**
 * Seller Factory Class
 */
export class SellerFactory {
  /**
   * Creates a ProductSeller object
   *
   * @param options - Seller generation options
   * @returns Fully populated ProductSeller object
   *
   * @example
   * const seller = SellerFactory.create({
   *   governorate: 'Damascus',
   *   specializations: ['Damascus Steel Forging', 'Blade Smithing']
   * });
   */
  static create(options: SellerFactoryOptions = {}): ProductSeller {
    // Select random governorate if not provided
    const governorate = options.governorate
      ? SYRIAN_GOVERNORATES.find((g) => g.nameEn === options.governorate)
      : BaseFactory.randomItem(SYRIAN_GOVERNORATES);

    if (!governorate) {
      throw new Error(`Invalid governorate: ${options.governorate}`);
    }

    // Select random city from governorate
    const city = options.city || BaseFactory.randomItem(governorate.cities);

    // Select random seller name if not provided
    const sellerName = options.name
      ? { en: options.name, ar: options.nameArabic || options.name }
      : BaseFactory.randomItem(SYRIAN_SELLER_NAMES);

    // Generate or use provided values
    const rating = options.rating ?? BaseFactory.randomFloat(4.0, 5.0, 1);
    const reviewCount = options.reviewCount ?? BaseFactory.randomInt(50, 1000);
    const yearsInBusiness = options.yearsInBusiness ?? BaseFactory.randomInt(5, 50);
    const verified = options.verified ?? BaseFactory.randomBoolean(0.9); // 90% verified

    // Generate specializations
    const specializations =
      options.specializations ||
      BaseFactory.randomItems(
        CATEGORY_SPECIALIZATIONS['traditional-crafts'] || [],
        BaseFactory.randomInt(2, 4)
      );

    return {
      id: BaseFactory.generateId('seller'),
      name: sellerName.en,
      nameArabic: sellerName.ar,
      location: {
        city,
        governorate: governorate.nameEn
      },
      rating,
      reviewCount,
      yearsInBusiness,
      verified,
      specializations
    };
  }

  /**
   * Creates a seller with category-specific specializations
   *
   * @param categorySlug - Product category slug
   * @param options - Additional seller options
   * @returns ProductSeller with category specializations
   *
   * @example
   * const seller = SellerFactory.createForCategory('damascus-steel', {
   *   governorate: 'Damascus'
   * });
   */
  static createForCategory(
    categorySlug: string,
    options: SellerFactoryOptions = {}
  ): ProductSeller {
    const categorySpecs = CATEGORY_SPECIALIZATIONS[categorySlug] || [];
    const specializations =
      options.specializations ||
      BaseFactory.randomItems(categorySpecs, BaseFactory.randomInt(2, 4));

    return this.create({
      ...options,
      specializations
    });
  }

  /**
   * Creates multiple sellers at once
   *
   * @param count - Number of sellers to create
   * @param options - Base seller options
   * @returns Array of ProductSeller objects
   */
  static createBulk(count: number, options: SellerFactoryOptions = {}): ProductSeller[] {
    const sellers: ProductSeller[] = [];
    for (let i = 0; i < count; i++) {
      sellers.push(this.create(options));
    }
    return sellers;
  }

  /**
   * Gets a random Syrian governorate
   *
   * @returns Random governorate object
   */
  static getRandomGovernorate(): SyrianGovernorate {
    return BaseFactory.randomItem(SYRIAN_GOVERNORATES);
  }

  /**
   * Gets all governorates
   *
   * @returns Array of all Syrian governorates
   */
  static getAllGovernorates(): SyrianGovernorate[] {
    return SYRIAN_GOVERNORATES;
  }

  /**
   * Gets cities for a specific governorate
   *
   * @param governorateName - Name of governorate
   * @returns Array of cities or empty array if not found
   */
  static getCitiesForGovernorate(governorateName: string): string[] {
    const governorate = SYRIAN_GOVERNORATES.find((g) => g.nameEn === governorateName);
    return governorate?.cities || [];
  }

  /**
   * Validates if a governorate exists
   *
   * @param governorateName - Name of governorate to validate
   * @returns True if governorate exists
   */
  static isValidGovernorate(governorateName: string): boolean {
    return SYRIAN_GOVERNORATES.some((g) => g.nameEn === governorateName);
  }

  /**
   * Gets random seller name
   *
   * @returns Random seller name object with English and Arabic
   */
  static getRandomSellerName(): { en: string; ar: string } {
    return BaseFactory.randomItem(SYRIAN_SELLER_NAMES);
  }
}

/**
 * Export default seller factory
 */
export default SellerFactory;

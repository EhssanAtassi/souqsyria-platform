/**
 * Syrian Marketplace Data Interfaces
 *
 * Defines data structures for Syrian geographical, cultural, and linguistic data
 * Supports Arabic/English bilingual content and traditional Syrian categories
 * Used for regional shipping, cultural authentication, and localization
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianGovernorate:
 *       type: object
 *       description: Syrian governorate with regions and shipping information
 *       required: [id, nameEn, nameAr, regions, shippingZone, deliveryTime]
 *       properties:
 *         id:
 *           type: string
 *           description: Unique governorate identifier
 *           example: "damascus"
 *         nameEn:
 *           type: string
 *           description: English name of governorate
 *           example: "Damascus"
 *         nameAr:
 *           type: string
 *           description: Arabic name of governorate
 *           example: "دمشق"
 *         regions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SyrianRegion'
 *           description: List of regions within governorate
 *         shippingZone:
 *           type: number
 *           description: Shipping zone identifier (1-5)
 *           minimum: 1
 *           maximum: 5
 *         deliveryTime:
 *           type: string
 *           description: Expected delivery timeframe
 *           example: "1-2 days"
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *         population:
 *           type: number
 *           description: Population of governorate
 *         area:
 *           type: number
 *           description: Area in square kilometers
 */

/**
 * Syrian Governorate Interface
 * Represents a Syrian governorate with bilingual names and regional data
 */
export interface SyrianGovernorate {
  id: string;
  nameEn: string;
  nameAr: string;
  regions: SyrianRegion[];
  shippingZone: number;
  deliveryTime: string;
  coordinates?: Coordinates;
  population?: number;
  area?: number;
  isActive: boolean;
  specialInstructions?: string;
  heritage?: boolean;
}

/**
 * Syrian Region Interface
 * Represents a region within a Syrian governorate
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianRegion:
 *       type: object
 *       description: Region within a Syrian governorate
 *       required: [id, nameEn, nameAr, governorateId]
 *       properties:
 *         id:
 *           type: string
 *           description: Unique region identifier
 *         nameEn:
 *           type: string
 *           description: English name of region
 *         nameAr:
 *           type: string
 *           description: Arabic name of region
 *         governorateId:
 *           type: string
 *           description: Parent governorate identifier
 *         postalCode:
 *           type: string
 *           description: Postal code for region
 */
export interface SyrianRegion {
  id: string;
  nameEn: string;
  nameAr: string;
  governorateId: string;
  postalCode?: string;
  isUrban: boolean;
  deliveryAvailable: boolean;
  coordinates?: Coordinates;
  population?: number;
}

/**
 * Geographic Coordinates Interface
 * Represents latitude and longitude coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Traditional Syrian Category Interface
 * Represents traditional Syrian craft categories with heritage information
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianTraditionalCategory:
 *       type: object
 *       description: Traditional Syrian craft or product category
 *       required: [id, nameEn, nameAr, description, heritage]
 *       properties:
 *         id:
 *           type: string
 *           description: Unique category identifier
 *         nameEn:
 *           type: string
 *           description: English name of category
 *         nameAr:
 *           type: string
 *           description: Arabic name of category
 *         description:
 *           type: string
 *           description: Category description
 *         heritage:
 *           type: boolean
 *           description: Whether category is traditional heritage
 *         unesco:
 *           type: boolean
 *           description: Whether recognized by UNESCO
 */
export interface SyrianTraditionalCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  description: string;
  heritage: boolean;
  unesco: boolean;
  artisanCount?: number;
  averagePrice?: number;
  popularityScore?: number;
  seasonality?: string[];
  relatedCategories?: string[];
  authenticityCriteria?: string[];
}

/**
 * Currency Conversion Interface
 * Handles SYP to USD and other currency conversions
 *
 * @swagger
 * components:
 *   schemas:
 *     CurrencyConversion:
 *       type: object
 *       description: Currency conversion data
 *       required: [fromCurrency, toCurrency, rate, amount, convertedAmount]
 *       properties:
 *         fromCurrency:
 *           type: string
 *           enum: [SYP, USD, EUR, AED, SAR]
 *         toCurrency:
 *           type: string
 *           enum: [SYP, USD, EUR, AED, SAR]
 *         rate:
 *           type: number
 *           description: Exchange rate
 *         amount:
 *           type: number
 *           description: Original amount
 *         convertedAmount:
 *           type: number
 *           description: Converted amount
 */
export interface CurrencyConversion {
  fromCurrency: 'SYP' | 'USD' | 'EUR' | 'AED' | 'SAR';
  toCurrency: 'SYP' | 'USD' | 'EUR' | 'AED' | 'SAR';
  rate: number;
  amount: number;
  convertedAmount: number;
  lastUpdated: Date;
}

/**
 * Arabic Number Format Options
 * Configuration for Arabic numeral formatting
 */
export interface ArabicNumberFormatOptions {
  useArabicNumerals: boolean;
  showThousandsSeparator: boolean;
  decimalPlaces: number;
  currency?: 'SYP' | 'USD' | 'EUR' | 'AED' | 'SAR';
  locale?: 'ar-SY' | 'en-US';
}

/**
 * Syrian Business Hours Interface
 * Represents business operating hours with cultural considerations
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianBusinessHours:
 *       type: object
 *       description: Business hours with Syrian cultural considerations
 *       properties:
 *         standard:
 *           $ref: '#/components/schemas/WeeklySchedule'
 *         ramadan:
 *           $ref: '#/components/schemas/WeeklySchedule'
 *         holidays:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Holiday'
 */
export interface SyrianBusinessHours {
  standard: WeeklySchedule;
  ramadan?: WeeklySchedule;
  holidays: Holiday[];
  timezone: string;
  culturalNotes?: string;
}

/**
 * Weekly Schedule Interface
 * Represents operating hours for each day of the week
 */
export interface WeeklySchedule {
  sunday: DaySchedule;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
}

/**
 * Day Schedule Interface
 * Represents operating hours for a single day
 */
export interface DaySchedule {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breaks?: TimeRange[];
  notes?: string;
}

/**
 * Time Range Interface
 * Represents a time range (e.g., lunch break)
 */
export interface TimeRange {
  startTime: string;
  endTime: string;
  reason: string;
}

/**
 * Holiday Interface
 * Represents a holiday with cultural significance
 */
export interface Holiday {
  id: string;
  nameEn: string;
  nameAr: string;
  date: Date;
  isNationalHoliday: boolean;
  isReligiousHoliday: boolean;
  affectsShipping: boolean;
  alternativeDate?: Date;
}

/**
 * Shipping Zone Interface
 * Represents shipping zones within Syria and internationally
 *
 * @swagger
 * components:
 *   schemas:
 *     ShippingZone:
 *       type: object
 *       description: Shipping zone configuration
 *       required: [id, name, countries, baseRate, deliveryTime]
 *       properties:
 *         id:
 *           type: number
 *           description: Zone identifier
 *         name:
 *           type: string
 *           description: Zone name
 *         countries:
 *           type: array
 *           items:
 *             type: string
 *         baseRate:
 *           type: number
 *           description: Base shipping rate in SYP
 *         deliveryTime:
 *           type: string
 *           description: Expected delivery time
 */
export interface ShippingZone {
  id: number;
  name: string;
  nameAr: string;
  countries: string[];
  governorates?: string[];
  baseRate: number; // In SYP
  baseRateUSD: number;
  deliveryTime: string;
  isActive: boolean;
  requiresDocuments: boolean;
  maxWeight?: number;
  restrictions?: string[];
}

/**
 * Language Support Interface
 * Configuration for bilingual support
 */
export interface LanguageSupport {
  code: 'ar' | 'en';
  name: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
  dateFormat: string;
  numberFormat: string;
  currencyFormat: string;
}

/**
 * Cultural Data Interface
 * Contains cultural information for products and categories
 */
export interface CulturalData {
  heritage: boolean;
  unesco: boolean;
  artisanMade: boolean;
  traditionalMethod: boolean;
  regionOfOrigin: string;
  historicalPeriod?: string;
  culturalSignificance?: string;
  authenticityCertified: boolean;
}
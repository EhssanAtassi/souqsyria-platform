/**
 * @file localization.service.ts
 * @description Arabic language and RTL text support for Syrian localization
 *
 * ARABIC LOCALIZATION FEATURES:
 * - Complete Arabic language support
 * - Right-to-Left (RTL) text handling
 * - Arabic number formatting and display
 * - Cultural adaptations for Syrian market
 * - Bilingual content management
 * - Arabic search and text processing
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Supported languages
 */
export enum SupportedLanguage {
  ARABIC = 'ar',
  ENGLISH = 'en',
}

/**
 * Text direction
 */
export enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl',
}

/**
 * Localized content structure
 */
interface LocalizedContent {
  en: string;
  ar: string;
  metadata?: {
    direction: TextDirection;
    charset: string;
    wordCount: number;
    lastUpdated: Date;
  };
}

/**
 * Arabic number formatting options
 */
interface ArabicNumberOptions {
  useArabicNumerals: boolean;
  useArabicThousandsSeparator: boolean;
  currency?: 'SYP' | 'USD' | 'EUR';
  format?: 'decimal' | 'currency' | 'percentage';
}

/**
 * Cultural settings for Syrian market
 */
interface SyrianCulturalSettings {
  dateFormat: string;
  timeFormat: string;
  weekStart: number; // 0 = Sunday, 1 = Monday
  workingDays: number[];
  holidays: Array<{
    name: string;
    nameAr: string;
    date: string;
    type: 'religious' | 'national' | 'cultural';
  }>;
  businessHours: {
    start: string;
    end: string;
    lunchBreak?: { start: string; end: string };
  };
}

/**
 * Translation entry entity
 */
@Entity('translations')
@Index(['key', 'language'])
export class TranslationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Translation key
   */
  @Column({ length: 255 })
  @Index()
  key: string;

  /**
   * Language code
   */
  @Column({
    type: 'enum',
    enum: SupportedLanguage,
  })
  @Index()
  language: SupportedLanguage;

  /**
   * Translated content
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * Content metadata
   */
  @Column({ type: 'json', nullable: true })
  metadata: {
    direction: TextDirection;
    charset: string;
    context?: string;
    pluralForms?: Record<string, string>;
    formality?: 'formal' | 'informal';
    region?: 'syria' | 'lebanon' | 'general';
  };

  /**
   * Translation status
   */
  @Column({
    type: 'enum',
    enum: ['draft', 'review', 'approved', 'published'],
    default: 'draft',
  })
  status: string;

  /**
   * Who translated this
   */
  @Column({ length: 100, nullable: true })
  translatedBy: string;

  /**
   * Translation quality score
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  qualityScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Injectable()
export class LocalizationService {
  private readonly logger = new Logger(LocalizationService.name);

  // Arabic numerals mapping
  private readonly arabicNumerals = [
    '٠',
    '١',
    '٢',
    '٣',
    '٤',
    '٥',
    '٦',
    '٧',
    '٨',
    '٩',
  ];
  private readonly englishNumerals = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
  ];

  // Syrian cultural settings
  private readonly syrianSettings: SyrianCulturalSettings = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    weekStart: 1, // Monday
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    holidays: [
      {
        name: 'New Year',
        nameAr: 'رأس السنة الميلادية',
        date: '01-01',
        type: 'national',
      },
      {
        name: 'Eid al-Fitr',
        nameAr: 'عيد الفطر',
        date: 'lunar',
        type: 'religious',
      },
      {
        name: 'Eid al-Adha',
        nameAr: 'عيد الأضحى',
        date: 'lunar',
        type: 'religious',
      },
      {
        name: 'Independence Day',
        nameAr: 'عيد الاستقلال',
        date: '17-04',
        type: 'national',
      },
      {
        name: 'Labor Day',
        nameAr: 'عيد العمال',
        date: '01-05',
        type: 'national',
      },
      {
        name: 'Martyrs Day',
        nameAr: 'عيد الشهداء',
        date: '06-05',
        type: 'national',
      },
    ],
    businessHours: {
      start: '08:00',
      end: '17:00',
      lunchBreak: { start: '12:00', end: '13:00' },
    },
  };

  constructor(
    @InjectRepository(TranslationEntity)
    private translationRepo: Repository<TranslationEntity>,
  ) {
    this.initializeCommonTranslations();
  }

  /**
   * Initialize common Arabic translations
   */
  private async initializeCommonTranslations(): Promise<void> {
    try {
      const existingTranslations = await this.translationRepo.count();
      if (existingTranslations > 0) {
        this.logger.log('Translations already initialized');
        return;
      }

      const commonTranslations = [
        // Navigation and UI
        { key: 'nav.home', en: 'Home', ar: 'الرئيسية' },
        { key: 'nav.products', en: 'Products', ar: 'المنتجات' },
        { key: 'nav.categories', en: 'Categories', ar: 'الفئات' },
        { key: 'nav.cart', en: 'Cart', ar: 'السلة' },
        { key: 'nav.orders', en: 'Orders', ar: 'الطلبات' },
        { key: 'nav.account', en: 'Account', ar: 'الحساب' },
        { key: 'nav.about', en: 'About', ar: 'حول' },
        { key: 'nav.contact', en: 'Contact', ar: 'اتصل بنا' },

        // Common actions
        { key: 'action.add', en: 'Add', ar: 'إضافة' },
        { key: 'action.edit', en: 'Edit', ar: 'تعديل' },
        { key: 'action.delete', en: 'Delete', ar: 'حذف' },
        { key: 'action.save', en: 'Save', ar: 'حفظ' },
        { key: 'action.cancel', en: 'Cancel', ar: 'إلغاء' },
        { key: 'action.confirm', en: 'Confirm', ar: 'تأكيد' },
        { key: 'action.search', en: 'Search', ar: 'بحث' },
        { key: 'action.filter', en: 'Filter', ar: 'تصفية' },
        { key: 'action.buy', en: 'Buy Now', ar: 'اشتري الآن' },
        { key: 'action.add_to_cart', en: 'Add to Cart', ar: 'أضف للسلة' },

        // E-commerce specific
        { key: 'product.price', en: 'Price', ar: 'السعر' },
        { key: 'product.quantity', en: 'Quantity', ar: 'الكمية' },
        { key: 'product.available', en: 'Available', ar: 'متوفر' },
        { key: 'product.out_of_stock', en: 'Out of Stock', ar: 'غير متوفر' },
        { key: 'product.description', en: 'Description', ar: 'الوصف' },
        {
          key: 'product.specifications',
          en: 'Specifications',
          ar: 'المواصفات',
        },
        { key: 'product.reviews', en: 'Reviews', ar: 'التقييمات' },

        // Order process
        { key: 'order.checkout', en: 'Checkout', ar: 'إتمام الشراء' },
        { key: 'order.shipping', en: 'Shipping', ar: 'الشحن' },
        { key: 'order.payment', en: 'Payment', ar: 'الدفع' },
        { key: 'order.total', en: 'Total', ar: 'المجموع' },
        { key: 'order.subtotal', en: 'Subtotal', ar: 'المجموع الفرعي' },
        { key: 'order.tax', en: 'Tax', ar: 'الضريبة' },
        { key: 'order.delivery_fee', en: 'Delivery Fee', ar: 'رسوم التوصيل' },

        // Address fields
        { key: 'address.governorate', en: 'Governorate', ar: 'المحافظة' },
        { key: 'address.city', en: 'City', ar: 'المدينة' },
        { key: 'address.district', en: 'District', ar: 'المنطقة' },
        { key: 'address.street', en: 'Street', ar: 'الشارع' },
        { key: 'address.building', en: 'Building', ar: 'المبنى' },
        { key: 'address.floor', en: 'Floor', ar: 'الطابق' },
        { key: 'address.apartment', en: 'Apartment', ar: 'الشقة' },
        { key: 'address.postal_code', en: 'Postal Code', ar: 'الرمز البريدي' },

        // Status messages
        { key: 'status.pending', en: 'Pending', ar: 'في الانتظار' },
        { key: 'status.confirmed', en: 'Confirmed', ar: 'مؤكد' },
        { key: 'status.processing', en: 'Processing', ar: 'قيد المعالجة' },
        { key: 'status.shipped', en: 'Shipped', ar: 'تم الشحن' },
        { key: 'status.delivered', en: 'Delivered', ar: 'تم التسليم' },
        { key: 'status.cancelled', en: 'Cancelled', ar: 'ملغي' },

        // Syrian-specific terms
        { key: 'currency.syp', en: 'Syrian Pound', ar: 'الليرة السورية' },
        { key: 'country.syria', en: 'Syria', ar: 'سوريا' },
        {
          key: 'welcome.syria',
          en: 'Welcome to SouqSyria',
          ar: 'أهلاً بكم في سوق سوريا',
        },
        {
          key: 'support.syrian_business',
          en: 'Supporting Syrian Business',
          ar: 'دعم الأعمال السورية',
        },
      ];

      for (const translation of commonTranslations) {
        // English version
        await this.translationRepo.save({
          key: translation.key,
          language: SupportedLanguage.ENGLISH,
          content: translation.en,
          metadata: {
            direction: TextDirection.LTR,
            charset: 'UTF-8',
          },
          status: 'published',
        });

        // Arabic version
        await this.translationRepo.save({
          key: translation.key,
          language: SupportedLanguage.ARABIC,
          content: translation.ar,
          metadata: {
            direction: TextDirection.RTL,
            charset: 'UTF-8',
            region: 'syria',
          },
          status: 'published',
        });
      }

      this.logger.log(
        `Initialized ${commonTranslations.length * 2} translations`,
      );
    } catch (error: unknown) {
      this.logger.error('Failed to initialize translations', (error as Error).stack);
    }
  }

  /**
   * Get translation by key and language
   */
  async getTranslation(
    key: string,
    language: SupportedLanguage,
  ): Promise<string> {
    const translation = await this.translationRepo.findOne({
      where: {
        key,
        language,
        status: 'published',
      },
    });

    return translation?.content || key;
  }

  /**
   * Get multiple translations
   */
  async getTranslations(
    keys: string[],
    language: SupportedLanguage,
  ): Promise<Record<string, string>> {
    const translations = await this.translationRepo.find({
      where: {
        key: In(keys),
        language,
        status: 'published',
      },
    });

    const result: Record<string, string> = {};
    for (const key of keys) {
      const translation = translations.find((t) => t.key === key);
      result[key] = translation?.content || key;
    }

    return result;
  }

  /**
   * Convert numbers to Arabic numerals
   */
  convertToArabicNumerals(text: string): string {
    return text.replace(/[0-9]/g, (digit) => {
      const index = parseInt(digit, 10);
      return this.arabicNumerals[index];
    });
  }

  /**
   * Convert Arabic numerals to English
   */
  convertToEnglishNumerals(text: string): string {
    return text.replace(/[٠-٩]/g, (digit) => {
      const index = this.arabicNumerals.indexOf(digit);
      return index !== -1 ? this.englishNumerals[index] : digit;
    });
  }

  /**
   * Format number according to Arabic conventions
   */
  formatArabicNumber(
    value: number,
    options: ArabicNumberOptions = {
      useArabicNumerals: true,
      useArabicThousandsSeparator: true,
    },
  ): string {
    let formatted = value.toLocaleString('ar-SY');

    // Use Arabic separators
    if (options.useArabicThousandsSeparator) {
      formatted = formatted.replace(/,/g, '٬'); // Arabic thousands separator
      formatted = formatted.replace(/\./g, '٫'); // Arabic decimal separator
    }

    // Convert to Arabic numerals if requested
    if (options.useArabicNumerals) {
      formatted = this.convertToArabicNumerals(formatted);
    }

    // Add currency if specified
    if (options.currency) {
      const currencySymbols = {
        SYP: 'ل.س',
        USD: '$',
        EUR: '€',
      };
      const symbol = currencySymbols[options.currency];
      formatted =
        options.currency === 'SYP'
          ? `${formatted} ${symbol}`
          : `${symbol}${formatted}`;
    }

    return formatted;
  }

  /**
   * Format date for Syrian locale
   */
  formatSyrianDate(
    date: Date,
    language: SupportedLanguage = SupportedLanguage.ARABIC,
  ): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };

    const locale = language === SupportedLanguage.ARABIC ? 'ar-SY' : 'en-US';
    let formatted = date.toLocaleDateString(locale, options);

    // Convert numerals for Arabic
    if (language === SupportedLanguage.ARABIC) {
      formatted = this.convertToArabicNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Create localized content object
   */
  createLocalizedContent(
    englishText: string,
    arabicText: string,
  ): LocalizedContent {
    return {
      en: englishText,
      ar: arabicText,
      metadata: {
        direction: TextDirection.RTL, // Default to RTL for bilingual content
        charset: 'UTF-8',
        wordCount: arabicText.split(' ').length,
        lastUpdated: new Date(),
      },
    };
  }

  /**
   * Detect if text is Arabic
   */
  isArabicText(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text);
  }

  /**
   * Get text direction for content
   */
  getTextDirection(text: string): TextDirection {
    return this.isArabicText(text) ? TextDirection.RTL : TextDirection.LTR;
  }

  /**
   * Normalize Arabic text for search
   */
  normalizeArabicText(text: string): string {
    return (
      text
        // Remove diacritics
        .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
        // Normalize Alef variations
        .replace(/[آأإ]/g, 'ا')
        // Normalize Teh Marbuta
        .replace(/ة/g, 'ه')
        // Normalize Yeh variations
        .replace(/ي/g, 'ي')
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Get Syrian cultural settings
   */
  getSyrianCulturalSettings(): SyrianCulturalSettings {
    return this.syrianSettings;
  }

  /**
   * Check if date is Syrian holiday
   */
  isSyrianHoliday(date: Date): boolean {
    const dateStr = date.toISOString().substring(5, 10); // MM-DD format
    return this.syrianSettings.holidays.some(
      (holiday) => holiday.date === dateStr || holiday.date === 'lunar', // Lunar dates need special handling
    );
  }

  /**
   * Get working hours for Syrian business
   */
  getSyrianBusinessHours(): typeof this.syrianSettings.businessHours {
    return this.syrianSettings.businessHours;
  }

  /**
   * Format Syrian address
   */
  formatSyrianAddress(
    address: {
      governorate: string;
      city: string;
      district?: string;
      street?: string;
      building?: string;
    },
    language: SupportedLanguage = SupportedLanguage.ARABIC,
  ): string {
    const parts = [];

    if (language === SupportedLanguage.ARABIC) {
      // Arabic format: Building, Street, District, City, Governorate
      if (address.building) parts.push(address.building);
      if (address.street) parts.push(address.street);
      if (address.district) parts.push(address.district);
      parts.push(address.city);
      parts.push(address.governorate);
    } else {
      // English format: Building, Street, District, City, Governorate
      if (address.building) parts.push(address.building);
      if (address.street) parts.push(address.street);
      if (address.district) parts.push(address.district);
      parts.push(address.city);
      parts.push(address.governorate);
    }

    return parts
      .filter(Boolean)
      .join(language === SupportedLanguage.ARABIC ? '، ' : ', ');
  }
}

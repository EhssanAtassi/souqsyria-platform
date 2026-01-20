import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import {
  CurrencyConversion,
  ArabicNumberFormatOptions,
  LanguageSupport
} from '../interfaces/syrian-data.interface';

/**
 * Syrian Formatters Service
 *
 * Provides comprehensive formatting utilities for Syrian marketplace
 * Handles Arabic numerals, Syrian currency, date formatting, and bilingual text
 * Supports cultural preferences and traditional Syrian number representations
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianFormattersService:
 *       type: object
 *       description: Service for Syrian cultural formatting and localization
 *       properties:
 *         currencyConversion:
 *           $ref: '#/components/schemas/CurrencyConversion'
 *         arabicNumbering:
 *           type: boolean
 *           description: Whether to use Arabic numerals
 *         currentLanguage:
 *           type: string
 *           enum: [ar, en]
 */
@Injectable({
  providedIn: 'root'
})
export class SyrianFormattersService {

  private useArabicNumerals$ = new BehaviorSubject<boolean>(false);
  private currentLanguage$ = new BehaviorSubject<'ar' | 'en'>('en');
  private exchangeRates: { [key: string]: number } = {
    'SYP_USD': 0.0004,
    'USD_SYP': 2500,
    'SYP_EUR': 0.00037,
    'EUR_SYP': 2700,
    'SYP_AED': 0.00147,
    'AED_SYP': 680,
    'SYP_SAR': 0.0015,
    'SAR_SYP': 667
  };

  constructor() {}

  // =============================================
  // ARABIC NUMERAL FORMATTING
  // =============================================

  /**
   * Convert Western numerals to Arabic numerals
   * Transforms 0-9 digits to Arabic-Indic numerals ٠-٩
   *
   * @param input - String or number to convert
   * @returns String with Arabic numerals
   *
   * @swagger
   * /api/formatters/arabic-numerals:
   *   post:
   *     tags: [Syrian Formatters]
   *     summary: Convert to Arabic numerals
   *     description: Convert Western digits to Arabic-Indic numerals
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               input:
   *                 type: string
   *                 description: Text containing numbers to convert
   *     responses:
   *       200:
   *         description: Conversion completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 converted:
   *                   type: string
   *                   description: Text with Arabic numerals
   */
  toArabicNumerals(input: string | number): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const inputStr = input.toString();

    return inputStr.replace(/[0-9]/g, (digit) => {
      return arabicNumerals[parseInt(digit)];
    });
  }

  /**
   * Convert Arabic numerals to Western numerals
   * Transforms Arabic-Indic numerals ٠-٩ to 0-9 digits
   *
   * @param input - String with Arabic numerals
   * @returns String with Western numerals
   */
  toWesternNumerals(input: string): string {
    const arabicToWestern: { [key: string]: string } = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };

    return input.replace(/[٠-٩]/g, (digit) => {
      return arabicToWestern[digit] || digit;
    });
  }

  /**
   * Format number with Arabic numerals and cultural preferences
   * Applies Syrian number formatting conventions
   *
   * @param number - Number to format
   * @param options - Formatting options
   * @returns Formatted number string
   */
  formatArabicNumber(number: number, options: Partial<ArabicNumberFormatOptions> = {}): string {
    const defaultOptions: ArabicNumberFormatOptions = {
      useArabicNumerals: this.useArabicNumerals$.value,
      showThousandsSeparator: true,
      decimalPlaces: 0,
      locale: this.currentLanguage$.value === 'ar' ? 'ar-SY' : 'en-US'
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Format number with locale-specific formatting
    const formatted = new Intl.NumberFormat(finalOptions.locale, {
      minimumFractionDigits: finalOptions.decimalPlaces,
      maximumFractionDigits: finalOptions.decimalPlaces,
      useGrouping: finalOptions.showThousandsSeparator
    }).format(number);

    // Convert to Arabic numerals if requested
    return finalOptions.useArabicNumerals ? this.toArabicNumerals(formatted) : formatted;
  }

  // =============================================
  // CURRENCY FORMATTING
  // =============================================

  /**
   * Format Syrian Pound (SYP) currency
   * Applies traditional Syrian currency formatting
   *
   * @param amount - Amount in SYP
   * @param useArabicNumerals - Whether to use Arabic numerals
   * @returns Formatted currency string
   *
   * @swagger
   * /api/formatters/syp-currency:
   *   post:
   *     tags: [Syrian Formatters]
   *     summary: Format SYP currency
   *     description: Format amount in Syrian Pounds with cultural preferences
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               amount:
   *                 type: number
   *                 description: Amount in SYP
   *               useArabicNumerals:
   *                 type: boolean
   *                 description: Use Arabic numerals
   *     responses:
   *       200:
   *         description: Currency formatted successfully
   */
  formatSYP(amount: number, useArabicNumerals?: boolean): string {
    const useArabic = useArabicNumerals ?? this.useArabicNumerals$.value;
    const language = this.currentLanguage$.value;

    if (language === 'ar') {
      const formatted = new Intl.NumberFormat('ar-SY', {
        style: 'currency',
        currency: 'SYP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);

      return useArabic ? this.toArabicNumerals(formatted) : formatted;
    } else {
      const formatted = amount.toLocaleString('en-US') + ' SYP';
      return useArabic ? this.toArabicNumerals(formatted) : formatted;
    }
  }

  /**
   * Format USD currency for Syrian marketplace
   * Formats USD amounts with Syrian cultural preferences
   *
   * @param amount - Amount in USD
   * @param useArabicNumerals - Whether to use Arabic numerals
   * @returns Formatted USD currency string
   */
  formatUSD(amount: number, useArabicNumerals?: boolean): string {
    const useArabic = useArabicNumerals ?? this.useArabicNumerals$.value;
    const language = this.currentLanguage$.value;

    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SY' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);

    return useArabic ? this.toArabicNumerals(formatted) : formatted;
  }

  /**
   * Convert currency amounts between SYP and other currencies
   * Provides real-time currency conversion for Syrian marketplace
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @returns Observable<CurrencyConversion> Conversion result
   */
  convertCurrency(
    amount: number,
    fromCurrency: 'SYP' | 'USD' | 'EUR' | 'AED' | 'SAR',
    toCurrency: 'SYP' | 'USD' | 'EUR' | 'AED' | 'SAR'
  ): Observable<CurrencyConversion> {

    if (fromCurrency === toCurrency) {
      const conversion: CurrencyConversion = {
        fromCurrency,
        toCurrency,
        rate: 1,
        amount,
        convertedAmount: amount,
        lastUpdated: new Date()
      };
      return of(conversion);
    }

    const rateKey = `${fromCurrency}_${toCurrency}`;
    const rate = this.exchangeRates[rateKey] || 1;
    const convertedAmount = amount * rate;

    const conversion: CurrencyConversion = {
      fromCurrency,
      toCurrency,
      rate,
      amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      lastUpdated: new Date()
    };

    return of(conversion);
  }

  /**
   * Format dual currency display (SYP + USD)
   * Shows prices in both Syrian Pounds and US Dollars
   *
   * @param sypAmount - Amount in SYP
   * @returns Formatted dual currency string
   */
  formatDualCurrency(sypAmount: number): string {
    const usdAmount = sypAmount * this.exchangeRates['SYP_USD'];
    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    const sypFormatted = this.formatSYP(sypAmount, useArabic);
    const usdFormatted = this.formatUSD(usdAmount, useArabic);

    if (language === 'ar') {
      return `${sypFormatted} (${usdFormatted})`;
    } else {
      return `${sypFormatted} (${usdFormatted})`;
    }
  }

  // =============================================
  // DATE AND TIME FORMATTING
  // =============================================

  /**
   * Format date with Arabic cultural preferences
   * Applies Syrian date formatting conventions
   *
   * @param date - Date to format
   * @param includeTime - Whether to include time
   * @returns Formatted date string
   *
   * @swagger
   * /api/formatters/arabic-date:
   *   post:
   *     tags: [Syrian Formatters]
   *     summary: Format Arabic date
   *     description: Format date with Syrian cultural preferences
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date:
   *                 type: string
   *                 format: date-time
   *               includeTime:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Date formatted successfully
   */
  formatArabicDate(date: Date, includeTime: boolean = false): string {
    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    const locale = language === 'ar' ? 'ar-SY' : 'en-US';
    const formatted = new Intl.DateTimeFormat(locale, options).format(date);

    return useArabic ? this.toArabicNumerals(formatted) : formatted;
  }

  /**
   * Format time with Syrian cultural preferences
   * Applies traditional Syrian time formatting
   *
   * @param date - Date object to extract time from
   * @param use24Hour - Whether to use 24-hour format
   * @returns Formatted time string
   */
  formatSyrianTime(date: Date, use24Hour: boolean = true): string {
    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    };

    const locale = language === 'ar' ? 'ar-SY' : 'en-US';
    const formatted = new Intl.DateTimeFormat(locale, options).format(date);

    return useArabic ? this.toArabicNumerals(formatted) : formatted;
  }

  /**
   * Get relative time in Arabic
   * Returns human-readable relative time (e.g., "منذ ساعتين", "2 hours ago")
   *
   * @param date - Date to compare
   * @returns Relative time string
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    if (language === 'ar') {
      if (diffMinutes < 1) return 'الآن';
      if (diffMinutes < 60) {
        const minutes = useArabic ? this.toArabicNumerals(diffMinutes.toString()) : diffMinutes;
        return `منذ ${minutes} دقيقة`;
      }
      if (diffHours < 24) {
        const hours = useArabic ? this.toArabicNumerals(diffHours.toString()) : diffHours;
        return `منذ ${hours} ساعة`;
      }
      const days = useArabic ? this.toArabicNumerals(diffDays.toString()) : diffDays;
      return `منذ ${days} يوم`;
    } else {
      if (diffMinutes < 1) return 'now';
      if (diffMinutes < 60) {
        const minutes = useArabic ? this.toArabicNumerals(diffMinutes.toString()) : diffMinutes;
        return `${minutes} minutes ago`;
      }
      if (diffHours < 24) {
        const hours = useArabic ? this.toArabicNumerals(diffHours.toString()) : diffHours;
        return `${hours} hours ago`;
      }
      const days = useArabic ? this.toArabicNumerals(diffDays.toString()) : diffDays;
      return `${days} days ago`;
    }
  }

  // =============================================
  // BUSINESS HOURS FORMATTING
  // =============================================

  /**
   * Format business hours for display
   * Converts business hours to localized, readable format
   *
   * @param openTime - Opening time (HH:mm format)
   * @param closeTime - Closing time (HH:mm format)
   * @returns Formatted business hours string
   */
  formatBusinessHours(openTime: string, closeTime: string): string {
    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    // Parse times
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    const openDate = new Date();
    openDate.setHours(openHour, openMin, 0, 0);

    const closeDate = new Date();
    closeDate.setHours(closeHour, closeMin, 0, 0);

    const openFormatted = this.formatSyrianTime(openDate, true);
    const closeFormatted = this.formatSyrianTime(closeDate, true);

    if (language === 'ar') {
      return `${openFormatted} - ${closeFormatted}`;
    } else {
      return `${openFormatted} - ${closeFormatted}`;
    }
  }

  // =============================================
  // PERCENTAGE AND STATISTICAL FORMATTING
  // =============================================

  /**
   * Format percentage with Arabic numerals
   * Applies Syrian percentage formatting conventions
   *
   * @param value - Percentage value (0-100)
   * @param decimalPlaces - Number of decimal places
   * @returns Formatted percentage string
   */
  formatPercentage(value: number, decimalPlaces: number = 1): string {
    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SY' : 'en-US', {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value / 100);

    return useArabic ? this.toArabicNumerals(formatted) : formatted;
  }

  /**
   * Format file size with Arabic numerals
   * Converts bytes to human-readable format
   *
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    const language = this.currentLanguage$.value;
    const useArabic = this.useArabicNumerals$.value;

    const units = language === 'ar'
      ? ['بايت', 'ك.بايت', 'م.بايت', 'ج.بايت', 'ت.بايت']
      : ['B', 'KB', 'MB', 'GB', 'TB'];

    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const formattedSize = size.toFixed(unitIndex === 0 ? 0 : 1);
    const finalSize = useArabic ? this.toArabicNumerals(formattedSize) : formattedSize;

    return `${finalSize} ${units[unitIndex]}`;
  }

  // =============================================
  // CONFIGURATION METHODS
  // =============================================

  /**
   * Set Arabic numerals preference
   * Updates the global preference for using Arabic numerals
   *
   * @param useArabic - Whether to use Arabic numerals
   */
  setUseArabicNumerals(useArabic: boolean): void {
    this.useArabicNumerals$.next(useArabic);
  }

  /**
   * Get Arabic numerals preference
   * Returns current Arabic numerals setting
   *
   * @returns Observable<boolean> Arabic numerals preference
   */
  getUseArabicNumerals(): Observable<boolean> {
    return this.useArabicNumerals$.asObservable();
  }

  /**
   * Set current language
   * Updates the current language for formatting
   *
   * @param language - Language to set (ar or en)
   */
  setCurrentLanguage(language: 'ar' | 'en'): void {
    this.currentLanguage$.next(language);
  }

  /**
   * Get current language
   * Returns the current language setting
   *
   * @returns Observable<'ar' | 'en'> Current language
   */
  getCurrentLanguage(): Observable<'ar' | 'en'> {
    return this.currentLanguage$.asObservable();
  }

  /**
   * Get supported languages
   * Returns list of supported languages with their configurations
   *
   * @returns Observable<LanguageSupport[]> Supported languages
   */
  getSupportedLanguages(): Observable<LanguageSupport[]> {
    const languages: LanguageSupport[] = [
      {
        code: 'ar',
        name: 'العربية',
        direction: 'rtl',
        isDefault: false,
        dateFormat: 'dd/MM/yyyy',
        numberFormat: '#,##0.###',
        currencyFormat: '#,##0 ج.س'
      },
      {
        code: 'en',
        name: 'English',
        direction: 'ltr',
        isDefault: true,
        dateFormat: 'MM/dd/yyyy',
        numberFormat: '#,##0.###',
        currencyFormat: 'SYP #,##0'
      }
    ];

    return of(languages);
  }

  /**
   * Update exchange rates
   * Updates the current exchange rates for currency conversion
   *
   * @param rates - New exchange rates
   */
  updateExchangeRates(rates: { [key: string]: number }): void {
    this.exchangeRates = { ...this.exchangeRates, ...rates };
  }

  /**
   * Get current exchange rates
   * Returns the current exchange rates
   *
   * @returns Current exchange rates object
   */
  getCurrentExchangeRates(): { [key: string]: number } {
    return { ...this.exchangeRates };
  }
}
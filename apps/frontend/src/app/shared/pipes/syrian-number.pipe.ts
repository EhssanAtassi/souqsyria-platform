import { Pipe, PipeTransform } from '@angular/core';
import { SyrianFormattersService } from '../services/syrian-formatters.service';

/**
 * Syrian Number Pipe
 *
 * Formats numbers according to Syrian cultural preferences
 * Supports thousands separators, decimal places, and Arabic numerals
 *
 * Usage examples:
 * {{ 1234567 | syrianNumber }}                            // "1,234,567"
 * {{ 1234567 | syrianNumber:2 }}                          // "1,234,567.00"
 * {{ 1234567 | syrianNumber:0:true }}                     // "١٬٢٣٤٬٥٦٧"
 * {{ 0.856 | syrianNumber:1:'auto':'percent' }}           // "85.6%"
 * {{ 1024 | syrianNumber:0:'auto':'filesize' }}           // "1 KB"
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianNumberPipe:
 *       type: object
 *       description: Angular pipe for Syrian number formatting
 *       properties:
 *         decimalPlaces:
 *           type: number
 *           description: Number of decimal places
 *         useArabicNumerals:
 *           type: boolean
 *           enum: [true, false, auto]
 *           description: Use Arabic numerals preference
 *         numberType:
 *           type: string
 *           enum: [decimal, percent, filesize, ordinal]
 *           description: Type of number formatting
 */
@Pipe({
  name: 'syrianNumber',
  standalone: true
})
export class SyrianNumberPipe implements PipeTransform {

  constructor(private formattersService: SyrianFormattersService) {}

  /**
   * Transform number to formatted Syrian number string
   * Applies Syrian cultural number formatting preferences
   *
   * @param value - Number to format
   * @param decimalPlaces - Number of decimal places (default: auto)
   * @param useArabicNumerals - Whether to use Arabic numerals (true/false/'auto')
   * @param numberType - Type of number formatting (decimal, percent, filesize, ordinal)
   * @param locale - Specific locale override
   * @returns Formatted number string
   */
  transform(
    value: number,
    decimalPlaces?: number,
    useArabicNumerals: boolean | 'auto' = 'auto',
    numberType: 'decimal' | 'percent' | 'filesize' | 'ordinal' = 'decimal',
    locale?: 'ar' | 'en'
  ): string {

    if (value == null || isNaN(value)) {
      return '';
    }

    // Handle special number types
    switch (numberType) {
      case 'percent':
        return this.formattersService.formatPercentage(value, decimalPlaces || 1);

      case 'filesize':
        return this.formattersService.formatFileSize(value);

      case 'ordinal':
        return this.formatOrdinal(value, useArabicNumerals, locale);

      case 'decimal':
      default:
        return this.formatDecimal(value, decimalPlaces, useArabicNumerals, locale);
    }
  }

  /**
   * Format decimal number
   * Handles standard decimal number formatting
   */
  private formatDecimal(
    value: number,
    decimalPlaces?: number,
    useArabicNumerals: boolean | 'auto' = 'auto',
    locale?: 'ar' | 'en'
  ): string {

    // Determine decimal places
    let finalDecimalPlaces: number;
    if (decimalPlaces !== undefined) {
      finalDecimalPlaces = decimalPlaces;
    } else {
      // Auto-determine decimal places based on value
      if (value % 1 === 0) {
        finalDecimalPlaces = 0; // Whole number
      } else if (value >= 1) {
        finalDecimalPlaces = 2; // Standard decimal
      } else {
        finalDecimalPlaces = 4; // Small decimal
      }
    }

    // Determine if Arabic numerals should be used
    let shouldUseArabic = false;
    if (useArabicNumerals === true) {
      shouldUseArabic = true;
    } else if (useArabicNumerals === 'auto') {
      // Use service preference
      this.formattersService.getUseArabicNumerals().subscribe(preference => {
        shouldUseArabic = preference;
      });
    }

    // Determine locale
    let currentLocale: 'ar' | 'en' = 'en';
    if (locale) {
      currentLocale = locale;
    } else {
      this.formattersService.getCurrentLanguage().subscribe(lang => {
        currentLocale = lang;
      });
    }

    // Format using service
    return this.formattersService.formatArabicNumber(value, {
      useArabicNumerals: shouldUseArabic,
      showThousandsSeparator: true,
      decimalPlaces: finalDecimalPlaces,
      locale: currentLocale === 'ar' ? 'ar-SY' : 'en-US'
    });
  }

  /**
   * Format ordinal number (1st, 2nd, 3rd, etc.)
   * Handles ordinal number formatting for both languages
   */
  private formatOrdinal(
    value: number,
    useArabicNumerals: boolean | 'auto' = 'auto',
    locale?: 'ar' | 'en'
  ): string {

    if (!Number.isInteger(value) || value < 1) {
      return value.toString();
    }

    // Determine if Arabic numerals should be used
    let shouldUseArabic = false;
    if (useArabicNumerals === true) {
      shouldUseArabic = true;
    } else if (useArabicNumerals === 'auto') {
      this.formattersService.getUseArabicNumerals().subscribe(preference => {
        shouldUseArabic = preference;
      });
    }

    // Determine locale
    let currentLocale: 'ar' | 'en' = 'en';
    if (locale) {
      currentLocale = locale;
    } else {
      this.formattersService.getCurrentLanguage().subscribe(lang => {
        currentLocale = lang;
      });
    }

    if (currentLocale === 'ar') {
      // Arabic ordinals
      const numberStr = shouldUseArabic
        ? this.formattersService.toArabicNumerals(value.toString())
        : value.toString();

      // Arabic ordinal suffix patterns
      if (value === 1) {
        return `${numberStr}ـاً`; // الأول
      } else if (value === 2) {
        return `${numberStr}ـاً`; // الثاني
      } else if (value === 3) {
        return `${numberStr}ـاً`; // الثالث
      } else {
        return `${numberStr}ـاً`; // رقم (general pattern)
      }
    } else {
      // English ordinals
      const numberStr = shouldUseArabic
        ? this.formattersService.toArabicNumerals(value.toString())
        : value.toString();

      const lastDigit = value % 10;
      const lastTwoDigits = value % 100;

      let suffix: string;

      if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        suffix = 'th';
      } else {
        switch (lastDigit) {
          case 1:
            suffix = 'st';
            break;
          case 2:
            suffix = 'nd';
            break;
          case 3:
            suffix = 'rd';
            break;
          default:
            suffix = 'th';
        }
      }

      return `${numberStr}${suffix}`;
    }
  }

  /**
   * Format compact number (1K, 1M, 1B)
   * Creates compact representation of large numbers
   */
  formatCompact(
    value: number,
    useArabicNumerals: boolean | 'auto' = 'auto',
    locale?: 'ar' | 'en'
  ): string {

    if (value == null || isNaN(value)) {
      return '';
    }

    // Determine locale
    let currentLocale: 'ar' | 'en' = 'en';
    if (locale) {
      currentLocale = locale;
    } else {
      this.formattersService.getCurrentLanguage().subscribe(lang => {
        currentLocale = lang;
      });
    }

    // Determine if Arabic numerals should be used
    let shouldUseArabic = false;
    if (useArabicNumerals === true) {
      shouldUseArabic = true;
    } else if (useArabicNumerals === 'auto') {
      this.formattersService.getUseArabicNumerals().subscribe(preference => {
        shouldUseArabic = preference;
      });
    }

    // Compact suffixes
    const suffixes = currentLocale === 'ar'
      ? { thousand: 'ألف', million: 'مليون', billion: 'مليار', trillion: 'تريليون' }
      : { thousand: 'K', million: 'M', billion: 'B', trillion: 'T' };

    let formattedValue: string;
    let suffix: string;

    if (Math.abs(value) >= 1e12) {
      formattedValue = (value / 1e12).toFixed(1);
      suffix = suffixes.trillion;
    } else if (Math.abs(value) >= 1e9) {
      formattedValue = (value / 1e9).toFixed(1);
      suffix = suffixes.billion;
    } else if (Math.abs(value) >= 1e6) {
      formattedValue = (value / 1e6).toFixed(1);
      suffix = suffixes.million;
    } else if (Math.abs(value) >= 1e3) {
      formattedValue = (value / 1e3).toFixed(1);
      suffix = suffixes.thousand;
    } else {
      formattedValue = value.toString();
      suffix = '';
    }

    // Remove unnecessary .0
    formattedValue = formattedValue.replace(/\.0$/, '');

    // Apply Arabic numerals if needed
    if (shouldUseArabic) {
      formattedValue = this.formattersService.toArabicNumerals(formattedValue);
    }

    return suffix ? `${formattedValue}${suffix}` : formattedValue;
  }

  /**
   * Format scientific notation
   * Creates scientific notation representation
   */
  formatScientific(
    value: number,
    precision: number = 2,
    useArabicNumerals: boolean | 'auto' = 'auto'
  ): string {

    if (value == null || isNaN(value)) {
      return '';
    }

    // Determine if Arabic numerals should be used
    let shouldUseArabic = false;
    if (useArabicNumerals === true) {
      shouldUseArabic = true;
    } else if (useArabicNumerals === 'auto') {
      this.formattersService.getUseArabicNumerals().subscribe(preference => {
        shouldUseArabic = preference;
      });
    }

    const scientific = value.toExponential(precision);

    return shouldUseArabic
      ? this.formattersService.toArabicNumerals(scientific)
      : scientific;
  }

  /**
   * Format Roman numerals
   * Converts number to Roman numeral representation
   */
  formatRoman(value: number): string {
    if (!Number.isInteger(value) || value < 1 || value > 3999) {
      return value.toString();
    }

    const romanNumerals = [
      { value: 1000, symbol: 'M' },
      { value: 900, symbol: 'CM' },
      { value: 500, symbol: 'D' },
      { value: 400, symbol: 'CD' },
      { value: 100, symbol: 'C' },
      { value: 90, symbol: 'XC' },
      { value: 50, symbol: 'L' },
      { value: 40, symbol: 'XL' },
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' }
    ];

    let result = '';
    let remaining = value;

    for (const numeral of romanNumerals) {
      const count = Math.floor(remaining / numeral.value);
      if (count > 0) {
        result += numeral.symbol.repeat(count);
        remaining -= numeral.value * count;
      }
    }

    return result;
  }
}
/**
 * Currency Formatting Utility
 *
 * Formats prices in Syrian Pound (SYP), USD, and EUR with proper localization.
 * Supports Arabic Eastern numerals and bilingual currency symbols.
 *
 * Features:
 * - SYP formatting with ل.س symbol
 * - Arabic Eastern numerals (١٢٣٤٥٦٧٨٩٠)
 * - Western numerals for English
 * - Thousand separators
 * - RTL-aware formatting
 *
 * @swagger
 * components:
 *   schemas:
 *     CurrencyFormat:
 *       type: object
 *       properties:
 *         formatted:
 *           type: string
 *           example: "125,000 ل.س"
 *         currency:
 *           type: string
 *           example: "SYP"
 *         locale:
 *           type: string
 *           example: "ar"
 */

/**
 * Format SYP Currency
 *
 * Formats amount in Syrian Pounds with proper locale.
 *
 * @param amount - Amount to format
 * @param locale - 'ar' for Arabic or 'en' for English
 * @returns Formatted currency string
 *
 * @example
 * formatSYP(125000, 'ar')  // "١٢٥٬٠٠٠ ل.س"
 * formatSYP(125000, 'en')  // "SYP 125,000"
 */
export function formatSYP(amount: number, locale: 'ar' | 'en' = 'en'): string {
  if (locale === 'ar') {
    // Arabic format with Eastern numerals
    const formatted = new Intl.NumberFormat('ar-SY', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    return `${formatted} ل.س`;
  } else {
    // English format
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    return `SYP ${formatted}`;
  }
}

/**
 * Format Currency (Generic)
 *
 * Formats amount in any currency with proper locale.
 *
 * @param amount - Amount to format
 * @param currency - Currency code (SYP, USD, EUR)
 * @param locale - 'ar' or 'en'
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1250, 'USD', 'en')  // "$1,250.00"
 * formatCurrency(1250, 'EUR', 'ar')  // "١٬٢٥٠٫٠٠ €"
 */
export function formatCurrency(
  amount: number,
  currency: 'SYP' | 'USD' | 'EUR',
  locale: 'ar' | 'en' = 'en'
): string {
  if (currency === 'SYP') {
    return formatSYP(amount, locale);
  }

  const localeCode = locale === 'ar' ? 'ar-SY' : 'en-US';

  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Convert to Eastern Arabic Numerals
 *
 * Converts Western numerals (0-9) to Eastern Arabic numerals (٠-٩).
 *
 * @param text - Text containing Western numerals
 * @returns Text with Eastern Arabic numerals
 *
 * @example
 * toEasternArabicNumerals("125,000")  // "١٢٥٬٠٠٠"
 */
export function toEasternArabicNumerals(text: string): string {
  const westernToEastern: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩'
  };

  return text.replace(/[0-9]/g, digit => westernToEastern[digit] || digit);
}

/**
 * Format Price with Comparison
 *
 * Formats price showing original and discounted amounts.
 *
 * @param originalPrice - Original price
 * @param discountedPrice - Discounted price (optional)
 * @param currency - Currency code
 * @param locale - 'ar' or 'en'
 * @returns Object with formatted prices
 *
 * @example
 * formatPriceWithComparison(150000, 120000, 'SYP', 'ar')
 * // { original: "١٥٠٬٠٠٠ ل.س", discounted: "١٢٠٬٠٠٠ ل.س", savings: "٣٠٬٠٠٠ ل.س" }
 */
export function formatPriceWithComparison(
  originalPrice: number,
  discountedPrice: number | null,
  currency: 'SYP' | 'USD' | 'EUR',
  locale: 'ar' | 'en' = 'en'
): {
  original: string;
  discounted: string | null;
  savings: string | null;
  savingsPercent: number | null;
} {
  const original = formatCurrency(originalPrice, currency, locale);

  if (discountedPrice === null || discountedPrice >= originalPrice) {
    return {
      original,
      discounted: null,
      savings: null,
      savingsPercent: null
    };
  }

  const savings = originalPrice - discountedPrice;
  const savingsPercent = Math.round((savings / originalPrice) * 100);

  return {
    original,
    discounted: formatCurrency(discountedPrice, currency, locale),
    savings: formatCurrency(savings, currency, locale),
    savingsPercent
  };
}

/**
 * Parse Currency String
 *
 * Parses a formatted currency string back to number.
 *
 * @param currencyString - Formatted currency string
 * @returns Numeric amount
 *
 * @example
 * parseCurrency("SYP 125,000")  // 125000
 * parseCurrency("١٢٥٬٠٠٠ ل.س")  // 125000
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols and letters
  let cleanString = currencyString.replace(/[^\d\u0660-\u0669,.]/g, '');

  // Convert Eastern Arabic numerals to Western
  cleanString = cleanString.replace(/[\u0660-\u0669]/g, digit => {
    return String(digit.charCodeAt(0) - 0x0660);
  });

  // Remove thousand separators
  cleanString = cleanString.replace(/,/g, '');

  // Parse to number
  return parseFloat(cleanString) || 0;
}

/**
 * Format Compact Number
 *
 * Formats large numbers in compact notation (e.g., 1.2M, 150K).
 *
 * @param amount - Number to format
 * @param locale - 'ar' or 'en'
 * @returns Compact formatted string
 *
 * @example
 * formatCompactNumber(1250000, 'en')  // "1.3M"
 * formatCompactNumber(150000, 'ar')   // "١٥٠ ألف"
 */
export function formatCompactNumber(amount: number, locale: 'ar' | 'en' = 'en'): string {
  if (locale === 'ar') {
    if (amount >= 1000000) {
      const millions = (amount / 1000000).toFixed(1);
      return `${toEasternArabicNumerals(millions)} مليون`;
    } else if (amount >= 1000) {
      const thousands = Math.floor(amount / 1000);
      return `${toEasternArabicNumerals(String(thousands))} ألف`;
    }
    return toEasternArabicNumerals(amount.toString());
  } else {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }
}

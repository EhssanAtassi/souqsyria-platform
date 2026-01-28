/**
 * @file currency-format.pipe.ts
 * @description Pipe for formatting currency values, with support for Syrian Pound (SYP).
 *              Handles various currency display formats and localization.
 * @module AdminDashboard/SharedPipes
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Currency display format options
 * @description Controls how the currency value is displayed
 */
export type CurrencyDisplayFormat = 'symbol' | 'code' | 'name' | 'none';

/**
 * Currency configuration
 * @description Supported currency configurations
 */
interface CurrencyConfig {
  /** Currency symbol */
  symbol: string;
  /** Currency code */
  code: string;
  /** Currency name */
  name: string;
  /** Decimal places */
  decimals: number;
  /** Symbol position */
  symbolPosition: 'before' | 'after';
}

/**
 * Supported currencies
 */
const CURRENCIES: Record<string, CurrencyConfig> = {
  SYP: {
    symbol: 'ل.س',
    code: 'SYP',
    name: 'Syrian Pound',
    decimals: 0,
    symbolPosition: 'after'
  },
  USD: {
    symbol: '$',
    code: 'USD',
    name: 'US Dollar',
    decimals: 2,
    symbolPosition: 'before'
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'Euro',
    decimals: 2,
    symbolPosition: 'before'
  },
  SAR: {
    symbol: 'ر.س',
    code: 'SAR',
    name: 'Saudi Riyal',
    decimals: 2,
    symbolPosition: 'after'
  },
  AED: {
    symbol: 'د.إ',
    code: 'AED',
    name: 'UAE Dirham',
    decimals: 2,
    symbolPosition: 'after'
  },
  TRY: {
    symbol: '₺',
    code: 'TRY',
    name: 'Turkish Lira',
    decimals: 2,
    symbolPosition: 'before'
  }
};

/**
 * Currency Format Pipe
 * @description Formats numeric values as currency with proper symbols and formatting.
 *              Defaults to Syrian Pound (SYP) for the SouqSyria marketplace.
 *
 * @example
 * ```html
 * <!-- Basic usage (defaults to SYP) -->
 * {{ 1500000 | currencyFormat }}
 * <!-- Output: "1,500,000 ل.س" -->
 *
 * <!-- With currency code -->
 * {{ 99.99 | currencyFormat:'USD' }}
 * <!-- Output: "$99.99" -->
 *
 * <!-- With display format -->
 * {{ 1500000 | currencyFormat:'SYP':'code' }}
 * <!-- Output: "1,500,000 SYP" -->
 *
 * <!-- No symbol -->
 * {{ 1500000 | currencyFormat:'SYP':'none' }}
 * <!-- Output: "1,500,000" -->
 *
 * <!-- Compact format for large numbers -->
 * {{ 1500000 | currencyFormat:'SYP':'symbol':true }}
 * <!-- Output: "1.5M ل.س" -->
 * ```
 */
@Pipe({
  standalone: true,
  name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
  /**
   * Transform a numeric value into formatted currency string
   *
   * @param value - The numeric value to format
   * @param currencyCode - The currency code (default: 'SYP')
   * @param display - Display format: 'symbol', 'code', 'name', or 'none' (default: 'symbol')
   * @param compact - Use compact notation for large numbers (default: false)
   * @returns Formatted currency string
   */
  transform(
    value: number | string | null | undefined,
    currencyCode: string = 'SYP',
    display: CurrencyDisplayFormat = 'symbol',
    compact: boolean = false
  ): string {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return '-';
    }

    // Convert to number
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Handle invalid numbers
    if (isNaN(numValue)) {
      return '-';
    }

    // Get currency config
    const config = CURRENCIES[currencyCode.toUpperCase()] || CURRENCIES['SYP'];

    // Format the number
    let formattedNumber: string;

    if (compact && Math.abs(numValue) >= 1000) {
      formattedNumber = this.formatCompact(numValue);
    } else {
      formattedNumber = this.formatNumber(numValue, config.decimals);
    }

    // Apply currency display
    return this.applyCurrencyDisplay(formattedNumber, config, display);
  }

  /**
   * Format number with thousand separators
   * @param value - Number to format
   * @param decimals - Number of decimal places
   * @returns Formatted number string
   */
  private formatNumber(value: number, decimals: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Format large numbers in compact notation
   * @param value - Number to format
   * @returns Compact formatted string (e.g., "1.5M")
   */
  private formatCompact(value: number): string {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1_000_000_000) {
      return sign + (absValue / 1_000_000_000).toFixed(1) + 'B';
    } else if (absValue >= 1_000_000) {
      return sign + (absValue / 1_000_000).toFixed(1) + 'M';
    } else if (absValue >= 1_000) {
      return sign + (absValue / 1_000).toFixed(1) + 'K';
    }

    return this.formatNumber(value, 0);
  }

  /**
   * Apply currency symbol/code/name to formatted number
   * @param formattedNumber - The formatted number string
   * @param config - Currency configuration
   * @param display - Display format
   * @returns Final formatted currency string
   */
  private applyCurrencyDisplay(
    formattedNumber: string,
    config: CurrencyConfig,
    display: CurrencyDisplayFormat
  ): string {
    if (display === 'none') {
      return formattedNumber;
    }

    let currencyDisplay: string;

    switch (display) {
      case 'code':
        currencyDisplay = config.code;
        break;
      case 'name':
        currencyDisplay = config.name;
        break;
      case 'symbol':
      default:
        currencyDisplay = config.symbol;
        break;
    }

    // Position the currency indicator
    if (config.symbolPosition === 'before') {
      return `${currencyDisplay}${formattedNumber}`;
    } else {
      return `${formattedNumber} ${currencyDisplay}`;
    }
  }
}

/**
 * Helper function to format currency (for use in TypeScript code)
 * @param value - Numeric value
 * @param currencyCode - Currency code (default: 'SYP')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  currencyCode: string = 'SYP'
): string {
  const pipe = new CurrencyFormatPipe();
  return pipe.transform(value, currencyCode);
}

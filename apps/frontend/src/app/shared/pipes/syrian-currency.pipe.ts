import { Pipe, PipeTransform } from '@angular/core';
import { SyrianFormattersService } from '../services/syrian-formatters.service';

/**
 * Syrian Currency Pipe
 *
 * Formats currency amounts according to Syrian cultural preferences
 * Supports SYP, USD, and dual currency display with Arabic numerals
 *
 * Usage examples:
 * {{ 1500000 | syrianCurrency:'SYP' }}                    // "1,500,000 SYP"
 * {{ 600 | syrianCurrency:'USD' }}                        // "$600.00"
 * {{ 1500000 | syrianCurrency:'dual' }}                   // "1,500,000 SYP ($600.00)"
 * {{ 1500000 | syrianCurrency:'SYP':true }}              // "١٬٥٠٠٬٠٠٠ ج.س"
 *
 * @swagger
 * components:
 *   schemas:
 *     SyrianCurrencyPipe:
 *       type: object
 *       description: Angular pipe for Syrian currency formatting
 *       properties:
 *         currencyType:
 *           type: string
 *           enum: [SYP, USD, EUR, AED, SAR, dual]
 *           description: Currency type to format
 *         useArabicNumerals:
 *           type: boolean
 *           description: Whether to use Arabic numerals
 *         showSymbol:
 *           type: boolean
 *           description: Whether to show currency symbol
 */
@Pipe({
  name: 'syrianCurrency',
  standalone: true
})
export class SyrianCurrencyPipe implements PipeTransform {

  constructor(private formattersService: SyrianFormattersService) {}

  /**
   * Transform currency amount to formatted Syrian currency string
   * Applies Syrian cultural formatting preferences
   *
   * @param value - Currency amount to format
   * @param currencyType - Type of currency (SYP, USD, dual, etc.)
   * @param useArabicNumerals - Whether to use Arabic numerals (optional)
   * @param showSymbol - Whether to show currency symbol (optional)
   * @returns Formatted currency string
   */
  transform(
    value: number,
    currencyType: 'SYP' | 'USD' | 'EUR' | 'AED' | 'SAR' | 'dual' = 'SYP',
    useArabicNumerals?: boolean,
    showSymbol: boolean = true
  ): string {

    if (value == null || isNaN(value)) {
      return '';
    }

    switch (currencyType) {
      case 'SYP':
        return this.formattersService.formatSYP(value, useArabicNumerals);

      case 'USD':
        return this.formattersService.formatUSD(value, useArabicNumerals);

      case 'dual':
        return this.formattersService.formatDualCurrency(value);

      case 'EUR':
        return this.formatEUR(value, useArabicNumerals, showSymbol);

      case 'AED':
        return this.formatAED(value, useArabicNumerals, showSymbol);

      case 'SAR':
        return this.formatSAR(value, useArabicNumerals, showSymbol);

      default:
        return this.formattersService.formatSYP(value, useArabicNumerals);
    }
  }

  /**
   * Format EUR currency for Syrian marketplace
   * Helper method for EUR formatting
   */
  private formatEUR(value: number, useArabicNumerals?: boolean, showSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

    if (useArabicNumerals) {
      return this.formattersService.toArabicNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Format AED currency for Syrian marketplace
   * Helper method for AED formatting
   */
  private formatAED(value: number, useArabicNumerals?: boolean, showSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

    if (useArabicNumerals) {
      return this.formattersService.toArabicNumerals(formatted);
    }

    return formatted;
  }

  /**
   * Format SAR currency for Syrian marketplace
   * Helper method for SAR formatting
   */
  private formatSAR(value: number, useArabicNumerals?: boolean, showSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);

    if (useArabicNumerals) {
      return this.formattersService.toArabicNumerals(formatted);
    }

    return formatted;
  }
}
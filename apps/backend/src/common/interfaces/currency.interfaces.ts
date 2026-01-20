/**
 * @file currency.interfaces.ts
 * @description Currency-related interfaces for Syrian localization
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

/**
 * Currency conversion result interface
 */
export interface ConversionResult {
  fromAmount: number;
  fromCurrency: string;
  toAmount: number;
  toCurrency: string;
  exchangeRate: number;
  formattedAmount: string;
  conversionDate: Date;
}

/**
 * Exchange rate update result
 */
export interface ExchangeRateUpdate {
  currency: string;
  previousRate: number;
  newRate: number;
  change: number;
  changePercent: number;
  source: string;
  timestamp: Date;
}

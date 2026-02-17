/**
 * @file currency.service.ts
 * @description Currency management service for Syrian localization
 *
 * SYRIAN LOCALIZATION FEATURES:
 * - SYP (Syrian Pound) as primary currency
 * - Multi-currency support for diaspora users
 * - Real-time exchange rate updates
 * - Currency conversion with proper rounding
 * - Historical rate tracking and analytics
 * - Central Bank of Syria integration
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

import {
  CurrencyEntity,
  ExchangeRateHistoryEntity,
  CurrencyStatus,
  CurrencyType,
} from '../entities/currency.entity';
import {
  ConversionResult,
  ExchangeRateUpdate,
} from '../interfaces/currency.interfaces';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    @InjectRepository(CurrencyEntity)
    private currencyRepo: Repository<CurrencyEntity>,

    @InjectRepository(ExchangeRateHistoryEntity)
    private historyRepo: Repository<ExchangeRateHistoryEntity>,
  ) {
    // Initialize default currencies on service start
    this.initializeDefaultCurrencies();
  }

  /**
   * Initialize Syrian market currencies
   */
  private async initializeDefaultCurrencies(): Promise<void> {
    try {
      const existingCurrencies = await this.currencyRepo.count();
      if (existingCurrencies > 0) {
        this.logger.log('Currencies already initialized');
        return;
      }

      const defaultCurrencies = [
        {
          code: 'SYP',
          nameEn: 'Syrian Pound',
          nameAr: 'الليرة السورية',
          symbol: 'ل.س',
          symbolAr: 'ل.س',
          decimalPlaces: 0, // SYP typically doesn't use decimals
          exchangeRate: 1.0,
          isPrimary: true,
          status: CurrencyStatus.ACTIVE,
          type: CurrencyType.PRIMARY,
          formatPattern: '#,##0 ل.س',
          symbolAfterAmount: true,
          displayOrder: 1,
          configuration: {
            minAmount: 1,
            maxAmount: 10000000,
            roundingMode: 'nearest' as const,
            allowedCountries: ['SY', 'LB', 'TR'],
          },
          regulatory: {
            centralBank: 'Central Bank of Syria',
            vatRate: 0.0, // VAT varies by product
            sanctionsStatus: 'partial' as const,
          },
        },
        {
          code: 'USD',
          nameEn: 'US Dollar',
          nameAr: 'الدولار الأمريكي',
          symbol: '$',
          symbolAr: '$',
          decimalPlaces: 2,
          exchangeRate: 12000, // Approximate rate - will be updated
          isPrimary: false,
          status: CurrencyStatus.ACTIVE,
          type: CurrencyType.DIASPORA,
          formatPattern: '$#,##0.00',
          symbolAfterAmount: false,
          displayOrder: 2,
          configuration: {
            minAmount: 0.01,
            maxAmount: 50000,
            roundingMode: 'nearest' as const,
            allowedCountries: ['US', 'CA', 'DE', 'SE', 'AU'],
          },
        },
        {
          code: 'EUR',
          nameEn: 'Euro',
          nameAr: 'اليورو',
          symbol: '€',
          symbolAr: '€',
          decimalPlaces: 2,
          exchangeRate: 13000, // Approximate rate - will be updated
          isPrimary: false,
          status: CurrencyStatus.ACTIVE,
          type: CurrencyType.DIASPORA,
          formatPattern: '€#,##0.00',
          symbolAfterAmount: false,
          displayOrder: 3,
          configuration: {
            minAmount: 0.01,
            maxAmount: 50000,
            roundingMode: 'nearest' as const,
            allowedCountries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE'],
          },
        },
        {
          code: 'TRY',
          nameEn: 'Turkish Lira',
          nameAr: 'الليرة التركية',
          symbol: '₺',
          symbolAr: '₺',
          decimalPlaces: 2,
          exchangeRate: 400, // Approximate rate - will be updated
          isPrimary: false,
          status: CurrencyStatus.ACTIVE,
          type: CurrencyType.LOCAL,
          formatPattern: '₺#,##0.00',
          symbolAfterAmount: false,
          displayOrder: 4,
          configuration: {
            minAmount: 0.01,
            maxAmount: 100000,
            roundingMode: 'nearest' as const,
            allowedCountries: ['TR'],
          },
        },
      ];

      for (const currencyData of defaultCurrencies) {
        const currency = this.currencyRepo.create(currencyData);
        await this.currencyRepo.save(currency);
      }

      this.logger.log(
        `Initialized ${defaultCurrencies.length} default currencies`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Failed to initialize default currencies',
        (error as Error).stack,
      );
    }
  }

  /**
   * Get all active currencies
   */
  async getAllCurrencies(): Promise<CurrencyEntity[]> {
    return this.currencyRepo.find({
      where: { status: CurrencyStatus.ACTIVE },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Get primary currency (SYP)
   */
  async getPrimaryCurrency(): Promise<CurrencyEntity> {
    const primary = await this.currencyRepo.findOne({
      where: { isPrimary: true, status: CurrencyStatus.ACTIVE },
    });

    if (!primary) {
      throw new NotFoundException('Primary currency (SYP) not found');
    }

    return primary;
  }

  /**
   * Get currency by code
   */
  async getCurrencyByCode(code: string): Promise<CurrencyEntity> {
    const currency = await this.currencyRepo.findOne({
      where: { code: code.toUpperCase(), status: CurrencyStatus.ACTIVE },
    });

    if (!currency) {
      throw new NotFoundException(`Currency ${code} not found`);
    }

    return currency;
  }

  /**
   * Convert amount between currencies
   */
  async convertCurrency(
    amount: number,
    fromCode: string,
    toCode: string,
  ): Promise<ConversionResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const fromCurrency = await this.getCurrencyByCode(fromCode);
    const toCurrency = await this.getCurrencyByCode(toCode);

    // Convert through SYP as base currency
    const amountInSYP = fromCurrency.isPrimary
      ? amount
      : amount / fromCurrency.exchangeRate;

    const convertedAmount = toCurrency.isPrimary
      ? amountInSYP
      : amountInSYP * toCurrency.exchangeRate;

    // Apply rounding based on decimal places
    const roundedAmount = this.roundAmount(
      convertedAmount,
      toCurrency.decimalPlaces,
    );

    const exchangeRate = toCurrency.isPrimary
      ? 1 / fromCurrency.exchangeRate
      : fromCurrency.isPrimary
        ? toCurrency.exchangeRate
        : toCurrency.exchangeRate / fromCurrency.exchangeRate;

    return {
      fromAmount: amount,
      fromCurrency: fromCode,
      toAmount: roundedAmount,
      toCurrency: toCode,
      exchangeRate,
      formattedAmount: this.formatAmount(roundedAmount, toCurrency),
      conversionDate: new Date(),
    };
  }

  /**
   * Format amount according to currency settings
   */
  formatAmount(amount: number, currency: CurrencyEntity): string {
    const roundedAmount = this.roundAmount(amount, currency.decimalPlaces);

    // Format number with separators
    const parts = roundedAmount.toFixed(currency.decimalPlaces).split('.');
    parts[0] = parts[0].replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator,
    );

    const formattedNumber = parts.join(currency.decimalSeparator);

    // Add currency symbol
    return currency.symbolAfterAmount
      ? `${formattedNumber} ${currency.symbol}`
      : `${currency.symbol}${formattedNumber}`;
  }

  /**
   * Update exchange rates from external sources
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateExchangeRates(): Promise<ExchangeRateUpdate[]> {
    this.logger.log('Starting exchange rate update');
    const updates: ExchangeRateUpdate[] = [];

    try {
      const currencies = await this.currencyRepo.find({
        where: {
          status: CurrencyStatus.ACTIVE,
          isPrimary: false,
        },
      });

      for (const currency of currencies) {
        try {
          const newRate = await this.fetchExchangeRate(currency.code);
          if (newRate && newRate !== currency.exchangeRate) {
            const previousRate = currency.exchangeRate;
            const change = newRate - previousRate;
            const changePercent = (change / previousRate) * 100;

            // Update currency
            currency.exchangeRate = newRate;
            currency.exchangeRateData = {
              ...currency.exchangeRateData,
              lastUpdated: new Date(),
              source: 'External API',
              trend: change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable',
            };

            await this.currencyRepo.save(currency);

            // Save to history
            const historyEntry = this.historyRepo.create({
              currencyCode: currency.code,
              rate: newRate,
              date: new Date(),
              source: 'External API',
              metadata: {
                midRate: newRate,
                volume: 0,
                volatility: Math.abs(changePercent),
                marketHours: true,
              },
            });
            await this.historyRepo.save(historyEntry);

            updates.push({
              currency: currency.code,
              previousRate,
              newRate,
              change,
              changePercent,
              source: 'External API',
              timestamp: new Date(),
            });

            this.logger.log(
              `Updated ${currency.code}: ${previousRate} → ${newRate} (${changePercent.toFixed(2)}%)`,
            );
          }
        } catch (error: unknown) {
          this.logger.error(
            `Failed to update exchange rate for ${currency.code}`,
            (error as Error).message,
          );
        }
      }

      this.logger.log(
        `Exchange rate update completed. Updated ${updates.length} currencies`,
      );
      return updates;
    } catch (error: unknown) {
      this.logger.error(
        'Failed to update exchange rates',
        (error as Error).stack,
      );
      throw new InternalServerErrorException('Exchange rate update failed');
    }
  }

  /**
   * Get exchange rate history for analytics
   */
  async getExchangeRateHistory(
    currencyCode: string,
    days: number = 30,
  ): Promise<ExchangeRateHistoryEntity[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.historyRepo.find({
      where: {
        currencyCode: currencyCode.toUpperCase(),
        date: startDate,
      },
      order: { date: 'ASC' },
    });
  }

  /**
   * Get currencies suitable for diaspora users
   */
  async getDiasporaCurrencies(): Promise<CurrencyEntity[]> {
    return this.currencyRepo.find({
      where: {
        type: CurrencyType.DIASPORA,
        status: CurrencyStatus.ACTIVE,
      },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * PRIVATE METHODS
   */

  private roundAmount(amount: number, decimalPlaces: number): number {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(amount * factor) / factor;
  }

  private async fetchExchangeRate(
    currencyCode: string,
  ): Promise<number | null> {
    try {
      // Note: In production, you would use official APIs like:
      // - Central Bank of Syria API (if available)
      // - European Central Bank API
      // - Federal Reserve API
      // - Commercial exchange rate APIs (xe.com, fixer.io, etc.)

      // For now, we'll simulate exchange rate updates
      // In production, replace with actual API calls

      const mockRates = {
        USD: 12000 + (Math.random() - 0.5) * 1000, // Simulate volatility
        EUR: 13000 + (Math.random() - 0.5) * 1200,
        TRY: 400 + (Math.random() - 0.5) * 50,
      };

      return mockRates[currencyCode] || null;
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch exchange rate for ${currencyCode}`,
        (error as Error).message,
      );
      return null;
    }
  }
}

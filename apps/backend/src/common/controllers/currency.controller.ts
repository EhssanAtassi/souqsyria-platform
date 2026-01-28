/**
 * @file currency.controller.ts
 * @description Currency management API for Syrian localization
 *
 * SYRIAN LOCALIZATION FEATURES:
 * - Multi-currency support with SYP as primary
 * - Real-time currency conversion
 * - Exchange rate history and analytics
 * - Diaspora-friendly currency options
 * - Comprehensive Swagger documentation
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CurrencyService } from '../services/currency.service';
import {
  ConversionResult,
  ExchangeRateUpdate,
} from '../interfaces/currency.interfaces';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';

/**
 * Currency conversion request DTO
 */
interface CurrencyConversionDto {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

/**
 * Bulk conversion request DTO
 */
interface BulkConversionDto {
  amounts: Array<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
    reference?: string;
  }>;
}

@ApiTags('Currency & Localization')
@Controller('api/currency')
export class CurrencyController {
  private readonly logger = new Logger(CurrencyController.name);

  constructor(private readonly currencyService: CurrencyService) {}

  /**
   * Get all active currencies
   */
  @Get()
  @ApiOperation({
    summary: 'Get all active currencies',
    description:
      'Retrieves all active currencies including SYP, USD, EUR and their current exchange rates',
  })
  @ApiResponse({
    status: 200,
    description: 'List of active currencies retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          code: { type: 'string', example: 'SYP' },
          nameEn: { type: 'string', example: 'Syrian Pound' },
          nameAr: { type: 'string', example: 'الليرة السورية' },
          symbol: { type: 'string', example: 'ل.س' },
          exchangeRate: { type: 'number', example: 1.0 },
          isPrimary: { type: 'boolean', example: true },
          type: { type: 'string', enum: ['primary', 'diaspora', 'local'] },
          decimalPlaces: { type: 'number', example: 0 },
          formatPattern: { type: 'string', example: '#,##0 ل.س' },
          displayOrder: { type: 'number', example: 1 },
        },
      },
    },
  })
  async getAllCurrencies() {
    this.logger.log('Fetching all active currencies');
    return this.currencyService.getAllCurrencies();
  }

  /**
   * Get primary currency (SYP)
   */
  @Get('primary')
  @ApiOperation({
    summary: 'Get primary currency',
    description:
      'Retrieves the primary currency (Syrian Pound) with current exchange rate data',
  })
  @ApiResponse({
    status: 200,
    description: 'Primary currency retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        code: { type: 'string', example: 'SYP' },
        nameEn: { type: 'string', example: 'Syrian Pound' },
        nameAr: { type: 'string', example: 'الليرة السورية' },
        symbol: { type: 'string', example: 'ل.س' },
        isPrimary: { type: 'boolean', example: true },
        exchangeRate: { type: 'number', example: 1.0 },
        regulatory: {
          type: 'object',
          properties: {
            centralBank: { type: 'string', example: 'Central Bank of Syria' },
            vatRate: { type: 'number', example: 0.0 },
          },
        },
      },
    },
  })
  async getPrimaryCurrency() {
    this.logger.log('Fetching primary currency (SYP)');
    return this.currencyService.getPrimaryCurrency();
  }

  /**
   * Get currencies for diaspora users
   */
  @Get('diaspora')
  @ApiOperation({
    summary: 'Get diaspora currencies',
    description:
      'Retrieves currencies commonly used by Syrian diaspora (USD, EUR) with current rates',
  })
  @ApiResponse({
    status: 200,
    description: 'Diaspora currencies retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'USD' },
          nameEn: { type: 'string', example: 'US Dollar' },
          nameAr: { type: 'string', example: 'الدولار الأمريكي' },
          symbol: { type: 'string', example: '$' },
          exchangeRate: { type: 'number', example: 12000 },
          type: { type: 'string', example: 'diaspora' },
          configuration: {
            type: 'object',
            properties: {
              allowedCountries: {
                type: 'array',
                items: { type: 'string' },
                example: ['US', 'CA', 'DE', 'SE'],
              },
            },
          },
        },
      },
    },
  })
  async getDiasporaCurrencies() {
    this.logger.log('Fetching diaspora currencies');
    return this.currencyService.getDiasporaCurrencies();
  }

  /**
   * Get specific currency by code
   */
  @Get(':code')
  @ApiOperation({
    summary: 'Get currency by code',
    description: 'Retrieves detailed information for a specific currency',
  })
  @ApiParam({
    name: 'code',
    description: 'Currency code (SYP, USD, EUR, TRY)',
    example: 'SYP',
  })
  @ApiResponse({
    status: 200,
    description: 'Currency details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Currency not found',
  })
  async getCurrencyByCode(@Param('code') code: string) {
    this.logger.log(`Fetching currency details for ${code}`);
    return this.currencyService.getCurrencyByCode(code);
  }

  /**
   * Convert currency amounts
   */
  @Post('convert')
  @ApiOperation({
    summary: 'Convert currency amount',
    description:
      'Converts an amount from one currency to another using current exchange rates',
  })
  @ApiBody({
    description: 'Currency conversion request',
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100.0 },
        fromCurrency: { type: 'string', example: 'USD' },
        toCurrency: { type: 'string', example: 'SYP' },
      },
      required: ['amount', 'fromCurrency', 'toCurrency'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Currency conversion completed successfully',
    schema: {
      type: 'object',
      properties: {
        fromAmount: { type: 'number', example: 100.0 },
        fromCurrency: { type: 'string', example: 'USD' },
        toAmount: { type: 'number', example: 1200000 },
        toCurrency: { type: 'string', example: 'SYP' },
        exchangeRate: { type: 'number', example: 12000 },
        formattedAmount: { type: 'string', example: '1,200,000 ل.س' },
        conversionDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid conversion request',
  })
  async convertCurrency(
    @Body() dto: CurrencyConversionDto,
  ): Promise<ConversionResult> {
    this.logger.log(
      `Converting ${dto.amount} ${dto.fromCurrency} to ${dto.toCurrency}`,
    );

    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    if (!dto.fromCurrency || !dto.toCurrency) {
      throw new BadRequestException(
        'Both fromCurrency and toCurrency are required',
      );
    }

    return this.currencyService.convertCurrency(
      dto.amount,
      dto.fromCurrency,
      dto.toCurrency,
    );
  }

  /**
   * Bulk currency conversion
   */
  @Post('convert/bulk')
  @ApiOperation({
    summary: 'Bulk currency conversion',
    description:
      'Converts multiple amounts and currency pairs in a single request',
  })
  @ApiBody({
    description: 'Bulk conversion request',
    schema: {
      type: 'object',
      properties: {
        amounts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: { type: 'number', example: 100.0 },
              fromCurrency: { type: 'string', example: 'USD' },
              toCurrency: { type: 'string', example: 'SYP' },
              reference: { type: 'string', example: 'order-123' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk conversion completed successfully',
    schema: {
      type: 'object',
      properties: {
        conversions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              fromAmount: { type: 'number' },
              fromCurrency: { type: 'string' },
              toAmount: { type: 'number' },
              toCurrency: { type: 'string' },
              exchangeRate: { type: 'number' },
              formattedAmount: { type: 'string' },
            },
          },
        },
        totalProcessed: { type: 'number' },
        processingTime: { type: 'number' },
      },
    },
  })
  async bulkConvertCurrency(@Body() dto: BulkConversionDto) {
    this.logger.log(
      `Processing bulk conversion for ${dto.amounts.length} items`,
    );
    const startTime = Date.now();

    if (!dto.amounts || dto.amounts.length === 0) {
      throw new BadRequestException('At least one conversion is required');
    }

    if (dto.amounts.length > 100) {
      throw new BadRequestException('Maximum 100 conversions per request');
    }

    const conversions = [];
    for (const item of dto.amounts) {
      try {
        const result = await this.currencyService.convertCurrency(
          item.amount,
          item.fromCurrency,
          item.toCurrency,
        );
        conversions.push({
          reference: item.reference,
          ...result,
        });
      } catch (error: unknown) {
        conversions.push({
          reference: item.reference,
          error: (error as Error).message,
        });
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      conversions,
      totalProcessed: dto.amounts.length,
      processingTime,
    };
  }

  /**
   * Get exchange rate history
   */
  @Get(':code/history')
  @ApiOperation({
    summary: 'Get exchange rate history',
    description:
      'Retrieves historical exchange rates for analytics and trending',
  })
  @ApiParam({
    name: 'code',
    description: 'Currency code',
    example: 'USD',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: 'number',
    description: 'Number of days to retrieve (default: 30)',
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          currencyCode: { type: 'string' },
          rate: { type: 'number' },
          date: { type: 'string', format: 'date' },
          source: { type: 'string' },
          metadata: {
            type: 'object',
            properties: {
              change: { type: 'number' },
              changePercent: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getExchangeRateHistory(
    @Param('code') code: string,
    @Query('days') days: number = 30,
  ) {
    this.logger.log(
      `Fetching ${days} days of exchange rate history for ${code}`,
    );

    if (days < 1 || days > 365) {
      throw new BadRequestException('Days must be between 1 and 365');
    }

    return this.currencyService.getExchangeRateHistory(code, days);
  }

  /**
   * Update exchange rates manually (Admin only)
   */
  @Post('rates/update')
  @UseGuards(FirebaseAuthGuard, PermissionsGuard)
  @Permissions('currency.rates.update')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Manually update exchange rates',
    description:
      'Triggers a manual update of all exchange rates from external sources (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates updated successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          currency: { type: 'string' },
          previousRate: { type: 'number' },
          newRate: { type: 'number' },
          change: { type: 'number' },
          changePercent: { type: 'number' },
          source: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async updateExchangeRates(): Promise<ExchangeRateUpdate[]> {
    this.logger.log('Manual exchange rate update triggered');
    return this.currencyService.updateExchangeRates();
  }

  /**
   * Format amount for display
   */
  @Post('format')
  @ApiOperation({
    summary: 'Format amount for display',
    description:
      'Formats a number according to currency-specific formatting rules',
  })
  @ApiBody({
    description: 'Amount formatting request',
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 1234567.89 },
        currencyCode: { type: 'string', example: 'SYP' },
      },
      required: ['amount', 'currencyCode'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Amount formatted successfully',
    schema: {
      type: 'object',
      properties: {
        originalAmount: { type: 'number' },
        formattedAmount: { type: 'string', example: '1,234,568 ل.س' },
        currencyCode: { type: 'string' },
        locale: { type: 'string' },
      },
    },
  })
  async formatAmount(@Body() dto: { amount: number; currencyCode: string }) {
    this.logger.log(
      `Formatting amount ${dto.amount} for currency ${dto.currencyCode}`,
    );

    if (typeof dto.amount !== 'number') {
      throw new BadRequestException('Amount must be a number');
    }

    const currency = await this.currencyService.getCurrencyByCode(
      dto.currencyCode,
    );
    const formattedAmount = this.currencyService.formatAmount(
      dto.amount,
      currency,
    );

    return {
      originalAmount: dto.amount,
      formattedAmount,
      currencyCode: dto.currencyCode,
      locale: currency.code === 'SYP' ? 'ar-SY' : 'en-US',
    };
  }
}

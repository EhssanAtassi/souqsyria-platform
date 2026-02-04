/**
 * @file syrian-dashboard.dto.ts
 * @description Enterprise DTOs for Syrian Dashboard Analytics
 *
 * FEATURES:
 * - Comprehensive validation for Syrian market analytics requests
 * - Arabic/English dual language response support
 * - Date range validation with Syrian calendar considerations
 * - Currency and exchange rate parameter handling
 * - Advanced filtering and reporting parameters
 * - Performance optimized with proper validation rules
 * - Full Swagger documentation with localized examples
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Date range filter DTO
 */
export class DateRangeDto {
  @ApiProperty({
    description: 'Start date for analytics period (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for analytics period (ISO 8601)',
    example: '2025-08-09T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Currency preference DTO
 */
export class CurrencyPreferenceDto {
  @ApiPropertyOptional({
    description: 'Primary currency for display',
    enum: ['SYP', 'USD', 'EUR'],
    example: 'SYP',
  })
  @IsOptional()
  @IsEnum(['SYP', 'USD', 'EUR'])
  primaryCurrency?: 'SYP' | 'USD' | 'EUR';

  @ApiPropertyOptional({
    description: 'Show values in multiple currencies',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  showMultiCurrency?: boolean;

  @ApiPropertyOptional({
    description: 'Use real-time exchange rates',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  useRealTimeRates?: boolean;
}

/**
 * Language preference DTO
 */
export class LanguagePreferenceDto {
  @ApiPropertyOptional({
    description: 'Response language preference',
    enum: ['en', 'ar', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  language?: 'en' | 'ar' | 'both';

  @ApiPropertyOptional({
    description: 'Use Arabic numerals in responses',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  useArabicNumerals?: boolean;

  @ApiPropertyOptional({
    description: 'Format dates in Arabic calendar',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  useHijriDates?: boolean;
}

/**
 * Analytics query parameters DTO
 */
export class SyrianAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range for analytics',
    type: DateRangeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Currency display preferences',
    type: CurrencyPreferenceDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrencyPreferenceDto)
  currency?: CurrencyPreferenceDto;

  @ApiPropertyOptional({
    description: 'Language and localization preferences',
    type: LanguagePreferenceDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguagePreferenceDto)
  localization?: LanguagePreferenceDto;

  @ApiPropertyOptional({
    description: 'Filter by specific Syrian governorates',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(14, { each: true }) // Syria has 14 governorates
  governorateIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by vendor verification status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  verifiedVendorsOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Include KYC compliance metrics',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeKycMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Include manufacturer analytics',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeManufacturerMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Include shipping performance data',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeShippingMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Metric aggregation level',
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    example: 'daily',
  })
  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly', 'monthly'])
  aggregationLevel?: 'hourly' | 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({
    description: 'Include predictive analytics',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  includePredictiveAnalytics?: boolean;

  @ApiPropertyOptional({
    description: 'Cache duration in minutes',
    example: 15,
    minimum: 1,
    maximum: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  cacheDuration?: number;
}

/**
 * Real-time metrics query DTO
 */
export class RealTimeMetricsQueryDto {
  @ApiPropertyOptional({
    description: 'Refresh interval in seconds',
    example: 30,
    minimum: 5,
    maximum: 300,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(300)
  refreshInterval?: number;

  @ApiPropertyOptional({
    description: 'Include system health metrics',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSystemHealth?: boolean;

  @ApiPropertyOptional({
    description: 'Alert severity filter',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  minAlertSeverity?: 'low' | 'medium' | 'high' | 'critical';

  @ApiPropertyOptional({
    description: 'Include performance comparison with previous period',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Language preference for alerts',
    enum: ['en', 'ar', 'both'],
    example: 'ar',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  alertLanguage?: 'en' | 'ar' | 'both';
}

/**
 * Report generation DTO
 */
export class GenerateReportDto {
  @ApiProperty({
    description: 'Report format',
    enum: ['pdf', 'excel', 'json', 'csv'],
    example: 'pdf',
  })
  @IsEnum(['pdf', 'excel', 'json', 'csv'])
  format: 'pdf' | 'excel' | 'json' | 'csv';

  @ApiProperty({
    description: 'Report language',
    enum: ['en', 'ar', 'both'],
    example: 'both',
  })
  @IsEnum(['en', 'ar', 'both'])
  language: 'en' | 'ar' | 'both';

  @ApiPropertyOptional({
    description: 'Date range for report',
    type: DateRangeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Report sections to include',
    example: ['market_overview', 'business_intelligence', 'trends'],
    enum: [
      'market_overview',
      'business_intelligence',
      'trends',
      'performance',
      'kyc_analytics',
      'manufacturer_analytics',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(
    [
      'market_overview',
      'business_intelligence',
      'trends',
      'performance',
      'kyc_analytics',
      'manufacturer_analytics',
    ],
    { each: true },
  )
  sections?: string[];

  @ApiPropertyOptional({
    description: 'Include charts and visualizations',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;

  @ApiPropertyOptional({
    description: 'Report title (English)',
    example: 'SouqSyria Market Analytics Report',
  })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({
    description: 'Report title (Arabic)',
    example: 'تقرير تحليلات السوق - سوق سوريا',
  })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({
    description: 'Email addresses to send report to',
    example: ['admin@souqsyria.com', 'analytics@souqsyria.com'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emailRecipients?: string[];

  @ApiPropertyOptional({
    description: 'Report priority level',
    enum: ['low', 'normal', 'high', 'urgent'],
    example: 'normal',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @ApiPropertyOptional({
    description: 'Schedule recurring reports',
    enum: ['none', 'daily', 'weekly', 'monthly', 'quarterly'],
    example: 'none',
  })
  @IsOptional()
  @IsEnum(['none', 'daily', 'weekly', 'monthly', 'quarterly'])
  recurringSchedule?: 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

/**
 * KPI dashboard query DTO
 */
export class KpiDashboardQueryDto {
  @ApiPropertyOptional({
    description: 'KPI categories to include',
    example: ['revenue', 'orders', 'users', 'vendors'],
    enum: [
      'revenue',
      'orders',
      'users',
      'vendors',
      'products',
      'kyc',
      'manufacturers',
      'shipping',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(
    [
      'revenue',
      'orders',
      'users',
      'vendors',
      'products',
      'kyc',
      'manufacturers',
      'shipping',
    ],
    { each: true },
  )
  kpiCategories?: string[];

  @ApiPropertyOptional({
    description: 'Time period for KPI calculation',
    enum: ['today', 'week', 'month', 'quarter', 'year', 'custom'],
    example: 'month',
  })
  @IsOptional()
  @IsEnum(['today', 'week', 'month', 'quarter', 'year', 'custom'])
  timePeriod?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

  @ApiPropertyOptional({
    description: 'Custom date range (required if timePeriod is custom)',
    type: DateRangeDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  customDateRange?: DateRangeDto;

  @ApiPropertyOptional({
    description: 'Include growth rate comparisons',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeGrowthRates?: boolean;

  @ApiPropertyOptional({
    description: 'Include benchmarking data',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  includeBenchmarks?: boolean;

  @ApiPropertyOptional({
    description: 'Visualization type preference',
    enum: ['numbers', 'charts', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsEnum(['numbers', 'charts', 'both'])
  visualizationType?: 'numbers' | 'charts' | 'both';

  @ApiPropertyOptional({
    description: 'Language preference',
    enum: ['en', 'ar', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  language?: 'en' | 'ar' | 'both';
}

/**
 * Market trends query DTO
 */
export class MarketTrendsQueryDto {
  @ApiPropertyOptional({
    description: 'Trend analysis period in months',
    example: 6,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  analysisPeriodinMonths?: number;

  @ApiPropertyOptional({
    description: 'Product categories to analyze',
    example: ['electronics', 'clothing', 'home_garden'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryFilter?: string[];

  @ApiPropertyOptional({
    description: 'Include seasonal trend analysis',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSeasonalTrends?: boolean;

  @ApiPropertyOptional({
    description: 'Include economic impact analysis',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeEconomicImpact?: boolean;

  @ApiPropertyOptional({
    description: 'Include forecasting predictions',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  includeForecast?: boolean;

  @ApiPropertyOptional({
    description: 'Forecast horizon in months',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  forecastHorizonMonths?: number;

  @ApiPropertyOptional({
    description: 'Focus on specific governorates',
    example: [1, 2], // Damascus, Aleppo
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(14, { each: true })
  focusGovernorates?: number[];

  @ApiPropertyOptional({
    description: 'Include competitor analysis',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  includeCompetitorAnalysis?: boolean;
}

/**
 * Performance monitoring query DTO
 */
export class PerformanceMonitoringQueryDto {
  @ApiPropertyOptional({
    description: 'Monitoring scope',
    enum: ['system', 'business', 'user_experience', 'all'],
    example: 'all',
  })
  @IsOptional()
  @IsEnum(['system', 'business', 'user_experience', 'all'])
  scope?: 'system' | 'business' | 'user_experience' | 'all';

  @ApiPropertyOptional({
    description: 'Metric granularity',
    enum: ['minute', 'hour', 'day'],
    example: 'hour',
  })
  @IsOptional()
  @IsEnum(['minute', 'hour', 'day'])
  granularity?: 'minute' | 'hour' | 'day';

  @ApiPropertyOptional({
    description: 'Alert threshold severity',
    enum: ['info', 'warning', 'error', 'critical'],
    example: 'warning',
  })
  @IsOptional()
  @IsEnum(['info', 'warning', 'error', 'critical'])
  alertThreshold?: 'info' | 'warning' | 'error' | 'critical';

  @ApiPropertyOptional({
    description: 'Include historical comparison',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includeHistoricalComparison?: boolean;

  @ApiPropertyOptional({
    description: 'Real-time monitoring enabled',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  realTimeMonitoring?: boolean;

  @ApiPropertyOptional({
    description: 'Custom metrics to include',
    example: ['api_response_time', 'database_connections', 'cache_hit_rate'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customMetrics?: string[];
}

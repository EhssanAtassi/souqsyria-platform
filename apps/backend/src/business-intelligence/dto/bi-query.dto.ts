/**
 * @file bi-query.dto.ts
 * @description Business Intelligence query DTOs for API endpoints
 * @module BusinessIntelligence/DTO
 * 
 * This file contains DTOs for querying Business Intelligence data,
 * including filtering, pagination, sorting, and aggregation parameters.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsObject,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

// =============================================================================
// BASE QUERY DTOs
// =============================================================================

/**
 * Business Intelligence date range types
 */
export enum BIDateRangeType {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * Period granularity for time-based analysis
 */
export enum BIPeriodGranularity {
  HOUR = 'hour',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Base BI query DTO with common parameters
 */
export class BaseBIQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Predefined date range for analysis',
    enum: BIDateRangeType,
    default: BIDateRangeType.LAST_30_DAYS,
    example: BIDateRangeType.LAST_30_DAYS,
  })
  @IsEnum(BIDateRangeType)
  @IsOptional()
  dateRange?: BIDateRangeType = BIDateRangeType.LAST_30_DAYS;

  @ApiPropertyOptional({
    description: 'Custom start date (ISO string, required when dateRange is custom)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (ISO string, required when dateRange is custom)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Time zone for date calculations',
    example: 'Asia/Damascus',
    default: 'UTC',
  })
  @IsString()
  @IsOptional()
  timezone?: string = 'UTC';

  @ApiPropertyOptional({
    description: 'Period granularity for time-based aggregation',
    enum: BIPeriodGranularity,
    default: BIPeriodGranularity.DAILY,
  })
  @IsEnum(BIPeriodGranularity)
  @IsOptional()
  granularity?: BIPeriodGranularity = BIPeriodGranularity.DAILY;

  @ApiPropertyOptional({
    description: 'Whether to compare with previous period',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  compareWithPrevious?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filter by user IDs',
    type: [Number],
    example: [1, 2, 3],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(100)
  userIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by vendor IDs',
    type: [Number],
    example: [1, 2, 3],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(50)
  vendorIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by product IDs',
    type: [Number],
    example: [1, 2, 3],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(100)
  productIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by category IDs',
    type: [Number],
    example: [1, 2, 3],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  @ArrayMaxSize(50)
  categoryIds?: number[];
}

/**
 * Advanced filtering options
 */
export class BIAdvancedFilterDto {
  @ApiPropertyOptional({
    description: 'Customer segment filters',
    type: [String],
    example: ['high_value', 'loyal_customers'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customerSegments?: string[];

  @ApiPropertyOptional({
    description: 'Device type filters',
    type: [String],
    enum: ['desktop', 'tablet', 'mobile'],
    example: ['desktop', 'mobile'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deviceTypes?: ('desktop' | 'tablet' | 'mobile')[];

  @ApiPropertyOptional({
    description: 'Traffic source filters',
    type: [String],
    example: ['organic', 'paid_search', 'email'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  trafficSources?: string[];

  @ApiPropertyOptional({
    description: 'Geographic filters (country codes)',
    type: [String],
    example: ['SY', 'LB', 'JO'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  countryCodes?: string[];

  @ApiPropertyOptional({
    description: 'Minimum order value filter',
    example: 100000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderValue?: number;

  @ApiPropertyOptional({
    description: 'Maximum order value filter',
    example: 5000000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxOrderValue?: number;

  @ApiPropertyOptional({
    description: 'Custom property filters (JSON object)',
    example: { brand: 'Samsung', category: 'Electronics' },
  })
  @IsObject()
  @IsOptional()
  customFilters?: Record<string, any>;
}

// =============================================================================
// CLV QUERY DTOs
// =============================================================================

/**
 * CLV calculation method enumeration
 */
export enum CLVMethodDto {
  HISTORICAL = 'historical',
  PREDICTIVE = 'predictive',
  TRADITIONAL = 'traditional',
  COHORT_BASED = 'cohort_based',
}

/**
 * Customer Lifetime Value query DTO
 */
export class CLVQueryDto extends BaseBIQueryDto {
  @ApiPropertyOptional({
    description: 'CLV calculation method',
    enum: CLVMethodDto,
    default: CLVMethodDto.HISTORICAL,
  })
  @IsEnum(CLVMethodDto)
  @IsOptional()
  calculationMethod?: CLVMethodDto = CLVMethodDto.HISTORICAL;

  @ApiPropertyOptional({
    description: 'Include CLV predictions',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includePredictions?: boolean = false;

  @ApiPropertyOptional({
    description: 'Prediction horizon in days',
    example: 365,
    minimum: 30,
    maximum: 1825,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(1825)
  @IsOptional()
  predictionHorizon?: number = 365;

  @ApiPropertyOptional({
    description: 'Confidence level for predictions (0.8, 0.9, 0.95)',
    example: 0.95,
    minimum: 0.8,
    maximum: 0.99,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.8)
  @Max(0.99)
  @IsOptional()
  confidenceLevel?: number = 0.95;

  @ApiPropertyOptional({
    description: 'Customer segmentation to include',
    type: [String],
    example: ['champions', 'loyal_customers', 'potential_loyalists'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  segments?: string[];

  @ApiPropertyOptional({
    description: 'Include gross margin in calculations',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeGrossMargin?: boolean = true;

  @ApiPropertyOptional({
    description: 'Advanced filtering options',
    type: BIAdvancedFilterDto,
  })
  @ValidateNested()
  @Type(() => BIAdvancedFilterDto)
  @IsOptional()
  advancedFilters?: BIAdvancedFilterDto;
}

// =============================================================================
// FUNNEL QUERY DTOs
// =============================================================================

/**
 * Funnel analysis query DTO
 */
export class FunnelQueryDto extends BaseBIQueryDto {
  @ApiProperty({
    description: 'Funnel ID to analyze',
    example: 'funnel_checkout_001',
  })
  @IsString()
  funnelId: string;

  @ApiPropertyOptional({
    description: 'Include drop-off analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDropOffAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include segment comparison',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeSegmentAnalysis?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include channel performance breakdown',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeChannelAnalysis?: boolean = false;

  @ApiPropertyOptional({
    description: 'Attribution window in hours',
    example: 24,
    minimum: 1,
    maximum: 720,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(720)
  @IsOptional()
  attributionWindow?: number = 24;

  @ApiPropertyOptional({
    description: 'Advanced filtering options',
    type: BIAdvancedFilterDto,
  })
  @ValidateNested()
  @Type(() => BIAdvancedFilterDto)
  @IsOptional()
  advancedFilters?: BIAdvancedFilterDto;
}

/**
 * Multiple funnels comparison query DTO
 */
export class FunnelComparisonQueryDto extends BaseBIQueryDto {
  @ApiProperty({
    description: 'Funnel IDs to compare',
    type: [String],
    example: ['funnel_checkout_001', 'funnel_checkout_002'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  funnelIds: string[];

  @ApiPropertyOptional({
    description: 'Include statistical significance testing',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeSignificanceTest?: boolean = true;

  @ApiPropertyOptional({
    description: 'Significance threshold (p-value)',
    example: 0.05,
    minimum: 0.01,
    maximum: 0.1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(0.1)
  @IsOptional()
  significanceThreshold?: number = 0.05;
}

// =============================================================================
// CART ABANDONMENT QUERY DTOs
// =============================================================================

/**
 * Cart abandonment analysis query DTO
 */
export class CartAbandonmentQueryDto extends BaseBIQueryDto {
  @ApiPropertyOptional({
    description: 'Include abandonment reason analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeReasonAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include recovery campaign effectiveness',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRecoveryAnalysis?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include high-value abandonment insights',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeHighValueAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Minimum cart value threshold for analysis',
    example: 50000,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minCartValue?: number;

  @ApiPropertyOptional({
    description: 'Abandonment stages to include',
    type: [String],
    example: ['checkout_initiated', 'payment_method', 'order_review'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  abandonmentStages?: string[];

  @ApiPropertyOptional({
    description: 'Advanced filtering options',
    type: BIAdvancedFilterDto,
  })
  @ValidateNested()
  @Type(() => BIAdvancedFilterDto)
  @IsOptional()
  advancedFilters?: BIAdvancedFilterDto;
}

/**
 * Cart recovery campaign query DTO
 */
export class CartRecoveryCampaignQueryDto extends BaseBIQueryDto {
  @ApiPropertyOptional({
    description: 'Campaign IDs to analyze',
    type: [String],
    example: ['campaign_email_001', 'campaign_sms_002'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  campaignIds?: string[];

  @ApiPropertyOptional({
    description: 'Campaign types to include',
    type: [String],
    enum: ['email', 'sms', 'push_notification', 'retargeting_ad'],
    example: ['email', 'sms'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  campaignTypes?: ('email' | 'sms' | 'push_notification' | 'retargeting_ad')[];

  @ApiPropertyOptional({
    description: 'Include A/B test results',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeABTestResults?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include ROI analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeROIAnalysis?: boolean = true;
}

// =============================================================================
// COHORT QUERY DTOs
// =============================================================================

/**
 * Cohort analysis query DTO
 */
export class CohortQueryDto extends BaseBIQueryDto {
  @ApiPropertyOptional({
    description: 'Cohort IDs to analyze',
    type: [String],
    example: ['cohort_2024_q1', 'cohort_2024_q2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(20)
  cohortIds?: string[];

  @ApiPropertyOptional({
    description: 'Cohort types to include',
    type: [String],
    enum: ['time_based', 'acquisition_channel', 'behavioral', 'geographic', 'revenue_based'],
    example: ['time_based', 'acquisition_channel'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cohortTypes?: string[];

  @ApiPropertyOptional({
    description: 'Metrics to track in cohort analysis',
    type: [String],
    enum: ['retention', 'revenue_retention', 'purchase_frequency', 'average_order_value', 'cumulative_revenue'],
    example: ['retention', 'revenue_retention'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metrics?: string[];

  @ApiPropertyOptional({
    description: 'Include revenue analysis',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRevenueAnalysis?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include behavioral patterns',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeBehavioralPatterns?: boolean = false;

  @ApiPropertyOptional({
    description: 'Maximum cohort age in days',
    example: 365,
    minimum: 30,
    maximum: 1095,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(1095)
  @IsOptional()
  maxCohortAge?: number = 365;

  @ApiPropertyOptional({
    description: 'Minimum cohort size for statistical significance',
    example: 100,
    minimum: 10,
    maximum: 10000,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(10000)
  @IsOptional()
  minCohortSize?: number = 100;
}

// =============================================================================
// EVENT TRACKING QUERY DTOs
// =============================================================================

/**
 * Event analytics query DTO
 */
export class EventAnalyticsQueryDto extends BaseBIQueryDto {
  @ApiPropertyOptional({
    description: 'Event names to analyze',
    type: [String],
    example: ['product_view', 'add_to_cart', 'purchase'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(50)
  eventNames?: string[];

  @ApiPropertyOptional({
    description: 'Event categories to include',
    type: [String],
    enum: ['user_interaction', 'ecommerce', 'navigation', 'marketing', 'search'],
    example: ['ecommerce', 'user_interaction'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eventCategories?: string[];

  @ApiPropertyOptional({
    description: 'Include session analysis',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeSessionAnalysis?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include correlation analysis',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeCorrelationAnalysis?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include real-time metrics',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRealTimeMetrics?: boolean = false;

  @ApiPropertyOptional({
    description: 'Event property filters (JSON object)',
    example: { page_category: 'product', user_type: 'registered' },
  })
  @IsObject()
  @IsOptional()
  eventPropertyFilters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Advanced filtering options',
    type: BIAdvancedFilterDto,
  })
  @ValidateNested()
  @Type(() => BIAdvancedFilterDto)
  @IsOptional()
  advancedFilters?: BIAdvancedFilterDto;
}

// =============================================================================
// EXPORT AND REPORTING QUERY DTOs
// =============================================================================

/**
 * Export format enumeration
 */
export enum BIExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
  JSON = 'json',
}

/**
 * BI report export query DTO
 */
export class BIExportQueryDto {
  @ApiProperty({
    description: 'Report type to export',
    enum: ['clv', 'funnel', 'cart_abandonment', 'cohort', 'events'],
    example: 'clv',
  })
  @IsEnum(['clv', 'funnel', 'cart_abandonment', 'cohort', 'events'])
  reportType: 'clv' | 'funnel' | 'cart_abandonment' | 'cohort' | 'events';

  @ApiProperty({
    description: 'Export format',
    enum: BIExportFormat,
    example: BIExportFormat.XLSX,
  })
  @IsEnum(BIExportFormat)
  format: BIExportFormat;

  @ApiPropertyOptional({
    description: 'Query parameters for the report (JSON object)',
    example: { dateRange: 'last_30_days', includeSegmentAnalysis: true },
  })
  @IsObject()
  @IsOptional()
  queryParams?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Columns to include in export',
    type: [String],
    example: ['customer_id', 'clv_value', 'segment', 'first_purchase_date'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(50)
  columns?: string[];

  @ApiPropertyOptional({
    description: 'Custom export title',
    example: 'Customer Lifetime Value Report - Q1 2024',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Include visualizations in export',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  includeVisualizations?: boolean = false;
}
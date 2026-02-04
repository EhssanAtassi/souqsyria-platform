/**
 * @file refund-analytics-query.dto.ts
 * @description Refund Analytics Query DTO
 *
 * FEATURES:
 * - Date range analytics queries
 * - Grouping and aggregation options
 * - Performance metrics filtering
 * - Business intelligence parameters
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AnalyticsGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum AnalyticsMetric {
  COUNT = 'count',
  AMOUNT = 'amount',
  PROCESSING_TIME = 'processing_time',
  SUCCESS_RATE = 'success_rate',
  CUSTOMER_SATISFACTION = 'customer_satisfaction',
}

export class RefundAnalyticsQueryDto {
  @ApiProperty({
    description: 'Analytics start date',
    example: '2025-01-01T00:00:00Z',
    format: 'date-time',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString({}, { message: 'Invalid start date format' })
  startDate: string;

  @ApiProperty({
    description: 'Analytics end date',
    example: '2025-12-31T23:59:59Z',
    format: 'date-time',
  })
  @IsNotEmpty({ message: 'End date is required' })
  @IsDateString({}, { message: 'Invalid end date format' })
  endDate: string;

  @ApiPropertyOptional({
    description: 'Group results by time period',
    enum: AnalyticsGroupBy,
    example: AnalyticsGroupBy.MONTH,
    default: AnalyticsGroupBy.MONTH,
  })
  @IsOptional()
  @IsEnum(AnalyticsGroupBy, { message: 'Invalid group by option' })
  groupBy?: AnalyticsGroupBy = AnalyticsGroupBy.MONTH;

  @ApiPropertyOptional({
    description: 'Include specific metrics in the analysis',
    enum: AnalyticsMetric,
    isArray: true,
    example: [
      AnalyticsMetric.COUNT,
      AnalyticsMetric.AMOUNT,
      AnalyticsMetric.PROCESSING_TIME,
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Metrics must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 metrics allowed' })
  @IsEnum(AnalyticsMetric, { each: true, message: 'Invalid metric' })
  metrics?: AnalyticsMetric[];

  @ApiPropertyOptional({
    description: 'Include trend analysis',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Include trends must be boolean' })
  includeTrends?: boolean = true;

  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    example: true,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Include comparison must be boolean' })
  includeComparison?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include detailed breakdown by categories',
    example: true,
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Include breakdown must be boolean' })
  includeBreakdown?: boolean = true;
}

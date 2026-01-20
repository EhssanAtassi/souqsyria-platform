/**
 * @file vendor-analytics.dto.ts
 * @description DTOs for vendor analytics and business intelligence
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Time period filter for analytics queries
 */
export enum AnalyticsPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Currency type for financial data
 */
export enum CurrencyType {
  SYP = 'SYP',
  USD = 'USD',
}

/**
 * Product performance analytics DTO
 */
export class ProductPerformanceDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: 'prod_xyz789',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Product name in English',
    example: 'Damascus Steel Chef Knife',
  })
  @IsString()
  nameEn: string;

  @ApiProperty({
    description: 'Product name in Arabic',
    example: 'سكين شيف من الصلب الدمشقي',
  })
  @IsString()
  nameAr: string;

  @ApiProperty({
    description: 'Total units sold',
    example: 45,
  })
  @IsNumber()
  @Min(0)
  unitsSold: number;

  @ApiProperty({
    description: 'Total revenue in SYP',
    example: 2250000,
  })
  @IsNumber()
  @Min(0)
  revenueSyp: number;

  @ApiProperty({
    description: 'Total revenue in USD',
    example: 450.00,
  })
  @IsNumber()
  @Min(0)
  revenueUsd: number;

  @ApiProperty({
    description: 'Product views count',
    example: 892,
  })
  @IsNumber()
  @Min(0)
  views: number;

  @ApiProperty({
    description: 'Conversion rate (views to purchases)',
    example: 5.04,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate: number;

  @ApiProperty({
    description: 'Average rating (0-5)',
    example: 4.8,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  averageRating: number;
}

/**
 * Customer demographics analytics DTO
 */
export class CustomerDemographicsDto {
  @ApiProperty({
    description: 'Governorate name in English',
    example: 'Damascus',
  })
  @IsString()
  governorateEn: string;

  @ApiProperty({
    description: 'Governorate name in Arabic',
    example: 'دمشق',
  })
  @IsString()
  governorateAr: string;

  @ApiProperty({
    description: 'Number of customers from this region',
    example: 156,
  })
  @IsNumber()
  @Min(0)
  customerCount: number;

  @ApiProperty({
    description: 'Percentage of total customers',
    example: 42.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({
    description: 'Total revenue from this region in SYP',
    example: 6750000,
  })
  @IsNumber()
  @Min(0)
  revenueSyp: number;

  @ApiProperty({
    description: 'Total revenue from this region in USD',
    example: 1350.00,
  })
  @IsNumber()
  @Min(0)
  revenueUsd: number;
}

/**
 * Traffic source analytics DTO
 */
export class TrafficSourceDto {
  @ApiProperty({
    description: 'Traffic source name',
    example: 'Organic Search',
  })
  @IsString()
  source: string;

  @ApiProperty({
    description: 'Number of visits',
    example: 1245,
  })
  @IsNumber()
  @Min(0)
  visits: number;

  @ApiProperty({
    description: 'Percentage of total traffic',
    example: 38.2,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiProperty({
    description: 'Conversion rate from this source',
    example: 6.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  conversionRate: number;
}

/**
 * Sales funnel analytics DTO
 */
export class SalesFunnelDto {
  @ApiProperty({
    description: 'Product page views',
    example: 5420,
  })
  @IsNumber()
  @Min(0)
  productViews: number;

  @ApiProperty({
    description: 'Add to cart actions',
    example: 892,
  })
  @IsNumber()
  @Min(0)
  addedToCart: number;

  @ApiProperty({
    description: 'Checkout initiated',
    example: 458,
  })
  @IsNumber()
  @Min(0)
  checkoutStarted: number;

  @ApiProperty({
    description: 'Completed purchases',
    example: 234,
  })
  @IsNumber()
  @Min(0)
  completed: number;

  @ApiProperty({
    description: 'View to cart conversion rate',
    example: 16.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  viewToCartRate: number;

  @ApiProperty({
    description: 'Cart to checkout conversion rate',
    example: 51.3,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  cartToCheckoutRate: number;

  @ApiProperty({
    description: 'Checkout to purchase conversion rate',
    example: 51.1,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  checkoutToCompleteRate: number;
}

/**
 * Main vendor analytics response DTO
 * Comprehensive business intelligence dashboard data
 */
export class VendorAnalyticsDto {
  @ApiProperty({
    description: 'Analytics period',
    enum: AnalyticsPeriod,
    example: AnalyticsPeriod.MONTH,
  })
  @IsEnum(AnalyticsPeriod)
  period: AnalyticsPeriod;

  @ApiProperty({
    description: 'Currency for financial data',
    enum: CurrencyType,
    example: CurrencyType.SYP,
  })
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @ApiProperty({
    description: 'Top performing products',
    type: [ProductPerformanceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPerformanceDto)
  topProducts: ProductPerformanceDto[];

  @ApiProperty({
    description: 'Customer geographic distribution',
    type: [CustomerDemographicsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerDemographicsDto)
  customerDemographics: CustomerDemographicsDto[];

  @ApiProperty({
    description: 'Traffic sources breakdown',
    type: [TrafficSourceDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrafficSourceDto)
  trafficSources: TrafficSourceDto[];

  @ApiProperty({
    description: 'Sales funnel conversion metrics',
    type: SalesFunnelDto,
  })
  @ValidateNested()
  @Type(() => SalesFunnelDto)
  salesFunnel: SalesFunnelDto;

  @ApiProperty({
    description: 'Total revenue for the period in SYP',
    example: 15750000,
  })
  @IsNumber()
  @Min(0)
  totalRevenueSyp: number;

  @ApiProperty({
    description: 'Total revenue for the period in USD',
    example: 3150.00,
  })
  @IsNumber()
  @Min(0)
  totalRevenueUsd: number;

  @ApiProperty({
    description: 'Growth percentage compared to previous period',
    example: 12.5,
  })
  @IsNumber()
  growthPercentage: number;
}

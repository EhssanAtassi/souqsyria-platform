/**
 * @file vendor-dashboard-overview.dto.ts
 * @description DTOs for vendor dashboard overview data
 * Matches frontend interface: VendorDashboardOverview
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsArray, ValidateNested, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Vendor verification status enum
 */
export enum VendorVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

/**
 * Performance grade enum (A+ to F)
 */
export enum PerformanceGrade {
  A_PLUS = 'A+',
  A = 'A',
  B_PLUS = 'B+',
  B = 'B',
  C_PLUS = 'C+',
  C = 'C',
  D_PLUS = 'D+',
  D = 'D',
  F = 'F',
}

/**
 * Alert/notification severity types
 */
export enum AlertType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Vendor basic information DTO
 */
export class VendorInfoDto {
  @ApiProperty({
    description: 'Unique vendor identifier',
    example: 'vnd_abc123xyz',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Store name in English',
    example: 'Damascus Artisan Crafts',
  })
  @IsString()
  storeNameEn: string;

  @ApiProperty({
    description: 'Store name in Arabic',
    example: 'حرف دمشق اليدوية',
  })
  @IsString()
  storeNameAr: string;

  @ApiProperty({
    description: 'Vendor verification status',
    enum: VendorVerificationStatus,
    example: VendorVerificationStatus.VERIFIED,
  })
  @IsEnum(VendorVerificationStatus)
  verificationStatus: VendorVerificationStatus;

  @ApiProperty({
    description: 'Performance grade from A+ to F',
    enum: PerformanceGrade,
    example: PerformanceGrade.A,
  })
  @IsEnum(PerformanceGrade)
  performanceGrade: PerformanceGrade;
}

/**
 * Key performance metrics DTO
 */
export class VendorKeyMetricsDto {
  @ApiProperty({
    description: 'Total revenue in Syrian Pounds',
    example: 15750000,
  })
  @IsNumber()
  @Min(0)
  totalRevenueSyp: number;

  @ApiProperty({
    description: 'Total revenue in USD',
    example: 3150.00,
  })
  @IsNumber()
  @Min(0)
  totalRevenueUsd: number;

  @ApiProperty({
    description: 'Revenue growth percentage',
    example: 12.5,
  })
  @IsNumber()
  revenueGrowth: number;

  @ApiProperty({
    description: 'Total number of orders',
    example: 234,
  })
  @IsNumber()
  @Min(0)
  totalOrders: number;

  @ApiProperty({
    description: 'Order growth percentage',
    example: 8.3,
  })
  @IsNumber()
  ordersGrowth: number;

  @ApiProperty({
    description: 'Order fulfillment rate (0-100)',
    example: 94.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  fulfillmentRate: number;

  @ApiProperty({
    description: 'Average delivery time in hours',
    example: 36.5,
  })
  @IsNumber()
  @Min(0)
  averageDeliveryTime: number;

  @ApiProperty({
    description: 'Customer satisfaction rating (0-5)',
    example: 4.7,
  })
  @IsNumber()
  @Min(0)
  @Max(5)
  customerSatisfactionRating: number;

  @ApiProperty({
    description: 'Total number of customer reviews',
    example: 187,
  })
  @IsNumber()
  @Min(0)
  totalReviews: number;

  @ApiProperty({
    description: 'Average response time to customer inquiries in hours',
    example: 2.5,
  })
  @IsNumber()
  @Min(0)
  averageResponseTime: number;
}

/**
 * Daily sales data point for chart visualization
 */
export class DailySalesDataPointDto {
  @ApiProperty({
    description: 'Date in ISO format',
    example: '2025-01-20',
  })
  @IsString()
  date: string;

  @ApiProperty({
    description: 'Sales amount in SYP',
    example: 450000,
  })
  @IsNumber()
  @Min(0)
  salesSyp: number;

  @ApiProperty({
    description: 'Sales amount in USD',
    example: 90.00,
  })
  @IsNumber()
  @Min(0)
  salesUsd: number;

  @ApiProperty({
    description: 'Number of orders',
    example: 12,
  })
  @IsNumber()
  @Min(0)
  orders: number;
}

/**
 * Category distribution data point for pie chart
 */
export class CategoryDistributionDataPointDto {
  @ApiProperty({
    description: 'Category name in English',
    example: 'Damascus Steel',
  })
  @IsString()
  categoryNameEn: string;

  @ApiProperty({
    description: 'Category name in Arabic',
    example: 'الصلب الدمشقي',
  })
  @IsString()
  categoryNameAr: string;

  @ApiProperty({
    description: 'Revenue in SYP',
    example: 5250000,
  })
  @IsNumber()
  @Min(0)
  revenueSyp: number;

  @ApiProperty({
    description: 'Revenue in USD',
    example: 1050.00,
  })
  @IsNumber()
  @Min(0)
  revenueUsd: number;

  @ApiProperty({
    description: 'Percentage of total revenue',
    example: 33.3,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

/**
 * Performance trend data point for area chart
 */
export class PerformanceTrendDataPointDto {
  @ApiProperty({
    description: 'Date in ISO format',
    example: '2025-01-20',
  })
  @IsString()
  date: string;

  @ApiProperty({
    description: 'Quality score (0-100)',
    example: 92.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore: number;

  @ApiProperty({
    description: 'Fulfillment rate (0-100)',
    example: 94.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  fulfillmentRate: number;

  @ApiProperty({
    description: 'Customer satisfaction (0-100)',
    example: 94.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  customerSatisfaction: number;
}

/**
 * Charts data container DTO
 */
export class VendorChartsDataDto {
  @ApiProperty({
    description: 'Daily sales trend data',
    type: [DailySalesDataPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailySalesDataPointDto)
  dailySales: DailySalesDataPointDto[];

  @ApiProperty({
    description: 'Category revenue distribution',
    type: [CategoryDistributionDataPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDistributionDataPointDto)
  categoryDistribution: CategoryDistributionDataPointDto[];

  @ApiProperty({
    description: 'Performance trend over time',
    type: [PerformanceTrendDataPointDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceTrendDataPointDto)
  performanceTrend: PerformanceTrendDataPointDto[];
}

/**
 * Vendor alert/notification DTO
 */
export class VendorAlertDto {
  @ApiProperty({
    description: 'Alert severity type',
    enum: AlertType,
    example: AlertType.WARNING,
  })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({
    description: 'Alert title in English',
    example: 'Low Stock Alert',
  })
  @IsString()
  titleEn: string;

  @ApiProperty({
    description: 'Alert title in Arabic',
    example: 'تنبيه مخزون منخفض',
  })
  @IsString()
  titleAr: string;

  @ApiProperty({
    description: 'Alert message in English',
    example: '5 products are running low on stock',
  })
  @IsString()
  messageEn: string;

  @ApiProperty({
    description: 'Alert message in Arabic',
    example: '5 منتجات مخزونها منخفض',
  })
  @IsString()
  messageAr: string;

  @ApiProperty({
    description: 'Whether this alert requires vendor action',
    example: true,
  })
  @IsBoolean()
  actionRequired: boolean;
}

/**
 * Quick stats widgets data DTO
 */
export class VendorQuickStatsDto {
  @ApiProperty({
    description: 'Number of products with low stock',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  lowStockProducts: number;

  @ApiProperty({
    description: 'Number of pending orders',
    example: 12,
  })
  @IsNumber()
  @Min(0)
  pendingOrders: number;

  @ApiProperty({
    description: 'Number of unresolved customer issues',
    example: 3,
  })
  @IsNumber()
  @Min(0)
  unresolvedIssues: number;

  @ApiProperty({
    description: 'Number of new customer reviews',
    example: 8,
  })
  @IsNumber()
  @Min(0)
  newReviews: number;
}

/**
 * Main vendor dashboard overview response DTO
 * Aggregates all dashboard data into a single response
 */
export class VendorDashboardOverviewDto {
  @ApiProperty({
    description: 'Vendor basic information',
    type: VendorInfoDto,
  })
  @ValidateNested()
  @Type(() => VendorInfoDto)
  vendor: VendorInfoDto;

  @ApiProperty({
    description: 'Key performance metrics',
    type: VendorKeyMetricsDto,
  })
  @ValidateNested()
  @Type(() => VendorKeyMetricsDto)
  metrics: VendorKeyMetricsDto;

  @ApiProperty({
    description: 'Chart data for visualizations',
    type: VendorChartsDataDto,
  })
  @ValidateNested()
  @Type(() => VendorChartsDataDto)
  charts: VendorChartsDataDto;

  @ApiProperty({
    description: 'Active alerts and notifications',
    type: [VendorAlertDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorAlertDto)
  alerts: VendorAlertDto[];

  @ApiProperty({
    description: 'Quick stats for action widgets',
    type: VendorQuickStatsDto,
  })
  @ValidateNested()
  @Type(() => VendorQuickStatsDto)
  quickStats: VendorQuickStatsDto;
}

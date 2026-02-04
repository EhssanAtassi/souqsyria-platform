/**
 * @file analytics-query.dto.ts
 * @description DTOs for analytics queries and report exports.
 * @module AdminDashboard/DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsDateString,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PeriodType } from './dashboard-metrics.dto';

/**
 * Analytics date range type
 */
export enum DateRangeType {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_QUARTER = 'this_quarter',
  LAST_QUARTER = 'last_quarter',
  THIS_YEAR = 'this_year',
  LAST_YEAR = 'last_year',
  CUSTOM = 'custom',
}

/**
 * Export format type
 */
export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

/**
 * Report type enumeration
 */
export enum ReportType {
  SALES = 'sales',
  ORDERS = 'orders',
  PRODUCTS = 'products',
  VENDORS = 'vendors',
  USERS = 'users',
  COMMISSIONS = 'commissions',
  REFUNDS = 'refunds',
}

// =============================================================================
// QUERY DTOs
// =============================================================================

/**
 * Base analytics query parameters
 */
export class BaseAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Predefined date range',
    enum: DateRangeType,
    default: DateRangeType.LAST_30_DAYS,
  })
  @IsEnum(DateRangeType)
  @IsOptional()
  dateRange?: DateRangeType = DateRangeType.LAST_30_DAYS;

  @ApiPropertyOptional({
    description: 'Custom start date (required when dateRange is custom)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (required when dateRange is custom)',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Compare with previous period',
    default: true,
  })
  @IsOptional()
  compareWithPrevious?: boolean = true;
}

/**
 * Sales analytics query parameters
 */
export class SalesAnalyticsQueryDto extends BaseAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Period type for chart aggregation',
    enum: PeriodType,
    default: PeriodType.DAILY,
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType = PeriodType.DAILY;

  @ApiPropertyOptional({
    description: 'Filter by vendor IDs',
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  vendorIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by category IDs',
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by product IDs',
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  productIds?: number[];
}

/**
 * User analytics query parameters
 */
export class UserAnalyticsQueryDto extends BaseAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Period type for chart aggregation',
    enum: PeriodType,
    default: PeriodType.DAILY,
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType = PeriodType.DAILY;

  @ApiPropertyOptional({
    description: 'Include retention metrics',
    default: true,
  })
  @IsOptional()
  includeRetention?: boolean = true;
}

/**
 * Commission report query parameters
 */
export class CommissionReportQueryDto extends BaseAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by vendor IDs',
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  vendorIds?: number[];

  @ApiPropertyOptional({
    description: 'Minimum commission amount filter',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minAmount?: number;
}

/**
 * Export report query DTO
 */
export class ExportReportDto {
  @ApiProperty({
    description: 'Report type to export',
    enum: ReportType,
    example: 'sales',
  })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({
    description: 'Export format',
    enum: ExportFormat,
    example: 'xlsx',
  })
  @IsEnum(ExportFormat)
  format: ExportFormat;

  @ApiPropertyOptional({
    description: 'Predefined date range',
    enum: DateRangeType,
    default: DateRangeType.LAST_30_DAYS,
  })
  @IsEnum(DateRangeType)
  @IsOptional()
  dateRange?: DateRangeType = DateRangeType.LAST_30_DAYS;

  @ApiPropertyOptional({
    description: 'Custom start date',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date',
    example: '2024-01-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Columns to include in export',
    type: [String],
    example: ['orderNumber', 'customerName', 'totalAmount', 'status'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columns?: string[];

  @ApiPropertyOptional({
    description: 'Filter by vendor IDs (for relevant reports)',
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  vendorIds?: number[];
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Sales summary statistics
 */
export class SalesSummaryDto {
  @ApiProperty({ description: 'Total revenue in SYP', example: 25000000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenue change percentage', example: 12.5 })
  revenueChange: number;

  @ApiProperty({ description: 'Total orders', example: 543 })
  totalOrders: number;

  @ApiProperty({ description: 'Orders change percentage', example: 8.3 })
  ordersChange: number;

  @ApiProperty({ description: 'Average order value in SYP', example: 46039 })
  averageOrderValue: number;

  @ApiProperty({ description: 'AOV change percentage', example: 3.8 })
  aovChange: number;

  @ApiProperty({ description: 'Total units sold', example: 1234 })
  totalUnitsSold: number;

  @ApiProperty({ description: 'Units sold change percentage', example: 15.2 })
  unitsSoldChange: number;

  @ApiProperty({ description: 'Conversion rate (%)', example: 3.2 })
  conversionRate: number;

  @ApiProperty({ description: 'Conversion rate change', example: 0.5 })
  conversionRateChange: number;
}

/**
 * Sales chart data point
 */
export class SalesChartPointDto {
  @ApiProperty({ description: 'Period label', example: '2024-01-15' })
  label: string;

  @ApiProperty({ description: 'Revenue in SYP', example: 850000 })
  revenue: number;

  @ApiProperty({ description: 'Number of orders', example: 23 })
  orders: number;

  @ApiProperty({ description: 'Units sold', example: 45 })
  unitsSold: number;
}

/**
 * Sales analytics response
 */
export class SalesAnalyticsDto {
  @ApiProperty({ description: 'Sales summary', type: SalesSummaryDto })
  summary: SalesSummaryDto;

  @ApiProperty({ description: 'Chart data points', type: [SalesChartPointDto] })
  chartData: SalesChartPointDto[];

  @ApiProperty({
    description: 'Top selling products',
    type: [Object],
  })
  topProducts: {
    id: number;
    name: string;
    revenue: number;
    unitsSold: number;
    percentage: number;
  }[];

  @ApiProperty({
    description: 'Sales by category',
    type: [Object],
  })
  salesByCategory: {
    id: number;
    name: string;
    revenue: number;
    percentage: number;
  }[];

  @ApiProperty({
    description: 'Top performing vendors',
    type: [Object],
  })
  topVendors: {
    id: number;
    name: string;
    revenue: number;
    orders: number;
    percentage: number;
  }[];
}

/**
 * User analytics summary
 */
export class UserAnalyticsSummaryDto {
  @ApiProperty({ description: 'Total users', example: 5678 })
  totalUsers: number;

  @ApiProperty({ description: 'Users change percentage', example: 15.2 })
  usersChange: number;

  @ApiProperty({ description: 'New users in period', example: 234 })
  newUsers: number;

  @ApiProperty({ description: 'New users change percentage', example: 8.5 })
  newUsersChange: number;

  @ApiProperty({ description: 'Active users in period', example: 1234 })
  activeUsers: number;

  @ApiProperty({ description: 'Active users change percentage', example: 5.3 })
  activeUsersChange: number;

  @ApiProperty({ description: 'User retention rate (%)', example: 65.5 })
  retentionRate: number;

  @ApiProperty({ description: 'Retention rate change', example: 2.1 })
  retentionRateChange: number;
}

/**
 * User analytics response
 */
export class UserAnalyticsDto {
  @ApiProperty({ description: 'User summary', type: UserAnalyticsSummaryDto })
  summary: UserAnalyticsSummaryDto;

  @ApiProperty({
    description: 'User registration chart data',
    type: [Object],
  })
  registrationChart: {
    label: string;
    newUsers: number;
    activeUsers: number;
  }[];

  @ApiProperty({
    description: 'Users by role',
    type: [Object],
  })
  usersByRole: {
    role: string;
    count: number;
    percentage: number;
  }[];

  @ApiProperty({
    description: 'User demographics',
    type: [Object],
  })
  demographics: {
    metric: string;
    value: string;
    count: number;
    percentage: number;
  }[];
}

/**
 * Commission report item
 */
export class CommissionReportItemDto {
  @ApiProperty({ description: 'Vendor ID', example: 1 })
  vendorId: number;

  @ApiProperty({ description: 'Vendor name', example: 'Al-Hamra Crafts' })
  vendorName: string;

  @ApiProperty({ description: 'Total sales in SYP', example: 5000000 })
  totalSales: number;

  @ApiProperty({ description: 'Commission rate (%)', example: 10 })
  commissionRate: number;

  @ApiProperty({ description: 'Commission amount in SYP', example: 500000 })
  commissionAmount: number;

  @ApiProperty({ description: 'Number of orders', example: 156 })
  orderCount: number;

  @ApiProperty({ description: 'Paid commission in SYP', example: 400000 })
  paidAmount: number;

  @ApiProperty({ description: 'Pending commission in SYP', example: 100000 })
  pendingAmount: number;
}

/**
 * Commission report response
 */
export class CommissionReportDto {
  @ApiProperty({
    description: 'Total commissions summary',
    type: Object,
  })
  summary: {
    totalSales: number;
    totalCommissions: number;
    paidCommissions: number;
    pendingCommissions: number;
    averageCommissionRate: number;
  };

  @ApiProperty({
    description: 'Commission by vendor',
    type: [CommissionReportItemDto],
  })
  byVendor: CommissionReportItemDto[];

  @ApiProperty({
    description: 'Commission trend chart',
    type: [Object],
  })
  trend: {
    label: string;
    commissions: number;
    sales: number;
  }[];
}

/**
 * Export result response
 */
export class ExportResultDto {
  @ApiProperty({ description: 'Export job ID', example: 'exp-2024-001234' })
  exportId: string;

  @ApiProperty({ description: 'Export status', example: 'completed' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({ description: 'Download URL (when completed)' })
  downloadUrl?: string;

  @ApiProperty({ description: 'File name', example: 'sales-report-2024-01.xlsx' })
  fileName: string;

  @ApiProperty({ description: 'File size in bytes', example: 125432 })
  fileSize: number;

  @ApiProperty({ description: 'Records exported', example: 543 })
  recordCount: number;

  @ApiProperty({ description: 'Export creation time' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Expiration time for download URL' })
  expiresAt?: Date;
}

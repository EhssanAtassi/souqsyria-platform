/**
 * @file dashboard-metrics.dto.ts
 * @description DTOs for dashboard metrics, revenue charts, and overview data.
 *              Includes response schemas for Swagger documentation.
 * @module AdminDashboard/DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Period type enumeration for analytics queries
 */
export enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// =============================================================================
// QUERY DTOs
// =============================================================================

/**
 * Query parameters for revenue chart data
 * @description Defines the time period for chart aggregation
 */
export class RevenueChartQueryDto {
  @ApiPropertyOptional({
    description: 'Period type for data aggregation',
    enum: PeriodType,
    default: PeriodType.MONTHLY,
    example: 'monthly',
  })
  @IsEnum(PeriodType)
  @IsOptional()
  periodType?: PeriodType = PeriodType.MONTHLY;
}

/**
 * Query parameters for top selling products
 * @description Configures the limit for top products retrieval
 */
export class TopProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Number of top products to retrieve',
    minimum: 1,
    maximum: 20,
    default: 5,
    example: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number = 5;
}

/**
 * Query parameters for recent orders
 * @description Configures pagination for recent orders retrieval
 */
export class RecentOrdersQueryDto {
  @ApiPropertyOptional({
    description: 'Number of recent orders to retrieve',
    minimum: 1,
    maximum: 50,
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Pending actions count response
 * @description Counts of items requiring admin attention
 */
export class PendingActionsDto {
  @ApiProperty({
    description: 'Number of orders pending confirmation',
    example: 12,
  })
  pendingOrders: number;

  @ApiProperty({
    description: 'Number of products awaiting approval',
    example: 8,
  })
  pendingProducts: number;

  @ApiProperty({
    description: 'Number of vendors pending verification',
    example: 3,
  })
  pendingVendors: number;

  @ApiProperty({
    description: 'Number of refund requests pending review',
    example: 5,
  })
  pendingRefunds: number;

  @ApiProperty({
    description: 'Number of KYC submissions pending review',
    example: 7,
  })
  pendingKyc: number;

  @ApiProperty({
    description: 'Number of withdrawal requests pending processing',
    example: 2,
  })
  pendingWithdrawals: number;
}

/**
 * Dashboard metrics response DTO
 * @description Complete dashboard statistics including counts, growth, and pending actions
 */
export class DashboardMetricsDto {
  @ApiProperty({
    description: 'Total revenue in SYP',
    example: 125000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Revenue growth percentage vs previous period',
    example: 12.5,
  })
  revenueGrowth: number;

  @ApiProperty({
    description: 'Total number of orders',
    example: 1543,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Orders growth percentage vs previous period',
    example: 8.3,
  })
  ordersGrowth: number;

  @ApiProperty({
    description: 'Total registered users',
    example: 5678,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Users growth percentage vs previous period',
    example: 15.2,
  })
  usersGrowth: number;

  @ApiProperty({
    description: 'Total products in catalog',
    example: 892,
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Products growth percentage vs previous period',
    example: 5.7,
  })
  productsGrowth: number;

  @ApiProperty({
    description: 'Total active vendors',
    example: 45,
  })
  totalVendors: number;

  @ApiProperty({
    description: 'Vendors growth percentage vs previous period',
    example: 3.2,
  })
  vendorsGrowth: number;

  @ApiProperty({
    description: 'Total commissions collected in SYP',
    example: 12500000,
  })
  totalCommissions: number;

  @ApiProperty({
    description: 'Commissions growth percentage vs previous period',
    example: 10.8,
  })
  commissionsGrowth: number;

  @ApiProperty({
    description: 'Pending actions requiring attention',
    type: PendingActionsDto,
  })
  pendingActions: PendingActionsDto;
}

/**
 * Revenue chart data point
 * @description Single data point in the revenue chart
 */
export class RevenueChartPointDto {
  @ApiProperty({
    description: 'Label for the data point (date/period)',
    example: 'Jan 2024',
  })
  label: string;

  @ApiProperty({
    description: 'Revenue value in SYP',
    example: 15000000,
  })
  revenue: number;

  @ApiProperty({
    description: 'Commission value in SYP',
    example: 1500000,
  })
  commission: number;

  @ApiProperty({
    description: 'Net revenue (revenue - commission) in SYP',
    example: 13500000,
  })
  netRevenue: number;
}

/**
 * Revenue chart response DTO
 * @description Complete chart data with labels and multiple series
 */
export class RevenueChartDataDto {
  @ApiProperty({
    description: 'Chart labels (x-axis)',
    type: [String],
    example: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  })
  labels: string[];

  @ApiProperty({
    description: 'Revenue values for each period',
    type: [Number],
    example: [12000000, 15000000, 13500000, 18000000, 16500000, 21000000],
  })
  revenues: number[];

  @ApiProperty({
    description: 'Commission values for each period',
    type: [Number],
    example: [1200000, 1500000, 1350000, 1800000, 1650000, 2100000],
  })
  commissions: number[];

  @ApiProperty({
    description: 'Net revenue values for each period',
    type: [Number],
    example: [10800000, 13500000, 12150000, 16200000, 14850000, 18900000],
  })
  netRevenue: number[];

  @ApiProperty({
    description: 'Period type used for aggregation',
    enum: PeriodType,
    example: 'monthly',
  })
  periodType: PeriodType;
}

/**
 * Top selling product response DTO
 * @description Product details with sales statistics
 */
export class TopSellingProductDto {
  @ApiProperty({
    description: 'Product ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Product name in English',
    example: 'Damascus Steel Chef Knife',
  })
  nameEn: string;

  @ApiProperty({
    description: 'Product name in Arabic',
    example: 'سكين طبخ فولاذ دمشقي',
  })
  nameAr: string;

  @ApiProperty({
    description: 'Product thumbnail URL',
    example: 'https://storage.souqsyria.com/products/knife-thumb.jpg',
  })
  thumbnail: string;

  @ApiProperty({
    description: 'Category name',
    example: 'Damascus Steel',
  })
  categoryName: string;

  @ApiProperty({
    description: 'Vendor/Shop name',
    example: 'Al-Hamra Crafts',
  })
  vendorName: string;

  @ApiProperty({
    description: 'Total units sold',
    example: 156,
  })
  totalSold: number;

  @ApiProperty({
    description: 'Total revenue from this product in SYP',
    example: 7800000,
  })
  totalRevenue: number;
}

/**
 * Recent order response DTO
 * @description Order summary for dashboard display
 */
export class RecentOrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 1234,
  })
  id: number;

  @ApiProperty({
    description: 'Unique order number',
    example: 'ORD-2024-001234',
  })
  orderNumber: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Ahmad Al-Hassan',
  })
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'ahmad@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    description: 'Total order amount in SYP',
    example: 250000,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Order status',
    example: 'pending',
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refunded', 'partially_refunded', 'failed'],
  })
  status: string;

  @ApiProperty({
    description: 'Number of items in the order',
    example: 3,
  })
  itemsCount: number;

  @ApiProperty({
    description: 'Order creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

/**
 * Dashboard overview response DTO
 * @description Complete dashboard data including all widgets
 */
export class DashboardOverviewDto {
  @ApiProperty({
    description: 'Dashboard metrics and statistics',
    type: DashboardMetricsDto,
  })
  metrics: DashboardMetricsDto;

  @ApiProperty({
    description: 'Revenue chart data',
    type: RevenueChartDataDto,
  })
  chartData: RevenueChartDataDto;

  @ApiProperty({
    description: 'Top selling products',
    type: [TopSellingProductDto],
  })
  topProducts: TopSellingProductDto[];

  @ApiProperty({
    description: 'Recent orders',
    type: [RecentOrderDto],
  })
  recentOrders: RecentOrderDto[];
}

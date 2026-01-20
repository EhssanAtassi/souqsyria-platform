/**
 * @file category-stats.dto.ts
 * @description DTO for category analytics, performance metrics, and statistical data
 *
 * FEATURES:
 * - Comprehensive performance metrics
 * - Business intelligence data
 * - Time-series analytics support
 * - Syrian market specific metrics
 * - Vendor performance insights
 * - Customer behavior analytics
 *
 * USED BY:
 * - Admin dashboards and reports
 * - Category performance monitoring
 * - Business intelligence systems
 * - Vendor analytics interfaces
 * - Marketing campaign optimization
 * - Financial reporting systems
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Time-series data point for trend analysis
 */
export class TimeSeriesDataPointDto {
  @ApiProperty({
    example: '2025-01-15',
    description: 'Date for this data point (YYYY-MM-DD format)',
  })
  date: string;

  @ApiProperty({
    example: 156,
    description: 'Value for this date',
  })
  value: number;

  @ApiPropertyOptional({
    example: 12.5,
    description: 'Percentage change from previous period',
  })
  changePercent?: number;

  @ApiPropertyOptional({
    example: 'increase',
    enum: ['increase', 'decrease', 'stable'],
    description: 'Trend direction for this data point',
  })
  trend?: 'increase' | 'decrease' | 'stable';
}

/**
 * Product performance metrics within the category
 */
export class CategoryProductMetricsDto {
  @ApiProperty({
    example: 156,
    description: 'Total number of active products in this category',
  })
  totalProducts: number;

  @ApiProperty({
    example: 134,
    description: 'Number of approved products',
  })
  approvedProducts: number;

  @ApiProperty({
    example: 22,
    description: 'Number of pending approval products',
  })
  pendingProducts: number;

  @ApiProperty({
    example: 8,
    description: 'Number of out-of-stock products',
  })
  outOfStockProducts: number;

  @ApiProperty({
    example: 4.2,
    description: 'Average product rating in this category',
  })
  averageRating: number;

  @ApiProperty({
    example: 1250000,
    description: 'Average product price in SYP',
  })
  averagePrice: number;

  @ApiProperty({
    example: 50000,
    description: 'Lowest product price in SYP',
  })
  minPrice: number;

  @ApiProperty({
    example: 15000000,
    description: 'Highest product price in SYP',
  })
  maxPrice: number;

  @ApiProperty({
    example: 25,
    description: 'Number of unique vendors selling in this category',
  })
  vendorCount: number;

  @ApiProperty({
    example: 15,
    description: 'Average number of products per vendor',
  })
  avgProductsPerVendor: number;
}

/**
 * Sales and revenue metrics
 */
export class CategorySalesMetricsDto {
  @ApiProperty({
    example: 45000000,
    description: 'Total sales revenue in SYP (all time)',
  })
  totalRevenue: number;

  @ApiProperty({
    example: 5600000,
    description: 'Revenue in the last 30 days (SYP)',
  })
  revenue30Days: number;

  @ApiProperty({
    example: 1200000,
    description: 'Revenue in the last 7 days (SYP)',
  })
  revenue7Days: number;

  @ApiProperty({
    example: 1247,
    description: 'Total number of orders (all time)',
  })
  totalOrders: number;

  @ApiProperty({
    example: 156,
    description: 'Number of orders in the last 30 days',
  })
  orders30Days: number;

  @ApiProperty({
    example: 34,
    description: 'Number of orders in the last 7 days',
  })
  orders7Days: number;

  @ApiProperty({
    example: 36123,
    description: 'Average order value in SYP',
  })
  averageOrderValue: number;

  @ApiProperty({
    example: 2.3,
    description: 'Average number of items per order',
  })
  averageItemsPerOrder: number;

  @ApiProperty({
    example: 12.5,
    description: 'Revenue growth percentage (month over month)',
  })
  revenueGrowthPercent: number;

  @ApiProperty({
    example: 8.2,
    description: 'Order growth percentage (month over month)',
  })
  orderGrowthPercent: number;

  @ApiProperty({
    example: 1568000,
    description: 'Total commission earned from this category (SYP)',
  })
  totalCommission: number;
}

/**
 * Customer behavior and engagement metrics
 */
export class CategoryCustomerMetricsDto {
  @ApiProperty({
    example: 15847,
    description: 'Total number of unique visitors',
  })
  uniqueVisitors: number;

  @ApiProperty({
    example: 2341,
    description: 'Page views in the last 30 days',
  })
  pageViews30Days: number;

  @ApiProperty({
    example: 567,
    description: 'Page views in the last 7 days',
  })
  pageViews7Days: number;

  @ApiProperty({
    example: 3.4,
    description: 'Average time spent on category pages (minutes)',
  })
  averageTimeOnPage: number;

  @ApiProperty({
    example: 2.1,
    description: 'Average number of pages viewed per session',
  })
  pagesPerSession: number;

  @ApiProperty({
    example: 65.8,
    description: 'Bounce rate percentage',
  })
  bounceRate: number;

  @ApiProperty({
    example: 4.2,
    description: 'Conversion rate percentage (views to purchases)',
  })
  conversionRate: number;

  @ApiProperty({
    example: 234,
    description: 'Number of products added to cart from this category',
  })
  addToCartCount: number;

  @ApiProperty({
    example: 567,
    description: 'Number of products added to wishlist from this category',
  })
  wishlistCount: number;

  @ApiProperty({
    example: 23,
    description: 'Number of customer reviews for products in this category',
  })
  reviewCount: number;

  @ApiProperty({
    example: 15,
    description: 'Number of customer questions about products in this category',
  })
  questionCount: number;
}

/**
 * Search and discovery metrics
 */
export class CategorySearchMetricsDto {
  @ApiProperty({
    example: 1456,
    description: 'Number of times this category appeared in search results',
  })
  searchImpressions: number;

  @ApiProperty({
    example: 234,
    description: 'Number of times this category was clicked from search',
  })
  searchClicks: number;

  @ApiProperty({
    example: 16.1,
    description: 'Click-through rate from search results (percentage)',
  })
  searchCTR: number;

  @ApiProperty({
    example: 2.3,
    description: 'Average search position when this category appears',
  })
  averageSearchPosition: number;

  @ApiProperty({
    example: ['electronics', 'smartphones', 'mobile', 'phone'],
    description: 'Top search keywords that led to this category',
  })
  topSearchKeywords: string[];

  @ApiProperty({
    example: 45,
    description: 'Number of times this category was found via filters',
  })
  filterDiscoveries: number;

  @ApiProperty({
    example: 123,
    description:
      'Number of times products from this category appeared in recommendations',
  })
  recommendationImpressions: number;
}

/**
 * Syrian market specific metrics
 */
export class SyrianMarketMetricsDto {
  @ApiProperty({
    example: 78.5,
    description: 'Percentage of traffic from Syria',
  })
  syrianTrafficPercent: number;

  @ApiProperty({
    example: 21.5,
    description: 'Percentage of traffic from Syrian diaspora',
  })
  diasporaTrafficPercent: number;

  @ApiProperty({
    example: 92.3,
    description: 'Percentage of orders paid in Syrian Pounds (SYP)',
  })
  sypPaymentPercent: number;

  @ApiProperty({
    example: 7.7,
    description: 'Percentage of orders paid in other currencies (USD, EUR)',
  })
  foreignCurrencyPercent: number;

  @ApiProperty({
    example: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
    description: 'Top Syrian cities for this category',
  })
  topSyrianCities: string[];

  @ApiProperty({
    example: 45.6,
    description: 'Percentage of mobile traffic (important for Syrian market)',
  })
  mobileTrafficPercent: number;

  @ApiProperty({
    example: 67.8,
    description: 'Cash on delivery (COD) usage percentage',
  })
  codUsagePercent: number;

  @ApiProperty({
    example: 4.2,
    description: 'Average delivery time in days for Syrian orders',
  })
  averageDeliveryDays: number;
}

/**
 * Trend analysis over time periods
 */
export class CategoryTrendsDto {
  @ApiProperty({
    type: [TimeSeriesDataPointDto],
    description: 'Daily page views for the last 30 days',
  })
  dailyViews: TimeSeriesDataPointDto[];

  @ApiProperty({
    type: [TimeSeriesDataPointDto],
    description: 'Daily sales for the last 30 days',
  })
  dailySales: TimeSeriesDataPointDto[];

  @ApiProperty({
    type: [TimeSeriesDataPointDto],
    description: 'Weekly product additions',
  })
  weeklyProductAdditions: TimeSeriesDataPointDto[];

  @ApiProperty({
    type: [TimeSeriesDataPointDto],
    description: 'Monthly revenue trend',
  })
  monthlyRevenue: TimeSeriesDataPointDto[];

  @ApiProperty({
    example: 'growing',
    enum: ['growing', 'stable', 'declining'],
    description: 'Overall trend direction for this category',
  })
  overallTrend: 'growing' | 'stable' | 'declining';

  @ApiProperty({
    example: 15.7,
    description: 'Growth rate percentage over the last quarter',
  })
  quarterlyGrowthRate: number;

  @ApiProperty({
    example: 'summer',
    description: 'Best performing season for this category',
  })
  bestSeason: string;

  @ApiProperty({
    example: ['friday', 'saturday'],
    description: 'Best performing days of the week',
  })
  bestDaysOfWeek: string[];
}

/**
 * Main category statistics DTO
 * Comprehensive analytics data for a single category
 */
export class CategoryStatsDto {
  // ================================
  // BASIC METRICS
  // ================================

  @ApiProperty({
    example: 156,
    description: 'Number of products in this category',
  })
  productCount: number;

  @ApiProperty({
    example: 2341,
    description: 'Total number of views for this category',
  })
  viewCount: number;

  @ApiProperty({
    example: 87.5,
    description: 'Calculated popularity score (0-100)',
  })
  popularityScore: number;

  @ApiPropertyOptional({
    example: '2025-01-15T14:30:00Z',
    description: 'Last time this category had any activity',
  })
  lastActivityAt?: Date;

  @ApiProperty({
    example: 5,
    description: 'Number of direct child categories',
  })
  childrenCount: number;

  @ApiProperty({
    example: 4.2,
    description: 'Average rating of products in this category',
  })
  avgRating: number;

  @ApiProperty({
    example: 45000000,
    description: 'Total sales revenue in SYP',
  })
  totalSales: number;

  // ================================
  // DETAILED METRICS SECTIONS
  // ================================

  @ApiProperty({
    type: CategoryProductMetricsDto,
    description: 'Detailed product-related metrics',
  })
  productMetrics: CategoryProductMetricsDto;

  @ApiProperty({
    type: CategorySalesMetricsDto,
    description: 'Sales and revenue analytics',
  })
  salesMetrics: CategorySalesMetricsDto;

  @ApiProperty({
    type: CategoryCustomerMetricsDto,
    description: 'Customer behavior and engagement data',
  })
  customerMetrics: CategoryCustomerMetricsDto;

  @ApiProperty({
    type: CategorySearchMetricsDto,
    description: 'Search and discovery performance',
  })
  searchMetrics: CategorySearchMetricsDto;

  @ApiProperty({
    type: SyrianMarketMetricsDto,
    description: 'Syrian market specific analytics',
  })
  syrianMetrics: SyrianMarketMetricsDto;

  @ApiProperty({
    type: CategoryTrendsDto,
    description: 'Historical trends and growth patterns',
  })
  trends: CategoryTrendsDto;

  // ================================
  // COMPARATIVE METRICS
  // ================================

  @ApiProperty({
    example: 15,
    description: 'Rank among all categories by popularity',
  })
  popularityRank: number;

  @ApiProperty({
    example: 8,
    description: 'Rank among all categories by revenue',
  })
  revenueRank: number;

  @ApiProperty({
    example: 23,
    description: 'Rank among all categories by product count',
  })
  productCountRank: number;

  @ApiProperty({
    example: 45.7,
    description: 'Performance compared to category average (percentage)',
  })
  performanceVsAverage: number;

  @ApiProperty({
    example: 12.3,
    description: 'Market share percentage within parent category',
  })
  marketSharePercent: number;

  // ================================
  // METADATA
  // ================================

  @ApiProperty({
    example: '2025-01-15T14:30:00Z',
    description: 'When these statistics were generated',
  })
  generatedAt: Date;

  @ApiProperty({
    example: '2025-01-15T00:00:00Z',
    description: 'Start date for the statistics period',
  })
  periodStart: Date;

  @ApiProperty({
    example: '2025-01-15T23:59:59Z',
    description: 'End date for the statistics period',
  })
  periodEnd: Date;

  @ApiProperty({
    example: 'real-time',
    enum: ['real-time', 'hourly', 'daily', 'weekly'],
    description: 'Freshness level of the statistical data',
  })
  dataFreshness: 'real-time' | 'hourly' | 'daily' | 'weekly';

  @ApiProperty({
    example: true,
    description: 'Whether this data was served from cache',
  })
  fromCache: boolean;

  @ApiProperty({
    example: 245,
    description: 'Time taken to generate statistics in milliseconds',
  })
  calculationTimeMs: number;

  // ================================
  // ACTIONABLE INSIGHTS
  // ================================

  @ApiPropertyOptional({
    example: [
      'Consider featuring this category due to high conversion rate',
      'Product inventory is running low',
      'Strong growth trend - consider expanding vendor partnerships',
    ],
    description: 'AI-generated insights and recommendations',
  })
  insights?: string[];

  @ApiPropertyOptional({
    example: [
      'Add more mobile-friendly product images',
      'Improve category description for better SEO',
      'Consider promotional campaigns for Syrian market',
    ],
    description: 'Suggested actions to improve performance',
  })
  recommendations?: string[];

  @ApiPropertyOptional({
    example: {
      revenue: 'high',
      growth: 'medium',
      engagement: 'high',
      competition: 'medium',
    },
    description: 'Health scores for different performance areas',
  })
  healthScores?: {
    revenue: 'high' | 'medium' | 'low';
    growth: 'high' | 'medium' | 'low';
    engagement: 'high' | 'medium' | 'low';
    competition: 'high' | 'medium' | 'low';
  };
}

/**
 * Aggregated statistics for multiple categories
 * Used for dashboard summaries and comparative analysis
 */
export class CategoryStatsCollectionDto {
  @ApiProperty({
    type: [CategoryStatsDto],
    description: 'Statistics for individual categories',
    isArray: true,
  })
  categories: CategoryStatsDto[];

  @ApiProperty({
    example: 15,
    description: 'Total number of categories in this collection',
  })
  totalCategories: number;

  @ApiProperty({
    example: 1247,
    description: 'Total products across all categories',
  })
  totalProducts: number;

  @ApiProperty({
    example: 156789000,
    description: 'Total revenue across all categories (SYP)',
  })
  totalRevenue: number;

  @ApiProperty({
    example: 45672,
    description: 'Total views across all categories',
  })
  totalViews: number;

  @ApiProperty({
    example: 4.3,
    description: 'Average rating across all categories',
  })
  overallAverageRating: number;

  @ApiProperty({
    example: 67.8,
    description: 'Overall performance score (0-100)',
  })
  overallPerformanceScore: number;

  @ApiProperty({
    type: CategoryStatsDto,
    description: 'Best performing category by revenue',
  })
  topPerformer: CategoryStatsDto;

  @ApiProperty({
    type: CategoryStatsDto,
    description: 'Category with highest growth rate',
  })
  fastestGrowing: CategoryStatsDto;

  @ApiProperty({
    example: '2025-01-15T14:30:00Z',
    description: 'When this collection was generated',
  })
  generatedAt: Date;

  @ApiProperty({
    example: 1250,
    description: 'Time taken to calculate all statistics (ms)',
  })
  calculationTimeMs: number;

  @ApiPropertyOptional({
    example: [
      'Electronics category shows strongest growth potential',
      'Fashion category needs inventory optimization',
      'Home & Garden has high customer satisfaction',
    ],
    description: 'Cross-category insights and recommendations',
  })
  crossCategoryInsights?: string[];
}

/**
 * Category performance comparison DTO
 * Used for benchmarking and competitive analysis
 */
export class CategoryPerformanceComparisonDto {
  @ApiProperty({
    example: 1,
    description: 'Category ID being compared',
  })
  categoryId: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'Category name',
  })
  categoryName: string;

  @ApiProperty({
    example: 87.5,
    description: 'Current performance score',
  })
  currentScore: number;

  @ApiProperty({
    example: 82.1,
    description: 'Performance score from previous period',
  })
  previousScore: number;

  @ApiProperty({
    example: 6.6,
    description: 'Percentage change from previous period',
  })
  changePercent: number;

  @ApiProperty({
    example: 'improvement',
    enum: ['improvement', 'decline', 'stable'],
    description: 'Performance trend direction',
  })
  trend: 'improvement' | 'decline' | 'stable';

  @ApiProperty({
    example: 15,
    description: 'Rank among all categories',
  })
  rank: number;

  @ApiProperty({
    example: 12,
    description: 'Previous rank for comparison',
  })
  previousRank: number;

  @ApiProperty({
    example: 3,
    description: 'Change in rank (positive = improved ranking)',
  })
  rankChange: number;

  @ApiProperty({
    example: [
      'High conversion rate',
      'Strong mobile engagement',
      'Growing vendor base',
    ],
    description: 'Key performance strengths',
  })
  strengths: string[];

  @ApiProperty({
    example: ['Low inventory turnover', 'Limited Syrian market penetration'],
    description: 'Areas needing improvement',
  })
  weaknesses: string[];

  @ApiProperty({
    example: ['Seasonal promotion opportunities', 'Diaspora market expansion'],
    description: 'Growth opportunities identified',
  })
  opportunities: string[];
}

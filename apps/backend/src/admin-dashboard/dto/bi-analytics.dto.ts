/**
 * @file bi-analytics.dto.ts
 * @description Data Transfer Objects for Business Intelligence Analytics endpoints.
 *              Includes DTOs for Customer Lifetime Value, Conversion Funnels,
 *              Cart Abandonment, Cohort Analysis, and Event Tracking.
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
  IsBoolean,
  IsObject,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// =============================================================================
// ENUMS AND TYPES
// =============================================================================

/**
 * Customer segment classification based on lifetime value
 */
export enum CustomerSegment {
  VIP = 'vip',
  HIGH_VALUE = 'high_value',
  MEDIUM_VALUE = 'medium_value',
  LOW_VALUE = 'low_value',
  AT_RISK = 'at_risk',
  LOST = 'lost',
  NEW = 'new',
}

/**
 * Funnel step types for conversion tracking
 */
export enum FunnelStep {
  PRODUCT_VIEW = 'product_view',
  ADD_TO_CART = 'add_to_cart',
  CHECKOUT_START = 'checkout_start',
  PAYMENT_INFO = 'payment_info',
  PURCHASE_COMPLETE = 'purchase_complete',
}

/**
 * Device types for analytics segmentation
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  APP = 'app',
}

/**
 * Cohort grouping period
 */
export enum CohortPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

/**
 * Cart abandonment recovery status
 */
export enum RecoveryStatus {
  NOT_SENT = 'not_sent',
  SENT = 'sent',
  OPENED = 'opened',
  CLICKED = 'clicked',
  RECOVERED = 'recovered',
  FAILED = 'failed',
}

/**
 * Event tracking categories
 */
export enum EventCategory {
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  TRANSACTION = 'transaction',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

// =============================================================================
// CUSTOMER LIFETIME VALUE (CLV) DTOs
// =============================================================================

/**
 * CLV Summary Response DTO
 * @description High-level overview of customer lifetime value metrics
 */
export class CLVSummaryDto {
  @ApiProperty({
    description: 'Average customer lifetime value in SYP',
    example: 1250000,
  })
  averageCLV: number;

  @ApiProperty({
    description: 'Median customer lifetime value in SYP',
    example: 850000,
  })
  medianCLV: number;

  @ApiProperty({
    description: 'Total customer lifetime value in SYP',
    example: 125000000,
  })
  totalCLV: number;

  @ApiProperty({
    description: 'CLV change percentage compared to previous period',
    example: 12.5,
  })
  clvChange: number;

  @ApiProperty({
    description: 'Percentage of high-value customers (top 20%)',
    example: 20,
  })
  highValueCustomerPercentage: number;

  @ApiProperty({
    description: 'Revenue contribution from top 20% customers',
    example: 80,
  })
  pareto80_20: number;

  @ApiProperty({
    description: 'Average customer lifespan in days',
    example: 365,
  })
  averageLifespan: number;

  @ApiProperty({
    description: 'Average purchase frequency per customer',
    example: 5.2,
  })
  averagePurchaseFrequency: number;

  @ApiProperty({
    description: 'Date of last calculation',
    example: '2024-01-22T10:30:00Z',
  })
  lastCalculatedAt: Date;
}

/**
 * Customer Segment Response DTO
 * @description Customer segmentation based on CLV
 */
export class CustomerSegmentDto {
  @ApiProperty({
    description: 'Segment identifier',
    enum: CustomerSegment,
    example: CustomerSegment.HIGH_VALUE,
  })
  segment: CustomerSegment;

  @ApiProperty({
    description: 'Number of customers in segment',
    example: 234,
  })
  customerCount: number;

  @ApiProperty({
    description: 'Percentage of total customer base',
    example: 15.5,
  })
  percentage: number;

  @ApiProperty({
    description: 'Total CLV of segment in SYP',
    example: 45000000,
  })
  totalCLV: number;

  @ApiProperty({
    description: 'Average CLV in segment in SYP',
    example: 1923077,
  })
  averageCLV: number;

  @ApiProperty({
    description: 'Total revenue contributed by segment in SYP',
    example: 38000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Average order frequency in segment',
    example: 6.8,
  })
  averageOrderFrequency: number;

  @ApiProperty({
    description: 'Average days since last purchase',
    example: 45,
  })
  daysSinceLastPurchase: number;
}

/**
 * CLV Prediction Response DTO
 * @description Predictive customer lifetime value analytics
 */
export class CLVPredictionDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 1234,
  })
  customerId: number;

  @ApiProperty({
    description: 'Current CLV in SYP',
    example: 950000,
  })
  currentCLV: number;

  @ApiProperty({
    description: 'Predicted CLV for next 12 months in SYP',
    example: 1200000,
  })
  predictedCLV: number;

  @ApiProperty({
    description: 'Confidence score (0-1)',
    example: 0.85,
  })
  confidenceScore: number;

  @ApiProperty({
    description: 'Probability of next purchase (0-1)',
    example: 0.72,
  })
  purchaseProbability: number;

  @ApiProperty({
    description: 'Predicted next purchase date',
    example: '2024-02-15',
  })
  predictedNextPurchase: string;

  @ApiProperty({
    description: 'Churn risk score (0-1, higher = more risk)',
    example: 0.15,
  })
  churnRisk: number;

  @ApiProperty({
    description: 'Current customer segment',
    enum: CustomerSegment,
  })
  currentSegment: CustomerSegment;

  @ApiProperty({
    description: 'Predicted segment for next period',
    enum: CustomerSegment,
  })
  predictedSegment: CustomerSegment;
}

/**
 * Individual Customer CLV Response DTO
 * @description Detailed CLV breakdown for a specific customer
 */
export class CustomerCLVDetailDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 1234,
  })
  customerId: number;

  @ApiProperty({
    description: 'Customer email',
    example: 'ahmad.hassan@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'أحمد حسن',
  })
  customerName: string;

  @ApiProperty({
    description: 'Current lifetime value in SYP',
    example: 2500000,
  })
  lifetimeValue: number;

  @ApiProperty({
    description: 'Total orders placed',
    example: 18,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Average order value in SYP',
    example: 138889,
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Total revenue contributed in SYP',
    example: 2500000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'First purchase date',
    example: '2023-03-15',
  })
  firstPurchaseDate: Date;

  @ApiProperty({
    description: 'Last purchase date',
    example: '2024-01-20',
  })
  lastPurchaseDate: Date;

  @ApiProperty({
    description: 'Customer lifespan in days',
    example: 311,
  })
  lifespanDays: number;

  @ApiProperty({
    description: 'Average days between purchases',
    example: 17.3,
  })
  averageDaysBetweenPurchases: number;

  @ApiProperty({
    description: 'Customer segment',
    enum: CustomerSegment,
  })
  segment: CustomerSegment;

  @ApiProperty({
    description: 'Purchase trend (positive/negative/stable)',
    example: 'positive',
  })
  purchaseTrend: string;

  @ApiProperty({
    description: 'Top product categories purchased',
    type: [Object],
    example: [
      { categoryId: 5, categoryName: 'Electronics', orders: 8, revenue: 1200000 },
    ],
  })
  topCategories: Array<{
    categoryId: number;
    categoryName: string;
    orders: number;
    revenue: number;
  }>;
}

// =============================================================================
// CONVERSION FUNNEL DTOs
// =============================================================================

/**
 * Funnel Overview Response DTO
 * @description High-level conversion funnel metrics
 */
export class FunnelOverviewDto {
  @ApiProperty({
    description: 'Total users entering funnel',
    example: 10000,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Overall conversion rate (entrance to purchase)',
    example: 3.2,
  })
  overallConversionRate: number;

  @ApiProperty({
    description: 'Conversion rate change from previous period',
    example: 0.5,
  })
  conversionRateChange: number;

  @ApiProperty({
    description: 'Total completed purchases',
    example: 320,
  })
  completedPurchases: number;

  @ApiProperty({
    description: 'Total abandonment at all steps',
    example: 9680,
  })
  totalAbandonment: number;

  @ApiProperty({
    description: 'Average time to conversion in minutes',
    example: 45.5,
  })
  averageTimeToConversion: number;

  @ApiProperty({
    description: 'Fastest conversion time in minutes',
    example: 5.2,
  })
  fastestConversion: number;

  @ApiProperty({
    description: 'Slowest conversion time in minutes',
    example: 1440,
  })
  slowestConversion: number;
}

/**
 * Funnel Step Response DTO
 * @description Detailed metrics for individual funnel step
 */
export class FunnelStepDto {
  @ApiProperty({
    description: 'Funnel step name',
    enum: FunnelStep,
  })
  step: FunnelStep;

  @ApiProperty({
    description: 'Display name for step',
    example: 'Product View',
  })
  displayName: string;

  @ApiProperty({
    description: 'Arabic display name',
    example: 'عرض المنتج',
  })
  displayNameAr: string;

  @ApiProperty({
    description: 'Step order in funnel (0-based)',
    example: 0,
  })
  order: number;

  @ApiProperty({
    description: 'Users reaching this step',
    example: 10000,
  })
  users: number;

  @ApiProperty({
    description: 'Users progressing to next step',
    example: 6500,
  })
  progressedToNext: number;

  @ApiProperty({
    description: 'Users dropping off at this step',
    example: 3500,
  })
  droppedOff: number;

  @ApiProperty({
    description: 'Conversion rate to next step (%)',
    example: 65,
  })
  conversionRateToNext: number;

  @ApiProperty({
    description: 'Drop-off rate at this step (%)',
    example: 35,
  })
  dropOffRate: number;

  @ApiProperty({
    description: 'Average time spent at step in seconds',
    example: 120,
  })
  averageTimeAtStep: number;

  @ApiProperty({
    description: 'Percentage of initial funnel users',
    example: 100,
  })
  percentageOfInitial: number;
}

/**
 * Drop-off Analysis Response DTO
 * @description Detailed analysis of funnel drop-offs
 */
export class DropOffAnalysisDto {
  @ApiProperty({
    description: 'Funnel step where drop-off occurred',
    enum: FunnelStep,
  })
  step: FunnelStep;

  @ApiProperty({
    description: 'Total drop-offs at this step',
    example: 3500,
  })
  totalDropOffs: number;

  @ApiProperty({
    description: 'Top reasons for drop-off',
    type: [Object],
    example: [
      { reason: 'high_shipping_cost', count: 1200, percentage: 34.3 },
      { reason: 'out_of_stock', count: 800, percentage: 22.9 },
    ],
  })
  dropOffReasons: Array<{
    reason: string;
    reasonAr?: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Average time before drop-off in seconds',
    example: 85,
  })
  averageTimeBeforeDropOff: number;

  @ApiProperty({
    description: 'Drop-off by device type',
    type: [Object],
  })
  dropOffByDevice: Array<{
    device: DeviceType;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Drop-off by time of day (24-hour format)',
    type: [Object],
  })
  dropOffByHour: Array<{
    hour: number;
    count: number;
  }>;
}

/**
 * Device Funnel Response DTO
 * @description Conversion funnel breakdown by device type
 */
export class DeviceFunnelDto {
  @ApiProperty({
    description: 'Device type',
    enum: DeviceType,
  })
  device: DeviceType;

  @ApiProperty({
    description: 'Total users on device',
    example: 6000,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Overall conversion rate for device',
    example: 2.8,
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Completed purchases on device',
    example: 168,
  })
  completedPurchases: number;

  @ApiProperty({
    description: 'Funnel steps performance on device',
    type: [FunnelStepDto],
  })
  steps: FunnelStepDto[];

  @ApiProperty({
    description: 'Average session duration in minutes',
    example: 8.5,
  })
  averageSessionDuration: number;
}

/**
 * Funnel Event Tracking Request DTO
 * @description Track custom funnel events
 */
export class TrackFunnelEventDto {
  @ApiProperty({
    description: 'Funnel step being tracked',
    enum: FunnelStep,
    example: FunnelStep.ADD_TO_CART,
  })
  @IsEnum(FunnelStep)
  step: FunnelStep;

  @ApiProperty({
    description: 'User session ID',
    example: 'sess_abc123xyz',
  })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'User ID (if authenticated)',
    example: 1234,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Product ID (if applicable)',
    example: 567,
  })
  @IsOptional()
  @IsNumber()
  productId?: number;

  @ApiProperty({
    description: 'Device type',
    enum: DeviceType,
    example: DeviceType.MOBILE,
  })
  @IsEnum(DeviceType)
  device: DeviceType;

  @ApiPropertyOptional({
    description: 'Additional event metadata',
    example: { cartValue: 125000, itemCount: 3 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2024-01-22T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;
}

// =============================================================================
// CART ABANDONMENT DTOs
// =============================================================================

/**
 * Abandonment Rate Response DTO
 * @description Cart abandonment rate metrics
 */
export class AbandonmentRateDto {
  @ApiProperty({
    description: 'Overall cart abandonment rate (%)',
    example: 68.5,
  })
  overallRate: number;

  @ApiProperty({
    description: 'Abandonment rate change from previous period',
    example: -2.3,
  })
  rateChange: number;

  @ApiProperty({
    description: 'Total carts created',
    example: 5000,
  })
  totalCarts: number;

  @ApiProperty({
    description: 'Total abandoned carts',
    example: 3425,
  })
  abandonedCarts: number;

  @ApiProperty({
    description: 'Total completed checkouts',
    example: 1575,
  })
  completedCheckouts: number;

  @ApiProperty({
    description: 'Total value of abandoned carts in SYP',
    example: 425000000,
  })
  abandonedValue: number;

  @ApiProperty({
    description: 'Average abandoned cart value in SYP',
    example: 124088,
  })
  averageAbandonedValue: number;

  @ApiProperty({
    description: 'Abandonment rate by device type',
    type: [Object],
  })
  byDevice: Array<{
    device: DeviceType;
    rate: number;
    count: number;
  }>;

  @ApiProperty({
    description: 'Abandonment rate by cart value range',
    type: [Object],
    example: [
      { range: '0-100k', rate: 55.2, count: 800 },
      { range: '100k-500k', rate: 72.8, count: 1500 },
    ],
  })
  byValueRange: Array<{
    range: string;
    rate: number;
    count: number;
  }>;
}

/**
 * Recovery Campaign Metrics Response DTO
 * @description Cart abandonment recovery campaign performance
 */
export class RecoveryCampaignMetricsDto {
  @ApiProperty({
    description: 'Total recovery emails sent',
    example: 2500,
  })
  emailsSent: number;

  @ApiProperty({
    description: 'Email open rate (%)',
    example: 35.5,
  })
  openRate: number;

  @ApiProperty({
    description: 'Email click-through rate (%)',
    example: 12.3,
  })
  clickThroughRate: number;

  @ApiProperty({
    description: 'Recovery rate (carts recovered / emails sent) (%)',
    example: 8.5,
  })
  recoveryRate: number;

  @ApiProperty({
    description: 'Total carts recovered',
    example: 213,
  })
  cartsRecovered: number;

  @ApiProperty({
    description: 'Total revenue recovered in SYP',
    example: 28000000,
  })
  revenueRecovered: number;

  @ApiProperty({
    description: 'Average recovery time in hours',
    example: 18.5,
  })
  averageRecoveryTime: number;

  @ApiProperty({
    description: 'ROI of recovery campaigns',
    example: 12.5,
  })
  roi: number;

  @ApiProperty({
    description: 'Recovery performance by email timing',
    type: [Object],
    example: [
      { timing: '1_hour', sent: 800, recovered: 95, rate: 11.9 },
      { timing: '24_hours', sent: 850, recovered: 68, rate: 8.0 },
    ],
  })
  byEmailTiming: Array<{
    timing: string;
    sent: number;
    recovered: number;
    rate: number;
  }>;
}

/**
 * Abandonment Reason Analysis Response DTO
 * @description Analysis of reasons for cart abandonment
 */
export class AbandonmentReasonDto {
  @ApiProperty({
    description: 'Abandonment reason identifier',
    example: 'high_shipping_cost',
  })
  reason: string;

  @ApiProperty({
    description: 'Reason display name',
    example: 'High Shipping Cost',
  })
  displayName: string;

  @ApiProperty({
    description: 'Arabic display name',
    example: 'تكلفة الشحن مرتفعة',
  })
  displayNameAr: string;

  @ApiProperty({
    description: 'Number of abandonments due to this reason',
    example: 1200,
  })
  count: number;

  @ApiProperty({
    description: 'Percentage of total abandonments',
    example: 35.0,
  })
  percentage: number;

  @ApiProperty({
    description: 'Average cart value for this reason in SYP',
    example: 145000,
  })
  averageCartValue: number;

  @ApiProperty({
    description: 'Potential revenue loss in SYP',
    example: 174000000,
  })
  potentialRevenueLoss: number;

  @ApiProperty({
    description: 'Recommended action to reduce this abandonment',
    example: 'Offer free shipping above certain threshold',
  })
  recommendedAction: string;
}

/**
 * Abandoned Cart Session Response DTO
 * @description Individual abandoned cart session details
 */
export class AbandonedCartSessionDto {
  @ApiProperty({
    description: 'Cart session ID',
    example: 'cart_abc123xyz',
  })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'User ID (null for guest)',
    example: 1234,
  })
  userId?: number;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'customer@example.com',
  })
  email?: string;

  @ApiProperty({
    description: 'Cart value in SYP',
    example: 235000,
  })
  cartValue: number;

  @ApiProperty({
    description: 'Number of items in cart',
    example: 4,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Cart creation timestamp',
    example: '2024-01-22T08:15:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last activity timestamp',
    example: '2024-01-22T08:45:00Z',
  })
  lastActivityAt: Date;

  @ApiProperty({
    description: 'Time since abandonment in hours',
    example: 12.5,
  })
  hoursSinceAbandonment: number;

  @ApiProperty({
    description: 'Device type used',
    enum: DeviceType,
  })
  device: DeviceType;

  @ApiProperty({
    description: 'Abandonment reason',
    example: 'checkout_complexity',
  })
  abandonmentReason?: string;

  @ApiProperty({
    description: 'Recovery email status',
    enum: RecoveryStatus,
  })
  recoveryStatus: RecoveryStatus;

  @ApiProperty({
    description: 'Cart items summary',
    type: [Object],
  })
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * Trigger Recovery Campaign Request DTO
 * @description Request to trigger cart recovery campaign
 */
export class TriggerRecoveryDto {
  @ApiProperty({
    description: 'Cart session IDs to target',
    type: [String],
    example: ['cart_abc123', 'cart_xyz789'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  cartSessionIds: string[];

  @ApiPropertyOptional({
    description: 'Email template to use',
    example: 'abandoned_cart_24h',
  })
  @IsOptional()
  @IsString()
  emailTemplate?: string;

  @ApiPropertyOptional({
    description: 'Discount code to include',
    example: 'COMEBACK10',
  })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiPropertyOptional({
    description: 'Schedule send time (if not immediate)',
    example: '2024-01-23T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Test mode (don\'t send actual emails)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  testMode?: boolean;
}

// =============================================================================
// COHORT ANALYSIS DTOs
// =============================================================================

/**
 * Retention Cohort Response DTO
 * @description User retention cohort analysis
 */
export class RetentionCohortDto {
  @ApiProperty({
    description: 'Cohort identifier (e.g., "2024-W03" for weekly)',
    example: '2024-01',
  })
  cohortId: string;

  @ApiProperty({
    description: 'Cohort start date',
    example: '2024-01-01',
  })
  cohortDate: Date;

  @ApiProperty({
    description: 'Number of users in cohort',
    example: 250,
  })
  userCount: number;

  @ApiProperty({
    description: 'Retention rates by period (indexed by period number)',
    type: Object,
    example: {
      0: 100,
      1: 45.2,
      2: 38.8,
      3: 35.6,
      4: 33.2,
    },
  })
  retentionRates: Record<number, number>;

  @ApiProperty({
    description: 'Absolute user counts by period',
    type: Object,
    example: {
      0: 250,
      1: 113,
      2: 97,
      3: 89,
      4: 83,
    },
  })
  retentionCounts: Record<number, number>;

  @ApiProperty({
    description: 'Average retention rate across all periods',
    example: 50.56,
  })
  averageRetention: number;

  @ApiProperty({
    description: 'Cohort grouping period',
    enum: CohortPeriod,
  })
  period: CohortPeriod;
}

/**
 * Revenue Cohort Response DTO
 * @description Revenue generation cohort analysis
 */
export class RevenueCohortDto {
  @ApiProperty({
    description: 'Cohort identifier',
    example: '2024-01',
  })
  cohortId: string;

  @ApiProperty({
    description: 'Cohort start date',
    example: '2024-01-01',
  })
  cohortDate: Date;

  @ApiProperty({
    description: 'Number of users in cohort',
    example: 250,
  })
  userCount: number;

  @ApiProperty({
    description: 'Revenue generated by period in SYP',
    type: Object,
    example: {
      0: 35000000,
      1: 12000000,
      2: 9500000,
      3: 8200000,
    },
  })
  revenueByPeriod: Record<number, number>;

  @ApiProperty({
    description: 'Cumulative revenue by period in SYP',
    type: Object,
    example: {
      0: 35000000,
      1: 47000000,
      2: 56500000,
      3: 64700000,
    },
  })
  cumulativeRevenue: Record<number, number>;

  @ApiProperty({
    description: 'Average revenue per user by period in SYP',
    type: Object,
  })
  averageRevenuePerUser: Record<number, number>;

  @ApiProperty({
    description: 'Total lifetime value of cohort in SYP',
    example: 64700000,
  })
  totalLifetimeValue: number;

  @ApiProperty({
    description: 'Average LTV per user in SYP',
    example: 258800,
  })
  averageLTV: number;

  @ApiProperty({
    description: 'Cohort grouping period',
    enum: CohortPeriod,
  })
  period: CohortPeriod;
}

/**
 * Behavioral Cohort Response DTO
 * @description User behavior pattern cohort analysis
 */
export class BehavioralCohortDto {
  @ApiProperty({
    description: 'Cohort identifier',
    example: '2024-01',
  })
  cohortId: string;

  @ApiProperty({
    description: 'Cohort start date',
    example: '2024-01-01',
  })
  cohortDate: Date;

  @ApiProperty({
    description: 'Number of users in cohort',
    example: 250,
  })
  userCount: number;

  @ApiProperty({
    description: 'Average order frequency by period',
    type: Object,
    example: {
      0: 1.2,
      1: 0.8,
      2: 0.6,
      3: 0.5,
    },
  })
  orderFrequency: Record<number, number>;

  @ApiProperty({
    description: 'Average time between orders in days',
    type: Object,
  })
  daysBetweenOrders: Record<number, number>;

  @ApiProperty({
    description: 'Category affinity (top categories by period)',
    type: Object,
    example: {
      0: ['Electronics', 'Fashion'],
      1: ['Home & Garden', 'Electronics'],
    },
  })
  categoryAffinity: Record<number, string[]>;

  @ApiProperty({
    description: 'Preferred shopping time by period (hour of day)',
    type: Object,
  })
  preferredShoppingTime: Record<number, number>;

  @ApiProperty({
    description: 'Device preference by period',
    type: Object,
  })
  devicePreference: Record<number, DeviceType>;

  @ApiProperty({
    description: 'Average session duration in minutes by period',
    type: Object,
  })
  sessionDuration: Record<number, number>;
}

/**
 * Cohort Detail Response DTO
 * @description Comprehensive cohort analysis
 */
export class CohortDetailDto {
  @ApiProperty({
    description: 'Cohort identifier',
    example: '2024-01',
  })
  cohortId: string;

  @ApiProperty({
    description: 'Cohort metadata',
    type: Object,
  })
  metadata: {
    startDate: Date;
    endDate: Date;
    period: CohortPeriod;
    userCount: number;
  };

  @ApiProperty({
    description: 'Retention analysis',
    type: RetentionCohortDto,
  })
  retention: RetentionCohortDto;

  @ApiProperty({
    description: 'Revenue analysis',
    type: RevenueCohortDto,
  })
  revenue: RevenueCohortDto;

  @ApiProperty({
    description: 'Behavioral analysis',
    type: BehavioralCohortDto,
  })
  behavior: BehavioralCohortDto;
}

/**
 * Create Custom Cohort Request DTO
 * @description Request to create custom cohort definition
 */
export class CreateCohortDto {
  @ApiProperty({
    description: 'Cohort name',
    example: 'Q1 2024 High-Value Customers',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Cohort description',
    example: 'Customers who made first purchase in Q1 2024 with CLV > 1M SYP',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Cohort period type',
    enum: CohortPeriod,
    example: CohortPeriod.MONTHLY,
  })
  @IsEnum(CohortPeriod)
  period: CohortPeriod;

  @ApiProperty({
    description: 'Start date for cohort definition',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for cohort definition',
    example: '2024-03-31',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'User filter criteria',
    example: { minCLV: 1000000, segment: 'high_value' },
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

// =============================================================================
// EVENT TRACKING DTOs
// =============================================================================

/**
 * Track Event Request DTO
 * @description Manual event tracking
 */
export class TrackEventDto {
  @ApiProperty({
    description: 'Event name/identifier',
    example: 'product_wishlisted',
  })
  @IsString()
  eventName: string;

  @ApiProperty({
    description: 'Event category',
    enum: EventCategory,
    example: EventCategory.USER_ACTION,
  })
  @IsEnum(EventCategory)
  category: EventCategory;

  @ApiPropertyOptional({
    description: 'User ID (if authenticated)',
    example: 1234,
  })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({
    description: 'Session ID',
    example: 'sess_abc123xyz',
  })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Event properties/metadata',
    example: { productId: 567, categoryId: 12, price: 125000 },
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiProperty({
    description: 'Event timestamp',
    example: '2024-01-22T10:30:00Z',
  })
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional({
    description: 'Device type',
    enum: DeviceType,
  })
  @IsOptional()
  @IsEnum(DeviceType)
  device?: DeviceType;

  @ApiPropertyOptional({
    description: 'Page/screen where event occurred',
    example: '/product/567',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
    example: '/category/electronics',
  })
  @IsOptional()
  @IsString()
  referrer?: string;
}

/**
 * Event Summary Response DTO
 * @description Aggregated event tracking summary
 */
export class EventSummaryDto {
  @ApiProperty({
    description: 'Total events tracked',
    example: 125000,
  })
  totalEvents: number;

  @ApiProperty({
    description: 'Unique users tracked',
    example: 8500,
  })
  uniqueUsers: number;

  @ApiProperty({
    description: 'Unique sessions tracked',
    example: 15000,
  })
  uniqueSessions: number;

  @ApiProperty({
    description: 'Events by category',
    type: [Object],
  })
  byCategory: Array<{
    category: EventCategory;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Top 10 events by frequency',
    type: [Object],
    example: [
      { eventName: 'page_view', count: 45000, percentage: 36.0 },
      { eventName: 'product_view', count: 28000, percentage: 22.4 },
    ],
  })
  topEvents: Array<{
    eventName: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Events per user average',
    example: 14.7,
  })
  eventsPerUser: number;

  @ApiProperty({
    description: 'Events per session average',
    example: 8.3,
  })
  eventsPerSession: number;

  @ApiProperty({
    description: 'Events by device type',
    type: [Object],
  })
  byDevice: Array<{
    device: DeviceType;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Events by hour of day (0-23)',
    type: [Object],
  })
  byHour: Array<{
    hour: number;
    count: number;
  }>;
}

/**
 * Active Session Metrics Response DTO
 * @description Real-time active session analytics
 */
export class ActiveSessionMetricsDto {
  @ApiProperty({
    description: 'Current active sessions',
    example: 234,
  })
  activeSessions: number;

  @ApiProperty({
    description: 'Change from 5 minutes ago',
    example: 12,
  })
  sessionChange: number;

  @ApiProperty({
    description: 'Active authenticated users',
    example: 156,
  })
  activeUsers: number;

  @ApiProperty({
    description: 'Active guest sessions',
    example: 78,
  })
  guestSessions: number;

  @ApiProperty({
    description: 'Sessions by page/route',
    type: [Object],
    example: [
      { page: '/products', sessions: 45 },
      { page: '/cart', sessions: 23 },
    ],
  })
  sessionsByPage: Array<{
    page: string;
    sessions: number;
  }>;

  @ApiProperty({
    description: 'Sessions by device type',
    type: [Object],
  })
  sessionsByDevice: Array<{
    device: DeviceType;
    count: number;
  }>;

  @ApiProperty({
    description: 'Average session duration in minutes',
    example: 5.8,
  })
  averageSessionDuration: number;

  @ApiProperty({
    description: 'Sessions in checkout process',
    example: 12,
  })
  checkoutSessions: number;

  @ApiProperty({
    description: 'Active carts (with items)',
    example: 67,
  })
  activeCarts: number;
}

// =============================================================================
// QUERY PARAMETER DTOs
// =============================================================================

/**
 * CLV Query Parameters DTO
 * @description Query parameters for CLV endpoints
 */
export class CLVQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by customer segment',
    enum: CustomerSegment,
  })
  @IsOptional()
  @IsEnum(CustomerSegment)
  segment?: CustomerSegment;

  @ApiPropertyOptional({
    description: 'Minimum CLV filter in SYP',
    example: 500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCLV?: number;

  @ApiPropertyOptional({
    description: 'Maximum CLV filter in SYP',
    example: 5000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxCLV?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['clv', 'orderCount', 'lastPurchase'],
    default: 'clv',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: string;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Results offset for pagination',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}

/**
 * Funnel Query Parameters DTO
 * @description Query parameters for funnel endpoints
 */
export class FunnelQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analysis',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by device type',
    enum: DeviceType,
  })
  @IsOptional()
  @IsEnum(DeviceType)
  device?: DeviceType;

  @ApiPropertyOptional({
    description: 'Filter by product category',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Include comparison with previous period',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  compareWithPrevious?: boolean;
}

/**
 * Abandonment Query Parameters DTO
 * @description Query parameters for cart abandonment endpoints
 */
export class AbandonmentQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analysis',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analysis',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by device type',
    enum: DeviceType,
  })
  @IsOptional()
  @IsEnum(DeviceType)
  device?: DeviceType;

  @ApiPropertyOptional({
    description: 'Minimum cart value filter in SYP',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minCartValue?: number;

  @ApiPropertyOptional({
    description: 'Include only carts older than X hours',
    example: 24,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minAgeHours?: number;

  @ApiPropertyOptional({
    description: 'Recovery status filter',
    enum: RecoveryStatus,
  })
  @IsOptional()
  @IsEnum(RecoveryStatus)
  recoveryStatus?: RecoveryStatus;
}

/**
 * Cohort Query Parameters DTO
 * @description Query parameters for cohort endpoints
 */
export class CohortQueryDto {
  @ApiPropertyOptional({
    description: 'Cohort period type',
    enum: CohortPeriod,
    default: CohortPeriod.MONTHLY,
  })
  @IsOptional()
  @IsEnum(CohortPeriod)
  period?: CohortPeriod;

  @ApiPropertyOptional({
    description: 'Start date for cohort analysis',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for cohort analysis',
    example: '2024-06-30',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Number of periods to track',
    default: 12,
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(52)
  periodCount?: number;
}

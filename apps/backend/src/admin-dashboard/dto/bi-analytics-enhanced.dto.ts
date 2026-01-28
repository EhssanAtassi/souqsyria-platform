/**
 * @file bi-analytics-enhanced.dto.ts
 * @description Enhanced BI Analytics DTOs for Admin Dashboard Integration
 * 
 * ORGANIZATION:
 * - Query/Request DTOs for API inputs
 * - Response DTOs for API outputs
 * - Nested DTOs for complex structures
 * - Comprehensive validation with class-validator
 * - Full Swagger documentation with Syrian market examples
 * 
 * @module AdminDashboard/DTOs
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 2.0.0
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDate,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsDateString,
  IsPositive,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ===========================================================================
// COMMON QUERY DTOs
// ===========================================================================

/**
 * Date range query DTO for time-based analytics
 */
export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics period (ISO 8601 format)',
    example: '2026-01-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics period (ISO 8601 format)',
    example: '2026-01-31',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * Pagination query DTO
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}

/**
 * Segment filter DTO
 */
export class SegmentFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by customer segment',
    enum: ['champions', 'loyal', 'potential_loyalists', 'at_risk', 'hibernating', 'lost'],
    example: 'champions',
  })
  @IsOptional()
  @IsEnum(['champions', 'loyal', 'potential_loyalists', 'at_risk', 'hibernating', 'lost'])
  segment?: string;
}

// ===========================================================================
// ENHANCED DASHBOARD DTOs
// ===========================================================================

/**
 * Enhanced dashboard summary response
 */
export class EnhancedDashboardSummaryDto {
  @ApiProperty({
    description: 'Revenue metrics',
    example: { total: 125000000, growth: 15.5 },
  })
  revenue: {
    total: number;
    growth: number;
  };

  @ApiProperty({
    description: 'Order metrics',
    example: { total: 850, growth: 12.3 },
  })
  orders: {
    total: number;
    growth: number;
  };

  @ApiProperty({
    description: 'User metrics',
    example: { total: 1250, growth: 8.7 },
  })
  users: {
    total: number;
    growth: number;
  };

  @ApiProperty({
    description: 'Product metrics',
    example: { total: 450, pending: 23 },
  })
  products: {
    total: number;
    pending: number;
  };

  @ApiProperty({
    description: 'CLV insights',
    example: {
      averageCLV: 2500000,
      totalCLV: 3125000000,
      topSegmentContribution: 0.45,
      atRiskCustomers: 250,
    },
  })
  clv: {
    averageCLV: number;
    totalCLV: number;
    topSegmentContribution: number;
    atRiskCustomers: number;
  };

  @ApiProperty({
    description: 'Conversion funnel metrics',
    example: {
      overallConversionRate: 0.038,
      totalConversions: 324,
      biggestDropOff: { stage: 'checkout', dropOffRate: 0.65 },
      averageTimeToConvert: '4.5 days',
    },
  })
  funnel: {
    overallConversionRate: number;
    totalConversions: number;
    biggestDropOff: {
      stage: string;
      dropOffRate: number;
    };
    averageTimeToConvert: string;
  };

  @ApiProperty({
    description: 'Cart abandonment metrics',
    example: {
      rate: 0.72,
      totalAbandoned: 1850,
      recoveryRate: 0.18,
      lostRevenue: 98500000,
    },
  })
  abandonment: {
    rate: number;
    totalAbandoned: number;
    recoveryRate: number;
    lostRevenue: number;
  };

  @ApiProperty({
    description: 'Cohort retention highlights',
    example: {
      latestCohortRetention: 0.28,
      averageRetention: 0.22,
      strongestCohort: '2025-12-monthly',
    },
  })
  cohorts: {
    latestCohortRetention: number;
    averageRetention: number;
    strongestCohort: string;
  };

  @ApiProperty({
    description: 'Date range for metrics',
    example: { startDate: '2026-01-01', endDate: '2026-01-31' },
  })
  dateRange: {
    startDate?: string;
    endDate?: string;
  };

  @ApiProperty({
    description: 'Timestamp when metrics were generated',
    example: '2026-01-22T10:30:00Z',
  })
  generatedAt: Date;
}

/**
 * Business intelligence overview response
 */
export class BIOverviewResponseDto {
  @ApiProperty({ description: 'Customer Lifetime Value analytics' })
  customerLifetimeValue: {
    totalCLV: number;
    averageCLV: number;
    medianCLV: number;
    top20PercentContribution: number;
    segmentDistribution: Array<{
      segment: string;
      customerCount: number;
      averageCLV: number;
      revenueContribution: number;
    }>;
  };

  @ApiProperty({ description: 'Conversion funnel performance' })
  conversionFunnel: {
    overallConversionRate: number;
    totalSessions: number;
    totalConversions: number;
    averageTimeToConvert: string;
    stagePerformance: Array<{
      stage: string;
      conversionRate: number;
      dropOffRate: number;
    }>;
  };

  @ApiProperty({ description: 'Cart abandonment insights' })
  cartAbandonment: {
    abandonmentRate: number;
    totalAbandonments: number;
    averageAbandonedValue: number;
    recoveryRate: number;
    topReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;
  };

  @ApiProperty({ description: 'Cohort analysis highlights' })
  cohortInsights: {
    totalCohorts: number;
    strongestCohort: string;
    averageRetention: number;
    recentCohortsPerformance: Array<{
      cohortId: string;
      cohortName: string;
      customerCount: number;
      retentionRate: number;
    }>;
  };

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;

  @ApiProperty({ description: 'Date range for analysis' })
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
}

// ===========================================================================
// CLV ANALYTICS DTOs
// ===========================================================================

/**
 * CLV summary response
 */
export class CLVSummaryResponseDto {
  @ApiProperty({
    description: 'Total number of customers analyzed',
    example: 1250,
  })
  totalCustomers: number;

  @ApiProperty({
    description: 'Total CLV across all customers (SYP)',
    example: 3125000000,
  })
  totalCLV: number;

  @ApiProperty({
    description: 'Average CLV per customer (SYP)',
    example: 2500000,
  })
  averageCLV: number;

  @ApiProperty({
    description: 'Median CLV for balanced view (SYP)',
    example: 1800000,
  })
  medianCLV: number;

  @ApiProperty({
    description: 'Revenue contribution from top 20% of customers',
    example: 0.68,
  })
  top20PercentContribution: number;

  @ApiProperty({
    description: 'CLV breakdown by customer segment',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        segment: { type: 'string', example: 'champions' },
        customerCount: { type: 'number', example: 188 },
        percentage: { type: 'number', example: 0.15 },
        averageCLV: { type: 'number', example: 8500000 },
        revenueContribution: { type: 'number', example: 0.45 },
      },
    },
  })
  bySegment: Array<{
    segment: string;
    customerCount: number;
    percentage: number;
    averageCLV: number;
    revenueContribution: number;
  }>;

  @ApiProperty({
    description: 'Churn risk distribution',
    example: { low: 650, medium: 400, high: 200 },
  })
  churnRisk: {
    low: number;
    medium: number;
    high: number;
  };

  @ApiProperty({
    description: 'Customer acquisition trends over time',
    type: 'array',
  })
  acquisitionTrends: Array<{
    period: string;
    newCustomers: number;
    averageCLV: number;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Customer segments response
 */
export class CustomerSegmentsResponseDto {
  @ApiProperty({
    description: 'Customer segments with detailed metrics',
    type: 'array',
  })
  segments: Array<{
    segment: string;
    customerCount: number;
    percentage: number;
    averageCLV: number;
    totalRevenue: number;
    revenueContribution: number;
    averageOrders: number;
    averageRecency: number;
    churnRate: number;
    retentionActions: string[];
  }>;

  @ApiProperty({
    description: 'Total customers across all segments',
    example: 1250,
  })
  totalCustomers: number;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * CLV predictions response
 */
export class CLVPredictionsResponseDto {
  @ApiProperty({
    description: 'Prediction time horizon',
    example: '12_months',
    enum: ['3_months', '6_months', '12_months'],
  })
  horizon: string;

  @ApiProperty({
    description: 'Total predicted CLV across all customers (SYP)',
    example: 4250000000,
  })
  totalPredictedCLV: number;

  @ApiProperty({
    description: 'Average predicted growth percentage',
    example: 36.5,
  })
  averagePredictedGrowth: number;

  @ApiProperty({
    description: 'Top customer predictions',
    type: 'array',
  })
  predictions: Array<{
    userId: number;
    email: string;
    currentCLV: number;
    predictedCLV: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    growthPotential: number;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Enhanced Customer CLV detail response with RFM scoring and predictions
 */
export class EnhancedCustomerCLVDetailDto {
  @ApiProperty({ description: 'Customer user ID', example: 123 })
  userId: number;

  @ApiProperty({ description: 'Customer email', example: 'ahmad@example.sy' })
  email: string;

  @ApiProperty({ description: 'Customer name', example: 'Ahmad Hassan' })
  name: string;

  @ApiProperty({ description: 'Historical CLV (SYP)', example: 5250000 })
  historicalCLV: number;

  @ApiProperty({ description: 'Predicted future CLV (SYP)', example: 3400000 })
  predictedCLV: number;

  @ApiProperty({ description: 'Total CLV (historical + predicted, SYP)', example: 8650000 })
  totalCLV: number;

  @ApiProperty({ description: 'RFM score', example: { r: 4, f: 5, m: 5 } })
  rfmScore: {
    r: number;
    f: number;
    m: number;
  };

  @ApiProperty({ description: 'Customer segment', example: 'loyal_customers' })
  segment: string;

  @ApiProperty({ description: 'Churn probability (0-1)', example: 0.15 })
  churnProbability: number;

  @ApiProperty({ description: 'Recommended retention action', example: 'personalized_offers' })
  retentionAction: string;

  @ApiProperty({ description: 'Total order count', example: 12 })
  orderCount: number;

  @ApiProperty({ description: 'Purchase frequency (orders per month)', example: 2.4 })
  frequency: number;

  @ApiProperty({ description: 'Average monetary value per order (SYP)', example: 437500 })
  monetary: number;

  @ApiProperty({ description: 'Days since last purchase', example: 15 })
  recency: number;

  @ApiProperty({ description: 'First order date', example: '2025-06-15' })
  firstOrderDate: Date;

  @ApiProperty({ description: 'Last order date', example: '2026-01-07' })
  lastOrderDate: Date;

  @ApiProperty({ description: 'Customer lifespan in days', example: 206 })
  lifespanDays: number;

  @ApiProperty({ description: 'CLV calculation timestamp' })
  calculatedAt: Date;
}

/**
 * Recalculate CLV request
 */
export class RecalculateCLVRequestDto {
  @ApiProperty({
    description: 'Recalculation scope',
    enum: ['all', 'segment', 'modified_since'],
    example: 'all',
  })
  @IsEnum(['all', 'segment', 'modified_since'])
  scope: 'all' | 'segment' | 'modified_since';

  @ApiPropertyOptional({
    description: 'Customer segments to recalculate (required if scope is "segment")',
    type: [String],
    example: ['at_risk', 'hibernating'],
  })
  @IsOptional()
  @IsArray()
  segments?: string[];

  @ApiPropertyOptional({
    description: 'Recalculate customers modified since this date (required if scope is "modified_since")',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  since?: string;
}

/**
 * Recalculate CLV response
 */
export class RecalculateCLVResponseDto {
  @ApiProperty({ description: 'Background job ID', example: 'clv_recalc_1737540600000' })
  jobId: string;

  @ApiProperty({ description: 'Job status', example: 'queued' })
  status: string;

  @ApiProperty({ description: 'Estimated customers to process', example: 1250 })
  estimatedCustomers: number;

  @ApiProperty({ description: 'Estimated duration in minutes', example: 25 })
  estimatedDuration: number;

  @ApiProperty({ description: 'Job start timestamp' })
  startedAt: Date;

  @ApiProperty({ description: 'Status message' })
  message: string;
}

// ===========================================================================
// CONVERSION FUNNEL DTOs
// ===========================================================================

/**
 * Funnel overview response
 */
export class FunnelOverviewResponseDto {
  @ApiProperty({ description: 'Overall conversion rate', example: 0.038 })
  overallConversionRate: number;

  @ApiProperty({ description: 'Total sessions analyzed', example: 8520 })
  totalSessions: number;

  @ApiProperty({ description: 'Total conversions (purchases)', example: 324 })
  totalConversions: number;

  @ApiProperty({ description: 'Average time to convert', example: '4.5 days' })
  averageTimeToConvert: string;

  @ApiProperty({
    description: 'Biggest drop-off stage',
    example: { stage: 'checkout', stageName: 'Checkout Initiation', dropOffRate: 0.65 },
  })
  biggestDropOff: {
    stage: string;
    stageName: string;
    dropOffRate: number;
  };

  @ApiProperty({ description: 'Funnel performance by channel' })
  byChannel: Record<string, { conversionRate: number; sessions: number }>;

  @ApiProperty({ description: 'Funnel performance by device type' })
  byDevice: Record<string, { conversionRate: number; sessions: number }>;

  @ApiProperty({ description: 'Funnel performance by UTM source' })
  byUTMSource: Record<string, { conversionRate: number; sessions: number }>;

  @ApiProperty({ description: 'Analysis date range' })
  dateRange: {
    startDate: string;
    endDate: string;
  };

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Funnel steps response
 */
export class FunnelStepsResponseDto {
  @ApiProperty({
    description: 'Funnel stage details',
    type: 'array',
  })
  steps: Array<{
    stage: string;
    stageName: string;
    enteredCount: number;
    completedCount: number;
    conversionRate: number;
    dropOffRate: number;
    averageTimeSpent: string;
    medianTimeSpent: string;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Funnel drop-off response
 */
export class FunnelDropOffResponseDto {
  @ApiProperty({
    description: 'Biggest drop-off point',
    example: { stage: 'checkout', stageName: 'Checkout', dropOffRate: 0.65 },
  })
  biggestDropOff: {
    stage: string;
    stageName: string;
    dropOffRate: number;
  };

  @ApiProperty({
    description: 'Drop-off details by stage',
    type: 'array',
  })
  dropOffs: Array<{
    stage: string;
    stageName: string;
    dropOffCount: number;
    dropOffRate: number;
    lostRevenue: number;
  }>;

  @ApiProperty({ description: 'Total drop-offs across all stages', example: 5280 })
  totalDropOffs: number;

  @ApiProperty({ description: 'Total estimated lost revenue (SYP)', example: 264000000 })
  totalLostRevenue: number;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Device funnel response
 */
export class DeviceFunnelResponseDto {
  @ApiProperty({
    description: 'Funnel metrics by device type',
    example: {
      mobile: { sessions: 5964, conversions: 149, conversionRate: 0.025 },
      desktop: { sessions: 2130, conversions: 149, conversionRate: 0.070 },
      tablet: { sessions: 426, conversions: 26, conversionRate: 0.061 },
    },
  })
  byDevice: Record<string, {
    sessions: number;
    conversions: number;
    conversionRate: number;
    averageTimeToConvert?: string;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Track funnel event request
 */
export class TrackFunnelEventRequestDto {
  @ApiProperty({ description: 'Session ID', example: 'sess_abc123' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'User ID (if authenticated)', example: 456 })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'Event type', example: 'checkout_initiated' })
  @IsString()
  eventType: string;

  @ApiPropertyOptional({ description: 'A/B test variant', example: 'express_checkout' })
  @IsOptional()
  @IsString()
  variant?: string;

  @ApiPropertyOptional({ description: 'Event metadata', example: { cartValue: 1500000, itemCount: 3 } })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Track funnel event response
 */
export class TrackFunnelEventResponseDto {
  @ApiProperty({ description: 'Tracking success', example: true })
  success: boolean;

  @ApiProperty({ description: 'Event ID', example: 'evt_1737540600_abc123' })
  eventId: string;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Confirmation message' })
  message: string;
}

// ===========================================================================
// CART ABANDONMENT DTOs
// ===========================================================================

/**
 * Abandonment rate response
 */
export class AbandonmentRateResponseDto {
  @ApiProperty({ description: 'Overall abandonment rate', example: 0.72 })
  overallRate: number;

  @ApiProperty({ description: 'Total abandoned carts', example: 1850 })
  totalAbandoned: number;

  @ApiProperty({ description: 'Average abandoned cart value (SYP)', example: 1200000 })
  averageAbandonedValue: number;

  @ApiProperty({ description: 'Recovery rate', example: 0.18 })
  recoveryRate: number;

  @ApiProperty({ description: 'Estimated lost revenue (SYP)', example: 98500000 })
  lostRevenue: number;

  @ApiProperty({ description: 'Abandonment trend over time', type: 'array' })
  trend: Array<{
    period: string;
    rate: number;
    count: number;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Abandonment recovery response
 */
export class AbandonmentRecoveryResponseDto {
  @ApiProperty({ description: 'Overall recovery rate', example: 0.18 })
  overallRecoveryRate: number;

  @ApiProperty({ description: 'Total recovered carts', example: 333 })
  totalRecovered: number;

  @ApiProperty({ description: 'Total recovered revenue (SYP)', example: 399600000 })
  recoveredRevenue: number;

  @ApiProperty({ description: 'Average time to recovery', example: '18.5 hours' })
  averageRecoveryTime: string;

  @ApiProperty({
    description: 'Recovery metrics by campaign type',
    example: {
      email_reminder: { recoveryRate: 0.10, revenue: 120000000 },
      email_discount: { recoveryRate: 0.17, revenue: 204000000 },
      sms_reminder: { recoveryRate: 0.15, revenue: 75600000 },
    },
  })
  byCampaign: Record<string, {
    recoveryRate: number;
    recovered: number;
    revenue: number;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Abandonment reasons response
 */
export class AbandonmentReasonsResponseDto {
  @ApiProperty({
    description: 'Top abandonment reasons',
    type: 'array',
  })
  reasons: Array<{
    reason: string;
    count: number;
    percentage: number;
    averageCartValue: number;
  }>;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Trigger recovery campaign request
 */
export class TriggerRecoveryRequestDto {
  @ApiProperty({
    description: 'Recovery campaign type',
    enum: ['email_reminder', 'email_discount', 'sms_reminder', 'retargeting'],
    example: 'email_discount',
  })
  @IsEnum(['email_reminder', 'email_discount', 'sms_reminder', 'retargeting'])
  campaignType: 'email_reminder' | 'email_discount' | 'sms_reminder' | 'retargeting';

  @ApiPropertyOptional({
    description: 'Target segment',
    enum: ['all', 'high_value', 'recent', 'repeat_customers'],
    example: 'high_value',
  })
  @IsOptional()
  @IsEnum(['all', 'high_value', 'recent', 'repeat_customers'])
  targetSegment?: string;

  @ApiPropertyOptional({
    description: 'Minimum cart value filter (SYP)',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  minCartValue?: number;

  @ApiPropertyOptional({
    description: 'Abandoned within hours',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  abandonedWithinHours?: number;

  @ApiPropertyOptional({
    description: 'Discount percentage (for email_discount campaign)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Delay before sending (hours)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(72)
  delayHours?: number;
}

/**
 * Trigger recovery campaign response
 */
export class TriggerRecoveryResponseDto {
  @ApiProperty({ description: 'Campaign ID', example: 'camp_1737540600000' })
  campaignId: string;

  @ApiProperty({ description: 'Campaign status', example: 'queued' })
  status: string;

  @ApiProperty({ description: 'Number of abandoned carts targeted', example: 342 })
  targetedCarts: number;

  @ApiProperty({ description: 'Estimated delivery time' })
  estimatedDelivery: Date;

  @ApiProperty({ description: 'Estimated recovery rate', example: 0.15 })
  estimatedRecoveryRate: number;

  @ApiProperty({ description: 'Estimated recovered revenue (SYP)', example: 61500000 })
  estimatedRevenue: number;
}

// ===========================================================================
// COHORT ANALYSIS DTOs
// ===========================================================================

/**
 * Cohort retention response
 */
export class CohortRetentionResponseDto {
  @ApiProperty({
    description: 'Cohort retention data',
    type: 'array',
  })
  cohorts: Array<{
    cohort: {
      cohortId: string;
      cohortName: string;
      startDate: Date;
      endDate: Date;
      customerCount: number;
      type: string;
    };
    retentionData: Array<{
      periodIndex: number;
      periodLabel: string;
      activeCustomers: number;
      retentionRate: number;
      cumulativeRetention: number;
      churnRate: number;
      revenue: number;
      averageRevenuePerCustomer: number;
    }>;
    summary: {
      overallRetentionRate: number;
      averageRetention: number;
      totalRevenue: number;
      lifetimeValue: number;
    };
  }>;

  @ApiProperty({ description: 'Period type', example: 'monthly' })
  periodType: string;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Cohort revenue response
 */
export class CohortRevenueResponseDto {
  @ApiProperty({
    description: 'Cohort revenue data',
    type: 'array',
  })
  cohorts: Array<{
    cohort: {
      cohortId: string;
      cohortName: string;
      startDate: Date;
      endDate: Date;
      customerCount: number;
    };
    revenueData: Array<{
      periodIndex: number;
      periodLabel: string;
      revenue: number;
      cumulativeRevenue: number;
      averageRevenuePerCustomer: number;
      activeCustomers: number;
    }>;
    summary: {
      totalRevenue: number;
      averageRevenuePerCustomer: number;
      lifetimeValue: number;
      growthRate: number;
    };
  }>;

  @ApiProperty({ description: 'Period type', example: 'monthly' })
  periodType: string;

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Cohort detail response
 */
export class CohortDetailResponseDto {
  @ApiProperty({ description: 'Cohort information' })
  cohort: {
    cohortId: string;
    cohortName: string;
    startDate: Date;
    endDate: Date;
    customerCount: number;
    type: string;
  };

  @ApiProperty({ description: 'Retention data by period', type: 'array' })
  retentionData: Array<{
    periodIndex: number;
    periodLabel: string;
    activeCustomers: number;
    retentionRate: number;
    cumulativeRetention: number;
    churnRate: number;
    revenue: number;
    averageRevenuePerCustomer: number;
  }>;

  @ApiProperty({ description: 'Cohort summary metrics' })
  summary: {
    overallRetentionRate: number;
    averageRetention: number;
    totalRevenue: number;
    lifetimeValue: number;
  };

  @ApiProperty({ description: 'Generation timestamp' })
  generatedAt: Date;
}

/**
 * Create cohort request
 */
export class CreateCohortRequestDto {
  @ApiProperty({
    description: 'Cohort name',
    example: 'Ramadan 2026 Mobile Shoppers',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Cohort type',
    enum: ['custom', 'registration', 'first_purchase'],
    example: 'custom',
  })
  @IsEnum(['custom', 'registration', 'first_purchase'])
  type: 'custom' | 'registration' | 'first_purchase';

  @ApiProperty({
    description: 'Cohort creation criteria',
    example: {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      deviceType: 'mobile',
      minPurchases: 2,
    },
  })
  @ValidateNested()
  @Type(() => Object)
  criteria: {
    startDate: string;
    endDate?: string;
    deviceType?: string;
    minPurchases?: number;
    minRevenue?: number;
    segment?: string;
    channel?: string;
  };
}

/**
 * Create cohort response
 */
export class CreateCohortResponseDto {
  @ApiProperty({ description: 'Created cohort ID', example: 'custom_1737540600000' })
  cohortId: string;

  @ApiProperty({ description: 'Cohort name', example: 'Ramadan 2026 Mobile Shoppers' })
  cohortName: string;

  @ApiProperty({ description: 'Customer count (initial)', example: 0 })
  customerCount: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Status message' })
  message: string;
}

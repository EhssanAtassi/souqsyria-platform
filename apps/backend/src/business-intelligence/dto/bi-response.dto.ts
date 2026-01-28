/**
 * @file bi-response.dto.ts
 * @description Business Intelligence response DTOs for API endpoints
 * @module BusinessIntelligence/DTO
 * 
 * This file contains response DTOs for Business Intelligence endpoints,
 * including metrics, analytics results, and insights.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

// =============================================================================
// BASE RESPONSE DTOs
// =============================================================================

/**
 * Base BI metric with change comparison
 */
export class BIMetricDto {
  @ApiProperty({
    description: 'Current metric value',
    example: 125000,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Previous period value for comparison',
    example: 110000,
  })
  previousValue: number;

  @ApiProperty({
    description: 'Absolute change from previous period',
    example: 15000,
  })
  absoluteChange: number;

  @ApiProperty({
    description: 'Percentage change from previous period',
    example: 13.64,
  })
  percentageChange: number;

  @ApiProperty({
    description: 'Trend direction',
    enum: ['up', 'down', 'stable'],
    example: 'up',
  })
  trend: 'up' | 'down' | 'stable';

  @ApiProperty({
    description: 'Whether the change is statistically significant',
    example: true,
  })
  isSignificant: boolean;
}

/**
 * Time series data point
 */
export class BITimeSeriesPointDto {
  @ApiProperty({
    description: 'Data point timestamp',
    example: '2024-01-15T00:00:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Metric value at this timestamp',
    example: 85000,
  })
  value: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for this data point',
    example: { sessions: 150, users: 120 },
  })
  metadata?: Record<string, any>;
}

/**
 * Time series data structure
 */
export class BITimeSeriesDto {
  @ApiProperty({
    description: 'Time series name/metric name',
    example: 'Daily Revenue',
  })
  name: string;

  @ApiProperty({
    description: 'Data points array',
    type: [BITimeSeriesPointDto],
  })
  @Type(() => BITimeSeriesPointDto)
  data: BITimeSeriesPointDto[];

  @ApiProperty({
    description: 'Time period granularity',
    enum: ['hour', 'daily', 'weekly', 'monthly'],
    example: 'daily',
  })
  period: 'hour' | 'daily' | 'weekly' | 'monthly';
}

/**
 * Geographic data point
 */
export class BIGeographicDataDto {
  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'SY',
  })
  countryCode: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Syria',
  })
  countryName: string;

  @ApiProperty({
    description: 'Metric value for this geography',
    example: 45000,
  })
  value: number;

  @ApiProperty({
    description: 'Percentage of total',
    example: 32.5,
  })
  percentage: number;

  @ApiPropertyOptional({
    description: 'Additional geographic metrics',
    example: { users: 250, sessions: 380 },
  })
  additionalMetrics?: Record<string, number>;
}

// =============================================================================
// CLV RESPONSE DTOs
// =============================================================================

/**
 * Customer CLV metrics DTO
 */
export class CustomerCLVDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: 12345,
  })
  customerId: number;

  @ApiProperty({
    description: 'Customer CLV value in SYP',
    example: 2500000,
  })
  clvValue: number;

  @ApiProperty({
    description: 'Average order value in SYP',
    example: 125000,
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Purchase frequency (orders per year)',
    example: 8.5,
  })
  purchaseFrequency: number;

  @ApiProperty({
    description: 'Customer lifespan in days',
    example: 425,
  })
  customerLifespan: number;

  @ApiProperty({
    description: 'Total revenue from customer in SYP',
    example: 1200000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Total orders placed by customer',
    example: 12,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Customer segment classification',
    example: 'champions',
  })
  segment: string;

  @ApiProperty({
    description: 'Churn probability (0-1)',
    example: 0.15,
  })
  churnProbability: number;

  @ApiProperty({
    description: 'CLV confidence score (0-100)',
    example: 85,
  })
  confidenceScore: number;

  @ApiPropertyOptional({
    description: 'CLV prediction (if requested)',
  })
  prediction?: {
    predictedCLV: number;
    confidenceInterval: {
      lower: number;
      upper: number;
      level: number;
    };
    predictionHorizon: number;
  };
}

/**
 * CLV segment performance DTO
 */
export class CLVSegmentPerformanceDto {
  @ApiProperty({
    description: 'Customer segment name',
    example: 'champions',
  })
  segment: string;

  @ApiProperty({
    description: 'Number of customers in segment',
    example: 245,
  })
  customerCount: number;

  @ApiProperty({
    description: 'Percentage of total customers',
    example: 12.3,
  })
  customerPercentage: number;

  @ApiProperty({
    description: 'Average CLV in segment (SYP)',
    example: 3500000,
  })
  averageCLV: number;

  @ApiProperty({
    description: 'Total CLV contribution (SYP)',
    example: 857500000,
  })
  totalCLV: number;

  @ApiProperty({
    description: 'CLV contribution percentage',
    example: 45.2,
  })
  clvContributionPercentage: number;

  @ApiProperty({
    description: 'Average order frequency',
    example: 6.8,
  })
  averageOrderFrequency: number;

  @ApiProperty({
    description: 'Churn rate in segment (%)',
    example: 8.5,
  })
  churnRate: number;
}

/**
 * CLV insights and analytics response DTO
 */
export class CLVAnalyticsResponseDto {
  @ApiProperty({
    description: 'Analysis metadata',
  })
  metadata: {
    generatedAt: Date;
    dataPeriod: {
      startDate: string;
      endDate: string;
    };
    customerCount: number;
    dataQuality: number;
  };

  @ApiProperty({
    description: 'Key CLV metrics with period comparison',
  })
  kpis: {
    averageCLV: BIMetricDto;
    totalCLV: BIMetricDto;
    highValueCustomerCount: BIMetricDto;
    churnRate: BIMetricDto;
  };

  @ApiProperty({
    description: 'CLV distribution statistics',
  })
  distribution: {
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };

  @ApiProperty({
    description: 'Segment performance breakdown',
    type: [CLVSegmentPerformanceDto],
  })
  @Type(() => CLVSegmentPerformanceDto)
  segmentPerformance: CLVSegmentPerformanceDto[];

  @ApiProperty({
    description: 'CLV trends over time',
    type: BITimeSeriesDto,
  })
  @Type(() => BITimeSeriesDto)
  trends: BITimeSeriesDto;

  @ApiProperty({
    description: 'Top insights and recommendations',
  })
  insights: {
    keyInsights: Array<{
      insight: string;
      impact: 'positive' | 'negative' | 'neutral';
      confidence: number;
      metric: string;
      changeValue: number;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimatedImpact: number;
      effort: 'low' | 'medium' | 'high';
      timeframe: string;
      targetSegments: string[];
    }>;
  };
}

// =============================================================================
// FUNNEL RESPONSE DTOs
// =============================================================================

/**
 * Funnel step metrics DTO
 */
export class FunnelStepMetricsDto {
  @ApiProperty({
    description: 'Step identifier',
    example: 'step_checkout_start',
  })
  stepId: string;

  @ApiProperty({
    description: 'Step name',
    example: 'Checkout Initiated',
  })
  stepName: string;

  @ApiProperty({
    description: 'Step order in funnel',
    example: 3,
  })
  stepOrder: number;

  @ApiProperty({
    description: 'Users who entered this step',
    example: 1250,
  })
  enteredCount: number;

  @ApiProperty({
    description: 'Users who completed this step',
    example: 980,
  })
  completedCount: number;

  @ApiProperty({
    description: 'Users who dropped off at this step',
    example: 270,
  })
  droppedOffCount: number;

  @ApiProperty({
    description: 'Conversion rate from previous step (%)',
    example: 78.4,
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Drop-off rate at this step (%)',
    example: 21.6,
  })
  dropOffRate: number;

  @ApiProperty({
    description: 'Average time spent on step (seconds)',
    example: 145,
  })
  averageTimeOnStep: number;

  @ApiProperty({
    description: 'Revenue generated at this step (SYP)',
    example: 125000000,
  })
  revenueGenerated: number;
}

/**
 * Funnel analytics response DTO
 */
export class FunnelAnalyticsResponseDto {
  @ApiProperty({
    description: 'Funnel information',
  })
  funnel: {
    funnelId: string;
    name: string;
    description: string;
  };

  @ApiProperty({
    description: 'Analysis period',
  })
  analysisPeriod: {
    startDate: string;
    endDate: string;
  };

  @ApiProperty({
    description: 'Overall funnel metrics',
  })
  overallMetrics: {
    totalSessions: number;
    uniqueUsers: number;
    conversions: number;
    conversionRate: number;
    totalRevenue: number;
    averageOrderValue: number;
    averageTimeToConvert: number;
  };

  @ApiProperty({
    description: 'Step-by-step performance metrics',
    type: [FunnelStepMetricsDto],
  })
  @Type(() => FunnelStepMetricsDto)
  stepMetrics: FunnelStepMetricsDto[];

  @ApiProperty({
    description: 'Conversion trends over time',
    type: BITimeSeriesDto,
  })
  @Type(() => BITimeSeriesDto)
  conversionTrends: BITimeSeriesDto;

  @ApiPropertyOptional({
    description: 'Drop-off analysis with recommendations',
  })
  dropOffAnalysis?: {
    highestDropOffSteps: Array<{
      stepId: string;
      stepName: string;
      dropOffRate: number;
      affectedUsers: number;
      potentialRevenueLoss: number;
    }>;
    recommendations: Array<{
      stepId: string;
      issue: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
      estimatedImpact: number;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Channel performance breakdown',
  })
  channelAnalysis?: Array<{
    channelId: string;
    channelName: string;
    channelType: string;
    sessionCount: number;
    conversionRate: number;
    deviceBreakdown: Array<{
      deviceType: 'desktop' | 'tablet' | 'mobile';
      sessionCount: number;
      conversionRate: number;
    }>;
  }>;
}

// =============================================================================
// CART ABANDONMENT RESPONSE DTOs
// =============================================================================

/**
 * Cart abandonment metrics DTO
 */
export class CartAbandonmentMetricsDto {
  @ApiProperty({
    description: 'Analysis period',
  })
  analysisPeriod: {
    startDate: string;
    endDate: string;
  };

  @ApiProperty({
    description: 'Overall abandonment metrics',
  })
  overallMetrics: {
    totalCartsCreated: number;
    totalCartsAbandoned: number;
    totalCartsCompleted: number;
    abandonmentRate: number;
    completionRate: number;
    averageAbandonmentValue: number;
    totalAbandonmentValue: number;
  };

  @ApiProperty({
    description: 'Abandonment breakdown by stage',
  })
  byStage: Array<{
    stage: string;
    abandonmentCount: number;
    abandonmentRate: number;
    averageCartValue: number;
  }>;

  @ApiProperty({
    description: 'Abandonment trends over time',
    type: BITimeSeriesDto,
  })
  @Type(() => BITimeSeriesDto)
  trends: BITimeSeriesDto;

  @ApiProperty({
    description: 'Period-over-period comparison',
  })
  periodComparison: {
    abandonmentRate: BIMetricDto;
    averageValue: BIMetricDto;
    recoveryRate: BIMetricDto;
  };
}

/**
 * Cart abandonment insights DTO
 */
export class CartAbandonmentInsightsDto {
  @ApiProperty({
    description: 'Top abandonment reasons with impact',
  })
  topReasons: Array<{
    reason: string;
    frequency: number;
    percentage: number;
    averageCartValue: number;
    potentialRevenueLoss: number;
  }>;

  @ApiProperty({
    description: 'High-value abandonment analysis',
  })
  highValueAbandonments: Array<{
    cartValueRange: string;
    abandonmentCount: number;
    percentageOfTotal: number;
    recoveryOpportunity: number;
  }>;

  @ApiProperty({
    description: 'Device and channel performance',
  })
  deviceChannelAnalysis: Array<{
    dimension: 'device_type' | 'browser' | 'traffic_source';
    value: string;
    abandonmentRate: number;
    cartCount: number;
    averageValue: number;
  }>;

  @ApiProperty({
    description: 'Time-based abandonment patterns',
  })
  timePatterns: {
    hourlyPattern: Array<{
      hour: number;
      abandonmentRate: number;
    }>;
    dailyPattern: Array<{
      dayOfWeek: string;
      abandonmentRate: number;
    }>;
  };

  @ApiProperty({
    description: 'Recovery campaign effectiveness',
  })
  recoveryEffectiveness: Array<{
    campaignId: string;
    campaignName: string;
    recoveryRate: number;
    roi: number;
    revenueRecovered: number;
  }>;

  @ApiProperty({
    description: 'Optimization recommendations',
  })
  recommendations: Array<{
    category: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
  }>;
}

// =============================================================================
// COHORT RESPONSE DTOs
// =============================================================================

/**
 * Cohort retention data DTO
 */
export class CohortRetentionDto {
  @ApiProperty({
    description: 'Cohort identifier',
    example: 'cohort_2024_q1',
  })
  cohortId: string;

  @ApiProperty({
    description: 'Cohort name',
    example: '2024 Q1 Customers',
  })
  cohortName: string;

  @ApiProperty({
    description: 'Cohort period',
    example: '2024-Q1',
  })
  cohortPeriod: string;

  @ApiProperty({
    description: 'Initial cohort size',
    example: 1250,
  })
  initialSize: number;

  @ApiProperty({
    description: 'Retention data by time period',
  })
  retentionData: Array<{
    periodOffset: number;
    periodLabel: string;
    activeCustomers: number;
    retentionRate: number;
    revenue: number;
    revenuePerCustomer: number;
    cumulativeRevenue: number;
    cumulativeRevenuePerCustomer: number;
  }>;
}

/**
 * Cohort analysis response DTO
 */
export class CohortAnalysisResponseDto {
  @ApiProperty({
    description: 'Analysis metadata',
  })
  analysisMetadata: {
    analysisId: string;
    generatedAt: Date;
    analysisPeriod: {
      startDate: string;
      endDate: string;
    };
    totalCohorts: number;
    totalCustomers: number;
  };

  @ApiProperty({
    description: 'Cohort retention matrix',
    type: [CohortRetentionDto],
  })
  @Type(() => CohortRetentionDto)
  retentionMatrix: CohortRetentionDto[];

  @ApiProperty({
    description: 'Average retention rates across cohorts',
  })
  averageRetention: Array<{
    periodOffset: number;
    periodLabel: string;
    averageRetentionRate: number;
    medianRetentionRate: number;
    minRetentionRate: number;
    maxRetentionRate: number;
  }>;

  @ApiProperty({
    description: 'Revenue analysis by cohort',
  })
  revenueAnalysis: {
    clvByCohort: Array<{
      cohortId: string;
      cohortPeriod: string;
      averageClv: number;
      medianClv: number;
      projectedClv: number;
    }>;
  };

  @ApiProperty({
    description: 'Cohort performance comparison',
  })
  cohortComparison: Array<{
    metric: string;
    bestPerformingCohort: {
      cohortId: string;
      cohortName: string;
      value: number;
    };
    worstPerformingCohort: {
      cohortId: string;
      cohortName: string;
      value: number;
    };
    average: number;
    median: number;
  }>;

  @ApiProperty({
    description: 'Key insights and recommendations',
  })
  insights: {
    cohortHealth: {
      averageRetentionRate: number;
      retentionTrend: 'improving' | 'stable' | 'declining';
      cohortMaturity: 'early' | 'growing' | 'mature' | 'declining';
    };
    recommendations: Array<{
      category: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
      targetCohorts: string[];
      estimatedImpact: {
        retentionImprovement: number;
        revenueImpact: number;
      };
    }>;
  };
}

// =============================================================================
// EVENT ANALYTICS RESPONSE DTOs
// =============================================================================

/**
 * Event analytics response DTO
 */
export class EventAnalyticsResponseDto {
  @ApiProperty({
    description: 'Analysis period and metadata',
  })
  metadata: {
    analysisPeriod: {
      startDate: string;
      endDate: string;
    };
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
  };

  @ApiProperty({
    description: 'Top events by volume',
  })
  topEvents: Array<{
    eventName: string;
    category: string;
    count: number;
    uniqueUsers: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;

  @ApiProperty({
    description: 'Event trends over time',
    type: BITimeSeriesDto,
  })
  @Type(() => BITimeSeriesDto)
  eventTrends: BITimeSeriesDto;

  @ApiProperty({
    description: 'User engagement metrics',
  })
  engagementMetrics: {
    averageSessionDuration: number;
    averageEventsPerSession: number;
    bounceRate: number;
    averagePageViews: number;
  };

  @ApiPropertyOptional({
    description: 'Geographic breakdown of events',
    type: [BIGeographicDataDto],
  })
  @Type(() => BIGeographicDataDto)
  geoBreakdown?: BIGeographicDataDto[];

  @ApiPropertyOptional({
    description: 'Device and platform breakdown',
  })
  deviceBreakdown?: Array<{
    deviceType: string;
    eventCount: number;
    percentage: number;
    averageEngagement: number;
  }>;

  @ApiPropertyOptional({
    description: 'Event correlation analysis',
  })
  correlationAnalysis?: Array<{
    eventA: string;
    eventB: string;
    correlationScore: number;
    significance: number;
    correlationType: 'positive' | 'negative' | 'neutral';
  }>;
}

// =============================================================================
// PAGINATED RESPONSE WRAPPERS
// =============================================================================

/**
 * Paginated CLV customers response
 */
export class PaginatedCLVCustomersDto extends PaginatedResponse<CustomerCLVDto> {
  @ApiProperty({
    description: 'Customer CLV data',
    type: [CustomerCLVDto],
  })
  @Type(() => CustomerCLVDto)
  data: CustomerCLVDto[];
}

/**
 * Paginated cohort retention response
 */
export class PaginatedCohortRetentionDto extends PaginatedResponse<CohortRetentionDto> {
  @ApiProperty({
    description: 'Cohort retention data',
    type: [CohortRetentionDto],
  })
  @Type(() => CohortRetentionDto)
  data: CohortRetentionDto[];
}

// =============================================================================
// EXPORT RESPONSE DTOs
// =============================================================================

/**
 * BI export response DTO
 */
export class BIExportResponseDto {
  @ApiProperty({
    description: 'Export job identifier',
    example: 'export_clv_20240122_001',
  })
  exportId: string;

  @ApiProperty({
    description: 'Export status',
    enum: ['pending', 'processing', 'completed', 'failed'],
    example: 'completed',
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiPropertyOptional({
    description: 'Download URL (when export is completed)',
    example: 'https://storage.souqsyria.com/exports/clv_report_20240122.xlsx',
  })
  downloadUrl?: string;

  @ApiProperty({
    description: 'Export file name',
    example: 'clv_report_20240122.xlsx',
  })
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  fileSize: number;

  @ApiProperty({
    description: 'Number of records exported',
    example: 5432,
  })
  recordCount: number;

  @ApiProperty({
    description: 'Export creation timestamp',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Download URL expiration timestamp',
  })
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Error message (if export failed)',
  })
  error?: string;
}
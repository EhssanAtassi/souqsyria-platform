/**
 * @file performance-insights.dto.ts
 * @description DTOs for vendor performance insights and recommendations
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PerformanceGrade } from './vendor-dashboard-overview.dto';

/**
 * Performance metric category enum
 */
export enum PerformanceMetricCategory {
  SALES = 'sales',
  CUSTOMER_SERVICE = 'customer_service',
  QUALITY = 'quality',
  DELIVERY = 'delivery',
  OPERATIONS = 'operations',
}

/**
 * Recommendation priority level
 */
export enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Benchmark comparison level
 */
export enum BenchmarkLevel {
  EXCELLENT = 'excellent',
  ABOVE_AVERAGE = 'above_average',
  AVERAGE = 'average',
  BELOW_AVERAGE = 'below_average',
  POOR = 'poor',
}

/**
 * Individual performance metric DTO
 */
export class PerformanceMetricDto {
  @ApiProperty({
    description: 'Metric identifier',
    example: 'fulfillment_rate',
  })
  @IsString()
  metricId: string;

  @ApiProperty({
    description: 'Metric name in English',
    example: 'Order Fulfillment Rate',
  })
  @IsString()
  nameEn: string;

  @ApiProperty({
    description: 'Metric name in Arabic',
    example: 'معدل تنفيذ الطلبات',
  })
  @IsString()
  nameAr: string;

  @ApiProperty({
    description: 'Current metric value',
    example: 94.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  currentValue: number;

  @ApiProperty({
    description: 'Previous period value for comparison',
    example: 92.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  previousValue: number;

  @ApiProperty({
    description: 'Change percentage from previous period',
    example: 2.7,
  })
  @IsNumber()
  changePercentage: number;

  @ApiProperty({
    description: 'Industry average benchmark',
    example: 90.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  benchmarkValue: number;

  @ApiProperty({
    description: 'Performance category',
    enum: PerformanceMetricCategory,
    example: PerformanceMetricCategory.DELIVERY,
  })
  @IsEnum(PerformanceMetricCategory)
  category: PerformanceMetricCategory;

  @ApiProperty({
    description: 'Benchmark comparison level',
    enum: BenchmarkLevel,
    example: BenchmarkLevel.ABOVE_AVERAGE,
  })
  @IsEnum(BenchmarkLevel)
  benchmarkLevel: BenchmarkLevel;
}

/**
 * Actionable recommendation DTO
 */
export class PerformanceRecommendationDto {
  @ApiProperty({
    description: 'Recommendation unique identifier',
    example: 'rec_001',
  })
  @IsString()
  recommendationId: string;

  @ApiProperty({
    description: 'Recommendation title in English',
    example: 'Improve Response Time',
  })
  @IsString()
  titleEn: string;

  @ApiProperty({
    description: 'Recommendation title in Arabic',
    example: 'تحسين وقت الاستجابة',
  })
  @IsString()
  titleAr: string;

  @ApiProperty({
    description: 'Detailed description in English',
    example: 'Your average response time is 4.2 hours. Responding within 2 hours can increase conversion by 15%.',
  })
  @IsString()
  descriptionEn: string;

  @ApiProperty({
    description: 'Detailed description in Arabic',
    example: 'متوسط وقت الاستجابة لديك هو 4.2 ساعة. الرد خلال ساعتين يمكن أن يزيد التحويل بنسبة 15٪.',
  })
  @IsString()
  descriptionAr: string;

  @ApiProperty({
    description: 'Recommendation priority',
    enum: RecommendationPriority,
    example: RecommendationPriority.HIGH,
  })
  @IsEnum(RecommendationPriority)
  priority: RecommendationPriority;

  @ApiProperty({
    description: 'Expected impact description in English',
    example: '+15% conversion rate',
  })
  @IsString()
  expectedImpactEn: string;

  @ApiProperty({
    description: 'Expected impact description in Arabic',
    example: '+15٪ في معدل التحويل',
  })
  @IsString()
  expectedImpactAr: string;

  @ApiProperty({
    description: 'Related metric category',
    enum: PerformanceMetricCategory,
    example: PerformanceMetricCategory.CUSTOMER_SERVICE,
  })
  @IsEnum(PerformanceMetricCategory)
  category: PerformanceMetricCategory;

  @ApiProperty({
    description: 'Estimated implementation effort (1-5, where 5 is most difficult)',
    example: 2,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  effortLevel: number;
}

/**
 * Competitor comparison insight DTO
 */
export class CompetitorInsightDto {
  @ApiProperty({
    description: 'Metric being compared',
    example: 'Average Product Price',
  })
  @IsString()
  metricName: string;

  @ApiProperty({
    description: 'Your value',
    example: 125000,
  })
  @IsNumber()
  yourValue: number;

  @ApiProperty({
    description: 'Competitor average value',
    example: 135000,
  })
  @IsNumber()
  competitorAverage: number;

  @ApiProperty({
    description: 'Difference percentage',
    example: -7.4,
  })
  @IsNumber()
  differencePercentage: number;

  @ApiProperty({
    description: 'Insight in English',
    example: 'Your prices are 7.4% lower than average - good for competitive positioning',
  })
  @IsString()
  insightEn: string;

  @ApiProperty({
    description: 'Insight in Arabic',
    example: 'أسعارك أقل بنسبة 7.4٪ من المتوسط - جيد للمنافسة',
  })
  @IsString()
  insightAr: string;
}

/**
 * Quality score breakdown DTO
 */
export class QualityScoreBreakdownDto {
  @ApiProperty({
    description: 'Product quality score (0-100)',
    example: 92.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  productQuality: number;

  @ApiProperty({
    description: 'Customer service score (0-100)',
    example: 88.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  customerService: number;

  @ApiProperty({
    description: 'Delivery performance score (0-100)',
    example: 94.5,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  deliveryPerformance: number;

  @ApiProperty({
    description: 'Communication score (0-100)',
    example: 86.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  communication: number;

  @ApiProperty({
    description: 'Packaging quality score (0-100)',
    example: 91.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  packagingQuality: number;

  @ApiProperty({
    description: 'Overall weighted quality score (0-100)',
    example: 90.4,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;
}

/**
 * Strength and weakness analysis DTO
 */
export class StrengthWeaknessDto {
  @ApiProperty({
    description: 'Area of strength or weakness',
    example: 'Product Quality',
  })
  @IsString()
  area: string;

  @ApiProperty({
    description: 'Score for this area (0-100)',
    example: 92.0,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @ApiProperty({
    description: 'Description in English',
    example: 'Customers consistently praise your product quality with 4.8/5 average rating',
  })
  @IsString()
  descriptionEn: string;

  @ApiProperty({
    description: 'Description in Arabic',
    example: 'يشيد العملاء باستمرار بجودة منتجاتك بمتوسط تقييم 4.8/5',
  })
  @IsString()
  descriptionAr: string;

  @ApiProperty({
    description: 'Whether this is a strength (true) or weakness (false)',
    example: true,
  })
  isStrength: boolean;
}

/**
 * Main performance insights response DTO
 * Comprehensive performance analysis and actionable recommendations
 */
export class PerformanceInsightsDto {
  @ApiProperty({
    description: 'Overall performance grade',
    enum: PerformanceGrade,
    example: PerformanceGrade.A,
  })
  @IsEnum(PerformanceGrade)
  overallGrade: PerformanceGrade;

  @ApiProperty({
    description: 'Overall performance score (0-100)',
    example: 90.4,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiProperty({
    description: 'Individual performance metrics',
    type: [PerformanceMetricDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceMetricDto)
  metrics: PerformanceMetricDto[];

  @ApiProperty({
    description: 'Actionable recommendations for improvement',
    type: [PerformanceRecommendationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformanceRecommendationDto)
  recommendations: PerformanceRecommendationDto[];

  @ApiProperty({
    description: 'Quality score breakdown by category',
    type: QualityScoreBreakdownDto,
  })
  @ValidateNested()
  @Type(() => QualityScoreBreakdownDto)
  qualityBreakdown: QualityScoreBreakdownDto;

  @ApiProperty({
    description: 'Top strengths',
    type: [StrengthWeaknessDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrengthWeaknessDto)
  strengths: StrengthWeaknessDto[];

  @ApiProperty({
    description: 'Areas for improvement (weaknesses)',
    type: [StrengthWeaknessDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrengthWeaknessDto)
  weaknesses: StrengthWeaknessDto[];

  @ApiProperty({
    description: 'Competitor comparison insights',
    type: [CompetitorInsightDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompetitorInsightDto)
  competitorInsights: CompetitorInsightDto[];

  @ApiProperty({
    description: 'Rank among similar vendors (1 = best)',
    example: 12,
  })
  @IsNumber()
  @Min(1)
  rankPosition: number;

  @ApiProperty({
    description: 'Total number of vendors in comparison group',
    example: 85,
  })
  @IsNumber()
  @Min(1)
  totalVendors: number;

  @ApiProperty({
    description: 'Percentile rank (100 = best)',
    example: 85.9,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentileRank: number;
}

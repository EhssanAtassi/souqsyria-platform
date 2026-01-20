/**
 * @file vendor-performance-insight.entity.ts
 * @description Entity for storing AI-generated vendor performance insights and recommendations
 *
 * Purpose: Store AI-generated performance analysis and actionable recommendations
 * Used for: Performance grading, improvement suggestions, competitive insights
 *
 * @swagger VendorPerformanceInsight
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VendorEntity } from '../../vendors/entities/vendor.entity';

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
 * VendorPerformanceInsight Entity
 *
 * Stores AI-generated performance insights and recommendations
 * Refreshed periodically (weekly) to provide up-to-date guidance
 *
 * Key Features:
 * - AI-powered performance grading
 * - Actionable recommendations for improvement
 * - SWOT analysis (strengths, weaknesses, opportunities, threats)
 * - Competitive benchmarking insights
 * - TTL-based refresh (regenerated weekly)
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_performance_insights')
@Index(['vendorId', 'generatedAt']) // Fast lookup by vendor and date
export class VendorPerformanceInsight {
  /**
   * Primary key - auto-generated UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key relationship to Vendor entity
   * ON DELETE CASCADE ensures cleanup when vendor is deleted
   */
  @ManyToOne(() => VendorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  /**
   * Vendor ID for indexed queries
   */
  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  /**
   * Overall performance grade (A+ to F)
   * Calculated based on multiple KPIs
   */
  @Column({
    name: 'overall_grade',
    type: 'enum',
    enum: PerformanceGrade,
  })
  overallGrade: PerformanceGrade;

  /**
   * Quality score (0-100)
   * Based on product quality, customer reviews, return rates
   */
  @Column({
    name: 'quality_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  qualityScore: number;

  /**
   * Performance metrics breakdown
   *
   * JSON Structure:
   * {
   *   fulfillment: { score: number, grade: string, trend: string },
   *   responseTime: { score: number, grade: string, trend: string },
   *   customerSatisfaction: { score: number, grade: string, trend: string },
   *   productQuality: { score: number, grade: string, trend: string },
   *   deliverySpeed: { score: number, grade: string, trend: string }
   * }
   */
  @Column({ name: 'performance_metrics', type: 'json' })
  performanceMetrics: any;

  /**
   * AI-generated recommendations for improvement
   *
   * JSON Structure:
   * [
   *   {
   *     category: string,
   *     priority: "high" | "medium" | "low",
   *     titleEn: string,
   *     titleAr: string,
   *     descriptionEn: string,
   *     descriptionAr: string,
   *     expectedImpact: string,
   *     actionItems: string[]
   *   }
   * ]
   */
  @Column({ name: 'recommendations', type: 'json' })
  recommendations: any;

  /**
   * Vendor strengths (SWOT analysis)
   *
   * JSON Structure:
   * [
   *   {
   *     titleEn: string,
   *     titleAr: string,
   *     descriptionEn: string,
   *     descriptionAr: string,
   *     metric: string,
   *     value: number
   *   }
   * ]
   */
  @Column({ name: 'strengths', type: 'json' })
  strengths: any;

  /**
   * Vendor weaknesses (SWOT analysis)
   *
   * JSON Structure:
   * [
   *   {
   *     titleEn: string,
   *     titleAr: string,
   *     descriptionEn: string,
   *     descriptionAr: string,
   *     metric: string,
   *     value: number,
   *     improvementSuggestion: string
   *   }
   * ]
   */
  @Column({ name: 'weaknesses', type: 'json' })
  weaknesses: any;

  /**
   * Growth opportunities identified
   *
   * JSON Structure:
   * [
   *   {
   *     titleEn: string,
   *     titleAr: string,
   *     descriptionEn: string,
   *     descriptionAr: string,
   *     potentialImpact: string,
   *     effort: "low" | "medium" | "high"
   *   }
   * ]
   */
  @Column({ name: 'opportunities', type: 'json', nullable: true })
  opportunities: any;

  /**
   * Competitive insights and benchmarking
   *
   * JSON Structure:
   * {
   *   categoryAverage: {
   *     fulfillmentRate: number,
   *     responseTime: number,
   *     customerSatisfaction: number
   *   },
   *   vendorRanking: {
   *     overall: number,
   *     totalVendors: number,
   *     percentile: number
   *   },
   *   topPerformers: [
   *     {
   *       metric: string,
   *       vendorValue: number,
   *       topValue: number,
   *       gap: number
   *     }
   *   ]
   * }
   */
  @Column({ name: 'competitor_insights', type: 'json', nullable: true })
  competitorInsights: any;

  /**
   * Trend analysis (performance over time)
   *
   * JSON Structure:
   * {
   *   last30Days: { trend: "improving" | "declining" | "stable", change: number },
   *   last90Days: { trend: "improving" | "declining" | "stable", change: number },
   *   seasonalPatterns: string[]
   * }
   */
  @Column({ name: 'trend_analysis', type: 'json', nullable: true })
  trendAnalysis: any;

  /**
   * Next review date
   * Insights expire after 7 days and need regeneration
   */
  @Column({ name: 'next_review_date', type: 'date' })
  nextReviewDate: Date;

  /**
   * Whether insights are still valid (not expired)
   */
  @Column({ name: 'is_valid', type: 'boolean', default: true })
  isValid: boolean;

  /**
   * Timestamp when these insights were generated
   */
  @Column({ name: 'generated_at', type: 'timestamp' })
  generatedAt: Date;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Business method: Check if insights are expired
   */
  isExpired(): boolean {
    return new Date() > this.nextReviewDate || !this.isValid;
  }

  /**
   * Business method: Invalidate insights (mark for regeneration)
   */
  invalidate(): void {
    this.isValid = false;
  }
}

/**
 * @file clv.interface.ts
 * @description Customer Lifetime Value (CLV) analytics data interfaces.
 *              Defines types for CLV metrics, customer segments, and predictions.
 * @module AdminAnalytics/Interfaces
 */

/**
 * Customer segment classification
 * @description Categories for customer value segmentation
 */
export type CustomerSegment = 'VIP' | 'HIGH_VALUE' | 'ACTIVE' | 'AT_RISK' | 'DORMANT' | 'LOST';

/**
 * CLV Analytics Summary
 * @description Aggregated CLV metrics for the entire customer base
 *
 * @swagger
 * components:
 *   schemas:
 *     CLVAnalyticsSummary:
 *       type: object
 *       required:
 *         - averageCLV
 *         - totalCLV
 *         - totalCustomers
 *         - segmentDistribution
 *       properties:
 *         averageCLV:
 *           type: number
 *           description: Average customer lifetime value in SYP
 *           example: 2450000
 *         totalCLV:
 *           type: number
 *           description: Total CLV across all customers in SYP
 *           example: 58750000000
 *         totalCustomers:
 *           type: integer
 *           description: Total number of customers analyzed
 *           example: 23976
 *         segmentDistribution:
 *           type: object
 *           description: Count of customers in each segment
 *         medianCLV:
 *           type: number
 *           description: Median CLV to avoid skew from outliers
 *           example: 1850000
 *         trend:
 *           type: number
 *           description: CLV trend percentage (positive = increasing)
 *           example: 12.5
 *         predictionConfidence:
 *           type: number
 *           description: ML model confidence score (0-1)
 *           example: 0.87
 */
export interface CLVAnalyticsSummary {
  /** Average customer lifetime value in SYP */
  averageCLV: number;

  /** Total CLV across all customers in SYP */
  totalCLV: number;

  /** Total number of customers analyzed */
  totalCustomers: number;

  /** Distribution of customers across segments */
  segmentDistribution: Record<CustomerSegment, number>;

  /** Median CLV (less affected by outliers) */
  medianCLV: number;

  /** CLV growth trend percentage (vs previous period) */
  trend: number;

  /** ML prediction model confidence score (0-1) */
  predictionConfidence: number;

  /** Last calculation timestamp */
  lastCalculated?: Date;
}

/**
 * Customer CLV Detail
 * @description Detailed CLV information for a single customer
 *
 * @swagger
 * components:
 *   schemas:
 *     CustomerCLVDetail:
 *       type: object
 *       required:
 *         - customerId
 *         - customerName
 *         - email
 *         - currentCLV
 *         - predictedCLV
 *         - segment
 *         - totalOrders
 *         - totalSpent
 *         - averageOrderValue
 *         - firstOrderDate
 *         - lastOrderDate
 */
export interface CustomerCLVDetail {
  /** Unique customer identifier */
  customerId: number;

  /** Customer full name */
  customerName: string;

  /** Customer email address */
  email: string;

  /** Current calculated CLV in SYP */
  currentCLV: number;

  /** ML-predicted future CLV in SYP */
  predictedCLV: number;

  /** Customer value segment */
  segment: CustomerSegment;

  /** Total number of orders placed */
  totalOrders: number;

  /** Total amount spent in SYP */
  totalSpent: number;

  /** Average order value in SYP */
  averageOrderValue: number;

  /** Date of first purchase */
  firstOrderDate: Date;

  /** Date of most recent purchase */
  lastOrderDate: Date;

  /** Customer location (city) */
  location?: string;

  /** Churn risk probability (0-1) */
  churnRisk?: number;

  /** Days since last purchase */
  daysSinceLastOrder?: number;

  /** Purchase frequency (orders per month) */
  purchaseFrequency?: number;
}

/**
 * CLV Trend Data Point
 * @description Time series data for CLV trends
 */
export interface CLVTrendDataPoint {
  /** Date label (e.g., "Jan 2025", "Week 3") */
  date: string;

  /** Average CLV at this point */
  averageCLV: number;

  /** Predicted CLV (if forecast) */
  predictedCLV?: number;

  /** Confidence interval lower bound */
  confidenceLower?: number;

  /** Confidence interval upper bound */
  confidenceUpper?: number;

  /** Number of customers in calculation */
  customerCount?: number;
}

/**
 * Segment Performance Metrics
 * @description Performance breakdown by customer segment
 */
export interface SegmentPerformance {
  /** Customer segment name */
  segment: CustomerSegment;

  /** Number of customers in segment */
  customerCount: number;

  /** Percentage of total customers */
  percentage: number;

  /** Average CLV for this segment */
  averageCLV: number;

  /** Total revenue from this segment */
  totalRevenue: number;

  /** Average order frequency (orders/month) */
  averageFrequency: number;

  /** Average order value in SYP */
  averageOrderValue: number;

  /** Segment growth rate (%) */
  growthRate: number;
}

/**
 * Top Customer Entry
 * @description Simplified customer entry for top customers list
 */
export interface TopCustomer {
  /** Customer ID */
  id: number;

  /** Customer name */
  name: string;

  /** Email address */
  email: string;

  /** Current CLV */
  clv: number;

  /** Customer segment */
  segment: CustomerSegment;

  /** Total orders */
  orders: number;

  /** Last order date */
  lastOrder: Date;

  /** Location city */
  location?: string;
}

/**
 * CLV Filter Options
 * @description Query parameters for filtering CLV data
 */
export interface CLVFilterOptions {
  /** Filter by customer segments */
  segments?: CustomerSegment[];

  /** Minimum CLV threshold */
  minCLV?: number;

  /** Maximum CLV threshold */
  maxCLV?: number;

  /** Filter by location */
  location?: string;

  /** Date range start */
  startDate?: Date;

  /** Date range end */
  endDate?: Date;

  /** Sort field */
  sortBy?: 'clv' | 'orders' | 'lastOrder' | 'name';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Page number for pagination */
  page?: number;

  /** Items per page */
  pageSize?: number;
}

/**
 * CLV Calculation Status
 * @description Status of background CLV recalculation job
 */
export interface CLVCalculationStatus {
  /** Job status */
  status: 'idle' | 'running' | 'completed' | 'failed';

  /** Progress percentage (0-100) */
  progress: number;

  /** Customers processed */
  processedCount: number;

  /** Total customers to process */
  totalCount: number;

  /** Estimated time remaining (seconds) */
  estimatedTimeRemaining?: number;

  /** Error message if failed */
  errorMessage?: string;

  /** Job start time */
  startedAt?: Date;

  /** Job completion time */
  completedAt?: Date;
}

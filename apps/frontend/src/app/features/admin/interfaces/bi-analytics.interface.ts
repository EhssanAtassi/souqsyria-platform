/**
 * @file bi-analytics.interface.ts
 * @description TypeScript interfaces for Business Intelligence analytics data.
 *              Covers CLV, Conversion Funnel, Cohort Analysis, and Cart Abandonment.
 *              These interfaces mirror the backend BI DTOs for type-safe API communication.
 * @module AdminDashboard/Interfaces/BI
 */

// =============================================================================
// COMMON BI TYPES
// =============================================================================

/**
 * Time granularity for BI data aggregation
 * @description Controls the level of detail in time-based analytics
 */
export type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'day';

/**
 * Customer segment tier
 * @description Classification tiers for CLV-based segmentation
 */
export type CustomerSegmentTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'at_risk' | 'churned';

/**
 * Device type for funnel analysis
 * @description Device categories for conversion tracking
 */
export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'all';

/**
 * Cohort grouping type
 * @description How cohorts are defined
 */
export type CohortType = 'acquisition_date' | 'first_purchase' | 'registration_source' | 'registration' | 'custom';

/**
 * Recovery status for cart abandonment
 * @description Status of cart recovery efforts
 */
export type RecoveryStatus = 'pending' | 'email_sent' | 'recovered' | 'expired' | 'unrecoverable';

// =============================================================================
// DATE RANGE QUERY INTERFACES
// =============================================================================

/**
 * BI date range query parameters
 * @description Extended date range for BI analytics queries
 */
export interface BIDateRangeQuery {
  /** Start date (ISO format YYYY-MM-DD) */
  startDate: string;
  /** End date (ISO format YYYY-MM-DD) */
  endDate: string;
  /** Time granularity for data aggregation */
  granularity?: TimeGranularity;
  /** Comparison period type */
  compareWith?: 'previous_period' | 'previous_year' | 'none';
}

// =============================================================================
// CLV ANALYTICS INTERFACES
// =============================================================================

/**
 * Customer Lifetime Value summary
 * @description Overview metrics for CLV analytics
 */
export interface CLVSummary {
  /** Average CLV across all customers (SYP) */
  averageCLV: number;
  /** Median CLV (SYP) */
  medianCLV: number;
  /** Total CLV of all customers (SYP) */
  totalCLV: number;
  /** Total number of customers analyzed */
  totalCustomers: number;
  /** CLV growth compared to previous period (%) */
  clvGrowth: number;
  /** CLV growth rate (alias for clvGrowth) */
  clvGrowthRate?: number;
  /** Average customer lifespan (days) */
  averageLifespan: number;
  /** Average purchase frequency per customer */
  averageFrequency: number;
  /** Average order value (SYP) */
  averageOrderValue: number;
  /** Trend data for visualization */
  trendData?: CLVTrendPoint[];
}

/**
 * Customer segment breakdown
 * @description CLV-based customer segment statistics
 */
export interface CustomerSegment {
  /** Segment tier/name */
  tier: CustomerSegmentTier;
  /** Display name for the segment */
  displayName: string;
  /** Number of customers in segment */
  customerCount: number;
  /** Percentage of total customers */
  percentage: number;
  /** Average CLV for segment (SYP) */
  averageCLV: number;
  /** Alias for averageCLV */
  avgCLV?: number;
  /** Total revenue from segment (SYP) */
  totalRevenue: number;
  /** Revenue share percentage */
  revenueShare?: number;
  /** Average order frequency */
  averageFrequency: number;
  /** Average recency (days since last purchase) */
  averageRecency: number;
  /** Segment color for visualization */
  color: string;
  /** Customer retention rate for segment */
  retentionRate?: number;
}

/**
 * CLV trend data point
 * @description Time-series data for CLV trends
 */
export interface CLVTrendPoint {
  /** Period label (date or period name) */
  period: string;
  /** Date for time-series visualization */
  date?: Date | string;
  /** Average CLV for period (SYP) */
  averageCLV: number;
  /** Total new customer CLV (SYP) */
  newCustomerCLV: number;
  /** Total existing customer CLV (SYP) */
  existingCustomerCLV: number;
  /** Customer count for period */
  customerCount: number;
}

/**
 * High-value customer
 * @description Top customer by lifetime value
 */
export interface HighValueCustomer {
  /** Customer ID */
  id: number;
  /** Customer ID alias for template compatibility */
  customerId?: number;
  /** Customer full name */
  fullName: string;
  /** Name alias for template compatibility */
  name?: string;
  /** Customer email */
  email: string;
  /** Profile avatar URL */
  avatar?: string;
  /** Customer's CLV (SYP) */
  clv: number;
  /** Total orders placed */
  totalOrders: number;
  /** Order count alias for template compatibility */
  orderCount?: number;
  /** Total spent (SYP) */
  totalSpent: number;
  /** Average order value (SYP) */
  averageOrderValue: number;
  /** Average order value alias for template compatibility */
  avgOrderValue?: number;
  /** Days since last purchase */
  recency: number;
  /** Customer segment tier */
  segment: CustomerSegmentTier;
  /** Customer since date */
  customerSince: Date;
  /** Last purchase date */
  lastPurchaseDate: Date;
}

/**
 * CLV prediction data
 * @description Predicted future CLV for customers
 */
export interface CLVPrediction {
  /** Prediction timeframe (e.g., "30_days", "90_days", "1_year") */
  timeframe: string;
  /** Predicted total CLV (SYP) */
  predictedCLV: number;
  /** Confidence interval lower bound (SYP) */
  confidenceLower: number;
  /** Confidence interval upper bound (SYP) */
  confidenceUpper: number;
  /** Prediction confidence percentage */
  confidence: number;
  /** Number of customers included */
  customerCount: number;
  /** Customer ID for individual predictions */
  customerId?: number;
  /** Churn risk score (0-100) */
  churnRisk?: number;
  /** Growth potential score (0-100) */
  growthPotential?: number;
}

/**
 * CLV distribution bucket
 * @description Distribution of customers by CLV range
 */
export interface CLVDistributionBucket {
  /** Range label (e.g., "0-10K", "10K-50K") */
  range: string;
  /** Minimum CLV in bucket (SYP) */
  minCLV: number;
  /** Maximum CLV in bucket (SYP) */
  maxCLV: number;
  /** Number of customers in bucket */
  count: number;
  /** Percentage of total customers */
  percentage: number;
  /** Total CLV in bucket (SYP) */
  totalCLV: number;
}

/**
 * Complete CLV Analytics response
 * @description Full CLV analytics data structure
 */
export interface CLVAnalyticsData {
  /** Summary metrics */
  summary: CLVSummary;
  /** Customer segments breakdown */
  segments: CustomerSegment[];
  /** CLV trend over time */
  trends: CLVTrendPoint[];
  /** Top customers by CLV */
  topCustomers: HighValueCustomer[];
  /** CLV predictions */
  predictions: CLVPrediction[];
  /** CLV distribution */
  distribution: CLVDistributionBucket[];
  /** Data freshness timestamp */
  lastUpdated: Date;
}

// =============================================================================
// CONVERSION FUNNEL INTERFACES
// =============================================================================

/**
 * Funnel stage
 * @description A single stage in the conversion funnel
 */
export interface FunnelStage {
  /** Stage identifier */
  id: string;
  /** Stage ID alias for template compatibility */
  stageId?: string;
  /** Stage display name */
  name: string;
  /** Stage display name in Arabic */
  nameAr: string;
  /** Number of users at this stage */
  count: number;
  /** Users alias for template compatibility */
  users?: number;
  /** Conversion rate from previous stage (%) */
  conversionRate: number;
  /** Drop-off rate from previous stage (%) */
  dropoffRate: number;
  /** Average time spent at stage (seconds) */
  averageTimeSpent: number;
  /** Stage order/position */
  order: number;
  /** Stage color for visualization */
  color: string;
}

/**
 * Funnel overview
 * @description Overall funnel metrics
 */
export interface FunnelOverview {
  /** Total visitors entering funnel */
  totalVisitors: number;
  /** Total conversions (completed purchases) */
  totalConversions: number;
  /** Overall conversion rate (%) */
  overallConversionRate: number;
  /** Conversion rate change vs previous period (%) */
  conversionRateChange: number;
  /** Average funnel completion time (seconds) */
  averageCompletionTime: number;
  /** Revenue from converted users (SYP) */
  revenueFromConversions: number;
  /** Stages in the funnel */
  stages: FunnelStage[];
}

/**
 * Funnel by device type
 * @description Funnel metrics broken down by device
 */
export interface FunnelByDevice {
  /** Device type */
  device: DeviceType;
  /** Device display name */
  deviceName: string;
  /** Number of visitors */
  visitors: number;
  /** Number of conversions */
  conversions: number;
  /** Conversion rate (%) */
  conversionRate: number;
  /** Revenue (SYP) */
  revenue: number;
  /** Percentage of total traffic */
  trafficShare: number;
  /** Funnel stages for this device */
  stages: FunnelStage[];
}

/**
 * Funnel drop-off point
 * @description Analysis of where users drop off
 */
export interface FunnelDropoffPoint {
  /** Stage where dropoff occurs */
  fromStage: string;
  /** Next stage users should reach */
  toStage: string;
  /** Number of users who dropped off */
  droppedCount: number;
  /** Drop-off rate (%) */
  dropoffRate: number;
  /** Potential revenue lost (SYP) */
  potentialRevenueLost: number;
  /** Common reasons for dropoff (if available) */
  commonReasons?: string[];
  /** Recommended actions */
  recommendations?: string[];
}

/**
 * Funnel trend data point
 * @description Time-series data for funnel metrics
 */
export interface FunnelTrendPoint {
  /** Period label */
  period: string;
  /** Total visitors */
  visitors: number;
  /** Conversions */
  conversions: number;
  /** Conversion rate (%) */
  conversionRate: number;
  /** Revenue (SYP) */
  revenue: number;
}

/**
 * Complete Funnel Analytics response
 * @description Full conversion funnel analytics data
 */
export interface FunnelAnalyticsData {
  /** Overall funnel overview */
  overview: FunnelOverview;
  /** Funnel stages (alias for overview.stages) */
  stages?: FunnelStage[];
  /** Breakdown by device type */
  byDevice: FunnelByDevice[];
  /** Drop-off analysis */
  dropoffPoints: FunnelDropoffPoint[];
  /** Funnel trends over time */
  trends: FunnelTrendPoint[];
  /** Top exit pages */
  topExitPages: { page: string; exitCount: number; percentage: number }[];
  /** Data freshness timestamp */
  lastUpdated: Date;
}

// =============================================================================
// COHORT ANALYSIS INTERFACES
// =============================================================================

/**
 * Cohort definition
 * @description Defines a cohort group
 */
export interface CohortDefinition {
  /** Cohort identifier */
  id: string;
  /** Cohort ID (required for CohortData compatibility) */
  cohortId: string;
  /** Cohort display name */
  name: string;
  /** Cohort type */
  type: CohortType;
  /** Cohort start date */
  startDate: Date;
  /** Cohort end date */
  endDate: Date;
  /** Number of users in cohort */
  size: number;
  /** Average orders per user in cohort */
  avgOrders?: number;
  /** Average order value in cohort (SYP) */
  avgOrderValue?: number;
  /** Total revenue from cohort (SYP) */
  totalRevenue?: number;
}

/**
 * Cohort retention data
 * @description Retention metrics for a cohort over time
 */
export interface CohortRetention {
  /** Cohort definition */
  cohort: CohortDefinition;
  /** Cohort ID alias for template compatibility */
  cohortId?: string;
  /** Initial size of cohort */
  initialSize: number;
  /** Retention percentages by period */
  retentionByPeriod: {
    /** Period number (0 = initial, 1 = first period, etc.) */
    period: number;
    /** Period label (e.g., "Week 1", "Month 2") */
    label: string;
    /** Number of retained users */
    retainedCount: number;
    /** Retention rate (%) */
    retentionRate: number;
  }[];
  /** Retention rates array for template compatibility */
  retentionRates?: number[];
  /** Average retention rate across all periods (%) */
  averageRetention: number;
  /** Churn rate (%) */
  churnRate: number;
}

/**
 * Cohort revenue data
 * @description Revenue metrics for cohorts over time
 */
export interface CohortRevenue {
  /** Cohort definition */
  cohort: CohortDefinition;
  /** Revenue by period */
  revenueByPeriod: {
    /** Period number */
    period: number;
    /** Period label */
    label: string;
    /** Revenue in this period (SYP) */
    revenue: number;
    /** Cumulative revenue (SYP) */
    cumulativeRevenue: number;
    /** Average revenue per user (SYP) */
    arpu: number;
  }[];
  /** Total lifetime revenue (SYP) */
  totalRevenue: number;
  /** Average revenue per user overall (SYP) */
  averageARPU: number;
}

/**
 * Cohort behavior metrics
 * @description Behavioral patterns for cohorts
 */
export interface CohortBehavior {
  /** Cohort definition */
  cohort: CohortDefinition;
  /** Average orders per user */
  averageOrders: number;
  /** Average order value (SYP) */
  averageOrderValue: number;
  /** Average days between purchases */
  purchaseFrequency: number;
  /** Repeat purchase rate (%) */
  repeatPurchaseRate: number;
  /** Category preferences */
  topCategories: { category: string; percentage: number }[];
  /** Peak activity days */
  peakActivityDays: string[];
}

/**
 * Cohort comparison
 * @description Comparison between multiple cohorts
 */
export interface CohortComparison {
  /** Metric being compared */
  metric: string;
  /** Cohorts with their values */
  cohorts: {
    /** Cohort name */
    name: string;
    /** Metric value */
    value: number;
    /** Change vs baseline (%) */
    changeVsBaseline?: number;
  }[];
  /** Best performing cohort */
  bestPerformer: string;
  /** Worst performing cohort */
  worstPerformer: string;
}

/**
 * Complete Cohort Analytics response
 * @description Full cohort analysis data
 */
export interface CohortAnalyticsData {
  /** Available cohort definitions */
  cohorts: CohortDefinition[];
  /** Retention data by cohort */
  retention: CohortRetention[];
  /** Revenue data by cohort */
  revenue: CohortRevenue[];
  /** Behavior data by cohort */
  behavior: CohortBehavior[];
  /** Cohort comparisons */
  comparisons: CohortComparison[];
  /** Data freshness timestamp */
  lastUpdated: Date;
}

// =============================================================================
// CART ABANDONMENT INTERFACES
// =============================================================================

/**
 * Cart abandonment overview
 * @description Overall cart abandonment metrics
 */
export interface CartAbandonmentOverview {
  /** Total abandoned carts in period */
  totalAbandonedCarts: number;
  /** Cart abandonment rate (%) */
  abandonmentRate: number;
  /** Change in abandonment rate vs previous period (%) */
  abandonmentRateChange: number;
  /** Total value of abandoned carts (SYP) */
  totalAbandonedValue: number;
  /** Average abandoned cart value (SYP) */
  averageAbandonedValue: number;
  /** Total recovered carts */
  recoveredCarts: number;
  /** Recovery rate (%) */
  recoveryRate: number;
  /** Recovered revenue (SYP) */
  recoveredRevenue: number;
  /** Potential revenue still to recover (SYP) */
  potentialRecoveryValue: number;
}

/**
 * Abandoned cart item
 * @description Individual abandoned cart record
 */
export interface AbandonedCart {
  /** Cart/session ID */
  id: string;
  /** Cart ID alias for template compatibility */
  cartId?: string;
  /** Customer ID (if known) */
  customerId?: number;
  /** Customer email (if known) */
  customerEmail?: string;
  /** Customer name (if known) */
  customerName?: string;
  /** Is guest checkout */
  isGuest: boolean;
  /** Cart total value (SYP) */
  cartValue: number;
  /** Total value alias for template compatibility */
  totalValue?: number;
  /** Number of items in cart */
  itemCount: number;
  /** Items in cart */
  items: {
    productId: number;
    productName: string;
    thumbnail?: string;
    quantity: number;
    price: number;
  }[];
  /** Abandonment timestamp */
  abandonedAt: Date;
  /** Last stage reached */
  lastStage: string;
  /** Device type */
  device: DeviceType;
  /** Recovery status */
  recoveryStatus: RecoveryStatus;
  /** Recovery emails sent count */
  emailsSent: number;
  /** Recovery email sent alias for template compatibility */
  recoveryEmailSent?: boolean;
  /** Was cart recovered */
  wasRecovered: boolean;
  /** Recovered at timestamp */
  recoveredAt?: Date;
}

/**
 * Abandonment by stage
 * @description Where users abandon their carts
 */
export interface AbandonmentByStage {
  /** Checkout stage */
  stage: string;
  /** Stage display name */
  stageName: string;
  /** Number of abandonments */
  abandonmentCount: number;
  /** Percentage of total abandonments */
  percentage: number;
  /** Average cart value at this stage (SYP) */
  averageCartValue: number;
  /** Common issues at this stage */
  commonIssues?: string[];
}

/**
 * Abandonment reasons
 * @description Analyzed reasons for cart abandonment
 */
export interface AbandonmentReason {
  /** Reason category */
  reason: string;
  /** Reason display label */
  label: string;
  /** Reason display label in Arabic */
  labelAr: string;
  /** Count of abandonments for this reason */
  count: number;
  /** Percentage of total */
  percentage: number;
  /** Potential revenue impact (SYP) */
  revenueImpact: number;
  /** Recommended action */
  recommendation?: string;
}

/**
 * Recovery campaign metrics
 * @description Performance of cart recovery campaigns
 */
export interface RecoveryCampaignMetrics {
  /** Campaign identifier */
  campaignId: string;
  /** Campaign name */
  name: string;
  /** Email type (e.g., "first_reminder", "discount_offer") */
  emailType: string;
  /** Emails sent */
  emailsSent: number;
  /** Emails opened */
  emailsOpened: number;
  /** Open rate (%) */
  openRate: number;
  /** Click-through rate (%) */
  clickRate: number;
  /** Carts recovered */
  cartsRecovered: number;
  /** Recovery rate (%) */
  recoveryRate: number;
  /** Revenue recovered (SYP) */
  revenueRecovered: number;
  /** Average order value of recovered carts (SYP) */
  averageRecoveredValue: number;
}

/**
 * Abandonment trend data point
 * @description Time-series data for abandonment metrics
 */
export interface AbandonmentTrendPoint {
  /** Period label */
  period: string;
  /** Total abandoned carts */
  abandonedCarts: number;
  /** Abandonment rate (%) */
  abandonmentRate: number;
  /** Abandoned value (SYP) */
  abandonedValue: number;
  /** Recovered carts */
  recoveredCarts: number;
  /** Recovery rate (%) */
  recoveryRate: number;
  /** Recovered value (SYP) */
  recoveredValue: number;
}

/**
 * Complete Cart Abandonment Analytics response
 * @description Full cart abandonment analytics data
 */
export interface CartAbandonmentData {
  /** Overview metrics */
  overview: CartAbandonmentOverview;
  /** Recent abandoned carts */
  recentAbandoned: AbandonedCart[];
  /** Abandonment by checkout stage */
  byStage: AbandonmentByStage[];
  /** Abandonment reasons analysis */
  reasons: AbandonmentReason[];
  /** Recovery campaign performance */
  campaigns: RecoveryCampaignMetrics[];
  /** Abandonment trends over time */
  trends: AbandonmentTrendPoint[];
  /** By device breakdown */
  byDevice: {
    device: DeviceType;
    abandonmentRate: number;
    totalValue: number;
    recoveryRate: number;
  }[];
  /** Data freshness timestamp */
  lastUpdated: Date;
}

// =============================================================================
// ENHANCED DASHBOARD INTERFACES
// =============================================================================

/**
 * Enhanced dashboard summary
 * @description Combined BI metrics for dashboard overview
 */
export interface EnhancedDashboardSummary {
  /** CLV highlights */
  clv: {
    averageCLV: number;
    clvGrowth: number;
    topSegment: CustomerSegmentTier;
    atRiskCount: number;
  };
  /** Funnel highlights */
  funnel: {
    conversionRate: number;
    conversionChange: number;
    biggestDropoff: string;
    mobileFunnelRate: number;
  };
  /** Cohort highlights */
  cohort: {
    weeklyRetention: number;
    monthlyRetention: number;
    bestCohort: string;
    churnRate: number;
  };
  /** Abandonment highlights */
  abandonment: {
    abandonmentRate: number;
    abandonmentChange: number;
    recoveryRate: number;
    potentialRevenue: number;
  };
  /** Last updated timestamp */
  lastUpdated: Date;
}

// =============================================================================
// QUERY INTERFACES
// =============================================================================

/**
 * CLV Analytics query parameters
 */
export interface CLVAnalyticsQuery extends BIDateRangeQuery {
  /** Customer segments to include */
  segments?: CustomerSegmentTier[];
  /** Number of top customers to return */
  topCustomersLimit?: number;
  /** Include predictions */
  includePredictions?: boolean;
}

/**
 * Funnel Analytics query parameters
 */
export interface FunnelAnalyticsQuery extends BIDateRangeQuery {
  /** Device type filter */
  device?: DeviceType;
  /** Include exit page analysis */
  includeExitPages?: boolean;
}

/**
 * Cohort Analytics query parameters
 */
export interface CohortAnalyticsQuery extends BIDateRangeQuery {
  /** Cohort type */
  cohortType?: CohortType;
  /** Number of periods to analyze */
  periods?: number;
  /** Period type (day, week, month) */
  periodType?: 'day' | 'week' | 'month';
}

/**
 * Cart Abandonment query parameters
 */
export interface CartAbandonmentQuery extends BIDateRangeQuery {
  /** Recovery status filter */
  recoveryStatus?: RecoveryStatus;
  /** Device filter */
  device?: DeviceType;
  /** Minimum cart value filter */
  minCartValue?: number;
  /** Include item details */
  includeItems?: boolean;
}

/**
 * Abandoned product statistics
 * @description Products frequently abandoned in carts
 */
export interface AbandonedProduct {
  /** Product ID */
  productId: number;
  /** Product name */
  productName: string;
  /** Product thumbnail */
  thumbnail?: string;
  /** Product category */
  category?: string;
  /** Number of times abandoned */
  abandonmentCount: number;
  /** Alias for abandonmentCount (template compatibility) */
  abandonedCount?: number;
  /** Total value of abandoned carts containing this product */
  totalLostValue: number;
  /** Alias for totalLostValue (template compatibility) */
  totalValue?: number;
  /** Average quantity per abandonment */
  averageQuantity: number;
  /** Total quantity abandoned (template compatibility) */
  totalQuantity?: number;
  /** Average price per item */
  avgPrice?: number;
  /** Recovery rate for carts with this product */
  recoveryRate: number;
}

/**
 * Cart abandonment summary
 * @description High-level summary of cart abandonment metrics
 */
export interface CartAbandonmentSummary {
  /** Total abandoned carts */
  totalAbandoned: number;
  /** Alias for totalAbandoned (template compatibility) */
  totalAbandonedCarts?: number;
  /** Total value of abandoned carts (SYP) */
  totalLostValue: number;
  /** Alias for totalLostValue (template compatibility) */
  totalAbandonedValue?: number;
  /** Overall abandonment rate */
  abandonmentRate: number;
  /** Recovery rate */
  recoveryRate: number;
  /** Value recovered (SYP) */
  recoveredValue?: number;
  /** Average cart value */
  averageCartValue: number;
  /** Alias for averageCartValue (template compatibility) */
  avgAbandonedCartValue?: number;
  /** Average items per cart */
  averageItemsPerCart: number;
  /** Top abandonment stage */
  topAbandonmentStage: string;
  /** Change from previous period */
  trend: KPITrend;
}

/**
 * Abandonment by reason
 * @description Alias for AbandonmentReason with additional analytics
 */
export interface AbandonmentByReason {
  /** Abandonment reason code */
  reason: string;
  /** Display name */
  reasonName: string;
  /** Number of abandonments */
  count: number;
  /** Percentage of total */
  percentage: number;
  /** Average cart value for this reason */
  averageCartValue: number;
  /** Recovery rate for this reason */
  recoveryRate: number;
}

/**
 * Abandonment trend
 * @description Trend data for cart abandonment over time
 */
export interface AbandonmentTrend {
  /** Date period */
  date: string;
  /** Number of abandonments */
  abandonmentCount: number;
  /** Abandonment rate */
  abandonmentRate: number;
  /** Total lost value */
  lostValue: number;
  /** Recovery count */
  recoveryCount: number;
  /** Recovery rate */
  recoveryRate: number;
}

/**
 * Recovery metrics
 * @description Metrics for cart recovery campaigns
 */
export interface RecoveryMetrics {
  /** Total recovery emails sent */
  emailsSent: number;
  /** Emails opened */
  emailsOpened: number;
  /** Email open rate (percentage) */
  emailOpenRate?: number;
  /** Links clicked */
  linksClicked: number;
  /** Email click rate (percentage) */
  emailClickRate?: number;
  /** Carts recovered */
  cartsRecovered: number;
  /** Revenue recovered (SYP) */
  revenueRecovered: number;
  /** Recovery rate */
  recoveryRate: number;
  /** Average time to recovery (hours) */
  averageRecoveryTime: number;
  /** Alias for averageRecoveryTime (template compatibility) */
  avgTimeToRecovery?: number;
  /** Best performing email template */
  bestTemplate?: string;
}

/**
 * KPI trend direction
 * @description Direction indicator for KPI changes
 */
export type KPITrendDirection = 'up' | 'down' | 'neutral';

/**
 * KPI trend
 * @description Trend information for KPI cards
 */
export interface KPITrend {
  /** Trend direction */
  direction: KPITrendDirection;
  /** Change value (percentage or absolute) */
  value: number;
  /** Is change positive (improvement) */
  isPositive?: boolean;
}

/**
 * KPI display format
 * @description Format type for displaying KPI values
 */
export type KPIFormat = 'number' | 'currency' | 'percentage' | 'decimal' | 'text' | 'duration';

// =============================================================================
// ADDITIONAL BI TYPES FOR TEMPLATE COMPATIBILITY
// =============================================================================

/**
 * Cohort data for cohort analysis
 * @description Combined cohort data for easy template binding
 */
export interface CohortData {
  /** Cohort identifier */
  cohortId: string;
  /** Cohort display name */
  name: string;
  /** Cohort type */
  type: CohortType;
  /** Cohort start date */
  startDate: Date | string;
  /** Cohort end date */
  endDate: Date | string;
  /** Number of users in cohort */
  size: number;
  /** Average orders per user */
  avgOrders?: number;
  /** Average order value (SYP) */
  avgOrderValue?: number;
  /** Total revenue from cohort (SYP) */
  totalRevenue?: number;
  /** Retention rates by period */
  retentionRates?: number[];
  /** Average retention rate (%) */
  averageRetention?: number;
  /** Churn rate (%) */
  churnRate?: number;
}

/**
 * Retention row for cohort retention table
 * @description Row data for displaying cohort retention matrix
 */
export interface RetentionRow {
  /** Cohort identifier */
  cohortId: string;
  /** Cohort name/label */
  cohortName: string;
  /** Initial cohort size */
  initialSize: number;
  /** Retention rates by period (percentage values) */
  retentionRates: number[];
  /** Average retention across all periods */
  averageRetention: number;
}

/**
 * BI Export config for reports
 * @description Configuration for BI data exports
 */
export interface BIExportConfig {
  /** Sections to include in export */
  sections: string[] | readonly string[];
  /** Export format */
  format: 'csv' | 'xlsx' | 'pdf';
  /** Date range for export */
  dateRange: {
    startDate: string;
    endDate: string;
    preset?: string;
  };
  /** Include chart images in export */
  includeCharts?: boolean;
  /** Include AI recommendations in export */
  includeRecommendations?: boolean;
}

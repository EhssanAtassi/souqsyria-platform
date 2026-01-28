/**
 * @file bi-dashboard.interfaces.ts
 * @description TypeScript interfaces for the Business Intelligence Dashboard.
 *              Defines data structures for CLV analytics, conversion funnels,
 *              cart abandonment tracking, and cohort analysis.
 * @module AdminDashboard/Analytics/BI/Interfaces
 *
 * @swagger
 * components:
 *   schemas:
 *     CustomerSegment:
 *       type: string
 *       enum: [champion, loyal, potential_loyalist, new_customer, promising, needs_attention, about_to_sleep, at_risk, cant_lose, hibernating, lost]
 *       description: RFM-based customer segmentation categories
 *
 *     CLVMetrics:
 *       type: object
 *       description: Customer Lifetime Value analytics data
 *       properties:
 *         totalCustomers:
 *           type: integer
 *           description: Total number of customers analyzed
 *         averageCLV:
 *           type: number
 *           description: Average customer lifetime value in SYP
 *         totalProjectedRevenue:
 *           type: number
 *           description: Total projected revenue from all customers
 *
 *     ConversionFunnel:
 *       type: object
 *       description: E-commerce conversion funnel data
 *       properties:
 *         stages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FunnelStage'
 *         overallConversionRate:
 *           type: number
 *           description: Overall funnel conversion rate as decimal
 *
 *     CartAbandonmentData:
 *       type: object
 *       description: Cart abandonment analytics and recovery data
 *       properties:
 *         abandonmentRate:
 *           type: number
 *           description: Overall cart abandonment rate as decimal
 *         totalAbandonedCarts:
 *           type: integer
 *           description: Total number of abandoned carts
 *         totalAbandonedValue:
 *           type: number
 *           description: Total value of abandoned carts in SYP
 *
 *     CohortAnalysis:
 *       type: object
 *       description: Customer cohort retention analysis
 *       properties:
 *         cohorts:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Cohort'
 *         averageRetention:
 *           type: object
 *           properties:
 *             week1:
 *               type: number
 *             week4:
 *               type: number
 *             week8:
 *               type: number
 *             week12:
 *               type: number
 */

// =============================================================================
// CUSTOMER SEGMENT TYPES
// =============================================================================

/**
 * RFM-based customer segmentation categories
 * @description Classifies customers based on Recency, Frequency, Monetary analysis
 *
 * @segment champion - High value, recent, frequent buyers
 * @segment loyal - Consistent buyers with good frequency
 * @segment potential_loyalist - Recent buyers with potential to become loyal
 * @segment new_customer - Recent first-time buyers
 * @segment promising - Recent buyers with low frequency
 * @segment needs_attention - Above average buyers who haven't purchased recently
 * @segment about_to_sleep - Below average recency and frequency
 * @segment at_risk - High value customers who haven't purchased recently
 * @segment cant_lose - Top customers who haven't been active
 * @segment hibernating - Low recency and frequency
 * @segment lost - Haven't purchased in a long time
 */
export type CustomerSegment =
  | 'champion'
  | 'loyal'
  | 'potential_loyalist'
  | 'new_customer'
  | 'promising'
  | 'needs_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose'
  | 'hibernating'
  | 'lost';

/**
 * Customer segment configuration
 * @description Display configuration for each customer segment
 */
export interface CustomerSegmentConfig {
  /** Segment identifier */
  segment: CustomerSegment;
  /** Display label in English */
  labelEn: string;
  /** Display label in Arabic */
  labelAr: string;
  /** Color code for visualization */
  color: string;
  /** Icon name (Material Icons) */
  icon: string;
  /** Recommended action for this segment */
  recommendedAction: string;
}

// =============================================================================
// CLV (CUSTOMER LIFETIME VALUE) INTERFACES
// =============================================================================

/**
 * Individual customer CLV data
 * @description Detailed CLV metrics for a single customer
 */
export interface CustomerCLV {
  /** Customer unique identifier */
  customerId: number;
  /** Customer display name */
  customerName: string;
  /** Customer email address */
  email: string;
  /** Customer phone number */
  phone?: string;
  /** Customer location/city */
  city: string;
  /** Customer segment classification */
  segment: CustomerSegment;
  /** Historical lifetime value */
  historicalCLV: number;
  /** Predicted future CLV */
  predictedCLV: number;
  /** Total CLV (historical + predicted) */
  totalCLV: number;
  /** Total number of orders */
  orderCount: number;
  /** Average order value */
  averageOrderValue: number;
  /** Days since last purchase */
  daysSinceLastPurchase: number;
  /** Customer registration date */
  registrationDate: string;
  /** First purchase date */
  firstPurchaseDate: string;
  /** Last purchase date */
  lastPurchaseDate: string;
  /** Customer tenure in months */
  tenureMonths: number;
  /** Purchase frequency (orders per month) */
  purchaseFrequency: number;
  /** CLV prediction confidence score (0-1) */
  confidenceScore: number;
  /** Risk score for churn (0-100) */
  churnRisk: number;
}

/**
 * CLV segment summary
 * @description Aggregated metrics for a customer segment
 */
export interface CLVSegmentSummary {
  /** Segment identifier */
  segment: CustomerSegment;
  /** Number of customers in segment */
  customerCount: number;
  /** Percentage of total customers */
  percentageOfTotal: number;
  /** Total CLV for segment */
  totalCLV: number;
  /** Average CLV for segment */
  averageCLV: number;
  /** Average order value for segment */
  averageOrderValue: number;
  /** Average purchase frequency */
  averagePurchaseFrequency: number;
  /** Average churn risk */
  averageChurnRisk: number;
}

/**
 * CLV analytics dashboard data
 * @description Complete CLV analytics for the BI dashboard
 */
export interface CLVAnalytics {
  /** Summary metrics */
  summary: {
    /** Total number of customers analyzed */
    totalCustomers: number;
    /** Overall average CLV */
    averageCLV: number;
    /** Median CLV */
    medianCLV: number;
    /** Total projected revenue */
    totalProjectedRevenue: number;
    /** CLV growth percentage vs previous period */
    clvGrowth: number;
    /** Average customer tenure in months */
    averageTenure: number;
    /** Overall churn risk percentage */
    overallChurnRisk: number;
  };
  /** Segment breakdown */
  segments: CLVSegmentSummary[];
  /** Top customers by CLV */
  topCustomers: CustomerCLV[];
  /** At-risk customers requiring attention */
  atRiskCustomers: CustomerCLV[];
  /** CLV distribution histogram data */
  clvDistribution: {
    /** CLV range bucket */
    bucket: string;
    /** Bucket minimum value */
    minValue: number;
    /** Bucket maximum value */
    maxValue: number;
    /** Number of customers in bucket */
    count: number;
    /** Percentage of total */
    percentage: number;
  }[];
  /** CLV trend over time */
  clvTrend: {
    /** Period label (e.g., "Jan 2024") */
    period: string;
    /** Average CLV for period */
    averageCLV: number;
    /** Total CLV for period */
    totalCLV: number;
    /** Number of customers */
    customerCount: number;
  }[];
  /** Last updated timestamp */
  lastUpdated: string;
}

// =============================================================================
// CONVERSION FUNNEL INTERFACES
// =============================================================================

/**
 * Funnel stage types
 * @description Standard e-commerce conversion funnel stages
 */
export type FunnelStageType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase';

/**
 * Device type for analytics
 * @description Tracks conversions by device type
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Single funnel stage data
 * @description Metrics for one stage of the conversion funnel
 */
export interface FunnelStage {
  /** Stage identifier */
  stageId: FunnelStageType;
  /** Display name in English */
  labelEn: string;
  /** Display name in Arabic */
  labelAr: string;
  /** Number of users at this stage */
  count: number;
  /** Conversion rate from previous stage (decimal) */
  conversionRate: number;
  /** Drop-off rate from this stage (decimal) */
  dropOffRate: number;
  /** Revenue value at this stage */
  value: number;
  /** Average time spent at this stage (seconds) */
  averageTimeSeconds: number;
  /** Device breakdown */
  deviceBreakdown: {
    device: DeviceType;
    count: number;
    percentage: number;
  }[];
}

/**
 * Funnel comparison data
 * @description Compare funnel performance across different dimensions
 */
export interface FunnelComparison {
  /** Comparison dimension (e.g., "This Week", "Last Week") */
  dimension: string;
  /** Stages data for this comparison */
  stages: FunnelStage[];
  /** Overall conversion rate */
  overallConversionRate: number;
  /** Total revenue */
  totalRevenue: number;
}

/**
 * Conversion funnel analytics
 * @description Complete conversion funnel data for the BI dashboard
 */
export interface ConversionFunnelAnalytics {
  /** Date range for the analysis */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  /** Current funnel data */
  currentFunnel: {
    stages: FunnelStage[];
    overallConversionRate: number;
    totalVisitors: number;
    totalConversions: number;
    totalRevenue: number;
    averageTimeToConversion: number;
  };
  /** Comparison with previous period */
  previousPeriodComparison: {
    overallConversionRateChange: number;
    visitorChange: number;
    conversionChange: number;
    revenueChange: number;
  };
  /** Device-level funnel breakdown */
  deviceFunnels: {
    device: DeviceType;
    stages: FunnelStage[];
    overallConversionRate: number;
    percentageOfTraffic: number;
  }[];
  /** Biggest drop-off point */
  biggestDropOff: {
    fromStage: FunnelStageType;
    toStage: FunnelStageType;
    dropOffRate: number;
    estimatedLostRevenue: number;
    recommendedActions: string[];
  };
  /** Funnel trends over time */
  trends: {
    period: string;
    overallConversionRate: number;
    pageViewToCart: number;
    cartToCheckout: number;
    checkoutToPurchase: number;
  }[];
  /** Last updated timestamp */
  lastUpdated: string;
}

// =============================================================================
// CART ABANDONMENT INTERFACES
// =============================================================================

/**
 * Cart abandonment reasons
 * @description Common reasons for cart abandonment
 */
export type AbandonmentReason =
  | 'high_shipping_cost'
  | 'unexpected_costs'
  | 'account_required'
  | 'complex_checkout'
  | 'payment_issues'
  | 'security_concerns'
  | 'comparison_shopping'
  | 'just_browsing'
  | 'found_better_price'
  | 'technical_issues'
  | 'delivery_time_too_long'
  | 'other'
  | 'unknown';

/**
 * Recovery campaign status
 * @description Status of cart recovery campaigns
 */
export type RecoveryCampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

/**
 * Individual abandoned cart data
 * @description Detailed data for a single abandoned cart
 */
export interface AbandonedCart {
  /** Abandoned cart identifier */
  cartId: string;
  /** Customer identifier (if known) */
  customerId?: number;
  /** Customer name (if known) */
  customerName?: string;
  /** Customer email (if known) */
  customerEmail?: string;
  /** Customer phone (if known) */
  customerPhone?: string;
  /** Is guest checkout */
  isGuest: boolean;
  /** Cart total value */
  cartValue: number;
  /** Number of items in cart */
  itemCount: number;
  /** Cart items summary */
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    thumbnailUrl?: string;
  }[];
  /** Device type */
  device: DeviceType;
  /** Stage where abandonment occurred */
  abandonmentStage: FunnelStageType;
  /** Detected abandonment reason */
  reason?: AbandonmentReason;
  /** Abandonment timestamp */
  abandonedAt: string;
  /** Time spent before abandonment (seconds) */
  timeSpentSeconds: number;
  /** Number of recovery attempts made */
  recoveryAttempts: number;
  /** Was cart recovered */
  isRecovered: boolean;
  /** Recovery timestamp (if recovered) */
  recoveredAt?: string;
  /** Recovery campaign that worked */
  recoveryCampaignId?: string;
}

/**
 * Recovery campaign data
 * @description Cart recovery campaign configuration and performance
 */
export interface RecoveryCampaign {
  /** Campaign identifier */
  campaignId: string;
  /** Campaign name */
  name: string;
  /** Campaign description */
  description: string;
  /** Campaign type */
  type: 'email' | 'sms' | 'push_notification' | 'whatsapp';
  /** Campaign status */
  status: RecoveryCampaignStatus;
  /** Trigger delay (hours after abandonment) */
  triggerDelayHours: number;
  /** Discount offered (percentage) */
  discountPercentage?: number;
  /** Free shipping offered */
  freeShipping?: boolean;
  /** Campaign start date */
  startDate: string;
  /** Campaign end date (if applicable) */
  endDate?: string;
  /** Performance metrics */
  metrics: {
    /** Number of carts targeted */
    cartsTargeted: number;
    /** Messages sent */
    messagesSent: number;
    /** Messages opened/read */
    messagesOpened: number;
    /** Click-through rate */
    clickThroughRate: number;
    /** Carts recovered */
    cartsRecovered: number;
    /** Recovery rate */
    recoveryRate: number;
    /** Revenue recovered */
    revenueRecovered: number;
    /** Campaign cost */
    campaignCost: number;
    /** ROI percentage */
    roi: number;
  };
}

/**
 * Cart abandonment analytics
 * @description Complete cart abandonment data for the BI dashboard
 */
export interface CartAbandonmentAnalytics {
  /** Date range for analysis */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  /** Summary metrics */
  summary: {
    /** Overall abandonment rate */
    abandonmentRate: number;
    /** Total abandoned carts */
    totalAbandonedCarts: number;
    /** Total value of abandoned carts */
    totalAbandonedValue: number;
    /** Average abandoned cart value */
    averageAbandonedCartValue: number;
    /** Change vs previous period */
    abandonmentRateChange: number;
    /** Recovery rate */
    recoveryRate: number;
    /** Total recovered value */
    totalRecoveredValue: number;
    /** Revenue recovered */
    revenueRecovered: number;
  };
  /** Abandonment by reason */
  reasonBreakdown: {
    reason: AbandonmentReason;
    labelEn: string;
    labelAr: string;
    count: number;
    percentage: number;
    averageCartValue: number;
  }[];
  /** Abandonment by stage */
  stageBreakdown: {
    stage: FunnelStageType;
    count: number;
    percentage: number;
    averageCartValue: number;
  }[];
  /** Abandonment by device */
  deviceBreakdown: {
    device: DeviceType;
    abandonmentRate: number;
    count: number;
    totalValue: number;
  }[];
  /** Recent abandoned carts (for real-time alerts) */
  recentAbandonedCarts: AbandonedCart[];
  /** Active recovery campaigns */
  activeCampaigns: RecoveryCampaign[];
  /** Abandonment trends over time */
  trends: {
    period: string;
    abandonmentRate: number;
    abandonedCarts: number;
    abandonedValue: number;
    recoveredCarts: number;
    recoveredValue: number;
  }[];
  /** Last updated timestamp */
  lastUpdated: string;
}

// =============================================================================
// COHORT ANALYSIS INTERFACES
// =============================================================================

/**
 * Cohort definition type
 * @description How cohorts are defined
 */
export type CohortDefinition =
  | 'first_purchase'
  | 'registration'
  | 'first_visit'
  | 'acquisition_channel';

/**
 * Retention metric type
 * @description What metric is being tracked for retention
 */
export type RetentionMetric = 'purchase' | 'visit' | 'engagement' | 'revenue';

/**
 * Single cohort data
 * @description Retention data for a single cohort
 */
export interface Cohort {
  /** Cohort identifier (e.g., "2024-01") */
  cohortId: string;
  /** Cohort label for display */
  label: string;
  /** Cohort start date */
  startDate: string;
  /** Cohort end date */
  endDate: string;
  /** Initial cohort size */
  initialSize: number;
  /** Retention by period (array of percentages) */
  retention: number[];
  /** Revenue by period */
  revenueByPeriod: number[];
  /** Average order value by period */
  aovByPeriod: number[];
  /** Cumulative revenue */
  cumulativeRevenue: number;
  /** Average customer value in cohort */
  averageCustomerValue: number;
}

/**
 * Behavior pattern data
 * @description Customer behavior patterns identified in cohort analysis
 */
export interface BehaviorPattern {
  /** Pattern identifier */
  patternId: string;
  /** Pattern name */
  name: string;
  /** Pattern description */
  description: string;
  /** Percentage of customers exhibiting pattern */
  customerPercentage: number;
  /** Impact on revenue */
  revenueImpact: number;
  /** Recommended action */
  recommendedAction: string;
  /** Pattern metrics */
  metrics: {
    averageOrderFrequency: number;
    averageOrderValue: number;
    preferredCategories: string[];
    preferredPaymentMethod: string;
    peakPurchaseTime: string;
  };
}

/**
 * Cohort analysis dashboard data
 * @description Complete cohort analysis for the BI dashboard
 */
export interface CohortAnalysis {
  /** Analysis date range */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  /** Cohort definition used */
  cohortDefinition: CohortDefinition;
  /** Retention metric tracked */
  retentionMetric: RetentionMetric;
  /** Period type for retention tracking */
  periodType: 'day' | 'week' | 'month';
  /** Summary metrics */
  summary: {
    /** Total cohorts analyzed */
    totalCohorts: number;
    /** Total customers across all cohorts */
    totalCustomers: number;
    /** Average week 1 retention */
    averageWeek1Retention: number;
    /** Average week 4 retention */
    averageWeek4Retention: number;
    /** Average week 8 retention */
    averageWeek8Retention: number;
    /** Average week 12 retention */
    averageWeek12Retention: number;
    /** Best performing cohort */
    bestCohort: {
      cohortId: string;
      label: string;
      week12Retention: number;
    };
    /** Worst performing cohort */
    worstCohort: {
      cohortId: string;
      label: string;
      week12Retention: number;
    };
    /** Retention trend (improving/declining/stable) */
    retentionTrend: 'improving' | 'declining' | 'stable';
    /** Total revenue from all cohorts */
    totalRevenue: number;
  };
  /** Individual cohort data */
  cohorts: Cohort[];
  /** Heatmap data for visualization */
  heatmapData: {
    cohortId: string;
    cohortLabel: string;
    periods: {
      periodIndex: number;
      periodLabel: string;
      retentionRate: number;
      customerCount: number;
      revenue: number;
    }[];
  }[];
  /** Behavior patterns identified */
  behaviorPatterns: BehaviorPattern[];
  /** Lifecycle stage distribution */
  lifecycleStages: {
    stage: 'new' | 'active' | 'at_risk' | 'dormant' | 'churned';
    labelEn: string;
    labelAr: string;
    count: number;
    percentage: number;
    averageValue: number;
  }[];
  /** Last updated timestamp */
  lastUpdated: string;
}

// =============================================================================
// DASHBOARD COMPOSITE INTERFACES
// =============================================================================

/**
 * Quick insight card data
 * @description Data for quick insight carousel cards
 */
export interface QuickInsight {
  /** Insight unique identifier */
  id: string;
  /** Insight type */
  type: 'clv' | 'funnel' | 'abandonment' | 'cohort' | 'alert' | 'recommendation';
  /** Priority level (1-5, 1 being highest) */
  priority: number;
  /** Insight title */
  titleEn: string;
  titleAr: string;
  /** Insight description */
  descriptionEn: string;
  descriptionAr: string;
  /** Primary metric value */
  metricValue: number | string;
  /** Metric label */
  metricLabel: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend percentage */
  trendPercentage?: number;
  /** Action button label */
  actionLabelEn?: string;
  actionLabelAr?: string;
  /** Action route */
  actionRoute?: string;
  /** Icon name */
  icon: string;
  /** Card color theme */
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Timestamp */
  timestamp: string;
}

/**
 * BI Dashboard hero metrics
 * @description Key metrics displayed in the hero section
 */
export interface BIDashboardHeroMetrics {
  /** Total revenue impact (CLV * Customer Count) */
  totalRevenueImpact: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  /** Overall conversion rate */
  conversionRate: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  /** Cart abandonment rate */
  abandonmentRate: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'neutral';
  };
  /** Active customer segments count */
  activeSegments: {
    value: number;
    highValueCount: number;
    atRiskCount: number;
  };
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Complete BI Dashboard data
 * @description All data required for the BI Dashboard
 */
export interface BIDashboardData {
  /** Hero metrics */
  heroMetrics: BIDashboardHeroMetrics;
  /** Quick insights for carousel */
  quickInsights: QuickInsight[];
  /** CLV analytics */
  clvAnalytics: CLVAnalytics;
  /** Conversion funnel analytics */
  conversionFunnel: ConversionFunnelAnalytics;
  /** Cart abandonment analytics */
  cartAbandonment: CartAbandonmentAnalytics;
  /** Cohort analysis */
  cohortAnalysis: CohortAnalysis;
  /** Dashboard loading states */
  loadingStates: {
    heroMetrics: boolean;
    quickInsights: boolean;
    clvAnalytics: boolean;
    conversionFunnel: boolean;
    cartAbandonment: boolean;
    cohortAnalysis: boolean;
  };
  /** Last full refresh timestamp */
  lastFullRefresh: string;
}

// =============================================================================
// FILTER & QUERY INTERFACES
// =============================================================================

/**
 * BI Dashboard filter options
 * @description Filters available for BI Dashboard data
 */
export interface BIDashboardFilters {
  /** Date range filter */
  dateRange: {
    startDate: string;
    endDate: string;
    preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'this_year' | 'custom';
  };
  /** Customer segment filter */
  segments?: CustomerSegment[];
  /** Device type filter */
  devices?: DeviceType[];
  /** Minimum CLV filter */
  minCLV?: number;
  /** Maximum CLV filter */
  maxCLV?: number;
  /** Compare with previous period */
  compareWithPrevious?: boolean;
}

/**
 * Export configuration for BI data
 * @description Configuration for exporting BI dashboard data
 */
export interface BIExportConfig {
  /** Data sections to export (mutable or readonly) */
  sections: ('clv' | 'funnel' | 'abandonment' | 'cohort' | 'all')[]
    | readonly ('clv' | 'funnel' | 'abandonment' | 'cohort' | 'all')[];
  /** Export format */
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  /** Date range */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  /** Include charts as images */
  includeCharts?: boolean;
  /** Include recommendations */
  includeRecommendations?: boolean;
}

// =============================================================================
// SEGMENT CONFIGURATION CONSTANTS
// =============================================================================

/**
 * Customer segment configurations
 * @description Static configuration for customer segment display and actions
 */
export const CUSTOMER_SEGMENT_CONFIGS: CustomerSegmentConfig[] = [
  {
    segment: 'champion',
    labelEn: 'Champions',
    labelAr: 'الأبطال',
    color: '#047857',
    icon: 'emoji_events',
    recommendedAction: 'Offer exclusive rewards and early access to new products'
  },
  {
    segment: 'loyal',
    labelEn: 'Loyal Customers',
    labelAr: 'العملاء المخلصون',
    color: '#10b981',
    icon: 'favorite',
    recommendedAction: 'Upsell higher value products and request referrals'
  },
  {
    segment: 'potential_loyalist',
    labelEn: 'Potential Loyalists',
    labelAr: 'محتملون للولاء',
    color: '#3b82f6',
    icon: 'trending_up',
    recommendedAction: 'Engage with loyalty programs and personalized recommendations'
  },
  {
    segment: 'new_customer',
    labelEn: 'New Customers',
    labelAr: 'عملاء جدد',
    color: '#6366f1',
    icon: 'person_add',
    recommendedAction: 'Send welcome series and first-purchase discounts'
  },
  {
    segment: 'promising',
    labelEn: 'Promising',
    labelAr: 'واعدون',
    color: '#8b5cf6',
    icon: 'star_outline',
    recommendedAction: 'Nurture with targeted content and special offers'
  },
  {
    segment: 'needs_attention',
    labelEn: 'Needs Attention',
    labelAr: 'يحتاجون اهتماماً',
    color: '#f59e0b',
    icon: 'notifications_active',
    recommendedAction: 'Re-engage with personalized win-back campaigns'
  },
  {
    segment: 'about_to_sleep',
    labelEn: 'About to Sleep',
    labelAr: 'على وشك النوم',
    color: '#f97316',
    icon: 'bedtime',
    recommendedAction: 'Send time-limited offers to reactivate'
  },
  {
    segment: 'at_risk',
    labelEn: 'At Risk',
    labelAr: 'معرضون للخطر',
    color: '#ef4444',
    icon: 'warning',
    recommendedAction: 'Immediate outreach with significant incentives'
  },
  {
    segment: 'cant_lose',
    labelEn: "Can't Lose",
    labelAr: 'لا يمكن خسارتهم',
    color: '#dc2626',
    icon: 'priority_high',
    recommendedAction: 'Personal outreach and exclusive recovery offers'
  },
  {
    segment: 'hibernating',
    labelEn: 'Hibernating',
    labelAr: 'نائمون',
    color: '#9ca3af',
    icon: 'hotel',
    recommendedAction: 'Periodic re-engagement with new product announcements'
  },
  {
    segment: 'lost',
    labelEn: 'Lost',
    labelAr: 'مفقودون',
    color: '#6b7280',
    icon: 'person_off',
    recommendedAction: 'Consider for win-back campaigns with deep discounts'
  }
];

/**
 * Abandonment reason configurations
 * @description Display labels for cart abandonment reasons
 */
export const ABANDONMENT_REASON_LABELS: Record<AbandonmentReason, { en: string; ar: string }> = {
  high_shipping_cost: { en: 'High Shipping Cost', ar: 'تكلفة شحن مرتفعة' },
  unexpected_costs: { en: 'Unexpected Costs', ar: 'تكاليف غير متوقعة' },
  account_required: { en: 'Account Required', ar: 'مطلوب إنشاء حساب' },
  complex_checkout: { en: 'Complex Checkout', ar: 'عملية دفع معقدة' },
  payment_issues: { en: 'Payment Issues', ar: 'مشاكل في الدفع' },
  security_concerns: { en: 'Security Concerns', ar: 'مخاوف أمنية' },
  comparison_shopping: { en: 'Comparison Shopping', ar: 'مقارنة الأسعار' },
  just_browsing: { en: 'Just Browsing', ar: 'تصفح فقط' },
  found_better_price: { en: 'Found Better Price', ar: 'وجد سعراً أفضل' },
  technical_issues: { en: 'Technical Issues', ar: 'مشاكل تقنية' },
  delivery_time_too_long: { en: 'Delivery Time Too Long', ar: 'وقت توصيل طويل' },
  other: { en: 'Other', ar: 'أخرى' },
  unknown: { en: 'Unknown', ar: 'غير معروف' }
};

/**
 * Funnel stage labels
 * @description Display labels for conversion funnel stages
 */
export const FUNNEL_STAGE_LABELS: Record<FunnelStageType, { en: string; ar: string; icon: string }> = {
  page_view: { en: 'Page Views', ar: 'مشاهدات الصفحة', icon: 'visibility' },
  product_view: { en: 'Product Views', ar: 'مشاهدات المنتج', icon: 'inventory_2' },
  add_to_cart: { en: 'Add to Cart', ar: 'إضافة للسلة', icon: 'add_shopping_cart' },
  begin_checkout: { en: 'Begin Checkout', ar: 'بدء الدفع', icon: 'shopping_cart_checkout' },
  add_payment_info: { en: 'Add Payment', ar: 'إضافة الدفع', icon: 'payment' },
  purchase: { en: 'Purchase', ar: 'شراء', icon: 'check_circle' }
};

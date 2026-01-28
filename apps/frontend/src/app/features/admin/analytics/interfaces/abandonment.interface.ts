/**
 * @file abandonment.interface.ts
 * @description Cart abandonment analytics data interfaces.
 *              Defines types for abandonment tracking, recovery campaigns, and reason analysis.
 * @module AdminAnalytics/Interfaces
 */

/**
 * Cart abandonment reason categories
 * @description Common reasons why customers abandon carts
 */
export type AbandonmentReason =
  | 'HIGH_SHIPPING_COST'
  | 'UNEXPECTED_COSTS'
  | 'ACCOUNT_CREATION_REQUIRED'
  | 'PAYMENT_CONCERNS'
  | 'COMPLEX_CHECKOUT'
  | 'BROWSING_ONLY'
  | 'FOUND_BETTER_PRICE'
  | 'OUT_OF_STOCK'
  | 'TECHNICAL_ISSUE'
  | 'OTHER'
  | 'UNKNOWN';

/**
 * Recovery campaign status
 */
export type RecoveryCampaignStatus = 'active' | 'paused' | 'completed' | 'scheduled';

/**
 * Cart Abandonment Summary
 * @description Overall cart abandonment metrics
 *
 * @swagger
 * components:
 *   schemas:
 *     CartAbandonmentSummary:
 *       type: object
 *       required:
 *         - abandonmentRate
 *         - totalAbandoned
 *         - potentialRevenueLost
 *         - averageCartValue
 */
export interface CartAbandonmentSummary {
  /** Overall abandonment rate as percentage (0-100) */
  abandonmentRate: number;

  /** Total number of abandoned carts */
  totalAbandoned: number;

  /** Number of abandoned carts with items */
  cartsWithItems: number;

  /** Total potential revenue lost (SYP) */
  potentialRevenueLost: number;

  /** Average value of abandoned carts (SYP) */
  averageCartValue: number;

  /** Number of carts recovered */
  cartsRecovered: number;

  /** Recovery rate as percentage */
  recoveryRate: number;

  /** Revenue recovered through campaigns (SYP) */
  revenueRecovered: number;

  /** Trend vs previous period (%) */
  trend: number;

  /** Industry benchmark rate (%) for comparison */
  industryBenchmark?: number;

  /** Date range for metrics */
  dateRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Abandoned Cart Detail
 * @description Detailed information about a single abandoned cart
 *
 * @swagger
 * components:
 *   schemas:
 *     AbandonedCartDetail:
 *       type: object
 *       required:
 *         - cartId
 *         - customerId
 *         - abandonedAt
 *         - cartValue
 *         - itemCount
 */
export interface AbandonedCartDetail {
  /** Unique cart identifier */
  cartId: string;

  /** Customer ID */
  customerId: number;

  /** Customer name */
  customerName: string;

  /** Customer email */
  customerEmail: string;

  /** Customer phone (for SMS recovery) */
  customerPhone?: string;

  /** When cart was abandoned */
  abandonedAt: Date;

  /** Total cart value (SYP) */
  cartValue: number;

  /** Number of items in cart */
  itemCount: number;

  /** Cart items summary */
  items: AbandonedCartItem[];

  /** Last stage reached in checkout */
  lastStage: string;

  /** Device used */
  device: 'mobile' | 'tablet' | 'desktop';

  /** Customer location */
  location?: string;

  /** Whether recovery email was sent */
  recoveryEmailSent: boolean;

  /** Whether cart was recovered */
  recovered: boolean;

  /** Order ID if recovered */
  recoveredOrderId?: number;

  /** Recovery date if recovered */
  recoveredAt?: Date;

  /** Inferred/tracked abandonment reason */
  reason?: AbandonmentReason;

  /** Time spent in checkout (seconds) */
  timeInCheckout?: number;

  /** Whether customer is returning */
  isReturningCustomer: boolean;

  /** Customer's previous order count */
  previousOrders?: number;
}

/**
 * Abandoned Cart Item
 * @description Single product in an abandoned cart
 */
export interface AbandonedCartItem {
  /** Product ID */
  productId: number;

  /** Product name */
  productName: string;

  /** Product image URL */
  imageUrl?: string;

  /** Quantity in cart */
  quantity: number;

  /** Price per unit (SYP) */
  unitPrice: number;

  /** Total price for this item (SYP) */
  totalPrice: number;

  /** Whether product is still in stock */
  inStock: boolean;

  /** Current price (may differ from cart price) */
  currentPrice?: number;
}

/**
 * Abandonment Rate Timeline
 * @description Time series data for abandonment rate trends
 */
export interface AbandonmentRateDataPoint {
  /** Date label */
  date: string;

  /** Abandonment rate (%) */
  abandonmentRate: number;

  /** Total carts abandoned */
  abandonedCount: number;

  /** Carts recovered */
  recoveredCount: number;

  /** Recovery rate (%) */
  recoveryRate: number;

  /** Potential revenue lost (SYP) */
  potentialRevenue: number;

  /** Revenue recovered (SYP) */
  recoveredRevenue: number;
}

/**
 * Recovery Campaign Performance
 * @description Metrics for cart recovery email/SMS campaigns
 *
 * @swagger
 * components:
 *   schemas:
 *     RecoveryCampaignPerformance:
 *       type: object
 *       required:
 *         - campaignId
 *         - campaignName
 *         - status
 *         - emailsSent
 *         - emailsOpened
 *         - clickThroughRate
 *         - recoveryRate
 */
export interface RecoveryCampaignPerformance {
  /** Unique campaign identifier */
  campaignId: string;

  /** Campaign name */
  campaignName: string;

  /** Campaign status */
  status: RecoveryCampaignStatus;

  /** Campaign type */
  type: 'email' | 'sms' | 'push' | 'multi-channel';

  /** Total emails/messages sent */
  messagesSent: number;

  /** Messages opened */
  messagesOpened: number;

  /** Open rate (%) */
  openRate: number;

  /** Clicks on recovery link */
  clicks: number;

  /** Click-through rate (%) */
  clickThroughRate: number;

  /** Carts recovered through campaign */
  cartsRecovered: number;

  /** Campaign recovery rate (%) */
  recoveryRate: number;

  /** Revenue recovered (SYP) */
  revenueRecovered: number;

  /** Cost of campaign (SYP) */
  campaignCost?: number;

  /** Return on investment */
  roi?: number;

  /** Average time to recovery (hours) */
  averageTimeToRecovery?: number;

  /** Campaign start date */
  startDate: Date;

  /** Campaign end date */
  endDate?: Date;

  /** Target audience criteria */
  targetCriteria?: string;
}

/**
 * Abandonment Reason Analysis
 * @description Breakdown of why customers abandon carts
 */
export interface AbandonmentReasonAnalysis {
  /** Abandonment reason */
  reason: AbandonmentReason;

  /** Display name for reason */
  displayName: string;

  /** Number of occurrences */
  count: number;

  /** Percentage of total abandonments */
  percentage: number;

  /** Average cart value for this reason (SYP) */
  averageCartValue: number;

  /** Total potential revenue (SYP) */
  totalPotentialRevenue: number;

  /** Recovery rate for this reason (%) */
  recoveryRate: number;

  /** Recommended action to address */
  recommendation?: string;

  /** Priority for addressing (1-10) */
  priority?: number;
}

/**
 * Real-time Abandoned Cart Alert
 * @description Live notification for high-value cart abandonments
 */
export interface AbandonedCartAlert {
  /** Alert ID */
  alertId: string;

  /** Cart ID */
  cartId: string;

  /** Customer name */
  customerName: string;

  /** Customer email */
  customerEmail: string;

  /** Cart value (SYP) */
  cartValue: number;

  /** Number of items */
  itemCount: number;

  /** When abandoned (timestamp) */
  abandonedAt: Date;

  /** Alert severity based on cart value */
  severity: 'high' | 'medium' | 'low';

  /** Whether customer is VIP */
  isVIP: boolean;

  /** Suggested recovery action */
  suggestedAction?: string;

  /** Time since abandonment (minutes) */
  timeSinceAbandonment: number;
}

/**
 * Recovery Email Template
 * @description Email template configuration for cart recovery
 */
export interface RecoveryEmailTemplate {
  /** Template ID */
  templateId: string;

  /** Template name */
  templateName: string;

  /** Email subject line */
  subject: string;

  /** Email body (HTML or plain text) */
  body: string;

  /** Delay before sending (hours) */
  sendDelay: number;

  /** Whether to include discount */
  includeDiscount: boolean;

  /** Discount percentage if applicable */
  discountPercentage?: number;

  /** Template language */
  language: 'ar' | 'en';

  /** A/B test variant */
  variant?: 'A' | 'B';

  /** Performance metrics for this template */
  performance?: {
    sent: number;
    opened: number;
    clicked: number;
    recovered: number;
    openRate: number;
    recoveryRate: number;
  };
}

/**
 * Cart Abandonment Filter Options
 * @description Query parameters for filtering abandonment data
 */
export interface AbandonmentFilterOptions {
  /** Start date */
  startDate?: Date;

  /** End date */
  endDate?: Date;

  /** Minimum cart value (SYP) */
  minCartValue?: number;

  /** Maximum cart value (SYP) */
  maxCartValue?: number;

  /** Filter by device */
  device?: 'mobile' | 'tablet' | 'desktop';

  /** Filter by recovery status */
  recovered?: boolean;

  /** Filter by reason */
  reason?: AbandonmentReason;

  /** Filter by customer segment */
  customerSegment?: string;

  /** Include only VIP customers */
  vipOnly?: boolean;

  /** Sort field */
  sortBy?: 'abandonedAt' | 'cartValue' | 'itemCount';

  /** Sort direction */
  sortDirection?: 'asc' | 'desc';

  /** Page number */
  page?: number;

  /** Page size */
  pageSize?: number;
}

/**
 * Cart Recovery Statistics
 * @description Statistical analysis of recovery effectiveness
 */
export interface CartRecoveryStatistics {
  /** Total recovery attempts */
  totalAttempts: number;

  /** Successful recoveries */
  successfulRecoveries: number;

  /** Overall success rate (%) */
  successRate: number;

  /** Average time to recovery (hours) */
  averageTimeToRecovery: number;

  /** Fastest recovery time (minutes) */
  fastestRecovery: number;

  /** Recovery by channel */
  byChannel: {
    email: number;
    sms: number;
    push: number;
  };

  /** Recovery by time window */
  byTimeWindow: {
    within1Hour: number;
    within24Hours: number;
    within1Week: number;
    after1Week: number;
  };

  /** Total revenue recovered (SYP) */
  totalRevenueRecovered: number;

  /** Average recovered cart value (SYP) */
  averageRecoveredValue: number;
}

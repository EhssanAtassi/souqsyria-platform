/**
 * @file core.types.ts
 * @description Core business intelligence type definitions and branded types
 * @module BusinessIntelligence/Types
 * 
 * This file contains foundational type definitions for the Business Intelligence system,
 * including branded types for domain concepts and core utility types.
 * 
 * @author SouqSyria Development Team
 * @since 2025-01-22
 */

// =============================================================================
// BRANDED TYPES FOR DOMAIN CONCEPTS
// =============================================================================

/**
 * Branded type utilities to prevent mixing different ID types
 */
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

/**
 * User identification types
 */
export type UserId = Brand<number, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type CustomerSegmentId = Brand<string, 'CustomerSegmentId'>;

/**
 * Business entity identification types
 */
export type ProductId = Brand<number, 'ProductId'>;
export type CategoryId = Brand<number, 'CategoryId'>;
export type VendorId = Brand<number, 'VendorId'>;
export type OrderId = Brand<number, 'OrderId'>;
export type CartId = Brand<string, 'CartId'>;

/**
 * Analytics identification types
 */
export type EventId = Brand<string, 'EventId'>;
export type CohortId = Brand<string, 'CohortId'>;
export type FunnelId = Brand<string, 'FunnelId'>;
export type CampaignId = Brand<string, 'CampaignId'>;

/**
 * Temporal identification types
 */
export type TimeframeId = Brand<string, 'TimeframeId'>;
export type PeriodId = Brand<string, 'PeriodId'>;

// =============================================================================
// CORE VALUE TYPES
// =============================================================================

/**
 * Monetary value in Syrian Pounds (SYP)
 */
export type MonetaryValue = Brand<number, 'MonetaryValue'>;

/**
 * Percentage value (0-100)
 */
export type PercentageValue = Brand<number, 'PercentageValue'>;

/**
 * Rate value (0-1)
 */
export type RateValue = Brand<number, 'RateValue'>;

/**
 * Count/quantity value
 */
export type CountValue = Brand<number, 'CountValue'>;

/**
 * Score value (typically 0-100 or 0-1000)
 */
export type ScoreValue = Brand<number, 'ScoreValue'>;

// =============================================================================
// TEMPORAL TYPES
// =============================================================================

/**
 * Business Intelligence time periods
 */
export enum BIPeriodType {
  HOUR = 'hour',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Date range configuration for BI queries
 */
export interface BIDateRange {
  /** Start date in ISO string format */
  readonly startDate: string;
  /** End date in ISO string format */
  readonly endDate: string;
  /** Time zone identifier (e.g., 'Asia/Damascus') */
  readonly timeZone: string;
  /** Period type for aggregation */
  readonly period: BIPeriodType;
}

/**
 * Comparison period for BI analytics
 */
export interface ComparisonPeriod {
  /** Current period date range */
  readonly current: BIDateRange;
  /** Previous period for comparison */
  readonly previous: BIDateRange;
  /** Type of comparison (same period last year, previous period, etc.) */
  readonly comparisonType: 'previous_period' | 'same_period_last_year' | 'custom';
}

// =============================================================================
// GEOGRAPHIC AND DEMOGRAPHIC TYPES
// =============================================================================

/**
 * Geographic location for analytics
 */
export interface GeographicLocation {
  /** Country code (ISO 3166-1 alpha-2) */
  readonly countryCode: string;
  /** Region/state/province */
  readonly region?: string;
  /** City name */
  readonly city?: string;
  /** Postal/ZIP code */
  readonly postalCode?: string;
}

/**
 * Customer demographic information
 */
export interface CustomerDemographics {
  /** Age range bucket */
  readonly ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  /** Gender */
  readonly gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  /** Geographic location */
  readonly location?: GeographicLocation;
  /** Acquisition channel */
  readonly acquisitionChannel?: string;
}

// =============================================================================
// DEVICE AND SESSION TYPES
// =============================================================================

/**
 * Device type enumeration
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
  UNKNOWN = 'unknown',
}

/**
 * Browser information
 */
export interface BrowserInfo {
  /** Browser name */
  readonly name: string;
  /** Browser version */
  readonly version: string;
  /** Operating system */
  readonly os: string;
  /** Device type */
  readonly deviceType: DeviceType;
}

/**
 * Session context for analytics
 */
export interface SessionContext {
  /** Session identifier */
  readonly sessionId: SessionId;
  /** User ID (if authenticated) */
  readonly userId?: UserId;
  /** Browser and device information */
  readonly browser: BrowserInfo;
  /** Session start time */
  readonly startTime: Date;
  /** Last activity time */
  readonly lastActivity: Date;
  /** UTM parameters */
  readonly utmParams?: UtmParameters;
  /** Referrer information */
  readonly referrer?: string;
}

/**
 * UTM tracking parameters
 */
export interface UtmParameters {
  /** Campaign source */
  readonly source?: string;
  /** Campaign medium */
  readonly medium?: string;
  /** Campaign name */
  readonly campaign?: string;
  /** Campaign term */
  readonly term?: string;
  /** Campaign content */
  readonly content?: string;
}

// =============================================================================
// AGGREGATION AND STATISTICS TYPES
// =============================================================================

/**
 * Statistical aggregation types
 */
export enum AggregationType {
  SUM = 'sum',
  COUNT = 'count',
  AVERAGE = 'average',
  MEDIAN = 'median',
  MIN = 'min',
  MAX = 'max',
  PERCENTILE = 'percentile',
  DISTINCT_COUNT = 'distinct_count',
}

/**
 * Metric change comparison
 */
export interface MetricChange {
  /** Current period value */
  readonly currentValue: number;
  /** Previous period value */
  readonly previousValue: number;
  /** Absolute change */
  readonly absoluteChange: number;
  /** Percentage change */
  readonly percentageChange: PercentageValue;
  /** Trend direction */
  readonly trend: 'up' | 'down' | 'stable';
  /** Whether the change is statistically significant */
  readonly isSignificant: boolean;
}

/**
 * Time series data point
 */
export interface TimeSeriesDataPoint {
  /** Timestamp for this data point */
  readonly timestamp: Date;
  /** Metric value */
  readonly value: number;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Time series data structure
 */
export interface TimeSeries {
  /** Data points array */
  readonly data: readonly TimeSeriesDataPoint[];
  /** Metric name */
  readonly metricName: string;
  /** Aggregation period */
  readonly period: BIPeriodType;
  /** Data range */
  readonly dateRange: BIDateRange;
}

// =============================================================================
// ERROR AND VALIDATION TYPES
// =============================================================================

/**
 * Business Intelligence error codes
 */
export enum BIErrorCode {
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * BI operation result wrapper
 */
export type BIResult<T> = {
  readonly success: true;
  readonly data: T;
  readonly metadata?: Record<string, unknown>;
} | {
  readonly success: false;
  readonly errorCode: BIErrorCode;
  readonly errorMessage: string;
  readonly details?: Record<string, unknown>;
};

// =============================================================================
// UTILITY TYPE HELPERS
// =============================================================================

/**
 * Makes all properties of an object readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Creates a type with optional keys while preserving exact typing
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Creates branded constructor functions
 */
export const createBrand = <T, TBrand>(value: T): Brand<T, TBrand> => value as Brand<T, TBrand>;

// =============================================================================
// BRANDED TYPE CONSTRUCTOR UTILITIES
// =============================================================================

export const UserId = {
  from: (value: number): UserId => createBrand<number, 'UserId'>(value),
  is: (value: unknown): value is UserId => typeof value === 'number' && value > 0,
};

export const SessionId = {
  from: (value: string): SessionId => createBrand<string, 'SessionId'>(value),
  is: (value: unknown): value is SessionId => typeof value === 'string' && value.length > 0,
};

export const MonetaryValue = {
  from: (value: number): MonetaryValue => {
    if (value < 0) throw new Error('MonetaryValue cannot be negative');
    return createBrand<number, 'MonetaryValue'>(value);
  },
  is: (value: unknown): value is MonetaryValue => typeof value === 'number' && value >= 0,
};

export const PercentageValue = {
  from: (value: number): PercentageValue => {
    if (value < 0 || value > 100) throw new Error('PercentageValue must be between 0 and 100');
    return createBrand<number, 'PercentageValue'>(value);
  },
  is: (value: unknown): value is PercentageValue => 
    typeof value === 'number' && value >= 0 && value <= 100,
};

export const RateValue = {
  from: (value: number): RateValue => {
    if (value < 0 || value > 1) throw new Error('RateValue must be between 0 and 1');
    return createBrand<number, 'RateValue'>(value);
  },
  is: (value: unknown): value is RateValue => 
    typeof value === 'number' && value >= 0 && value <= 1,
};
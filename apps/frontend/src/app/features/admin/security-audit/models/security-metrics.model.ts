/**
 * Security Metrics Models
 * Defines data structures for security analytics and reporting
 *
 * @module SecurityMetricsModel
 */

import { SecurityAuditAction, SecurityAuditEvent } from './security-audit-event.model';

/**
 * Comprehensive security metrics for dashboard overview
 * Provides high-level statistics and trends for security monitoring
 *
 * @interface SecurityMetrics
 */
export interface SecurityMetrics {
  /** Total number of audit events in the last 24 hours */
  totalEvents24h: number;

  /** Number of failed access attempts in the last 24 hours */
  failedAttempts24h: number;

  /** Count of active suspicious activity alerts */
  suspiciousActivityCount: number;

  /** Number of unique users active in the last 24 hours */
  uniqueUsers24h: number;

  /** Top permissions that were most frequently denied */
  topDeniedPermissions: PermissionDenialStat[];

  /** Users with the most access denials */
  topDeniedUsers: UserDenialStat[];

  /** Time-series data showing event counts over time */
  eventsOverTime: TimeSeriesDataPoint[];

  /** Percentage of failed attempts out of total attempts in 24h */
  failureRate24h: number;

  /** Timestamp when these metrics were last calculated */
  lastUpdated: Date;
}

/**
 * Statistics about a specific permission being denied
 * Used to identify which permissions are most problematic
 *
 * @interface PermissionDenialStat
 */
export interface PermissionDenialStat {
  /** Permission identifier (e.g., 'orders:delete', 'users:ban') */
  permission: string;

  /** Number of times this permission was denied */
  count: number;

  /** Percentage of total denials this represents */
  percentage: number;
}

/**
 * Statistics about a specific user's access denials
 * Used to identify users who may need training or have suspicious activity
 *
 * @interface UserDenialStat
 */
export interface UserDenialStat {
  /** User's unique identifier */
  userId: number;

  /** User's email address */
  email: string;

  /** User's display name */
  userName: string;

  /** Number of access denials for this user */
  count: number;

  /** Timestamp of the most recent denial */
  lastAttemptAt: Date;
}

/**
 * Single data point in a time series
 * Used for charting events over time
 *
 * @interface TimeSeriesDataPoint
 */
export interface TimeSeriesDataPoint {
  /** Timestamp for this data point */
  timestamp: Date;

  /** Count of events at this time point */
  count: number;

  /** Human-readable label for chart axis (e.g., '10:00 AM', 'Jan 15') */
  label: string;
}

/**
 * Comprehensive daily security report
 * Provides detailed analysis of security events for a specific day
 *
 * @interface DailySecurityReport
 */
export interface DailySecurityReport {
  /** Date this report covers */
  date: Date;

  /** High-level summary statistics */
  summary: {
    /** Total events recorded */
    totalEvents: number;

    /** Number of failed access attempts */
    failedAttempts: number;

    /** Number of suspicious activity alerts generated */
    suspiciousAlerts: number;

    /** Number of unique users who performed actions */
    uniqueUsers: number;
  };

  /** Most common actions performed this day */
  topActions: Array<{
    /** Action type */
    action: SecurityAuditAction;

    /** Number of times this action occurred */
    count: number;
  }>;

  /** Most accessed resource types */
  topResources: Array<{
    /** Resource type (e.g., 'Product', 'Order') */
    resourceType: string;

    /** Number of accesses to this resource type */
    count: number;
  }>;

  /** Distribution of events by hour of day */
  hourlyDistribution: Array<{
    /** Hour of day (0-23) */
    hour: number;

    /** Number of events in this hour */
    count: number;
  }>;

  /** List of critical security events that occurred */
  criticalEvents: SecurityAuditEvent[];
}

/**
 * Options for generating time-series data
 *
 * @interface TimeSeriesOptions
 */
export interface TimeSeriesOptions {
  /** Start of the time range */
  startDate: Date;

  /** End of the time range */
  endDate: Date;

  /** Interval for data points ('hour' or 'day') */
  interval: 'hour' | 'day';

  /** Optional filter by action type */
  action?: SecurityAuditAction;

  /** Optional filter by success status */
  success?: boolean;
}

/**
 * Helper to calculate failure rate percentage
 *
 * @param failedCount - Number of failed attempts
 * @param totalCount - Total number of attempts
 * @returns Failure rate as percentage (0-100)
 */
export function calculateFailureRate(failedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((failedCount / totalCount) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Helper to format time series label based on interval
 *
 * @param date - Date to format
 * @param interval - Time interval ('hour' or 'day')
 * @returns Formatted label string
 */
export function formatTimeSeriesLabel(date: Date, interval: 'hour' | 'day'): string {
  if (interval === 'hour') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Helper to determine if metrics are stale and need refresh
 *
 * @param lastUpdated - When metrics were last updated
 * @param maxAgeMinutes - Maximum age in minutes before considering stale (default: 5)
 * @returns True if metrics should be refreshed
 */
export function areMetricsStale(lastUpdated: Date, maxAgeMinutes: number = 5): boolean {
  const now = new Date();
  const ageMs = now.getTime() - new Date(lastUpdated).getTime();
  const ageMinutes = ageMs / (1000 * 60);
  return ageMinutes > maxAgeMinutes;
}

/**
 * Helper to identify critical events based on criteria
 *
 * @param events - List of audit events
 * @returns Events that meet critical criteria
 */
export function identifyCriticalEvents(events: SecurityAuditEvent[]): SecurityAuditEvent[] {
  return events.filter(
    (event) =>
      !event.success ||
      event.action === SecurityAuditAction.USER_BANNED ||
      event.action === SecurityAuditAction.USER_SUSPENDED ||
      event.action === SecurityAuditAction.PERMISSION_MODIFIED ||
      event.action === SecurityAuditAction.ROLE_MODIFIED
  );
}

/**
 * Suspicious Activity Models
 * Defines data structures for detecting and managing suspicious security activities
 *
 * @module SuspiciousActivityModel
 */

/**
 * Severity levels for security alerts
 * Used to prioritize and categorize suspicious activities
 *
 * @typedef {('low' | 'medium' | 'high' | 'critical')} SeverityLevel
 */
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Types of suspicious activity patterns that can be detected
 *
 * @typedef {('RAPID_FAILURES' | 'MULTI_IP' | 'AFTER_HOURS' | 'PRIVILEGE_ESCALATION' | 'UNUSUAL_PATTERN')} AlertType
 */
export type AlertType =
  | 'RAPID_FAILURES'        // Multiple failed attempts in short time
  | 'MULTI_IP'              // Access from multiple IP addresses
  | 'AFTER_HOURS'           // Access during unusual hours
  | 'PRIVILEGE_ESCALATION'  // Attempts to access elevated permissions
  | 'UNUSUAL_PATTERN';      // Deviation from normal behavior

/**
 * Represents a detected suspicious activity alert
 * Created when the system detects patterns indicating potential security threats
 *
 * @interface SuspiciousActivityAlert
 */
export interface SuspiciousActivityAlert {
  /** Unique identifier for the alert */
  id: string;

  /** ID of the user associated with this alert (null for system-wide alerts) */
  userId: number | null;

  /** Email of the user if available */
  userEmail?: string;

  /** Severity level of this alert */
  severity: SeverityLevel;

  /** Type of suspicious activity detected */
  type: AlertType;

  /** Short title describing the alert */
  title: string;

  /** Detailed description of what was detected */
  description: string;

  /** Number of related events that triggered this alert */
  eventCount: number;

  /** IDs of audit events related to this alert */
  relatedEventIds: number[];

  /** Timestamp of the first event in this alert pattern */
  firstEventAt: Date;

  /** Timestamp of the most recent event in this alert pattern */
  lastEventAt: Date;

  /** Whether this alert has been reviewed and resolved */
  resolved: boolean;

  /** When the alert was marked as resolved */
  resolvedAt?: Date;

  /** ID of the admin who resolved the alert */
  resolvedBy?: number;

  /** Notes added when resolving the alert */
  notes?: string;
}

/**
 * Statistics about suspicious activity alerts
 * Provides overview of alert distribution and status
 *
 * @interface AlertStatistics
 */
export interface AlertStatistics {
  /** Total number of alerts in the system */
  totalAlerts: number;

  /** Number of alerts that haven't been resolved yet */
  unresolvedAlerts: number;

  /** Breakdown of alerts by severity level */
  bySeverity: Record<SeverityLevel, number>;

  /** Breakdown of alerts by type */
  byType: Record<AlertType, number>;
}

/**
 * Helper to get human-readable label for alert type
 *
 * @param type - Alert type
 * @returns Human-readable label
 */
export function getAlertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    RAPID_FAILURES: 'Rapid Failures',
    MULTI_IP: 'Multiple IP Addresses',
    AFTER_HOURS: 'After Hours Access',
    PRIVILEGE_ESCALATION: 'Privilege Escalation',
    UNUSUAL_PATTERN: 'Unusual Pattern',
  };

  return labels[type] || type;
}

/**
 * Helper to get human-readable label for severity level
 *
 * @param severity - Severity level
 * @returns Human-readable label
 */
export function getSeverityLabel(severity: SeverityLevel): string {
  const labels: Record<SeverityLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  return labels[severity] || severity;
}

/**
 * Helper to get severity color for UI display
 *
 * @param severity - Severity level
 * @returns Material color name
 */
export function getSeverityColor(severity: SeverityLevel): string {
  const colors: Record<SeverityLevel, string> = {
    low: 'accent',
    medium: 'primary',
    high: 'warn',
    critical: 'warn',
  };

  return colors[severity] || 'primary';
}

/**
 * Helper to get severity order for sorting (higher number = more severe)
 *
 * @param severity - Severity level
 * @returns Numeric order value
 */
export function getSeverityOrder(severity: SeverityLevel): number {
  const order: Record<SeverityLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return order[severity] || 0;
}

/**
 * Helper to determine if an alert requires immediate attention
 *
 * @param alert - Suspicious activity alert
 * @returns True if alert is unresolved and high/critical severity
 */
export function requiresImmediateAttention(alert: SuspiciousActivityAlert): boolean {
  return !alert.resolved && (alert.severity === 'high' || alert.severity === 'critical');
}

/**
 * Helper to calculate alert age in hours
 *
 * @param alert - Suspicious activity alert
 * @returns Age in hours
 */
export function getAlertAgeHours(alert: SuspiciousActivityAlert): number {
  const now = new Date();
  const created = new Date(alert.firstEventAt);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
}

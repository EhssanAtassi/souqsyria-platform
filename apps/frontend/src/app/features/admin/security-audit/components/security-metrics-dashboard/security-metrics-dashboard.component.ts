/**
 * Security Metrics Dashboard Component
 * 
 * @description Displays high-level security metrics in a card-based dashboard.
 * Provides at-a-glance view of security status and trends.
 * 
 * Features:
 * - Total events count (24h)
 * - Failed attempts count (24h) with warning indicator
 * - Suspicious activity count with critical indicator
 * - Unique users count (24h)
 * - Failure rate visualization with color-coded status
 * 
 * Visual Design:
 * - Material cards with icons
 * - Color-coded status indicators
 * - Responsive grid layout
 * - Progress bar for failure rate
 * 
 * @example
 * ```html
 * <app-security-metrics-dashboard [metrics]="metrics$ | async" />
 * ```
 * 
 * @swagger
 * components:
 *   SecurityMetricsDashboard:
 *     description: Visual dashboard displaying security metrics
 *     properties:
 *       metrics:
 *         $ref: '#/components/schemas/SecurityMetrics'
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material imports
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Models
import { SecurityMetrics } from '../../models';

/**
 * Failure rate threshold for visual indicators
 */
const FAILURE_RATE_THRESHOLDS = {
  LOW: 5, // Below 5% is good
  MEDIUM: 15, // 5-15% is concerning
  HIGH: 25, // Above 15% is critical
} as const;

@Component({
  selector: 'app-security-metrics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './security-metrics-dashboard.component.html',
  styleUrls: ['./security-metrics-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityMetricsDashboardComponent {
  /**
   * Security metrics data to display
   * 
   * @description Contains aggregated security statistics for the dashboard.
   * If null, dashboard shows loading/empty state.
   */
  @Input() metrics: SecurityMetrics | null = null;

  /**
   * Get CSS class for failure rate card based on threshold
   * 
   * @description Returns appropriate class for styling the failure rate indicator.
   * Uses predefined thresholds to determine severity.
   * 
   * @returns CSS class name ('status-good', 'status-warning', or 'status-critical')
   * 
   * @example
   * ```html
   * <div [class]="getFailureRateClass()">
   * ```
   */
  getFailureRateClass(): string {
    if (!this.metrics) return 'status-good';

    const rate = this.metrics.failureRate24h;

    if (rate < FAILURE_RATE_THRESHOLDS.LOW) {
      return 'status-good';
    } else if (rate < FAILURE_RATE_THRESHOLDS.MEDIUM) {
      return 'status-warning';
    } else {
      return 'status-critical';
    }
  }

  /**
   * Get Material color for failure rate progress bar
   * 
   * @description Maps failure rate to Material theme color.
   * 
   * @returns Material color name ('primary', 'accent', or 'warn')
   * 
   * @example
   * ```html
   * <mat-progress-bar [color]="getFailureRateColor()">
   * ```
   */
  getFailureRateColor(): 'primary' | 'accent' | 'warn' {
    if (!this.metrics) return 'primary';

    const rate = this.metrics.failureRate24h;

    if (rate < FAILURE_RATE_THRESHOLDS.LOW) {
      return 'primary';
    } else if (rate < FAILURE_RATE_THRESHOLDS.MEDIUM) {
      return 'accent';
    } else {
      return 'warn';
    }
  }

  /**
   * Check if failed attempts count is concerning
   * 
   * @description Returns true if failed attempts exceed threshold.
   * Used to highlight the failed attempts card.
   * 
   * @returns True if count is above 0
   */
  hasFailedAttempts(): boolean {
    return this.metrics ? this.metrics.failedAttempts24h > 0 : false;
  }

  /**
   * Check if suspicious activity count is critical
   * 
   * @description Returns true if there are unresolved suspicious alerts.
   * Used to highlight the suspicious activity card.
   * 
   * @returns True if count is above 0
   */
  hasSuspiciousActivity(): boolean {
    return this.metrics ? this.metrics.suspiciousActivityCount > 0 : false;
  }

  /**
   * Format large numbers for display
   * 
   * @description Formats numbers with thousands separators for better readability.
   * 
   * @param value - Number to format
   * @returns Formatted string (e.g., "1,234" or "0")
   * 
   * @example
   * ```html
   * <span>{{ formatNumber(metrics.totalEvents24h) }}</span>
   * ```
   */
  formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return value.toLocaleString('en-US');
  }

  /**
   * Get tooltip text for failure rate
   * 
   * @description Provides contextual information about failure rate threshold.
   * 
   * @returns Tooltip message
   */
  getFailureRateTooltip(): string {
    if (!this.metrics) return 'No data available';

    const rate = this.metrics.failureRate24h;

    if (rate < FAILURE_RATE_THRESHOLDS.LOW) {
      return `Failure rate is healthy (below ${FAILURE_RATE_THRESHOLDS.LOW}%)`;
    } else if (rate < FAILURE_RATE_THRESHOLDS.MEDIUM) {
      return `Failure rate is elevated (${FAILURE_RATE_THRESHOLDS.LOW}-${FAILURE_RATE_THRESHOLDS.MEDIUM}%)`;
    } else {
      return `Failure rate is critical (above ${FAILURE_RATE_THRESHOLDS.MEDIUM}%)`;
    }
  }
}

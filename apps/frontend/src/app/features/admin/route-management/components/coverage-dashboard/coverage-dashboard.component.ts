import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemePalette } from '@angular/material/core';

import { CoverageStats } from '../../models';

/**
 * CoverageDashboardComponent
 *
 * Visual metrics display for route-permission mapping coverage.
 * Shows key statistics:
 * - Total routes count
 * - Mapped routes (with permissions)
 * - Unmapped routes (no permissions) - highlighted if > 0
 * - Public routes (no auth required)
 * - Coverage percentage with color-coded progress bar
 *
 * @features
 * - Material Design card layout
 * - Responsive grid for stat items
 * - Color-coded icons and progress
 * - Danger highlighting for unmapped routes
 * - Tooltip hints
 * - Last updated timestamp
 *
 * @example
 * ```html
 * <app-coverage-dashboard [stats]="coverage$ | async" />
 * ```
 *
 * @remarks
 * Coverage percentage determines progress bar color:
 * - < 50%: warn (red)
 * - 50-80%: accent (orange/yellow)
 * - > 80%: primary (blue/green)
 */
@Component({
  selector: 'app-coverage-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './coverage-dashboard.component.html',
  styleUrls: ['./coverage-dashboard.component.scss']
})
export class CoverageDashboardComponent {
  /**
   * Coverage statistics from parent
   *
   * Input can be null during initial load
   */
  @Input() stats: CoverageStats | null = null;

  /**
   * Signal-based computed properties for template
   */
  readonly totalRoutes = computed(() => this.stats?.totalRoutes || 0);
  readonly mappedRoutes = computed(() => this.stats?.mappedRoutes || 0);
  readonly unmappedRoutes = computed(() => this.stats?.unmappedRoutes || 0);
  readonly publicRoutes = computed(() => this.stats?.publicRoutes || 0);
  readonly coveragePercentage = computed(() => this.stats?.coveragePercentage || 0);

  /**
   * Check if there are unmapped routes (danger state)
   */
  readonly hasUnmappedRoutes = computed(() => this.unmappedRoutes() > 0);

  /**
   * Get coverage bar color based on percentage
   *
   * @returns Material theme color
   *
   * @remarks
   * Thresholds:
   * - 0-50%: warn (red) - Critical
   * - 50-80%: accent (amber) - Warning
   * - 80-100%: primary (green) - Good
   *
   * @public
   */
  getCoverageColor(): ThemePalette {
    const percentage = this.coveragePercentage();

    if (percentage < 50) {
      return 'warn';
    } else if (percentage < 80) {
      return 'accent';
    } else {
      return 'primary';
    }
  }

  /**
   * Get coverage status label
   *
   * @returns Status description
   *
   * @public
   */
  getCoverageStatus(): string {
    const percentage = this.coveragePercentage();

    if (percentage === 100) {
      return 'Complete';
    } else if (percentage >= 80) {
      return 'Good';
    } else if (percentage >= 50) {
      return 'Fair';
    } else {
      return 'Critical';
    }
  }

  /**
   * Format relative time for last updated
   *
   * @param date - Timestamp to format
   * @returns Human-readable relative time (e.g., "2 minutes ago")
   *
   * @public
   */
  formatRelativeTime(date: Date | null): string {
    if (!date) {
      return 'Never';
    }

    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get tooltip text for stat item
   *
   * @param statType - Type of statistic
   * @returns Tooltip description
   *
   * @public
   */
  getTooltip(statType: 'total' | 'mapped' | 'unmapped' | 'public'): string {
    switch (statType) {
      case 'total':
        return 'Total number of API routes discovered in the application';
      case 'mapped':
        return 'Routes that have been mapped to permissions for access control';
      case 'unmapped':
        return 'Routes without permission mapping - potential security risk';
      case 'public':
        return 'Routes that are publicly accessible without authentication';
      default:
        return '';
    }
  }
}

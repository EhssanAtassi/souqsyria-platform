/**
 * @file clv-summary-card.component.ts
 * @description Customer Lifetime Value summary card component displaying aggregated CLV metrics,
 *              segment distribution, and trend indicators for the admin analytics dashboard.
 * @module AdminAnalytics/Components/CLV
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

import { CLVAnalyticsSummary, CustomerSegment } from '../../interfaces/clv.interface';
import { CurrencyFormatPipe } from '../../../shared/pipes';

/**
 * Segment color mapping for visual consistency
 * @description Maps customer segments to Material theme colors
 */
const SEGMENT_COLORS: Record<CustomerSegment, string> = {
  VIP: 'accent',
  HIGH_VALUE: 'primary',
  ACTIVE: 'primary',
  AT_RISK: 'warn',
  DORMANT: 'warn',
  LOST: ''
};

/**
 * Segment icon mapping
 * @description Material icons for each customer segment
 */
const SEGMENT_ICONS: Record<CustomerSegment, string> = {
  VIP: 'stars',
  HIGH_VALUE: 'trending_up',
  ACTIVE: 'favorite',
  AT_RISK: 'warning',
  DORMANT: 'snooze',
  LOST: 'block'
};

/**
 * CLV Summary Card Component
 * @description Displays comprehensive CLV analytics including:
 *              - Average and total CLV metrics
 *              - Customer segment distribution with chips
 *              - CLV trend indicator with percentage
 *              - Prediction confidence meter
 *              - Quick actions for detailed analysis
 *
 * @example
 * ```html
 * <app-clv-summary-card
 *   [data]="clvSummary()"
 *   [loading]="isLoading()"
 *   (viewDetails)="navigateToDetails()"
 *   (viewSegment)="filterBySegment($event)"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-clv-summary-card',
  templateUrl: './clv-summary-card.component.html',
  styleUrls: ['./clv-summary-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatBadgeModule,
    DecimalPipe,
    PercentPipe,
    CurrencyFormatPipe
  ]
})
export class CLVSummaryCardComponent {
  // =========================================================================
  // INPUTS
  // =========================================================================

  /**
   * CLV summary data
   * @description Main data payload with all CLV metrics
   */
  readonly data = input<CLVAnalyticsSummary | null>(null);

  /**
   * Loading state
   * @description Shows skeleton/spinner when true
   */
  readonly loading = input<boolean>(false);

  /**
   * Error message
   * @description Displays error state if provided
   */
  readonly error = input<string | null>(null);

  /**
   * Compact mode
   * @description Reduces padding and hides some details
   * @default false
   */
  readonly compact = input<boolean>(false);

  /**
   * Show prediction confidence
   * @description Whether to display ML confidence meter
   * @default true
   */
  readonly showConfidence = input<boolean>(true);

  // =========================================================================
  // OUTPUTS
  // =========================================================================

  /**
   * View details clicked
   * @description Emits when user wants to see detailed CLV analysis
   */
  readonly viewDetails = output<void>();

  /**
   * View segment clicked
   * @description Emits when user clicks on a segment chip
   */
  readonly viewSegment = output<CustomerSegment>();

  /**
   * Refresh data clicked
   * @description Emits when user requests data refresh
   */
  readonly refreshData = output<void>();

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  /**
   * Sorted segment entries
   * @description Segments sorted by count descending
   */
  readonly sortedSegments = computed(() => {
    const summaryData = this.data();
    if (!summaryData) return [];

    return Object.entries(summaryData.segmentDistribution)
      .map(([segment, count]) => ({
        segment: segment as CustomerSegment,
        count,
        percentage: (count / summaryData.totalCustomers) * 100
      }))
      .sort((a, b) => b.count - a.count);
  });

  /**
   * Trend direction
   * @description Determines up/down/neutral trend
   */
  readonly trendDirection = computed((): 'up' | 'down' | 'neutral' => {
    const trend = this.data()?.trend;
    if (!trend) return 'neutral';
    if (trend > 0) return 'up';
    if (trend < 0) return 'down';
    return 'neutral';
  });

  /**
   * Trend icon
   * @description Material icon for trend direction
   */
  readonly trendIcon = computed(() => {
    switch (this.trendDirection()) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  });

  /**
   * Trend color class
   * @description CSS class for trend color
   */
  readonly trendColorClass = computed(() => {
    switch (this.trendDirection()) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  });

  /**
   * Confidence level label
   * @description Human-readable confidence level
   */
  readonly confidenceLabel = computed(() => {
    const confidence = this.data()?.predictionConfidence || 0;
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.6) return 'Moderate';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  });

  /**
   * Confidence color
   * @description Color for confidence indicator
   */
  readonly confidenceColor = computed(() => {
    const confidence = this.data()?.predictionConfidence || 0;
    if (confidence >= 0.75) return 'primary';
    if (confidence >= 0.6) return 'accent';
    return 'warn';
  });

  /**
   * Confidence percentage
   * @description Confidence as percentage (0-100)
   */
  readonly confidencePercentage = computed(() => {
    return (this.data()?.predictionConfidence || 0) * 100;
  });

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get color for customer segment
   * @param segment - Customer segment
   * @returns Material color name
   */
  getSegmentColor(segment: CustomerSegment): string {
    return SEGMENT_COLORS[segment];
  }

  /**
   * Get icon for customer segment
   * @param segment - Customer segment
   * @returns Material icon name
   */
  getSegmentIcon(segment: CustomerSegment): string {
    return SEGMENT_ICONS[segment];
  }

  /**
   * Get display name for segment
   * @param segment - Customer segment
   * @returns Human-readable segment name
   */
  getSegmentDisplayName(segment: CustomerSegment): string {
    return segment.replace('_', ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Handle segment chip click
   * @param segment - Clicked segment
   */
  onSegmentClick(segment: CustomerSegment): void {
    this.viewSegment.emit(segment);
  }

  /**
   * Handle view details click
   */
  onViewDetails(): void {
    this.viewDetails.emit();
  }

  /**
   * Handle refresh click
   */
  onRefresh(): void {
    this.refreshData.emit();
  }

  /**
   * Format large numbers with abbreviations
   * @param value - Number to format
   * @returns Formatted string (e.g., "2.5M")
   */
  formatLargeNumber(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  }

  /**
   * Track function for segment ngFor
   */
  trackBySegment(index: number, item: { segment: CustomerSegment }): CustomerSegment {
    return item.segment;
  }
}

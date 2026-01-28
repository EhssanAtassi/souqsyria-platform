/**
 * @file admin-stat-card.component.ts
 * @description Reusable metric/statistic display card component for admin dashboard.
 *              Displays a single KPI with title, value, trend indicator, and optional hint.
 * @module AdminDashboard/SharedComponents
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  input
} from '@angular/core';
import { NgClass, NgIf, DecimalPipe, PercentPipe } from '@angular/common';

/**
 * Trend direction for the metric
 * @description Indicates whether the metric is trending upward, downward, or neutral
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Format type for the metric value
 * @description Determines how the value is formatted for display
 */
export type ValueFormat = 'number' | 'currency' | 'percent' | 'text';

/**
 * Color theme for the card
 * @description Visual color theme for the stat card
 */
export type ColorTheme = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

/**
 * Admin Stat Card Component
 * @description A flexible card component for displaying key performance indicators (KPIs)
 *              with visual trend indicators and contextual hints.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <app-admin-stat-card
 *   title="Today Revenue"
 *   [value]="6420000"
 *   format="currency"
 *   currencyCode="SYP"
 *   delta="+18.6%"
 *   trend="up"
 *   hint="Top sellers: Damascus Steel, Aleppo Soap"
 * />
 *
 * <!-- With loading state -->
 * <app-admin-stat-card
 *   title="Active Vendors"
 *   [value]="284"
 *   format="number"
 *   [loading]="isLoading()"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-stat-card',
  templateUrl: './admin-stat-card.component.html',
  styleUrls: ['./admin-stat-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgIf, DecimalPipe, PercentPipe]
})
export class AdminStatCardComponent {
  /**
   * Card title/label
   * @description The name or label for this metric
   */
  readonly title = input.required<string>();

  /**
   * Metric value
   * @description The numeric or text value to display
   */
  readonly value = input.required<number | string>();

  /**
   * Value format type
   * @description How to format the displayed value
   * @default 'number'
   */
  readonly format = input<ValueFormat>('number');

  /**
   * Currency code for currency format
   * @description ISO 4217 currency code (e.g., 'SYP', 'USD')
   * @default 'SYP'
   */
  readonly currencyCode = input<string>('SYP');

  /**
   * Delta/change text
   * @description Text describing the change (e.g., '+18.6% vs yesterday')
   */
  readonly delta = input<string>('');

  /**
   * Trend direction
   * @description Visual indicator for metric direction
   * @default 'neutral'
   */
  readonly trend = input<TrendDirection>('neutral');

  /**
   * Contextual hint
   * @description Additional context or insight about this metric
   */
  readonly hint = input<string>('');

  /**
   * Icon name (Material Icons)
   * @description Optional icon to display with the metric
   */
  readonly icon = input<string>('');

  /**
   * Loading state
   * @description Shows skeleton loader when true
   * @default false
   */
  readonly loading = input<boolean>(false);

  /**
   * Card color theme
   * @description Visual theme for the card accent
   * @default 'primary'
   */
  readonly color = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');

  /**
   * Computed formatted value
   * @description Returns the value formatted according to the format input
   */
  readonly formattedValue = computed(() => {
    const val = this.value();
    const fmt = this.format();

    if (typeof val === 'string') {
      return val;
    }

    switch (fmt) {
      case 'currency':
        return this.formatCurrency(val);
      case 'percent':
        return `${(val * 100).toFixed(1)}%`;
      case 'number':
      default:
        return this.formatNumber(val);
    }
  });

  /**
   * Trend CSS class
   * @description Returns the appropriate CSS class for trend indicator
   */
  readonly trendClass = computed(() => {
    const trendDir = this.trend();
    return {
      'stat-card__trend--up': trendDir === 'up',
      'stat-card__trend--down': trendDir === 'down',
      'stat-card__trend--neutral': trendDir === 'neutral'
    };
  });

  /**
   * Trend icon
   * @description Returns the appropriate icon for trend direction
   */
  readonly trendIcon = computed(() => {
    switch (this.trend()) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  });

  /**
   * Color CSS class
   * @description Returns the appropriate CSS class for color theme
   */
  readonly colorClass = computed(() => `stat-card--${this.color()}`);

  /**
   * Format number with thousand separators
   * @param value - Number to format
   * @returns Formatted number string
   */
  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Format currency value
   * @param value - Number to format as currency
   * @returns Formatted currency string
   */
  private formatCurrency(value: number): string {
    // SYP doesn't have a standard symbol, so we format manually
    const code = this.currencyCode();
    const formatted = this.formatNumber(value);
    return `${formatted} ${code}`;
  }
}

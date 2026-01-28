/**
 * @file bi-kpi-card.component.ts
 * @description Enhanced KPI card component for BI dashboards.
 *              Displays metrics with trends, sparklines, and comparison data.
 * @module AdminDashboard/SharedComponents/BI
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed
} from '@angular/core';
import { NgIf, NgClass, DecimalPipe, PercentPipe } from '@angular/common';

/**
 * KPI value format type
 */
export type KPIFormat = 'number' | 'currency' | 'percent' | 'duration' | 'compact';

/**
 * KPI trend direction
 */
export type KPITrend = 'up' | 'down' | 'neutral';

/**
 * KPI trend sentiment (whether up is good or bad)
 */
export type TrendSentiment = 'positive' | 'negative' | 'neutral';

/**
 * Sparkline data point
 */
export interface SparklinePoint {
  value: number;
  label?: string;
}

/**
 * BI KPI Card Component
 * @description An enhanced metric card for BI dashboards featuring:
 *              - Large prominent value display
 *              - Trend indicator with change percentage
 *              - Optional sparkline mini-chart
 *              - Comparison with previous period
 *              - Multiple color themes
 *              - Loading and error states
 *
 * @example
 * ```html
 * <app-bi-kpi-card
 *   title="Average CLV"
 *   [value]="125000"
 *   format="currency"
 *   currencyCode="SYP"
 *   [change]="12.5"
 *   trend="up"
 *   trendSentiment="positive"
 *   subtitle="vs. last month"
 *   icon="trending_up"
 *   color="success"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-bi-kpi-card',
  templateUrl: './bi-kpi-card.component.html',
  styleUrls: ['./bi-kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgClass, DecimalPipe, PercentPipe]
})
export class BiKpiCardComponent {
  /**
   * KPI title/label
   */
  readonly title = input.required<string>();

  /**
   * KPI title in Arabic
   */
  readonly titleAr = input<string>('');

  /**
   * KPI value
   */
  readonly value = input.required<number>();

  /**
   * Value format type
   * @default 'number'
   */
  readonly format = input<KPIFormat>('number');

  /**
   * Currency code for currency format
   * @default 'SYP'
   */
  readonly currencyCode = input<string>('SYP');

  /**
   * Change percentage from previous period
   */
  readonly change = input<number | null>(null);

  /**
   * Trend direction
   * @default 'neutral'
   */
  readonly trend = input<KPITrend>('neutral');

  /**
   * Trend sentiment (is up good or bad?)
   * @default 'positive' (up is good)
   */
  readonly trendSentiment = input<TrendSentiment>('positive');

  /**
   * Subtitle text (e.g., "vs. last month")
   */
  readonly subtitle = input<string>('');

  /**
   * Material icon name
   */
  readonly icon = input<string>('');

  /**
   * Card color theme
   * @default 'default'
   */
  readonly color = input<'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'>('default');

  /**
   * Previous period value for comparison
   */
  readonly previousValue = input<number | null>(null);

  /**
   * Sparkline data points
   */
  readonly sparkline = input<SparklinePoint[]>([]);

  /**
   * Loading state
   * @default false
   */
  readonly loading = input<boolean>(false);

  /**
   * Compact card size
   * @default false
   */
  readonly compact = input<boolean>(false);

  /**
   * Show comparison with previous value
   * @default false
   */
  readonly showComparison = input<boolean>(false);

  /**
   * Target value for progress indicator
   */
  readonly target = input<number | null>(null);

  /**
   * Show target progress bar
   * @default false
   */
  readonly showProgress = input<boolean>(false);

  /**
   * Formatted display value
   */
  readonly displayValue = computed(() => {
    const val = this.value();
    const fmt = this.format();
    const currency = this.currencyCode();

    switch (fmt) {
      case 'currency':
        return this.formatCurrency(val, currency);
      case 'percent':
        return `${val.toFixed(1)}%`;
      case 'duration':
        return this.formatDuration(val);
      case 'compact':
        return this.formatCompact(val);
      case 'number':
      default:
        return this.formatNumber(val);
    }
  });

  /**
   * Formatted previous value
   */
  readonly displayPreviousValue = computed(() => {
    const prev = this.previousValue();
    if (prev === null) return '';

    const fmt = this.format();
    const currency = this.currencyCode();

    switch (fmt) {
      case 'currency':
        return this.formatCurrency(prev, currency);
      case 'percent':
        return `${prev.toFixed(1)}%`;
      case 'compact':
        return this.formatCompact(prev);
      default:
        return this.formatNumber(prev);
    }
  });

  /**
   * Formatted change value
   */
  readonly displayChange = computed(() => {
    const chg = this.change();
    if (chg === null) return '';
    const prefix = chg >= 0 ? '+' : '';
    return `${prefix}${chg.toFixed(1)}%`;
  });

  /**
   * Trend icon name
   */
  readonly trendIcon = computed(() => {
    const t = this.trend();
    switch (t) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  });

  /**
   * Trend CSS class based on direction and sentiment
   */
  readonly trendClass = computed(() => {
    const t = this.trend();
    const sentiment = this.trendSentiment();

    if (t === 'neutral') return 'kpi-card__trend--neutral';

    // Determine if trend is good or bad based on sentiment
    const isPositive = (t === 'up' && sentiment === 'positive') ||
                       (t === 'down' && sentiment === 'negative');

    return isPositive ? 'kpi-card__trend--positive' : 'kpi-card__trend--negative';
  });

  /**
   * Progress percentage toward target
   */
  readonly progressPercent = computed(() => {
    const tgt = this.target();
    const val = this.value();
    if (tgt === null || tgt === 0) return 0;
    return Math.min((val / tgt) * 100, 100);
  });

  /**
   * Sparkline SVG path
   */
  readonly sparklinePath = computed(() => {
    const points = this.sparkline();
    if (points.length < 2) return '';

    const values = points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const width = 100;
    const height = 30;
    const stepX = width / (points.length - 1);

    const pathPoints = points.map((point, i) => {
      const x = i * stepX;
      const y = height - ((point.value - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    return pathPoints.join(' ');
  });

  /**
   * Container CSS classes
   */
  readonly containerClasses = computed(() => ({
    'kpi-card': true,
    [`kpi-card--${this.color()}`]: true,
    'kpi-card--compact': this.compact(),
    'kpi-card--loading': this.loading()
  }));

  /**
   * Format number with thousand separators
   */
  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number, code: string): string {
    // For SYP, use custom formatting
    if (code === 'SYP') {
      return `${this.formatCompact(value)} SYP`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format duration in days/hours
   */
  private formatDuration(days: number): string {
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours}h`;
    }
    if (days < 30) {
      return `${Math.round(days)}d`;
    }
    const months = Math.round(days / 30);
    return `${months}mo`;
  }

  /**
   * Format compact number (K, M, B)
   */
  private formatCompact(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return this.formatNumber(value);
  }
}

/**
 * @file bi-segment-chart.component.ts
 * @description Segment visualization chart for BI dashboards.
 *              Displays data as donut/pie chart with legend and details.
 * @module AdminDashboard/SharedComponents/BI
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed
} from '@angular/core';
import { NgFor, NgIf, NgClass, DecimalPipe, PercentPipe } from '@angular/common';

/**
 * Segment data point
 */
export interface SegmentData {
  /** Segment identifier */
  id: string;
  /** Segment display label */
  label: string;
  /** Segment value */
  value: number;
  /** Percentage of total */
  percentage: number;
  /** Segment color */
  color: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Chart display type
 */
export type ChartType = 'donut' | 'pie' | 'bar';

/**
 * BI Segment Chart Component
 * @description A versatile segment visualization component featuring:
 *              - Donut and pie chart rendering with SVG
 *              - Interactive segments with hover effects
 *              - Legend with segment details
 *              - Click to drill-down support
 *              - Responsive design
 *
 * @example
 * ```html
 * <app-bi-segment-chart
 *   [segments]="customerSegments()"
 *   [title]="'Customer Segments'"
 *   chartType="donut"
 *   [showLegend]="true"
 *   [showPercentages]="true"
 *   (segmentClick)="onSegmentClick($event)"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-bi-segment-chart',
  templateUrl: './bi-segment-chart.component.html',
  styleUrls: ['./bi-segment-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, NgClass, DecimalPipe, PercentPipe]
})
export class BiSegmentChartComponent {
  /**
   * Segment data array
   */
  readonly segments = input.required<SegmentData[]>();

  /**
   * Chart title
   */
  readonly title = input<string>('');

  /**
   * Chart type
   * @default 'donut'
   */
  readonly chartType = input<ChartType>('donut');

  /**
   * Show legend
   * @default true
   */
  readonly showLegend = input<boolean>(true);

  /**
   * Legend position
   * @default 'right'
   */
  readonly legendPosition = input<'right' | 'bottom'>('right');

  /**
   * Show percentages in legend
   * @default true
   */
  readonly showPercentages = input<boolean>(true);

  /**
   * Show values in legend
   * @default true
   */
  readonly showValues = input<boolean>(true);

  /**
   * Value format type
   * @default 'number'
   */
  readonly valueFormat = input<'number' | 'currency'>('number');

  /**
   * Currency code for currency format
   * @default 'SYP'
   */
  readonly currencyCode = input<string>('SYP');

  /**
   * Chart size (diameter in pixels)
   * @default 200
   */
  readonly size = input<number>(200);

  /**
   * Donut inner radius ratio (0-1)
   * @default 0.6
   */
  readonly innerRadius = input<number>(0.6);

  /**
   * Center text (for donut)
   */
  readonly centerText = input<string>('');

  /**
   * Center subtext
   */
  readonly centerSubtext = input<string>('');

  /**
   * Loading state
   * @default false
   */
  readonly loading = input<boolean>(false);

  /**
   * Hovered segment ID
   */
  hoveredSegment: string | null = null;

  /**
   * Segment click event
   */
  readonly segmentClick = output<SegmentData>();

  /**
   * Total value across all segments
   */
  readonly totalValue = computed(() => {
    return this.segments().reduce((sum, s) => sum + s.value, 0);
  });

  /**
   * SVG viewBox dimensions
   */
  readonly viewBox = computed(() => {
    const s = this.size();
    return `0 0 ${s} ${s}`;
  });

  /**
   * Chart center point
   */
  readonly center = computed(() => this.size() / 2);

  /**
   * Outer radius
   */
  readonly outerRadius = computed(() => (this.size() / 2) - 10);

  /**
   * Inner radius (for donut)
   */
  readonly innerRadiusValue = computed(() => {
    return this.chartType() === 'donut'
      ? this.outerRadius() * this.innerRadius()
      : 0;
  });

  /**
   * Generate SVG paths for segments
   */
  readonly segmentPaths = computed(() => {
    const segs = this.segments();
    if (segs.length === 0) return [];

    const total = this.totalValue();
    if (total === 0) return [];

    const cx = this.center();
    const cy = this.center();
    const outer = this.outerRadius();
    const inner = this.innerRadiusValue();

    let startAngle = -Math.PI / 2; // Start at top
    const paths: { segment: SegmentData; path: string; labelX: number; labelY: number }[] = [];

    for (const segment of segs) {
      const percentage = segment.value / total;
      const angle = percentage * 2 * Math.PI;
      const endAngle = startAngle + angle;

      // Calculate arc points
      const x1 = cx + outer * Math.cos(startAngle);
      const y1 = cy + outer * Math.sin(startAngle);
      const x2 = cx + outer * Math.cos(endAngle);
      const y2 = cy + outer * Math.sin(endAngle);

      const x3 = cx + inner * Math.cos(endAngle);
      const y3 = cy + inner * Math.sin(endAngle);
      const x4 = cx + inner * Math.cos(startAngle);
      const y4 = cy + inner * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      let path: string;
      if (inner > 0) {
        // Donut segment
        path = `
          M ${x1} ${y1}
          A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2}
          L ${x3} ${y3}
          A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4}
          Z
        `;
      } else {
        // Pie segment
        path = `
          M ${cx} ${cy}
          L ${x1} ${y1}
          A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2}
          Z
        `;
      }

      // Label position (middle of segment)
      const midAngle = startAngle + angle / 2;
      const labelRadius = (outer + inner) / 2;
      const labelX = cx + labelRadius * Math.cos(midAngle);
      const labelY = cy + labelRadius * Math.sin(midAngle);

      paths.push({ segment, path, labelX, labelY });
      startAngle = endAngle;
    }

    return paths;
  });

  /**
   * Container CSS classes
   */
  readonly containerClasses = computed(() => ({
    'segment-chart': true,
    'segment-chart--loading': this.loading(),
    [`segment-chart--legend-${this.legendPosition()}`]: this.showLegend()
  }));

  /**
   * Handle segment hover
   */
  onSegmentHover(segmentId: string | null): void {
    this.hoveredSegment = segmentId;
  }

  /**
   * Handle segment click
   */
  onSegmentClick(segment: SegmentData): void {
    this.segmentClick.emit(segment);
  }

  /**
   * Check if segment is hovered
   */
  isHovered(segmentId: string): boolean {
    return this.hoveredSegment === segmentId;
  }

  /**
   * Format value for display
   */
  formatValue(value: number): string {
    if (this.valueFormat() === 'currency') {
      return this.formatCurrency(value);
    }
    return this.formatNumber(value);
  }

  /**
   * Format number with thousand separators
   */
  private formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number): string {
    const code = this.currencyCode();
    return `${this.formatNumber(value)} ${code}`;
  }

  /**
   * Track segment by ID
   */
  trackBySegment(index: number, item: { segment: SegmentData }): string {
    return item.segment.id;
  }

  /**
   * Track legend item by ID
   */
  trackByLegendItem(index: number, segment: SegmentData): string {
    return segment.id;
  }
}

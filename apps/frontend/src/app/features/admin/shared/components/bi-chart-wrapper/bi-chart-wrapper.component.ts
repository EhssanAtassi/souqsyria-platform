/**
 * @file bi-chart-wrapper.component.ts
 * @description Reusable chart wrapper component for BI dashboards.
 *              Provides consistent styling, loading states, and export functionality.
 * @module AdminDashboard/SharedComponents/BI
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  ContentChild,
  TemplateRef
} from '@angular/core';
import { NgIf, NgClass, NgTemplateOutlet } from '@angular/common';

/**
 * Chart export format options
 */
export type ChartExportFormat = 'png' | 'svg' | 'pdf' | 'csv';

/**
 * BI Chart Wrapper Component
 * @description A container component for BI charts that provides:
 *              - Consistent header with title and subtitle
 *              - Loading skeleton state
 *              - Export functionality
 *              - Responsive design
 *              - RTL support for Arabic
 *
 * @example
 * ```html
 * <app-bi-chart-wrapper
 *   title="Revenue Trends"
 *   subtitle="Last 30 days"
 *   [loading]="isLoading()"
 *   [showExport]="true"
 *   (export)="onExport($event)"
 * >
 *   <ngx-charts-line-chart [results]="chartData" />
 * </app-bi-chart-wrapper>
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-bi-chart-wrapper',
  templateUrl: './bi-chart-wrapper.component.html',
  styleUrls: ['./bi-chart-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgClass, NgTemplateOutlet]
})
export class BiChartWrapperComponent {
  /**
   * Chart title
   * @description Main heading for the chart
   */
  readonly title = input.required<string>();

  /**
   * Chart title in Arabic (for RTL)
   * @description Arabic translation of the title
   */
  readonly titleAr = input<string>('');

  /**
   * Chart subtitle
   * @description Secondary text below the title
   */
  readonly subtitle = input<string>('');

  /**
   * Chart subtitle in Arabic
   */
  readonly subtitleAr = input<string>('');

  /**
   * Loading state
   * @description Shows skeleton loader when true
   * @default false
   */
  readonly loading = input<boolean>(false);

  /**
   * Error message
   * @description Displays error state when set
   */
  readonly error = input<string | null>(null);

  /**
   * Show export button
   * @default true
   */
  readonly showExport = input<boolean>(true);

  /**
   * Available export formats
   * @default ['png', 'csv']
   */
  readonly exportFormats = input<ChartExportFormat[]>(['png', 'csv']);

  /**
   * Show fullscreen toggle
   * @default false
   */
  readonly showFullscreen = input<boolean>(false);

  /**
   * Chart height (CSS value)
   * @default '300px'
   */
  readonly height = input<string>('300px');

  /**
   * Chart minimum height
   */
  readonly minHeight = input<string>('200px');

  /**
   * Show date range info
   * @default false
   */
  readonly showDateRange = input<boolean>(false);

  /**
   * Date range display text
   */
  readonly dateRangeText = input<string>('');

  /**
   * Card variant style
   * @default 'default'
   */
  readonly variant = input<'default' | 'bordered' | 'elevated'>('default');

  /**
   * Info tooltip text
   */
  readonly infoTooltip = input<string>('');

  /**
   * Header actions template
   */
  @ContentChild('headerActions') headerActionsTemplate?: TemplateRef<unknown>;

  /**
   * Empty state template
   */
  @ContentChild('emptyState') emptyStateTemplate?: TemplateRef<unknown>;

  /**
   * Export event
   * @description Emitted when user clicks export button
   */
  readonly export = output<ChartExportFormat>();

  /**
   * Fullscreen toggle event
   */
  readonly fullscreenToggle = output<boolean>();

  /**
   * Refresh event
   */
  readonly refresh = output<void>();

  /**
   * Internal fullscreen state
   */
  isFullscreen = false;

  /**
   * Export menu open state
   */
  isExportMenuOpen = false;

  /**
   * Container CSS classes
   */
  readonly containerClasses = computed(() => ({
    'bi-chart': true,
    'bi-chart--bordered': this.variant() === 'bordered',
    'bi-chart--elevated': this.variant() === 'elevated',
    'bi-chart--loading': this.loading(),
    'bi-chart--error': !!this.error(),
    'bi-chart--fullscreen': this.isFullscreen
  }));

  /**
   * Chart content style
   */
  readonly contentStyle = computed(() => ({
    height: this.height(),
    minHeight: this.minHeight()
  }));

  /**
   * Toggle export menu
   */
  toggleExportMenu(): void {
    this.isExportMenuOpen = !this.isExportMenuOpen;
  }

  /**
   * Handle export click
   * @param format - Selected export format
   */
  onExport(format: ChartExportFormat): void {
    this.isExportMenuOpen = false;
    this.export.emit(format);
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.fullscreenToggle.emit(this.isFullscreen);
  }

  /**
   * Handle refresh click
   */
  onRefresh(): void {
    this.refresh.emit();
  }

  /**
   * Close export menu when clicking outside
   */
  closeExportMenu(): void {
    this.isExportMenuOpen = false;
  }

  /**
   * Get export format icon
   */
  getFormatIcon(format: ChartExportFormat): string {
    const icons: Record<ChartExportFormat, string> = {
      png: 'image',
      svg: 'code',
      pdf: 'picture_as_pdf',
      csv: 'table_view'
    };
    return icons[format];
  }

  /**
   * Get export format label
   */
  getFormatLabel(format: ChartExportFormat): string {
    const labels: Record<ChartExportFormat, string> = {
      png: 'Export as PNG',
      svg: 'Export as SVG',
      pdf: 'Export as PDF',
      csv: 'Export as CSV'
    };
    return labels[format];
  }
}

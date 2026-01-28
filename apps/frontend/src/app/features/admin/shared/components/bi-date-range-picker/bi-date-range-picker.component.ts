/**
 * @file bi-date-range-picker.component.ts
 * @description Date range picker component for BI analytics dashboards.
 *              Supports presets, custom ranges, and comparison periods.
 * @module AdminDashboard/SharedComponents/BI
 */

import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  signal,
  OnInit
} from '@angular/core';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Date range value
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Date preset definition
 */
export interface DatePreset {
  id: string;
  label: string;
  labelAr?: string;
  getRange: () => DateRange;
}

/**
 * Comparison period type
 */
export type ComparisonType = 'previous_period' | 'previous_year' | 'custom' | 'none';

/**
 * BI Date Range Picker Component
 * @description A comprehensive date range picker for BI dashboards featuring:
 *              - Quick presets (Today, Last 7 days, This month, etc.)
 *              - Custom date range selection
 *              - Comparison period options
 *              - Granularity selection (daily, weekly, monthly)
 *              - Responsive design
 *
 * @example
 * ```html
 * <app-bi-date-range-picker
 *   [startDate]="startDate()"
 *   [endDate]="endDate()"
 *   [showComparison]="true"
 *   [showGranularity]="true"
 *   (dateChange)="onDateChange($event)"
 *   (comparisonChange)="onComparisonChange($event)"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-bi-date-range-picker',
  templateUrl: './bi-date-range-picker.component.html',
  styleUrls: ['./bi-date-range-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIf, NgFor, NgClass, DatePipe, FormsModule]
})
export class BiDateRangePickerComponent implements OnInit {
  /**
   * Start date (ISO format YYYY-MM-DD)
   */
  readonly startDate = input<string>('');

  /**
   * End date (ISO format YYYY-MM-DD)
   */
  readonly endDate = input<string>('');

  /**
   * Selected preset ID
   */
  readonly selectedPreset = input<string>('last_30_days');

  /**
   * Show comparison options
   * @default false
   */
  readonly showComparison = input<boolean>(false);

  /**
   * Comparison type
   */
  readonly comparison = input<ComparisonType>('none');

  /**
   * Show granularity options
   * @default false
   */
  readonly showGranularity = input<boolean>(false);

  /**
   * Selected granularity
   */
  readonly granularity = input<'daily' | 'weekly' | 'monthly'>('daily');

  /**
   * Compact mode
   * @default false
   */
  readonly compact = input<boolean>(false);

  /**
   * Date change event
   */
  readonly dateChange = output<DateRange & { preset: string }>();

  /**
   * Comparison change event
   */
  readonly comparisonChange = output<ComparisonType>();

  /**
   * Granularity change event
   */
  readonly granularityChange = output<'daily' | 'weekly' | 'monthly'>();

  /**
   * Internal state for custom dates
   */
  readonly customStartDate = signal<string>('');
  readonly customEndDate = signal<string>('');

  /**
   * Dropdown open state
   */
  readonly isOpen = signal<boolean>(false);

  /**
   * Custom date panel open state
   */
  readonly showCustomPanel = signal<boolean>(false);

  /**
   * Current selected preset (internal)
   */
  readonly currentPreset = signal<string>('last_30_days');

  /**
   * Date presets
   */
  readonly presets: DatePreset[] = [
    {
      id: 'today',
      label: 'Today',
      labelAr: 'اليوم',
      getRange: () => {
        const today = this.formatDate(new Date());
        return { startDate: today, endDate: today };
      }
    },
    {
      id: 'yesterday',
      label: 'Yesterday',
      labelAr: 'أمس',
      getRange: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const date = this.formatDate(yesterday);
        return { startDate: date, endDate: date };
      }
    },
    {
      id: 'last_7_days',
      label: 'Last 7 Days',
      labelAr: 'آخر 7 أيام',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        return { startDate: this.formatDate(start), endDate: this.formatDate(end) };
      }
    },
    {
      id: 'last_30_days',
      label: 'Last 30 Days',
      labelAr: 'آخر 30 يوماً',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 29);
        return { startDate: this.formatDate(start), endDate: this.formatDate(end) };
      }
    },
    {
      id: 'last_90_days',
      label: 'Last 90 Days',
      labelAr: 'آخر 90 يوماً',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 89);
        return { startDate: this.formatDate(start), endDate: this.formatDate(end) };
      }
    },
    {
      id: 'this_month',
      label: 'This Month',
      labelAr: 'هذا الشهر',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
      }
    },
    {
      id: 'last_month',
      label: 'Last Month',
      labelAr: 'الشهر الماضي',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: this.formatDate(start), endDate: this.formatDate(end) };
      }
    },
    {
      id: 'this_quarter',
      label: 'This Quarter',
      labelAr: 'هذا الربع',
      getRange: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), quarter * 3, 1);
        return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
      }
    },
    {
      id: 'this_year',
      label: 'This Year',
      labelAr: 'هذا العام',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return { startDate: this.formatDate(start), endDate: this.formatDate(now) };
      }
    },
    {
      id: 'custom',
      label: 'Custom Range',
      labelAr: 'نطاق مخصص',
      getRange: () => ({
        startDate: this.customStartDate(),
        endDate: this.customEndDate()
      })
    }
  ];

  /**
   * Comparison options
   */
  readonly comparisonOptions: { value: ComparisonType; label: string }[] = [
    { value: 'none', label: 'No comparison' },
    { value: 'previous_period', label: 'Previous period' },
    { value: 'previous_year', label: 'Previous year' }
  ];

  /**
   * Granularity options
   */
  readonly granularityOptions: { value: 'daily' | 'weekly' | 'monthly'; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  /**
   * Display text for selected date range
   */
  readonly displayText = computed(() => {
    const preset = this.presets.find(p => p.id === this.currentPreset());
    if (preset && preset.id !== 'custom') {
      return preset.label;
    }

    const start = this.startDate() || this.customStartDate();
    const end = this.endDate() || this.customEndDate();

    if (start && end) {
      return `${this.formatDisplayDate(start)} - ${this.formatDisplayDate(end)}`;
    }

    return 'Select dates';
  });

  /**
   * Container CSS classes
   */
  readonly containerClasses = computed(() => ({
    'date-picker': true,
    'date-picker--compact': this.compact(),
    'date-picker--open': this.isOpen()
  }));

  ngOnInit(): void {
    // Initialize from inputs
    if (this.selectedPreset()) {
      this.currentPreset.set(this.selectedPreset());
    }
    if (this.startDate()) {
      this.customStartDate.set(this.startDate());
    }
    if (this.endDate()) {
      this.customEndDate.set(this.endDate());
    }
  }

  /**
   * Toggle dropdown
   */
  toggle(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.showCustomPanel.set(false);
    }
  }

  /**
   * Close dropdown
   */
  close(): void {
    this.isOpen.set(false);
    this.showCustomPanel.set(false);
  }

  /**
   * Select a preset
   */
  selectPreset(preset: DatePreset): void {
    this.currentPreset.set(preset.id);

    if (preset.id === 'custom') {
      this.showCustomPanel.set(true);
      return;
    }

    const range = preset.getRange();
    this.customStartDate.set(range.startDate);
    this.customEndDate.set(range.endDate);

    this.dateChange.emit({
      ...range,
      preset: preset.id
    });

    this.close();
  }

  /**
   * Apply custom date range
   */
  applyCustomRange(): void {
    const start = this.customStartDate();
    const end = this.customEndDate();

    if (!start || !end) return;

    // Validate dates
    if (new Date(start) > new Date(end)) {
      // Swap if start is after end
      this.customStartDate.set(end);
      this.customEndDate.set(start);
    }

    this.dateChange.emit({
      startDate: this.customStartDate(),
      endDate: this.customEndDate(),
      preset: 'custom'
    });

    this.close();
  }

  /**
   * Handle comparison change
   */
  onComparisonSelect(type: ComparisonType): void {
    this.comparisonChange.emit(type);
  }

  /**
   * Handle granularity change
   */
  onGranularitySelect(granularity: 'daily' | 'weekly' | 'monthly'): void {
    this.granularityChange.emit(granularity);
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format date for display (MMM D, YYYY)
   */
  private formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Track preset by ID
   */
  trackByPreset(index: number, preset: DatePreset): string {
    return preset.id;
  }
}

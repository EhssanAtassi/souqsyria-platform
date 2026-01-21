/**
 * @file admin-filter-panel.component.ts
 * @description Reusable filter panel component for admin data tables.
 *              Supports various filter types with collapsible sections.
 * @module AdminDashboard/SharedComponents
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { NgFor, NgIf, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Filter field types
 * @description Supported filter input types
 */
export type FilterFieldType =
  | 'text'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'dateRange'
  | 'number'
  | 'numberRange'
  | 'checkbox'
  | 'radio';

/**
 * Filter option for select/multiselect/radio
 */
export interface FilterOption {
  /** Option value */
  value: string | number | boolean;
  /** Display label */
  label: string;
  /** Whether option is disabled */
  disabled?: boolean;
  /** Count indicator (e.g., "Active (42)") */
  count?: number;
}

/**
 * Filter field configuration
 */
export interface FilterField {
  /** Unique field identifier */
  key: string;
  /** Display label */
  label: string;
  /** Field type */
  type: FilterFieldType;
  /** Placeholder text */
  placeholder?: string;
  /** Available options for select/multiselect/radio */
  options?: FilterOption[];
  /** Default value */
  defaultValue?: unknown;
  /** Minimum value for number/date */
  min?: number | string;
  /** Maximum value for number/date */
  max?: number | string;
  /** Step for number inputs */
  step?: number;
  /** Whether field is required */
  required?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Field width (1-4 columns) */
  cols?: 1 | 2 | 3 | 4;
}

/**
 * Filter values object
 */
export type FilterValues = Record<string, unknown>;

/**
 * Admin Filter Panel Component
 * @description A flexible filter panel for building search and filter interfaces.
 *              Supports various input types and can be collapsed/expanded.
 *
 * @example
 * ```html
 * <app-admin-filter-panel
 *   [fields]="filterFields"
 *   [values]="currentFilters()"
 *   (filtersChange)="onFiltersChange($event)"
 *   (filtersReset)="onFiltersReset()"
 * />
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-filter-panel',
  templateUrl: './admin-filter-panel.component.html',
  styleUrls: ['./admin-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgFor, NgIf, NgClass, NgSwitch, NgSwitchCase, NgSwitchDefault, FormsModule]
})
export class AdminFilterPanelComponent {
  /**
   * Filter field configurations
   * @description Array of filter fields to display
   */
  readonly fields = input.required<FilterField[]>();

  /**
   * Current filter values
   * @description Object containing current filter values keyed by field key
   */
  readonly values = input<FilterValues>({});

  /**
   * Panel title
   * @description Optional title for the filter panel
   * @default 'Filters'
   */
  readonly title = input<string>('Filters');

  /**
   * Collapsible mode
   * @description Whether the panel can be collapsed
   * @default true
   */
  readonly collapsible = input<boolean>(true);

  /**
   * Initial collapsed state
   * @description Whether the panel starts collapsed
   * @default false
   */
  readonly collapsed = input<boolean>(false);

  /**
   * Show reset button
   * @description Whether to show the reset filters button
   * @default true
   */
  readonly showReset = input<boolean>(true);

  /**
   * Show apply button
   * @description Whether to require explicit apply (vs. instant filtering)
   * @default false
   */
  readonly showApply = input<boolean>(false);

  /**
   * Loading state
   * @description Shows loading indicator when true
   * @default false
   */
  readonly loading = input<boolean>(false);

  /**
   * Filter change event
   * @description Emitted when filter values change
   */
  readonly filtersChange = output<FilterValues>();

  /**
   * Filter apply event
   * @description Emitted when apply button is clicked (if showApply is true)
   */
  readonly filtersApply = output<FilterValues>();

  /**
   * Filter reset event
   * @description Emitted when filters are reset
   */
  readonly filtersReset = output<void>();

  /**
   * Internal collapsed state
   */
  readonly isCollapsed = signal(false);

  /**
   * Internal filter values (for pending changes when showApply is true)
   */
  readonly internalValues = signal<FilterValues>({});

  /**
   * Whether there are active filters
   */
  readonly hasActiveFilters = computed(() => {
    const vals = this.values();
    return Object.values(vals).some(v =>
      v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
    );
  });

  /**
   * Active filter count
   */
  readonly activeFilterCount = computed(() => {
    const vals = this.values();
    return Object.values(vals).filter(v =>
      v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
    ).length;
  });

  /**
   * Initialize component
   */
  ngOnInit(): void {
    this.isCollapsed.set(this.collapsed());
    this.internalValues.set({ ...this.values() });
  }

  /**
   * Toggle collapsed state
   */
  toggleCollapsed(): void {
    if (this.collapsible()) {
      this.isCollapsed.update(v => !v);
    }
  }

  /**
   * Handle field value change
   * @param key - Field key
   * @param value - New value
   */
  onFieldChange(key: string, value: unknown): void {
    if (this.showApply()) {
      this.internalValues.update(v => ({ ...v, [key]: value }));
    } else {
      this.filtersChange.emit({ ...this.values(), [key]: value });
    }
  }

  /**
   * Handle checkbox change for multiselect
   * @param key - Field key
   * @param option - Option value
   * @param checked - Whether checked
   */
  onMultiselectChange(key: string, option: string | number | boolean, checked: boolean): void {
    const currentValue = (this.showApply() ? this.internalValues()[key] : this.values()[key]) as (string | number | boolean)[] || [];
    let newValue: (string | number | boolean)[];

    if (checked) {
      newValue = [...currentValue, option];
    } else {
      newValue = currentValue.filter(v => v !== option);
    }

    this.onFieldChange(key, newValue);
  }

  /**
   * Check if option is selected in multiselect
   * @param key - Field key
   * @param option - Option value
   * @returns Whether the option is selected
   */
  isOptionSelected(key: string, option: string | number | boolean): boolean {
    const value = (this.showApply() ? this.internalValues()[key] : this.values()[key]) as (string | number | boolean)[] || [];
    return value.includes(option);
  }

  /**
   * Get current value for a field
   * @param key - Field key
   * @returns Current field value
   */
  getFieldValue(key: string): unknown {
    return this.showApply() ? this.internalValues()[key] : this.values()[key];
  }

  /**
   * Apply filters (when showApply is true)
   */
  applyFilters(): void {
    this.filtersApply.emit(this.internalValues());
    this.filtersChange.emit(this.internalValues());
  }

  /**
   * Reset all filters to default values
   */
  resetFilters(): void {
    const defaults: FilterValues = {};
    this.fields().forEach(field => {
      defaults[field.key] = field.defaultValue ?? '';
    });

    this.internalValues.set(defaults);

    if (!this.showApply()) {
      this.filtersChange.emit(defaults);
    }

    this.filtersReset.emit();
  }

  /**
   * Get column class for field
   * @param field - Filter field
   * @returns CSS class for grid column span
   */
  getColClass(field: FilterField): string {
    const cols = field.cols || 1;
    return `filter-field--col-${cols}`;
  }

  /**
   * Track function for ngFor
   */
  trackByKey(index: number, field: FilterField): string {
    return field.key;
  }

  /**
   * Track function for options
   */
  trackByOption(index: number, option: FilterOption): string | number | boolean {
    return option.value;
  }
}

/**
 * Category View Mode Configuration
 *
 * @description Centralized view mode settings for category product display
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of extracting
 * all configurations from components to dedicated config files.
 *
 * @pattern Configuration Extraction
 * - Single source of truth for view mode options
 * - Type-safe with const assertions
 * - Responsive grid settings
 * - Helper functions for view mode operations
 *
 * @swagger
 * tags:
 *   - name: Category View Mode Config
 *     description: View mode settings for category product display
 */

import { ProductViewMode } from '../../../shared/interfaces/category-filter.interface';

/**
 * View mode option interface for UI display
 *
 * @description Defines structure for view mode toggle buttons
 */
export interface ViewModeOption {
  /** View mode value */
  value: 'grid' | 'list';

  /** Material icon name */
  icon: string;

  /** Display label */
  label: string;

  /** Arabic label */
  labelArabic?: string;
}

/**
 * Available view mode options for category product listing
 *
 * @description Grid and List view modes with bilingual labels
 * @constant
 * @readonly
 */
export const VIEW_MODE_OPTIONS: readonly ViewModeOption[] = [
  {
    value: 'grid',
    icon: 'view_module',
    label: 'Grid View',
    labelArabic: 'عرض الشبكة'
  },
  {
    value: 'list',
    icon: 'view_list',
    label: 'List View',
    labelArabic: 'عرض القائمة'
  }
] as const;

/**
 * Default view mode configuration
 *
 * @description Default grid view with responsive columns
 * Mobile: 2 columns
 * Tablet: 3 columns
 * Desktop: 4 columns
 *
 * @constant
 */
export const DEFAULT_VIEW_MODE: ProductViewMode = {
  mode: 'grid',
  columns: 4,
  itemsPerRow: {
    mobile: 2,
    tablet: 3,
    desktop: 4
  }
};

/**
 * Grid view mode configuration
 *
 * @description Grid layout with responsive columns
 * @constant
 */
export const GRID_VIEW_MODE: ProductViewMode = {
  mode: 'grid',
  columns: 4,
  itemsPerRow: {
    mobile: 2,
    tablet: 3,
    desktop: 4
  }
};

/**
 * List view mode configuration
 *
 * @description List layout with single column
 * @constant
 */
export const LIST_VIEW_MODE: ProductViewMode = {
  mode: 'list',
  columns: 1,
  itemsPerRow: {
    mobile: 1,
    tablet: 1,
    desktop: 1
  }
};

/**
 * Gets view mode configuration by mode value
 *
 * @description Helper function to get view mode config
 * @param mode - View mode value ('grid' or 'list')
 * @returns View mode configuration
 *
 * @example
 * ```typescript
 * const gridConfig = getViewModeConfig('grid');
 * // Returns GRID_VIEW_MODE
 * ```
 */
export function getViewModeConfig(mode: 'grid' | 'list'): ProductViewMode {
  return mode === 'grid' ? GRID_VIEW_MODE : LIST_VIEW_MODE;
}

/**
 * Gets view mode option by value
 *
 * @description Helper function to find view mode option
 * @param value - View mode value
 * @returns View mode option or default grid
 *
 * @example
 * ```typescript
 * const option = getViewModeOption('list');
 * // Returns { value: 'list', icon: 'view_list', label: 'List View', ... }
 * ```
 */
export function getViewModeOption(value: 'grid' | 'list'): ViewModeOption {
  return VIEW_MODE_OPTIONS.find(opt => opt.value === value) || VIEW_MODE_OPTIONS[0];
}

/**
 * Creates view mode configuration for component
 *
 * @description Helper to create ProductViewMode with optional overrides
 * @param mode - View mode value
 * @param columns - Optional custom column count
 * @returns Complete ProductViewMode object
 *
 * @example
 * ```typescript
 * const viewMode = createViewMode('grid', 3);
 * // Returns grid view with 3 columns
 * ```
 */
export function createViewMode(
  mode: 'grid' | 'list' = 'grid',
  columns?: number
): ProductViewMode {
  const baseMode = getViewModeConfig(mode);

  if (columns && mode === 'grid') {
    return {
      ...baseMode,
      columns
    };
  }

  return baseMode;
}

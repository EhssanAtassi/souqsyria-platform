/**
 * Permission Category Component
 *
 * @description
 * Displays a category node in the permission tree with expand/collapse functionality,
 * category-level selection checkbox, and permission count badge.
 *
 * Features:
 * - Expandable/collapsible category
 * - Category-level checkbox (select all in category)
 * - Indeterminate state for partial selection
 * - Permission count badge
 * - Category icon and color coding
 * - Keyboard accessibility
 * - Smooth animations
 *
 * @module RoleManagement/Components/PermissionSelector
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-permission-category
 *   [categoryName]="'User Management'"
 *   [categoryIcon]="'people'"
 *   [permissionCount]="12"
 *   [expanded]="isExpanded"
 *   [allSelected]="allSelected"
 *   [indeterminate]="indeterminate"
 *   (toggleExpand)="onToggleExpand()"
 *   (selectionChange)="onCategorySelectionChange($event)"
 * ></app-permission-category>
 * ```
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  computed,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getCategoryColor } from '../../utils/permission-tree.utils';

/**
 * Permission Category Component
 *
 * @class PermissionCategoryComponent
 *
 * @description
 * Parent node in the permission tree representing a category of permissions.
 */
@Component({
  selector: 'app-permission-category',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './permission-category.component.html',
  styleUrls: ['./permission-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionCategoryComponent {
  // ==========================================================================
  // INPUTS
  // ==========================================================================

  /**
   * Category Key
   *
   * @description
   * Unique identifier for the category (e.g., 'user_management').
   * @required
   */
  @Input({ required: true }) categoryKey!: string;

  /**
   * Category Display Name
   *
   * @description
   * Human-readable category name.
   * @required
   */
  @Input({ required: true }) categoryName!: string;

  /**
   * Category Icon
   *
   * @description
   * Material icon name for the category.
   */
  @Input() categoryIcon = 'lock';

  /**
   * Permission Count
   *
   * @description
   * Number of permissions in this category.
   */
  @Input() permissionCount = 0;

  /**
   * Selected Count
   *
   * @description
   * Number of selected permissions in this category.
   */
  @Input() selectedCount = 0;

  /**
   * Expanded State
   *
   * @description
   * Whether the category is currently expanded.
   */
  @Input() expanded = false;

  /**
   * All Selected State
   *
   * @description
   * Whether all permissions in this category are selected.
   */
  @Input() allSelected = false;

  /**
   * Indeterminate State
   *
   * @description
   * Whether some (but not all) permissions in this category are selected.
   */
  @Input() indeterminate = false;

  /**
   * Disabled State
   *
   * @description
   * Whether this category is disabled (not selectable).
   */
  @Input() disabled = false;

  /**
   * Read Only Mode
   *
   * @description
   * If true, shows category without checkbox (display only).
   */
  @Input() readOnly = false;

  /**
   * Show Count Badge
   *
   * @description
   * Whether to display the permission count badge.
   */
  @Input() showCountBadge = true;

  /**
   * Show Selection Progress
   *
   * @description
   * Whether to show "X of Y selected" text.
   */
  @Input() showSelectionProgress = true;

  /**
   * Category Description
   *
   * @description
   * Optional description for tooltip.
   */
  @Input() categoryDescription = '';

  // ==========================================================================
  // OUTPUTS
  // ==========================================================================

  /**
   * Toggle Expand Event
   *
   * @description
   * Emits when category is expanded or collapsed.
   *
   * @event toggleExpand
   * @type {boolean} - New expanded state
   */
  @Output() toggleExpand = new EventEmitter<boolean>();

  /**
   * Selection Change Event
   *
   * @description
   * Emits when category checkbox state changes (select all/none).
   *
   * @event selectionChange
   * @type {boolean} - New selected state
   */
  @Output() selectionChange = new EventEmitter<boolean>();

  /**
   * Category Click Event
   *
   * @description
   * Emits when category is clicked (for details view, etc.).
   *
   * @event categoryClick
   * @type {string} - Category key
   */
  @Output() categoryClick = new EventEmitter<string>();

  // ==========================================================================
  // SIGNALS
  // ==========================================================================

  /**
   * Is Hovered Signal
   *
   * @description
   * Tracks hover state for visual effects.
   */
  isHovered = signal(false);

  /**
   * Is Animating Signal
   *
   * @description
   * Tracks expand/collapse animation state.
   */
  isAnimating = signal(false);

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  /**
   * Category Color
   *
   * @description
   * Computed color based on category key.
   */
  categoryColor = computed(() => getCategoryColor(this.categoryKey));

  /**
   * Expand Icon
   *
   * @description
   * Icon to show based on expanded state.
   */
  expandIcon = computed(() => (this.expanded ? 'expand_more' : 'chevron_right'));

  /**
   * Selection Progress Text
   *
   * @description
   * Generates "X of Y selected" text.
   */
  selectionProgressText = computed(() => {
    if (!this.showSelectionProgress) {
      return '';
    }

    if (this.selectedCount === 0) {
      return `${this.permissionCount} permissions`;
    }

    return `${this.selectedCount} of ${this.permissionCount} selected`;
  });

  /**
   * Tooltip Text
   *
   * @description
   * Generates tooltip text from category description and stats.
   */
  tooltipText = computed(() => {
    const parts: string[] = [];

    if (this.categoryDescription) {
      parts.push(this.categoryDescription);
    }

    parts.push(`${this.permissionCount} permissions`);

    if (this.selectedCount > 0) {
      parts.push(`${this.selectedCount} selected`);
    }

    return parts.join('\n');
  });

  /**
   * Checkbox Aria Label
   *
   * @description
   * Generates accessible label for checkbox.
   */
  checkboxAriaLabel = computed(() => {
    const action = this.allSelected ? 'Deselect all' : 'Select all';
    return `${action} ${this.categoryName} permissions`;
  });

  /**
   * Badge Color
   *
   * @description
   * Badge color based on selection state.
   */
  badgeColor = computed(() => {
    if (this.allSelected) {
      return 'primary';
    }
    if (this.indeterminate) {
      return 'accent';
    }
    return 'warn';
  });

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle Expand Toggle
   *
   * @description
   * Toggles category expansion and emits event.
   *
   * @param event - Mouse event
   */
  onToggleExpand(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.isAnimating.set(true);
    const newState = !this.expanded;
    this.toggleExpand.emit(newState);

    // Reset animation state after animation completes
    setTimeout(() => {
      this.isAnimating.set(false);
    }, 300);
  }

  /**
   * Handle Checkbox Change
   *
   * @description
   * Emits selection change event when checkbox is toggled.
   *
   * @param event - Checkbox change event
   */
  onCheckboxChange(event: MatCheckboxChange): void {
    if (!this.disabled && !this.readOnly) {
      event.source._elementRef.nativeElement.blur(); // Remove focus
      this.selectionChange.emit(event.checked);
    }
  }

  /**
   * Handle Checkbox Click
   *
   * @description
   * Prevents event propagation to avoid toggling expand.
   *
   * @param event - Mouse event
   */
  onCheckboxClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Handle Category Click
   *
   * @description
   * Emits category click event and toggles expansion.
   *
   * @param event - Mouse event
   */
  onCategoryClick(event: MouseEvent): void {
    // Don't toggle if clicking checkbox
    const target = event.target as HTMLElement;
    if (target.closest('.mat-mdc-checkbox')) {
      return;
    }

    this.categoryClick.emit(this.categoryKey);
    this.onToggleExpand();
  }

  /**
   * Handle Mouse Enter
   *
   * @description
   * Sets hover state to true.
   */
  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  /**
   * Handle Mouse Leave
   *
   * @description
   * Sets hover state to false.
   */
  onMouseLeave(): void {
    this.isHovered.set(false);
  }

  /**
   * Handle Keyboard Navigation
   *
   * @description
   * Handles Enter/Space to toggle expansion, Arrow keys for navigation.
   *
   * @param event - Keyboard event
   */
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onToggleExpand();
        break;
      case 'ArrowRight':
        if (!this.expanded) {
          event.preventDefault();
          this.onToggleExpand();
        }
        break;
      case 'ArrowLeft':
        if (this.expanded) {
          event.preventDefault();
          this.onToggleExpand();
        }
        break;
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get Component Classes
   *
   * @description
   * Generates dynamic CSS classes for the component.
   *
   * @returns Object with class flags
   */
  getComponentClasses(): Record<string, boolean> {
    return {
      'category-item': true,
      'category-item--expanded': this.expanded,
      'category-item--collapsed': !this.expanded,
      'category-item--selected': this.allSelected,
      'category-item--indeterminate': this.indeterminate,
      'category-item--disabled': this.disabled,
      'category-item--read-only': this.readOnly,
      'category-item--hovered': this.isHovered(),
      'category-item--animating': this.isAnimating()
    };
  }

  /**
   * Get Progress Percentage
   *
   * @description
   * Calculates selection progress as percentage.
   *
   * @returns Percentage (0-100)
   */
  getProgressPercentage(): number {
    if (this.permissionCount === 0) {
      return 0;
    }
    return Math.round((this.selectedCount / this.permissionCount) * 100);
  }
}

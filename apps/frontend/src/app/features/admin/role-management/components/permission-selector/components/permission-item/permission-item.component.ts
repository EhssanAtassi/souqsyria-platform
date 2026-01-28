/**
 * Permission Item Component
 *
 * @description
 * Displays a single permission as a selectable checkbox item in the permission tree.
 * Shows permission name, description (tooltip), key badge, and provides visual feedback.
 *
 * Features:
 * - Checkbox selection
 * - Description tooltip
 * - Permission key badge
 * - Color coding by category
 * - Disabled state support
 * - Keyboard accessibility
 * - Hover effects
 *
 * @module RoleManagement/Components/PermissionSelector
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-permission-item
 *   [permission]="permission"
 *   [selected]="isSelected"
 *   [disabled]="isDisabled"
 *   (selectionChange)="onSelectionChange($event)"
 * ></app-permission-item>
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Permission } from '../../../../models';
import { getCategoryColor } from '../../utils/permission-tree.utils';

/**
 * Permission Item Component
 *
 * @class PermissionItemComponent
 *
 * @description
 * Leaf node in the permission tree representing a single selectable permission.
 */
@Component({
  selector: 'app-permission-item',
  standalone: true,
  imports: [
    CommonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './permission-item.component.html',
  styleUrls: ['./permission-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionItemComponent {
  // ==========================================================================
  // INPUTS
  // ==========================================================================

  /**
   * Permission Data
   *
   * @description
   * The permission entity to display.
   * @required
   */
  @Input({ required: true }) permission!: Permission;

  /**
   * Selection State
   *
   * @description
   * Whether this permission is currently selected.
   */
  @Input() selected = false;

  /**
   * Disabled State
   *
   * @description
   * Whether this permission is disabled (not selectable).
   */
  @Input() disabled = false;

  /**
   * Read Only Mode
   *
   * @description
   * If true, shows permission without checkbox (display only).
   */
  @Input() readOnly = false;

  /**
   * Show Key Badge
   *
   * @description
   * Whether to display the permission key as a badge.
   */
  @Input() showKeyBadge = true;

  /**
   * Show Description Tooltip
   *
   * @description
   * Whether to show description on hover.
   */
  @Input() showDescriptionTooltip = true;

  /**
   * Show System Badge
   *
   * @description
   * Whether to show system permission indicator.
   */
  @Input() showSystemBadge = true;

  /**
   * Highlight Search Term
   *
   * @description
   * Term to highlight in permission name (for search results).
   */
  @Input() highlightTerm = '';

  // ==========================================================================
  // OUTPUTS
  // ==========================================================================

  /**
   * Selection Change Event
   *
   * @description
   * Emits when checkbox state changes.
   *
   * @event selectionChange
   * @type {boolean} - New selected state
   */
  @Output() selectionChange = new EventEmitter<boolean>();

  /**
   * Permission Click Event
   *
   * @description
   * Emits when permission is clicked (for details view, etc.).
   *
   * @event permissionClick
   * @type {Permission} - The clicked permission
   */
  @Output() permissionClick = new EventEmitter<Permission>();

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

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  /**
   * Category Color
   *
   * @description
   * Computed color based on permission category.
   */
  categoryColor = computed(() =>
    getCategoryColor(this.permission?.category || 'default')
  );

  /**
   * Tooltip Text
   *
   * @description
   * Generates tooltip text from permission description and metadata.
   */
  tooltipText = computed(() => {
    if (!this.permission || !this.showDescriptionTooltip) {
      return '';
    }

    const parts: string[] = [this.permission.description];

    if (this.permission.resource && this.permission.action) {
      parts.push(`Resource: ${this.permission.resource}`);
      parts.push(`Action: ${this.permission.action}`);
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
    const action = this.selected ? 'Deselect' : 'Select';
    return `${action} ${this.permission?.displayName || 'permission'}`;
  });

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle Checkbox Change
   *
   * @description
   * Emits selection change event when checkbox is toggled.
   *
   * @param checked - New checked state
   */
  onCheckboxChange(checked: boolean): void {
    if (!this.disabled && !this.readOnly) {
      this.selectionChange.emit(checked);
    }
  }

  /**
   * Handle Permission Click
   *
   * @description
   * Emits permission click event (excluding checkbox clicks).
   *
   * @param event - Mouse event
   */
  onPermissionClick(event: MouseEvent): void {
    // Don't emit if clicking checkbox
    const target = event.target as HTMLElement;
    if (target.closest('.mat-mdc-checkbox')) {
      return;
    }

    this.permissionClick.emit(this.permission);
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

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get Highlighted Name HTML
   *
   * @description
   * Returns permission name with highlighted search term.
   *
   * @returns HTML string with highlighted term
   */
  getHighlightedName(): string {
    if (!this.highlightTerm || !this.permission) {
      return this.permission?.displayName || '';
    }

    const name = this.permission.displayName;
    const term = this.highlightTerm;
    const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');

    return name.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Escape Regex Special Characters
   *
   * @description
   * Escapes special regex characters in search term.
   *
   * @param str - String to escape
   * @returns Escaped string
   *
   * @private
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get Action Icon
   *
   * @description
   * Returns Material icon name based on permission action.
   *
   * @returns Icon name
   */
  getActionIcon(): string {
    if (!this.permission?.action) {
      return 'lock';
    }

    const iconMap: Record<string, string> = {
      view: 'visibility',
      create: 'add_circle',
      edit: 'edit',
      delete: 'delete',
      manage: 'admin_panel_settings',
      execute: 'play_arrow',
      approve: 'check_circle',
      reject: 'cancel'
    };

    return iconMap[this.permission.action.toLowerCase()] || 'lock';
  }

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
      'permission-item': true,
      'permission-item--selected': this.selected,
      'permission-item--disabled': this.disabled,
      'permission-item--read-only': this.readOnly,
      'permission-item--hovered': this.isHovered(),
      'permission-item--system': this.permission?.isSystem || false
    };
  }
}

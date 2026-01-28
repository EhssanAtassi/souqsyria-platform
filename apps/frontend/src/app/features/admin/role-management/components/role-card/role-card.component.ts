/**
 * Role Card Component
 *
 * @description
 * Displays individual role information in a Material card.
 * Shows role name, description, permissions count, user count, and actions.
 *
 * @features
 * - System role badge for protected roles
 * - Priority badge with color coding
 * - Permission and user count stats
 * - Action buttons (edit, clone, delete)
 * - Selected state styling
 * - Hover elevation effect
 *
 * @architecture
 * - Dumb/Presentational component
 * - OnPush change detection
 * - No service injection
 * - Pure input/output communication
 *
 * @swagger
 * components:
 *   RoleCard:
 *     type: object
 *     description: Card display of a single role
 *
 * @example
 * ```html
 * <app-role-card
 *   [role]="role"
 *   [selected]="true"
 *   (edit)="onEdit(role)"
 *   (clone)="onClone(role)"
 *   (delete)="onDelete(role)">
 * </app-role-card>
 * ```
 */

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { Role } from '../../models';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { SystemRoleBadgeComponent } from '../system-role-badge/system-role-badge.component';

/**
 * Role Card Component
 *
 * @class RoleCardComponent
 */
@Component({
  selector: 'app-role-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    PriorityBadgeComponent,
    SystemRoleBadgeComponent
  ],
  templateUrl: './role-card.component.html',
  styleUrls: ['./role-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.selected]': 'selected()',
    '[class.system-role]': 'role().isSystem',
    '[attr.tabindex]': '0',
    '[attr.role]': '"button"',
    '[attr.aria-label]': '"Role: " + role().displayName'
  }
})
export class RoleCardComponent {
  /**
   * Input: Role data
   *
   * @description
   * Role entity to display in card.
   *
   * @type {Role}
   */
  role = input.required<Role>();

  /**
   * Input: Selected state
   *
   * @description
   * Whether this role card is currently selected.
   *
   * @type {boolean}
   */
  selected = input<boolean>(false);

  /**
   * Output: Edit event
   *
   * @description
   * Emitted when edit button is clicked.
   *
   * @emits {void}
   */
  edit = output<void>();

  /**
   * Output: Clone event
   *
   * @description
   * Emitted when clone button is clicked.
   *
   * @emits {void}
   */
  clone = output<void>();

  /**
   * Output: Delete event
   *
   * @description
   * Emitted when delete button is clicked.
   *
   * @emits {void}
   */
  delete = output<void>();

  /**
   * Handle edit button click
   *
   * @description
   * Prevents event propagation and emits edit event.
   *
   * @param {Event} event - Click event
   *
   * @public
   */
  onEditClick(event: Event): void {
    event.stopPropagation();
    this.edit.emit();
  }

  /**
   * Handle clone button click
   *
   * @description
   * Prevents event propagation and emits clone event.
   *
   * @param {Event} event - Click event
   *
   * @public
   */
  onCloneClick(event: Event): void {
    event.stopPropagation();
    this.clone.emit();
  }

  /**
   * Handle delete button click
   *
   * @description
   * Prevents event propagation and emits delete event.
   *
   * @param {Event} event - Click event
   *
   * @public
   */
  onDeleteClick(event: Event): void {
    event.stopPropagation();
    this.delete.emit();
  }

  /**
   * Get truncated description
   *
   * @description
   * Limits description to 100 characters with ellipsis.
   *
   * @returns {string} Truncated description
   *
   * @public
   */
  getTruncatedDescription(): string {
    const description = this.role().description;
    if (!description) return '';

    return description.length > 100
      ? description.substring(0, 100) + '...'
      : description;
  }

  /**
   * Check if delete is allowed
   *
   * @description
   * System roles and roles with users cannot be deleted.
   *
   * @returns {boolean} True if delete is allowed
   *
   * @public
   */
  canDelete(): boolean {
    const role = this.role();
    return !role.isSystem && (role.userCount === 0 || role.userCount === undefined);
  }
}

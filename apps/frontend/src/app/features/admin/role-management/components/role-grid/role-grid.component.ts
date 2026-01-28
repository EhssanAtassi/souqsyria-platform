/**
 * Role Grid Component
 *
 * @description
 * Presentational component that displays roles in a responsive grid layout.
 * Delegates actions to parent container component.
 *
 * @features
 * - Responsive grid (3/2/1 columns for desktop/tablet/mobile)
 * - Role selection highlighting
 * - Loading state
 * - Empty state
 * - TrackBy optimization
 *
 * @architecture
 * - Dumb/Presentational component
 * - OnPush change detection
 * - No service injection
 * - Pure input/output communication
 *
 * @swagger
 * components:
 *   RoleGrid:
 *     type: object
 *     description: Grid display of role cards
 *
 * @example
 * ```html
 * <app-role-grid
 *   [roles]="roles$ | async"
 *   [loading]="loading$ | async"
 *   [selectedRoleId]="selectedRoleId$ | async"
 *   (roleSelect)="onRoleSelect($event)"
 *   (roleEdit)="onEdit($event)"
 *   (roleClone)="onClone($event)"
 *   (roleDelete)="onDelete($event)">
 * </app-role-grid>
 * ```
 */

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Role } from '../../models';
import { RoleCardComponent } from '../role-card/role-card.component';

/**
 * Role Grid Component
 *
 * @class RoleGridComponent
 */
@Component({
  selector: 'app-role-grid',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RoleCardComponent
  ],
  templateUrl: './role-grid.component.html',
  styleUrls: ['./role-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleGridComponent {
  /**
   * Input: Array of roles to display
   *
   * @description
   * List of roles from store. Can be null during initial load.
   *
   * @type {Role[] | null}
   */
  roles = input<Role[] | null>(null);

  /**
   * Input: Loading state
   *
   * @description
   * Shows loading indicator when true.
   *
   * @type {boolean | null}
   */
  loading = input<boolean | null>(false);

  /**
   * Input: Selected role ID
   *
   * @description
   * ID of currently selected role for highlighting.
   *
   * @type {number | null}
   */
  selectedRoleId = input<number | null>(null);

  /**
   * Output: Role selection event
   *
   * @description
   * Emitted when user clicks on a role card.
   *
   * @emits {Role}
   */
  roleSelect = output<Role>();

  /**
   * Output: Role edit event
   *
   * @description
   * Emitted when user clicks edit button on role card.
   *
   * @emits {Role}
   */
  roleEdit = output<Role>();

  /**
   * Output: Role clone event
   *
   * @description
   * Emitted when user clicks clone button on role card.
   *
   * @emits {Role}
   */
  roleClone = output<Role>();

  /**
   * Output: Role delete event
   *
   * @description
   * Emitted when user clicks delete button on role card.
   *
   * @emits {Role}
   */
  roleDelete = output<Role>();

  /**
   * TrackBy function for ngFor optimization
   *
   * @description
   * Helps Angular track items by ID to minimize DOM operations.
   *
   * @param {number} index - Item index
   * @param {Role} role - Role item
   * @returns {number} Unique role ID
   *
   * @public
   */
  trackByRoleId(index: number, role: Role): number {
    return role.id;
  }

  /**
   * Handle role card click
   *
   * @description
   * Emits roleSelect event when card is clicked.
   *
   * @param {Role} role - Clicked role
   *
   * @public
   */
  onCardClick(role: Role): void {
    this.roleSelect.emit(role);
  }

  /**
   * Handle edit button click
   *
   * @description
   * Emits roleEdit event. Stops propagation to prevent card selection.
   *
   * @param {Role} role - Role to edit
   *
   * @public
   */
  onEditClick(role: Role): void {
    this.roleEdit.emit(role);
  }

  /**
   * Handle clone button click
   *
   * @description
   * Emits roleClone event. Stops propagation to prevent card selection.
   *
   * @param {Role} role - Role to clone
   *
   * @public
   */
  onCloneClick(role: Role): void {
    this.roleClone.emit(role);
  }

  /**
   * Handle delete button click
   *
   * @description
   * Emits roleDelete event. Stops propagation to prevent card selection.
   *
   * @param {Role} role - Role to delete
   *
   * @public
   */
  onDeleteClick(role: Role): void {
    this.roleDelete.emit(role);
  }
}

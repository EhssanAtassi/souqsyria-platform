/**
 * Role Detail Panel Component
 *
 * @description
 * Sliding detail panel displaying comprehensive role information.
 * Shows from right side with role details, permissions, and users.
 */

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

import { Role } from '../../models';
import { PriorityBadgeComponent } from '../priority-badge/priority-badge.component';
import { SystemRoleBadgeComponent } from '../system-role-badge/system-role-badge.component';

@Component({
  selector: 'app-role-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatExpansionModule,
    PriorityBadgeComponent,
    SystemRoleBadgeComponent
  ],
  templateUrl: './role-detail-panel.component.html',
  styleUrls: ['./role-detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
/**
 * Role Detail Panel Component
 *
 * @description
 * Presentational component that displays role details in a side panel.
 * Accepts role data and emits user actions.
 */
export class RoleDetailPanelComponent {
  /**
   * Role data to display
   *
   * @description
   * The role entity to show in the detail panel.
   * Can be null or undefined when no role is selected.
   */
  role = input<Role | null | undefined>(null);

  /**
   * Panel open state
   *
   * @description
   * Controls whether the detail panel is visible.
   */
  open = input<boolean>(false);

  /**
   * Close event
   *
   * @description
   * Emitted when user clicks close button.
   */
  close = output<void>();

  /**
   * Edit event
   *
   * @description
   * Emitted when user clicks edit button.
   */
  edit = output<Role>();

  /**
   * Clone event
   *
   * @description
   * Emitted when user clicks clone button.
   */
  clone = output<Role>();
  delete = output<Role>();

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    if (this.role()) {
      this.edit.emit(this.role()!);
    }
  }

  onClone(): void {
    if (this.role()) {
      this.clone.emit(this.role()!);
    }
  }

  onDelete(): void {
    if (this.role()) {
      this.delete.emit(this.role()!);
    }
  }
}

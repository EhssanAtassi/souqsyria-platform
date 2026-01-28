/**
 * User Detail Panel Component
 *
 * @description
 * Right-side drawer displaying comprehensive user details with 4 tabs:
 * - Profile: Personal and account information
 * - Roles: Business/admin roles and effective permissions
 * - Activity: User activity timeline with pagination
 * - Security: Security actions, metrics, and recent security events
 *
 * Features:
 * - Responsive drawer (400px desktop, full-screen mobile)
 * - Tab-based navigation with Material icons
 * - Smooth slide-in animation
 * - OnPush change detection for performance
 *
 * @module UserManagement/Components
 * @version 1.0.0
 *
 * @example
 * ```html
 * <app-user-detail-panel
 *   [user]="selectedUser"
 *   (close)="onClosePanel()"
 *   (ban)="onBanUser($event)"
 *   (suspend)="onSuspendUser($event)"
 *   (assignRole)="onAssignRole($event)"
 *   (resetPassword)="onResetPassword($event)"
 * />
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserDetailPanelEvents:
 *       type: object
 *       properties:
 *         close:
 *           type: void
 *           description: Emitted when panel is closed
 *         ban:
 *           type: ManagedUser
 *           description: Emitted when ban action is triggered
 *         suspend:
 *           type: ManagedUser
 *           description: Emitted when suspend action is triggered
 *         assignRole:
 *           type: ManagedUser
 *           description: Emitted when role assignment is triggered
 *         resetPassword:
 *           type: ManagedUser
 *           description: Emitted when password reset is triggered
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ManagedUser } from '../../models/user.model';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { UserProfileTabComponent } from './tabs/user-profile-tab/user-profile-tab.component';
import { UserRolesTabComponent } from './tabs/user-roles-tab/user-roles-tab.component';
import { UserActivityTabComponent } from './tabs/user-activity-tab/user-activity-tab.component';
import { UserSecurityTabComponent } from './tabs/user-security-tab/user-security-tab.component';

/**
 * User Detail Panel Component Class
 *
 * @description
 * Container component for user detail drawer with tabbed navigation.
 */
@Component({
  selector: 'app-user-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    UserAvatarComponent,
    StatusBadgeComponent,
    UserProfileTabComponent,
    UserRolesTabComponent,
    UserActivityTabComponent,
    UserSecurityTabComponent
  ],
  templateUrl: './user-detail-panel.component.html',
  styleUrls: ['./user-detail-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailPanelComponent {
  /**
   * Selected User
   *
   * @description
   * User to display in the detail panel.
   * Panel opens when user is not null.
   */
  @Input() user: ManagedUser | null = null;

  /**
   * Close Event
   *
   * @description
   * Emitted when panel close button is clicked.
   */
  @Output() close = new EventEmitter<void>();

  /**
   * Ban User Event
   *
   * @description
   * Emitted when ban action is triggered from Security tab.
   */
  @Output() ban = new EventEmitter<ManagedUser>();

  /**
   * Suspend User Event
   *
   * @description
   * Emitted when suspend action is triggered from Security tab.
   */
  @Output() suspend = new EventEmitter<ManagedUser>();

  /**
   * Assign Role Event
   *
   * @description
   * Emitted when role assignment is triggered from Roles tab.
   */
  @Output() assignRole = new EventEmitter<ManagedUser>();

  /**
   * Reset Password Event
   *
   * @description
   * Emitted when password reset is triggered from Security tab.
   */
  @Output() resetPassword = new EventEmitter<ManagedUser>();

  /**
   * Selected Tab Index
   *
   * @description
   * Currently active tab index (0-3).
   * Used for tab state management.
   */
  selectedTabIndex = signal(0);

  /**
   * Handle Close Action
   *
   * @description
   * Closes the detail panel and emits close event.
   * Resets tab to first position.
   */
  onClose(): void {
    this.selectedTabIndex.set(0);
    this.close.emit();
  }

  /**
   * Handle Tab Change
   *
   * @description
   * Updates selected tab index when user switches tabs.
   *
   * @param index - New tab index (0-3)
   */
  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
  }

  /**
   * Handle Ban Action
   *
   * @description
   * Propagates ban event from Security tab to parent.
   *
   * @param user - User to ban
   */
  onBan(user: ManagedUser): void {
    this.ban.emit(user);
  }

  /**
   * Handle Suspend Action
   *
   * @description
   * Propagates suspend event from Security tab to parent.
   *
   * @param user - User to suspend
   */
  onSuspend(user: ManagedUser): void {
    this.suspend.emit(user);
  }

  /**
   * Handle Assign Role Action
   *
   * @description
   * Propagates role assignment event from Roles tab to parent.
   *
   * @param user - User to assign role to
   */
  onAssignRole(user: ManagedUser): void {
    this.assignRole.emit(user);
  }

  /**
   * Handle Reset Password Action
   *
   * @description
   * Propagates password reset event from Security tab to parent.
   *
   * @param user - User to reset password for
   */
  onResetPassword(user: ManagedUser): void {
    this.resetPassword.emit(user);
  }
}

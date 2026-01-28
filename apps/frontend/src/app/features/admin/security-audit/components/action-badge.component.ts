/**
 * Action Badge Component
 * 
 * @description Small inline component for displaying security audit action types.
 * Renders action name in a color-coded Material chip for quick visual identification.
 * 
 * Color Coding:
 * - Red (warn): ACCESS_DENIED, LOGIN_FAILED, USER_BANNED, USER_SUSPENDED
 * - Green (primary): ACCESS_GRANTED, LOGIN_SUCCESS, USER_UNBANNED, USER_UNSUSPENDED
 * - Blue (accent): PERMISSION_CHECK, ROLE_ASSIGNED, ROLE_MODIFIED, PERMISSION_MODIFIED
 * - Default: LOGOUT and other actions
 * 
 * @example
 * ```html
 * <app-action-badge [action]="event.action" />
 * ```
 * 
 * @swagger
 * components:
 *   ActionBadge:
 *     description: Visual indicator for security audit action types
 *     properties:
 *       action:
 *         type: string
 *         enum: [PERMISSION_CHECK, ACCESS_DENIED, ACCESS_GRANTED, ROLE_MODIFIED, ROLE_ASSIGNED, PERMISSION_MODIFIED, USER_BANNED, USER_UNBANNED, USER_SUSPENDED, USER_UNSUSPENDED, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT]
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

import { SecurityAuditAction, getActionLabel } from '../models';

@Component({
  selector: 'app-action-badge',
  standalone: true,
  imports: [MatChipsModule],
  template: `
    <mat-chip [class]="'action-' + action.toLowerCase()" [attr.aria-label]="getLabel()">
      {{ getLabel() }}
    </mat-chip>
  `,
  styles: [
    `
      mat-chip {
        font-size: 12px;
        font-weight: 500;
        min-height: 24px;
        padding: 4px 8px;
      }

      // Red - Failed/Denied actions
      .action-access_denied,
      .action-login_failed,
      .action-user_banned,
      .action-user_suspended {
        background: #ffebee;
        color: #c62828;
      }

      // Green - Success actions
      .action-access_granted,
      .action-login_success,
      .action-user_unbanned,
      .action-user_unsuspended {
        background: #e8f5e9;
        color: #2e7d32;
      }

      // Blue - Administrative actions
      .action-permission_check,
      .action-role_assigned,
      .action-role_modified,
      .action-permission_modified {
        background: #e3f2fd;
        color: #1565c0;
      }

      // Default - Other actions
      .action-logout {
        background: #f5f5f5;
        color: #616161;
      }

      // Dark theme
      .dark-theme {
        .action-access_denied,
        .action-login_failed,
        .action-user_banned,
        .action-user_suspended {
          background: rgba(244, 67, 54, 0.2);
          color: #ef9a9a;
        }

        .action-access_granted,
        .action-login_success,
        .action-user_unbanned,
        .action-user_unsuspended {
          background: rgba(76, 175, 80, 0.2);
          color: #a5d6a7;
        }

        .action-permission_check,
        .action-role_assigned,
        .action-role_modified,
        .action-permission_modified {
          background: rgba(33, 150, 243, 0.2);
          color: #90caf9;
        }

        .action-logout {
          background: rgba(255, 255, 255, 0.1);
          color: #bdbdbd;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionBadgeComponent {
  /**
   * Security audit action to display
   */
  @Input({ required: true }) action!: SecurityAuditAction;

  /**
   * Get human-readable label for the action
   * 
   * @returns Formatted action label
   */
  getLabel(): string {
    return getActionLabel(this.action);
  }
}

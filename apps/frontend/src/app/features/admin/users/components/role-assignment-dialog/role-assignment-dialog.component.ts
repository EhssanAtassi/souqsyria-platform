/**
 * @file role-assignment-dialog.component.ts
 * @description Dialog component for managing user role assignments.
 *              Allows adding, removing, and replacing user roles.
 * @module AdminDashboard/Users/Components
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { AdminUsersService } from '../../../services';
import { UserListItem, UserRole } from '../../../interfaces';

/**
 * Dialog input data interface
 */
export interface RoleAssignmentDialogData {
  /** User to manage roles for */
  user: UserListItem;
}

/**
 * Dialog result interface
 */
export interface RoleAssignmentDialogResult {
  /** Whether operation was successful */
  success: boolean;
  /** Updated user (if successful) */
  user?: UserListItem;
}

/**
 * Role Assignment Dialog Component
 * @description Modal dialog for managing user role assignments.
 *              Displays available roles with checkboxes and allows
 *              adding or replacing user's current roles.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(RoleAssignmentDialogComponent, {
 *   width: '500px',
 *   data: { user: selectedUser }
 * });
 *
 * dialogRef.afterClosed().subscribe(result => {
 *   if (result?.success) {
 *     console.log('Roles updated');
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-role-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="role-dialog">
      <!-- Dialog Header -->
      <header class="role-dialog__header">
        <h2 class="role-dialog__title">Manage User Roles</h2>
        <p class="role-dialog__subtitle">
          Assign roles to {{ data.user.fullName }}
        </p>
      </header>

      <!-- Dialog Content -->
      <div class="role-dialog__content" mat-dialog-content>
        <!-- Loading State -->
        <div *ngIf="isLoadingRoles()" class="role-dialog__loading">
          <span class="material-icons animate-spin">sync</span>
          <p>Loading available roles...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="errorMessage()" class="role-dialog__error">
          <span class="material-icons">error_outline</span>
          <p>{{ errorMessage() }}</p>
        </div>

        <!-- Role Selection -->
        <div *ngIf="!isLoadingRoles() && !errorMessage()" class="role-dialog__roles">
          <p class="role-dialog__instruction">
            Select the roles you want to assign to this user:
          </p>

          <div class="role-dialog__role-list">
            <label
              *ngFor="let role of availableRoles()"
              class="role-dialog__role-item"
              [class.role-dialog__role-item--selected]="isRoleSelected(role.id)"
            >
              <input
                type="checkbox"
                [checked]="isRoleSelected(role.id)"
                (change)="toggleRole(role.id)"
                class="role-dialog__checkbox"
              />
              <div class="role-dialog__role-info">
                <span class="role-dialog__role-name">{{ role.displayName }}</span>
                <span class="role-dialog__role-description">
                  {{ getRoleDescription(role.name) }}
                </span>
              </div>
            </label>
          </div>

          <!-- Replace Existing Toggle -->
          <div class="role-dialog__option">
            <label class="role-dialog__toggle">
              <input
                type="checkbox"
                [(ngModel)]="replaceExisting"
                class="role-dialog__checkbox"
              />
              <div class="role-dialog__toggle-info">
                <span class="role-dialog__toggle-label">Replace existing roles</span>
                <span class="role-dialog__toggle-hint">
                  When enabled, all current roles will be removed and only selected roles will be assigned.
                </span>
              </div>
            </label>
          </div>

          <!-- Current Roles Summary -->
          <div class="role-dialog__current" *ngIf="data.user.roles.length > 0">
            <span class="role-dialog__current-label">Current roles:</span>
            <div class="role-dialog__current-roles">
              <span
                *ngFor="let role of data.user.roles"
                class="role-dialog__current-badge"
                [attr.data-role]="role.name"
              >
                {{ role.displayName }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dialog Actions -->
      <footer class="role-dialog__actions" mat-dialog-actions>
        <button
          type="button"
          class="role-dialog__btn role-dialog__btn--secondary"
          (click)="onCancel()"
          [disabled]="isSubmitting()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="role-dialog__btn role-dialog__btn--primary"
          (click)="onSubmit()"
          [disabled]="isSubmitting() || selectedRoleIds().length === 0"
        >
          <span *ngIf="isSubmitting()" class="material-icons animate-spin">sync</span>
          <span>{{ isSubmitting() ? 'Saving...' : 'Save Roles' }}</span>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .role-dialog {
      min-width: 400px;

      &__header {
        padding: 1.5rem 1.5rem 0;
      }

      &__title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 0.25rem 0;
      }

      &__subtitle {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }

      &__content {
        padding: 1.5rem !important;
      }

      &__loading,
      &__error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: #6b7280;

        .material-icons {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        p {
          margin: 0;
        }
      }

      &__error {
        color: #dc2626;
      }

      &__instruction {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1rem 0;
      }

      &__role-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
      }

      &__role-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        &--selected {
          background: #eff6ff;
          border-color: #3b82f6;
        }
      }

      &__checkbox {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        cursor: pointer;
        accent-color: #1e3a8a;
      }

      &__role-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__role-name {
        font-weight: 500;
        color: #1f2937;
      }

      &__role-description {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__option {
        padding: 0.75rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
      }

      &__toggle {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
      }

      &__toggle-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      &__toggle-label {
        font-weight: 500;
        color: #1f2937;
      }

      &__toggle-hint {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__current {
        padding: 0.75rem;
        background: #fef3c7;
        border-radius: 0.5rem;
      }

      &__current-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: #92400e;
        margin-bottom: 0.5rem;
      }

      &__current-roles {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      &__current-badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        background: white;
        border: 1px solid #fcd34d;
        color: #92400e;
        font-size: 0.75rem;
        font-weight: 500;
        border-radius: 9999px;
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1rem 1.5rem 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.25rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .material-icons {
          font-size: 1rem;
        }

        &--secondary {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;

          &:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #d1d5db;
          }
        }

        &--primary {
          background: #1e3a8a;
          border: 1px solid #1e3a8a;
          color: white;

          &:hover:not(:disabled) {
            background: #1e40af;
            border-color: #1e40af;
          }
        }
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RoleAssignmentDialogComponent implements OnInit {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly dialogRef = inject(MatDialogRef<RoleAssignmentDialogComponent>);
  readonly data: RoleAssignmentDialogData = inject(MAT_DIALOG_DATA);
  private readonly usersService = inject(AdminUsersService);
  private readonly snackBar = inject(MatSnackBar);

  // =========================================================================
  // STATE
  // =========================================================================

  /** Loading state for fetching roles */
  readonly isLoadingRoles = signal(false);

  /** Submitting state */
  readonly isSubmitting = signal(false);

  /** Error message */
  readonly errorMessage = signal<string | null>(null);

  /** Available roles from API */
  readonly availableRoles = signal<UserRole[]>([]);

  /** Selected role IDs */
  readonly selectedRoleIds = signal<number[]>([]);

  /** Whether to replace existing roles */
  replaceExisting = false;

  // =========================================================================
  // ROLE DESCRIPTIONS
  // =========================================================================

  /** Role descriptions map */
  private readonly roleDescriptions: Record<string, string> = {
    super_admin: 'Full system access with all permissions',
    admin: 'Administrative access to most features',
    moderator: 'Can moderate content and manage users',
    customer_service: 'Handle customer inquiries and support',
    vendor_manager: 'Manage vendor accounts and products'
  };

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    this.loadAvailableRoles();
    // Initialize with current user roles
    this.selectedRoleIds.set(this.data.user.roles.map(r => r.id));
  }

  // =========================================================================
  // DATA LOADING
  // =========================================================================

  /**
   * Load available roles from API
   */
  private loadAvailableRoles(): void {
    this.isLoadingRoles.set(true);
    this.errorMessage.set(null);

    this.usersService.getAvailableRoles()
      .pipe(finalize(() => this.isLoadingRoles.set(false)))
      .subscribe({
        next: (roles) => {
          this.availableRoles.set(roles);
        },
        error: (error) => {
          console.error('Failed to load roles:', error);
          this.errorMessage.set('Failed to load available roles. Please try again.');
        }
      });
  }

  // =========================================================================
  // ROLE SELECTION
  // =========================================================================

  /**
   * Check if a role is selected
   * @param roleId - Role ID to check
   * @returns Whether the role is selected
   */
  isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds().includes(roleId);
  }

  /**
   * Toggle role selection
   * @param roleId - Role ID to toggle
   */
  toggleRole(roleId: number): void {
    const current = this.selectedRoleIds();
    if (current.includes(roleId)) {
      this.selectedRoleIds.set(current.filter(id => id !== roleId));
    } else {
      this.selectedRoleIds.set([...current, roleId]);
    }
  }

  /**
   * Get description for a role
   * @param roleName - Role system name
   * @returns Role description
   */
  getRoleDescription(roleName: string): string {
    return this.roleDescriptions[roleName] || 'Role with specific permissions';
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /**
   * Submit role changes
   */
  onSubmit(): void {
    const roleIds = this.selectedRoleIds();
    if (roleIds.length === 0) return;

    this.isSubmitting.set(true);

    this.usersService.assignRoles(this.data.user.id, {
      roleIds,
      replaceExisting: this.replaceExisting
    })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (error) => {
          console.error('Failed to assign roles:', error);
          this.snackBar.open('Failed to update user roles', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}

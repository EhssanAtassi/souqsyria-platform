/**
 * @file status-change-dialog.component.ts
 * @description Dialog component for changing user account status.
 *              Supports activate, suspend, and ban operations with reason input.
 * @module AdminDashboard/Users/Components
 */

import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { AdminUsersService } from '../../../services';
import { UserListItem, UserStatus } from '../../../interfaces';

/**
 * Dialog input data interface
 */
export interface StatusChangeDialogData {
  /** User to change status for */
  user: UserListItem;
}

/**
 * Dialog result interface
 */
export interface StatusChangeDialogResult {
  /** Whether operation was successful */
  success: boolean;
  /** New status (if successful) */
  status?: UserStatus;
}

/**
 * Status option interface
 */
interface StatusOption {
  value: UserStatus;
  label: string;
  icon: string;
  color: string;
  description: string;
  requiresReason: boolean;
}

/**
 * Status Change Dialog Component
 * @description Modal dialog for changing user account status.
 *              Provides options for activating, suspending, or banning users
 *              with mandatory reason input for restrictive actions.
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(StatusChangeDialogComponent, {
 *   width: '500px',
 *   data: { user: selectedUser }
 * });
 *
 * dialogRef.afterClosed().subscribe(result => {
 *   if (result?.success) {
 *     console.log('Status changed to:', result.status);
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-status-change-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="status-dialog">
      <!-- Dialog Header -->
      <header class="status-dialog__header">
        <h2 class="status-dialog__title">Change Account Status</h2>
        <p class="status-dialog__subtitle">
          Update status for {{ data.user.fullName }}
        </p>
      </header>

      <!-- Current Status -->
      <div class="status-dialog__current">
        <span class="status-dialog__current-label">Current Status:</span>
        <span
          class="status-dialog__current-badge"
          [attr.data-status]="data.user.status"
        >
          {{ getStatusLabel(data.user.status) }}
        </span>
      </div>

      <!-- Dialog Content -->
      <div class="status-dialog__content" mat-dialog-content>
        <form [formGroup]="statusForm">
          <!-- Status Selection -->
          <div class="status-dialog__options">
            <label
              *ngFor="let option of statusOptions"
              class="status-dialog__option"
              [class.status-dialog__option--selected]="statusForm.get('status')?.value === option.value"
              [class.status-dialog__option--disabled]="option.value === data.user.status"
            >
              <input
                type="radio"
                formControlName="status"
                [value]="option.value"
                [disabled]="option.value === data.user.status"
                class="status-dialog__radio"
              />
              <div class="status-dialog__option-content">
                <div class="status-dialog__option-header">
                  <span class="material-icons" [style.color]="option.color">
                    {{ option.icon }}
                  </span>
                  <span class="status-dialog__option-label">{{ option.label }}</span>
                </div>
                <span class="status-dialog__option-description">
                  {{ option.description }}
                </span>
              </div>
            </label>
          </div>

          <!-- Reason Input (conditional) -->
          <div
            *ngIf="selectedOption?.requiresReason"
            class="status-dialog__reason"
          >
            <label class="status-dialog__reason-label">
              Reason for {{ selectedOption?.label?.toLowerCase() }}
              <span class="status-dialog__required">*</span>
            </label>
            <textarea
              formControlName="reason"
              class="status-dialog__textarea"
              placeholder="Enter the reason for this status change..."
              rows="3"
            ></textarea>
            <span
              *ngIf="statusForm.get('reason')?.touched && statusForm.get('reason')?.errors?.['required']"
              class="status-dialog__error-text"
            >
              Reason is required for this action
            </span>
          </div>

          <!-- Notify User Toggle -->
          <div class="status-dialog__notify">
            <label class="status-dialog__toggle">
              <input
                type="checkbox"
                formControlName="notifyUser"
                class="status-dialog__checkbox"
              />
              <div class="status-dialog__toggle-info">
                <span class="status-dialog__toggle-label">Notify user via email</span>
                <span class="status-dialog__toggle-hint">
                  Send an email notification to the user about this status change
                </span>
              </div>
            </label>
          </div>
        </form>

        <!-- Warning for destructive actions -->
        <div
          *ngIf="selectedOption && (selectedOption.value === 'suspended' || selectedOption.value === 'banned')"
          class="status-dialog__warning"
        >
          <span class="material-icons">warning</span>
          <div>
            <p *ngIf="selectedOption.value === 'suspended'">
              <strong>Suspending</strong> this user will temporarily prevent them from logging in
              and accessing their account.
            </p>
            <p *ngIf="selectedOption.value === 'banned'">
              <strong>Banning</strong> this user will permanently prevent them from logging in.
              This action should be used for serious violations only.
            </p>
          </div>
        </div>
      </div>

      <!-- Dialog Actions -->
      <footer class="status-dialog__actions" mat-dialog-actions>
        <button
          type="button"
          class="status-dialog__btn status-dialog__btn--secondary"
          (click)="onCancel()"
          [disabled]="isSubmitting()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="status-dialog__btn"
          [class.status-dialog__btn--primary]="!isDangerousAction"
          [class.status-dialog__btn--danger]="isDangerousAction"
          (click)="onSubmit()"
          [disabled]="isSubmitting() || !isFormValid"
        >
          <span *ngIf="isSubmitting()" class="material-icons animate-spin">sync</span>
          <span>{{ isSubmitting() ? 'Updating...' : 'Update Status' }}</span>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .status-dialog {
      min-width: 450px;

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

      &__current {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: #f9fafb;
        margin-top: 1rem;
      }

      &__current-label {
        font-size: 0.875rem;
        color: #6b7280;
      }

      &__current-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 9999px;
        text-transform: capitalize;

        &[data-status='active'] {
          background: #d1fae5;
          color: #065f46;
        }

        &[data-status='inactive'] {
          background: #e5e7eb;
          color: #374151;
        }

        &[data-status='suspended'] {
          background: #fef3c7;
          color: #92400e;
        }

        &[data-status='banned'] {
          background: #fee2e2;
          color: #991b1b;
        }

        &[data-status='pending_verification'] {
          background: #dbeafe;
          color: #1e40af;
        }
      }

      &__content {
        padding: 1.5rem !important;
      }

      &__options {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      &__option {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(&--disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        &--selected {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        &--disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &__radio {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        cursor: pointer;
        accent-color: #1e3a8a;
      }

      &__option-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      &__option-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .material-icons {
          font-size: 1.25rem;
        }
      }

      &__option-label {
        font-weight: 500;
        color: #1f2937;
      }

      &__option-description {
        font-size: 0.75rem;
        color: #6b7280;
      }

      &__reason {
        margin-bottom: 1rem;
      }

      &__reason-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      &__required {
        color: #dc2626;
      }

      &__textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-family: inherit;
        resize: vertical;
        min-height: 80px;

        &::placeholder {
          color: #9ca3af;
        }

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      &__error-text {
        display: block;
        font-size: 0.75rem;
        color: #dc2626;
        margin-top: 0.25rem;
      }

      &__notify {
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

      &__checkbox {
        width: 18px;
        height: 18px;
        margin-top: 2px;
        cursor: pointer;
        accent-color: #1e3a8a;
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

      &__warning {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 0.5rem;

        .material-icons {
          color: #d97706;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 0.8125rem;
          color: #92400e;
          line-height: 1.5;
        }
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

        &--danger {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: white;

          &:hover:not(:disabled) {
            background: #b91c1c;
            border-color: #b91c1c;
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
export class StatusChangeDialogComponent {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  private readonly dialogRef = inject(MatDialogRef<StatusChangeDialogComponent>);
  readonly data: StatusChangeDialogData = inject(MAT_DIALOG_DATA);
  private readonly usersService = inject(AdminUsersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  // =========================================================================
  // STATE
  // =========================================================================

  /** Submitting state */
  readonly isSubmitting = signal(false);

  // =========================================================================
  // STATUS OPTIONS
  // =========================================================================

  /** Available status options */
  readonly statusOptions: StatusOption[] = [
    {
      value: 'active',
      label: 'Active',
      icon: 'check_circle',
      color: '#047857',
      description: 'User can access their account normally',
      requiresReason: false
    },
    {
      value: 'inactive',
      label: 'Inactive',
      icon: 'remove_circle',
      color: '#6b7280',
      description: 'Account is deactivated but can be reactivated',
      requiresReason: false
    },
    {
      value: 'suspended',
      label: 'Suspended',
      icon: 'pause_circle',
      color: '#d97706',
      description: 'Temporarily restrict account access',
      requiresReason: true
    },
    {
      value: 'banned',
      label: 'Banned',
      icon: 'block',
      color: '#dc2626',
      description: 'Permanently ban user from the platform',
      requiresReason: true
    }
  ];

  // =========================================================================
  // FORM
  // =========================================================================

  /** Status change form */
  readonly statusForm: FormGroup = this.fb.group({
    status: [null, Validators.required],
    reason: [''],
    notifyUser: [true]
  });

  // =========================================================================
  // COMPUTED PROPERTIES
  // =========================================================================

  /**
   * Get selected status option
   */
  get selectedOption(): StatusOption | undefined {
    const status = this.statusForm.get('status')?.value;
    return this.statusOptions.find(o => o.value === status);
  }

  /**
   * Check if current action is dangerous
   */
  get isDangerousAction(): boolean {
    const status = this.statusForm.get('status')?.value;
    return status === 'suspended' || status === 'banned';
  }

  /**
   * Check if form is valid
   */
  get isFormValid(): boolean {
    const status = this.statusForm.get('status')?.value;
    const reason = this.statusForm.get('reason')?.value;
    const option = this.selectedOption;

    if (!status) return false;
    if (option?.requiresReason && !reason?.trim()) return false;

    return true;
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get human-readable status label
   * @param status - User status
   * @returns Status label
   */
  getStatusLabel(status: UserStatus): string {
    const labels: Record<UserStatus, string> = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      banned: 'Banned',
      pending_verification: 'Pending Verification'
    };
    return labels[status] || status;
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /**
   * Submit status change
   */
  onSubmit(): void {
    if (!this.isFormValid) return;

    this.isSubmitting.set(true);

    const formValue = this.statusForm.value;
    const request = {
      status: formValue.status,
      reason: formValue.reason || undefined,
      notifyUser: formValue.notifyUser
    };

    this.usersService.updateUserStatus(this.data.user.id, request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true, status: formValue.status });
        },
        error: (error) => {
          console.error('Failed to update status:', error);
          this.snackBar.open('Failed to update user status', 'Close', { duration: 3000 });
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

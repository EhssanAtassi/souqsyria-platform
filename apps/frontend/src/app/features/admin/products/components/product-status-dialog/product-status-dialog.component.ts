/**
 * @file product-status-dialog.component.ts
 * @description Dialog component for changing product status.
 *              Supports active, inactive, out_of_stock, and discontinued statuses.
 * @module AdminDashboard/Products/Components
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MatDialogModule,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { AdminProductsService } from '../../../services';
import { ProductListItem, ProductStatus } from '../../../interfaces';

/**
 * Dialog data interface
 * @description Data passed to the dialog
 */
interface DialogData {
  /** Product to update */
  product: ProductListItem;
}

/**
 * Status option interface
 * @description Status selection option
 */
interface StatusOption {
  /** Status value */
  value: ProductStatus;
  /** Display label */
  label: string;
  /** Description of the status */
  description: string;
  /** Material icon name */
  icon: string;
  /** Whether this is a warning/danger action */
  severity?: 'normal' | 'warning' | 'danger';
}

/**
 * Product Status Dialog Component
 * @description Dialog for changing product status with reason input.
 *
 * @features
 * - Radio button status selection
 * - Reason textarea (optional for deactivation)
 * - Visual severity indicators
 * - Loading state during submission
 *
 * @example
 * ```typescript
 * const dialogRef = this.dialog.open(ProductStatusDialogComponent, {
 *   width: '450px',
 *   data: { product }
 * });
 * ```
 */
@Component({
  selector: 'app-product-status-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  template: `
    <div class="status-dialog">
      <!-- Header -->
      <header class="status-dialog__header">
        <h2 class="status-dialog__title">Change Product Status</h2>
        <p class="status-dialog__product-name">{{ data.product.nameEn }}</p>
        <span class="status-dialog__current-status">
          Current: {{ data.product.status | titlecase }}
        </span>
      </header>

      <!-- Content -->
      <div class="status-dialog__content">
        <!-- Status Options -->
        <div class="status-dialog__options">
          <label
            *ngFor="let option of statusOptions"
            class="status-dialog__option"
            [class.status-dialog__option--selected]="selectedStatus() === option.value"
            [class.status-dialog__option--warning]="option.severity === 'warning'"
            [class.status-dialog__option--danger]="option.severity === 'danger'"
          >
            <input
              type="radio"
              [value]="option.value"
              [checked]="selectedStatus() === option.value"
              (change)="selectedStatus.set(option.value)"
              name="status"
              class="status-dialog__radio"
            />
            <div class="status-dialog__option-content">
              <div class="status-dialog__option-header">
                <span class="material-icons status-dialog__option-icon">
                  {{ option.icon }}
                </span>
                <span class="status-dialog__option-label">{{ option.label }}</span>
              </div>
              <p class="status-dialog__option-description">{{ option.description }}</p>
            </div>
          </label>
        </div>

        <!-- Reason Input -->
        <div class="status-dialog__reason" *ngIf="requiresReason()">
          <label class="status-dialog__reason-label">
            Reason for change
            <span class="status-dialog__reason-optional">(Optional)</span>
          </label>
          <textarea
            class="status-dialog__reason-input"
            [(ngModel)]="reason"
            rows="3"
            placeholder="Enter reason for status change..."
          ></textarea>
        </div>

        <!-- Warning Message -->
        <div class="status-dialog__warning" *ngIf="showWarning()">
          <span class="material-icons">warning</span>
          <p>{{ getWarningMessage() }}</p>
        </div>
      </div>

      <!-- Actions -->
      <footer class="status-dialog__actions">
        <button
          type="button"
          class="status-dialog__btn status-dialog__btn--cancel"
          (click)="cancel()"
          [disabled]="isSubmitting()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="status-dialog__btn status-dialog__btn--confirm"
          [class.status-dialog__btn--warning]="isWarningAction()"
          (click)="confirm()"
          [disabled]="isSubmitting() || !canSubmit()"
        >
          <span *ngIf="isSubmitting()" class="material-icons animate-spin">sync</span>
          <span *ngIf="!isSubmitting()">Update Status</span>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .status-dialog {
      padding: 0;

      &__header {
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;
      }

      &__title {
        margin: 0 0 4px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a1a2e;
      }

      &__product-name {
        margin: 0 0 8px 0;
        font-size: 0.875rem;
        color: #6b7280;
      }

      &__current-status {
        display: inline-block;
        padding: 4px 8px;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #374151;
      }

      &__content {
        padding: 24px;
      }

      &__options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      &__option {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #1976d2;
          background: #f8fafc;
        }

        &--selected {
          border-color: #1976d2;
          background: rgba(25, 118, 210, 0.05);
        }

        &--warning.status-dialog__option--selected {
          border-color: #ff9800;
          background: rgba(255, 152, 0, 0.05);
        }

        &--danger.status-dialog__option--selected {
          border-color: #f44336;
          background: rgba(244, 67, 54, 0.05);
        }
      }

      &__radio {
        margin-top: 2px;
      }

      &__option-content {
        flex: 1;
      }

      &__option-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      &__option-icon {
        font-size: 1.25rem;
        color: #6b7280;

        .status-dialog__option--selected & {
          color: #1976d2;
        }

        .status-dialog__option--warning.status-dialog__option--selected & {
          color: #ff9800;
        }

        .status-dialog__option--danger.status-dialog__option--selected & {
          color: #f44336;
        }
      }

      &__option-label {
        font-weight: 500;
        color: #1a1a2e;
      }

      &__option-description {
        margin: 0;
        font-size: 0.75rem;
        color: #6b7280;
        line-height: 1.4;
      }

      &__reason {
        margin-top: 20px;
      }

      &__reason-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 8px;
      }

      &__reason-optional {
        font-weight: 400;
        color: #9ca3af;
      }

      &__reason-input {
        width: 100%;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 0.875rem;
        resize: vertical;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: #1976d2;
          box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
        }
      }

      &__warning {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 16px;
        padding: 12px;
        background: #fff3e0;
        border-radius: 6px;
        color: #e65100;

        .material-icons {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }
      }

      &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      &__btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;

        &--cancel {
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;

          &:hover:not(:disabled) {
            background: #f3f4f6;
          }
        }

        &--confirm {
          background: #1976d2;
          border: 1px solid #1976d2;
          color: white;

          &:hover:not(:disabled) {
            background: #1565c0;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        &--warning {
          background: #ff9800;
          border-color: #ff9800;

          &:hover:not(:disabled) {
            background: #f57c00;
          }
        }
      }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductStatusDialogComponent implements OnInit {
  // =========================================================================
  // DEPENDENCIES
  // =========================================================================

  readonly dialogRef = inject(MatDialogRef<ProductStatusDialogComponent>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);
  private readonly productsService = inject(AdminProductsService);

  // =========================================================================
  // STATE
  // =========================================================================

  /** Selected status */
  readonly selectedStatus = signal<ProductStatus>('active');

  /** Reason for status change */
  reason = '';

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
      description: 'Product is visible and available for purchase',
      icon: 'check_circle',
      severity: 'normal'
    },
    {
      value: 'inactive',
      label: 'Inactive',
      description: 'Product is hidden from customers but preserved in system',
      icon: 'pause_circle',
      severity: 'warning'
    },
    {
      value: 'out_of_stock',
      label: 'Out of Stock',
      description: 'Product is visible but cannot be purchased',
      icon: 'remove_shopping_cart',
      severity: 'warning'
    },
    {
      value: 'discontinued',
      label: 'Discontinued',
      description: 'Product is no longer available and will be hidden',
      icon: 'block',
      severity: 'danger'
    }
  ];

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  ngOnInit(): void {
    // Set initial status to current product status
    this.selectedStatus.set(this.data.product.status);
  }

  // =========================================================================
  // COMPUTED CHECKS
  // =========================================================================

  /**
   * Check if reason input should be shown
   * @returns Whether to show reason input
   */
  requiresReason(): boolean {
    const status = this.selectedStatus();
    return status !== 'active';
  }

  /**
   * Check if warning should be shown
   * @returns Whether to show warning
   */
  showWarning(): boolean {
    const status = this.selectedStatus();
    return status === 'discontinued';
  }

  /**
   * Get warning message based on selected status
   * @returns Warning message
   */
  getWarningMessage(): string {
    const status = this.selectedStatus();
    if (status === 'discontinued') {
      return 'Discontinuing a product will permanently hide it from customers. This action should be used for products that will no longer be sold.';
    }
    return '';
  }

  /**
   * Check if this is a warning-level action
   * @returns Whether action is warning level
   */
  isWarningAction(): boolean {
    const status = this.selectedStatus();
    return status === 'discontinued' || status === 'inactive';
  }

  /**
   * Check if form can be submitted
   * @returns Whether form is valid for submission
   */
  canSubmit(): boolean {
    const status = this.selectedStatus();
    return status !== this.data.product.status;
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Confirm status change
   */
  confirm(): void {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    this.productsService
      .updateProductStatus(
        this.data.product.id,
        this.selectedStatus(),
        this.reason || undefined
      )
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (error) => {
          console.error('Status update failed:', error);
        }
      });
  }
}

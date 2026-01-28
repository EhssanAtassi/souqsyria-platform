/**
 * @file admin-confirmation-dialog.component.ts
 * @description Reusable confirmation dialog component for admin actions.
 *              Supports various confirmation types with customizable messages and styling.
 * @module AdminDashboard/SharedComponents
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  ViewChild
} from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

/**
 * Dialog type variants
 * @description Visual type for the confirmation dialog
 */
export type DialogType = 'info' | 'warning' | 'danger' | 'success';

/**
 * Confirmation dialog data
 * @description Data passed to the dialog when opened
 */
export interface ConfirmationDialogData {
  /** Dialog title */
  title: string;
  /** Main message to display */
  message: string;
  /** Dialog type for styling */
  type?: DialogType;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Whether to show a text input for confirmation (e.g., type 'DELETE') */
  requireTextConfirmation?: boolean;
  /** Text that must be typed to confirm */
  confirmationText?: string;
  /** Placeholder for confirmation input */
  confirmationPlaceholder?: string;
  /** Additional details or warning */
  details?: string;
  /** Whether the action is destructive */
  destructive?: boolean;
}

/**
 * Dialog result
 * @description Result returned when the dialog is closed
 */
export interface ConfirmationDialogResult {
  /** Whether the user confirmed the action */
  confirmed: boolean;
  /** Any additional data from the dialog */
  data?: unknown;
}

/**
 * Admin Confirmation Dialog Component
 * @description A flexible confirmation dialog for verifying user actions.
 *              Supports different severity levels and optional text confirmation.
 *
 * @example
 * ```typescript
 * // Open dialog from a service
 * const dialogRef = this.dialog.open(AdminConfirmationDialogComponent, {
 *   data: {
 *     title: 'Delete User',
 *     message: 'Are you sure you want to delete this user? This action cannot be undone.',
 *     type: 'danger',
 *     confirmText: 'Delete User',
 *     requireTextConfirmation: true,
 *     confirmationText: 'DELETE'
 *   }
 * });
 *
 * dialogRef.closed.subscribe(result => {
 *   if (result?.confirmed) {
 *     // Proceed with deletion
 *   }
 * });
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-admin-confirmation-dialog',
  templateUrl: './admin-confirmation-dialog.component.html',
  styleUrls: ['./admin-confirmation-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, NgIf, FormsModule, A11yModule]
})
export class AdminConfirmationDialogComponent implements AfterViewInit, OnDestroy {
  /**
   * Dialog reference for closing
   */
  private readonly dialogRef = inject(DialogRef<ConfirmationDialogResult>);

  /**
   * Dialog data passed from opener
   */
  readonly data = inject<ConfirmationDialogData>(DIALOG_DATA);

  /**
   * Focus trap factory for creating focus traps
   */
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  /**
   * Focus trap instance for trapping focus within dialog
   */
  private focusTrap: FocusTrap | null = null;

  /**
   * Reference to the dialog container element
   * @description Used for focus trapping initialization
   */
  @ViewChild('dialogContainer', { static: true })
  dialogContainer!: ElementRef<HTMLElement>;

  /**
   * Reference to the cancel button for initial focus
   * @description Cancel button receives initial focus for safety (non-destructive default)
   */
  @ViewChild('cancelButton', { static: true })
  cancelButton!: ElementRef<HTMLButtonElement>;

  /**
   * User's confirmation text input
   */
  readonly confirmationInput = signal('');

  /**
   * Processing state
   */
  readonly isProcessing = signal(false);

  /**
   * Handle Escape key to close dialog
   * @description Keyboard accessibility - Escape key closes the dialog
   * @param event - Keyboard event
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (!this.isProcessing()) {
      event.preventDefault();
      this.onCancel();
    }
  }

  /**
   * Initialize focus trap and set initial focus after view is ready
   * @description WCAG requirement: focus must be trapped within modal and initial focus set
   */
  ngAfterViewInit(): void {
    // Create focus trap to keep Tab navigation within the dialog
    if (this.dialogContainer?.nativeElement) {
      this.focusTrap = this.focusTrapFactory.create(this.dialogContainer.nativeElement);
      this.focusTrap.focusInitialElementWhenReady();
    }

    // Set initial focus to cancel button (safer default for destructive dialogs)
    // If text confirmation is required, focus the input instead
    setTimeout(() => {
      if (this.requireTextConfirmation) {
        const input = document.getElementById('confirmation-input');
        input?.focus();
      } else {
        this.cancelButton?.nativeElement?.focus();
      }
    }, 0);
  }

  /**
   * Clean up focus trap on component destruction
   */
  ngOnDestroy(): void {
    this.focusTrap?.destroy();
  }

  /**
   * Dialog title
   */
  get title(): string {
    return this.data.title || 'Confirm Action';
  }

  /**
   * Dialog message
   */
  get message(): string {
    return this.data.message || 'Are you sure you want to proceed?';
  }

  /**
   * Dialog type
   */
  get type(): DialogType {
    return this.data.type || (this.data.destructive ? 'danger' : 'info');
  }

  /**
   * Confirm button text
   */
  get confirmText(): string {
    return this.data.confirmText || 'Confirm';
  }

  /**
   * Cancel button text
   */
  get cancelText(): string {
    return this.data.cancelText || 'Cancel';
  }

  /**
   * Whether text confirmation is required
   */
  get requireTextConfirmation(): boolean {
    return this.data.requireTextConfirmation || false;
  }

  /**
   * Text that must match for confirmation
   */
  get confirmationText(): string {
    return this.data.confirmationText || 'CONFIRM';
  }

  /**
   * Placeholder for confirmation input
   */
  get confirmationPlaceholder(): string {
    return this.data.confirmationPlaceholder || `Type "${this.confirmationText}" to confirm`;
  }

  /**
   * Additional details
   */
  get details(): string {
    return this.data.details || '';
  }

  /**
   * Whether the confirm button should be disabled
   */
  get isConfirmDisabled(): boolean {
    if (this.isProcessing()) return true;
    if (!this.requireTextConfirmation) return false;
    return this.confirmationInput() !== this.confirmationText;
  }

  /**
   * Icon name based on dialog type
   */
  get iconName(): string {
    switch (this.type) {
      case 'danger':
        return 'warning';
      case 'warning':
        return 'error_outline';
      case 'success':
        return 'check_circle';
      case 'info':
      default:
        return 'info';
    }
  }

  /**
   * Handle confirmation
   * @description Called when the user confirms the action
   */
  onConfirm(): void {
    if (this.isConfirmDisabled) return;

    this.dialogRef.close({
      confirmed: true,
      data: this.confirmationInput()
    });
  }

  /**
   * Handle cancellation
   * @description Called when the user cancels the action
   */
  onCancel(): void {
    this.dialogRef.close({
      confirmed: false
    });
  }

  /**
   * Update confirmation input
   * @param value - New input value
   */
  updateConfirmationInput(value: string): void {
    this.confirmationInput.set(value);
  }
}

/**
 * @fileoverview Security component for password management
 * @description Allows users to change their password with strength validation (SS-USER-003)
 */

import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { AccountApiService } from '../../services/account-api.service';
import { PasswordStrengthComponent } from '../../components/password-strength/password-strength.component';
import { AuthActions } from '../../../auth/store/auth.actions';

/**
 * @description Component for changing user password
 * @class SecurityComponent
 */
@Component({
  selector: 'app-security',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    TranslateModule,
    PasswordStrengthComponent,
  ],
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityComponent {
  /** Account API service for password operations */
  private accountApi = inject(AccountApiService);

  /** Router for navigation */
  private router = inject(Router);

  /** Form builder for reactive forms */
  private fb = inject(FormBuilder);

  /** Snackbar for displaying notifications */
  private snackBar = inject(MatSnackBar);

  /** Translation service */
  private translate = inject(TranslateService);

  /** Store for dispatching logout action */
  private store = inject(Store);

  /** Dialog service */
  private dialog = inject(MatDialog);

  /** Submitting state signal */
  submitting = signal<boolean>(false);

  /** Show current password signal */
  showCurrentPassword = signal<boolean>(false);

  /** Show new password signal */
  showNewPassword = signal<boolean>(false);

  /** Show confirm password signal */
  showConfirmPassword = signal<boolean>(false);

  /** Password change form group */
  passwordForm: FormGroup;

  constructor() {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.uppercaseValidator,
            this.numberValidator,
            this.specialCharValidator,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  /**
   * @description Custom validator for uppercase letter requirement
   * @param {AbstractControl} control - Form control to validate
   * @returns {ValidationErrors | null} Validation error or null
   */
  private uppercaseValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return /[A-Z]/.test(control.value) ? null : { uppercase: true };
  }

  /**
   * @description Custom validator for number requirement
   * @param {AbstractControl} control - Form control to validate
   * @returns {ValidationErrors | null} Validation error or null
   */
  private numberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return /\d/.test(control.value) ? null : { number: true };
  }

  /**
   * @description Custom validator for special character requirement
   * @param {AbstractControl} control - Form control to validate
   * @returns {ValidationErrors | null} Validation error or null
   */
  private specialCharValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?\/\\~`]/.test(control.value) ? null : { specialChar: true };
  }

  /**
   * @description Custom validator for password match
   * @param {AbstractControl} control - Form group to validate
   * @returns {ValidationErrors | null} Validation error or null
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) return null;

    return newPassword.value === confirmPassword.value
      ? null
      : { mismatch: true };
  }

  /**
   * @description Toggles current password visibility
   * @returns {void}
   */
  toggleCurrentPasswordVisibility(): void {
    this.showCurrentPassword.update((value) => !value);
  }

  /**
   * @description Toggles new password visibility
   * @returns {void}
   */
  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update((value) => !value);
  }

  /**
   * @description Toggles confirm password visibility
   * @returns {void}
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  /**
   * @description Gets current new password value for strength indicator
   * @returns {string} New password value
   */
  get newPasswordValue(): string {
    return this.passwordForm.get('newPassword')?.value || '';
  }

  /**
   * @description Submits password change form
   * @returns {void}
   */
  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formValue = this.passwordForm.value;
    const changePasswordDto = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword,
    };

    this.accountApi.changePassword(changePasswordDto).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showSuccessAndLogout();
      },
      error: (err) => {
        console.error('Failed to change password:', err);
        this.submitting.set(false);
        // Parse backend error message or use generic fallback
        const errorMessage = err.error?.message || 'account.security.error';
        this.showError(errorMessage);
      },
    });
  }

  /**
   * @description Shows success dialog and logs out user
   * @returns {void}
   */
  private showSuccessAndLogout(): void {
    const dialogRef = this.dialog.open(PasswordChangeSuccessDialog, {
      width: '400px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.store.dispatch(AuthActions.logout());
      this.router.navigate(['/auth/login']);
    });
  }

  /**
   * @description Shows error snackbar message
   * @param {string} messageKeyOrText - Translation key or direct error message
   * @returns {void}
   */
  private showError(messageKeyOrText: string): void {
    // Try to translate first, if it fails use the text directly
    this.translate.get(messageKeyOrText).subscribe((message) => {
      // If translation returns the same key, it means no translation exists, use original text
      const displayMessage = message === messageKeyOrText && !messageKeyOrText.startsWith('account.')
        ? messageKeyOrText
        : message;

      this.snackBar.open(displayMessage, '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
      });
    });
  }

  /**
   * @description Gets error message for form field
   * @param {string} fieldName - Form field name
   * @returns {string} Error message translation key
   */
  getErrorMessage(fieldName: string): string {
    const control = this.passwordForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return `account.security.validation.${
        fieldName === 'currentPassword'
          ? 'currentRequired'
          : fieldName === 'newPassword'
          ? 'newRequired'
          : 'confirmRequired'
      }`;
    }
    if (control.errors['minlength']) {
      return 'account.security.validation.minLength';
    }
    if (control.errors['uppercase']) {
      return 'account.security.validation.uppercase';
    }
    if (control.errors['number']) {
      return 'account.security.validation.number';
    }
    if (control.errors['specialChar']) {
      return 'account.security.validation.specialChar';
    }

    return '';
  }

  /**
   * @description Gets form-level error message
   * @returns {string} Error message translation key
   */
  getFormErrorMessage(): string {
    if (this.passwordForm.errors?.['mismatch']) {
      return 'account.security.validation.mismatch';
    }
    return '';
  }
}

/**
 * @description Dialog component for password change success confirmation
 * @class PasswordChangeSuccessDialog
 */
@Component({
  selector: 'app-password-change-success-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'account.security.successTitle' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ 'account.security.successMessage' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        {{ 'account.security.okButton' | translate }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px 0;
    }
  `]
})
export class PasswordChangeSuccessDialog {
  dialogRef = inject(MatDialogRef<PasswordChangeSuccessDialog>);
}

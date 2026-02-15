/**
 * Reset Password Component for SouqSyria marketplace
 *
 * @description Standalone Angular component for resetting a user's password
 * using a token received via email. Reads the resetToken from URL query params,
 * renders a reactive form for new password and confirmation, and dispatches
 * AuthActions.resetPassword on valid submission. Shows success or invalid-token
 * states depending on the flow outcome.
 *
 * @swagger
 * components:
 *   schemas:
 *     ResetPasswordComponent:
 *       type: object
 *       description: Password reset form component (token-based)
 *       properties:
 *         form:
 *           type: object
 *           description: Reactive FormGroup with newPassword, confirmPassword
 *         isLoading:
 *           type: boolean
 *           description: Whether reset password request is in progress
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message from failed reset attempt
 *         resetToken:
 *           type: string
 *           nullable: true
 *           description: Password reset token from URL query params
 *         passwordResetSuccess:
 *           type: boolean
 *           description: Whether password was successfully reset
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthActions } from '../../store/auth.actions';
import {
  selectIsLoading,
  selectError,
  selectPasswordResetSuccess,
} from '../../store/auth.selectors';
import {
  passwordMatch,
  strongPassword,
} from '../../validators/auth.validators';

/**
 * ResetPasswordComponent
 *
 * @description Smart standalone component that handles password reset with a token.
 * Reads the resetToken from ActivatedRoute queryParams. If no token is present,
 * displays an invalid-link error view. Otherwise, renders a form for new password
 * and confirmation with strongPassword and passwordMatch validators.
 * On success, shows a confirmation view with a link to login.
 *
 * @usageNotes
 * Route: /auth/reset-password?token=<resetToken>
 * On success: Shows confirmation UI with link to /auth/login?passwordReset=true
 */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  /** @description NgRx store for dispatching auth actions and selecting state */
  private readonly store = inject(Store);

  /** @description Angular form builder for reactive form creation */
  private readonly fb = inject(FormBuilder);

  /** @description ActivatedRoute for reading the resetToken from query params */
  private readonly route = inject(ActivatedRoute);

  /**
   * Loading state signal from NgRx store
   * @description Converted from Observable to Signal via toSignal for template binding
   */
  readonly isLoading = toSignal(this.store.select(selectIsLoading), {
    initialValue: false,
  });

  /**
   * Error state signal from NgRx store
   * @description Displays backend error messages (e.g., expired token)
   */
  readonly error = toSignal(this.store.select(selectError), {
    initialValue: null,
  });

  /**
   * Password reset success flag from NgRx store
   * @description When true, switches the UI from form view to success confirmation view
   */
  readonly passwordResetSuccess = toSignal(
    this.store.select(selectPasswordResetSuccess),
    { initialValue: false },
  );

  /**
   * Reset token from URL query parameters
   * @description Extracted from the password reset email link.
   * If null/empty, the component shows an invalid-link error view.
   */
  readonly resetToken = toSignal(
    this.route.queryParams.pipe(
      map((params) => params['token'] || null),
    ),
    { initialValue: null },
  );

  /** @description Controls new password field visibility toggle */
  readonly hidePassword = signal(true);

  /** @description Controls confirm password field visibility toggle */
  readonly hideConfirmPassword = signal(true);

  /**
   * Reset password reactive form
   * @description FormGroup with password and confirmPassword fields,
   * using strongPassword field-level validator and passwordMatch group-level validator
   */
  form!: FormGroup;

  /**
   * Initialize the reset password form
   * @description Creates the reactive form with strongPassword and passwordMatch validators.
   * Clears any previous auth errors on component initialization.
   */
  ngOnInit(): void {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, strongPassword()]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatch() },
    );

    this.store.dispatch(AuthActions.clearError());
  }

  /**
   * Toggle new password field visibility
   * @description Switches between password and text input type
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  /**
   * Toggle confirm password field visibility
   * @description Switches between password and text input type
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }

  /**
   * Handle form submission
   * @description Validates the form and dispatches AuthActions.resetPassword
   * with the resetToken from the URL and the new password from the form.
   * If form is invalid, marks all controls as touched to trigger validation display.
   */
  onSubmit(): void {
    if (this.form.valid && this.resetToken()) {
      const { password } = this.form.value;
      this.store.dispatch(
        AuthActions.resetPassword({
          resetToken: this.resetToken()!,
          newPassword: password,
        }),
      );
    } else {
      this.form.markAllAsTouched();
    }
  }
}

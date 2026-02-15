/**
 * Register Component for SouqSyria marketplace
 *
 * @description Standalone Angular component providing user registration functionality.
 * Renders a reactive form with email, password, and confirm password fields.
 * Dispatches NgRx AuthActions.register on valid submission, shows inline
 * validation errors, and navigates to OTP verification on success.
 *
 * @swagger
 * components:
 *   schemas:
 *     RegisterComponent:
 *       type: object
 *       description: User registration form component
 *       properties:
 *         form:
 *           type: object
 *           description: Reactive FormGroup with email, password, confirmPassword
 *         isLoading:
 *           type: boolean
 *           description: Whether registration request is in progress
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message from failed registration attempt
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
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthActions } from '../../store/auth.actions';
import {
  selectIsLoading,
  selectError,
} from '../../store/auth.selectors';
import {
  passwordMatch,
  strongPassword,
} from '../../validators/auth.validators';
import { PasswordStrengthComponent } from '../password-strength/password-strength.component';

/**
 * RegisterComponent
 *
 * @description Smart standalone component that handles user registration.
 * Collects email, password, and password confirmation with client-side
 * validation. Uses passwordMatch group-level validator and strongPassword
 * field-level validator. Dispatches to NgRx store for async registration
 * and shows loading/error states from the store.
 *
 * @usageNotes
 * Route: /auth/register
 * After successful registration, the effects layer navigates to /auth/verify-otp
 */
@Component({
  selector: 'app-register',
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
    PasswordStrengthComponent,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  /** @description NgRx store for dispatching auth actions and selecting state */
  private readonly store = inject(Store);

  /** @description Angular form builder for reactive form creation */
  private readonly fb = inject(FormBuilder);

  /**
   * Loading state signal from NgRx store
   * @description Converted from Observable to Signal via toSignal for template binding
   */
  readonly isLoading = toSignal(this.store.select(selectIsLoading), {
    initialValue: false,
  });

  /**
   * Error state signal from NgRx store
   * @description Displays backend error messages (e.g., duplicate email)
   */
  readonly error = toSignal(this.store.select(selectError), {
    initialValue: null,
  });

  /** @description Controls password field visibility toggle */
  readonly hidePassword = signal(true);

  /** @description Controls confirm password field visibility toggle */
  readonly hideConfirmPassword = signal(true);

  /**
   * Registration reactive form
   * @description FormGroup with email, password, confirmPassword fields
   * and a group-level passwordMatch validator
   */
  form!: FormGroup;

  /**
   * Initialize the registration form
   * @description Creates the reactive form with field-level and group-level validators.
   * Clears any previous auth errors on component initialization.
   */
  ngOnInit(): void {
    this.form = this.fb.group(
      {
        fullName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, strongPassword()]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordMatch() },
    );

    this.store.dispatch(AuthActions.clearError());
  }

  /**
   * Toggle password field visibility
   * @description Switches between password and text input type for the password field
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  /**
   * Toggle confirm password field visibility
   * @description Switches between password and text input type for the confirm password field
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((v) => !v);
  }

  /**
   * Handle form submission
   * @description Validates the form and dispatches AuthActions.register with email and password.
   * If form is invalid, marks all controls as touched to trigger validation display.
   */
  onSubmit(): void {
    if (this.form.valid) {
      const { email, password, fullName } = this.form.value;
      this.store.dispatch(
        AuthActions.register({ email, password, fullName }),
      );
    } else {
      this.form.markAllAsTouched();
    }
  }
}

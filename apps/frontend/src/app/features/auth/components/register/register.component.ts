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
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand-mark">
          <div class="auth-brand-icon"><span>س</span></div>
        </div>
        <div class="auth-header">
          <h1>{{ 'auth.register.title' | translate }}</h1>
          <p>{{ 'auth.register.subtitle' | translate }}</p>
        </div>

        @if (error()) {
          <div class="error-message" role="alert" aria-live="polite">
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Full Name field (required per SS-AUTH-001) -->
          <mat-form-field appearance="outline">
            <mat-label>{{ 'auth.register.fullName' | translate }}</mat-label>
            <input
              matInput
              formControlName="fullName"
              type="text"
              autocomplete="name"
              autofocus
            />
            <mat-icon matSuffix>person</mat-icon>
            @if (form.get('fullName')?.hasError('required') && form.get('fullName')?.touched) {
              <mat-error>{{ 'auth.validation.fullNameRequired' | translate }}</mat-error>
            }
          </mat-form-field>

          <!-- Email field -->
          <mat-form-field appearance="outline">
            <mat-label>{{ 'auth.register.email' | translate }}</mat-label>
            <input
              matInput
              formControlName="email"
              type="email"
              autocomplete="email"
            />
            <mat-icon matSuffix>email</mat-icon>
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>{{ 'auth.validation.emailRequired' | translate }}</mat-error>
            }
            @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
              <mat-error>{{ 'auth.validation.emailInvalid' | translate }}</mat-error>
            }
          </mat-form-field>

          <!-- Password field -->
          <mat-form-field appearance="outline" class="password-field">
            <mat-label>{{ 'auth.register.password' | translate }}</mat-label>
            <input
              matInput
              formControlName="password"
              [type]="hidePassword() ? 'password' : 'text'"
              autocomplete="new-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="'auth.register.togglePassword' | translate"
            >
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>{{ 'auth.validation.passwordRequired' | translate }}</mat-error>
            }
            @if (form.get('password')?.hasError('minLength') && form.get('password')?.touched) {
              <mat-error>{{ 'auth.validation.passwordMinLength' | translate }}</mat-error>
            }
            @if (form.get('password')?.hasError('uppercase') && form.get('password')?.touched) {
              <mat-error>{{ 'auth.validation.passwordUppercase' | translate }}</mat-error>
            }
            @if (form.get('password')?.hasError('number') && form.get('password')?.touched) {
              <mat-error>{{ 'auth.validation.passwordNumber' | translate }}</mat-error>
            }
          </mat-form-field>

          <!-- Confirm Password field -->
          <mat-form-field appearance="outline" class="password-field">
            <mat-label>{{ 'auth.register.confirmPassword' | translate }}</mat-label>
            <input
              matInput
              formControlName="confirmPassword"
              [type]="hideConfirmPassword() ? 'password' : 'text'"
              autocomplete="new-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="toggleConfirmPasswordVisibility()"
              [attr.aria-label]="'auth.register.toggleConfirmPassword' | translate"
            >
              <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('confirmPassword')?.hasError('required') && form.get('confirmPassword')?.touched) {
              <mat-error>{{ 'auth.validation.confirmPasswordRequired' | translate }}</mat-error>
            }
            @if (form.get('confirmPassword')?.hasError('passwordMismatch') && form.get('confirmPassword')?.touched) {
              <mat-error>{{ 'auth.validation.passwordMismatch' | translate }}</mat-error>
            }
          </mat-form-field>

          <!-- Submit button -->
          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            type="submit"
            [disabled]="form.invalid || isLoading()"
          >
            @if (isLoading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              {{ 'auth.register.submit' | translate }}
            }
          </button>
        </form>

        <!-- Terms text -->
        <div class="terms-text">
          {{ 'auth.register.termsPrefix' | translate }}
          <a routerLink="/terms">{{ 'auth.register.termsLink' | translate }}</a>
          {{ 'auth.register.termsAnd' | translate }}
          <a routerLink="/privacy">{{ 'auth.register.privacyLink' | translate }}</a>
        </div>

        <!-- Footer with login link -->
        <div class="auth-footer">
          {{ 'auth.register.hasAccount' | translate }}
          <a routerLink="/auth/login">{{ 'auth.register.loginLink' | translate }}</a>
        </div>
      </div>
    </div>
  `,
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

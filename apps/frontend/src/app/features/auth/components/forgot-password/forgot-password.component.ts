/**
 * Forgot Password Component for SouqSyria marketplace
 *
 * @description Standalone Angular component providing the forgot password flow.
 * Renders a simple email input form that dispatches AuthActions.forgotPassword.
 * Shows a success confirmation when the reset email has been sent, and provides
 * a link back to the login page.
 *
 * @swagger
 * components:
 *   schemas:
 *     ForgotPasswordComponent:
 *       type: object
 *       description: Forgot password email request form component
 *       properties:
 *         form:
 *           type: object
 *           description: Reactive FormGroup with email field
 *         isLoading:
 *           type: boolean
 *           description: Whether forgot password request is in progress
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message from failed request
 *         resetEmailSent:
 *           type: boolean
 *           description: Whether the reset email was successfully sent
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
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
  selectResetEmailSent,
} from '../../store/auth.selectors';
import { LanguageService } from '../../../../shared/services/language.service';

/**
 * ForgotPasswordComponent
 *
 * @description Smart standalone component that handles the forgot password flow.
 * Collects the user's email address and dispatches a forgot-password action.
 * Shows a success card with instructions to check email when the reset link
 * has been sent. The backend response is intentionally vague to prevent
 * user enumeration attacks.
 *
 * @usageNotes
 * Route: /auth/forgot-password
 * On success: Shows "check your email" confirmation UI
 */
@Component({
  selector: 'app-forgot-password',
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
    <div class="auth-page" [dir]="languageService.direction()">
      <div class="auth-card">
        @if (resetEmailSent()) {
          <!-- Success state: email sent -->
          <div class="success-card">
            <mat-icon class="success-icon">mark_email_read</mat-icon>
            <h2>{{ 'auth.forgotPassword.successTitle' | translate }}</h2>
            <p>{{ 'auth.forgotPassword.successMessage' | translate }}</p>
            <a
              mat-raised-button
              color="primary"
              class="submit-btn"
              routerLink="/auth/login"
            >
              {{ 'auth.forgotPassword.backToLogin' | translate }}
            </a>
          </div>
        } @else {
          <!-- Form state: email input -->
          <div class="auth-header">
            <h1>{{ 'auth.forgotPassword.title' | translate }}</h1>
            <p>{{ 'auth.forgotPassword.subtitle' | translate }}</p>
          </div>

          @if (error()) {
            <div class="error-message" role="alert" aria-live="polite">
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Email field -->
            <mat-form-field appearance="outline">
              <mat-label>{{ 'auth.forgotPassword.email' | translate }}</mat-label>
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
                {{ 'auth.forgotPassword.submit' | translate }}
              }
            </button>
          </form>

          <!-- Footer with login link -->
          <div class="auth-footer">
            <a routerLink="/auth/login">{{ 'auth.forgotPassword.backToLogin' | translate }}</a>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent implements OnInit {
  /** @description Language service for RTL direction binding */
  readonly languageService = inject(LanguageService);

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
   * @description Displays backend error messages
   */
  readonly error = toSignal(this.store.select(selectError), {
    initialValue: null,
  });

  /**
   * Reset email sent flag from NgRx store
   * @description When true, switches the UI from form view to success confirmation view
   */
  readonly resetEmailSent = toSignal(
    this.store.select(selectResetEmailSent),
    { initialValue: false },
  );

  /**
   * Forgot password reactive form
   * @description FormGroup with a single email field
   */
  form!: FormGroup;

  /**
   * Initialize the forgot password form
   * @description Creates the reactive form with email validation.
   * Clears any previous auth errors on component initialization.
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.store.dispatch(AuthActions.clearError());
  }

  /**
   * Handle form submission
   * @description Validates the form and dispatches AuthActions.forgotPassword with the email.
   * If form is invalid, marks all controls as touched to trigger validation display.
   */
  onSubmit(): void {
    if (this.form.valid) {
      const { email } = this.form.value;
      this.store.dispatch(AuthActions.forgotPassword({ email }));
    } else {
      this.form.markAllAsTouched();
    }
  }
}

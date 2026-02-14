/**
 * Login Component for SouqSyria marketplace
 *
 * @description Standalone Angular component providing user login functionality.
 * Renders a reactive form with email, password, and remember-me checkbox.
 * Dispatches NgRx AuthActions.login on valid submission, shows inline
 * validation errors, and displays success banners for post-verification
 * or post-password-reset redirects via query parameters.
 *
 * S2 Enhancements:
 * - Warning banner when <= 2 login attempts remain
 * - Lockout banner with countdown timer when account is locked
 * - Remember-me preference restored from localStorage
 * - Submit button disabled during lockout
 *
 * @swagger
 * components:
 *   schemas:
 *     LoginComponent:
 *       type: object
 *       description: User login form component
 *       properties:
 *         form:
 *           type: object
 *           description: Reactive FormGroup with email, password, rememberMe
 *         isLoading:
 *           type: boolean
 *           description: Whether login request is in progress
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message from failed login attempt
 *         showVerifiedMessage:
 *           type: boolean
 *           description: Whether to show email verified success banner
 *         showPasswordResetMessage:
 *           type: boolean
 *           description: Whether to show password reset success banner
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AuthActions } from '../../store/auth.actions';
import {
  selectIsLoading,
  selectError,
  selectRemainingAttempts,
  selectLockedUntilMinutes,
  selectIsAccountLocked,
} from '../../store/auth.selectors';
import { TokenService } from '../../services/token.service';
import { SocialAuthButtonsComponent } from '../social-auth-buttons/social-auth-buttons.component';

/**
 * LoginComponent
 *
 * @description Smart standalone component that handles user authentication.
 * Collects email and password with client-side validation, provides a
 * remember-me checkbox, and links to registration and forgot-password flows.
 * Checks ActivatedRoute queryParams for 'verified' and 'passwordReset' flags
 * to show contextual success messages after email verification or password reset.
 *
 * @usageNotes
 * Route: /auth/login
 * Query params: ?verified=true (after OTP verification), ?passwordReset=true (after password reset)
 */
@Component({
  selector: 'app-login',
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
    MatCheckboxModule,
    SocialAuthButtonsComponent,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand-mark">
          <div class="auth-brand-icon"><span>س</span></div>
        </div>
        <div class="auth-header">
          <h1>{{ 'auth.login.title' | translate }}</h1>
          <p>{{ 'auth.login.subtitle' | translate }}</p>
        </div>

        @if (showVerifiedMessage()) {
          <div class="success-message" role="status" aria-live="polite">
            {{ 'auth.login.verifiedSuccess' | translate }}
          </div>
        }

        @if (showPasswordResetMessage()) {
          <div class="success-message" role="status" aria-live="polite">
            {{ 'auth.login.passwordResetSuccess' | translate }}
          </div>
        }

        <!-- Lockout banner with countdown -->
        @if (isAccountLocked()) {
          <div class="lockout-message" role="alert" aria-live="assertive">
            <strong>{{ 'auth.errors.accountLockedTitle' | translate }}</strong>
            <p>{{ 'auth.errors.accountLockedCountdown' | translate:{ minutes: lockoutCountdown() } }}</p>
          </div>
        }

        <!-- Warning banner when <= 2 attempts remain -->
        @if (!isAccountLocked() && remainingAttempts() !== null && remainingAttempts()! <= 2 && remainingAttempts()! > 0) {
          <div class="warning-message" role="alert" aria-live="polite">
            {{ 'auth.errors.attemptsWarning' | translate:{ count: remainingAttempts() } }}
          </div>
        }

        @if (error() && !isAccountLocked()) {
          <div class="error-message" role="alert" aria-live="polite">
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Email field -->
          <mat-form-field appearance="outline">
            <mat-label>{{ 'auth.login.email' | translate }}</mat-label>
            <input
              matInput
              formControlName="email"
              type="email"
              autocomplete="email"
              autofocus
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
            <mat-label>{{ 'auth.login.password' | translate }}</mat-label>
            <input
              matInput
              formControlName="password"
              [type]="hidePassword() ? 'password' : 'text'"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="'auth.login.togglePassword' | translate"
            >
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>{{ 'auth.validation.passwordRequired' | translate }}</mat-error>
            }
          </mat-form-field>

          <!-- Remember me and forgot password -->
          <div class="form-options">
            <mat-checkbox formControlName="rememberMe" color="primary">
              {{ 'auth.login.rememberMe' | translate }}
            </mat-checkbox>
            <span class="remember-me-hint" *ngIf="form.get('rememberMe')?.value">
              {{ 'auth.login.rememberMeHint' | translate }}
            </span>
            <a routerLink="/auth/forgot-password">
              {{ 'auth.login.forgotPassword' | translate }}
            </a>
          </div>

          <!-- Submit button -->
          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            type="submit"
            [disabled]="form.invalid || isLoading() || isAccountLocked()"
          >
            @if (isLoading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              {{ 'auth.login.submit' | translate }}
            }
          </button>
        </form>

        <!-- Social OAuth login buttons -->
        <app-social-auth-buttons></app-social-auth-buttons>

        <!-- Footer with register link -->
        <div class="auth-footer">
          {{ 'auth.login.noAccount' | translate }}
          <a routerLink="/auth/register">{{ 'auth.login.registerLink' | translate }}</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  /** @description NgRx store for dispatching auth actions and selecting state */
  private readonly store = inject(Store);

  /** @description Angular form builder for reactive form creation */
  private readonly fb = inject(FormBuilder);

  /** @description ActivatedRoute for reading query parameters */
  private readonly route = inject(ActivatedRoute);

  /** @description Router for clearing query params after display (L2 fix) */
  private readonly router = inject(Router);

  /** @description Token service for reading remember-me preference */
  private readonly tokenService = inject(TokenService);

  /** @description DestroyRef for cleanup of countdown timer */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Loading state signal from NgRx store
   * @description Converted from Observable to Signal via toSignal for template binding
   */
  readonly isLoading = toSignal(this.store.select(selectIsLoading), {
    initialValue: false,
  });

  /**
   * Error state signal from NgRx store
   * @description Displays backend error messages (e.g., invalid credentials)
   */
  readonly error = toSignal(this.store.select(selectError), {
    initialValue: null,
  });

  /**
   * Remaining login attempts before lockout
   * @description Shows warning when <= 2 attempts remain
   */
  readonly remainingAttempts = toSignal(
    this.store.select(selectRemainingAttempts),
    { initialValue: null },
  );

  /**
   * Whether the account is currently locked
   * @description Derived from NgRx state: errorCode === 'ACCOUNT_LOCKED'
   */
  readonly isAccountLocked = toSignal(
    this.store.select(selectIsAccountLocked),
    { initialValue: false },
  );

  /**
   * Show verified success message
   * @description Derived from ActivatedRoute queryParams 'verified' flag.
   * Displays when redirected from OTP verification flow.
   */
  readonly showVerifiedMessage = toSignal(
    this.route.queryParams.pipe(
      map((params) => params['verified'] === 'true'),
    ),
    { initialValue: false },
  );

  /**
   * Show password reset success message
   * @description Derived from ActivatedRoute queryParams 'passwordReset' flag.
   * Displays when redirected from password reset flow.
   */
  readonly showPasswordResetMessage = toSignal(
    this.route.queryParams.pipe(
      map((params) => params['passwordReset'] === 'true'),
    ),
    { initialValue: false },
  );

  /** @description Controls password field visibility toggle */
  readonly hidePassword = signal(true);

  /** @description Lockout countdown in minutes, updated every 60s */
  readonly lockoutCountdown = signal<number>(0);

  /** @description Reference to the countdown interval for cleanup */
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Login reactive form
   * @description FormGroup with email, password, and rememberMe fields
   */
  form!: FormGroup;

  /**
   * Initialize the login form
   * @description Creates the reactive form with email and password validation.
   * Restores remember-me preference from localStorage.
   * Starts lockout countdown timer when lockedUntilMinutes changes.
   * Clears any previous auth errors on component initialization.
   */
  ngOnInit(): void {
    // Restore remember-me preference from localStorage
    const savedRememberMe = this.tokenService.getRememberMe();

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [savedRememberMe],
    });

    this.store.dispatch(AuthActions.clearError());

    // Subscribe to lockedUntilMinutes to start countdown timer
    this.store.select(selectLockedUntilMinutes).subscribe((minutes) => {
      this.clearCountdownTimer();
      if (minutes != null && minutes > 0) {
        this.startCountdown(minutes);
      }
    });

    // Cleanup timer on component destroy
    this.destroyRef.onDestroy(() => {
      this.clearCountdownTimer();
    });

    // L2 fix: Clear success query params after displaying the message
    const params = this.route.snapshot.queryParams;
    if (params['verified'] || params['passwordReset']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  /**
   * Toggle password field visibility
   * @description Switches between password and text input type
   */
  togglePasswordVisibility(): void {
    this.hidePassword.update((v) => !v);
  }

  /**
   * Handle form submission
   * @description Validates the form and dispatches AuthActions.login with email,
   * password, and rememberMe. If form is invalid, marks all controls as touched.
   */
  onSubmit(): void {
    if (this.form.valid) {
      const { email, password, rememberMe } = this.form.value;
      this.store.dispatch(
        AuthActions.login({ email, password, rememberMe: !!rememberMe }),
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

  /**
   * Start the lockout countdown timer
   * @description Initializes the countdown signal and creates an interval
   * that decrements every 60 seconds until lockout expires.
   */
  private startCountdown(minutes: number): void {
    this.lockoutCountdown.set(minutes);
    this.countdownInterval = setInterval(() => {
      const current = this.lockoutCountdown();
      if (current <= 1) {
        this.lockoutCountdown.set(0);
        this.clearCountdownTimer();
        // Clear the lockout state so user can try again
        this.store.dispatch(AuthActions.clearError());
      } else {
        this.lockoutCountdown.set(current - 1);
      }
    }, 60_000);
  }

  /** @description Clear the countdown interval timer */
  private clearCountdownTimer(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}

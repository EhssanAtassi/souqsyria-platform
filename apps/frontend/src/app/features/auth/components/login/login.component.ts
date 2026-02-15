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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  selectRateLimitRetryAfter,
  selectIsRateLimited,
} from '../../store/auth.selectors';
import { TokenService } from '../../services/token.service';

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
  ],
  templateUrl: './login.component.html',
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
   * Whether rate limiting is active (HTTP 429)
   * @description Derived from NgRx state: rateLimitRetryAfter > 0
   */
  readonly isRateLimited = toSignal(
    this.store.select(selectIsRateLimited),
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

  /** @description Rate limit countdown in seconds, updated every 1s */
  readonly rateLimitCountdown = signal<number>(0);

  /** @description Reference to the lockout countdown interval for cleanup */
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  /** @description Reference to the rate limit countdown interval for cleanup */
  private rateLimitInterval: ReturnType<typeof setInterval> | null = null;

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
    this.store
      .select(selectLockedUntilMinutes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((minutes) => {
        this.clearCountdownTimer();
        if (minutes != null && minutes > 0) {
          this.startCountdown(minutes);
        }
      });

    // Subscribe to rateLimitRetryAfter to start countdown timer (seconds)
    this.store
      .select(selectRateLimitRetryAfter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((seconds) => {
        this.clearRateLimitTimer();
        if (seconds != null && seconds > 0) {
          this.startRateLimitCountdown(seconds);
        }
      });

    // Cleanup timers on component destroy
    this.destroyRef.onDestroy(() => {
      this.clearCountdownTimer();
      this.clearRateLimitTimer();
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

  /** @description Clear the lockout countdown interval timer */
  private clearCountdownTimer(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Start the rate limit countdown timer (seconds)
   * @description Initializes the rateLimitCountdown signal and ticks every second.
   * When it reaches 0, clears the rate limit state so the user can retry.
   */
  private startRateLimitCountdown(seconds: number): void {
    this.rateLimitCountdown.set(seconds);
    this.rateLimitInterval = setInterval(() => {
      const current = this.rateLimitCountdown();
      if (current <= 1) {
        this.rateLimitCountdown.set(0);
        this.clearRateLimitTimer();
        this.store.dispatch(AuthActions.clearError());
      } else {
        this.rateLimitCountdown.set(current - 1);
      }
    }, 1_000);
  }

  /** @description Clear the rate limit countdown interval timer */
  private clearRateLimitTimer(): void {
    if (this.rateLimitInterval) {
      clearInterval(this.rateLimitInterval);
      this.rateLimitInterval = null;
    }
  }
}

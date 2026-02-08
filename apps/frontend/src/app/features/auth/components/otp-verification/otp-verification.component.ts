/**
 * OTP Verification Component for SouqSyria marketplace
 *
 * @description Standalone Angular component for email OTP verification after registration.
 * Displays a 6-digit code input, a countdown timer for resend, and dispatches
 * NgRx actions for OTP verification and resend. Redirects to /auth/register if
 * no OTP email is present in the store.
 *
 * @swagger
 * components:
 *   schemas:
 *     OtpVerificationComponent:
 *       type: object
 *       description: OTP email verification form component
 *       properties:
 *         form:
 *           type: object
 *           description: Reactive FormGroup with otpCode field
 *         isLoading:
 *           type: boolean
 *           description: Whether verification request is in progress
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message from failed OTP verification
 *         otpEmail:
 *           type: string
 *           nullable: true
 *           description: Email address the OTP was sent to
 *         countdown:
 *           type: number
 *           description: Seconds remaining before resend is allowed
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  selectOtpEmail,
} from '../../store/auth.selectors';
import { otpFormat } from '../../validators/auth.validators';
import { LanguageService } from '../../../../shared/services/language.service';

/**
 * OtpVerificationComponent
 *
 * @description Smart standalone component that handles OTP email verification.
 * Reads the OTP email from the NgRx store (set during registration).
 * Provides a 6-digit OTP input with format validation, a 60-second countdown
 * timer for the resend button, and dispatches verifyOtp/resendOtp actions.
 *
 * @usageNotes
 * Route: /auth/verify-otp
 * Prerequisite: otpEmail must be set in the store (from registration flow)
 * Redirects to /auth/register if otpEmail is null
 */
@Component({
  selector: 'app-otp-verification',
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
        <div class="auth-header">
          <h1>{{ 'auth.otp.title' | translate }}</h1>
          <p>{{ 'auth.otp.subtitle' | translate }}</p>
        </div>

        @if (otpEmail()) {
          <div class="email-display">
            {{ 'auth.otp.codeSentTo' | translate }}
            <strong>{{ otpEmail() }}</strong>
          </div>
        }

        @if (error()) {
          <div class="error-message">
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- OTP code field -->
          <mat-form-field appearance="outline" class="otp-input">
            <mat-label>{{ 'auth.otp.codeLabel' | translate }}</mat-label>
            <input
              matInput
              formControlName="otpCode"
              type="text"
              maxlength="6"
              autocomplete="one-time-code"
              inputmode="numeric"
              placeholder="000000"
            />
            <mat-icon matSuffix>lock</mat-icon>
            @if (form.get('otpCode')?.hasError('required') && form.get('otpCode')?.touched) {
              <mat-error>{{ 'auth.validation.otpRequired' | translate }}</mat-error>
            }
            @if (form.get('otpCode')?.hasError('otpFormat') && form.get('otpCode')?.touched) {
              <mat-error>{{ 'auth.validation.otpFormat' | translate }}</mat-error>
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
              {{ 'auth.otp.submit' | translate }}
            }
          </button>
        </form>

        <!-- OTP validity timer (10 minutes) -->
        @if (otpValidityCountdown() > 0) {
          <div class="otp-validity-timer">
            <mat-icon class="timer-icon">timer</mat-icon>
            <span>
              {{ 'auth.otp.validFor' | translate }}
              <strong>{{ formatTime(otpValidityCountdown()) }}</strong>
            </span>
          </div>
        } @else {
          <div class="otp-validity-timer expired">
            <mat-icon class="timer-icon">timer_off</mat-icon>
            <span>{{ 'auth.otp.expired' | translate }}</span>
          </div>
        }

        <!-- Resend section with countdown -->
        <div class="resend-section">
          @if (countdown() > 0) {
            <span>
              {{ 'auth.otp.resendIn' | translate }}
              <span class="countdown">{{ countdown() }}s</span>
            </span>
          } @else {
            <button
              mat-button
              class="resend-btn"
              (click)="resendOtp()"
              [disabled]="isLoading()"
            >
              {{ 'auth.otp.resendButton' | translate }}
            </button>
          }
        </div>

        <!-- Footer -->
        <div class="auth-footer">
          <a routerLink="/auth/register">{{ 'auth.otp.backToRegister' | translate }}</a>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./otp-verification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  /** @description Language service for RTL direction binding */
  readonly languageService = inject(LanguageService);

  /** @description NgRx store for dispatching auth actions and selecting state */
  private readonly store = inject(Store);

  /** @description Angular form builder for reactive form creation */
  private readonly fb = inject(FormBuilder);

  /** @description Angular router for navigation on missing OTP email */
  private readonly router = inject(Router);

  /**
   * Loading state signal from NgRx store
   * @description Converted from Observable to Signal via toSignal for template binding
   */
  readonly isLoading = toSignal(this.store.select(selectIsLoading), {
    initialValue: false,
  });

  /**
   * Error state signal from NgRx store
   * @description Displays backend error messages (e.g., invalid OTP, expired)
   */
  readonly error = toSignal(this.store.select(selectError), {
    initialValue: null,
  });

  /**
   * OTP email signal from NgRx store
   * @description Email address the OTP was sent to during registration
   */
  readonly otpEmail = toSignal(this.store.select(selectOtpEmail), {
    initialValue: null,
  });

  /**
   * Resend countdown timer signal
   * @description Counts down from 60 seconds for the resend OTP button
   */
  readonly countdown = signal(60);

  /**
   * OTP validity countdown signal (10 minutes = 600 seconds)
   * @description Shows how much time remains before the OTP code expires.
   * Per SS-AUTH-001: OTP is valid for 10 minutes.
   */
  readonly otpValidityCountdown = signal(600);

  /** @description Interval reference for the resend countdown timer cleanup */
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  /** @description Interval reference for the OTP validity timer cleanup */
  private validityInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * OTP verification reactive form
   * @description FormGroup with a single otpCode field using otpFormat validator
   */
  form!: FormGroup;

  /**
   * Redirect effect for missing OTP email
   * @description Watches the otpEmail signal and redirects to /auth/register
   * if the email is null (user navigated directly to this page)
   */
  private readonly redirectEffect = effect(() => {
    const email = this.otpEmail();
    if (email === null) {
      this.router.navigate(['/auth/register']);
    }
  });

  /**
   * Initialize the OTP form and start countdown timer
   * @description Creates the reactive form, clears previous errors,
   * and starts the 60-second countdown for the resend button.
   */
  ngOnInit(): void {
    this.form = this.fb.group({
      otpCode: ['', [Validators.required, otpFormat()]],
    });

    this.store.dispatch(AuthActions.clearError());
    this.startCountdown();
    this.startValidityTimer();
  }

  /**
   * Cleanup countdown timers on component destroy
   * @description Clears all setInterval timers to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.clearCountdown();
    this.clearValidityTimer();
  }

  /**
   * Handle OTP form submission
   * @description Validates the form and dispatches AuthActions.verifyOtp
   * with the email from the store and the entered OTP code.
   */
  onSubmit(): void {
    if (this.form.valid && this.otpEmail()) {
      const { otpCode } = this.form.value;
      this.store.dispatch(
        AuthActions.verifyOtp({ email: this.otpEmail()!, otpCode }),
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

  /**
   * Resend OTP code
   * @description Dispatches AuthActions.resendOtp and restarts the countdown timer
   */
  resendOtp(): void {
    if (this.otpEmail()) {
      this.store.dispatch(
        AuthActions.resendOtp({ email: this.otpEmail()! }),
      );
      this.countdown.set(60);
      this.startCountdown();
      this.otpValidityCountdown.set(600);
      this.startValidityTimer();
    }
  }

  /**
   * Start the 60-second countdown timer
   * @description Uses setInterval to decrement the countdown signal every second.
   * Clears the interval when countdown reaches 0.
   * @private
   */
  private startCountdown(): void {
    this.clearCountdown();
    this.countdownInterval = setInterval(() => {
      this.countdown.update((v) => {
        if (v <= 1) {
          this.clearCountdown();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  /**
   * Clear the resend countdown interval
   * @description Stops the setInterval timer to prevent memory leaks
   * @private
   */
  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Start the 10-minute OTP validity timer
   * @description Decrements the validity countdown every second.
   * Shows user how much time remains before the OTP code expires.
   * @private
   */
  private startValidityTimer(): void {
    this.clearValidityTimer();
    this.validityInterval = setInterval(() => {
      this.otpValidityCountdown.update((v) => {
        if (v <= 1) {
          this.clearValidityTimer();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  /**
   * Clear the OTP validity timer interval
   * @private
   */
  private clearValidityTimer(): void {
    if (this.validityInterval) {
      clearInterval(this.validityInterval);
      this.validityInterval = null;
    }
  }

  /**
   * Format seconds into MM:SS display string
   * @description Converts total seconds to a human-readable minute:second format
   * @param totalSeconds - Total seconds remaining
   * @returns Formatted string like "9:45" or "0:30"
   */
  formatTime(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

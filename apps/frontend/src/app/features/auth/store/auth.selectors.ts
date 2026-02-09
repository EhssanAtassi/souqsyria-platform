/**
 * NgRx Auth Selectors for SouqSyria marketplace
 *
 * @description Memoized selector functions for reading slices of the
 * authentication state. Built with createFeatureSelector and createSelector
 * for optimal performance with NgRx's memoization. Provides granular
 * access to every property in the AuthState plus derived computed values.
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthSelectors:
 *       type: object
 *       description: NgRx selector functions for the auth feature state
 */

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from '../models/auth.models';
import { authFeatureKey } from './auth.reducer';

// ─── Feature Selector ─────────────────────────────────────────────

/**
 * Select the entire auth state slice
 *
 * @description Root feature selector that retrieves the auth state
 * from the global NgRx store using the registered feature key.
 * All other auth selectors derive from this one.
 */
export const selectAuthState =
  createFeatureSelector<AuthState>(authFeatureKey);

// ─── Primary State Selectors ──────────────────────────────────────

/**
 * Select the authenticated user object
 *
 * @description Returns the AuthUser or null if not logged in.
 * Contains id, email, role, verification status, and timestamps.
 */
export const selectUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user,
);

/**
 * Select the authentication status
 *
 * @description Returns true when the user has a valid session
 * (tokens stored and authenticated flag set).
 */
export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated,
);

/**
 * Select the loading state
 *
 * @description Returns true when any auth operation is in progress
 * (login, register, verify, reset, etc.). Used to show spinners
 * and disable form submission buttons.
 */
export const selectIsLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoading,
);

/**
 * Select the current error message
 *
 * @description Returns the error string from the most recent failed
 * auth operation, or null if no error. Used to display error banners
 * and inline form validation messages.
 */
export const selectError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error,
);

/**
 * Select the JWT access token
 *
 * @description Returns the current access token string or null.
 * Used by the auth interceptor for attaching Authorization headers.
 */
export const selectAccessToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.accessToken,
);

/**
 * Select the JWT refresh token
 *
 * @description Returns the current refresh token string or null.
 * Used for silent token refresh when the access token expires.
 */
export const selectRefreshToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.refreshToken,
);

// ─── Login Error Detail Selectors ─────────────────────────────────

/**
 * Select the structured login error code
 *
 * @description Returns 'ACCOUNT_LOCKED' or 'INVALID_CREDENTIALS' or null.
 * Used to conditionally render warning/lockout banners.
 */
export const selectLoginErrorCode = createSelector(
  selectAuthState,
  (state: AuthState) => state.loginErrorCode,
);

/**
 * Select remaining login attempts before lockout
 *
 * @description Returns the count of attempts left or null when not applicable.
 * Shown as a warning when <= 2 attempts remain.
 */
export const selectRemainingAttempts = createSelector(
  selectAuthState,
  (state: AuthState) => state.remainingAttempts,
);

/**
 * Select minutes until lockout expires
 *
 * @description Returns the lockout duration in minutes or null.
 * Used to render the lockout countdown timer.
 */
export const selectLockedUntilMinutes = createSelector(
  selectAuthState,
  (state: AuthState) => state.lockedUntilMinutes,
);

/**
 * Select whether the account is currently locked
 *
 * @description Derived selector: true when loginErrorCode is ACCOUNT_LOCKED
 * and lockedUntilMinutes is set.
 */
export const selectIsAccountLocked = createSelector(
  selectLoginErrorCode,
  selectLockedUntilMinutes,
  (errorCode, minutes) => errorCode === 'ACCOUNT_LOCKED' && minutes != null && minutes > 0,
);

// ─── OTP Flow Selectors ───────────────────────────────────────────

/**
 * Select the OTP email address
 *
 * @description Returns the email address used during the OTP
 * verification flow. Set after registration so the verify-otp
 * component knows which email to display and submit.
 */
export const selectOtpEmail = createSelector(
  selectAuthState,
  (state: AuthState) => state.otpEmail,
);

/**
 * Select whether OTP has been sent
 *
 * @description Returns true after successful registration or
 * resend-otp request. Used to show OTP input UI and resend timer.
 */
export const selectOtpSent = createSelector(
  selectAuthState,
  (state: AuthState) => state.otpSent,
);

// ─── Password Reset Selectors ─────────────────────────────────────

/**
 * Select whether reset email has been sent
 *
 * @description Returns true after a successful forgot-password request.
 * Used to show the "check your email" confirmation UI.
 */
export const selectResetEmailSent = createSelector(
  selectAuthState,
  (state: AuthState) => state.resetEmailSent,
);

/**
 * Select whether password reset was successful
 *
 * @description Returns true after a successful reset-password request.
 * Used to show the success confirmation before redirecting to login.
 */
export const selectPasswordResetSuccess = createSelector(
  selectAuthState,
  (state: AuthState) => state.passwordResetSuccess,
);

// ─── Derived / Computed Selectors ─────────────────────────────────

/**
 * Select the user's email address
 *
 * @description Derived selector that extracts just the email string
 * from the user object. Returns null if user is not logged in.
 * Useful for display in navbars, headers, and account pages.
 */
export const selectUserEmail = createSelector(
  selectUser,
  (user) => user?.email ?? null,
);

/**
 * Select whether the user's email is verified
 *
 * @description Derived selector that checks the isVerified flag on
 * the user object. Returns false if user is null or not verified.
 * Used by guards and UI to enforce email verification requirements.
 */
export const selectIsVerified = createSelector(
  selectUser,
  (user) => user?.isVerified ?? false,
);

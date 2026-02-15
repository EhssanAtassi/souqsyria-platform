/**
 * NgRx Auth Reducer for SouqSyria marketplace
 *
 * @description Manages the authentication state tree using createReducer.
 * Handles state transitions for all auth flows including login, register,
 * OTP verification, password reset, token refresh, logout, and session
 * restoration. Follows immutable state update patterns.
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthReducer:
 *       type: object
 *       description: NgRx reducer for the auth feature state slice
 */

import { createReducer, on } from '@ngrx/store';
import { AuthState } from '../models/auth.models';
import { AuthActions } from './auth.actions';

/**
 * NgRx feature key for the auth state slice
 *
 * @description Used by StoreModule.forFeature() and createFeatureSelector()
 * to register and select the auth state within the global store.
 */
export const authFeatureKey = 'auth';

/**
 * Initial authentication state
 *
 * @description Default state values applied when the store initializes
 * or when the user logs out. All values represent an unauthenticated
 * session with no pending operations.
 */
export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  otpEmail: null,
  otpSent: false,
  resetEmailSent: false,
  passwordResetSuccess: false,
  loginErrorCode: null,
  remainingAttempts: null,
  lockedUntilMinutes: null,
  rateLimitRetryAfter: null,
};

/**
 * Auth reducer function
 *
 * @description Pure function that takes the current AuthState and an action,
 * returning the next AuthState. Each `on()` handler maps an action to an
 * immutable state transformation covering the full auth lifecycle.
 */
export const authReducer = createReducer(
  initialAuthState,

  // ─── Login ────────────────────────────────────────────────────

  /**
   * @description Sets loading state when login is initiated.
   * Clears any previous error to give a clean UX.
   */
  on(AuthActions.login, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null,
    loginErrorCode: null,
    remainingAttempts: null,
    lockedUntilMinutes: null,
    rateLimitRetryAfter: null,
  })),

  /**
   * @description Stores the access token and marks the user as authenticated.
   * User profile data is loaded separately via loadUserFromToken.
   */
  on(AuthActions.loginSuccess, (state, { accessToken }): AuthState => ({
    ...state,
    accessToken,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  })),

  /**
   * @description Captures the login error message and structured error details.
   * Stores errorCode, remainingAttempts, lockedUntilMinutes for UI rendering.
   */
  on(
    AuthActions.loginFailure,
    (state, { error, errorCode, remainingAttempts, lockedUntilMinutes, retryAfterSeconds }): AuthState => ({
      ...state,
      error,
      isLoading: false,
      loginErrorCode: errorCode ?? null,
      remainingAttempts: remainingAttempts ?? null,
      lockedUntilMinutes: lockedUntilMinutes ?? null,
      rateLimitRetryAfter: retryAfterSeconds ?? null,
    }),
  ),

  // ─── Register ─────────────────────────────────────────────────

  /**
   * @description Sets loading state when registration is initiated.
   * Clears any previous error.
   */
  on(AuthActions.register, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  /**
   * @description Stores the full registration response: user data, tokens,
   * and marks OTP as sent (backend auto-sends OTP after registration).
   * Sets otpEmail from the registered user's email for the OTP form.
   */
  on(
    AuthActions.registerSuccess,
    (state, { user, accessToken, refreshToken }): AuthState => ({
      ...state,
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      otpEmail: user.email,
      otpSent: true,
    }),
  ),

  /**
   * @description Captures the registration error and stops loading.
   */
  on(AuthActions.registerFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Verify OTP ───────────────────────────────────────────────

  /**
   * @description Sets loading state when OTP verification is submitted.
   */
  on(AuthActions.verifyOtp, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  /**
   * @description Marks the current user as verified after successful OTP check.
   * Updates the user object immutably while preserving all other fields.
   */
  on(AuthActions.verifyOtpSuccess, (state): AuthState => ({
    ...state,
    isLoading: false,
    error: null,
    user: state.user
      ? { ...state.user, isVerified: true }
      : null,
  })),

  /**
   * @description Captures OTP verification error (invalid code, expired, etc.).
   */
  on(AuthActions.verifyOtpFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Resend OTP ───────────────────────────────────────────────

  /**
   * @description Sets loading state when requesting a new OTP code.
   */
  on(AuthActions.resendOtp, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  /**
   * @description Confirms OTP was resent successfully. Keeps otpSent true.
   */
  on(AuthActions.resendOtpSuccess, (state): AuthState => ({
    ...state,
    isLoading: false,
    error: null,
    otpSent: true,
  })),

  /**
   * @description Captures resend OTP error.
   */
  on(AuthActions.resendOtpFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Forgot Password ─────────────────────────────────────────

  /**
   * @description Sets loading state when requesting a password reset email.
   */
  on(AuthActions.forgotPassword, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null,
    resetEmailSent: false,
  })),

  /**
   * @description Marks resetEmailSent as true to show the confirmation UI.
   */
  on(AuthActions.forgotPasswordSuccess, (state): AuthState => ({
    ...state,
    isLoading: false,
    error: null,
    resetEmailSent: true,
  })),

  /**
   * @description Captures forgot password error.
   */
  on(AuthActions.forgotPasswordFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Reset Password ──────────────────────────────────────────

  /**
   * @description Sets loading state when submitting new password with reset token.
   */
  on(AuthActions.resetPassword, (state): AuthState => ({
    ...state,
    isLoading: true,
    error: null,
    passwordResetSuccess: false,
  })),

  /**
   * @description Marks password reset as successful to show confirmation UI.
   */
  on(AuthActions.resetPasswordSuccess, (state): AuthState => ({
    ...state,
    isLoading: false,
    error: null,
    passwordResetSuccess: true,
  })),

  /**
   * @description Captures reset password error (invalid token, expired, etc.).
   */
  on(AuthActions.resetPasswordFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Refresh Token ────────────────────────────────────────────

  /**
   * @description No loading state for silent token refresh to avoid UI flicker.
   */
  on(AuthActions.refreshToken, (state): AuthState => ({
    ...state,
  })),

  /**
   * @description Updates the access token after successful silent refresh.
   */
  on(AuthActions.refreshTokenSuccess, (state, { accessToken }): AuthState => ({
    ...state,
    accessToken,
  })),

  /**
   * @description Captures token refresh failure. The auth interceptor may
   * trigger a logout if the refresh token itself is expired.
   */
  on(AuthActions.refreshTokenFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Logout ───────────────────────────────────────────────────

  /**
   * @description Sets loading state when logout is initiated.
   */
  on(AuthActions.logout, (state): AuthState => ({
    ...state,
    isLoading: true,
  })),

  /**
   * @description Resets the entire auth state back to initial values.
   * Clears user, tokens, and all transient flags.
   */
  on(AuthActions.logoutSuccess, (): AuthState => ({
    ...initialAuthState,
  })),

  /**
   * @description Captures logout error. In practice, the effect will still
   * clear tokens client-side even if the server call fails.
   */
  on(AuthActions.logoutFailure, (state, { error }): AuthState => ({
    ...state,
    error,
    isLoading: false,
  })),

  // ─── Clear Error ──────────────────────────────────────────────

  /**
   * @description Clears the error message from state. Used when navigating
   * away from error-displaying views or dismissing error banners.
   */
  on(AuthActions.clearError, (state): AuthState => ({
    ...state,
    error: null,
    loginErrorCode: null,
    remainingAttempts: null,
    lockedUntilMinutes: null,
    rateLimitRetryAfter: null,
  })),

  // ─── Load User From Token ─────────────────────────────────────

  /**
   * @description Sets loading state when attempting to restore session
   * from a stored JWT token on app initialization.
   */
  on(AuthActions.loadUserFromToken, (state): AuthState => ({
    ...state,
    isLoading: true,
  })),

  /**
   * @description Restores the user session from a stored token.
   * Sets user data decoded from the JWT payload and marks as authenticated.
   */
  on(
    AuthActions.loadUserFromTokenSuccess,
    (state, { user, accessToken }): AuthState => ({
      ...state,
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }),
  ),

  /**
   * @description No valid token found or decoding failed.
   * Simply stops loading without setting an error (expected on first visit).
   */
  on(AuthActions.loadUserFromTokenFailure, (state): AuthState => ({
    ...state,
    isLoading: false,
  })),
);

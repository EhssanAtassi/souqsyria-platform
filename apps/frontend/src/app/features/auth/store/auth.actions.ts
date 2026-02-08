/**
 * NgRx Auth Actions for SouqSyria marketplace
 *
 * @description Defines all authentication-related NgRx actions using
 * createActionGroup. Covers the complete auth lifecycle: login, register,
 * OTP verification, password reset, token refresh, logout, and session
 * restoration from stored tokens.
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthActions:
 *       type: object
 *       description: NgRx action definitions for the auth feature store
 */

import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { AuthUser } from '../models/auth.models';

/**
 * Auth action group containing all authentication actions
 *
 * @description Single createActionGroup with source 'Auth' that defines
 * every action dispatched throughout the authentication flows. Actions
 * follow the pattern: trigger -> success | failure for async operations.
 *
 * Action groups covered:
 * - Login: email/password authentication
 * - Register: new user registration
 * - VerifyOtp: email OTP verification after registration
 * - ResendOtp: request a new OTP code
 * - ForgotPassword: initiate password reset via email
 * - ResetPassword: set new password with reset token
 * - RefreshToken: silent JWT access token refresh
 * - Logout: session termination
 * - ClearError: reset error state
 * - LoadUser: restore session from stored JWT token
 */
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    // ─── Login ────────────────────────────────────────────────

    /**
     * @description Dispatched when user submits the login form
     * @param email - User email address
     * @param password - User password
     */
    'Login': props<{ email: string; password: string }>(),

    /**
     * @description Dispatched after successful backend login response
     * @param accessToken - JWT access token from the backend
     */
    'Login Success': props<{ accessToken: string }>(),

    /**
     * @description Dispatched when login request fails
     * @param error - Error message from the backend or network
     */
    'Login Failure': props<{ error: string }>(),

    // ─── Register ─────────────────────────────────────────────

    /**
     * @description Dispatched when user submits the registration form
     * @param email - New user email address
     * @param password - New user password
     * @param fullName - Optional user full name
     */
    'Register': props<{ email: string; password: string; fullName: string }>(),

    /**
     * @description Dispatched after successful backend registration
     * @param user - Created user data
     * @param accessToken - JWT access token
     * @param refreshToken - JWT refresh token
     */
    'Register Success': props<{
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    }>(),

    /**
     * @description Dispatched when registration request fails
     * @param error - Error message from the backend or network
     */
    'Register Failure': props<{ error: string }>(),

    // ─── Verify OTP ───────────────────────────────────────────

    /**
     * @description Dispatched when user submits the OTP verification form
     * @param email - Email address associated with the OTP
     * @param otpCode - 6-digit OTP code entered by the user
     */
    'Verify Otp': props<{ email: string; otpCode: string }>(),

    /**
     * @description Dispatched after successful OTP verification
     */
    'Verify Otp Success': emptyProps(),

    /**
     * @description Dispatched when OTP verification fails
     * @param error - Error message (invalid code, expired, etc.)
     */
    'Verify Otp Failure': props<{ error: string }>(),

    // ─── Resend OTP ───────────────────────────────────────────

    /**
     * @description Dispatched when user requests a new OTP code
     * @param email - Email address to resend OTP to
     */
    'Resend Otp': props<{ email: string }>(),

    /**
     * @description Dispatched after OTP is successfully resent
     */
    'Resend Otp Success': emptyProps(),

    /**
     * @description Dispatched when OTP resend request fails
     * @param error - Error message from the backend
     */
    'Resend Otp Failure': props<{ error: string }>(),

    // ─── Forgot Password ─────────────────────────────────────

    /**
     * @description Dispatched when user requests a password reset email
     * @param email - Email address to send the reset link to
     */
    'Forgot Password': props<{ email: string }>(),

    /**
     * @description Dispatched after reset email is successfully sent
     */
    'Forgot Password Success': emptyProps(),

    /**
     * @description Dispatched when forgot password request fails
     * @param error - Error message from the backend
     */
    'Forgot Password Failure': props<{ error: string }>(),

    // ─── Reset Password ──────────────────────────────────────

    /**
     * @description Dispatched when user submits a new password with reset token
     * @param resetToken - Token from the password reset email link
     * @param newPassword - New password chosen by the user
     */
    'Reset Password': props<{ resetToken: string; newPassword: string }>(),

    /**
     * @description Dispatched after password is successfully reset
     */
    'Reset Password Success': emptyProps(),

    /**
     * @description Dispatched when password reset fails
     * @param error - Error message (invalid token, expired, etc.)
     */
    'Reset Password Failure': props<{ error: string }>(),

    // ─── Refresh Token ────────────────────────────────────────

    /**
     * @description Dispatched to silently refresh the JWT access token
     */
    'Refresh Token': emptyProps(),

    /**
     * @description Dispatched after token is successfully refreshed
     * @param accessToken - New JWT access token
     */
    'Refresh Token Success': props<{ accessToken: string }>(),

    /**
     * @description Dispatched when token refresh fails (session expired)
     * @param error - Error message from the backend
     */
    'Refresh Token Failure': props<{ error: string }>(),

    // ─── Logout ───────────────────────────────────────────────

    /**
     * @description Dispatched when user initiates logout
     */
    'Logout': emptyProps(),

    /**
     * @description Dispatched after successful server-side logout
     */
    'Logout Success': emptyProps(),

    /**
     * @description Dispatched when logout request fails
     * @param error - Error message from the backend
     */
    'Logout Failure': props<{ error: string }>(),

    // ─── Clear Error ──────────────────────────────────────────

    /**
     * @description Dispatched to clear any auth error messages from state
     */
    'Clear Error': emptyProps(),

    // ─── Load User From Token ─────────────────────────────────

    /**
     * @description Dispatched on app initialization to restore session
     * from a stored JWT token in localStorage
     */
    'Load User From Token': emptyProps(),

    /**
     * @description Dispatched when user is successfully restored from token
     * @param user - Partial AuthUser decoded from the JWT payload
     * @param accessToken - The stored access token
     */
    'Load User From Token Success': props<{
      user: AuthUser;
      accessToken: string;
    }>(),

    /**
     * @description Dispatched when no valid token is found or decoding fails
     */
    'Load User From Token Failure': emptyProps(),
  },
});

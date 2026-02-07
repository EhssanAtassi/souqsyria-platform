/**
 * Authentication models for SouqSyria marketplace
 *
 * @description TypeScript interfaces and types matching the NestJS backend
 * auth API contracts. Covers registration, login, OTP verification,
 * password reset, and token management flows.
 *
 * @swagger
 * components:
 *   schemas:
 *     AuthModels:
 *       type: object
 *       description: Frontend auth model definitions for SouqSyria
 */

// ─── User & Auth State ───────────────────────────────────────

/**
 * Authenticated user returned from the backend after login/register
 *
 * @description Maps to the Partial<User> entity from NestJS auth responses
 */
export interface AuthUser {
  /** Database user ID */
  id: number;
  /** User email address */
  email: string;
  /** User full name (nullable) */
  fullName: string | null;
  /** User phone number (nullable) */
  phone: string | null;
  /** User role name */
  role: string;
  /** Email verification status */
  isVerified: boolean;
  /** Account ban status */
  isBanned: boolean;
  /** Account suspension status */
  isSuspended: boolean;
  /** Last login timestamp */
  lastLoginAt: Date | null;
  /** Account creation timestamp */
  createdAt: Date;
}

// ─── Registration ────────────────────────────────────────────

/**
 * Registration request payload
 *
 * @description Sent to POST /auth/register
 */
export interface RegisterRequest {
  /** Valid email address */
  email: string;
  /** Password (minimum 8 characters, 1 uppercase, 1 number) */
  password: string;
  /** User full name (required per SS-AUTH-001) */
  fullName: string;
}

/**
 * Registration response from backend
 *
 * @description Backend auto-logs in user and returns tokens + user data
 */
export interface RegisterResponse {
  /** Operation success flag */
  success: boolean;
  /** Partial user data (without sensitive fields) */
  user: AuthUser;
  /** JWT access token (1 day expiry) */
  accessToken: string;
  /** JWT refresh token (7 day expiry) */
  refreshToken: string;
  /** Human-readable message */
  message: string;
}

// ─── OTP Verification ────────────────────────────────────────

/**
 * OTP verification request payload
 *
 * @description Sent to POST /auth/verify-otp
 */
export interface VerifyOtpRequest {
  /** Email address that received the OTP */
  email: string;
  /** 6-digit OTP code */
  otpCode: string;
}

/**
 * OTP verification response
 *
 * @description Returned from POST /auth/verify-otp
 */
export interface VerifyOtpResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
}

/**
 * Resend OTP request payload
 *
 * @description Sent to POST /auth/resend-otp
 */
export interface ResendOtpRequest {
  /** Email address to resend OTP to */
  email: string;
}

// ─── Login ───────────────────────────────────────────────────

/**
 * Login request payload
 *
 * @description Sent to POST /auth/login
 */
export interface LoginRequest {
  /** User email address */
  email: string;
  /** User password */
  password: string;
}

/**
 * Login response from backend
 *
 * @description Returns JWT access token on successful login
 */
export interface LoginResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
  /** JWT access token (1 day expiry) */
  accessToken: string;
  /** JWT refresh token (7 day expiry) */
  refreshToken: string;
}

// ─── Password Reset ──────────────────────────────────────────

/**
 * Forgot password request payload
 *
 * @description Sent to POST /auth/forgot-password
 */
export interface ForgotPasswordRequest {
  /** Email address to send reset link to */
  email: string;
}

/**
 * Forgot password response
 *
 * @description Intentionally vague to prevent user enumeration
 */
export interface ForgotPasswordResponse {
  /** Operation success flag */
  success: boolean;
  /** Vague message (does not reveal if email exists) */
  message: string;
}

/**
 * Reset password request payload
 *
 * @description Sent to POST /auth/reset-password
 */
export interface ResetPasswordRequest {
  /** Reset token from the email link */
  resetToken: string;
  /** New password (minimum 8 characters) */
  newPassword: string;
}

/**
 * Reset password response
 *
 * @description Returned from POST /auth/reset-password
 */
export interface ResetPasswordResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
}

// ─── Token Management ────────────────────────────────────────

/**
 * Token refresh request payload
 *
 * @description Sent to POST /auth/refresh-token
 */
export interface RefreshTokenRequest {
  /** JWT refresh token used to obtain a new access token */
  token: string;
}

/**
 * Token refresh response
 *
 * @description Returns new access token and rotated refresh token
 */
export interface RefreshTokenResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
  /** New JWT access token */
  accessToken: string;
  /** New JWT refresh token (rotation: old token revoked, new one issued) */
  refreshToken: string;
}

// ─── Logout ──────────────────────────────────────────────────

/**
 * Logout request payload
 *
 * @description Sent to POST /auth/logout
 */
export interface LogoutRequest {
  /** Optional: token to blacklist (can also use Authorization header) */
  token?: string;
  /** Optional: reason for logout */
  reason?: string;
}

/**
 * Logout response
 *
 * @description Returned from POST /auth/logout
 */
export interface LogoutResponse {
  /** Operation success flag */
  success: boolean;
  /** Confirmation message */
  message: string;
}

// ─── Error Response ──────────────────────────────────────────

/**
 * Backend error response structure
 *
 * @description Standard NestJS error response format
 */
export interface AuthErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Error message (string or array) */
  message: string | string[];
  /** Error type identifier */
  error: string;
}

// ─── NgRx Auth State ─────────────────────────────────────────

/**
 * Authentication state shape for NgRx store
 *
 * @description Central auth state managed by NgRx reducer
 */
export interface AuthState {
  /** Authenticated user data (null if not logged in) */
  user: AuthUser | null;
  /** JWT access token */
  accessToken: string | null;
  /** JWT refresh token */
  refreshToken: string | null;
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Whether an auth operation is in progress */
  isLoading: boolean;
  /** Current error message (null if no error) */
  error: string | null;
  /** Email used during OTP verification flow */
  otpEmail: string | null;
  /** Whether OTP was successfully sent */
  otpSent: boolean;
  /** Whether password reset email was sent */
  resetEmailSent: boolean;
  /** Whether password was successfully reset */
  passwordResetSuccess: boolean;
}

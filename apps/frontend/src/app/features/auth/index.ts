/**
 * @fileoverview Auth Feature Public API
 * @description Barrel export file for the authentication feature module.
 * Provides a clean public API for importing auth services, guards, models, and utilities.
 */

// ─── Services ────────────────────────────────────────────────

export { AuthApiService } from './services/auth-api.service';
export { TokenService } from './services/token.service';
export { GuestSessionService } from './services/guest-session.service';

// ─── Models ──────────────────────────────────────────────────

export {
  AuthUser,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  AuthLoginError,
  AuthErrorResponse,
  AuthState
} from './models/auth.models';

export {
  GuestSession,
  GuestSessionInitResponse,
  GuestSessionValidateResponse,
  GuestSessionErrorResponse
} from './models/guest-session.models';

// ─── Store (NgRx) ────────────────────────────────────────────

export { AuthActions } from './store/auth.actions';
export { authReducer, authFeatureKey, initialAuthState } from './store/auth.reducer';
export * as authSelectors from './store/auth.selectors';

// ─── Interceptors ────────────────────────────────────────────

export { authInterceptor, notifyTokenRefreshed } from './interceptors/auth.interceptor';

// ─── Validators ──────────────────────────────────────────────

export { AuthValidators } from './validators/auth.validators';

/**
 * Unit tests for Auth NgRx Selectors
 *
 * @description Tests all memoized selectors for the auth state slice
 * using the .projector() method to avoid cross-test memoization issues.
 * This approach tests each selector's transformation logic in isolation
 * without relying on the memoization chain.
 */
import {
  selectAuthState,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
  selectAccessToken,
  selectRefreshToken,
  selectOtpEmail,
  selectOtpSent,
  selectResetEmailSent,
  selectPasswordResetSuccess,
  selectUserEmail,
  selectIsVerified,
  selectLoginErrorCode,
  selectRemainingAttempts,
  selectLockedUntilMinutes,
  selectIsAccountLocked,
} from './auth.selectors';
import { AuthState, AuthUser } from '../models/auth.models';
import { initialAuthState } from './auth.reducer';

describe('Auth Selectors', () => {

  const mockUser: AuthUser = {
    id: 1,
    email: 'test@souq.sy',
    fullName: 'Test User',
    phone: null,
    role: 'customer',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    lastLoginAt: null,
    createdAt: new Date(),
  };

  const authenticatedState: AuthState = {
    user: mockUser,
    accessToken: 'jwt-access',
    refreshToken: 'jwt-refresh',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    otpEmail: 'test@souq.sy',
    otpSent: true,
    resetEmailSent: false,
    passwordResetSuccess: false,
    loginErrorCode: null,
    remainingAttempts: null,
    lockedUntilMinutes: null,
    rateLimitRetryAfter: null,
  };

  // ─── Feature Selector ─────────────────────────────────────────

  describe('selectAuthState', () => {
    it('should select the auth feature state', () => {
      const result = selectAuthState.projector(authenticatedState);
      expect(result).toEqual(authenticatedState);
    });
  });

  // ─── Primary State Selectors (use projector with AuthState) ──

  describe('selectUser', () => {
    it('should return the user when authenticated', () => {
      expect(selectUser.projector(authenticatedState)).toEqual(mockUser);
    });

    it('should return null when not authenticated', () => {
      expect(selectUser.projector(initialAuthState)).toBeNull();
    });
  });

  describe('selectIsAuthenticated', () => {
    it('should return true when authenticated', () => {
      expect(selectIsAuthenticated.projector(authenticatedState)).toBeTrue();
    });

    it('should return false when not authenticated', () => {
      expect(selectIsAuthenticated.projector(initialAuthState)).toBeFalse();
    });
  });

  describe('selectIsLoading', () => {
    it('should return true when loading', () => {
      const loadingState = { ...initialAuthState, isLoading: true };
      expect(selectIsLoading.projector(loadingState)).toBeTrue();
    });

    it('should return false when not loading', () => {
      expect(selectIsLoading.projector(initialAuthState)).toBeFalse();
    });
  });

  describe('selectError', () => {
    it('should return null when no error', () => {
      expect(selectError.projector(initialAuthState)).toBeNull();
    });

    it('should return the error message', () => {
      const errorState = { ...initialAuthState, error: 'Login failed' };
      expect(selectError.projector(errorState)).toBe('Login failed');
    });
  });

  describe('selectAccessToken', () => {
    it('should return the access token', () => {
      expect(selectAccessToken.projector(authenticatedState)).toBe('jwt-access');
    });

    it('should return null when no token', () => {
      expect(selectAccessToken.projector(initialAuthState)).toBeNull();
    });
  });

  describe('selectRefreshToken', () => {
    it('should return the refresh token', () => {
      expect(selectRefreshToken.projector(authenticatedState)).toBe('jwt-refresh');
    });
  });

  // ─── OTP Flow Selectors ───────────────────────────────────────

  describe('selectOtpEmail', () => {
    it('should return the OTP email', () => {
      expect(selectOtpEmail.projector(authenticatedState)).toBe('test@souq.sy');
    });

    it('should return null when no OTP email set', () => {
      expect(selectOtpEmail.projector(initialAuthState)).toBeNull();
    });
  });

  describe('selectOtpSent', () => {
    it('should return true when OTP has been sent', () => {
      expect(selectOtpSent.projector(authenticatedState)).toBeTrue();
    });

    it('should return false initially', () => {
      expect(selectOtpSent.projector(initialAuthState)).toBeFalse();
    });
  });

  // ─── Password Reset Selectors ─────────────────────────────────

  describe('selectResetEmailSent', () => {
    it('should return true when reset email sent', () => {
      const state = { ...initialAuthState, resetEmailSent: true };
      expect(selectResetEmailSent.projector(state)).toBeTrue();
    });

    it('should return false initially', () => {
      expect(selectResetEmailSent.projector(initialAuthState)).toBeFalse();
    });
  });

  describe('selectPasswordResetSuccess', () => {
    it('should return true after successful reset', () => {
      const state = { ...initialAuthState, passwordResetSuccess: true };
      expect(selectPasswordResetSuccess.projector(state)).toBeTrue();
    });
  });

  // ─── Derived Selectors (projector receives parent selector output) ──

  describe('selectUserEmail', () => {
    it('should return user email when user exists', () => {
      expect(selectUserEmail.projector(mockUser)).toBe('test@souq.sy');
    });

    it('should return null when user is null', () => {
      expect(selectUserEmail.projector(null)).toBeNull();
    });
  });

  describe('selectIsVerified', () => {
    it('should return true when user is verified', () => {
      expect(selectIsVerified.projector(mockUser)).toBeTrue();
    });

    it('should return false when user is not verified', () => {
      expect(selectIsVerified.projector({ ...mockUser, isVerified: false })).toBeFalse();
    });

    it('should return false when no user', () => {
      expect(selectIsVerified.projector(null)).toBeFalse();
    });
  });

  // ─── S2: Login Error Detail Selectors ──────────────────────────

  describe('selectLoginErrorCode', () => {
    it('should return null initially', () => {
      expect(selectLoginErrorCode.projector(initialAuthState)).toBeNull();
    });

    it('should return the error code when set', () => {
      const state = { ...initialAuthState, loginErrorCode: 'ACCOUNT_LOCKED' };
      expect(selectLoginErrorCode.projector(state)).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('selectRemainingAttempts', () => {
    it('should return null initially', () => {
      expect(selectRemainingAttempts.projector(initialAuthState)).toBeNull();
    });

    it('should return the remaining attempts count', () => {
      const state = { ...initialAuthState, remainingAttempts: 2 };
      expect(selectRemainingAttempts.projector(state)).toBe(2);
    });
  });

  describe('selectLockedUntilMinutes', () => {
    it('should return null initially', () => {
      expect(selectLockedUntilMinutes.projector(initialAuthState)).toBeNull();
    });

    it('should return the lockout minutes', () => {
      const state = { ...initialAuthState, lockedUntilMinutes: 30 };
      expect(selectLockedUntilMinutes.projector(state)).toBe(30);
    });
  });

  describe('selectIsAccountLocked', () => {
    it('should return false when no error code and no minutes', () => {
      expect(selectIsAccountLocked.projector(null, null)).toBeFalse();
    });

    it('should return true when errorCode is ACCOUNT_LOCKED and minutes > 0', () => {
      expect(selectIsAccountLocked.projector('ACCOUNT_LOCKED', 30)).toBeTrue();
    });

    it('should return false when errorCode is ACCOUNT_LOCKED but minutes is null', () => {
      expect(selectIsAccountLocked.projector('ACCOUNT_LOCKED', null)).toBeFalse();
    });

    it('should return false when errorCode is INVALID_CREDENTIALS', () => {
      expect(selectIsAccountLocked.projector('INVALID_CREDENTIALS', null)).toBeFalse();
    });

    it('should return false when lockedUntilMinutes is 0', () => {
      expect(selectIsAccountLocked.projector('ACCOUNT_LOCKED', 0)).toBeFalse();
    });
  });
});

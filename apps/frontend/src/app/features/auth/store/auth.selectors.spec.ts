/**
 * Unit tests for Auth NgRx Selectors
 *
 * @description Tests all memoized selectors for the auth state slice
 * including primary state, OTP flow, password reset, and derived selectors.
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
  };

  // Helper to create root state object with auth slice
  const createState = (authState: AuthState) => ({ auth: authState });

  // ─── Feature Selector ─────────────────────────────────────────

  describe('selectAuthState', () => {
    it('should select the auth feature state', () => {
      const result = selectAuthState(createState(authenticatedState));
      expect(result).toEqual(authenticatedState);
    });
  });

  // ─── Primary State Selectors ──────────────────────────────────

  describe('selectUser', () => {
    it('should return the user when authenticated', () => {
      expect(selectUser(createState(authenticatedState))).toEqual(mockUser);
    });

    it('should return null when not authenticated', () => {
      expect(selectUser(createState(initialAuthState))).toBeNull();
    });
  });

  describe('selectIsAuthenticated', () => {
    it('should return true when authenticated', () => {
      expect(selectIsAuthenticated(createState(authenticatedState))).toBeTrue();
    });

    it('should return false when not authenticated', () => {
      expect(selectIsAuthenticated(createState(initialAuthState))).toBeFalse();
    });
  });

  describe('selectIsLoading', () => {
    it('should return the loading state', () => {
      const loadingState = { ...initialAuthState, isLoading: true };
      expect(selectIsLoading(createState(loadingState))).toBeTrue();
      expect(selectIsLoading(createState(initialAuthState))).toBeFalse();
    });
  });

  describe('selectError', () => {
    it('should return null when no error', () => {
      expect(selectError(createState(initialAuthState))).toBeNull();
    });

    it('should return the error message', () => {
      const errorState = { ...initialAuthState, error: 'Login failed' };
      expect(selectError(createState(errorState))).toBe('Login failed');
    });
  });

  describe('selectAccessToken', () => {
    it('should return the access token', () => {
      expect(selectAccessToken(createState(authenticatedState))).toBe('jwt-access');
    });

    it('should return null when no token', () => {
      expect(selectAccessToken(createState(initialAuthState))).toBeNull();
    });
  });

  describe('selectRefreshToken', () => {
    it('should return the refresh token', () => {
      expect(selectRefreshToken(createState(authenticatedState))).toBe('jwt-refresh');
    });
  });

  // ─── OTP Flow Selectors ───────────────────────────────────────

  describe('selectOtpEmail', () => {
    it('should return the OTP email', () => {
      expect(selectOtpEmail(createState(authenticatedState))).toBe('test@souq.sy');
    });

    it('should return null when no OTP email set', () => {
      expect(selectOtpEmail(createState(initialAuthState))).toBeNull();
    });
  });

  describe('selectOtpSent', () => {
    it('should return true when OTP has been sent', () => {
      expect(selectOtpSent(createState(authenticatedState))).toBeTrue();
    });

    it('should return false initially', () => {
      expect(selectOtpSent(createState(initialAuthState))).toBeFalse();
    });
  });

  // ─── Password Reset Selectors ─────────────────────────────────

  describe('selectResetEmailSent', () => {
    it('should return true when reset email sent', () => {
      const state = { ...initialAuthState, resetEmailSent: true };
      expect(selectResetEmailSent(createState(state))).toBeTrue();
    });

    it('should return false initially', () => {
      expect(selectResetEmailSent(createState(initialAuthState))).toBeFalse();
    });
  });

  describe('selectPasswordResetSuccess', () => {
    it('should return true after successful reset', () => {
      const state = { ...initialAuthState, passwordResetSuccess: true };
      expect(selectPasswordResetSuccess(createState(state))).toBeTrue();
    });
  });

  // ─── Derived Selectors ────────────────────────────────────────

  describe('selectUserEmail', () => {
    it('should return user email when user exists', () => {
      expect(selectUserEmail(createState(authenticatedState))).toBe('test@souq.sy');
    });

    it('should return null when user is null', () => {
      expect(selectUserEmail(createState(initialAuthState))).toBeNull();
    });
  });

  describe('selectIsVerified', () => {
    it('should return true when user is verified', () => {
      expect(selectIsVerified(createState(authenticatedState))).toBeTrue();
    });

    it('should return false when user is not verified', () => {
      const unverifiedState = {
        ...authenticatedState,
        user: { ...mockUser, isVerified: false },
      };
      expect(selectIsVerified(createState(unverifiedState))).toBeFalse();
    });

    it('should return false when no user', () => {
      expect(selectIsVerified(createState(initialAuthState))).toBeFalse();
    });
  });

  // ─── S2: Login Error Detail Selectors ──────────────────────────

  describe('selectLoginErrorCode', () => {
    it('should return null initially', () => {
      expect(selectLoginErrorCode(createState(initialAuthState))).toBeNull();
    });

    it('should return the error code when set', () => {
      const state = { ...initialAuthState, loginErrorCode: 'ACCOUNT_LOCKED' };
      expect(selectLoginErrorCode(createState(state))).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('selectRemainingAttempts', () => {
    it('should return null initially', () => {
      expect(selectRemainingAttempts(createState(initialAuthState))).toBeNull();
    });

    it('should return the remaining attempts count', () => {
      const state = { ...initialAuthState, remainingAttempts: 2 };
      expect(selectRemainingAttempts(createState(state))).toBe(2);
    });
  });

  describe('selectLockedUntilMinutes', () => {
    it('should return null initially', () => {
      expect(selectLockedUntilMinutes(createState(initialAuthState))).toBeNull();
    });

    it('should return the lockout minutes', () => {
      const state = { ...initialAuthState, lockedUntilMinutes: 30 };
      expect(selectLockedUntilMinutes(createState(state))).toBe(30);
    });
  });

  describe('selectIsAccountLocked', () => {
    it('should return false initially', () => {
      expect(selectIsAccountLocked(createState(initialAuthState))).toBeFalse();
    });

    it('should return true when errorCode is ACCOUNT_LOCKED and minutes > 0', () => {
      const state = {
        ...initialAuthState,
        loginErrorCode: 'ACCOUNT_LOCKED',
        lockedUntilMinutes: 30,
      };
      expect(selectIsAccountLocked(createState(state))).toBeTrue();
    });

    it('should return false when errorCode is ACCOUNT_LOCKED but minutes is null', () => {
      const state = {
        ...initialAuthState,
        loginErrorCode: 'ACCOUNT_LOCKED',
        lockedUntilMinutes: null,
      };
      expect(selectIsAccountLocked(createState(state))).toBeFalse();
    });

    it('should return false when errorCode is INVALID_CREDENTIALS', () => {
      const state = {
        ...initialAuthState,
        loginErrorCode: 'INVALID_CREDENTIALS',
        remainingAttempts: 2,
      };
      expect(selectIsAccountLocked(createState(state))).toBeFalse();
    });

    it('should return false when lockedUntilMinutes is 0', () => {
      const state = {
        ...initialAuthState,
        loginErrorCode: 'ACCOUNT_LOCKED',
        lockedUntilMinutes: 0,
      };
      expect(selectIsAccountLocked(createState(state))).toBeFalse();
    });
  });
});

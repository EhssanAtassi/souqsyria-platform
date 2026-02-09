/**
 * Unit tests for Auth NgRx Reducer
 *
 * @description Tests all state transitions in the auth reducer including
 * login, register, OTP, password reset, token refresh, logout, and session restoration.
 */
import { authReducer, initialAuthState } from './auth.reducer';
import { AuthActions } from './auth.actions';
import { AuthState, AuthUser } from '../models/auth.models';

describe('Auth Reducer', () => {

  const mockUser: AuthUser = {
    id: 1,
    email: 'test@souq.sy',
    fullName: 'Test User',
    phone: null,
    role: 'customer',
    isVerified: false,
    isBanned: false,
    isSuspended: false,
    lastLoginAt: null,
    createdAt: new Date(),
  };

  it('should return the initial state on unknown action', () => {
    const action = { type: 'UNKNOWN' } as any;
    const state = authReducer(undefined, action);
    expect(state).toEqual(initialAuthState);
  });

  // ─── Login ────────────────────────────────────────────────────

  describe('Login', () => {
    it('should set loading to true and clear error on login', () => {
      const prevState: AuthState = { ...initialAuthState, error: 'previous error' };
      const state = authReducer(
        prevState,
        AuthActions.login({ email: 'a@b.c', password: 'x', rememberMe: false }),
      );
      expect(state.isLoading).toBeTrue();
      expect(state.error).toBeNull();
    });

    it('should clear loginErrorCode, remainingAttempts, lockedUntilMinutes on login', () => {
      const prevState: AuthState = {
        ...initialAuthState,
        loginErrorCode: 'ACCOUNT_LOCKED',
        remainingAttempts: 1,
        lockedUntilMinutes: 30,
      };
      const state = authReducer(
        prevState,
        AuthActions.login({ email: 'a@b.c', password: 'x', rememberMe: true }),
      );
      expect(state.loginErrorCode).toBeNull();
      expect(state.remainingAttempts).toBeNull();
      expect(state.lockedUntilMinutes).toBeNull();
    });

    it('should set accessToken and isAuthenticated on login success', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginSuccess({ accessToken: 'jwt-123' })
      );
      expect(state.accessToken).toBe('jwt-123');
      expect(state.isAuthenticated).toBeTrue();
      expect(state.isLoading).toBeFalse();
      expect(state.error).toBeNull();
    });

    it('should set error and stop loading on login failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginFailure({ error: 'Invalid credentials' })
      );
      expect(state.error).toBe('Invalid credentials');
      expect(state.isLoading).toBeFalse();
    });

    it('should store errorCode and remainingAttempts on INVALID_CREDENTIALS failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginFailure({
          error: 'Invalid credentials. 2 attempts remaining.',
          errorCode: 'INVALID_CREDENTIALS',
          remainingAttempts: 2,
        })
      );
      expect(state.loginErrorCode).toBe('INVALID_CREDENTIALS');
      expect(state.remainingAttempts).toBe(2);
      expect(state.lockedUntilMinutes).toBeNull();
    });

    it('should store errorCode and lockedUntilMinutes on ACCOUNT_LOCKED failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loginFailure({
          error: 'Account locked.',
          errorCode: 'ACCOUNT_LOCKED',
          lockedUntilMinutes: 30,
        })
      );
      expect(state.loginErrorCode).toBe('ACCOUNT_LOCKED');
      expect(state.lockedUntilMinutes).toBe(30);
      expect(state.remainingAttempts).toBeNull();
    });
  });

  // ─── Register ─────────────────────────────────────────────────

  describe('Register', () => {
    it('should set loading on register', () => {
      const state = authReducer(
        initialAuthState,
        AuthActions.register({ email: 'a@b.c', password: 'x', fullName: 'Test' })
      );
      expect(state.isLoading).toBeTrue();
      expect(state.error).toBeNull();
    });

    it('should store user, tokens, and mark otpSent on register success', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.registerSuccess({
          user: mockUser,
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        })
      );
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBeTrue();
      expect(state.isLoading).toBeFalse();
      expect(state.otpEmail).toBe(mockUser.email);
      expect(state.otpSent).toBeTrue();
    });

    it('should set error on register failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.registerFailure({ error: 'Email already exists' })
      );
      expect(state.error).toBe('Email already exists');
      expect(state.isLoading).toBeFalse();
    });
  });

  // ─── Verify OTP ───────────────────────────────────────────────

  describe('Verify OTP', () => {
    it('should set loading on verify OTP', () => {
      const state = authReducer(
        initialAuthState,
        AuthActions.verifyOtp({ email: 'a@b.c', otpCode: '123456' })
      );
      expect(state.isLoading).toBeTrue();
    });

    it('should mark user as verified on success', () => {
      const stateWithUser: AuthState = {
        ...initialAuthState,
        user: { ...mockUser, isVerified: false },
        isLoading: true,
      };
      const state = authReducer(stateWithUser, AuthActions.verifyOtpSuccess());
      expect(state.user!.isVerified).toBeTrue();
      expect(state.isLoading).toBeFalse();
    });

    it('should handle verifyOtpSuccess when no user in state', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.verifyOtpSuccess()
      );
      expect(state.user).toBeNull();
      expect(state.isLoading).toBeFalse();
    });

    it('should set error on verify OTP failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.verifyOtpFailure({ error: 'Invalid OTP' })
      );
      expect(state.error).toBe('Invalid OTP');
    });
  });

  // ─── Resend OTP ───────────────────────────────────────────────

  describe('Resend OTP', () => {
    it('should set loading on resend OTP', () => {
      const state = authReducer(initialAuthState, AuthActions.resendOtp({ email: 'a@b.c' }));
      expect(state.isLoading).toBeTrue();
    });

    it('should mark otpSent on resend success', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.resendOtpSuccess()
      );
      expect(state.otpSent).toBeTrue();
      expect(state.isLoading).toBeFalse();
    });

    it('should set error on resend failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.resendOtpFailure({ error: 'Rate limited' })
      );
      expect(state.error).toBe('Rate limited');
    });
  });

  // ─── Forgot Password ─────────────────────────────────────────

  describe('Forgot Password', () => {
    it('should set loading and clear resetEmailSent', () => {
      const state = authReducer(
        { ...initialAuthState, resetEmailSent: true },
        AuthActions.forgotPassword({ email: 'a@b.c' })
      );
      expect(state.isLoading).toBeTrue();
      expect(state.resetEmailSent).toBeFalse();
    });

    it('should mark resetEmailSent on success', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.forgotPasswordSuccess()
      );
      expect(state.resetEmailSent).toBeTrue();
      expect(state.isLoading).toBeFalse();
    });

    it('should set error on failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.forgotPasswordFailure({ error: 'Server error' })
      );
      expect(state.error).toBe('Server error');
    });
  });

  // ─── Reset Password ──────────────────────────────────────────

  describe('Reset Password', () => {
    it('should set loading and clear passwordResetSuccess', () => {
      const state = authReducer(
        { ...initialAuthState, passwordResetSuccess: true },
        AuthActions.resetPassword({ resetToken: 'token', newPassword: 'NewP1' })
      );
      expect(state.isLoading).toBeTrue();
      expect(state.passwordResetSuccess).toBeFalse();
    });

    it('should mark passwordResetSuccess on success', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.resetPasswordSuccess()
      );
      expect(state.passwordResetSuccess).toBeTrue();
      expect(state.isLoading).toBeFalse();
    });

    it('should set error on failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.resetPasswordFailure({ error: 'Token expired' })
      );
      expect(state.error).toBe('Token expired');
    });
  });

  // ─── Refresh Token ────────────────────────────────────────────

  describe('Refresh Token', () => {
    it('should not change loading state on refresh', () => {
      const state = authReducer(initialAuthState, AuthActions.refreshToken());
      expect(state.isLoading).toBeFalse();
    });

    it('should update access token on refresh success', () => {
      const state = authReducer(
        { ...initialAuthState, accessToken: 'old-token' },
        AuthActions.refreshTokenSuccess({ accessToken: 'new-token' })
      );
      expect(state.accessToken).toBe('new-token');
    });

    it('should set error on refresh failure', () => {
      const state = authReducer(
        initialAuthState,
        AuthActions.refreshTokenFailure({ error: 'Session expired' })
      );
      expect(state.error).toBe('Session expired');
    });
  });

  // ─── Logout ───────────────────────────────────────────────────

  describe('Logout', () => {
    it('should set loading on logout', () => {
      const state = authReducer(initialAuthState, AuthActions.logout());
      expect(state.isLoading).toBeTrue();
    });

    it('should reset to initial state on logout success', () => {
      const authenticatedState: AuthState = {
        ...initialAuthState,
        user: mockUser,
        accessToken: 'token',
        isAuthenticated: true,
        otpEmail: 'a@b.c',
      };
      const state = authReducer(authenticatedState, AuthActions.logoutSuccess());
      expect(state).toEqual(initialAuthState);
    });

    it('should set error on logout failure', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.logoutFailure({ error: 'Network error' })
      );
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBeFalse();
    });
  });

  // ─── Clear Error ──────────────────────────────────────────────

  describe('Clear Error', () => {
    it('should clear the error message', () => {
      const state = authReducer(
        { ...initialAuthState, error: 'Some error' },
        AuthActions.clearError()
      );
      expect(state.error).toBeNull();
    });

    it('should clear loginErrorCode, remainingAttempts, and lockedUntilMinutes', () => {
      const lockedState: AuthState = {
        ...initialAuthState,
        error: 'Account locked.',
        loginErrorCode: 'ACCOUNT_LOCKED',
        remainingAttempts: 0,
        lockedUntilMinutes: 30,
      };
      const state = authReducer(lockedState, AuthActions.clearError());
      expect(state.loginErrorCode).toBeNull();
      expect(state.remainingAttempts).toBeNull();
      expect(state.lockedUntilMinutes).toBeNull();
    });
  });

  // ─── Load User From Token ─────────────────────────────────────

  describe('Load User From Token', () => {
    it('should set loading on load user from token', () => {
      const state = authReducer(initialAuthState, AuthActions.loadUserFromToken());
      expect(state.isLoading).toBeTrue();
    });

    it('should restore user and token on success', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loadUserFromTokenSuccess({
          user: mockUser,
          accessToken: 'stored-token',
        })
      );
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('stored-token');
      expect(state.isAuthenticated).toBeTrue();
      expect(state.isLoading).toBeFalse();
    });

    it('should stop loading on failure without error', () => {
      const state = authReducer(
        { ...initialAuthState, isLoading: true },
        AuthActions.loadUserFromTokenFailure()
      );
      expect(state.isLoading).toBeFalse();
      expect(state.error).toBeNull();
    });
  });
});

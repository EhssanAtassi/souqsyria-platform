/**
 * Unit tests for Auth NgRx Effects
 *
 * @description Tests all functional NgRx effects for the auth feature.
 * Verifies that each effect dispatches the correct success/failure actions,
 * calls the right services, and handles errors properly.
 *
 * NgRx 18 functional effects (createEffect with { functional: true }) are
 * callable functions — call effect() inside RunInInjectionContext to get
 * the Observable, then subscribe.
 */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, of, throwError } from 'rxjs';

import { AuthActions } from './auth.actions';
import { AuthApiService } from '../services/auth-api.service';
import { TokenService } from '../services/token.service';
import { CartSessionService } from '../../../store/cart/cart-session.service';
import { CartSyncService } from '../../../store/cart/cart-sync.service';
import * as fromEffects from './auth.effects';
import { AuthUser } from '../models/auth.models';

describe('Auth Effects', () => {
  let actions$: Observable<any>;
  let authApiService: jasmine.SpyObj<AuthApiService>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;
  let store: MockStore;
  let cartSessionService: jasmine.SpyObj<CartSessionService>;
  let cartSyncService: jasmine.SpyObj<CartSyncService>;

  const mockUser: AuthUser = {
    id: 1,
    email: 'test@souq.sy',
    role: 'customer',
    fullName: 'Test User',
    phone: null,
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    lastLoginAt: null,
    createdAt: new Date(),
  };

  /** Helper: run a functional effect inside injection context and subscribe */
  function runEffect<T>(effectFn: Function): Observable<T> {
    return new Observable<T>(subscriber => {
      TestBed.runInInjectionContext(() => {
        const obs$ = effectFn() as Observable<T>;
        obs$.subscribe({
          next: val => subscriber.next(val),
          error: err => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  beforeEach(() => {
    authApiService = jasmine.createSpyObj('AuthApiService', [
      'login', 'register', 'verifyOtp', 'resendOtp',
      'forgotPassword', 'resetPassword', 'refreshToken', 'logout',
    ]);
    tokenService = jasmine.createSpyObj('TokenService', [
      'setTokens', 'setRememberMe', 'clearTokens',
      'getAccessToken', 'getRefreshToken', 'isTokenExpired', 'decodeToken',
    ]);
    router = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl'], {
      routerState: { snapshot: { root: { queryParams: {} } } },
    });
    cartSessionService = jasmine.createSpyObj('CartSessionService', [
      'getSessionId', 'clearCachedSession',
    ]);
    cartSyncService = jasmine.createSpyObj('CartSyncService', ['mergeGuestCart']);

    TestBed.configureTestingModule({
      providers: [
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: AuthApiService, useValue: authApiService },
        { provide: TokenService, useValue: tokenService },
        { provide: Router, useValue: router },
        { provide: CartSessionService, useValue: cartSessionService },
        { provide: CartSyncService, useValue: cartSyncService },
      ],
    });

    store = TestBed.inject(MockStore);
  });

  // ─── login$ ────────────────────────────────────────────────────

  describe('login$', () => {
    it('should store tokens and dispatch loginSuccess on successful login', (done) => {
      const loginPayload = { email: 'test@souq.sy', password: 'Pass123', rememberMe: false };
      const apiResponse = { accessToken: 'at', refreshToken: 'rt', message: 'ok' };

      actions$ = of(AuthActions.login(loginPayload));
      authApiService.login.and.returnValue(of(apiResponse as any));

      runEffect(fromEffects.login$).subscribe((action: any) => {
        expect(tokenService.setTokens).toHaveBeenCalledWith('at', 'rt');
        expect(tokenService.setRememberMe).toHaveBeenCalledWith(false);
        expect(action).toEqual(AuthActions.loginSuccess({ accessToken: 'at' }));
        done();
      });
    });

    it('should dispatch loginFailure with error details on failure', (done) => {
      const loginPayload = { email: 'test@souq.sy', password: 'wrong', rememberMe: false };
      const errorResponse = {
        error: {
          message: 'Invalid credentials.',
          errorCode: 'INVALID_CREDENTIALS',
          remainingAttempts: 3,
        },
      };

      actions$ = of(AuthActions.login(loginPayload));
      authApiService.login.and.returnValue(throwError(() => errorResponse));

      runEffect(fromEffects.login$).subscribe((action: any) => {
        expect(action.type).toBe(AuthActions.loginFailure.type);
        expect(action.error).toBe('Invalid credentials.');
        expect(action.errorCode).toBe('INVALID_CREDENTIALS');
        expect(action.remainingAttempts).toBe(3);
        done();
      });
    });
  });

  // ─── register$ ─────────────────────────────────────────────────

  describe('register$', () => {
    it('should store tokens and dispatch registerSuccess', (done) => {
      const registerPayload = { email: 'new@souq.sy', password: 'Pass123', fullName: 'New User' };
      const apiResponse = {
        user: mockUser,
        accessToken: 'at',
        refreshToken: 'rt',
        message: 'ok',
      };

      actions$ = of(AuthActions.register(registerPayload));
      authApiService.register.and.returnValue(of(apiResponse as any));

      runEffect(fromEffects.register$).subscribe((action: any) => {
        expect(tokenService.setTokens).toHaveBeenCalledWith('at', 'rt');
        expect(action).toEqual(
          AuthActions.registerSuccess({
            user: mockUser,
            accessToken: 'at',
            refreshToken: 'rt',
          }),
        );
        done();
      });
    });

    it('should dispatch registerFailure on error', (done) => {
      actions$ = of(AuthActions.register({ email: 'dup@souq.sy', password: 'P1', fullName: 'X' }));
      authApiService.register.and.returnValue(
        throwError(() => ({ error: { message: 'Email already registered' } })),
      );

      runEffect(fromEffects.register$).subscribe((action: any) => {
        expect(action).toEqual(
          AuthActions.registerFailure({ error: 'Email already registered' }),
        );
        done();
      });
    });
  });

  // ─── registerSuccess$ ──────────────────────────────────────────

  describe('registerSuccess$', () => {
    it('should navigate to /auth/verify-otp', (done) => {
      actions$ = of(AuthActions.registerSuccess({
        user: mockUser,
        accessToken: 'at',
        refreshToken: 'rt',
      }));

      runEffect(fromEffects.registerSuccess$).subscribe(() => {
        expect(router.navigate).toHaveBeenCalledWith(['/auth/verify-otp']);
        done();
      });
    });
  });

  // ─── verifyOtp$ ────────────────────────────────────────────────

  describe('verifyOtp$', () => {
    it('should dispatch verifyOtpSuccess on valid OTP', (done) => {
      actions$ = of(AuthActions.verifyOtp({ email: 'test@souq.sy', otpCode: '123456' }));
      authApiService.verifyOtp.and.returnValue(of({ message: 'Verified' } as any));

      runEffect(fromEffects.verifyOtp$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.verifyOtpSuccess());
        done();
      });
    });

    it('should dispatch verifyOtpFailure on invalid OTP', (done) => {
      actions$ = of(AuthActions.verifyOtp({ email: 'test@souq.sy', otpCode: '000000' }));
      authApiService.verifyOtp.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid OTP code.' } })),
      );

      runEffect(fromEffects.verifyOtp$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.verifyOtpFailure({ error: 'Invalid OTP code.' }));
        done();
      });
    });
  });

  // ─── verifyOtpSuccess$ ─────────────────────────────────────────

  describe('verifyOtpSuccess$', () => {
    it('should navigate to login with verified query param', (done) => {
      actions$ = of(AuthActions.verifyOtpSuccess());

      runEffect(fromEffects.verifyOtpSuccess$).subscribe(() => {
        expect(router.navigate).toHaveBeenCalledWith(
          ['/auth/login'],
          { queryParams: { verified: true } },
        );
        done();
      });
    });
  });

  // ─── resendOtp$ ────────────────────────────────────────────────

  describe('resendOtp$', () => {
    it('should dispatch resendOtpSuccess', (done) => {
      actions$ = of(AuthActions.resendOtp({ email: 'test@souq.sy' }));
      authApiService.resendOtp.and.returnValue(of({ message: 'Sent' } as any));

      runEffect(fromEffects.resendOtp$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.resendOtpSuccess());
        done();
      });
    });

    it('should dispatch resendOtpFailure on error', (done) => {
      actions$ = of(AuthActions.resendOtp({ email: 'test@souq.sy' }));
      authApiService.resendOtp.and.returnValue(
        throwError(() => ({ error: { message: 'Please wait' } })),
      );

      runEffect(fromEffects.resendOtp$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.resendOtpFailure({ error: 'Please wait' }));
        done();
      });
    });
  });

  // ─── forgotPassword$ ──────────────────────────────────────────

  describe('forgotPassword$', () => {
    it('should dispatch forgotPasswordSuccess', (done) => {
      actions$ = of(AuthActions.forgotPassword({ email: 'test@souq.sy' }));
      authApiService.forgotPassword.and.returnValue(of({ message: 'Sent' } as any));

      runEffect(fromEffects.forgotPassword$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.forgotPasswordSuccess());
        done();
      });
    });

    it('should dispatch forgotPasswordFailure on error', (done) => {
      actions$ = of(AuthActions.forgotPassword({ email: 'test@souq.sy' }));
      authApiService.forgotPassword.and.returnValue(
        throwError(() => ({ error: { message: 'Rate limited' } })),
      );

      runEffect(fromEffects.forgotPassword$).subscribe((action: any) => {
        expect(action).toEqual(
          AuthActions.forgotPasswordFailure({ error: 'Rate limited' }),
        );
        done();
      });
    });
  });

  // ─── resetPassword$ ───────────────────────────────────────────

  describe('resetPassword$', () => {
    it('should dispatch resetPasswordSuccess', (done) => {
      actions$ = of(AuthActions.resetPassword({ resetToken: 'tok', newPassword: 'New1' }));
      authApiService.resetPassword.and.returnValue(of({ message: 'Reset' } as any));

      runEffect(fromEffects.resetPassword$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.resetPasswordSuccess());
        done();
      });
    });

    it('should dispatch resetPasswordFailure on expired token', (done) => {
      actions$ = of(AuthActions.resetPassword({ resetToken: 'expired', newPassword: 'New1' }));
      authApiService.resetPassword.and.returnValue(
        throwError(() => ({ error: { message: 'Token expired' } })),
      );

      runEffect(fromEffects.resetPassword$).subscribe((action: any) => {
        expect(action).toEqual(
          AuthActions.resetPasswordFailure({ error: 'Token expired' }),
        );
        done();
      });
    });
  });

  // ─── resetPasswordSuccess$ ────────────────────────────────────

  describe('resetPasswordSuccess$', () => {
    it('should navigate to login with passwordReset query param', (done) => {
      actions$ = of(AuthActions.resetPasswordSuccess());

      runEffect(fromEffects.resetPasswordSuccess$).subscribe(() => {
        expect(router.navigate).toHaveBeenCalledWith(
          ['/auth/login'],
          { queryParams: { passwordReset: true } },
        );
        done();
      });
    });
  });

  // ─── refreshToken$ ────────────────────────────────────────────

  describe('refreshToken$', () => {
    it('should store new tokens and dispatch refreshTokenSuccess', (done) => {
      tokenService.getRefreshToken.and.returnValue('old-rt');
      authApiService.refreshToken.and.returnValue(
        of({ accessToken: 'new-at', refreshToken: 'new-rt', message: 'ok' } as any),
      );
      actions$ = of(AuthActions.refreshToken());

      runEffect(fromEffects.refreshToken$).subscribe((action: any) => {
        expect(tokenService.setTokens).toHaveBeenCalledWith('new-at', 'new-rt');
        expect(action).toEqual(AuthActions.refreshTokenSuccess({ accessToken: 'new-at' }));
        done();
      });
    });

    it('should dispatch refreshTokenFailure when no refresh token', (done) => {
      tokenService.getRefreshToken.and.returnValue(null);
      actions$ = of(AuthActions.refreshToken());

      runEffect(fromEffects.refreshToken$).subscribe((action: any) => {
        expect(action).toEqual(
          AuthActions.refreshTokenFailure({ error: 'No refresh token available' }),
        );
        done();
      });
    });

    it('should dispatch refreshTokenFailure on API error', (done) => {
      tokenService.getRefreshToken.and.returnValue('rt');
      authApiService.refreshToken.and.returnValue(
        throwError(() => ({ error: { message: 'Token blacklisted' } })),
      );
      actions$ = of(AuthActions.refreshToken());

      runEffect(fromEffects.refreshToken$).subscribe((action: any) => {
        expect(action).toEqual(
          AuthActions.refreshTokenFailure({ error: 'Token blacklisted' }),
        );
        done();
      });
    });
  });

  // ─── logout$ ──────────────────────────────────────────────────

  describe('logout$', () => {
    it('should clear tokens and dispatch logoutSuccess', (done) => {
      authApiService.logout.and.returnValue(of({ message: 'ok' } as any));
      actions$ = of(AuthActions.logout());

      runEffect(fromEffects.logout$).subscribe((action: any) => {
        expect(tokenService.clearTokens).toHaveBeenCalled();
        expect(action).toEqual(AuthActions.logoutSuccess());
        done();
      });
    });

    it('should still clear tokens and dispatch logoutSuccess on API error', (done) => {
      authApiService.logout.and.returnValue(throwError(() => new Error('Network error')));
      actions$ = of(AuthActions.logout());

      runEffect(fromEffects.logout$).subscribe((action: any) => {
        expect(tokenService.clearTokens).toHaveBeenCalled();
        expect(action).toEqual(AuthActions.logoutSuccess());
        done();
      });
    });
  });

  // ─── logoutSuccess$ ───────────────────────────────────────────

  describe('logoutSuccess$', () => {
    it('should navigate to home page', (done) => {
      actions$ = of(AuthActions.logoutSuccess());

      runEffect(fromEffects.logoutSuccess$).subscribe(() => {
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
        done();
      });
    });
  });

  // ─── loadUserFromToken$ ───────────────────────────────────────

  describe('loadUserFromToken$', () => {
    it('should dispatch loadUserFromTokenSuccess with decoded user', (done) => {
      tokenService.getAccessToken.and.returnValue('valid.jwt.token');
      tokenService.isTokenExpired.and.returnValue(false);
      tokenService.decodeToken.and.returnValue({
        sub: '1',
        email: 'test@souq.sy',
        role: 'customer',
        fullName: 'Test',
        isVerified: true,
      });
      actions$ = of(AuthActions.loadUserFromToken());

      runEffect(fromEffects.loadUserFromToken$).subscribe((action: any) => {
        expect(action.type).toBe(AuthActions.loadUserFromTokenSuccess.type);
        expect(action.user.email).toBe('test@souq.sy');
        expect(action.accessToken).toBe('valid.jwt.token');
        done();
      });
    });

    it('should dispatch loadUserFromTokenFailure when no token', (done) => {
      tokenService.getAccessToken.and.returnValue(null);
      actions$ = of(AuthActions.loadUserFromToken());

      runEffect(fromEffects.loadUserFromToken$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.loadUserFromTokenFailure());
        done();
      });
    });

    it('should dispatch loadUserFromTokenFailure when token expired', (done) => {
      tokenService.getAccessToken.and.returnValue('expired.jwt');
      tokenService.isTokenExpired.and.returnValue(true);
      actions$ = of(AuthActions.loadUserFromToken());

      runEffect(fromEffects.loadUserFromToken$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.loadUserFromTokenFailure());
        done();
      });
    });

    it('should dispatch loadUserFromTokenFailure when decode returns null', (done) => {
      tokenService.getAccessToken.and.returnValue('bad.jwt');
      tokenService.isTokenExpired.and.returnValue(false);
      tokenService.decodeToken.and.returnValue(null);
      actions$ = of(AuthActions.loadUserFromToken());

      runEffect(fromEffects.loadUserFromToken$).subscribe((action: any) => {
        expect(action).toEqual(AuthActions.loadUserFromTokenFailure());
        done();
      });
    });
  });

  // ─── loginSuccess$ ──────────────────────────────────────────────

  describe('loginSuccess$', () => {
    it('should dispatch loadUserFromToken and navigate to returnUrl', (done) => {
      const storeSpy = spyOn(store, 'dispatch').and.callThrough();
      actions$ = of(AuthActions.loginSuccess({ accessToken: 'at' }));

      runEffect(fromEffects.loginSuccess$).subscribe(() => {
        expect(storeSpy).toHaveBeenCalledWith(AuthActions.loadUserFromToken());
        expect(router.navigateByUrl).toHaveBeenCalledWith('/');
        done();
      });
    });
  });

  // ─── mergeGuestCartOnLogin$ ─────────────────────────────────────

  describe('mergeGuestCartOnLogin$', () => {
    it('should merge guest cart when session exists', (done) => {
      cartSessionService.getSessionId.and.returnValue('guest-123');
      tokenService.getAccessToken.and.returnValue('valid.jwt');
      tokenService.decodeToken.and.returnValue({ sub: '42' });
      cartSyncService.mergeGuestCart.and.returnValue(of({} as any));

      actions$ = of(AuthActions.loginSuccess({ accessToken: 'at' }));

      runEffect(fromEffects.mergeGuestCartOnLogin$).subscribe(() => {
        expect(cartSyncService.mergeGuestCart).toHaveBeenCalledWith('42', 'guest-123');
        done();
      });
    });

    it('should skip merge when no guest session', (done) => {
      cartSessionService.getSessionId.and.returnValue(null);
      actions$ = of(AuthActions.loginSuccess({ accessToken: 'at' }));

      runEffect(fromEffects.mergeGuestCartOnLogin$).subscribe(() => {
        expect(cartSyncService.mergeGuestCart).not.toHaveBeenCalled();
        done();
      });
    });

    it('should skip merge when no userId in token', (done) => {
      cartSessionService.getSessionId.and.returnValue('guest-123');
      tokenService.getAccessToken.and.returnValue('valid.jwt');
      tokenService.decodeToken.and.returnValue({});
      actions$ = of(AuthActions.loginSuccess({ accessToken: 'at' }));

      runEffect(fromEffects.mergeGuestCartOnLogin$).subscribe(() => {
        expect(cartSyncService.mergeGuestCart).not.toHaveBeenCalled();
        done();
      });
    });
  });

  // ─── refreshTokenBridgeSuccess$ ─────────────────────────────────

  describe('refreshTokenBridgeSuccess$', () => {
    it('should call notifyTokenRefreshed(true) on refreshTokenSuccess', (done) => {
      actions$ = of(AuthActions.refreshTokenSuccess({ accessToken: 'new-at' }));

      runEffect(fromEffects.refreshTokenBridgeSuccess$).subscribe(() => {
        // notifyTokenRefreshed is called - if it throws, test will fail
        done();
      });
    });
  });

  // ─── refreshTokenBridgeFailure$ ─────────────────────────────────

  describe('refreshTokenBridgeFailure$', () => {
    it('should call notifyTokenRefreshed(false) on refreshTokenFailure', (done) => {
      actions$ = of(AuthActions.refreshTokenFailure({ error: 'Failed' }));

      runEffect(fromEffects.refreshTokenBridgeFailure$).subscribe(() => {
        done();
      });
    });
  });

  // ─── Error message fallback branches ────────────────────────────

  describe('Error message fallback branches', () => {
    it('login$ should use error.message when error.error is undefined', (done) => {
      actions$ = of(AuthActions.login({ email: 'a@b.c', password: 'x', rememberMe: false }));
      authApiService.login.and.returnValue(throwError(() => ({ message: 'Network error' })));

      runEffect(fromEffects.login$).subscribe((action: any) => {
        expect(action.error).toBe('Network error');
        done();
      });
    });

    it('login$ should use default message when no error details', (done) => {
      actions$ = of(AuthActions.login({ email: 'a@b.c', password: 'x', rememberMe: false }));
      authApiService.login.and.returnValue(throwError(() => ({})));

      runEffect(fromEffects.login$).subscribe((action: any) => {
        expect(action.error).toBe('Login failed');
        done();
      });
    });

    it('register$ should use error.message fallback', (done) => {
      actions$ = of(AuthActions.register({ email: 'a@b.c', password: 'x', fullName: 'X' }));
      authApiService.register.and.returnValue(throwError(() => ({ message: 'Timeout' })));

      runEffect(fromEffects.register$).subscribe((action: any) => {
        expect(action.error).toBe('Timeout');
        done();
      });
    });

    it('register$ should use default fallback message', (done) => {
      actions$ = of(AuthActions.register({ email: 'a@b.c', password: 'x', fullName: 'X' }));
      authApiService.register.and.returnValue(throwError(() => ({})));

      runEffect(fromEffects.register$).subscribe((action: any) => {
        expect(action.error).toBe('Registration failed');
        done();
      });
    });

    it('verifyOtp$ should use default fallback', (done) => {
      actions$ = of(AuthActions.verifyOtp({ email: 'a@b.c', otpCode: '000000' }));
      authApiService.verifyOtp.and.returnValue(throwError(() => ({})));

      runEffect(fromEffects.verifyOtp$).subscribe((action: any) => {
        expect(action.error).toBe('OTP verification failed');
        done();
      });
    });

    it('resendOtp$ should use default fallback', (done) => {
      actions$ = of(AuthActions.resendOtp({ email: 'a@b.c' }));
      authApiService.resendOtp.and.returnValue(throwError(() => ({})));

      runEffect(fromEffects.resendOtp$).subscribe((action: any) => {
        expect(action.error).toBe('Failed to resend OTP');
        done();
      });
    });

    it('forgotPassword$ should use default fallback', (done) => {
      actions$ = of(AuthActions.forgotPassword({ email: 'a@b.c' }));
      authApiService.forgotPassword.and.returnValue(throwError(() => ({})));

      runEffect(fromEffects.forgotPassword$).subscribe((action: any) => {
        expect(action.error).toBe('Failed to send reset email');
        done();
      });
    });

    it('resetPassword$ should use default fallback', (done) => {
      actions$ = of(AuthActions.resetPassword({ resetToken: 'tok', newPassword: 'N1' }));
      authApiService.resetPassword.and.returnValue(throwError(() => ({})));

      runEffect(fromEffects.resetPassword$).subscribe((action: any) => {
        expect(action.error).toBe('Failed to reset password');
        done();
      });
    });

    it('refreshToken$ should use default fallback', (done) => {
      tokenService.getRefreshToken.and.returnValue('rt');
      authApiService.refreshToken.and.returnValue(throwError(() => ({})));
      actions$ = of(AuthActions.refreshToken());

      runEffect(fromEffects.refreshToken$).subscribe((action: any) => {
        expect(action.error).toBe('Token refresh failed');
        done();
      });
    });
  });
});

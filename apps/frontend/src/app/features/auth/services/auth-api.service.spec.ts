/**
 * Unit tests for AuthApiService
 *
 * @description Tests all HTTP API calls to the NestJS backend auth endpoints.
 * Uses HttpClientTestingModule to mock HTTP requests and verify payloads.
 * All mock responses use the ApiResponse wrapper format matching the backend ResponseInterceptor.
 */
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../../environments/environment';

/** Helper to wrap data in the backend's ApiResponse format */
function wrapResponse<T>(data: T) {
  return { success: true, data, timestamp: new Date().toISOString(), path: '/auth' };
}

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── register ─────────────────────────────────────────────────

  describe('register', () => {
    it('should POST to /auth/register with email, password, and fullName', () => {
      const request = { email: 'user@souq.sy', password: 'Pass123', fullName: 'Test User' };
      const responseData = {
        user: { id: 1, email: 'user@souq.sy', role: 'customer' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Registration successful',
      };

      service.register(request).subscribe(response => {
        expect(response.accessToken).toBe('access-token');
        expect(response.refreshToken).toBe('refresh-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── login ────────────────────────────────────────────────────

  describe('login', () => {
    it('should POST to /auth/login with credentials', () => {
      const request = { email: 'user@souq.sy', password: 'Pass123' };
      const responseData = {
        message: 'Login successful',
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      service.login(request).subscribe(response => {
        expect(response.accessToken).toBe('jwt-token');
        expect(response.refreshToken).toBe('refresh-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── verifyOtp ────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('should POST to /auth/verify-otp with email and OTP', () => {
      const request = { email: 'user@souq.sy', otpCode: '123456' };
      const responseData = { message: 'Verified' };

      service.verifyOtp(request).subscribe(response => {
        expect(response.message).toBe('Verified');
      });

      const req = httpMock.expectOne(`${apiUrl}/verify-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── resendOtp ────────────────────────────────────────────────

  describe('resendOtp', () => {
    it('should POST to /auth/resend-otp with email', () => {
      const request = { email: 'user@souq.sy' };
      const responseData = { message: 'OTP resent' };

      service.resendOtp(request).subscribe(response => {
        expect(response.message).toBe('OTP resent');
      });

      const req = httpMock.expectOne(`${apiUrl}/resend-otp`);
      expect(req.request.method).toBe('POST');
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should POST to /auth/forgot-password with email', () => {
      const request = { email: 'user@souq.sy' };
      const responseData = { message: 'Email sent' };

      service.forgotPassword(request).subscribe(response => {
        expect(response.message).toBe('Email sent');
      });

      const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
      expect(req.request.method).toBe('POST');
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── resetPassword ────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should POST to /auth/reset-password with token and new password', () => {
      const request = { resetToken: 'reset-token-123', newPassword: 'NewPass1' };
      const responseData = { message: 'Password reset' };

      service.resetPassword(request).subscribe(response => {
        expect(response.message).toBe('Password reset');
      });

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should POST to /auth/refresh-token with current token', () => {
      const request = { token: 'current-refresh-token' };
      const responseData = {
        message: 'Refreshed',
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      service.refreshToken(request).subscribe(response => {
        expect(response.accessToken).toBe('new-access-token');
        expect(response.refreshToken).toBe('new-refresh-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/refresh-token`);
      expect(req.request.method).toBe('POST');
      req.flush(wrapResponse(responseData));
    });
  });

  // ─── logout ───────────────────────────────────────────────────

  describe('logout', () => {
    it('should POST to /auth/logout', () => {
      const request = {};
      const responseData = { message: 'Logged out' };

      service.logout(request).subscribe(response => {
        expect(response.message).toBe('Logged out');
      });

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      req.flush(wrapResponse(responseData));
    });

    it('should include optional token and reason', () => {
      const request = { token: 'my-token', reason: 'user_initiated' };

      service.logout(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.body).toEqual(request);
      req.flush(wrapResponse({ message: 'ok' }));
    });
  });

  // ─── Error handling ────────────────────────────────────────────

  describe('Error handling', () => {
    it('should propagate 400 Bad Request error on register', () => {
      service.register({ email: 'dup@souq.sy', password: 'Pass123', fullName: 'X' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush(
        { message: 'Email already registered', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('should propagate 401 Unauthorized error on login', () => {
      service.login({ email: 'user@souq.sy', password: 'wrong' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(
        { message: 'Invalid credentials.', errorCode: 'INVALID_CREDENTIALS', remainingAttempts: 3 },
        { status: 401, statusText: 'Unauthorized' },
      );
    });

    it('should propagate 403 Forbidden error when account locked', () => {
      service.login({ email: 'locked@souq.sy', password: 'Pass123' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.error.errorCode).toBe('ACCOUNT_LOCKED');
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/login`);
      req.flush(
        { message: 'Account locked', errorCode: 'ACCOUNT_LOCKED', lockedUntilMinutes: 30 },
        { status: 403, statusText: 'Forbidden' },
      );
    });

    it('should propagate 429 Too Many Requests error', () => {
      service.resendOtp({ email: 'spam@souq.sy' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(429);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/resend-otp`);
      req.flush(
        { message: 'Please wait before requesting another OTP', retryAfter: 60 },
        { status: 429, statusText: 'Too Many Requests' },
      );
    });

    it('should propagate 500 Internal Server Error', () => {
      service.forgotPassword({ email: 'user@souq.sy' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
      req.flush(
        { message: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' },
      );
    });

    it('should propagate network error on refresh token', () => {
      service.refreshToken({ token: 'rt' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(0);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/refresh-token`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
    });

    it('should propagate 401 on expired reset token', () => {
      service.resetPassword({ resetToken: 'expired', newPassword: 'New123' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);
      req.flush(
        { message: 'Invalid or expired reset token' },
        { status: 400, statusText: 'Bad Request' },
      );
    });

    it('should propagate 400 on invalid OTP code', () => {
      service.verifyOtp({ email: 'user@souq.sy', otpCode: '000000' }).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/verify-otp`);
      req.flush(
        { message: 'Invalid OTP code.' },
        { status: 400, statusText: 'Bad Request' },
      );
    });
  });
});

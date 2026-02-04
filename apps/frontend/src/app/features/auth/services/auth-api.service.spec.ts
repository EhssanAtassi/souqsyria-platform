/**
 * Unit tests for AuthApiService
 *
 * @description Tests all HTTP API calls to the NestJS backend auth endpoints.
 * Uses HttpClientTestingModule to mock HTTP requests and verify payloads.
 */
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../../../environments/environment';

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
    it('should POST to /auth/register with email and password', () => {
      const request = { email: 'user@souq.sy', password: 'Pass123' };
      const mockResponse = {
        success: true,
        user: { id: 1, email: 'user@souq.sy', role: 'customer' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Registration successful',
      };

      service.register(request).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.accessToken).toBe('access-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // ─── login ────────────────────────────────────────────────────

  describe('login', () => {
    it('should POST to /auth/email-login with credentials', () => {
      const request = { email: 'user@souq.sy', password: 'Pass123' };
      const mockResponse = {
        success: true,
        message: 'Login successful',
        accessToken: 'jwt-token',
      };

      service.login(request).subscribe(response => {
        expect(response.accessToken).toBe('jwt-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/email-login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // ─── verifyOtp ────────────────────────────────────────────────

  describe('verifyOtp', () => {
    it('should POST to /auth/verify with email and OTP', () => {
      const request = { email: 'user@souq.sy', otpCode: '123456' };
      const mockResponse = { success: true, message: 'Verified' };

      service.verifyOtp(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/verify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // ─── resendOtp ────────────────────────────────────────────────

  describe('resendOtp', () => {
    it('should POST to /auth/resend-otp with email', () => {
      const request = { email: 'user@souq.sy' };
      const mockResponse = { success: true, message: 'OTP resent' };

      service.resendOtp(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/resend-otp`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should POST to /auth/forgot-password with email', () => {
      const request = { email: 'user@souq.sy' };
      const mockResponse = { success: true, message: 'Email sent' };

      service.forgotPassword(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/forgot-password`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // ─── resetPassword ────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should POST to /auth/reset-password with token and new password', () => {
      const request = { resetToken: 'reset-token-123', newPassword: 'NewPass1' };
      const mockResponse = { success: true, message: 'Password reset' };

      service.resetPassword(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should POST to /auth/refresh with current token', () => {
      const request = { token: 'current-access-token' };
      const mockResponse = {
        success: true,
        message: 'Refreshed',
        accessToken: 'new-access-token',
      };

      service.refreshToken(request).subscribe(response => {
        expect(response.accessToken).toBe('new-access-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  // ─── logout ───────────────────────────────────────────────────

  describe('logout', () => {
    it('should POST to /auth/logout', () => {
      const request = {};
      const mockResponse = { success: true, message: 'Logged out' };

      service.logout(request).subscribe(response => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should include optional token and reason', () => {
      const request = { token: 'my-token', reason: 'user_initiated' };

      service.logout(request).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/logout`);
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, message: 'ok' });
    });
  });
});

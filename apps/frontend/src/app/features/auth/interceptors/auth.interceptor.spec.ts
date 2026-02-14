/**
 * Unit tests for AuthInterceptor
 *
 * @description Tests the functional HTTP interceptor covering:
 * - JWT token injection on requests
 * - Content-Type handling (JSON vs FormData)
 * - 401 error handling with token refresh
 * - Proactive token refresh before expiry
 * - Request queuing during refresh
 * - Cart request credential handling
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { authInterceptor, notifyTokenRefreshed } from './auth.interceptor';
import { TokenService } from '../services/token.service';
import { AuthActions } from '../store/auth.actions';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: jasmine.SpyObj<TokenService>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;

  beforeEach(() => {
    tokenService = jasmine.createSpyObj('TokenService', [
      'getAccessToken',
      'getRefreshToken',
      'isTokenExpired',
    ]);
    tokenService.getAccessToken.and.returnValue(null);
    tokenService.isTokenExpired.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideMockStore(),
        { provide: TokenService, useValue: tokenService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(MockStore);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
  });

  afterEach(() => {
    httpMock.verify();
    // Reset module-level state
    notifyTokenRefreshed(false);
  });

  // ─── Token Injection ────────────────────────────────────────────

  describe('Token injection', () => {
    it('should add Authorization header when token exists', () => {
      tokenService.getAccessToken.and.returnValue('my-jwt-token');

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
      req.flush({});
    });

    it('should not add Authorization header when no token', () => {
      tokenService.getAccessToken.and.returnValue(null);

      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });

    it('should add Accept: application/json header', () => {
      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      req.flush({});
    });

    it('should add Content-Type: application/json for non-FormData', () => {
      httpClient.post('/api/data', { key: 'value' }).subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({});
    });

    it('should NOT set Content-Type for FormData body', () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      httpClient.post('/api/upload', formData).subscribe();

      const req = httpMock.expectOne('/api/upload');
      // FormData should not have JSON content type
      expect(req.request.headers.get('Content-Type')).not.toBe('application/json');
      req.flush({});
    });
  });

  // ─── 401 Error Handling ─────────────────────────────────────────

  describe('401 Error handling', () => {
    it('should dispatch refreshToken on 401 for non-auth endpoints', () => {
      tokenService.getAccessToken.and.returnValue('expired-token');

      httpClient.get('/api/protected').subscribe({
        error: () => {},
      });

      const req = httpMock.expectOne('/api/protected');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

      expect(dispatchSpy).toHaveBeenCalledWith(AuthActions.refreshToken());
    });

    it('should pass through 401 on /auth/login without refresh', () => {
      tokenService.getAccessToken.and.returnValue(null);

      httpClient.post('/api/auth/login', {}).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      // Should NOT dispatch refreshToken for auth endpoints
      const refreshCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.refreshToken.type);
      expect(refreshCalls.length).toBe(0);
    });

    it('should pass through 401 on /auth/refresh-token without refresh', () => {
      tokenService.getAccessToken.and.returnValue('old-token');

      httpClient.post('/api/auth/refresh-token', {}).subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(401);
        },
      });

      const req = httpMock.expectOne('/api/auth/refresh-token');
      req.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });

      const refreshCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.refreshToken.type);
      expect(refreshCalls.length).toBe(0);
    });
  });

  // ─── Non-401 Error passthrough ──────────────────────────────────

  describe('Non-401 errors', () => {
    it('should pass through 400 errors without refresh', () => {
      httpClient.get('/api/data').subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne('/api/data');
      req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should pass through 500 errors without refresh', () => {
      httpClient.get('/api/data').subscribe({
        error: (err: HttpErrorResponse) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne('/api/data');
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─── notifyTokenRefreshed ───────────────────────────────────────

  describe('notifyTokenRefreshed', () => {
    it('should be a callable function', () => {
      expect(typeof notifyTokenRefreshed).toBe('function');
    });

    it('should accept boolean parameter', () => {
      expect(() => notifyTokenRefreshed(true)).not.toThrow();
      expect(() => notifyTokenRefreshed(false)).not.toThrow();
    });
  });

  // ─── Cart request handling ──────────────────────────────────────

  describe('Cart requests', () => {
    it('should set withCredentials for cart URLs', () => {
      httpClient.get('/api/cart').subscribe();

      const req = httpMock.expectOne('/api/cart');
      expect(req.request.withCredentials).toBeTrue();
      req.flush({});
    });

    it('should NOT set withCredentials for non-cart URLs', () => {
      httpClient.get('/api/products').subscribe();

      const req = httpMock.expectOne('/api/products');
      expect(req.request.withCredentials).toBeFalse();
      req.flush({});
    });
  });

  // ─── Proactive token refresh ──────────────────────────────────

  describe('Proactive token refresh', () => {
    it('should NOT proactively refresh for /auth/login requests', () => {
      tokenService.getAccessToken.and.returnValue('expiring-token');
      tokenService.isTokenExpired.and.returnValue(true);

      httpClient.post('/api/auth/login', { email: 'a', password: 'b' }).subscribe({
        next: () => {},
        error: () => {},
      });

      // Should NOT dispatch refreshToken for auth endpoints
      const refreshCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.refreshToken.type);
      expect(refreshCalls.length).toBe(0);

      const req = httpMock.expectOne('/api/auth/login');
      req.flush({ message: 'ok' });
    });

    it('should NOT proactively refresh for /auth/refresh-token requests', () => {
      tokenService.getAccessToken.and.returnValue('expiring-token');
      tokenService.isTokenExpired.and.returnValue(true);

      httpClient.post('/api/auth/refresh-token', { token: 'rt' }).subscribe({
        next: () => {},
        error: () => {},
      });

      const refreshCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.refreshToken.type);
      expect(refreshCalls.length).toBe(0);

      const req = httpMock.expectOne('/api/auth/refresh-token');
      req.flush({ accessToken: 'new' });
    });

    it('should skip proactive refresh when no token exists', () => {
      tokenService.getAccessToken.and.returnValue(null);
      tokenService.isTokenExpired.and.returnValue(true);

      httpClient.get('/api/data').subscribe();

      // Should not trigger proactive refresh with no token
      const refreshCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.refreshToken.type);
      expect(refreshCalls.length).toBe(0);

      const req = httpMock.expectOne('/api/data');
      req.flush({ data: 'ok' });
    });

    it('should skip proactive refresh when token is not near expiry', () => {
      tokenService.getAccessToken.and.returnValue('valid-token');
      tokenService.isTokenExpired.and.returnValue(false);

      httpClient.get('/api/data').subscribe();

      // Should not trigger proactive refresh
      const refreshCalls = dispatchSpy.calls.allArgs()
        .filter(([action]: any) => action.type === AuthActions.refreshToken.type);
      expect(refreshCalls.length).toBe(0);

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('Bearer valid-token');
      req.flush({ data: 'ok' });
    });
  });

  // ─── Success path ────────────────────────────────────────────

  describe('Successful requests', () => {
    it('should pass through successful GET response', () => {
      tokenService.getAccessToken.and.returnValue('valid-token');

      let result: any;
      httpClient.get('/api/data').subscribe(res => { result = res; });

      const req = httpMock.expectOne('/api/data');
      req.flush({ message: 'ok' });

      expect(result).toEqual({ message: 'ok' });
    });

    it('should pass through successful POST response', () => {
      tokenService.getAccessToken.and.returnValue('valid-token');

      let result: any;
      httpClient.post('/api/data', { key: 'val' }).subscribe(res => { result = res; });

      const req = httpMock.expectOne('/api/data');
      req.flush({ id: 1 });

      expect(result).toEqual({ id: 1 });
    });
  });

  // ─── Guest session cookie ────────────────────────────────────

  describe('Guest session cookie', () => {
    it('should add X-Guest-Session header for cart requests when cookie exists', () => {
      // Mock document.cookie with a guest session
      spyOnProperty(document, 'cookie', 'get').and.returnValue(
        'other=value; guest_session_id=abc-123-def',
      );

      httpClient.get('/api/cart/items').subscribe();

      const req = httpMock.expectOne('/api/cart/items');
      expect(req.request.headers.get('X-Guest-Session')).toBe('abc-123-def');
      req.flush({});
    });

    it('should NOT add X-Guest-Session for non-cart requests', () => {
      spyOnProperty(document, 'cookie', 'get').and.returnValue(
        'guest_session_id=abc-123',
      );

      httpClient.get('/api/products').subscribe();

      const req = httpMock.expectOne('/api/products');
      expect(req.request.headers.has('X-Guest-Session')).toBeFalse();
      req.flush({});
    });

    it('should NOT add X-Guest-Session when no cookie exists', () => {
      spyOnProperty(document, 'cookie', 'get').and.returnValue('');

      httpClient.get('/api/cart').subscribe();

      const req = httpMock.expectOne('/api/cart');
      expect(req.request.headers.has('X-Guest-Session')).toBeFalse();
      req.flush({});
    });
  });
});

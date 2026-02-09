/**
 * Unit tests for TokenService
 *
 * @description Tests JWT token storage, retrieval, clearing, decoding,
 * and expiry checking functionality used throughout the auth system.
 */
import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let localStorageSpy: { [key: string]: jasmine.Spy };

  /** Sample JWT with payload: { sub: 42, email: "test@souq.sy", exp: future } */
  const createMockJwt = (payload: Record<string, unknown>): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    return `${header}.${body}.${signature}`;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);

    // Mock localStorage
    const store: Record<string, string> = {};
    localStorageSpy = {
      getItem: spyOn(localStorage, 'getItem').and.callFake(
        (key: string) => store[key] ?? null
      ),
      setItem: spyOn(localStorage, 'setItem').and.callFake(
        (key: string, value: string) => { store[key] = value; }
      ),
      removeItem: spyOn(localStorage, 'removeItem').and.callFake(
        (key: string) => { delete store[key]; }
      ),
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── getAccessToken / getRefreshToken ─────────────────────────

  describe('getAccessToken', () => {
    it('should return null when no token is stored', () => {
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return the stored access token', () => {
      service.setTokens('access-123');
      expect(service.getAccessToken()).toBe('access-123');
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no refresh token is stored', () => {
      expect(service.getRefreshToken()).toBeNull();
    });

    it('should return the stored refresh token', () => {
      service.setTokens('access-123', 'refresh-456');
      expect(service.getRefreshToken()).toBe('refresh-456');
    });
  });

  // ─── setTokens ────────────────────────────────────────────────

  describe('setTokens', () => {
    it('should store access token in localStorage', () => {
      service.setTokens('my-access-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'my-access-token');
    });

    it('should store both tokens when refresh token provided', () => {
      service.setTokens('access', 'refresh');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'access');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh');
    });

    it('should not store refresh token when not provided', () => {
      service.setTokens('access');
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    });
  });

  // ─── clearTokens ──────────────────────────────────────────────

  describe('clearTokens', () => {
    it('should remove both tokens and rememberMe from localStorage', () => {
      service.setTokens('access', 'refresh');
      service.setRememberMe(true);
      service.clearTokens();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_remember_me');
    });
  });

  // ─── rememberMe ─────────────────────────────────────────────

  describe('setRememberMe / getRememberMe', () => {
    it('should store rememberMe preference as true', () => {
      service.setRememberMe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_remember_me', 'true');
    });

    it('should store rememberMe preference as false', () => {
      service.setRememberMe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_remember_me', 'false');
    });

    it('should return true when rememberMe was set to true', () => {
      service.setRememberMe(true);
      expect(service.getRememberMe()).toBeTrue();
    });

    it('should return false when rememberMe was set to false', () => {
      service.setRememberMe(false);
      expect(service.getRememberMe()).toBeFalse();
    });

    it('should return false when no rememberMe preference is stored', () => {
      expect(service.getRememberMe()).toBeFalse();
    });
  });

  // ─── hasToken ─────────────────────────────────────────────────

  describe('hasToken', () => {
    it('should return false when no token exists', () => {
      expect(service.hasToken()).toBeFalse();
    });

    it('should return true when access token exists', () => {
      service.setTokens('some-token');
      expect(service.hasToken()).toBeTrue();
    });
  });

  // ─── decodeToken ──────────────────────────────────────────────

  describe('decodeToken', () => {
    it('should decode a valid JWT payload', () => {
      const payload = { sub: 42, email: 'test@souq.sy', role: 'customer' };
      const jwt = createMockJwt(payload);
      const decoded = service.decodeToken(jwt);
      expect(decoded).toEqual(payload);
    });

    it('should return null for an invalid token', () => {
      expect(service.decodeToken('not-a-jwt')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(service.decodeToken('')).toBeNull();
    });
  });

  // ─── isTokenExpired ───────────────────────────────────────────

  describe('isTokenExpired', () => {
    it('should return true when no token is stored', () => {
      expect(service.isTokenExpired()).toBeTrue();
    });

    it('should return true for an expired token', () => {
      const expiredPayload = { sub: 1, exp: Math.floor(Date.now() / 1000) - 3600 };
      const jwt = createMockJwt(expiredPayload);
      service.setTokens(jwt);
      expect(service.isTokenExpired()).toBeTrue();
    });

    it('should return false for a valid non-expired token', () => {
      const futurePayload = { sub: 1, exp: Math.floor(Date.now() / 1000) + 3600 };
      const jwt = createMockJwt(futurePayload);
      service.setTokens(jwt);
      expect(service.isTokenExpired()).toBeFalse();
    });

    it('should return true when token is within buffer window', () => {
      // Token expires in 60 seconds, buffer is 120 seconds
      const nearExpiryPayload = { sub: 1, exp: Math.floor(Date.now() / 1000) + 60 };
      const jwt = createMockJwt(nearExpiryPayload);
      service.setTokens(jwt);
      expect(service.isTokenExpired(120)).toBeTrue();
    });

    it('should return true when token has no exp claim', () => {
      const noExpPayload = { sub: 1, email: 'test@souq.sy' };
      const jwt = createMockJwt(noExpPayload);
      service.setTokens(jwt);
      expect(service.isTokenExpired()).toBeTrue();
    });
  });

  // ─── getTokenExpirySeconds ────────────────────────────────────

  describe('getTokenExpirySeconds', () => {
    it('should return 0 when no token exists', () => {
      expect(service.getTokenExpirySeconds()).toBe(0);
    });

    it('should return remaining seconds for a valid token', () => {
      const expInFuture = Math.floor(Date.now() / 1000) + 300; // 5 min
      const jwt = createMockJwt({ sub: 1, exp: expInFuture });
      service.setTokens(jwt);
      const remaining = service.getTokenExpirySeconds();
      expect(remaining).toBeGreaterThan(295);
      expect(remaining).toBeLessThanOrEqual(300);
    });

    it('should return 0 for an expired token', () => {
      const expInPast = Math.floor(Date.now() / 1000) - 100;
      const jwt = createMockJwt({ sub: 1, exp: expInPast });
      service.setTokens(jwt);
      expect(service.getTokenExpirySeconds()).toBe(0);
    });
  });

  // ─── getUserIdFromToken ───────────────────────────────────────

  describe('getUserIdFromToken', () => {
    it('should return null when no token exists', () => {
      expect(service.getUserIdFromToken()).toBeNull();
    });

    it('should return the user id from token sub claim', () => {
      const jwt = createMockJwt({ sub: 42, email: 'test@souq.sy' });
      service.setTokens(jwt);
      expect(service.getUserIdFromToken()).toBe(42);
    });

    it('should return null when sub claim is missing', () => {
      const jwt = createMockJwt({ email: 'test@souq.sy' });
      service.setTokens(jwt);
      expect(service.getUserIdFromToken()).toBeNull();
    });
  });
});

/**
 * @file cart-session.service.spec.ts
 * @description Unit tests for the CartSessionService
 *
 * TEST COVERAGE:
 * - Service creation
 * - getSessionId() with cookie present/absent
 * - TTL-based cache invalidation
 * - refreshSessionId() forces re-read
 * - isGuestSession() with various auth states
 * - isAuthenticated() checks
 * - clearCachedSession() clears cache
 * - setSessionIdForTesting() manual override
 * - getAllCookies() debug helper
 *
 * @author SouqSyria Development Team
 * @since 2026-02-09
 */

import { TestBed } from '@angular/core/testing';
import { CartSessionService } from './cart-session.service';

// =============================================================================
// HELPERS
// =============================================================================

/** Set a document cookie for testing (value is stored as-is, no encoding) */
function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value}; path=/`;
}

/** Delete a document cookie */
function deleteCookie(name: string): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

/** Clear all relevant storage and cookies */
function cleanupState(): void {
  deleteCookie('guest_session_id');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('access_token');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('access_token');
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('CartSessionService', () => {
  let service: CartSessionService;

  beforeEach(() => {
    cleanupState();

    TestBed.configureTestingModule({
      providers: [CartSessionService],
    });

    service = TestBed.inject(CartSessionService);
  });

  afterEach(() => {
    cleanupState();
  });

  // ===========================================================================
  // SERVICE CREATION
  // ===========================================================================

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ===========================================================================
  // GET SESSION ID
  // ===========================================================================

  describe('getSessionId', () => {
    it('should return null when no guest session cookie exists', () => {
      const sessionId = service.getSessionId();
      expect(sessionId).toBeNull();
    });

    it('should return session ID when cookie is present', () => {
      setCookie('guest_session_id', 'abc-123-def');
      const sessionId = service.getSessionId();
      expect(sessionId).toBe('abc-123-def');
    });

    it('should decode URI-encoded cookie values', () => {
      setCookie('guest_session_id', 'session%20with%20spaces');
      const sessionId = service.getSessionId();
      expect(sessionId).toBe('session with spaces');
    });

    it('should return cached value within TTL', () => {
      setCookie('guest_session_id', 'first-session');
      service.getSessionId(); // cache it

      // Change cookie
      deleteCookie('guest_session_id');
      setCookie('guest_session_id', 'second-session');

      // Should return cached value (within 5s TTL)
      const sessionId = service.getSessionId();
      expect(sessionId).toBe('first-session');
    });

    it('should not cache null values', () => {
      // First call returns null (no cookie)
      service.getSessionId();

      // Now set cookie
      setCookie('guest_session_id', 'new-session');

      // Should re-read since null was not cached
      const sessionId = service.getSessionId();
      expect(sessionId).toBe('new-session');
    });
  });

  // ===========================================================================
  // REFRESH SESSION ID
  // ===========================================================================

  describe('refreshSessionId', () => {
    it('should force re-read bypassing cache', () => {
      setCookie('guest_session_id', 'old-session');
      service.getSessionId(); // cache it

      // Update cookie
      deleteCookie('guest_session_id');
      setCookie('guest_session_id', 'new-session');

      // refreshSessionId should bypass cache
      const sessionId = service.refreshSessionId();
      expect(sessionId).toBe('new-session');
    });

    it('should return null when cookie is gone after refresh', () => {
      setCookie('guest_session_id', 'existing-session');
      service.getSessionId(); // cache it

      // Remove cookie
      deleteCookie('guest_session_id');

      const sessionId = service.refreshSessionId();
      expect(sessionId).toBeNull();
    });
  });

  // ===========================================================================
  // IS GUEST SESSION
  // ===========================================================================

  describe('isGuestSession', () => {
    it('should return true when session cookie exists and no auth token', () => {
      setCookie('guest_session_id', 'guest-123');
      expect(service.isGuestSession()).toBeTrue();
    });

    it('should return false when no session cookie exists', () => {
      expect(service.isGuestSession()).toBeFalse();
    });

    it('should return false when both session and auth token exist', () => {
      setCookie('guest_session_id', 'guest-123');
      localStorage.setItem('auth_token', 'jwt-token');
      expect(service.isGuestSession()).toBeFalse();
    });

    it('should return false when only auth token exists', () => {
      localStorage.setItem('auth_token', 'jwt-token');
      expect(service.isGuestSession()).toBeFalse();
    });
  });

  // ===========================================================================
  // IS AUTHENTICATED
  // ===========================================================================

  describe('isAuthenticated', () => {
    it('should return false when no auth tokens exist', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return true when auth_token exists in localStorage', () => {
      localStorage.setItem('auth_token', 'jwt-token');
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return true when access_token exists in localStorage', () => {
      localStorage.setItem('access_token', 'jwt-token');
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return true when auth_token exists in sessionStorage', () => {
      sessionStorage.setItem('auth_token', 'jwt-token');
      expect(service.isAuthenticated()).toBeTrue();
    });
  });

  // ===========================================================================
  // CLEAR CACHED SESSION
  // ===========================================================================

  describe('clearCachedSession', () => {
    it('should clear cached session so next read comes from cookie', () => {
      setCookie('guest_session_id', 'session-1');
      service.getSessionId(); // cache it

      // Change cookie
      deleteCookie('guest_session_id');
      setCookie('guest_session_id', 'session-2');

      // Clear cache
      service.clearCachedSession();

      // Now should read from cookie
      const sessionId = service.getSessionId();
      expect(sessionId).toBe('session-2');
    });
  });

  // ===========================================================================
  // SET SESSION ID FOR TESTING
  // ===========================================================================

  describe('setSessionIdForTesting', () => {
    it('should set session ID manually', () => {
      service.setSessionIdForTesting('test-session-id');
      const sessionId = service.getSessionId();
      expect(sessionId).toBe('test-session-id');
    });
  });

  // ===========================================================================
  // GET ALL COOKIES
  // ===========================================================================

  describe('getAllCookies', () => {
    it('should return all document cookies', () => {
      setCookie('guest_session_id', 'session-123');
      setCookie('other_cookie', 'other-value');

      const cookies = service.getAllCookies();
      const sessionCookie = cookies.find(c => c.name === 'guest_session_id');
      expect(sessionCookie).toBeTruthy();
      expect(sessionCookie?.value).toBe('session-123');
    });
  });
});

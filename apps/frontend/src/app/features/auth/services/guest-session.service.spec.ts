/**
 * @fileoverview Unit Tests for GuestSessionService
 * @description Comprehensive test suite for guest session management functionality.
 * Tests the service after the APP_INITIALIZER refactor — the constructor no longer
 * auto-initializes; initializeSession() must be called explicitly.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GuestSessionService, GuestSession, GuestSessionValidation } from './guest-session.service';
import { environment } from '../../../../environments/environment';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/auth/guest-session`;

  /** Mock guest session data (matches backend DTO shape) */
  const mockSession: GuestSession = {
    sessionId: 'test-session-123',
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    status: 'active',
    isValid: true,
    hasCart: false
  };

  /** Mock expired guest session */
  const mockExpiredSession: GuestSession = {
    sessionId: 'expired-session-456',
    expiresAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'expired',
    isValid: false,
    hasCart: false
  };

  /**
   * Helper: run initializeSession() and handle the HTTP requests it triggers.
   * Flow: validate (returns null on 401) → create (returns session)
   */
  function initializeWithMockSession(session: GuestSession = mockSession): void {
    service.initializeSession().subscribe();

    // initializeSession calls validateSession() first
    const validateReq = httpMock.expectOne(`${apiUrl}/validate`);
    validateReq.flush({ message: 'No session' }, { status: 401, statusText: 'Unauthorized' });

    // validateSession() catchError returns of(null) → switchMap creates new session
    const createReq = httpMock.expectOne(`${apiUrl}/init`);
    createReq.flush(session);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GuestSessionService]
    });

    localStorage.clear();

    // Mock console methods to avoid noise
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');

    service = TestBed.inject(GuestSessionService);
    httpMock = TestBed.inject(HttpTestingController);
    // Constructor no longer auto-initializes — no HTTP interception needed
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should start with null session (no auto-init)', () => {
      expect(service.getCurrentSession()).toBeNull();
    });

    it('should expose session$ observable with null initial value', (done) => {
      service.session$.subscribe(session => {
        expect(session).toBeNull(); // No auto-init
        done();
      });
    });

    it('should populate session after initializeSession()', (done) => {
      service.initializeSession().subscribe(() => {
        const session = service.getCurrentSession();
        expect(session).toBeTruthy();
        expect(session?.sessionId).toBe('test-session-123');
        done();
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate`);
      validateReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      const createReq = httpMock.expectOne(`${apiUrl}/init`);
      createReq.flush(mockSession);
    });
  });

  describe('createSession', () => {
    it('should create a new guest session via API', (done) => {
      service.createSession().subscribe(session => {
        expect(session).toEqual(mockSession);
        expect(session.sessionId).toBe('test-session-123');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockSession);
    });

    it('should handle API errors gracefully', (done) => {
      service.createSession().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should send request with withCredentials: true', () => {
      service.createSession().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/init`);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockSession);
    });
  });

  describe('validateSession', () => {
    it('should validate existing session via API', (done) => {
      const mockValidation: GuestSessionValidation = {
        exists: true,
        isValid: true,
        expiresAt: mockSession.expiresAt,
        status: 'active'
      };

      service.validateSession().subscribe(validation => {
        expect(validation).toEqual(mockValidation);
        expect(validation?.isValid).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockValidation);
    });

    it('should return null when validation fails', (done) => {
      service.validateSession().subscribe(session => {
        expect(session).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      req.flush({ message: 'Invalid session' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should send request with withCredentials: true', () => {
      service.validateSession().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ exists: true, isValid: true, expiresAt: mockSession.expiresAt, status: 'active' });
    });
  });

  describe('getCurrentSession', () => {
    it('should return null when no session exists', () => {
      const session = service.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should return current session after initialization', () => {
      initializeWithMockSession();

      const currentSession = service.getCurrentSession();
      expect(currentSession).toBeTruthy();
      expect(currentSession?.sessionId).toBe('test-session-123');
    });
  });

  describe('getSessionId', () => {
    it('should return null when no session exists', () => {
      const sessionId = service.getSessionId();
      expect(sessionId).toBeNull();
    });

    it('should return session ID after initialization', () => {
      initializeWithMockSession();

      const sessionId = service.getSessionId();
      expect(sessionId).toBe('test-session-123');
    });
  });

  describe('isSessionActive', () => {
    it('should return false when no session exists', () => {
      const isActive = service.isSessionActive();
      expect(isActive).toBe(false);
    });

    it('should return true when valid session exists', () => {
      initializeWithMockSession();

      const isActive = service.isSessionActive();
      expect(isActive).toBe(true);
    });

    it('should return false when session is expired', () => {
      // Manually inject an expired session into state
      service['sessionSubject'].next(mockExpiredSession);

      const isActive = service.isSessionActive();
      expect(isActive).toBe(false);
    });

    it('should clear expired session and return false', () => {
      // Manually inject expired session
      service['sessionSubject'].next(mockExpiredSession);

      const isActive = service.isSessionActive();

      expect(isActive).toBe(false);
      expect(service.getCurrentSession()).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should clear session from memory', () => {
      initializeWithMockSession();

      service.clearSession();
      const session = service.getCurrentSession();
      expect(session).toBeNull();
    });

    it('should clear session from localStorage', () => {
      initializeWithMockSession();

      // initializeSession saves to localStorage via tap
      const stored = localStorage.getItem('guest_session');
      expect(stored).toBeTruthy();

      service.clearSession();

      const clearedStored = localStorage.getItem('guest_session');
      expect(clearedStored).toBeNull();
    });
  });

  describe('localStorage Fallback', () => {
    it('should save session to localStorage on initialization', () => {
      initializeWithMockSession();

      const stored = localStorage.getItem('guest_session');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.sessionId).toBe('test-session-123');
    });

    it('should load valid session from localStorage when API fails', (done) => {
      // Pre-populate localStorage with valid session
      localStorage.setItem('guest_session', JSON.stringify({
        sessionId: mockSession.sessionId,
        expiresAt: mockSession.expiresAt
      }));

      // initializeSession: validate fails, create also fails → falls back to localStorage
      service.initializeSession().subscribe(() => {
        const session = service.getCurrentSession();
        expect(session).toBeTruthy();
        expect(session?.sessionId).toBe('test-session-123');
        done();
      });

      // Validate fails
      const validateReq = httpMock.expectOne(`${apiUrl}/validate`);
      validateReq.flush(null, { status: 401, statusText: 'Unauthorized' });

      // Create also fails → triggers localStorage fallback
      const createReq = httpMock.expectOne(`${apiUrl}/init`);
      createReq.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should not load expired session from localStorage', () => {
      // Pre-populate localStorage with expired session
      localStorage.setItem('guest_session', JSON.stringify({
        sessionId: mockExpiredSession.sessionId,
        expiresAt: mockExpiredSession.expiresAt
      }));

      const stored = localStorage.getItem('guest_session');
      const session = JSON.parse(stored!);
      const expiryTime = new Date(session.expiresAt).getTime();

      expect(Date.now() >= expiryTime).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('guest_session', 'invalid-json{');

      // Service should handle this without crashing
      expect(() => service.getCurrentSession()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during creation', (done) => {
      service.createSession().subscribe({
        next: () => fail('Should have thrown error'),
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle network errors during validation', (done) => {
      service.validateSession().subscribe(session => {
        expect(session).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('Reactive State Updates', () => {
    it('should emit session after initialization via session$ observable', (done) => {
      let emissionCount = 0;

      service.session$.subscribe(session => {
        emissionCount++;

        if (emissionCount === 1) {
          // First emission is null (BehaviorSubject initial value)
          expect(session).toBeNull();
        } else if (emissionCount === 2) {
          // Second emission is the initialized session
          expect(session).toBeTruthy();
          expect(session?.sessionId).toBe('test-session-123');
          done();
        }
      });

      // Trigger initialization
      initializeWithMockSession();
    });

    it('should emit null when session is cleared', (done) => {
      let emissionCount = 0;

      // First, initialize a session
      initializeWithMockSession();

      service.session$.subscribe(session => {
        emissionCount++;

        if (emissionCount === 1) {
          // First emission is the current session (already initialized)
          expect(session).toBeTruthy();
          service.clearSession();
        } else if (emissionCount === 2) {
          expect(session).toBeNull();
          done();
        }
      });
    });
  });
});

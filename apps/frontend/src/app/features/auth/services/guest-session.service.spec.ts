/**
 * @fileoverview Guest Session Service Unit Tests
 * @description Unit tests for GuestSessionService using HttpClientTestingModule.
 * Tests cover session creation, validation, localStorage fallback, and error handling.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GuestSessionService } from './guest-session.service';
import { GuestSession, GuestSessionInitResponse, GuestSessionValidateResponse } from '../models/guest-session.models';
import { environment } from '../../../../environments/environment';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/auth/guest-session`;

  // Mock guest session data
  const mockSession: GuestSession = {
    sessionUUID: '123e4567-e89b-12d3-a456-426614174000',
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
    metadata: {}
  };

  const mockExpiredSession: GuestSession = {
    sessionUUID: '123e4567-e89b-12d3-a456-426614174001',
    expiresAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    metadata: {}
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GuestSessionService]
    });
    service = TestBed.inject(GuestSessionService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ─── Service Initialization ───────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null session state', () => {
    expect(service.getCurrentSession()).toBeNull();
    expect(service.getSessionUUID()).toBeNull();
    expect(service.isSessionActive()).toBe(false);
  });

  // ─── createSession() ──────────────────────────────────────────

  describe('createSession()', () => {
    it('should create a new guest session via POST /init', (done) => {
      const mockResponse: { success: boolean; data: GuestSessionInitResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Guest session created',
          session: mockSession
        }
      };

      service.createSession().subscribe({
        next: (session) => {
          expect(session).toEqual(mockSession);
          expect(service.getCurrentSession()).toEqual(mockSession);
          expect(service.getSessionUUID()).toBe(mockSession.sessionUUID);
          expect(service.isSessionActive()).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should store session in localStorage', (done) => {
      const mockResponse: { success: boolean; data: GuestSessionInitResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Guest session created',
          session: mockSession
        }
      };

      service.createSession().subscribe({
        next: () => {
          expect(localStorage.getItem('guest_session_uuid')).toBe(mockSession.sessionUUID);
          expect(localStorage.getItem('guest_session_expiry')).toBe(mockSession.expiresAt);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      req.flush(mockResponse);
    });

    it('should handle createSession() error', (done) => {
      service.createSession().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(service.getCurrentSession()).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      req.flush('Session creation failed', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─── validateSession() ────────────────────────────────────────

  describe('validateSession()', () => {
    it('should validate an existing session via GET /validate', (done) => {
      const mockResponse: { success: boolean; data: GuestSessionValidateResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Session is valid',
          isValid: true,
          session: mockSession
        }
      };

      service.validateSession().subscribe({
        next: (isValid) => {
          expect(isValid).toBe(true);
          expect(service.getCurrentSession()).toEqual(mockSession);
          expect(service.isSessionActive()).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should clear session when validation fails', (done) => {
      const mockResponse: { success: boolean; data: GuestSessionValidateResponse } = {
        success: true,
        data: {
          success: false,
          message: 'Session is invalid',
          isValid: false
        }
      };

      service.validateSession().subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          expect(service.getCurrentSession()).toBeNull();
          expect(service.isSessionActive()).toBe(false);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      req.flush(mockResponse);
    });

    it('should handle validateSession() network error gracefully', (done) => {
      service.validateSession().subscribe({
        next: (isValid) => {
          expect(isValid).toBe(false);
          expect(service.getCurrentSession()).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      req.flush('Network error', { status: 0, statusText: 'Unknown Error' });
    });
  });

  // ─── clearSession() ───────────────────────────────────────────

  describe('clearSession()', () => {
    it('should clear session from memory and localStorage', () => {
      // Set up session first
      localStorage.setItem('guest_session_uuid', mockSession.sessionUUID);
      localStorage.setItem('guest_session_expiry', mockSession.expiresAt);
      service['updateSessionState'](mockSession);

      expect(service.getCurrentSession()).toEqual(mockSession);

      // Clear session
      service.clearSession();

      expect(service.getCurrentSession()).toBeNull();
      expect(service.getSessionUUID()).toBeNull();
      expect(service.isSessionActive()).toBe(false);
      expect(localStorage.getItem('guest_session_uuid')).toBeNull();
      expect(localStorage.getItem('guest_session_expiry')).toBeNull();
    });
  });

  // ─── isSessionActive() ────────────────────────────────────────

  describe('isSessionActive()', () => {
    it('should return true for valid unexpired session', () => {
      service['updateSessionState'](mockSession);
      expect(service.isSessionActive()).toBe(true);
    });

    it('should return false for expired session', () => {
      service['updateSessionState'](mockExpiredSession);
      expect(service.isSessionActive()).toBe(false);
    });

    it('should return false when no session exists', () => {
      service.clearSession();
      expect(service.isSessionActive()).toBe(false);
    });
  });

  // ─── initializeSession() ──────────────────────────────────────

  describe('initializeSession()', () => {
    it('should validate existing session if valid', (done) => {
      const mockValidateResponse: { success: boolean; data: GuestSessionValidateResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Session is valid',
          isValid: true,
          session: mockSession
        }
      };

      service.initializeSession().subscribe({
        next: (session) => {
          expect(session).toEqual(mockSession);
          expect(service.isSessionActive()).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      req.flush(mockValidateResponse);
    });

    it('should create new session if validation fails', (done) => {
      const mockValidateResponse: { success: boolean; data: GuestSessionValidateResponse } = {
        success: true,
        data: {
          success: false,
          message: 'Session is invalid',
          isValid: false
        }
      };

      const mockCreateResponse: { success: boolean; data: GuestSessionInitResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Guest session created',
          session: mockSession
        }
      };

      service.initializeSession().subscribe({
        next: (session) => {
          expect(session).toEqual(mockSession);
          expect(service.isSessionActive()).toBe(true);
          done();
        }
      });

      // First validate request (fails)
      const validateReq = httpMock.expectOne(`${apiUrl}/validate`);
      validateReq.flush(mockValidateResponse);

      // Then create request (succeeds)
      const createReq = httpMock.expectOne(`${apiUrl}/init`);
      createReq.flush(mockCreateResponse);
    });

    it('should restore session from localStorage if valid', (done) => {
      // Pre-populate localStorage with valid session
      localStorage.setItem('guest_session_uuid', mockSession.sessionUUID);
      localStorage.setItem('guest_session_expiry', mockSession.expiresAt);

      const mockValidateResponse: { success: boolean; data: GuestSessionValidateResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Session is valid',
          isValid: true,
          session: mockSession
        }
      };

      service.initializeSession().subscribe({
        next: (session) => {
          expect(session).toEqual(mockSession);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/validate`);
      req.flush(mockValidateResponse);
    });

    it('should ignore expired session in localStorage', (done) => {
      // Pre-populate localStorage with expired session
      localStorage.setItem('guest_session_uuid', mockExpiredSession.sessionUUID);
      localStorage.setItem('guest_session_expiry', mockExpiredSession.expiresAt);

      const mockValidateResponse: { success: boolean; data: GuestSessionValidateResponse } = {
        success: true,
        data: {
          success: false,
          message: 'Session is invalid',
          isValid: false
        }
      };

      const mockCreateResponse: { success: boolean; data: GuestSessionInitResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Guest session created',
          session: mockSession
        }
      };

      service.initializeSession().subscribe({
        next: (session) => {
          expect(session).toEqual(mockSession);
          done();
        }
      });

      const validateReq = httpMock.expectOne(`${apiUrl}/validate`);
      validateReq.flush(mockValidateResponse);

      const createReq = httpMock.expectOne(`${apiUrl}/init`);
      createReq.flush(mockCreateResponse);
    });
  });

  // ─── Observable Streams ───────────────────────────────────────

  describe('Observable Streams', () => {
    it('should emit session updates via session$ observable', (done) => {
      let emissionCount = 0;

      service.session$.subscribe((session) => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(session).toBeNull(); // Initial state
        } else if (emissionCount === 2) {
          expect(session).toEqual(mockSession); // After createSession
          done();
        }
      });

      const mockResponse: { success: boolean; data: GuestSessionInitResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Guest session created',
          session: mockSession
        }
      };

      service.createSession().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/init`);
      req.flush(mockResponse);
    });

    it('should update currentSession signal reactively', (done) => {
      expect(service.currentSession()).toBeNull();

      const mockResponse: { success: boolean; data: GuestSessionInitResponse } = {
        success: true,
        data: {
          success: true,
          message: 'Guest session created',
          session: mockSession
        }
      };

      service.createSession().subscribe({
        next: () => {
          expect(service.currentSession()).toEqual(mockSession);
          expect(service.isSessionActive()).toBe(true);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/init`);
      req.flush(mockResponse);
    });
  });
});

/**
 * @fileoverview Guest Session Service
 * @description Service responsible for managing guest user sessions in the SouqSyria marketplace.
 * Handles session initialization, validation, cookie-based state management, and localStorage fallback.
 * All guest sessions are tracked via HttpOnly cookies on the backend, with localStorage as backup
 * for offline scenarios or cookie-disabled browsers.
 * @module GuestSessionService
 * @requires HttpClient
 * @requires environment
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  GuestSession,
  GuestSessionInitResponse,
  GuestSessionValidateResponse
} from '../models/guest-session.models';

/**
 * Backend API response wrapper
 * @description All backend responses are wrapped in this structure by NestJS global interceptor
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
}

/**
 * @class GuestSessionService
 * @description Manages guest user sessions for unauthenticated shopping experiences.
 * Provides reactive state management via signals and BehaviorSubject for session tracking.
 * Uses HttpOnly cookies as primary storage with localStorage fallback.
 */
@Injectable({
  providedIn: 'root'
})
export class GuestSessionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth/guest-session`;

  /** LocalStorage key for guest session UUID fallback */
  private readonly GUEST_SESSION_KEY = 'guest_session_uuid';

  /** LocalStorage key for guest session expiry fallback */
  private readonly GUEST_SESSION_EXPIRY_KEY = 'guest_session_expiry';

  /**
   * BehaviorSubject holding the current guest session state
   * @description Emits null when no session exists or session is expired
   */
  private readonly sessionSubject = new BehaviorSubject<GuestSession | null>(null);

  /**
   * Observable stream of session state changes
   * @description Subscribe to this to react to session state updates
   */
  public readonly session$ = this.sessionSubject.asObservable();

  /**
   * Signal holding the current guest session state
   * @description Reactive signal for use in components with modern Angular patterns
   */
  public readonly currentSession = signal<GuestSession | null>(null);

  /**
   * Computed signal indicating whether a valid session is active
   * @description Returns true if session exists and is not expired
   */
  public readonly isSessionActive = computed(() => {
    const session = this.currentSession();
    if (!session) {
      return false;
    }
    return !this.isSessionExpired(session);
  });

  /**
   * @method createSession
   * @description Initializes a new guest session with the backend.
   * Sends a POST request to /auth/guest-session/init with withCredentials: true
   * to enable HttpOnly cookie storage. Also stores session in localStorage as fallback.
   * @returns {Observable<GuestSession>} Observable emitting the newly created guest session
   */
  createSession(): Observable<GuestSession> {
    return this.http.post<ApiResponse<GuestSessionInitResponse>>(
      `${this.apiUrl}/init`,
      {},
      { withCredentials: true }
    ).pipe(
      map(response => response.data.session),
      tap(session => {
        this.updateSessionState(session);
        this.storeSessionInLocalStorage(session);
        console.log('[GuestSessionService] Session created:', session.sessionUUID);
      }),
      catchError(error => {
        console.error('[GuestSessionService] Failed to create session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * @method validateSession
   * @description Validates the current guest session with the backend.
   * Sends a GET request to /auth/guest-session/validate with withCredentials: true.
   * If valid, updates local state. If invalid, clears session.
   * @returns {Observable<boolean>} Observable emitting true if session is valid, false otherwise
   */
  validateSession(): Observable<boolean> {
    return this.http.get<ApiResponse<GuestSessionValidateResponse>>(
      `${this.apiUrl}/validate`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        const { isValid, session } = response.data;
        if (isValid && session) {
          this.updateSessionState(session);
          this.storeSessionInLocalStorage(session);
          console.log('[GuestSessionService] Session validated:', session.sessionUUID);
          return true;
        } else {
          this.clearSession();
          console.warn('[GuestSessionService] Session validation failed');
          return false;
        }
      }),
      catchError(error => {
        console.error('[GuestSessionService] Session validation error:', error);
        this.clearSession();
        return of(false);
      })
    );
  }

  /**
   * @method getCurrentSession
   * @description Gets the current guest session from the signal.
   * @returns {GuestSession | null} The current session or null if none exists
   */
  getCurrentSession(): GuestSession | null {
    return this.currentSession();
  }

  /**
   * @method getSessionUUID
   * @description Gets the current session UUID from the signal.
   * @returns {string | null} The session UUID or null if no session exists
   */
  getSessionUUID(): string | null {
    const session = this.currentSession();
    return session?.sessionUUID ?? null;
  }

  /**
   * @method clearSession
   * @description Clears the guest session from both memory and localStorage.
   * Does NOT call the backend to invalidate the session (cookies expire naturally).
   * @returns {void}
   */
  clearSession(): void {
    this.sessionSubject.next(null);
    this.currentSession.set(null);
    localStorage.removeItem(this.GUEST_SESSION_KEY);
    localStorage.removeItem(this.GUEST_SESSION_EXPIRY_KEY);
    console.log('[GuestSessionService] Session cleared');
  }

  /**
   * @method initializeSession
   * @description Initializes the guest session on app bootstrap.
   * First attempts to validate existing session (from cookie or localStorage).
   * If validation fails or no session exists, creates a new session.
   * @returns {Observable<GuestSession>} Observable emitting the active guest session
   */
  initializeSession(): Observable<GuestSession> {
    // First, try to restore from localStorage (offline fallback)
    const localSession = this.restoreSessionFromLocalStorage();
    if (localSession && !this.isSessionExpired(localSession)) {
      console.log('[GuestSessionService] Restored session from localStorage:', localSession.sessionUUID);
      this.updateSessionState(localSession);
    }

    // Then validate with backend (cookie-based or localStorage-based)
    return this.validateSession().pipe(
      switchMap(isValid => {
        if (isValid) {
          // Session is valid, return current session
          const session = this.currentSession();
          return of(session!);
        } else {
          // No valid session, create new one
          console.log('[GuestSessionService] No valid session, creating new one');
          return this.createSession();
        }
      }),
      catchError(() => {
        // Fallback: create new session if validation fails
        console.warn('[GuestSessionService] Validation failed, creating new session');
        return this.createSession();
      })
    );
  }

  /**
   * @method updateSessionState
   * @description Updates both the BehaviorSubject and signal with new session state.
   * @param {GuestSession | null} session - The new session state
   * @returns {void}
   * @private
   */
  private updateSessionState(session: GuestSession | null): void {
    this.sessionSubject.next(session);
    this.currentSession.set(session);
  }

  /**
   * @method storeSessionInLocalStorage
   * @description Stores guest session in localStorage as fallback for offline scenarios.
   * @param {GuestSession} session - The session to store
   * @returns {void}
   * @private
   */
  private storeSessionInLocalStorage(session: GuestSession): void {
    try {
      localStorage.setItem(this.GUEST_SESSION_KEY, session.sessionUUID);
      localStorage.setItem(this.GUEST_SESSION_EXPIRY_KEY, session.expiresAt);
    } catch (error) {
      console.warn('[GuestSessionService] Failed to store session in localStorage:', error);
    }
  }

  /**
   * @method restoreSessionFromLocalStorage
   * @description Restores guest session from localStorage fallback.
   * @returns {GuestSession | null} The restored session or null if not found/invalid
   * @private
   */
  private restoreSessionFromLocalStorage(): GuestSession | null {
    try {
      const sessionUUID = localStorage.getItem(this.GUEST_SESSION_KEY);
      const expiresAt = localStorage.getItem(this.GUEST_SESSION_EXPIRY_KEY);

      if (sessionUUID && expiresAt) {
        return {
          sessionUUID,
          expiresAt,
          metadata: {}
        };
      }
      return null;
    } catch (error) {
      console.warn('[GuestSessionService] Failed to restore session from localStorage:', error);
      return null;
    }
  }

  /**
   * @method isSessionExpired
   * @description Checks if a guest session is expired based on expiresAt timestamp.
   * @param {GuestSession} session - The session to check
   * @returns {boolean} True if session is expired, false otherwise
   * @private
   */
  private isSessionExpired(session: GuestSession): boolean {
    const expiryTime = new Date(session.expiresAt).getTime();
    const now = Date.now();
    return now >= expiryTime;
  }
}

// Import for pipe operator
import { switchMap } from 'rxjs/operators';

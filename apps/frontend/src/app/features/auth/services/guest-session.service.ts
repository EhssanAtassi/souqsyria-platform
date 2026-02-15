/**
 * @fileoverview Guest Session Management Service
 * @description Service responsible for managing anonymous guest sessions for unauthenticated users.
 * Handles session creation, validation, and lifecycle management using HTTP-only cookies.
 * Provides localStorage fallback for offline session tracking.
 * @module GuestSessionService
 * @requires HttpClient
 * @requires environment
 */

import { Injectable, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * @interface GuestSession
 * @description Represents a guest session object returned from the backend.
 * Matches the backend DTO shape exactly (sessionId, not id).
 */
export interface GuestSession {
  /** Unique guest session identifier */
  sessionId: string;
  /** ISO timestamp when session expires */
  expiresAt: string;
  /** Additional session metadata */
  metadata?: Record<string, any>;
  /** Session status */
  status: 'active' | 'expired' | 'converted';
  /** Whether the session is currently valid */
  isValid: boolean;
  /** Whether the session has an associated cart */
  hasCart?: boolean;
}

/**
 * @interface GuestSessionValidation
 * @description Response from session validation endpoint
 */
export interface GuestSessionValidation {
  /** Whether the session exists */
  exists: boolean;
  /** Whether the session is valid */
  isValid: boolean;
  /** ISO timestamp when session expires */
  expiresAt?: string;
  /** Session status */
  status?: 'active' | 'expired' | 'converted';
}

/**
 * @class GuestSessionService
 * @description Manages guest sessions for unauthenticated users in the SouqSyria marketplace.
 * Uses HTTP-only cookies for security and provides localStorage fallback for offline access.
 * Automatically initializes on service instantiation.
 *
 * Features:
 * - Automatic session initialization on service creation
 * - HTTP-only cookie-based session management
 * - LocalStorage fallback for offline tracking
 * - Session validation and renewal
 * - Reactive session state updates
 *
 * @example
 * ```typescript
 * // Inject the service
 * private guestSessionService = inject(GuestSessionService);
 *
 * // Get current session (reactive)
 * this.guestSessionService.session$.subscribe(session => {
 *   console.log('Current session:', session);
 * });
 *
 * // Check if session is active
 * const isActive = this.guestSessionService.isSessionActive();
 *
 * // Get session ID
 * const sessionId = this.guestSessionService.getSessionId();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class GuestSessionService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiUrl = `${environment.apiUrl}/auth/guest-session`;

  /** LocalStorage key for guest session fallback */
  private readonly STORAGE_KEY = 'guest_session';

  /**
   * @property {BehaviorSubject<GuestSession | null>} sessionSubject
   * @description Reactive state holder for current guest session
   */
  private readonly sessionSubject = new BehaviorSubject<GuestSession | null>(null);

  /**
   * @property {Observable<GuestSession | null>} session$
   * @description Observable stream of guest session state changes
   * @public
   */
  public readonly session$ = this.sessionSubject.asObservable();

  /**
   * @constructor
   * @description Initializes the service. Session initialization is handled by APP_INITIALIZER.
   */
  constructor() {
    // Session initialization is handled by APP_INITIALIZER to avoid race conditions
  }

  /**
   * @method initializeSession
   * @description Initializes guest session by first validating existing session,
   * then creating a new one if validation fails, and finally falling back to localStorage.
   * Uses RxJS operators to avoid nested subscriptions and memory leaks.
   * @returns {Observable<void>} Observable that completes when initialization finishes
   */
  public initializeSession(): Observable<void> {
    return this.validateSession().pipe(
      switchMap((validation) => {
        if (validation && validation.exists && validation.isValid) {
          // Valid session exists - convert validation to session for state
          const session: GuestSession = {
            sessionId: '', // Backend doesn't return ID on validation
            expiresAt: validation.expiresAt || '',
            status: validation.status || 'active',
            isValid: validation.isValid,
            metadata: {}
          };
          this.sessionSubject.next(session);
          this.saveToLocalStorage(session);
          return of(void 0);
        } else {
          // No valid session, create a new one
          return this.createSession().pipe(
            tap((newSession) => {
              this.sessionSubject.next(newSession);
              this.saveToLocalStorage(newSession);
            }),
            map(() => void 0),
            catchError(() => {
              // If creation fails, try localStorage fallback
              this.loadFromLocalStorage();
              return of(void 0);
            })
          );
        }
      }),
      catchError(() => {
        // Validation failed, try creating new session
        return this.createSession().pipe(
          tap((newSession) => {
            this.sessionSubject.next(newSession);
            this.saveToLocalStorage(newSession);
          }),
          map(() => void 0),
          catchError(() => {
            // If creation also fails, use localStorage fallback
            this.loadFromLocalStorage();
            return of(void 0);
          })
        );
      })
    );
  }

  /**
   * @method createSession
   * @description Creates a new guest session by calling the backend API.
   * The backend sets an HTTP-only cookie named 'guest_session_id'.
   * @returns {Observable<GuestSession>} Observable emitting the created session
   */
  public createSession(): Observable<GuestSession> {
    return this.http.post<GuestSession>(
      `${this.apiUrl}/init`,
      {},
      { withCredentials: true } // Required to send/receive HTTP-only cookies
    ).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  /**
   * @method validateSession
   * @description Validates the current guest session by calling the backend.
   * The backend reads the HTTP-only cookie to validate the session.
   * @returns {Observable<GuestSessionValidation | null>} Observable emitting validation result or null
   */
  public validateSession(): Observable<GuestSessionValidation | null> {
    return this.http.get<GuestSessionValidation>(
      `${this.apiUrl}/validate`,
      { withCredentials: true } // Required to send HTTP-only cookie
    ).pipe(
      catchError((error) => {
        // Return null instead of throwing to allow fallback
        return of(null);
      })
    );
  }

  /**
   * @method getCurrentSession
   * @description Synchronously retrieves the current guest session state.
   * @returns {GuestSession | null} The current session or null if none exists
   */
  public getCurrentSession(): GuestSession | null {
    return this.sessionSubject.getValue();
  }

  /**
   * @method getSessionId
   * @description Synchronously retrieves the current guest session ID.
   * @returns {string | null} The session ID or null if no session exists
   */
  public getSessionId(): string | null {
    const session = this.getCurrentSession();
    return session?.sessionId || null;
  }

  /**
   * @method isSessionActive
   * @description Checks if a guest session exists and is not expired.
   * @returns {boolean} True if an active session exists, false otherwise
   */
  public isSessionActive(): boolean {
    const session = this.getCurrentSession();

    if (!session) {
      return false;
    }

    // Check if session has expired
    const expiryTime = new Date(session.expiresAt).getTime();
    const now = Date.now();

    if (now >= expiryTime || !session.isValid) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * @method clearSession
   * @description Clears the current guest session from memory and localStorage.
   * Note: Cannot clear HTTP-only cookie from frontend - backend must handle expiration.
   * @returns {void}
   */
  public clearSession(): void {
    this.sessionSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * @method saveToLocalStorage
   * @description Persists minimal guest session data to localStorage as offline-only fallback.
   * Only stores sessionId and expiresAt to minimize XSS exposure.
   * Never store metadata or sensitive data in localStorage.
   * @param {GuestSession} session - The session to save
   * @returns {void}
   * @private
   */
  private saveToLocalStorage(session: GuestSession): void {
    try {
      // Only store minimal session info for offline checks
      const minimalSession = {
        sessionId: session.sessionId,
        expiresAt: session.expiresAt
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(minimalSession));
    } catch (error) {
      // Silent fail - localStorage is optional fallback
    }
  }

  /**
   * @method loadFromLocalStorage
   * @description Loads guest session from localStorage as offline-only fallback.
   * Used when network requests fail. Only reconstructs minimal session state.
   * @returns {void}
   * @private
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const minimalSession = JSON.parse(stored);

        // Check if stored session is still valid
        const expiryTime = new Date(minimalSession.expiresAt).getTime();
        const now = Date.now();

        if (now < expiryTime) {
          // Reconstruct full session object
          const session: GuestSession = {
            sessionId: minimalSession.sessionId,
            expiresAt: minimalSession.expiresAt,
            status: 'active',
            isValid: true,
            metadata: {}
          };
          this.sessionSubject.next(session);
        } else {
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch (error) {
      // Silent fail - localStorage is optional fallback
    }
  }
}

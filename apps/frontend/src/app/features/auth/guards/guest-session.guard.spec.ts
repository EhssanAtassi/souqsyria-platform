/**
 * @fileoverview Guest Session Guard Unit Tests
 * @description Tests for the guest session route guard functionality
 * @module GuestSessionGuardSpec
 */

import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { of, throwError, isObservable } from 'rxjs';
import { guestSessionGuard } from './guest-session.guard';
import { GuestSessionService, GuestSession } from '../services/guest-session.service';

/**
 * @description Test suite for guest session guard
 */
describe('guestSessionGuard', () => {
  let mockGuestSessionService: jasmine.SpyObj<GuestSessionService>;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestSessionGuard(...guardParameters));

  /**
   * @description Mock valid guest session
   */
  const mockValidSession: GuestSession = {
    sessionId: 'test-session-id',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    status: 'active',
    isValid: true,
    metadata: {}
  };

  beforeEach(() => {
    // Create mock service
    mockGuestSessionService = jasmine.createSpyObj('GuestSessionService', [
      'getCurrentSession',
      'initializeSession'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: GuestSessionService, useValue: mockGuestSessionService }
      ]
    });
  });

  /**
   * @test Should allow navigation when session is valid
   */
  it('should allow navigation when session is valid', () => {
    mockGuestSessionService.getCurrentSession.and.returnValue(mockValidSession);

    const result = executeGuard(null as any, null as any);

    expect(result).toBe(true);
    expect(mockGuestSessionService.getCurrentSession).toHaveBeenCalled();
    expect(mockGuestSessionService.initializeSession).not.toHaveBeenCalled();
  });

  /**
   * @test Should trigger initialization when no session exists
   */
  it('should trigger initialization when no session exists', (done) => {
    mockGuestSessionService.getCurrentSession.and.returnValue(null);
    mockGuestSessionService.initializeSession.and.returnValue(of(void 0));

    const result = executeGuard(null as any, null as any);

    if (!isObservable(result)) {
      fail('Expected Observable, got: ' + typeof result);
      done();
      return;
    }

    result.subscribe({
      next: (canActivate) => {
        expect(canActivate).toBe(true);
        expect(mockGuestSessionService.initializeSession).toHaveBeenCalled();
        done();
      }
    });
  });

  /**
   * @test Should return true even if initialization fails
   */
  it('should return true even if initialization fails', (done) => {
    mockGuestSessionService.getCurrentSession.and.returnValue(null);
    mockGuestSessionService.initializeSession.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    const result = executeGuard(null as any, null as any);

    if (!isObservable(result)) {
      fail('Expected Observable, got: ' + typeof result);
      done();
      return;
    }

    result.subscribe({
      next: (canActivate) => {
        expect(canActivate).toBe(true);
        done();
      }
    });
  });

  /**
   * @test Should trigger initialization when session is invalid
   */
  it('should trigger initialization when session is invalid', (done) => {
    const invalidSession: GuestSession = {
      ...mockValidSession,
      isValid: false
    };

    mockGuestSessionService.getCurrentSession.and.returnValue(invalidSession);
    mockGuestSessionService.initializeSession.and.returnValue(of(void 0));

    const result = executeGuard(null as any, null as any);

    if (!isObservable(result)) {
      fail('Expected Observable, got: ' + typeof result);
      done();
      return;
    }

    result.subscribe({
      next: (canActivate) => {
        expect(canActivate).toBe(true);
        expect(mockGuestSessionService.initializeSession).toHaveBeenCalled();
        done();
      }
    });
  });

  /**
   * @test Should properly inject GuestSessionService
   */
  it('should properly inject GuestSessionService', () => {
    mockGuestSessionService.getCurrentSession.and.returnValue(mockValidSession);

    executeGuard(null as any, null as any);

    expect(mockGuestSessionService.getCurrentSession).toHaveBeenCalled();
  });
});

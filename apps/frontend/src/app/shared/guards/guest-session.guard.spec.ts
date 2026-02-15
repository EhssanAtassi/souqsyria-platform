/**
 * @fileoverview Guest Session Guard Unit Tests
 * @description Unit tests for guestSessionGuard and authenticatedOrGuestGuard
 * functional route guards.
 */

import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { GuestSessionService } from '../../features/auth/services/guest-session.service';
import { guestSessionGuard, authenticatedOrGuestGuard } from './guest-session.guard';
import { signal } from '@angular/core';

describe('Guest Session Guards', () => {
  let mockGuestSessionService: jasmine.SpyObj<GuestSessionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // Create mock services
    mockGuestSessionService = jasmine.createSpyObj('GuestSessionService',
      ['getCurrentSession', 'getSessionUUID'],
      { isSessionActive: signal(false) }
    );

    mockRouter = jasmine.createSpyObj('Router', ['createUrlTree']);

    // Create mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/cart' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: GuestSessionService, useValue: mockGuestSessionService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  // ─── guestSessionGuard ────────────────────────────────────────

  describe('guestSessionGuard', () => {
    it('should allow access when guest session is active', () => {
      // Mock active session
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(true)
      });

      const result = TestBed.runInInjectionContext(() =>
        guestSessionGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect to homepage when no valid session exists', () => {
      // Mock no active session
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(false)
      });

      const mockUrlTree = { toString: () => '/' } as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        guestSessionGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });

    it('should handle expired session scenario', () => {
      // Mock expired session (isSessionActive returns false)
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(false)
      });

      const mockUrlTree = { toString: () => '/' } as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        guestSessionGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });

  // ─── authenticatedOrGuestGuard ────────────────────────────────

  describe('authenticatedOrGuestGuard', () => {
    it('should allow access when guest session is active', () => {
      // Mock active guest session
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(true)
      });

      const result = TestBed.runInInjectionContext(() =>
        authenticatedOrGuestGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
    });

    it('should redirect to homepage when no valid session exists', () => {
      // Mock no active session
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(false)
      });

      const mockUrlTree = { toString: () => '/' } as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() =>
        authenticatedOrGuestGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });

    // TODO: Add test for authenticated user scenario when UserService is integrated
    // it('should allow access when user is authenticated (even without guest session)', () => {
    //   // Mock authenticated user
    //   // This test will be added after UserService integration
    // });
  });

  // ─── Integration Scenarios ────────────────────────────────────

  describe('Integration Scenarios', () => {
    it('should protect cart route with valid guest session', () => {
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(true)
      });

      const cartState = { url: '/cart' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        guestSessionGuard(mockRoute, cartState)
      );

      expect(result).toBe(true);
    });

    it('should protect checkout route with valid guest session', () => {
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(true)
      });

      const checkoutState = { url: '/checkout/guest' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        authenticatedOrGuestGuard(mockRoute, checkoutState)
      );

      expect(result).toBe(true);
    });

    it('should redirect guest checkout without session to homepage', () => {
      Object.defineProperty(mockGuestSessionService, 'isSessionActive', {
        get: () => signal(false)
      });

      const mockUrlTree = { toString: () => '/' } as UrlTree;
      mockRouter.createUrlTree.and.returnValue(mockUrlTree);

      const checkoutState = { url: '/checkout/guest' } as RouterStateSnapshot;
      const result = TestBed.runInInjectionContext(() =>
        guestSessionGuard(mockRoute, checkoutState)
      );

      expect(result).toBe(mockUrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
    });
  });
});

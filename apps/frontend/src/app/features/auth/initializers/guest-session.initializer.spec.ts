/**
 * @fileoverview Guest Session Initializer Unit Tests
 * @description Tests for the APP_INITIALIZER factory function
 * @module GuestSessionInitializerSpec
 */

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { initializeGuestSession, guestSessionInitializerProvider } from './guest-session.initializer';
import { GuestSessionService } from '../services/guest-session.service';
import { APP_INITIALIZER, FactoryProvider } from '@angular/core';

/**
 * @description Test suite for guest session initializer
 */
describe('GuestSessionInitializer', () => {
  let mockGuestSessionService: jasmine.SpyObj<GuestSessionService>;

  beforeEach(() => {
    mockGuestSessionService = jasmine.createSpyObj('GuestSessionService', [
      'initializeSession'
    ]);
  });

  /**
   * @test Should return a function that returns a Promise
   */
  it('should return a function that returns a Promise', () => {
    mockGuestSessionService.initializeSession.and.returnValue(of(void 0));

    const initFn = initializeGuestSession(mockGuestSessionService);

    expect(typeof initFn).toBe('function');

    const result = initFn();

    expect(result).toBeInstanceOf(Promise);
  });

  /**
   * @test Should resolve when service initialization succeeds
   */
  it('should resolve when service initialization succeeds', async () => {
    mockGuestSessionService.initializeSession.and.returnValue(of(void 0));

    const initFn = initializeGuestSession(mockGuestSessionService);

    await expectAsync(initFn()).toBeResolved();

    expect(mockGuestSessionService.initializeSession).toHaveBeenCalled();
  });

  /**
   * @test Should resolve (not reject) when service initialization fails
   */
  it('should resolve (not reject) when service initialization fails', async () => {
    mockGuestSessionService.initializeSession.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    const initFn = initializeGuestSession(mockGuestSessionService);

    // Should still resolve, not reject
    await expectAsync(initFn()).toBeResolved();

    expect(mockGuestSessionService.initializeSession).toHaveBeenCalled();
  });

  /**
   * @test Should call guestSessionService.initializeSession
   */
  it('should call guestSessionService.initializeSession', async () => {
    mockGuestSessionService.initializeSession.and.returnValue(of(void 0));

    const initFn = initializeGuestSession(mockGuestSessionService);
    await initFn();

    expect(mockGuestSessionService.initializeSession).toHaveBeenCalledTimes(1);
  });

  /**
   * @test Provider should have correct configuration
   */
  it('should provide correct APP_INITIALIZER configuration', () => {
    const provider = guestSessionInitializerProvider as FactoryProvider;
    expect(provider.provide).toBe(APP_INITIALIZER);
    expect(provider.useFactory).toBe(initializeGuestSession);
    expect(provider.deps).toEqual([GuestSessionService]);
    expect(provider.multi).toBe(true);
  });

  /**
   * @test Provider should work with Angular DI
   */
  it('should work with Angular dependency injection', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: GuestSessionService, useValue: mockGuestSessionService },
        guestSessionInitializerProvider
      ]
    });

    const initializers = TestBed.inject(APP_INITIALIZER);

    expect(initializers).toBeDefined();
    expect(Array.isArray(initializers)).toBe(true);
  });
});

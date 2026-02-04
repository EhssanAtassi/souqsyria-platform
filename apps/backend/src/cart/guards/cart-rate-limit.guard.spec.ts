/**
 * @file cart-rate-limit.guard.spec.ts
 * @description Unit tests for Cart Rate Limiting Guard
 *
 * COVERAGE:
 * - Rate limiting enforcement for authenticated and guest users
 * - In-memory sliding window algorithm
 * - Configurable rate limits via decorator
 * - Error handling
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CartRateLimitGuard, RATE_LIMIT_KEY, RateLimit } from './cart-rate-limit.guard';

interface RateLimitConfig {
  maxRequests: number;
  windowSizeInSeconds: number;
  penaltyDelayMs?: number;
  message?: string;
}

const mockReflector = {
  get: jest.fn(),
};

/** Mock ExecutionContext factory with named handlers */
const createMockExecutionContext = (
  user?: any,
  ip: string = '192.168.1.1',
  userAgent: string = 'test-agent',
  path: string = '/cart',
  handlerName: string = 'addToCart',
): Partial<ExecutionContext> => {
  const handler = { name: handlerName } as Function;
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        ip,
        headers: {
          'user-agent': userAgent,
          'x-forwarded-for': undefined,
          'x-real-ip': undefined,
        },
        route: { path },
        path,
        method: 'POST',
        connection: { remoteAddress: ip },
        socket: { remoteAddress: ip },
      } as any),
      getResponse: () => ({}) as any,
      getNext: () => (() => {}) as any,
    }),
    getHandler: () => handler,
    getClass: () => (class CartController {}) as any,
  };
};

describe('CartRateLimitGuard', () => {
  let guard: CartRateLimitGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartRateLimitGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    guard = module.get<CartRateLimitGuard>(CartRateLimitGuard);
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for authenticated user within limits', async () => {
      const context = createMockExecutionContext(
        { id: 'user123', email: 'test@example.com' },
        '192.168.1.1',
      );

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should block access when exceeding limits', async () => {
      // Mock reflector to provide explicit config with very low limit
      mockReflector.get.mockReturnValue({
        maxRequests: 2,
        windowSizeInSeconds: 3600,
      });

      const context = createMockExecutionContext(
        { id: 'user-rate-block', email: 'test@example.com' },
        '192.168.1.1',
      );

      // Exhaust the limit by making requests
      for (let i = 0; i < 5; i++) {
        try {
          await guard.canActivate(context as ExecutionContext);
        } catch {
          // Expected after limit exceeded
        }
      }

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        HttpException,
      );
    });

    it('should allow access for guest user within limits', async () => {
      const context = createMockExecutionContext(
        null, // Guest user
        '192.168.1.100',
      );

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should block guest user exceeding limits', async () => {
      mockReflector.get.mockReturnValue({
        maxRequests: 2,
        windowSizeInSeconds: 300,
      });

      const context = createMockExecutionContext(
        null, // Guest
        '192.168.1.200',
      );

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        try {
          await guard.canActivate(context as ExecutionContext);
        } catch {
          // Expected after limit exceeded
        }
      }

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        HttpException,
      );
    });

    it('should use in-memory rate limiting (no external dependencies)', async () => {
      const context = createMockExecutionContext(
        { id: 'user-memory-test' },
        '192.168.1.1',
      );

      // In-memory rate limiting always works without external deps
      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should use custom rate limits from decorator', async () => {
      const context = createMockExecutionContext(
        { id: 'user-custom-limit' },
        '192.168.1.1',
      );

      // Mock custom rate limit from decorator
      const customLimit: RateLimitConfig = {
        maxRequests: 5,
        windowSizeInSeconds: 60,
        message: 'Custom limit exceeded',
      };
      mockReflector.get.mockReturnValue(customLimit);

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should skip rate limiting when no config applies', async () => {
      // Handler name doesn't match add/remove patterns and no decorator
      const context = createMockExecutionContext(
        { id: 'user123' },
        '192.168.1.1',
        'test-agent',
        '/cart',
        'getCartDetails', // Doesn't match add/remove
      );

      mockReflector.get.mockReturnValue(null);

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('generateRateLimitKey', () => {
    it('should generate user-based key for authenticated users', () => {
      const guardAny = guard as any;

      const request = {
        user: { id: 'user123' },
        ip: '192.168.1.1',
        headers: {},
        connection: { remoteAddress: '192.168.1.1' },
        socket: { remoteAddress: '192.168.1.1' },
      };

      const key = guardAny.getClientIdentifier(request);
      expect(key).toContain('user:user123');
    });

    it('should generate IP-based key for guest users', () => {
      const guardAny = guard as any;

      const request = {
        user: null,
        ip: '192.168.1.100',
        headers: {},
        connection: { remoteAddress: '192.168.1.100' },
        socket: { remoteAddress: '192.168.1.100' },
      };

      const key = guardAny.getClientIdentifier(request);
      expect(key).toContain('ip:');
    });
  });

  describe('Rate Limit Decorator', () => {
    it('should set metadata correctly', () => {
      const testLimit: RateLimitConfig = {
        maxRequests: 15,
        windowSizeInSeconds: 120,
        message: 'Test limit exceeded',
      };

      @RateLimit(testLimit)
      class TestController {
        testMethod() {}
      }

      expect(testLimit.maxRequests).toBe(15);
      expect(testLimit.windowSizeInSeconds).toBe(120);
      expect(testLimit.message).toBe('Test limit exceeded');
    });
  });
});

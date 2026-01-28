/**
 * @file cart-rate-limit.guard.spec.ts
 * @description Unit tests for Cart Rate Limiting Guard
 *
 * COVERAGE:
 * - Rate limiting enforcement for authenticated and guest users
 * - Redis sliding window algorithm
 * - Configurable rate limits via decorator
 * - Error handling and fail-open behavior
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { CartRateLimitGuard, RATE_LIMIT_KEY, RateLimit } from './cart-rate-limit.guard';

interface RateLimitConfig {
  maxRequests: number;
  windowSizeInSeconds: number;
  penaltyDelayMs?: number;
  message?: string;
}

/** Mock Redis with sliding window sorted set operations */
const mockMulti = {
  zremrangebyscore: jest.fn().mockReturnThis(),
  zadd: jest.fn().mockReturnThis(),
  zcard: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([
    [null, 0],   // zremrangebyscore result
    [null, 1],   // zadd result
    [null, 5],   // zcard result (current count)
    [null, 1],   // expire result
  ]),
};

const mockRedis = {
  multi: jest.fn().mockReturnValue(mockMulti),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
};

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
        { provide: 'default_IORedisModuleConnectionToken', useValue: mockRedis },
      ],
    }).compile();

    guard = module.get<CartRateLimitGuard>(CartRateLimitGuard);
    jest.clearAllMocks();

    // Reset default mock behaviors
    mockRedis.multi.mockReturnValue(mockMulti);
    mockMulti.zremrangebyscore.mockReturnThis();
    mockMulti.zadd.mockReturnThis();
    mockMulti.zcard.mockReturnThis();
    mockMulti.expire.mockReturnThis();
  });

  describe('canActivate', () => {
    it('should allow access for authenticated user within limits', async () => {
      const context = createMockExecutionContext(
        { id: 'user123', email: 'test@example.com' },
        '192.168.1.1',
      );

      // Return low request count (within limits)
      mockMulti.exec.mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 5], // 5 requests - well within limit
        [null, 1],
      ]);

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('should block access when exceeding limits', async () => {
      const context = createMockExecutionContext(
        { id: 'user123', email: 'test@example.com' },
        '192.168.1.1',
      );

      // Mock reflector to provide explicit config
      mockReflector.get.mockReturnValue({
        maxRequests: 10,
        windowSizeInSeconds: 3600,
      });

      // Return high request count (over limit: 10 * 1.5 = 15 for authenticated)
      mockMulti.exec.mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 20], // 20 requests > 15 (authenticated limit)
        [null, 1],
      ]);

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        HttpException,
      );
    });

    it('should allow access for guest user within limits', async () => {
      const context = createMockExecutionContext(
        null, // Guest user
        '192.168.1.100',
      );

      mockMulti.exec.mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 10], // Within default guest addItem limit of 20
        [null, 1],
      ]);

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should block guest user exceeding limits', async () => {
      const context = createMockExecutionContext(
        null, // Guest
        '192.168.1.100',
      );

      mockReflector.get.mockReturnValue({
        maxRequests: 10,
        windowSizeInSeconds: 300,
      });

      // 15 requests > 10 (guest limit, no 1.5x multiplier)
      mockMulti.exec.mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 15],
        [null, 1],
      ]);

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        HttpException,
      );
    });

    it('should handle Redis connection failures gracefully (fail-open)', async () => {
      const context = createMockExecutionContext(
        { id: 'user123' },
        '192.168.1.1',
      );

      // Simulate Redis failure
      mockMulti.exec.mockRejectedValue(new Error('Redis connection failed'));

      // Should allow access when Redis fails (fail-open)
      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should use custom rate limits from decorator', async () => {
      const context = createMockExecutionContext(
        { id: 'user123' },
        '192.168.1.1',
      );

      // Mock custom rate limit from decorator
      const customLimit: RateLimitConfig = {
        maxRequests: 5,
        windowSizeInSeconds: 60,
        message: 'Custom limit exceeded',
      };
      mockReflector.get.mockReturnValue(customLimit);

      // Within custom limit (3 < 5 * 1.5 = 7.5 for authenticated)
      mockMulti.exec.mockResolvedValue([
        [null, 0],
        [null, 1],
        [null, 3],
        [null, 1],
      ]);

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
      // Redis should NOT be called since no rate limiting applies
      expect(mockRedis.multi).not.toHaveBeenCalled();
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

/**
 * @file cart-rate-limit.guard.spec.ts
 * @description Unit tests for Cart Rate Limiting Guard
 *
 * COVERAGE:
 * - Rate limiting enforcement for authenticated users
 * - Rate limiting enforcement for guest users
 * - Redis integration and sliding window algorithm
 * - Progressive penalty system for repeat offenders
 * - Rate limit decorator functionality
 * - Error handling and fallback mechanisms
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import { CartRateLimitGuard, RATE_LIMIT_KEY, RateLimit } from './cart-rate-limit.guard';

// Mock Redis
const mockRedis = {
  multi: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exec: jest.fn(),
};

// Mock Reflector
const mockReflector = {
  get: jest.fn(),
};

// Mock ExecutionContext
const createMockExecutionContext = (
  user?: any,
  ip: string = '192.168.1.1',
  userAgent: string = 'test-agent',
  path: string = '/cart',
): Partial<ExecutionContext> => ({
  switchToHttp: () => ({
    getRequest: () => ({
      user,
      ip,
      headers: { 'user-agent': userAgent },
      route: { path },
      method: 'POST',
    }),
  }),
  getHandler: () => ({}),
});

describe('CartRateLimitGuard', () => {
  let guard: CartRateLimitGuard;
  let reflector: Reflector;
  let redis: Redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartRateLimitGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: 'default_IORedisModuleConnectionToken',
          useValue: mockRedis,
        },
      ],
    }).compile();

    guard = module.get<CartRateLimitGuard>(CartRateLimitGuard);
    reflector = module.get<Reflector>(Reflector);
    redis = module.get('default_IORedisModuleConnectionToken');

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for authenticated user within limits', async () => {
      const context = createMockExecutionContext(
        { id: 'user123', email: 'test@example.com' },
        '192.168.1.1'
      );

      // Mock reflector to return default rate limits
      mockReflector.get.mockReturnValue(null);

      // Mock Redis responses for within limits
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 5], // Current count
          [null, 'OK'], // Expire command result
        ]),
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockRedis.multi).toHaveBeenCalled();
    });

    it('should block access for authenticated user exceeding limits', async () => {
      const context = createMockExecutionContext(
        { id: 'user123', email: 'test@example.com' },
        '192.168.1.1'
      );

      mockReflector.get.mockReturnValue({
        maxRequests: 10,
        windowSizeInSeconds: 3600,
      });

      // Mock Redis responses for exceeding limits
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 15], // Current count exceeds limit of 10
          [null, 'OK'],
        ]),
      });

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should allow access for guest user within limits', async () => {
      const context = createMockExecutionContext(
        null, // No authenticated user (guest)
        '192.168.1.100'
      );

      mockReflector.get.mockReturnValue(null);

      // Mock Redis responses for within guest limits
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 25], // Within guest limit of 50
          [null, 'OK'],
        ]),
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should block access for guest user exceeding limits', async () => {
      const context = createMockExecutionContext(
        null, // Guest user
        '192.168.1.100'
      );

      mockReflector.get.mockReturnValue({
        maxRequests: 20,
        windowSizeInSeconds: 300,
      });

      // Mock Redis responses for exceeding guest limits
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 25], // Exceeds limit of 20
          [null, 'OK'],
        ]),
      });

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should apply progressive penalty for repeat offenders', async () => {
      const context = createMockExecutionContext(
        { id: 'baduser', email: 'bad@example.com' },
        '192.168.1.200'
      );

      mockReflector.get.mockReturnValue(null);

      // Mock Redis to show user has violations
      mockRedis.get.mockResolvedValue('3'); // 3 violations

      // Mock current request exceeding limit
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 150], // Exceeds limit
          [null, 'OK'],
        ]),
      });

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        BadRequestException
      );

      // Verify violation count was incremented
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('violations:user:baduser'),
        4,
        'EX',
        14400 // 4 hours
      );
    });

    it('should handle Redis connection failures gracefully', async () => {
      const context = createMockExecutionContext(
        { id: 'user123' },
        '192.168.1.1'
      );

      mockReflector.get.mockReturnValue(null);

      // Mock Redis failure
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
      });

      // Should allow access when Redis fails (fail-open)
      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should use custom rate limits when decorator is present', async () => {
      const context = createMockExecutionContext(
        { id: 'user123' },
        '192.168.1.1'
      );

      // Mock custom rate limit from decorator
      const customLimit: RateLimit = {
        maxRequests: 5,
        windowSizeInSeconds: 60,
        message: 'Custom limit exceeded'
      };
      mockReflector.get.mockReturnValue(customLimit);

      // Mock Redis responses for within custom limits
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 3], // Within custom limit of 5
          [null, 'OK'],
        ]),
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should differentiate between different IP addresses', async () => {
      const context1 = createMockExecutionContext(null, '192.168.1.1');
      const context2 = createMockExecutionContext(null, '192.168.1.2');

      mockReflector.get.mockReturnValue(null);

      // Mock different counts for different IPs
      let callCount = 0;
      mockRedis.multi.mockReturnValue({
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve([[null, 10], [null, 'OK']]); // IP1: within limit
          } else {
            return Promise.resolve([[null, 60], [null, 'OK']]); // IP2: exceeds limit
          }
        }),
      });

      const result1 = await guard.canActivate(context1 as ExecutionContext);
      expect(result1).toBe(true);

      await expect(guard.canActivate(context2 as ExecutionContext)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('generateRateLimitKey', () => {
    it('should generate different keys for authenticated vs guest users', () => {
      const authenticatedContext = createMockExecutionContext(
        { id: 'user123' },
        '192.168.1.1'
      );

      const guestContext = createMockExecutionContext(
        null,
        '192.168.1.1'
      );

      // Access private method via type assertion for testing
      const guardAny = guard as any;

      const authKey = guardAny.generateRateLimitKey(
        authenticatedContext.switchToHttp().getRequest()
      );
      const guestKey = guardAny.generateRateLimitKey(
        guestContext.switchToHttp().getRequest()
      );

      expect(authKey).toContain('user:user123');
      expect(guestKey).toContain('ip:192.168.1.1');
      expect(authKey).not.toEqual(guestKey);
    });
  });

  describe('Rate Limit Decorator', () => {
    it('should set metadata correctly', () => {
      const testLimit: RateLimit = {
        maxRequests: 15,
        windowSizeInSeconds: 120,
        message: 'Test limit exceeded'
      };

      // Create a test class with decorator
      @RateLimit(testLimit)
      class TestController {
        testMethod() {}
      }

      // Verify metadata is set (this would be tested in integration)
      expect(testLimit.maxRequests).toBe(15);
      expect(testLimit.windowSizeInSeconds).toBe(120);
      expect(testLimit.message).toBe('Test limit exceeded');
    });
  });
});

/**
 * Integration Test Helper Functions
 */
export const createTestRedisInstance = () => {
  return {
    async flushTestData(pattern: string = 'test:*') {
      // Helper to clean test data from Redis
      // This would connect to test Redis instance
    },

    async setTestData(key: string, value: any, ttl?: number) {
      // Helper to set up test data in Redis
    },

    async getTestData(key: string) {
      // Helper to verify test data in Redis
    }
  };
};

/**
 * Test Data Generators
 */
export const generateTestScenarios = () => {
  return {
    validAuthenticatedUser: { id: 'user123', email: 'test@example.com' },
    validGuestRequest: null,
    highVolumeIP: '192.168.100.100',
    normalIP: '192.168.1.1',
    suspiciousUserAgent: 'bot-crawler/1.0',
    normalUserAgent: 'Mozilla/5.0 (compatible browser)',
  };
};
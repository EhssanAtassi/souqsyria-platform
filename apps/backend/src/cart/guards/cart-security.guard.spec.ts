/**
 * @file cart-security.guard.spec.ts
 * @description Unit tests for Cart Security Guard (v3 - Week 3 ML-based)
 *
 * COVERAGE:
 * - Service orchestration (fraud detection, device fingerprint, threat response)
 * - Request allow/block based on threat response
 * - Fail-open error handling
 * - Security event logging
 * - Health check bypass
 *
 * @author SouqSyria Development Team
 * @version 3.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CartSecurityGuard } from './cart-security.guard';
import { AuditLogService } from '../../audit-log/service/audit-log.service';
import { CartFraudDetectionService } from '../services/cart-fraud-detection.service';
import { DeviceFingerprintService } from '../services/device-fingerprint.service';
import { ThreatResponseService } from '../services/threat-response.service';

/** Mock services */
const mockAuditLogService = {
  logSimple: jest.fn().mockResolvedValue(undefined),
  logDetailed: jest.fn().mockResolvedValue(undefined),
};

const mockFraudDetectionService = {
  assessFraudRisk: jest.fn().mockResolvedValue({
    riskScore: 0,
    riskLevel: 'low',
    shouldBlock: false,
    triggeredRules: [],
    details: {},
  }),
};

const mockDeviceFingerprintService = {
  generateFingerprint: jest.fn().mockReturnValue({
    fingerprintId: 'test-fp-123',
    trustScore: 100,
    isVirtualDevice: false,
    isBotLike: false,
  }),
  validateFingerprint: jest.fn().mockReturnValue({
    isValid: true,
    consistencyScore: 100,
  }),
};

const mockThreatResponseService = {
  executeResponse: jest.fn().mockResolvedValue({
    action: 'allow',
    reason: 'Low risk',
    escalationLevel: 0,
    notificationSent: false,
  }),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

/** Mock request factory */
const createMockRequest = (overrides: any = {}) => ({
  user: null,
  ip: '192.168.1.1',
  path: '/cart/items',
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'x-forwarded-for': undefined,
    'accept-language': 'ar-SY',
    'accept-encoding': 'gzip, deflate',
    ...overrides.headers,
  },
  body: {
    quantity: 1,
    price: 50000,
    ...overrides.body,
  },
  method: 'POST',
  route: { path: '/cart/items' },
  cookies: {},
  connection: { remoteAddress: overrides.ip || '192.168.1.1' },
  socket: { remoteAddress: overrides.ip || '192.168.1.1' },
  ...overrides,
});

/** Mock ExecutionContext factory */
const createMockExecutionContext = (requestOverrides: any = {}): Partial<ExecutionContext> => ({
  switchToHttp: () => ({
    getRequest: () => createMockRequest(requestOverrides),
    getResponse: () => ({}) as any,
    getNext: () => (() => {}) as any,
  }),
  getHandler: () => (() => {}) as Function,
  getClass: () => (class TestController {}) as any,
});

describe('CartSecurityGuard', () => {
  let guard: CartSecurityGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartSecurityGuard,
        { provide: Reflector, useValue: { get: jest.fn() } },
        { provide: 'default_IORedisModuleConnectionToken', useValue: mockRedis },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: CartFraudDetectionService, useValue: mockFraudDetectionService },
        { provide: DeviceFingerprintService, useValue: mockDeviceFingerprintService },
        { provide: ThreatResponseService, useValue: mockThreatResponseService },
      ],
    }).compile();

    guard = module.get<CartSecurityGuard>(CartSecurityGuard);
    jest.clearAllMocks();
  });

  describe('canActivate - Normal Operations', () => {
    it('should allow legitimate user cart operations', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user123', email: 'legitimate@example.com' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow guest user normal cart operations', async () => {
      const context = createMockExecutionContext({
        user: null,
        cookies: { guest_session_id: 'guest-session-456' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should call fraud detection service', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user123' },
      });

      await guard.canActivate(context as ExecutionContext);

      expect(mockFraudDetectionService.assessFraudRisk).toHaveBeenCalled();
    });

    it('should call device fingerprint service', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user123' },
      });

      await guard.canActivate(context as ExecutionContext);

      expect(mockDeviceFingerprintService.generateFingerprint).toHaveBeenCalled();
    });

    it('should call threat response service', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user123' },
      });

      await guard.canActivate(context as ExecutionContext);

      expect(mockThreatResponseService.executeResponse).toHaveBeenCalled();
    });
  });

  describe('Threat Response Actions', () => {
    it('should block access when threat response action is block', async () => {
      mockThreatResponseService.executeResponse.mockResolvedValue({
        action: 'block',
        reason: 'High risk detected',
        escalationLevel: 3,
        notificationSent: true,
      });

      mockFraudDetectionService.assessFraudRisk.mockResolvedValue({
        riskScore: 90,
        riskLevel: 'critical',
        shouldBlock: true,
        triggeredRules: ['velocity', 'price_tampering'],
        details: {},
      });

      const context = createMockExecutionContext({
        user: { id: 'malicious-user' },
      });

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow access with challenge action', async () => {
      mockThreatResponseService.executeResponse.mockResolvedValue({
        action: 'challenge',
        reason: 'Medium risk - CAPTCHA required',
        escalationLevel: 1,
        notificationSent: false,
      });

      const context = createMockExecutionContext({
        user: { id: 'suspect-user' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access with rate_limit action', async () => {
      mockThreatResponseService.executeResponse.mockResolvedValue({
        action: 'rate_limit',
        reason: 'High velocity detected',
        escalationLevel: 1,
        notificationSent: false,
      });

      const context = createMockExecutionContext({
        user: { id: 'fast-user' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access with log action', async () => {
      mockThreatResponseService.executeResponse.mockResolvedValue({
        action: 'log',
        reason: 'Slightly elevated risk',
        escalationLevel: 0,
        notificationSent: false,
      });

      const context = createMockExecutionContext({
        user: { id: 'watched-user' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle escalate action without blocking', async () => {
      mockThreatResponseService.executeResponse.mockResolvedValue({
        action: 'escalate',
        reason: 'Suspicious pattern requires manual review',
        escalationLevel: 4,
        notificationSent: true,
      });

      const context = createMockExecutionContext({
        user: { id: 'escalation-user' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events for medium+ risk', async () => {
      mockFraudDetectionService.assessFraudRisk.mockResolvedValue({
        riskScore: 55,
        riskLevel: 'medium',
        shouldBlock: false,
        triggeredRules: ['velocity'],
        details: {},
      });

      const context = createMockExecutionContext({
        user: { id: 'user123' },
      });

      await guard.canActivate(context as ExecutionContext);

      // Wait for async logging (non-blocking)
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ASSESSMENT',
          module: 'cart_security',
        }),
      );
    });

    it('should not log security events for low risk', async () => {
      mockFraudDetectionService.assessFraudRisk.mockResolvedValue({
        riskScore: 5,
        riskLevel: 'low',
        shouldBlock: false,
        triggeredRules: [],
        details: {},
      });

      const context = createMockExecutionContext({
        user: { id: 'safe-user' },
      });

      await guard.canActivate(context as ExecutionContext);

      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockAuditLogService.logSimple).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should fail open when fraud detection service fails', async () => {
      mockFraudDetectionService.assessFraudRisk.mockRejectedValue(
        new Error('Fraud service unavailable'),
      );

      const context = createMockExecutionContext({
        user: { id: 'test-user' },
      });

      // Should allow access in fail-open mode
      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should fail open when device fingerprint service fails', async () => {
      mockDeviceFingerprintService.generateFingerprint.mockImplementation(() => {
        throw new Error('Fingerprint service error');
      });

      const context = createMockExecutionContext({
        user: { id: 'test-user' },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle audit log failures gracefully', async () => {
      mockAuditLogService.logSimple.mockRejectedValue(new Error('Audit service down'));

      mockFraudDetectionService.assessFraudRisk.mockResolvedValue({
        riskScore: 50,
        riskLevel: 'medium',
        shouldBlock: false,
        triggeredRules: [],
        details: {},
      });

      const context = createMockExecutionContext({
        user: { id: 'test-user' },
      });

      // Should still succeed even if audit logging fails
      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('Health Check Bypass', () => {
    it('should skip security checks for health endpoints', async () => {
      const context = createMockExecutionContext({
        path: '/health',
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockFraudDetectionService.assessFraudRisk).not.toHaveBeenCalled();
    });

    it('should skip security checks for metrics endpoints', async () => {
      const context = createMockExecutionContext({
        path: '/metrics',
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockFraudDetectionService.assessFraudRisk).not.toHaveBeenCalled();
    });
  });
});

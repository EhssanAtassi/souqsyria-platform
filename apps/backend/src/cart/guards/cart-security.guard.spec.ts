/**
 * @file cart-security.guard.spec.ts
 * @description Unit tests for Cart Security Guard
 *
 * COVERAGE:
 * - Fraud detection algorithms and risk scoring
 * - Device fingerprint validation
 * - Velocity analysis and suspicious behavior detection
 * - Geolocation anomaly detection
 * - Progressive threat response system
 * - Security event logging and audit trail
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { CartSecurityGuard } from './cart-security.guard';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

// Mock AuditLogService
const mockAuditLogService = {
  logSimple: jest.fn().mockResolvedValue(undefined),
  logDetailed: jest.fn().mockResolvedValue(undefined),
};

// Mock Request objects for different test scenarios
const createMockRequest = (overrides: any = {}) => ({
  user: null,
  ip: '192.168.1.1',
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'x-forwarded-for': undefined,
    'cf-connecting-ip': undefined,
    ...overrides.headers,
  },
  body: {
    items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }],
    ...overrides.body,
  },
  method: 'POST',
  route: { path: '/cart' },
  cookies: {},
  deviceFingerprint: {
    screenResolution: '1920x1080',
    timezone: 'Asia/Damascus',
    language: 'ar-SY',
    platform: 'Win32',
    ...overrides.deviceFingerprint,
  },
  guestSessionId: 'test-session-123',
  ...overrides,
});

const createMockExecutionContext = (requestOverrides: any = {}): Partial<ExecutionContext> => ({
  switchToHttp: () => ({
    getRequest: () => createMockRequest(requestOverrides),
  }),
});

describe('CartSecurityGuard', () => {
  let guard: CartSecurityGuard;
  let auditLogService: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartSecurityGuard,
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    guard = module.get<CartSecurityGuard>(CartSecurityGuard);
    auditLogService = module.get<AuditLogService>(AuditLogService);

    // Reset all mocks and internal state
    jest.clearAllMocks();
    (guard as any).userActivityMap.clear();
    (guard as any).ipActivityMap.clear();
    (guard as any).deviceFingerprintMap.clear();
  });

  describe('canActivate - Normal Operations', () => {
    it('should allow legitimate user cart operations', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user123', email: 'legitimate@example.com' },
        ip: '192.168.1.100',
        body: { items: [{ variantId: 1, quantity: 2, priceAtAdd: 50000 }] },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).not.toHaveBeenCalled();
    });

    it('should allow guest user normal cart operations', async () => {
      const context = createMockExecutionContext({
        user: null,
        guestSessionId: 'guest-session-456',
        body: { items: [{ variantId: 2, quantity: 1, priceAtAdd: 75000 }] },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).not.toHaveBeenCalled();
    });

    it('should track user activity for pattern analysis', async () => {
      const context = createMockExecutionContext({
        user: { id: 'user123' },
        body: { items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }] },
      });

      await guard.canActivate(context as ExecutionContext);

      // Verify activity tracking (access private property for testing)
      const userActivityMap = (guard as any).userActivityMap;
      expect(userActivityMap.has('user123')).toBe(true);
      expect(userActivityMap.get('user123').length).toBe(1);
    });
  });

  describe('Fraud Detection - Velocity Analysis', () => {
    it('should detect rapid consecutive cart operations', async () => {
      const userId = 'rapid-user';
      const baseContext = createMockExecutionContext({
        user: { id: userId },
        body: { items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }] },
      });

      // Simulate rapid operations (more than 10 in 60 seconds)
      for (let i = 0; i < 12; i++) {
        if (i < 11) {
          await guard.canActivate(baseContext as ExecutionContext);
        } else {
          // 12th operation should trigger security alert
          const result = await guard.canActivate(baseContext as ExecutionContext);
          expect(result).toBe(true); // Still allow but log security event
          expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
            expect.objectContaining({
              action: 'SECURITY_ALERT_VELOCITY',
              entityType: 'cart_operation',
              description: expect.stringContaining('Rapid cart operations detected'),
            })
          );
        }
      }
    });

    it('should detect suspicious quantity patterns', async () => {
      const context = createMockExecutionContext({
        user: { id: 'quantity-abuser' },
        body: {
          items: [
            { variantId: 1, quantity: 999, priceAtAdd: 50000 }, // Suspicious high quantity
            { variantId: 2, quantity: 500, priceAtAdd: 75000 },
          ],
        },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_QUANTITY',
          description: expect.stringContaining('Suspicious quantity detected'),
        })
      );
    });
  });

  describe('Fraud Detection - Price Tampering', () => {
    it('should detect unrealistic price values', async () => {
      const context = createMockExecutionContext({
        user: { id: 'price-tamperer' },
        body: {
          items: [
            { variantId: 1, quantity: 1, priceAtAdd: 1 }, // Suspiciously low price
            { variantId: 2, quantity: 1, priceAtAdd: 50000000 }, // Suspiciously high price
          ],
        },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_PRICE',
          description: expect.stringContaining('Suspicious pricing detected'),
        })
      );
    });

    it('should allow normal price variations', async () => {
      const context = createMockExecutionContext({
        user: { id: 'normal-user' },
        body: {
          items: [
            { variantId: 1, quantity: 1, priceAtAdd: 25000 }, // Normal Syrian price range
            { variantId: 2, quantity: 2, priceAtAdd: 150000 },
          ],
        },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).not.toHaveBeenCalled();
    });
  });

  describe('Device Fingerprint Validation', () => {
    it('should detect device fingerprint anomalies', async () => {
      const userId = 'fingerprint-test';

      // First request with normal fingerprint
      const normalContext = createMockExecutionContext({
        user: { id: userId },
        deviceFingerprint: {
          screenResolution: '1920x1080',
          timezone: 'Asia/Damascus',
          language: 'ar-SY',
          platform: 'Win32',
        },
      });

      await guard.canActivate(normalContext as ExecutionContext);

      // Second request with completely different fingerprint (potential account takeover)
      const suspiciousContext = createMockExecutionContext({
        user: { id: userId },
        deviceFingerprint: {
          screenResolution: '800x600',
          timezone: 'America/New_York',
          language: 'en-US',
          platform: 'Linux',
        },
      });

      const result = await guard.canActivate(suspiciousContext as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_DEVICE',
          description: expect.stringContaining('Device fingerprint mismatch'),
        })
      );
    });

    it('should allow minor fingerprint variations', async () => {
      const userId = 'consistent-user';

      // First request
      const firstContext = createMockExecutionContext({
        user: { id: userId },
        deviceFingerprint: {
          screenResolution: '1920x1080',
          timezone: 'Asia/Damascus',
          language: 'ar-SY',
          platform: 'Win32',
        },
      });

      await guard.canActivate(firstContext as ExecutionContext);

      // Second request with minor variation (screen resolution change)
      const secondContext = createMockExecutionContext({
        user: { id: userId },
        deviceFingerprint: {
          screenResolution: '1920x1200', // Minor change
          timezone: 'Asia/Damascus',
          language: 'ar-SY',
          platform: 'Win32',
        },
      });

      const result = await guard.canActivate(secondContext as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).not.toHaveBeenCalled();
    });
  });

  describe('Geolocation Analysis', () => {
    it('should detect suspicious geolocation changes', async () => {
      const userId = 'geo-test-user';

      // First request from Syrian IP
      const syrianContext = createMockExecutionContext({
        user: { id: userId },
        ip: '46.164.160.0', // Syrian IP range
      });

      await guard.canActivate(syrianContext as ExecutionContext);

      // Second request from very different location (potential account compromise)
      const foreignContext = createMockExecutionContext({
        user: { id: userId },
        ip: '8.8.8.8', // US IP (Google DNS)
      });

      const result = await guard.canActivate(foreignContext as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_GEO',
          description: expect.stringContaining('Geolocation anomaly detected'),
        })
      );
    });
  });

  describe('Progressive Threat Response', () => {
    it('should escalate security response for repeat offenders', async () => {
      const suspiciousUserId = 'repeat-offender';

      // Generate multiple suspicious activities to trigger escalation
      const contexts = Array.from({ length: 5 }, (_, i) =>
        createMockExecutionContext({
          user: { id: suspiciousUserId },
          body: {
            items: [{ variantId: 1, quantity: 999, priceAtAdd: 1 }], // Suspicious pattern
          },
        })
      );

      let lastResult;
      for (const context of contexts) {
        lastResult = await guard.canActivate(context as ExecutionContext);
      }

      // Should still allow access but with high-severity alerts
      expect(lastResult).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: expect.stringContaining('HIGH_RISK'),
        })
      );
    });

    it('should block access for extreme threat levels', async () => {
      const maliciousUserId = 'extreme-threat';

      // Simulate extreme suspicious behavior to trigger blocking
      const extremeContext = createMockExecutionContext({
        user: { id: maliciousUserId },
        body: {
          items: Array.from({ length: 100 }, (_, i) => ({
            variantId: i + 1,
            quantity: 999,
            priceAtAdd: 1,
          })),
        },
      });

      // First, generate some history to make this user high-risk
      const guard_any = guard as any;
      guard_any.userSecurityScores.set(maliciousUserId, 85); // High risk score

      await expect(
        guard.canActivate(extremeContext as ExecutionContext)
      ).rejects.toThrow(ForbiddenException);

      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_BLOCK',
          description: expect.stringContaining('Access blocked due to high security risk'),
        })
      );
    });
  });

  describe('Bot and Automation Detection', () => {
    it('should detect bot-like user agents', async () => {
      const context = createMockExecutionContext({
        headers: {
          'user-agent': 'python-requests/2.28.1', // Bot-like user agent
        },
        body: { items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }] },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_BOT',
          description: expect.stringContaining('Bot-like user agent detected'),
        })
      );
    });

    it('should allow legitimate browser user agents', async () => {
      const context = createMockExecutionContext({
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        },
        body: { items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }] },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
      expect(mockAuditLogService.logSimple).not.toHaveBeenCalled();
    });
  });

  describe('IP Analysis', () => {
    it('should track IP-based suspicious activity', async () => {
      const suspiciousIP = '192.168.100.100';

      // Generate multiple requests from same IP with different users (potential attack)
      const contexts = Array.from({ length: 8 }, (_, i) =>
        createMockExecutionContext({
          user: { id: `user${i}` },
          ip: suspiciousIP,
          body: { items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }] },
        })
      );

      let lastResult;
      for (const context of contexts) {
        lastResult = await guard.canActivate(context as ExecutionContext);
      }

      expect(lastResult).toBe(true);
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SECURITY_ALERT_IP',
          description: expect.stringContaining('Suspicious IP activity'),
        })
      );
    });
  });

  describe('Risk Score Calculation', () => {
    it('should calculate accurate risk scores', () => {
      const guard_any = guard as any;

      // Test low-risk scenario
      const lowRiskScore = guard_any.calculateRiskScore({
        velocityViolations: 0,
        quantityAnomalies: 0,
        priceAnomalies: 0,
        deviceMismatch: false,
        geoAnomaly: false,
        botLikeAgent: false,
        ipSuspicious: false,
        userHistory: 0,
      });

      expect(lowRiskScore).toBeLessThan(30);

      // Test high-risk scenario
      const highRiskScore = guard_any.calculateRiskScore({
        velocityViolations: 3,
        quantityAnomalies: 2,
        priceAnomalies: 1,
        deviceMismatch: true,
        geoAnomaly: true,
        botLikeAgent: true,
        ipSuspicious: true,
        userHistory: 5,
      });

      expect(highRiskScore).toBeGreaterThan(70);
    });
  });

  describe('Error Handling', () => {
    it('should handle audit log service failures gracefully', async () => {
      mockAuditLogService.logSimple.mockRejectedValue(new Error('Audit service down'));

      const context = createMockExecutionContext({
        user: { id: 'test-user' },
        body: {
          items: [{ variantId: 1, quantity: 999, priceAtAdd: 50000 }], // Suspicious
        },
      });

      // Should still allow access even if audit logging fails
      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle missing device fingerprint gracefully', async () => {
      const context = createMockExecutionContext({
        user: { id: 'test-user' },
        deviceFingerprint: null, // Missing fingerprint
        body: { items: [{ variantId: 1, quantity: 1, priceAtAdd: 50000 }] },
      });

      const result = await guard.canActivate(context as ExecutionContext);

      expect(result).toBe(true);
    });
  });
});

/**
 * Integration Test Helpers
 */
export const securityTestScenarios = {
  legitimateUser: {
    user: { id: 'legit123', email: 'user@example.com' },
    ip: '192.168.1.100',
    normalBehavior: true,
    deviceFingerprint: {
      screenResolution: '1920x1080',
      timezone: 'Asia/Damascus',
      language: 'ar-SY',
    },
  },

  suspiciousUser: {
    user: { id: 'suspect456', email: 'suspicious@example.com' },
    ip: '10.0.0.100',
    rapidOperations: true,
    highQuantities: true,
    priceAnomalies: true,
  },

  botTraffic: {
    userAgent: 'python-requests/2.28.1',
    automatedBehavior: true,
    noDeviceFingerprint: true,
  },

  maliciousIP: {
    ip: '192.168.255.255',
    multipleUserAttempts: true,
    geolocationAnomalies: true,
  },
};
/**
 * @file session-cleanup.service.spec.ts
 * @description Unit tests for Guest Session Cleanup Service
 *
 * COVERAGE:
 * - Scheduled cleanup job execution
 * - Grace period enforcement (37-day retention)
 * - Soft delete with recovery options
 * - Cleanup statistics and metrics
 * - Error handling and monitoring
 * - Manual cleanup trigger functionality
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { SessionCleanupService } from './session-cleanup.service';
import { GuestSession } from '../../cart/entities/guest-session.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { AuditLogService } from '../../audit-log/service/audit-log.service';

// Mock repositories
const mockGuestSessionRepository = {
  find: jest.fn(),
  count: jest.fn(),
  manager: {
    transaction: jest.fn(),
  },
};

const mockCartRepository = {
  // Cart repository methods if needed
};

// Mock audit log service
const mockAuditLogService = {
  logSimple: jest.fn().mockResolvedValue(undefined),
};

// Test data generators
const createMockGuestSession = (overrides: Partial<GuestSession> = {}): GuestSession => {
  const baseSession = new GuestSession();
  baseSession.id = 'session-123';
  baseSession.sessionToken = 'mock-token-123';
  baseSession.status = 'active';
  baseSession.lastActivityAt = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days old
  baseSession.cart = createMockCart();
  baseSession.deviceFingerprint = { browser: 'Chrome', os: 'Windows' };

  return { ...baseSession, ...overrides };
};

const createMockCart = (itemCount: number = 2) => {
  const cart = {
    id: 'cart-123',
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${i}`,
      quantity: 1,
      price_at_add: 50000,
    })),
  };
  return cart;
};

describe('SessionCleanupService', () => {
  let service: SessionCleanupService;
  let guestSessionRepository: Repository<GuestSession>;
  let cartRepository: Repository<Cart>;
  let auditLogService: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionCleanupService,
        {
          provide: getRepositoryToken(GuestSession),
          useValue: mockGuestSessionRepository,
        },
        {
          provide: getRepositoryToken(Cart),
          useValue: mockCartRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<SessionCleanupService>(SessionCleanupService);
    guestSessionRepository = module.get<Repository<GuestSession>>(getRepositoryToken(GuestSession));
    cartRepository = module.get<Repository<Cart>>(getRepositoryToken(Cart));
    auditLogService = module.get<AuditLogService>(AuditLogService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Scheduled Cleanup Job', () => {
    it('should execute scheduled cleanup successfully', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({ id: 'session-1' }),
        createMockGuestSession({ id: 'session-2' }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      // Mock transaction manager
      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      await service.runScheduledCleanup();

      expect(mockGuestSessionRepository.find).toHaveBeenCalled();
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLEANUP_COMPLETED',
          module: 'guest_sessions',
        })
      );
    });

    it('should handle cleanup job failures gracefully', async () => {
      mockGuestSessionRepository.find.mockRejectedValue(new Error('Database error'));

      await service.runScheduledCleanup();

      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLEANUP_JOB_FAILED',
          description: expect.stringContaining('Database error'),
        })
      );
    });

    it('should log comprehensive cleanup results', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({
          id: 'session-1',
          cart: createMockCart(3), // 3 cart items
        }),
        createMockGuestSession({
          id: 'session-2',
          cart: createMockCart(2), // 2 cart items
        }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      await service.runScheduledCleanup();

      // Verify comprehensive logging occurred
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLEANUP_COMPLETED',
          description: expect.stringContaining('2 sessions'),
        })
      );
    });
  });

  describe('Manual Cleanup Execution', () => {
    it('should cleanup expired sessions beyond grace period', async () => {
      const now = new Date();
      const gracePeriodExpiryDate = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);

      const mockExpiredSessions = [
        createMockGuestSession({
          id: 'old-session-1',
          lastActivityAt: new Date(gracePeriodExpiryDate.getTime() - 24 * 60 * 60 * 1000), // 1 day beyond grace period
          cart: createMockCart(2),
        }),
        createMockGuestSession({
          id: 'old-session-2',
          lastActivityAt: new Date(gracePeriodExpiryDate.getTime() - 48 * 60 * 60 * 1000), // 2 days beyond grace period
          cart: createMockCart(1),
        }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      const stats = await service.cleanupExpiredSessions();

      expect(stats.totalProcessed).toBe(2);
      expect(stats.sessionsDeleted).toBe(2);
      expect(stats.cartsDeleted).toBe(2);
      expect(stats.cartItemsDeleted).toBe(3); // 2 + 1 items
      expect(stats.estimatedSpaceFreed).toBeGreaterThan(0);
      expect(stats.errors).toEqual([]);
    });

    it('should not cleanup sessions within grace period', async () => {
      const now = new Date();
      const withinGracePeriod = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days (within 37-day grace period)

      const mockRecentSessions = [
        createMockGuestSession({
          id: 'recent-session',
          lastActivityAt: withinGracePeriod,
        }),
      ];

      // Mock should return empty array for sessions beyond grace period
      mockGuestSessionRepository.find.mockResolvedValue([]);

      const stats = await service.cleanupExpiredSessions();

      expect(stats.totalProcessed).toBe(0);
      expect(stats.sessionsDeleted).toBe(0);
    });

    it('should perform dry run without making changes', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({ id: 'session-1', cart: createMockCart(2) }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      const stats = await service.cleanupExpiredSessions(true); // Dry run

      expect(stats.totalProcessed).toBe(1);
      expect(stats.sessionsDeleted).toBe(1);
      expect(stats.cartItemsDeleted).toBe(2);

      // Verify no actual deletion occurred
      expect(mockGuestSessionRepository.manager.transaction).not.toHaveBeenCalled();
      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLEANUP_SIMULATION',
        })
      );
    });

    it('should handle individual session processing errors gracefully', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({ id: 'good-session', cart: createMockCart(1) }),
        createMockGuestSession({ id: 'bad-session', cart: null }), // Problematic session
        createMockGuestSession({ id: 'another-good-session', cart: createMockCart(2) }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      // Mock transaction to succeed overall
      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      const stats = await service.cleanupExpiredSessions();

      expect(stats.totalProcessed).toBe(3);
      expect(stats.sessionsDeleted).toBe(3);
      expect(stats.errors.length).toBe(0); // Should handle gracefully
    });
  });

  describe('Cleanup Statistics', () => {
    it('should calculate accurate cleanup statistics', async () => {
      const mockSessions = [
        createMockGuestSession({
          id: 'session-1',
          status: 'active',
          cart: createMockCart(3),
          deviceFingerprint: { browser: 'Chrome', screenResolution: '1920x1080' },
        }),
        createMockGuestSession({
          id: 'session-2',
          status: 'converted',
          cart: createMockCart(1),
          deviceFingerprint: { browser: 'Firefox', screenResolution: '1366x768' },
        }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockSessions);

      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      const stats = await service.cleanupExpiredSessions();

      expect(stats.totalProcessed).toBe(2);
      expect(stats.sessionsDeleted).toBe(2);
      expect(stats.cartsDeleted).toBe(2);
      expect(stats.cartItemsDeleted).toBe(4); // 3 + 1
      expect(stats.convertedSessionsCleaned).toBe(1);
      expect(stats.recoverableExpired).toBe(1);
      expect(stats.estimatedSpaceFreed).toBeGreaterThan(0);
      expect(stats.processingTimeMs).toBeGreaterThan(0);
    });

    it('should return empty statistics when no expired sessions found', async () => {
      mockGuestSessionRepository.find.mockResolvedValue([]);

      const stats = await service.cleanupExpiredSessions();

      expect(stats.totalProcessed).toBe(0);
      expect(stats.sessionsDeleted).toBe(0);
      expect(stats.cartsDeleted).toBe(0);
      expect(stats.cartItemsDeleted).toBe(0);
      expect(stats.estimatedSpaceFreed).toBe(0);
      expect(stats.errors).toEqual([]);
    });
  });

  describe('Space Estimation', () => {
    it('should estimate space freed accurately', async () => {
      const service_any = service as any;

      // Test session with cart and items
      const sessionWithCart = createMockGuestSession({
        cart: createMockCart(5),
        deviceFingerprint: {
          browser: 'Chrome',
          screenResolution: '1920x1080',
          additionalData: 'some extra fingerprint data'
        },
      });

      const estimatedSize = service_any.estimateSessionDataSize(sessionWithCart);

      expect(estimatedSize).toBeGreaterThan(500); // Base session size
      expect(estimatedSize).toBeGreaterThan(700); // Should include cart and items
    });

    it('should handle sessions without carts', async () => {
      const service_any = service as any;

      const sessionWithoutCart = createMockGuestSession({
        cart: null,
        deviceFingerprint: null,
      });

      const estimatedSize = service_any.estimateSessionDataSize(sessionWithoutCart);

      expect(estimatedSize).toBe(500); // Only base session size
    });
  });

  describe('Cleanup Statistics API', () => {
    it('should return current cleanup statistics', async () => {
      // Mock various counts
      mockGuestSessionRepository.count
        .mockResolvedValueOnce(150) // activeSessions
        .mockResolvedValueOnce(25)  // expiredSessions
        .mockResolvedValueOnce(10)  // sessionsInGracePeriod
        .mockResolvedValueOnce(50)  // convertedSessions
        .mockResolvedValueOnce(235) // totalSessions
        .mockResolvedValueOnce(5);  // estimatedCleanupCandidates

      const stats = await service.getCleanupStatistics();

      expect(stats.activeSessions).toBe(150);
      expect(stats.expiredSessions).toBe(25);
      expect(stats.sessionsInGracePeriod).toBe(10);
      expect(stats.convertedSessions).toBe(50);
      expect(stats.totalSessions).toBe(235);
      expect(stats.estimatedCleanupCandidates).toBe(5);
    });
  });

  describe('Byte Formatting', () => {
    it('should format bytes correctly', () => {
      const service_any = service as any;

      expect(service_any.formatBytes(0)).toBe('0 Bytes');
      expect(service_any.formatBytes(1024)).toBe('1 KB');
      expect(service_any.formatBytes(1048576)).toBe('1 MB');
      expect(service_any.formatBytes(1073741824)).toBe('1 GB');
      expect(service_any.formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('Database Transaction Handling', () => {
    it('should handle database transaction failures', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({ id: 'session-1' }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      // Mock transaction failure
      mockGuestSessionRepository.manager.transaction.mockRejectedValue(
        new Error('Transaction failed')
      );

      await expect(service.cleanupExpiredSessions()).rejects.toThrow('Transaction failed');
    });

    it('should execute cleanup in proper transaction order', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({
          id: 'session-1',
          cart: { id: 'cart-1', items: [{ id: 'item-1' }] },
        }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      const deleteCallOrder: string[] = [];
      const mockTransactionManager = {
        delete: jest.fn().mockImplementation((entity, criteria) => {
          if (entity.name === 'Cart') {
            deleteCallOrder.push('cart');
          } else if (entity.name === 'GuestSession') {
            deleteCallOrder.push('session');
          }
          return Promise.resolve({ affected: 1 });
        }),
      };

      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      await service.cleanupExpiredSessions();

      // Verify carts are deleted before sessions
      expect(deleteCallOrder).toEqual(['cart', 'session']);
    });
  });

  describe('Audit Logging', () => {
    it('should log cleanup operations for audit trail', async () => {
      const mockExpiredSessions = [
        createMockGuestSession({ id: 'session-1' }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      await service.cleanupExpiredSessions();

      expect(mockAuditLogService.logSimple).toHaveBeenCalledWith({
        action: 'CLEANUP_COMPLETED',
        module: 'guest_sessions',
        actorId: null,
        actorType: 'system',
        entityType: 'cleanup_operation',
        entityId: null,
        description: expect.stringContaining('Guest session cleanup'),
      });
    });

    it('should handle audit log failures without affecting cleanup', async () => {
      mockAuditLogService.logSimple.mockRejectedValue(new Error('Audit service down'));

      const mockExpiredSessions = [
        createMockGuestSession({ id: 'session-1' }),
      ];

      mockGuestSessionRepository.find.mockResolvedValue(mockExpiredSessions);

      const mockTransactionManager = {
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      mockGuestSessionRepository.manager.transaction.mockImplementation(
        async (callback) => callback(mockTransactionManager)
      );

      // Should complete successfully even if audit logging fails
      const stats = await service.cleanupExpiredSessions();

      expect(stats.sessionsDeleted).toBe(1);
    });
  });
});

/**
 * Integration Test Helpers
 */
export const cleanupTestScenarios = {
  // Session that should be cleaned (beyond grace period)
  expiredSession: {
    lastActivityAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days old
    status: 'active',
    cartItemCount: 3,
  },

  // Session within grace period (should not be cleaned)
  gracePeriodSession: {
    lastActivityAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days old
    status: 'active',
    cartItemCount: 2,
  },

  // Converted session (should be cleaned immediately)
  convertedSession: {
    lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days old
    status: 'converted',
    cartItemCount: 5,
  },

  // Edge case: session exactly at grace period boundary
  boundarySession: {
    lastActivityAt: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000), // Exactly 37 days
    status: 'expired',
    cartItemCount: 1,
  },
};
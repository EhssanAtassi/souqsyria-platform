/**
 * @file guest-session.service.spec.ts
 * @description Unit Tests for GuestSessionService
 *
 * TEST COVERAGE:
 * - Session creation with metadata
 * - Session retrieval and validation
 * - Session expiration handling
 * - Grace period recovery
 * - Cart association
 * - User conversion
 * - Cleanup cron job
 *
 * MOCKING STRATEGY:
 * - Mock GuestSession repository
 * - Mock entity methods (isExpired, isInGracePeriod)
 * - Test business logic in isolation
 *
 * TARGET COVERAGE: >80%
 *
 * @author SouqSyria Development Team
 * @since 2026-02-15
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GuestSessionService } from './guest-session.service';
import { GuestSession } from '../../cart/entities/guest-session.entity';

/**
 * Mock GuestSession repository type
 */
type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

/**
 * Create mock repository with common methods
 */
const createMockRepository = (): MockRepository<GuestSession> => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let repository: MockRepository<GuestSession>;

  /**
   * Setup test module before each test
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestSessionService,
        {
          provide: getRepositoryToken(GuestSession),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<GuestSessionService>(GuestSessionService);
    repository = module.get<MockRepository<GuestSession>>(
      getRepositoryToken(GuestSession),
    );
  });

  /**
   * Clear all mocks after each test
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Service Initialization Tests
   */
  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have repository injected', () => {
      expect(repository).toBeDefined();
    });
  });

  /**
   * Session Creation Tests
   */
  describe('createSession', () => {
    it('should create a new guest session with default metadata', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        sessionToken: 'hashed-token',
        deviceFingerprint: {},
        status: 'active',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as GuestSession;

      repository.create.mockReturnValue(mockSession);
      repository.save.mockResolvedValue(mockSession);

      // Act
      const result = await service.createSession({});

      // Assert
      expect(repository.create).toHaveBeenCalledWith({
        deviceFingerprint: {},
        status: 'active',
      });
      expect(repository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });

    it('should create session with custom metadata', async () => {
      // Arrange
      const metadata = {
        userAgent: 'Mozilla/5.0',
        platform: 'Win32',
        language: 'en-US',
      };

      const mockSession = {
        id: 'test-uuid',
        deviceFingerprint: metadata,
        status: 'active',
      } as GuestSession;

      repository.create.mockReturnValue(mockSession);
      repository.save.mockResolvedValue(mockSession);

      // Act
      await service.createSession({ metadata });

      // Assert
      expect(repository.create).toHaveBeenCalledWith({
        deviceFingerprint: metadata,
        status: 'active',
      });
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      repository.create.mockReturnValue({} as GuestSession);
      repository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.createSession({})).rejects.toThrow('Database error');
    });
  });

  /**
   * Session Retrieval Tests
   */
  describe('getSession', () => {
    it('should retrieve valid session', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        sessionToken: 'hashed-token',
        status: 'active',
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSession('test-uuid');

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid' },
        relations: ['cart'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null for non-existent session', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.getSession('non-existent-uuid');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for expired session outside grace period', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        status: 'expired',
        expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        isExpired: jest.fn().mockReturnValue(true),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSession('test-uuid');

      // Assert
      expect(result).toBeNull();
    });

    it('should return session within grace period', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        status: 'expired',
        expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        isExpired: jest.fn().mockReturnValue(true),
        isInGracePeriod: jest.fn().mockReturnValue(true), // Within 7-day grace period
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);

      // Act
      const result = await service.getSession('test-uuid');

      // Assert
      expect(result).toEqual(mockSession);
    });
  });

  /**
   * Session Validation Tests
   */
  describe('validateSession', () => {
    it('should validate and return session summary', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        sessionToken: 'hashed-token',
        status: 'active',
        expiresAt: new Date(),
        lastActivityAt: new Date(),
        ipAddress: '192.168.1.1',
        cart: null,
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
        getSummary: jest.fn().mockReturnValue({
          id: 'test-uuid',
          sessionToken: 'hashed-token',
          status: 'active',
          isExpired: false,
          isInGracePeriod: false,
          lastActivity: new Date(),
          expiresAt: new Date(),
          ipAddress: '192.168.1.1',
          hasCart: false,
        }),
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);

      // Act
      const result = await service.validateSession('test-uuid');

      // Assert
      expect(result).toHaveProperty('id', 'test-uuid');
      expect(result).toHaveProperty('status', 'active');
      expect(result).toHaveProperty('isExpired', false);
      expect(mockSession.getSummary).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing session', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateSession('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * Cart Association Tests
   */
  describe('associateCart', () => {
    it('should associate cart with valid session', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);

      // Act
      await service.associateCart('test-uuid', 123);

      // Assert
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid' },
        relations: ['cart'],
      });
    });

    it('should throw NotFoundException for expired session', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.associateCart('expired-uuid', 123)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * User Conversion Tests
   */
  describe('convertToUser', () => {
    it('should convert guest session to user', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        status: 'active',
        markAsConverted: jest.fn(),
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue({
        ...mockSession,
        status: 'converted',
        convertedUserId: 456,
      });

      // Act
      const result = await service.convertToUser('test-uuid', 456);

      // Assert
      expect(mockSession.markAsConverted).toHaveBeenCalledWith(456);
      expect(repository.save).toHaveBeenCalled();
      expect(result.convertedUserId).toBe(456);
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.convertToUser('non-existent', 456)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * Activity Refresh Tests
   */
  describe('refreshActivity', () => {
    it('should refresh session activity and expiration', async () => {
      // Arrange
      const mockSession = {
        id: 'test-uuid',
        refreshExpiration: jest.fn(),
      } as unknown as GuestSession;

      repository.findOne.mockResolvedValue(mockSession);
      repository.save.mockResolvedValue(mockSession);

      // Act
      await service.refreshActivity('test-uuid');

      // Assert
      expect(mockSession.refreshExpiration).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockSession);
    });

    it('should throw NotFoundException if session not found', async () => {
      // Arrange
      repository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.refreshActivity('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /**
   * Cleanup Cron Job Tests
   */
  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions outside grace period', async () => {
      // Arrange
      repository.delete.mockResolvedValue({ affected: 5 } as any);

      // Act
      await service.cleanupExpiredSessions();

      // Assert
      expect(repository.delete).toHaveBeenCalled();
      const deleteCall = repository.delete.mock.calls[0][0];
      expect(deleteCall).toHaveProperty('status', 'expired');
      expect(deleteCall.expiresAt).toBeDefined();
    });

    it('should handle cleanup with no expired sessions', async () => {
      // Arrange
      repository.delete.mockResolvedValue({ affected: 0 } as any);

      // Act & Assert (should not throw)
      await expect(service.cleanupExpiredSessions()).resolves.not.toThrow();
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      repository.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert (should not throw - errors are logged)
      await expect(service.cleanupExpiredSessions()).resolves.not.toThrow();
    });
  });
});

/**
 * @file guest-session.service.spec.ts
 * @description Unit tests for GuestSessionService (SS-AUTH-009)
 *
 * TEST COVERAGE:
 * - Session creation with UUID generation
 * - Session retrieval by UUID and token
 * - Session expiration validation
 * - Grace period recovery
 * - Cart association
 * - Session refresh (sliding window)
 * - User conversion
 * - Scheduled cleanup of expired sessions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GuestSessionService } from './guest-session.service';
import { GuestSession } from '../../cart/entities/guest-session.entity';
import { CreateGuestSessionDto } from '../dto/guest-session.dto';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
  let repository: Repository<GuestSession>;

  // Mock repository
  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestSessionService,
        {
          provide: getRepositoryToken(GuestSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GuestSessionService>(GuestSessionService);
    repository = module.get<Repository<GuestSession>>(getRepositoryToken(GuestSession));

    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new guest session with default values', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionToken: 'a3f5b2c1d4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
        status: 'active',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as GuestSession;

      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession();

      expect(repository.create).toHaveBeenCalledWith({
        ipAddress: undefined,
        deviceFingerprint: undefined,
        status: 'active',
      });
      expect(repository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });

    it('should create session with provided metadata', async () => {
      const createDto: CreateGuestSessionDto = {
        ipAddress: '192.168.1.100',
        deviceFingerprint: {
          userAgent: 'Mozilla/5.0',
          platform: 'macOS',
          language: 'en-US',
        },
      };

      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionToken: 'a3f5b2c1d4e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
        status: 'active',
        ipAddress: createDto.ipAddress,
        deviceFingerprint: createDto.deviceFingerprint,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      } as GuestSession;

      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession(createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ipAddress: createDto.ipAddress,
        deviceFingerprint: createDto.deviceFingerprint,
        status: 'active',
      });
      expect(result.ipAddress).toBe(createDto.ipAddress);
      expect(result.deviceFingerprint).toEqual(createDto.deviceFingerprint);
    });
  });

  describe('getSession', () => {
    it('should return a valid active session', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionToken: 'abc123',
        status: 'active',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.getSession('550e8400-e29b-41d4-a716-446655440000');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440000' },
        relations: ['cart'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getSession('invalid-uuid')).rejects.toThrow(NotFoundException);
      await expect(service.getSession('invalid-uuid')).rejects.toThrow('Guest session not found');
    });

    it('should throw BadRequestException if session expired beyond grace period', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        isExpired: jest.fn().mockReturnValue(true),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue({ ...mockSession, status: 'expired' });

      await expect(service.getSession('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getSession('550e8400-e29b-41d4-a716-446655440000')).rejects.toThrow(
        'Guest session has expired',
      );

      expect(mockSession.status).toBe('expired');
    });

    it('should recover session if within grace period', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'expired',
        isExpired: jest.fn().mockReturnValue(true),
        isInGracePeriod: jest.fn().mockReturnValue(true),
        refreshExpiration: jest.fn(),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.getSession('550e8400-e29b-41d4-a716-446655440000');

      expect(mockSession.refreshExpiration).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });
  });

  describe('getSessionByToken', () => {
    it('should return session by token hash', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionToken: 'abc123token',
        status: 'active',
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.getSessionByToken('abc123token');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { sessionToken: 'abc123token' },
        relations: ['cart'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw NotFoundException if token not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getSessionByToken('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('associateCart', () => {
    it('should associate cart with session', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.associateCart('550e8400-e29b-41d4-a716-446655440000', 789);

      expect(result).toEqual(mockSession);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session expiration', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        lastActivityAt: new Date('2026-01-01'),
        expiresAt: new Date('2026-01-31'),
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
        refreshExpiration: jest.fn(),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.refreshSession('550e8400-e29b-41d4-a716-446655440000');

      expect(mockSession.refreshExpiration).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });
  });

  describe('convertToUser', () => {
    it('should convert guest session to user account', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
        markAsConverted: jest.fn(),
      } as unknown as GuestSession;

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue({
        ...mockSession,
        status: 'converted',
        convertedUserId: 12345,
      });

      const result = await service.convertToUser('550e8400-e29b-41d4-a716-446655440000', 12345);

      expect(mockSession.markAsConverted).toHaveBeenCalledWith(12345);
      expect(repository.save).toHaveBeenCalledWith(mockSession);
    });
  });

  describe('updateDeviceFingerprint', () => {
    it('should update device fingerprint', async () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'active',
        deviceFingerprint: { userAgent: 'old' },
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      const newFingerprint = {
        userAgent: 'Mozilla/5.0',
        platform: 'macOS',
      };

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.save.mockResolvedValue({
        ...mockSession,
        deviceFingerprint: newFingerprint,
      });

      const result = await service.updateDeviceFingerprint(
        '550e8400-e29b-41d4-a716-446655440000',
        newFingerprint,
      );

      expect(mockSession.deviceFingerprint).toEqual(newFingerprint);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions beyond grace period', async () => {
      const expiredSession1 = {
        id: 'expired-1',
        status: 'expired',
        expiresAt: new Date('2025-01-01'),
      } as GuestSession;

      const expiredSession2 = {
        id: 'expired-2',
        status: 'active',
        expiresAt: new Date('2025-01-05'),
      } as GuestSession;

      mockRepository.find.mockResolvedValue([expiredSession1, expiredSession2]);
      mockRepository.delete.mockResolvedValue({ affected: 2 });

      const result = await service.cleanupExpiredSessions();

      expect(repository.find).toHaveBeenCalled();
      expect(repository.delete).toHaveBeenCalledWith(['expired-1', 'expired-2']);
      expect(result).toBe(2);
    });

    it('should return 0 if no expired sessions found', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.cleanupExpiredSessions();

      expect(repository.find).toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });

  describe('mapToDto', () => {
    it('should map entity to DTO correctly', () => {
      const mockSession = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionToken: 'abc123',
        status: 'active',
        lastActivityAt: new Date('2026-02-15'),
        expiresAt: new Date('2026-03-17'),
        ipAddress: '192.168.1.100',
        deviceFingerprint: { userAgent: 'Mozilla/5.0' },
        convertedUserId: undefined,
        cart: null,
        isExpired: jest.fn().mockReturnValue(false),
        isInGracePeriod: jest.fn().mockReturnValue(false),
      } as unknown as GuestSession;

      const dto = service.mapToDto(mockSession);

      expect(dto).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        sessionToken: 'abc123',
        status: 'active',
        isExpired: false,
        isInGracePeriod: false,
        lastActivityAt: new Date('2026-02-15'),
        expiresAt: new Date('2026-03-17'),
        ipAddress: '192.168.1.100',
        deviceFingerprint: { userAgent: 'Mozilla/5.0' },
        hasCart: false,
        convertedUserId: undefined,
      });
    });
  });
});

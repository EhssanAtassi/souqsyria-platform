/**
 * @file user-management.service.spec.ts
 * @description Comprehensive unit tests for UserManagementService.
 *
 * This test suite covers:
 * - User querying with pagination and filters
 * - User profile updates
 * - Role assignment
 * - Ban/unban operations
 * - Suspend/unsuspend operations
 * - Password resets
 * - Self-protection rules
 * - Error handling
 *
 * Testing Strategy:
 * - Unit tests with mocked dependencies
 * - Covers happy paths and edge cases
 * - Validates security rules
 * - Tests audit logging integration
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserManagementService } from '../user-management.service';
import { User } from '../../../users/entities/user.entity';
import { Role } from '../../../roles/entities/role.entity';
import { SecurityAuditService } from '../../../access-control/security-audit/security-audit.service';
import { SecurityAuditLog } from '../../../access-control/entities/security-audit-log.entity';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let securityAuditService: SecurityAuditService;

  // Mock data
  const mockUser: Partial<User> = {
    id: 1,
    email: 'test@example.com',
    fullName: 'Test User',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    role: {
      id: 1,
      name: 'buyer',
      description: 'Regular buyer',
      isDefault: false,
      type: 'business',
      rolePermissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Role,
    assignedRole: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRole: Partial<Role> = {
    id: 2,
    name: 'vendor',
    description: 'Product seller',
    isDefault: false,
    type: 'business',
    rolePermissions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdmin: Partial<User> = {
    id: 100,
    email: 'admin@example.com',
    fullName: 'Admin User',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
  };

  // Mock repositories
  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockSecurityAuditService = {
    logPermissionCheck: jest.fn(),
    getSecurityEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: SecurityAuditService,
          useValue: mockSecurityAuditService,
        },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    securityAuditService = module.get<SecurityAuditService>(SecurityAuditService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneWithDetails', () => {
    it('should return user with details when user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOneWithDetails(1);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
          assignedRole: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneWithDetails(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOneWithDetails(999)).rejects.toThrow('User with ID 999 not found');
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity logs', async () => {
      const mockLogs: Partial<SecurityAuditLog>[] = [
        {
          id: 1,
          userId: 1,
          action: 'ACCESS_GRANTED' as any,
          success: true,
          createdAt: new Date(),
        } as SecurityAuditLog,
      ];

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockSecurityAuditService.getSecurityEvents.mockResolvedValue({
        logs: mockLogs,
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });

      const result = await service.getUserActivity(1, 50);

      expect(result).toEqual(mockLogs);
      expect(mockSecurityAuditService.getSecurityEvents).toHaveBeenCalledWith({
        userId: 1,
        limit: 50,
        page: 1,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user profile successfully', async () => {
      const updateDto = { email: 'newemail@example.com', isVerified: true };
      const updatedUser = { ...mockUser, ...updateDto };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // findOneWithDetails call
        .mockResolvedValueOnce(null); // email uniqueness check
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, updateDto, 100);

      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent user from modifying own ban status', async () => {
      const updateDto = { isBanned: true };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.updateUser(1, updateDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.updateUser(1, updateDto, 1)).rejects.toThrow(
        'Cannot modify your own ban or suspension status',
      );
    });

    it('should throw error if email is already taken', async () => {
      const updateDto = { email: 'existing@example.com' };
      const existingUser = { ...mockUser, id: 2, email: 'existing@example.com' };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser) // findOneWithDetails call
        .mockResolvedValueOnce(existingUser); // email uniqueness check

      await expect(service.updateUser(1, updateDto, 100)).rejects.toThrow(BadRequestException);
      await expect(service.updateUser(1, updateDto, 100)).rejects.toThrow(
        'Email address is already in use',
      );
    });
  });

  describe('assignRoles', () => {
    it('should assign business role successfully', async () => {
      const assignDto = { roleId: 2 };
      const updatedUser = { ...mockUser, role: mockRole as Role };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.assignRoles(1, assignDto, 100);

      expect(result).toEqual(updatedUser);
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should throw error when role does not exist', async () => {
      const assignDto = { roleId: 999 };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignRoles(1, assignDto, 100)).rejects.toThrow(NotFoundException);
      await expect(service.assignRoles(1, assignDto, 100)).rejects.toThrow(
        'Role with ID 999 not found',
      );
    });

    it('should prevent removing own admin role', async () => {
      const adminUser = {
        ...mockUser,
        id: 100,
        assignedRole: { id: 5, name: 'admin' } as Role,
      };
      const assignDto = { assignedRoleId: 2 }; // Trying to change to non-admin role

      mockUserRepository.findOne.mockResolvedValue(adminUser);

      await expect(service.assignRoles(100, assignDto, 100)).rejects.toThrow(BadRequestException);
      await expect(service.assignRoles(100, assignDto, 100)).rejects.toThrow(
        'Cannot remove your own admin role',
      );
    });
  });

  describe('banUser', () => {
    it('should ban user successfully', async () => {
      const banDto = { reason: 'Violated terms of service' };
      const bannedUser = { ...mockUser, isBanned: true, banReason: banDto.reason };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(bannedUser);

      await service.banUser(1, banDto, 100);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isBanned: true,
          banReason: banDto.reason,
        }),
      );
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent user from banning themselves', async () => {
      const banDto = { reason: 'Test ban' };

      await expect(service.banUser(1, banDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.banUser(1, banDto, 1)).rejects.toThrow('Cannot ban yourself');
    });
  });

  describe('unbanUser', () => {
    it('should unban user successfully', async () => {
      const bannedUser = { ...mockUser, isBanned: true, banReason: 'Previous violation' };
      const unbannedUser = { ...bannedUser, isBanned: false, banReason: null };

      mockUserRepository.findOne.mockResolvedValue(bannedUser);
      mockUserRepository.save.mockResolvedValue(unbannedUser);

      await service.unbanUser(1, 100);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isBanned: false,
          banReason: null,
        }),
      );
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should throw error if user is not banned', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser); // isBanned = false

      await expect(service.unbanUser(1, 100)).rejects.toThrow(BadRequestException);
      await expect(service.unbanUser(1, 100)).rejects.toThrow('User is not banned');
    });
  });

  describe('suspendUser', () => {
    it('should suspend user with duration', async () => {
      const suspendDto = { reason: 'Pending investigation', duration: 7 };
      const suspendedUser = {
        ...mockUser,
        isSuspended: true,
        banReason: suspendDto.reason,
        bannedUntil: expect.any(Date),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(suspendedUser);

      await service.suspendUser(1, suspendDto, 100);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isSuspended: true,
          banReason: suspendDto.reason,
          bannedUntil: expect.any(Date),
        }),
      );
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should suspend user indefinitely when duration not provided', async () => {
      const suspendDto = { reason: 'Indefinite suspension' };
      const suspendedUser = {
        ...mockUser,
        isSuspended: true,
        banReason: suspendDto.reason,
        bannedUntil: null,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(suspendedUser);

      await service.suspendUser(1, suspendDto, 100);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isSuspended: true,
          banReason: suspendDto.reason,
          bannedUntil: null,
        }),
      );
    });

    it('should prevent user from suspending themselves', async () => {
      const suspendDto = { reason: 'Test suspension' };

      await expect(service.suspendUser(1, suspendDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.suspendUser(1, suspendDto, 1)).rejects.toThrow('Cannot suspend yourself');
    });
  });

  describe('unsuspendUser', () => {
    it('should unsuspend user successfully', async () => {
      const suspendedUser = {
        ...mockUser,
        isSuspended: true,
        banReason: 'Previous suspension',
        bannedUntil: new Date(),
      };
      const unsuspendedUser = {
        ...suspendedUser,
        isSuspended: false,
        banReason: null,
        bannedUntil: null,
      };

      mockUserRepository.findOne.mockResolvedValue(suspendedUser);
      mockUserRepository.save.mockResolvedValue(unsuspendedUser);

      await service.unsuspendUser(1, 100);

      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isSuspended: false,
          banReason: null,
          bannedUntil: null,
        }),
      );
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should throw error if user is not suspended', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser); // isSuspended = false

      await expect(service.unsuspendUser(1, 100)).rejects.toThrow(BadRequestException);
      await expect(service.unsuspendUser(1, 100)).rejects.toThrow('User is not suspended');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetDto = { newPassword: 'NewP@ssw0rd123!' };
      const hashedPassword = 'hashed_password_here';

      // Mock bcrypt.hash
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword) as any);

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
        passwordChangedAt: expect.any(Date),
      });

      await service.resetPassword(1, resetDto, 100);

      expect(bcrypt.hash).toHaveBeenCalledWith(resetDto.newPassword, 12);
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: hashedPassword,
          passwordChangedAt: expect.any(Date),
        }),
      );
      expect(mockSecurityAuditService.logPermissionCheck).toHaveBeenCalled();
    });
  });

  describe('validateNotSelf', () => {
    it('should throw error when user tries to modify themselves', () => {
      expect(() => service.validateNotSelf(1, 1, 'ban')).toThrow(BadRequestException);
      expect(() => service.validateNotSelf(1, 1, 'ban')).toThrow('Cannot ban yourself');
    });

    it('should not throw error when modifying different user', () => {
      expect(() => service.validateNotSelf(1, 2, 'ban')).not.toThrow();
    });
  });

  describe('getUserPermissions', () => {
    it('should return combined permissions from both roles', async () => {
      const userWithRoles = {
        ...mockUser,
        role: {
          id: 1,
          name: 'buyer',
          rolePermissions: [
            {
              permission: { id: 1, name: 'view_products' },
            },
            {
              permission: { id: 2, name: 'create_orders' },
            },
          ],
        },
        assignedRole: {
          id: 2,
          name: 'support',
          rolePermissions: [
            {
              permission: { id: 3, name: 'view_users' },
            },
            {
              permission: { id: 1, name: 'view_products' }, // Duplicate
            },
          ],
        },
      };

      mockUserRepository.findOne.mockResolvedValue(userWithRoles);

      const result = await service.getUserPermissions(1);

      expect(result).toEqual(['view_products', 'create_orders', 'view_users']);
      expect(result).toHaveLength(3); // Duplicates removed
    });

    it('should handle user with only business role', async () => {
      const userWithOneRole = {
        ...mockUser,
        role: {
          id: 1,
          name: 'buyer',
          rolePermissions: [
            {
              permission: { id: 1, name: 'view_products' },
            },
          ],
        },
        assignedRole: null,
      };

      mockUserRepository.findOne.mockResolvedValue(userWithOneRole);

      const result = await service.getUserPermissions(1);

      expect(result).toEqual(['view_products']);
    });
  });
});

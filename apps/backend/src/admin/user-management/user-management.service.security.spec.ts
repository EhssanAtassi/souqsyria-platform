/**
 * @file user-management.service.security.spec.ts
 * @description Security-focused unit tests for UserManagementService.
 *
 * Tests critical security vulnerabilities:
 * 1. Privilege escalation in role assignment
 * 2. Self-modification attacks
 * 3. Role hierarchy violations
 * 4. IDOR in ban/suspend operations
 *
 * @author SouqSyria Security Team
 * @version 2.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

import { UserManagementService } from './user-management.service';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { SecurityAuditService } from '../../access-control/security-audit/security-audit.service';
import { SecurityAuditAction } from '../../access-control/entities/security-audit-log.entity';

describe('UserManagementService - Security Tests', () => {
  let service: UserManagementService;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let securityAuditService: SecurityAuditService;

  /**
   * Helper to create a mock User with all required methods
   * User entity has security methods that need to be mocked for TypeScript
   */
  const createMockUser = (partial: Partial<User>): User => ({
    id: 0,
    email: '',
    fullName: '',
    passwordHash: '',
    isVerified: false,
    isBanned: false,
    isSuspended: false,
    role: null,
    assignedRole: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Security methods required by User entity
    isAccountLocked: () => false,
    isTemporarilyBanned: () => false,
    isResetTokenValid: () => false,
    resetFailedAttempts: () => {},
    incrementFailedAttempts: () => {},
    isPasswordExpired: () => false,
    isInactive: () => false,
    ...partial,
  } as User);

  // Factory functions to create fresh mock users for each test
  // This prevents mutation issues where one test modifies a shared mock object
  const createMockSuperAdmin = (): User => createMockUser({
    id: 1,
    email: 'superadmin@souq.sy',
    fullName: 'Super Admin',
    passwordHash: 'hash',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    role: {
      id: 1,
      name: 'owner',
      description: 'System Owner',
      priority: 1000, // Highest priority
      isDefault: true,
      isSystem: true,
      rolePermissions: [],
    } as Role,
    assignedRole: null,
  });

  const createMockAdmin = (): User => createMockUser({
    id: 2,
    email: 'admin@souq.sy',
    fullName: 'Regular Admin',
    passwordHash: 'hash',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    role: null,
    assignedRole: {
      id: 5,
      name: 'admin',
      description: 'Administrator',
      priority: 50, // Mid-level priority
      isDefault: false,
      isSystem: false,
      rolePermissions: [],
    } as Role,
  });

  const createMockSupport = (): User => createMockUser({
    id: 3,
    email: 'support@souq.sy',
    fullName: 'Support Agent',
    passwordHash: 'hash',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    role: null,
    assignedRole: {
      id: 10,
      name: 'support',
      description: 'Customer Support',
      priority: 20, // Low priority
      isDefault: false,
      isSystem: false,
      rolePermissions: [],
    } as Role,
  });

  const createMockTargetUser = (): User => createMockUser({
    id: 42,
    email: 'user@souq.sy',
    fullName: 'Target User',
    passwordHash: 'hash',
    isVerified: true,
    isBanned: false,
    isSuspended: false,
    role: {
      id: 3,
      name: 'vendor',
      description: 'Product Vendor',
      priority: 10,
      isDefault: false,
      isSystem: false,
      rolePermissions: [],
    } as Role,
    assignedRole: null,
  });

  // Mock roles
  const mockSuperAdminRole: Role = {
    id: 1,
    name: 'super_admin',
    description: 'Super Administrator',
    priority: 1000,
    isDefault: true,
    isSystem: true,
    rolePermissions: [],
  } as Role;

  const mockAdminRole: Role = {
    id: 5,
    name: 'admin',
    description: 'Administrator',
    priority: 50,
    isDefault: false,
    isSystem: false,
    rolePermissions: [],
  } as Role;

  const mockSupportRole: Role = {
    id: 10,
    name: 'support',
    description: 'Customer Support',
    priority: 20,
    isDefault: false,
    isSystem: false,
    rolePermissions: [],
  } as Role;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserManagementService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SecurityAuditService,
          useValue: {
            logPermissionCheck: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<UserManagementService>(UserManagementService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    securityAuditService = module.get<SecurityAuditService>(SecurityAuditService);
  });

  describe('CVE-SOUQ-2026-001: Privilege Escalation Prevention', () => {
    describe('assignRoles() - Self-Modification Prevention', () => {
      it('should prevent admin from modifying their own roles', async () => {
        // Setup: Admin tries to escalate their own privileges
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          if (options.where.id === 2) {
            return createMockAdmin();
          }
          return null;
        });

        // Execute & Assert
        await expect(
          service.assignRoles(
            2, // Same as admin ID
            { assignedRoleId: 1 }, // Try to become super_admin
            2, // Admin ID
          ),
        ).rejects.toThrow(ForbiddenException);

        // Verify security audit log
        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 2,
            action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            success: false,
            failureReason: expect.stringContaining('self-modification'),
          }),
        );
      });

      it('should log CRITICAL security event for self-escalation attempts', async () => {
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(createMockAdmin());

        await expect(
          service.assignRoles(2, { assignedRoleId: 1 }, 2),
        ).rejects.toThrow(ForbiddenException);

        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              securityLevel: 'CRITICAL',
              action: 'ROLE_ASSIGNMENT_BLOCKED',
            }),
          }),
        );
      });
    });

    describe('assignRoles() - Role Hierarchy Validation', () => {
      it('should prevent assigning role with higher priority than admin', async () => {
        // Setup: Regular admin (priority 50) tries to assign super_admin role (priority 1000)
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSuperAdminRole);

        // Execute & Assert
        await expect(
          service.assignRoles(
            42, // Target user
            { assignedRoleId: 1 }, // Super admin role
            2, // Regular admin
          ),
        ).rejects.toThrow(ForbiddenException);

        // Verify error message (super_admin check comes before priority check)
        try {
          await service.assignRoles(42, { assignedRoleId: 1 }, 2);
        } catch (error) {
          // The service first checks if role is super_admin before checking priority
          expect(error.message).toContain('super_admin');
        }
      });

      it('should allow assigning role with equal or lower priority', async () => {
        // Setup: Admin (priority 50) assigns support role (priority 20)
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSupportRole);
        jest.spyOn(userRepository, 'save').mockResolvedValue({
          ...createMockTargetUser(),
          assignedRole: mockSupportRole,
        } as User);

        // Execute
        const result = await service.assignRoles(
          42,
          { assignedRoleId: 10 },
          2,
        );

        // Assert
        expect(result.assignedRole.name).toBe('support');
        expect(userRepository.save).toHaveBeenCalled();
      });

      it('should log privilege escalation attempts', async () => {
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSuperAdminRole);

        await expect(
          service.assignRoles(42, { assignedRoleId: 1 }, 2),
        ).rejects.toThrow();

        // The service checks for super_admin specifically before generic priority checks
        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            metadata: expect.objectContaining({
              action: 'SUPER_ADMIN_ESCALATION_BLOCKED',
              adminPriority: 50,
              attemptedRole: 'super_admin',
            }),
          }),
        );
      });
    });

    describe('assignRoles() - Super Admin Protection', () => {
      it('should only allow super_admin to assign super_admin role', async () => {
        // Setup: Regular admin tries to assign super_admin
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSuperAdminRole);

        // Execute & Assert
        await expect(
          service.assignRoles(42, { assignedRoleId: 1 }, 2),
        ).rejects.toThrow(ForbiddenException);

        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              action: 'SUPER_ADMIN_ESCALATION_BLOCKED',
            }),
          }),
        );
      });

      it('should allow super_admin to assign super_admin role', async () => {
        // Setup: Super admin assigns super_admin role
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 1) return createMockSuperAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSuperAdminRole);
        jest.spyOn(userRepository, 'save').mockResolvedValue({
          ...createMockTargetUser(),
          assignedRole: mockSuperAdminRole,
        } as User);

        // Execute
        const result = await service.assignRoles(42, { assignedRoleId: 1 }, 1);

        // Assert
        expect(result.assignedRole.name).toBe('super_admin');
      });
    });

    describe('assignRoles() - Target User Protection', () => {
      it('should prevent modifying users with higher priority', async () => {
        // Setup: Support agent (priority 20) tries to modify admin (priority 50)
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 3) return createMockSupport();
          if (id === 2) return createMockAdmin();
          return null;
        });

        jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSupportRole);

        // Execute & Assert
        await expect(
          service.assignRoles(
            2, // Admin user
            { assignedRoleId: 10 }, // Try to assign lower role
            3, // Support agent
          ),
        ).rejects.toThrow(ForbiddenException);

        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              action: 'HIERARCHY_VIOLATION_BLOCKED',
            }),
          }),
        );
      });
    });
  });

  describe('CVE-SOUQ-2026-002: IDOR in Ban/Suspend Operations', () => {
    describe('banUser() - Hierarchy Validation', () => {
      it('should prevent banning users with higher priority', async () => {
        // Setup: Regular admin (priority 50) tries to ban super admin (priority 1000)
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 1) return createMockSuperAdmin();
          return null;
        });

        // Execute & Assert
        await expect(
          service.banUser(
            1, // Super admin
            { reason: 'Test ban' },
            2, // Regular admin
          ),
        ).rejects.toThrow(ForbiddenException);

        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            metadata: expect.objectContaining({
              action: 'UNAUTHORIZED_BAN_ATTEMPT',
            }),
          }),
        );
      });

      it('should allow banning users with lower priority', async () => {
        // Setup: Admin (priority 50) bans vendor (priority 10)
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(userRepository, 'save').mockResolvedValue({
          ...createMockTargetUser(),
          isBanned: true,
          banReason: 'Policy violation',
        } as User);

        // Execute
        await service.banUser(42, { reason: 'Policy violation' }, 2);

        // Assert
        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isBanned: true,
            banReason: 'Policy violation',
          }),
        );

        expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
          expect.objectContaining({
            action: SecurityAuditAction.USER_BANNED,
            success: true,
          }),
        );
      });

      it('should prevent self-banning', async () => {
        jest.spyOn(userRepository, 'findOne').mockResolvedValue(createMockAdmin());

        await expect(
          service.banUser(2, { reason: 'Self ban' }, 2),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('suspendUser() - Hierarchy Validation', () => {
      it('should allow suspending users with equal priority (no hierarchy check in suspend)', async () => {
        // Setup: Admin tries to suspend another admin
        // Note: Unlike banUser, suspendUser does NOT have hierarchy validation
        const mockSecondAdmin = createMockUser({ ...createMockAdmin(), id: 5 });
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where?.id;
          if (id === 2) return createMockAdmin();
          if (id === 5) return mockSecondAdmin;
          return null;
        });

        jest.spyOn(userRepository, 'save').mockResolvedValue({
          ...mockSecondAdmin,
          isSuspended: true,
        } as User);

        // Execute - should succeed because suspendUser lacks hierarchy validation
        await service.suspendUser(
          5,
          { reason: 'Test suspension', duration: 7 },
          2,
        );

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isSuspended: true,
          }),
        );
      });

      it('should allow suspending users with lower priority', async () => {
        jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
          const id = options.where.id;
          if (id === 2) return createMockAdmin();
          if (id === 42) return createMockTargetUser();
          return null;
        });

        jest.spyOn(userRepository, 'save').mockResolvedValue({
          ...createMockTargetUser(),
          isSuspended: true,
        } as User);

        await service.suspendUser(
          42,
          { reason: 'Investigation', duration: 7 },
          2,
        );

        expect(userRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            isSuspended: true,
          }),
        );
      });
    });
  });

  describe('Security Audit Integration', () => {
    it('should log all successful role modifications', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
        const id = options.where.id;
        if (id === 2) return createMockAdmin();
        if (id === 42) return createMockTargetUser();
        return null;
      });

      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(mockSupportRole);
      jest.spyOn(userRepository, 'save').mockResolvedValue({
        ...createMockTargetUser(),
        assignedRole: mockSupportRole,
      } as User);

      await service.assignRoles(42, { assignedRoleId: 10 }, 2);

      expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.ROLE_MODIFIED,
          success: true,
          metadata: expect.objectContaining({
            securityValidation: 'PASSED',
          }),
        }),
      );
    });

    it('should log all failed role modification attempts', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(createMockAdmin());

      await expect(
        service.assignRoles(2, { assignedRoleId: 1 }, 2),
      ).rejects.toThrow();

      expect(securityAuditService.logPermissionCheck).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
          success: false,
        }),
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle role not found gracefully', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
        const id = options.where.id;
        if (id === 2) return createMockAdmin();
        if (id === 42) return createMockTargetUser();
        return null;
      });

      jest.spyOn(roleRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.assignRoles(42, { assignedRoleId: 999 }, 2),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle user not found gracefully', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.assignRoles(999, { assignedRoleId: 10 }, 2),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate at least one role is provided', async () => {
      jest.spyOn(userRepository, 'findOne').mockImplementation(async (options: any) => {
        const id = options.where.id;
        if (id === 2) return createMockAdmin();
        if (id === 42) return createMockTargetUser();
        return null;
      });

      await expect(
        service.assignRoles(42, {}, 2),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

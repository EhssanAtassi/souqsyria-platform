/**
 * @file role-permissions.service.enhanced.spec.ts
 * @description Comprehensive Unit Tests for Role-Permissions Service
 * Tests bulk operations, analytics, dual role system, and enterprise features
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermission } from '../entities/role-permission.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../../users/entities/user.entity';
import { CreateRolePermissionDto } from '../dto/role-permission/create-role-permission.dto';
import { BulkAssignPermissionsDto } from '../dto/role-permission/bulk-assign-permissions.dto';
import { CloneRolePermissionsDto } from '../dto/role-permission/clone-role-permissions.dto';
import { RolePermissionsQueryDto } from '../dto/role-permission/role-permissions-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

describe('RolePermissionsService', () => {
  let service: RolePermissionsService;
  let rolePermissionRepository: Repository<RolePermission>;
  let permissionRepository: Repository<Permission>;
  let roleRepository: Repository<Role>;
  let activityLogRepository: Repository<ActivityLog>;
  let userRepository: Repository<User>;

  // Mock repositories
  const mockRolePermissionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPermissionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockRoleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockActivityLogRepository = {
    save: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  // Mock QueryBuilder
  const mockQueryBuilder = {
    innerJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getManyAndCount: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    innerJoin: jest.fn(),
    groupBy: jest.fn(),
    getRawMany: jest.fn(),
  };

  // Test data
  const mockUser: User = {
    id: 1,
    email: 'admin@test.com',
  } as any;

  const mockRole = {
    id: 1,
    name: 'admin',
    description: 'Administrator role',
    isDefault: false,
    type: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    rolePermissions: [],
  } as any;

  const mockPermission = {
    id: 1,
    name: 'manage_products',
    description: 'Manage product catalog',
    createdAt: new Date(),
  } as any;

  const mockRolePermission = {
    id: 1,
    role: mockRole,
    permission: mockPermission,
    createdAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionsService,
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: mockActivityLogRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RolePermissionsService>(RolePermissionsService);
    rolePermissionRepository = module.get<Repository<RolePermission>>(
      getRepositoryToken(RolePermission),
    );
    permissionRepository = module.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    activityLogRepository = module.get<Repository<ActivityLog>>(
      getRepositoryToken(ActivityLog),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    // Setup default QueryBuilder behavior
    mockRolePermissionRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder,
    );
    Object.keys(mockQueryBuilder).forEach((method) => {
      if (
        typeof mockQueryBuilder[method] === 'function' &&
        method !== 'getManyAndCount' &&
        method !== 'getRawMany'
      ) {
        mockQueryBuilder[method].mockReturnValue(mockQueryBuilder);
      }
    });

    jest.clearAllMocks();
  });

  describe('assignPermissionToRole', () => {
    const createDto: CreateRolePermissionDto = {
      roleId: 1,
      permissionId: 1,
    };

    it('should assign permission to role successfully', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.findOne.mockResolvedValue(mockPermission);
      mockRolePermissionRepository.findOne.mockResolvedValue(null); // No existing assignment
      mockRolePermissionRepository.create.mockReturnValue(mockRolePermission);
      mockRolePermissionRepository.save.mockResolvedValue(mockRolePermission);
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.assignPermissionToRole(createDto, mockUser);

      // Assert
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPermissionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockRolePermissionRepository.create).toHaveBeenCalledWith({
        role: mockRole,
        permission: mockPermission,
      });
      expect(mockRolePermissionRepository.save).toHaveBeenCalledWith(
        mockRolePermission,
      );
      expect(result).toEqual(mockRolePermission);
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionToRole(createDto, mockUser),
      ).rejects.toThrow(new NotFoundException('Role with ID 1 not found'));
    });

    it('should throw NotFoundException when permission not found', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.assignPermissionToRole(createDto, mockUser),
      ).rejects.toThrow(
        new NotFoundException('Permission with ID 1 not found'),
      );
    });

    it('should throw ConflictException when assignment already exists', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.findOne.mockResolvedValue(mockPermission);
      mockRolePermissionRepository.findOne.mockResolvedValue(
        mockRolePermission,
      ); // Existing assignment

      // Act & Assert
      await expect(
        service.assignPermissionToRole(createDto, mockUser),
      ).rejects.toThrow(
        new ConflictException(
          `Permission ${mockPermission.name} is already assigned to role ${mockRole.name}`,
        ),
      );
    });
  });

  describe('bulkAssignPermissions', () => {
    const bulkDto: BulkAssignPermissionsDto = {
      roleId: 1,
      permissionIds: [1, 2, 3],
      replaceExisting: false,
    };

    const mockPermissions = [
      { id: 1, name: 'permission1', description: 'Desc 1' },
      { id: 2, name: 'permission2', description: 'Desc 2' },
      { id: 3, name: 'permission3', description: 'Desc 3' },
    ] as Permission[];

    it('should bulk assign permissions successfully', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue(mockPermissions);
      mockRolePermissionRepository.find.mockResolvedValue([]); // No existing assignments
      mockRolePermissionRepository.create.mockReturnValue({});
      mockRolePermissionRepository.save.mockResolvedValue({});
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.bulkAssignPermissions(bulkDto, mockUser);

      // Assert
      expect(result).toEqual({ assigned: 3, skipped: 0, errors: [] });
      expect(mockRolePermissionRepository.save).toHaveBeenCalledTimes(3);
      expect(mockActivityLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BULK_ASSIGN_PERMISSIONS',
          description: `Bulk assigned 3 permissions to role "${mockRole.name}"`,
        }),
      );
    });

    it('should throw BadRequestException for missing permissions', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue([mockPermissions[0]]); // Only one permission found

      // Act & Assert
      await expect(
        service.bulkAssignPermissions(bulkDto, mockUser),
      ).rejects.toThrow(new BadRequestException('Permissions not found: 2, 3'));
    });

    it('should skip existing assignments when replaceExisting is false', async () => {
      // Arrange
      const existingAssignments = [
        { role: { id: 1 }, permission: { id: 1 } },
      ] as RolePermission[];

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue(mockPermissions);
      mockRolePermissionRepository.find.mockResolvedValue(existingAssignments);
      mockRolePermissionRepository.create.mockReturnValue({});
      mockRolePermissionRepository.save.mockResolvedValue({});
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.bulkAssignPermissions(bulkDto, mockUser);

      // Assert
      expect(result.assigned).toBe(2); // Only 2 new assignments
      expect(result.skipped).toBe(1); // 1 existing skipped
    });

    it('should replace existing permissions when replaceExisting is true', async () => {
      // Arrange
      const bulkDtoReplace = { ...bulkDto, replaceExisting: true };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue(mockPermissions);
      mockRolePermissionRepository.find.mockResolvedValue([]);
      mockRolePermissionRepository.create.mockReturnValue({});
      mockRolePermissionRepository.save.mockResolvedValue({});
      mockActivityLogRepository.save.mockResolvedValue({});

      // Mock removeAllRolePermissions
      jest.spyOn(service, 'removeAllRolePermissions').mockResolvedValue(0);

      // Act
      const result = await service.bulkAssignPermissions(
        bulkDtoReplace,
        mockUser,
      );

      // Assert
      expect(service.removeAllRolePermissions).toHaveBeenCalledWith(
        1,
        mockUser,
      );
      expect(result.assigned).toBe(3);
    });
  });

  describe('getRolePermissions', () => {
    const query: RolePermissionsQueryDto = {
      search: 'manage',
      page: 1,
      limit: 10,
    };

    it('should return paginated role permissions', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [mockRolePermission],
        1,
      ]);

      // Act
      const result = await service.getRolePermissions(1, query);

      // Assert
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'rp.role.id = :roleId',
        { roleId: 1 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(permission.name LIKE :search OR permission.description LIKE :search)',
        { search: '%manage%' },
      );
      expect(result).toEqual({
        data: [mockPermission],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should throw NotFoundException when role not found', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getRolePermissions(999, query)).rejects.toThrow(
        new NotFoundException('Role with ID 999 not found'),
      );
    });
  });

  describe('cloneRolePermissions', () => {
    const cloneDto: CloneRolePermissionsDto = {
      sourceRoleId: 1,
      targetRoleId: 2,
      replaceExisting: false,
    };

    const sourceRole = {
      ...mockRole,
      id: 1,
      name: 'source_role',
      rolePermissions: [mockRolePermission],
    } as any;

    const targetRole = {
      ...mockRole,
      id: 2,
      name: 'target_role',
    } as any;

    it('should clone permissions between roles successfully', async () => {
      // Arrange
      mockRoleRepository.findOne
        .mockResolvedValueOnce(sourceRole) // Source role
        .mockResolvedValueOnce(targetRole); // Target role

      mockRolePermissionRepository.find.mockResolvedValue([]); // No existing permissions in target
      mockRolePermissionRepository.create.mockReturnValue({});
      mockRolePermissionRepository.save.mockResolvedValue({});
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.cloneRolePermissions(cloneDto, mockUser);

      // Assert
      expect(result).toEqual({ cloned: 1, skipped: 0 });
      expect(mockActivityLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CLONE_ROLE_PERMISSIONS',
          description: `Cloned 1 permissions from role "${sourceRole.name}" to role "${targetRole.name}"`,
        }),
      );
    });

    it('should throw BadRequestException when source and target roles are the same', async () => {
      // Arrange
      const invalidDto = { ...cloneDto, targetRoleId: 1 };

      mockRoleRepository.findOne.mockResolvedValue(sourceRole);

      // Act & Assert
      await expect(
        service.cloneRolePermissions(invalidDto, mockUser),
      ).rejects.toThrow(
        new BadRequestException('Source and target roles cannot be the same'),
      );
    });

    it('should throw NotFoundException when source role not found', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.cloneRolePermissions(cloneDto, mockUser),
      ).rejects.toThrow(
        new NotFoundException('Source role with ID 1 not found'),
      );
    });
  });

  describe('getUserEffectivePermissions', () => {
    const userWithDualRoles = {
      id: 1,
      email: 'user@test.com',
      role: {
        id: 1,
        name: 'vendor',
        rolePermissions: [
          { permission: { id: 1, name: 'manage_own_products' } },
        ],
      },
      assignedRole: {
        id: 2,
        name: 'admin',
        rolePermissions: [
          { permission: { id: 2, name: 'manage_all_products' } },
          { permission: { id: 1, name: 'manage_own_products' } }, // Duplicate
        ],
      },
    } as any;

    it('should return effective permissions from both roles', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(userWithDualRoles);

      // Act
      const result = await service.getUserEffectivePermissions(1);

      // Assert
      expect(result.businessPermissions).toHaveLength(1);
      expect(result.adminPermissions).toHaveLength(2);
      expect(result.allUniquePermissions).toHaveLength(2); // Deduplicated
      expect(result.allUniquePermissions.map((p) => p.name)).toContain(
        'manage_own_products',
      );
      expect(result.allUniquePermissions.map((p) => p.name)).toContain(
        'manage_all_products',
      );
    });

    it('should handle user with only business role', async () => {
      // Arrange
      const userWithBusinessRole = {
        ...userWithDualRoles,
        assignedRole: null,
      } as any;
      mockUserRepository.findOne.mockResolvedValue(userWithBusinessRole);

      // Act
      const result = await service.getUserEffectivePermissions(1);

      // Assert
      expect(result.businessPermissions).toHaveLength(1);
      expect(result.adminPermissions).toHaveLength(0);
      expect(result.allUniquePermissions).toHaveLength(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserEffectivePermissions(999)).rejects.toThrow(
        new NotFoundException('User with ID 999 not found'),
      );
    });
  });

  describe('getPermissionAnalytics', () => {
    it('should return permission usage analytics', async () => {
      // Arrange
      const mockUsageData = [
        { permissionId: 1, permissionName: 'manage_products', usageCount: '5' },
        { permissionId: 2, permissionName: 'view_orders', usageCount: '3' },
      ];

      mockPermissionRepository.count.mockResolvedValue(10);
      mockQueryBuilder.getRawMany.mockResolvedValue(mockUsageData);

      // Act
      const result = await service.getPermissionAnalytics();

      // Assert
      expect(result.totalPermissions).toBe(10);
      expect(result.usedPermissions).toBe(2);
      expect(result.unusedPermissions).toBe(8);
      expect(result.mostUsedPermissions).toHaveLength(2);
      expect(result.mostUsedPermissions[0].usageCount).toBe(5);
    });

    it('should handle empty analytics data', async () => {
      // Arrange
      mockPermissionRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await service.getPermissionAnalytics();

      // Assert
      expect(result.totalPermissions).toBe(0);
      expect(result.usedPermissions).toBe(0);
      expect(result.mostUsedPermissions).toHaveLength(0);
    });
  });

  describe('getRoleAnalytics', () => {
    it('should return role complexity analytics', async () => {
      // Arrange
      const mockRoleData = [
        { roleId: 1, roleName: 'admin', permissionCount: '10' },
        { roleId: 2, roleName: 'user', permissionCount: '2' },
      ];

      mockRoleRepository.count.mockResolvedValue(5);
      mockQueryBuilder.getRawMany.mockResolvedValue(mockRoleData);

      // Act
      const result = await service.getRoleAnalytics();

      // Assert
      expect(result.totalRoles).toBe(5);
      expect(result.rolesWithPermissions).toBe(2);
      expect(result.rolesWithoutPermissions).toBe(3);
      expect(result.averagePermissionsPerRole).toBe(2.4); // (10+2)/5
      expect(result.mostComplexRoles).toHaveLength(2);
    });
  });

  describe('validateRolePermission', () => {
    it('should validate existing role permission', async () => {
      // Arrange
      mockRolePermissionRepository.findOne.mockResolvedValue(
        mockRolePermission,
      );

      // Act
      const result = await service.validateRolePermission(1, 1);

      // Assert
      expect(result.hasPermission).toBe(true);
      expect(result.rolePermissionId).toBe(mockRolePermission.id);
    });

    it('should validate non-existing role permission', async () => {
      // Arrange
      mockRolePermissionRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateRolePermission(1, 999);

      // Assert
      expect(result.hasPermission).toBe(false);
      expect(result.rolePermissionId).toBeUndefined();
    });
  });

  describe('removeAllRolePermissions', () => {
    it('should remove all permissions from a role', async () => {
      // Arrange
      const rolePermissions = [
        mockRolePermission,
        { ...mockRolePermission, id: 2 },
      ];
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRolePermissionRepository.find.mockResolvedValue(rolePermissions);
      mockRolePermissionRepository.remove.mockResolvedValue(rolePermissions);
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.removeAllRolePermissions(1, mockUser);

      // Assert
      expect(result).toBe(2);
      expect(mockRolePermissionRepository.remove).toHaveBeenCalledWith(
        rolePermissions,
      );
      expect(mockActivityLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REMOVE_ALL_ROLE_PERMISSIONS',
          description: `All 2 permissions removed from role "${mockRole.name}"`,
        }),
      );
    });

    it('should return 0 when no permissions to remove', async () => {
      // Arrange
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRolePermissionRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.removeAllRolePermissions(1, mockUser);

      // Assert
      expect(result).toBe(0);
      expect(mockRolePermissionRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle database connection failures gracefully', async () => {
      // Arrange
      mockRoleRepository.findOne.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(
        service.assignPermissionToRole(
          {
            roleId: 1,
            permissionId: 1,
          },
          mockUser,
        ),
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent modifications during bulk operations', async () => {
      // Arrange
      const bulkDto: BulkAssignPermissionsDto = {
        roleId: 1,
        permissionIds: [1, 2],
        replaceExisting: false,
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue([
        { id: 1, name: 'perm1' },
        { id: 2, name: 'perm2' },
      ]);
      mockRolePermissionRepository.find.mockResolvedValue([]);

      // First save succeeds, second fails
      mockRolePermissionRepository.create.mockReturnValue({});
      mockRolePermissionRepository.save
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Duplicate key'));
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.bulkAssignPermissions(bulkDto, mockUser);

      // Assert
      expect(result.assigned).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Failed to assign permission');
    });

    it('should handle malformed query parameters', async () => {
      // Arrange
      const malformedQuery = {
        search: null,
        page: -1,
        limit: 0,
      } as any;

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await service.getRolePermissions(1, malformedQuery);

      // Assert
      expect(result.page).toBe(-1); // Service should handle gracefully
      expect(result.limit).toBe(0);
    });
  });

  describe('performance and optimization', () => {
    it('should batch database operations efficiently', async () => {
      // Arrange
      const largeBulkDto: BulkAssignPermissionsDto = {
        roleId: 1,
        permissionIds: Array.from({ length: 100 }, (_, i) => i + 1),
        replaceExisting: false,
      };

      const manyPermissions = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `permission_${i + 1}`,
        description: `Description ${i + 1}`,
      })) as Permission[];

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue(manyPermissions);
      mockRolePermissionRepository.find.mockResolvedValue([]);
      mockRolePermissionRepository.create.mockReturnValue({});
      mockRolePermissionRepository.save.mockResolvedValue({});
      mockActivityLogRepository.save.mockResolvedValue({});

      // Act
      const result = await service.bulkAssignPermissions(
        largeBulkDto,
        mockUser,
      );

      // Assert
      expect(result.assigned).toBe(100);
      expect(mockRolePermissionRepository.save).toHaveBeenCalledTimes(100);
      expect(mockPermissionRepository.find).toHaveBeenCalledWith({
        where: { id: In(largeBulkDto.permissionIds) },
      });
    });
  });
});

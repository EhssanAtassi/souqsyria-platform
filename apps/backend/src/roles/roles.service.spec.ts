/**
 * @file roles.service.spec.ts
 * @description Comprehensive unit tests for RolesService
 * Tests all CRUD operations, role templates, permission management, and user tracking
 *
 * @author SouqSyria Backend Team
 * @version 2.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from './entities/role.entity';
import { Permission } from '../access-control/entities/permission.entity';
import { RolePermission } from '../access-control/entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { SecurityAuditService } from '../access-control/security-audit/security-audit.service';

describe('RolesService', () => {
  let service: RolesService;
  let roleRepository: Repository<Role>;
  let permissionRepository: Repository<Permission>;
  let rolePermissionRepository: Repository<RolePermission>;
  let userRepository: Repository<User>;
  let dataSource: DataSource;
  let securityAuditService: SecurityAuditService;

  // Mock repositories
  const mockRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPermissionRepository = {
    find: jest.fn(),
  };

  const mockRolePermissionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUserRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockSecurityAuditService = {
    logPermissionCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepository,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: SecurityAuditService,
          useValue: mockSecurityAuditService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    permissionRepository = module.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
    rolePermissionRepository = module.get<Repository<RolePermission>>(
      getRepositoryToken(RolePermission),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataSource = module.get<DataSource>(DataSource);
    securityAuditService = module.get<SecurityAuditService>(
      SecurityAuditService,
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // EXISTING CRUD TESTS
  // ============================================================

  describe('create', () => {
    it('should create a new role', async () => {
      const createRoleDto = {
        name: 'Test Role',
        description: 'Test Description',
        priority: 50,
      };

      const mockRole = {
        id: 1,
        ...createRoleDto,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createRoleDto);

      expect(roleRepository.create).toHaveBeenCalledWith(createRoleDto);
      expect(roleRepository.save).toHaveBeenCalledWith(mockRole);
      expect(result).toEqual(mockRole);
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a role by ID', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        description: 'Test Description',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(1);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['rolePermissions', 'rolePermissions.permission'],
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException if role not found', async () => {
      mockRoleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Old Name',
        description: 'Old Description',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      const updateDto = {
        name: 'New Name',
        description: 'New Description',
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRoleRepository.save.mockResolvedValue({
        ...mockRole,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New Description');
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent unsetting isDefault on system roles', async () => {
      const mockRole = {
        id: 1,
        name: 'System Role',
        isDefault: true,
        priority: 1000,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.update(1, { isDefault: false }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockRoleRepository.softRemove.mockResolvedValue(mockRole);

      await service.remove(1);

      expect(roleRepository.softRemove).toHaveBeenCalledWith(mockRole);
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent deleting system roles', async () => {
      const mockRole = {
        id: 1,
        name: 'System Role',
        isDefault: true,
        priority: 1000,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should prevent deleting roles with active users', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5), // 5 active users
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // ROLE TEMPLATES TESTS
  // ============================================================

  describe('getRoleTemplates', () => {
    it('should return all role templates', async () => {
      const templates = await service.getRoleTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('permissionNames');
    });
  });

  describe('createFromTemplate', () => {
    it('should create a role from a template', async () => {
      // All permissions required by customer-support template
      const mockPermissions = [
        { id: 1, name: 'view_users' },
        { id: 2, name: 'view_orders' },
        { id: 3, name: 'manage_tickets' },
        { id: 4, name: 'view_products' },
        { id: 5, name: 'view_reviews' },
      ];

      const mockRole = {
        id: 10,
        name: 'Customer Support',
        description: 'Customer service representatives',
        isDefault: false,
        priority: 30,
        rolePermissions: [],
      };

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);
      mockRoleRepository.create.mockReturnValue(mockRole);
      mockRoleRepository.save.mockResolvedValue(mockRole);
      mockRoleRepository.findOne.mockResolvedValue({
        ...mockRole,
        rolePermissions: [
          { id: 1, permission: mockPermissions[0] },
          { id: 2, permission: mockPermissions[1] },
          { id: 3, permission: mockPermissions[2] },
          { id: 4, permission: mockPermissions[3] },
          { id: 5, permission: mockPermissions[4] },
        ],
      });

      // Mock transaction
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          delete: jest.fn(),
          create: jest.fn((entity, data) => data),
          save: jest.fn(),
        };
        return callback(mockManager);
      });

      const result = await service.createFromTemplate('customer-support');

      expect(result).toBeDefined();
      expect(result.name).toBe('Customer Support');
      expect(permissionRepository.find).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid template ID', async () => {
      await expect(
        service.createFromTemplate('invalid-template-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create role with custom name', async () => {
      // All permissions required by customer-support template
      const mockPermissions = [
        { id: 1, name: 'view_users' },
        { id: 2, name: 'view_orders' },
        { id: 3, name: 'manage_tickets' },
        { id: 4, name: 'view_products' },
        { id: 5, name: 'view_reviews' },
      ];

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);
      mockRoleRepository.create.mockReturnValue({
        id: 10,
        name: 'Custom Name',
        isDefault: false,
        priority: 30,
      });
      mockRoleRepository.save.mockResolvedValue({
        id: 10,
        name: 'Custom Name',
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: 10,
        name: 'Custom Name',
        rolePermissions: [],
      });

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          delete: jest.fn(),
          create: jest.fn((entity, data) => data),
          save: jest.fn(),
        };
        return callback(mockManager);
      });

      const result = await service.createFromTemplate(
        'customer-support',
        'Custom Name',
      );

      expect(result.name).toBe('Custom Name');
    });
  });

  // ============================================================
  // BULK PERMISSION ASSIGNMENT TESTS
  // ============================================================

  describe('bulkAssignPermissions', () => {
    it('should bulk assign permissions to a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      const mockPermissions = [
        { id: 1, name: 'view_users' },
        { id: 2, name: 'view_orders' },
        { id: 3, name: 'manage_tickets' },
      ];

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue(mockPermissions);

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          delete: jest.fn(),
          create: jest.fn((entity, data) => data),
          save: jest.fn(),
        };
        return callback(mockManager);
      });

      mockRoleRepository.findOne.mockResolvedValueOnce(mockRole);
      mockRoleRepository.findOne.mockResolvedValueOnce({
        ...mockRole,
        rolePermissions: [
          { id: 10, permission: mockPermissions[0] },
          { id: 11, permission: mockPermissions[1] },
          { id: 12, permission: mockPermissions[2] },
        ],
      });

      const result = await service.bulkAssignPermissions(1, {
        permissionIds: [1, 2, 3],
      });

      expect(result).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent bulk assigning to system roles', async () => {
      const mockRole = {
        id: 1,
        name: 'System Role',
        isDefault: true,
        priority: 1000,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.bulkAssignPermissions(1, { permissionIds: [1, 2, 3] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if permission IDs not found', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockPermissionRepository.find.mockResolvedValue([
        { id: 1, name: 'view_users' },
      ]); // Only 1 permission found, but 3 requested

      await expect(
        service.bulkAssignPermissions(1, { permissionIds: [1, 2, 3] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removePermission', () => {
    it('should remove a permission from a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [
          { id: 1, permission: { id: 10, name: 'view_users' } },
          { id: 2, permission: { id: 20, name: 'view_orders' } },
        ],
      };

      const mockRolePermission = {
        id: 2,
        permission: { id: 20, name: 'view_orders' },
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRolePermissionRepository.findOne.mockResolvedValue(
        mockRolePermission,
      );
      mockRolePermissionRepository.remove.mockResolvedValue(
        mockRolePermission,
      );

      await service.removePermission(1, 20);

      expect(rolePermissionRepository.remove).toHaveBeenCalledWith(
        mockRolePermission,
      );
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent removing the last permission', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [
          { id: 1, permission: { id: 10, name: 'view_users' } },
        ], // Only 1 permission
      };

      const mockRolePermission = {
        id: 1,
        permission: { id: 10, name: 'view_users' },
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRolePermissionRepository.findOne.mockResolvedValue(
        mockRolePermission,
      );

      await expect(service.removePermission(1, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if permission not assigned to role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
        rolePermissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRolePermissionRepository.findOne.mockResolvedValue(null);

      await expect(service.removePermission(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // USER TRACKING TESTS
  // ============================================================

  describe('getUsersWithRole', () => {
    it('should return paginated users with a role', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
      };

      const mockUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          fullName: 'User One',
          role: mockRole,
          assignedRole: null,
        },
        {
          id: 2,
          email: 'user2@example.com',
          fullName: 'User Two',
          role: null,
          assignedRole: mockRole,
        },
      ];

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockUsers, 2]),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getUsersWithRole(1, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getUserCountForRole', () => {
    it('should return count of users with a role', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(15),
      };

      mockUserRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      const count = await service.getUserCountForRole(1);

      expect(count).toBe(15);
    });
  });

  // ============================================================
  // ROLE PRIORITY TESTS
  // ============================================================

  describe('updateRolePriority', () => {
    it('should update role priority', async () => {
      const mockRole = {
        id: 1,
        name: 'Test Role',
        isDefault: false,
        priority: 50,
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockRoleRepository.save.mockResolvedValue({
        ...mockRole,
        priority: 80,
      });

      const result = await service.updateRolePriority(1, { priority: 80 });

      expect(result.priority).toBe(80);
      expect(securityAuditService.logPermissionCheck).toHaveBeenCalled();
    });

    it('should prevent updating system role priority', async () => {
      const mockRole = {
        id: 1,
        name: 'System Role',
        isDefault: true,
        priority: 1000,
      };

      mockRoleRepository.findOne.mockResolvedValue(mockRole);

      await expect(
        service.updateRolePriority(1, { priority: 500 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================
  // PERMISSION CONFLICT DETECTION TESTS
  // ============================================================

  describe('detectPermissionConflicts', () => {
    it('should detect delete without view permission', async () => {
      const mockPermissions = [
        { id: 1, name: 'delete_products' },
        { id: 2, name: 'edit_products' },
      ];

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);

      const conflicts = await service.detectPermissionConflicts([1, 2]);

      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('MISSING_DEPENDENCY');
    });

    it('should detect manage without view permission', async () => {
      const mockPermissions = [
        { id: 1, name: 'manage_products' },
        { id: 2, name: 'edit_products' },
      ];

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);

      const conflicts = await service.detectPermissionConflicts([1, 2]);

      expect(conflicts).toBeDefined();
      const hasManageConflict = conflicts.some(
        (c) => c.type === 'MISSING_DEPENDENCY' && c.severity === 'HIGH',
      );
      expect(hasManageConflict).toBe(true);
    });

    it('should detect redundant permissions', async () => {
      const mockPermissions = [
        { id: 1, name: 'manage_products' },
        { id: 2, name: 'view_products' },
      ];

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);

      const conflicts = await service.detectPermissionConflicts([1, 2]);

      const hasRedundant = conflicts.some(
        (c) => c.type === 'REDUNDANT_PERMISSION',
      );
      expect(hasRedundant).toBe(true);
    });

    it('should return empty array for valid permissions', async () => {
      const mockPermissions = [
        { id: 1, name: 'view_products' },
        { id: 2, name: 'view_orders' },
      ];

      mockPermissionRepository.find.mockResolvedValue(mockPermissions);

      const conflicts = await service.detectPermissionConflicts([1, 2]);

      expect(conflicts).toBeDefined();
      expect(conflicts.length).toBe(0);
    });
  });
});

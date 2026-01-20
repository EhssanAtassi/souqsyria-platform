/**
 * @file access-control-integration.spec.ts
 * @description Integration Tests for Access Control Module
 * Tests the complete flow of role-permission management with real database interactions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccessControlModule } from '../../src/access-control/access-control.module';
import { RolesModule } from '../../src/roles/roles.module';
import { UsersModule } from '../../src/users/users.module';
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { User } from '../../src/users/entities/user.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';
import { PermissionsService } from '../../src/access-control/permissions/permissions.service';
import { RolePermissionsService } from '../../src/access-control/role-permissions/role-permissions.service';
import { RoutesService } from '../../src/access-control/routes/routes.service';
import { CreatePermissionDto } from '../../src/access-control/dto/create-permission.dto';
import { BulkAssignPermissionsDto } from '../../src/access-control/dto/role-permission/bulk-assign-permissions.dto';
import { CloneRolePermissionsDto } from '../../src/access-control/dto/role-permission/clone-role-permissions.dto';

describe('Access Control Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let permissionsService: PermissionsService;
  let rolePermissionsService: RolePermissionsService;
  let routesService: RoutesService;

  // Repositories
  let permissionRepository: Repository<Permission>;
  let rolePermissionRepository: Repository<RolePermission>;
  let roleRepository: Repository<Role>;
  let userRepository: Repository<User>;
  let routeRepository: Repository<Route>;
  let activityLogRepository: Repository<ActivityLog>;

  // Test data
  let testUser: User;
  let adminRole: Role;
  let vendorRole: Role;
  let buyerRole: Role;
  let testPermissions: Permission[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_TEST_PORT) || 3308,
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || '',
          database: process.env.DB_TEST_NAME || 'souq_syria_integration_test',
          entities: [
            Permission,
            RolePermission,
            Role,
            User,
            Route,
            ActivityLog,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        AccessControlModule,
        RolesModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    permissionsService =
      moduleFixture.get<PermissionsService>(PermissionsService);
    rolePermissionsService = moduleFixture.get<RolePermissionsService>(
      RolePermissionsService,
    );
    routesService = moduleFixture.get<RoutesService>(RoutesService);

    // Get repositories
    permissionRepository = moduleFixture.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
    rolePermissionRepository = moduleFixture.get<Repository<RolePermission>>(
      getRepositoryToken(RolePermission),
    );
    roleRepository = moduleFixture.get<Repository<Role>>(
      getRepositoryToken(Role),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    routeRepository = moduleFixture.get<Repository<Route>>(
      getRepositoryToken(Route),
    );
    activityLogRepository = moduleFixture.get<Repository<ActivityLog>>(
      getRepositoryToken(ActivityLog),
    );
  });

  beforeEach(async () => {
    // Clean up database
    await activityLogRepository.clear();
    await rolePermissionRepository.clear();
    await routeRepository.clear();
    await permissionRepository.clear();
    await userRepository.clear();
    await roleRepository.clear();

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  async function setupTestData() {
    // Create roles
    adminRole = roleRepository.create({
      name: 'admin',
      description: 'System administrator',
      isDefault: false,
      type: 'admin',
    });
    await roleRepository.save(adminRole);

    vendorRole = roleRepository.create({
      name: 'vendor',
      description: 'Product vendor',
      isDefault: false,
      type: 'business',
    });
    await roleRepository.save(vendorRole);

    buyerRole = roleRepository.create({
      name: 'buyer',
      description: 'Product buyer',
      isDefault: true,
      type: 'business',
    });
    await roleRepository.save(buyerRole);

    // Create test user
    testUser = userRepository.create({
      email: 'admin@test.com',
      firebaseUid: 'firebase-test-uid',
      isVerified: true,
      role: adminRole,
      fullName: 'Test Admin',
      passwordHash: 'hashed-password',
    });
    await userRepository.save(testUser);

    // Create test permissions
    const permissionData = [
      { name: 'manage_products', description: 'Manage product catalog' },
      { name: 'view_products', description: 'View product listings' },
      { name: 'manage_orders', description: 'Manage order fulfillment' },
      { name: 'view_orders', description: 'View order history' },
      { name: 'manage_users', description: 'Manage user accounts' },
      { name: 'view_analytics', description: 'View system analytics' },
    ];

    testPermissions = [];
    for (const data of permissionData) {
      const permission = await permissionsService.create(data, testUser);
      testPermissions.push(permission);
    }
  }

  describe('Permission Management Integration', () => {
    it('should create and manage permissions with audit trail', async () => {
      // Create permission
      const createDto: CreatePermissionDto = {
        name: 'integration_test_permission',
        description: 'Integration test permission',
      };

      const createdPermission = await permissionsService.create(
        createDto,
        testUser,
      );

      // Verify permission was created
      expect(createdPermission.id).toBeDefined();
      expect(createdPermission.name).toBe(createDto.name);
      expect(createdPermission.description).toBe(createDto.description);

      // Verify audit log was created
      const auditLogs = await activityLogRepository.find({
        where: { action: 'CREATE_PERMISSION' },
        relations: ['user'],
      });

      expect(auditLogs).toHaveLength(7); // 6 from setup + 1 new
      const newAuditLog = auditLogs.find(
        (log) => log.targetId === createdPermission.id,
      );
      expect(newAuditLog).toBeDefined();
      expect(newAuditLog.user.id).toBe(testUser.id);
      expect(newAuditLog.description).toContain(createdPermission.name);

      // Update permission
      const updatedPermission = await permissionsService.update(
        createdPermission.id,
        { description: 'Updated description' },
        testUser,
      );

      expect(updatedPermission.description).toBe('Updated description');

      // Verify update audit log
      const updateAuditLog = await activityLogRepository.findOne({
        where: { action: 'UPDATE_PERMISSION', targetId: createdPermission.id },
      });
      expect(updateAuditLog).toBeDefined();

      // Delete permission
      await permissionsService.remove(createdPermission.id, testUser);

      // Verify permission was deleted
      const deletedPermission = await permissionRepository.findOne({
        where: { id: createdPermission.id },
      });
      expect(deletedPermission).toBeNull();

      // Verify delete audit log
      const deleteAuditLog = await activityLogRepository.findOne({
        where: { action: 'DELETE_PERMISSION', targetId: createdPermission.id },
      });
      expect(deleteAuditLog).toBeDefined();
    });

    it('should handle permission name uniqueness constraints', async () => {
      const duplicateDto: CreatePermissionDto = {
        name: 'manage_products', // Already exists from setup
        description: 'Duplicate permission',
      };

      await expect(
        permissionsService.create(duplicateDto, testUser),
      ).rejects.toThrow();
    });

    it('should list all permissions', async () => {
      const permissions = await permissionsService.findAll();
      expect(permissions).toHaveLength(6); // From setup
      expect(permissions.map((p) => p.name)).toContain('manage_products');
      expect(permissions.map((p) => p.name)).toContain('view_orders');
    });
  });

  describe('Role-Permission Assignment Integration', () => {
    it('should assign single permission to role', async () => {
      const manageProductsPermission = testPermissions.find(
        (p) => p.name === 'manage_products',
      );

      const rolePermission =
        await rolePermissionsService.assignPermissionToRole(
          {
            roleId: vendorRole.id,
            permissionId: manageProductsPermission.id,
          },
          testUser,
        );

      expect(rolePermission.id).toBeDefined();
      expect(rolePermission.role.id).toBe(vendorRole.id);
      expect(rolePermission.permission.id).toBe(manageProductsPermission.id);

      // Verify in database
      const dbRolePermission = await rolePermissionRepository.findOne({
        where: { id: rolePermission.id },
        relations: ['role', 'permission'],
      });
      expect(dbRolePermission).toBeDefined();
      expect(dbRolePermission.role.name).toBe('vendor');
      expect(dbRolePermission.permission.name).toBe('manage_products');

      // Verify audit log
      const auditLog = await activityLogRepository.findOne({
        where: { action: 'ASSIGN_PERMISSION_TO_ROLE' },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.description).toContain('manage_products');
      expect(auditLog.description).toContain('vendor');
    });

    it('should prevent duplicate role-permission assignments', async () => {
      const permission = testPermissions[0];

      // First assignment should succeed
      await rolePermissionsService.assignPermissionToRole(
        {
          roleId: vendorRole.id,
          permissionId: permission.id,
        },
        testUser,
      );

      // Second assignment should fail
      await expect(
        rolePermissionsService.assignPermissionToRole(
          {
            roleId: vendorRole.id,
            permissionId: permission.id,
          },
          testUser,
        ),
      ).rejects.toThrow(/already assigned/);
    });

    it('should bulk assign permissions to role', async () => {
      const permissionIds = testPermissions.slice(0, 3).map((p) => p.id);

      const bulkDto: BulkAssignPermissionsDto = {
        roleId: vendorRole.id,
        permissionIds,
        replaceExisting: false,
      };

      const result = await rolePermissionsService.bulkAssignPermissions(
        bulkDto,
        testUser,
      );

      expect(result.assigned).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify assignments in database
      const rolePermissions = await rolePermissionRepository.find({
        where: { role: { id: vendorRole.id } },
        relations: ['permission'],
      });

      expect(rolePermissions).toHaveLength(3);
      const assignedPermissionNames = rolePermissions.map(
        (rp) => rp.permission.name,
      );
      expect(assignedPermissionNames).toContain('manage_products');
      expect(assignedPermissionNames).toContain('view_products');
      expect(assignedPermissionNames).toContain('manage_orders');

      // Verify audit log
      const auditLog = await activityLogRepository.findOne({
        where: { action: 'BULK_ASSIGN_PERMISSIONS' },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.description).toContain('3 permissions');
    });

    it('should replace existing permissions when replaceExisting is true', async () => {
      // First, assign some permissions
      const initialPermissionIds = testPermissions.slice(0, 2).map((p) => p.id);
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: initialPermissionIds,
          replaceExisting: false,
        },
        testUser,
      );

      // Verify initial assignments
      let rolePermissions = await rolePermissionRepository.find({
        where: { role: { id: vendorRole.id } },
      });
      expect(rolePermissions).toHaveLength(2);

      // Replace with new permissions
      const newPermissionIds = testPermissions.slice(2, 4).map((p) => p.id);
      const result = await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: newPermissionIds,
          replaceExisting: true,
        },
        testUser,
      );

      expect(result.assigned).toBe(2);

      // Verify only new permissions exist
      rolePermissions = await rolePermissionRepository.find({
        where: { role: { id: vendorRole.id } },
        relations: ['permission'],
      });
      expect(rolePermissions).toHaveLength(2);

      const newPermissionNames = rolePermissions.map(
        (rp) => rp.permission.name,
      );
      expect(newPermissionNames).toContain('manage_orders');
      expect(newPermissionNames).toContain('view_orders');
      expect(newPermissionNames).not.toContain('manage_products');
    });

    it('should clone permissions between roles', async () => {
      // Set up source role with permissions
      const sourcePermissionIds = testPermissions.slice(0, 3).map((p) => p.id);
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: sourcePermissionIds,
          replaceExisting: false,
        },
        testUser,
      );

      // Clone to target role
      const cloneDto: CloneRolePermissionsDto = {
        sourceRoleId: adminRole.id,
        targetRoleId: buyerRole.id,
        replaceExisting: false,
      };

      const result = await rolePermissionsService.cloneRolePermissions(
        cloneDto,
        testUser,
      );

      expect(result.cloned).toBe(3);
      expect(result.skipped).toBe(0);

      // Verify target role has the permissions
      const targetRolePermissions = await rolePermissionRepository.find({
        where: { role: { id: buyerRole.id } },
        relations: ['permission'],
      });

      expect(targetRolePermissions).toHaveLength(3);
      const targetPermissionNames = targetRolePermissions.map(
        (rp) => rp.permission.name,
      );
      expect(targetPermissionNames).toContain('manage_products');
      expect(targetPermissionNames).toContain('view_products');
      expect(targetPermissionNames).toContain('manage_orders');

      // Verify audit log
      const auditLog = await activityLogRepository.findOne({
        where: { action: 'CLONE_ROLE_PERMISSIONS' },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog.description).toContain('admin');
      expect(auditLog.description).toContain('buyer');
    });

    it('should get role permissions with pagination and search', async () => {
      // Assign permissions to role
      const permissionIds = testPermissions.map((p) => p.id);
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds,
          replaceExisting: false,
        },
        testUser,
      );

      // Test pagination
      const page1 = await rolePermissionsService.getRolePermissions(
        vendorRole.id,
        {
          page: 1,
          limit: 3,
        },
      );

      expect(page1.data).toHaveLength(3);
      expect(page1.total).toBe(6);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(3);

      // Test search
      const searchResult = await rolePermissionsService.getRolePermissions(
        vendorRole.id,
        {
          search: 'manage',
          page: 1,
          limit: 10,
        },
      );

      expect(searchResult.data.length).toBeGreaterThan(0);
      searchResult.data.forEach((permission) => {
        expect(
          permission.name.includes('manage') ||
            permission.description.includes('manage'),
        ).toBe(true);
      });
    });
  });

  describe('Dual Role System Integration', () => {
    it('should handle user with business and admin roles', async () => {
      // Create a user with dual roles
      const dualRoleUser = userRepository.create({
        email: 'dualrole@test.com',
        firebaseUid: 'firebase-dual-uid',
        isVerified: true,
        role: vendorRole, // Business role
        assignedRole: adminRole, // Admin role
        fullName: 'Dual Role User',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(dualRoleUser);

      // Assign different permissions to each role
      const vendorPermissions = testPermissions.slice(0, 2); // manage_products, view_products
      const adminPermissions = testPermissions.slice(4, 6); // manage_users, view_analytics

      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: vendorPermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: adminPermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      // Test getUserEffectivePermissions
      const effectivePermissions =
        await rolePermissionsService.getUserEffectivePermissions(
          dualRoleUser.id,
        );

      expect(effectivePermissions.businessPermissions).toHaveLength(2);
      expect(effectivePermissions.adminPermissions).toHaveLength(2);
      expect(effectivePermissions.allUniquePermissions).toHaveLength(4);

      // Verify permission names
      const allPermissionNames = effectivePermissions.allUniquePermissions.map(
        (p) => p.name,
      );
      expect(allPermissionNames).toContain('manage_products'); // From vendor role
      expect(allPermissionNames).toContain('manage_users'); // From admin role
    });

    it('should deduplicate permissions across roles', async () => {
      // Create user with dual roles
      const user = userRepository.create({
        email: 'dedup@test.com',
        firebaseUid: 'firebase-dedup-uid',
        isVerified: true,
        role: vendorRole,
        assignedRole: adminRole,
        fullName: 'Dedup User',
        passwordHash: 'hashed-password',
      });
      await userRepository.save(user);

      // Assign overlapping permissions to both roles
      const sharedPermissions = testPermissions.slice(0, 2);
      const vendorOnlyPermissions = testPermissions.slice(2, 3);
      const adminOnlyPermissions = testPermissions.slice(3, 4);

      // Vendor role gets shared + vendor-only
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: [...sharedPermissions, ...vendorOnlyPermissions].map(
            (p) => p.id,
          ),
          replaceExisting: false,
        },
        testUser,
      );

      // Admin role gets shared + admin-only
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: [...sharedPermissions, ...adminOnlyPermissions].map(
            (p) => p.id,
          ),
          replaceExisting: false,
        },
        testUser,
      );

      const effectivePermissions =
        await rolePermissionsService.getUserEffectivePermissions(user.id);

      expect(effectivePermissions.businessPermissions).toHaveLength(3); // 2 shared + 1 vendor-only
      expect(effectivePermissions.adminPermissions).toHaveLength(3); // 2 shared + 1 admin-only
      expect(effectivePermissions.allUniquePermissions).toHaveLength(4); // Deduplicated
    });
  });

  describe('Analytics Integration', () => {
    it('should generate permission usage analytics', async () => {
      // Set up test data with different usage patterns
      const highUsagePermissions = testPermissions.slice(0, 2);
      const mediumUsagePermissions = testPermissions.slice(2, 4);
      const lowUsagePermissions = testPermissions.slice(4, 5);
      const unusedPermissions = testPermissions.slice(5, 6);

      // High usage: assigned to multiple roles
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: highUsagePermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: highUsagePermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: buyerRole.id,
          permissionIds: highUsagePermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      // Medium usage: assigned to two roles
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: mediumUsagePermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: mediumUsagePermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      // Low usage: assigned to one role
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: lowUsagePermissions.map((p) => p.id),
          replaceExisting: false,
        },
        testUser,
      );

      // Get analytics
      const analytics = await rolePermissionsService.getPermissionAnalytics();

      expect(analytics.totalPermissions).toBe(6);
      expect(analytics.usedPermissions).toBe(5); // All except unused
      expect(analytics.unusedPermissions).toBe(1);

      expect(analytics.mostUsedPermissions).toHaveLength(5);
      expect(analytics.mostUsedPermissions[0].usageCount).toBe(3); // High usage
      expect(analytics.mostUsedPermissions[2].usageCount).toBe(2); // Medium usage
      expect(analytics.mostUsedPermissions[4].usageCount).toBe(1); // Low usage
    });

    it('should generate role complexity analytics', async () => {
      // Assign different numbers of permissions to roles
      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: adminRole.id,
          permissionIds: testPermissions.slice(0, 5).map((p) => p.id), // 5 permissions
          replaceExisting: false,
        },
        testUser,
      );

      await rolePermissionsService.bulkAssignPermissions(
        {
          roleId: vendorRole.id,
          permissionIds: testPermissions.slice(0, 2).map((p) => p.id), // 2 permissions
          replaceExisting: false,
        },
        testUser,
      );

      // buyerRole gets no permissions

      const analytics = await rolePermissionsService.getRoleAnalytics();

      expect(analytics.totalRoles).toBe(3);
      expect(analytics.rolesWithPermissions).toBe(2); // admin, vendor
      expect(analytics.rolesWithoutPermissions).toBe(1); // buyer
      expect(analytics.averagePermissionsPerRole).toBeCloseTo(2.33, 2); // (5+2+0)/3

      expect(analytics.mostComplexRoles).toHaveLength(2);
      expect(analytics.mostComplexRoles[0].role.name).toBe('admin');
      expect(analytics.mostComplexRoles[0].permissionCount).toBe(5);
    });
  });

  describe('Route-Based Permission Integration', () => {
    it('should manage route-permission mappings', async () => {
      // Create a route
      const route = routeRepository.create({
        path: '/api/products',
        method: 'POST',
        permission: testPermissions[0], // manage_products
      });
      await routeRepository.save(route);

      // Verify route was created with permission
      const savedRoute = await routeRepository.findOne({
        where: { id: route.id },
        relations: ['permission'],
      });

      expect(savedRoute).toBeDefined();
      expect(savedRoute.permission.name).toBe('manage_products');

      // Test route lookup
      const foundRoute = await routeRepository.findOne({
        where: { path: '/api/products', method: 'POST' },
        relations: ['permission'],
      });

      expect(foundRoute).toBeDefined();
      expect(foundRoute.permission.name).toBe('manage_products');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle role not found errors', async () => {
      await expect(
        rolePermissionsService.assignPermissionToRole(
          {
            roleId: 999,
            permissionId: testPermissions[0].id,
          },
          testUser,
        ),
      ).rejects.toThrow(/Role with ID 999 not found/);
    });

    it('should handle permission not found errors', async () => {
      await expect(
        rolePermissionsService.assignPermissionToRole(
          {
            roleId: vendorRole.id,
            permissionId: 999,
          },
          testUser,
        ),
      ).rejects.toThrow(/Permission with ID 999 not found/);
    });

    it('should handle bulk assignment with some missing permissions', async () => {
      await expect(
        rolePermissionsService.bulkAssignPermissions(
          {
            roleId: vendorRole.id,
            permissionIds: [testPermissions[0].id, 999, 998],
            replaceExisting: false,
          },
          testUser,
        ),
      ).rejects.toThrow(/Permissions not found: 999, 998/);
    });

    it('should handle user not found in effective permissions', async () => {
      await expect(
        rolePermissionsService.getUserEffectivePermissions(999),
      ).rejects.toThrow(/User with ID 999 not found/);
    });
  });

  describe('Transaction Rollback Integration', () => {
    it('should rollback bulk assignment on partial failure', async () => {
      // Mock a scenario where one permission assignment fails
      const originalSave = rolePermissionRepository.save;
      let callCount = 0;

      rolePermissionRepository.save = jest.fn().mockImplementation((entity) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Simulated database error');
        }
        return originalSave.call(rolePermissionRepository, entity);
      });

      try {
        await rolePermissionsService.bulkAssignPermissions(
          {
            roleId: vendorRole.id,
            permissionIds: testPermissions.slice(0, 3).map((p) => p.id),
            replaceExisting: false,
          },
          testUser,
        );

        // Should not reach here
        expect(false).toBe(true);
      } catch (error) {
        expect(error.message).toContain('Simulated database error');
      }

      // Restore original function
      rolePermissionRepository.save = originalSave;

      // Verify no partial assignments were saved
      const rolePermissions = await rolePermissionRepository.find({
        where: { role: { id: vendorRole.id } },
      });
      expect(rolePermissions).toHaveLength(0);
    });
  });

  describe('Concurrency Integration', () => {
    it('should handle concurrent permission assignments', async () => {
      const permission = testPermissions[0];

      // Simulate concurrent assignment attempts
      const assignment1 = rolePermissionsService.assignPermissionToRole(
        {
          roleId: vendorRole.id,
          permissionId: permission.id,
        },
        testUser,
      );

      const assignment2 = rolePermissionsService.assignPermissionToRole(
        {
          roleId: vendorRole.id,
          permissionId: permission.id,
        },
        testUser,
      );

      // One should succeed, one should fail
      const results = await Promise.allSettled([assignment1, assignment2]);

      const successes = results.filter((r) => r.status === 'fulfilled').length;
      const failures = results.filter((r) => r.status === 'rejected').length;

      expect(successes).toBe(1);
      expect(failures).toBe(1);

      // Verify only one assignment exists
      const rolePermissions = await rolePermissionRepository.find({
        where: {
          role: { id: vendorRole.id },
          permission: { id: permission.id },
        },
      });
      expect(rolePermissions).toHaveLength(1);
    });
  });
});

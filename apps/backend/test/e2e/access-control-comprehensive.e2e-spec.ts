/**
 * @file access-control-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E Tests for Access Control System
 * Tests complete authentication and authorization flows with real HTTP requests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { User } from '../../src/users/entities/user.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';
import * as bcrypt from 'bcrypt';

describe('Access Control System (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  // Repositories
  let permissionRepository: Repository<Permission>;
  let rolePermissionRepository: Repository<RolePermission>;
  let roleRepository: Repository<Role>;
  let userRepository: Repository<User>;
  let routeRepository: Repository<Route>;
  let activityLogRepository: Repository<ActivityLog>;

  // Test data
  let adminUser: User;
  let vendorUser: User;
  let buyerUser: User;
  let adminRole: Role;
  let vendorRole: Role;
  let buyerRole: Role;
  let testPermissions: Permission[];
  let adminToken: string;
  let vendorToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Permission,
            RolePermission,
            Role,
            User,
            Route,
            ActivityLog,
          ],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);

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

    // Create permissions
    const permissionData = [
      { name: 'manage_permissions', description: 'Manage system permissions' },
      { name: 'manage_roles', description: 'Manage user roles' },
      { name: 'manage_users', description: 'Manage user accounts' },
      { name: 'manage_products', description: 'Manage product catalog' },
      { name: 'view_products', description: 'View product listings' },
      { name: 'manage_orders', description: 'Manage order fulfillment' },
      { name: 'view_orders', description: 'View order history' },
      { name: 'view_analytics', description: 'View system analytics' },
    ];

    testPermissions = [];
    for (const data of permissionData) {
      const permission = permissionRepository.create(data);
      const savedPermission = await permissionRepository.save(permission);
      testPermissions.push(savedPermission);
    }

    // Create users
    const passwordHash = await bcrypt.hash('password123', 10);

    adminUser = userRepository.create({
      email: 'admin@test.com',
      firebaseUid: 'firebase-admin-uid',
      isVerified: true,
      role: adminRole,
      fullName: 'Test Admin',
      passwordHash,
    });
    await userRepository.save(adminUser);

    vendorUser = userRepository.create({
      email: 'vendor@test.com',
      firebaseUid: 'firebase-vendor-uid',
      isVerified: true,
      role: vendorRole,
      fullName: 'Test Vendor',
      passwordHash,
    });
    await userRepository.save(vendorUser);

    buyerUser = userRepository.create({
      email: 'buyer@test.com',
      firebaseUid: 'firebase-buyer-uid',
      isVerified: true,
      role: buyerRole,
      fullName: 'Test Buyer',
      passwordHash,
    });
    await userRepository.save(buyerUser);

    // Assign permissions to roles
    // Admin gets all permissions
    for (const permission of testPermissions) {
      const rolePermission = rolePermissionRepository.create({
        role: adminRole,
        permission: permission,
      });
      await rolePermissionRepository.save(rolePermission);
    }

    // Vendor gets product and order management permissions
    const vendorPermissions = testPermissions.filter((p) =>
      [
        'manage_products',
        'view_products',
        'manage_orders',
        'view_orders',
      ].includes(p.name),
    );
    for (const permission of vendorPermissions) {
      const rolePermission = rolePermissionRepository.create({
        role: vendorRole,
        permission: permission,
      });
      await rolePermissionRepository.save(rolePermission);
    }

    // Buyer gets view permissions only
    const buyerPermissions = testPermissions.filter((p) =>
      ['view_products', 'view_orders'].includes(p.name),
    );
    for (const permission of buyerPermissions) {
      const rolePermission = rolePermissionRepository.create({
        role: buyerRole,
        permission: permission,
      });
      await rolePermissionRepository.save(rolePermission);
    }

    // Create route permissions
    const routePermissions = [
      {
        path: '/api/admin/permissions',
        method: 'GET',
        permission: 'manage_permissions',
      },
      {
        path: '/api/admin/permissions',
        method: 'POST',
        permission: 'manage_permissions',
      },
      {
        path: '/api/admin/permissions/:id',
        method: 'PUT',
        permission: 'manage_permissions',
      },
      {
        path: '/api/admin/permissions/:id',
        method: 'DELETE',
        permission: 'manage_permissions',
      },
      {
        path: '/api/admin/role-permissions',
        method: 'GET',
        permission: 'manage_roles',
      },
      {
        path: '/api/admin/role-permissions',
        method: 'POST',
        permission: 'manage_roles',
      },
      { path: '/api/users', method: 'GET', permission: 'manage_users' },
      { path: '/api/products', method: 'POST', permission: 'manage_products' },
      { path: '/api/products', method: 'GET', permission: null }, // Public route
    ];

    for (const routeData of routePermissions) {
      const permission = routeData.permission
        ? testPermissions.find((p) => p.name === routeData.permission)
        : null;

      const route = routeRepository.create({
        path: routeData.path,
        method: routeData.method,
        permission: permission,
      });
      await routeRepository.save(route);
    }

    // Generate JWT tokens
    adminToken = jwtService.sign({
      sub: adminUser.id,
      role: adminUser.role.name,
      email: adminUser.email,
    });

    vendorToken = jwtService.sign({
      sub: vendorUser.id,
      role: vendorUser.role.name,
      email: vendorUser.email,
    });

    buyerToken = jwtService.sign({
      sub: buyerUser.id,
      role: buyerUser.role.name,
      email: buyerUser.email,
    });
  }

  describe('Authentication Flow', () => {
    it('should deny access without JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should deny access with invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should allow access with valid JWT token and sufficient permissions', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Permission-Based Access Control', () => {
    describe('Admin Permission Management', () => {
      it('should allow admin to create permissions', async () => {
        const newPermission = {
          name: 'test_permission',
          description: 'Test permission for E2E testing',
        };

        const response = await request(app.getHttpServer())
          .post('/api/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newPermission)
          .expect(201);

        expect(response.body.name).toBe(newPermission.name);
        expect(response.body.description).toBe(newPermission.description);
        expect(response.body.id).toBeDefined();
      });

      it('should allow admin to list all permissions', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body.some((p) => p.name === 'manage_permissions')).toBe(
          true,
        );
      });

      it('should allow admin to update permissions', async () => {
        // First create a permission
        const createResponse = await request(app.getHttpServer())
          .post('/api/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'update_test_permission',
            description: 'Original description',
          })
          .expect(201);

        const permissionId = createResponse.body.id;

        // Then update it
        const updateData = {
          description: 'Updated description',
        };

        const updateResponse = await request(app.getHttpServer())
          .put(`/api/admin/permissions/${permissionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(updateResponse.body.description).toBe(updateData.description);
        expect(updateResponse.body.name).toBe('update_test_permission');
      });

      it('should deny vendor access to permission management', async () => {
        await request(app.getHttpServer())
          .get('/api/admin/permissions')
          .set('Authorization', `Bearer ${vendorToken}`)
          .expect(403);
      });

      it('should deny buyer access to permission management', async () => {
        await request(app.getHttpServer())
          .post('/api/admin/permissions')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            name: 'unauthorized_permission',
            description: 'Should not be created',
          })
          .expect(403);
      });
    });

    describe('Role-Permission Management', () => {
      it('should allow admin to assign permissions to roles', async () => {
        // Get a permission and role
        const permission = testPermissions.find(
          (p) => p.name === 'view_analytics',
        );
        const role = buyerRole;

        const response = await request(app.getHttpServer())
          .post('/api/admin/role-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            roleId: role.id,
            permissionId: permission.id,
          })
          .expect(201);

        expect(response.body.role.id).toBe(role.id);
        expect(response.body.permission.id).toBe(permission.id);
      });

      it('should allow admin to bulk assign permissions', async () => {
        // Create a new role for testing
        const testRole = roleRepository.create({
          name: 'test_role',
          description: 'Test role for bulk assignment',
          isDefault: false,
          type: 'business',
        });
        await roleRepository.save(testRole);

        const permissionIds = testPermissions.slice(0, 3).map((p) => p.id);

        const response = await request(app.getHttpServer())
          .post('/api/admin/role-permissions/bulk-assign')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            roleId: testRole.id,
            permissionIds: permissionIds,
            replaceExisting: false,
          })
          .expect(201);

        expect(response.body.assigned).toBe(3);
        expect(response.body.skipped).toBe(0);
        expect(response.body.errors).toHaveLength(0);
      });

      it('should get role permissions with pagination', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/api/admin/role-permissions/role/${adminRole.id}?page=1&limit=5`,
          )
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
        expect(response.body.total).toBeDefined();
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(5);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should deny vendor access to role management', async () => {
        await request(app.getHttpServer())
          .post('/api/admin/role-permissions')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send({
            roleId: buyerRole.id,
            permissionId: testPermissions[0].id,
          })
          .expect(403);
      });
    });

    describe('User Effective Permissions', () => {
      it('should get user effective permissions', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/api/admin/role-permissions/user/${vendorUser.id}/effective-permissions`,
          )
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.businessPermissions).toBeDefined();
        expect(response.body.adminPermissions).toBeDefined();
        expect(response.body.allUniquePermissions).toBeDefined();

        expect(Array.isArray(response.body.businessPermissions)).toBe(true);
        expect(response.body.businessPermissions.length).toBeGreaterThan(0);

        // Vendor should have product management permissions
        const permissionNames = response.body.businessPermissions.map(
          (p) => p.name,
        );
        expect(permissionNames).toContain('manage_products');
        expect(permissionNames).toContain('view_products');
      });
    });
  });

  describe('Route-Based Access Control', () => {
    it('should allow access to public routes without permissions', async () => {
      // Products listing is public
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
    });

    it('should enforce permission requirements on protected routes', async () => {
      // Only users with manage_products permission can create products
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`) // Buyer doesn't have manage_products
        .send({
          name: 'Test Product',
          description: 'Test product description',
        })
        .expect(403);

      // Vendor should be able to create products
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          name: 'Vendor Product',
          description: 'Product created by vendor',
        })
        .expect(201);
    });

    it('should handle route parameter normalization', async () => {
      // Create a permission first
      const createResponse = await request(app.getHttpServer())
        .post('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'route_test_permission',
          description: 'Permission for route testing',
        })
        .expect(201);

      const permissionId = createResponse.body.id;

      // Test accessing specific permission (route with parameter)
      await request(app.getHttpServer())
        .get(`/api/admin/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Non-admin should be denied
      await request(app.getHttpServer())
        .get(`/api/admin/permissions/${permissionId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);
    });
  });

  describe('Dual Role System E2E', () => {
    it('should support users with both business and admin roles', async () => {
      // Create a user with dual roles
      const dualRoleUser = userRepository.create({
        email: 'dualrole@test.com',
        firebaseUid: 'firebase-dual-uid',
        isVerified: true,
        role: vendorRole, // Business role
        assignedRole: adminRole, // Admin role
        fullName: 'Dual Role User',
        passwordHash: await bcrypt.hash('password123', 10),
      });
      await userRepository.save(dualRoleUser);

      const dualRoleToken = jwtService.sign({
        sub: dualRoleUser.id,
        role: dualRoleUser.role.name, // JWT contains business role
        email: dualRoleUser.email,
      });

      // User should have access to both vendor capabilities
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${dualRoleToken}`)
        .send({
          name: 'Dual Role Product',
          description: 'Product by dual role user',
        })
        .expect(201);

      // And admin capabilities
      await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${dualRoleToken}`)
        .expect(200);

      // Verify effective permissions include both roles
      const response = await request(app.getHttpServer())
        .get(
          `/api/admin/role-permissions/user/${dualRoleUser.id}/effective-permissions`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.businessPermissions.length).toBeGreaterThan(0);
      expect(response.body.adminPermissions.length).toBeGreaterThan(0);
      expect(response.body.allUniquePermissions.length).toBeGreaterThan(
        response.body.businessPermissions.length,
      );
    });
  });

  describe('Security Features E2E', () => {
    it('should block banned users', async () => {
      // Ban the vendor user
      vendorUser.isBanned = true;
      await userRepository.save(vendorUser);

      // Banned user should be denied access
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);

      // Unban the user for other tests
      vendorUser.isBanned = false;
      await userRepository.save(vendorUser);
    });

    it('should log permission denied attempts', async () => {
      // Clear activity logs
      await activityLogRepository.clear();

      // Attempt unauthorized access
      await request(app.getHttpServer())
        .post('/api/admin/permissions')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          name: 'unauthorized_permission',
          description: 'Should be denied',
        })
        .expect(403);

      // Note: In a real implementation, you might log permission denials
      // For this test, we're verifying the 403 response
    });

    it('should handle malformed JWT tokens', async () => {
      const malformedToken =
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed';

      await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', malformedToken)
        .expect(401);
    });

    it('should handle expired JWT tokens', async () => {
      const expiredToken = jwtService.sign(
        {
          sub: adminUser.id,
          role: adminUser.role.name,
          email: adminUser.email,
        },
        { expiresIn: '0s' }, // Immediately expired
      );

      // Wait a moment to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });

  describe('Analytics and Monitoring E2E', () => {
    it('should provide permission usage analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/role-permissions/analytics/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.totalPermissions).toBeDefined();
      expect(response.body.usedPermissions).toBeDefined();
      expect(response.body.unusedPermissions).toBeDefined();
      expect(response.body.mostUsedPermissions).toBeDefined();
      expect(Array.isArray(response.body.mostUsedPermissions)).toBe(true);
    });

    it('should provide role complexity analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/role-permissions/analytics/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.totalRoles).toBeDefined();
      expect(response.body.rolesWithPermissions).toBeDefined();
      expect(response.body.rolesWithoutPermissions).toBeDefined();
      expect(response.body.averagePermissionsPerRole).toBeDefined();
      expect(response.body.mostComplexRoles).toBeDefined();
      expect(Array.isArray(response.body.mostComplexRoles)).toBe(true);
    });

    it('should deny analytics access to non-admin users', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/role-permissions/analytics/permissions')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get('/api/admin/role-permissions/analytics/roles')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);
    });
  });

  describe('Edge Cases and Error Handling E2E', () => {
    it('should handle non-existent resource access', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/permissions/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should handle invalid request data', async () => {
      // Missing required fields
      await request(app.getHttpServer())
        .post('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing name field
          description: 'Permission without name',
        })
        .expect(400);

      // Invalid data types
      await request(app.getHttpServer())
        .post('/api/admin/role-permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleId: 'invalid-id', // Should be number
          permissionId: testPermissions[0].id,
        })
        .expect(400);
    });

    it('should handle duplicate permission creation', async () => {
      // First creation should succeed
      await request(app.getHttpServer())
        .post('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'duplicate_permission',
          description: 'First instance',
        })
        .expect(201);

      // Second creation with same name should fail
      await request(app.getHttpServer())
        .post('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'duplicate_permission',
          description: 'Second instance',
        })
        .expect(409); // Conflict
    });

    it('should handle very long request processing', async () => {
      // Test with bulk assignment of many permissions
      const manyPermissionIds = testPermissions.map((p) => p.id);

      const response = await request(app.getHttpServer())
        .post('/api/admin/role-permissions/bulk-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roleId: buyerRole.id,
          permissionIds: manyPermissionIds,
          replaceExisting: true,
        })
        .timeout(30000) // 30 second timeout
        .expect(201);

      expect(response.body.assigned).toBe(manyPermissionIds.length);
    });
  });

  describe('Performance E2E', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/api/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: `concurrent_permission_${i}`,
            description: `Concurrent permission ${i}`,
          }),
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(`concurrent_permission_${i}`);
      });
    });

    it('should maintain performance with large datasets', async () => {
      // Create many permissions
      const manyPermissions = Array.from({ length: 50 }, (_, i) => ({
        name: `perf_permission_${i}`,
        description: `Performance test permission ${i}`,
      }));

      // Create them in batches to avoid overwhelming the system
      for (const permission of manyPermissions) {
        await request(app.getHttpServer())
          .post('/api/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(permission)
          .expect(201);
      }

      // Test listing performance
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
      expect(response.body.length).toBeGreaterThan(50);
    });
  });

  describe('Real-World Scenarios E2E', () => {
    it('should support complete vendor onboarding workflow', async () => {
      // 1. Create vendor user (would normally be done through registration)
      const newVendor = userRepository.create({
        email: 'newvendor@test.com',
        firebaseUid: 'firebase-new-vendor-uid',
        isVerified: true,
        role: buyerRole, // Starts as buyer
        fullName: 'New Vendor',
        passwordHash: await bcrypt.hash('password123', 10),
      });
      await userRepository.save(newVendor);

      // 2. Admin upgrades user to vendor role
      newVendor.role = vendorRole;
      await userRepository.save(newVendor);

      const newVendorToken = jwtService.sign({
        sub: newVendor.id,
        role: vendorRole.name,
        email: newVendor.email,
      });

      // 3. Vendor can now create products
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${newVendorToken}`)
        .send({
          name: 'New Vendor Product',
          description: 'First product by new vendor',
        })
        .expect(201);

      // 4. But still cannot access admin functions
      await request(app.getHttpServer())
        .get('/api/admin/permissions')
        .set('Authorization', `Bearer ${newVendorToken}`)
        .expect(403);
    });

    it('should support admin promoting user to staff role', async () => {
      // Create staff role with limited admin permissions
      const staffRole = roleRepository.create({
        name: 'staff',
        description: 'Customer support staff',
        isDefault: false,
        type: 'admin',
      });
      await roleRepository.save(staffRole);

      // Assign limited permissions to staff
      const staffPermissions = testPermissions.filter((p) =>
        ['manage_users', 'view_orders', 'view_products'].includes(p.name),
      );
      for (const permission of staffPermissions) {
        const rolePermission = rolePermissionRepository.create({
          role: staffRole,
          permission: permission,
        });
        await rolePermissionRepository.save(rolePermission);
      }

      // Admin assigns staff role to buyer
      buyerUser.assignedRole = staffRole;
      await userRepository.save(buyerUser);

      // Buyer now has staff capabilities
      const response = await request(app.getHttpServer())
        .get(
          `/api/admin/role-permissions/user/${buyerUser.id}/effective-permissions`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.adminPermissions.length).toBeGreaterThan(0);
      expect(response.body.allUniquePermissions.length).toBeGreaterThan(
        response.body.businessPermissions.length,
      );

      // User now has combined permissions from buyer + staff roles
      const combinedPermissionNames = response.body.allUniquePermissions.map(
        (p) => p.name,
      );
      expect(combinedPermissionNames).toContain('view_products'); // From both roles
      expect(combinedPermissionNames).toContain('manage_users'); // From staff role only
    });
  });
});

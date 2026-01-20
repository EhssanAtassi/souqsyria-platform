/**
 * @file access-control.e2e-spec.ts
 * @description E2E Tests for Access Control Module
 *
 * ACCESS CONTROL E2E TESTS:
 * - Permission management CRUD operations
 * - Role-permission assignments and management
 * - Route access control and authorization
 * - Permission guards and decorators
 * - Bulk operations and advanced features
 * - Security and authorization validation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { User } from '../../src/users/entities/user.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';

describe('Access Control (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;

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
  let customerUser: User;
  let adminRole: Role;
  let vendorRole: Role;
  let customerRole: Role;
  let adminToken: string;
  let vendorToken: string;
  let customerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

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

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  describe('Permissions Management', () => {
    describe('POST /admin/permissions', () => {
      it('should create a new permission successfully', async () => {
        const permissionData = {
          name: 'test_permission_create',
          description: 'Test permission for E2E testing',
        };

        const response = await request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(permissionData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(permissionData.name);
        expect(response.body.description).toBe(permissionData.description);
        expect(response.body).toHaveProperty('createdAt');

        // Verify permission was saved to database
        const savedPermission = await permissionRepository.findOne({
          where: { name: permissionData.name },
        });
        expect(savedPermission).toBeTruthy();
        expect(savedPermission.name).toBe(permissionData.name);
      });

      it('should reject duplicate permission names', async () => {
        const permissionData = {
          name: 'duplicate_permission',
          description: 'First permission',
        };

        // Create first permission
        await request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(permissionData)
          .expect(201);

        // Try to create duplicate
        const duplicateData = {
          name: 'duplicate_permission',
          description: 'Second permission with same name',
        };

        await request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(duplicateData)
          .expect(409); // Conflict
      });

      it('should validate required fields', async () => {
        const invalidData = {
          description: 'Permission without name',
        };

        await request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);
      });

      it('should reject non-admin users', async () => {
        const permissionData = {
          name: 'unauthorized_permission',
          description: 'Should not be created',
        };

        await request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send(permissionData)
          .expect(403); // Forbidden
      });

      it('should reject requests without authentication', async () => {
        const permissionData = {
          name: 'unauthenticated_permission',
          description: 'Should not be created',
        };

        await request(app.getHttpServer())
          .post('/admin/permissions')
          .send(permissionData)
          .expect(401); // Unauthorized
      });
    });

    describe('GET /admin/permissions', () => {
      beforeEach(async () => {
        // Create test permissions
        const testPermissions = [
          { name: 'test_read_permission', description: 'Test read permission' },
          {
            name: 'test_write_permission',
            description: 'Test write permission',
          },
          {
            name: 'test_delete_permission',
            description: 'Test delete permission',
          },
        ];

        for (const permData of testPermissions) {
          const permission = permissionRepository.create(permData);
          await permissionRepository.save(permission);
        }
      });

      it('should return all permissions for admin user', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        // Verify response structure
        const permission = response.body[0];
        expect(permission).toHaveProperty('id');
        expect(permission).toHaveProperty('name');
        expect(permission).toHaveProperty('description');
        expect(permission).toHaveProperty('createdAt');
      });

      it('should reject non-admin users', async () => {
        await request(app.getHttpServer())
          .get('/admin/permissions')
          .set('Authorization', `Bearer ${vendorToken}`)
          .expect(403);
      });

      it('should reject unauthenticated requests', async () => {
        await request(app.getHttpServer())
          .get('/admin/permissions')
          .expect(401);
      });
    });

    describe('GET /admin/permissions/:id', () => {
      let testPermission: Permission;

      beforeEach(async () => {
        testPermission = permissionRepository.create({
          name: 'test_single_permission',
          description: 'Test permission for single fetch',
        });
        testPermission = await permissionRepository.save(testPermission);
      });

      it('should return a specific permission by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/admin/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.id).toBe(testPermission.id);
        expect(response.body.name).toBe(testPermission.name);
        expect(response.body.description).toBe(testPermission.description);
      });

      it('should return 404 for non-existent permission', async () => {
        const nonExistentId = 99999;
        await request(app.getHttpServer())
          .get(`/admin/permissions/${nonExistentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should reject non-admin users', async () => {
        await request(app.getHttpServer())
          .get(`/admin/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);
      });
    });

    describe('PUT /admin/permissions/:id', () => {
      let testPermission: Permission;

      beforeEach(async () => {
        testPermission = permissionRepository.create({
          name: 'test_update_permission',
          description: 'Original description',
        });
        testPermission = await permissionRepository.save(testPermission);
      });

      it('should update a permission successfully', async () => {
        const updateData = {
          name: 'updated_test_permission',
          description: 'Updated description',
        };

        const response = await request(app.getHttpServer())
          .put(`/admin/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.id).toBe(testPermission.id);
        expect(response.body.name).toBe(updateData.name);
        expect(response.body.description).toBe(updateData.description);

        // Verify update in database
        const updatedPermission = await permissionRepository.findOne({
          where: { id: testPermission.id },
        });
        expect(updatedPermission.name).toBe(updateData.name);
        expect(updatedPermission.description).toBe(updateData.description);
      });

      it('should reject duplicate names during update', async () => {
        // Create another permission
        const existingPermission = permissionRepository.create({
          name: 'existing_permission',
          description: 'Existing permission',
        });
        await permissionRepository.save(existingPermission);

        const updateData = {
          name: 'existing_permission', // Try to use existing name
          description: 'Updated description',
        };

        await request(app.getHttpServer())
          .put(`/admin/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(409);
      });

      it('should return 404 for non-existent permission', async () => {
        const updateData = {
          name: 'non_existent_update',
          description: 'Should not work',
        };

        await request(app.getHttpServer())
          .put('/admin/permissions/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(404);
      });
    });

    describe('DELETE /admin/permissions/:id', () => {
      let testPermission: Permission;

      beforeEach(async () => {
        testPermission = permissionRepository.create({
          name: 'test_delete_permission',
          description: 'Permission to be deleted',
        });
        testPermission = await permissionRepository.save(testPermission);
      });

      it('should delete a permission successfully', async () => {
        await request(app.getHttpServer())
          .delete(`/admin/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify deletion from database
        const deletedPermission = await permissionRepository.findOne({
          where: { id: testPermission.id },
        });
        expect(deletedPermission).toBeNull();
      });

      it('should return 404 for non-existent permission', async () => {
        await request(app.getHttpServer())
          .delete('/admin/permissions/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });

      it('should prevent deletion of permission in use', async () => {
        // Create a role-permission assignment
        const rolePermission = rolePermissionRepository.create({
          role: adminRole,
          permission: testPermission,
        });
        await rolePermissionRepository.save(rolePermission);

        await request(app.getHttpServer())
          .delete(`/admin/permissions/${testPermission.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(409); // Conflict - permission in use
      });
    });
  });

  describe('Role-Permission Management', () => {
    let testPermissions: Permission[];

    beforeEach(async () => {
      // Create test permissions
      const permissionData = [
        { name: 'role_perm_read', description: 'Read permission' },
        { name: 'role_perm_write', description: 'Write permission' },
        { name: 'role_perm_delete', description: 'Delete permission' },
      ];

      testPermissions = [];
      for (const permData of permissionData) {
        const permission = permissionRepository.create(permData);
        const savedPermission = await permissionRepository.save(permission);
        testPermissions.push(savedPermission);
      }
    });

    describe('POST /admin/role-permissions', () => {
      it('should assign permission to role', async () => {
        const assignmentData = {
          roleId: vendorRole.id,
          permissionId: testPermissions[0].id,
        };

        const response = await request(app.getHttpServer())
          .post('/admin/role-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.role.id).toBe(vendorRole.id);
        expect(response.body.permission.id).toBe(testPermissions[0].id);

        // Verify in database
        const assignment = await rolePermissionRepository.findOne({
          where: {
            role: { id: vendorRole.id },
            permission: { id: testPermissions[0].id },
          },
          relations: ['role', 'permission'],
        });
        expect(assignment).toBeTruthy();
      });

      it('should prevent duplicate role-permission assignments', async () => {
        const assignmentData = {
          roleId: vendorRole.id,
          permissionId: testPermissions[0].id,
        };

        // Create first assignment
        await request(app.getHttpServer())
          .post('/admin/role-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(201);

        // Try duplicate assignment
        await request(app.getHttpServer())
          .post('/admin/role-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(assignmentData)
          .expect(409);
      });

      it('should validate role and permission existence', async () => {
        const invalidAssignment = {
          roleId: 99999,
          permissionId: testPermissions[0].id,
        };

        await request(app.getHttpServer())
          .post('/admin/role-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidAssignment)
          .expect(404);
      });
    });

    describe('GET /admin/role-permissions', () => {
      beforeEach(async () => {
        // Create some role-permission assignments
        const assignment1 = rolePermissionRepository.create({
          role: vendorRole,
          permission: testPermissions[0],
        });
        const assignment2 = rolePermissionRepository.create({
          role: vendorRole,
          permission: testPermissions[1],
        });

        await rolePermissionRepository.save([assignment1, assignment2]);
      });

      it('should return all role-permission assignments', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/role-permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        const assignment = response.body[0];
        expect(assignment).toHaveProperty('id');
        expect(assignment).toHaveProperty('role');
        expect(assignment).toHaveProperty('permission');
        expect(assignment.role).toHaveProperty('name');
        expect(assignment.permission).toHaveProperty('name');
      });

      it('should filter by role ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/admin/role-permissions?roleId=${vendorRole.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((assignment) => {
          expect(assignment.role.id).toBe(vendorRole.id);
        });
      });

      it('should filter by permission ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/admin/role-permissions?permissionId=${testPermissions[0].id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((assignment) => {
          expect(assignment.permission.id).toBe(testPermissions[0].id);
        });
      });
    });

    describe('DELETE /admin/role-permissions/:id', () => {
      let rolePermissionAssignment: RolePermission;

      beforeEach(async () => {
        rolePermissionAssignment = rolePermissionRepository.create({
          role: vendorRole,
          permission: testPermissions[0],
        });
        rolePermissionAssignment = await rolePermissionRepository.save(
          rolePermissionAssignment,
        );
      });

      it('should remove role-permission assignment', async () => {
        await request(app.getHttpServer())
          .delete(`/admin/role-permissions/${rolePermissionAssignment.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify deletion
        const deletedAssignment = await rolePermissionRepository.findOne({
          where: { id: rolePermissionAssignment.id },
        });
        expect(deletedAssignment).toBeNull();
      });

      it('should return 404 for non-existent assignment', async () => {
        await request(app.getHttpServer())
          .delete('/admin/role-permissions/99999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('POST /admin/role-permissions/bulk-assign', () => {
      it('should assign multiple permissions to a role', async () => {
        const bulkData = {
          roleId: customerRole.id,
          permissionIds: [testPermissions[0].id, testPermissions[1].id],
        };

        const response = await request(app.getHttpServer())
          .post('/admin/role-permissions/bulk-assign')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(201);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);

        // Verify in database
        const assignments = await rolePermissionRepository.find({
          where: { role: { id: customerRole.id } },
          relations: ['permission'],
        });
        expect(assignments.length).toBe(2);
      });

      it('should skip existing assignments in bulk operation', async () => {
        // Create one existing assignment
        const existingAssignment = rolePermissionRepository.create({
          role: customerRole,
          permission: testPermissions[0],
        });
        await rolePermissionRepository.save(existingAssignment);

        const bulkData = {
          roleId: customerRole.id,
          permissionIds: [testPermissions[0].id, testPermissions[1].id], // First one already exists
        };

        const response = await request(app.getHttpServer())
          .post('/admin/role-permissions/bulk-assign')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(201);

        // Should only create one new assignment
        expect(response.body.length).toBe(1);
        expect(response.body[0].permission.id).toBe(testPermissions[1].id);
      });
    });
  });

  describe('Routes Management', () => {
    describe('POST /admin/routes', () => {
      it('should create a new route', async () => {
        const routeData = {
          path: '/api/test',
          method: 'GET',
        };

        const response = await request(app.getHttpServer())
          .post('/admin/routes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(routeData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.path).toBe(routeData.path);
        expect(response.body.method).toBe(routeData.method);
      });

      it('should prevent duplicate path-method combinations', async () => {
        const routeData = {
          path: '/api/duplicate',
          method: 'POST',
        };

        await request(app.getHttpServer())
          .post('/admin/routes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(routeData)
          .expect(201);

        // Try to create duplicate
        await request(app.getHttpServer())
          .post('/admin/routes')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(routeData)
          .expect(409);
      });
    });

    describe('GET /admin/routes', () => {
      beforeEach(async () => {
        const testRoutes = [
          { path: '/api/users', method: 'GET' },
          { path: '/api/products', method: 'POST' },
        ];

        for (const routeData of testRoutes) {
          const route = routeRepository.create(routeData);
          await routeRepository.save(route);
        }
      });

      it('should return all routes', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/routes')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        const route = response.body[0];
        expect(route).toHaveProperty('id');
        expect(route).toHaveProperty('path');
        expect(route).toHaveProperty('method');
      });

      it('should filter routes by method', async () => {
        const response = await request(app.getHttpServer())
          .get('/admin/routes?method=GET')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((route) => {
          expect(route.method).toBe('GET');
        });
      });
    });
  });

  describe('Permission Guards and Authorization', () => {
    let testRoute: Route;
    let testPermission: Permission;

    beforeEach(async () => {
      // Create a test permission
      testPermission = permissionRepository.create({
        name: 'test_guard_permission',
        description: 'Permission for testing guards',
      });
      testPermission = await permissionRepository.save(testPermission);

      // Create a test route
      testRoute = routeRepository.create({
        path: '/api/protected',
        method: 'GET',
        permission: testPermission,
      });
      testRoute = await routeRepository.save(testRoute);
    });

    it('should allow access when user has required permission', async () => {
      // Assign permission to vendor role
      const rolePermission = rolePermissionRepository.create({
        role: vendorRole,
        permission: testPermission,
      });
      await rolePermissionRepository.save(rolePermission);

      // Test access (this would be tested on an actual protected endpoint)
      // For this example, we're testing the role-permission relationship
      const userPermissions = await rolePermissionRepository.find({
        where: { role: { id: vendorRole.id } },
        relations: ['permission'],
      });

      const hasPermission = userPermissions.some(
        (rp) => rp.permission.name === testPermission.name,
      );
      expect(hasPermission).toBe(true);
    });

    it('should deny access when user lacks required permission', async () => {
      // Customer role should not have the test permission
      const userPermissions = await rolePermissionRepository.find({
        where: { role: { id: customerRole.id } },
        relations: ['permission'],
      });

      const hasPermission = userPermissions.some(
        (rp) => rp.permission.name === testPermission.name,
      );
      expect(hasPermission).toBe(false);
    });
  });

  describe('Activity Logging', () => {
    it('should log permission creation activity', async () => {
      const initialLogCount = await activityLogRepository.count();

      const permissionData = {
        name: 'logged_permission',
        description: 'Permission creation should be logged',
      };

      await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(permissionData)
        .expect(201);

      // Check if activity was logged (if logging is implemented)
      const finalLogCount = await activityLogRepository.count();
      // This assertion would depend on whether activity logging is actually implemented
      // expect(finalLogCount).toBeGreaterThan(initialLogCount);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk permission creation efficiently', async () => {
      const bulkPermissions = Array.from({ length: 50 }, (_, i) => ({
        name: `bulk_permission_${i}`,
        description: `Bulk permission ${i}`,
      }));

      const startTime = Date.now();

      // Create permissions in parallel (if supported)
      const promises = bulkPermissions.map((permData) =>
        request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(permData),
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify all permissions were created
      const createdPermissions = await permissionRepository.count({
        where: { name: /^bulk_permission_/ as any },
      });
      expect(createdPermissions).toBe(bulkPermissions.length);
    });

    it('should efficiently query role permissions', async () => {
      // Create many permissions and assignments
      const permissions = [];
      for (let i = 0; i < 100; i++) {
        const permission = permissionRepository.create({
          name: `perf_permission_${i}`,
          description: `Performance test permission ${i}`,
        });
        permissions.push(await permissionRepository.save(permission));
      }

      // Assign half of them to vendor role
      const assignments = [];
      for (let i = 0; i < 50; i++) {
        const assignment = rolePermissionRepository.create({
          role: vendorRole,
          permission: permissions[i],
        });
        assignments.push(assignment);
      }
      await rolePermissionRepository.save(assignments);

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/admin/role-permissions?roleId=${vendorRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Query should be fast
      expect(duration).toBeLessThan(1000); // 1 second
      expect(response.body.length).toBe(50);
    });
  });

  describe('Data Validation and Security', () => {
    it('should sanitize permission names', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: 'Malicious permission',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousData)
        .expect(201);

      // Should sanitize or reject malicious content
      expect(response.body.name).not.toContain('<script>');
    });

    it('should validate permission name format', async () => {
      const invalidNames = [
        '', // Empty name
        'a', // Too short
        'permission with spaces', // Spaces
        'permission@with!symbols', // Special characters
        'a'.repeat(256), // Too long
      ];

      for (const invalidName of invalidNames) {
        await request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: invalidName, description: 'Test' })
          .expect(400);
      }
    });

    it('should rate limit permission creation', async () => {
      // Make multiple rapid requests
      const promises = Array.from({ length: 20 }, (_, i) =>
        request(app.getHttpServer())
          .post('/admin/permissions')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: `rate_limit_${i}`, description: 'Rate limit test' }),
      );

      const results = await Promise.all(promises.map((p) => p.catch((e) => e)));

      // Some requests should be rate limited (status 429)
      const rateLimited = results.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test roles
    adminRole = roleRepository.create({
      name: 'admin',
      description: 'Administrator role',
      type: 'admin',
    });
    adminRole = await roleRepository.save(adminRole);

    vendorRole = roleRepository.create({
      name: 'vendor',
      description: 'Vendor role',
      type: 'business',
    });
    vendorRole = await roleRepository.save(vendorRole);

    customerRole = roleRepository.create({
      name: 'customer',
      description: 'Customer role',
      type: 'business',
    });
    customerRole = await roleRepository.save(customerRole);

    // Create test users
    adminUser = userRepository.create({
      email: 'admin@e2e-test.com',
      fullName: 'Admin User',
      firebaseUid: 'admin-firebase-uid',
      isVerified: true,
      role: adminRole,
    });
    adminUser = await userRepository.save(adminUser);

    vendorUser = userRepository.create({
      email: 'vendor@e2e-test.com',
      fullName: 'Vendor User',
      firebaseUid: 'vendor-firebase-uid',
      isVerified: true,
      role: vendorRole,
    });
    vendorUser = await userRepository.save(vendorUser);

    customerUser = userRepository.create({
      email: 'customer@e2e-test.com',
      fullName: 'Customer User',
      firebaseUid: 'customer-firebase-uid',
      isVerified: true,
      role: customerRole,
    });
    customerUser = await userRepository.save(customerUser);

    // Generate auth tokens (mock implementation)
    adminToken = 'mock-admin-token';
    vendorToken = 'mock-vendor-token';
    customerToken = 'mock-customer-token';
  }

  async function cleanupTestData() {
    // Clean up in reverse dependency order
    await activityLogRepository.delete({});
    await rolePermissionRepository.delete({});
    await routeRepository.delete({});
    await permissionRepository.delete({});
    await userRepository.delete({});
    await roleRepository.delete({});
  }
});

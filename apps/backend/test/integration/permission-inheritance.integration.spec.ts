/**
 * @file permission-inheritance.integration.spec.ts
 * @description Comprehensive Integration Tests for Permission Inheritance in the RBAC System
 *
 * Tests the full flow from HTTP request -> JWT Guard -> Permissions Guard -> Controller -> Service -> Database
 *
 * DUAL-ROLE ARCHITECTURE:
 * - Business Role (User.role): buyer, vendor (for business logic)
 * - Admin Role (User.assignedRole): admin, moderator, support (for admin panel access)
 * - Combined Permissions: User's effective permissions = business role permissions + admin role permissions
 *
 * TEST COVERAGE:
 * - Dual-Role Permission Inheritance (8 cases)
 * - Role Hierarchy & Priority (4 cases)
 * - Full HTTP Request Flow (5 cases)
 * - Permission Revocation & Real-Time Updates (3 cases)
 *
 * PERFORMANCE REQUIREMENTS:
 * - Each test should complete in <500ms
 * - Concurrent test (100 requests) should complete in <2000ms
 * - Uses transactions for database isolation between tests
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';

// Modules
import { AppModule } from '../../src/app.module';
import { AccessControlModule } from '../../src/access-control/access-control.module';
import { RolesModule } from '../../src/roles/roles.module';
import { UsersModule } from '../../src/users/users.module';
import { AuthModule } from '../../src/auth/auth.module';

// Entities
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { User } from '../../src/users/entities/user.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';
import { SecurityAuditLog } from '../../src/access-control/entities/security-audit-log.entity';

// Services
import { PermissionsService } from '../../src/access-control/permissions/permissions.service';
import { RolePermissionsService } from '../../src/access-control/role-permissions/role-permissions.service';
import { RoutesService } from '../../src/access-control/routes/routes.service';
import { SecurityAuditService } from '../../src/access-control/security-audit/security-audit.service';

// Helpers
import { TestUserFactory, TestUserType } from '../helpers/test-users.helper';
import { TestAuthHelper } from '../helpers/test-auth.helper';
import { TestDatabaseHelper, TestPermissions, TestRoles } from '../helpers/test-database.helper';

describe('Permission Inheritance Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let moduleRef: TestingModule;

  // Repositories
  let permissionRepository: Repository<Permission>;
  let rolePermissionRepository: Repository<RolePermission>;
  let roleRepository: Repository<Role>;
  let userRepository: Repository<User>;
  let routeRepository: Repository<Route>;
  let activityLogRepository: Repository<ActivityLog>;
  let securityAuditLogRepository: Repository<SecurityAuditLog>;

  // Services
  let permissionsService: PermissionsService;
  let rolePermissionsService: RolePermissionsService;
  let routesService: RoutesService;
  let securityAuditService: SecurityAuditService;
  let jwtService: JwtService;

  // Test Helpers
  let userFactory: TestUserFactory;
  let authHelper: TestAuthHelper;
  let dbHelper: TestDatabaseHelper;

  // Test Data
  let testRoles: TestRoles;
  let testPermissions: TestPermissions;
  let adminUser: User;

  /**
   * Initialize the testing module and seed the database
   */
  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_TEST_PORT) || 3308,
          username: process.env.DB_USER || 'root',
          password: process.env.DB_PASS || '',
          database: process.env.DB_TEST_NAME || 'souq_syria_permission_test',
          entities: [
            Permission,
            RolePermission,
            Role,
            User,
            Route,
            ActivityLog,
            SecurityAuditLog,
          ],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        AccessControlModule,
        RolesModule,
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Get services and repositories
    dataSource = moduleRef.get<DataSource>(DataSource);
    jwtService = moduleRef.get<JwtService>(JwtService);
    permissionsService = moduleRef.get<PermissionsService>(PermissionsService);
    rolePermissionsService = moduleRef.get<RolePermissionsService>(RolePermissionsService);
    routesService = moduleRef.get<RoutesService>(RoutesService);
    securityAuditService = moduleRef.get<SecurityAuditService>(SecurityAuditService);

    // Get repositories
    permissionRepository = moduleRef.get<Repository<Permission>>(getRepositoryToken(Permission));
    rolePermissionRepository = moduleRef.get<Repository<RolePermission>>(getRepositoryToken(RolePermission));
    roleRepository = moduleRef.get<Repository<Role>>(getRepositoryToken(Role));
    userRepository = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    routeRepository = moduleRef.get<Repository<Route>>(getRepositoryToken(Route));
    activityLogRepository = moduleRef.get<Repository<ActivityLog>>(getRepositoryToken(ActivityLog));
    securityAuditLogRepository = moduleRef.get<Repository<SecurityAuditLog>>(getRepositoryToken(SecurityAuditLog));

    // Initialize helpers
    userFactory = new TestUserFactory(userRepository, roleRepository);
    authHelper = new TestAuthHelper(jwtService);
    dbHelper = new TestDatabaseHelper(
      roleRepository,
      permissionRepository,
      rolePermissionRepository,
      routeRepository,
      userRepository,
      activityLogRepository,
      securityAuditLogRepository,
    );
  });

  /**
   * Reset database and seed fresh test data before each test
   */
  beforeEach(async () => {
    // Clean up database in correct order (respect foreign keys)
    await dbHelper.cleanDatabase();

    // Seed test data
    const seedResult = await dbHelper.seedTestData();
    testRoles = seedResult.roles;
    testPermissions = seedResult.permissions;

    // Create admin user for test operations
    adminUser = await userFactory.createUser(TestUserType.ADMIN_ONLY, testRoles);
  });

  /**
   * Close connections after all tests
   */
  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  /**
   * SECTION 1: Dual-Role Permission Inheritance (8 cases)
   * Tests the combination of business role and admin role permissions
   */
  describe('Dual-Role Permission Inheritance', () => {
    it('should combine permissions from business role and admin role', async () => {
      // Arrange: Create user with buyer (business) + moderator (admin)
      const user = await userFactory.createUser(TestUserType.BUYER_MODERATOR, testRoles);

      // Act: Get effective permissions
      const effectivePermissions = await rolePermissionsService.getUserEffectivePermissions(user.id);

      // Assert: User should have permissions from both roles
      expect(effectivePermissions.businessPermissions.length).toBeGreaterThan(0);
      expect(effectivePermissions.adminPermissions.length).toBeGreaterThan(0);

      // Buyer permissions should include view_products
      const businessPermNames = effectivePermissions.businessPermissions.map(p => p.name);
      expect(businessPermNames).toContain('view_products');

      // Moderator permissions should include manage_users
      const adminPermNames = effectivePermissions.adminPermissions.map(p => p.name);
      expect(adminPermNames).toContain('manage_users');

      // Combined unique permissions should include both
      const allPermNames = effectivePermissions.allUniquePermissions.map(p => p.name);
      expect(allPermNames).toContain('view_products');
      expect(allPermNames).toContain('manage_users');
    });

    it('should grant access when permission exists in business role only', async () => {
      // Arrange: Create vendor user with no admin role
      const user = await userFactory.createUser(TestUserType.VENDOR_ONLY, testRoles);
      const token = authHelper.generateToken(user);

      // Create a route that requires create_products permission (vendor has this)
      await routeRepository.save(
        routeRepository.create({
          path: '/api/products',
          method: 'POST',
          permission: testPermissions.createProducts,
        }),
      );

      // Act: Make authenticated request to vendor-only endpoint
      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Product' });

      // Assert: Should be allowed (200 or 201, not 403)
      // Note: Actual controller may not exist, so we just verify the guard doesn't reject
      expect(response.status).not.toBe(403);
    });

    it('should grant access when permission exists in admin role only', async () => {
      // Arrange: Create buyer user with admin role
      const user = await userFactory.createUser(TestUserType.BUYER_ADMIN, testRoles);
      const token = authHelper.generateToken(user);

      // Create a route that requires manage_users permission (admin has this)
      await routeRepository.save(
        routeRepository.create({
          path: '/api/admin/users',
          method: 'GET',
          permission: testPermissions.manageUsers,
        }),
      );

      // Act: Make authenticated request to admin-only endpoint
      const response = await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      // Assert: Should be allowed (not 403)
      expect(response.status).not.toBe(403);
    });

    it('should deny access when permission exists in neither role', async () => {
      // Arrange: Create buyer user with support role
      // Neither buyer nor support has delete_products permission
      const user = await userFactory.createUser(TestUserType.BUYER_SUPPORT, testRoles);
      const token = authHelper.generateToken(user);

      // Create a route that requires delete_products permission
      await routeRepository.save(
        routeRepository.create({
          path: '/api/products/:id',
          method: 'DELETE',
          permission: testPermissions.deleteProducts,
        }),
      );

      // Act: Make authenticated request
      const response = await request(app.getHttpServer())
        .delete('/api/products/1')
        .set('Authorization', `Bearer ${token}`);

      // Assert: Should be denied (403 Forbidden)
      expect(response.status).toBe(403);
    });

    it('should deduplicate permissions when both roles have same permission', async () => {
      // Arrange: Create vendor user with admin role
      // Both vendor and admin have manage_products permission
      const user = await userFactory.createUser(TestUserType.VENDOR_ADMIN, testRoles);

      // Act: Get effective permissions
      const effectivePermissions = await rolePermissionsService.getUserEffectivePermissions(user.id);

      // Assert: manage_products should appear only once in allUniquePermissions
      const manageProductsCount = effectivePermissions.allUniquePermissions.filter(
        p => p.name === 'manage_products',
      ).length;
      expect(manageProductsCount).toBe(1);

      // But both business and admin should have it
      const businessHasIt = effectivePermissions.businessPermissions.some(
        p => p.name === 'manage_products',
      );
      const adminHasIt = effectivePermissions.adminPermissions.some(
        p => p.name === 'manage_products',
      );
      expect(businessHasIt).toBe(true);
      expect(adminHasIt).toBe(true);
    });

    it('should handle user with business role but no admin role', async () => {
      // Arrange: Create vendor user with null admin role
      const user = await userFactory.createUser(TestUserType.VENDOR_ONLY, testRoles);

      // Act: Get effective permissions
      const effectivePermissions = await rolePermissionsService.getUserEffectivePermissions(user.id);

      // Assert: Only business permissions, no admin permissions
      expect(effectivePermissions.businessPermissions.length).toBeGreaterThan(0);
      expect(effectivePermissions.adminPermissions).toHaveLength(0);
      expect(effectivePermissions.allUniquePermissions).toEqual(
        effectivePermissions.businessPermissions,
      );
    });

    it('should handle user with admin role but standard buyer business role', async () => {
      // Arrange: Create buyer user with admin role
      const user = await userFactory.createUser(TestUserType.BUYER_ADMIN, testRoles);

      // Act: Get effective permissions
      const effectivePermissions = await rolePermissionsService.getUserEffectivePermissions(user.id);

      // Assert: Should have both buyer and admin permissions
      expect(effectivePermissions.businessPermissions.length).toBeGreaterThan(0);
      expect(effectivePermissions.adminPermissions.length).toBeGreaterThan(0);

      // Combined should be more than just business
      expect(effectivePermissions.allUniquePermissions.length).toBeGreaterThanOrEqual(
        effectivePermissions.businessPermissions.length,
      );
    });

    it('should update effective permissions when role is changed', async () => {
      // Arrange: Create buyer user
      const user = await userFactory.createUser(TestUserType.BUYER_ONLY, testRoles);
      const token = authHelper.generateToken(user);

      // Create a route that requires create_products (vendor permission)
      await routeRepository.save(
        routeRepository.create({
          path: '/api/vendor/products',
          method: 'POST',
          permission: testPermissions.createProducts,
        }),
      );

      // Act 1: Test access (should fail - buyer doesn't have create_products)
      const firstResponse = await request(app.getHttpServer())
        .post('/api/vendor/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(firstResponse.status).toBe(403);

      // Act 2: Change user's role to vendor
      user.role = testRoles.vendor;
      await userRepository.save(user);

      // Generate new token with updated role
      const newToken = authHelper.generateToken(user);

      // Act 3: Test again (should succeed)
      const secondResponse = await request(app.getHttpServer())
        .post('/api/vendor/products')
        .set('Authorization', `Bearer ${newToken}`)
        .send({ name: 'Test' });

      // Note: Endpoint may not exist, but guard should not reject
      expect(secondResponse.status).not.toBe(403);
    });
  });

  /**
   * SECTION 2: Role Hierarchy & Priority (4 cases)
   * Tests role-based access control hierarchy
   */
  describe('Role Hierarchy', () => {
    it('should respect admin role having higher privileges', async () => {
      // Arrange: Create user with admin role
      const adminRoleUser = await userFactory.createUser(TestUserType.BUYER_ADMIN, testRoles);

      // Act: Get effective permissions
      const effectivePermissions = await rolePermissionsService.getUserEffectivePermissions(
        adminRoleUser.id,
      );

      // Assert: Admin should have access to system settings
      const hasSystemSettings = effectivePermissions.allUniquePermissions.some(
        p => p.name === 'manage_system_settings',
      );
      expect(hasSystemSettings).toBe(true);

      // Admin should have manage_users
      const hasManageUsers = effectivePermissions.allUniquePermissions.some(
        p => p.name === 'manage_users',
      );
      expect(hasManageUsers).toBe(true);
    });

    it('should allow moderator to manage users but not system settings', async () => {
      // Arrange: Create user with moderator admin role
      const modUser = await userFactory.createUser(TestUserType.BUYER_MODERATOR, testRoles);

      // Act: Get effective permissions
      const effectivePermissions = await rolePermissionsService.getUserEffectivePermissions(
        modUser.id,
      );
      const permNames = effectivePermissions.allUniquePermissions.map(p => p.name);

      // Assert: Moderator has manage_users but not manage_system_settings
      expect(permNames).toContain('manage_users');
      expect(permNames).not.toContain('manage_system_settings');
    });

    it('should enforce vendor permissions do not grant buyer-only access', async () => {
      // Arrange: Create vendor-only user
      const vendorUser = await userFactory.createUser(TestUserType.VENDOR_ONLY, testRoles);
      const token = authHelper.generateToken(vendorUser);

      // Create a route that requires add_to_wishlist (buyer-only permission)
      await routeRepository.save(
        routeRepository.create({
          path: '/api/wishlist',
          method: 'POST',
          permission: testPermissions.addToWishlist,
        }),
      );

      // Act: Vendor tries to access buyer-only endpoint
      const response = await request(app.getHttpServer())
        .post('/api/wishlist')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: 1 });

      // Assert: Should be forbidden
      expect(response.status).toBe(403);
    });

    it('should validate role priority when permissions conflict', async () => {
      // Arrange: Verify role priorities are set correctly
      const adminRole = await roleRepository.findOne({
        where: { name: 'admin' },
      });
      const moderatorRole = await roleRepository.findOne({
        where: { name: 'moderator' },
      });
      const supportRole = await roleRepository.findOne({
        where: { name: 'support' },
      });

      // Assert: Admin should have highest priority
      expect(adminRole.priority).toBeGreaterThan(moderatorRole.priority);
      expect(moderatorRole.priority).toBeGreaterThan(supportRole.priority);
    });
  });

  /**
   * SECTION 3: Full HTTP Request Flow (5 cases)
   * Tests the complete request flow through the system
   */
  describe('Full HTTP Request Flow', () => {
    it('should authenticate with JWT and check permissions for protected route', async () => {
      // Arrange: Create admin user with full permissions
      const user = await userFactory.createUser(TestUserType.VENDOR_ADMIN, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/admin/dashboard',
          method: 'GET',
          permission: testPermissions.viewAnalytics,
        }),
      );

      // Act: Make authenticated request
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      const duration = Date.now() - startTime;

      // Assert: Request should succeed (guard doesn't block) and be fast
      expect(response.status).not.toBe(403);
      expect(duration).toBeLessThan(500); // Performance requirement
    });

    it('should deny access before reaching controller when permission missing', async () => {
      // Arrange: Create user without required permission
      const user = await userFactory.createUser(TestUserType.BUYER_ONLY, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route requiring admin permission
      await routeRepository.save(
        routeRepository.create({
          path: '/api/admin/sensitive-data',
          method: 'GET',
          permission: testPermissions.manageSystemSettings,
        }),
      );

      // Act: Make request
      const response = await request(app.getHttpServer())
        .get('/api/admin/sensitive-data')
        .set('Authorization', `Bearer ${token}`);

      // Assert: Should be denied at guard level (403)
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Missing permission');
    });

    it('should log successful access to security audit', async () => {
      // Arrange: Create user with permission
      const user = await userFactory.createUser(TestUserType.VENDOR_ADMIN, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/test/audit-success',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Clear previous audit logs
      await securityAuditLogRepository.clear();

      // Act: Make successful request
      await request(app.getHttpServer())
        .get('/api/test/audit-success')
        .set('Authorization', `Bearer ${token}`);

      // Wait for async audit logging
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: Security audit log should contain success entry
      const auditLogs = await securityAuditLogRepository.find({
        where: { userId: user.id },
        order: { createdAt: 'DESC' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const successLog = auditLogs.find(
        log => log.success === true && log.requestPath === '/api/test/audit-success',
      );
      expect(successLog).toBeDefined();
    });

    it('should log failed access with reason to security audit', async () => {
      // Arrange: Create user without permission
      const user = await userFactory.createUser(TestUserType.BUYER_ONLY, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/test/audit-failure',
          method: 'GET',
          permission: testPermissions.manageSystemSettings,
        }),
      );

      // Clear previous audit logs
      await securityAuditLogRepository.clear();

      // Act: Make failed request
      await request(app.getHttpServer())
        .get('/api/test/audit-failure')
        .set('Authorization', `Bearer ${token}`);

      // Wait for async audit logging
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: Security audit log should contain failure entry
      const auditLogs = await securityAuditLogRepository.find({
        where: { userId: user.id, success: false },
        order: { createdAt: 'DESC' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const failureLog = auditLogs[0];
      expect(failureLog.failureReason).toContain('Missing permission');
      expect(failureLog.requestPath).toBe('/api/test/audit-failure');
    });

    it('should handle concurrent requests with permission checks', async () => {
      // Arrange: Create user with permission
      const user = await userFactory.createUser(TestUserType.VENDOR_ADMIN, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/test/concurrent',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Act: Make 100 concurrent requests
      const startTime = Date.now();
      const requests = Array(100)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/api/test/concurrent')
            .set('Authorization', `Bearer ${token}`),
        );

      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;

      // Assert: All requests should succeed and complete within 2000ms
      const successCount = responses.filter(r => r.status !== 403).length;
      expect(successCount).toBe(100);
      expect(duration).toBeLessThan(2000); // Performance requirement
    });
  });

  /**
   * SECTION 4: Permission Revocation & Real-Time Updates (3 cases)
   * Tests permission changes taking effect immediately
   */
  describe('Permission Revocation', () => {
    it('should deny access immediately when permission removed from role', async () => {
      // Arrange: Create user with vendor role and verify access
      const user = await userFactory.createUser(TestUserType.VENDOR_ONLY, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/vendor/inventory',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Verify initial access
      const initialResponse = await request(app.getHttpServer())
        .get('/api/vendor/inventory')
        .set('Authorization', `Bearer ${token}`);
      expect(initialResponse.status).not.toBe(403);

      // Act: Remove permission from vendor role
      const vendorRolePermission = await rolePermissionRepository.findOne({
        where: {
          role: { id: testRoles.vendor.id },
          permission: { id: testPermissions.viewProducts.id },
        },
        relations: ['role', 'permission'],
      });

      if (vendorRolePermission) {
        await rolePermissionRepository.remove(vendorRolePermission);
      }

      // Assert: Access should now be denied
      const afterResponse = await request(app.getHttpServer())
        .get('/api/vendor/inventory')
        .set('Authorization', `Bearer ${token}`);
      expect(afterResponse.status).toBe(403);
    });

    it('should deny access when user is removed from role', async () => {
      // Arrange: Create user with admin role
      const user = await userFactory.createUser(TestUserType.BUYER_ADMIN, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/admin/settings',
          method: 'GET',
          permission: testPermissions.manageSystemSettings,
        }),
      );

      // Verify initial access
      const initialResponse = await request(app.getHttpServer())
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`);
      expect(initialResponse.status).not.toBe(403);

      // Act: Remove admin role from user
      user.assignedRole = null;
      await userRepository.save(user);

      // Assert: Access should now be denied
      const afterResponse = await request(app.getHttpServer())
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${token}`);
      expect(afterResponse.status).toBe(403);
    });

    it('should grant access when new permission added to role', async () => {
      // Arrange: Create user with buyer role
      const user = await userFactory.createUser(TestUserType.BUYER_ONLY, testRoles);
      const token = authHelper.generateToken(user);

      // Create a protected route requiring a new permission
      const newPermission = await permissionRepository.save(
        permissionRepository.create({
          name: 'special_buyer_feature',
          description: 'Special feature for buyers',
          resource: 'special',
          action: 'access',
        }),
      );

      await routeRepository.save(
        routeRepository.create({
          path: '/api/buyer/special',
          method: 'GET',
          permission: newPermission,
        }),
      );

      // Verify initial access is denied
      const initialResponse = await request(app.getHttpServer())
        .get('/api/buyer/special')
        .set('Authorization', `Bearer ${token}`);
      expect(initialResponse.status).toBe(403);

      // Act: Add permission to buyer role
      await rolePermissionRepository.save(
        rolePermissionRepository.create({
          role: testRoles.buyer,
          permission: newPermission,
        }),
      );

      // Assert: Access should now be granted
      const afterResponse = await request(app.getHttpServer())
        .get('/api/buyer/special')
        .set('Authorization', `Bearer ${token}`);
      expect(afterResponse.status).not.toBe(403);
    });
  });

  /**
   * SECTION 5: Edge Cases and Error Handling (Additional cases)
   */
  describe('Edge Cases and Error Handling', () => {
    it('should handle unauthenticated requests gracefully', async () => {
      // Arrange: Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/protected',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Act: Make request without token
      const response = await request(app.getHttpServer()).get('/api/protected');

      // Assert: Should return 401 or 403
      expect([401, 403]).toContain(response.status);
    });

    it('should handle banned users', async () => {
      // Arrange: Create and ban a user
      const user = await userFactory.createUser(TestUserType.VENDOR_ADMIN, testRoles);
      user.isBanned = true;
      await userRepository.save(user);

      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/banned-test',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Act: Make request as banned user
      const response = await request(app.getHttpServer())
        .get('/api/banned-test')
        .set('Authorization', `Bearer ${token}`);

      // Assert: Should be denied
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('banned');
    });

    it('should handle suspended users with warning', async () => {
      // Arrange: Create and suspend a user
      const user = await userFactory.createUser(TestUserType.VENDOR_ADMIN, testRoles);
      user.isSuspended = true;
      await userRepository.save(user);

      const token = authHelper.generateToken(user);

      // Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/suspended-test',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Clear audit logs
      await securityAuditLogRepository.clear();

      // Act: Make request as suspended user
      const response = await request(app.getHttpServer())
        .get('/api/suspended-test')
        .set('Authorization', `Bearer ${token}`);

      // Wait for async logging
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: Should be allowed but logged with warning
      expect(response.status).not.toBe(403);

      // Verify audit log has suspension warning
      const auditLogs = await securityAuditLogRepository.find({
        where: { userId: user.id },
      });
      const suspendedLog = auditLogs.find(
        log => log.metadata?.isSuspended === true,
      );
      expect(suspendedLog).toBeDefined();
    });

    it('should allow access to public routes without authentication', async () => {
      // Note: This test verifies the @Public() decorator behavior
      // The actual public route handling is done by the guard checking for the decorator

      // Create a route without permission requirement (public by default)
      await routeRepository.save(
        routeRepository.create({
          path: '/api/public/products',
          method: 'GET',
          permission: null, // No permission required
        }),
      );

      // Act: Make unauthenticated request
      const response = await request(app.getHttpServer()).get('/api/public/products');

      // Assert: Should be allowed (route exists but no permission guard blocks it)
      expect(response.status).not.toBe(403);
    });

    it('should handle invalid JWT tokens', async () => {
      // Arrange: Create a protected route
      await routeRepository.save(
        routeRepository.create({
          path: '/api/jwt-test',
          method: 'GET',
          permission: testPermissions.viewProducts,
        }),
      );

      // Act: Make request with invalid token
      const response = await request(app.getHttpServer())
        .get('/api/jwt-test')
        .set('Authorization', 'Bearer invalid.jwt.token');

      // Assert: Should return 401 or 403
      expect([401, 403]).toContain(response.status);
    });
  });
});

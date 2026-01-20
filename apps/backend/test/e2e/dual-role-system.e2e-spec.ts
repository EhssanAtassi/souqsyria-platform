/**
 * @file dual-role-system.e2e-spec.ts
 * @description Comprehensive E2E Tests for Dual Role System
 * Tests the advanced dual role system where users can have both business and admin roles
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Repository, DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { User } from '../../src/users/entities/user.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { PermissionsGuard } from '../../src/access-control/guards/permissions.guard';
import { RolePermissionsService } from '../../src/access-control/role-permissions/role-permissions.service';
import * as bcrypt from 'bcrypt';

describe('Dual Role System (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let rolePermissionsService: RolePermissionsService;

  // Repositories
  let permissionRepository: Repository<Permission>;
  let rolePermissionRepository: Repository<RolePermission>;
  let roleRepository: Repository<Role>;
  let userRepository: Repository<User>;
  let routeRepository: Repository<Route>;

  // Business Roles
  let buyerRole: Role;
  let vendorRole: Role;
  let sellerRole: Role;

  // Admin Roles
  let adminRole: Role;
  let moderatorRole: Role;
  let staffRole: Role;
  let analystRole: Role;

  // Permissions
  let businessPermissions: Permission[];
  let adminPermissions: Permission[];

  // Test Users
  let basicBuyer: User;
  let vendorWithStaffRole: User;
  let sellerWithModeratorRole: User;
  let buyerWithAdminRole: User;
  let superAdmin: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Permission, RolePermission, Role, User, Route],
          synchronize: true,
          logging: false,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    rolePermissionsService = moduleFixture.get<RolePermissionsService>(
      RolePermissionsService,
    );

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

    await setupTestData();
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  async function setupTestData() {
    // Create Business Roles
    buyerRole = await roleRepository.save(
      roleRepository.create({
        name: 'buyer',
        description: 'Product buyer - can browse and purchase',
        isDefault: true,
        type: 'business',
      }),
    );

    vendorRole = await roleRepository.save(
      roleRepository.create({
        name: 'vendor',
        description: 'Product vendor - can sell products',
        isDefault: false,
        type: 'business',
      }),
    );

    sellerRole = await roleRepository.save(
      roleRepository.create({
        name: 'seller',
        description: 'Individual seller - limited selling capabilities',
        isDefault: false,
        type: 'business',
      }),
    );

    // Create Admin Roles
    adminRole = await roleRepository.save(
      roleRepository.create({
        name: 'admin',
        description: 'System administrator - full access',
        isDefault: false,
        type: 'admin',
      }),
    );

    moderatorRole = await roleRepository.save(
      roleRepository.create({
        name: 'moderator',
        description: 'Content moderator - can review and moderate',
        isDefault: false,
        type: 'admin',
      }),
    );

    staffRole = await roleRepository.save(
      roleRepository.create({
        name: 'staff',
        description: 'Customer support staff - can help customers',
        isDefault: false,
        type: 'admin',
      }),
    );

    analystRole = await roleRepository.save(
      roleRepository.create({
        name: 'analyst',
        description: 'Data analyst - can view analytics and reports',
        isDefault: false,
        type: 'admin',
      }),
    );

    // Create Business Permissions
    const businessPermissionData = [
      { name: 'view_products', description: 'View product catalog' },
      { name: 'purchase_products', description: 'Purchase products' },
      { name: 'manage_own_orders', description: 'Manage own orders' },
      { name: 'create_products', description: 'Create new products' },
      { name: 'manage_own_products', description: 'Manage own products' },
      { name: 'manage_inventory', description: 'Manage product inventory' },
      { name: 'process_orders', description: 'Process customer orders' },
      { name: 'create_listings', description: 'Create product listings' },
      { name: 'manage_own_listings', description: 'Manage own listings' },
    ];

    businessPermissions = [];
    for (const data of businessPermissionData) {
      const permission = await permissionRepository.save(
        permissionRepository.create(data),
      );
      businessPermissions.push(permission);
    }

    // Create Admin Permissions
    const adminPermissionData = [
      { name: 'manage_users', description: 'Manage user accounts' },
      { name: 'manage_roles', description: 'Manage user roles' },
      { name: 'manage_permissions', description: 'Manage system permissions' },
      { name: 'view_all_orders', description: 'View all orders in system' },
      {
        name: 'moderate_content',
        description: 'Moderate user-generated content',
      },
      { name: 'ban_users', description: 'Ban problematic users' },
      { name: 'handle_disputes', description: 'Handle customer disputes' },
      { name: 'view_analytics', description: 'View system analytics' },
      { name: 'export_data', description: 'Export system data' },
      {
        name: 'system_configuration',
        description: 'Configure system settings',
      },
    ];

    adminPermissions = [];
    for (const data of adminPermissionData) {
      const permission = await permissionRepository.save(
        permissionRepository.create(data),
      );
      adminPermissions.push(permission);
    }

    // Assign permissions to business roles
    await assignPermissionsToRole(buyerRole, [
      'view_products',
      'purchase_products',
      'manage_own_orders',
    ]);

    await assignPermissionsToRole(vendorRole, [
      'view_products',
      'create_products',
      'manage_own_products',
      'manage_inventory',
      'process_orders',
    ]);

    await assignPermissionsToRole(sellerRole, [
      'view_products',
      'create_listings',
      'manage_own_listings',
      'manage_own_orders',
    ]);

    // Assign permissions to admin roles
    await assignPermissionsToRole(adminRole, [
      'manage_users',
      'manage_roles',
      'manage_permissions',
      'view_all_orders',
      'moderate_content',
      'ban_users',
      'handle_disputes',
      'view_analytics',
      'export_data',
      'system_configuration',
    ]);

    await assignPermissionsToRole(moderatorRole, [
      'moderate_content',
      'ban_users',
      'handle_disputes',
      'view_all_orders',
    ]);

    await assignPermissionsToRole(staffRole, [
      'view_all_orders',
      'handle_disputes',
      'view_analytics',
    ]);

    await assignPermissionsToRole(analystRole, [
      'view_analytics',
      'export_data',
    ]);

    // Create test users with different role combinations
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Basic buyer - only business role
    basicBuyer = await userRepository.save(
      userRepository.create({
        email: 'buyer@test.com',
        firebaseUid: 'firebase-buyer-uid',
        isVerified: true,
        role: buyerRole,
        assignedRole: null, // No admin role
        fullName: 'Basic Buyer',
        passwordHash,
      }),
    );

    // 2. Vendor with staff role - dual role
    vendorWithStaffRole = await userRepository.save(
      userRepository.create({
        email: 'vendor-staff@test.com',
        firebaseUid: 'firebase-vendor-staff-uid',
        isVerified: true,
        role: vendorRole, // Business role
        assignedRole: staffRole, // Admin role
        fullName: 'Vendor with Staff Access',
        passwordHash,
      }),
    );

    // 3. Seller with moderator role - dual role
    sellerWithModeratorRole = await userRepository.save(
      userRepository.create({
        email: 'seller-moderator@test.com',
        firebaseUid: 'firebase-seller-moderator-uid',
        isVerified: true,
        role: sellerRole, // Business role
        assignedRole: moderatorRole, // Admin role
        fullName: 'Seller with Moderator Access',
        passwordHash,
      }),
    );

    // 4. Buyer with admin role - dual role
    buyerWithAdminRole = await userRepository.save(
      userRepository.create({
        email: 'buyer-admin@test.com',
        firebaseUid: 'firebase-buyer-admin-uid',
        isVerified: true,
        role: buyerRole, // Business role
        assignedRole: adminRole, // Admin role
        fullName: 'Buyer with Admin Access',
        passwordHash,
      }),
    );

    // 5. Super admin - business buyer + admin role
    superAdmin = await userRepository.save(
      userRepository.create({
        email: 'super-admin@test.com',
        firebaseUid: 'firebase-super-admin-uid',
        isVerified: true,
        role: buyerRole, // Can still shop
        assignedRole: adminRole, // Full admin access
        fullName: 'Super Administrator',
        passwordHash,
      }),
    );

    // Create route permissions for testing
    const routeData = [
      { path: '/api/products', method: 'GET', permission: 'view_products' },
      { path: '/api/products', method: 'POST', permission: 'create_products' },
      { path: '/api/orders', method: 'GET', permission: 'manage_own_orders' },
      { path: '/api/admin/users', method: 'GET', permission: 'manage_users' },
      {
        path: '/api/admin/analytics',
        method: 'GET',
        permission: 'view_analytics',
      },
      {
        path: '/api/moderation/content',
        method: 'POST',
        permission: 'moderate_content',
      },
      {
        path: '/api/support/disputes',
        method: 'GET',
        permission: 'handle_disputes',
      },
    ];

    for (const data of routeData) {
      const permission = [...businessPermissions, ...adminPermissions].find(
        (p) => p.name === data.permission,
      );
      await routeRepository.save(
        routeRepository.create({
          path: data.path,
          method: data.method,
          permission: permission,
        }),
      );
    }
  }

  async function assignPermissionsToRole(
    role: Role,
    permissionNames: string[],
  ) {
    const allPermissions = [...businessPermissions, ...adminPermissions];
    for (const permissionName of permissionNames) {
      const permission = allPermissions.find((p) => p.name === permissionName);
      if (permission) {
        await rolePermissionRepository.save(
          rolePermissionRepository.create({
            role: role,
            permission: permission,
          }),
        );
      }
    }
  }

  function createToken(user: User): string {
    return jwtService.sign({
      sub: user.id,
      role: user.role.name, // JWT contains business role
      email: user.email,
    });
  }

  describe('Single Role Users', () => {
    it('should handle basic buyer with only business role', async () => {
      const token = createToken(basicBuyer);

      // Should have access to buyer business functions
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should NOT have access to admin functions
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify effective permissions
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(basicBuyer.id);
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBe(0);
      expect(permissions.allUniquePermissions).toEqual(
        permissions.businessPermissions,
      );

      const permissionNames = permissions.businessPermissions.map(
        (p) => p.name,
      );
      expect(permissionNames).toContain('view_products');
      expect(permissionNames).toContain('purchase_products');
      expect(permissionNames).not.toContain('manage_users');
    });
  });

  describe('Dual Role Users', () => {
    it('should handle vendor with staff role - business + limited admin', async () => {
      const token = createToken(vendorWithStaffRole);

      // Should have vendor business capabilities
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Vendor Product',
          description: 'Product by vendor-staff user',
        })
        .expect(201);

      // Should have staff admin capabilities
      await request(app.getHttpServer())
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should NOT have full admin capabilities
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Verify effective permissions combine both roles
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(
          vendorWithStaffRole.id,
        );
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBeGreaterThan(0);
      expect(permissions.allUniquePermissions.length).toBeGreaterThan(
        permissions.businessPermissions.length,
      );

      const allPermissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );
      // Business permissions from vendor role
      expect(allPermissionNames).toContain('create_products');
      expect(allPermissionNames).toContain('manage_own_products');
      // Admin permissions from staff role
      expect(allPermissionNames).toContain('view_analytics');
      expect(allPermissionNames).toContain('handle_disputes');
      // Should not have full admin permissions
      expect(allPermissionNames).not.toContain('manage_users');
      expect(allPermissionNames).not.toContain('system_configuration');
    });

    it('should handle seller with moderator role - business + moderation admin', async () => {
      const token = createToken(sellerWithModeratorRole);

      // Should have seller business capabilities
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should have moderator admin capabilities
      await request(app.getHttpServer())
        .post('/api/moderation/content')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contentId: 'test-content-123',
          action: 'approve',
          reason: 'Content meets guidelines',
        })
        .expect(201);

      // Verify effective permissions
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(
          sellerWithModeratorRole.id,
        );

      const businessPermissionNames = permissions.businessPermissions.map(
        (p) => p.name,
      );
      const adminPermissionNames = permissions.adminPermissions.map(
        (p) => p.name,
      );
      const allPermissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );

      // Business permissions from seller role
      expect(businessPermissionNames).toContain('create_listings');
      expect(businessPermissionNames).toContain('manage_own_listings');

      // Admin permissions from moderator role
      expect(adminPermissionNames).toContain('moderate_content');
      expect(adminPermissionNames).toContain('ban_users');

      // Combined permissions
      expect(allPermissionNames).toContain('create_listings'); // From business role
      expect(allPermissionNames).toContain('moderate_content'); // From admin role
    });

    it('should handle buyer with full admin role - business + full admin', async () => {
      const token = createToken(buyerWithAdminRole);

      // Should have buyer business capabilities
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should have full admin capabilities
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify effective permissions include everything
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(
          buyerWithAdminRole.id,
        );
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBeGreaterThan(0);

      const allPermissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );
      // Should have buyer permissions
      expect(allPermissionNames).toContain('view_products');
      expect(allPermissionNames).toContain('purchase_products');
      // Should have all admin permissions
      expect(allPermissionNames).toContain('manage_users');
      expect(allPermissionNames).toContain('system_configuration');
      expect(allPermissionNames).toContain('manage_permissions');
    });
  });

  describe('Permission Inheritance and Conflicts', () => {
    it('should properly deduplicate overlapping permissions', async () => {
      // Create a user where business and admin roles have overlapping permissions
      // First, assign view_products to analyst role (normally it's only business)
      const viewProductsPermission = businessPermissions.find(
        (p) => p.name === 'view_products',
      );
      await rolePermissionRepository.save(
        rolePermissionRepository.create({
          role: analystRole,
          permission: viewProductsPermission,
        }),
      );

      // Create user with buyer (has view_products) + analyst (also has view_products)
      const duplicateUser = await userRepository.save(
        userRepository.create({
          email: 'duplicate@test.com',
          firebaseUid: 'firebase-duplicate-uid',
          isVerified: true,
          role: buyerRole, // Has view_products
          assignedRole: analystRole, // Also has view_products
          fullName: 'Duplicate Permission User',
          passwordHash: await bcrypt.hash('password123', 10),
        }),
      );

      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(
          duplicateUser.id,
        );

      // Count how many times view_products appears
      const viewProductsCount = permissions.allUniquePermissions.filter(
        (p) => p.name === 'view_products',
      ).length;
      expect(viewProductsCount).toBe(1); // Should be deduplicated

      // Verify both business and admin permissions are present
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBeGreaterThan(0);

      // Total unique should be less than sum of both (due to deduplication)
      expect(permissions.allUniquePermissions.length).toBeLessThan(
        permissions.businessPermissions.length +
          permissions.adminPermissions.length,
      );
    });

    it('should handle user with null assigned role gracefully', async () => {
      // Test user with only business role (assigned role is null)
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(basicBuyer.id);

      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBe(0);
      expect(permissions.allUniquePermissions).toEqual(
        permissions.businessPermissions,
      );
    });

    it('should handle role with no permissions gracefully', async () => {
      // Create empty role
      const emptyRole = await roleRepository.save(
        roleRepository.create({
          name: 'empty_role',
          description: 'Role with no permissions',
          isDefault: false,
          type: 'business',
        }),
      );

      const emptyUser = await userRepository.save(
        userRepository.create({
          email: 'empty@test.com',
          firebaseUid: 'firebase-empty-uid',
          isVerified: true,
          role: emptyRole,
          assignedRole: null,
          fullName: 'Empty Role User',
          passwordHash: await bcrypt.hash('password123', 10),
        }),
      );

      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(emptyUser.id);

      expect(permissions.businessPermissions.length).toBe(0);
      expect(permissions.adminPermissions.length).toBe(0);
      expect(permissions.allUniquePermissions.length).toBe(0);
    });
  });

  describe('Dynamic Role Management', () => {
    it('should support runtime role changes', async () => {
      // Initially buyer with no admin role
      let permissions =
        await rolePermissionsService.getUserEffectivePermissions(basicBuyer.id);
      expect(permissions.adminPermissions.length).toBe(0);

      // Assign admin role at runtime
      basicBuyer.assignedRole = staffRole;
      await userRepository.save(basicBuyer);

      // Should now have both business and admin permissions
      permissions = await rolePermissionsService.getUserEffectivePermissions(
        basicBuyer.id,
      );
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBeGreaterThan(0);

      // Verify new capabilities
      const token = createToken(basicBuyer);
      await request(app.getHttpServer())
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Remove admin role
      basicBuyer.assignedRole = null;
      await userRepository.save(basicBuyer);

      // Should lose admin permissions
      permissions = await rolePermissionsService.getUserEffectivePermissions(
        basicBuyer.id,
      );
      expect(permissions.adminPermissions.length).toBe(0);
    });

    it('should support business role changes', async () => {
      // Change from buyer to vendor
      basicBuyer.role = vendorRole;
      await userRepository.save(basicBuyer);

      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(basicBuyer.id);
      const permissionNames = permissions.businessPermissions.map(
        (p) => p.name,
      );

      // Should now have vendor permissions instead of buyer permissions
      expect(permissionNames).toContain('create_products');
      expect(permissionNames).toContain('manage_inventory');
      expect(permissionNames).not.toContain('purchase_products'); // Buyer-specific

      // Verify new capabilities
      const token = createToken(basicBuyer);
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Vendor Product',
          description: 'Product after role change',
        })
        .expect(201);
    });
  });

  describe('Complex Permission Scenarios', () => {
    it('should handle user with multiple admin capabilities', async () => {
      // Create user with business role + multiple admin roles worth of permissions
      // (Simulated by giving admin role which has all admin permissions)
      const token = createToken(superAdmin);

      // Should handle all business operations
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Should handle all admin operations
      await request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/moderation/content')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contentId: 'super-admin-test',
          action: 'approve',
          reason: 'Super admin approval',
        })
        .expect(201);

      // Verify comprehensive permissions
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(superAdmin.id);
      expect(permissions.allUniquePermissions.length).toBeGreaterThan(10);

      const allPermissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );
      expect(allPermissionNames).toContain('view_products'); // Business
      expect(allPermissionNames).toContain('purchase_products'); // Business
      expect(allPermissionNames).toContain('manage_users'); // Admin
      expect(allPermissionNames).toContain('system_configuration'); // Admin
      expect(allPermissionNames).toContain('moderate_content'); // Admin
    });

    it('should validate role combinations in business logic', async () => {
      // Test business logic that depends on specific role combinations
      const token = createToken(vendorWithStaffRole);

      // As a vendor, should be able to process their own orders
      // As staff, should be able to handle customer disputes
      // This combination makes them ideal for vendor support

      // Vendor capability - manage products
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Vendor Support Product',
          description: 'Product managed by vendor-staff',
        })
        .expect(201);

      // Staff capability - handle disputes
      await request(app.getHttpServer())
        .get('/api/support/disputes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Combined capability - should be able to help both as vendor and staff
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(
          vendorWithStaffRole.id,
        );
      const allPermissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );

      // Verify specific combination
      expect(allPermissionNames).toContain('manage_own_products'); // Vendor
      expect(allPermissionNames).toContain('handle_disputes'); // Staff
      expect(allPermissionNames).toContain('view_analytics'); // Staff
      expect(allPermissionNames).toContain('process_orders'); // Vendor
    });
  });

  describe('Error Handling in Dual Role System', () => {
    it('should handle corrupted role relationships', async () => {
      // Create user with invalid role ID (simulating corruption)
      const corruptedUser = await userRepository.save(
        userRepository.create({
          email: 'corrupted@test.com',
          firebaseUid: 'firebase-corrupted-uid',
          isVerified: true,
          role: buyerRole,
          assignedRole: null,
          fullName: 'Corrupted User',
          passwordHash: await bcrypt.hash('password123', 10),
        }),
      );

      // Manually corrupt the assigned role reference
      await userRepository.query(
        'UPDATE users SET assigned_role_id = 99999 WHERE id = ?',
        [corruptedUser.id],
      );

      // Should handle gracefully by returning what's available
      await expect(async () => {
        await rolePermissionsService.getUserEffectivePermissions(
          corruptedUser.id,
        );
      }).not.toThrow();
    });

    it('should handle user with deleted roles', async () => {
      // Create user with roles
      const tempUser = await userRepository.save(
        userRepository.create({
          email: 'temp@test.com',
          firebaseUid: 'firebase-temp-uid',
          isVerified: true,
          role: buyerRole,
          assignedRole: staffRole,
          fullName: 'Temp User',
          passwordHash: await bcrypt.hash('password123', 10),
        }),
      );

      // Verify user has permissions initially
      let permissions =
        await rolePermissionsService.getUserEffectivePermissions(tempUser.id);
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBeGreaterThan(0);

      // Soft delete the assigned role (set assignedRole to null)
      tempUser.assignedRole = null;
      await userRepository.save(tempUser);

      // Should still work with just business role
      permissions = await rolePermissionsService.getUserEffectivePermissions(
        tempUser.id,
      );
      expect(permissions.businessPermissions.length).toBeGreaterThan(0);
      expect(permissions.adminPermissions.length).toBe(0);
    });
  });

  describe('Performance with Dual Roles', () => {
    it('should efficiently handle users with many permissions', async () => {
      // Super admin should have many permissions
      const startTime = Date.now();
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(superAdmin.id);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
      expect(permissions.allUniquePermissions.length).toBeGreaterThan(5);

      // Verify deduplication is working efficiently
      const businessCount = permissions.businessPermissions.length;
      const adminCount = permissions.adminPermissions.length;
      const uniqueCount = permissions.allUniquePermissions.length;

      expect(uniqueCount).toBeLessThanOrEqual(businessCount + adminCount);
    });

    it('should handle bulk operations on dual role users', async () => {
      // Create multiple dual-role users
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = await userRepository.save(
          userRepository.create({
            email: `bulk-${i}@test.com`,
            firebaseUid: `firebase-bulk-${i}-uid`,
            isVerified: true,
            role: vendorRole,
            assignedRole: staffRole,
            fullName: `Bulk User ${i}`,
            passwordHash: await bcrypt.hash('password123', 10),
          }),
        );
        users.push(user);
      }

      // Get effective permissions for all users
      const startTime = Date.now();
      const allPermissions = await Promise.all(
        users.map((user) =>
          rolePermissionsService.getUserEffectivePermissions(user.id),
        ),
      );
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
      expect(allPermissions).toHaveLength(10);

      // All should have same permission structure
      allPermissions.forEach((permissions) => {
        expect(permissions.businessPermissions.length).toBeGreaterThan(0);
        expect(permissions.adminPermissions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-world Dual Role Scenarios', () => {
    it('should support customer service representative scenario', async () => {
      // Customer service rep: buyer (to understand customer experience) + staff (to help customers)
      const csrep = await userRepository.save(
        userRepository.create({
          email: 'csrep@test.com',
          firebaseUid: 'firebase-csrep-uid',
          isVerified: true,
          role: buyerRole, // Can experience buying process
          assignedRole: staffRole, // Can help customers
          fullName: 'Customer Service Rep',
          passwordHash: await bcrypt.hash('password123', 10),
        }),
      );

      const token = createToken(csrep);

      // Can experience the customer journey
      await request(app.getHttpServer())
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Can help with customer issues
      await request(app.getHttpServer())
        .get('/api/support/disputes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Can access analytics to understand trends
      await request(app.getHttpServer())
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify appropriate permissions
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(csrep.id);
      const permissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );

      expect(permissionNames).toContain('view_products'); // Customer experience
      expect(permissionNames).toContain('purchase_products'); // Customer experience
      expect(permissionNames).toContain('handle_disputes'); // Support capability
      expect(permissionNames).toContain('view_analytics'); // Understanding trends
    });

    it('should support vendor manager scenario', async () => {
      // Vendor manager: vendor (understands selling) + moderator (can review content)
      const vendorManager = await userRepository.save(
        userRepository.create({
          email: 'vendor-manager@test.com',
          firebaseUid: 'firebase-vendor-manager-uid',
          isVerified: true,
          role: vendorRole, // Understands vendor needs
          assignedRole: moderatorRole, // Can moderate vendor content
          fullName: 'Vendor Manager',
          passwordHash: await bcrypt.hash('password123', 10),
        }),
      );

      const token = createToken(vendorManager);

      // Can manage products like a vendor
      await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Manager Test Product',
          description: 'Product by vendor manager',
        })
        .expect(201);

      // Can moderate content
      await request(app.getHttpServer())
        .post('/api/moderation/content')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contentId: 'vendor-content-123',
          action: 'approve',
          reason: 'Vendor manager approval',
        })
        .expect(201);

      // Verify comprehensive vendor management permissions
      const permissions =
        await rolePermissionsService.getUserEffectivePermissions(
          vendorManager.id,
        );
      const permissionNames = permissions.allUniquePermissions.map(
        (p) => p.name,
      );

      expect(permissionNames).toContain('create_products'); // Vendor capability
      expect(permissionNames).toContain('manage_inventory'); // Vendor capability
      expect(permissionNames).toContain('moderate_content'); // Moderator capability
      expect(permissionNames).toContain('ban_users'); // Moderator capability
    });
  });
});

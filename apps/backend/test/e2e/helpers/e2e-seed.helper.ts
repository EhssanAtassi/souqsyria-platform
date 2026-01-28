/**
 * @file e2e-seed.helper.ts
 * @description Database seeding helper utilities for E2E testing
 *
 * This module provides comprehensive database seeding functions for E2E tests
 * including roles, permissions, users, and their relationships.
 *
 * Features:
 * - Role seeding (buyer, vendor, admin, moderator, support)
 * - Permission seeding (21 core permissions)
 * - User seeding with various roles
 * - Route and permission mapping
 * - Test data cleanup utilities
 * - Transaction support for test isolation
 *
 * Test Data Structure:
 * - 5 default roles: buyer, vendor, admin, moderator, support
 * - 21 permissions covering products, orders, users, and system management
 * - 4 test users: admin, user, editor, limited
 * - Complete route-permission mappings
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { INestApplication } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Interface for seeded test data
 * @description Contains all seeded entities for test use
 */
export interface SeededTestData {
  /** Seeded roles mapped by name */
  roles: Record<string, any>;
  /** Seeded permissions mapped by name */
  permissions: Record<string, any>;
  /** Seeded users mapped by type (admin, user, editor, limited) */
  users: Record<string, any>;
  /** Seeded routes */
  routes: any[];
}

/**
 * Default permission definitions
 * @description Core permissions for RBAC system
 */
export const DEFAULT_PERMISSIONS = [
  // Product permissions
  { name: 'view_products', description: 'View product catalog' },
  { name: 'create_products', description: 'Create new products' },
  { name: 'edit_products', description: 'Edit existing products' },
  { name: 'delete_products', description: 'Delete products' },
  { name: 'manage_products', description: 'Full product management' },

  // Order permissions
  { name: 'view_orders', description: 'View order details' },
  { name: 'create_orders', description: 'Create new orders' },
  { name: 'edit_orders', description: 'Edit order status' },
  { name: 'delete_orders', description: 'Cancel/delete orders' },
  { name: 'manage_orders', description: 'Full order management' },

  // User permissions
  { name: 'view_users', description: 'View user profiles' },
  { name: 'create_users', description: 'Create user accounts' },
  { name: 'edit_users', description: 'Edit user information' },
  { name: 'delete_users', description: 'Delete user accounts' },
  { name: 'manage_users', description: 'Full user management' },

  // Role permissions
  { name: 'view_roles', description: 'View available roles' },
  { name: 'manage_roles', description: 'Create/edit/delete roles' },

  // System permissions
  { name: 'view_audit_logs', description: 'View security audit logs' },
  { name: 'manage_settings', description: 'Manage system settings' },
  { name: 'admin_access', description: 'Access admin dashboard' },
  { name: 'super_admin', description: 'Full system access' },
];

/**
 * Default role definitions with their permission sets
 * @description Core roles for RBAC system
 */
export const DEFAULT_ROLES = [
  {
    name: 'buyer',
    description: 'Regular buyer/customer',
    type: 'business',
    priority: 10,
    permissions: ['view_products', 'view_orders', 'create_orders'],
  },
  {
    name: 'vendor',
    description: 'Product vendor/seller',
    type: 'business',
    priority: 30,
    permissions: [
      'view_products',
      'create_products',
      'edit_products',
      'view_orders',
      'edit_orders',
    ],
  },
  {
    name: 'moderator',
    description: 'Content moderator',
    type: 'admin',
    priority: 50,
    permissions: [
      'view_products',
      'edit_products',
      'view_users',
      'view_orders',
      'admin_access',
    ],
  },
  {
    name: 'support',
    description: 'Customer support agent',
    type: 'admin',
    priority: 40,
    permissions: [
      'view_products',
      'view_users',
      'view_orders',
      'edit_orders',
      'admin_access',
    ],
  },
  {
    name: 'admin',
    description: 'System administrator',
    type: 'admin',
    priority: 100,
    isDefault: true,
    permissions: [
      'view_products',
      'create_products',
      'edit_products',
      'delete_products',
      'manage_products',
      'view_orders',
      'create_orders',
      'edit_orders',
      'delete_orders',
      'manage_orders',
      'view_users',
      'create_users',
      'edit_users',
      'delete_users',
      'manage_users',
      'view_roles',
      'manage_roles',
      'view_audit_logs',
      'manage_settings',
      'admin_access',
      'super_admin',
    ],
  },
];

/**
 * Default test users
 * @description Test users for different scenarios
 */
export const DEFAULT_TEST_USERS = [
  {
    key: 'admin',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    fullName: 'Admin User',
    roleName: 'admin',
    assignedRoleName: 'admin',
    isVerified: true,
  },
  {
    key: 'user',
    email: 'user@example.com',
    password: 'UserPass123!',
    fullName: 'Regular User',
    roleName: 'buyer',
    assignedRoleName: null,
    isVerified: true,
  },
  {
    key: 'vendor',
    email: 'vendor@example.com',
    password: 'VendorPass123!',
    fullName: 'Vendor User',
    roleName: 'vendor',
    assignedRoleName: null,
    isVerified: true,
  },
  {
    key: 'editor',
    email: 'editor@example.com',
    password: 'EditorPass123!',
    fullName: 'Editor User',
    roleName: 'buyer',
    assignedRoleName: null, // Will be assigned role during tests
    isVerified: true,
  },
  {
    key: 'limited',
    email: 'limited@example.com',
    password: 'LimitedPass123!',
    fullName: 'Limited User',
    roleName: 'buyer',
    assignedRoleName: null,
    isVerified: true,
  },
  {
    key: 'unverified',
    email: 'unverified@example.com',
    password: 'UnverifiedPass123!',
    fullName: 'Unverified User',
    roleName: 'buyer',
    assignedRoleName: null,
    isVerified: false,
  },
];

/**
 * E2E Database Seeder Class
 * @description Manages database seeding for E2E tests
 */
export class E2ESeedHelper {
  private app: INestApplication;
  private dataSource: DataSource;
  private seededData: SeededTestData;

  /**
   * Creates an instance of E2ESeedHelper
   * @param app - NestJS application instance
   */
  constructor(app: INestApplication) {
    this.app = app;
    this.dataSource = this.app.get(DataSource);
    this.seededData = {
      roles: {},
      permissions: {},
      users: {},
      routes: [],
    };
  }

  /**
   * Seed all test data
   * @description Seeds roles, permissions, users, and routes
   *
   * @returns Promise resolving to seeded data
   *
   * @example
   * ```typescript
   * const seedHelper = new E2ESeedHelper(app);
   * const data = await seedHelper.seedTestData();
   * console.log(data.users.admin.id);
   * ```
   */
  async seedTestData(): Promise<SeededTestData> {
    console.log('Seeding E2E test data...');

    try {
      // Seed in order: permissions -> roles -> role-permissions -> users
      await this.seedPermissions();
      await this.seedRoles();
      await this.seedRolePermissions();
      await this.seedUsers();

      console.log('E2E test data seeded successfully');
      return this.seededData;
    } catch (error) {
      console.error('Failed to seed test data:', error);
      throw error;
    }
  }

  /**
   * Seed permissions
   * @description Creates all default permissions
   */
  async seedPermissions(): Promise<void> {
    console.log('Seeding permissions...');

    const permissionRepo = this.getRepository('Permission');

    for (const permData of DEFAULT_PERMISSIONS) {
      // Check if permission already exists
      let permission = await permissionRepo.findOne({
        where: { name: permData.name },
      });

      if (!permission) {
        permission = permissionRepo.create(permData);
        permission = await permissionRepo.save(permission);
      }

      this.seededData.permissions[permData.name] = permission;
    }

    console.log(`Seeded ${Object.keys(this.seededData.permissions).length} permissions`);
  }

  /**
   * Seed roles
   * @description Creates all default roles
   */
  async seedRoles(): Promise<void> {
    console.log('Seeding roles...');

    const roleRepo = this.getRepository('Role');

    for (const roleData of DEFAULT_ROLES) {
      // Check if role already exists
      let role = await roleRepo.findOne({
        where: { name: roleData.name },
      });

      if (!role) {
        role = roleRepo.create({
          name: roleData.name,
          description: roleData.description,
          type: roleData.type,
          priority: roleData.priority,
          isDefault: roleData.isDefault || false,
        });
        role = await roleRepo.save(role);
      }

      this.seededData.roles[roleData.name] = {
        ...role,
        permissionNames: roleData.permissions,
      };
    }

    console.log(`Seeded ${Object.keys(this.seededData.roles).length} roles`);
  }

  /**
   * Seed role-permission relationships
   * @description Creates role-permission mappings
   */
  async seedRolePermissions(): Promise<void> {
    console.log('Seeding role-permission mappings...');

    const rolePermissionRepo = this.getRepository('RolePermission');

    for (const roleName of Object.keys(this.seededData.roles)) {
      const roleData = this.seededData.roles[roleName];
      const permissionNames = roleData.permissionNames || [];

      for (const permName of permissionNames) {
        const permission = this.seededData.permissions[permName];
        if (!permission) {
          console.warn(`Permission '${permName}' not found for role '${roleName}'`);
          continue;
        }

        // Check if mapping already exists
        const existing = await rolePermissionRepo.findOne({
          where: {
            roleId: roleData.id,
            permissionId: permission.id,
          },
        });

        if (!existing) {
          const rolePermission = rolePermissionRepo.create({
            roleId: roleData.id,
            permissionId: permission.id,
          });
          await rolePermissionRepo.save(rolePermission);
        }
      }
    }

    console.log('Role-permission mappings seeded');
  }

  /**
   * Seed test users
   * @description Creates test users with assigned roles
   */
  async seedUsers(): Promise<void> {
    console.log('Seeding test users...');

    const userRepo = this.getRepository('User');

    for (const userData of DEFAULT_TEST_USERS) {
      // Check if user already exists
      let user = await userRepo.findOne({
        where: { email: userData.email },
        relations: ['role', 'assignedRole'],
      });

      if (!user) {
        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Get role
        const role = this.seededData.roles[userData.roleName];
        if (!role) {
          console.warn(`Role '${userData.roleName}' not found for user '${userData.email}'`);
          continue;
        }

        // Get assigned role if specified
        const assignedRole = userData.assignedRoleName
          ? this.seededData.roles[userData.assignedRoleName]
          : null;

        user = userRepo.create({
          email: userData.email,
          passwordHash,
          fullName: userData.fullName,
          isVerified: userData.isVerified,
          role: { id: role.id },
          assignedRole: assignedRole ? { id: assignedRole.id } : null,
          isBanned: false,
          isSuspended: false,
        });

        user = await userRepo.save(user);
      }

      this.seededData.users[userData.key] = {
        ...user,
        password: userData.password, // Keep password for login
      };
    }

    console.log(`Seeded ${Object.keys(this.seededData.users).length} users`);
  }

  /**
   * Get repository for entity
   * @description Retrieves TypeORM repository for an entity
   *
   * @param entityName - Name of the entity
   * @returns Repository instance
   */
  private getRepository(entityName: string): Repository<any> {
    try {
      // Try to get by token first
      const token = getRepositoryToken(entityName);
      return this.app.get(token);
    } catch {
      // Fallback to DataSource
      return this.dataSource.getRepository(entityName);
    }
  }

  /**
   * Get seeded data
   * @description Returns all seeded test data
   *
   * @returns Seeded test data
   */
  getSeededData(): SeededTestData {
    return this.seededData;
  }

  /**
   * Clear test data
   * @description Removes all seeded test data (for cleanup)
   *
   * @returns Promise resolving when cleanup is complete
   *
   * @example
   * ```typescript
   * await seedHelper.clearTestData();
   * ```
   */
  async clearTestData(): Promise<void> {
    console.log('Clearing E2E test data...');

    try {
      // Clear in reverse order to handle foreign keys
      const userRepo = this.getRepository('User');
      const rolePermissionRepo = this.getRepository('RolePermission');
      const roleRepo = this.getRepository('Role');
      const permissionRepo = this.getRepository('Permission');

      // Delete test users (only those with test emails)
      for (const userData of DEFAULT_TEST_USERS) {
        await userRepo.delete({ email: userData.email });
      }

      // Delete role-permission mappings for test roles
      for (const roleName of Object.keys(this.seededData.roles)) {
        const role = this.seededData.roles[roleName];
        if (role?.id) {
          await rolePermissionRepo.delete({ roleId: role.id });
        }
      }

      // Note: We typically don't delete roles/permissions in E2E tests
      // as they may be seeded by the application itself

      console.log('E2E test data cleared');
    } catch (error) {
      console.error('Failed to clear test data:', error);
      throw error;
    }
  }

  /**
   * Reset test user to initial state
   * @description Resets a user's roles and status to initial test state
   *
   * @param userKey - User key (admin, user, editor, limited)
   * @returns Promise resolving when reset is complete
   */
  async resetUser(userKey: string): Promise<void> {
    const userData = DEFAULT_TEST_USERS.find((u) => u.key === userKey);
    if (!userData) {
      throw new Error(`Unknown user key: ${userKey}`);
    }

    const userRepo = this.getRepository('User');
    const user = await userRepo.findOne({
      where: { email: userData.email },
    });

    if (user) {
      const role = this.seededData.roles[userData.roleName];
      const assignedRole = userData.assignedRoleName
        ? this.seededData.roles[userData.assignedRoleName]
        : null;

      user.role = { id: role.id } as any;
      user.assignedRole = assignedRole ? ({ id: assignedRole.id } as any) : null;
      user.isBanned = false;
      user.isSuspended = false;
      user.banReason = null;

      await userRepo.save(user);
      this.seededData.users[userKey] = {
        ...user,
        password: userData.password,
      };
    }
  }

  /**
   * Create additional test user
   * @description Creates a new test user on-the-fly
   *
   * @param data - User data
   * @returns Promise resolving to created user
   *
   * @example
   * ```typescript
   * const newUser = await seedHelper.createTestUser({
   *   email: 'custom@example.com',
   *   password: 'CustomPass123!',
   *   roleName: 'buyer'
   * });
   * ```
   */
  async createTestUser(data: {
    email: string;
    password: string;
    fullName?: string;
    roleName?: string;
    assignedRoleName?: string;
    isVerified?: boolean;
  }): Promise<any> {
    const userRepo = this.getRepository('User');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = data.roleName ? this.seededData.roles[data.roleName] : this.seededData.roles.buyer;
    const assignedRole = data.assignedRoleName
      ? this.seededData.roles[data.assignedRoleName]
      : null;

    const user = userRepo.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName || 'Test User',
      isVerified: data.isVerified !== false,
      role: { id: role.id },
      assignedRole: assignedRole ? { id: assignedRole.id } : null,
      isBanned: false,
      isSuspended: false,
    });

    const savedUser = await userRepo.save(user);
    return {
      ...savedUser,
      password: data.password,
    };
  }

  /**
   * Create additional test role
   * @description Creates a new test role on-the-fly
   *
   * @param data - Role data
   * @returns Promise resolving to created role
   */
  async createTestRole(data: {
    name: string;
    description?: string;
    type?: string;
    priority?: number;
    permissions?: string[];
  }): Promise<any> {
    const roleRepo = this.getRepository('Role');
    const rolePermissionRepo = this.getRepository('RolePermission');

    const role = roleRepo.create({
      name: data.name,
      description: data.description || `Test role: ${data.name}`,
      type: data.type || 'business',
      priority: data.priority || 25,
      isDefault: false,
    });

    const savedRole = await roleRepo.save(role);

    // Assign permissions if specified
    if (data.permissions && data.permissions.length > 0) {
      for (const permName of data.permissions) {
        const permission = this.seededData.permissions[permName];
        if (permission) {
          const rolePermission = rolePermissionRepo.create({
            roleId: savedRole.id,
            permissionId: permission.id,
          });
          await rolePermissionRepo.save(rolePermission);
        }
      }
    }

    this.seededData.roles[data.name] = {
      ...savedRole,
      permissionNames: data.permissions || [],
    };

    return savedRole;
  }

  /**
   * Delete test role
   * @description Removes a dynamically created test role
   *
   * @param roleName - Role name to delete
   */
  async deleteTestRole(roleName: string): Promise<void> {
    const roleRepo = this.getRepository('Role');
    const rolePermissionRepo = this.getRepository('RolePermission');

    const role = this.seededData.roles[roleName];
    if (role?.id) {
      await rolePermissionRepo.delete({ roleId: role.id });
      await roleRepo.delete({ id: role.id });
      delete this.seededData.roles[roleName];
    }
  }
}

/**
 * Create E2E Seed Helper instance
 * @description Factory function to create seed helper
 *
 * @param app - NestJS application instance
 * @returns E2ESeedHelper instance
 *
 * @example
 * ```typescript
 * const seedHelper = createE2ESeedHelper(app);
 * await seedHelper.seedTestData();
 * ```
 */
export function createE2ESeedHelper(app: INestApplication): E2ESeedHelper {
  return new E2ESeedHelper(app);
}

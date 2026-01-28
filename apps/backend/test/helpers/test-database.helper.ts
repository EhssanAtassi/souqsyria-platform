/**
 * @file test-database.helper.ts
 * @description Database seeding and cleanup utilities for integration tests
 *
 * Provides methods for:
 * - Creating test roles (buyer, vendor, admin, moderator, support)
 * - Creating test permissions (20+ permissions covering all scenarios)
 * - Setting up role-permission mappings
 * - Creating route-permission mappings
 * - Cleaning up test data between tests
 *
 * DUAL-ROLE ARCHITECTURE:
 * - Business roles: buyer, vendor (assigned to User.role)
 * - Admin roles: admin, moderator, support (assigned to User.assignedRole)
 *
 * PERMISSION CATEGORIES:
 * - Products: view, create, edit, delete, manage
 * - Orders: view, create, manage
 * - Users: view, manage
 * - Analytics: view
 * - System: manage settings
 * - Buyer-specific: wishlist, cart, checkout
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 * @since 2025-01-23
 */

import { Repository } from 'typeorm';
import { Permission } from '../../src/access-control/entities/permission.entity';
import { RolePermission } from '../../src/access-control/entities/role-permission.entity';
import { Role } from '../../src/roles/entities/role.entity';
import { Route } from '../../src/access-control/entities/route.entity';
import { User } from '../../src/users/entities/user.entity';
import { ActivityLog } from '../../src/access-control/entities/activity-log.entity';
import { SecurityAuditLog } from '../../src/access-control/entities/security-audit-log.entity';

/**
 * Interface for test roles structure
 */
export interface TestRoles {
  buyer: Role;
  vendor: Role;
  admin: Role;
  moderator: Role;
  support: Role;
}

/**
 * Interface for test permissions structure
 */
export interface TestPermissions {
  // Product permissions
  viewProducts: Permission;
  createProducts: Permission;
  editProducts: Permission;
  deleteProducts: Permission;
  manageProducts: Permission;

  // Order permissions
  viewOrders: Permission;
  createOrders: Permission;
  manageOrders: Permission;

  // User permissions
  viewUsers: Permission;
  manageUsers: Permission;

  // Analytics permissions
  viewAnalytics: Permission;

  // System permissions
  manageSystemSettings: Permission;
  accessAdminPanel: Permission;

  // Buyer-specific permissions
  addToWishlist: Permission;
  addToCart: Permission;
  checkout: Permission;

  // Vendor-specific permissions
  manageInventory: Permission;
  viewVendorAnalytics: Permission;

  // Moderator-specific permissions
  moderateContent: Permission;
  handleReports: Permission;
}

/**
 * Interface for seeded test data result
 */
export interface SeededTestData {
  roles: TestRoles;
  permissions: TestPermissions;
  rolePermissions: RolePermission[];
}

/**
 * TestDatabaseHelper
 *
 * Helper class for database seeding and cleanup in integration tests.
 * Provides methods to set up consistent test data across all test cases.
 *
 * @example
 * ```typescript
 * const dbHelper = new TestDatabaseHelper(
 *   roleRepository,
 *   permissionRepository,
 *   rolePermissionRepository,
 *   routeRepository,
 *   userRepository,
 *   activityLogRepository,
 *   securityAuditLogRepository
 * );
 *
 * // Before each test
 * await dbHelper.cleanDatabase();
 * const { roles, permissions } = await dbHelper.seedTestData();
 * ```
 */
export class TestDatabaseHelper {
  constructor(
    private readonly roleRepository: Repository<Role>,
    private readonly permissionRepository: Repository<Permission>,
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly routeRepository: Repository<Route>,
    private readonly userRepository: Repository<User>,
    private readonly activityLogRepository: Repository<ActivityLog>,
    private readonly securityAuditLogRepository: Repository<SecurityAuditLog>,
  ) {}

  /**
   * Clean all test data from the database
   * Respects foreign key constraints by clearing tables in correct order
   */
  async cleanDatabase(): Promise<void> {
    // Clear in order of dependencies (child tables first)
    await this.securityAuditLogRepository.clear();
    await this.activityLogRepository.clear();
    await this.rolePermissionRepository.clear();
    await this.routeRepository.clear();
    await this.userRepository.clear();
    await this.permissionRepository.clear();
    await this.roleRepository.clear();
  }

  /**
   * Seed complete test data including roles, permissions, and mappings
   *
   * @returns Seeded test data including roles and permissions
   */
  async seedTestData(): Promise<SeededTestData> {
    const roles = await this.seedRoles();
    const permissions = await this.seedPermissions();
    const rolePermissions = await this.seedRolePermissions(roles, permissions);

    return { roles, permissions, rolePermissions };
  }

  /**
   * Seed test roles with proper type and priority settings
   *
   * Role Types:
   * - business: buyer, vendor
   * - admin: admin, moderator, support
   *
   * Priority (higher = more privileges):
   * - admin: 100
   * - moderator: 50
   * - support: 25
   * - vendor: 10
   * - buyer: 0 (default)
   */
  async seedRoles(): Promise<TestRoles> {
    const buyer = await this.roleRepository.save(
      this.roleRepository.create({
        name: 'buyer',
        description: 'Standard buyer/customer role for purchasing products',
        isDefault: true,
        type: 'business',
        priority: 0,
      }),
    );

    const vendor = await this.roleRepository.save(
      this.roleRepository.create({
        name: 'vendor',
        description: 'Vendor role for selling products',
        isDefault: false,
        type: 'business',
        priority: 10,
      }),
    );

    const admin = await this.roleRepository.save(
      this.roleRepository.create({
        name: 'admin',
        description: 'System administrator with full access',
        isDefault: false,
        type: 'admin',
        priority: 100,
      }),
    );

    const moderator = await this.roleRepository.save(
      this.roleRepository.create({
        name: 'moderator',
        description: 'Content moderator with user management access',
        isDefault: false,
        type: 'admin',
        priority: 50,
      }),
    );

    const support = await this.roleRepository.save(
      this.roleRepository.create({
        name: 'support',
        description: 'Customer support with limited admin access',
        isDefault: false,
        type: 'admin',
        priority: 25,
      }),
    );

    return { buyer, vendor, admin, moderator, support };
  }

  /**
   * Seed test permissions covering all system functionality
   *
   * Permission naming convention: {action}_{resource}
   * Examples: view_products, manage_users, create_orders
   */
  async seedPermissions(): Promise<TestPermissions> {
    // Product permissions
    const viewProducts = await this.createPermission(
      'view_products',
      'View product listings and details',
      'products',
      'view',
    );

    const createProducts = await this.createPermission(
      'create_products',
      'Create new product listings',
      'products',
      'create',
    );

    const editProducts = await this.createPermission(
      'edit_products',
      'Edit existing product listings',
      'products',
      'edit',
    );

    const deleteProducts = await this.createPermission(
      'delete_products',
      'Delete product listings',
      'products',
      'delete',
    );

    const manageProducts = await this.createPermission(
      'manage_products',
      'Full product management (CRUD)',
      'products',
      'manage',
    );

    // Order permissions
    const viewOrders = await this.createPermission(
      'view_orders',
      'View order history and details',
      'orders',
      'view',
    );

    const createOrders = await this.createPermission(
      'create_orders',
      'Create new orders (purchase)',
      'orders',
      'create',
    );

    const manageOrders = await this.createPermission(
      'manage_orders',
      'Full order management (fulfill, cancel, refund)',
      'orders',
      'manage',
    );

    // User permissions
    const viewUsers = await this.createPermission(
      'view_users',
      'View user accounts and profiles',
      'users',
      'view',
    );

    const manageUsers = await this.createPermission(
      'manage_users',
      'Full user management (create, edit, ban, delete)',
      'users',
      'manage',
    );

    // Analytics permissions
    const viewAnalytics = await this.createPermission(
      'view_analytics',
      'View system analytics and reports',
      'analytics',
      'view',
    );

    // System permissions
    const manageSystemSettings = await this.createPermission(
      'manage_system_settings',
      'Manage system configuration and settings',
      'system',
      'manage',
      true, // isSystem
    );

    const accessAdminPanel = await this.createPermission(
      'access_admin_panel',
      'Access the admin dashboard',
      'admin',
      'access',
      true, // isSystem
    );

    // Buyer-specific permissions
    const addToWishlist = await this.createPermission(
      'add_to_wishlist',
      'Add products to personal wishlist',
      'wishlist',
      'create',
    );

    const addToCart = await this.createPermission(
      'add_to_cart',
      'Add products to shopping cart',
      'cart',
      'create',
    );

    const checkout = await this.createPermission(
      'checkout',
      'Complete checkout and place orders',
      'checkout',
      'execute',
    );

    // Vendor-specific permissions
    const manageInventory = await this.createPermission(
      'manage_inventory',
      'Manage product inventory and stock',
      'inventory',
      'manage',
    );

    const viewVendorAnalytics = await this.createPermission(
      'view_vendor_analytics',
      'View vendor-specific sales analytics',
      'vendor_analytics',
      'view',
    );

    // Moderator-specific permissions
    const moderateContent = await this.createPermission(
      'moderate_content',
      'Moderate user-generated content',
      'content',
      'moderate',
    );

    const handleReports = await this.createPermission(
      'handle_reports',
      'Handle user reports and complaints',
      'reports',
      'manage',
    );

    return {
      viewProducts,
      createProducts,
      editProducts,
      deleteProducts,
      manageProducts,
      viewOrders,
      createOrders,
      manageOrders,
      viewUsers,
      manageUsers,
      viewAnalytics,
      manageSystemSettings,
      accessAdminPanel,
      addToWishlist,
      addToCart,
      checkout,
      manageInventory,
      viewVendorAnalytics,
      moderateContent,
      handleReports,
    };
  }

  /**
   * Create a single permission
   */
  private async createPermission(
    name: string,
    description: string,
    resource: string,
    action: string,
    isSystem: boolean = false,
  ): Promise<Permission> {
    return this.permissionRepository.save(
      this.permissionRepository.create({
        name,
        description,
        resource,
        action,
        isSystem,
        category: resource, // Legacy field
      }),
    );
  }

  /**
   * Seed role-permission mappings according to the dual-role architecture
   *
   * Mapping Strategy:
   * - Buyer: view_products, view_orders, create_orders, add_to_wishlist, add_to_cart, checkout
   * - Vendor: view_products, create_products, edit_products, manage_products, manage_inventory, view_orders, manage_orders, view_vendor_analytics
   * - Admin: ALL permissions
   * - Moderator: manage_users, moderate_content, handle_reports, view_analytics, access_admin_panel
   * - Support: view_users, view_orders, handle_reports, access_admin_panel
   */
  async seedRolePermissions(
    roles: TestRoles,
    permissions: TestPermissions,
  ): Promise<RolePermission[]> {
    const rolePermissions: RolePermission[] = [];

    // Buyer permissions
    const buyerPermissions = [
      permissions.viewProducts,
      permissions.viewOrders,
      permissions.createOrders,
      permissions.addToWishlist,
      permissions.addToCart,
      permissions.checkout,
    ];

    for (const perm of buyerPermissions) {
      rolePermissions.push(
        await this.createRolePermission(roles.buyer, perm),
      );
    }

    // Vendor permissions
    const vendorPermissions = [
      permissions.viewProducts,
      permissions.createProducts,
      permissions.editProducts,
      permissions.manageProducts,
      permissions.manageInventory,
      permissions.viewOrders,
      permissions.manageOrders,
      permissions.viewVendorAnalytics,
    ];

    for (const perm of vendorPermissions) {
      rolePermissions.push(
        await this.createRolePermission(roles.vendor, perm),
      );
    }

    // Admin permissions (all)
    const allPermissions = Object.values(permissions);
    for (const perm of allPermissions) {
      rolePermissions.push(
        await this.createRolePermission(roles.admin, perm),
      );
    }

    // Moderator permissions
    const moderatorPermissions = [
      permissions.manageUsers,
      permissions.moderateContent,
      permissions.handleReports,
      permissions.viewAnalytics,
      permissions.accessAdminPanel,
      permissions.viewProducts,
      permissions.viewOrders,
    ];

    for (const perm of moderatorPermissions) {
      rolePermissions.push(
        await this.createRolePermission(roles.moderator, perm),
      );
    }

    // Support permissions
    const supportPermissions = [
      permissions.viewUsers,
      permissions.viewOrders,
      permissions.handleReports,
      permissions.accessAdminPanel,
      permissions.viewProducts,
    ];

    for (const perm of supportPermissions) {
      rolePermissions.push(
        await this.createRolePermission(roles.support, perm),
      );
    }

    return rolePermissions;
  }

  /**
   * Create a single role-permission mapping
   */
  private async createRolePermission(
    role: Role,
    permission: Permission,
  ): Promise<RolePermission> {
    return this.rolePermissionRepository.save(
      this.rolePermissionRepository.create({
        role,
        permission,
      }),
    );
  }

  /**
   * Create test routes with permission mappings
   *
   * @param permissions - Test permissions to link to routes
   * @returns Created routes
   */
  async seedRoutes(permissions: TestPermissions): Promise<Route[]> {
    const routes: Route[] = [];

    // Product routes
    routes.push(
      await this.createRoute('/api/products', 'GET', permissions.viewProducts),
    );
    routes.push(
      await this.createRoute('/api/products', 'POST', permissions.createProducts),
    );
    routes.push(
      await this.createRoute('/api/products/:id', 'PUT', permissions.editProducts),
    );
    routes.push(
      await this.createRoute('/api/products/:id', 'DELETE', permissions.deleteProducts),
    );

    // Order routes
    routes.push(
      await this.createRoute('/api/orders', 'GET', permissions.viewOrders),
    );
    routes.push(
      await this.createRoute('/api/orders', 'POST', permissions.createOrders),
    );
    routes.push(
      await this.createRoute('/api/orders/:id', 'PUT', permissions.manageOrders),
    );

    // Admin routes
    routes.push(
      await this.createRoute('/api/admin/users', 'GET', permissions.manageUsers),
    );
    routes.push(
      await this.createRoute('/api/admin/analytics', 'GET', permissions.viewAnalytics),
    );
    routes.push(
      await this.createRoute('/api/admin/settings', 'GET', permissions.manageSystemSettings),
    );
    routes.push(
      await this.createRoute('/api/admin/settings', 'PUT', permissions.manageSystemSettings),
    );

    // Buyer routes
    routes.push(
      await this.createRoute('/api/wishlist', 'POST', permissions.addToWishlist),
    );
    routes.push(
      await this.createRoute('/api/cart', 'POST', permissions.addToCart),
    );
    routes.push(
      await this.createRoute('/api/checkout', 'POST', permissions.checkout),
    );

    // Vendor routes
    routes.push(
      await this.createRoute('/api/vendor/inventory', 'GET', permissions.manageInventory),
    );
    routes.push(
      await this.createRoute('/api/vendor/analytics', 'GET', permissions.viewVendorAnalytics),
    );

    return routes;
  }

  /**
   * Create a single route with permission
   */
  private async createRoute(
    path: string,
    method: string,
    permission: Permission | null,
  ): Promise<Route> {
    return this.routeRepository.save(
      this.routeRepository.create({
        path,
        method,
        permission,
      }),
    );
  }

  /**
   * Create a public route (no permission required)
   */
  async createPublicRoute(path: string, method: string): Promise<Route> {
    return this.createRoute(path, method, null);
  }

  /**
   * Add a permission to an existing role
   */
  async addPermissionToRole(
    role: Role,
    permission: Permission,
  ): Promise<RolePermission> {
    return this.createRolePermission(role, permission);
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(
    role: Role,
    permission: Permission,
  ): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        role: { id: role.id },
        permission: { id: permission.id },
      },
      relations: ['role', 'permission'],
    });

    if (rolePermission) {
      await this.rolePermissionRepository.remove(rolePermission);
    }
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(role: Role): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: { id: role.id } },
      relations: ['permission'],
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Verify role has a specific permission
   */
  async roleHasPermission(role: Role, permissionName: string): Promise<boolean> {
    const permissions = await this.getRolePermissions(role);
    return permissions.some(p => p.name === permissionName);
  }

  /**
   * Clear security audit logs (useful for testing audit functionality)
   */
  async clearAuditLogs(): Promise<void> {
    await this.securityAuditLogRepository.clear();
  }

  /**
   * Get security audit logs for a user
   */
  async getUserAuditLogs(userId: number): Promise<SecurityAuditLog[]> {
    return this.securityAuditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get security audit logs by success status
   */
  async getAuditLogsBySuccess(success: boolean): Promise<SecurityAuditLog[]> {
    return this.securityAuditLogRepository.find({
      where: { success },
      order: { createdAt: 'DESC' },
    });
  }
}

/**
 * Helper function to create a database helper instance
 */
export function createDatabaseHelper(
  roleRepository: Repository<Role>,
  permissionRepository: Repository<Permission>,
  rolePermissionRepository: Repository<RolePermission>,
  routeRepository: Repository<Route>,
  userRepository: Repository<User>,
  activityLogRepository: Repository<ActivityLog>,
  securityAuditLogRepository: Repository<SecurityAuditLog>,
): TestDatabaseHelper {
  return new TestDatabaseHelper(
    roleRepository,
    permissionRepository,
    rolePermissionRepository,
    routeRepository,
    userRepository,
    activityLogRepository,
    securityAuditLogRepository,
  );
}

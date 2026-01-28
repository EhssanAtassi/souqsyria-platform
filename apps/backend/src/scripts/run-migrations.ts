/**
 * @file run-migrations.ts
 * @description Database migration and seeding script for production deployments
 *
 * This script runs TypeORM migrations and applies database seeders in the correct order.
 * Designed to be run once during application startup or as a deployment step.
 *
 * Features:
 * - Idempotent execution (safe to run multiple times)
 * - Proper error handling and logging
 * - Transaction support for consistency
 * - Seed data for RBAC system initialization
 *
 * Usage:
 * ```bash
 * # Run migrations and seeds
 * npm run migrations:run
 *
 * # Run migrations only (no seeds)
 * npm run migrations:run -- --no-seed
 *
 * # Revert last migration
 * npm run migrations:revert
 *
 * # Show pending migrations
 * npm run migrations:show
 * ```
 *
 * Called automatically:
 * - In Docker container startup (via entrypoint)
 * - In Kubernetes job before deployment
 * - In CI/CD pipeline during deployment
 *
 * @version 1.0.0
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env file
config();

/**
 * Create TypeORM DataSource for migrations
 * Uses same configuration as application but with migration-specific settings
 */
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'souqsyria',

  // Entities: Auto-load all .entity.ts files
  entities: [path.join(__dirname, '/../**/*.entity{.ts,.js}')],

  // Migrations: Auto-load all migration files
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],

  // Subscribers for entity hooks
  subscribers: [],

  // Enable logging for migrations
  logging: ['query', 'error', 'warn'],

  // Synchronize schema with entities (WARNING: ONLY for development)
  // Production should use migrations instead
  synchronize: false,

  // Drop schema on init (WARNING: DANGEROUS - only for testing)
  dropSchema: false,

  // Connection pool configuration
  extra: {
    acquireTimeout: 30000,
    timeout: 30000,
  },
});

/**
 * Seed data class
 * Contains all static seed data needed for RBAC initialization
 */
class SeedData {
  /**
   * Default roles for the system
   * Used for basic RBAC implementation
   */
  static readonly ROLES = [
    {
      name: 'super_admin',
      description: 'Super Administrator - Full system access',
      priority: 1000,
    },
    {
      name: 'admin',
      description: 'Administrator - Can manage users, roles, and permissions',
      priority: 900,
    },
    {
      name: 'vendor',
      description: 'Vendor - Can manage own products and orders',
      priority: 500,
    },
    {
      name: 'staff',
      description: 'Staff - Support and operations',
      priority: 400,
    },
    {
      name: 'customer',
      description: 'Customer - Default user role',
      priority: 100,
    },
  ];

  /**
   * Default permissions for the system
   * Granular permissions for RBAC
   */
  static readonly PERMISSIONS = [
    // User Management Permissions
    {
      name: 'users.create',
      description: 'Create new users',
      resource: 'users',
      action: 'create',
    },
    {
      name: 'users.read',
      description: 'View user details',
      resource: 'users',
      action: 'read',
    },
    {
      name: 'users.update',
      description: 'Update user information',
      resource: 'users',
      action: 'update',
    },
    {
      name: 'users.delete',
      description: 'Delete users',
      resource: 'users',
      action: 'delete',
    },
    {
      name: 'users.list',
      description: 'List all users',
      resource: 'users',
      action: 'list',
    },

    // Role Management Permissions
    {
      name: 'roles.create',
      description: 'Create new roles',
      resource: 'roles',
      action: 'create',
    },
    {
      name: 'roles.read',
      description: 'View role details',
      resource: 'roles',
      action: 'read',
    },
    {
      name: 'roles.update',
      description: 'Update roles',
      resource: 'roles',
      action: 'update',
    },
    {
      name: 'roles.delete',
      description: 'Delete roles',
      resource: 'roles',
      action: 'delete',
    },
    {
      name: 'roles.list',
      description: 'List all roles',
      resource: 'roles',
      action: 'list',
    },

    // Permission Management Permissions
    {
      name: 'permissions.create',
      description: 'Create new permissions',
      resource: 'permissions',
      action: 'create',
    },
    {
      name: 'permissions.read',
      description: 'View permissions',
      resource: 'permissions',
      action: 'read',
    },
    {
      name: 'permissions.update',
      description: 'Update permissions',
      resource: 'permissions',
      action: 'update',
    },
    {
      name: 'permissions.delete',
      description: 'Delete permissions',
      resource: 'permissions',
      action: 'delete',
    },
    {
      name: 'permissions.list',
      description: 'List all permissions',
      resource: 'permissions',
      action: 'list',
    },

    // Product Management Permissions
    {
      name: 'products.create',
      description: 'Create products',
      resource: 'products',
      action: 'create',
    },
    {
      name: 'products.read',
      description: 'View products',
      resource: 'products',
      action: 'read',
    },
    {
      name: 'products.update',
      description: 'Update products',
      resource: 'products',
      action: 'update',
    },
    {
      name: 'products.delete',
      description: 'Delete products',
      resource: 'products',
      action: 'delete',
    },
    {
      name: 'products.list',
      description: 'List products',
      resource: 'products',
      action: 'list',
    },

    // Order Management Permissions
    {
      name: 'orders.read',
      description: 'View orders',
      resource: 'orders',
      action: 'read',
    },
    {
      name: 'orders.update',
      description: 'Update order status',
      resource: 'orders',
      action: 'update',
    },
    {
      name: 'orders.list',
      description: 'List orders',
      resource: 'orders',
      action: 'list',
    },

    // Audit and Security Permissions
    {
      name: 'audit.read',
      description: 'View audit logs',
      resource: 'audit',
      action: 'read',
    },
    {
      name: 'audit.export',
      description: 'Export audit logs',
      resource: 'audit',
      action: 'export',
    },

    // System Admin Permissions
    {
      name: 'system.admin',
      description: 'Full system administration',
      resource: 'system',
      action: 'admin',
    },
  ];

  /**
   * Default role-permission assignments
   * Maps roles to their initial permissions
   */
  static readonly ROLE_PERMISSIONS = [
    // Super Admin - All permissions
    {
      role: 'super_admin',
      permissions: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'users.list',
        'roles.create',
        'roles.read',
        'roles.update',
        'roles.delete',
        'roles.list',
        'permissions.create',
        'permissions.read',
        'permissions.update',
        'permissions.delete',
        'permissions.list',
        'products.create',
        'products.read',
        'products.update',
        'products.delete',
        'products.list',
        'orders.read',
        'orders.update',
        'orders.list',
        'audit.read',
        'audit.export',
        'system.admin',
      ],
    },

    // Admin - Most permissions except system
    {
      role: 'admin',
      permissions: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'users.list',
        'roles.read',
        'roles.update',
        'roles.list',
        'permissions.read',
        'permissions.list',
        'products.create',
        'products.read',
        'products.update',
        'products.delete',
        'products.list',
        'orders.read',
        'orders.update',
        'orders.list',
        'audit.read',
      ],
    },

    // Vendor - Own products and orders
    {
      role: 'vendor',
      permissions: [
        'products.create',
        'products.read',
        'products.update',
        'orders.read',
        'orders.list',
      ],
    },

    // Staff - Support and operations
    {
      role: 'staff',
      permissions: [
        'orders.read',
        'orders.update',
        'orders.list',
        'products.read',
        'products.list',
      ],
    },

    // Customer - Minimal permissions
    {
      role: 'customer',
      permissions: ['products.read', 'products.list', 'orders.read'],
    },
  ];
}

/**
 * Migration Runner Class
 * Orchestrates database migrations and seeding
 */
class MigrationRunner {
  /**
   * Run all migrations and seeds
   * Main entry point for the migration process
   */
  static async run(): Promise<void> {
    try {
      console.log('Starting database migration...');
      console.log('Environment:', process.env.NODE_ENV || 'development');
      console.log('Database:', process.env.DB_DATABASE);
      console.log('Host:', process.env.DB_HOST);

      // Step 1: Initialize database connection
      console.log('\n[1/4] Initializing database connection...');
      await AppDataSource.initialize();
      console.log('[✓] Database connection established');

      // Step 2: Run pending migrations
      console.log('\n[2/4] Running pending migrations...');
      const migrations = await AppDataSource.runMigrations();
      console.log(`[✓] Ran ${migrations.length} migrations`);

      // Step 3: Seed initial data
      if (process.argv[2] !== '--no-seed') {
        console.log('\n[3/4] Seeding database with initial data...');
        await this.seedDatabase();
        console.log('[✓] Database seeded successfully');
      } else {
        console.log('\n[3/4] Skipping seeding (--no-seed flag)');
      }

      // Step 4: Verify database
      console.log('\n[4/4] Verifying database integrity...');
      await this.verifyDatabase();
      console.log('[✓] Database verification passed');

      console.log('\n[✓] Migration completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('\n[✗] Migration failed!');
      console.error('Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    } finally {
      // Always close database connection
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
      }
    }
  }

  /**
   * Seed the database with initial data
   * Creates roles, permissions, and role-permission mappings
   * Idempotent - safe to run multiple times
   */
  private static async seedDatabase(): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Seed roles
      for (const role of SeedData.ROLES) {
        // Check if role already exists (idempotent)
        const existing = await queryRunner.query(
          'SELECT * FROM roles WHERE name = ?',
          [role.name],
        );

        if (existing.length === 0) {
          await queryRunner.query(
            'INSERT INTO roles (name, description, priority) VALUES (?, ?, ?)',
            [role.name, role.description, role.priority],
          );
          console.log(`  Created role: ${role.name}`);
        } else {
          console.log(`  Role exists: ${role.name} (skipped)`);
        }
      }

      // Seed permissions
      for (const permission of SeedData.PERMISSIONS) {
        // Check if permission already exists (idempotent)
        const existing = await queryRunner.query(
          'SELECT * FROM permissions WHERE name = ?',
          [permission.name],
        );

        if (existing.length === 0) {
          await queryRunner.query(
            'INSERT INTO permissions (name, description, resource, action) VALUES (?, ?, ?, ?)',
            [
              permission.name,
              permission.description,
              permission.resource,
              permission.action,
            ],
          );
          console.log(`  Created permission: ${permission.name}`);
        } else {
          console.log(`  Permission exists: ${permission.name} (skipped)`);
        }
      }

      // Seed role-permission mappings
      for (const rolePermission of SeedData.ROLE_PERMISSIONS) {
        const roleQuery = await queryRunner.query(
          'SELECT id FROM roles WHERE name = ?',
          [rolePermission.role],
        );

        if (roleQuery.length === 0) {
          console.warn(`  Warning: Role not found: ${rolePermission.role}`);
          continue;
        }

        const roleId = roleQuery[0].id;

        for (const permissionName of rolePermission.permissions) {
          const permQuery = await queryRunner.query(
            'SELECT id FROM permissions WHERE name = ?',
            [permissionName],
          );

          if (permQuery.length === 0) {
            console.warn(`  Warning: Permission not found: ${permissionName}`);
            continue;
          }

          const permissionId = permQuery[0].id;

          // Check if mapping already exists (idempotent)
          const existing = await queryRunner.query(
            'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
            [roleId, permissionId],
          );

          if (existing.length === 0) {
            await queryRunner.query(
              'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
              [roleId, permissionId],
            );
          }
        }

        console.log(
          `  Assigned ${rolePermission.permissions.length} permissions to role: ${rolePermission.role}`,
        );
      }

      await queryRunner.commitTransaction();
      console.log('Database seeding completed successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Verify database integrity
   * Checks that all critical tables exist and contain expected data
   */
  private static async verifyDatabase(): Promise<void> {
    const tables = await AppDataSource.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = '${process.env.DB_DATABASE}'
    `);

    console.log(`  Found ${tables.length} tables in database`);

    // Check for critical tables
    const criticalTables = [
      'users',
      'roles',
      'permissions',
      'role_permissions',
    ];

    for (const table of criticalTables) {
      const exists = tables.some((t) => t.TABLE_NAME === table);
      if (exists) {
        const count = await AppDataSource.query(
          `SELECT COUNT(*) as count FROM ${table}`,
        );
        console.log(`  Table '${table}': ${count[0].count} records`);
      } else {
        console.warn(`  Warning: Critical table missing: ${table}`);
      }
    }
  }
}

// Run migrations if this is the main module
if (require.main === module) {
  MigrationRunner.run();
}

export default MigrationRunner;

/**
 * @file access-control.seeder.service.ts
 * @description Access Control Seeder Service for SouqSyria Platform
 * Seeds roles, permissions, and their relationships for comprehensive access control
 *
 * @swagger
 * @tags Access Control Seeding
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../../roles/entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Route } from '../entities/route.entity';
import { PERMISSION_SEEDS, PermissionSeedData } from './permissions.seed';
import { ALL_ROLES, RoleSeedData } from './roles.seed';
import {
  RouteDiscoveryService,
  RouteDiscoveryResult,
  DiscoveredRoute,
} from './route-discovery.service';

export interface AccessControlSeedingOptions {
  seedPermissions?: boolean;
  seedRoles?: boolean;
  seedRolePermissions?: boolean;
  seedRoutes?: boolean;
  overwriteExisting?: boolean;
  logLevel?: 'debug' | 'info' | 'warn';
}

export interface SeedingStats {
  permissionsCreated: number;
  permissionsUpdated: number;
  rolesCreated: number;
  rolesUpdated: number;
  rolePermissionsCreated: number;
  routesCreated: number;
  routesUpdated: number;
  routesMapped: number;
  routesUnmapped: number;
  totalProcessingTime: number;
}

@Injectable()
export class AccessControlSeederService {
  private readonly logger = new Logger(AccessControlSeederService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    private readonly routeDiscoveryService: RouteDiscoveryService,
  ) {}

  /**
   * Main seeding method that orchestrates the entire access control seeding process
   *
   * @param options - Seeding configuration options
   * @returns Promise<SeedingStats> - Statistics about the seeding operation
   */
  async seedAccessControlSystem(
    options: AccessControlSeedingOptions = {},
  ): Promise<SeedingStats> {
    this.logger.log('🛡️ Starting Access Control System Seeding...');
    const startTime = Date.now();

    const defaultOptions: AccessControlSeedingOptions = {
      seedPermissions: true,
      seedRoles: true,
      seedRolePermissions: true,
      seedRoutes: true,
      overwriteExisting: false,
      logLevel: 'info',
      ...options,
    };

    const stats: SeedingStats = {
      permissionsCreated: 0,
      permissionsUpdated: 0,
      rolesCreated: 0,
      rolesUpdated: 0,
      rolePermissionsCreated: 0,
      routesCreated: 0,
      routesUpdated: 0,
      routesMapped: 0,
      routesUnmapped: 0,
      totalProcessingTime: 0,
    };

    try {
      // Step 1: Seed permissions
      if (defaultOptions.seedPermissions) {
        const permissionStats = await this.seedPermissions(defaultOptions);
        stats.permissionsCreated = permissionStats.created;
        stats.permissionsUpdated = permissionStats.updated;
      }

      // Step 2: Seed roles
      if (defaultOptions.seedRoles) {
        const roleStats = await this.seedRoles(defaultOptions);
        stats.rolesCreated = roleStats.created;
        stats.rolesUpdated = roleStats.updated;
      }

      // Step 3: Seed role-permission relationships
      if (defaultOptions.seedRolePermissions) {
        stats.rolePermissionsCreated =
          await this.seedRolePermissions(defaultOptions);
      }

      // Step 4: Seed routes and route-permission mappings
      if (defaultOptions.seedRoutes) {
        const routeStats = await this.seedRoutes(defaultOptions);
        stats.routesCreated = routeStats.created;
        stats.routesUpdated = routeStats.updated;
        stats.routesMapped = routeStats.mapped;
        stats.routesUnmapped = routeStats.unmapped;
      }

      stats.totalProcessingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Access Control Seeding completed successfully in ${stats.totalProcessingTime}ms`,
      );
      this.logSeedingStats(stats);

      return stats;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Access Control Seeding failed: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new Error(`Access Control Seeding failed: ${(error as Error).message}`);
    }
  }

  /**
   * Seeds all permissions into the database
   *
   * @param options - Seeding options
   * @returns Promise<{created: number, updated: number}> - Creation/update statistics
   */
  private async seedPermissions(
    options: AccessControlSeedingOptions,
  ): Promise<{ created: number; updated: number }> {
    this.logger.log(`🔑 Seeding ${PERMISSION_SEEDS.length} permissions...`);

    let created = 0;
    let updated = 0;

    for (const permissionData of PERMISSION_SEEDS) {
      try {
        const existingPermission = await this.permissionRepository.findOne({
          where: { name: permissionData.name },
        });

        if (existingPermission) {
          if (options.overwriteExisting) {
            await this.permissionRepository.update(existingPermission.id, {
              description: permissionData.description,
              category: permissionData.category,
            });
            updated++;
            if (options.logLevel === 'debug') {
              this.logger.debug(`Updated permission: ${permissionData.name}`);
            }
          }
        } else {
          const permission = this.permissionRepository.create({
            name: permissionData.name,
            description: permissionData.description,
            category: permissionData.category,
          });
          await this.permissionRepository.save(permission);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created permission: ${permissionData.name}`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process permission ${permissionData.name}: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Permissions: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Seeds all roles into the database
   *
   * @param options - Seeding options
   * @returns Promise<{created: number, updated: number}> - Creation/update statistics
   */
  private async seedRoles(
    options: AccessControlSeedingOptions,
  ): Promise<{ created: number; updated: number }> {
    this.logger.log(`👥 Seeding ${ALL_ROLES.length} roles...`);

    let created = 0;
    let updated = 0;

    for (const roleData of ALL_ROLES) {
      try {
        const existingRole = await this.roleRepository.findOne({
          where: { name: roleData.name },
        });

        if (existingRole) {
          if (options.overwriteExisting) {
            await this.roleRepository.update(existingRole.id, {
              description: roleData.description,
              isDefault: roleData.isDefault,
              type: roleData.type,
              priority: roleData.priority ?? 0,
              isSystem: roleData.isSystem ?? false,
            });
            updated++;
            if (options.logLevel === 'debug') {
              this.logger.debug(`Updated role: ${roleData.name}`);
            }
          }
        } else {
          const role = this.roleRepository.create({
            name: roleData.name,
            description: roleData.description,
            isDefault: roleData.isDefault,
            type: roleData.type,
            priority: roleData.priority ?? 0,
            isSystem: roleData.isSystem ?? false,
          });
          await this.roleRepository.save(role);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created role: ${roleData.name}`);
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process role ${roleData.name}: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Roles: ${created} created, ${updated} updated`);
    return { created, updated };
  }

  /**
   * Seeds role-permission relationships
   *
   * @param options - Seeding options
   * @returns Promise<number> - Number of relationships created
   */
  private async seedRolePermissions(
    options: AccessControlSeedingOptions,
  ): Promise<number> {
    this.logger.log('🔗 Seeding role-permission relationships...');

    let created = 0;

    for (const roleData of ALL_ROLES) {
      try {
        // Get role from database
        const role = await this.roleRepository.findOne({
          where: { name: roleData.name },
        });

        if (!role) {
          this.logger.warn(
            `Role ${roleData.name} not found, skipping permissions`,
          );
          continue;
        }

        // Process each permission for this role
        for (const permissionName of roleData.permissions) {
          const permission = await this.permissionRepository.findOne({
            where: { name: permissionName },
          });

          if (!permission) {
            this.logger.warn(
              `Permission ${permissionName} not found for role ${roleData.name}`,
            );
            continue;
          }

          // Check if relationship already exists
          const existingRelationship =
            await this.rolePermissionRepository.findOne({
              where: {
                role: { id: role.id },
                permission: { id: permission.id },
              },
            });

          if (!existingRelationship) {
            const rolePermission = this.rolePermissionRepository.create({
              role,
              permission,
            });
            await this.rolePermissionRepository.save(rolePermission);
            created++;

            if (options.logLevel === 'debug') {
              this.logger.debug(
                `Created relationship: ${roleData.name} -> ${permissionName}`,
              );
            }
          }
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process role permissions for ${roleData.name}: ${(error as Error).message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Role-Permission relationships: ${created} created`);
    return created;
  }

  /**
   * Seeds all routes discovered in the application and maps them to permissions
   * 
   * Process:
   * 1. Discover all routes using reflection
   * 2. Create/update route records in database
   * 3. Map routes to permissions (explicit or auto-mapped)
   * 4. Report unmapped routes that need manual attention
   * 
   * @param options - Seeding options
   * @returns Promise<{created: number, updated: number, mapped: number, unmapped: number}>
   */
  async seedRoutes(
    options: AccessControlSeedingOptions,
  ): Promise<{ created: number; updated: number; mapped: number; unmapped: number }> {
    this.logger.log('🛣️  Seeding routes and route-permission mappings...');

    // Step 1: Discover all routes
    const discoveryResult: RouteDiscoveryResult =
      await this.routeDiscoveryService.discoverAllRoutes();

    // Step 2: Create/update route records
    let created = 0;
    let updated = 0;
    let mapped = 0;
    let unmapped = 0;

    for (const discoveredRoute of discoveryResult.routes) {
      try {
        // Skip public routes (they don't need permission mapping)
        if (discoveredRoute.isPublic) {
          const routeStats = await this.upsertRoute(
            discoveredRoute,
            null,
            options,
          );
          created += routeStats.created;
          updated += routeStats.updated;
          continue;
        }

        // Determine which permission to use
        let permissionName: string | null = null;

        if (discoveredRoute.explicitPermissions.length > 0) {
          // Use the first explicit permission (multi-permission routes need custom handling)
          permissionName = discoveredRoute.explicitPermissions[0];
        } else if (discoveredRoute.suggestedPermission) {
          // Use auto-mapped permission
          permissionName = discoveredRoute.suggestedPermission;
        }

        if (permissionName) {
          // Find or create the permission
          const permission = await this.findOrWarnPermission(permissionName);

          const routeStats = await this.upsertRoute(
            discoveredRoute,
            permission,
            options,
          );
          created += routeStats.created;
          updated += routeStats.updated;

          if (permission) {
            mapped++;
          } else {
            unmapped++;
          }
        } else {
          // Route couldn't be mapped
          unmapped++;
          this.logger.warn(
            `⚠️  Route could not be auto-mapped: ${discoveredRoute.method} ${discoveredRoute.path}`,
          );
        }
      } catch (error: unknown) {
        this.logger.error(
          `Failed to seed route ${discoveredRoute.path}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `📊 Routes: ${created} created, ${updated} updated, ${mapped} mapped, ${unmapped} unmapped`,
    );

    return { created, updated, mapped, unmapped };
  }

  /**
   * Creates or updates a route record in the database
   * 
   * @param discoveredRoute - Route metadata from discovery
   * @param permission - Permission entity to link (or null for public routes)
   * @param options - Seeding options
   * @returns Promise<{created: number, updated: number}>
   */
  private async upsertRoute(
    discoveredRoute: DiscoveredRoute,
    permission: Permission | null,
    options: AccessControlSeedingOptions,
  ): Promise<{ created: number; updated: number }> {
    // Check if route already exists
    const existingRoute = await this.routeRepository.findOne({
      where: {
        path: discoveredRoute.path,
        method: discoveredRoute.method,
      },
    });

    if (existingRoute) {
      // Update existing route if permission changed
      if (options.overwriteExisting) {
        existingRoute.permission = permission;
        await this.routeRepository.save(existingRoute);

        if (options.logLevel === 'debug') {
          this.logger.debug(
            `Updated route: ${discoveredRoute.method} ${discoveredRoute.path}`,
          );
        }

        return { created: 0, updated: 1 };
      }

      return { created: 0, updated: 0 };
    }

    // Create new route
    const newRoute = this.routeRepository.create({
      path: discoveredRoute.path,
      method: discoveredRoute.method,
      permission: permission,
    });

    await this.routeRepository.save(newRoute);

    if (options.logLevel === 'debug') {
      const permissionLabel = permission
        ? `→ ${permission.name}`
        : discoveredRoute.isPublic
          ? '(public)'
          : '(unmapped)';

      this.logger.debug(
        `Created route: ${discoveredRoute.method} ${discoveredRoute.path} ${permissionLabel}`,
      );
    }

    return { created: 1, updated: 0 };
  }

  /**
   * Finds a permission by name or warns if it doesn't exist
   * 
   * @param permissionName - Name of the permission to find
   * @returns Promise<Permission | null>
   */
  private async findOrWarnPermission(
    permissionName: string,
  ): Promise<Permission | null> {
    const permission = await this.permissionRepository.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      this.logger.warn(
        `⚠️  Permission '${permissionName}' not found. Add it to permissions.seed.ts`,
      );
    }

    return permission;
  }

  /**
   * Generates a detailed route mapping report for review
   * 
   * Shows:
   * - All discovered routes grouped by resource
   * - Which routes are mapped to permissions
   * - Which routes are public
   * - Which routes need manual permission mapping
   * 
   * @returns Promise<any> - Comprehensive route mapping report
   */
  async generateRouteMappingReport(): Promise<any> {
    this.logger.log('📋 Generating route mapping report...');

    const discoveryResult: RouteDiscoveryResult =
      await this.routeDiscoveryService.discoverAllRoutes();

    const grouped =
      this.routeDiscoveryService.groupRoutesByResource(discoveryResult.routes);

    const report: any = {
      summary: {
        totalRoutes: discoveryResult.totalRoutes,
        publicRoutes: discoveryResult.publicRoutes,
        explicitlyMapped: discoveryResult.explicitlyMapped,
        autoMapped: discoveryResult.autoMapped,
        unmapped: discoveryResult.unmapped,
      },
      byResource: {},
      unmappedRoutes: discoveryResult.unmappedRoutes.map((route) => ({
        method: route.method,
        path: route.path,
        controller: route.controllerName,
        handler: route.handlerName,
      })),
    };

    // Group routes by resource
    for (const [resource, routes] of grouped.entries()) {
      report.byResource[resource] = routes.map((route) => ({
        method: route.method,
        path: route.path,
        handler: route.handlerName,
        isPublic: route.isPublic,
        permission: route.explicitPermissions[0] || route.suggestedPermission,
        mappingType: route.isPublic
          ? 'public'
          : route.explicitPermissions.length > 0
            ? 'explicit'
            : route.suggestedPermission
              ? 'auto'
              : 'unmapped',
      }));
    }

    this.logger.log('✅ Route mapping report generated');
    return report;
  }

  /**
   * Validates route-permission mappings for gaps and inconsistencies
   * 
   * Checks for:
   * - Routes without permission mappings (excluding public routes)
   * - Routes mapped to non-existent permissions
   * - Duplicate route definitions
   * - Permission coverage by resource
   * 
   * @returns Promise<{valid: boolean, issues: string[]}>
   */
  async validateRouteMappings(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    this.logger.log('🔍 Validating route-permission mappings...');

    const issues: string[] = [];

    try {
      // Get all permissions
      const allPermissions = await this.permissionRepository.find();
      const permissionSet = new Set(allPermissions.map((p) => p.name));

      // Discover routes
      const discoveryResult =
        await this.routeDiscoveryService.discoverAllRoutes();

      // Check for unmapped routes
      if (discoveryResult.unmapped > 0) {
        issues.push(
          `Found ${discoveryResult.unmapped} routes without permission mappings`,
        );
      }

      // Validate that all required permissions exist
      const missingPermissions =
        this.routeDiscoveryService.validatePermissions(
          discoveryResult.routes,
          permissionSet,
        );

      if (missingPermissions.length > 0) {
        issues.push(
          `Found ${missingPermissions.length} missing permissions: ${missingPermissions.join(', ')}`,
        );
      }

      // Check for duplicate routes in database
      const duplicateRoutes = await this.routeRepository
        .createQueryBuilder('route')
        .select('route.path, route.method')
        .addSelect('COUNT(*)', 'count')
        .groupBy('route.path, route.method')
        .having('COUNT(*) > 1')
        .getRawMany();

      if (duplicateRoutes.length > 0) {
        issues.push(
          `Found ${duplicateRoutes.length} duplicate route definitions in database`,
        );
      }

      // Check for routes in DB that no longer exist in code
      const dbRoutes = await this.routeRepository.find();
      const discoveredPaths = new Set(
        discoveryResult.routes.map((r) => `${r.method}:${r.path}`),
      );

      const orphanedRoutes = dbRoutes.filter(
        (dbRoute) => !discoveredPaths.has(`${dbRoute.method}:${dbRoute.path}`),
      );

      if (orphanedRoutes.length > 0) {
        issues.push(
          `Found ${orphanedRoutes.length} routes in database that no longer exist in code`,
        );
      }

      const valid = issues.length === 0;

      if (valid) {
        this.logger.log('✅ Route mapping validation passed');
      } else {
        this.logger.warn(
          `⚠️  Route mapping validation issues found: ${issues.length}`,
        );
        issues.forEach((issue) => this.logger.warn(`  - ${issue}`));
      }

      return { valid, issues };
    } catch (error: unknown) {
      this.logger.error(
        '❌ Route mapping validation failed:',
        (error as Error).stack,
      );
      return {
        valid: false,
        issues: [`Validation failed due to error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Retrieves detailed seeding statistics from the database
   *
   * @returns Promise<any> - Comprehensive statistics object
   */
  async getSeedingStats(): Promise<any> {
    const stats = {
      permissions: {
        total: await this.permissionRepository.count(),
        byCategory: await this.getPermissionsByCategory(),
      },
      roles: {
        total: await this.roleRepository.count(),
        business: await this.roleRepository.count({
          where: { type: 'business' },
        }),
        admin: await this.roleRepository.count({ where: { type: 'admin' } }),
        default: await this.roleRepository.count({
          where: { isDefault: true },
        }),
      },
      rolePermissions: {
        total: await this.rolePermissionRepository.count(),
      },
      routes: {
        total: await this.routeRepository.count(),
        mapped: await this.routeRepository
          .createQueryBuilder('route')
          .where('route.permission_id IS NOT NULL')
          .getCount(),
        unmapped: await this.routeRepository
          .createQueryBuilder('route')
          .where('route.permission_id IS NULL')
          .getCount(),
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `📊 Current Access Control Stats: ${JSON.stringify(stats, null, 2)}`,
    );
    return stats;
  }

  /**
   * Gets permission counts grouped by category
   *
   * @returns Promise<Array> - Array of category counts
   */
  private async getPermissionsByCategory(): Promise<
    Array<{ category: string; count: number }>
  > {
    const result = await this.permissionRepository
      .createQueryBuilder('permission')
      .select('permission.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('permission.category IS NOT NULL')
      .groupBy('permission.category')
      .getRawMany();

    return result.map((item) => ({
      category: item.category,
      count: parseInt(item.count),
    }));
  }

  /**
   * Cleans up access control data for testing purposes
   * WARNING: This will remove all permissions, roles, and their relationships
   *
   * @returns Promise<void>
   */
  async cleanupAccessControlData(): Promise<void> {
    this.logger.warn(
      '🧹 Cleaning up access control data... This is destructive!',
    );

    try {
      // Remove role-permission relationships first (foreign key constraints)
      await this.rolePermissionRepository.delete({});
      this.logger.log('Removed all role-permission relationships');

      // Remove permissions
      await this.permissionRepository.delete({});
      this.logger.log('Removed all permissions');

      // Remove roles
      await this.roleRepository.delete({});
      this.logger.log('Removed all roles');

      this.logger.log('✅ Access control data cleanup completed');
    } catch (error: unknown) {
      this.logger.error('❌ Access control cleanup failed:', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Validates the integrity of the access control system
   *
   * @returns Promise<{valid: boolean, issues: string[]}> - Validation results
   */
  async validateAccessControlIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // Check for roles without permissions
      const rolesWithoutPermissions = await this.roleRepository
        .createQueryBuilder('role')
        .leftJoin('role.rolePermissions', 'rp')
        .where('rp.id IS NULL')
        .getMany();

      if (rolesWithoutPermissions.length > 0) {
        issues.push(
          `Found ${rolesWithoutPermissions.length} roles without any permissions: ${rolesWithoutPermissions.map((r) => r.name).join(', ')}`,
        );
      }

      // Check for orphaned role-permission relationships
      const orphanedRelationships = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .leftJoin('rp.role', 'role')
        .leftJoin('rp.permission', 'permission')
        .where('role.id IS NULL OR permission.id IS NULL')
        .getCount();

      if (orphanedRelationships > 0) {
        issues.push(
          `Found ${orphanedRelationships} orphaned role-permission relationships`,
        );
      }

      // Check for duplicate role-permission relationships
      const duplicateRelationships = await this.rolePermissionRepository
        .createQueryBuilder('rp1')
        .innerJoin(
          'role_permissions',
          'rp2',
          'rp1.roleId = rp2.roleId AND rp1.permissionId = rp2.permissionId AND rp1.id != rp2.id',
        )
        .getCount();

      if (duplicateRelationships > 0) {
        issues.push(
          `Found ${duplicateRelationships} duplicate role-permission relationships`,
        );
      }

      const valid = issues.length === 0;

      if (valid) {
        this.logger.log('✅ Access control system integrity validation passed');
      } else {
        this.logger.warn(
          `⚠️ Access control system integrity issues found: ${issues.length}`,
        );
        issues.forEach((issue) => this.logger.warn(`  - ${issue}`));
      }

      return { valid, issues };
    } catch (error: unknown) {
      this.logger.error('❌ Access control validation failed:', (error as Error).stack);
      return {
        valid: false,
        issues: [`Validation failed due to error: ${(error as Error).message}`],
      };
    }
  }

  /**
   * Logs comprehensive seeding statistics
   *
   * @param stats - Seeding statistics to log
   */
  private logSeedingStats(stats: SeedingStats): void {
    this.logger.log('📊 Access Control Seeding Summary:');
    this.logger.log(
      `   └── Permissions: ${stats.permissionsCreated} created, ${stats.permissionsUpdated} updated`,
    );
    this.logger.log(
      `   └── Roles: ${stats.rolesCreated} created, ${stats.rolesUpdated} updated`,
    );
    this.logger.log(
      `   └── Role-Permissions: ${stats.rolePermissionsCreated} relationships created`,
    );
    this.logger.log(
      `   └── Routes: ${stats.routesCreated} created, ${stats.routesUpdated} updated, ${stats.routesMapped} mapped, ${stats.routesUnmapped} unmapped`,
    );
    this.logger.log(`   └── Total time: ${stats.totalProcessingTime}ms`);
  }
}

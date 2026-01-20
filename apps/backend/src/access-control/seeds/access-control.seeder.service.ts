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
import { PERMISSION_SEEDS, PermissionSeedData } from './permissions.seed';
import { ALL_ROLES, RoleSeedData } from './roles.seed';

export interface AccessControlSeedingOptions {
  seedPermissions?: boolean;
  seedRoles?: boolean;
  seedRolePermissions?: boolean;
  overwriteExisting?: boolean;
  logLevel?: 'debug' | 'info' | 'warn';
}

export interface SeedingStats {
  permissionsCreated: number;
  permissionsUpdated: number;
  rolesCreated: number;
  rolesUpdated: number;
  rolePermissionsCreated: number;
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

      stats.totalProcessingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Access Control Seeding completed successfully in ${stats.totalProcessingTime}ms`,
      );
      this.logSeedingStats(stats);

      return stats;
    } catch (error) {
      this.logger.error(
        `❌ Access Control Seeding failed: ${error.message}`,
        error.stack,
      );
      throw new Error(`Access Control Seeding failed: ${error.message}`);
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
      } catch (error) {
        this.logger.error(
          `Failed to process permission ${permissionData.name}: ${error.message}`,
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
          });
          await this.roleRepository.save(role);
          created++;
          if (options.logLevel === 'debug') {
            this.logger.debug(`Created role: ${roleData.name}`);
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to process role ${roleData.name}: ${error.message}`,
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
      } catch (error) {
        this.logger.error(
          `Failed to process role permissions for ${roleData.name}: ${error.message}`,
        );
        throw error;
      }
    }

    this.logger.log(`📊 Role-Permission relationships: ${created} created`);
    return created;
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
    } catch (error) {
      this.logger.error('❌ Access control cleanup failed:', error.stack);
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
    } catch (error) {
      this.logger.error('❌ Access control validation failed:', error.stack);
      return {
        valid: false,
        issues: [`Validation failed due to error: ${error.message}`],
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
    this.logger.log(`   └── Total time: ${stats.totalProcessingTime}ms`);
  }
}

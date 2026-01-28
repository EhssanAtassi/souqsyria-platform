/**
 * @file SEEDER_UPDATE_EXAMPLE.ts
 * @description Example of how to update the seeder to use enhanced permissions
 *
 * This file demonstrates:
 * 1. How to use getEnhancedPermissions() for automatic resource/action parsing
 * 2. How to manually mark system permissions
 * 3. How to seed permissions with all new fields
 * 4. Backward compatibility with existing code
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import {
  getEnhancedPermissions,
  PERMISSION_SEEDS,
  markSystemPermissions,
  parsePermissionName,
} from './permissions.seed';

@Injectable()
export class EnhancedPermissionsSeederService {
  private readonly logger = new Logger(EnhancedPermissionsSeederService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /**
   * APPROACH 1: Use getEnhancedPermissions() - Recommended
   *
   * Automatically enhances all permissions with:
   * - resource field (parsed from name)
   * - action field (parsed from name)
   * - isSystem flag (for critical permissions)
   *
   * This is the simplest and recommended approach.
   */
  async seedEnhancedPermissionsAutomatic(): Promise<void> {
    this.logger.log('Seeding enhanced permissions (automatic)...');

    // Get fully enhanced permissions with all fields populated
    const enhancedPermissions = getEnhancedPermissions();

    // Seed each permission
    for (const permData of enhancedPermissions) {
      const existing = await this.permissionRepository.findOne({
        where: { name: permData.name },
      });

      if (existing) {
        // Update existing permission with new fields
        existing.description = permData.description;
        existing.category = permData.category;
        existing.resource = permData.resource;
        existing.action = permData.action;
        existing.isSystem = permData.isSystem || false;

        await this.permissionRepository.save(existing);
        this.logger.debug(`Updated permission: ${existing.name}`);
      } else {
        // Create new permission with all fields
        const newPermission = this.permissionRepository.create({
          name: permData.name,
          description: permData.description,
          category: permData.category,
          resource: permData.resource,
          action: permData.action,
          isSystem: permData.isSystem || false,
        });

        await this.permissionRepository.save(newPermission);
        this.logger.debug(`Created permission: ${newPermission.name}`);
      }
    }

    this.logger.log(
      `Seeding complete: ${enhancedPermissions.length} permissions processed`,
    );
  }

  /**
   * APPROACH 2: Manual Enhancement with Custom System Permissions
   *
   * Use this approach if you need to:
   * - Define custom system permissions beyond the defaults
   * - Manually override resource/action values
   * - Apply custom logic during seeding
   */
  async seedEnhancedPermissionsManual(): Promise<void> {
    this.logger.log('Seeding enhanced permissions (manual)...');

    // Define which permissions are system-level (cannot be deleted)
    const customSystemPermissions = [
      'manage_permissions',
      'manage_roles',
      'assign_roles',
      'system_configuration',
      'view_system_logs',
      'backup_system',
      'restore_system',
      'access_admin_panel', // Custom addition
      'configure_payment_gateways', // Custom addition
    ];

    // Mark system permissions
    const enhancedPerms = markSystemPermissions(
      PERMISSION_SEEDS,
      customSystemPermissions,
    );

    // Process each permission
    for (const permData of enhancedPerms) {
      // Parse permission name to extract resource and action
      const parsed = parsePermissionName(permData.name);

      const permissionToSave = {
        name: permData.name,
        description: permData.description,
        category: permData.category,
        resource: parsed?.resource || permData.category, // Fallback to category
        action: parsed?.action || null,
        isSystem: permData.isSystem || false,
      };

      // Upsert permission
      const existing = await this.permissionRepository.findOne({
        where: { name: permissionToSave.name },
      });

      if (existing) {
        await this.permissionRepository.update(existing.id, permissionToSave);
        this.logger.debug(`Updated: ${permissionToSave.name}`);
      } else {
        await this.permissionRepository.save(permissionToSave);
        this.logger.debug(`Created: ${permissionToSave.name}`);
      }
    }

    this.logger.log('Manual seeding complete');
  }

  /**
   * APPROACH 3: Backward Compatible - Gradual Migration
   *
   * Use this if you want to:
   * - Keep existing code working unchanged
   * - Gradually add resource/action fields
   * - Only update specific permissions
   */
  async seedPermissionsBackwardCompatible(): Promise<void> {
    this.logger.log('Seeding permissions (backward compatible)...');

    for (const permData of PERMISSION_SEEDS) {
      const existing = await this.permissionRepository.findOne({
        where: { name: permData.name },
      });

      if (existing) {
        // Only update description and category (legacy fields)
        existing.description = permData.description;
        existing.category = permData.category;
        await this.permissionRepository.save(existing);
      } else {
        // Create with legacy fields only
        const newPermission = this.permissionRepository.create({
          name: permData.name,
          description: permData.description,
          category: permData.category,
          // New fields remain null - will be populated later
        });
        await this.permissionRepository.save(newPermission);
      }
    }

    this.logger.log('Backward compatible seeding complete');
  }

  /**
   * UTILITY: Update Existing Permissions with Resource/Action
   *
   * Run this once to populate resource/action for existing permissions
   * that were created before the enhancement.
   */
  async populateResourceActionForExistingPermissions(): Promise<void> {
    this.logger.log('Populating resource/action for existing permissions...');

    const allPermissions = await this.permissionRepository.find();

    for (const permission of allPermissions) {
      // Skip if already populated
      if (permission.resource && permission.action) {
        continue;
      }

      // Parse permission name
      const parsed = parsePermissionName(permission.name);

      if (parsed) {
        permission.resource = parsed.resource;
        permission.action = parsed.action;
        await this.permissionRepository.save(permission);
        this.logger.debug(
          `Updated ${permission.name}: resource=${parsed.resource}, action=${parsed.action}`,
        );
      } else {
        this.logger.warn(
          `Cannot parse permission name: ${permission.name}. Skipping.`,
        );
      }
    }

    this.logger.log('Resource/action population complete');
  }

  /**
   * UTILITY: Mark Critical System Permissions
   *
   * Run this once to mark existing critical permissions as system-level.
   */
  async markCriticalPermissionsAsSystem(): Promise<void> {
    this.logger.log('Marking critical permissions as system-level...');

    const criticalPermissionNames = [
      'manage_permissions',
      'manage_roles',
      'assign_roles',
      'system_configuration',
      'view_system_logs',
      'backup_system',
      'restore_system',
    ];

    for (const name of criticalPermissionNames) {
      const permission = await this.permissionRepository.findOne({
        where: { name },
      });

      if (permission) {
        permission.isSystem = true;
        await this.permissionRepository.save(permission);
        this.logger.debug(`Marked as system: ${name}`);
      } else {
        this.logger.warn(`Permission not found: ${name}`);
      }
    }

    this.logger.log('System permissions marked successfully');
  }

  /**
   * EXAMPLE: Get Permissions Grouped by Resource
   *
   * Demonstrates how to use the new fields for querying.
   */
  async getPermissionsGroupedByResource(): Promise<
    Record<string, Permission[]>
  > {
    const allPermissions = await this.permissionRepository.find();

    // Group by resource
    const grouped = allPermissions.reduce(
      (acc, perm) => {
        const resource = perm.resource || 'uncategorized';
        if (!acc[resource]) {
          acc[resource] = [];
        }
        acc[resource].push(perm);
        return acc;
      },
      {} as Record<string, Permission[]>,
    );

    return grouped;
  }

  /**
   * EXAMPLE: Get Permissions Filtered by Action
   *
   * Demonstrates filtering by action type.
   */
  async getPermissionsByAction(action: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { action },
    });
  }

  /**
   * EXAMPLE: Get All System Permissions
   *
   * Demonstrates querying system-level permissions.
   */
  async getSystemPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { isSystem: true },
    });
  }
}

/**
 * USAGE IN SEEDER CONTROLLER
 *
 * Example endpoint to trigger seeding:
 */
/*
@Controller('access-control/seed')
export class EnhancedSeederController {
  constructor(private readonly seederService: EnhancedPermissionsSeederService) {}

  @Post('permissions/enhanced')
  async seedEnhanced() {
    await this.seederService.seedEnhancedPermissionsAutomatic();
    return { message: 'Enhanced permissions seeded successfully' };
  }

  @Post('permissions/populate-fields')
  async populateFields() {
    await this.seederService.populateResourceActionForExistingPermissions();
    await this.seederService.markCriticalPermissionsAsSystem();
    return { message: 'Permission fields populated successfully' };
  }

  @Get('permissions/grouped')
  async getGrouped() {
    return this.seederService.getPermissionsGroupedByResource();
  }

  @Get('permissions/system')
  async getSystem() {
    return this.seederService.getSystemPermissions();
  }
}
*/

/**
 * MIGRATION WORKFLOW
 *
 * Follow these steps to migrate to enhanced permissions:
 *
 * 1. Run database migration:
 *    mysql -u root -p souq_syria < add-permission-categorization-fields.sql
 *
 * 2. Deploy code with enhanced entity
 *
 * 3. Run utility to populate existing permissions:
 *    POST /access-control/seed/permissions/populate-fields
 *
 * 4. Verify data:
 *    GET /access-control/seed/permissions/grouped
 *    GET /access-control/seed/permissions/system
 *
 * 5. Update seeder to use enhanced version:
 *    Replace old seeder with seedEnhancedPermissionsAutomatic()
 *
 * 6. Test system permission protection:
 *    Try deleting a system permission - should fail with 400
 *
 * 7. Update UI to use resource/action grouping
 */

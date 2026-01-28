/**
 * @file roles.service.ts (Enhanced)
 * @description Enhanced service for managing roles with advanced features:
 * - Role templates for quick creation
 * - Bulk permission assignment
 * - User tracking and assignment management
 * - Role priority and hierarchy
 * - Permission conflict detection
 * - Security audit integration
 *
 * Performance targets:
 * - Get templates: <50ms
 * - Bulk assign permissions: <200ms
 * - Remove permission: <100ms
 * - List users with role: <200ms
 * - Update priority: <50ms
 *
 * @author SouqSyria Backend Team
 * @version 2.0.0
 */

import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../access-control/entities/permission.entity';
import { RolePermission } from '../access-control/entities/role-permission.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { BulkAssignPermissionsDto } from './dto/bulk-assign-permissions.dto';
import { UpdateRolePriorityDto } from './dto/update-role-priority.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { SecurityAuditService } from '../access-control/security-audit/security-audit.service';
import { SecurityAuditAction, ResourceType } from '../access-control/entities/security-audit-log.entity';
import {
  getRoleTemplates,
  getRoleTemplateById,
  RoleTemplate,
} from './config/role-templates.config';

/**
 * Interface for user assignment tracking
 */
export interface UserWithRole {
  id: number;
  email: string;
  fullName: string;
  role: Role | null;
  assignedRole: Role | null;
}

/**
 * Interface for permission conflict detection result
 */
export interface PermissionConflict {
  type: 'MISSING_DEPENDENCY' | 'CONFLICTING_ACTIONS' | 'REDUNDANT_PERMISSION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  affectedPermissions: string[];
  recommendation: string;
}

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => SecurityAuditService))
    private readonly securityAuditService: SecurityAuditService,
  ) {}

  /**
   * Create a new role.
   *\   * @param createRoleDto - Role creation data
   * @returns Created role entity
   *
   * @example
   * const role = await rolesService.create({
   *   name: 'Marketing Manager',
   *   description: 'Manages marketing campaigns',
   *   priority: 40
   * });
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    const saved = await this.roleRepository.save(role);
    this.logger.log(`Created new role: ${saved.name}`);

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.ROLE_CREATED,
      saved.id,
      `Role created: ${saved.name}`,
      { roleName: saved.name, priority: saved.priority },
    );

    return saved;
  }

  /**
   * Find all roles with optional search and pagination.
   *
   * @param query - Optional query parameters (search, page, limit)
   * @returns Paginated list of roles with their permissions
   *\   * @example
   * const result = await rolesService.findAll({
   *   search: 'manager',
   *   page: 1,
   *   limit: 20
   * });
   */
  async findAll(query?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponseDto<Role>> {
    const { search, page = 1, limit = 10 } = query || {};

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.permission', 'permission');

    if (search) {
      qb.where('role.name LIKE :search OR role.description LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('role.priority', 'DESC') // Order by priority (highest first)
      .addOrderBy('role.id', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find one role by ID with full permission details.
   *
   * @param id - Role ID
   * @returns Role entity with permissions
   * @throws NotFoundException if role not found
   *
   * @example
   * const role = await rolesService.findOne(5);
   * console.log(role.rolePermissions); // Array of permissions
   */
  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!role) {
      this.logger.warn(`Role ID ${id} not found`);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  /**
   * Update a role by ID.
   * Prevents modification of system roles (isDefault=true).
   *
   * @param id - Role ID
   * @param updateRoleDto - Update data
   * @returns Updated role entity
   * @throws BadRequestException if trying to modify system role
   *
   * @example
   * const updated = await rolesService.update(5, {
   *   name: 'Senior Marketing Manager',
   *   description: 'Updated description'
   * });
   */
  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    // Prevent changing the 'isDefault' flag on default roles
    if (role.isDefault && updateRoleDto.isDefault === false) {
      this.logger.warn(`Attempt to unset isDefault on role ID ${id} denied`);
      throw new BadRequestException(
        'Cannot unset isDefault on a default system role.',
      );
    }

    const originalName = role.name;
    Object.assign(role, updateRoleDto);
    const updated = await this.roleRepository.save(role);
    this.logger.log(`Updated role ID ${id}`);

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.ROLE_MODIFIED,
      id,
      `Role updated: ${originalName} -> ${updated.name}`,
      { changes: updateRoleDto },
    );

    return updated;
  }

  /**
   * Soft delete a role by ID.
   * Prevents deletion of system roles and warns if users are assigned.
   *
   * @param id - Role ID
   * @throws BadRequestException if system role or has active users
   *
   * @example
   * await rolesService.remove(5);
   */
  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);

    // Cannot delete system-critical roles (owner, super_admin, etc.)
    if (role.isSystem) {
      this.logger.warn(
        `Attempt to delete system-critical role '${role.name}' (ID ${id}) denied`,
      );
      throw new BadRequestException(
        `Cannot delete system-critical role '${role.name}'. This role is protected from deletion.`,
      );
    }

    // Cannot delete default roles
    if (role.isDefault) {
      this.logger.warn(`Attempt to delete default role ID ${id} denied`);
      throw new BadRequestException('Cannot delete a default system role.');
    }

    // Check if users are assigned to this role
    const userCount = await this.getUserCountForRole(id);
    if (userCount > 0) {
      this.logger.warn(`Attempt to delete role ID ${id} with ${userCount} active users`);
      throw new BadRequestException(
        `Cannot delete role with ${userCount} active users. Please reassign users first.`,
      );
    }

    await this.roleRepository.softRemove(role);
    this.logger.warn(`Soft-deleted role ID ${id}`);

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.ROLE_DELETED,
      id,
      `Role deleted: ${role.name}`,
      { roleName: role.name },
    );
  }

  /**
   * Clone a role and its permissions.
   * Creates a copy with '_copy' suffix.
   *
   * @param roleId - Role ID to clone
   * @returns Cloned role entity
   * @throws BadRequestException if trying to clone system role
   *
   * @example
   * const cloned = await rolesService.cloneRole(5);
   * console.log(cloned.name); // 'Marketing Manager_copy'
   */
  async cloneRole(roleId: number): Promise<Role> {
    const original = await this.findOne(roleId);

    if (original.isDefault) {
      this.logger.warn(`Attempt to clone default role ID ${roleId} denied`);
      throw new BadRequestException('Cannot clone a default system role.');
    }

    const clone = this.roleRepository.create({
      name: `${original.name}_copy`,
      description: original.description,
      priority: original.priority,
    });

    const savedClone = await this.roleRepository.save(clone);

    // Clone permissions
    for (const rp of original.rolePermissions) {
      await this.rolePermissionRepository.save({
        role: savedClone,
        permission: rp.permission,
      });
    }

    this.logger.log(`Cloned role ID ${roleId} to ${savedClone.id}`);

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.ROLE_CREATED,
      savedClone.id,
      `Role cloned from: ${original.name}`,
      { originalRoleId: roleId, clonedRoleId: savedClone.id },
    );

    return savedClone;
  }

  // ============================================================
  // NEW METHODS: ROLE TEMPLATES
  // ============================================================

  /**
   * Get all available role templates.
   * Templates are pre-configured roles for common use cases.
   *
   * @returns Array of role templates
   *
   * @example
   * const templates = await rolesService.getRoleTemplates();
   * templates.forEach(t => console.log(t.name, t.description));
   */
  async getRoleTemplates(): Promise<RoleTemplate[]> {
    return getRoleTemplates();
  }

  /**
   * Create a role from a template.
   * Looks up permissions by name and assigns them to the new role.
   *
   * @param templateId - Template identifier
   * @param customName - Optional custom name (overrides template name)
   * @returns Created role with assigned permissions
   * @throws NotFoundException if template not found
   * @throws BadRequestException if permissions not found
   *
   * @example
   * const role = await rolesService.createFromTemplate('customer-support');
   * // or with custom name:
   * const role = await rolesService.createFromTemplate('customer-support', 'Level 1 Support');
   */
  async createFromTemplate(templateId: string, customName?: string): Promise<Role> {
    const template = getRoleTemplateById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID '${templateId}' not found`);
    }

    // Handle 'all_permissions' special case for Super Admin
    let permissionIds: number[];
    if (template.permissionNames.includes('all_permissions')) {
      const allPermissions = await this.permissionRepository.find();
      permissionIds = allPermissions.map((p) => p.id);
    } else {
      // Look up permissions by name
      const permissions = await this.permissionRepository.find({
        where: {
          name: In(template.permissionNames),
        },
      });

      if (permissions.length !== template.permissionNames.length) {
        const foundNames = permissions.map((p) => p.name);
        const missing = template.permissionNames.filter((n) => !foundNames.includes(n));
        this.logger.warn(
          `Template '${templateId}' references missing permissions: ${missing.join(', ')}`,
        );
        throw new BadRequestException(
          `Template references missing permissions: ${missing.join(', ')}`,
        );
      }

      permissionIds = permissions.map((p) => p.id);
    }

    // Create role
    const role = await this.create({
      name: customName || template.name,
      description: template.description,
      isDefault: template.isDefault,
      priority: template.priority,
    });

    // Assign permissions
    await this.bulkAssignPermissions(role.id, { permissionIds });

    this.logger.log(
      `Created role from template '${templateId}': ${role.name} with ${permissionIds.length} permissions`,
    );

    return this.findOne(role.id); // Reload with permissions
  }

  // ============================================================
  // NEW METHODS: BULK PERMISSION ASSIGNMENT
  // ============================================================

  /**
   * Bulk assign permissions to a role.
   * Replaces all existing role permissions with the provided list.
   * This operation is atomic - either all succeed or all fail.
   *
   * @param roleId - Role ID
   * @param dto - Bulk assignment DTO with permission IDs
   * @returns Updated role with new permissions
   * @throws NotFoundException if role or permissions not found
   * @throws BadRequestException if system role or invalid permissions
   *
   * @example
   * await rolesService.bulkAssignPermissions(5, {
   *   permissionIds: [1, 2, 3, 15, 20]
   * });
   */
  async bulkAssignPermissions(
    roleId: number,
    dto: BulkAssignPermissionsDto,
  ): Promise<Role> {
    const role = await this.findOne(roleId);

    // Cannot modify system roles
    if (role.isDefault) {
      throw new BadRequestException(
        'Cannot modify permissions of a system role.',
      );
    }

    // Validate all permission IDs exist
    const permissions = await this.permissionRepository.find({
      where: {
        id: In(dto.permissionIds),
      },
    });

    if (permissions.length !== dto.permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missing = dto.permissionIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Permission IDs not found: ${missing.join(', ')}`,
      );
    }

    // Use transaction for atomicity
    await this.dataSource.transaction(async (manager) => {
      // Remove all existing role permissions
      await manager.delete(RolePermission, { role: { id: roleId } });

      // Insert new permissions in bulk
      const rolePermissions = permissions.map((permission) =>
        manager.create(RolePermission, {
          role,
          permission,
        }),
      );

      await manager.save(RolePermission, rolePermissions);
    });

    this.logger.log(
      `Bulk assigned ${dto.permissionIds.length} permissions to role ID ${roleId}`,
    );

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.PERMISSION_MODIFIED,
      roleId,
      `Bulk assigned ${dto.permissionIds.length} permissions to role: ${role.name}`,
      { permissionIds: dto.permissionIds },
    );

    return this.findOne(roleId); // Reload with new permissions
  }

  /**
   * Remove a single permission from a role.
   * Validates that the role will still have at least 1 permission after removal.
   *
   * @param roleId - Role ID
   * @param permissionId - Permission ID to remove
   * @throws NotFoundException if role or permission not found
   * @throws BadRequestException if system role or last permission
   *
   * @example
   * await rolesService.removePermission(5, 20);
   */
  async removePermission(roleId: number, permissionId: number): Promise<void> {
    const role = await this.findOne(roleId);

    // Cannot modify system roles
    if (role.isDefault) {
      throw new BadRequestException(
        'Cannot modify permissions of a system role.',
      );
    }

    // Check if permission exists on role
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        role: { id: roleId },
        permission: { id: permissionId },
      },
      relations: ['permission'],
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Permission ID ${permissionId} not assigned to role ID ${roleId}`,
      );
    }

    // Cannot remove last permission
    const permissionCount = role.rolePermissions.length;
    if (permissionCount <= 1) {
      throw new BadRequestException(
        'Cannot remove the last permission from a role. Roles must have at least 1 permission.',
      );
    }

    await this.rolePermissionRepository.remove(rolePermission);

    this.logger.log(
      `Removed permission ID ${permissionId} from role ID ${roleId}`,
    );

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.PERMISSION_MODIFIED,
      roleId,
      `Removed permission '${rolePermission.permission.name}' from role: ${role.name}`,
      { permissionId, permissionName: rolePermission.permission.name },
    );
  }

  // ============================================================
  // NEW METHODS: USER ASSIGNMENT TRACKING
  // ============================================================

  /**
   * Get paginated list of users with a specific role.
   * Searches both roleId (business role) and assignedRoleId (staff role).
   *
   * @param roleId - Role ID to query
   * @param page - Page number (1-based)
   * @param limit - Users per page (max 100)
   * @returns Paginated list of users
   *\   * @example
   * const result = await rolesService.getUsersWithRole(5, 1, 20);
   * console.log(`Found ${result.total} users with this role`);
   */
  async getUsersWithRole(
    roleId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<UserWithRole>> {
    // Validate role exists
    await this.findOne(roleId);

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.assignedRole', 'assignedRole')
      .where('user.role.id = :roleId', { roleId })
      .orWhere('user.assignedRole.id = :roleId', { roleId });

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.id', 'ASC')
      .getManyAndCount();

    const data: UserWithRole[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      assignedRole: user.assignedRole,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get count of users assigned to a role.
   * Counts both business roles and staff roles.
   *
   * @param roleId - Role ID
   * @returns Total number of users with this role
   *
   * @example
   * const count = await rolesService.getUserCountForRole(5);
   * console.log(`${count} users have this role`);
   */
  async getUserCountForRole(roleId: number): Promise<number> {
    const count = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role.id = :roleId', { roleId })
      .orWhere('user.assignedRole.id = :roleId', { roleId })
      .getCount();

    return count;
  }

  // ============================================================
  // NEW METHODS: ROLE PRIORITY
  // ============================================================

  /**
   * Update role priority for hierarchy and conflict resolution.
   * Higher priority roles take precedence when conflicts occur.
   *
   * @param roleId - Role ID
   * @param dto - Priority update DTO
   * @returns Updated role
   * @throws BadRequestException if system role
   *
   * @example
   * await rolesService.updateRolePriority(5, { priority: 60 });
   */
  async updateRolePriority(
    roleId: number,
    dto: UpdateRolePriorityDto,
  ): Promise<Role> {
    const role = await this.findOne(roleId);

    // Cannot modify system role priority
    if (role.isDefault) {
      throw new BadRequestException(
        'Cannot modify priority of a system role.',
      );
    }

    const oldPriority = role.priority;
    role.priority = dto.priority;
    const updated = await this.roleRepository.save(role);

    this.logger.log(
      `Updated priority for role ID ${roleId}: ${oldPriority} -> ${dto.priority}`,
    );

    // Audit log
    await this.logSecurityEvent(
      SecurityAuditAction.ROLE_PRIORITY_MODIFIED,
      roleId,
      `Priority changed for role '${role.name}': ${oldPriority} -> ${dto.priority}`,
      { oldPriority, newPriority: dto.priority },
    );

    return updated;
  }

  // ============================================================
  // NEW METHODS: PERMISSION CONFLICT DETECTION
  // ============================================================

  /**
   * Detect potential conflicts in a set of permissions.
   * Checks for missing dependencies, conflicting actions, and redundancies.
   *
   * @param permissionIds - Array of permission IDs to analyze
   * @returns Array of detected conflicts with recommendations
   *
   * @example
   * const conflicts = await rolesService.detectPermissionConflicts([1, 2, 3]);
   * conflicts.forEach(c => console.log(c.message, c.recommendation));
   */
  async detectPermissionConflicts(
    permissionIds: number[],
  ): Promise<PermissionConflict[]> {
    const conflicts: PermissionConflict[] = [];

    // Fetch permissions
    const permissions = await this.permissionRepository.find({
      where: {
        id: In(permissionIds),
      },
    });

    const permissionNames = permissions.map((p) => p.name);

    // Rule 1: Check for delete without view
    const hasDelete = permissionNames.some((name) => name.includes('delete_'));
    const hasView = permissionNames.some((name) => name.includes('view_'));
    if (hasDelete && !hasView) {
      conflicts.push({
        type: 'MISSING_DEPENDENCY',
        severity: 'MEDIUM',
        message: 'Role has delete permissions without view permissions',
        affectedPermissions: permissionNames.filter((n) => n.includes('delete_')),
        recommendation: 'Add corresponding view permissions for better UX',
      });
    }

    // Rule 2: Check for manage without view
    const hasManage = permissionNames.some((name) => name.includes('manage_'));
    if (hasManage && !hasView) {
      conflicts.push({
        type: 'MISSING_DEPENDENCY',
        severity: 'HIGH',
        message: 'Role has manage permissions without view permissions',
        affectedPermissions: permissionNames.filter((n) => n.includes('manage_')),
        recommendation: 'Add view permissions - manage implies view access',
      });
    }

    // Rule 3: Check for ban/unban pair
    const hasBan = permissionNames.includes('ban_users');
    const hasUnban = permissionNames.includes('unban_users');
    if (hasBan && !hasUnban) {
      conflicts.push({
        type: 'MISSING_DEPENDENCY',
        severity: 'MEDIUM',
        message: 'Role can ban users but cannot unban them',
        affectedPermissions: ['ban_users'],
        recommendation: 'Add unban_users permission for complete user management',
      });
    }

    // Rule 4: Check for redundant permissions (manage includes view)
    const managePermissions = permissionNames.filter((n) => n.includes('manage_'));
    managePermissions.forEach((managePerm) => {
      const resource = managePerm.replace('manage_', '');
      const viewPerm = `view_${resource}`;
      if (permissionNames.includes(viewPerm)) {
        conflicts.push({
          type: 'REDUNDANT_PERMISSION',
          severity: 'LOW',
          message: `'${managePerm}' already includes '${viewPerm}'`,
          affectedPermissions: [managePerm, viewPerm],
          recommendation: 'Remove view permission as manage permission covers it',
        });
      }
    });

    return conflicts;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Log security events to audit trail.
   * Wrapper around SecurityAuditService for consistent logging.
   *
   * @param action - Security action type
   * @param roleId - Role ID affected
   * @param message - Human-readable message
   * @param metadata - Additional context
   */
  private async logSecurityEvent(
    action: SecurityAuditAction,
    roleId: number,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.securityAuditService.logPermissionCheck({
        userId: null, // System action (no user context in service)
        action,
        resourceType: ResourceType.ROLE,
        resourceId: roleId,
        success: true,
        ipAddress: 'system',
        userAgent: 'RolesService',
        requestPath: '/api/admin/roles',
        requestMethod: 'SYSTEM',
        metadata: {
          message,
          ...metadata,
        },
      });
    } catch (error) {
      // Don't fail the operation if audit logging fails
      this.logger.error(`Failed to log security event: ${error.message}`);
    }
  }
}

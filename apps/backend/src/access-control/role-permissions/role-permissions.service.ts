/**
 * @file role-permissions.service.ts
 * @description Enhanced service for managing role-permissions with enterprise features.
 * Supports bulk operations, analytics, validation, and dual-role system.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../../roles/entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../../users/entities/user.entity';
import { CreateRolePermissionDto } from '../dto/role-permission/create-role-permission.dto';
import { BulkAssignPermissionsDto } from '../dto/role-permission/bulk-assign-permissions.dto';
import { CloneRolePermissionsDto } from '../dto/role-permission/clone-role-permissions.dto';
import { RolePermissionsQueryDto } from '../dto/role-permission/role-permissions-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class RolePermissionsService {
  private readonly logger = new Logger(RolePermissionsService.name);

  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Assign a single permission to a role
   */
  async assignPermissionToRole(
    createRolePermissionDto: CreateRolePermissionDto,
    adminUser: User,
  ): Promise<RolePermission> {
    const { roleId, permissionId } = createRolePermissionDto;

    // Validate role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Validate permission exists
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    // Check if assignment already exists
    const existingAssignment = await this.rolePermissionRepository.findOne({
      where: { role: { id: roleId }, permission: { id: permissionId } },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Permission ${permission.name} is already assigned to role ${role.name}`,
      );
    }

    // Create the assignment
    const rolePermission = this.rolePermissionRepository.create({
      role,
      permission,
    });
    const saved = await this.rolePermissionRepository.save(rolePermission);

    // Log the activity
    await this.activityLogRepository.save({
      user: adminUser,
      action: 'ASSIGN_PERMISSION_TO_ROLE',
      targetTable: 'role_permissions',
      targetId: saved.id,
      description: `Permission "${permission.name}" assigned to role "${role.name}"`,
    });

    this.logger.log(
      `Permission "${permission.name}" assigned to role "${role.name}" by admin ${adminUser.id}`,
    );

    return saved;
  }

  /**
   * Bulk assign multiple permissions to a role
   */
  async bulkAssignPermissions(
    dto: BulkAssignPermissionsDto,
    adminUser: User,
  ): Promise<{ assigned: number; skipped: number; errors: string[] }> {
    const { roleId, permissionIds, replaceExisting } = dto;

    // Validate role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Validate all permissions exist
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      const foundIds = permissions.map((p) => p.id);
      const missingIds = permissionIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Permissions not found: ${missingIds.join(', ')}`,
      );
    }

    let assigned = 0;
    let skipped = 0;
    const errors: string[] = [];

    // If replaceExisting is true, remove all existing permissions first
    if (replaceExisting) {
      await this.removeAllRolePermissions(roleId, adminUser);
    }

    // Get existing assignments to avoid duplicates
    const existingAssignments = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });
    const existingPermissionIds = existingAssignments.map(
      (rp) => rp.permission.id,
    );

    // Assign each permission
    for (const permission of permissions) {
      try {
        if (!replaceExisting && existingPermissionIds.includes(permission.id)) {
          skipped++;
          continue;
        }

        const rolePermission = this.rolePermissionRepository.create({
          role,
          permission,
        });
        await this.rolePermissionRepository.save(rolePermission);
        assigned++;
      } catch (error) {
        errors.push(
          `Failed to assign permission ${permission.name}: ${error.message}`,
        );
      }
    }

    // Log the bulk activity
    await this.activityLogRepository.save({
      user: adminUser,
      action: 'BULK_ASSIGN_PERMISSIONS',
      targetTable: 'role_permissions',
      targetId: roleId,
      description: `Bulk assigned ${assigned} permissions to role "${role.name}"`,
    });

    this.logger.log(
      `Bulk assignment completed: ${assigned} assigned, ${skipped} skipped, ${errors.length} errors`,
    );

    return { assigned, skipped, errors };
  }

  /**
   * Get all permissions for a specific role
   */
  async getRolePermissions(
    roleId: number,
    query: RolePermissionsQueryDto,
  ): Promise<PaginatedResponseDto<Permission>> {
    const { search, page = 1, limit = 20 } = query;

    // Validate role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const qb = this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoinAndSelect('rp.permission', 'permission')
      .where('rp.role.id = :roleId', { roleId });

    if (search) {
      qb.andWhere(
        '(permission.name LIKE :search OR permission.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [rolePermissions, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('permission.name', 'ASC')
      .getManyAndCount();

    const permissions = rolePermissions.map((rp) => rp.permission);

    return {
      data: permissions,
      total,
      page,
      limit,
    };
  }

  /**
   * Get all roles that have a specific permission
   */
  async getPermissionRoles(permissionId: number): Promise<Role[]> {
    // Validate permission exists
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(
        `Permission with ID ${permissionId} not found`,
      );
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { permission: { id: permissionId } },
      relations: ['role'],
    });

    return rolePermissions.map((rp) => rp.role);
  }

  /**
   * Get all role-permission mappings with pagination and filtering
   */
  async getAllRolePermissions(
    query: RolePermissionsQueryDto,
  ): Promise<PaginatedResponseDto<RolePermission>> {
    const { search, roleId, permissionId, page = 1, limit = 20 } = query;

    const qb = this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoinAndSelect('rp.role', 'role')
      .innerJoinAndSelect('rp.permission', 'permission');

    if (search) {
      qb.where(
        '(role.name LIKE :search OR permission.name LIKE :search OR permission.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (roleId) {
      qb.andWhere('role.id = :roleId', { roleId });
    }

    if (permissionId) {
      qb.andWhere('permission.id = :permissionId', { permissionId });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('role.name', 'ASC')
      .addOrderBy('permission.name', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Remove a specific role-permission assignment
   */
  async removeRolePermission(id: number, adminUser: User): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { id },
      relations: ['role', 'permission'],
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Role-Permission mapping with ID ${id} not found`,
      );
    }

    await this.rolePermissionRepository.remove(rolePermission);

    // Log the activity
    await this.activityLogRepository.save({
      user: adminUser,
      action: 'REMOVE_ROLE_PERMISSION',
      targetTable: 'role_permissions',
      targetId: id,
      description: `Permission "${rolePermission.permission.name}" removed from role "${rolePermission.role.name}"`,
    });

    this.logger.log(
      `Permission "${rolePermission.permission.name}" removed from role "${rolePermission.role.name}" by admin ${adminUser.id}`,
    );
  }

  /**
   * Remove a specific permission from a role
   */
  async removePermissionFromRole(
    roleId: number,
    permissionId: number,
    adminUser: User,
  ): Promise<void> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        role: { id: roleId },
        permission: { id: permissionId },
      },
      relations: ['role', 'permission'],
    });

    if (!rolePermission) {
      throw new NotFoundException(
        `Permission assignment not found for role ${roleId} and permission ${permissionId}`,
      );
    }

    await this.rolePermissionRepository.remove(rolePermission);

    // Log the activity
    await this.activityLogRepository.save({
      user: adminUser,
      action: 'REMOVE_PERMISSION_FROM_ROLE',
      targetTable: 'role_permissions',
      targetId: rolePermission.id,
      description: `Permission "${rolePermission.permission.name}" removed from role "${rolePermission.role.name}"`,
    });

    this.logger.log(
      `Permission ${permissionId} removed from role ${roleId} by admin ${adminUser.id}`,
    );
  }

  /**
   * Remove all permissions from a role
   */
  async removeAllRolePermissions(
    roleId: number,
    adminUser: User,
  ): Promise<number> {
    // Validate role exists
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
    });

    const removedCount = rolePermissions.length;

    if (removedCount > 0) {
      await this.rolePermissionRepository.remove(rolePermissions);

      // Log the activity
      await this.activityLogRepository.save({
        user: adminUser,
        action: 'REMOVE_ALL_ROLE_PERMISSIONS',
        targetTable: 'role_permissions',
        targetId: roleId,
        description: `All ${removedCount} permissions removed from role "${role.name}"`,
      });
    }

    this.logger.log(
      `${removedCount} permissions removed from role ${roleId} by admin ${adminUser.id}`,
    );

    return removedCount;
  }

  /**
   * Clone permissions from one role to another
   */
  async cloneRolePermissions(
    dto: CloneRolePermissionsDto,
    adminUser: User,
  ): Promise<{
    cloned: number;
    skipped: number;
  }> {
    const { sourceRoleId, targetRoleId, replaceExisting } = dto;

    // Validate both roles exist
    const sourceRole = await this.roleRepository.findOne({
      where: { id: sourceRoleId },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });
    if (!sourceRole) {
      throw new NotFoundException(
        `Source role with ID ${sourceRoleId} not found`,
      );
    }

    const targetRole = await this.roleRepository.findOne({
      where: { id: targetRoleId },
    });
    if (!targetRole) {
      throw new NotFoundException(
        `Target role with ID ${targetRoleId} not found`,
      );
    }

    if (sourceRoleId === targetRoleId) {
      throw new BadRequestException(
        'Source and target roles cannot be the same',
      );
    }

    // If replaceExisting, remove all existing permissions from target role
    if (replaceExisting) {
      await this.removeAllRolePermissions(targetRoleId, adminUser);
    }

    // Get existing permissions for target role to avoid duplicates
    const existingTargetPermissions = await this.rolePermissionRepository.find({
      where: { role: { id: targetRoleId } },
      relations: ['permission'],
    });
    const existingPermissionIds = existingTargetPermissions.map(
      (rp) => rp.permission.id,
    );

    let cloned = 0;
    let skipped = 0;

    // Clone each permission
    for (const sourceRolePermission of sourceRole.rolePermissions) {
      if (
        !replaceExisting &&
        existingPermissionIds.includes(sourceRolePermission.permission.id)
      ) {
        skipped++;
        continue;
      }

      const newRolePermission = this.rolePermissionRepository.create({
        role: targetRole,
        permission: sourceRolePermission.permission,
      });
      await this.rolePermissionRepository.save(newRolePermission);
      cloned++;
    }

    // Log the activity
    await this.activityLogRepository.save({
      user: adminUser,
      action: 'CLONE_ROLE_PERMISSIONS',
      targetTable: 'role_permissions',
      targetId: targetRoleId,
      description: `Cloned ${cloned} permissions from role "${sourceRole.name}" to role "${targetRole.name}"`,
    });

    this.logger.log(
      `Cloned permissions from role ${sourceRoleId} to role ${targetRoleId}: ${cloned} cloned, ${skipped} skipped`,
    );

    return { cloned, skipped };
  }

  /**
   * Validate if a role has a specific permission
   */
  async validateRolePermission(
    roleId: number,
    permissionId: number,
  ): Promise<{ hasPermission: boolean; rolePermissionId?: number }> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: {
        role: { id: roleId },
        permission: { id: permissionId },
      },
    });

    return {
      hasPermission: !!rolePermission,
      rolePermissionId: rolePermission?.id,
    };
  }

  /**
   * Get user's effective permissions (from both role and assignedRole)
   */
  async getUserEffectivePermissions(userId: number): Promise<{
    businessPermissions: Permission[];
    adminPermissions: Permission[];
    allUniquePermissions: Permission[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
        'assignedRole',
        'assignedRole.rolePermissions',
        'assignedRole.rolePermissions.permission',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const businessPermissions =
      user.role?.rolePermissions?.map((rp) => rp.permission) || [];
    const adminPermissions =
      user.assignedRole?.rolePermissions?.map((rp) => rp.permission) || [];

    // Combine and deduplicate permissions
    const allPermissions = [...businessPermissions, ...adminPermissions];
    const uniquePermissionIds = new Set();
    const allUniquePermissions = allPermissions.filter((permission) => {
      if (uniquePermissionIds.has(permission.id)) {
        return false;
      }
      uniquePermissionIds.add(permission.id);
      return true;
    });

    return {
      businessPermissions,
      adminPermissions,
      allUniquePermissions,
    };
  }

  /**
   * Get permission usage analytics
   */
  async getPermissionAnalytics(): Promise<{
    totalPermissions: number;
    usedPermissions: number;
    unusedPermissions: number;
    mostUsedPermissions: Array<{ permission: Permission; usageCount: number }>;
    leastUsedPermissions: Array<{ permission: Permission; usageCount: number }>;
  }> {
    const totalPermissions = await this.permissionRepository.count();

    // Get permission usage counts
    const permissionUsage = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('permission.id', 'permissionId')
      .addSelect('permission.name', 'permissionName')
      .addSelect('permission.description', 'permissionDescription')
      .addSelect('COUNT(rp.id)', 'usageCount')
      .innerJoin('rp.permission', 'permission')
      .groupBy('permission.id')
      .orderBy('usageCount', 'DESC')
      .getRawMany();

    const usedPermissions = permissionUsage.length;
    const unusedPermissions = totalPermissions - usedPermissions;

    // Get most used permissions (top 10)
    const mostUsedPermissions = permissionUsage.slice(0, 10).map((item) => ({
      permission: {
        id: item.permissionId,
        name: item.permissionName,
        description: item.permissionDescription,
      } as Permission,
      usageCount: parseInt(item.usageCount),
    }));

    // Get least used permissions (bottom 10, excluding unused)
    const leastUsedPermissions = permissionUsage
      .slice(-10)
      .reverse()
      .map((item) => ({
        permission: {
          id: item.permissionId,
          name: item.permissionName,
          description: item.permissionDescription,
        } as Permission,
        usageCount: parseInt(item.usageCount),
      }));

    return {
      totalPermissions,
      usedPermissions,
      unusedPermissions,
      mostUsedPermissions,
      leastUsedPermissions,
    };
  }

  /**
   * Get role complexity analytics
   */
  async getRoleAnalytics(): Promise<{
    totalRoles: number;
    rolesWithPermissions: number;
    rolesWithoutPermissions: number;
    mostComplexRoles: Array<{ role: Role; permissionCount: number }>;
    simplestRoles: Array<{ role: Role; permissionCount: number }>;
    averagePermissionsPerRole: number;
  }> {
    const totalRoles = await this.roleRepository.count();

    // Get role permission counts
    const roleComplexity = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .select('role.id', 'roleId')
      .addSelect('role.name', 'roleName')
      .addSelect('role.description', 'roleDescription')
      .addSelect('COUNT(rp.id)', 'permissionCount')
      .innerJoin('rp.role', 'role')
      .groupBy('role.id')
      .orderBy('permissionCount', 'DESC')
      .getRawMany();

    const rolesWithPermissions = roleComplexity.length;
    const rolesWithoutPermissions = totalRoles - rolesWithPermissions;

    // Calculate average permissions per role
    const totalPermissionAssignments = roleComplexity.reduce(
      (sum, item) => sum + parseInt(item.permissionCount),
      0,
    );
    const averagePermissionsPerRole =
      totalRoles > 0 ? totalPermissionAssignments / totalRoles : 0;

    // Get most complex roles (top 10)
    const mostComplexRoles = roleComplexity.slice(0, 10).map((item) => ({
      role: {
        id: item.roleId,
        name: item.roleName,
        description: item.roleDescription,
      } as Role,
      permissionCount: parseInt(item.permissionCount),
    }));

    // Get simplest roles (bottom 10, excluding roles without permissions)
    const simplestRoles = roleComplexity
      .slice(-10)
      .reverse()
      .map((item) => ({
        role: {
          id: item.roleId,
          name: item.roleName,
          description: item.roleDescription,
        } as Role,
        permissionCount: parseInt(item.permissionCount),
      }));

    return {
      totalRoles,
      rolesWithPermissions,
      rolesWithoutPermissions,
      mostComplexRoles,
      simplestRoles,
      averagePermissionsPerRole:
        Math.round(averagePermissionsPerRole * 100) / 100,
    };
  }

  /**
   * List role permissions (existing method enhanced)
   */
  async listRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });

    return rolePermissions.map((rp) => rp.permission);
  }
}

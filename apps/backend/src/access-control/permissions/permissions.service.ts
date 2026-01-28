/**
 * @file permissions.service.ts
 * @description Business logic for managing permissions dynamically.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { ActivityLog } from '../entities/activity-log.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async create(
    createPermissionDto: CreatePermissionDto,
    adminUser: User,
  ): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    const savedPermission = await this.permissionRepository.save(permission);

    await this.activityLogRepository.save({
      user: adminUser,
      action: 'CREATE_PERMISSION',
      targetTable: 'permissions',
      targetId: savedPermission.id,
      description: `Permission ${savedPermission.name} created`,
    });

    this.logger.log(`Permission created: ${savedPermission.name}`);
    return savedPermission;
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
    adminUser: User,
  ): Promise<Permission> {
    const permission = await this.findOne(id);
    Object.assign(permission, updatePermissionDto);
    const updatedPermission = await this.permissionRepository.save(permission);

    await this.activityLogRepository.save({
      user: adminUser,
      action: 'UPDATE_PERMISSION',
      targetTable: 'permissions',
      targetId: updatedPermission.id,
      description: `Permission ${updatedPermission.name} updated`,
    });

    this.logger.log(`Permission updated: ${updatedPermission.name}`);
    return updatedPermission;
  }

  /**
   * Remove a permission from the system
   * 
   * Validates that system-level permissions cannot be deleted to protect
   * critical system functionality. System permissions (isSystem = true) are
   * essential for core operations and should never be removed.
   * 
   * @param id - The ID of the permission to delete
   * @param adminUser - The admin user performing the deletion (for audit logging)
   * @throws {NotFoundException} If the permission does not exist
   * @throws {BadRequestException} If attempting to delete a system permission
   * 
   * @example
   * await permissionsService.remove(5, adminUser);
   */
  async remove(id: number, adminUser: User): Promise<void> {
    const permission = await this.findOne(id);

    // Validate that system permissions cannot be deleted
    if (permission.isSystem) {
      const errorMessage = `Cannot delete system permission: ${permission.name}. System permissions are critical for core functionality and cannot be removed.`;
      this.logger.warn(
        `Attempted to delete system permission: ${permission.name} by user: ${adminUser.email}`,
      );
      throw new BadRequestException(errorMessage);
    }

    await this.permissionRepository.remove(permission);

    await this.activityLogRepository.save({
      user: adminUser,
      action: 'DELETE_PERMISSION',
      targetTable: 'permissions',
      targetId: permission.id,
      description: `Permission ${permission.name} deleted`,
    });

    this.logger.log(`Permission deleted: ${permission.name}`);
  }
}

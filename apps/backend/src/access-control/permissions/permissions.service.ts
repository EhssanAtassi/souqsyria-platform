/**
 * @file permissions.service.ts
 * @description Business logic for managing permissions dynamically.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async remove(id: number, adminUser: User): Promise<void> {
    const permission = await this.findOne(id);
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

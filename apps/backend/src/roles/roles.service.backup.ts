import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Create a new role.
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    const saved = await this.roleRepository.save(role);
    this.logger.log(`Created new role: ${saved.name}`);
    return saved;
  }

  /**
   * Find all roles with optional search and pagination.
   */
  async findAll(query?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponseDto<Role>> {
    const { search, page = 1, limit = 10 } = query || {};

    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermissions');

    if (search) {
      qb.where('role.name LIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('role.id', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find one role by ID.
   */
  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['rolePermissions'],
    });
    if (!role) {
      this.logger.warn(`Role ID ${id} not found`);
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  /**
   * Update a role by ID.
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

    Object.assign(role, updateRoleDto);
    const updated = await this.roleRepository.save(role);
    this.logger.log(`Updated role ID ${id}`);
    return updated;
  }

  /**
   * Soft delete a role by ID.
   */
  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    if (role.isDefault) {
      this.logger.warn(`Attempt to delete default role ID ${id} denied`);
      throw new BadRequestException('Cannot delete a default system role.');
    }
    await this.roleRepository.softRemove(role);
    this.logger.warn(`Soft-deleted role ID ${id}`);
  }

  /**
   * Clone a role and its permissions.
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
    });

    const savedClone = await this.roleRepository.save(clone);

    for (const rp of original.rolePermissions) {
      await this.roleRepository.query(
        `INSERT INTO role_permissions (roleId, permissionId, createdAt) VALUES (?, ?, NOW())`,
        [savedClone.id, rp.permission.id],
      );
    }

    this.logger.log(`Cloned role ID ${roleId} to ${savedClone.id}`);
    return savedClone;
  }
}

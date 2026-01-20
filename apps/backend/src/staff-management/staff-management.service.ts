/**
 * @file staff-management.service.ts
 * @description Business logic for creating and managing staff users.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import * as bcrypt from 'bcrypt';
import { ActivityLog } from '../access-control/entities/activity-log.entity';

@Injectable()
export class StaffManagementService {
  private readonly logger = new Logger(StaffManagementService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(ActivityLog)
    private readonly activityLogRepository: Repository<ActivityLog>,
  ) {}

  async createStaff(
    createStaffDto: CreateStaffDto,
    adminUser: User,
  ): Promise<User> {
    const { email, password, roleId, fullName } = createStaffDto;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered.');
    }

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Assigned Role not found');

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = this.userRepository.create({
      email,
      passwordHash,
      fullName,
      assignedRole: role,
      isVerified: true, // Staff created by admin => auto verified
    });

    const savedStaff = await this.userRepository.save(staff);

    await this.activityLogRepository.save({
      user: adminUser,
      action: 'CREATE_STAFF_USER',
      targetTable: 'users',
      targetId: savedStaff.id,
      description: `Staff ${savedStaff.email} created and assigned role ${role.name}`,
    });

    this.logger.log(`Staff created: ${savedStaff.email}`);
    return savedStaff;
  }

  async findAllStaff(): Promise<User[]> {
    return this.userRepository.find({
      where: { assignedRole: { id: Not(null) } },
      relations: ['assignedRole'],
    });
  }

  async findOneStaff(id: number): Promise<User> {
    const staff = await this.userRepository.findOne({
      where: { id },
      relations: ['assignedRole'],
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return staff;
  }

  async updateStaff(
    id: number,
    updateStaffDto: UpdateStaffDto,
    adminUser: User,
  ): Promise<User> {
    const staff = await this.findOneStaff(id);
    Object.assign(staff, updateStaffDto);

    if (updateStaffDto.password) {
      staff.passwordHash = await bcrypt.hash(updateStaffDto.password, 10);
    }

    const updatedStaff = await this.userRepository.save(staff);

    await this.activityLogRepository.save({
      user: adminUser,
      action: 'UPDATE_STAFF_USER',
      targetTable: 'users',
      targetId: updatedStaff.id,
      description: `Staff ${updatedStaff.email} updated`,
    });

    return updatedStaff;
  }

  async removeStaff(id: number, adminUser: User): Promise<void> {
    const staff = await this.findOneStaff(id);
    await this.userRepository.remove(staff);

    await this.activityLogRepository.save({
      user: adminUser,
      action: 'DELETE_STAFF_USER',
      targetTable: 'users',
      targetId: id,
      description: `Staff with ID ${id} deleted`,
    });

    this.logger.log(`Staff deleted: ID ${id}`);
  }
}

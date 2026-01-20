/**
 * @file admin-users.controller.ts
 * @description Admin controller for user management operations including
 *              listing, filtering, status updates, role assignment, and KYC review.
 * @module AdminDashboard/Controllers
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between } from 'typeorm';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Entities
import { User } from '../../users/entities/user.entity';
import { KycDocument } from '../../kyc/entites/kyc-document.entity';
import { Order } from '../../orders/entities/order.entity';
import { Role } from '../../roles/entities/role.entity';

// Services
import { AuditLogService } from '../../audit-log/service/audit-log.service';

// DTOs
import {
  UserListQueryDto,
  UpdateUserStatusDto,
  AssignUserRoleDto,
  ReviewKycDto,
  UserListItemDto,
  UserDetailsDto,
  KycVerificationItemDto,
  PaginatedUserListDto,
  UserStatus,
  KycStatus,
  UserRoleDto,
  UserKycSummaryDto,
} from '../dto';

/**
 * Admin Users Controller
 * @description Provides API endpoints for user management in the admin dashboard.
 *              Supports listing, filtering, status management, role assignment, and KYC review.
 */
@ApiTags('Admin Dashboard - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@Controller('admin-dashboard/users')
export class AdminUsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(KycDocument)
    private readonly kycDocumentRepository: Repository<KycDocument>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    private readonly auditLogService: AuditLogService,
  ) {}

  // ===========================================================================
  // USER LISTING
  // ===========================================================================

  /**
   * Get paginated user list
   * @description Retrieves users with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of users
   */
  @Get()
  @ApiOperation({
    summary: 'Get user list',
    description: 'Retrieves paginated list of users with support for ' +
                 'search, status filtering, KYC status filtering, and role filtering.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User list retrieved successfully',
    type: PaginatedUserListDto,
  })
  async getUsers(@Query() query: UserListQueryDto): Promise<PaginatedUserListDto> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      roleIds,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      createdAfter,
      createdBefore,
    } = query;

    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.assignedRole', 'assignedRole');

    // Apply search filter on fullName and email
    if (search) {
      queryBuilder.andWhere(
        '(user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply status filter - derive from isBanned/isSuspended
    if (status) {
      switch (status) {
        case UserStatus.BANNED:
          queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: true });
          break;
        case UserStatus.SUSPENDED:
          queryBuilder.andWhere('user.isSuspended = :isSuspended AND user.isBanned = :notBanned', {
            isSuspended: true,
            notBanned: false
          });
          break;
        case UserStatus.PENDING_VERIFICATION:
          queryBuilder.andWhere('user.isVerified = :isVerified', { isVerified: false });
          break;
        case UserStatus.ACTIVE:
          queryBuilder.andWhere('user.isBanned = :notBanned AND user.isSuspended = :notSuspended AND user.isVerified = :verified', {
            notBanned: false,
            notSuspended: false,
            verified: true,
          });
          break;
        case UserStatus.INACTIVE:
          // Inactive could mean no recent login
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          queryBuilder.andWhere('(user.lastLoginAt IS NULL OR user.lastLoginAt < :thirtyDaysAgo)', { thirtyDaysAgo });
          break;
      }
    }

    // Apply role filter
    if (roleIds?.length) {
      queryBuilder.andWhere('(role.id IN (:...roleIds) OR assignedRole.id IN (:...roleIds))', { roleIds });
    }

    // Apply date filters
    if (createdAfter) {
      queryBuilder.andWhere('user.createdAt >= :createdAfter', { createdAfter: new Date(createdAfter) });
    }

    if (createdBefore) {
      queryBuilder.andWhere('user.createdAt <= :createdBefore', { createdBefore: new Date(createdBefore) });
    }

    // Apply sorting
    const sortFieldMap: Record<string, string> = {
      id: 'user.id',
      createdAt: 'user.createdAt',
      updatedAt: 'user.updatedAt',
      name: 'user.fullName',
      email: 'user.email',
      lastLogin: 'user.lastLoginAt',
    };
    const sortField = sortFieldMap[sortBy] || 'user.createdAt';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const users = await queryBuilder.getMany();

    // Get order stats for users
    const userIds = users.map(u => u.id);
    const orderStats = await this.getOrderStatsForUsers(userIds);

    // Get KYC status for users
    const kycStatuses = await this.getKycStatusForUsers(userIds);

    // Map to DTOs
    const items: UserListItemDto[] = users.map(user =>
      this.mapUserToListItem(user, orderStats.get(user.id), kycStatuses.get(user.id))
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get user details
   * @description Retrieves detailed information about a specific user
   * @param id - User ID
   * @returns User details with activity log
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user details',
    description: 'Retrieves comprehensive details about a specific user ' +
                 'including roles, KYC status, order history, and recent activity.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User details retrieved successfully',
    type: UserDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async getUserDetails(@Param('id', ParseIntPipe) id: number): Promise<UserDetailsDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'assignedRole', 'addresses', 'wishlist'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get order stats for this user
    const orderStats = await this.getOrderStatsForUsers([id]);
    const userOrderStats = orderStats.get(id) || { totalOrders: 0, totalSpent: 0 };

    // Get KYC status for this user
    const kycStatuses = await this.getKycStatusForUsers([id]);
    const userKycStatus = kycStatuses.get(id);

    // Get recent activity from audit logs (if method exists)
    let recentActivity: { action: string; timestamp: Date; details?: string }[] = [];
    try {
      // AuditLogService might have a method to get logs for entity
      const logs = await this.auditLogService.findAll({
        entityType: 'user',
        entityId: id.toString(),
        limit: 10,
      } as any);
      if (logs && Array.isArray(logs)) {
        recentActivity = logs.map((log: any) => ({
          action: log.action || 'unknown',
          timestamp: log.createdAt || new Date(),
          details: log.description || log.details,
        }));
      }
    } catch (error) {
      // Audit log service might not have this method, skip
    }

    const baseItem = this.mapUserToListItem(user, userOrderStats, userKycStatus);

    return {
      ...baseItem,
      // User entity doesn't have dateOfBirth or gender, set as undefined
      dateOfBirth: undefined,
      gender: undefined,
      addressCount: user.addresses?.length || 0,
      wishlistCount: user.wishlist?.length || 0,
      reviewCount: 0, // Would need reviews relation
      recentActivity,
      updatedAt: user.updatedAt,
    };
  }

  // ===========================================================================
  // USER STATUS MANAGEMENT
  // ===========================================================================

  /**
   * Update user status
   * @description Updates user account status (active, suspended, banned, etc.)
   * @param id - User ID
   * @param dto - Status update details
   * @returns Updated user
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update user status',
    description: 'Updates user account status. Supports active, inactive, ' +
                 'suspended, banned, and pending_verification states.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User status updated successfully',
    type: UserListItemDto,
  })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserListItemDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'assignedRole'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get previous status for logging
    const previousStatus = this.deriveUserStatus(user);

    // Update status based on new status value
    switch (dto.status) {
      case UserStatus.BANNED:
        user.isBanned = true;
        user.isSuspended = false;
        user.banReason = dto.reason || null;
        break;
      case UserStatus.SUSPENDED:
        user.isBanned = false;
        user.isSuspended = true;
        user.banReason = dto.reason || null;
        break;
      case UserStatus.ACTIVE:
        user.isBanned = false;
        user.isSuspended = false;
        user.banReason = null;
        break;
      case UserStatus.PENDING_VERIFICATION:
        user.isVerified = false;
        user.isBanned = false;
        user.isSuspended = false;
        break;
      case UserStatus.INACTIVE:
        // Just mark as not verified for now
        break;
    }

    // Save status change in audit log
    try {
      await this.auditLogService.log({
        action: 'user.status_changed',
        actorId: 0, // Would come from request context
        actorType: 'admin',
        entityType: 'user',
        entityId: id,
        description: `User status changed from ${previousStatus} to ${dto.status}`,
        beforeData: { status: previousStatus },
        afterData: { status: dto.status, reason: dto.reason },
      });
    } catch (error) {
      // Log error but don't fail the operation
    }

    await this.userRepository.save(user);

    // Get order stats and KYC status
    const orderStats = await this.getOrderStatsForUsers([id]);
    const kycStatuses = await this.getKycStatusForUsers([id]);

    return this.mapUserToListItem(user, orderStats.get(id), kycStatuses.get(id));
  }

  /**
   * Assign roles to user
   * @description Assigns or replaces user roles
   * @param id - User ID
   * @param dto - Role assignment details
   * @returns Updated user
   */
  @Post(':id/assign-role')
  @ApiOperation({
    summary: 'Assign roles to user',
    description: 'Assigns roles to a user. Can either add to existing roles ' +
                 'or replace all existing roles based on replaceExisting flag.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiBody({ type: AssignUserRoleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Roles assigned successfully',
    type: UserListItemDto,
  })
  async assignUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignUserRoleDto,
  ): Promise<UserListItemDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'assignedRole'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the roles to assign
    const roles = await this.roleRepository.findBy({
      id: In(dto.roleIds),
    });

    if (roles.length === 0) {
      throw new BadRequestException('No valid roles found');
    }

    // Previous roles for logging
    const previousRole = user.role?.id;
    const previousAssignedRole = user.assignedRole?.id;

    // Assign first role as main role, second as assigned role (if exists)
    if (dto.replaceExisting || !user.role) {
      user.role = roles[0];
    }
    if (roles.length > 1) {
      user.assignedRole = roles[1];
    }

    // Log role change
    try {
      await this.auditLogService.log({
        action: 'user.roles_changed',
        actorId: 0, // Would come from request context
        actorType: 'admin',
        entityType: 'user',
        entityId: id,
        description: `User roles updated`,
        beforeData: { roleId: previousRole, assignedRoleId: previousAssignedRole },
        afterData: { roleIds: dto.roleIds, replaceExisting: dto.replaceExisting },
      });
    } catch (error) {
      // Log error but don't fail the operation
    }

    await this.userRepository.save(user);

    // Get order stats and KYC status
    const orderStats = await this.getOrderStatsForUsers([id]);
    const kycStatuses = await this.getKycStatusForUsers([id]);

    return this.mapUserToListItem(user, orderStats.get(id), kycStatuses.get(id));
  }

  // ===========================================================================
  // KYC VERIFICATION
  // ===========================================================================

  /**
   * Get pending KYC submissions
   * @description Retrieves KYC submissions awaiting review
   * @returns List of pending KYC verifications
   */
  @Get('kyc/pending')
  @ApiOperation({
    summary: 'Get pending KYC submissions',
    description: 'Retrieves all KYC verification submissions that are ' +
                 'pending review, sorted by submission date.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending KYC submissions retrieved successfully',
    type: [KycVerificationItemDto],
  })
  async getPendingKyc(): Promise<KycVerificationItemDto[]> {
    const pendingKyc = await this.kycDocumentRepository.find({
      where: { status: 'pending' },
      relations: ['user'],
      order: { submittedAt: 'ASC' },
    });

    return pendingKyc.map(kyc => ({
      id: kyc.id,
      userId: kyc.user?.id || 0,
      userName: kyc.user?.fullName || 'Unknown',
      userEmail: kyc.user?.email || 'N/A',
      status: KycStatus.PENDING,
      documentType: kyc.docType,
      submittedAt: kyc.submittedAt,
      previousRejectionReason: undefined, // KycDocument doesn't track rejection reason
      isResubmission: false, // KycDocument doesn't track resubmission
    }));
  }

  /**
   * Review KYC submission
   * @description Approves or rejects a KYC verification submission
   * @param id - User ID
   * @param dto - Review decision
   * @returns Review result
   */
  @Post(':id/kyc/review')
  @ApiOperation({
    summary: 'Review KYC submission',
    description: 'Reviews a KYC verification submission. Supports approve, ' +
                 'reject, and requires_resubmission decisions.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiBody({ type: ReviewKycDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC review completed successfully',
  })
  async reviewKyc(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewKycDto,
  ): Promise<{ success: boolean; message: string }> {
    // Find KYC documents for this user
    const kycDocuments = await this.kycDocumentRepository.find({
      where: { user: { id } },
      relations: ['user'],
    });

    if (kycDocuments.length === 0) {
      throw new NotFoundException('KYC submission not found for user');
    }

    // Map decision to KycDocument status
    let newStatus: 'pending' | 'approved' | 'rejected';
    switch (dto.decision) {
      case 'approved':
        newStatus = 'approved';
        break;
      case 'rejected':
      case 'requires_resubmission':
        newStatus = 'rejected';
        break;
      default:
        newStatus = 'pending';
    }

    // Update all KYC documents for this user
    for (const kyc of kycDocuments) {
      kyc.status = newStatus;
      await this.kycDocumentRepository.save(kyc);
    }

    // Log the review
    try {
      await this.auditLogService.log({
        action: 'kyc.reviewed',
        actorId: 0, // Would come from request context
        actorType: 'admin',
        entityType: 'kyc_document',
        entityId: kycDocuments[0].id,
        description: `KYC ${dto.decision} for user ${id}`,
        afterData: {
          userId: id,
          decision: dto.decision,
          notes: dto.notes,
        },
      });
    } catch (error) {
      // Log error but don't fail the operation
    }

    return {
      success: true,
      message: `KYC ${dto.decision} for user ${id}`,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Get order statistics for multiple users
   * @param userIds - Array of user IDs
   * @returns Map of user ID to order stats
   */
  private async getOrderStatsForUsers(userIds: number[]): Promise<Map<number, { totalOrders: number; totalSpent: number }>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.user.id', 'userId')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.total_amount), 0)', 'totalSpent')
      .where('order.user.id IN (:...userIds)', { userIds })
      .andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed'],
      })
      .groupBy('order.user.id')
      .getRawMany();

    const result = new Map<number, { totalOrders: number; totalSpent: number }>();
    for (const stat of stats) {
      result.set(stat.userId, {
        totalOrders: parseInt(stat.totalOrders) || 0,
        totalSpent: parseFloat(stat.totalSpent) || 0,
      });
    }

    // Fill in missing users with zero stats
    for (const userId of userIds) {
      if (!result.has(userId)) {
        result.set(userId, { totalOrders: 0, totalSpent: 0 });
      }
    }

    return result;
  }

  /**
   * Get KYC status for multiple users
   * @param userIds - Array of user IDs
   * @returns Map of user ID to KYC summary
   */
  private async getKycStatusForUsers(userIds: number[]): Promise<Map<number, UserKycSummaryDto>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const kycDocs = await this.kycDocumentRepository
      .createQueryBuilder('kyc')
      .select('kyc.user.id', 'userId')
      .addSelect('kyc.status', 'status')
      .addSelect('MAX(kyc.submittedAt)', 'submittedAt')
      .addSelect('MAX(kyc.updatedAt)', 'reviewedAt')
      .where('kyc.user.id IN (:...userIds)', { userIds })
      .groupBy('kyc.user.id')
      .addGroupBy('kyc.status')
      .getRawMany();

    const result = new Map<number, UserKycSummaryDto>();
    for (const doc of kycDocs) {
      const kycStatus = this.mapKycDocStatusToKycStatus(doc.status);
      result.set(doc.userId, {
        status: kycStatus,
        submittedAt: doc.submittedAt,
        reviewedAt: doc.status !== 'pending' ? doc.reviewedAt : undefined,
        canResubmit: doc.status === 'rejected',
      });
    }

    // Fill in missing users with not_submitted status
    for (const userId of userIds) {
      if (!result.has(userId)) {
        result.set(userId, {
          status: KycStatus.NOT_SUBMITTED,
          canResubmit: false,
        });
      }
    }

    return result;
  }

  /**
   * Map KycDocument status to KycStatus enum
   */
  private mapKycDocStatusToKycStatus(status: 'pending' | 'approved' | 'rejected'): KycStatus {
    switch (status) {
      case 'pending':
        return KycStatus.PENDING;
      case 'approved':
        return KycStatus.APPROVED;
      case 'rejected':
        return KycStatus.REJECTED;
      default:
        return KycStatus.NOT_SUBMITTED;
    }
  }

  /**
   * Derive user status from entity flags
   */
  private deriveUserStatus(user: User): UserStatus {
    if (user.isBanned) {
      return UserStatus.BANNED;
    }
    if (user.isSuspended) {
      return UserStatus.SUSPENDED;
    }
    if (!user.isVerified) {
      return UserStatus.PENDING_VERIFICATION;
    }
    return UserStatus.ACTIVE;
  }

  /**
   * Extract first and last name from full name
   */
  private extractNames(fullName: string | null): { firstName: string; lastName: string } {
    if (!fullName) {
      return { firstName: '', lastName: '' };
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  /**
   * Map user entity to list item DTO
   */
  private mapUserToListItem(
    user: User,
    orderStats?: { totalOrders: number; totalSpent: number },
    kycStatus?: UserKycSummaryDto,
  ): UserListItemDto {
    const names = this.extractNames(user.fullName);
    const roles: UserRoleDto[] = [];

    // Add primary role
    if (user.role) {
      roles.push({
        id: user.role.id,
        name: user.role.name,
        displayName: user.role.name, // Role entity might not have displayName
      });
    }

    // Add assigned role if different
    if (user.assignedRole && user.assignedRole.id !== user.role?.id) {
      roles.push({
        id: user.assignedRole.id,
        name: user.assignedRole.name,
        displayName: user.assignedRole.name,
      });
    }

    return {
      id: user.id,
      email: user.email || '',
      firstName: names.firstName,
      lastName: names.lastName,
      fullName: user.fullName || '',
      avatar: user.profilePictureUrl || undefined,
      phone: user.phone || undefined,
      status: this.deriveUserStatus(user),
      roles,
      kyc: kycStatus || {
        status: KycStatus.NOT_SUBMITTED,
        canResubmit: false,
      },
      emailVerified: user.isVerified,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      totalOrders: orderStats?.totalOrders || 0,
      totalSpent: orderStats?.totalSpent || 0,
    };
  }
}

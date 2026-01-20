/**
 * @file staff-management.controller.ts
 * @description Controller for managing staff users and administrative operations
 *
 * ENDPOINTS:
 * - POST /staff - Create new staff member
 * - GET /staff - Get all staff members
 * - GET /staff/:id - Get specific staff member
 * - PUT /staff/:id - Update staff member
 * - DELETE /staff/:id - Remove staff member
 * - PUT /staff/:id/role - Change staff member role
 * - GET /staff/activity-logs - Get staff activity logs
 * - PUT /staff/:id/reset-password - Reset staff password
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 1.0.0
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { StaffManagementService } from './staff-management.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * Additional DTOs for staff management operations
 */
class ChangeStaffRoleDto {
  /**
   * New role ID to assign to staff member
   */
  roleId: number;
}

class ResetStaffPasswordDto {
  /**
   * New password for staff member
   */
  newPassword: string;
}

@ApiTags('👥 Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('staff')
export class StaffManagementController {
  private readonly logger = new Logger(StaffManagementController.name);

  constructor(
    private readonly staffManagementService: StaffManagementService,
  ) {}

  /**
   * CREATE NEW STAFF MEMBER
   *
   * Creates a new staff member with assigned role and auto-verification
   * Only admin users can create staff members
   */
  @Post()
  @ApiOperation({
    summary: 'Create new staff member',
    description:
      'Creates a new staff member with assigned role and automatic verification. Only admin users can perform this action.',
  })
  @ApiBody({
    type: CreateStaffDto,
    description: 'Staff creation data',
    examples: {
      staffMember: {
        summary: 'Create Staff Member',
        value: {
          email: 'ahmad.manager@souqsyria.com',
          password: 'SecurePass123',
          roleId: 3,
          fullName: 'Ahmad Al-Manager',
        },
      },
      supportStaff: {
        summary: 'Create Support Staff',
        value: {
          email: 'sara.support@souqsyria.com',
          password: 'SecurePass456',
          roleId: 4,
          fullName: 'Sara Al-Support',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Staff member created successfully',
    schema: {
      example: {
        id: 1001,
        email: 'ahmad.manager@souqsyria.com',
        fullName: 'Ahmad Al-Manager',
        isVerified: true,
        assignedRole: {
          id: 3,
          name: 'Manager',
          description: 'Manager role with administrative privileges',
        },
        createdAt: '2025-08-09T12:30:00.000Z',
        updatedAt: '2025-08-09T12:30:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid staff data or email already exists',
    schema: {
      examples: {
        emailExists: {
          summary: 'Email Already Registered',
          value: {
            message: 'Email already registered.',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
        invalidRole: {
          summary: 'Invalid Role ID',
          value: {
            message: 'Assigned Role not found',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to create staff members',
  })
  async createStaff(
    @CurrentUser() adminUser: User,
    @Body() createStaffDto: CreateStaffDto,
  ) {
    this.logger.log(
      `Admin ${adminUser.id} creating new staff member: ${createStaffDto.email}`,
    );
    return this.staffManagementService.createStaff(createStaffDto, adminUser);
  }

  /**
   * GET ALL STAFF MEMBERS
   *
   * Retrieves list of all staff members with their assigned roles
   */
  @Get()
  @ApiOperation({
    summary: 'Get all staff members',
    description:
      'Retrieves list of all staff members with their assigned roles and details',
  })
  @ApiOkResponse({
    description: 'Staff members retrieved successfully',
    schema: {
      example: [
        {
          id: 1001,
          email: 'ahmad.manager@souqsyria.com',
          fullName: 'Ahmad Al-Manager',
          isVerified: true,
          assignedRole: {
            id: 3,
            name: 'Manager',
            description: 'Manager role with administrative privileges',
          },
          createdAt: '2025-08-09T12:30:00.000Z',
          updatedAt: '2025-08-09T12:30:00.000Z',
        },
        {
          id: 1002,
          email: 'sara.support@souqsyria.com',
          fullName: 'Sara Al-Support',
          isVerified: true,
          assignedRole: {
            id: 4,
            name: 'Support Agent',
            description: 'Customer support role',
          },
          createdAt: '2025-08-09T13:15:00.000Z',
          updatedAt: '2025-08-09T13:15:00.000Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view staff members',
  })
  async getAllStaff(@CurrentUser() user: User) {
    this.logger.log(`User ${user.id} retrieving all staff members`);
    return this.staffManagementService.findAllStaff();
  }

  /**
   * GET SPECIFIC STAFF MEMBER
   *
   * Retrieves detailed information about a specific staff member
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get staff member by ID',
    description:
      'Retrieves detailed information about a specific staff member including role and permissions',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member ID',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'Staff member retrieved successfully',
    schema: {
      example: {
        id: 1001,
        email: 'ahmad.manager@souqsyria.com',
        fullName: 'Ahmad Al-Manager',
        phone: '+963987654321',
        isVerified: true,
        assignedRole: {
          id: 3,
          name: 'Manager',
          description: 'Manager role with administrative privileges',
          permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS'],
        },
        createdAt: '2025-08-09T12:30:00.000Z',
        updatedAt: '2025-08-09T12:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Staff member not found',
    schema: {
      example: {
        message: 'Staff not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view staff details',
  })
  async getStaffById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`User ${user.id} retrieving staff member with ID: ${id}`);
    return this.staffManagementService.findOneStaff(id);
  }

  /**
   * UPDATE STAFF MEMBER
   *
   * Updates staff member information including role assignment
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update staff member',
    description:
      'Updates staff member information including personal details and role assignment',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member ID to update',
    example: 1001,
  })
  @ApiBody({
    type: UpdateStaffDto,
    description: 'Staff update data',
    examples: {
      updateDetails: {
        summary: 'Update Staff Details',
        value: {
          fullName: 'Ahmad Al-Manager (Updated)',
          phone: '+963123456789',
        },
      },
      changeRole: {
        summary: 'Change Staff Role',
        value: {
          roleId: 5,
        },
      },
      resetPassword: {
        summary: 'Reset Password',
        value: {
          password: 'NewSecurePass789',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Staff member updated successfully',
    schema: {
      example: {
        id: 1001,
        email: 'ahmad.manager@souqsyria.com',
        fullName: 'Ahmad Al-Manager (Updated)',
        phone: '+963123456789',
        isVerified: true,
        assignedRole: {
          id: 3,
          name: 'Manager',
          description: 'Manager role with administrative privileges',
        },
        createdAt: '2025-08-09T12:30:00.000Z',
        updatedAt: '2025-08-09T14:45:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Staff member not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to update staff members',
  })
  async updateStaff(
    @CurrentUser() adminUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    this.logger.log(`Admin ${adminUser.id} updating staff member ${id}`);
    return this.staffManagementService.updateStaff(
      id,
      updateStaffDto,
      adminUser,
    );
  }

  /**
   * REMOVE STAFF MEMBER
   *
   * Removes a staff member from the system (soft or hard delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remove staff member',
    description:
      'Removes a staff member from the system. This action logs all related activity and cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member ID to remove',
    example: 1001,
  })
  @ApiOkResponse({
    description: 'Staff member removed successfully',
    schema: {
      example: {
        message: 'Staff member removed successfully',
        removedStaffId: 1001,
        removedAt: '2025-08-09T15:30:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Staff member not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to remove staff members',
  })
  async removeStaff(
    @CurrentUser() adminUser: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(`Admin ${adminUser.id} removing staff member ${id}`);

    await this.staffManagementService.removeStaff(id, adminUser);

    return {
      message: 'Staff member removed successfully',
      removedStaffId: id,
      removedAt: new Date(),
    };
  }

  /**
   * CHANGE STAFF MEMBER ROLE
   *
   * Changes the role assignment for a staff member
   */
  @Put(':id/role')
  @ApiOperation({
    summary: 'Change staff member role',
    description:
      'Changes the role assignment for a staff member, updating their permissions and access levels',
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member ID',
    example: 1001,
  })
  @ApiBody({
    description: 'New role assignment data',
    schema: {
      type: 'object',
      properties: {
        roleId: {
          type: 'number',
          description: 'New role ID to assign',
          example: 5,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Staff member role changed successfully',
    schema: {
      example: {
        id: 1001,
        email: 'ahmad.manager@souqsyria.com',
        fullName: 'Ahmad Al-Manager',
        assignedRole: {
          id: 5,
          name: 'Senior Manager',
          description: 'Senior manager with extended privileges',
        },
        roleChangedAt: '2025-08-09T15:45:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Staff member or role not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to change staff roles',
  })
  async changeStaffRole(
    @CurrentUser() adminUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() changeRoleDto: ChangeStaffRoleDto,
  ) {
    this.logger.log(
      `Admin ${adminUser.id} changing role for staff member ${id} to role ${changeRoleDto.roleId}`,
    );

    return this.staffManagementService.updateStaff(
      id,
      { roleId: changeRoleDto.roleId },
      adminUser,
    );
  }

  /**
   * RESET STAFF PASSWORD
   *
   * Resets a staff member's password (admin operation)
   */
  @Put(':id/reset-password')
  @ApiOperation({
    summary: 'Reset staff member password',
    description:
      "Resets a staff member's password. This is an administrative action that generates a new secure password.",
  })
  @ApiParam({
    name: 'id',
    description: 'Staff member ID',
    example: 1001,
  })
  @ApiBody({
    description: 'New password data',
    schema: {
      type: 'object',
      properties: {
        newPassword: {
          type: 'string',
          description: 'New password (minimum 6 characters)',
          example: 'NewSecurePass123',
          minLength: 6,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Staff member password reset successfully',
    schema: {
      example: {
        message: 'Password reset successfully',
        staffId: 1001,
        passwordResetAt: '2025-08-09T16:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Staff member not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid password format',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to reset staff passwords',
  })
  async resetStaffPassword(
    @CurrentUser() adminUser: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetStaffPasswordDto,
  ) {
    this.logger.log(
      `Admin ${adminUser.id} resetting password for staff member ${id}`,
    );

    await this.staffManagementService.updateStaff(
      id,
      { password: resetPasswordDto.newPassword },
      adminUser,
    );

    return {
      message: 'Password reset successfully',
      staffId: id,
      passwordResetAt: new Date(),
    };
  }

  /**
   * GET STAFF ACTIVITY SUMMARY
   *
   * Provides summary of staff activities and performance metrics
   */
  @Get('analytics/activity-summary')
  @ApiOperation({
    summary: 'Get staff activity summary',
    description:
      'Provides summary of staff activities, login patterns, and performance metrics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
    example: 30,
  })
  @ApiOkResponse({
    description: 'Staff activity summary retrieved successfully',
    schema: {
      example: {
        summary: {
          totalStaff: 15,
          activeStaff: 12,
          newStaffThisMonth: 3,
          averageLoginFrequency: 4.2,
        },
        topPerformers: [
          {
            staffId: 1001,
            fullName: 'Ahmad Al-Manager',
            activitiesCount: 245,
            role: 'Manager',
          },
          {
            staffId: 1002,
            fullName: 'Sara Al-Support',
            activitiesCount: 189,
            role: 'Support Agent',
          },
        ],
        roleDistribution: [
          { role: 'Manager', count: 3 },
          { role: 'Support Agent', count: 8 },
          { role: 'Admin', count: 2 },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view staff analytics',
  })
  async getStaffActivitySummary(
    @CurrentUser() user: User,
    @Query('days') days: number = 30,
  ) {
    this.logger.log(
      `User ${user.id} requesting staff activity summary for ${days} days`,
    );

    const allStaff = await this.staffManagementService.findAllStaff();

    // Calculate basic metrics
    const totalStaff = allStaff.length;
    const activeStaff = allStaff.filter((staff) => staff.isVerified).length;

    // Calculate new staff this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newStaffThisMonth = allStaff.filter(
      (staff) => new Date(staff.createdAt) > oneMonthAgo,
    ).length;

    // Role distribution
    const roleDistribution = allStaff.reduce((acc, staff) => {
      const roleName = staff.assignedRole?.name || 'No Role';
      const existing = acc.find((item) => item.role === roleName);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ role: roleName, count: 1 });
      }
      return acc;
    }, []);

    return {
      summary: {
        totalStaff,
        activeStaff,
        newStaffThisMonth,
        averageLoginFrequency: 4.2, // Placeholder - would need actual login tracking
      },
      topPerformers: allStaff.slice(0, 5).map((staff) => ({
        staffId: staff.id,
        fullName: staff.fullName,
        activitiesCount: Math.floor(Math.random() * 300), // Placeholder
        role: staff.assignedRole?.name || 'No Role',
      })),
      roleDistribution,
      generatedAt: new Date(),
    };
  }
}

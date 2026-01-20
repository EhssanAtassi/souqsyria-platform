/**
 * @file role-permissions.controller.ts
 * @description Complete controller for managing role-permission assignments with enterprise features.
 * Provides full CRUD operations, bulk operations, and advanced permission management.
 */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateRolePermissionDto } from '../dto/role-permission/create-role-permission.dto';
import { BulkAssignPermissionsDto } from '../dto/role-permission/bulk-assign-permissions.dto';
import { RolePermissionsQueryDto } from '../dto/role-permission/role-permissions-query.dto';
import { CloneRolePermissionsDto } from '../dto/role-permission/clone-role-permissions.dto';

@ApiTags('Admin Role-Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/role-permissions')
export class RolePermissionsController {
  private readonly logger = new Logger(RolePermissionsController.name);

  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  /**
   * Assign a single permission to a role
   */
  @Post('assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({ status: 201, description: 'Permission assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role or permission ID' })
  @ApiResponse({
    status: 409,
    description: 'Permission already assigned to role',
  })
  async assignPermissionToRole(
    @Body() dto: CreateRolePermissionDto,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.log(
      `Admin ${adminUser.id} assigning permission ${dto.permissionId} to role ${dto.roleId}`,
    );
    return this.rolePermissionsService.assignPermissionToRole(dto, adminUser);
  }

  /**
   * Bulk assign multiple permissions to a role
   */
  @Post('bulk-assign')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk assign multiple permissions to a role' })
  @ApiResponse({
    status: 201,
    description: 'Permissions assigned successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid role or permission IDs' })
  async bulkAssignPermissions(
    @Body() dto: BulkAssignPermissionsDto,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.log(
      `Admin ${adminUser.id} bulk assigning ${dto.permissionIds.length} permissions to role ${dto.roleId}`,
    );
    return this.rolePermissionsService.bulkAssignPermissions(dto, adminUser);
  }

  /**
   * Get all permissions assigned to a specific role
   */
  @Get('role/:roleId/permissions')
  // @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all permissions for a specific role' })
  @ApiResponse({
    status: 200,
    description: 'Role permissions retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async getRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Query() query: RolePermissionsQueryDto,
  ) {
    this.logger.log(`Retrieving permissions for role ${roleId}`);
    return this.rolePermissionsService.getRolePermissions(roleId, query);
  }

  /**
   * Get all roles that have a specific permission
   */
  @Get('permission/:permissionId/roles')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Get all roles that have a specific permission' })
  @ApiResponse({
    status: 200,
    description: 'Permission roles retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async getPermissionRoles(
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    this.logger.log(`Retrieving roles for permission ${permissionId}`);
    return this.rolePermissionsService.getPermissionRoles(permissionId);
  }

  /**
   * Get all role-permission mappings with pagination and filtering
   */
  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'List all role-permission mappings with filters' })
  @ApiResponse({
    status: 200,
    description: 'Role-permissions retrieved successfully',
  })
  async getAllRolePermissions(@Query() query: RolePermissionsQueryDto) {
    this.logger.log('Retrieving all role-permission mappings');
    return this.rolePermissionsService.getAllRolePermissions(query);
  }

  /**
   * Remove a specific role-permission assignment
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove a role-permission assignment' })
  @ApiResponse({
    status: 200,
    description: 'Role-permission removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role-permission mapping not found',
  })
  async removeRolePermission(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.warn(`Admin ${adminUser.id} removing role-permission ${id}`);
    return this.rolePermissionsService.removeRolePermission(id, adminUser);
  }

  /**
   * Remove a specific permission from a role
   */
  @Delete('role/:roleId/permission/:permissionId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove a specific permission from a role' })
  @ApiResponse({
    status: 200,
    description: 'Permission removed from role successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Role-permission mapping not found',
  })
  async removePermissionFromRole(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.warn(
      `Admin ${adminUser.id} removing permission ${permissionId} from role ${roleId}`,
    );
    return this.rolePermissionsService.removePermissionFromRole(
      roleId,
      permissionId,
      adminUser,
    );
  }

  /**
   * Remove all permissions from a role
   */
  @Delete('role/:roleId/permissions')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove all permissions from a role' })
  @ApiResponse({
    status: 200,
    description: 'All permissions removed from role successfully',
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async removeAllRolePermissions(
    @Param('roleId', ParseIntPipe) roleId: number,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.warn(
      `Admin ${adminUser.id} removing all permissions from role ${roleId}`,
    );
    return this.rolePermissionsService.removeAllRolePermissions(
      roleId,
      adminUser,
    );
  }

  /**
   * Clone permissions from one role to another
   */
  @Post('clone')
  @Roles('admin')
  @ApiOperation({ summary: 'Clone permissions from one role to another' })
  @ApiResponse({ status: 201, description: 'Permissions cloned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid source or target role' })
  async cloneRolePermissions(
    @Body() dto: CloneRolePermissionsDto,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.log(
      `Admin ${adminUser.id} cloning permissions from role ${dto.sourceRoleId} to role ${dto.targetRoleId}`,
    );
    return this.rolePermissionsService.cloneRolePermissions(dto, adminUser);
  }

  /**
   * Validate if a role has a specific permission
   */
  @Get('validate/role/:roleId/permission/:permissionId')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Check if a role has a specific permission' })
  @ApiResponse({ status: 200, description: 'Permission validation result' })
  async validateRolePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    this.logger.log(`Validating permission ${permissionId} for role ${roleId}`);
    return this.rolePermissionsService.validateRolePermission(
      roleId,
      permissionId,
    );
  }

  /**
   * Get user's effective permissions (from both role and assignedRole)
   */
  @Get('user/:userId/effective-permissions')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: "Get user's effective permissions from both roles" })
  @ApiResponse({
    status: 200,
    description: 'User effective permissions retrieved',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserEffectivePermissions(
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.logger.log(`Retrieving effective permissions for user ${userId}`);
    return this.rolePermissionsService.getUserEffectivePermissions(userId);
  }

  /**
   * Get permission analytics (which permissions are most/least used)
   */
  @Get('analytics/permission-usage')
  @Roles('admin')
  @ApiOperation({ summary: 'Get permission usage analytics' })
  @ApiResponse({ status: 200, description: 'Permission analytics retrieved' })
  async getPermissionAnalytics() {
    this.logger.log('Retrieving permission usage analytics');
    return this.rolePermissionsService.getPermissionAnalytics();
  }

  /**
   * Get role analytics (which roles have most/least permissions)
   */
  @Get('analytics/role-complexity')
  @Roles('admin')
  @ApiOperation({ summary: 'Get role complexity analytics' })
  @ApiResponse({ status: 200, description: 'Role analytics retrieved' })
  async getRoleAnalytics() {
    this.logger.log('Retrieving role complexity analytics');
    return this.rolePermissionsService.getRoleAnalytics();
  }
}

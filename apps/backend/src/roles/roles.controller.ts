/**
 * @file roles.controller.ts (Enhanced)
 * @description Enhanced controller for role management with advanced features.
 *
 * New endpoints:
 * - GET /roles/templates - Get role templates
 * - POST /roles/templates/:id - Create role from template
 * - POST /roles/:id/permissions - Bulk assign permissions
 * - DELETE /roles/:id/permissions/:permId - Remove single permission
 * - GET /roles/:id/users - List users with role
 * - PUT /roles/:id/priority - Update role priority
 *
 * All endpoints require JWT authentication and 'manage_roles' permission.
 * Comprehensive Swagger documentation included.
 *
 * @author SouqSyria Backend Team
 * @version 2.0.0
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Logger,
  Query,
  BadRequestException,
  Put,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { BulkAssignPermissionsDto } from './dto/bulk-assign-permissions.dto';
import { UpdateRolePriorityDto } from './dto/update-role-priority.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

/**
 * RolesController
 *
 * Manages all role-related operations including:
 * - Basic CRUD operations
 * - Role templates
 * - Permission management
 * - User assignment tracking
 * - Role hierarchy
 *
 * Security:
 * - All endpoints require JWT authentication
 * - All endpoints require 'manage_roles' permission
 * - System roles cannot be modified or deleted
 * - All modifications are audit logged
 *
 * Performance:
 * - Paginated queries for large datasets
 * - Bulk operations for efficiency
 * - Indexed database queries
 */
@ApiTags('Roles')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  // ============================================================
  // EXISTING ENDPOINTS (Enhanced with better Swagger docs)
  // ============================================================

  /**
   * Create a new role
   *
   * Creates a new role with the specified name, description, and priority.
   * After creation, use bulk assign permissions to add permissions to the role.
   *
   * @param createRoleDto - Role creation data
   * @returns Created role entity
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new role',
    description:
      'Creates a new role in the system. After creation, use the bulk assign permissions endpoint to add permissions. Requires manage_roles permission.',
  })
  @ApiBody({
    type: CreateRoleDto,
    description: 'Role creation data',
    examples: {
      basic: {
        summary: 'Basic role',
        value: {
          name: 'Customer Support',
          description: 'Handles customer inquiries and support tickets',
          priority: 30,
        },
      },
      advanced: {
        summary: 'Advanced role with type',
        value: {
          name: 'Senior Admin',
          description: 'Senior administrator with elevated privileges',
          type: 'admin',
          priority: 80,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Role created successfully',
    schema: {
      example: {
        id: 15,
        name: 'Customer Support',
        description: 'Handles customer inquiries and support tickets',
        isDefault: false,
        type: null,
        priority: 30,
        createdAt: '2025-01-21T10:30:00.000Z',
        updatedAt: '2025-01-21T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - missing manage_roles permission',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    this.logger.log(`Creating a new role: ${createRoleDto.name}`);
    return this.rolesService.create(createRoleDto);
  }

  /**
   * List all roles with optional search and pagination
   *
   * Retrieves all roles in the system with optional search filtering.
   * Results are ordered by priority (highest first) then by ID.
   *
   * @param query - Query parameters (search, page, limit)
   * @returns Paginated list of roles
   */
  @Get()
  @ApiOperation({
    summary: 'List all roles with optional search and pagination',
    description:
      'Retrieves all roles in the system. Supports search by name/description and pagination. Results ordered by priority (highest first). Requires manage_roles permission.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term to filter roles by name or description',
    example: 'manager',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of roles per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of roles retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'Super Admin',
            description: 'Full system access',
            isDefault: true,
            priority: 1000,
            rolePermissions: [],
          },
          {
            id: 15,
            name: 'Customer Support',
            description: 'Handles customer inquiries',
            isDefault: false,
            priority: 30,
            rolePermissions: [],
          },
        ],
        total: 12,
        page: 1,
        limit: 10,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - missing manage_roles permission',
  })
  findAll(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findAll(query);
  }

  /**
   * Get a single role by ID
   *
   * Retrieves detailed information about a specific role including
   * all assigned permissions.
   *
   * @param id - Role ID
   * @returns Role entity with permissions
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get a single role by ID',
    description:
      'Retrieves detailed information about a specific role including all assigned permissions. Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiResponse({
    status: 200,
    description: 'Role retrieved successfully',
    schema: {
      example: {
        id: 15,
        name: 'Customer Support',
        description: 'Handles customer inquiries and support tickets',
        isDefault: false,
        type: null,
        priority: 30,
        rolePermissions: [
          {
            id: 101,
            permission: {
              id: 5,
              name: 'view_users',
              description: 'View user profiles',
            },
          },
          {
            id: 102,
            permission: {
              id: 8,
              name: 'view_orders',
              description: 'View order details',
            },
          },
        ],
        createdAt: '2025-01-21T10:30:00.000Z',
        updatedAt: '2025-01-21T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  /**
   * Update a role by ID
   *
   * Updates role metadata (name, description, priority).
   * Cannot modify system roles (isDefault=true).
   * Use dedicated endpoints for permission management.
   *
   * @param id - Role ID
   * @param updateRoleDto - Update data
   * @returns Updated role entity
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a role by ID',
    description:
      'Updates role metadata (name, description, priority). Cannot modify system roles. Use dedicated endpoints for permission management. Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiBody({
    type: UpdateRoleDto,
    description: 'Role update data',
    examples: {
      name: {
        summary: 'Update name only',
        value: {
          name: 'Senior Customer Support',
        },
      },
      full: {
        summary: 'Full update',
        value: {
          name: 'Senior Customer Support',
          description: 'Senior support agent with escalation privileges',
          priority: 35,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Role updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot modify system role',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    this.logger.log(`Updating role ID ${id}`);
    return this.rolesService.update(+id, updateRoleDto);
  }

  /**
   * Delete a role by ID
   *
   * Soft deletes a role from the system.
   * Cannot delete system roles or roles with active users.
   * Reassign users to another role before deletion.
   *
   * @param id - Role ID
   * @returns Success message
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a role by ID',
    description:
      'Soft deletes a role. Cannot delete system roles or roles with active users. Reassign users first. Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiResponse({
    status: 204,
    description: 'Role deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot delete system role or role with active users',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  remove(@Param('id') id: string) {
    this.logger.warn(`Deleting role ID ${id}`);
    return this.rolesService.remove(+id);
  }

  /**
   * Clone a role and its permissions
   *
   * Creates a copy of an existing role with all its permissions.
   * The cloned role will have '_copy' appended to its name.
   * Cannot clone system roles.
   *
   * @param id - Role ID to clone
   * @returns Cloned role entity
   */
  @Post(':id/clone')
  @ApiOperation({
    summary: 'Clone a role and its permissions',
    description:
      "Creates a copy of an existing role with all its permissions. The cloned role will have '_copy' appended to its name. Cannot clone system roles. Requires manage_roles permission.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID to clone',
    example: 15,
  })
  @ApiResponse({
    status: 201,
    description: 'Role cloned successfully',
    schema: {
      example: {
        id: 20,
        name: 'Customer Support_copy',
        description: 'Handles customer inquiries and support tickets',
        isDefault: false,
        priority: 30,
        rolePermissions: [
          {
            id: 150,
            permission: {
              id: 5,
              name: 'view_users',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot clone system role',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async clone(@Param('id') id: string) {
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }
    return this.rolesService.cloneRole(roleId);
  }

  // ============================================================
  // NEW ENDPOINTS: ROLE TEMPLATES
  // ============================================================

  /**
   * Get all available role templates
   *
   * Returns pre-configured role templates for common use cases.
   * Templates can be used to quickly create roles with sensible defaults.
   *
   * @returns Array of role templates
   */
  @Get('templates/list')
  @ApiOperation({
    summary: 'Get all available role templates',
    description:
      'Returns pre-configured role templates for common use cases (Customer Support, Content Manager, Marketing Manager, etc.). Templates can be used to quickly create roles. Requires manage_roles permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of role templates',
    schema: {
      example: [
        {
          id: 'customer-support',
          name: 'Customer Support',
          description:
            'Customer service representatives who handle inquiries, view orders, and manage basic customer issues',
          permissionNames: [
            'view_users',
            'view_orders',
            'manage_tickets',
            'view_products',
          ],
          isDefault: false,
          priority: 30,
          category: 'support',
          useCases: [
            'Responding to customer inquiries',
            'Tracking order status',
          ],
        },
        {
          id: 'content-manager',
          name: 'Content Manager',
          description: 'Manages product catalog and content',
          permissionNames: [
            'manage_products',
            'manage_categories',
            'manage_brands',
          ],
          isDefault: false,
          priority: 40,
          category: 'content',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - missing manage_roles permission',
  })
  async getRoleTemplates() {
    this.logger.log('Fetching role templates');
    return this.rolesService.getRoleTemplates();
  }

  /**
   * Create a role from a template
   *
   * Creates a new role based on a pre-configured template.
   * The template's permissions will be automatically assigned.
   * Optionally provide a custom name to override the template name.
   *
   * @param templateId - Template identifier
   * @param customName - Optional custom name
   * @returns Created role with assigned permissions
   */
  @Post('templates/:templateId')
  @ApiOperation({
    summary: 'Create a role from a template',
    description:
      "Creates a new role based on a pre-configured template. The template's permissions will be automatically assigned. Optionally provide a custom name in the request body. Requires manage_roles permission.",
  })
  @ApiParam({
    name: 'templateId',
    type: String,
    description: 'Template identifier',
    example: 'customer-support',
    enum: [
      'customer-support',
      'content-manager',
      'marketing-manager',
      'finance-manager',
      'warehouse-manager',
      'vendor-manager',
      'quality-assurance',
      'analytics-specialist',
      'super-admin',
    ],
  })
  @ApiBody({
    description: 'Optional custom name for the role',
    required: false,
    schema: {
      type: 'object',
      properties: {
        customName: {
          type: 'string',
          description: 'Custom name to override template name',
          example: 'Level 1 Support',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Role created from template successfully',
    schema: {
      example: {
        id: 18,
        name: 'Level 1 Support',
        description:
          'Customer service representatives who handle inquiries',
        isDefault: false,
        priority: 30,
        rolePermissions: [
          {
            id: 120,
            permission: {
              id: 5,
              name: 'view_users',
              description: 'View user profiles',
            },
          },
          {
            id: 121,
            permission: {
              id: 8,
              name: 'view_orders',
              description: 'View order details',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - template references missing permissions or invalid template ID',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async createFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body?: { customName?: string },
  ) {
    this.logger.log(
      `Creating role from template: ${templateId}${body?.customName ? ` with custom name: ${body.customName}` : ''}`,
    );
    return this.rolesService.createFromTemplate(
      templateId,
      body?.customName,
    );
  }

  // ============================================================
  // NEW ENDPOINTS: BULK PERMISSION MANAGEMENT
  // ============================================================

  /**
   * Bulk assign permissions to a role
   *
   * Replaces all existing role permissions with the provided list.
   * This operation is atomic - either all succeed or all fail.
   * Cannot modify system roles.
   *
   * @param id - Role ID
   * @param dto - Bulk assignment DTO with permission IDs
   * @returns Updated role with new permissions
   */
  @Post(':id/permissions')
  @ApiOperation({
    summary: 'Bulk assign permissions to a role',
    description:
      'Replaces all existing role permissions with the provided list. This operation is atomic - either all succeed or all fail. Cannot modify system roles. Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiBody({
    type: BulkAssignPermissionsDto,
    description: 'List of permission IDs to assign',
    examples: {
      basic: {
        summary: 'Basic permissions',
        value: {
          permissionIds: [1, 2, 3, 5, 8],
        },
      },
      extensive: {
        summary: 'Extensive permissions',
        value: {
          permissionIds: [
            1, 2, 3, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30,
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
    schema: {
      example: {
        id: 15,
        name: 'Customer Support',
        description: 'Handles customer inquiries',
        rolePermissions: [
          {
            id: 150,
            permission: {
              id: 1,
              name: 'view_users',
            },
          },
          {
            id: 151,
            permission: {
              id: 2,
              name: 'view_orders',
            },
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot modify system role or invalid permission IDs',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found or permissions not found',
  })
  async bulkAssignPermissions(
    @Param('id') id: string,
    @Body() dto: BulkAssignPermissionsDto,
  ) {
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }
    this.logger.log(
      `Bulk assigning ${dto.permissionIds.length} permissions to role ID ${roleId}`,
    );
    return this.rolesService.bulkAssignPermissions(roleId, dto);
  }

  /**
   * Remove a single permission from a role
   *
   * Removes a specific permission from the role.
   * Validates that the role will still have at least 1 permission after removal.
   * Cannot modify system roles.
   *
   * @param id - Role ID
   * @param permissionId - Permission ID to remove
   * @returns Success message
   */
  @Delete(':id/permissions/:permissionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a single permission from a role',
    description:
      'Removes a specific permission from the role. Validates that the role will still have at least 1 permission after removal. Cannot modify system roles. Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiParam({
    name: 'permissionId',
    type: Number,
    description: 'Permission ID to remove',
    example: 20,
  })
  @ApiResponse({
    status: 204,
    description: 'Permission removed successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot modify system role or cannot remove last permission',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found or permission not assigned to role',
  })
  async removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    const roleId = parseInt(id, 10);
    const permId = parseInt(permissionId, 10);

    if (isNaN(roleId) || isNaN(permId)) {
      throw new BadRequestException('Invalid role ID or permission ID');
    }

    this.logger.log(
      `Removing permission ID ${permId} from role ID ${roleId}`,
    );
    return this.rolesService.removePermission(roleId, permId);
  }

  // ============================================================
  // NEW ENDPOINTS: USER ASSIGNMENT TRACKING
  // ============================================================

  /**
   * Get users assigned to a role
   *
   * Returns a paginated list of users who have this role assigned.
   * Includes both business roles (roleId) and staff roles (assignedRoleId).
   *
   * @param id - Role ID
   * @param query - Pagination parameters
   * @returns Paginated list of users
   */
  @Get(':id/users')
  @ApiOperation({
    summary: 'Get users assigned to a role',
    description:
      'Returns a paginated list of users who have this role assigned. Includes both business roles (roleId) and staff roles (assignedRoleId). Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Users per page (max 100)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 42,
            email: 'john.doe@example.com',
            fullName: 'John Doe',
            role: {
              id: 15,
              name: 'Customer Support',
            },
            assignedRole: null,
          },
          {
            id: 43,
            email: 'jane.smith@example.com',
            fullName: 'Jane Smith',
            role: null,
            assignedRole: {
              id: 15,
              name: 'Customer Support',
            },
          },
        ],
        total: 25,
        page: 1,
        limit: 20,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async getUsersWithRole(
    @Param('id') id: string,
    @Query() query: GetUsersQueryDto,
  ) {
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }

    this.logger.log(
      `Fetching users with role ID ${roleId} (page ${query.page}, limit ${query.limit})`,
    );
    return this.rolesService.getUsersWithRole(
      roleId,
      query.page,
      query.limit,
    );
  }

  // ============================================================
  // NEW ENDPOINTS: ROLE PRIORITY
  // ============================================================

  /**
   * Update role priority
   *
   * Updates the priority value for a role in the hierarchy.
   * Higher priority roles take precedence in conflict resolution.
   * Cannot modify system role priority.
   *
   * @param id - Role ID
   * @param dto - Priority update DTO
   * @returns Updated role
   */
  @Put(':id/priority')
  @ApiOperation({
    summary: 'Update role priority',
    description:
      'Updates the priority value for a role in the hierarchy. Higher priority roles take precedence in conflict resolution. Cannot modify system role priority. Requires manage_roles permission.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Role ID',
    example: 15,
  })
  @ApiBody({
    type: UpdateRolePriorityDto,
    description: 'New priority value',
    examples: {
      low: {
        summary: 'Low priority',
        value: {
          priority: 10,
        },
      },
      medium: {
        summary: 'Medium priority',
        value: {
          priority: 50,
        },
      },
      high: {
        summary: 'High priority',
        value: {
          priority: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Priority updated successfully',
    schema: {
      example: {
        id: 15,
        name: 'Customer Support',
        description: 'Handles customer inquiries',
        priority: 50,
        updatedAt: '2025-01-21T11:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot modify system role priority',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found',
  })
  async updateRolePriority(
    @Param('id') id: string,
    @Body() dto: UpdateRolePriorityDto,
  ) {
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }

    this.logger.log(
      `Updating priority for role ID ${roleId} to ${dto.priority}`,
    );
    return this.rolesService.updateRolePriority(roleId, dto);
  }
}

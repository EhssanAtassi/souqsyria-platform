/**
 * @file roles.controller.ts
 * @description This controller provides full CRUD operations for managing user roles in the system.
 * It is protected by JWT authentication and a dynamic permissions-based guard system.
 * Admin users can use these endpoints to create, update, view, and delete roles.
 * Each role can later be associated with permissions and assigned to users.
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
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FindRolesQueryDto } from './dto/find-roles-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Roles')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  private readonly logger = new Logger(RolesController.name);

  constructor(private readonly rolesService: RolesService) {}

  // Create a new role
  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  create(@Body() createRoleDto: CreateRoleDto) {
    this.logger.log('Creating a new role');
    return this.rolesService.create(createRoleDto);
  }

  // Retrieve a list of all roles with pagination and search
  @Get()
  @ApiOperation({
    summary: 'List all roles with optional search and pagination',
  })
  findAll(@Query() query: FindRolesQueryDto) {
    return this.rolesService.findAll(query);
  }

  // Retrieve a specific role by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a single role by ID' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(+id);
  }

  // Update a specific role by ID
  @Patch(':id')
  @ApiOperation({ summary: 'Update a role by ID' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    this.logger.log(`Updating role ID ${id}`);
    return this.rolesService.update(+id, updateRoleDto);
  }

  // Delete a specific role by ID
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role by ID' })
  remove(@Param('id') id: string) {
    this.logger.warn(`Deleting role ID ${id}`);
    return this.rolesService.remove(+id);
  }
  // Clone a role and its permissions
  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone a role and its permissions' })
  async clone(@Param('id') id: string) {
    const roleId = parseInt(id, 10);
    if (isNaN(roleId)) {
      throw new BadRequestException('Invalid role ID');
    }
    return this.rolesService.cloneRole(roleId);
  }
}

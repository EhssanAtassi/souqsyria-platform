/**
 * @file permissions.controller.ts
 * @description Controller for managing permissions (admin/staff control).
 */
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Permissions')
@ApiBearerAuth()
@Controller('admin/permissions')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class PermissionsController {
  private readonly logger = new Logger(PermissionsController.name);

  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  // @Roles('admin')
  @ApiOperation({ summary: 'Create a new permission' })
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
    // @CurrentUser() adminUser,
  ) {
    return this.permissionsService.create(createPermissionDto, null);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all permissions' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get permission by ID' })
  async findOne(@Param('id') id: number) {
    return this.permissionsService.findOne(+id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update permission by ID' })
  async update(
    @Param('id') id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @CurrentUser() adminUser,
  ) {
    return this.permissionsService.update(+id, updatePermissionDto, adminUser);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete permission by ID' })
  async remove(@Param('id') id: number, @CurrentUser() adminUser) {
    return this.permissionsService.remove(+id, adminUser);
  }
}

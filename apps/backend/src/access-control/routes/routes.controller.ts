/**
 * @file routes.controller.ts
 * @description Controller for managing API routes linked to permissions.
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
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from '../dto/route/create-route.dto';
import { UpdateRouteDto } from '../dto/route/update-route.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Routes Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard) //
@Controller('admin/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  // //@Roles('admin')
  @ApiOperation({ summary: 'Create new route linked to permission' })
  async create(@Body() dto: CreateRouteDto) {
    return this.routesService.create(dto);
  }

  @Get()
  //@Roles('admin')
  @ApiOperation({ summary: 'List all routes' })
  async findAll() {
    return this.routesService.findAll();
  }

  @Get(':id')
  //@Roles('admin')
  @ApiOperation({ summary: 'Get route by ID' })
  async findOne(@Param('id') id: number) {
    return this.routesService.findOne(+id);
  }

  @Put(':id')
  //@Roles('admin')
  @ApiOperation({ summary: 'Update route by ID' })
  async update(@Param('id') id: number, @Body() dto: UpdateRouteDto) {
    return this.routesService.update(+id, dto);
  }

  @Delete(':id')
  //@Roles('admin')
  @ApiOperation({ summary: 'Delete route by ID' })
  async remove(@Param('id') id: number) {
    return this.routesService.remove(+id);
  }
}

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../access-control/guards/permissions.guard';
import { RegionService } from '../service/region.service';
import { CreateRegionDto } from '../dto/create-region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';

@ApiTags('Admin Region')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a region' })
  async create(@Body() dto: CreateRegionDto) {
    return this.regionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all regions' })
  async findAll() {
    return this.regionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get region by ID' })
  @ApiParam({ name: 'id', description: 'Region ID' })
  async findOne(@Param('id') id: number) {
    return this.regionService.findOne(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update region' })
  @ApiParam({ name: 'id', description: 'Region ID' })
  async update(@Param('id') id: number, @Body() dto: UpdateRegionDto) {
    return this.regionService.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete region' })
  @ApiParam({ name: 'id', description: 'Region ID' })
  async remove(@Param('id') id: number) {
    await this.regionService.remove(Number(id));
    return { success: true };
  }
}

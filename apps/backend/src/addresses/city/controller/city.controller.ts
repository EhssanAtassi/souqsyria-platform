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
import { CityService } from '../service/city.service';
import { CreateCityDto } from '../dto/create-city.dto';
import { UpdateCityDto } from '../dto/update-city.dto';

@ApiTags('Admin City')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Post()
  @ApiOperation({ summary: 'Create a city' })
  async create(@Body() dto: CreateCityDto) {
    return this.cityService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cities' })
  async findAll() {
    return this.cityService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiParam({ name: 'id', description: 'City ID' })
  async findOne(@Param('id') id: number) {
    return this.cityService.findOne(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update city' })
  @ApiParam({ name: 'id', description: 'City ID' })
  async update(@Param('id') id: number, @Body() dto: UpdateCityDto) {
    return this.cityService.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete city' })
  @ApiParam({ name: 'id', description: 'City ID' })
  async remove(@Param('id') id: number) {
    await this.cityService.remove(Number(id));
    return { success: true };
  }
}

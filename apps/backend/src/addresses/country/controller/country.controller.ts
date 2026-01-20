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
import { CountryService } from '../service/country.service';
import { CreateCountryDto } from '../dto/create-country.dto';
import { UpdateCountryDto } from '../dto/update-country.dto';

@ApiTags('Admin Country')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a country' })
  async create(@Body() dto: CreateCountryDto) {
    return this.countryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all countries' })
  async findAll() {
    return this.countryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  async findOne(@Param('id') id: number) {
    return this.countryService.findOne(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update country' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  async update(@Param('id') id: number, @Body() dto: UpdateCountryDto) {
    return this.countryService.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete country' })
  @ApiParam({ name: 'id', description: 'Country ID' })
  async remove(@Param('id') id: number) {
    await this.countryService.remove(Number(id));
    return { success: true };
  }
}

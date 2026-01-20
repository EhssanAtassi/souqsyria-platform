import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ManufacturersService } from './manufacturers.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';

@ApiTags('Admin Manufacturers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/manufacturers')
export class ManufacturersController {
  constructor(private readonly manufacturersService: ManufacturersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new manufacturer' })
  async create(@Body() createDto: CreateManufacturerDto) {
    return this.manufacturersService.create(createDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all manufacturers' })
  async findAll() {
    return this.manufacturersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get manufacturer by ID' })
  async findOne(@Param('id') id: number) {
    return this.manufacturersService.findOne(+id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update manufacturer by ID' })
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateManufacturerDto,
  ) {
    return this.manufacturersService.update(+id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete manufacturer by ID' })
  async remove(@Param('id') id: number) {
    return this.manufacturersService.remove(+id);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminProductsService } from './admin-products.service';
import { GetProductsDto } from './dto/get-products.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { BulkProductStatusDto } from './dto/bulk-status.dto';
import { ToggleProductStatusDto } from './dto/toggle-status.dto';

@ApiTags('Admin Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin listing of products (paginated + filters)' })
  async list(@Query() filters: GetProductsDto) {
    return this.adminProductsService.findAllPaginated(filters);
  }
  @Post('bulk-status')
  @ApiOperation({ summary: 'Bulk toggle status fields for multiple products' })
  async bulkToggle(@Body() dto: BulkProductStatusDto) {
    return this.adminProductsService.bulkToggleStatus(dto);
  }
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Toggle status fields (active/published) for a product',
  })
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleProductStatusDto,
  ) {
    return this.adminProductsService.toggleStatus(id, dto);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get full admin view of a single product' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminProductsService.getFullAdminView(id);
  }
}

/**
 * @file products.controller.ts
 * @description Handles admin + vendor product CRUD with PermissionsGuard.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Logger,
  Patch,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

@ApiTags('Admin Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product (requires: manage_products)' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: { uid: string; vendorId?: number },
  ) {
    return this.productsService.create(dto, user.vendorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (requires: view_products)' })
  async findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (requires: view_products)' })
  async findOne(@Param('id') id: number) {
    return this.productsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product (requires: manage_products)' })
  async update(@Param('id') id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(+id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a product (archive it)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`DELETE /products/${id}`);
    return this.productsService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update product status (active, published)' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductStatusDto,
  ) {
    return this.productsService.updateStatus(id, dto);
  }
}

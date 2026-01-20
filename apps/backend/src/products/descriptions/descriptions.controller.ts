/**
 * @file descriptions.controller.ts
 * @description Manages admin-level operations on product descriptions (multi-language)
 */

import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DescriptionsService } from './descriptions.service';
import { CreateProductDescriptionDto } from './dto/create-product-description.dto';
import { UpdateProductDescriptionDto } from './dto/update-product-description.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';

@ApiTags('Product Descriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products/:productId/descriptions')
export class DescriptionsController {
  private readonly logger = new Logger(DescriptionsController.name);

  constructor(private readonly service: DescriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a product description (e.g., ar or en)' })
  @ApiParam({ name: 'productId', type: Number })
  @ApiBody({ type: CreateProductDescriptionDto })
  async create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductDescriptionDto,
  ) {
    this.logger.log(`POST /products/${productId}/descriptions`);
    return this.service.create(productId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a product description (by ID)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductDescriptionDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDescriptionDto,
  ) {
    this.logger.log(`PUT /descriptions/${id}`);
    return this.service.update(id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all descriptions for a product (ar + en)' })
  @ApiParam({ name: 'productId', type: Number })
  async findAll(@Param('productId', ParseIntPipe) productId: number) {
    this.logger.log(`GET /products/${productId}/descriptions`);
    return this.service.findByProduct(productId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a description (by ID)' })
  @ApiParam({ name: 'id', type: Number })
  async delete(@Param('id', ParseIntPipe) id: number) {
    this.logger.warn(`DELETE /descriptions/${id}`);
    return this.service.delete(id);
  }
}

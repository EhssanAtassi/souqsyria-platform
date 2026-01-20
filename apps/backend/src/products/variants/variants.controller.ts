/**
 * @file variants.controller.ts
 * @description Admin endpoints for managing product variants (CRUD).
 */

import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Patch,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VariantsService } from './variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { AdjustStockDto } from './dto/adjust-stokc.dto';
import { StockService } from '../../stock/stock.service';
import { GetProductVariantsDto } from './dto/get-variants.dto';

@ApiTags('Product Variants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products/:productId/variants')
export class VariantsController {
  constructor(
    private readonly service: VariantsService,
    private readonly stockService: StockService,
  ) {}

  /**
   * POST /admin/products/:productId/variants
   * Create a new variant for a product
   */
  @Post()
  @ApiOperation({ summary: 'Add a new variant to a product' })
  create(
    @Param('productId') productId: number,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.service.create(+productId, dto);
  }

  /**
   * PUT /admin/products/:productId/variants/:id
   * Update a variant by ID
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a specific product variant' })
  update(@Param('id') id: number, @Body() dto: UpdateProductVariantDto) {
    return this.service.update(+id, dto);
  }

  /**
   * GET /admin/products/:productId/variants
   * List all variants for a product
   */
  @Get()
  @ApiOperation({ summary: 'List all variants of a product' })
  findAll(
    @Param('productId') productId: number,
    @Query() filters: GetProductVariantsDto, // ✅ Accept filters via query params
  ) {
    return this.service.findByProduct(+productId, filters); // ✅ Pass both args
  }

  /**
   * DELETE /admin/products/:productId/variants/:id
   * Delete a variant by ID
   */
  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a specific product variant' })
  // delete(@Param('id') id: number) {
  //   return this.service.delete(+id);
  // }

  /**
   * PATCH /admin/products/:productId/variants/:id/stock
   * Adjust stock for a specific variant in a specific warehouse
   */
  @Patch(':id/stock')
  @ApiOperation({ summary: 'Adjust stock of a variant in a warehouse' })
  async adjustStock(@Param('id') id: number, @Body() dto: AdjustStockDto) {
    return this.stockService.adjustStock(
      +id,
      dto.warehouseId,
      dto.quantity,
      dto.type,
      dto.note,
    );
  }

  /**
   * @route DELETE /admin/products/:productId/variants/:id
   * @description Soft-deletes (deactivates) a variant from being purchasable.
   * Keeps historical records intact.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a product variant (soft delete)' })
  async deleteVariant(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

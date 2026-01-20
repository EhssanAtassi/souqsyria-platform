/**
 * @file pricing.controller.ts
 * @description Admin API endpoints for managing product pricing.
 */

import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../access-control/guards/permissions.guard';
import { PricingService } from '../service/pricing.service';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';

@ApiTags('Product Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/products/:productId/pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  /**
   * Create a pricing entry for a product
   */
  @Post()
  @ApiOperation({ summary: 'Set product price + commission' })
  create(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateProductPriceDto,
  ) {
    return this.service.create(productId, dto);
  }

  /**
   * Update existing price entry
   */
  @Patch()
  @ApiOperation({ summary: 'Update product price or commission' })
  update(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdateProductPriceDto,
  ) {
    return this.service.update(productId, dto);
  }

  /**
   * Get product pricing info
   */
  @Get()
  @ApiOperation({ summary: 'Get product price + vendor payout info' })
  async get(@Param('productId', ParseIntPipe) productId: number) {
    const data = await this.service.getByProduct(productId);
    if (!data) throw new NotFoundException('Price not set for this product');
    return data;
  }
}

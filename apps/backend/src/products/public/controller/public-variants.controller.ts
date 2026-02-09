/**
 * @file public-variants.controller.ts
 * @description Public API endpoints for product variants.
 * No authentication required — serves the storefront product detail page.
 *
 * @swagger
 * tags:
 *   - name: Public Products
 *     description: Public variant endpoints for product detail page
 */
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { PublicVariantsService } from '../service/public-variants.service';

@ApiTags('🛒 Public Products')
@Controller('products/:productId/variants')
export class PublicVariantsController {
  constructor(private readonly service: PublicVariantsService) {}

  /**
   * GET /products/:productId/variants
   * Returns active variants for a product with stock status and pricing
   */
  @Get()
  @ApiOperation({
    summary: 'Get active variants for a product',
    description:
      'Returns all active variants for a product sorted by price, with computed stock status (in_stock >5, low_stock 1-5, out_of_stock 0)',
  })
  @ApiParam({
    name: 'productId',
    type: 'number',
    description: 'Product ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Active variants retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 201,
            sku: 'SGS24-128GB-BLACK',
            name: 'Black / 128GB',
            price: 2750000,
            stockQuantity: 25,
            stockStatus: 'in_stock',
            imageUrl: 'https://example.com/variant-black.jpg',
            variantData: { Color: 'Black', Storage: '128GB' },
          },
        ],
      },
    },
  })
  async getActiveVariants(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const data = await this.service.getActiveVariants(productId);
    return { data };
  }

  /**
   * GET /products/:productId/variants/options
   * Returns option groups enriched with Arabic names and color hex codes
   *
   * NOTE: This must be defined BEFORE any parameterized sub-routes
   */
  @Get('options')
  @ApiOperation({
    summary: 'Get variant option groups for a product',
    description:
      'Collects unique option keys from active variants, enriched with Attribute metadata (Arabic name, type, colorHex)',
  })
  @ApiParam({
    name: 'productId',
    type: 'number',
    description: 'Product ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Variant option groups retrieved successfully',
    schema: {
      example: {
        data: [
          {
            optionName: 'Color',
            optionNameAr: 'اللون',
            type: 'color',
            values: [
              { value: 'Red', valueAr: 'أحمر', colorHex: '#FF0000', displayOrder: 1 },
              { value: 'Blue', valueAr: 'أزرق', colorHex: '#0000FF', displayOrder: 2 },
            ],
          },
          {
            optionName: 'Storage',
            optionNameAr: 'التخزين',
            type: 'select',
            values: [
              { value: '128GB', valueAr: '128 جيجابايت', colorHex: null, displayOrder: 1 },
              { value: '256GB', valueAr: '256 جيجابايت', colorHex: null, displayOrder: 2 },
            ],
          },
        ],
      },
    },
  })
  async getVariantOptions(
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    const data = await this.service.getVariantOptions(productId);
    return { data };
  }
}

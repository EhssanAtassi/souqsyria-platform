/**
 * @file product-carousels.controller.ts
 * @description REST API controller for product carousels management
 *
 * PUBLIC ENDPOINTS:
 * - GET /product-carousels - Get active carousels with products (for homepage)
 * - GET /product-carousels/:id - Get single carousel with products
 *
 * ADMIN ENDPOINTS (JWT Protected):
 * - POST /product-carousels - Create new carousel
 * - PATCH /product-carousels/:id - Update carousel
 * - DELETE /product-carousels/:id - Soft delete carousel
 * - POST /product-carousels/:id/products - Add product to custom carousel
 * - DELETE /product-carousels/:id/products/:productId - Remove product from carousel
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ProductCarouselsService } from '../services/product-carousels.service';
import { CreateProductCarouselDto } from '../dto/create-product-carousel.dto';
import { UpdateProductCarouselDto } from '../dto/update-product-carousel.dto';
import { CarouselType } from '../entities/product-carousel.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Product Carousels Controller
 *
 * Provides REST API endpoints for managing dynamic product carousels
 * on the SouqSyria homepage with bilingual support.
 */
@ApiTags('Product Carousels')
@Controller('product-carousels')
export class ProductCarouselsController {
  constructor(private readonly carouselsService: ProductCarouselsService) {}

  // ================================
  // PUBLIC ENDPOINTS
  // ================================

  /**
   * Get active product carousels with populated products
   *
   * Used by homepage to display dynamic product sections.
   * Returns carousels sorted by display order with their products.
   *
   * @param types - Optional array of carousel types to filter
   * @param limit - Maximum number of carousels to return (default: 10)
   * @returns Array of carousels with products
   */
  @Get()
  @ApiOperation({
    summary: 'Get active product carousels',
    description:
      'Retrieve active product carousels with populated products for homepage display. ' +
      'Products are dynamically populated based on carousel type (new_arrivals, best_sellers, etc.).',
  })
  @ApiQuery({
    name: 'types',
    required: false,
    type: [String],
    enum: CarouselType,
    description: 'Filter by carousel types (can specify multiple)',
    example: 'new_arrivals,best_sellers',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of carousels to return',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Active carousels with products returned successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
          type: { type: 'string', enum: Object.values(CarouselType) },
          titleEn: { type: 'string', example: 'New Arrivals' },
          titleAr: { type: 'string', example: 'الوافدون الجدد' },
          displayOrder: { type: 'number', example: 0 },
          products: {
            type: 'array',
            description: 'Populated products based on carousel type',
          },
        },
      },
    },
  })
  async findActive(
    @Query('types') types?: string,
    @Query('limit') limit: number = 10,
  ) {
    const typeArray = types
      ? types.split(',').filter((t) => Object.values(CarouselType).includes(t as CarouselType))
      : undefined;

    return this.carouselsService.findActiveWithProducts({
      types: typeArray as CarouselType[],
      limit: Math.min(limit, 20), // Enforce maximum limit
    });
  }

  /**
   * Get single carousel by ID with populated products
   *
   * @param id - Carousel UUID
   * @returns Carousel with products
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get carousel by ID',
    description: 'Retrieve a single product carousel with populated products.',
  })
  @ApiParam({
    name: 'id',
    description: 'Carousel UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Carousel with products returned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Carousel not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.carouselsService.getPopulatedCarousel(id);
  }

  // ================================
  // ADMIN ENDPOINTS (JWT Protected)
  // ================================

  /**
   * Create a new product carousel
   *
   * Admin only endpoint for creating new carousels.
   *
   * @param createDto - Carousel configuration
   * @returns Created carousel
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create product carousel (Admin)',
    description:
      'Create a new product carousel. Requires admin authentication. ' +
      'Supports both dynamic (auto-populated) and custom (manual) carousel types.',
  })
  @ApiBody({ type: CreateProductCarouselDto })
  @ApiResponse({
    status: 201,
    description: 'Carousel created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async create(@Body() createDto: CreateProductCarouselDto) {
    return this.carouselsService.create(createDto);
  }

  /**
   * Update an existing carousel
   *
   * Admin only endpoint for updating carousel configuration.
   *
   * @param id - Carousel UUID
   * @param updateDto - Fields to update
   * @returns Updated carousel
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update product carousel (Admin)',
    description: 'Update carousel configuration. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Carousel UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateProductCarouselDto })
  @ApiResponse({
    status: 200,
    description: 'Carousel updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 404,
    description: 'Carousel not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductCarouselDto,
  ) {
    return this.carouselsService.update(id, updateDto);
  }

  /**
   * Soft delete a carousel
   *
   * Admin only endpoint for removing carousels.
   *
   * @param id - Carousel UUID
   * @returns Success message
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product carousel (Admin)',
    description: 'Soft delete a carousel. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Carousel UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Carousel deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Carousel not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.carouselsService.remove(id);
  }

  /**
   * Add product to custom carousel
   *
   * Admin only endpoint for manually adding products to custom carousels.
   *
   * @param id - Carousel UUID
   * @param body - Product ID and display order
   * @returns Created carousel item
   */
  @Post(':id/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add product to custom carousel (Admin)',
    description:
      'Manually add a product to a custom carousel. ' +
      'Only works for carousels with type="custom". Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Carousel UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['productId'],
      properties: {
        productId: {
          type: 'number',
          description: 'Product ID to add',
          example: 123,
        },
        displayOrder: {
          type: 'number',
          description: 'Display position (0-based)',
          example: 0,
          default: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product added to carousel successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot add products to non-custom carousels',
  })
  @ApiResponse({
    status: 404,
    description: 'Carousel or product not found',
  })
  async addProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { productId: number; displayOrder?: number },
  ) {
    return this.carouselsService.addProductToCarousel(
      id,
      body.productId,
      body.displayOrder ?? 0,
    );
  }

  /**
   * Remove product from custom carousel
   *
   * Admin only endpoint for removing products from custom carousels.
   *
   * @param id - Carousel UUID
   * @param productId - Product ID
   * @returns Success message
   */
  @Delete(':id/products/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove product from custom carousel (Admin)',
    description: 'Remove a product from a custom carousel. Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Carousel UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID to remove',
    example: 123,
  })
  @ApiResponse({
    status: 204,
    description: 'Product removed from carousel successfully',
  })
  async removeProduct(
    @Param('id', ParseIntPipe) id: number,
    @Param('productId') productId: number,
  ) {
    await this.carouselsService.removeProductFromCarousel(id, productId);
  }
}

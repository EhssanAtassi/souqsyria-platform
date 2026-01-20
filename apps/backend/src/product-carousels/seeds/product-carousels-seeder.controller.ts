/**
 * @file product-carousels-seeder.controller.ts
 * @description HTTP endpoints for seeding product carousels
 *
 * ENDPOINTS:
 * - POST /product-carousels/seed - Seed carousels
 * - POST /product-carousels/seed/clean - Clean and reseed
 * - GET /product-carousels/seed/stats - Get seeding statistics
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductCarouselsSeederService } from './product-carousels-seeder.service';

/**
 * Product Carousels Seeder Controller
 *
 * Provides HTTP endpoints for seeding test data.
 */
@ApiTags('Product Carousels - Seeding')
@Controller('product-carousels/seed')
export class ProductCarouselsSeederController {
  constructor(
    private readonly seederService: ProductCarouselsSeederService,
  ) {}

  /**
   * Seed product carousels
   *
   * Creates 4 carousels with Syrian market themes.
   *
   * @returns Seeding result
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed product carousels',
    description:
      'Create 4 product carousels with Syrian market themes: ' +
      'New Arrivals, Best Sellers, Trending Now, and Artisan Picks.',
  })
  @ApiResponse({
    status: 201,
    description: 'Carousels seeded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully seeded 4 product carousels' },
        carouselsCreated: { type: 'number', example: 4 },
      },
    },
  })
  async seed() {
    return this.seederService.seed();
  }

  /**
   * Clean and reseed carousels
   *
   * Deletes all existing carousels and creates fresh seed data.
   *
   * @returns Seeding result
   */
  @Post('clean')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clean and reseed product carousels',
    description: 'Delete all existing carousels and create fresh seed data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Carousels cleaned and reseeded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Deleted 4 carousels and Successfully seeded 4 product carousels' },
        carouselsDeleted: { type: 'number', example: 4 },
        carouselsCreated: { type: 'number', example: 4 },
      },
    },
  })
  async cleanAndSeed() {
    return this.seederService.cleanAndSeed();
  }

  /**
   * Get seeding statistics
   *
   * @returns Current carousel counts
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get seeding statistics',
    description: 'Get current product carousel counts by type.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics returned successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 4 },
        active: { type: 'number', example: 4 },
        byType: {
          type: 'object',
          properties: {
            new_arrivals: { type: 'number', example: 1 },
            best_sellers: { type: 'number', example: 1 },
            trending: { type: 'number', example: 1 },
            custom: { type: 'number', example: 1 },
          },
        },
      },
    },
  })
  async getStats() {
    return this.seederService.getStats();
  }
}

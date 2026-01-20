/**
 * @file featured-categories-seeder.controller.ts
 * @description HTTP endpoints for seeding featured categories
 *
 * ENDPOINTS:
 * - POST /featured-categories/seed - Seed featured categories
 * - POST /featured-categories/seed/clean - Clean and reseed
 * - GET /featured-categories/seed/stats - Get seeding statistics
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeaturedCategoriesSeederService } from './featured-categories-seeder.service';

/**
 * Featured Categories Seeder Controller
 *
 * Provides HTTP endpoints for seeding test data.
 */
@ApiTags('Featured Categories - Seeding')
@Controller('featured-categories/seed')
export class FeaturedCategoriesSeederController {
  constructor(
    private readonly seederService: FeaturedCategoriesSeederService,
  ) {}

  /**
   * Seed featured categories
   *
   * Creates featured categories for the first 12 active approved categories.
   *
   * @returns Seeding result
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Seed featured categories',
    description:
      'Create featured categories for the first 12 active approved categories. ' +
      'Requires existing categories to be present in the database.',
  })
  @ApiResponse({
    status: 201,
    description: 'Featured categories seeded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully seeded 12 featured categories' },
        featuredCategoriesCreated: { type: 'number', example: 12 },
      },
    },
  })
  async seed() {
    return this.seederService.seed();
  }

  /**
   * Clean and reseed featured categories
   *
   * Deletes all existing featured categories and creates fresh seed data.
   *
   * @returns Seeding result
   */
  @Post('clean')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clean and reseed featured categories',
    description: 'Delete all existing featured categories and create fresh seed data.',
  })
  @ApiResponse({
    status: 200,
    description: 'Featured categories cleaned and reseeded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Deleted 12 featured categories and Successfully seeded 12 featured categories' },
        featuredCategoriesDeleted: { type: 'number', example: 12 },
        featuredCategoriesCreated: { type: 'number', example: 12 },
      },
    },
  })
  async cleanAndSeed() {
    return this.seederService.cleanAndSeed();
  }

  /**
   * Get seeding statistics
   *
   * @returns Current featured category counts
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get seeding statistics',
    description: 'Get current featured category counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics returned successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 12 },
        active: { type: 'number', example: 12 },
        withSchedule: { type: 'number', example: 0 },
      },
    },
  })
  async getStats() {
    return this.seederService.getStats();
  }
}

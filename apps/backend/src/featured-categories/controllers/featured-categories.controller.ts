/**
 * @file featured-categories.controller.ts
 * @description Controller for featured categories endpoints
 *
 * ENDPOINTS:
 * - Public:
 *   - GET /featured-categories - Get active featured categories
 * - Admin (JWT protected):
 *   - POST /admin/featured-categories - Create featured category
 *   - PATCH /admin/featured-categories/:id - Update featured category
 *   - DELETE /admin/featured-categories/:id - Delete featured category
 *
 * @swagger
 * tags:
 *   - name: Featured Categories
 *     description: Featured categories management for homepage
 *
 * @author SouqSyria Development Team
 * @since 2025-11-10
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeaturedCategoriesService } from '../services/featured-categories.service';
import { CreateFeaturedCategoryDto } from '../dto/create-featured-category.dto';
import { UpdateFeaturedCategoryDto } from '../dto/update-featured-category.dto';
import { FeaturedCategory } from '../entities/featured-category.entity';

/**
 * Featured Categories Controller
 *
 * Handles HTTP requests for featured category management with public
 * and admin endpoints. Supports Syrian market requirements with bilingual
 * content and cultural event scheduling.
 */
@ApiTags('Featured Categories')
@Controller()
export class FeaturedCategoriesController {
  constructor(private readonly featuredCategoriesService: FeaturedCategoriesService) {}

  // ================================
  // PUBLIC ENDPOINTS
  // ================================

  /**
   * Get active featured categories for homepage
   *
   * Returns categories that are:
   * - Currently active (isActive = true)
   * - Within scheduled date range
   * - Associated with active and approved categories
   * - Sorted by displayOrder ascending
   *
   * Syrian Market Features:
   * - Supports Arabic and English content
   * - Includes promotional badges for cultural events
   * - Flexible scheduling for Ramadan, Eid, etc.
   *
   * @param limit - Maximum number of categories to return (default: 12, max: 20)
   * @returns Array of active featured categories with category details
   */
  @Get('featured-categories')
  @ApiOperation({
    summary: 'Get active featured categories',
    description:
      'Returns active featured categories for homepage display, sorted by display order. ' +
      'Supports Syrian market with bilingual content and cultural event scheduling. ' +
      'Maximum 12 categories by default, up to 20 maximum.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of categories to return',
    required: false,
    type: Number,
    example: 12,
  })
  @ApiResponse({
    status: 200,
    description: 'List of active featured categories',
    type: [FeaturedCategory],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async findActive(
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
  ): Promise<{ data: FeaturedCategory[]; total: number }> {
    // Enforce limits
    const validLimit = Math.min(Math.max(limit, 4), 20);

    const data = await this.featuredCategoriesService.findActive(validLimit);

    return {
      data,
      total: data.length,
    };
  }

  // ================================
  // ADMIN ENDPOINTS (JWT PROTECTED)
  // ================================

  /**
   * Create a new featured category
   *
   * Admin endpoint to add a category to the homepage featured section.
   * Validates category existence, approval status, and business rules.
   *
   * Syrian Market Features:
   * - Bilingual badge text (Arabic/English)
   * - Promotional text for cultural events
   * - Flexible scheduling for seasonal campaigns
   *
   * @param createDto - DTO with featured category data
   * @returns Created featured category with relations
   */
  @Post('admin/featured-categories')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create featured category',
    description:
      'Admin endpoint to add a category to homepage featured section. ' +
      'Validates category existence and enforces maximum of 12 active featured categories. ' +
      'Supports bilingual content and cultural event scheduling for Syrian market.',
  })
  @ApiResponse({
    status: 201,
    description: 'Featured category created successfully',
    type: FeaturedCategory,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or business rule violation',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Maximum active featured categories reached (12)',
  })
  async create(@Body() createDto: CreateFeaturedCategoryDto): Promise<FeaturedCategory> {
    return this.featuredCategoriesService.create(createDto);
  }

  /**
   * Get all featured categories (admin view)
   *
   * Returns all featured categories including inactive and scheduled ones.
   *
   * @param limit - Maximum number of results
   * @returns Array of all featured categories
   */
  @Get('admin/featured-categories')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all featured categories (admin)',
    description:
      'Admin endpoint to view all featured categories including inactive and scheduled. ' +
      'Useful for management dashboard and planning cultural campaigns.',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of all featured categories',
    type: [FeaturedCategory],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<{ data: FeaturedCategory[]; total: number }> {
    const data = await this.featuredCategoriesService.findAll(limit);

    return {
      data,
      total: data.length,
    };
  }

  /**
   * Get a single featured category by ID
   *
   * @param id - Featured category UUID
   * @returns Featured category with relations
   */
  @Get('admin/featured-categories/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get featured category by ID',
    description: 'Admin endpoint to retrieve a specific featured category with full details.',
  })
  @ApiParam({
    name: 'id',
    description: 'Featured category UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Featured category details',
    type: FeaturedCategory,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Featured category not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<FeaturedCategory> {
    return this.featuredCategoriesService.findOne(id);
  }

  /**
   * Update a featured category
   *
   * Admin endpoint to modify an existing featured category.
   * All fields are optional (partial update).
   *
   * @param id - Featured category UUID
   * @param updateDto - DTO with fields to update
   * @returns Updated featured category
   */
  @Patch('admin/featured-categories/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update featured category',
    description:
      'Admin endpoint to update an existing featured category. ' +
      'All fields are optional. Useful for adjusting campaigns, badges, and scheduling.',
  })
  @ApiParam({
    name: 'id',
    description: 'Featured category UUID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Featured category updated successfully',
    type: FeaturedCategory,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Featured category or new category not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFeaturedCategoryDto,
  ): Promise<FeaturedCategory> {
    return this.featuredCategoriesService.update(id, updateDto);
  }

  /**
   * Delete a featured category (soft delete)
   *
   * @param id - Featured category UUID
   * @returns void
   */
  @Delete('admin/featured-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete featured category',
    description:
      'Admin endpoint to soft delete a featured category. ' +
      'Category will be removed from homepage but can be restored.',
  })
  @ApiParam({
    name: 'id',
    description: 'Featured category UUID',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Featured category deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Featured category not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.featuredCategoriesService.remove(id);
  }

  /**
   * Get featured categories needing admin attention
   *
   * Returns categories that are expiring soon or have issues.
   *
   * @returns Array of featured categories needing attention
   */
  @Get('admin/featured-categories/alerts/attention')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get featured categories needing attention',
    description:
      'Admin endpoint to view featured categories that need attention ' +
      '(expiring soon, expired but active, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of featured categories needing attention',
    type: [FeaturedCategory],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getNeedingAttention(): Promise<{
    data: FeaturedCategory[];
    total: number;
  }> {
    const data = await this.featuredCategoriesService.getNeedingAttention();

    return {
      data,
      total: data.length,
    };
  }
}

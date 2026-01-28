/**
 * @file feature-flags.controller.ts
 * @description REST API controller for feature flags management.
 *              Provides endpoints for CRUD and feature toggle operations.
 * @module SystemSettings/Controllers
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { FeatureFlagsService } from '../services/feature-flags.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  FeatureFlagsFilterDto,
  CheckFeatureFlagDto,
  FeatureFlagCheckResponseDto,
} from '../dto/settings.dto';
import {
  FeatureFlag,
  FeatureFlagCategory,
  FeatureFlagEnvironment,
} from '../entities/feature-flag.entity';

/**
 * Feature Flags Controller
 *
 * @description Handles HTTP requests for feature flag management.
 *              Supports feature toggles, rollouts, and environment targeting.
 *
 * @example
 * GET /api/system-settings/feature-flags
 * GET /api/system-settings/feature-flags/grouped
 * GET /api/system-settings/feature-flags/:id
 * POST /api/system-settings/feature-flags
 * POST /api/system-settings/feature-flags/check
 * PUT /api/system-settings/feature-flags/:id
 * PUT /api/system-settings/feature-flags/:key/toggle
 * PUT /api/system-settings/feature-flags/:key/rollout
 * DELETE /api/system-settings/feature-flags/:id
 */
@ApiTags('Feature Flags')
@ApiBearerAuth()
@Controller('system-settings/feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  // ===========================================================================
  // READ ENDPOINTS
  // ===========================================================================

  /**
   * Get all feature flags
   */
  @Get()
  @ApiOperation({
    summary: 'Get all feature flags',
    description: 'Retrieves all feature flags with optional filtering by category, status, or environment.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: FeatureFlagCategory,
    description: 'Filter by flag category',
  })
  @ApiQuery({
    name: 'enabled',
    required: false,
    type: Boolean,
    description: 'Filter by enabled status',
  })
  @ApiQuery({
    name: 'environment',
    required: false,
    enum: FeatureFlagEnvironment,
    description: 'Filter by target environment',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by key or name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of feature flags',
    type: [FeatureFlag],
  })
  async findAll(@Query() filter: FeatureFlagsFilterDto): Promise<FeatureFlag[]> {
    return this.featureFlagsService.findAll(filter);
  }

  /**
   * Get feature flags grouped by category
   */
  @Get('grouped')
  @ApiOperation({
    summary: 'Get flags grouped by category',
    description: 'Retrieves all feature flags organized by their category.',
  })
  @ApiResponse({
    status: 200,
    description: 'Flags grouped by category',
  })
  async findAllByCategory(): Promise<Record<FeatureFlagCategory, FeatureFlag[]>> {
    return this.featureFlagsService.findAllByCategory();
  }

  /**
   * Get a single feature flag by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get feature flag by ID',
    description: 'Retrieves a single feature flag by its unique ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Feature flag UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'The feature flag',
    type: FeatureFlag,
  })
  @ApiResponse({
    status: 404,
    description: 'Feature flag not found',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FeatureFlag> {
    return this.featureFlagsService.findById(id);
  }

  /**
   * Get feature flag by key
   */
  @Get('key/:key')
  @ApiOperation({
    summary: 'Get feature flag by key',
    description: 'Retrieves a feature flag by its unique key identifier.',
  })
  @ApiParam({
    name: 'key',
    description: 'Feature flag key',
    example: 'enable_dark_mode',
  })
  @ApiResponse({
    status: 200,
    description: 'The feature flag',
    type: FeatureFlag,
  })
  @ApiResponse({
    status: 404,
    description: 'Feature flag not found',
  })
  async findByKey(@Param('key') key: string): Promise<FeatureFlag> {
    return this.featureFlagsService.findByKey(key);
  }

  // ===========================================================================
  // FEATURE CHECK ENDPOINTS
  // ===========================================================================

  /**
   * Check if a feature is enabled
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check feature flag status',
    description: 'Checks if a feature is enabled for a specific user/environment context.',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag status',
    type: FeatureFlagCheckResponseDto,
  })
  async checkFeature(@Body() dto: CheckFeatureFlagDto): Promise<{
    key: string;
    enabled: boolean;
    metadata?: Record<string, any>;
  }> {
    return this.featureFlagsService.checkFeature(dto);
  }

  /**
   * Check multiple features at once
   */
  @Post('check-multiple')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check multiple feature flags',
    description: 'Checks the status of multiple feature flags at once.',
  })
  @ApiResponse({
    status: 200,
    description: 'Map of feature keys to enabled status',
  })
  async checkMultiple(
    @Body() body: {
      keys: string[];
      userId?: string;
      environment?: FeatureFlagEnvironment;
    },
  ): Promise<Record<string, boolean>> {
    return this.featureFlagsService.checkMultiple(
      body.keys,
      body.userId,
      body.environment,
    );
  }

  // ===========================================================================
  // WRITE ENDPOINTS
  // ===========================================================================

  /**
   * Create a new feature flag
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new feature flag',
    description: 'Creates a new feature flag with the provided configuration.',
  })
  @ApiResponse({
    status: 201,
    description: 'Feature flag created successfully',
    type: FeatureFlag,
  })
  @ApiResponse({
    status: 409,
    description: 'Feature flag with this key already exists',
  })
  async create(@Body() dto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    return this.featureFlagsService.create(dto);
  }

  /**
   * Update an existing feature flag
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update feature flag',
    description: 'Updates an existing feature flag by ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Feature flag UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag updated successfully',
    type: FeatureFlag,
  })
  @ApiResponse({
    status: 404,
    description: 'Feature flag not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlag> {
    return this.featureFlagsService.update(id, dto);
  }

  /**
   * Toggle a feature flag on/off
   */
  @Put(':key/toggle')
  @ApiOperation({
    summary: 'Toggle feature flag',
    description: 'Quickly toggle a feature flag on or off by key.',
  })
  @ApiParam({
    name: 'key',
    description: 'Feature flag key',
    example: 'enable_dark_mode',
  })
  @ApiQuery({
    name: 'enabled',
    required: true,
    type: Boolean,
    description: 'New enabled state',
  })
  @ApiResponse({
    status: 200,
    description: 'Feature flag toggled successfully',
    type: FeatureFlag,
  })
  @ApiResponse({
    status: 404,
    description: 'Feature flag not found',
  })
  async toggle(
    @Param('key') key: string,
    @Query('enabled') enabled: string,
  ): Promise<FeatureFlag> {
    const enabledBool = enabled === 'true';
    return this.featureFlagsService.toggle(key, enabledBool);
  }

  /**
   * Update rollout percentage
   */
  @Put(':key/rollout')
  @ApiOperation({
    summary: 'Update rollout percentage',
    description: 'Updates the rollout percentage for gradual feature releases.',
  })
  @ApiParam({
    name: 'key',
    description: 'Feature flag key',
    example: 'ai_product_recommendations',
  })
  @ApiQuery({
    name: 'percentage',
    required: true,
    type: Number,
    description: 'New rollout percentage (0-100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Rollout percentage updated successfully',
    type: FeatureFlag,
  })
  @ApiResponse({
    status: 404,
    description: 'Feature flag not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid percentage value',
  })
  async updateRollout(
    @Param('key') key: string,
    @Query('percentage') percentage: string,
  ): Promise<FeatureFlag> {
    const percentageNum = parseInt(percentage, 10);
    return this.featureFlagsService.updateRollout(key, percentageNum);
  }

  /**
   * Delete a feature flag
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete feature flag',
    description: 'Permanently removes a feature flag.',
  })
  @ApiParam({
    name: 'id',
    description: 'Feature flag UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Feature flag deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Feature flag not found',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.featureFlagsService.delete(id);
  }

  // ===========================================================================
  // CACHE ENDPOINTS
  // ===========================================================================

  /**
   * Refresh feature flags cache
   */
  @Post('cache/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh flags cache',
    description: 'Forces a refresh of the feature flags cache.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache refreshed successfully',
  })
  async refreshCache(): Promise<{ message: string }> {
    await this.featureFlagsService.refreshCache();
    return { message: 'Feature flags cache refreshed' };
  }

  // ===========================================================================
  // SEED ENDPOINT (Development only)
  // ===========================================================================

  /**
   * Seed default feature flags
   */
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed default flags',
    description: 'Seeds the database with default feature flags. Use for development/initialization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default flags seeded successfully',
  })
  async seedDefaults(): Promise<{ message: string }> {
    await this.featureFlagsService.seedDefaults();
    return { message: 'Default feature flags seeded' };
  }
}

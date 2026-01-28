/**
 * @file settings.controller.ts
 * @description REST API controller for system settings management.
 *              Provides endpoints for CRUD operations on platform settings.
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { SettingsService } from '../services/settings.service';
import {
  CreateSettingDto,
  UpdateSettingDto,
  BulkUpdateSettingsDto,
  SettingsFilterDto,
} from '../dto/settings.dto';
import { SystemSetting, SettingCategory } from '../entities/system-setting.entity';

/**
 * Settings Controller
 *
 * @description Handles HTTP requests for system settings management.
 *              All endpoints require admin authentication.
 *
 * @example
 * GET /api/system-settings/settings
 * GET /api/system-settings/settings/grouped
 * GET /api/system-settings/settings/:key
 * POST /api/system-settings/settings
 * PUT /api/system-settings/settings/:key
 * PUT /api/system-settings/settings/bulk
 * DELETE /api/system-settings/settings/:key
 */
@ApiTags('System Settings')
@ApiBearerAuth()
@Controller('system-settings/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===========================================================================
  // READ ENDPOINTS
  // ===========================================================================

  /**
   * Get all system settings
   */
  @Get()
  @ApiOperation({
    summary: 'Get all system settings',
    description: 'Retrieves all system settings with optional filtering by category, status, or search term.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: SettingCategory,
    description: 'Filter by setting category',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by key or label',
  })
  @ApiResponse({
    status: 200,
    description: 'List of system settings',
    type: [SystemSetting],
  })
  async findAll(@Query() filter: SettingsFilterDto): Promise<SystemSetting[]> {
    return this.settingsService.findAll(filter);
  }

  /**
   * Get settings grouped by category
   */
  @Get('grouped')
  @ApiOperation({
    summary: 'Get settings grouped by category',
    description: 'Retrieves all active settings organized by their category.',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings grouped by category',
  })
  async findAllByCategory(): Promise<Record<SettingCategory, SystemSetting[]>> {
    return this.settingsService.findAllByCategory();
  }

  /**
   * Get a single setting by key
   */
  @Get(':key')
  @ApiOperation({
    summary: 'Get setting by key',
    description: 'Retrieves a single system setting by its unique key.',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique setting key',
    example: 'site_name',
  })
  @ApiResponse({
    status: 200,
    description: 'The system setting',
    type: SystemSetting,
  })
  @ApiResponse({
    status: 404,
    description: 'Setting not found',
  })
  async findByKey(@Param('key') key: string): Promise<SystemSetting> {
    return this.settingsService.findByKey(key);
  }

  /**
   * Get setting value only
   */
  @Get(':key/value')
  @ApiOperation({
    summary: 'Get setting value',
    description: 'Retrieves only the typed value of a system setting.',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique setting key',
    example: 'site_name',
  })
  @ApiResponse({
    status: 200,
    description: 'The setting value',
  })
  async getValue(@Param('key') key: string): Promise<any> {
    return this.settingsService.getValue(key);
  }

  // ===========================================================================
  // WRITE ENDPOINTS
  // ===========================================================================

  /**
   * Create a new setting
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new setting',
    description: 'Creates a new system setting with the provided data.',
  })
  @ApiResponse({
    status: 201,
    description: 'Setting created successfully',
    type: SystemSetting,
  })
  @ApiResponse({
    status: 409,
    description: 'Setting with this key already exists',
  })
  async create(@Body() dto: CreateSettingDto): Promise<SystemSetting> {
    return this.settingsService.create(dto);
  }

  /**
   * Update an existing setting
   */
  @Put(':key')
  @ApiOperation({
    summary: 'Update setting',
    description: 'Updates an existing system setting by key.',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique setting key',
    example: 'site_name',
  })
  @ApiResponse({
    status: 200,
    description: 'Setting updated successfully',
    type: SystemSetting,
  })
  @ApiResponse({
    status: 404,
    description: 'Setting not found',
  })
  async update(
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ): Promise<SystemSetting> {
    return this.settingsService.update(key, dto);
  }

  /**
   * Bulk update multiple settings
   */
  @Put('bulk/update')
  @ApiOperation({
    summary: 'Bulk update settings',
    description: 'Updates multiple settings at once. Only updates the value field.',
  })
  @ApiResponse({
    status: 200,
    description: 'Number of settings updated',
  })
  async bulkUpdate(@Body() dto: BulkUpdateSettingsDto): Promise<{ updated: number }> {
    const updated = await this.settingsService.bulkUpdate(dto);
    return { updated };
  }

  /**
   * Delete a setting
   */
  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete setting',
    description: 'Deletes a non-system setting by key.',
  })
  @ApiParam({
    name: 'key',
    description: 'Unique setting key',
    example: 'custom_setting',
  })
  @ApiResponse({
    status: 204,
    description: 'Setting deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Setting not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete system setting',
  })
  async delete(@Param('key') key: string): Promise<void> {
    await this.settingsService.delete(key);
  }

  // ===========================================================================
  // CACHE ENDPOINTS
  // ===========================================================================

  /**
   * Refresh settings cache
   */
  @Post('cache/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh settings cache',
    description: 'Forces a refresh of the settings cache.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache refreshed successfully',
  })
  async refreshCache(): Promise<{ message: string }> {
    await this.settingsService.refreshCache();
    return { message: 'Settings cache refreshed' };
  }
}

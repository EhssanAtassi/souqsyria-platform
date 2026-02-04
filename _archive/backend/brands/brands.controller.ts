/**
 * @file brands.controller.ts
 * @description Fixed REST API Controller for managing product brands (admin side).
 *
 * ✅ STEP 1 FIXES:
 * - Fixed method signatures to match service
 * - Added @CurrentUser() decorator
 * - Added proper parameter parsing
 * - Added query parameter support
 * - Added error handling
 * - Using PermissionsGuard instead of RolesGuard
 */
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { FilterBrandDto } from './dto/filter-brand.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../access-control/guards/permissions.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Admin Brands')
@ApiBearerAuth()
@Controller('admin/brands')
@UseGuards(JwtAuthGuard, PermissionsGuard) // ✅ Using your PermissionsGuard
export class BrandsController {
  private readonly logger = new Logger(BrandsController.name);

  constructor(private readonly brandsService: BrandsService) {}

  /**
   * ✅ FIXED CREATE: Now passes adminUser to service
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new brand',
    description: 'Create a new product brand with validation and audit trail',
  })
  @ApiResponse({
    status: 201,
    description: 'Brand created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or validation errors',
  })
  @ApiResponse({
    status: 409,
    description: 'Brand name or slug already exists',
  })
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @CurrentUser() adminUser: User, // ✅ Added current user
  ) {
    const startTime = Date.now();
    this.logger.log(
      `🆕 Creating brand: ${createBrandDto.name} by admin: ${adminUser.id}`,
    );

    try {
      const brand = await this.brandsService.create(createBrandDto, adminUser);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Brand created: ${brand.name} (ID: ${brand.id}) in ${processingTime}ms`,
      );
      return brand;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to create brand: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  /**
   * ✅ FIXED FIND ALL: Now supports filtering with query parameters
   */
  @Get()
  @ApiOperation({
    summary: 'List all brands with filtering',
    description:
      'Retrieve brands with search, filtering, pagination and sorting capabilities',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in brand names',
  })
  @ApiQuery({
    name: 'approvalStatus',
    required: false,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
  })
  @ApiQuery({ name: 'isActive', required: false, type: 'boolean' })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Brands retrieved successfully',
  })
  async findAll(@Query() filters: FilterBrandDto) {
    const startTime = Date.now();
    this.logger.log(
      `🔍 Listing brands with filters: ${JSON.stringify(filters)}`,
    );

    try {
      const result = await this.brandsService.findAll(filters);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Retrieved ${result.data.length}/${result.total} brands (page ${result.page}/${result.totalPages}) in ${processingTime}ms`,
      );

      return result;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to list brands: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  /**
   * ✅ FIXED FIND ONE: Now supports language preference and view tracking
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get brand by ID',
    description:
      'Retrieve detailed brand information with optional language preference',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Brand ID to retrieve',
    example: 1,
  })
  @ApiQuery({
    name: 'language',
    enum: ['en', 'ar'],
    required: false,
    description: 'Language preference for display',
    example: 'en',
  })
  @ApiQuery({
    name: 'includeProducts',
    type: 'boolean',
    required: false,
    description: 'Include product relationships',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Brand retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('includeProducts') includeProducts: boolean = false,
  ) {
    const startTime = Date.now();
    this.logger.log(`🔍 Retrieving brand ID: ${id} with language: ${language}`);

    try {
      const brand = await this.brandsService.findOne(
        id,
        language,
        true, // Track view
        includeProducts,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Retrieved brand: ${brand.displayName} (ID: ${id}) in ${processingTime}ms`,
      );
      return brand;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to retrieve brand ID: ${id}: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  /**
   * ✅ FIXED UPDATE: Now passes adminUser to service
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update brand by ID',
    description: 'Update brand information with validation and audit trail',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Brand ID to update',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Brand updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or business rule violation',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
    @CurrentUser() adminUser: User, // ✅ Added current user
  ) {
    const startTime = Date.now();
    this.logger.log(`🔄 Updating brand ID: ${id} by admin: ${adminUser.id}`);

    try {
      const updatedBrand = await this.brandsService.update(
        id,
        updateBrandDto,
        adminUser,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Brand updated: ${updatedBrand.displayName} (ID: ${id}) in ${processingTime}ms`,
      );
      return updatedBrand;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to update brand ID: ${id}: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  /**
   * ✅ FIXED DELETE: Uses simple method for now
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete brand by ID',
    description: 'Remove brand from system with proper validation',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Brand ID to delete',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Brand deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() adminUser: User,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`🗑️ Deleting brand ID: ${id} by admin: ${adminUser.id}`);

    try {
      await this.brandsService.remove(id);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ Brand deleted successfully (ID: ${id}) in ${processingTime}ms`,
      );
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to delete brand ID: ${id}: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }
}

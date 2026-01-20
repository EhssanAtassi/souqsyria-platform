/**
 * @file categories.controller.ts
 * @description REST API Controller for managing product categories (admin side).
 * Exposes endpoints for advanced category management including:
 * - Multilingual fields, icons, banners, SEO
 * - Parent/child hierarchy (category tree)
 * - Soft delete and restore
 * - isActive, isFeatured, and custom sort order
 * - All endpoints are admin-only and ACL protected
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Admin Categories')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Create a new category (admin only).
   * Supports multilingual, icons, banners, SEO, and parent/child hierarchy.
   * ACL: Admins only.
   */
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new category' })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.log('Creating new category');
    return this.categoriesService.create(createCategoryDto, adminUser);
  }

  /**
   * List all categories with parent/children (admin only).
   * Sorted by custom order and name.
   * ACL: Admins only.
   */
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all categories (admin tree view)' })
  findAll() {
    this.logger.log('Listing all categories');
    return this.categoriesService.findAll();
  }

  /**
   * Get category details by ID (admin only).
   * Includes parent and children relations.
   * ACL: Admins only.
   */
  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get category by ID (with hierarchy)' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id') id: number) {
    this.logger.log(`Fetching category by ID: ${id}`);
    return this.categoriesService.findOne(+id);
  }

  /**
   * Update a category by ID (admin only).
   * Allows updating all advanced fields (name, icon, banner, SEO, etc).
   * ACL: Admins only.
   */
  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', type: Number })
  update(
    @Param('id') id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() adminUser: User,
  ) {
    this.logger.log(`Updating category ID: ${id}`);
    return this.categoriesService.update(+id, updateCategoryDto, adminUser);
  }

  /**
   * Soft delete a category by ID (admin only).
   * The category will not be physically removed, but marked as deleted.
   * ACL: Admins only.
   */
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete category by ID' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id') id: number) {
    this.logger.log(`Soft deleting category ID: ${id}`);
    return this.categoriesService.remove(+id);
  }

  /**
   * Restore a soft-deleted category by ID (admin only).
   * Allows re-activating categories that were previously soft deleted.
   * ACL: Admins only.
   */
  @Patch(':id/restore')
  @Roles('admin')
  @ApiOperation({ summary: 'Restore a soft-deleted category by ID' })
  @ApiParam({ name: 'id', type: Number })
  restore(@Param('id') id: number, @CurrentUser() adminUser: User) {
    this.logger.log(`Restoring category ID: ${id}`);
    return this.categoriesService.restore(+id, adminUser);
  }
}

/**
 * @file categories-admin-basic.controller.ts
 * @description Admin Controller for Basic Category CRUD Operations
 *
 * RESPONSIBILITIES:
 * - Create, Read, Update, Delete categories
 * - Basic category management operations
 * - Input validation and business rule enforcement
 *
 * SCOPE:
 * - POST   /admin/categories            - Create category
 * - GET    /admin/categories            - List all categories
 * - GET    /admin/categories/:id        - Get category by ID
 * - PUT    /admin/categories/:id        - Update category
 * - DELETE /admin/categories/:id        - Soft delete category
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 * @version 2.0.0 - Refactored from monolithic admin controller
 */

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

// Import Guards and Decorators
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Import Services
import { CategoriesService } from '../services/categories.service';
import { CategorySearchService } from '../services/category-search.service';

// Import DTOs and Types
import {
  CategoryQueryDto,
  CategoryResponseDto,
  CreateCategoryDto,
  PaginatedCategoriesResponseDto,
  UpdateCategoryDto,
} from '../dto/index-dto';

// Import Entities
import { User } from '../../users/entities/user.entity';

/**
 * ADMIN CATEGORIES BASIC CONTROLLER
 *
 * Handles core CRUD operations for category management.
 * Focused on basic category operations with enterprise validation.
 *
 * Route Pattern: /api/admin/categories/*
 * Authentication: JWT + ACL Permissions
 * Audit: All operations logged with user tracking
 */
@ApiTags('Admin Categories - Basic Operations')
@ApiBearerAuth()
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesAdminBasicController {
  private readonly logger = new Logger(CategoriesAdminBasicController.name);

  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly categorySearchService: CategorySearchService,
  ) {
    this.logger.log('🏛️ Admin Categories Basic Controller initialized');
  }

  // ============================================================================
  // CREATE CATEGORY
  // ============================================================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('category.create')
  @ApiOperation({
    summary: 'Create new category',
    description: `
      Creates a new product category with comprehensive validation and enterprise features.
      
      Features:
      • Hierarchical structure with automatic depth calculation
      • Syrian market localization (Arabic/English names required)
      • SEO optimization with custom slugs and meta tags
      • Approval workflow integration (starts as 'draft')
      • Commission rate and pricing constraints
      • Comprehensive audit logging
      
      Business Rules:
      • Maximum hierarchy depth: 5 levels (0-4)
      • Arabic name mandatory for Syrian market compliance
      • Unique slug validation across all categories
      • Parent category must be approved and active
      • Commission rate between 0.5% and 15%
    `,
  })
  @ApiBody({
    type: CreateCategoryDto,
    description: 'Category creation data',
    examples: {
      'root-category': {
        summary: 'Root Category Example',
        description: 'Creating a top-level category',
        value: {
          nameEn: 'Electronics',
          nameAr: 'إلكترونيات',
          slug: 'electronics',
          descriptionEn: 'Electronic devices and gadgets',
          descriptionAr: 'أجهزة إلكترونية ومعدات ذكية',
          iconUrl: 'https://cdn.souqsyria.com/icons/electronics.svg',
          seoTitle: 'Electronics - Buy Online in Syria | SouqSyria',
          seoDescription: 'Shop electronics with fast delivery across Syria',
          commissionRate: 5.5,
          isActive: true,
          isFeatured: false,
        },
      },
      'child-category': {
        summary: 'Child Category Example',
        description: 'Creating a subcategory under Electronics',
        value: {
          nameEn: 'Smartphones',
          nameAr: 'الهواتف الذكية',
          slug: 'smartphones',
          parentId: 1,
          descriptionEn: 'Latest smartphones and mobile devices',
          descriptionAr: 'أحدث الهواتف الذكية والأجهزة المحمولة',
          commissionRate: 6.0,
          minPrice: 50000,
          maxPrice: 5000000,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or business rule violation',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Category slug or name already exists',
  })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() adminUser: User,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();
    const requestId = `create_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    this.logger.log(
      `🆕 [${requestId}] Creating category: "${createCategoryDto.nameEn}" by admin ${adminUser.id}`,
    );

    try {
      const newCategory = await this.categoriesService.create(
        createCategoryDto,
        adminUser,
      );
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [${requestId}] Category created successfully: ID ${newCategory.id} (${processingTime}ms)`,
      );

      return newCategory;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [${requestId}] Category creation failed: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  // ============================================================================
  // GET ALL CATEGORIES
  // ============================================================================

  @Get()
  @Permissions('category.read')
  @ApiOperation({
    summary: 'List all categories with filtering',
    description: `
      Retrieve categories with comprehensive admin features and filtering capabilities.
      
      Features:
      • Advanced search across names, descriptions, and slugs
      • Multi-criteria filtering (status, hierarchy, performance)
      • Pagination with metadata and performance metrics
      • Relationship loading (parent, children, creator info)
      • Syrian market specific filters
      • Real-time analytics and aggregations
    `,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for category names and descriptions',
    example: 'electronics',
  })
  @ApiQuery({
    name: 'approvalStatus',
    required: false,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'],
    description: 'Filter by approval status',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: 'boolean',
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    example: 1,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    example: 20,
    description: 'Items per page (max 100)',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: PaginatedCategoriesResponseDto,
  })
  async getAllCategories(
    @Query() queryDto: CategoryQueryDto,
  ): Promise<PaginatedCategoriesResponseDto> {
    const startTime = Date.now();
    const requestId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    this.logger.log(`📋 [${requestId}] Fetching categories with filters`);

    try {
      const result =
        await this.categorySearchService.searchCategories(queryDto);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [${requestId}] Retrieved ${result.data.length}/${result.total} categories (${processingTime}ms)`,
      );

      return result;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [${requestId}] Failed to retrieve categories: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  // ============================================================================
  // GET CATEGORY BY ID
  // ============================================================================

  @Get(':id')
  @Permissions('category.read')
  @ApiOperation({
    summary: 'Get category by ID with full details',
    description: `
      Retrieve comprehensive category information for admin management interface.
      
      Returns:
      • Complete category data with all fields
      • Parent and children relationships
      • Creator, updater, and approver information
      • Navigation breadcrumbs for hierarchy context
      • Performance metrics and analytics
      • Audit trail and change history
      • Multi-language content (Arabic/English)
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID to retrieve',
    example: 1,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    example: 'en',
    description: 'Language preference for localized content',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getCategoryById(
    @Param('id', ParseIntPipe) id: number,
    @Query('language') language: 'en' | 'ar' = 'en',
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();
    const requestId = `get_${id}_${Date.now()}`;

    this.logger.log(`🔍 [${requestId}] Retrieving category ID: ${id}`);

    try {
      const category = await this.categoriesService.findOne(id)!;

      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ [${requestId}] Category retrieved (${processingTime}ms)`,
      );

      // Transform to response DTO
      const response: CategoryResponseDto = {
        id: category.id,
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        name: category.getDisplayName(language),
        displayName: category.getDisplayName(language),
        slug: category.slug,
        descriptionEn: category.descriptionEn,
        descriptionAr: category.descriptionAr,
        displayDescription: category.getDisplayDescription(language),
        iconUrl: category.iconUrl,
        bannerUrl: category.bannerUrl,
        themeColor: category.themeColor,
        seoTitle: category.seoTitle,
        seoDescription: category.seoDescription,
        seoSlug: category.seoSlug,
        approvalStatus: category.approvalStatus,
        isActive: category.isActive,
        isFeatured: category.isFeatured,
        sortOrder: category.sortOrder,
        showInNav: category.showInNav,
        depthLevel: category.depthLevel,
        categoryPath: category.categoryPath,
        commissionRate: category.commissionRate,
        minPrice: category.minPrice,
        maxPrice: category.maxPrice,
        productCount: category.productCount,
        viewCount: category.viewCount,
        popularityScore: category.popularityScore,
        lastActivityAt: category.lastActivityAt,
        createdBy: category.createdBy,
        updatedBy: category.updatedBy,
        approvedBy: category.approvedBy,
        approvedAt: category.approvedAt,
        rejectionReason: category.rejectionReason,
        tenantId: category.tenantId,
        organizationId: category.organizationId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
        url: category.generateUrl(language),
        isPublic: category.isPublic(),
        canBeEdited: category.canBeEdited(),
        isRootCategory: category.isRootCategory(),
        hasChildren: category.hasChildren(),
        needsAdminAttention: category.needsAdminAttention(),
        parent: category.parent
          ? {
              id: category.parent.id,
              name: category.parent.getDisplayName(language),
              slug: category.parent.slug,
            }
          : undefined,
        children: category.children?.map((child) => ({
          id: child.id,
          name: child.getDisplayName(language),
          slug: child.slug,
          isActive: child.isActive,
          productCount: child.productCount,
        })),
      };

      return response;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [${requestId}] Failed to retrieve category: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  // ============================================================================
  // UPDATE CATEGORY
  // ============================================================================

  @Put(':id')
  @Permissions('category.update')
  @ApiOperation({
    summary: 'Update category by ID',
    description: `
      Update existing category with comprehensive validation and business rule enforcement.
      
      Features:
      • Full field update support with selective updates
      • Approval workflow state validation
      • Hierarchy change validation
      • Syrian market compliance checks
      • Automatic audit trail creation
      • Real-time cache invalidation
      
      Business Rules:
      • Draft and rejected categories can be fully edited
      • Approved categories require elevated permissions for core fields
      • Hierarchy changes must maintain tree integrity
      • SEO fields automatically updated if names change
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID to update',
    example: 1,
  })
  @ApiBody({
    type: UpdateCategoryDto,
    description: 'Category update data',
    examples: {
      'basic-update': {
        summary: 'Basic Information Update',
        value: {
          nameEn: 'Consumer Electronics',
          nameAr: 'الإلكترونيات الاستهلاكية',
          descriptionEn: 'Updated description for consumer electronics',
          descriptionAr: 'وصف محدث للإلكترونيات الاستهلاكية',
          iconUrl: 'https://cdn.souqsyria.com/icons/electronics-new.svg',
        },
      },
      'seo-update': {
        summary: 'SEO Optimization Update',
        value: {
          seoTitle: 'Consumer Electronics - Best Prices in Syria | SouqSyria',
          seoDescription:
            'Shop consumer electronics with best prices and fast delivery across Syria',
          seoSlug: 'الكترونيات-استهلاكية',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data or business rule violation',
  })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() adminUser: User,
  ): Promise<CategoryResponseDto> {
    const startTime = Date.now();
    const requestId = `update_${id}_${Date.now()}`;

    this.logger.log(
      `✏️ [${requestId}] Updating category ID: ${id} by admin ${adminUser.id}`,
    );

    try {
      const updatedCategory = await this.categoriesService.update(
        id,
        updateCategoryDto,
        adminUser,
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ [${requestId}] Category updated successfully (${processingTime}ms)`,
      );

      return updatedCategory;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [${requestId}] Category update failed: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }

  // ============================================================================
  // DELETE CATEGORY
  // ============================================================================

  @Delete(':id')
  @Permissions('category.delete')
  @ApiOperation({
    summary: 'Soft delete category by ID',
    description: `
      Soft delete a category with comprehensive validation and cascade handling.
      
      Features:
      • Soft delete with restore capability
      • Child category handling options
      • Product reassignment or validation
      • Approval workflow state validation
      • Comprehensive audit trail
      • Cache invalidation and cleanup
      
      Business Rules:
      • Cannot delete categories with active products (configurable)
      • Child categories can be moved to parent or deleted cascade
      • Approved categories require elevated permissions
      • Deletion creates audit trail with reason
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Category ID to delete',
    example: 1,
  })
  @ApiQuery({
    name: 'reason',
    required: false,
    description: 'Reason for deletion (recommended for audit)',
    example: 'Category no longer needed for Syrian market',
  })
  @ApiQuery({
    name: 'moveChildrenToParent',
    required: false,
    type: 'boolean',
    description: 'Move children to parent category instead of cascade delete',
    example: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Category deleted successfully' },
        deletedCategory: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            name: { type: 'string', example: 'Electronics' },
            deletedAt: { type: 'string', format: 'date-time' },
          },
        },
        childrenHandled: {
          type: 'object',
          properties: {
            moved: { type: 'number', example: 3 },
            deleted: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot delete category - has active products or other constraints',
  })
  async deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() adminUser: User,
    @Query('reason') reason?: string,
    @Query('moveChildrenToParent') moveChildrenToParent: boolean = true,
  ) {
    const startTime = Date.now();
    const requestId = `delete_${id}_${Date.now()}`;

    this.logger.log(
      `🗑️ [${requestId}] Deleting category ID: ${id} by admin ${adminUser.id}`,
    );

    try {
      const result = await this.categoriesService.remove(id);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ [${requestId}] Category deleted successfully (${processingTime}ms)`,
      );

      return {
        success: true,
        message: 'Category deleted successfully',
        deletedCategory: result,
        metadata: {
          processingTime,
          requestId,
          deletedBy: adminUser.id,
          deletedAt: new Date(),
          reason: reason || 'No reason provided',
        },
      };
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ [${requestId}] Category deletion failed: ${(error as Error).message} (${processingTime}ms)`,
      );
      throw error;
    }
  }
}

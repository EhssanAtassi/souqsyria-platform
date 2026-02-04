/**
 * @file quick-access.controller.ts
 * @description Controller for Quick Access promotional cards
 *
 * Provides HTTP endpoints for managing promotional cards that appear
 * in the header's quick access row. Includes both public and admin endpoints.
 *
 * PUBLIC ENDPOINTS:
 * - GET /quick-access - Get active promotional cards
 *
 * ADMIN ENDPOINTS:
 * - GET /quick-access/admin - Get all cards with filters
 * - GET /quick-access/admin/:id - Get specific card
 * - POST /quick-access/admin - Create new card
 * - PATCH /quick-access/admin/:id - Update card
 * - DELETE /quick-access/admin/:id - Soft delete
 * - POST /quick-access/admin/:id/restore - Restore deleted
 * - POST /quick-access/admin/reorder - Update display order
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
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
  UseGuards,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { QuickAccessService } from '../services/quick-access.service';
import { QuickAccess } from '../entities/quick-access.entity';
import {
  CreateQuickAccessDto,
  UpdateQuickAccessDto,
  QuickAccessQueryDto,
  ReorderQuickAccessDto,
} from '../dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';

/**
 * QuickAccessController
 *
 * @description HTTP controller for Quick Access promotional cards.
 * Manages promotional content displayed in the header quick access row.
 *
 * @swagger
 * tags:
 *   name: Quick Access
 *   description: Promotional cards management API
 */
@ApiTags('🎯 Quick Access')
@Controller('quick-access')
export class QuickAccessController {
  /** Logger instance for QuickAccessController */
  private readonly logger = new Logger(QuickAccessController.name);

  constructor(private readonly quickAccessService: QuickAccessService) {}

  // ================================
  // PUBLIC ENDPOINTS
  // ================================

  /**
   * GET ACTIVE PROMOTIONAL CARDS
   *
   * @description Retrieves all active promotional cards for public display.
   * Results are cached for 5 minutes to improve performance.
   * No authentication required.
   *
   * @returns Array of active QuickAccess items
   *
   * @example
   * GET /quick-access
   */
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get active promotional cards',
    description:
      'Retrieves all active promotional cards for display in the header quick access row. ' +
      'Results are sorted by display order and cached for performance. ' +
      'Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active promotional cards retrieved successfully',
    type: [QuickAccess],
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          categoryEn: 'Premium Deals',
          categoryAr: 'عروض مميزة',
          titleEn: 'Damascene Delights',
          titleAr: 'المأكولات الدمشقية',
          subtitleEn: 'Save 30% on traditional sweets',
          subtitleAr: 'وفر 30% على الحلويات التقليدية',
          badgeClass: 'badge-gold',
          image: 'https://cdn.souqsyria.com/promos/damascene-sweets.jpg',
          url: '/category/damascene-sweets',
          displayOrder: 0,
          isActive: true,
        },
      ],
    },
  })
  async findAll(): Promise<QuickAccess[]> {
    this.logger.log('📋 Fetching active promotional cards');
    return this.quickAccessService.findAll();
  }

  // ================================
  // ADMIN ENDPOINTS
  // ================================

  /**
   * GET ALL PROMOTIONAL CARDS (ADMIN)
   *
   * @description Retrieves promotional cards with optional filters.
   * Can include inactive and soft-deleted items for management.
   * Requires admin authentication.
   *
   * @param queryDto - Filter and pagination options
   * @returns Object with items array and total count
   *
   * @example
   * GET /quick-access/admin?isActive=true&limit=20&offset=0
   * Authorization: Bearer <admin-token>
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all promotional cards (Admin)',
    description:
      'Retrieves promotional cards with optional filters and pagination. ' +
      'Can include inactive and soft-deleted items. ' +
      'Requires admin authentication.',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'badgeClass',
    required: false,
    type: String,
    description: 'Filter by badge class',
    enum: ['badge-gold', 'badge-blue', 'badge-green', 'badge-purple', 'badge-orange', 'badge-red', 'badge-teal', 'badge-pink'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of items to return (1-100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip for pagination',
    example: 0,
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted items',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Promotional cards retrieved successfully',
    schema: {
      example: {
        items: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            categoryEn: 'Premium Deals',
            categoryAr: 'عروض مميزة',
            titleEn: 'Damascene Delights',
            titleAr: 'المأكولات الدمشقية',
            badgeClass: 'badge-gold',
            image: 'https://cdn.souqsyria.com/promos/damascene-sweets.jpg',
            url: '/category/damascene-sweets',
            displayOrder: 0,
            isActive: true,
            createdAt: '2026-02-01T10:00:00Z',
            updatedAt: '2026-02-01T10:00:00Z',
            deletedAt: null,
          },
        ],
        total: 15,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  async findAllAdmin(@Query() queryDto: QuickAccessQueryDto) {
    this.logger.log('📋 Admin fetching promotional cards with filters');
    return this.quickAccessService.findAllAdmin(queryDto);
  }

  /**
   * GET SINGLE PROMOTIONAL CARD (ADMIN)
   *
   * @description Retrieves a specific promotional card by ID.
   * Can retrieve soft-deleted items with query parameter.
   * Requires admin authentication.
   *
   * @param id - UUID of the promotional card
   * @param includeDeleted - Whether to include soft-deleted items
   * @returns QuickAccess entity
   *
   * @example
   * GET /quick-access/admin/550e8400-e29b-41d4-a716-446655440000
   * Authorization: Bearer <admin-token>
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get single promotional card (Admin)',
    description:
      'Retrieves a specific promotional card by ID. ' +
      'Can retrieve soft-deleted items. ' +
      'Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID of the promotional card',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Include soft-deleted items',
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Promotional card retrieved successfully',
    type: QuickAccess,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotional card not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<QuickAccess> {
    this.logger.log(`📋 Admin fetching promotional card ${id}`);
    return this.quickAccessService.findOne(id, includeDeleted);
  }

  /**
   * CREATE NEW PROMOTIONAL CARD (ADMIN)
   *
   * @description Creates a new promotional card for the quick access row.
   * Automatically assigns next display order if not provided.
   * Requires admin authentication.
   *
   * @param createDto - Card creation data
   * @returns Created QuickAccess entity
   *
   * @example
   * POST /quick-access/admin
   * Authorization: Bearer <admin-token>
   * Body: {
   *   "categoryEn": "Premium Deals",
   *   "categoryAr": "عروض مميزة",
   *   "titleEn": "Damascene Delights",
   *   "titleAr": "المأكولات الدمشقية",
   *   "badgeClass": "badge-gold",
   *   "image": "https://cdn.souqsyria.com/promos/damascene.jpg",
   *   "url": "/category/damascene-sweets"
   * }
   */
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new promotional card (Admin)',
    description:
      'Creates a new promotional card for the quick access row. ' +
      'Automatically assigns next display order if not provided. ' +
      'Requires admin authentication.',
  })
  @ApiBody({
    type: CreateQuickAccessDto,
    description: 'Card creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotional card created successfully',
    type: QuickAccess,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  async create(@Body() createDto: CreateQuickAccessDto): Promise<QuickAccess> {
    this.logger.log('✨ Admin creating new promotional card');
    return this.quickAccessService.create(createDto);
  }

  /**
   * UPDATE PROMOTIONAL CARD (ADMIN)
   *
   * @description Updates an existing promotional card.
   * Only provided fields will be updated.
   * Requires admin authentication.
   *
   * @param id - UUID of the card to update
   * @param updateDto - Update data
   * @returns Updated QuickAccess entity
   *
   * @example
   * PATCH /quick-access/admin/550e8400-e29b-41d4-a716-446655440000
   * Authorization: Bearer <admin-token>
   * Body: { "isActive": false }
   */
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update promotional card (Admin)',
    description:
      'Updates an existing promotional card. ' +
      'Only provided fields will be updated. ' +
      'Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID of the promotional card',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateQuickAccessDto,
    description: 'Update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotional card updated successfully',
    type: QuickAccess,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotional card not found',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateQuickAccessDto,
  ): Promise<QuickAccess> {
    this.logger.log(`📝 Admin updating promotional card ${id}`);
    return this.quickAccessService.update(id, updateDto);
  }

  /**
   * SOFT DELETE PROMOTIONAL CARD (ADMIN)
   *
   * @description Soft deletes a promotional card.
   * Card can be restored later if needed.
   * Requires admin authentication.
   *
   * @param id - UUID of the card to delete
   * @returns Success message
   *
   * @example
   * DELETE /quick-access/admin/550e8400-e29b-41d4-a716-446655440000
   * Authorization: Bearer <admin-token>
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft delete promotional card (Admin)',
    description:
      'Soft deletes a promotional card. ' +
      'Card can be restored later if needed. ' +
      'Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID of the promotional card',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotional card deleted successfully',
    schema: {
      example: { message: 'Quick access item deleted successfully' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotional card not found',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`🗑️ Admin deleting promotional card ${id}`);
    return this.quickAccessService.remove(id);
  }

  /**
   * RESTORE DELETED PROMOTIONAL CARD (ADMIN)
   *
   * @description Restores a soft-deleted promotional card.
   * Card must be deleted to be restored.
   * Requires admin authentication.
   *
   * @param id - UUID of the card to restore
   * @returns Restored QuickAccess entity
   *
   * @example
   * POST /quick-access/admin/550e8400-e29b-41d4-a716-446655440000/restore
   * Authorization: Bearer <admin-token>
   */
  @Post('admin/:id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore deleted promotional card (Admin)',
    description:
      'Restores a soft-deleted promotional card. ' +
      'Card must be deleted to be restored. ' +
      'Requires admin authentication.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'UUID of the promotional card',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Promotional card restored successfully',
    type: QuickAccess,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  @ApiResponse({
    status: 404,
    description: 'Promotional card not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Card is not deleted',
  })
  async restore(@Param('id', ParseUUIDPipe) id: string): Promise<QuickAccess> {
    this.logger.log(`♻️ Admin restoring promotional card ${id}`);
    return this.quickAccessService.restore(id);
  }

  /**
   * REORDER PROMOTIONAL CARDS (ADMIN)
   *
   * @description Updates display order for multiple cards at once.
   * Used for drag-and-drop reordering in admin interface.
   * Requires admin authentication.
   *
   * @param reorderDto - Array of items with new display orders
   * @returns Success message
   *
   * @example
   * POST /quick-access/admin/reorder
   * Authorization: Bearer <admin-token>
   * Body: {
   *   "items": [
   *     { "id": "uuid-1", "displayOrder": 0 },
   *     { "id": "uuid-2", "displayOrder": 1 },
   *     { "id": "uuid-3", "displayOrder": 2 }
   *   ]
   * }
   */
  @Post('admin/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder promotional cards (Admin)',
    description:
      'Updates display order for multiple cards at once. ' +
      'Used for drag-and-drop reordering in admin interface. ' +
      'Requires admin authentication.',
  })
  @ApiBody({
    type: ReorderQuickAccessDto,
    description: 'Array of items with new display orders',
  })
  @ApiResponse({
    status: 200,
    description: 'Display order updated successfully',
    schema: {
      example: { message: 'Display order updated successfully' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Admin authentication required',
  })
  async reorder(@Body() reorderDto: ReorderQuickAccessDto) {
    this.logger.log(`🔄 Admin reordering ${reorderDto.items.length} promotional cards`);
    return this.quickAccessService.reorder(reorderDto);
  }
}
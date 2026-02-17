/**
 * @file promo-cards.controller.ts
 * @description REST API controller for promotional cards management
 *
 * ENDPOINTS:
 * - POST   /promo-cards                   Create new card (Admin)
 * - GET    /promo-cards                   List all cards (Admin)
 * - GET    /promo-cards/active            Get active cards (Public)
 * - GET    /promo-cards/:id               Get card by ID (Admin)
 * - PATCH  /promo-cards/:id               Update card (Admin)
 * - DELETE /promo-cards/:id               Soft delete card (Admin)
 * - POST   /promo-cards/:id/restore       Restore deleted card (Admin)
 * - POST   /promo-cards/:id/submit        Submit for approval (Admin)
 * - POST   /promo-cards/:id/approve       Approve card (Admin)
 * - POST   /promo-cards/:id/reject        Reject card (Admin)
 * - POST   /promo-cards/track/impression  Track impression (Public)
 * - POST   /promo-cards/track/click       Track click (Public)
 * - GET    /promo-cards/:id/analytics     Get card analytics (Admin)
 * - POST   /promo-cards/bulk/activate     Bulk activate (Admin)
 * - POST   /promo-cards/bulk/deactivate   Bulk deactivate (Admin)
 * - DELETE /promo-cards/bulk              Bulk delete (Admin)
 *
 * @swagger
 * tags:
 *   name: PromoCards
 *   description: Promotional cards management for hero banner 70/30 layout
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
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
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PromoCardsService } from '../services/promo-cards.service';
import {
  CreatePromoCardDto,
  UpdatePromoCardDto,
  TrackImpressionDto,
  TrackClickDto,
  QueryPromoCardsDto,
  PromoCardPublicResponseDto,
  PromoCardAdminResponseDto,
  PromoCardAnalyticsDto,
  PaginatedPromoCardsResponseDto,
} from '../dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Promo Cards Controller
 *
 * Manages promotional cards for hero banner with:
 * - Public endpoints for active cards and analytics tracking
 * - Admin endpoints for CRUD operations and approval workflow
 * - Redis caching for performance
 */
@ApiTags('Promo Cards')
@Controller('promo-cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PromoCardsController {
  constructor(private readonly promoCardsService: PromoCardsService) {}

  // ================================
  // CRUD ENDPOINTS
  // ================================

  /**
   * Create new promotional card (Admin only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new promotional card',
    description:
      'Creates a new promo card with scheduling and analytics tracking. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Promo card created successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or schedule dates',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Position is already occupied by an active card',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async create(@Body() createDto: CreatePromoCardDto, @Request() req: any) {
    const userId = req.user?.id;
    return await this.promoCardsService.create(createDto, userId);
  }

  /**
   * List all promotional cards (Admin only)
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all promotional cards (Admin)',
    description:
      'Returns paginated list of all promo cards with filtering and sorting. Admin only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of promo cards retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async findAll(@Query() queryDto: QueryPromoCardsDto) {
    return await this.promoCardsService.findAll(queryDto);
  }

  /**
   * Get active promotional cards (Public endpoint)
   */
  @Public()
  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active promotional cards (Public)',
    description:
      'Returns currently active, approved cards for public display in hero banner. Cached for 5 minutes.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active promo cards retrieved successfully',
    type: [PromoCardPublicResponseDto],
  })
  async getActiveCards() {
    return await this.promoCardsService.getActiveCards();
  }

  /**
   * Get promotional card by ID (Admin only)
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get promotional card by ID',
    description:
      'Returns detailed information for a specific promo card. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card retrieved successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async findOne(@Param('id') id: string) {
    return await this.promoCardsService.findOne(id);
  }

  /**
   * Update promotional card (Admin only)
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update promotional card',
    description:
      'Updates an existing promo card with partial data. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card updated successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Position change conflicts with existing card',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePromoCardDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    return await this.promoCardsService.update(id, updateDto, userId);
  }

  /**
   * Soft delete promotional card (Admin only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Soft delete promotional card',
    description:
      'Soft deletes a promo card (can be restored later). Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async remove(@Param('id') id: string) {
    return await this.promoCardsService.remove(id);
  }

  /**
   * Restore deleted promotional card (Admin only)
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restore deleted promo card',
    description: 'Restores a soft-deleted promotional card. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card restored successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Promo card is not deleted',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async restore(@Param('id') id: string) {
    return await this.promoCardsService.restore(id);
  }

  // ================================
  // APPROVAL WORKFLOW ENDPOINTS
  // ================================

  /**
   * Submit card for approval (Admin only)
   */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit promo card for approval',
    description: 'Submits a draft promo card for admin approval. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card submitted for approval successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Card cannot be submitted in current status',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async submitForApproval(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id;
    return await this.promoCardsService.submitForApproval(id, userId);
  }

  /**
   * Approve promotional card (Admin only)
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve promotional card (Admin)',
    description:
      'Approves a pending promo card for public display. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card approved successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Card cannot be approved in current status',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async approve(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id;
    return await this.promoCardsService.approve(id, adminId);
  }

  /**
   * Reject promotional card (Admin only)
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject promotional card (Admin)',
    description: 'Rejects a pending promo card. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo card rejected successfully',
    type: PromoCardAdminResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Card cannot be rejected in current status',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async reject(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id;
    return await this.promoCardsService.reject(id, adminId);
  }

  // ================================
  // ANALYTICS TRACKING ENDPOINTS (Public)
  // ================================

  /**
   * Track card impression (Public endpoint)
   */
  @Public()
  @Post('track/impression')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track promo card impression',
    description: 'Records when a promo card is viewed. Public endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Impression tracked successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  async trackImpression(@Body() trackDto: TrackImpressionDto) {
    await this.promoCardsService.trackImpression(trackDto);
    return { message: 'Impression tracked successfully' };
  }

  /**
   * Track card click (Public endpoint)
   */
  @Public()
  @Post('track/click')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track promo card click',
    description: 'Records when a promo card is clicked. Public endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Click tracked successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  async trackClick(@Body() trackDto: TrackClickDto) {
    await this.promoCardsService.trackClick(trackDto);
    return { message: 'Click tracked successfully' };
  }

  /**
   * Get card analytics (Admin only)
   */
  @Get(':id/analytics')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get promo card analytics',
    description:
      'Returns aggregated analytics data for a specific promo card. Admin only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Promo card UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: PromoCardAnalyticsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Promo card not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async getAnalytics(@Param('id') id: string) {
    return await this.promoCardsService.getAnalytics(id);
  }

  // ================================
  // BULK OPERATIONS ENDPOINTS (Admin)
  // ================================

  /**
   * Bulk activate promo cards (Admin only)
   */
  @Post('bulk/activate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk activate promo cards',
    description: 'Activates multiple promo cards at once. Admin only.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of promo card UUIDs',
          example: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo cards activated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async bulkActivate(@Body('ids') ids: string[]) {
    const count = await this.promoCardsService.bulkUpdateActiveStatus(
      ids,
      true,
    );
    return { message: `${count} promo cards activated successfully`, count };
  }

  /**
   * Bulk deactivate promo cards (Admin only)
   */
  @Post('bulk/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk deactivate promo cards',
    description: 'Deactivates multiple promo cards at once. Admin only.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of promo card UUIDs',
          example: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo cards deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async bulkDeactivate(@Body('ids') ids: string[]) {
    const count = await this.promoCardsService.bulkUpdateActiveStatus(
      ids,
      false,
    );
    return { message: `${count} promo cards deactivated successfully`, count };
  }

  /**
   * Bulk delete promo cards (Admin only)
   */
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk delete promo cards',
    description: 'Soft deletes multiple promo cards at once. Admin only.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of promo card UUIDs',
          example: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Promo cards deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Admin access required',
  })
  async bulkDelete(@Body('ids') ids: string[]) {
    const count = await this.promoCardsService.bulkDelete(ids);
    return { message: `${count} promo cards deleted successfully`, count };
  }
}

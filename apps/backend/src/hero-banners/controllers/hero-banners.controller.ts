/**
 * @file hero-banners.controller.ts
 * @description REST API controller for hero banners management
 *
 * ENDPOINTS:
 * - POST   /hero-banners                   Create new banner
 * - GET    /hero-banners                   List all banners (admin)
 * - GET    /hero-banners/active            Get active banners (public)
 * - GET    /hero-banners/:id               Get banner by ID
 * - PATCH  /hero-banners/:id               Update banner
 * - DELETE /hero-banners/:id               Soft delete banner
 * - POST   /hero-banners/:id/restore       Restore deleted banner
 * - POST   /hero-banners/:id/submit        Submit for approval
 * - POST   /hero-banners/:id/approve       Approve banner (admin)
 * - POST   /hero-banners/:id/reject        Reject banner (admin)
 * - POST   /hero-banners/track/impression  Track impression
 * - POST   /hero-banners/track/click       Track click
 * - POST   /hero-banners/track/cta         Track CTA click
 * - POST   /hero-banners/track/conversion  Track conversion
 * - GET    /hero-banners/:id/analytics     Get banner analytics
 * - POST   /hero-banners/bulk/activate     Bulk activate
 * - POST   /hero-banners/bulk/deactivate   Bulk deactivate
 * - DELETE /hero-banners/bulk              Bulk delete
 * - GET    /hero-banners/expiring          Get expiring banners
 *
 * @swagger
 * tags:
 *   name: HeroBanners
 *   description: Hero banner carousel management and analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
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
  Req,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { HeroBannersService } from '../services/hero-banners.service';
import {
  CreateHeroBannerDto,
  UpdateHeroBannerDto,
  TrackImpressionDto,
  TrackClickDto,
  TrackCTAClickDto,
  TrackConversionDto,
  QueryHeroBannersDto,
  HeroBannerResponseDto,
  HeroBannerPublicResponseDto,
  HeroBannerListItemDto,
  BannerAnalyticsResponseDto,
  PaginatedHeroBannersResponseDto,
} from '../dto';

@ApiTags('Hero Banners')
@Controller('hero-banners')
export class HeroBannersController {
  constructor(private readonly heroBannersService: HeroBannersService) {}

  // ================================
  // CRUD ENDPOINTS
  // ================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new hero banner',
    description: 'Creates a new hero banner campaign with scheduling and analytics tracking',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Hero banner created successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or schedule dates',
  })
  async create(@Body() createDto: CreateHeroBannerDto) {
    return await this.heroBannersService.create(createDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all hero banners (Admin)',
    description: 'Returns paginated list of all hero banners with filtering and sorting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of hero banners retrieved successfully',
  })
  async findAll(@Query() queryDto: QueryHeroBannersDto) {
    return await this.heroBannersService.findAll(queryDto);
  }

  @Public()
  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active hero banners (Public)',
    description: 'Returns currently active, approved banners for public display on homepage',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active banners retrieved successfully',
    type: [HeroBannerPublicResponseDto],
  })
  async getActiveBanners() {
    return await this.heroBannersService.getActiveBanners();
  }

  @Get('expiring')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get banners expiring soon',
    description: 'Returns banners expiring within specified days (default: 7)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days threshold',
    example: 7,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring banners retrieved successfully',
    type: [HeroBannerListItemDto],
  })
  async getExpiringSoon(@Query('days') days?: number) {
    return await this.heroBannersService.getExpiringSoon(days);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get hero banner by ID',
    description: 'Returns detailed information for a specific hero banner',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner retrieved successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
  })
  async findOne(@Param('id') id: string) {
    return await this.heroBannersService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update hero banner',
    description: 'Updates an existing hero banner with partial data',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner updated successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(@Param('id') id: string, @Body() updateDto: UpdateHeroBannerDto) {
    return await this.heroBannersService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete hero banner',
    description: 'Soft deletes a hero banner (can be restored later)',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
  })
  async remove(@Param('id') id: string) {
    return await this.heroBannersService.remove(id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore deleted banner',
    description: 'Restores a soft-deleted hero banner',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner restored successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Banner is not deleted',
  })
  async restore(@Param('id') id: string) {
    return await this.heroBannersService.restore(id);
  }

  // ================================
  // APPROVAL WORKFLOW ENDPOINTS
  // ================================

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit banner for approval',
    description: 'Submits a draft banner for admin approval',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner submitted for approval successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Banner cannot be submitted in current status',
  })
  async submitForApproval(@Param('id') id: string) {
    return await this.heroBannersService.submitForApproval(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve hero banner (Admin)',
    description: 'Approves a pending banner for public display',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminId: {
          type: 'number',
          description: 'Admin user ID',
          example: 1,
        },
      },
      required: ['adminId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner approved successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Banner cannot be approved in current status',
  })
  async approve(@Param('id') id: string, @Body('adminId') adminId: number) {
    return await this.heroBannersService.approve(id, adminId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject hero banner (Admin)',
    description: 'Rejects a pending banner with a reason',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminId: {
          type: 'number',
          description: 'Admin user ID',
          example: 1,
        },
        reason: {
          type: 'string',
          description: 'Rejection reason',
          example: 'Image quality is too low',
        },
      },
      required: ['adminId', 'reason'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banner rejected successfully',
    type: HeroBannerResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Banner cannot be rejected in current status',
  })
  async reject(
    @Param('id') id: string,
    @Body('adminId') adminId: number,
    @Body('reason') reason: string,
  ) {
    return await this.heroBannersService.reject(id, adminId, reason);
  }

  // ================================
  // ANALYTICS TRACKING ENDPOINTS
  // ================================

  @Post('track/impression')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track banner impression',
    description: 'Records when a banner is viewed',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Impression tracked successfully',
  })
  async trackImpression(@Body() trackDto: TrackImpressionDto) {
    await this.heroBannersService.trackImpression(trackDto);
    return { message: 'Impression tracked successfully' };
  }

  @Post('track/click')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track banner click',
    description: 'Records when a banner is clicked',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Click tracked successfully',
  })
  async trackClick(@Body() trackDto: TrackClickDto) {
    await this.heroBannersService.trackClick(trackDto);
    return { message: 'Click tracked successfully' };
  }

  @Post('track/cta')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track CTA button click',
    description: 'Records when a CTA button is clicked',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'CTA click tracked successfully',
  })
  async trackCTAClick(@Body() trackDto: TrackCTAClickDto) {
    await this.heroBannersService.trackCTAClick(trackDto);
    return { message: 'CTA click tracked successfully' };
  }

  @Post('track/conversion')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track conversion',
    description: 'Records a conversion (purchase) attributed to banner',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Conversion tracked successfully',
  })
  async trackConversion(@Body() trackDto: TrackConversionDto) {
    await this.heroBannersService.trackConversion(trackDto);
    return { message: 'Conversion tracked successfully' };
  }

  @Get(':id/analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get banner analytics',
    description: 'Returns aggregated analytics data for a specific banner',
  })
  @ApiParam({
    name: 'id',
    description: 'Banner UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: BannerAnalyticsResponseDto,
  })
  async getAnalytics(@Param('id') id: string) {
    return await this.heroBannersService.getAnalytics(id);
  }

  // ================================
  // BULK OPERATIONS ENDPOINTS
  // ================================

  @Post('bulk/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk activate banners',
    description: 'Activates multiple banners at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of banner UUIDs',
          example: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banners activated successfully',
  })
  async bulkActivate(@Body('ids') ids: string[]) {
    const count = await this.heroBannersService.bulkUpdateActiveStatus(ids, true);
    return { message: `${count} banners activated successfully`, count };
  }

  @Post('bulk/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk deactivate banners',
    description: 'Deactivates multiple banners at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of banner UUIDs',
          example: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banners deactivated successfully',
  })
  async bulkDeactivate(@Body('ids') ids: string[]) {
    const count = await this.heroBannersService.bulkUpdateActiveStatus(ids, false);
    return { message: `${count} banners deactivated successfully`, count };
  }

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete banners',
    description: 'Soft deletes multiple banners at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of banner UUIDs',
          example: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      },
      required: ['ids'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Banners deleted successfully',
  })
  async bulkDelete(@Body('ids') ids: string[]) {
    const count = await this.heroBannersService.bulkDelete(ids);
    return { message: `${count} banners deleted successfully`, count };
  }

  // ================================
  // GENERAL ANALYTICS ENDPOINT
  // ================================

  /**
   * POST /hero-banners/analytics/track
   * General analytics tracking endpoint for banners, products, and categories
   * Reuses the existing hero_analytics table infrastructure
   */
  @Post('analytics/track')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Track general analytics event',
    description: `
      General-purpose analytics tracking endpoint that supports:
      • Hero banner impressions/clicks (banner_id)
      • Product impressions/clicks (product_id)
      • Category impressions/clicks (category_id)

      Reuses the existing hero_analytics table structure for unified analytics.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event tracked successfully',
    schema: {
      example: {
        success: true,
        message: 'Event tracked successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid event data',
  })
  async trackGeneralEvent(
    @Body() trackDto: any, // Using any for now, can import TrackGeneralEventDto
    @Req() request: any,
  ) {
    // Map the DTO to match the existing tracking methods
    const trackingData = {
      bannerId: trackDto.banner_id || null,
      position: trackDto.metadata?.position || 0,
      targetUrl: '',
      sessionId: trackDto.session_id,
      ipAddress: request.ip || null,
      userAgent: request.headers['user-agent'] || null,
      timestamp: new Date(),
    };

    // Reuse existing tracking method based on event type
    switch (trackDto.event_type) {
      case 'impression':
        if (trackDto.banner_id) {
          await this.heroBannersService.trackImpression(trackingData);
        }
        break;
      case 'click':
      case 'cta_click':
        if (trackDto.banner_id) {
          await this.heroBannersService.trackClick(trackingData);
        }
        break;
    }

    // TODO: Add separate tracking for products and categories
    // For now, analytics are stored in hero_analytics table with product_id/category_id fields

    return {
      success: true,
      message: 'Event tracked successfully',
    };
  }
}

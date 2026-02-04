/**
 * @file analytics.controller.ts
 * @description REST API controller for analytics tracking
 *
 * ENDPOINTS:
 * - POST /analytics/track - Track analytics event
 *
 * @author SouqSyria Development Team
 * @since 2025-10-08
 */

import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * Analytics Controller
 *
 * Provides REST API endpoints for tracking analytics events
 */
@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * POST /analytics/track
   *
   * Track analytics event for banners, products, or categories
   */
  @Post('track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track analytics event',
    description: `
      General-purpose analytics tracking endpoint that supports:
      • Hero banner impressions/clicks (banner_id)
      • Product impressions/clicks (product_id)
      • Category impressions/clicks (category_id)

      Use Cases:
      • Homepage hero banner tracking
      • Product carousel analytics
      • Category navigation tracking
      • User engagement metrics

      Implementation:
      Reuses the existing hero_analytics table for unified analytics storage.
      Automatically captures user agent, IP address, and referrer from request headers.
    `,
  })
  @ApiBody({
    type: TrackEventDto,
    description: 'Analytics event data',
    examples: {
      banner_impression: {
        summary: 'Track banner impression',
        value: {
          event_type: 'impression',
          banner_id: 'test-uuid',
          session_id: 'session_123',
          metadata: { position: 0, device_type: 'desktop' },
        },
      },
      product_click: {
        summary: 'Track product click',
        value: {
          event_type: 'click',
          product_id: 1,
          session_id: 'session_123',
          metadata: { position: 2, device_type: 'mobile' },
        },
      },
      category_impression: {
        summary: 'Track category impression',
        value: {
          event_type: 'impression',
          category_id: 5,
          session_id: 'session_123',
          metadata: { viewport_width: 1920 },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Event tracked successfully',
    schema: {
      example: {
        success: true,
        message: 'Event tracked successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
  })
  async trackEvent(
    @Body() dto: TrackEventDto,
    @Req() request: Request,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `📊 Analytics track request: ${dto.event_type} - banner=${dto.banner_id || 'N/A'}, product=${dto.product_id || 'N/A'}, category=${dto.category_id || 'N/A'}`,
    );

    await this.analyticsService.trackEvent({
      event_type: dto.event_type,
      banner_id: dto.banner_id,
      product_id: dto.product_id,
      category_id: dto.category_id,
      session_id: dto.session_id,
      user_agent: request.headers['user-agent'],
      ip_address: request.ip,
      referrer: request.headers['referer'] || null,
      metadata: dto.metadata,
    });

    return {
      success: true,
      message: 'Event tracked successfully',
    };
  }
}

/**
 * @file event-tracking.controller.ts
 * @description Event Tracking Controller for Business Intelligence
 *
 * ENDPOINTS:
 * - POST /analytics/events/track - Track a user event
 * - GET /analytics/sessions/:sessionId - Get session details
 * - GET /analytics/funnel - Get conversion funnel metrics
 * - GET /analytics/clv/:userId - Get customer lifetime value
 * - GET /analytics/abandonment - Get cart abandonment metrics
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EventTrackingService } from '../services/event-tracking.service';
import { EventAggregationService } from '../services/event-aggregation.service';
import { TrackBIEventDto, AnalyticsQueryDto, SessionSummaryDto } from '../dto/event-tracking.dto';
import { RequestWithSession } from '../middleware/event-tracking.middleware';

/**
 * EventTrackingController
 *
 * Handles event tracking and analytics query endpoints.
 * All endpoints use session tracking middleware for attribution.
 *
 * AUTHENTICATION:
 * - POST /track: Public (works for authenticated and guest users)
 * - GET endpoints: Require authentication (admin/vendor access)
 */
@ApiTags('Analytics - Event Tracking')
@Controller('analytics')
export class EventTrackingController {
  constructor(
    private readonly eventTrackingService: EventTrackingService,
    private readonly eventAggregationService: EventAggregationService,
  ) {}

  /**
   * Track a user event
   *
   * Endpoint for frontend to send user interaction events.
   * Non-blocking, fire-and-forget for optimal performance.
   *
   * @param req - HTTP request with session context
   * @param trackEventDto - Event details
   * @returns Success response
   */
  @Post('events/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track user event',
    description:
      'Records a user interaction event for business intelligence analytics. ' +
      'Automatically correlates with user session for funnel tracking.',
  })
  @ApiResponse({
    status: 200,
    description: 'Event tracked successfully',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Event tracked successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event data',
  })
  async trackEvent(
    @Req() req: RequestWithSession,
    @Body() trackEventDto: TrackBIEventDto,
  ) {
    await this.eventTrackingService.trackEvent(req, trackEventDto);

    return {
      success: true,
      message: 'Event tracked successfully',
    };
  }

  /**
   * Get session details and event timeline
   *
   * @param sessionId - Session ID
   * @returns Session details with event timeline
   */
  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: 'Get session details',
    description:
      'Retrieves complete session details including all tracked events in chronological order.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID',
    type: Number,
    example: 12345,
  })
  @ApiResponse({
    status: 200,
    description: 'Session details retrieved',
    type: SessionSummaryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  async getSession(@Param('sessionId') sessionId: number) {
    const session = await this.eventTrackingService.getSessionEventTimeline(sessionId);

    return {
      success: true,
      data: session,
    };
  }

  /**
   * Get conversion funnel metrics
   *
   * Analyzes user journey from entry to conversion.
   * Shows drop-off rates at each funnel stage.
   *
   * @param query - Date range filter
   * @returns Funnel metrics
   */
  @Get('funnel')
  @ApiOperation({
    summary: 'Get conversion funnel metrics',
    description:
      'Retrieves conversion funnel analytics showing user progression through ' +
      'page views, product views, cart additions, checkout, and conversion. ' +
      'Includes drop-off rates at each stage.',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for analysis (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for analysis (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Funnel metrics retrieved',
    schema: {
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalSessions: { type: 'number', example: 1000 },
            sessionsWithPageViews: { type: 'number', example: 950 },
            sessionsWithProductViews: { type: 'number', example: 750 },
            sessionsWithCartAdds: { type: 'number', example: 300 },
            sessionsWithCheckoutStart: { type: 'number', example: 200 },
            sessionsWithConversion: { type: 'number', example: 150 },
            conversionRate: { type: 'number', example: 15.0 },
            cartAbandonmentRate: { type: 'number', example: 50.0 },
            averageTimeToConversion: { type: 'number', example: 1800 },
            dropOffRates: {
              type: 'object',
              properties: {
                pageViewToProductView: { type: 'number', example: 21.05 },
                productViewToCart: { type: 'number', example: 60.0 },
                cartToCheckout: { type: 'number', example: 33.33 },
                checkoutToConversion: { type: 'number', example: 25.0 },
              },
            },
          },
        },
      },
    },
  })
  async getConversionFunnel(@Query() query: AnalyticsQueryDto) {
    const metrics = await this.eventAggregationService.getConversionFunnelMetrics({
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get Customer Lifetime Value for a user
   *
   * @param userId - User ID
   * @returns CLV metrics
   */
  @Get('clv/:userId')
  @ApiOperation({
    summary: 'Get Customer Lifetime Value',
    description:
      'Calculates comprehensive Customer Lifetime Value metrics including ' +
      'total orders, revenue, purchase frequency, and predicted future value. ' +
      'Also provides customer segmentation (high/medium/low value, at-risk).',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: Number,
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: 'CLV metrics retrieved',
    schema: {
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'number', example: 123 },
            totalOrders: { type: 'number', example: 8 },
            totalRevenue: { type: 'number', example: 2400.0 },
            averageOrderValue: { type: 'number', example: 300.0 },
            firstOrderDate: { type: 'string', example: '2024-01-15T10:30:00Z' },
            lastOrderDate: { type: 'string', example: '2024-06-20T14:15:00Z' },
            daysSinceFirstOrder: { type: 'number', example: 157 },
            purchaseFrequency: { type: 'number', example: 1.53 },
            predictedCLV: { type: 'number', example: 11016.0 },
            customerSegment: {
              type: 'string',
              enum: ['high_value', 'medium_value', 'low_value', 'at_risk'],
              example: 'high_value',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no order history',
  })
  async getCustomerLifetimeValue(@Param('userId') userId: number) {
    const clv = await this.eventAggregationService.getCustomerLifetimeValue(userId);

    if (!clv) {
      return {
        success: false,
        message: 'No order history found for user',
      };
    }

    return {
      success: true,
      data: clv,
    };
  }

  /**
   * Get cart abandonment metrics
   *
   * @param query - Date range filter
   * @returns Cart abandonment metrics
   */
  @Get('abandonment')
  @ApiOperation({
    summary: 'Get cart abandonment metrics',
    description:
      'Analyzes cart abandonment patterns including abandonment rate, recovery rate, ' +
      'average abandoned cart value, and total abandoned revenue. ' +
      'Critical for cart recovery campaign optimization.',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for analysis (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for analysis (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart abandonment metrics retrieved',
    schema: {
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalCartsWithItems: { type: 'number', example: 500 },
            abandonedCarts: { type: 'number', example: 250 },
            recoveredCarts: { type: 'number', example: 50 },
            abandonmentRate: { type: 'number', example: 50.0 },
            recoveryRate: { type: 'number', example: 20.0 },
            averageAbandonedCartValue: { type: 'number', example: 150.0 },
            totalAbandonedValue: { type: 'number', example: 37500.0 },
            averageTimeToAbandonment: { type: 'number', example: 35.5 },
          },
        },
      },
    },
  })
  async getCartAbandonmentMetrics(@Query() query: AnalyticsQueryDto) {
    const metrics = await this.eventAggregationService.getCartAbandonmentMetrics({
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });

    return {
      success: true,
      data: metrics,
    };
  }

  /**
   * Get session metrics summary
   *
   * @param query - Date range filter
   * @returns Session metrics
   */
  @Get('sessions/summary')
  @ApiOperation({
    summary: 'Get session metrics summary',
    description:
      'Retrieves comprehensive session analytics including average duration, ' +
      'page views, product engagement, device breakdown, top entry pages, and ' +
      'referrer sources with conversion rates.',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for analysis (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for analysis (YYYY-MM-DD)',
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Session metrics retrieved',
  })
  async getSessionSummary(@Query() query: AnalyticsQueryDto) {
    const summary = await this.eventAggregationService.getSessionMetricsSummary({
      startDate: new Date(query.startDate),
      endDate: new Date(query.endDate),
    });

    return {
      success: true,
      data: summary,
    };
  }

  /**
   * Get abandoned cart sessions for recovery
   *
   * Returns list of sessions with abandoned carts that haven't been notified recently.
   * Used by background jobs to trigger cart recovery emails.
   *
   * @returns Array of abandoned cart sessions
   */
  @Get('abandonment/sessions')
  @ApiOperation({
    summary: 'Get abandoned cart sessions',
    description:
      'Retrieves list of sessions with abandoned carts that are eligible for ' +
      'recovery campaigns. Filters out recently notified sessions to prevent spam.',
  })
  @ApiResponse({
    status: 200,
    description: 'Abandoned cart sessions retrieved',
  })
  async getAbandonedCartSessions() {
    const sessions = await this.eventTrackingService.getAbandonedCartSessions();

    return {
      success: true,
      count: sessions.length,
      data: sessions.map((s) => s.getSummary()),
    };
  }
}

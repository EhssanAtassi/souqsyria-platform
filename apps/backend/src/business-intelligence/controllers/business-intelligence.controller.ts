/**
 * @file business-intelligence.controller.ts
 * @description Main Business Intelligence Controller
 *
 * PURPOSE:
 * - Provides REST API endpoints for business intelligence data
 * - Exposes real-time metrics and analytics dashboards
 * - Enables manual event publishing and data querying
 * - Supports admin dashboard integration
 *
 * FEATURES:
 * - Real-time business metrics
 * - Event publishing API
 * - Analytics data export
 * - Performance monitoring
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseEnumPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { BusinessEventPublisher, IBusinessEventPayload } from '../services/business-event-publisher.service';
import { 
  EventAggregationService, 
  TimeWindow, 
  IRealTimeMetrics,
  IConversionFunnelMetrics,
} from '../services/event-aggregation.service';
import { BusinessEventType } from '../entities/business-event.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EnhancedAdminGuard } from '../../common/guards/enhanced-admin.guard';

/**
 * Business Intelligence Controller
 * 
 * Main controller for business intelligence and analytics endpoints.
 * Provides real-time metrics, event publishing, and data access.
 * 
 * @swagger
 * @ApiTags('Business Intelligence')
 */
@ApiTags('Business Intelligence')
@Controller('business-intelligence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BusinessIntelligenceController {
  constructor(
    private readonly businessEventPublisher: BusinessEventPublisher,
    private readonly eventAggregationService: EventAggregationService,
  ) {}

  /**
   * Get real-time business metrics for dashboard
   * 
   * @returns Real-time business metrics
   */
  @Get('metrics/real-time')
  @ApiOperation({
    summary: 'Get real-time business metrics',
    description: 'Returns real-time business metrics including active users, revenue, orders, and conversion rates for admin dashboard display.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Real-time business metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        activeUsers: { type: 'number', description: 'Active users in last 24 hours' },
        revenueToday: { type: 'number', description: 'Revenue generated today' },
        ordersToday: { type: 'number', description: 'Orders completed today' },
        conversionRate: { type: 'number', description: 'Overall conversion rate percentage' },
        averageOrderValue: { type: 'number', description: 'Average order value' },
        cartAbandonmentRate: { type: 'number', description: 'Cart abandonment rate percentage' },
      },
    },
  })
  @UseGuards(EnhancedAdminGuard)
  async getRealTimeMetrics(): Promise<IRealTimeMetrics> {
    return await this.eventAggregationService.getRealTimeMetrics();
  }

  /**
   * Get conversion funnel metrics
   * 
   * @param timeWindow - Time window for metrics
   * @returns Conversion funnel data
   */
  @Get('metrics/conversion-funnel')
  @ApiOperation({
    summary: 'Get conversion funnel metrics',
    description: 'Returns conversion funnel metrics showing user progression from product views to purchases.',
  })
  @ApiQuery({
    name: 'timeWindow',
    enum: TimeWindow,
    required: false,
    description: 'Time window for funnel analysis',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conversion funnel metrics retrieved successfully',
  })
  @UseGuards(EnhancedAdminGuard)
  async getConversionFunnelMetrics(
    @Query('timeWindow', new ParseEnumPipe(TimeWindow, { optional: true }))
    timeWindow: TimeWindow = TimeWindow.DAY,
  ): Promise<IConversionFunnelMetrics> {
    return await this.eventAggregationService.getConversionFunnelMetrics(timeWindow);
  }

  /**
   * Get event counts by type
   * 
   * @param timeWindow - Time window for event counts
   * @returns Event counts by type
   */
  @Get('metrics/event-counts')
  @ApiOperation({
    summary: 'Get event counts by type',
    description: 'Returns the count of business events by type for the specified time window.',
  })
  @ApiQuery({
    name: 'timeWindow',
    enum: TimeWindow,
    required: false,
    description: 'Time window for event counting',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event counts retrieved successfully',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'number',
        description: 'Event count for this type',
      },
    },
  })
  @UseGuards(EnhancedAdminGuard)
  async getEventCountsByType(
    @Query('timeWindow', new ParseEnumPipe(TimeWindow, { optional: true }))
    timeWindow: TimeWindow = TimeWindow.DAY,
  ): Promise<Record<string, number>> {
    return await this.eventAggregationService.getEventCountsByType(timeWindow);
  }

  /**
   * Manually publish a business intelligence event
   * 
   * @param eventData - Event data to publish
   * @returns Event ID
   */
  @Post('events/publish')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publish business intelligence event',
    description: 'Manually publish a business intelligence event for testing or data correction purposes.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['eventType', 'sourceModule', 'eventPayload'],
      properties: {
        eventType: {
          enum: Object.values(BusinessEventType),
          description: 'Type of business event',
        },
        userId: {
          type: 'number',
          description: 'User ID (optional)',
          nullable: true,
        },
        sessionId: {
          type: 'string',
          description: 'Session ID for guest tracking (optional)',
          nullable: true,
        },
        aggregateId: {
          type: 'string',
          description: 'Aggregate identifier (optional)',
          nullable: true,
        },
        aggregateType: {
          type: 'string',
          description: 'Aggregate type (optional)',
          nullable: true,
        },
        sourceModule: {
          type: 'string',
          description: 'Source module name',
        },
        eventPayload: {
          type: 'object',
          description: 'Event payload data',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (optional)',
          nullable: true,
        },
        revenueAmount: {
          type: 'number',
          description: 'Revenue amount for monetized events (optional)',
          nullable: true,
        },
        currency: {
          type: 'string',
          description: 'Currency code (optional)',
          nullable: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Business event published successfully',
    schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'Generated event ID',
        },
        message: {
          type: 'string',
          description: 'Success message',
        },
      },
    },
  })
  @UseGuards(EnhancedAdminGuard)
  async publishEvent(@Body() eventData: IBusinessEventPayload): Promise<{
    eventId: string;
    message: string;
  }> {
    const eventId = await this.businessEventPublisher.publishEvent(eventData);
    
    return {
      eventId,
      message: 'Business event published successfully',
    };
  }

  /**
   * Publish multiple events in batch
   * 
   * @param events - Array of events to publish
   * @returns Event IDs
   */
  @Post('events/batch-publish')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Batch publish business intelligence events',
    description: 'Publish multiple business intelligence events in a single batch for bulk data operations.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['events'],
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            // Same schema as single event
          },
          description: 'Array of events to publish',
        },
        batchSize: {
          type: 'number',
          description: 'Batch processing size (optional)',
          default: 50,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Events published successfully',
    schema: {
      type: 'object',
      properties: {
        eventIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Generated event IDs',
        },
        publishedCount: {
          type: 'number',
          description: 'Number of events published',
        },
        message: {
          type: 'string',
          description: 'Success message',
        },
      },
    },
  })
  @UseGuards(EnhancedAdminGuard)
  async batchPublishEvents(@Body() payload: {
    events: IBusinessEventPayload[];
    batchSize?: number;
  }): Promise<{
    eventIds: string[];
    publishedCount: number;
    message: string;
  }> {
    const eventIds = await this.businessEventPublisher.publishEventBatch(
      payload.events,
      { batchSize: payload.batchSize || 50 }
    );
    
    return {
      eventIds,
      publishedCount: eventIds.length,
      message: 'Events published successfully in batch',
    };
  }

  /**
   * Get event publishing statistics
   * 
   * @returns Publishing statistics
   */
  @Get('stats/publishing')
  @ApiOperation({
    summary: 'Get event publishing statistics',
    description: 'Returns statistics about event publishing performance including success rates and processing times.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Publishing statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalEventsPublished: {
          type: 'number',
          description: 'Total events published',
        },
        eventsByType: {
          type: 'object',
          additionalProperties: { type: 'number' },
          description: 'Event counts by type',
        },
        processingErrorRate: {
          type: 'number',
          description: 'Error rate percentage',
        },
        averageProcessingTime: {
          type: 'number',
          description: 'Average processing time in ms',
        },
      },
    },
  })
  @UseGuards(EnhancedAdminGuard)
  async getPublishingStats(): Promise<{
    totalEventsPublished: number;
    eventsByType: Record<string, number>;
    processingErrorRate: number;
    averageProcessingTime: number;
  }> {
    return await this.businessEventPublisher.getPublishingStats();
  }

  /**
   * Get business intelligence system health
   * 
   * @returns System health status
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get business intelligence system health',
    description: 'Returns the health status of the business intelligence system components.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System health status',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'degraded', 'unhealthy'],
          description: 'Overall system health status',
        },
        components: {
          type: 'object',
          properties: {
            eventPublisher: { type: 'string', enum: ['healthy', 'unhealthy'] },
            eventAggregation: { type: 'string', enum: ['healthy', 'unhealthy'] },
            database: { type: 'string', enum: ['healthy', 'unhealthy'] },
          },
          description: 'Component health status',
        },
        lastChecked: {
          type: 'string',
          format: 'date-time',
          description: 'Last health check timestamp',
        },
      },
    },
  })
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: {
      eventPublisher: 'healthy' | 'unhealthy';
      eventAggregation: 'healthy' | 'unhealthy';
      database: 'healthy' | 'unhealthy';
    };
    lastChecked: Date;
  }> {
    // Simple health check implementation
    // In production, this would check actual component health
    return {
      status: 'healthy',
      components: {
        eventPublisher: 'healthy',
        eventAggregation: 'healthy',
        database: 'healthy',
      },
      lastChecked: new Date(),
    };
  }

  /**
   * Get available business event types
   * 
   * @returns Available event types with descriptions
   */
  @Get('events/types')
  @ApiOperation({
    summary: 'Get available business event types',
    description: 'Returns all available business event types with their descriptions for reference.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event types retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        eventTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getEventTypes(): Promise<{
    eventTypes: Array<{
      type: string;
      description: string;
      category: string;
    }>;
  }> {
    return {
      eventTypes: [
        {
          type: BusinessEventType.USER_REGISTERED,
          description: 'User completes registration process',
          category: 'Customer Lifecycle',
        },
        {
          type: BusinessEventType.USER_FIRST_PURCHASE,
          description: 'Customer makes their first purchase',
          category: 'Customer Lifecycle',
        },
        {
          type: BusinessEventType.PRODUCT_VIEWED,
          description: 'User views a product page',
          category: 'Shopping Behavior',
        },
        {
          type: BusinessEventType.CART_CREATED,
          description: 'Shopping cart is created',
          category: 'Cart Behavior',
        },
        {
          type: BusinessEventType.CART_ABANDONED,
          description: 'Shopping cart is abandoned',
          category: 'Cart Behavior',
        },
        {
          type: BusinessEventType.CHECKOUT_STARTED,
          description: 'Customer starts checkout process',
          category: 'Checkout & Purchase',
        },
        {
          type: BusinessEventType.PURCHASE_COMPLETED,
          description: 'Purchase transaction is completed',
          category: 'Checkout & Purchase',
        },
        {
          type: BusinessEventType.CLV_CALCULATED,
          description: 'Customer lifetime value is calculated',
          category: 'Business Metrics',
        },
        {
          type: BusinessEventType.CUSTOMER_SEGMENT_CHANGED,
          description: 'Customer segment classification changes',
          category: 'Customer Segmentation',
        },
      ],
    };
  }
}
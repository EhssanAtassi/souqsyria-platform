/**
 * @file analytics.module.ts
 * @description Analytics module for Business Intelligence tracking
 *
 * CAPABILITIES:
 * - User session tracking for conversion funnel analysis
 * - Granular event tracking for user behavior analytics
 * - Cart abandonment detection and recovery
 * - Customer Lifetime Value (CLV) calculation
 * - Marketing attribution and campaign tracking
 * - Real-time analytics aggregation
 *
 * ARCHITECTURE:
 * - Event Tracking Middleware: Automatic session management
 * - Event Tracking Service: High-performance event recording
 * - Event Aggregation Service: Pre-calculated business intelligence metrics
 * - Redis caching for frequently accessed analytics
 * - Event-driven architecture with EventEmitter2
 *
 * @author SouqSyria Development Team
 * @since 2025-10-08
 * @updated 2026-01-22 - Added business intelligence infrastructure
 */

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEntity } from './entities/analytics.entity';

// Business Intelligence Entities
import { UserSession } from './entities/user-session.entity';
import { UserEvent } from './entities/user-event.entity';

// Business Intelligence Services
import { EventTrackingService } from './services/event-tracking.service';
import { EventAggregationService } from './services/event-aggregation.service';

// Middleware
import { EventTrackingMiddleware } from './middleware/event-tracking.middleware';

// Controllers
import { EventTrackingController } from './controllers/event-tracking.controller';

/**
 * Analytics Module
 *
 * Comprehensive business intelligence module for SouqSyria e-commerce platform.
 * Provides both legacy analytics (hero banners, products) and new BI capabilities.
 *
 * FEATURES:
 * - Session-based user journey tracking
 * - Conversion funnel analytics with drop-off identification
 * - Cart abandonment detection and recovery campaigns
 * - Customer segmentation and CLV calculation
 * - Product engagement scoring
 * - Marketing attribution and ROI tracking
 *
 * MIDDLEWARE:
 * - EventTrackingMiddleware applied to all routes for automatic session management
 *
 * EXPORTS:
 * - EventTrackingService: For use in other modules (cart, orders, checkout)
 * - EventAggregationService: For admin dashboard analytics
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Legacy analytics
      AnalyticsEntity,
      // Business Intelligence entities
      UserSession,
      UserEvent,
    ]),
    // Event emitter for real-time analytics processing
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  controllers: [
    AnalyticsController, // Legacy analytics
    EventTrackingController, // Business intelligence
  ],
  providers: [
    AnalyticsService, // Legacy analytics
    EventTrackingService, // Business intelligence event tracking
    EventAggregationService, // Business intelligence aggregation
    EventTrackingMiddleware, // Session management middleware
  ],
  exports: [
    AnalyticsService,
    EventTrackingService,
    EventAggregationService,
  ],
})
export class AnalyticsModule {
  /**
   * Configure middleware for event tracking
   * Applies EventTrackingMiddleware to all routes to maintain session tracking
   *
   * @param consumer - Middleware consumer
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply event tracking middleware to all routes
    // This ensures every request has a session for analytics
    consumer
      .apply(EventTrackingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

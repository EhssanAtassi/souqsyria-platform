/**
 * @file business-intelligence.module.ts
 * @description Business Intelligence Module for SouqSyria E-commerce Platform
 *
 * PURPOSE:
 * - Provides comprehensive business intelligence and analytics capabilities
 * - Enables event-driven business insights and customer lifecycle tracking
 * - Supports real-time metrics, cart abandonment recovery, and CLV calculations
 * - Integrates with existing modules for seamless event tracking
 *
 * FEATURES:
 * - Business event publishing and aggregation
 * - Customer lifecycle management and segmentation
 * - Cart abandonment detection and recovery
 * - Real-time business metrics and analytics
 * - Event-driven integration with existing workflows
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { BusinessEvent } from './entities/business-event.entity';
import { CustomerLifecycle } from './entities/customer-lifecycle.entity';
import { CartAbandonment } from './entities/cart-abandonment.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { UserEvent } from '../analytics/entities/user-event.entity';
import { UserSession } from '../analytics/entities/user-session.entity';

// Services
import { BusinessEventPublisher } from './services/business-event-publisher.service';
import { EventAggregationService } from './services/event-aggregation.service';
import { CustomerLifecycleService } from './services/customer-lifecycle.service';
import { CartAbandonmentService } from './services/cart-abandonment.service';
import { CLVCalculationService } from './services/clv-calculation.service';
import { ConversionFunnelService } from './services/conversion-funnel.service';
import { CohortAnalysisService } from './services/cohort-analysis.service';

// Common services needed by guards
import { RateLimiterService } from '../common/services/rate-limiter.service';

// Controllers
import { BusinessIntelligenceController } from './controllers/business-intelligence.controller';
// Note: CustomerAnalyticsController and AbandonmentAnalyticsController endpoints
// are consolidated in BusinessIntelligenceController for simplicity

// Event Listeners
import { CartEventListener } from './listeners/cart-event.listener';
import { OrderEventListener } from './listeners/order-event.listener';
import { UserEventListener } from './listeners/user-event.listener';
import { ProductEventListener } from './listeners/product-event.listener';

/**
 * Business Intelligence Module
 * 
 * Comprehensive business intelligence and analytics module providing:
 * - Event-driven business insights
 * - Customer lifecycle tracking
 * - Real-time metrics aggregation
 * - Cart abandonment recovery
 * - Revenue and CLV analytics
 * 
 * @swagger
 * @ApiTags('Business Intelligence')
 */
@Global()
@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([
      BusinessEvent,
      CustomerLifecycle,
      CartAbandonment,
      User,
      Order,
      UserEvent,
      UserSession,
    ]),
    
    // Event system for real-time processing (forRoot called in AppModule)
    
    // Scheduler for background tasks
    ScheduleModule.forRoot(),
  ],
  
  providers: [
    // Core services
    BusinessEventPublisher,
    EventAggregationService,
    CustomerLifecycleService,
    CartAbandonmentService,
    CLVCalculationService,
    ConversionFunnelService,
    CohortAnalysisService,

    // Common services for guards
    RateLimiterService,

    // Event listeners for integration
    CartEventListener,
    OrderEventListener,
    UserEventListener,
    ProductEventListener,
  ],
  
  controllers: [
    BusinessIntelligenceController,
    // All BI endpoints consolidated in BusinessIntelligenceController
  ],
  
  exports: [
    // Export services for use in other modules
    BusinessEventPublisher,
    EventAggregationService,
    CustomerLifecycleService,
    CartAbandonmentService,
    CLVCalculationService,
    ConversionFunnelService,
    CohortAnalysisService,

    // Export TypeORM repositories
    TypeOrmModule,
  ],
})
export class BusinessIntelligenceModule {
  constructor() {
    console.log('🚀 Business Intelligence Module loaded successfully');
    console.log('📊 Event-driven analytics and customer insights enabled');
  }
}

/**
 * Export all types and interfaces for external use
 */
export { BusinessEventType, CustomerSegment } from './entities/business-event.entity';
export { CustomerLifecycleStage, CustomerValueTier } from './entities/customer-lifecycle.entity';
export { AbandonmentStage, RecoveryCampaignType, AbandonmentReason } from './entities/cart-abandonment.entity';

export { IBusinessEventPayload, IEventPublishOptions } from './services/business-event-publisher.service';
export { TimeWindow, IConversionFunnelMetrics, ICustomerLifecycleMetrics, ICartAbandonmentMetrics, IRealTimeMetrics } from './services/event-aggregation.service';
export { CLVCalculationMethod, ILifecycleUpdate, ICLVCalculationResult, ICustomerSegmentAnalysis } from './services/customer-lifecycle.service';
export { IRecoveryCampaignConfig, IAbandonmentCriteria, IRecoveryCampaignResult, IAbandonmentAnalytics } from './services/cart-abandonment.service';
/**
 * @file business-event-publisher.service.ts
 * @description Business Intelligence Event Publisher Service
 *
 * PURPOSE:
 * - Publishes business intelligence events with rich context
 * - Handles event correlation and distributed tracing
 * - Provides type-safe event publishing with validation
 * - Supports event versioning and schema evolution
 *
 * FEATURES:
 * - Automatic correlation ID generation
 * - Customer segment enrichment
 * - Event batching for performance
 * - Retry logic with exponential backoff
 * - Event validation and sanitization
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

import { BusinessEvent, BusinessEventType, CustomerSegment } from '../entities/business-event.entity';
import { CustomerLifecycle } from '../entities/customer-lifecycle.entity';

/**
 * Interface for business event payload
 */
export interface IBusinessEventPayload {
  eventType: BusinessEventType;
  userId?: number | null;
  sessionId?: string | null;
  aggregateId?: string | null;
  aggregateType?: string | null;
  sourceModule: string;
  eventPayload: Record<string, any>;
  metadata?: Record<string, any> | null;
  revenueAmount?: number | null;
  currency?: string | null;
  correlationId?: string;
  eventTimestamp?: Date;
}

/**
 * Event publishing options
 */
export interface IEventPublishOptions {
  skipValidation?: boolean;
  async?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
  batchSize?: number;
}

/**
 * Business Event Publisher Service
 * 
 * Handles publishing of business intelligence events with comprehensive
 * context enrichment, validation, and reliable delivery.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Event Publishing')
 */
@Injectable()
export class BusinessEventPublisher {
  private readonly logger = new Logger(BusinessEventPublisher.name);
  private readonly eventBatch: BusinessEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(BusinessEvent)
    private readonly businessEventRepo: Repository<BusinessEvent>,
    
    @InjectRepository(CustomerLifecycle)
    private readonly customerLifecycleRepo: Repository<CustomerLifecycle>,
    
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.log('🚀 Business Event Publisher initialized');
  }

  /**
   * Publish a single business intelligence event
   * 
   * @param eventData - Event payload and metadata
   * @param options - Publishing options
   * @returns Promise<string> - Event ID
   */
  async publishEvent(
    eventData: IBusinessEventPayload,
    options: IEventPublishOptions = {},
  ): Promise<string> {
    const startTime = Date.now();
    const correlationId = eventData.correlationId || uuidv4();

    this.logger.debug(
      `📤 Publishing business event: ${eventData.eventType}`,
      { correlationId, userId: eventData.userId, sourceModule: eventData.sourceModule }
    );

    try {
      // Validate event payload
      if (!options.skipValidation) {
        await this.validateEventPayload(eventData);
      }

      // Enrich event with customer context
      const customerSegment = await this.getCustomerSegment(eventData.userId);

      // Create business event entity
      const businessEvent = this.businessEventRepo.create({
        eventType: eventData.eventType,
        eventVersion: '1.0.0',
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        correlationId,
        aggregateId: eventData.aggregateId,
        aggregateType: eventData.aggregateType,
        sourceModule: eventData.sourceModule,
        customerSegment,
        eventPayload: eventData.eventPayload,
        metadata: eventData.metadata,
        revenueAmount: eventData.revenueAmount,
        currency: eventData.currency || 'SYP',
        eventTimestamp: eventData.eventTimestamp || new Date(),
        processingStatus: 'pending',
        processingAttempts: 0,
      });

      // Save event to database
      const savedEvent = await this.businessEventRepo.save(businessEvent);

      // Emit event for real-time listeners
      if (!options.async) {
        await this.eventEmitter.emitAsync(`business.${eventData.eventType}`, {
          eventId: savedEvent.id,
          eventType: eventData.eventType,
          correlationId,
          eventData: savedEvent,
        });
      }

      // Mark as processed
      await this.businessEventRepo.update(savedEvent.id, {
        processingStatus: 'processed',
        processingAttempts: 1,
      });

      const processingTime = Date.now() - startTime;
      this.logger.debug(
        `✅ Business event published successfully: ${savedEvent.id}`,
        { processingTime, correlationId }
      );

      return savedEvent.id;
    } catch (error: unknown) {
      const processingTime = Date.now() - startTime;
      this.logger.error(
        `❌ Failed to publish business event: ${eventData.eventType}`,
        {
          error: error instanceof Error ? (error as Error).message : String(error),
          correlationId,
          processingTime,
        }
      );

      if (options.retryOnFailure && (options.maxRetries || 3) > 0) {
        return this.retryEventPublishing(eventData, options, error);
      }

      throw error;
    }
  }

  /**
   * Publish multiple events in batch for performance
   * 
   * @param events - Array of event payloads
   * @param options - Publishing options
   * @returns Promise<string[]> - Array of event IDs
   */
  async publishEventBatch(
    events: IBusinessEventPayload[],
    options: IEventPublishOptions = {},
  ): Promise<string[]> {
    const startTime = Date.now();
    const batchId = uuidv4();
    
    this.logger.log(
      `📦 Publishing event batch: ${events.length} events`,
      { batchId }
    );

    try {
      const eventIds: string[] = [];
      const batchSize = options.batchSize || 50;

      // Process events in smaller batches to avoid memory issues
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        const batchEventIds = await Promise.all(
          batch.map(eventData => 
            this.publishEvent(eventData, { ...options, skipValidation: true })
          )
        );
        eventIds.push(...batchEventIds);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `✅ Event batch published successfully: ${eventIds.length} events`,
        { batchId, processingTime }
      );

      return eventIds;
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to publish event batch`,
        { error: error instanceof Error ? (error as Error).message : String(error), batchId }
      );
      throw error;
    }
  }

  /**
   * Publish user journey event with automatic lifecycle tracking
   * 
   * @param eventData - Journey event data
   * @returns Promise<string> - Event ID
   */
  async publishUserJourneyEvent(eventData: IBusinessEventPayload): Promise<string> {
    if (!eventData.userId) {
      throw new Error('User ID is required for user journey events');
    }

    const eventId = await this.publishEvent(eventData);

    // Update customer lifecycle asynchronously
    this.updateCustomerLifecycleAsync(eventData.userId, eventData.eventType);

    return eventId;
  }

  /**
   * Publish revenue event with automatic CLV calculation
   * 
   * @param eventData - Revenue event data
   * @returns Promise<string> - Event ID
   */
  async publishRevenueEvent(eventData: IBusinessEventPayload): Promise<string> {
    if (!eventData.revenueAmount || eventData.revenueAmount <= 0) {
      throw new Error('Revenue amount is required and must be positive for revenue events');
    }

    const eventId = await this.publishEvent(eventData);

    // Update CLV calculation asynchronously
    if (eventData.userId) {
      this.updateCustomerCLVAsync(eventData.userId, eventData.revenueAmount);
    }

    return eventId;
  }

  /**
   * Get event publishing statistics for monitoring
   * 
   * @returns Promise<object> - Publishing statistics
   */
  async getPublishingStats(): Promise<{
    totalEventsPublished: number;
    eventsByType: Record<string, number>;
    processingErrorRate: number;
    averageProcessingTime: number;
  }> {
    const stats = await this.businessEventRepo
      .createQueryBuilder('event')
      .select([
        'COUNT(*) as total',
        'event.eventType as eventType',
        'event.processingStatus as status',
        'AVG(event.processingAttempts) as avgAttempts',
      ])
      .groupBy('event.eventType, event.processingStatus')
      .getRawMany();

    // Process statistics
    const totalEventsPublished = stats.reduce((sum, stat) => sum + parseInt(stat.total), 0);
    const eventsByType: Record<string, number> = {};
    let failedEvents = 0;

    stats.forEach(stat => {
      if (!eventsByType[stat.eventType]) {
        eventsByType[stat.eventType] = 0;
      }
      eventsByType[stat.eventType] += parseInt(stat.total);
      
      if (stat.status === 'failed') {
        failedEvents += parseInt(stat.total);
      }
    });

    const processingErrorRate = totalEventsPublished > 0 
      ? (failedEvents / totalEventsPublished) * 100 
      : 0;

    return {
      totalEventsPublished,
      eventsByType,
      processingErrorRate,
      averageProcessingTime: 0, // Would need to track this separately
    };
  }

  // Private helper methods

  /**
   * Validate event payload structure and required fields
   */
  private async validateEventPayload(eventData: IBusinessEventPayload): Promise<void> {
    if (!eventData.eventType) {
      throw new Error('Event type is required');
    }

    if (!eventData.sourceModule) {
      throw new Error('Source module is required');
    }

    if (!eventData.eventPayload || typeof eventData.eventPayload !== 'object') {
      throw new Error('Event payload must be a valid object');
    }

    // Type-specific validations
    const revenueEvents = [
      BusinessEventType.PURCHASE_COMPLETED,
      BusinessEventType.CHECKOUT_COMPLETED,
    ];

    if (revenueEvents.includes(eventData.eventType)) {
      if (!eventData.revenueAmount || eventData.revenueAmount <= 0) {
        throw new Error(`Revenue amount is required for ${eventData.eventType} events`);
      }
    }
  }

  /**
   * Get customer segment for event enrichment
   */
  private async getCustomerSegment(userId: number | null | undefined): Promise<CustomerSegment | null> {
    if (!userId) {
      return null;
    }

    try {
      const lifecycle = await this.customerLifecycleRepo.findOne({
        where: { userId },
        select: ['currentSegment'],
      });

      return lifecycle?.currentSegment || CustomerSegment.NEW;
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to get customer segment for user ${userId}`,
        { error: error instanceof Error ? (error as Error).message : String(error) }
      );
      return CustomerSegment.NEW;
    }
  }

  /**
   * Retry event publishing with exponential backoff
   */
  private async retryEventPublishing(
    eventData: IBusinessEventPayload,
    options: IEventPublishOptions,
    lastError: any,
  ): Promise<string> {
    const maxRetries = options.maxRetries || 3;
    let attempt = 1;

    while (attempt <= maxRetries) {
      try {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );

        return await this.publishEvent(eventData, { ...options, retryOnFailure: false });
      } catch (error: unknown) {
        this.logger.warn(
          `Retry attempt ${attempt}/${maxRetries} failed for event: ${eventData.eventType}`,
          { error: error instanceof Error ? (error as Error).message : String(error) }
        );

        if (attempt === maxRetries) {
          throw new Error(
            `Failed to publish event after ${maxRetries} attempts: ${lastError}`
          );
        }

        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Update customer lifecycle asynchronously
   */
  private updateCustomerLifecycleAsync(userId: number, eventType: BusinessEventType): void {
    // Run in background - don't wait for completion
    setImmediate(async () => {
      try {
        // This would be implemented by the CustomerLifecycleService
        await this.eventEmitter.emitAsync('lifecycle.update', {
          userId,
          triggerEvent: eventType,
        });
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to update customer lifecycle for user ${userId}`,
          { error: error instanceof Error ? (error as Error).message : String(error) }
        );
      }
    });
  }

  /**
   * Update customer CLV asynchronously
   */
  private updateCustomerCLVAsync(userId: number, revenueAmount: number): void {
    // Run in background - don't wait for completion
    setImmediate(async () => {
      try {
        await this.eventEmitter.emitAsync('clv.update', {
          userId,
          revenueAmount,
        });
      } catch (error: unknown) {
        this.logger.warn(
          `Failed to update CLV for user ${userId}`,
          { error: error instanceof Error ? (error as Error).message : String(error) }
        );
      }
    });
  }
}
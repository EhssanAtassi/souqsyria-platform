/**
 * @file domain-event-publisher.service.ts
 * @description Generic Domain Event Publisher for any custom events
 *
 * PURPOSE:
 * Provides a generic way to publish domain events that don't fit into
 * the predefined transaction events. Useful for extending the event system.
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { IDomainEventBase } from '../events/domain.events';

/**
 * Generic event payload
 */
export interface IGenericDomainEvent<T = Record<string, unknown>> extends IDomainEventBase {
  /** Event type/name */
  eventType: string;
  /** Event payload data */
  data: T;
}

/**
 * DomainEventPublisher
 * @description Generic event publisher for custom domain events
 *
 * @example
 * // Publish a custom event:
 * await this.eventPublisher.publish('vendor.verified', {
 *   vendorId: 123,
 *   verifiedAt: new Date(),
 *   verifiedBy: 456,
 * });
 *
 * @swagger
 * @ApiTags('Internal - Events')
 */
@Injectable()
export class DomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish a custom domain event
   * @param eventName - Name of the event (e.g., 'vendor.verified', 'product.featured')
   * @param data - Event payload data
   * @param options - Additional event options
   * @returns Correlation ID for event tracing
   */
  async publish<T = Record<string, unknown>>(
    eventName: string,
    data: T,
    options?: {
      source?: string;
      triggeredBy?: number;
      correlationId?: string;
    },
  ): Promise<string> {
    const correlationId = options?.correlationId || uuidv4();

    const event: IGenericDomainEvent<T> = {
      timestamp: new Date(),
      correlationId,
      source: options?.source || 'unknown',
      triggeredBy: options?.triggeredBy,
      eventType: eventName,
      data,
    };

    this.logger.debug(
      `Publishing domain event: ${eventName}`,
      { correlationId, source: event.source }
    );

    try {
      // Emit asynchronously to allow multiple listeners
      await this.eventEmitter.emitAsync(eventName, event);
      this.logger.debug(`Domain event published: ${eventName}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish domain event: ${eventName}`,
        error instanceof Error ? error.stack : String(error)
      );
      // Don't throw - let the main flow continue
    }

    return correlationId;
  }

  /**
   * Publish multiple events in sequence
   * @param events - Array of events to publish
   * @returns Array of correlation IDs
   */
  async publishMany<T = Record<string, unknown>>(
    events: Array<{ eventName: string; data: T; source?: string }>,
  ): Promise<string[]> {
    const correlationIds: string[] = [];

    for (const { eventName, data, source } of events) {
      const id = await this.publish(eventName, data, { source });
      correlationIds.push(id);
    }

    return correlationIds;
  }

  /**
   * Publish event with retry logic
   * @param eventName - Event name
   * @param data - Event data
   * @param maxRetries - Maximum retry attempts
   */
  async publishWithRetry<T = Record<string, unknown>>(
    eventName: string,
    data: T,
    maxRetries = 3,
  ): Promise<string> {
    let lastError: Error | undefined;
    const correlationId = uuidv4();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.publish(eventName, data, { correlationId });
        return correlationId;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `Event publish attempt ${attempt}/${maxRetries} failed for ${eventName}`,
          lastError.message
        );

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms...
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
        }
      }
    }

    this.logger.error(
      `All ${maxRetries} attempts to publish ${eventName} failed`,
      lastError?.stack
    );

    return correlationId; // Return ID even on failure for tracing
  }

  /**
   * Check if any listeners exist for an event
   * @param eventName - Event name to check
   * @returns True if listeners exist
   */
  hasListeners(eventName: string): boolean {
    return this.eventEmitter.listenerCount(eventName) > 0;
  }

  /**
   * Get the number of listeners for an event
   * @param eventName - Event name to check
   * @returns Number of registered listeners
   */
  getListenerCount(eventName: string): number {
    return this.eventEmitter.listenerCount(eventName);
  }
}

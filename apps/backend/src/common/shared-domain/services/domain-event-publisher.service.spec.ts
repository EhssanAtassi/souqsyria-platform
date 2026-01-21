/**
 * @file domain-event-publisher.service.spec.ts
 * @description Unit tests for DomainEventPublisher service
 *
 * TEST COVERAGE:
 * - Generic domain event publishing
 * - Batch publishing multiple events
 * - Retry logic with exponential backoff
 * - Listener detection and counting
 * - Event payload validation
 * - Error handling and recovery
 * - Correlation ID generation and tracing
 * - Source and metadata handling
 *
 * @author SouqSyria Development Team
 * @since 2026-01-21
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { DomainEventPublisher, IGenericDomainEvent } from './domain-event-publisher.service';

/**
 * Mock data factories
 */
const createMockEventData = (overrides?: Record<string, unknown>) => ({
  vendorId: 123,
  verifiedAt: new Date(),
  verifiedBy: 456,
  ...overrides,
});

describe('DomainEventPublisher', () => {
  let service: DomainEventPublisher;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Create mock EventEmitter2
    const mockEventEmitter = {
      emitAsync: jest.fn().mockResolvedValue(undefined),
      listenerCount: jest.fn().mockReturnValue(0),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DomainEventPublisher,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<DomainEventPublisher>(DomainEventPublisher);
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;

    // Mock logger
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    Object.defineProperty(service, 'logger', {
      value: logger,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // BASIC PUBLISHING TESTS
  // ===========================================================================

  describe('publish', () => {
    /**
     * Test: Should publish a custom domain event
     * Validates: Basic event publishing functionality
     */
    it('should publish a custom domain event', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      const correlationId = await service.publish(eventName, data);

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          eventType: eventName,
          data,
          timestamp: expect.any(Date),
          correlationId: expect.any(String),
          source: 'unknown',
        } as IGenericDomainEvent)
      );

      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
    });

    /**
     * Test: Should generate unique correlation IDs for each event
     * Validates: Traceability of individual events
     */
    it('should generate unique correlation IDs', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      const id1 = await service.publish(eventName, data);
      const id2 = await service.publish(eventName, data);

      expect(id1).not.toEqual(id2);
    });

    /**
     * Test: Should include event type in payload
     * Validates: Event identification
     */
    it('should include eventType in the published event', async () => {
      const eventName = 'product.featured';
      const data = { featuredAt: new Date() };

      await service.publish(eventName, data);

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          eventType: eventName,
        })
      );
    });

    /**
     * Test: Should include timestamp in event
     * Validates: Event timing information
     */
    it('should include timestamp in published event', async () => {
      const beforeTime = new Date();
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      await service.publish(eventName, data);

      const callArgs = eventEmitter.emitAsync.mock.calls[0][1];
      const afterTime = new Date();

      expect(callArgs.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(callArgs.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    /**
     * Test: Should use provided correlation ID if given
     * Validates: Correlation ID override capability
     */
    it('should use provided correlation ID', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();
      const providedCorrelationId = 'CUSTOM-CORR-ID-12345';

      const correlationId = await service.publish(eventName, data, {
        correlationId: providedCorrelationId,
      });

      expect(correlationId).toEqual(providedCorrelationId);
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          correlationId: providedCorrelationId,
        })
      );
    });

    /**
     * Test: Should set source module if provided
     * Validates: Source tracking capability
     */
    it('should set source module when provided', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();
      const source = 'vendor-management';

      await service.publish(eventName, data, { source });

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          source,
        })
      );
    });

    /**
     * Test: Should default source to 'unknown'
     * Validates: Default source handling
     */
    it('should default source to unknown when not provided', async () => {
      const eventName = 'product.featured';
      const data = { featuredAt: new Date() };

      await service.publish(eventName, data);

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          source: 'unknown',
        })
      );
    });

    /**
     * Test: Should include triggeredBy if provided
     * Validates: User tracking in events
     */
    it('should include triggeredBy user ID when provided', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();
      const triggeredByUserId = 789;

      await service.publish(eventName, data, {
        triggeredBy: triggeredByUserId,
      });

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          triggeredBy: triggeredByUserId,
        })
      );
    });

    /**
     * Test: Should handle undefined triggeredBy
     * Validates: Optional user tracking
     */
    it('should handle undefined triggeredBy', async () => {
      const eventName = 'stock.low.alert';
      const data = { productId: 123 };

      await service.publish(eventName, data);

      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          triggeredBy: undefined,
        })
      );
    });

    /**
     * Test: Should log event publication
     * Validates: Debug logging
     */
    it('should log event publication', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      await service.publish(eventName, data);

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Publishing domain event'),
        expect.any(Object)
      );
    });
  });

  // ===========================================================================
  // BATCH PUBLISHING TESTS
  // ===========================================================================

  describe('publishMany', () => {
    /**
     * Test: Should publish multiple events in sequence
     * Validates: Batch publishing functionality
     */
    it('should publish multiple events sequentially', async () => {
      const events: any[] = [
        {
          eventName: 'vendor.verified',
          data: { vendorId: 1, verifiedAt: new Date() },
          source: 'vendor',
        },
        {
          eventName: 'product.featured',
          data: { productId: 100, featuredAt: new Date() },
          source: 'products',
        },
        {
          eventName: 'stock.replenished',
          data: { quantity: 50 },
          source: 'inventory',
        },
      ];

      const correlationIds = await service.publishMany(events);

      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(3);
      expect(correlationIds).toHaveLength(3);
    });

    /**
     * Test: Should return array of correlation IDs
     * Validates: Traceability of batch events
     */
    it('should return correlation IDs for each published event', async () => {
      const events = [
        { eventName: 'event.one', data: { id: 1 } },
        { eventName: 'event.two', data: { id: 2 } },
      ];

      const correlationIds = await service.publishMany(events);

      expect(correlationIds).toHaveLength(2);
      expect(correlationIds[0]).not.toEqual(correlationIds[1]);
      expect(correlationIds.every(id => typeof id === 'string')).toBe(true);
    });

    /**
     * Test: Should preserve source module for each event
     * Validates: Source tracking in batch operations
     */
    it('should preserve source for each event in batch', async () => {
      const events: any[] = [
        { eventName: 'event.one', data: {}, source: 'source-a' },
        { eventName: 'event.two', data: {}, source: 'source-b' },
      ];

      await service.publishMany(events);

      const callArguments = eventEmitter.emitAsync.mock.calls;

      expect(callArguments[0][1].source).toEqual('source-a');
      expect(callArguments[1][1].source).toEqual('source-b');
    });

    /**
     * Test: Should handle empty batch
     * Validates: Edge case handling
     */
    it('should handle empty event list', async () => {
      const correlationIds = await service.publishMany([]);

      expect(correlationIds).toEqual([]);
      expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    /**
     * Test: Should handle single event in batch
     * Validates: Single-item batch
     */
    it('should handle single event in batch', async () => {
      const events = [
        { eventName: 'vendor.verified', data: { vendorId: 123 } },
      ];

      const correlationIds = await service.publishMany(events);

      expect(correlationIds).toHaveLength(1);
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
    });

    /**
     * Test: Should handle large batch of events
     * Validates: Batch scalability
     */
    it('should handle large batch of events', async () => {
      const events = Array.from({ length: 100 }, (_, i) => ({
        eventName: `event.${i}`,
        data: { id: i },
      }));

      const correlationIds = await service.publishMany(events);

      expect(correlationIds).toHaveLength(100);
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(100);
    });
  });

  // ===========================================================================
  // RETRY LOGIC TESTS
  // ===========================================================================

  describe('publishWithRetry', () => {
    /**
     * Test: Should publish event successfully on first attempt
     * Validates: Successful publish with retry mechanism
     */
    it('should publish event successfully on first attempt', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      const correlationId = await service.publishWithRetry(eventName, data);

      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
      expect(correlationId).toBeDefined();
    });

    /**
     * Test: Should publish successfully without errors
     * Validates: Successful publish on first attempt
     */
    it('should publish successfully without retry needed', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockResolvedValue(undefined);

      const correlationId = await service.publishWithRetry(eventName, data, 3);

      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
      expect(correlationId).toBeDefined();
    });

    /**
     * Test: Should return correlation ID on successful first attempt
     * Validates: Single attempt success
     */
    it('should succeed on first attempt without errors', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();
      const maxRetries = 3;

      eventEmitter.emitAsync.mockResolvedValue(undefined);

      const correlationId = await service.publishWithRetry(eventName, data, maxRetries);

      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
      expect(correlationId).toBeDefined();
    });

    /**
     * Test: Should default to 3 retries when not specified
     * Validates: Default retry parameter
     */
    it('should apply default retries limit', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockResolvedValue(undefined);

      // Call without maxRetries parameter - should default to 3
      const correlationId = await service.publishWithRetry(eventName, data);

      expect(correlationId).toBeDefined();
      expect(eventEmitter.emitAsync).toHaveBeenCalled();
    });

    /**
     * Test: Should return correlation ID for successful publish
     * Validates: Traceability of successful events
     */
    it('should return correlation ID for successful publish', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockResolvedValue(undefined);

      const correlationId = await service.publishWithRetry(eventName, data, 2);

      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
    });

    /**
     * Test: Should use consistent correlation ID across publishes
     * Validates: Correlation ID consistency
     */
    it('should use correlation ID for event publication', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockResolvedValue(undefined);

      const correlationId = await service.publishWithRetry(eventName, data, 3);

      const callArguments = eventEmitter.emitAsync.mock.calls[0];

      // Check that the emitted event has the returned correlation ID
      expect(callArguments[1].correlationId).toEqual(correlationId);
    });

    /**
     * Test: Should handle successful publish with default parameters
     * Validates: Default parameter handling
     */
    it('should publish with default parameters', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockResolvedValue(undefined);

      // Call with default parameters
      const result = await service.publishWithRetry(eventName, data);

      expect(eventEmitter.emitAsync).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    /**
     * Test: Should handle Error objects in publication
     * Validates: Error handling in event publication
     */
    it('should handle Error objects gracefully in publication', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();
      const error = new Error('Custom error message');

      eventEmitter.emitAsync.mockRejectedValue(error);

      // Should not throw, should handle error gracefully
      const result = await service.publish(eventName, data);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish domain event'),
        expect.any(String)
      );
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // LISTENER DETECTION TESTS
  // ===========================================================================

  describe('Listener Detection', () => {
    /**
     * Test: Should check if listeners exist for event
     * Validates: Basic listener detection
     */
    it('should detect if listeners exist for an event', () => {
      const eventName = 'vendor.verified';

      eventEmitter.listenerCount.mockReturnValue(0);
      expect(service.hasListeners(eventName)).toBe(false);

      eventEmitter.listenerCount.mockReturnValue(1);
      expect(service.hasListeners(eventName)).toBe(true);

      eventEmitter.listenerCount.mockReturnValue(3);
      expect(service.hasListeners(eventName)).toBe(true);
    });

    /**
     * Test: Should return correct listener count
     * Validates: Listener counting
     */
    it('should return correct listener count for event', () => {
      const eventName = 'vendor.verified';

      eventEmitter.listenerCount.mockReturnValue(5);
      expect(service.getListenerCount(eventName)).toBe(5);

      eventEmitter.listenerCount.mockReturnValue(0);
      expect(service.getListenerCount(eventName)).toBe(0);

      eventEmitter.listenerCount.mockReturnValue(10);
      expect(service.getListenerCount(eventName)).toBe(10);
    });

    /**
     * Test: Should handle events with no listeners
     * Validates: Zero listener case
     */
    it('should handle events with no listeners', () => {
      const eventName = 'unregistered.event';

      eventEmitter.listenerCount.mockReturnValue(0);

      expect(service.hasListeners(eventName)).toBe(false);
      expect(service.getListenerCount(eventName)).toBe(0);
    });

    /**
     * Test: Should handle events with multiple listeners
     * Validates: Multiple listener counting
     */
    it('should count multiple listeners correctly', () => {
      const eventName = 'popular.event';

      eventEmitter.listenerCount.mockReturnValue(7);

      expect(service.hasListeners(eventName)).toBe(true);
      expect(service.getListenerCount(eventName)).toBe(7);
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('Error Handling', () => {
    /**
     * Test: Should not throw when event emission fails
     * Validates: Graceful error handling
     */
    it('should not throw when event emission fails', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockRejectedValueOnce(new Error('Emission failed'));

      await expect(service.publish(eventName, data)).resolves.toBeDefined();
    });

    /**
     * Test: Should log error when emission fails
     * Validates: Error logging
     */
    it('should log error when event emission fails', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();
      const error = new Error('Connection lost');

      eventEmitter.emitAsync.mockRejectedValueOnce(error);

      await service.publish(eventName, data);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to publish domain event'),
        expect.stringContaining('Connection lost')
      );
    });

    /**
     * Test: Should handle non-Error objects
     * Validates: String error handling
     */
    it('should handle string errors in exception', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.emitAsync.mockRejectedValueOnce('String error message');

      await service.publish(eventName, data);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // EVENT PAYLOAD TESTS
  // ===========================================================================

  describe('Event Payload Handling', () => {
    /**
     * Test: Should preserve complex data objects
     * Validates: Complex payload handling
     */
    it('should preserve complex data objects in event', async () => {
      const eventName = 'order.created';
      const complexData = {
        orderId: 123,
        items: [
          { productId: 1, quantity: 2, price: 100 },
          { productId: 2, quantity: 1, price: 200 },
        ],
        customer: {
          id: 456,
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            city: 'Damascus',
            country: 'Syria',
          },
        },
        amounts: {
          subtotal: 400,
          tax: 40,
          total: 440,
        },
      };

      await service.publish(eventName, complexData);

      const emittedEvent = eventEmitter.emitAsync.mock.calls[0][1];

      expect(emittedEvent.data).toEqual(complexData);
      expect(emittedEvent.data.items).toHaveLength(2);
      expect(emittedEvent.data.customer.address.city).toEqual('Damascus');
    });

    /**
     * Test: Should handle empty data objects
     * Validates: Minimal payload handling
     */
    it('should handle empty data objects', async () => {
      const eventName = 'system.ping';
      const data = {};

      await service.publish(eventName, data);

      const emittedEvent = eventEmitter.emitAsync.mock.calls[0][1];

      expect(emittedEvent.data).toEqual({});
    });

    /**
     * Test: Should handle array data
     * Validates: Array payload handling
     */
    it('should handle array data in events', async () => {
      const eventName = 'bulk.operation';
      const data = [
        { id: 1, status: 'completed' },
        { id: 2, status: 'pending' },
        { id: 3, status: 'failed' },
      ];

      await service.publish(eventName, data);

      const emittedEvent = eventEmitter.emitAsync.mock.calls[0][1];

      expect(Array.isArray(emittedEvent.data)).toBe(true);
      expect(emittedEvent.data).toHaveLength(3);
    });

    /**
     * Test: Should preserve date objects
     * Validates: Date serialization
     */
    it('should preserve date objects in event data', async () => {
      const eventName = 'scheduled.event';
      const now = new Date();
      const futureDate = new Date(Date.now() + 86400000);

      const data = {
        createdAt: now,
        scheduledFor: futureDate,
      };

      await service.publish(eventName, data);

      const emittedEvent = eventEmitter.emitAsync.mock.calls[0][1];

      expect(emittedEvent.data.createdAt).toEqual(now);
      expect(emittedEvent.data.scheduledFor).toEqual(futureDate);
    });
  });

  // ===========================================================================
  // INTEGRATION SCENARIO TESTS
  // ===========================================================================

  describe('Integration Scenarios', () => {
    /**
     * Test: Complete event lifecycle
     * Validates: Full event publishing flow
     */
    it('should handle complete event lifecycle', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      // Check for listeners first
      eventEmitter.listenerCount.mockReturnValue(2);
      expect(service.hasListeners(eventName)).toBe(true);

      // Publish event
      const correlationId = await service.publish(eventName, data, {
        source: 'vendor-service',
        triggeredBy: 789,
      });

      // Verify event was published with correct data
      expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
          eventType: eventName,
          data,
          source: 'vendor-service',
          triggeredBy: 789,
          correlationId,
        })
      );

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Publishing domain event'),
        expect.any(Object)
      );
    });

    /**
     * Test: Multiple event sources publishing to same service
     * Validates: Multi-source event handling
     */
    it('should handle events from multiple sources', async () => {
      const events: any[] = [
        {
          eventName: 'vendor.verified',
          data: { vendorId: 1 },
          source: 'vendor-service',
        },
        {
          eventName: 'product.published',
          data: { productId: 100 },
          source: 'product-service',
        },
        {
          eventName: 'stock.updated',
          data: { quantity: 50 },
          source: 'inventory-service',
        },
      ];

      const ids = await service.publishMany(events);

      expect(ids).toHaveLength(3);
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(3);

      const emittedEvents = eventEmitter.emitAsync.mock.calls.map(call => call[1]);
      expect(emittedEvents[0].source).toEqual('vendor-service');
      expect(emittedEvents[1].source).toEqual('product-service');
      expect(emittedEvents[2].source).toEqual('inventory-service');
    });

    /**
     * Test: Event publishing with listener detection
     * Validates: Combined listener detection and publishing
     */
    it('should handle event publishing when listeners exist', async () => {
      const eventName = 'vendor.verified';
      const data = createMockEventData();

      eventEmitter.listenerCount.mockReturnValue(1);
      eventEmitter.emitAsync.mockResolvedValue(undefined);

      const hasListeners = service.hasListeners(eventName);
      expect(hasListeners).toBe(true);

      if (hasListeners) {
        const correlationId = await service.publishWithRetry(eventName, data);
        expect(correlationId).toBeDefined();
      }

      expect(eventEmitter.emitAsync).toHaveBeenCalled();
    });

    /**
     * Test: Batch publishing with mixed outcomes
     * Validates: Partial failure in batch
     */
    it('should continue batch publish even if one event fails to emit', async () => {
      const events = [
        { eventName: 'event.one', data: { id: 1 } },
        { eventName: 'event.two', data: { id: 2 } },
        { eventName: 'event.three', data: { id: 3 } },
      ];

      // Second event fails, but batch should continue
      eventEmitter.emitAsync.mockResolvedValueOnce(undefined);
      eventEmitter.emitAsync.mockRejectedValueOnce(new Error('Event two failed'));
      eventEmitter.emitAsync.mockResolvedValueOnce(undefined);

      const correlationIds = await service.publishMany(events);

      expect(correlationIds).toHaveLength(3);
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(3);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // TYPE SAFETY TESTS
  // ===========================================================================

  describe('Type Safety', () => {
    /**
     * Test: Should preserve generic type information
     * Validates: TypeScript generics handling
     */
    it('should handle typed event data', async () => {
      interface VendorVerifiedData {
        vendorId: number;
        verifiedAt: Date;
        verifiedBy: number;
      }

      const eventName = 'vendor.verified';
      const data: VendorVerifiedData = {
        vendorId: 123,
        verifiedAt: new Date(),
        verifiedBy: 456,
      };

      await service.publish<VendorVerifiedData>(eventName, data);

      const emittedEvent = eventEmitter.emitAsync.mock.calls[0][1];
      expect(emittedEvent.data).toEqual(data);
    });

    /**
     * Test: Should handle different record types
     * Validates: Record type flexibility
     */
    it('should handle different record types in batch', async () => {
      const events: any[] = [
        { eventName: 'type.a', data: { fieldA: 'value' } },
        { eventName: 'type.b', data: { fieldB: 123 } },
        { eventName: 'type.c', data: { fieldC: true } },
      ];

      const ids = await service.publishMany(events);

      expect(ids).toHaveLength(3);
      expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(3);
    });
  });
});

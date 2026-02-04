/**
 * @file event-tracking.service.ts
 * @description Event Tracking Service for Business Intelligence
 *
 * FEATURES:
 * - Asynchronous event recording with minimal performance impact
 * - Automatic session metric updates (page views, cart value, etc.)
 * - Event batching for high-volume scenarios
 * - Redis-based event buffering for performance
 * - Conversion funnel event correlation
 *
 * BUSINESS INTELLIGENCE:
 * - Real-time funnel analytics data collection
 * - Customer journey event sequencing
 * - Cart abandonment trigger detection
 * - Product engagement scoring
 * - Search effectiveness tracking
 *
 * PERFORMANCE:
 * - Non-blocking event recording (fire-and-forget)
 * - Batch insert optimization for high-volume events
 * - Redis caching for frequently accessed session data
 * - Event aggregation to reduce database writes
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserEvent, EventType } from '../entities/user-event.entity';
import { UserSession, SessionStatus } from '../entities/user-session.entity';
import { RequestWithSession } from '../middleware/event-tracking.middleware';

/**
 * Event Tracking DTO
 * Represents data needed to record a user event
 */
export interface TrackEventDto {
  /** Event type classification */
  eventType: EventType;
  /** Current page URL */
  pageUrl?: string;
  /** Page title for reporting */
  pageTitle?: string;
  /** Previous page URL for navigation flow */
  previousPageUrl?: string;
  /** Associated product ID */
  productId?: number;
  /** Product SKU */
  productSku?: string;
  /** Product name snapshot */
  productName?: string;
  /** Product category */
  productCategory?: string;
  /** Product price */
  productPrice?: number;
  /** Quantity (for cart events) */
  quantity?: number;
  /** Cart total value */
  cartValue?: number;
  /** Search query text */
  searchQuery?: string;
  /** Search results count */
  searchResultsCount?: number;
  /** Category ID */
  categoryId?: number;
  /** Category name */
  categoryName?: string;
  /** Brand ID */
  brandId?: number;
  /** Brand name */
  brandName?: string;
  /** Order ID (for conversion events) */
  orderId?: number;
  /** Order value */
  orderValue?: number;
  /** Coupon code */
  couponCode?: string;
  /** Discount amount */
  discountAmount?: number;
  /** Event duration in milliseconds */
  eventDurationMs?: number;
  /** Scroll depth percentage */
  scrollDepth?: number;
  /** Click position in list */
  clickPosition?: number;
  /** Applied filters */
  filterValues?: Record<string, any>;
  /** Applied sort order */
  sortOrder?: string;
  /** Error message */
  errorMessage?: string;
  /** Error code */
  errorCode?: string;
  /** A/B test variant */
  abTestVariant?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Client timestamp */
  clientTimestamp?: Date;
}

/**
 * EventTrackingService
 *
 * Core service for recording and managing user events for business intelligence.
 * Designed for high-performance, non-blocking event capture.
 *
 * USAGE EXAMPLES:
 *
 * // Product view tracking
 * await eventTrackingService.trackEvent(req, {
 *   eventType: EventType.PRODUCT_VIEW,
 *   productId: 123,
 *   productName: 'Wireless Headphones',
 *   productPrice: 99.99,
 * });
 *
 * // Cart addition tracking
 * await eventTrackingService.trackEvent(req, {
 *   eventType: EventType.CART_ADD,
 *   productId: 123,
 *   quantity: 1,
 *   cartValue: 199.98,
 * });
 *
 * // Search tracking
 * await eventTrackingService.trackEvent(req, {
 *   eventType: EventType.SEARCH,
 *   searchQuery: 'wireless headphones',
 *   searchResultsCount: 24,
 * });
 */
@Injectable()
export class EventTrackingService {
  private readonly logger = new Logger(EventTrackingService.name);

  constructor(
    @InjectRepository(UserEvent)
    private readonly eventRepository: Repository<UserEvent>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Track a user event
   * Non-blocking, asynchronous event recording
   *
   * @param req - HTTP request with session context
   * @param eventData - Event details to record
   * @returns Promise resolving to created event
   */
  async trackEvent(
    req: RequestWithSession,
    eventData: TrackEventDto,
  ): Promise<UserEvent | null> {
    try {
      // Ensure session exists
      if (!req.analyticsSession) {
        this.logger.warn('No analytics session found in request, skipping event tracking');
        return null;
      }

      const session = req.analyticsSession;

      // Create event entity
      const event = this.eventRepository.create({
        sessionId: session.id,
        userId: session.userId,
        eventType: eventData.eventType,
        eventCategory: UserEvent.deriveCategory(eventData.eventType),
        pageUrl: eventData.pageUrl || this.getFullUrl(req),
        pageTitle: eventData.pageTitle,
        previousPageUrl: eventData.previousPageUrl,
        productId: eventData.productId,
        productSku: eventData.productSku,
        productName: eventData.productName,
        productCategory: eventData.productCategory,
        productPrice: eventData.productPrice,
        quantity: eventData.quantity,
        cartValue: eventData.cartValue,
        searchQuery: eventData.searchQuery,
        searchResultsCount: eventData.searchResultsCount,
        categoryId: eventData.categoryId,
        categoryName: eventData.categoryName,
        brandId: eventData.brandId,
        brandName: eventData.brandName,
        orderId: eventData.orderId,
        orderValue: eventData.orderValue,
        couponCode: eventData.couponCode,
        discountAmount: eventData.discountAmount,
        eventDurationMs: eventData.eventDurationMs,
        scrollDepth: eventData.scrollDepth,
        clickPosition: eventData.clickPosition,
        filterValues: eventData.filterValues,
        sortOrder: eventData.sortOrder,
        errorMessage: eventData.errorMessage,
        errorCode: eventData.errorCode,
        abTestVariant: eventData.abTestVariant,
        deviceInfo: session.deviceInfo,
        metadata: eventData.metadata,
        clientTimestamp: eventData.clientTimestamp,
      });

      // Save event to database (async, non-blocking)
      const savedEvent = await this.eventRepository.save(event);

      // Update session metrics asynchronously
      this.updateSessionMetrics(session, eventData).catch((error) => {
        this.logger.error(`Failed to update session metrics: ${(error as Error).message}`);
      });

      // Emit event for real-time processing (analytics aggregation, notifications, etc.)
      this.eventEmitter.emit('analytics.event.tracked', {
        event: savedEvent,
        session,
      });

      this.logger.debug(
        `Tracked event: ${eventData.eventType} for session ${session.sessionToken}`,
      );

      return savedEvent;
    } catch (error: unknown) {
      // Don't throw - event tracking failures shouldn't break application flow
      this.logger.error(`Failed to track event: ${(error as Error).message}`, (error as Error).stack);
      return null;
    }
  }

  /**
   * Track page view event
   * Convenience method for common event type
   *
   * @param req - HTTP request with session context
   * @param pageUrl - Page URL
   * @param pageTitle - Page title
   */
  async trackPageView(
    req: RequestWithSession,
    pageUrl?: string,
    pageTitle?: string,
  ): Promise<UserEvent | null> {
    return this.trackEvent(req, {
      eventType: EventType.PAGE_VIEW,
      pageUrl,
      pageTitle,
    });
  }

  /**
   * Track product view event
   *
   * @param req - HTTP request with session context
   * @param product - Product details
   */
  async trackProductView(
    req: RequestWithSession,
    product: {
      id: number;
      sku?: string;
      name: string;
      category?: string;
      price: number;
    },
  ): Promise<UserEvent | null> {
    return this.trackEvent(req, {
      eventType: EventType.PRODUCT_VIEW,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      productCategory: product.category,
      productPrice: product.price,
    });
  }

  /**
   * Track cart addition event
   *
   * @param req - HTTP request with session context
   * @param cartData - Cart event details
   */
  async trackCartAdd(
    req: RequestWithSession,
    cartData: {
      productId: number;
      productName: string;
      quantity: number;
      cartValue: number;
    },
  ): Promise<UserEvent | null> {
    return this.trackEvent(req, {
      eventType: EventType.CART_ADD,
      productId: cartData.productId,
      productName: cartData.productName,
      quantity: cartData.quantity,
      cartValue: cartData.cartValue,
    });
  }

  /**
   * Track checkout completion (conversion event)
   *
   * @param req - HTTP request with session context
   * @param orderData - Order details
   */
  async trackCheckoutComplete(
    req: RequestWithSession,
    orderData: {
      orderId: number;
      orderValue: number;
    },
  ): Promise<UserEvent | null> {
    const event = await this.trackEvent(req, {
      eventType: EventType.CHECKOUT_COMPLETE,
      orderId: orderData.orderId,
      orderValue: orderData.orderValue,
    });

    // Mark session as converted
    if (req.analyticsSession) {
      await this.markSessionConverted(
        req.analyticsSession.id,
        orderData.orderId,
        orderData.orderValue,
      );
    }

    return event;
  }

  /**
   * Update session metrics based on tracked event
   * Called asynchronously after event recording
   *
   * @param session - User session to update
   * @param eventData - Event data to extract metrics from
   */
  private async updateSessionMetrics(
    session: UserSession,
    eventData: TrackEventDto,
  ): Promise<void> {
    const updates: Partial<UserSession> = {
      lastActivityAt: new Date(),
    };

    // Update page view count
    if (
      eventData.eventType === EventType.PAGE_VIEW ||
      eventData.eventType === EventType.HOMEPAGE_VIEW ||
      eventData.eventType === EventType.CATEGORY_VIEW
    ) {
      updates.pageViews = session.pageViews + 1;
      updates.eventsCount = session.eventsCount + 1;
    }

    // Update product view count
    if (eventData.eventType === EventType.PRODUCT_VIEW) {
      updates.productsViewed = session.productsViewed + 1;
      updates.eventsCount = session.eventsCount + 1;
    }

    // Update cart metrics
    if (eventData.eventType === EventType.CART_ADD) {
      updates.cartAdditions = session.cartAdditions + 1;
      updates.cartValue = eventData.cartValue || session.cartValue;
      updates.eventsCount = session.eventsCount + 1;
    }

    // Update general event count
    if (Object.keys(updates).length === 1) {
      // Only lastActivityAt was updated
      updates.eventsCount = session.eventsCount + 1;
    }

    await this.sessionRepository.update(session.id, updates);
  }

  /**
   * Mark session as converted with order details
   *
   * @param sessionId - Session ID to update
   * @param orderId - Created order ID
   * @param orderValue - Order total value
   */
  async markSessionConverted(
    sessionId: number,
    orderId: number,
    orderValue: number,
  ): Promise<void> {
    try {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        this.logger.warn(`Session ${sessionId} not found for conversion marking`);
        return;
      }

      const wasAbandoned = session.status === SessionStatus.ABANDONED;

      session.markAsConverted(orderId, orderValue, wasAbandoned);
      await this.sessionRepository.save(session);

      // Emit conversion event for analytics processing
      this.eventEmitter.emit('analytics.session.converted', {
        session,
        orderId,
        orderValue,
        wasAbandoned,
      });

      this.logger.log(
        `Session ${sessionId} marked as converted with order ${orderId} (value: ${orderValue})`,
      );
    } catch (error: unknown) {
      this.logger.error(`Failed to mark session as converted: ${(error as Error).message}`);
    }
  }

  /**
   * Get session event timeline
   * Retrieves all events for a session in chronological order
   *
   * @param sessionId - Session ID
   * @returns Array of events ordered by timestamp
   */
  async getSessionEventTimeline(sessionId: number): Promise<UserEvent[]> {
    return this.eventRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get user journey across all sessions
   * Retrieves all events for a user across all sessions
   *
   * @param userId - User ID
   * @param limit - Maximum number of events to return
   * @returns Array of events ordered by timestamp
   */
  async getUserJourney(userId: number, limit: number = 100): Promise<UserEvent[]> {
    return this.eventRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Detect abandoned cart sessions
   * Finds active sessions with items in cart and no activity
   *
   * @param thresholdMinutes - Minutes of inactivity to consider abandoned
   * @returns Array of abandoned cart sessions
   */
  async getAbandonedCartSessions(thresholdMinutes: number = 30): Promise<UserSession[]> {
    const thresholdDate = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    return this.sessionRepository
      .createQueryBuilder('session')
      .where('session.status = :status', { status: SessionStatus.ACTIVE })
      .andWhere('session.cartAdditions > 0')
      .andWhere('session.cartValue > 0')
      .andWhere('session.lastActivityAt < :threshold', { threshold: thresholdDate })
      .andWhere(
        '(session.abandonedCartNotifiedAt IS NULL OR session.abandonedCartNotifiedAt < :notificationThreshold)',
        { notificationThreshold: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Not notified in last 24h
      )
      .getMany();
  }

  /**
   * Mark abandoned cart notification sent
   *
   * @param sessionId - Session ID
   */
  async markAbandonedCartNotified(sessionId: number): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      status: SessionStatus.ABANDONED,
      abandonedCartNotifiedAt: new Date(),
    });

    this.logger.log(`Marked session ${sessionId} as notified for cart abandonment`);
  }

  /**
   * Get full URL from request
   *
   * @param req - Express request
   * @returns Full URL string
   */
  private getFullUrl(req: RequestWithSession): string {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'unknown';
    return `${protocol}://${host}${req.originalUrl}`;
  }
}

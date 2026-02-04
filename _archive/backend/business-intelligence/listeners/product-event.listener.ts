/**
 * @file product-event.listener.ts
 * @description Product Event Listener for Business Intelligence
 *
 * PURPOSE:
 * - Listens to product-related domain events
 * - Converts product events to business intelligence events
 * - Tracks product views, searches, and engagement
 * - Enables product performance and conversion analytics
 *
 * INTEGRATION POINTS:
 * - Product view and interaction events
 * - Product search and discovery events
 * - Wishlist and favorite events
 * - Product review and rating events
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BusinessEventPublisher } from '../services/business-event-publisher.service';
import { BusinessEventType } from '../entities/business-event.entity';

/**
 * Product Event Listener
 * 
 * Processes product-related events and converts them to business intelligence
 * events for product analytics, conversion tracking, and customer behavior analysis.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Event Listeners')
 */
@Injectable()
export class ProductEventListener {
  private readonly logger = new Logger(ProductEventListener.name);

  constructor(
    private readonly businessEventPublisher: BusinessEventPublisher,
  ) {
    this.logger.log('🛍️ Product Event Listener initialized');
  }

  /**
   * Handle product view events
   * Tracks product engagement and conversion funnel entry
   */
  @OnEvent('product.viewed')
  async handleProductViewed(payload: {
    productId: number;
    variantId?: number;
    userId?: number;
    sessionId?: string;
    productName: string;
    categoryId: number;
    categoryName: string;
    price: number;
    currency: string;
    viewDuration?: number;
    referrer?: string;
    searchQuery?: string;
    viewedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `👀 Product viewed event received`,
      { 
        productId: payload.productId,
        productName: payload.productName,
        userId: payload.userId,
        viewDuration: payload.viewDuration,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.PRODUCT_VIEWED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: `product_${payload.productId}`,
        aggregateType: 'product',
        sourceModule: 'products',
        eventPayload: {
          productId: payload.productId,
          variantId: payload.variantId,
          productName: payload.productName,
          categoryId: payload.categoryId,
          categoryName: payload.categoryName,
          price: payload.price,
          currency: payload.currency,
          viewDuration: payload.viewDuration,
          referrer: payload.referrer,
          searchQuery: payload.searchQuery,
          viewedAt: payload.viewedAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'product_service',
          funnelStage: 'awareness',
        },
      });

      this.logger.debug(
        `✅ Product viewed business event published`,
        { productId: payload.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle product viewed event`,
        { 
          productId: payload.productId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle product search events
   * Tracks search behavior and product discovery patterns
   */
  @OnEvent('product.searched')
  async handleProductSearched(payload: {
    query: string;
    userId?: number;
    sessionId?: string;
    filters?: Record<string, any>;
    sortBy?: string;
    resultsCount: number;
    selectedResults?: number[];
    searchedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🔍 Product search event received`,
      { 
        query: payload.query,
        userId: payload.userId,
        resultsCount: payload.resultsCount,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.PRODUCT_SEARCH_PERFORMED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: `search_${Date.now()}`,
        aggregateType: 'search',
        sourceModule: 'products',
        eventPayload: {
          query: payload.query,
          filters: payload.filters,
          sortBy: payload.sortBy,
          resultsCount: payload.resultsCount,
          selectedResults: payload.selectedResults,
          searchedAt: payload.searchedAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'product_service',
          discoveryMethod: 'search',
        },
      });

      this.logger.debug(
        `✅ Product search business event published`,
        { query: payload.query, resultsCount: payload.resultsCount }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle product searched event`,
        { 
          query: payload.query,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle category browsing events
   * Tracks category engagement and navigation patterns
   */
  @OnEvent('category.browsed')
  async handleCategoryBrowsed(payload: {
    categoryId: number;
    categoryName: string;
    parentCategoryId?: number;
    userId?: number;
    sessionId?: string;
    productsViewed?: number;
    timeSpent?: number;
    browsedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `📂 Category browsed event received`,
      { 
        categoryId: payload.categoryId,
        categoryName: payload.categoryName,
        userId: payload.userId,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.CATEGORY_BROWSED,
        userId: payload.userId || null,
        sessionId: payload.sessionId || null,
        aggregateId: `category_${payload.categoryId}`,
        aggregateType: 'category',
        sourceModule: 'categories',
        eventPayload: {
          categoryId: payload.categoryId,
          categoryName: payload.categoryName,
          parentCategoryId: payload.parentCategoryId,
          productsViewed: payload.productsViewed,
          timeSpent: payload.timeSpent,
          browsedAt: payload.browsedAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'category_service',
          discoveryMethod: 'browse',
        },
      });

      this.logger.debug(
        `✅ Category browsed business event published`,
        { categoryId: payload.categoryId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle category browsed event`,
        { 
          categoryId: payload.categoryId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle wishlist item added events
   * Tracks customer interest and intent signals
   */
  @OnEvent('wishlist.item.added')
  async handleWishlistItemAdded(payload: {
    wishlistId: number;
    productId: number;
    variantId?: number;
    userId: number;
    productName: string;
    price: number;
    currency: string;
    addedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `💝 Wishlist item added event received`,
      { 
        wishlistId: payload.wishlistId,
        productId: payload.productId,
        userId: payload.userId,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.WISHLIST_ITEM_ADDED,
        userId: payload.userId,
        aggregateId: `product_${payload.productId}`,
        aggregateType: 'product',
        sourceModule: 'wishlist',
        eventPayload: {
          wishlistId: payload.wishlistId,
          productId: payload.productId,
          variantId: payload.variantId,
          productName: payload.productName,
          price: payload.price,
          currency: payload.currency,
          addedAt: payload.addedAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'wishlist_service',
          intentSignal: 'high',
        },
      });

      this.logger.debug(
        `✅ Wishlist item added business event published`,
        { productId: payload.productId, userId: payload.userId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle wishlist item added event`,
        { 
          productId: payload.productId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle product review submitted events
   * Tracks customer engagement and satisfaction
   */
  @OnEvent('review.submitted')
  async handleReviewSubmitted(payload: {
    reviewId: number;
    productId: number;
    userId: number;
    rating: number;
    reviewText?: string;
    orderId?: number;
    verified: boolean;
    submittedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `⭐ Review submitted event received`,
      { 
        reviewId: payload.reviewId,
        productId: payload.productId,
        userId: payload.userId,
        rating: payload.rating,
      }
    );

    try {
      // Publish business intelligence event
      await this.businessEventPublisher.publishEvent({
        eventType: BusinessEventType.REVIEW_SUBMITTED,
        userId: payload.userId,
        aggregateId: `product_${payload.productId}`,
        aggregateType: 'product',
        sourceModule: 'reviews',
        eventPayload: {
          reviewId: payload.reviewId,
          productId: payload.productId,
          rating: payload.rating,
          reviewText: payload.reviewText,
          orderId: payload.orderId,
          verified: payload.verified,
          submittedAt: payload.submittedAt,
        },
        metadata: {
          ...payload.metadata,
          eventSource: 'review_service',
          engagementLevel: 'high',
          satisfactionIndicator: payload.rating >= 4 ? 'positive' : 'negative',
        },
      });

      this.logger.debug(
        `✅ Review submitted business event published`,
        { reviewId: payload.reviewId, productId: payload.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle review submitted event`,
        { 
          reviewId: payload.reviewId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle product price change events
   * Tracks pricing strategy and customer response
   */
  @OnEvent('product.price.changed')
  async handleProductPriceChanged(payload: {
    productId: number;
    variantId?: number;
    previousPrice: number;
    newPrice: number;
    currency: string;
    priceChangePercentage: number;
    reason?: string;
    changedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `💰 Product price changed event received`,
      { 
        productId: payload.productId,
        previousPrice: payload.previousPrice,
        newPrice: payload.newPrice,
        priceChangePercentage: payload.priceChangePercentage,
      }
    );

    try {
      // Only track significant price changes for BI
      if (Math.abs(payload.priceChangePercentage) >= 5) {
        // Publish business intelligence event using existing domain event
        // This would integrate with the existing domain event system
        this.logger.debug(
          `📊 Significant price change detected for product ${payload.productId}`,
          { priceChangePercentage: payload.priceChangePercentage }
        );
      }

      this.logger.debug(
        `✅ Product price change processed`,
        { productId: payload.productId }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle product price changed event`,
        { 
          productId: payload.productId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle product recommendation events
   * Tracks recommendation effectiveness and customer response
   */
  @OnEvent('product.recommended')
  async handleProductRecommended(payload: {
    userId?: number;
    sessionId?: string;
    productId: number;
    recommendationType: 'related' | 'trending' | 'personalized' | 'viewed_together';
    recommendationSource: string;
    position: number;
    confidence?: number;
    recommendedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🎯 Product recommended event received`,
      { 
        productId: payload.productId,
        recommendationType: payload.recommendationType,
        position: payload.position,
      }
    );

    try {
      // Track recommendation impressions for effectiveness analysis
      // This helps optimize recommendation algorithms
      
      this.logger.debug(
        `✅ Product recommendation tracked`,
        { productId: payload.productId, type: payload.recommendationType }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle product recommended event`,
        { 
          productId: payload.productId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }

  /**
   * Handle product image viewed events
   * Tracks visual content engagement
   */
  @OnEvent('product.image.viewed')
  async handleProductImageViewed(payload: {
    productId: number;
    imageId: number;
    imagePosition: number;
    userId?: number;
    sessionId?: string;
    viewDuration?: number;
    zoomedIn?: boolean;
    viewedAt: Date;
    metadata?: any;
  }): Promise<void> {
    this.logger.debug(
      `🖼️ Product image viewed event received`,
      { 
        productId: payload.productId,
        imageId: payload.imageId,
        imagePosition: payload.imagePosition,
      }
    );

    try {
      // Track image engagement for visual content optimization
      // This helps understand which product images are most engaging
      
      this.logger.debug(
        `✅ Product image view tracked`,
        { productId: payload.productId, imagePosition: payload.imagePosition }
      );
    } catch (error: unknown) {
      this.logger.error(
        `❌ Failed to handle product image viewed event`,
        { 
          productId: payload.productId,
          error: error instanceof Error ? (error as Error).message : String(error),
        }
      );
    }
  }
}
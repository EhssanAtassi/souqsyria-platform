/**
 * Homepage Analytics Service
 *
 * @description Dedicated service for homepage analytics tracking
 * This file follows the PROJECT_STRUCTURE_BLUEPRINT pattern of separating
 * concerns by creating a dedicated analytics service.
 *
 * @pattern Analytics Service Pattern
 * - Centralizes all analytics tracking logic
 * - Provides type-safe analytics methods
 * - Handles multiple analytics providers
 * - Graceful error handling (analytics failures don't break app)
 * - Easy to mock for testing
 *
 * @swagger
 * tags:
 *   - name: Homepage Analytics
 *     description: Analytics tracking for homepage events
 */

import { Injectable } from '@angular/core';
import { Product } from '../../../shared/interfaces/product.interface';
import { Campaign } from '../../../shared/interfaces/campaign.interface';
import { AnalyticsEventParams } from '../models/homepage.interface';

/**
 * Homepage Analytics Service
 *
 * @description Handles all analytics tracking for homepage component
 * Provides methods for tracking user interactions and events
 *
 * @remarks
 * Following PROJECT_STRUCTURE_BLUEPRINT.md pattern:
 * - Separates analytics logic from business logic
 * - Centralizes event tracking in one place
 * - Provides consistent event naming and parameters
 * - Supports multiple analytics providers (GA4, Adobe, etc.)
 * - Fails silently to prevent analytics from breaking app
 *
 * @example
 * ```typescript
 * // In component or service:
 * constructor(private analytics: HomepageAnalyticsService) {}
 *
 * onProductClick(product: Product) {
 *   this.analytics.trackProductView(product.id, 'featured-section');
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class HomepageAnalyticsService {
  //#region Configuration

  /** Enable console logging for debugging */
  private readonly enableDebugLogging = true;

  /** Analytics provider name */
  private readonly provider = 'Google Analytics 4';

  //#endregion

  //#region Homepage Events

  /**
   * Track homepage view
   * @description Records when user views the homepage
   */
  trackHomepageView(): void {
    this.trackEvent('page_view', {
      page_title: 'Homepage',
      page_location: '/homepage',
      page_path: '/',
      content_group: 'Homepage'
    });
  }

  /**
   * Track homepage section view
   * @description Records when user views a specific homepage section
   * @param sectionName - Name of the section viewed
   * @param sectionType - Type of section (featured, new-arrivals, etc.)
   */
  trackSectionView(sectionName: string, sectionType: string): void {
    this.trackEvent('section_view', {
      section_name: sectionName,
      section_type: sectionType,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Category Events

  /**
   * Track category click
   * @description Records when user clicks a category
   * @param categoryId - Category identifier
   * @param categoryName - Category display name
   * @param source - Click source (featured, quick-nav, etc.)
   */
  trackCategoryClick(categoryId: string, categoryName: string, source: string): void {
    this.trackEvent('category_click', {
      category_id: categoryId,
      category_name: categoryName,
      source: source,
      page: 'homepage'
    });
  }

  /**
   * Track featured category view
   * @description Records when featured category is displayed
   * @param categoryId - Category identifier
   * @param categoryName - Category display name
   */
  trackFeaturedCategoryView(categoryId: string, categoryName: string): void {
    this.trackEvent('featured_category_view', {
      category_id: categoryId,
      category_name: categoryName,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Product Events

  /**
   * Track product view
   * @description Records when user views a product
   * @param productId - Product identifier
   * @param source - View source (featured, new-arrivals, etc.)
   */
  trackProductView(productId: string, source: string): void {
    this.trackEvent('product_view', {
      product_id: productId,
      source: source,
      page: 'homepage'
    });
  }

  /**
   * Track product click
   * @description Records when user clicks a product
   * @param product - Product object
   * @param source - Click source
   * @param position - Position in list
   */
  trackProductClick(product: Product, source: string, position?: number): void {
    this.trackEvent('product_click', {
      product_id: product.id,
      product_name: product.name,
      product_name_arabic: product.nameArabic,
      category: product.category.name,
      price: product.price.amount,
      currency: product.price.currency,
      source: source,
      position: position,
      page: 'homepage'
    });
  }

  /**
   * Track add to cart
   * @description Records when user adds product to cart
   * @param product - Product being added
   * @param quantity - Quantity added
   * @param source - Add to cart source
   */
  trackAddToCart(product: Product, quantity: number, source: string): void {
    this.trackEvent('add_to_cart', {
      currency: product.price.currency,
      value: product.price.amount * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_name_arabic: product.nameArabic,
        item_category: product.category.name,
        price: product.price.amount,
        quantity: quantity
      }],
      source: source,
      page: 'homepage'
    });
  }

  /**
   * Track add to wishlist
   * @description Records when user adds product to wishlist
   * @param product - Product being added
   * @param source - Wishlist source
   */
  trackAddToWishlist(product: Product, source: string): void {
    this.trackEvent('add_to_wishlist', {
      currency: product.price.currency,
      value: product.price.amount,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_name_arabic: product.nameArabic,
        item_category: product.category.name,
        price: product.price.amount
      }],
      source: source,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Campaign Events

  /**
   * Track campaign view
   * @description Records when campaign is viewed
   * @param campaignId - Campaign identifier
   * @param campaignName - Campaign name
   */
  trackCampaignView(campaignId: string, campaignName: string): void {
    this.trackEvent('campaign_view', {
      campaign_id: campaignId,
      campaign_name: campaignName,
      page: 'homepage'
    });
  }

  /**
   * Track campaign click
   * @description Records when campaign is clicked
   * @param campaignId - Campaign identifier
   * @param campaignName - Campaign name
   */
  trackCampaignClick(campaignId: string, campaignName: string): void {
    this.trackEvent('campaign_click', {
      campaign_id: campaignId,
      campaign_name: campaignName,
      page: 'homepage'
    });
  }

  /**
   * Track campaign interaction
   * @description Records generic campaign interaction
   * @param campaignId - Campaign identifier
   * @param interactionType - Type of interaction
   */
  trackCampaignInteraction(campaignId: string, interactionType: 'click' | 'view' | 'cta_click'): void {
    this.trackEvent('campaign_interaction', {
      campaign_id: campaignId,
      interaction_type: interactionType,
      page: 'homepage'
    });
  }

  /**
   * Track campaign CTA click
   * @description Records when campaign CTA button is clicked
   * @param campaignId - Campaign identifier
   * @param ctaText - CTA button text
   * @param targetRoute - Target navigation route
   */
  trackCampaignCTAClick(campaignId: string, ctaText: string, targetRoute: string): void {
    this.trackEvent('campaign_cta_click', {
      campaign_id: campaignId,
      cta_text: ctaText,
      target_route: targetRoute,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Hero Banner Events

  /**
   * Track hero banner view
   * @description Records when hero banner is displayed
   * @param bannerId - Banner identifier
   * @param bannerTitle - Banner title
   */
  trackHeroBannerView(bannerId: string, bannerTitle: string): void {
    this.trackEvent('hero_banner_view', {
      banner_id: bannerId,
      banner_title: bannerTitle,
      page: 'homepage'
    });
  }

  /**
   * Track hero banner click
   * @description Records when hero banner is clicked
   * @param bannerId - Banner identifier
   * @param bannerTitle - Banner title
   * @param targetLink - Target URL
   */
  trackHeroBannerClick(bannerId: string, bannerTitle: string, targetLink: string): void {
    this.trackEvent('hero_banner_click', {
      banner_id: bannerId,
      banner_title: bannerTitle,
      target_link: targetLink,
      page: 'homepage'
    });
  }

  /**
   * Track hero banner slide change
   * @description Records when hero slider changes slides
   * @param currentIndex - Current slide index
   * @param method - Change method (auto, manual, dots, arrows)
   */
  trackHeroBannerSlideChange(currentIndex: number, method: string): void {
    this.trackEvent('hero_banner_slide_change', {
      current_index: currentIndex,
      method: method,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Offer Events

  /**
   * Track offer click
   * @description Records when promotional offer is clicked
   * @param offerId - Offer identifier
   * @param offerTitle - Offer title
   * @param discountValue - Discount value
   */
  trackOfferClick(offerId: string, offerTitle: string, discountValue?: string): void {
    this.trackEvent('offer_click', {
      offer_id: offerId,
      offer_title: offerTitle,
      discount_value: discountValue,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Navigation Events

  /**
   * Track quick navigation click
   * @description Records when quick nav item is clicked
   * @param itemName - Navigation item name
   * @param targetRoute - Target route
   */
  trackQuickNavClick(itemName: string, targetRoute: string): void {
    this.trackEvent('quick_nav_click', {
      item_name: itemName,
      target_route: targetRoute,
      page: 'homepage'
    });
  }

  /**
   * Track view all click
   * @description Records when "View All" button is clicked
   * @param sectionName - Section name
   * @param targetRoute - Target route
   */
  trackViewAllClick(sectionName: string, targetRoute: string): void {
    this.trackEvent('view_all_click', {
      section_name: sectionName,
      target_route: targetRoute,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Error Events

  /**
   * Track error
   * @description Records when an error occurs
   * @param errorType - Type of error
   * @param errorMessage - Error message
   * @param context - Additional context
   */
  trackError(errorType: string, errorMessage: string, context?: any): void {
    this.trackEvent('homepage_error', {
      error_type: errorType,
      error_message: errorMessage,
      context: context,
      page: 'homepage'
    });
  }

  //#endregion

  //#region Core Analytics Methods

  /**
   * Track generic event
   * @description Core method for tracking any analytics event
   * @param eventName - Event name
   * @param parameters - Event parameters
   */
  trackEvent(eventName: string, parameters: AnalyticsEventParams): void {
    try {
      // Add timestamp to all events
      const eventData = {
        ...parameters,
        timestamp: new Date().toISOString()
      };

      // Debug logging
      if (this.enableDebugLogging) {
        console.log(`📊 Analytics [${this.provider}]: ${eventName}`, eventData);
      }

      // Send to Google Analytics 4
      this.sendToGoogleAnalytics(eventName, eventData);

      // Send to other providers (can add Adobe Analytics, Mixpanel, etc.)
      // this.sendToAdobeAnalytics(eventName, eventData);
      // this.sendToMixpanel(eventName, eventData);

    } catch (error) {
      // Analytics errors should never break the application
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Send event to Google Analytics 4
   * @description Sends event to GA4 using gtag
   * @param eventName - Event name
   * @param parameters - Event parameters
   */
  private sendToGoogleAnalytics(eventName: string, parameters: any): void {
    // Check if gtag is available
    if (typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', eventName, parameters);
    } else {
      if (this.enableDebugLogging) {
        console.warn('Google Analytics gtag not available');
      }
    }
  }

  /**
   * Send event to Adobe Analytics
   * @description Placeholder for Adobe Analytics integration
   * @param eventName - Event name
   * @param parameters - Event parameters
   */
  private sendToAdobeAnalytics(eventName: string, parameters: any): void {
    // Implement Adobe Analytics tracking
    // Example: s.tl(this, 'o', eventName, parameters);
  }

  /**
   * Send event to Mixpanel
   * @description Placeholder for Mixpanel integration
   * @param eventName - Event name
   * @param parameters - Event parameters
   */
  private sendToMixpanel(eventName: string, parameters: any): void {
    // Implement Mixpanel tracking
    // Example: mixpanel.track(eventName, parameters);
  }

  //#endregion

  //#region User Properties

  /**
   * Set user property
   * @description Sets a user property for analytics
   * @param propertyName - Property name
   * @param value - Property value
   */
  setUserProperty(propertyName: string, value: any): void {
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('set', 'user_properties', {
          [propertyName]: value
        });
      }

      if (this.enableDebugLogging) {
        console.log(`📊 User Property Set: ${propertyName} = ${value}`);
      }
    } catch (error) {
      console.error('Failed to set user property:', error);
    }
  }

  /**
   * Set user ID
   * @description Sets the user ID for analytics
   * @param userId - User identifier
   */
  setUserId(userId: string): void {
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
          user_id: userId
        });
      }

      if (this.enableDebugLogging) {
        console.log(`📊 User ID Set: ${userId}`);
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  //#endregion
}

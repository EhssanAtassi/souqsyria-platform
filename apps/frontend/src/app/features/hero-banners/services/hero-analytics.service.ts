/**
 * Hero Analytics Service
 * Centralized analytics tracking for hero banner interactions
 *
 * Features:
 * - Google Analytics 4 integration
 * - Custom event tracking
 * - Session management
 * - Conversion tracking
 * - A/B testing support
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroAnalyticsService:
 *       type: object
 *       description: Analytics service for hero banner metrics
 */

import { Injectable } from '@angular/core';
import {
  HeroBanner,
  BannerSlideEvent,
  CTAClickEvent,
} from '../interfaces/hero-banner.interface';

/**
 * Hero Analytics Service
 *
 * @example
 * // In component
 * constructor(private heroAnalytics: HeroAnalyticsService) {}
 *
 * ngOnInit() {
 *   // Track banner impression
 *   this.heroAnalytics.trackImpression(banner);
 *
 *   // Track CTA click
 *   this.heroAnalytics.trackCTAClick(banner, 'primary');
 * }
 */
@Injectable({ providedIn: 'root' })
export class HeroAnalyticsService {
  /**
   * Track banner impression (view)
   * Logs when a user sees a hero banner
   *
   * @param banner Hero banner that was displayed
   * @param position Position in carousel (0-indexed)
   * @param method Display method (auto, manual, direct)
   */
  trackImpression(
    banner: HeroBanner,
    position: number = 0,
    method: 'auto' | 'manual' | 'direct' = 'auto'
  ): void {
    try {
      console.log('📊 Hero Banner Impression:', {
        bannerId: banner.id,
        bannerName: banner.name.english,
        bannerNameAr: banner.name.arabic,
        position,
        method,
        type: banner.type,
        priority: banner.priority,
      });

      // Google Analytics 4 tracking
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_banner_impression', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          banner_name_ar: banner.name.arabic,
          banner_type: banner.type,
          banner_priority: banner.priority,
          position,
          method,
          event_category: 'Hero Banner',
          event_label: banner.name.english,
          value: position + 1,
        });
      }

      // Additional analytics providers can be added here
      // Adobe Analytics, Mixpanel, Amplitude, etc.
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track impression:', error);
    }
  }

  /**
   * Track banner click (entire banner area)
   * Logs when a user clicks on the banner background
   *
   * @param banner Hero banner that was clicked
   * @param position Position in carousel
   * @param targetUrl Target URL being navigated to
   */
  trackClick(banner: HeroBanner, position: number, targetUrl: string): void {
    try {
      console.log('📊 Hero Banner Click:', {
        bannerId: banner.id,
        bannerName: banner.name.english,
        position,
        targetUrl,
        type: banner.type,
      });

      // Google Analytics 4 tracking
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_banner_click', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          banner_name_ar: banner.name.arabic,
          banner_type: banner.type,
          position,
          target_url: targetUrl,
          route_type: banner.targetRoute.type,
          event_category: 'Hero Banner',
          event_label: `${banner.name.english} - Position ${position}`,
          value: 1,
        });
      }

      // Conversion tracking (if configured)
      this.trackConversion(banner, 'banner_click');
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track click:', error);
    }
  }

  /**
   * Track CTA button click
   * Logs when a user clicks the call-to-action button
   *
   * @param banner Hero banner with CTA
   * @param ctaType CTA type (primary, secondary, etc.)
   * @param position Position in carousel
   */
  trackCTAClick(banner: HeroBanner, ctaType: string = 'primary', position: number = 0): void {
    try {
      const ctaText = banner.cta.text.english;
      const targetUrl = banner.targetRoute.target;

      console.log('📊 Hero Banner CTA Click:', {
        bannerId: banner.id,
        bannerName: banner.name.english,
        ctaText,
        ctaType,
        position,
        targetUrl,
      });

      // Google Analytics 4 tracking
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_cta_click', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          cta_text: ctaText,
          cta_text_ar: banner.cta.text.arabic,
          cta_type: ctaType,
          cta_color: banner.cta.color,
          cta_variant: banner.cta.variant,
          position,
          target_url: targetUrl,
          route_type: banner.targetRoute.type,
          event_category: 'Hero Banner CTA',
          event_label: `${ctaText} - ${banner.name.english}`,
          value: 5, // Higher value for CTA clicks
        });
      }

      // Conversion tracking
      this.trackConversion(banner, 'cta_click');

      // UTM tracking (if configured)
      if (banner.targetRoute.tracking) {
        this.trackUTM(banner.targetRoute.tracking);
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track CTA click:', error);
    }
  }

  /**
   * Track slide change event
   * Logs when the carousel slides change
   *
   * @param event Slide change event data
   * @param banner Current banner being displayed
   */
  trackSlideChange(event: BannerSlideEvent, banner: HeroBanner): void {
    try {
      console.log('📊 Hero Banner Slide Change:', {
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
        totalSlides: event.totalSlides,
        method: event.method,
        bannerId: banner.id,
        bannerName: banner.name.english,
      });

      // Google Analytics 4 tracking
      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_slide_change', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          previous_index: event.previousIndex,
          current_index: event.currentIndex,
          total_slides: event.totalSlides,
          navigation_method: event.method,
          event_category: 'Hero Banner Navigation',
          event_label: `Slide ${event.currentIndex + 1} of ${event.totalSlides}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track slide change:', error);
    }
  }

  /**
   * Track banner autoplay pause
   * Logs when user pauses autoplay (usually by hovering)
   *
   * @param banner Current banner
   * @param reason Pause reason
   */
  trackAutoplayPause(banner: HeroBanner, reason: 'hover' | 'manual' | 'interaction'): void {
    try {
      console.log('📊 Hero Banner Autoplay Paused:', {
        bannerId: banner.id,
        reason,
      });

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_autoplay_pause', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          pause_reason: reason,
          event_category: 'Hero Banner Interaction',
          event_label: `Autoplay Paused - ${reason}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track autoplay pause:', error);
    }
  }

  /**
   * Track banner autoplay resume
   * Logs when autoplay resumes after being paused
   *
   * @param banner Current banner
   * @param reason Resume reason
   */
  trackAutoplayResume(banner: HeroBanner, reason: 'hover_end' | 'manual' | 'timeout'): void {
    try {
      console.log('📊 Hero Banner Autoplay Resumed:', {
        bannerId: banner.id,
        reason,
      });

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_autoplay_resume', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          resume_reason: reason,
          event_category: 'Hero Banner Interaction',
          event_label: `Autoplay Resumed - ${reason}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track autoplay resume:', error);
    }
  }

  /**
   * Track swipe gesture on hero banner (mobile)
   * Logs when user swipes left/right to navigate carousel
   *
   * @param banner Current banner
   * @param direction Swipe direction (left or right)
   * @param metrics Swipe metrics (distance, duration)
   */
  trackSwipeGesture(
    banner: HeroBanner,
    direction: 'left' | 'right',
    metrics: { distance: number; duration: number }
  ): void {
    try {
      console.log('📊 Hero Banner Swipe Gesture:', {
        bannerId: banner.id,
        bannerName: banner.name.english,
        direction,
        distance: metrics.distance,
        duration: metrics.duration,
      });

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_swipe_gesture', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          swipe_direction: direction,
          swipe_distance: Math.round(metrics.distance),
          swipe_duration: Math.round(metrics.duration),
          event_category: 'Hero Banner Interaction',
          event_label: `Swipe ${direction.toUpperCase()} - ${banner.name.english}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track swipe gesture:', error);
    }
  }

  /**
   * Track conversion event
   * Logs when a user completes a desired action from hero banner
   *
   * @param banner Banner that led to conversion
   * @param conversionType Type of conversion
   * @param value Conversion value (optional)
   */
  trackConversion(
    banner: HeroBanner,
    conversionType: 'banner_click' | 'cta_click' | 'purchase' | 'signup',
    value?: number
  ): void {
    try {
      console.log('📊 Hero Banner Conversion:', {
        bannerId: banner.id,
        bannerName: banner.name.english,
        conversionType,
        value,
      });

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'conversion', {
          send_to: 'AW-CONVERSION_ID', // Replace with actual conversion ID
          banner_id: banner.id,
          banner_name: banner.name.english,
          conversion_type: conversionType,
          value: value || 0,
          currency: 'USD',
          transaction_id: `${banner.id}-${Date.now()}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track conversion:', error);
    }
  }

  /**
   * Track UTM parameters for campaign tracking
   *
   * @param tracking UTM tracking parameters
   */
  private trackUTM(tracking: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  }): void {
    try {
      console.log('📊 UTM Tracking:', tracking);

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'campaign_click', {
          campaign_name: tracking.campaign,
          campaign_source: tracking.source,
          campaign_medium: tracking.medium,
          campaign_content: tracking.content,
          campaign_term: tracking.term,
          event_category: 'Campaign Tracking',
          event_label: `${tracking.source} / ${tracking.medium} / ${tracking.campaign}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track UTM:', error);
    }
  }

  /**
   * Track A/B test variant impression
   * For future A/B testing implementation
   *
   * @param banner Banner being tested
   * @param variant Variant identifier (A, B, C, etc.)
   * @param experimentId Experiment ID
   */
  trackABTestImpression(banner: HeroBanner, variant: string, experimentId: string): void {
    try {
      console.log('📊 A/B Test Impression:', {
        bannerId: banner.id,
        variant,
        experimentId,
      });

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'ab_test_impression', {
          banner_id: banner.id,
          banner_name: banner.name.english,
          experiment_id: experimentId,
          variant,
          event_category: 'A/B Testing',
          event_label: `${experimentId} - Variant ${variant}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track A/B test impression:', error);
    }
  }

  /**
   * Track banner error
   * Logs when a banner fails to load or display
   *
   * @param banner Banner that failed
   * @param errorType Type of error
   * @param errorMessage Error message
   */
  trackError(banner: HeroBanner | null, errorType: string, errorMessage: string): void {
    try {
      console.error('📊 Hero Banner Error:', {
        bannerId: banner?.id || 'unknown',
        errorType,
        errorMessage,
      });

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_banner_error', {
          banner_id: banner?.id || 'unknown',
          banner_name: banner?.name.english || 'unknown',
          error_type: errorType,
          error_message: errorMessage,
          event_category: 'Hero Banner Error',
          event_label: `${errorType}: ${errorMessage}`,
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to track error:', error);
    }
  }

  /**
   * Initialize analytics session
   * Sets up session tracking for hero banner interactions
   */
  initializeSession(): void {
    try {
      const sessionId = this.generateSessionId();
      console.log('📊 Hero Analytics Session Initialized:', sessionId);

      if (typeof (window as any).gtag !== 'undefined') {
        (window as any).gtag('event', 'hero_session_start', {
          session_id: sessionId,
          event_category: 'Hero Banner Session',
          event_label: 'Session Started',
        });
      }
    } catch (error) {
      console.error('❌ Hero Analytics: Failed to initialize session:', error);
    }
  }

  /**
   * Generate unique session ID for tracking
   *
   * @returns Unique session ID
   */
  private generateSessionId(): string {
    return `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

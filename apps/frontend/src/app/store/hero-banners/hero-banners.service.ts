/**
 * Hero Banners Service (Akita Service Layer)
 * Business logic layer for hero banner management
 *
 * Features:
 * - Load active banners from API
 * - Store management (setLoading, set, setError)
 * - DTO mapping (backend → frontend)
 * - Error handling with fallback
 * - Cache management
 *
 * This is the Akita service layer - it coordinates between:
 * - Hero Banner API Service (HTTP layer)
 * - Hero Banners Store (state storage)
 * - Hero Banners Query (state queries)
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBannersService:
 *       type: object
 *       description: Akita service for hero banners
 *       methods:
 *         loadActiveBanners:
 *           description: Load active banners from API and store them
 *           returns: void
 *         clearCache:
 *           description: Clear cached banner data
 *           returns: void
 *
 * @example
 * // In component
 * constructor(
 *   private heroBannersService: HeroBannersService,
 *   private heroBannersQuery: HeroBannersQuery
 * ) {}
 *
 * ngOnInit() {
 *   // Load banners (triggers API call)
 *   this.heroBannersService.loadActiveBanners();
 *
 *   // Subscribe to loaded banners
 *   this.heroBannersQuery.selectActiveBanners$.subscribe(banners => {
 *     this.heroBanners = banners;
 *   });
 * }
 */

import { Injectable, inject } from '@angular/core';
import { HeroBannersStore } from './hero-banners.store';
import { HeroBannerService } from '../../features/hero-banners/services/hero-banner.service';
import { tap, catchError } from 'rxjs/operators';

/**
 * Hero Banners Service
 * Coordinates banner data loading and state management
 *
 * Responsibilities:
 * - Call Hero Banner API Service to fetch data
 * - Transform API DTOs to frontend interfaces
 * - Update Hero Banners Store with data
 * - Handle loading and error states
 * - Provide cache clearing functionality
 *
 * Data Flow:
 * 1. Component calls loadActiveBanners()
 * 2. Service sets loading state in store
 * 3. Service calls Hero Banner API Service
 * 4. API Service returns backend DTOs
 * 5. Service transforms DTOs (handled by API service)
 * 6. Service stores transformed banners in store
 * 7. Service clears loading state
 * 8. Query emits updated banners to components
 *
 * Error Handling:
 * - Network errors caught and stored in error state
 * - Loading state always cleared (success or error)
 * - Errors logged to console for debugging
 * - Components can check error state via query
 *
 * @example
 * // Typical usage in homepage component
 * export class HomepageComponent implements OnInit {
 *   private heroBannersService = inject(HeroBannersService);
 *   private heroBannersQuery = inject(HeroBannersQuery);
 *
 *   heroBanners$ = this.heroBannersQuery.selectActiveBanners$;
 *   isLoading$ = this.heroBannersQuery.selectLoading$;
 *   error$ = this.heroBannersQuery.selectError$;
 *
 *   ngOnInit() {
 *     this.heroBannersService.loadActiveBanners();
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class HeroBannersService {
  private readonly store = inject(HeroBannersStore);
  private readonly heroBannerApiService = inject(HeroBannerService);

  /**
   * Load Active Banners
   * Fetches active hero banners from API and stores them
   *
   * Process:
   * 1. Set loading = true in store
   * 2. Call API service getActiveHeroBanners()
   * 3. Store banners in Akita store (replaces existing)
   * 4. Set loading = false, error = null
   * 5. On error: Set error message, loading = false
   *
   * The API service already handles DTO transformation, so we receive
   * properly formatted HeroBanner[] with nested BilingualContent objects.
   *
   * @param limit - Maximum number of banners to load (optional, defaults to 5)
   * @returns void (updates store, components react via query observables)
   *
   * @example
   * // In component ngOnInit
   * this.heroBannersService.loadActiveBanners(5);
   *
   * // Components subscribe to query
   * this.heroBannersQuery.selectActiveBanners$.subscribe(banners => {
   *   console.log('Active banners loaded:', banners.length);
   * });
   */
  loadActiveBanners(limit: number = 5): void {
    // Set loading state
    this.store.setLoading(true);

    // Fetch from API (returns Observable<HeroBanner[]>)
    this.heroBannerApiService.getActiveHeroBanners().pipe(
      tap(banners => {
        // Limit the number of banners if needed
        const limitedBanners = limit > 0 ? banners.slice(0, limit) : banners;

        console.log(`✅ Hero Banners Service: Loaded ${limitedBanners.length} active banners (limit: ${limit})`);

        // Store banners (replaces existing)
        this.store.set(limitedBanners);

        // Clear loading and error
        this.store.setLoading(false);
        this.store.updateError(null);
      }),
      catchError(error => {
        console.error('❌ Hero Banners Service: Failed to load active banners:', error);

        // Extract error message
        const errorMessage = this.extractErrorMessage(error);

        // Update store with error
        this.store.updateError(errorMessage);
        this.store.setLoading(false);

        // Return empty array to prevent component breakage
        return [];
      })
    ).subscribe();
  }

  /**
   * Track Banner Impression
   * Records when a banner is viewed by a user
   *
   * @param bannerId - The ID of the banner that was viewed
   * @param metadata - Additional tracking metadata (position, method, etc.)
   * @returns void
   *
   * @example
   * // Track impression when banner is displayed
   * this.heroBannersService.trackBannerImpression('banner-001', { position: 0, method: 'auto' });
   */
  trackBannerImpression(bannerId: string, metadata?: any): void {
    this.heroBannerApiService.trackImpression(bannerId, metadata).subscribe({
      next: () => console.log(`📊 Tracked impression for banner: ${bannerId}`),
      error: (error) => console.error('Failed to track impression:', error)
    });
  }

  /**
   * Track Banner Click
   * Records when a banner is clicked by a user
   *
   * @param bannerId - The ID of the banner that was clicked
   * @param metadata - Additional tracking metadata (position, targetUrl, etc.)
   * @returns void
   *
   * @example
   * // Track click when user clicks banner
   * this.heroBannersService.trackBannerClick('banner-001', { position: 0, targetUrl: '/category/damascus-steel' });
   */
  trackBannerClick(bannerId: string, metadata?: any): void {
    this.heroBannerApiService.trackClick(bannerId, metadata).subscribe({
      next: () => console.log(`📊 Tracked click for banner: ${bannerId}`),
      error: (error) => console.error('Failed to track click:', error)
    });
  }

  /**
   * Track CTA Button Click
   * Records when a CTA (Call-to-Action) button on a banner is clicked
   *
   * @param bannerId - The ID of the banner with the CTA
   * @param ctaText - The text of the CTA button that was clicked
   * @param metadata - Additional tracking metadata (position, ctaType, etc.)
   * @returns void
   *
   * @example
   * // Track CTA click
   * this.heroBannersService.trackCTAClick('banner-001', 'Shop Now', { position: 0, ctaType: 'primary' });
   */
  trackCTAClick(bannerId: string, ctaText: string, metadata?: any): void {
    this.heroBannerApiService.trackCTAClick(bannerId, ctaText, metadata).subscribe({
      next: () => console.log(`📊 Tracked CTA click "${ctaText}" for banner: ${bannerId}`),
      error: (error) => console.error('Failed to track CTA click:', error)
    });
  }

  /**
   * Clear Cache
   * Resets hero banners store to initial state
   *
   * Use cases:
   * - User logout (clear personalized banners)
   * - Force refresh (clear stale data)
   * - Testing (reset between tests)
   *
   * This will:
   * - Remove all banners from store
   * - Reset loading to false
   * - Reset error to null
   *
   * @returns void
   *
   * @example
   * // Clear cache and reload
   * this.heroBannersService.clearCache();
   * this.heroBannersService.loadActiveBanners();
   *
   * // Clear on logout
   * logout() {
   *   this.heroBannersService.clearCache();
   *   this.router.navigate(['/login']);
   * }
   */
  clearCache(): void {
    console.log('🗑️ Hero Banners Service: Clearing cache');
    this.store.reset();
  }

  /**
   * Extract user-friendly error message from error object
   * Handles various error formats from HTTP, network, and application errors
   *
   * @param error - Error object (any type)
   * @returns string User-friendly error message
   *
   * @private
   */
  private extractErrorMessage(error: any): string {
    // HTTP error with error.error.message (NestJS format)
    if (error?.error?.message) {
      return `Failed to load hero banners: ${error.error.message}`;
    }

    // HTTP error with error.message
    if (error?.message) {
      return `Failed to load hero banners: ${error.message}`;
    }

    // HTTP status code errors
    if (error?.status) {
      switch (error.status) {
        case 0:
          return 'Network error: Unable to connect to server. Please check your internet connection.';
        case 404:
          return 'Hero banners not found. Please contact support.';
        case 500:
          return 'Server error occurred while loading hero banners. Please try again later.';
        case 503:
          return 'Service temporarily unavailable. Please try again in a few moments.';
        default:
          return `Server error (${error.status}): Failed to load hero banners.`;
      }
    }

    // Generic fallback
    return 'An unexpected error occurred while loading hero banners. Please refresh the page.';
  }
}

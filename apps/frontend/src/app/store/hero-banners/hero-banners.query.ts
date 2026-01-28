/**
 * Hero Banners Query Service
 * Akita QueryEntity for reactive hero banner queries
 *
 * Features:
 * - Reactive observables for all banner data
 * - Filtered queries (active, by type, by status)
 * - Featured banner selector (highest priority active banner)
 * - Count selectors
 * - Loading/error state selectors
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBannersQuery:
 *       type: object
 *       description: Query service for hero banners
 *       properties:
 *         selectAll:
 *           type: observable
 *           description: Observable of all banners
 *         selectActiveBanners$:
 *           type: observable
 *           description: Observable of active banners only (sorted by priority)
 *         selectFeaturedBanner$:
 *           type: observable
 *           description: Observable of highest priority active banner
 *
 * @example
 * // In component
 * constructor(private heroBannersQuery: HeroBannersQuery) {}
 *
 * ngOnInit() {
 *   // Subscribe to active banners
 *   this.heroBannersQuery.selectActiveBanners$.subscribe(banners => {
 *     this.displayBanners = banners;
 *   });
 *
 *   // Get featured banner
 *   this.heroBannersQuery.selectFeaturedBanner$.subscribe(banner => {
 *     this.featuredBanner = banner;
 *   });
 *
 *   // Check loading state
 *   this.heroBannersQuery.selectLoading$.subscribe(loading => {
 *     this.isLoading = loading;
 *   });
 * }
 */

import { QueryEntity } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { HeroBannersStore, HeroBannersState } from './hero-banners.store';
import {
  HeroBanner,
  HeroBannerType,
  BannerStatus
} from '../../features/hero-banners/interfaces/hero-banner.interface';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
 * Hero Banners Query Service
 * Provides reactive queries and computed selectors for hero banners
 *
 * Query Types:
 * - Basic: selectAll(), selectEntity(id), selectCount()
 * - Filtered: selectActiveBanners$, selectBannersByType(), selectBannersByStatus()
 * - Computed: selectFeaturedBanner$, selectActiveCount$
 * - State: selectLoading$, selectError$, selectHasError$
 *
 * All queries are reactive and will automatically emit new values
 * when the underlying store state changes.
 *
 * @example
 * // Component template with async pipe
 * <ng-container *ngIf="heroBannersQuery.selectActiveBanners$ | async as banners">
 *   <app-hero-banner-slider [banners]="banners" />
 * </ng-container>
 *
 * // Component with subscription
 * this.heroBannersQuery.selectFeaturedBanner$.pipe(
 *   takeUntilDestroyed(this.destroyRef)
 * ).subscribe(banner => {
 *   console.log('Featured banner:', banner);
 * });
 */
@Injectable({ providedIn: 'root' })
export class HeroBannersQuery extends QueryEntity<HeroBannersState, HeroBanner> {
  /**
   * Observable of loading state
   * Emits true when banners are being loaded from API
   */
  selectLoading$!: Observable<boolean>;

  /**
   * Observable of error state
   * Emits error message string or null if no error
   */
  selectError$!: Observable<string | null>;

  /**
   * Observable of error existence
   * Emits true if there is an error, false otherwise
   */
  selectHasError$!: Observable<boolean>;

  /**
   * Observable of active banners only
   * Filters for status === 'active' and sorts by priority (descending)
   *
   * Active banners are currently displayed banners that have:
   * - status: 'active'
   * - Sorted by priority (highest first)
   *
   * @returns Observable<HeroBanner[]> Active banners
   */
  selectActiveBanners$!: Observable<HeroBanner[]>;

  /**
   * Observable of featured banner (highest priority active banner)
   * Returns the banner with the highest priority among active banners
   *
   * Featured banner is used for:
   * - Main hero section
   * - Primary promotional spot
   * - Default banner display
   *
   * @returns Observable<HeroBanner | undefined> Featured banner or undefined
   */
  selectFeaturedBanner$!: Observable<HeroBanner | undefined>;

  /**
   * Observable of active banner count
   * Counts the number of banners with status === 'active'
   *
   * @returns Observable<number> Count of active banners
   */
  selectActiveCount$!: Observable<number>;

  constructor(protected override store: HeroBannersStore) {
    super(store);

    // Initialize observables in constructor to ensure store is available
    // (ES2022 class field initializers can conflict with Akita's store injection)
    this.selectLoading$ = this.select('loading');
    this.selectError$ = this.select('error');
    this.selectHasError$ = this.selectError$.pipe(
      map(error => error !== null && error !== undefined)
    );
    this.selectActiveBanners$ = this.selectAll({
      filterBy: (banner) => banner.status === 'active',
      sortBy: (a, b) => b.priority - a.priority
    });
    this.selectFeaturedBanner$ = this.selectActiveBanners$.pipe(
      map(banners => banners.length > 0 ? banners[0] : undefined)
    );
    this.selectActiveCount$ = this.selectActiveBanners$.pipe(
      map(banners => banners.length)
    );
  }

  /**
   * Select banners by type
   * Filters banners by their display type (main, secondary, promotional, seasonal)
   *
   * Types:
   * - main: Primary hero banners for homepage hero section
   * - secondary: Secondary banners for storytelling/education
   * - promotional: Urgent promotional campaigns (flash sales, limited offers)
   * - seasonal: Seasonal/cultural events (Ramadan, holidays)
   *
   * @param type - Banner type to filter by
   * @returns Observable<HeroBanner[]> Banners of specified type
   *
   * @example
   * // Get all promotional banners
   * this.heroBannersQuery.selectBannersByType('promotional').subscribe(banners => {
   *   console.log('Promotional banners:', banners);
   * });
   */
  selectBannersByType(type: HeroBannerType): Observable<HeroBanner[]> {
    return this.selectAll({
      filterBy: (banner) => banner.type === type,
      sortBy: (a, b) => b.priority - a.priority
    });
  }

  /**
   * Select banners by status
   * Filters banners by their current status (active, scheduled, paused, draft, completed)
   *
   * Statuses:
   * - draft: Not ready for display (pending, rejected, suspended)
   * - scheduled: Approved but not yet started (future start date)
   * - active: Currently displaying (approved, active, within schedule)
   * - paused: Approved but manually disabled (isActive = false)
   * - completed: Campaign finished (past end date or archived)
   *
   * @param status - Banner status to filter by
   * @returns Observable<HeroBanner[]> Banners with specified status
   *
   * @example
   * // Get all scheduled banners
   * this.heroBannersQuery.selectBannersByStatus('scheduled').subscribe(banners => {
   *   console.log('Upcoming banners:', banners);
   * });
   */
  selectBannersByStatus(status: BannerStatus): Observable<HeroBanner[]> {
    return this.selectAll({
      filterBy: (banner) => banner.status === status,
      sortBy: (a, b) => b.priority - a.priority
    });
  }

  /**
   * Get banner by ID (synchronous)
   * Retrieves a single banner from the store by its ID
   *
   * @param id - Banner ID
   * @returns HeroBanner | undefined
   *
   * @example
   * const banner = this.heroBannersQuery.getEntity('banner-001');
   * if (banner) {
   *   console.log('Found banner:', banner.name.english);
   * }
   */
  getBanner(id: string): HeroBanner | undefined {
    return this.getEntity(id);
  }

  /**
   * Check if store has active banners (synchronous)
   * Quick check without observable subscription
   *
   * @returns boolean True if at least one active banner exists
   *
   * @example
   * if (this.heroBannersQuery.hasActiveBanners()) {
   *   console.log('Active banners available');
   * }
   */
  hasActiveBanners(): boolean {
    const allBanners = this.getAll();
    return allBanners.some(banner => banner.status === 'active');
  }

  /**
   * Get count of all banners (synchronous)
   * Counts all banners in store regardless of status
   *
   * @returns number Total banner count
   *
   * @example
   * const totalBanners = this.heroBannersQuery.getTotalCount();
   * console.log(`Total banners: ${totalBanners}`);
   */
  getTotalCount(): number {
    return this.getCount();
  }

  /**
   * Get count of active banners (synchronous)
   * Counts banners with status === 'active'
   *
   * @returns number Active banner count
   *
   * @example
   * const activeBanners = this.heroBannersQuery.getActiveCount();
   * console.log(`Active banners: ${activeBanners}`);
   */
  getActiveCount(): number {
    const allBanners = this.getAll();
    return allBanners.filter(banner => banner.status === 'active').length;
  }

  /**
   * Check if store is currently loading (synchronous)
   * Quick check for loading state
   *
   * @returns boolean True if loading
   *
   * @example
   * if (this.heroBannersQuery.isLoading()) {
   *   console.log('Banners are loading...');
   * }
   */
  isLoading(): boolean {
    return this.getValue().loading;
  }

  /**
   * Get current error message (synchronous)
   * Retrieves error message from store state
   *
   * @returns string | null Error message or null
   *
   * @example
   * const error = this.heroBannersQuery.getError();
   * if (error) {
   *   console.error('Banner error:', error);
   * }
   */
  getError(): string | null {
    return this.getValue().error;
  }
}

/**
 * Hero Banners Store
 * Akita EntityStore for managing hero banner state
 *
 * Features:
 * - Entity-based state management for hero banners
 * - Loading and error state tracking
 * - Sorted by priority (highest first)
 * - Resettable store for clean state resets
 *
 * @swagger
 * components:
 *   schemas:
 *     HeroBannersState:
 *       type: object
 *       description: Hero banners store state
 *       properties:
 *         loading:
 *           type: boolean
 *           description: Loading state for API calls
 *         error:
 *           type: string
 *           nullable: true
 *           description: Error message if API call fails
 *         ids:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of banner IDs (sorted by priority)
 *         entities:
 *           type: object
 *           description: Normalized banner entities keyed by ID
 *
 * @example
 * // In component or service
 * constructor(private heroBannersStore: HeroBannersStore) {}
 *
 * // Set loading state
 * this.heroBannersStore.setLoading(true);
 *
 * // Add banners
 * this.heroBannersStore.set(banners);
 *
 * // Handle error
 * this.heroBannersStore.setError('Failed to load banners');
 *
 * // Reset store
 * this.heroBannersStore.reset();
 */

import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { HeroBanner } from '../../features/hero-banners/interfaces/hero-banner.interface';

/**
 * Hero Banners State Interface
 * Extends Akita EntityState with custom state properties
 *
 * @property loading - Indicates if banners are being loaded from API
 * @property error - Error message if banner loading failed (null if no error)
 */
export interface HeroBannersState extends EntityState<HeroBanner> {
  /** Loading state for API operations */
  loading: boolean;

  /** Error message (null if no error) */
  error: string | null;
}

/**
 * Hero Banners Store
 * Centralized state management for hero banner data
 *
 * Store Configuration:
 * - name: 'hero-banners' - Unique store identifier
 * - resettable: true - Allows store.reset() to restore initial state
 * - idKey: 'id' - Uses 'id' field as entity identifier (default)
 *
 * Initial State:
 * - loading: false
 * - error: null
 * - ids: [] (empty array)
 * - entities: {} (empty object)
 *
 * @example
 * // Service usage
 * this.heroBannersStore.setLoading(true);
 * this.api.getBanners().subscribe({
 *   next: (banners) => {
 *     this.heroBannersStore.set(banners);
 *     this.heroBannersStore.setLoading(false);
 *   },
 *   error: (err) => {
 *     this.heroBannersStore.setError(err.message);
 *   }
 * });
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'hero-banners',
  resettable: true
})
export class HeroBannersStore extends EntityStore<HeroBannersState, HeroBanner> {
  /**
   * Initialize store with default state
   */
  constructor() {
    super({
      loading: false,
      error: null
    });
  }

  /**
   * Override set() to automatically sort banners by priority
   * Highest priority banners appear first
   *
   * @param entities - Banners to set in store
   */
  override set(entities: HeroBanner[]): void {
    const sorted = [...entities].sort((a, b) => b.priority - a.priority);
    super.set(sorted);
  }

  /**
   * Override add() to maintain priority sorting
   *
   * @param entities - Banners to add
   */
  override add(entities: HeroBanner | HeroBanner[]): void {
    super.add(entities);
    this.sortByPriority();
  }

  /**
   * Update error state and automatically disable loading
   *
   * @param error - Error message (null to clear error)
   */
  updateError(error: string | null): void {
    this.update({
      error,
      loading: false // Always disable loading when error occurs
    });
  }

  /**
   * Internal: Sort all banners by priority (descending)
   * Maintains order without triggering duplicate emissions
   */
  private sortByPriority(): void {
    const state = this.getValue();
    const entities = state.entities;

    if (!entities) {
      return;
    }

    const bannersArray = Object.values(entities) as HeroBanner[];
    const sorted = bannersArray.sort((a, b) => b.priority - a.priority);

    this.set(sorted);
  }
}

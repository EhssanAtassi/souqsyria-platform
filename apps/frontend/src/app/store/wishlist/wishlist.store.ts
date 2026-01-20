import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { WishlistState, createInitialWishlistState } from './wishlist.state';

/**
 * Wishlist Store
 *
 * @description
 * Akita store for managing wishlist state across the Syrian marketplace.
 * Provides reactive state management for wishlist operations with
 * persistence to localStorage.
 *
 * Features:
 * - Centralized wishlist state management
 * - Reactive state updates
 * - Integration with WishlistService
 * - localStorage persistence support
 * - TypeScript type safety
 *
 * @example
 * ```typescript
 * // Inject the store
 * private wishlistStore = inject(WishlistStore);
 *
 * // Update wishlist items
 * this.wishlistStore.update({ items: newItems });
 *
 * // Set loading state
 * this.wishlistStore.setLoading(true);
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistStore:
 *       type: object
 *       description: Akita store for wishlist state management
 *       properties:
 *         state:
 *           $ref: '#/components/schemas/WishlistState'
 *       methods:
 *         setLoading:
 *           description: Set loading state
 *           parameters:
 *             - name: isLoading
 *               type: boolean
 *               required: true
 *         setError:
 *           description: Set error message
 *           parameters:
 *             - name: error
 *               type: string
 *               required: true
 *         updateLastModified:
 *           description: Update last modified timestamp
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'wishlist', resettable: true })
export class WishlistStore extends Store<WishlistState> {
  /**
   * Constructor
   * @description Initializes the wishlist store with default state
   */
  constructor() {
    super(createInitialWishlistState());
  }

  /**
   * Set loading state
   *
   * @description Updates the loading indicator in the wishlist state
   * @param isLoading - Loading state flag
   */
  override setLoading(isLoading: boolean): void {
    this.update({ isLoading });
  }

  /**
   * Set error message
   *
   * @description Updates the error message in the wishlist state
   * @param error - Error message or null to clear
   */
  override setError<T>(error: T): void {
    this.update({ error: error as string | null });
  }

  /**
   * Update last modified timestamp
   *
   * @description Sets the last updated timestamp to current time
   */
  updateLastModified(): void {
    this.update({ lastUpdated: new Date() });
  }

  /**
   * Reset wishlist to initial state
   *
   * @description Clears all wishlist data and resets to default state
   */
  override reset(): void {
    this.update(createInitialWishlistState());
  }
}

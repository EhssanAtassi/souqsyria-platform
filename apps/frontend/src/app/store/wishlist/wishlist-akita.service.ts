import { Injectable, inject } from '@angular/core';
import { WishlistStore } from './wishlist.store';
import { WishlistQuery } from './wishlist.query';
import { WishlistService } from '../../shared/services/wishlist.service';
import { Product } from '../../shared/interfaces/product.interface';
import { effect } from '@angular/core';

/**
 * Wishlist Akita Service
 *
 * @description
 * Integration service that connects the standalone WishlistService with Akita state management.
 * Provides a bridge between the signal-based WishlistService and Akita's reactive store.
 *
 * Features:
 * - Synchronizes WishlistService with Akita store
 * - Maintains localStorage persistence through WishlistService
 * - Provides unified API for wishlist operations
 * - Auto-syncs state changes between service and store
 * - Supports both reactive (Observable) and synchronous access patterns
 *
 * @example
 * ```typescript
 * // Inject the service
 * private wishlistAkitaService = inject(WishlistAkitaService);
 *
 * // Add product to wishlist
 * this.wishlistAkitaService.addToWishlist(product);
 *
 * // Subscribe to wishlist changes
 * this.wishlistAkitaService.items$.subscribe(items => {
 *   console.log('Wishlist updated:', items);
 * });
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistAkitaService:
 *       type: object
 *       description: Service integrating WishlistService with Akita store
 *       methods:
 *         addToWishlist:
 *           description: Add product to wishlist
 *           parameters:
 *             - name: product
 *               type: Product
 *               required: true
 *           returns:
 *             type: boolean
 *             description: True if added, false if already exists
 *         removeFromWishlist:
 *           description: Remove product from wishlist
 *           parameters:
 *             - name: productId
 *               type: string
 *               required: true
 *           returns:
 *             type: boolean
 *             description: True if removed, false if not found
 *         toggleWishlist:
 *           description: Toggle product in/out of wishlist
 *           parameters:
 *             - name: product
 *               type: Product
 *               required: true
 *           returns:
 *             type: boolean
 *             description: True if added, false if removed
 *         clearWishlist:
 *           description: Remove all items from wishlist
 *         isInWishlist:
 *           description: Check if product is in wishlist
 *           parameters:
 *             - name: productId
 *               type: string
 *               required: true
 *           returns:
 *             type: boolean
 */
@Injectable({ providedIn: 'root' })
export class WishlistAkitaService {
  /**
   * Injected dependencies
   */
  private readonly wishlistStore = inject(WishlistStore);
  private readonly wishlistQuery = inject(WishlistQuery);
  private readonly wishlistService = inject(WishlistService);

  /**
   * Observable streams from query
   */
  readonly items$ = this.wishlistQuery.selectItems$;
  readonly count$ = this.wishlistQuery.selectCount$;
  readonly isLoading$ = this.wishlistQuery.selectIsLoading$;
  readonly error$ = this.wishlistQuery.selectError$;
  readonly totalValue$ = this.wishlistQuery.selectTotalValue$;

  /**
   * Constructor
   * @description Initializes the service and sets up state synchronization
   */
  constructor() {
    this.initializeFromService();
    this.setupServiceSync();
  }

  /**
   * Initialize Akita store from WishlistService
   * @description Loads initial wishlist items from service into Akita store
   * @private
   */
  private initializeFromService(): void {
    const items = this.wishlistService.getWishlistItems();
    this.wishlistStore.update({
      items,
      lastUpdated: new Date(),
      isLoading: false,
      error: null
    });
  }

  /**
   * Setup automatic synchronization with WishlistService
   * @description Creates effect to sync WishlistService signal changes to Akita store
   * @private
   */
  private setupServiceSync(): void {
    effect(() => {
      const items = this.wishlistService.wishlistItems();
      this.wishlistStore.update({
        items,
        lastUpdated: new Date()
      });
    });
  }

  /**
   * Add product to wishlist
   *
   * @description Adds a product to the wishlist via WishlistService (auto-syncs to Akita)
   * @param product - Product to add to wishlist
   * @returns True if product was added, false if already in wishlist
   */
  addToWishlist(product: Product): boolean {
    try {
      this.wishlistStore.setError(null);
      const result = this.wishlistService.addToWishlist(product);

      if (result) {
        this.wishlistStore.updateLastModified();
        console.log(`Added ${product.name} to wishlist (Akita)`);
      }

      return result;
    } catch (error) {
      const errorMessage = 'Failed to add product to wishlist';
      this.wishlistStore.setError(errorMessage);
      console.error(errorMessage, error);
      return false;
    }
  }

  /**
   * Remove product from wishlist
   *
   * @description Removes a product from the wishlist by product ID
   * @param productId - ID of product to remove
   * @returns True if product was removed, false if not found
   */
  removeFromWishlist(productId: string): boolean {
    try {
      this.wishlistStore.setError(null);
      const result = this.wishlistService.removeFromWishlist(productId);

      if (result) {
        this.wishlistStore.updateLastModified();
        console.log(`Removed product ${productId} from wishlist (Akita)`);
      }

      return result;
    } catch (error) {
      const errorMessage = 'Failed to remove product from wishlist';
      this.wishlistStore.setError(errorMessage);
      console.error(errorMessage, error);
      return false;
    }
  }

  /**
   * Toggle product in wishlist
   *
   * @description Add if not present, remove if present
   * @param product - Product to toggle
   * @returns True if product was added, false if removed
   */
  toggleWishlist(product: Product): boolean {
    try {
      this.wishlistStore.setError(null);
      const result = this.wishlistService.toggleWishlist(product);
      this.wishlistStore.updateLastModified();

      console.log(`Toggled ${product.name} in wishlist (Akita):`, result ? 'added' : 'removed');
      return result;
    } catch (error) {
      const errorMessage = 'Failed to toggle product in wishlist';
      this.wishlistStore.setError(errorMessage);
      console.error(errorMessage, error);
      return false;
    }
  }

  /**
   * Clear entire wishlist
   *
   * @description Removes all products from wishlist
   */
  clearWishlist(): void {
    try {
      this.wishlistStore.setError(null);
      this.wishlistService.clearWishlist();
      this.wishlistStore.updateLastModified();
      console.log('Cleared wishlist (Akita)');
    } catch (error) {
      const errorMessage = 'Failed to clear wishlist';
      this.wishlistStore.setError(errorMessage);
      console.error(errorMessage, error);
    }
  }

  /**
   * Check if product is in wishlist (Observable)
   *
   * @description Returns an observable that emits true if the product is in wishlist
   * @param productId - Product ID to check
   * @returns Observable<boolean>
   */
  isInWishlist$(productId: string) {
    return this.wishlistQuery.isInWishlist$(productId);
  }

  /**
   * Check if product is in wishlist (synchronous)
   *
   * @description Synchronously checks if a product is in the wishlist
   * @param productId - Product ID to check
   * @returns boolean
   */
  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  /**
   * Get all wishlist items
   *
   * @description Returns current wishlist items array (synchronous)
   * @returns Array of products in wishlist
   */
  getItems(): Product[] {
    return this.wishlistService.getWishlistItems();
  }

  /**
   * Get wishlist count
   *
   * @description Returns current wishlist item count (synchronous)
   * @returns Number of items in wishlist
   */
  getCount(): number {
    return this.wishlistService.getWishlistCount();
  }

  /**
   * Get wishlist statistics
   *
   * @description Returns comprehensive statistics about wishlist contents
   * @returns Object with wishlist statistics
   */
  getStatistics() {
    return this.wishlistService.getWishlistStats();
  }

  /**
   * Export wishlist data
   *
   * @description Returns wishlist data as JSON string for export/backup
   * @returns JSON string of wishlist data
   */
  exportWishlist(): string {
    return this.wishlistService.exportWishlist();
  }

  /**
   * Import wishlist data
   *
   * @description Imports wishlist data from JSON string
   * @param jsonData - JSON string of wishlist data
   * @returns True if import successful, false otherwise
   */
  importWishlist(jsonData: string): boolean {
    try {
      const result = this.wishlistService.importWishlist(jsonData);
      if (result) {
        this.wishlistStore.updateLastModified();
      }
      return result;
    } catch (error) {
      const errorMessage = 'Failed to import wishlist';
      this.wishlistStore.setError(errorMessage);
      console.error(errorMessage, error);
      return false;
    }
  }
}

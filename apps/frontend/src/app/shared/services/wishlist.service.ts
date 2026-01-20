import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../interfaces/product.interface';

/**
 * Wishlist Service
 *
 * @description
 * Manages user's wishlist (favorite products) with persistent storage.
 * Provides signal-based reactive state management for wishlist operations.
 *
 * Features:
 * - Signal-based state management for reactive UI updates
 * - localStorage persistence across sessions
 * - Add/remove products to/from wishlist
 * - Check if product is in wishlist
 * - Get wishlist count
 * - Clear entire wishlist
 * - Automatic localStorage sync on every change
 *
 * Storage Key: 'souqsyria_wishlist'
 *
 * @example
 * ```typescript
 * // Inject the service
 * private wishlistService = inject(WishlistService);
 *
 * // Add product to wishlist
 * this.wishlistService.addToWishlist(product);
 *
 * // Check if product is in wishlist
 * const isWishlisted = this.wishlistService.isInWishlist(product.id);
 *
 * // Get wishlist items
 * const items = this.wishlistService.wishlistItems();
 *
 * // Get count
 * const count = this.wishlistService.wishlistCount();
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistService:
 *       type: object
 *       description: Service for managing user's product wishlist
 *       properties:
 *         wishlistItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *           description: Array of products in wishlist
 *         wishlistCount:
 *           type: integer
 *           description: Number of items in wishlist
 *       methods:
 *         addToWishlist:
 *           description: Add a product to the wishlist
 *           parameters:
 *             - name: product
 *               type: Product
 *               required: true
 *           returns:
 *             type: boolean
 *             description: True if added, false if already exists
 *         removeFromWishlist:
 *           description: Remove a product from wishlist
 *           parameters:
 *             - name: productId
 *               type: string
 *               required: true
 *           returns:
 *             type: boolean
 *             description: True if removed, false if not found
 *         isInWishlist:
 *           description: Check if product is in wishlist
 *           parameters:
 *             - name: productId
 *               type: string
 *               required: true
 *           returns:
 *             type: boolean
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
 *         getWishlistCount:
 *           description: Get number of items in wishlist
 *           returns:
 *             type: integer
 */
@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  /**
   * localStorage key for wishlist persistence
   * @private
   */
  private readonly STORAGE_KEY = 'souqsyria_wishlist';

  /**
   * Wishlist items signal
   * @description Reactive signal containing all wishlisted products
   */
  private wishlistItemsSignal = signal<Product[]>([]);

  /**
   * Public readonly wishlist items
   * @description Exposes wishlist items as readonly signal
   */
  readonly wishlistItems = this.wishlistItemsSignal.asReadonly();

  /**
   * Computed wishlist count
   * @description Automatically updates when wishlist items change
   */
  readonly wishlistCount = computed(() => this.wishlistItemsSignal().length);

  /**
   * Computed wishlist IDs for quick lookup
   * @description Set of product IDs in wishlist for O(1) lookup
   * @private
   */
  private wishlistIds = computed(() =>
    new Set(this.wishlistItemsSignal().map(item => item.id))
  );

  /**
   * Constructor
   * @description Initializes the service and loads wishlist from localStorage
   */
  constructor() {
    this.loadFromLocalStorage();
  }

  /**
   * Add product to wishlist
   * @description Adds a product to the wishlist if not already present
   * @param product - Product to add to wishlist
   * @returns True if product was added, false if already in wishlist
   */
  addToWishlist(product: Product): boolean {
    if (this.isInWishlist(product.id)) {
      console.log(`Product ${product.id} already in wishlist`);
      return false;
    }

    const currentItems = this.wishlistItemsSignal();
    this.wishlistItemsSignal.set([...currentItems, product]);
    this.saveToLocalStorage();

    console.log(`Added ${product.name} to wishlist`);
    return true;
  }

  /**
   * Remove product from wishlist
   * @description Removes a product from the wishlist by product ID
   * @param productId - ID of product to remove
   * @returns True if product was removed, false if not found
   */
  removeFromWishlist(productId: string): boolean {
    const currentItems = this.wishlistItemsSignal();
    const filteredItems = currentItems.filter(item => item.id !== productId);

    if (filteredItems.length === currentItems.length) {
      console.log(`Product ${productId} not found in wishlist`);
      return false;
    }

    this.wishlistItemsSignal.set(filteredItems);
    this.saveToLocalStorage();

    console.log(`Removed product ${productId} from wishlist`);
    return true;
  }

  /**
   * Check if product is in wishlist
   * @description Performs O(1) lookup to check if product is wishlisted
   * @param productId - ID of product to check
   * @returns True if product is in wishlist, false otherwise
   */
  isInWishlist(productId: string): boolean {
    return this.wishlistIds().has(productId);
  }

  /**
   * Toggle product in wishlist
   * @description Add if not present, remove if present
   * @param product - Product to toggle
   * @returns True if product was added, false if removed
   */
  toggleWishlist(product: Product): boolean {
    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
      return false;
    } else {
      this.addToWishlist(product);
      return true;
    }
  }

  /**
   * Clear entire wishlist
   * @description Removes all products from wishlist
   */
  clearWishlist(): void {
    this.wishlistItemsSignal.set([]);
    this.saveToLocalStorage();
    console.log('Wishlist cleared');
  }

  /**
   * Get wishlist count
   * @description Returns current number of items in wishlist
   * @returns Number of items in wishlist
   */
  getWishlistCount(): number {
    return this.wishlistCount();
  }

  /**
   * Get all wishlist items
   * @description Returns array of all wishlisted products
   * @returns Array of products in wishlist
   */
  getWishlistItems(): Product[] {
    return this.wishlistItems();
  }

  /**
   * Load wishlist from localStorage
   * @description Reads wishlist data from localStorage and initializes signal
   * @private
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as Product[];
        this.wishlistItemsSignal.set(items);
        console.log(`Loaded ${items.length} items from wishlist`);
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      this.wishlistItemsSignal.set([]);
    }
  }

  /**
   * Save wishlist to localStorage
   * @description Persists current wishlist state to localStorage
   * @private
   */
  private saveToLocalStorage(): void {
    try {
      const items = this.wishlistItemsSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving wishlist to localStorage:', error);
    }
  }

  /**
   * Export wishlist data
   * @description Returns wishlist data as JSON string for export/backup
   * @returns JSON string of wishlist data
   */
  exportWishlist(): string {
    return JSON.stringify(this.wishlistItemsSignal(), null, 2);
  }

  /**
   * Import wishlist data
   * @description Imports wishlist data from JSON string
   * @param jsonData - JSON string of wishlist data
   * @returns True if import successful, false otherwise
   */
  importWishlist(jsonData: string): boolean {
    try {
      const items = JSON.parse(jsonData) as Product[];
      this.wishlistItemsSignal.set(items);
      this.saveToLocalStorage();
      console.log(`Imported ${items.length} items to wishlist`);
      return true;
    } catch (error) {
      console.error('Error importing wishlist:', error);
      return false;
    }
  }

  /**
   * Get wishlist statistics
   * @description Returns statistics about wishlist contents
   * @returns Object with wishlist statistics
   */
  getWishlistStats(): {
    totalItems: number;
    categories: Map<string, number>;
    totalValue: number;
    averagePrice: number;
  } {
    const items = this.wishlistItemsSignal();
    const categories = new Map<string, number>();
    let totalValue = 0;

    items.forEach(item => {
      // Count by category
      const categoryName = item.category.name;
      categories.set(categoryName, (categories.get(categoryName) || 0) + 1);

      // Sum total value
      totalValue += item.price.amount;
    });

    return {
      totalItems: items.length,
      categories,
      totalValue,
      averagePrice: items.length > 0 ? totalValue / items.length : 0
    };
  }
}

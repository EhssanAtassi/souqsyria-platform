import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { WishlistStore } from './wishlist.store';
import { WishlistState } from './wishlist.state';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Product } from '../../shared/interfaces/product.interface';

/**
 * Wishlist Query
 *
 * @description
 * Akita query service for reading wishlist state and deriving computed values.
 * Provides reactive queries for wishlist data with memoized selectors.
 *
 * Features:
 * - Reactive wishlist state queries
 * - Computed wishlist statistics
 * - Product lookup by ID
 * - Memoized selectors for performance
 * - Type-safe queries
 *
 * @example
 * ```typescript
 * // Inject the query
 * private wishlistQuery = inject(WishlistQuery);
 *
 * // Get all wishlist items
 * const items$ = this.wishlistQuery.selectItems$;
 *
 * // Get wishlist count
 * const count$ = this.wishlistQuery.selectCount$;
 *
 * // Check if product is in wishlist
 * const isWishlisted$ = this.wishlistQuery.isInWishlist$('product-id');
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistQuery:
 *       type: object
 *       description: Query service for wishlist state
 *       properties:
 *         selectItems$:
 *           type: Observable<Product[]>
 *           description: Observable of wishlist items
 *         selectCount$:
 *           type: Observable<number>
 *           description: Observable of wishlist item count
 *         selectIsLoading$:
 *           type: Observable<boolean>
 *           description: Observable of loading state
 *         selectError$:
 *           type: Observable<string>
 *           description: Observable of error message
 *       methods:
 *         isInWishlist$:
 *           description: Check if product is in wishlist (Observable)
 *           parameters:
 *             - name: productId
 *               type: string
 *               required: true
 *           returns:
 *             type: Observable<boolean>
 *         isInWishlist:
 *           description: Check if product is in wishlist (synchronous)
 *           parameters:
 *             - name: productId
 *               type: string
 *               required: true
 *           returns:
 *             type: boolean
 */
@Injectable({ providedIn: 'root' })
export class WishlistQuery extends Query<WishlistState> {
  /**
   * Constructor
   * @description Initializes the wishlist query service
   * @param store - Wishlist store instance
   */
  constructor(protected override store: WishlistStore) {
    super(store);
  }

  /**
   * Select all wishlist items
   * @description Observable of all products in the wishlist
   */
  selectItems$ = this.select(state => state.items);

  /**
   * Select wishlist count
   * @description Observable of the number of items in the wishlist
   */
  selectCount$ = this.select(state => state.items.length);

  /**
   * Select loading state
   * @description Observable of wishlist loading state
   */
  selectIsLoading$ = this.select(state => state.isLoading);

  /**
   * Select error message
   * @description Observable of wishlist error message
   */
  selectError$ = this.select(state => state.error);

  /**
   * Select last updated timestamp
   * @description Observable of last wishlist update time
   */
  selectLastUpdated$ = this.select(state => state.lastUpdated);

  /**
   * Select wishlist total value
   * @description Observable of total value of all wishlist items
   */
  selectTotalValue$ = this.select(state => {
    return state.items.reduce((total, item) => total + item.price.amount, 0);
  });

  /**
   * Select wishlist by category
   * @description Observable of wishlist items grouped by category
   */
  selectByCategory$ = this.select(state => {
    const grouped = new Map<string, Product[]>();
    state.items.forEach(item => {
      const categoryName = item.category.name;
      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, []);
      }
      grouped.get(categoryName)!.push(item);
    });
    return grouped;
  });

  /**
   * Check if product is in wishlist (Observable)
   *
   * @description Returns an observable that emits true if the product is in wishlist
   * @param productId - Product ID to check
   * @returns Observable<boolean>
   */
  isInWishlist$(productId: string): Observable<boolean> {
    return this.selectItems$.pipe(
      map(items => items.some(item => item.id === productId))
    );
  }

  /**
   * Check if product is in wishlist (synchronous)
   *
   * @description Synchronously checks if a product is in the wishlist
   * @param productId - Product ID to check
   * @returns boolean
   */
  isInWishlist(productId: string): boolean {
    const items = this.getValue().items;
    return items.some(item => item.id === productId);
  }

  /**
   * Get all wishlist items (synchronous)
   *
   * @description Returns current wishlist items array
   * @returns Array of products in wishlist
   */
  getItems(): Product[] {
    return this.getValue().items;
  }

  /**
   * Get wishlist count (synchronous)
   *
   * @description Returns current wishlist item count
   * @returns Number of items in wishlist
   */
  getCount(): number {
    return this.getValue().items.length;
  }

  /**
   * Get product by ID from wishlist
   *
   * @description Finds and returns a product from wishlist by ID
   * @param productId - Product ID to find
   * @returns Product or undefined if not found
   */
  getProduct(productId: string): Product | undefined {
    return this.getValue().items.find(item => item.id === productId);
  }

  /**
   * Check if wishlist is empty
   *
   * @description Returns true if wishlist has no items
   * @returns boolean
   */
  isEmpty(): boolean {
    return this.getValue().items.length === 0;
  }

  /**
   * Get wishlist statistics
   *
   * @description Returns comprehensive statistics about wishlist contents
   * @returns Object with wishlist statistics
   */
  getStatistics(): {
    totalItems: number;
    totalValue: number;
    averagePrice: number;
    categoriesCount: number;
    categories: Map<string, number>;
  } {
    const items = this.getValue().items;
    const categories = new Map<string, number>();
    let totalValue = 0;

    items.forEach(item => {
      totalValue += item.price.amount;
      const categoryName = item.category.name;
      categories.set(categoryName, (categories.get(categoryName) || 0) + 1);
    });

    return {
      totalItems: items.length,
      totalValue,
      averagePrice: items.length > 0 ? totalValue / items.length : 0,
      categoriesCount: categories.size,
      categories
    };
  }
}

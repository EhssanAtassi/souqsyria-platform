import { Query } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartStore } from './cart.store';
import { Cart, CartItem, CartGroupedBySeller } from '../../shared/interfaces/cart.interface';

/**
 * Cart Query Service
 *
 * Provides reactive queries and computed observables for cart state.
 * All cart data access should go through this query service.
 *
 * Features:
 * - Reactive cart observables
 * - Computed derived values (isEmpty, hasDiscount)
 * - Items grouped by seller
 * - Individual item lookup
 *
 * @example
 * // In component
 * constructor(private cartQuery: CartQuery) {}
 *
 * ngOnInit() {
 *   // Subscribe to cart changes
 *   this.cartQuery.cart$.subscribe(cart => {
 *     console.log('Cart updated:', cart);
 *   });
 *
 *   // Check if cart is empty
 *   this.cartQuery.isEmpty$.subscribe(isEmpty => {
 *     console.log('Cart is empty:', isEmpty);
 *   });
 * }
 */
@Injectable({ providedIn: 'root' })
export class CartQuery extends Query<Cart> {

  /** Observable of complete cart state */
  cart$!: Observable<Cart>;

  /** Observable of cart items array */
  items$!: Observable<CartItem[]>;

  /** Observable of total item count */
  itemCount$!: Observable<number>;

  /** Observable of cart total amount */
  total$!: Observable<number>;

  /** Observable of subtotal (before shipping and discounts) */
  subtotal$!: Observable<number>;

  /** Observable of applied discount amount */
  discount$!: Observable<number>;

  /** Observable of shipping cost */
  shipping$!: Observable<number>;

  /**
   * Cart Empty State Observable
   * Returns true if cart has no items
   */
  isEmpty$!: Observable<boolean>;

  /**
   * Discount Applied Observable
   * Returns true if any discount is applied
   */
  hasDiscount$!: Observable<boolean>;

  /**
   * Items Grouped by Seller Observable
   *
   * Groups cart items by seller for display purposes.
   * Useful for showing items organized by vendor.
   *
   * Returns array of seller groups with:
   * - seller: Seller information
   * - items: Array of items from this seller
   * - subtotal: Total for items from this seller
   */
  itemsBySeller$!: Observable<CartGroupedBySeller[]>;

  constructor(protected override store: CartStore) {
    super(store);

    // Initialize observables after parent constructor
    this.cart$ = this.select();
    this.items$ = this.select(state => state.items);
    this.itemCount$ = this.select(state => state.totals.itemCount);
    this.total$ = this.select(state => state.totals.total);
    this.subtotal$ = this.select(state => state.totals.subtotal);
    this.discount$ = this.select(state => state.totals.discount);
    this.shipping$ = this.select(state => state.totals.shipping);

    this.isEmpty$ = this.items$.pipe(map(items => items.length === 0));
    this.hasDiscount$ = this.discount$.pipe(map(discount => discount > 0));

    this.itemsBySeller$ = this.items$.pipe(
      map(items => {
        const grouped = new Map();
        items.forEach(item => {
          const sellerId = item.product.seller.id;
          if (!grouped.has(sellerId)) {
            grouped.set(sellerId, {
              seller: item.product.seller,
              items: [],
              subtotal: 0
            });
          }
          const group = grouped.get(sellerId);
          group.items.push(item);
          group.subtotal += item.price.totalPrice;
        });
        return Array.from(grouped.values());
      })
    );
  }

  /**
   * Get Specific Cart Item
   *
   * @param itemId - Cart item ID
   * @returns Cart item or undefined
   */
  getItem(itemId: string) {
    return this.getValue().items.find(item => item.id === itemId);
  }
}

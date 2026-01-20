import { Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Cart } from '../../shared/interfaces/cart.interface';

/**
 * Cart Store
 *
 * Manages shopping cart state with localStorage persistence.
 * Automatically saves and loads cart data from browser storage.
 *
 * Features:
 * - Shopping cart items management
 * - Real-time totals calculation
 * - Currency selection
 * - Coupon management
 * - localStorage persistence
 * - Resettable state
 *
 * State Structure:
 * - items: Array of cart items with product details
 * - totals: Computed totals (subtotal, shipping, discount, total)
 * - selectedCurrency: Active currency (USD, EUR, SYP)
 * - appliedCoupon: Active discount coupon
 * - timestamps: Created and updated dates
 *
 * @example
 * // Inject in component
 * constructor(private cartStore: CartStore) {}
 *
 * // Access current state
 * const cart = this.cartStore.getValue();
 */
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'cart', resettable: true })
export class CartStore extends Store<Cart> {
  constructor() {
    super({
      id: 'cart_' + Date.now(),
      items: [],
      totals: {
        subtotal: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        currency: 'USD',
        itemCount: 0
      },
      selectedCurrency: 'USD',
      appliedCoupon: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Load cart from localStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Load Cart from localStorage
   *
   * Attempts to restore previous cart state from browser storage.
   * Falls back to empty cart if storage is unavailable or corrupted.
   */
  private loadFromStorage() {
    const stored = localStorage.getItem('syrian_marketplace_cart');
    if (stored) {
      try {
        const cart = JSON.parse(stored);
        this.update(cart);
      } catch (e) {
        console.error('Failed to load cart from storage', e);
      }
    }
  }
}

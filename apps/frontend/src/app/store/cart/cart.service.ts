import { Injectable, inject } from '@angular/core';
import { CartStore } from './cart.store';
import { CartQuery } from './cart.query';
import { ProductsQuery } from '../products/products.query';
import { CartItem } from '../../shared/interfaces/cart.interface';
import { CartSyncService } from './cart-sync.service';
import { CartOfflineQueueService } from './cart-offline-queue.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Cart Service
 *
 * Business logic for shopping cart operations.
 * Handles adding, removing, updating items and managing discounts.
 *
 * Features:
 * - Add products to cart
 * - Remove items from cart
 * - Update item quantities
 * - Apply/remove coupons
 * - Automatic totals calculation
 * - localStorage persistence
 * - Backend API sync (guest and authenticated)
 * - Offline queue support for failed syncs
 *
 * @example
 * // In component
 * constructor(private cartService: CartService) {}
 *
 * addProduct(productId: string) {
 *   this.cartService.addToCart(productId, 1);
 * }
 *
 * applyCoupon() {
 *   const success = this.cartService.applyCoupon('SYRIA10');
 *   if (success) {
 *     console.log('Coupon applied successfully');
 *   }
 * }
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private store = inject(CartStore);
  private query = inject(CartQuery);
  private productsQuery = inject(ProductsQuery);
  private syncService = inject(CartSyncService);
  private offlineQueue = inject(CartOfflineQueueService);

  /** Expose cart observables for components */
  cart$ = this.query.cart$;
  items$ = this.query.items$;
  itemCount$ = this.query.itemCount$;
  total$ = this.query.total$;
  isEmpty$ = this.query.isEmpty$;

  /**
   * Add Product to Cart
   *
   * Adds a product to the cart or updates quantity if already exists.
   * Performs optimistic update locally, then syncs with backend.
   *
   * @param productId - Product entity ID
   * @param quantity - Quantity to add (default: 1)
   */
  addToCart(productId: string, quantity: number = 1) {
    const product = this.productsQuery.getEntity(productId);
    if (!product) return;

    const cart = this.query.getValue();
    const existingItem = cart.items.find(item => item.product.id === productId);

    if (existingItem) {
      // Update quantity of existing item
      this.updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      // Add new item to cart (optimistic update)
      const newItem: CartItem = {
        id: 'item_' + Date.now(),
        product,
        quantity,
        price: {
          unitPrice: product.price.amount,
          totalPrice: product.price.amount * quantity,
          discount: 0,
          shipping: 0,
          currency: 'USD'
        },
        selectedShippingMethod: product.shipping.methods[0]?.id || '',
        addedAt: new Date()
      };

      this.store.update(state => ({
        items: [...state.items, newItem],
        updatedAt: new Date(),
        syncStatus: 'pending'
      }));

      this.recalculateTotals();
      this.saveToStorage();

      // Sync with backend
      this.syncCartToBackend();
    }
  }

  /**
   * Remove Item from Cart
   *
   * Performs optimistic update locally, then syncs with backend.
   *
   * @param itemId - Cart item ID to remove
   */
  removeFromCart(itemId: string) {
    // Optimistic update
    this.store.update(state => ({
      items: state.items.filter(item => item.id !== itemId),
      updatedAt: new Date(),
      syncStatus: 'pending'
    }));

    this.recalculateTotals();
    this.saveToStorage();

    // Sync with backend
    this.syncCartToBackend();
  }

  /**
   * Update Item Quantity
   *
   * Updates the quantity of a cart item.
   * Removes item if quantity is 0 or negative.
   * Performs optimistic update locally, then syncs with backend.
   *
   * @param itemId - Cart item ID
   * @param quantity - New quantity
   */
  updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    // Optimistic update
    this.store.update(state => ({
      items: state.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              price: {
                ...item.price,
                totalPrice: item.price.unitPrice * quantity
              }
            }
          : item
      ),
      updatedAt: new Date(),
      syncStatus: 'pending'
    }));

    this.recalculateTotals();
    this.saveToStorage();

    // Sync with backend
    this.syncCartToBackend();
  }

  /**
   * Clear Cart
   *
   * Removes all items from cart
   */
  clearCart() {
    this.store.update({
      items: [],
      updatedAt: new Date()
    });

    this.recalculateTotals();
    this.saveToStorage();
  }

  /**
   * Apply Discount Coupon
   *
   * Validates and applies a discount coupon to the cart.
   * Currently supports mock coupons: SYRIA10 (10% off) and WELCOME15 (15% off).
   *
   * @param code - Coupon code to apply
   * @returns True if coupon is valid and applied, false otherwise
   */
  applyCoupon(code: string): boolean {
    // Mock coupon validation (replace with real API call)
    if (code === 'SYRIA10' || code === 'WELCOME15') {
      this.store.update({
        appliedCoupon: {
          code,
          name: code === 'SYRIA10' ? '10% Off' : '15% Off First Order',
          type: 'percentage',
          value: code === 'SYRIA10' ? 10 : 15,
          currency: 'USD',
          isValid: true
        }
      });
      this.recalculateTotals();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Remove Applied Coupon
   */
  removeCoupon() {
    this.store.update({ appliedCoupon: null });
    this.recalculateTotals();
    this.saveToStorage();
  }

  /**
   * Recalculate Cart Totals
   *
   * Computes subtotal, shipping, discounts, and final total.
   * Called automatically after any cart modification.
   */
  private recalculateTotals() {
    const cart = this.query.getValue();

    // Calculate subtotal (sum of all item prices)
    const subtotal = cart.items.reduce((sum, item) => sum + item.price.totalPrice, 0);

    // Calculate total shipping (sum of all item shipping costs)
    const shipping = cart.items.reduce((sum, item) => sum + item.price.shipping, 0);

    // Calculate discount based on applied coupon
    let discount = 0;
    if (cart.appliedCoupon && cart.appliedCoupon.isValid) {
      if (cart.appliedCoupon.type === 'percentage') {
        discount = (subtotal * cart.appliedCoupon.value) / 100;
      } else if (cart.appliedCoupon.type === 'fixed') {
        discount = cart.appliedCoupon.value;
      }
    }

    // Calculate final total (subtotal + shipping - discount)
    const total = Math.max(0, subtotal + shipping - discount);

    // Calculate total item count
    const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

    // Update totals in store
    this.store.update({
      totals: {
        subtotal,
        shipping,
        discount,
        total,
        currency: 'USD',
        itemCount
      }
    });
  }

  /**
   * Save Cart to localStorage
   *
   * Persists current cart state to browser storage.
   * Called automatically after any cart modification.
   */
  private saveToStorage() {
    const cart = this.query.getValue();
    localStorage.setItem('syrian_marketplace_cart', JSON.stringify(cart));
  }

  /**
   * Get Session ID from Cookie
   *
   * Reads guest session ID from browser cookies.
   *
   * @returns Session ID or null if not found
   */
  private getSessionId(): string | null {
    const match = document.cookie.match(/guest_session_id=([^;]+)/);
    const sessionId = match ? match[1] : null;
    console.log('Retrieved session ID from cookie:', sessionId);
    return sessionId;
  }

  /**
   * Fetch Cart from Backend
   *
   * Loads cart from backend API based on authentication status.
   * - Guest users: Uses session ID from cookie
   * - Authenticated users: Uses user ID
   *
   * @param userId - Optional user ID for authenticated users
   */
  fetchCartFromBackend(userId?: string) {
    console.log('Fetching cart from backend...', { userId });

    if (userId) {
      // Authenticated user - fetch user cart
      console.log('Fetching authenticated user cart for user:', userId);
      this.syncService.fetchUserCart(userId)
        .pipe(
          tap(cart => {
            console.log('Fetched user cart successfully:', cart);
            this.updateStoreFromBackend(cart);
          }),
          catchError(error => {
            console.error('Failed to fetch user cart:', error);
            // Continue with local cart on error
            return of(null);
          })
        )
        .subscribe();
    } else {
      // Guest user - fetch guest cart using session ID
      const sessionId = this.getSessionId();
      if (sessionId) {
        console.log('Fetching guest cart for session:', sessionId);
        this.syncService.fetchGuestCart(sessionId)
          .pipe(
            tap(cart => {
              console.log('Fetched guest cart successfully:', cart);
              this.updateStoreFromBackend(cart);
            }),
            catchError(error => {
              console.error('Failed to fetch guest cart:', error);
              // Continue with local cart on error
              return of(null);
            })
          )
          .subscribe();
      } else {
        console.log('No session ID found - using local cart');
      }
    }
  }

  /**
   * Sync Cart to Backend
   *
   * Syncs current local cart state with backend API.
   * Uses guest or authenticated endpoint based on user state.
   */
  private syncCartToBackend() {
    const cart = this.query.getValue();
    const sessionId = this.getSessionId();

    console.log('Syncing cart to backend...', {
      itemCount: cart.items.length,
      sessionId,
      userId: cart.userId
    });

    // Update sync status
    this.store.update({ syncStatus: 'syncing' });

    if (cart.userId) {
      // Authenticated user - sync authenticated cart
      console.log('Syncing authenticated cart for user:', cart.userId);
      this.syncService.syncAuthenticatedCart(cart.userId, cart)
        .pipe(
          tap(syncedCart => {
            console.log('Cart synced successfully (authenticated):', syncedCart);
            this.handleSyncSuccess(syncedCart);
          }),
          catchError(error => {
            console.error('Cart sync failed (authenticated):', error);
            this.handleSyncFailure(error);
            return of(null);
          })
        )
        .subscribe();
    } else if (sessionId) {
      // Guest user - sync guest cart
      console.log('Syncing guest cart for session:', sessionId);
      this.syncService.syncGuestCart(sessionId, cart.items)
        .pipe(
          tap(syncedCart => {
            console.log('Cart synced successfully (guest):', syncedCart);
            this.handleSyncSuccess(syncedCart);
          }),
          catchError(error => {
            console.error('Cart sync failed (guest):', error);
            this.handleSyncFailure(error);
            return of(null);
          })
        )
        .subscribe();
    } else {
      console.warn('Cannot sync cart - no session ID or user ID available');
      this.store.update({ syncStatus: 'offline' });
    }
  }

  /**
   * Handle Sync Success
   *
   * Updates local store with server response on successful sync.
   *
   * @param syncedCart - Cart data from server
   */
  private handleSyncSuccess(syncedCart: any) {
    console.log('Handling sync success - updating store with server data');

    // Check if server response differs from local state
    const localCart = this.query.getValue();
    const hasConflict = this.detectConflict(localCart, syncedCart);

    if (hasConflict) {
      console.warn('Conflict detected between local and server cart. Accepting server version.');
      // In production, show user notification about conflict
    }

    // Update store with server data
    this.store.update({
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
      version: syncedCart.version || localCart.version
    });
  }

  /**
   * Handle Sync Failure
   *
   * Queues operation for offline processing when sync fails.
   *
   * @param error - Error from sync attempt
   */
  private async handleSyncFailure(error: any) {
    console.error('Handling sync failure - queuing for offline processing');

    // Update sync status
    this.store.update({ syncStatus: 'offline' });

    // Queue operation for later sync
    try {
      const cart = this.query.getValue();
      await this.offlineQueue.enqueue('SYNC', {
        items: cart.items,
        timestamp: new Date().toISOString()
      });
      console.log('Operation queued successfully for offline sync');
    } catch (queueError) {
      console.error('Failed to queue operation:', queueError);
    }
  }

  /**
   * Update Store from Backend Response
   *
   * Updates Akita store with cart data fetched from backend.
   *
   * @param backendCart - Cart data from backend API
   */
  private updateStoreFromBackend(backendCart: any) {
    if (!backendCart || !backendCart.items) {
      console.log('No cart data from backend - keeping local cart');
      return;
    }

    console.log('Updating store with backend cart data:', backendCart);

    // Map backend items to local CartItem format
    const items = backendCart.items.map((item: any) => {
      // Lookup product from products store
      const product = this.productsQuery.getEntity(item.productId || item.product?.id);

      return {
        id: item.id,
        product: product || item.product,
        quantity: item.quantity,
        selectedVariant: item.variant,
        selectedShippingMethod: item.shippingMethodId,
        price: {
          unitPrice: item.priceAtAdd || item.price?.unitPrice || 0,
          totalPrice: (item.priceAtAdd || item.price?.unitPrice || 0) * item.quantity,
          discount: 0,
          shipping: 0,
          currency: 'USD'
        },
        addedAt: new Date(item.addedAt || item.createdAt),
        notes: item.notes
      };
    });

    // Update store
    this.store.update({
      items,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
      version: backendCart.version || 0,
      sessionId: backendCart.sessionId,
      userId: backendCart.userId,
      updatedAt: new Date()
    });

    // Recalculate totals
    this.recalculateTotals();
    this.saveToStorage();
  }

  /**
   * Detect Conflict
   *
   * Compares local and server cart to detect conflicts.
   *
   * @param localCart - Local cart state
   * @param serverCart - Server cart state
   * @returns True if conflict detected
   */
  private detectConflict(localCart: any, serverCart: any): boolean {
    // Simple conflict detection based on item count and version
    const localItemCount = localCart.items.length;
    const serverItemCount = serverCart.items?.length || 0;
    const versionMismatch = localCart.version !== serverCart.version;

    const hasConflict = localItemCount !== serverItemCount || versionMismatch;

    if (hasConflict) {
      console.warn('Conflict detected:', {
        localItemCount,
        serverItemCount,
        localVersion: localCart.version,
        serverVersion: serverCart.version
      });
    }

    return hasConflict;
  }
}

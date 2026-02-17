import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Cart, CartItem, CartValidationResult } from '../../shared/interfaces/cart.interface';

/**
 * Validate Cart Response
 *
 * Response structure from cart validation endpoint.
 */
export interface ValidateCartResponse {
  /** Whether cart is valid and ready for checkout (matches backend `valid` field) */
  valid: boolean;
  warnings: CartValidationWarning[];
  errors: CartValidationError[];
}

export interface CartValidationWarning {
  type: 'PRICE_INCREASE' | 'PRICE_DECREASE' | 'LOW_STOCK' | 'SHIPPING_UNAVAILABLE';
  itemId: string;
  message: string;
  oldValue?: number;
  newValue?: number;
}

export interface CartValidationError {
  type: 'OUT_OF_STOCK' | 'DISCONTINUED' | 'INVALID_QUANTITY' | 'SHIPPING_RESTRICTED';
  itemId: string;
  message: string;
}

/**
 * Extract Product ID
 *
 * Helper function to extract numeric product ID from CartItem.
 *
 * @param item - Cart item
 * @returns Product ID as number
 */
function extractProductId(item: CartItem): number {
  if (typeof item.product.id === 'number') {
    return item.product.id;
  }
  return parseInt(String(item.product.id), 10);
}

/**
 * Extract Variant ID
 *
 * Helper function to extract numeric variant ID from variant ID string.
 *
 * @param variantId - Variant ID (string or number)
 * @returns Variant ID as number
 */
function extractVariantId(variantId: string | number): number {
  if (typeof variantId === 'number') {
    return variantId;
  }
  return parseInt(String(variantId), 10);
}

/**
 * Cart Sync Service
 *
 * Handles HTTP communication with the NestJS backend cart API.
 * Provides methods for guest cart, authenticated cart, and cart validation.
 *
 * Features:
 * - Guest cart fetch and sync
 * - Authenticated user cart operations
 * - Cart merge (guest → authenticated on login)
 * - Cart validation for price/stock changes
 * - Exponential backoff retry for failed requests
 * - Conflict resolution support
 *
 * API Endpoints (NestJS Backend):
 * - GET  /api/cart/guest/:sessionId - Fetch guest cart
 * - POST /api/cart/guest - Create/update guest cart
 * - GET  /api/cart - Fetch authenticated user cart
 * - POST /api/cart/sync - Bulk sync authenticated cart
 * - POST /api/cart/merge - Merge guest cart into authenticated cart
 * - POST /api/cart/validate - Validate cart (price/stock checks)
 *
 * @swagger
 * components:
 *   schemas:
 *     CartSyncService:
 *       type: object
 *       description: Service for syncing cart with backend API
 */
@Injectable({ providedIn: 'root' })
export class CartSyncService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cart`;

  /**
   * Fetch Guest Cart
   *
   * Retrieves cart data for a guest session.
   *
   * @param sessionId - Guest session ID
   * @returns Observable<Cart>
   */
  fetchGuestCart(sessionId: string): Observable<Cart> {
    console.log(`Fetching guest cart for session: ${sessionId}`);

    return this.http.get<Cart>(`${this.apiUrl}/guest/${sessionId}`).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          console.log(`Retry attempt ${retryCount} for fetchGuestCart`);
          return timer(Math.pow(2, retryCount) * 1000);
        }
      }),
      catchError(error => {
        console.error('Failed to fetch guest cart:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sync Guest Cart
   *
   * Updates guest cart on server with local cart items.
   *
   * @param sessionId - Guest session ID
   * @param items - Cart items to sync
   * @returns Observable<Cart>
   */
  syncGuestCart(sessionId: string, items: CartItem[]): Observable<Cart> {
    console.log(`Syncing guest cart for session: ${sessionId}`, items);

    const payload = {
      sessionId,
      items: this.serializeCartItems(items),
      timestamp: new Date().toISOString()
    };

    return this.http.post<Cart>(`${this.apiUrl}/guest`, payload).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000)
      }),
      catchError(error => {
        console.error('Failed to sync guest cart:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch User Cart
   *
   * Retrieves cart data for an authenticated user.
   * JWT token is automatically included in request via HTTP interceptor.
   *
   * @param userId - User ID (for logging, backend extracts from JWT)
   * @returns Observable<Cart>
   */
  fetchUserCart(userId: string): Observable<Cart> {
    console.log(`[CartSyncService] Fetching user cart for user: ${userId}`);

    return this.http.get<Cart>(this.apiUrl).pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => {
          console.log(`[CartSyncService] Retry attempt ${retryCount} for fetchUserCart`);
          return timer(Math.pow(2, retryCount) * 1000);
        }
      }),
      catchError(error => {
        console.error('[CartSyncService] Failed to fetch user cart:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sync Authenticated Cart (Enhanced for Phase 4.2)
   *
   * Bulk sync of cart items for authenticated user.
   * Uses optimistic locking with version numbers to detect conflicts.
   *
   * **Conflict Handling:**
   * - If server cart version differs (409 Conflict), error is thrown with server cart in response
   * - Caller should use CartConflictResolver to handle conflict
   *
   * **Request Format (SyncCartRequest):**
   * ```json
   * {
   *   "items": [
   *     {
   *       "productId": 123,
   *       "variantId": 456,
   *       "quantity": 2
   *     }
   *   ],
   *   "clientVersion": 5,
   *   "clientTimestamp": "2025-11-12T10:30:00.000Z"
   * }
   * ```
   *
   * @param userId - User ID (used for logging, backend extracts from JWT)
   * @param cart - Current cart state
   * @returns Observable<Cart> - Updated cart from server
   * @throws 409 Conflict if version mismatch detected
   */
  syncAuthenticatedCart(userId: string, cart: Cart): Observable<Cart> {
    console.log(`[CartSyncService] Syncing authenticated cart for user: ${userId}`, {
      itemCount: cart.items.length,
      version: cart.version,
    });

    // Transform to SyncCartRequest format
    const payload = {
      items: cart.items.map((item) => ({
        productId: extractProductId(item),
        variantId: item.selectedVariant?.id ? extractVariantId(item.selectedVariant.id) : undefined,
        quantity: item.quantity,
      })),
      clientVersion: cart.version || 0,
      clientTimestamp: new Date().toISOString(),
    };

    console.log('[CartSyncService] Sync payload:', payload);

    return this.http.post<Cart>(`${this.apiUrl}/sync`, payload).pipe(
      retry({
        count: 2,
        delay: (error) => {
          // Don't retry on conflict (409) - needs conflict resolution
          if (error.status === 409) {
            return throwError(() => error);
          }
          return timer(1000);
        },
      }),
      catchError((error) => {
        // 409 Conflict = version mismatch, needs conflict resolution
        if (error.status === 409) {
          console.warn('[CartSyncService] Cart sync conflict detected (409):', {
            localVersion: cart.version,
            serverCart: error.error,
          });
        } else {
          console.error('[CartSyncService] Cart sync failed:', error);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Merge Guest Cart into Authenticated Cart (Enhanced for Phase 4.2)
   *
   * Called after user login to combine guest cart with their authenticated cart.
   * Backend merges items, preferring higher quantities for duplicates.
   *
   * **Flow:**
   * 1. User logs in with items in guest cart
   * 2. Frontend calls this method with guest session ID
   * 3. Backend merges guest cart into user's authenticated cart
   * 4. Guest cart is deleted
   * 5. Merged cart is returned
   *
   * **Request Format:**
   * ```json
   * {
   *   "guestSessionId": "guest_abc123"
   * }
   * ```
   *
   * @param userId - User ID (for logging)
   * @param sessionId - Guest session ID from cookie
   * @returns Observable<Cart> - Merged cart
   */
  mergeGuestCart(userId: string, sessionId: string): Observable<Cart> {
    console.log(`[CartSyncService] Merging guest cart into user cart`, {
      userId,
      sessionId,
    });

    const payload = {
      guestSessionId: sessionId,
    };

    return this.http.post<Cart>(`${this.apiUrl}/merge`, payload).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError((error) => {
        console.error('[CartSyncService] Failed to merge guest cart:', error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Validate Cart (Enhanced for Phase 4.2)
   *
   * Validates cart against current product prices and stock availability.
   * Returns warnings for price changes, out-of-stock items, etc.
   *
   * **Validation Checks:**
   * - Product availability (in stock, discontinued)
   * - Price changes since item was added
   * - Quantity limits (min/max order quantities)
   * - Shipping availability to user's location
   *
   * **Response Format (ValidateCartResponse):**
   * ```json
   * {
   *   "valid": true,
   *   "warnings": [
   *     {
   *       "type": "PRICE_INCREASE",
   *       "itemId": "item_123",
   *       "message": "Price increased from $10 to $12",
   *       "oldValue": 10,
   *       "newValue": 12
   *     }
   *   ],
   *   "errors": []
   * }
   * ```
   *
   * @param cart - Cart to validate
   * @returns Observable<ValidateCartResponse>
   */
  validateCart(cart: Cart): Observable<ValidateCartResponse> {
    console.log('[CartSyncService] Validating cart:', cart.id);

    const payload = {
      items: this.serializeCartItems(cart.items),
      timestamp: new Date().toISOString(),
    };

    return this.http.post<ValidateCartResponse>(`${this.apiUrl}/validate`, payload).pipe(
      catchError((error) => {
        console.error('[CartSyncService] Cart validation failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add Item to Cart (Server)
   *
   * Adds a single item to cart on server.
   *
   * @param productId - Product ID
   * @param quantity - Quantity to add
   * @param sessionId - Session ID (guest) or null (authenticated)
   * @returns Observable<Cart>
   */
  addItemToCart(productId: string, quantity: number, sessionId?: string): Observable<Cart> {
    const payload = {
      productId,
      quantity,
      sessionId,
      timestamp: new Date().toISOString()
    };

    const endpoint = sessionId ? `${this.apiUrl}/guest` : `${this.apiUrl}/item`;

    return this.http.post<Cart>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Failed to add item to cart:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update Cart Item (Server)
   *
   * Updates quantity or properties of a cart item on server.
   *
   * @param cartItemId - Cart item ID
   * @param quantity - New quantity
   * @returns Observable<Cart>
   */
  updateCartItem(cartItemId: string, quantity: number): Observable<Cart> {
    const payload = {
      quantity,
      timestamp: new Date().toISOString()
    };

    return this.http.put<Cart>(`${this.apiUrl}/item/${cartItemId}`, payload).pipe(
      catchError(error => {
        console.error('Failed to update cart item:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove Cart Item (Server)
   *
   * Removes an item from cart on server.
   *
   * @param cartItemId - Cart item ID
   * @returns Observable<Cart>
   */
  removeCartItem(cartItemId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.apiUrl}/item/${cartItemId}`).pipe(
      catchError(error => {
        console.error('Failed to remove cart item:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear Cart (Server)
   *
   * Removes all items from cart on server.
   *
   * @param sessionId - Session ID (guest) or null (authenticated)
   * @returns Observable<Cart>
   */
  clearCart(sessionId?: string): Observable<Cart> {
    const endpoint = sessionId ? `${this.apiUrl}/guest/${sessionId}` : this.apiUrl;

    return this.http.delete<Cart>(endpoint).pipe(
      catchError(error => {
        console.error('Failed to clear cart:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Serialize Cart Items
   *
   * Converts CartItem[] to backend-compatible format.
   * Removes circular references and non-serializable properties.
   *
   * @param items - Cart items
   * @returns Serialized cart items
   */
  private serializeCartItems(items: CartItem[]): {
    id: string;
    productId: string | number;
    quantity: number;
    variantId?: string | number;
    shippingMethodId?: string;
    priceAtAdd?: number;
    addedAt?: Date;
    notes?: string;
  }[] {
    return items.map(item => ({
      id: item.id,
      productId: item.product.id,
      quantity: item.quantity,
      variantId: item.selectedVariant?.id,
      shippingMethodId: item.selectedShippingMethod,
      priceAtAdd: item.priceAtAdd || item.price.unitPrice,
      addedAt: item.addedAt,
      notes: item.notes
    }));
  }

  /**
   * Log Sync Latency (Analytics)
   *
   * Measures and logs the time taken for cart sync operations.
   *
   * @param operation - Operation name
   * @param startTime - Operation start timestamp
   */
  private logSyncLatency(operation: string, startTime: number): void {
    const latency = Date.now() - startTime;
    console.log(`[Analytics] cart.sync.${operation}.latency: ${latency}ms`);

    // Send to analytics service (if available)
    const windowWithAnalytics = window as Window & { analytics?: { track: (event: string, data: Record<string, unknown>) => void } };
    if (windowWithAnalytics.analytics) {
      windowWithAnalytics.analytics.track('cart_sync_latency', {
        operation,
        latency,
        timestamp: new Date().toISOString()
      });
    }
  }
}

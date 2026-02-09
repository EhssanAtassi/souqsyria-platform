import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Cart API Service
 *
 * Handles HTTP communication with the NestJS backend for cart operations.
 * Connects to the souqsyria-backend MySQL database.
 *
 * Backend Endpoints:
 * - GET    /api/cart                          - Get current user's cart
 * - POST   /api/cart/add                      - Add item to cart
 * - PUT    /api/cart/item/:itemId             - Update cart item quantity
 * - DELETE /api/cart/item/:variantId          - Remove item from cart (soft-delete)
 * - POST   /api/cart/item/:itemId/undo-remove - Undo remove within 5s
 * - DELETE /api/cart/clear                    - Clear entire cart
 * - POST   /api/cart/validate                 - Validate cart before checkout
 *
 * @swagger
 * tags:
 *   - name: Cart API
 *     description: HTTP client for cart operations with MySQL backend
 */
@Injectable({
  providedIn: 'root'
})
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cart`;

  /**
   * Get current user's cart
   *
   * @returns Observable of cart data
   */
  getCart(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  /**
   * Add item to cart
   *
   * @param variantId - Product variant ID
   * @param quantity - Quantity to add
   * @returns Observable of updated cart
   */
  addToCart(variantId: string, quantity: number = 1): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/add`, {
      variant_id: Number(variantId),
      quantity
    });
  }

  /**
   * Update item quantity in cart (idempotent PUT)
   *
   * @param itemId - Cart item ID
   * @param quantity - New absolute quantity
   * @returns Observable of updated cart item
   */
  updateQuantity(itemId: string, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/item/${itemId}`, {
      quantity
    });
  }

  /**
   * Remove item from cart (soft-delete with 5s undo window)
   *
   * @param variantId - Product variant ID to remove
   * @returns Observable with { itemId } for undo reference
   */
  removeFromCart(variantId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/item/${variantId}`);
  }

  /**
   * Undo remove cart item within 5-second window
   *
   * @param itemId - Cart item ID returned from removeFromCart
   * @returns Observable of restored cart item
   */
  undoRemove(itemId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/item/${itemId}/undo-remove`, {});
  }

  /**
   * Clear entire cart
   *
   * @returns Observable of empty cart
   */
  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/clear`);
  }

  /**
   * Validate cart before checkout
   *
   * @returns Observable of validation result with price changes, stock status
   */
  validateCart(): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/validate`, {});
  }

  /**
   * Apply coupon code to cart
   *
   * @param code - Coupon code
   * @returns Observable of updated cart with discount applied
   */
  applyCoupon(code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/coupon`, { code });
  }

  /**
   * Remove coupon from cart
   *
   * @returns Observable of updated cart without discount
   */
  removeCoupon(): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/coupon`);
  }
}

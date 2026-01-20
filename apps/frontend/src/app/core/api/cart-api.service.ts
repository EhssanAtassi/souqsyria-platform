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
 * - GET /api/cart - Get current user's cart
 * - POST /api/cart/add - Add item to cart
 * - DELETE /api/cart/item/:variantId - Remove item from cart
 * - DELETE /api/cart/clear - Clear entire cart
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
      variantId,
      quantity
    });
  }

  /**
   * Update item quantity in cart
   *
   * @param variantId - Product variant ID
   * @param quantity - New quantity
   * @returns Observable of updated cart
   */
  updateQuantity(variantId: string, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update`, {
      variantId,
      quantity
    });
  }

  /**
   * Remove item from cart
   *
   * @param variantId - Product variant ID to remove
   * @returns Observable of updated cart
   */
  removeFromCart(variantId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/item/${variantId}`);
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

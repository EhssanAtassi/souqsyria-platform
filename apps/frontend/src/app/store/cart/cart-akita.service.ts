import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { CartStore } from './cart.store';
import { CartQuery } from './cart.query';
import {
  CartItem,
  CartTotals,
  CartItemOptions,
  CartCoupon,
  CartValidationResult,
  CartValidationError,
  CartValidationWarning
} from '../../shared/interfaces/cart.interface';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductService } from '../../shared/services/product.service';

/**
 * Syrian Marketplace Cart Service (Akita Integration)
 *
 * Manages shopping cart operations using Akita state management
 * Replaces signal-based CartService with Akita store pattern
 *
 * This service provides the same API as the original CartService but uses
 * Akita EntityStore for state management instead of Angular Signals
 *
 * Features:
 * - Add/remove/update cart items
 * - Multi-currency support (USD, EUR, SYP)
 * - Coupon and discount application
 * - Real-time totals calculation
 * - Cart validation against product inventory
 * - LocalStorage persistence
 * - Multi-vendor cart grouping
 *
 * @swagger
 * components:
 *   schemas:
 *     CartAkitaService:
 *       type: object
 *       description: Akita-powered cart service for Syrian marketplace
 */
@Injectable({
  providedIn: 'root'
})
export class CartAkitaService {

  /**
   * Public observables for cart state
   */
  readonly cart$ = this.cartQuery.select();
  readonly items$ = this.cartQuery.cartItems$;
  readonly totals$ = this.cartQuery.totals$;
  readonly coupon$ = this.cartQuery.coupon$;
  readonly loading$ = this.cartQuery.loading$;
  readonly error$ = this.cartQuery.error$;
  readonly itemCount$ = this.cartQuery.itemCount$;
  readonly cartTotal$ = this.cartQuery.cartTotal$;
  readonly isEmpty$ = this.cartQuery.isEmpty$;
  readonly cartBySeller$ = this.cartQuery.cartBySeller$;
  readonly currency$ = this.cartQuery.currency$;

  /**
   * Initializes cart service with Akita store and query
   *
   * @param cartStore - Akita cart store instance
   * @param cartQuery - Akita cart query instance
   * @param productService - Product service for fetching product data
   */
  constructor(
    private cartStore: CartStore,
    private cartQuery: CartQuery,
    private productService: ProductService
  ) {
    // Load cart from localStorage on initialization
    this.loadCartFromStorage();
  }

  /**
   * Adds a product to the cart
   * Fetches product details and creates cart item with selected options
   *
   * @param productId - Product ID to add
   * @param quantity - Quantity to add (default: 1)
   * @param options - Additional cart item options
   * @returns Observable<boolean> indicating success
   */
  addToCart(productId: string, quantity: number = 1, options?: CartItemOptions): Observable<boolean> {
    this.cartStore.setLoading(true);
    this.cartStore.setError(null);

    return this.productService.getProduct(productId).pipe(
      switchMap(product => {
        if (!product) {
          this.cartStore.setError('Product not found');
          this.cartStore.setLoading(false);
          return of(false);
        }

        try {
          const cartItem = this.createCartItem(product, quantity, options);
          this.addItemToCart(cartItem);
          this.recalculateTotals();
          this.saveCartToStorage();

          this.cartStore.setLoading(false);
          return of(true);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to add item to cart';
          this.cartStore.setError(errorMsg);
          this.cartStore.setLoading(false);
          return of(false);
        }
      }),
      catchError(err => {
        this.cartStore.setError('Failed to load product');
        this.cartStore.setLoading(false);
        return of(false);
      })
    );
  }

  /**
   * Removes an item from the cart
   *
   * @param cartItemId - Cart item ID to remove
   */
  removeFromCart(cartItemId: string): void {
    this.cartStore.remove(cartItemId);
    this.recalculateTotals();
    this.saveCartToStorage();
  }

  /**
   * Updates the quantity of a cart item
   * Automatically removes item if quantity is set to 0
   *
   * @param cartItemId - Cart item ID
   * @param newQuantity - New quantity
   */
  updateQuantity(cartItemId: string, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeFromCart(cartItemId);
      return;
    }

    const item = this.cartQuery.getCartItem(cartItemId);
    if (!item) return;

    // Validate quantity against product limits
    const maxQty = Math.min(
      item.product.inventory.quantity,
      item.product.inventory.maxOrderQuantity || item.product.inventory.quantity
    );

    const validQuantity = Math.min(
      Math.max(newQuantity, item.product.inventory.minOrderQuantity),
      maxQty
    );

    this.cartStore.update(cartItemId, {
      quantity: validQuantity,
      price: {
        ...item.price,
        totalPrice: item.price.unitPrice * validQuantity
      }
    });

    this.recalculateTotals();
    this.saveCartToStorage();
  }

  /**
   * Updates shipping method for a cart item
   *
   * @param cartItemId - Cart item ID
   * @param shippingMethodId - New shipping method ID
   */
  updateShippingMethod(cartItemId: string, shippingMethodId: string): void {
    const item = this.cartQuery.getCartItem(cartItemId);
    if (!item) return;

    const shippingMethod = item.product.shipping.methods.find(m => m.id === shippingMethodId);
    const shippingCost = shippingMethod ? shippingMethod.cost.amount : 0;

    this.cartStore.update(cartItemId, {
      selectedShippingMethod: shippingMethodId,
      price: {
        ...item.price,
        shipping: shippingCost
      }
    });

    this.recalculateTotals();
    this.saveCartToStorage();
  }

  /**
   * Clears all items from the cart
   */
  clearCart(): void {
    this.cartStore.clearCart();
    this.saveCartToStorage();
  }

  /**
   * Applies a coupon to the cart
   * Validates coupon code and calculates discount
   *
   * @param couponCode - Coupon code to apply
   * @returns Observable<boolean> indicating success
   */
  applyCoupon(couponCode: string): Observable<boolean> {
    // Mock coupon validation - in real app, this would call an API
    return new Observable(observer => {
      setTimeout(() => {
        const mockCoupon: CartCoupon = {
          code: couponCode.toUpperCase(),
          name: 'Special Discount',
          type: 'percentage',
          value: 10,
          currency: 'USD',
          isValid: true
        };

        // Validate coupon (mock validation)
        if (couponCode.toUpperCase() === 'SYRIA10' || couponCode.toUpperCase() === 'WELCOME15') {
          mockCoupon.value = couponCode.toUpperCase() === 'WELCOME15' ? 15 : 10;
          this.cartStore.setCoupon(mockCoupon);
          this.recalculateTotals();
          this.saveCartToStorage();
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 500);
    });
  }

  /**
   * Removes applied coupon
   */
  removeCoupon(): void {
    this.cartStore.setCoupon(null);
    this.recalculateTotals();
    this.saveCartToStorage();
  }

  /**
   * Changes cart display currency
   *
   * @param currency - New currency (USD, EUR, or SYP)
   */
  changeCurrency(currency: 'USD' | 'EUR' | 'SYP'): void {
    this.cartStore.changeCurrency(currency);
    this.recalculateTotals();
    this.saveCartToStorage();
  }

  /**
   * Validates cart items against current product data
   *
   * @returns Observable<CartValidationResult> with validation errors and warnings
   */
  validateCart(): Observable<CartValidationResult> {
    const errors: CartValidationError[] = [];
    const warnings: CartValidationWarning[] = [];

    const items = this.cartQuery.getCartItems();

    items.forEach(item => {
      // Check stock availability
      if (!item.product.inventory.inStock) {
        errors.push({
          type: 'out_of_stock',
          cartItemId: item.id,
          message: `${item.product.name} is currently out of stock`
        });
      } else if (item.quantity > item.product.inventory.quantity) {
        errors.push({
          type: 'quantity_invalid',
          cartItemId: item.id,
          message: `Only ${item.product.inventory.quantity} units available for ${item.product.name}`,
          currentValue: item.quantity,
          expectedValue: item.product.inventory.quantity
        });
      } else if (item.product.inventory.quantity <= item.product.inventory.lowStockThreshold) {
        warnings.push({
          type: 'low_stock',
          cartItemId: item.id,
          message: `Only ${item.product.inventory.quantity} units left for ${item.product.name}`
        });
      }
    });

    return of({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  }

  /**
   * Gets cart data formatted for checkout
   *
   * @returns Observable with checkout-ready cart data
   */
  getCheckoutData(): Observable<any> {
    const snapshot = this.cartQuery.getCartSnapshot();
    const checkoutData = {
      cartId: 'cart_' + Date.now(),
      items: snapshot.items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.price.unitPrice,
        totalPrice: item.price.totalPrice,
        shipping: item.price.shipping,
        shippingMethod: item.selectedShippingMethod,
        seller: item.product.seller
      })),
      totals: snapshot.totals,
      coupon: snapshot.coupon,
      currency: snapshot.selectedCurrency
    };

    return of(checkoutData);
  }

  /**
   * Creates a cart item from product and options
   *
   * @param product - Product to add
   * @param quantity - Quantity
   * @param options - Additional options
   * @returns CartItem object
   */
  private createCartItem(product: Product, quantity: number, options?: CartItemOptions): CartItem {
    // Validate quantity
    if (quantity < product.inventory.minOrderQuantity) {
      throw new Error(`Minimum order quantity is ${product.inventory.minOrderQuantity}`);
    }

    const maxQty = Math.min(
      product.inventory.quantity,
      product.inventory.maxOrderQuantity || product.inventory.quantity
    );

    if (quantity > maxQty) {
      throw new Error(`Maximum order quantity is ${maxQty}`);
    }

    if (!product.inventory.inStock) {
      throw new Error('Product is currently out of stock');
    }

    // Get default shipping method
    const defaultShippingMethod = product.shipping.methods[0];
    const selectedShippingMethodId = options?.shippingMethodId || defaultShippingMethod?.id || '';
    const selectedShippingMethod = product.shipping.methods.find(m => m.id === selectedShippingMethodId);
    const shippingCost = selectedShippingMethod?.cost.amount || 0;

    // Calculate prices based on selected currency
    const currency = this.cartQuery.getValue().selectedCurrency;
    const unitPrice = this.convertPrice(product.price.amount, product.price.currency, currency);

    return {
      id: this.generateCartItemId(),
      product,
      quantity,
      selectedShippingMethod: selectedShippingMethodId,
      price: {
        unitPrice,
        totalPrice: unitPrice * quantity,
        discount: 0,
        shipping: shippingCost,
        currency
      },
      addedAt: new Date(),
      notes: options?.notes
    };
  }

  /**
   * Adds item to cart or updates existing item quantity
   *
   * @param newItem - Cart item to add
   */
  private addItemToCart(newItem: CartItem): void {
    const items = this.cartQuery.getCartItems();

    // Check if item already exists (same product, same variant, same shipping)
    const existingItem = items.find(item =>
      item.product.id === newItem.product.id &&
      item.selectedShippingMethod === newItem.selectedShippingMethod
    );

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + newItem.quantity;

      // Validate new quantity
      const maxQty = Math.min(
        existingItem.product.inventory.quantity,
        existingItem.product.inventory.maxOrderQuantity || existingItem.product.inventory.quantity
      );

      this.cartStore.update(existingItem.id, {
        quantity: Math.min(newQuantity, maxQty),
        price: {
          ...existingItem.price,
          totalPrice: existingItem.price.unitPrice * Math.min(newQuantity, maxQty)
        }
      });
    } else {
      // Add new item
      this.cartStore.add(newItem);
    }
  }

  /**
   * Recalculates cart totals
   * Updates subtotal, shipping, discounts, and grand total
   */
  private recalculateTotals(): void {
    const items = this.cartQuery.getCartItems();
    const state = this.cartQuery.getValue();

    let subtotal = 0;
    let shipping = 0;
    let itemCount = 0;

    items.forEach(item => {
      subtotal += item.price.totalPrice;
      shipping += item.price.shipping;
      itemCount += item.quantity;
    });

    // Apply coupon discount
    let discount = 0;
    const coupon = state.coupon;
    if (coupon && coupon.isValid) {
      if (coupon.type === 'percentage') {
        discount = (subtotal * coupon.value) / 100;
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else if (coupon.type === 'fixed') {
        discount = coupon.value;
      } else if (coupon.type === 'free_shipping') {
        discount = shipping;
      }
    }

    const total = subtotal + shipping - discount;

    const newTotals: CartTotals = {
      subtotal,
      shipping,
      discount,
      total: Math.max(0, total),
      currency: state.selectedCurrency,
      itemCount
    };

    this.cartStore.updateTotals(newTotals);
  }

  /**
   * Converts price between currencies (mock implementation)
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @returns Converted amount
   */
  private convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
    // Mock exchange rates - in real app, this would use live rates
    const rates: { [key: string]: number } = {
      USD: 1,
      EUR: 0.85,
      SYP: 1350
    };

    if (fromCurrency === toCurrency) return amount;

    const usdAmount = amount / (rates[fromCurrency] || 1);
    return usdAmount * (rates[toCurrency] || 1);
  }

  /**
   * Saves cart to localStorage
   */
  private saveCartToStorage(): void {
    try {
      const snapshot = this.cartQuery.getCartSnapshot();
      localStorage.setItem('syrian_marketplace_cart_akita', JSON.stringify({
        ...snapshot,
        createdAt: snapshot.createdAt.toISOString(),
        updatedAt: snapshot.updatedAt.toISOString(),
        items: snapshot.items.map(item => ({
          ...item,
          addedAt: item.addedAt.toISOString()
        }))
      }));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }

  /**
   * Loads cart from localStorage
   */
  private loadCartFromStorage(): void {
    try {
      const stored = localStorage.getItem('syrian_marketplace_cart_akita');
      if (stored) {
        const cartData = JSON.parse(stored);

        // Convert date strings back to Date objects
        cartData.createdAt = new Date(cartData.createdAt);
        cartData.updatedAt = new Date(cartData.updatedAt);
        cartData.items = cartData.items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));

        // Restore cart state
        this.cartStore.set(cartData.items);
        this.cartStore.update({
          totals: cartData.totals,
          coupon: cartData.coupon,
          selectedCurrency: cartData.selectedCurrency,
          createdAt: cartData.createdAt,
          updatedAt: cartData.updatedAt
        });
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }

  /**
   * Generates unique cart item ID
   *
   * @returns Unique cart item ID
   */
  private generateCartItemId(): string {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

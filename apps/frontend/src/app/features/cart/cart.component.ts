import { Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { CartService } from '../../store/cart/cart.service';
import { CartApiService } from '../../core/api/cart-api.service';
import { CartQuery } from '../../store/cart/cart.query';
import { ProductsQuery } from '../../store/products/products.query';
import { CartItem, Cart } from '../../shared/interfaces/cart.interface';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductRecommendationsComponent } from '../../shared/components/product-recommendations';
import { ProductRecommendationsCarouselComponent } from '../../shared/components/product-recommendations-carousel';
import { ProductBoxGridComponent } from '../../shared/components/ui/product-box/product-box-grid.component';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectUser } from '../auth/store/auth.selectors';
import { LanguageService } from '../../shared/services/language.service';

/**
 * Syrian marketplace shopping cart component
 * Features comprehensive cart management, multi-vendor support, and international pricing
 * 
 * @swagger
 * components:
 *   schemas:
 *     CartComponent:
 *       type: object
 *       properties:
 *         cart:
 *           $ref: '#/components/schemas/Cart'
 *         couponCode:
 *           type: string
 *           description: Entered coupon code
 *         isApplyingCoupon:
 *           type: boolean
 *           description: Coupon application loading state
 *         selectedCurrency:
 *           type: string
 *           enum: [USD, EUR, SYP]
 *           description: Selected display currency
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatExpansionModule,
    MatDialogModule,
    ProductRecommendationsComponent,
    ProductRecommendationsCarouselComponent,
    ProductBoxGridComponent
  ],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartComponent implements OnInit, OnDestroy {
  
  /** Coupon code input */
  couponCode = signal<string>('');
  
  /** Coupon application loading state */
  isApplyingCoupon = signal<boolean>(false);
  
  /** Coupon application error */
  couponError = signal<string | null>(null);
  
  /** Available currencies */
  availableCurrencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'SYP', symbol: '£S', name: 'Syrian Pound' }
  ];
  
  /** Akita Cart Query - reactive cart state */
  cart$!: Observable<Cart>;
  items$!: Observable<CartItem[]>;
  itemCount$!: Observable<number>;
  total$!: Observable<number>;
  subtotal$!: Observable<number>;

  /** Quantity options for dropdown */
  quantityOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  /** Recommended products based on cart content - CRITICAL REVENUE FEATURE */
  recommendedProducts = signal<Product[]>([]);

  /** "Customers Also Bought" products - CROSS-SELL BOOST */
  customersAlsoBought = signal<Product[]>([]);

  /** Frequently bought together products */
  frequentlyBoughtTogether = signal<Product[]>([]);

  /** Debounce subject for recommendation recalculation - PERFORMANCE OPTIMIZATION */
  private recommendationDebounce$ = new Subject<void>();

  /** Destroy subject for cleanup */
  private destroy$ = new Subject<void>();

  /** Memoization cache for recommendations - PERFORMANCE OPTIMIZATION */
  private recommendationCache = new Map<string, {
    recommended: Product[];
    alsoBought: Product[];
    frequentlyTogether: Product[];
    timestamp: number;
  }>();

  /** Cache expiration time (5 minutes) */
  private readonly CACHE_EXPIRATION_MS = 5 * 60 * 1000;

  /** Debounce delay for recommendation recalculation (500ms) */
  private readonly RECOMMENDATION_DEBOUNCE_MS = 500;

  /** Current UI language signal — used in template as language() */
  readonly language: WritableSignal<'en' | 'ar'>;

  constructor(
    private cartService: CartService,
    private cartApiService: CartApiService,
    private cartQuery: CartQuery,
    private productsQuery: ProductsQuery,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private languageService: LanguageService,
    private store: Store,
  ) {
    this.language = this.languageService.language;
  }

  /**
   * Component initialization
   * Fetches cart from backend (guest or authenticated) and initializes observables
   * Sets up debounced recommendation loading for performance optimization
   */
  ngOnInit(): void {
    console.log('CartComponent initializing - fetching cart from backend...');

    // Initialize cart observables
    this.cart$ = this.cartQuery.select();
    this.items$ = this.cartQuery.select(state => state.items);
    this.itemCount$ = this.cartQuery.select(state => state.totals.itemCount);
    this.total$ = this.cartQuery.select(state => state.totals.total);
    this.subtotal$ = this.cartQuery.select(state => state.totals.subtotal);

    // Fetch cart from backend
    // TODO: Replace with actual authentication check when auth service is available
    const userId = this.getUserId(); // Get from auth service in production
    this.cartService.fetchCartFromBackend(userId);

    // Set up debounced recommendation loading - PERFORMANCE OPTIMIZATION
    // Batches multiple rapid cart changes into single recommendation recalculation
    this.recommendationDebounce$
      .pipe(
        debounceTime(this.RECOMMENDATION_DEBOUNCE_MS),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadCartRecommendationsInternal();
      });

    // Load initial product recommendations
    this.loadCartRecommendations();
  }

  /**
   * Component cleanup
   * Unsubscribes from observables and clears cache
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.recommendationCache.clear();
  }

  /**
   * Updates quantity for a cart item
   *
   * @param itemId - Cart item ID (not product ID)
   * @param newQuantity - New quantity
   */
  updateQuantity(itemId: string, newQuantity: number): void {
    this.cartService.updateQuantity(itemId, newQuantity);
    this.showSnackBar('Quantity updated', 'success');
  }

  /**
   * Removes item from cart with undo snackbar (5-second window)
   *
   * @param item - Cart item to remove (needs both item.id for store removal and item.product.id for undo API)
   */
  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.id);

    // Show snackbar with Undo action (5-second duration matching backend window)
    const ref = this.snackBar.open('Item removed from cart', 'Undo', {
      duration: 5000,
      panelClass: 'success-snackbar',
    });

    ref.onAction().subscribe(() => {
      // Call backend undo endpoint (uses product ID, not cart item ID)
      this.cartApiService.undoRemove(item.product.id).subscribe({
        next: () => {
          // Re-fetch cart to restore the item in local state
          const userId = this.getUserId();
          this.cartService.fetchCartFromBackend(userId);
          this.showSnackBar('Item restored', 'success');
        },
        error: () => {
          this.showSnackBar('Undo window expired', 'warning');
        },
      });
    });

    // Refresh recommendations after removing item
    this.loadCartRecommendations();
  }

  /**
   * Applies coupon code
   * CartService.applyCoupon returns boolean (true = valid, false = invalid)
   */
  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.showSnackBar('Please enter a coupon code', 'error');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set(null);

    const success = this.cartService.applyCoupon(code);

    if (success) {
      this.showSnackBar('Coupon applied successfully!', 'success');
      this.couponCode.set('');
    } else {
      this.couponError.set('Invalid or expired coupon code');
      this.showSnackBar('Invalid coupon code', 'error');
    }

    this.isApplyingCoupon.set(false);
  }

  /**
   * Removes applied coupon
   */
  removeCoupon(): void {
    this.cartService.removeCoupon();
    this.showSnackBar('Coupon removed', 'success');
  }

  /**
   * Clears entire cart
   */
  clearCart(): void {
    this.cartService.clearCart();
    this.showSnackBar('Cart cleared', 'success');
  }

  /**
   * Proceeds to checkout
   */
  proceedToCheckout(): void {
    // Navigate to checkout
    this.router.navigate(['/checkout']);
  }

  /**
   * Continues shopping
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Gets available quantities for a product
   *
   * @param productId - Product ID
   * @returns Array of available quantities
   */
  getAvailableQuantities(productId: string): number[] {
    const product = this.productsQuery.getEntity(productId);
    if (!product) return [1];

    const max = Math.min(
      product.inventory.quantity,
      product.inventory.maxOrderQuantity || product.inventory.quantity,
      20 // UI limit
    );

    const min = product.inventory.minOrderQuantity || 1;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  /**
   * Formats price for display
   * 
   * @param amount - Price amount
   * @param currency - Currency code
   * @returns Formatted price string
   */
  formatPrice(amount: number, currency: string): string {
    const currencyInfo = this.availableCurrencies.find(c => c.code === currency);
    if (currency === 'SYP') {
      return `${currencyInfo?.symbol || ''}${new Intl.NumberFormat('ar-SY').format(amount)}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Gets stock status for product
   *
   * @param productId - Product ID
   * @returns Stock status object
   */
  getStockStatus(productId: string): { status: string; color: string; message: string } {
    const product = this.productsQuery.getEntity(productId);

    if (!product || !product.inventory.inStock) {
      return { status: 'out_of_stock', color: 'text-red-600', message: 'Out of stock' };
    }

    if (product.inventory.quantity <= product.inventory.lowStockThreshold) {
      return {
        status: 'low_stock',
        color: 'text-yellow-600',
        message: `Only ${product.inventory.quantity} left`
      };
    }

    return { status: 'in_stock', color: 'text-green-600', message: 'In stock' };
  }

  /**
   * Gets product by ID from store
   *
   * @param productId - Product ID
   * @returns Product or undefined
   */
  getProduct(productId: string): Product | undefined {
    return this.productsQuery.getEntity(productId);
  }

  /**
   * Triggers debounced recommendation loading - PERFORMANCE OPTIMIZED
   * This method is called after cart operations and batches rapid changes
   * to avoid redundant recalculations
   */
  private loadCartRecommendations(): void {
    this.recommendationDebounce$.next();
  }

  /**
   * Generates cache key from cart items for memoization
   * Cache key is based on sorted product IDs to ensure consistency
   *
   * @param items - Cart items
   * @returns Cache key string
   */
  private generateCacheKey(items: CartItem[]): string {
    if (items.length === 0) return 'empty_cart';
    const productIds = items.map(item => item.product.id).sort();
    return productIds.join('|');
  }

  /**
   * Checks if cached recommendations are still valid
   *
   * @param cacheKey - Cache key to check
   * @returns True if cache is valid, false otherwise
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.recommendationCache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    const isExpired = (now - cached.timestamp) > this.CACHE_EXPIRATION_MS;
    return !isExpired;
  }

  /**
   * Loads product recommendations based on cart content - CRITICAL REVENUE FEATURE
   * This directly impacts cross-selling and upselling revenue
   *
   * PERFORMANCE OPTIMIZATION: Implements memoization to avoid redundant calculations
   * - Caches recommendations based on cart product composition
   * - Cache expires after 5 minutes to ensure freshness
   * - Only recalculates when cart items actually change
   */
  private loadCartRecommendationsInternal(): void {
    const items = this.cartQuery.getValue().items;
    const cacheKey = this.generateCacheKey(items);

    // Check cache first - PERFORMANCE OPTIMIZATION
    if (this.isCacheValid(cacheKey)) {
      const cached = this.recommendationCache.get(cacheKey)!;
      this.recommendedProducts.set(cached.recommended);
      this.customersAlsoBought.set(cached.alsoBought);
      this.frequentlyBoughtTogether.set(cached.frequentlyTogether);
      console.log('✅ Loaded recommendations from cache');
      return;
    }

    // Calculate recommendations (cache miss or expired)
    const allProducts = this.productsQuery.getAll();

    if (items.length === 0) {
      // Load trending products for empty cart (products with high ratings)
      const trendingProducts = allProducts
        .sort((a, b) => b.reviews.averageRating - a.reviews.averageRating)
        .slice(0, 6);

      const emptyCartCache = {
        recommended: trendingProducts,
        alsoBought: [],
        frequentlyTogether: [],
        timestamp: Date.now()
      };

      this.recommendationCache.set(cacheKey, emptyCartCache);
      this.recommendedProducts.set(trendingProducts);
      this.customersAlsoBought.set([]);
      this.frequentlyBoughtTogether.set([]);
      return;
    }

    // Get product IDs from cart
    const cartProductIds = items.map(item => item.product.id);

    // Get category-based recommendations from cart items
    const categoryRecommendations = this.getCategoryBasedRecommendations(items, allProducts, 4);

    // Get "Customers Also Bought" - products from same categories
    const alsoBought = this.getAlsoBoughtProducts(items, allProducts, cartProductIds, 6);

    // Get frequently bought together products
    const frequentlyTogether = this.getFrequentlyBoughtTogether(items, allProducts, cartProductIds, 4);

    // Update cache - PERFORMANCE OPTIMIZATION
    this.recommendationCache.set(cacheKey, {
      recommended: categoryRecommendations,
      alsoBought: alsoBought,
      frequentlyTogether: frequentlyTogether,
      timestamp: Date.now()
    });

    // Update signals
    this.recommendedProducts.set(categoryRecommendations);
    this.customersAlsoBought.set(alsoBought);
    this.frequentlyBoughtTogether.set(frequentlyTogether);

    console.log('🔄 Calculated and cached new recommendations');
  }

  /**
   * Gets category-based recommendations from cart items
   *
   * @param cartItems - Current cart items
   * @param allProducts - All available products
   * @param count - Number of recommendations to return
   * @returns Array of recommended products
   */
  private getCategoryBasedRecommendations(cartItems: CartItem[], allProducts: Product[], count: number): Product[] {
    const recommendations: Product[] = [];
    const cartProductIds = cartItems.map(item => item.product.id);

    // Get recommendations based on cart categories
    for (const item of cartItems) {
      const product = item.product;
      if (!product) continue;

      const categoryProducts = allProducts.filter(p =>
        p.category.slug === product.category.slug &&
        !cartProductIds.includes(p.id)
      );
      recommendations.push(...categoryProducts.slice(0, Math.ceil(count / cartItems.length)));
    }

    // Remove duplicates and limit count
    const uniqueRecommendations = recommendations.filter((product, index, self) =>
      index === self.findIndex(p => p.id === product.id)
    );

    return uniqueRecommendations.slice(0, count);
  }

  /**
   * Gets "also bought" products
   *
   * @param cartItems - Current cart items
   * @param allProducts - All available products
   * @param cartProductIds - Product IDs in cart
   * @param count - Number of products to return
   * @returns Array of also bought products
   */
  private getAlsoBoughtProducts(cartItems: CartItem[], allProducts: Product[], cartProductIds: string[], count: number): Product[] {
    const alsoBought = allProducts.filter(p => !cartProductIds.includes(p.id));
    return alsoBought.slice(0, count);
  }

  /**
   * Gets frequently bought together products
   *
   * @param cartItems - Current cart items
   * @param allProducts - All available products
   * @param cartProductIds - Product IDs in cart
   * @param count - Number of products to return
   * @returns Array of frequently bought together products
   */
  private getFrequentlyBoughtTogether(cartItems: CartItem[], allProducts: Product[], cartProductIds: string[], count: number): Product[] {
    // Get complementary products based on Syrian marketplace patterns
    const complementary = allProducts.filter(p => !cartProductIds.includes(p.id));

    return complementary.slice(0, count);
  }

  /**
   * Adds recommended product to cart
   *
   * @param product - Product object to add
   */
  addRecommendedProductToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);
    this.showSnackBar(`Added ${product.name} to cart`, 'success');
    // Refresh recommendations after adding to cart
    this.loadCartRecommendations();
  }

  /**
   * Navigates to product detail page
   *
   * @param product - Product object for navigation
   */
  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Handles product click from carousel recommendations
   * Navigates to product detail page
   *
   * @param product - Product that was clicked
   */
  onRecommendedProductClick(product: Product): void {
    this.router.navigate(['/product', product.slug]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * Handles add to cart from carousel recommendations
   * Adds product to cart and refreshes recommendations
   *
   * @param product - Product to add to cart
   */
  onRecommendedProductAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);
    this.showSnackBar(`Added ${product.name} to cart`, 'success');
    // Refresh recommendations after adding to cart
    this.loadCartRecommendations();
  }

  /**
   * Gets the first product ID from cart for recommendation purposes
   * Used as seed for recommendation algorithms
   *
   * @returns First cart item product ID or empty string
   */
  getFirstCartProductId(): string {
    const items = this.cartQuery.getValue().items;
    return items && items.length > 0 ? items[0].product.id : '';
  }

  /**
   * Shows snack bar notification
   *
   * @param message - Message to display
   * @param type - Notification type
   */
  private showSnackBar(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    let panelClass = '';
    switch (type) {
      case 'success': panelClass = 'success-snackbar'; break;
      case 'error': panelClass = 'error-snackbar'; break;
      case 'info': panelClass = 'info-snackbar'; break;
      case 'warning': panelClass = 'warning-snackbar'; break;
    }

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass
    });
  }

  /**
   * Get User ID for Authenticated Users
   *
   * Retrieves current user ID from NgRx auth state.
   * Returns undefined for guest users.
   *
   * @returns User ID or undefined
   */
  private getUserId(): string | undefined {
    let userId: string | undefined;
    // Synchronous snapshot from NgRx store
    this.store.select(selectUser).subscribe(user => {
      userId = user ? String(user.id) : undefined;
    }).unsubscribe();
    return userId;
  }
}
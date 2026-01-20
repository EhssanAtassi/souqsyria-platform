import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { Observable } from 'rxjs';

import { CartService } from '../../store/cart/cart.service';
import { CartQuery } from '../../store/cart/cart.query';
import { ProductsQuery } from '../../store/products/products.query';
import { CartItem, Cart } from '../../shared/interfaces/cart.interface';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductRecommendationsComponent } from '../../shared/components/product-recommendations';
import { ProductRecommendationsCarouselComponent } from '../../shared/components/product-recommendations-carousel';
import { ProductBoxGridComponent } from '../../shared/components/ui/product-box/product-box-grid.component';
import { Router } from '@angular/router';

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
export class CartComponent implements OnInit {
  
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

  constructor(
    private cartService: CartService,
    private cartQuery: CartQuery,
    private productsQuery: ProductsQuery,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router
  ) {}

  /**
   * Component initialization
   * Fetches cart from backend (guest or authenticated) and initializes observables
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

    // Load product recommendations
    this.loadCartRecommendations();
  }

  /**
   * Updates quantity for a cart item
   *
   * @param productId - Product ID
   * @param newQuantity - New quantity
   */
  updateQuantity(productId: string, newQuantity: number): void {
    this.cartService.updateQuantity(productId, newQuantity);
    this.showSnackBar('Quantity updated', 'success');
  }

  /**
   * Removes item from cart
   *
   * @param productId - Product ID
   */
  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
    this.showSnackBar('Item removed from cart', 'success');

    // Refresh recommendations after removing item
    this.loadCartRecommendations();
  }

  /**
   * Applies coupon code
   */
  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) {
      this.showSnackBar('Please enter a coupon code', 'error');
      return;
    }

    this.isApplyingCoupon.set(true);
    this.couponError.set(null);

    try {
      this.cartService.applyCoupon(code);
      this.showSnackBar('Coupon applied successfully!', 'success');
      this.couponCode.set('');
      this.isApplyingCoupon.set(false);
    } catch (error) {
      this.couponError.set('Invalid or expired coupon code');
      this.showSnackBar('Invalid coupon code', 'error');
      this.isApplyingCoupon.set(false);
    }
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
   * Loads product recommendations based on cart content - CRITICAL REVENUE FEATURE
   * This directly impacts cross-selling and upselling revenue
   */
  private loadCartRecommendations(): void {
    const items = this.cartQuery.getValue().items;
    const allProducts = this.productsQuery.getAll();

    if (items.length === 0) {
      // Load trending products for empty cart (products with high ratings)
      const trendingProducts = allProducts
        .sort((a, b) => b.reviews.averageRating - a.reviews.averageRating)
        .slice(0, 6);
      this.recommendedProducts.set(trendingProducts);
      this.customersAlsoBought.set([]);
      this.frequentlyBoughtTogether.set([]);
      return;
    }

    // Get product IDs from cart
    const cartProductIds = items.map(item => item.product.id);

    // Get category-based recommendations from cart items
    const categoryRecommendations = this.getCategoryBasedRecommendations(items, allProducts, 4);
    this.recommendedProducts.set(categoryRecommendations);

    // Get "Customers Also Bought" - products from same categories
    const alsoBought = this.getAlsoBoughtProducts(items, allProducts, cartProductIds, 6);
    this.customersAlsoBought.set(alsoBought);

    // Get frequently bought together products
    const frequentlyTogether = this.getFrequentlyBoughtTogether(items, allProducts, cartProductIds, 4);
    this.frequentlyBoughtTogether.set(frequentlyTogether);
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
   * Retrieves current user ID from authentication service.
   * Returns undefined for guest users.
   *
   * @returns User ID or undefined
   */
  private getUserId(): string | undefined {
    // TODO: Replace with actual authentication service when available
    // Example: return this.authService.currentUser?.id;

    // For now, check localStorage for demo/testing purposes
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Found authenticated user:', user.id);
        return user.id;
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }

    console.log('No authenticated user found - using guest cart');
    return undefined;
  }
}
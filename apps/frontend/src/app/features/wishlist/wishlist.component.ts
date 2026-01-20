import { Component, OnInit, signal, computed, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';

import { WishlistAkitaService } from '../../store/wishlist/wishlist-akita.service';
import { CartService } from '../../store/cart/cart.service';
import { ShareService } from '../../shared/services/share.service';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

/**
 * Wishlist Component - Syrian Marketplace
 *
 * @description
 * Full wishlist management page for SouqSyria marketplace.
 * Provides comprehensive wishlist operations with authentic Syrian design.
 *
 * Features:
 * - Display all wishlisted products
 * - Remove items from wishlist
 * - Move items to cart
 * - Share wishlist
 * - Empty state with Damascus rose pattern
 * - Golden Wheat theme styling
 * - Bilingual support (English/Arabic with RTL)
 * - Mobile responsive design
 * - Wishlist statistics and insights
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistComponent:
 *       type: object
 *       description: Wishlist management page component
 *       properties:
 *         wishlistItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 *         wishlistCount:
 *           type: number
 *         totalValue:
 *           type: number
 *         language:
 *           type: string
 *           enum: [en, ar]
 *
 * @example
 * // Route: /wishlist
 * // Component auto-loads user's wishlist items
 */
@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    ProductCardComponent
  ],
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistComponent implements OnInit {
  /**
   * Injected services
   */
  private readonly destroyRef = inject(DestroyRef);
  private readonly wishlistService = inject(WishlistAkitaService);
  private readonly cartService = inject(CartService);
  private readonly shareService = inject(ShareService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  /**
   * Reactive state signals
   */
  language = signal<'en' | 'ar'>('en');
  isLoading = signal(false);
  viewMode = signal<'grid' | 'list'>('grid');

  /**
   * Wishlist data from Akita store
   */
  wishlistItems$ = this.wishlistService.items$;
  wishlistCount$ = this.wishlistService.count$;
  totalValue$ = this.wishlistService.totalValue$;

  /**
   * Computed properties
   */
  wishlistItems = signal<Product[]>([]);
  wishlistCount = computed(() => this.wishlistItems().length);
  totalValue = computed(() => {
    return this.wishlistItems().reduce((total, item) => total + item.price.amount, 0);
  });
  isEmpty = computed(() => this.wishlistItems().length === 0);

  /**
   * Wishlist statistics
   */
  statistics = computed(() => {
    const items = this.wishlistItems();
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
  });

  /**
   * Component initialization
   */
  ngOnInit(): void {
    // Load language preference
    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar';
    if (savedLanguage) {
      this.language.set(savedLanguage);
    }

    // Subscribe to wishlist items
    this.wishlistItems$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.wishlistItems.set(items);
      });
  }

  /**
   * Remove product from wishlist
   *
   * @param product - Product to remove
   * @param event - Click event to prevent propagation
   */
  removeFromWishlist(product: Product, event: Event): void {
    event.stopPropagation();

    const removed = this.wishlistService.removeFromWishlist(product.id);

    if (removed) {
      const message = this.language() === 'ar'
        ? `تم إزالة ${product.nameArabic || product.name} من قائمة الأمنيات`
        : `${product.name} removed from wishlist`;
      this.showNotification(message, 'success');
    }
  }

  /**
   * Move product from wishlist to cart
   *
   * @param product - Product to move
   * @param event - Click event to prevent propagation
   */
  moveToCart(product: Product, event: Event): void {
    event.stopPropagation();

    // Add to cart
    this.cartService.addToCart(product.id, 1);

    // Remove from wishlist
    this.wishlistService.removeFromWishlist(product.id);

    const message = this.language() === 'ar'
      ? `تم نقل ${product.nameArabic || product.name} إلى السلة`
      : `${product.name} moved to cart`;
    this.showNotification(message, 'success');
  }

  /**
   * Add all wishlist items to cart
   */
  moveAllToCart(): void {
    const items = this.wishlistItems();

    if (items.length === 0) return;

    items.forEach(product => {
      this.cartService.addToCart(product.id, 1);
    });

    this.wishlistService.clearWishlist();

    const message = this.language() === 'ar'
      ? `تم نقل جميع العناصر إلى السلة (${items.length} منتج)`
      : `All items moved to cart (${items.length} products)`;
    this.showNotification(message, 'success');

    // Navigate to cart
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 1500);
  }

  /**
   * Clear entire wishlist
   */
  clearWishlist(): void {
    const count = this.wishlistItems().length;

    if (count === 0) return;

    this.wishlistService.clearWishlist();

    const message = this.language() === 'ar'
      ? `تم مسح قائمة الأمنيات (${count} منتج)`
      : `Wishlist cleared (${count} products)`;
    this.showNotification(message, 'info');
  }

  /**
   * Share product from wishlist
   *
   * @param product - Product to share
   * @param event - Click event to prevent propagation
   */
  async shareProduct(product: Product, event: Event): Promise<void> {
    event.stopPropagation();

    const productUrl = `${window.location.origin}/product/${product.slug}`;
    const productName = this.language() === 'ar' && product.nameArabic
      ? product.nameArabic
      : product.name;

    const shareResult = await this.shareService.shareProduct(
      productName,
      productUrl,
      product.images[0]?.url
    );

    if (shareResult.success) {
      const message = shareResult.method === 'clipboard'
        ? (this.language() === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard!')
        : (this.language() === 'ar' ? 'تمت المشاركة بنجاح' : 'Shared successfully!');
      this.showNotification(message, 'success');
    }
  }

  /**
   * Navigate to product detail
   *
   * @param product - Product to view
   */
  viewProduct(product: Product): void {
    this.router.navigate(['/product', product.slug]);
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/']);
  }

  /**
   * Toggle view mode between grid and list
   */
  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  /**
   * Get product name based on language
   *
   * @param product - Product object
   * @returns Product name in appropriate language
   */
  getProductName(product: Product): string {
    return this.language() === 'ar' && product.nameArabic
      ? product.nameArabic
      : product.name;
  }

  /**
   * Get category name based on language
   *
   * @param product - Product object
   * @returns Category name in appropriate language
   */
  getCategoryName(product: Product): string {
    return this.language() === 'ar' && product.category.nameArabic
      ? product.category.nameArabic
      : product.category.name;
  }

  /**
   * Format price with currency
   *
   * @param amount - Price amount
   * @param currency - Currency code
   * @returns Formatted price string
   */
  formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Get star rating array for display
   *
   * @param rating - Average rating value
   * @returns Array of 5 boolean values for star display
   */
  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < Math.round(rating));
  }

  /**
   * Handle product card click event
   *
   * @param product - Clicked product
   */
  onProductClick(product: Product): void {
    this.viewProduct(product);
  }

  /**
   * Handle product card add to cart event
   *
   * @param product - Product to add to cart
   */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);

    const message = this.language() === 'ar'
      ? `تمت إضافة ${product.nameArabic || product.name} إلى السلة`
      : `${product.name} added to cart`;
    this.showNotification(message, 'success');
  }

  /**
   * Handle product card wishlist toggle event
   *
   * @param product - Product to toggle in wishlist
   */
  onToggleWishlist(product: Product): void {
    this.removeFromWishlist(product, new Event('click'));
  }

  /**
   * TrackBy function for products optimization
   *
   * @param index - Array index
   * @param product - Product object
   * @returns Unique identifier for tracking
   */
  trackProduct(index: number, product: Product): string {
    return product.id;
  }

  /**
   * Show notification to user
   *
   * @param message - Message to display
   * @param type - Notification type
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    let panelClass = '';
    switch (type) {
      case 'success': panelClass = 'success-snackbar'; break;
      case 'error': panelClass = 'error-snackbar'; break;
      case 'info': panelClass = 'info-snackbar'; break;
      case 'warning': panelClass = 'warning-snackbar'; break;
    }

    this.snackBar.open(message, this.language() === 'ar' ? 'إغلاق' : 'Close', {
      duration: 3000,
      panelClass: panelClass,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}

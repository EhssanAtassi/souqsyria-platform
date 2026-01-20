import { Component, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../../shared';
import {
  WishlistConfig,
  WishlistItem,
  WishlistFilters,
  PriceRange,
  User
} from '../../shared/interfaces/user.interface';

/**
 * Enhanced Wishlist Management Component for Syrian Marketplace
 *
 * Comprehensive wishlist management with Syrian cultural styling,
 * bilingual support, price tracking, and advanced organization features.
 * Designed for both local Syrian users and diaspora community.
 *
 * @swagger
 * components:
 *   schemas:
 *     WishlistComponent:
 *       type: object
 *       description: Wishlist management component for Syrian marketplace
 *       properties:
 *         wishlistConfig:
 *           $ref: '#/components/schemas/WishlistConfig'
 *         currentLanguage:
 *           type: string
 *           enum: [en, ar]
 *           description: Current display language
 *         filters:
 *           $ref: '#/components/schemas/WishlistFilters'
 *         viewMode:
 *           type: string
 *           enum: [grid, list]
 *           description: Display mode for wishlist items
 *         selectedItems:
 *           type: array
 *           items:
 *             type: string
 *           description: Selected wishlist item IDs for bulk operations
 */
@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatListModule,
    MatSliderModule
  ],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistComponent implements OnInit {
  // Component state using signals
  private readonly wishlistConfigSignal = signal<WishlistConfig | null>(null);
  private readonly isLoadingSignal = signal<boolean>(true);
  private readonly currentLanguageSignal = signal<'en' | 'ar'>('ar');
  private readonly filtersSignal = signal<WishlistFilters>({
    availability: 'all',
    sortBy: 'recent'
  });
  private readonly viewModeSignal = signal<'grid' | 'list'>('grid');
  private readonly selectedItemsSignal = signal<Set<string>>(new Set());
  private readonly showBulkActionsSignal = signal<boolean>(false);
  private readonly priceRangeSignal = signal<PriceRange>({ min: 0, max: 1000000 });

  // Public readonly signals for template
  readonly wishlistConfig = this.wishlistConfigSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly currentLanguage = this.currentLanguageSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly viewMode = this.viewModeSignal.asReadonly();
  readonly selectedItems = this.selectedItemsSignal.asReadonly();
  readonly showBulkActions = this.showBulkActionsSignal.asReadonly();
  readonly priceRange = this.priceRangeSignal.asReadonly();

  // Computed properties
  readonly filteredWishlistItems = computed(() => {
    const config = this.wishlistConfig();
    const filters = this.filters();
    
    if (!config || !config.wishlistItems) return [];

    let items = [...config.wishlistItems];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      items = items.filter(item => item.category === filters.category);
    }

    // Filter by availability
    if (filters.availability !== 'all') {
      if (filters.availability === 'available') {
        items = items.filter(item => item.isAvailable && item.stockQuantity > 0);
      } else if (filters.availability === 'out_of_stock') {
        items = items.filter(item => !item.isAvailable || item.stockQuantity === 0);
      }
    }

    // Filter by price range
    if (filters.priceRange) {
      items = items.filter(item => 
        item.price >= filters.priceRange!.min && item.price <= filters.priceRange!.max
      );
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      items = items.filter(item => 
        item.nameEn.toLowerCase().includes(query) ||
        item.nameAr.includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.craftOrigin.toLowerCase().includes(query)
      );
    }

    // Sort items
    switch (filters.sortBy) {
      case 'recent':
        items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
      case 'name_ar':
        items.sort((a, b) => a.nameAr.localeCompare(b.nameAr, 'ar'));
        break;
      case 'name_en':
        items.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
        break;
      case 'price_low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'price_drop':
        items.sort((a, b) => {
          const aHasDrop = a.originalPrice && a.originalPrice > a.price;
          const bHasDrop = b.originalPrice && b.originalPrice > b.price;
          if (aHasDrop && !bHasDrop) return -1;
          if (!aHasDrop && bHasDrop) return 1;
          if (aHasDrop && bHasDrop) {
            const aDiscount = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
            const bDiscount = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
            return bDiscount - aDiscount;
          }
          return 0;
        });
        break;
    }

    return items;
  });

  readonly totalWishlistValue = computed(() => {
    const config = this.wishlistConfig();
    if (!config) return { syp: 0, usd: 0 };

    return config.wishlistItems.reduce(
      (total, item) => ({
        syp: total.syp + item.price,
        usd: total.usd + item.priceUSD
      }),
      { syp: 0, usd: 0 }
    );
  });

  readonly selectedItemsCount = computed(() => this.selectedItems().size);

  readonly availableCategories = computed(() => {
    const config = this.wishlistConfig();
    if (!config) return [];
    return config.categories || [];
  });

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar,
    private bottomSheet: MatBottomSheet
  ) {}

  /**
   * Component initialization
   * Loads wishlist data and sets up reactive state
   */
  ngOnInit(): void {
    this.loadWishlistData();
    this.initializeLanguage();
    this.setupPriceRange();
  }

  /**
   * Load wishlist configuration from user service
   * Handles loading state and error scenarios
   */
  private loadWishlistData(): void {
    this.isLoadingSignal.set(true);

    this.userService.getWishlistConfig().subscribe({
      next: (config) => {
        this.wishlistConfigSignal.set(config);
        this.isLoadingSignal.set(false);
        this.updatePriceRange(config.wishlistItems);
      },
      error: (error) => {
        console.error('Failed to load wishlist data:', error);
        this.isLoadingSignal.set(false);
        this.showErrorMessage('Failed to load wishlist');
      }
    });
  }

  /**
   * Initialize language based on user preference
   */
  private initializeLanguage(): void {
    const userLang = this.userService.preferredLanguage();
    this.currentLanguageSignal.set(userLang);
  }

  /**
   * Setup price range based on wishlist items
   */
  private setupPriceRange(): void {
    // Initial price range will be updated when data loads
  }

  /**
   * Update price range based on available items
   */
  private updatePriceRange(items: WishlistItem[]): void {
    if (!items.length) return;

    const prices = items.map(item => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    this.priceRangeSignal.set({
      min: minPrice,
      max: maxPrice
    });
  }

  /**
   * Toggle between Arabic and English languages
   */
  toggleLanguage(): void {
    const currentLang = this.currentLanguageSignal();
    const newLang = currentLang === 'ar' ? 'en' : 'ar';

    this.currentLanguageSignal.set(newLang);
    this.userService.updatePreferredLanguage(newLang).subscribe();
  }

  /**
   * Update category filter
   */
  updateCategoryFilter(category: string): void {
    this.filtersSignal.update(filters => ({
      ...filters,
      category: category === 'all' ? undefined : category
    }));
  }

  /**
   * Update availability filter
   */
  updateAvailabilityFilter(availability: 'all' | 'available' | 'out_of_stock'): void {
    this.filtersSignal.update(filters => ({
      ...filters,
      availability
    }));
  }

  /**
   * Update sort criteria
   */
  updateSortBy(sortBy: WishlistFilters['sortBy']): void {
    this.filtersSignal.update(filters => ({
      ...filters,
      sortBy
    }));
  }

  /**
   * Update search query
   */
  updateSearchQuery(query: string): void {
    this.filtersSignal.update(filters => ({
      ...filters,
      searchQuery: query.trim() || undefined
    }));
  }

  /**
   * Update price range filter
   */
  updatePriceRangeFilter(range: PriceRange): void {
    this.filtersSignal.update(filters => ({
      ...filters,
      priceRange: range
    }));
  }

  /**
   * Toggle view mode between grid and list
   */
  toggleViewMode(): void {
    const currentMode = this.viewModeSignal();
    this.viewModeSignal.set(currentMode === 'grid' ? 'list' : 'grid');
  }

  /**
   * Toggle item selection for bulk operations
   */
  toggleItemSelection(itemId: string): void {
    const selected = new Set(this.selectedItems());
    
    if (selected.has(itemId)) {
      selected.delete(itemId);
    } else {
      selected.add(itemId);
    }
    
    this.selectedItemsSignal.set(selected);
    this.showBulkActionsSignal.set(selected.size > 0);
  }

  /**
   * Select all filtered items
   */
  selectAllItems(): void {
    const items = this.filteredWishlistItems();
    const allIds = new Set(items.map(item => item.id));
    
    this.selectedItemsSignal.set(allIds);
    this.showBulkActionsSignal.set(allIds.size > 0);
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedItemsSignal.set(new Set());
    this.showBulkActionsSignal.set(false);
  }

  /**
   * Remove item from wishlist
   */
  removeFromWishlist(itemId: string): void {
    this.userService.removeFromWishlist(itemId).subscribe({
      next: () => {
        this.loadWishlistData();
        this.showSuccessMessage('Item removed from wishlist');
      },
      error: (error) => {
        console.error('Failed to remove item from wishlist:', error);
        this.showErrorMessage('Failed to remove item from wishlist');
      }
    });
  }

  /**
   * Add item to shopping cart
   */
  addToCart(item: WishlistItem): void {
    this.userService.addToCart(item.productId, 1).subscribe({
      next: () => {
        this.showSuccessMessage('Item added to cart');
      },
      error: (error) => {
        console.error('Failed to add item to cart:', error);
        this.showErrorMessage('Failed to add item to cart');
      }
    });
  }

  /**
   * Add multiple items to cart (bulk operation)
   */
  addSelectedToCart(): void {
    const selectedIds = Array.from(this.selectedItems());
    const items = this.filteredWishlistItems().filter(item => selectedIds.includes(item.id));

    if (!items.length) return;

    this.userService.addMultipleToCart(items.map(item => ({
      productId: item.productId,
      quantity: 1
    }))).subscribe({
      next: () => {
        this.clearSelection();
        this.showSuccessMessage(`${items.length} items added to cart`);
      },
      error: (error) => {
        console.error('Failed to add items to cart:', error);
        this.showErrorMessage('Failed to add items to cart');
      }
    });
  }

  /**
   * Remove multiple items from wishlist (bulk operation)
   */
  removeSelectedItems(): void {
    const selectedIds = Array.from(this.selectedItems());
    
    if (!selectedIds.length) return;

    this.userService.removeMultipleFromWishlist(selectedIds).subscribe({
      next: () => {
        this.clearSelection();
        this.loadWishlistData();
        this.showSuccessMessage(`${selectedIds.length} items removed from wishlist`);
      },
      error: (error) => {
        console.error('Failed to remove items from wishlist:', error);
        this.showErrorMessage('Failed to remove items from wishlist');
      }
    });
  }

  /**
   * Share wishlist functionality
   */
  shareWishlist(): void {
    const url = `${window.location.origin}/shared-wishlist/${this.userService.getCurrentUserId()}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My SouqSyria Wishlist',
        text: 'Check out my Syrian marketplace wishlist',
        url: url
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        this.showSuccessMessage('Wishlist link copied to clipboard');
      });
    }
  }

  /**
   * Export wishlist to PDF or other format
   */
  exportWishlist(): void {
    this.userService.exportWishlist('pdf').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'souqsyria-wishlist.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showSuccessMessage('Wishlist exported successfully');
      },
      error: (error) => {
        console.error('Failed to export wishlist:', error);
        this.showErrorMessage('Failed to export wishlist');
      }
    });
  }

  /**
   * Get item name based on current language
   */
  getItemName(item: WishlistItem): string {
    const lang = this.currentLanguageSignal();
    return lang === 'ar' ? item.nameAr : item.nameEn;
  }

  /**
   * Get item description based on current language
   */
  getItemDescription(item: WishlistItem): string {
    const lang = this.currentLanguageSignal();
    return lang === 'ar' ? item.descriptionAr : item.descriptionEn;
  }

  /**
   * Format currency in Syrian Pounds or USD
   */
  formatCurrency(amount: number, currency: 'SYP' | 'USD' = 'SYP'): string {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0
      }).format(amount);
    }

    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date based on current language locale
   */
  formatDate(date: Date): string {
    const lang = this.currentLanguageSignal();
    const locale = lang === 'ar' ? 'ar-SY' : 'en-US';

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Format USD currency
   */
  formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Get CSS class for category chip
   */
  getCategoryChipClass(category: string): string {
    const baseClasses = 'text-xs font-medium px-2 py-1 rounded';
    
    switch (category.toLowerCase()) {
      case 'damascus steel':
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case 'beauty & wellness':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'textiles & fabrics':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'food & spices':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'traditional crafts':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'jewelry & accessories':
        return `${baseClasses} bg-pink-100 text-pink-800`;
      case 'nuts & snacks':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'sweets & desserts':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  /**
   * Calculate discount percentage
   */
  getDiscountPercentage(item: WishlistItem): number {
    if (!item.originalPrice || item.originalPrice <= item.price) return 0;
    return Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
  }

  /**
   * Check if item has recent price drop
   */
  hasRecentPriceDrop(item: WishlistItem): boolean {
    if (!item.priceHistory || item.priceHistory.length < 2) return false;
    
    const lastTwoEntries = item.priceHistory.slice(-2);
    return lastTwoEntries[1].price < lastTwoEntries[0].price;
  }

  /**
   * Get availability status text
   */
  getAvailabilityText(item: WishlistItem): string {
    const lang = this.currentLanguageSignal();
    
    if (!item.isAvailable || item.stockQuantity === 0) {
      return lang === 'ar' ? 'غير متوفر' : 'Out of Stock';
    }
    
    if (item.stockQuantity <= 5) {
      return lang === 'ar' ? `${item.stockQuantity} قطع متبقية` : `${item.stockQuantity} items left`;
    }
    
    return lang === 'ar' ? 'متوفر' : 'In Stock';
  }

  /**
   * Get availability status CSS class
   */
  getAvailabilityClass(item: WishlistItem): string {
    if (!item.isAvailable || item.stockQuantity === 0) {
      return 'text-red-600 bg-red-100';
    }
    
    if (item.stockQuantity <= 5) {
      return 'text-orange-600 bg-orange-100';
    }
    
    return 'text-green-600 bg-green-100';
  }

  /**
   * Track by function for wishlist items
   */
  trackByItemId(index: number, item: WishlistItem): string {
    return item.id;
  }

  /**
   * Show success message
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Show error message
   */
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
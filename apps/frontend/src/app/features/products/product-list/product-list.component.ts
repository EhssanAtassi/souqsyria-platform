import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { ProductsService } from '../../../store/products/products.service';
import { ProductsQuery } from '../../../store/products/products.query';
import { CartService } from '../../../store/cart/cart.service';
import { Product } from '../../../shared/interfaces/product.interface';

import { ProductBoxGridComponent } from '../../../shared/components/ui/product-box/product-box-grid.component';
import { ProductBoxListComponent } from '../../../shared/components/ui/product-box/product-box-list.component';
import { LoaderComponent } from '../../../shared/components/ui/loader/loader.component';
import { PaginationComponent } from '../../../shared/components/ui/pagination/pagination.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/ui/breadcrumb/breadcrumb.component';
import { AlertComponent } from '../../../shared/components/ui/alert/alert.component';

/**
 * Product List Component - Syrian Marketplace
 *
 * Feature component displaying paginated product grid/list with filtering.
 * Integrates with Akita ProductsQuery for reactive state management.
 * Supports bilingual display (English/Arabic) with RTL layout.
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductListComponent:
 *       type: object
 *       description: Product listing page with grid/list views
 *       properties:
 *         viewMode:
 *           type: string
 *           enum: [grid, list]
 *           description: Display mode for products
 *         currentPage:
 *           type: number
 *           description: Current pagination page
 *         itemsPerPage:
 *           type: number
 *           description: Products per page (12, 24, 36)
 *         sortBy:
 *           type: string
 *           enum: [price, rating, name, newest]
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *
 * @example
 * // Usage in template:
 * <app-product-list></app-product-list>
 *
 * // With category filter:
 * Route: /products/damascus-steel
 * Component auto-detects category from route params
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    ProductBoxGridComponent,
    ProductBoxListComponent,
    LoaderComponent,
    PaginationComponent,
    BreadcrumbComponent,
    AlertComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductListComponent implements OnInit {
  /**
   * Injected services
   */
  private productsService = inject(ProductsService);
  private productsQuery = inject(ProductsQuery);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);

  /**
   * Reactive state signals
   */
  viewMode = signal<'grid' | 'list'>('grid');
  currentPage = signal(1);
  itemsPerPage = signal(12);
  language = signal<'en' | 'ar'>('en');

  /**
   * Akita store observables
   */
  products$ = this.productsQuery.filteredProducts$;
  loading$ = this.productsQuery.selectLoading();
  error$ = this.productsQuery.selectError();
  selectedCategory$ = this.productsQuery.select('selectedCategory');
  sortBy$ = this.productsQuery.select('sortBy');
  sortOrder$ = this.productsQuery.select('sortOrder');

  /**
   * Computed values
   */
  breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const category = this.categorySlug();
    const items: BreadcrumbItem[] = [
      {
        label: 'Home',
        labelArabic: 'الرئيسية',
        url: '/',
        icon: 'home'
      },
      {
        label: 'Products',
        labelArabic: 'المنتجات',
        url: '/products'
      }
    ];

    if (category) {
      items.push({
        label: this.getCategoryName(category),
        labelArabic: this.getCategoryNameArabic(category)
      });
    }

    return items;
  });

  /**
   * Category from route params
   */
  categorySlug = signal<string | null>(null);

  /**
   * Sort options for dropdown
   */
  sortOptions = [
    { value: 'rating', label: 'Best Rated', labelArabic: 'الأعلى تقييماً' },
    { value: 'price-asc', label: 'Price: Low to High', labelArabic: 'السعر: من الأقل للأعلى' },
    { value: 'price-desc', label: 'Price: High to Low', labelArabic: 'السعر: من الأعلى للأقل' },
    { value: 'newest', label: 'Newest First', labelArabic: 'الأحدث أولاً' },
    { value: 'name', label: 'Name A-Z', labelArabic: 'الاسم أ-ي' }
  ];

  /**
   * Items per page options
   */
  itemsPerPageOptions = [
    { value: 12, label: '12 per page', labelArabic: '12 لكل صفحة' },
    { value: 24, label: '24 per page', labelArabic: '24 لكل صفحة' },
    { value: 36, label: '36 per page', labelArabic: '36 لكل صفحة' }
  ];

  constructor() {
    // Listen to route params for category changes
    this.route.params
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        const category = params['category'];
        if (category) {
          this.categorySlug.set(category);
          this.productsService.setCategory(category);
        } else {
          this.categorySlug.set(null);
          this.productsService.setCategory(null);
        }
      });

    // Load view preferences from localStorage
    const savedViewMode = localStorage.getItem('productViewMode') as 'grid' | 'list';
    if (savedViewMode) {
      this.viewMode.set(savedViewMode);
    }

    const savedLanguage = localStorage.getItem('language') as 'en' | 'ar';
    if (savedLanguage) {
      this.language.set(savedLanguage);
    }
  }

  /**
   * Component initialization
   * Load products from Akita store
   */
  ngOnInit(): void {
    this.productsService.loadProducts();
  }

  /**
   * Toggle between grid and list view
   * Persists preference to localStorage
   */
  toggleViewMode(): void {
    const newMode = this.viewMode() === 'grid' ? 'list' : 'grid';
    this.viewMode.set(newMode);
    localStorage.setItem('productViewMode', newMode);
  }

  /**
   * Change sort option
   * Updates Akita store state
   *
   * @param sortValue - Sort option value (e.g., 'price-asc', 'rating')
   */
  changeSortOption(sortValue: string): void {
    if (sortValue === 'price-asc') {
      this.productsService.setSortBy('price', 'asc');
    } else if (sortValue === 'price-desc') {
      this.productsService.setSortBy('price', 'desc');
    } else if (sortValue === 'name') {
      this.productsService.setSortBy('name', 'asc');
    } else if (sortValue === 'newest') {
      this.productsService.setSortBy('newest', 'desc');
    } else {
      this.productsService.setSortBy('rating', 'desc');
    }
  }

  /**
   * Change items per page
   * Resets to page 1
   *
   * @param count - Number of items per page
   */
  changeItemsPerPage(count: number): void {
    this.itemsPerPage.set(count);
    this.currentPage.set(1);
  }

  /**
   * Handle page change from pagination component
   *
   * @param page - New page number
   */
  onPageChange(page: number): void {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Add product to cart
   * Uses CartService from Akita
   *
   * @param product - Product to add
   */
  onAddToCart(product: Product): void {
    this.cartService.addToCart(product.id, 1);
  }

  /**
   * Add product to wishlist
   * TODO: Implement wishlist service
   *
   * @param product - Product to add to wishlist
   */
  onAddToWishlist(product: Product): void {
    console.log('Add to wishlist:', product);
    // Will be implemented in future phase
  }

  /**
   * Handle quick view modal
   * TODO: Implement modal service
   *
   * @param product - Product to preview
   */
  onQuickView(product: Product): void {
    console.log('Quick view:', product);
    // Will be implemented in future phase
  }

  /**
   * Get category display name from slug
   *
   * @param slug - Category slug
   * @returns Display name
   */
  private getCategoryName(slug: string): string {
    const categoryMap: Record<string, string> = {
      'damascus-steel': 'Damascus Steel',
      'beauty-wellness': 'Beauty & Wellness',
      'textiles-fabrics': 'Textiles & Fabrics',
      'food-spices': 'Food & Spices',
      'traditional-crafts': 'Traditional Crafts',
      'jewelry-accessories': 'Jewelry & Accessories',
      'nuts-snacks': 'Nuts & Snacks',
      'sweets-desserts': 'Sweets & Desserts'
    };
    return categoryMap[slug] || slug;
  }

  /**
   * Get Arabic category name from slug
   *
   * @param slug - Category slug
   * @returns Arabic display name
   */
  private getCategoryNameArabic(slug: string): string {
    const categoryMap: Record<string, string> = {
      'damascus-steel': 'الفولاذ الدمشقي',
      'beauty-wellness': 'الجمال والعافية',
      'textiles-fabrics': 'المنسوجات والأقمشة',
      'food-spices': 'الطعام والتوابل',
      'traditional-crafts': 'الحرف التقليدية',
      'jewelry-accessories': 'المجوهرات والإكسسوارات',
      'nuts-snacks': 'المكسرات والوجبات الخفيفة',
      'sweets-desserts': 'الحلويات والتحليات'
    };
    return categoryMap[slug] || slug;
  }
}

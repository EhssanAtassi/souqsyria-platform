import { Injectable, inject } from '@angular/core';
import { ProductsStore } from './products.store';
import { ProductsQuery } from './products.query';
import { ProductsApiService } from '../../core/api/products-api.service';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Products Service
 *
 * Business logic layer for product management.
 * Handles data loading, filtering, and state updates.
 * NOW CONNECTED TO REAL NESTJS BACKEND + MYSQL DATABASE! ✅
 *
 * Features:
 * - Load products from NestJS API (MySQL)
 * - Category filtering
 * - Search functionality
 * - Price range filtering
 * - Heritage/stock toggles
 * - Sorting management
 * - Filter reset
 *
 * @example
 * // In component
 * constructor(private productsService: ProductsService) {}
 *
 * ngOnInit() {
 *   // Load all products from MySQL
 *   this.productsService.loadProducts().subscribe();
 *
 *   // Filter by category
 *   this.productsService.setCategory('damascus-steel');
 *
 *   // Search products
 *   this.productsService.setSearchQuery('knife');
 * }
 */
@Injectable({ providedIn: 'root' })
export class ProductsService {
  private store = inject(ProductsStore);
  private query = inject(ProductsQuery);
  private productsApi = inject(ProductsApiService);

  /**
   * Load All Products
   *
   * Fetches products from NestJS backend (MySQL database) and stores them in Akita.
   * Shows loading state during fetch with automatic error handling.
   *
   * @returns Observable that completes when products are loaded
   */
  loadProducts() {
    this.store.setLoading(true);

    return this.productsApi.getProducts({ limit: 100 }).pipe(
      tap(products => {
        console.log(`✅ Loaded ${products.length} products from MySQL backend`);
        this.store.set(products);
        this.store.setLoading(false);
      }),
      catchError(error => {
        console.error('❌ Failed to load products from backend:', error);
        this.store.setLoading(false);
        this.store.setError(error.message);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Load Single Product
   *
   * Fetches a specific product from backend and upserts it into store.
   * Useful for product detail pages.
   *
   * @param slug - Product URL slug
   */
  loadProduct(slug: string) {
    return this.productsApi.getProductBySlug(slug).pipe(
      tap(product => {
        if (product) {
          console.log(`✅ Loaded product: ${product.name}`);
          this.store.upsert(product.id, product);
        }
      }),
      catchError(error => {
        console.error('❌ Failed to load product:', error);
        return of(null);
      })
    );
  }

  /**
   * Set Category Filter
   *
   * @param categorySlug - Category slug or null to show all
   */
  setCategory(categorySlug: string | null) {
    this.store.update({ selectedCategory: categorySlug });
  }

  /**
   * Set Search Query
   *
   * Updates search query. The query service will automatically
   * filter products based on name, Arabic name, and description.
   *
   * @param query - Search text
   */
  setSearchQuery(query: string) {
    this.store.update({ searchQuery: query });
  }

  /**
   * Set Price Range Filter
   *
   * @param min - Minimum price
   * @param max - Maximum price
   */
  setPriceRange(min: number, max: number) {
    this.store.update({ priceRange: { min, max } });
  }

  /**
   * Clear Price Range Filter
   */
  clearPriceRange() {
    this.store.update({ priceRange: null });
  }

  /**
   * Toggle Heritage Filter
   *
   * Toggles between showing all products vs UNESCO heritage only
   */
  toggleHeritageFilter() {
    this.store.update(state => ({
      isHeritageOnly: !state.isHeritageOnly
    }));
  }

  /**
   * Toggle Stock Filter
   *
   * Toggles between showing all products vs in-stock only
   */
  toggleStockFilter() {
    this.store.update(state => ({
      inStockOnly: !state.inStockOnly
    }));
  }

  /**
   * Set Sorting
   *
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction (default: ascending)
   */
  setSorting(sortBy: 'price' | 'rating' | 'name' | 'newest', sortOrder: 'asc' | 'desc' = 'asc') {
    this.store.update({ sortBy, sortOrder });
  }

  /**
   * Clear All Filters
   *
   * Resets all filters to default state while keeping products in store
   */
  clearFilters() {
    this.store.update({
      selectedCategory: null,
      searchQuery: '',
      priceRange: null,
      isHeritageOnly: false,
      inStockOnly: true
    });
  }

  /**
   * Reset Store
   *
   * Clears all products and resets to initial state
   */
  reset() {
    this.store.reset();
  }
}

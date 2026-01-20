import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ProductsStore, ProductFilters } from './products.store';
import { ProductsQuery } from './products.query';
import { Product } from '../../shared/interfaces/product.interface';
import { ProductService } from '../../shared/services/product.service';

/**
 * Syrian Marketplace Products Service (Akita Integration)
 *
 * Manages product catalog operations using Akita state management
 * Integrates with existing ProductService for data fetching
 *
 * Features:
 * - Product catalog management
 * - Advanced filtering and search
 * - Category navigation
 * - Syrian authenticity filtering
 * - Cache management
 * - Loading and error handling
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductsAkitaService:
 *       type: object
 *       description: Akita-powered products service for Syrian marketplace
 */
@Injectable({
  providedIn: 'root'
})
export class ProductsAkitaService {

  /**
   * Public observables for products state
   */
  readonly products$ = this.productsQuery.products$;
  readonly filteredProducts$ = this.productsQuery.filteredProducts$;
  readonly loading$ = this.productsQuery.loading$;
  readonly error$ = this.productsQuery.error$;
  readonly filters$ = this.productsQuery.filters$;
  readonly searchQuery$ = this.productsQuery.searchQuery$;
  readonly selectedCategoryId$ = this.productsQuery.selectedCategoryId$;

  /**
   * Initializes products service with Akita store and query
   *
   * @param productsStore - Akita products store instance
   * @param productsQuery - Akita products query instance
   * @param productService - Existing product service for data fetching
   */
  constructor(
    private productsStore: ProductsStore,
    private productsQuery: ProductsQuery,
    private productService: ProductService
  ) {}

  /**
   * Loads all products from service
   * Updates store with fetched products
   *
   * @returns Observable<Product[]>
   */
  loadProducts(): Observable<Product[]> {
    this.productsStore.setLoading(true);
    this.productsStore.setError(null);

    return this.productService.getProducts().pipe(
      tap(products => {
        this.productsStore.set(products);
        this.productsStore.markAsUpdated();
        this.productsStore.setLoading(false);
      }),
      catchError(error => {
        this.productsStore.setError('Failed to load products');
        this.productsStore.setLoading(false);
        return of([]);
      })
    );
  }

  /**
   * Loads products by category
   *
   * @param categoryId - Category ID
   * @returns Observable<Product[]>
   */
  loadProductsByCategory(categoryId: string): Observable<Product[]> {
    this.productsStore.setLoading(true);
    this.productsStore.selectCategory(categoryId);

    return this.productService.getProductsByCategory(categoryId).pipe(
      tap(products => {
        this.productsStore.upsertProducts(products);
        this.productsStore.setLoading(false);
      }),
      catchError(error => {
        this.productsStore.setError('Failed to load category products');
        this.productsStore.setLoading(false);
        return of([]);
      })
    );
  }

  /**
   * Loads single product by ID
   *
   * @param productId - Product ID
   * @returns Observable<Product | null>
   */
  loadProduct(productId: string): Observable<Product | null> {
    // Check if product is already in store
    const cached = this.productsQuery.getProduct(productId);
    if (cached) {
      return of(cached);
    }

    this.productsStore.setLoading(true);

    return this.productService.getProduct(productId).pipe(
      tap(product => {
        if (product) {
          this.productsStore.upsertProduct(product);
        }
        this.productsStore.setLoading(false);
      }),
      catchError(error => {
        this.productsStore.setError('Failed to load product');
        this.productsStore.setLoading(false);
        return of(null);
      })
    );
  }

  /**
   * Loads product by slug
   *
   * @param slug - Product slug
   * @returns Observable<Product | null>
   */
  loadProductBySlug(slug: string): Observable<Product | null> {
    // Check if product is already in store
    const cached = this.productsQuery.getProductBySlug(slug);
    if (cached) {
      return of(cached);
    }

    this.productsStore.setLoading(true);

    return this.productService.getProductBySlug(slug).pipe(
      tap(product => {
        if (product) {
          this.productsStore.upsertProduct(product);
        }
        this.productsStore.setLoading(false);
      }),
      catchError(error => {
        this.productsStore.setError('Failed to load product');
        this.productsStore.setLoading(false);
        return of(null);
      })
    );
  }

  /**
   * Sets product filters
   *
   * @param filters - Filter values
   */
  setFilters(filters: ProductFilters): void {
    this.productsStore.setFilters(filters);
  }

  /**
   * Updates specific filter
   *
   * @param filterKey - Filter key
   * @param value - Filter value
   */
  updateFilter<K extends keyof ProductFilters>(filterKey: K, value: ProductFilters[K]): void {
    const currentFilters = this.productsQuery.getValue().filters;
    this.productsStore.setFilters({
      ...currentFilters,
      [filterKey]: value
    });
  }

  /**
   * Sets search query
   *
   * @param query - Search query string
   */
  search(query: string): void {
    this.productsStore.setSearchQuery(query);
  }

  /**
   * Selects category for filtering
   *
   * @param categoryId - Category ID
   */
  selectCategory(categoryId: string): void {
    this.productsStore.selectCategory(categoryId);
  }

  /**
   * Clears category selection
   */
  clearCategory(): void {
    this.productsStore.selectCategory(null);
  }

  /**
   * Clears all filters and search
   */
  clearFilters(): void {
    this.productsStore.clearFilters();
  }

  /**
   * Gets products by category (from store)
   *
   * @param categoryId - Category ID
   * @returns Observable<Product[]>
   */
  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return this.productsQuery.selectByCategory(categoryId);
  }

  /**
   * Gets products by seller (from store)
   *
   * @param sellerId - Seller ID
   * @returns Observable<Product[]>
   */
  getProductsBySeller(sellerId: string): Observable<Product[]> {
    return this.productsQuery.selectBySeller(sellerId);
  }

  /**
   * Gets in-stock products
   *
   * @returns Observable<Product[]>
   */
  getInStockProducts(): Observable<Product[]> {
    return this.productsQuery.selectInStock();
  }

  /**
   * Gets products on sale
   *
   * @returns Observable<Product[]>
   */
  getSaleProducts(): Observable<Product[]> {
    return this.productsQuery.selectOnSale();
  }

  /**
   * Gets authentic Syrian products
   *
   * @returns Observable<Product[]>
   */
  getAuthenticProducts(): Observable<Product[]> {
    return this.productsQuery.selectAuthentic();
  }

  /**
   * Gets UNESCO recognized products
   *
   * @returns Observable<Product[]>
   */
  getUNESCOProducts(): Observable<Product[]> {
    return this.productsQuery.selectUNESCO();
  }

  /**
   * Searches products
   *
   * @param query - Search query
   * @returns Observable<Product[]>
   */
  searchProducts(query: string): Observable<Product[]> {
    this.search(query);
    return this.productsQuery.searchProducts(query);
  }

  /**
   * Clears product cache
   */
  clearCache(): void {
    this.productsStore.clearProducts();
  }
}

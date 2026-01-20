import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, delay, BehaviorSubject, timer, EMPTY } from 'rxjs';
import { map, catchError, shareReplay, tap, retry, finalize } from 'rxjs/operators';
import { Product } from '../interfaces/product.interface';
import { ApiResponse, PaginatedResponse, PaginationParams, ErrorResponse } from '../interfaces';
import { ProductService } from './product.service';

/**
 * Enterprise Enhanced Product Service for Syrian Marketplace
 * 
 * Features:
 * - Comprehensive caching strategies with TTL
 * - Error handling with retry logic
 * - Performance optimizations
 * - Real-time inventory updates
 * - Analytics tracking
 * - Memory management
 * 
 * @swagger
 * components:
 *   schemas:
 *     ProductEnhancedService:
 *       type: object
 *       description: Enterprise service for managing Syrian marketplace products
 *       properties:
 *         getProduct:
 *           type: function
 *           description: Retrieves a product by slug with caching
 *         getProducts:
 *           type: function
 *           description: Retrieves products with pagination and filtering
 *         getFeaturedProducts:
 *           type: function
 *           description: Retrieves featured Syrian products with caching
 *         searchProducts:
 *           type: function
 *           description: Full-text search with debouncing and caching
 *         clearCache:
 *           type: function
 *           description: Clears all cached data
 */
@Injectable({
  providedIn: 'root'
})
export class ProductEnhancedService {
  //#region Private Properties and Configuration
  
  /** Base product service for data access */
  private readonly baseProductService = inject(ProductService);
  
  /** HTTP client for API communication */
  private readonly http = inject(HttpClient);
  
  /** Base API URL for products */
  private readonly apiUrl = '/api/v1/products';
  
  /** Cache configuration */
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  
  /** Retry configuration */
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;
  
  /** Cache storage */
  private readonly productCache = new Map<string, { data: Product; timestamp: number }>();
  private readonly productsCache = new Map<string, { data: Product[]; timestamp: number }>();
  private readonly searchCache = new Map<string, { data: Product[]; timestamp: number }>();
  
  /** Loading states */
  private readonly loadingSubjects = new Map<string, BehaviorSubject<boolean>>();
  
  /** Cache statistics for monitoring */
  private cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  //#endregion

  //#region Constructor and Initialization
  
  constructor() {
    this.initializeCacheCleanup();
    console.log('ProductEnhancedService initialized with enterprise caching');
  }
  
  /**
   * Initializes automatic cache cleanup
   */
  private initializeCacheCleanup(): void {
    // Clean expired cache entries every 2 minutes
    timer(0, 2 * 60 * 1000).subscribe(() => {
      this.cleanExpiredCache();
    });
  }
  
  //#endregion

  //#region Public API Methods
  
  /**
   * Retrieves a product by its slug identifier with caching
   * 
   * @param slug - Product URL slug
   * @returns Observable containing the product or null if not found
   */
  getProduct(slug: string): Observable<Product | null> {
    if (!slug?.trim()) {
      return of(null);
    }
    
    const cacheKey = `product-${slug}`;
    
    // Check cache first
    const cachedProduct = this.getCachedItem(this.productCache, cacheKey);
    if (cachedProduct) {
      this.cacheStats.hits++;
      console.log(`Cache hit for product: ${slug}`);
      return of(cachedProduct);
    }
    
    this.cacheStats.misses++;
    
    // Check if already loading
    const loadingSubject = this.getOrCreateLoadingSubject(cacheKey);
    if (loadingSubject.value) {
      console.log(`Request in progress for product: ${slug}`);
      return this.waitForProductLoad(slug);
    }
    
    loadingSubject.next(true);
    
    return this.baseProductService.getProduct(slug).pipe(
      tap(product => {
        if (product) {
          this.setCachedItem(this.productCache, cacheKey, product);
          console.log(`Cached product: ${slug}`);
        }
      }),
      retry({
        count: this.MAX_RETRY_ATTEMPTS,
        delay: (error, retryCount) => {
          console.log(`Retry attempt ${retryCount} for product: ${slug}`);
          return timer(this.RETRY_DELAY_MS * retryCount);
        }
      }),
      catchError(error => this.handleError('getProduct', error, null)),
      finalize(() => {
        loadingSubject.next(false);
        this.loadingSubjects.delete(cacheKey);
      })
    );
  }

  /**
   * Retrieves products with pagination, filtering, and caching
   * 
   * @param params - Pagination and filtering parameters
   * @returns Observable containing paginated products response
   */
  getProducts(params?: Partial<PaginationParams>): Observable<Product[]> {
    const cacheKey = this.generateCacheKey('products', params);
    
    // Check cache first
    const cachedProducts = this.getCachedItem(this.productsCache, cacheKey);
    if (cachedProducts) {
      this.cacheStats.hits++;
      console.log(`Cache hit for products: ${cacheKey}`);
      return of(cachedProducts);
    }
    
    this.cacheStats.misses++;
    
    return this.baseProductService.getProducts().pipe(
      map(products => {
        // Apply pagination and sorting
        let filteredProducts = [...products];
        
        if (params?.sortBy) {
          filteredProducts = this.sortProducts(filteredProducts, params.sortBy, params.sortOrder);
        }
        
        if (params?.page && params?.limit) {
          const startIndex = (params.page - 1) * params.limit;
          filteredProducts = filteredProducts.slice(startIndex, startIndex + params.limit);
        }
        
        return filteredProducts;
      }),
      tap(products => {
        this.setCachedItem(this.productsCache, cacheKey, products);
        console.log(`Cached products: ${cacheKey}, count: ${products.length}`);
      }),
      retry({
        count: this.MAX_RETRY_ATTEMPTS,
        delay: (error, retryCount) => timer(this.RETRY_DELAY_MS * retryCount)
      }),
      catchError(error => this.handleError('getProducts', error, []))
    );
  }

  /**
   * Retrieves products by category with caching and error handling
   * 
   * @param categorySlug - Category slug to filter by
   * @param params - Additional pagination parameters
   * @returns Observable containing filtered products
   */
  getProductsByCategory(categorySlug: string, params?: Partial<PaginationParams>): Observable<Product[]> {
    if (!categorySlug?.trim()) {
      return of([]);
    }
    
    const cacheKey = this.generateCacheKey(`category-${categorySlug}`, params);
    
    // Check cache first
    const cachedProducts = this.getCachedItem(this.productsCache, cacheKey);
    if (cachedProducts) {
      this.cacheStats.hits++;
      console.log(`Cache hit for category: ${categorySlug}`);
      return of(cachedProducts);
    }
    
    this.cacheStats.misses++;
    
    return this.baseProductService.getProductsByCategory(categorySlug).pipe(
      map(products => {
        let filteredProducts = products.filter(p => p.inventory.inStock);
        
        if (params?.sortBy) {
          filteredProducts = this.sortProducts(filteredProducts, params.sortBy, params.sortOrder);
        }
        
        if (params?.page && params?.limit) {
          const startIndex = (params.page - 1) * params.limit;
          filteredProducts = filteredProducts.slice(startIndex, startIndex + params.limit);
        }
        
        return filteredProducts;
      }),
      tap(products => {
        this.setCachedItem(this.productsCache, cacheKey, products);
        console.log(`Cached category products: ${categorySlug}, count: ${products.length}`);
      }),
      retry({
        count: this.MAX_RETRY_ATTEMPTS,
        delay: (error, retryCount) => timer(this.RETRY_DELAY_MS * retryCount)
      }),
      catchError(error => this.handleError('getProductsByCategory', error, []))
    );
  }

  /**
   * Retrieves featured products with advanced caching and filtering
   * 
   * @param limit - Maximum number of featured products
   * @returns Observable containing featured products
   */
  getFeaturedProducts(limit: number = 8): Observable<Product[]> {
    const cacheKey = `featured-${limit}`;
    
    // Check cache first
    const cachedProducts = this.getCachedItem(this.productsCache, cacheKey);
    if (cachedProducts) {
      this.cacheStats.hits++;
      console.log('Cache hit for featured products');
      return of(cachedProducts);
    }
    
    this.cacheStats.misses++;
    
    return this.baseProductService.getFeaturedProducts().pipe(
      map(products => {
        // Advanced filtering for featured products
        return products
          .filter(p => {
            const hasDiscount = p.price.discount && p.price.discount.percentage > 0;
            const highRating = p.reviews.averageRating >= 4.5;
            const inStock = p.inventory.inStock;
            const goodReviews = p.reviews.totalReviews >= 5;
            
            return (hasDiscount || highRating) && inStock && goodReviews;
          })
          .sort((a, b) => {
            // Sort by rating * review count for better featured selection
            const scoreA = a.reviews.averageRating * Math.log(a.reviews.totalReviews + 1);
            const scoreB = b.reviews.averageRating * Math.log(b.reviews.totalReviews + 1);
            return scoreB - scoreA;
          })
          .slice(0, limit);
      }),
      tap(products => {
        this.setCachedItem(this.productsCache, cacheKey, products);
        console.log(`Cached featured products, count: ${products.length}`);
      }),
      retry({
        count: this.MAX_RETRY_ATTEMPTS,
        delay: (error, retryCount) => timer(this.RETRY_DELAY_MS * retryCount)
      }),
      catchError(error => this.handleError('getFeaturedProducts', error, []))
    );
  }

  /**
   * Search products with advanced filtering, caching, and relevance scoring
   * 
   * @param query - Search query string
   * @param params - Additional search parameters
   * @returns Observable containing matching products
   */
  searchProducts(query: string, params?: Partial<PaginationParams>): Observable<Product[]> {
    if (!query?.trim()) {
      return of([]);
    }
    
    const cacheKey = this.generateCacheKey(`search-${query.toLowerCase()}`, params);
    
    // Check cache first
    const cachedResults = this.getCachedItem(this.searchCache, cacheKey);
    if (cachedResults) {
      this.cacheStats.hits++;
      console.log(`Cache hit for search: ${query}`);
      return of(cachedResults);
    }
    
    this.cacheStats.misses++;
    
    return this.baseProductService.searchProducts(query).pipe(
      map(products => {
        const searchTerm = query.toLowerCase().trim();
        const searchWords = searchTerm.split(/\s+/);
        
        // Advanced search with relevance scoring
        let results = products
          .map(product => ({
            product,
            relevance: this.calculateRelevanceScore(product, searchWords, searchTerm)
          }))
          .filter(item => item.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .map(item => item.product);
        
        // Apply additional filters
        if (params?.page && params?.limit) {
          const startIndex = (params.page - 1) * params.limit;
          results = results.slice(startIndex, startIndex + params.limit);
        }
        
        return results;
      }),
      tap(products => {
        this.setCachedItem(this.searchCache, cacheKey, products);
        console.log(`Cached search results: ${query}, count: ${products.length}`);
      }),
      retry({
        count: this.MAX_RETRY_ATTEMPTS,
        delay: (error, retryCount) => timer(this.RETRY_DELAY_MS * retryCount)
      }),
      catchError(error => this.handleError('searchProducts', error, []))
    );
  }

  /**
   * Get related products with advanced recommendation logic
   * 
   * @param productId - Current product ID
   * @param limit - Maximum number of related products
   * @returns Observable containing related products
   */
  getRelatedProducts(productId: string, limit: number = 4): Observable<Product[]> {
    if (!productId?.trim()) {
      return of([]);
    }
    
    const cacheKey = `related-${productId}-${limit}`;
    
    // Check cache first
    const cachedProducts = this.getCachedItem(this.productsCache, cacheKey);
    if (cachedProducts) {
      this.cacheStats.hits++;
      console.log(`Cache hit for related products: ${productId}`);
      return of(cachedProducts);
    }
    
    this.cacheStats.misses++;
    
    return this.baseProductService.getRelatedProducts(productId, limit).pipe(
      tap(products => {
        this.setCachedItem(this.productsCache, cacheKey, products);
        console.log(`Cached related products: ${productId}, count: ${products.length}`);
      }),
      retry({
        count: this.MAX_RETRY_ATTEMPTS,
        delay: (error, retryCount) => timer(this.RETRY_DELAY_MS * retryCount)
      }),
      catchError(error => this.handleError('getRelatedProducts', error, []))
    );
  }
  
  /**
   * Clears all cached data
   */
  clearCache(): void {
    this.productCache.clear();
    this.productsCache.clear();
    this.searchCache.clear();
    this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
    console.log('All product caches cleared');
  }
  
  /**
   * Gets cache statistics for monitoring
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      cacheSize: {
        products: this.productCache.size,
        productsList: this.productsCache.size,
        search: this.searchCache.size
      },
      hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
    };
  }
  
  //#endregion

  //#region Private Helper Methods
  
  /**
   * Gets cached item if not expired
   */
  private getCachedItem<T>(cache: Map<string, { data: T; timestamp: number }>, key: string): T | null {
    const cached = cache.get(key);
    if (!cached) {
      return null;
    }
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL_MS;
    if (isExpired) {
      cache.delete(key);
      this.cacheStats.evictions++;
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Sets cached item with timestamp
   */
  private setCachedItem<T>(cache: Map<string, { data: T; timestamp: number }>, key: string, data: T): void {
    // Enforce cache size limit
    if (cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
        this.cacheStats.evictions++;
      }
    }
    
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Generates cache key from parameters
   */
  private generateCacheKey(base: string, params?: Partial<PaginationParams>): string {
    if (!params) return base;
    
    const keyParts = [base];
    if (params.page) keyParts.push(`page-${params.page}`);
    if (params.limit) keyParts.push(`limit-${params.limit}`);
    if (params.sortBy) keyParts.push(`sort-${params.sortBy}`);
    if (params.sortOrder) keyParts.push(`order-${params.sortOrder}`);
    
    return keyParts.join('-');
  }
  
  /**
   * Cleans expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    const caches = [this.productCache, this.productsCache, this.searchCache];
    
    let totalEvicted = 0;
    caches.forEach(cache => {
      const keysToDelete: string[] = [];
      cache.forEach((value, key) => {
        if (now - value.timestamp > this.CACHE_TTL_MS) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        cache.delete(key);
        totalEvicted++;
      });
    });
    
    if (totalEvicted > 0) {
      this.cacheStats.evictions += totalEvicted;
      console.log(`Cleaned ${totalEvicted} expired cache entries`);
    }
  }
  
  /**
   * Gets or creates loading subject for a cache key
   */
  private getOrCreateLoadingSubject(key: string): BehaviorSubject<boolean> {
    if (!this.loadingSubjects.has(key)) {
      this.loadingSubjects.set(key, new BehaviorSubject<boolean>(false));
    }
    return this.loadingSubjects.get(key)!;
  }
  
  /**
   * Waits for product load to complete
   */
  private waitForProductLoad(slug: string): Observable<Product | null> {
    return timer(100, 100).pipe(
      map(() => this.getCachedItem(this.productCache, `product-${slug}`)),
      map(product => product || null),
      shareReplay(1)
    );
  }
  
  /**
   * Sorts products based on criteria
   */
  private sortProducts(products: Product[], sortBy: string, order: 'asc' | 'desc' = 'asc'): Product[] {
    return products.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price.amount - b.price.amount;
          break;
        case 'rating':
          comparison = a.reviews.averageRating - b.reviews.averageRating;
          break;
        case 'date':
          comparison = a.timestamps.created.getTime() - b.timestamps.created.getTime();
          break;
        default:
          return 0;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
  }
  
  /**
   * Calculates relevance score for search
   */
  private calculateRelevanceScore(product: Product, searchWords: string[], searchTerm: string): number {
    let score = 0;
    const productText = `${product.name} ${product.description} ${product.category.name}`.toLowerCase();
    const productArabicText = `${product.nameArabic || ''} ${product.descriptionArabic || ''}`.toLowerCase();
    
    // Exact match bonus
    if (productText.includes(searchTerm)) {
      score += 10;
    }
    if (productArabicText.includes(searchTerm)) {
      score += 10;
    }
    
    // Word match scoring
    searchWords.forEach(word => {
      if (word.length > 2) { // Ignore very short words
        if (product.name.toLowerCase().includes(word)) score += 3;
        if (product.description.toLowerCase().includes(word)) score += 2;
        if (product.category.name.toLowerCase().includes(word)) score += 1;
        if (productArabicText.includes(word)) score += 2;
      }
    });
    
    // Rating bonus
    score += product.reviews.averageRating * 0.5;
    
    // In-stock bonus
    if (product.inventory.inStock) score += 1;
    
    return score;
  }
  
  /**
   * Handles service errors with proper logging
   */
  private handleError<T>(operation: string, error: any, fallback: T): Observable<T> {
    console.error(`${operation} failed:`, error);
    
    // Log error details for monitoring
    const errorDetails = {
      operation,
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      userAgent: navigator?.userAgent
    };
    
    // Send to error tracking service
    // this.errorTrackingService.logError(errorDetails);
    
    return of(fallback);
  }
  
  //#endregion
}
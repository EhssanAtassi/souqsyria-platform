/**
 * @file product.service.ts
 * @description Angular service for fetching products from the public catalog API.
 * Provides server-side pagination, sorting, and filtering via GET /products.
 *
 * @swagger
 * tags:
 *   - name: ProductService
 *     description: Frontend HTTP client for public product catalog endpoints
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductListResponse } from '../models/product-list.interface';
import {
  ProductDetailResponse,
  SearchSuggestionItem,
  VariantOptionGroup,
} from '../models/product-detail.interface';

/**
 * @description Query parameters accepted by the product listing API
 */
export interface ProductQueryParams {
  /** Page number (1-based) */
  page?: number;
  /** Items per page (1-100) */
  limit?: number;
  /** Sort option: price_asc, price_desc, newest, rating, popularity */
  sortBy?: string;
  /** Search term for product name (English or Arabic) */
  search?: string;
  /** Filter by category ID */
  categoryId?: number;
  /** Minimum price filter */
  minPrice?: number;
  /** Maximum price filter */
  maxPrice?: number;
  /** Comma-separated brand IDs to filter by */
  brandIds?: string;
}

/**
 * @description Cache entry with TTL
 */
interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Timestamp when cached (milliseconds since epoch) */
  timestamp: number;
}

/**
 * @description Service for communicating with the public products API.
 * Wraps GET /products with typed query parameters and response.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  /** Base URL for the products API endpoint */
  private readonly apiUrl = environment.productApiUrl;

  /** @description In-memory cache for product list responses */
  private readonly listCache = new Map<string, CacheEntry<ProductListResponse>>();

  /** @description In-memory cache for product detail responses */
  private readonly detailCache = new Map<string, CacheEntry<ProductDetailResponse>>();

  /** @description Cache TTL in milliseconds (5 minutes) */
  private readonly cacheTtl = 5 * 60 * 1000;

  constructor(private readonly http: HttpClient) {}

  /**
   * @description Fetches a paginated list of products from the catalog API
   * @param params - Query parameters for pagination, sorting, and filtering
   * @returns Observable of ProductListResponse with data array and pagination meta
   *
   * @example
   * this.productService.getProducts({ page: 1, limit: 20, sortBy: 'newest' })
   *   .subscribe(response => console.log(response.data, response.meta));
   */
  getProducts(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    const cacheKey = JSON.stringify(params);
    const cached = this.listCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return of(cached.data);
    }

    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.categoryId) {
      httpParams = httpParams.set('categoryId', params.categoryId.toString());
    }
    if (params.minPrice) {
      httpParams = httpParams.set('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice) {
      httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
    }
    if (params.brandIds) {
      httpParams = httpParams.set('brandIds', params.brandIds);
    }

    return this.http.get<ProductListResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap(response => {
        this.listCache.set(cacheKey, { data: response, timestamp: Date.now() });
      })
    );
  }

  /**
   * @description Fetches detailed product information by slug
   * @param slug - URL-friendly product identifier
   * @returns Observable of ProductDetailResponse with full product data
   *
   * @example
   * this.productService.getProductBySlug('damascus-steel-knife')
   *   .subscribe(product => console.log(product.nameEn, product.pricing));
   */
  getProductBySlug(slug: string): Observable<ProductDetailResponse> {
    const cached = this.detailCache.get(slug);

    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return of(cached.data);
    }

    return this.http.get<ProductDetailResponse>(`${this.apiUrl}/${slug}`).pipe(
      tap(response => {
        this.detailCache.set(slug, { data: response, timestamp: Date.now() });
      })
    );
  }

  /**
   * @description Fetches search suggestions for autocomplete
   * @param query - Search query string
   * @returns Observable with array of suggestions (products and categories)
   *
   * @example
   * this.productService.getSearchSuggestions('damascus')
   *   .subscribe(response => console.log(response.suggestions));
   */
  /**
   * @description Fetches active variants for a product by ID
   * @param productId - Numeric product ID
   * @returns Observable with data array of variants
   */
  getVariantsByProduct(productId: number): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/${productId}/variants`);
  }

  /**
   * @description Fetches variant option groups enriched with Arabic names and color hex
   * @param productId - Numeric product ID
   * @returns Observable with data array of VariantOptionGroup
   */
  getVariantOptions(productId: number): Observable<{ data: VariantOptionGroup[] }> {
    return this.http.get<{ data: VariantOptionGroup[] }>(
      `${this.apiUrl}/${productId}/variants/options`
    );
  }

  getSearchSuggestions(query: string): Observable<{ suggestions: SearchSuggestionItem[] }> {
    const httpParams = new HttpParams().set('q', query);
    return this.http.get<{ suggestions: SearchSuggestionItem[] }>(
      `${this.apiUrl}/suggestions`,
      { params: httpParams }
    );
  }

  /**
   * @description Clears all caches. Call when product data may have changed (e.g., after add to cart).
   */
  clearCache(): void {
    this.listCache.clear();
    this.detailCache.clear();
  }
}

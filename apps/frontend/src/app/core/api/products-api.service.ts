import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../../shared/interfaces/product.interface';

/**
 * Products API Service
 *
 * Handles HTTP communication with the NestJS backend for product operations.
 * Connects to the souqsyria-backend MySQL database.
 *
 * Backend Endpoints:
 * - GET /api/products - List all products (paginated)
 * - GET /api/products/:id - Get single product by ID
 * - GET /api/products/slug/:slug - Get product by slug
 * - GET /api/products/search?q=query - Search products
 * - GET /api/products/category/:categorySlug - Products by category
 * - GET /api/products/featured - Featured products
 *
 * @swagger
 * tags:
 *   - name: Products API
 *     description: HTTP client for product data from MySQL backend
 */
@Injectable({
  providedIn: 'root'
})
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  /**
   * Get all products with optional filters
   *
   * @param params - Query parameters (page, limit, category, search, etc.)
   * @returns Observable of products array
   *
   * @example
   * this.productsApi.getProducts({ page: 1, limit: 20, featured: true })
   */
  getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }): Observable<Product[]> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<Product[]>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get single product by ID
   *
   * @param id - Product ID
   * @returns Observable of product
   */
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get single product by slug
   *
   * @param slug - Product URL slug
   * @returns Observable of product
   */
  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/slug/${slug}`);
  }

  /**
   * Search products
   *
   * @param query - Search query string
   * @param params - Additional filter parameters
   * @returns Observable of products array
   */
  searchProducts(query: string, params?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<Product[]> {
    let httpParams = new HttpParams().set('q', query);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<Product[]>(`${this.baseUrl}/search`, { params: httpParams });
  }

  /**
   * Get products by category
   *
   * @param categorySlug - Category slug
   * @param params - Pagination and filter parameters
   * @returns Observable of products array
   */
  getProductsByCategory(categorySlug: string, params?: {
    page?: number;
    limit?: number;
  }): Observable<Product[]> {
    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<Product[]>(`${this.baseUrl}/category/${categorySlug}`, { params: httpParams });
  }

  /**
   * Get featured products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of featured products array
   */
  getFeaturedProducts(limit: number = 20): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Product[]>(`${this.baseUrl}/featured`, { params });
  }

  /**
   * Get new arrival products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of new products array
   */
  getNewArrivals(limit: number = 20): Observable<Product[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('sortBy', 'newest');

    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  /**
   * Get best seller products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of best seller products array
   */
  getBestSellers(limit: number = 20): Observable<Product[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('sortBy', 'popularity');

    return this.http.get<Product[]>(this.baseUrl, { params });
  }

  /**
   * Get UNESCO heritage products
   *
   * @param limit - Maximum number of products to return
   * @returns Observable of heritage products array
   */
  getHeritageProducts(limit: number = 20): Observable<Product[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('unesco', 'true');

    return this.http.get<Product[]>(this.baseUrl, { params });
  }
}

/**
 * @file product.service.ts
 * @description Base Product Service for Syrian Marketplace
 *
 * Provides core product-related API operations:
 * - Fetch products with pagination
 * - Get single product details
 * - Search products
 * - Get featured products
 * - Get product categories
 *
 * @swagger
 * components:
 *   schemas:
 *     ProductService:
 *       type: object
 *       description: Base service for managing products in Syrian marketplace
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../interfaces/product.interface';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../interfaces';

/**
 * Base Product Service
 * Handles all product-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class ProductService {
  /** HTTP client for API communication */
  private readonly http = inject(HttpClient);

  /** Base API URL */
  private readonly apiUrl = '/api/v1/products';

  /**
   * Get all products with pagination and filtering
   *
   * @param params Pagination and filter parameters
   * @returns Observable of paginated products
   */
  getProducts(params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.category) httpParams = httpParams.set('category', params.category);
    }

    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get single product by ID
   *
   * @param id Product ID
   * @returns Observable of product
   */
  getProductById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get single product by slug
   *
   * @param slug Product slug
   * @returns Observable of product
   */
  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/slug/${slug}`);
  }

  /**
   * Get featured products
   *
   * @param limit Number of products to fetch
   * @returns Observable of featured products
   */
  getFeaturedProducts(limit: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString()).set('featured', 'true');
    return this.http.get<Product[]>(`${this.apiUrl}/featured`, { params });
  }

  /**
   * Search products
   *
   * @param query Search query string
   * @param params Additional search parameters
   * @returns Observable of search results
   */
  searchProducts(query: string, params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams().set('search', query);

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.category) httpParams = httpParams.set('category', params.category);
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/search`, { params: httpParams });
  }

  /**
   * Get products by category
   *
   * @param categoryId Category ID
   * @param params Pagination parameters
   * @returns Observable of products in category
   */
  getProductsByCategory(categoryId: number | string, params?: PaginationParams): Observable<PaginatedResponse<Product>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.apiUrl}/category/${categoryId}`, { params: httpParams });
  }

  /**
   * Get related products
   *
   * @param productId Product ID
   * @param limit Number of related products
   * @returns Observable of related products
   */
  getRelatedProducts(productId: number | string, limit: number = 5): Observable<Product[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/${productId}/related`, { params });
  }
}

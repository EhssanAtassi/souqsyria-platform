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
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductListResponse } from '../models/product-list.interface';

/**
 * @description Query parameters accepted by the product listing API
 */
export interface ProductQueryParams {
  /** Page number (1-based) */
  page?: number;
  /** Items per page (1-100) */
  limit?: number;
  /** Sort option: price_asc, price_desc, newest, rating */
  sortBy?: string;
  /** Search term for product name (English or Arabic) */
  search?: string;
  /** Filter by category ID */
  categoryId?: number;
  /** Minimum price filter */
  minPrice?: number;
  /** Maximum price filter */
  maxPrice?: number;
}

/**
 * @description Service for communicating with the public products API.
 * Wraps GET /products with typed query parameters and response.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  /** Base URL for the products API endpoint */
  private readonly apiUrl = environment.productApiUrl;

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

    return this.http.get<ProductListResponse>(this.apiUrl, { params: httpParams });
  }
}

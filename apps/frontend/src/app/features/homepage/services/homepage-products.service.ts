/**
 * @file homepage-products.service.ts
 * @description Service for fetching homepage product carousel data
 * Calls GET /products/featured endpoint with different sort parameters
 *
 * @swagger
 * tags:
 *   - name: HomepageProducts
 *     description: Homepage product carousel data fetching (SS-HOME-PRODUCTS)
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ProductListItem,
  ProductListResponse,
} from '../../products/models/product-list.interface';

/**
 * @description Service for loading product carousels on the homepage.
 * Fetches featured products, new arrivals, and best sellers from the backend.
 * Uses the /products/featured endpoint with different sort parameters.
 */
@Injectable({
  providedIn: 'root',
})
export class HomepageProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.productApiUrl;

  /**
   * @description Fetches featured products for homepage carousel
   * Calls GET /products/featured?sort=featured&limit=12
   * @param limit - Maximum number of products to fetch (default: 12)
   * @returns Observable of ProductListItem array
   */
  getFeaturedProducts(limit = 12): Observable<ProductListItem[]> {
    const params = new HttpParams()
      .set('sort', 'featured')
      .set('limit', limit.toString());

    return this.http
      .get<ProductListResponse>(`${this.apiUrl}/featured`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * @description Fetches new arrival products for homepage carousel
   * Calls GET /products/featured?sort=new_arrivals&limit=12
   * @param limit - Maximum number of products to fetch (default: 12)
   * @returns Observable of ProductListItem array
   */
  getNewArrivals(limit = 12): Observable<ProductListItem[]> {
    const params = new HttpParams()
      .set('sort', 'new_arrivals')
      .set('limit', limit.toString());

    return this.http
      .get<ProductListResponse>(`${this.apiUrl}/featured`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * @description Fetches best seller products for homepage carousel
   * Calls GET /products/featured?sort=best_seller&limit=12
   * @param limit - Maximum number of products to fetch (default: 12)
   * @returns Observable of ProductListItem array
   */
  getBestSellers(limit = 12): Observable<ProductListItem[]> {
    const params = new HttpParams()
      .set('sort', 'best_seller')
      .set('limit', limit.toString());

    return this.http
      .get<ProductListResponse>(`${this.apiUrl}/featured`, { params })
      .pipe(map((response) => response.data));
  }
}

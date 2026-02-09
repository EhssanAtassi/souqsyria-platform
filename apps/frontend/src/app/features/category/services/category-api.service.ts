/**
 * Category API Service
 *
 * @description Standalone service for HTTP calls to category backend endpoints.
 * Handles category tree and featured categories data fetching from the API.
 *
 * @pattern Service Layer
 * - HTTP communication with backend API
 * - Environment-based API URL configuration
 * - Observable-based data streaming
 * - Type-safe response handling
 *
 * @swagger
 * components:
 *   schemas:
 *     CategoryApiService:
 *       type: object
 *       description: API service for category data
 *       properties:
 *         apiUrl:
 *           type: string
 *           description: Base API URL from environment
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CategoryTreeResponse,
  FeaturedCategoriesResponse,
  SearchInCategoryResponse,
} from '../models/category-tree.interface';

/**
 * Category API Service
 *
 * @description Handles HTTP requests to category backend endpoints.
 * Provides methods for fetching category tree and featured categories.
 *
 * @injectable
 */
@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  /** HTTP client for API requests */
  private readonly http = inject(HttpClient);

  /** Base API URL from environment configuration */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetch category tree for mega menu
   *
   * @description Retrieves hierarchical 3-level category structure
   * from the backend API for mega menu navigation.
   *
   * @returns Observable of category tree response
   *
   * @example
   * ```typescript
   * this.categoryApi.getTree().subscribe(response => {
   *   console.log('Category tree:', response.data);
   * });
   * ```
   */
  getTree(): Observable<CategoryTreeResponse> {
    return this.http.get<CategoryTreeResponse>(`${this.apiUrl}/categories/tree`);
  }

  /**
   * Fetch featured categories for homepage
   *
   * @description Retrieves featured categories with product counts
   * and display ordering for homepage showcase sections.
   *
   * @param limit - Maximum number of featured categories to return (default: 6)
   * @returns Observable of featured categories response
   *
   * @example
   * ```typescript
   * this.categoryApi.getFeatured(8).subscribe(response => {
   *   console.log('Featured categories:', response.data);
   * });
   * ```
   */
  getFeatured(limit = 6): Observable<FeaturedCategoriesResponse> {
    return this.http.get<FeaturedCategoriesResponse>(
      `${this.apiUrl}/categories/featured`,
      { params: { limit: limit.toString() } }
    );
  }

  /**
   * Search for products within a specific category
   *
   * @description Searches for products within a category by name,
   * returns paginated results with product details.
   *
   * @param categoryId - Category ID to search within
   * @param search - Search query string (product name)
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of results per page (default: 20)
   * @returns Observable of search results with pagination metadata
   *
   * @example
   * ```typescript
   * this.categoryApi.searchInCategory(5, 'laptop', 1, 20).subscribe(response => {
   *   console.log('Search results:', response.data);
   *   console.log('Total results:', response.meta.total);
   * });
   * ```
   */
  searchInCategory(
    categoryId: number,
    search: string,
    page = 1,
    limit = 20
  ): Observable<SearchInCategoryResponse> {
    return this.http.get<SearchInCategoryResponse>(
      `${this.apiUrl}/categories/${categoryId}/products`,
      {
        params: {
          search,
          page: page.toString(),
          limit: limit.toString(),
        },
      }
    );
  }
}

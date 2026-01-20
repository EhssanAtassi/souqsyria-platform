import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Categories API Service
 *
 * Handles HTTP communication with the NestJS backend for category operations.
 * Connects to the souqsyria-backend MySQL database.
 *
 * Backend Endpoints:
 * - GET /api/categories - List all categories
 * - GET /api/categories/:id - Get single category
 * - GET /api/categories/search - Search categories
 * - GET /api/categories/featured - Featured categories
 *
 * @swagger
 * tags:
 *   - name: Categories API
 *     description: HTTP client for category data from MySQL backend
 */
@Injectable({
  providedIn: 'root'
})
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  /**
   * Get all categories
   *
   * @returns Observable of categories array
   */
  getAllCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  /**
   * Get single category by ID
   *
   * @param id - Category ID
   * @returns Observable of category
   */
  getCategoryById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get category by slug
   *
   * @param slug - Category URL slug
   * @returns Observable of category
   */
  getCategoryBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/slug/${slug}`);
  }

  /**
   * Search categories
   *
   * @param query - Search query string
   * @returns Observable of categories array
   */
  searchCategories(query: string): Observable<any[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<any[]>(`${this.baseUrl}/search`, { params });
  }

  /**
   * Get featured categories
   *
   * @returns Observable of featured categories array
   */
  getFeaturedCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/featured`);
  }

  /**
   * Get category hierarchy (parent-child structure)
   *
   * @param parentId - Parent category ID (optional)
   * @returns Observable of category hierarchy
   */
  getCategoryHierarchy(parentId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (parentId) {
      params = params.set('parentId', parentId);
    }
    return this.http.get<any[]>(`${this.baseUrl}/hierarchy`, { params });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import {
  Route,
  CreateRouteDto,
  UpdateRouteDto,
  LinkPermissionDto,
  QueryRoutesDto,
  RoutePermissionMapping,
  AutoMappingResult,
  CoverageStats,
  PermissionCoverageItem,
  PaginatedResponse,
  ApiResponse
} from '../models';

/**
 * HTTP data service for route management
 * Handles all API communication with the backend routes module
 * Pure data layer - no state management
 */
@Injectable({
  providedIn: 'root'
})
export class RouteDataService {
  /**
   * Base API URL for route management endpoints
   */
  private readonly apiUrl = '/api/admin/routes';

  constructor(private readonly http: HttpClient) {}

  // ============================================================================
  // Route Discovery & CRUD
  // ============================================================================

  /**
   * Trigger route discovery from NestJS metadata
   * Scans all controllers and creates/updates route records
   * @returns Observable with discovered routes
   */
  discoverRoutes(): Observable<ApiResponse<Route[]>> {
    return this.http
      .post<ApiResponse<Route[]>>(`${this.apiUrl}/discover`, {})
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Fetch paginated list of routes with optional filtering
   * @param params Query parameters for filtering, pagination, and sorting
   * @returns Observable with paginated route list
   */
  getRoutes(params?: QueryRoutesDto): Observable<PaginatedResponse<Route>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.method) httpParams = httpParams.set('method', params.method);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.controller) httpParams = httpParams.set('controller', params.controller);
      if (params.permissionId) httpParams = httpParams.set('permissionId', params.permissionId);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http
      .get<PaginatedResponse<Route>>(this.apiUrl, { params: httpParams })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Fetch a single route by ID
   * @param id Route unique identifier
   * @returns Observable with route details
   */
  getRouteById(id: string): Observable<ApiResponse<Route>> {
    return this.http
      .get<ApiResponse<Route>>(`${this.apiUrl}/${id}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new route manually
   * @param dto Route creation data
   * @returns Observable with created route
   */
  createRoute(dto: CreateRouteDto): Observable<ApiResponse<Route>> {
    return this.http
      .post<ApiResponse<Route>>(this.apiUrl, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing route
   * @param id Route ID to update
   * @param dto Update data
   * @returns Observable with updated route
   */
  updateRoute(id: string, dto: UpdateRouteDto): Observable<ApiResponse<Route>> {
    return this.http
      .patch<ApiResponse<Route>>(`${this.apiUrl}/${id}`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Delete a route
   * @param id Route ID to delete
   * @returns Observable with void response
   */
  deleteRoute(id: string): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // ============================================================================
  // Permission Linking Operations
  // ============================================================================

  /**
   * Link a permission to a route
   * @param dto Route and permission IDs
   * @returns Observable with success response
   */
  linkPermission(dto: LinkPermissionDto): Observable<ApiResponse<void>> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/link-permission`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Remove permission from a route
   * @param routeId Route ID to unlink
   * @returns Observable with success response
   */
  unlinkPermission(routeId: string): Observable<ApiResponse<void>> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${routeId}/permission`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Bulk link multiple permissions to routes
   * @param mappings Array of route-permission mappings
   * @returns Observable with count of created mappings
   */
  bulkLinkPermissions(
    mappings: RoutePermissionMapping[]
  ): Observable<ApiResponse<{ created: number }>> {
    return this.http
      .post<ApiResponse<{ created: number }>>(
        `${this.apiUrl}/bulk-link-permissions`,
        { mappings }
      )
      .pipe(
        catchError(this.handleError)
      );
  }

  // ============================================================================
  // Filtered Queries
  // ============================================================================

  /**
   * Get all routes without permission mappings
   * @returns Observable with unmapped routes
   */
  getUnmappedRoutes(): Observable<ApiResponse<Route[]>> {
    return this.http
      .get<ApiResponse<Route[]>>(`${this.apiUrl}/unmapped`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Get all routes assigned to a specific permission
   * @param permissionId Permission unique identifier
   * @returns Observable with routes for this permission
   */
  getRoutesByPermission(permissionId: string): Observable<ApiResponse<Route[]>> {
    return this.http
      .get<ApiResponse<Route[]>>(`${this.apiUrl}/by-permission/${permissionId}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Get all routes in a specific controller
   * @param controller Controller name
   * @returns Observable with controller routes
   */
  getRoutesByController(controller: string): Observable<ApiResponse<Route[]>> {
    const params = new HttpParams().set('controller', controller);
    return this.http
      .get<ApiResponse<Route[]>>(`${this.apiUrl}/by-controller`, { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // ============================================================================
  // Auto-Mapping
  // ============================================================================

  /**
   * Generate AI-powered auto-mapping suggestions
   * Analyzes route patterns and suggests appropriate permissions
   * @returns Observable with auto-mapping results
   */
  generateAutoMappings(): Observable<ApiResponse<AutoMappingResult>> {
    return this.http
      .post<ApiResponse<AutoMappingResult>>(`${this.apiUrl}/auto-map`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // ============================================================================
  // Coverage & Statistics
  // ============================================================================

  /**
   * Get overall coverage statistics
   * @returns Observable with coverage metrics
   */
  getCoverageStats(): Observable<ApiResponse<CoverageStats>> {
    return this.http
      .get<ApiResponse<CoverageStats>>(`${this.apiUrl}/coverage/stats`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Get permission-specific coverage details
   * Shows which permissions protect which routes
   * @returns Observable with permission coverage breakdown
   */
  getPermissionCoverage(): Observable<ApiResponse<PermissionCoverageItem[]>> {
    return this.http
      .get<ApiResponse<PermissionCoverageItem[]>>(`${this.apiUrl}/coverage/permissions`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // ============================================================================
  // Export
  // ============================================================================

  /**
   * Export route configuration to file
   * @param format Export format (json or csv)
   * @returns Observable with file blob
   */
  exportConfiguration(format: 'json' | 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    return this.http
      .get(`${this.apiUrl}/export`, {
        params,
        responseType: 'blob'
      })
      .pipe(
        catchError(this.handleError)
      );
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Centralized error handler for HTTP requests
   * @param error HTTP error response
   * @returns Observable error with formatted message
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.statusText}`;
      }
    }

    console.error('RouteDataService Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

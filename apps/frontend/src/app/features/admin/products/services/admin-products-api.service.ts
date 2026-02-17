/**
 * @file admin-products-api.service.ts
 * @description Service for communicating with backend admin product API endpoints.
 *              Handles CRUD operations, status management, and bulk actions for products
 *              via the /admin/products REST API.
 * @module AdminDashboard/Products/Services
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/**
 * Admin product list item interface
 */
export interface AdminProductListItem {
  id: number;
  nameEn: string;
  nameAr: string;
  sku: string;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: number;
    nameEn: string;
    nameAr: string;
  };
  vendor?: {
    id: number;
    name: string;
  };
  manufacturer?: {
    id: number;
    name: string;
  };
}

/**
 * Paginated response wrapper
 */
export interface AdminPaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Product list query parameters
 */
export interface AdminProductListParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  vendorId?: number;
  isActive?: boolean;
  isPublished?: boolean;
  search?: string;
}

/**
 * Toggle status DTO
 */
export interface ToggleStatusDto {
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Bulk status DTO
 */
export interface BulkStatusDto {
  ids: number[];
  isActive?: boolean;
  isPublished?: boolean;
}

/**
 * Full admin product view
 */
export interface AdminProductView {
  id: number;
  nameEn: string;
  nameAr: string;
  sku: string;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  vendor: any | null;
  category: any | null;
  manufacturer: any | null;
  descriptions: any[];
  images: any[];
  attributes: any[];
  features: any[];
  variants: any[];
  totalStock: number;
  pricing: any | null;
  finalPrice: number | null;
  vendorReceives: number | null;
  meta: {
    variantCount: number;
    imageCount: number;
    langCount: number;
    attributeCount: number;
  };
}

/**
 * Admin Products API Service
 * @description Handles communication with backend admin product endpoints.
 *              This service provides low-level HTTP operations for product management.
 *
 * @example
 * ```typescript
 * // Get paginated products
 * this.adminProductsApi.getProducts({ page: 1, limit: 20, isActive: true })
 *   .subscribe(response => console.log(response.data));
 *
 * // Toggle product status
 * this.adminProductsApi.updateProductStatus(123, { isActive: true, isPublished: true })
 *   .subscribe(() => console.log('Status updated'));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminProductsApiService {
  /**
   * Angular HTTP client
   */
  private readonly http = inject(HttpClient);

  /**
   * Base API URL for admin products
   */
  private readonly apiUrl = `${environment.apiUrl}/admin/products`;

  // =========================================================================
  // PRODUCT LISTING
  // =========================================================================

  /**
   * Get paginated list of products with filters
   * @description Retrieves admin product list with pagination, search, and filtering
   * @param params - Query parameters for filtering and pagination
   * @returns Observable of paginated product response
   *
   * @example
   * ```typescript
   * // Get active products only
   * this.getProducts({ page: 1, limit: 20, isActive: true });
   *
   * // Search products
   * this.getProducts({ search: 'laptop', page: 1 });
   *
   * // Filter by category
   * this.getProducts({ categoryId: 5, isPublished: true });
   * ```
   */
  getProducts(params: AdminProductListParams = {}): Observable<AdminPaginatedResponse<AdminProductListItem>> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.categoryId !== undefined) {
      httpParams = httpParams.set('categoryId', params.categoryId.toString());
    }
    if (params.vendorId !== undefined) {
      httpParams = httpParams.set('vendorId', params.vendorId.toString());
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.isPublished !== undefined) {
      httpParams = httpParams.set('isPublished', params.isPublished.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<AdminPaginatedResponse<AdminProductListItem>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Get single product by ID with full details
   * @description Retrieves complete product information including relations, stock, pricing
   * @param id - Product ID
   * @returns Observable of full product view
   *
   * @example
   * ```typescript
   * this.getProduct(123).subscribe(product => {
   *   console.log(product.nameEn);
   *   console.log(product.totalStock);
   *   console.log(product.pricing);
   * });
   * ```
   */
  getProduct(id: number): Observable<AdminProductView> {
    return this.http.get<AdminProductView>(`${this.apiUrl}/${id}`);
  }

  // =========================================================================
  // STATUS MANAGEMENT
  // =========================================================================

  /**
   * Update product status (active/published)
   * @description Toggles isActive and/or isPublished flags
   * @param id - Product ID
   * @param dto - Status fields to update
   * @returns Observable of update response
   *
   * @example
   * ```typescript
   * // Activate and publish a product
   * this.updateProductStatus(123, { isActive: true, isPublished: true });
   *
   * // Deactivate only
   * this.updateProductStatus(123, { isActive: false });
   * ```
   */
  updateProductStatus(id: number, dto: ToggleStatusDto): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${id}/status`, dto);
  }

  /**
   * Toggle published status for a product
   * @description Convenience method to toggle isPublished
   * @param id - Product ID
   * @param isPublished - New published state
   * @returns Observable of update response
   */
  togglePublished(id: number, isPublished: boolean): Observable<{ message: string }> {
    return this.updateProductStatus(id, { isPublished });
  }

  /**
   * Toggle active status for a product
   * @description Convenience method to toggle isActive
   * @param id - Product ID
   * @param isActive - New active state
   * @returns Observable of update response
   */
  toggleActive(id: number, isActive: boolean): Observable<{ message: string }> {
    return this.updateProductStatus(id, { isActive });
  }

  // =========================================================================
  // BULK OPERATIONS
  // =========================================================================

  /**
   * Bulk update status for multiple products
   * @description Updates isActive/isPublished for multiple products at once
   * @param dto - Bulk status update request
   * @returns Observable of bulk operation result
   *
   * @example
   * ```typescript
   * // Activate multiple products
   * this.bulkUpdateStatus({ ids: [1, 2, 3], isActive: true });
   *
   * // Publish and activate
   * this.bulkUpdateStatus({ ids: [4, 5], isActive: true, isPublished: true });
   * ```
   */
  bulkUpdateStatus(dto: BulkStatusDto): Observable<{ updated: number; message: string }> {
    return this.http.post<{ updated: number; message: string }>(`${this.apiUrl}/bulk-status`, dto);
  }
}

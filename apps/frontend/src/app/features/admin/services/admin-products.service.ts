/**
 * @file admin-products.service.ts
 * @description Service for product management API operations.
 *              Handles product listing, approval workflow, inventory management,
 *              and bulk operations.
 * @module AdminDashboard/Services
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminApiService } from './admin-api.service';
import {
  PaginatedResponse,
  ProductListItem,
  ProductDetails,
  ProductListQuery,
  PendingProductItem,
  ApproveProductRequest,
  RejectProductRequest,
  BulkProductApprovalRequest,
  BulkApprovalResult,
  ProductStatus,
  Category,
  CategoryHierarchy,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  InventoryItem,
  InventorySummary,
  BulkStockUpdateRequest,
  BulkStockUpdateResult
} from '../interfaces';

/**
 * Admin Products Service
 * @description Provides API operations for product management in the admin dashboard.
 *              Supports product listing, approval workflow, inventory tracking,
 *              and bulk operations.
 *
 * @example
 * ```typescript
 * // Get pending products for approval
 * this.productsService.getPendingProducts({ page: 1, limit: 20 })
 *   .subscribe(response => console.log('Pending:', response.items));
 *
 * // Approve a product
 * this.productsService.approveProduct(productId, { notes: 'Approved', featured: true })
 *   .subscribe(() => console.log('Product approved'));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  /**
   * Base API service for HTTP operations
   */
  private readonly api = inject(AdminApiService);

  /**
   * Base endpoint for product management
   */
  private readonly endpoint = 'products';

  // =========================================================================
  // PRODUCT LISTING & DETAILS
  // =========================================================================

  /**
   * Get paginated list of products
   * @description Retrieves products with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Observable of paginated product list
   *
   * @example
   * ```typescript
   * // Get all products
   * this.productsService.getProducts({ page: 1, limit: 20 });
   *
   * // Get products from specific vendor
   * this.productsService.getProducts({ vendorId: 5, approvalStatus: 'approved' });
   *
   * // Get low stock products
   * this.productsService.getProducts({ lowStock: true, sortBy: 'stock', sortOrder: 'asc' });
   * ```
   */
  getProducts(query: ProductListQuery = {}): Observable<PaginatedResponse<ProductListItem>> {
    return this.api.getPaginated<ProductListItem>(this.endpoint, query);
  }

  /**
   * Get product details by ID
   * @description Retrieves complete product information including images, variants, and metrics
   * @param productId - Product ID
   * @returns Observable of product details
   */
  getProductById(productId: number): Observable<ProductDetails> {
    return this.api.get<ProductDetails>(`${this.endpoint}/${productId}`);
  }

  /**
   * Get product statistics summary
   * @description Retrieves aggregated statistics for all products
   * @returns Observable of product statistics
   */
  getProductStatistics(): Observable<{
    total: number;
    active: number;
    inactive: number;
    outOfStock: number;
    pendingApproval: number;
    lowStockCount: number;
    averagePrice: number;
    averageRating: number;
  }> {
    return this.api.get(`${this.endpoint}/statistics`);
  }

  // =========================================================================
  // APPROVAL WORKFLOW
  // =========================================================================

  /**
   * Get products pending approval
   * @description Retrieves list of products awaiting admin approval
   * @param query - Pagination and filter parameters
   * @returns Observable of paginated pending products list
   */
  getPendingProducts(query: {
    page?: number;
    limit?: number;
    vendorId?: number;
    categoryId?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<PaginatedResponse<PendingProductItem>> {
    return this.api.getPaginated<PendingProductItem>(`${this.endpoint}/pending`, query);
  }

  /**
   * Get pending products count
   * @description Retrieves count of products awaiting approval
   * @returns Observable of pending count
   */
  getPendingCount(): Observable<{ count: number }> {
    return this.api.get(`${this.endpoint}/pending/count`);
  }

  /**
   * Approve a product
   * @description Approves a product for listing on the marketplace
   * @param productId - Product ID
   * @param request - Approval request with optional notes and featured flag
   * @returns Observable of updated product details
   *
   * @example
   * ```typescript
   * this.productsService.approveProduct(123, {
   *   notes: 'Quality images and accurate description',
   *   featured: true
   * });
   * ```
   */
  approveProduct(productId: number, request: ApproveProductRequest = {}): Observable<ProductDetails> {
    return this.api.post<ProductDetails>(`${this.endpoint}/${productId}/approve`, request);
  }

  /**
   * Reject a product
   * @description Rejects a product with reason and options for resubmission
   * @param productId - Product ID
   * @param request - Rejection request with reason and issues
   * @returns Observable of updated product details
   *
   * @example
   * ```typescript
   * this.productsService.rejectProduct(123, {
   *   reason: 'Product images do not meet quality standards',
   *   issues: ['low_quality_images', 'missing_dimensions'],
   *   allowResubmission: true
   * });
   * ```
   */
  rejectProduct(productId: number, request: RejectProductRequest): Observable<ProductDetails> {
    return this.api.post<ProductDetails>(`${this.endpoint}/${productId}/reject`, request);
  }

  /**
   * Request product changes
   * @description Requests vendor to make changes before approval
   * @param productId - Product ID
   * @param request - Change request details
   * @returns Observable of updated product details
   */
  requestProductChanges(productId: number, request: {
    changes: string[];
    notes: string;
    deadline?: string;
  }): Observable<ProductDetails> {
    return this.api.post<ProductDetails>(`${this.endpoint}/${productId}/request-changes`, request);
  }

  /**
   * Bulk approve/reject products
   * @description Processes multiple product approvals at once
   * @param request - Bulk approval request
   * @returns Observable of bulk operation result
   *
   * @example
   * ```typescript
   * this.productsService.bulkApproval({
   *   productIds: [1, 2, 3, 4, 5],
   *   action: 'approve',
   *   notifyVendors: true
   * });
   * ```
   */
  bulkApproval(request: BulkProductApprovalRequest): Observable<BulkApprovalResult> {
    return this.api.post<BulkApprovalResult>(`${this.endpoint}/bulk/approval`, request);
  }

  // =========================================================================
  // PRODUCT STATUS MANAGEMENT
  // =========================================================================

  /**
   * Update product status
   * @description Changes product status (active, inactive, discontinued)
   * @param productId - Product ID
   * @param status - New status
   * @param reason - Optional reason for status change
   * @returns Observable of updated product details
   */
  updateProductStatus(
    productId: number,
    status: ProductStatus,
    reason?: string
  ): Observable<ProductDetails> {
    return this.api.patch<ProductDetails>(`${this.endpoint}/${productId}/status`, { status, reason });
  }

  /**
   * Activate a product
   * @description Convenience method to activate a product
   * @param productId - Product ID
   * @returns Observable of updated product details
   */
  activateProduct(productId: number): Observable<ProductDetails> {
    return this.updateProductStatus(productId, 'active');
  }

  /**
   * Deactivate a product
   * @description Convenience method to deactivate a product
   * @param productId - Product ID
   * @param reason - Reason for deactivation
   * @returns Observable of updated product details
   */
  deactivateProduct(productId: number, reason?: string): Observable<ProductDetails> {
    return this.updateProductStatus(productId, 'inactive', reason);
  }

  /**
   * Mark product as featured
   * @description Toggles featured status for a product
   * @param productId - Product ID
   * @param featured - Whether to feature the product
   * @returns Observable of updated product details
   */
  setFeatured(productId: number, featured: boolean): Observable<ProductDetails> {
    return this.api.patch<ProductDetails>(`${this.endpoint}/${productId}/featured`, { featured });
  }

  // =========================================================================
  // INVENTORY MANAGEMENT
  // =========================================================================

  /**
   * Get low stock products
   * @description Retrieves products with stock below threshold
   * @param threshold - Stock threshold (default: 10)
   * @param query - Pagination parameters
   * @returns Observable of paginated low stock products
   */
  getLowStockProducts(threshold = 10, query: {
    page?: number;
    limit?: number;
  } = {}): Observable<PaginatedResponse<ProductListItem>> {
    return this.api.getPaginated<ProductListItem>(`${this.endpoint}/low-stock`, {
      ...query,
      threshold
    });
  }

  /**
   * Get inventory summary
   * @description Retrieves inventory statistics
   * @returns Observable of inventory summary
   */
  getInventorySummary(): Observable<{
    totalProducts: number;
    totalStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    stockByCategory: { categoryId: number; categoryName: string; totalStock: number }[];
    stockByWarehouse: { warehouseId: number; warehouseName: string; totalStock: number }[];
  }> {
    return this.api.get(`${this.endpoint}/inventory/summary`);
  }

  /**
   * Update product stock
   * @description Updates stock quantity for a product
   * @param productId - Product ID
   * @param update - Stock update with quantity and reason
   * @returns Observable of updated product
   */
  updateStock(productId: number, update: {
    quantity: number;
    reason?: string;
  }): Observable<ProductDetails> {
    return this.api.patch<ProductDetails>(`${this.endpoint}/${productId}/stock`, {
      stock: update.quantity,
      reason: update.reason
    });
  }

  /**
   * Bulk update stock (legacy format)
   * @description Updates stock for multiple products using array format
   * @param updates - Array of stock updates
   * @returns Observable of bulk operation result
   */
  bulkUpdateStockLegacy(updates: {
    productId: number;
    stock: number;
    reason?: string;
  }[]): Observable<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: { productId: number; success: boolean; error?: string }[];
  }> {
    return this.api.post(`${this.endpoint}/bulk/stock-legacy`, { updates });
  }

  // =========================================================================
  // CATEGORY MANAGEMENT
  // =========================================================================

  /**
   * Get category tree
   * @description Retrieves hierarchical category structure
   * @returns Observable of category tree
   */
  getCategoryTree(): Observable<{
    id: number;
    nameEn: string;
    nameAr: string;
    slug: string;
    productCount: number;
    children: any[];
  }[]> {
    return this.api.get('categories/tree');
  }

  /**
   * Get all categories
   * @description Retrieves flat list or hierarchical categories
   * @param options - Optional parameters for category retrieval
   * @returns Observable of category response
   */
  getCategories(options?: {
    includeInactive?: boolean;
    flat?: boolean;
  }): Observable<{ categories: Category[] }> {
    return this.api.get<{ categories: Category[] }>('categories', options);
  }

  /**
   * Get category hierarchy
   * @description Retrieves hierarchical category structure with children
   * @returns Observable of category hierarchy
   */
  getCategoryHierarchy(): Observable<CategoryHierarchy[]> {
    return this.api.get<CategoryHierarchy[]>('categories/hierarchy');
  }

  /**
   * Get category by ID
   * @description Retrieves a single category by ID
   * @param categoryId - Category ID
   * @returns Observable of category details
   */
  getCategoryById(categoryId: number): Observable<Category> {
    return this.api.get<Category>(`categories/${categoryId}`);
  }

  /**
   * Create a new category
   * @description Creates a new product category
   * @param request - Category creation data
   * @returns Observable of created category
   */
  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.api.post<Category>('categories', request);
  }

  /**
   * Update an existing category
   * @description Updates category information
   * @param categoryId - Category ID to update
   * @param request - Category update data
   * @returns Observable of updated category
   */
  updateCategory(categoryId: number, request: UpdateCategoryRequest): Observable<Category> {
    return this.api.patch<Category>(`categories/${categoryId}`, request);
  }

  /**
   * Delete a category
   * @description Deletes a category (if no products assigned)
   * @param categoryId - Category ID to delete
   * @returns Observable of void
   */
  deleteCategory(categoryId: number): Observable<void> {
    return this.api.delete<void>(`categories/${categoryId}`);
  }

  /**
   * Get products by category
   * @description Retrieves products in a specific category
   * @param categoryId - Category ID
   * @param query - Pagination parameters
   * @returns Observable of paginated products
   */
  getProductsByCategory(
    categoryId: number,
    query: ProductListQuery = {}
  ): Observable<PaginatedResponse<ProductListItem>> {
    return this.getProducts({ ...query, categoryId });
  }

  // =========================================================================
  // INVENTORY MANAGEMENT (Extended)
  // =========================================================================

  /**
   * Get inventory list
   * @description Retrieves paginated inventory items with filtering
   * @param query - Pagination and filter parameters
   * @returns Observable of paginated inventory items
   */
  getInventory(query: {
    page?: number;
    limit?: number;
    search?: string;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
    categoryId?: number;
    vendorId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<PaginatedResponse<InventoryItem>> {
    return this.api.getPaginated<InventoryItem>(`${this.endpoint}/inventory`, query);
  }

  /**
   * Bulk update stock
   * @description Updates stock for multiple products at once
   * @param request - Bulk stock update request
   * @returns Observable of bulk operation result
   */
  bulkStockUpdate(request: {
    productIds: number[];
    adjustmentType: 'add' | 'remove' | 'set';
    quantity: number;
    reason?: string;
  }): Observable<BulkStockUpdateResult> {
    return this.api.post<BulkStockUpdateResult>(`${this.endpoint}/bulk/stock`, request);
  }

  /**
   * Export inventory data
   * @description Generates downloadable export of inventory data
   * @param options - Export options including format and filters
   * @returns Observable of export file blob
   */
  exportInventory(options: {
    format: 'csv' | 'xlsx';
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
    categoryId?: number;
    vendorId?: number;
  }): Observable<Blob> {
    return this.api.downloadFile(`${this.endpoint}/inventory/export`, options);
  }

  // =========================================================================
  // EXPORT & REPORTS
  // =========================================================================

  /**
   * Export products to file
   * @description Generates downloadable export of product data
   * @param format - Export format (csv, xlsx)
   * @param query - Filter query to determine which products to export
   * @returns Observable of export file blob
   */
  exportProducts(format: 'csv' | 'xlsx', query: ProductListQuery = {}): Observable<Blob> {
    return this.api.downloadFile(`${this.endpoint}/export`, {
      ...query,
      format
    });
  }

  /**
   * Get product performance report
   * @description Retrieves sales performance data for products
   * @param query - Date range and filter parameters
   * @returns Observable of product performance data
   */
  getProductPerformance(query: {
    startDate: string;
    endDate: string;
    categoryId?: number;
    vendorId?: number;
    limit?: number;
  }): Observable<{
    topSelling: { productId: number; name: string; unitsSold: number; revenue: number }[];
    topRated: { productId: number; name: string; rating: number; reviewCount: number }[];
    trending: { productId: number; name: string; viewsGrowth: number; salesGrowth: number }[];
  }> {
    return this.api.get(`${this.endpoint}/performance`, query);
  }
}

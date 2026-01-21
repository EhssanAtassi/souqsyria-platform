/**
 * @file admin-orders.service.ts
 * @description Service for order management API operations.
 *              Handles order listing, status updates, refund processing,
 *              and order analytics.
 * @module AdminDashboard/Services
 */

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdminApiService } from './admin-api.service';
import {
  PaginatedResponse,
  OrderListItem,
  OrderDetails,
  OrderListQuery,
  UpdateOrderStatusRequest,
  ProcessRefundRequest,
  CancelOrderRequest,
  RefundRequestItem,
  OrderStatus
} from '../interfaces';

/**
 * Admin Orders Service
 * @description Provides API operations for order management in the admin dashboard.
 *              Supports order listing, status management, refund processing,
 *              and shipping coordination.
 *
 * @example
 * ```typescript
 * // Get orders with filters
 * this.ordersService.getOrders({ status: 'processing', page: 1, limit: 20 })
 *   .subscribe(response => console.log('Orders:', response.items));
 *
 * // Update order status
 * this.ordersService.updateOrderStatus(orderId, {
 *   status: 'shipped',
 *   trackingNumber: 'TRK123456'
 * }).subscribe(() => console.log('Order updated'));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  /**
   * Base API service for HTTP operations
   */
  private readonly api = inject(AdminApiService);

  /**
   * Base endpoint for order management
   */
  private readonly endpoint = 'orders';

  // =========================================================================
  // ORDER LISTING & DETAILS
  // =========================================================================

  /**
   * Get paginated list of orders
   * @description Retrieves orders with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Observable of paginated order list
   *
   * @example
   * ```typescript
   * // Get pending orders
   * this.ordersService.getOrders({ status: 'pending', page: 1, limit: 20 });
   *
   * // Get orders by date range
   * this.ordersService.getOrders({
   *   dateFrom: '2024-01-01',
   *   dateTo: '2024-01-31',
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  getOrders(query: OrderListQuery = {}): Observable<PaginatedResponse<OrderListItem>> {
    return this.api.getPaginated<OrderListItem>(this.endpoint, query);
  }

  /**
   * Get order details by ID
   * @description Retrieves complete order information including items and timeline
   * @param orderId - Order ID
   * @returns Observable of order details
   */
  getOrderById(orderId: number): Observable<OrderDetails> {
    return this.api.get<OrderDetails>(`${this.endpoint}/${orderId}`);
  }

  /**
   * Get order by order number
   * @description Retrieves order using the human-readable order number
   * @param orderNumber - Order number (e.g., 'ORD-2024-001234')
   * @returns Observable of order details
   */
  getOrderByNumber(orderNumber: string): Observable<OrderDetails> {
    return this.api.get<OrderDetails>(`${this.endpoint}/number/${orderNumber}`);
  }

  /**
   * Get order statistics summary
   * @description Retrieves aggregated statistics for orders
   * @returns Observable of order statistics
   */
  getOrderStatistics(): Observable<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    totalRevenue: number;
    averageOrderValue: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    return this.api.get(`${this.endpoint}/statistics`);
  }

  // =========================================================================
  // ORDER STATUS MANAGEMENT
  // =========================================================================

  /**
   * Update order status
   * @description Changes order status with optional notes and tracking info
   * @param orderId - Order ID
   * @param request - Status update request
   * @returns Observable of updated order details
   *
   * @example
   * ```typescript
   * // Mark as shipped
   * this.ordersService.updateOrderStatus(123, {
   *   status: 'shipped',
   *   trackingNumber: 'TRK-123456789',
   *   notes: 'Shipped via DHL',
   *   notifyCustomer: true
   * });
   * ```
   */
  updateOrderStatus(orderId: number, request: UpdateOrderStatusRequest): Observable<OrderDetails> {
    return this.api.patch<OrderDetails>(`${this.endpoint}/${orderId}/status`, request);
  }

  /**
   * Confirm an order
   * @description Convenience method to confirm a pending order
   * @param orderId - Order ID
   * @param notes - Optional confirmation notes
   * @returns Observable of updated order details
   */
  confirmOrder(orderId: number, notes?: string): Observable<OrderDetails> {
    return this.updateOrderStatus(orderId, {
      status: 'confirmed',
      notes,
      notifyCustomer: true
    });
  }

  /**
   * Mark order as processing
   * @description Updates order to processing status
   * @param orderId - Order ID
   * @param notes - Optional notes
   * @returns Observable of updated order details
   */
  markAsProcessing(orderId: number, notes?: string): Observable<OrderDetails> {
    return this.updateOrderStatus(orderId, {
      status: 'processing',
      notes,
      notifyCustomer: true
    });
  }

  /**
   * Mark order as shipped
   * @description Updates order to shipped status with tracking info
   * @param orderId - Order ID
   * @param trackingNumber - Shipment tracking number
   * @param notes - Optional shipping notes
   * @returns Observable of updated order details
   */
  markAsShipped(orderId: number, trackingNumber: string, notes?: string): Observable<OrderDetails> {
    return this.updateOrderStatus(orderId, {
      status: 'shipped',
      trackingNumber,
      notes,
      notifyCustomer: true
    });
  }

  /**
   * Mark order as delivered
   * @description Confirms order delivery
   * @param orderId - Order ID
   * @param notes - Optional delivery notes
   * @returns Observable of updated order details
   */
  markAsDelivered(orderId: number, notes?: string): Observable<OrderDetails> {
    return this.updateOrderStatus(orderId, {
      status: 'delivered',
      notes,
      notifyCustomer: true
    });
  }

  /**
   * Cancel an order
   * @description Cancels an order with refund and restock options
   * @param orderId - Order ID
   * @param request - Cancellation request
   * @returns Observable of updated order details
   *
   * @example
   * ```typescript
   * this.ordersService.cancelOrder(123, {
   *   reason: 'Customer requested cancellation',
   *   processRefund: true,
   *   restockItems: true,
   *   notifyCustomer: true
   * });
   * ```
   */
  cancelOrder(orderId: number, request: CancelOrderRequest): Observable<OrderDetails> {
    return this.api.post<OrderDetails>(`${this.endpoint}/${orderId}/cancel`, request);
  }

  // =========================================================================
  // REFUND MANAGEMENT
  // =========================================================================

  /**
   * Get pending refund requests
   * @description Retrieves list of refund requests awaiting processing
   * @param query - Pagination parameters
   * @returns Observable of paginated refund request list
   */
  getPendingRefunds(query: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<PaginatedResponse<RefundRequestItem>> {
    return this.api.getPaginated<RefundRequestItem>('refunds/pending', query);
  }

  /**
   * Get refund request details
   * @description Retrieves detailed refund request information
   * @param refundId - Refund request ID
   * @returns Observable of refund details
   */
  getRefundDetails(refundId: number): Observable<{
    id: number;
    orderId: number;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    requestedAmount: number;
    orderTotal: number;
    reason: string;
    status: string;
    affectedItems: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
    }[];
    supportingDocuments?: { type: string; url: string }[];
    requestedAt: Date;
    reviewHistory: { action: string; timestamp: Date; reviewer?: string; notes?: string }[];
  }> {
    return this.api.get(`refunds/${refundId}`);
  }

  /**
   * Process a refund request
   * @description Approves or rejects a refund request
   * @param refundId - Refund request ID
   * @param request - Refund processing request
   * @returns Observable of operation result
   *
   * @example
   * ```typescript
   * // Approve full refund
   * this.ordersService.processRefund(123, {
   *   decision: 'approve',
   *   reason: 'Product was defective',
   *   restockItems: true,
   *   notifyCustomer: true
   * });
   *
   * // Approve partial refund
   * this.ordersService.processRefund(123, {
   *   decision: 'approve',
   *   amount: 50000,
   *   reason: 'Partial refund for damaged item',
   *   restockItems: false
   * });
   * ```
   */
  processRefund(refundId: number, request: ProcessRefundRequest): Observable<{
    success: boolean;
    message: string;
    refundedAmount?: number;
    transactionId?: string;
  }> {
    return this.api.post(`refunds/${refundId}/process`, request);
  }

  /**
   * Approve a refund
   * @description Convenience method to approve a full refund
   * @param refundId - Refund request ID
   * @param reason - Approval reason
   * @returns Observable of operation result
   */
  approveRefund(refundId: number, reason: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.processRefund(refundId, {
      decision: 'approve',
      reason,
      restockItems: true,
      notifyCustomer: true
    });
  }

  /**
   * Reject a refund
   * @description Convenience method to reject a refund request
   * @param refundId - Refund request ID
   * @param reason - Rejection reason
   * @returns Observable of operation result
   */
  rejectRefund(refundId: number, reason: string): Observable<{
    success: boolean;
    message: string;
  }> {
    return this.processRefund(refundId, {
      decision: 'reject',
      reason,
      notifyCustomer: true
    });
  }

  // =========================================================================
  // ORDER TIMELINE & HISTORY
  // =========================================================================

  /**
   * Get order timeline
   * @description Retrieves status change history for an order
   * @param orderId - Order ID
   * @returns Observable of timeline events
   */
  getOrderTimeline(orderId: number): Observable<{
    id: number;
    status: OrderStatus;
    title: string;
    description?: string;
    timestamp: Date;
    triggeredBy?: string;
  }[]> {
    return this.api.get(`${this.endpoint}/${orderId}/timeline`);
  }

  /**
   * Add note to order
   * @description Adds an internal note to an order
   * @param orderId - Order ID
   * @param note - Note content
   * @param isInternal - Whether note is internal (not visible to customer)
   * @returns Observable of updated order details
   */
  addOrderNote(orderId: number, note: string, isInternal = true): Observable<OrderDetails> {
    return this.api.post<OrderDetails>(`${this.endpoint}/${orderId}/notes`, {
      content: note,
      isInternal
    });
  }

  // =========================================================================
  // SHIPPING & TRACKING
  // =========================================================================

  /**
   * Update tracking information
   * @description Updates shipping tracking details for an order
   * @param orderId - Order ID
   * @param tracking - Tracking information
   * @returns Observable of updated order details
   */
  updateTracking(orderId: number, tracking: {
    carrier: string;
    trackingNumber: string;
    estimatedDelivery?: string;
    trackingUrl?: string;
  }): Observable<OrderDetails> {
    return this.api.patch<OrderDetails>(`${this.endpoint}/${orderId}/tracking`, tracking);
  }

  /**
   * Get shipment status
   * @description Retrieves current shipment status from carrier
   * @param orderId - Order ID
   * @returns Observable of shipment status
   */
  getShipmentStatus(orderId: number): Observable<{
    trackingNumber: string;
    carrier: string;
    status: string;
    estimatedDelivery?: Date;
    lastUpdate: Date;
    events: {
      status: string;
      location: string;
      timestamp: Date;
      description: string;
    }[];
  }> {
    return this.api.get(`${this.endpoint}/${orderId}/shipment-status`);
  }

  // =========================================================================
  // BULK OPERATIONS
  // =========================================================================

  /**
   * Bulk update order status
   * @description Updates status for multiple orders at once
   * @param orderIds - Array of order IDs
   * @param status - New status to apply
   * @param notes - Optional notes
   * @returns Observable of bulk operation result
   */
  bulkUpdateStatus(
    orderIds: number[],
    status: OrderStatus,
    notes?: string
  ): Observable<{
    totalProcessed: number;
    successful: number;
    failed: number;
    results: { orderId: number; success: boolean; error?: string }[];
  }> {
    return this.api.post(`${this.endpoint}/bulk/status`, {
      orderIds,
      status,
      notes
    });
  }

  /**
   * Bulk print shipping labels
   * @description Generates shipping labels for multiple orders
   * @param orderIds - Array of order IDs
   * @returns Observable of label download URL
   */
  bulkPrintLabels(orderIds: number[]): Observable<{
    downloadUrl: string;
    count: number;
  }> {
    return this.api.post(`${this.endpoint}/bulk/labels`, { orderIds });
  }

  // =========================================================================
  // EXPORT & REPORTS
  // =========================================================================

  /**
   * Export orders to file
   * @description Generates downloadable export of order data
   * @param format - Export format (csv, xlsx)
   * @param query - Filter query to determine which orders to export
   * @returns Observable of export file blob
   */
  exportOrders(format: 'csv' | 'xlsx', query: OrderListQuery = {}): Observable<Blob> {
    return this.api.downloadFile(`${this.endpoint}/export`, {
      ...query,
      format
    });
  }

  /**
   * Get order summary by date
   * @description Retrieves daily order summary
   * @param date - Date in YYYY-MM-DD format
   * @returns Observable of daily summary
   */
  getDailySummary(date: string): Observable<{
    date: string;
    totalOrders: number;
    totalRevenue: number;
    ordersByStatus: { status: string; count: number }[];
    ordersByPaymentMethod: { method: string; count: number; revenue: number }[];
    topProducts: { productId: number; name: string; quantity: number; revenue: number }[];
  }> {
    return this.api.get(`${this.endpoint}/summary/daily`, { date });
  }
}

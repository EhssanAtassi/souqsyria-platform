// src/dashboard/interfaces/vendor-metrics.interface.ts

/**
 * Interface: VendorDashboardResponse
 * ------------------------------------------------------------
 * Represents the metrics returned to a vendor-specific dashboard.
 * Includes personal sales KPIs, refund rates, payout summaries,
 * stock alerts, and product-level performance.
 */

export interface VendorDashboardResponse {
  totalSales: number;
  totalOrders: number;
  refundRate: number;
  commissionPaid: number;
  vendorReceives: number;
  lowStockAlerts: number;

  topProducts: Array<{
    productId: number;
    productName: string;
    totalSold: number;
  }>;

  dailySales: Array<{
    date: string;
    amount: number;
  }>;
}

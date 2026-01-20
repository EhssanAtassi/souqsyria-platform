// src/dashboard/interfaces/admin-metrics.interface.ts

/**
 * Interface: DashboardServiceResponse
 * ------------------------------------------------------------
 * Represents the structure of metrics returned to the Admin
 * dashboard, including platform-wide stats like sales, orders,
 * returns, vendor performance, stock alerts, and delivery KPIs.
 */

export interface DashboardServiceResponse {
  totalSales: number;
  totalOrders: number;
  totalRefunds: number;
  refundRate: number;
  averageOrderValue: number;
  lowStockAlerts: number;

  topSellingProducts: Array<{
    productId: number;
    productName: string;
    totalSold: number;
  }>;

  mostActiveVendors: Array<{
    vendorId: number;
    storeName: string;
    orderCount: number;
  }>;

  dailyOrderCounts: Array<{
    date: string;
    count: number;
  }>;
}

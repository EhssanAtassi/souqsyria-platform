/**
 * ------------------------------------------------------------
 * Interface: Common Dashboard Metric Shapes
 * ------------------------------------------------------------
 * This file defines small reusable types for dashboard metrics.
 * These interfaces are shared between Admin and Vendor dashboards,
 * including daily metrics, top products, and top vendors.
 * They are also useful for charts, tables, and future analytics APIs.
 * */

export interface TopProductMetric {
  productId: number;
  productName: string;
  totalSold: number;
}

export interface TopVendorMetric {
  vendorId: number;
  storeName: string;
  orderCount: number;
}

export interface DailyMetric {
  date: string; // format: YYYY-MM-DD
  count?: number; // e.g. order count
  amount?: number; // e.g. revenue
}

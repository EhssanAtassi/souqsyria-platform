/**
 * @file product-analytics.component.ts
 * @description Product Analytics Dashboard component for admin panel.
 *              Displays KPIs, top products, revenue by category, and stock alerts.
 *              Uses signals for reactive state management.
 * @module AdminDashboard/Products/Components
 */

import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { AdminProductsApiService } from '../../services/admin-products-api.service';
import { LanguageService } from '../../../../../shared/services/language.service';

/**
 * KPI metric interface
 * @description Represents a key performance indicator with current and previous values
 */
export interface KpiMetric {
  titleEn: string;
  titleAr: string;
  value: number;
  previousValue: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'number' | 'currency' | 'percentage';
  icon: string;
}

/**
 * Top product item interface
 * @description Product performance metrics for top products table
 */
export interface TopProduct {
  id: number;
  nameEn: string;
  nameAr: string;
  views: number;
  sales: number;
  conversionRate: number;
}

/**
 * Category revenue interface
 * @description Revenue breakdown by category
 */
export interface CategoryRevenue {
  id: number;
  nameEn: string;
  nameAr: string;
  revenue: number;
  percentage: number;
}

/**
 * Stock alert interface
 * @description Product stock status alert
 */
export interface StockAlert {
  id: number;
  nameEn: string;
  nameAr: string;
  sku: string;
  stock: number;
  threshold: number;
  status: 'low' | 'out';
}

/**
 * Product Analytics Dashboard Component
 * @description Displays comprehensive product analytics including KPIs,
 *              top products, revenue breakdown, and inventory alerts.
 *              All data is mock for now with TODO markers for real API integration.
 *
 * @example
 * ```html
 * <app-product-analytics />
 * ```
 */
@Component({
  selector: 'app-product-analytics',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './product-analytics.component.html',
  styleUrls: ['./product-analytics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductAnalyticsComponent implements OnInit {
  /**
   * Admin products API service
   * @description Low-level HTTP service for product data
   */
  private readonly adminProductsApi = inject(AdminProductsApiService);

  /**
   * Language service
   * @description Provides current language and localization helpers
   */
  private readonly languageService = inject(LanguageService);

  /**
   * Current language signal
   * @description 'en' or 'ar' from language service
   */
  readonly language = this.languageService.language;

  /**
   * Loading state
   * @description True while fetching analytics data
   */
  readonly loading = signal<boolean>(false);

  /**
   * Error state
   * @description Contains error message if data fetch fails
   */
  readonly error = signal<string | null>(null);

  // =========================================================================
  // KPI METRICS
  // =========================================================================

  /**
   * KPI metrics signal
   * @description Key performance indicators (Total Products, Revenue, Rating, Low Stock)
   * TODO: Replace with real API call to /admin/products/analytics/kpis
   */
  readonly kpis = signal<KpiMetric[]>([
    {
      titleEn: 'Total Products',
      titleAr: 'إجمالي المنتجات',
      value: 1247,
      previousValue: 1198,
      trend: 'up',
      format: 'number',
      icon: 'box'
    },
    {
      titleEn: 'Total Revenue',
      titleAr: 'إجمالي الإيرادات',
      value: 128450,
      previousValue: 115200,
      trend: 'up',
      format: 'currency',
      icon: 'dollar'
    },
    {
      titleEn: 'Avg. Rating',
      titleAr: 'متوسط التقييم',
      value: 4.3,
      previousValue: 4.1,
      trend: 'up',
      format: 'number',
      icon: 'star'
    },
    {
      titleEn: 'Low Stock Items',
      titleAr: 'منتجات منخفضة المخزون',
      value: 23,
      previousValue: 18,
      trend: 'down',
      format: 'number',
      icon: 'alert'
    }
  ]);

  // =========================================================================
  // TOP PRODUCTS
  // =========================================================================

  /**
   * Top products by views
   * @description Products with highest views, sales, and conversion rates
   * TODO: Replace with real API call to /admin/products/analytics/top-products
   */
  readonly topProducts = signal<TopProduct[]>([
    {
      id: 1,
      nameEn: 'Wireless Headphones Pro',
      nameAr: 'سماعات لاسلكية احترافية',
      views: 2847,
      sales: 156,
      conversionRate: 5.48
    },
    {
      id: 2,
      nameEn: 'Smart Watch Series 5',
      nameAr: 'ساعة ذكية الإصدار 5',
      views: 2301,
      sales: 98,
      conversionRate: 4.26
    },
    {
      id: 3,
      nameEn: 'Laptop Stand Aluminum',
      nameAr: 'حامل لابتوب ألمنيوم',
      views: 1956,
      sales: 134,
      conversionRate: 6.85
    },
    {
      id: 4,
      nameEn: 'USB-C Hub 7-in-1',
      nameAr: 'موزع USB-C 7 في 1',
      views: 1782,
      sales: 87,
      conversionRate: 4.88
    },
    {
      id: 5,
      nameEn: 'Mechanical Keyboard RGB',
      nameAr: 'لوحة مفاتيح ميكانيكية RGB',
      views: 1654,
      sales: 76,
      conversionRate: 4.59
    }
  ]);

  // =========================================================================
  // CATEGORY REVENUE
  // =========================================================================

  /**
   * Revenue breakdown by category
   * @description Categories sorted by revenue with percentage contribution
   * TODO: Replace with real API call to /admin/products/analytics/revenue-by-category
   */
  readonly categoryRevenue = signal<CategoryRevenue[]>([
    {
      id: 1,
      nameEn: 'Electronics',
      nameAr: 'إلكترونيات',
      revenue: 45600,
      percentage: 35.5
    },
    {
      id: 2,
      nameEn: 'Home & Garden',
      nameAr: 'منزل وحديقة',
      revenue: 32400,
      percentage: 25.2
    },
    {
      id: 3,
      nameEn: 'Fashion',
      nameAr: 'أزياء',
      revenue: 28900,
      percentage: 22.5
    },
    {
      id: 4,
      nameEn: 'Sports',
      nameAr: 'رياضة',
      revenue: 14800,
      percentage: 11.5
    },
    {
      id: 5,
      nameEn: 'Books',
      nameAr: 'كتب',
      revenue: 6750,
      percentage: 5.3
    }
  ]);

  /**
   * Total revenue across all categories
   * @description Computed sum of all category revenues
   */
  readonly totalRevenue = computed(() => {
    return this.categoryRevenue().reduce((sum, cat) => sum + cat.revenue, 0);
  });

  // =========================================================================
  // STOCK ALERTS
  // =========================================================================

  /**
   * Stock alerts signal
   * @description Products with low or out-of-stock status
   * TODO: Replace with real API call to /admin/products/analytics/stock-alerts
   */
  readonly stockAlerts = signal<StockAlert[]>([
    {
      id: 101,
      nameEn: 'Wireless Mouse',
      nameAr: 'ماوس لاسلكي',
      sku: 'WM-001',
      stock: 0,
      threshold: 10,
      status: 'out'
    },
    {
      id: 102,
      nameEn: 'HDMI Cable 2m',
      nameAr: 'كابل HDMI 2 متر',
      sku: 'HC-002',
      stock: 3,
      threshold: 15,
      status: 'low'
    },
    {
      id: 103,
      nameEn: 'Phone Case Clear',
      nameAr: 'غطاء هاتف شفاف',
      sku: 'PC-015',
      stock: 5,
      threshold: 20,
      status: 'low'
    },
    {
      id: 104,
      nameEn: 'Screen Protector',
      nameAr: 'واقي شاشة',
      sku: 'SP-008',
      stock: 8,
      threshold: 25,
      status: 'low'
    }
  ]);

  // =========================================================================
  // LIFECYCLE
  // =========================================================================

  /**
   * Component initialization
   * @description Loads analytics data on component mount
   */
  ngOnInit(): void {
    this.loadAnalytics();
  }

  // =========================================================================
  // DATA FETCHING
  // =========================================================================

  /**
   * Load analytics data
   * @description Fetches all analytics data (KPIs, top products, category revenue, stock alerts)
   * TODO: Implement real API calls when backend endpoints are ready
   * @private
   */
  private loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    // TODO: Replace mock data with real API calls:
    //
    // forkJoin({
    //   kpis: this.adminProductsApi.getAnalyticsKpis(),
    //   topProducts: this.adminProductsApi.getTopProducts(),
    //   categoryRevenue: this.adminProductsApi.getCategoryRevenue(),
    //   stockAlerts: this.adminProductsApi.getStockAlerts()
    // }).subscribe({
    //   next: (data) => {
    //     this.kpis.set(data.kpis);
    //     this.topProducts.set(data.topProducts);
    //     this.categoryRevenue.set(data.categoryRevenue);
    //     this.stockAlerts.set(data.stockAlerts);
    //     this.loading.set(false);
    //   },
    //   error: (err) => {
    //     this.error.set('Failed to load analytics data');
    //     this.loading.set(false);
    //   }
    // });

    // Simulate async loading
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Get localized product name
   * @description Returns product name in current language
   * @param product - Product with nameEn and nameAr
   * @returns Localized name
   */
  getProductName(product: { nameEn: string; nameAr: string }): string {
    return this.language() === 'ar' ? product.nameAr : product.nameEn;
  }

  /**
   * Get localized KPI title
   * @description Returns KPI title in current language
   * @param kpi - KPI metric
   * @returns Localized title
   */
  getKpiTitle(kpi: KpiMetric): string {
    return this.language() === 'ar' ? kpi.titleAr : kpi.titleEn;
  }

  /**
   * Get localized category name
   * @description Returns category name in current language
   * @param category - Category with nameEn and nameAr
   * @returns Localized name
   */
  getCategoryName(category: { nameEn: string; nameAr: string }): string {
    return this.language() === 'ar' ? category.nameAr : category.nameEn;
  }

  /**
   * Calculate percentage change
   * @description Calculates percentage difference between current and previous values
   * @param current - Current value
   * @param previous - Previous value
   * @returns Percentage change
   */
  calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get trend icon class
   * @description Returns CSS class for trend indicator
   * @param trend - Trend direction
   * @returns CSS class name
   */
  getTrendClass(trend: 'up' | 'down' | 'neutral'): string {
    return `trend-${trend}`;
  }

  /**
   * Get stock status class
   * @description Returns CSS class for stock status
   * @param status - Stock status
   * @returns CSS class name
   */
  getStockStatusClass(status: 'low' | 'out'): string {
    return `stock-${status}`;
  }
}

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

/**
 * Real-time cart monitoring dashboard for admin
 *
 * Provides comprehensive cart operations monitoring including:
 * - Active cart statistics and trends
 * - Abandoned cart analytics with recovery insights
 * - Performance metrics (response times, error rates)
 * - Security alerts and threat visualization
 * - Cart value analysis and conversion tracking
 *
 * @swagger
 * components:
 *   schemas:
 *     CartMonitorComponent:
 *       type: object
 *       description: Admin cart monitoring dashboard
 *       properties:
 *         activeCartsCount:
 *           type: number
 *           description: Number of currently active shopping carts
 *         abandonedCartsCount:
 *           type: number
 *           description: Number of abandoned carts in last 24h
 *         avgCartValue:
 *           type: number
 *           description: Average cart value in SYP
 *         securityAlerts:
 *           type: array
 *           description: Active security alerts
 */
@Component({
  selector: 'app-cart-monitor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './cart-monitor.component.html',
  styleUrls: ['./cart-monitor.component.scss']
})
export class CartMonitorComponent implements OnInit, OnDestroy {

  /**
   * Component destroy subject for cleanup
   */
  private destroy$ = new Subject<void>();

  /**
   * API base URL for cart monitoring endpoints
   */
  private readonly API_URL = '/api/admin/cart-monitor';

  /**
   * Real-time refresh interval (30 seconds)
   */
  private readonly REFRESH_INTERVAL_MS = 30000;

  /**
   * Loading state for initial data fetch
   */
  isLoading = signal<boolean>(true);

  /**
   * Active carts count - carts with items modified in last 30 minutes
   */
  activeCartsCount = signal<number>(0);

  /**
   * Abandoned carts count - carts inactive for 24+ hours with items
   */
  abandonedCartsCount = signal<number>(0);

  /**
   * Average cart value in SYP
   */
  avgCartValue = signal<number>(0);

  /**
   * Total cart value across all active carts (SYP)
   */
  totalCartValue = signal<number>(0);

  /**
   * Conversion rate - percentage of carts that completed checkout
   */
  conversionRate = signal<number>(0);

  /**
   * Guest vs authenticated cart ratio
   */
  guestCartPercentage = signal<number>(0);

  /**
   * Security alerts count
   */
  securityAlertsCount = signal<number>(0);

  /**
   * Rate limiting activations count (last hour)
   */
  rateLimitActivations = signal<number>(0);

  /**
   * Fraud detection alerts count (last 24h)
   */
  fraudAlertsCount = signal<number>(0);

  /**
   * Average cart operation response time (ms)
   */
  avgResponseTime = signal<number>(0);

  /**
   * Cart operation error rate (percentage)
   */
  errorRate = signal<number>(0);

  /**
   * Recent cart operations (last 10)
   */
  recentOperations = signal<CartOperation[]>([]);

  /**
   * Top abandoned cart items (products most frequently left in carts)
   */
  topAbandonedItems = signal<AbandonedItem[]>([]);

  /**
   * Security alerts list
   */
  securityAlerts = signal<SecurityAlert[]>([]);

  /**
   * Performance metrics over time (last 24h)
   */
  performanceMetrics = signal<PerformanceMetric[]>([]);

  /**
   * Last update timestamp
   */
  lastUpdateTime = signal<Date>(new Date());

  /**
   * Computed: Overall system health status
   */
  systemHealthStatus = computed(() => {
    const errorRate = this.errorRate();
    const avgResponse = this.avgResponseTime();
    const securityAlerts = this.securityAlertsCount();

    if (errorRate > 5 || avgResponse > 500 || securityAlerts > 10) {
      return { status: 'critical', color: 'warn', icon: 'error' };
    }
    if (errorRate > 2 || avgResponse > 300 || securityAlerts > 5) {
      return { status: 'warning', color: 'accent', icon: 'warning' };
    }
    return { status: 'healthy', color: 'primary', icon: 'check_circle' };
  });

  /**
   * Computed: Cart abandonment rate
   */
  abandonmentRate = computed(() => {
    const total = this.activeCartsCount() + this.abandonedCartsCount();
    if (total === 0) return 0;
    return Math.round((this.abandonedCartsCount() / total) * 100);
  });

  /**
   * Table columns for recent operations
   */
  operationColumns: string[] = ['timestamp', 'userId', 'operation', 'status', 'responseTime'];

  /**
   * Table columns for abandoned items
   */
  abandonedItemColumns: string[] = ['product', 'count', 'totalValue', 'avgTimeInCart'];

  /**
   * Table columns for security alerts
   */
  securityAlertColumns: string[] = ['timestamp', 'type', 'severity', 'userId', 'action'];

  constructor(private http: HttpClient) {}

  /**
   * Component initialization
   * Sets up real-time monitoring with automatic refresh
   */
  ngOnInit(): void {
    console.log('Cart Monitoring Dashboard initializing...');

    // Initial data load
    this.loadMonitoringData();

    // Set up automatic refresh every 30 seconds
    interval(this.REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => this.loadMonitoringData()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads comprehensive monitoring data from backend
   * Fetches statistics, performance metrics, and security alerts
   *
   * @returns Observable of monitoring data
   */
  private loadMonitoringData(): Promise<void> {
    return this.http.get<CartMonitoringData>(`${this.API_URL}/dashboard`)
      .toPromise()
      .then(data => {
        if (!data) return;

        // Update statistics
        this.activeCartsCount.set(data.statistics.activeCartsCount);
        this.abandonedCartsCount.set(data.statistics.abandonedCartsCount);
        this.avgCartValue.set(data.statistics.avgCartValue);
        this.totalCartValue.set(data.statistics.totalCartValue);
        this.conversionRate.set(data.statistics.conversionRate);
        this.guestCartPercentage.set(data.statistics.guestCartPercentage);

        // Update security metrics
        this.securityAlertsCount.set(data.security.alertsCount);
        this.rateLimitActivations.set(data.security.rateLimitActivations);
        this.fraudAlertsCount.set(data.security.fraudAlertsCount);
        this.securityAlerts.set(data.security.alerts);

        // Update performance metrics
        this.avgResponseTime.set(data.performance.avgResponseTime);
        this.errorRate.set(data.performance.errorRate);
        this.performanceMetrics.set(data.performance.metricsOverTime);

        // Update operations and abandoned items
        this.recentOperations.set(data.operations);
        this.topAbandonedItems.set(data.abandonedItems);

        // Update timestamp
        this.lastUpdateTime.set(new Date());
        this.isLoading.set(false);

        console.log('✅ Monitoring data updated successfully');
      })
      .catch(error => {
        console.error('❌ Failed to load monitoring data:', error);
        this.isLoading.set(false);
      });
  }

  /**
   * Manually refreshes monitoring data
   */
  refreshData(): void {
    this.isLoading.set(true);
    this.loadMonitoringData();
  }

  /**
   * Formats currency for display
   *
   * @param amount - Amount in SYP
   * @returns Formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ar-SY', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formats percentage for display
   *
   * @param value - Percentage value
   * @returns Formatted percentage string
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Formats timestamp for display
   *
   * @param date - Date object or ISO string
   * @returns Formatted time string
   */
  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Gets severity color for security alerts
   *
   * @param severity - Alert severity level
   * @returns Material color class
   */
  getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return 'warn';
      case 'high': return 'accent';
      case 'medium': return 'primary';
      default: return 'basic';
    }
  }

  /**
   * Gets operation status icon
   *
   * @param status - Operation status
   * @returns Material icon name
   */
  getOperationIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'blocked': return 'block';
      default: return 'info';
    }
  }

  /**
   * Gets operation status color
   *
   * @param status - Operation status
   * @returns CSS color class
   */
  getOperationStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'blocked': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  }

  /**
   * Navigates to abandoned cart recovery page
   *
   * @param cartId - Cart ID for recovery
   */
  recoverAbandonedCart(cartId: string): void {
    // TODO: Implement abandoned cart recovery workflow
    console.log('Recovering cart:', cartId);
  }

  /**
   * Views details of a security alert
   *
   * @param alert - Security alert object
   */
  viewAlertDetails(alert: SecurityAlert): void {
    // TODO: Open dialog with full alert details
    console.log('Viewing alert:', alert);
  }

  /**
   * Exports monitoring data to CSV
   */
  exportData(): void {
    // TODO: Implement CSV export functionality
    console.log('Exporting monitoring data...');
  }
}

/**
 * Cart monitoring data interface
 */
interface CartMonitoringData {
  statistics: {
    activeCartsCount: number;
    abandonedCartsCount: number;
    avgCartValue: number;
    totalCartValue: number;
    conversionRate: number;
    guestCartPercentage: number;
  };
  security: {
    alertsCount: number;
    rateLimitActivations: number;
    fraudAlertsCount: number;
    alerts: SecurityAlert[];
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    metricsOverTime: PerformanceMetric[];
  };
  operations: CartOperation[];
  abandonedItems: AbandonedItem[];
}

/**
 * Cart operation interface
 */
interface CartOperation {
  id: string;
  timestamp: Date;
  userId: string | null;
  operation: string;
  status: 'success' | 'error' | 'blocked';
  responseTime: number;
  details?: string;
}

/**
 * Abandoned item interface
 */
interface AbandonedItem {
  productId: string;
  productName: string;
  count: number;
  totalValue: number;
  avgTimeInCart: number; // minutes
}

/**
 * Security alert interface
 */
interface SecurityAlert {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  userId: string | null;
  ipAddress: string;
  action: string;
  details: string;
}

/**
 * Performance metric interface
 */
interface PerformanceMetric {
  timestamp: Date;
  avgResponseTime: number;
  errorRate: number;
  throughput: number; // requests per minute
}

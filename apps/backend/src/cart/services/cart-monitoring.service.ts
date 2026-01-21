import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { AuditLog } from '../../audit/entities/audit-log.entity';

/**
 * Cart Monitoring Service
 *
 * Provides comprehensive cart monitoring capabilities including:
 * - Real-time cart statistics and trends
 * - Abandoned cart analytics with recovery insights
 * - Performance metrics (response times, error rates)
 * - Security alert aggregation and analysis
 * - Cart value tracking and conversion analytics
 *
 * @swagger
 * components:
 *   schemas:
 *     CartMonitoringData:
 *       type: object
 *       description: Comprehensive cart monitoring dashboard data
 *       properties:
 *         statistics:
 *           $ref: '#/components/schemas/CartStatistics'
 *         security:
 *           $ref: '#/components/schemas/SecurityMetrics'
 *         performance:
 *           $ref: '#/components/schemas/PerformanceMetrics'
 *         operations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartOperation'
 *         abandonedItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AbandonedItem'
 */
@Injectable()
export class CartMonitoringService {
  private readonly logger = new Logger(CartMonitoringService.name);

  /**
   * Active cart threshold - carts modified in last 30 minutes
   */
  private readonly ACTIVE_CART_THRESHOLD_MINUTES = 30;

  /**
   * Abandoned cart threshold - carts inactive for 24+ hours with items
   */
  private readonly ABANDONED_CART_THRESHOLD_HOURS = 24;

  /**
   * Performance metrics window - last 24 hours
   */
  private readonly METRICS_WINDOW_HOURS = 24;

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  /**
   * Gets comprehensive monitoring dashboard data
   *
   * Aggregates statistics, security alerts, performance metrics,
   * recent operations, and abandoned cart analytics
   *
   * @returns Complete monitoring dashboard data
   */
  async getDashboardData(): Promise<CartMonitoringData> {
    this.logger.log('Fetching cart monitoring dashboard data...');

    const [
      statistics,
      security,
      performance,
      operations,
      abandonedItems,
    ] = await Promise.all([
      this.getCartStatistics(),
      this.getSecurityMetrics(),
      this.getPerformanceMetrics(),
      this.getRecentOperations(),
      this.getTopAbandonedItems(),
    ]);

    this.logger.log('✅ Dashboard data compiled successfully');

    return {
      statistics,
      security,
      performance,
      operations,
      abandonedItems,
    };
  }

  /**
   * Gets cart statistics (active, abandoned, values, conversion)
   *
   * @returns Cart statistics object
   */
  private async getCartStatistics(): Promise<CartStatistics> {
    const now = new Date();
    const activeThreshold = new Date(
      now.getTime() - this.ACTIVE_CART_THRESHOLD_MINUTES * 60 * 1000,
    );
    const abandonedThreshold = new Date(
      now.getTime() - this.ABANDONED_CART_THRESHOLD_HOURS * 60 * 60 * 1000,
    );

    // Active carts - modified in last 30 minutes with items
    const activeCartsCount = await this.cartRepo
      .createQueryBuilder('cart')
      .innerJoin('cart.items', 'items')
      .where('cart.updatedAt >= :activeThreshold', { activeThreshold })
      .getCount();

    // Abandoned carts - not modified in 24+ hours but have items
    const abandonedCartsCount = await this.cartRepo
      .createQueryBuilder('cart')
      .innerJoin('cart.items', 'items')
      .where('cart.updatedAt < :abandonedThreshold', { abandonedThreshold })
      .andWhere('cart.status = :status', { status: 'active' })
      .getCount();

    // Average cart value calculation
    const cartValueResult = await this.cartRepo
      .createQueryBuilder('cart')
      .select('AVG(cart.total)', 'avg')
      .addSelect('SUM(cart.total)', 'sum')
      .where('cart.total > 0')
      .getRawOne();

    const avgCartValue = parseFloat(cartValueResult?.avg || '0');
    const totalCartValue = parseFloat(cartValueResult?.sum || '0');

    // Conversion rate - carts that completed checkout
    const totalCartsWithItems = await this.cartRepo
      .createQueryBuilder('cart')
      .innerJoin('cart.items', 'items')
      .getCount();

    const convertedCarts = await this.cartRepo
      .createQueryBuilder('cart')
      .where('cart.status = :status', { status: 'checked_out' })
      .getCount();

    const conversionRate =
      totalCartsWithItems > 0
        ? (convertedCarts / totalCartsWithItems) * 100
        : 0;

    // Guest vs authenticated ratio
    const guestCarts = await this.cartRepo
      .createQueryBuilder('cart')
      .where('cart.userId IS NULL')
      .getCount();

    const guestCartPercentage =
      totalCartsWithItems > 0 ? (guestCarts / totalCartsWithItems) * 100 : 0;

    return {
      activeCartsCount,
      abandonedCartsCount,
      avgCartValue,
      totalCartValue,
      conversionRate,
      guestCartPercentage,
    };
  }

  /**
   * Gets security metrics (alerts, rate limiting, fraud detection)
   *
   * @returns Security metrics object
   */
  private async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Security alerts count (last 24h)
    const alertsCount = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart_security' })
      .andWhere('audit.action LIKE :action', { action: 'SECURITY_ALERT%' })
      .andWhere('audit.createdAt >= :oneDayAgo', { oneDayAgo })
      .getCount();

    // Rate limiting activations (last hour)
    const rateLimitActivations = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.action = :action', { action: 'RATE_LIMIT_EXCEEDED' })
      .andWhere('audit.createdAt >= :oneHourAgo', { oneHourAgo })
      .getCount();

    // Fraud alerts count (last 24h)
    const fraudAlertsCount = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart_security' })
      .andWhere(
        'audit.action IN (:...actions)',
        {
          actions: [
            'SECURITY_ALERT_VELOCITY',
            'SECURITY_ALERT_QUANTITY',
            'SECURITY_ALERT_PRICE',
            'SECURITY_ALERT_BOT',
          ],
        },
      )
      .andWhere('audit.createdAt >= :oneDayAgo', { oneDayAgo })
      .getCount();

    // Get recent security alerts
    const alerts = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart_security' })
      .andWhere('audit.action LIKE :action', { action: 'SECURITY_ALERT%' })
      .andWhere('audit.createdAt >= :oneDayAgo', { oneDayAgo })
      .orderBy('audit.createdAt', 'DESC')
      .limit(10)
      .getMany();

    const securityAlerts: SecurityAlert[] = alerts.map((alert) => {
      const metadata = alert.metadata as any;
      return {
        id: alert.id,
        timestamp: alert.createdAt,
        type: alert.action.replace('SECURITY_ALERT_', ''),
        severity: this.determineSeverity(metadata?.riskScore || 0),
        userId: alert.actorId || null,
        ipAddress: metadata?.ipAddress || 'Unknown',
        action: alert.description,
        details: metadata?.details || '',
      };
    });

    return {
      alertsCount,
      rateLimitActivations,
      fraudAlertsCount,
      alerts: securityAlerts,
    };
  }

  /**
   * Gets performance metrics (response times, error rates)
   *
   * @returns Performance metrics object
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get cart operations from audit logs
    const operations = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart' })
      .andWhere('audit.createdAt >= :oneDayAgo', { oneDayAgo })
      .getMany();

    if (operations.length === 0) {
      return {
        avgResponseTime: 0,
        errorRate: 0,
        metricsOverTime: [],
      };
    }

    // Calculate average response time
    const responseTimes = operations
      .map((op) => (op.metadata as any)?.responseTime)
      .filter((time) => time !== undefined);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Calculate error rate
    const errorOperations = operations.filter(
      (op) => op.action.includes('ERROR') || (op.metadata as any)?.error,
    );
    const errorRate = (errorOperations.length / operations.length) * 100;

    // Get metrics over time (hourly buckets for last 24h)
    const metricsOverTime = await this.getHourlyMetrics(oneDayAgo);

    return {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 10) / 10,
      metricsOverTime,
    };
  }

  /**
   * Gets recent cart operations
   *
   * @returns Array of recent cart operations
   */
  private async getRecentOperations(): Promise<CartOperation[]> {
    const operations = await this.auditLogRepo
      .createQueryBuilder('audit')
      .where('audit.module = :module', { module: 'cart' })
      .andWhere('audit.action IN (:...actions)', {
        actions: [
          'CART_ITEM_ADDED',
          'CART_ITEM_REMOVED',
          'CART_QUANTITY_UPDATED',
          'CART_CLEARED',
        ],
      })
      .orderBy('audit.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return operations.map((op) => {
      const metadata = op.metadata as any;
      return {
        id: op.id,
        timestamp: op.createdAt,
        userId: op.actorId || null,
        operation: op.action.replace('CART_', '').replace('_', ' '),
        status: metadata?.error ? 'error' : 'success',
        responseTime: metadata?.responseTime || 0,
        details: op.description,
      };
    });
  }

  /**
   * Gets top abandoned cart items
   *
   * @returns Array of most frequently abandoned items
   */
  private async getTopAbandonedItems(): Promise<AbandonedItem[]> {
    const now = new Date();
    const abandonedThreshold = new Date(
      now.getTime() - this.ABANDONED_CART_THRESHOLD_HOURS * 60 * 60 * 1000,
    );

    // Get items from abandoned carts
    const abandonedItems = await this.cartItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.cart', 'cart')
      .innerJoin('item.product', 'product')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('COUNT(item.id)', 'count')
      .addSelect('SUM(item.priceAtAdd * item.quantity)', 'totalValue')
      .where('cart.updatedAt < :abandonedThreshold', { abandonedThreshold })
      .andWhere('cart.status = :status', { status: 'active' })
      .groupBy('product.id')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return abandonedItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      count: parseInt(item.count),
      totalValue: parseFloat(item.totalValue),
      avgTimeInCart: this.ABANDONED_CART_THRESHOLD_HOURS * 60, // Convert to minutes
    }));
  }

  /**
   * Gets hourly performance metrics for the last 24 hours
   *
   * @param startTime - Start time for metrics window
   * @returns Array of hourly performance metrics
   */
  private async getHourlyMetrics(
    startTime: Date,
  ): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    const now = new Date();

    // Generate hourly buckets for last 24h
    for (let i = 0; i < 24; i++) {
      const bucketStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const bucketEnd = new Date(bucketStart.getTime() + 60 * 60 * 1000);

      if (bucketEnd > now) break;

      const operations = await this.auditLogRepo
        .createQueryBuilder('audit')
        .where('audit.module = :module', { module: 'cart' })
        .andWhere('audit.createdAt BETWEEN :start AND :end', {
          start: bucketStart,
          end: bucketEnd,
        })
        .getMany();

      if (operations.length === 0) continue;

      const responseTimes = operations
        .map((op) => (op.metadata as any)?.responseTime)
        .filter((time) => time !== undefined);

      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) /
            responseTimes.length
          : 0;

      const errorOps = operations.filter(
        (op) => op.action.includes('ERROR') || (op.metadata as any)?.error,
      );
      const errorRate = (errorOps.length / operations.length) * 100;

      metrics.push({
        timestamp: bucketStart,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 10) / 10,
        throughput: operations.length, // requests in this hour
      });
    }

    return metrics;
  }

  /**
   * Determines severity level based on risk score
   *
   * @param riskScore - Risk score (0-100)
   * @returns Severity level
   */
  private determineSeverity(
    riskScore: number,
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
}

/**
 * Cart monitoring data interface
 */
export interface CartMonitoringData {
  statistics: CartStatistics;
  security: SecurityMetrics;
  performance: PerformanceMetrics;
  operations: CartOperation[];
  abandonedItems: AbandonedItem[];
}

/**
 * Cart statistics interface
 */
export interface CartStatistics {
  activeCartsCount: number;
  abandonedCartsCount: number;
  avgCartValue: number;
  totalCartValue: number;
  conversionRate: number;
  guestCartPercentage: number;
}

/**
 * Security metrics interface
 */
export interface SecurityMetrics {
  alertsCount: number;
  rateLimitActivations: number;
  fraudAlertsCount: number;
  alerts: SecurityAlert[];
}

/**
 * Security alert interface
 */
export interface SecurityAlert {
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
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  avgResponseTime: number;
  errorRate: number;
  metricsOverTime: PerformanceMetric[];
}

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  timestamp: Date;
  avgResponseTime: number;
  errorRate: number;
  throughput: number;
}

/**
 * Cart operation interface
 */
export interface CartOperation {
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
export interface AbandonedItem {
  productId: string;
  productName: string;
  count: number;
  totalValue: number;
  avgTimeInCart: number;
}

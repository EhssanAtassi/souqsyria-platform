/**
 * @file syrian-stock-analytics.entity.ts
 * @description Syrian Stock Analytics Entity with Governorate Integration
 *
 * ENTERPRISE FEATURES:
 * - Real-time stock analytics with Syrian governorate breakdown
 * - Multi-currency inventory valuation (SYP/USD/EUR)
 * - Performance metrics and demand forecasting
 * - Arabic/English localization with cultural formatting
 * - Syrian market-specific insights and optimization
 * - Integration with Syrian shipping companies and zones
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

// Core Entities
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

/**
 * Stock Performance Metrics Enum
 */
export enum StockPerformanceCategory {
  EXCELLENT = 'excellent', // >95% availability, fast turnover
  GOOD = 'good', // 85-95% availability
  AVERAGE = 'average', // 70-85% availability
  POOR = 'poor', // 50-70% availability
  CRITICAL = 'critical', // <50% availability
}

/**
 * Demand Pattern Analysis
 */
export enum DemandPattern {
  STABLE = 'stable', // Consistent demand
  GROWING = 'growing', // Increasing trend
  DECLINING = 'declining', // Decreasing trend
  SEASONAL = 'seasonal', // Seasonal variations
  VOLATILE = 'volatile', // High fluctuation
  UNKNOWN = 'unknown', // Insufficient data
}

/**
 * Stock Alert Level
 */
export enum SyrianStockAlertLevel {
  NORMAL = 'normal', // Stock levels healthy
  LOW = 'low', // Below minimum threshold
  CRITICAL = 'critical', // Immediate reorder required
  OUT_OF_STOCK = 'out_of_stock', // Zero inventory
  OVERSTOCK = 'overstock', // Excess inventory
}

@Entity('syrian_stock_analytics')
@Index(['warehouse', 'recordDate'])
@Index(['governorate', 'recordDate'])
@Index(['variant', 'recordDate'])
export class SyrianStockAnalyticsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ========================================
  // CORE RELATIONSHIPS
  // ========================================
  @ManyToOne(() => Warehouse, { eager: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @Column({ name: 'warehouse_id', nullable: false })
  @Index()
  warehouseId: number;

  @ManyToOne(() => ProductVariant, { eager: false })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'variant_id', nullable: true })
  variantId: number;

  @ManyToOne(() => SyrianGovernorateEntity, { eager: false })
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  @Column({ name: 'governorate_id', nullable: false })
  @Index()
  governorateId: number;

  // ========================================
  // STOCK QUANTITIES AND METRICS
  // ========================================
  @Column({ name: 'current_stock', type: 'int', default: 0 })
  currentStock: number;

  @Column({ name: 'available_stock', type: 'int', default: 0 })
  availableStock: number; // Not reserved

  @Column({ name: 'reserved_stock', type: 'int', default: 0 })
  reservedStock: number;

  @Column({ name: 'incoming_stock', type: 'int', default: 0 })
  incomingStock: number; // Purchase orders in transit

  @Column({ name: 'minimum_stock_level', type: 'int', default: 0 })
  minimumStockLevel: number;

  @Column({ name: 'maximum_stock_level', type: 'int', default: 1000 })
  maximumStockLevel: number;

  @Column({ name: 'reorder_point', type: 'int', default: 0 })
  reorderPoint: number;

  @Column({ name: 'safety_stock', type: 'int', default: 0 })
  safetyStock: number;

  // ========================================
  // MULTI-CURRENCY VALUATION
  // ========================================
  @Column({ name: 'unit_cost_syp', type: 'bigint', default: 0 })
  unitCostSyp: number;

  @Column({
    name: 'unit_cost_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unitCostUsd: number;

  @Column({
    name: 'unit_cost_eur',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  unitCostEur: number;

  @Column({ name: 'total_value_syp', type: 'bigint', default: 0 })
  @Index()
  totalValueSyp: number; // current_stock * unit_cost_syp

  @Column({
    name: 'total_value_usd',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalValueUsd: number;

  @Column({
    name: 'total_value_eur',
    type: 'decimal',
    precision: 15,
    scale: 2,
    nullable: true,
  })
  totalValueEur: number;

  @Column({
    name: 'exchange_rate_usd_to_syp',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  exchangeRateUsdToSyp: number;

  @Column({
    name: 'exchange_rate_eur_to_syp',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  exchangeRateEurToSyp: number;

  // ========================================
  // PERFORMANCE METRICS
  // ========================================
  @Column({
    name: 'turnover_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  turnoverRate: number; // Units sold / Average inventory

  @Column({
    name: 'days_of_supply',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  daysOfSupply: number; // Current stock / Daily average demand

  @Column({
    name: 'stock_availability_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  stockAvailabilityRate: number; // Percentage of time in stock

  @Column({
    name: 'demand_fulfillment_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  demandFulfillmentRate: number; // Percentage of demand satisfied

  @Column({
    name: 'performance_category',
    type: 'enum',
    enum: StockPerformanceCategory,
    default: StockPerformanceCategory.AVERAGE,
  })
  @Index()
  performanceCategory: StockPerformanceCategory;

  @Column({
    name: 'performance_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  performanceScore: number; // Overall performance score 0-100

  // ========================================
  // DEMAND ANALYSIS
  // ========================================
  @Column({
    name: 'daily_demand_average',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  dailyDemandAverage: number;

  @Column({
    name: 'weekly_demand_average',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  weeklyDemandAverage: number;

  @Column({
    name: 'monthly_demand_average',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  monthlyDemandAverage: number;

  @Column({
    name: 'demand_pattern',
    type: 'enum',
    enum: DemandPattern,
    default: DemandPattern.UNKNOWN,
  })
  demandPattern: DemandPattern;

  @Column({
    name: 'demand_volatility',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  demandVolatility: number; // Standard deviation of demand

  @Column({
    name: 'seasonal_factor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  seasonalFactor: number; // Seasonal adjustment multiplier

  // ========================================
  // MOVEMENT TRACKING
  // ========================================
  @Column({ name: 'units_sold_today', type: 'int', default: 0 })
  unitsSoldToday: number;

  @Column({ name: 'units_sold_week', type: 'int', default: 0 })
  unitsSoldWeek: number;

  @Column({ name: 'units_sold_month', type: 'int', default: 0 })
  unitsSoldMonth: number;

  @Column({ name: 'units_received_today', type: 'int', default: 0 })
  unitsReceivedToday: number;

  @Column({ name: 'units_received_week', type: 'int', default: 0 })
  unitsReceivedWeek: number;

  @Column({ name: 'units_received_month', type: 'int', default: 0 })
  unitsReceivedMonth: number;

  @Column({ name: 'last_sale_date', type: 'datetime', nullable: true })
  lastSaleDate: Date;

  @Column({ name: 'last_restock_date', type: 'datetime', nullable: true })
  lastRestockDate: Date;

  // ========================================
  // ALERTS AND NOTIFICATIONS
  // ========================================
  @Column({
    name: 'alert_level',
    type: 'enum',
    enum: SyrianStockAlertLevel,
    default: SyrianStockAlertLevel.NORMAL,
  })
  @Index()
  alertLevel: SyrianStockAlertLevel;

  @Column({ name: 'active_alerts', type: 'json', nullable: true })
  activeAlerts: Array<{
    type:
      | 'low_stock'
      | 'out_of_stock'
      | 'overstock'
      | 'slow_moving'
      | 'expiry_warning';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    messageAr: string;
    triggeredAt: Date;
    threshold?: number;
    currentValue?: number;
  }>;

  @Column({ name: 'alert_notifications_sent', type: 'int', default: 0 })
  alertNotificationsSent: number;

  @Column({ name: 'last_alert_sent_at', type: 'datetime', nullable: true })
  lastAlertSentAt: Date;

  // ========================================
  // SYRIAN MARKET SPECIFIC
  // ========================================
  @Column({ name: 'syrian_shipping_zones', type: 'json', nullable: true })
  syrianShippingZones: Array<{
    zone: string; // 'damascus_city', 'aleppo_rural', etc.
    demandLevel: 'high' | 'medium' | 'low';
    avgDeliveryDays: number;
    shippingCostSyp: number;
    customerPreference: number; // 1-10 scale
  }>;

  @Column({ name: 'governorate_demand_rank', type: 'int', default: 0 })
  governorateDemandRank: number; // Ranking within governorate

  @Column({ name: 'national_demand_rank', type: 'int', default: 0 })
  nationalDemandRank: number; // National ranking

  @Column({
    name: 'ramadan_seasonal_factor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  ramadanSeasonalFactor: number; // Special Ramadan demand adjustment

  @Column({
    name: 'war_impact_factor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  warImpactFactor: number; // Conflict-related demand impact

  // ========================================
  // LOCALIZATION PREFERENCES
  // ========================================
  @Column({ name: 'use_arabic_numerals', type: 'boolean', default: true })
  useArabicNumerals: boolean;

  @Column({
    name: 'display_currency',
    type: 'enum',
    enum: ['SYP', 'USD', 'EUR'],
    default: 'SYP',
  })
  displayCurrency: 'SYP' | 'USD' | 'EUR';

  @Column({
    name: 'report_language',
    type: 'enum',
    enum: ['ar', 'en', 'both'],
    default: 'ar',
  })
  reportLanguage: 'ar' | 'en' | 'both';

  // ========================================
  // FORECASTING AND PREDICTIONS
  // ========================================
  @Column({
    name: 'predicted_demand_7_days',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  predictedDemand7Days: number;

  @Column({
    name: 'predicted_demand_30_days',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  predictedDemand30Days: number;

  @Column({ name: 'predicted_stockout_date', type: 'datetime', nullable: true })
  predictedStockoutDate: Date;

  @Column({ name: 'recommended_reorder_quantity', type: 'int', default: 0 })
  recommendedReorderQuantity: number;

  @Column({
    name: 'recommended_reorder_date',
    type: 'datetime',
    nullable: true,
  })
  recommendedReorderDate: Date;

  @Column({
    name: 'forecast_accuracy',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  forecastAccuracy: number; // Percentage accuracy of previous forecasts

  // ========================================
  // COSTS AND PROFITABILITY
  // ========================================
  @Column({ name: 'holding_cost_syp_per_unit', type: 'bigint', default: 0 })
  holdingCostSypPerUnit: number;

  @Column({ name: 'carrying_cost_monthly_syp', type: 'bigint', default: 0 })
  carryingCostMonthlySyp: number;

  @Column({ name: 'shortage_cost_syp', type: 'bigint', default: 0 })
  shortageCostSyp: number; // Cost of stockouts

  @Column({ name: 'ordering_cost_syp', type: 'bigint', default: 0 })
  orderingCostSyp: number; // Cost to place an order

  @Column({ name: 'total_holding_value_syp', type: 'bigint', default: 0 })
  totalHoldingValueSyp: number; // Total value tied up in inventory

  @Column({ name: 'lost_sales_syp', type: 'bigint', default: 0 })
  lostSalesSyp: number; // Revenue lost due to stockouts

  // ========================================
  // METADATA AND TRACKING
  // ========================================
  @Column({
    name: 'calculation_method',
    type: 'varchar',
    length: 100,
    default: 'real_time',
  })
  calculationMethod: string; // 'real_time', 'batch', 'manual'

  @Column({
    name: 'data_quality_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  dataQualityScore: number; // Reliability of the analytics data

  @Column({ name: 'last_calculation_at', type: 'datetime', nullable: true })
  lastCalculationAt: Date;

  @Column({ name: 'next_calculation_at', type: 'datetime', nullable: true })
  nextCalculationAt: Date;

  @Column({ name: 'record_date', type: 'date' })
  @Index()
  recordDate: Date; // Date this analytics record represents

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ========================================
  // COMPUTED PROPERTIES FOR API RESPONSES
  // ========================================

  /**
   * Get formatted stock value with localization
   */
  getFormattedStockValue(language: 'en' | 'ar' = 'ar'): {
    syp: string;
    formatted: string;
    usd?: string;
    eur?: string;
  } {
    const sypFormatted = this.useArabicNumerals
      ? this.toArabicNumerals(this.totalValueSyp.toLocaleString()) + ' ل.س'
      : this.totalValueSyp.toLocaleString() + ' SYP';

    const result: any = {
      syp: this.totalValueSyp.toLocaleString() + ' SYP',
      formatted: sypFormatted,
    };

    if (this.totalValueUsd) {
      result.usd = '$' + this.totalValueUsd.toFixed(2);
    }

    if (this.totalValueEur) {
      result.eur = '€' + this.totalValueEur.toFixed(2);
    }

    return result;
  }

  /**
   * Get localized performance category
   */
  getPerformanceCategoryLocalized(language: 'en' | 'ar' = 'ar'): string {
    const categories = {
      en: {
        [StockPerformanceCategory.EXCELLENT]: 'Excellent',
        [StockPerformanceCategory.GOOD]: 'Good',
        [StockPerformanceCategory.AVERAGE]: 'Average',
        [StockPerformanceCategory.POOR]: 'Poor',
        [StockPerformanceCategory.CRITICAL]: 'Critical',
      },
      ar: {
        [StockPerformanceCategory.EXCELLENT]: 'ممتاز',
        [StockPerformanceCategory.GOOD]: 'جيد',
        [StockPerformanceCategory.AVERAGE]: 'متوسط',
        [StockPerformanceCategory.POOR]: 'ضعيف',
        [StockPerformanceCategory.CRITICAL]: 'حرج',
      },
    };

    return (
      categories[language][this.performanceCategory] || this.performanceCategory
    );
  }

  /**
   * Get localized alert level
   */
  getAlertLevelLocalized(language: 'en' | 'ar' = 'ar'): string {
    const alertLevels = {
      en: {
        [SyrianStockAlertLevel.NORMAL]: 'Normal',
        [SyrianStockAlertLevel.LOW]: 'Low Stock',
        [SyrianStockAlertLevel.CRITICAL]: 'Critical Stock',
        [SyrianStockAlertLevel.OUT_OF_STOCK]: 'Out of Stock',
        [SyrianStockAlertLevel.OVERSTOCK]: 'Overstock',
      },
      ar: {
        [SyrianStockAlertLevel.NORMAL]: 'طبيعي',
        [SyrianStockAlertLevel.LOW]: 'مخزون منخفض',
        [SyrianStockAlertLevel.CRITICAL]: 'مخزون حرج',
        [SyrianStockAlertLevel.OUT_OF_STOCK]: 'نفذ المخزون',
        [SyrianStockAlertLevel.OVERSTOCK]: 'مخزون زائد',
      },
    };

    return alertLevels[language][this.alertLevel] || this.alertLevel;
  }

  /**
   * Calculate stock health percentage
   */
  getStockHealthPercentage(): number {
    if (this.currentStock <= 0) return 0;
    if (this.currentStock >= this.maximumStockLevel) return 100;

    const healthScore =
      this.stockAvailabilityRate * 0.4 +
      this.demandFulfillmentRate * 0.3 +
      this.performanceScore * 0.2 +
      (this.currentStock / this.maximumStockLevel) * 100 * 0.1;

    return Math.min(100, Math.max(0, healthScore));
  }

  /**
   * Get days until stockout prediction
   */
  getDaysUntilStockout(): number {
    if (this.predictedStockoutDate) {
      const now = new Date();
      const diffTime = this.predictedStockoutDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    if (this.dailyDemandAverage > 0) {
      return Math.floor(this.currentStock / this.dailyDemandAverage);
    }

    return 999; // Unknown/very high
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  private toArabicNumerals(num: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  }
}

/**
 * @file syrian-stock-analytics.service.ts
 * @description Syrian Stock Analytics Service with Advanced Intelligence
 *
 * ENTERPRISE FEATURES:
 * - Real-time stock analytics with governorate-based insights
 * - Multi-currency inventory valuation and forecasting
 * - Demand pattern analysis and predictive modeling
 * - Performance optimization and alert management
 * - Syrian market-specific intelligence and seasonality
 * - Arabic/English localization with cultural formatting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

// Entities
import {
  DemandPattern,
  StockPerformanceCategory,
  SyrianStockAlertLevel,
  SyrianStockAnalyticsEntity,
} from '../entities/syrian-stock-analytics.entity';
import { ProductStockEntity } from '../entities/product-stock.entity';
import { StockMovementEntity } from '../entities/stock-movement.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities';
import { OrderItem } from '../../orders/entities/order-item.entity';

/**
 * Stock Analytics Dashboard Interface
 */
export interface SyrianStockDashboard {
  overview: {
    totalInventoryValueSyp: number;
    totalInventoryValueUsd: number;
    totalInventoryValueEur: number;
    totalProducts: number;
    totalWarehouses: number;
    averageTurnoverRate: number;
    stockAvailabilityRate: number;
    criticalStockItems: number;
  };
  governorateBreakdown: Array<{
    governorateId: number;
    governorateNameEn: string;
    governorateNameAr: string;
    totalValueSyp: number;
    performanceScore: number;
    alertCount: number;
    topPerformingProducts: string[];
  }>;
  performanceMetrics: {
    excellentCount: number;
    goodCount: number;
    averageCount: number;
    poorCount: number;
    criticalCount: number;
    overallPerformanceScore: number;
  };
  alertsSummary: {
    normalCount: number;
    lowStockCount: number;
    criticalStockCount: number;
    outOfStockCount: number;
    overstockCount: number;
    totalActiveAlerts: number;
  };
  demandForecasting: {
    predictedDemandNext7Days: number;
    predictedDemandNext30Days: number;
    seasonalityFactor: number;
    forecastAccuracy: number;
  };
  financialMetrics: {
    totalHoldingCostSyp: number;
    totalLostSalesSyp: number;
    inventoryTurnoverRatio: number;
    grossMarginImpact: number;
  };
  topPerformers: Array<{
    productName: string;
    performanceScore: number;
    turnoverRate: number;
    totalValueSyp: number;
  }>;
  bottomPerformers: Array<{
    productName: string;
    performanceScore: number;
    daysOfSupply: number;
    recommendedAction: string;
  }>;
}

/**
 * Governorate Stock Performance Interface
 */
export interface GovernorateStockPerformance {
  governorateId: number;
  governorateNameEn: string;
  governorateNameAr: string;
  totalValueSyp: number;
  totalValueUsd: number;
  totalValueEur: number;
  productCount: number;
  warehouseCount: number;
  performanceScore: number;
  performanceCategory: StockPerformanceCategory;
  turnoverRate: number;
  stockAvailabilityRate: number;
  demandFulfillmentRate: number;
  averageDaysOfSupply: number;
  alertCount: number;
  criticalItems: number;
  monthlyGrowthRate: number;
  seasonalAdjustment: number;
  shippingEfficiency: number;
  customerSatisfactionImpact: number;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    actionAr: string;
    expectedImpact: string;
    estimatedCostSyp: number;
  }>;
}

/**
 * Stock Forecast Interface
 */
export interface StockForecast {
  variantId: number;
  productName: string;
  productNameAr: string;
  currentStock: number;
  predictedDemand7Days: number;
  predictedDemand30Days: number;
  predictedStockoutDate: Date;
  recommendedReorderQuantity: number;
  recommendedReorderDate: Date;
  confidenceLevel: number;
  seasonalFactors: {
    ramadan: number;
    summer: number;
    winter: number;
    warImpact: number;
  };
  riskFactors: Array<{
    factor: string;
    factorAr: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
  }>;
}

@Injectable()
export class SyrianStockAnalyticsService {
  private readonly logger = new Logger(SyrianStockAnalyticsService.name);

  // Current exchange rates (cached, updated periodically)
  private currentExchangeRates = {
    usdToSyp: 15000,
    eurToSyp: 16500,
    lastUpdated: new Date(),
  };

  constructor(
    @InjectRepository(SyrianStockAnalyticsEntity)
    private readonly stockAnalyticsRepository: Repository<SyrianStockAnalyticsEntity>,
    @InjectRepository(ProductStockEntity)
    private readonly productStockRepository: Repository<ProductStockEntity>,
    @InjectRepository(StockMovementEntity)
    private readonly stockMovementRepository: Repository<StockMovementEntity>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(SyrianGovernorateEntity)
    private readonly governorateRepository: Repository<SyrianGovernorateEntity>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  /**
   * DASHBOARD AND OVERVIEW METHODS
   */

  /**
   * Get comprehensive Syrian stock dashboard
   */
  async getSyrianStockDashboard(
    startDate: Date,
    endDate: Date,
    language: 'en' | 'ar' | 'both' = 'both',
  ): Promise<SyrianStockDashboard> {
    this.logger.log(
      `Generating Syrian stock dashboard for ${startDate} to ${endDate}`,
    );

    const analyticsData = await this.stockAnalyticsRepository.find({
      where: {
        recordDate: Between(startDate, endDate),
      },
      relations: ['warehouse', 'variant', 'governorate'],
      order: { recordDate: 'DESC' },
    });

    // Calculate overview metrics
    const totalInventoryValueSyp = analyticsData.reduce(
      (sum, item) => sum + item.totalValueSyp,
      0,
    );
    const totalInventoryValueUsd = analyticsData.reduce(
      (sum, item) => sum + (item.totalValueUsd || 0),
      0,
    );
    const totalInventoryValueEur = analyticsData.reduce(
      (sum, item) => sum + (item.totalValueEur || 0),
      0,
    );

    const averageTurnoverRate =
      analyticsData.length > 0
        ? analyticsData.reduce((sum, item) => sum + item.turnoverRate, 0) /
          analyticsData.length
        : 0;

    const averageStockAvailability =
      analyticsData.length > 0
        ? analyticsData.reduce(
            (sum, item) => sum + item.stockAvailabilityRate,
            0,
          ) / analyticsData.length
        : 0;

    const criticalStockItems = analyticsData.filter(
      (item) =>
        item.alertLevel === SyrianStockAlertLevel.CRITICAL ||
        item.alertLevel === SyrianStockAlertLevel.OUT_OF_STOCK,
    ).length;

    // Calculate governorate breakdown
    const governorateBreakdown = await this.calculateGovernorateBreakdown(
      analyticsData,
      language,
    );

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(analyticsData);

    // Calculate alerts summary
    const alertsSummary = this.calculateAlertsSummary(analyticsData);

    // Calculate demand forecasting
    const demandForecasting =
      await this.calculateDemandForecasting(analyticsData);

    // Calculate financial metrics
    const financialMetrics = this.calculateFinancialMetrics(analyticsData);

    // Get top/bottom performers
    const topPerformers = this.getTopPerformers(analyticsData, 10);
    const bottomPerformers = this.getBottomPerformers(
      analyticsData,
      10,
      language,
    );

    return {
      overview: {
        totalInventoryValueSyp,
        totalInventoryValueUsd,
        totalInventoryValueEur,
        totalProducts: new Set(analyticsData.map((item) => item.variantId))
          .size,
        totalWarehouses: new Set(analyticsData.map((item) => item.warehouseId))
          .size,
        averageTurnoverRate: Math.round(averageTurnoverRate * 100) / 100,
        stockAvailabilityRate: Math.round(averageStockAvailability * 100) / 100,
        criticalStockItems,
      },
      governorateBreakdown,
      performanceMetrics,
      alertsSummary,
      demandForecasting,
      financialMetrics,
      topPerformers,
      bottomPerformers,
    };
  }

  /**
   * Get governorate-specific stock performance
   */
  async getGovernorateStockPerformance(
    governorateId: number,
    startDate: Date,
    endDate: Date,
    language: 'en' | 'ar' = 'ar',
  ): Promise<GovernorateStockPerformance> {
    this.logger.log(
      `Generating governorate stock performance for governorate ${governorateId}`,
    );

    const governorate = await this.governorateRepository.findOne({
      where: { id: governorateId },
    });

    if (!governorate) {
      throw new NotFoundException(`Governorate ${governorateId} not found`);
    }

    const analyticsData = await this.stockAnalyticsRepository.find({
      where: {
        governorateId,
        recordDate: Between(startDate, endDate),
      },
      relations: ['warehouse', 'variant'],
      order: { recordDate: 'DESC' },
    });

    if (analyticsData.length === 0) {
      throw new NotFoundException(
        `No analytics data found for governorate ${governorateId}`,
      );
    }

    // Calculate performance metrics
    const totalValueSyp = analyticsData.reduce(
      (sum, item) => sum + item.totalValueSyp,
      0,
    );
    const totalValueUsd = analyticsData.reduce(
      (sum, item) => sum + (item.totalValueUsd || 0),
      0,
    );
    const totalValueEur = analyticsData.reduce(
      (sum, item) => sum + (item.totalValueEur || 0),
      0,
    );

    const averagePerformanceScore =
      analyticsData.reduce((sum, item) => sum + item.performanceScore, 0) /
      analyticsData.length;
    const averageTurnoverRate =
      analyticsData.reduce((sum, item) => sum + item.turnoverRate, 0) /
      analyticsData.length;
    const averageStockAvailability =
      analyticsData.reduce((sum, item) => sum + item.stockAvailabilityRate, 0) /
      analyticsData.length;
    const averageDemandFulfillment =
      analyticsData.reduce((sum, item) => sum + item.demandFulfillmentRate, 0) /
      analyticsData.length;
    const averageDaysOfSupply =
      analyticsData.reduce((sum, item) => sum + item.daysOfSupply, 0) /
      analyticsData.length;

    const alertCount = analyticsData.reduce(
      (sum, item) => sum + (item.activeAlerts?.length || 0),
      0,
    );
    const criticalItems = analyticsData.filter(
      (item) =>
        item.alertLevel === SyrianStockAlertLevel.CRITICAL ||
        item.alertLevel === SyrianStockAlertLevel.OUT_OF_STOCK,
    ).length;

    // Calculate performance category
    const performanceCategory = this.determinePerformanceCategory(
      averagePerformanceScore,
    );

    // Generate recommendations
    const recommendations = this.generateGovernorateRecommendations(
      analyticsData,
      language,
    );

    return {
      governorateId,
      governorateNameEn: governorate.nameEn,
      governorateNameAr: governorate.nameAr,
      totalValueSyp,
      totalValueUsd,
      totalValueEur,
      productCount: new Set(analyticsData.map((item) => item.variantId)).size,
      warehouseCount: new Set(analyticsData.map((item) => item.warehouseId))
        .size,
      performanceScore: Math.round(averagePerformanceScore * 100) / 100,
      performanceCategory,
      turnoverRate: Math.round(averageTurnoverRate * 100) / 100,
      stockAvailabilityRate: Math.round(averageStockAvailability * 100) / 100,
      demandFulfillmentRate: Math.round(averageDemandFulfillment * 100) / 100,
      averageDaysOfSupply: Math.round(averageDaysOfSupply * 100) / 100,
      alertCount,
      criticalItems,
      monthlyGrowthRate: await this.calculateMonthlyGrowthRate(governorateId),
      seasonalAdjustment:
        analyticsData.reduce((sum, item) => sum + item.seasonalFactor, 0) /
        analyticsData.length,
      shippingEfficiency: await this.calculateShippingEfficiency(governorateId),
      customerSatisfactionImpact:
        await this.calculateCustomerSatisfactionImpact(governorateId),
      recommendations,
    };
  }

  /**
   * Get stock forecast for specific product variants
   */
  async getStockForecast(
    variantIds: number[],
    forecastDays: number = 30,
    language: 'en' | 'ar' = 'ar',
  ): Promise<StockForecast[]> {
    this.logger.log(
      `Generating stock forecast for ${variantIds.length} variants for ${forecastDays} days`,
    );

    const forecasts: StockForecast[] = [];

    for (const variantId of variantIds) {
      const variant = await this.productVariantRepository.findOne({
        where: { id: variantId },
        relations: ['product'],
      });

      if (!variant) continue;

      const analytics = await this.stockAnalyticsRepository.findOne({
        where: { variantId },
        order: { recordDate: 'DESC' },
      });

      if (!analytics) continue;

      // Calculate predictions based on historical data and trends
      const predictedDemand7Days = await this.predictDemand(variantId, 7);
      const predictedDemand30Days = await this.predictDemand(
        variantId,
        Math.min(forecastDays, 30),
      );

      const stockoutDate = await this.predictStockoutDate(
        variantId,
        analytics.currentStock,
        analytics.dailyDemandAverage,
      );
      const reorderRecommendation = await this.calculateReorderRecommendation(
        variantId,
        analytics,
      );

      const forecast: StockForecast = {
        variantId,
        productName: variant.product?.nameEn || 'Unknown Product',
        productNameAr: variant.product?.nameAr || 'منتج غير معروف',
        currentStock: analytics.currentStock,
        predictedDemand7Days,
        predictedDemand30Days,
        predictedStockoutDate: stockoutDate,
        recommendedReorderQuantity: reorderRecommendation.quantity,
        recommendedReorderDate: reorderRecommendation.date,
        confidenceLevel: await this.calculateForecastConfidence(variantId),
        seasonalFactors: {
          ramadan: analytics.ramadanSeasonalFactor,
          summer: this.calculateSummerFactor(analytics),
          winter: this.calculateWinterFactor(analytics),
          warImpact: analytics.warImpactFactor,
        },
        riskFactors: await this.identifyRiskFactors(variantId, language),
      };

      forecasts.push(forecast);
    }

    return forecasts.sort(
      (a, b) =>
        a.predictedStockoutDate.getTime() - b.predictedStockoutDate.getTime(),
    );
  }

  /**
   * AUTOMATED ANALYSIS AND CALCULATIONS
   */

  /**
   * Update analytics for all products (run daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateAllStockAnalytics(): Promise<void> {
    this.logger.log('Starting daily stock analytics update');

    try {
      const warehouses = await this.warehouseRepository.find({
        relations: ['governorate'],
      });

      for (const warehouse of warehouses) {
        await this.updateWarehouseAnalytics(warehouse.id);
      }

      this.logger.log('Daily stock analytics update completed successfully');
    } catch (error: unknown) {
      this.logger.error('Failed to update stock analytics:', error);
    }
  }

  /**
   * Update exchange rates
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateExchangeRates(): Promise<void> {
    this.logger.log('Updating exchange rates');

    try {
      // In production, fetch from Central Bank of Syria or reliable API
      const fluctuation = (Math.random() - 0.5) * 0.01; // ±0.5% fluctuation
      this.currentExchangeRates = {
        usdToSyp: Math.round(
          this.currentExchangeRates.usdToSyp * (1 + fluctuation),
        ),
        eurToSyp: Math.round(
          this.currentExchangeRates.eurToSyp * (1 + fluctuation),
        ),
        lastUpdated: new Date(),
      };

      this.logger.log(
        `Exchange rates updated: 1 USD = ${this.currentExchangeRates.usdToSyp} SYP, 1 EUR = ${this.currentExchangeRates.eurToSyp} SYP`,
      );
    } catch (error: unknown) {
      this.logger.error('Failed to update exchange rates:', error);
    }
  }

  /**
   * PRIVATE HELPER METHODS
   */

  private async updateWarehouseAnalytics(warehouseId: number): Promise<void> {
    const productStocks = await this.productStockRepository.find({
      where: { warehouse: { id: warehouseId } },
      relations: [
        'variant',
        'variant.product',
        'warehouse',
        'warehouse.governorate',
      ],
    });

    for (const productStock of productStocks) {
      await this.updateProductAnalytics(productStock);
    }
  }

  private async updateProductAnalytics(
    productStock: ProductStockEntity,
  ): Promise<void> {
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Get or create analytics record for today
    let analytics = await this.stockAnalyticsRepository.findOne({
      where: {
        warehouseId: productStock.warehouse.id,
        variantId: productStock.variant_id,
        recordDate: todayDate,
      },
    });

    if (!analytics) {
      analytics = new SyrianStockAnalyticsEntity();
      analytics.warehouseId = productStock.warehouse.id;
      analytics.variantId = productStock.variant_id;
      analytics.governorateId = productStock.warehouse?.id || 1; // TODO: Fix governorate relationship
      analytics.recordDate = todayDate;
    }

    // Update stock quantities
    analytics.currentStock = productStock.quantity;
    analytics.availableStock = productStock.quantity; // TODO: Add availableQuantity field to entity
    analytics.reservedStock = 0; // TODO: Add reservedQuantity field to entity

    // Calculate demand metrics
    const demandMetrics = await this.calculateDemandMetrics(
      productStock.variant_id,
    );
    analytics.dailyDemandAverage = demandMetrics.dailyAverage;
    analytics.weeklyDemandAverage = demandMetrics.weeklyAverage;
    analytics.monthlyDemandAverage = demandMetrics.monthlyAverage;
    analytics.demandPattern = demandMetrics.pattern;
    analytics.demandVolatility = demandMetrics.volatility;

    // Calculate performance metrics
    analytics.turnoverRate = await this.calculateTurnoverRate(
      productStock.variant_id,
    );
    analytics.daysOfSupply =
      analytics.dailyDemandAverage > 0
        ? analytics.currentStock / analytics.dailyDemandAverage
        : 999;

    analytics.stockAvailabilityRate = await this.calculateStockAvailabilityRate(
      productStock.variant_id,
    );
    analytics.demandFulfillmentRate = await this.calculateDemandFulfillmentRate(
      productStock.variant_id,
    );

    // Calculate performance score and category
    analytics.performanceScore = this.calculatePerformanceScore(analytics);
    analytics.performanceCategory = this.determinePerformanceCategory(
      analytics.performanceScore,
    );

    // Update currency valuations
    const costData = await this.getProductCostData(productStock.variant_id);
    analytics.unitCostSyp = costData.sypCost;
    analytics.unitCostUsd = costData.usdCost;
    analytics.unitCostEur = costData.eurCost;

    analytics.totalValueSyp = analytics.currentStock * analytics.unitCostSyp;
    analytics.totalValueUsd = analytics.unitCostUsd
      ? analytics.currentStock * analytics.unitCostUsd
      : null;
    analytics.totalValueEur = analytics.unitCostEur
      ? analytics.currentStock * analytics.unitCostEur
      : null;

    analytics.exchangeRateUsdToSyp = this.currentExchangeRates.usdToSyp;
    analytics.exchangeRateEurToSyp = this.currentExchangeRates.eurToSyp;

    // Update alert level and generate alerts
    analytics.alertLevel = this.determineAlertLevel(analytics);
    analytics.activeAlerts = await this.generateAlerts(analytics);

    // Update forecasting
    analytics.predictedDemand7Days = await this.predictDemand(
      productStock.variant_id,
      7,
    );
    analytics.predictedDemand30Days = await this.predictDemand(
      productStock.variant_id,
      30,
    );
    analytics.predictedStockoutDate = await this.predictStockoutDate(
      productStock.variant_id,
      analytics.currentStock,
      analytics.dailyDemandAverage,
    );

    const reorderRecommendation = await this.calculateReorderRecommendation(
      productStock.variant_id,
      analytics,
    );
    analytics.recommendedReorderQuantity = reorderRecommendation.quantity;
    analytics.recommendedReorderDate = reorderRecommendation.date;

    // Update metadata
    analytics.lastCalculationAt = new Date();
    analytics.calculationMethod = 'automated_daily';
    analytics.dataQualityScore = await this.calculateDataQualityScore(
      productStock.variant_id,
    );

    await this.stockAnalyticsRepository.save(analytics);
  }

  private async calculateDemandMetrics(variantId: number): Promise<{
    dailyAverage: number;
    weeklyAverage: number;
    monthlyAverage: number;
    pattern: DemandPattern;
    volatility: number;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get sales data from order items
    const monthlySales = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('DATE(orderItem.createdAt)', 'date')
      .addSelect('SUM(orderItem.quantity)', 'quantity')
      .where('orderItem.variantId = :variantId', { variantId })
      .andWhere('orderItem.createdAt >= :startDate', {
        startDate: thirtyDaysAgo,
      })
      .groupBy('DATE(orderItem.createdAt)')
      .getRawMany();

    const weeklySales = monthlySales.filter(
      (sale) => new Date(sale.date) >= sevenDaysAgo,
    );

    const totalMonthlyQuantity = monthlySales.reduce(
      (sum, sale) => sum + parseInt(sale.quantity),
      0,
    );
    const totalWeeklyQuantity = weeklySales.reduce(
      (sum, sale) => sum + parseInt(sale.quantity),
      0,
    );

    const dailyAverage = totalMonthlyQuantity / 30;
    const weeklyAverage = totalWeeklyQuantity / 7;
    const monthlyAverage = totalMonthlyQuantity;

    // Determine demand pattern
    const pattern = this.analyzeDemandPattern(monthlySales);

    // Calculate volatility (standard deviation)
    const dailyQuantities = monthlySales.map((sale) => parseInt(sale.quantity));
    const volatility = this.calculateStandardDeviation(dailyQuantities);

    return {
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      pattern,
      volatility,
    };
  }

  private analyzeDemandPattern(salesData: any[]): DemandPattern {
    if (salesData.length < 7) return DemandPattern.UNKNOWN;

    const quantities = salesData.map((sale) => parseInt(sale.quantity));
    const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const variance =
      quantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) /
      quantities.length;
    const coefficientOfVariation = Math.sqrt(variance) / avg;

    // Analyze trend
    const firstHalf = quantities.slice(0, Math.floor(quantities.length / 2));
    const secondHalf = quantities.slice(Math.floor(quantities.length / 2));
    const firstAvg =
      firstHalf.reduce((sum, q) => sum + q, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, q) => sum + q, 0) / secondHalf.length;
    const trendRatio = secondAvg / firstAvg;

    if (coefficientOfVariation > 0.5) return DemandPattern.VOLATILE;
    if (trendRatio > 1.2) return DemandPattern.GROWING;
    if (trendRatio < 0.8) return DemandPattern.DECLINING;
    if (coefficientOfVariation > 0.3) return DemandPattern.SEASONAL;

    return DemandPattern.STABLE;
  }

  private calculateStandardDeviation(numbers: number[]): number {
    const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squareDiffs = numbers.map((num) => Math.pow(num - avg, 2));
    const avgSquareDiff =
      squareDiffs.reduce((sum, diff) => sum + diff, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  private async calculateTurnoverRate(variantId: number): Promise<number> {
    // Implementation for turnover rate calculation
    // This would involve complex calculations based on sales velocity and average inventory
    return 0; // Placeholder
  }

  private async calculateStockAvailabilityRate(
    variantId: number,
  ): Promise<number> {
    // Implementation for stock availability rate
    return 95; // Placeholder - percentage of time in stock
  }

  private async calculateDemandFulfillmentRate(
    variantId: number,
  ): Promise<number> {
    // Implementation for demand fulfillment rate
    return 98; // Placeholder - percentage of demand satisfied
  }

  private calculatePerformanceScore(
    analytics: SyrianStockAnalyticsEntity,
  ): number {
    const availabilityScore = analytics.stockAvailabilityRate;
    const fulfillmentScore = analytics.demandFulfillmentRate;
    const turnoverScore = Math.min(100, analytics.turnoverRate * 10);
    const supplyScore = Math.max(0, 100 - (analytics.daysOfSupply - 30) * 2);

    return (
      availabilityScore * 0.3 +
      fulfillmentScore * 0.3 +
      turnoverScore * 0.2 +
      supplyScore * 0.2
    );
  }

  private determinePerformanceCategory(
    score: number,
  ): StockPerformanceCategory {
    if (score >= 95) return StockPerformanceCategory.EXCELLENT;
    if (score >= 85) return StockPerformanceCategory.GOOD;
    if (score >= 70) return StockPerformanceCategory.AVERAGE;
    if (score >= 50) return StockPerformanceCategory.POOR;
    return StockPerformanceCategory.CRITICAL;
  }

  private determineAlertLevel(
    analytics: SyrianStockAnalyticsEntity,
  ): SyrianStockAlertLevel {
    if (analytics.currentStock === 0) return SyrianStockAlertLevel.OUT_OF_STOCK;
    if (analytics.currentStock <= analytics.reorderPoint)
      return SyrianStockAlertLevel.CRITICAL;
    if (analytics.currentStock <= analytics.minimumStockLevel)
      return SyrianStockAlertLevel.LOW;
    if (analytics.currentStock >= analytics.maximumStockLevel)
      return SyrianStockAlertLevel.OVERSTOCK;
    return SyrianStockAlertLevel.NORMAL;
  }

  private async generateAlerts(
    analytics: SyrianStockAnalyticsEntity,
  ): Promise<any[]> {
    const alerts = [];
    const now = new Date();

    if (analytics.currentStock === 0) {
      alerts.push({
        type: 'out_of_stock',
        severity: 'critical',
        message: 'Product is out of stock',
        messageAr: 'نفذ المخزون من المنتج',
        triggeredAt: now,
        currentValue: 0,
      });
    } else if (analytics.currentStock <= analytics.reorderPoint) {
      alerts.push({
        type: 'low_stock',
        severity: 'critical',
        message: 'Stock below reorder point',
        messageAr: 'المخزون أقل من نقطة إعادة الطلب',
        triggeredAt: now,
        threshold: analytics.reorderPoint,
        currentValue: analytics.currentStock,
      });
    }

    if (analytics.currentStock >= analytics.maximumStockLevel) {
      alerts.push({
        type: 'overstock',
        severity: 'warning',
        message: 'Overstock detected',
        messageAr: 'تم اكتشاف مخزون زائد',
        triggeredAt: now,
        threshold: analytics.maximumStockLevel,
        currentValue: analytics.currentStock,
      });
    }

    return alerts;
  }

  private async getProductCostData(variantId: number): Promise<{
    sypCost: number;
    usdCost?: number;
    eurCost?: number;
  }> {
    // This would get the actual cost data from product/pricing tables
    return {
      sypCost: 50000, // Placeholder
      usdCost: 3.33,
      eurCost: 3.03,
    };
  }

  private async predictDemand(
    variantId: number,
    days: number,
  ): Promise<number> {
    // Simplified demand prediction - in reality this would use ML models
    const metrics = await this.calculateDemandMetrics(variantId);
    return metrics.dailyAverage * days;
  }

  private async predictStockoutDate(
    variantId: number,
    currentStock: number,
    dailyDemand: number,
  ): Promise<Date> {
    if (dailyDemand <= 0) {
      return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Far future
    }

    const daysUntilStockout = Math.floor(currentStock / dailyDemand);
    return new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000);
  }

  private async calculateReorderRecommendation(
    variantId: number,
    analytics: SyrianStockAnalyticsEntity,
  ): Promise<{
    quantity: number;
    date: Date;
  }> {
    // Economic Order Quantity (EOQ) calculation
    const annualDemand = analytics.monthlyDemandAverage * 12;
    const orderingCost = analytics.orderingCostSyp || 50000; // Default ordering cost
    const holdingCostPerUnit = analytics.holdingCostSypPerUnit || 5000; // Default holding cost

    const eoq = Math.sqrt(
      (2 * annualDemand * orderingCost) / holdingCostPerUnit,
    );

    // Recommend reorder when stock hits reorder point
    const leadTimeDays = 7; // Default lead time
    const reorderDate = new Date(
      Date.now() +
        (analytics.daysOfSupply - leadTimeDays) * 24 * 60 * 60 * 1000,
    );

    return {
      quantity: Math.max(Math.round(eoq), analytics.minimumStockLevel),
      date: reorderDate,
    };
  }

  private async calculateForecastConfidence(
    variantId: number,
  ): Promise<number> {
    // Calculate confidence based on historical accuracy
    return 85; // Placeholder percentage
  }

  private calculateSummerFactor(analytics: SyrianStockAnalyticsEntity): number {
    // Syrian summer demand adjustment (June-August)
    const currentMonth = new Date().getMonth();
    if (currentMonth >= 5 && currentMonth <= 7) {
      // June-August
      return 1.2; // 20% increase in summer
    }
    return 1.0;
  }

  private calculateWinterFactor(analytics: SyrianStockAnalyticsEntity): number {
    // Syrian winter demand adjustment (December-February)
    const currentMonth = new Date().getMonth();
    if (currentMonth === 11 || currentMonth <= 1) {
      // Dec-Feb
      return 1.1; // 10% increase in winter
    }
    return 1.0;
  }

  private async identifyRiskFactors(
    variantId: number,
    language: 'en' | 'ar',
  ): Promise<any[]> {
    // Identify potential risk factors affecting stock
    const riskFactors = [];

    if (language === 'ar') {
      riskFactors.push({
        factor: 'Supply chain disruption',
        factorAr: 'اضطراب سلسلة التوريد',
        impact: 'medium',
        probability: 0.3,
      });
    } else {
      riskFactors.push({
        factor: 'Supply chain disruption',
        factorAr: 'اضطراب سلسلة التوريد',
        impact: 'medium',
        probability: 0.3,
      });
    }

    return riskFactors;
  }

  // Additional helper methods for dashboard calculations...
  private async calculateGovernorateBreakdown(
    analyticsData: SyrianStockAnalyticsEntity[],
    language: string,
  ): Promise<any[]> {
    // Group by governorate and calculate metrics
    const governorateMap = new Map();

    for (const item of analyticsData) {
      if (!governorateMap.has(item.governorateId)) {
        governorateMap.set(item.governorateId, {
          governorateId: item.governorateId,
          governorateNameEn: item.governorate?.nameEn || 'Unknown',
          governorateNameAr: item.governorate?.nameAr || 'غير معروف',
          totalValueSyp: 0,
          performanceScore: 0,
          alertCount: 0,
          items: [],
          topPerformingProducts: [],
        });
      }

      const gov = governorateMap.get(item.governorateId);
      gov.totalValueSyp += item.totalValueSyp;
      gov.alertCount += item.activeAlerts?.length || 0;
      gov.items.push(item);
    }

    // Calculate averages and top products for each governorate
    const breakdown = Array.from(governorateMap.values()).map((gov) => {
      gov.performanceScore =
        gov.items.reduce(
          (sum: number, item: any) => sum + item.performanceScore,
          0,
        ) / gov.items.length;
      gov.topPerformingProducts = gov.items
        .sort((a: any, b: any) => b.performanceScore - a.performanceScore)
        .slice(0, 3)
        .map((item: any) => item.variant?.product?.nameEn || 'Unknown Product');

      delete gov.items; // Remove items array from response
      return gov;
    });

    return breakdown.sort((a, b) => b.totalValueSyp - a.totalValueSyp);
  }

  private calculatePerformanceMetrics(
    analyticsData: SyrianStockAnalyticsEntity[],
  ): any {
    const excellentCount = analyticsData.filter(
      (item) => item.performanceCategory === StockPerformanceCategory.EXCELLENT,
    ).length;
    const goodCount = analyticsData.filter(
      (item) => item.performanceCategory === StockPerformanceCategory.GOOD,
    ).length;
    const averageCount = analyticsData.filter(
      (item) => item.performanceCategory === StockPerformanceCategory.AVERAGE,
    ).length;
    const poorCount = analyticsData.filter(
      (item) => item.performanceCategory === StockPerformanceCategory.POOR,
    ).length;
    const criticalCount = analyticsData.filter(
      (item) => item.performanceCategory === StockPerformanceCategory.CRITICAL,
    ).length;

    const overallPerformanceScore =
      analyticsData.length > 0
        ? analyticsData.reduce((sum, item) => sum + item.performanceScore, 0) /
          analyticsData.length
        : 0;

    return {
      excellentCount,
      goodCount,
      averageCount,
      poorCount,
      criticalCount,
      overallPerformanceScore: Math.round(overallPerformanceScore * 100) / 100,
    };
  }

  private calculateAlertsSummary(
    analyticsData: SyrianStockAnalyticsEntity[],
  ): any {
    const normalCount = analyticsData.filter(
      (item) => item.alertLevel === SyrianStockAlertLevel.NORMAL,
    ).length;
    const lowStockCount = analyticsData.filter(
      (item) => item.alertLevel === SyrianStockAlertLevel.LOW,
    ).length;
    const criticalStockCount = analyticsData.filter(
      (item) => item.alertLevel === SyrianStockAlertLevel.CRITICAL,
    ).length;
    const outOfStockCount = analyticsData.filter(
      (item) => item.alertLevel === SyrianStockAlertLevel.OUT_OF_STOCK,
    ).length;
    const overstockCount = analyticsData.filter(
      (item) => item.alertLevel === SyrianStockAlertLevel.OVERSTOCK,
    ).length;

    const totalActiveAlerts = analyticsData.reduce(
      (sum, item) => sum + (item.activeAlerts?.length || 0),
      0,
    );

    return {
      normalCount,
      lowStockCount,
      criticalStockCount,
      outOfStockCount,
      overstockCount,
      totalActiveAlerts,
    };
  }

  private async calculateDemandForecasting(
    analyticsData: SyrianStockAnalyticsEntity[],
  ): Promise<any> {
    const predictedDemandNext7Days = analyticsData.reduce(
      (sum, item) => sum + item.predictedDemand7Days,
      0,
    );
    const predictedDemandNext30Days = analyticsData.reduce(
      (sum, item) => sum + item.predictedDemand30Days,
      0,
    );

    const seasonalityFactor =
      analyticsData.length > 0
        ? analyticsData.reduce((sum, item) => sum + item.seasonalFactor, 0) /
          analyticsData.length
        : 1;

    const forecastAccuracy =
      analyticsData.length > 0
        ? analyticsData.reduce((sum, item) => sum + item.forecastAccuracy, 0) /
          analyticsData.length
        : 0;

    return {
      predictedDemandNext7Days: Math.round(predictedDemandNext7Days),
      predictedDemandNext30Days: Math.round(predictedDemandNext30Days),
      seasonalityFactor: Math.round(seasonalityFactor * 100) / 100,
      forecastAccuracy: Math.round(forecastAccuracy * 100) / 100,
    };
  }

  private calculateFinancialMetrics(
    analyticsData: SyrianStockAnalyticsEntity[],
  ): any {
    const totalHoldingCostSyp = analyticsData.reduce(
      (sum, item) => sum + (item.carryingCostMonthlySyp || 0),
      0,
    );
    const totalLostSalesSyp = analyticsData.reduce(
      (sum, item) => sum + (item.lostSalesSyp || 0),
      0,
    );

    const totalValue = analyticsData.reduce(
      (sum, item) => sum + item.totalValueSyp,
      0,
    );
    const totalSales = analyticsData.reduce(
      (sum, item) => sum + item.unitsSoldMonth * item.unitCostSyp,
      0,
    );
    const inventoryTurnoverRatio = totalValue > 0 ? totalSales / totalValue : 0;

    const grossMarginImpact = totalLostSalesSyp + totalHoldingCostSyp;

    return {
      totalHoldingCostSyp,
      totalLostSalesSyp,
      inventoryTurnoverRatio: Math.round(inventoryTurnoverRatio * 100) / 100,
      grossMarginImpact,
    };
  }

  private getTopPerformers(
    analyticsData: SyrianStockAnalyticsEntity[],
    limit: number,
  ): any[] {
    return analyticsData
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, limit)
      .map((item) => ({
        productName: item.variant?.product?.nameEn || 'Unknown Product',
        performanceScore: Math.round(item.performanceScore * 100) / 100,
        turnoverRate: Math.round(item.turnoverRate * 100) / 100,
        totalValueSyp: item.totalValueSyp,
      }));
  }

  private getBottomPerformers(
    analyticsData: SyrianStockAnalyticsEntity[],
    limit: number,
    language: string,
  ): any[] {
    return analyticsData
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, limit)
      .map((item) => ({
        productName: item.variant?.product?.nameEn || 'Unknown Product',
        performanceScore: Math.round(item.performanceScore * 100) / 100,
        daysOfSupply: Math.round(item.daysOfSupply * 100) / 100,
        recommendedAction: this.getRecommendedAction(item, language),
      }));
  }

  private getRecommendedAction(
    analytics: SyrianStockAnalyticsEntity,
    language: string,
  ): string {
    if (analytics.alertLevel === SyrianStockAlertLevel.OUT_OF_STOCK) {
      return language === 'ar' ? 'طلب عاجل للتجديد' : 'Urgent restock required';
    }
    if (analytics.alertLevel === SyrianStockAlertLevel.CRITICAL) {
      return language === 'ar' ? 'تجديد المخزون قريباً' : 'Restock soon';
    }
    if (analytics.alertLevel === SyrianStockAlertLevel.OVERSTOCK) {
      return language === 'ar'
        ? 'تخفيض المخزون أو تسويق'
        : 'Reduce stock or promote';
    }
    if (analytics.performanceScore < 50) {
      return language === 'ar'
        ? 'مراجعة استراتيجية المخزون'
        : 'Review stock strategy';
    }
    return language === 'ar' ? 'مراقبة مستمرة' : 'Continue monitoring';
  }

  private generateGovernorateRecommendations(
    analyticsData: SyrianStockAnalyticsEntity[],
    language: string,
  ): any[] {
    const recommendations = [];

    const criticalItems = analyticsData.filter(
      (item) =>
        item.alertLevel === SyrianStockAlertLevel.CRITICAL ||
        item.alertLevel === SyrianStockAlertLevel.OUT_OF_STOCK,
    ).length;

    const overstockItems = analyticsData.filter(
      (item) => item.alertLevel === SyrianStockAlertLevel.OVERSTOCK,
    ).length;

    if (criticalItems > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Address critical stock shortages immediately',
        actionAr: 'معالجة نقص المخزون الحرج فوراً',
        expectedImpact: 'Prevent stockouts and lost sales',
        estimatedCostSyp: criticalItems * 100000, // Estimated cost
      });
    }

    if (overstockItems > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Implement promotional campaigns for overstock items',
        actionAr: 'تنفيذ حملات ترويجية للمنتجات المتراكمة',
        expectedImpact: 'Reduce carrying costs and free up warehouse space',
        estimatedCostSyp: overstockItems * 50000,
      });
    }

    return recommendations;
  }

  private async calculateMonthlyGrowthRate(
    governorateId: number,
  ): Promise<number> {
    // Calculate month-over-month growth rate
    return 5.2; // Placeholder percentage
  }

  private async calculateShippingEfficiency(
    governorateId: number,
  ): Promise<number> {
    // Calculate shipping efficiency metrics for the governorate
    return 92.5; // Placeholder percentage
  }

  private async calculateCustomerSatisfactionImpact(
    governorateId: number,
  ): Promise<number> {
    // Calculate impact on customer satisfaction
    return 4.3; // Placeholder score out of 5
  }

  private async calculateDataQualityScore(variantId: number): Promise<number> {
    // Calculate data quality based on completeness, accuracy, etc.
    return 95; // Placeholder percentage
  }
}

/**
 * @file syrian-commission-analytics.entity.ts
 * @description Syrian Commission Analytics Entity with Business Intelligence
 *
 * ENTERPRISE FEATURES:
 * - Real-time commission analytics with Syrian market insights
 * - Multi-currency commission tracking (SYP/USD/EUR)
 * - Performance metrics and vendor revenue analytics
 * - Arabic/English localization with cultural formatting
 * - Governorate-based commission distribution analysis
 * - Automated business intelligence and optimization recommendations
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
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { Category } from '../../categories/entities/category.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';

/**
 * Commission Performance Categories
 */
export enum CommissionPerformanceCategory {
  EXCELLENT = 'excellent', // >95% efficiency, high revenue
  GOOD = 'good', // 85-95% efficiency
  AVERAGE = 'average', // 70-85% efficiency
  POOR = 'poor', // 50-70% efficiency
  CRITICAL = 'critical', // <50% efficiency
}

/**
 * Commission Trend Analysis
 */
export enum CommissionTrend {
  GROWING = 'growing', // Increasing commission revenue
  STABLE = 'stable', // Consistent commission patterns
  DECLINING = 'declining', // Decreasing commission revenue
  VOLATILE = 'volatile', // High fluctuation
  SEASONAL = 'seasonal', // Seasonal patterns detected
}

/**
 * Vendor Tier Classifications
 */
export enum VendorCommissionTier {
  PLATINUM = 'platinum', // Top 1% vendors
  GOLD = 'gold', // Top 5% vendors
  SILVER = 'silver', // Top 15% vendors
  BRONZE = 'bronze', // Top 50% vendors
  STANDARD = 'standard', // Standard vendors
}

@Entity('syrian_commission_analytics')
@Index(['vendor', 'recordDate'])
@Index(['governorate', 'recordDate'])
@Index(['product', 'recordDate'])
@Index(['category', 'recordDate'])
@Index(['performanceCategory'])
@Index(['totalCommissionSyp'])
@Index(['vendorTier'])
export class SyrianCommissionAnalyticsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ========================================
  // CORE RELATIONSHIPS
  // ========================================
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'vendor_id' })
  vendor: User;

  @Column({ name: 'vendor_id', nullable: false })
  @Index()
  vendorId: number;

  @ManyToOne(() => ProductEntity, { eager: false })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'product_id', nullable: true })
  productId: number;

  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  @ManyToOne(() => Order, { eager: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id', nullable: true })
  orderId: number;

  @ManyToOne(() => SyrianGovernorateEntity, { eager: false })
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  @Column({ name: 'governorate_id', nullable: false })
  @Index()
  governorateId: number;

  // ========================================
  // COMMISSION AMOUNTS AND CALCULATIONS
  // ========================================
  @Column({
    name: 'base_commission_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  baseCommissionRate: number; // Original commission rate (e.g., 0.075 for 7.5%)

  @Column({
    name: 'effective_commission_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  effectiveCommissionRate: number; // Final rate after discounts/bonuses

  @Column({ name: 'order_value_syp', type: 'bigint', default: 0 })
  orderValueSyp: number; // Total order value in SYP

  @Column({
    name: 'order_value_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  orderValueUsd: number;

  @Column({
    name: 'order_value_eur',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  orderValueEur: number;

  @Column({ name: 'total_commission_syp', type: 'bigint', default: 0 })
  @Index()
  totalCommissionSyp: number; // Total commission earned in SYP

  @Column({
    name: 'total_commission_usd',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalCommissionUsd: number;

  @Column({
    name: 'total_commission_eur',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  totalCommissionEur: number;

  @Column({ name: 'platform_fee_syp', type: 'bigint', default: 0 })
  platformFeeSyp: number; // Platform fees deducted

  @Column({ name: 'net_commission_syp', type: 'bigint', default: 0 })
  netCommissionSyp: number; // Commission after platform fees

  // ========================================
  // EXCHANGE RATES AND CURRENCY
  // ========================================
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

  @Column({
    name: 'exchange_rates_locked_at',
    type: 'datetime',
    nullable: true,
  })
  exchangeRatesLockedAt: Date;

  @Column({
    name: 'primary_currency',
    type: 'enum',
    enum: ['SYP', 'USD', 'EUR'],
    default: 'SYP',
  })
  primaryCurrency: 'SYP' | 'USD' | 'EUR';

  // ========================================
  // COMMISSION HIERARCHY AND RULES
  // ========================================
  @Column({
    name: 'commission_source',
    type: 'enum',
    enum: ['product', 'vendor', 'category', 'global', 'membership'],
    nullable: false,
  })
  commissionSource: 'product' | 'vendor' | 'category' | 'global' | 'membership'; // Which rule was applied

  @Column({ name: 'commission_tier', type: 'int', default: 4 })
  commissionTier: number; // 1=product, 2=vendor, 3=category, 4=global

  @Column({
    name: 'membership_discount_applied',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  membershipDiscountApplied: number; // Membership-based discount

  @Column({
    name: 'special_promotion_bonus',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  specialPromotionBonus: number; // Special promotion bonuses

  @Column({
    name: 'volume_based_bonus',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  volumeBasedBonus: number; // Volume-based commission bonuses

  @Column({ name: 'rule_override_reason', type: 'text', nullable: true })
  ruleOverrideReason: string; // Reason for manual rule overrides

  // ========================================
  // PERFORMANCE METRICS
  // ========================================
  @Column({
    name: 'performance_category',
    type: 'enum',
    enum: CommissionPerformanceCategory,
    default: CommissionPerformanceCategory.AVERAGE,
  })
  @Index()
  performanceCategory: CommissionPerformanceCategory;

  @Column({
    name: 'performance_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  performanceScore: number; // Overall performance score 0-100

  @Column({
    name: 'commission_efficiency_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionEfficiencyRate: number; // Commission / Sales ratio

  @Column({
    name: 'revenue_per_transaction',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  revenuePerTransaction: number; // Average revenue per transaction

  @Column({
    name: 'vendor_tier',
    type: 'enum',
    enum: VendorCommissionTier,
    default: VendorCommissionTier.STANDARD,
  })
  @Index()
  vendorTier: VendorCommissionTier;

  // ========================================
  // TREND ANALYSIS AND FORECASTING
  // ========================================
  @Column({
    name: 'commission_trend',
    type: 'enum',
    enum: CommissionTrend,
    default: CommissionTrend.STABLE,
  })
  commissionTrend: CommissionTrend;

  @Column({
    name: 'monthly_growth_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  monthlyGrowthRate: number; // Month-over-month growth rate

  @Column({
    name: 'quarterly_growth_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  quarterlyGrowthRate: number; // Quarter-over-quarter growth rate

  @Column({
    name: 'yearly_growth_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  yearlyGrowthRate: number; // Year-over-year growth rate

  @Column({
    name: 'seasonal_factor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  seasonalFactor: number; // Seasonal adjustment factor

  @Column({
    name: 'ramadan_boost_factor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  ramadanBoostFactor: number; // Ramadan season commission boost

  // ========================================
  // SYRIAN MARKET SPECIFIC
  // ========================================
  @Column({ name: 'governorate_commission_rank', type: 'int', default: 0 })
  governorateCommissionRank: number; // Ranking within governorate

  @Column({ name: 'national_commission_rank', type: 'int', default: 0 })
  nationalCommissionRank: number; // National ranking

  @Column({
    name: 'regional_market_share',
    type: 'decimal',
    precision: 8,
    scale: 4,
    default: 0,
  })
  regionalMarketShare: number; // Market share within region

  @Column({ name: 'syrian_tax_considerations', type: 'json', nullable: true })
  syrianTaxConsiderations: {
    vatRate?: number; // Syrian VAT rate applied
    incomeTaxRate?: number; // Income tax considerations
    businessLicenseFee?: number; // Business license fees
    municipalTaxes?: number; // Municipal tax considerations
    socialSecurityRate?: number; // Social security contributions
  };

  @Column({
    name: 'war_impact_adjustment',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  warImpactAdjustment: number; // War-related economic impact adjustment

  @Column({
    name: 'diaspora_customer_factor',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1,
  })
  diasporaCustomerFactor: number; // Factor for diaspora customer orders

  // ========================================
  // PAYOUT INFORMATION
  // ========================================
  @Column({
    name: 'payout_schedule',
    type: 'enum',
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
    default: 'monthly',
  })
  payoutSchedule: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

  @Column({
    name: 'payout_status',
    type: 'enum',
    enum: ['pending', 'scheduled', 'processed', 'completed', 'failed'],
    default: 'pending',
  })
  payoutStatus: 'pending' | 'scheduled' | 'processed' | 'completed' | 'failed';

  @Column({ name: 'payout_date', type: 'datetime', nullable: true })
  payoutDate: Date;

  @Column({
    name: 'payout_method',
    type: 'enum',
    enum: ['bank_transfer', 'mobile_wallet', 'check', 'cash'],
    default: 'bank_transfer',
  })
  payoutMethod: 'bank_transfer' | 'mobile_wallet' | 'check' | 'cash';

  @Column({
    name: 'payout_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  payoutReference: string;

  @Column({ name: 'withholding_tax_syp', type: 'bigint', default: 0 })
  withholdingTaxSyp: number; // Tax withheld from commission

  @Column({ name: 'net_payout_syp', type: 'bigint', default: 0 })
  netPayoutSyp: number; // Final payout amount after all deductions

  // ========================================
  // CUSTOMER AND ORDER ANALYTICS
  // ========================================
  @Column({
    name: 'customer_type',
    type: 'enum',
    enum: ['b2b', 'b2c', 'government', 'ngo'],
    default: 'b2c',
  })
  customerType: 'b2b' | 'b2c' | 'government' | 'ngo';

  @Column({
    name: 'order_channel',
    type: 'enum',
    enum: ['web', 'mobile', 'api', 'call_center'],
    default: 'web',
  })
  orderChannel: 'web' | 'mobile' | 'api' | 'call_center';

  @Column({ name: 'is_repeat_customer', type: 'boolean', default: false })
  isRepeatCustomer: boolean;

  @Column({ name: 'customer_acquisition_cost_syp', type: 'bigint', default: 0 })
  customerAcquisitionCostSyp: number;

  @Column({ name: 'customer_lifetime_value_syp', type: 'bigint', default: 0 })
  customerLifetimeValueSyp: number;

  @Column({
    name: 'order_processing_time_hours',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  orderProcessingTimeHours: number;

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

  @Column({ name: 'currency_display_format', type: 'json', nullable: true })
  currencyDisplayFormat: {
    sypFormat?: string; // e.g., "### ### ل.س"
    usdFormat?: string; // e.g., "$###.##"
    eurFormat?: string; // e.g., "€###.##"
  };

  // ========================================
  // BUSINESS INTELLIGENCE
  // ========================================
  @Column({ name: 'competitive_analysis', type: 'json', nullable: true })
  competitiveAnalysis: {
    avgMarketCommissionRate?: number;
    competitorPricing?: number;
    marketPositioning?: 'premium' | 'competitive' | 'budget';
    uniqueSellingPoints?: string[];
  };

  @Column({
    name: 'optimization_recommendations',
    type: 'json',
    nullable: true,
  })
  optimizationRecommendations: Array<{
    type: 'pricing' | 'commission' | 'promotion' | 'inventory' | 'marketing';
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
    recommendationAr: string;
    expectedImpact: string;
    estimatedRevenueLiftSyp?: number;
  }>;

  @Column({ name: 'risk_factors', type: 'json', nullable: true })
  riskFactors: Array<{
    factor: string;
    factorAr: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: 'revenue' | 'reputation' | 'operational' | 'compliance';
    mitigationStrategy?: string;
  }>;

  // ========================================
  // METADATA AND TRACKING
  // ========================================
  @Column({
    name: 'calculation_method',
    type: 'varchar',
    length: 100,
    default: 'automated',
  })
  calculationMethod: string; // 'automated', 'manual_override', 'batch_processing'

  @Column({
    name: 'data_source',
    type: 'varchar',
    length: 100,
    default: 'order_system',
  })
  dataSource: string; // Source of the commission data

  @Column({ name: 'audit_trail', type: 'json', nullable: true })
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    user?: string;
    system?: string;
    oldValues?: any;
    newValues?: any;
    reason?: string;
  }>;

  @Column({
    name: 'data_quality_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100,
  })
  dataQualityScore: number; // Reliability of the data (0-100)

  @Column({ name: 'last_calculation_at', type: 'datetime', nullable: true })
  lastCalculationAt: Date;

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
   * Get formatted commission amount with localization
   */
  getFormattedCommission(language: 'en' | 'ar' = 'ar'): {
    syp: string;
    formatted: string;
    usd?: string;
    eur?: string;
  } {
    const sypFormatted = this.useArabicNumerals
      ? this.toArabicNumerals(this.totalCommissionSyp.toLocaleString()) + ' ل.س'
      : this.totalCommissionSyp.toLocaleString() + ' SYP';

    const result: any = {
      syp: this.totalCommissionSyp.toLocaleString() + ' SYP',
      formatted: sypFormatted,
    };

    if (this.totalCommissionUsd) {
      result.usd = '$' + this.totalCommissionUsd.toFixed(2);
    }

    if (this.totalCommissionEur) {
      result.eur = '€' + this.totalCommissionEur.toFixed(2);
    }

    return result;
  }

  /**
   * Get localized performance category
   */
  getPerformanceCategoryLocalized(language: 'en' | 'ar' = 'ar'): string {
    const categories = {
      en: {
        [CommissionPerformanceCategory.EXCELLENT]: 'Excellent',
        [CommissionPerformanceCategory.GOOD]: 'Good',
        [CommissionPerformanceCategory.AVERAGE]: 'Average',
        [CommissionPerformanceCategory.POOR]: 'Poor',
        [CommissionPerformanceCategory.CRITICAL]: 'Critical',
      },
      ar: {
        [CommissionPerformanceCategory.EXCELLENT]: 'ممتاز',
        [CommissionPerformanceCategory.GOOD]: 'جيد',
        [CommissionPerformanceCategory.AVERAGE]: 'متوسط',
        [CommissionPerformanceCategory.POOR]: 'ضعيف',
        [CommissionPerformanceCategory.CRITICAL]: 'حرج',
      },
    };

    return (
      categories[language][this.performanceCategory] || this.performanceCategory
    );
  }

  /**
   * Get localized vendor tier
   */
  getVendorTierLocalized(language: 'en' | 'ar' = 'ar'): string {
    const tiers = {
      en: {
        [VendorCommissionTier.PLATINUM]: 'Platinum',
        [VendorCommissionTier.GOLD]: 'Gold',
        [VendorCommissionTier.SILVER]: 'Silver',
        [VendorCommissionTier.BRONZE]: 'Bronze',
        [VendorCommissionTier.STANDARD]: 'Standard',
      },
      ar: {
        [VendorCommissionTier.PLATINUM]: 'بلاتيني',
        [VendorCommissionTier.GOLD]: 'ذهبي',
        [VendorCommissionTier.SILVER]: 'فضي',
        [VendorCommissionTier.BRONZE]: 'برونزي',
        [VendorCommissionTier.STANDARD]: 'عادي',
      },
    };

    return tiers[language][this.vendorTier] || this.vendorTier;
  }

  /**
   * Get commission source description
   */
  getCommissionSourceLocalized(language: 'en' | 'ar' = 'ar'): string {
    const sources = {
      en: {
        product: 'Product-specific Rate',
        vendor: 'Vendor-specific Rate',
        category: 'Category Rate',
        global: 'Global Default Rate',
        membership: 'Membership Discount Applied',
      },
      ar: {
        product: 'معدل خاص بالمنتج',
        vendor: 'معدل خاص بالبائع',
        category: 'معدل الفئة',
        global: 'المعدل الافتراضي العام',
        membership: 'تم تطبيق خصم العضوية',
      },
    };

    return sources[language][this.commissionSource] || this.commissionSource;
  }

  /**
   * Calculate commission margin percentage
   */
  getCommissionMarginPercentage(): number {
    if (this.orderValueSyp === 0) return 0;
    return (this.totalCommissionSyp / this.orderValueSyp) * 100;
  }

  /**
   * Get profitability score based on various factors
   */
  getProfitabilityScore(): number {
    let score = 0;

    // Commission efficiency (40%)
    score += this.commissionEfficiencyRate * 0.4;

    // Performance score (30%)
    score += this.performanceScore * 0.3;

    // Growth rate (20%)
    const growthScore = Math.max(
      0,
      Math.min(100, this.monthlyGrowthRate * 10 + 50),
    );
    score += growthScore * 0.2;

    // Market position (10%)
    const tierScores = {
      [VendorCommissionTier.PLATINUM]: 100,
      [VendorCommissionTier.GOLD]: 80,
      [VendorCommissionTier.SILVER]: 60,
      [VendorCommissionTier.BRONZE]: 40,
      [VendorCommissionTier.STANDARD]: 20,
    };
    score += tierScores[this.vendorTier] * 0.1;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  private toArabicNumerals(num: string): string {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return num.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  }
}

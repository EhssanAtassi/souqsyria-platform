/**
 * @file syrian-tax.service.ts
 * @description Syrian tax calculation system with VAT and import duties
 *
 * SYRIAN TAX FEATURES:
 * - Value Added Tax (VAT) calculations
 * - Import duty and customs calculations
 * - Tax exemptions and special rates
 * - Syrian tax compliance
 * - Tax reporting and documentation
 * - Multi-tier tax structure
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Tax types in Syrian system
 */
export enum SyrianTaxType {
  VAT = 'vat', // Value Added Tax
  IMPORT_DUTY = 'import_duty', // Import customs duty
  EXCISE = 'excise', // Excise tax (tobacco, alcohol, etc.)
  LUXURY = 'luxury', // Luxury goods tax
  SERVICE = 'service', // Service tax
  STAMP = 'stamp', // Stamp duty
  MUNICIPAL = 'municipal', // Municipal tax
}

/**
 * Tax calculation basis
 */
export enum TaxBasis {
  PRICE = 'price', // Based on product price
  WEIGHT = 'weight', // Based on weight
  QUANTITY = 'quantity', // Based on quantity
  VALUE = 'value', // Based on declared value
  FIXED = 'fixed', // Fixed amount
}

/**
 * Tax exemption types
 */
export enum TaxExemptionType {
  NONE = 'none',
  FULL = 'full', // Fully exempt
  REDUCED = 'reduced', // Reduced rate
  CONDITIONAL = 'conditional', // Conditional exemption
}

/**
 * Syrian tax rates configuration
 */
@Entity('syrian_tax_rates')
@Index(['category', 'taxType'])
export class SyrianTaxRateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Product category this rate applies to
   */
  @Column({ length: 100 })
  @Index()
  category: string;

  /**
   * Subcategory for more specific rates
   */
  @Column({ length: 100, nullable: true })
  subcategory: string;

  /**
   * Type of tax
   */
  @Column({
    type: 'enum',
    enum: SyrianTaxType,
  })
  @Index()
  taxType: SyrianTaxType;

  /**
   * Tax rate percentage (0-100)
   */
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  rate: number;

  /**
   * Minimum tax amount
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minimumAmount: number;

  /**
   * Maximum tax amount
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maximumAmount: number;

  /**
   * Tax calculation basis
   */
  @Column({
    type: 'enum',
    enum: TaxBasis,
    default: TaxBasis.PRICE,
  })
  basis: TaxBasis;

  /**
   * Exemption type
   */
  @Column({
    type: 'enum',
    enum: TaxExemptionType,
    default: TaxExemptionType.NONE,
  })
  exemption: TaxExemptionType;

  /**
   * Effective date range
   */
  @Column({ type: 'date' })
  effectiveFrom: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo: Date;

  /**
   * Syrian legal reference
   */
  @Column({ type: 'json', nullable: true })
  legalReference: {
    lawNumber?: string;
    decree?: string;
    article?: string;
    lastUpdate?: Date;
    source?: string;
  };

  /**
   * Additional tax rules and conditions
   */
  @Column({ type: 'json', nullable: true })
  conditions: {
    minimumValue?: number;
    maximumValue?: number;
    countryOfOrigin?: string[];
    vendorType?: string[];
    customerType?: string[];
    specialConditions?: string[];
  };

  /**
   * Whether this rate is currently active
   */
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Tax calculation result
 */
interface TaxCalculationResult {
  subtotal: number;
  taxes: Array<{
    type: SyrianTaxType;
    rate: number;
    amount: number;
    basis: TaxBasis;
    description: string;
    legalReference?: string;
  }>;
  totalTax: number;
  totalAmount: number;
  breakdown: {
    baseAmount: number;
    vatAmount: number;
    importDutyAmount: number;
    exciseAmount: number;
    otherTaxesAmount: number;
  };
  compliance: {
    isCompliant: boolean;
    warnings?: string[];
    requiredDocuments?: string[];
  };
}

/**
 * Tax report for compliance
 */
interface TaxReport {
  period: { from: Date; to: Date };
  totalSales: number;
  totalTaxCollected: number;
  taxBreakdown: Record<SyrianTaxType, number>;
  exemptSales: number;
  reportingCurrency: string;
  generatedAt: Date;
}

@Injectable()
export class SyrianTaxService {
  private readonly logger = new Logger(SyrianTaxService.name);

  constructor(
    @InjectRepository(SyrianTaxRateEntity)
    private taxRateRepo: Repository<SyrianTaxRateEntity>,
  ) {
    this.initializeSyrianTaxRates();
  }

  /**
   * Initialize Syrian tax rates
   */
  private async initializeSyrianTaxRates(): Promise<void> {
    try {
      const existingRates = await this.taxRateRepo.count();
      if (existingRates > 0) {
        this.logger.log('Syrian tax rates already initialized');
        return;
      }

      const defaultTaxRates = [
        // VAT Rates
        {
          category: 'general',
          taxType: SyrianTaxType.VAT,
          rate: 0, // Syria currently has 0% VAT on most items
          basis: TaxBasis.PRICE,
          exemption: TaxExemptionType.FULL,
          effectiveFrom: new Date('2020-01-01'),
          legalReference: {
            lawNumber: 'Law No. 13',
            decree: 'Presidential Decree',
            article: 'Article 1',
            source: 'Syrian Ministry of Finance',
          },
        },
        {
          category: 'luxury_goods',
          taxType: SyrianTaxType.LUXURY,
          rate: 15.0, // Luxury tax on high-end items
          basis: TaxBasis.PRICE,
          exemption: TaxExemptionType.NONE,
          effectiveFrom: new Date('2020-01-01'),
          conditions: {
            minimumValue: 100000, // SYP
          },
        },
        {
          category: 'electronics',
          taxType: SyrianTaxType.IMPORT_DUTY,
          rate: 20.0, // Import duty on electronics
          basis: TaxBasis.VALUE,
          exemption: TaxExemptionType.NONE,
          effectiveFrom: new Date('2020-01-01'),
        },
        {
          category: 'clothing',
          taxType: SyrianTaxType.IMPORT_DUTY,
          rate: 35.0, // Higher duty on clothing to protect local industry
          basis: TaxBasis.VALUE,
          exemption: TaxExemptionType.NONE,
          effectiveFrom: new Date('2020-01-01'),
        },
        {
          category: 'food',
          taxType: SyrianTaxType.VAT,
          rate: 0, // Food items exempt from VAT
          basis: TaxBasis.PRICE,
          exemption: TaxExemptionType.FULL,
          effectiveFrom: new Date('2020-01-01'),
        },
        {
          category: 'medicine',
          taxType: SyrianTaxType.VAT,
          rate: 0, // Medicine exempt from all taxes
          basis: TaxBasis.PRICE,
          exemption: TaxExemptionType.FULL,
          effectiveFrom: new Date('2020-01-01'),
        },
        {
          category: 'tobacco',
          taxType: SyrianTaxType.EXCISE,
          rate: 100.0, // High excise tax on tobacco
          basis: TaxBasis.PRICE,
          exemption: TaxExemptionType.NONE,
          effectiveFrom: new Date('2020-01-01'),
        },
        {
          category: 'automotive',
          taxType: SyrianTaxType.LUXURY,
          rate: 25.0, // Luxury tax on cars
          basis: TaxBasis.VALUE,
          exemption: TaxExemptionType.NONE,
          effectiveFrom: new Date('2020-01-01'),
          conditions: {
            minimumValue: 5000000, // SYP (≈$400 USD)
          },
        },
        // Service taxes
        {
          category: 'services',
          taxType: SyrianTaxType.SERVICE,
          rate: 5.0, // Service tax
          basis: TaxBasis.PRICE,
          exemption: TaxExemptionType.NONE,
          effectiveFrom: new Date('2020-01-01'),
        },
      ];

      for (const rateData of defaultTaxRates) {
        const rate = this.taxRateRepo.create(rateData);
        await this.taxRateRepo.save(rate);
      }

      this.logger.log(`Initialized ${defaultTaxRates.length} Syrian tax rates`);
    } catch (error: unknown) {
      this.logger.error(
        'Failed to initialize Syrian tax rates',
        (error as Error).stack,
      );
    }
  }

  /**
   * Calculate taxes for a product or order
   */
  async calculateTax(
    amount: number,
    category: string,
    subcategory?: string,
    options: {
      isImported?: boolean;
      countryOfOrigin?: string;
      customerType?: 'individual' | 'business' | 'government';
      vendorType?: 'local' | 'foreign';
    } = {},
  ): Promise<TaxCalculationResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    this.logger.log(
      `Calculating taxes for ${amount} SYP in category ${category}`,
    );

    const applicableTaxRates = await this.getApplicableTaxRates(
      category,
      subcategory,
      options,
    );

    const taxes: TaxCalculationResult['taxes'] = [];
    let totalTax = 0;

    // Calculate each applicable tax
    for (const taxRate of applicableTaxRates) {
      if (taxRate.exemption === TaxExemptionType.FULL) {
        continue; // Skip exempt taxes
      }

      const taxableAmount = amount;
      let rate = taxRate.rate;

      // Apply reduced rate if applicable
      if (taxRate.exemption === TaxExemptionType.REDUCED) {
        rate = rate * 0.5; // 50% reduction for reduced rate
      }

      // Calculate tax amount
      let taxAmount = (taxableAmount * rate) / 100;

      // Apply minimum and maximum limits
      if (taxRate.minimumAmount && taxAmount < taxRate.minimumAmount) {
        taxAmount = taxRate.minimumAmount;
      }
      if (taxRate.maximumAmount && taxAmount > taxRate.maximumAmount) {
        taxAmount = taxRate.maximumAmount;
      }

      // Round to 2 decimal places (or whole numbers for SYP)
      taxAmount = Math.round(taxAmount);

      taxes.push({
        type: taxRate.taxType,
        rate,
        amount: taxAmount,
        basis: taxRate.basis,
        description: this.getTaxDescription(taxRate.taxType, category),
        legalReference: taxRate.legalReference?.lawNumber,
      });

      totalTax += taxAmount;
    }

    // Create breakdown
    const breakdown = {
      baseAmount: amount,
      vatAmount: this.getTaxAmountByType(taxes, SyrianTaxType.VAT),
      importDutyAmount: this.getTaxAmountByType(
        taxes,
        SyrianTaxType.IMPORT_DUTY,
      ),
      exciseAmount: this.getTaxAmountByType(taxes, SyrianTaxType.EXCISE),
      otherTaxesAmount:
        totalTax -
        this.getTaxAmountByType(taxes, SyrianTaxType.VAT) -
        this.getTaxAmountByType(taxes, SyrianTaxType.IMPORT_DUTY) -
        this.getTaxAmountByType(taxes, SyrianTaxType.EXCISE),
    };

    // Check compliance
    const compliance = await this.checkTaxCompliance(amount, category, taxes);

    return {
      subtotal: amount,
      taxes,
      totalTax: Math.round(totalTax),
      totalAmount: Math.round(amount + totalTax),
      breakdown,
      compliance,
    };
  }

  /**
   * Get tax rates for a specific category
   */
  async getTaxRatesByCategory(
    category: string,
  ): Promise<SyrianTaxRateEntity[]> {
    return this.taxRateRepo.find({
      where: {
        category,
        isActive: true,
        effectiveFrom: LessThanOrEqual(new Date()),
      },
      order: { taxType: 'ASC' },
    });
  }

  /**
   * Generate tax report for a period
   */
  async generateTaxReport(
    fromDate: Date,
    toDate: Date,
    transactions: Array<{
      amount: number;
      category: string;
      taxes: number;
      exemptAmount?: number;
    }>,
  ): Promise<TaxReport> {
    const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTaxCollected = transactions.reduce((sum, t) => sum + t.taxes, 0);
    const exemptSales = transactions.reduce(
      (sum, t) => sum + (t.exemptAmount || 0),
      0,
    );

    // Group taxes by type (this would be more complex in a real implementation)
    const taxBreakdown: Record<SyrianTaxType, number> = {
      [SyrianTaxType.VAT]: 0,
      [SyrianTaxType.IMPORT_DUTY]: 0,
      [SyrianTaxType.EXCISE]: 0,
      [SyrianTaxType.LUXURY]: 0,
      [SyrianTaxType.SERVICE]: 0,
      [SyrianTaxType.STAMP]: 0,
      [SyrianTaxType.MUNICIPAL]: 0,
    };

    return {
      period: { from: fromDate, to: toDate },
      totalSales,
      totalTaxCollected,
      taxBreakdown,
      exemptSales,
      reportingCurrency: 'SYP',
      generatedAt: new Date(),
    };
  }

  /**
   * Check if a product category is tax-exempt
   */
  async isExemptCategory(category: string): Promise<boolean> {
    const exemptCategories = ['food', 'medicine', 'books', 'education'];
    return exemptCategories.includes(category.toLowerCase());
  }

  /**
   * PRIVATE METHODS
   */

  private async getApplicableTaxRates(
    category: string,
    subcategory?: string,
    options: any = {},
  ): Promise<SyrianTaxRateEntity[]> {
    const query = this.taxRateRepo
      .createQueryBuilder('rate')
      .where('rate.category = :category', { category })
      .andWhere('rate.isActive = :isActive', { isActive: true })
      .andWhere('rate.effectiveFrom <= :now', { now: new Date() })
      .andWhere('(rate.effectiveTo IS NULL OR rate.effectiveTo >= :now)', {
        now: new Date(),
      });

    if (subcategory) {
      query.andWhere(
        '(rate.subcategory = :subcategory OR rate.subcategory IS NULL)',
        { subcategory },
      );
    }

    const rates = await query.getMany();

    // Filter by conditions
    return rates.filter((rate) => this.checkTaxConditions(rate, options));
  }

  private checkTaxConditions(rate: SyrianTaxRateEntity, options: any): boolean {
    if (!rate.conditions) return true;

    const conditions = rate.conditions;

    // Check country of origin
    if (conditions.countryOfOrigin && options.countryOfOrigin) {
      if (!conditions.countryOfOrigin.includes(options.countryOfOrigin)) {
        return false;
      }
    }

    // Check customer type
    if (conditions.customerType && options.customerType) {
      if (!conditions.customerType.includes(options.customerType)) {
        return false;
      }
    }

    // Check vendor type
    if (conditions.vendorType && options.vendorType) {
      if (!conditions.vendorType.includes(options.vendorType)) {
        return false;
      }
    }

    return true;
  }

  private getTaxAmountByType(
    taxes: TaxCalculationResult['taxes'],
    type: SyrianTaxType,
  ): number {
    return taxes
      .filter((tax) => tax.type === type)
      .reduce((sum, tax) => sum + tax.amount, 0);
  }

  private getTaxDescription(taxType: SyrianTaxType, category: string): string {
    const descriptions = {
      [SyrianTaxType.VAT]: 'Value Added Tax',
      [SyrianTaxType.IMPORT_DUTY]: 'Import Customs Duty',
      [SyrianTaxType.EXCISE]: 'Excise Tax',
      [SyrianTaxType.LUXURY]: 'Luxury Goods Tax',
      [SyrianTaxType.SERVICE]: 'Service Tax',
      [SyrianTaxType.STAMP]: 'Stamp Duty',
      [SyrianTaxType.MUNICIPAL]: 'Municipal Tax',
    };

    return descriptions[taxType] || 'Tax';
  }

  private async checkTaxCompliance(
    amount: number,
    category: string,
    taxes: TaxCalculationResult['taxes'],
  ): Promise<TaxCalculationResult['compliance']> {
    const warnings: string[] = [];
    const requiredDocuments: string[] = [];

    // Check for high-value transactions
    if (amount > 1000000) {
      // > 1M SYP
      warnings.push(
        'High-value transaction may require additional documentation',
      );
      requiredDocuments.push(
        'Purchase invoice',
        'Tax registration certificate',
      );
    }

    // Check for luxury goods
    const hasLuxuryTax = taxes.some((tax) => tax.type === SyrianTaxType.LUXURY);
    if (hasLuxuryTax) {
      requiredDocuments.push('Luxury goods declaration');
    }

    // Check for import duties
    const hasImportDuty = taxes.some(
      (tax) => tax.type === SyrianTaxType.IMPORT_DUTY,
    );
    if (hasImportDuty) {
      requiredDocuments.push('Import permit', 'Customs declaration');
    }

    return {
      isCompliant: warnings.length === 0,
      warnings: warnings.length > 0 ? warnings : undefined,
      requiredDocuments:
        requiredDocuments.length > 0 ? requiredDocuments : undefined,
    };
  }
}

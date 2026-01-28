/**
 * @file syrian-payment-methods.service.ts
 * @description Syrian local payment methods service
 *
 * SYRIAN PAYMENT FEATURES:
 * - Cash on Delivery (COD) - Primary payment method
 * - Bank transfers to Syrian banks
 * - Mobile payment solutions
 * - Installment payment plans
 * - Hawala and traditional transfer methods
 * - Diaspora-friendly payment options
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyrianBankEntity } from '../entities/syrian-bank.entity';
import {
  SyrianPaymentMethodEntity,
  SyrianPaymentType,
  SyrianPaymentStatus,
} from '../entities/syrian-payment-method.entity';

/**
 * Payment method selection result interface
 */
export interface PaymentMethodSelection {
  method: SyrianPaymentMethodEntity;
  isAvailable: boolean;
  estimatedCost: number;
  processingTime: string;
  requirements: string[];
  instructions: {
    en: string;
    ar: string;
  };
  warnings?: string[];
}

@Injectable()
export class SyrianPaymentMethodsService {
  private readonly logger = new Logger(SyrianPaymentMethodsService.name);

  constructor(
    @InjectRepository(SyrianBankEntity)
    private bankRepo: Repository<SyrianBankEntity>,

    @InjectRepository(SyrianPaymentMethodEntity)
    private paymentMethodRepo: Repository<SyrianPaymentMethodEntity>,
  ) {
    this.initializeSyrianPaymentMethods();
  }

  /**
   * Initialize Syrian payment methods if they don't exist
   */
  private async initializeSyrianPaymentMethods(): Promise<void> {
    try {
      const existingMethods = await this.paymentMethodRepo.count();
      if (existingMethods === 0) {
        this.logger.log('Initializing default Syrian payment methods...');
        await this.createDefaultPaymentMethods();
        this.logger.log('✅ Syrian payment methods initialized successfully');
      }
    } catch (error: unknown) {
      this.logger.error(
        'Failed to initialize Syrian payment methods',
        (error as Error).message,
      );
    }
  }

  /**
   * Create default Syrian payment methods
   */
  private async createDefaultPaymentMethods(): Promise<void> {
    const defaultMethods = [
      {
        type: SyrianPaymentType.CASH_ON_DELIVERY,
        nameEn: 'Cash on Delivery (COD)',
        nameAr: 'الدفع عند الاستلام',
        descriptionEn:
          'Pay in cash when your order is delivered to your address',
        descriptionAr: 'ادفع نقداً عند توصيل طلبك إلى عنوانك',
        configuration: {
          minimumAmount: 1000, // 1,000 SYP
          maximumAmount: 500000, // 500,000 SYP
          codFee: 500, // 500 SYP delivery fee
          processingTime: 'Upon delivery',
          codAvailableAreas: [
            'Damascus',
            'Aleppo',
            'Homs',
            'Latakia',
            'Tartus',
          ],
        },
        availability: {
          governorates: [
            'Damascus',
            'Aleppo',
            'Homs',
            'Latakia',
            'Tartus',
            'Daraa',
            'As-Suwayda',
          ],
          cities: [],
          diasporaSupported: false,
        },
        operationalStatus: {
          isOperational: true,
          maintenanceMode: false,
          lastChecked: new Date(),
          restrictions: [],
        },
        isActive: true,
      },
      {
        type: SyrianPaymentType.BANK_TRANSFER,
        nameEn: 'Bank Transfer',
        nameAr: 'حوالة مصرفية',
        descriptionEn: 'Transfer money directly to our bank account',
        descriptionAr: 'حول المال مباشرة إلى حسابنا المصرفي',
        configuration: {
          minimumAmount: 5000, // 5,000 SYP
          maximumAmount: 2000000, // 2,000,000 SYP
          processingTime: '1-3 business days',
          supportedCurrencies: ['SYP', 'USD', 'EUR'],
        },
        availability: {
          governorates: [
            'Damascus',
            'Aleppo',
            'Homs',
            'Latakia',
            'Tartus',
            'Daraa',
            'As-Suwayda',
            'Deir ez-Zor',
            'Ar-Raqqa',
            'Al-Hasakah',
            'Idlib',
            'Hama',
            'Quneitra',
            'Rif Dimashq',
          ],
          cities: [],
          diasporaSupported: true,
        },
        operationalStatus: {
          isOperational: true,
          maintenanceMode: false,
          lastChecked: new Date(),
          restrictions: [],
        },
        isActive: true,
      },
    ];

    for (const methodData of defaultMethods) {
      const method = this.paymentMethodRepo.create(methodData);
      await this.paymentMethodRepo.save(method);
    }
  }

  /**
   * Get available payment methods for Syrian customers
   *
   * @param amount - Order amount in SYP
   * @param currency - Currency code (default: SYP)
   * @param customerLocation - Customer's location info
   * @returns Available payment methods with recommendations
   */
  async getAvailablePaymentMethods(
    amount: number,
    currency: string = 'SYP',
    customerLocation?: { governorate: string; city?: string },
  ): Promise<PaymentMethodSelection[]> {
    const activeMethods = await this.paymentMethodRepo.find({
      where: { isActive: true },
      relations: ['bank'],
    });

    const availableMethods: PaymentMethodSelection[] = [];

    for (const method of activeMethods) {
      const isAvailable = this.isMethodAvailable(
        method,
        amount,
        currency,
        customerLocation,
      );

      if (isAvailable) {
        const selection: PaymentMethodSelection = {
          method,
          isAvailable: true,
          estimatedCost: this.calculateMethodCost(method, amount),
          processingTime: method.configuration.processingTime || 'Unknown',
          requirements: this.getMethodRequirements(method),
          instructions: {
            en: `To use ${method.nameEn}: ${method.descriptionEn}`,
            ar: `لاستخدام ${method.nameAr}: ${method.descriptionAr}`,
          },
          warnings: this.getMethodWarnings(method, amount),
        };
        availableMethods.push(selection);
      }
    }

    return availableMethods.sort((a, b) => a.estimatedCost - b.estimatedCost);
  }

  /**
   * Check if payment method is available for given parameters
   */
  private isMethodAvailable(
    method: SyrianPaymentMethodEntity,
    amount: number,
    currency: string,
    customerLocation?: { governorate: string; city?: string },
  ): boolean {
    // Check operational status
    if (!method.operationalStatus?.isOperational) {
      return false;
    }

    // Check amount limits
    const minAmount = method.configuration.minimumAmount || 0;
    const maxAmount =
      method.configuration.maximumAmount || Number.MAX_SAFE_INTEGER;

    if (amount < minAmount || amount > maxAmount) {
      return false;
    }

    // Check geographic availability
    if (customerLocation) {
      if (
        !method.availability.governorates.includes(customerLocation.governorate)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate the cost for using this payment method
   */
  private calculateMethodCost(
    method: SyrianPaymentMethodEntity,
    amount: number,
  ): number {
    const config = method.configuration;
    let cost = 0;

    if (method.type === SyrianPaymentType.CASH_ON_DELIVERY && config.codFee) {
      cost += config.codFee;
    }

    if (config.processingFee) {
      if (config.processingFee < 1) {
        // Percentage fee
        cost += amount * config.processingFee;
      } else {
        // Fixed fee
        cost += config.processingFee;
      }
    }

    return cost;
  }

  /**
   * Get requirements for using this payment method
   */
  private getMethodRequirements(method: SyrianPaymentMethodEntity): string[] {
    const requirements: string[] = [];

    switch (method.type) {
      case SyrianPaymentType.CASH_ON_DELIVERY:
        requirements.push('Valid phone number');
        requirements.push('Valid delivery address');
        requirements.push('Be available during delivery hours');
        break;

      case SyrianPaymentType.BANK_TRANSFER:
        requirements.push('Bank account details');
        requirements.push('Transfer receipt or reference number');
        break;
    }

    return requirements;
  }

  /**
   * Get warnings for using this payment method
   */
  private getMethodWarnings(
    method: SyrianPaymentMethodEntity,
    amount: number,
  ): string[] {
    const warnings: string[] = [];

    if (method.type === SyrianPaymentType.CASH_ON_DELIVERY) {
      if (amount > 100000) {
        warnings.push('Large cash amounts may require advance notice');
      }
    }

    return warnings;
  }

  /**
   * Get Syrian payment method by ID
   */
  async getPaymentMethodById(id: number): Promise<SyrianPaymentMethodEntity> {
    const method = await this.paymentMethodRepo.findOne({
      where: { id },
      relations: ['bank'],
    });

    if (!method) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    return method;
  }

  /**
   * Get all Syrian banks
   */
  async getAllBanks(): Promise<SyrianBankEntity[]> {
    return this.bankRepo.find({
      where: { isActive: true },
    });
  }

  /**
   * Process a Syrian payment method selection
   * This would integrate with actual payment processors
   */
  async processPaymentMethodSelection(
    methodId: number,
    amount: number,
    currency: string = 'SYP',
    customerData: any,
  ): Promise<PaymentMethodSelection> {
    const method = await this.getPaymentMethodById(methodId);

    // Validate the selection
    const isAvailable = this.isMethodAvailable(
      method,
      amount,
      currency,
      customerData.location,
    );

    if (!isAvailable) {
      throw new BadRequestException(
        'Selected payment method is not available for this transaction',
      );
    }

    const selection: PaymentMethodSelection = {
      method,
      isAvailable: true,
      estimatedCost: this.calculateMethodCost(method, amount),
      processingTime: method.configuration.processingTime || 'Unknown',
      requirements: this.getMethodRequirements(method),
      instructions: {
        en: `To use ${method.nameEn}: ${method.descriptionEn}`,
        ar: `لاستخدام ${method.nameAr}: ${method.descriptionAr}`,
      },
      warnings: this.getMethodWarnings(method, amount),
    };

    this.logger.log(
      `Payment method selected: ${method.nameEn} for amount ${amount} ${currency}`,
    );

    return selection;
  }
}

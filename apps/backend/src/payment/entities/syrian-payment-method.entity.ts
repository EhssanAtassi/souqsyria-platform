/**
 * @file syrian-payment-method.entity.ts
 * @description Syrian payment method entity for localized payment processing
 *
 * SYRIAN PAYMENT FEATURES:
 * - Cash on Delivery (COD) - Primary payment method
 * - Bank transfers to Syrian banks
 * - Mobile payment solutions
 * - Installment payment plans
 * - Hawala and traditional transfer methods
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 */

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
import { SyrianBankEntity } from './syrian-bank.entity';

/**
 * Syrian payment method types
 */
export enum SyrianPaymentType {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  BANK_TRANSFER = 'bank_transfer',
  MOBILE_PAYMENT = 'mobile_payment',
  INSTALLMENTS = 'installments',
  HAWALA = 'hawala',
  CRYPTOCURRENCY = 'cryptocurrency',
  REMITTANCE = 'remittance',
  BARTER = 'barter',
}

/**
 * Payment status for Syrian context
 */
export enum SyrianPaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_TRANSIT = 'in_transit',
  RECEIVED = 'received',
  VERIFIED = 'verified',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded',
}

/**
 * Syrian payment method configuration entity
 */
@Entity('syrian_payment_methods')
@Index(['type', 'isActive'])
export class SyrianPaymentMethodEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Payment method type
   */
  @Column({
    type: 'enum',
    enum: SyrianPaymentType,
  })
  @Index()
  type: SyrianPaymentType;

  /**
   * Method name in English
   */
  @Column({ length: 100 })
  nameEn: string;

  /**
   * Method name in Arabic
   */
  @Column({ length: 100 })
  nameAr: string;

  /**
   * Description in English
   */
  @Column({ type: 'text' })
  descriptionEn: string;

  /**
   * Description in Arabic
   */
  @Column({ type: 'text' })
  descriptionAr: string;

  /**
   * Associated bank (if applicable)
   */
  @ManyToOne(() => SyrianBankEntity, { nullable: true })
  @JoinColumn({ name: 'bank_id' })
  bank: SyrianBankEntity;

  /**
   * Configuration specific to this payment method
   */
  @Column({ type: 'json' })
  configuration: {
    minimumAmount?: number; // SYP
    maximumAmount?: number; // SYP
    processingFee?: number; // SYP or percentage
    processingTime?: string; // "immediate", "1-3 days"

    // For COD
    codFee?: number;
    codMaxAmount?: number;
    codAvailableAreas?: string[];

    // For bank transfers
    bankAccountRequired?: boolean;
    supportedCurrencies?: string[];

    // For mobile payments
    mobileProviders?: string[];
    mobileNumbers?: string[];

    // For installments
    installmentPlans?: Array<{
      months: number;
      interestRate: number;
      downPaymentPercentage: number;
    }>;
  };

  /**
   * Availability by geographic region
   */
  @Column({ type: 'json' })
  availability: {
    governorates: string[]; // Syrian governorates
    cities: string[]; // Specific cities (optional)
    excludedAreas?: string[]; // Areas where not available
    diasporaSupported: boolean; // For international Syrian diaspora
  };

  /**
   * Current operational status and restrictions
   */
  @Column({ type: 'json' })
  operationalStatus: {
    isOperational: boolean;
    maintenanceMode: boolean;
    lastChecked: Date;
    restrictions?: string[];
    temporaryLimits?: {
      maxDaily?: number;
      maxMonthly?: number;
      reason?: string;
    };
  };

  /**
   * Integration settings for third-party providers
   */
  @Column({ type: 'json', nullable: true })
  integrationSettings?: {
    provider?: string;
    apiEndpoint?: string;
    webhookUrl?: string;
    credentials?: {
      publicKey?: string;
      // Note: Sensitive data should be encrypted
      encryptedPrivateKey?: string;
    };
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * @file syrian-bank.entity.ts
 * @description Syrian bank entity for local banking integration
 *
 * SYRIAN BANKING FEATURES:
 * - Local Syrian banks information and branches
 * - Services and transfer capabilities
 * - Fee structures and operational limits
 * - Real-time operational status
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
} from 'typeorm';

/**
 * Syrian bank information entity
 */
@Entity('syrian_banks')
export class SyrianBankEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Bank name in English
   */
  @Column({ length: 200 })
  nameEn: string;

  /**
   * Bank name in Arabic
   */
  @Column({ length: 200 })
  nameAr: string;

  /**
   * Bank code (SWIFT or local)
   */
  @Column({ length: 20, unique: true })
  bankCode: string;

  /**
   * Bank branches information
   */
  @Column({ type: 'json' })
  branches: Array<{
    name: string;
    nameAr: string;
    city: string;
    address: string;
    addressAr: string;
    phone?: string;
    isActive: boolean;
  }>;

  /**
   * Supported services
   */
  @Column({ type: 'json' })
  services: {
    domesticTransfers: boolean;
    internationalTransfers: boolean;
    usdAccounts: boolean;
    eurAccounts: boolean;
    onlineBanking: boolean;
    mobileBanking: boolean;
    atmNetwork: boolean;
  };

  /**
   * Transfer fees and limits
   */
  @Column({ type: 'json' })
  transferInfo: {
    domesticFee: number; // SYP
    internationalFeeUSD: number; // USD
    dailyLimit: number; // SYP
    monthlyLimit: number; // SYP
    processingTime: string; // "1-3 days"
    cutoffTime: string; // "14:00"
  };

  /**
   * Current operational status
   */
  @Column({ type: 'json' })
  status: {
    isOperational: boolean;
    lastChecked: Date;
    restrictions?: string[];
    alternativeInstructions?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

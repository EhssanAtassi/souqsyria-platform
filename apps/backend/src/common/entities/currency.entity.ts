/**
 * @file currency.entity.ts
 * @description Currency management entity for multi-currency support
 *
 * SYRIAN LOCALIZATION FEATURES:
 * - Syrian Pound (SYP) as primary currency
 * - Multi-currency support for diaspora (USD, EUR)
 * - Real-time exchange rate tracking
 * - Currency conversion with precision handling
 * - Historical exchange rate data
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
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
 * Currency status enumeration
 */
export enum CurrencyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

/**
 * Currency types for different user groups
 */
export enum CurrencyType {
  PRIMARY = 'primary', // SYP - main currency
  DIASPORA = 'diaspora', // USD, EUR for diaspora users
  CRYPTO = 'crypto', // Future crypto support
  LOCAL = 'local', // Other regional currencies
}

@Entity('currencies')
@Index(['status', 'isPrimary'])
export class CurrencyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ISO 4217 currency code (SYP, USD, EUR, etc.)
   */
  @Column({ length: 3, unique: true })
  code: string;

  /**
   * Currency name in English
   */
  @Column({ length: 100 })
  nameEn: string;

  /**
   * Currency name in Arabic
   */
  @Column({ length: 100 })
  nameAr: string;

  /**
   * Currency symbol (ل.س, $, €, etc.)
   */
  @Column({ length: 10 })
  symbol: string;

  /**
   * Arabic symbol representation
   */
  @Column({ length: 10, nullable: true })
  symbolAr: string;

  /**
   * Number of decimal places for precision
   */
  @Column({ type: 'tinyint', default: 2 })
  decimalPlaces: number;

  /**
   * Exchange rate to base currency (SYP)
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 6,
    default: 1.0,
  })
  exchangeRate: number;

  /**
   * Whether this is the primary currency (SYP)
   */
  @Column({ default: false })
  isPrimary: boolean;

  /**
   * Currency status
   */
  @Column({
    type: 'enum',
    enum: CurrencyStatus,
    default: CurrencyStatus.ACTIVE,
  })
  status: CurrencyStatus;

  /**
   * Currency type classification
   */
  @Column({
    type: 'enum',
    enum: CurrencyType,
    default: CurrencyType.LOCAL,
  })
  type: CurrencyType;

  /**
   * Display format pattern (e.g., "#,##0.00 ل.س")
   */
  @Column({ length: 50, default: '#,##0.00' })
  formatPattern: string;

  /**
   * Whether to show currency before or after amount
   */
  @Column({ default: false })
  symbolAfterAmount: boolean;

  /**
   * Thousands separator (, or .)
   */
  @Column({ length: 1, default: ',' })
  thousandsSeparator: string;

  /**
   * Decimal separator (, or .)
   */
  @Column({ length: 1, default: '.' })
  decimalSeparator: string;

  /**
   * Currency configuration for specific features
   */
  @Column({ type: 'json', nullable: true })
  configuration: {
    minAmount?: number;
    maxAmount?: number;
    roundingMode?: 'up' | 'down' | 'nearest';
    allowedCountries?: string[];
    restrictions?: string[];
    displayOrder?: number;
  };

  /**
   * Exchange rate metadata
   */
  @Column({ type: 'json', nullable: true })
  exchangeRateData: {
    source?: string; // Central Bank of Syria, ECB, etc.
    lastUpdated?: Date;
    updateFrequency?: string; // daily, hourly, real-time
    spread?: number; // bid-ask spread percentage
    volatility?: number; // historical volatility
    trend?: 'rising' | 'falling' | 'stable';
  };

  /**
   * Localization settings
   */
  @Column({ type: 'json', nullable: true })
  localization: {
    regions?: string[]; // Syria, Lebanon, Turkey, etc.
    languages?: string[]; // ar, en, tr
    culturalNotes?: string;
    holidays?: string[]; // Syrian holidays affecting trading
    businessHours?: {
      timezone: string;
      workingDays: number[];
      startTime: string;
      endTime: string;
    };
  };

  /**
   * Government and regulatory information
   */
  @Column({ type: 'json', nullable: true })
  regulatory: {
    centralBank?: string; // Central Bank of Syria
    regulationCode?: string;
    taxImplications?: string;
    importDutyRate?: number;
    vatRate?: number;
    sanctionsStatus?: 'none' | 'partial' | 'full';
    complianceNotes?: string;
  };

  /**
   * Display priority for UI ordering
   */
  @Column({ type: 'int', default: 100 })
  displayOrder: number;

  /**
   * Notes and additional information
   */
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Exchange rate history for analytics and tracking
 */
@Entity('exchange_rate_history')
@Index(['currencyCode', 'date'])
@Index(['date', 'source'])
export class ExchangeRateHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Currency this rate applies to
   */
  @Column({ length: 3 })
  @Index()
  currencyCode: string;

  /**
   * Exchange rate to SYP
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 6,
  })
  rate: number;

  /**
   * Date of this exchange rate
   */
  @Column({ type: 'date' })
  @Index()
  date: Date;

  /**
   * Source of exchange rate
   */
  @Column({ length: 100 })
  source: string;

  /**sss
   * Additional rate metadata
   */
  @Column({ type: 'json', nullable: true })
  metadata: {
    bidRate?: number;
    askRate?: number;
    midRate?: number;
    volume?: number;
    volatility?: number;
    marketHours?: boolean;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

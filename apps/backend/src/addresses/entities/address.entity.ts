import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Region } from '../region/entities/region.entity';
import { Country } from '../country/entities/country.entity';
import { City } from '../city/entities/city.entity';
import {
  SyrianGovernorateEntity,
  SyrianCityEntity,
  SyrianDistrictEntity,
} from './index';

/**
 * @file address.entity.ts
 * @description Stores user addresses (shipping, billing) for SouqSyria.
 * Supports multi-address, default, notes, GPS, and lookup tables.
 */
@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The user this address belongs to
   */
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Human-readable label (e.g., "Home", "Work")
   */
  @Column({ nullable: true })
  label: string;

  /**
   * Type: "shipping" or "billing" (could be enum)
   */
  @Column({ default: 'shipping' })
  addressType: 'shipping' | 'billing';

  /**
   * Country relation (normalized)
   */
  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country: Country;

  /**
   * Region/State relation (normalized)
   */
  @ManyToOne(() => Region, { nullable: true })
  @JoinColumn({ name: 'region_id' })
  region: Region;

  /**
   * City relation (normalized)
   */
  @ManyToOne(() => City, { nullable: true })
  @JoinColumn({ name: 'city_id' })
  city: City;

  /**
   * Main address line (street, building, etc.)
   * For Syrian addresses, this stores the street from the form
   */
  @Column({ nullable: true })
  addressLine1: string;

  /**
   * Optional address line (apartment, suite, etc.)
   */
  @Column({ nullable: true })
  addressLine2: string;

  /**
   * Zip or postal code
   */
  @Column({ nullable: true })
  postalCode: string;

  /**
   * Contact phone for delivery
   */
  @Column({ nullable: true })
  phone: string;

  /**
   * Extra notes (e.g., "Ring the bell", "Leave at reception")
   */
  @Column({ nullable: true })
  notes: string;

  /**
   * Is this the user's default address? (per type)
   */
  @Column({ default: false })
  isDefault: boolean;

  /**
   * Latitude for GPS (nullable)
   */
  @Column('decimal', { nullable: true, precision: 10, scale: 7 })
  latitude: number;

  /**
   * Longitude for GPS (nullable)
   */
  @Column('decimal', { nullable: true, precision: 10, scale: 7 })
  longitude: number;

  // ═══════════════════════════════════════════════════════════════════════
  // SYRIAN-SPECIFIC ADDRESS FIELDS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Full name of the recipient (supports Arabic names)
   * Example: "أحمد محمد الخطيب" or "Ahmad Mohammad Al-Khatib"
   */
  @Column({ name: 'full_name', nullable: true, length: 128 })
  fullName: string;

  /**
   * Syrian governorate relation (محافظة)
   * Links to Syrian administrative division system
   */
  @ManyToOne(() => SyrianGovernorateEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  /**
   * Syrian city relation (مدينة/بلدة)
   * Part of Syrian administrative structure
   * Note: Separate from generic 'city' field for Syrian-specific addresses
   */
  @ManyToOne(() => SyrianCityEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'city_id_syrian' })
  syrianCity: SyrianCityEntity;

  /**
   * Syrian district/neighborhood relation (حي/منطقة)
   * Finest granularity in Syrian address system
   * Example: "Old Damascus", "Al-Hamidiyah", etc.
   */
  @ManyToOne(() => SyrianDistrictEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'district_id' })
  district: SyrianDistrictEntity;

  /**
   * Building name or number
   * Example: "بناء السلام", "Building 42", "مجمع الفردوس"
   */
  @Column({ nullable: true, length: 64 })
  building: string;

  /**
   * Floor number or description
   * Example: "3", "الطابق الثالث", "Ground Floor"
   */
  @Column({ nullable: true, length: 16 })
  floor: string;

  /**
   * Additional delivery details and instructions
   * Example: "بجانب الصيدلية", "Near the pharmacy", "Last building on the left"
   */
  @Column({ name: 'additional_details', nullable: true, length: 256 })
  additionalDetails: string;

  /**
   * Soft delete column
   */
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  /**
   * Timestamps
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

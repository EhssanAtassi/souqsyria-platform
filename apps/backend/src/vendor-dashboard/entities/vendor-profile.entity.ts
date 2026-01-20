/**
 * @file vendor-profile.entity.ts
 * @description Entity for extended vendor profile information
 *
 * Purpose: Store detailed vendor business information for dashboard and public profile
 * Used for: Vendor profile management, store page display, business information
 *
 * @swagger VendorProfile
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VendorEntity } from '../../vendors/entities/vendor.entity';

/**
 * Business category enum for vendor classification
 */
export enum VendorBusinessCategory {
  DAMASCUS_STEEL = 'damascus_steel',
  TEXTILES = 'textiles',
  FOOD_BEVERAGE = 'food_beverage',
  CRAFTS = 'crafts',
  JEWELRY = 'jewelry',
  BEAUTY = 'beauty',
  HOME_DECOR = 'home_decor',
  OTHER = 'other',
}

/**
 * VendorProfile Entity
 *
 * Extended vendor information beyond basic vendor entity
 * One-to-one relationship with VendorEntity
 *
 * Key Features:
 * - Bilingual store information (EN/AR)
 * - Detailed business information
 * - Social media integration
 * - Business hours and policies
 * - Syrian marketplace specific fields (governorate, phone format)
 *
 * Security: One-to-one relationship ensures single profile per vendor
 */
@Entity('vendor_profiles')
@Index(['vendorId'], { unique: true }) // One profile per vendor
export class VendorProfile {
  /**
   * Primary key - auto-generated UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * One-to-one relationship with Vendor entity
   * ON DELETE CASCADE ensures cleanup when vendor is deleted
   */
  @OneToOne(() => VendorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  /**
   * Vendor ID for indexed queries
   */
  @Column({ name: 'vendor_id', type: 'int', unique: true })
  vendorId: number;

  /**
   * Store name in English
   */
  @Column({ name: 'store_name_en', type: 'varchar', length: 100 })
  storeNameEn: string;

  /**
   * Store name in Arabic
   */
  @Column({ name: 'store_name_ar', type: 'varchar', length: 100 })
  storeNameAr: string;

  /**
   * Business description in English
   */
  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string;

  /**
   * Business description in Arabic
   */
  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string;

  /**
   * Business contact email
   */
  @Column({ name: 'email', type: 'varchar', length: 255 })
  email: string;

  /**
   * Business contact phone (Syrian format: +963XXXXXXXXX)
   */
  @Column({ name: 'phone', type: 'varchar', length: 20 })
  phone: string;

  /**
   * Business category classification
   */
  @Column({
    name: 'business_category',
    type: 'enum',
    enum: VendorBusinessCategory,
    default: VendorBusinessCategory.OTHER,
  })
  businessCategory: VendorBusinessCategory;

  /**
   * Store logo URL
   */
  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string;

  /**
   * Store banner/cover image URL
   */
  @Column({ name: 'banner_url', type: 'varchar', length: 500, nullable: true })
  bannerUrl: string;

  /**
   * Physical store address (full JSON object)
   *
   * JSON Structure:
   * {
   *   street: string,
   *   cityEn: string,
   *   cityAr: string,
   *   governorateEn: string,
   *   governorateAr: string,
   *   postalCode: string,
   *   latitude: number,
   *   longitude: number
   * }
   */
  @Column({ name: 'address', type: 'json', nullable: true })
  address: any;

  /**
   * Social media profile links
   *
   * JSON Structure:
   * {
   *   facebook: string,
   *   instagram: string,
   *   whatsapp: string,
   *   twitter: string
   * }
   */
  @Column({ name: 'social_media', type: 'json', nullable: true })
  socialMedia: any;

  /**
   * Business operating hours
   *
   * JSON Structure:
   * [
   *   {
   *     day: string,
   *     openTime: string (HH:MM),
   *     closeTime: string (HH:MM),
   *     isClosed: boolean
   *   }
   * ]
   */
  @Column({ name: 'business_hours', type: 'json', nullable: true })
  businessHours: any;

  /**
   * Year business was established
   */
  @Column({ name: 'established_year', type: 'int', nullable: true })
  establishedYear: number;

  /**
   * Syrian business registration number
   */
  @Column({ name: 'registration_number', type: 'varchar', length: 100, nullable: true })
  registrationNumber: string;

  /**
   * Business policies
   *
   * JSON Structure:
   * {
   *   acceptsReturns: boolean,
   *   returnPolicyDays: number,
   *   minimumOrderSyp: number,
   *   freeShippingThresholdSyp: number,
   *   averageShippingDays: number,
   *   returnPolicyTextEn: string,
   *   returnPolicyTextAr: string,
   *   shippingPolicyTextEn: string,
   *   shippingPolicyTextAr: string
   * }
   */
  @Column({ name: 'policies', type: 'json', nullable: true })
  policies: any;

  /**
   * Syrian VAT registration status
   */
  @Column({ name: 'is_vat_registered', type: 'boolean', default: false })
  isVatRegistered: boolean;

  /**
   * Syrian VAT registration number
   */
  @Column({ name: 'vat_number', type: 'varchar', length: 50, nullable: true })
  vatNumber: string;

  /**
   * Applicable VAT rate (Syrian standard: 10%)
   */
  @Column({
    name: 'vat_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10.0,
  })
  vatRate: number;

  /**
   * Bank account information for payouts (encrypted/masked)
   *
   * JSON Structure:
   * {
   *   bankName: string,
   *   accountLast4: string,
   *   accountHolderName: string,
   *   branchCode: string,
   *   iban: string (encrypted)
   * }
   */
  @Column({ name: 'bank_account', type: 'json', nullable: true })
  bankAccount: any;

  /**
   * Preferred payout method
   */
  @Column({ name: 'preferred_payout_method', type: 'varchar', length: 50, nullable: true })
  preferredPayoutMethod: string;

  /**
   * Public profile completion percentage (0-100)
   * Calculated based on filled fields
   */
  @Column({
    name: 'profile_completion',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  profileCompletion: number;

  /**
   * Whether profile is visible to public
   */
  @Column({ name: 'is_public', type: 'boolean', default: true })
  isPublic: boolean;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Business method: Calculate profile completion percentage
   */
  calculateProfileCompletion(): number {
    let completion = 0;
    const totalFields = 15; // Total number of key fields

    if (this.storeNameEn) completion++;
    if (this.storeNameAr) completion++;
    if (this.descriptionEn) completion++;
    if (this.descriptionAr) completion++;
    if (this.email) completion++;
    if (this.phone) completion++;
    if (this.logoUrl) completion++;
    if (this.bannerUrl) completion++;
    if (this.address) completion++;
    if (this.socialMedia && Object.keys(this.socialMedia).length > 0) completion++;
    if (this.businessHours && this.businessHours.length > 0) completion++;
    if (this.establishedYear) completion++;
    if (this.registrationNumber) completion++;
    if (this.policies) completion++;
    if (this.bankAccount) completion++;

    return (completion / totalFields) * 100;
  }

  /**
   * Business method: Update profile completion
   */
  updateProfileCompletion(): void {
    this.profileCompletion = this.calculateProfileCompletion();
  }
}

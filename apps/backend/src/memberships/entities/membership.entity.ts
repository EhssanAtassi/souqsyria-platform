/**
 * @file membership.entity.ts
 * @description Enhanced Entity representing Membership plans available for vendors
 * Updated to support comprehensive Syrian business features and seeding requirements
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Example: Basic, Premium, VIP, Enterprise

  @Column({ name: 'name_ar', nullable: true })
  nameAr: string; // Arabic name for Syrian localization

  @Column({ type: 'text', nullable: true })
  description: string; // English description

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string; // Arabic description

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number; // Price for the membership plan in SYP

  @Column({
    name: 'price_usd',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
  })
  priceUSD: number; // USD price for diaspora customers

  @Column({ name: 'duration_in_days' })
  durationInDays: number; // Validity of the plan (e.g., 30, 365)

  @Column({ name: 'max_products', nullable: true })
  maxProducts: number; // Limit for number of products (-1 for unlimited)

  @Column({ name: 'max_images_per_product', nullable: true })
  maxImagesPerProduct: number; // Limit number of images allowed per product

  @Column({ name: 'priority_support', default: false })
  prioritySupport: boolean; // Whether the vendor gets priority support

  @Column({
    name: 'commission_discount',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  commissionDiscount: number; // Discount in selling commission %

  @Column({ name: 'is_popular', default: false })
  isPopular: boolean; // Mark as popular/recommended plan

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Whether the plan is currently available

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number; // Display order

  @Column({ name: 'target_audience', type: 'text', nullable: true })
  targetAudience: string; // Target audience description

  @Column({ name: 'target_audience_ar', type: 'text', nullable: true })
  targetAudienceAr: string; // Arabic target audience description

  @Column({ name: 'business_type', nullable: true })
  businessType: string; // individual, small_business, medium_business, enterprise

  @Column({
    name: 'renewal_discount',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  renewalDiscount: number; // Percentage discount for renewal

  @Column({
    name: 'upgrade_discount',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  upgradeDiscount: number; // Percentage discount when upgrading

  // Syrian Business Features
  @Column({ name: 'tax_reporting', default: false })
  taxReporting: boolean; // Syrian tax reporting features

  @Column({ name: 'governorate_analytics', default: false })
  governorateAnalytics: boolean; // Syrian governorate analytics

  @Column({ name: 'multi_currency_support', default: false })
  multiCurrencySupport: boolean; // SYP/USD/EUR support

  @Column({ name: 'diaspora_customer_tools', default: false })
  diasporaCustomerTools: boolean; // Tools for diaspora customers

  @Column({ name: 'local_shipping_integration', default: true })
  localShippingIntegration: boolean; // Syrian shipping companies

  @Column({ name: 'arabic_customization', default: true })
  arabicCustomization: boolean; // Arabic UI customization

  @Column({ name: 'bulk_import_tools', default: false })
  bulkImportTools: boolean; // Bulk product import

  @Column({ name: 'advanced_analytics', default: false })
  advancedAnalytics: boolean; // Advanced analytics features

  @Column({ name: 'api_access', default: false })
  apiAccess: boolean; // API access for integrations

  @Column({ name: 'white_label', default: false })
  whiteLabel: boolean; // White-label customization

  // Limitations and Features (JSON stored as text)
  @Column({ name: 'features', type: 'json', nullable: true })
  features: string[]; // List of features

  @Column({ name: 'features_ar', type: 'json', nullable: true })
  featuresAr: string[]; // Arabic features list

  @Column({ name: 'limitations', type: 'json', nullable: true })
  limitations: {
    categoryLimit?: number;
    monthlyOrderLimit?: number;
    storageGB?: number;
    apiCallsPerMonth?: number;
    customBrandingElements?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

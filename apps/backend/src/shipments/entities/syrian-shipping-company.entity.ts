/**
 * @file syrian-shipping-company.entity.ts
 * @description Syrian local shipping companies with comprehensive localization
 *
 * FEATURES:
 * - Local Syrian shipping companies (Damascus Express, Aleppo Delivery, etc.)
 * - Bilingual support (Arabic/English)
 * - Coverage areas by governorate and city
 * - SYP pricing and cost structures
 * - Local contact information and working hours
 * - Service types and delivery options
 * - Performance metrics and reliability scores
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Shipment } from './shipment.entity';
import { SyrianGovernorateEntity } from '../../addresses/entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../../addresses/entities/syrian-city.entity';

/**
 * Syrian shipping company types
 */
export enum SyrianShippingType {
  LOCAL_COURIER = 'local_courier', // محلي
  EXPRESS_DELIVERY = 'express_delivery', // توصيل سريع
  STANDARD_POST = 'standard_post', // بريد عادي
  MOTORCYCLE = 'motorcycle', // دراجة نارية
  TRUCK_DELIVERY = 'truck_delivery', // شاحنة
  WALKING_COURIER = 'walking_courier', // مشي
  INTER_CITY = 'inter_city', // بين المحافظات
}

/**
 * Delivery service types offered
 */
export interface DeliveryService {
  id: string;
  nameEn: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  baseCostSYP: number;
  costPerKmSYP: number;
  estimatedDeliveryHours: number;
  maxWeightKg: number;
  isActive: boolean;
  workingHours: {
    start: string; // "09:00"
    end: string; // "18:00"
    days: string[]; // ["sunday", "monday", ...]
  };
}

/**
 * Coverage area definition
 */
export interface CoverageArea {
  governorateId: number;
  governorateName: string;
  governorateNameAr: string;
  cities: Array<{
    cityId: number;
    cityName: string;
    cityNameAr: string;
    deliveryFee: number; // SYP
    estimatedHours: number;
    isActive: boolean;
    specialInstructions?: string;
    specialInstructionsAr?: string;
  }>;
  baseFee: number; // Base SYP fee for this governorate
  isActive: boolean;
}

/**
 * Performance metrics tracking
 */
export interface PerformanceMetrics {
  deliverySuccessRate: number; // Percentage
  averageDeliveryTime: number; // Hours
  customerRating: number; // 1-5 stars
  totalDeliveries: number;
  onTimeDeliveries: number;
  lastUpdated: Date;
  monthlyStats: Array<{
    month: string;
    deliveries: number;
    successRate: number;
    averageTime: number;
  }>;
}

@Entity('syrian_shipping_companies')
@Index(['companyType', 'isActive'])
@Index(['nameEn', 'nameAr'])
export class SyrianShippingCompanyEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique shipping company ID' })
  id: number;

  /**
   * Company name in English
   */
  @Column({ length: 200 })
  @ApiProperty({
    description: 'Shipping company name in English',
    example: 'Damascus Express Delivery',
  })
  nameEn: string;

  /**
   * Company name in Arabic
   */
  @Column({ length: 200 })
  @ApiProperty({
    description: 'Shipping company name in Arabic',
    example: 'شركة دمشق للتوصيل السريع',
  })
  nameAr: string;

  /**
   * Company description in English
   */
  @Column({ type: 'text' })
  @ApiProperty({
    description: 'Company description in English',
    example:
      'Fast and reliable delivery service across Damascus and surrounding areas',
  })
  descriptionEn: string;

  /**
   * Company description in Arabic
   */
  @Column({ type: 'text' })
  @ApiProperty({
    description: 'Company description in Arabic',
    example: 'خدمة توصيل سريعة وموثوقة في دمشق والمناطق المحيطة',
  })
  descriptionAr: string;

  /**
   * Company type/category
   */
  @Column({
    type: 'enum',
    enum: SyrianShippingType,
    default: SyrianShippingType.LOCAL_COURIER,
  })
  @Index()
  @ApiProperty({
    description: 'Type of shipping service',
    enum: SyrianShippingType,
    example: SyrianShippingType.EXPRESS_DELIVERY,
  })
  companyType: SyrianShippingType;

  /**
   * Contact information
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Company contact details',
    example: {
      phone: '+963-11-1234567',
      mobile: '+963-987-654321',
      whatsapp: '+963-987-654321',
      email: 'info@damascusexpress.sy',
      website: 'https://damascusexpress.sy',
      address: 'Damascus, Mazzeh District',
      addressAr: 'دمشق، حي المزة',
    },
  })
  contactInfo: {
    phone?: string;
    mobile?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    address?: string;
    addressAr?: string;
    emergencyContact?: string;
  };

  /**
   * Coverage areas - governorates and cities served
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Areas covered by this shipping company',
    example: [
      {
        governorateId: 1,
        governorateName: 'Damascus',
        governorateNameAr: 'دمشق',
        cities: [
          {
            cityId: 1,
            cityName: 'Damascus City',
            cityNameAr: 'مدينة دمشق',
            deliveryFee: 2000,
            estimatedHours: 2,
            isActive: true,
          },
        ],
        baseFee: 1500,
        isActive: true,
      },
    ],
  })
  coverageAreas: CoverageArea[];

  /**
   * Available delivery services
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Delivery services offered',
    example: [
      {
        id: 'same_day',
        nameEn: 'Same Day Delivery',
        nameAr: 'التوصيل في نفس اليوم',
        description: 'Delivery within the same day',
        descriptionAr: 'التوصيل في نفس اليوم',
        baseCostSYP: 3000,
        costPerKmSYP: 500,
        estimatedDeliveryHours: 6,
        maxWeightKg: 10,
        isActive: true,
        workingHours: {
          start: '09:00',
          end: '18:00',
          days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        },
      },
    ],
  })
  services: DeliveryService[];

  /**
   * Pricing structure
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Pricing and cost structure in SYP',
    example: {
      baseFee: 1500,
      perKmRate: 300,
      weightRates: [
        { maxKg: 5, rateSYP: 0 },
        { maxKg: 10, rateSYP: 500 },
        { maxKg: 20, rateSYP: 1500 },
      ],
      expressFee: 2000,
      weekendFee: 1000,
      holidayFee: 1500,
      codFee: 500,
      insuranceFee: 200,
      fuelSurcharge: 300,
    },
  })
  pricing: {
    baseFee: number; // Base delivery fee in SYP
    perKmRate: number; // Cost per kilometer in SYP
    weightRates: Array<{
      // Weight-based pricing
      maxKg: number;
      rateSYP: number;
    }>;
    expressFee?: number; // Express delivery surcharge
    weekendFee?: number; // Weekend delivery fee
    holidayFee?: number; // Holiday delivery fee
    codFee?: number; // Cash on delivery fee
    insuranceFee?: number; // Insurance fee per 100,000 SYP
    fuelSurcharge?: number; // Current fuel surcharge
  };

  /**
   * Working schedule
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Company working hours and schedule',
    example: {
      workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      workingHours: { start: '09:00', end: '18:00' },
      breakTime: { start: '13:00', end: '14:00' },
      weekendService: true,
      holidayService: false,
      emergencyService: true,
      emergencyHours: { start: '19:00', end: '22:00' },
      timeZone: 'Asia/Damascus',
    },
  })
  schedule: {
    workingDays: string[]; // Days of the week
    workingHours: {
      start: string;
      end: string;
    };
    breakTime?: {
      start: string;
      end: string;
    };
    weekendService: boolean;
    holidayService: boolean;
    emergencyService: boolean;
    emergencyHours?: {
      start: string;
      end: string;
    };
    timeZone: string;
  };

  /**
   * Performance tracking
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Company performance metrics and statistics',
    example: {
      deliverySuccessRate: 96.5,
      averageDeliveryTime: 4.2,
      customerRating: 4.7,
      totalDeliveries: 15420,
      onTimeDeliveries: 14890,
      lastUpdated: '2025-08-09T10:00:00.000Z',
    },
  })
  performanceMetrics: PerformanceMetrics;

  /**
   * Special requirements and capabilities
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Special services and requirements',
    example: {
      codSupported: true,
      signatureRequired: true,
      photoProofAvailable: true,
      trackingAvailable: true,
      smsNotifications: true,
      whatsappNotifications: true,
      specialHandling: ['fragile', 'electronics', 'documents'],
      vehicleTypes: ['motorcycle', 'car', 'van'],
      maxWeight: 50,
      maxDimensions: { length: 100, width: 80, height: 60 },
    },
  })
  capabilities: {
    codSupported: boolean; // Cash on delivery support
    signatureRequired: boolean; // Requires recipient signature
    photoProofAvailable: boolean; // Takes delivery photos
    trackingAvailable: boolean; // Provides tracking
    smsNotifications: boolean; // Sends SMS updates
    whatsappNotifications: boolean; // Sends WhatsApp updates
    specialHandling: string[]; // Special item handling
    vehicleTypes: string[]; // Available vehicle types
    maxWeight: number; // Maximum weight capacity (kg)
    maxDimensions: {
      // Maximum package dimensions (cm)
      length: number;
      width: number;
      height: number;
    };
  };

  /**
   * Integration settings
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'API and system integration settings',
    example: {
      apiEndpoint: 'https://api.damascusexpress.sy/v1',
      apiKey: 'encrypted_key_here',
      webhookUrl: 'https://souqsyria.com/webhooks/damascus-express',
      trackingUrl: 'https://track.damascusexpress.sy/{trackingNumber}',
      autoStatusUpdate: true,
      testMode: false,
    },
  })
  integration?: {
    apiEndpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
    autoStatusUpdate?: boolean;
    testMode?: boolean;
    lastSync?: Date;
  };

  /**
   * Company status and verification
   */
  @Column({ type: 'json' })
  @ApiProperty({
    description: 'Company verification and status information',
    example: {
      isVerified: true,
      verificationDate: '2025-01-15T00:00:00.000Z',
      licenseNumber: 'SY-SHIP-2025-001',
      insuranceValid: true,
      contractStatus: 'active',
      paymentTerms: 'monthly',
      commission: 8.5,
    },
  })
  companyStatus: {
    isVerified: boolean; // Company verification status
    verificationDate?: Date; // When company was verified
    licenseNumber?: string; // Government license number
    insuranceValid: boolean; // Insurance coverage status
    contractStatus: string; // Contract status with platform
    paymentTerms: string; // Payment terms
    commission: number; // Commission percentage
  };

  /**
   * Active status
   */
  @Column({ default: true })
  @Index()
  @ApiProperty({
    description: 'Whether company is currently active',
    example: true,
  })
  isActive: boolean;

  /**
   * Display priority (for sorting)
   */
  @Column({ default: 100 })
  @ApiProperty({
    description: 'Display priority (lower numbers show first)',
    example: 10,
  })
  displayPriority: number;

  /**
   * Relationships
   */
  @OneToMany(() => Shipment, (shipment) => shipment.syrianShippingCompany)
  shipments: Shipment[];

  @ManyToMany(() => SyrianGovernorateEntity)
  @JoinTable({ name: 'shipping_company_governorates' })
  governorates: SyrianGovernorateEntity[];

  @ManyToMany(() => SyrianCityEntity)
  @JoinTable({ name: 'shipping_company_cities' })
  cities: SyrianCityEntity[];

  /**
   * Timestamps
   */
  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

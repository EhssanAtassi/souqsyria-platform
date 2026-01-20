/**
 * @file syrian-address-main.entity.ts
 * @description Main Syrian address entity with comprehensive localization and delivery features
 *
 * FEATURES:
 * - Complete Syrian address hierarchy (Governorate > City > District)
 * - Bilingual support (Arabic/English) for all address components
 * - Delivery instructions and logistics optimization
 * - Address validation and verification system
 * - Usage statistics and performance tracking
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SyrianGovernorateEntity } from './syrian-governorate.entity';
import { SyrianCityEntity } from './syrian-city.entity';
import { SyrianDistrictEntity } from './syrian-district.entity';
import {
  AddressType,
  AddressStatus,
  VerificationMethod,
  ContactPreference,
} from './address-enums';

/**
 * Enhanced Syrian address entity with comprehensive localization
 *
 * This is the main address entity that combines all Syrian address components
 * with additional features for e-commerce delivery optimization:
 * - Full address hierarchy with governorate, city, and district
 * - Bilingual address components in Arabic and English
 * - Geographic coordinates for mapping and route optimization
 * - Delivery instructions and customer preferences
 * - Address validation and verification tracking
 * - Usage statistics for performance monitoring
 */
@Entity('syrian_addresses')
@Index(['governorate', 'city'])
@Index(['postalCode'])
@Index(['latitude', 'longitude'])
export class SyrianAddressEntity {
  @ApiProperty({ description: 'Unique identifier for the address' })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Address type classification
   */
  @ApiProperty({
    description: 'Type of address for delivery optimization',
    enum: AddressType,
    example: AddressType.RESIDENTIAL,
    default: AddressType.RESIDENTIAL,
  })
  @Column({
    type: 'enum',
    enum: AddressType,
    default: AddressType.RESIDENTIAL,
  })
  addressType: AddressType;

  /**
   * Governorate (first-level administrative division)
   */
  @ApiProperty({
    description: 'Syrian governorate this address belongs to',
    type: () => SyrianGovernorateEntity,
  })
  @ManyToOne(() => SyrianGovernorateEntity)
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  /**
   * City (second-level administrative division)
   */
  @ApiProperty({
    description: 'Syrian city this address belongs to',
    type: () => SyrianCityEntity,
  })
  @ManyToOne(() => SyrianCityEntity)
  @JoinColumn({ name: 'city_id' })
  city: SyrianCityEntity;

  /**
   * District (optional third-level administrative division)
   */
  @ApiProperty({
    description: 'Syrian district this address belongs to (optional)',
    type: () => SyrianDistrictEntity,
    nullable: true,
  })
  @ManyToOne(() => SyrianDistrictEntity, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district: SyrianDistrictEntity;

  /**
   * Street name in English
   */
  @ApiProperty({
    description: 'Street name in English',
    example: 'Umayyad Square Street',
    maxLength: 200,
    nullable: true,
  })
  @Column({ length: 200, nullable: true })
  streetEn: string;

  /**
   * Street name in Arabic
   */
  @ApiProperty({
    description: 'Street name in Arabic',
    example: 'شارع ساحة الأمويين',
    maxLength: 200,
    nullable: true,
  })
  @Column({ length: 200, nullable: true })
  streetAr: string;

  /**
   * Building number or name
   */
  @ApiProperty({
    description: 'Building number or name',
    example: '123A',
    maxLength: 50,
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  buildingNumber: string;

  /**
   * Floor number
   */
  @ApiProperty({
    description: 'Floor number',
    example: '3',
    maxLength: 20,
    nullable: true,
  })
  @Column({ length: 20, nullable: true })
  floor: string;

  /**
   * Apartment or office number
   */
  @ApiProperty({
    description: 'Apartment or office number',
    example: 'Apt 5B',
    maxLength: 50,
    nullable: true,
  })
  @Column({ length: 50, nullable: true })
  apartmentNumber: string;

  /**
   * Postal code
   */
  @ApiProperty({
    description: 'Syrian postal code',
    example: '12345',
    maxLength: 10,
    nullable: true,
  })
  @Column({ length: 10, nullable: true })
  postalCode: string;

  /**
   * Additional address details in English
   */
  @ApiProperty({
    description: 'Additional address details in English',
    example: 'Near the blue mosque, second entrance',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  additionalDetailsEn: string;

  /**
   * Additional address details in Arabic
   */
  @ApiProperty({
    description: 'Additional address details in Arabic',
    example: 'بالقرب من المسجد الأزرق، المدخل الثاني',
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  additionalDetailsAr: string;

  /**
   * Landmark references for navigation
   */
  @ApiProperty({
    description: 'Landmarks and navigation references',
    type: 'object',
    properties: {
      nearby: {
        type: 'array',
        items: { type: 'string' },
        description: 'Nearby landmarks and points of interest',
      },
      directions: {
        type: 'string',
        description: 'Detailed directions to the address',
      },
      publicTransport: {
        type: 'array',
        items: { type: 'string' },
        description: 'Nearby public transport stations',
      },
      emergencyServices: {
        type: 'array',
        items: { type: 'string' },
        description: 'Nearby emergency services (hospital, police, etc.)',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  landmarks: {
    nearby?: string[];
    directions?: string;
    publicTransport?: string[];
    emergencyServices?: string[];
  };

  /**
   * Geographic coordinates for delivery optimization
   */
  @ApiProperty({
    description: 'Latitude coordinate for precise location',
    example: 33.5138,
    type: 'number',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate for precise location',
    example: 36.2765,
    type: 'number',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  /**
   * Address verification status
   */
  @ApiProperty({
    description: 'Current verification status of the address',
    enum: AddressStatus,
    example: AddressStatus.VERIFIED,
    default: AddressStatus.PENDING_VERIFICATION,
  })
  @Column({
    type: 'enum',
    enum: AddressStatus,
    default: AddressStatus.PENDING_VERIFICATION,
  })
  status: AddressStatus;

  /**
   * Delivery instructions and preferences
   */
  @ApiProperty({
    description: 'Delivery instructions and customer preferences',
    type: 'object',
    properties: {
      preferredTimeSlots: {
        type: 'array',
        items: { type: 'string' },
        description: 'Preferred delivery time slots',
      },
      accessInstructions: {
        type: 'string',
        description: 'Instructions for accessing the address',
      },
      contactPreferences: {
        type: 'array',
        items: { type: 'string', enum: Object.values(ContactPreference) },
        description: 'Preferred contact methods',
      },
      alternativeContact: {
        type: 'string',
        description: 'Alternative contact information',
      },
      securityCode: {
        type: 'string',
        description: 'Building or gate security code',
      },
      restrictions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Delivery restrictions or special requirements',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  deliveryInstructions: {
    preferredTimeSlots?: string[];
    accessInstructions?: string;
    contactPreferences?: ContactPreference[];
    alternativeContact?: string;
    securityCode?: string;
    restrictions?: string[];
  };

  /**
   * Address validation metadata
   */
  @ApiProperty({
    description: 'Address validation and verification metadata',
    type: 'object',
    properties: {
      verifiedBy: {
        type: 'string',
        description: 'ID of person/system that verified the address',
      },
      verifiedAt: {
        type: 'string',
        format: 'date-time',
        description: 'When the address was verified',
      },
      verificationMethod: {
        type: 'string',
        enum: Object.values(VerificationMethod),
        description: 'Method used to verify the address',
      },
      confidenceScore: {
        type: 'number',
        minimum: 0,
        maximum: 100,
        description: 'Confidence score of address accuracy (0-100)',
      },
      issues: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any issues found during validation',
      },
      corrections: {
        type: 'object',
        additionalProperties: true,
        description: 'Corrections made during validation',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  validation: {
    verifiedBy?: string;
    verifiedAt?: Date;
    verificationMethod?: VerificationMethod;
    confidenceScore?: number; // 0-100
    issues?: string[];
    corrections?: Record<string, any>;
  };

  /**
   * Usage statistics for performance monitoring
   */
  @ApiProperty({
    description: 'Usage statistics and performance metrics',
    type: 'object',
    properties: {
      deliveryCount: {
        type: 'number',
        description: 'Total number of deliveries to this address',
      },
      lastDeliveryAt: {
        type: 'string',
        format: 'date-time',
        description: 'When the last delivery was made',
      },
      successfulDeliveryRate: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Percentage of successful deliveries (0-1)',
      },
      averageDeliveryTime: {
        type: 'number',
        description: 'Average delivery time in hours',
      },
      customerSatisfactionScore: {
        type: 'number',
        minimum: 1,
        maximum: 5,
        description: 'Customer satisfaction score (1-5)',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  usage: {
    deliveryCount?: number;
    lastDeliveryAt?: Date;
    successfulDeliveryRate?: number;
    averageDeliveryTime?: number;
    customerSatisfactionScore?: number;
  };

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

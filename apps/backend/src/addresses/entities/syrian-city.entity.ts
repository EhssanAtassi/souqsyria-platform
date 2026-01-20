/**
 * @file syrian-city.entity.ts
 * @description Syrian cities and towns entity with logistics and infrastructure data
 *
 * FEATURES:
 * - Comprehensive city information for all Syrian cities and towns
 * - Bilingual support (Arabic/English) with alternative name variants
 * - Postal code system integration
 * - Delivery logistics and infrastructure metadata
 * - Population and geographic data
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SyrianGovernorateEntity } from './syrian-governorate.entity';
import { SyrianDistrictEntity } from './syrian-district.entity';

/**
 * Syrian Cities and Towns (المدن والبلدات السورية)
 *
 * This entity represents cities, towns, villages, and other populated areas in Syria.
 * Each city belongs to a governorate and contains detailed information about:
 * - Geographic location and boundaries
 * - Infrastructure and services availability
 * - Delivery logistics and postal systems
 * - Economic and demographic characteristics
 */
@Entity('syrian_cities')
@Index(['governorate', 'nameEn'])
@Index(['governorate', 'nameAr'])
export class SyrianCityEntity {
  @ApiProperty({ description: 'Unique identifier for the city' })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Parent governorate
   */
  @ApiProperty({
    description: 'The governorate this city belongs to',
    type: () => SyrianGovernorateEntity,
  })
  @ManyToOne(() => SyrianGovernorateEntity, (governorate) => governorate.cities)
  @JoinColumn({ name: 'governorate_id' })
  governorate: SyrianGovernorateEntity;

  /**
   * City name in English
   */
  @ApiProperty({
    description: 'City name in English',
    example: 'Aleppo',
    maxLength: 100,
  })
  @Column({ length: 100 })
  nameEn: string;

  /**
   * City name in Arabic
   */
  @ApiProperty({
    description: 'City name in Arabic',
    example: 'حلب',
    maxLength: 100,
  })
  @Column({ length: 100 })
  nameAr: string;

  /**
   * Alternative names and spellings
   */
  @ApiProperty({
    description: 'Alternative names, spellings, and historical names',
    type: 'object',
    properties: {
      en: {
        type: 'array',
        items: { type: 'string' },
        description: 'Alternative English names',
      },
      ar: {
        type: 'array',
        items: { type: 'string' },
        description: 'Alternative Arabic names',
      },
      transliterations: {
        type: 'array',
        items: { type: 'string' },
        description: 'Different transliteration variants',
      },
      historicalNames: {
        type: 'array',
        items: { type: 'string' },
        description: 'Historical names of the city',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  alternativeNames: {
    en?: string[];
    ar?: string[];
    transliterations?: string[];
    historicalNames?: string[];
  };

  /**
   * City type classification
   */
  @ApiProperty({
    description: 'Classification of the populated area',
    enum: ['city', 'town', 'village', 'suburb', 'district'],
    example: 'city',
    default: 'city',
  })
  @Column({
    type: 'enum',
    enum: ['city', 'town', 'village', 'suburb', 'district'],
    default: 'city',
  })
  cityType: string;

  /**
   * Geographic coordinates
   */
  @ApiProperty({
    description: 'Latitude of city center',
    example: 36.2021,
    type: 'number',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({
    description: 'Longitude of city center',
    example: 37.1343,
    type: 'number',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  /**
   * Postal code prefix for this city
   */
  @ApiProperty({
    description: 'Postal code prefix for addresses in this city',
    example: '12',
    maxLength: 10,
    nullable: true,
  })
  @Column({ length: 10, nullable: true })
  postalCodePrefix: string;

  /**
   * Population estimate
   */
  @ApiProperty({
    description: 'Estimated population of the city',
    example: 2132100,
    type: 'integer',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  population: number;

  /**
   * Delivery and logistics information
   */
  @ApiProperty({
    description: 'Delivery logistics and shipping information',
    type: 'object',
    properties: {
      deliverySupported: {
        type: 'boolean',
        description: 'Whether delivery services are available',
      },
      averageDeliveryTime: {
        type: 'number',
        description: 'Average delivery time in hours',
      },
      deliveryZones: {
        type: 'array',
        items: { type: 'string' },
        description: 'Delivery zones within the city',
      },
      restrictions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Delivery restrictions or limitations',
      },
      preferredCarriers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Preferred shipping companies',
      },
      lastMileOptions: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['standard', 'express', 'pickup_point'],
        },
        description: 'Available last-mile delivery options',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  logistics: {
    deliverySupported: boolean;
    averageDeliveryTime: number; // hours
    deliveryZones?: string[];
    restrictions?: string[];
    preferredCarriers?: string[];
    lastMileOptions?: ('standard' | 'express' | 'pickup_point')[];
  };

  /**
   * Economic and infrastructure data
   */
  @ApiProperty({
    description: 'Infrastructure and services availability',
    type: 'object',
    properties: {
      hasPostOffice: {
        type: 'boolean',
        description: 'Whether city has a post office',
      },
      hasBank: {
        type: 'boolean',
        description: 'Whether city has banking services',
      },
      hasInternet: {
        type: 'boolean',
        description: 'Whether city has internet connectivity',
      },
      hasMobileNetwork: {
        type: 'boolean',
        description: 'Whether city has mobile network coverage',
      },
      roadQuality: {
        type: 'string',
        enum: ['good', 'fair', 'poor'],
        description: 'Quality of road infrastructure',
      },
      publicTransport: {
        type: 'boolean',
        description: 'Whether public transport is available',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  infrastructure: {
    hasPostOffice: boolean;
    hasBank: boolean;
    hasInternet: boolean;
    hasMobileNetwork: boolean;
    roadQuality: 'good' | 'fair' | 'poor';
    publicTransport: boolean;
  };

  /**
   * Display order within governorate
   */
  @ApiProperty({
    description: 'Display order within the governorate',
    example: 1,
    default: 100,
  })
  @Column({ type: 'int', default: 100 })
  displayOrder: number;

  /**
   * Whether this city is currently active for services
   */
  @ApiProperty({
    description: 'Whether this city is active for e-commerce services',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  /**
   * Districts in this city
   */
  @ApiProperty({
    description: 'List of districts within this city',
    type: () => [SyrianDistrictEntity],
    isArray: true,
  })
  @OneToMany(() => SyrianDistrictEntity, (district) => district.city)
  districts: SyrianDistrictEntity[];

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

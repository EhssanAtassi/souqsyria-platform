/**
 * @file syrian-governorate.entity.ts
 * @description Syrian governorates entity with comprehensive localization
 *
 * FEATURES:
 * - Official Syrian administrative divisions (all 14 governorates)
 * - Bilingual support (Arabic/English)
 * - Geographic coordinates and demographics
 * - Delivery and accessibility status tracking
 * - Economic and infrastructure metadata
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SyrianCityEntity } from './syrian-city.entity';

/**
 * Syrian Governorates (المحافظات السورية)
 * Based on official Syrian administrative divisions
 *
 * This entity represents the first-level administrative divisions of Syria.
 * Each governorate has unique characteristics including:
 * - Geographic boundaries and coordinates
 * - Economic and demographic data
 * - Current accessibility and delivery status
 * - Infrastructure and development levels
 */
@Entity('syrian_governorates')
export class SyrianGovernorateEntity {
  @ApiProperty({ description: 'Unique identifier for the governorate' })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Official governorate code (3-letter ISO format)
   * Examples: DMS (Damascus), ALP (Aleppo), HMS (Homs)
   */
  @ApiProperty({
    description: 'Official 3-letter governorate code',
    example: 'DMS',
    maxLength: 3,
  })
  @Column({ length: 3, unique: true })
  code: string;

  /**
   * Governorate name in English
   */
  @ApiProperty({
    description: 'Governorate name in English',
    example: 'Damascus',
    maxLength: 100,
  })
  @Column({ length: 100 })
  nameEn: string;

  /**
   * Governorate name in Arabic
   */
  @ApiProperty({
    description: 'Governorate name in Arabic',
    example: 'دمشق',
    maxLength: 100,
  })
  @Column({ length: 100 })
  nameAr: string;

  /**
   * Capital city of the governorate in English
   */
  @ApiProperty({
    description: 'Capital city name in English',
    example: 'Damascus',
    maxLength: 100,
  })
  @Column({ length: 100 })
  capitalEn: string;

  /**
   * Capital city in Arabic
   */
  @ApiProperty({
    description: 'Capital city name in Arabic',
    example: 'دمشق',
    maxLength: 100,
  })
  @Column({ length: 100 })
  capitalAr: string;

  /**
   * Geographic coordinates of governorate center
   */
  @ApiProperty({
    description: 'Latitude of governorate center',
    example: 33.5138,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @ApiProperty({
    description: 'Longitude of governorate center',
    example: 36.2765,
    type: 'number',
  })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  /**
   * Population estimate
   */
  @ApiProperty({
    description: 'Estimated population of the governorate',
    example: 2500000,
    type: 'integer',
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  population: number;

  /**
   * Area in square kilometers
   */
  @ApiProperty({
    description: 'Area of governorate in square kilometers',
    example: 18018.0,
    type: 'number',
    nullable: true,
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  areaKm2: number;

  /**
   * Current security and accessibility status
   */
  @ApiProperty({
    description:
      'Current status including accessibility and delivery information',
    type: 'object',
    properties: {
      accessibilityLevel: {
        type: 'string',
        enum: ['full', 'partial', 'limited', 'restricted'],
        description: 'Level of accessibility for commercial operations',
      },
      deliverySupported: {
        type: 'boolean',
        description: 'Whether delivery services are currently available',
      },
      lastUpdated: {
        type: 'string',
        format: 'date-time',
        description: 'When this status was last updated',
      },
      notes: {
        type: 'string',
        description: 'Additional notes about current conditions',
      },
      alternativeRoutes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Alternative delivery routes if main routes are blocked',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  status: {
    accessibilityLevel: 'full' | 'partial' | 'limited' | 'restricted';
    deliverySupported: boolean;
    lastUpdated: Date;
    notes?: string;
    alternativeRoutes?: string[];
  };

  /**
   * Economic and demographic data
   */
  @ApiProperty({
    description: 'Economic and demographic information',
    type: 'object',
    properties: {
      urbanPopulation: {
        type: 'number',
        description: 'Urban population count',
      },
      ruralPopulation: {
        type: 'number',
        description: 'Rural population count',
      },
      mainIndustries: {
        type: 'array',
        items: { type: 'string' },
        description: 'Primary industries in the governorate',
      },
      economicStatus: {
        type: 'string',
        enum: ['active', 'recovering', 'limited'],
        description: 'Current economic activity level',
      },
      infrastructureLevel: {
        type: 'string',
        enum: ['good', 'fair', 'poor'],
        description: 'Overall infrastructure quality',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  demographics: {
    urbanPopulation?: number;
    ruralPopulation?: number;
    mainIndustries?: string[];
    economicStatus?: 'active' | 'recovering' | 'limited';
    infrastructureLevel?: 'good' | 'fair' | 'poor';
  };

  /**
   * Display order for UI sorting
   */
  @ApiProperty({
    description: 'Display order for UI listing',
    example: 1,
    default: 100,
  })
  @Column({ type: 'int', default: 100 })
  displayOrder: number;

  /**
   * Whether this governorate is currently active for services
   */
  @ApiProperty({
    description: 'Whether this governorate is active for e-commerce services',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  /**
   * Cities in this governorate
   */
  @ApiProperty({
    description: 'List of cities within this governorate',
    type: () => [SyrianCityEntity],
    isArray: true,
  })
  @OneToMany(() => SyrianCityEntity, (city) => city.governorate)
  cities: SyrianCityEntity[];

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

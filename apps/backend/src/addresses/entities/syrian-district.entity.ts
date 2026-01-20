/**
 * @file syrian-district.entity.ts
 * @description Syrian districts and neighborhoods entity with detailed characteristics
 *
 * FEATURES:
 * - Detailed district and neighborhood information
 * - Bilingual support (Arabic/English)
 * - Geographic boundaries and landmarks
 * - Postal code system integration
 * - Socioeconomic and development characteristics
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
import { SyrianCityEntity } from './syrian-city.entity';

/**
 * Syrian Districts and Neighborhoods (الأحياء والمناطق)
 *
 * This entity represents districts, neighborhoods, quarters, and other sub-city divisions.
 * Each district belongs to a city and provides detailed information about:
 * - Geographic boundaries and center coordinates
 * - Postal code assignments
 * - Socioeconomic characteristics
 * - Development and safety levels
 * - Residential and commercial patterns
 */
@Entity('syrian_districts')
@Index(['city', 'nameEn'])
export class SyrianDistrictEntity {
  @ApiProperty({ description: 'Unique identifier for the district' })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Parent city
   */
  @ApiProperty({
    description: 'The city this district belongs to',
    type: () => SyrianCityEntity,
  })
  @ManyToOne(() => SyrianCityEntity, (city) => city.districts)
  @JoinColumn({ name: 'city_id' })
  city: SyrianCityEntity;

  /**
   * District name in English
   */
  @ApiProperty({
    description: 'District name in English',
    example: 'Old City',
    maxLength: 100,
  })
  @Column({ length: 100 })
  nameEn: string;

  /**
   * District name in Arabic
   */
  @ApiProperty({
    description: 'District name in Arabic',
    example: 'المدينة القديمة',
    maxLength: 100,
  })
  @Column({ length: 100 })
  nameAr: string;

  /**
   * District type classification
   */
  @ApiProperty({
    description: 'Type classification of the area',
    enum: ['district', 'neighborhood', 'quarter', 'suburb', 'area'],
    example: 'district',
    default: 'district',
  })
  @Column({
    type: 'enum',
    enum: ['district', 'neighborhood', 'quarter', 'suburb', 'area'],
    default: 'district',
  })
  districtType: string;

  /**
   * Postal code for this district
   */
  @ApiProperty({
    description: 'Specific postal code for this district',
    example: '12345',
    maxLength: 10,
    nullable: true,
  })
  @Column({ length: 10, nullable: true })
  postalCode: string;

  /**
   * Geographic boundaries and landmarks
   */
  @ApiProperty({
    description: 'Geographic boundaries and landmark information',
    type: 'object',
    properties: {
      centerLatitude: {
        type: 'number',
        description: 'Latitude of district center',
      },
      centerLongitude: {
        type: 'number',
        description: 'Longitude of district center',
      },
      boundingBox: {
        type: 'object',
        properties: {
          north: { type: 'number' },
          south: { type: 'number' },
          east: { type: 'number' },
          west: { type: 'number' },
        },
        description: 'Geographic bounding box coordinates',
      },
      landmarks: {
        type: 'array',
        items: { type: 'string' },
        description: 'Notable landmarks in the district',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  boundaries: {
    centerLatitude?: number;
    centerLongitude?: number;
    boundingBox?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    landmarks?: string[];
  };

  /**
   * Socioeconomic and development characteristics
   */
  @ApiProperty({
    description: 'Characteristics and demographics of the district',
    type: 'object',
    properties: {
      residentialType: {
        type: 'string',
        enum: ['mixed', 'residential', 'commercial', 'industrial'],
        description: 'Primary land use pattern',
      },
      densityLevel: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Population density level',
      },
      developmentLevel: {
        type: 'string',
        enum: ['developed', 'developing', 'underdeveloped'],
        description: 'Infrastructure development level',
      },
      safetyLevel: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'General safety and security level',
      },
      averageIncomeLevel: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Average household income level',
      },
    },
    nullable: true,
  })
  @Column({ type: 'json', nullable: true })
  characteristics: {
    residentialType: 'mixed' | 'residential' | 'commercial' | 'industrial';
    densityLevel: 'high' | 'medium' | 'low';
    developmentLevel: 'developed' | 'developing' | 'underdeveloped';
    safetyLevel: 'high' | 'medium' | 'low';
    averageIncomeLevel: 'high' | 'medium' | 'low';
  };

  /**
   * Display order within city
   */
  @ApiProperty({
    description: 'Display order within the city',
    example: 1,
    default: 100,
  })
  @Column({ type: 'int', default: 100 })
  displayOrder: number;

  /**
   * Whether this district is currently active for services
   */
  @ApiProperty({
    description: 'Whether this district is active for e-commerce services',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Record last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

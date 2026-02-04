/**
 * @file syrian-manufacturer.dto.ts
 * @description Enterprise DTOs for Syrian Manufacturer Management
 *
 * FEATURES:
 * - Comprehensive validation for Syrian business requirements
 * - Arabic/English dual language support with RTL validation
 * - Business registration and compliance validation
 * - Advanced search and filtering parameters
 * - Performance optimized with proper validation rules
 * - Full Swagger documentation with examples
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUrl,
  IsObject,
  IsNumber,
  IsBoolean,
  IsEmail,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  SyrianManufacturerVerificationStatus,
  SyrianManufacturerBusinessType,
  SyrianManufacturerSizeCategory,
} from '../entities/syrian-manufacturer.entity';

/**
 * Social media links DTO
 */
export class SocialMediaLinksDto {
  @ApiProperty({
    description: 'Facebook page URL',
    example: 'https://facebook.com/syrtech.official',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiProperty({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/syrtech_sy',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiProperty({
    description: 'LinkedIn company page URL',
    example: 'https://linkedin.com/company/syrtech',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiProperty({
    description: 'Twitter profile URL',
    example: 'https://twitter.com/syrtech_sy',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiProperty({
    description: 'YouTube channel URL',
    example: 'https://youtube.com/c/SyrTechOfficial',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  youtube?: string;
}

/**
 * Marketing preferences DTO
 */
export class MarketingPreferencesDto {
  @ApiProperty({
    description: 'Allow email marketing communications',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allowEmailMarketing?: boolean;

  @ApiProperty({
    description: 'Allow SMS marketing communications',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  allowSmsMarketing?: boolean;

  @ApiProperty({
    description: 'Preferred language for communications',
    enum: ['en', 'ar', 'both'],
    example: 'ar',
    required: false,
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  preferredLanguage?: 'en' | 'ar' | 'both';

  @ApiProperty({
    description: 'Preferred contact frequency',
    enum: ['daily', 'weekly', 'monthly', 'never'],
    example: 'weekly',
    required: false,
  })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'never'])
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
}

/**
 * Manufacturer metadata DTO
 */
export class ManufacturerMetadataDto {
  @ApiProperty({
    description: 'Business specializations',
    example: ['electronics', 'automotive_parts', 'textiles'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiProperty({
    description: 'Quality certifications',
    example: ['ISO_9001', 'ISO_14001', 'OHSAS_18001'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty({
    description: 'Export markets',
    example: ['UAE', 'Jordan', 'Lebanon', 'Iraq'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exportMarkets?: string[];

  @ApiProperty({
    description: 'Custom fields for additional data',
    example: {
      productionCapacity: '10000 units/month',
      qualityGrade: 'A+',
      establishedSince: '1995',
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

/**
 * Verification documents DTO
 */
export class VerificationDocumentsDto {
  @ApiProperty({
    description: 'Commercial registry document URL',
    example: 'https://storage.souqsyria.com/docs/registry.pdf',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  commercialRegistry?: string;

  @ApiProperty({
    description: 'Tax certificate document URL',
    example: 'https://storage.souqsyria.com/docs/tax-cert.pdf',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  taxCertificate?: string;

  @ApiProperty({
    description: 'Industrial license document URL',
    example: 'https://storage.souqsyria.com/docs/industrial-license.pdf',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  industrialLicense?: string;

  @ApiProperty({
    description: 'Quality certificates URLs',
    example: [
      'https://storage.souqsyria.com/docs/iso-9001.pdf',
      'https://storage.souqsyria.com/docs/iso-14001.pdf',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  qualityCertificates?: string[];

  @ApiProperty({
    description: 'Export/import documents URLs',
    example: ['https://storage.souqsyria.com/docs/export-license.pdf'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  exportDocuments?: string[];
}

/**
 * Create manufacturer DTO
 */
export class CreateSyrianManufacturerDto {
  @ApiProperty({
    description: 'Manufacturer name in English',
    example: 'Syrian Electronics Manufacturing Co.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({
    description: 'Manufacturer name in Arabic',
    example: 'شركة الصناعات الإلكترونية السورية',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nameAr: string;

  @ApiProperty({
    description: 'Brand/trademark name in English',
    example: 'SyrTech',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  brandNameEn?: string;

  @ApiProperty({
    description: 'Brand/trademark name in Arabic',
    example: 'سيرتك',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  brandNameAr?: string;

  @ApiProperty({
    description: 'Detailed description in English',
    example:
      'Leading Syrian manufacturer of consumer electronics and industrial equipment since 1995.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionEn?: string;

  @ApiProperty({
    description: 'Detailed description in Arabic',
    example:
      'شركة رائدة في تصنيع الإلكترونيات الاستهلاكية والمعدات الصناعية منذ عام 1995.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descriptionAr?: string;

  @ApiProperty({
    description: 'Type of manufacturing business',
    enum: SyrianManufacturerBusinessType,
    example: SyrianManufacturerBusinessType.LOCAL_MANUFACTURER,
  })
  @IsNotEmpty()
  @IsEnum(SyrianManufacturerBusinessType)
  businessType: SyrianManufacturerBusinessType;

  @ApiProperty({
    description: 'Company size category',
    enum: SyrianManufacturerSizeCategory,
    example: SyrianManufacturerSizeCategory.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianManufacturerSizeCategory)
  sizeCategory?: SyrianManufacturerSizeCategory;

  @ApiProperty({
    description: 'Approximate number of employees',
    example: 75,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50000)
  employeeCount?: number;

  @ApiProperty({
    description: 'Year the company was founded',
    example: 1995,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  foundedYear?: number;

  @ApiProperty({
    description: 'Syrian tax identification number',
    example: 'TAX-SYR-123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^TAX-SYR-\d{9,12}$/, {
    message: 'Syrian Tax ID must follow format: TAX-SYR-XXXXXXXXX',
  })
  syrianTaxId?: string;

  @ApiProperty({
    description: 'Syrian commercial registry number',
    example: 'REG-DAM-2023-001234',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^REG-[A-Z]{2,3}-\d{4}-\d{6}$/, {
    message: 'Commercial Registry must follow format: REG-XXX-YYYY-XXXXXX',
  })
  commercialRegistry?: string;

  @ApiProperty({
    description: 'Industrial license number',
    example: 'IND-LIC-DM-456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  industrialLicense?: string;

  @ApiProperty({
    description: 'Export/import license number',
    example: 'EXP-IMP-789123',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  exportLicense?: string;

  @ApiProperty({
    description: 'Primary Syrian governorate ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14) // Syria has 14 governorates
  governorateId?: number;

  @ApiProperty({
    description: 'Full address in English',
    example: 'Industrial Zone, Damascus, Building 15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressEn?: string;

  @ApiProperty({
    description: 'Full address in Arabic',
    example: 'المنطقة الصناعية، دمشق، المبنى رقم 15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressAr?: string;

  @ApiProperty({
    description: 'Primary phone number in Syrian format',
    example: '+963-11-1234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+963-\d{2,3}-\d{6,7}$/, {
    message: 'Phone must follow Syrian format: +963-XX-XXXXXXX',
  })
  phone?: string;

  @ApiProperty({
    description: 'Mobile phone number in Syrian format',
    example: '+963-987-654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+963-9\d{8}$/, {
    message: 'Mobile must follow Syrian format: +963-9XXXXXXXX',
  })
  mobile?: string;

  @ApiProperty({
    description: 'Primary email address',
    example: 'info@syrtech.sy',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiProperty({
    description: 'Official website URL',
    example: 'https://www.syrtech.sy',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  website?: string;

  @ApiProperty({
    description: 'Logo image URL',
    example: 'https://storage.souqsyria.com/manufacturers/syrtech-logo.png',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    description: 'Banner/cover image URL',
    example: 'https://storage.souqsyria.com/manufacturers/syrtech-banner.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiProperty({
    description: 'Gallery images URLs',
    example: [
      'https://storage.souqsyria.com/manufacturers/syrtech-factory-1.jpg',
      'https://storage.souqsyria.com/manufacturers/syrtech-products.jpg',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  galleryImages?: string[];

  @ApiProperty({
    description: 'Social media platform links',
    type: SocialMediaLinksDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMediaLinks?: SocialMediaLinksDto;

  @ApiProperty({
    description: 'Marketing and communication preferences',
    type: MarketingPreferencesDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MarketingPreferencesDto)
  marketingPreferences?: MarketingPreferencesDto;

  @ApiProperty({
    description: 'Additional metadata and custom fields',
    type: ManufacturerMetadataDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ManufacturerMetadataDto)
  metadata?: ManufacturerMetadataDto;
}

/**
 * Update manufacturer DTO
 */
export class UpdateSyrianManufacturerDto extends PartialType(
  CreateSyrianManufacturerDto,
) {
  @ApiProperty({
    description: 'Verification documents for compliance',
    type: VerificationDocumentsDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VerificationDocumentsDto)
  verificationDocuments?: VerificationDocumentsDto;
}

/**
 * Manufacturer verification DTO
 */
export class VerifyManufacturerDto {
  @ApiProperty({
    description: 'New verification status',
    enum: [
      SyrianManufacturerVerificationStatus.VERIFIED,
      SyrianManufacturerVerificationStatus.REJECTED,
      SyrianManufacturerVerificationStatus.SUSPENDED,
    ],
    example: SyrianManufacturerVerificationStatus.VERIFIED,
  })
  @IsNotEmpty()
  @IsEnum([
    SyrianManufacturerVerificationStatus.VERIFIED,
    SyrianManufacturerVerificationStatus.REJECTED,
    SyrianManufacturerVerificationStatus.SUSPENDED,
  ])
  status: SyrianManufacturerVerificationStatus;

  @ApiProperty({
    description: 'Verification notes in English',
    example:
      'All documents verified successfully. Company meets all requirements.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  verificationNotesEn: string;

  @ApiProperty({
    description: 'Verification notes in Arabic',
    example: 'تم التحقق من جميع الوثائق بنجاح. الشركة تلبي جميع المتطلبات.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  verificationNotesAr: string;

  @ApiProperty({
    description: 'Send notification to manufacturer',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean;
}

/**
 * Manufacturer search and filter query DTO
 */
export class ManufacturerQueryDto {
  @ApiProperty({
    description: 'Search term for manufacturer names and brands',
    example: 'Syrian Electronics',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;

  @ApiProperty({
    description: 'Filter by verification status',
    enum: SyrianManufacturerVerificationStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianManufacturerVerificationStatus)
  verificationStatus?: SyrianManufacturerVerificationStatus;

  @ApiProperty({
    description: 'Filter by business type',
    enum: SyrianManufacturerBusinessType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianManufacturerBusinessType)
  businessType?: SyrianManufacturerBusinessType;

  @ApiProperty({
    description: 'Filter by size category',
    enum: SyrianManufacturerSizeCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianManufacturerSizeCategory)
  sizeCategory?: SyrianManufacturerSizeCategory;

  @ApiProperty({
    description: 'Filter by governorate ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(14)
  governorateId?: number;

  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by featured status',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Filter manufacturers with products only',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  hasProducts?: boolean;

  @ApiProperty({
    description: 'Minimum quality score (0-100)',
    example: 80,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minQualityScore?: number;

  @ApiProperty({
    description: 'Minimum average rating (0-5)',
    example: 4.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiProperty({
    description: 'Sort field',
    enum: [
      'createdAt',
      'updatedAt',
      'nameEn',
      'nameAr',
      'qualityScore',
      'totalProducts',
      'averageRating',
    ],
    example: 'qualityScore',
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'createdAt',
    'updatedAt',
    'nameEn',
    'nameAr',
    'qualityScore',
    'totalProducts',
    'averageRating',
  ])
  sortBy?:
    | 'createdAt'
    | 'updatedAt'
    | 'nameEn'
    | 'nameAr'
    | 'qualityScore'
    | 'totalProducts'
    | 'averageRating';

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiProperty({
    description: 'Number of items per page (max 100)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiProperty({
    description: 'Include inactive/deleted manufacturers',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeInactive?: boolean;
}

/**
 * Bulk manufacturer action DTO
 */
export class BulkManufacturerActionDto {
  @ApiProperty({
    description: 'Array of manufacturer IDs to process',
    example: [1, 2, 3, 4, 5],
  })
  @IsNotEmpty()
  @IsArray()
  @IsInt({ each: true })
  manufacturerIds: number[];

  @ApiProperty({
    description: 'Target verification status for bulk operation',
    enum: [
      SyrianManufacturerVerificationStatus.VERIFIED,
      SyrianManufacturerVerificationStatus.REJECTED,
      SyrianManufacturerVerificationStatus.SUSPENDED,
    ],
    example: SyrianManufacturerVerificationStatus.VERIFIED,
  })
  @IsNotEmpty()
  @IsEnum([
    SyrianManufacturerVerificationStatus.VERIFIED,
    SyrianManufacturerVerificationStatus.REJECTED,
    SyrianManufacturerVerificationStatus.SUSPENDED,
  ])
  targetStatus: SyrianManufacturerVerificationStatus;

  @ApiProperty({
    description: 'Reason for bulk action (English)',
    example: 'Bulk verification after document review',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  @ApiProperty({
    description: 'Reason for bulk action (Arabic)',
    example: 'تحقق جماعي بعد مراجعة الوثائق',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reasonAr: string;
}

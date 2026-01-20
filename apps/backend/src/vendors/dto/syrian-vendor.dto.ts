/**
 * @file syrian-vendor.dto.ts
 * @description Enterprise DTOs for Syrian Vendor Management
 *
 * FEATURES:
 * - Comprehensive validation for Syrian vendor operations
 * - Arabic/English dual language support
 * - Syrian business type and regulation validation
 * - Geographic validation for Syrian governorates
 * - Performance and workflow parameter handling
 * - Full Swagger documentation with localized examples
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsArray,
  IsObject,
  IsInt,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
  Min,
  Max,
  Length,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import {
  SyrianVendorVerificationStatus,
  SyrianBusinessType,
  SyrianVendorCategory,
} from '../entities/syrian-vendor.entity';

/**
 * Geographic coordinates DTO
 */
export class GeographicCoordinatesDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 33.5138,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 36.2765,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'GPS accuracy in meters',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}

/**
 * Social media links DTO
 */
export class SocialMediaLinksDto {
  @ApiPropertyOptional({
    description: 'Facebook page URL',
    example: 'https://facebook.com/mystore',
  })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/mystore',
  })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({
    description: 'Twitter profile URL',
    example: 'https://twitter.com/mystore',
  })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn company page URL',
    example: 'https://linkedin.com/company/mystore',
  })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({
    description: 'Telegram channel URL',
    example: 'https://t.me/mystoreofficial',
  })
  @IsOptional()
  @IsUrl()
  telegram?: string;
}

/**
 * Business hours DTO
 */
export class BusinessHoursDto {
  @ApiPropertyOptional({
    description: 'Sunday hours',
    example: { open: '09:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  sunday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Monday hours',
    example: { open: '09:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  monday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Tuesday hours',
    example: { open: '09:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  tuesday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Wednesday hours',
    example: { open: '09:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  wednesday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Thursday hours',
    example: { open: '09:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  thursday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Friday hours',
    example: { open: '13:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  friday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Saturday hours',
    example: { open: '09:00', close: '17:00', closed: false },
  })
  @IsOptional()
  @IsObject()
  saturday?: { open: string; close: string; closed?: boolean };

  @ApiPropertyOptional({
    description: 'Business timezone',
    example: 'Asia/Damascus',
  })
  @IsOptional()
  @IsString()
  timezone?: string;
}

/**
 * Shipping method DTO
 */
export class ShippingMethodDto {
  @ApiProperty({
    description: 'Shipping method ID',
    example: 'standard_delivery',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Shipping method name (English)',
    example: 'Standard Delivery',
  })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiProperty({
    description: 'Shipping method name (Arabic)',
    example: 'التوصيل العادي',
  })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiProperty({
    description: 'Estimated delivery time in days',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(30)
  estimatedDays: number;

  @ApiProperty({
    description: 'Shipping cost in SYP',
    example: 5000,
  })
  @IsInt()
  @Min(0)
  costSyp: number;
}

/**
 * Create Syrian vendor DTO
 */
export class CreateSyrianVendorDto {
  @ApiProperty({
    description: 'User ID associated with the vendor',
    example: 123,
  })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    description: 'Store name in English',
    example: 'Damascus Electronics Store',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  storeNameEn: string;

  @ApiProperty({
    description: 'Store name in Arabic',
    example: 'متجر دمشق للإلكترونيات',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  storeNameAr: string;

  @ApiPropertyOptional({
    description: 'Store description in English',
    example:
      'Leading electronics retailer in Damascus with 15 years of experience',
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  storeDescriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Store description in Arabic',
    example: 'متجر إلكترونيات رائد في دمشق مع خبرة 15 عاماً',
  })
  @IsOptional()
  @IsString()
  @Length(10, 2000)
  storeDescriptionAr?: string;

  @ApiProperty({
    description: 'Syrian business type',
    enum: SyrianBusinessType,
    example: SyrianBusinessType.LIMITED_LIABILITY,
  })
  @IsEnum(SyrianBusinessType)
  businessType: SyrianBusinessType;

  @ApiProperty({
    description: 'Vendor category',
    enum: SyrianVendorCategory,
    example: SyrianVendorCategory.RETAILER,
  })
  @IsEnum(SyrianVendorCategory)
  vendorCategory: SyrianVendorCategory;

  @ApiProperty({
    description: 'Syrian governorate ID',
    example: 1,
    minimum: 1,
    maximum: 14,
  })
  @IsInt()
  @Min(1)
  @Max(14)
  governorateId: number;

  @ApiProperty({
    description: 'City name in English',
    example: 'Damascus',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  cityNameEn: string;

  @ApiProperty({
    description: 'City name in Arabic',
    example: 'دمشق',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  cityNameAr: string;

  @ApiProperty({
    description: 'Street address in English',
    example: '123 Straight Street, Old Damascus',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  streetAddressEn: string;

  @ApiProperty({
    description: 'Street address in Arabic',
    example: '١٢٣ شارع المستقيم، دمشق القديمة',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  streetAddressAr: string;

  @ApiProperty({
    description: 'Primary phone number',
    example: '+963944123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  primaryPhone: string;

  @ApiProperty({
    description: 'Business email address',
    example: 'contact@damascuselectronics.sy',
  })
  @IsEmail()
  @IsNotEmpty()
  businessEmail: string;

  @ApiPropertyOptional({
    description: 'Store logo URL',
    example: 'https://storage.souqsyria.com/logos/store123.png',
  })
  @IsOptional()
  @IsUrl()
  storeLogoUrl?: string;

  @ApiPropertyOptional({
    description: 'Store banner URL',
    example: 'https://storage.souqsyria.com/banners/store123.jpg',
  })
  @IsOptional()
  @IsUrl()
  storeBannerUrl?: string;

  @ApiPropertyOptional({
    description: 'Commercial register number',
    example: 'CR-12345-DMS',
  })
  @IsOptional()
  @IsString()
  @Length(5, 50)
  commercialRegisterNumber?: string;

  @ApiPropertyOptional({
    description: 'Syrian tax ID number',
    example: 'TAX-98765-SY',
  })
  @IsOptional()
  @IsString()
  @Length(5, 50)
  taxIdNumber?: string;

  @ApiPropertyOptional({
    description: 'District name in English',
    example: 'Bab Touma',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  districtNameEn?: string;

  @ApiPropertyOptional({
    description: 'District name in Arabic',
    example: 'باب توما',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  districtNameAr?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  @Length(4, 20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Geographic coordinates',
    type: GeographicCoordinatesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeographicCoordinatesDto)
  geographicCoordinates?: GeographicCoordinatesDto;

  @ApiPropertyOptional({
    description: 'Secondary phone number',
    example: '+963933987654',
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  secondaryPhone?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number',
    example: '+963944123456',
  })
  @IsOptional()
  @IsString()
  @Length(8, 20)
  whatsappNumber?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://damascuselectronics.sy',
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Social media links',
    type: SocialMediaLinksDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMediaLinks?: SocialMediaLinksDto;

  @ApiPropertyOptional({
    description: 'Industrial license number',
    example: 'IND-54321-DMS',
  })
  @IsOptional()
  @IsString()
  @Length(5, 50)
  industrialLicenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Business hours',
    type: BusinessHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto;

  @ApiPropertyOptional({
    description: 'Processing time in days',
    example: 3,
    minimum: 1,
    maximum: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  processingTimeDays?: number;

  @ApiPropertyOptional({
    description: 'Available shipping methods',
    type: [ShippingMethodDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingMethodDto)
  shippingMethods?: ShippingMethodDto[];

  @ApiPropertyOptional({
    description: 'Return policy in English',
    example: '30-day return policy for all electronics',
  })
  @IsOptional()
  @IsString()
  @Length(50, 2000)
  returnPolicyEn?: string;

  @ApiPropertyOptional({
    description: 'Return policy in Arabic',
    example: 'سياسة إرجاع لمدة ٣٠ يوماً لجميع الأجهزة الإلكترونية',
  })
  @IsOptional()
  @IsString()
  @Length(50, 2000)
  returnPolicyAr?: string;

  @ApiPropertyOptional({
    description: 'Preferred language',
    enum: ['en', 'ar', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  preferredLanguage?: 'en' | 'ar' | 'both';

  @ApiPropertyOptional({
    description: 'Use Arabic numerals in display',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  useArabicNumerals?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { specialOffers: true, loyaltyProgram: false },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Vendor tags for categorization',
    example: ['electronics', 'smartphones', 'laptops'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * Update Syrian vendor DTO
 */
export class UpdateSyrianVendorDto extends PartialType(CreateSyrianVendorDto) {}

/**
 * Vendor verification workflow DTO
 */
export class VendorWorkflowActionDto {
  @ApiProperty({
    description: 'Vendor ID to perform action on',
    example: 123,
  })
  @IsInt()
  @Min(1)
  vendorId: number;

  @ApiPropertyOptional({
    description: 'Action notes or comments',
    example: 'Documents verified successfully',
  })
  @IsOptional()
  @IsString()
  @Length(10, 1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Suspension duration in days (for suspend action)',
    example: 30,
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  suspensionDurationDays?: number;
}

/**
 * Vendor analytics query DTO
 */
export class VendorAnalyticsQueryDto {
  @ApiProperty({
    description: 'Start date for analytics period',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for analytics period',
    example: '2025-08-10T23:59:59.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Filter by governorate IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(14, { each: true })
  governorateIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    enum: SyrianVendorVerificationStatus,
    example: SyrianVendorVerificationStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(SyrianVendorVerificationStatus)
  verificationStatus?: SyrianVendorVerificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by business type',
    enum: SyrianBusinessType,
    example: SyrianBusinessType.LIMITED_LIABILITY,
  })
  @IsOptional()
  @IsEnum(SyrianBusinessType)
  businessType?: SyrianBusinessType;

  @ApiPropertyOptional({
    description: 'Filter by vendor category',
    enum: SyrianVendorCategory,
    example: SyrianVendorCategory.RETAILER,
  })
  @IsOptional()
  @IsEnum(SyrianVendorCategory)
  vendorCategory?: SyrianVendorCategory;

  @ApiPropertyOptional({
    description: 'Minimum quality score filter',
    example: 80,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minQualityScore?: number;

  @ApiPropertyOptional({
    description: 'Include performance metrics',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  includePerformanceMetrics?: boolean;

  @ApiPropertyOptional({
    description: 'Language for response',
    enum: ['en', 'ar', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  language?: 'en' | 'ar' | 'both';
}

/**
 * Vendor search query DTO
 */
export class VendorSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for vendor names',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  searchTerm?: string;

  @ApiPropertyOptional({
    description: 'Filter by governorate IDs',
    example: [1, 2],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  governorateIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    enum: SyrianVendorVerificationStatus,
    example: SyrianVendorVerificationStatus.VERIFIED,
  })
  @IsOptional()
  @IsEnum(SyrianVendorVerificationStatus)
  verificationStatus?: SyrianVendorVerificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by business type',
    enum: SyrianBusinessType,
    example: SyrianBusinessType.SOLE_PROPRIETORSHIP,
  })
  @IsOptional()
  @IsEnum(SyrianBusinessType)
  businessType?: SyrianBusinessType;

  @ApiPropertyOptional({
    description: 'Filter by vendor category',
    enum: SyrianVendorCategory,
    example: SyrianVendorCategory.RETAILER,
  })
  @IsOptional()
  @IsEnum(SyrianVendorCategory)
  vendorCategory?: SyrianVendorCategory;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by featured status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum quality score',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minQualityScore?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: [
      'createdAt',
      'qualityScore',
      'totalOrders',
      'totalRevenueSyp',
      'storeNameEn',
      'storeNameAr',
    ],
    example: 'qualityScore',
  })
  @IsOptional()
  @IsEnum([
    'createdAt',
    'qualityScore',
    'totalOrders',
    'totalRevenueSyp',
    'storeNameEn',
    'storeNameAr',
  ])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Response language',
    enum: ['en', 'ar', 'both'],
    example: 'both',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'])
  language?: 'en' | 'ar' | 'both';
}

/**
 * Bulk vendor action DTO
 */
export class BulkVendorActionDto {
  @ApiProperty({
    description: 'Array of vendor IDs to perform action on',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  vendorIds: number[];

  @ApiProperty({
    description: 'Action to perform',
    enum: ['activate', 'deactivate', 'feature', 'unfeature', 'updatePriority'],
    example: 'activate',
  })
  @IsEnum(['activate', 'deactivate', 'feature', 'unfeature', 'updatePriority'])
  action: string;

  @ApiPropertyOptional({
    description: 'Action parameters (varies by action type)',
    example: { priority: 'high' },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Reason for bulk action',
    example: 'Quarterly review activation',
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  reason?: string;
}

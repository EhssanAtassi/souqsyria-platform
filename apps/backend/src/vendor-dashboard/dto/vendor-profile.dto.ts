/**
 * @file vendor-profile.dto.ts
 * @description DTOs for vendor profile data and profile update operations
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

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
 * Social media links DTO
 */
export class SocialMediaLinksDto {
  @ApiPropertyOptional({
    description: 'Facebook page URL',
    example: 'https://facebook.com/damascus-crafts',
  })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/damascus_crafts',
  })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp business number',
    example: '+963991234567',
  })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Twitter/X profile URL',
    example: 'https://twitter.com/damascus_crafts',
  })
  @IsOptional()
  @IsUrl()
  twitter?: string;
}

/**
 * Business hours DTO
 */
export class BusinessHoursDto {
  @ApiProperty({
    description: 'Day of the week',
    example: 'Monday',
  })
  @IsString()
  day: string;

  @ApiProperty({
    description: 'Opening time (24-hour format)',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format' })
  openTime: string;

  @ApiProperty({
    description: 'Closing time (24-hour format)',
    example: '18:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Time must be in HH:MM format' })
  closeTime: string;

  @ApiProperty({
    description: 'Whether the store is closed on this day',
    example: false,
  })
  isClosed: boolean;
}

/**
 * Vendor address DTO
 */
export class VendorAddressDto {
  @ApiProperty({
    description: 'Street address',
    example: 'Straight Street, Old Damascus',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'City name in English',
    example: 'Damascus',
  })
  @IsString()
  cityEn: string;

  @ApiProperty({
    description: 'City name in Arabic',
    example: 'دمشق',
  })
  @IsString()
  cityAr: string;

  @ApiProperty({
    description: 'Governorate name in English',
    example: 'Damascus',
  })
  @IsString()
  governorateEn: string;

  @ApiProperty({
    description: 'Governorate name in Arabic',
    example: 'دمشق',
  })
  @IsString()
  governorateAr: string;

  @ApiPropertyOptional({
    description: 'Postal/ZIP code',
    example: '11000',
  })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Geographic coordinates - latitude',
    example: 33.5138,
  })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Geographic coordinates - longitude',
    example: 36.2765,
  })
  @IsOptional()
  longitude?: number;
}

/**
 * Main vendor profile response DTO
 */
export class VendorProfileDto {
  @ApiProperty({
    description: 'Unique vendor identifier',
    example: 'vnd_abc123xyz',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Store name in English',
    example: 'Damascus Artisan Crafts',
  })
  @IsString()
  storeNameEn: string;

  @ApiProperty({
    description: 'Store name in Arabic',
    example: 'حرف دمشق اليدوية',
  })
  @IsString()
  storeNameAr: string;

  @ApiProperty({
    description: 'Business description in English',
    example: 'Authentic handcrafted Damascus steel products',
  })
  @IsString()
  descriptionEn: string;

  @ApiProperty({
    description: 'Business description in Arabic',
    example: 'منتجات الصلب الدمشقي الأصلية المصنوعة يدوياً',
  })
  @IsString()
  descriptionAr: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@damascus-crafts.sy',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+963991234567',
  })
  @IsPhoneNumber('SY')
  phone: string;

  @ApiProperty({
    description: 'Business category',
    enum: VendorBusinessCategory,
    example: VendorBusinessCategory.DAMASCUS_STEEL,
  })
  @IsEnum(VendorBusinessCategory)
  businessCategory: VendorBusinessCategory;

  @ApiProperty({
    description: 'Store logo URL',
    example: 'https://cdn.souqsyria.com/vendors/damascus-crafts/logo.jpg',
  })
  @IsUrl()
  logoUrl: string;

  @ApiPropertyOptional({
    description: 'Store banner/cover image URL',
    example: 'https://cdn.souqsyria.com/vendors/damascus-crafts/banner.jpg',
  })
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiProperty({
    description: 'Physical store address',
    type: VendorAddressDto,
  })
  @ValidateNested()
  @Type(() => VendorAddressDto)
  address: VendorAddressDto;

  @ApiProperty({
    description: 'Social media profile links',
    type: SocialMediaLinksDto,
  })
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMedia: SocialMediaLinksDto;

  @ApiProperty({
    description: 'Business operating hours',
    type: [BusinessHoursDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursDto)
  businessHours: BusinessHoursDto[];

  @ApiProperty({
    description: 'Year business was established',
    example: 2018,
  })
  establishedYear: number;

  @ApiPropertyOptional({
    description: 'Business registration number',
    example: 'SY-DMC-2018-1234',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({
    description: 'Whether the vendor accepts returns',
    example: true,
  })
  acceptsReturns: boolean;

  @ApiProperty({
    description: 'Return policy duration in days',
    example: 14,
  })
  returnPolicyDays: number;

  @ApiPropertyOptional({
    description: 'Minimum order amount in SYP',
    example: 50000,
  })
  @IsOptional()
  minimumOrderSyp?: number;

  @ApiPropertyOptional({
    description: 'Free shipping threshold in SYP',
    example: 200000,
  })
  @IsOptional()
  freeShippingThresholdSyp?: number;

  @ApiProperty({
    description: 'Average shipping time in days',
    example: 3,
  })
  averageShippingDays: number;
}

/**
 * Update vendor profile DTO
 * Partial update - all fields optional except validation rules apply when provided
 */
export class UpdateVendorProfileDto extends PartialType(VendorProfileDto) {
  @ApiPropertyOptional({
    description: 'Store name in English',
    example: 'Damascus Artisan Crafts',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  storeNameEn?: string;

  @ApiPropertyOptional({
    description: 'Store name in Arabic',
    example: 'حرف دمشق اليدوية',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  storeNameAr?: string;

  @ApiPropertyOptional({
    description: 'Business description in English',
    example: 'Authentic handcrafted Damascus steel products',
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  descriptionEn?: string;

  @ApiPropertyOptional({
    description: 'Business description in Arabic',
    example: 'منتجات الصلب الدمشقي الأصلية المصنوعة يدوياً',
    minLength: 10,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  descriptionAr?: string;

  @ApiPropertyOptional({
    description: 'Contact email address',
    example: 'contact@damascus-crafts.sy',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+963991234567',
  })
  @IsOptional()
  @IsPhoneNumber('SY')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Business category',
    enum: VendorBusinessCategory,
    example: VendorBusinessCategory.DAMASCUS_STEEL,
  })
  @IsOptional()
  @IsEnum(VendorBusinessCategory)
  businessCategory?: VendorBusinessCategory;

  @ApiPropertyOptional({
    description: 'Social media profile links',
    type: SocialMediaLinksDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMedia?: SocialMediaLinksDto;

  @ApiPropertyOptional({
    description: 'Business operating hours',
    type: [BusinessHoursDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto[];
}

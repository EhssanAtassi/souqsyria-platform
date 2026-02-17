/**
 * @file create-syrian-address.dto.ts
 * @description DTO for creating Syrian addresses with full validation
 *
 * PURPOSE:
 * Validates and structures data for creating Syrian-specific addresses,
 * including administrative divisions, delivery details, and contact info.
 *
 * FEATURES:
 * - Full name support (Arabic/English)
 * - Syrian phone number validation (+963 format)
 * - Syrian administrative hierarchy (governorate → city → district)
 * - Building and floor details
 * - Additional delivery instructions
 * - Default address flag
 * - Address labeling (home, work, family, other)
 *
 * VALIDATION RULES:
 * - Phone must match Syrian format: +963XXXXXXXXX (9 digits after +963)
 * - Full name required, max 128 characters
 * - Street required, max 128 characters
 * - Building optional, max 64 characters
 * - Floor optional, max 16 characters
 * - Additional details optional, max 256 characters
 *
 * @author SouqSyria Development Team
 * @version 1.0.0 - MVP1 Syrian Address Support
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Matches,
  MaxLength,
  IsIn,
} from 'class-validator';

/**
 * Create Syrian Address DTO
 * Used for POST /addresses with Syrian administrative structure
 */
export class CreateSyrianAddressDto {
  /**
   * Full name of the recipient
   * Supports Arabic and English names
   * Example: "أحمد محمد الخطيب", "Ahmad Mohammad Al-Khatib"
   */
  @ApiProperty({
    description: 'Full name of the recipient (supports Arabic)',
    example: 'أحمد محمد الخطيب',
    maxLength: 128,
    required: true,
  })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @MaxLength(128, { message: 'Full name cannot exceed 128 characters' })
  fullName: string;

  /**
   * Syrian phone number in international format
   * Format: +963XXXXXXXXX (9 digits after country code)
   * Examples: "+963912345678", "+963991234567"
   */
  @ApiProperty({
    description: 'Syrian phone number in international format',
    example: '+963912345678',
    pattern: '^\\+963[0-9]{9}$',
    required: true,
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+963[0-9]{9}$/, {
    message: 'Phone must be a valid Syrian number in format +963XXXXXXXXX',
  })
  phone: string;

  /**
   * Syrian governorate ID (محافظة)
   * Reference to syrian_governorates table
   * Example: 1 = Damascus, 2 = Aleppo
   */
  @ApiProperty({
    description: 'Syrian governorate ID (محافظة)',
    example: 1,
    minimum: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'Governorate ID is required' })
  @IsNumber({}, { message: 'Governorate ID must be a number' })
  governorateId: number;

  /**
   * Syrian city ID (مدينة)
   * Reference to syrian_cities table
   * Must belong to the specified governorate
   */
  @ApiProperty({
    description: 'Syrian city ID (must belong to selected governorate)',
    example: 1,
    minimum: 1,
    required: true,
  })
  @IsNotEmpty({ message: 'City ID is required' })
  @IsNumber({}, { message: 'City ID must be a number' })
  cityId: number;

  /**
   * Syrian district ID (حي/منطقة) - Optional
   * Reference to syrian_districts table
   * Must belong to the specified city
   */
  @ApiProperty({
    description: 'Syrian district ID (optional, must belong to selected city)',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'District ID must be a number' })
  districtId?: number;

  /**
   * Street address (primary address line)
   * Example: "شارع الثورة", "Al-Thawra Street"
   */
  @ApiProperty({
    description: 'Street address (supports Arabic)',
    example: 'شارع الثورة',
    maxLength: 128,
    required: true,
  })
  @IsNotEmpty({ message: 'Street address is required' })
  @IsString({ message: 'Street must be a string' })
  @MaxLength(128, { message: 'Street cannot exceed 128 characters' })
  street: string;

  /**
   * Building name or number - Optional
   * Example: "بناء السلام", "Building 42"
   */
  @ApiProperty({
    description: 'Building name or number (optional)',
    example: 'بناء السلام',
    maxLength: 64,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Building must be a string' })
  @MaxLength(64, { message: 'Building cannot exceed 64 characters' })
  building?: string;

  /**
   * Floor number or description - Optional
   * Example: "3", "الطابق الثالث", "Ground Floor"
   */
  @ApiProperty({
    description: 'Floor number or description (optional)',
    example: '3',
    maxLength: 16,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Floor must be a string' })
  @MaxLength(16, { message: 'Floor cannot exceed 16 characters' })
  floor?: string;

  /**
   * Additional delivery details and instructions - Optional
   * Example: "بجانب الصيدلية", "Near the pharmacy"
   */
  @ApiProperty({
    description: 'Additional delivery details and instructions (optional)',
    example: 'بجانب الصيدلية',
    maxLength: 256,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Additional details must be a string' })
  @MaxLength(256, {
    message: 'Additional details cannot exceed 256 characters',
  })
  additionalDetails?: string;

  /**
   * Set this address as the default
   * If true, other default addresses for this user will be unset
   */
  @ApiProperty({
    description: 'Set as default address for the user',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isDefault must be a boolean' })
  isDefault?: boolean;

  /**
   * Address label for easy identification
   * Allowed values: 'home', 'work', 'family', 'other'
   */
  @ApiProperty({
    description: 'Address label for easy identification',
    example: 'home',
    enum: ['home', 'work', 'family', 'other'],
    default: 'home',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Label must be a string' })
  @IsIn(['home', 'work', 'family', 'other'], {
    message: 'Label must be one of: home, work, family, other',
  })
  @MaxLength(32, { message: 'Label cannot exceed 32 characters' })
  label?: string;
}

/**
 * @file create-refund.dto.ts
 * @description Create Syrian Refund DTO with Banking Integration
 *
 * FEATURES:
 * - Complete refund request creation with Syrian banking details
 * - Multi-currency support with validation
 * - Comprehensive validation with localized error messages
 * - Banking information validation for Syrian financial institutions
 * - Document upload support and evidence management
 * - Arabic/English localization preferences
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsPhoneNumber,
  IsArray,
  IsObject,
  ValidateNested,
  Min,
  Max,
  Length,
  Matches,
  IsDecimal,
  IsDateString,
  ArrayMaxSize,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
import {
  SyrianRefundMethod,
  SyrianBankType,
  RefundReasonCategory,
} from '../entities/syrian-refund.entity';

/**
 * Banking Information DTO for Syrian banks
 */
export class SyrianBankingInfoDto {
  @ApiProperty({
    description: 'Syrian bank type',
    enum: SyrianBankType,
    example: SyrianBankType.COMMERCIAL_BANK_OF_SYRIA,
  })
  @IsEnum(SyrianBankType, { message: 'Please select a valid Syrian bank' })
  @IsNotEmpty({ message: 'Bank type is required' })
  bankType: SyrianBankType;

  @ApiProperty({
    description: 'Bank name in English',
    example: 'Commercial Bank of Syria',
    maxLength: 255,
  })
  @IsString({ message: 'Bank name must be a string' })
  @IsNotEmpty({ message: 'Bank name in English is required' })
  @Length(2, 255, { message: 'Bank name must be between 2 and 255 characters' })
  bankNameEn: string;

  @ApiProperty({
    description: 'Bank name in Arabic',
    example: 'المصرف التجاري السوري',
    maxLength: 255,
  })
  @IsString({ message: 'Bank name in Arabic must be a string' })
  @IsNotEmpty({ message: 'Bank name in Arabic is required' })
  @Length(2, 255, {
    message: 'Bank name in Arabic must be between 2 and 255 characters',
  })
  bankNameAr: string;

  @ApiPropertyOptional({
    description: 'Bank branch code',
    example: 'CBS001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Bank branch code must be a string' })
  @Length(2, 20, {
    message: 'Bank branch code must be between 2 and 20 characters',
  })
  bankBranchCode?: string;

  @ApiPropertyOptional({
    description: 'Bank branch name in English',
    example: 'Damascus Main Branch',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Bank branch name must be a string' })
  @Length(2, 255, {
    message: 'Bank branch name must be between 2 and 255 characters',
  })
  bankBranchNameEn?: string;

  @ApiPropertyOptional({
    description: 'Bank branch name in Arabic',
    example: 'الفرع الرئيسي دمشق',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Bank branch name in Arabic must be a string' })
  @Length(2, 255, {
    message: 'Bank branch name in Arabic must be between 2 and 255 characters',
  })
  bankBranchNameAr?: string;

  @ApiProperty({
    description: 'Account holder full name',
    example: 'أحمد محمد علي',
    maxLength: 255,
  })
  @IsString({ message: 'Account holder name must be a string' })
  @IsNotEmpty({ message: 'Account holder name is required' })
  @Length(2, 255, {
    message: 'Account holder name must be between 2 and 255 characters',
  })
  accountHolderName: string;

  @ApiProperty({
    description: 'Bank account number',
    example: '1234567890123456',
    maxLength: 50,
  })
  @IsString({ message: 'Account number must be a string' })
  @IsNotEmpty({ message: 'Account number is required' })
  @Length(8, 50, {
    message: 'Account number must be between 8 and 50 characters',
  })
  @Matches(/^[0-9]+$/, { message: 'Account number must contain only numbers' })
  accountNumber: string;

  @ApiPropertyOptional({
    description: 'IBAN number (International Bank Account Number)',
    example: 'SY21CBSY00000012345678901234',
    maxLength: 34,
  })
  @IsOptional()
  @IsString({ message: 'IBAN must be a string' })
  @Length(15, 34, { message: 'IBAN must be between 15 and 34 characters' })
  @Matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/, {
    message: 'IBAN format is invalid',
  })
  ibanNumber?: string;

  @ApiPropertyOptional({
    description: 'Bank SWIFT code',
    example: 'CBSYSYDA',
    maxLength: 11,
  })
  @IsOptional()
  @IsString({ message: 'SWIFT code must be a string' })
  @Length(8, 11, { message: 'SWIFT code must be between 8 and 11 characters' })
  @Matches(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, {
    message: 'SWIFT code format is invalid',
  })
  swiftCode?: string;
}

/**
 * Evidence Document DTO
 */
export class EvidenceDocumentDto {
  @ApiProperty({
    description: 'Document type',
    enum: ['photo', 'video', 'receipt', 'bank_statement', 'other'],
    example: 'photo',
  })
  @IsEnum(['photo', 'video', 'receipt', 'bank_statement', 'other'], {
    message: 'Invalid document type',
  })
  @IsNotEmpty({ message: 'Document type is required' })
  type: 'photo' | 'video' | 'receipt' | 'bank_statement' | 'other';

  @ApiProperty({
    description: 'Original filename',
    example: 'damaged_product_photo.jpg',
    maxLength: 255,
  })
  @IsString({ message: 'Filename must be a string' })
  @IsNotEmpty({ message: 'Filename is required' })
  @Length(1, 255, { message: 'Filename must be between 1 and 255 characters' })
  filename: string;

  @ApiProperty({
    description: 'Document URL or storage path',
    example:
      'https://storage.souqsyria.com/refunds/evidence/12345/photo_001.jpg',
  })
  @IsUrl({}, { message: 'Document URL must be valid' })
  @IsNotEmpty({ message: 'Document URL is required' })
  url: string;

  @ApiPropertyOptional({
    description: 'Document description or notes',
    example: 'Product damage visible on the front side',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'Document description must be a string' })
  @Length(0, 500, {
    message: 'Document description must not exceed 500 characters',
  })
  description?: string;
}

/**
 * Create Syrian Refund Request DTO
 */
export class CreateRefundDto {
  // ========================================
  // CORE REFUND INFORMATION
  // ========================================

  @ApiProperty({
    description: 'Order ID for which refund is requested',
    example: 12345,
  })
  @IsNumber({}, { message: 'Order ID must be a number' })
  @IsNotEmpty({ message: 'Order ID is required' })
  @Min(1, { message: 'Order ID must be a positive number' })
  orderId: number;

  @ApiProperty({
    description: 'Payment transaction ID to refund',
    example: 67890,
  })
  @IsNumber({}, { message: 'Payment transaction ID must be a number' })
  @IsNotEmpty({ message: 'Payment transaction ID is required' })
  @Min(1, { message: 'Payment transaction ID must be a positive number' })
  paymentTransactionId: number;

  @ApiProperty({
    description: 'Refund method',
    enum: SyrianRefundMethod,
    example: SyrianRefundMethod.BANK_TRANSFER,
  })
  @IsEnum(SyrianRefundMethod, {
    message: 'Please select a valid refund method',
  })
  @IsNotEmpty({ message: 'Refund method is required' })
  refundMethod: SyrianRefundMethod;

  @ApiProperty({
    description: 'Refund reason category',
    enum: RefundReasonCategory,
    example: RefundReasonCategory.PRODUCT_DEFECT,
  })
  @IsEnum(RefundReasonCategory, {
    message: 'Please select a valid reason category',
  })
  @IsNotEmpty({ message: 'Refund reason category is required' })
  reasonCategory: RefundReasonCategory;

  @ApiProperty({
    description: 'Detailed reason description in English',
    example: 'The product arrived with visible damage to the screen',
    maxLength: 2000,
  })
  @IsString({ message: 'Reason description must be a string' })
  @IsNotEmpty({ message: 'Reason description in English is required' })
  @Length(10, 2000, {
    message: 'Reason description must be between 10 and 2000 characters',
  })
  reasonDescriptionEn: string;

  @ApiProperty({
    description: 'Detailed reason description in Arabic',
    example: 'وصل المنتج مع ضرر واضح في الشاشة',
    maxLength: 2000,
  })
  @IsString({ message: 'Reason description in Arabic must be a string' })
  @IsNotEmpty({ message: 'Reason description in Arabic is required' })
  @Length(10, 2000, {
    message:
      'Reason description in Arabic must be between 10 and 2000 characters',
  })
  reasonDescriptionAr: string;

  @ApiPropertyOptional({
    description: 'Additional customer notes',
    example: 'I would like a replacement if possible, otherwise refund please',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Customer notes must be a string' })
  @Length(0, 1000, {
    message: 'Customer notes must not exceed 1000 characters',
  })
  customerNotes?: string;

  // ========================================
  // MULTI-CURRENCY AMOUNTS
  // ========================================

  @ApiProperty({
    description: 'Refund amount in Syrian Pounds (SYP) - Primary currency',
    example: 250000,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Amount in SYP must be a number' })
  @IsNotEmpty({ message: 'Amount in SYP is required' })
  @Min(1, { message: 'Refund amount must be at least 1 SYP' })
  amountSyp: number;

  @ApiPropertyOptional({
    description: 'Refund amount in US Dollars (if applicable)',
    example: 16.67,
    minimum: 0,
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '2' },
    { message: 'USD amount must have at most 2 decimal places' },
  )
  @Transform(({ value }) => parseFloat(value))
  @Min(0, { message: 'USD amount must be positive' })
  amountUsd?: number;

  @ApiPropertyOptional({
    description: 'Refund amount in Euros (if applicable)',
    example: 15.15,
    minimum: 0,
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: '2' },
    { message: 'EUR amount must have at most 2 decimal places' },
  )
  @Transform(({ value }) => parseFloat(value))
  @Min(0, { message: 'EUR amount must be positive' })
  amountEur?: number;

  @ApiProperty({
    description: 'Primary currency for this refund',
    enum: ['SYP', 'USD', 'EUR'],
    example: 'SYP',
  })
  @IsEnum(['SYP', 'USD', 'EUR'], {
    message: 'Currency must be SYP, USD, or EUR',
  })
  @IsNotEmpty({ message: 'Currency is required' })
  currency: 'SYP' | 'USD' | 'EUR';

  // ========================================
  // BANKING INFORMATION (Conditional)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Syrian banking information (required for bank_transfer method)',
    type: SyrianBankingInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SyrianBankingInfoDto)
  bankingInfo?: SyrianBankingInfoDto;

  // ========================================
  // CUSTOMER CONTACT INFORMATION
  // ========================================

  @ApiPropertyOptional({
    description: 'Customer phone number for notifications',
    example: '+963911234567',
  })
  @IsOptional()
  @IsPhoneNumber('SY', {
    message: 'Please provide a valid Syrian phone number',
  })
  customerPhoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Customer email for notifications',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  customerEmail?: string;

  // ========================================
  // NOTIFICATION PREFERENCES
  // ========================================

  @ApiPropertyOptional({
    description: 'Enable SMS notifications',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'SMS notifications setting must be boolean' })
  smsNotificationsEnabled?: boolean = true;

  @ApiPropertyOptional({
    description: 'Enable email notifications',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Email notifications setting must be boolean' })
  emailNotificationsEnabled?: boolean = true;

  @ApiPropertyOptional({
    description: 'Preferred language for communications',
    enum: ['en', 'ar', 'both'],
    example: 'ar',
    default: 'ar',
  })
  @IsOptional()
  @IsEnum(['en', 'ar', 'both'], { message: 'Language must be en, ar, or both' })
  preferredLanguage?: 'en' | 'ar' | 'both' = 'ar';

  // ========================================
  // EVIDENCE AND DOCUMENTATION
  // ========================================

  @ApiPropertyOptional({
    description: 'Evidence documents supporting the refund request',
    type: [EvidenceDocumentDto],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray({ message: 'Evidence documents must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 evidence documents allowed' })
  @ValidateNested({ each: true })
  @Type(() => EvidenceDocumentDto)
  evidenceDocuments?: EvidenceDocumentDto[];

  // ========================================
  // LOCALIZATION PREFERENCES
  // ========================================

  @ApiPropertyOptional({
    description: 'Use Arabic numerals in displays',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Arabic numerals setting must be boolean' })
  useArabicNumerals?: boolean = true;

  @ApiPropertyOptional({
    description: 'Currency display format preferences',
    example: {
      sypFormat: '### ### ل.س',
      usdFormat: '$###.##',
      eurFormat: '€###.##',
    },
  })
  @IsOptional()
  @IsObject({ message: 'Currency display format must be an object' })
  currencyDisplayFormat?: {
    sypFormat?: string;
    usdFormat?: string;
    eurFormat?: string;
  };

  // ========================================
  // PRIORITY AND URGENCY
  // ========================================

  @ApiPropertyOptional({
    description: 'Mark refund as urgent',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Urgent flag must be boolean' })
  isUrgent?: boolean = false;

  @ApiPropertyOptional({
    description: 'Priority level for processing',
    enum: ['low', 'normal', 'high', 'urgent'],
    example: 'normal',
    default: 'normal',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'], {
    message: 'Priority level must be low, normal, high, or urgent',
  })
  priorityLevel?: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

  // ========================================
  // GOVERNORATE INFORMATION
  // ========================================

  @ApiPropertyOptional({
    description: 'Syrian governorate ID for regional processing',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Governorate ID must be a number' })
  @Min(1, { message: 'Governorate ID must be a positive number' })
  governorateId?: number;

  // ========================================
  // METADATA
  // ========================================

  @ApiPropertyOptional({
    description: 'Additional metadata for the refund request',
    example: {
      source: 'mobile_app',
      userAgent: 'SouqSyria Mobile v2.1.0',
      requestId: 'req_123456789',
    },
  })
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;
}

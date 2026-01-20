/**
 * @file submit-syrian-kyc.dto.ts
 * @description Enterprise DTOs for Syrian KYC Document Submission
 *
 * FEATURES:
 * - Comprehensive validation for Syrian document types
 * - Arabic/English localization support
 * - File upload validation and metadata
 * - Business rule validation
 * - Performance optimized with proper validation
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
  IsPhoneNumber,
  IsDateString,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  SyrianKycDocumentType,
  SyrianKycVerificationLevel,
  SyrianKycStatus,
} from '../enums/syrian-kyc.enums';

/**
 * File details for document upload
 */
export class FileDetailsDto {
  @ApiProperty({
    description: 'Original file URL from storage',
    example: 'https://storage.souqsyria.com/kyc/syrian_id_123.jpg',
  })
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @ApiProperty({
    description: 'Thumbnail URL (optional)',
    example: 'https://storage.souqsyria.com/kyc/thumb_123.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Original file name',
    example: 'syrian_national_id.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(50 * 1024 * 1024) // Max 50MB
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: 'File checksum for integrity verification',
    example: 'sha256:abc123...',
    required: false,
  })
  @IsOptional()
  @IsString()
  checksum?: string;
}

/**
 * Document data extracted from the uploaded file
 */
export class DocumentDataDto {
  @ApiProperty({
    description: 'Document number (e.g., Syrian ID number)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  documentNumber?: string;

  @ApiProperty({
    description: 'Full name in Arabic',
    example: 'أحمد محمد الأحمد',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullName?: string;

  @ApiProperty({
    description: 'Full name in English',
    example: 'Ahmad Mohammed Al-Ahmad',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fullNameEn?: string;

  @ApiProperty({
    description: 'Date of birth (YYYY-MM-DD)',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Place of birth in Arabic',
    example: 'دمشق',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  placeOfBirth?: string;

  @ApiProperty({
    description: 'Place of birth in English',
    example: 'Damascus',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  placeOfBirthEn?: string;

  @ApiProperty({
    description: 'Nationality in Arabic',
    example: 'سوري',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationality?: string;

  @ApiProperty({
    description: 'Nationality in English',
    example: 'Syrian',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nationalityEn?: string;

  @ApiProperty({
    description: 'Document issue date (YYYY-MM-DD)',
    example: '2020-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({
    description: 'Document expiry date (YYYY-MM-DD)',
    example: '2030-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({
    description: 'Issuing authority in Arabic',
    example: 'وزارة الداخلية',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuingAuthority?: string;

  @ApiProperty({
    description: 'Issuing authority in English',
    example: 'Ministry of Interior',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuingAuthorityEn?: string;

  // Business-specific fields
  @ApiProperty({
    description: 'Business name in Arabic (for business documents)',
    example: 'شركة التجارة السورية المحدودة',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @ApiProperty({
    description: 'Business name in English (for business documents)',
    example: 'Syrian Trading Company Ltd.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessNameEn?: string;

  @ApiProperty({
    description: 'Business registration number',
    example: 'REG-2025-001234',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  registrationNumber?: string;

  @ApiProperty({
    description: 'Tax identification number',
    example: 'TAX-SYR-987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;
}

/**
 * Address information from document
 */
export class AddressInfoDto {
  @ApiProperty({
    description: 'Address line 1 in English',
    example: 'Damascus, Mazzeh District',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @ApiProperty({
    description: 'Address line 1 in Arabic',
    example: 'دمشق، حي المزة',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1Ar?: string;

  @ApiProperty({
    description: 'Address line 2 in English',
    example: 'Building 15, Floor 3',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty({
    description: 'Address line 2 in Arabic',
    example: 'البناء رقم 15، الطابق الثالث',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2Ar?: string;

  @ApiProperty({
    description: 'Postal code',
    example: '12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+963987654321',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('SY')
  phone?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'ahmad@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

/**
 * Main DTO for submitting Syrian KYC documents
 */
export class SubmitSyrianKycDto {
  @ApiProperty({
    description: 'Type of KYC document being submitted',
    enum: SyrianKycDocumentType,
    example: SyrianKycDocumentType.SYRIAN_ID,
  })
  @IsNotEmpty()
  @IsEnum(SyrianKycDocumentType)
  documentType: SyrianKycDocumentType;

  @ApiProperty({
    description: 'Document title in English',
    example: 'Syrian National ID Card',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  titleEn: string;

  @ApiProperty({
    description: 'Document title in Arabic',
    example: 'البطاقة الشخصية السورية',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  titleAr: string;

  @ApiProperty({
    description: 'Required verification level for this document',
    enum: SyrianKycVerificationLevel,
    example: SyrianKycVerificationLevel.BASIC,
  })
  @IsNotEmpty()
  @IsEnum(SyrianKycVerificationLevel)
  verificationLevel: SyrianKycVerificationLevel;

  @ApiProperty({
    description: 'File details and upload information',
    type: FileDetailsDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => FileDetailsDto)
  fileDetails: FileDetailsDto;

  @ApiProperty({
    description: 'Extracted document data (optional)',
    type: DocumentDataDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DocumentDataDto)
  documentData?: DocumentDataDto;

  @ApiProperty({
    description: 'Address information from document (optional)',
    type: AddressInfoDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressInfoDto)
  addressInfo?: AddressInfoDto;

  @ApiProperty({
    description: 'Syrian governorate ID where document was issued',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(14) // Syria has 14 governorates
  governorateId?: number;

  @ApiProperty({
    description: 'Processing priority level',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    example: 'NORMAL',
    required: false,
  })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiProperty({
    description: 'Additional notes in English (optional)',
    example: 'This is my primary identification document',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    description: 'Additional notes in Arabic (optional)',
    example: 'هذه هي وثيقة الهوية الأساسية الخاصة بي',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notesAr?: string;
}

/**
 * DTO for KYC document approval/rejection
 */
export class ReviewSyrianKycDto {
  @ApiProperty({
    description: 'New status for the KYC document',
    enum: [
      SyrianKycStatus.APPROVED,
      SyrianKycStatus.REJECTED,
      SyrianKycStatus.REQUIRES_CLARIFICATION,
    ],
    example: SyrianKycStatus.APPROVED,
  })
  @IsNotEmpty()
  @IsEnum([
    SyrianKycStatus.APPROVED,
    SyrianKycStatus.REJECTED,
    SyrianKycStatus.REQUIRES_CLARIFICATION,
  ])
  status:
    | SyrianKycStatus.APPROVED
    | SyrianKycStatus.REJECTED
    | SyrianKycStatus.REQUIRES_CLARIFICATION;

  @ApiProperty({
    description: 'Review notes in English',
    example: 'Document approved. All information verified successfully.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reviewNotes: string;

  @ApiProperty({
    description: 'Review notes in Arabic',
    example: 'تمت الموافقة على الوثيقة. تم التحقق من جميع المعلومات بنجاح.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  reviewNotesAr: string;

  @ApiProperty({
    description: 'Send notification to user after review',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean;
}

/**
 * Query DTO for filtering KYC documents
 */
export class KycDocumentQueryDto {
  @ApiProperty({
    description: 'Filter by document type',
    enum: SyrianKycDocumentType,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianKycDocumentType)
  documentType?: SyrianKycDocumentType;

  @ApiProperty({
    description: 'Filter by status',
    enum: SyrianKycStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianKycStatus)
  status?: SyrianKycStatus;

  @ApiProperty({
    description: 'Filter by verification level',
    enum: SyrianKycVerificationLevel,
    required: false,
  })
  @IsOptional()
  @IsEnum(SyrianKycVerificationLevel)
  verificationLevel?: SyrianKycVerificationLevel;

  @ApiProperty({
    description: 'Filter by governorate ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(14)
  governorateId?: number;

  @ApiProperty({
    description: 'Filter by priority',
    enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @ApiProperty({
    description: 'Show only overdue documents',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  overdueOnly?: boolean;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort field',
    enum: ['createdAt', 'updatedAt', 'priority', 'status'],
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'priority', 'status'])
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status' = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

/**
 * @file vendor-management.dto.ts
 * @description DTOs for vendor management including listing, verification workflow,
 *              commission management, and payout processing.
 * @module AdminDashboard/DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SortOrder } from './user-management.dto';

/**
 * 9-state vendor verification status enumeration
 * @description Comprehensive verification workflow states
 */
export enum VendorVerificationStatus {
  /** Initial application submitted */
  PENDING = 'pending',
  /** Documents under initial review */
  UNDER_REVIEW = 'under_review',
  /** Additional documents requested */
  DOCUMENTS_REQUESTED = 'documents_requested',
  /** Business verification in progress */
  BUSINESS_VERIFICATION = 'business_verification',
  /** Final approval pending */
  FINAL_REVIEW = 'final_review',
  /** Fully verified vendor */
  APPROVED = 'approved',
  /** Application rejected */
  REJECTED = 'rejected',
  /** Verification temporarily suspended */
  SUSPENDED = 'suspended',
  /** Must resubmit entire application */
  REQUIRES_RESUBMISSION = 'requires_resubmission',
}

/**
 * Vendor account status
 */
export enum VendorAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

/**
 * Vendor sort field enumeration
 */
export enum VendorSortField {
  ID = 'id',
  CREATED_AT = 'createdAt',
  SHOP_NAME = 'shopName',
  VERIFICATION_STATUS = 'verificationStatus',
  TOTAL_SALES = 'totalSales',
  RATING = 'rating',
}

/**
 * Payout status enumeration
 */
export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

// =============================================================================
// QUERY DTOs
// =============================================================================

/**
 * Vendor list query parameters
 */
export class VendorListQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for shop name or owner name',
    example: 'Al-Hamra',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    enum: VendorVerificationStatus,
  })
  @IsEnum(VendorVerificationStatus)
  @IsOptional()
  verificationStatus?: VendorVerificationStatus;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    enum: VendorAccountStatus,
  })
  @IsEnum(VendorAccountStatus)
  @IsOptional()
  accountStatus?: VendorAccountStatus;

  @ApiPropertyOptional({
    description: 'Filter by category IDs',
    type: [Number],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  categoryIds?: number[];

  @ApiPropertyOptional({
    description: 'Filter by minimum rating',
    minimum: 0,
    maximum: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: VendorSortField,
    default: VendorSortField.CREATED_AT,
  })
  @IsEnum(VendorSortField)
  @IsOptional()
  sortBy?: VendorSortField = VendorSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}

// =============================================================================
// ACTION DTOs
// =============================================================================

/**
 * Update vendor verification status DTO
 * @description Advances vendor through 9-state verification workflow
 */
export class UpdateVendorVerificationDto {
  @ApiProperty({
    description: 'New verification status',
    enum: VendorVerificationStatus,
    example: 'approved',
  })
  @IsEnum(VendorVerificationStatus)
  status: VendorVerificationStatus;

  @ApiPropertyOptional({
    description: 'Notes or reason for status change',
    maxLength: 1000,
    example: 'All business documents verified. Approved for selling.',
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Documents requested (when status is documents_requested)',
    type: [String],
    example: ['business_license', 'tax_certificate'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requestedDocuments?: string[];

  @ApiPropertyOptional({
    description: 'Rejection reason (required when status is rejected)',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Send notification email to vendor',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyVendor?: boolean = true;
}

/**
 * Update vendor commission rate DTO
 */
export class UpdateVendorCommissionDto {
  @ApiProperty({
    description: 'New commission rate percentage (0-50)',
    minimum: 0,
    maximum: 50,
    example: 10,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(50)
  commissionRate: number;

  @ApiPropertyOptional({
    description: 'Effective date for new rate',
    example: '2024-02-01',
  })
  @IsString()
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Reason for commission rate change',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}

/**
 * Process vendor payout DTO
 */
export class ProcessPayoutDto {
  @ApiProperty({
    description: 'Payout amount in SYP',
    example: 500000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'bank_transfer',
    enum: ['bank_transfer', 'mobile_wallet', 'cash'],
  })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({
    description: 'Transaction reference number',
    example: 'TRX-2024-001234',
  })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * Vendor owner information
 */
export class VendorOwnerDto {
  @ApiProperty({ description: 'Owner user ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Owner full name', example: 'Mohammad Al-Hamra' })
  fullName: string;

  @ApiProperty({ description: 'Owner email', example: 'mohammad@alhamra.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Owner phone', example: '+963912345678' })
  phone?: string;
}

/**
 * Vendor commission summary
 */
export class VendorCommissionSummaryDto {
  @ApiProperty({ description: 'Current commission rate (%)', example: 10 })
  currentRate: number;

  @ApiProperty({ description: 'Total commissions paid in SYP', example: 250000 })
  totalPaid: number;

  @ApiProperty({ description: 'Pending commission in SYP', example: 50000 })
  pendingAmount: number;

  @ApiPropertyOptional({ description: 'Last payout date' })
  lastPayoutDate?: Date;
}

/**
 * Vendor performance metrics
 */
export class VendorMetricsDto {
  @ApiProperty({ description: 'Total sales in SYP', example: 5000000 })
  totalSales: number;

  @ApiProperty({ description: 'Total orders', example: 156 })
  totalOrders: number;

  @ApiProperty({ description: 'Average order value in SYP', example: 32051 })
  averageOrderValue: number;

  @ApiProperty({ description: 'Total products listed', example: 45 })
  totalProducts: number;

  @ApiProperty({ description: 'Active products', example: 38 })
  activeProducts: number;

  @ApiProperty({ description: 'Average rating (0-5)', example: 4.5 })
  averageRating: number;

  @ApiProperty({ description: 'Total reviews received', example: 89 })
  totalReviews: number;

  @ApiProperty({ description: 'Order fulfillment rate (%)', example: 98.5 })
  fulfillmentRate: number;

  @ApiProperty({ description: 'Return rate (%)', example: 2.1 })
  returnRate: number;
}

/**
 * Vendor list item response DTO
 */
export class VendorListItemDto {
  @ApiProperty({ description: 'Vendor ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Shop name in English', example: 'Al-Hamra Crafts' })
  shopNameEn: string;

  @ApiProperty({ description: 'Shop name in Arabic', example: 'حرف الحمراء' })
  shopNameAr: string;

  @ApiPropertyOptional({ description: 'Shop logo URL' })
  logo?: string;

  @ApiProperty({ description: 'Owner information', type: VendorOwnerDto })
  owner: VendorOwnerDto;

  @ApiProperty({
    description: 'Verification status',
    enum: VendorVerificationStatus,
    example: 'approved',
  })
  verificationStatus: VendorVerificationStatus;

  @ApiProperty({
    description: 'Account status',
    enum: VendorAccountStatus,
    example: 'active',
  })
  accountStatus: VendorAccountStatus;

  @ApiProperty({ description: 'Commission rate (%)', example: 10 })
  commissionRate: number;

  @ApiProperty({ description: 'Average rating', example: 4.5 })
  rating: number;

  @ApiProperty({ description: 'Total products', example: 45 })
  totalProducts: number;

  @ApiProperty({ description: 'Total sales in SYP', example: 5000000 })
  totalSales: number;

  @ApiProperty({ description: 'Available balance in SYP', example: 250000 })
  availableBalance: number;

  @ApiProperty({ description: 'Registration date' })
  createdAt: Date;
}

/**
 * Vendor details response DTO
 */
export class VendorDetailsDto extends VendorListItemDto {
  @ApiPropertyOptional({ description: 'Shop description in English' })
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'Shop description in Arabic' })
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Banner image URL' })
  bannerImage?: string;

  @ApiProperty({ description: 'Business address' })
  businessAddress: string;

  @ApiPropertyOptional({ description: 'Business registration number' })
  businessRegistrationNumber?: string;

  @ApiProperty({ description: 'Commission summary', type: VendorCommissionSummaryDto })
  commission: VendorCommissionSummaryDto;

  @ApiProperty({ description: 'Performance metrics', type: VendorMetricsDto })
  metrics: VendorMetricsDto;

  @ApiProperty({ description: 'Categories the vendor sells in', type: [String] })
  categories: string[];

  @ApiProperty({
    description: 'Verification history',
    type: [Object],
  })
  verificationHistory: {
    status: VendorVerificationStatus;
    timestamp: Date;
    notes?: string;
    reviewedBy?: string;
  }[];

  @ApiProperty({ description: 'Last updated date' })
  updatedAt: Date;
}

/**
 * Vendor verification item DTO
 * @description For pending verification list
 */
export class VendorVerificationItemDto {
  @ApiProperty({ description: 'Vendor ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Shop name', example: 'Al-Hamra Crafts' })
  shopName: string;

  @ApiProperty({ description: 'Owner name', example: 'Mohammad Al-Hamra' })
  ownerName: string;

  @ApiProperty({ description: 'Owner email', example: 'mohammad@alhamra.com' })
  ownerEmail: string;

  @ApiProperty({
    description: 'Current verification status',
    enum: VendorVerificationStatus,
  })
  status: VendorVerificationStatus;

  @ApiProperty({
    description: 'Documents submitted',
    type: [String],
    example: ['business_license', 'id_document'],
  })
  documentsSubmitted: string[];

  @ApiProperty({ description: 'Application date' })
  appliedAt: Date;

  @ApiPropertyOptional({ description: 'Days pending', example: 3 })
  daysPending?: number;

  @ApiProperty({ description: 'Is resubmission', example: false })
  isResubmission: boolean;
}

/**
 * Payout request item DTO
 */
export class PayoutRequestItemDto {
  @ApiProperty({ description: 'Payout request ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Vendor ID', example: 5 })
  vendorId: number;

  @ApiProperty({ description: 'Shop name', example: 'Al-Hamra Crafts' })
  shopName: string;

  @ApiProperty({ description: 'Requested amount in SYP', example: 500000 })
  amount: number;

  @ApiProperty({ description: 'Payment method', example: 'bank_transfer' })
  paymentMethod: string;

  @ApiProperty({
    description: 'Payout status',
    enum: PayoutStatus,
    example: 'pending',
  })
  status: PayoutStatus;

  @ApiProperty({ description: 'Request date' })
  requestedAt: Date;

  @ApiPropertyOptional({ description: 'Processed date' })
  processedAt?: Date;
}

/**
 * Paginated vendor list response
 */
export class PaginatedVendorListDto {
  @ApiProperty({ description: 'List of vendors', type: [VendorListItemDto] })
  items: VendorListItemDto[];

  @ApiProperty({ description: 'Total count', example: 45 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 3 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;
}

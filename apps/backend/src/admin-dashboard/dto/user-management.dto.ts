/**
 * @file user-management.dto.ts
 * @description DTOs for user management operations including listing, filtering,
 *              status updates, role assignment, and KYC verification.
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
  IsEmail,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

/**
 * KYC verification status enumeration
 */
export enum KycStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_RESUBMISSION = 'requires_resubmission',
}

/**
 * User list sort field enumeration
 */
export enum UserSortField {
  ID = 'id',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  NAME = 'name',
  EMAIL = 'email',
  STATUS = 'status',
  LAST_LOGIN = 'lastLogin',
}

/**
 * Sort order enumeration
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// =============================================================================
// QUERY DTOs
// =============================================================================

/**
 * User list query parameters
 * @description Supports filtering, sorting, and pagination for user listing
 */
export class UserListQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    minimum: 1,
    default: 1,
    example: 1,
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
    example: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for name or email',
    example: 'ahmad',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: UserStatus,
    example: 'active',
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter by KYC verification status',
    enum: KycStatus,
    example: 'pending',
  })
  @IsEnum(KycStatus)
  @IsOptional()
  kycStatus?: KycStatus;

  @ApiPropertyOptional({
    description: 'Filter by role IDs',
    type: [Number],
    example: [1, 2],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  roleIds?: number[];

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: UserSortField,
    default: UserSortField.CREATED_AT,
    example: 'createdAt',
  })
  @IsEnum(UserSortField)
  @IsOptional()
  sortBy?: UserSortField = UserSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
    example: 'desc',
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filter users created after this date',
    example: '2024-01-01',
  })
  @IsString()
  @IsOptional()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter users created before this date',
    example: '2024-12-31',
  })
  @IsString()
  @IsOptional()
  createdBefore?: string;
}

// =============================================================================
// ACTION DTOs
// =============================================================================

/**
 * Update user status DTO
 * @description Request body for updating user account status
 */
export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'New user status',
    enum: UserStatus,
    example: 'suspended',
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'Reason for status change (required for suspension/ban)',
    example: 'Violation of terms of service',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Notify user via email about status change',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  notifyUser?: boolean = true;
}

/**
 * Assign role to user DTO
 * @description Request body for assigning roles to a user
 */
export class AssignUserRoleDto {
  @ApiProperty({
    description: 'Array of role IDs to assign',
    type: [Number],
    example: [2, 3],
  })
  @Type(() => Number)
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];

  @ApiPropertyOptional({
    description: 'Replace existing roles (true) or add to existing (false)',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean = false;
}

/**
 * KYC verification review DTO
 * @description Request body for reviewing KYC submissions
 */
export class ReviewKycDto {
  @ApiProperty({
    description: 'KYC verification decision',
    enum: ['approved', 'rejected', 'requires_resubmission'],
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected', 'requires_resubmission'])
  decision: 'approved' | 'rejected' | 'requires_resubmission';

  @ApiPropertyOptional({
    description: 'Review notes or rejection reason',
    example: 'All documents verified successfully',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Fields that require resubmission (when decision is requires_resubmission)',
    type: [String],
    example: ['id_document', 'address_proof'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fieldsToResubmit?: string[];
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

/**
 * User role response DTO
 */
export class UserRoleDto {
  @ApiProperty({ description: 'Role ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Role name', example: 'customer' })
  name: string;

  @ApiProperty({ description: 'Role display name', example: 'Customer' })
  displayName: string;
}

/**
 * User KYC summary DTO
 */
export class UserKycSummaryDto {
  @ApiProperty({
    description: 'KYC verification status',
    enum: KycStatus,
    example: 'approved',
  })
  status: KycStatus;

  @ApiPropertyOptional({
    description: 'Last submission date',
    example: '2024-01-15T10:30:00Z',
  })
  submittedAt?: Date;

  @ApiPropertyOptional({
    description: 'Last review date',
    example: '2024-01-16T14:00:00Z',
  })
  reviewedAt?: Date;

  @ApiProperty({
    description: 'Whether user can resubmit documents',
    example: false,
  })
  canResubmit: boolean;
}

/**
 * User list item response DTO
 * @description User summary for list display
 */
export class UserListItemDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User email', example: 'ahmad@example.com' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'Ahmad' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Al-Hassan' })
  lastName: string;

  @ApiProperty({ description: 'Full name', example: 'Ahmad Al-Hassan' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Profile avatar URL' })
  avatar?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+963912345678' })
  phone?: string;

  @ApiProperty({
    description: 'Account status',
    enum: UserStatus,
    example: 'active',
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User roles',
    type: [UserRoleDto],
  })
  roles: UserRoleDto[];

  @ApiProperty({
    description: 'KYC verification summary',
    type: UserKycSummaryDto,
  })
  kyc: UserKycSummaryDto;

  @ApiProperty({ description: 'Whether email is verified', example: true })
  emailVerified: boolean;

  @ApiPropertyOptional({ description: 'Last login date' })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Total orders placed', example: 12 })
  totalOrders: number;

  @ApiProperty({ description: 'Total spent in SYP', example: 1500000 })
  totalSpent: number;
}

/**
 * User details response DTO
 * @description Complete user information for detail view
 */
export class UserDetailsDto extends UserListItemDto {
  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'Gender', example: 'male' })
  gender?: string;

  @ApiProperty({ description: 'Number of addresses', example: 2 })
  addressCount: number;

  @ApiProperty({ description: 'Number of wishlist items', example: 8 })
  wishlistCount: number;

  @ApiProperty({ description: 'Number of reviews written', example: 5 })
  reviewCount: number;

  @ApiProperty({
    description: 'Recent activity log',
    type: [Object],
  })
  recentActivity: {
    action: string;
    timestamp: Date;
    details?: string;
  }[];

  @ApiProperty({ description: 'Last profile update date' })
  updatedAt: Date;
}

/**
 * KYC verification item DTO
 * @description KYC submission for pending review list
 */
export class KycVerificationItemDto {
  @ApiProperty({ description: 'KYC submission ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User ID', example: 123 })
  userId: number;

  @ApiProperty({ description: 'User full name', example: 'Ahmad Al-Hassan' })
  userName: string;

  @ApiProperty({ description: 'User email', example: 'ahmad@example.com' })
  userEmail: string;

  @ApiProperty({
    description: 'Verification status',
    enum: KycStatus,
    example: 'pending',
  })
  status: KycStatus;

  @ApiProperty({
    description: 'Document type submitted',
    example: 'national_id',
  })
  documentType: string;

  @ApiProperty({ description: 'Submission date' })
  submittedAt: Date;

  @ApiPropertyOptional({ description: 'Previous rejection reason' })
  previousRejectionReason?: string;

  @ApiProperty({ description: 'Is resubmission', example: false })
  isResubmission: boolean;
}

/**
 * Paginated user list response DTO
 */
export class PaginatedUserListDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserListItemDto],
  })
  items: UserListItemDto[];

  @ApiProperty({ description: 'Total number of users', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 8 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrev: boolean;
}

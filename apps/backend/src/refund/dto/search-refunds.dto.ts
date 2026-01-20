/**
 * @file search-refunds.dto.ts
 * @description Search and Filter Syrian Refunds DTO
 *
 * FEATURES:
 * - Advanced filtering by status, method, bank type, amount ranges
 * - Date range filtering with timezone support
 * - Text search in descriptions and references
 * - Sorting options with multiple fields
 * - Performance optimized queries
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsDateString,
  IsBoolean,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Enums
import {
  SyrianRefundStatus,
  SyrianRefundMethod,
  SyrianBankType,
  RefundReasonCategory,
} from '../entities/syrian-refund.entity';

export class SearchRefundsDto {
  // ========================================
  // STATUS AND WORKFLOW FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by refund status',
    enum: SyrianRefundStatus,
    example: SyrianRefundStatus.UNDER_REVIEW,
  })
  @IsOptional()
  @IsEnum(SyrianRefundStatus, { message: 'Invalid refund status' })
  status?: SyrianRefundStatus;

  @ApiPropertyOptional({
    description: 'Filter by multiple statuses',
    enum: SyrianRefundStatus,
    isArray: true,
    example: [SyrianRefundStatus.SUBMITTED, SyrianRefundStatus.UNDER_REVIEW],
  })
  @IsOptional()
  @IsArray({ message: 'Statuses must be an array' })
  @ArrayMaxSize(10, { message: 'Maximum 10 statuses allowed' })
  @IsEnum(SyrianRefundStatus, {
    each: true,
    message: 'Invalid status in array',
  })
  statuses?: SyrianRefundStatus[];

  @ApiPropertyOptional({
    description: 'Filter by refund method',
    enum: SyrianRefundMethod,
    example: SyrianRefundMethod.BANK_TRANSFER,
  })
  @IsOptional()
  @IsEnum(SyrianRefundMethod, { message: 'Invalid refund method' })
  method?: SyrianRefundMethod;

  @ApiPropertyOptional({
    description: 'Filter by reason category',
    enum: RefundReasonCategory,
    example: RefundReasonCategory.PRODUCT_DEFECT,
  })
  @IsOptional()
  @IsEnum(RefundReasonCategory, { message: 'Invalid reason category' })
  reasonCategory?: RefundReasonCategory;

  @ApiPropertyOptional({
    description: 'Filter by bank type',
    enum: SyrianBankType,
    example: SyrianBankType.COMMERCIAL_BANK_OF_SYRIA,
  })
  @IsOptional()
  @IsEnum(SyrianBankType, { message: 'Invalid bank type' })
  bankType?: SyrianBankType;

  // ========================================
  // AMOUNT RANGE FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Minimum refund amount in SYP',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Minimum amount must be a number' })
  @Min(0, { message: 'Minimum amount must be non-negative' })
  minAmountSyp?: number;

  @ApiPropertyOptional({
    description: 'Maximum refund amount in SYP',
    example: 1000000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Maximum amount must be a number' })
  @Min(0, { message: 'Maximum amount must be non-negative' })
  maxAmountSyp?: number;

  // ========================================
  // DATE RANGE FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter refunds created from this date',
    example: '2025-01-01T00:00:00Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid start date format' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter refunds created until this date',
    example: '2025-12-31T23:59:59Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid end date format' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by submission date range - from',
    example: '2025-08-01T00:00:00Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid submitted from date format' })
  submittedFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by submission date range - to',
    example: '2025-08-31T23:59:59Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid submitted to date format' })
  submittedTo?: string;

  @ApiPropertyOptional({
    description: 'Filter by completion date range - from',
    example: '2025-08-01T00:00:00Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid completed from date format' })
  completedFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by completion date range - to',
    example: '2025-08-31T23:59:59Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid completed to date format' })
  completedTo?: string;

  // ========================================
  // TEXT SEARCH
  // ========================================

  @ApiPropertyOptional({
    description: 'Search in refund reference, customer name, or description',
    example: 'damaged product',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Transform(({ value }) => value?.trim())
  searchQuery?: string;

  @ApiPropertyOptional({
    description: 'Search in refund reference number',
    example: 'REF-SY-2025-001234',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Refund reference must be a string' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  refundReference?: string;

  @ApiPropertyOptional({
    description: 'Search by transaction reference',
    example: 'RF-SY-ABC123-XYZ',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Transaction reference must be a string' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  transactionReference?: string;

  // ========================================
  // CUSTOMER FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 12345,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Customer ID must be a number' })
  @Min(1, { message: 'Customer ID must be positive' })
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Search by customer name',
    example: 'أحمد محمد',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Customer name must be a string' })
  @Transform(({ value }) => value?.trim())
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer email',
    example: 'customer@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Customer email must be a string' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  customerEmail?: string;

  // ========================================
  // ORDER FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by order ID',
    example: 67890,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Order ID must be a number' })
  @Min(1, { message: 'Order ID must be positive' })
  orderId?: number;

  // ========================================
  // PROCESSING FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by processed by user ID',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Processed by ID must be a number' })
  @Min(1, { message: 'Processed by ID must be positive' })
  processedById?: number;

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    enum: ['low', 'normal', 'high', 'urgent'],
    example: 'high',
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'], {
    message: 'Priority level must be low, normal, high, or urgent',
  })
  priorityLevel?: 'low' | 'normal' | 'high' | 'urgent';

  @ApiPropertyOptional({
    description: 'Filter only urgent refunds',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Is urgent must be boolean' })
  isUrgent?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only automated processing refunds',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Is automated processing must be boolean' })
  isAutomatedProcessing?: boolean;

  // ========================================
  // SLA AND COMPLIANCE FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter only overdue refunds',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Is overdue must be boolean' })
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by escalation level',
    example: 2,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Escalation level must be a number' })
  @Min(0, { message: 'Escalation level must be non-negative' })
  @Max(10, { message: 'Escalation level must not exceed 10' })
  escalationLevel?: number;

  @ApiPropertyOptional({
    description: 'Filter refunds requiring manual review',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Requires manual review must be boolean' })
  requiresManualReview?: boolean;

  // ========================================
  // CURRENCY FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by currency',
    enum: ['SYP', 'USD', 'EUR'],
    example: 'SYP',
  })
  @IsOptional()
  @IsEnum(['SYP', 'USD', 'EUR'], {
    message: 'Currency must be SYP, USD, or EUR',
  })
  currency?: 'SYP' | 'USD' | 'EUR';

  // ========================================
  // GEOGRAPHIC FILTERING
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by Syrian governorate ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Governorate ID must be a number' })
  @Min(1, { message: 'Governorate ID must be positive' })
  governorateId?: number;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: [
      'createdAt',
      'submittedAt',
      'completedAt',
      'amountSyp',
      'priorityLevel',
      'processingTimeHours',
      'refundReference',
      'slaDeadline',
    ],
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(
    [
      'createdAt',
      'submittedAt',
      'completedAt',
      'amountSyp',
      'priorityLevel',
      'processingTimeHours',
      'refundReference',
      'slaDeadline',
    ],
    { message: 'Invalid sort field' },
  )
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // ========================================
  // ANALYTICS OPTIONS
  // ========================================

  @ApiPropertyOptional({
    description: 'Include analytics data in response',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Include analytics must be boolean' })
  includeAnalytics?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include workflow history in results',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Include workflow history must be boolean' })
  includeWorkflowHistory?: boolean = false;
}

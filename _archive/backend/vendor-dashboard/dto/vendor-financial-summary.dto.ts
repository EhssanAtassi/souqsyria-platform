/**
 * @file vendor-financial-summary.dto.ts
 * @description DTOs for vendor financial reports and summaries
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested, Min, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Financial report period type
 */
export enum FinancialPeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/**
 * Payout status enum
 */
export enum PayoutStatus {
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Revenue breakdown by category DTO
 */
export class RevenueByCategoryDto {
  @ApiProperty({
    description: 'Category name in English',
    example: 'Damascus Steel',
  })
  @IsString()
  categoryNameEn: string;

  @ApiProperty({
    description: 'Category name in Arabic',
    example: 'الصلب الدمشقي',
  })
  @IsString()
  categoryNameAr: string;

  @ApiProperty({
    description: 'Gross revenue in SYP',
    example: 5250000,
  })
  @IsNumber()
  @Min(0)
  grossRevenueSyp: number;

  @ApiProperty({
    description: 'Gross revenue in USD',
    example: 1050.00,
  })
  @IsNumber()
  @Min(0)
  grossRevenueUsd: number;

  @ApiProperty({
    description: 'Platform commission amount in SYP',
    example: 525000,
  })
  @IsNumber()
  @Min(0)
  commissionSyp: number;

  @ApiProperty({
    description: 'Platform commission amount in USD',
    example: 105.00,
  })
  @IsNumber()
  @Min(0)
  commissionUsd: number;

  @ApiProperty({
    description: 'Net revenue after commission in SYP',
    example: 4725000,
  })
  @IsNumber()
  @Min(0)
  netRevenueSyp: number;

  @ApiProperty({
    description: 'Net revenue after commission in USD',
    example: 945.00,
  })
  @IsNumber()
  @Min(0)
  netRevenueUsd: number;
}

/**
 * Individual transaction record DTO
 */
export class TransactionRecordDto {
  @ApiProperty({
    description: 'Transaction unique identifier',
    example: 'txn_abc123xyz',
  })
  @IsString()
  transactionId: string;

  @ApiProperty({
    description: 'Order reference number',
    example: 'ORD-2025-001234',
  })
  @IsString()
  orderReference: string;

  @ApiProperty({
    description: 'Transaction date and time',
    example: '2025-01-20T14:30:00Z',
  })
  @IsString()
  transactionDate: string;

  @ApiProperty({
    description: 'Transaction amount in SYP',
    example: 125000,
  })
  @IsNumber()
  @Min(0)
  amountSyp: number;

  @ApiProperty({
    description: 'Transaction amount in USD',
    example: 25.00,
  })
  @IsNumber()
  @Min(0)
  amountUsd: number;

  @ApiProperty({
    description: 'Platform commission in SYP',
    example: 12500,
  })
  @IsNumber()
  @Min(0)
  commissionSyp: number;

  @ApiProperty({
    description: 'Platform commission in USD',
    example: 2.50,
  })
  @IsNumber()
  @Min(0)
  commissionUsd: number;

  @ApiProperty({
    description: 'Net amount after commission in SYP',
    example: 112500,
  })
  @IsNumber()
  @Min(0)
  netAmountSyp: number;

  @ApiProperty({
    description: 'Net amount after commission in USD',
    example: 22.50,
  })
  @IsNumber()
  @Min(0)
  netAmountUsd: number;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @ApiProperty({
    description: 'Payment method used',
    example: 'Cash on Delivery',
  })
  @IsString()
  paymentMethod: string;
}

/**
 * Scheduled payout information DTO
 */
export class PayoutScheduleDto {
  @ApiProperty({
    description: 'Payout unique identifier',
    example: 'payout_xyz789',
  })
  @IsString()
  payoutId: string;

  @ApiProperty({
    description: 'Scheduled payout date',
    example: '2025-01-25',
  })
  @IsString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Payout amount in SYP',
    example: 4500000,
  })
  @IsNumber()
  @Min(0)
  amountSyp: number;

  @ApiProperty({
    description: 'Payout amount in USD',
    example: 900.00,
  })
  @IsNumber()
  @Min(0)
  amountUsd: number;

  @ApiProperty({
    description: 'Payout status',
    enum: PayoutStatus,
    example: PayoutStatus.SCHEDULED,
  })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiProperty({
    description: 'Bank account last 4 digits',
    example: '1234',
  })
  @IsString()
  bankAccountLast4: string;
}

/**
 * Financial summary statistics DTO
 */
export class FinancialSummaryStatsDto {
  @ApiProperty({
    description: 'Total gross revenue in SYP',
    example: 15750000,
  })
  @IsNumber()
  @Min(0)
  totalGrossRevenueSyp: number;

  @ApiProperty({
    description: 'Total gross revenue in USD',
    example: 3150.00,
  })
  @IsNumber()
  @Min(0)
  totalGrossRevenueUsd: number;

  @ApiProperty({
    description: 'Total platform commission in SYP',
    example: 1575000,
  })
  @IsNumber()
  @Min(0)
  totalCommissionSyp: number;

  @ApiProperty({
    description: 'Total platform commission in USD',
    example: 315.00,
  })
  @IsNumber()
  @Min(0)
  totalCommissionUsd: number;

  @ApiProperty({
    description: 'Net revenue after commission in SYP',
    example: 14175000,
  })
  @IsNumber()
  @Min(0)
  netRevenueSyp: number;

  @ApiProperty({
    description: 'Net revenue after commission in USD',
    example: 2835.00,
  })
  @IsNumber()
  @Min(0)
  netRevenueUsd: number;

  @ApiProperty({
    description: 'Average commission rate percentage',
    example: 10.0,
  })
  @IsNumber()
  @Min(0)
  averageCommissionRate: number;

  @ApiProperty({
    description: 'Total number of transactions',
    example: 234,
  })
  @IsNumber()
  @Min(0)
  totalTransactions: number;

  @ApiProperty({
    description: 'Average transaction value in SYP',
    example: 67307.69,
  })
  @IsNumber()
  @Min(0)
  averageTransactionSyp: number;

  @ApiProperty({
    description: 'Average transaction value in USD',
    example: 13.46,
  })
  @IsNumber()
  @Min(0)
  averageTransactionUsd: number;

  @ApiProperty({
    description: 'Pending balance in SYP (not yet paid out)',
    example: 2250000,
  })
  @IsNumber()
  @Min(0)
  pendingBalanceSyp: number;

  @ApiProperty({
    description: 'Pending balance in USD (not yet paid out)',
    example: 450.00,
  })
  @IsNumber()
  @Min(0)
  pendingBalanceUsd: number;

  @ApiProperty({
    description: 'Available balance in SYP (ready for payout)',
    example: 4500000,
  })
  @IsNumber()
  @Min(0)
  availableBalanceSyp: number;

  @ApiProperty({
    description: 'Available balance in USD (ready for payout)',
    example: 900.00,
  })
  @IsNumber()
  @Min(0)
  availableBalanceUsd: number;
}

/**
 * Tax information DTO (for Syrian tax regulations)
 */
export class TaxInformationDto {
  @ApiProperty({
    description: 'Whether vendor is registered for Syrian VAT',
    example: true,
  })
  @IsBoolean()
  isVatRegistered: boolean;

  @ApiProperty({
    description: 'Syrian VAT registration number',
    example: 'VAT-SY-123456789',
  })
  @IsString()
  vatNumber: string;

  @ApiProperty({
    description: 'Applicable VAT rate percentage',
    example: 10.0,
  })
  @IsNumber()
  @Min(0)
  vatRate: number;

  @ApiProperty({
    description: 'Total VAT collected in SYP',
    example: 1575000,
  })
  @IsNumber()
  @Min(0)
  totalVatCollectedSyp: number;

  @ApiProperty({
    description: 'Total VAT collected in USD',
    example: 315.00,
  })
  @IsNumber()
  @Min(0)
  totalVatCollectedUsd: number;
}

/**
 * Main vendor financial summary response DTO
 * Comprehensive financial reporting dashboard data
 */
export class VendorFinancialSummaryDto {
  @ApiProperty({
    description: 'Report period type',
    enum: FinancialPeriodType,
    example: FinancialPeriodType.MONTHLY,
  })
  @IsEnum(FinancialPeriodType)
  periodType: FinancialPeriodType;

  @ApiProperty({
    description: 'Period start date',
    example: '2025-01-01',
  })
  @IsString()
  periodStart: string;

  @ApiProperty({
    description: 'Period end date',
    example: '2025-01-31',
  })
  @IsString()
  periodEnd: string;

  @ApiProperty({
    description: 'Financial summary statistics',
    type: FinancialSummaryStatsDto,
  })
  @ValidateNested()
  @Type(() => FinancialSummaryStatsDto)
  summary: FinancialSummaryStatsDto;

  @ApiProperty({
    description: 'Revenue breakdown by product category',
    type: [RevenueByCategoryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevenueByCategoryDto)
  revenueByCategory: RevenueByCategoryDto[];

  @ApiProperty({
    description: 'Recent transaction history',
    type: [TransactionRecordDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionRecordDto)
  recentTransactions: TransactionRecordDto[];

  @ApiProperty({
    description: 'Upcoming scheduled payouts',
    type: [PayoutScheduleDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayoutScheduleDto)
  upcomingPayouts: PayoutScheduleDto[];

  @ApiProperty({
    description: 'Tax information and VAT details',
    type: TaxInformationDto,
  })
  @ValidateNested()
  @Type(() => TaxInformationDto)
  taxInformation: TaxInformationDto;
}

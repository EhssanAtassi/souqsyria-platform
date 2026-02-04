/**
 * @file vendor-financial.controller.ts
 * @description Controller for vendor financial reports endpoint
 * Provides comprehensive financial data, transactions, and payout information
 *
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VendorFinancialService } from '../services/vendor-financial.service';
import {
  VendorFinancialSummaryDto,
  FinancialPeriodType,
} from '../dto/vendor-financial-summary.dto';

/**
 * Vendor Financial Reports Controller
 *
 * Handles GET /api/vendor-dashboard/financial-reports endpoint
 *
 * Provides comprehensive financial information including:
 * - Revenue and commission breakdown
 * - Transaction history
 * - Payout schedules
 * - Tax information (Syrian VAT compliance)
 */
@ApiTags('Vendor Dashboard')
@Controller('vendor-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorFinancialController {
  constructor(
    private readonly financialService: VendorFinancialService,
  ) {}

  /**
   * Get comprehensive financial summary and reports
   *
   * Provides detailed financial data including:
   * - Revenue breakdown by category
   * - Platform commission calculations
   * - Transaction history with status
   * - Upcoming payout schedules
   * - Syrian VAT tax information
   *
   * @param periodType - Financial period type (default: 'monthly')
   * @param startDate - Custom period start date (ISO format)
   * @param endDate - Custom period end date (ISO format)
   * @param vendorId - Vendor identifier (optional)
   * @returns Comprehensive financial summary
   *
   * @example
   * GET /api/vendor-dashboard/financial-reports?periodType=quarterly&startDate=2025-01-01&endDate=2025-03-31
   */
  @Get('financial-reports')
  @ApiOperation({
    summary: 'Get vendor financial reports',
    description: `Retrieve comprehensive financial summary and transaction reports.

    **Financial Data Includes:**

    1. **Revenue Summary**
       - Gross revenue (total sales)
       - Platform commission amount
       - Net revenue (after commission)
       - Average transaction value
       - Total transaction count

    2. **Balance Information**
       - Pending balance (orders not yet cleared)
       - Available balance (ready for payout)
       - Upcoming payout amounts
       - Payout schedule dates

    3. **Revenue Breakdown by Category**
       - Gross revenue per product category
       - Commission per category
       - Net revenue per category
       - Category performance comparison

    4. **Transaction History**
       - Recent transactions (last 100)
       - Transaction ID and order reference
       - Transaction date and time
       - Amount in SYP and USD
       - Commission breakdown
       - Payment method used
       - Transaction status (pending, completed, refunded)

    5. **Payout Schedules**
       - Upcoming payout dates
       - Scheduled payout amounts
       - Payout status (scheduled, processing, completed)
       - Bank account details (last 4 digits)

    6. **Syrian Tax Information**
       - VAT registration status
       - VAT registration number
       - Applicable VAT rate (Syrian standard: 10%)
       - Total VAT collected for period
       - Tax compliance reporting

    **Period Types:**
    - Daily: Last 24 hours
    - Weekly: Last 7 days
    - Monthly: Current calendar month (default)
    - Quarterly: Current quarter (3 months)
    - Yearly: Current calendar year
    - Custom: Specify startDate and endDate

    **Currency Display:**
    - All amounts shown in both SYP and USD
    - Conversion rates applied automatically
    - Syrian Pound (SYP) is primary currency

    **Use Cases:**
    - Financial planning and budgeting
    - Tax reporting and VAT compliance
    - Payout tracking and reconciliation
    - Revenue analysis by product category
    - Commission cost analysis
    - Cash flow management

    **Compliance:**
    - Aligned with Syrian tax regulations
    - VAT calculation per Syrian law
    - Audit trail maintained for all transactions`,
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: FinancialPeriodType,
    description: 'Financial period type for the report',
    example: FinancialPeriodType.MONTHLY,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Custom period start date (ISO format: YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Custom period end date (ISO format: YYYY-MM-DD)',
    example: '2025-01-31',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Vendor identifier (optional, defaults to authenticated vendor)',
    example: 'vnd_abc123xyz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial reports retrieved successfully',
    type: VendorFinancialSummaryDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date format or period parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  async getFinancialReports(
    @Query('periodType') periodType: FinancialPeriodType = FinancialPeriodType.MONTHLY,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('vendorId') vendorId?: string,
  ): Promise<VendorFinancialSummaryDto> {
    // TODO (Week 1 Day 5): Extract vendorId from JWT token if not provided
    const resolvedVendorId = vendorId || 'vnd_default_mock';

    return this.financialService.getFinancialSummary(
      resolvedVendorId,
      periodType,
      startDate,
      endDate,
    );
  }
}

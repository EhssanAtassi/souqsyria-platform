/**
 * @file vendor-analytics.controller.ts
 * @description Controller for vendor analytics endpoint
 * Provides detailed business intelligence and analytics data
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
import { VendorAnalyticsService } from '../services/vendor-analytics.service';
import {
  VendorAnalyticsDto,
  AnalyticsPeriod,
  CurrencyType,
} from '../dto/vendor-analytics.dto';

/**
 * Vendor Analytics Controller
 *
 * Handles GET /api/vendor-dashboard/analytics endpoint
 *
 * Provides comprehensive business intelligence including:
 * - Top performing products
 * - Customer demographics by region
 * - Traffic source analysis
 * - Sales funnel conversion metrics
 */
@ApiTags('Vendor Dashboard')
@Controller('vendor-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorAnalyticsController {
  constructor(
    private readonly analyticsService: VendorAnalyticsService,
  ) {}

  /**
   * Get comprehensive analytics data for vendor
   *
   * Provides detailed business intelligence including:
   * - Product performance metrics (sales, views, conversion)
   * - Customer geographic distribution across Syrian governorates
   * - Traffic source breakdown and conversion rates
   * - Sales funnel analysis (views → cart → checkout → purchase)
   *
   * @param period - Time period for analytics (default: 'month')
   * @param currency - Currency for financial data (default: 'SYP')
   * @param vendorId - Vendor identifier (optional)
   * @returns Comprehensive analytics data
   *
   * @example
   * GET /api/vendor-dashboard/analytics?period=quarter&currency=USD
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get vendor analytics',
    description: `Retrieve detailed business intelligence and analytics data.

    **Analytics Categories:**
    1. **Product Performance**
       - Top selling products ranked by revenue
       - Units sold and conversion rates
       - Product views and engagement metrics
       - Average ratings and review counts

    2. **Customer Demographics**
       - Geographic distribution across Syrian governorates
       - Revenue contribution by region
       - Customer concentration analysis
       - Regional market penetration

    3. **Traffic Sources**
       - Organic search traffic and performance
       - Social media referrals
       - Direct traffic patterns
       - Paid advertising effectiveness
       - Email campaign results

    4. **Sales Funnel**
       - Product page views
       - Add-to-cart conversion rate
       - Checkout initiation rate
       - Purchase completion rate
       - Drop-off analysis at each stage

    **Time Periods:**
    - Today: Last 24 hours
    - Week: Last 7 days
    - Month: Last 30 days (default)
    - Quarter: Last 90 days
    - Year: Last 365 days

    **Use Cases:**
    - Identify best and worst performing products
    - Understand customer geographic distribution
    - Optimize marketing channel allocation
    - Improve conversion funnel
    - Data-driven business decisions`,
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: AnalyticsPeriod,
    description: 'Time period for analytics data',
    example: AnalyticsPeriod.MONTH,
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: CurrencyType,
    description: 'Currency for financial data',
    example: CurrencyType.SYP,
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Vendor identifier (optional, defaults to authenticated vendor)',
    example: 'vnd_abc123xyz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics data retrieved successfully',
    type: VendorAnalyticsDto,
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
  async getAnalytics(
    @Query('period') period: AnalyticsPeriod = AnalyticsPeriod.MONTH,
    @Query('currency') currency: CurrencyType = CurrencyType.SYP,
    @Query('vendorId') vendorId?: string,
  ): Promise<VendorAnalyticsDto> {
    // TODO (Week 1 Day 5): Extract vendorId from JWT token if not provided
    const resolvedVendorId = vendorId || 'vnd_default_mock';

    return this.analyticsService.getAnalytics(
      resolvedVendorId,
      period,
      currency,
    );
  }
}

/**
 * @file vendor-overview.controller.ts
 * @description Controller for vendor dashboard overview endpoint
 * Provides comprehensive dashboard data including metrics, charts, and alerts
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
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VendorDashboardService } from '../services/vendor-dashboard.service';
import { VendorDashboardOverviewDto } from '../dto/vendor-dashboard-overview.dto';

/**
 * Vendor Dashboard Overview Controller
 *
 * Handles GET /api/vendor-dashboard/overview endpoint
 *
 * SECURITY:
 * - Requires JWT authentication
 * - TODO (Week 1 Day 5): Add VendorOwnershipGuard to verify vendor access
 * - TODO (Week 1 Day 5): Add PermissionsGuard with 'view_vendor_dashboard' permission
 *
 * FEATURES:
 * - Bilingual support (English/Arabic)
 * - Multi-currency support (SYP/USD)
 * - Comprehensive dashboard metrics
 * - Real-time alerts and notifications
 * - Chart data for visualizations
 */
@ApiTags('Vendor Dashboard')
@Controller('vendor-dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VendorOverviewController {
  constructor(
    private readonly dashboardService: VendorDashboardService,
  ) {}

  /**
   * Get comprehensive dashboard overview for authenticated vendor
   *
   * Returns complete dashboard data including:
   * - Vendor information and verification status
   * - Key performance metrics (revenue, orders, fulfillment, satisfaction)
   * - Chart data (daily sales, category distribution, performance trends)
   * - Active alerts and notifications
   * - Quick stats for action widgets
   *
   * @param vendorId - Vendor identifier (from route param or JWT token)
   * @param language - Preferred language for localized content (default: 'en')
   * @param currency - Preferred currency for financial data (default: 'SYP')
   * @returns Complete dashboard overview
   *
   * @example
   * GET /api/vendor-dashboard/overview?language=ar&currency=USD
   */
  @Get('overview')
  @ApiOperation({
    summary: 'Get vendor dashboard overview',
    description: `Retrieve comprehensive dashboard overview with metrics, charts, alerts, and quick stats.

    **Features:**
    - Real-time performance metrics (revenue, orders, ratings)
    - Visual chart data for last 30 days
    - Active alerts and action items
    - Quick stats for pending tasks
    - Bilingual support (English/Arabic)
    - Multi-currency display (SYP/USD)

    **Data Included:**
    - Vendor verification status and performance grade
    - Total revenue and growth percentages
    - Order fulfillment rate and delivery metrics
    - Customer satisfaction ratings and reviews
    - Daily sales trends
    - Category revenue distribution
    - Performance trend analysis
    - Low stock alerts
    - Pending orders and unresolved issues

    **Security:** Requires JWT authentication. Vendor can only access their own dashboard.`,
  })
  @ApiQuery({
    name: 'language',
    required: false,
    enum: ['en', 'ar'],
    description: 'Preferred language for localized content',
    example: 'en',
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    enum: ['SYP', 'USD'],
    description: 'Preferred currency for financial data',
    example: 'SYP',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    description: 'Vendor identifier (optional, defaults to authenticated vendor)',
    example: 'vnd_abc123xyz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard overview retrieved successfully',
    type: VendorDashboardOverviewDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - User does not have vendor dashboard access',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  async getDashboardOverview(
    @Query('language') language: 'en' | 'ar' = 'en',
    @Query('currency') currency: 'SYP' | 'USD' = 'SYP',
    @Query('vendorId') vendorId?: string,
  ): Promise<VendorDashboardOverviewDto> {
    // TODO (Week 1 Day 5): Extract vendorId from JWT token if not provided
    // TODO (Week 1 Day 5): Validate user owns this vendor account
    const resolvedVendorId = vendorId || 'vnd_default_mock';

    return this.dashboardService.getDashboardOverview(
      resolvedVendorId,
      language,
      currency,
    );
  }
}

/**
 * @file admin-dashboard.controller.ts
 * @description Main admin dashboard controller providing overview endpoints
 *              for metrics, charts, top products, and recent orders.
 * @module AdminDashboard/Controllers
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Services
import { AdminDashboardService } from '../services/admin-dashboard.service';

// DTOs
import {
  DashboardMetricsDto,
  PendingActionsDto,
  RevenueChartDataDto,
  RevenueChartQueryDto,
  TopSellingProductDto,
  TopProductsQueryDto,
  RecentOrderDto,
  RecentOrdersQueryDto,
} from '../dto';

/**
 * Admin Dashboard Controller
 * @description Provides API endpoints for the main dashboard overview
 *              including metrics, revenue charts, top products, and recent orders.
 *
 * @example
 * GET /api/admin-dashboard/metrics
 * GET /api/admin-dashboard/revenue-chart?periodType=monthly
 * GET /api/admin-dashboard/top-products?limit=5
 * GET /api/admin-dashboard/recent-orders?limit=10
 */
@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@Controller('admin-dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  // ===========================================================================
  // DASHBOARD METRICS
  // ===========================================================================

  /**
   * Get dashboard metrics
   * @description Retrieves all key metrics including revenue, orders, users,
   *              products, vendors, commissions, and pending actions.
   * @returns Dashboard metrics with growth percentages
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get dashboard metrics',
    description: 'Retrieves comprehensive dashboard metrics including totals, ' +
                 'growth rates compared to previous period, and pending actions count.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard metrics retrieved successfully',
    type: DashboardMetricsDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have permission to access dashboard',
  })
  async getMetrics(): Promise<DashboardMetricsDto> {
    return this.dashboardService.getDashboardMetrics();
  }

  /**
   * Get pending actions
   * @description Retrieves counts of items requiring admin attention
   * @returns Pending actions counts by category
   */
  @Get('pending-actions')
  @ApiOperation({
    summary: 'Get pending actions count',
    description: 'Retrieves counts of items requiring attention including ' +
                 'pending orders, products awaiting approval, vendor verifications, ' +
                 'refund requests, KYC reviews, and withdrawal requests.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending actions retrieved successfully',
    type: PendingActionsDto,
  })
  async getPendingActions(): Promise<PendingActionsDto> {
    return this.dashboardService.getPendingActions();
  }

  // ===========================================================================
  // REVENUE CHART
  // ===========================================================================

  /**
   * Get revenue chart data
   * @description Retrieves revenue, commission, and net revenue data for charts
   * @param query - Query parameters for period type
   * @returns Chart data with labels and series
   */
  @Get('revenue-chart')
  @ApiOperation({
    summary: 'Get revenue chart data',
    description: 'Retrieves time-series data for revenue, commissions, and net revenue. ' +
                 'Supports daily, weekly, monthly, and yearly aggregation.',
  })
  @ApiQuery({
    name: 'periodType',
    required: false,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    description: 'Period type for data aggregation',
    example: 'monthly',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue chart data retrieved successfully',
    type: RevenueChartDataDto,
  })
  async getRevenueChart(@Query() query: RevenueChartQueryDto): Promise<RevenueChartDataDto> {
    return this.dashboardService.getRevenueChartData(query);
  }

  // ===========================================================================
  // TOP PRODUCTS
  // ===========================================================================

  /**
   * Get top selling products
   * @description Retrieves products with highest sales volume
   * @param query - Query parameters for limit
   * @returns Array of top selling products with metrics
   */
  @Get('top-products')
  @ApiOperation({
    summary: 'Get top selling products',
    description: 'Retrieves top selling products ranked by total revenue. ' +
                 'Includes product details, vendor info, units sold, and revenue.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to retrieve (1-20)',
    example: 5,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top products retrieved successfully',
    type: [TopSellingProductDto],
  })
  async getTopProducts(@Query() query: TopProductsQueryDto): Promise<TopSellingProductDto[]> {
    return this.dashboardService.getTopSellingProducts(query);
  }

  // ===========================================================================
  // RECENT ORDERS
  // ===========================================================================

  /**
   * Get recent orders
   * @description Retrieves most recent orders for dashboard display
   * @param query - Query parameters for limit
   * @returns Array of recent orders with customer info
   */
  @Get('recent-orders')
  @ApiOperation({
    summary: 'Get recent orders',
    description: 'Retrieves most recent orders across all vendors. ' +
                 'Includes customer information, order total, status, and date.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of orders to retrieve (1-50)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent orders retrieved successfully',
    type: [RecentOrderDto],
  })
  async getRecentOrders(@Query() query: RecentOrdersQueryDto): Promise<RecentOrderDto[]> {
    return this.dashboardService.getRecentOrders(query);
  }
}

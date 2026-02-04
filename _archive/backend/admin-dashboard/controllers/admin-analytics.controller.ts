/**
 * @file admin-analytics.controller.ts
 * @description Admin controller for analytics and reporting operations including
 *              sales analytics, user analytics, commission reports, and data exports.
 * @module AdminDashboard/Controllers
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Services
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AdminExportService } from '../services/admin-export.service';

// DTOs
import {
  SalesAnalyticsQueryDto,
  SalesAnalyticsDto,
  UserAnalyticsQueryDto,
  UserAnalyticsDto,
  CommissionReportQueryDto,
  CommissionReportDto,
  ExportReportDto,
  ExportResultDto,
  DateRangeType,
} from '../dto';

/**
 * Admin Analytics Controller
 * @description Provides API endpoints for analytics and reporting in the admin dashboard.
 *              Supports sales analytics, user analytics, commission reports, and exports.
 */
@ApiTags('Admin Dashboard - Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@Controller('admin-dashboard/analytics')
export class AdminAnalyticsController {
  constructor(
    private readonly analyticsService: AdminAnalyticsService,
    private readonly exportService: AdminExportService,
  ) {}

  // ===========================================================================
  // SALES ANALYTICS
  // ===========================================================================

  /**
   * Get sales analytics
   * @description Retrieves comprehensive sales analytics for the specified period
   * @param query - Query parameters for date range and filters
   * @returns Sales analytics data
   */
  @Get('sales')
  @ApiOperation({
    summary: 'Get sales analytics',
    description: 'Retrieves comprehensive sales analytics including revenue, orders, ' +
                 'average order value, and trends for the specified time period.',
  })
  @ApiQuery({
    name: 'dateRangeType',
    required: false,
    enum: DateRangeType,
    description: 'Predefined date range',
    example: 'last_30_days',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Custom start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'Custom end date (ISO format)',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    type: Number,
    description: 'Filter by vendor ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: Number,
    description: 'Filter by category ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales analytics retrieved successfully',
    type: SalesAnalyticsDto,
  })
  async getSalesAnalytics(@Query() query: SalesAnalyticsQueryDto): Promise<SalesAnalyticsDto> {
    return this.analyticsService.getSalesAnalytics(query);
  }

  /**
   * Get sales by category
   * @description Retrieves sales breakdown by product category
   * @param query - Query parameters for date range
   * @returns Sales data grouped by category
   */
  @Get('sales/by-category')
  @ApiOperation({
    summary: 'Get sales by category',
    description: 'Retrieves sales breakdown by product category for the specified period.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category sales retrieved successfully',
  })
  async getSalesByCategory(@Query() query: SalesAnalyticsQueryDto): Promise<{
    categories: Array<{
      categoryId: number;
      categoryName: string;
      revenue: number;
      orders: number;
      percentage: number;
    }>;
  }> {
    return this.analyticsService.getSalesByCategoryPublic(query);
  }

  /**
   * Get sales by vendor
   * @description Retrieves sales breakdown by vendor
   * @param query - Query parameters for date range
   * @returns Sales data grouped by vendor
   */
  @Get('sales/by-vendor')
  @ApiOperation({
    summary: 'Get sales by vendor',
    description: 'Retrieves sales breakdown by vendor for the specified period.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor sales retrieved successfully',
  })
  async getSalesByVendor(@Query() query: SalesAnalyticsQueryDto): Promise<{
    vendors: Array<{
      vendorId: number;
      vendorName: string;
      revenue: number;
      orders: number;
      commission: number;
      percentage: number;
    }>;
  }> {
    return this.analyticsService.getSalesByVendor(query);
  }

  /**
   * Get sales trends
   * @description Retrieves sales trend data for charting
   * @param query - Query parameters for date range and granularity
   * @returns Time-series sales data
   */
  @Get('sales/trends')
  @ApiOperation({
    summary: 'Get sales trends',
    description: 'Retrieves time-series sales data for trend visualization.',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    description: 'Data point granularity',
    example: 'daily',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sales trends retrieved successfully',
  })
  async getSalesTrends(@Query() query: SalesAnalyticsQueryDto & { granularity?: string }): Promise<{
    dataPoints: Array<{
      date: string;
      revenue: number;
      orders: number;
      averageOrderValue: number;
    }>;
  }> {
    return this.analyticsService.getSalesTrends(query);
  }

  /**
   * Get revenue chart data
   * @description Retrieves revenue data for chart visualization
   * @param query - Query parameters for date range and interval
   * @returns Revenue chart data points
   */
  @Get('sales/revenue-chart')
  @ApiOperation({
    summary: 'Get revenue chart data',
    description: 'Retrieves revenue data points for chart visualization.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'interval', required: false, enum: ['daily', 'weekly', 'monthly'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue chart data retrieved successfully',
  })
  async getRevenueChart(@Query() query: SalesAnalyticsQueryDto & { interval?: string }): Promise<Array<{
    date: string;
    revenue: number;
    orders: number;
    commission: number;
  }>> {
    return this.analyticsService.getRevenueChartData(query);
  }

  /**
   * Get top selling products
   * @description Retrieves top selling products for the period
   * @param query - Query parameters for date range and limit
   * @returns Top products list
   */
  @Get('sales/top-products')
  @ApiOperation({
    summary: 'Get top selling products',
    description: 'Retrieves top selling products ranked by sales volume.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Top products retrieved successfully',
  })
  async getTopProducts(@Query() query: SalesAnalyticsQueryDto & { limit?: number }): Promise<Array<{
    id: number;
    name: string;
    nameAr: string;
    category: string;
    sales: number;
    revenue: number;
    image: string;
    trend: number;
  }>> {
    return this.analyticsService.getTopProductsData(query);
  }

  /**
   * Get sales by categories
   * @description Retrieves sales breakdown by product categories
   * @param query - Query parameters for date range
   * @returns Category sales data
   */
  @Get('sales/categories')
  @ApiOperation({
    summary: 'Get sales by categories',
    description: 'Retrieves sales breakdown by product categories.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category sales retrieved successfully',
  })
  async getSalesCategories(@Query() query: SalesAnalyticsQueryDto): Promise<Array<{
    name: string;
    nameAr: string;
    value: number;
    percentage: number;
    color: string;
  }>> {
    return this.analyticsService.getSalesCategoriesData(query);
  }

  /**
   * Get payment methods statistics
   * @description Retrieves payment method usage statistics
   * @param query - Query parameters for date range
   * @returns Payment methods data
   */
  @Get('sales/payment-methods')
  @ApiOperation({
    summary: 'Get payment methods stats',
    description: 'Retrieves payment method usage statistics.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment methods stats retrieved successfully',
  })
  async getPaymentMethods(@Query() query: SalesAnalyticsQueryDto): Promise<Array<{
    method: string;
    methodAr: string;
    count: number;
    amount: number;
    percentage: number;
    icon: string;
  }>> {
    return this.analyticsService.getPaymentMethodsData(query);
  }

  /**
   * Get geographic sales data
   * @description Retrieves sales data by geographic location
   * @param query - Query parameters for date range and limit
   * @returns Geographic sales data
   */
  @Get('sales/geography')
  @ApiOperation({
    summary: 'Get geographic sales data',
    description: 'Retrieves sales breakdown by geographic region.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Geographic sales data retrieved successfully',
  })
  async getGeographySales(@Query() query: SalesAnalyticsQueryDto & { limit?: number }): Promise<Array<{
    region: string;
    regionAr: string;
    orders: number;
    revenue: number;
    percentage: number;
  }>> {
    return this.analyticsService.getGeographySalesData(query);
  }

  // ===========================================================================
  // USER ANALYTICS
  // ===========================================================================

  /**
   * Get user analytics
   * @description Retrieves comprehensive user analytics for the specified period
   * @param query - Query parameters for date range and filters
   * @returns User analytics data
   */
  @Get('users')
  @ApiOperation({
    summary: 'Get user analytics',
    description: 'Retrieves comprehensive user analytics including registrations, ' +
                 'active users, retention rates, and demographic breakdown.',
  })
  @ApiQuery({
    name: 'dateRangeType',
    required: false,
    enum: DateRangeType,
    description: 'Predefined date range',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User analytics retrieved successfully',
    type: UserAnalyticsDto,
  })
  async getUserAnalytics(@Query() query: UserAnalyticsQueryDto): Promise<UserAnalyticsDto> {
    return this.analyticsService.getUserAnalytics(query);
  }

  /**
   * Get user registration trends
   * @description Retrieves user registration trends over time
   * @param query - Query parameters for date range
   * @returns Time-series registration data
   */
  @Get('users/registrations')
  @ApiOperation({
    summary: 'Get registration trends',
    description: 'Retrieves user registration trends for trend visualization.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration trends retrieved successfully',
  })
  async getRegistrationTrends(@Query() query: UserAnalyticsQueryDto): Promise<{
    dataPoints: Array<{
      date: string;
      newUsers: number;
      activeUsers: number;
    }>;
  }> {
    return this.analyticsService.getRegistrationTrends(query);
  }

  /**
   * Get user engagement metrics
   * @description Retrieves user engagement and activity metrics
   * @param query - Query parameters for date range
   * @returns User engagement data
   */
  @Get('users/engagement')
  @ApiOperation({
    summary: 'Get user engagement metrics',
    description: 'Retrieves user engagement metrics including login frequency, ' +
                 'session duration, and interaction patterns.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Engagement metrics retrieved successfully',
  })
  async getUserEngagement(@Query() query: UserAnalyticsQueryDto): Promise<{
    averageSessionDuration: number;
    pageViewsPerSession: number;
    bounceRate: number;
    retentionRate: number;
  }> {
    return this.analyticsService.getUserEngagement(query);
  }

  // ===========================================================================
  // COMMISSION ANALYTICS
  // ===========================================================================

  /**
   * Get commission report
   * @description Retrieves commission analytics and breakdown
   * @param query - Query parameters for date range and filters
   * @returns Commission report data
   */
  @Get('commissions')
  @ApiOperation({
    summary: 'Get commission report',
    description: 'Retrieves commission analytics including total commissions, ' +
                 'paid/pending breakdown, and commission by vendor.',
  })
  @ApiQuery({
    name: 'dateRangeType',
    required: false,
    enum: DateRangeType,
    description: 'Predefined date range',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    type: Number,
    description: 'Filter by vendor ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission report retrieved successfully',
    type: CommissionReportDto,
  })
  async getCommissionReport(@Query() query: CommissionReportQueryDto): Promise<CommissionReportDto> {
    return this.analyticsService.getCommissionReport(query);
  }

  /**
   * Get commission trends
   * @description Retrieves commission trends over time
   * @param query - Query parameters for date range
   * @returns Time-series commission data
   */
  @Get('commissions/trends')
  @ApiOperation({
    summary: 'Get commission trends',
    description: 'Retrieves commission trends for trend visualization.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission trends retrieved successfully',
  })
  async getCommissionTrends(@Query() query: CommissionReportQueryDto): Promise<{
    dataPoints: Array<{
      date: string;
      amount: number;
      count: number;
    }>;
  }> {
    return this.analyticsService.getCommissionTrendsPublic(query);
  }

  // ===========================================================================
  // PRODUCT ANALYTICS
  // ===========================================================================

  /**
   * Get product performance analytics
   * @description Retrieves product performance metrics
   * @param query - Query parameters for date range and filters
   * @returns Product performance data
   */
  @Get('products')
  @ApiOperation({
    summary: 'Get product analytics',
    description: 'Retrieves product performance analytics including views, ' +
                 'conversion rates, and sales metrics.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Product analytics retrieved successfully',
  })
  async getProductAnalytics(@Query() query: SalesAnalyticsQueryDto): Promise<{
    topProducts: Array<{
      productId: number;
      name: string;
      sales: number;
      revenue: number;
    }>;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
  }> {
    return this.analyticsService.getProductAnalytics(query);
  }

  // ===========================================================================
  // VENDOR ANALYTICS
  // ===========================================================================

  /**
   * Get vendor performance analytics
   * @description Retrieves vendor performance metrics
   * @param query - Query parameters for date range
   * @returns Vendor performance data
   */
  @Get('vendors')
  @ApiOperation({
    summary: 'Get vendor analytics',
    description: 'Retrieves vendor performance analytics including sales, ' +
                 'ratings, and fulfillment metrics.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor analytics retrieved successfully',
  })
  async getVendorAnalytics(@Query() query: SalesAnalyticsQueryDto): Promise<{
    topVendors: Array<{
      vendorId: number;
      name: string;
      orders: number;
      revenue: number;
    }>;
    totalVendors: number;
    activeVendors: number;
    newVendors: number;
  }> {
    return this.analyticsService.getVendorAnalytics(query);
  }

  // ===========================================================================
  // EXPORT FUNCTIONALITY
  // ===========================================================================

  /**
   * Export report
   * @description Initiates an export job for the specified report type
   * @param dto - Export request details
   * @returns Export job details
   */
  @Post('export')
  @ApiOperation({
    summary: 'Export report',
    description: 'Initiates an async export job for the specified report type. ' +
                 'Returns a job ID to check export status.',
  })
  @ApiBody({ type: ExportReportDto })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Export job started',
    type: ExportResultDto,
  })
  async exportReport(@Body() dto: ExportReportDto): Promise<ExportResultDto> {
    return this.exportService.createExport(dto);
  }

  /**
   * Get export status
   * @description Checks the status of an export job
   * @param jobId - Export job ID
   * @returns Export job status
   */
  @Get('export/:jobId')
  @ApiOperation({
    summary: 'Get export status',
    description: 'Checks the status of an async export job. Returns download URL when complete.',
  })
  @ApiParam({ name: 'jobId', description: 'Export job ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Export status retrieved successfully',
    type: ExportResultDto,
  })
  async getExportStatus(@Param('jobId') jobId: string): Promise<ExportResultDto> {
    return this.exportService.getExportStatus(jobId);
  }

  /**
   * Download export file
   * @description Downloads a completed export file
   * @param jobId - Export job ID
   * @param res - Express response object
   */
  @Get('export/:jobId/download')
  @ApiOperation({
    summary: 'Download export file',
    description: 'Downloads the exported file for a completed export job.',
  })
  @ApiParam({ name: 'jobId', description: 'Export job ID', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File download initiated',
  })
  async downloadExport(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.exportService.getExportStatus(jobId);

    if (result.status !== 'completed' || !result.downloadUrl) {
      res.status(HttpStatus.NOT_FOUND).json({
        error: 'Export not ready or not found',
      });
      return;
    }

    // In a real implementation, this would stream the file from storage
    res.redirect(result.downloadUrl);
  }

  /**
   * Quick export - Sales report
   * @description Directly exports sales report as CSV
   * @param query - Query parameters for date range
   * @param res - Express response object
   */
  @Get('export/sales/csv')
  @ApiOperation({
    summary: 'Quick export sales CSV',
    description: 'Directly exports sales data as CSV file.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file download',
  })
  async quickExportSalesCsv(
    @Query() query: SalesAnalyticsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.exportService.generateSalesCsv(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.csv`);
    res.send(csvData);
  }

  /**
   * Quick export - Users report
   * @description Directly exports user report as CSV
   * @param query - Query parameters for date range
   * @param res - Express response object
   */
  @Get('export/users/csv')
  @ApiOperation({
    summary: 'Quick export users CSV',
    description: 'Directly exports user data as CSV file.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file download',
  })
  async quickExportUsersCsv(
    @Query() query: UserAnalyticsQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.exportService.generateUsersCsv(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-report-${Date.now()}.csv`);
    res.send(csvData);
  }

  /**
   * Quick export - Commission report
   * @description Directly exports commission report as CSV
   * @param query - Query parameters for date range
   * @param res - Express response object
   */
  @Get('export/commissions/csv')
  @ApiOperation({
    summary: 'Quick export commissions CSV',
    description: 'Directly exports commission data as CSV file.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CSV file download',
  })
  async quickExportCommissionsCsv(
    @Query() query: CommissionReportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csvData = await this.exportService.generateCommissionsCsv(query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=commissions-report-${Date.now()}.csv`);
    res.send(csvData);
  }

  // ===========================================================================
  // DASHBOARD SUMMARY
  // ===========================================================================

  /**
   * Get analytics dashboard summary
   * @description Retrieves a high-level summary of all analytics for the dashboard
   * @returns Dashboard analytics summary
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get analytics summary',
    description: 'Retrieves a high-level summary of all analytics metrics for the dashboard.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics summary retrieved successfully',
  })
  async getAnalyticsSummary(): Promise<{
    revenue: { today: number; week: number; month: number };
    orders: { today: number; week: number; month: number };
    users: { total: number; newToday: number; active: number };
  }> {
    return this.analyticsService.getAnalyticsSummary();
  }
}

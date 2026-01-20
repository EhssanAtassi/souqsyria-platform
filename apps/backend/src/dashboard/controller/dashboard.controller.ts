/**
 * ------------------------------------------------------------
 * DashboardController
 * ------------------------------------------------------------
 * This controller exposes the main dashboard analytics endpoints
 * for two user types:
 *
 * - Admin: Platform-wide metrics (`/dashboard/admin/metrics`)
 * - Vendor: Personal business metrics (`/dashboard/vendor/metrics`)
 *
 * Features:
 * - Guarded using `JwtAuthGuard` and `PermissionsGuard`
 * - Accepts optional `start_date` and `end_date` filters
 * - Returns fully aggregated data using DashboardService
 */

import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { DashboardService } from '../service/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { DashboardServiceResponse } from '../interfaces/admin-metrics.interface';
import { VendorDashboardResponse } from '../interfaces/vendor-metrics.interface';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Admin-only: Get full platform-level KPIs
   */
  @Get('admin/metrics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get global platform metrics (Admin only)' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiResponse({ status: 200, description: 'Returns dashboard KPIs for admin' })
  async getAdminMetrics(
    @Req() req: Request,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<DashboardServiceResponse> {
    const user = req.user as any;
    return this.dashboardService.getAdminMetrics(user, startDate, endDate);
  }

  /**
   * Vendor-only: Get personalized store metrics
   */
  @Get('vendor/metrics')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({ summary: 'Get vendor-specific dashboard metrics' })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiResponse({ status: 200, description: 'Returns vendor KPIs' })
  async getVendorMetrics(
    @Req() req: Request,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<VendorDashboardResponse> {
    const user = req.user as any;
    return this.dashboardService.getVendorMetrics(user, startDate, endDate);
  }
}

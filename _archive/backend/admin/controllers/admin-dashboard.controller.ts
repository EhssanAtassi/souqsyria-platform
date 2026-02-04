import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import {
  AdminDashboardService,
  ActivityResponse,
  DashboardMetricsResponse,
  HighlightResponse,
  OrderStatusResponse,
} from '../services/admin-dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('metrics')
  getMetrics(): Promise<DashboardMetricsResponse> {
    return this.adminDashboardService.getMetrics();
  }

  @Get('order-status')
  getOrderStatus(): Promise<OrderStatusResponse[]> {
    return this.adminDashboardService.getOrderStatusBreakdown();
  }

  @Get('activities')
  getActivities(): Promise<ActivityResponse[]> {
    return this.adminDashboardService.getActivityFeed();
  }

  @Get('highlights')
  getHighlights(): Promise<HighlightResponse[]> {
    return this.adminDashboardService.getHighlights();
  }
}

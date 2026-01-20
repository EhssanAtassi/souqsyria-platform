/**
 * @file coupons.controller.ts
 * @description Comprehensive coupon management controller for SouqSyria platform
 *
 * Provides full CRUD operations for coupons including:
 * - Coupon creation, update, deletion
 * - Coupon validation and application
 * - Usage analytics and reporting
 * - Syrian market specific features
 * - Bulk operations for enterprise use
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CouponsService } from '../services/coupons.service';
import { CreateCouponDto } from '../dto/create-coupon.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { ValidateCouponDto } from '../dto/validate-coupon.dto';
import { CouponQueryDto } from '../dto/coupon-query.dto';
import { BulkCouponActionDto } from '../dto/bulk-coupon-action.dto';
import { CouponResponseDto } from '../dto/coupon-response.dto';
import { CouponValidationResponseDto } from '../dto/coupon-validation-response.dto';
import { PaginatedCouponsResponseDto } from '../dto/paginated-coupons-response.dto';
import { CouponAnalyticsDto } from '../dto/coupon-analytics.dto';

@ApiTags('Coupons Management')
@ApiBearerAuth()
@Controller('api/promotions/coupons')
@UseGuards(PermissionsGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @Permissions('create_coupon')
  @ApiOperation({
    summary: 'Create new coupon',
    description: 'Create a new coupon with comprehensive Syrian market support',
  })
  @ApiResponse({
    status: 201,
    description: 'Coupon created successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coupon data provided',
  })
  @ApiResponse({
    status: 409,
    description: 'Coupon code already exists',
  })
  async createCoupon(
    @Body() createCouponDto: CreateCouponDto,
    @CurrentUser() user: any,
  ): Promise<CouponResponseDto> {
    try {
      return await this.couponsService.createCoupon(createCouponDto, user.id);
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new HttpException(
          'Coupon code already exists',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Failed to create coupon',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @Permissions('view_coupons')
  @ApiOperation({
    summary: 'Get all coupons with filtering',
    description:
      'Retrieve coupons with advanced filtering, pagination, and search',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by code or title',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by coupon type',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupons retrieved successfully',
    type: PaginatedCouponsResponseDto,
  })
  async getAllCoupons(
    @Query() query: CouponQueryDto,
  ): Promise<PaginatedCouponsResponseDto> {
    return await this.couponsService.getAllCoupons(query);
  }

  @Get(':id')
  @Permissions('view_coupons')
  @ApiOperation({
    summary: 'Get coupon by ID',
    description: 'Retrieve detailed information about a specific coupon',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon details retrieved successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  async getCouponById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponsService.getCouponById(id);
    if (!coupon) {
      throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    }
    return coupon;
  }

  @Get('code/:code')
  @Permissions('view_coupons')
  @ApiOperation({
    summary: 'Get coupon by code',
    description: 'Retrieve coupon information by its unique code',
  })
  @ApiParam({ name: 'code', description: 'Coupon code' })
  @ApiResponse({
    status: 200,
    description: 'Coupon details retrieved successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  async getCouponByCode(
    @Param('code') code: string,
  ): Promise<CouponResponseDto> {
    const coupon = await this.couponsService.getCouponByCode(code);
    if (!coupon) {
      throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    }
    return coupon;
  }

  @Put(':id')
  @Permissions('update_coupon')
  @ApiOperation({
    summary: 'Update coupon',
    description: 'Update an existing coupon with new information',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon updated successfully',
    type: CouponResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  async updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCouponDto: UpdateCouponDto,
    @CurrentUser() user: any,
  ): Promise<CouponResponseDto> {
    return await this.couponsService.updateCoupon(id, updateCouponDto, user.id);
  }

  @Delete(':id')
  @Permissions('delete_coupon')
  @ApiOperation({
    summary: 'Delete coupon',
    description: 'Soft delete a coupon (mark as cancelled)',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Coupon not found',
  })
  async deleteCoupon(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.couponsService.deleteCoupon(id, user.id);
    return { message: 'Coupon deleted successfully' };
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate coupon for order',
    description: 'Check if a coupon is valid and can be applied to an order',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon validation result',
    type: CouponValidationResponseDto,
  })
  async validateCoupon(
    @Body() validateCouponDto: ValidateCouponDto,
  ): Promise<CouponValidationResponseDto> {
    return await this.couponsService.validateCoupon(validateCouponDto);
  }

  @Post('apply')
  @ApiOperation({
    summary: 'Apply coupon to order',
    description: 'Apply a validated coupon to an actual order and record usage',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon applied successfully',
  })
  async applyCoupon(
    @Body() applyCouponDto: any, // TODO: Create ApplyCouponDto
  ): Promise<{ discount_amount: number; final_amount: number }> {
    return await this.couponsService.applyCoupon(applyCouponDto);
  }

  @Put(':id/activate')
  @Permissions('manage_coupons')
  @ApiOperation({
    summary: 'Activate coupon',
    description: 'Change coupon status to active',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon activated successfully',
  })
  async activateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.couponsService.activateCoupon(id, user.id);
    return { message: 'Coupon activated successfully' };
  }

  @Put(':id/deactivate')
  @Permissions('manage_coupons')
  @ApiOperation({
    summary: 'Deactivate coupon',
    description: 'Change coupon status to paused',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon deactivated successfully',
  })
  async deactivateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.couponsService.deactivateCoupon(id, user.id);
    return { message: 'Coupon deactivated successfully' };
  }

  @Post('bulk-action')
  @Permissions('manage_coupons')
  @ApiOperation({
    summary: 'Perform bulk action on coupons',
    description: 'Activate, deactivate, or delete multiple coupons at once',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk action completed successfully',
  })
  async bulkAction(
    @Body() bulkActionDto: BulkCouponActionDto,
    @CurrentUser() user: any,
  ): Promise<{ message: string; affected_count: number }> {
    const result = await this.couponsService.bulkAction(bulkActionDto, user.id);
    return {
      message: `Bulk ${bulkActionDto.action} completed successfully`,
      affected_count: result.affected_count,
    };
  }

  @Get(':id/analytics')
  @Permissions('view_coupon_analytics')
  @ApiOperation({
    summary: 'Get coupon analytics',
    description:
      'Retrieve detailed analytics and performance metrics for a coupon',
  })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  @ApiResponse({
    status: 200,
    description: 'Coupon analytics retrieved successfully',
    type: CouponAnalyticsDto,
  })
  async getCouponAnalytics(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CouponAnalyticsDto> {
    return await this.couponsService.getCouponAnalytics(id);
  }

  @Get('analytics/summary')
  @Permissions('view_coupon_analytics')
  @ApiOperation({
    summary: 'Get overall coupon analytics summary',
    description:
      'Retrieve summary analytics for all coupons with Syrian market insights',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Analytics period (7d, 30d, 90d)',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon analytics summary retrieved successfully',
  })
  async getCouponAnalyticsSummary(
    @Query('period') period: string = '30d',
  ): Promise<any> {
    return await this.couponsService.getCouponAnalyticsSummary(period);
  }
}

// src/commissions/commissions.controller.ts

import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  BadRequestException,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CommissionsService } from '../service/commissions.service';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CreateGlobalCommissionDto } from '../dto/create-global-commission.dto';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { CreateCategoryCommissionDto } from '../dto/create-category-commission.dto';
import { CreateVendorCommissionDto } from '../dto/create-vendor-commission.dto';
import { CreateProductCommissionDto } from '../dto/create-product-commission.dto';
import { CreateMembershipDiscountDto } from '../dto/create-membership-discount.dto';
import { Logger } from '@nestjs/common';

@ApiTags('Admin: Commissions')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@Controller('api/admin/commissions')
export class CommissionsController {
  private readonly logger = new Logger(CommissionsController.name);

  constructor(private readonly commissionsService: CommissionsService) {}

  /**
   * Get the current global fallback commission rule.
   */
  @Get('global')
  @ApiOperation({ summary: 'View global default commission rule' })
  async getGlobalCommission() {
    return this.commissionsService.getGlobalCommission();
  }

  /**
   * Create or update the global fallback commission rule.
   */
  @Post('global')
  @ApiOperation({ summary: 'Set or update global default commission rule' })
  async setGlobalCommission(
    @Body() dto: CreateGlobalCommissionDto,
    @Request() req,
  ) {
    const adminUserId = req.user?.uid;
    if (!adminUserId) {
      throw new BadRequestException('Missing admin identity');
    }
    return this.commissionsService.setGlobalCommission(dto, adminUserId);
  }

  /**
   * POST /api/admin/commissions/category
   * Create or update a commission for a category
   */
  @Post('category')
  @ApiOperation({ summary: 'Set commission rate for a category' })
  async setCategoryCommission(
    @Body() dto: CreateCategoryCommissionDto,
    @Request() req,
  ) {
    const adminUserId = req.user?.uid;
    if (!adminUserId) throw new BadRequestException('Missing admin identity');
    return this.commissionsService.setCategoryCommission(dto, adminUserId);
  }

  /**
   * GET /api/admin/commissions/category/:id
   * View the commission assigned to a specific category
   */
  @Get('category/:id')
  @ApiOperation({ summary: 'Get commission rule for a specific category' })
  async getCategoryCommission(@Param('id') categoryId: number) {
    return this.commissionsService.getCategoryCommission(categoryId);
  }

  /**
   * DELETE /api/admin/commissions/category/:id
   * Delete the override (revert to global fallback)
   */
  @Delete('category/:id')
  @ApiOperation({ summary: 'Remove category-level commission override' })
  async deleteCategoryCommission(@Param('id') categoryId: number) {
    return this.commissionsService.deleteCategoryCommission(categoryId);
  }
  /**
   * POST /api/admin/commissions/vendor
   * Set or update commission rate for a vendor
   */
  @Post('vendor')
  @ApiOperation({ summary: 'Set commission rate for a vendor' })
  async setVendorCommission(
    @Body() dto: CreateVendorCommissionDto,
    @Request() req,
  ) {
    const adminUserId = req.user?.uid;
    if (!adminUserId) throw new BadRequestException('Missing admin identity');
    return this.commissionsService.setVendorCommission(dto, adminUserId);
  }

  /**
   * GET /api/admin/commissions/vendor/:id
   * View commission override for a vendor
   */
  @Get('vendor/:id')
  @ApiOperation({ summary: 'Get commission rule for a specific vendor' })
  async getVendorCommission(@Param('id') vendorId: number) {
    return this.commissionsService.getVendorCommission(vendorId);
  }

  /**
   * DELETE /api/admin/commissions/vendor/:id
   * Delete vendor override (revert to category/global)
   */
  @Delete('vendor/:id')
  @ApiOperation({ summary: 'Remove vendor-level commission override' })
  async deleteVendorCommission(@Param('id') vendorId: number) {
    return this.commissionsService.deleteVendorCommission(vendorId);
  }
  /**
   * POST /api/admin/commissions/product
   * Set or update commission rule for a specific product
   */
  @Post('product')
  @ApiOperation({ summary: 'Set commission rate for a product' })
  async setProductCommission(
    @Body() dto: CreateProductCommissionDto,
    @Request() req,
  ) {
    const adminUserId = req.user?.uid;
    if (!adminUserId) throw new BadRequestException('Missing admin identity');
    return this.commissionsService.setProductCommission(dto, adminUserId);
  }

  /**
   * GET /api/admin/commissions/product/:id
   * Get commission override for a specific product
   */
  @Get('product/:id')
  @ApiOperation({ summary: 'Get commission rule for a specific product' })
  async getProductCommission(@Param('id') productId: number) {
    return this.commissionsService.getProductCommission(productId);
  }

  /**
   * DELETE /api/admin/commissions/product/:id
   * Remove override for a product (falls back to vendor/category/global)
   */
  @Delete('product/:id')
  @ApiOperation({ summary: 'Remove product-level commission override' })
  async deleteProductCommission(@Param('id') productId: number) {
    return this.commissionsService.deleteProductCommission(productId);
  }

  /**
   * POST /api/admin/commissions/membership
   * Set or update discount rate for a membership tier
   */
  @Post('membership')
  @ApiOperation({ summary: 'Set commission discount for a membership tier' })
  async setMembershipDiscount(
    @Body() dto: CreateMembershipDiscountDto,
    @Request() req,
  ) {
    const adminUserId = req.user?.uid;
    if (!adminUserId) throw new BadRequestException('Missing admin identity');
    return this.commissionsService.setMembershipDiscount(dto, adminUserId);
  }

  /**
   * GET /api/admin/commissions/membership/:id
   * View the discount for a membership tier
   */
  @Get('membership/:id')
  @ApiOperation({ summary: 'Get discount rule for a membership tier' })
  async getMembershipDiscount(@Param('id') membershipId: number) {
    return this.commissionsService.getMembershipDiscount(membershipId);
  }

  /**
   * DELETE /api/admin/commissions/membership/:id
   * Remove discount for a membership tier
   */
  @Delete('membership/:id')
  @ApiOperation({ summary: 'Remove membership-tier discount rule' })
  @ApiParam({ name: 'id', description: 'Membership ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Discount rule deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Membership discount not found' })
  async deleteMembershipDiscount(@Param('id') membershipId: number) {
    return this.commissionsService.deleteMembershipDiscount(membershipId);
  }

  /**
   * ENTERPRISE FEATURE: Bulk calculate commissions for multiple orders
   * POST /api/admin/commissions/bulk-calculate
   */
  @Post('bulk-calculate')
  @ApiOperation({
    summary: 'Bulk calculate commissions for multiple orders',
    description:
      'Processes commission calculations in batches for high-performance bulk operations',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of order IDs to process',
        },
        batchSize: {
          type: 'number',
          description: 'Number of orders to process per batch (default: 100)',
          default: 100,
        },
      },
      required: ['orderIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk calculation completed',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number' },
        failed: { type: 'number' },
        totalCommission: { type: 'number' },
        processingTime: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              orderId: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async bulkCalculateCommissions(
    @Body() body: { orderIds: number[]; batchSize?: number },
    @Request() req,
  ) {
    const { orderIds, batchSize = 100 } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new BadRequestException('orderIds must be a non-empty array');
    }

    if (batchSize < 1 || batchSize > 1000) {
      throw new BadRequestException('batchSize must be between 1 and 1000');
    }

    this.logger.log(
      `Admin ${req.user?.uid} initiated bulk commission calculation for ${orderIds.length} orders`,
    );

    return this.commissionsService.bulkCalculateCommissions(
      orderIds,
      batchSize,
    );
  }

  /**
   * ENTERPRISE FEATURE: Get comprehensive commission analytics
   * GET /api/admin/commissions/analytics
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get comprehensive commission analytics',
    description:
      'Provides detailed commission breakdown, vendor performance, and trend analysis',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: 'string',
    description: 'Start date for analytics (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: 'string',
    description: 'End date for analytics (ISO format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'vendorId',
    required: false,
    type: 'number',
    description: 'Optional vendor ID to filter analytics',
  })
  @ApiResponse({
    status: 200,
    description: 'Commission analytics data',
    schema: {
      type: 'object',
      properties: {
        totalCommission: { type: 'number' },
        totalOrders: { type: 'number' },
        averageCommissionRate: { type: 'number' },
        commissionByVendor: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vendorId: { type: 'number' },
              vendorName: { type: 'string' },
              totalCommission: { type: 'number' },
              orderCount: { type: 'number' },
              averageRate: { type: 'number' },
            },
          },
        },
        commissionByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categoryId: { type: 'number' },
              categoryName: { type: 'string' },
              totalCommission: { type: 'number' },
              orderCount: { type: 'number' },
              averageRate: { type: 'number' },
            },
          },
        },
        dailyBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              totalCommission: { type: 'number' },
              orderCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid date parameters' })
  async getCommissionAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('vendorId') vendorId?: number,
    @Request() req?,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      );
    }

    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Limit date range to prevent performance issues
    const daysDiff =
      Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      throw new BadRequestException('Date range cannot exceed 365 days');
    }

    this.logger.log(
      `Admin ${req.user?.uid} requested commission analytics from ${startDate} to ${endDate}`,
    );

    return this.commissionsService.getCommissionAnalytics(start, end, vendorId);
  }

  /**
   * ENTERPRISE FEATURE: Validate commission configuration
   * GET /api/admin/commissions/validate
   */
  @Get('validate')
  @ApiOperation({
    summary: 'Validate commission configuration',
    description:
      'Checks all commission rules for consistency and identifies potential issues',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation results',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['warning', 'error'] },
              message: { type: 'string' },
              entity: { type: 'string' },
              entityId: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async validateCommissionConfiguration(@Request() req) {
    this.logger.log(
      `Admin ${req.user?.uid} initiated commission configuration validation`,
    );
    return this.commissionsService.validateCommissionConfiguration();
  }

  /**
   * ENTERPRISE FEATURE: Get commission calculation for specific vendor
   * GET /api/admin/commissions/vendor/:id/calculate
   */
  @Get('vendor/:id/calculate')
  @ApiOperation({
    summary: 'Calculate total commission for a vendor',
    description:
      'Aggregates all commission amounts for a specific vendor across all orders',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Vendor commission calculation',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total commission amount for the vendor',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async calculateVendorCommission(
    @Param('id') vendorId: number,
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} requested commission calculation for vendor ${vendorId}`,
    );
    return this.commissionsService.calculateCommissionForVendor(vendorId);
  }
}

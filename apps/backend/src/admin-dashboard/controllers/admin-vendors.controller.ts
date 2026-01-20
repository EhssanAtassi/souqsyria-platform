/**
 * @file admin-vendors.controller.ts
 * @description Admin controller for vendor management operations including
 *              listing, verification workflow, commission management, and payouts.
 * @module AdminDashboard/Controllers
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  Req,
  NotFoundException,
  BadRequestException,
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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like, IsNull, Not } from 'typeorm';
import { Request } from 'express';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Entities
import { VendorEntity } from '../../vendors/entities/vendor.entity';
import { Order } from '../../orders/entities/order.entity';
import { ProductEntity } from '../../products/entities/product.entity';
import { VendorCommissionEntity } from '../../commissions/entites/vendor-commission.entity';
import { CommissionPayoutEntity, PayoutStatus, PayoutMethod } from '../../commissions/entites/commission-payout.entity';

// Services
import { AuditLogService } from '../../audit-log/service/audit-log.service';

// DTOs
import {
  VendorListQueryDto,
  VendorListItemDto,
  VendorDetailsDto,
  UpdateVendorVerificationDto,
  UpdateVendorCommissionDto,
  ProcessPayoutDto,
  PaginatedVendorListDto,
  VendorVerificationStatus,
  PayoutRequestItemDto,
  VendorCommissionSummaryDto,
  VendorMetricsDto,
} from '../dto';

/**
 * Extend Express Request to include user
 */
interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string };
}

/**
 * Admin Vendors Controller
 * @description Provides API endpoints for vendor management in the admin dashboard.
 *              Supports verification workflow, commission management, and payouts.
 */
@ApiTags('Admin Dashboard - Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@Controller('admin-dashboard/vendors')
export class AdminVendorsController {
  constructor(
    @InjectRepository(VendorEntity)
    private readonly vendorRepository: Repository<VendorEntity>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(VendorCommissionEntity)
    private readonly vendorCommissionRepository: Repository<VendorCommissionEntity>,

    @InjectRepository(CommissionPayoutEntity)
    private readonly commissionPayoutRepository: Repository<CommissionPayoutEntity>,

    private readonly auditLogService: AuditLogService,
  ) {}

  // ===========================================================================
  // VENDOR LISTING
  // ===========================================================================

  /**
   * Get paginated vendor list
   * @description Retrieves vendors with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of vendors
   */
  @Get()
  @ApiOperation({
    summary: 'Get vendor list',
    description: 'Retrieves paginated list of vendors with support for ' +
                 'search, verification status filtering, and sorting options.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor list retrieved successfully',
    type: PaginatedVendorListDto,
  })
  async getVendors(@Query() query: VendorListQueryDto): Promise<PaginatedVendorListDto> {
    const {
      page = 1,
      limit = 20,
      search,
      verificationStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.vendorRepository
      .createQueryBuilder('vendor')
      .leftJoinAndSelect('vendor.user', 'user');

    // Apply filters - VendorEntity uses storeName field
    if (search) {
      queryBuilder.andWhere(
        '(vendor.storeName LIKE :search OR user.email LIKE :search OR user.fullName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // VendorEntity uses isVerified boolean, not status enum
    if (verificationStatus) {
      if (verificationStatus === VendorVerificationStatus.APPROVED) {
        queryBuilder.andWhere('vendor.isVerified = :isVerified', { isVerified: true });
      } else if (verificationStatus === VendorVerificationStatus.PENDING) {
        queryBuilder.andWhere('vendor.isVerified = :isVerified', { isVerified: false });
      }
    }

    // Apply sorting
    const sortField = sortBy === 'shopName' ? 'vendor.storeName' : `vendor.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const vendors = await queryBuilder.getMany();

    // Map to DTOs with additional metrics
    const items: VendorListItemDto[] = await Promise.all(
      vendors.map(vendor => this.mapVendorToListItem(vendor)),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Get vendor details
   * @description Retrieves detailed information about a specific vendor
   * @param id - Vendor ID
   * @returns Vendor details with metrics and activity
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get vendor details',
    description: 'Retrieves comprehensive details about a specific vendor ' +
                 'including verification history, sales metrics, and recent activity.',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor details retrieved successfully',
    type: VendorDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  async getVendorDetails(@Param('id', ParseIntPipe) id: number): Promise<VendorDetailsDto> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Calculate metrics
    const [salesMetrics, commissionMetrics, recentActivity] = await Promise.all([
      this.getVendorSalesMetrics(id),
      this.getVendorCommissionMetrics(id),
      this.getVendorAuditLogs(id),
    ]);

    // Get product count - use vendor relation, not vendorId
    const productCount = await this.productRepository.count({
      where: { vendor: { id } },
    });

    // Get active product count
    const activeProductCount = await this.productRepository.count({
      where: { vendor: { id }, status: 'published' },
    });

    // Get vendor's commission rate
    const commissionRate = await this.getVendorCommissionRate(id);

    // Get last payout date
    const lastPayout = await this.commissionPayoutRepository.findOne({
      where: { vendor: { id }, status: PayoutStatus.COMPLETED },
      order: { processedDate: 'DESC' },
    });

    // Build VendorCommissionSummaryDto
    const commission: VendorCommissionSummaryDto = {
      currentRate: commissionRate || 10, // Default 10%
      totalPaid: commissionMetrics.paidCommission,
      pendingAmount: commissionMetrics.pendingCommission,
      lastPayoutDate: lastPayout?.processedDate || undefined,
    };

    // Build VendorMetricsDto
    const metrics: VendorMetricsDto = {
      totalSales: salesMetrics.totalRevenue,
      totalOrders: salesMetrics.totalOrders,
      averageOrderValue: salesMetrics.averageOrderValue,
      totalProducts: productCount,
      activeProducts: activeProductCount,
      averageRating: 0, // Would need reviews relation
      totalReviews: 0, // Would need reviews relation
      fulfillmentRate: 98.5, // Stub - would need order fulfillment tracking
      returnRate: 2.1, // Stub - would need return tracking
    };

    return {
      ...await this.mapVendorToListItem(vendor),
      descriptionEn: vendor.storeDescription || '',
      descriptionAr: vendor.storeDescription || '',
      businessAddress: '', // VendorEntity doesn't have this field
      businessRegistrationNumber: undefined,
      commission,
      metrics,
      categories: [], // Would need to fetch from products
      verificationHistory: recentActivity.map(log => ({
        status: VendorVerificationStatus.PENDING,
        timestamp: log.createdAt,
        notes: log.description || '',
      })),
      updatedAt: vendor.updatedAt,
    };
  }

  // ===========================================================================
  // VENDOR VERIFICATION
  // ===========================================================================

  /**
   * Get pending verifications
   * @description Retrieves vendors awaiting verification review
   * @returns List of vendors pending verification
   */
  @Get('verification/pending')
  @ApiOperation({
    summary: 'Get pending verifications',
    description: 'Retrieves all vendors that are not yet verified.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending verifications retrieved successfully',
    type: [VendorListItemDto],
  })
  async getPendingVerifications(): Promise<VendorListItemDto[]> {
    // VendorEntity uses isVerified boolean
    const vendors = await this.vendorRepository.find({
      where: { isVerified: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return Promise.all(vendors.map(v => this.mapVendorToListItem(v)));
  }

  /**
   * Update vendor verification status
   * @description Updates vendor verification status (approve/reject)
   * @param id - Vendor ID
   * @param dto - Verification update details
   * @param req - Request with authenticated user
   * @returns Updated vendor
   */
  @Patch(':id/verification')
  @ApiOperation({
    summary: 'Update verification status',
    description: 'Approves or rejects vendor verification.',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID', type: Number })
  @ApiBody({ type: UpdateVendorVerificationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification status updated successfully',
    type: VendorListItemDto,
  })
  async updateVerificationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorVerificationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<VendorListItemDto> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const previousStatus = vendor.isVerified;

    // VendorEntity only has isVerified boolean
    // Map the status enum to boolean
    if (dto.status === VendorVerificationStatus.APPROVED) {
      vendor.isVerified = true;
    } else if (dto.status === VendorVerificationStatus.REJECTED ||
               dto.status === VendorVerificationStatus.SUSPENDED) {
      vendor.isVerified = false;
    }

    await this.vendorRepository.save(vendor);

    // Log the action
    await this.auditLogService.log({
      action: 'vendor_verification_updated',
      actorId: req.user?.id,
      actorType: 'admin',
      entityType: 'vendor',
      entityId: id,
      description: `Vendor verification updated: ${vendor.storeName || 'Unknown'}`,
      beforeData: { isVerified: previousStatus },
      afterData: {
        isVerified: vendor.isVerified,
        newStatus: dto.status,
        notes: dto.notes,
      },
    });

    // TODO: Send notification to vendor

    return this.mapVendorToListItem(vendor);
  }

  // ===========================================================================
  // COMMISSION MANAGEMENT
  // ===========================================================================

  /**
   * Update vendor commission rate
   * @description Updates the commission rate for a specific vendor
   * @param id - Vendor ID
   * @param dto - Commission rate details
   * @param req - Request with authenticated user
   * @returns Updated vendor
   */
  @Patch(':id/commission')
  @ApiOperation({
    summary: 'Update commission rate',
    description: 'Updates the commission rate for a vendor. Rate is a percentage (0-100).',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID', type: Number })
  @ApiBody({ type: UpdateVendorCommissionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Commission rate updated successfully',
    type: VendorListItemDto,
  })
  async updateCommissionRate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorCommissionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<VendorListItemDto> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const previousRate = await this.getVendorCommissionRate(id);

    // Create or update vendor commission record
    let vendorCommission = await this.vendorCommissionRepository.findOne({
      where: { vendor: { id } },
    });

    if (vendorCommission) {
      vendorCommission.percentage = dto.commissionRate;
      vendorCommission.note = dto.reason || undefined;
    } else {
      vendorCommission = this.vendorCommissionRepository.create({
        vendor: vendor,
        percentage: dto.commissionRate,
        note: dto.reason || undefined,
      });
    }

    await this.vendorCommissionRepository.save(vendorCommission);

    // Log the action
    await this.auditLogService.log({
      action: 'vendor_commission_updated',
      actorId: req.user?.id,
      actorType: 'admin',
      entityType: 'vendor',
      entityId: id,
      description: `Commission rate updated for vendor: ${vendor.storeName || 'Unknown'}`,
      beforeData: { commissionRate: previousRate },
      afterData: {
        commissionRate: dto.commissionRate,
        reason: dto.reason,
      },
    });

    return this.mapVendorToListItem(vendor);
  }

  // ===========================================================================
  // PAYOUT MANAGEMENT
  // ===========================================================================

  /**
   * Get pending payouts
   * @description Retrieves vendors with pending payout balances
   * @returns List of pending payouts
   */
  @Get('payouts/pending')
  @ApiOperation({
    summary: 'Get pending payouts',
    description: 'Retrieves all pending commission payouts awaiting processing.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending payouts retrieved successfully',
    type: [PayoutRequestItemDto],
  })
  async getPendingPayouts(): Promise<PayoutRequestItemDto[]> {
    // Get pending payouts from CommissionPayoutEntity
    const pendingPayouts = await this.commissionPayoutRepository.find({
      where: { status: PayoutStatus.PENDING },
      relations: ['vendor', 'vendor.user'],
      order: { scheduledDate: 'ASC' },
    });

    return pendingPayouts.map(payout => ({
      id: payout.id,
      vendorId: payout.vendor?.id || 0,
      shopName: payout.vendor?.storeName || 'Unknown',
      amount: Number(payout.netAmount) || 0,
      paymentMethod: 'bank_transfer', // Default payment method
      status: payout.status as PayoutStatus,
      requestedAt: payout.createdAt,
      processedAt: payout.processedDate || undefined,
    }));
  }

  /**
   * Process vendor payout
   * @description Processes a payout to a vendor
   * @param id - Vendor ID
   * @param dto - Payout details
   * @param req - Request with authenticated user
   * @returns Payout result
   */
  @Post(':id/payout')
  @ApiOperation({
    summary: 'Process payout',
    description: 'Processes a payout to a vendor.',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID', type: Number })
  @ApiBody({ type: ProcessPayoutDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payout processed successfully',
  })
  async processPayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessPayoutDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string; transactionId: string }> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (!vendor.isVerified) {
      throw new BadRequestException('Vendor is not verified for payouts');
    }

    // Generate transaction ID
    const transactionId = `PO-${Date.now()}-${id}`;

    // Create payout record
    const payout = this.commissionPayoutRepository.create({
      vendor: vendor,
      periodStart: new Date(),
      periodEnd: new Date(),
      grossAmount: dto.amount,
      deductionsAmount: 0,
      taxAmount: 0,
      netAmount: dto.amount,
      currency: 'SYP',
      status: PayoutStatus.PROCESSING,
      payoutMethod: this.mapPaymentMethod(dto.paymentMethod),
      scheduledDate: new Date(),
      referenceNumber: transactionId,
      adminNotes: dto.notes,
    });

    await this.commissionPayoutRepository.save(payout);

    // Log the payout
    await this.auditLogService.log({
      action: 'vendor_payout_processed',
      actorId: req.user?.id,
      actorType: 'admin',
      entityType: 'vendor',
      entityId: id,
      description: `Payout of ${dto.amount} SYP processed for vendor: ${vendor.storeName || 'Unknown'}`,
      beforeData: {},
      afterData: {
        amount: dto.amount,
        transactionId,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      },
    });

    // TODO: Trigger actual payment processing

    return {
      success: true,
      message: `Payout of ${dto.amount} SYP processed successfully`,
      transactionId,
    };
  }

  /**
   * Get vendor metrics
   * @description Retrieves performance metrics for a specific vendor
   * @param id - Vendor ID
   * @returns Vendor performance metrics
   */
  @Get(':id/metrics')
  @ApiOperation({
    summary: 'Get vendor metrics',
    description: 'Retrieves performance metrics including sales, orders, and ratings.',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor metrics retrieved successfully',
  })
  async getVendorMetrics(@Param('id', ParseIntPipe) id: number): Promise<{
    salesMetrics: any;
    commissionMetrics: any;
    productMetrics: any;
  }> {
    const [salesMetrics, commissionMetrics, productMetrics] = await Promise.all([
      this.getVendorSalesMetrics(id),
      this.getVendorCommissionMetrics(id),
      this.getVendorProductMetrics(id),
    ]);

    return {
      salesMetrics,
      commissionMetrics,
      productMetrics,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Map vendor entity to list item DTO
   * @param vendor - VendorEntity to map
   * @returns VendorListItemDto
   */
  private async mapVendorToListItem(vendor: VendorEntity): Promise<VendorListItemDto> {
    // Get product count for this vendor - use vendor relation, not vendorId
    const productCount = await this.productRepository.count({
      where: { vendor: { id: vendor.id } },
    });

    // Get order count for this vendor (orders have vendor through order items)
    const orderCount = await this.getVendorOrderCount(vendor.id);

    // Get commission rate
    const commissionRate = await this.getVendorCommissionRate(vendor.id);

    // Get total revenue and pending payouts
    const { totalRevenue, pendingBalance } = await this.getVendorFinancials(vendor.id);

    return {
      id: vendor.id,
      // VendorEntity uses single storeName field
      shopNameEn: vendor.storeName || 'Unknown Shop',
      shopNameAr: vendor.storeName || 'متجر غير معروف',
      logo: vendor.storeLogoUrl || undefined,
      owner: {
        id: vendor.user?.id || 0,
        fullName: vendor.user?.fullName || 'Unknown',
        email: vendor.user?.email || 'N/A',
        phone: vendor.user?.phone || undefined,
      },
      // Map isVerified boolean to verification status
      verificationStatus: vendor.isVerified
        ? VendorVerificationStatus.APPROVED
        : VendorVerificationStatus.PENDING,
      accountStatus: 'active' as any, // Would need actual status tracking
      commissionRate: commissionRate,
      rating: 0, // Not tracked on VendorEntity
      totalProducts: productCount,
      totalSales: totalRevenue,
      availableBalance: pendingBalance,
      createdAt: vendor.createdAt,
    };
  }

  /**
   * Get vendor's commission rate from VendorCommissionEntity
   * @param vendorId - Vendor ID
   * @returns Commission rate percentage (default 10%)
   */
  private async getVendorCommissionRate(vendorId: number): Promise<number> {
    const commission = await this.vendorCommissionRepository.findOne({
      where: { vendor: { id: vendorId } },
      order: { created_at: 'DESC' },
    });

    return commission ? Number(commission.percentage) : 10; // Default 10%
  }

  /**
   * Get vendor order count from order items
   * @param vendorId - Vendor ID
   * @returns Order count
   */
  private async getVendorOrderCount(vendorId: number): Promise<number> {
    // Count distinct orders that contain products from this vendor
    const result = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('order_items', 'oi', 'oi.product_id = product.id')
      .where('product.vendor_id = :vendorId', { vendorId })
      .select('COUNT(DISTINCT oi.order_id)', 'count')
      .getRawOne();

    return parseInt(result?.count) || 0;
  }

  /**
   * Get vendor financial summary
   * @param vendorId - Vendor ID
   * @returns Total revenue and pending balance
   */
  private async getVendorFinancials(vendorId: number): Promise<{
    totalRevenue: number;
    pendingBalance: number;
  }> {
    // Calculate total revenue from order items
    const revenueResult = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('order_items', 'oi', 'oi.product_id = product.id')
      .innerJoin('orders', 'o', 'o.id = oi.order_id')
      .where('product.vendor_id = :vendorId', { vendorId })
      .andWhere('o.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed', 'refunded'],
      })
      .select('COALESCE(SUM(oi.total_price), 0)', 'total')
      .getRawOne();

    // Calculate pending payouts
    const pendingResult = await this.commissionPayoutRepository
      .createQueryBuilder('payout')
      .innerJoin('payout.vendor', 'vendor')
      .where('vendor.id = :vendorId', { vendorId })
      .andWhere('payout.status = :status', { status: PayoutStatus.PENDING })
      .select('COALESCE(SUM(payout.netAmount), 0)', 'pending')
      .getRawOne();

    return {
      totalRevenue: parseFloat(revenueResult?.total) || 0,
      pendingBalance: parseFloat(pendingResult?.pending) || 0,
    };
  }

  /**
   * Get vendor sales metrics
   * @param vendorId - Vendor ID
   * @returns Sales metrics
   */
  private async getVendorSalesMetrics(vendorId: number): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    conversionRate: number;
  }> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('order_items', 'oi', 'oi.product_id = product.id')
      .innerJoin('orders', 'o', 'o.id = oi.order_id')
      .where('product.vendor_id = :vendorId', { vendorId })
      .andWhere('o.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled', 'failed'],
      })
      .select('COUNT(DISTINCT o.id)', 'totalOrders')
      .addSelect('COALESCE(SUM(oi.total_price), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(o.total_amount), 0)', 'averageOrderValue')
      .getRawOne();

    return {
      totalOrders: parseInt(result?.totalOrders) || 0,
      totalRevenue: parseFloat(result?.totalRevenue) || 0,
      averageOrderValue: parseFloat(result?.averageOrderValue) || 0,
      conversionRate: 0, // Would need view tracking to calculate
    };
  }

  /**
   * Get vendor commission metrics
   * @param vendorId - Vendor ID
   * @returns Commission metrics
   */
  private async getVendorCommissionMetrics(vendorId: number): Promise<{
    totalCommission: number;
    paidCommission: number;
    pendingCommission: number;
  }> {
    const result = await this.commissionPayoutRepository
      .createQueryBuilder('payout')
      .innerJoin('payout.vendor', 'vendor')
      .where('vendor.id = :vendorId', { vendorId })
      .select('COALESCE(SUM(payout.netAmount), 0)', 'totalCommission')
      .addSelect(
        `COALESCE(SUM(CASE WHEN payout.status = '${PayoutStatus.COMPLETED}' THEN payout.netAmount ELSE 0 END), 0)`,
        'paidCommission',
      )
      .getRawOne();

    const totalCommission = parseFloat(result?.totalCommission) || 0;
    const paidCommission = parseFloat(result?.paidCommission) || 0;

    return {
      totalCommission,
      paidCommission,
      pendingCommission: totalCommission - paidCommission,
    };
  }

  /**
   * Get vendor product metrics
   * @param vendorId - Vendor ID
   * @returns Product metrics
   */
  private async getVendorProductMetrics(vendorId: number): Promise<{
    totalProducts: number;
    activeProducts: number;
    pendingApproval: number;
  }> {
    // Use vendor relation, not vendorId (ProductEntity has vendor relation)
    const [total, active, pending] = await Promise.all([
      this.productRepository.count({ where: { vendor: { id: vendorId } } }),
      this.productRepository.count({ where: { vendor: { id: vendorId }, status: 'published', approvalStatus: 'approved' } }),
      this.productRepository.count({ where: { vendor: { id: vendorId }, approvalStatus: 'pending' } }),
    ]);

    return {
      totalProducts: total,
      activeProducts: active,
      pendingApproval: pending,
    };
  }

  /**
   * Get vendor audit logs
   * @param vendorId - Vendor ID
   * @returns Recent audit logs
   */
  private async getVendorAuditLogs(vendorId: number): Promise<Array<{
    action: string;
    createdAt: Date;
    description?: string;
  }>> {
    try {
      // AuditLogService may have a getLogsForEntity method or similar
      // For now, return empty array as we don't have direct access
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Map payment method string to PayoutMethod enum
   * @param method - Payment method string
   * @returns PayoutMethod enum value
   */
  private mapPaymentMethod(method?: string): PayoutMethod {
    const methodMap: Record<string, PayoutMethod> = {
      'bank_transfer': PayoutMethod.BANK_TRANSFER,
      'paypal': PayoutMethod.PAYPAL,
      'stripe': PayoutMethod.STRIPE,
      'cryptocurrency': PayoutMethod.CRYPTOCURRENCY,
      'check': PayoutMethod.CHECK,
      'cash': PayoutMethod.CASH,
    };

    return methodMap[method?.toLowerCase() || ''] || PayoutMethod.BANK_TRANSFER;
  }
}

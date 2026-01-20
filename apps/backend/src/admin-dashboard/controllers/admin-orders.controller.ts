/**
 * @file admin-orders.controller.ts
 * @description Admin controller for order management operations including
 *              listing, status updates, timeline tracking, and refund processing.
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
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guards';
import { Roles } from '../../common/decorators/roles.decorator';

// Entities
import { Order } from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { RefundStatus } from '../../refund/enums/refund-status.enum';

// Services
import { AuditLogService } from '../../audit-log/service/audit-log.service';

// DTOs
import {
  OrderListQueryDto,
  OrderListItemDto,
  OrderDetailsDto,
  OrderTimelineEventDto,
  UpdateOrderStatusDto,
  RefundRequestItemDto,
  ProcessRefundDto,
  PaginatedOrderListDto,
  OrderStatus,
  PaymentStatus,
  OrderCustomerDto,
  OrderShippingAddressDto,
  OrderItemSummaryDto,
} from '../dto';

/**
 * Admin Orders Controller
 * @description Provides API endpoints for order management in the admin dashboard.
 *              Supports listing, filtering, status updates, timeline, and refund processing.
 */
@ApiTags('Admin Dashboard - Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner', 'admin')
@Controller('admin-dashboard/orders')
export class AdminOrdersController {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(RefundTransaction)
    private readonly refundRepository: Repository<RefundTransaction>,

    private readonly auditLogService: AuditLogService,
  ) {}

  // ===========================================================================
  // ORDER LISTING
  // ===========================================================================

  /**
   * Get paginated order list
   * @description Retrieves orders with filtering, sorting, and pagination
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of orders
   */
  @Get()
  @ApiOperation({
    summary: 'Get order list',
    description: 'Retrieves paginated list of orders with support for ' +
                 'search, status filtering, date range, and sorting options.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order list retrieved successfully',
    type: PaginatedOrderListDto,
  })
  async getOrders(@Query() query: OrderListQueryDto): Promise<PaginatedOrderListDto> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      vendorId,
      customerId,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build query - Order uses 'items' relation
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items');

    // Apply filters - User has fullName, not firstName/lastName
    if (search) {
      queryBuilder.andWhere(
        '(CAST(order.id AS CHAR) LIKE :search OR user.fullName LIKE :search OR ' +
        'user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    // Order doesn't have vendorId - filter via items
    if (vendorId) {
      queryBuilder.andWhere('items.vendorId = :vendorId', { vendorId });
    }

    if (customerId) {
      queryBuilder.andWhere('order.user = :customerId', { customerId });
    }

    // Order uses snake_case: created_at
    if (dateFrom) {
      queryBuilder.andWhere('order.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('order.created_at <= :dateTo', { dateTo });
    }

    // Order uses snake_case: total_amount
    if (minAmount !== undefined) {
      queryBuilder.andWhere('order.total_amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('order.total_amount <= :maxAmount', { maxAmount });
    }

    // Apply sorting - map camelCase params to snake_case fields
    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      totalAmount: 'total_amount',
      status: 'status',
      id: 'id',
    };
    const actualSortField = `order.${sortFieldMap[sortBy] || 'created_at'}`;
    queryBuilder.orderBy(actualSortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const orders = await queryBuilder.getMany();

    // Check for refund requests for these orders
    const orderIds = orders.map(o => o.id);
    const refundMap = new Map<number, boolean>();
    if (orderIds.length > 0) {
      const refunds = await this.refundRepository
        .createQueryBuilder('refund')
        .select('refund.order')
        .where('refund.order IN (:...orderIds)', { orderIds })
        .getMany();
      refunds.forEach(r => refundMap.set((r as any).orderId || 0, true));
    }

    // Map to DTOs
    const items: OrderListItemDto[] = orders.map(order => this.mapOrderToListItem(order, refundMap));

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
   * Get order details
   * @description Retrieves detailed information about a specific order
   * @param id - Order ID
   * @returns Order details with items and timeline
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Retrieves comprehensive details about a specific order ' +
                 'including items, shipping, payment, and timeline events.',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order details retrieved successfully',
    type: OrderDetailsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  async getOrderDetails(@Param('id', ParseIntPipe) id: number): Promise<OrderDetailsDto> {
    // Order uses 'items' relation; items have 'variant' relation
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.variant', 'items.variant.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Get timeline events from status logs
    const timeline = await this.getOrderTimeline(id);

    // Get refund info if applicable
    const refund = await this.refundRepository.findOne({
      where: { order: { id } },
    });

    // Build customer object
    const customer: OrderCustomerDto = {
      id: order.user?.id || 0,
      fullName: order.user?.fullName || 'Guest',
      email: order.user?.email || 'N/A',
      phone: order.user?.phone,
      totalOrders: 0, // Would need separate query
    };

    // Build shipping address from flat fields
    const shippingAddress: OrderShippingAddressDto = {
      addressLine1: order.shippingAddressLine1,
      addressLine2: order.shippingAddressLine2,
      city: order.shippingCity,
      state: order.shippingRegion,
      country: order.shippingCountry,
      postalCode: order.shippingPostalCode,
    };

    // Build order items - Note: ProductImage has imageUrl, use sortOrder === 0 for primary
    const items: OrderItemSummaryDto[] = order.items?.map(item => {
      // Get thumbnail: first try variant imageUrl, then find primary product image
      const productImages = item.variant?.product?.images || [];
      const primaryImage = productImages.find(img => img.sortOrder === 0) || productImages[0];
      const thumbnail = item.variant?.imageUrl || primaryImage?.imageUrl;

      return {
        id: item.id,
        productId: item.variant?.product?.id || 0,
        productName: item.variant?.product?.nameEn || 'Unknown Product',
        thumbnail,
        vendorName: item.variant?.product?.vendor?.storeName || 'Unknown Vendor',
        quantity: item.quantity,
        unitPrice: Number(item.price),
        totalPrice: Number(item.price) * item.quantity,
        variant: item.variant?.variantData ? JSON.stringify(item.variant.variantData) : undefined,
      };
    }) || [];

    return {
      id: order.id,
      orderNumber: `ORD-${order.id}`,
      customer,
      totalAmount: Number(order.total_amount) || 0,
      itemsCount: order.items?.length || 0,
      status: order.status as OrderStatus,
      paymentStatus: (order.payment_status || 'pending') as PaymentStatus,
      paymentMethod: order.payment_method,
      hasRefundRequest: !!refund,
      createdAt: order.created_at,
      items,
      shippingAddress,
      subtotal: Number(order.total_amount) || 0, // No separate subtotal field
      shippingCost: 0, // No shipping cost field on Order
      taxAmount: 0, // No tax field on Order
      discountAmount: 0,
      timeline,
      notes: order.buyer_note,
      updatedAt: order.updated_at,
    };
  }

  /**
   * Get order timeline
   * @description Retrieves timeline of events for an order
   * @param id - Order ID
   * @returns Array of timeline events
   */
  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Get order timeline',
    description: 'Retrieves chronological timeline of all events related to an order.',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order timeline retrieved successfully',
    type: [OrderTimelineEventDto],
  })
  async getOrderTimeline(@Param('id', ParseIntPipe) id: number): Promise<OrderTimelineEventDto[]> {
    // For now, return basic timeline based on order creation
    // TODO: Integrate with OrderStatusLog entity when available
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      return [];
    }

    const timeline: OrderTimelineEventDto[] = [
      {
        id: 1,
        status: OrderStatus.PENDING,
        title: 'Order Created',
        description: 'Order was placed',
        timestamp: order.created_at,
      },
    ];

    // Add current status if different from pending
    if (order.status !== 'pending') {
      timeline.push({
        id: 2,
        status: order.status as OrderStatus,
        title: this.formatStatusTitle(order.status),
        description: `Order status changed to ${order.status}`,
        timestamp: order.updated_at,
      });
    }

    return timeline;
  }

  // ===========================================================================
  // ORDER STATUS MANAGEMENT
  // ===========================================================================

  /**
   * Update order status
   * @description Updates the status of an order
   * @param id - Order ID
   * @param dto - Status update details
   * @returns Updated order
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
    description: 'Updates order status. Valid transitions depend on current status.',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status updated successfully',
    type: OrderListItemDto,
  })
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderListItemDto> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, dto.status);

    const previousStatus = order.status;

    // Update order status
    order.status = dto.status;

    await this.orderRepository.save(order);

    // Log the status change via audit log
    await this.auditLogService.log({
      action: 'order.status_update',
      actorId: 1, // TODO: Get from request context
      actorType: 'admin',
      entityType: 'order',
      entityId: id,
      operationType: 'update',
      beforeData: { status: previousStatus },
      afterData: { status: dto.status },
      description: `Order status changed from ${previousStatus} to ${dto.status}`,
    });

    return this.mapOrderToListItem(order, new Map());
  }

  // ===========================================================================
  // REFUND MANAGEMENT
  // ===========================================================================

  /**
   * Get pending refund requests
   * @description Retrieves all refund requests awaiting processing
   * @returns List of pending refund requests
   */
  @Get('refunds/pending')
  @ApiOperation({
    summary: 'Get pending refunds',
    description: 'Retrieves all refund requests with pending status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending refunds retrieved successfully',
    type: [RefundRequestItemDto],
  })
  async getPendingRefunds(): Promise<RefundRequestItemDto[]> {
    const refunds = await this.refundRepository.find({
      where: { status: RefundStatus.PENDING },
      relations: ['order', 'order.user'],
      order: { created_at: 'ASC' },
    });

    const now = new Date();

    return refunds.map(refund => {
      const daysPending = Math.floor(
        (now.getTime() - refund.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: refund.id,
        orderId: refund.order?.id || 0,
        orderNumber: `ORD-${refund.order?.id || 0}`,
        customerName: refund.order?.user?.fullName || 'Unknown',
        customerEmail: refund.order?.user?.email || 'N/A',
        requestedAmount: Number(refund.amount),
        orderTotal: Number(refund.order?.total_amount) || 0,
        reason: refund.notes || refund.reason_code || 'No reason provided',
        status: refund.status as any, // Map RefundStatus enum to DTO enum
        requestedAt: refund.created_at,
        daysPending,
        affectedItemsCount: refund.order?.items?.length || 0,
      };
    });
  }

  /**
   * Process refund request
   * @description Approves or rejects a refund request
   * @param id - Order ID
   * @param dto - Refund processing details
   * @returns Refund result
   */
  @Post(':id/refund')
  @ApiOperation({
    summary: 'Process refund',
    description: 'Processes a refund request. Can approve full/partial refund or reject.',
  })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiBody({ type: ProcessRefundDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refund processed successfully',
  })
  async processRefund(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessRefundDto,
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'paymentTransactions'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Find existing refund request
    let refund = await this.refundRepository.findOne({
      where: { order: { id } },
    });

    const paymentTransaction = order.paymentTransactions?.[0];

    if (!refund && !paymentTransaction) {
      throw new BadRequestException('No payment transaction found for this order');
    }

    if (!refund) {
      // Create new refund record
      refund = this.refundRepository.create({
        order: order,
        paymentTransaction: paymentTransaction,
        amount: dto.amount || Number(order.total_amount),
        method: 'manual',
        notes: dto.reason,
        status: RefundStatus.PENDING,
      });
    }

    if (dto.decision === 'approve') {
      const refundAmount = dto.amount || Number(refund.amount);

      if (refundAmount > Number(order.total_amount)) {
        throw new BadRequestException('Refund amount cannot exceed order total');
      }

      // Update refund record
      refund.status = RefundStatus.APPROVED;
      refund.amount = refundAmount;
      refund.refunded_at = new Date();
      refund.notes = dto.reason || refund.notes;

      await this.refundRepository.save(refund);

      // Update order status
      if (refundAmount === Number(order.total_amount)) {
        order.status = OrderStatus.REFUNDED;
      } else {
        order.status = OrderStatus.PARTIALLY_REFUNDED;
      }

      await this.orderRepository.save(order);

      // Log the refund
      await this.auditLogService.log({
        action: 'order.refund_approve',
        actorId: 1, // TODO: Get from request context
        actorType: 'admin',
        entityType: 'order',
        entityId: id,
        operationType: 'approve',
        monetaryAmount: refundAmount,
        currency: 'SYP',
        description: `Refund of ${refundAmount} SYP approved for order ${id}`,
      });

      return {
        success: true,
        message: `Refund of ${refundAmount} SYP approved`,
        transactionId: `RF-${refund.id}`,
      };
    } else {
      // Reject refund
      refund.status = RefundStatus.REJECTED;
      refund.refunded_at = new Date();
      refund.notes = dto.reason || refund.notes;

      await this.refundRepository.save(refund);

      // Log the rejection
      await this.auditLogService.log({
        action: 'order.refund_reject',
        actorId: 1,
        actorType: 'admin',
        entityType: 'order',
        entityId: id,
        operationType: 'reject',
        description: `Refund request rejected for order ${id}: ${dto.reason}`,
      });

      return {
        success: true,
        message: 'Refund request rejected',
      };
    }
  }

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  /**
   * Get order statistics by status
   * @description Retrieves count of orders grouped by status
   * @returns Order counts by status
   */
  @Get('stats/by-status')
  @ApiOperation({
    summary: 'Get order statistics by status',
    description: 'Retrieves count of orders grouped by their current status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order statistics retrieved successfully',
  })
  async getOrderStatsByStatus(): Promise<Record<string, number>> {
    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    const result: Record<string, number> = {};
    for (const stat of stats) {
      result[stat.status] = parseInt(stat.count);
    }

    return result;
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Map order entity to list item DTO
   * @description Maps Order entity (with snake_case fields) to OrderListItemDto
   */
  private mapOrderToListItem(order: Order, refundMap: Map<number, boolean>): OrderListItemDto {
    const customer: OrderCustomerDto = {
      id: order.user?.id || 0,
      fullName: order.user?.fullName || 'Guest',
      email: order.user?.email || 'N/A',
      phone: order.user?.phone,
      totalOrders: 0,
    };

    return {
      id: order.id,
      orderNumber: `ORD-${order.id}`,
      customer,
      totalAmount: Number(order.total_amount) || 0,
      itemsCount: order.items?.length || 0,
      status: order.status as OrderStatus,
      paymentStatus: (order.payment_status || 'pending') as PaymentStatus,
      paymentMethod: order.payment_method,
      hasRefundRequest: refundMap.get(order.id) || false,
      createdAt: order.created_at,
    };
  }

  /**
   * Validate order status transition
   */
  private validateStatusTransition(currentStatus: string, newStatus: OrderStatus): void {
    const validTransitions: Record<string, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.FAILED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PROCESSING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PROCESSING]: [
        OrderStatus.SHIPPED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.SHIPPED]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED,
      ],
      [OrderStatus.DELIVERED]: [
        OrderStatus.REFUNDED,
        OrderStatus.PARTIALLY_REFUNDED,
      ],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [
        OrderStatus.PENDING,
      ],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.PARTIALLY_REFUNDED]: [
        OrderStatus.REFUNDED,
      ],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }
  }

  /**
   * Format status to human-readable title
   */
  private formatStatusTitle(status: string): string {
    const titles: Record<string, string> = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      processing: 'Processing',
      shipped: 'Shipped',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      partially_refunded: 'Partially Refunded',
      failed: 'Payment Failed',
    };
    return titles[status] || status;
  }
}

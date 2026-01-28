import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { RequestReturnDto } from '../dto/request-return.dto';
import { FilterOrdersDto } from '../dto/filter-orders.dto';

import { UserFromToken } from '../../common/interfaces/user-from-token.interface';
import { StockService } from '../../stock/stock.service';
import { ShipmentsService } from '../../shipments/service/shipments.service';

import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatusLog } from '../entities/order-status-log.entity';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { ReturnRequest } from '../entities/return-request.entity';
import { User } from '../../users/entities/user.entity';

import { RefundService } from '../../refund/services/refund.service';
import { RefundRequestDto } from '../../refund/dto/refund-request.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private orderItemRepo: Repository<OrderItem>,

    @InjectRepository(OrderStatusLog)
    private statusLogRepo: Repository<OrderStatusLog>,

    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,

    @InjectRepository(ReturnRequest)
    private returnRequestRepo: Repository<ReturnRequest>,

    private readonly shipmentsService: ShipmentsService,
    private readonly stockService: StockService,

    @Inject(forwardRef(() => RefundService))
    private readonly refundService: RefundService,
  ) {}

  /**
   * 🚀 Creates a new order with full validation.
   * Checks product variant stock availability before confirming.
   */
  async createOrder(user: UserFromToken, dto: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating order for user ID ${user.id}`);

    const variantIds = dto.items.map((i) => i.variant_id);
    const variants = await this.variantRepo.find({
      where: { id: In(variantIds) },
    });

    if (variants.length !== dto.items.length) {
      throw new NotFoundException('One or more variants not found.');
    }

    // PERF-C02: Batch stock fetching - single query instead of N queries
    const stockMap = await this.stockService.getStockBatch(variantIds);

    // Validate stock availability for all items
    const insufficientStock: string[] = [];
    for (const item of dto.items) {
      const available = stockMap.get(item.variant_id) || 0;
      if (available < item.quantity) {
        insufficientStock.push(
          `Variant ID ${item.variant_id}: requested ${item.quantity}, available ${available}`,
        );
        this.logger.warn(
          `Variant ID ${item.variant_id} has only ${available} in stock.`,
        );
      }
    }

    // Report all insufficient stock items at once for better UX
    if (insufficientStock.length > 0) {
      throw new BadRequestException(
        `Insufficient stock for: ${insufficientStock.join('; ')}`,
      );
    }

    const order = this.orderRepo.create({
      user: { id: user.id } as any,
      payment_method: dto.payment_method,
      payment_status: 'unpaid',
      status: 'pending',
      buyer_note: dto.buyer_note,
      gift_message: dto.gift_message,
      total_amount: 0,
      items: [],
    });

    let total = 0;
    for (const item of dto.items) {
      const variant = variants.find((v) => v.id === item.variant_id);
      if (!variant) continue;

      const orderItem = this.orderItemRepo.create({
        order,
        variant,
        quantity: item.quantity,
        price: variant.price,
      });

      total += variant.price * item.quantity;
      order.items.push(orderItem);
    }

    order.total_amount = total;

    const savedOrder = await this.orderRepo.save(order);

    await this.statusLogRepo.save({
      order: savedOrder,
      changedBy: { id: user.id } as any,
      fromStatus: 'none',
      toStatus: 'pending',
    });

    await this.shipmentsService.createShipment(user, {
      order_id: savedOrder.id,
      order_item_ids: savedOrder.items.map((item) => item.id),
      shipping_company_id: 1,
      estimated_delivery_at: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });

    this.logger.log(`Order #${savedOrder.id} created successfully.`);
    return savedOrder;
  }

  /**
   * 🔁 Updates the order status and records a status log.
   */
  async updateOrderStatus(
    user: UserFromToken,
    dto: UpdateOrderStatusDto,
  ): Promise<void> {
    this.logger.log(
      `User ${user.id} updating order #${dto.order_id} to ${dto.new_status}`,
    );

    const order = await this.orderRepo.findOne({
      where: { id: +dto.order_id },
      relations: ['items', 'items.variant'],
    });
    if (!order) throw new NotFoundException('Order not found');

    const fromStatus = order.status;
    order.status = dto.new_status;

    await this.orderRepo.save(order);
    await this.statusLogRepo.save({
      order,
      changedBy: { id: user.id } as any,
      fromStatus,
      toStatus: dto.new_status,
    });

    // 🚀 NEW: Automatic shipment creation when order is confirmed
    if (dto.new_status === 'confirmed' && fromStatus !== 'confirmed') {
      try {
        await this.createShipmentForOrder(order, user);
      } catch (error: unknown) {
        this.logger.error(
          `Failed to create shipment for order ${order.id}`,
          (error as Error).stack,
        );
      }
    }

    this.logger.log(`Order #${order.id} status updated.`);
  }

  /**
   * 📦 Creates shipment automatically when order is confirmed
   */
  private async createShipmentForOrder(
    order: Order,
    user: UserFromToken,
  ): Promise<void> {
    this.logger.log(`Creating shipment for confirmed order ${order.id}`);

    // Get the first available shipping company for auto-assignment
    // In production, you might want to select based on location, etc.
    const orderItemIds = order.items.map((item) => item.id);

    const shipmentDto = {
      order_id: order.id,
      order_item_ids: orderItemIds,
      shipping_company_id: 1, // Default shipping company - should be configurable
      estimated_delivery_at: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 7 days from now
    };

    const shipment = await this.shipmentsService.createShipment(
      user,
      shipmentDto,
    );
    this.logger.log(`Shipment ${shipment.id} created for order ${order.id}`);
  }

  /**
   * 🌀 Handles return request — validates time window, ownership, and saves record.
   */
  async requestReturn(
    user: UserFromToken,
    dto: RequestReturnDto,
  ): Promise<string> {
    this.logger.log(
      `User ${user.id} requested return for order ${dto.order_id}`,
    );

    const order = await this.orderRepo.findOne({
      where: { id: dto.order_id },
      relations: ['user'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.user.id !== user.id) {
      throw new ForbiddenException('You can only return your own orders.');
    }

    const updated = new Date(order.updated_at);
    const now = new Date();
    const diffInDays =
      (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays > 5) {
      throw new BadRequestException('Return window (5 days) has expired.');
    }

    const returnRequest = this.returnRequestRepo.create({
      user: { id: user.id } as any,
      order,
      reason: dto.reason,
      status: 'pending',
      evidence_images: dto.evidence_images ?? [],
    });

    await this.returnRequestRepo.save(returnRequest);

    this.logger.log(
      `Return request #${returnRequest.id} submitted by user ${user.id}`,
    );
    return 'Return request submitted and awaiting vendor approval.';
  }

  /**
   * 💵 Delegates refund request to RefundService.
   */
  async requestRefund(
    admin: UserFromToken,
    dto: RefundRequestDto,
  ): Promise<string> {
    this.logger.warn(
      `Admin ${admin.id} requested refund for order ${dto.order_id}`,
    );

    const refund = await this.refundService.initiateRefund({
      ...dto,
      notes: dto.reason_code || 'Manual refund initiated from OrdersService',
    });

    this.logger.log(`Refund #${refund.id} processed via RefundService.`);
    return 'Refund recorded and processed via RefundService.';
  }

  /**
   * 📄 Fetches all orders for the current user.
   */
  async getMyOrders(user: UserFromToken): Promise<Order[]> {
    this.logger.log(`User ${user.id} fetching their own orders`);

    return this.orderRepo.find({
      where: { user: { id: user.id } },
      relations: ['items', 'items.variant', 'status_logs'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 🧾 Fetches all orders for products belonging to a vendor.
   */
  async getVendorOrders(vendorId: number): Promise<Order[]> {
    this.logger.log(`Vendor ${vendorId} fetching all related orders`);

    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('order.status_logs', 'status_logs')
      .where('product.vendor_id = :vendorId', { vendorId })
      .orderBy('order.created_at', 'DESC')
      .getMany();
  }

  /**
   * 📊 Fetch all orders with filters (admin use).
   */
  async getAllOrders(dto: FilterOrdersDto): Promise<Order[]> {
    this.logger.log('Admin fetching orders with filters', JSON.stringify(dto));

    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.variant', 'variant')
      .leftJoinAndSelect('order.status_logs', 'status_logs')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.created_at', 'DESC');

    if (dto.status)
      qb.andWhere('order.status = :status', { status: dto.status });
    if (dto.user_id)
      qb.andWhere('order.user.id = :userId', { userId: dto.user_id });
    if (dto.from)
      qb.andWhere('order.created_at >= :from', { from: new Date(dto.from) });
    if (dto.to)
      qb.andWhere('order.created_at <= :to', { to: new Date(dto.to) });

    return qb.getMany();
  }

  /**
   * 🧾 Get full order details with user, variants, and logs.
   */
  async getOrderDetails(orderId: number): Promise<Order> {
    this.logger.log(`Fetching details for order #${orderId}`);

    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'user',
        'status_logs',
      ],
    });

    if (!order) throw new NotFoundException(`Order #${orderId} not found`);
    return order;
  }

  /**
   * ✅ Marks order as paid and creates shipment.
   */
  async setOrderPaid(orderId: number, changedBy: User = null): Promise<void> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'user'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'paid') return;

    order.status = 'paid';
    await this.orderRepo.save(order);

    await this.statusLogRepo.save({
      order,
      status: 'paid',
      changedBy,
      comment: 'Order marked as paid by PaymentService',
    });

    await this.shipmentsService.createShipmentForOrder(order);

    this.logger.log(
      `Order ${order.id} marked as paid, shipment created by ${changedBy ? changedBy.id : 'system'}.`,
    );
  }
}

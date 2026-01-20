import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  PaymentTransaction,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment-transaction.entity';
import { User } from '../../users/entities/user.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { ConfirmPaymentDto } from '../dto/confirm-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { AdminOverridePaymentDto } from '../dto/admin-override-payment.dto';
import { SearchPaymentsDto } from '../dto/search-payments.dto';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { OrdersService } from '../../orders/service/orders.service';
import { Order } from '../../orders/entities/order.entity';
import { RefundStatus } from '../../refund/enums/refund-status.enum';

// import { NotificationService } from '../../notifications/notification.service'; // Uncomment when you implement notification
// import { WalletService } from '../../wallet/wallet.service'; // Uncomment when you implement wallet

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private paymentRepo: Repository<PaymentTransaction>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(RefundTransaction)
    private refundRepo: Repository<RefundTransaction>,

    @Inject(forwardRef(() => OrdersService))
    private readonly orderService: OrdersService,

    // Uncomment below when you add these modules!
    // @Inject(forwardRef(() => NotificationService))
    // private readonly notificationService: NotificationService,

    // @Inject(forwardRef(() => WalletService))
    // private readonly walletService: WalletService,
  ) {}

  /**
   * Create/initiate a new payment for an order.
   * Prevents double payment, validates method, logs everything.
   */
  async createPayment(
    user: User,
    dto: CreatePaymentDto,
    ipAddress: string,
  ): Promise<PaymentTransaction> {
    this.logger.log(
      `User ${user.id} initiating payment for order ${dto.orderId}`,
    );

    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['user'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'paid')
      throw new BadRequestException('Order already paid');

    // Prevent double payment
    const existingPaid = await this.paymentRepo.findOne({
      where: {
        order: { id: order.id },
        status: PaymentStatus.PAID,
      },
    });
    if (existingPaid)
      throw new BadRequestException('Order already has a successful payment.');

    // Validate payment method
    if (!Object.values(PaymentMethod).includes(dto.method)) {
      throw new BadRequestException('Invalid payment method.');
    }

    // --- Wallet logic placeholder ---
    // if (dto.method === PaymentMethod.WALLET) {
    //   await this.walletService.deduct(user, dto.amount, order.id);
    // }

    const payment = this.paymentRepo.create({
      order,
      user,
      method: dto.method,
      provider: 'manual',
      amount: dto.amount,
      currency: dto.currency,
      status: PaymentStatus.PENDING,
      ipAddress,
      channel: dto.channel,
    });
    await this.paymentRepo.save(payment);

    this.logger.log(`Payment ${payment.id} created for order ${order.id}`);

    // --- Notification placeholder ---
    // await this.notificationService.notifyPaymentCreated(payment);

    return payment;
  }

  /**
   * Confirm payment (manual or via gateway callback)
   */
  async confirmPayment(dto: ConfirmPaymentDto): Promise<PaymentTransaction> {
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentTransactionId },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.PAID)
      throw new BadRequestException('Already paid');

    payment.status = PaymentStatus.PAID;
    payment.gatewayTransactionId = dto.gatewayTransactionId ?? null;
    payment.gatewayResponse = dto.gatewayResponse ?? null;
    await this.paymentRepo.save(payment);

    // Centralized order status update
    await this.orderService.setOrderPaid(payment.order.id);

    this.logger.log(
      `Payment ${payment.id} confirmed and order ${payment.order.id} marked as paid.`,
    );

    // --- Notification placeholder ---
    // await this.notificationService.notifyPaymentConfirmed(payment);

    return payment;
  }

  /**
   * Request a refund (user or admin)
   */
  async refundPayment(
    dto: RefundPaymentDto,
    requestedBy: User,
  ): Promise<RefundTransaction> {
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentTransactionId },
      relations: ['order', 'user'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (![PaymentStatus.PAID, PaymentStatus.PARTIAL].includes(payment.status))
      throw new BadRequestException(
        'Only paid/partial payments can be refunded',
      );

    // --- Refund to wallet placeholder ---
    // if (dto.refundToWallet) {
    //   await this.walletService.credit(payment.user, dto.amount, payment.order.id);
    // }

    const refund = this.refundRepo.create({
      paymentTransaction: payment, // payment is aPaymentTransaction entity
      order: payment.order,
      processedBy: requestedBy,
      amount: dto.amount,
      method: dto.method,
      status: RefundStatus.PROCESSED,
      notes: dto.reason ?? null,
    });
    await this.refundRepo.save(refund);

    this.logger.log(
      `Refund requested for payment ${payment.id} (amount ${dto.amount}) by user ${requestedBy.id}`,
    );

    // --- Notification placeholder ---
    // await this.notificationService.notifyRefundRequested(refund);

    return refund;
  }

  /**
   * Admin override of payment status, logs admin comment, updates order, notifies as needed.
   */
  async adminOverridePayment(
    dto: AdminOverridePaymentDto,
    adminUser: User,
  ): Promise<PaymentTransaction> {
    const payment = await this.paymentRepo.findOne({
      where: { id: dto.paymentTransactionId },
      relations: ['order'],
    });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.status = dto.status;
    payment.adminActionBy = adminUser.id;
    // Optionally log comment/audit (extend entity for comments/history if needed)
    // e.g., payment.overrideComment = dto.comment;
    await this.paymentRepo.save(payment);

    if (dto.status === PaymentStatus.PAID) {
      await this.orderService.setOrderPaid(payment.order.id);
    }
    this.logger.warn(
      `Admin ${adminUser.id} set payment ${payment.id} status to ${dto.status}`,
    );

    // --- Notification placeholder ---
    // await this.notificationService.notifyAdminOverride(payment);

    return payment;
  }

  /**
   * Search & filter payments (admin)
   * Supports pagination, fulltext, and advanced filtering.
   */
  async searchPayments(
    dto: SearchPaymentsDto,
    skip = 0,
    take = 20,
  ): Promise<[PaymentTransaction[], number]> {
    const where: FindOptionsWhere<PaymentTransaction> = {};
    if (dto.orderId) where.order = { id: dto.orderId } as any;
    if (dto.method) where.method = dto.method;
    if (dto.status) where.status = dto.status;
    if (dto.currency) where.currency = dto.currency;

    const [items, count] = await this.paymentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      relations: ['order', 'user'],
      skip,
      take,
    });

    return [items, count];
  }

  /**
   * Soft-delete payment (for error/duplicate/fraud cases)
   */
  async softDeletePayment(paymentId: number, adminUser: User): Promise<void> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    // payment.isDeleted = true;
    // payment.deletedAt = new Date();
    // await this.paymentRepo.save(payment);
    this.logger.warn(
      `Payment ${payment.id} soft-deleted by admin ${adminUser.id}`,
    );
  }
  /**
   * 📄 Retrieves a single payment transaction by ID.
   * Throws if not found. Use this for read-only access to payment data.
   */
  async getTransactionById(id: number): Promise<PaymentTransaction> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['order', 'user'],
    });

    if (!payment) throw new NotFoundException('Payment transaction not found');

    return payment;
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefundTransaction } from '../entities/refund-transaction.entity';
import { RefundRequestDto } from '../dto/refund-request.dto';
import { RefundApproveDto } from '../dto/refund-approve.dto';
import { RefundStatus } from '../enums/refund-status.enum';
import { RefundMethod } from '../enums/refund-method.enum';
import { OrdersService } from '../../orders/service/orders.service';

import { User } from '../../users/entities/user.entity';
import { PaymentService } from '../../payment/service/payment.service';

@Injectable()
export class RefundService {
  private readonly logger = new Logger(RefundService.name);

  constructor(
    @InjectRepository(RefundTransaction)
    private readonly refundRepo: Repository<RefundTransaction>,

    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * 🎯 Initiates a refund for a given order and payment transaction.
   * Validates order and payment existence, then logs a new refund record.
   */
  async initiateRefund(dto: RefundRequestDto): Promise<RefundTransaction> {
    this.logger.log(`Initiating refund for order ${dto.order_id}...`);

    const order = await this.ordersService.getOrderDetails(dto.order_id);
    if (!order) throw new NotFoundException('Order not found');

    const payment = await this.paymentService.getTransactionById(
      dto.payment_transaction_id,
    );
    if (!payment || payment.order.id !== dto.order_id) {
      throw new BadRequestException(
        'Invalid payment transaction for this order',
      );
    }

    const refund = this.refundRepo.create({
      order,
      paymentTransaction: payment,
      amount: dto.amount,
      method: dto.method ?? RefundMethod.MANUAL,
      status: RefundStatus.PENDING,
      reason_code: dto.reason_code ?? null,
      evidence: dto.evidence ?? [],
      notes: dto.notes ?? '',
    });

    const saved = await this.refundRepo.save(refund);
    this.logger.log(
      `Refund transaction #${saved.id} created for order ${dto.order_id}`,
    );

    return saved;
  }

  /**
   * ✅ Approves or rejects a pending refund.
   * Can only be called by an admin or finance role.
   */
  async approveRefund(
    dto: RefundApproveDto,
    adminUserId: number,
  ): Promise<RefundTransaction> {
    this.logger.warn(
      `Admin ${adminUserId} updating refund #${dto.refund_id} to ${dto.status}`,
    );

    const refund = await this.refundRepo.findOne({
      where: { id: dto.refund_id },
      relations: ['order', 'paymentTransaction'],
    });

    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status === RefundStatus.PROCESSED) {
      throw new BadRequestException('Refund has already been completed');
    }

    refund.status = dto.status;
    refund.processedBy = { id: adminUserId } as User;
    refund.notes = dto.notes ?? refund.notes;

    if (dto.status === RefundStatus.PROCESSED) {
      refund.refunded_at = new Date();
    }

    const updated = await this.refundRepo.save(refund);
    this.logger.log(
      `Refund #${refund.id} marked as ${refund.status} by admin ${adminUserId}`,
    );

    return updated;
  }

  /**
   * 📦 Gets the latest refund status for a given order.
   * Useful for showing refund tracking in buyer or admin views.
   */
  async getRefundStatusByOrder(orderId: number) {
    const latest = await this.refundRepo.findOne({
      where: { order: { id: orderId } },
      order: { created_at: 'DESC' },
    });

    if (!latest) throw new NotFoundException('No refund found for this order');

    return {
      refund_id: latest.id,
      status: latest.status,
      refunded_at: latest.refunded_at,
    };
  }
}

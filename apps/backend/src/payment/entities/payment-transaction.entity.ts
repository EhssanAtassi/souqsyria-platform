/**
 * @file payment-transaction.entity.ts
 * @description
 * Records each payment attempt for an order (card, cash, wallet, etc.).
 * Used for both user and admin payment flows (mock/manual or gateway).
 * Supports future gateway integrations, audit, and admin overrides.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { RefundTransaction } from '../../refund/entities/refund-transaction.entity';
import { PaymentMethodEntity } from './payment-method.entity';

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  WALLET = 'wallet',
  // Add 'stripe', 'paypal', etc. as you integrate more
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIAL = 'partial',
  EXPIRED = 'expired',
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The order this payment is linked to
   */
  @ManyToOne(() => Order, (order) => order.paymentTransactions, {
    nullable: false,
  })
  order: Order;

  /**
   * The user who initiated the payment (buyer)
   */
  @ManyToOne(() => User, { nullable: false })
  user: User;

  /**
   * Payment method entity reference
   */
  @ManyToOne(
    () => PaymentMethodEntity,
    (paymentMethod) => paymentMethod.transactions,
    { nullable: true },
  )
  paymentMethod: PaymentMethodEntity;

  /**
   * Payment method (card, cash, wallet, ...)
   */
  @Column({ type: 'enum', enum: PaymentMethod })
  @Index()
  method: PaymentMethod;

  /**
   * Payment provider/gateway (manual, stripe, paypal, etc.)
   */
  @Column({ default: 'manual' })
  provider: string;

  /**
   * Amount paid (in minor units, e.g., cents/piasters)
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  /**
   * Currency (ISO, e.g., SYP, USD, TRY)
   */
  @Column({ length: 8 })
  currency: string;

  /**
   * Current status of the payment
   */
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  /**
   * Gateway transaction ID or reference (if any)
   */
  @Column({ nullable: true })
  gatewayTransactionId: string;

  /**
   * Additional raw response/metadata from payment gateway (JSON)
   */
  @Column({ type: 'json', nullable: true })
  gatewayResponse: any;

  /**
   * IP address of a payment attempt
   */
  @Column({ nullable: true })
  ipAddress: string;

  /**
   * Channel (web, mobile, admin, etc.)
   */
  @Column({ nullable: true })
  channel: string;

  /**
   * Linked refunds for this payment (one-to-many)
   */
  @OneToMany(() => RefundTransaction, (refund) => refund.paymentTransaction)
  refunds: RefundTransaction[];

  /**
   * Who created/approved/overrode this (admin ID, nullable for user-initiated)
   */
  @Column({ nullable: true })
  adminActionBy: number;

  /**
   * When payment was created/updated
   */
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

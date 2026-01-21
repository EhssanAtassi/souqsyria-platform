/**
 * 📦 Order Entity
 *
 * Represents a full order created from one or more cart items.
 * Supports multivendor splits, soft deletes, and status tracking.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusLog } from './order-status-log.entity';
import { PaymentTransaction } from '../../payment/entities/payment-transaction.entity';

/**
 * PERF-C01: Database indexes for optimized queries
 * - user: JOINs with user table (customer orders lookup)
 * - status + created_at: Admin dashboard queries for order status filtering
 * - payment_status: Payment reconciliation queries
 * - status: General status filtering
 */
@Entity('orders')
@Index(['user'])
@Index(['status', 'created_at'])
@Index(['payment_status'])
@Index(['status'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  payment_method: string;

  @Column({ type: 'varchar', length: 20 })
  payment_status: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'text', nullable: true })
  buyer_note?: string;

  @Column({ type: 'text', nullable: true })
  gift_message?: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusLog, (log) => log.order)
  status_logs: OrderStatusLog[];

  @OneToMany(() => PaymentTransaction, (payment) => payment.order)
  paymentTransactions: PaymentTransaction[];

  // --- Shipping Address Snapshot Fields ---
  /**
   * Snapshot of shipping address used for this order.
   * These fields are copied from the user's Address at checkout time.
   */
  @Column() shippingName: string;

  @Column() shippingPhone: string;

  @Column() shippingAddressLine1: string;

  @Column({ nullable: true }) shippingAddressLine2: string;

  @Column() shippingCity: string;

  @Column() shippingRegion: string;

  @Column() shippingCountry: string;

  @Column() shippingPostalCode: string;

  // --- Billing Address Snapshot Fields ---
  /**
   * Snapshot of billing address used for this order.
   * (Optional: set nullable, some checkouts use only shipping)
   */
  @Column({ nullable: true }) billingName: string;

  @Column({ nullable: true }) billingPhone: string;

  @Column({ nullable: true }) billingAddressLine1: string;

  @Column({ nullable: true }) billingAddressLine2: string;

  @Column({ nullable: true }) billingCity: string;

  @Column({ nullable: true }) billingRegion: string;

  @Column({ nullable: true }) billingCountry: string;

  @Column({ nullable: true }) billingPostalCode: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at?: Date;
}

/**
 * @file coupon-usage.entity.ts
 * @description Coupon usage tracking entity for comprehensive analytics
 *
 * Tracks every coupon redemption for:
 * - Usage analytics and reporting
 * - Fraud prevention and monitoring
 * - Customer behavior analysis
 * - Syrian market insights
 * - Audit trail compliance
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { CouponEntity } from './coupon.entity';
import { User } from '../../users/entities/user.entity';

export enum UsageStatus {
  APPLIED = 'applied',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Entity('coupon_usage')
@Index(['used_at'])
@Index(['status'])
export class CouponUsage {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Primary key' })
  id: number;

  @ManyToOne(() => CouponEntity, (coupon) => coupon.usage_history, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'coupon_id' })
  @ApiProperty({ description: 'Coupon that was used' })
  coupon: CouponEntity;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  @ApiProperty({ description: 'User who used the coupon' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @ApiProperty({ description: 'Order ID where coupon was applied' })
  order_id: string;

  @Column('decimal', { precision: 12, scale: 2 })
  @ApiProperty({ description: 'Original order amount in SYP before discount' })
  order_amount_before_discount: number;

  @Column('decimal', { precision: 12, scale: 2 })
  @ApiProperty({ description: 'Actual discount amount applied in SYP' })
  discount_amount_applied: number;

  @Column('decimal', { precision: 12, scale: 2 })
  @ApiProperty({ description: 'Final order amount in SYP after discount' })
  order_amount_after_discount: number;

  @Column({
    type: 'enum',
    enum: UsageStatus,
    default: UsageStatus.APPLIED,
  })
  @ApiProperty({ description: 'Status of coupon usage', enum: UsageStatus })
  status: UsageStatus;

  @Column({ type: 'varchar', length: 45, nullable: true })
  @ApiProperty({ description: 'Customer IP address for fraud prevention' })
  customer_ip: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Customer user agent for analytics' })
  customer_user_agent: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'Syrian market usage context' })
  syrian_context: {
    governorate?: string;
    city?: string;
    is_diaspora_customer?: boolean;
    payment_method?: string;
    device_type?: string;
  };

  @CreateDateColumn()
  @ApiProperty({ description: 'When coupon was used' })
  used_at: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'When usage was refunded (if applicable)' })
  refunded_at: Date;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Reason for refund or cancellation' })
  refund_reason: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Additional notes about usage' })
  usage_notes: string;
}

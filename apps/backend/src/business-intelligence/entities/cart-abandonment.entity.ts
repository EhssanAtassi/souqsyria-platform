/**
 * @file cart-abandonment.entity.ts
 * @description Cart Abandonment Tracking Entity for Recovery Campaigns
 *
 * PURPOSE:
 * - Tracks cart abandonment events and recovery attempts
 * - Enables automated recovery email/SMS campaigns
 * - Provides insights into abandonment patterns and reasons
 * - Supports A/B testing of recovery strategies
 *
 * BUSINESS VALUE:
 * - Recover lost revenue from abandoned carts
 * - Identify and fix checkout friction points
 * - Optimize conversion rates through targeted campaigns
 * - Understand customer behavior patterns
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 * @version 1.0.0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Cart abandonment stages for tracking recovery journey
 */
export enum AbandonmentStage {
  CART_CREATED = 'cart_created',
  ITEMS_ADDED = 'items_added',
  CHECKOUT_VIEWED = 'checkout_viewed',
  SHIPPING_FILLED = 'shipping_filled',
  PAYMENT_VIEWED = 'payment_viewed',
  PAYMENT_ATTEMPTED = 'payment_attempted',
  ABANDONED = 'abandoned',
  RECOVERED = 'recovered',
}

/**
 * Recovery campaign types for tracking effectiveness
 */
export enum RecoveryCampaignType {
  EMAIL_IMMEDIATE = 'email_immediate',     // 1 hour after abandonment
  EMAIL_FOLLOWUP = 'email_followup',       // 24 hours after
  EMAIL_FINAL = 'email_final',             // 72 hours after
  SMS_REMINDER = 'sms_reminder',           // 6 hours after
  PUSH_NOTIFICATION = 'push_notification', // 30 minutes after
  RETARGETING_AD = 'retargeting_ad',       // Cross-platform ads
  DISCOUNT_OFFER = 'discount_offer',       // Incentive-based recovery
}

/**
 * Abandonment reasons for analytics and optimization
 */
export enum AbandonmentReason {
  HIGH_SHIPPING_COST = 'high_shipping_cost',
  PAYMENT_FAILURE = 'payment_failure',
  REQUIRED_REGISTRATION = 'required_registration',
  SLOW_CHECKOUT = 'slow_checkout',
  SECURITY_CONCERNS = 'security_concerns',
  COMPARISON_SHOPPING = 'comparison_shopping',
  UNEXPECTED_COSTS = 'unexpected_costs',
  COMPLEX_CHECKOUT = 'complex_checkout',
  STOCK_UNAVAILABLE = 'stock_unavailable',
  UNKNOWN = 'unknown',
}

/**
 * Cart Abandonment Entity
 * 
 * Comprehensive cart abandonment tracking for recovery campaigns
 * and conversion optimization analytics.
 * 
 * @swagger
 * @ApiTags('Business Intelligence - Cart Abandonment')
 */
@Entity('cart_abandonments')
@Index(['userId'])
@Index(['sessionId'])
@Index(['currentStage'])
@Index(['abandonedAt'])
@Index(['recoveryStatus'])
@Index(['totalValue'])
export class CartAbandonment {
  @ApiProperty({
    description: 'Cart abandonment record unique identifier',
    example: 'ca_550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Cart ID that was abandoned',
    example: 'cart_12345',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  cartId: string;

  @ApiProperty({
    description: 'User ID (null for guest abandonments)',
    example: 12345,
    nullable: true,
  })
  @Column({
    type: 'int',
    nullable: true,
  })
  userId: number | null;

  @ApiProperty({
    description: 'Session ID for guest cart tracking',
    example: 'sess_abc123def456',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  sessionId: string | null;

  @ApiProperty({
    description: 'Current stage in the abandonment journey',
    enum: AbandonmentStage,
    example: AbandonmentStage.PAYMENT_VIEWED,
  })
  @Column({
    type: 'enum',
    enum: AbandonmentStage,
    nullable: false,
  })
  currentStage: AbandonmentStage;

  @ApiProperty({
    description: 'Detected or user-provided abandonment reason',
    enum: AbandonmentReason,
    example: AbandonmentReason.HIGH_SHIPPING_COST,
  })
  @Column({
    type: 'enum',
    enum: AbandonmentReason,
    default: AbandonmentReason.UNKNOWN,
  })
  abandonmentReason: AbandonmentReason;

  @ApiProperty({
    description: 'Total cart value at abandonment',
    example: 129.99,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Currency of the cart value',
    example: 'SYP',
  })
  @Column({
    type: 'varchar',
    length: 3,
    default: 'SYP',
  })
  currency: string;

  @ApiProperty({
    description: 'Number of items in abandoned cart',
    example: 3,
  })
  @Column({
    type: 'int',
    nullable: false,
  })
  itemCount: number;

  @ApiProperty({
    description: 'Time spent in cart before abandonment (seconds)',
    example: 420,
  })
  @Column({
    type: 'int',
    nullable: true,
  })
  timeSpentInCart: number | null;

  @ApiProperty({
    description: 'Number of checkout page views',
    example: 2,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  checkoutPageViews: number;

  @ApiProperty({
    description: 'Whether user started checkout process',
    example: true,
  })
  @Column({
    type: 'boolean',
    default: false,
  })
  checkoutStarted: boolean;

  @ApiProperty({
    description: 'Whether shipping information was filled',
    example: true,
  })
  @Column({
    type: 'boolean',
    default: false,
  })
  shippingInfoProvided: boolean;

  @ApiProperty({
    description: 'Whether payment method was selected',
    example: false,
  })
  @Column({
    type: 'boolean',
    default: false,
  })
  paymentMethodSelected: boolean;

  @ApiProperty({
    description: 'Cart items at time of abandonment',
    example: [
      {
        productId: 123,
        variantId: 456,
        name: 'Samsung Galaxy S25',
        price: 89.99,
        quantity: 1,
        category: 'Electronics'
      }
    ],
  })
  @Column({
    type: 'json',
    nullable: false,
  })
  abandonedItems: Array<{
    productId: number;
    variantId?: number;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;

  @ApiProperty({
    description: 'Recovery campaign status',
    example: 'in_progress',
  })
  @Column({
    type: 'enum',
    enum: ['not_started', 'in_progress', 'completed', 'recovered', 'failed'],
    default: 'not_started',
  })
  recoveryStatus: 'not_started' | 'in_progress' | 'completed' | 'recovered' | 'failed';

  @ApiProperty({
    description: 'Recovery campaigns sent',
    example: [
      {
        type: 'email_immediate',
        sentAt: '2026-01-22T11:30:00.000Z',
        opened: true,
        clicked: false
      }
    ],
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  recoveryCampaigns: Array<{
    type: RecoveryCampaignType;
    sentAt: Date;
    opened?: boolean;
    clicked?: boolean;
    recovered?: boolean;
  }> | null;

  @ApiProperty({
    description: 'Customer device and browser information',
    example: {
      userAgent: 'Mozilla/5.0...',
      deviceType: 'mobile',
      browser: 'Chrome',
      operatingSystem: 'Android'
    },
    nullable: true,
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  deviceInfo: Record<string, any> | null;

  @ApiProperty({
    description: 'Geographic location information',
    example: {
      country: 'Syria',
      city: 'Damascus',
      timezone: 'Asia/Damascus'
    },
    nullable: true,
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  locationInfo: Record<string, any> | null;

  @ApiProperty({
    description: 'Exit page and behavior before abandonment',
    example: {
      exitPage: '/checkout/payment',
      exitAction: 'navigate_away',
      previousPages: ['/cart', '/checkout/shipping'],
      scrollDepth: 75
    },
    nullable: true,
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  exitBehavior: Record<string, any> | null;

  @ApiProperty({
    description: 'When the cart was first created',
    example: '2026-01-22T10:00:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: false,
  })
  cartCreatedAt: Date;

  @ApiProperty({
    description: 'When the cart was abandoned',
    example: '2026-01-22T10:30:00.000Z',
  })
  @Column({
    type: 'timestamp',
    nullable: false,
  })
  abandonedAt: Date;

  @ApiProperty({
    description: 'When the cart was recovered (if applicable)',
    example: '2026-01-22T12:15:00.000Z',
    nullable: true,
  })
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  recoveredAt: Date | null;

  @ApiProperty({
    description: 'Recovery campaign that led to conversion',
    enum: RecoveryCampaignType,
    example: RecoveryCampaignType.EMAIL_FOLLOWUP,
    nullable: true,
  })
  @Column({
    type: 'enum',
    enum: RecoveryCampaignType,
    nullable: true,
  })
  recoveryMethod: RecoveryCampaignType | null;

  @ApiProperty({
    description: 'A/B test variant for recovery optimization',
    example: 'variant_b',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  testVariant: string | null;

  @ApiProperty({
    description: 'Next scheduled recovery campaign',
    example: '2026-01-23T10:30:00.000Z',
    nullable: true,
  })
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  nextRecoveryScheduled: Date | null;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2026-01-22T10:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Record last update timestamp',
    example: '2026-01-22T11:45:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
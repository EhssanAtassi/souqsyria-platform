/**
 * @file business-event.entity.ts
 * @description Core Business Intelligence Event Entity for SouqSyria E-commerce Platform
 *
 * PURPOSE:
 * - Captures all business intelligence events for analytics and reporting
 * - Supports event versioning and schema evolution
 * - Enables real-time and historical business analysis
 * - Provides foundation for customer lifecycle tracking and business metrics
 *
 * EVENT TYPES SUPPORTED:
 * - Customer lifecycle events (registration, first purchase, churn)
 * - Shopping behavior events (product views, cart actions, purchases)
 * - Business funnel events (conversion tracking)
 * - Customer segmentation events
 * - Revenue and CLV calculation events
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
 * Enumeration of all business intelligence event types
 * Used for type-safe event classification and analytics queries
 */
export enum BusinessEventType {
  // Customer Lifecycle Events
  USER_REGISTERED = 'user_registered',
  USER_FIRST_PURCHASE = 'user_first_purchase',
  USER_RETURN_PURCHASE = 'user_return_purchase',
  USER_CHURN_DETECTED = 'user_churn_detected',
  USER_REACTIVATED = 'user_reactivated',

  // Shopping Behavior Events
  PRODUCT_VIEWED = 'product_viewed',
  PRODUCT_SEARCH_PERFORMED = 'product_search_performed',
  CATEGORY_BROWSED = 'category_browsed',
  
  // Cart Behavior Events
  CART_CREATED = 'cart_created',
  CART_ITEM_ADDED = 'cart_item_added',
  CART_ITEM_REMOVED = 'cart_item_removed',
  CART_ABANDONED = 'cart_abandoned',
  CART_RECOVERED = 'cart_recovered',
  
  // Checkout and Purchase Events
  CHECKOUT_STARTED = 'checkout_started',
  CHECKOUT_COMPLETED = 'checkout_completed',
  CHECKOUT_ABANDONED = 'checkout_abandoned',
  PURCHASE_COMPLETED = 'purchase_completed',
  
  // Customer Segmentation Events
  CUSTOMER_SEGMENT_CHANGED = 'customer_segment_changed',
  CLV_CALCULATED = 'clv_calculated',
  COHORT_ASSIGNED = 'cohort_assigned',
  
  // Business Metrics Events
  REVENUE_MILESTONE_REACHED = 'revenue_milestone_reached',
  ORDER_VALUE_THRESHOLD_CROSSED = 'order_value_threshold_crossed',
  
  // Engagement Events
  WISHLIST_ITEM_ADDED = 'wishlist_item_added',
  REVIEW_SUBMITTED = 'review_submitted',
  REFERRAL_COMPLETED = 'referral_completed',
}

/**
 * Customer segment classifications for business intelligence
 */
export enum CustomerSegment {
  NEW = 'new',
  ACTIVE = 'active',
  AT_RISK = 'at_risk',
  CHURNED = 'churned',
  VIP = 'vip',
  LOYALIST = 'loyalist',
  BARGAIN_HUNTER = 'bargain_hunter',
  BIG_SPENDER = 'big_spender',
}

/**
 * Business Event Entity
 * 
 * Captures comprehensive business intelligence events with rich metadata
 * for analytics, reporting, and real-time business insights.
 * 
 * @swagger
 * @ApiTags('Business Intelligence')
 */
@Entity('business_events')
@Index(['eventType', 'eventTimestamp'])
@Index(['userId', 'eventTimestamp'])
@Index(['sessionId', 'eventTimestamp'])
@Index(['correlationId'])
@Index(['eventTimestamp'])
@Index(['aggregateId', 'aggregateType'])
export class BusinessEvent {
  @ApiProperty({
    description: 'Business event unique identifier',
    example: 'be_550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of business intelligence event',
    enum: BusinessEventType,
    example: BusinessEventType.PRODUCT_VIEWED,
  })
  @Column({
    type: 'enum',
    enum: BusinessEventType,
    nullable: false,
  })
  eventType: BusinessEventType;

  @ApiProperty({
    description: 'Event schema version for evolution support',
    example: '1.0.0',
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: '1.0.0',
  })
  eventVersion: string;

  @ApiProperty({
    description: 'User ID (null for anonymous events)',
    example: 12345,
    nullable: true,
  })
  @Column({
    type: 'int',
    nullable: true,
  })
  userId: number | null;

  @ApiProperty({
    description: 'Session ID for tracking anonymous users',
    example: 'sess_abc123def456',
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  sessionId: string | null;

  @ApiProperty({
    description: 'Correlation ID for distributed tracing',
    example: 'corr_550e8400-e29b-41d4-a716-446655440000',
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  correlationId: string;

  @ApiProperty({
    description: 'Aggregate ID (order, product, cart, etc.)',
    example: 'order_12345',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  aggregateId: string | null;

  @ApiProperty({
    description: 'Aggregate type (order, product, cart, user, etc.)',
    example: 'order',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  aggregateType: string | null;

  @ApiProperty({
    description: 'Source module that generated the event',
    example: 'orders',
  })
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  sourceModule: string;

  @ApiProperty({
    description: 'Customer segment at time of event',
    enum: CustomerSegment,
    example: CustomerSegment.ACTIVE,
    nullable: true,
  })
  @Column({
    type: 'enum',
    enum: CustomerSegment,
    nullable: true,
  })
  customerSegment: CustomerSegment | null;

  @ApiProperty({
    description: 'Rich event payload with business-specific data',
    example: {
      productId: 123,
      categoryId: 45,
      price: 99.99,
      currency: 'SYP',
      quantity: 2,
      viewDuration: 45000,
      referrer: 'search_results',
    },
  })
  @Column({
    type: 'json',
    nullable: false,
  })
  eventPayload: Record<string, any>;

  @ApiProperty({
    description: 'Additional metadata (device, location, etc.)',
    example: {
      userAgent: 'Mozilla/5.0...',
      ipAddress: '192.168.1.1',
      deviceType: 'desktop',
      location: 'Damascus',
      channel: 'web',
    },
    nullable: true,
  })
  @Column({
    type: 'json',
    nullable: true,
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Revenue amount for monetized events',
    example: 99.99,
    nullable: true,
  })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  revenueAmount: number | null;

  @ApiProperty({
    description: 'Currency for revenue amount',
    example: 'SYP',
    nullable: true,
  })
  @Column({
    type: 'varchar',
    length: 3,
    nullable: true,
  })
  currency: string | null;

  @ApiProperty({
    description: 'Event processing status for reliability',
    example: 'processed',
  })
  @Column({
    type: 'enum',
    enum: ['pending', 'processed', 'failed', 'retrying'],
    default: 'pending',
  })
  processingStatus: 'pending' | 'processed' | 'failed' | 'retrying';

  @ApiProperty({
    description: 'Number of processing attempts',
    example: 1,
  })
  @Column({
    type: 'int',
    default: 0,
  })
  processingAttempts: number;

  @ApiProperty({
    description: 'Last processing error message',
    nullable: true,
  })
  @Column({
    type: 'text',
    nullable: true,
  })
  lastProcessingError: string | null;

  @ApiProperty({
    description: 'When the business event occurred',
    example: '2026-01-22T10:30:00.000Z',
  })
  @CreateDateColumn()
  eventTimestamp: Date;

  @ApiProperty({
    description: 'When the event record was created',
    example: '2026-01-22T10:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'When the event record was last updated',
    example: '2026-01-22T10:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
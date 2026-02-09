/**
 * 🚚 Shipment Entity - Enhanced with Syrian Localization and Enterprise Workflow
 *
 * FEATURES:
 * - Syrian shipping company integration
 * - Enterprise workflow status tracking
 * - Multi-currency cost calculations (SYP primary)
 * - Arabic/English localization support
 * - Advanced delivery tracking and proof systems
 * - SLA monitoring and performance metrics
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { ShippingCompany } from './shipping-company.entity';
import { SyrianShippingCompanyEntity } from './syrian-shipping-company.entity';
import { ShipmentStatusLog } from './shipment-status-log.entity';
import { ShipmentItem } from './shipment-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { SyrianAddressEntity } from '../../addresses/entities/syrian-address.entity';

/**
 * Enhanced shipment workflow statuses
 */
export enum ShipmentStatus {
  CREATED = 'created',
  ASSIGNED_COMPANY = 'assigned_company',
  PICKUP_SCHEDULED = 'pickup_scheduled',
  PICKED_UP = 'picked_up',
  IN_WAREHOUSE = 'in_warehouse',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERY_ATTEMPTED = 'delivery_attempted',
  DELIVERED = 'delivered',
  CONFIRMED_DELIVERED = 'confirmed_delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED_TO_SENDER = 'returned_to_sender',
  LOST = 'lost',
  DAMAGED = 'damaged',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('shipments')
@Index(['status', 'createdAt'])
@Index(['tracking_code'])
export class Shipment {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique shipment ID' })
  id: number;

  /**
   * Related order
   */
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  @ApiProperty({ description: 'Associated order' })
  order: Order;

  /**
   * Legacy shipping company (for backward compatibility)
   */
  @ManyToOne(() => ShippingCompany, { nullable: true })
  @JoinColumn({ name: 'shipping_company_id' })
  @ApiProperty({ description: 'Legacy shipping company (deprecated)' })
  shippingCompany?: ShippingCompany;

  /**
   * Syrian shipping company (primary)
   */
  @ManyToOne(
    () => SyrianShippingCompanyEntity,
    (company) => company.shipments,
    { nullable: true },
  )
  @JoinColumn({ name: 'syrian_shipping_company_id' })
  @ApiProperty({
    description: 'Syrian shipping company handling this shipment',
  })
  syrianShippingCompany?: SyrianShippingCompanyEntity;

  /**
   * Shipment items
   */
  @OneToMany(() => ShipmentItem, (item) => item.shipment, { cascade: true })
  @ApiProperty({ description: 'Items included in this shipment' })
  items: ShipmentItem[];

  /**
   * Status logs for workflow tracking
   */
  @OneToMany(() => ShipmentStatusLog, (log) => log.shipment, { cascade: true })
  @ApiProperty({ description: 'Status change history' })
  statusLogs: ShipmentStatusLog[];

  /**
   * Current shipment status
   */
  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.CREATED,
  })
  @Index()
  @ApiProperty({
    description: 'Current shipment status',
    enum: ShipmentStatus,
    example: ShipmentStatus.OUT_FOR_DELIVERY,
  })
  status: ShipmentStatus;

  /**
   * Assigned delivery agent
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'delivery_agent_id' })
  @ApiProperty({ description: 'Assigned delivery agent' })
  deliveryAgent?: User;

  /**
   * Pickup and delivery addresses
   */
  @ManyToOne(() => SyrianAddressEntity, { nullable: true })
  @JoinColumn({ name: 'pickup_address_id' })
  @ApiProperty({ description: 'Pickup address (usually vendor/warehouse)' })
  pickupAddress?: SyrianAddressEntity;

  @ManyToOne(() => SyrianAddressEntity, { nullable: true })
  @JoinColumn({ name: 'delivery_address_id' })
  @ApiProperty({ description: 'Delivery address (customer)' })
  deliveryAddress?: SyrianAddressEntity;

  /**
   * Tracking and identification
   */
  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  @ApiProperty({
    description: 'Unique tracking code',
    example: 'SY-SHIP-2025-001234',
  })
  tracking_code?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @ApiProperty({
    description: 'External tracking reference from shipping company',
    example: 'DXB-20250809-5678',
  })
  external_tracking_ref?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'Direct tracking URL provided by carrier' })
  tracking_url?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @ApiProperty({ description: 'Latest shipment status reported by carrier' })
  external_status?: string;

  /**
   * Delivery proof and confirmation
   */
  @Column({
    type: 'enum',
    enum: ['signature', 'photo', 'otp', 'sms', 'call'],
    nullable: true,
  })
  @ApiProperty({
    description: 'Type of delivery proof required/provided',
    enum: ['signature', 'photo', 'otp', 'sms', 'call'],
    example: 'photo',
  })
  proof_type?: 'signature' | 'photo' | 'otp' | 'sms' | 'call';

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Delivery proof data and metadata',
    example: {
      photoUrl: 'https://storage.souqsyria.com/delivery-proofs/12345.jpg',
      signatureData: 'base64_signature_data',
      recipientName: 'Ahmad Al-Customer',
      recipientPhone: '+963987654321',
      deliveryNotes: 'Delivered to front door',
      deliveryNotesAr: 'تم التوصيل للباب الأمامي',
    },
  })
  proof_data?: {
    photoUrl?: string;
    photoUrls?: string[];
    signatureData?: string;
    otpCode?: string;
    smsConfirmation?: string;
    callConfirmation?: string;
    recipientName?: string;
    recipientNameAr?: string;
    recipientPhone?: string;
    recipientId?: string;
    deliveryNotes?: string;
    deliveryNotesAr?: string;
    gpsCoordinates?: {
      lat: number;
      lng: number;
    };
  };

  /**
   * Timing and scheduling
   */
  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Scheduled pickup time' })
  scheduled_pickup_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Actual pickup time' })
  picked_up_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Estimated delivery time' })
  estimated_delivery_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Actual delivery time' })
  delivered_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @ApiProperty({ description: 'Customer confirmation time' })
  confirmed_at?: Date;

  /**
   * Costs and pricing (in SYP)
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Detailed cost breakdown in SYP',
    example: {
      baseFee: 2000,
      distanceFee: 1500,
      weightFee: 500,
      expressFee: 1000,
      codFee: 500,
      insuranceFee: 300,
      totalCost: 5800,
      currency: 'SYP',
    },
  })
  cost_breakdown?: {
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    expressFee?: number;
    weekendFee?: number;
    holidayFee?: number;
    codFee?: number;
    insuranceFee?: number;
    fuelSurcharge?: number;
    totalCost: number;
    currency: string;
    calculatedAt: Date;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @ApiProperty({
    description: 'Total shipping cost in SYP',
    example: 5800.0,
  })
  total_cost_syp?: number;

  /**
   * Package details
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Package physical details',
    example: {
      weightKg: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      declaredValue: 150000,
      isFragile: true,
      specialInstructions: 'Handle with care - electronics',
      specialInstructionsAr: 'تعامل بحذر - إلكترونيات',
    },
  })
  package_details?: {
    weightKg: number;
    dimensions: {
      length: number; // cm
      width: number; // cm
      height: number; // cm
    };
    declaredValue: number; // SYP
    isFragile: boolean;
    requiresColdStorage: boolean;
    specialInstructions?: string;
    specialInstructionsAr?: string;
    contents: Array<{
      item: string;
      itemAr: string;
      quantity: number;
      value: number;
    }>;
  };

  /**
   * Service level and options
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Service level and delivery options',
    example: {
      serviceType: 'same_day',
      isExpress: true,
      requiresSignature: true,
      cashOnDelivery: true,
      codAmount: 150000,
      insuranceRequired: true,
      callBeforeDelivery: true,
      deliveryInstructions: 'Call 30 minutes before arrival',
      deliveryInstructionsAr: 'اتصل قبل الوصول بـ 30 دقيقة',
    },
  })
  service_options?: {
    serviceType: string;
    serviceName?: string;
    serviceNameAr?: string;
    isExpress: boolean;
    requiresSignature: boolean;
    cashOnDelivery: boolean;
    codAmount?: number;
    insuranceRequired: boolean;
    callBeforeDelivery: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
    deliveryInstructions?: string;
    deliveryInstructionsAr?: string;
    preferredDeliveryTime?: string;
    alternativeContact?: string;
  };

  /**
   * Performance and SLA tracking
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'SLA and performance tracking data',
    example: {
      slaHours: 24,
      isOverdue: false,
      hoursOverdue: 0,
      escalationLevel: 0,
      lastEscalation: null,
      performanceRating: 4.5,
      onTimeDelivery: true,
    },
  })
  sla_tracking?: {
    slaHours: number;
    expectedDeliveryTime: Date;
    isOverdue: boolean;
    hoursOverdue: number;
    escalationLevel: number;
    lastEscalation?: Date;
    performanceRating?: number;
    onTimeDelivery?: boolean;
    delayReasons?: string[];
  };

  /**
   * Notes and communications
   */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Internal notes (English)' })
  internal_notes?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Internal notes (Arabic)' })
  internal_notes_ar?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Customer-visible notes (English)' })
  customer_notes?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Customer-visible notes (Arabic)' })
  customer_notes_ar?: string;

  /**
   * Integration and external systems
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({ description: 'External system integration data' })
  external_data?: {
    shippingCompanyData?: any;
    thirdPartyTracking?: any;
    webhookEvents?: Array<{
      event: string;
      timestamp: Date;
      data: any;
    }>;
    apiResponses?: any;
  };

  /**
   * Audit and metadata
   */
  @Column({ type: 'varchar', length: 45, nullable: true })
  @ApiProperty({ description: 'IP address of creation/last update' })
  client_ip?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @ApiProperty({ description: 'User agent of creation/last update' })
  user_agent?: string;

  /**
   * Timestamps
   */
  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  // Backward compatibility properties (deprecated)
  get created_at(): Date {
    return this.createdAt;
  }
  get updated_at(): Date {
    return this.updatedAt;
  }
}

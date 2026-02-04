/**
 * @file inventory-reservation.entity.ts
 * @description Enterprise Inventory Reservation and Allocation System
 *
 * ENTERPRISE FEATURES:
 * - Real-time inventory reservation with timeout handling
 * - Multi-warehouse intelligent allocation
 * - Concurrent reservation conflict resolution
 * - Automated stock replenishment triggers
 * - Performance monitoring and optimization
 * - SLA-based reservation priorities
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ProductVariant } from '../../products/variants/entities/product-variant.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Reservation status tracking
 */
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ALLOCATED = 'allocated',
  PARTIALLY_ALLOCATED = 'partially_allocated',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  FULFILLED = 'fulfilled',
  RELEASED = 'released',
}

/**
 * Reservation priority levels
 */
export enum ReservationPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  URGENT = 10,
  CRITICAL = 15,
}

/**
 * Allocation strategy types
 */
export enum AllocationStrategy {
  FIRST_AVAILABLE = 'first_available',
  NEAREST_WAREHOUSE = 'nearest_warehouse',
  LOWEST_COST = 'lowest_cost',
  LOAD_BALANCING = 'load_balancing',
  FIFO = 'fifo',
  LIFO = 'lifo',
  EXPIRY_DATE = 'expiry_date',
  CUSTOM = 'custom',
}

/**
 * Reservation conflict resolution strategies
 */
export enum ConflictResolution {
  FIRST_COME_FIRST_SERVE = 'fcfs',
  PRIORITY_BASED = 'priority',
  PROPORTIONAL = 'proportional',
  MANAGER_REVIEW = 'manual',
}

@Entity('inventory_reservations')
@Index(['variant', 'status'])
@Index(['warehouse', 'status'])
@Index(['order', 'status'])
@Index(['expiresAt', 'status'])
@Index(['priority', 'createdAt'])
export class InventoryReservationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Product variant being reserved
   */
  @ManyToOne(() => ProductVariant, { nullable: false })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  /**
   * Target warehouse for reservation
   */
  @ManyToOne(() => Warehouse, { nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  /**
   * Associated order
   */
  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  /**
   * Quantity to reserve
   */
  @Column({ name: 'requested_quantity', type: 'int' })
  requestedQuantity: number;

  /**
   * Actually reserved quantity (may be less than requested)
   */
  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity: number;

  /**
   * Allocated quantity (confirmed for fulfillment)
   */
  @Column({ name: 'allocated_quantity', type: 'int', default: 0 })
  allocatedQuantity: number;

  /**
   * Reservation status
   */
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  @Index()
  status: ReservationStatus;

  /**
   * Priority level for processing
   */
  @Column({
    name: 'priority',
    type: 'enum',
    enum: ReservationPriority,
    default: ReservationPriority.NORMAL,
  })
  @Index()
  priority: ReservationPriority;

  /**
   * Allocation strategy used
   */
  @Column({
    name: 'allocation_strategy',
    type: 'enum',
    enum: AllocationStrategy,
    default: AllocationStrategy.FIRST_AVAILABLE,
  })
  allocationStrategy: AllocationStrategy;

  /**
   * Reservation expiration time
   */
  @Column({ name: 'expires_at', type: 'datetime' })
  @Index()
  expiresAt: Date;

  /**
   * Confirmation deadline (for pending reservations)
   */
  @Column({ name: 'confirmation_deadline', type: 'datetime', nullable: true })
  confirmationDeadline: Date;

  /**
   * User who created the reservation
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  /**
   * User who confirmed/allocated the reservation
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'confirmed_by' })
  confirmedBy: User;

  /**
   * Reservation metadata and business rules
   */
  @Column({ name: 'reservation_data', type: 'json', nullable: true })
  reservationData: {
    customerPriority?: number;
    orderValue?: number;
    customerTier?: string;
    productCategory?: string;
    seasonalDemand?: number;
    vendorPriority?: number;
    geographicZone?: string;
    deliveryCommitment?: Date;
    customRules?: Record<string, any>;
  };

  /**
   * Allocation details across warehouses
   */
  @Column({ name: 'allocation_details', type: 'json', nullable: true })
  allocationDetails: Array<{
    warehouseId: number;
    warehouseName: string;
    allocatedQuantity: number;
    availableQuantity: number;
    distanceKm?: number;
    estimatedShippingCost?: number;
    shippingTime?: number; // hours
    allocationScore?: number;
    constraints?: string[];
  }>;

  /**
   * Performance tracking
   */
  @Column({ name: 'performance_metrics', type: 'json', nullable: true })
  performanceMetrics: {
    reservationTime?: number; // milliseconds to reserve
    allocationTime?: number; // milliseconds to allocate
    conflictResolutionTime?: number;
    warehouseQueriesCount?: number;
    stockCheckLatency?: number;
    fulfillmentRate?: number; // percentage of requested quantity fulfilled
    customerSatisfactionImpact?: number;
  };

  /**
   * Conflict tracking
   */
  @Column({ name: 'conflict_data', type: 'json', nullable: true })
  conflictData: {
    conflictDetected?: boolean;
    conflictType?: string; // 'stock_shortage', 'concurrent_reservation', 'system_error'
    conflictResolution?: ConflictResolution;
    competingReservations?: number[];
    resolutionStrategy?: string;
    resolutionTime?: number;
    impactedCustomers?: number;
  };

  /**
   * Automated rules and triggers
   */
  @Column({ name: 'automation_config', type: 'json', nullable: true })
  automationConfig: {
    autoConfirm?: boolean;
    autoAllocate?: boolean;
    reorderTrigger?: {
      threshold: number;
      quantity: number;
      vendorId: number;
    };
    escalationRules?: Array<{
      condition: string;
      action: string;
      delayMinutes: number;
    }>;
    notifications?: Array<{
      event: string;
      recipients: string[];
      template: string;
    }>;
  };

  /**
   * Stock safety buffer
   */
  @Column({ name: 'safety_buffer', type: 'int', default: 0 })
  safetyBuffer: number; // extra stock to maintain

  /**
   * Integration with external systems
   */
  @Column({ name: 'external_references', type: 'json', nullable: true })
  externalReferences: {
    erpReservationId?: string;
    wmsAllocationId?: string;
    supplierOrderId?: string;
    carrierReservationId?: string;
    customSystemIds?: Record<string, string>;
  };

  /**
   * Error tracking
   */
  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  @Column({ name: 'last_error', type: 'json', nullable: true })
  lastError: {
    timestamp: Date;
    action: string;
    message: string;
    stackTrace?: string;
    retryable: boolean;
    impact: string; // 'low', 'medium', 'high', 'critical'
  };

  /**
   * Audit trail
   */
  @Column({ name: 'audit_trail', type: 'json', nullable: true })
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    user?: string;
    system?: string;
    details?: any;
    oldValues?: any;
    newValues?: any;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Inventory allocation history for analytics
 */
@Entity('inventory_allocations')
@Index(['reservation', 'createdAt'])
@Index(['warehouse', 'allocatedAt'])
export class InventoryAllocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Parent reservation
   */
  @ManyToOne(() => InventoryReservationEntity, { nullable: false })
  @JoinColumn({ name: 'reservation_id' })
  reservation: InventoryReservationEntity;

  /**
   * Source warehouse
   */
  @ManyToOne(() => Warehouse, { nullable: false })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  /**
   * Allocated quantity
   */
  @Column({ name: 'allocated_quantity', type: 'int' })
  allocatedQuantity: number;

  /**
   * Available quantity at time of allocation
   */
  @Column({ name: 'available_quantity_at_allocation', type: 'int' })
  availableQuantityAtAllocation: number;

  /**
   * Allocation algorithm used
   */
  @Column({ name: 'allocation_algorithm', length: 100 })
  allocationAlgorithm: string;

  /**
   * Allocation score/priority
   */
  @Column({
    name: 'allocation_score',
    type: 'decimal',
    precision: 10,
    scale: 4,
  })
  allocationScore: number;

  /**
   * Geographic and logistic data
   */
  @Column({ name: 'logistics_data', type: 'json', nullable: true })
  logisticsData: {
    distanceToCustomer?: number;
    estimatedShippingCost?: number;
    estimatedDeliveryTime?: number;
    carrierPreference?: string;
    specialHandlingRequired?: boolean;
    shippingZone?: string;
  };

  /**
   * Fulfillment tracking
   */
  @Column({ name: 'fulfillment_status', length: 50, default: 'allocated' })
  fulfillmentStatus: string; // allocated, picked, packed, shipped, delivered

  @Column({ name: 'allocated_at', type: 'datetime' })
  @Index()
  allocatedAt: Date;

  @Column({ name: 'fulfilled_at', type: 'datetime', nullable: true })
  fulfilledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

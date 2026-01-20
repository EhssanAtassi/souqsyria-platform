/**
 * @file order-workflow.entity.ts
 * @description Enterprise Order Workflow State Machine Engine
 *
 * ENTERPRISE FEATURES:
 * - Advanced state machine with configurable transitions
 * - Workflow automation with business rules
 * - Multi-vendor approval processes
 * - Automated inventory reservation and release
 * - SLA monitoring and escalation
 * - Integration with external systems
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
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Comprehensive order states for enterprise workflow
 */
export enum OrderState {
  // Initial States
  DRAFT = 'draft',
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting_payment',

  // Payment States
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PAYMENT_FAILED = 'payment_failed',

  // Vendor States
  AWAITING_VENDOR_APPROVAL = 'awaiting_vendor_approval',
  VENDOR_APPROVED = 'vendor_approved',
  VENDOR_REJECTED = 'vendor_rejected',

  // Inventory States
  INVENTORY_RESERVED = 'inventory_reserved',
  INVENTORY_ALLOCATED = 'inventory_allocated',
  INVENTORY_INSUFFICIENT = 'inventory_insufficient',

  // Fulfillment States
  PREPARING = 'preparing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',

  // Exception States
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  RETURNED = 'returned',

  // Final States
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

/**
 * Workflow action types that trigger state transitions
 */
export enum WorkflowAction {
  SUBMIT_ORDER = 'submit_order',
  PROCESS_PAYMENT = 'process_payment',
  CONFIRM_PAYMENT = 'confirm_payment',
  FAIL_PAYMENT = 'fail_payment',
  APPROVE_VENDOR = 'approve_vendor',
  REJECT_VENDOR = 'reject_vendor',
  RESERVE_INVENTORY = 'reserve_inventory',
  ALLOCATE_INVENTORY = 'allocate_inventory',
  RELEASE_INVENTORY = 'release_inventory',
  START_PREPARATION = 'start_preparation',
  MARK_READY = 'mark_ready',
  SHIP_ORDER = 'ship_order',
  UPDATE_TRACKING = 'update_tracking',
  DELIVER_ORDER = 'deliver_order',
  HOLD_ORDER = 'hold_order',
  CANCEL_ORDER = 'cancel_order',
  REFUND_ORDER = 'refund_order',
  COMPLETE_ORDER = 'complete_order',
}

/**
 * Workflow trigger types for automation
 */
export enum WorkflowTrigger {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SCHEDULED = 'scheduled',
  EVENT_DRIVEN = 'event_driven',
  API_WEBHOOK = 'api_webhook',
  SYSTEM_TIMEOUT = 'system_timeout',
}

@Entity('order_workflows')
@Index(['order', 'currentState'])
@Index(['currentState', 'createdAt'])
@Index(['escalationRequired', 'escalationDate'])
export class OrderWorkflowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Associated order
   */
  @ManyToOne(() => Order, { nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  /**
   * Current workflow state
   */
  @Column({
    name: 'current_state',
    type: 'enum',
    enum: OrderState,
    default: OrderState.DRAFT,
  })
  @Index()
  currentState: OrderState;

  /**
   * Previous state (for rollback scenarios)
   */
  @Column({
    name: 'previous_state',
    type: 'enum',
    enum: OrderState,
    nullable: true,
  })
  previousState: OrderState;

  /**
   * State entered timestamp
   */
  @Column({ name: 'state_entered_at', type: 'datetime' })
  @Index()
  stateEnteredAt: Date;

  /**
   * Expected completion time for current state
   */
  @Column({ name: 'expected_completion_at', type: 'datetime', nullable: true })
  expectedCompletionAt: Date;

  /**
   * SLA deadline for current state
   */
  @Column({ name: 'sla_deadline', type: 'datetime', nullable: true })
  slaDeadline: Date;

  /**
   * Workflow automation configuration
   */
  @Column({ name: 'automation_config', type: 'json', nullable: true })
  automationConfig: {
    autoTransitions?: Array<{
      fromState: OrderState;
      toState: OrderState;
      trigger: WorkflowTrigger;
      conditions: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
      delay?: number; // milliseconds
    }>;
    notifications?: Array<{
      trigger: WorkflowAction;
      recipients: string[];
      template: string;
      channels: string[];
    }>;
    escalations?: Array<{
      condition: string;
      delayMinutes: number;
      assignTo: string;
      template: string;
    }>;
  };

  /**
   * Business rules and constraints
   */
  @Column({ name: 'business_rules', type: 'json', nullable: true })
  businessRules: {
    requiredApprovals?: string[];
    inventoryReservationTimeout?: number;
    vendorResponseTimeout?: number;
    shippingConstraints?: Record<string, any>;
    paymentConstraints?: Record<string, any>;
  };

  /**
   * Current assignee for manual actions
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo: User;

  /**
   * Assignment queue for load balancing
   */
  @Column({ name: 'assignment_queue', length: 100, nullable: true })
  assignmentQueue: string;

  /**
   * Priority level for processing
   */
  @Column({ name: 'priority', type: 'int', default: 5 })
  @Index()
  priority: number; // 1 = highest, 10 = lowest

  /**
   * Escalation flag
   */
  @Column({ name: 'escalation_required', type: 'boolean', default: false })
  @Index()
  escalationRequired: boolean;

  /**
   * Escalation date
   */
  @Column({ name: 'escalation_date', type: 'datetime', nullable: true })
  escalationDate: Date;

  /**
   * Escalation reason
   */
  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason: string;

  /**
   * Performance metrics
   */
  @Column({ name: 'performance_metrics', type: 'json', nullable: true })
  performanceMetrics: {
    timeInState?: number; // milliseconds
    totalProcessingTime?: number;
    stateTransitionCount?: number;
    automationSuccessRate?: number;
    slaBreaches?: number;
    customerWaitTime?: number;
  };

  /**
   * External system integrations
   */
  @Column({ name: 'external_integrations', type: 'json', nullable: true })
  externalIntegrations: {
    shippingProvider?: {
      trackingNumber?: string;
      carrierId?: string;
      estimatedDelivery?: Date;
      webhookId?: string;
    };
    paymentGateway?: {
      transactionId?: string;
      gatewayOrderId?: string;
      webhookId?: string;
    };
    inventory?: {
      reservationId?: string;
      allocationId?: string;
      warehouseAssignments?: Array<{
        warehouseId: number;
        quantity: number;
        status: string;
      }>;
    };
  };

  /**
   * Error tracking
   */
  @Column({ name: 'error_count', type: 'int', default: 0 })
  errorCount: number;

  /**
   * Last error details
   */
  @Column({ name: 'last_error', type: 'json', nullable: true })
  lastError: {
    timestamp: Date;
    action: WorkflowAction;
    message: string;
    stackTrace?: string;
    retryable: boolean;
  };

  /**
   * Retry configuration
   */
  @Column({ name: 'retry_config', type: 'json', nullable: true })
  retryConfig: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    exponentialBackoff: boolean;
    retryActions: WorkflowAction[];
  };

  /**
   * Compliance and audit data
   */
  @Column({ name: 'compliance_data', type: 'json', nullable: true })
  complianceData: {
    gdprConsent?: boolean;
    exportControlCheck?: boolean;
    fraudCheck?: {
      score: number;
      status: string;
      provider: string;
    };
    kycRequired?: boolean;
    kycCompleted?: boolean;
  };

  /**
   * Custom workflow data
   */
  @Column({ name: 'custom_data', type: 'json', nullable: true })
  customData: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

/**
 * Order workflow transition log for audit trail
 */
@Entity('order_workflow_transitions')
@Index(['workflow', 'transitionedAt'])
@Index(['fromState', 'toState'])
export class OrderWorkflowTransitionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Associated workflow
   */
  @ManyToOne(() => OrderWorkflowEntity, { nullable: false })
  @JoinColumn({ name: 'workflow_id' })
  workflow: OrderWorkflowEntity;

  /**
   * Transition details
   */
  @Column({
    name: 'from_state',
    type: 'enum',
    enum: OrderState,
  })
  fromState: OrderState;

  @Column({
    name: 'to_state',
    type: 'enum',
    enum: OrderState,
  })
  toState: OrderState;

  @Column({
    name: 'action',
    type: 'enum',
    enum: WorkflowAction,
  })
  action: WorkflowAction;

  @Column({
    name: 'trigger',
    type: 'enum',
    enum: WorkflowTrigger,
  })
  trigger: WorkflowTrigger;

  /**
   * Who or what triggered the transition
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'triggered_by' })
  triggeredBy: User;

  /**
   * System component that triggered (if automatic)
   */
  @Column({ name: 'triggered_by_system', length: 100, nullable: true })
  triggeredBySystem: string;

  /**
   * Transition metadata
   */
  @Column({ name: 'transition_data', type: 'json', nullable: true })
  transitionData: {
    reason?: string;
    notes?: string;
    executionTime?: number; // milliseconds
    success: boolean;
    errorMessage?: string;
    validationResults?: Array<{
      rule: string;
      passed: boolean;
      message?: string;
    }>;
  };

  /**
   * State duration metrics
   */
  @Column({ name: 'state_duration', type: 'int', nullable: true })
  stateDuration: number; // milliseconds in previous state

  @Column({ name: 'transitioned_at', type: 'datetime' })
  @Index()
  transitionedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

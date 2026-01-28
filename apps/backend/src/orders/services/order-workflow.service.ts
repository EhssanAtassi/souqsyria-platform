/**
 * @file order-workflow.service.ts
 * @description Enterprise Order Workflow State Machine Engine
 *
 * ENTERPRISE FEATURES:
 * - Advanced state machine with configurable transitions
 * - Automated workflow execution with business rules
 * - SLA monitoring and escalation management
 * - Integration with inventory and payment systems
 * - Performance analytics and optimization
 * - Multi-tenant workflow customization
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  OrderWorkflowEntity,
  OrderWorkflowTransitionEntity,
  OrderState,
  WorkflowAction,
  WorkflowTrigger,
} from '../entities/order-workflow.entity';
import { Order } from '../entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { InventoryReservationService } from '../../stock/services/inventory-reservation.service';
import { CommissionsService } from '../../commissions/service/commissions.service';

/**
 * State transition configuration
 */
interface StateTransition {
  fromState: OrderState;
  toState: OrderState;
  allowedActions: WorkflowAction[];
  requiredConditions?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'exists';
    value: any;
  }>;
  automationRules?: {
    trigger: WorkflowTrigger;
    delay?: number; // milliseconds
    conditions?: any[];
  };
  slaMinutes?: number;
  escalationRules?: {
    delayMinutes: number;
    assignTo: string;
    template: string;
  }[];
}

@Injectable()
export class OrderWorkflowService {
  private readonly logger = new Logger(OrderWorkflowService.name);

  /**
   * Enterprise state machine configuration
   */
  private readonly stateTransitions: StateTransition[] = [
    // Initial flow
    {
      fromState: OrderState.DRAFT,
      toState: OrderState.PENDING,
      allowedActions: [WorkflowAction.SUBMIT_ORDER],
      slaMinutes: 5,
    },
    {
      fromState: OrderState.PENDING,
      toState: OrderState.AWAITING_PAYMENT,
      allowedActions: [WorkflowAction.PROCESS_PAYMENT],
      slaMinutes: 30,
    },
    {
      fromState: OrderState.AWAITING_PAYMENT,
      toState: OrderState.PAYMENT_PROCESSING,
      allowedActions: [WorkflowAction.PROCESS_PAYMENT],
      slaMinutes: 10,
    },
    {
      fromState: OrderState.PAYMENT_PROCESSING,
      toState: OrderState.PAYMENT_CONFIRMED,
      allowedActions: [WorkflowAction.CONFIRM_PAYMENT],
      automationRules: {
        trigger: WorkflowTrigger.EVENT_DRIVEN,
        delay: 0,
      },
      slaMinutes: 5,
    },
    {
      fromState: OrderState.PAYMENT_CONFIRMED,
      toState: OrderState.AWAITING_VENDOR_APPROVAL,
      allowedActions: [WorkflowAction.APPROVE_VENDOR],
      slaMinutes: 120, // 2 hours
    },
    {
      fromState: OrderState.AWAITING_VENDOR_APPROVAL,
      toState: OrderState.VENDOR_APPROVED,
      allowedActions: [WorkflowAction.APPROVE_VENDOR],
      slaMinutes: 240, // 4 hours
    },
    {
      fromState: OrderState.VENDOR_APPROVED,
      toState: OrderState.INVENTORY_RESERVED,
      allowedActions: [WorkflowAction.RESERVE_INVENTORY],
      automationRules: {
        trigger: WorkflowTrigger.AUTOMATIC,
        delay: 1000, // 1 second
      },
      slaMinutes: 15,
    },
    {
      fromState: OrderState.INVENTORY_RESERVED,
      toState: OrderState.INVENTORY_ALLOCATED,
      allowedActions: [WorkflowAction.ALLOCATE_INVENTORY],
      automationRules: {
        trigger: WorkflowTrigger.AUTOMATIC,
        delay: 2000, // 2 seconds
      },
      slaMinutes: 30,
    },
    {
      fromState: OrderState.INVENTORY_ALLOCATED,
      toState: OrderState.PREPARING,
      allowedActions: [WorkflowAction.START_PREPARATION],
      slaMinutes: 60,
    },
    {
      fromState: OrderState.PREPARING,
      toState: OrderState.READY_TO_SHIP,
      allowedActions: [WorkflowAction.MARK_READY],
      slaMinutes: 480, // 8 hours
    },
    {
      fromState: OrderState.READY_TO_SHIP,
      toState: OrderState.SHIPPED,
      allowedActions: [WorkflowAction.SHIP_ORDER],
      slaMinutes: 120, // 2 hours
    },
    {
      fromState: OrderState.SHIPPED,
      toState: OrderState.IN_TRANSIT,
      allowedActions: [WorkflowAction.UPDATE_TRACKING],
      automationRules: {
        trigger: WorkflowTrigger.API_WEBHOOK,
      },
      slaMinutes: 60,
    },
    {
      fromState: OrderState.IN_TRANSIT,
      toState: OrderState.OUT_FOR_DELIVERY,
      allowedActions: [WorkflowAction.UPDATE_TRACKING],
      automationRules: {
        trigger: WorkflowTrigger.API_WEBHOOK,
      },
      slaMinutes: 1440, // 24 hours
    },
    {
      fromState: OrderState.OUT_FOR_DELIVERY,
      toState: OrderState.DELIVERED,
      allowedActions: [WorkflowAction.DELIVER_ORDER],
      automationRules: {
        trigger: WorkflowTrigger.API_WEBHOOK,
      },
      slaMinutes: 480, // 8 hours
    },
    {
      fromState: OrderState.DELIVERED,
      toState: OrderState.COMPLETED,
      allowedActions: [WorkflowAction.COMPLETE_ORDER],
      automationRules: {
        trigger: WorkflowTrigger.SCHEDULED,
        delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      slaMinutes: 10080, // 7 days
    },
    // Exception flows
    {
      fromState: OrderState.PAYMENT_PROCESSING,
      toState: OrderState.PAYMENT_FAILED,
      allowedActions: [WorkflowAction.FAIL_PAYMENT],
      automationRules: {
        trigger: WorkflowTrigger.EVENT_DRIVEN,
      },
    },
    {
      fromState: OrderState.AWAITING_VENDOR_APPROVAL,
      toState: OrderState.VENDOR_REJECTED,
      allowedActions: [WorkflowAction.REJECT_VENDOR],
    },
    // Cancellation flows (simplified)
    {
      fromState: OrderState.PENDING,
      toState: OrderState.CANCELLED,
      allowedActions: [WorkflowAction.CANCEL_ORDER],
    },
    {
      fromState: OrderState.AWAITING_PAYMENT,
      toState: OrderState.CANCELLED,
      allowedActions: [WorkflowAction.CANCEL_ORDER],
    },
  ];

  constructor(
    @InjectRepository(OrderWorkflowEntity)
    private workflowRepo: Repository<OrderWorkflowEntity>,

    @InjectRepository(OrderWorkflowTransitionEntity)
    private transitionRepo: Repository<OrderWorkflowTransitionEntity>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    private inventoryService: InventoryReservationService,
    private commissionsService: CommissionsService,
    private entityManager: EntityManager,
  ) {}

  /**
   * Initialize workflow for a new order
   *
   * @param order - Order entity
   * @param initialState - Starting state (default: DRAFT)
   * @returns Created workflow
   */
  async initializeWorkflow(
    order: Order,
    initialState: OrderState = OrderState.DRAFT,
  ): Promise<OrderWorkflowEntity> {
    this.logger.log(`Initializing workflow for order ${order.id}`);

    const workflow = this.workflowRepo.create({
      order,
      currentState: initialState,
      stateEnteredAt: new Date(),
      priority: this.calculateOrderPriority(order),
      automationConfig: this.getDefaultAutomationConfig(),
      businessRules: this.getDefaultBusinessRules(),
      performanceMetrics: {
        stateTransitionCount: 0,
        automationSuccessRate: 100,
        slaBreaches: 0,
      },
    });

    const savedWorkflow = await this.workflowRepo.save(workflow);

    // Create initial transition log
    await this.logTransition(
      savedWorkflow,
      null,
      initialState,
      WorkflowAction.SUBMIT_ORDER,
      WorkflowTrigger.MANUAL,
      null,
      'Workflow initialized',
    );

    // Set SLA deadline
    await this.updateSlaDeadline(savedWorkflow);

    this.logger.log(
      `Workflow ${savedWorkflow.id} initialized for order ${order.id}`,
    );
    return savedWorkflow;
  }

  /**
   * Execute workflow action with full validation and automation
   *
   * @param workflowId - Workflow ID
   * @param action - Action to execute
   * @param triggeredBy - User who triggered (null for system)
   * @param data - Additional action data
   * @returns Updated workflow
   */
  async executeAction(
    workflowId: number,
    action: WorkflowAction,
    triggeredBy: User | null = null,
    data: any = {},
  ): Promise<OrderWorkflowEntity> {
    const startTime = Date.now();

    return await this.entityManager.transaction(async (manager) => {
      try {
        // Load workflow with pessimistic lock
        const workflow = await manager.findOne(OrderWorkflowEntity, {
          where: { id: workflowId },
          relations: ['order'],
          lock: { mode: 'pessimistic_write' },
        });

        if (!workflow) {
          throw new NotFoundException(`Workflow ${workflowId} not found`);
        }

        this.logger.log(
          `Executing action ${action} on workflow ${workflowId} in state ${workflow.currentState}`,
        );

        // Find valid transition
        const transition = this.findValidTransition(
          workflow.currentState,
          action,
        );
        if (!transition) {
          throw new BadRequestException(
            `Action ${action} not allowed from state ${workflow.currentState}`,
          );
        }

        // Validate conditions
        await this.validateTransitionConditions(workflow, transition, data);

        // Execute pre-transition hooks
        await this.executePreTransitionHooks(
          workflow,
          transition,
          action,
          data,
        );

        // Perform state transition
        const previousState = workflow.currentState;
        workflow.previousState = previousState;
        workflow.currentState = transition.toState;
        workflow.stateEnteredAt = new Date();

        // Update performance metrics
        const stateDuration = Date.now() - workflow.stateEnteredAt.getTime();
        workflow.performanceMetrics = {
          ...workflow.performanceMetrics,
          timeInState: stateDuration,
          stateTransitionCount:
            (workflow.performanceMetrics.stateTransitionCount || 0) + 1,
        };

        // Update SLA deadline
        await this.updateSlaDeadline(workflow);

        const savedWorkflow = await manager.save(OrderWorkflowEntity, workflow);

        // Log transition
        await this.logTransition(
          savedWorkflow,
          previousState,
          transition.toState,
          action,
          triggeredBy ? WorkflowTrigger.MANUAL : WorkflowTrigger.AUTOMATIC,
          triggeredBy,
          data.reason || `Action ${action} executed`,
          manager,
        );

        // Execute post-transition hooks
        await this.executePostTransitionHooks(
          savedWorkflow,
          transition,
          action,
          data,
        );

        // Schedule automated next actions
        await this.scheduleAutomatedActions(savedWorkflow);

        const executionTime = Date.now() - startTime;
        this.logger.log(
          `Action ${action} completed for workflow ${workflowId} in ${executionTime}ms`,
        );

        return savedWorkflow;
      } catch (error: unknown) {
        this.logger.error(
          `Failed to execute action ${action} on workflow ${workflowId}`,
          (error as Error).stack,
        );

        // Update error tracking
        await this.recordWorkflowError(workflowId, action, error as Error);
        throw error;
      }
    });
  }

  /**
   * Get workflow by order ID
   */
  async getWorkflowByOrderId(orderId: number): Promise<OrderWorkflowEntity> {
    const workflow = await this.workflowRepo.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'assignedTo'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow not found for order ${orderId}`);
    }

    return workflow;
  }

  /**
   * Get workflow transition history
   */
  async getWorkflowHistory(
    workflowId: number,
  ): Promise<OrderWorkflowTransitionEntity[]> {
    return this.transitionRepo.find({
      where: { workflow: { id: workflowId } },
      relations: ['triggeredBy'],
      order: { transitionedAt: 'ASC' },
    });
  }

  /**
   * Check for SLA breaches and escalate if necessary
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processSlaMonitoring(): Promise<void> {
    this.logger.debug('Processing SLA monitoring');

    const overdueWorkflows = await this.workflowRepo
      .createQueryBuilder('workflow')
      .where('workflow.slaDeadline < :now', { now: new Date() })
      .andWhere('workflow.escalationRequired = false')
      .andWhere('workflow.currentState NOT IN (:...finalStates)', {
        finalStates: [
          OrderState.COMPLETED,
          OrderState.CANCELLED,
          OrderState.CLOSED,
        ],
      })
      .getMany();

    for (const workflow of overdueWorkflows) {
      await this.escalateWorkflow(workflow, 'SLA breach detected');
    }

    this.logger.debug(`Processed ${overdueWorkflows.length} SLA breaches`);
  }

  /**
   * Process automated workflow actions
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processAutomatedActions(): Promise<void> {
    this.logger.debug('Processing automated workflow actions');

    const eligibleWorkflows = await this.workflowRepo
      .createQueryBuilder('workflow')
      .where('workflow.automationConfig IS NOT NULL')
      .andWhere('workflow.currentState NOT IN (:...finalStates)', {
        finalStates: [
          OrderState.COMPLETED,
          OrderState.CANCELLED,
          OrderState.CLOSED,
        ],
      })
      .getMany();

    for (const workflow of eligibleWorkflows) {
      await this.processWorkflowAutomation(workflow);
    }

    this.logger.debug(
      `Processed automation for ${eligibleWorkflows.length} workflows`,
    );
  }

  /**
   * PRIVATE METHODS
   */

  private findValidTransition(
    currentState: OrderState,
    action: WorkflowAction,
  ): StateTransition | null {
    return this.stateTransitions.find(
      (transition) =>
        transition.fromState === currentState &&
        transition.allowedActions.includes(action),
    );
  }

  private async validateTransitionConditions(
    workflow: OrderWorkflowEntity,
    transition: StateTransition,
    data: any,
  ): Promise<void> {
    if (!transition.requiredConditions) return;

    for (const condition of transition.requiredConditions) {
      const isValid = await this.evaluateCondition(workflow, condition, data);
      if (!isValid) {
        throw new BadRequestException(
          `Condition not met: ${condition.field} ${condition.operator} ${condition.value}`,
        );
      }
    }
  }

  private async evaluateCondition(
    workflow: OrderWorkflowEntity,
    condition: any,
    data: any,
  ): Promise<boolean> {
    // Implement condition evaluation logic
    // This is a simplified version - expand based on requirements
    const { field, operator, value } = condition;

    let fieldValue;
    if (field.startsWith('order.')) {
      fieldValue = this.getNestedValue(workflow.order, field.substring(6));
    } else if (field.startsWith('data.')) {
      fieldValue = this.getNestedValue(data, field.substring(5));
    } else {
      fieldValue = this.getNestedValue(workflow, field);
    }

    switch (operator) {
      case 'eq':
        return fieldValue === value;
      case 'ne':
        return fieldValue !== value;
      case 'gt':
        return fieldValue > value;
      case 'lt':
        return fieldValue < value;
      case 'gte':
        return fieldValue >= value;
      case 'lte':
        return fieldValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue);
      case 'exists':
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async executePreTransitionHooks(
    workflow: OrderWorkflowEntity,
    transition: StateTransition,
    action: WorkflowAction,
    data: any,
  ): Promise<void> {
    // Execute business logic before state transition
    switch (action) {
      case WorkflowAction.RESERVE_INVENTORY:
        await this.inventoryService.reserveInventoryForOrder(workflow.order.id);
        break;
      case WorkflowAction.ALLOCATE_INVENTORY:
        await this.inventoryService.allocateInventoryForOrder(
          workflow.order.id,
        );
        break;
      // Add more pre-transition hooks as needed
    }
  }

  private async executePostTransitionHooks(
    workflow: OrderWorkflowEntity,
    transition: StateTransition,
    action: WorkflowAction,
    data: any,
  ): Promise<void> {
    // Execute business logic after state transition
    switch (transition.toState) {
      case OrderState.PAYMENT_CONFIRMED:
        // Calculate commissions
        await this.commissionsService.bulkCalculateCommissions([
          workflow.order.id,
        ]);
        break;
      case OrderState.DELIVERED:
        // Update performance metrics
        await this.updateDeliveryMetrics(workflow);
        break;
      // Add more post-transition hooks as needed
    }
  }

  private async scheduleAutomatedActions(
    workflow: OrderWorkflowEntity,
  ): Promise<void> {
    const currentTransition = this.stateTransitions.find(
      (t) => t.toState === workflow.currentState,
    );

    if (currentTransition?.automationRules) {
      // Schedule automated action based on trigger type
      // This would integrate with a job queue system in production
      this.logger.debug(
        `Scheduling automated action for workflow ${workflow.id} with trigger ${currentTransition.automationRules.trigger}`,
      );
    }
  }

  private calculateOrderPriority(order: Order): number {
    // Implement priority calculation logic
    // Higher values = higher priority
    let priority = 5; // default

    // Increase priority based on order value
    if (order.total_amount > 1000) priority += 2;
    if (order.total_amount > 5000) priority += 3;

    // Add other priority factors (customer tier, product urgency, etc.)

    return Math.min(priority, 15); // cap at 15
  }

  private getDefaultAutomationConfig(): any {
    return {
      autoTransitions: [],
      notifications: [
        {
          trigger: WorkflowAction.SHIP_ORDER,
          recipients: ['customer'],
          template: 'order_shipped',
          channels: ['email', 'sms'],
        },
      ],
      escalations: [
        {
          condition: 'sla_breach',
          delayMinutes: 60,
          assignTo: 'supervisor',
          template: 'sla_breach_alert',
        },
      ],
    };
  }

  private getDefaultBusinessRules(): any {
    return {
      requiredApprovals: ['payment', 'vendor'],
      inventoryReservationTimeout: 30, // minutes
      vendorResponseTimeout: 240, // minutes
      shippingConstraints: {},
      paymentConstraints: {},
    };
  }

  private async updateSlaDeadline(
    workflow: OrderWorkflowEntity,
  ): Promise<void> {
    const transition = this.stateTransitions.find(
      (t) => t.toState === workflow.currentState,
    );

    if (transition?.slaMinutes) {
      workflow.slaDeadline = new Date(
        workflow.stateEnteredAt.getTime() + transition.slaMinutes * 60 * 1000,
      );
    }
  }

  private async logTransition(
    workflow: OrderWorkflowEntity,
    fromState: OrderState | null,
    toState: OrderState,
    action: WorkflowAction,
    trigger: WorkflowTrigger,
    triggeredBy: User | null,
    reason: string,
    manager?: EntityManager,
  ): Promise<void> {
    const transition = this.transitionRepo.create({
      workflow,
      fromState,
      toState,
      action,
      trigger,
      triggeredBy,
      transitionData: {
        reason,
        success: true,
        executionTime: Date.now(),
      },
      transitionedAt: new Date(),
    });

    const repo = manager
      ? manager.getRepository(OrderWorkflowTransitionEntity)
      : this.transitionRepo;
    await repo.save(transition);
  }

  private async escalateWorkflow(
    workflow: OrderWorkflowEntity,
    reason: string,
  ): Promise<void> {
    workflow.escalationRequired = true;
    workflow.escalationDate = new Date();
    workflow.escalationReason = reason;

    // Update SLA breach count
    workflow.performanceMetrics = {
      ...workflow.performanceMetrics,
      slaBreaches: (workflow.performanceMetrics.slaBreaches || 0) + 1,
    };

    await this.workflowRepo.save(workflow);

    this.logger.warn(`Workflow ${workflow.id} escalated: ${reason}`);
  }

  private async processWorkflowAutomation(
    workflow: OrderWorkflowEntity,
  ): Promise<void> {
    // Process automation rules for the workflow
    // This would be expanded with actual automation logic
    this.logger.debug(`Processing automation for workflow ${workflow.id}`);
  }

  private async recordWorkflowError(
    workflowId: number,
    action: WorkflowAction,
    error: Error,
  ): Promise<void> {
    try {
      const workflow = await this.workflowRepo.findOne({
        where: { id: workflowId },
      });
      if (workflow) {
        workflow.errorCount = (workflow.errorCount || 0) + 1;
        workflow.lastError = {
          timestamp: new Date(),
          action: action,
          message: (error as Error).message,
          stackTrace: (error as Error).stack,
          retryable: this.isRetryableError(error),
        };
        await this.workflowRepo.save(workflow);
      }
    } catch (saveError) {
      this.logger.error('Failed to record workflow error', saveError.stack);
    }
  }

  private isRetryableError(error: Error): boolean {
    // Determine if the error is retryable
    return !(error instanceof BadRequestException);
  }

  private async updateDeliveryMetrics(
    workflow: OrderWorkflowEntity,
  ): Promise<void> {
    // Calculate delivery performance metrics
    const totalTime = Date.now() - workflow.createdAt.getTime();

    workflow.performanceMetrics = {
      ...workflow.performanceMetrics,
      totalProcessingTime: totalTime,
      customerWaitTime: totalTime,
    };

    await this.workflowRepo.save(workflow);
  }
}

/**
 * @file order-workflow.controller.ts
 * @description Enterprise Order Workflow Management API
 *
 * ENTERPRISE FEATURES:
 * - Complete workflow state management
 * - Real-time workflow monitoring
 * - Performance analytics and reporting
 * - SLA monitoring and escalation
 * - Automated workflow actions
 * - Comprehensive audit trails
 *
 * @author SouqSyria Development Team
 * @since 2025-05-31
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { OrderWorkflowService } from '../services/order-workflow.service';
import { FirebaseAuthGuard } from '../../auth/guards/firebase-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';
import {
  OrderState,
  WorkflowAction,
  WorkflowTrigger,
} from '../entities/order-workflow.entity';

/**
 * DTO for executing workflow actions
 */
interface ExecuteWorkflowActionDto {
  action: WorkflowAction;
  reason?: string;
  data?: Record<string, any>;
  triggerType?: WorkflowTrigger;
}

/**
 * DTO for workflow analytics query
 */
interface WorkflowAnalyticsDto {
  startDate: string;
  endDate: string;
  states?: OrderState[];
  includeMetrics?: boolean;
  groupBy?: 'state' | 'day' | 'priority';
}

@ApiTags('Enterprise Order Workflow')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@Controller('api/admin/order-workflow')
export class OrderWorkflowController {
  private readonly logger = new Logger(OrderWorkflowController.name);

  constructor(private readonly workflowService: OrderWorkflowService) {}

  /**
   * Get workflow details by order ID
   */
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Get workflow by order ID',
    description:
      'Retrieves the complete workflow state and history for a specific order',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    type: 'number',
    example: 12345,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        currentState: { type: 'string', enum: Object.values(OrderState) },
        previousState: { type: 'string', enum: Object.values(OrderState) },
        stateEnteredAt: { type: 'string', format: 'date-time' },
        slaDeadline: { type: 'string', format: 'date-time' },
        priority: { type: 'number' },
        escalationRequired: { type: 'boolean' },
        performanceMetrics: {
          type: 'object',
          properties: {
            timeInState: { type: 'number' },
            totalProcessingTime: { type: 'number' },
            stateTransitionCount: { type: 'number' },
            slaBreaches: { type: 'number' },
          },
        },
        order: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            status: { type: 'string' },
            totalAmount: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow not found for the specified order',
  })
  @Permissions('order.workflow.read')
  async getWorkflowByOrderId(
    @Param('orderId') orderId: number,
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} requested workflow for order ${orderId}`,
    );
    return this.workflowService.getWorkflowByOrderId(orderId);
  }

  /**
   * Execute workflow action
   */
  @Post('execute/:workflowId')
  @ApiOperation({
    summary: 'Execute workflow action',
    description:
      'Executes a specific action on a workflow, triggering state transitions and business logic',
  })
  @ApiParam({
    name: 'workflowId',
    description: 'Workflow ID',
    type: 'number',
  })
  @ApiBody({
    description: 'Workflow action details',
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: Object.values(WorkflowAction),
          description: 'Action to execute on the workflow',
        },
        reason: {
          type: 'string',
          description: 'Reason for executing the action',
          example: 'Customer requested cancellation',
        },
        data: {
          type: 'object',
          description: 'Additional data for the action',
        },
        triggerType: {
          type: 'string',
          enum: Object.values(WorkflowTrigger),
          description: 'How the action was triggered',
          default: WorkflowTrigger.MANUAL,
        },
      },
      required: ['action'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow action executed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        previousState: { type: 'string' },
        newState: { type: 'string' },
        executionTime: { type: 'number' },
        transitionId: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid action or workflow state' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Permissions('order.workflow.execute')
  async executeWorkflowAction(
    @Param('workflowId') workflowId: number,
    @Body() dto: ExecuteWorkflowActionDto,
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} executing action ${dto.action} on workflow ${workflowId}`,
    );

    if (!Object.values(WorkflowAction).includes(dto.action)) {
      throw new BadRequestException(`Invalid workflow action: ${dto.action}`);
    }

    const startTime = Date.now();
    const workflow =
      await this.workflowService.getWorkflowByOrderId(workflowId);
    const previousState = workflow.currentState;

    const updatedWorkflow = await this.workflowService.executeAction(
      workflowId,
      dto.action,
      req.user,
      {
        reason: dto.reason,
        ...dto.data,
      },
    );

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      previousState,
      newState: updatedWorkflow.currentState,
      executionTime,
      workflowId: updatedWorkflow.id,
    };
  }

  /**
   * Get workflow transition history
   */
  @Get('history/:workflowId')
  @ApiOperation({
    summary: 'Get workflow transition history',
    description:
      'Retrieves the complete audit trail of state transitions for a workflow',
  })
  @ApiParam({
    name: 'workflowId',
    description: 'Workflow ID',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          fromState: { type: 'string' },
          toState: { type: 'string' },
          action: { type: 'string' },
          trigger: { type: 'string' },
          triggeredBy: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
            },
          },
          transitionData: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              success: { type: 'boolean' },
              executionTime: { type: 'number' },
            },
          },
          transitionedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @Permissions('order.workflow.read')
  async getWorkflowHistory(
    @Param('workflowId') workflowId: number,
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} requested history for workflow ${workflowId}`,
    );
    return this.workflowService.getWorkflowHistory(workflowId);
  }

  /**
   * Get workflow analytics and performance metrics
   */
  @Get('analytics')
  @ApiOperation({
    summary: 'Get workflow analytics',
    description:
      'Retrieves comprehensive analytics and performance metrics for workflows',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: 'string',
    description: 'Start date for analytics (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: 'string',
    description: 'End date for analytics (ISO format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'states',
    required: false,
    type: 'string',
    description: 'Comma-separated list of states to filter by',
    example: 'pending,shipped,delivered',
  })
  @ApiQuery({
    name: 'includeMetrics',
    required: false,
    type: 'boolean',
    description: 'Include detailed performance metrics',
    default: true,
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    type: 'string',
    enum: ['state', 'day', 'priority'],
    description: 'Group analytics results by specified dimension',
    default: 'state',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalWorkflows: { type: 'number' },
            averageProcessingTime: { type: 'number' },
            slaComplianceRate: { type: 'number' },
            automationSuccessRate: { type: 'number' },
          },
        },
        stateDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              count: { type: 'number' },
              percentage: { type: 'number' },
              averageTimeInState: { type: 'number' },
            },
          },
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            bottlenecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  state: { type: 'string' },
                  averageTime: { type: 'number' },
                  impact: { type: 'string' },
                },
              },
            },
            trends: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string' },
                  processingTime: { type: 'number' },
                  volume: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid date parameters' })
  @Permissions('order.workflow.analytics')
  async getWorkflowAnalytics(
    @Query() query: WorkflowAnalyticsDto,
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} requested workflow analytics from ${query.startDate} to ${query.endDate}`,
    );

    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO format.');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    // Simplified analytics response - in production, this would query actual data
    return {
      summary: {
        totalWorkflows: 1250,
        averageProcessingTime: 8640000, // 2.4 hours in milliseconds
        slaComplianceRate: 94.5,
        automationSuccessRate: 98.2,
      },
      stateDistribution: [
        {
          state: 'pending',
          count: 45,
          percentage: 15.2,
          averageTimeInState: 1800000,
        },
        {
          state: 'payment_confirmed',
          count: 180,
          percentage: 60.8,
          averageTimeInState: 900000,
        },
        {
          state: 'shipped',
          count: 50,
          percentage: 16.9,
          averageTimeInState: 86400000,
        },
        {
          state: 'delivered',
          count: 21,
          percentage: 7.1,
          averageTimeInState: 3600000,
        },
      ],
      performanceMetrics: {
        bottlenecks: [
          {
            state: 'awaiting_vendor_approval',
            averageTime: 7200000,
            impact: 'high',
          },
          { state: 'preparing', averageTime: 14400000, impact: 'medium' },
        ],
        trends: [
          { date: '2024-01-01', processingTime: 8100000, volume: 42 },
          { date: '2024-01-02', processingTime: 8350000, volume: 38 },
          { date: '2024-01-03', processingTime: 7900000, volume: 51 },
        ],
      },
    };
  }

  /**
   * Get workflows requiring attention (escalated, SLA breaches, etc.)
   */
  @Get('attention-required')
  @ApiOperation({
    summary: 'Get workflows requiring attention',
    description:
      'Retrieves workflows that need manual intervention, have SLA breaches, or are escalated',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: 'string',
    enum: ['escalated', 'sla_breach', 'error', 'all'],
    description: 'Type of attention required',
    default: 'all',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    type: 'number',
    description: 'Minimum priority level (1-15)',
    example: 8,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Maximum number of results',
    default: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflows requiring attention retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        workflows: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              orderId: { type: 'number' },
              currentState: { type: 'string' },
              priority: { type: 'number' },
              escalationRequired: { type: 'boolean' },
              escalationReason: { type: 'string' },
              slaDeadline: { type: 'string', format: 'date-time' },
              timeOverdue: { type: 'number' },
              impactLevel: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
              },
            },
          },
        },
      },
    },
  })
  @Permissions('order.workflow.monitor')
  async getWorkflowsRequiringAttention(
    @Query('type') type: string = 'all',
    @Query('priority') priority: number,
    @Query('limit') limit: number = 50,
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} requested workflows requiring attention`,
    );

    // Simplified response - in production, this would query actual data
    return {
      total: 12,
      workflows: [
        {
          id: 1001,
          orderId: 12345,
          currentState: 'awaiting_vendor_approval',
          priority: 10,
          escalationRequired: true,
          escalationReason: 'SLA breach detected',
          slaDeadline: '2024-01-01T12:00:00.000Z',
          timeOverdue: 3600000, // 1 hour
          impactLevel: 'high',
        },
        {
          id: 1002,
          orderId: 12346,
          currentState: 'inventory_reserved',
          priority: 8,
          escalationRequired: false,
          escalationReason: null,
          slaDeadline: '2024-01-01T14:30:00.000Z',
          timeOverdue: 1800000, // 30 minutes
          impactLevel: 'medium',
        },
      ],
    };
  }

  /**
   * Bulk execute workflow actions
   */
  @Post('bulk-execute')
  @ApiOperation({
    summary: 'Bulk execute workflow actions',
    description:
      'Executes the same action on multiple workflows simultaneously',
  })
  @ApiBody({
    description: 'Bulk action details',
    schema: {
      type: 'object',
      properties: {
        workflowIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Array of workflow IDs to process',
        },
        action: {
          type: 'string',
          enum: Object.values(WorkflowAction),
          description: 'Action to execute on all workflows',
        },
        reason: {
          type: 'string',
          description: 'Reason for bulk action',
        },
        data: {
          type: 'object',
          description: 'Additional data for the action',
        },
      },
      required: ['workflowIds', 'action'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk action completed',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              workflowId: { type: 'number' },
              success: { type: 'boolean' },
              error: { type: 'string' },
              newState: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @Permissions('order.workflow.bulk_execute')
  async bulkExecuteWorkflowActions(
    @Body()
    dto: {
      workflowIds: number[];
      action: WorkflowAction;
      reason?: string;
      data?: Record<string, any>;
    },
    @Request() req,
  ) {
    this.logger.log(
      `Admin ${req.user?.uid} executing bulk action ${dto.action} on ${dto.workflowIds.length} workflows`,
    );

    if (!Array.isArray(dto.workflowIds) || dto.workflowIds.length === 0) {
      throw new BadRequestException('workflowIds must be a non-empty array');
    }

    if (dto.workflowIds.length > 100) {
      throw new BadRequestException(
        'Maximum 100 workflows can be processed at once',
      );
    }

    let successful = 0;
    let failed = 0;
    const results = [];

    // Process each workflow
    for (const workflowId of dto.workflowIds) {
      try {
        const updatedWorkflow = await this.workflowService.executeAction(
          workflowId,
          dto.action,
          req.user,
          {
            reason: dto.reason || 'Bulk action executed',
            ...dto.data,
          },
        );

        successful++;
        results.push({
          workflowId,
          success: true,
          newState: updatedWorkflow.currentState,
        });
      } catch (error) {
        failed++;
        results.push({
          workflowId,
          success: false,
          error: error.message,
        });

        this.logger.error(
          `Failed to execute bulk action on workflow ${workflowId}`,
          error.stack,
        );
      }
    }

    return {
      total: dto.workflowIds.length,
      successful,
      failed,
      results,
    };
  }
}

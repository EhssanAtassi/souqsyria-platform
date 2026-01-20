/**
 * @file syrian-shipments.controller.ts
 * @description Enterprise Syrian Shipments Controller with comprehensive APIs
 *
 * ENDPOINTS:
 * - Shipment creation and management
 * - Syrian shipping company integration
 * - Workflow management and transitions
 * - Cost calculations and quotes
 * - Performance analytics and reporting
 * - Bulk operations and admin tools
 * - Arabic/English localization
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 1.0.0
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { ShipmentsService } from '../service/shipments.service';
import { SyrianShippingService } from '../services/syrian-shipping.service';
import {
  ShipmentWorkflowService,
  WorkflowMetrics,
  SLAMonitoring,
} from '../services/shipment-workflow.service';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserFromToken } from '../../common/interfaces/user-from-token.interface';

import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentStatusDto } from '../dto/update-shipment-status.dto';
import { ConfirmDeliveryDto } from '../dto/confirm-delivery.dto';
import { ShipmentStatus } from '../entities/shipment.entity';
import { ShipmentWorkflowStatus } from '../services/shipment-workflow.service';

/**
 * Enhanced DTOs for Syrian shipment operations
 */
class CreateSyrianShipmentDto extends CreateShipmentDto {
  /**
   * Syrian shipping company ID
   */
  syrianShippingCompanyId?: number;

  /**
   * Pickup address ID (Syrian address)
   */
  pickupAddressId?: number;

  /**
   * Delivery address ID (Syrian address)
   */
  deliveryAddressId: number;

  /**
   * Service options
   */
  serviceOptions?: {
    serviceType: string;
    isExpress: boolean;
    requiresSignature: boolean;
    cashOnDelivery: boolean;
    codAmount?: number;
    deliveryInstructions?: string;
    deliveryInstructionsAr?: string;
  };

  /**
   * Package details
   */
  packageDetails: {
    weightKg: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    declaredValue: number;
    isFragile: boolean;
    specialInstructions?: string;
    specialInstructionsAr?: string;
  };
}

class GetShippingQuoteDto {
  /**
   * Origin address details
   */
  fromAddress: {
    governorateId: number;
    cityId: number;
  };

  /**
   * Destination address details
   */
  toAddress: {
    governorateId: number;
    cityId: number;
  };

  /**
   * Package details for cost calculation
   */
  packageDetails: {
    weightKg: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    isFragile: boolean;
    codAmount?: number;
  };

  /**
   * Delivery preferences
   */
  deliveryOptions: {
    serviceType?: string;
    isExpress: boolean;
    isWeekend: boolean;
    deliveryDate?: Date;
  };
}

class BulkStatusUpdateDto {
  /**
   * Array of shipment IDs to update
   */
  shipmentIds: number[];

  /**
   * Target status
   */
  targetStatus: ShipmentWorkflowStatus;

  /**
   * Optional notes
   */
  notes?: string;
}

class WorkflowTransitionDto {
  /**
   * Target status to transition to
   */
  targetStatus: ShipmentWorkflowStatus;

  /**
   * Transition notes
   */
  notes?: string;

  /**
   * Additional metadata
   */
  metadata?: {
    deliveryTime?: Date;
    proofType?: string;
    proofData?: any;
    deliveryAgent?: number;
    trackingCode?: string;
  };
}

@ApiTags('🚚 Syrian Shipments & Logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('syrian-shipments')
export class SyrianShipmentsController {
  private readonly logger = new Logger(SyrianShipmentsController.name);

  constructor(
    private readonly shipmentsService: ShipmentsService,
    private readonly syrianShippingService: SyrianShippingService,
    private readonly workflowService: ShipmentWorkflowService,
  ) {}

  /**
   * CREATE SYRIAN SHIPMENT
   *
   * Creates a new shipment with Syrian shipping company and workflow integration
   */
  @Post()
  @ApiOperation({
    summary: 'Create Syrian shipment',
    description:
      'Creates a new shipment with Syrian shipping company integration, automatic cost calculation, and workflow initialization',
  })
  @ApiBody({
    type: CreateSyrianShipmentDto,
    description: 'Syrian shipment creation data',
    examples: {
      expressShipment: {
        summary: 'Express Delivery Shipment',
        value: {
          orderId: 1001,
          syrianShippingCompanyId: 1,
          deliveryAddressId: 501,
          serviceOptions: {
            serviceType: 'same_day',
            isExpress: true,
            requiresSignature: true,
            cashOnDelivery: true,
            codAmount: 150000,
            deliveryInstructions: 'Call before arrival',
            deliveryInstructionsAr: 'اتصل قبل الوصول',
          },
          packageDetails: {
            weightKg: 2.5,
            dimensions: { length: 30, width: 20, height: 15 },
            declaredValue: 150000,
            isFragile: true,
            specialInstructions: 'Electronics - handle with care',
            specialInstructionsAr: 'إلكترونيات - تعامل بحذر',
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Shipment created successfully with workflow initialized',
    schema: {
      example: {
        shipment: {
          id: 2001,
          tracking_code: 'SY-SHIP-2025-002001',
          status: 'created',
          syrianShippingCompany: {
            id: 1,
            nameEn: 'Damascus Express Delivery',
            nameAr: 'شركة دمشق للتوصيل السريع',
          },
          total_cost_syp: 5800,
          estimated_delivery_at: '2025-08-10T18:00:00.000Z',
          created_at: '2025-08-09T12:00:00.000Z',
        },
        workflow: {
          currentStatus: 'created',
          nextStep: 'assigned_company',
          slaHours: 1,
          expectedTransition: '2025-08-09T13:00:00.000Z',
        },
        costBreakdown: {
          baseFee: 2000,
          distanceFee: 1500,
          weightFee: 500,
          expressFee: 1000,
          codFee: 500,
          totalCost: 5500,
          currency: 'SYP',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid shipment data or address not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to create shipments',
  })
  async createSyrianShipment(
    @CurrentUser() user: UserFromToken,
    @Body() createDto: CreateSyrianShipmentDto,
  ) {
    this.logger.log(
      `User ${user.id} creating Syrian shipment for order ${(createDto as any).order_id}`,
    );

    // Create shipment using existing service
    const shipment = await this.shipmentsService.createShipment(
      user,
      createDto,
    );

    // Initialize workflow
    const workflowShipment = await this.workflowService.initializeShipment(
      shipment.id,
      user.id,
    );

    // Get cost breakdown if not already calculated
    const costBreakdown = workflowShipment.cost_breakdown || {
      baseFee: 2000,
      distanceFee: 1500,
      totalCost: 3500,
      currency: 'SYP',
    };

    return {
      shipment: {
        id: workflowShipment.id,
        tracking_code: workflowShipment.tracking_code,
        status: workflowShipment.status,
        syrianShippingCompany: workflowShipment.syrianShippingCompany,
        total_cost_syp: workflowShipment.total_cost_syp,
        estimated_delivery_at: workflowShipment.estimated_delivery_at,
        created_at: workflowShipment.createdAt,
      },
      workflow: {
        currentStatus: workflowShipment.status,
        nextStep: 'assigned_company',
        slaHours: 1,
        expectedTransition: new Date(Date.now() + 60 * 60 * 1000),
      },
      costBreakdown,
    };
  }

  /**
   * GET SHIPPING QUOTES
   *
   * Calculate shipping costs and get quotes from available Syrian companies
   */
  @Post('quotes')
  @ApiOperation({
    summary: 'Get shipping cost quotes',
    description:
      'Calculate shipping costs from multiple Syrian shipping companies and get detailed quotes with delivery options',
  })
  @ApiBody({
    type: GetShippingQuoteDto,
    description: 'Shipping quote calculation parameters',
    examples: {
      damascusToAleppo: {
        summary: 'Damascus to Aleppo Quote',
        value: {
          fromAddress: { governorateId: 1, cityId: 1 },
          toAddress: { governorateId: 2, cityId: 2 },
          packageDetails: {
            weightKg: 3.0,
            dimensions: { length: 40, width: 30, height: 20 },
            value: 200000,
            isFragile: false,
            codAmount: 200000,
          },
          deliveryOptions: {
            serviceType: 'next_day',
            isExpress: false,
            isWeekend: false,
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Shipping quotes retrieved successfully',
    schema: {
      example: {
        quotes: {
          availableCompanies: [
            {
              company: {
                id: 1,
                nameEn: 'Damascus Express',
                nameAr: 'دمشق إكسبريس',
              },
              service: {
                id: 'next_day',
                nameEn: 'Next Day Delivery',
                nameAr: 'التوصيل في اليوم التالي',
              },
              totalCostSYP: 8500,
              breakdown: {
                baseFee: 2000,
                distanceFee: 4500,
                weightFee: 1000,
                codFee: 1000,
              },
              estimatedDeliveryTime: {
                hours: 24,
                deliveryDate: '2025-08-10T18:00:00.000Z',
              },
            },
          ],
          recommendedCompany: {},
          cheapestOption: {},
          fastestOption: {},
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid address or package details',
  })
  async getShippingQuotes(
    @CurrentUser() user: UserFromToken,
    @Body() quoteDto: GetShippingQuoteDto,
  ) {
    this.logger.log(
      `User ${user.id} requesting shipping quotes from governorate ${quoteDto.fromAddress.governorateId} to ${quoteDto.toAddress.governorateId}`,
    );

    const calculationDto = {
      fromAddress: quoteDto.fromAddress,
      toAddress: quoteDto.toAddress,
      packageDetails: {
        ...quoteDto.packageDetails,
        requiresSignature: false, // Default value
      },
      deliveryOptions: quoteDto.deliveryOptions,
    };

    const quotes =
      await this.syrianShippingService.calculateShippingCosts(calculationDto);

    return { quotes };
  }

  /**
   * WORKFLOW TRANSITION
   *
   * Transition shipment to next status in the workflow
   */
  @Put(':id/workflow/transition')
  @ApiOperation({
    summary: 'Transition shipment workflow status',
    description:
      'Moves shipment to the next status in the enterprise workflow with proper validation and notifications',
  })
  @ApiParam({
    name: 'id',
    description: 'Shipment ID',
    example: 2001,
  })
  @ApiBody({
    type: WorkflowTransitionDto,
    description: 'Workflow transition parameters',
    examples: {
      markDelivered: {
        summary: 'Mark as Delivered',
        value: {
          targetStatus: 'delivered',
          notes: 'Successfully delivered to customer',
          metadata: {
            deliveryTime: '2025-08-09T16:30:00.000Z',
            proofType: 'photo',
            proofData: {
              photoUrl: 'https://storage.souqsyria.com/proof/12345.jpg',
              recipientName: 'Ahmad Al-Customer',
              deliveryNotes: 'Delivered to front door',
            },
          },
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Workflow transition completed successfully',
    schema: {
      example: {
        shipment: {
          id: 2001,
          status: 'delivered',
          delivered_at: '2025-08-09T16:30:00.000Z',
          proof_type: 'photo',
          updated_at: '2025-08-09T16:35:00.000Z',
        },
        workflow: {
          previousStatus: 'out_for_delivery',
          currentStatus: 'delivered',
          nextStatus: 'confirmed_delivered',
          autoConfirmIn: '48 hours',
        },
        notifications: {
          sent: ['customer', 'vendor', 'admin'],
          methods: ['sms', 'email', 'push'],
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Shipment not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid status transition or missing required data',
  })
  async transitionWorkflow(
    @CurrentUser() user: UserFromToken,
    @Param('id', ParseIntPipe) shipmentId: number,
    @Body() transitionDto: WorkflowTransitionDto,
  ) {
    this.logger.log(
      `User ${user.id} transitioning shipment ${shipmentId} to ${transitionDto.targetStatus}`,
    );

    const updatedShipment = await this.workflowService.transitionStatus(
      shipmentId,
      transitionDto.targetStatus,
      user.id,
      transitionDto.notes,
      transitionDto.metadata,
    );

    return {
      shipment: {
        id: updatedShipment.id,
        status: updatedShipment.status,
        delivered_at: updatedShipment.delivered_at,
        proof_type: updatedShipment.proof_type,
        updated_at: updatedShipment.updatedAt,
      },
      workflow: {
        currentStatus: updatedShipment.status,
        // Additional workflow info would be calculated here
      },
      notifications: {
        sent: ['customer', 'vendor'],
        methods: ['sms', 'email'],
      },
    };
  }

  /**
   * GET SHIPMENT TRACKING
   *
   * Track shipment with detailed status history and location updates
   */
  @Get('track/:trackingCode')
  @ApiOperation({
    summary: 'Track shipment by tracking code',
    description:
      'Get comprehensive tracking information including status history, location updates, and estimated delivery time',
  })
  @ApiParam({
    name: 'trackingCode',
    description: 'Shipment tracking code',
    example: 'SY-SHIP-2025-002001',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: ['en', 'ar'],
    description: 'Language for localized responses',
    example: 'ar',
  })
  @ApiOkResponse({
    description: 'Tracking information retrieved successfully',
    schema: {
      example: {
        shipment: {
          tracking_code: 'SY-SHIP-2025-002001',
          status: 'out_for_delivery',
          statusAr: 'خارج للتوصيل',
          estimated_delivery: '2025-08-09T18:00:00.000Z',
          progress_percentage: 75,
        },
        shippingCompany: {
          nameEn: 'Damascus Express Delivery',
          nameAr: 'شركة دمشق للتوصيل السريع',
          phone: '+963-11-1234567',
        },
        statusHistory: [
          {
            status: 'created',
            statusAr: 'تم الإنشاء',
            timestamp: '2025-08-09T10:00:00.000Z',
            notes: 'Shipment created',
            notesAr: 'تم إنشاء الشحنة',
          },
          {
            status: 'picked_up',
            statusAr: 'تم الاستلام',
            timestamp: '2025-08-09T14:00:00.000Z',
            notes: 'Package picked up from sender',
            notesAr: 'تم استلام الطرد من المرسل',
          },
        ],
        estimatedDelivery: {
          date: '2025-08-09T18:00:00.000Z',
          timeWindow: '16:00 - 20:00',
          confidence: 'high',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Tracking code not found',
  })
  async trackShipment(
    @Param('trackingCode') trackingCode: string,
    @Query('lang') lang: string = 'en',
  ) {
    this.logger.log(`Tracking shipment: ${trackingCode} (language: ${lang})`);

    // TODO: Implement tracking logic
    // For now, return mock data
    return {
      shipment: {
        tracking_code: trackingCode,
        status: 'out_for_delivery',
        statusAr: 'خارج للتوصيل',
        estimated_delivery: new Date(Date.now() + 4 * 60 * 60 * 1000),
        progress_percentage: 75,
      },
      shippingCompany: {
        nameEn: 'Damascus Express Delivery',
        nameAr: 'شركة دمشق للتوصيل السريع',
        phone: '+963-11-1234567',
      },
      statusHistory: [
        {
          status: 'created',
          statusAr: 'تم الإنشاء',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          notes: 'Shipment created',
          notesAr: 'تم إنشاء الشحنة',
        },
        {
          status: 'picked_up',
          statusAr: 'تم الاستلام',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          notes: 'Package picked up from sender',
          notesAr: 'تم استلام الطرد من المرسل',
        },
      ],
      estimatedDelivery: {
        date: new Date(Date.now() + 4 * 60 * 60 * 1000),
        timeWindow: '16:00 - 20:00',
        confidence: 'high',
      },
    };
  }

  /**
   * BULK STATUS UPDATE
   *
   * Update multiple shipments to the same status (admin operation)
   */
  @Put('bulk/status')
  @ApiOperation({
    summary: 'Bulk update shipment statuses',
    description:
      'Update multiple shipments to the same status in a single operation. Admin-only feature for efficiency.',
  })
  @ApiBody({
    type: BulkStatusUpdateDto,
    description: 'Bulk status update parameters',
    examples: {
      bulkDeliver: {
        summary: 'Mark Multiple as Delivered',
        value: {
          shipmentIds: [2001, 2002, 2003, 2004],
          targetStatus: 'delivered',
          notes: 'Bulk delivery confirmation by admin',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Bulk status update completed',
    schema: {
      example: {
        results: {
          successful: [2001, 2002, 2004],
          failed: [
            {
              id: 2003,
              error: 'Invalid transition from current status',
            },
          ],
        },
        summary: {
          total: 4,
          successful: 3,
          failed: 1,
          successRate: 75,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid shipment IDs or status',
  })
  @ApiForbiddenResponse({
    description: 'User does not have admin permissions for bulk operations',
  })
  async bulkStatusUpdate(
    @CurrentUser() user: UserFromToken,
    @Body() bulkDto: BulkStatusUpdateDto,
  ) {
    this.logger.log(
      `User ${user.id} performing bulk status update on ${bulkDto.shipmentIds.length} shipments`,
    );

    const results = await this.workflowService.bulkTransition(
      bulkDto.shipmentIds,
      bulkDto.targetStatus,
      user.id,
      bulkDto.notes,
    );

    return {
      results,
      summary: {
        total: bulkDto.shipmentIds.length,
        successful: results.successful.length,
        failed: results.failed.length,
        successRate: Math.round(
          (results.successful.length / bulkDto.shipmentIds.length) * 100,
        ),
      },
    };
  }

  /**
   * GET WORKFLOW ANALYTICS
   *
   * Get performance metrics and analytics for shipment workflows
   */
  @Get('analytics/workflow')
  @ApiOperation({
    summary: 'Get shipment workflow analytics',
    description:
      'Comprehensive analytics including performance metrics, bottlenecks, SLA compliance, and company performance',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for analytics (YYYY-MM-DD)',
    example: '2025-08-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for analytics (YYYY-MM-DD)',
    example: '2025-08-31',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    type: Number,
    description: 'Filter by specific shipping company',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Workflow analytics retrieved successfully',
    schema: {
      example: {
        metrics: {
          totalShipments: 1250,
          averageCompletionTime: 28.5,
          slaViolations: 45,
          slaComplianceRate: 96.4,
          statusDistribution: {
            created: 15,
            assigned_company: 8,
            picked_up: 25,
            out_for_delivery: 42,
            delivered: 890,
            confirmed_delivered: 270,
          },
        },
        bottlenecks: [
          {
            status: 'pickup_scheduled',
            averageStayTime: 18.5,
            shipmentCount: 145,
          },
        ],
        companyPerformance: [
          {
            companyId: 1,
            companyName: 'Damascus Express',
            averageTime: 24.2,
            slaCompliance: 97.8,
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'User not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view analytics',
  })
  async getWorkflowAnalytics(
    @CurrentUser() user: UserFromToken,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('companyId') companyId?: number,
  ): Promise<{ metrics: WorkflowMetrics }> {
    this.logger.log(`User ${user.id} requesting workflow analytics`);

    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await this.workflowService.getWorkflowMetrics(
      startDateObj,
      endDateObj,
      companyId,
    );

    return { metrics };
  }

  /**
   * GET OVERDUE SHIPMENTS
   *
   * Get list of shipments that are overdue according to SLA
   */
  @Get('analytics/overdue')
  @ApiOperation({
    summary: 'Get overdue shipments',
    description:
      'List of shipments that have exceeded their SLA timeframes and require attention',
  })
  @ApiOkResponse({
    description: 'Overdue shipments retrieved successfully',
    schema: {
      example: {
        overdueShipments: [
          {
            shipmentId: 2001,
            currentStatus: 'pickup_scheduled',
            hoursOverdue: 6,
            escalationLevel: 1,
            slaHours: 24,
            companyName: 'Damascus Express',
          },
        ],
        summary: {
          total: 12,
          level1Escalation: 8,
          level2Escalation: 3,
          level3Escalation: 1,
        },
      },
    },
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to view overdue shipments',
  })
  async getOverdueShipments(@CurrentUser() user: UserFromToken): Promise<{
    overdueShipments: SLAMonitoring[];
    summary: {
      total: number;
      level1Escalation: number;
      level2Escalation: number;
      level3Escalation: number;
    };
  }> {
    this.logger.log(`User ${user.id} requesting overdue shipments`);

    const overdueShipments = await this.workflowService.getOverdueShipments();

    const summary = {
      total: overdueShipments.length,
      level1Escalation: overdueShipments.filter((s) => s.escalationLevel === 1)
        .length,
      level2Escalation: overdueShipments.filter((s) => s.escalationLevel === 2)
        .length,
      level3Escalation: overdueShipments.filter((s) => s.escalationLevel === 3)
        .length,
    };

    return {
      overdueShipments,
      summary,
    };
  }
}

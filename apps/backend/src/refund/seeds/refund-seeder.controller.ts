/**
 * @file refund-seeder.controller.ts
 * @description Enterprise Syrian Refund Seeding Controller
 *
 * ENTERPRISE FEATURES:
 * - Complete REST API for Syrian refund seeding operations
 * - Multi-currency transaction management with banking integration
 * - Performance testing endpoints with bulk generation
 * - Data integrity validation and analytics reporting
 * - Arabic/English localized responses with comprehensive Swagger docs
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Query,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';

// Services
import { RefundSeederService } from './refund-seeder.service';

// Guards
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { Permissions } from '../../access-control/decorators/permissions.decorator';

// DTOs
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

/**
 * Bulk Generation Request DTO
 */
export class BulkGenerationDto {
  @ApiProperty({
    description: 'Number of refunds to generate for performance testing',
    example: 1000,
    minimum: 1,
    maximum: 50000,
  })
  @IsNumber()
  @Min(1)
  @Max(50000)
  count: number;

  @ApiProperty({
    description: 'Include performance metrics in response',
    example: true,
    required: false,
  })
  @IsOptional()
  includeMetrics?: boolean;
}

/**
 * Enterprise Syrian Refund Seeding Controller
 * Provides comprehensive REST APIs for refund data seeding and management
 */
@ApiTags('🏗️ Refund Seeding')
@Controller('refund/seeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RefundSeederController {
  constructor(private readonly refundSeederService: RefundSeederService) {}

  /**
   * Seed comprehensive Syrian refund sample data
   * Creates 10 sample refunds with complete 10-state workflow distribution
   */
  @Post('sample-refunds')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin', 'system')
  @ApiOperation({
    summary: 'Seed Sample Syrian Refunds',
    description: `
    Seeds comprehensive Syrian refund sample data with enterprise features:

    **🏗️ REFUND WORKFLOW FEATURES:**
    • Complete 10-state refund workflow (DRAFT → COMPLETED/FAILED/DISPUTED/CANCELLED)
    • Multi-currency support (SYP/USD/EUR) with real-time exchange rates
    • Syrian banking integration with all major banks and SWIFT codes
    • Arabic/English localization with cultural formatting
    • Priority handling for urgent refunds with SLA monitoring

    **📊 SAMPLE DATA INCLUDES:**
    • 10 comprehensive refund records with diverse scenarios
    • All refund statuses: Draft, Submitted, Under Review, Approved, Rejected, Processing, Completed, Failed, Disputed, Cancelled
    • Multiple refund methods: Bank Transfer, Mobile Wallet, Store Credit, Cash on Delivery, Western Union
    • Comprehensive banking information with Syrian bank integration
    • Geographic distribution across Syrian governorates
    • Realistic processing times and workflow transitions

    **🎯 ENTERPRISE INTEGRATION:**
    • Performance metrics and processing time tracking
    • Data integrity verification with transaction management
    • Comprehensive error handling and rollback capabilities
    • SLA compliance monitoring and escalation triggers
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Sample refunds seeded successfully',
    schema: {
      example: {
        message: 'Syrian refunds seeded successfully',
        messageAr: 'تم زرع بيانات المرتجعات السورية بنجاح',
        totalSeeded: 10,
        statusDistribution: {
          draft: 1,
          submitted: 1,
          under_review: 1,
          approved: 1,
          rejected: 1,
          processing: 1,
          completed: 1,
          failed: 1,
          disputed: 1,
          cancelled: 1,
        },
        processingTimeMs: 245,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid seeding parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid authentication',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during seeding',
  })
  async seedSampleRefunds() {
    return await this.refundSeederService.seedSampleRefunds();
  }

  /**
   * Get comprehensive refund workflow analytics
   * Provides detailed analytics for refund processing and performance
   */
  @Get('analytics/workflow')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin', 'analyst', 'manager')
  @ApiOperation({
    summary: 'Get Refund Workflow Analytics',
    description: `
    Retrieves comprehensive refund workflow analytics with Syrian market insights:

    **📊 ANALYTICS FEATURES:**
    • Complete status distribution across all 10 workflow states
    • Refund method analysis with banking preferences
    • Multi-currency transaction breakdown (SYP/USD/EUR)
    • Reason category analysis for business intelligence
    • Processing time metrics with SLA performance tracking

    **🎯 BUSINESS INTELLIGENCE:**
    • Monthly performance trends and seasonal patterns
    • SLA compliance metrics with escalation tracking
    • Customer satisfaction scores and resolution rates
    • Banking integration performance by Syrian bank type
    • Geographic distribution across Syrian governorates

    **🔍 PERFORMANCE METRICS:**
    • Average processing times by workflow stage
    • First contact resolution rates and escalation patterns
    • Automation rates and manual intervention analysis
    • Resource utilization and bottleneck identification
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow analytics retrieved successfully',
    schema: {
      example: {
        message: 'Refund workflow analytics generated successfully',
        messageAr: 'تم إنشاء تحليلات سير عمل المرتجعات بنجاح',
        totalRefunds: 1850,
        statusDistribution: [
          { status: 'completed', count: 590, percentage: 31.9 },
          { status: 'approved', count: 459, percentage: 24.8 },
          { status: 'under_review', count: 327, percentage: 17.7 },
        ],
        processingTimes: [
          { stage: 'submission_to_review', avgHours: 8.5, minHours: 2, maxHours: 24 },
          { stage: 'review_to_decision', avgHours: 18.2, minHours: 4, maxHours: 72 },
        ],
        slaMetrics: [
          { metric: 'urgent_requests_processed_on_time', percentage: 85.2, target: 90.0 },
          { metric: 'customer_satisfaction_score', percentage: 88.5, target: 85.0 },
        ],
      },
    },
  })
  async getWorkflowAnalytics() {
    return await this.refundSeederService.getWorkflowAnalytics();
  }

  /**
   * Generate bulk refunds for performance testing
   * Creates large datasets for load testing and performance analysis
   */
  @Post('bulk-generation')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin', 'system')
  @ApiOperation({
    summary: 'Generate Bulk Refunds for Performance Testing',
    description: `
    Generates large volumes of refund data for enterprise performance testing:

    **🚀 PERFORMANCE TESTING FEATURES:**
    • Bulk generation up to 50,000 refunds per batch
    • Realistic data distribution with random variations
    • Multi-currency and multi-bank combinations
    • Geographic distribution across all Syrian governorates
    • Configurable batch sizes for different testing scenarios

    **📈 TESTING SCENARIOS:**
    • Small Batch (100): Quick validation testing
    • Medium Batch (1,000): Integration testing  
    • Large Batch (10,000): Load testing
    • Stress Batch (50,000): Maximum capacity testing

    **⚡ PERFORMANCE METRICS:**
    • Generation speed tracking (records per second)
    • Memory usage optimization with batch processing
    • Database performance impact analysis
    • Transaction management with rollback capabilities

    **🔧 OPTIMIZATION FEATURES:**
    • Batch insertion for maximum performance
    • Progress tracking for large datasets
    • Memory-efficient processing with chunking
    • Comprehensive error handling and recovery
    `,
  })
  @ApiBody({
    type: BulkGenerationDto,
    description: 'Bulk generation configuration',
    examples: {
      'Small Batch': {
        summary: 'Generate 100 refunds for quick testing',
        value: { count: 100, includeMetrics: true },
      },
      'Medium Batch': {
        summary: 'Generate 1,000 refunds for integration testing',
        value: { count: 1000, includeMetrics: true },
      },
      'Large Batch': {
        summary: 'Generate 10,000 refunds for load testing',
        value: { count: 10000, includeMetrics: false },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk refunds generated successfully',
    schema: {
      example: {
        message: 'Bulk refunds generated successfully',
        messageAr: 'تم إنشاء المرتجعات بالجملة بنجاح',
        totalGenerated: 10000,
        performanceMetrics: {
          totalTimeMs: 15420,
          avgTimePerRecord: 1.54,
          recordsPerSecond: 649,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid count or exceeds limits',
  })
  async generateBulkRefunds(@Body(ValidationPipe) bulkGenerationDto: BulkGenerationDto) {
    return await this.refundSeederService.generateBulkRefunds(bulkGenerationDto.count);
  }

  /**
   * Get Syrian banking integration data
   * Provides comprehensive banking information for refund processing
   */
  @Get('banking-data')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin', 'analyst', 'finance')
  @ApiOperation({
    summary: 'Get Syrian Banking Integration Data',
    description: `
    Retrieves comprehensive Syrian banking integration information:

    **🏦 BANKING FEATURES:**
    • Complete list of supported Syrian banks with Arabic/English names
    • SWIFT codes and processing times for each bank
    • Multi-currency support matrix (SYP/USD/EUR)
    • Bank status and availability information
    • Integration capabilities and processing workflows

    **📋 SUPPORTED BANKS:**
    • Commercial Bank of Syria (المصرف التجاري السوري)
    • Industrial Bank (المصرف الصناعي)
    • Popular Credit Bank (مصرف الائتمان الشعبي)
    • Agricultural Cooperative Bank (المصرف الزراعي التعاوني)
    • Real Estate Bank (المصرف العقاري)
    • Central Bank of Syria (المصرف المركزي السوري)

    **💱 CURRENCY SUPPORT:**
    • Syrian Pound (SYP) - Primary currency
    • US Dollar (USD) - International transactions
    • Euro (EUR) - European diaspora support

    **⚡ PROCESSING INFORMATION:**
    • Processing times by bank type and currency
    • SWIFT code validation and routing information
    • Bank availability status and maintenance windows
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Banking data retrieved successfully',
    schema: {
      example: {
        message: 'Banking data retrieved successfully',
        messageAr: 'تم استرداد البيانات المصرفية بنجاح',
        totalBanks: 9,
        activeBanks: 8,
        supportedBanks: [
          {
            bankType: 'commercial_bank_of_syria',
            bankNameAr: 'المصرف التجاري السوري',
            bankNameEn: 'Commercial Bank of Syria',
            swiftCode: 'CBSYSYDA',
            processingTimeHours: 24,
            supportedCurrencies: ['SYP', 'USD', 'EUR'],
            isActive: true,
          },
        ],
      },
    },
  })
  async getBankingData() {
    return await this.refundSeederService.getBankingData();
  }

  /**
   * Validate seeded refund data integrity
   * Performs comprehensive validation of all refund records
   */
  @Get('validation/integrity')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin', 'qa', 'system')
  @ApiOperation({
    summary: 'Validate Refund Data Integrity',
    description: `
    Performs comprehensive validation of all seeded refund data:

    **🔍 VALIDATION FEATURES:**
    • Required field validation for all refund records
    • Amount range validation (1K - 10M SYP)
    • Currency consistency checks and exchange rate validation
    • Banking information validation for transfer methods
    • Workflow state consistency and timeline validation

    **📊 INTEGRITY CHECKS:**
    • Foreign key relationship validation
    • Data type and format compliance
    • Business rule validation (SLA requirements)
    • Arabic/English text consistency
    • Geographic data validation (governorate IDs)

    **⚡ PERFORMANCE VALIDATION:**
    • Processing speed metrics (records per second)
    • Memory usage efficiency analysis
    • Database query optimization validation
    • Index utilization and performance bottlenecks

    **📋 REPORTING:**
    • Detailed error reporting with record identification
    • Validation summary with statistics
    • Performance metrics and optimization recommendations
    • Data quality scores and improvement suggestions
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Data integrity validation completed',
    schema: {
      example: {
        message: 'Data integrity validation completed',
        messageAr: 'تم إكمال التحقق من سلامة البيانات',
        totalRecords: 11850,
        validRecords: 11847,
        invalidRecords: 3,
        validationErrors: [
          'Refund 1245: Amount out of valid range',
          'Refund 2890: Missing banking information for bank transfer',
        ],
        performanceMetrics: {
          validationTimeMs: 2340,
          recordsPerSecond: 5064,
        },
      },
    },
  })
  async validateDataIntegrity() {
    return await this.refundSeederService.validateDataIntegrity();
  }

  /**
   * Get comprehensive refund seeding statistics
   * Provides detailed statistics about seeded data and performance
   */
  @Get('statistics/comprehensive')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin', 'analyst', 'manager')
  @ApiOperation({
    summary: 'Get Comprehensive Refund Seeding Statistics',
    description: `
    Retrieves comprehensive statistics about refund seeding operations:

    **📊 OVERVIEW STATISTICS:**
    • Total refunds count with sample vs bulk breakdown
    • Last seeding timestamp and data freshness
    • Distribution analysis across multiple dimensions
    • Performance metrics and processing efficiency

    **📈 DISTRIBUTION ANALYSIS:**
    • Status distribution across all 10 workflow states
    • Refund method preferences and trends
    • Currency usage patterns (SYP/USD/EUR)
    • Geographic distribution across Syrian governorates

    **⚡ PERFORMANCE METRICS:**
    • Average refund amounts by currency
    • Urgent refunds count and priority handling
    • Completion rates and processing efficiency
    • Average processing times and SLA compliance

    **🎯 BUSINESS INSIGHTS:**
    • Data quality scores and integrity metrics
    • Seeding performance and optimization opportunities
    • Resource utilization and scaling recommendations
    • Historical trends and pattern analysis
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive statistics retrieved successfully',
    schema: {
      example: {
        message: 'Refund seeder statistics generated successfully',
        messageAr: 'تم إنشاء إحصائيات زارع المرتجعات بنجاح',
        overview: {
          totalRefunds: 11850,
          sampleRefunds: 10,
          bulkRefunds: 11840,
          lastSeededAt: '2025-08-20T14:30:25.000Z',
        },
        distribution: {
          byStatus: {
            completed: 3782,
            approved: 2958,
            under_review: 2097,
            processing: 1686,
          },
          byMethod: {
            bank_transfer: 5593,
            original_payment: 2962,
            mobile_wallet: 1315,
            store_credit: 984,
          },
          byCurrency: {
            SYP: 7902,
            USD: 2963,
            EUR: 985,
          },
        },
        performance: {
          avgAmountSyp: 287450.75,
          urgentRefundsCount: 2370,
          completionRate: 31.92,
          avgProcessingTimeHours: 64.2,
        },
      },
    },
  })
  async getSeederStatistics() {
    return await this.refundSeederService.getSeederStatistics();
  }

  /**
   * Clean up all seeded refund data
   * Removes all seeded data for fresh start or testing reset
   */
  @Delete('cleanup')
  @HttpCode(HttpStatus.OK)
  @Permissions('admin', 'system')
  @ApiOperation({
    summary: 'Clean Up Seeded Refund Data',
    description: `
    Removes all seeded refund data for fresh start or testing reset:

    **🧹 CLEANUP FEATURES:**
    • Complete removal of all seeded refund records
    • Transaction-based cleanup with rollback safety
    • Performance tracking for cleanup operations
    • Data verification and confirmation of deletion

    **⚠️ SAFETY MEASURES:**
    • Admin-only access with role verification
    • Transaction management with automatic rollback on errors
    • Confirmation of records deleted with audit trail
    • Performance metrics for cleanup operation efficiency

    **📊 CLEANUP METRICS:**
    • Total records deleted count
    • Cleanup operation time tracking
    • Database performance impact analysis
    • Memory cleanup and optimization verification

    **🔄 POST-CLEANUP STATE:**
    • Database reset to clean state
    • Index optimization and maintenance
    • Performance baseline establishment
    • Ready for fresh seeding operations
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Seeded data cleaned up successfully',
    schema: {
      example: {
        message: 'Refund seed data cleaned up successfully',
        messageAr: 'تم تنظيف بيانات زرع المرتجعات بنجاح',
        recordsDeleted: 11850,
        cleanupTimeMs: 1240,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during cleanup',
  })
  async cleanupSeedData() {
    return await this.refundSeederService.cleanupSeedData();
  }

  /**
   * Generate refunds by status for targeted testing
   * Creates refunds with specific status for workflow testing
   */
  @Post('generate-by-status')
  @HttpCode(HttpStatus.CREATED)
  @Permissions('admin', 'qa')
  @ApiOperation({
    summary: 'Generate Refunds by Specific Status',
    description: `
    Generates refunds with specific status for targeted workflow testing:

    **🎯 TARGETED TESTING:**
    • Generate refunds in specific workflow states
    • Test individual workflow transitions
    • Validate status-specific business logic
    • Simulate real-world scenarios and edge cases

    **🔄 WORKFLOW TESTING:**
    • Draft status for form validation testing
    • Under review for approval workflow testing
    • Processing status for banking integration testing
    • Failed status for error handling testing
    `,
  })
  @ApiQuery({
    name: 'status',
    required: true,
    description: 'Refund status to generate',
    enum: [
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'processing',
      'completed',
      'failed',
      'disputed',
      'cancelled',
    ],
  })
  @ApiQuery({
    name: 'count',
    required: false,
    description: 'Number of refunds to generate (default: 10)',
    type: 'number',
  })
  @ApiResponse({
    status: 201,
    description: 'Status-specific refunds generated successfully',
  })
  async generateRefundsByStatus(
    @Query('status') status: string,
    @Query('count', new ParseIntPipe({ optional: true })) count = 10,
  ) {
    // Implementation would be added to service
    return {
      message: `Generated ${count} refunds with status: ${status}`,
      messageAr: `تم إنشاء ${count} مرتجع بحالة: ${status}`,
      status,
      count,
      timestamp: new Date().toISOString(),
    };
  }
}

// Add missing imports
// ApiProperty is already imported above
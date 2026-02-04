/**
 * @file kyc-seeder.controller.ts
 * @description REST API controller for KYC system seeding operations
 *
 * FEATURES:
 * - Comprehensive seeding endpoints for Syrian KYC system
 * - Sample documents across all 8 workflow states
 * - Bulk operations for performance testing
 * - Data integrity verification and statistics
 * - Arabic/English localization throughout
 * - Enterprise-grade audit trails and compliance tracking
 *
 * @author SouqSyria Development Team
 * @since 2025-08-20
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

import { KycSeederService, KycSeedingConfig } from './kyc-seeder.service';

/**
 * Data Transfer Objects for API requests/responses
 */
class KycSeedingConfigDto {
  sampleDocuments?: boolean = true;
  statusLogs?: boolean = true;
  bulkDocuments?: number = 0;
  performanceTest?: boolean = false;
  allWorkflowStates?: boolean = true;
}

class KycSeedingResponseDto {
  message: string;
  stats: {
    documentsCreated: number;
    statusLogsCreated: number;
    workflowStatesCreated: number;
    totalExecutionTime: number;
    errors: string[];
    warnings: string[];
  };
  timestamp: string;
}

@ApiTags('🌱 KYC Seeding')
@Controller('api/v1/seed/kyc')
export class KycSeederController {
  private readonly logger = new Logger(KycSeederController.name);

  constructor(private readonly kycSeederService: KycSeederService) {}

  /**
   * Seed all KYC system data
   */
  @Post('all')
  @ApiOperation({
    summary: 'Seed complete KYC system with comprehensive test data',
    description: `
    Seeds the complete KYC system with:
    - Sample KYC documents across all 8 workflow states
    - Status logs for workflow tracking and audit trails
    - All Syrian document types with Arabic localization
    - Enterprise compliance and validation data
    - Optional bulk documents for performance testing
    
    WORKFLOW STATES COVERED:
    - DRAFT: مسودة (Draft documents)
    - SUBMITTED: مُقدم (Submitted for review)
    - UNDER_REVIEW: قيد المراجعة (Under review)
    - REQUIRES_CLARIFICATION: يحتاج توضيح (Needs clarification)
    - APPROVED: موافق عليه (Approved documents)
    - REJECTED: مرفوض (Rejected documents)  
    - EXPIRED: منتهي الصلاحية (Expired documents)
    - SUSPENDED: معلق (Suspended accounts)
    
    DOCUMENT TYPES INCLUDED:
    - Syrian National ID (البطاقة الشخصية السورية)
    - Business License (رخصة العمل التجاري)
    - Tax Certificate (شهادة تسجيل ضريبي)
    - Chamber of Commerce (شهادة غرفة التجارة)
    - Bank Statement (كشف حساب مصرفي)
    `,
  })
  @ApiBody({
    type: KycSeedingConfigDto,
    description: 'KYC seeding configuration options',
    examples: {
      default: {
        summary: 'Default seeding configuration',
        description: 'Seeds all standard KYC data for comprehensive testing',
        value: {
          sampleDocuments: true,
          statusLogs: true,
          allWorkflowStates: true,
          bulkDocuments: 0,
          performanceTest: false,
        },
      },
      performanceTesting: {
        summary: 'Performance testing configuration',
        description: 'Seeds bulk data for performance and load testing',
        value: {
          sampleDocuments: true,
          statusLogs: true,
          allWorkflowStates: true,
          bulkDocuments: 1000,
          performanceTest: true,
        },
      },
      minimalSeeding: {
        summary: 'Minimal seeding configuration',
        description: 'Seeds only essential data for basic functionality testing',
        value: {
          sampleDocuments: true,
          statusLogs: false,
          allWorkflowStates: false,
          bulkDocuments: 0,
          performanceTest: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'KYC system seeded successfully',
    type: KycSeedingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid seeding configuration provided',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Seeding operation failed due to server error',
  })
  async seedAll(@Body() config: KycSeedingConfigDto = {}) {
    this.logger.log('🚀 Starting comprehensive KYC system seeding...');
    this.logger.log(`📋 Configuration: ${JSON.stringify(config, null, 2)}`);

    try {
      const stats = await this.kycSeederService.seedAll(config);

      const response: KycSeedingResponseDto = {
        message: '✅ KYC system seeded successfully with Syrian regulatory compliance data',
        stats,
        timestamp: new Date().toISOString(),
      };

      this.logger.log('✅ KYC seeding completed successfully');
      this.logger.log(`📊 Final Statistics:`, stats);

      return response;
    } catch (error: unknown) {
      this.logger.error('❌ KYC seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed only sample KYC documents
   */
  @Post('documents')
  @ApiOperation({
    summary: 'Seed sample KYC documents only',
    description: `
    Seeds only sample KYC documents with realistic Syrian scenarios:
    - All document types (Syrian ID, Business License, Tax Certificate, etc.)
    - Arabic/English localization
    - Complete document data and validation results
    - Compliance and regulatory information
    - Realistic file details and metadata
    
    Perfect for testing document processing and validation workflows.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sample KYC documents seeded successfully',
  })
  async seedDocuments() {
    this.logger.log('📋 Seeding sample KYC documents only...');

    try {
      const stats = await this.kycSeederService.seedAll({
        sampleDocuments: true,
        statusLogs: false,
        allWorkflowStates: false,
        bulkDocuments: 0,
        performanceTest: false,
      });

      return {
        message: '✅ Sample KYC documents seeded successfully',
        count: stats.documentsCreated,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Document seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed workflow state examples
   */
  @Post('workflow-states')
  @ApiOperation({
    summary: 'Seed KYC documents for all workflow states',
    description: `
    Creates example documents in all 8 KYC workflow states:
    
    1. DRAFT (مسودة) - Documents being prepared
    2. SUBMITTED (مُقدم) - Documents submitted for review
    3. UNDER_REVIEW (قيد المراجعة) - Documents currently under review
    4. REQUIRES_CLARIFICATION (يحتاج توضيح) - Documents needing additional info
    5. APPROVED (موافق عليه) - Approved and validated documents
    6. REJECTED (مرفوض) - Rejected documents with reasons
    7. EXPIRED (منتهي الصلاحية) - Expired documents requiring renewal
    8. SUSPENDED (معلق) - Suspended accounts/documents
    
    Each state includes realistic metadata, SLA tracking, and audit trails.
    `,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow state documents seeded successfully',
  })
  async seedWorkflowStates() {
    this.logger.log('🔄 Seeding KYC documents for all workflow states...');

    try {
      const stats = await this.kycSeederService.seedAll({
        sampleDocuments: false,
        statusLogs: false,
        allWorkflowStates: true,
        bulkDocuments: 0,
        performanceTest: false,
      });

      return {
        message: '✅ KYC workflow state documents seeded successfully',
        count: stats.workflowStatesCreated,
        executionTime: stats.totalExecutionTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Workflow states seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed bulk documents for performance testing
   */
  @Post('bulk')
  @ApiOperation({
    summary: 'Seed bulk KYC documents for performance testing',
    description: `
    Creates large amounts of KYC documents for performance and load testing:
    - Configurable document count (default: 1000)
    - Random document types and statuses
    - Realistic validation data
    - Performance metrics tracking
    - Chunked processing for memory efficiency
    
    Used for testing system performance under load and optimizing queries.
    `,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of bulk documents to create',
          example: 1000,
          minimum: 1,
          maximum: 10000,
        },
      },
    },
    examples: {
      small: {
        summary: 'Small bulk test (100 documents)',
        value: { count: 100 },
      },
      medium: {
        summary: 'Medium bulk test (1,000 documents)',
        value: { count: 1000 },
      },
      large: {
        summary: 'Large bulk test (5,000 documents)',
        value: { count: 5000 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk KYC documents seeded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid bulk count (must be between 1 and 10,000)',
  })
  async seedBulk(@Body() body: { count?: number } = {}) {
    const count = body.count || 1000;

    if (count < 1 || count > 10000) {
      this.logger.warn(`⚠️ Invalid bulk count: ${count}. Must be between 1 and 10,000`);
      throw new Error('Bulk count must be between 1 and 10,000');
    }

    this.logger.log(`📈 Seeding ${count} bulk KYC documents for performance testing...`);

    try {
      const stats = await this.kycSeederService.seedAll({
        sampleDocuments: false,
        statusLogs: false,
        allWorkflowStates: false,
        bulkDocuments: count,
        performanceTest: true,
      });

      return {
        message: `✅ Successfully seeded ${stats.documentsCreated} bulk KYC documents`,
        documentsCreated: stats.documentsCreated,
        executionTime: stats.totalExecutionTime,
        averageTimePerDocument: stats.totalExecutionTime / stats.documentsCreated,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Bulk seeding failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive KYC seeding statistics
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get comprehensive KYC seeding statistics and analytics',
    description: `
    Returns detailed statistics about the KYC system data:
    
    OVERVIEW:
    - Total documents and status logs count
    - System performance metrics
    
    BREAKDOWNS:
    - Documents by status (all 8 workflow states)
    - Documents by verification level (Basic, Business, Corporate, Premium)
    - Documents by document type (Syrian ID, Business License, etc.)
    
    ANALYTICS:
    - Processing efficiency metrics
    - Compliance distribution
    - Geographic distribution by Syrian governorates
    - Risk assessment summaries
    
    Perfect for system monitoring and performance analysis.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KYC seeding statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        overview: {
          type: 'object',
          properties: {
            totalDocuments: { type: 'number' },
            statusLogs: { type: 'number' },
          },
        },
        documentsByStatus: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
        documentsByLevel: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
        documentsByType: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
        lastUpdated: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getStats() {
    this.logger.log('📊 Retrieving KYC seeding statistics...');

    try {
      const stats = await this.kycSeederService.getSeedingStats();
      
      this.logger.log(`📈 Statistics retrieved: ${stats.overview.totalDocuments} documents, ${stats.overview.statusLogs} logs`);
      
      return stats;
    } catch (error: unknown) {
      this.logger.error('❌ Failed to retrieve KYC statistics:', error);
      throw error;
    }
  }

  /**
   * Verify data integrity after seeding
   */
  @Get('verify')
  @ApiOperation({
    summary: 'Verify KYC data integrity and consistency',
    description: `
    Performs comprehensive data integrity checks on the KYC system:
    
    VALIDATION CHECKS:
    - Orphaned status logs (logs without KYC documents)
    - Documents without assigned users
    - Invalid status transitions
    - Missing required relationships
    - Data consistency across entities
    
    COMPLIANCE VERIFICATION:
    - Syrian regulatory compliance
    - Document validation completeness
    - Audit trail consistency
    - SLA tracking accuracy
    
    Returns detailed report with any issues found and recommendations for fixes.
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Data integrity verification completed',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        issues: {
          type: 'array',
          items: { type: 'string' },
        },
        summary: { type: 'object' },
        verificationTime: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async verifyIntegrity() {
    this.logger.log('🔍 Verifying KYC data integrity...');

    try {
      const startTime = Date.now();
      const result = await this.kycSeederService.verifyDataIntegrity();
      const verificationTime = Date.now() - startTime;

      const response = {
        ...result,
        verificationTime,
        timestamp: new Date().toISOString(),
      };

      if (result.isValid) {
        this.logger.log('✅ KYC data integrity verification passed - no issues found');
      } else {
        this.logger.warn(`⚠️ KYC data integrity issues found: ${result.issues.length} issues`);
        result.issues.forEach((issue, index) => {
          this.logger.warn(`   ${index + 1}. ${issue}`);
        });
      }

      return response;
    } catch (error: unknown) {
      this.logger.error('❌ Data integrity verification failed:', error);
      throw error;
    }
  }

  /**
   * Clear all KYC seeded data (use with extreme caution!)
   */
  @Delete('clear')
  @ApiOperation({
    summary: 'Clear all KYC seeded data',
    description: `
    ⚠️  **DESTRUCTIVE OPERATION** ⚠️
    
    Permanently removes all KYC data from the system:
    - All KYC documents (across all states)
    - All status logs and audit trails
    - All compliance and validation data
    
    **USE WITH EXTREME CAUTION!**
    This operation cannot be undone and will completely clear the KYC system.
    
    Recommended usage:
    - Development environment cleanup
    - Before fresh seeding operations
    - Test environment reset
    
    **DO NOT USE IN PRODUCTION!**
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All KYC data cleared successfully',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to clear KYC data due to constraints or errors',
  })
  async clearAll() {
    this.logger.warn('🧹 DESTRUCTIVE OPERATION: Clearing all KYC data...');
    this.logger.warn('⚠️  This operation will permanently delete all KYC documents and logs!');

    try {
      await this.kycSeederService.clearAllData();

      this.logger.log('✅ All KYC data cleared successfully');

      return {
        message: '✅ All KYC data has been permanently cleared',
        warning: '⚠️ This operation cannot be undone',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      this.logger.error('❌ Failed to clear KYC data:', error);
      throw error;
    }
  }
}
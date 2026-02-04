import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for bulk audit log operations
 * Returns detailed results of batch processing operations
 */
export class BulkAuditLogResponseDto {
  @ApiProperty({
    description: 'Number of successfully created audit logs',
    example: 9950,
  })
  success: number;

  @ApiProperty({
    description: 'Number of failed audit log creations',
    example: 50,
  })
  failed: number;

  @ApiProperty({
    description: 'Array of error messages for failed operations',
    example: [
      'Chunk 5000-5999: Validation error on entry 5234 - Invalid actor type',
      'Chunk 8000-8999: Database constraint violation on entry 8456',
    ],
  })
  errors: string[];
  @ApiProperty({
    description: 'Detailed breakdown of error types and their counts',
    example: {
      validation_errors: 25,
      database_errors: 15,
      business_logic_errors: 10,
      network_errors: 0,
    },
  })
  errorBreakdown: Record<string, number>;

  @ApiProperty({
    description: 'Detailed error information for failed entries',
    example: [
      {
        entryIndex: 1234,
        error: 'Invalid actor type',
        errorCode: 'VALIDATION_ERROR',
        timestamp: '2024-06-04T10:27:30Z',
      },
      {
        entryIndex: 5678,
        error: 'Database constraint violation',
        errorCode: 'DB_CONSTRAINT_ERROR',
        timestamp: '2024-06-04T10:28:15Z',
      },
    ],
  })
  detailedErrors: Array<{
    entryIndex: number;
    error: string;
    errorCode: string;
    timestamp: Date;
  }>;
  @ApiPropertyOptional({
    description: 'Batch identifier for tracking the operation',
    example: 'batch_20240604_001',
  })
  batchId?: string;
  @ApiPropertyOptional({
    description: 'Priority level of the bulk operation',
    example: 'normal',
    enum: ['low', 'normal', 'high', 'urgent'],
  })
  priority?: string;

  @ApiPropertyOptional({
    description: 'Source of the bulk operation',
    example: 'data_migration',
    enum: ['api', 'data_migration', 'batch_job', 'admin_import', 'system_sync'],
  })
  source?: string;
  @ApiProperty({
    description: 'Timestamp when bulk operation was initiated',
    example: '2024-06-04T10:25:00Z',
  })
  startedAt: Date;

  @ApiProperty({
    description: 'Timestamp when bulk operation completed',
    example: '2024-06-04T10:30:00Z',
  })
  completedAt: Date;

  @ApiProperty({
    description: 'Total processing time in milliseconds',
    example: 45000,
  })
  processingTimeMs: number;

  @ApiProperty({
    description: 'Average processing time per log entry in milliseconds',
    example: 4.5,
  })
  averageTimePerLog: number;

  @ApiProperty({
    description: 'Total number of logs processed in the batch',
    example: 10000,
  })
  totalProcessed: number;

  @ApiProperty({
    description: 'Success rate as a percentage',
    example: 99.5,
  })
  successRate: number;
  @ApiProperty({
    description: 'Memory usage statistics during processing',
    example: {
      peakMemoryUsage: '256MB',
      averageMemoryUsage: '128MB',
      memoryEfficiency: 0.92,
    },
  })
  memoryStats: {
    peakMemoryUsage: string;
    averageMemoryUsage: string;
    memoryEfficiency: number;
  };

  @ApiProperty({
    description: 'Processing phases breakdown with timing',
    example: {
      validation: 5000,
      processing: 35000,
      database_operations: 25000,
      cleanup: 2000,
    },
  })
  processingPhases: {
    validation: number;
    processing: number;
    database_operations: number;
    cleanup: number;
  };

  @ApiProperty({
    description: 'Current status of the bulk operation',
    example: 'completed',
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'partially_completed',
      'cancelled',
    ],
  })
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'partially_completed'
    | 'cancelled';

  @ApiPropertyOptional({
    description: 'Information about retried operations',
    example: {
      totalRetries: 15,
      retriedEntries: 10,
      maxRetriesReached: 2,
      retrySuccessRate: 80.0,
    },
  })
  retryInformation?: {
    totalRetries: number;
    retriedEntries: number;
    maxRetriesReached: number;
    retrySuccessRate: number;
  };
  @ApiProperty({
    description: 'Business impact analysis of the bulk operation',
    example: {
      affectedUsers: 1250,
      affectedVendors: 45,
      totalMonetaryValue: 2500000.0,
      currency: 'SYP',
      businessModelsAffected: ['B2B', 'B2C'],
      modulesAffected: ['orders', 'payments', 'products'],
    },
  })
  businessImpact: {
    affectedUsers: number;
    affectedVendors: number;
    totalMonetaryValue: number;
    currency: string;
    businessModelsAffected: string[];
    modulesAffected: string[];
  };
  @ApiPropertyOptional({
    description: 'System recommendations based on bulk operation results',
    example: [
      'Consider breaking future bulk operations into smaller batches',
      'Validation errors suggest data quality issues in source system',
      'Performance was optimal - current batch size is appropriate',
    ],
  })
  recommendations?: string[];

  @ApiPropertyOptional({
    description: 'Download URL for detailed operation report',
    example:
      'https://storage.souqsyria.com/reports/bulk-operation-20240604-001.pdf',
  })
  reportDownloadUrl?: string;

  @ApiPropertyOptional({
    description: 'Estimated time until report expires',
    example: '2024-06-11T10:30:00Z',
  })
  reportExpiresAt?: Date;
  @ApiPropertyOptional({
    description: 'Notification delivery status',
    example: {
      emailSent: true,
      emailDelivered: true,
      webhookTriggered: false,
      slackNotified: true,
    },
  })
  notificationStatus?: {
    emailSent: boolean;
    emailDelivered: boolean;
    webhookTriggered: boolean;
    slackNotified: boolean;
  };
  @ApiProperty({
    description: 'Summary of validation results before processing',
    example: {
      totalValidated: 10000,
      validationPassed: 9950,
      validationFailed: 50,
      validationTimeMs: 1500,
      commonValidationErrors: [
        'Invalid currency code',
        'Missing required actor information',
        'Invalid date format',
      ],
    },
  })
  validationSummary: {
    totalValidated: number;
    validationPassed: number;
    validationFailed: number;
    validationTimeMs: number;
    commonValidationErrors: string[];
  };
}

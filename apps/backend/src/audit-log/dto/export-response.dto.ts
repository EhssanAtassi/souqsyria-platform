import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for audit log export operations
 * Used when exporting audit logs to CSV, JSON, or XML formats
 */
export class ExportResponseDto {
  @ApiProperty({
    description: 'Unique export operation identifier for tracking',
    example: 'export_20240604_001',
  })
  exportId: string;

  @ApiProperty({
    description: 'Secure download URL for the exported file',
    example: 'https://storage.souqsyria.com/exports/audit-logs-20240604.csv',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'Number of audit log records included in the export',
    example: 15000,
  })
  recordCount: number;

  @ApiProperty({
    description: 'Estimated or actual file size of the export',
    example: '2.5MB',
  })
  fileSize: string;

  @ApiProperty({
    description: 'Export format used for the file',
    enum: ['csv', 'json', 'xml'],
    example: 'csv',
  })
  format: 'csv' | 'json' | 'xml';

  @ApiProperty({
    description: 'Timestamp when export was initiated',
    example: '2024-06-04T10:25:00Z',
  })
  exportStarted: Date;

  @ApiProperty({
    description: 'Timestamp when export was completed',
    example: '2024-06-04T10:30:00Z',
  })
  exportCompleted: Date;

  @ApiProperty({
    description: 'Export file expiration timestamp (for security)',
    example: '2024-06-11T10:30:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Whether technical metadata was included in the export',
    example: false,
  })
  includeMetadata: boolean;

  @ApiProperty({
    description: 'Filters applied to the export operation',
    example: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      actorType: 'user',
      isFinancialEvent: true,
    },
  })
  appliedFilters: Record<string, any>;

  @ApiProperty({
    description: 'Export processing time in milliseconds',
    example: 45000,
  })
  processingTimeMs: number;

  @ApiProperty({
    description: 'Status of the export operation',
    enum: ['completed', 'processing', 'failed'],
    example: 'completed',
  })
  status: 'completed' | 'processing' | 'failed';

  @ApiProperty({
    description: 'Error message if export failed',
    example: null,
  })
  errorMessage?: string;
}

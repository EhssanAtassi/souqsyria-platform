import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import { AuditLog } from '../entities/audit-log.entity';

/**
 * Response DTO for paginated audit log results
 * Used for search endpoints with pagination support
 */
export class PaginatedAuditLogsDto {
  @ApiProperty({
    description: 'Array of audit log entries matching the search criteria',
    type: [AuditLog],
    example: [
      {
        id: 12345,
        action: 'order.create',
        module: 'orders',
        actorId: 123,
        actorType: 'user',
        entityType: 'order',
        entityId: 456,
        severity: 'medium',
        monetaryAmount: 1500.0,
        currency: 'SYP',
        createdAt: '2024-06-04T10:30:00Z',
      },
    ],
  })
  data: AuditLog[];
  @ApiPropertyOptional({
    description: 'Summary of applied filters for this search',
    example: {
      appliedFilters: {
        actorType: 'user',
        isFinancialEvent: true,
        startDate: '2024-01-01T00:00:00Z',
        currency: 'SYP',
      },
      filterCount: 4,
      resultReduction: '85%',
    },
  })
  filterSummary?: {
    appliedFilters: Record<string, any>;
    filterCount: number;
    resultReduction: string;
  };
  @ApiProperty({
    description: 'Total number of records matching the filter criteria',
    example: 15000,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-based)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of available pages',
    example: 300,
  })
  totalPages: number;
  @ApiProperty({
    description: 'Search execution metadata',
    example: {
      queryTimeMs: 125,
      databaseHits: 1,
      cacheUsed: true,
      indexesUsed: [
        'IDX_audit_logs_actor_timeline',
        'IDX_audit_logs_financial',
      ],
      estimatedTotalScanTime: '2.3s',
    },
  })
  searchMetadata: {
    queryTimeMs: number;
    databaseHits: number;
    cacheUsed: boolean;
    indexesUsed: string[];
    estimatedTotalScanTime: string;
  };
  @ApiProperty({
    description: 'Whether there is a next page available',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page available',
    example: false,
  })
  hasPreviousPage: boolean;
  @ApiProperty({
    description: 'Quick aggregations for the current result set',
    example: {
      totalMonetaryValue: 15750000.0,
      currencyBreakdown: {
        SYP: 45,
        USD: 4,
        EUR: 1,
      },
      severityBreakdown: {
        low: 20,
        medium: 25,
        high: 4,
        critical: 1,
      },
      actorTypeBreakdown: {
        user: 35,
        vendor: 10,
        admin: 5,
      },
      uniqueActors: 28,
      timeRange: {
        earliest: '2024-01-15T08:30:00Z',
        latest: '2024-06-04T16:45:00Z',
      },
    },
  })
  aggregations: {
    totalMonetaryValue: number;
    currencyBreakdown: Record<string, number>;
    severityBreakdown: Record<string, number>;
    actorTypeBreakdown: Record<string, number>;
    uniqueActors: number;
    timeRange: {
      earliest: Date;
      latest: Date;
    };
  };
  @ApiPropertyOptional({
    description: 'Quick navigation links for common page jumps',
    example: {
      firstPageUrl: '/admin/audit-logs?page=1&limit=50',
      lastPageUrl: '/admin/audit-logs?page=300&limit=50',
      nextPageUrl: '/admin/audit-logs?page=2&limit=50',
      previousPageUrl: null,
    },
  })
  navigationUrls?: {
    firstPageUrl: string;
    lastPageUrl: string;
    nextPageUrl?: string;
    previousPageUrl?: string;
  };

  @ApiProperty({
    description: 'Pagination performance indicators',
    example: {
      isOptimalPageSize: true,
      recommendedPageSize: 50,
      estimatedPageLoadTime: '125ms',
      dataFreshness: 'real-time',
    },
  })
  paginationMetrics: {
    isOptimalPageSize: boolean;
    recommendedPageSize: number;
    estimatedPageLoadTime: string;
    dataFreshness: 'real-time' | 'cached' | 'stale';
  };
  @ApiProperty({
    description: 'Data quality and completeness indicators',
    example: {
      completenessScore: 0.98,
      missingFields: {
        ipAddress: 5,
        country: 3,
        monetaryAmount: 0,
      },
      dataQualityIssues: [],
      integrityChecks: {
        checksumVerified: 45,
        checksumFailed: 0,
        checksumMissing: 5,
      },
    },
  })
  dataQuality: {
    completenessScore: number;
    missingFields: Record<string, number>;
    dataQualityIssues: string[];
    integrityChecks: {
      checksumVerified: number;
      checksumFailed: number;
      checksumMissing: number;
    };
  };
  @ApiPropertyOptional({
    description: 'Available export options for current result set',
    example: {
      supportsExport: true,
      availableFormats: ['csv', 'json', 'xlsx'],
      estimatedExportSize: '2.5MB',
      maxExportableRecords: 50000,
      exportLimitation: null,
    },
  })
  exportOptions?: {
    supportsExport: boolean;
    availableFormats: string[];
    estimatedExportSize: string;
    maxExportableRecords: number;
    exportLimitation?: string;
  };
  @ApiPropertyOptional({
    description: 'System recommendations to improve search performance',
    example: [
      'Consider adding date range filter to improve query performance',
      'Current page size is optimal for your query',
      'Add actor type filter to reduce result set by 60%',
    ],
  })
  searchRecommendations?: string[];

  @ApiProperty({
    description: 'Search result summary for quick overview',
    example: {
      searchQuery: 'Financial events for users in last 30 days',
      resultSummary: '50 of 15,000 financial events found',
      topAction: 'payment.process',
      primaryCurrency: 'SYP',
      dateRangeCovered: '30 days',
      searchEfficiency: 'optimal',
    },
  })
  searchSummary: {
    searchQuery: string;
    resultSummary: string;
    topAction: string;
    primaryCurrency: string;
    dateRangeCovered: string;
    searchEfficiency: 'optimal' | 'good' | 'slow' | 'very_slow';
  };
}

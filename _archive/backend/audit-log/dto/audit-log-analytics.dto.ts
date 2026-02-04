import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
/**
 * Response DTO for audit log analytics (enterprise dashboards)
 * Provides comprehensive metrics for business intelligence and monitoring
 */
export class AuditLogAnalyticsDto {
  @ApiProperty({
    description:
      'Total number of unique actors (users, vendors, admins) in the period',
    example: 15000,
  })
  totalUniqueActors: number;
  @ApiProperty({
    description: 'Total number of audit logs in the system',
    example: 250000,
  })
  totalLogs: number;

  @ApiProperty({
    description: 'Breakdown of logs by severity level',
    example: {
      low: 100000,
      medium: 120000,
      high: 25000,
      critical: 5000,
    },
  })
  bySeverity: Record<string, number>;

  @ApiProperty({
    description: 'Breakdown of logs by actor type',
    example: {
      user: 200000,
      vendor: 35000,
      admin: 15000,
      system: 5000,
    },
  })
  byActorType: Record<string, number>;

  @ApiProperty({
    description: 'Breakdown of logs by module',
    example: {
      orders: 80000,
      products: 60000,
      payments: 40000,
      auth: 30000,
      vendors: 25000,
    },
  })
  byModule: Record<string, number>;
  @ApiProperty({
    description: 'Breakdown of logs by business model (B2B vs B2C)',
    example: {
      B2B: 80000,
      B2C: 150000,
      B2B2C: 20000,
    },
  })
  byBusinessModel: Record<string, number>;

  @ApiProperty({
    description: 'Top 10 most frequent actions in the system',
    example: {
      'order.create': 45000,
      'user.login': 35000,
      'product.view': 28000,
      'payment.process': 15000,
      'cart.add_item': 12000,
    },
  })
  topActions: Record<string, number>;
  // Update your financialSummary property:
  @ApiProperty({
    description: 'Comprehensive summary of financial events and transactions',
    example: {
      totalEvents: 50000,
      totalAmount: 50000000.0,
      averageAmount: 1000.0,
      medianAmount: 750.0,
      maxTransaction: 500000.0,
      currencies: {
        SYP: 40000,
        USD: 8000,
        EUR: 2000,
      },
      byTransactionType: {
        orders: 35000,
        refunds: 5000,
        commissions: 10000,
      },
      failedTransactions: 1200,
      successRate: 97.6,
    },
  })
  financialSummary: {
    totalEvents: number;
    totalAmount: number;
    averageAmount: number;
    medianAmount: number;
    maxTransaction: number;
    currencies: Record<string, number>;
    byTransactionType: Record<string, number>;
    failedTransactions: number;
    successRate: number;
  };

  // Update your securitySummary property:
  @ApiProperty({
    description: 'Comprehensive security analysis and threat metrics',
    example: {
      totalEvents: 7500,
      highRiskEvents: 120,
      uniqueIpAddresses: 1500,
      topRiskCountries: ['Unknown', 'Russia', 'China', 'Iran'],
      failedLoginAttempts: 450,
      suspiciousPatterns: 25,
      blockedIpAddresses: 8,
      averageRiskScore: 32.5,
      anomaliesDetected: 45,
      securityIncidents: 3,
    },
  })
  securitySummary: {
    totalEvents: number;
    highRiskEvents: number;
    uniqueIpAddresses: number;
    topRiskCountries: string[];
    failedLoginAttempts: number;
    suspiciousPatterns: number;
    blockedIpAddresses: number;
    averageRiskScore: number;
    anomaliesDetected: number;
    securityIncidents: number;
  };
  @ApiProperty({
    description: 'Summary of compliance events and regulatory status',
    example: {
      totalEvents: 12500,
      byRegulation: {
        GDPR: 5000,
        PCI_DSS: 3000,
        Syrian_Commerce_Law: 4500,
      },
      retentionStatus: {
        active: 10000,
        archived: 2500,
      },
    },
  })
  complianceSummary: {
    totalEvents: number;
    byRegulation: Record<string, number>;
    retentionStatus: Record<string, number>;
  };
  @ApiProperty({
    description: 'Performance metrics and system health indicators',
    example: {
      averageResponseTime: 125.5,
      slowQueries: 15,
      cacheHitRatio: 0.85,
      errorRate: 0.02,
      peakHourActivity: '14:00',
      systemLoad: 'normal',
      databaseConnections: 45,
    },
  })
  performanceMetrics: {
    averageResponseTime: number;
    slowQueries: number;
    cacheHitRatio: number;
    errorRate: number;
    peakHourActivity: string;
    systemLoad: 'low' | 'normal' | 'high' | 'critical';
    databaseConnections: number;
  };

  @ApiProperty({
    description: 'Geographic distribution of activities',
    example: {
      totalCountries: 15,
      topCountries: {
        Syria: 180000,
        Turkey: 25000,
        Lebanon: 15000,
        Germany: 12000,
        UAE: 8000,
      },
      citiesInSyria: {
        Damascus: 80000,
        Aleppo: 45000,
        Homs: 25000,
        Latakia: 15000,
      },
    },
  })
  geographicSummary: {
    totalCountries: number;
    topCountries: Record<string, number>;
    citiesInSyria: Record<string, number>;
  };
}

/**
 * DTO for requesting analytics with filters
 */
// Update your AnalyticsRequestDto class:
export class AnalyticsRequestDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics period (ISO string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics period (ISO string)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID for multi-tenant analytics',
    example: 123,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  tenantId?: number;

  @ApiPropertyOptional({
    description: 'Filter by business model (B2B/B2C)',
    example: 'B2B',
    enum: ['B2B', 'B2C', 'B2B2C'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['B2B', 'B2C', 'B2B2C'])
  businessModel?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific module',
    example: 'orders',
    enum: ['orders', 'products', 'payments', 'users', 'vendors'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['orders', 'products', 'payments', 'users', 'vendors', 'auth', 'admin'])
  module?: string;

  @ApiPropertyOptional({
    description: 'Analytics granularity level',
    example: 'detailed',
    enum: ['summary', 'detailed', 'comprehensive'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['summary', 'detailed', 'comprehensive'])
  granularity?: string;

  @ApiPropertyOptional({
    description: 'Include performance metrics in response',
    example: true,
    default: false,
  })
  @IsOptional()
  includePerformance?: boolean;

  @ApiPropertyOptional({
    description: 'Include geographic breakdown',
    example: true,
    default: false,
  })
  @IsOptional()
  includeGeographic?: boolean;
}

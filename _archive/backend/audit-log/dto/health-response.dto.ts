import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ENHANCED Health Response DTO for SouqSyria Audit System
 *
 * Provides comprehensive system health monitoring including performance metrics,
 * resource utilization, and Syrian market-specific operational considerations.
 *
 * @version 2.0.0
 * @author SouqSyria Infrastructure Team
 */
export class HealthResponseDto {
  @ApiProperty({
    description: 'Overall service health status with detailed breakdown',
    enum: ['healthy', 'degraded', 'unhealthy', 'maintenance'],
    example: 'healthy',
  })
  status: 'healthy' | 'degraded' | 'unhealthy' | 'maintenance';

  @ApiProperty({
    description: 'Health score calculated from all metrics (0-100)',
    example: 94.5,
    minimum: 0,
    maximum: 100,
  })
  healthScore: number;

  @ApiProperty({
    description: 'Total audit logs currently stored in the system',
    example: 2500000,
  })
  totalAuditLogs: number;

  @ApiProperty({
    description: 'Number of audit logs created in the last 24 hours',
    example: 15000,
  })
  logsLast24h: number;

  @ApiProperty({
    description: 'Number of audit logs created in the last hour',
    example: 625,
  })
  logsLastHour: number;

  @ApiProperty({
    description: 'Detailed response time metrics for different operations',
    example: {
      average: '125ms',
      p50: '95ms',
      p95: '280ms',
      p99: '450ms',
      createLog: '45ms',
      searchLogs: '180ms',
      exportLogs: '2.3s',
    },
  })
  responseTimeMetrics: {
    average: string;
    p50: string; // 50th percentile
    p95: string; // 95th percentile
    p99: string; // 99th percentile
    createLog: string;
    searchLogs: string;
    exportLogs: string;
  };

  @ApiProperty({
    description: 'Comprehensive caching performance metrics',
    example: {
      hitRatio: 0.87,
      missRatio: 0.13,
      totalRequests: 50000,
      cacheHits: 43500,
      cacheMisses: 6500,
      evictionRate: 0.02,
      averageKeyTtl: '4h 23m',
    },
  })
  cacheMetrics: {
    hitRatio: number;
    missRatio: number;
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    evictionRate: number;
    averageKeyTtl: string;
  };

  @ApiProperty({
    description: 'Storage utilization with growth projections',
    example: {
      current: '45GB',
      dailyGrowth: '2.3GB',
      weeklyGrowth: '16.1GB',
      projectedFullIn: '180 days',
      compressionRatio: 0.68,
      unusedSpace: '155GB',
    },
  })
  storageMetrics: {
    current: string;
    dailyGrowth: string;
    weeklyGrowth: string;
    projectedFullIn: string;
    compressionRatio: number;
    unusedSpace: string;
  };

  @ApiProperty({
    description: 'Archive and retention compliance status',
    example: {
      archivedLogs: 1200000,
      logsEligibleForArchival: 25000,
      retentionCompliance: 98.5,
      oldestActiveLog: '2024-01-15T10:30:00Z',
      archivalBacklog: 0,
    },
  })
  archivalStatus: {
    archivedLogs: number;
    logsEligibleForArchival: number;
    retentionCompliance: number; // Percentage
    oldestActiveLog: Date;
    archivalBacklog: number;
  };

  @ApiProperty({
    description: 'Real-time database connection and performance metrics',
    example: {
      connectionPool: {
        activeConnections: 15,
        idleConnections: 35,
        totalConnections: 50,
        maxConnections: 100,
        waitingQueries: 0,
        connectionErrors: 0,
      },
      queryPerformance: {
        averageQueryTime: '23ms',
        slowQueries: 3,
        deadlocks: 0,
        tableScans: 12,
      },
    },
  })
  databaseMetrics: {
    connectionPool: {
      activeConnections: number;
      idleConnections: number;
      totalConnections: number;
      maxConnections: number;
      waitingQueries: number;
      connectionErrors: number;
    };
    queryPerformance: {
      averageQueryTime: string;
      slowQueries: number;
      deadlocks: number;
      tableScans: number;
    };
  };

  @ApiProperty({
    description: 'System resource utilization with alerts',
    example: {
      cpu: {
        usage: 45.2,
        loadAverage: [1.2, 1.8, 2.1],
        cores: 8,
        throttled: false,
      },
      memory: {
        usage: 67.8,
        available: '2.1GB',
        buffers: '512MB',
        cached: '1.8GB',
        swapUsed: 0,
      },
      disk: {
        usage: 72.1,
        available: '89GB',
        iopsRead: 145,
        iopsWrite: 89,
        latency: '3.2ms',
      },
    },
  })
  systemResources: {
    cpu: {
      usage: number;
      loadAverage: number[];
      cores: number;
      throttled: boolean;
    };
    memory: {
      usage: number;
      available: string;
      buffers: string;
      cached: string;
      swapUsed: number;
    };
    disk: {
      usage: number;
      available: string;
      iopsRead: number;
      iopsWrite: number;
      latency: string;
    };
  };

  @ApiProperty({
    description: 'API request success and error metrics',
    example: {
      last24h: {
        successRate: 99.8,
        errorRate: 0.2,
        totalRequests: 89500,
        failedRequests: 179,
        timeouts: 12,
        rateLimited: 34,
      },
      lastHour: {
        successRate: 99.9,
        errorRate: 0.1,
        totalRequests: 3750,
        failedRequests: 4,
        timeouts: 0,
        rateLimited: 2,
      },
    },
  })
  apiMetrics: {
    last24h: {
      successRate: number;
      errorRate: number;
      totalRequests: number;
      failedRequests: number;
      timeouts: number;
      rateLimited: number;
    };
    lastHour: {
      successRate: number;
      errorRate: number;
      totalRequests: number;
      failedRequests: number;
      timeouts: number;
      rateLimited: number;
    };
  };

  @ApiProperty({
    description: 'Background task and job processing status',
    example: {
      archival: {
        status: 'completed',
        lastRun: '2024-06-04T02:00:00Z',
        nextRun: '2024-06-05T02:00:00Z',
        duration: '45m 23s',
        recordsProcessed: 125000,
      },
      analytics: {
        status: 'running',
        progress: 73,
        eta: '12m 15s',
      },
      cleanup: {
        status: 'scheduled',
        nextRun: '2024-06-04T23:00:00Z',
      },
      pendingTasks: 0,
      failedTasks: 0,
    },
  })
  backgroundTasks: {
    archival: {
      status: string;
      lastRun: Date;
      nextRun: Date;
      duration: string;
      recordsProcessed: number;
    };
    analytics: {
      status: string;
      progress: number;
      eta: string;
    };
    cleanup: {
      status: string;
      nextRun: Date;
    };
    pendingTasks: number;
    failedTasks: number;
  };

  @ApiProperty({
    description: 'Data quality and integrity metrics',
    example: {
      corruptedRecords: 0,
      duplicateRecords: 23,
      orphanedRecords: 0,
      inconsistentTimestamps: 0,
      dataIntegrityScore: 99.97,
    },
  })
  dataQuality: {
    corruptedRecords: number;
    duplicateRecords: number;
    orphanedRecords: number;
    inconsistentTimestamps: number;
    dataIntegrityScore: number;
  };

  @ApiProperty({
    description: 'Security and compliance health indicators',
    example: {
      securityEventsLast24h: 156,
      blockedIps: 12,
      failedLogins: 89,
      dataRetentionCompliance: 100,
      encryptionStatus: 'healthy',
      lastSecurityScan: '2024-06-03T02:00:00Z',
    },
  })
  securityHealth: {
    securityEventsLast24h: number;
    blockedIps: number;
    failedLogins: number;
    dataRetentionCompliance: number;
    encryptionStatus: string;
    lastSecurityScan: Date;
  };

  @ApiPropertyOptional({
    description: 'Syrian market-specific operational metrics',
    example: {
      syrianIpTraffic: 78.5,
      diasporaTraffic: 21.5,
      sypCurrencyEvents: 1200,
      ramadanModeActive: false,
      sanctionsComplianceScore: 100,
      localBankingIntegrationStatus: 'healthy',
    },
  })
  syrianOperationalMetrics?: {
    syrianIpTraffic: number; // Percentage
    diasporaTraffic: number; // Percentage
    sypCurrencyEvents: number;
    ramadanModeActive: boolean;
    sanctionsComplianceScore: number;
    localBankingIntegrationStatus: string;
  };

  @ApiProperty({
    description: 'Health check execution metadata',
    example: '2024-06-04T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Service uptime with detailed breakdown',
    example: {
      total: '7 days, 14 hours, 32 minutes',
      lastRestart: '2024-05-28T20:58:00Z',
      plannedDowntime: '0 minutes',
      unplannedDowntime: '0 minutes',
      uptimePercentage: 100.0,
    },
  })
  uptime: {
    total: string;
    lastRestart: Date;
    plannedDowntime: string;
    unplannedDowntime: string;
    uptimePercentage: number;
  };

  @ApiProperty({
    description: 'Current service version and build information',
    example: {
      version: '1.2.3',
      buildNumber: '20240604.1',
      gitCommit: 'a1b2c3d',
      deployedAt: '2024-06-04T08:00:00Z',
      environment: 'production',
    },
  })
  versionInfo: {
    version: string;
    buildNumber: string;
    gitCommit: string;
    deployedAt: Date;
    environment: string;
  };

  @ApiProperty({
    description: 'Prioritized health warnings and alerts',
    example: [
      {
        severity: 'warning',
        category: 'performance',
        message: 'Cache hit ratio below optimal threshold (85%)',
        impact: 'Increased database load',
        recommendation: 'Review cache expiration policies',
      },
      {
        severity: 'info',
        category: 'storage',
        message: 'Storage usage approaching 80% capacity',
        impact: 'May need expansion in 3 months',
        recommendation: 'Plan storage expansion or implement archival',
      },
    ],
  })
  alerts: Array<{
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: string;
    message: string;
    impact: string;
    recommendation: string;
  }>;

  @ApiProperty({
    description: 'Operational recommendations based on current metrics',
    example: [
      'Consider increasing cache TTL for static audit queries',
      'Schedule maintenance window for index optimization',
      'Review archival policies for Syrian regulatory compliance',
    ],
  })
  recommendations: string[];
}

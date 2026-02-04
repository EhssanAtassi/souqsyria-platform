import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ENHANCED Security Monitoring Response DTO for SouqSyria
 *
 * Provides comprehensive real-time security metrics, threat detection,
 * and Syrian market-specific security considerations for enterprise-scale operations.
 *
 * @version 2.0.0
 * @author SouqSyria Security Team
 */
export class SecurityMonitoringResponseDto {
  @ApiProperty({
    description: 'Timestamp when security monitoring data was generated (UTC)',
    example: '2024-06-04T10:30:00Z',
  })
  timestamp: Date;

  @ApiProperty({
    description:
      'High-risk security events detected in recent monitoring period',
    example: [
      {
        id: 12345,
        action: 'bulk_product_update',
        actorId: 456,
        actorType: 'vendor',
        riskScore: 85,
        detectedAt: '2024-06-04T10:25:00Z',
        severity: 'critical',
        ipAddress: '192.168.1.100',
        country: 'Syria',
        city: 'Damascus',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        correlationEvents: ['rapid_price_changes', 'inventory_manipulation'],
        mitigationStatus: 'auto_blocked',
      },
    ],
  })
  highRiskEvents: Array<{
    id: number;
    action: string;
    actorId: number;
    actorType: string;
    riskScore: number; // 0-100 scale
    detectedAt: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    ipAddress?: string;
    country?: string;
    city?: string;
    userAgent?: string;
    correlationEvents?: string[]; // Related suspicious activities
    mitigationStatus?:
      | 'monitoring'
      | 'rate_limited'
      | 'auto_blocked'
      | 'escalated';
  }>;

  @ApiProperty({
    description: 'Recent anomalies detected by ML-powered detection algorithms',
    example: [
      {
        id: 12346,
        action: 'rapid_login_attempts',
        actorId: 789,
        ipAddress: '192.168.1.100',
        isAnomaly: true,
        detectedAt: '2024-06-04T10:20:00Z',
        anomalyType: 'rate_limit_exceeded',
        severity: 'high',
        confidence: 0.92,
        baselineDeviation: 350,
        autoResponseTaken: 'temporary_account_lock',
      },
    ],
  })
  recentAnomalies: Array<{
    id: number;
    action: string;
    actorId: number;
    ipAddress?: string;
    isAnomaly: boolean;
    detectedAt: Date;
    anomalyType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number; // ML confidence score 0.0-1.0
    baselineDeviation: number; // How much it deviates from normal
    autoResponseTaken?: string; // Automated mitigation applied
  }>;

  @ApiProperty({
    description: 'Suspicious IP addresses requiring security attention',
    example: [
      {
        ipAddress: '192.168.1.100',
        eventCount: 150,
        firstSeen: '2024-06-04T09:00:00Z',
        lastSeen: '2024-06-04T10:30:00Z',
        riskLevel: 'high',
        country: 'Syria',
        city: 'Aleppo',
        isp: 'SyriaTel',
        isVpn: false,
        isTor: false,
        threatIntelMatch: false,
        actionsBlocked: 12,
        primaryTargets: ['vendor_dashboard', 'payment_endpoints'],
      },
    ],
  })
  suspiciousIpAddresses: Array<{
    ipAddress: string;
    eventCount: number;
    firstSeen: Date;
    lastSeen: Date;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    country?: string;
    city?: string;
    isp?: string;
    isVpn: boolean;
    isTor: boolean;
    threatIntelMatch: boolean;
    actionsBlocked: number;
    primaryTargets: string[]; // Which endpoints/modules were targeted
  }>;

  @ApiProperty({
    description: 'Comprehensive security metrics for executive dashboard',
    example: {
      totalEventsLastHour: 1245,
      averageRiskScore: 25.5,
      suspiciousIpCount: 12,
      failedLoginAttempts: 45,
      criticalSecurityEvents: 3,
      anomaliesDetected: 8,
      vendorAccountsAtRisk: 2,
      financialEventsBlocked: 5,
      syriaTelIpEvents: 450,
      mtnIpEvents: 380,
      internationalTraffic: 280,
      vendorKycFlagged: 1,
    },
  })
  summary: {
    totalEventsLastHour: number;
    averageRiskScore: number;
    suspiciousIpCount: number;
    failedLoginAttempts: number;
    criticalSecurityEvents: number;
    anomaliesDetected: number;
    vendorAccountsAtRisk: number;
    financialEventsBlocked: number;
    // Syrian ISP-specific metrics
    syriaTelIpEvents: number;
    mtnIpEvents: number;
    internationalTraffic: number;
    vendorKycFlagged: number;
  };

  @ApiProperty({
    description: 'Geographic distribution with Syrian governorate details',
    example: [
      {
        country: 'Syria',
        governorate: 'Damascus',
        eventCount: 800,
        riskScore: 15,
      },
      {
        country: 'Syria',
        governorate: 'Aleppo',
        eventCount: 200,
        riskScore: 25,
      },
      { country: 'Turkey', governorate: null, eventCount: 150, riskScore: 35 },
      { country: 'Lebanon', governorate: null, eventCount: 95, riskScore: 40 },
    ],
  })
  geographicDistribution: Array<{
    country: string;
    governorate?: string; // For Syrian locations
    eventCount: number;
    riskScore: number;
  }>;

  @ApiProperty({
    description: 'Real-time security trends for the last 24 hours',
    example: [
      {
        hour: '09:00',
        eventCount: 120,
        averageRiskScore: 20,
        blockedEvents: 5,
      },
      {
        hour: '10:00',
        eventCount: 145,
        averageRiskScore: 28,
        blockedEvents: 8,
      },
    ],
  })
  recentTrends: Array<{
    hour: string;
    eventCount: number;
    averageRiskScore: number;
    blockedEvents: number;
  }>;

  @ApiProperty({
    description: 'Overall security threat level with Syrian context',
    enum: ['low', 'medium', 'high', 'critical'],
    example: 'medium',
  })
  threatLevel: 'low' | 'medium' | 'high' | 'critical';

  @ApiProperty({
    description: 'AI-powered security recommendations prioritized by impact',
    example: [
      {
        priority: 'high',
        category: 'ip_monitoring',
        action:
          'Monitor IP address 192.168.1.100 for continued suspicious activity',
        automatable: true,
        estimatedImpact: 'Prevent potential vendor account compromise',
      },
      {
        priority: 'medium',
        category: 'vendor_oversight',
        action: 'Review bulk operations by vendor ID 456',
        automatable: false,
        estimatedImpact: 'Validate legitimate business operations',
      },
    ],
  })
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    action: string;
    automatable: boolean;
    estimatedImpact: string;
  }>;

  @ApiPropertyOptional({
    description:
      'Syrian-specific security considerations and sanctions compliance',
    example: {
      sanctionsCompliantTraffic: 98.5,
      localBankingEventsSecure: true,
      syrianGovernmentIpDetected: false,
      lebaneseBorderTrafficRisk: 'low',
      turkishProxyDetected: false,
    },
  })
  syrianSecurityContext?: {
    sanctionsCompliantTraffic: number; // Percentage
    localBankingEventsSecure: boolean;
    syrianGovernmentIpDetected: boolean;
    lebaneseBorderTrafficRisk: 'low' | 'medium' | 'high';
    turkishProxyDetected: boolean;
  };

  @ApiProperty({
    description: 'Performance metrics for security monitoring system itself',
    example: {
      detectionLatency: 45,
      falsePositiveRate: 0.02,
      systemUptime: 99.98,
      lastModelUpdate: '2024-06-01T00:00:00Z',
    },
  })
  systemPerformance: {
    detectionLatency: number; // Milliseconds
    falsePositiveRate: number; // 0.0-1.0
    systemUptime: number; // Percentage
    lastModelUpdate: Date;
  };
}

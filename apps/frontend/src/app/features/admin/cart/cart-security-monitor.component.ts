/**
 * @file cart-security-monitor.component.ts
 * @description Real-Time Security Analytics Dashboard for SouqSyria Cart System (Week 3)
 *
 * FEATURES:
 * - Real-time fraud detection monitoring with risk score distribution
 * - Device fingerprint anomaly tracking
 * - Threat response analytics with escalation levels
 * - Geographic security insights (impossible travel, suspicious countries)
 * - Bot and virtual device detection metrics
 * - Security event timeline with filtering
 * - Alert management and notification status
 *
 * PERFORMANCE:
 * - Auto-refresh every 30 seconds with real-time updates
 * - Efficient data visualization with Angular signals
 * - Material Design UI components for enterprise feel
 * - Responsive layout for desktop and mobile admin access
 *
 * @author SouqSyria Development Team
 * @version 3.0.0 - Week 3 Security Analytics
 */

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subject, switchMap, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Security Analytics Data Interface
 * Represents comprehensive security metrics from backend
 */
interface SecurityAnalytics {
  // Fraud Detection Metrics
  fraudMetrics: {
    totalAssessments: number;
    averageRiskScore: number;
    highRiskCount: number;
    criticalRiskCount: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    topTriggeredRules: Array<{
      rule: string;
      count: number;
      avgRiskScore: number;
    }>;
  };

  // Device Fingerprint Metrics
  deviceMetrics: {
    totalFingerprints: number;
    uniqueDevices: number;
    virtualDeviceDetections: number;
    botDetections: number;
    anomalyCount: number;
    averageTrustScore: number;
    deviceTypeDistribution: {
      mobile: number;
      desktop: number;
      tablet: number;
      unknown: number;
    };
  };

  // Threat Response Metrics
  threatMetrics: {
    totalResponses: number;
    blockedRequests: number;
    challengedRequests: number;
    escalatedThreats: number;
    averageResponseTime: number;
    actionDistribution: {
      allow: number;
      log: number;
      challenge: number;
      rate_limit: number;
      block: number;
      escalate: number;
    };
  };

  // Geographic Security Metrics
  geoMetrics: {
    impossibleTravelDetections: number;
    suspiciousCountries: Array<{
      country: string;
      count: number;
      avgRiskScore: number;
    }>;
    rapidIpChanges: number;
    proxyVpnDetections: number;
  };

  // Recent Security Events (last 24 hours)
  recentEvents: Array<{
    id: string;
    timestamp: string;
    riskScore: number;
    riskLevel: string;
    threatResponse: string;
    userId: string | null;
    clientIP: string;
    triggeredRules: string[];
    deviceFingerprint: string;
  }>;

  // System Health
  systemHealth: {
    status: 'healthy' | 'degraded' | 'critical';
    lastUpdateTime: string;
    securityServicesOnline: boolean;
    fraudDetectionLatency: number;
  };
}

/**
 * Chart Data Interface for visualization
 */
interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }>;
}

/**
 * Real-Time Cart Security Analytics Dashboard Component
 *
 * Provides comprehensive security monitoring for the SouqSyria cart system,
 * displaying ML-based fraud detection metrics, device anomalies, threat responses,
 * and geographic security insights in real-time.
 *
 * KEY FEATURES:
 * - Multi-tab interface for organized security data
 * - Real-time auto-refresh with 30-second interval
 * - Color-coded risk indicators and alerts
 * - Filterable security event timeline
 * - Export capabilities for security reports
 * - Responsive Material Design UI
 *
 * TABS:
 * 1. Overview: Key metrics and system health
 * 2. Fraud Detection: ML-based risk assessment analytics
 * 3. Device Security: Fingerprint and anomaly tracking
 * 4. Threat Response: Automated response analytics
 * 5. Geographic Security: Location-based threat intelligence
 * 6. Security Events: Real-time event timeline with filtering
 */
@Component({
  selector: 'app-cart-security-monitor',
  templateUrl: './cart-security-monitor.component.html',
  styleUrls: ['./cart-security-monitor.component.scss'],
  standalone: false,
})
export class CartSecurityMonitorComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds
  private readonly API_BASE_URL = '/api/admin/cart-monitor';

  // Loading and error states
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  lastRefreshTime = signal<Date>(new Date());

  // Security Analytics Data
  securityData = signal<SecurityAnalytics | null>(null);

  // Selected tab index
  selectedTabIndex = signal<number>(0);

  // Security event filtering
  eventFilter = signal<string>('all'); // 'all' | 'high_risk' | 'blocked' | 'escalated'
  filteredEvents = computed(() => {
    const data = this.securityData();
    if (!data) return [];

    const filter = this.eventFilter();
    let events = data.recentEvents;

    switch (filter) {
      case 'high_risk':
        events = events.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical');
        break;
      case 'blocked':
        events = events.filter(e => e.threatResponse === 'block');
        break;
      case 'escalated':
        events = events.filter(e => e.threatResponse === 'escalate');
        break;
    }

    return events;
  });

  // Computed metrics for dashboard cards
  totalRiskScore = computed(() => {
    const data = this.securityData();
    return data?.fraudMetrics.averageRiskScore || 0;
  });

  criticalThreats = computed(() => {
    const data = this.securityData();
    return data?.fraudMetrics.criticalRiskCount || 0;
  });

  blockedRequests = computed(() => {
    const data = this.securityData();
    return data?.threatMetrics.blockedRequests || 0;
  });

  virtualDevices = computed(() => {
    const data = this.securityData();
    return data?.deviceMetrics.virtualDeviceDetections || 0;
  });

  impossibleTravel = computed(() => {
    const data = this.securityData();
    return data?.geoMetrics.impossibleTravelDetections || 0;
  });

  // System health indicator
  systemHealth = computed(() => {
    const data = this.securityData();
    const status = data?.systemHealth.status || 'healthy';

    switch (status) {
      case 'critical':
        return { status, color: 'warn', icon: 'error', text: 'Critical' };
      case 'degraded':
        return { status, color: 'accent', icon: 'warning', text: 'Degraded' };
      default:
        return { status, color: 'primary', icon: 'check_circle', text: 'Healthy' };
    }
  });

  // Risk distribution chart data
  riskDistributionChart = computed(() => {
    const data = this.securityData();
    if (!data) return null;

    const dist = data.fraudMetrics.riskDistribution;
    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
      datasets: [{
        label: 'Risk Distribution',
        data: [dist.low, dist.medium, dist.high, dist.critical],
        backgroundColor: ['#4caf50', '#ff9800', '#ff5722', '#f44336'],
      }],
    };
  });

  // Threat response chart data
  threatResponseChart = computed(() => {
    const data = this.securityData();
    if (!data) return null;

    const actions = data.threatMetrics.actionDistribution;
    return {
      labels: ['Allow', 'Log', 'Challenge', 'Rate Limit', 'Block', 'Escalate'],
      datasets: [{
        label: 'Threat Responses',
        data: [
          actions.allow,
          actions.log,
          actions.challenge,
          actions.rate_limit,
          actions.block,
          actions.escalate,
        ],
        backgroundColor: '#3f51b5',
      }],
    };
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  /**
   * Component initialization
   * Sets up auto-refresh interval and loads initial data
   */
  ngOnInit(): void {
    this.loadSecurityAnalytics();

    // Auto-refresh every 30 seconds
    interval(this.REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() => this.http.get<SecurityAnalytics>(`${this.API_BASE_URL}/security-analytics`)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (data) => {
          this.securityData.set(data);
          this.lastRefreshTime.set(new Date());
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to refresh security analytics', err);
          this.error.set('Failed to refresh data');
        },
      });
  }

  /**
   * Component cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load security analytics data from backend
   */
  async loadSecurityAnalytics(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const data = await this.http
        .get<SecurityAnalytics>(`${this.API_BASE_URL}/security-analytics`)
        .toPromise();

      this.securityData.set(data);
      this.lastRefreshTime.set(new Date());
    } catch (err) {
      console.error('Failed to load security analytics', err);
      this.error.set('Failed to load security analytics');
      this.snackBar.open('Failed to load security analytics', 'Dismiss', {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Manual refresh of security analytics
   */
  async refreshData(): Promise<void> {
    await this.loadSecurityAnalytics();
    this.snackBar.open('Security analytics refreshed', 'Dismiss', {
      duration: 2000,
    });
  }

  /**
   * Change event filter
   */
  setEventFilter(filter: string): void {
    this.eventFilter.set(filter);
  }

  /**
   * Export security analytics as CSV
   */
  exportSecurityData(): void {
    const data = this.securityData();
    if (!data) return;

    // Create CSV content
    const csvContent = this.generateCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `cart-security-analytics-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('Security analytics exported', 'Dismiss', {
      duration: 2000,
    });
  }

  /**
   * Generate CSV content from security data
   */
  private generateCSV(data: SecurityAnalytics): string {
    const headers = [
      'Metric',
      'Value',
    ];

    const rows = [
      ['Total Risk Assessments', data.fraudMetrics.totalAssessments.toString()],
      ['Average Risk Score', data.fraudMetrics.averageRiskScore.toFixed(2)],
      ['High Risk Count', data.fraudMetrics.highRiskCount.toString()],
      ['Critical Risk Count', data.fraudMetrics.criticalRiskCount.toString()],
      ['Total Devices', data.deviceMetrics.totalFingerprints.toString()],
      ['Virtual Devices', data.deviceMetrics.virtualDeviceDetections.toString()],
      ['Bot Detections', data.deviceMetrics.botDetections.toString()],
      ['Blocked Requests', data.threatMetrics.blockedRequests.toString()],
      ['Escalated Threats', data.threatMetrics.escalatedThreats.toString()],
      ['Impossible Travel', data.geoMetrics.impossibleTravelDetections.toString()],
      ['System Health', data.systemHealth.status],
    ];

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Get risk level color for UI display
   */
  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'critical': return 'warn';
      case 'high': return 'accent';
      case 'medium': return 'primary';
      default: return '';
    }
  }

  /**
   * Get threat response icon
   */
  getThreatResponseIcon(action: string): string {
    switch (action) {
      case 'block': return 'block';
      case 'escalate': return 'priority_high';
      case 'challenge': return 'security';
      case 'rate_limit': return 'speed';
      case 'log': return 'description';
      default: return 'check_circle';
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

/**
 * @file audit-log-seeder.service.ts
 * @description Comprehensive Audit Log Seeding Service for SouqSyria Platform
 *
 * COMPREHENSIVE SEEDING FEATURES:
 * - Enterprise-grade audit trail generation with realistic Syrian e-commerce scenarios
 * - Multi-actor audit logs (admin, vendor, user, system, API clients)
 * - Financial event tracking with SYP/USD/EUR transaction simulation
 * - Security event generation for compliance and monitoring testing
 * - Compliance audit logs for GDPR, PCI DSS, and Syrian commerce law
 * - Geographic distribution across Syrian governorates and international locations
 * - Risk scoring and anomaly detection simulation
 * - Workflow and approval process audit trails
 * - Performance monitoring and error tracking simulation
 * - Multi-tenant B2B/B2C audit log segregation
 * - Tamper-evident checksums for critical operations
 * - Data retention policy compliance simulation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Entities
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Audit Log seeding result interface for API responses
 */
export interface AuditLogSeederResult {
  success: boolean;
  audit_logs_created: number;
  financial_events: number;
  security_events: number;
  compliance_events: number;
  critical_events: number;
  actors_simulated: number;
  execution_time_ms: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  geographic_distribution: Record<string, number>;
  performance_metrics: {
    logs_per_second: number;
    average_response_time_ms: number;
    checksum_generation_rate: number;
  };
}

/**
 * Comprehensive Audit Log Seeding Service
 * Creates realistic audit trail for enterprise monitoring and compliance
 */
@Injectable()
export class AuditLogSeederService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Main seeding method - creates comprehensive audit log system
   */
  async seedAuditLogs(): Promise<AuditLogSeederResult> {
    const startTime = Date.now();

    try {
      // Clear existing data
      await this.clearExistingData();

      // Get users for actor simulation
      const users = await this.userRepository.find({ take: 20 });

      // Create audit logs
      const auditLogs = await this.createAuditLogs(users);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Calculate analytics
      const analytics = this.calculateAnalytics(auditLogs, executionTime);

      return {
        success: true,
        audit_logs_created: auditLogs.length,
        financial_events: auditLogs.filter(log => log.isFinancialEvent).length,
        security_events: auditLogs.filter(log => log.isSecurityEvent).length,
        compliance_events: auditLogs.filter(log => log.isComplianceEvent).length,
        critical_events: auditLogs.filter(log => log.severity === 'critical').length,
        actors_simulated: new Set(auditLogs.map(log => `${log.actorType}_${log.actorId}`)).size,
        execution_time_ms: executionTime,
        ...analytics,
      };
    } catch (error) {
      console.error('Audit log seeding failed:', error);
      throw new Error(`Audit log seeding failed: ${error.message}`);
    }
  }

  /**
   * Create comprehensive audit logs for different scenarios
   */
  private async createAuditLogs(users: User[]): Promise<AuditLog[]> {
    const auditLogs: AuditLog[] = [];

    // Create different types of audit logs
    const logGenerators = [
      () => this.generateUserActivityLogs(users),
      () => this.generateFinancialEventLogs(users),
      () => this.generateSecurityEventLogs(users),
      () => this.generateComplianceEventLogs(users),
      () => this.generateSystemEventLogs(),
      () => this.generateAPIEventLogs(),
      () => this.generateVendorEventLogs(users),
      () => this.generateAdminEventLogs(users),
      () => this.generateWorkflowEventLogs(users),
      () => this.generateErrorEventLogs(users),
    ];

    for (const generator of logGenerators) {
      const logs = await generator();
      auditLogs.push(...logs);
    }

    return auditLogs;
  }

  /**
   * Generate user activity audit logs
   */
  private async generateUserActivityLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const activities = [
      'user.login', 'user.logout', 'user.profile_update', 'user.password_change',
      'product.view', 'product.search', 'cart.add_item', 'cart.update',
      'order.create', 'order.view', 'order.cancel', 'wishlist.add'
    ];

    for (let i = 0; i < 50; i++) {
      const user = this.getRandomUser(users);
      const activity = this.getRandomItem(activities);
      
      const log = this.auditLogRepository.create({
        action: activity,
        module: activity.split('.')[0],
        actorId: user?.id,
        actorType: 'user',
        actorEmail: user?.email,
        actorName: user?.fullName || 'User',
        entityType: activity.split('.')[0],
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: this.getRandomSeverity(['low', 'medium']),
        operationType: this.mapActionToOperation(activity),
        ipAddress: this.generateRandomIP(),
        userAgent: this.generateRandomUserAgent(),
        sessionId: this.generateSessionId(),
        requestId: this.generateRequestId(),
        country: this.getRandomCountry(),
        city: this.getRandomSyrianCity(),
        businessModel: 'B2C',
        processingTimeMs: Math.floor(Math.random() * 1000) + 50,
        wasSuccessful: Math.random() > 0.1, // 90% success rate
        createdAt: this.generateRandomDate(),
      });

      // Set geographic coordinates for Syrian cities
      this.setGeographicCoordinates(log);
      
      // Calculate risk score
      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate financial event audit logs
   */
  private async generateFinancialEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const financialActivities = [
      'payment.process', 'payment.refund', 'payment.capture',
      'commission.calculate', 'commission.payout', 'order.payment_received',
      'vendor.payout', 'subscription.charge', 'wallet.topup'
    ];

    const currencies = ['SYP', 'USD', 'EUR'];

    for (let i = 0; i < 30; i++) {
      const user = this.getRandomUser(users);
      const activity = this.getRandomItem(financialActivities);
      const currency = this.getRandomItem(currencies);
      const amount = this.generateFinancialAmount(currency);
      
      const log = this.auditLogRepository.create({
        action: activity,
        module: 'payment',
        actorId: user?.id,
        actorType: 'user',
        actorEmail: user?.email,
        actorName: user?.fullName || 'User',
        entityType: 'payment',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: amount > 100000 ? 'high' : amount > 10000 ? 'medium' : 'low',
        operationType: 'process',
        isFinancialEvent: true,
        monetaryAmount: amount,
        currency: currency,
        transactionReference: this.generateTransactionReference(),
        ipAddress: this.generateRandomIP(),
        country: this.getRandomCountry(),
        city: this.getRandomSyrianCity(),
        businessModel: amount > 50000 ? 'B2B' : 'B2C',
        processingTimeMs: Math.floor(Math.random() * 2000) + 100,
        wasSuccessful: Math.random() > 0.05, // 95% success rate for financial
        regulatoryCategory: 'Syrian_Commerce_Law',
        createdAt: this.generateRandomDate(),
      });

      // Generate checksum for financial events
      log.checksum = log.generateChecksum();
      log.riskScore = log.calculateRiskScore();
      log.retentionDate = log.calculateRetentionDate();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate security event audit logs
   */
  private async generateSecurityEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const securityEvents = [
      'auth.login_failed', 'auth.suspicious_login', 'auth.password_reset',
      'permission.denied', 'api.rate_limit_exceeded', 'security.anomaly_detected',
      'admin.privilege_escalation', 'data.unauthorized_access'
    ];

    for (let i = 0; i < 25; i++) {
      const user = this.getRandomUser(users);
      const event = this.getRandomItem(securityEvents);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'security',
        actorId: user?.id,
        actorType: event.includes('failed') ? 'anonymous' : 'user',
        actorEmail: user?.email,
        actorName: user?.fullName || 'Anonymous',
        entityType: 'security_event',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: event.includes('failed') || event.includes('suspicious') ? 'high' : 'medium',
        operationType: 'read',
        isSecurityEvent: true,
        isAnomaly: event.includes('anomaly') || event.includes('suspicious'),
        ipAddress: this.generateRandomIP(),
        userAgent: this.generateRandomUserAgent(),
        sessionId: this.generateSessionId(),
        country: this.getRandomCountry(),
        city: this.getRandomSyrianCity(),
        processingTimeMs: Math.floor(Math.random() * 500) + 50,
        wasSuccessful: !event.includes('failed'),
        errorCode: event.includes('failed') ? 'AUTH_FAILED' : undefined,
        errorMessage: event.includes('failed') ? 'Authentication failed' : undefined,
        createdAt: this.generateRandomDate(),
      });

      // Generate checksum for security events
      log.checksum = log.generateChecksum();
      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate compliance event audit logs
   */
  private async generateComplianceEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const complianceEvents = [
      'gdpr.data_export', 'gdpr.data_deletion', 'gdpr.consent_update',
      'pci.card_data_access', 'audit.compliance_check', 'privacy.data_access',
      'syrian_law.tax_calculation', 'syrian_law.vendor_verification'
    ];

    const regulatoryCategories = ['GDPR', 'PCI_DSS', 'Syrian_Commerce_Law'];

    for (let i = 0; i < 20; i++) {
      const user = this.getRandomUser(users);
      const event = this.getRandomItem(complianceEvents);
      const category = this.getRandomItem(regulatoryCategories);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'compliance',
        actorId: user?.id,
        actorType: 'admin',
        actorEmail: user?.email,
        actorName: user?.fullName || 'Admin',
        entityType: 'compliance_record',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: 'high',
        operationType: event.includes('deletion') ? 'delete' : 'read',
        isComplianceEvent: true,
        regulatoryCategory: category,
        ipAddress: this.generateRandomIP(),
        country: this.getRandomCountry(),
        businessModel: 'B2C',
        processingTimeMs: Math.floor(Math.random() * 1000) + 200,
        wasSuccessful: true,
        createdAt: this.generateRandomDate(),
      });

      log.checksum = log.generateChecksum();
      log.riskScore = log.calculateRiskScore();
      log.retentionDate = log.calculateRetentionDate();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate system event audit logs
   */
  private async generateSystemEventLogs(): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const systemEvents = [
      'system.backup_started', 'system.backup_completed', 'system.maintenance_mode',
      'system.cache_cleared', 'system.config_updated', 'system.service_restart',
      'database.migration_run', 'email.bulk_send', 'cron.job_executed'
    ];

    for (let i = 0; i < 15; i++) {
      const event = this.getRandomItem(systemEvents);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'system',
        actorType: 'system',
        actorName: 'System Process',
        entityType: 'system_operation',
        entityId: Math.floor(Math.random() * 100) + 1,
        severity: event.includes('maintenance') ? 'critical' : 'low',
        operationType: event.includes('started') || event.includes('executed') ? 'process' : 'update',
        processingTimeMs: Math.floor(Math.random() * 5000) + 1000,
        wasSuccessful: Math.random() > 0.02, // 98% success rate for system
        createdAt: this.generateRandomDate(),
      });

      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate API event audit logs
   */
  private async generateAPIEventLogs(): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const apiEvents = [
      'api.product_list', 'api.order_create', 'api.user_auth',
      'api.payment_process', 'api.vendor_update', 'api.bulk_import',
      'webhook.order_status', 'webhook.payment_status'
    ];

    for (let i = 0; i < 35; i++) {
      const event = this.getRandomItem(apiEvents);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'api',
        actorType: 'api_client',
        actorName: `API Client ${Math.floor(Math.random() * 10) + 1}`,
        entityType: event.split('.')[1]?.split('_')[0] || 'api_request',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: event.includes('bulk') ? 'medium' : 'low',
        operationType: this.mapActionToOperation(event),
        ipAddress: this.generateRandomIP(),
        apiVersion: `v${Math.floor(Math.random() * 3) + 1}`,
        requestId: this.generateRequestId(),
        processingTimeMs: Math.floor(Math.random() * 2000) + 100,
        wasSuccessful: Math.random() > 0.05, // 95% success rate
        createdAt: this.generateRandomDate(),
      });

      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate vendor event audit logs
   */
  private async generateVendorEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const vendorEvents = [
      'vendor.registration', 'vendor.verification', 'vendor.approval',
      'product.create', 'product.update', 'inventory.update',
      'order.fulfill', 'commission.earned'
    ];

    for (let i = 0; i < 25; i++) {
      const user = this.getRandomUser(users);
      const event = this.getRandomItem(vendorEvents);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'vendor',
        actorId: user?.id,
        actorType: 'vendor',
        actorEmail: user?.email,
        actorName: user?.fullName || 'Vendor',
        entityType: event.split('.')[0],
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: event.includes('approval') ? 'high' : 'medium',
        operationType: this.mapActionToOperation(event),
        businessModel: 'B2B',
        country: 'Syria',
        city: this.getRandomSyrianCity(),
        processingTimeMs: Math.floor(Math.random() * 1500) + 200,
        wasSuccessful: Math.random() > 0.08, // 92% success rate
        workflowStage: event.includes('approval') ? 'approved' : undefined,
        createdAt: this.generateRandomDate(),
      });

      this.setGeographicCoordinates(log);
      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate admin event audit logs
   */
  private async generateAdminEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const adminEvents = [
      'admin.user_suspend', 'admin.vendor_approve', 'admin.product_moderate',
      'admin.order_cancel', 'admin.refund_approve', 'admin.system_config',
      'admin.permission_grant', 'admin.role_assign'
    ];

    for (let i = 0; i < 20; i++) {
      const user = this.getRandomUser(users);
      const event = this.getRandomItem(adminEvents);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'admin',
        actorId: user?.id,
        actorType: 'admin',
        actorEmail: user?.email,
        actorName: user?.fullName || 'Admin',
        entityType: event.split('.')[1]?.split('_')[0] || 'system',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: event.includes('suspend') || event.includes('permission') ? 'critical' : 'high',
        operationType: this.mapActionToOperation(event),
        ipAddress: this.generateRandomIP(),
        sessionId: this.generateSessionId(),
        processingTimeMs: Math.floor(Math.random() * 1000) + 300,
        wasSuccessful: true, // Admin actions typically succeed
        createdAt: this.generateRandomDate(),
      });

      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate workflow event audit logs
   */
  private async generateWorkflowEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const workflowEvents = [
      'workflow.order_processing', 'workflow.vendor_onboarding', 'workflow.product_approval',
      'workflow.payment_verification', 'workflow.kyc_verification'
    ];

    const stages = ['pending', 'in_progress', 'approved', 'rejected', 'completed'];

    for (let i = 0; i < 15; i++) {
      const user = this.getRandomUser(users);
      const event = this.getRandomItem(workflowEvents);
      const stage = this.getRandomItem(stages);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'workflow',
        actorId: user?.id,
        actorType: 'admin',
        actorEmail: user?.email,
        actorName: user?.fullName || 'Admin',
        entityType: 'workflow',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: stage === 'rejected' ? 'high' : 'medium',
        operationType: stage === 'approved' ? 'approve' : stage === 'rejected' ? 'reject' : 'process',
        workflowStage: stage,
        approvedBy: stage === 'approved' ? user?.id : undefined,
        approvedAt: stage === 'approved' ? new Date() : undefined,
        processingTimeMs: Math.floor(Math.random() * 3000) + 500,
        wasSuccessful: stage !== 'rejected',
        createdAt: this.generateRandomDate(),
      });

      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  /**
   * Generate error event audit logs
   */
  private async generateErrorEventLogs(users: User[]): Promise<AuditLog[]> {
    const logs: AuditLog[] = [];
    const errorEvents = [
      'error.payment_failed', 'error.api_timeout', 'error.database_connection',
      'error.validation_failed', 'error.service_unavailable'
    ];

    const errorCodes = ['PAYMENT_001', 'API_TIMEOUT', 'DB_CONN_001', 'VALIDATION_ERR', 'SERVICE_DOWN'];

    for (let i = 0; i < 10; i++) {
      const user = this.getRandomUser(users);
      const event = this.getRandomItem(errorEvents);
      const errorCode = this.getRandomItem(errorCodes);
      
      const log = this.auditLogRepository.create({
        action: event,
        module: 'error',
        actorId: user?.id,
        actorType: 'system',
        actorName: 'System',
        entityType: 'error_event',
        entityId: Math.floor(Math.random() * 1000) + 1,
        severity: 'high',
        operationType: 'process',
        processingTimeMs: Math.floor(Math.random() * 10000) + 1000,
        wasSuccessful: false,
        errorCode: errorCode,
        errorMessage: `System error: ${event.replace('error.', '').replace('_', ' ')}`,
        createdAt: this.generateRandomDate(),
      });

      log.riskScore = log.calculateRiskScore();

      const savedLog = await this.auditLogRepository.save(log);
      logs.push(savedLog);
    }

    return logs;
  }

  // Helper methods

  private getRandomUser(users: User[]): User | null {
    return users.length > 0 ? users[Math.floor(Math.random() * users.length)] : null;
  }

  private getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  private getRandomSeverity(severities: string[] = ['low', 'medium', 'high', 'critical']): any {
    return this.getRandomItem(severities);
  }

  private mapActionToOperation(action: string): any {
    const operationMap: Record<string, string> = {
      'create': 'create',
      'update': 'update',
      'delete': 'delete',
      'view': 'read',
      'process': 'process',
      'approve': 'approve',
      'reject': 'reject',
      'cancel': 'cancel',
    };

    for (const [key, value] of Object.entries(operationMap)) {
      if (action.includes(key)) {
        return value;
      }
    }

    return 'process';
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  private generateRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      'Mozilla/5.0 (Android 11; Mobile; rv:91.0) Gecko/91.0',
    ];
    return this.getRandomItem(userAgents);
  }

  private generateSessionId(): string {
    return `sess_${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateRequestId(): string {
    return `req_${Math.random().toString(36).substr(2, 12)}`;
  }

  private generateTransactionReference(): string {
    return `txn_${Math.random().toString(36).substr(2, 10).toUpperCase()}`;
  }

  private getRandomCountry(): string {
    const countries = ['Syria', 'Turkey', 'Lebanon', 'Jordan', 'Germany', 'UAE', 'Saudi Arabia'];
    return this.getRandomItem(countries);
  }

  private getRandomSyrianCity(): string {
    const cities = ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Daraa', 'Deir ez-Zor'];
    return this.getRandomItem(cities);
  }

  private generateFinancialAmount(currency: string): number {
    const baseAmounts = {
      'SYP': [5000, 25000, 100000, 500000, 1000000],
      'USD': [20, 100, 500, 2000, 5000],
      'EUR': [18, 90, 450, 1800, 4500],
    };

    const amounts = baseAmounts[currency] || baseAmounts['USD'];
    return Number(this.getRandomItem(amounts)) + Math.floor(Math.random() * 1000);
  }

  private setGeographicCoordinates(log: AuditLog): void {
    const coordinates: Record<string, { lat: number; lng: number }> = {
      'Damascus': { lat: 33.5138, lng: 36.2765 },
      'Aleppo': { lat: 36.2021, lng: 37.1343 },
      'Homs': { lat: 34.7394, lng: 36.7163 },
      'Latakia': { lat: 35.5297, lng: 35.7825 },
      'Hama': { lat: 35.1320, lng: 36.7500 },
    };

    const coord = coordinates[log.city];
    if (coord) {
      log.latitude = coord.lat + (Math.random() - 0.5) * 0.1; // Add some variation
      log.longitude = coord.lng + (Math.random() - 0.5) * 0.1;
    }
  }

  private generateRandomDate(): Date {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
  }

  private calculateAnalytics(auditLogs: AuditLog[], executionTime: number) {
    const eventsByType = {};
    const eventsBySeverity = {};
    const geographicDistribution = {};

    auditLogs.forEach(log => {
      // Count by type
      eventsByType[log.module] = (eventsByType[log.module] || 0) + 1;

      // Count by severity
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;

      // Count by geography
      if (log.city) {
        geographicDistribution[log.city] = (geographicDistribution[log.city] || 0) + 1;
      }
    });

    const checksummedLogs = auditLogs.filter(log => log.checksum).length;

    return {
      events_by_type: eventsByType,
      events_by_severity: eventsBySeverity,
      geographic_distribution: geographicDistribution,
      performance_metrics: {
        logs_per_second: Math.round((auditLogs.length / executionTime) * 1000),
        average_response_time_ms: Math.round(executionTime / auditLogs.length),
        checksum_generation_rate: checksummedLogs / auditLogs.length,
      },
    };
  }

  /**
   * Clear existing seeding data
   */
  async clearExistingData(): Promise<void> {
    await this.auditLogRepository.delete({});
  }

  /**
   * Get audit log statistics for analytics
   */
  async getAuditLogStatistics() {
    const totalLogs = await this.auditLogRepository.count();
    const financialEvents = await this.auditLogRepository.count({ where: { isFinancialEvent: true } });
    const securityEvents = await this.auditLogRepository.count({ where: { isSecurityEvent: true } });
    const complianceEvents = await this.auditLogRepository.count({ where: { isComplianceEvent: true } });
    const criticalEvents = await this.auditLogRepository.count({ where: { severity: 'critical' } });

    return {
      total_logs: totalLogs,
      financial_events: financialEvents,
      security_events: securityEvents,
      compliance_events: complianceEvents,
      critical_events: criticalEvents,
      event_distribution: {
        financial_percentage: totalLogs > 0 ? (financialEvents / totalLogs) * 100 : 0,
        security_percentage: totalLogs > 0 ? (securityEvents / totalLogs) * 100 : 0,
        compliance_percentage: totalLogs > 0 ? (complianceEvents / totalLogs) * 100 : 0,
      },
    };
  }

  /**
   * Get audit logs by severity for analytics
   */
  async getAuditLogsBySeverity() {
    const logs = await this.auditLogRepository.find();
    const severityGroups = {};

    logs.forEach(log => {
      severityGroups[log.severity] = (severityGroups[log.severity] || 0) + 1;
    });

    return severityGroups;
  }
}
/**
 * @file audit-log-comprehensive.e2e-spec.ts
 * @description Comprehensive E2E tests for Audit Log management system
 *
 * COMPREHENSIVE TESTING COVERAGE:
 * - Audit log seeding with enterprise-grade event simulation
 * - Multi-actor audit trails (admin, vendor, user, system, API clients)
 * - Financial event tracking with multi-currency support (SYP/USD/EUR)
 * - Security event generation for compliance monitoring and anomaly detection
 * - Compliance audit logs for GDPR, PCI DSS, and Syrian commerce law
 * - Geographic distribution across Syrian governorates with coordinates
 * - Risk scoring and tamper-evident checksum validation
 * - Workflow and approval process audit trails
 * - Performance monitoring and error tracking simulation
 * - Multi-tenant B2B/B2C audit log segregation
 * - Data retention policy compliance and archival simulation
 * - Bulk audit operations with performance validation
 * - System performance under load and concurrent operations
 *
 * @author SouqSyria Development Team
 * @since 2025-08-21
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

// Core modules
import { AppModule } from '../../src/app.module';
import { AuditLogModule } from '../../src/audit-log/audit-log.module';

// Services and Controllers
import { AuditLogSeederService } from '../../src/audit-log/seeds/audit-log-seeder.service';
import { AuditLogService } from '../../src/audit-log/service/audit-log.service';

// Entities
import { AuditLog } from '../../src/audit-log/entities/audit-log.entity';

// Test utilities
import { TestDataHelper } from '../helpers/test-data-helper';
import { ValidationHelper } from '../helpers/validation-helper';

describe('Audit Log System - Comprehensive E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let auditLogSeederService: AuditLogSeederService;
  let auditLogService: AuditLogService;
  let testDataHelper: TestDataHelper;
  let validationHelper: ValidationHelper;

  // Test configuration
  const TEST_CONFIG = {
    PERFORMANCE_THRESHOLDS: {
      SEED_GENERATION_TIME: 20000, // 20 seconds for complex audit seeding
      API_RESPONSE_TIME: 3000, // 3 seconds
      BULK_OPERATION_TIME: 10000, // 10 seconds
      ANALYTICS_RESPONSE_TIME: 5000, // 5 seconds
    },
    VALIDATION_RULES: {
      MIN_AUDIT_LOGS: 200, // Comprehensive audit trail
      MIN_FINANCIAL_EVENTS: 20,
      MIN_SECURITY_EVENTS: 15,
      MIN_COMPLIANCE_EVENTS: 10,
      MIN_CRITICAL_EVENTS: 5,
      MIN_ACTORS: 5, // Different actor types
      SEVERITY_LEVELS: ['low', 'medium', 'high', 'critical'],
      ACTOR_TYPES: ['admin', 'vendor', 'user', 'system', 'api_client', 'support_agent', 'anonymous'],
    },
    EVENT_CATEGORIES: {
      financial: ['payment.process', 'payment.refund', 'commission.calculate'],
      security: ['auth.login_failed', 'auth.suspicious_login', 'security.anomaly_detected'],
      compliance: ['gdpr.data_export', 'pci.card_data_access', 'syrian_law.tax_calculation'],
      system: ['system.backup_started', 'system.maintenance_mode', 'database.migration_run'],
      user: ['user.login', 'product.view', 'order.create'],
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuditLogModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services and dependencies
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    auditLogSeederService = moduleFixture.get<AuditLogSeederService>(AuditLogSeederService);
    auditLogService = moduleFixture.get<AuditLogService>(AuditLogService);

    // Initialize test helpers
    testDataHelper = new TestDataHelper(dataSource);
    validationHelper = new ValidationHelper();

    // Clear existing test data
    await testDataHelper.clearAuditLogData();
  });

  afterAll(async () => {
    await testDataHelper.clearAuditLogData();
    await app.close();
  });

  describe('Audit Log Seeding System', () => {
    it('should seed comprehensive audit log system within performance threshold', async () => {
      const startTime = Date.now();

      const result = await request(app.getHttpServer())
        .post('/audit-log/seed')
        .expect(201);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Performance validation
      expect(executionTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.SEED_GENERATION_TIME);

      // Validate response structure
      expect(result.body).toHaveProperty('success', true);
      expect(result.body).toHaveProperty('audit_logs_created');
      expect(result.body).toHaveProperty('financial_events');
      expect(result.body).toHaveProperty('security_events');
      expect(result.body).toHaveProperty('compliance_events');
      expect(result.body).toHaveProperty('critical_events');
      expect(result.body).toHaveProperty('actors_simulated');
      expect(result.body).toHaveProperty('events_by_type');
      expect(result.body).toHaveProperty('events_by_severity');
      expect(result.body).toHaveProperty('geographic_distribution');
      expect(result.body).toHaveProperty('performance_metrics');

      // Validate minimum data requirements
      expect(result.body.audit_logs_created).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_AUDIT_LOGS);
      expect(result.body.financial_events).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FINANCIAL_EVENTS);
      expect(result.body.security_events).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SECURITY_EVENTS);
      expect(result.body.compliance_events).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_COMPLIANCE_EVENTS);
      expect(result.body.critical_events).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_CRITICAL_EVENTS);
    });

    it('should validate audit log data structure and enterprise features', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      expect(auditLogs.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_AUDIT_LOGS);

      // Validate each audit log
      for (const log of auditLogs) {
        // Required fields validation
        expect(log.action).toBeDefined();
        expect(log.action.length).toBeGreaterThan(2);
        expect(log.actorType).toBeDefined();
        expect(TEST_CONFIG.VALIDATION_RULES.ACTOR_TYPES).toContain(log.actorType);
        expect(log.severity).toBeDefined();
        expect(TEST_CONFIG.VALIDATION_RULES.SEVERITY_LEVELS).toContain(log.severity);

        // Timestamp validation
        expect(log.createdAt).toBeInstanceOf(Date);
        expect(log.updatedAt).toBeInstanceOf(Date);
        expect(log.updatedAt.getTime()).toBeGreaterThanOrEqual(log.createdAt.getTime());

        // Boolean field validation
        expect(typeof log.isComplianceEvent).toBe('boolean');
        expect(typeof log.isSecurityEvent).toBe('boolean');
        expect(typeof log.isFinancialEvent).toBe('boolean');
        expect(typeof log.wasSuccessful).toBe('boolean');

        // Validate module assignment
        if (log.module) {
          expect(log.module.length).toBeGreaterThan(2);
        }

        // Validate IP address format if present
        if (log.ipAddress) {
          expect(log.ipAddress).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
        }

        // Validate risk score if present
        if (log.riskScore !== null && log.riskScore !== undefined) {
          expect(log.riskScore).toBeGreaterThanOrEqual(0);
          expect(log.riskScore).toBeLessThanOrEqual(100);
        }
      }
    });

    it('should validate financial event audit logs with multi-currency support', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const financialEvents = auditLogs.filter(log => log.isFinancialEvent);
      expect(financialEvents.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FINANCIAL_EVENTS);

      const currencies = new Set();

      financialEvents.forEach(log => {
        // Financial events should have monetary amounts
        expect(log.monetaryAmount).toBeDefined();
        expect(log.monetaryAmount).toBeGreaterThan(0);

        // Should have currency information
        expect(log.currency).toBeDefined();
        expect(['SYP', 'USD', 'EUR']).toContain(log.currency);
        currencies.add(log.currency);

        // Should have transaction reference
        expect(log.transactionReference).toBeDefined();
        expect(log.transactionReference).toMatch(/^txn_[A-Z0-9]+$/);

        // Should have checksum for tamper detection
        expect(log.checksum).toBeDefined();
        expect(log.checksum.length).toBeGreaterThan(20);

        // Should have retention date
        expect(log.retentionDate).toBeDefined();
        expect(log.retentionDate).toBeInstanceOf(Date);
        expect(log.retentionDate.getTime()).toBeGreaterThan(Date.now());
      });

      // Should have multiple currencies represented
      expect(currencies.size).toBeGreaterThanOrEqual(2);
    });

    it('should validate security event audit logs with anomaly detection', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const securityEvents = auditLogs.filter(log => log.isSecurityEvent);
      expect(securityEvents.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SECURITY_EVENTS);

      securityEvents.forEach(log => {
        // Security events should have proper classification
        expect(log.isSecurityEvent).toBe(true);

        // Should have session information
        if (log.sessionId) {
          expect(log.sessionId).toMatch(/^sess_[a-z0-9]+$/);
        }

        // Should have user agent information
        if (log.userAgent) {
          expect(log.userAgent).toContain('Mozilla');
        }

        // Should have checksum for critical security events
        if (log.severity === 'critical' || log.isAnomaly) {
          expect(log.checksum).toBeDefined();
        }

        // Failed operations should have error information
        if (!log.wasSuccessful) {
          expect(log.errorCode || log.errorMessage).toBeDefined();
        }
      });

      // Should have some anomalous events detected
      const anomalousEvents = securityEvents.filter(log => log.isAnomaly);
      expect(anomalousEvents.length).toBeGreaterThan(0);
    });

    it('should validate compliance event audit logs with regulatory categories', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const complianceEvents = auditLogs.filter(log => log.isComplianceEvent);
      expect(complianceEvents.length).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_COMPLIANCE_EVENTS);

      const regulatoryCategories = new Set();

      complianceEvents.forEach(log => {
        // Compliance events should have regulatory category
        expect(log.regulatoryCategory).toBeDefined();
        expect(['GDPR', 'PCI_DSS', 'Syrian_Commerce_Law']).toContain(log.regulatoryCategory);
        regulatoryCategories.add(log.regulatoryCategory);

        // Should have checksum for compliance tracking
        expect(log.checksum).toBeDefined();

        // Should have extended retention
        expect(log.retentionDate).toBeDefined();
        expect(log.retentionDate).toBeInstanceOf(Date);

        // Should be high severity
        expect(['high', 'critical']).toContain(log.severity);
      });

      // Should cover multiple regulatory categories
      expect(regulatoryCategories.size).toBeGreaterThanOrEqual(2);
    });

    it('should validate Syrian geographic distribution', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const syrianLogs = auditLogs.filter(log => log.country === 'Syria');
      expect(syrianLogs.length).toBeGreaterThan(0);

      const syrianCities = new Set();
      const coordinatesFound = [];

      syrianLogs.forEach(log => {
        if (log.city) {
          syrianCities.add(log.city);
        }

        // Syrian logs should have coordinates
        if (log.latitude && log.longitude) {
          coordinatesFound.push({ lat: log.latitude, lng: log.longitude });
          
          // Validate Syrian coordinate ranges
          expect(log.latitude).toBeGreaterThanOrEqual(32);
          expect(log.latitude).toBeLessThanOrEqual(37);
          expect(log.longitude).toBeGreaterThanOrEqual(35);
          expect(log.longitude).toBeLessThanOrEqual(42);
        }
      });

      // Should have multiple Syrian cities represented
      expect(syrianCities.size).toBeGreaterThanOrEqual(3);
      expect(coordinatesFound.length).toBeGreaterThan(0);
    });

    it('should validate audit log performance metrics and risk scoring', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      // Check processing time tracking
      const logsWithProcessingTime = auditLogs.filter(log => log.processingTimeMs > 0);
      expect(logsWithProcessingTime.length).toBeGreaterThan(auditLogs.length * 0.8); // 80% should have timing

      // Check risk scoring
      const logsWithRiskScore = auditLogs.filter(log => log.riskScore !== null && log.riskScore !== undefined);
      expect(logsWithRiskScore.length).toBeGreaterThan(auditLogs.length * 0.7); // 70% should have risk scores

      // Validate risk score distribution
      const highRiskLogs = logsWithRiskScore.filter(log => log.riskScore > 70);
      const mediumRiskLogs = logsWithRiskScore.filter(log => log.riskScore > 30 && log.riskScore <= 70);
      const lowRiskLogs = logsWithRiskScore.filter(log => log.riskScore <= 30);

      expect(highRiskLogs.length).toBeGreaterThan(0);
      expect(mediumRiskLogs.length).toBeGreaterThan(0);
      expect(lowRiskLogs.length).toBeGreaterThan(0);

      // Critical events should have high risk scores
      const criticalEvents = auditLogs.filter(log => log.severity === 'critical');
      criticalEvents.forEach(log => {
        if (log.riskScore !== null && log.riskScore !== undefined) {
          expect(log.riskScore).toBeGreaterThan(50);
        }
      });
    });
  });

  describe('Audit Log API Endpoints', () => {
    beforeEach(async () => {
      // Ensure test data exists
      await auditLogSeederService.seedAuditLogs();
    });

    it('should retrieve audit log statistics with comprehensive analytics', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/audit-log/seed/statistics')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME);

      // Validate response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body).toHaveProperty('generated_at');

      const stats = response.body.statistics;
      expect(stats).toHaveProperty('total_logs');
      expect(stats).toHaveProperty('financial_events');
      expect(stats).toHaveProperty('security_events');
      expect(stats).toHaveProperty('compliance_events');
      expect(stats).toHaveProperty('critical_events');
      expect(stats).toHaveProperty('event_distribution');

      // Validate statistics values
      expect(stats.total_logs).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_AUDIT_LOGS);
      expect(stats.financial_events).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_FINANCIAL_EVENTS);
      expect(stats.security_events).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_SECURITY_EVENTS);

      // Validate event distribution percentages
      const distribution = stats.event_distribution;
      expect(distribution.financial_percentage).toBeGreaterThan(0);
      expect(distribution.security_percentage).toBeGreaterThan(0);
      expect(distribution.compliance_percentage).toBeGreaterThan(0);
    });

    it('should provide audit log analytics by severity', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-log/seed/analytics/severity')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('logs_by_severity');
      expect(response.body).toHaveProperty('total_logs');
      expect(response.body).toHaveProperty('highest_severity');
      expect(response.body).toHaveProperty('severity_distribution');

      // Validate severity data
      const severityData = response.body.logs_by_severity;
      expect(typeof severityData).toBe('object');

      // Check for all severity levels
      TEST_CONFIG.VALIDATION_RULES.SEVERITY_LEVELS.forEach(severity => {
        expect(severityData).toHaveProperty(severity);
        expect(severityData[severity]).toBeGreaterThanOrEqual(0);
      });

      // Validate severity distribution percentages
      const distribution = response.body.severity_distribution;
      TEST_CONFIG.VALIDATION_RULES.SEVERITY_LEVELS.forEach(severity => {
        expect(distribution).toHaveProperty(`${severity}_percentage`);
      });

      // Should have critical events
      expect(severityData.critical).toBeGreaterThanOrEqual(TEST_CONFIG.VALIDATION_RULES.MIN_CRITICAL_EVENTS);
    });

    it('should handle bulk audit log seeding with customization', async () => {
      const startTime = Date.now();

      const bulkConfig = {
        event_types: ['financial', 'security', 'compliance'],
        include_financial_events: true,
        include_security_events: true,
        include_compliance_events: true,
        syrian_focus: true,
      };

      const response = await request(app.getHttpServer())
        .post('/audit-log/seed/bulk')
        .send(bulkConfig)
        .expect(201);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('bulk_configuration');
      expect(response.body).toHaveProperty('optimization_applied', true);
      expect(response.body).toHaveProperty('syrian_focus_enabled', true);
      expect(response.body.bulk_configuration).toEqual(bulkConfig);
    });

    it('should export audit log data with compliance considerations', async () => {
      // Test CSV export
      const csvExportConfig = {
        format: 'csv',
        include_sensitive_data: false,
        filter_by_severity: ['high', 'critical'],
        include_geographic_data: true,
      };

      const csvResponse = await request(app.getHttpServer())
        .post('/audit-log/seed/export')
        .send(csvExportConfig)
        .expect(200);

      expect(csvResponse.body).toHaveProperty('success', true);
      expect(csvResponse.body).toHaveProperty('export_config');
      expect(csvResponse.body).toHaveProperty('download_url');
      expect(csvResponse.body).toHaveProperty('compliance_notice');
      expect(csvResponse.body).toHaveProperty('expires_at');

      // Test Excel export with full data
      const excelExportConfig = {
        format: 'excel',
        include_sensitive_data: true,
        filter_by_actor_type: ['admin', 'system'],
        include_geographic_data: true,
      };

      const excelResponse = await request(app.getHttpServer())
        .post('/audit-log/seed/export')
        .send(excelExportConfig)
        .expect(200);

      expect(excelResponse.body.export_config.format).toBe('excel');
      expect(excelResponse.body.data).toHaveProperty('statistics');
      expect(excelResponse.body.data).toHaveProperty('filters_applied');
    });
  });

  describe('Audit Log Event Validation', () => {
    beforeEach(async () => {
      await auditLogSeederService.seedAuditLogs();
    });

    it('should validate user activity audit trail', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const userEvents = auditLogs.filter(log => log.actorType === 'user');
      expect(userEvents.length).toBeGreaterThan(0);

      // Check for typical user activities
      const userActivities = userEvents.map(log => log.action);
      const expectedActivities = ['user.login', 'product.view', 'order.create', 'cart.add_item'];
      
      expectedActivities.forEach(activity => {
        expect(userActivities.some(ua => ua.includes(activity.split('.')[1]))).toBe(true);
      });

      // User events should have session information
      const userEventsWithSessions = userEvents.filter(log => log.sessionId);
      expect(userEventsWithSessions.length).toBeGreaterThan(userEvents.length * 0.5); // 50% should have sessions
    });

    it('should validate admin activity audit trail', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const adminEvents = auditLogs.filter(log => log.actorType === 'admin');
      expect(adminEvents.length).toBeGreaterThan(0);

      // Admin events should be higher severity
      adminEvents.forEach(log => {
        expect(['medium', 'high', 'critical']).toContain(log.severity);
      });

      // Check for admin-specific activities
      const adminActivities = adminEvents.map(log => log.action);
      const expectedAdminActivities = ['admin.user_suspend', 'admin.vendor_approve', 'admin.permission_grant'];
      
      const hasAdminActivity = expectedAdminActivities.some(activity => 
        adminActivities.some(aa => aa.includes(activity.split('.')[1]))
      );
      expect(hasAdminActivity).toBe(true);
    });

    it('should validate system and API event audit trails', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const systemEvents = auditLogs.filter(log => log.actorType === 'system');
      const apiEvents = auditLogs.filter(log => log.actorType === 'api_client');

      expect(systemEvents.length).toBeGreaterThan(0);
      expect(apiEvents.length).toBeGreaterThan(0);

      // System events should have processing times
      systemEvents.forEach(log => {
        expect(log.processingTimeMs).toBeGreaterThan(0);
      });

      // API events should have version and request information
      apiEvents.forEach(log => {
        if (log.apiVersion) {
          expect(log.apiVersion).toMatch(/^v\d+$/);
        }
        if (log.requestId) {
          expect(log.requestId).toMatch(/^req_[a-z0-9]+$/);
        }
      });
    });

    it('should validate workflow and approval audit trails', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const workflowEvents = auditLogs.filter(log => log.workflowStage);
      expect(workflowEvents.length).toBeGreaterThan(0);

      const workflowStages = new Set();

      workflowEvents.forEach(log => {
        workflowStages.add(log.workflowStage);
        
        // Approved events should have approver information
        if (log.workflowStage === 'approved') {
          expect(log.approvedBy).toBeDefined();
          expect(log.approvedAt).toBeDefined();
          expect(log.approvedAt).toBeInstanceOf(Date);
        }

        // Workflow events should have proper operation types
        if (log.operationType) {
          expect(['approve', 'reject', 'process']).toContain(log.operationType);
        }
      });

      // Should have multiple workflow stages
      expect(workflowStages.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Data Integrity and Compliance', () => {
    it('should validate checksum integrity for critical events', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const criticalEvents = auditLogs.filter(log => 
        log.isFinancialEvent || log.isSecurityEvent || log.isComplianceEvent
      );

      expect(criticalEvents.length).toBeGreaterThan(0);

      // Critical events should have checksums
      const eventsWithChecksums = criticalEvents.filter(log => log.checksum);
      expect(eventsWithChecksums.length).toBeGreaterThan(criticalEvents.length * 0.5); // At least 50%

      // Checksums should be valid format
      eventsWithChecksums.forEach(log => {
        expect(log.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 format
      });
    });

    it('should validate data retention policy compliance', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const logsWithRetention = auditLogs.filter(log => log.retentionDate);
      expect(logsWithRetention.length).toBeGreaterThan(0);

      logsWithRetention.forEach(log => {
        // Retention date should be in the future
        expect(log.retentionDate.getTime()).toBeGreaterThan(Date.now());

        // Financial events should have longer retention
        if (log.isFinancialEvent) {
          const yearsDiff = (log.retentionDate.getTime() - log.createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          expect(yearsDiff).toBeGreaterThanOrEqual(5); // At least 5 years for financial
        }

        // Compliance events should have extended retention
        if (log.isComplianceEvent) {
          const yearsDiff = (log.retentionDate.getTime() - log.createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          expect(yearsDiff).toBeGreaterThanOrEqual(3); // At least 3 years for compliance
        }
      });
    });

    it('should validate multi-tenant data segregation', async () => {
      const auditLogs = await dataSource.getRepository(AuditLog).find();

      const b2bLogs = auditLogs.filter(log => log.businessModel === 'B2B');
      const b2cLogs = auditLogs.filter(log => log.businessModel === 'B2C');

      expect(b2bLogs.length).toBeGreaterThan(0);
      expect(b2cLogs.length).toBeGreaterThan(0);

      // B2B logs should typically have higher monetary amounts
      const b2bFinancialLogs = b2bLogs.filter(log => log.isFinancialEvent && log.monetaryAmount);
      const b2cFinancialLogs = b2cLogs.filter(log => log.isFinancialEvent && log.monetaryAmount);

      if (b2bFinancialLogs.length > 0 && b2cFinancialLogs.length > 0) {
        const avgB2BAmount = b2bFinancialLogs.reduce((sum, log) => sum + log.monetaryAmount, 0) / b2bFinancialLogs.length;
        const avgB2CAmount = b2cFinancialLogs.reduce((sum, log) => sum + log.monetaryAmount, 0) / b2cFinancialLogs.length;
        
        expect(avgB2BAmount).toBeGreaterThan(avgB2CAmount * 0.5); // B2B should be at least 50% of B2C average
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle audit log clearing with compliance warnings', async () => {
      const response = await request(app.getHttpServer())
        .delete('/audit-log/seed/clear')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('warning');
      expect(response.body).toHaveProperty('compliance_notice');
      expect(response.body).toHaveProperty('cleared_at');

      // Verify data is actually cleared
      const auditLogsCount = await dataSource.getRepository(AuditLog).count();
      expect(auditLogsCount).toBe(0);
    });

    it('should handle test seeding with custom parameters', async () => {
      const response = await request(app.getHttpServer())
        .post('/audit-log/seed/test')
        .query({ sample_size: 50, include_critical: true })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('test_mode', true);
      expect(response.body).toHaveProperty('sample_size', '50');
      expect(response.body).toHaveProperty('include_critical', true);
      expect(response.body).toHaveProperty('test_performance');

      const testPerf = response.body.test_performance;
      expect(testPerf.seeding_successful).toBe(true);
      expect(testPerf.data_integrity_verified).toBe(true);
      expect(testPerf.compliance_features_tested).toBe(true);
    });

    it('should handle concurrent audit log operations', async () => {
      const promises = Array(3).fill(0).map(() =>
        request(app.getHttpServer())
          .post('/audit-log/seed/test')
          .send({ sample_size: 25 })
      );

      const results = await Promise.all(promises);
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('System Performance Under Load', () => {
    it('should maintain performance under concurrent audit analytics requests', async () => {
      const startTime = Date.now();

      const promises = Array(8).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/audit-log/seed/statistics')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should handle high-volume audit log analytics efficiently', async () => {
      const startTime = Date.now();

      const promises = [
        request(app.getHttpServer()).get('/audit-log/seed/statistics'),
        request(app.getHttpServer()).get('/audit-log/seed/analytics/severity'),
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.ANALYTICS_RESPONSE_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });

    it('should optimize audit log export operations', async () => {
      const exportConfigs = [
        { format: 'csv', include_sensitive_data: false },
        { format: 'excel', filter_by_severity: ['critical'] },
        { format: 'json', filter_by_actor_type: ['admin'] },
      ];
      
      const startTime = Date.now();

      const promises = exportConfigs.map(config =>
        request(app.getHttpServer())
          .post('/audit-log/seed/export')
          .send(config)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLDS.BULK_OPERATION_TIME);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
    });
  });
});
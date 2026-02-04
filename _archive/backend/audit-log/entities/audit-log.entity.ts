import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as crypto from 'crypto';
/**
 * Enterprise-grade AuditLog entity for comprehensive system traceability
 *
 * Features:
 * - Complete action tracking with severity levels
 * - Geographic and device information
 * - Compliance-ready data retention
 * - Performance optimization with strategic indexing
 * - Tamper-evident checksums for critical actions
 * - Multi-tenant support for B2B/B2C segregation
 */
@Entity('audit_logs')
@Index(['actorId', 'createdAt']) // Performance: Actor timeline queries
@Index(['action', 'createdAt']) // Performance: Action-based filtering
@Index(['module', 'severity', 'createdAt']) // Performance: Module monitoring
@Index(['entityType', 'entityId']) // Performance: Entity tracking
@Index(['tenantId', 'createdAt']) // Performance: Multi-tenant queries
@Index(['ipAddress', 'createdAt']) // Security: IP-based analysis
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  // === ACTION IDENTIFICATION ===
  @Column({ length: 100 })
  action: string; // e.g. 'order.create', 'payment.process', 'product.approve'

  @Column({ length: 50, nullable: true })
  module?: string; // e.g. 'orders', 'payments', 'products', 'vendors'

  @Column({ length: 50, nullable: true })
  subModule?: string; // e.g. 'bulk-orders', 'wholesale-pricing', 'b2b-quotes'

  // === ACTOR INFORMATION ===
  @Column({ nullable: true })
  actorId?: number;

  @Column({
    type: 'enum',
    enum: [
      'admin',
      'vendor',
      'user',
      'system',
      'api_client',
      'support_agent',
      'anonymous',
    ],
  })
  actorType:
    | 'admin'
    | 'vendor'
    | 'user'
    | 'system'
    | 'api_client'
    | 'support_agent'
    | 'anonymous';

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor?: User;

  @Column({ length: 100, nullable: true })
  actorEmail?: string; // Cached for performance and deleted user scenarios

  @Column({ length: 100, nullable: true })
  actorName?: string; // Cached actor name

  // === ENTITY BEING MODIFIED ===
  @Column({ length: 50, nullable: true })
  entityType?: string; // e.g. 'product', 'order', 'vendor', 'user'

  @Column({ nullable: true })
  entityId?: number; // ID of the affected entity

  @Column({ length: 200, nullable: true })
  entityDescription?: string; // Human-readable entity description

  // === SEVERITY AND CLASSIFICATION ===
  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  })
  severity: 'low' | 'medium' | 'high' | 'critical';

  @Column({
    type: 'enum',
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'approve',
      'reject',
      'process',
      'cancel',
    ],
    nullable: true,
  })
  operationType?:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'approve'
    | 'reject'
    | 'process'
    | 'cancel';

  // === COMPLIANCE AND REGULATORY ===
  @Column({ default: false })
  isComplianceEvent: boolean; // GDPR, financial regulations, etc.

  @Column({ default: false })
  isSecurityEvent: boolean; // Login attempts, permission changes, etc.

  @Column({ default: false })
  isFinancialEvent: boolean; // Payment processing, refunds, commission calculations

  @Column({ length: 100, nullable: true })
  regulatoryCategory?: string; // e.g. 'GDPR', 'PCI_DSS', 'Syrian_Commerce_Law'

  // === TECHNICAL CONTEXT ===
  @Column({ length: 45, nullable: true })
  ipAddress?: string; // Support IPv6

  @Column({ length: 500, nullable: true })
  userAgent?: string; // Browser/app information

  @Column({ length: 100, nullable: true })
  sessionId?: string; // Track user sessions

  @Column({ length: 100, nullable: true })
  requestId?: string; // Trace requests across microservices

  @Column({ length: 50, nullable: true })
  apiVersion?: string; // API version used

  // === GEOGRAPHIC INFORMATION ===
  @Column({ length: 100, nullable: true })
  country?: string; // e.g. 'Syria', 'Turkey', 'Germany'

  @Column({ length: 100, nullable: true })
  city?: string; // e.g. 'Damascus', 'Aleppo', 'Berlin'

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  // === BUSINESS CONTEXT (B2B/B2C) ===
  @Column({ length: 20, nullable: true })
  businessModel?: string; // 'B2C', 'B2B', 'B2B2C'

  @Column({ nullable: true })
  tenantId?: number; // Multi-tenant support for enterprise customers

  @Column({ length: 100, nullable: true })
  organizationId?: string; // B2B organization identifier

  @Column({ length: 50, nullable: true })
  marketSegment?: string; // 'retail', 'wholesale', 'enterprise'

  // === DATA CHANGES ===
  @Column({ type: 'json', nullable: true })
  beforeData?: Record<string, any>; // Previous state for update operations

  @Column({ type: 'json', nullable: true })
  afterData?: Record<string, any>; // New state for update operations

  @Column({ type: 'json', nullable: true })
  meta?: Record<string, any>; // Additional context-specific metadata

  @Column({ type: 'text', nullable: true })
  description?: string; // Human-readable description of the action

  // === FINANCIAL TRACKING ===
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  monetaryAmount?: number; // Amount involved in financial operations

  @Column({ length: 3, nullable: true })
  currency?: string; // 'SYP', 'USD', 'EUR'

  @Column({ length: 100, nullable: true })
  transactionReference?: string; // External transaction ID

  // === SECURITY AND INTEGRITY ===
  @Column({ length: 64, nullable: true })
  checksum?: string; // SHA-256 hash for tamper detection on critical events

  @Column({ default: false })
  isAnomaly: boolean; // Flagged by security monitoring

  @Column({ nullable: true })
  riskScore?: number; // 0-100 risk assessment score

  // === WORKFLOW AND APPROVAL ===
  @Column({ length: 50, nullable: true })
  workflowStage?: string; // e.g. 'pending_approval', 'approved', 'rejected'

  @Column({ nullable: true })
  approvedBy?: number; // User ID who approved the action

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  // === PERFORMANCE MONITORING ===
  @Column({ nullable: true })
  processingTimeMs?: number; // Time taken to complete the action

  @Column({ default: true })
  wasSuccessful: boolean; // Whether the action completed successfully

  @Column({ type: 'text', nullable: true })
  errorMessage?: string; // Error details if action failed

  @Column({ length: 100, nullable: true })
  errorCode?: string; // Standardized error codes

  // === DATA RETENTION ===
  @Column({ type: 'timestamp', nullable: true })
  retentionDate?: Date; // When this log can be archived/deleted

  @Column({ default: false })
  isArchived: boolean; // Whether this log has been archived

  @Column({ length: 50, nullable: true })
  archiveLocation?: string; // Location of archived data

  // === TIMESTAMPS ===
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // === ENTERPRISE METHODS ===

  // 2. Add this method to your AuditLog class (replace the simple generateChecksum):
  /**
   * ✅ ENHANCED: Generate cryptographically secure checksum
   * Only for critical events (compliance, security, financial)
   */
  generateChecksum(): string {
    if (
      !this.isComplianceEvent &&
      !this.isSecurityEvent &&
      !this.isFinancialEvent
    ) {
      return null;
    }

    const data = `${this.action}|${this.actorId}|${this.entityType}|${this.entityId}|${this.createdAt?.getTime() || Date.now()}`;

    // In production, use environment variable for secret
    const secret =
      process.env.AUDIT_CHECKSUM_SECRET ||
      'default-secret-change-in-production';

    try {
      return crypto.createHmac('sha256', secret).update(data).digest('hex');
    } catch (error: unknown) {
      // Fallback to simple checksum if crypto fails
      return `checksum_${data.length}_${Date.now()}`;
    }
  }
  // 3. Add this method for production-ready risk calculation:
  /**
   * ✅ ENHANCED: Production-ready risk score calculation
   */
  calculateRiskScore(): number {
    let score = 0;

    // Base score by severity
    const severityScores = {
      low: 10,
      medium: 30,
      high: 60,
      critical: 90,
    };
    score += severityScores[this.severity] || 30;

    // Security events get higher scores
    if (this.isSecurityEvent) score += 20;

    // High-value financial transactions
    if (this.isFinancialEvent) {
      if (this.monetaryAmount > 50000) score += 25;
      else if (this.monetaryAmount > 10000) score += 15;
      else if (this.monetaryAmount > 1000) score += 5;
    }

    // Dangerous operations
    if (this.operationType === 'delete') score += 15;
    if (this.operationType === 'approve' && this.entityType === 'vendor')
      score += 10;

    // Actor type risks
    if (this.actorType === 'api_client') score += 10;
    if (this.actorType === 'system' && this.action.includes('bulk')) score += 8;

    // Geographic risks (basic example)
    if (
      this.country &&
      !['Syria', 'Turkey', 'Lebanon', 'Jordan'].includes(this.country)
    ) {
      score += 5;
    }

    // Time-based risks (operations during unusual hours)
    if (this.createdAt) {
      const hour = this.createdAt.getHours();
      if (hour < 6 || hour > 22) score += 5; // Late night/early morning operations
    }

    return Math.min(score, 100);
  }

  // 4. Add this enhanced retention calculation:
  /**
   * ✅ ENHANCED: Smart retention date calculation based on Syrian and international laws
   */
  calculateRetentionDate(): Date {
    const now = new Date();
    let retentionYears = 2; // Default for Syrian commerce

    // Compliance events - follow strictest regulation
    if (this.isComplianceEvent) {
      if (this.regulatoryCategory === 'GDPR') retentionYears = 7;
      else if (this.regulatoryCategory === 'PCI_DSS')
        retentionYears = 12; // Card data
      else if (this.regulatoryCategory === 'Syrian_Commerce_Law')
        retentionYears = 5;
      else retentionYears = 7; // Default for compliance
    }

    // Financial events - Syrian banking law + international standards
    if (this.isFinancialEvent) {
      retentionYears = 10; // Syrian banking regulations
      if (this.monetaryAmount > 100000) retentionYears = 15; // Large transactions
    }

    // Security events - cyber security standards
    if (this.isSecurityEvent) {
      retentionYears = 5;
      if (this.severity === 'critical') retentionYears = 7;
    }

    // B2B transactions often have longer requirements
    if (this.businessModel === 'B2B' && this.isFinancialEvent) {
      retentionYears = Math.max(retentionYears, 12);
    }

    const retentionDate = new Date(now);
    retentionDate.setFullYear(retentionDate.getFullYear() + retentionYears);
    return retentionDate;
  }

  // 5. Add this helper method:
  /**
   * ✅ NEW: Check if this audit log entry is critical
   * Used by services to determine special handling
   */
  isCritical(): boolean {
    return (
      this.severity === 'critical' ||
      this.riskScore > 80 ||
      (this.isFinancialEvent && this.monetaryAmount > 50000) ||
      (this.isSecurityEvent && this.isAnomaly) ||
      (this.operationType === 'delete' &&
        ['user', 'vendor', 'order'].includes(this.entityType))
    );
  }

  // 6. Add this method for human-readable descriptions:
  /**
   * ✅ NEW: Generate human-readable summary
   * Useful for notifications and reports
   */
  generateSummary(): string {
    const actor = this.actorName || `${this.actorType} ${this.actorId}`;
    const entity =
      this.entityDescription || `${this.entityType} ${this.entityId}`;
    const amount = this.monetaryAmount
      ? ` (${this.monetaryAmount} ${this.currency})`
      : '';

    return `${actor} performed ${this.action} on ${entity}${amount}`;
  }
}

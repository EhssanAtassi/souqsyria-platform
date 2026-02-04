/**
 * @file syrian-kyc-status-log.entity.ts
 * @description KYC Status Change Log for Workflow Tracking and Audit Trail
 *
 * FEATURES:
 * - Comprehensive audit trail for KYC document status changes
 * - Arabic/English localization for status descriptions
 * - Performance optimized with proper indexing
 * - Integration with workflow engine
 * - Admin user tracking and metadata
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SyrianKycDocumentEntity } from './syrian-kyc-document.entity';
import { SyrianKycStatus } from '../enums/syrian-kyc.enums';
import { User } from '../../users/entities/user.entity';

@Entity('syrian_kyc_status_logs')
@Index(['createdAt'])
@Index(['fromStatus', 'toStatus'])
export class SyrianKycStatusLog {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique log entry ID' })
  id: number;

  /**
   * Associated KYC document
   */
  @ManyToOne(() => SyrianKycDocumentEntity, (doc) => doc.statusLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'kyc_document_id' })
  @ApiProperty({ description: 'KYC document this log entry belongs to' })
  kycDocument: SyrianKycDocumentEntity;

  /**
   * Status transition details
   */
  @Column({
    type: 'enum',
    enum: SyrianKycStatus,
    nullable: true,
  })
  @Index()
  @ApiProperty({
    description: 'Previous status before change',
    enum: SyrianKycStatus,
    example: SyrianKycStatus.SUBMITTED,
  })
  fromStatus?: SyrianKycStatus;

  @Column({
    type: 'enum',
    enum: SyrianKycStatus,
  })
  @Index()
  @ApiProperty({
    description: 'New status after change',
    enum: SyrianKycStatus,
    example: SyrianKycStatus.APPROVED,
  })
  toStatus: SyrianKycStatus;

  /**
   * Status change descriptions
   */
  @Column({ length: 200 })
  @ApiProperty({
    description: 'Status change description in English',
    example: 'Document approved after verification',
  })
  descriptionEn: string;

  @Column({ length: 200 })
  @ApiProperty({
    description: 'Status change description in Arabic',
    example: 'تمت الموافقة على الوثيقة بعد التحقق',
  })
  descriptionAr: string;

  /**
   * User who made the change
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  @ApiProperty({ description: 'User who initiated the status change' })
  changedBy?: User;

  /**
   * Change reason and notes
   */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Detailed reason for status change (English)',
    example: 'All documents verified successfully. Identity confirmed.',
  })
  changeReason?: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Detailed reason for status change (Arabic)',
    example: 'تم التحقق من جميع الوثائق بنجاح. تم تأكيد الهوية.',
  })
  changeReasonAr?: string;

  /**
   * System/manual change flag
   */
  @Column({ default: false })
  @ApiProperty({
    description: 'Whether this was an automated system change',
    example: false,
  })
  isSystemChange: boolean;

  /**
   * Additional metadata for the status change
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Additional metadata about the status change',
    example: {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      processingTime: 1.5,
      validationResults: {
        documentValid: true,
        identityConfirmed: true,
      },
      workflowStep: 'FINAL_APPROVAL',
      autoTransition: false,
    },
  })
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    processingTime?: number;
    validationResults?: any;
    workflowStep?: string;
    autoTransition?: boolean;
    escalationLevel?: number;
    slaViolation?: boolean;
    reviewDuration?: number;
  };

  /**
   * Performance and SLA tracking
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Performance metrics for this status change',
    example: {
      timeInPreviousStatus: 24.5,
      slaCompliant: true,
      processingEfficiency: 'HIGH',
      reviewQuality: 'EXCELLENT',
    },
  })
  performanceMetrics?: {
    timeInPreviousStatus?: number; // hours
    slaCompliant?: boolean;
    processingEfficiency?: 'LOW' | 'MEDIUM' | 'HIGH';
    reviewQuality?: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  };

  /**
   * Workflow context
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Workflow context and business rules applied',
    example: {
      workflowId: 'kyc_approval_workflow_v2',
      ruleApplied: 'auto_approve_low_risk',
      conditionsMet: ['valid_documents', 'identity_confirmed'],
      nextSteps: ['send_approval_notification', 'upgrade_vendor_status'],
    },
  })
  workflowContext?: {
    workflowId?: string;
    ruleApplied?: string;
    conditionsMet?: string[];
    nextSteps?: string[];
    escalationTriggered?: boolean;
    approvalLevel?: 'L1' | 'L2' | 'L3' | 'MANAGER';
  };

  /**
   * Notification tracking
   */
  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Notifications sent as part of this status change',
    example: {
      notificationsSent: ['email', 'sms', 'push'],
      recipients: ['vendor', 'admin'],
      emailDelivered: true,
      smsDelivered: true,
      pushDelivered: true,
    },
  })
  notifications?: {
    notificationsSent?: string[];
    recipients?: string[];
    emailDelivered?: boolean;
    smsDelivered?: boolean;
    pushDelivered?: boolean;
    notificationErrors?: string[];
  };

  /**
   * Timestamp
   */
  @CreateDateColumn({ name: 'created_at' })
  // Index defined at class level: @Index(['createdAt'])
  @ApiProperty({ description: 'When this status change occurred' })
  createdAt: Date;

  // Backward compatibility
  get changedAt(): Date {
    return this.createdAt;
  }
}

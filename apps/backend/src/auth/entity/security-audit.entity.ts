/**
 * @file security-audit.entity.ts
 * @description Security audit log entity for tracking login attempts, account lockouts,
 * and other security-relevant events. Provides a forensic trail for investigating
 * suspicious activity and brute-force attempts.
 *
 * @author SouqSyria Development Team
 * @since 2026-02-08
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Security event types tracked by the audit system
 */
export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'ACCOUNT_LOCKED';

@Entity('security_audit')
@Index(['email', 'createdAt'])
@Index(['userId', 'eventType'])
export class SecurityAudit {
  /** Auto-incremented primary key */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Type of security event recorded.
   * LOGIN_SUCCESS: Successful authentication
   * LOGIN_FAILURE: Failed password check
   * ACCOUNT_LOCKED: Account locked after max failed attempts
   */
  @Column({ name: 'event_type', length: 30 })
  eventType: SecurityEventType;

  /**
   * Email address involved in the event.
   * Stored separately from userId for cases where the user doesn't exist.
   */
  @Column()
  email: string;

  /**
   * User ID associated with the event (nullable for non-existent users).
   */
  @Column({ name: 'user_id', nullable: true })
  userId: number | null;

  /**
   * IP address from which the event originated.
   * Used for forensic analysis and IP-based pattern detection.
   */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  /**
   * User-Agent string of the client.
   * Helps identify the device/browser involved.
   */
  @Column({ name: 'user_agent', nullable: true, length: 500 })
  userAgent: string;

  /**
   * Sequential failed attempt number (e.g., 1 of 5, 3 of 5).
   * Only populated for LOGIN_FAILURE and ACCOUNT_LOCKED events.
   */
  @Column({ name: 'failed_attempt_number', nullable: true })
  failedAttemptNumber: number | null;

  /**
   * Additional metadata for the event (e.g., lockout duration, remaining attempts).
   * Stored as JSON for flexibility.
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null;

  /** Timestamp when the event was recorded */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

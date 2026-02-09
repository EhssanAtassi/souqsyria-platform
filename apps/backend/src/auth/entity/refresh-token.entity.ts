/**
 * @file refresh-token.entity.ts
 * @description RefreshToken entity for secure token rotation and session management.
 * Stores hashed refresh tokens with device info for multi-device support.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  /**
   * Unique identifier for the refresh token record.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Hashed version of the refresh token.
   * Never store plain tokens in the database for security.
   * Use bcrypt or similar to hash before storage.
   */
  @Column({ name: 'token_hash', unique: true })
  tokenHash: string;

  /**
   * Relation to the user who owns this refresh token.
   * Each user can have multiple refresh tokens (one per device/session).
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /**
   * Foreign key to user table.
   * Used for fast queries without loading the full User entity.
   */
  @Column({ name: 'user_id' })
  userId: number;

  /**
   * Device information for identifying the session.
   * Stores user-agent string to distinguish between browser, mobile app, etc.
   * Helps users manage their active sessions (e.g., "Chrome on Windows", "iOS App").
   */
  @Column({ name: 'device_info', nullable: true })
  deviceInfo: string;

  /**
   * IP address from which the token was issued.
   * Used for security monitoring and detecting suspicious activity.
   */
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  /**
   * Expiration timestamp for the refresh token.
   * Typically set to 7 days from creation.
   * After expiry, user must re-authenticate.
   */
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  /**
   * Timestamp when the token was revoked (logout, security breach, etc.).
   * Null if token is still active.
   * Used for token rotation: old token is revoked when new one is issued.
   */
  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;

  /**
   * Whether this session was created with "remember me" enabled.
   * When true, refresh token expiry is extended from 7 days to 30 days.
   * Persisted so that token rotation preserves the extended lifetime.
   */
  @Column({ name: 'remember_me', default: false })
  rememberMe: boolean;

  /**
   * Timestamp when the token was created.
   * Used for tracking session duration and security audits.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Check if the refresh token is still valid.
   * Token is valid if:
   * - Not revoked (revokedAt is null)
   * - Not expired (expiresAt is in the future)
   * @returns true if token is valid and can be used, false otherwise
   */
  isValid(): boolean {
    const now = new Date();
    return !this.revokedAt && this.expiresAt > now;
  }

  /**
   * Check if the refresh token has expired.
   * @returns true if token has passed its expiration date
   */
  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  /**
   * Revoke the refresh token immediately.
   * Called during logout or when issuing a new token (rotation).
   * Sets the revokedAt timestamp to now, making the token invalid.
   */
  revoke(): void {
    this.revokedAt = new Date();
  }
}

/**
 * @file guest-session.entity.ts
 * @description Guest Session Entity for SouqSyria E-commerce Platform
 *
 * FEATURES:
 * - Anonymous user session management with secure token generation
 * - 30-day session validity with sliding expiration window
 * - Device fingerprinting for security and analytics
 * - IP address tracking for fraud detection and geographic insights
 * - OneToOne relationship with Cart for guest cart persistence
 *
 * SECURITY:
 * - SHA256 hashed session tokens for secure identification
 * - HTTP-only cookie storage to prevent XSS attacks
 * - Secure flag for HTTPS-only transmission
 * - SameSite=Lax for CSRF protection
 *
 * BUSINESS RULES:
 * - Session expires after 30 days of inactivity
 * - 7-day grace period for session recovery
 * - Automatic conversion to user account on registration
 * - Session data persists for analytics after conversion
 *
 * @author SouqSyria Development Team
 * @since 2025-11-12
 * @version 1.0.0
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  BeforeInsert,
} from 'typeorm';
import { Cart } from './cart.entity';
import { createHash, randomBytes } from 'crypto';

/**
 * GuestSession Entity
 *
 * Represents an anonymous user session for guest shopping functionality.
 * Enables cart persistence for non-authenticated users across browser sessions.
 */
@Entity('guest_sessions')
export class GuestSession {
  /**
   * Primary key - UUID for guest session identification
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Session Token - SHA256 hashed unique identifier for cookie storage
   * This token is stored in HTTP-only cookie on client side
   */
  @Column({
    name: 'session_token',
    type: 'varchar',
    length: 64,
    unique: true, // Creates unique index automatically, no separate @Index() needed
  })
  sessionToken: string;

  /**
   * IP Address - Client IP address for security and analytics
   * Helps detect suspicious activity and geographic patterns
   */
  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 45, // Support IPv6 format
    nullable: true,
  })
  ipAddress?: string;

  /**
   * Device Fingerprint - JSON object containing device characteristics
   * Includes: browser, OS, screen resolution, timezone, language
   * Used for fraud detection and user experience analytics
   */
  @Column({
    name: 'device_fingerprint',
    type: 'json',
    nullable: true,
  })
  deviceFingerprint?: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
    timezone?: string;
    cookiesEnabled?: boolean;
  };

  /**
   * Last Activity Timestamp - When session was last used
   * Updated on every cart operation for sliding expiration
   */
  @Column({
    name: 'last_activity_at',
    type: 'datetime',
  })
  @Index()
  lastActivityAt: Date;

  /**
   * Expiration Timestamp - When session expires (30 days from last activity)
   * Calculated as: lastActivityAt + 30 days
   */
  @Column({
    name: 'expires_at',
    type: 'datetime',
  })
  @Index()
  expiresAt: Date;

  /**
   * Session Status - Current lifecycle state
   * - active: Session is valid and usable
   * - expired: Session has passed expiration date
   * - converted: Session was converted to user account
   */
  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'converted'],
    default: 'active',
  })
  @Index()
  status: 'active' | 'expired' | 'converted';

  /**
   * Converted User ID - Reference to user account after conversion
   * Set when guest registers or logs in with existing cart
   */
  @Column({
    name: 'converted_user_id',
    type: 'int',
    nullable: true,
  })
  convertedUserId?: number;

  /**
   * Cart Association - OneToOne relationship with Cart entity
   * Guest sessions can have one active cart
   */
  @OneToOne(() => Cart, (cart) => cart.guestSession, {
    nullable: true,
  })
  cart?: Cart;

  /**
   * Creation Timestamp - When session was first created
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Last Update Timestamp - When session record was last modified
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  /**
   * BeforeInsert Hook - Generate session token before saving
   * Creates SHA256 hash of random 32-byte value for secure token
   */
  @BeforeInsert()
  generateSessionToken(): void {
    if (!this.sessionToken) {
      const randomValue = randomBytes(32).toString('hex');
      this.sessionToken = createHash('sha256')
        .update(randomValue)
        .digest('hex');
    }

    // Set initial timestamps if not provided
    if (!this.lastActivityAt) {
      this.lastActivityAt = new Date();
    }

    if (!this.expiresAt) {
      // 30 days from now
      this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Check if session has expired
   *
   * @returns boolean - True if session is past expiration date
   */
  isExpired(): boolean {
    return this.expiresAt < new Date() || this.status === 'expired';
  }

  /**
   * Check if session is within grace period (7 days after expiration)
   * Grace period allows session recovery for returning users
   *
   * @returns boolean - True if within 7-day grace period
   */
  isInGracePeriod(): boolean {
    if (!this.isExpired()) return false;

    const gracePeriodEnd = new Date(
      this.expiresAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    return new Date() <= gracePeriodEnd;
  }

  /**
   * Refresh session expiration - Sliding window renewal
   * Extends expiration by 30 days from current time
   * Called on every cart operation to keep active sessions alive
   */
  refreshExpiration(): void {
    this.lastActivityAt = new Date();
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (this.status === 'expired' && this.isInGracePeriod()) {
      this.status = 'active';
    }
  }

  /**
   * Mark session as converted to user account
   *
   * @param userId - User account ID after conversion
   */
  markAsConverted(userId: number): void {
    this.status = 'converted';
    this.convertedUserId = userId;
  }

  /**
   * Get session summary for API responses
   *
   * @returns Object with key session information
   */
  getSummary() {
    return {
      id: this.id,
      sessionToken: this.sessionToken,
      status: this.status,
      isExpired: this.isExpired(),
      isInGracePeriod: this.isInGracePeriod(),
      lastActivity: this.lastActivityAt,
      expiresAt: this.expiresAt,
      ipAddress: this.ipAddress,
      hasCart: !!this.cart,
    };
  }
}

/**
 * @file user.entity.ts
 * @description User table synced from Firebase Auth. Used to assign app-specific roles and preferences.
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { Address } from '../../addresses/entities/address.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'firebase_uid', nullable: true, unique: true })
  firebaseUid: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;
  /**
   * * All addresses belonging to this user (address book)
   * */
  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @Column({ nullable: true })
  fullName: string;
  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string; // ✅ For email/password login

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean; // ✅ After OTP verified

  @Column({ name: 'otp_code', nullable: true })
  otpCode: string; // ✅ Temporary OTP code

  /**
   * 🔐 OAUTH AUTHENTICATION FIELDS
   * These fields handle OAuth login with Google and Facebook
   */
  /**
   * Google OAuth unique identifier.
   * Populated when user authenticates with Google.
   */
  @Column({ name: 'google_id', nullable: true, unique: true })
  googleId: string;

  /**
   * Facebook OAuth unique identifier.
   * Populated when user authenticates with Facebook.
   */
  @Column({ name: 'facebook_id', nullable: true, unique: true })
  facebookId: string;

  /**
   * OAuth provider used for authentication.
   * Can be 'google', 'facebook', or 'email' for traditional registration.
   */
  @Column({ name: 'oauth_provider', nullable: true })
  oauthProvider: 'google' | 'facebook' | 'email' | null;

  /**
   * Profile picture URL from OAuth provider.
   * Used to display user avatar without requiring file upload.
   */
  @Column({ name: 'profile_picture_url', nullable: true })
  profilePictureUrl: string;

  /**
   * OAuth access token from provider (optional).
   * Stored for accessing provider APIs on behalf of user.
   */
  @Column({ name: 'oauth_access_token', type: 'text', nullable: true })
  oauthAccessToken: string;

  /**
   * OAuth refresh token from provider (optional).
   * Used to obtain new access tokens without re-authentication.
   */
  @Column({ name: 'oauth_refresh_token', type: 'text', nullable: true })
  oauthRefreshToken: string;
  /**
   * 🎭 Role Management
   */
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role; // ✅ Normal Buyer / VendorEntity role
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'assigned_role_id' })
  assignedRole: Role; // ✅ Staff role (Marketing, Support, Accounting)

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean; // ❌ Prevent login completely

  @Column({ name: 'is_suspended', default: false })
  isSuspended: boolean; // ⚠️ Allow limited read-only access if needed

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // 🧠 Optional dynamic data
  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Wishlist[];
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date; // 🧹 Soft delete support
  /**
   * 🔐 Password Reset Fields
   * These fields handle the forgot password functionality
   */
  @Column({ name: 'reset_password_token', nullable: true })
  resetPasswordToken: string;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  resetPasswordExpires: Date;
  /**
   * 🔒 ENHANCED SECURITY FIELDS
   * These fields provide enterprise-level account security and monitoring
   */
  /**
   * Track failed login attempts for brute force protection.
   * Account gets locked after 5 failed attempts.
   */
  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;
  /**
   * Timestamp when account will be unlocked after failed attempts.
   * Account is locked for 15 minutes after 5 failed logins.
   */
  @Column({ name: 'account_locked_until', type: 'timestamp', nullable: true })
  accountLockedUntil: Date;

  /**
   * Track when user last changed their password.
   * Used for password age policies and security audits.
   */
  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt: Date;
  /**
   * 🕒 ENHANCED ACTIVITY TRACKING
   */
  /**
   * Track user's last activity for session management.
   * Used to automatically logout inactive users.
   */

  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt: Date;

  /**
   * 🚫 ENHANCED ACCOUNT STATUS MANAGEMENT
   */
  /**
   * Store reason why user was banned or suspended.
   * Helps admin track disciplinary actions.
   */
  @Column({ name: 'ban_reason', nullable: true })
  banReason: string;
  /**
   * Timestamp for temporary bans (auto-unban after this date).
   * If null and isBanned=true, it's a permanent ban.
   */
  @Column({ name: 'banned_until', type: 'timestamp', nullable: true })
  bannedUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * 🔍 HELPER METHODS
   */
  /**
   * 🔍 HELPER METHODS
   * These methods provide convenient ways to check account status and manage security
   */

  /**
   * Check if account is currently locked due to failed login attempts.
   * Account gets locked for 15 minutes after 5 failed attempts.
   * @returns true if account is locked, false if unlocked
   */
  isAccountLocked(): boolean {
    return this.accountLockedUntil && this.accountLockedUntil > new Date();
  }

  /**
   * Check if user is temporarily banned (has bannedUntil date in future).
   * Different from permanent ban (isBanned=true with no bannedUntil date).
   * @returns true if temporarily banned, false if not banned or permanently banned
   */
  isTemporarilyBanned(): boolean {
    return this.bannedUntil && this.bannedUntil > new Date();
  }

  /**
   * Check if password reset token is valid and not expired.
   * Reset tokens expire after 15 minutes for security.
   * @returns true if token is valid and not expired, false otherwise
   */
  isResetTokenValid(): boolean {
    return this.resetPasswordExpires && this.resetPasswordExpires > new Date();
  }

  /**
   * Reset failed login attempts counter and unlock account.
   * Called after successful login to clear security restrictions.
   * This prevents legitimate users from being locked out after successful auth.
   */
  resetFailedAttempts(): void {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
  }

  /**
   * Increment failed login attempts and lock account if threshold reached.
   * Implements progressive security: locks account for 15 minutes after 5 failed attempts.
   * This prevents brute force attacks while allowing legitimate retry attempts.
   */
  incrementFailedAttempts(): void {
    this.failedLoginAttempts += 1;

    // Lock account after 5 failed attempts for 15 minutes
    if (this.failedLoginAttempts >= 5) {
      this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
  }

  /**
   * Check if user's password is older than specified days.
   * Used for password expiration policies in enterprise environments.
   * @param maxDays Maximum days before password expires (default: 90 days)
   * @returns true if password is older than maxDays, false otherwise
   */
  isPasswordExpired(maxDays: number = 90): boolean {
    if (!this.passwordChangedAt) {
      return true; // No password change date = expired
    }

    const maxAge = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
    return this.passwordChangedAt < maxAge;
  }

  /**
   * Check if user has been inactive for specified minutes.
   * Used for automatic session timeout in security-sensitive applications.
   * @param maxInactiveMinutes Maximum inactive time before considering session stale
   * @returns true if user is inactive longer than specified time
   */
  isInactive(maxInactiveMinutes: number = 30): boolean {
    if (!this.lastActivityAt) {
      return true; // No activity recorded = inactive
    }

    const maxInactiveTime = new Date(
      Date.now() - maxInactiveMinutes * 60 * 1000,
    );
    return this.lastActivityAt < maxInactiveTime;
  }
}

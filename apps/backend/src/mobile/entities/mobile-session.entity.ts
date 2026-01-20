import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MobileDeviceEntity } from './mobile-device.entity';

/**
 * Mobile Session Entity
 *
 * Tracks mobile app sessions for analytics, security, and user experience.
 * Each session represents a period of active app usage.
 *
 * Features:
 * - Session duration tracking
 * - Device and location tracking
 * - Security monitoring
 * - Analytics and user behavior insights
 */
@Entity('mobile_sessions')
@Index(['userId', 'deviceId'])
@Index(['startedAt', 'endedAt'])
@Index(['isActive'])
export class MobileSessionEntity {
  /**
   * Primary key
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User who owns this session
   */
  @Column()
  userId: number;

  /**
   * Device used for this session
   */
  @Column()
  deviceId: number;

  /**
   * Unique session identifier
   */
  @Column({
    length: 255,
    comment: 'Unique session token/identifier',
  })
  sessionId: string;

  /**
   * JWT token used for this session
   */
  @Column({
    type: 'text',
    comment: 'JWT access token for this session',
  })
  accessToken: string;

  /**
   * JWT refresh token
   */
  @Column({
    type: 'text',
    nullable: true,
    comment: 'JWT refresh token for token renewal',
  })
  refreshToken: string;

  /**
   * Session start timestamp
   */
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'When session was started',
  })
  startedAt: Date;

  /**
   * Session end timestamp (null if still active)
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When session was ended (null if active)',
  })
  endedAt: Date;

  /**
   * Last activity timestamp
   */
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Last API call or user activity',
  })
  lastActivityAt: Date;

  /**
   * Whether session is currently active
   */
  @Column({
    default: true,
    comment: 'Whether session is currently active',
  })
  isActive: boolean;

  /**
   * How session was ended (logout, timeout, revoked, etc.)
   */
  @Column({
    type: 'enum',
    enum: ['logout', 'timeout', 'revoked', 'expired', 'device_change'],
    nullable: true,
    comment: 'Reason why session ended',
  })
  endReason: 'logout' | 'timeout' | 'revoked' | 'expired' | 'device_change';

  /**
   * IP address at session start
   */
  @Column({
    length: 45,
    nullable: true,
    comment: 'IP address when session started',
  })
  ipAddress: string;

  /**
   * User agent string from mobile app
   */
  @Column({
    type: 'text',
    nullable: true,
    comment: 'User agent from mobile app',
  })
  userAgent: string;

  /**
   * Mobile app version during session
   */
  @Column({
    length: 20,
    nullable: true,
    comment: 'Mobile app version',
  })
  appVersion: string;

  /**
   * Geographic location (city, country)
   */
  @Column({
    length: 255,
    nullable: true,
    comment: 'Geographic location (city, country)',
  })
  location: string;

  /**
   * Total API calls made during session
   */
  @Column({
    default: 0,
    comment: 'Number of API calls made during session',
  })
  apiCallCount: number;

  /**
   * Total data transferred (in bytes)
   */
  @Column({
    type: 'bigint',
    default: 0,
    comment: 'Total bytes transferred during session',
  })
  dataTransferred: number;

  /**
   * Session creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Last update timestamp
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relationship to User entity
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Relationship to MobileDevice entity
   */
  @ManyToOne(() => MobileDeviceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: MobileDeviceEntity;

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivityAt = new Date();
  }

  /**
   * Increment API call counter
   */
  incrementApiCalls(dataSize: number = 0): void {
    this.apiCallCount += 1;
    this.dataTransferred += dataSize;
    this.updateActivity();
  }

  /**
   * End the session with a reason
   */
  endSession(reason: MobileSessionEntity['endReason']): void {
    this.isActive = false;
    this.endedAt = new Date();
    this.endReason = reason;
  }

  /**
   * Check if session has timed out (6 hours of inactivity)
   */
  hasTimedOut(timeoutMinutes: number = 360): boolean {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = new Date().getTime();
    const lastActivity = this.lastActivityAt.getTime();

    return now - lastActivity > timeoutMs;
  }

  /**
   * Get session duration in minutes
   */
  getDurationMinutes(): number {
    const endTime = this.endedAt || new Date();
    const startTime = this.startedAt;
    const durationMs = endTime.getTime() - startTime.getTime();

    return Math.floor(durationMs / (1000 * 60));
  }

  /**
   * Check if session is from the same device
   */
  isSameDevice(deviceId: number): boolean {
    return this.deviceId === deviceId;
  }

  /**
   * Check if session is suspicious (different IP, location, etc.)
   */
  isSuspicious(currentIp: string, currentLocation?: string): boolean {
    if (this.ipAddress && this.ipAddress !== currentIp) {
      return true;
    }

    if (this.location && currentLocation && this.location !== currentLocation) {
      return true;
    }

    return false;
  }

  /**
   * Generate unique session ID
   */
  static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2);
    return `mobile_${timestamp}_${random}`;
  }

  /**
   * Create new active session
   */
  static createSession(
    userId: number,
    deviceId: number,
    accessToken: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
    appVersion?: string,
    location?: string,
  ): MobileSessionEntity {
    const session = new MobileSessionEntity();

    session.userId = userId;
    session.deviceId = deviceId;
    session.sessionId = MobileSessionEntity.generateSessionId();
    session.accessToken = accessToken;
    session.refreshToken = refreshToken;
    session.ipAddress = ipAddress;
    session.userAgent = userAgent;
    session.appVersion = appVersion;
    session.location = location;
    session.isActive = true;

    return session;
  }
}

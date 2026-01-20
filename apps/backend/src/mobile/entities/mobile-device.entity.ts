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

/**
 * Mobile Device Entity
 *
 * Tracks mobile devices registered for push notifications and analytics.
 * Each user can have multiple devices (phone, tablet, etc.).
 *
 * Features:
 * - Device identification and type detection
 * - Push notification token management
 * - Device activity tracking
 * - Security and fraud detection
 */
@Entity('mobile_devices')
@Index(['userId', 'deviceId'], { unique: true })
@Index(['pushToken'], { unique: true, where: 'pushToken IS NOT NULL' })
export class MobileDeviceEntity {
  /**
   * Primary key
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User who owns this device
   */
  @Column()
  userId: number;

  /**
   * Unique device identifier (UUID from mobile app)
   */
  @Column({ length: 255 })
  deviceId: string;

  /**
   * Device type (iOS or Android)
   */
  @Column({
    type: 'enum',
    enum: ['ios', 'android'],
    comment: 'Mobile device platform type',
  })
  deviceType: 'ios' | 'android';

  /**
   * Push notification token (FCM for Android, APNS for iOS)
   */
  @Column({ length: 500, nullable: true })
  pushToken: string;

  /**
   * Device name/model for identification
   */
  @Column({ length: 255, nullable: true })
  deviceName: string;

  /**
   * Mobile app version
   */
  @Column({ length: 20, nullable: true })
  appVersion: string;

  /**
   * Device operating system version
   */
  @Column({ length: 50, nullable: true })
  osVersion: string;

  /**
   * Device active status
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Push notifications enabled for this device
   */
  @Column({ default: true })
  notificationsEnabled: boolean;

  /**
   * Last time device was used to access the app
   */
  @Column({ type: 'timestamp', nullable: true })
  lastAccessAt: Date;

  /**
   * Device registration timestamp
   */
  @CreateDateColumn()
  registeredAt: Date;

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
   * Update device access timestamp
   */
  updateLastAccess(): void {
    this.lastAccessAt = new Date();
  }

  /**
   * Enable/disable push notifications
   */
  setNotifications(enabled: boolean): void {
    this.notificationsEnabled = enabled;
  }

  /**
   * Deactivate device (user logs out)
   */
  deactivate(): void {
    this.isActive = false;
    this.pushToken = null;
  }

  /**
   * Check if device supports push notifications
   */
  canReceivePushNotifications(): boolean {
    return this.isActive && this.notificationsEnabled && !!this.pushToken;
  }
}

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
 * Mobile Notification Entity
 *
 * Stores push notifications sent to mobile devices.
 * Supports both individual and broadcast notifications.
 *
 * Features:
 * - Push notification tracking and delivery status
 * - Arabic/English localized content
 * - Deep linking for mobile apps
 * - Analytics and engagement tracking
 */
@Entity('mobile_notifications')
@Index(['userId', 'deviceId'])
@Index(['type', 'status'])
@Index(['sentAt', 'deliveredAt'])
export class MobileNotificationEntity {
  /**
   * Primary key
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User who receives this notification (null for broadcast)
   */
  @Column({ nullable: true })
  userId: number;

  /**
   * Specific device to send notification to (null for all user devices)
   */
  @Column({ nullable: true })
  deviceId: number;

  /**
   * Notification type/category
   */
  @Column({
    type: 'enum',
    enum: [
      'order_update',
      'payment_confirmation',
      'shipping_update',
      'promotion',
      'new_product',
      'price_drop',
      'stock_alert',
      'account_update',
      'security_alert',
      'marketing',
      'system_announcement',
    ],
    comment: 'Type of notification for categorization and filtering',
  })
  type:
    | 'order_update'
    | 'payment_confirmation'
    | 'shipping_update'
    | 'promotion'
    | 'new_product'
    | 'price_drop'
    | 'stock_alert'
    | 'account_update'
    | 'security_alert'
    | 'marketing'
    | 'system_announcement';

  /**
   * Notification title (English)
   */
  @Column({
    length: 255,
    comment: 'Notification title in English',
  })
  titleEn: string;

  /**
   * Notification title (Arabic)
   */
  @Column({
    length: 255,
    comment: 'Notification title in Arabic',
  })
  titleAr: string;

  /**
   * Notification body/message (English)
   */
  @Column({
    type: 'text',
    comment: 'Notification message body in English',
  })
  bodyEn: string;

  /**
   * Notification body/message (Arabic)
   */
  @Column({
    type: 'text',
    comment: 'Notification message body in Arabic',
  })
  bodyAr: string;

  /**
   * Deep link URL for mobile app navigation
   */
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Deep link URL to open specific screen in app',
  })
  deepLink: string;

  /**
   * Custom data payload (JSON)
   */
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Additional custom data for the notification',
  })
  payload: Record<string, any>;

  /**
   * Notification priority level
   */
  @Column({
    type: 'enum',
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal',
    comment: 'Priority level affects delivery and display behavior',
  })
  priority: 'low' | 'normal' | 'high' | 'critical';

  /**
   * Delivery status
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled'],
    default: 'pending',
    comment: 'Current delivery status of the notification',
  })
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

  /**
   * When notification was scheduled to be sent
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Scheduled send time (null for immediate)',
  })
  scheduledAt: Date;

  /**
   * When notification was actually sent
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Actual time notification was sent to FCM/APNS',
  })
  sentAt: Date;

  /**
   * When notification was delivered to device
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When notification was delivered to device',
  })
  deliveredAt: Date;

  /**
   * When user opened/clicked the notification
   */
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'When user opened the notification',
  })
  openedAt: Date;

  /**
   * Error message if delivery failed
   */
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Error message if notification failed to send',
  })
  errorMessage: string;

  /**
   * Firebase/APNS message ID for tracking
   */
  @Column({
    length: 255,
    nullable: true,
    comment: 'Message ID from push notification service',
  })
  messageId: string;

  /**
   * Number of retry attempts for failed notifications
   */
  @Column({
    default: 0,
    comment: 'Number of retry attempts for failed notifications',
  })
  retryCount: number;

  /**
   * Maximum retry attempts allowed
   */
  @Column({
    default: 3,
    comment: 'Maximum number of retry attempts',
  })
  maxRetries: number;

  /**
   * Notification creation timestamp
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Last update timestamp
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Relationship to User entity (nullable for broadcast notifications)
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Relationship to MobileDevice entity (nullable for all-device notifications)
   */
  @ManyToOne(() => MobileDeviceEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'deviceId' })
  device: MobileDeviceEntity;

  /**
   * Mark notification as sent
   */
  markAsSent(messageId?: string): void {
    this.status = 'sent';
    this.sentAt = new Date();
    if (messageId) {
      this.messageId = messageId;
    }
  }

  /**
   * Mark notification as delivered
   */
  markAsDelivered(): void {
    this.status = 'delivered';
    this.deliveredAt = new Date();
  }

  /**
   * Mark notification as opened by user
   */
  markAsOpened(): void {
    this.openedAt = new Date();
  }

  /**
   * Mark notification as failed
   */
  markAsFailed(errorMessage: string): void {
    this.status = 'failed';
    this.errorMessage = errorMessage;
  }

  /**
   * Check if notification can be retried
   */
  canRetry(): boolean {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  }

  /**
   * Increment retry count
   */
  incrementRetryCount(): void {
    this.retryCount += 1;
  }

  /**
   * Check if notification is overdue (scheduled but not sent)
   */
  isOverdue(): boolean {
    if (!this.scheduledAt || this.status !== 'pending') {
      return false;
    }

    return new Date() > this.scheduledAt;
  }

  /**
   * Get localized title based on language
   */
  getLocalizedTitle(language: 'en' | 'ar'): string {
    return language === 'ar' ? this.titleAr : this.titleEn;
  }

  /**
   * Get localized body based on language
   */
  getLocalizedBody(language: 'en' | 'ar'): string {
    return language === 'ar' ? this.bodyAr : this.bodyEn;
  }

  /**
   * Check if notification was opened by user
   */
  wasOpened(): boolean {
    return !!this.openedAt;
  }

  /**
   * Get delivery duration in seconds
   */
  getDeliveryDurationSeconds(): number | null {
    if (!this.sentAt || !this.deliveredAt) {
      return null;
    }

    const sentTime = this.sentAt.getTime();
    const deliveredTime = this.deliveredAt.getTime();

    return Math.floor((deliveredTime - sentTime) / 1000);
  }

  /**
   * Create a new notification
   */
  static create(
    type: MobileNotificationEntity['type'],
    titleEn: string,
    titleAr: string,
    bodyEn: string,
    bodyAr: string,
    userId?: number,
    deviceId?: number,
    deepLink?: string,
    payload?: Record<string, any>,
    priority: MobileNotificationEntity['priority'] = 'normal',
    scheduledAt?: Date,
  ): MobileNotificationEntity {
    const notification = new MobileNotificationEntity();

    notification.type = type;
    notification.titleEn = titleEn;
    notification.titleAr = titleAr;
    notification.bodyEn = bodyEn;
    notification.bodyAr = bodyAr;
    notification.userId = userId;
    notification.deviceId = deviceId;
    notification.deepLink = deepLink;
    notification.payload = payload;
    notification.priority = priority;
    notification.scheduledAt = scheduledAt;

    return notification;
  }
}

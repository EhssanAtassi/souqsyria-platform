/**
 * @file vendor-alert.entity.ts
 * @description Entity for storing vendor dashboard alerts and notifications
 *
 * Purpose: Important notifications and action items displayed on vendor dashboard
 * Used for: Low stock alerts, pending orders, policy changes, system notifications
 *
 * @swagger VendorAlert
 * @author SouqSyria Development Team
 * @since 2025-01-20
 */

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
import { VendorEntity } from '../../vendors/entities/vendor.entity';

/**
 * Alert type enum (severity levels)
 */
export enum AlertType {
  INFO = 'info', // Informational message
  WARNING = 'warning', // Warning that needs attention
  ERROR = 'error', // Error or critical issue
  SUCCESS = 'success', // Success notification
}

/**
 * VendorAlert Entity
 *
 * Stores important notifications and alerts for vendors
 * Supports bilingual content (English/Arabic) and expiration
 *
 * Key Features:
 * - Bilingual alert messages (EN/AR)
 * - Severity classification (info, warning, error, success)
 * - Read/unread tracking
 * - Auto-expiration for time-sensitive alerts
 * - Action-required flag for priority alerts
 *
 * Security: Foreign key ensures vendor ownership validation
 */
@Entity('vendor_alerts')
@Index(['vendorId', 'isRead', 'expiresAt']) // Fast lookup for unread alerts
@Index(['vendorId', 'createdAt']) // Fast lookup by date
export class VendorAlert {
  /**
   * Primary key - auto-generated UUID
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Foreign key relationship to Vendor entity
   * ON DELETE CASCADE ensures cleanup when vendor is deleted
   */
  @ManyToOne(() => VendorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  /**
   * Vendor ID for indexed queries
   */
  @Column({ name: 'vendor_id', type: 'int' })
  vendorId: number;

  /**
   * Alert type/severity (info, warning, error, success)
   */
  @Column({
    name: 'type',
    type: 'enum',
    enum: AlertType,
    default: AlertType.INFO,
  })
  type: AlertType;

  /**
   * Alert title in English
   */
  @Column({ name: 'title_en', type: 'varchar', length: 255 })
  titleEn: string;

  /**
   * Alert title in Arabic
   */
  @Column({ name: 'title_ar', type: 'varchar', length: 255 })
  titleAr: string;

  /**
   * Alert message in English
   */
  @Column({ name: 'message_en', type: 'text' })
  messageEn: string;

  /**
   * Alert message in Arabic
   */
  @Column({ name: 'message_ar', type: 'text' })
  messageAr: string;

  /**
   * Whether this alert requires vendor action
   * If true, highlighted in dashboard until resolved
   */
  @Column({ name: 'action_required', type: 'boolean', default: false })
  actionRequired: boolean;

  /**
   * Action URL (optional) - where vendor should go to resolve
   * Examples: "/products/low-stock", "/orders/pending", "/settings/kyc"
   */
  @Column({ name: 'action_url', type: 'varchar', length: 255, nullable: true })
  actionUrl: string;

  /**
   * Action button text in English
   */
  @Column({ name: 'action_text_en', type: 'varchar', length: 100, nullable: true })
  actionTextEn: string;

  /**
   * Action button text in Arabic
   */
  @Column({ name: 'action_text_ar', type: 'varchar', length: 100, nullable: true })
  actionTextAr: string;

  /**
   * Whether vendor has read this alert
   */
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  /**
   * Timestamp when vendor marked alert as read
   */
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  /**
   * Alert expiration timestamp
   * After this time, alert is no longer displayed
   * Null = no expiration
   */
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  /**
   * Priority level (higher = more important)
   * Used for sorting alerts in dashboard
   */
  @Column({ name: 'priority', type: 'int', default: 0 })
  priority: number;

  /**
   * Related entity type (optional)
   * Examples: "product", "order", "payout", "kyc"
   */
  @Column({ name: 'related_entity_type', type: 'varchar', length: 50, nullable: true })
  relatedEntityType: string;

  /**
   * Related entity ID (optional)
   * Links alert to specific product, order, etc.
   */
  @Column({ name: 'related_entity_id', type: 'int', nullable: true })
  relatedEntityId: number;

  /**
   * Metadata (JSON) for additional context
   * Examples: { productCount: 5, threshold: 10 }
   */
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata: any;

  /**
   * Timestamp when this record was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when this record was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Business method: Check if alert is active (not expired)
   */
  isActive(): boolean {
    if (!this.expiresAt) return true;
    return new Date() < this.expiresAt;
  }

  /**
   * Business method: Mark alert as read
   */
  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }
}

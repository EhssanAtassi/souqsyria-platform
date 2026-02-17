import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductEntity } from '../../entities/product.entity';

/**
 * @description Stock notification entity for tracking user notification requests
 * when products come back in stock
 *
 * @swagger
 * components:
 *   schemas:
 *     StockNotification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique notification ID
 *         productId:
 *           type: integer
 *           description: ID of product to notify about
 *         variantId:
 *           type: integer
 *           nullable: true
 *           description: Optional variant ID if notification is for specific variant
 *         email:
 *           type: string
 *           format: email
 *           description: Email address to send notification to
 *         userId:
 *           type: integer
 *           nullable: true
 *           description: Optional user ID if user is authenticated
 *         status:
 *           type: string
 *           enum: [pending, notified, expired]
 *           description: Current notification status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When notification was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When notification was last updated
 */
@Entity('stock_notifications')
export class StockNotificationEntity {
  /**
   * @description Unique notification identifier
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * @description Product ID to monitor for stock changes
   */
  @Column({ name: 'product_id' })
  productId: number;

  /**
   * @description Optional variant ID for variant-specific notifications
   */
  @Column({ name: 'variant_id', nullable: true })
  variantId?: number;

  /**
   * @description Email address for notification delivery
   */
  @Column({ length: 255 })
  email: string;

  /**
   * @description Optional user ID if authenticated
   */
  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  /**
   * @description Notification status tracking
   * - pending: Waiting for stock availability
   * - notified: Email sent to user
   * - expired: No longer needed (user unsubscribed or product discontinued)
   */
  @Column({
    type: 'enum',
    enum: ['pending', 'notified', 'expired'],
    default: 'pending',
  })
  status: 'pending' | 'notified' | 'expired';

  /**
   * @description Timestamp when notification was created
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * @description Timestamp when notification was last updated
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * @description Relation to product entity
   */
  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;
}

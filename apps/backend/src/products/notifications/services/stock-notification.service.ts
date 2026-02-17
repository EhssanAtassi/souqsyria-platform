import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockNotificationEntity } from '../entities/stock-notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';

/**
 * @description Service for managing stock notification subscriptions
 * Handles creating, removing, and querying stock notification requests
 *
 * @swagger
 * tags:
 *   - name: Stock Notifications
 *     description: Stock notification subscription operations
 */
@Injectable()
export class StockNotificationService {
  constructor(
    @InjectRepository(StockNotificationEntity)
    private readonly notificationRepository: Repository<StockNotificationEntity>,
  ) {}

  /**
   * @description Subscribe to stock notifications for a product
   * Creates a new notification request if one doesn't exist
   * Prevents duplicate subscriptions for same email/product/variant combination
   *
   * @param productId - Product ID to monitor
   * @param dto - Notification details (email, optional variantId)
   * @param userId - Optional user ID if authenticated
   * @returns Created notification entity
   * @throws ConflictException if subscription already exists
   *
   * @swagger
   * /products/{productId}/notify:
   *   post:
   *     summary: Subscribe to stock notifications
   *     description: Register email to receive notification when product comes back in stock
   *     parameters:
   *       - name: productId
   *         in: path
   *         required: true
   *         schema:
   *           type: number
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateNotificationDto'
   *     responses:
   *       201:
   *         description: Subscription created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StockNotification'
   *       409:
   *         description: Subscription already exists
   *       404:
   *         description: Product not found
   */
  async subscribe(
    productId: number,
    dto: CreateNotificationDto,
    userId?: number,
  ): Promise<StockNotificationEntity> {
    // Check for existing pending subscription
    const existing = await this.notificationRepository.findOne({
      where: {
        productId,
        email: dto.email,
        variantId: dto.variantId || null,
        status: 'pending',
      },
    });

    if (existing) {
      throw new ConflictException(
        'You are already subscribed to notifications for this product',
      );
    }

    // Create new notification
    const notification = this.notificationRepository.create({
      productId,
      email: dto.email,
      variantId: dto.variantId,
      userId,
      status: 'pending',
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * @description Unsubscribe from stock notifications
   * Marks notification as expired rather than deleting for audit purposes
   *
   * @param productId - Product ID
   * @param email - Email address to unsubscribe
   * @returns Updated notification entity
   * @throws NotFoundException if subscription not found
   *
   * @swagger
   * /products/{productId}/notify:
   *   delete:
   *     summary: Unsubscribe from stock notifications
   *     description: Cancel stock notification subscription for given email
   *     parameters:
   *       - name: productId
   *         in: path
   *         required: true
   *         schema:
   *           type: number
   *       - name: email
   *         in: query
   *         required: true
   *         schema:
   *           type: string
   *           format: email
   *     responses:
   *       200:
   *         description: Successfully unsubscribed
   *       404:
   *         description: Subscription not found
   */
  async unsubscribe(
    productId: number,
    email: string,
  ): Promise<StockNotificationEntity> {
    const notification = await this.notificationRepository.findOne({
      where: {
        productId,
        email,
        status: 'pending',
      },
    });

    if (!notification) {
      throw new NotFoundException(
        'No active notification subscription found for this email',
      );
    }

    notification.status = 'expired';
    return await this.notificationRepository.save(notification);
  }

  /**
   * @description Get pending notifications for a product
   * Used by stock update service to trigger notifications when product comes back in stock
   *
   * @param productId - Product ID
   * @param variantId - Optional variant ID
   * @returns Array of pending notifications
   */
  async getPendingNotifications(
    productId: number,
    variantId?: number,
  ): Promise<StockNotificationEntity[]> {
    const where: any = {
      productId,
      status: 'pending',
    };

    if (variantId !== undefined) {
      where.variantId = variantId;
    }

    return await this.notificationRepository.find({ where });
  }

  /**
   * @description Mark notifications as notified
   * Called after successfully sending notification emails
   *
   * @param notificationIds - Array of notification IDs to mark as notified
   * @returns Number of updated records
   */
  async markAsNotified(notificationIds: number[]): Promise<number> {
    const result = await this.notificationRepository.update(
      { id: In(notificationIds) },
      { status: 'notified' },
    );

    return result.affected || 0;
  }

  /**
   * @description Get notification count for a product
   * Useful for displaying how many users are waiting for stock
   *
   * @param productId - Product ID
   * @param variantId - Optional variant ID
   * @returns Count of pending notifications
   */
  async getNotificationCount(
    productId: number,
    variantId?: number,
  ): Promise<number> {
    const where: any = {
      productId,
      status: 'pending',
    };

    if (variantId !== undefined) {
      where.variantId = variantId;
    }

    return await this.notificationRepository.count({ where });
  }
}

// Import for markAsNotified method
import { In } from 'typeorm';

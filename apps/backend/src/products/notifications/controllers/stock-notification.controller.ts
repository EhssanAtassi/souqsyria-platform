import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { StockNotificationService } from '../services/stock-notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { StockNotificationEntity } from '../entities/stock-notification.entity';

/**
 * @description Stock notification controller
 * Handles public API endpoints for stock notification subscriptions
 * No authentication required - allows guest users to subscribe
 *
 * @swagger
 * tags:
 *   - name: Stock Notifications
 *     description: Stock notification subscription endpoints
 */
@ApiTags('Stock Notifications')
@Controller('products')
export class StockNotificationController {
  constructor(private readonly notificationService: StockNotificationService) {}

  /**
   * @description Subscribe to stock notifications
   * Public endpoint - no auth required
   * Allows users to register email for notification when product comes back in stock
   *
   * Rate Limit: 5 subscription requests per hour to prevent email spam
   *
   * @param productId - Product ID from route parameter
   * @param dto - Notification subscription details
   * @param req - Optional request object to extract user ID if authenticated
   * @returns Created notification entity
   *
   * @swagger
   * /products/{productId}/notify:
   *   post:
   *     summary: Subscribe to stock notifications
   *     description: Register email to receive notification when product is back in stock
   *     tags:
   *       - Stock Notifications
   *     parameters:
   *       - name: productId
   *         in: path
   *         required: true
   *         description: Product ID to subscribe to
   *         schema:
   *           type: integer
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateNotificationDto'
   *           example:
   *             email: customer@example.com
   *             variantId: 123
   *     responses:
   *       201:
   *         description: Successfully subscribed to notifications
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/StockNotification'
   *       400:
   *         description: Invalid request data
   *       409:
   *         description: Already subscribed
   */
  @Post(':id/notify')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour
  @ApiOperation({
    summary: 'Subscribe to stock notifications',
    description:
      'Register email to receive notification when product comes back in stock. Public endpoint - no authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Product ID',
    example: 42,
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: 'Notification subscription details',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully subscribed to notifications',
    type: StockNotificationEntity,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already subscribed to this product',
  })
  async subscribe(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateNotificationDto,
    @Req() req?: any,
  ): Promise<StockNotificationEntity> {
    // Extract user ID if authenticated (optional)
    const userId = req?.user?.id;

    return await this.notificationService.subscribe(productId, dto, userId);
  }

  /**
   * @description Unsubscribe from stock notifications
   * Public endpoint - no auth required
   * Allows users to cancel notification subscription
   *
   * @param productId - Product ID from route parameter
   * @param email - Email address to unsubscribe (from query parameter)
   * @returns Updated notification entity
   *
   * @swagger
   * /products/{productId}/notify:
   *   delete:
   *     summary: Unsubscribe from stock notifications
   *     description: Cancel stock notification subscription for the given email
   *     tags:
   *       - Stock Notifications
   *     parameters:
   *       - name: productId
   *         in: path
   *         required: true
   *         description: Product ID
   *         schema:
   *           type: integer
   *       - name: email
   *         in: query
   *         required: true
   *         description: Email address to unsubscribe
   *         schema:
   *           type: string
   *           format: email
   *     responses:
   *       200:
   *         description: Successfully unsubscribed
   *       404:
   *         description: Subscription not found
   */
  @Delete(':id/notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unsubscribe from stock notifications',
    description:
      'Cancel stock notification subscription. Public endpoint - no authentication required.',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'Product ID',
    example: 42,
  })
  @ApiQuery({
    name: 'email',
    type: 'string',
    description: 'Email address to unsubscribe',
    example: 'customer@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully unsubscribed from notifications',
    type: StockNotificationEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found for this email',
  })
  async unsubscribe(
    @Param('id', ParseIntPipe) productId: number,
    @Query('email') email: string,
  ): Promise<StockNotificationEntity> {
    return await this.notificationService.unsubscribe(productId, email);
  }
}

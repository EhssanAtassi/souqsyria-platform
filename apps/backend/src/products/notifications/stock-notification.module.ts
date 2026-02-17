import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockNotificationEntity } from './entities/stock-notification.entity';
import { StockNotificationService } from './services/stock-notification.service';
import { StockNotificationController } from './controllers/stock-notification.controller';

/**
 * @description Stock Notification Module
 * Handles stock notification subscriptions for out-of-stock products
 * Provides endpoints for users to subscribe/unsubscribe to stock alerts
 *
 * @module StockNotificationModule
 *
 * Features:
 * - Public API for email-based notifications
 * - No authentication required for subscription
 * - Duplicate subscription prevention
 * - Variant-specific notifications support
 */
@Module({
  imports: [TypeOrmModule.forFeature([StockNotificationEntity])],
  controllers: [StockNotificationController],
  providers: [StockNotificationService],
  exports: [StockNotificationService],
})
export class StockNotificationModule {}

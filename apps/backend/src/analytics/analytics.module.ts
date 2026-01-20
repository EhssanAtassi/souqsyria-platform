/**
 * @file analytics.module.ts
 * @description Analytics module for tracking user events
 *
 * Provides unified analytics tracking for:
 * - Hero banners
 * - Products
 * - Categories
 *
 * @author SouqSyria Development Team
 * @since 2025-10-08
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEntity } from './entities/analytics.entity';

/**
 * Analytics Module
 *
 * Handles analytics event tracking across the platform
 */
@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

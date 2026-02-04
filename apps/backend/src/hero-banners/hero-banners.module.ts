/**
 * @file hero-banners.module.ts
 * @description NestJS module configuration for hero banners feature
 *
 * Provides:
 * - Hero banner CRUD operations
 * - Analytics tracking
 * - Approval workflow
 * - Scheduling management
 * - Syrian cultural data integration
 *
 * @author SouqSyria Development Team
 * @since 2025-10-07
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroBanner } from './entities/hero-banner.entity';
import { HeroBannersService } from './services/hero-banners.service';
import { HeroBannersController } from './controllers/hero-banners.controller';

/**
 * Hero Banners Module
 *
 * Manages homepage hero banner carousel with:
 * - Campaign creation and scheduling
 * - Real-time analytics tracking
 * - Approval workflow
 * - Multi-device responsive images
 * - Syrian cultural integration
 */
@Module({
  imports: [
    // Register HeroBanner entity with TypeORM
    TypeOrmModule.forFeature([HeroBanner]),
  ],
  controllers: [
    HeroBannersController,
  ],
  providers: [
    HeroBannersService,
  ],
  exports: [
    HeroBannersService, // Export service for use in other modules
  ],
})
export class HeroBannersModule {}

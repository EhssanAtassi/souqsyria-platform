/**
 * @file promo-cards.module.ts
 * @description Promo Cards module with TypeORM and Redis caching
 *
 * @author SouqSyria Development Team
 * @since 2025-02-02
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCard } from './entities/promo-card.entity';
import { PromoCardsService } from './services/promo-cards.service';
import { PromoCardsController } from './controllers/promo-cards.controller';

/**
 * Promo Cards Module
 *
 * Provides promotional card management for hero banner 70/30 layout with:
 * - TypeORM entity registration
 * - Redis caching for performance
 * - Public and admin endpoints
 * - Analytics tracking
 * - Approval workflow
 */
@Module({
  imports: [TypeOrmModule.forFeature([PromoCard])],
  controllers: [PromoCardsController],
  providers: [PromoCardsService],
  exports: [PromoCardsService],
})
export class PromoCardsModule {}

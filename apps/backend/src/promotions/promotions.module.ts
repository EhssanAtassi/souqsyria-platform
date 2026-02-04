/**
 * @file promotions.module.ts
 * @description Enterprise promotions and coupons module for SouqSyria platform
 *
 * Provides comprehensive promotional functionality including:
 * - Advanced coupon management with Syrian localization
 * - Promotion campaign orchestration
 * - Usage analytics and reporting
 *
 * @author SouqSyria Development Team
 * @since 2025-08-16
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CouponEntity } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { PromotionCampaign } from './entities/promotion-campaign.entity';

// External Entities
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { Route } from '../access-control/entities/route.entity';

// Controllers
import { CouponsController } from './controllers/coupons.controller';
import { PromotionRuleController } from './controllers/promotion-rule.controller';

// Services
import { CouponsService } from './services/coupons.service';
import { PromotionRuleService } from './services/promotion-rule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Promotion entities
      CouponEntity,
      CouponUsage,
      PromotionCampaign,
      // External entities
      User,
      Category,
      VendorEntity,
      Route,
    ]),
  ],
  controllers: [
    // CouponsController,      // Temporarily disabled - PermissionsGuard dependency issue
    PromotionRuleController,
  ],
  providers: [
    CouponsService,
    PromotionRuleService,
  ],
  exports: [
    CouponsService,
    PromotionRuleService,
  ],
})
export class PromotionsModule {}

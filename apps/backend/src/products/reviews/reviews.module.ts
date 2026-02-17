/**
 * @file reviews.module.ts
 * @description Reviews module for product review management
 *
 * Features:
 * - Public review browsing and submission
 * - Admin review moderation
 * - Review summary calculations
 * - Helpfulness voting
 *
 * @author SouqSyria Development Team
 * @since 2026-02-16
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReviewEntity } from './entities/product-review.entity';
import { ProductEntity } from '../entities/product.entity';
import { ReviewsService } from './services/reviews.service';
import { PublicReviewsController } from './controllers/public-reviews.controller';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { TokenBlacklist } from '../../auth/entity/token-blacklist.entity';
import { Route } from '../../access-control/entities/route.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Reviews Module
 *
 * Handles product review functionality including:
 * - Review submission and listing
 * - Rating aggregations and summaries
 * - Admin moderation workflow
 * - Helpfulness voting
 *
 * Dependencies:
 * - ProductEntity: For product slug resolution
 * - TokenBlacklist: For JWT authentication guard
 * - Route + User: For PermissionsGuard in admin controller (required for @InjectRepository resolution)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductReviewEntity,
      ProductEntity,
      TokenBlacklist,
      Route, // Required for PermissionsGuard @InjectRepository(Route) in AdminReviewsController
      User, // Required for PermissionsGuard @InjectRepository(User) in AdminReviewsController
    ]),
  ],
  controllers: [PublicReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

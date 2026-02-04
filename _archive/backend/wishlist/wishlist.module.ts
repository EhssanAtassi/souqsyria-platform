// src/wishlist/wishlist.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { User } from '../users/entities/user.entity';
import { WishlistService } from './service/wishlist.service';
import {
  WishlistController,
  AdminWishlistController,
} from './controller/wishlist.controller';
import { ProductEntity } from '../products/entities/product.entity';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';
import { CartModule } from '../cart/cart.module';
import { AccessControlModule } from '../access-control/access-control.module';

// Seeding Components
import { WishlistSeederService } from './seeds/wishlist-seeder.service';
import { WishlistSeederController } from './seeds/wishlist-seeder.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wishlist,
      ProductEntity,
      ProductVariant, // <-- Register ProductVariant for repository injection
      User,
    ]),
    CartModule,
    AccessControlModule,
  ],
  providers: [
    WishlistService,
    WishlistSeederService,
    // CartService, // Only add if CartService is not already in the CartModule's exports (usually you just import CartModule)
  ],
  controllers: [WishlistController, AdminWishlistController, WishlistSeederController],
  exports: [WishlistService, WishlistSeederService],
})
export class WishlistModule {}

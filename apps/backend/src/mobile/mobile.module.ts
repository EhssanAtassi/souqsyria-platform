import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Import mobile controllers
import { MobileProductsController } from './v1/controllers/mobile-products.controller';
import { MobileCartController } from './v1/controllers/mobile-cart.controller';
import { MobileOrdersController } from './v1/controllers/mobile-orders.controller';
import { MobileAuthController } from './v1/controllers/mobile-auth.controller';
import { MobileUserController } from './v1/controllers/mobile-user.controller';
import { MobileNotificationsController } from './v1/controllers/mobile-notifications.controller';
import { MobileSearchController } from './v1/controllers/mobile-search.controller';

// Import mobile services
import { MobileProductsService } from './v1/services/mobile-products.service';
import { MobileCartService } from './v1/services/mobile-cart.service';
import { MobileOrdersService } from './v1/services/mobile-orders.service';
import { MobileAuthService } from './v1/services/mobile-auth.service';
import { MobileUserService } from './v1/services/mobile-user.service';
import { MobileNotificationsService } from './v1/services/mobile-notifications.service';
import { MobileSearchService } from './v1/services/mobile-search.service';
import { MobileImageOptimizationService } from './v1/services/mobile-image-optimization.service';

// Import seeder controller and service
import { MobileSeederController } from './seeds/mobile.seeder.controller';
import { MobileSeederService } from './seeds/mobile.seeder.service';

// Import entities from other modules
import { ProductEntity } from '../products/entities/product.entity';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { ProductDescriptionEntity } from '../products/entities/product-description.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';
import { ManufacturerEntity } from '../manufacturers/entities/manufacturer.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';

// Import mobile-specific entities
import { MobileDeviceEntity } from './entities/mobile-device.entity';
import { MobileOTPEntity } from './entities/mobile-otp.entity';
import { MobileSessionEntity } from './entities/mobile-session.entity';
import { MobileNotificationEntity } from './entities/mobile-notification.entity';

/**
 * Mobile APIs Module
 *
 * Provides optimized API endpoints specifically designed for mobile applications
 * with lightweight responses, image optimization, and mobile-specific features.
 *
 * Features:
 * - Optimized response formats for mobile bandwidth
 * - Image compression and multiple sizes
 * - Push notification support
 * - Mobile-specific authentication flows
 * - Offline-ready data structures
 * - Performance optimizations for mobile networks
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mobile-jwt-secret-key',
      signOptions: {
        expiresIn: process.env.MOBILE_JWT_EXPIRES_IN || '7d',
      },
    }),
    TypeOrmModule.forFeature([
      // Product entities
      ProductEntity,
      ProductVariant,
      ProductImage,
      ProductDescriptionEntity,

      // Cart entities
      Cart,
      CartItem,

      // Order entities
      Order,
      OrderItem,

      // User entities
      User,

      // Catalog entities
      Category,
      Brand,
      ManufacturerEntity,
      VendorEntity,

      // Mobile-specific entities
      MobileDeviceEntity,
      MobileOTPEntity,
      MobileSessionEntity,
      MobileNotificationEntity,
    ]),
  ],
  controllers: [
    MobileProductsController,
    MobileCartController,
    MobileOrdersController,
    MobileAuthController,
    MobileUserController,
    MobileNotificationsController,
    MobileSearchController,
    MobileSeederController,
  ],
  providers: [
    MobileProductsService,
    MobileCartService,
    MobileOrdersService,
    MobileAuthService,
    MobileUserService,
    MobileNotificationsService,
    MobileSearchService,
    MobileImageOptimizationService,
    MobileSeederService,
  ],
  exports: [
    MobileProductsService,
    MobileCartService,
    MobileOrdersService,
    MobileAuthService,
    MobileUserService,
    MobileNotificationsService,
    MobileSearchService,
    MobileImageOptimizationService,
  ],
})
export class MobileModule {}

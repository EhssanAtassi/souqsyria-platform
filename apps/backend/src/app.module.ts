/**
 * @file app.module.ts
 * @description Main entry point of SouqSyria backend. Sets up global modules, TypeORM, and security guards.
 */
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { GuestSessionMiddleware } from './common/middleware/guest-session.middleware';
import { IdempotencyMiddleware } from './common/middleware/idempotency.middleware';
import { GuestSession } from './cart/entities/guest-session.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { KycModule } from './kyc/kyc.module';

import { APP_GUARD } from '@nestjs/core'; // ✅ Import NestJS Core
import { RolesGuard } from './common/guards/roles.guards'; // ✅ Import our custom RolesGuard
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { AccessControlModule } from './access-control/access-control.module';
import { StaffManagementModule } from './staff-management/staff-management.module';
import { ProductsModule } from './products/products.module';
import { VendorsModule } from './vendors/vendors.module';
import { VendorDashboardModule } from './vendor-dashboard/vendor-dashboard.module'; // ✅ Enabled: Week 1 Day 1-2 Foundation Complete
import { MembershipsModule } from './memberships/memberships.module';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
// import { ManufacturersService } from './manufacturers.service';
import { StockModule } from './stock/stock.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { AttributesModule } from './attributes/attributes.module';
import { FeaturesModule } from './features/features.module';

import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { CommissionsModule } from './commissions/commissions.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressesModule } from './addresses/addresses.module';
import { PaymentModule } from './payment/payment.module';
import { RefundModule } from './refund/refund.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { GuardsModule } from './common/guards/guards.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ProductionLoggerService } from './common/services/logger.service';
import { TestingModule } from './testing/testing.module';
import { MobileModule } from './mobile/mobile.module';
import { VersioningModule } from './common/versioning/versioning.module';
import { AdminModule } from './admin/admin.module';
import { HeroBannersModule } from './hero-banners/hero-banners.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeaturedCategoriesModule } from './featured-categories/featured-categories.module';
import { ProductCarouselsModule } from './product-carousels/product-carousels.module';
import { HomepageModule } from './homepage/homepage.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([GuestSession]), // ✅ For GuestSessionMiddleware repository injection
    // ✅ Configure in-memory cache for idempotency
    CacheModule.register({
      ttl: 86400000, // 24 hours in milliseconds
      max: 1000, // Maximum 1000 cached idempotency keys
      isGlobal: true, // Make cache available globally
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    KycModule,
    CategoriesModule,
    BrandsModule,
    AccessControlModule,
    StaffManagementModule,
    ProductsModule,
    VendorsModule,
    VendorDashboardModule, // ✅ Enabled: Week 1 Day 1-2 Foundation Complete
    MembershipsModule,
    ManufacturersModule,
    StockModule,
    WarehousesModule,
    AttributesModule,
    FeaturesModule,
    CartModule,
    OrdersModule,
    CommissionsModule,
    ShipmentsModule,
    DashboardModule,
    WishlistModule,
    AddressesModule,
    PaymentModule,
    RefundModule,
    PromotionsModule,
    AuditLogModule,
    GuardsModule,
    TestingModule,
    MobileModule,
    VersioningModule,
    AdminModule,
    HeroBannersModule,
    AnalyticsModule,
    FeaturedCategoriesModule,
    ProductCarouselsModule,
    HomepageModule,
    AdminDashboardModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ProductionLoggerService,
    IdempotencyMiddleware, // ✅ Register idempotency middleware as provider
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Configure middleware for guest session management and idempotency
   *
   * MIDDLEWARE ORDER:
   * 1. GuestSessionMiddleware - Manages guest sessions for anonymous users
   * 2. IdempotencyMiddleware - Prevents duplicate request processing
   *
   * @param consumer - Middleware consumer to apply middleware to routes
   */
  configure(consumer: MiddlewareConsumer) {
    // ✅ Apply GuestSessionMiddleware to all cart routes for guest shopping support
    consumer
      .apply(GuestSessionMiddleware)
      .forRoutes('cart', 'cart/guest');

    // ✅ Apply IdempotencyMiddleware to specific cart endpoints that need idempotency
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes(
        { path: 'cart/sync', method: RequestMethod.POST },
        { path: 'cart/guest', method: RequestMethod.POST },
        { path: 'cart/merge', method: RequestMethod.POST },
        { path: 'cart/add', method: RequestMethod.POST },
        { path: 'cart/item/:itemId', method: RequestMethod.PUT },
      );
  }
}

/**
 * @file app.module.ts
 * @description Main entry point of SouqSyria backend. Sets up global modules, TypeORM, and security guards.
 */
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // ✅ JWT Authentication Guard
import { PermissionsGuard } from './access-control/guards/permissions.guard'; // ✅ Dynamic RBAC Permission Guard
import { RolesGuard } from './common/guards/roles.guards'; // ✅ Legacy Role Guard (fallback)
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { AccessControlModule } from './access-control/access-control.module';
import { StaffManagementModule } from './staff-management/staff-management.module';
import { ProductsModule } from './products/products.module';
import { VendorsModule } from './vendors/vendors.module';
// import { VendorDashboardModule } from './vendor-dashboard/vendor-dashboard.module'; // ⚠️ TEMPORARILY DISABLED - Missing dependencies (28 compilation errors)
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
    // ✅ Load environment variables from .env file (must be first)
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
      envFilePath: '.env', // Path to .env file
    }),
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
    // VendorDashboardModule, // ⚠️ TEMPORARILY DISABLED - Missing dependencies (28 compilation errors)
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
    /**
     * GLOBAL GUARD EXECUTION ORDER (CRITICAL - DO NOT CHANGE ORDER):
     * 
     * 1. JwtAuthGuard - Authentication layer (validates JWT tokens)
     *    - Runs first to authenticate users
     *    - Attaches user object to request
     *    - Allows unauthenticated requests to pass (handled by controller decorators)
     * 
     * 2. PermissionsGuard - Authorization layer (dynamic RBAC)
     *    - Checks route-permission mappings in database
     *    - Supports dual-role system (business + admin roles)
     *    - Respects @Public() decorator for public routes
     *    - Logs all permission checks to SecurityAuditLog
     *    - Cache-enabled (5-minute TTL) for performance
     *    - Target: <5ms (cache hit), <50ms (cache miss)
     * 
     * 3. RolesGuard - Legacy role checking (fallback)
     *    - Decorator-based role checking (@Roles('admin'))
     *    - Maintained for backward compatibility
     *    - Gradually phasing out in favor of PermissionsGuard
     * 
     * 4. ThrottlerGuard - Rate limiting
     *    - Protects against brute force and DoS attacks
     *    - Short: 3 requests/second
     *    - Medium: 100 requests/minute
     * 
     * SECURITY ARCHITECTURE:
     * - Multi-layer defense (authentication → authorization → rate limiting)
     * - Defense in depth strategy
     * - Comprehensive audit logging
     * - OWASP-compliant security controls
     * 
     * PERFORMANCE OPTIMIZATION:
     * - JwtAuthGuard: <5ms (passport JWT validation)
     * - PermissionsGuard: <5ms (cached), <50ms (DB lookup)
     * - RolesGuard: <1ms (metadata reflection)
     * - ThrottlerGuard: <2ms (Redis/memory lookup)
     * - Total: ~10-60ms per request
     */
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 🔐 1st: Authentication
    },
    {
      provide: APP_GUARD,
      useExisting: PermissionsGuard, // 🛡️ 2nd: Authorization (NEW - Dynamic RBAC) - Uses instance from GuardsModule
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 🎭 3rd: Legacy Role Check (Fallback)
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // ⏱️ 4th: Rate Limiting
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

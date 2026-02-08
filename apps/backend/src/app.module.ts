/**
 * @file app.module.ts
 * @description Main entry point of SouqSyria backend (MVP1).
 * Sets up global modules, TypeORM, and security guards.
 */
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { GuestSessionMiddleware } from './common/middleware/guest-session.middleware';
import { IdempotencyMiddleware } from './common/middleware/idempotency.middleware';
import { GuestSession } from './cart/entities/guest-session.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';

import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './access-control/guards/permissions.guard';
import { RolesGuard } from './common/guards/roles.guards';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ProductionLoggerService } from './common/services/logger.service';

// MVP1 Core Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AccessControlModule } from './access-control/access-control.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { VendorsModule } from './vendors/vendors.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { AddressesModule } from './addresses/addresses.module';
import { PaymentModule } from './payment/payment.module';
import { PromotionsModule } from './promotions/promotions.module';
import { GuardsModule } from './common/guards/guards.module';
import { VersioningModule } from './common/versioning/versioning.module';

// MVP1 Homepage & Storefront Modules
import { HeroBannersModule } from './hero-banners/hero-banners.module';
import { FeaturedCategoriesModule } from './featured-categories/featured-categories.module';
import { ProductCarouselsModule } from './product-carousels/product-carousels.module';
import { HomepageModule } from './homepage/homepage.module';
import { PromoCardsModule } from './promo-cards/promo-cards.module';

// Cross-cutting Modules (kept for MVP1 dependencies)
import { AuditLogModule } from './audit-log/audit-log.module';
import { StockModule } from './stock/stock.module';
import { RefundModule } from './refund/refund.module';
import { WarehousesModule } from './warehouses/warehouses.module';

// Infrastructure
import { SharedDomainModule } from './common/shared-domain';
import { HealthModule } from './health';

@Module({
  imports: [
    // Load environment variables from .env file (must be first)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    // Shared Domain Module - Event-driven architecture for breaking circular dependencies
    SharedDomainModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([GuestSession]),

    // MVP1 Core
    AuthModule,
    UsersModule,
    RolesModule,
    AccessControlModule,
    CategoriesModule,
    ProductsModule,
    VendorsModule,
    CartModule,
    OrdersModule,
    ShipmentsModule,
    AddressesModule,
    PaymentModule,
    PromotionsModule,
    GuardsModule,
    VersioningModule,

    // MVP1 Homepage & Storefront
    HeroBannersModule,
    FeaturedCategoriesModule,
    ProductCarouselsModule,
    HomepageModule,
    PromoCardsModule,

    // Cross-cutting (required by MVP1 modules)
    AuditLogModule,
    StockModule,
    RefundModule,
    WarehousesModule,

    // Infrastructure
    HealthModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ProductionLoggerService,
    IdempotencyMiddleware,
    /**
     * GLOBAL GUARD EXECUTION ORDER (CRITICAL - DO NOT CHANGE ORDER):
     *
     * 1. JwtAuthGuard - Authentication (validates JWT tokens)
     * 2. PermissionsGuard - Authorization (dynamic RBAC from database)
     * 3. RolesGuard - Legacy role checking (fallback, phasing out)
     * 4. ThrottlerGuard - Rate limiting (10/sec, 100/min)
     */
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: PermissionsGuard,
    },
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
   * @param consumer - Middleware consumer to apply middleware to routes
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GuestSessionMiddleware)
      .forRoutes('cart', 'cart/guest');

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

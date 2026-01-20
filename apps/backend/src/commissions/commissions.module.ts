/**
 * @file commissions.module.ts
 * @description Enterprise Commission Management Module with Syrian Analytics
 *
 * ENTERPRISE FEATURES:
 * - Sophisticated 4-tier commission hierarchy system
 * - Advanced Syrian market analytics with governorate insights
 * - Multi-currency commission tracking (SYP/USD/EUR)
 * - Automated payout processing and vendor tier management
 * - Business intelligence with Arabic/English localization
 * - Performance optimization and revenue analytics
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { CommissionsService } from './service/commissions.service';

// Controllers
import { CommissionsController } from './controllers/commissions.controller';
import { SyrianCommissionAnalyticsController } from './controllers/syrian-commission-analytics.controller';

// Seeding Components
import { CommissionSeederService } from './seeds/commission-seeder.service';
import { CommissionSeederController } from './seeds/commission-seeder.controller';

// Core Commission Entities
import { ProductCommissionEntity } from './entites/product-commission.entity';
import { VendorCommissionEntity } from './entites/vendor-commission.entity';
import { CategoryCommissionEntity } from './entites/category-commission.entity';
import { GlobalCommissionEntity } from './entites/global-commission.entity';
import { MembershipDiscountEntity } from './entites/membership-discount.entity';
import { CommissionAuditLogEntity } from './entites/commission-audit-log.entity';
import { CommissionPayoutEntity } from './entites/commission-payout.entity';

// Syrian Analytics Entity
import { SyrianCommissionAnalyticsEntity } from './entites/syrian-commission-analytics.entity';

// External Entities
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';

// External Module Dependencies
import { UsersModule } from '../users/users.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { AddressesModule } from '../addresses/addresses.module';

@Module({
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      // Core Commission Entities (Enterprise-ready)
      ProductCommissionEntity, // Product-specific commission rates
      VendorCommissionEntity, // Vendor-specific commission rates
      CategoryCommissionEntity, // Category-level commission rates
      GlobalCommissionEntity, // Global default commission rates
      MembershipDiscountEntity, // Membership-based discounts
      CommissionAuditLogEntity, // Full audit trail
      CommissionPayoutEntity, // Payout processing and tracking

      // Syrian Analytics Entity
      SyrianCommissionAnalyticsEntity, // Advanced Syrian market analytics

      // External Entities
      User, // User and vendor information
      Order, // Order information
      OrderItem, // Order item details for commission calculation
      ProductEntity, // Product information
      Category, // Category information
      SyrianGovernorateEntity, // Syrian geographic data
    ]),

    // Schedule Module for Automated Tasks
    ScheduleModule.forRoot(),

    // Access Control
    AccessControlModule,

    // External Module Dependencies
    UsersModule, // For user and vendor management
    CategoriesModule, // For category-based commission calculations
    ProductsModule, // For product information and analytics
    OrdersModule, // For sales data and commission calculations
    AddressesModule, // For Syrian governorate analytics
  ],

  providers: [
    // Core Commission Service (already enterprise-ready)
    CommissionsService, // Sophisticated 4-tier hierarchy system

    // Seeding Service
    CommissionSeederService, // Professional commission data seeding
  ],

  controllers: [
    // Main Commission Management Controller
    CommissionsController, // Original commission management APIs

    // Enhanced Analytics Controller
    SyrianCommissionAnalyticsController, // Syrian market analytics and business intelligence

    // Seeding Controller
    CommissionSeederController, // Professional commission data seeding APIs
  ],

  exports: [
    // Services available to other modules
    CommissionsService, // Commission calculation and management
    CommissionSeederService, // Commission seeding service for other modules

    // TypeORM repositories for external access
    TypeOrmModule,
  ],
})
export class CommissionsModule {}

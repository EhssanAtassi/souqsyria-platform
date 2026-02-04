/**
 * @file dashboard.module.ts
 * @description Enterprise Syrian Dashboard Module with Comprehensive Analytics
 *
 * ENTERPRISE FEATURES:
 * - Syrian market analytics with SYP currency and governorate insights
 * - Real-time performance monitoring with Arabic localization
 * - Integration with KYC, Manufacturers, and Shipments modules
 * - Advanced business intelligence and predictive analytics
 * - Comprehensive reporting and export capabilities
 * - Performance optimization with caching and real-time updates
 * - Multi-language support with Arabic/English localization
 * - Economic indicators and market trend analysis
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Legacy Components (for backward compatibility)
import { DashboardController } from './controller/dashboard.controller';
import { DashboardService } from './service/dashboard.service';

// Enterprise Components
import { SyrianDashboardController } from './controllers/syrian-dashboard.controller';
import { SyrianAnalyticsService } from './services/syrian-analytics.service';

// Seeding Components
import { DashboardSeederController } from './seeds/dashboard-seeder.controller';
import { DashboardSeederService } from './seeds/dashboard-seeder.service';

// Core Entities
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { RefundTransaction } from '../refund/entities/refund-transaction.entity';
import { ReturnRequest } from '../orders/entities/return-request.entity';
import { VendorEntity } from '../vendors/entities/vendor.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { StockAlertEntity } from '../stock/entities/stock-alert.entity';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity';

// Enterprise Entities
import { SyrianKycDocumentEntity } from '../kyc/entities/syrian-kyc-document.entity';
import { SyrianManufacturerEntity } from '../manufacturers/entities/syrian-manufacturer.entity';
import { SyrianGovernorateEntity } from '../addresses/entities';
import { Shipment } from '../shipments/entities/shipment.entity';

// Legacy Entities (for backward compatibility)

// External Modules
import { CommissionsModule } from '../commissions/commissions.module';
import { AccessControlModule } from '../access-control/access-control.module';
import { CategoriesModule } from '../categories/categories.module';
import { KycModule } from '../kyc/kyc.module';
import { ManufacturersModule } from '../manufacturers/manufacturers.module';
import { AddressesModule } from '../addresses/addresses.module';
import { ShipmentsModule } from '../shipments/shipments.module';

@Module({
  imports: [
    // TypeORM entities registration
    TypeOrmModule.forFeature([
      // Core Analytics Entities
      Order,
      OrderItem,
      RefundTransaction,
      ReturnRequest,
      VendorEntity,
      ProductEntity,
      StockAlertEntity,
      User,
      Route,

      // Enterprise Entities
      SyrianKycDocumentEntity,
      SyrianManufacturerEntity,
      SyrianGovernorateEntity,
      Shipment,

      // Legacy Entity (for backward compatibility)
    ]),

    // Schedule module for automated analytics updates
    ScheduleModule.forRoot(),

    // External modules for comprehensive analytics
    CommissionsModule,
    AccessControlModule,
    CategoriesModule,
    KycModule,
    ManufacturersModule,
    AddressesModule,
    ShipmentsModule,
  ],

  providers: [
    // Enterprise Services
    SyrianAnalyticsService,

    // Seeding Services
    DashboardSeederService,

    // Legacy Service (for backward compatibility)
    DashboardService,
  ],

  controllers: [
    // Enterprise Controller
    SyrianDashboardController,

    // Seeding Controllers
    DashboardSeederController,

    // Legacy Controller (for backward compatibility)
    DashboardController,
  ],

  exports: [
    // Export enterprise services for use in other modules
    SyrianAnalyticsService,

    // Legacy exports (for backward compatibility)
    DashboardService,
  ],
})
export class DashboardModule {}

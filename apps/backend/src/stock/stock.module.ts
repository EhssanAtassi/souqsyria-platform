/**
 * @file stock.module.ts
 * @description Enterprise Stock Management Module with Syrian Localization
 *
 * ENTERPRISE FEATURES:
 * - Advanced inventory reservation and allocation system
 * - Real-time stock analytics with Syrian governorate integration
 * - Multi-currency inventory valuation (SYP/USD/EUR)
 * - Demand forecasting and predictive analytics
 * - Performance monitoring with Arabic/English localization
 * - Automated cron jobs for analytics and alerts
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { StockService } from './stock.service';
import { SyrianStockAnalyticsService } from './services/syrian-stock-analytics.service';
import { InventoryReservationService } from './services/inventory-reservation.service';

// Controllers
import { StockController } from './stock.controller';
import { SyrianStockAnalyticsController } from './controllers/syrian-stock-analytics.controller';

// Entities
import { ProductStockEntity } from './entities/product-stock.entity';
import { StockMovementEntity } from './entities/stock-movement.entity';
import { StockAlertEntity } from './entities/stock-alert.entity';
import { SyrianStockAnalyticsEntity } from './entities/syrian-stock-analytics.entity';
import {
  InventoryReservationEntity,
  InventoryAllocationEntity,
} from './entities/inventory-reservation.entity';

// External Entities
import { ProductEntity } from '../products/entities/product.entity';
import { ProductVariant } from '../products/variants/entities/product-variant.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';

// External Module Dependencies
import { AccessControlModule } from '../access-control/access-control.module';
import { ProductsModule } from '../products/products.module';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { AddressesModule } from '../addresses/addresses.module';

@Module({
  imports: [
    // TypeORM Entities
    TypeOrmModule.forFeature([
      // Core Stock Entities
      ProductStockEntity, // Basic product stock tracking
      StockMovementEntity, // Stock movement history
      StockAlertEntity, // Basic stock alerts

      // Enterprise Entities
      SyrianStockAnalyticsEntity, // Advanced Syrian stock analytics
      InventoryReservationEntity, // Enterprise inventory reservation
      InventoryAllocationEntity, // Inventory allocation tracking

      // External Entities
      ProductEntity, // Product information
      ProductVariant, // Product variants
      Warehouse, // Warehouse information
      User, // User management
      Order, // Order information
      OrderItem, // Order item details
      SyrianGovernorateEntity, // Syrian geographic data
    ]),

    // Schedule Module for Cron Jobs
    ScheduleModule.forRoot(),

    // Access Control
    AccessControlModule,

    // External Module Dependencies (with forward references to avoid circular dependencies)
    forwardRef(() => ProductsModule), // For product information and variants
    forwardRef(() => WarehousesModule), // For warehouse information and geographic data
    forwardRef(() => OrdersModule), // For sales data and demand analytics
    forwardRef(() => UsersModule), // For user information and permissions
    forwardRef(() => AddressesModule), // For Syrian governorate and geographic optimization
  ],

  providers: [
    // Legacy Service (maintaining backward compatibility)
    StockService,

    // Enterprise Services
    SyrianStockAnalyticsService, // Advanced analytics with Syrian localization
    InventoryReservationService, // Enterprise reservation and allocation
  ],

  controllers: [
    // Legacy Controller (maintaining backward compatibility)
    StockController,

    // Enterprise Controllers
    SyrianStockAnalyticsController, // Syrian stock analytics and dashboards
  ],

  exports: [
    // Services available to other modules
    StockService,
    SyrianStockAnalyticsService,
    InventoryReservationService,

    // TypeORM repositories for external access
    TypeOrmModule,
  ],
})
export class StockModule {}

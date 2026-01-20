/**
 * 🚚 Enhanced ShipmentsModule - Syrian Localization & Enterprise Workflow
 *
 * ENTERPRISE FEATURES:
 * - Syrian shipping companies integration with Arabic/English localization
 * - 15-state enterprise workflow engine with SLA monitoring
 * - Multi-currency cost calculations (SYP primary)
 * - Performance analytics and bottleneck detection
 * - Real-time workflow monitoring and bulk operations
 * - Integration with Syrian address system
 * - Comprehensive API endpoints with Swagger documentation
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Core Services
import { ShipmentsService } from './service/shipments.service';
import { SyrianShippingService } from './services/syrian-shipping.service';
import { ShipmentWorkflowService } from './services/shipment-workflow.service';
import { ShipmentTrackingService } from './services/shipment-tracking.service';
import { AramexProvider } from './providers/aramex.provider';
import { DhlProvider } from './providers/dhl.provider';

// Controllers
import { ShipmentsController } from './controller/shipments.controller';
import { SyrianShipmentsController } from './controllers/syrian-shipments.controller';

// Seeding
import { ShipmentSeederService } from './seeds/shipment-seeder.service';
import { ShipmentSeederController } from './seeds/shipment-seeder.controller';

// Core Entities
import { Shipment } from './entities/shipment.entity';
import { ShipmentItem } from './entities/shipment-item.entity';
import { ShippingCompany } from './entities/shipping-company.entity';
import { ShipmentStatusLog } from './entities/shipment-status-log.entity';

// Syrian Entities
import { SyrianShippingCompanyEntity } from './entities/syrian-shipping-company.entity';

// External Dependencies
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { AccessControlModule } from '../access-control/access-control.module';
import { Route } from '../access-control/entities/route.entity';

// Syrian Address System
import { SyrianAddressEntity } from '../addresses/entities/syrian-address.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';
import { SyrianCityEntity } from '../addresses/entities/syrian-city.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core Shipment Entities
      Shipment,
      ShipmentItem,
      ShippingCompany,
      ShipmentStatusLog,

      // Syrian Shipping Entities
      SyrianShippingCompanyEntity,

      // External Entities
      Order,
      OrderItem,
      User,
      Route,

      // Syrian Address System
      SyrianAddressEntity,
      SyrianGovernorateEntity,
      SyrianCityEntity,
    ]),
    AccessControlModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    ShipmentsController,
    SyrianShipmentsController, // New enterprise controller
    ShipmentSeederController, // Seeding endpoints
  ],
  providers: [
    ShipmentsService,
    SyrianShippingService, // Syrian companies management
    ShipmentWorkflowService, // Enterprise workflow engine
    ShipmentTrackingService, // Carrier polling service
    ShipmentSeederService, // Seeding service
    AramexProvider,
    DhlProvider,
  ],
  exports: [
    ShipmentsService,
    SyrianShippingService,
    ShipmentWorkflowService,
    ShipmentTrackingService,
    ShipmentSeederService,
  ],
})
export class ShipmentsModule {}

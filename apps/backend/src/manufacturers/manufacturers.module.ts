/**
 * @file manufacturers.module.ts
 * @description Enterprise Syrian Manufacturers Module with Comprehensive Features
 *
 * ENTERPRISE FEATURES:
 * - Syrian localization and business registration integration
 * - Advanced verification workflow with SLA monitoring
 * - Comprehensive business analytics and performance tracking
 * - Integration with Syrian governorate and address system
 * - Multi-level document verification and compliance
 * - Real-time notifications and escalation management
 * - Performance optimization with caching and indexing
 * - Automated quality metrics and business insights
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Legacy entities (kept for backward compatibility)
import { ManufacturerEntity } from './entities/manufacturer.entity';

// New Enterprise Entities
import { SyrianManufacturerEntity } from './entities/syrian-manufacturer.entity';

// Enterprise Services
import { SyrianManufacturerService } from './services/syrian-manufacturer.service';
import { SyrianManufacturerWorkflowService } from './services/syrian-manufacturer-workflow.service';

// Seeding Components
import { ManufacturersSeederService } from './seeds/manufacturers-seeder.service';
import { ManufacturersSeederController } from './seeds/manufacturers-seeder.controller';

// Controllers
import { SyrianManufacturerController } from './controllers/syrian-manufacturer.controller';

// Legacy components (kept for backward compatibility)
import { ManufacturersService } from './manufacturers.service';
import { ManufacturersController } from './manufacturers.controller';

// External Dependencies
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';
import { ProductEntity } from '../products/entities/product.entity';

// External Modules
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AddressesModule } from '../addresses/addresses.module';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [
    // TypeORM entities registration
    TypeOrmModule.forFeature([
      // Enterprise Entities
      SyrianManufacturerEntity,

      // Legacy Entity (for backward compatibility)
      ManufacturerEntity,

      // External Entities
      User,
      Role,
      SyrianGovernorateEntity,
      ProductEntity,
    ]),

    // Schedule module for cron jobs (workflow monitoring)
    ScheduleModule.forRoot(),

    // External modules
    UsersModule,
    RolesModule,
    AddressesModule,
    AccessControlModule,
  ],

  providers: [
    // Enterprise Services
    SyrianManufacturerService,
    SyrianManufacturerWorkflowService,

    // Seeding Services
    ManufacturersSeederService,

    // Legacy Service (for backward compatibility)
    ManufacturersService,
  ],

  controllers: [
    // Enterprise API Controllers
    SyrianManufacturerController,

    // Seeding Controllers
    ManufacturersSeederController,

    // Legacy Controller (for backward compatibility)
    ManufacturersController,
  ],

  exports: [
    // Export enterprise services for use in other modules
    SyrianManufacturerService,
    SyrianManufacturerWorkflowService,

    // Legacy exports (for backward compatibility)
    ManufacturersService,
    TypeOrmModule,
  ],
})
export class ManufacturersModule {}

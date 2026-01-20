/**
 * @file vendors.module.ts
 * @description Enterprise Vendors Module with Syrian Business Management
 *
 * ENTERPRISE FEATURES:
 * - Comprehensive Syrian vendor management with localization
 * - Advanced workflow engine with 9-state verification process
 * - Performance monitoring and quality scoring
 * - SLA monitoring and compliance tracking
 * - Bulk operations and analytics
 * - Integration with Syrian business regulations
 * - Arabic/English bilingual support
 *
 * @author SouqSyria Development Team
 * @since 2025-08-10
 * @version 2.0.0 - Enterprise Edition
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Legacy Entities (for backward compatibility)
import { VendorEntity } from './entities/vendor.entity';
import { VendorMembershipEntity } from './entities/vendor-membership.entity';
import { Membership } from '../memberships/entities/membership.entity';

// Enterprise Entities
import { SyrianVendorEntity } from './entities/syrian-vendor.entity';

// Core Entities
import { User } from '../users/entities/user.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';

// Services
import { VendorsService } from './vendors.service';
import { SyrianVendorService } from './services/syrian-vendor.service';
import { SyrianVendorWorkflowService } from './services/syrian-vendor-workflow.service';

// Seeding Services
import { VendorSeederService } from './seeds/vendor.seeder.service';

// Controllers
import { VendorsController } from './vendors.controller';
import { SyrianVendorController } from './controllers/syrian-vendor.controller';

// Seeding Controllers
import { VendorSeederController } from './seeds/vendor-seeder.controller';

// External Modules
import { UsersModule } from '../users/users.module';
import { AddressesModule } from '../addresses/addresses.module';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [
    // TypeORM entities registration
    TypeOrmModule.forFeature([
      // Legacy Entities (for backward compatibility)
      VendorEntity,
      VendorMembershipEntity,
      Membership,

      // Enterprise Entities
      SyrianVendorEntity,

      // Core Entities
      User,
      SyrianGovernorateEntity,
    ]),

    // Schedule module for automated workflow monitoring
    ScheduleModule.forRoot(),

    // External modules
    UsersModule,
    AddressesModule,
    AccessControlModule,
  ],

  providers: [
    // Enterprise Services
    SyrianVendorService,
    SyrianVendorWorkflowService,

    // Legacy Service (for backward compatibility)
    VendorsService,

    // Seeding Services
    VendorSeederService,
  ],

  controllers: [
    // Enterprise Controller
    SyrianVendorController,

    // Legacy Controller (for backward compatibility)
    VendorsController,

    // Seeding Controllers
    VendorSeederController,
  ],

  exports: [
    // Export enterprise services for use in other modules
    SyrianVendorService,
    SyrianVendorWorkflowService,
    VendorsService,
    TypeOrmModule,
  ],
})
export class VendorsModule {}

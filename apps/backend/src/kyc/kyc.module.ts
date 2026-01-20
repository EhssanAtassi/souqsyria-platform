/**
 * @file kyc.module.ts
 * @description Enterprise Syrian KYC Module with Comprehensive Features
 *
 * ENTERPRISE FEATURES:
 * - Syrian localization and regulatory compliance
 * - Advanced workflow engine with SLA monitoring
 * - Comprehensive audit trails and compliance tracking
 * - Performance analytics and bottleneck detection
 * - Multi-level document verification system
 * - Real-time notifications and escalation management
 * - Integration with access control and user management
 * - Automated cron job monitoring
 *
 * @author SouqSyria Development Team
 * @since 2025-08-09
 * @version 2.0.0 - Enterprise Edition
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Core Services
import { SyrianKycService } from './services/syrian-kyc.service';
import { SyrianKycWorkflowService } from './services/syrian-kyc-workflow.service';

// Seeding Services
import { KycSeederService } from './seeds/kyc-seeder.service';

// Controllers
import { SyrianKycController } from './controllers/syrian-kyc.controller';
import { KycSeederController } from './seeds/kyc-seeder.controller';

// Entities
import { SyrianKycDocumentEntity } from './entities/syrian-kyc-document.entity';
import { SyrianKycStatusLog } from './entities/syrian-kyc-status-log.entity';

// External Dependencies
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { SyrianGovernorateEntity } from '../addresses/entities/syrian-governorate.entity';
import { Route } from '../access-control/entities/route.entity';

// External Modules
import { UsersModule } from '../users/users.module';
import { RolesModule } from '../roles/roles.module';
import { AddressesModule } from '../addresses/addresses.module';
import { AccessControlModule } from '../access-control/access-control.module';

@Module({
  imports: [
    // TypeORM entities registration
    TypeOrmModule.forFeature([
      // KYC Entities
      SyrianKycDocumentEntity,
      SyrianKycStatusLog,

      // External Entities
      User,
      Role,
      SyrianGovernorateEntity,
      Route,
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
    // Core KYC Services
    SyrianKycService,
    SyrianKycWorkflowService,
    
    // Seeding Services
    KycSeederService,
  ],

  controllers: [
    // KYC API Controllers
    SyrianKycController,
    
    // Seeding Controllers
    KycSeederController,
  ],

  exports: [
    // Export services for use in other modules
    SyrianKycService,
    SyrianKycWorkflowService,
  ],
})
export class KycModule {}

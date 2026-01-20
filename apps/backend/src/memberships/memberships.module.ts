/**
 * @file memberships.module.ts
 * @description Memberships Module with all services, controllers, and dependencies
 *
 * FEATURES:
 * - Complete membership management functionality
 * - TypeORM entity registration
 * - Membership seeding functionality
 * - Modular service architecture
 *
 * SERVICES INCLUDED:
 * - MembershipsService (Core CRUD operations)
 * - MembershipSeederService (Enterprise seeding functionality)
 *
 * @author SouqSyria Development Team
 * @since 2025-08-15
 */

import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity';

// ================================
// SEEDING IMPORTS
// ================================
import { MembershipSeederService } from './seeds/membership-seeder.service';
import { MembershipSeederController } from './seeds/membership-seeder.controller';

@Module({
  // ================================
  // DATABASE ENTITIES REGISTRATION
  // ================================
  imports: [
    TypeOrmModule.forFeature([
      Membership, // Main membership entity
      Route, // For access control
      User, // For user relationships
    ]),
  ],

  // ================================
  // API CONTROLLERS
  // ================================
  controllers: [
    // Core membership management controller
    MembershipsController,

    // ✅ SEEDING CONTROLLER: Enterprise membership seeding functionality
    MembershipSeederController,
  ],

  // ================================
  // SERVICE PROVIDERS
  // ================================
  providers: [
    // Core membership management service
    MembershipsService,

    // ✅ SEEDING SERVICE: Enterprise membership seeding functionality
    MembershipSeederService,
  ],

  // ================================
  // MODULE EXPORTS
  // ================================
  exports: [
    // Export TypeORM for other modules that need Membership entity
    TypeOrmModule,

    // Export core service for other modules to use
    MembershipsService,

    // ✅ Export seeding service for other modules
    MembershipSeederService,
  ],
})
export class MembershipsModule {
  constructor() {
    console.log(
      '🚀 Memberships Module initialized with enterprise seeding features',
    );
  }
}

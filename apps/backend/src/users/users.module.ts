/**
 * @file users.module.ts
 * @description Users Module with all services, controllers, and dependencies
 *
 * FEATURES:
 * - Complete user management functionality
 * - TypeORM entity registration
 * - Role-based access control integration
 * - User seeding functionality
 * - Modular service architecture
 *
 * SERVICES INCLUDED:
 * - UsersService (Core CRUD operations)
 * - UserSeederService (Enterprise seeding functionality)
 *
 * @author SouqSyria Development Team
 * @since 2025-08-14
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ================================
// ENTITIES
// ================================
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Wishlist } from '../wishlist/entities/wishlist.entity';
import { Address } from '../addresses/entities/address.entity';

// ================================
// CONTROLLERS
// ================================
import { UsersController } from './users.controller';

// ================================
// CORE SERVICES
// ================================
import { UsersService } from './users.service';

// ================================
// SEEDING IMPORTS
// ================================
import { UserSeederService } from './seeds/user-seeder.service';
import { UserSeederController } from './seeds/user-seeder.controller';

@Module({
  // ================================
  // DATABASE ENTITIES REGISTRATION
  // ================================
  imports: [
    TypeOrmModule.forFeature([
      User, // Main user entity
      Role, // For role-based access control
      Wishlist, // For user wishlist functionality
      Address, // For user address management
    ]),
  ],

  // ================================
  // API CONTROLLERS
  // ================================
  controllers: [
    // Core user management controller
    UsersController,

    // ✅ SEEDING CONTROLLER: Enterprise user seeding functionality
    UserSeederController,
  ],

  // ================================
  // SERVICE PROVIDERS
  // ================================
  providers: [
    // Core user management service
    UsersService,

    // ✅ SEEDING SERVICE: Enterprise user seeding functionality
    UserSeederService,
  ],

  // ================================
  // MODULE EXPORTS
  // ================================
  exports: [
    // Export TypeORM for other modules that need User entity
    TypeOrmModule,

    // Export core service for other modules to use
    UsersService,

    // ✅ Export seeding service for other modules
    UserSeederService,
  ],
})
export class UsersModule {
  constructor() {
    console.log('🚀 Users Module initialized with enterprise seeding features');
  }
}

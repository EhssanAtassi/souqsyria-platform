/**
 * @file users.module.ts
 * @description Users Module with all services, controllers, and dependencies
 *
 * FEATURES:
 * - Complete user management functionality
 * - TypeORM entity registration
 * - Role-based access control integration
 * - Modular service architecture
 *
 * SERVICES INCLUDED:
 * - UsersService (Core CRUD operations)
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
  ],

  // ================================
  // SERVICE PROVIDERS
  // ================================
  providers: [
    // Core user management service
    UsersService,
  ],

  // ================================
  // MODULE EXPORTS
  // ================================
  exports: [
    // Export TypeORM for other modules that need User entity
    TypeOrmModule,

    // Export core service for other modules to use
    UsersService,
  ],
})
export class UsersModule {}

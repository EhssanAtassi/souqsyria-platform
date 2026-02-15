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
import { ConfigModule } from '@nestjs/config';

// ================================
// ENTITIES
// ================================
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Wishlist } from '../wishlist/entities/wishlist.entity';
import { Address } from '../addresses/entities/address.entity';
import { RefreshToken } from '../auth/entity/refresh-token.entity';
import { SecurityAudit } from '../auth/entity/security-audit.entity';

// ================================
// CONTROLLERS
// ================================
import { UsersController } from './users.controller';

// ================================
// CORE SERVICES
// ================================
import { UsersService } from './users.service';
import { EmailService } from '../auth/service/email.service';

@Module({
  // ================================
  // DATABASE ENTITIES REGISTRATION
  // ================================
  imports: [
    // Configuration module for email service
    ConfigModule,

    // TypeORM entity registration
    TypeOrmModule.forFeature([
      User, // Main user entity
      Role, // For role-based access control
      Wishlist, // For user wishlist functionality
      Address, // For user address management
      RefreshToken, // For session invalidation on password change
      SecurityAudit, // For password change security audit logging
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

    // Email service for password change notifications
    EmailService,
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

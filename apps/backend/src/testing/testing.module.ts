/**
 * @file testing.module.ts
 * @description Simple Testing Module for SouqSyria Backend
 *
 * This module provides basic database seeding functionality that actually works.
 * It focuses on core entities and avoids complex relationships that cause compilation errors.
 *
 * @author SouqSyria Development Team
 * @since 2025-08-11
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Seeding Services
import { SimpleSeedingService } from './services/simple-seeding.service';

// Core entities that we know work
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Category } from '../categories/entities/category.entity';
import { Brand } from '../brands/entities/brand.entity';

// Note: Syrian entities will be added when they are created

/**
 * Testing Module
 *
 * Provides basic seeding functionality for development and testing.
 * Uses only core entities that are stable and don't cause compilation errors.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Core entities
      User,
      Role,
      Category,
      Brand,
    ]),
  ],
  providers: [
    // Seeding services
    SimpleSeedingService,
  ],
  exports: [
    // Export services for use in tests and CLI
    SimpleSeedingService,
  ],
})
export class TestingModule {}

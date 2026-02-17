/**
 * @file brands.module.ts
 * @description Brands Module - Public API for brand listings and metadata
 *
 * FEATURES:
 * - TypeORM entity registration for Brand
 * - Public brands service for read-only access
 * - Public brands controller for customer-facing API
 * - Export service for use by other modules (ProductsModule, etc.)
 *
 * SERVICES INCLUDED:
 * - PublicBrandsService (Public brand listings)
 *
 * CONTROLLERS INCLUDED:
 * - PublicBrandsController (Public API endpoints)
 *
 * @author SouqSyria Development Team
 * @since 2025-02-16
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ================================
// ENTITIES
// ================================
import { Brand } from './entities/brand.entity';

// ================================
// CONTROLLERS
// ================================
import { PublicBrandsController } from './controllers/public-brands.controller';

// ================================
// SERVICES
// ================================
import { PublicBrandsService } from './services/public-brands.service';

/**
 * BRANDS MODULE
 *
 * Provides public API for brand browsing and filtering.
 * Exports service for use by other modules (e.g., ProductsModule).
 */
@Module({
  imports: [
    // ================================
    // DATABASE ENTITIES REGISTRATION
    // ================================
    TypeOrmModule.forFeature([
      Brand, // Main brand entity
    ]),
  ],

  // ================================
  // API CONTROLLERS
  // ================================
  controllers: [
    PublicBrandsController, // Public customer-facing API
  ],

  // ================================
  // SERVICE PROVIDERS
  // ================================
  providers: [
    PublicBrandsService, // Public brand listings service
  ],

  // ================================
  // MODULE EXPORTS
  // ================================
  exports: [
    TypeOrmModule, // Export TypeORM for other modules that need Brand entity
    PublicBrandsService, // Export service for use by ProductsModule, etc.
  ],
})
export class BrandsModule {}

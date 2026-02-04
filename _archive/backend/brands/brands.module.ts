/**
 * @file brands.module.ts
 * @description Enhanced Brands module with comprehensive seeding functionality
 *
 * ✅ FEATURES:
 * - Core brand management functionality
 * - Enterprise brand seeding system with Syrian market focus
 * - Advanced seeding options and validation
 * - Performance monitoring and analytics
 * - Comprehensive API endpoints for seeding operations
 * - Transaction safety with rollback capabilities
 * - Arabic localization support
 *
 * ✅ DEPENDENCIES:
 * - Added Route entity import for PermissionsGuard
 * - Added proper TypeORM feature registration
 * - Added GuardsModule import for context
 * - Added seeding services and controllers
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { Brand } from './entities/brand.entity';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity'; // ✅ Added for PermissionsGuard
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GuardsModule } from '../common/guards/guards.module'; // ✅ Added for context

// ✅ SEEDING IMPORTS: Brand seeding functionality
import { BrandSeederService } from './seeds/brand-seeder.service';
import { BrandSeederController } from './seeds/brand-seeder.controller';

@Module({
  imports: [
    // ✅ Register ALL entities that services need
    TypeOrmModule.forFeature([Brand, User, Route]),

    // ✅ Import AuditLogModule for audit trail functionality
    AuditLogModule,

    // ✅ Import GuardsModule to ensure proper context
    GuardsModule,
  ],
  controllers: [
    BrandsController,
    BrandSeederController, // ✅ Added seeding controller
  ],
  providers: [
    BrandsService,
    BrandSeederService, // ✅ Added seeding service
  ],
  exports: [
    BrandsService,
    BrandSeederService, // ✅ Export seeding service for other modules
    TypeOrmModule,
  ],
})
export class BrandsModule {}

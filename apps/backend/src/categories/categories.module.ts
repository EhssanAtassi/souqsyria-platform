/**
 * @file categories.module.ts
 * @description Categories Module with all services, controllers, and dependencies
 *
 * FEATURES:
 * - Complete service dependency injection
 * - TypeORM entity registration
 * - ACL integration with guards
 * - Audit logging integration
 * - Modular service architecture
 *
 * SERVICES INCLUDED:
 * - CategoriesService (Core CRUD)
 * - CategoryHierarchyService (Tree management)
 * - CategoryApprovalService (Workflow)
 * - CategorySearchService (Search & filtering)
 * - CategoryAnalyticsService (Metrics & analytics)
 *
 * @author SouqSyria Development Team
 * @since 2025-06-01
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ================================
// ENTITIES
// ================================
import { Category } from './entities/category.entity';
import { User } from '../users/entities/user.entity';
import { Route } from '../access-control/entities/route.entity';

// ================================
// CONTROLLERS
// ================================
import { CategoriesController } from './controllers/categories.controller';
import { CategoriesAdminBasicController } from './controllers/categories-admin-basic.controller';
import { CategoriesAdminApprovalController } from './controllers/categories-admin-approval.controller';
import { CategoriesAdminSearchController } from './controllers/categories-admin-search.controller';

// ================================
// CORE SERVICES
// ================================
import { CategoriesService } from './services/categories.service';
import { CategoryHierarchyService } from './services/category-hierarchy.service';
import { CategoryApprovalService } from './services/category-approval.service';
import { CategorySearchService } from './services/category-search.service';
import { CategoryAnalyticsService } from './services/category-analytics.service';
// ================================
// EXTERNAL MODULES
// ================================
import { AuditLogModule } from '../audit-log/audit-log.module';
import { GuardsModule } from '../common/guards/guards.module';
import { UsersModule } from '../users/users.module';
import { PublicModule } from '../products/public/public.module';
import { CategoriesPublicController } from './controllers/categories-public.controller';

// ================================
// SEEDING IMPORTS
// ================================
import { CategorySeederService } from './seeds/category-seeder.service';
import { CategorySeederController } from './seeds/category-seeder.controller';

@Module({
  imports: [
    // ================================
    // DATABASE ENTITIES REGISTRATION
    // ================================
    TypeOrmModule.forFeature([
      Category, // Main category entity
      User, // For audit trails and permissions
      Route, // For ACL permissions guard
    ]),

    // ================================
    // EXTERNAL MODULE DEPENDENCIES
    // ================================
    AuditLogModule, // For audit trail logging
    GuardsModule, // For ACL permissions guard (Global module)
    UsersModule, // For RolesGuard dependency resolution
    PublicModule, // For featured products in homepage sections
  ],

  // ================================
  // API CONTROLLERS
  // ================================
  controllers: [
    // Basic categories controller (legacy - consider deprecating)
    CategoriesController,

    // Focused admin controllers (refactored from monolithic controller)
    CategoriesAdminBasicController, // Core CRUD operations
    CategoriesAdminApprovalController, // Approval workflow
    CategoriesAdminSearchController, // Search & analytics

    // Public customer-facing API
    CategoriesPublicController,

    // ✅ SEEDING CONTROLLER: Enterprise category seeding functionality
    CategorySeederController,
  ],

  // ================================
  // SERVICE PROVIDERS
  // ================================
  providers: [
    // Core CRUD service
    CategoriesService,

    // Specialized services (modular architecture)
    CategoryHierarchyService, // Parent/child tree management
    CategoryApprovalService, // Workflow and approval logic
    CategorySearchService, // Search, filtering, pagination
    CategoryAnalyticsService, // Metrics and performance analytics

    // ✅ SEEDING SERVICE: Enterprise category seeding functionality
    CategorySeederService,

    // TODO: Add CategoryCacheService for performance
    // TODO: Add CategoryImageService for media management
    // TODO: Add CategoryTemplateService for dynamic forms
  ],

  // ================================
  // MODULE EXPORTS
  // ================================
  exports: [
    // Export TypeORM for other modules that need Category entity
    TypeOrmModule,

    // Export core service for other modules to use
    CategoriesService,

    // Export specialized services for inter-module usage
    CategoryHierarchyService,
    CategorySearchService,
    CategoryAnalyticsService,

    // ✅ Export seeding service for other modules
    CategorySeederService,

    // CategoryApprovalService kept internal (admin workflow only)
  ],
})
export class CategoriesModule {
  constructor() {
    console.log('🚀 Categories Module initialized with enterprise features');
  }
}

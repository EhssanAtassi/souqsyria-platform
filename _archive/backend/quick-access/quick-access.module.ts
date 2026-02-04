/**
 * @file quick-access.module.ts
 * @description Quick Access Module for SouqSyria E-commerce Platform
 *
 * Provides promotional cards management for the header quick access row.
 * Supports both public display and admin management of promotional content.
 *
 * ARCHITECTURE:
 * - QuickAccessController: HTTP endpoints for public and admin operations
 * - QuickAccessService: Business logic with caching support
 * - QuickAccess entity: TypeORM entity for database persistence
 *
 * FEATURES:
 * - Bilingual promotional cards (Arabic + English)
 * - Badge gradient styling
 * - Display order management with drag-drop support
 * - Soft delete and restore functionality
 * - 5-minute caching for public endpoint
 *
 * SECURITY:
 * - Public endpoint for retrieving active cards
 * - Admin-only endpoints for management operations
 * - JWT authentication with role-based access
 *
 * @swagger
 * tags:
 *   name: Quick Access
 *   description: Promotional cards management API
 *
 * @author SouqSyria Development Team
 * @since 2026-02-01
 * @version 1.0.0
 */

import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Local components
import { QuickAccessController } from './controllers/quick-access.controller';
import { QuickAccessService } from './services/quick-access.service';
import { QuickAccess } from './entities/quick-access.entity';

// Import UsersModule for RolesGuard dependency
import { UsersModule } from '../users/users.module';

/**
 * QuickAccessModule
 *
 * @description NestJS module for managing promotional cards.
 * Provides complete CRUD operations with caching and soft delete support.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuickAccess, // Promotional cards entity
    ]),
    UsersModule, // Import for RolesGuard dependency resolution
  ],
  controllers: [QuickAccessController],
  providers: [QuickAccessService],
  exports: [QuickAccessService], // Export service for potential use by other modules
})
export class QuickAccessModule {
  private readonly logger = new Logger(QuickAccessModule.name);

  constructor() {
    this.logger.log('🎯 QuickAccessModule initialized — promotional cards management ready');
  }
}
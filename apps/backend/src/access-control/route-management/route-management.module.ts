/**
 * @file route-management.module.ts
 * @description Module for route-permission mapping management system.
 *
 * This module provides comprehensive route-permission management capabilities
 * including route discovery, auto-mapping, manual mapping, and statistics.
 *
 * Features:
 * - NestJS metadata scanning for route discovery
 * - Auto-generation based on naming conventions
 * - Manual mapping CRUD operations
 * - Bulk operations for efficiency
 * - Full audit logging integration
 * - Statistics and reporting
 *
 * Dependencies:
 * - TypeORM: Database operations
 * - DiscoveryModule: NestJS metadata scanning
 * - SecurityAuditModule: Audit logging
 * - Reflector: Decorator metadata reading
 *
 * Exports:
 * - RouteManagementService: For use in other modules
 * - RouteDiscoveryService: For custom integrations
 *
 * @author SouqSyria Security Team
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '@nestjs/core';
import { RouteManagementController } from './route-management.controller';
import { RouteManagementService } from './services/route-management.service';
import { RouteDiscoveryService } from './services/route-discovery.service';
import { Route } from '../entities/route.entity';
import { Permission } from '../entities/permission.entity';
import { SecurityAuditModule } from '../security-audit/security-audit.module';

/**
 * RouteManagementModule
 *
 * Comprehensive module for managing API route-to-permission mappings.
 *
 * Architecture:
 * - Controller Layer: REST API endpoints (8 endpoints)
 * - Service Layer: Business logic (RouteManagementService)
 * - Discovery Layer: Metadata scanning (RouteDiscoveryService)
 * - Data Layer: TypeORM repositories (Route, Permission)
 * - Audit Layer: SecurityAuditService integration
 *
 * Module Responsibilities:
 * 1. Route Discovery: Scan NestJS controllers for route metadata
 * 2. Auto-Mapping: Generate mappings based on conventions
 * 3. Manual Mapping: CRUD operations for route mappings
 * 4. Bulk Operations: Efficient batch processing
 * 5. Statistics: Coverage and distribution metrics
 * 6. Audit Logging: All operations tracked for compliance
 *
 * Integration Points:
 * - PermissionsGuard: Consumes route mappings for authorization
 * - AccessControlModule: Parent module containing permissions/roles
 * - SecurityAuditModule: Logs all mapping operations
 *
 * Usage in AppModule:
 * ```typescript
 * @Module({
 *   imports: [
 *     AccessControlModule, // Includes RouteManagementModule
 *     // ... other modules
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * Standalone Usage (if needed):
 * ```typescript
 * @Module({
 *   imports: [
 *     TypeOrmModule.forFeature([Route, Permission]),
 *     RouteManagementModule,
 *   ],
 * })
 * export class CustomModule {}
 * ```
 */
@Module({
  imports: [
    /**
     * TypeORM repositories for database operations
     *
     * Route: Stores route-permission mappings
     * Permission: References to existing permissions
     */
    TypeOrmModule.forFeature([Route, Permission]),

    /**
     * DiscoveryModule from @nestjs/core
     *
     * Provides access to:
     * - DiscoveryService: Access to registered providers/controllers
     * - MetadataScanner: Method metadata extraction
     * - Reflector: Decorator metadata reading
     *
     * Required for route discovery functionality
     */
    DiscoveryModule,

    /**
     * SecurityAuditModule for audit logging
     *
     * All route mapping operations are logged for:
     * - Compliance requirements
     * - Security monitoring
     * - Audit trails
     * - Incident investigation
     */
    SecurityAuditModule,
  ],

  /**
   * Controllers exposed by this module
   *
   * RouteManagementController:
   * - Exposes 8 REST endpoints for route management
   * - All endpoints require 'manage_routes' permission
   * - Fully documented with Swagger decorators
   */
  controllers: [RouteManagementController],

  /**
   * Services provided by this module
   *
   * RouteManagementService:
   * - Core business logic for route-permission management
   * - Coordinates discovery, mapping, and statistics
   * - Handles validation and error handling
   *
   * RouteDiscoveryService:
   * - NestJS metadata scanning
   * - Route metadata extraction
   * - Naming convention analysis
   */
  providers: [RouteManagementService, RouteDiscoveryService],

  /**
   * Exported services for use in other modules
   *
   * RouteManagementService:
   * - Can be injected in other services for programmatic access
   * - Useful for automated scripts or admin tools
   *
   * RouteDiscoveryService:
   * - Can be used independently for route analysis
   * - Useful for custom reporting or monitoring
   */
  exports: [RouteManagementService, RouteDiscoveryService],
})
export class RouteManagementModule {}

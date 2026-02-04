/**
 * @file user-management.module.ts
 * @description NestJS module for comprehensive user management in admin panel.
 *
 * This module provides:
 * - Complete user CRUD operations
 * - Role assignment and management
 * - Account status management (ban, suspend)
 * - Activity tracking and audit logging
 * - Administrative password resets
 *
 * Dependencies:
 * - TypeORM for database access
 * - SecurityAuditService for audit logging
 * - PermissionsGuard for access control (applied globally)
 *
 * Exports:
 * - UserManagementService (for use in other modules if needed)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { SecurityAuditLog } from '../../access-control/entities/security-audit-log.entity';
import { SecurityAuditService } from '../../access-control/security-audit/security-audit.service';

/**
 * UserManagementModule
 *
 * Encapsulates all user management functionality for the admin panel.
 *
 * Features:
 * - 11 RESTful API endpoints for user management
 * - Comprehensive audit logging
 * - Permission-based access control
 * - Self-protection rules (cannot ban yourself, etc.)
 *
 * Integration:
 * Import this module in AdminModule or AppModule to enable user management.
 *
 * Example:
 * ```typescript
 * @Module({
 *   imports: [UserManagementModule],
 * })
 * export class AdminModule {}
 * ```
 */
@Module({
  imports: [
    /**
     * Register TypeORM entities for dependency injection.
     *
     * Entities:
     * - User: Primary entity for user accounts
     * - Role: Business and administrative roles
     * - SecurityAuditLog: Audit trail for all modifications
     */
    TypeOrmModule.forFeature([User, Role, SecurityAuditLog]),
  ],

  /**
   * Controllers that handle HTTP requests.
   *
   * UserManagementController provides 11 endpoints:
   * 1. GET /api/admin/users - List users with pagination
   * 2. GET /api/admin/users/:id - Get user details
   * 3. PUT /api/admin/users/:id - Update user profile
   * 4. PUT /api/admin/users/:id/roles - Assign roles
   * 5. POST /api/admin/users/:id/ban - Ban user
   * 6. POST /api/admin/users/:id/unban - Unban user
   * 7. POST /api/admin/users/:id/suspend - Suspend user
   * 8. POST /api/admin/users/:id/unsuspend - Unsuspend user
   * 9. GET /api/admin/users/:id/activity - Get activity logs
   * 10. GET /api/admin/users/:id/permissions - Get effective permissions
   * 11. POST /api/admin/users/:id/reset-password - Reset password
   */
  controllers: [UserManagementController],

  /**
   * Providers (services) for business logic.
   *
   * UserManagementService: Core business logic for all operations
   * SecurityAuditService: Audit logging service (already provided in AccessControlModule)
   */
  providers: [UserManagementService, SecurityAuditService],

  /**
   * Export UserManagementService for use in other modules.
   *
   * This allows other modules to programmatically manage users if needed.
   *
   * Example usage in another module:
   * ```typescript
   * constructor(private readonly userManagementService: UserManagementService) {}
   *
   * async someMethod() {
   *   const users = await this.userManagementService.findAllPaginated({ page: 1, limit: 10 });
   * }
   * ```
   */
  exports: [UserManagementService],
})
export class UserManagementModule {}

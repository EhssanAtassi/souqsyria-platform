/**
 * @file guards.module.ts
 * @description Global guards module that provides PermissionsGuard to all modules.
 *
 * This module is marked as @Global() to make PermissionsGuard available
 * throughout the application without explicit imports.
 *
 * Dependencies:
 * - PermissionsGuard: Route-based permission checking with caching
 * - SecurityAuditService: Audit logging for all permission events
 * - TypeORM entities: User, Route, SecurityAuditLog
 *
 * @version 2.0.0
 */
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsGuard } from '../../access-control/guards/permissions.guard';
import { SecurityAuditService } from '../../access-control/security-audit/security-audit.service';
import { User } from '../../users/entities/user.entity';
import { Route } from '../../access-control/entities/route.entity';
import { SecurityAuditLog } from '../../access-control/entities/security-audit-log.entity';

/**
 * GuardsModule - Global module for authorization guards
 *
 * Provides:
 * - PermissionsGuard v2.0 with caching, audit logging, and rate limiting
 * - SecurityAuditService for comprehensive security event logging
 *
 * Features:
 * - In-memory route caching (5-minute TTL)
 * - Async audit logging (non-blocking)
 * - Failed attempt tracking
 * - @Public() decorator support
 * - Performance optimization
 *
 * Usage:
 * The @Global() decorator makes this module available everywhere.
 * No need to import GuardsModule in feature modules.
 *
 * @example
 * ```typescript
 * // In any controller
 * @Controller('admin/users')
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * export class AdminUsersController {
 *   @Get()
 *   async listUsers() {
 *     // Requires permission based on route table
 *   }
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Route, SecurityAuditLog]),
  ],
  providers: [
    SecurityAuditService,
    PermissionsGuard,
  ],
  exports: [
    PermissionsGuard,
    SecurityAuditService,
  ],
})
export class GuardsModule {}

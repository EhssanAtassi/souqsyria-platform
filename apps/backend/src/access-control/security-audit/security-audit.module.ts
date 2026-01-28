/**
 * @file security-audit.module.ts
 * @description Module for security audit logging and monitoring functionality.
 * Provides enterprise-grade audit trail capabilities for RBAC system.
 *
 * Module Purpose:
 * - Centralize security event logging
 * - Provide audit query and analysis capabilities
 * - Support compliance and incident response
 * - Enable suspicious activity detection
 *
 * Dependencies:
 * - TypeORM: Database access for SecurityAuditLog entity
 * - UsersModule: User entity for relations and queries
 *
 * Exports:
 * - SecurityAuditService: For use in guards, controllers, and other services
 * - TypeOrmModule: For direct repository access if needed
 *
 * @author SouqSyria Security Team
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityAuditLog } from '../entities/security-audit-log.entity';
import { SecurityAuditService } from './security-audit.service';
import { SecurityAuditController } from './security-audit.controller';

/**
 * SecurityAuditModule
 *
 * Standalone module that can be imported wherever security audit logging is needed.
 * Designed to be lightweight and independent for easy integration.
 *
 * Usage:
 * ```typescript
 * // In any module that needs security audit logging
 * @Module({
 *   imports: [SecurityAuditModule],
 *   // ...
 * })
 * export class MyModule {}
 * ```
 *
 * Integration Points:
 * - AccessControlModule: For permission check logging
 * - AuthModule: For login attempt logging
 * - Admin modules: For manual security event logging
 * - Guards: For automatic authorization logging
 */
@Module({
  imports: [
    // Register SecurityAuditLog entity with TypeORM
    TypeOrmModule.forFeature([SecurityAuditLog]),
  ],
  controllers: [
    // Admin API for querying and analyzing security logs
    SecurityAuditController,
  ],
  providers: [
    // Core service for logging and analysis
    SecurityAuditService,
  ],
  exports: [
    // Export service for use in other modules
    SecurityAuditService,
    // Export repository for advanced queries
    TypeOrmModule,
  ],
})
export class SecurityAuditModule {}

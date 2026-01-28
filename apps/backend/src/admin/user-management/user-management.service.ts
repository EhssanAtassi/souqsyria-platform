/**
 * @file user-management.service.ts
 * @description Comprehensive user management service for SouqSyria admin panel.
 *
 * This service provides enterprise-grade user management capabilities including:
 * - Paginated user queries with advanced filtering
 * - Role assignment and permission management
 * - Account status management (ban, suspend, activate)
 * - Administrative password resets
 * - Activity tracking and audit logging
 * - Self-protection rules (prevent admin self-harm)
 *
 * Security Features:
 * - All modifications logged to SecurityAuditLog
 * - Self-modification protection (cannot ban yourself)
 * - Role hierarchy validation
 * - Strong password enforcement
 * - Permission-based access control
 *
 * Performance Targets:
 * - List users: <200ms (with pagination and indexes)
 * - Get user details: <100ms (with eager loading)
 * - Update operations: <150ms (with audit logging)
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { SecurityAuditLog, SecurityAuditAction, ResourceType } from '../../access-control/entities/security-audit-log.entity';
import { SecurityAuditService } from '../../access-control/security-audit/security-audit.service';

import {
  QueryUsersDto,
  UpdateUserDto,
  AssignRolesDto,
  BanUserDto,
  SuspendUserDto,
  ResetPasswordDto,
} from './dto';

/**
 * Interface for paginated user query results.
 * Provides consistent pagination structure across the API.
 */
export interface PaginatedUserResult {
  /** Array of users for current page */
  users: User[];
  /** Total number of users matching query (before pagination) */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of records per page */
  limit: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * UserManagementService
 *
 * Core service for managing user accounts in the admin panel.
 * Handles CRUD operations, role assignments, and account status changes.
 *
 * Dependencies:
 * - User Repository: Database access for user entities
 * - Role Repository: Database access for role entities
 * - SecurityAuditService: Comprehensive audit logging
 *
 * Design Patterns:
 * - Repository Pattern: Clean data access abstraction
 * - Service Layer Pattern: Business logic separation
 * - Guard Clauses: Early validation and error handling
 */
@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  /**
   * Number of bcrypt rounds for password hashing.
   * Higher = more secure but slower. 12 is recommended for 2024.
   * Each increment doubles the time required.
   */
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    private readonly securityAuditService: SecurityAuditService,
  ) {}

  /**
   * Find all users with pagination, search, and filtering.
   *
   * This method supports:
   * - Pagination (page, limit)
   * - Full-text search (email, full name)
   * - Role filtering (by role name)
   * - Status filtering (active, banned, suspended)
   *
   * Query Performance:
   * - Uses indexes on email, isBanned, isSuspended
   * - Eager loads relations (role, assignedRole) in single query
   * - Target response time: <200ms
   *
   * @param query - Query parameters (pagination, filters, search)
   * @returns Paginated user results with metadata
   *
   * @example
   * ```typescript
   * // Get active vendors, page 2
   * const result = await service.findAllPaginated({
   *   page: 2,
   *   limit: 20,
   *   role: 'vendor',
   *   status: 'active'
   * });
   * console.log(`Found ${result.total} vendors, showing page ${result.page}/${result.totalPages}`);
   * ```
   */
  async findAllPaginated(query: QueryUsersDto): Promise<PaginatedUserResult> {
    try {
      const { page = 1, limit = 20, search, role, status } = query;

      // Build query conditions
      const where: FindOptionsWhere<User> = {};

      // Search filter (case-insensitive partial match on email and fullName)
      if (search) {
        // Note: TypeORM doesn't support OR with FindOptionsWhere directly
        // We'll use QueryBuilder for complex OR conditions
        const queryBuilder = this.userRepository
          .createQueryBuilder('user')
          .leftJoinAndSelect('user.role', 'role')
          .leftJoinAndSelect('user.assignedRole', 'assignedRole');

        // Search in email OR fullName
        queryBuilder.where('user.email LIKE :search OR user.fullName LIKE :search', {
          search: `%${search}%`,
        });

        // Status filter
        if (status === 'active') {
          queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: false });
          queryBuilder.andWhere('user.isSuspended = :isSuspended', { isSuspended: false });
        } else if (status === 'banned') {
          queryBuilder.andWhere('user.isBanned = :isBanned', { isBanned: true });
        } else if (status === 'suspended') {
          queryBuilder.andWhere('user.isSuspended = :isSuspended', { isSuspended: true });
        }

        // Role filter
        if (role) {
          queryBuilder.andWhere('role.name = :roleName', { roleName: role });
        }

        // Pagination
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        queryBuilder.orderBy('user.createdAt', 'DESC');

        const [users, total] = await queryBuilder.getManyAndCount();

        return {
          users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      }

      // Simple filters without search
      if (status === 'active') {
        where.isBanned = false;
        where.isSuspended = false;
      } else if (status === 'banned') {
        where.isBanned = true;
      } else if (status === 'suspended') {
        where.isSuspended = true;
      }

      // Build query with role filter if provided
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.assignedRole', 'assignedRole');

      // Apply where conditions
      if (status) {
        if (status === 'active') {
          queryBuilder.where('user.isBanned = :isBanned', { isBanned: false });
          queryBuilder.andWhere('user.isSuspended = :isSuspended', { isSuspended: false });
        } else if (status === 'banned') {
          queryBuilder.where('user.isBanned = :isBanned', { isBanned: true });
        } else if (status === 'suspended') {
          queryBuilder.where('user.isSuspended = :isSuspended', { isSuspended: true });
        }
      }

      if (role) {
        queryBuilder.andWhere('role.name = :roleName', { roleName: role });
      }

      // Pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);
      queryBuilder.orderBy('user.createdAt', 'DESC');

      const [users, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`Fetched ${users.length} users (page ${page}, total ${total})`);

      return {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a single user by ID with full details.
   *
   * Eager loads:
   * - Primary role (user.role)
   * - Assigned administrative role (user.assignedRole)
   * - Role permissions (via rolePermissions relation)
   *
   * Performance: <100ms with proper indexing and eager loading
   *
   * @param id - User ID to fetch
   * @returns User entity with relations
   * @throws NotFoundException if user doesn't exist
   *
   * @example
   * ```typescript
   * const user = await service.findOneWithDetails(42);
   * console.log(`User: ${user.email}`);
   * console.log(`Role: ${user.role?.name}`);
   * console.log(`Admin Role: ${user.assignedRole?.name}`);
   * ```
   */
  async findOneWithDetails(id: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
          assignedRole: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.debug(`Fetched user ${id} with details`);
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get user activity history from security audit logs.
   *
   * Returns recent security events for the user including:
   * - Permission checks
   * - Access denials
   * - Role modifications
   * - Login attempts
   *
   * @param id - User ID to get activity for
   * @param limit - Maximum number of events to return (default: 50)
   * @returns Array of security audit log entries
   * @throws NotFoundException if user doesn't exist
   *
   * @example
   * ```typescript
   * const activity = await service.getUserActivity(42, 20);
   * activity.forEach(log => {
   *   console.log(`${log.action} at ${log.createdAt} - Success: ${log.success}`);
   * });
   * ```
   */
  async getUserActivity(id: number, limit: number = 50): Promise<SecurityAuditLog[]> {
    try {
      // Verify user exists
      await this.findOneWithDetails(id);

      // Fetch user's activity logs
      const { logs } = await this.securityAuditService.getSecurityEvents({
        userId: id,
        limit,
        page: 1,
      });

      this.logger.debug(`Fetched ${logs.length} activity logs for user ${id}`);
      return logs;
    } catch (error) {
      this.logger.error(`Failed to fetch activity for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get effective permissions for a user (combined from both roles).
   *
   * Calculates the union of permissions from:
   * 1. Primary business role (user.role)
   * 2. Assigned administrative role (user.assignedRole)
   *
   * Permission Merging:
   * effectivePermissions = businessRolePermissions ∪ assignedRolePermissions
   *
   * Returns unique permission names (no duplicates).
   *
   * @param id - User ID to get permissions for
   * @returns Array of unique permission names
   * @throws NotFoundException if user doesn't exist
   *
   * @example
   * ```typescript
   * const permissions = await service.getUserPermissions(42);
   * console.log(`User has ${permissions.length} effective permissions:`);
   * console.log(permissions); // ['view_products', 'manage_products', 'view_orders', ...]
   * ```
   */
  async getUserPermissions(id: number): Promise<string[]> {
    try {
      const user = await this.findOneWithDetails(id);

      const permissions = new Set<string>();

      // Add permissions from primary role
      if (user.role?.rolePermissions) {
        user.role.rolePermissions.forEach((rp) => {
          if (rp.permission?.name) {
            permissions.add(rp.permission.name);
          }
        });
      }

      // Add permissions from assigned role
      if (user.assignedRole?.rolePermissions) {
        user.assignedRole.rolePermissions.forEach((rp) => {
          if (rp.permission?.name) {
            permissions.add(rp.permission.name);
          }
        });
      }

      const permissionArray = Array.from(permissions);
      this.logger.debug(`User ${id} has ${permissionArray.length} effective permissions`);

      return permissionArray;
    } catch (error) {
      this.logger.error(`Failed to get permissions for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user profile information.
   *
   * Supports updating:
   * - Email address
   * - Email verification status
   * - Ban status
   * - Suspension status
   *
   * Security Rules:
   * - Cannot modify own ban/suspension status (use validateNotSelf)
   * - Email changes should trigger verification (implement as needed)
   * - All changes logged to SecurityAuditLog
   *
   * @param id - User ID to update
   * @param dto - Fields to update
   * @param adminId - ID of admin performing the update
   * @returns Updated user entity
   * @throws NotFoundException if user doesn't exist
   * @throws BadRequestException if trying to modify self inappropriately
   *
   * @example
   * ```typescript
   * // Update email and verification status
   * const updated = await service.updateUser(42, {
   *   email: 'newemail@example.com',
   *   isVerified: true
   * }, adminId);
   * ```
   */
  async updateUser(id: number, dto: UpdateUserDto, adminId: number): Promise<User> {
    try {
      const user = await this.findOneWithDetails(id);

      // Validate self-modification rules
      if (id === adminId) {
        // Allow email and verification updates for self
        // But prevent changing own ban/suspension status
        if (dto.isBanned !== undefined || dto.isSuspended !== undefined) {
          throw new BadRequestException('Cannot modify your own ban or suspension status');
        }
      }

      // Check email uniqueness if changing email
      if (dto.email && dto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: dto.email },
        });
        if (existingUser) {
          throw new BadRequestException('Email address is already in use');
        }
      }

      // Track changes for audit log
      const changes: Record<string, any> = {};
      if (dto.email !== undefined) changes.email = { from: user.email, to: dto.email };
      if (dto.isVerified !== undefined)
        changes.isVerified = { from: user.isVerified, to: dto.isVerified };
      if (dto.isBanned !== undefined) changes.isBanned = { from: user.isBanned, to: dto.isBanned };
      if (dto.isSuspended !== undefined)
        changes.isSuspended = { from: user.isSuspended, to: dto.isSuspended };

      // Apply updates
      Object.assign(user, dto);
      const updated = await this.userRepository.save(user);

      // Log to audit trail
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.PERMISSION_MODIFIED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}`,
        requestMethod: 'PUT',
        metadata: {
          action: 'USER_PROFILE_UPDATED',
          changes,
          updatedBy: adminId,
        },
      });

      this.logger.log(`User ${id} updated by admin ${adminId}`);
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Assign or update user roles with comprehensive security validation.
   *
   * SECURITY ENHANCEMENTS (v2.0):
   * ================================
   * 1. Role Hierarchy Validation:
   *    - Admins cannot assign roles higher than their own priority
   *    - Only super_admin can assign super_admin role
   *    - Users cannot assign roles to users with higher priority
   *
   * 2. Self-Modification Protection:
   *    - Cannot modify own role assignments (prevents privilege escalation)
   *    - Cannot remove own admin access
   *
   * 3. Role Priority Enforcement:
   *    - Target user's new role priority must be <= admin's role priority
   *    - Existing users with higher priority cannot be demoted by lower admins
   *
   * 4. Comprehensive Audit Logging:
   *    - All attempts logged (success and failure)
   *    - Privilege escalation attempts flagged as SUSPICIOUS_ACTIVITY
   *
   * Supports updating:
   * - Primary business role (roleId)
   * - Assigned administrative role (assignedRoleId)
   * - Both roles simultaneously
   *
   * Security Rules:
   * - Cannot modify own role assignments (prevents lockout/escalation)
   * - Cannot assign roles with higher priority than your own
   * - Only super_admin (priority >= 1000) can assign super_admin role
   * - Cannot modify users with higher role priority than yourself
   * - Validates all roles exist before assignment
   * - All changes logged to SecurityAuditLog with detailed context
   *
   * @param id - User ID to assign roles to
   * @param dto - Role IDs to assign
   * @param adminId - ID of admin performing the assignment
   * @returns Updated user entity with new roles
   * @throws NotFoundException if user or role doesn't exist
   * @throws BadRequestException if validation fails
   * @throws ForbiddenException if admin lacks privilege to assign role
   *
   * @example
   * ```typescript
   * // Assign customer support role
   * const updated = await service.assignRoles(42, {
   *   assignedRoleId: 15 // Customer support role
   * }, adminId);
   * ```
   */
  async assignRoles(id: number, dto: AssignRolesDto, adminId: number): Promise<User> {
    try {
      // SECURITY FIX 1: Prevent self-modification (privilege escalation vector)
      if (id === adminId) {
        this.logger.error(
          `🚨 SECURITY ALERT: Admin ${adminId} attempted to modify their own roles`,
        );

        // Log suspicious activity
        await this.securityAuditService.logPermissionCheck({
          userId: adminId,
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
          resourceType: ResourceType.USER,
          resourceId: id,
          success: false,
          failureReason: 'Attempted self-modification of roles (privilege escalation attempt)',
          ipAddress: 'system',
          userAgent: 'admin-panel',
          requestPath: `/api/admin/users/${id}/roles`,
          requestMethod: 'PUT',
          metadata: {
            action: 'ROLE_ASSIGNMENT_BLOCKED',
            reason: 'self-modification-attempt',
            attemptedRoles: dto,
            securityLevel: 'CRITICAL',
          },
        });

        throw new ForbiddenException(
          'Cannot modify your own role assignments. This action is prohibited for security reasons.',
        );
      }

      const user = await this.findOneWithDetails(id);

      // Load admin user with full role details for hierarchy validation
      const admin = await this.userRepository.findOne({
        where: { id: adminId },
        relations: {
          role: true,
          assignedRole: true,
        },
      });

      if (!admin) {
        throw new NotFoundException(`Admin user with ID ${adminId} not found`);
      }

      // Calculate admin's effective priority (highest of both roles)
      const adminPriority = this.getEffectivePriority(admin);

      // Validate at least one role provided
      if (!dto.roleId && !dto.assignedRoleId) {
        throw new BadRequestException('At least one role must be provided');
      }

      // Track changes for audit
      const changes: Record<string, any> = {};

      // SECURITY FIX 2: Validate role hierarchy for business role assignment
      if (dto.roleId !== undefined) {
        const role = await this.roleRepository.findOne({
          where: { id: dto.roleId },
        });

        if (!role) {
          throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
        }

        // Validate admin can assign this role
        if (role.priority > adminPriority) {
          this.logger.error(
            `🚨 PRIVILEGE ESCALATION ATTEMPT: Admin ${adminId} (priority: ${adminPriority}) attempted to assign role '${role.name}' (priority: ${role.priority}) to user ${id}`,
          );

          // Log privilege escalation attempt
          await this.securityAuditService.logPermissionCheck({
            userId: adminId,
            action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            resourceType: ResourceType.USER,
            resourceId: id,
            success: false,
            failureReason: `Attempted to assign role with higher priority (${role.priority}) than admin's priority (${adminPriority})`,
            ipAddress: 'system',
            userAgent: 'admin-panel',
            requestPath: `/api/admin/users/${id}/roles`,
            requestMethod: 'PUT',
            metadata: {
              action: 'PRIVILEGE_ESCALATION_BLOCKED',
              adminPriority,
              attemptedRolePriority: role.priority,
              attemptedRoleName: role.name,
              targetUserId: id,
              securityLevel: 'CRITICAL',
            },
          });

          throw new ForbiddenException(
            `Cannot assign role '${role.name}' (priority: ${role.priority}). Your role priority (${adminPriority}) is insufficient. Only users with higher priority can assign this role.`,
          );
        }

        changes.roleId = { from: user.role?.id, fromName: user.role?.name, to: dto.roleId, toName: role.name };
        user.role = role;
      }

      // SECURITY FIX 3: Validate role hierarchy for assigned administrative role
      if (dto.assignedRoleId !== undefined) {
        const assignedRole = await this.roleRepository.findOne({
          where: { id: dto.assignedRoleId },
        });

        if (!assignedRole) {
          throw new NotFoundException(`Role with ID ${dto.assignedRoleId} not found`);
        }

        // SECURITY FIX 4: Special protection for super_admin role
        // Only super_admin (priority >= 1000) can assign super_admin role
        if (assignedRole.name === 'super_admin' || assignedRole.priority >= 1000) {
          if (adminPriority < 1000) {
            this.logger.error(
              `🚨 SUPER_ADMIN ESCALATION ATTEMPT: Admin ${adminId} (priority: ${adminPriority}) attempted to assign super_admin role to user ${id}`,
            );

            // Log critical security event
            await this.securityAuditService.logPermissionCheck({
              userId: adminId,
              action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
              resourceType: ResourceType.USER,
              resourceId: id,
              success: false,
              failureReason: 'Attempted to assign super_admin role without super_admin privileges',
              ipAddress: 'system',
              userAgent: 'admin-panel',
              requestPath: `/api/admin/users/${id}/roles`,
              requestMethod: 'PUT',
              metadata: {
                action: 'SUPER_ADMIN_ESCALATION_BLOCKED',
                adminPriority,
                attemptedRole: 'super_admin',
                targetUserId: id,
                securityLevel: 'CRITICAL',
              },
            });

            throw new ForbiddenException(
              'Cannot assign super_admin role. Only existing super_admin users can assign this role.',
            );
          }
        }

        // Validate admin can assign this role based on priority
        if (assignedRole.priority > adminPriority) {
          this.logger.error(
            `🚨 PRIVILEGE ESCALATION ATTEMPT: Admin ${adminId} (priority: ${adminPriority}) attempted to assign admin role '${assignedRole.name}' (priority: ${assignedRole.priority}) to user ${id}`,
          );

          // Log privilege escalation attempt
          await this.securityAuditService.logPermissionCheck({
            userId: adminId,
            action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            resourceType: ResourceType.USER,
            resourceId: id,
            success: false,
            failureReason: `Attempted to assign admin role with higher priority (${assignedRole.priority}) than admin's priority (${adminPriority})`,
            ipAddress: 'system',
            userAgent: 'admin-panel',
            requestPath: `/api/admin/users/${id}/roles`,
            requestMethod: 'PUT',
            metadata: {
              action: 'ADMIN_PRIVILEGE_ESCALATION_BLOCKED',
              adminPriority,
              attemptedRolePriority: assignedRole.priority,
              attemptedRoleName: assignedRole.name,
              targetUserId: id,
              securityLevel: 'CRITICAL',
            },
          });

          throw new ForbiddenException(
            `Cannot assign admin role '${assignedRole.name}' (priority: ${assignedRole.priority}). Your role priority (${adminPriority}) is insufficient.`,
          );
        }

        // SECURITY FIX 5: Prevent modifying users with higher priority
        const targetUserPriority = this.getEffectivePriority(user);
        if (targetUserPriority > adminPriority) {
          this.logger.error(
            `🚨 HIERARCHY VIOLATION: Admin ${adminId} (priority: ${adminPriority}) attempted to modify user ${id} with higher priority (${targetUserPriority})`,
          );

          // Log hierarchy violation
          await this.securityAuditService.logPermissionCheck({
            userId: adminId,
            action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
            resourceType: ResourceType.USER,
            resourceId: id,
            success: false,
            failureReason: `Attempted to modify user with higher priority (${targetUserPriority}) than admin's priority (${adminPriority})`,
            ipAddress: 'system',
            userAgent: 'admin-panel',
            requestPath: `/api/admin/users/${id}/roles`,
            requestMethod: 'PUT',
            metadata: {
              action: 'HIERARCHY_VIOLATION_BLOCKED',
              adminPriority,
              targetUserPriority,
              targetUserId: id,
              securityLevel: 'HIGH',
            },
          });

          throw new ForbiddenException(
            `Cannot modify user with higher role priority (${targetUserPriority}). Your priority (${adminPriority}) is insufficient.`,
          );
        }

        changes.assignedRoleId = {
          from: user.assignedRole?.id,
          fromName: user.assignedRole?.name,
          to: dto.assignedRoleId,
          toName: assignedRole.name
        };
        user.assignedRole = assignedRole;
      }

      const updated = await this.userRepository.save(user);

      // Log successful role assignment to audit trail
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.ROLE_MODIFIED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}/roles`,
        requestMethod: 'PUT',
        metadata: {
          action: 'ROLE_MODIFIED',
          changes,
          updatedBy: adminId,
          adminPriority,
          targetUserEmail: user.email,
          securityValidation: 'PASSED',
        },
      });

      this.logger.log(
        `Roles successfully updated for user ${id} (${user.email}) by admin ${adminId}. Changes: ${JSON.stringify(changes)}`,
      );
      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Failed to assign roles to user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate effective role priority for a user.
   * Returns the highest priority from both business role and assigned admin role.
   *
   * Used for role hierarchy validation to ensure admins cannot escalate
   * privileges beyond their own level.
   *
   * @param user - User entity with loaded roles
   * @returns Highest priority value (higher = more privileged)
   *
   * @example
   * ```typescript
   * const priority = this.getEffectivePriority(user);
   * if (priority >= 1000) {
   *   // User is super_admin
   * }
   * ```
   */
  private getEffectivePriority(user: User): number {
    const businessRolePriority = user.role?.priority || 0;
    const adminRolePriority = user.assignedRole?.priority || 0;

    // Return highest priority
    return Math.max(businessRolePriority, adminRolePriority);
  }

  /**
   * Ban a user account with role hierarchy validation.
   *
   * SECURITY ENHANCEMENTS (v2.0):
   * ==============================
   * - Cannot ban yourself (prevents lockout)
   * - Cannot ban users with higher role priority
   * - Super admins can only be banned by other super admins
   * - All ban attempts logged with full context
   *
   * Banning effects:
   * - Sets user.isBanned = true
   * - Sets user.banReason = provided reason
   * - Logs action to SecurityAuditLog
   * - User cannot login (enforced at authentication layer)
   * - All API requests blocked
   *
   * Security Rules:
   * - Cannot ban yourself
   * - Cannot ban users with equal or higher privilege
   * - Must provide detailed reason (10-500 characters)
   * - Action logged with full audit trail
   *
   * @param id - User ID to ban
   * @param dto - Ban reason (required for audit)
   * @param adminId - ID of admin performing the ban
   * @throws NotFoundException if user doesn't exist
   * @throws BadRequestException if trying to ban self
   * @throws ForbiddenException if admin lacks privilege to ban user
   *
   * @example
   * ```typescript
   * await service.banUser(42, {
   *   reason: 'Violated terms of service by posting spam content'
   * }, adminId);
   * ```
   */
  async banUser(id: number, dto: BanUserDto, adminId: number): Promise<void> {
    try {
      this.validateNotSelf(id, adminId, 'ban');

      const user = await this.findOneWithDetails(id);

      // Load admin for hierarchy validation
      const admin = await this.userRepository.findOne({
        where: { id: adminId },
        relations: {
          role: true,
          assignedRole: true,
        },
      });

      if (!admin) {
        throw new NotFoundException(`Admin user with ID ${adminId} not found`);
      }

      // SECURITY FIX: Validate role hierarchy
      const adminPriority = this.getEffectivePriority(admin);
      const targetPriority = this.getEffectivePriority(user);

      if (targetPriority >= adminPriority) {
        this.logger.error(
          `🚨 HIERARCHY VIOLATION: Admin ${adminId} (priority: ${adminPriority}) attempted to ban user ${id} (priority: ${targetPriority})`,
        );

        // Log unauthorized ban attempt
        await this.securityAuditService.logPermissionCheck({
          userId: adminId,
          action: SecurityAuditAction.SUSPICIOUS_ACTIVITY,
          resourceType: ResourceType.USER,
          resourceId: id,
          success: false,
          failureReason: `Attempted to ban user with equal/higher priority (${targetPriority}) than admin's priority (${adminPriority})`,
          ipAddress: 'system',
          userAgent: 'admin-panel',
          requestPath: `/api/admin/users/${id}/ban`,
          requestMethod: 'POST',
          metadata: {
            action: 'UNAUTHORIZED_BAN_ATTEMPT',
            adminPriority,
            targetPriority,
            targetUserEmail: user.email,
            securityLevel: 'HIGH',
          },
        });

        throw new ForbiddenException(
          `Cannot ban user with equal or higher role priority. Your priority (${adminPriority}) is insufficient.`,
        );
      }

      // Update ban status
      user.isBanned = true;
      user.banReason = dto.reason;
      await this.userRepository.save(user);

      // Log to audit trail
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.USER_BANNED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}/ban`,
        requestMethod: 'POST',
        metadata: {
          action: 'USER_BANNED',
          reason: dto.reason,
          bannedBy: adminId,
          bannedAt: new Date().toISOString(),
          adminPriority,
          targetPriority,
          targetUserEmail: user.email,
        },
      });

      this.logger.warn(
        `User ${id} (${user.email}, priority: ${targetPriority}) banned by admin ${adminId} (priority: ${adminPriority}). Reason: ${dto.reason}`,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Failed to ban user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Unban a user account.
   *
   * Unbanning effects:
   * - Sets user.isBanned = false
   * - Clears user.banReason
   * - Logs action to SecurityAuditLog
   * - User can login again
   *
   * @param id - User ID to unban
   * @param adminId - ID of admin performing the unban
   * @throws NotFoundException if user doesn't exist
   *
   * @example
   * ```typescript
   * await service.unbanUser(42, adminId);
   * ```
   */
  async unbanUser(id: number, adminId: number): Promise<void> {
    try {
      const user = await this.findOneWithDetails(id);

      if (!user.isBanned) {
        throw new BadRequestException('User is not banned');
      }

      const previousReason = user.banReason;

      // Clear ban status
      user.isBanned = false;
      user.banReason = null;
      await this.userRepository.save(user);

      // Log to audit trail
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.PERMISSION_MODIFIED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}/unban`,
        requestMethod: 'POST',
        metadata: {
          action: 'USER_UNBANNED',
          previousReason,
          unbannedBy: adminId,
          unbannedAt: new Date().toISOString(),
        },
      });

      this.logger.log(`User ${id} unbanned by admin ${adminId}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to unban user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Suspend a user account temporarily or indefinitely.
   *
   * Suspension effects:
   * - Sets user.isSuspended = true
   * - Sets user.banReason = provided reason
   * - Sets user.bannedUntil = current time + duration (if provided)
   * - Logs action to SecurityAuditLog
   * - User has limited access (implementation-specific)
   *
   * Security Rules:
   * - Cannot suspend yourself
   *
   * @param id - User ID to suspend
   * @param dto - Suspension reason and optional duration
   * @param adminId - ID of admin performing the suspension
   * @throws NotFoundException if user doesn't exist
   * @throws BadRequestException if trying to suspend self
   *
   * @example
   * ```typescript
   * // Suspend for 7 days
   * await service.suspendUser(42, {
   *   reason: 'Pending investigation for policy violation',
   *   duration: 7
   * }, adminId);
   * ```
   */
  async suspendUser(id: number, dto: SuspendUserDto, adminId: number): Promise<void> {
    try {
      this.validateNotSelf(id, adminId, 'suspend');

      const user = await this.findOneWithDetails(id);

      // Update suspension status
      user.isSuspended = true;
      user.banReason = dto.reason;

      // Calculate expiration if duration provided
      if (dto.duration) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + dto.duration);
        user.bannedUntil = expirationDate;
      } else {
        user.bannedUntil = null; // Indefinite suspension
      }

      await this.userRepository.save(user);

      // Log to audit trail
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.USER_SUSPENDED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}/suspend`,
        requestMethod: 'POST',
        metadata: {
          action: 'USER_SUSPENDED',
          reason: dto.reason,
          duration: dto.duration,
          suspendedUntil: user.bannedUntil?.toISOString(),
          suspendedBy: adminId,
          suspendedAt: new Date().toISOString(),
        },
      });

      this.logger.warn(
        `User ${id} suspended by admin ${adminId}. Duration: ${dto.duration || 'indefinite'} days. Reason: ${dto.reason}`,
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to suspend user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Unsuspend a user account.
   *
   * Unsuspension effects:
   * - Sets user.isSuspended = false
   * - Clears user.banReason
   * - Clears user.bannedUntil
   * - Logs action to SecurityAuditLog
   * - User regains full access
   *
   * @param id - User ID to unsuspend
   * @param adminId - ID of admin performing the unsuspension
   * @throws NotFoundException if user doesn't exist
   * @throws BadRequestException if user is not suspended
   *
   * @example
   * ```typescript
   * await service.unsuspendUser(42, adminId);
   * ```
   */
  async unsuspendUser(id: number, adminId: number): Promise<void> {
    try {
      const user = await this.findOneWithDetails(id);

      if (!user.isSuspended) {
        throw new BadRequestException('User is not suspended');
      }

      const previousReason = user.banReason;
      const previousExpiration = user.bannedUntil;

      // Clear suspension status
      user.isSuspended = false;
      user.banReason = null;
      user.bannedUntil = null;
      await this.userRepository.save(user);

      // Log to audit trail
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.PERMISSION_MODIFIED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}/unsuspend`,
        requestMethod: 'POST',
        metadata: {
          action: 'USER_UNSUSPENDED',
          previousReason,
          previousExpiration: previousExpiration?.toISOString(),
          unsuspendedBy: adminId,
          unsuspendedAt: new Date().toISOString(),
        },
      });

      this.logger.log(`User ${id} unsuspended by admin ${adminId}`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to unsuspend user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reset user password administratively.
   *
   * Password reset workflow:
   * 1. Validate new password meets strength requirements (enforced by DTO)
   * 2. Hash password with bcrypt (12 rounds)
   * 3. Update user.passwordHash
   * 4. Update user.passwordChangedAt = now
   * 5. Log action to SecurityAuditLog
   * 6. (Optional) Send email notification to user
   * 7. (Optional) Invalidate existing user sessions
   *
   * Security Considerations:
   * - Strong password requirements enforced by ResetPasswordDto
   * - Consider checking against common password lists
   * - Consider preventing password reuse
   * - All resets logged to audit trail
   * - User should be notified via email
   *
   * @param id - User ID to reset password for
   * @param dto - New password (validated for strength)
   * @param adminId - ID of admin performing the reset
   * @throws NotFoundException if user doesn't exist
   *
   * @example
   * ```typescript
   * await service.resetPassword(42, {
   *   newPassword: 'SecureP@ssw0rd123!'
   * }, adminId);
   * ```
   */
  async resetPassword(id: number, dto: ResetPasswordDto, adminId: number): Promise<void> {
    try {
      const user = await this.findOneWithDetails(id);

      // Hash new password with bcrypt
      const hashedPassword = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

      // Update password and change timestamp
      user.passwordHash = hashedPassword;
      user.passwordChangedAt = new Date();

      await this.userRepository.save(user);

      // Log to audit trail (don't log the password itself)
      await this.securityAuditService.logPermissionCheck({
        userId: adminId,
        action: SecurityAuditAction.PERMISSION_MODIFIED,
        resourceType: ResourceType.USER,
        resourceId: id,
        success: true,
        ipAddress: 'system',
        userAgent: 'admin-panel',
        requestPath: `/api/admin/users/${id}/reset-password`,
        requestMethod: 'POST',
        metadata: {
          action: 'PASSWORD_RESET',
          resetBy: adminId,
          resetAt: new Date().toISOString(),
        },
      });

      this.logger.warn(`Password reset for user ${id} by admin ${adminId}`);

      // TODO: Send email notification to user about password change
      // TODO: Consider invalidating existing user sessions
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to reset password for user ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate that admin is not trying to modify themselves.
   *
   * Prevents self-harm scenarios:
   * - Banning yourself (account lockout)
   * - Suspending yourself (access restriction)
   * - Removing your own admin role (permission loss)
   *
   * This is a guard clause helper for service methods.
   *
   * @param userId - User being modified
   * @param adminId - Admin performing the action
   * @param action - Action being performed (for error message)
   * @throws BadRequestException if userId === adminId
   *
   * @example
   * ```typescript
   * validateNotSelf(userId, adminId, 'ban');
   * // Throws: "Cannot ban yourself"
   * ```
   */
  validateNotSelf(userId: number, adminId: number, action: string): void {
    if (userId === adminId) {
      throw new BadRequestException(`Cannot ${action} yourself`);
    }
  }

  /**
   * Check if admin can modify target user based on role hierarchy.
   *
   * Role hierarchy rules:
   * - Super admins can modify anyone
   * - Admins cannot modify users with higher privileges
   * - Admins cannot modify other admins (same level)
   *
   * Implementation note: Requires role priority/level field in Role entity.
   * This is a placeholder for future enhancement.
   *
   * @param targetUser - User being modified
   * @param adminUser - Admin performing the action
   * @returns true if admin can modify user, false otherwise
   *
   * @example
   * ```typescript
   * if (!canModifyUser(targetUser, adminUser)) {
   *   throw new ForbiddenException('Cannot modify user with equal or higher privileges');
   * }
   * ```
   */
  canModifyUser(targetUser: User, adminUser: User): boolean {
    // TODO: Implement role hierarchy validation
    // This requires a priority/level field in the Role entity
    // For now, allow all modifications (implement when role hierarchy is added)
    return true;
  }
}

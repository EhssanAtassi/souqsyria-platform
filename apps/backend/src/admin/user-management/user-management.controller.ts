/**
 * @file user-management.controller.ts
 * @description RESTful API controller for comprehensive user management in admin panel.
 *
 * This controller provides 11 endpoints for managing user accounts:
 * 1. GET /users - List users with pagination and filtering
 * 2. GET /users/:id - Get detailed user information
 * 3. PUT /users/:id - Update user profile
 * 4. PUT /users/:id/roles - Assign or update user roles
 * 5. POST /users/:id/ban - Ban user account
 * 6. POST /users/:id/unban - Unban user account
 * 7. POST /users/:id/suspend - Suspend user temporarily
 * 8. POST /users/:id/unsuspend - Remove suspension
 * 9. GET /users/:id/activity - Get user activity logs
 * 10. GET /users/:id/permissions - Get effective permissions
 * 11. POST /users/:id/reset-password - Admin password reset
 *
 * Security:
 * - All endpoints protected with @ApiBearerAuth()
 * - Permission-based access control via @Permissions()
 * - Self-protection rules enforced in service layer
 * - Comprehensive audit logging
 *
 * Documentation:
 * - Full Swagger/OpenAPI annotations
 * - Request/response examples
 * - Error response documentation
 * - Detailed descriptions
 *
 * @author SouqSyria Development Team
 * @version 1.0.0
 */

import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { UserManagementService } from './user-management.service';
import { Permissions } from '../../access-control/decorators/permissions.decorator';
// NOTE: PermissionsGuard is a global APP_GUARD - no explicit @UseGuards needed

import {
  QueryUsersDto,
  UpdateUserDto,
  AssignRolesDto,
  BanUserDto,
  SuspendUserDto,
  ResetPasswordDto,
} from './dto';

/**
 * UserManagementController
 *
 * RESTful API for user account administration.
 * All endpoints require authentication and specific permissions.
 *
 * Base Path: /api/admin/users
 *
 * Security:
 * - JWT Bearer authentication required
 * - PermissionsGuard enforces role-based access
 * - All actions logged to SecurityAuditLog
 *
 * Response Formats:
 * - Success: JSON with data
 * - Error: JSON with error details
 * - 401: Unauthorized (missing/invalid token)
 * - 403: Forbidden (insufficient permissions)
 * - 404: Not Found (user doesn't exist)
 * - 400: Bad Request (validation errors)
 */
@ApiTags('Admin - User Management')
@ApiBearerAuth()
@Controller('admin/users')
// Guards applied globally via APP_GUARD - see app.module.ts
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  /**
   * List all users with pagination and advanced filtering.
   *
   * This endpoint supports:
   * - Pagination (page, limit)
   * - Search (by email or full name)
   * - Role filtering (by role name)
   * - Status filtering (active, banned, suspended)
   *
   * Performance:
   * - Response time: <200ms for most queries
   * - Uses database indexes for efficient filtering
   * - Eager loads role relations to minimize queries
   *
   * Use Cases:
   * - Admin user management dashboard
   * - User search and discovery
   * - Bulk user operations
   * - Reporting and analytics
   *
   * @param query - Query parameters (pagination, search, filters)
   * @returns Paginated list of users with metadata
   *
   * @example
   * ```typescript
   * // Get first page of active vendors
   * GET /api/admin/users?page=1&limit=20&role=vendor&status=active
   *
   * // Search for user by email
   * GET /api/admin/users?search=john@example.com
   * ```
   */
  @Get()
  @Permissions('manage_users')
  @ApiOperation({
    summary: 'List all users with pagination and filtering',
    description: `
      Retrieve a paginated list of users with advanced filtering capabilities.

      **Supported Filters:**
      - Search by email or full name (case-insensitive partial match)
      - Filter by role name (buyer, vendor, admin, etc.)
      - Filter by status (active, banned, suspended)

      **Response includes:**
      - Array of users with role information
      - Total count (for pagination UI)
      - Current page and limit
      - Total pages available

      **Performance:** Optimized with database indexes, typical response < 200ms
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Records per page (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search query (email or name)',
    example: 'john@example.com',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: 'Filter by role name',
    example: 'vendor',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'banned', 'suspended'],
    description: 'Filter by account status',
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      example: {
        users: [
          {
            id: 1,
            email: 'john.doe@example.com',
            fullName: 'John Doe',
            phone: '+963912345678',
            isVerified: true,
            isBanned: false,
            isSuspended: false,
            role: {
              id: 2,
              name: 'vendor',
              description: 'Product seller',
            },
            assignedRole: null,
            lastLoginAt: '2024-01-20T10:30:00Z',
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 150,
        page: 1,
        limit: 20,
        totalPages: 8,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient permissions (requires manage_users)',
  })
  async findAll(@Query() query: QueryUsersDto) {
    return this.userManagementService.findAllPaginated(query);
  }

  /**
   * Get detailed information about a specific user.
   *
   * Returns comprehensive user data including:
   * - Basic profile (email, name, phone)
   * - Account status (banned, suspended, verified)
   * - Primary business role with permissions
   * - Assigned administrative role with permissions
   * - Activity metadata (last login, creation date)
   *
   * This endpoint is useful for:
   * - User detail pages in admin panel
   * - Pre-populating edit forms
   * - Viewing user permissions
   * - Audit and investigation
   *
   * @param id - User ID to fetch
   * @returns Detailed user information with relations
   *
   * @example
   * ```typescript
   * // Get user details
   * GET /api/admin/users/42
   * ```
   */
  @Get(':id')
  @Permissions('manage_users')
  @ApiOperation({
    summary: 'Get detailed user information',
    description: `
      Retrieve comprehensive information about a specific user including:
      - Basic profile information
      - Account status and security flags
      - Primary business role with permissions
      - Assigned administrative role with permissions
      - Activity timestamps and metadata

      **Use Cases:**
      - User profile viewing in admin panel
      - Pre-populating user edit forms
      - Permission verification
      - Security investigations

      **Performance:** Response time < 100ms with eager loading
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    schema: {
      example: {
        id: 42,
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        phone: '+963912345678',
        isVerified: true,
        isBanned: false,
        isSuspended: false,
        banReason: null,
        role: {
          id: 2,
          name: 'vendor',
          description: 'Product seller',
          rolePermissions: [
            {
              permission: {
                id: 10,
                name: 'manage_products',
                description: 'Manage product listings',
              },
            },
          ],
        },
        assignedRole: null,
        lastLoginAt: '2024-01-20T10:30:00Z',
        lastActivityAt: '2024-01-21T14:22:00Z',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-20T10:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User with ID 42 not found',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires manage_users permission' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userManagementService.findOneWithDetails(id);
  }

  /**
   * Update user profile information.
   *
   * Allows selective updates to user account:
   * - Email address (with uniqueness validation)
   * - Email verification status
   * - Ban status
   * - Suspension status
   *
   * Security Rules:
   * - Cannot modify own ban/suspension status
   * - Email changes validated for uniqueness
   * - All changes logged to audit trail
   *
   * @param id - User ID to update
   * @param dto - Fields to update
   * @param req - Express request (contains authenticated admin)
   * @returns Updated user entity
   *
   * @example
   * ```typescript
   * // Update email and verification
   * PUT /api/admin/users/42
   * {
   *   "email": "newemail@example.com",
   *   "isVerified": true
   * }
   * ```
   */
  @Put(':id')
  @Permissions('manage_users')
  @ApiOperation({
    summary: 'Update user profile information',
    description: `
      Update specific fields of a user's profile.

      **Updatable Fields:**
      - email: User's email address (validated for uniqueness)
      - isVerified: Email verification status
      - isBanned: Account ban status
      - isSuspended: Account suspension status

      **Security Constraints:**
      - Cannot modify your own ban or suspension status (prevents self-lockout)
      - Email changes are validated for uniqueness
      - All modifications logged to SecurityAuditLog

      **Use Cases:**
      - Admin email corrections
      - Manual email verification
      - Direct status changes (prefer dedicated endpoints for ban/suspend)

      **Note:** For banning/suspending with reasons, use dedicated endpoints.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to update',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 42,
        email: 'newemail@example.com',
        isVerified: true,
        isBanned: false,
        isSuspended: false,
        updatedAt: '2024-01-21T15:30:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error or self-modification attempt',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot modify your own ban or suspension status',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.userManagementService.updateUser(id, dto, adminId);
  }

  /**
   * Assign or update user roles.
   *
   * Manages the dual-role system:
   * - Primary business role (buyer, vendor, etc.)
   * - Assigned administrative role (admin, support, etc.)
   *
   * Security Rules:
   * - Cannot remove own admin role (prevents lockout)
   * - Validates role existence before assignment
   * - All changes logged to audit trail
   *
   * @param id - User ID to assign roles to
   * @param dto - Role IDs to assign
   * @param req - Express request (contains authenticated admin)
   * @returns Updated user with new roles
   *
   * @example
   * ```typescript
   * // Make user an admin
   * PUT /api/admin/users/42/roles
   * {
   *   "assignedRoleId": 5
   * }
   * ```
   */
  @Put(':id/roles')
  @Permissions('assign_roles')
  @ApiOperation({
    summary: 'Assign or update user roles',
    description: `
      Manage user role assignments in the dual-role system.

      **Dual Role System:**
      - \`roleId\`: Primary business role (buyer, vendor, supplier)
      - \`assignedRoleId\`: Administrative/staff role (admin, support, marketing)

      **Behavior:**
      - Provide either roleId, assignedRoleId, or both
      - Omitted fields are not changed
      - Both roles contribute to effective permissions (union)

      **Security Constraints:**
      - Cannot remove your own admin role (prevents lockout)
      - Role IDs must exist in database
      - All role changes logged to SecurityAuditLog

      **Use Cases:**
      - Promoting user to admin
      - Changing business role (buyer → vendor)
      - Adding staff permissions (support, marketing)
      - Revoking administrative access

      **Permission Calculation:**
      effectivePermissions = businessRolePermissions ∪ assignedRolePermissions
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to assign roles to',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'Roles assigned successfully',
    schema: {
      example: {
        id: 42,
        email: 'john.doe@example.com',
        role: {
          id: 2,
          name: 'vendor',
        },
        assignedRole: {
          id: 5,
          name: 'admin',
        },
        updatedAt: '2024-01-21T15:35:00Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid role ID or self-modification attempt',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot remove your own admin role',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User or role not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires assign_roles permission' })
  async assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolesDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.userManagementService.assignRoles(id, dto, adminId);
  }

  /**
   * Ban a user account.
   *
   * Banning prevents user from:
   * - Logging in
   * - Accessing any API endpoints
   * - Performing any actions
   *
   * Effects:
   * - Sets isBanned = true
   * - Stores ban reason in user record
   * - Logs action to security audit
   * - User sees "Account banned" message on login attempt
   *
   * Security Rules:
   * - Cannot ban yourself
   * - Requires detailed reason (10-500 characters)
   *
   * @param id - User ID to ban
   * @param dto - Ban reason (required)
   * @param req - Express request (contains authenticated admin)
   * @returns 204 No Content on success
   *
   * @example
   * ```typescript
   * // Ban user for policy violation
   * POST /api/admin/users/42/ban
   * {
   *   "reason": "Repeatedly violated community guidelines by posting spam content"
   * }
   * ```
   */
  @Post(':id/ban')
  @Permissions('ban_users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Ban user account',
    description: `
      Permanently ban a user account from the platform.

      **Effects of Ban:**
      - User cannot login (authentication blocked)
      - All API requests return 403 Forbidden
      - User sees "Account banned: [reason]" message
      - Shopping cart and data preserved for potential appeal

      **Requirements:**
      - Detailed reason (10-500 characters)
      - Cannot ban yourself (self-protection)

      **Workflow:**
      1. Admin submits ban with specific reason
      2. System validates request (not self, user exists)
      3. User.isBanned set to true
      4. User.banReason set to provided reason
      5. Action logged to SecurityAuditLog
      6. All active sessions invalidated (optional)
      7. Email notification sent to user (optional)

      **To Unban:** Use POST /api/admin/users/:id/unban

      **Difference from Suspension:**
      - Ban: Cannot login at all (severe)
      - Suspension: Can login but limited access (moderate)
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to ban',
    example: 42,
  })
  @ApiResponse({
    status: 204,
    description: 'User banned successfully (no content returned)',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot ban yourself or invalid reason',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot ban yourself',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires ban_users permission' })
  async banUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BanUserDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.userManagementService.banUser(id, dto, adminId);
  }

  /**
   * Unban a user account.
   *
   * Removes ban and restores full access.
   *
   * Effects:
   * - Sets isBanned = false
   * - Clears ban reason
   * - Logs action to security audit
   * - User can login again
   *
   * @param id - User ID to unban
   * @param req - Express request (contains authenticated admin)
   * @returns 204 No Content on success
   *
   * @example
   * ```typescript
   * // Unban user after appeal
   * POST /api/admin/users/42/unban
   * ```
   */
  @Post(':id/unban')
  @Permissions('ban_users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unban user account',
    description: `
      Remove ban from user account and restore full access.

      **Effects:**
      - User.isBanned set to false
      - User.banReason cleared
      - Action logged to SecurityAuditLog with previous ban reason
      - User can login and access platform normally

      **Use Cases:**
      - Successful appeal of ban
      - Administrative error correction
      - Disciplinary period completed
      - Terms violation resolved

      **Validation:**
      - User must be currently banned (isBanned = true)
      - Returns 400 if user is not banned

      **Audit Trail:**
      Previous ban reason is preserved in SecurityAuditLog for historical record.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to unban',
    example: 42,
  })
  @ApiResponse({
    status: 204,
    description: 'User unbanned successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User is not banned',
    schema: {
      example: {
        statusCode: 400,
        message: 'User is not banned',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires ban_users permission' })
  async unbanUser(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user.id;
    return this.userManagementService.unbanUser(id, adminId);
  }

  /**
   * Suspend user account temporarily or indefinitely.
   *
   * Suspension is a less severe disciplinary action than ban.
   * User can still login but has restricted access.
   *
   * Effects:
   * - Sets isSuspended = true
   * - Stores suspension reason
   * - Sets expiration date (if duration provided)
   * - Logs action to security audit
   *
   * Security Rules:
   * - Cannot suspend yourself
   * - Requires detailed reason (10-500 characters)
   *
   * @param id - User ID to suspend
   * @param dto - Suspension reason and optional duration
   * @param req - Express request (contains authenticated admin)
   * @returns 204 No Content on success
   *
   * @example
   * ```typescript
   * // Suspend for 7 days pending investigation
   * POST /api/admin/users/42/suspend
   * {
   *   "reason": "Pending investigation for policy violation",
   *   "duration": 7
   * }
   * ```
   */
  @Post(':id/suspend')
  @Permissions('suspend_users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Suspend user account temporarily or indefinitely',
    description: `
      Temporarily restrict user access (less severe than ban).

      **Effects of Suspension:**
      - User CAN still login (unlike ban)
      - Access to certain features restricted (configurable)
      - Used for temporary disciplinary actions
      - Can auto-expire after specified duration

      **Requirements:**
      - Detailed reason (10-500 characters)
      - Optional duration (1-365 days)
      - Cannot suspend yourself

      **Duration Behavior:**
      - If duration provided: Auto-expires after N days
      - If duration omitted: Indefinite (manual unsuspend required)
      - Stored in user.bannedUntil field

      **Common Use Cases:**
      - First-time policy violations (warning)
      - Pending investigation (preserve evidence)
      - Cooling-off period after disputes
      - Account security concerns

      **Auto-Expiration:**
      Implement cron job to check user.bannedUntil and auto-unsuspend expired suspensions.

      **Difference from Ban:**
      - Ban: Cannot login at all
      - Suspension: Can login but restricted (read-only, view-only, etc.)
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to suspend',
    example: 42,
  })
  @ApiResponse({
    status: 204,
    description: 'User suspended successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot suspend yourself or invalid data',
    schema: {
      example: {
        statusCode: 400,
        message: 'Cannot suspend yourself',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires suspend_users permission' })
  async suspendUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendUserDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.userManagementService.suspendUser(id, dto, adminId);
  }

  /**
   * Remove suspension from user account.
   *
   * Restores full access to suspended account.
   *
   * Effects:
   * - Sets isSuspended = false
   * - Clears suspension reason and expiration
   * - Logs action to security audit
   * - User regains full access
   *
   * @param id - User ID to unsuspend
   * @param req - Express request (contains authenticated admin)
   * @returns 204 No Content on success
   *
   * @example
   * ```typescript
   * // Remove suspension after investigation
   * POST /api/admin/users/42/unsuspend
   * ```
   */
  @Post(':id/unsuspend')
  @Permissions('suspend_users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove suspension from user account',
    description: `
      Remove suspension and restore full user access.

      **Effects:**
      - User.isSuspended set to false
      - User.banReason cleared
      - User.bannedUntil cleared
      - Action logged to SecurityAuditLog with previous suspension details
      - User regains full platform access

      **Use Cases:**
      - Investigation concluded (no violation found)
      - Suspension period completed (manual unsuspend before auto-expiry)
      - User fulfilled conditions for reinstatement
      - Administrative error correction

      **Validation:**
      - User must be currently suspended (isSuspended = true)
      - Returns 400 if user is not suspended

      **Audit Trail:**
      Previous suspension reason and expiration preserved in SecurityAuditLog.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to unsuspend',
    example: 42,
  })
  @ApiResponse({
    status: 204,
    description: 'User unsuspended successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'User is not suspended',
    schema: {
      example: {
        statusCode: 400,
        message: 'User is not suspended',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires suspend_users permission' })
  async unsuspendUser(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const adminId = req.user.id;
    return this.userManagementService.unsuspendUser(id, adminId);
  }

  /**
   * Get user activity history from security audit logs.
   *
   * Returns recent security events including:
   * - Permission checks
   * - Access attempts (granted/denied)
   * - Role modifications
   * - Login attempts
   * - Account status changes
   *
   * Useful for:
   * - Security investigations
   * - User behavior analysis
   * - Audit compliance
   * - Incident response
   *
   * @param id - User ID to get activity for
   * @param limit - Maximum events to return (default: 50)
   * @returns Array of security audit log entries
   *
   * @example
   * ```typescript
   * // Get last 20 activity entries
   * GET /api/admin/users/42/activity?limit=20
   * ```
   */
  @Get(':id/activity')
  @Permissions('view_activity_logs')
  @ApiOperation({
    summary: 'Get user activity history',
    description: `
      Retrieve recent security events and activity logs for a user.

      **Returned Events:**
      - Permission checks (granted/denied)
      - Login attempts (successful/failed)
      - Role modifications
      - Account status changes (ban, suspend, etc.)
      - Resource access attempts

      **Use Cases:**
      - Security investigations and forensics
      - User behavior analysis
      - Audit compliance reporting
      - Incident response
      - Support ticket investigation

      **Data Source:**
      Queries SecurityAuditLog table filtered by userId.

      **Performance:**
      - Indexed query (userId, createdAt)
      - Response time < 200ms
      - Sorted by most recent first

      **Limit Parameter:**
      Controls number of events returned (default: 50, adjust as needed).
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to get activity for',
    example: 42,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of activity logs to return',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity logs retrieved successfully',
    schema: {
      example: [
        {
          id: 12345,
          userId: 42,
          action: 'ACCESS_GRANTED',
          resourceType: 'route',
          resourceId: 101,
          permissionRequired: 'manage_products',
          success: true,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          requestPath: '/api/products',
          requestMethod: 'POST',
          createdAt: '2024-01-21T15:40:00Z',
        },
        {
          id: 12344,
          userId: 42,
          action: 'ACCESS_DENIED',
          resourceType: 'route',
          resourceId: 102,
          permissionRequired: 'manage_users',
          success: false,
          failureReason: 'Missing permission: manage_users',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          requestPath: '/api/admin/users',
          requestMethod: 'GET',
          createdAt: '2024-01-21T15:35:00Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires view_activity_logs permission' })
  async getUserActivity(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.userManagementService.getUserActivity(id, limit);
  }

  /**
   * Get effective permissions for a user.
   *
   * Calculates the union of permissions from:
   * - Primary business role (user.role)
   * - Assigned administrative role (user.assignedRole)
   *
   * Returns unique permission names (no duplicates).
   *
   * Useful for:
   * - Debugging permission issues
   * - Verifying role assignments
   * - UI access control decisions
   * - Security audits
   *
   * @param id - User ID to get permissions for
   * @returns Array of unique permission names
   *
   * @example
   * ```typescript
   * // Get user's effective permissions
   * GET /api/admin/users/42/permissions
   * // Returns: ["view_products", "manage_products", "view_orders", ...]
   * ```
   */
  @Get(':id/permissions')
  @Permissions('manage_users')
  @ApiOperation({
    summary: 'Get effective permissions for user',
    description: `
      Calculate and return all effective permissions for a user.

      **Permission Calculation:**
      effectivePermissions = businessRolePermissions ∪ assignedRolePermissions

      **Data Sources:**
      - user.role (primary business role)
      - user.assignedRole (administrative role)

      **Behavior:**
      - Returns union of both role permissions
      - Duplicates removed (Set operation)
      - Sorted alphabetically for consistency

      **Use Cases:**
      - Debugging "Access Denied" issues
      - Verifying role assignments work correctly
      - UI-side permission checks
      - Security audits and compliance
      - User permission documentation

      **Example Response:**
      [
        "access_admin_panel",
        "manage_products",
        "manage_users",
        "view_analytics",
        "view_orders",
        "view_products"
      ]
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to get permissions for',
    example: 42,
  })
  @ApiResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    schema: {
      example: [
        'access_admin_panel',
        'manage_products',
        'manage_users',
        'view_analytics',
        'view_orders',
        'view_products',
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires manage_users permission' })
  async getUserPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.userManagementService.getUserPermissions(id);
  }

  /**
   * Reset user password administratively.
   *
   * Bypasses normal forgot-password flow.
   * Use for:
   * - User lost access to email
   * - Emergency account recovery
   * - Security incidents
   * - Testing purposes
   *
   * Security:
   * - Strong password requirements enforced
   * - Password hashed with bcrypt (12 rounds)
   * - All resets logged to audit trail
   * - User should receive email notification
   * - Consider invalidating existing sessions
   *
   * @param id - User ID to reset password for
   * @param dto - New password (validated for strength)
   * @param req - Express request (contains authenticated admin)
   * @returns 204 No Content on success
   *
   * @example
   * ```typescript
   * // Reset password for account recovery
   * POST /api/admin/users/42/reset-password
   * {
   *   "newPassword": "SecureP@ssw0rd123!"
   * }
   * ```
   */
  @Post(':id/reset-password')
  @Permissions('manage_users')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reset user password administratively',
    description: `
      Administratively reset a user's password bypassing normal flow.

      **Use Cases:**
      - User lost access to email (cannot use forgot password)
      - Emergency account recovery
      - After security incident or compromise
      - Support ticket resolution
      - Testing and development

      **Password Requirements:**
      - Length: 8-100 characters
      - Must contain: uppercase, lowercase, number, special character
      - Pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+...])

      **Security Workflow:**
      1. Validate new password strength (DTO validation)
      2. Hash password with bcrypt (cost factor 12)
      3. Update user.passwordHash
      4. Update user.passwordChangedAt = now
      5. Log action to SecurityAuditLog (without password)
      6. Send email notification to user
      7. (Optional) Invalidate all existing user sessions

      **Best Practices:**
      - Use temporary passwords that users must change on next login
      - Communicate new password securely (not via email)
      - Document reason for password reset
      - Consider requiring 2FA for sensitive accounts

      **Audit Trail:**
      All password resets logged with admin ID and timestamp (password itself is never logged).
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'integer',
    description: 'User ID to reset password for',
    example: 42,
  })
  @ApiResponse({
    status: 204,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Weak password or validation error',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires manage_users permission' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @Request() req,
  ) {
    const adminId = req.user.id;
    return this.userManagementService.resetPassword(id, dto, adminId);
  }
}

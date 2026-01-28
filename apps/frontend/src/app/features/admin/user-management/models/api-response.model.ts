/**
 * User Management - API Request/Response Model Interfaces
 *
 * @description
 * Defines TypeScript interfaces for all API request payloads and response structures.
 * These interfaces mirror the backend DTOs and are used by the data service.
 *
 * @module UserManagement/Models
 * @version 1.0.0
 *
 * @swagger
 * tags:
 *   - name: User Management
 *     description: Admin user management API endpoints
 */

import { BusinessRole, AdminRole, ManagedUser, UserStatus } from './user.model';

// ============================================================================
// USER ACTION REQUEST INTERFACES
// ============================================================================

/**
 * Ban User Request Interface
 *
 * @description
 * Payload for POST /api/admin/users/:id/ban endpoint.
 * Used to ban a user account permanently or temporarily.
 *
 * @example
 * ```typescript
 * const request: BanUserRequest = {
 *   reason: 'Repeated policy violations after multiple warnings',
 *   permanent: true,
 *   internalNotes: 'User warned 3 times, continued spam activity'
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     BanUserRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           minLength: 10
 *           maxLength: 500
 *           description: Public reason for the ban (visible to user)
 *           example: 'Repeated policy violations after multiple warnings'
 *         permanent:
 *           type: boolean
 *           default: true
 *           description: Whether ban is permanent (true) or can be appealed
 *         internalNotes:
 *           type: string
 *           maxLength: 1000
 *           description: Internal notes visible only to admins
 *         notifyUser:
 *           type: boolean
 *           default: true
 *           description: Send email notification to user
 */
export interface BanUserRequest {
  /** Public reason for the ban (shown to user in notification) */
  reason: string;

  /** Whether the ban is permanent (default: true) */
  permanent?: boolean;

  /** Internal notes for admin reference (not shown to user) */
  internalNotes?: string;

  /** Whether to send email notification to user (default: true) */
  notifyUser?: boolean;
}

/**
 * Suspend User Request Interface
 *
 * @description
 * Payload for POST /api/admin/users/:id/suspend endpoint.
 * Used for temporary account suspension with automatic expiry.
 *
 * @example
 * ```typescript
 * const request: SuspendUserRequest = {
 *   reason: 'Account under review due to suspicious activity',
 *   until: new Date('2024-07-01'),
 *   internalNotes: 'Investigating unusual login pattern from multiple countries'
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     SuspendUserRequest:
 *       type: object
 *       required:
 *         - reason
 *         - until
 *       properties:
 *         reason:
 *           type: string
 *           minLength: 10
 *           maxLength: 500
 *           description: Public reason for suspension (visible to user)
 *           example: 'Account under review due to suspicious activity'
 *         until:
 *           type: string
 *           format: date-time
 *           description: When the suspension will automatically lift
 *           example: '2024-07-01T00:00:00Z'
 *         internalNotes:
 *           type: string
 *           maxLength: 1000
 *           description: Internal notes visible only to admins
 *         notifyUser:
 *           type: boolean
 *           default: true
 *           description: Send email notification to user
 */
export interface SuspendUserRequest {
  /** Public reason for suspension (shown to user) */
  reason: string;

  /** Date/time when suspension will automatically lift */
  until: Date;

  /** Internal notes for admin reference (not shown to user) */
  internalNotes?: string;

  /** Whether to send email notification to user (default: true) */
  notifyUser?: boolean;
}

/**
 * Update Roles Request Interface
 *
 * @description
 * Payload for PUT /api/admin/users/:id/roles endpoint.
 * Used to change user's business role and/or admin role.
 *
 * Note: At least one of businessRole or adminRole must be provided.
 *
 * @example
 * ```typescript
 * // Promote customer to seller
 * const request1: UpdateRolesRequest = {
 *   businessRole: 'seller'
 * };
 *
 * // Assign admin role
 * const request2: UpdateRolesRequest = {
 *   adminRole: 'moderator'
 * };
 *
 * // Change both
 * const request3: UpdateRolesRequest = {
 *   businessRole: 'admin',
 *   adminRole: 'super_admin'
 * };
 *
 * // Remove admin role
 * const request4: UpdateRolesRequest = {
 *   adminRole: null
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UpdateRolesRequest:
 *       type: object
 *       description: At least one role field must be provided
 *       properties:
 *         businessRole:
 *           $ref: '#/components/schemas/BusinessRole'
 *           description: New business role (optional)
 *         adminRole:
 *           $ref: '#/components/schemas/AdminRole'
 *           nullable: true
 *           description: New admin role (null to remove admin access)
 *         reason:
 *           type: string
 *           maxLength: 500
 *           description: Reason for role change (for audit log)
 */
export interface UpdateRolesRequest {
  /** New business role (optional, omit to keep current) */
  businessRole?: BusinessRole;

  /** New admin role (null to remove admin access) */
  adminRole?: AdminRole;

  /** Reason for role change (stored in audit log) */
  reason?: string;
}

/**
 * Reset Password Request Interface
 *
 * @description
 * Payload for POST /api/admin/users/:id/reset-password endpoint.
 * Admin-initiated password reset.
 *
 * @swagger
 * components:
 *   schemas:
 *     ResetPasswordRequest:
 *       type: object
 *       properties:
 *         sendEmail:
 *           type: boolean
 *           default: true
 *           description: Send password reset link via email
 *         generateTemp:
 *           type: boolean
 *           default: false
 *           description: Generate temporary password (returns in response)
 *         reason:
 *           type: string
 *           description: Reason for admin reset (for audit log)
 */
export interface ResetPasswordRequest {
  /** Whether to send password reset link via email (default: true) */
  sendEmail?: boolean;

  /** Whether to generate and return a temporary password (default: false) */
  generateTemp?: boolean;

  /** Reason for reset (stored in audit log) */
  reason?: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * Reset Password Response Interface
 *
 * @description
 * Response from POST /api/admin/users/:id/reset-password endpoint.
 *
 * @swagger
 * components:
 *   schemas:
 *     ResetPasswordResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether operation succeeded
 *         message:
 *           type: string
 *           description: Status message
 *         temporaryPassword:
 *           type: string
 *           description: Temporary password (only if generateTemp=true)
 *         emailSent:
 *           type: boolean
 *           description: Whether email was sent
 */
export interface ResetPasswordResponse {
  /** Whether operation succeeded */
  success: boolean;

  /** Status message */
  message: string;

  /** Temporary password (only present if generateTemp=true in request) */
  temporaryPassword?: string;

  /** Whether reset email was sent */
  emailSent?: boolean;
}

/**
 * User Effective Permissions Response Interface
 *
 * @description
 * Response from GET /api/admin/users/:id/permissions endpoint.
 * Contains the complete set of effective permissions for a user.
 *
 * @swagger
 * components:
 *   schemas:
 *     UserEffectivePermissions:
 *       type: object
 *       required:
 *         - userId
 *         - permissions
 *         - roles
 *       properties:
 *         userId:
 *           type: integer
 *           description: User ID
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Flattened array of permission names
 *           example: ['manage_users', 'view_products', 'edit_orders']
 *         roles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoleWithPermissions'
 *           description: Roles with their individual permissions
 */
export interface UserEffectivePermissions {
  /** User ID */
  userId: number;

  /** Flattened array of all effective permission names */
  permissions: string[];

  /** Roles with their individual permissions */
  roles: RoleWithPermissions[];
}

/**
 * Role with Permissions Interface
 *
 * @description
 * Role entity with its associated permissions.
 *
 * @swagger
 * components:
 *   schemas:
 *     RoleWithPermissions:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - permissions
 *       properties:
 *         id:
 *           type: integer
 *           description: Role ID
 *         name:
 *           type: string
 *           description: Role name
 *           example: 'moderator'
 *         description:
 *           type: string
 *           description: Role description
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: Permission names for this role
 */
export interface RoleWithPermissions {
  /** Role ID */
  id: number;

  /** Role name */
  name: string;

  /** Role description */
  description?: string;

  /** Permissions assigned to this role */
  permissions: string[];
}

// ============================================================================
// BULK OPERATION INTERFACES
// ============================================================================

/**
 * Bulk Operation Request Base Interface
 *
 * @description
 * Base interface for all bulk operation requests.
 *
 * @swagger
 * components:
 *   schemas:
 *     BulkOperationRequest:
 *       type: object
 *       required:
 *         - userIds
 *       properties:
 *         userIds:
 *           type: array
 *           items:
 *             type: integer
 *           minItems: 1
 *           maxItems: 100
 *           description: User IDs to operate on
 */
export interface BulkOperationRequest {
  /** User IDs to operate on (max 100) */
  userIds: number[];
}

/**
 * Bulk Ban Request Interface
 *
 * @swagger
 * components:
 *   schemas:
 *     BulkBanRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BulkOperationRequest'
 *         - $ref: '#/components/schemas/BanUserRequest'
 */
export interface BulkBanRequest extends BulkOperationRequest, BanUserRequest {}

/**
 * Bulk Suspend Request Interface
 *
 * @swagger
 * components:
 *   schemas:
 *     BulkSuspendRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BulkOperationRequest'
 *         - $ref: '#/components/schemas/SuspendUserRequest'
 */
export interface BulkSuspendRequest extends BulkOperationRequest, SuspendUserRequest {}

/**
 * Bulk Update Roles Request Interface
 *
 * @swagger
 * components:
 *   schemas:
 *     BulkUpdateRolesRequest:
 *       allOf:
 *         - $ref: '#/components/schemas/BulkOperationRequest'
 *         - $ref: '#/components/schemas/UpdateRolesRequest'
 */
export interface BulkUpdateRolesRequest extends BulkOperationRequest, UpdateRolesRequest {}

/**
 * Bulk Operation Response Interface
 *
 * @description
 * Response from any bulk operation endpoint.
 *
 * @swagger
 * components:
 *   schemas:
 *     BulkOperationResponse:
 *       type: object
 *       required:
 *         - success
 *         - failed
 *         - total
 *       properties:
 *         success:
 *           type: integer
 *           description: Number of users successfully processed
 *           example: 8
 *         failed:
 *           type: integer
 *           description: Number of users that failed processing
 *           example: 2
 *         total:
 *           type: integer
 *           description: Total users attempted
 *           example: 10
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BulkOperationError'
 *           description: Details of failed operations
 */
export interface BulkOperationResponse {
  /** Number of users successfully processed */
  success: number;

  /** Number of users that failed processing */
  failed: number;

  /** Total users attempted */
  total: number;

  /** Details of failed operations (if any) */
  errors?: BulkOperationError[];
}

/**
 * Bulk Operation Error Interface
 *
 * @swagger
 * components:
 *   schemas:
 *     BulkOperationError:
 *       type: object
 *       required:
 *         - userId
 *         - error
 *       properties:
 *         userId:
 *           type: integer
 *           description: User ID that failed
 *         error:
 *           type: string
 *           description: Error message
 */
export interface BulkOperationError {
  /** User ID that failed */
  userId: number;

  /** Error message describing the failure */
  error: string;
}

// ============================================================================
// API ERROR RESPONSE INTERFACE
// ============================================================================

/**
 * API Error Response Interface
 *
 * @description
 * Standard error response structure from the backend.
 *
 * @swagger
 * components:
 *   schemas:
 *     ApiError:
 *       type: object
 *       required:
 *         - statusCode
 *         - message
 *       properties:
 *         statusCode:
 *           type: integer
 *           description: HTTP status code
 *           example: 400
 *         message:
 *           type: string
 *           description: Error message
 *           example: 'Invalid request parameters'
 *         error:
 *           type: string
 *           description: Error type
 *           example: 'Bad Request'
 *         details:
 *           type: object
 *           additionalProperties: true
 *           description: Additional error details
 */
export interface ApiError {
  /** HTTP status code */
  statusCode: number;

  /** Error message */
  message: string;

  /** Error type/name */
  error?: string;

  /** Additional error details */
  details?: Record<string, any>;

  /** Validation errors (for 400 responses) */
  validationErrors?: ValidationError[];
}

/**
 * Validation Error Interface
 *
 * @swagger
 * components:
 *   schemas:
 *     ValidationError:
 *       type: object
 *       required:
 *         - field
 *         - message
 *       properties:
 *         field:
 *           type: string
 *           description: Field that failed validation
 *           example: 'email'
 *         message:
 *           type: string
 *           description: Validation error message
 *           example: 'Invalid email format'
 *         value:
 *           description: The invalid value that was submitted
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Validation error message */
  message: string;

  /** The invalid value that was submitted */
  value?: any;
}

// ============================================================================
// USER UPDATE RESPONSE
// ============================================================================

/**
 * User Update Response Interface
 *
 * @description
 * Response from PUT /api/admin/users/:id endpoint.
 * Returns the updated user entity.
 *
 * @swagger
 * components:
 *   schemas:
 *     UserUpdateResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ManagedUser'
 *         - type: object
 *           properties:
 *             _meta:
 *               type: object
 *               properties:
 *                 updatedFields:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Fields that were updated
 */
export interface UserUpdateResponse extends ManagedUser {
  /** Response metadata */
  _meta?: {
    /** Fields that were updated */
    updatedFields: string[];
  };
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

/**
 * Quick Action Type
 *
 * @description
 * Available quick actions in the user table row menu.
 */
export type QuickAction =
  | 'view'
  | 'edit'
  | 'ban'
  | 'unban'
  | 'suspend'
  | 'unsuspend'
  | 'resetPassword'
  | 'assignRole'
  | 'viewActivity'
  | 'viewPermissions';

/**
 * Quick Action Request Interface
 *
 * @description
 * Unified interface for quick action requests.
 */
export interface QuickActionRequest {
  /** Action to perform */
  action: QuickAction;

  /** Target user ID */
  userId: number;

  /** Action-specific payload */
  payload?: BanUserRequest | SuspendUserRequest | UpdateRolesRequest;
}

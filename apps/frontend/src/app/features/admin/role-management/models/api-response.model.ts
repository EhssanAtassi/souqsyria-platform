/**
 * Role Management - API Response Models
 *
 * @description
 * Defines TypeScript interfaces for paginated responses and API errors.
 *
 * @module RoleManagement/Models
 * @version 1.0.0
 */

import { Role } from './role.model';
import { Permission } from './permission.model';

// ============================================================================
// PAGINATED RESPONSE
// ============================================================================

/**
 * Paginated API Response
 *
 * @description
 * Generic paginated response wrapper for list endpoints.
 *
 * @example
 * ```typescript
 * const response: PaginatedResponse<Role> = {
 *   items: [...roles],
 *   page: 1,
 *   limit: 25,
 *   total: 156,
 *   totalPages: 7
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     PaginatedResponse:
 *       type: object
 *       required:
 *         - items
 *         - page
 *         - limit
 *         - total
 *         - totalPages
 *       properties:
 *         items:
 *           type: array
 *           description: Array of items for current page
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Items per page
 *           example: 25
 *         total:
 *           type: integer
 *           description: Total item count
 *           example: 156
 *         totalPages:
 *           type: integer
 *           description: Total page count
 *           example: 7
 */
export interface PaginatedResponse<T> {
  /** Array of items for current page */
  items: T[];

  /** Current page number */
  page: number;

  /** Items per page */
  limit: number;

  /** Total item count across all pages */
  total: number;

  /** Total page count */
  totalPages: number;
}

/**
 * Roles Paginated Response
 */
export type RolesPaginatedResponse = PaginatedResponse<Role>;

/**
 * Permissions Paginated Response
 */
export type PermissionsPaginatedResponse = PaginatedResponse<Permission>;

// ============================================================================
// API ERROR RESPONSE
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
 *           example: 'name'
 *         message:
 *           type: string
 *           description: Validation error message
 *           example: 'Name must be unique'
 *         value:
 *           description: The invalid value that was submitted
 */
export interface ValidationError {
  /** Field that failed validation */
  field: string;

  /** Validation error message */
  message: string;

  /** The invalid value submitted */
  value?: any;
}

// ============================================================================
// PAGINATION STATE
// ============================================================================

/**
 * Pagination State Interface
 *
 * @description
 * Client-side pagination state.
 *
 * @example
 * ```typescript
 * const pagination: PaginationState = {
 *   page: 1,
 *   limit: 25,
 *   total: 156,
 *   totalPages: 7,
 *   sortBy: 'priority',
 *   sortOrder: 'desc'
 * };
 * ```
 */
export interface PaginationState {
  /** Current page number */
  page: number;

  /** Items per page */
  limit: number;

  /** Total item count */
  total: number;

  /** Total page count */
  totalPages: number;

  /** Current sort field */
  sortBy: string;

  /** Current sort direction */
  sortOrder: 'asc' | 'desc';
}

/**
 * Initial Pagination Factory
 *
 * @description
 * Creates initial pagination state.
 *
 * @param limit - Items per page (default: 10)
 * @returns Initial pagination state
 */
export function createInitialPagination(limit = 10): PaginationState {
  return {
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
    sortBy: 'priority',
    sortOrder: 'desc'
  };
}

// ============================================================================
// ROLE-SPECIFIC RESPONSES
// ============================================================================

/**
 * Users with Role Response
 *
 * @description
 * Response from GET /api/admin/roles/:id/users endpoint.
 *
 * @swagger
 * components:
 *   schemas:
 *     UsersWithRoleResponse:
 *       type: object
 *       required:
 *         - roleId
 *         - roleName
 *         - users
 *       properties:
 *         roleId:
 *           type: integer
 *           description: Role ID
 *         roleName:
 *           type: string
 *           description: Role name
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserSummary'
 */
export interface UsersWithRoleResponse {
  /** Role ID */
  roleId: number;

  /** Role name */
  roleName: string;

  /** Users with this role */
  users: Array<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }>;

  /** Total user count */
  totalCount: number;
}

/**
 * Clone Role Response
 *
 * @description
 * Response from POST /api/admin/roles/:id/clone endpoint.
 */
export interface CloneRoleResponse extends Role {
  /** Original role ID that was cloned */
  originalRoleId: number;

  /** Message about cloning */
  message?: string;
}

/**
 * Delete Role Response
 *
 * @description
 * Response from DELETE /api/roles/:id endpoint.
 *
 * @swagger
 * components:
 *   schemas:
 *     DeleteRoleResponse:
 *       type: object
 *       required:
 *         - success
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether deletion succeeded
 *         message:
 *           type: string
 *           description: Status message
 *         affectedUsers:
 *           type: integer
 *           description: Number of users who had this role
 */
export interface DeleteRoleResponse {
  /** Whether deletion succeeded */
  success: boolean;

  /** Status message */
  message: string;

  /** Number of users who had this role */
  affectedUsers?: number;
}

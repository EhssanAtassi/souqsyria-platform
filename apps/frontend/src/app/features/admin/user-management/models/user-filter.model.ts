/**
 * User Management - Filter Model Interfaces
 *
 * @description
 * Defines TypeScript interfaces for user filtering, pagination, and API request/response structures.
 * Used by the user table, filter panel, and data service.
 *
 * @module UserManagement/Models
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     UserFilter:
 *       type: object
 *       description: Filter criteria for user list
 */

import { UserStatus, BusinessRole, AdminRole } from './user.model';

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Date Range Interface
 *
 * @description
 * Represents a date range for filtering by registration date, last login, etc.
 *
 * @example
 * ```typescript
 * const range: DateRange = {
 *   start: new Date('2024-01-01'),
 *   end: new Date('2024-06-30')
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     DateRange:
 *       type: object
 *       required:
 *         - start
 *         - end
 *       properties:
 *         start:
 *           type: string
 *           format: date-time
 *           description: Range start date (inclusive)
 *           example: '2024-01-01T00:00:00Z'
 *         end:
 *           type: string
 *           format: date-time
 *           description: Range end date (inclusive)
 *           example: '2024-06-30T23:59:59Z'
 */
export interface DateRange {
  /** Start date (inclusive) */
  start: Date;

  /** End date (inclusive) */
  end: Date;
}

/**
 * User Filter Interface
 *
 * @description
 * Complete filter criteria for the user list.
 * All fields are optional - null means "no filter" for that field.
 *
 * Filter Logic:
 * - Multiple active filters use AND logic
 * - Date range is inclusive on both ends
 * - Search query is applied separately (see UsersListParams)
 *
 * @example
 * ```typescript
 * const filters: UserFilter = {
 *   status: 'active',
 *   businessRole: 'seller',
 *   adminRole: null,
 *   dateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-06-30')
 *   },
 *   isVerified: true
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserFilter:
 *       type: object
 *       description: Filter criteria for user list (all fields optional)
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/UserStatus'
 *           nullable: true
 *           description: Filter by account status
 *         role:
 *           type: string
 *           nullable: true
 *           description: Filter by any role (business or admin)
 *         businessRole:
 *           $ref: '#/components/schemas/BusinessRole'
 *           nullable: true
 *           description: Filter by business role specifically
 *         adminRole:
 *           $ref: '#/components/schemas/AdminRole'
 *           nullable: true
 *           description: Filter by admin role specifically
 *         dateRange:
 *           $ref: '#/components/schemas/DateRange'
 *           nullable: true
 *           description: Filter by registration date range
 *         isVerified:
 *           type: boolean
 *           nullable: true
 *           description: Filter by verification status (email OR phone verified)
 *         isEmailVerified:
 *           type: boolean
 *           nullable: true
 *           description: Filter by email verification status
 *         isPhoneVerified:
 *           type: boolean
 *           nullable: true
 *           description: Filter by phone verification status
 *         hasTwoFactor:
 *           type: boolean
 *           nullable: true
 *           description: Filter by 2FA enabled status
 */
export interface UserFilter {
  /** Filter by account status */
  status: UserStatus | null;

  /** Filter by any role (legacy, prefer businessRole/adminRole) */
  role: string | null;

  /** Filter by roles array (for multi-select) */
  roles?: string[];

  /** Filter by business role specifically */
  businessRole: BusinessRole | null;

  /** Filter by admin role specifically */
  adminRole: AdminRole | null;

  /** Whether user has any admin role */
  hasAdminRole?: boolean;

  /** Filter by registration date range */
  dateRange: DateRange | null;

  /** Filter by created after date */
  createdAfter?: Date;

  /** Filter by created before date */
  createdBefore?: Date;

  /** Filter by verification status (true = email OR phone verified) */
  isVerified: boolean | null;

  /** Filter by email verification status specifically */
  isEmailVerified?: boolean | null;

  /** Filter by phone verification status specifically */
  isPhoneVerified?: boolean | null;

  /** Filter by two-factor authentication enabled */
  hasTwoFactor?: boolean | null;
}

/**
 * Sort Direction Type
 *
 * @swagger
 * components:
 *   schemas:
 *     SortOrder:
 *       type: string
 *       enum: [asc, desc]
 *       description: Sort direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Sortable User Fields
 *
 * @description
 * Fields that support server-side sorting in the users table.
 */
export type SortableUserField =
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'status'
  | 'businessRole'
  | 'adminRole'
  | 'createdAt'
  | 'updatedAt'
  | 'lastLoginAt'
  | 'lastActiveAt';

// ============================================================================
// PAGINATION INTERFACES
// ============================================================================

/**
 * Pagination State Interface
 *
 * @description
 * Tracks current pagination state in the store.
 * Used by table paginator and state management.
 *
 * @swagger
 * components:
 *   schemas:
 *     PaginationState:
 *       type: object
 *       required:
 *         - page
 *         - limit
 *         - total
 *         - totalPages
 *         - sortBy
 *         - sortOrder
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           description: Current page number (1-indexed)
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: Items per page
 *           example: 10
 *         total:
 *           type: integer
 *           minimum: 0
 *           description: Total items matching filters
 *           example: 1250
 *         totalPages:
 *           type: integer
 *           minimum: 0
 *           description: Total number of pages
 *           example: 125
 *         sortBy:
 *           type: string
 *           description: Current sort column
 *           example: 'createdAt'
 *         sortOrder:
 *           $ref: '#/components/schemas/SortOrder'
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  limit: number;

  /** Total items count from API */
  total: number;

  /** Total count (alias for total, for compatibility) */
  totalCount?: number;

  /** Total pages (calculated: ceil(total / limit)) */
  totalPages: number;

  /** Current sort column */
  sortBy: string;

  /** Current sort direction */
  sortOrder: SortOrder;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

/**
 * Users List Parameters Interface
 *
 * @description
 * Complete request parameters for GET /api/admin/users endpoint.
 * Combines pagination, sorting, search, and filter criteria.
 *
 * @example
 * ```typescript
 * const params: UsersListParams = {
 *   page: 1,
 *   limit: 25,
 *   sortBy: 'createdAt',
 *   sortOrder: 'desc',
 *   search: 'ahmad',
 *   status: 'active',
 *   businessRole: 'seller'
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UsersListParams:
 *       type: object
 *       required:
 *         - page
 *         - limit
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           description: Page number (1-indexed)
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: Items per page
 *           example: 10
 *         sortBy:
 *           type: string
 *           description: Field to sort by
 *           example: 'createdAt'
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *           description: Sort direction
 *           example: 'desc'
 *         search:
 *           type: string
 *           description: Search query (searches email, firstName, lastName, phone)
 *           example: 'ahmad'
 *         status:
 *           $ref: '#/components/schemas/UserStatus'
 *         businessRole:
 *           $ref: '#/components/schemas/BusinessRole'
 *         adminRole:
 *           $ref: '#/components/schemas/AdminRole'
 *         isVerified:
 *           type: boolean
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Registration date range start
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Registration date range end
 */
export interface UsersListParams extends Partial<Omit<UserFilter, 'dateRange'>> {
  /** Page number (1-indexed) */
  page: number;

  /** Items per page (default: 10, max: 100) */
  limit: number;

  /** Field to sort by */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: SortOrder;

  /** Search query (searches email, firstName, lastName, phone) */
  search?: string;

  /** Date range start (ISO string sent to API) */
  startDate?: string;

  /** Date range end (ISO string sent to API) */
  endDate?: string;
}

/**
 * Users List Response Interface
 *
 * @description
 * Response structure from GET /api/admin/users endpoint.
 * Contains paginated user data and metadata.
 *
 * @example
 * ```typescript
 * const response: UsersListResponse = {
 *   data: [user1, user2, ...],
 *   total: 1250,
 *   page: 1,
 *   limit: 10,
 *   totalPages: 125
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UsersListResponse:
 *       type: object
 *       required:
 *         - data
 *         - total
 *         - page
 *         - limit
 *         - totalPages
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ManagedUser'
 *           description: Array of user entities
 *         total:
 *           type: integer
 *           description: Total users matching filters
 *           example: 1250
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Items per page
 *           example: 10
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *           example: 125
 */
export interface UsersListResponse {
  /** Array of user entities */
  data: import('./user.model').ManagedUser[];

  /** Total users matching filters (before pagination) */
  total: number;

  /** Current page number (1-indexed) */
  page: number;

  /** Items per page */
  limit: number;

  /** Total number of pages */
  totalPages: number;
}

// ============================================================================
// FILTER OPTION INTERFACES
// ============================================================================

/**
 * Filter Option Interface
 *
 * @description
 * Generic interface for filter dropdown options.
 * Used by status, role, and other filter dropdowns.
 */
export interface FilterOption<T = string> {
  /** Option value */
  value: T;

  /** Display label */
  label: string;

  /** Optional icon name (Material icon) */
  icon?: string;

  /** Optional color for visual indicator */
  color?: string;

  /** Whether option is disabled */
  disabled?: boolean;
}

/**
 * Status Filter Options
 *
 * @description
 * Predefined options for status filter dropdown.
 */
export const STATUS_FILTER_OPTIONS: FilterOption<UserStatus>[] = [
  { value: 'active', label: 'Active', icon: 'check_circle', color: '#4caf50' },
  { value: 'inactive', label: 'Inactive', icon: 'remove_circle', color: '#9e9e9e' },
  { value: 'pending', label: 'Pending', icon: 'hourglass_empty', color: '#ff9800' },
  { value: 'suspended', label: 'Suspended', icon: 'pause_circle', color: '#f44336' },
  { value: 'banned', label: 'Banned', icon: 'block', color: '#b71c1c' }
];

/**
 * Business Role Filter Options
 */
export const BUSINESS_ROLE_FILTER_OPTIONS: FilterOption<BusinessRole>[] = [
  { value: 'customer', label: 'Customer', icon: 'person' },
  { value: 'seller', label: 'Seller', icon: 'store' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' }
];

/**
 * Admin Role Filter Options
 */
export const ADMIN_ROLE_FILTER_OPTIONS: FilterOption<AdminRole>[] = [
  { value: 'super_admin', label: 'Super Admin', icon: 'security' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
  { value: 'moderator', label: 'Moderator', icon: 'shield' },
  { value: 'customer_service', label: 'Customer Service', icon: 'support_agent' },
  { value: 'vendor_manager', label: 'Vendor Manager', icon: 'store' },
  { value: null, label: 'No Admin Role', icon: 'person_off' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create Initial Filters
 *
 * @description
 * Factory function to create default filter state.
 *
 * @returns Empty filter object with all fields set to null
 */
export function createInitialFilters(): UserFilter {
  return {
    status: null,
    role: null,
    roles: undefined,
    businessRole: null,
    adminRole: null,
    hasAdminRole: undefined,
    dateRange: null,
    createdAfter: undefined,
    createdBefore: undefined,
    isVerified: null,
    isEmailVerified: null,
    isPhoneVerified: null,
    hasTwoFactor: null
  };
}

/**
 * Create Initial Pagination
 *
 * @description
 * Factory function to create default pagination state.
 *
 * @param limit - Optional page size (default: 10)
 * @returns Initial pagination state
 */
export function createInitialPagination(limit = 10): PaginationState {
  return {
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };
}

/**
 * Has Active Filters
 *
 * @description
 * Check if any filters are currently applied.
 *
 * @param filters - Current filter state
 * @returns True if any filter is active (non-null)
 */
export function hasActiveFilters(filters: UserFilter): boolean {
  return Object.values(filters).some(value => value !== null);
}

/**
 * Count Active Filters
 *
 * @description
 * Count number of active filters for badge display.
 *
 * @param filters - Current filter state
 * @returns Number of active filters
 */
export function countActiveFilters(filters: UserFilter): number {
  return Object.values(filters).filter(value => value !== null).length;
}

/**
 * User Management Constants
 *
 * @description
 * Centralized constants for the User Management feature.
 * Includes status configurations, role definitions, table settings, and more.
 *
 * @module UserManagement/Constants
 */

import { UserStatus, BusinessRole, AdminRole } from '../models';

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

/**
 * Status Display Configuration Interface
 */
export interface StatusConfig {
  /** Status value */
  value: UserStatus;

  /** Display label */
  label: string;

  /** Material icon name */
  icon: string;

  /** CSS color (hex or named) */
  color: string;

  /** Background color for badge */
  backgroundColor: string;

  /** Whether status is actionable (can be changed) */
  actionable: boolean;

  /** Tooltip text */
  tooltip: string;
}

/**
 * Status Configuration Map
 *
 * @description
 * Display configuration for each user status.
 * Used by StatusBadgeComponent and filter dropdowns.
 */
export const STATUS_CONFIGS: Record<UserStatus, StatusConfig> = {
  active: {
    value: 'active',
    label: 'Active',
    icon: 'check_circle',
    color: '#4caf50',
    backgroundColor: '#e8f5e9',
    actionable: true,
    tooltip: 'Account is active and fully functional'
  },
  inactive: {
    value: 'inactive',
    label: 'Inactive',
    icon: 'remove_circle_outline',
    color: '#9e9e9e',
    backgroundColor: '#f5f5f5',
    actionable: true,
    tooltip: 'Account created but not yet activated'
  },
  pending: {
    value: 'pending',
    label: 'Pending',
    icon: 'hourglass_empty',
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    actionable: true,
    tooltip: 'Account pending approval (seller verification)'
  },
  suspended: {
    value: 'suspended',
    label: 'Suspended',
    icon: 'pause_circle_outline',
    color: '#ff5722',
    backgroundColor: '#fbe9e7',
    actionable: true,
    tooltip: 'Account temporarily suspended'
  },
  banned: {
    value: 'banned',
    label: 'Banned',
    icon: 'block',
    color: '#f44336',
    backgroundColor: '#ffebee',
    actionable: true,
    tooltip: 'Account permanently banned'
  }
};

// ============================================================================
// ROLE CONFIGURATION
// ============================================================================

/**
 * Role Configuration Interface
 */
export interface RoleConfig {
  /** Role value */
  value: string;

  /** Display label */
  label: string;

  /** Arabic label */
  labelAr: string;

  /** Material icon name */
  icon: string;

  /** Description */
  description: string;

  /** Color for badges */
  color?: string;
}

/**
 * Business Role Configurations
 */
export const BUSINESS_ROLES: RoleConfig[] = [
  {
    value: 'customer',
    label: 'Customer',
    labelAr: 'زبون',
    icon: 'person',
    description: 'Can browse and purchase products',
    color: '#2196f3'
  },
  {
    value: 'seller',
    label: 'Seller',
    labelAr: 'بائع',
    icon: 'store',
    description: 'Can list and sell products',
    color: '#4caf50'
  },
  {
    value: 'admin',
    label: 'Admin',
    labelAr: 'مسؤول',
    icon: 'admin_panel_settings',
    description: 'System administrator',
    color: '#9c27b0'
  }
];

/**
 * Status options for dropdowns/filters
 */
export const USER_STATUS_OPTIONS = Object.values(STATUS_CONFIGS);

/**
 * Business role options for dropdowns/filters
 */
export const BUSINESS_ROLE_OPTIONS = BUSINESS_ROLES;

/**
 * Admin Role Configurations
 */
export const ADMIN_ROLES: RoleConfig[] = [
  {
    value: 'super_admin',
    label: 'Super Admin',
    labelAr: 'مسؤول عام',
    icon: 'security',
    description: 'Full system access, can manage all admins'
  },
  {
    value: 'admin',
    label: 'Admin',
    labelAr: 'مسؤول',
    icon: 'admin_panel_settings',
    description: 'Full content management access'
  },
  {
    value: 'moderator',
    label: 'Moderator',
    labelAr: 'مشرف',
    icon: 'shield',
    description: 'Content review and user communication'
  },
  {
    value: 'customer_service',
    label: 'Customer Service',
    labelAr: 'خدمة العملاء',
    icon: 'support_agent',
    description: 'Order and user support'
  },
  {
    value: 'vendor_manager',
    label: 'Vendor Manager',
    labelAr: 'مدير البائعين',
    icon: 'store',
    description: 'Vendor approval and management'
  }
];

/**
 * Get Business Role Config
 */
export function getBusinessRoleConfig(role: BusinessRole): RoleConfig | undefined {
  return BUSINESS_ROLES.find(r => r.value === role);
}

/**
 * Get Admin Role Config
 */
export function getAdminRoleConfig(role: AdminRole): RoleConfig | undefined {
  if (!role) return undefined;
  return ADMIN_ROLES.find(r => r.value === role);
}

// ============================================================================
// TABLE CONFIGURATION
// ============================================================================

/**
 * Default Pagination Settings
 */
export const PAGINATION_DEFAULTS = {
  /** Default page size */
  PAGE_SIZE: 10,

  /** Available page size options */
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],

  /** Maximum page size */
  MAX_PAGE_SIZE: 100,

  /** Default sort column */
  DEFAULT_SORT_BY: 'createdAt',

  /** Default sort direction */
  DEFAULT_SORT_ORDER: 'desc' as const
} as const;

/**
 * Table Column Configuration Interface
 */
export interface TableColumnConfig {
  /** Column key (matches data property) */
  key: string;

  /** Display header */
  header: string;

  /** Arabic header */
  headerAr: string;

  /** Whether column is sortable */
  sortable: boolean;

  /** Whether column is visible by default */
  defaultVisible: boolean;

  /** Column width (CSS value) */
  width?: string;

  /** Minimum width */
  minWidth?: string;

  /** Column type for formatting */
  type: 'text' | 'date' | 'status' | 'role' | 'avatar' | 'boolean' | 'actions';

  /** Whether column is sticky */
  sticky?: 'start' | 'end';
}

/**
 * User Table Column Configurations
 */
export const TABLE_COLUMNS: TableColumnConfig[] = [
  {
    key: 'select',
    header: '',
    headerAr: '',
    sortable: false,
    defaultVisible: true,
    width: '48px',
    type: 'actions',
    sticky: 'start'
  },
  {
    key: 'avatar',
    header: '',
    headerAr: '',
    sortable: false,
    defaultVisible: true,
    width: '56px',
    type: 'avatar'
  },
  {
    key: 'fullName',
    header: 'Name',
    headerAr: 'الاسم',
    sortable: true,
    defaultVisible: true,
    minWidth: '150px',
    type: 'text'
  },
  {
    key: 'email',
    header: 'Email',
    headerAr: 'البريد الإلكتروني',
    sortable: true,
    defaultVisible: true,
    minWidth: '200px',
    type: 'text'
  },
  {
    key: 'phone',
    header: 'Phone',
    headerAr: 'الهاتف',
    sortable: false,
    defaultVisible: false,
    minWidth: '140px',
    type: 'text'
  },
  {
    key: 'status',
    header: 'Status',
    headerAr: 'الحالة',
    sortable: true,
    defaultVisible: true,
    width: '120px',
    type: 'status'
  },
  {
    key: 'businessRole',
    header: 'Role',
    headerAr: 'الدور',
    sortable: true,
    defaultVisible: true,
    width: '120px',
    type: 'role'
  },
  {
    key: 'adminRole',
    header: 'Admin Role',
    headerAr: 'دور المسؤول',
    sortable: true,
    defaultVisible: true,
    width: '140px',
    type: 'role'
  },
  {
    key: 'isEmailVerified',
    header: 'Email Verified',
    headerAr: 'البريد موثق',
    sortable: false,
    defaultVisible: false,
    width: '120px',
    type: 'boolean'
  },
  {
    key: 'isPhoneVerified',
    header: 'Phone Verified',
    headerAr: 'الهاتف موثق',
    sortable: false,
    defaultVisible: false,
    width: '120px',
    type: 'boolean'
  },
  {
    key: 'createdAt',
    header: 'Registered',
    headerAr: 'تاريخ التسجيل',
    sortable: true,
    defaultVisible: true,
    width: '140px',
    type: 'date'
  },
  {
    key: 'lastActiveAt',
    header: 'Last Active',
    headerAr: 'آخر نشاط',
    sortable: true,
    defaultVisible: true,
    width: '140px',
    type: 'date'
  },
  {
    key: 'actions',
    header: '',
    headerAr: '',
    sortable: false,
    defaultVisible: true,
    width: '60px',
    type: 'actions',
    sticky: 'end'
  }
];

/**
 * Get Default Visible Columns
 */
export function getDefaultVisibleColumns(): string[] {
  return TABLE_COLUMNS
    .filter(col => col.defaultVisible)
    .map(col => col.key);
}

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

/**
 * Search Settings
 */
export const SEARCH_DEFAULTS = {
  /** Debounce time in milliseconds */
  DEBOUNCE_TIME: 300,

  /** Minimum characters to trigger search */
  MIN_CHARACTERS: 2,

  /** Maximum search query length */
  MAX_LENGTH: 100,

  /** Placeholder text */
  PLACEHOLDER: 'Search users by name, email, or phone...',

  /** Arabic placeholder */
  PLACEHOLDER_AR: 'ابحث عن المستخدمين بالاسم أو البريد أو الهاتف...'
} as const;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Cache Settings
 */
export const CACHE_DEFAULTS = {
  /** Cache TTL in milliseconds (5 minutes) */
  TTL: 5 * 60 * 1000,

  /** Maximum cached users */
  MAX_USERS: 1000,

  /** Whether to use persistent cache */
  PERSISTENT: false
} as const;

// ============================================================================
// DIALOG CONFIGURATION
// ============================================================================

/**
 * Dialog Settings
 */
export const DIALOG_DEFAULTS = {
  /** Default dialog width */
  WIDTH: '500px',

  /** Maximum dialog width */
  MAX_WIDTH: '90vw',

  /** Maximum dialog height */
  MAX_HEIGHT: '90vh',

  /** Whether dialog has backdrop */
  HAS_BACKDROP: true,

  /** Whether clicking backdrop closes dialog */
  CLOSE_ON_BACKDROP_CLICK: false,

  /** Panel class for styling */
  PANEL_CLASS: 'user-management-dialog'
} as const;

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Required Permissions for User Management Features
 */
export const REQUIRED_PERMISSIONS = {
  /** View user list */
  VIEW_USERS: 'manage_users',

  /** Edit user profile */
  EDIT_USERS: 'manage_users',

  /** Ban users */
  BAN_USERS: 'manage_users',

  /** Suspend users */
  SUSPEND_USERS: 'manage_users',

  /** Assign roles */
  ASSIGN_ROLES: 'manage_users',

  /** Reset passwords */
  RESET_PASSWORDS: 'manage_users',

  /** Export users */
  EXPORT_USERS: 'manage_users',

  /** Bulk operations */
  BULK_OPERATIONS: 'manage_users'
} as const;

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Export Settings
 */
export const EXPORT_DEFAULTS = {
  /** CSV delimiter */
  CSV_DELIMITER: ',',

  /** CSV filename prefix */
  CSV_FILENAME_PREFIX: 'users-export',

  /** JSON filename prefix */
  JSON_FILENAME_PREFIX: 'users-export',

  /** Maximum users per export */
  MAX_EXPORT_USERS: 10000,

  /** Fields to include in export */
  EXPORT_FIELDS: [
    'id',
    'email',
    'firstName',
    'lastName',
    'phone',
    'status',
    'businessRole',
    'adminRole',
    'isEmailVerified',
    'isPhoneVerified',
    'createdAt',
    'lastActiveAt'
  ]
} as const;

// ============================================================================
// NOTIFICATION MESSAGES
// ============================================================================

/**
 * Notification Messages
 */
export const MESSAGES = {
  // Success messages
  USER_UPDATED: 'User updated successfully',
  USER_BANNED: 'User banned successfully',
  USER_UNBANNED: 'User unbanned successfully',
  USER_SUSPENDED: 'User suspended successfully',
  USER_UNSUSPENDED: 'User unsuspended successfully',
  ROLES_UPDATED: 'Roles updated successfully',
  PASSWORD_RESET: 'Password reset email sent',
  BULK_BAN_SUCCESS: 'Users banned successfully',
  BULK_ROLE_SUCCESS: 'Roles assigned successfully',
  EXPORT_SUCCESS: 'Export completed successfully',

  // Error messages
  LOAD_USERS_ERROR: 'Failed to load users',
  UPDATE_USER_ERROR: 'Failed to update user',
  BAN_USER_ERROR: 'Failed to ban user',
  SUSPEND_USER_ERROR: 'Failed to suspend user',
  UPDATE_ROLES_ERROR: 'Failed to update roles',
  RESET_PASSWORD_ERROR: 'Failed to reset password',
  EXPORT_ERROR: 'Failed to export users',
  GENERIC_ERROR: 'An error occurred. Please try again.',

  // Confirmation messages
  CONFIRM_BAN: 'Are you sure you want to ban this user?',
  CONFIRM_UNBAN: 'Are you sure you want to unban this user?',
  CONFIRM_SUSPEND: 'Are you sure you want to suspend this user?',
  CONFIRM_BULK_BAN: 'Are you sure you want to ban {count} users?',
  CONFIRM_RESET_PASSWORD: 'This will send a password reset email to the user.'
} as const;

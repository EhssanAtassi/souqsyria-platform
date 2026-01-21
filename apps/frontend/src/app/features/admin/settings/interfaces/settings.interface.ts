/**
 * @file settings.interface.ts
 * @description Interface definitions for the System Configuration module.
 *              Covers system settings, roles, permissions, and audit logging.
 * @module AdminDashboard/Settings
 */

// =============================================================================
// SYSTEM SETTINGS INTERFACES
// =============================================================================

/**
 * General platform settings configuration
 * @description Platform-wide configuration options
 */
export interface GeneralSettings {
  /** Platform name displayed throughout the application */
  platformName: string;

  /** Default currency code (SYP, USD, etc.) */
  defaultCurrency: string;

  /** Supported currencies for transactions */
  supportedCurrencies: string[];

  /** Default language (ar, en) */
  defaultLanguage: string;

  /** Supported languages */
  supportedLanguages: string[];

  /** Timezone for date/time display */
  timezone: string;

  /** Date format preference (dd/MM/yyyy, MM/dd/yyyy, etc.) */
  dateFormat: string;

  /** Whether the platform is in maintenance mode */
  maintenanceMode: boolean;

  /** Maintenance message to display when in maintenance mode */
  maintenanceMessage?: string;

  /** Platform contact email */
  contactEmail: string;

  /** Platform support phone */
  supportPhone: string;
}

/**
 * Commission settings for the platform
 * @description Global and category-specific commission rates
 */
export interface CommissionSettings {
  /** Global default commission rate (percentage) */
  defaultRate: number;

  /** Minimum commission rate allowed */
  minRate: number;

  /** Maximum commission rate allowed */
  maxRate: number;

  /** Category-specific commission rates */
  categoryRates: CategoryCommissionRate[];

  /** Whether to allow vendor-specific rates */
  allowVendorRates: boolean;
}

/**
 * Category-specific commission rate
 * @description Commission rate override for specific categories
 */
export interface CategoryCommissionRate {
  /** Category unique identifier */
  categoryId: string;

  /** Category name */
  categoryName: string;

  /** Commission rate for this category (percentage) */
  rate: number;
}

/**
 * Payment configuration settings
 * @description Payment methods and gateway configurations
 */
export interface PaymentSettings {
  /** Enabled payment methods */
  enabledMethods: PaymentMethod[];

  /** Default payment method for new orders */
  defaultMethod: string;

  /** Whether to allow cash on delivery */
  allowCOD: boolean;

  /** Maximum amount allowed for COD */
  codMaxAmount?: number;

  /** Minimum order amount required */
  minOrderAmount: number;

  /** Whether VAT is enabled */
  vatEnabled: boolean;

  /** VAT rate percentage */
  vatRate: number;
}

/**
 * Payment method configuration
 * @description Individual payment method settings
 */
export interface PaymentMethod {
  /** Payment method identifier */
  id: string;

  /** Display name */
  name: string;

  /** Method type */
  type: 'card' | 'bank_transfer' | 'cod' | 'wallet' | 'mobile_money';

  /** Whether this method is enabled */
  enabled: boolean;

  /** Processing fee percentage */
  processingFee: number;

  /** Gateway configuration (for card payments) */
  gateway?: {
    provider: string;
    apiKey?: string;
    sandbox: boolean;
  };

  /** Icon name for display */
  icon: string;
}

/**
 * Shipping configuration settings
 * @description Shipping zones and delivery options
 */
export interface ShippingSettings {
  /** Available shipping zones */
  zones: ShippingZone[];

  /** Default shipping zone */
  defaultZoneId: string;

  /** Whether free shipping is available */
  freeShippingEnabled: boolean;

  /** Minimum order amount for free shipping */
  freeShippingThreshold?: number;

  /** Whether same-day delivery is available */
  sameDayDeliveryEnabled: boolean;
}

/**
 * Shipping zone configuration
 * @description Geographic shipping zone with rates
 */
export interface ShippingZone {
  /** Zone unique identifier */
  id: string;

  /** Zone name */
  name: string;

  /** Areas/regions included in this zone */
  areas: string[];

  /** Base shipping rate */
  baseRate: number;

  /** Rate per additional item */
  perItemRate: number;

  /** Estimated delivery days (min-max) */
  deliveryDays: {
    min: number;
    max: number;
  };

  /** Whether this zone is active */
  active: boolean;
}

// =============================================================================
// ROLE & PERMISSION INTERFACES
// =============================================================================

/**
 * Admin role definition
 * @description Role with assigned permissions
 */
export interface AdminRole {
  /** Role unique identifier */
  id: string;

  /** Role name */
  name: string;

  /** Role display name */
  displayName: string;

  /** Role description */
  description: string;

  /** Whether this is a system role (cannot be deleted) */
  isSystemRole: boolean;

  /** Permissions assigned to this role */
  permissions: Permission[];

  /** Number of users with this role */
  userCount: number;

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Permission definition
 * @description Individual permission that can be assigned to roles
 */
export interface Permission {
  /** Permission unique identifier */
  id: string;

  /** Permission name (e.g., 'users.read', 'products.create') */
  name: string;

  /** Human-readable description */
  description: string;

  /** Resource this permission applies to */
  resource: string;

  /** Action type */
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';

  /** Permission category for grouping */
  category: string;
}

/**
 * Permission category grouping
 * @description Logical grouping of permissions for UI display
 */
export interface PermissionCategory {
  /** Category identifier */
  id: string;

  /** Category display name */
  name: string;

  /** Category icon */
  icon: string;

  /** Permissions in this category */
  permissions: Permission[];
}

/**
 * Role permission matrix entry
 * @description Mapping of role to permission state
 */
export interface RolePermissionEntry {
  /** Role ID */
  roleId: string;

  /** Permission ID */
  permissionId: string;

  /** Whether permission is granted */
  granted: boolean;
}

// =============================================================================
// AUDIT LOG INTERFACES
// =============================================================================

/**
 * Audit log entry
 * @description Record of administrative actions
 */
export interface AuditLogEntry {
  /** Log entry unique identifier */
  id: string;

  /** Action performed */
  action: AuditAction;

  /** Resource type affected */
  resourceType: string;

  /** Resource identifier */
  resourceId: string;

  /** Admin user who performed the action */
  adminUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  /** Changes made (old vs new values) */
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  /** IP address of the request */
  ipAddress: string;

  /** User agent string */
  userAgent: string;

  /** Timestamp of the action */
  timestamp: string;

  /** Whether the action was successful */
  success: boolean;

  /** Error message if action failed */
  errorMessage?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Audit action types
 * @description Types of actions tracked in audit logs
 */
export type AuditAction =
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.status_change'
  | 'user.role_change'
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'product.approve'
  | 'product.reject'
  | 'order.status_change'
  | 'order.refund'
  | 'vendor.verify'
  | 'vendor.suspend'
  | 'vendor.payout'
  | 'settings.update'
  | 'role.create'
  | 'role.update'
  | 'role.delete'
  | 'permission.update'
  | 'login'
  | 'logout';

/**
 * Audit log filter options
 * @description Filtering criteria for audit log queries
 */
export interface AuditLogFilter {
  /** Filter by action type */
  action?: AuditAction;

  /** Filter by resource type */
  resourceType?: string;

  /** Filter by admin user ID */
  adminUserId?: string;

  /** Filter by date range start */
  startDate?: string;

  /** Filter by date range end */
  endDate?: string;

  /** Filter by success status */
  success?: boolean;

  /** Search term for resource ID or description */
  search?: string;
}

/**
 * Paginated audit log response
 * @description Paginated list of audit log entries
 */
export interface AuditLogResponse {
  /** Audit log entries */
  data: AuditLogEntry[];

  /** Total count of matching entries */
  total: number;

  /** Current page number */
  page: number;

  /** Page size */
  pageSize: number;

  /** Total number of pages */
  totalPages: number;
}

// =============================================================================
// FEATURE FLAGS INTERFACES
// =============================================================================

/**
 * Feature flag definition
 * @description Feature toggle configuration
 */
export interface FeatureFlag {
  /** Flag unique identifier */
  id: string;

  /** Flag key for code reference */
  key: string;

  /** Display name */
  name: string;

  /** Description of the feature */
  description: string;

  /** Whether the feature is enabled */
  enabled: boolean;

  /** Rollout percentage (0-100) */
  rolloutPercentage: number;

  /** Specific user IDs to enable for */
  enabledForUsers?: string[];

  /** Specific roles to enable for */
  enabledForRoles?: string[];

  /** Creation timestamp */
  createdAt: string;

  /** Last update timestamp */
  updatedAt: string;
}

// =============================================================================
// SETTINGS API RESPONSE INTERFACES
// =============================================================================

/**
 * Complete settings response
 * @description All settings bundled together
 */
export interface AllSettingsResponse {
  general: GeneralSettings;
  commission: CommissionSettings;
  payment: PaymentSettings;
  shipping: ShippingSettings;
}

/**
 * Settings update request
 * @description Partial settings update payload
 */
export interface SettingsUpdateRequest {
  general?: Partial<GeneralSettings>;
  commission?: Partial<CommissionSettings>;
  payment?: Partial<PaymentSettings>;
  shipping?: Partial<ShippingSettings>;
}

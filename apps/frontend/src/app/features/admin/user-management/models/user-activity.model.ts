/**
 * User Management - Activity Model Interfaces
 *
 * @description
 * Defines TypeScript interfaces for user activity tracking and audit logs.
 * Activity records are displayed in the user detail panel's Activity tab.
 *
 * @module UserManagement/Models
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     ActivityType:
 *       type: string
 *       description: Type of user activity event
 */

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

/**
 * Activity Type Enum
 *
 * @description
 * Categorizes different types of user activities for filtering and display.
 *
 * Categories:
 * - Authentication: login, logout, password_change, password_reset, two_factor_enabled/disabled
 * - Profile: profile_update, avatar_change, email_change, phone_change
 * - Orders: order_placed, order_cancelled, order_completed
 * - Products: product_listed, product_updated, product_deleted (sellers)
 * - Reviews: review_posted, review_updated, review_deleted
 * - Admin: role_changed, account_status_changed, verification_completed
 *
 * @swagger
 * components:
 *   schemas:
 *     ActivityType:
 *       type: string
 *       enum:
 *         - login
 *         - logout
 *         - login_failed
 *         - password_change
 *         - password_reset
 *         - two_factor_enabled
 *         - two_factor_disabled
 *         - profile_update
 *         - avatar_change
 *         - email_change
 *         - phone_change
 *         - order_placed
 *         - order_cancelled
 *         - order_completed
 *         - product_listed
 *         - product_updated
 *         - product_deleted
 *         - review_posted
 *         - review_updated
 *         - review_deleted
 *         - role_changed
 *         - account_status_changed
 *         - verification_completed
 *         - support_ticket
 *         - account_created
 *         - account_deleted
 *       description: Type of user activity event
 */
export type ActivityType =
  // Authentication events
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_change'
  | 'password_reset'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  // Profile events
  | 'profile_update'
  | 'avatar_change'
  | 'email_change'
  | 'phone_change'
  // Order events
  | 'order_placed'
  | 'order_cancelled'
  | 'order_completed'
  // Product events (sellers)
  | 'product_listed'
  | 'product_updated'
  | 'product_deleted'
  // Review events
  | 'review_posted'
  | 'review_updated'
  | 'review_deleted'
  // Admin-triggered events
  | 'role_changed'
  | 'account_status_changed'
  | 'verification_completed'
  // Support events
  | 'support_ticket'
  // Account lifecycle
  | 'account_created'
  | 'account_deleted';

/**
 * Activity Category
 *
 * @description
 * Grouping of activity types for filtering.
 */
export type ActivityCategory =
  | 'authentication'
  | 'profile'
  | 'orders'
  | 'products'
  | 'reviews'
  | 'admin'
  | 'support'
  | 'account';

// ============================================================================
// ACTIVITY INTERFACE
// ============================================================================

/**
 * User Activity Interface
 *
 * @description
 * Represents a single activity/audit log entry for a user.
 * Used in the Activity tab of the user detail panel.
 *
 * @example
 * ```typescript
 * const activity: UserActivity = {
 *   id: 1001,
 *   userId: 123,
 *   type: 'login',
 *   category: 'authentication',
 *   description: 'User logged in successfully',
 *   timestamp: new Date('2024-06-20T10:30:00Z'),
 *   ipAddress: '192.168.1.100',
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
 *   location: {
 *     city: 'Damascus',
 *     country: 'Syria',
 *     countryCode: 'SY'
 *   },
 *   metadata: {
 *     method: 'email',
 *     sessionId: 'sess_abc123'
 *   }
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     UserActivity:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - type
 *         - description
 *         - timestamp
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique activity record ID
 *           example: 1001
 *         userId:
 *           type: integer
 *           description: User ID who performed the activity
 *           example: 123
 *         type:
 *           $ref: '#/components/schemas/ActivityType'
 *         category:
 *           type: string
 *           description: Activity category for grouping
 *           example: 'authentication'
 *         description:
 *           type: string
 *           description: Human-readable activity description
 *           example: 'User logged in successfully'
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the activity occurred
 *         ipAddress:
 *           type: string
 *           nullable: true
 *           description: IP address of the request
 *           example: '192.168.1.100'
 *         userAgent:
 *           type: string
 *           nullable: true
 *           description: Browser/client user agent string
 *         location:
 *           $ref: '#/components/schemas/GeoLocation'
 *         metadata:
 *           type: object
 *           description: Additional context-specific data
 *         performedBy:
 *           type: integer
 *           nullable: true
 *           description: Admin ID if action was performed by admin
 *         performedByName:
 *           type: string
 *           nullable: true
 *           description: Admin name if action was performed by admin
 */
export interface UserActivity {
  /** Unique activity record identifier */
  id: number;

  /** User ID who performed or is subject of the activity */
  userId: number;

  /** Type of activity */
  type: ActivityType;

  /** Activity category for grouping/filtering */
  category?: ActivityCategory;

  /** Human-readable description of the activity */
  description: string;

  /** When the activity occurred */
  timestamp: Date;

  /** IP address of the request (if applicable) */
  ipAddress?: string;

  /** Browser/client user agent string */
  userAgent?: string;

  /** Geolocation data (if available) */
  location?: GeoLocation;

  /** Additional context-specific metadata */
  metadata?: ActivityMetadata;

  /** Admin ID if this action was performed by an admin (not the user) */
  performedBy?: number;

  /** Admin name (denormalized for display) */
  performedByName?: string;
}

/**
 * Geo Location Interface
 *
 * @description
 * Geographic location data derived from IP address.
 *
 * @swagger
 * components:
 *   schemas:
 *     GeoLocation:
 *       type: object
 *       properties:
 *         city:
 *           type: string
 *           description: City name
 *           example: 'Damascus'
 *         region:
 *           type: string
 *           description: State/province/region
 *           example: 'Damascus Governorate'
 *         country:
 *           type: string
 *           description: Country name
 *           example: 'Syria'
 *         countryCode:
 *           type: string
 *           description: ISO 3166-1 alpha-2 country code
 *           example: 'SY'
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitude coordinate
 */
export interface GeoLocation {
  /** City name */
  city?: string;

  /** State/province/region */
  region?: string;

  /** Country name */
  country?: string;

  /** ISO 3166-1 alpha-2 country code */
  countryCode?: string;

  /** Latitude coordinate */
  latitude?: number;

  /** Longitude coordinate */
  longitude?: number;
}

/**
 * Activity Metadata Interface
 *
 * @description
 * Flexible metadata object for storing activity-specific details.
 * Structure varies based on activity type.
 *
 * @swagger
 * components:
 *   schemas:
 *     ActivityMetadata:
 *       type: object
 *       additionalProperties: true
 *       description: Activity-specific metadata
 */
export interface ActivityMetadata {
  /** Login method (for login activities) */
  method?: 'email' | 'phone' | 'oauth' | 'two_factor';

  /** Session ID */
  sessionId?: string;

  /** Order ID (for order activities) */
  orderId?: number;

  /** Product ID (for product activities) */
  productId?: number;

  /** Review ID (for review activities) */
  reviewId?: number;

  /** Previous value (for change events) */
  previousValue?: any;

  /** New value (for change events) */
  newValue?: any;

  /** Changed fields list (for update events) */
  changedFields?: string[];

  /** Reason (for admin actions like ban/suspend) */
  reason?: string;

  /** Any additional key-value pairs */
  [key: string]: any;
}

// ============================================================================
// ACTIVITY TYPE CONFIGURATION
// ============================================================================

/**
 * Activity Type Configuration
 *
 * @description
 * Display configuration for each activity type.
 * Used for icons, colors, and labels in the UI.
 */
export interface ActivityTypeConfig {
  /** Activity type */
  type: ActivityType;

  /** Display label */
  label: string;

  /** Material icon name */
  icon: string;

  /** Icon color (CSS color or Material palette) */
  color: string;

  /** Activity category */
  category: ActivityCategory;

  /** Whether this is a security-relevant event */
  securityRelevant: boolean;
}

/**
 * Activity Type Configurations
 *
 * @description
 * Complete configuration map for all activity types.
 */
export const ACTIVITY_TYPE_CONFIGS: Record<ActivityType, ActivityTypeConfig> = {
  // Authentication events
  login: {
    type: 'login',
    label: 'Login',
    icon: 'login',
    color: '#4caf50',
    category: 'authentication',
    securityRelevant: true
  },
  logout: {
    type: 'logout',
    label: 'Logout',
    icon: 'logout',
    color: '#9e9e9e',
    category: 'authentication',
    securityRelevant: false
  },
  login_failed: {
    type: 'login_failed',
    label: 'Failed Login',
    icon: 'error_outline',
    color: '#f44336',
    category: 'authentication',
    securityRelevant: true
  },
  password_change: {
    type: 'password_change',
    label: 'Password Changed',
    icon: 'lock_reset',
    color: '#ff9800',
    category: 'authentication',
    securityRelevant: true
  },
  password_reset: {
    type: 'password_reset',
    label: 'Password Reset',
    icon: 'lock_open',
    color: '#ff9800',
    category: 'authentication',
    securityRelevant: true
  },
  two_factor_enabled: {
    type: 'two_factor_enabled',
    label: '2FA Enabled',
    icon: 'security',
    color: '#4caf50',
    category: 'authentication',
    securityRelevant: true
  },
  two_factor_disabled: {
    type: 'two_factor_disabled',
    label: '2FA Disabled',
    icon: 'no_encryption',
    color: '#f44336',
    category: 'authentication',
    securityRelevant: true
  },

  // Profile events
  profile_update: {
    type: 'profile_update',
    label: 'Profile Updated',
    icon: 'edit',
    color: '#2196f3',
    category: 'profile',
    securityRelevant: false
  },
  avatar_change: {
    type: 'avatar_change',
    label: 'Avatar Changed',
    icon: 'face',
    color: '#2196f3',
    category: 'profile',
    securityRelevant: false
  },
  email_change: {
    type: 'email_change',
    label: 'Email Changed',
    icon: 'email',
    color: '#ff9800',
    category: 'profile',
    securityRelevant: true
  },
  phone_change: {
    type: 'phone_change',
    label: 'Phone Changed',
    icon: 'phone',
    color: '#ff9800',
    category: 'profile',
    securityRelevant: true
  },

  // Order events
  order_placed: {
    type: 'order_placed',
    label: 'Order Placed',
    icon: 'shopping_cart',
    color: '#4caf50',
    category: 'orders',
    securityRelevant: false
  },
  order_cancelled: {
    type: 'order_cancelled',
    label: 'Order Cancelled',
    icon: 'cancel',
    color: '#f44336',
    category: 'orders',
    securityRelevant: false
  },
  order_completed: {
    type: 'order_completed',
    label: 'Order Completed',
    icon: 'check_circle',
    color: '#4caf50',
    category: 'orders',
    securityRelevant: false
  },

  // Product events
  product_listed: {
    type: 'product_listed',
    label: 'Product Listed',
    icon: 'add_box',
    color: '#4caf50',
    category: 'products',
    securityRelevant: false
  },
  product_updated: {
    type: 'product_updated',
    label: 'Product Updated',
    icon: 'edit',
    color: '#2196f3',
    category: 'products',
    securityRelevant: false
  },
  product_deleted: {
    type: 'product_deleted',
    label: 'Product Deleted',
    icon: 'delete',
    color: '#f44336',
    category: 'products',
    securityRelevant: false
  },

  // Review events
  review_posted: {
    type: 'review_posted',
    label: 'Review Posted',
    icon: 'rate_review',
    color: '#4caf50',
    category: 'reviews',
    securityRelevant: false
  },
  review_updated: {
    type: 'review_updated',
    label: 'Review Updated',
    icon: 'edit',
    color: '#2196f3',
    category: 'reviews',
    securityRelevant: false
  },
  review_deleted: {
    type: 'review_deleted',
    label: 'Review Deleted',
    icon: 'delete',
    color: '#f44336',
    category: 'reviews',
    securityRelevant: false
  },

  // Admin events
  role_changed: {
    type: 'role_changed',
    label: 'Role Changed',
    icon: 'admin_panel_settings',
    color: '#9c27b0',
    category: 'admin',
    securityRelevant: true
  },
  account_status_changed: {
    type: 'account_status_changed',
    label: 'Status Changed',
    icon: 'verified_user',
    color: '#9c27b0',
    category: 'admin',
    securityRelevant: true
  },
  verification_completed: {
    type: 'verification_completed',
    label: 'Verification Completed',
    icon: 'verified',
    color: '#4caf50',
    category: 'admin',
    securityRelevant: false
  },

  // Support events
  support_ticket: {
    type: 'support_ticket',
    label: 'Support Ticket',
    icon: 'support_agent',
    color: '#ff9800',
    category: 'support',
    securityRelevant: false
  },

  // Account lifecycle
  account_created: {
    type: 'account_created',
    label: 'Account Created',
    icon: 'person_add',
    color: '#4caf50',
    category: 'account',
    securityRelevant: false
  },
  account_deleted: {
    type: 'account_deleted',
    label: 'Account Deleted',
    icon: 'person_remove',
    color: '#f44336',
    category: 'account',
    securityRelevant: true
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Activity Config
 *
 * @description
 * Retrieve display configuration for an activity type.
 *
 * @param type - Activity type
 * @returns Activity configuration or undefined
 */
export function getActivityConfig(type: ActivityType): ActivityTypeConfig | undefined {
  return ACTIVITY_TYPE_CONFIGS[type];
}

/**
 * Get Activity Category
 *
 * @description
 * Get the category for an activity type.
 *
 * @param type - Activity type
 * @returns Category or 'other' if not found
 */
export function getActivityCategory(type: ActivityType): ActivityCategory {
  return ACTIVITY_TYPE_CONFIGS[type]?.category || 'account';
}

/**
 * Is Security Relevant
 *
 * @description
 * Check if an activity type is security-relevant.
 * Security-relevant activities may warrant additional attention.
 *
 * @param type - Activity type
 * @returns True if security relevant
 */
export function isSecurityRelevant(type: ActivityType): boolean {
  return ACTIVITY_TYPE_CONFIGS[type]?.securityRelevant ?? false;
}

/**
 * Filter Activities By Category
 *
 * @description
 * Filter activity list by category.
 *
 * @param activities - Activity array
 * @param category - Category to filter by
 * @returns Filtered activities
 */
export function filterActivitiesByCategory(
  activities: UserActivity[],
  category: ActivityCategory
): UserActivity[] {
  return activities.filter(activity =>
    getActivityCategory(activity.type) === category
  );
}

/**
 * Get Security Events
 *
 * @description
 * Filter activities to only security-relevant events.
 *
 * @param activities - Activity array
 * @returns Security-relevant activities
 */
export function getSecurityEvents(activities: UserActivity[]): UserActivity[] {
  return activities.filter(activity => isSecurityRelevant(activity.type));
}

/**
 * User Management - User Model Interfaces
 *
 * @description
 * Defines TypeScript interfaces for user entities in the admin user management dashboard.
 * These interfaces represent the complete user data structure returned from the backend API.
 *
 * @module UserManagement/Models
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     UserStatus:
 *       type: string
 *       enum: [active, inactive, suspended, banned, pending]
 *       description: Account status states
 *       example: 'active'
 *
 *     BusinessRole:
 *       type: string
 *       enum: [customer, seller, admin]
 *       description: Primary business role
 *       example: 'seller'
 *
 *     AdminRole:
 *       type: string
 *       nullable: true
 *       enum: [super_admin, admin, moderator, customer_service, vendor_manager, null]
 *       description: Assigned administrative role
 *       example: 'moderator'
 */

// ============================================================================
// ENUMS & TYPE ALIASES
// ============================================================================

/**
 * User Account Status
 *
 * @description
 * Represents the current state of a user account.
 *
 * Status Definitions:
 * - `active`: Normal, fully functional account
 * - `inactive`: Account created but not yet activated (email not verified)
 * - `suspended`: Temporarily restricted (auto-lifts after suspension period)
 * - `banned`: Permanently restricted (requires admin intervention to lift)
 * - `pending`: Awaiting approval (for seller accounts)
 *
 * @swagger
 * components:
 *   schemas:
 *     UserStatus:
 *       type: string
 *       enum: [active, inactive, suspended, banned, pending]
 *       description: |
 *         Account status:
 *         - active: Fully functional account
 *         - inactive: Not yet activated
 *         - suspended: Temporarily restricted
 *         - banned: Permanently restricted
 *         - pending: Awaiting approval
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned' | 'pending';

/**
 * UserStatus Enum
 *
 * @description
 * Enum for UserStatus values for use in code (e.g., comparisons).
 * Use as: UserStatus.ACTIVE, UserStatus.BANNED, etc.
 *
 * @example
 * ```typescript
 * if (user.status === UserStatus.BANNED) {
 *   // Handle banned user
 * }
 * ```
 */
export const UserStatus = {
  ACTIVE: 'active' as UserStatus,
  INACTIVE: 'inactive' as UserStatus,
  SUSPENDED: 'suspended' as UserStatus,
  BANNED: 'banned' as UserStatus,
  PENDING: 'pending' as UserStatus
} as const;

/**
 * Business Role Type
 *
 * @description
 * Primary role determining user capabilities in the marketplace.
 *
 * Role Capabilities:
 * - `customer`: Can browse, purchase, leave reviews
 * - `seller`: All customer capabilities + list products, manage inventory
 * - `admin`: Full system access (legacy, prefer adminRole for admin users)
 *
 * @swagger
 * components:
 *   schemas:
 *     BusinessRole:
 *       type: string
 *       enum: [customer, seller, admin]
 *       description: Primary marketplace role
 *       example: 'seller'
 */
export type BusinessRole = 'customer' | 'seller' | 'admin';

/**
 * Admin Role Type
 *
 * @description
 * Secondary role for users with administrative access.
 * Assigned in addition to businessRole for elevated privileges.
 *
 * Role Hierarchy (high to low):
 * 1. `super_admin`: Full system access, can manage other admins
 * 2. `admin`: Full content management, cannot manage super_admins
 * 3. `moderator`: Content review, user communication
 * 4. `vendor_manager`: Vendor approval and management
 * 5. `customer_service`: Order and user support
 *
 * @swagger
 * components:
 *   schemas:
 *     AdminRole:
 *       type: string
 *       nullable: true
 *       enum: [super_admin, admin, moderator, customer_service, vendor_manager, null]
 *       description: Administrative role (null if no admin access)
 */
export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'customer_service'
  | 'vendor_manager'
  | null;

// ============================================================================
// MAIN USER INTERFACE
// ============================================================================

/**
 * Managed User Interface
 *
 * @description
 * Complete user entity for admin management dashboard.
 * Contains all user data needed for listing, filtering, and management operations.
 *
 * This interface represents the user as seen by administrators, including
 * sensitive information like ban/suspension details not visible to regular users.
 *
 * @example
 * ```typescript
 * const user: ManagedUser = {
 *   id: 1,
 *   email: 'seller@souqsyria.com',
 *   firstName: 'Ahmad',
 *   lastName: 'Al-Hassan',
 *   phone: '+963-11-555-1234',
 *   avatarUrl: 'https://cdn.souqsyria.com/avatars/1.jpg',
 *   status: 'active',
 *   businessRole: 'seller',
 *   adminRole: null,
 *   isEmailVerified: true,
 *   isPhoneVerified: true,
 *   twoFactorEnabled: false,
 *   createdAt: new Date('2024-01-15'),
 *   updatedAt: new Date('2024-06-20'),
 *   lastLoginAt: new Date('2024-06-20'),
 *   lastActiveAt: new Date('2024-06-20'),
 *   stats: {
 *     totalOrders: 0,
 *     totalSpent: 0,
 *     totalProducts: 45,
 *     averageRating: 4.8,
 *     loginCount: 234
 *   }
 * };
 * ```
 *
 * @swagger
 * components:
 *   schemas:
 *     ManagedUser:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - firstName
 *         - lastName
 *         - status
 *         - businessRole
 *         - isEmailVerified
 *         - isPhoneVerified
 *         - twoFactorEnabled
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique user identifier
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: 'seller@souqsyria.com'
 *         firstName:
 *           type: string
 *           description: User first name
 *           example: 'Ahmad'
 *         lastName:
 *           type: string
 *           description: User last name
 *           example: 'Al-Hassan'
 *         fullName:
 *           type: string
 *           description: Computed full name (firstName + lastName)
 *           example: 'Ahmad Al-Hassan'
 *         phone:
 *           type: string
 *           nullable: true
 *           description: Phone number with country code
 *           example: '+963-11-555-1234'
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *           format: uri
 *           description: Profile avatar URL
 *           example: 'https://cdn.souqsyria.com/avatars/1.jpg'
 *         status:
 *           $ref: '#/components/schemas/UserStatus'
 *         businessRole:
 *           $ref: '#/components/schemas/BusinessRole'
 *         adminRole:
 *           $ref: '#/components/schemas/AdminRole'
 *         isEmailVerified:
 *           type: boolean
 *           description: Email verification status
 *           example: true
 *         isPhoneVerified:
 *           type: boolean
 *           description: Phone verification status
 *           example: true
 *         twoFactorEnabled:
 *           type: boolean
 *           description: Two-factor authentication enabled
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last profile update timestamp
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Last login timestamp
 *         lastActiveAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Last activity timestamp
 *         banInfo:
 *           $ref: '#/components/schemas/BanInfo'
 *         suspensionInfo:
 *           $ref: '#/components/schemas/SuspensionInfo'
 *         stats:
 *           $ref: '#/components/schemas/UserStats'
 */
export interface ManagedUser {
  /** Unique user identifier */
  id: number;

  /** User email address (unique, used for login) */
  email: string;

  /** User first name */
  firstName: string;

  /** User last name */
  lastName: string;

  /** Full name (computed: firstName + lastName) */
  fullName?: string;

  /** Phone number with country code (e.g., +963-11-555-1234) */
  phone?: string;

  /** Profile avatar URL */
  avatarUrl?: string;

  /** Current account status */
  status: UserStatus;

  /** Primary business role in marketplace */
  businessRole: BusinessRole;

  /** Legacy role field (for backwards compatibility) */
  role?: BusinessRole | string;

  /** Assigned administrative role (null if no admin access) */
  adminRole?: AdminRole | null;

  /** Admin role ID (for API compatibility) */
  adminRoleId?: number | null;

  /** Whether email address is verified */
  isEmailVerified: boolean;

  /** Whether phone number is verified */
  isPhoneVerified: boolean;

  /** Whether two-factor authentication is enabled */
  twoFactorEnabled: boolean;

  /** Account creation timestamp */
  createdAt: Date;

  /** Last profile update timestamp */
  updatedAt: Date;

  /** Last successful login timestamp */
  lastLoginAt?: Date;

  /** Last activity timestamp (any authenticated action) */
  lastActiveAt?: Date;

  /** Ban information (only present if status === 'banned') */
  banInfo?: BanInfo;

  /** Suspension information (only present if status === 'suspended') */
  suspensionInfo?: SuspensionInfo;

  /** User statistics and metrics */
  stats?: UserStats;
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

/**
 * Ban Information Interface
 *
 * @description
 * Contains details about a user's ban status.
 * Only populated when user status is 'banned'.
 *
 * @swagger
 * components:
 *   schemas:
 *     BanInfo:
 *       type: object
 *       required:
 *         - reason
 *         - bannedBy
 *         - bannedAt
 *         - permanent
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for the ban (shown to user)
 *           example: 'Repeated policy violations'
 *         bannedBy:
 *           type: integer
 *           description: Admin user ID who issued the ban
 *           example: 1
 *         bannedByName:
 *           type: string
 *           description: Admin name who issued the ban
 *           example: 'System Admin'
 *         bannedAt:
 *           type: string
 *           format: date-time
 *           description: When the ban was issued
 *         permanent:
 *           type: boolean
 *           description: Whether ban is permanent (true) or temporary (false)
 *           example: true
 *         internalNotes:
 *           type: string
 *           nullable: true
 *           description: Internal notes (admin-only, not shown to user)
 */
export interface BanInfo {
  /** Public reason for the ban (shown to user) */
  reason: string;

  /** Admin user ID who issued the ban */
  bannedBy: number;

  /** Admin name who issued the ban (denormalized for display) */
  bannedByName?: string;

  /** Timestamp when ban was issued */
  bannedAt: Date;

  /** Whether ban is permanent */
  permanent: boolean;

  /** Internal notes visible only to admins */
  internalNotes?: string;
}

/**
 * Suspension Information Interface
 *
 * @description
 * Contains details about a user's temporary suspension.
 * Only populated when user status is 'suspended'.
 * Suspension automatically lifts when suspendedUntil is reached.
 *
 * @swagger
 * components:
 *   schemas:
 *     SuspensionInfo:
 *       type: object
 *       required:
 *         - reason
 *         - suspendedBy
 *         - suspendedAt
 *         - suspendedUntil
 *       properties:
 *         reason:
 *           type: string
 *           description: Reason for suspension (shown to user)
 *           example: 'Suspicious activity detected'
 *         suspendedBy:
 *           type: integer
 *           description: Admin user ID who issued suspension
 *           example: 1
 *         suspendedByName:
 *           type: string
 *           description: Admin name who issued suspension
 *           example: 'System Admin'
 *         suspendedAt:
 *           type: string
 *           format: date-time
 *           description: When suspension started
 *         suspendedUntil:
 *           type: string
 *           format: date-time
 *           description: When suspension will automatically lift
 *         internalNotes:
 *           type: string
 *           nullable: true
 *           description: Internal notes (admin-only)
 */
export interface SuspensionInfo {
  /** Public reason for suspension (shown to user) */
  reason: string;

  /** Admin user ID who issued suspension */
  suspendedBy: number;

  /** Admin name who issued suspension (denormalized for display) */
  suspendedByName?: string;

  /** Timestamp when suspension started */
  suspendedAt: Date;

  /** Timestamp when suspension will automatically lift */
  suspendedUntil: Date;

  /** Internal notes visible only to admins */
  internalNotes?: string;
}

/**
 * User Statistics Interface
 *
 * @description
 * Aggregated metrics and statistics for user activity.
 * Different fields are relevant for different user roles.
 *
 * @swagger
 * components:
 *   schemas:
 *     UserStats:
 *       type: object
 *       properties:
 *         totalOrders:
 *           type: integer
 *           description: Total orders placed (customers) or received (sellers)
 *           example: 156
 *         totalSpent:
 *           type: number
 *           format: float
 *           description: Total amount spent (in SYP)
 *           example: 2500000
 *         totalProducts:
 *           type: integer
 *           nullable: true
 *           description: Total products listed (sellers only)
 *           example: 45
 *         averageRating:
 *           type: number
 *           format: float
 *           nullable: true
 *           description: Average seller rating (sellers only, 1-5)
 *           example: 4.8
 *         loginCount:
 *           type: integer
 *           description: Total number of logins
 *           example: 234
 *         reviewsGiven:
 *           type: integer
 *           nullable: true
 *           description: Total reviews written (customers)
 *           example: 12
 *         reviewsReceived:
 *           type: integer
 *           nullable: true
 *           description: Total reviews received (sellers)
 *           example: 89
 */
export interface UserStats {
  /** Total orders placed (for customers) or received (for sellers) */
  totalOrders: number;

  /** Total amount spent in SYP (for customers) */
  totalSpent: number;

  /** Total products listed (for sellers only) */
  totalProducts?: number;

  /** Average seller rating 1-5 (for sellers only) */
  averageRating?: number;

  /** Total successful login count */
  loginCount: number;

  /** Total reviews written by user (customers) */
  reviewsGiven?: number;

  /** Total reviews received (sellers) */
  reviewsReceived?: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * User Table Row Type
 *
 * @description
 * Subset of ManagedUser fields needed for table display.
 * Used for optimized table rendering.
 */
export type UserTableRow = Pick<
  ManagedUser,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'avatarUrl'
  | 'status'
  | 'businessRole'
  | 'adminRole'
  | 'isEmailVerified'
  | 'isPhoneVerified'
  | 'createdAt'
  | 'lastActiveAt'
>;

/**
 * User Summary Type
 *
 * @description
 * Minimal user info for dropdowns, autocomplete, etc.
 */
export type UserSummary = Pick<ManagedUser, 'id' | 'email' | 'firstName' | 'lastName' | 'avatarUrl'>;

/**
 * Partial User Update Type
 *
 * @description
 * Fields that can be updated via the admin panel.
 * Excludes computed and system-managed fields.
 */
export type UserUpdatePayload = Partial<
  Pick<
    ManagedUser,
    | 'firstName'
    | 'lastName'
    | 'phone'
    | 'avatarUrl'
    | 'businessRole'
    | 'adminRole'
    | 'twoFactorEnabled'
  >
>;

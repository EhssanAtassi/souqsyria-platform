/**
 * @fileoverview User profile data models for account management
 * @description Interfaces matching backend API responses for user profile operations
 */

/**
 * @description User profile data model matching backend GET /users/profile response
 * @interface UserProfile
 */
export interface UserProfile {
  /** Unique user identifier */
  id: number;

  /** User email address (optional) */
  email?: string;

  /** User phone number (optional) */
  phone?: string;

  /** User full name (optional) */
  fullName?: string;

  /** User avatar URL or base64 data URL (optional) */
  avatar?: string;

  /** Whether the user account is verified */
  isVerified: boolean;

  /** User role information */
  role: {
    /** Role identifier */
    id: number;
    /** Role name */
    name: string;
  };

  /** Total number of orders placed by user */
  ordersCount: number;

  /** Total number of items in user's wishlist */
  wishlistCount: number;

  /** Account creation timestamp */
  createdAt: string;

  /** Last profile update timestamp */
  updatedAt: string;
}

/**
 * @description Request body for PATCH /users/profile
 * @interface UpdateProfileRequest
 */
export interface UpdateProfileRequest {
  /** Updated full name (optional) */
  fullName?: string;

  /** Updated phone number (optional) */
  phone?: string;

  /** Updated avatar - base64 data URL, URL string, or null to remove (optional) */
  avatar?: string | null;
}

/**
 * @description Request body for POST /users/change-password
 * @interface ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  /** Current password for verification */
  currentPassword: string;

  /** New password to set */
  newPassword: string;

  /** Confirmation of new password (must match newPassword) */
  confirmPassword: string;
}

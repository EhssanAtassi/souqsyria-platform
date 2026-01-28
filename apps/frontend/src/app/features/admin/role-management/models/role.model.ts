/**
 * Role Management - Role Model Interfaces
 *
 * @description
 * Defines TypeScript interfaces for role entities in the admin role management dashboard.
 * These interfaces represent the complete role data structure returned from the backend API.
 *
 * @module RoleManagement/Models
 * @version 1.0.0
 *
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - description
 *         - isActive
 *         - isSystem
 *         - priority
 *         - createdAt
 *         - updatedAt
 */

// ============================================================================
// MAIN ROLE INTERFACE
// ============================================================================

/**
 * Role Entity Interface
 *
 * @description
 * Complete role entity for admin management dashboard.
 */
export interface Role {
  id: number;
  name: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  priority: number;
  permissionIds: number[];
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  createdByName?: string;
  lastModifiedBy?: number;
  lastModifiedByName?: string;
  color?: string;
  icon?: string;
}

// ============================================================================
// ROLE DTOs
// ============================================================================

export interface CreateRoleDto {
  name: string;
  displayName: string;
  description: string;
  priority: number;
  permissionIds?: number[];
  isActive?: boolean;
  color?: string;
  icon?: string;
}

/**
 * Update Role DTO Interface
 *
 * @description
 * Data transfer object for updating an existing role.
 * All fields are optional - only provide fields to update.
 *
 * @swagger
 * components:
 *   schemas:
 *     UpdateRoleDto:
 *       type: object
 *       properties:
 *         displayName:
 *           type: string
 *           description: Human-readable role name
 *           minLength: 3
 *           maxLength: 50
 *         description:
 *           type: string
 *           description: Role description
 *           maxLength: 500
 *         priority:
 *           type: integer
 *           description: Priority level (1-100)
 *           minimum: 1
 *           maximum: 100
 *         isActive:
 *           type: boolean
 *           description: Whether role is active
 *         permissionIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of permission IDs to assign to role
 *         color:
 *           type: string
 *           description: UI color for role badge
 *         icon:
 *           type: string
 *           description: Icon name for role badge
 */
export interface UpdateRoleDto {
  displayName?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  permissionIds?: number[];
  color?: string;
  icon?: string;
}

export interface CloneRoleDto {
  newName: string;
  newDisplayName?: string;
  newDescription?: string;
}

export interface AssignPermissionsDto {
  permissionIds: number[];
}

export interface UpdatePriorityDto {
  priority: number;
}

/**
 * Query Roles DTO Interface
 *
 * @description
 * Query parameters for fetching roles with pagination and filters.
 * All fields are optional. Use null to explicitly exclude a filter.
 *
 * @swagger
 * components:
 *   schemas:
 *     QueryRolesDto:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Page number (1-based)
 *           default: 1
 *         limit:
 *           type: integer
 *           description: Items per page
 *           default: 25
 *         search:
 *           type: string
 *           nullable: true
 *           description: Search query for name/displayName/description
 *         isActive:
 *           type: boolean
 *           nullable: true
 *           description: Filter by active status
 *         isSystem:
 *           type: boolean
 *           nullable: true
 *           description: Filter by system role status
 *         minPriority:
 *           type: integer
 *           nullable: true
 *           description: Minimum priority level
 *         maxPriority:
 *           type: integer
 *           nullable: true
 *           description: Maximum priority level
 *         sortBy:
 *           type: string
 *           enum: [name, displayName, priority, userCount, createdAt, updatedAt]
 *           description: Sort field
 *         sortOrder:
 *           type: string
 *           enum: [ASC, DESC]
 *           description: Sort direction
 */
export interface QueryRolesDto {
  page?: number;
  limit?: number;
  search?: string | null;
  isActive?: boolean | null;
  isSystem?: boolean | null;
  minPriority?: number | null;
  maxPriority?: number | null;
  sortBy?: 'name' | 'displayName' | 'priority' | 'userCount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type RoleSummary = Pick<Role, 'id' | 'name' | 'displayName' | 'color' | 'icon'>;

export interface RoleWithUsers extends Role {
  users: Array<{
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }>;
}

/**
 * Role Management - Role Template Model
 *
 * @description
 * Defines interfaces for pre-configured role templates.
 *
 * @module RoleManagement/Models
 * @version 1.0.0
 */

// ============================================================================
// ROLE TEMPLATE INTERFACE
// ============================================================================

/**
 * Role Template Interface
 *
 * @description
 * Pre-configured role template with suggested permissions.
 * Used for quick role creation from common patterns.
 *
 * @example
 * ```typescript
 * const template: RoleTemplate = {
 *   id: 'moderator',
 *   name: 'Content Moderator',
 *   description: 'Reviews and moderates user-generated content',
 *   suggestedPermissions: ['view_users', 'manage_content', 'view_reports'],
 *   priority: 50,
 *   category: 'content_management',
 *   icon: 'gavel',
 *   color: '#FF9800'
 * };
 * ```
 */
export interface RoleTemplate {
  /** Template identifier */
  id: string;

  /** Template display name */
  name: string;

  /** Template description */
  description: string;

  /** Suggested permission names */
  suggestedPermissions: string[];

  /** Suggested priority level */
  priority: number;

  /** Template category */
  category: string;

  /** Icon for UI */
  icon: string;

  /** Color for UI */
  color: string;

  /** Whether this is a common template */
  isCommon?: boolean;
}

// ============================================================================
// TEMPLATE CATEGORIES
// ============================================================================

/**
 * Template Category
 *
 * @description
 * Category for grouping role templates.
 */
export type TemplateCategory =
  | 'administration'
  | 'content_management'
  | 'customer_service'
  | 'vendor_management'
  | 'operations'
  | 'analytics'
  | 'security'
  | 'custom';

// ============================================================================
// TEMPLATE RESPONSE
// ============================================================================

/**
 * Role Templates Response
 *
 * @description
 * Response from GET /api/admin/roles/templates endpoint.
 *
 * @swagger
 * components:
 *   schemas:
 *     RoleTemplatesResponse:
 *       type: object
 *       required:
 *         - templates
 *       properties:
 *         templates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RoleTemplate'
 */
export interface RoleTemplatesResponse {
  /** Array of available templates */
  templates: RoleTemplate[];

  /** Total template count */
  totalCount?: number;
}

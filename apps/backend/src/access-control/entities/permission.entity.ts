/**
 * @file permission.entity.ts
 * @description Entity representing available permissions in the system with enhanced categorization support.
 * 
 * This entity includes fields for:
 * - Basic permission identification (id, name, description)
 * - Resource-based categorization for UI grouping
 * - Action-based categorization for filtering (view, create, edit, delete, etc.)
 * - System-level protection to prevent deletion of critical permissions
 * - Legacy category field for backward compatibility
 * - Audit timestamps for tracking creation
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Permission Entity
 * 
 * Represents a single permission that can be assigned to roles in the access control system.
 * Permissions are granular actions that users can perform (e.g., "view_products", "edit_orders").
 * 
 * The entity supports:
 * - System-level permissions that cannot be deleted (isSystem = true)
 * - Resource-based grouping for organizing permissions by entity type
 * - Action-based categorization for filtering by operation type (CRUD operations)
 * - Backward compatibility with existing category field
 * 
 * @example
 * {
 *   id: 1,
 *   name: "view_products",
 *   description: "View product listings and details",
 *   resource: "products",
 *   action: "view",
 *   isSystem: false,
 *   category: "products"
 * }
 */
@Entity('permissions')
@Index(['resource', 'action']) // Composite index for efficient filtering by resource and action
export class Permission {
  /**
   * Unique identifier for the permission
   * @example 1
   */
  @ApiProperty({
    description: 'Unique identifier for the permission',
    example: 1,
    type: 'integer',
  })
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Unique permission name following the naming convention: {action}_{resource}
   * 
   * Examples:
   * - view_products
   * - create_orders
   * - manage_users
   * - access_admin_panel
   * 
   * @example "view_products"
   */
  @ApiProperty({
    description: 'Unique permission name following the naming convention: {action}_{resource}',
    example: 'view_products',
    uniqueItems: true,
    maxLength: 100,
  })
  @Column({ unique: true, length: 100 })
  name: string;

  /**
   * Human-readable description explaining what the permission allows
   * 
   * Should clearly describe the scope and purpose of the permission for administrators
   * assigning permissions to roles.
   * 
   * @example "View product listings and details"
   */
  @ApiPropertyOptional({
    description: 'Human-readable description explaining what the permission allows',
    example: 'View product listings and details',
    type: 'string',
    nullable: true,
  })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  /**
   * Resource/entity type that this permission applies to
   * 
   * Groups permissions by the resource they operate on, enabling:
   * - UI to display permissions organized by entity type
   * - Bulk assignment of all permissions for a specific resource
   * - Discovery of available permissions for a given resource
   * 
   * Common resources:
   * - "products" - Product catalog management
   * - "orders" - Order processing and fulfillment
   * - "users" - User account management
   * - "vendors" - Vendor management
   * - "admin" - Administrative functions
   * - "payments" - Payment processing
   * - "shipping" - Logistics and shipment
   * - "analytics" - Reports and metrics
   * 
   * @example "products"
   */
  @ApiPropertyOptional({
    description: 'Resource/entity type that this permission applies to (e.g., products, orders, users)',
    example: 'products',
    type: 'string',
    nullable: true,
    maxLength: 50,
  })
  @Column({ nullable: true, length: 50 })
  resource?: string;

  /**
   * Action/operation type that this permission represents
   * 
   * Categorizes permissions by the type of operation, enabling:
   * - Action-based filtering in permission assignment UI
   * - Bulk assignment of all "view" or "edit" permissions
   * - Granular access control at the operation level
   * 
   * Standard actions:
   * - "view" - Read-only access to view data
   * - "create" - Create new records
   * - "edit" - Modify existing records
   * - "delete" - Remove records
   * - "manage" - Full CRUD access (create, read, update, delete)
   * - "export" - Export data to external formats
   * - "import" - Import data from external sources
   * - "approve" - Approve pending submissions
   * - "reject" - Reject submissions
   * 
   * @example "view"
   */
  @ApiPropertyOptional({
    description: 'Action/operation type (e.g., view, create, edit, delete, manage, export, import)',
    example: 'view',
    type: 'string',
    nullable: true,
    maxLength: 50,
  })
  @Column({ nullable: true, length: 50 })
  action?: string;

  /**
   * Indicates if this is a system-level permission that cannot be deleted
   * 
   * System permissions are critical for core functionality and security:
   * - Cannot be deleted through API endpoints
   * - Typically include permissions like "access_admin_panel", "manage_users", "manage_permissions"
   * - Ensures system integrity by preventing accidental removal of essential permissions
   * - Should be set to true for permissions required for basic system operation
   * 
   * When isSystem = true:
   * - DELETE operations are blocked with validation error
   * - UI should display these permissions with a lock icon or "System" badge
   * - Documentation should explain why the permission cannot be deleted
   * 
   * @default false
   * @example false
   */
  @ApiProperty({
    description: 'Indicates if this is a system-level permission that cannot be deleted (protects critical permissions)',
    example: false,
    default: false,
    type: 'boolean',
  })
  @Column({ default: false, name: 'is_system' })
  isSystem: boolean;

  /**
   * Legacy category field for backward compatibility
   * 
   * Kept for existing code that may rely on this field.
   * New implementations should use the more specific `resource` and `action` fields.
   * 
   * @deprecated Use `resource` and `action` fields instead
   * @example "products"
   */
  @ApiPropertyOptional({
    description: 'Legacy category field (use resource and action fields for new implementations)',
    example: 'products',
    type: 'string',
    nullable: true,
    deprecated: true,
  })
  @Column({ nullable: true, length: 50 })
  category?: string;

  /**
   * Timestamp when the permission was created
   * @example "2024-01-15T10:30:00.000Z"
   */
  @ApiProperty({
    description: 'Timestamp when the permission was created',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the permission was last updated
   * @example "2024-01-20T14:45:00.000Z"
   */
  @ApiProperty({
    description: 'Timestamp when the permission was last updated',
    example: '2024-01-20T14:45:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}

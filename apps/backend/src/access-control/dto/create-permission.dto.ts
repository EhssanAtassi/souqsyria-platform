/**
 * @file create-permission.dto.ts
 * @description DTO for creating a new permission with enhanced categorization support.
 * 
 * This DTO supports creating permissions with:
 * - Basic identification (name, description)
 * - Resource-based categorization for UI grouping
 * - Action-based categorization for filtering
 * - System-level protection flag
 */
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for creating a new permission
 * 
 * Defines the structure and validation rules for permission creation requests.
 * Supports both legacy category field and new resource/action fields for
 * enhanced categorization and filtering capabilities.
 * 
 * @example
 * {
 *   "name": "view_products",
 *   "description": "View product listings and details",
 *   "resource": "products",
 *   "action": "view",
 *   "isSystem": false
 * }
 */
export class CreatePermissionDto {
  /**
   * Unique permission name following the naming convention: {action}_{resource}
   * 
   * Naming convention examples:
   * - view_products
   * - create_orders
   * - edit_users
   * - delete_vendors
   * - manage_payments
   * - export_analytics
   * - access_admin_panel
   * 
   * The name should be:
   * - Unique across all permissions
   * - Lowercase with underscores
   * - Descriptive of the action and resource
   * - Maximum 100 characters
   * 
   * @example "view_products"
   */
  @ApiProperty({
    description: 'Unique permission name following the naming convention: {action}_{resource}',
    example: 'view_products',
    maxLength: 100,
    required: true,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  /**
   * Human-readable description explaining what the permission allows
   * 
   * Should clearly describe:
   * - The scope of access granted
   * - What actions are enabled
   * - Any important restrictions or conditions
   * 
   * This helps administrators understand the permission when assigning it to roles.
   * 
   * @example "View product listings and details"
   */
  @ApiPropertyOptional({
    description: 'Human-readable description explaining what the permission allows',
    example: 'View product listings and details',
    required: false,
    type: 'string',
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Resource/entity type that this permission applies to
   * 
   * Groups permissions by the resource they operate on.
   * This enables:
   * - UI to display permissions organized by entity type
   * - Bulk assignment of all permissions for a specific resource
   * - Better permission discovery
   * 
   * Common resources include:
   * - products
   * - orders
   * - users
   * - vendors
   * - payments
   * - shipping
   * - analytics
   * - admin
   * 
   * @example "products"
   */
  @ApiPropertyOptional({
    description: 'Resource/entity type that this permission applies to (e.g., products, orders, users)',
    example: 'products',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  resource?: string;

  /**
   * Action/operation type that this permission represents
   * 
   * Categorizes permissions by operation type for:
   * - Action-based filtering in UI
   * - Bulk assignment by action type (e.g., all "view" permissions)
   * - Granular access control
   * 
   * Standard actions:
   * - view - Read-only access
   * - create - Create new records
   * - edit - Modify existing records
   * - delete - Remove records
   * - manage - Full CRUD access
   * - export - Export data
   * - import - Import data
   * - approve - Approve submissions
   * - reject - Reject submissions
   * 
   * @example "view"
   */
  @ApiPropertyOptional({
    description: 'Action/operation type (e.g., view, create, edit, delete, manage, export, import)',
    example: 'view',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  /**
   * Indicates if this is a system-level permission that cannot be deleted
   * 
   * System permissions are critical for core functionality:
   * - Cannot be deleted through API endpoints
   * - Protected from accidental removal
   * - Typically include permissions like "access_admin_panel", "manage_users"
   * 
   * Set to true only for permissions essential to system operation.
   * 
   * @default false
   * @example false
   */
  @ApiPropertyOptional({
    description: 'Indicates if this is a system-level permission that cannot be deleted (protects critical permissions)',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  /**
   * Legacy category field for backward compatibility
   * 
   * @deprecated Use `resource` and `action` fields instead for new implementations
   * @example "products"
   */
  @ApiPropertyOptional({
    description: 'Legacy category field (use resource and action fields for new implementations)',
    example: 'products',
    required: false,
    deprecated: true,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

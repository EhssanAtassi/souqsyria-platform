/**
 * @file add-permission-categorization-fields.sql
 * @description Migration to add enhanced categorization fields to permissions table
 *
 * This migration adds three new fields to support better permission organization:
 * 1. isSystem - Prevents deletion of critical system permissions
 * 2. resource - Groups permissions by entity/resource type
 * 3. action - Categorizes permissions by operation type (CRUD actions)
 *
 * The migration is backward compatible:
 * - All new columns are nullable or have default values
 * - Existing data is preserved
 * - No data migration required immediately
 * - Composite index added for efficient filtering
 *
 * Author: Database Architecture Team
 * Date: 2024-01-21
 * Ticket: AUTH-RBAC-ENHANCEMENT
 */

-- ============================================================
-- STEP 1: Add new columns with nullable/default values
-- ============================================================

-- Add isSystem column to protect critical permissions from deletion
-- Default: false (not a system permission)
-- System permissions cannot be deleted through API endpoints
ALTER TABLE `permissions`
ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT FALSE
COMMENT 'Indicates if this is a system-level permission that cannot be deleted';

-- Add resource column for grouping permissions by entity type
-- Examples: products, orders, users, vendors, payments
-- Enables UI to organize permissions by resource
ALTER TABLE `permissions`
ADD COLUMN `resource` VARCHAR(50) NULL
COMMENT 'Resource/entity type that this permission applies to (e.g., products, orders, users)';

-- Add action column for categorizing permissions by operation type
-- Examples: view, create, edit, delete, manage, export, import
-- Enables action-based filtering in permission assignment UI
ALTER TABLE `permissions`
ADD COLUMN `action` VARCHAR(50) NULL
COMMENT 'Action/operation type (e.g., view, create, edit, delete, manage, export, import)';

-- Add updatedAt timestamp column for tracking modifications
-- Automatically updated by TypeORM when permission is modified
ALTER TABLE `permissions`
ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
COMMENT 'Timestamp when the permission was last updated';

-- ============================================================
-- STEP 2: Create composite index for efficient filtering
-- ============================================================

-- Create composite index on (resource, action) for fast filtering
-- Use case: Find all "view" permissions for "products" resource
-- Use case: Get all permissions for "orders" resource grouped by action
CREATE INDEX `idx_permissions_resource_action`
ON `permissions` (`resource`, `action`);

-- ============================================================
-- STEP 3: Create index on isSystem for deletion checks
-- ============================================================

-- Create index on isSystem for efficient deletion validation queries
-- Use case: Quickly check if permission can be deleted
CREATE INDEX `idx_permissions_is_system`
ON `permissions` (`is_system`);

-- ============================================================
-- STEP 4: Update table comment
-- ============================================================

ALTER TABLE `permissions`
COMMENT = 'Permissions table with enhanced categorization: system-level protection, resource grouping, and action-based filtering';

-- ============================================================
-- MIGRATION VERIFICATION QUERIES
-- ============================================================

-- Verify column additions
-- Expected: Should show all 4 new columns (is_system, resource, action, updated_at)
-- DESCRIBE `permissions`;

-- Verify indexes
-- Expected: Should show composite index idx_permissions_resource_action and idx_permissions_is_system
-- SHOW INDEX FROM `permissions`;

-- Check existing data integrity
-- Expected: Should return 0 rows (no data should be affected)
-- SELECT COUNT(*) FROM `permissions` WHERE is_system IS NULL;

-- ============================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================

/*
-- Drop indexes
DROP INDEX `idx_permissions_resource_action` ON `permissions`;
DROP INDEX `idx_permissions_is_system` ON `permissions`;

-- Drop columns
ALTER TABLE `permissions` DROP COLUMN `is_system`;
ALTER TABLE `permissions` DROP COLUMN `resource`;
ALTER TABLE `permissions` DROP COLUMN `action`;
ALTER TABLE `permissions` DROP COLUMN `updated_at`;

-- Restore original table comment
ALTER TABLE `permissions`
COMMENT = 'Permissions table for access control system';
*/

-- ============================================================
-- POST-MIGRATION RECOMMENDATIONS
-- ============================================================

/*
After running this migration:

1. Update seeder to populate resource/action fields for existing permissions
   - Parse permission names to extract resource and action
   - Example: "view_products" -> resource="products", action="view"

2. Mark critical system permissions with isSystem = true
   - access_admin_panel
   - manage_permissions
   - manage_roles
   - assign_roles
   - view_system_logs

3. Update application code to:
   - Use new fields in permission assignment UI
   - Group permissions by resource for better organization
   - Filter permissions by action type
   - Block deletion of system permissions

4. Consider creating database views for common queries:
   - View all permissions grouped by resource
   - View all permissions filtered by action
   - View all system permissions

5. Document permission naming conventions:
   - Format: {action}_{resource}
   - Examples: view_products, create_orders, manage_users
*/

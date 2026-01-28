-- Migration: Add priority column to roles table
-- Purpose: Support role hierarchy and conflict resolution
-- Author: SouqSyria Backend Team
-- Date: 2025-01-21

-- Add priority column with default value 0
ALTER TABLE `roles`
ADD COLUMN `priority` INT NOT NULL DEFAULT 0
COMMENT 'Role priority for conflict resolution. Higher values = higher priority';

-- Create index for efficient priority-based queries
CREATE INDEX `idx_roles_priority` ON `roles` (`priority` DESC);

-- Update system roles to have higher priority
-- Super Admin should have highest priority
UPDATE `roles` SET `priority` = 1000 WHERE `name` = 'Super Admin' AND `isDefault` = 1;

-- Set priority for default roles (if they exist)
UPDATE `roles` SET `priority` = 100 WHERE `name` = 'Admin' AND `isDefault` = 1;
UPDATE `roles` SET `priority` = 50 WHERE `name` = 'Vendor' AND `isDefault` = 1;
UPDATE `roles` SET `priority` = 10 WHERE `name` = 'Buyer' AND `isDefault` = 1;

-- Rollback instructions:
-- To revert this migration, run:
-- DROP INDEX `idx_roles_priority` ON `roles`;
-- ALTER TABLE `roles` DROP COLUMN `priority`;

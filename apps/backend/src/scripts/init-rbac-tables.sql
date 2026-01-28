-- ============================================
-- SouqSyria RBAC Tables Initialization Script
-- Creates minimal tables required for test user seeding
-- Run: mysql -u root -p'password' ecommerce_souqsyria < init-rbac-tables.sql
-- ============================================

-- Roles table
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `isDefault` tinyint NOT NULL DEFAULT '0',
  `type` enum('system','business','admin') NOT NULL DEFAULT 'business',
  `priority` int NOT NULL DEFAULT '0',
  `isSystem` tinyint NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `isSystem` tinyint NOT NULL DEFAULT '0',
  `resource` varchar(100) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_permissions_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permission mapping table
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_role_permission_unique` (`role_id`, `permission_id`),
  KEY `IDX_role_permissions_role` (`role_id`),
  KEY `IDX_role_permissions_permission` (`permission_id`),
  CONSTRAINT `FK_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table (columns match User entity @Column({ name: '...' }) decorators)
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firebase_uid` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `fullName` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `is_verified` tinyint NOT NULL DEFAULT '0',
  `otp_code` varchar(10) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `oauth_provider` varchar(20) DEFAULT NULL,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `oauth_access_token` text DEFAULT NULL,
  `oauth_refresh_token` text DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `assigned_role_id` int DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `is_banned` tinyint NOT NULL DEFAULT '0',
  `is_suspended` tinyint NOT NULL DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `account_locked_until` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `last_activity_at` datetime DEFAULT NULL,
  `ban_reason` varchar(500) DEFAULT NULL,
  `banned_until` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_users_email` (`email`),
  UNIQUE KEY `IDX_users_firebase_uid` (`firebase_uid`),
  UNIQUE KEY `IDX_users_google_id` (`google_id`),
  UNIQUE KEY `IDX_users_facebook_id` (`facebook_id`),
  KEY `IDX_users_role_banned` (`role_id`, `is_banned`),
  KEY `IDX_users_assigned_role` (`assigned_role_id`),
  CONSTRAINT `FK_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_users_assigned_role` FOREIGN KEY (`assigned_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routes table for permission mapping
CREATE TABLE IF NOT EXISTS `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `path` varchar(500) NOT NULL,
  `method` varchar(20) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `permission_id` int DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_routes_path_method` (`path`, `method`),
  KEY `IDX_routes_permission` (`permission_id`),
  CONSTRAINT `FK_routes_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Audit Logs table
CREATE TABLE IF NOT EXISTS `security_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `resourceType` varchar(50) DEFAULT NULL,
  `resourceId` varchar(100) DEFAULT NULL,
  `permissionRequired` varchar(100) DEFAULT NULL,
  `success` tinyint NOT NULL DEFAULT '1',
  `failureReason` text,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text,
  `requestPath` varchar(500) DEFAULT NULL,
  `requestMethod` varchar(10) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_security_audit_user_created` (`userId`, `createdAt`),
  KEY `IDX_security_audit_action` (`action`),
  KEY `IDX_security_audit_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Seed initial roles
-- ============================================
INSERT INTO `roles` (`name`, `description`, `type`, `priority`, `isSystem`, `isDefault`) VALUES
('owner', 'System owner with full access to everything', 'admin', 100, 1, 0),
('super_admin', 'Super administrator with comprehensive permissions', 'admin', 90, 1, 0),
('admin', 'Standard administrator', 'admin', 80, 1, 0),
('moderator', 'Content moderator', 'admin', 70, 0, 0),
('staff', 'Customer support staff', 'admin', 60, 0, 0),
('analyst', 'Read-only analytics access', 'admin', 50, 0, 0),
('financial_manager', 'Financial operations manager', 'admin', 45, 0, 0),
('inventory_manager', 'Inventory and stock manager', 'admin', 45, 0, 0),
('marketing_manager', 'Marketing campaigns manager', 'admin', 45, 0, 0),
('vendor', 'Full vendor/seller capabilities', 'business', 30, 0, 0),
('seller', 'Individual seller with limited capabilities', 'business', 25, 0, 0),
('premium_buyer', 'Premium customer with enhanced features', 'business', 15, 0, 0),
('buyer', 'Regular customer', 'business', 10, 0, 1)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`), `priority` = VALUES(`priority`);

-- ============================================
-- Seed basic permissions
-- ============================================
INSERT INTO `permissions` (`name`, `description`, `module`, `isSystem`) VALUES
('access_admin_panel', 'Access admin panel', 'admin', 1),
('manage_users', 'Full user management', 'users', 1),
('view_users', 'View user list', 'users', 1),
('edit_users', 'Edit user profiles', 'users', 1),
('ban_users', 'Ban user accounts', 'users', 1),
('suspend_users', 'Suspend user accounts', 'users', 1),
('assign_roles', 'Assign roles to users', 'roles', 1),
('manage_roles', 'Manage roles and permissions', 'roles', 1),
('manage_routes', 'Manage route-permission mappings', 'routes', 1),
('view_audit_logs', 'View security audit logs', 'security', 1),
('view_products', 'View products', 'products', 0),
('create_products', 'Create products', 'products', 0),
('edit_products', 'Edit products', 'products', 0),
('delete_products', 'Delete products', 'products', 0),
('manage_orders', 'Manage orders', 'orders', 0),
('view_orders', 'View orders', 'orders', 0),
('process_refunds', 'Process refunds', 'finance', 0),
('view_analytics', 'View analytics', 'analytics', 0),
('export_data', 'Export data', 'system', 1),
('delete_system_data', 'Delete system data', 'system', 1),
('manage_system_roles', 'Modify system roles', 'system', 1)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- ============================================
-- Assign permissions to roles
-- ============================================
-- Owner gets all permissions
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p WHERE r.name = 'owner'
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Super Admin gets most permissions except system deletion
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'super_admin' AND p.name NOT IN ('delete_system_data', 'manage_system_roles')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Admin gets user/product/order management
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'admin' AND p.name IN ('access_admin_panel', 'view_users', 'edit_users', 'view_products', 'create_products', 'edit_products', 'manage_orders', 'view_orders', 'view_analytics')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Moderator gets content management
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'moderator' AND p.name IN ('access_admin_panel', 'view_users', 'view_products', 'edit_products', 'ban_users', 'suspend_users')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Staff gets basic support
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'staff' AND p.name IN ('access_admin_panel', 'view_users', 'view_orders', 'process_refunds')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Analyst gets read-only analytics
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'analyst' AND p.name IN ('access_admin_panel', 'view_users', 'view_products', 'view_orders', 'view_analytics', 'export_data')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Vendor gets product management
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'vendor' AND p.name IN ('view_products', 'create_products', 'edit_products', 'delete_products', 'view_orders', 'view_analytics')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Seller gets basic product management
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'seller' AND p.name IN ('view_products', 'create_products', 'edit_products', 'view_orders')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Buyer gets basic access
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'buyer' AND p.name IN ('view_products', 'view_orders')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

-- Premium Buyer gets analytics
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id FROM `roles` r, `permissions` p
WHERE r.name = 'premium_buyer' AND p.name IN ('view_products', 'view_orders', 'view_analytics')
ON DUPLICATE KEY UPDATE `role_id` = `role_id`;

SELECT 'RBAC tables initialized successfully!' AS status;
SELECT CONCAT('Roles: ', COUNT(*)) AS count FROM roles;
SELECT CONCAT('Permissions: ', COUNT(*)) AS count FROM permissions;
SELECT CONCAT('Role-Permission mappings: ', COUNT(*)) AS count FROM role_permissions;

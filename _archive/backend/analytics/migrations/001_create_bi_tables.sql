/**
 * Business Intelligence Tables Migration
 *
 * Creates tables for:
 * - User session tracking
 * - Granular event tracking
 * - Order session attribution
 *
 * Performance optimizations:
 * - Time-series indexes for analytics queries
 * - Composite indexes for common query patterns
 * - Partitioning strategy for event tables (optional)
 *
 * @author SouqSyria Development Team
 * @since 2026-01-22
 */

-- =====================================================
-- USER SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `guest_session_id` VARCHAR(36) NULL,
  `session_token` VARCHAR(64) NOT NULL UNIQUE,
  `status` ENUM('active', 'ended', 'abandoned', 'converted') NOT NULL DEFAULT 'active',
  `entry_page` VARCHAR(255) NULL,
  `exit_page` VARCHAR(255) NULL,
  `referrer_source` VARCHAR(255) NULL,
  `referrer_url` TEXT NULL,
  `utm_params` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `device_info` JSON NULL,
  `location` JSON NULL,
  `started_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ended_at` TIMESTAMP NULL,
  `last_activity_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `duration_seconds` INT NOT NULL DEFAULT 0,
  `events_count` INT NOT NULL DEFAULT 0,
  `page_views` INT NOT NULL DEFAULT 0,
  `products_viewed` INT NOT NULL DEFAULT 0,
  `cart_additions` INT NOT NULL DEFAULT 0,
  `cart_value` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `order_id` INT NULL,
  `order_value` DECIMAL(10, 2) NULL,
  `abandoned_cart_notified_at` TIMESTAMP NULL,
  `abandoned_cart_recovered` BOOLEAN NOT NULL DEFAULT FALSE,
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_created` (`user_id`, `created_at`),
  INDEX `idx_session_token` (`session_token`),
  INDEX `idx_status_created` (`status`, `created_at`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_guest_session` (`guest_session_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User sessions for business intelligence tracking';

-- =====================================================
-- USER EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS `user_events` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `session_id` INT NOT NULL,
  `user_id` INT NULL,
  `event_type` ENUM(
    'page_view', 'homepage_view', 'category_view', 'search_results_view',
    'product_view', 'product_click', 'product_image_zoom', 'product_video_play', 'product_variant_select',
    'cart_add', 'cart_remove', 'cart_update', 'cart_view', 'cart_coupon_apply',
    'checkout_start', 'checkout_shipping_info', 'checkout_payment_info', 'checkout_complete',
    'search', 'search_no_results', 'search_suggestion_click',
    'category_click', 'brand_click', 'banner_click', 'filter_apply', 'sort_apply',
    'wishlist_add', 'wishlist_remove', 'wishlist_to_cart',
    'account_register', 'account_login', 'account_logout', 'account_profile_update',
    'product_share', 'review_submit', 'product_inquiry',
    'error', 'payment_failed', 'out_of_stock'
  ) NOT NULL,
  `event_category` VARCHAR(50) NOT NULL,
  `page_url` VARCHAR(500) NULL,
  `page_title` VARCHAR(255) NULL,
  `previous_page_url` VARCHAR(500) NULL,
  `product_id` INT NULL,
  `product_sku` VARCHAR(100) NULL,
  `product_name` VARCHAR(255) NULL,
  `product_category` VARCHAR(255) NULL,
  `product_price` DECIMAL(10, 2) NULL,
  `quantity` INT NULL,
  `cart_value` DECIMAL(10, 2) NULL,
  `search_query` VARCHAR(500) NULL,
  `search_results_count` INT NULL,
  `category_id` INT NULL,
  `category_name` VARCHAR(255) NULL,
  `brand_id` INT NULL,
  `brand_name` VARCHAR(255) NULL,
  `order_id` INT NULL,
  `order_value` DECIMAL(10, 2) NULL,
  `coupon_code` VARCHAR(50) NULL,
  `discount_amount` DECIMAL(10, 2) NULL,
  `event_duration_ms` INT NULL,
  `scroll_depth` INT NULL,
  `click_position` INT NULL,
  `filter_values` JSON NULL,
  `sort_order` VARCHAR(50) NULL,
  `error_message` TEXT NULL,
  `error_code` VARCHAR(50) NULL,
  `ab_test_variant` VARCHAR(50) NULL,
  `device_info` JSON NULL,
  `metadata` JSON NULL,
  `client_timestamp` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_session_created` (`session_id`, `created_at`),
  INDEX `idx_user_created` (`user_id`, `created_at`),
  INDEX `idx_event_type_created` (`event_type`, `created_at`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_product_id` (`product_id`),
  INDEX `idx_event_category` (`event_category`),
  INDEX `idx_search_query` (`search_query`),
  FOREIGN KEY (`session_id`) REFERENCES `user_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Granular user events for business intelligence analytics';

-- =====================================================
-- ORDER SESSION ATTRIBUTION FIELDS
-- =====================================================

ALTER TABLE `orders`
ADD COLUMN `session_id` INT NULL AFTER `billing_postal_code`,
ADD COLUMN `session_token` VARCHAR(64) NULL AFTER `session_id`,
ADD COLUMN `first_session_id` INT NULL AFTER `session_token`,
ADD COLUMN `entry_page` VARCHAR(255) NULL AFTER `first_session_id`,
ADD COLUMN `referrer_source` VARCHAR(255) NULL AFTER `entry_page`,
ADD COLUMN `utm_params` JSON NULL AFTER `referrer_source`,
ADD COLUMN `time_to_purchase_seconds` INT NULL AFTER `utm_params`,
ADD COLUMN `sessions_before_purchase` INT NULL AFTER `time_to_purchase_seconds`,
ADD COLUMN `cart_abandoned` BOOLEAN NOT NULL DEFAULT FALSE AFTER `sessions_before_purchase`,
ADD COLUMN `cart_abandoned_at` TIMESTAMP NULL AFTER `cart_abandoned`,
ADD COLUMN `device_type` VARCHAR(20) NULL AFTER `cart_abandoned_at`,
ADD COLUMN `order_attribution` JSON NULL AFTER `device_type`,
ADD INDEX `idx_session_token` (`session_token`);

-- =====================================================
-- PERFORMANCE OPTIMIZATION: TIME-SERIES PARTITIONING
-- (Optional - Uncomment if managing large event volumes)
-- =====================================================

-- Partition user_events table by month for better query performance
-- ALTER TABLE `user_events`
-- PARTITION BY RANGE (TO_DAYS(`created_at`)) (
--   PARTITION p_2026_01 VALUES LESS THAN (TO_DAYS('2026-02-01')),
--   PARTITION p_2026_02 VALUES LESS THAN (TO_DAYS('2026-03-01')),
--   PARTITION p_2026_03 VALUES LESS THAN (TO_DAYS('2026-04-01')),
--   PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- =====================================================
-- CLEANUP: Archive old events (run periodically)
-- =====================================================

-- Create archived events table for historical data
CREATE TABLE IF NOT EXISTS `user_events_archive` LIKE `user_events`;

-- Archive events older than 90 days (run as scheduled job)
-- INSERT INTO `user_events_archive`
-- SELECT * FROM `user_events`
-- WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- DELETE FROM `user_events`
-- WHERE `created_at` < DATE_SUB(NOW(), INTERVAL 90 DAY);

--
-- Migration: Create hero_banners table (MySQL Version)
-- Description: Enterprise hero banner system with scheduling, analytics, and Syrian cultural data
-- Author: SouqSyria Development Team
-- Date: 2025-10-08
--

-- Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
    -- Primary Key (MySQL uses CHAR(36) for UUID)
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Multilingual Content
    name_en VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200) NOT NULL,
    headline_en VARCHAR(300) NOT NULL,
    headline_ar VARCHAR(300) NOT NULL,
    subheadline_en VARCHAR(500),
    subheadline_ar VARCHAR(500),

    -- Visual Assets
    image_url_desktop VARCHAR(500) NOT NULL,
    image_url_tablet VARCHAR(500),
    image_url_mobile VARCHAR(500),
    image_alt_en VARCHAR(200) NOT NULL,
    image_alt_ar VARCHAR(200) NOT NULL,

    -- CTA Configuration
    cta_text_en VARCHAR(100) NOT NULL,
    cta_text_ar VARCHAR(100) NOT NULL,
    cta_variant ENUM('primary', 'secondary', 'outline', 'ghost') DEFAULT 'primary',
    cta_size ENUM('small', 'medium', 'large') DEFAULT 'large',
    cta_color VARCHAR(50) DEFAULT 'golden-wheat',
    cta_icon VARCHAR(50),
    cta_icon_position ENUM('left', 'right') DEFAULT 'right',
    cta_visible BOOLEAN DEFAULT TRUE,

    -- Navigation & Routing
    target_type ENUM('category', 'product', 'campaign', 'external', 'page') NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    tracking_source VARCHAR(100),
    tracking_medium VARCHAR(100),
    tracking_campaign VARCHAR(200),

    -- Theme & Styling
    text_color ENUM('light', 'dark') DEFAULT 'light',
    overlay_color VARCHAR(7),
    overlay_opacity DECIMAL(3, 2) DEFAULT 0.40,
    content_alignment ENUM('left', 'center', 'right') DEFAULT 'left',
    content_vertical_alignment ENUM('top', 'center', 'bottom') DEFAULT 'center',

    -- Banner Type & Configuration
    type ENUM('product_spotlight', 'seasonal', 'flash_sale', 'brand_story', 'cultural') NOT NULL,
    priority INT DEFAULT 5,

    -- Scheduling
    schedule_start TIMESTAMP NOT NULL,
    schedule_end TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Damascus',

    -- Analytics & Tracking
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    click_through_rate DECIMAL(5, 2) DEFAULT 0.00,
    conversions INT DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    revenue DECIMAL(15, 2) DEFAULT 0.00,
    analytics_updated_at TIMESTAMP NULL,

    -- Syrian Cultural Data (Optional)
    syrian_region VARCHAR(100),
    syrian_specialties JSON,
    cultural_context_en TEXT,
    cultural_context_ar TEXT,
    unesco_recognition BOOLEAN DEFAULT FALSE,
    artisan_name_en VARCHAR(200),
    artisan_name_ar VARCHAR(200),
    artisan_bio_en TEXT,
    artisan_bio_ar TEXT,
    artisan_location VARCHAR(200),
    artisan_experience INT,

    -- Approval Workflow
    approval_status ENUM('draft', 'pending', 'approved', 'rejected', 'suspended', 'archived') DEFAULT 'draft',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,

    -- Status & Visibility
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit & Enterprise Fields
    created_by INT,
    updated_by INT,
    version INT DEFAULT 1,
    tags JSON,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Indexes
    INDEX idx_active_status_priority (is_active, approval_status, priority),
    INDEX idx_schedule (schedule_start, schedule_end),
    INDEX idx_type_active (type, is_active),
    INDEX idx_approval_status (approval_status),
    INDEX idx_created_by (created_by),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_active_scheduled (is_active, approval_status, schedule_start, schedule_end),
    INDEX idx_priority_order (priority DESC, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create trigger to automatically update click_through_rate
DELIMITER $$
CREATE TRIGGER update_hero_banner_ctr
BEFORE UPDATE ON hero_banners
FOR EACH ROW
BEGIN
    IF NEW.impressions > 0 THEN
        SET NEW.click_through_rate = (NEW.clicks / NEW.impressions) * 100;
    ELSE
        SET NEW.click_through_rate = 0;
    END IF;

    IF NEW.clicks > 0 THEN
        SET NEW.conversion_rate = (NEW.conversions / NEW.clicks) * 100;
    ELSE
        SET NEW.conversion_rate = 0;
    END IF;
END$$
DELIMITER ;

--
-- Migration: Create hero_banners table
-- Description: Enterprise hero banner system with scheduling, analytics, and Syrian cultural data
-- Author: SouqSyria Development Team
-- Date: 2025-10-07
--

-- Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

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
    cta_variant VARCHAR(20) DEFAULT 'primary' CHECK (cta_variant IN ('primary', 'secondary', 'outline', 'ghost')),
    cta_size VARCHAR(10) DEFAULT 'large' CHECK (cta_size IN ('small', 'medium', 'large')),
    cta_color VARCHAR(50) DEFAULT 'golden-wheat',
    cta_icon VARCHAR(50),
    cta_icon_position VARCHAR(10) DEFAULT 'right' CHECK (cta_icon_position IN ('left', 'right')),
    cta_visible BOOLEAN DEFAULT TRUE,

    -- Navigation & Routing
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('category', 'product', 'campaign', 'external', 'page')),
    target_url VARCHAR(500) NOT NULL,
    tracking_source VARCHAR(100),
    tracking_medium VARCHAR(100),
    tracking_campaign VARCHAR(200),

    -- Theme & Styling
    text_color VARCHAR(10) DEFAULT 'light' CHECK (text_color IN ('light', 'dark')),
    overlay_color VARCHAR(7),
    overlay_opacity DECIMAL(3, 2) DEFAULT 0.40 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 1),
    content_alignment VARCHAR(10) DEFAULT 'left' CHECK (content_alignment IN ('left', 'center', 'right')),
    content_vertical_alignment VARCHAR(10) DEFAULT 'center' CHECK (content_vertical_alignment IN ('top', 'center', 'bottom')),

    -- Banner Type & Configuration
    type VARCHAR(20) NOT NULL CHECK (type IN ('product_spotlight', 'seasonal', 'flash_sale', 'brand_story', 'cultural')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 100),

    -- Scheduling
    schedule_start TIMESTAMP NOT NULL,
    schedule_end TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Damascus',

    -- Analytics & Tracking
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    click_through_rate DECIMAL(5, 2) DEFAULT 0.00,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
    revenue DECIMAL(15, 2) DEFAULT 0.00,
    analytics_updated_at TIMESTAMP,

    -- Syrian Cultural Data (Optional)
    syrian_region VARCHAR(100),
    syrian_specialties JSONB,
    cultural_context_en TEXT,
    cultural_context_ar TEXT,
    unesco_recognition BOOLEAN DEFAULT FALSE,
    artisan_name_en VARCHAR(200),
    artisan_name_ar VARCHAR(200),
    artisan_bio_en TEXT,
    artisan_bio_ar TEXT,
    artisan_location VARCHAR(200),
    artisan_experience INTEGER CHECK (artisan_experience >= 0 AND artisan_experience <= 100),

    -- Approval Workflow
    approval_status VARCHAR(20) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected', 'suspended', 'archived')),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Status & Visibility
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit & Enterprise Fields
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    version INTEGER DEFAULT 1,
    tags JSONB,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_schedule CHECK (schedule_end > schedule_start)
);

-- Create Indexes for Performance
CREATE INDEX idx_hero_banners_active_approved
    ON hero_banners(is_active, approval_status, priority)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_hero_banners_schedule
    ON hero_banners(schedule_start, schedule_end)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_hero_banners_type
    ON hero_banners(type, is_active)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_hero_banners_syrian_region
    ON hero_banners(syrian_region)
    WHERE deleted_at IS NULL AND syrian_region IS NOT NULL;

CREATE INDEX idx_hero_banners_unesco
    ON hero_banners(unesco_recognition)
    WHERE deleted_at IS NULL AND unesco_recognition = TRUE;

CREATE INDEX idx_hero_banners_analytics
    ON hero_banners(impressions, clicks, conversions)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_hero_banners_deleted_at
    ON hero_banners(deleted_at);

-- Create Full-Text Search Index for multilingual search
CREATE INDEX idx_hero_banners_search
    ON hero_banners USING GIN (
        to_tsvector('english', name_en || ' ' || headline_en || ' ' || COALESCE(subheadline_en, ''))
    );

-- Trigger to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_hero_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hero_banners_updated_at
    BEFORE UPDATE ON hero_banners
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_banners_updated_at();

-- Comments for Documentation
COMMENT ON TABLE hero_banners IS 'Enterprise hero banner carousel system with scheduling, analytics, and Syrian cultural data';
COMMENT ON COLUMN hero_banners.id IS 'Unique identifier (UUID)';
COMMENT ON COLUMN hero_banners.name_en IS 'Banner name in English (internal identifier)';
COMMENT ON COLUMN hero_banners.name_ar IS 'Banner name in Arabic (internal identifier)';
COMMENT ON COLUMN hero_banners.headline_en IS 'Main headline displayed on banner (English)';
COMMENT ON COLUMN hero_banners.headline_ar IS 'Main headline displayed on banner (Arabic)';
COMMENT ON COLUMN hero_banners.type IS 'Banner type: product_spotlight, seasonal, flash_sale, brand_story, cultural';
COMMENT ON COLUMN hero_banners.priority IS 'Display priority (1-100, higher = shown first)';
COMMENT ON COLUMN hero_banners.schedule_start IS 'When the banner should start showing';
COMMENT ON COLUMN hero_banners.schedule_end IS 'When the banner should stop showing';
COMMENT ON COLUMN hero_banners.impressions IS 'Total number of times banner was viewed';
COMMENT ON COLUMN hero_banners.clicks IS 'Total number of banner clicks';
COMMENT ON COLUMN hero_banners.click_through_rate IS 'CTR percentage (calculated)';
COMMENT ON COLUMN hero_banners.conversions IS 'Number of conversions attributed to this banner';
COMMENT ON COLUMN hero_banners.conversion_rate IS 'Conversion rate percentage (calculated)';
COMMENT ON COLUMN hero_banners.revenue IS 'Total revenue attributed to this banner in SYP';
COMMENT ON COLUMN hero_banners.syrian_region IS 'Syrian region for cultural banners (damascus, aleppo, etc.)';
COMMENT ON COLUMN hero_banners.unesco_recognition IS 'Whether featured product has UNESCO recognition';
COMMENT ON COLUMN hero_banners.approval_status IS 'Approval workflow status';
COMMENT ON COLUMN hero_banners.is_active IS 'Whether banner is active and visible';

-- Grant Permissions (adjust based on your user roles)
GRANT SELECT, INSERT, UPDATE, DELETE ON hero_banners TO souqsyria_backend;
GRANT USAGE ON SEQUENCE hero_banners_id_seq TO souqsyria_backend;

-- Sample Data (Optional - for development/testing)
-- Uncomment to insert sample banner
/*
INSERT INTO hero_banners (
    name_en, name_ar, headline_en, headline_ar,
    image_url_desktop, image_alt_en, image_alt_ar,
    cta_text_en, cta_text_ar, target_type, target_url,
    type, priority, schedule_start, schedule_end,
    approval_status, is_active
) VALUES (
    'Damascus Steel Heritage Collection',
    'مجموعة تراث الفولاذ الدمشقي',
    'Authentic Damascus Steel Collection',
    'مجموعة الفولاذ الدمشقي الأصيل',
    'https://cdn.souqsyria.com/hero/damascus-steel-desktop.jpg',
    'Damascus Steel Heritage Collection',
    'مجموعة تراث الفولاذ الدمشقي',
    'Shop Damascus Steel',
    'تسوق الفولاذ الدمشقي',
    'category',
    '/category/damascus-steel',
    'product_spotlight',
    10,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year',
    'approved',
    TRUE
);
*/

-- Rollback Script (save separately as 001_rollback_hero_banners.sql)
-- DROP TRIGGER IF EXISTS trigger_hero_banners_updated_at ON hero_banners;
-- DROP FUNCTION IF EXISTS update_hero_banners_updated_at();
-- DROP TABLE IF EXISTS hero_banners CASCADE;

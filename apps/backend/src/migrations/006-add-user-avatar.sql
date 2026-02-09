-- =====================================================
-- Migration: Add Avatar Column to Users Table
-- Description: Adds avatar field to users table to match
--              the User entity definition (user.entity.ts:57)
-- Issue: All auth endpoints return 500 error:
--        "Unknown column 'User.avatar' in 'field list'"
-- Author: SouqSyria Development Team
-- Date: 2026-02-09
-- =====================================================

-- Add avatar column (nullable VARCHAR for URL/path storage)
-- Note: TypeORM uses camelCase column names (no naming strategy configured)
ALTER TABLE users
ADD COLUMN avatar VARCHAR(255) NULL AFTER fullName;

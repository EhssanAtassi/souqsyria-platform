-- Fix for duplicate index error
-- This script will drop any duplicate indexes and let TypeORM recreate them

-- Drop potentially conflicting indexes
DROP INDEX IF EXISTS IDX_ab1539b0e7afff849c4e366e12;

-- Show all indexes to verify cleanup
SHOW INDEX FROM syrian_governorates;
#!/bin/bash

# =====================================================================================
# Phase 6: Cart Item Price Locking - Migration Runner
# =====================================================================================
# This script runs the price lock migration for the cart items table
# Author: SouqSyria Development Team
# Date: 2025-11-13
# =====================================================================================

set -e  # Exit on error

echo "================================================"
echo "Phase 6: Cart Item Price Locking Migration"
echo "================================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ Loaded environment variables from .env"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check required variables
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "❌ Error: Missing required database configuration"
    echo "Required: DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME"
    exit 1
fi

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USERNAME"
echo ""

# Ask for confirmation
read -p "⚠️  This will modify the cart_items table. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled by user"
    exit 1
fi

# Create backup
BACKUP_FILE="backup_phase6_$(date +%Y%m%d_%H%M%S).sql"
echo ""
echo "📦 Creating database backup..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created: $BACKUP_FILE"
else
    echo "❌ Backup failed. Aborting migration."
    exit 1
fi

# Run migration
echo ""
echo "🚀 Running Phase 6 migration..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" < src/database/migrations/003-add-price-lock-columns.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    echo ""
    echo "To rollback, restore from backup:"
    echo "  mysql -h $DB_HOST -P $DB_PORT -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME < $BACKUP_FILE"
    exit 1
fi

# Verify migration
echo ""
echo "🔍 Verifying migration..."

# Check columns exist
COLUMNS_CHECK=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = '$DB_NAME'
      AND TABLE_NAME = 'cart_items'
      AND COLUMN_NAME IN ('added_at', 'locked_until');
")

if [ "$COLUMNS_CHECK" = "2" ]; then
    echo "✅ Columns 'added_at' and 'locked_until' created"
else
    echo "❌ Warning: Expected 2 columns, found $COLUMNS_CHECK"
fi

# Check indexes exist
INDEXES_CHECK=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = '$DB_NAME'
      AND TABLE_NAME = 'cart_items'
      AND INDEX_NAME IN ('idx_cart_items_locked_until', 'idx_cart_items_cart_locked');
")

if [ "$INDEXES_CHECK" = "2" ]; then
    echo "✅ Indexes created successfully"
else
    echo "❌ Warning: Expected 2 indexes, found $INDEXES_CHECK"
fi

# Check data integrity
NULL_CHECK=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" "$DB_NAME" -N -e "
    SELECT COUNT(*)
    FROM cart_items
    WHERE added_at IS NULL OR locked_until IS NULL;
")

if [ "$NULL_CHECK" = "0" ]; then
    echo "✅ All cart items have price lock data"
else
    echo "⚠️  Warning: $NULL_CHECK cart items missing price lock data"
fi

echo ""
echo "================================================"
echo "✅ Phase 6 Migration Complete!"
echo "================================================"
echo ""
echo "Backup saved to: $BACKUP_FILE"
echo ""
echo "Next steps:"
echo "1. Test cart validation endpoint: POST /cart/validate"
echo "2. Check Swagger docs: http://localhost:3000/api"
echo "3. Monitor application logs for any issues"
echo ""
echo "To rollback (if needed):"
echo "  mysql -h $DB_HOST -P $DB_PORT -u $DB_USERNAME -p$DB_PASSWORD $DB_NAME < $BACKUP_FILE"
echo ""

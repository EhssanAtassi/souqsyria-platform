#!/bin/bash

# ==========================================
# Shopping Cart Database Migrations for Docker
# ==========================================
# This script runs the cart backend integration migrations
# inside the Docker MySQL container
# ==========================================

set -e  # Exit on error

echo "🚀 Shopping Cart Backend Integration - Database Migrations"
echo "==========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi

# Check if MySQL container is running
if ! docker ps | grep -q souqsyria-mysql; then
    echo -e "${YELLOW}⚠️  MySQL container is not running.${NC}"
    echo "Starting Docker services..."
    docker-compose up -d mysql
    echo "Waiting for MySQL to be ready (30 seconds)..."
    sleep 30
fi

echo -e "${BLUE}📋 Running Cart Integration Migrations...${NC}"
echo ""

# Migration 1: Create guest_sessions table
echo -e "${BLUE}1/3${NC} Creating guest_sessions table..."
docker exec -i souqsyria-mysql mysql -uroot -psouqsyria_root_2025 souqsyria_dev < souqsyria-backend/src/database/migrations/001-create-guest-sessions.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Guest sessions table created${NC}"
else
    echo -e "${RED}❌ Failed to create guest_sessions table${NC}"
    exit 1
fi
echo ""

# Migration 2: Add session_id to carts table
echo -e "${BLUE}2/3${NC} Adding session_id column to carts table..."
docker exec -i souqsyria-mysql mysql -uroot -psouqsyria_root_2025 souqsyria_dev < souqsyria-backend/src/database/migrations/002-add-cart-session-id.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Session ID column added to carts${NC}"
else
    echo -e "${RED}❌ Failed to add session_id column${NC}"
    exit 1
fi
echo ""

# Migration 3: Add price lock columns to cart_items
echo -e "${BLUE}3/3${NC} Adding price lock columns to cart_items table..."
docker exec -i souqsyria-mysql mysql -uroot -psouqsyria_root_2025 souqsyria_dev < souqsyria-backend/src/database/migrations/003-add-price-lock-columns.sql
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Price lock columns added to cart_items${NC}"
else
    echo -e "${RED}❌ Failed to add price lock columns${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
echo ""

# Verify migrations
echo -e "${BLUE}📊 Verifying database schema...${NC}"
docker exec -i souqsyria-mysql mysql -uroot -psouqsyria_root_2025 souqsyria_dev -e "
SHOW TABLES LIKE 'guest_sessions';
DESCRIBE carts;
DESCRIBE cart_items;
" | grep -E "(guest_sessions|session_id|locked_until)"

echo ""
echo -e "${GREEN}✅ Database migrations verified!${NC}"
echo ""
echo "==========================================================="
echo "Next steps:"
echo "1. Start all Docker services: ./docker-start.sh"
echo "2. Access frontend: http://localhost:4201"
echo "3. Access backend API: http://localhost:3005/api/docs"
echo "==========================================================="

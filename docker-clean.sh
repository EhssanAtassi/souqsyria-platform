#!/bin/bash

# ==========================================
# SouqSyria Docker Cleanup Script
# ==========================================
# This script removes containers, volumes, and images
# ==========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}🧹 SouqSyria Docker Cleanup${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will remove:${NC}"
echo -e "  - All SouqSyria containers"
echo -e "  - All SouqSyria volumes (including database data)"
echo -e "  - All SouqSyria Docker images"
echo ""
echo -e "${RED}⚠️  This action cannot be undone!${NC}"
echo ""

read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Cleanup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🛑 Stopping services...${NC}"
docker compose down

echo -e "${YELLOW}🗑️  Removing volumes...${NC}"
docker compose down -v

echo -e "${YELLOW}🗑️  Removing images...${NC}"
docker compose down --rmi all

echo -e "${YELLOW}🧹 Pruning unused Docker resources...${NC}"
docker system prune -f

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ Cleanup completed successfully!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${BLUE}💡 To rebuild and start:${NC}"
echo -e "  ${YELLOW}./docker-start.sh${NC}"
echo ""

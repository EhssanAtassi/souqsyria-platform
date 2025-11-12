#!/bin/bash

# ==========================================
# SouqSyria Docker Stop Script
# ==========================================
# This script gracefully stops all Docker services
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
echo -e "${BLUE}🛑 Stopping SouqSyria E-commerce Platform${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Stop services
echo -e "${YELLOW}🛑 Stopping all services...${NC}"
docker compose down

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo -e "  ${YELLOW}Start services:${NC}  ./docker-start.sh"
echo -e "  ${YELLOW}View logs:${NC}       ./docker-logs.sh"
echo -e "  ${YELLOW}Clean up:${NC}        ./docker-clean.sh"
echo ""

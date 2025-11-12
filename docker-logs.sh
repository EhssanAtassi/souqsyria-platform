#!/bin/bash

# ==========================================
# SouqSyria Docker Logs Viewer
# ==========================================
# This script displays logs from Docker services
# ==========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}📋 SouqSyria Docker Logs${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check if services are running
if [ -z "$(docker compose ps -q)" ]; then
    echo -e "${YELLOW}⚠️  No services are currently running${NC}"
    echo -e "${YELLOW}Start services with: ./docker-start.sh${NC}"
    exit 0
fi

# Show options
echo -e "${YELLOW}Select a service to view logs:${NC}"
echo -e "  ${GREEN}1)${NC} All services"
echo -e "  ${GREEN}2)${NC} Frontend only"
echo -e "  ${GREEN}3)${NC} Backend only"
echo -e "  ${GREEN}4)${NC} MySQL only"
echo ""
echo -e "${BLUE}Or press Ctrl+C to cancel${NC}"
echo ""

# Read user input
read -p "Enter your choice (1-4): " choice

echo ""
echo -e "${BLUE}📋 Showing logs (press Ctrl+C to exit)...${NC}"
echo ""

case $choice in
    1)
        docker compose logs -f
        ;;
    2)
        docker compose logs -f frontend
        ;;
    3)
        docker compose logs -f backend
        ;;
    4)
        docker compose logs -f mysql
        ;;
    *)
        echo -e "${RED}Invalid choice. Showing all logs...${NC}"
        docker compose logs -f
        ;;
esac

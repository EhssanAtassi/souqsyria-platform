#!/bin/bash

# ==========================================
# SouqSyria Docker Startup Script
# ==========================================
# This script starts all services with Docker Compose
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
echo -e "${BLUE}🚀 Starting SouqSyria E-commerce Platform${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.docker...${NC}"
    cp .env.docker .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${YELLOW}⚠️  Please review and update .env with your configuration${NC}"
    echo ""
fi

# Stop any running containers
echo -e "${YELLOW}🛑 Stopping any running containers...${NC}"
docker compose down 2>/dev/null || true

# Build and start services
echo -e "${GREEN}🏗️  Building Docker images...${NC}"
docker compose build

echo ""
echo -e "${GREEN}🚀 Starting services...${NC}"
docker compose up -d

echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
echo ""

# Wait for MySQL
echo -e "${BLUE}Waiting for MySQL...${NC}"
until docker compose exec -T mysql mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD:-souqsyria_root_2025} --silent 2>/dev/null; do
    printf '.'
    sleep 2
done
echo -e "${GREEN}✓ MySQL is ready${NC}"

# Wait for Backend
echo -e "${BLUE}Waiting for Backend API...${NC}"
until curl -f http://localhost:3002/api/health 2>/dev/null; do
    printf '.'
    sleep 2
done
echo -e "${GREEN}✓ Backend API is ready${NC}"

# Wait for Frontend
echo -e "${BLUE}Waiting for Frontend...${NC}"
until curl -f http://localhost:4201/health 2>/dev/null; do
    printf '.'
    sleep 2
done
echo -e "${GREEN}✓ Frontend is ready${NC}"

echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ All services are running!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo -e "${BLUE}📊 Service URLs:${NC}"
echo -e "${YELLOW}  Frontend:${NC}  http://localhost:4201"
echo -e "${YELLOW}  Backend:${NC}   http://localhost:3002/api"
echo -e "${YELLOW}  Swagger:${NC}   http://localhost:3002/api/docs"
echo -e "${YELLOW}  MySQL:${NC}     localhost:3306"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "  ${YELLOW}View logs:${NC}      docker compose logs -f"
echo -e "  ${YELLOW}Stop services:${NC}  docker compose down"
echo -e "  ${YELLOW}Restart:${NC}        docker compose restart"
echo -e "  ${YELLOW}View status:${NC}    docker compose ps"
echo ""
echo -e "${GREEN}🎉 Happy coding!${NC}"

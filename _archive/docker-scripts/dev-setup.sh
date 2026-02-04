#!/bin/bash

# ==========================================
# SouqSyria Development Environment Setup
# ==========================================
# Automated setup script for new developers
# Validates dependencies and sets up the environment
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_NODE_VERSION="18.0.0"
MIN_NPM_VERSION="9.0.0"
MIN_DOCKER_VERSION="20.0.0"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Version comparison
version_ge() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

# Header
echo ""
echo "==========================================="
echo "  SouqSyria Development Setup"
echo "==========================================="
echo ""

# Step 1: Check system dependencies
print_status "Checking system dependencies..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if version_ge "$NODE_VERSION" "$MIN_NODE_VERSION"; then
        print_success "Node.js $NODE_VERSION installed (required: >=$MIN_NODE_VERSION)"
    else
        print_error "Node.js version $NODE_VERSION is too old (required: >=$MIN_NODE_VERSION)"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js >=$MIN_NODE_VERSION"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    if version_ge "$NPM_VERSION" "$MIN_NPM_VERSION"; then
        print_success "npm $NPM_VERSION installed (required: >=$MIN_NPM_VERSION)"
    else
        print_warning "npm version $NPM_VERSION is old (recommended: >=$MIN_NPM_VERSION)"
    fi
else
    print_error "npm is not installed"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    if version_ge "$DOCKER_VERSION" "$MIN_DOCKER_VERSION"; then
        print_success "Docker $DOCKER_VERSION installed (required: >=$MIN_DOCKER_VERSION)"
    else
        print_warning "Docker version $DOCKER_VERSION is old (recommended: >=$MIN_DOCKER_VERSION)"
    fi
else
    print_warning "Docker is not installed (optional but recommended)"
fi

# Check Docker Compose
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    print_success "Docker Compose is available"
else
    print_warning "Docker Compose is not available (optional but recommended)"
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    print_success "Git $GIT_VERSION installed"
else
    print_error "Git is not installed"
    exit 1
fi

echo ""

# Step 2: Install dependencies
print_status "Installing project dependencies..."

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install workspace dependencies
print_status "Installing workspace dependencies..."
npm run install:all

print_success "Dependencies installed successfully"
echo ""

# Step 3: Set up environment files
print_status "Setting up environment configuration..."

if [ ! -f .env ]; then
    print_status "Creating .env from .env.development template..."
    cp .env.development .env
    print_success ".env file created"
    print_warning "Please review and update .env file with your configuration"
else
    print_success ".env file already exists"
fi

echo ""

# Step 4: Set up Git hooks
print_status "Setting up Git hooks with Husky..."
npx husky install
print_success "Git hooks configured"

echo ""

# Step 5: Docker setup (optional)
if command_exists docker && (command_exists docker-compose || docker compose version >/dev/null 2>&1); then
    read -p "Do you want to start Docker services? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Starting Docker services..."

        if command_exists docker-compose; then
            docker-compose -f docker-compose.dev.yml up -d
        else
            docker compose -f docker-compose.dev.yml up -d
        fi

        print_status "Waiting for services to be healthy..."
        sleep 10

        # Check service health
        print_status "Checking service health..."

        if command_exists docker-compose; then
            docker-compose -f docker-compose.dev.yml ps
        else
            docker compose -f docker-compose.dev.yml ps
        fi

        print_success "Docker services started"
        echo ""
        print_status "Services available at:"
        echo "  - Frontend:     http://localhost:4200"
        echo "  - Backend API:  http://localhost:3001"
        echo "  - Swagger:      http://localhost:3001/api/docs"
        echo "  - phpMyAdmin:   http://localhost:8080"
        echo "  - Redis UI:     http://localhost:8081"
        echo "  - Mailhog:      http://localhost:8025"
    fi
fi

echo ""

# Step 6: Summary
echo "==========================================="
echo "  Setup Complete!"
echo "==========================================="
echo ""
print_success "Development environment is ready!"
echo ""
print_status "Next steps:"
echo "  1. Review and update .env file"
echo "  2. Start development:"
echo "     - Using Docker:  make dev (or docker-compose -f docker-compose.dev.yml up)"
echo "     - Without Docker: npm run dev"
echo "  3. Read DEVELOPER_ONBOARDING.md for detailed guide"
echo ""
print_status "Useful commands:"
echo "  - make help          : Show all available commands"
echo "  - make dev           : Start development environment"
echo "  - make test          : Run all tests"
echo "  - make lint          : Run linters"
echo "  - make format        : Format code"
echo ""
print_success "Happy coding!"
echo ""

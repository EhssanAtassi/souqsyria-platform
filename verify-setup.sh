#!/bin/bash

# ==========================================
# Setup Verification Script
# ==========================================
# Verifies that all DX optimizations are properly configured
# ==========================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SUCCESS=0
WARNINGS=0
ERRORS=0

check_file() {
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $description - Missing: $file"
        ((ERRORS++))
    fi
}

check_dir() {
    local dir=$1
    local description=$2

    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠${NC} $description - Missing: $dir"
        ((WARNINGS++))
    fi
}

check_executable() {
    local file=$1
    local description=$2

    if [ -f "$file" ] && [ -x "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((SUCCESS++))
    else
        echo -e "${YELLOW}⚠${NC} $description - Not executable: $file"
        ((WARNINGS++))
    fi
}

echo ""
echo "=========================================="
echo "  Developer Experience Setup Verification"
echo "=========================================="
echo ""

# Core Files
echo -e "${BLUE}Core Configuration:${NC}"
check_file "package.json" "Root package.json"
check_file ".env.development" "Environment template"
check_file "Makefile" "Makefile for development commands"
check_file "dev-setup.sh" "Automated setup script"
check_executable "dev-setup.sh" "Setup script is executable"
echo ""

# Docker Configuration
echo -e "${BLUE}Docker Configuration:${NC}"
check_file "docker-compose.dev.yml" "Development Docker Compose"
check_file "apps/backend/Dockerfile.dev" "Backend dev Dockerfile"
check_file "apps/frontend/Dockerfile.dev" "Frontend dev Dockerfile"
echo ""

# Git Hooks
echo -e "${BLUE}Git Hooks (Husky):${NC}"
check_dir ".husky" "Husky directory"
check_file ".husky/pre-commit" "Pre-commit hook"
check_file ".husky/commit-msg" "Commit message hook"
check_file ".husky/pre-push" "Pre-push hook"
check_executable ".husky/pre-commit" "Pre-commit hook is executable"
check_executable ".husky/commit-msg" "Commit-msg hook is executable"
check_executable ".husky/pre-push" "Pre-push hook is executable"
echo ""

# Code Quality
echo -e "${BLUE}Code Quality Configuration:${NC}"
check_file ".prettierrc.json" "Prettier configuration"
check_file ".prettierignore" "Prettier ignore file"
check_file ".lintstagedrc.json" "Lint-staged configuration"
check_file "commitlint.config.js" "Commitlint configuration"
echo ""

# VS Code Configuration
echo -e "${BLUE}VS Code Configuration:${NC}"
check_dir ".vscode" "VS Code directory"
check_file ".vscode/settings.json" "VS Code settings"
check_file ".vscode/extensions.json" "Recommended extensions"
check_file ".vscode/launch.json" "Debug configurations"
check_file ".vscode/tasks.json" "Task automation"
echo ""

# CI/CD
echo -e "${BLUE}CI/CD Configuration:${NC}"
check_dir ".github/workflows" "GitHub workflows directory"
check_file ".github/workflows/ci.yml" "CI pipeline"
echo ""

# Documentation
echo -e "${BLUE}Documentation:${NC}"
check_file "DEVELOPER_ONBOARDING.md" "Developer onboarding guide"
check_file "DX_OPTIMIZATION_SUMMARY.md" "DX optimization summary"
check_file "QUICK_REFERENCE.md" "Quick reference card"
check_file "README.md" "Project README"
echo ""

# Logging Configuration
echo -e "${BLUE}Enhanced Logging:${NC}"
check_file "apps/backend/src/config/logging.config.ts" "Backend logging config"
check_file "apps/backend/.env.development" "Backend env template"
echo ""

# Summary
echo "=========================================="
echo -e "  ${GREEN}Successes: $SUCCESS${NC}"
if [ $WARNINGS -gt 0 ]; then
    echo -e "  ${YELLOW}Warnings:  $WARNINGS${NC}"
fi
if [ $ERRORS -gt 0 ]; then
    echo -e "  ${RED}Errors:    $ERRORS${NC}"
fi
echo "=========================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Setup verification complete! All critical files present.${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Some optional components are missing but setup is functional.${NC}"
    fi

    echo ""
    echo "Next steps:"
    echo "  1. Run: npm install"
    echo "  2. Run: make dev"
    echo "  3. Open: http://localhost:4200"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Setup verification failed. Please run ./dev-setup.sh${NC}"
    exit 1
fi
